import traceback
from services.asr_service import transcribe_audio

try:
    print("Testing Sarvam STT with language='unknown' on real audio")
    res = transcribe_audio('test.wav', language='unknown')
    print("Success!", len(res), "segments")
except Exception as e:
    traceback.print_exc()
