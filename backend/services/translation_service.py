"""
Translation Service using Google Gemini API.
Supports translation between Indian languages.
"""

import os
import asyncio
from typing import Optional

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# Language names mapping for prompt context
LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "te": "Telugu",
    "ta": "Tamil",
    "kn": "Kannada",
    "ml": "Malayalam",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "or": "Odia",
    "ur": "Urdu",
    "as": "Assamese",
}


async def translate_batch(texts: list[str], target_language: str) -> list[str]:
    """
    Translates a batch of texts using Gemini.
    Includes basic retry logic with backoff for 429 rate-limit errors.
    """
    # Initialize the specific model version requested
    model = genai.GenerativeModel("gemini-3-flash")
    
    # We use a unique delimiter to batch multiple segments into a single prompt
    delimiter = "\n\n|||\n\n"
    combined_text = delimiter.join(texts)
    
    prompt = (
        f"Translate the following subtitle text to {target_language}. \n"
        "Return only the translated text, no explanation, no extra formatting.\n"
        "Maintain the exact same number of segments, separated by the delimiter |||.\n"
        f"Text: {combined_text}"
    )
    
    max_retries = 4
    base_delay = 5.0
    
    for attempt in range(max_retries):
        try:
            response = await model.generate_content_async(prompt)
            translated = response.text
            
            # Split the translated text back into segments
            parts = translated.split("|||")
            parts = [p.strip() for p in parts]
            
            # If the count matches, the batch was successful
            if len(parts) == len(texts):
                return parts
            else:
                raise ValueError(f"Mismatch in segment count. Expected {len(texts)}, got {len(parts)}.")
                
        except Exception as e:
            error_str = str(e).lower()
            
            # Check for rate limits (429 Too Many Requests)
            if "429" in error_str or "quota" in error_str or "rate" in error_str:
                if attempt < max_retries - 1:
                    await asyncio.sleep(base_delay * (2 ** attempt))
                    continue
                    
            if attempt == max_retries - 1:
                print(f"Translation batch failed after {max_retries} attempts: {e}")
                # Fallback to returning the original text if all retries fail
                return texts
            
            # Minor delay for non-429 transient errors
            await asyncio.sleep(2.0)
            
    return texts


async def translate_segments(
    segments: list[dict],
    source_lang: str,
    target_lang: str,
) -> list[dict]:
    """
    Translate a list of subtitle segments.
    Processes in batches to stay within free-tier rate limits (10 RPM).
    
    Args:
        segments: List of {"start": float, "end": float, "text": str}
        source_lang: Source language code.
        target_lang: Target language code.
    
    Returns:
        List of translated segments with same timestamps.
    """
    target_language_name = LANGUAGE_NAMES.get(target_lang, target_lang)
    
    batch_size = 15  # Process 15 segments per request
    translated_segments = []
    
    for i in range(0, len(segments), batch_size):
        batch = segments[i:i + batch_size]
        texts = [seg["text"] for seg in batch]
        
        translated_texts = await translate_batch(texts, target_language_name)
        
        for j, seg in enumerate(batch):
            t_text = translated_texts[j] if j < len(translated_texts) else seg["text"]
            translated_segments.append({
                "start": seg["start"],
                "end": seg["end"],
                "text": t_text
            })
            
        # Add a delay between batches to respect the 10 Requests Per Minute limit (6s per request)
        if i + batch_size < len(segments):
            await asyncio.sleep(6.1)
            
    return translated_segments


def get_supported_languages() -> list[dict]:
    """Return list of supported languages."""
    return [
        {"code": code, "name": name}
        for code, name in LANGUAGE_NAMES.items()
    ]
