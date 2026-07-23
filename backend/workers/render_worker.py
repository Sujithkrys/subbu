"""
Render Worker.
Called by QStash to process export/render jobs.

Pipeline:
1. Fetch transcript segments
2. Generate subtitle file (SRT/VTT/ASS) or burn subtitles into video
3. Upload result to R2
4. Save export record
5. Update job status
"""

import os
import tempfile
import uuid

from fastapi import APIRouter, Request

from db.supabase_client import (
    get_project, get_transcript, get_style, update_job,
    save_export,
)
from services.storage_service import download_file, upload_file, generate_download_url
from services.ffmpeg_service import (
    generate_srt, generate_vtt, generate_ass, burn_subtitles,
)

router = APIRouter()


@router.post("/workers/render")
async def process_render(request: Request):
    """
    Background worker endpoint for rendering/exporting subtitles.
    Called by QStash with the job payload.
    """
    body = await request.json()
    project_id = body["project_id"]
    job_id = body["job_id"]
    transcript_id = body["transcript_id"]
    export_format = body["format"]
    burn_in = body.get("burn_in", False)

    try:
        update_job(job_id, "processing", progress=10)

        # Fetch transcript
        transcript = get_transcript(transcript_id)
        segments = transcript["segments"]
        language = transcript["language"]

        # Fetch style settings
        style = get_style(project_id) or {
            "font": "Arial",
            "color": "#FFFFFF",
            "position": "bottom",
            "animation_type": None,
        }

        with tempfile.TemporaryDirectory() as tmp_dir:
            update_job(job_id, "processing", progress=20)

            # Generate the subtitle file
            export_id = str(uuid.uuid4())

            if export_format == "srt":
                output_path = os.path.join(tmp_dir, f"{export_id}.srt")
                generate_srt(segments, output_path)
                content_type = "text/plain"
                r2_key = f"exports/{project_id}/{export_id}.srt"

            elif export_format == "vtt":
                output_path = os.path.join(tmp_dir, f"{export_id}.vtt")
                generate_vtt(segments, output_path)
                content_type = "text/vtt"
                r2_key = f"exports/{project_id}/{export_id}.vtt"

            elif export_format == "ass":
                output_path = os.path.join(tmp_dir, f"{export_id}.ass")
                # Convert hex color to ASS color format
                hex_color = style["color"].lstrip("#")
                # ASS uses &HAABBGGRR format
                r, g, b = hex_color[0:2], hex_color[2:4], hex_color[4:6]
                ass_color = f"&H00{b}{g}{r}"

                generate_ass(
                    segments,
                    output_path,
                    font_name=style["font"],
                    font_size=24,
                    primary_color=ass_color,
                    position=style["position"],
                    animation_type=style.get("animation_type"),
                    bold=style.get("bold", False),
                    shadow=style.get("shadow", False)
                )
                content_type = "text/plain"
                r2_key = f"exports/{project_id}/{export_id}.ass"

            elif export_format == "burned_mp4":
                # Need to download the video and burn subtitles in
                project = get_project(project_id)
                video_key = project["video_url"]

                # Download video
                video_path = os.path.join(tmp_dir, "video.mp4")
                download_file(video_key, video_path)
                update_job(job_id, "processing", progress=40)

                # Generate ASS file for burn-in (best styling support)
                ass_path = os.path.join(tmp_dir, "subtitles.ass")
                hex_color = style["color"].lstrip("#")
                r, g, b = hex_color[0:2], hex_color[2:4], hex_color[4:6]
                ass_color = f"&H00{b}{g}{r}"

                generate_ass(
                    segments,
                    ass_path,
                    font_name=style["font"],
                    font_size=24,
                    primary_color=ass_color,
                    position=style["position"],
                    animation_type=style.get("animation_type"),
                    bold=style.get("bold", False),
                    shadow=style.get("shadow", False)
                )
                update_job(job_id, "processing", progress=50)

                # Burn subtitles into video
                output_path = os.path.join(tmp_dir, f"{export_id}_subtitled.mp4")
                burn_subtitles(video_path, ass_path, output_path, orientation=style.get("orientation", "landscape"))
                content_type = "video/mp4"
                r2_key = f"exports/{project_id}/{export_id}_subtitled.mp4"
                update_job(job_id, "processing", progress=80)

            else:
                raise ValueError(f"Unsupported format: {export_format}")

            # Upload to R2
            upload_file(r2_key, output_path, content_type)
            update_job(job_id, "processing", progress=90)

            # Generate download URL
            download_url = generate_download_url(r2_key, expires_in=86400)  # 24 hours

            # Save export record
            save_export(
                project_id=project_id,
                format=export_format,
                url=download_url,
            )

        # Done
        update_job(job_id, "done", progress=100)

        return {
            "status": "success",
            "format": export_format,
            "download_url": download_url,
        }

    except Exception as e:
        update_job(job_id, "failed", error=str(e))
        print(f"Render error: {e}")
        return {"status": "error", "error": str(e)}
