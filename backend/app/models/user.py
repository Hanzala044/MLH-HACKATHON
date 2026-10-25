import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import synonym
from app.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    currency_pref = Column(String(3), nullable=False, default="INR")
    country = Column(String(2), nullable=False, default="IN")
    model_mode = Column(String, nullable=False, default="cloud")
    retention_days = Column(Integer, nullable=False, default=365)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    # Allow default_currency as an alias
    default_currency = synonym("currency_pref")
