import os
from sarvamai import SarvamAI

def get_client() -> SarvamAI:
    api_key = os.environ.get("SARVAM_API_KEY", "")
    if not api_key or api_key == "your_sarvam_api_key_here":
        raise ValueError("SARVAM_API_KEY is missing or invalid.")
    return SarvamAI(api_subscription_key=api_key)

def create_voice(sample_file, consent_given: bool) -> str:
    """Returns a sarvam voice_id. Raises if consent_given is False — never call
    Sarvam's clone endpoint without explicit consent having been checked first."""
    if not consent_given:
        raise ValueError("Cannot clone a voice without explicit consent")
    client = get_client()
    voice = client.text_to_speech.create_voice(file=sample_file, consent_given=True)
    return voice.id

def generate_dubbed_segment(text: str, language_code: str, voice_id: str) -> bytes:
    """Returns raw audio bytes for one caption segment's translated text."""
    client = get_client()
    response = client.text_to_speech.convert(
        text=text, 
        target_language_code=language_code,
        speaker=voice_id, 
        model="bulbul:v3", 
        pace=1.0,
    )
    import base64
    if hasattr(response, 'audios') and response.audios:
        return base64.b64decode(response.audios[0])
    elif hasattr(response, 'audio'):
        return response.audio
    else:
        raise Exception("Unrecognized response format from Sarvam TTS convert")

def transcribe(audio_file, language_code: str) -> dict:
    """Optional — only used if the Sarvam STT comparison path is built."""
    client = get_client()
    return client.speech_to_text.transcribe(
        file=audio_file, model="saaras:v3", language_code=language_code,
    )
