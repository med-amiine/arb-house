from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.config import settings

router = APIRouter()

# Mock data storage (in-memory for MVP)
_mock_vault_state = {
    "tvl": settings.mock_tvl,
    "apy": settings.mock_apy,
    "share_price": settings.mock_share_price,
    "depositors": settings.mock_depositors,
    "total_shares": 1152073.0,  # TVL / share_price
    "last_update": datetime.utcnow().isoformat(),
}

_mock_agents = [
    {
        "id": 0,
        "name": "Aave Agent",
        "protocol": "Aave V3",
        "apy": 6.2,
        "allocation": 40,
        "balance": 500000,
        "risk": "low",
        "strategy": "Conservative Lending",
        "active": True,
    },
    {
        "id": 1,
        "name": "Pendle Agent",
        "protocol": "Pendle",
        "apy": 9.8,
        "allocation": 35,
        "balance": 437500,
        "risk": "medium",
        "strategy": "PT Yield Holding",
        "active": True,
    },
    {
        "id": 2,
        "name": "Morpho Agent",
        "protocol": "Morpho",
        "apy": 7.5,
        "allocation": 25,
        "balance": 312500,
        "risk": "low",
        "strategy": "Optimized Lending",
        "active": True,
    },
]

_mock_transactions = [
    {
        "id": "tx_001",
        "type": "deposit",
        "amount": 10000,
        "asset": "USDC",
        "user": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "timestamp": datetime.utcnow().isoformat(),
        "status": "completed",
        "hash": "0xabc...",
    },
    {
        "id": "tx_002",
        "type": "withdraw",
        "amount": 5000,
        "asset": "USDC",
        "user": "0x8ba1f109551bD432803012645Hac136c82C3e8C",
        "timestamp": (datetime.utcnow()).isoformat(),
        "status": "completed",
        "hash": "0xdef...",
    },
    {
        "id": "tx_003",
        "type": "deposit",
        "amount": 25000,
        "asset": "USDC",
        "user": "0x123d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "timestamp": (datetime.utcnow()).isoformat(),
        "status": "completed",
        "hash": "0xghi...",
    },
    {
        "id": "tx_004",
        "type": "yield",
        "amount": 125.50,
        "asset": "USDC",
        "user": "vault",
        "timestamp": (datetime.utcnow()).isoformat(),
        "status": "completed",
        "hash": "0xjkl...",
    },
]

_mock_yield_history = [
    {"month": "Jan", "apy": 4.20},
    {"month": "Feb", "apy": 5.10},
    {"month": "Mar", "apy": 4.80},
    {"month": "Apr", "apy": 6.20},
    {"month": "May", "apy": 5.90},
    {"month": "Jun", "apy": 7.10},
    {"month": "Jul", "apy": 6.80},
    {"month": "Aug", "apy": 8.20},
    {"month": "Sep", "apy": 7.90},
    {"month": "Oct", "apy": 8.50},
    {"month": "Nov", "apy": 8.10},
    {"month": "Dec", "apy": 8.42},
]

class VaultState(BaseModel):
    tvl: float
    tvl_change_24h: float
    apy: float
    apy_change_24h: float
    share_price: float
    depositors: int
    total_shares: float
    last_update: str

class AgentInfo(BaseModel):
    id: int
    name: str
    protocol: str
    apy: float
    allocation: int
    balance: float
    risk: str
    strategy: str
    active: bool

class Transaction(BaseModel):
    id: str
    type: str
    amount: float
    asset: str
    user: str
    timestamp: str
    status: str
    hash: str

class YieldData(BaseModel):
    month: str
    apy: float

@router.get("/state", response_model=VaultState)
async def get_vault_state():
    """Get current vault state"""
    return VaultState(
        tvl=_mock_vault_state["tvl"],
        tvl_change_24h=12.5,
        apy=_mock_vault_state["apy"],
        apy_change_24h=0.3,
        share_price=_mock_vault_state["share_price"],
        depositors=_mock_vault_state["depositors"],
        total_shares=_mock_vault_state["total_shares"],
        last_update=_mock_vault_state["last_update"],
    )

@router.get("/agents", response_model=List[AgentInfo])
async def get_agents():
    """Get all AI agent allocations"""
    return [AgentInfo(**agent) for agent in _mock_agents]

@router.get("/transactions", response_model=List[Transaction])
async def get_transactions(limit: int = 10):
    """Get recent transactions"""
    return [Transaction(**tx) for tx in _mock_transactions[:limit]]

@router.get("/yield-history", response_model=List[YieldData])
async def get_yield_history():
    """Get 12-month yield history"""
    return [YieldData(**y) for y in _mock_yield_history]

@router.get("/user/{user_address}/balance")
async def get_user_balance(user_address: str):
    """Get user balance and positions"""
    # Mock user data
    return {
        "address": user_address,
        "usdc_balance": 5000.0,
        "bcv_shares": 4608.0,
        "bcv_value": 5000.0,
        "pending_withdrawals": [],
        "total_deposited": 10000.0,
        "total_withdrawn": 5000.0,
        "yield_earned": 125.50,
    }

@router.post("/deposit")
async def mock_deposit(amount: float, user: str):
    """Mock deposit endpoint"""
    global _mock_vault_state
    _mock_vault_state["tvl"] += amount
    _mock_vault_state["last_update"] = datetime.utcnow().isoformat()
    
    new_tx = {
        "id": f"tx_{len(_mock_transactions) + 1:03d}",
        "type": "deposit",
        "amount": amount,
        "asset": "USDC",
        "user": user,
        "timestamp": datetime.utcnow().isoformat(),
        "status": "completed",
        "hash": f"0x{hash(str(datetime.utcnow())):x}"[:10] + "...",
    }
    _mock_transactions.insert(0, new_tx)
    
    return {
        "success": True,
        "transaction": new_tx,
        "new_tvl": _mock_vault_state["tvl"],
        "shares_issued": amount / _mock_vault_state["share_price"],
    }

@router.post("/withdraw")
async def mock_withdraw(amount: float, user: str):
    """Mock withdrawal endpoint"""
    global _mock_vault_state
    if amount > _mock_vault_state["tvl"]:
        return {"success": False, "error": "Insufficient vault liquidity"}
    
    _mock_vault_state["tvl"] -= amount
    _mock_vault_state["last_update"] = datetime.utcnow().isoformat()
    
    new_tx = {
        "id": f"tx_{len(_mock_transactions) + 1:03d}",
        "type": "withdraw",
        "amount": amount,
        "asset": "USDC",
        "user": user,
        "timestamp": datetime.utcnow().isoformat(),
        "status": "completed",
        "hash": f"0x{hash(str(datetime.utcnow())):x}"[:10] + "...",
    }
    _mock_transactions.insert(0, new_tx)
    
    return {
        "success": True,
        "transaction": new_tx,
        "new_tvl": _mock_vault_state["tvl"],
        "shares_burned": amount / _mock_vault_state["share_price"],
    }
