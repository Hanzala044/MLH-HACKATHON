import datetime
import io
import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.ai import get_model_client
from app.db import SessionLocal
from app.models.audit import AuditLog
from app.models.extraction import ExtractedReceipt
from app.models.receipt import Receipt, ReceiptStatus
from app.models.user import User
from app.schemas.receipt import ALLOWED_CATEGORIES, Extraction
from app.services.storage import get_storage_service

logger = logging.getLogger(__name__)


def process_receipt(receipt_id: str, db: Optional[Session] = None):
    """Processes a receipt file asynchronously through Gemma 4 / Gemini."""
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
        if not receipt:
            logger.error(f"Receipt {receipt_id} not found")
            return

        receipt.status = ReceiptStatus.processing
        db.commit()

        storage = get_storage_service()
        file_bytes = storage.get_file_bytes(receipt.file_key)

        # Convert to image bytes list
        images = []
        if receipt.file_type.lower() in ["application/pdf", "pdf"]:
            try:
                from pdf2image import convert_from_bytes
                pil_images = convert_from_bytes(file_bytes, first_page=1, last_page=3)
                for pimg in pil_images:
                    buf = io.BytesIO()
                    pimg.save(buf, format="JPEG")
                    images.append(buf.getvalue())
            except Exception as e:
                logger.warning(f"PDF page conversion failed (poppler missing?): {e}. Treating as direct stream.")
                images = [file_bytes]
        else:
            images = [file_bytes]

        # In-context learning: retrieve previous vendor corrections
        vendor_corrections = []
        try:
            previous_edits = db.query(ExtractedReceipt).join(Receipt).filter(
                Receipt.user_id == receipt.user_id,
                ExtractedReceipt.user_edited_json.isnot(None)
            ).order_by(ExtractedReceipt.updated_at.desc()).limit(10).all()

            for ed in previous_edits:
                if ed.vendor and ed.category:
                    vendor_corrections.append({"vendor": ed.vendor, "category": ed.category})
        except Exception as e:
            logger.warning(f"Error fetching vendor corrections: {e}")

        # Call AI model
        client = get_model_client(receipt.model_mode)
        raw_extraction = None
        retries = 1

        for attempt in range(retries + 1):
            try:
                res = client.extract(
                    images=images,
                    note=receipt.user_note or "",
                    context={"corrections": vendor_corrections}
                )
                # Validate with Pydantic
                Extraction(**res)
                raw_extraction = res
                break
            except Exception as e:
                logger.warning(f"Extraction attempt {attempt+1} failed validation: {e}")
                if attempt == retries:
                    receipt.status = ReceiptStatus.failed
                    receipt.error_message = f"Schema validation failed: {e}"
                    db.commit()
                    return

        # Anomaly and Quality checks
        warnings = []
        total = raw_extraction.get("total")
        subtotal = raw_extraction.get("subtotal")
        tax_amount = raw_extraction.get("tax_amount")
        category = raw_extraction.get("category") or "Other"
        if category not in ALLOWED_CATEGORIES:
            category = "Other"

        # 1. GST Consistency Check
        if subtotal is not None and tax_amount is not None and total is not None:
            if abs((subtotal + tax_amount) - total) > 1.0:
                warnings.append(f"GST math discrepancy: Subtotal ({subtotal}) + Tax ({tax_amount}) != Total ({total})")

        # 2. Duplicate Detection
        receipt_date = raw_extraction.get("date")
        vendor = raw_extraction.get("vendor")
        if vendor and total and receipt_date:
            try:
                dup = db.query(ExtractedReceipt).join(Receipt).filter(
                    Receipt.user_id == receipt.user_id,
                    Receipt.id != receipt.id,
                    ExtractedReceipt.vendor.ilike(vendor),
                    ExtractedReceipt.total == total,
                    ExtractedReceipt.receipt_date == receipt_date
                ).first()
                if dup:
                    warnings.append(f"Possible duplicate receipt detected (matches receipt {str(dup.receipt_id)[:8]})")
            except Exception as e:
                logger.warning(f"Duplicate check error: {e}")

        # 3. Completeness Score (0 - 100)
        score = 100
        if not vendor: score -= 25
        if not total: score -= 25
        if not receipt_date: score -= 20
        if not raw_extraction.get("line_items"): score -= 15
        if not tax_amount: score -= 15
        score = max(0, score)

        # 4. Review flag evaluation
        confidence = float(raw_extraction.get("confidence") or 0.8)
        needs_review = raw_extraction.get("needs_review") or len(warnings) > 0 or confidence < 0.85 or score < 70
        review_reason = raw_extraction.get("review_reason")
        if warnings and not review_reason:
            review_reason = "; ".join(warnings)

        # Parse date safely
        parsed_date = None
        if receipt_date:
            try:
                parsed_date = datetime.date.fromisoformat(receipt_date[:10])
            except Exception:
                parsed_date = None

        # Create or update ExtractedReceipt (idempotent upsert)
        extraction = db.query(ExtractedReceipt).filter(ExtractedReceipt.receipt_id == receipt.id).first()
        if not extraction:
            extraction = ExtractedReceipt(receipt_id=receipt.id)
            db.add(extraction)

        extraction.document_type = raw_extraction.get("document_type", "receipt")
        extraction.vendor = vendor
        extraction.vendor_normalized = (vendor or "").strip().lower()
        extraction.invoice_number = raw_extraction.get("invoice_number")
        extraction.receipt_date = parsed_date
        extraction.currency = raw_extraction.get("currency") or "INR"
        extraction.subtotal = subtotal
        extraction.tax_type = raw_extraction.get("tax_type")
        extraction.tax_rate = raw_extraction.get("tax_rate")
        extraction.tax_amount = tax_amount
        extraction.total = total
        extraction.payment_method = raw_extraction.get("payment_method")
        extraction.payment_status = raw_extraction.get("payment_status", "paid")
        extraction.category = category
        extraction.business_expense = bool(raw_extraction.get("business_expense", True))
        extraction.line_items = raw_extraction.get("line_items") or []
        extraction.confidence = confidence
        extraction.completeness_score = score
        extraction.needs_review = needs_review
        extraction.review_reason = review_reason
        extraction.warnings = warnings
        extraction.model_output_json = raw_extraction
        receipt.status = ReceiptStatus.needs_review if needs_review else ReceiptStatus.ready
        receipt.processed_at = datetime.datetime.now(datetime.timezone.utc)
        receipt.model_name = client.model_name

        audit = AuditLog(
            receipt_id=receipt.id,
            user_id=receipt.user_id,
            actor="ai",
            action="ai_extracted",
            diff_json={"status": receipt.status.value, "confidence": confidence, "warnings": warnings}
        )
        db.add(audit)
        db.commit()
        logger.info(f"Receipt {receipt_id} processed successfully: status={receipt.status}")

    except Exception as e:
        logger.exception(f"Unhandled error processing receipt {receipt_id}: {e}")
        if receipt:
            receipt.status = ReceiptStatus.failed
            receipt.error_message = str(e)
            db.commit()
    finally:
        if close_db:
            db.close()
