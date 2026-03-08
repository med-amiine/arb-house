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
    realized_yield: float  # 30-day trailing average (shown in UI)
    risk_score: int  # Fixed at 95 in UI
    share_price: float
    depositors: int
    total_shares: float
    last_update: str
    last_sync: int
    idle_assets: float
    agent_balances: List[float]
    utilization: float  # Added to match UI calculation
    active_agents: int  # Count of active agents


class AgentInfo(BaseModel):
    id: int
    name: str
    strategy: str  # Added: Conservative Lending, PT Yield Holding, etc.
    protocol: str
    adapter: str
    credit_limit: float
    balance: float
    apy: float
    allocation: float
    target_allocation: float
    active: bool
    risk: str  # Added: Low, Medium, High


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


class AllocateRequest(BaseModel):
    allocations: Optional[List[int]] = None  # Optional manual allocations, if not provided will calculate optimal


class AllocateResponse(BaseModel):
    success: bool
    allocations: Optional[List[int]] = None
    tx_hash: Optional[str] = None
    error: Optional[str] = None


class RadarMetric(BaseModel):
    label: str
    value: int  # 0-100 scale
    icon: str  # Icon name reference


class RiskAnalysisResponse(BaseModel):
    """Risk metrics for VaultRadar component"""
    overall_score: int  # Fixed at 95
    metrics: List[RadarMetric]
    active_agents: int
    last_updated: str


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
    """Get current vault state from blockchain - matches UI VaultState component"""
    try:
        state = fetch_on_chain_state()
        
        # Get depositor count from database
        depositor_count = db.query(UserPosition).count()
        
        # Calculate utilization (matches UI: (totalAssets - totalIdle) / totalAssets)
        total_assets = format_usdc(state["total_assets"])
        idle_assets = format_usdc(state["idle_assets"])
        deployed = total_assets - idle_assets
        utilization = (deployed / total_assets * 100) if total_assets > 0 else 0
        
        # Count active agents
        active_count = sum(1 for b in state["agent_balances"] if b > 0)
        
        return VaultStateResponse(
            tvl=total_assets,
            tvl_change_24h=0.0,  # Would calculate from historical data
            apy=settings.mock_apy,  # 11.8% - matches UI realized yield
            apy_change_24h=0.0,
            realized_yield=settings.mock_apy,  # 30-day trailing average shown in UI
            risk_score=settings.mock_risk_score,  # Fixed at 95
            share_price=state["share_price"],
            depositors=depositor_count or settings.mock_depositors,
            total_shares=format_bcv(state["total_shares"]),
            last_update=datetime.utcnow().isoformat(),
            last_sync=state["last_sync"],
            idle_assets=idle_assets,
            agent_balances=state["agent_balances"],
            utilization=utilization,
            active_agents=active_count
        )
    except Exception as e:
        logger.error("get_vault_state_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents", response_model=List[AgentInfo])
async def get_agents():
    """Get all AI agent allocations from blockchain - matches UI AgentList component"""
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
        
        # Use config values that match UI (AgentList.tsx)
        target_allocations = [0.40, 0.35, 0.25]  # 40/35/25 split
        
        for i, data in enumerate(agent_data_list):
            allocation = (data["balance"] / total_balance * 100) if total_balance > 0 else 33.33
            
            agents.append(AgentInfo(
                id=i,
                name=settings.agent_names[i],
                strategy=settings.agent_strategies[i],
                protocol=settings.agent_protocols[i],
                adapter=data["adapter"],
                credit_limit=data["credit_limit"],
                balance=data["balance"],
                apy=settings.agent_target_apys[i],  # Agent-specific APY from config
                allocation=round(allocation),
                target_allocation=target_allocations[i] * 100,
                active=data["active"],
                risk=settings.agent_risks[i]
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


@router.get("/user/{user_address}/cached", response_model=UserBalance)
async def get_user_cached(user_address: str, db: SessionLocal = Depends(get_db_session)):
    """
    Get cached user data from database only (no blockchain calls).
    Use this as fallback when blockchain is not accessible.
    """
    try:
        if not Web3.is_address(user_address):
            raise HTTPException(status_code=400, detail="Invalid address")
        
        user_address = Web3.to_checksum_address(user_address)
        
        # Get user position from database (cached data)
        position_repo = UserPositionRepository(db)
        position = position_repo.get_or_create(user_address.lower())
        
        # Get withdrawals from database
        withdrawal_repo = WithdrawalRepository(db)
        db_withdrawals = withdrawal_repo.get_by_user(user_address.lower())
        
        pending_withdrawals = []
        for w in db_withdrawals:
            pending_withdrawals.append(WithdrawalRequest(
                request_id=w.request_id,
                shares=format_bcv(w.shares),
                assets=format_usdc(w.assets),
                timestamp=w.timestamp.isoformat() if w.timestamp else datetime.utcnow().isoformat(),
                claimed=w.claimed,
                status=w.status
            ))
        
        # Calculate yield from cached data
        shares = position.shares
        # Estimate assets from shares using cached share price or default 1:1
        share_price = 1.0  # Could be cached in database
        assets = int(shares * share_price)
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
        logger.error("get_user_cached_failed", error=str(e), user=user_address)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk-metrics", response_model=RiskAnalysisResponse)
async def get_risk_metrics():
    """
    Get risk analysis metrics for VaultRadar component.
    Matches the 5-metric radar chart in the UI.
    """
    try:
        # Fetch agent data to calculate dynamic metrics
        active_count = 0
        for i in range(3):
            try:
                agent_data = vault_contract.functions.agents(i).call()
                if agent_data[3]:  # active flag
                    active_count += 1
            except Exception:
                pass
        
        # Calculate metrics (matching VaultRadar.tsx logic)
        # Overall score is fixed at 95, individual metrics vary
        metrics = [
            RadarMetric(label="Performance", value=92, icon="TrendingUp"),
            RadarMetric(
                label="Stability", 
                value=min(100, 88 + (active_count * 2)),  # 88-94 based on active agents
                icon="Lock"
            ),
            RadarMetric(
                label="Liquidity", 
                value=min(100, 90 + (active_count * 2)),  # 90-96 based on active agents
                icon="Zap"
            ),
            RadarMetric(label="Execution", value=94, icon="Activity"),
            RadarMetric(
                label="Trust", 
                value=min(100, 85 + (active_count * 3)),  # 85-94 based on active agents
                icon="Shield"
            ),
        ]
        
        return RiskAnalysisResponse(
            overall_score=95,  # Fixed to match UI
            metrics=metrics,
            active_agents=active_count,
            last_updated=datetime.utcnow().isoformat()
        )
    except Exception as e:
        logger.error("get_risk_metrics_failed", error=str(e))
        # Return fallback values that match UI
        return RiskAnalysisResponse(
            overall_score=95,
            metrics=[
                RadarMetric(label="Performance", value=92, icon="TrendingUp"),
                RadarMetric(label="Stability", value=94, icon="Lock"),
                RadarMetric(label="Liquidity", value=96, icon="Zap"),
                RadarMetric(label="Execution", value=94, icon="Activity"),
                RadarMetric(label="Trust", value=94, icon="Shield"),
            ],
            active_agents=3,
            last_updated=datetime.utcnow().isoformat()
        )


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


@router.post("/allocate", response_model=AllocateResponse)
async def allocate_funds(request: AllocateRequest = None):
    """Allocate idle funds to agents based on target weights or manual allocations"""
    from app.services.balance_sync import BalanceSync
    
    try:
        sync_service = BalanceSync()
        
        if request and request.allocations:
            # Manual allocations provided
            allocations = request.allocations
            if len(allocations) != 3:
                return AllocateResponse(success=False, error="Must provide exactly 3 allocation amounts")
        else:
            # Calculate optimal allocations
            allocations = await sync_service._calculate_allocations()
        
        # Execute the allocation
        tx_hash = await sync_service._execute_allocation(allocations)
        
        return AllocateResponse(
            success=True, 
            allocations=allocations, 
            tx_hash=tx_hash.hex() if tx_hash else None
        )
    except Exception as e:
        logger.error("allocation_failed", error=str(e))
        return AllocateResponse(success=False, error=str(e))
