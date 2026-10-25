from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.receipts import router as receipts_router
from app.api.ledger import router as ledger_router
from app.api.dashboard import router as dashboard_router
from app.api.ask import router as ask_router
from app.api.gst import router as gst_router
from app.api.review_queue import router as review_queue_router
from app.api.settings import router as settings_router

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(receipts_router)
api_router.include_router(ledger_router)
api_router.include_router(dashboard_router)
api_router.include_router(ask_router)
api_router.include_router(gst_router)
api_router.include_router(review_queue_router)
api_router.include_router(settings_router)

__all__ = ["api_router"]
