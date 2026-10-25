import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings

settings = get_settings()

db_url = settings.database_url or ""
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+psycopg2://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

connect_args = {}
if "supabase.com" in db_url or "supabase.co" in db_url:
    if "sslmode" not in db_url.lower():
        connect_args["sslmode"] = "require"
    if ":6543" in db_url:
        # Supabase transaction pooler (PgBouncer) does not support prepared statements
        connect_args["prepare_threshold"] = None

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    connect_args=connect_args,
    pool_recycle=300
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
