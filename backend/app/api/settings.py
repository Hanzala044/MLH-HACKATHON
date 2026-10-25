import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.config import get_settings
from app.db import get_db
from app.models.receipt import Receipt
from app.models.user import User
from app.security import get_current_user_id
from app.services.storage import get_storage_service

router = APIRouter(prefix="/settings", tags=["settings"])


class SettingsUpdate(BaseModel):
    full_name: Optional[str] = None
    default_currency: Optional[str] = None
    country: Optional[str] = None
    model_mode: Optional[str] = None
    gemini_api_key: Optional[str] = None
    ollama_url: Optional[str] = None


@router.get("")
def get_user_settings(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    settings = get_settings()
    return {
        "full_name": user.full_name,
        "email": user.email,
        "default_currency": user.default_currency,
        "country": user.country,
        "model_mode": user.model_mode,
        "gemini_api_key_configured": bool(settings.gemini_api_key),
        "ollama_url": settings.ollama_url,
        "retention_days": user.retention_days
    }


@router.patch("")
def update_user_settings(
    req: SettingsUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.full_name is not None:
        user.full_name = req.full_name
    if req.default_currency is not None:
        user.default_currency = req.default_currency
    if req.country is not None:
        user.country = req.country
    if req.model_mode is not None:
        if req.model_mode in ["cloud", "local"]:
            user.model_mode = req.model_mode

    db.commit()
    db.refresh(user)

    return {"message": "Settings updated successfully", "model_mode": user.model_mode}


@router.post("/test-model")
def test_model_connection(
    mode: str = "cloud",
    user_id: str = Depends(get_current_user_id)
):
    settings = get_settings()
    if mode == "cloud":
        if not settings.gemini_api_key:
            return {"status": "warning", "message": "No GEMINI_API_KEY set. Running in demo fallback mode."}
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={settings.gemini_api_key}"
            with httpx.Client(timeout=10.0) as client:
                res = client.get(url)
                if res.status_code == 200:
                    return {"status": "success", "message": "Successfully connected to Google Gemini / Gemma 4 Cloud API."}
                return {"status": "error", "message": f"API returned status {res.status_code}: {res.text[:100]}"}
        except Exception as e:
            return {"status": "error", "message": f"Connection error: {e}"}

    elif mode == "local":
        try:
            url = f"{settings.ollama_url}/api/tags"
            with httpx.Client(timeout=5.0) as client:
                res = client.get(url)
                if res.status_code == 200:
                    return {"status": "success", "message": f"Successfully connected to local Ollama at {settings.ollama_url}."}
                return {"status": "error", "message": f"Ollama returned status {res.status_code}"}
        except Exception as e:
            return {"status": "error", "message": f"Could not reach Ollama at {settings.ollama_url}: {e}"}

    return {"status": "error", "message": "Unknown mode"}


@router.delete("/data")
def delete_all_user_data(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Permanently delete all receipts and stored files for user (FR-41, Flow E)."""
    receipts = db.query(Receipt).filter(Receipt.user_id == user_id).all()
    storage = get_storage_service()
    deleted_count = len(receipts)

    for r in receipts:
        storage.delete_file(r.file_key)
        db.delete(r)

    db.commit()
    return {"message": f"Successfully purged all {deleted_count} receipt records and files."}


@router.get("/database")
def get_database_info(db: Session = Depends(get_db)):
    """Returns database connection status, provider, and statistics."""
    settings = get_settings()
    raw_url = settings.database_url or ""
    is_supabase = "supabase" in raw_url.lower()

    # Mask credentials for display
    host = "localhost"
    try:
        if "@" in raw_url:
            host = raw_url.split("@")[1].split("/")[0]
    except Exception:
        pass

    try:
        user_count = db.query(User).count()
        receipt_count = db.query(Receipt).count()
        status = "connected"
    except Exception as e:
        status = f"error: {e}"
        user_count = 0
        receipt_count = 0

    return {
        "status": status,
        "is_supabase": is_supabase,
        "provider": "Supabase Managed PostgreSQL" if is_supabase else "PostgreSQL Database",
        "host": host,
        "user_count": user_count,
        "receipt_count": receipt_count,
        "pooler_port": "6543 (Transaction Mode)" if ":6543" in raw_url else "5432 (Session/Direct)",
        "ssl": "require" in raw_url.lower() or is_supabase
    }
