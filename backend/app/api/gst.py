import datetime
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.extraction import ExtractedReceipt
from app.models.receipt import Receipt, ReceiptStatus
from app.security import get_current_user_id

router = APIRouter(prefix="/gst", tags=["gst"])


@router.get("")
def get_gst_summary(
    month: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    now = datetime.date.today()
    if month:
        try:
            parts = month.split("-")
            target_year, target_month = int(parts[0]), int(parts[1])
        except Exception:
            target_year, target_month = now.year, now.month
    else:
        target_year, target_month = now.year, now.month

    records = db.query(ExtractedReceipt).join(Receipt).filter(
        Receipt.user_id == user_id,
        Receipt.status.in_([ReceiptStatus.confirmed, ReceiptStatus.ready])
    ).all()

    items = []
    total_taxable = 0.0
    total_cgst = 0.0
    total_sgst = 0.0
    total_igst = 0.0
    total_tax = 0.0

    for ext in records:
        if ext.receipt_date and ext.receipt_date.year == target_year and ext.receipt_date.month == target_month:
            subtotal = float(ext.subtotal or 0.0)
            tax_amt = float(ext.tax_amount or 0.0)
            tax_type = (ext.tax_type or "GST").upper()

            # Estimate CGST/SGST split or IGST
            cgst = 0.0
            sgst = 0.0
            igst = 0.0

            if "IGST" in tax_type:
                igst = tax_amt
            else:
                cgst = round(tax_amt / 2.0, 2)
                sgst = round(tax_amt - cgst, 2)

            is_consistent = True
            mismatch_reason = None
            if ext.total is not None and subtotal > 0 and tax_amt > 0:
                if abs((subtotal + tax_amt) - float(ext.total)) > 1.0:
                    is_consistent = False
                    mismatch_reason = f"Subtotal + Tax differs from Total by ₹{abs((subtotal + tax_amt) - float(ext.total)):.2f}"

            items.append({
                "receipt_id": str(ext.receipt_id),
                "vendor": ext.vendor or "Unknown Vendor",
                "invoice_number": ext.invoice_number or "N/A",
                "date": ext.receipt_date.isoformat(),
                "taxable_amount": round(subtotal, 2),
                "tax_rate": float(ext.tax_rate or 0.0),
                "tax_type": tax_type,
                "cgst": cgst,
                "sgst": sgst,
                "igst": igst,
                "total_tax": round(tax_amt, 2),
                "total": float(ext.total or (subtotal + tax_amt)),
                "is_consistent": is_consistent,
                "warning": mismatch_reason
            })

            total_taxable += subtotal
            total_cgst += cgst
            total_sgst += sgst
            total_igst += igst
            total_tax += tax_amt

    return {
        "month": f"{target_year:04d}-{target_month:02d}",
        "disclaimer": "Informational only. Not official tax or legal advice.",
        "summary": {
            "total_taxable": round(total_taxable, 2),
            "total_cgst": round(total_cgst, 2),
            "total_sgst": round(total_sgst, 2),
            "total_igst": round(total_igst, 2),
            "total_tax": round(total_tax, 2),
            "invoice_count": len(items)
        },
        "items": items
    }
