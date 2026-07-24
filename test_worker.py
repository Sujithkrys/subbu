import os
import sys
import asyncio
from dotenv import load_dotenv

load_dotenv('.env')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from db.supabase_client import get_supabase
from services.asr_service import detect_language

sb = get_supabase()

# get the most recent project
res = sb.table("projects").select("*").order("created_at", desc=True).limit(1).execute()
if not res.data:
    print("No projects found.")
    sys.exit(0)

project = res.data[0]
print(f"Project: {project['id']}")

# get the failed job
jobs = sb.table("jobs").select("*").eq("project_id", project["id"]).execute()
job = next((j for j in jobs.data if j["type"] == "transcribe"), None)
if not job:
    print("No transcription job found")
    sys.exit(1)

# mock the request to the worker
class MockRequest:
    async def json(self):
        return {
            "project_id": project["id"],
            "job_id": job["id"],
            "word_timestamps": True
        }

from workers.transcribe_worker import process_transcription

async def main():
    req = MockRequest()
    try:
        await process_transcription(req)
        print("Transcription successful!")
    except Exception as e:
        print("Error during transcription:", e)
        import traceback
        traceback.print_exc()

asyncio.run(main())
