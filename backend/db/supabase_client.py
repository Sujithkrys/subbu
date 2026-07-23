"""
Supabase client for backend database operations.
Uses the service-role key for full access (bypasses RLS).
"""

import os
import datetime
from typing import Optional

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

_client: Optional[Client] = None


def get_supabase() -> Client:
    """Get or create the Supabase service-role client."""
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        _client = create_client(url, key)
    return _client


# ── Project helpers ──────────────────────────────────────────────────────────

def create_project(user_id: str, title: str, video_url: str) -> dict:
    """Create a new project record."""
    sb = get_supabase()
    result = sb.table("projects").insert({
        "user_id": user_id,
        "title": title,
        "video_url": video_url,
        "status": "uploaded"
    }).execute()
    return result.data[0]


def get_project(project_id: str) -> dict:
    """Fetch a single project by ID."""
    sb = get_supabase()
    result = sb.table("projects").select("*").eq("id", project_id).single().execute()
    return result.data


def list_projects(user_id: str) -> list[dict]:
    """List all projects for a user, including related data for dashboard filters."""
    sb = get_supabase()
    result = (
        sb.table("projects")
        .select("*, transcripts(*), subtitle_styles(*), exports(*)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def update_project_status(project_id: str, status: str) -> dict:
    """Update a project's status."""
    sb = get_supabase()
    result = (
        sb.table("projects")
        .update({"status": status})
        .eq("id", project_id)
        .execute()
    )
    return result.data[0]


def update_project_duration(project_id: str, duration: float) -> dict:
    """Update a project's video duration."""
    sb = get_supabase()
    result = (
        sb.table("projects")
        .update({"duration_seconds": duration})
        .eq("id", project_id)
        .execute()
    )
    return result.data[0]


# ── Job helpers ──────────────────────────────────────────────────────────────

def create_job(project_id: str, job_type: str) -> dict:
    """Create a new job record."""
    sb = get_supabase()
    result = sb.table("jobs").insert({
        "project_id": project_id,
        "type": job_type,
        "status": "queued",
        "progress": 0
    }).execute()
    return result.data[0]


def update_job(job_id: str, status: str, progress: float = 0, error: str = None) -> dict:
    """Update a job's status and progress."""
    sb = get_supabase()
    update_data = {"status": status, "progress": progress}
    if error:
        update_data["error"] = error
    result = (
        sb.table("jobs")
        .update(update_data)
        .eq("id", job_id)
        .execute()
    )
    return result.data[0]


def get_jobs_for_project(project_id: str) -> list[dict]:
    """Get all jobs for a project."""
    sb = get_supabase()
    result = (
        sb.table("jobs")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


# ── Transcript helpers ───────────────────────────────────────────────────────

def save_transcript(project_id: str, language: str, segments: list[dict], source: str) -> dict:
    """Save a transcript (ASR or translated)."""
    sb = get_supabase()
    result = sb.table("transcripts").insert({
        "project_id": project_id,
        "language": language,
        "segments": segments,
        "source": source
    }).execute()
    return result.data[0]


def get_transcripts(project_id: str) -> list[dict]:
    """Get all transcripts for a project."""
    sb = get_supabase()
    result = (
        sb.table("transcripts")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def get_transcript(transcript_id: str) -> dict:
    """Get a single transcript by ID."""
    sb = get_supabase()
    result = sb.table("transcripts").select("*").eq("id", transcript_id).single().execute()
    return result.data


def update_transcript(transcript_id: str, segments: list[dict] = None, review_state: str = None) -> dict:
    """Update a transcript's segments or review state."""
    sb = get_supabase()
    update_data = {}
    if segments is not None:
        update_data["segments"] = segments
    if review_state is not None:
        update_data["review_state"] = review_state
        
    result = (
        sb.table("transcripts")
        .update(update_data)
        .eq("id", transcript_id)
        .execute()
    )
    return result.data[0]


# ── Style helpers ────────────────────────────────────────────────────────────

def save_style(project_id: str, font: str, color: str, position: str, animation_type: str = None) -> dict:
    """Save or update subtitle style for a project."""
    sb = get_supabase()
    # Upsert: delete existing style for this project, then insert
    sb.table("subtitle_styles").delete().eq("project_id", project_id).execute()
    result = sb.table("subtitle_styles").insert({
        "project_id": project_id,
        "font": font,
        "color": color,
        "position": position,
        "animation_type": animation_type
    }).execute()
    return result.data[0]


def get_style(project_id: str) -> Optional[dict]:
    """Get the subtitle style for a project."""
    sb = get_supabase()
    result = (
        sb.table("subtitle_styles")
        .select("*")
        .eq("project_id", project_id)
        .execute()
    )
    return result.data[0] if result.data else None


# ── Export helpers ───────────────────────────────────────────────────────────

def save_export(project_id: str, format: str, url: str) -> dict:
    """Save an export record."""
    sb = get_supabase()
    result = sb.table("exports").insert({
        "project_id": project_id,
        "format": format,
        "url": url
    }).execute()
    return result.data[0]


def get_exports(project_id: str) -> list[dict]:
    """Get all exports for a project."""
    sb = get_supabase()
    result = (
        sb.table("exports")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


# ── Usage helpers ────────────────────────────────────────────────────────────

def get_or_create_usage(user_id: str) -> dict:
    """Get the current month's usage record for a user, creating it if it doesn't exist."""
    sb = get_supabase()
    now = datetime.datetime.utcnow()
    month_start = datetime.date(now.year, now.month, 1).isoformat()

    result = sb.table("usage").select("*").eq("user_id", user_id).eq("month", month_start).execute()
    if result.data:
        return result.data[0]

    try:
        new_record = sb.table("usage").insert({
            "user_id": user_id,
            "month": month_start,
            "transcription_seconds_used": 0,
            "translation_characters_used": 0
        }).execute()
        return new_record.data[0]
    except Exception:
        result = sb.table("usage").select("*").eq("user_id", user_id).eq("month", month_start).execute()
        if result.data:
            return result.data[0]
        raise


def increment_usage(user_id: str, transcription_seconds: float = 0, translation_characters: int = 0) -> dict:
    """Increment the user's monthly usage."""
    sb = get_supabase()
    now = datetime.datetime.utcnow()
    month_start = datetime.date(now.year, now.month, 1).isoformat()

    current = get_or_create_usage(user_id)
    new_seconds = float(current.get("transcription_seconds_used", 0) or 0) + float(transcription_seconds)
    new_chars = int(current.get("translation_characters_used", 0) or 0) + int(translation_characters)

    result = (
        sb.table("usage")
        .update({
            "transcription_seconds_used": new_seconds,
            "translation_characters_used": new_chars,
            "updated_at": datetime.datetime.utcnow().isoformat()
        })
        .eq("id", current["id"])
        .execute()
    )
    return result.data[0]


# ── Dashboard helpers ────────────────────────────────────────────────────────

def log_activity(user_id: str, action: str, project_id: str = None, details: dict = None) -> dict:
    """Log an activity for the user's dashboard."""
    sb = get_supabase()
    payload = {
        "user_id": user_id,
        "action": action
    }
    if project_id:
        payload["project_id"] = project_id
    if details:
        payload["details"] = details
        
    result = sb.table("activity_log").insert(payload).execute()
    return result.data[0]


def get_recent_activity(user_id: str, limit: int = 50) -> list[dict]:
    """Get recent activity for a user."""
    sb = get_supabase()
    result = (
        sb.table("activity_log")
        .select("*, projects(title)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


def toggle_favorite(project_id: str, is_favorite: bool) -> dict:
    """Toggle the favorite status of a project."""
    sb = get_supabase()
    result = (
        sb.table("projects")
        .update({"is_favorite": is_favorite})
        .eq("id", project_id)
        .execute()
    )
    return result.data[0]


def update_project_file_size(project_id: str, file_size_bytes: int) -> dict:
    """Update a project's storage file size."""
    sb = get_supabase()
    result = (
        sb.table("projects")
        .update({"file_size_bytes": file_size_bytes})
        .eq("id", project_id)
        .execute()
    )
    return result.data[0]


def delete_project(project_id: str) -> bool:
    """Delete a project (cascades to related records)."""
    sb = get_supabase()
    sb.table("projects").delete().eq("id", project_id).execute()
    return True


# ── User Settings helpers ────────────────────────────────────────────────────

def get_user_settings(user_id: str) -> dict:
    """Get user settings (e.g. theme)."""
    sb = get_supabase()
    result = sb.table("user_settings").select("*").eq("user_id", user_id).execute()
    if result.data:
        return result.data[0]
    # Return defaults if no record exists
    return {"user_id": user_id, "theme": "dark"}


def update_user_settings(user_id: str, theme: str) -> dict:
    """Update or create user settings."""
    sb = get_supabase()
    # Check if exists
    result = sb.table("user_settings").select("*").eq("user_id", user_id).execute()
    if result.data:
        res = sb.table("user_settings").update({"theme": theme}).eq("user_id", user_id).execute()
        return res.data[0]
    else:
        res = sb.table("user_settings").insert({"user_id": user_id, "theme": theme}).execute()
        return res.data[0]
