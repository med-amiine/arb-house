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
            "inputs": [{"name": "allocations", "type": "uint256[3]"}],
            "name": "allocateToAgents",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "calculateAllocations",
            "outputs": [{"name": "", "type": "uint256[3]"}],
            "stateMutability": "view",
            "type": "function"
        },
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
        """Check if rebalancing is needed and trigger allocation if idle funds available"""
        try:
            should_rebal = self.vault.functions.shouldRebalance().call()
            idle_funds = self.vault.functions.totalIdle().call()
            
            if should_rebal and idle_funds > 0:
                logger.info("rebalance_needed_with_idle_funds", idle_funds=idle_funds)
                # Automatically allocate idle funds to agents
                try:
                    allocations = await self._calculate_allocations()
                    if any(alloc > 0 for alloc in allocations):
                        tx_hash = await self._execute_allocation(allocations)
                        logger.info("auto_allocation_completed", 
                                  allocations=allocations, 
                                  tx_hash=tx_hash.hex())
                except Exception as e:
                    logger.error("auto_allocation_failed", error=str(e))
            elif should_rebal:
                logger.debug("rebalance_needed_but_no_idle_funds")
                
        except Exception as e:
            logger.error("rebalance_check_failed", error=str(e))
    
    async def _calculate_allocations(self) -> List[int]:
        """Calculate optimal allocations based on target weights and idle funds"""
        try:
            # Call the contract's calculateAllocations function
            allocations = self.vault.functions.calculateAllocations().call()
            logger.info("calculated_allocations", allocations=allocations)
            return list(allocations)
        except Exception as e:
            logger.error("calculate_allocations_failed", error=str(e))
            # Fallback: simple equal allocation of idle funds
            try:
                idle_funds = self.vault.functions.totalIdle().call()
                if idle_funds == 0:
                    return [0, 0, 0]
                
                # Get agent info to check credit limits
                allocations = [0, 0, 0]
                remaining = idle_funds
                
                for i in range(3):
                    agent = self.vault.functions.agents(i).call()
                    if not agent[3]:  # active
                        continue
                    
                    available_credit = agent[1] - agent[2]  # creditLimit - currentBalance
                    if available_credit > 0:
                        alloc = min(available_credit, remaining // (3 - i))
                        allocations[i] = alloc
                        remaining -= alloc
                
                logger.info("fallback_allocations_calculated", allocations=allocations)
                return allocations
            except Exception as e2:
                logger.error("fallback_allocation_failed", error=str(e2))
                return [0, 0, 0]
    
    async def _execute_allocation(self, allocations: List[int]) -> str:
        """Execute allocation transaction on the vault contract"""
        try:
            # Convert to uint256[3] format expected by contract
            alloc_array = (allocations[0], allocations[1], allocations[2])
            
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
            
            tx = self.vault.functions.allocateToAgents(alloc_array).build_transaction({
                'from': self.keeper_account.address,
                'nonce': self.w3.eth.get_transaction_count(self.keeper_account.address),
                'gas': 200000,
                'maxFeePerGas': max_fee,
                'maxPriorityFeePerGas': max_priority,
                'chainId': settings.chain_id
            })
            
            signed = self.w3.eth.account.sign_transaction(tx, settings.keeper_private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction)
            
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            
            if receipt.status == 1:
                logger.info("allocation_executed",
                           tx_hash=tx_hash.hex(),
                           allocations=allocations)
                return tx_hash
            else:
                logger.error("allocation_transaction_failed", tx_hash=tx_hash.hex())
                raise Exception(f"Transaction failed: {tx_hash.hex()}")
                
        except Exception as e:
            logger.error("allocation_execution_failed", error=str(e))
            raise
    
    def stop(self):
        self.running = False
