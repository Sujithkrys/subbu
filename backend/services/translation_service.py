"""
Translation Service using Sarvam API (Mayura model).
Supports translation between Indian languages, including code-mixed modes.
"""

import os
import asyncio
from typing import Optional
from dotenv import load_dotenv

from services.sarvam_service import get_client

load_dotenv()

# Map UI language codes to Sarvam language codes and modes
# Mayura:v1 supports bn, en, gu, hi, kn, ml, mr, or, pa, ta, te
LANG_CONFIG = {
    "en": {"code": "en-IN", "mode": "modern-colloquial"},
    "hi": {"code": "hi-IN", "mode": "modern-colloquial"},
    "te": {"code": "te-IN", "mode": "modern-colloquial"},
    "ta": {"code": "ta-IN", "mode": "modern-colloquial"},
    "kn": {"code": "kn-IN", "mode": "modern-colloquial"},
    "ml": {"code": "ml-IN", "mode": "modern-colloquial"},
    "bn": {"code": "bn-IN", "mode": "modern-colloquial"},
    "mr": {"code": "mr-IN", "mode": "modern-colloquial"},
    "gu": {"code": "gu-IN", "mode": "modern-colloquial"},
    "pa": {"code": "pa-IN", "mode": "modern-colloquial"},
    
    # Code-mixed target options map to base languages but use "code-mixed" mode
    "hinglish": {"code": "hi-IN", "mode": "code-mixed"},
    "tinglish": {"code": "te-IN", "mode": "code-mixed"},
    "tanglish": {"code": "ta-IN", "mode": "code-mixed"},
    "benglish": {"code": "bn-IN", "mode": "code-mixed"},
}

def split_text_if_needed(text: str, max_length: int = 900) -> list[str]:
    """Splits text into chunks <= max_length if it exceeds the limit."""
    if len(text) <= max_length:
        return [text]
        
    # Simple split by sentences/spaces to respect limits
    words = text.split(" ")
    chunks = []
    current_chunk = []
    current_length = 0
    
    for word in words:
        if current_length + len(word) + 1 > max_length and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [word]
            current_length = len(word)
        else:
            current_chunk.append(word)
            current_length += len(word) + 1
            
    if current_chunk:
        chunks.append(" ".join(current_chunk))
        
    return chunks

async def translate_segments(
    segments: list[dict],
    source_lang: str,
    target_lang: str,
) -> list[dict]:
    """
    Translates a list of segment dicts using Sarvam's Mayura model.
    """
    if not segments:
        return []
        
    if source_lang == target_lang:
        return segments

    client = get_client()
    
    source_config = LANG_CONFIG.get(source_lang, {"code": "auto"})
    target_config = LANG_CONFIG.get(target_lang)
    
    # If a language isn't supported, fallback to hi-IN
    if not target_config:
        print(f"Warning: Target language {target_lang} not mapped. Defaulting to hi-IN.")
        target_config = {"code": "hi-IN", "mode": "modern-colloquial"}

    target_lang_code = target_config["code"]
    translation_mode = target_config["mode"]
    source_lang_code = source_config["code"]

    translated_segments = []
    
    for seg in segments:
        original_text = seg.get("text", "").strip()
        if not original_text:
            translated_segments.append({
                "start": seg["start"],
                "end": seg["end"],
                "text": ""
            })
            continue

        # Check character limit
        chunks = split_text_if_needed(original_text, 900)
        translated_chunks = []
        has_error = False
        
        for chunk in chunks:
            try:
                def do_translate(c):
                    return client.text.translate(
                        input=c,
                        source_language_code=source_lang_code,
                        target_language_code=target_lang_code,
                        model="mayura:v1",
                        mode=translation_mode,
                        speaker_gender="Male"
                    )
                    
                response = await asyncio.to_thread(do_translate, chunk)
                translated_chunks.append(response.translated_text)
            except Exception as e:
                print(f"Translation error for chunk '{chunk}': {e}")
                has_error = True
                # Fallback to original text on failure
                translated_chunks.append(chunk)
                
        segment_data = {
            "start": seg["start"],
            "end": seg["end"],
            "text": " ".join(translated_chunks)
        }
        if has_error:
            segment_data["translation_failed"] = True
            
        translated_segments.append(segment_data)
            
    return translated_segments
