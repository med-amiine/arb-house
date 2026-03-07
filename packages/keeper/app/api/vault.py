from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from web3 import Web3
import structlog

from app.config import settings

router = APIRouter()
logger = structlog.get_logger()

# Mock data storage (in-memory for MVP)
_mock_vault_state = {
    "tvl": settings.mock_tvl,
    "apy": settings.mock_apy,
    "share_price": settings.mock_share_price,
    "depositors": settings.mock_depositors,
    "total_shares": 1152073.0,
    "last_update": datetime.utcnow().isoformat(),
    "last_sync": int(datetime.utcnow().timestamp()),
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
]

_mock_yield_history = [
    {"month": "Jan", "apy": 4.2},
    {"month": "Feb", "apy": 5.1},
    {"month": "Mar", "apy": 4.8},
    {"month": "Apr", "apy": 6.2},
    {"month": "May", "apy": 5.9},
    {"month": "Jun", "apy": 7.1},
    {"month": "Jul", "apy": 6.8},
    {"month": "Aug", "apy": 8.2},
    {"month": "Sep", "apy": 7.9},
    {"month": "Oct", "apy": 8.5},
    {"month": "Nov", "apy": 8.1},
    {"month": "Dec", "apy": 8.42},
]

# Web3 setup for actual blockchain calls (when not in mock mode)
w3 = None
vault_contract = None
keeper_account = None

if not settings.mock_mode:
    try:
        w3 = Web3(Web3.HTTPProvider(settings.arb_rpc_url))
        vault_contract = w3.eth.contract(
            address=Web3.to_checksum_address(settings.vault_address),
            abi=[
                {
                    "inputs": [{"name": "balances", "type": "uint256[3]"}],
                    "name": "syncBalances",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "lastSync",
                    "outputs": [{"name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                },
            ]
        )
        keeper_account = w3.eth.account.from_key(settings.keeper_private_key)
        logger.info("blockchain_connection_established")
    except Exception as e:
        logger.error("blockchain_connection_failed", error=str(e))

class VaultState(BaseModel):
    tvl: float
    tvl_change_24h: float
    apy: float
    apy_change_24h: float
    share_price: float
    depositors: int
    total_shares: float
    last_update: str
    last_sync: int

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

class SyncResponse(BaseModel):
    success: bool
    tx_hash: Optional[str] = None
    error: Optional[str] = None

@router.get("/state", response_model=VaultState)
async def get_vault_state():
    """Get current vault state"""
    # Check actual lastSync from contract if available
    last_sync = _mock_vault_state["last_sync"]
    if vault_contract and w3:
        try:
            last_sync = vault_contract.functions.lastSync().call()
        except Exception as e:
            logger.warning("failed_to_fetch_lastSync", error=str(e))
    
    return VaultState(
        tvl=_mock_vault_state["tvl"],
        tvl_change_24h=12.5,
        apy=_mock_vault_state["apy"],
        apy_change_24h=0.3,
        share_price=_mock_vault_state["share_price"],
        depositors=_mock_vault_state["depositors"],
        total_shares=_mock_vault_state["total_shares"],
        last_update=_mock_vault_state["last_update"],
        last_sync=last_sync,
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

@router.post("/sync", response_model=SyncResponse)
async def sync_balances():
    """Manually trigger balance sync on the vault contract"""
    if settings.mock_mode:
        # In mock mode, just update the timestamp
        _mock_vault_state["last_sync"] = int(datetime.utcnow().timestamp())
        _mock_vault_state["last_update"] = datetime.utcnow().isoformat()
        logger.info("mock_sync_completed")
        return SyncResponse(success=True, tx_hash="mock_tx_hash")
    
    if not vault_contract or not w3 or not keeper_account:
        logger.error("blockchain_not_configured")
        return SyncResponse(success=False, error="Blockchain not configured")
    
    try:
        # Prepare balances array (mock values for now)
        balances = [500000, 437500, 312500]  # 6 decimal USDC amounts
        
        logger.info("sending_sync_balances", balances=balances)
        
        # Build and sign transaction
        # Get gas price (fallback for networks without EIP-1559)
        try:
            base_fee = w3.eth.get_block('latest')['baseFeePerGas']
            max_priority = w3.eth.max_priority_fee_per_gas
            max_fee = base_fee * 2 + max_priority  # Double the base fee to ensure inclusion
        except (AttributeError, KeyError):
            # Fallback for non-EIP-1559 networks
            gas_price = w3.eth.gas_price
            max_fee = int(gas_price * 1.5)  # Add 50% buffer
            max_priority = int(gas_price * 0.1)
        
        tx = vault_contract.functions.syncBalances(balances).build_transaction({
            'from': keeper_account.address,
            'nonce': w3.eth.get_transaction_count(keeper_account.address),
            'gas': 200000,
            'maxFeePerGas': max_fee,
            'maxPriorityFeePerGas': max_priority
        })
        
        signed = w3.eth.account.sign_transaction(tx, settings.keeper_private_key)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
        
        # Wait for receipt
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        
        if receipt.status == 1:
            logger.info("sync_balances_success", tx_hash=tx_hash.hex())
            return SyncResponse(success=True, tx_hash=tx_hash.hex())
        else:
            logger.error("sync_balances_failed", tx_hash=tx_hash.hex())
            return SyncResponse(success=False, error="Transaction failed")
            
    except Exception as e:
        logger.error("sync_balances_error", error=str(e))
        return SyncResponse(success=False, error=str(e))
