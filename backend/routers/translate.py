"""
Translation Router.
Enqueues translation jobs for subtitle text.
"""

import os

from fastapi import APIRouter, Header, HTTPException
from supabase import create_client

from db.supabase_client import (
    get_project, get_transcripts, create_job, update_project_status,
)
from models.schemas import TranslateRequest
from services.queue_service import enqueue_translate

router = APIRouter()


def _extract_user_id(authorization: str) -> str:
    token = authorization.replace("Bearer ", "")
    sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))
    try:
        user = sb.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/{project_id}/translate")
async def start_translation(
    project_id: str,
    request: TranslateRequest,
    authorization: str = Header(...),
):
    """
    Start a translation job for the given project.
    
    1. Verify user owns the project
    2. Find the ASR transcript to translate
    3. Create a job record
    4. Update project status
    5. Enqueue the translation job
    """
    user_id = _extract_user_id(authorization)
    project = get_project(project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Find the source transcript
    transcripts = get_transcripts(project_id)
    if not transcripts:
        raise HTTPException(status_code=400, detail="No transcript available. Run transcription first.")

    # Use the first ASR transcript as source, or specified source
    source_transcript = None
    for t in transcripts:
        if t["source"] == "asr":
            source_transcript = t
            break
    if not source_transcript:
        source_transcript = transcripts[0]

    source_language = request.source_language or source_transcript["language"]

    # Create job record
    job = create_job(project_id, "translate")

    # Update project status
    update_project_status(project_id, "translating")

    # Enqueue the translation job
    message_id = enqueue_translate(
        project_id=project_id,
        job_id=job["id"],
        transcript_id=source_transcript["id"],
        source_language=source_language,
        target_language=request.target_language,
    )

    return {
        "message": "Translation job enqueued",
        "job_id": job["id"],
        "source_language": source_language,
        "target_language": request.target_language,
        "qstash_message_id": message_id,
    }
