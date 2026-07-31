"""
ASR (Automatic Speech Recognition) Service.
Uses Sarvam API for transcription.
"""

import os
from typing import Optional

from sarvamai import SarvamAI
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

_sarvam_client = None


def get_sarvam_client() -> SarvamAI:
    """Get or create the Sarvam client."""
    global _sarvam_client
    if _sarvam_client is None:
        api_key = os.getenv("SARVAM_API_KEY")
        if not api_key:
            raise ValueError("SARVAM_API_KEY must be set")
        _sarvam_client = SarvamAI(api_subscription_key=api_key)
    return _sarvam_client


def transcribe_audio(
    audio_path: str,
    language: Optional[str] = None,
    word_timestamps: bool = False,
) -> list[dict]:
    """
    Transcribe an audio file using Sarvam API.
    
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
    client = get_sarvam_client()

    lang_map = {
        "english": "en-IN", "hindi": "hi-IN", "telugu": "te-IN", "tamil": "ta-IN", 
        "malayalam": "ml-IN", "kannada": "kn-IN", "bengali": "bn-IN", "marathi": "mr-IN", 
        "gujarati": "gu-IN", "punjabi": "pa-IN",
    }
    
    language_code = "unknown"
    if language:
        lang_lower = language.lower()
        if len(lang_lower) > 2 and lang_lower in lang_map:
            language_code = lang_map[lang_lower]
        elif len(lang_lower) == 2:
            lang_code = f"{lang_lower}-IN"
            if lang_code in lang_map.values():
                language_code = lang_code

    with open(audio_path, "rb") as audio_file:
        response = client.speech_to_text.transcribe(
            file=audio_file,
            language_code=language_code
        )

    segments = []
    
    if hasattr(response, "timestamps") and response.timestamps:
        ts = response.timestamps
        words = ts.words
        starts = ts.start_time_seconds
        ends = ts.end_time_seconds
        
        current_segment = {"start": 0.0, "end": 0.0, "text": "", "words": []}
        for i in range(len(words)):
            w = words[i]
            s = starts[i]
            e = ends[i]
            
            if not current_segment["words"]:
                current_segment["start"] = round(s, 3)
                
            current_segment["words"].append({"word": w, "start": round(s, 3), "end": round(e, 3)})
            current_segment["end"] = round(e, 3)
            
            pause = starts[i+1] - e if i + 1 < len(words) else 0
            if pause > 0.5 or len(current_segment["words"]) >= 15:
                current_segment["text"] = " ".join([w["word"] for w in current_segment["words"]])
                if not word_timestamps:
                    current_segment.pop("words", None)
                segments.append(current_segment)
                current_segment = {"start": 0.0, "end": 0.0, "text": "", "words": []}
                
        if current_segment["words"]:
            current_segment["text"] = " ".join([w["word"] for w in current_segment["words"]])
            if not word_timestamps:
                current_segment.pop("words", None)
            segments.append(current_segment)
    else:
        # Fallback: single segment with full text
        segments.append({
            "start": 0.0,
            "end": 0.0,
            "text": response.transcript if hasattr(response, "transcript") else "",
        })

    return segments


def detect_language(audio_path: str) -> str:
    """
    Detect the language of an audio file.
    Returns the ISO language code.
    """
    client = get_sarvam_client()

    with open(audio_path, "rb") as audio_file:
        response = client.speech_to_text.transcribe(
            file=audio_file,
            language_code="unknown"
        )
        
    lang_str = getattr(response, "language_code", "en-IN")
    if lang_str:
        return lang_str.split("-")[0]
        
    return "en"
