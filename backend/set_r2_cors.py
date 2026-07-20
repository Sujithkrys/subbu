import os
import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

s3 = boto3.client(
    "s3",
    endpoint_url=os.getenv("R2_ENDPOINT"),
    aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
    region_name="auto",
    config=Config(signature_version="s3v4"),
)

cors_configuration = {
    'CORSRules': [{
        'AllowedHeaders': ['*'],
        'AllowedMethods': ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        'AllowedOrigins': ['*'],
        'ExposeHeaders': ['ETag']
    }]
}

try:
    s3.put_bucket_cors(
        Bucket=os.getenv("R2_BUCKET_NAME"),
        CORSConfiguration=cors_configuration
    )
    print("Successfully updated CORS for R2 bucket!")
except Exception as e:
    print(f"Error updating CORS: {e}")
