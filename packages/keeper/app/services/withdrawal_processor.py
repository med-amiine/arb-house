import asyncio
import structlog
from typing import Dict, List, Optional
from dataclasses import dataclass
from web3 import Web3
from web3.types import TxReceipt
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

logger = structlog.get_logger()

@dataclass
class PendingWithdrawal:
    user: str
    request_id: int
    assets: int
    timestamp: float
    attempts: int = 0

class WithdrawalProcessor:
    """Processes async withdrawals by pulling from agents"""
    
    VAULT_ABI = [
        {
            "inputs": [
                {"name": "user", "type": "address"},
                {"name": "requestId", "type": "uint256"}
            ],
            "name": "completeWithdrawal",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{"name": "user", "type": "address"}],
            "name": "pendingAssets",
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
        }
    ]
    
    _instance = None
    _queue: List[PendingWithdrawal] = []
    _pending_count = 0
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.w3 = Web3(Web3.HTTPProvider(settings.arb_rpc_url))
            self.vault = self.w3.eth.contract(
                address=Web3.to_checksum_address(settings.vault_address),
                abi=self.VAULT_ABI
            )
            self.keeper_account = self.w3.eth.account.from_key(settings.keeper_private_key)
            self.running = False
            self.initialized = True
            
    @property
    def pending_count(self) -> int:
        return self._pending_count
        
    @property
    def queue_depth(self) -> int:
        return len(self._queue)
    
    async def run(self):
        """Main processing loop"""
        logger.info("withdrawal_processor_starting")
        self.running = True
        
        while self.running:
            try:
                await self._process_queue()
                await asyncio.sleep(settings.withdrawal_poll_interval_seconds)
            except Exception as e:
                logger.error("withdrawal_processor_error", error=str(e))
                await asyncio.sleep(5)
    
    async def queue_withdrawal(self, user: str, request_id: int, assets: int):
        """Add withdrawal to processing queue"""
        withdrawal = PendingWithdrawal(
            user=user,
            request_id=request_id,
            assets=assets,
            timestamp=asyncio.get_event_loop().time()
        )
        self._queue.append(withdrawal)
        self._pending_count += 1
        logger.info("withdrawal_queued_for_processing",
                   user=user, request_id=request_id, assets=assets)
    
    async def _process_queue(self):
        """Process pending withdrawals"""
        if not self._queue:
            return
            
        # Check vault idle balance
        idle_balance = self.vault.functions.totalIdle().call()
        
        # Process FIFO
        completed = []
        for withdrawal in self._queue:
            if idle_balance >= withdrawal.assets:
                success = await self._complete_withdrawal(withdrawal)
                if success:
                    completed.append(withdrawal)
                    idle_balance -= withdrawal.assets
            else:
                # Need to recall from agents
                await self._recall_from_agents(withdrawal.assets)
                break  # Wait for next iteration
                
        # Remove completed
        for withdrawal in completed:
            self._queue.remove(withdrawal)
            self._pending_count -= 1
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def _complete_withdrawal(self, withdrawal: PendingWithdrawal) -> bool:
        """Complete a single withdrawal on-chain"""
        try:
            logger.info("completing_withdrawal",
                       user=withdrawal.user,
                       request_id=withdrawal.request_id,
                       assets=withdrawal.assets)
            
            tx = self.vault.functions.completeWithdrawal(
                withdrawal.user,
                withdrawal.request_id
            ).build_transaction({
                'from': self.keeper_account.address,
                'nonce': self.w3.eth.get_transaction_count(self.keeper_account.address),
                'gas': 200000,
                'maxFeePerGas': self.w3.eth.max_fee_per_gas if hasattr(self.w3.eth, 'max_fee_per_gas') else self.w3.eth.gas_price,
                'maxPriorityFeePerGas': self.w3.eth.max_priority_fee_per_gas if hasattr(self.w3.eth, 'max_priority_fee_per_gas') else self.w3.eth.gas_price // 10
            })
            
            signed = self.w3.eth.account.sign_transaction(tx, settings.keeper_private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction)
            
            receipt: TxReceipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            
            if receipt.status == 1:
                logger.info("withdrawal_completed",
                           tx_hash=tx_hash.hex(),
                           user=withdrawal.user,
                           request_id=withdrawal.request_id)
                return True
            else:
                logger.error("withdrawal_failed", tx_hash=tx_hash.hex())
                return False
                
        except Exception as e:
            logger.error("complete_withdrawal_error",
                        error=str(e),
                        user=withdrawal.user,
                        request_id=withdrawal.request_id)
            raise
    
    async def _recall_from_agents(self, amount: int):
        """Recall capital from agents to fulfill withdrawal"""
        logger.info("recalling_from_agents", amount=amount)
        
        # In production: call Giza SDK to unwind agent positions
        # For now, log the need for manual intervention
        # TODO: Implement GizaAgentClient integration
        
        # Priority: Agent 0 → Agent 1 → Agent 2 (FIFO)
        # await giza_client.withdraw_from_agent(0, amount)
        
    def stop(self):
        self.running = False
