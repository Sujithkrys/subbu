import os
import sys
from dotenv import load_dotenv

load_dotenv('.env')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.queue_service import enqueue_transcribe

try:
    message_id = enqueue_transcribe(
        project_id="65be72c6-3940-4b04-8b51-eaeaf55f0072",
        job_id="test-job",
        source_language=None
    )
    print("Success! Message ID:", message_id)
except Exception as e:
    import traceback
    traceback.print_exc()
    print("Error during enqueue:", e)
