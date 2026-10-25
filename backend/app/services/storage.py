import hashlib
import logging
import os
import shutil
from pathlib import Path
from typing import Optional
from app.config import get_settings

logger = logging.getLogger(__name__)

LOCAL_STORAGE_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
LOCAL_STORAGE_DIR.mkdir(parents=True, exist_ok=True)


class StorageService:
    def __init__(self):
        self.settings = get_settings()
        self._s3_client = None
        self._use_s3 = False

        try:
            import boto3
            from botocore.client import Config

            if self.settings.spaces_key and self.settings.spaces_key != "minioadmin":
                self._s3_client = boto3.client(
                    "s3",
                    endpoint_url=self.settings.spaces_endpoint,
                    aws_access_key_id=self.settings.spaces_key,
                    aws_secret_access_key=self.settings.spaces_secret,
                    region_name=self.settings.spaces_region,
                    config=Config(signature_version="s3v4")
                )
                self._use_s3 = True
        except Exception as e:
            logger.info(f"Using local filesystem storage: {e}")

    @staticmethod
    def compute_sha256(content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()

    def save_file(self, file_key: str, content: bytes, content_type: str = "application/octet-stream") -> str:
        """Saves file to Spaces or local storage."""
        if self._use_s3 and self._s3_client:
            try:
                self._s3_client.put_object(
                    Bucket=self.settings.spaces_bucket,
                    Key=file_key,
                    Body=content,
                    ContentType=content_type
                )
                return file_key
            except Exception as e:
                logger.warning(f"S3 put failed, falling back to local: {e}")

        # Local filesystem fallback
        dest_path = LOCAL_STORAGE_DIR / file_key
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        dest_path.write_bytes(content)
        return file_key

    def get_file_bytes(self, file_key: str) -> bytes:
        """Reads raw bytes of file."""
        if self._use_s3 and self._s3_client:
            try:
                response = self._s3_client.get_object(Bucket=self.settings.spaces_bucket, Key=file_key)
                return response["Body"].read()
            except Exception as e:
                logger.warning(f"S3 get failed: {e}")

        dest_path = LOCAL_STORAGE_DIR / file_key
        if dest_path.exists():
            return dest_path.read_bytes()
        raise FileNotFoundError(f"File key not found: {file_key}")

    def get_file_url(self, file_key: str) -> str:
        """Generates signed URL for Spaces or local streaming URL."""
        if self._use_s3 and self._s3_client:
            try:
                url = self._s3_client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": self.settings.spaces_bucket, "Key": file_key},
                    ExpiresIn=self.settings.signed_url_ttl_seconds
                )
                return url
            except Exception as e:
                logger.warning(f"Could not generate signed URL: {e}")

        return f"/api/receipts/file/{file_key}"

    def delete_file(self, file_key: str) -> bool:
        """Deletes file permanently."""
        deleted = False
        if self._use_s3 and self._s3_client:
            try:
                self._s3_client.delete_object(Bucket=self.settings.spaces_bucket, Key=file_key)
                deleted = True
            except Exception as e:
                logger.warning(f"S3 delete failed: {e}")

        local_path = LOCAL_STORAGE_DIR / file_key
        if local_path.exists():
            local_path.unlink()
            deleted = True

        return deleted


_storage_instance = None


def get_storage_service() -> StorageService:
    global _storage_instance
    if _storage_instance is None:
        _storage_instance = StorageService()
    return _storage_instance
