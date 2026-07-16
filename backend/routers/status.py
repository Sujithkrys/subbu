"""
Status Router.
Returns job statuses and project progress.
"""

import os

from fastapi import APIRouter, Header, HTTPException
from supabase import create_client

from db.supabase_client import (
    get_project, get_jobs_for_project, get_transcripts, get_exports,
)
from models.schemas import ProjectStatusResponse

router = APIRouter()


def _extract_user_id(authorization: str) -> str:
    token = authorization.replace("Bearer ", "")
    sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))
    try:
        user = sb.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.get("/{project_id}/status")
async def get_project_status(
    project_id: str,
    authorization: str = Header(...),
):
    """
    Get the current status of a project and all its jobs.
    Used for polling to show live progress.
    """
    user_id = _extract_user_id(authorization)
    project = get_project(project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    jobs = get_jobs_for_project(project_id)
    transcripts = get_transcripts(project_id)
    exports = get_exports(project_id)

    return {
        "project_id": project_id,
        "project_status": project["status"],
        "jobs": jobs,
        "transcripts": transcripts,
        "exports": exports,
    }
