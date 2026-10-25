import datetime
import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Response, UploadFile, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.audit import AuditLog
from app.models.extraction import ExtractedReceipt
from app.models.receipt import Receipt, ReceiptStatus
from app.models.user import User
from app.schemas.receipt import ReceiptResponse, ReceiptUpdateRequest
from app.security import get_current_user_id
from app.services.extractor import process_receipt
from app.services.storage import LOCAL_STORAGE_DIR, get_storage_service

router = APIRouter(prefix="/receipts", tags=["receipts"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def serialize_receipt(r: Receipt, storage=None) -> ReceiptResponse:
    storage = storage or get_storage_service()
    ext = r.extraction
    data = {
        "id": str(r.id),
        "file_key": r.file_key,
        "file_type": r.file_type,
        "original_filename": r.original_filename,
        "user_note": r.user_note,
        "status": r.status.value,
        "error_message": r.error_message,
        "model_name": r.model_name,
        "model_mode": r.model_mode,
        "uploaded_at": r.uploaded_at,
        "processed_at": r.processed_at,
        "confirmed_at": r.confirmed_at,
        "file_url": storage.get_file_url(r.file_key)
    }

    if ext:
        data.update({
            "document_type": ext.document_type,
            "vendor": ext.vendor,
            "invoice_number": ext.invoice_number,
            "receipt_date": ext.receipt_date.isoformat() if ext.receipt_date else None,
            "currency": ext.currency,
            "subtotal": float(ext.subtotal) if ext.subtotal is not None else None,
            "tax_type": ext.tax_type,
            "tax_rate": float(ext.tax_rate) if ext.tax_rate is not None else None,
            "tax_amount": float(ext.tax_amount) if ext.tax_amount is not None else None,
            "total": float(ext.total) if ext.total is not None else None,
            "payment_method": ext.payment_method,
            "payment_status": ext.payment_status,
            "category": ext.category,
            "business_expense": ext.business_expense,
            "line_items": ext.line_items or [],
            "confidence": float(ext.confidence) if ext.confidence is not None else None,
            "completeness_score": ext.completeness_score,
            "needs_review": ext.needs_review,
            "review_reason": ext.review_reason,
            "warnings": ext.warnings or [],
            "model_output_json": ext.model_output_json
        })

    return ReceiptResponse(**data)


@router.post("", response_model=List[ReceiptResponse])
async def upload_receipts(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    note: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed per upload.")

    user = db.query(User).filter(User.id == user_id).first()
    storage = get_storage_service()
    created_receipts = []

    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File '{file.filename}' has unsupported extension {ext}. Allowed: JPG, PNG, WEBP, PDF.")

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File '{file.filename}' exceeds 10MB limit.")

        file_hash = storage.compute_sha256(content)
        file_id = uuid.uuid4()
        file_key = f"{user_id}/{file_id}{ext}"
        storage.save_file(file_key, content, content_type=file.content_type or "application/octet-stream")

        receipt = Receipt(
            id=file_id,
            user_id=user_id,
            file_key=file_key,
            file_type=file.content_type or "image/jpeg",
            original_filename=file.filename,
            file_hash=file_hash,
            user_note=note,
            status=ReceiptStatus.queued,
            model_mode=user.model_mode if user else "cloud"
        )
        db.add(receipt)
        db.commit()
        db.refresh(receipt)

        audit = AuditLog(receipt_id=receipt.id, action="uploaded", diff_json={"filename": file.filename, "size": len(content)})
        db.add(audit)
        db.commit()

        # Queue asynchronous extraction
        background_tasks.add_task(process_receipt, str(receipt.id))
        created_receipts.append(serialize_receipt(receipt, storage))

    return created_receipts


@router.get("", response_model=List[ReceiptResponse])
def list_receipts(
    status: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = db.query(Receipt).filter(Receipt.user_id == user_id)
    if status:
        if status == "processing":
            query = query.filter(Receipt.status.in_([ReceiptStatus.queued, ReceiptStatus.processing]))
        else:
            query = query.filter(Receipt.status == status)

    receipts = query.order_by(Receipt.uploaded_at.desc()).all()
    storage = get_storage_service()
    return [serialize_receipt(r, storage) for r in receipts]


@router.get("/{receipt_id}", response_model=ReceiptResponse)
def get_receipt(
    receipt_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id, Receipt.user_id == user_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return serialize_receipt(receipt)


@router.patch("/{receipt_id}", response_model=ReceiptResponse)
def update_receipt(
    receipt_id: str,
    req: ReceiptUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id, Receipt.user_id == user_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    ext = receipt.extraction
    if not ext:
        raise HTTPException(status_code=400, detail="Cannot edit receipt before extraction completes")

    edits = req.dict(exclude_unset=True)
    old_values = {}

    for k, v in edits.items():
        if k == "receipt_date" and v:
            try:
                parsed_d = datetime.date.fromisoformat(v[:10])
                old_values[k] = ext.receipt_date.isoformat() if ext.receipt_date else None
                ext.receipt_date = parsed_d
            except Exception:
                pass
        elif k == "user_note":
            receipt.user_note = v
        elif hasattr(ext, k):
            old_values[k] = getattr(ext, k)
            setattr(ext, k, v)

    # Save edit history
    ext.user_edited_json = edits
    if ext.vendor:
        ext.vendor_normalized = ext.vendor.strip().lower()

    # Re-check arithmetic
    if ext.subtotal is not None and ext.tax_amount is not None and ext.total is not None:
        if abs(float(ext.subtotal + ext.tax_amount) - float(ext.total)) <= 1.0:
            ext.warnings = [w for w in (ext.warnings or []) if "GST math" not in w]
            if not ext.warnings:
                ext.needs_review = False
                ext.review_reason = None

    audit = AuditLog(receipt_id=receipt.id, action="edited", diff_json={"before": old_values, "after": edits})
    db.add(audit)
    db.commit()
    db.refresh(receipt)
    return serialize_receipt(receipt)


@router.post("/{receipt_id}/confirm", response_model=ReceiptResponse)
def confirm_receipt(
    receipt_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id, Receipt.user_id == user_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    receipt.status = ReceiptStatus.confirmed
    receipt.confirmed_at = datetime.datetime.now(datetime.timezone.utc)
    if receipt.extraction:
        receipt.extraction.needs_review = False

    audit = AuditLog(receipt_id=receipt.id, action="confirmed", diff_json={"status": "confirmed"})
    db.add(audit)
    db.commit()
    db.refresh(receipt)
    return serialize_receipt(receipt)


@router.post("/{receipt_id}/retry", response_model=ReceiptResponse)
def retry_receipt(
    receipt_id: str,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id, Receipt.user_id == user_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    receipt.status = ReceiptStatus.queued
    receipt.error_message = None
    db.commit()

    background_tasks.add_task(process_receipt, str(receipt.id))
    return serialize_receipt(receipt)


@router.delete("/{receipt_id}")
def delete_receipt(
    receipt_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id, Receipt.user_id == user_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    file_key = receipt.file_key
    storage = get_storage_service()
    storage.delete_file(file_key)

    audit = AuditLog(receipt_id=receipt.id, action="deleted", diff_json={"file_key": file_key})
    db.add(audit)
    db.delete(receipt)
    db.commit()

    return {"message": "Receipt permanently deleted"}


@router.get("/file/{path:path}")
def serve_receipt_file(path: str):
    file_path = LOCAL_STORAGE_DIR / path
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    ext = file_path.suffix.lower()
    media_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".pdf": "application/pdf"
    }
    return FileResponse(file_path, media_type=media_types.get(ext, "application/octet-stream"))
