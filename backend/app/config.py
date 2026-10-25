from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+psycopg2://postgres:dev@localhost:5432/receiptwise"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Object Storage (DigitalOcean Spaces / MinIO)
    spaces_endpoint: str = "http://localhost:9000"
    spaces_bucket: str = "receiptwise"
    spaces_key: str = "minioadmin"
    spaces_secret: str = "minioadmin"
    spaces_region: str = "us-east-1"
    signed_url_ttl_seconds: int = 900

    # Auth
    jwt_secret: str = "dev-secret-change-in-production-32bytes"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # AI Model
    model_mode: str = "cloud"  # cloud | local
    gemini_api_key: str = ""
    gemma_cloud_model: str = "gemma-4-31b-it"
    ollama_url: str = "http://localhost:11434"
    gemma_local_model: str = "gemma4:e4b"

    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        protected_namespaces = ()


@lru_cache()
def get_settings() -> Settings:
    return Settings()
