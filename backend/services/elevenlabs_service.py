import os
import httpx
from typing import Optional

# Base URL for ElevenLabs API
ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"

def get_api_key() -> str:
    key = os.getenv("ELEVENLABS_API_KEY")
    if not key:
        print("WARNING: ELEVENLABS_API_KEY is not set. API calls will fail.")
    return key or ""

def clone_voice(name: str, description: str, audio_file_path: str) -> str:
    """
    Creates an Instant Voice Clone in ElevenLabs using the provided audio file.
    Returns the new voice_id.
    """
    api_key = get_api_key()
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY is missing.")
        
    url = f"{ELEVENLABS_API_URL}/voices/add"
    headers = {
        "xi-api-key": api_key,
    }
    
    with open(audio_file_path, "rb") as f:
        files = {
            "files": (os.path.basename(audio_file_path), f, "audio/wav")
        }
        data = {
            "name": name,
            "description": description
        }
        
        # We must use httpx.post with files directly for multipart/form-data
        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, headers=headers, data=data, files=files)
            
            if response.status_code != 200:
                raise Exception(f"ElevenLabs voice clone failed: {response.text}")
                
            resp_data = response.json()
            return resp_data.get("voice_id")

def generate_dubbed_segment(text: str, voice_id: str) -> bytes:
    """
    Generates TTS audio using a custom cloned voice ID.
    Returns raw WAV audio bytes.
    """
    api_key = get_api_key()
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY is missing.")
        
    url = f"{ELEVENLABS_API_URL}/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg" # ElevenLabs defaults to MP3
    }
    
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    
    with httpx.Client(timeout=30.0) as client:
        response = client.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise Exception(f"ElevenLabs TTS failed: {response.text}")
            
        return response.content
