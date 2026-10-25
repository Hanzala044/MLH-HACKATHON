from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import date, datetime


# ── Gemma 4 extraction schema (matches PRD section 11.3) ──

ALLOWED_CATEGORIES = [
    "Software & SaaS", "Cloud Hosting", "Travel", "Food & Meals",
    "Office Supplies", "Internet & Utilities", "Hardware",
    "Professional Services", "Marketing", "Education", "Other"
]

Category = Literal[
    "Software & SaaS", "Cloud Hosting", "Travel", "Food & Meals",
    "Office Supplies", "Internet & Utilities", "Hardware",
    "Professional Services", "Marketing", "Education", "Other"
]


class LineItem(BaseModel):
    description: str
    quantity: Optional[float] = None
    amount: Optional[float] = None


class Extraction(BaseModel):
    document_type: Literal["receipt", "invoice", "bill", "payment_screenshot", "unknown"] = "unknown"
    vendor: Optional[str] = None
    invoice_number: Optional[str] = None
    date: Optional[str] = None  # YYYY-MM-DD
    currency: Optional[str] = None  # ISO 4217
    subtotal: Optional[float] = None
    tax_type: Optional[str] = None
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None
    total: Optional[float] = None
    payment_method: Optional[str] = None
    payment_status: Literal["paid", "unpaid", "partial", "unknown"] = "unknown"
    category: str = "Other"
    business_expense: bool = True
    line_items: list[LineItem] = []
    confidence: float = Field(ge=0, le=1, default=0.5)
    needs_review: bool = False
    review_reason: Optional[str] = None


# ── API response schemas ──

class ReceiptResponse(BaseModel):
    id: str
    file_key: str
    file_type: str
    original_filename: str
    user_note: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    model_name: Optional[str] = None
    model_mode: Optional[str] = None
    uploaded_at: datetime
    processed_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    file_url: Optional[str] = None

    # Extracted data (flattened for convenience)
    document_type: Optional[str] = None
    vendor: Optional[str] = None
    invoice_number: Optional[str] = None
    receipt_date: Optional[str] = None
    currency: Optional[str] = None
    subtotal: Optional[float] = None
    tax_type: Optional[str] = None
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None
    total: Optional[float] = None
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    category: Optional[str] = None
    business_expense: Optional[bool] = None
    line_items: Optional[list] = None
    confidence: Optional[float] = None
    completeness_score: Optional[int] = None
    needs_review: Optional[bool] = None
    review_reason: Optional[str] = None
    warnings: Optional[list] = None
    model_output_json: Optional[dict] = None

    class Config:
        from_attributes = True


class ReceiptUpdateRequest(BaseModel):
    vendor: Optional[str] = None
    receipt_date: Optional[str] = None
    total: Optional[float] = None
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    tax_type: Optional[str] = None
    tax_rate: Optional[float] = None
    currency: Optional[str] = None
    category: Optional[str] = None
    business_expense: Optional[bool] = None
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    invoice_number: Optional[str] = None
    user_note: Optional[str] = None


class ReceiptListResponse(BaseModel):
    items: list[ReceiptResponse]
    page: int
    page_size: int
    total_items: int


class DashboardResponse(BaseModel):
    month_total: float = 0
    tax_total: float = 0
    unpaid_total: float = 0
    needs_review_count: int = 0
    receipt_count: int = 0
    confirmed_count: int = 0
    category_breakdown: list[dict] = []
    monthly_trend: list[dict] = []
    recent_receipts: list[ReceiptResponse] = []
