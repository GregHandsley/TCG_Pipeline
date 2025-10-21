from io import BytesIO
from minio import Minio
from minio.error import S3Error
from core.settings import settings

_client = Minio(
    settings.minio_endpoint,
    access_key=settings.minio_access_key,
    secret_key=settings.minio_secret_key,
    secure=settings.minio_use_ssl,
)

def ensure_bucket(bucket: str | None = None) -> None:
    """Create bucket if missing."""
    bucket = bucket or settings.minio_bucket
    found = _client.bucket_exists(bucket)
    if not found:
        _client.make_bucket(bucket)

def put_bytes(key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
    """Upload a small blob by bytes."""
    ensure_bucket()
    _client.put_object(
        settings.minio_bucket,
        key,
        data=BytesIO(data),
        length=len(data),
        content_type=content_type,
    )

def get_bytes(key: str) -> bytes:
    """Download entire object as bytes."""
    ensure_bucket()
    resp = _client.get_object(settings.minio_bucket, key)
    try:
        return resp.read()
    finally:
        resp.close()
        resp.release_conn()