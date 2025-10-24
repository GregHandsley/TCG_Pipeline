import os
from pydantic import BaseModel

class Settings(BaseModel):
    # Postgres (not used yet in Sprint 1, but keep for consistency)
    postgres_user: str = os.getenv("POSTGRES_USER", "postgres")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "password")
    postgres_db: str = os.getenv("POSTGRES_DB", "tcg_pipeline")
    postgres_host: str = os.getenv("POSTGRES_HOST", "db")
    postgres_port: int = int(os.getenv("POSTGRES_PORT", "5432"))

    # MinIO
    minio_endpoint: str = os.getenv("MINIO_ENDPOINT", "minio:9000")
    minio_bucket: str = os.getenv("MINIO_BUCKET", "cards")
    minio_access_key: str = os.getenv("MINIO_ROOT_USER", "minioadmin")
    minio_secret_key: str = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
    minio_use_ssl: bool = os.getenv("MINIO_USE_SSL", "false").lower() == "true"

    # External APIs (later sprints)
    ximilar_api_key: str = os.getenv("XIMILAR_API_KEY", "")
    ximilar_base: str = os.getenv("XIMILAR_BASE", "https://api.ximilar.com")

    # LLM (later)
    llm_provider: str = os.getenv("LLM_PROVIDER", "stub")
    llm_api_key: str = os.getenv("LLM_API_KEY", "")

    # Confidence threshold (used in later sprints)
    id_confidence_threshold: float = float(os.getenv("ID_CONFIDENCE_THRESHOLD", "0.88"))

    # LLM (OpenAI)
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    llm_model: str = os.getenv("LLM_MODEL", "gpt-4o-mini")

    shipping_info: str = os.getenv("SHIPPING_INFO", "Dispatched within 24 hours via tracked service.")
    returns_policy: str = os.getenv("RETURNS_POLICY", "30-day returns accepted; buyer pays return postage unless item is not as described.")

settings = Settings()