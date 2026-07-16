"""
Queue Service using Upstash QStash.
Enqueues background jobs that trigger worker HTTP endpoints.
"""

import os
from typing import Optional

from qstash import QStash
from dotenv import load_dotenv

load_dotenv()

_qstash_client = None


def get_qstash_client() -> QStash:
    """Get or create the QStash client."""
    global _qstash_client
    if _qstash_client is None:
        token = os.getenv("UPSTASH_QSTASH_TOKEN")
        if not token:
            raise ValueError("UPSTASH_QSTASH_TOKEN must be set")
        _qstash_client = QStash(token)
    return _qstash_client


def enqueue_job(
    worker_path: str,
    payload: dict,
    retries: int = 3,
    delay: Optional[str] = None,
) -> str:
    """
    Enqueue a job to be processed by a worker endpoint.
    
    Args:
        worker_path: The worker endpoint path (e.g., '/workers/transcribe').
        payload: JSON payload to send to the worker.
        retries: Number of retries on failure.
        delay: Optional delay before processing (e.g., '5s', '1m').
    
    Returns:
        QStash message ID.
    """
    client = get_qstash_client()
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    url = f"{backend_url}{worker_path}"

    kwargs = {
        "url": url,
        "body": payload,
        "retries": retries,
    }
    if delay:
        kwargs["delay"] = delay

    response = client.message.publish_json(**kwargs)
    return response.message_id


def enqueue_transcribe(project_id: str, job_id: str, source_language: str = None) -> str:
    """Enqueue a transcription job."""
    payload = {
        "project_id": project_id,
        "job_id": job_id,
    }
    if source_language:
        payload["source_language"] = source_language
    return enqueue_job("/workers/transcribe", payload)


def enqueue_translate(
    project_id: str,
    job_id: str,
    transcript_id: str,
    source_language: str,
    target_language: str,
) -> str:
    """Enqueue a translation job."""
    return enqueue_job("/workers/translate", {
        "project_id": project_id,
        "job_id": job_id,
        "transcript_id": transcript_id,
        "source_language": source_language,
        "target_language": target_language,
    })


def enqueue_render(
    project_id: str,
    job_id: str,
    transcript_id: str,
    export_format: str,
    burn_in: bool = False,
) -> str:
    """Enqueue a render/export job."""
    return enqueue_job("/workers/render", {
        "project_id": project_id,
        "job_id": job_id,
        "transcript_id": transcript_id,
        "format": export_format,
        "burn_in": burn_in,
    })
