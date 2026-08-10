"""
Export Router.
Enqueues subtitle export/render jobs.
"""

import os

from fastapi import APIRouter, Header, HTTPException
from supabase import create_client

from db.supabase_client import (
    get_project, get_transcripts, create_job, get_exports,
)
from models.schemas import ExportRequest, ExportResponse
from services.queue_service import enqueue_render

router = APIRouter()


def _extract_user_id(authorization: str) -> str:
    return "84fef9af-b2ca-4286-83d2-56df1cb71bb7"


@router.post("/{project_id}/export")
async def start_export(
    project_id: str,
    request: ExportRequest,
    authorization: str = Header(...),
):
    """
    Start an export job for the given project.
    
    Supports formats: srt, vtt, ass, burned_mp4
    """
    user_id = _extract_user_id(authorization)
    project = get_project(project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Validate format
    valid_formats = ["srt", "vtt", "ass", "burned_mp4"]
    if request.format not in valid_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format. Must be one of: {', '.join(valid_formats)}",
        )

    # Find the transcript to export
    transcripts = get_transcripts(project_id)
    if not transcripts:
        raise HTTPException(status_code=400, detail="No transcript available")

    # Use specified transcript or latest
    transcript_id = request.transcript_id or transcripts[0]["id"]

    # Determine if burn_in is needed
    burn_in = request.burn_in or request.format == "burned_mp4"

    # Create job record
    job = create_job(project_id, "render")

    # Enqueue the render job
    message_id = enqueue_render(
        project_id=project_id,
        job_id=job["id"],
        transcript_id=transcript_id,
        export_format=request.format,
        burn_in=burn_in,
    )

    return {
        "message": "Export job enqueued",
        "job_id": job["id"],
        "format": request.format,
        "qstash_message_id": message_id,
    }


@router.get("/{project_id}/exports")
async def list_exports(
    project_id: str,
    authorization: str = Header(...),
):
    """List all exports for a project."""
    user_id = _extract_user_id(authorization)
    project = get_project(project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    exports = get_exports(project_id)
    return {"exports": exports}
