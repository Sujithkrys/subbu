"""
Style Router.
Save and retrieve subtitle styling preferences.
"""

import os

from fastapi import APIRouter, Header, HTTPException
from supabase import create_client

from db.supabase_client import get_project, save_style, get_style
from models.schemas import StyleRequest, StyleResponse

router = APIRouter()


def _extract_user_id(authorization: str) -> str:
    token = authorization.replace("Bearer ", "")
    sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))
    try:
        user = sb.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/{project_id}/style", response_model=StyleResponse)
async def save_subtitle_style(
    project_id: str,
    request: StyleRequest,
    authorization: str = Header(...),
):
    """Save subtitle style preferences for a project."""
    user_id = _extract_user_id(authorization)
    project = get_project(project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    style = save_style(
        project_id=project_id,
        font=request.font,
        color=request.color,
        position=request.position,
        animation_type=request.animation_type,
    )

    return style


@router.get("/{project_id}/style")
async def get_subtitle_style(
    project_id: str,
    authorization: str = Header(...),
):
    """Get the current subtitle style for a project."""
    user_id = _extract_user_id(authorization)
    project = get_project(project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    style = get_style(project_id)
    if not style:
        return {"message": "No style set", "style": None}

    return style
