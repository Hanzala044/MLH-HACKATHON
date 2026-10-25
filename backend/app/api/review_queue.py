from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.receipts import serialize_receipt
from app.db import get_db
from app.models.extraction import ExtractedReceipt
from app.models.receipt import Receipt, ReceiptStatus
from app.security import get_current_user_id

router = APIRouter(prefix="/review-queue", tags=["review-queue"])


@router.get("")
def get_review_queue(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    receipts = db.query(Receipt).filter(Receipt.user_id == user_id).all()

    needs_review_items = []
    duplicate_items = []
    gst_warning_items = []
    low_confidence_items = []

    for r in receipts:
        ext = r.extraction
        ser = serialize_receipt(r)

        if r.status == ReceiptStatus.needs_review:
            needs_review_items.append(ser)

        if ext:
            warnings = ext.warnings or []
            for w in warnings:
                if "duplicate" in w.lower():
                    duplicate_items.append(ser)
                    break
                if "gst math" in w.lower():
                    gst_warning_items.append(ser)
                    break

            if ext.confidence is not None and float(ext.confidence) < 0.85:
                low_confidence_items.append(ser)

    return {
        "needs_review": needs_review_items,
        "duplicates": duplicate_items,
        "gst_warnings": gst_warning_items,
        "low_confidence": low_confidence_items,
        "total_flagged": len(needs_review_items)
    }
