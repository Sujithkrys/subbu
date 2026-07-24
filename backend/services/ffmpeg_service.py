"""
FFmpeg Service for audio/video processing.
Handles audio extraction, subtitle burn-in, and format conversion.
"""

import os
import subprocess
import tempfile
from typing import Optional


def extract_audio(
    video_path: str,
    output_path: Optional[str] = None,
    sample_rate: int = 16000,
    channels: int = 1,
) -> str:
    """
    Extract audio from a video file as WAV.
    
    Args:
        video_path: Path to the input video file.
        output_path: Path for the output WAV file. Auto-generated if None.
        sample_rate: Audio sample rate (default 16000 Hz for Whisper).
        channels: Number of audio channels (default 1 = mono).
    
    Returns:
        Path to the extracted audio file.
    """
    if output_path is None:
        output_path = os.path.splitext(video_path)[0] + "_audio.wav"

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",
        "-ar", str(sample_rate),
        "-ac", str(channels),
        "-acodec", "pcm_s16le",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg audio extraction failed: {result.stderr}")

    return output_path


def get_video_duration(video_path: str) -> float:
    """Get the duration of a video file in seconds."""
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        video_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise RuntimeError(f"FFprobe failed: {result.stderr}")

    return float(result.stdout.strip())


def trim_video(
    video_path: str,
    output_path: str,
    start_time: float = 0.0,
    end_time: Optional[float] = None,
) -> str:
    """
    Trim a video to a specified time range using FFmpeg.

    Args:
        video_path: Path to the input video.
        output_path: Path for the trimmed output video.
        start_time: Start time in seconds (default 0).
        end_time: End time in seconds (None = until end of video).

    Returns:
        Path to the trimmed video.
    """
    cmd = ["ffmpeg", "-y", "-i", video_path, "-ss", str(start_time)]

    if end_time is not None:
        duration = end_time - start_time
        cmd += ["-t", str(duration)]

    cmd += [
        "-c:v", "libx264",
        "-c:a", "aac",
        "-avoid_negative_ts", "1",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg trim failed: {result.stderr}")

    return output_path


def burn_subtitles(
    video_path: str,
    subtitle_path: str,
    output_path: Optional[str] = None,
    font_name: str = "Arial",
    font_size: int = 24,
    font_color: str = "&HFFFFFF",
    orientation: str = "original",
) -> str:
    """
    Burn subtitles into a video using FFmpeg.
    
    Args:
        video_path: Path to the input video.
        subtitle_path: Path to the subtitle file (ASS/SRT).
        output_path: Path for the output video. Auto-generated if None.
        font_name: Font to use for subtitles.
        font_size: Font size.
        font_color: Font color in ASS format.
        orientation: Video orientation (landscape, portrait, original)
    
    Returns:
        Path to the output video with burned-in subtitles.
    """
    if output_path is None:
        output_path = os.path.splitext(video_path)[0] + "_subtitled.mp4"

    # Use subtitles filter for ASS, or sub for SRT
    if subtitle_path.endswith(".ass"):
        fonts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public/fonts")).replace("\\", "/").replace(":", "\\:")
        sub_path_esc = subtitle_path.replace("\\", "/").replace(":", "\\:")
        
        # Build filter chain
        vf_filters = []
        if orientation == "portrait":
            vf_filters.append("crop=ih*9/16:ih")
        elif orientation == "landscape":
            vf_filters.append("crop=iw:iw*9/16")
            
        vf_filters.append(f"ass='{sub_path_esc}':fontsdir='{fonts_dir}'")
        vf = ",".join(vf_filters)
    else:
        # For SRT/VTT, use subtitles filter with style override
        vf = (
            f"subtitles={subtitle_path}"
            f":force_style='FontName={font_name},FontSize={font_size},"
            f"PrimaryColour={font_color}'"
        )

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vf", vf,
        "-c:a", "copy",
        "-c:v", "libx264",
        "-preset", "fast",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg subtitle burn-in failed: {result.stderr}")

    return output_path


# ── Subtitle format generators ──────────────────────────────────────────────

def _format_timestamp_srt(seconds: float) -> str:
    """Format seconds to SRT timestamp (HH:MM:SS,mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def _format_timestamp_vtt(seconds: float) -> str:
    """Format seconds to VTT timestamp (HH:MM:SS.mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def generate_srt(segments: list[dict], output_path: str) -> str:
    """Generate an SRT subtitle file from segments."""
    lines = []
    for i, seg in enumerate(segments, 1):
        start = _format_timestamp_srt(seg["start"])
        end = _format_timestamp_srt(seg["end"])
        lines.append(f"{i}")
        lines.append(f"{start} --> {end}")
        lines.append(seg["text"])
        lines.append("")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    return output_path


def generate_vtt(segments: list[dict], output_path: str) -> str:
    """Generate a WebVTT subtitle file from segments."""
    lines = ["WEBVTT", ""]
    for i, seg in enumerate(segments, 1):
        start = _format_timestamp_vtt(seg["start"])
        end = _format_timestamp_vtt(seg["end"])
        lines.append(f"{i}")
        lines.append(f"{start} --> {end}")
        lines.append(seg["text"])
        lines.append("")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    return output_path


def generate_ass(
    segments: list[dict],
    output_path: str,
    font_name: str = "Arial",
    font_size: int = 24,
    primary_color: str = "&H00FFFFFF",
    outline_color: str = "&H00000000",
    position: str = "bottom",
    animation_type: str = None,
    bold: bool = False,
    shadow: bool = False,
) -> str:
    """Generate an ASS (Advanced SubStation Alpha) subtitle file."""
    # Map position to alignment
    alignment_map = {
        "bottom": "2",   # Bottom center
        "top": "8",      # Top center
        "center": "5",   # Middle center
    }
    alignment = alignment_map.get(position, "2")
    
    if font_name == "Cinematic Blur":
        font_name = "MontserratBlack"
    elif font_name == "Flicker Shine":
        font_name = "MontserratBold"

    ass_bold = "-1" if bold else "0"
    ass_shadow = "2" if shadow else "0"
    if font_name in ["MontserratBlack", "MontserratBold", "Impact"]:
        ass_bold = "-1"

    header = f"""[Script Info]
Title: AI Subtitle Generator
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},{primary_color},&H000000FF,{outline_color},&H80000000,{ass_bold},0,0,0,100,100,0,0,1,2,{ass_shadow},{alignment},20,20,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    def _ass_time(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        cs = int((seconds % 1) * 100)
        return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

    lines = [header]
    for seg in segments:
        start_ass = _ass_time(seg["start"])
        end_ass = _ass_time(seg["end"])
        text = seg["text"].replace("\n", "\\N")
        
        if animation_type == "cinematic-blur":
            text = f"{{\\fad(200,200)\\blur15\\t(0,300,\\blur0.5)}}{text}"
        elif animation_type == "flicker-shine":
            text = f"{{\\3c&HFFFF00&\\bord6\\blur4\\1a&H33&\\t(0,100,\\1a&H00&)\\t(100,200,\\1a&H44&)\\t(200,300,\\1a&H00&)}}{text}"
        elif animation_type == "fast-whip":
            text = f"{{\\fscx50\\fscy50\\t(0,150,\\fscx120\\fscy120)\\t(150,300,\\fscx100\\fscy100)}}{text}"
        elif animation_type == "pop":
            text = f"{{\\t(0,150,\\fscx110\\fscy110)\\t(150,300,\\fscx100\\fscy100)}}{text}"
        elif animation_type == "fade":
            text = f"{{\\fad(250,250)}}{text}"

        lines.append(f"Dialogue: 0,{start_ass},{end_ass},Default,,0,0,0,,{text}")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
        f.write("\n")

    return output_path
