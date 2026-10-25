from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.ai import get_model_client
from app.api.receipts import serialize_receipt
from app.db import get_db
from app.models.extraction import ExtractedReceipt
from app.models.receipt import Receipt, ReceiptStatus
from app.security import get_current_user_id

router = APIRouter(prefix="/ask", tags=["ask"])


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str
    cited_receipts: list
    filters_used: dict


@router.post("", response_model=AskResponse)
def ask_receipts(
    req: AskRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # Fetch confirmed receipts only (PRD Section 7 & 10: only confirmed records are used)
    receipts = db.query(Receipt).filter(
        Receipt.user_id == user_id,
        Receipt.status == ReceiptStatus.confirmed
    ).order_by(Receipt.uploaded_at.desc()).all()

    receipt_dicts = []
    receipt_lookup = {}
    for r in receipts:
        ser = serialize_receipt(r).dict()
        receipt_dicts.append(ser)
        receipt_lookup[str(r.id)] = ser

    client = get_model_client()
    result = client.answer(req.question, receipt_dicts)

    cited_ids = result.get("cited_ids", [])
    cited_receipts = [receipt_lookup[cid] for cid in cited_ids if cid in receipt_lookup]

    # If cited_ids empty, include first matching receipts
    if not cited_receipts and receipt_dicts:
        cited_receipts = receipt_dicts[:2]

    return AskResponse(
        answer=result.get("answer", "Here is what was found in your expense ledger."),
        cited_receipts=cited_receipts,
        filters_used=result.get("filters_used", {"confirmed_records_searched": len(receipts)})
    )
