"""
Projects Router.
Handles project CRUD and presigned URL generation for video upload.
"""

import uuid

from fastapi import APIRouter, Header, HTTPException

from db.supabase_client import (
    create_project, get_project, list_projects, get_transcripts, get_exports, get_style,
)
from models.schemas import (
    CreateProjectRequest, CreateProjectResponse,
    ProjectResponse, ProjectListResponse,
)
from services.storage_service import generate_upload_url, generate_download_url

router = APIRouter()


def _get_user_id(authorization: str = Header(...)) -> str:
    """Extract user ID from the Authorization header (Supabase JWT)."""
    # In production, decode the JWT to get the user ID
    # For now, we expect the frontend to pass the user ID directly
    # Format: "Bearer <supabase_access_token>"
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return authorization  # Will be properly decoded with JWT verification


def _extract_user_id_from_token(authorization: str) -> str:
    """
    Extract user_id from Supabase JWT token.
    In production, verify and decode the JWT. For development,
    we'll use the Supabase client to verify.
    """
    import os
    from supabase import create_client
    
    token = authorization.replace("Bearer ", "")
    sb = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_ANON_KEY"),
    )
    try:
        user = sb.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("", response_model=CreateProjectResponse)
async def create_new_project(
    request: CreateProjectRequest,
    authorization: str = Header(...),
):
    """
    Create a new project and return a presigned URL for video upload.
    
    Flow:
    1. Verify user token
    2. Generate a unique video key for R2
    3. Create project record in Supabase
    4. Generate presigned PUT URL for R2
    5. Return project ID + upload URL
    """
    user_id = _extract_user_id_from_token(authorization)

    # Generate unique video key
    video_key = f"videos/{user_id}/{uuid.uuid4()}.mp4"

    # Create project in database
    project = create_project(
        user_id=user_id,
        title=request.title,
        video_url=video_key,
    )

    # Generate presigned upload URL
    upload_url = generate_upload_url(
        key=video_key,
        content_type="video/mp4",
        expires_in=3600,
    )

    return CreateProjectResponse(
        id=project["id"],
        title=project["title"],
        upload_url=upload_url,
        video_key=video_key,
    )


@router.get("", response_model=ProjectListResponse)
async def list_user_projects(authorization: str = Header(...)):
    """List all projects for the authenticated user."""
    user_id = _extract_user_id_from_token(authorization)
    projects = list_projects(user_id)
    return ProjectListResponse(projects=projects)


@router.get("/{project_id}")
async def get_project_details(
    project_id: str,
    authorization: str = Header(...),
):
    """
    Get full project details including transcripts, styles, and exports.
    """
    user_id = _extract_user_id_from_token(authorization)
    project = get_project(project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch related data
    transcripts = get_transcripts(project_id)
    exports = get_exports(project_id)
    style = get_style(project_id)

    # Generate download URL for the video
    video_download_url = None
    if project.get("video_url"):
        video_download_url = generate_download_url(project["video_url"])

    return {
        **project,
        "video_download_url": video_download_url,
        "transcripts": transcripts,
        "exports": exports,
        "style": style,
    }
