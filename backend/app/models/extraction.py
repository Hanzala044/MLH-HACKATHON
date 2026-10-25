import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Numeric, Integer, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db import Base


class ExtractedReceipt(Base):
    __tablename__ = "extracted_receipts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_id = Column(UUID(as_uuid=True), ForeignKey("receipts.id", ondelete="CASCADE"), nullable=False, unique=True)
    document_type = Column(String, nullable=False, default="unknown")
    vendor = Column(String, nullable=True)
    vendor_normalized = Column(String, nullable=True)
    invoice_number = Column(String, nullable=True)
    receipt_date = Column(Date, nullable=True)
    currency = Column(String(3), nullable=True)
    subtotal = Column(Numeric(14, 2), nullable=True)
    tax_type = Column(String, nullable=True)
    tax_rate = Column(Numeric(5, 2), nullable=True)
    tax_amount = Column(Numeric(14, 2), nullable=True)
    total = Column(Numeric(14, 2), nullable=True)
    payment_method = Column(String, nullable=True)
    payment_status = Column(String, nullable=False, default="unknown")
    category = Column(String, nullable=False, default="Other")
    business_expense = Column(Boolean, nullable=False, default=True)
    line_items = Column(JSONB, nullable=False, default=list)
    confidence = Column(Numeric(3, 2), nullable=True)
    completeness_score = Column(Integer, nullable=True)
    needs_review = Column(Boolean, nullable=False, default=False)
    review_reason = Column(String, nullable=True)
    warnings = Column(JSONB, nullable=False, default=list)
    model_output_json = Column(JSONB, nullable=False, default=dict)
    user_edited_json = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationship
    receipt = relationship("Receipt", back_populates="extraction")
