import asyncio
import structlog
from typing import List, Optional
from web3 import Web3
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

logger = structlog.get_logger()

class BalanceSync:
    """Periodically syncs agent balances with vault contract"""
    
    VAULT_ABI = [
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
        {
            "inputs": [],
            "name": "shouldRebalance",
            "outputs": [{"name": "", "type": "bool"}],
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
        }
    ]
    
    _instance = None
    last_sync: Optional[int] = None
    
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
            
    async def run(self):
        """Main sync loop"""
        logger.info("balance_sync_starting", interval=settings.sync_interval_seconds)
        self.running = True
        
        while self.running:
            try:
                await self._sync_balances()
                await self._check_rebalance()
                await asyncio.sleep(settings.sync_interval_seconds)
            except Exception as e:
                logger.error("balance_sync_error", error=str(e))
                await asyncio.sleep(30)  # Longer backoff on sync errors
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def _sync_balances(self):
        """Fetch agent balances and sync to vault"""
        balances = await self._fetch_agent_balances()
        
        logger.info("syncing_balances", balances=balances)
        
        tx = self.vault.functions.syncBalances(balances).build_transaction({
            'from': self.keeper_account.address,
            'nonce': self.w3.eth.get_transaction_count(self.keeper_account.address),
            'gas': 150000,
            'maxFeePerGas': self.w3.eth.max_fee_per_gas,
            'maxPriorityFeePerGas': self.w3.eth.max_priority_fee_per_gas
        })
        
        signed = self.w3.eth.account.sign_transaction(tx, settings.keeper_private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction)
        
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        
        if receipt.status == 1:
            self.last_sync = int(asyncio.get_event_loop().time())
            logger.info("balances_synced",
                       tx_hash=tx_hash.hex(),
                       balances=balances)
        else:
            logger.error("balance_sync_failed", tx_hash=tx_hash.hex())
    
    async def _fetch_agent_balances(self) -> List[int]:
        """Fetch current balances from all 3 agents via contract"""
        balances = []
        for i in range(3):
            try:
                # Read from contract (last known balance)
                agent_data = self.vault.functions.agents(i).call()
                current_balance = agent_data[2]  # currentBalance
                balances.append(current_balance)
            except Exception as e:
                logger.error("fetch_agent_balance_failed", agent=i, error=str(e))
                balances.append(0)
        
        return balances
    
    async def _check_rebalance(self):
        """Check if rebalancing is needed"""
        try:
            should_rebal = self.vault.functions.shouldRebalance().call()
            
            if should_rebal:
                logger.info("rebalance_needed")
                # Note: Actual rebalancing would be implemented here
                # For MVP, we just log it
                
        except Exception as e:
            logger.error("rebalance_check_failed", error=str(e))
    
    def stop(self):
        self.running = False
