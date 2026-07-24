import os
import sys
from dotenv import load_dotenv

load_dotenv('.env')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from services.asr_service import get_groq_client

client = get_groq_client()

# Create a small dummy audio file to test detection
# wait, I can just use test_audio.wav which was already there from git status!
audio_path = "test_audio.wav"

if os.path.exists(audio_path):
    with open(audio_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=("test_audio.wav", audio_file.read()),
            model="whisper-large-v3",
            response_format="verbose_json",
            temperature=0.0,
        )
    print("Detected language:", getattr(transcription, "language", "None"))
else:
    print("test_audio.wav not found")
