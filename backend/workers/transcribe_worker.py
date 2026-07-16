"""
Transcription Worker.
Called by QStash to process ASR jobs.

Pipeline:
1. Download video from R2
2. Extract audio with FFmpeg
3. Send audio to Groq Whisper
4. Save transcript to Supabase
5. Update job status
"""

import os
import tempfile

from fastapi import APIRouter, Request

from db.supabase_client import (
    get_project, update_job, update_project_status,
    save_transcript, update_project_duration,
)
from services.storage_service import download_file
from services.ffmpeg_service import extract_audio, get_video_duration
from services.asr_service import transcribe_audio, detect_language

router = APIRouter()


@router.post("/workers/transcribe")
async def process_transcription(request: Request):
    """
    Background worker endpoint for transcription.
    Called by QStash with the job payload.
    """
    body = await request.json()
    project_id = body["project_id"]
    job_id = body["job_id"]
    source_language = body.get("source_language")

    try:
        # Update job to processing
        update_job(job_id, "processing", progress=10)

        # Get project details
        project = get_project(project_id)
        video_key = project["video_url"]

        # Create temp directory for processing
        with tempfile.TemporaryDirectory() as tmp_dir:
            # Step 1: Download video from R2
            video_path = os.path.join(tmp_dir, "video.mp4")
            download_file(video_key, video_path)
            update_job(job_id, "processing", progress=25)

            # Step 2: Get video duration
            try:
                duration = get_video_duration(video_path)
                update_project_duration(project_id, duration)
            except Exception as e:
                print(f"Warning: Could not get video duration: {e}")

            # Step 3: Extract audio
            audio_path = os.path.join(tmp_dir, "audio.wav")
            extract_audio(video_path, audio_path)
            update_job(job_id, "processing", progress=45)

            # Step 4: Detect language if not specified
            if not source_language:
                source_language = detect_language(audio_path)
            update_job(job_id, "processing", progress=55)

            # Step 5: Transcribe audio
            segments = transcribe_audio(audio_path, language=source_language)
            update_job(job_id, "processing", progress=85)

            # Step 6: Save transcript to database
            save_transcript(
                project_id=project_id,
                language=source_language,
                segments=segments,
                source="asr",
            )

        # Step 7: Update job and project status
        update_job(job_id, "done", progress=100)
        update_project_status(project_id, "ready")

        return {"status": "success", "segments_count": len(segments)}

    except Exception as e:
        # Mark job as failed
        update_job(job_id, "failed", error=str(e))
        update_project_status(project_id, "failed")
        print(f"Transcription error: {e}")
        return {"status": "error", "error": str(e)}
