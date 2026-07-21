import os
import base64
from sarvamai import SarvamAI


def get_client() -> SarvamAI:
    api_key = os.environ.get("SARVAM_API_KEY", "")
    if not api_key or api_key == "your_sarvam_api_key_here":
        raise ValueError("SARVAM_API_KEY is missing or invalid.")
    return SarvamAI(api_subscription_key=api_key)


# Pre-built speaker voices available in the Sarvam SDK
AVAILABLE_SPEAKERS = [
    "anushka", "abhilash", "manisha", "vidya", "arya", "karun", "hitesh",
    "aditya", "ritu", "priya", "neha", "rahul", "pooja", "rohan", "simran",
    "kavya", "amit", "dev", "ishita", "shreya", "ratan", "varun", "manan",
    "sumit", "roopa", "kabir", "aayan", "shubh", "ashutosh", "advait",
    "anand", "tanya", "tarun", "sunny", "mani", "gokul", "vijay", "shruti",
    "suhani", "mohit", "kavitha", "rehan", "soham", "rupali"
]

# Default speaker for dubbing
DEFAULT_SPEAKER = "anushka"


def generate_dubbed_segment(text: str, language_code: str, speaker: str = DEFAULT_SPEAKER) -> bytes:
    """Returns raw WAV audio bytes for one caption segment's translated text.
    
    Uses the Sarvam Bulbul TTS model with a pre-built speaker voice.
    The SDK `convert` method expects `inputs` as a list of strings.
    """
    client = get_client()
    response = client.text_to_speech.convert(
        inputs=[text],
        target_language_code=language_code,
        speaker=speaker,
        model="bulbul:v2",
        pace=1.0,
    )
    if hasattr(response, 'audios') and response.audios:
        return base64.b64decode(response.audios[0])
    else:
        raise Exception("Unrecognized response format from Sarvam TTS convert")


def transcribe(audio_file, language_code: str) -> dict:
    """Transcribe audio using Sarvam STT."""
    client = get_client()
    return client.speech_to_text.transcribe(
        file=audio_file, model="saaras:v2", language_code=language_code,
    )
