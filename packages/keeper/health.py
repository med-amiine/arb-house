from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import structlog

from app.config import settings
from app.services.withdrawal_processor import WithdrawalProcessor
from app.services.balance_sync import BalanceSync

router = APIRouter()
logger = structlog.get_logger()

class HealthResponse(BaseModel):
    status: str
    vault: str
    chain_id: int
    last_sync: Optional[int] = None
    pending_withdrawals: int = 0
    queue_depth: int = 0

@router.get("", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    processor = WithdrawalProcessor()
    sync = BalanceSync()
    
    return HealthResponse(
        status="healthy",
        vault=settings.vault_address,
        chain_id=settings.chain_id,
        last_sync=sync.last_sync,
        pending_withdrawals=processor.pending_count,
        queue_depth=processor.queue_depth
    )

@router.get("/ready")
async def readiness_check():
    """Kubernetes-style readiness probe"""
    return {"ready": True}

@router.get("/live")
async def liveness_check():
    """Kubernetes-style liveness probe"""
    return {"alive": True}
