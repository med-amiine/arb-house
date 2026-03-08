import asyncio
import structlog
from typing import List, Optional
from web3 import Web3
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.services.giza_client import giza_client

logger = structlog.get_logger()

class BalanceSync:
    """Periodically syncs agent balances with vault contract
    
    Since agents are managed by third parties, we:
    1. Read current balances from the vault contract
    2. Re-sync the same values to refresh the lastSync timestamp
    3. This keeps deposits enabled (they require sync within 12 hours)
    """
    
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
        },
        {
            "inputs": [],
            "name": "keeper",
            "outputs": [{"name": "", "type": "address"}],
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
            
            # Validate keeper is authorized
            try:
                self.keeper_account = self.w3.eth.account.from_key(settings.keeper_private_key)
                contract_keeper = self.vault.functions.keeper().call()
                
                if contract_keeper.lower() != self.keeper_account.address.lower():
                    logger.error("keeper_not_authorized", 
                                configured=self.keeper_account.address,
                                expected=contract_keeper)
                else:
                    logger.info("keeper_authorized", address=self.keeper_account.address)
            except Exception as e:
                logger.error("keeper_init_failed", error=str(e))
                self.keeper_account = None
            
            self.running = False
            self.initialized = True
            
    async def run(self):
        """Main sync loop"""
        if not self.keeper_account:
            logger.error("balance_sync_no_keeper", message="Keeper not configured properly")
            return
            
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
        """Fetch agent balances from contract and re-sync to refresh timestamp"""
        balances = await self._fetch_agent_balances()
        
        # Check if we actually need to sync (skip if balances unchanged and recent sync)
        try:
            last_sync_time = self.vault.functions.lastSync().call()
            time_since_sync = asyncio.get_event_loop().time() - last_sync_time
            
            # Only sync if more than 1 hour has passed (prevents unnecessary txs)
            if time_since_sync < 3600:
                logger.debug("sync_skipped_recent", seconds_since_sync=time_since_sync)
                return
        except Exception as e:
            logger.warning("failed_to_check_last_sync", error=str(e))
        
        logger.info("syncing_balances", balances=balances)
        
        try:
            # Get gas pricing
            try:
                base_fee = self.w3.eth.get_block('latest').get('baseFeePerGas')
                if base_fee:
                    max_priority = self.w3.eth.max_priority_fee
                    max_fee = base_fee * 2 + max_priority
                else:
                    raise AttributeError("No baseFeePerGas")
            except (AttributeError, KeyError):
                # Fallback for non-EIP-1559 networks
                gas_price = self.w3.eth.gas_price
                max_fee = int(gas_price * 1.5)
                max_priority = int(gas_price * 0.1)
            
            tx = self.vault.functions.syncBalances(balances).build_transaction({
                'from': self.keeper_account.address,
                'nonce': self.w3.eth.get_transaction_count(self.keeper_account.address),
                'gas': 150000,
                'maxFeePerGas': max_fee,
                'maxPriorityFeePerGas': max_priority,
                'chainId': settings.chain_id
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
                
        except Exception as e:
            logger.error("sync_transaction_failed", error=str(e))
            raise
    
    async def _fetch_agent_balances(self) -> List[int]:
        """Fetch current balances from all 3 agents via Giza API"""
        balances = []
        for i in range(3):
            try:
                # Fetch fresh balance from Giza agent
                balance = await giza_client.get_agent_balance(i)
                balances.append(balance)
                logger.info("fetched_agent_balance", agent=i, balance=balance)
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
                # For MVP, we just log it since agents manage their own capital
                
        except Exception as e:
            logger.error("rebalance_check_failed", error=str(e))
    
    def stop(self):
        self.running = False
