"""
Projects Router.
Handles project CRUD and presigned URL generation for video upload.
"""

import uuid

from fastapi import APIRouter, Header, HTTPException

from db.supabase_client import (
    create_project, get_project, list_projects, get_transcripts, get_exports, get_style,
    get_transcript, update_transcript, get_or_create_usage,
    log_activity, get_recent_activity, toggle_favorite, update_project_file_size, delete_project, save_style,
    get_user_settings, update_user_settings
)
from models.schemas import (
    CreateProjectRequest, CreateProjectResponse,
    ProjectResponse, ProjectListResponse,
    UserSettingsRequest, UserSettingsResponse
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


@router.put("/{project_id}/transcripts/{transcript_id}")
async def update_project_transcript(
    project_id: str,
    transcript_id: str,
    request: dict,
    authorization: str = Header(...),
):
    """
    Update a transcript's segments.
    """
    user_id = _extract_user_id_from_token(authorization)
    project = get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    transcript = get_transcript(transcript_id)
    if not transcript or transcript["project_id"] != project_id:
        raise HTTPException(status_code=404, detail="Transcript not found in this project")

    segments = request.get("segments")
    review_state = request.get("review_state")
    
    if segments is None and review_state is None:
        raise HTTPException(status_code=400, detail="segments or review_state parameter is required")

    updated = update_transcript(transcript_id, segments=segments, review_state=review_state)
    return updated


@router.get("/user/usage")
async def get_user_usage(authorization: str = Header(...)):
    """Fetch the authenticated user's monthly usage details and limits."""
    user_id = _extract_user_id_from_token(authorization)
    usage = get_or_create_usage(user_id)

    # Monthly limits constants
    TRANSCRIPTION_LIMIT_SECONDS = 1800  # 30 minutes
    TRANSLATION_LIMIT_CHARACTERS = 50000  # 50k chars

    return {
        "usage": usage,
        "limits": {
            "transcription_seconds": TRANSCRIPTION_LIMIT_SECONDS,
            "translation_characters": TRANSLATION_LIMIT_CHARACTERS
        }
    }


@router.get("/user/settings", response_model=UserSettingsResponse)
async def get_settings(authorization: str = Header(...)):
    """Fetch the authenticated user's settings (theme)."""
    user_id = _extract_user_id_from_token(authorization)
    settings = get_user_settings(user_id)
    return UserSettingsResponse(user_id=settings["user_id"], theme=settings.get("theme", "dark"))


@router.patch("/user/settings", response_model=UserSettingsResponse)
async def update_settings(
    request: UserSettingsRequest,
    authorization: str = Header(...),
):
    """Update the authenticated user's settings."""
    user_id = _extract_user_id_from_token(authorization)
    settings = update_user_settings(user_id, request.theme)
    return UserSettingsResponse(user_id=settings["user_id"], theme=settings.get("theme", "dark"))


@router.get("/dashboard/metrics")
async def get_dashboard_metrics(authorization: str = Header(...)):
    """Fetch aggregate metrics and recent activity for the dashboard."""
    user_id = _extract_user_id_from_token(authorization)
    
    # We can compute metrics on the fly by fetching all projects or we can do it via a DB view.
    # For now, fetch all projects to compute.
    projects = list_projects(user_id)
    
    total_videos = len(projects)
    total_minutes = sum([p.get("duration_seconds", 0) or 0 for p in projects]) / 60.0
    storage_bytes = sum([p.get("file_size_bytes", 0) or 0 for p in projects])
    
    # Extract distinct languages and top languages
    languages = []
    for p in projects:
        for t in p.get("transcripts", []):
            languages.append(t.get("language"))
            
    from collections import Counter
    lang_counts = Counter(languages)
    distinct_languages = len(lang_counts)
    
    top_languages = [{"language": lang, "count": count} for lang, count in lang_counts.most_common(5)]
    
    recent_activity = get_recent_activity(user_id, limit=10)
    
    return {
        "metrics": {
            "total_videos": total_videos,
            "total_minutes": total_minutes,
            "storage_bytes": storage_bytes,
            "distinct_languages": distinct_languages
        },
        "top_languages": top_languages,
        "recent_activity": recent_activity
    }


@router.post("/{project_id}/favorite")
async def favorite_project(
    project_id: str,
    request: dict,
    authorization: str = Header(...),
):
    """Toggle the favorite status of a project."""
    user_id = _extract_user_id_from_token(authorization)
    project = get_project(project_id)
    if not project or project["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
        
    is_favorite = request.get("is_favorite", False)
    toggle_favorite(project_id, is_favorite)
    log_activity(user_id, "project_favorited" if is_favorite else "project_unfavorited", project_id)
    return {"success": True, "is_favorite": is_favorite}


@router.delete("/{project_id}")
async def delete_project_endpoint(
    project_id: str,
    authorization: str = Header(...),
):
    """Delete a project and all associated data."""
    user_id = _extract_user_id_from_token(authorization)
    project = get_project(project_id)
    if not project or project["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
        
    delete_project(project_id)
    log_activity(user_id, "project_deleted", details={"title": project.get("title")})
    return {"success": True}


@router.post("/{project_id}/duplicate")
async def duplicate_project(
    project_id: str,
    authorization: str = Header(...),
):
    """Clone a project's settings into a new blank project."""
    user_id = _extract_user_id_from_token(authorization)
    project = get_project(project_id)
    if not project or project["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
        
    new_title = f"{project.get('title', 'Untitled')} (Copy)"
    video_key = f"videos/{user_id}/{uuid.uuid4()}.mp4"
    
    new_project = create_project(user_id, new_title, video_key)
    
    # Copy style if exists
    style = get_style(project_id)
    if style:
        save_style(
            project_id=new_project["id"],
            font=style.get("font"),
            color=style.get("color"),
            position=style.get("position"),
            animation_type=style.get("animation_type")
        )
        
    # Generate presigned URL for the new project
    upload_url = generate_upload_url(
        key=video_key,
        content_type="video/mp4",
        expires_in=3600,
    )
    
    log_activity(user_id, "project_duplicated", new_project["id"])
    
    return CreateProjectResponse(
        id=new_project["id"],
        title=new_project["title"],
        upload_url=upload_url,
        video_key=video_key,
    )
