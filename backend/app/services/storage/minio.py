import os
from app.observability.logger import get_logger

logger = get_logger(__name__)

try:
    import boto3
    from botocore.client import Config
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    boto3 = None
    Config = None

MINIO_URL = os.getenv("MINIO_URL", "")
MINIO_ACCESS_KEY = os.getenv("MINIO_ROOT_USER", "admin")
MINIO_SECRET_KEY = os.getenv("MINIO_ROOT_PASSWORD", "password")
BUCKET_NAME = "documents"

class MinioStorageService:
    def __init__(self):
        self.s3 = None
        self.enabled = False
        
        if BOTO3_AVAILABLE and MINIO_URL:
            try:
                self.s3 = boto3.client(
                    's3',
                    endpoint_url=MINIO_URL,
                    aws_access_key_id=MINIO_ACCESS_KEY,
                    aws_secret_access_key=MINIO_SECRET_KEY,
                    config=Config(signature_version='s3v4'),
                    region_name='us-east-1'
                )
                self.enabled = True
                # Lazy initialization: don't check bucket at import time
                logger.info("MinioStorageService initialized.")
            except Exception as e:
                logger.error(f"MinioStorageService failed to initialize: {e}")
        else:
            if os.getenv("USE_MOCK_STORAGE", "false").lower() == "true":
                logger.info("MinioStorageService disabled via USE_MOCK_STORAGE=true.")
            else:
                logger.warning("MinioStorageService disabled: boto3 missing or MINIO_URL not set.")
            
    def _ensure_bucket_exists(self):
        if not self.enabled or not self.s3:
            return
        try:
            self.s3.head_bucket(Bucket=BUCKET_NAME)
        except Exception:
            try:
                self.s3.create_bucket(Bucket=BUCKET_NAME)
            except Exception as e:
                logger.error(f"Failed to create bucket {BUCKET_NAME}: {e}")
            
    def upload_file(self, file_bytes: bytes, storage_path: str):
        if not self.enabled:
            logger.warning(f"Storage disabled. Mock upload for {storage_path}.")
            return storage_path
            
        self._ensure_bucket_exists()
        try:
            self.s3.put_object(
                Bucket=BUCKET_NAME,
                Key=storage_path,
                Body=file_bytes
            )
        except Exception as e:
            logger.error(f"Failed to upload {storage_path}: {e}")
        return storage_path
        
    def download_file(self, storage_path: str) -> bytes:
        if not self.enabled:
            logger.warning(f"Storage disabled. Mock download for {storage_path}.")
            return b""
            
        try:
            response = self.s3.get_object(Bucket=BUCKET_NAME, Key=storage_path)
            return response['Body'].read()
        except Exception as e:
            logger.error(f"Failed to download {storage_path}: {e}")
            return b""

minio_service = MinioStorageService()
