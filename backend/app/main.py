import datetime
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import api_router
from app.config import get_settings
from app.db import Base, SessionLocal, engine
from app.models import AuditLog, ExtractedReceipt, Receipt, User
from app.models.receipt import ReceiptStatus
from app.security import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("receiptwise")


def seed_demo_data():
    """Seeds the demo user with sample receipts if empty."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "demo@receiptwise.app").first()
        if not user:
            user = User(
                email="demo@receiptwise.app",
                password_hash=hash_password("demopassword123"),
                full_name="Asha (Freelance Designer)",
                default_currency="INR",
                country="IN",
                model_mode="cloud"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Check if receipts exist
        existing_receipts = db.query(Receipt).filter(Receipt.user_id == user.id).count()
        if existing_receipts == 0:
            logger.info("Seeding realistic demo receipts for judge walkthrough...")
            today = datetime.date.today()

            samples = [
                {
                    "vendor": "Uber India Technologies Pvt Ltd",
                    "file": "uber_trip_udupi.jpg",
                    "type": "receipt",
                    "note": "Cab from Udupi Railway Station to Hackathon Venue",
                    "date": today,
                    "currency": "INR",
                    "subtotal": 350.00,
                    "tax_type": "CGST+SGST (5%)",
                    "tax_rate": 5.0,
                    "tax_amount": 17.50,
                    "total": 367.50,
                    "payment_method": "UPI",
                    "payment_status": "paid",
                    "category": "Travel",
                    "business": True,
                    "status": ReceiptStatus.confirmed,
                    "confidence": 0.96,
                    "items": [{"description": "Uber Go Ride - Udupi Stn to MIT", "quantity": 1, "amount": 350.00}]
                },
                {
                    "vendor": "DigitalOcean LLC",
                    "file": "digitalocean_invoice_oct26.pdf",
                    "type": "invoice",
                    "invoice_num": "DO-2026-88193",
                    "note": "Cloud Droplet & Managed Database hosting",
                    "date": today.replace(day=min(today.day, 24)),
                    "currency": "USD",
                    "subtotal": 48.00,
                    "tax_type": "VAT (18%)",
                    "tax_rate": 18.0,
                    "tax_amount": 8.64,
                    "total": 56.64,
                    "payment_method": "Credit Card",
                    "payment_status": "paid",
                    "category": "Cloud Hosting",
                    "business": True,
                    "status": ReceiptStatus.confirmed,
                    "confidence": 0.98,
                    "items": [
                        {"description": "Droplet 4GB NYC3", "quantity": 1, "amount": 24.00},
                        {"description": "Managed PostgreSQL DB", "quantity": 1, "amount": 20.00},
                        {"description": "Spaces Storage", "quantity": 1, "amount": 4.00}
                    ]
                },
                {
                    "vendor": "GitHub Inc",
                    "file": "github_copilot_sub.png",
                    "type": "receipt",
                    "invoice_num": "GH-OCT-10294",
                    "note": "GitHub Copilot Individual Monthly",
                    "date": today.replace(day=min(today.day, 15)),
                    "currency": "USD",
                    "subtotal": 10.00,
                    "tax_type": "Tax",
                    "tax_rate": 0.0,
                    "tax_amount": 0.00,
                    "total": 10.00,
                    "payment_method": "Credit Card",
                    "payment_status": "paid",
                    "category": "Software & SaaS",
                    "business": True,
                    "status": ReceiptStatus.confirmed,
                    "confidence": 0.95,
                    "items": [{"description": "Copilot Individual Subscription", "quantity": 1, "amount": 10.00}]
                },
                {
                    "vendor": "Woodlands Restaurant Udupi",
                    "file": "udupi_lunch_bill.jpg",
                    "type": "bill",
                    "invoice_num": "WOOD-7721",
                    "note": "Team hackathon lunch in Udupi",
                    "date": today,
                    "currency": "INR",
                    "subtotal": 680.00,
                    "tax_type": "CGST+SGST (5%)",
                    "tax_rate": 5.0,
                    "tax_amount": 34.00,
                    "total": 714.00,
                    "payment_method": "UPI",
                    "payment_status": "paid",
                    "category": "Food & Meals",
                    "business": True,
                    "status": ReceiptStatus.ready,
                    "confidence": 0.92,
                    "items": [
                        {"description": "South Indian Special Thali x 2", "quantity": 2, "amount": 440.00},
                        {"description": "Filter Coffee x 4", "quantity": 4, "amount": 160.00},
                        {"description": "Masala Dosa", "quantity": 1, "amount": 80.00}
                    ]
                },
                {
                    "vendor": "Amazon Web Services (AWS)",
                    "file": "aws_suspicious_tax_bill.pdf",
                    "type": "invoice",
                    "invoice_num": "AWS-IN-99231",
                    "note": "GPU Spot Instance testing (GST discrepancy flagged)",
                    "date": today.replace(day=min(today.day, 10)),
                    "currency": "INR",
                    "subtotal": 2500.00,
                    "tax_type": "IGST (18%)",
                    "tax_rate": 18.0,
                    "tax_amount": 450.00,
                    "total": 3100.00,  # Intentional discrepancy: 2500 + 450 = 2950 != 3100
                    "payment_method": "NetBanking",
                    "payment_status": "unpaid",
                    "category": "Cloud Hosting",
                    "business": True,
                    "status": ReceiptStatus.needs_review,
                    "confidence": 0.72,
                    "items": [{"description": "EC2 G5 Instance Usage", "quantity": 1, "amount": 2500.00}],
                    "warnings": ["GST math discrepancy: Subtotal (2500.0) + Tax (450.0) != Total (3100.0)"]
                }
            ]

            for s in samples:
                rec = Receipt(
                    user_id=user.id,
                    file_key=f"{user.id}/sample_{s['file']}",
                    file_type="image/jpeg",
                    original_filename=s["file"],
                    file_hash="sample_hash_" + s["vendor"].replace(" ", "_"),
                    user_note=s["note"],
                    status=s["status"],
                    model_name="gemma-4-31b-it",
                    model_mode="cloud",
                    confirmed_at=datetime.datetime.now(datetime.timezone.utc) if s["status"] == ReceiptStatus.confirmed else None
                )
                db.add(rec)
                db.flush()

                ext = ExtractedReceipt(
                    receipt_id=rec.id,
                    document_type=s["type"],
                    vendor=s["vendor"],
                    vendor_normalized=s["vendor"].lower(),
                    invoice_number=s.get("invoice_num"),
                    receipt_date=s["date"],
                    currency=s["currency"],
                    subtotal=s["subtotal"],
                    tax_type=s["tax_type"],
                    tax_rate=s["tax_rate"],
                    tax_amount=s["tax_amount"],
                    total=s["total"],
                    payment_method=s["payment_method"],
                    payment_status=s["payment_status"],
                    category=s["category"],
                    business_expense=s["business"],
                    line_items=s["items"],
                    confidence=s["confidence"],
                    completeness_score=95,
                    needs_review=(s["status"] == ReceiptStatus.needs_review),
                    review_reason=s["warnings"][0] if s.get("warnings") else None,
                    warnings=s.get("warnings", []),
                    model_output_json={"vendor": s["vendor"], "total": s["total"]}
                )
                db.add(ext)

            db.commit()
            logger.info("Demo seeds created successfully.")

    except Exception as e:
        logger.warning(f"Error seeding demo data: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create DB tables and seed
    Base.metadata.create_all(bind=engine)
    seed_demo_data()
    yield


app = FastAPI(
    title="ReceiptWise API",
    description="Privacy-First Multimodal Expense Organizer powered by Gemma 4",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
settings = get_settings()
origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
if "*" not in origins:
    origins.extend(["*", "http://localhost:5173", "http://localhost:3000"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "receiptwise-api",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
