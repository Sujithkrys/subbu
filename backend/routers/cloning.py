import os
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
import httpx
import asyncio

from services.auth_service import get_current_user
from db.supabase_client import get_supabase
from services.storage_service import generate_presigned_url, upload_file_to_r2

router = APIRouter(prefix="/projects", tags=["cloning"])

class CloneStartRequest(BaseModel):
    consent_given: bool

# We'll use this sample audio url as a fallback mock if the API key is missing
MOCK_AUDIO_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"

@router.post("/{project_id}/voice-sample")
async def upload_voice_sample(project_id: str, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload a voice sample and save it to the user's settings."""
    try:
        content = await file.read()
        file_ext = file.filename.split('.')[-1] if file.filename and '.' in file.filename else 'webm'
        object_name = f"voice_samples/{user['id']}/{uuid.uuid4()}.{file_ext}"
        
        # Upload to R2
        upload_file_to_r2(content, object_name, file.content_type or "audio/webm")
        
        # We need a public or presigned URL to access it later. For now we just store the key or a generated presigned url.
        url = f"{os.getenv('R2_ENDPOINT')}/{os.getenv('R2_BUCKET_NAME')}/{object_name}"
        
        # Update user settings
        sb = get_supabase()
        sb.table("user_settings").update({"voice_sample_url": url}).eq("user_id", user["id"]).execute()
        
        return {"status": "success", "url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{project_id}/clone/{lang}")
async def start_voice_clone(project_id: str, lang: string, req: CloneStartRequest, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
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
            "status": "cloning",
            "consent_given_at": "now()"
        }).eq("id", clone_id).execute()
    else:
        new_clone = sb.table("voice_clones").insert({
            "project_id": project_id,
            "language": lang,
            "status": "cloning",
            "consent_given_at": "now()"
        }).execute()
        clone_id = new_clone.data[0]["id"]
        
    # Start background task to process
    background_tasks.add_task(process_voice_clone, clone_id, project_id, lang, user["id"])
    
    return {"status": "cloning", "clone_id": clone_id}


async def process_voice_clone(clone_id: str, project_id: str, lang: str, user_id: str):
    """Background task to interact with Sarvam API"""
    sb = get_supabase()
    api_key = os.getenv("SARVAM_API_KEY", "")
    
    LANG_MAP = {
        "hi": "hi-IN", "te": "te-IN", "ta": "ta-IN", "ml": "ml-IN", 
        "kn": "kn-IN", "bn": "bn-IN", "mr": "mr-IN", "gu": "gu-IN", 
        "pa": "pa-IN", "en": "en-IN", "hinglish": "hi-IN", 
        "tinglish": "te-IN", "tanglish": "ta-IN", "benglish": "bn-IN"
    }
    
    try:
        import base64
        import uuid
        from sarvamai import SarvamAI
        from services.storage_service import upload_file_to_r2
        
        if not api_key or api_key == "your_sarvam_api_key_here":
            raise Exception("SARVAM_API_KEY is not set or is using the default placeholder.")
            
        transcript_res = sb.table("transcripts").select("segments").eq("project_id", project_id).eq("language", lang).execute()
        if not transcript_res.data:
            transcript_res = sb.table("transcripts").select("segments").eq("project_id", project_id).order("created_at", desc=False).execute()
            if not transcript_res.data:
                raise Exception("No transcripts found for this project to clone.")
                
        segments = transcript_res.data[0].get("segments", [])
        if not segments:
            raise Exception("Transcript has no segments.")
            
        full_text = " ".join([s.get("text", "") for s in segments])
        if len(full_text) > 2400:
            full_text = full_text[:2400] + "..." # Truncate due to TTS length limits
            
        sarvam_lang = LANG_MAP.get(lang, "hi-IN")
        client = SarvamAI(api_subscription_key=api_key)
        
        response = client.text_to_speech.convert(
            text=full_text,
            target_language_code=sarvam_lang,
            speaker="meera", # Fallback default standard speaker if voice cloning isn't explicitly configured in SDK
            model="bulbul:v3",
            pace=1.0
        )
        
        audio_data = base64.b64decode(response.audios[0])
        object_name = f"clones/{project_id}/{lang}_{uuid.uuid4()}.wav"
        upload_file_to_r2(audio_data, object_name, "audio/wav")
        
        url = f"{os.getenv('R2_ENDPOINT')}/{os.getenv('R2_BUCKET_NAME')}/{object_name}"
        sb.table("voice_clones").update({
            "status": "ready",
            "ready_audio_url": url,
            "sarvam_voice_id": "bulbul_v3"
        }).eq("id", clone_id).execute()

    except Exception as e:
        print(f"Cloning failed: {e}")
        sb.table("voice_clones").update({
            "status": "failed"
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
