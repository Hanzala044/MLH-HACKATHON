import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.db import Base


class ReceiptStatus(str, enum.Enum):
    queued = "queued"
    processing = "processing"
    ready = "ready"
    needs_review = "needs_review"
    failed = "failed"
    confirmed = "confirmed"


class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_key = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_hash = Column(String(64), nullable=False)
    user_note = Column(String, nullable=True)
    status = Column(SAEnum(ReceiptStatus), nullable=False, default=ReceiptStatus.queued)
    error_message = Column(String, nullable=True)
    model_name = Column(String, nullable=True)
    model_mode = Column(String, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime(timezone=True), nullable=True)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationship
    extraction = relationship("ExtractedReceipt", back_populates="receipt", uselist=False, cascade="all, delete-orphan")
