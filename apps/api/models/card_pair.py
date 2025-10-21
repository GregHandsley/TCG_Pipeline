from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, JSON, TIMESTAMP, text
from datetime import datetime
from .base import Base

class CardPair(Base):
    __tablename__ = "card_pairs"

    # UUID string or any unique id you prefer (we’ll store UUID as str)
    id: Mapped[str] = mapped_column(String, primary_key=True)

    # MinIO keys for originals
    front_key: Mapped[str] = mapped_column(String, nullable=False)
    back_key: Mapped[str] = mapped_column(String, nullable=False)

    # JSON blobs (nullable until processed)
    id_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    grade_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    listing_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # lifecycle: uploaded|processed|needs_manual
    status: Mapped[str] = mapped_column(String, nullable=False, default="uploaded")

    # server-side timestamp
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=False),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )