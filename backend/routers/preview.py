from fastapi import APIRouter
from fastapi.responses import Response
from services.sarvam_service import generate_dubbed_segment, DEFAULT_SPEAKER

preview_router = APIRouter(tags=['preview'])

@preview_router.get('/projects/preview-voice')
async def preview_voice(speaker: str = DEFAULT_SPEAKER, lang: str = 'hi'):
    try:
        LANG_MAP = {
            'hi': 'hi-IN', 'te': 'te-IN', 'ta': 'ta-IN', 'ml': 'ml-IN', 
            'kn': 'kn-IN', 'bn': 'bn-IN', 'mr': 'mr-IN', 'gu': 'gu-IN', 
            'pa': 'pa-IN', 'en': 'en-IN'
        }
        sarvam_lang = LANG_MAP.get(lang, 'hi-IN')
        text = 'This is a sample of my voice.'
        audio_bytes = generate_dubbed_segment(text, sarvam_lang, speaker)
        return Response(content=audio_bytes, media_type='audio/wav')
    except Exception as e:
        print(f'Preview failed: {e}')
        return Response(content=b'', status_code=500)
