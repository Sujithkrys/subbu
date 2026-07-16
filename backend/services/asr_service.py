"""
ASR (Automatic Speech Recognition) Service.
Uses Groq API with Whisper Large v3 for transcription.
"""

import os
from typing import Optional

from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_groq_client = None


def get_groq_client() -> Groq:
    """Get or create the Groq client."""
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY must be set")
        _groq_client = Groq(api_key=api_key)
    return _groq_client


def transcribe_audio(
    audio_path: str,
    language: Optional[str] = None,
) -> list[dict]:
    """
    Transcribe an audio file using Groq's Whisper Large v3.
    
    Args:
        audio_path: Path to the audio file (WAV, MP3, etc.)
        language: Optional ISO language code for better accuracy.
    
    Returns:
        List of segments: [{"start": float, "end": float, "text": str}, ...]
    """
    client = get_groq_client()

    with open(audio_path, "rb") as audio_file:
        kwargs = {
            "file": (os.path.basename(audio_path), audio_file.read()),
            "model": "whisper-large-v3",
            "response_format": "verbose_json",
            "timestamp_granularities": ["segment"],
            "temperature": 0.0,
        }
        if language:
            kwargs["language"] = language

        transcription = client.audio.transcriptions.create(**kwargs)

    # Extract segments from the verbose JSON response
    segments = []
    if hasattr(transcription, "segments") and transcription.segments:
        for seg in transcription.segments:
            segments.append({
                "start": round(seg.get("start", seg.start) if isinstance(seg, dict) else seg.start, 3),
                "end": round(seg.get("end", seg.end) if isinstance(seg, dict) else seg.end, 3),
                "text": (seg.get("text", "") if isinstance(seg, dict) else seg.text).strip(),
            })
    else:
        # Fallback: single segment with full text
        segments.append({
            "start": 0.0,
            "end": 0.0,
            "text": transcription.text.strip() if transcription.text else "",
        })

    return segments


def detect_language(audio_path: str) -> str:
    """
    Detect the language of an audio file.
    Returns the ISO language code.
    """
    client = get_groq_client()

    with open(audio_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=(os.path.basename(audio_path), audio_file.read()),
            model="whisper-large-v3",
            response_format="verbose_json",
            temperature=0.0,
        )

    return getattr(transcription, "language", "en")
