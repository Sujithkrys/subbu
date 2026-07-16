"""
Translation Service using Bhashini API (Government of India).
Supports translation between Indian languages via NMT pipeline.
"""

import os
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

# Bhashini API endpoints
BHASHINI_PIPELINE_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"
BHASHINI_COMPUTE_URL_TEMPLATE = None  # Will be set from pipeline response

# Language code mapping for Bhashini
LANGUAGE_CODES = {
    "en": "en",
    "hi": "hi",
    "te": "te",
    "ta": "ta",
    "kn": "kn",
    "ml": "ml",
    "bn": "bn",
    "mr": "mr",
    "gu": "gu",
    "pa": "pa",
    "or": "or",
    "ur": "ur",
    "as": "as",
}

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


async def _get_pipeline_config(source_lang: str, target_lang: str) -> dict:
    """
    Get the NMT pipeline configuration from Bhashini.
    Returns the service URL and model config needed for translation.
    """
    user_id = os.getenv("BHASHINI_USER_ID")
    ulca_api_key = os.getenv("BHASHINI_ULCA_API_KEY")

    if not user_id or not ulca_api_key:
        raise ValueError("BHASHINI_USER_ID and BHASHINI_ULCA_API_KEY must be set")

    payload = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": source_lang,
                        "targetLanguage": target_lang,
                    }
                },
            }
        ],
        "pipelineRequestConfig": {
            "pipelineId": "64392f96daac500b55c543cd"
        },
    }

    headers = {
        "Content-Type": "application/json",
        "userID": user_id,
        "ulcaApiKey": ulca_api_key,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(BHASHINI_PIPELINE_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

    # Extract the compute URL and model config
    pipeline_config = data.get("pipelineResponseConfig", [{}])[0]
    service_url = pipeline_config.get("serviceUrl", "")

    model_config = data.get("pipelineInferenceAPIEndPoint", {})
    inference_url = model_config.get("callbackUrl", service_url)
    inference_key = model_config.get("inferenceApiKey", {}).get("value", "")

    # Get the translation model service ID
    translation_config = None
    for task_config in data.get("pipelineResponseConfig", []):
        if task_config.get("taskType") == "translation":
            translation_config = task_config
            break

    return {
        "inference_url": inference_url,
        "inference_key": inference_key or os.getenv("BHASHINI_INFERENCE_API_KEY", ""),
        "service_id": translation_config.get("config", [{}])[0].get("serviceId", "") if translation_config else "",
    }


async def translate_text(
    text: str,
    source_lang: str,
    target_lang: str,
    pipeline_config: Optional[dict] = None,
) -> str:
    """
    Translate a single text string using Bhashini NMT.
    
    Args:
        text: Text to translate.
        source_lang: Source language code (e.g., 'en').
        target_lang: Target language code (e.g., 'hi').
        pipeline_config: Pre-fetched pipeline config (optional, to avoid re-fetching).
    
    Returns:
        Translated text string.
    """
    if not pipeline_config:
        pipeline_config = await _get_pipeline_config(source_lang, target_lang)

    payload = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": source_lang,
                        "targetLanguage": target_lang,
                    },
                    "serviceId": pipeline_config["service_id"],
                },
            }
        ],
        "inputData": {
            "input": [{"source": text}]
        },
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": pipeline_config["inference_key"],
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            pipeline_config["inference_url"],
            json=payload,
            headers=headers,
        )
        response.raise_for_status()
        data = response.json()

    # Extract translated text
    output = data.get("pipelineResponse", [{}])[0]
    translated = output.get("output", [{}])[0].get("target", text)
    return translated


async def translate_segments(
    segments: list[dict],
    source_lang: str,
    target_lang: str,
) -> list[dict]:
    """
    Translate a list of subtitle segments.
    
    Args:
        segments: List of {"start": float, "end": float, "text": str}
        source_lang: Source language code.
        target_lang: Target language code.
    
    Returns:
        List of translated segments with same timestamps.
    """
    # Fetch pipeline config once for all translations
    pipeline_config = await _get_pipeline_config(source_lang, target_lang)

    translated_segments = []
    for segment in segments:
        try:
            translated_text = await translate_text(
                text=segment["text"],
                source_lang=source_lang,
                target_lang=target_lang,
                pipeline_config=pipeline_config,
            )
            translated_segments.append({
                "start": segment["start"],
                "end": segment["end"],
                "text": translated_text,
            })
        except Exception as e:
            # On failure, keep original text with error marker
            print(f"Translation error for segment: {e}")
            translated_segments.append({
                "start": segment["start"],
                "end": segment["end"],
                "text": segment["text"],
            })

    return translated_segments


def get_supported_languages() -> list[dict]:
    """Return list of supported languages."""
    return [
        {"code": code, "name": name}
        for code, name in LANGUAGE_NAMES.items()
    ]
