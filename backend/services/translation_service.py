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
    "en": {"code": "en-IN", "mode": "formal"},
    "hi": {"code": "hi-IN", "mode": "formal"},
    "te": {"code": "te-IN", "mode": "formal"},
    "ta": {"code": "ta-IN", "mode": "formal"},
    "kn": {"code": "kn-IN", "mode": "formal"},
    "ml": {"code": "ml-IN", "mode": "formal"},
    "bn": {"code": "bn-IN", "mode": "formal"},
    "mr": {"code": "mr-IN", "mode": "formal"},
    "gu": {"code": "gu-IN", "mode": "formal"},
    "pa": {"code": "pa-IN", "mode": "formal"},
    
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

def _split_segment(text: str, start: float, end: float, max_len: int = 80) -> list[dict]:
    """Recursively split a segment if its text exceeds max_len."""
    if len(text) <= max_len:
        return [{"start": start, "end": end, "text": text}]
        
    # Find natural split point near midpoint
    mid = len(text) // 2
    
    # Try to find punctuation near mid
    split_idx = -1
    search_radius = min(mid, 30)
    
    # Look for punctuation first
    for i in range(max(0, mid - search_radius), min(len(text), mid + search_radius)):
        if text[i] in [',', '.', '?', '!', ';', '।']:
            split_idx = i + 1
            break
            
    # Fallback to space
    if split_idx == -1:
        for i in range(mid, 0, -1):
            if text[i] == ' ':
                split_idx = i
                break
                
    # Force split if no space/punctuation found
    if split_idx == -1 or split_idx == 0 or split_idx >= len(text):
        split_idx = mid
        
    part1 = text[:split_idx].strip()
    part2 = text[split_idx:].strip()
    
    # Avoid infinite recursion if strip() didn't reduce length
    if len(part1) == len(text) or len(part2) == len(text):
        return [{"start": start, "end": end, "text": text}]
        
    # Proportionally split timestamps
    duration = end - start
    ratio = len(part1) / max(1, len(text))
    mid_time = start + (duration * ratio)
    
    result = []
    result.extend(_split_segment(part1, round(start, 3), round(mid_time, 3), max_len))
    result.extend(_split_segment(part2, round(mid_time, 3), round(end, 3), max_len))
    return result

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
                    print(f"[DIAGNOSTIC TRANSLATION] Sending to Sarvam:\n  input: '{c}'\n  source: {source_lang_code}\n  target: {target_lang_code}\n  mode: {translation_mode}")
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
                
        full_text = " ".join(translated_chunks).strip()
        
        sub_segments = _split_segment(full_text, seg["start"], seg["end"], 80)
        
        for sub_seg in sub_segments:
            if has_error:
                sub_seg["translation_failed"] = True
            translated_segments.append(sub_seg)
            
    return translated_segments
