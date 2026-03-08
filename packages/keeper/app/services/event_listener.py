"""
Event Listener Service - Indexes blockchain events into database
"""
import asyncio
import json
import structlog
from typing import Optional, Dict, Any
from web3 import Web3
from web3.types import EventData
from datetime import datetime

from app.config import settings
from app.database import (
    SessionLocal, init_db,
    EventRepository, VaultStateRepository,
    WithdrawalRepository, UserPositionRepository,
    Event
)

logger = structlog.get_logger()


class EventListener:
    """Listens for on-chain events and indexes them into database"""
    
    # BondCreditVault ABI with all events
    VAULT_ABI = [
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
        },
        {
            "anonymous": False,
            "inputs": [
                {"indexed": True, "name": "index", "type": "uint256"},
                {"name": "adapter", "type": "address"},
                {"name": "creditLimit", "type": "uint256"}
            ],
            "name": "AgentAdded",
            "type": "event"
        },
        {
            "anonymous": False,
            "inputs": [
                {"indexed": True, "name": "oldKeeper", "type": "address"},
                {"indexed": True, "name": "newKeeper", "type": "address"}
            ],
            "name": "KeeperUpdated",
            "type": "event"
        },
        {
            "anonymous": False,
            "inputs": [
                {"name": "reason", "type": "string"}
            ],
            "name": "EmergencyPause",
            "type": "event"
        },
        {
            "anonymous": False,
            "inputs": [],
            "name": "EmergencyUnpause",
            "type": "event"
        },
        # View functions
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
        }
    ]
    
    def __init__(self):
        self.w3: Optional[Web3] = None
        self.vault = None
        self.running = False
        self.last_block = 0
        
    async def run(self):
        """Main event loop"""
        logger.info("event_listener_starting")
        
        # Initialize database
        init_db()
        
        # Initialize Web3
        self.w3 = Web3(Web3.HTTPProvider(settings.arb_rpc_url))
        self.vault = self.w3.eth.contract(
            address=Web3.to_checksum_address(settings.vault_address),
            abi=self.VAULT_ABI
        )
        
        self.running = True
        
        # Get starting block from database or use current
        with SessionLocal() as db:
            repo = EventRepository(db)
            self.last_block = repo.get_latest_block()
            if self.last_block == 0:
                self.last_block = self.w3.eth.block_number - 1000  # Start from 1000 blocks ago
        
        logger.info("event_listener_initialized", 
                   start_block=self.last_block,
                   current_block=self.w3.eth.block_number)
        
        while self.running:
            try:
                await self._poll_events()
                await asyncio.sleep(settings.withdrawal_poll_interval_seconds)
            except Exception as e:
                logger.error("event_listener_error", error=str(e))
                await asyncio.sleep(5)  # Backoff on error
                
    async def _poll_events(self):
        """Poll for new events since last block"""
        current_block = self.w3.eth.block_number
        
        if current_block <= self.last_block:
            return
        
        # Limit batch size to avoid RPC limits
        batch_size = 2000
        from_block = self.last_block + 1
        
        while from_block <= current_block:
            to_block = min(from_block + batch_size - 1, current_block)
            
            await self._process_block_range(from_block, to_block)
            
            from_block = to_block + 1
        
        self.last_block = current_block
        
    async def _process_block_range(self, from_block: int, to_block: int):
        """Process events in a block range"""
        event_types = [
            ("DepositMade", self._handle_deposit),
            ("WithdrawalQueued", self._handle_withdrawal_queued),
            ("WithdrawalCompleted", self._handle_withdrawal_completed),
            ("BalancesSynced", self._handle_balances_synced),
            ("Rebalanced", self._handle_rebalanced),
            ("AgentAdded", self._handle_agent_added),
            ("KeeperUpdated", self._handle_keeper_updated),
            ("EmergencyPause", self._handle_emergency_pause),
            ("EmergencyUnpause", self._handle_emergency_unpause),
        ]
        
        for event_name, handler in event_types:
            try:
                # Get the contract event (use 'contract_event' to avoid name collision)
                contract_event = getattr(self.vault.events, event_name)()
                events_list = contract_event.get_logs(fromBlock=from_block, toBlock=to_block)
                
                for evt in events_list:
                    await self._index_event(evt, event_name, handler)
                    
            except Exception as e:
                logger.error("event_fetch_failed", 
                           event=event_name, 
                           from_block=from_block,
                           to_block=to_block,
                           error=str(e))
    
    async def _index_event(self, evt: EventData, event_type: str, handler):
        """Index a single event to database"""
        with SessionLocal() as db:
            repo = EventRepository(db)
            
            # Check if already indexed
            tx_hash = evt.transactionHash.hex()
            if repo.event_exists(tx_hash, evt.logIndex):
                return
            
            # Create event record (use 'event_record' to avoid name collision)
            event_record = Event(
                block_number=evt.blockNumber,
                block_hash=evt.blockHash.hex(),
                transaction_hash=tx_hash,
                log_index=evt.logIndex,
                event_type=event_type,
                contract_address=evt.address.lower(),
                user_address=self._extract_user_address(evt),
                created_at=datetime.utcnow()
            )
            event_record.set_args(dict(evt.args))
            
            repo.save_event(event_record)
            
            # Call specific handler (pass event data as 'event_data' to avoid conflict)
            await handler(evt, db)
            
            logger.info("event_indexed",
                       event_type=event_type,
                       block=evt.blockNumber,
                       tx=tx_hash)
    
    def _extract_user_address(self, evt: EventData) -> Optional[str]:
        """Extract user address from event args"""
        args = dict(evt.args)
        # Try common field names
        for key in ["user", "receiver", "owner", "sender"]:
            if key in args:
                return args[key].lower()
        return None
    
    # --- Event Handlers ---
    
    async def _handle_deposit(self, evt: EventData, db):
        """Handle DepositMade event"""
        args = dict(evt.args)
        receiver = args.get("receiver", "").lower()
        assets = args.get("assets", 0)
        shares = args.get("shares", 0)
        
        # Update user position
        position_repo = UserPositionRepository(db)
        position_repo.add_deposit(receiver, assets)
        
        # Update shares
        # Note: Actual shares should be fetched from contract for accuracy
        try:
            current_shares = self.vault.functions.balanceOf(receiver).call()
            position_repo.update_shares(receiver, current_shares)
        except Exception as e:
            logger.warning("failed_to_fetch_shares", user=receiver, error=str(e))
        
        logger.info("deposit_recorded", user=receiver, assets=assets, shares=shares)
    
    async def _handle_withdrawal_queued(self, evt: EventData, db):
        """Handle WithdrawalQueued event"""
        args = dict(evt.args)
        user = args.get("user", "").lower()
        request_id = args.get("requestId", 0)
        shares = args.get("shares", 0)
        assets = args.get("assets", 0)
        
        # Create pending withdrawal record
        withdrawal_repo = WithdrawalRepository(db)
        withdrawal_repo.create_withdrawal(
            user_address=user,
            request_id=request_id,
            shares=shares,
            assets=assets,
            block_number=evt.blockNumber
        )
        
        # Update user shares
        position_repo = UserPositionRepository(db)
        try:
            current_shares = self.vault.functions.balanceOf(user).call()
            position_repo.update_shares(user, current_shares)
        except Exception as e:
            logger.warning("failed_to_fetch_shares", user=user, error=str(e))
        
        # Queue for processing
        from app.services.withdrawal_processor import WithdrawalProcessor
        processor = WithdrawalProcessor()
        await processor.queue_withdrawal(user=user, request_id=request_id, assets=assets)
        
        logger.info("withdrawal_queued_recorded", 
                   user=user, 
                   request_id=request_id, 
                   assets=assets)
    
    async def _handle_withdrawal_completed(self, evt: EventData, db):
        """Handle WithdrawalCompleted event"""
        args = dict(evt.args)
        user = args.get("user", "").lower()
        request_id = args.get("requestId", 0)
        assets = args.get("assets", 0)
        
        # Update withdrawal status
        withdrawal_repo = WithdrawalRepository(db)
        withdrawals = withdrawal_repo.get_by_user(user)
        for w in withdrawals:
            if w.request_id == request_id:
                withdrawal_repo.mark_completed(
                    w.id,
                    evt.transactionHash.hex()
                )
                break
        
        # Update user position
        position_repo = UserPositionRepository(db)
        position_repo.add_withdrawal(user, assets)
        
        logger.info("withdrawal_completed_recorded", 
                   user=user, 
                   request_id=request_id, 
                   assets=assets)
    
    async def _handle_balances_synced(self, evt: EventData, db):
        """Handle BalancesSynced event"""
        args = dict(evt.args)
        balances = args.get("balances", [0, 0, 0])
        timestamp = args.get("timestamp", 0)
        
        # Update vault state
        state_repo = VaultStateRepository(db)
        
        # Fetch current totals
        try:
            total_assets = self.vault.functions.totalAssets().call()
            total_shares = self.vault.functions.totalSupply().call()
        except Exception as e:
            logger.warning("failed_to_fetch_totals", error=str(e))
            total_assets = 0
            total_shares = 0
        
        state_repo.update_state(
            total_assets=total_assets,
            total_shares=total_shares,
            agent_0_balance=balances[0] if len(balances) > 0 else 0,
            agent_1_balance=balances[1] if len(balances) > 1 else 0,
            agent_2_balance=balances[2] if len(balances) > 2 else 0,
            last_sync_block=evt.blockNumber,
            last_sync_timestamp=datetime.utcnow()
        )
        
        logger.info("balances_sync_recorded", 
                   balances=balances,
                   timestamp=timestamp)
    
    async def _handle_rebalanced(self, evt: EventData, db):
        """Handle Rebalanced event"""
        args = dict(evt.args)
        old_weights = args.get("oldWeights", [])
        new_weights = args.get("newWeights", [])
        
        logger.info("rebalance_recorded", 
                   old_weights=old_weights,
                   new_weights=new_weights)
    
    async def _handle_agent_added(self, evt: EventData, db):
        """Handle AgentAdded event"""
        args = dict(evt.args)
        index = args.get("index", 0)
        adapter = args.get("adapter", "")
        credit_limit = args.get("creditLimit", 0)
        
        logger.info("agent_added_recorded",
                   index=index,
                   adapter=adapter,
                   credit_limit=credit_limit)
    
    async def _handle_keeper_updated(self, evt: EventData, db):
        """Handle KeeperUpdated event"""
        args = dict(evt.args)
        old_keeper = args.get("oldKeeper", "")
        new_keeper = args.get("newKeeper", "")
        
        logger.info("keeper_updated_recorded",
                   old_keeper=old_keeper,
                   new_keeper=new_keeper)
    
    async def _handle_emergency_pause(self, evt: EventData, db):
        """Handle EmergencyPause event"""
        args = dict(evt.args)
        reason = args.get("reason", "")
        
        logger.warning("emergency_pause_recorded", reason=reason)
    
    async def _handle_emergency_unpause(self, evt: EventData, db):
        """Handle EmergencyUnpause event"""
        logger.info("emergency_unpause_recorded")
    
    def stop(self):
        self.running = False
