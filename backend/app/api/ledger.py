import csv
import datetime
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.api.receipts import serialize_receipt
from app.db import get_db
from app.models.extraction import ExtractedReceipt
from app.models.receipt import Receipt, ReceiptStatus
from app.schemas.receipt import ReceiptListResponse
from app.security import get_current_user_id

router = APIRouter(tags=["ledger"])


def build_ledger_query(
    db: Session,
    user_id: str,
    q: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    category: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    status: Optional[str] = None,
    business_only: Optional[bool] = None,
    sort_by: str = "date",
    sort_order: str = "desc"
):
    query = db.query(Receipt).outerjoin(ExtractedReceipt, Receipt.id == ExtractedReceipt.receipt_id).filter(
        Receipt.user_id == user_id
    )

    if status:
        query = query.filter(Receipt.status == status)
    if business_only is True:
        query = query.filter(ExtractedReceipt.business_expense.is_(True))
    elif business_only is False:
        query = query.filter(ExtractedReceipt.business_expense.is_(False))

    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                ExtractedReceipt.vendor.ilike(search_pattern),
                ExtractedReceipt.invoice_number.ilike(search_pattern),
                Receipt.original_filename.ilike(search_pattern),
                Receipt.user_note.ilike(search_pattern)
            )
        )

    if category and category.lower() != "all":
        query = query.filter(ExtractedReceipt.category == category)

    if from_date:
        try:
            d_from = datetime.date.fromisoformat(from_date[:10])
            query = query.filter(ExtractedReceipt.receipt_date >= d_from)
        except Exception:
            pass

    if to_date:
        try:
            d_to = datetime.date.fromisoformat(to_date[:10])
            query = query.filter(ExtractedReceipt.receipt_date <= d_to)
        except Exception:
            pass

    if min_amount is not None:
        query = query.filter(ExtractedReceipt.total >= min_amount)
    if max_amount is not None:
        query = query.filter(ExtractedReceipt.total <= max_amount)

    # Sorting
    if sort_by == "vendor":
        order_col = ExtractedReceipt.vendor
    elif sort_by == "total":
        order_col = ExtractedReceipt.total
    else:
        order_col = ExtractedReceipt.receipt_date

    if sort_order == "asc":
        query = query.order_by(order_col.asc().nullslast(), Receipt.uploaded_at.asc())
    else:
        query = query.order_by(order_col.desc().nullslast(), Receipt.uploaded_at.desc())

    return query


@router.get("/ledger", response_model=ReceiptListResponse)
def get_ledger(
    q: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    category: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    status: Optional[str] = None,
    business_only: Optional[bool] = None,
    sort_by: str = Query("date", regex="^(date|vendor|total)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = build_ledger_query(
        db, user_id, q, from_date, to_date, category, min_amount, max_amount, status, business_only, sort_by, sort_order
    )
    total_items = query.count()
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return ReceiptListResponse(
        items=[serialize_receipt(r) for r in items],
        page=page,
        page_size=page_size,
        total_items=total_items
    )


@router.get("/export/csv")
def export_csv(
    q: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    category: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    status: Optional[str] = None,
    business_only: Optional[bool] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = build_ledger_query(
        db, user_id, q, from_date, to_date, category, min_amount, max_amount, status, business_only
    )
    receipts = query.all()

    output = io.StringIO()
    # Write UTF-8 BOM so Excel opens properly with special characters
    output.write("\ufeff")
    writer = csv.writer(output)

    writer.writerow([
        "Receipt ID", "Date", "Vendor", "Invoice Number", "Document Type",
        "Category", "Business Expense", "Subtotal", "Tax Rate (%)", "Tax Amount",
        "Total", "Currency", "Payment Method", "Payment Status", "Confidence",
        "Status", "Original File", "Uploaded At"
    ])

    for r in receipts:
        ext = r.extraction
        writer.writerow([
            str(r.id),
            ext.receipt_date.isoformat() if ext and ext.receipt_date else "",
            ext.vendor if ext and ext.vendor else "",
            ext.invoice_number if ext and ext.invoice_number else "",
            ext.document_type if ext else "",
            ext.category if ext else "Other",
            "Yes" if (ext and ext.business_expense) else "No",
            f"{ext.subtotal:.2f}" if (ext and ext.subtotal is not None) else "",
            f"{ext.tax_rate:.1f}" if (ext and ext.tax_rate is not None) else "",
            f"{ext.tax_amount:.2f}" if (ext and ext.tax_amount is not None) else "",
            f"{ext.total:.2f}" if (ext and ext.total is not None) else "",
            ext.currency if (ext and ext.currency) else "INR",
            ext.payment_method if (ext and ext.payment_method) else "",
            ext.payment_status if (ext and ext.payment_status) else "",
            f"{float(ext.confidence):.2f}" if (ext and ext.confidence is not None) else "",
            r.status.value,
            r.original_filename,
            r.uploaded_at.isoformat()
        ])

    csv_data = output.getvalue()
    filename = f"receiptwise_ledger_{datetime.date.today().isoformat()}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
