import os
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
import httpx
import asyncio

from services.auth_service import get_current_user
from db.supabase_client import get_supabase
from services.storage_service import generate_upload_url

router = APIRouter(tags=["cloning"])

class CloneStartRequest(BaseModel):
    consent_given: bool
    speaker: Optional[str] = None
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
    
    import datetime
    if clone_res.data:
        clone_id = clone_res.data[0]["id"]
        sb.table("voice_clones").update({
            "status": "cloning",
            "consent_given_at": datetime.datetime.utcnow().isoformat()
        }).eq("id", clone_id).execute()
    else:
        new_clone = sb.table("voice_clones").insert({
            "project_id": project_id,
            "language": lang,
            "status": "cloning",
            "consent_given_at": datetime.datetime.utcnow().isoformat()
        }).execute()
        clone_id = new_clone.data[0]["id"]
        
    # Start background task to process
    background_tasks.add_task(process_voice_clone, clone_id, project_id, lang, user["id"], req.speaker)
    
    return {"status": "cloning", "clone_id": clone_id}


async def process_voice_clone(clone_id: str, project_id: str, lang: str, user_id: str, speaker: str = None):
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
        
        from services.sarvam_service import generate_dubbed_segment, DEFAULT_SPEAKER
        from services.storage_service import upload_file, generate_download_url
        from services import elevenlabs_service
        
        # 1. Fetch project video URL
        project_res = sb.table("projects").select("video_url").eq("id", project_id).execute()
        if not project_res.data or not project_res.data[0].get("video_url"):
            raise Exception("Project video not found.")
            
        video_key = project_res.data[0]["video_url"]
        video_url = generate_download_url(video_key)
        
        # 2. Download video
        import subprocess
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        
        async with httpx.AsyncClient(timeout=300) as client:
            resp = await client.get(video_url)
            resp.raise_for_status()
            video_bytes = resp.content
            
        temp_dir = f"/tmp/{uuid.uuid4()}"
        os.makedirs(temp_dir, exist_ok=True)
        
        orig_video_path = f"{temp_dir}/orig.mp4"
        with open(orig_video_path, "wb") as f:
            f.write(video_bytes)
        
        # 3. Ensure transcript exists for this language
        transcript_res = sb.table("transcripts").select("segments").eq("project_id", project_id).eq("language", lang).execute()
        if transcript_res.data:
            segments = transcript_res.data[0].get("segments", [])
        else:
            # We don't have the target language transcript. Let's see if we have ANY transcript.
            any_res = sb.table("transcripts").select("id, language, segments").eq("project_id", project_id).order("created_at", desc=False).execute()
            
            base_segments = []
            if any_res.data:
                base_segments = any_res.data[0].get("segments", [])
            else:
                # No transcripts at all! We must transcribe the video from scratch.
                from services.asr_service import transcribe_audio
                full_audio_path = f"{temp_dir}/full_audio.wav"
                subprocess.run([
                    ffmpeg_exe, "-y", "-i", orig_video_path,
                    "-vn", "-ar", "16000", "-ac", "1", "-acodec", "pcm_s16le",
                    full_audio_path
                ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
                base_segments = transcribe_audio(full_audio_path, word_timestamps=False)
                
                # Save base transcript
                sb.table("transcripts").insert({
                    "project_id": project_id,
                    "language": "en", # default assumption for auto-transcribe
                    "segments": base_segments,
                    "source": "groq-whisper"
                }).execute()
            
            # Now we have base_segments. Let's translate to the target language!
            from services.translation_service import translate_segments
            segments = await translate_segments(base_segments, "en", lang)
            
            # Save the newly translated transcript
            sb.table("transcripts").insert({
                "project_id": project_id,
                "language": lang,
                "segments": segments,
                "source": "gemini-translate"
            }).execute()

        if not segments:
            raise Exception("Transcript has no segments.")
        
        # 4. Extract snippet from original video for cloning
        snippet_path = f"{temp_dir}/snippet.wav"
        cloned_voice_id = None
        try:
            subprocess.run([
                ffmpeg_exe, "-y", "-i", orig_video_path,
                "-t", "15", "-ac", "1", "-ar", "22050", snippet_path
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            cloned_voice_id = elevenlabs_service.clone_voice(f"Clone_{project_id[:8]}", "User Voice Clone", snippet_path)
            print(f"ElevenLabs cloned voice ID: {cloned_voice_id}")
        except Exception as e:
            print(f"ElevenLabs clone or extraction failed: {e}")
            # Fallback to Sarvam if ElevenLabs fails (e.g., no API key or ffmpeg error)
            cloned_voice_id = None
        
        last_segment_end = max([s.get("end", 0.0) for s in segments])
        total_duration_ms = int((last_segment_end + 5.0) * 1000)
        
        final_audio = AudioSegment.silent(duration=total_duration_ms)
        
        sarvam_lang = LANG_MAP.get(lang, "hi-IN")
        fallback_speaker = speaker or DEFAULT_SPEAKER
        
        last_end_ms = 0
        
        for seg in segments:
            text = seg.get("text", "").strip()
            if not text: continue
                
            start_ms = int(seg.get("start", 0.0) * 1000)
            
            # Prevent overlapping audio tracks if TTS generates audio longer than the segment gap
            if start_ms < last_end_ms:
                start_ms = last_end_ms + 50 # Add a tiny 50ms gap
            
            try:
                if cloned_voice_id:
                    try:
                        audio_bytes = elevenlabs_service.generate_dubbed_segment(text, cloned_voice_id)
                        seg_audio = AudioSegment.from_file(BytesIO(audio_bytes), format="mp3")
                    except Exception as e:
                        print(f"ElevenLabs segment generation failed ({e}), falling back to Sarvam.")
                        audio_bytes = generate_dubbed_segment(text, sarvam_lang, fallback_speaker)
                        seg_audio = AudioSegment.from_file(BytesIO(audio_bytes), format="wav")
                else:
                    audio_bytes = generate_dubbed_segment(text, sarvam_lang, fallback_speaker)
                    seg_audio = AudioSegment.from_file(BytesIO(audio_bytes), format="wav")
                    
                final_audio = final_audio.overlay(seg_audio, position=start_ms)
                last_end_ms = start_ms + len(seg_audio)
            except Exception as e:
                print(f"Failed to generate dub for segment: {e}")
                raise Exception(f"Audio generation completely failed: {e}")
                
        dubbed_audio_path = f"{temp_dir}/dubbed.wav"
        final_audio.export(dubbed_audio_path, format="wav")
        
        # 5. Mux the dubbed audio back into the video, replacing original audio
        dubbed_video_path = f"{temp_dir}/dubbed.mp4"
        subprocess.run([
            ffmpeg_exe, "-y", 
            "-i", orig_video_path, 
            "-i", dubbed_audio_path,
            "-c:v", "copy", 
            "-c:a", "aac", 
            "-map", "0:v:0", 
            "-map", "1:a:0", 
            "-shortest", 
            dubbed_video_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # 6. Upload final video to R2
        r2_key = f"dubbed/{user_id}/{project_id}/dubbed_{lang}_{uuid.uuid4().hex[:8]}.mp4"
        upload_file(r2_key, dubbed_video_path, "video/mp4")
        
        # Clean up temp files
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        # 7. Update database
        sb.table("voice_clones").update({
            "status": "ready",
            "ready_audio_url": r2_key, 
            "dubbed_video_url": r2_key
        }).eq("id", clone_id).execute()
        
    except Exception as e:
        print(f"Clone process failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sb = get_supabase()
        sb.table("voice_clones").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("id", clone_id).execute()


@router.get("/{project_id}/clone/{lang}/status")
async def get_voice_clone_status(project_id: str, lang: str, user: dict = Depends(get_current_user)):
    from services.storage_service import generate_download_url
    sb = get_supabase()
    res = sb.table("voice_clones").select("*").eq("project_id", project_id).eq("language", lang).execute()
    if not res.data:
        return {"status": "not_started"}
    clone = res.data[0]
    if clone.get("dubbed_video_url"):
        clone["dubbed_video_url"] = generate_download_url(clone["dubbed_video_url"])
    if clone.get("ready_audio_url"):
        clone["ready_audio_url"] = generate_download_url(clone["ready_audio_url"])
    return clone

@router.get("/{project_id}/clones")
async def get_voice_clones(project_id: str, user: dict = Depends(get_current_user)):
    from services.storage_service import generate_download_url
    sb = get_supabase()
    res = sb.table("voice_clones").select("*").eq("project_id", project_id).execute()
    clones = res.data
    for clone in clones:
        if clone.get("dubbed_video_url"):
            clone["dubbed_video_url"] = generate_download_url(clone["dubbed_video_url"])
        if clone.get("ready_audio_url"):
            clone["ready_audio_url"] = generate_download_url(clone["ready_audio_url"])
    return clones
