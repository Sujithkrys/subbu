import os
import sys
import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv('.env')

s3 = boto3.client(
    "s3",
    endpoint_url=os.getenv("R2_ENDPOINT"),
    aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
    region_name="auto",
    config=Config(signature_version="s3v4"),
)

bucket = os.getenv("R2_BUCKET_NAME")
key = "videos/4ab5513b-6dad-4c58-9cff-826fbb780e19/8052da44-307c-4f45-b842-4ae0460cf148.mp4"

try:
    print("Testing download without path style...")
    s3.head_object(Bucket=bucket, Key=key)
    print("Success without path style!")
except Exception as e:
    print("Failed without path style:", e)

s3_path = boto3.client(
    "s3",
    endpoint_url=os.getenv("R2_ENDPOINT"),
    aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
    region_name="auto",
    config=Config(signature_version="s3v4", s3={'addressing_style': 'path'}),
)

try:
    print("Testing download with path style...")
    s3_path.head_object(Bucket=bucket, Key=key)
    print("Success with path style!")
except Exception as e:
    print("Failed with path style:", e)
