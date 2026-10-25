"""
Setup / Recreate Database Tables Script for ReceiptWise
Compatible with Supabase PostgreSQL (Port 6543 / 5432) and local PostgreSQL.
Usage:
  python scripts/setup_db.py [--clean] [--seed]
"""

import sys
import os
import argparse
from sqlalchemy import text, inspect

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings
from app.db import engine, Base, SessionLocal
from app.models import User, Receipt, ExtractedReceipt, AuditLog


def main():
    parser = argparse.ArgumentParser(description="Initialize / Recreate Database Schema")
    parser.add_argument("--clean", action="store_true", help="Drop existing tables before recreating")
    parser.add_argument("--seed", action="store_true", help="Seed default demo user and initial receipts")
    args = parser.parse_args()

    settings = get_settings()
    raw_url = settings.database_url or ""
    is_supabase = "supabase" in raw_url.lower()

    # Mask host for security
    masked_host = "localhost"
    try:
        if "@" in raw_url:
            masked_host = raw_url.split("@")[1].split("/")[0]
    except Exception:
        pass

    print("=" * 60)
    print("  RECEIPTWISE DATABASE INITIALIZATION & MIGRATION")
    print("=" * 60)
    print(f"Target Provider : {'Supabase Cloud PostgreSQL' if is_supabase else 'PostgreSQL'}")
    print(f"Host            : {masked_host}")
    print(f"Clean Recreate  : {args.clean}")
    print(f"Seed Demo Data  : {args.seed}")
    print("-" * 60)

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
        print(" Connected to database successfully.")
    except Exception as e:
        print(f" Connection FAILED: {e}")
        print("\nPlease check your DATABASE_URL in backend/.env")
        sys.exit(1)

    if args.clean:
        print("\nDropping existing tables...")
        Base.metadata.drop_all(bind=engine)
        print(" Tables dropped.")

    print("\nCreating schema and tables...")
    Base.metadata.create_all(bind=engine)

    # Ensure dynamic columns and migrations
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS diff_json JSONB;"))
        conn.commit()
    print(" Schema verified with JSONB diff_json support.")

    # Inspect created tables
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\n Active tables ({len(tables)}):")
    for t in tables:
        cols = [c["name"] for c in inspector.get_columns(t)]
        print(f"   • {t} ({len(cols)} columns: {', '.join(cols[:4])}...)")

    if args.seed:
        from app.main import seed_demo_data
        print("\nSeeding demo data...")
        seed_demo_data()
        print(" Demo data seeded.")
    else:
        print("\nNo demo seed requested (--seed omitted). Ready for authentic user uploads!")

    print("\n Database setup complete and verified!")
    print("=" * 60)


if __name__ == "__main__":
    main()
