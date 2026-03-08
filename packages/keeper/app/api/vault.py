from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from web3 import Web3
import structlog

from app.config import settings
from app.database import (
    get_db, SessionLocal, 
    EventRepository, VaultStateRepository, 
    WithdrawalRepository, UserPositionRepository,
    Event, VaultState, PendingWithdrawalDB, UserPosition
)

router = APIRouter()
logger = structlog.get_logger()

# Web3 setup
w3 = Web3(Web3.HTTPProvider(settings.arb_rpc_url))

# Full Vault ABI
VAULT_ABI = [
    {
        "inputs": [],
        "name": "totalAssets",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "", "type": "uint256"}],
        "name": "agents",
        "outputs": [
            {"name": "adapter", "type": "address"},
            {"name": "creditLimit", "type": "uint256"},
            {"name": "currentBalance", "type": "uint256"},
            {"name": "active", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "lastSync",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalIdle",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "shares", "type": "uint256"}],
        "name": "convertToAssets",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "user", "type": "address"}],
        "name": "getUserWithdrawals",
        "outputs": [{
            "name": "",
            "type": "tuple[]",
            "components": [
                {"name": "shares", "type": "uint256"},
                {"name": "assets", "type": "uint256"},
                {"name": "timestamp", "type": "uint256"},
                {"name": "claimed", "type": "bool"}
            ]
        }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "user", "type": "address"}],
        "name": "pendingAssets",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    # Events
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "receiver", "type": "address"},
            {"name": "assets", "type": "uint256"},
            {"name": "shares", "type": "uint256"}
        ],
        "name": "DepositMade",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "user", "type": "address"},
            {"indexed": True, "name": "requestId", "type": "uint256"},
            {"name": "shares", "type": "uint256"},
            {"name": "assets", "type": "uint256"}
        ],
        "name": "WithdrawalQueued",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "user", "type": "address"},
            {"indexed": True, "name": "requestId", "type": "uint256"},
            {"name": "assets", "type": "uint256"}
        ],
        "name": "WithdrawalCompleted",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"name": "balances", "type": "uint256[3]"},
            {"name": "timestamp", "type": "uint256"}
        ],
        "name": "BalancesSynced",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"name": "oldWeights", "type": "uint16[3]"},
            {"name": "newWeights", "type": "uint16[3]"}
        ],
        "name": "Rebalanced",
        "type": "event"
    }
]

vault_contract = w3.eth.contract(
    address=Web3.to_checksum_address(settings.vault_address),
    abi=VAULT_ABI
)

USDC_DECIMALS = 6
BCV_DECIMALS = 18


def format_usdc(amount: int) -> float:
    """Format USDC amount (6 decimals)"""
    return amount / (10 ** USDC_DECIMALS)


def format_bcv(amount: int) -> float:
    """Format BCV amount (18 decimals)"""
    return amount / (10 ** BCV_DECIMALS)


# --- Pydantic Models ---

class VaultStateResponse(BaseModel):
    tvl: float
    tvl_change_24h: float
    apy: float
    apy_change_24h: float
    share_price: float
    depositors: int
    total_shares: float
    last_update: str
    last_sync: int
    idle_assets: float
    agent_balances: List[float]


class AgentInfo(BaseModel):
    id: int
    name: str
    protocol: str
    adapter: str
    credit_limit: float
    balance: float
    apy: float
    allocation: float
    target_allocation: float
    active: bool


class Transaction(BaseModel):
    id: str
    type: str
    amount: float
    shares: float
    asset: str
    user: str
    timestamp: str
    block_number: int
    tx_hash: str


class WithdrawalRequest(BaseModel):
    request_id: int
    shares: float
    assets: float
    timestamp: str
    claimed: bool
    status: str


class UserBalance(BaseModel):
    address: str
    usdc_balance: float
    bcv_shares: float
    bcv_value: float
    pending_withdrawals: List[WithdrawalRequest]
    total_deposited: float
    total_withdrawn: float
    yield_earned: float


class SyncResponse(BaseModel):
    success: bool
    tx_hash: Optional[str] = None
    error: Optional[str] = None


# --- Helper Functions ---

def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def fetch_on_chain_state() -> Dict[str, Any]:
    """Fetch current state from blockchain"""
    try:
        total_assets = vault_contract.functions.totalAssets().call()
        total_shares = vault_contract.functions.totalSupply().call()
        last_sync = vault_contract.functions.lastSync().call()
        idle_assets = vault_contract.functions.totalIdle().call()
        
        # Calculate share price
        if total_shares > 0:
            share_price = (total_assets / (10 ** USDC_DECIMALS)) / (total_shares / (10 ** BCV_DECIMALS))
        else:
            share_price = 1.0
        
        # Fetch agent balances
        agent_balances = []
        for i in range(3):
            agent_data = vault_contract.functions.agents(i).call()
            agent_balances.append(format_usdc(agent_data[2]))
        
        return {
            "total_assets": total_assets,
            "total_shares": total_shares,
            "share_price": share_price,
            "last_sync": last_sync,
            "idle_assets": idle_assets,
            "agent_balances": agent_balances
        }
    except Exception as e:
        logger.error("fetch_on_chain_state_failed", error=str(e))
        raise


# --- API Endpoints ---

@router.get("/state", response_model=VaultStateResponse)
async def get_vault_state(db: SessionLocal = Depends(get_db_session)):
    """Get current vault state from blockchain"""
    try:
        state = fetch_on_chain_state()
        
        # Get depositor count from database
        depositor_count = db.query(UserPosition).count()
        
        return VaultStateResponse(
            tvl=format_usdc(state["total_assets"]),
            tvl_change_24h=0.0,  # Would calculate from historical data
            apy=8.42,  # Would calculate from yield events
            apy_change_24h=0.0,
            share_price=state["share_price"],
            depositors=depositor_count,
            total_shares=format_bcv(state["total_shares"]),
            last_update=datetime.utcnow().isoformat(),
            last_sync=state["last_sync"],
            idle_assets=format_usdc(state["idle_assets"]),
            agent_balances=state["agent_balances"]
        )
    except Exception as e:
        logger.error("get_vault_state_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents", response_model=List[AgentInfo])
async def get_agents():
    """Get all AI agent allocations from blockchain"""
    try:
        agents = []
        total_balance = 0
        agent_data_list = []
        
        for i in range(3):
            agent_data = vault_contract.functions.agents(i).call()
            balance = format_usdc(agent_data[2])
            total_balance += balance
            agent_data_list.append({
                "index": i,
                "adapter": agent_data[0],
                "credit_limit": format_usdc(agent_data[1]),
                "balance": balance,
                "active": agent_data[3]
            })
        
        agent_names = ["Aave Agent", "Pendle Agent", "Morpho Agent"]
        protocols = ["Aave V3", "Pendle", "Morpho"]
        target_allocations = [0.40, 0.35, 0.25]  # 40/35/25 split
        
        for i, data in enumerate(agent_data_list):
            allocation = (data["balance"] / total_balance * 100) if total_balance > 0 else 0
            
            agents.append(AgentInfo(
                id=i,
                name=agent_names[i],
                protocol=protocols[i],
                adapter=data["adapter"],
                credit_limit=data["credit_limit"],
                balance=data["balance"],
                apy=8.42,  # Mock APY - would come from actual yield tracking
                allocation=allocation,
                target_allocation=target_allocations[i] * 100,
                active=data["active"]
            ))
        
        return agents
    except Exception as e:
        logger.error("get_agents_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    limit: int = 10,
    offset: int = 0,
    user: Optional[str] = None,
    db: SessionLocal = Depends(get_db_session)
):
    """Get indexed transactions from database"""
    try:
        repo = EventRepository(db)
        
        # Get both deposit and withdrawal events
        events = repo.get_events(
            event_type=None,  # Get all types
            user_address=user.lower() if user else None,
            limit=limit,
            offset=offset
        )
        
        transactions = []
        for event in events:
            args = event.get_args()
            
            if event.event_type == "DepositMade":
                transactions.append(Transaction(
                    id=f"{event.transaction_hash}_{event.log_index}",
                    type="deposit",
                    amount=format_usdc(args.get("assets", 0)),
                    shares=format_bcv(args.get("shares", 0)),
                    asset="USDC",
                    user=args.get("receiver", ""),
                    timestamp=event.created_at.isoformat() if event.created_at else datetime.utcnow().isoformat(),
                    block_number=event.block_number,
                    tx_hash=event.transaction_hash
                ))
            elif event.event_type == "WithdrawalQueued":
                transactions.append(Transaction(
                    id=f"{event.transaction_hash}_{event.log_index}",
                    type="withdraw_request",
                    amount=format_usdc(args.get("assets", 0)),
                    shares=format_bcv(args.get("shares", 0)),
                    asset="USDC",
                    user=args.get("user", ""),
                    timestamp=event.created_at.isoformat() if event.created_at else datetime.utcnow().isoformat(),
                    block_number=event.block_number,
                    tx_hash=event.transaction_hash
                ))
            elif event.event_type == "WithdrawalCompleted":
                transactions.append(Transaction(
                    id=f"{event.transaction_hash}_{event.log_index}",
                    type="withdraw_complete",
                    amount=format_usdc(args.get("assets", 0)),
                    shares=0,
                    asset="USDC",
                    user=args.get("user", ""),
                    timestamp=event.created_at.isoformat() if event.created_at else datetime.utcnow().isoformat(),
                    block_number=event.block_number,
                    tx_hash=event.transaction_hash
                ))
        
        return transactions
    except Exception as e:
        logger.error("get_transactions_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/yield-history")
async def get_yield_history(db: SessionLocal = Depends(get_db_session)):
    """Get yield history from indexed events"""
    try:
        repo = EventRepository(db)
        sync_events = repo.get_events(event_type="BalancesSynced", limit=100)
        
        # Calculate yield from balance changes
        yield_history = []
        for event in sync_events:
            args = event.get_args()
            balances = args.get("balances", [0, 0, 0])
            total = sum(balances) / (10 ** USDC_DECIMALS)
            
            yield_history.append({
                "timestamp": event.created_at.isoformat() if event.created_at else datetime.utcnow().isoformat(),
                "block_number": event.block_number,
                "total_deployed": total,
                "agent_balances": [b / (10 ** USDC_DECIMALS) for b in balances]
            })
        
        return yield_history
    except Exception as e:
        logger.error("get_yield_history_failed", error=str(e))
        return []


@router.get("/user/{user_address}/balance", response_model=UserBalance)
async def get_user_balance(user_address: str, db: SessionLocal = Depends(get_db_session)):
    """Get user balance and positions"""
    try:
        # Validate address
        if not Web3.is_address(user_address):
            raise HTTPException(status_code=400, detail="Invalid address")
        
        user_address = Web3.to_checksum_address(user_address)
        
        # Fetch from blockchain
        shares = vault_contract.functions.balanceOf(user_address).call()
        assets = vault_contract.functions.convertToAssets(shares).call()
        pending = vault_contract.functions.pendingAssets(user_address).call()
        
        # Get withdrawal history
        withdrawals = vault_contract.functions.getUserWithdrawals(user_address).call()
        
        # Get pending from database
        withdrawal_repo = WithdrawalRepository(db)
        db_withdrawals = withdrawal_repo.get_by_user(user_address.lower())
        
        pending_withdrawals = []
        for i, w in enumerate(withdrawals):
            shares_val, assets_val, timestamp, claimed = w
            
            # Find status from database
            status = "completed" if claimed else "pending"
            for db_w in db_withdrawals:
                if db_w.request_id == i:
                    status = db_w.status
                    break
            
            pending_withdrawals.append(WithdrawalRequest(
                request_id=i,
                shares=format_bcv(shares_val),
                assets=format_usdc(assets_val),
                timestamp=datetime.fromtimestamp(timestamp).isoformat(),
                claimed=claimed,
                status=status
            ))
        
        # Get user position from database
        position_repo = UserPositionRepository(db)
        position = position_repo.get_or_create(user_address.lower())
        
        # Calculate yield earned
        yield_earned = max(0, format_usdc(position.total_withdrawn + assets - position.total_deposited))
        
        return UserBalance(
            address=user_address,
            usdc_balance=format_usdc(assets),
            bcv_shares=format_bcv(shares),
            bcv_value=format_usdc(assets),
            pending_withdrawals=pending_withdrawals,
            total_deposited=format_usdc(position.total_deposited),
            total_withdrawn=format_usdc(position.total_withdrawn),
            yield_earned=yield_earned
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_user_balance_failed", error=str(e), user=user_address)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_address}/transactions")
async def get_user_transactions(
    user_address: str,
    limit: int = 10,
    db: SessionLocal = Depends(get_db_session)
):
    """Get transactions for a specific user"""
    return await get_transactions(limit=limit, user=user_address, db=db)


@router.post("/sync", response_model=SyncResponse)
async def trigger_sync():
    """Manually trigger balance sync (requires keeper auth in production)"""
    from app.services.balance_sync import BalanceSync
    
    try:
        sync_service = BalanceSync()
        # This will run one sync cycle
        await sync_service._sync_balances()
        return SyncResponse(success=True)
    except Exception as e:
        logger.error("manual_sync_failed", error=str(e))
        return SyncResponse(success=False, error=str(e))
