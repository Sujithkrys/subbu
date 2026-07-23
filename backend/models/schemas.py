"""
Pydantic request/response schemas for all API endpoints.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── Segment (subtitle line) ──────────────────────────────────────────────────

class Segment(BaseModel):
    """A single subtitle segment with timestamps."""
    start: float = Field(..., description="Start time in seconds")
    end: float = Field(..., description="End time in seconds")
    text: str = Field(..., description="Subtitle text content")


# ── Project ──────────────────────────────────────────────────────────────────

class CreateProjectRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Project title")


class CreateProjectResponse(BaseModel):
    id: UUID
    title: str
    upload_url: str = Field(..., description="Presigned R2 URL for video upload")
    video_key: str = Field(..., description="R2 object key for the video")


class ProjectResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: Optional[str] = None
    video_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    status: str = "uploaded"
    created_at: datetime


class ProjectListResponse(BaseModel):
    projects: list[dict]


# ── Transcription ────────────────────────────────────────────────────────────

class TranscribeRequest(BaseModel):
    source_language: Optional[str] = Field(
        None,
        description="ISO language code (e.g., 'en', 'hi', 'te'). Auto-detect if omitted."
    )


class TranscriptResponse(BaseModel):
    id: UUID
    project_id: UUID
    language: str
    segments: list[Segment]
    source: str  # 'asr' or 'translated'
    review_state: str = "needs_review"
    created_at: datetime


# ── Translation ──────────────────────────────────────────────────────────────

class TranslateRequest(BaseModel):
    target_language: str = Field(
        ...,
        description="Target language code (e.g., 'te', 'hi', 'ta', 'kn', 'ml', 'bn', 'mr', 'gu')"
    )
    source_language: Optional[str] = Field(
        None,
        description="Source language code. Defaults to transcript language."
    )


# ── Subtitle Style ──────────────────────────────────────────────────────────

class StyleRequest(BaseModel):
    font: str = Field(default="Arial", description="Font family")
    color: str = Field(default="#FFFFFF", description="Text color (hex)")
    position: str = Field(default="bottom", description="Position: top, center, bottom")
    animation_type: Optional[str] = Field(
        default=None,
        description="Animation: fade, slide, pop, typewriter, none"
    )
    preset: Optional[str] = Field(default="minimal", description="Style preset identifier")
    bold: Optional[bool] = Field(default=False, description="Whether the text is bold")
    shadow: Optional[bool] = Field(default=False, description="Whether the text has a drop shadow")
    orientation: Optional[str] = Field(default="landscape", description="Video orientation: landscape, portrait, original")


class StyleResponse(BaseModel):
    id: UUID
    project_id: UUID
    font: str
    color: str
    position: str
    animation_type: Optional[str]
    preset: Optional[str] = "minimal"
    bold: Optional[bool] = False
    shadow: Optional[bool] = False
    orientation: Optional[str] = "landscape"
    created_at: datetime


# ── Export ────────────────────────────────────────────────────────────────────

class ExportRequest(BaseModel):
    format: str = Field(
        ...,
        description="Export format: srt, vtt, ass, burned_mp4"
    )
    burn_in: bool = Field(
        default=False,
        description="Whether to burn subtitles into the video"
    )
    transcript_id: Optional[str] = Field(
        None,
        description="Specific transcript ID to export. Uses latest if omitted."
    )


class ExportResponse(BaseModel):
    id: UUID
    project_id: UUID
    format: str
    url: Optional[str] = None
    created_at: datetime


# ── Job Status ───────────────────────────────────────────────────────────────

class JobResponse(BaseModel):
    id: UUID
    project_id: UUID
    type: str  # transcribe, translate, render
    status: str  # queued, processing, done, failed
    progress: float = 0
    error: Optional[str] = None
    created_at: datetime


class ProjectStatusResponse(BaseModel):
    project_id: UUID
    project_status: str
    jobs: list[JobResponse]
    transcripts: list[TranscriptResponse] = []
    exports: list[ExportResponse] = []


# ── User Settings ────────────────────────────────────────────────────────────

class UserSettingsRequest(BaseModel):
    theme: str = Field(default="dark", description="UI theme preference")

class UserSettingsResponse(BaseModel):
    user_id: UUID
    theme: str
