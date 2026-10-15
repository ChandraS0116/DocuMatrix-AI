import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENV: str = os.getenv("ENV", "development")
    
    # Secrets isolation
    POSTGRES_URL: str = os.getenv("POSTGRES_URL", "postgresql://postgres:postgres@db:5432/docintel")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    ELASTICSEARCH_URL: str = os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")
    MINIO_URL: str = os.getenv("MINIO_URL", "http://minio:9000")
    
    # Tenant-safe runtime limits
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", 50))
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", 100))
    
    # Model Registry
    MLFLOW_TRACKING_URI: str = os.getenv("MLFLOW_TRACKING_URI", "http://mlflow:5000")

    class Config:
        env_file = ".env"

settings = Settings()
