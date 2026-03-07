from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import structlog

from app.config import settings

router = APIRouter()
logger = structlog.get_logger()

class HealthResponse(BaseModel):
    status: str
    version: str
    vault: str
    chain_id: int
    mock_mode: bool
    timestamp: str
    
    # Vault stats
    tvl: Optional[float] = None
    apy: Optional[float] = None
    share_price: Optional[float] = None
    depositors: Optional[int] = None
    
    # Service status
    services: dict

class AgentHealth(BaseModel):
    id: int
    name: str
    active: bool
    balance: float
    apy: float

@router.get("", response_model=HealthResponse)
async def health_check():
    """Comprehensive health check"""
    
    # Get mock data if in mock mode
    tvl = settings.mock_tvl if settings.mock_mode else None
    apy = settings.mock_apy if settings.mock_mode else None
    share_price = settings.mock_share_price if settings.mock_mode else None
    depositors = settings.mock_depositors if settings.mock_mode else None
    
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        vault=settings.vault_address,
        chain_id=settings.chain_id,
        mock_mode=settings.mock_mode,
        timestamp=datetime.utcnow().isoformat(),
        tvl=tvl,
        apy=apy,
        share_price=share_price,
        depositors=depositors,
        services={
            "event_listener": settings.enable_event_listener and not settings.mock_mode,
            "withdrawal_processor": settings.enable_withdrawal_processor and not settings.mock_mode,
            "balance_sync": settings.enable_balance_sync and not settings.mock_mode,
            "api": True,
        }
    )

@router.get("/ready")
async def readiness_check():
    """Kubernetes-style readiness probe"""
    return {"ready": True}

@router.get("/live")
async def liveness_check():
    """Kubernetes-style liveness probe"""
    return {"alive": True}

@router.get("/agents")
async def agent_health():
    """Health status of all AI agents"""
    if settings.mock_mode:
        return [
            {"id": 0, "name": "Aave Agent", "active": True, "balance": 500000, "apy": 6.2},
            {"id": 1, "name": "Pendle Agent", "active": True, "balance": 437500, "apy": 9.8},
            {"id": 2, "name": "Morpho Agent", "active": True, "balance": 312500, "apy": 7.5},
        ]
    return {"agents": []}
