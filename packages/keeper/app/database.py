"""
Database models for event indexing and keeper state.
Uses SQLite for simplicity, can be upgraded to PostgreSQL for production.
"""
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.sql import desc

from app.config import settings

Base = declarative_base()

class Event(Base):
    """Indexed blockchain events"""
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True)
    block_number = Column(BigInteger, nullable=False, index=True)
    block_hash = Column(String(66))
    transaction_hash = Column(String(66), index=True)
    log_index = Column(Integer)
    event_type = Column(String(50), nullable=False, index=True)  # DepositMade, WithdrawalQueued, etc.
    contract_address = Column(String(42))
    
    # Event arguments (stored as JSON)
    args = Column(Text)
    
    # Indexed fields for quick lookup
    user_address = Column(String(42), index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def get_args(self) -> Dict[str, Any]:
        return json.loads(self.args) if self.args else {}
    
    def set_args(self, args: Dict[str, Any]):
        self.args = json.dumps(args)


class VaultState(Base):
    """Cached vault state"""
    __tablename__ = "vault_state"
    
    id = Column(Integer, primary_key=True)
    
    # TVL and metrics
    total_assets = Column(BigInteger, default=0)  # In USDC wei (6 decimals)
    total_shares = Column(BigInteger, default=0)  # In BCV wei (18 decimals)
    share_price = Column(Float, default=1.0)
    
    # Agent balances (in USDC wei)
    agent_0_balance = Column(BigInteger, default=0)
    agent_1_balance = Column(BigInteger, default=0)
    agent_2_balance = Column(BigInteger, default=0)
    
    # Sync state
    last_sync_block = Column(BigInteger, default=0)
    last_sync_timestamp = Column(DateTime)
    
    # Counters
    total_deposits = Column(Integer, default=0)
    total_withdrawals = Column(Integer, default=0)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PendingWithdrawalDB(Base):
    """Pending withdrawal requests"""
    __tablename__ = "pending_withdrawals"
    
    id = Column(Integer, primary_key=True)
    user_address = Column(String(42), nullable=False, index=True)
    request_id = Column(Integer, nullable=False)
    shares = Column(BigInteger)
    assets = Column(BigInteger)
    block_number = Column(BigInteger)
    timestamp = Column(DateTime, default=datetime.utcnow)
    claimed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    tx_hash = Column(String(66))
    
    # Processing state
    status = Column(String(20), default="pending")  # pending, processing, completed, failed
    attempts = Column(Integer, default=0)
    error_message = Column(Text)


class UserPosition(Base):
    """Cached user positions"""
    __tablename__ = "user_positions"
    
    id = Column(Integer, primary_key=True)
    address = Column(String(42), unique=True, nullable=False, index=True)
    
    shares = Column(BigInteger, default=0)
    pending_assets = Column(BigInteger, default=0)
    
    # Totals
    total_deposited = Column(BigInteger, default=0)
    total_withdrawn = Column(BigInteger, default=0)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Database engine
engine = create_engine(
    settings.database_url,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """Get database session"""
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()


# --- Event Repository ---

class EventRepository:
    """Repository for event operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def save_event(self, event: Event) -> Event:
        """Save an event to database"""
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event
    
    def get_events(
        self,
        event_type: Optional[str] = None,
        user_address: Optional[str] = None,
        from_block: Optional[int] = None,
        to_block: Optional[int] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Event]:
        """Get events with filters"""
        query = self.db.query(Event)
        
        if event_type:
            query = query.filter(Event.event_type == event_type)
        if user_address:
            query = query.filter(Event.user_address == user_address.lower())
        if from_block:
            query = query.filter(Event.block_number >= from_block)
        if to_block:
            query = query.filter(Event.block_number <= to_block)
        
        return query.order_by(desc(Event.block_number)).offset(offset).limit(limit).all()
    
    def get_latest_block(self) -> int:
        """Get highest indexed block number"""
        result = self.db.query(Event).order_by(desc(Event.block_number)).first()
        return result.block_number if result else 0
    
    def event_exists(self, tx_hash: str, log_index: int) -> bool:
        """Check if event already indexed"""
        return self.db.query(Event).filter(
            Event.transaction_hash == tx_hash,
            Event.log_index == log_index
        ).first() is not None


# --- Vault State Repository ---

class VaultStateRepository:
    """Repository for vault state"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_state(self) -> Optional[VaultState]:
        """Get current vault state (creates if not exists)"""
        state = self.db.query(VaultState).first()
        if not state:
            state = VaultState()
            self.db.add(state)
            self.db.commit()
            self.db.refresh(state)
        return state
    
    def update_state(self, **kwargs) -> VaultState:
        """Update vault state"""
        state = self.get_state()
        for key, value in kwargs.items():
            if hasattr(state, key):
                setattr(state, key, value)
        state.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(state)
        return state


# --- Withdrawal Repository ---

class WithdrawalRepository:
    """Repository for withdrawal operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_withdrawal(
        self,
        user_address: str,
        request_id: int,
        shares: int,
        assets: int,
        block_number: int
    ) -> PendingWithdrawalDB:
        """Create new pending withdrawal"""
        withdrawal = PendingWithdrawalDB(
            user_address=user_address.lower(),
            request_id=request_id,
            shares=shares,
            assets=assets,
            block_number=block_number
        )
        self.db.add(withdrawal)
        self.db.commit()
        self.db.refresh(withdrawal)
        return withdrawal
    
    def get_pending(self) -> List[PendingWithdrawalDB]:
        """Get all pending withdrawals"""
        return self.db.query(PendingWithdrawalDB).filter(
            PendingWithdrawalDB.status.in_(["pending", "processing"])
        ).order_by(PendingWithdrawalDB.timestamp).all()
    
    def get_by_user(self, user_address: str) -> List[PendingWithdrawalDB]:
        """Get withdrawals for a user"""
        return self.db.query(PendingWithdrawalDB).filter(
            PendingWithdrawalDB.user_address == user_address.lower()
        ).order_by(desc(PendingWithdrawalDB.timestamp)).all()
    
    def mark_completed(
        self,
        withdrawal_id: int,
        tx_hash: str
    ) -> PendingWithdrawalDB:
        """Mark withdrawal as completed"""
        withdrawal = self.db.query(PendingWithdrawalDB).get(withdrawal_id)
        if withdrawal:
            withdrawal.status = "completed"
            withdrawal.claimed = True
            withdrawal.completed_at = datetime.utcnow()
            withdrawal.tx_hash = tx_hash
            self.db.commit()
            self.db.refresh(withdrawal)
        return withdrawal
    
    def mark_failed(self, withdrawal_id: int, error: str):
        """Mark withdrawal as failed"""
        withdrawal = self.db.query(PendingWithdrawalDB).get(withdrawal_id)
        if withdrawal:
            withdrawal.status = "failed"
            withdrawal.error_message = error
            withdrawal.attempts += 1
            self.db.commit()


# --- User Position Repository ---

class UserPositionRepository:
    """Repository for user positions"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_or_create(self, address: str) -> UserPosition:
        """Get or create user position"""
        position = self.db.query(UserPosition).filter(
            UserPosition.address == address.lower()
        ).first()
        
        if not position:
            position = UserPosition(address=address.lower())
            self.db.add(position)
            self.db.commit()
            self.db.refresh(position)
        
        return position
    
    def update_shares(self, address: str, shares: int):
        """Update user shares"""
        position = self.get_or_create(address)
        position.shares = shares
        position.updated_at = datetime.utcnow()
        self.db.commit()
    
    def add_deposit(self, address: str, amount: int):
        """Record deposit"""
        position = self.get_or_create(address)
        position.total_deposited += amount
        position.updated_at = datetime.utcnow()
        self.db.commit()
    
    def add_withdrawal(self, address: str, amount: int):
        """Record withdrawal"""
        position = self.get_or_create(address)
        position.total_withdrawn += amount
        position.updated_at = datetime.utcnow()
        self.db.commit()
