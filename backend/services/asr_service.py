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
    word_timestamps: bool = False,
) -> list[dict]:
    """
    Transcribe an audio file using Groq's Whisper Large v3.
    
    Args:
        audio_path: Path to the audio file (WAV, MP3, etc.)
        language: Optional ISO language code for better accuracy.
        word_timestamps: If True, request word-level timestamps for karaoke mode.
    
    Returns:
        List of segments: [{
            "start": float, "end": float, "text": str,
            "words": [{"word": str, "start": float, "end": float}]  # if word_timestamps=True
        }, ...]
    """
    client = get_groq_client()

    granularities = ["segment", "word"] if word_timestamps else ["segment"]

    with open(audio_path, "rb") as audio_file:
        kwargs = {
            "file": (os.path.basename(audio_path), audio_file.read()),
            "model": "whisper-large-v3",
            "response_format": "verbose_json",
            "timestamp_granularities": granularities,
            "temperature": 0.0,
        }
        if language:
            kwargs["language"] = language

        transcription = client.audio.transcriptions.create(**kwargs)

    # Build word lookup for fast access (if word timestamps returned)
    word_list = []
    if word_timestamps and hasattr(transcription, "words") and transcription.words:
        for w in transcription.words:
            if isinstance(w, dict):
                word_list.append({"word": w.get("word", ""), "start": w.get("start", 0.0), "end": w.get("end", 0.0)})
            else:
                word_list.append({"word": getattr(w, "word", ""), "start": getattr(w, "start", 0.0), "end": getattr(w, "end", 0.0)})

    # Extract segments from the verbose JSON response
    segments = []
    if hasattr(transcription, "segments") and transcription.segments:
        for seg in transcription.segments:
            start = round(seg.get("start", 0.0) if isinstance(seg, dict) else getattr(seg, "start", 0.0), 3)
            end = round(seg.get("end", 0.0) if isinstance(seg, dict) else getattr(seg, "end", 0.0), 3)
            text = (seg.get("text", "") if isinstance(seg, dict) else getattr(seg, "text", "")).strip()

            segment_obj: dict = {"start": start, "end": end, "text": text}

            if word_timestamps and word_list:
                # Filter words that fall within this segment's time range
                seg_words = [w for w in word_list if w["start"] >= start - 0.05 and w["end"] <= end + 0.05]
                if seg_words:
                    segment_obj["words"] = seg_words

            segments.append(segment_obj)
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
