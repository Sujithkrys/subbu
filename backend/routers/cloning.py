import os
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
import httpx
import asyncio

from services.auth_service import get_current_user
from db.supabase_client import get_supabase
from services.storage_service import generate_upload_url

router = APIRouter(prefix="/projects", tags=["cloning"])

class CloneStartRequest(BaseModel):
    voice_sample_id: str
    consent_given: bool
@router.post("/{project_id}/clone/{lang}")
async def start_voice_clone(project_id: str, lang: str, req: CloneStartRequest, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """Start the voice cloning process."""
    if not req.consent_given:
        raise HTTPException(status_code=400, detail="Consent is required to clone voice")
        
    sb = get_supabase()
    
    # Ensure project belongs to user
    res = sb.table("projects").select("id").eq("id", project_id).eq("user_id", user["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get or create clone record
    clone_res = sb.table("voice_clones").select("*").eq("project_id", project_id).eq("language", lang).execute()
    
    if clone_res.data:
        clone_id = clone_res.data[0]["id"]
        sb.table("voice_clones").update({
            "voice_sample_id": req.voice_sample_id,
            "status": "cloning",
            "consent_given_at": "now()"
        }).eq("id", clone_id).execute()
    else:
        new_clone = sb.table("voice_clones").insert({
            "project_id": project_id,
            "voice_sample_id": req.voice_sample_id,
            "language": lang,
            "status": "cloning",
            "consent_given_at": "now()"
        }).execute()
        clone_id = new_clone.data[0]["id"]
        
    # Start background task to process
    background_tasks.add_task(process_voice_clone, clone_id, project_id, lang, user["id"], req.voice_sample_id)
    
    return {"status": "cloning", "clone_id": clone_id}


async def process_voice_clone(clone_id: str, project_id: str, lang: str, user_id: str, voice_sample_id: str):
    """Background task to interact with Sarvam API"""
    sb = get_supabase()
    
    LANG_MAP = {
        "hi": "hi-IN", "te": "te-IN", "ta": "ta-IN", "ml": "ml-IN", 
        "kn": "kn-IN", "bn": "bn-IN", "mr": "mr-IN", "gu": "gu-IN", 
        "pa": "pa-IN", "en": "en-IN", "hinglish": "hi-IN", 
        "tinglish": "te-IN", "tanglish": "ta-IN", "benglish": "bn-IN"
    }
    
    try:
        import uuid
        import httpx
        from io import BytesIO
        from pydub import AudioSegment
        import imageio_ffmpeg
        
        # Configure pydub to use the bundled ffmpeg binary
        AudioSegment.converter = imageio_ffmpeg.get_ffmpeg_exe()
        
        from services.sarvam_service import create_voice, generate_dubbed_segment
        from services.storage_service import upload_file_to_r2
        
        # 1. Fetch transcript segments
        transcript_res = sb.table("transcripts").select("segments").eq("project_id", project_id).eq("language", lang).execute()
        if not transcript_res.data:
            transcript_res = sb.table("transcripts").select("segments").eq("project_id", project_id).order("created_at", desc=False).execute()
            if not transcript_res.data:
                raise Exception("No transcripts found for this project to clone.")
                
        segments = transcript_res.data[0].get("segments", [])
        if not segments:
            raise Exception("Transcript has no segments.")
            
        # 2. Fetch voice sample URL
        sample_res = sb.table("voice_samples").select("storage_url").eq("id", voice_sample_id).execute()
        if not sample_res.data:
            raise Exception("Voice sample not found.")
            
        sample_url = sample_res.data[0]["storage_url"]
        
        # 3. Download sample and create voice
        async with httpx.AsyncClient() as client:
            resp = await client.get(sample_url)
            resp.raise_for_status()
            sample_bytes = resp.content
            
        # create_voice expects a file path or file-like object in some SDKs, but the prompt says 
        # `create_voice(file=sample_file, consent_given=True)`. We'll write it to a temp file.
        temp_sample_path = f"/tmp/{uuid.uuid4()}.wav"
        os.makedirs("/tmp", exist_ok=True)
        with open(temp_sample_path, "wb") as f:
            f.write(sample_bytes)
            
        # Get voice ID
        try:
            sarvam_voice_id = create_voice(temp_sample_path, consent_given=True)
        finally:
            if os.path.exists(temp_sample_path):
                os.remove(temp_sample_path)
        
        # 4. Generate audio per segment and stitch
        sarvam_lang = LANG_MAP.get(lang, "hi-IN")
        
        # Find total duration needed
        last_segment_end = max([s.get("end", 0.0) for s in segments])
        # Add 5 seconds buffer to the end
        total_duration_ms = int((last_segment_end + 5.0) * 1000)
        
        final_audio = AudioSegment.silent(duration=total_duration_ms)
        
        for seg in segments:
            text = seg.get("text", "").strip()
            if not text:
                continue
                
            start_ms = int(seg.get("start", 0.0) * 1000)
            
            # Generate audio bytes
            audio_bytes = generate_dubbed_segment(text, sarvam_lang, sarvam_voice_id)
            
            # Load into pydub
            seg_audio = AudioSegment.from_file(BytesIO(audio_bytes))
            
            # Overlay at the correct timestamp
            final_audio = final_audio.overlay(seg_audio, position=start_ms)
            
        # 5. Export stitched audio and upload
        out_buf = BytesIO()
        final_audio.export(out_buf, format="wav")
        out_buf.seek(0)
        
        object_name = f"clones/{project_id}/{lang}_{uuid.uuid4()}.wav"
        from services.storage_service import upload_fileobj
        upload_fileobj(object_name, out_buf, "audio/wav")
        url = f"{os.getenv('R2_ENDPOINT')}/{os.getenv('R2_BUCKET_NAME')}/{object_name}"
        
        sb.table("voice_clones").update({
            "status": "ready",
            "ready_audio_url": url,
            "sarvam_voice_id": sarvam_voice_id
        }).eq("id", clone_id).execute()

    except Exception as e:
        print(f"Cloning failed: {e}")
        sb.table("voice_clones").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("id", clone_id).execute()


@router.get("/{project_id}/clone/{lang}/status")
async def get_voice_clone_status(project_id: str, lang: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    res = sb.table("voice_clones").select("*").eq("project_id", project_id).eq("language", lang).execute()
    if not res.data:
        return {"status": "not_started"}
    return res.data[0]

@router.get("/{project_id}/clones")
async def get_voice_clones(project_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    res = sb.table("voice_clones").select("*").eq("project_id", project_id).execute()
    return res.data
