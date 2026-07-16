"""
Translation Worker.
Called by QStash to process translation jobs.

Pipeline:
1. Fetch source transcript from Supabase
2. Translate each segment via Gemini API
3. Save translated transcript
4. Update job status
"""

import asyncio

from fastapi import APIRouter, Request

from db.supabase_client import (
    get_project, get_transcript, update_job,
    update_project_status, save_transcript, increment_usage,
)
from services.translation_service import translate_segments

router = APIRouter()


@router.post("/workers/translate")
async def process_translation(request: Request):
    """
    Background worker endpoint for translation.
    Called by QStash with the job payload.
    """
    body = await request.json()
    project_id = body["project_id"]
    job_id = body["job_id"]
    transcript_id = body["transcript_id"]
    source_language = body["source_language"]
    target_language = body["target_language"]

    try:
        # Update job to processing
        update_job(job_id, "processing", progress=10)

        # Step 1: Fetch the source transcript
        transcript = get_transcript(transcript_id)
        segments = transcript["segments"]
        update_job(job_id, "processing", progress=20)

        # Step 2: Translate all segments
        translated_segments = await translate_segments(
            segments=segments,
            source_lang=source_language,
            target_lang=target_language,
        )
        update_job(job_id, "processing", progress=80)

        # Step 3: Save translated transcript
        save_transcript(
            project_id=project_id,
            language=target_language,
            segments=translated_segments,
            source="translated",
        )

        # Step 4: Update job and project status
        update_job(job_id, "done", progress=100)
        update_project_status(project_id, "ready")

        # Step 4.5: Increment usage limits
        try:
            char_count = sum(len(seg.get("text", "")) for seg in segments)
            project = get_project(project_id)
            increment_usage(project["user_id"], translation_characters=char_count)
        except Exception as e:
            print(f"Warning: Failed to increment translation usage: {e}")

        return {
            "status": "success",
            "translated_segments": len(translated_segments),
        }

    except Exception as e:
        update_job(job_id, "failed", error=str(e))
        update_project_status(project_id, "failed")
        print(f"Translation error: {e}")
        return {"status": "error", "error": str(e)}
