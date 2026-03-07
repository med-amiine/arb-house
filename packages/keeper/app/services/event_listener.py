import asyncio
import json
import structlog
from typing import Optional
from web3 import Web3, AsyncWeb3
from web3.types import EventData

from app.config import settings

logger = structlog.get_logger()

class EventListener:
    """Listens for on-chain events and triggers keeper actions"""
    
    # BondCreditVault ABI (minimal for events)
    VAULT_ABI = [
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
                {"indexed": True, "name": "receiver", "type": "address"},
                {"name": "assets", "type": "uint256"},
                {"name": "shares", "type": "uint256"}
            ],
            "name": "DepositMade",
            "type": "event"
        },
        {
            "inputs": [],
            "name": "totalAssets",
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
        
        # Initialize Web3
        self.w3 = Web3(Web3.HTTPProvider(settings.arb_rpc_url))
        self.vault = self.w3.eth.contract(
            address=Web3.to_checksum_address(settings.vault_address),
            abi=self.VAULT_ABI
        )
        
        self.running = True
        self.last_block = self.w3.eth.block_number
        
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
            
        # Get WithdrawalQueued events
        events = self.vault.events.WithdrawalQueued().get_logs(
            fromBlock=self.last_block + 1,
            toBlock=current_block
        )
        
        for event in events:
            await self._handle_withdrawal_queued(event)
            
        # Get DepositMade events (for potential rebalancing)
        deposit_events = self.vault.events.DepositMade().get_logs(
            fromBlock=self.last_block + 1,
            toBlock=current_block
        )
        
        for event in deposit_events:
            logger.info("deposit_detected", 
                       receiver=event.args.receiver,
                       assets=event.args.assets,
                       shares=event.args.shares)
        
        self.last_block = current_block
        
    async def _handle_withdrawal_queued(self, event: EventData):
        """Process WithdrawalQueued event"""
        logger.info("withdrawal_queued_detected",
                   user=event.args.user,
                   request_id=event.args.requestId,
                   shares=event.args.shares,
                   assets=event.args.assets,
                   block=event.blockNumber)
        
        # Queue for processing (withdrawal processor will pick this up)
        # In production, use Redis/RabbitMQ for queue
        from app.services.withdrawal_processor import WithdrawalProcessor
        processor = WithdrawalProcessor()
        await processor.queue_withdrawal(
            user=event.args.user,
            request_id=event.args.requestId,
            assets=event.args.assets
        )
        
    def stop(self):
        self.running = False
