import datetime
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.api.receipts import serialize_receipt
from app.db import get_db
from app.models.extraction import ExtractedReceipt
from app.models.receipt import Receipt, ReceiptStatus
from app.schemas.receipt import DashboardResponse
from app.security import get_current_user_id

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    month: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    now = datetime.date.today()
    if not month:
        target_year = now.year
        target_month = now.month
    else:
        try:
            parts = month.split("-")
            target_year = int(parts[0])
            target_month = int(parts[1])
        except Exception:
            target_year = now.year
            target_month = now.month

    # Total confirmed receipts query
    confirmed_receipts = db.query(ExtractedReceipt).join(Receipt).filter(
        Receipt.user_id == user_id,
        Receipt.status == ReceiptStatus.confirmed
    ).all()

    # Current month metrics
    month_total = 0.0
    tax_total = 0.0
    category_map = {}

    for ext in confirmed_receipts:
        if ext.receipt_date and ext.receipt_date.year == target_year and ext.receipt_date.month == target_month:
            tot = float(ext.total or 0.0)
            tax = float(ext.tax_amount or 0.0)
            month_total += tot
            tax_total += tax

            cat = ext.category or "Other"
            if cat not in category_map:
                category_map[cat] = {"category": cat, "total": 0.0, "count": 0}
            category_map[cat]["total"] += tot
            category_map[cat]["count"] += 1

    category_breakdown = list(category_map.values())
    for item in category_breakdown:
        item["percentage"] = round((item["total"] / month_total * 100), 1) if month_total > 0 else 0.0
        item["total"] = round(item["total"], 2)
    category_breakdown.sort(key=lambda x: x["total"], reverse=True)

    # Unpaid total (unpaid status across all receipts)
    unpaid_total = 0.0
    for ext in confirmed_receipts:
        if ext.payment_status == "unpaid":
            unpaid_total += float(ext.total or 0.0)

    # Counts
    all_receipts = db.query(Receipt).filter(Receipt.user_id == user_id).all()
    receipt_count = len(all_receipts)
    confirmed_count = sum(1 for r in all_receipts if r.status == ReceiptStatus.confirmed)
    needs_review_count = sum(1 for r in all_receipts if r.status == ReceiptStatus.needs_review)

    # 6-Month Monthly trend
    monthly_trend = []
    for i in range(5, -1, -1):
        m_date = now.replace(day=1) - datetime.timedelta(days=i * 30)
        m_year = m_date.year
        m_num = m_date.month
        label = f"{m_year:04d}-{m_num:02d}"

        m_tot = 0.0
        m_tax = 0.0
        for ext in confirmed_receipts:
            if ext.receipt_date and ext.receipt_date.year == m_year and ext.receipt_date.month == m_num:
                m_tot += float(ext.total or 0.0)
                m_tax += float(ext.tax_amount or 0.0)

        monthly_trend.append({
            "month": label,
            "total": round(m_tot, 2),
            "tax": round(m_tax, 2)
        })

    # Recent receipts (latest 5)
    recent_query = db.query(Receipt).filter(Receipt.user_id == user_id).order_by(Receipt.uploaded_at.desc()).limit(5).all()
    recent_receipts = [serialize_receipt(r) for r in recent_query]

    return DashboardResponse(
        month_total=round(month_total, 2),
        tax_total=round(tax_total, 2),
        unpaid_total=round(unpaid_total, 2),
        needs_review_count=needs_review_count,
        receipt_count=receipt_count,
        confirmed_count=confirmed_count,
        category_breakdown=category_breakdown,
        monthly_trend=monthly_trend,
        recent_receipts=recent_receipts
    )
