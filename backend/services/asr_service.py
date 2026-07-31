"""
ASR (Automatic Speech Recognition) Service.
Uses Sarvam API for transcription.
"""

import os
from typing import Optional

from sarvamai import SarvamAI
from dotenv import load_dotenv, find_dotenv
from groq import Groq

load_dotenv(find_dotenv())

_sarvam_client = None
_groq_client = None

def get_groq_client() -> Groq:
    """Get or create the Groq client for fallback."""
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY must be set for STT fallback")
        _groq_client = Groq(api_key=api_key)
    return _groq_client



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

    # Diagnostics
    import os
    import wave
    file_size = os.path.getsize(audio_path)
    try:
        with wave.open(audio_path, 'rb') as w:
            frames = w.getnframes()
            rate = w.getframerate()
            duration = frames / float(rate)
    except Exception:
        duration = -1

    print(f"[DIAGNOSTIC] Calling Sarvam STT. Audio: {audio_path}, Size: {file_size} bytes, Duration: {duration}s, Lang: {language_code}")

    try:
        with open(audio_path, "rb") as audio_file:
            response = client.speech_to_text.transcribe(
                file=audio_file,
                language_code=language_code
            )
    except Exception as e:
        import traceback
        print(f"[DIAGNOSTIC] Sarvam STT failed! Exception: {e}")
        print(f"[DIAGNOSTIC] Traceback: {traceback.format_exc()}")
        print("[DIAGNOSTIC] Falling back to Groq Whisper...")
        return _transcribe_audio_groq(audio_path, language, word_timestamps)

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
                current_segment["source_provider"] = "sarvam"
                segments.append(current_segment)
                current_segment = {"start": 0.0, "end": 0.0, "text": "", "words": []}
                
        if current_segment["words"]:
            current_segment["text"] = " ".join([w["word"] for w in current_segment["words"]])
            if not word_timestamps:
                current_segment.pop("words", None)
            current_segment["source_provider"] = "sarvam"
            segments.append(current_segment)
    else:
        # Fallback: single segment with full text
        segments.append({
            "start": 0.0,
            "end": 0.0,
            "text": response.transcript if hasattr(response, "transcript") else "",
            "source_provider": "sarvam"
        })

    return segments

def _transcribe_audio_groq(audio_path: str, language: Optional[str], word_timestamps: bool) -> list[dict]:
    """Fallback transcription using Groq Whisper Large v3."""
    groq_client = get_groq_client()
    
    lang_code = "en"
    if language and len(language) >= 2:
        lang_code = language[:2].lower()
        
    with open(audio_path, "rb") as f:
        # Groq expects a tuple for the file if we want to pass bytes directly, or just the file object
        # Since the file extension might just be .wav, we can pass the file object directly.
        transcription = groq_client.audio.transcriptions.create(
            file=("audio.wav", f.read()),
            model="whisper-large-v3",
            prompt="Spoken audio.",
            response_format="verbose_json",
            language=lang_code
        )
        
    segments = []
    if hasattr(transcription, "segments") and transcription.segments:
        for s in transcription.segments:
            seg = {
                "start": round(s["start"] if isinstance(s, dict) else s.start, 3),
                "end": round(s["end"] if isinstance(s, dict) else s.end, 3),
                "text": (s["text"] if isinstance(s, dict) else s.text).strip(),
                "source_provider": "groq_fallback"
            }
            # Note: Groq Whisper doesn't always return word-level timestamps in the python SDK perfectly,
            # but if they exist, we extract them.
            if word_timestamps and hasattr(s, "words") and s.words:
                seg["words"] = [{"word": w["word"] if isinstance(w, dict) else w.word, 
                                 "start": round(w["start"] if isinstance(w, dict) else w.start, 3), 
                                 "end": round(w["end"] if isinstance(w, dict) else w.end, 3)} 
                                for w in (s["words"] if isinstance(s, dict) else s.words)]
            segments.append(seg)
    else:
        segments.append({
            "start": 0.0,
            "end": 0.0,
            "text": transcription.text if hasattr(transcription, "text") else "",
            "source_provider": "groq_fallback"
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
