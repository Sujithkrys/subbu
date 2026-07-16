"""
Cloudflare R2 Storage Service (S3-compatible).
Handles presigned URL generation, file upload/download.
"""

import os
from typing import Optional

import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv()

_s3_client = None


def get_s3_client():
    """Get or create the S3 client configured for Cloudflare R2."""
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=os.getenv("R2_ENDPOINT"),
            aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
            region_name="auto",
            config=Config(signature_version="s3v4"),
        )
    return _s3_client


def generate_upload_url(key: str, content_type: str = "video/mp4", expires_in: int = 3600) -> str:
    """
    Generate a presigned PUT URL for uploading a file to R2.
    
    Args:
        key: The R2 object key (path in bucket).
        content_type: MIME type of the file.
        expires_in: URL expiration in seconds (default 1 hour).
    
    Returns:
        Presigned URL string.
    """
    s3 = get_s3_client()
    url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": os.getenv("R2_BUCKET_NAME"),
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in,
    )
    return url


def generate_download_url(key: str, expires_in: int = 3600) -> str:
    """
    Generate a presigned GET URL for downloading a file from R2.
    
    Args:
        key: The R2 object key.
        expires_in: URL expiration in seconds.
    
    Returns:
        Presigned URL string.
    """
    s3 = get_s3_client()
    url = s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": os.getenv("R2_BUCKET_NAME"),
            "Key": key,
        },
        ExpiresIn=expires_in,
    )
    return url


def upload_file(key: str, file_path: str, content_type: Optional[str] = None) -> None:
    """Upload a local file to R2."""
    s3 = get_s3_client()
    extra_args = {}
    if content_type:
        extra_args["ContentType"] = content_type
    s3.upload_file(
        file_path,
        os.getenv("R2_BUCKET_NAME"),
        key,
        ExtraArgs=extra_args,
    )


def upload_fileobj(key: str, file_obj, content_type: Optional[str] = None) -> None:
    """Upload a file object to R2."""
    s3 = get_s3_client()
    extra_args = {}
    if content_type:
        extra_args["ContentType"] = content_type
    s3.upload_fileobj(
        file_obj,
        os.getenv("R2_BUCKET_NAME"),
        key,
        ExtraArgs=extra_args,
    )


def download_file(key: str, local_path: str) -> None:
    """Download a file from R2 to a local path."""
    s3 = get_s3_client()
    s3.download_file(
        os.getenv("R2_BUCKET_NAME"),
        key,
        local_path,
    )


def delete_file(key: str) -> None:
    """Delete a file from R2."""
    s3 = get_s3_client()
    s3.delete_object(
        Bucket=os.getenv("R2_BUCKET_NAME"),
        Key=key,
    )
