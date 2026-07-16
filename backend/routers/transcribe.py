"""
Transcription Router.
Enqueues ASR (speech-to-text) jobs.
"""

import os

from fastapi import APIRouter, Header, HTTPException
from supabase import create_client

from db.supabase_client import get_project, create_job, update_project_status
from models.schemas import TranscribeRequest
from services.queue_service import enqueue_transcribe

router = APIRouter()


def _extract_user_id(authorization: str) -> str:
    """Extract user_id from Supabase JWT token."""
    token = authorization.replace("Bearer ", "")
    sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))
    try:
        user = sb.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/{project_id}/transcribe")
async def start_transcription(
    project_id: str,
    request: TranscribeRequest = TranscribeRequest(),
    authorization: str = Header(...),
):
    """
    Start a transcription job for the given project.
    
    1. Verify user owns the project
    2. Create a job record
    3. Update project status to 'transcribing'
    4. Enqueue the job via QStash
    """
    user_id = _extract_user_id(authorization)
    project = get_project(project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Create job record
    job = create_job(project_id, "transcribe")

    # Update project status
    update_project_status(project_id, "transcribing")

    # Enqueue the transcription job
    message_id = enqueue_transcribe(
        project_id=project_id,
        job_id=job["id"],
        source_language=request.source_language,
    )

    return {
        "message": "Transcription job enqueued",
        "job_id": job["id"],
        "qstash_message_id": message_id,
    }
