"""
BondCreditVault System Simulation - ERC-4626 style with external agents and async withdrawals.

Yield accrues ONLY inside agents.
The vault itself never stores assets, only shares.

All accounting is derived:
- totalAssets = idle + sum(agent.currentBalance)
- sharePrice = totalAssets / totalShares
"""
from dataclasses import dataclass
from typing import Dict, List
from decimal import Decimal, getcontext
from datetime import datetime

# Set Decimal precision
getcontext().prec = 28

# Use Decimal for precise financial calculations
PRECISION = Decimal("1e18")
ONE = PRECISION


@dataclass
class Agent:
    """Simulates an agent with credit limit and adapter."""
    name: str
    adapter: str  # Mock adapter address
    credit_limit: Decimal
    current_balance: Decimal = Decimal(0)
    active: bool = True

    def deposit(self, amount: Decimal):
        """Deposit assets into agent."""
        if self.current_balance + amount > self.credit_limit:
            raise ValueError(f"Exceeds credit limit: {self.current_balance + amount} > {self.credit_limit}")
        self.current_balance += amount

    def withdraw(self, amount: Decimal):
        """Withdraw assets from agent."""
        if amount > self.current_balance:
            raise ValueError("Agent underflow")
        self.current_balance -= amount
        return amount

    def apply_yield(self, rate: Decimal):
        """
        Apply yield to agent assets.
        rate = 0.10 means +10%
        """
        self.current_balance *= (Decimal(1) + rate)

    def total_assets(self) -> Decimal:
        """Get total assets in agent."""
        return self.current_balance


@dataclass
class WithdrawalRequest:
    """Async withdrawal request."""
    shares: Decimal
    assets: Decimal
    timestamp: datetime
    claimed: bool = False


@dataclass
class User:
    """Represents a user in the system."""
    address: str
    shares: Decimal = Decimal('0')
    total_deposited: Decimal = Decimal('0')
    total_withdrawn: Decimal = Decimal('0')
    withdrawal_queue: List[WithdrawalRequest] = None
    pending_assets: Decimal = Decimal('0')
    
    def __post_init__(self):
        if self.withdrawal_queue is None:
            self.withdrawal_queue = []
    
    def claimable_assets(self, share_price: Decimal) -> Decimal:
        """Calculate claimable assets based on current share price."""
        if self.shares == 0 or share_price == 0:
            return Decimal('0')
        share_price_ratio = share_price / PRECISION
        return self.shares * share_price_ratio


@dataclass
class Transaction:
    """Records a transaction in the simulation."""
    timestamp: datetime
    user: str
    tx_type: str  # 'deposit' or 'withdraw'
    amount: Decimal
    shares: Decimal
    share_price: Decimal
    total_assets: Decimal
    total_shares: Decimal


class VaultSimulator:
    """
    Simulates the BondCreditVault system with external agents and async withdrawals.
    
    Implements ERC-4626 semantics with async withdrawals:
    - sharePrice = totalAssets * PRECISION / totalShares
    - On deposit: sharesMinted = depositAmount * PRECISION / sharePrice
    - On requestWithdraw: shares burned immediately, assets queued for later
    - Yield increases agent balances
    """
    
    def __init__(self):
        # Initialize 3 agents with credit limits
        self.agents: List[Agent] = [
            Agent("Agent1", "0x111...", Decimal("100000")),  # 100k USDC limit
            Agent("Agent2", "0x222...", Decimal("100000")),
            Agent("Agent3", "0x333...", Decimal("100000"))
        ]
        self.total_shares = Decimal(0)
        self.idle_assets = Decimal(0)  # USDC in vault
        
        # Async withdrawal state
        self.users: Dict[str, User] = {}
        self.total_pending = Decimal(0)
        
        # UI compatibility
        self.transactions: List[Transaction] = []
        self.yield_history: List[Dict] = []
        self.last_sync = datetime.now()

    # -------------------------
    # Derived accounting
    # -------------------------

    def total_assets(self) -> Decimal:
        """Total assets = idle + deployed to agents."""
        deployed = sum(agent.current_balance for agent in self.agents)
        return self.idle_assets + deployed

    def share_price(self) -> Decimal:
        """Calculate share price: sharePrice = totalAssets * PRECISION / totalShares"""
        if self.total_shares == 0:
            return ONE
        return (self.total_assets() * ONE) / self.total_shares

    def get_total_deployed(self) -> Decimal:
        """Get total assets deployed to agents."""
        return sum(agent.current_balance for agent in self.agents)

    # -------------------------
    # Core mechanics
    # -------------------------

    def deposit(self, user: str, amount: Decimal):
        """Deposit assets and mint shares."""
        if amount <= 0:
            raise ValueError("Amount must be > 0")
        
        price = self.share_price()
        shares = (amount * ONE) / price

        self.total_shares += shares
        self.idle_assets += amount  # Assets enter vault
        
        if user not in self.users:
            self.users[user] = User(user)
        self.users[user].shares += shares
        self.users[user].total_deposited += amount

        # Record transaction
        self.transactions.append(Transaction(
            timestamp=datetime.now(),
            user=user,
            tx_type='deposit',
            amount=amount,
            shares=shares,
            share_price=price,
            total_assets=self.total_assets(),
            total_shares=self.total_shares
        ))
        
        return shares

    def withdraw(self, user: str, shares: Decimal):
        """Withdraw assets by burning shares."""
        if shares <= 0:
            raise ValueError("Shares must be > 0")
        
        if user not in self.users or self.users[user].shares < shares:
            raise ValueError("Insufficient shares")
        
        assets = (shares * self.share_price()) / ONE
        
        # Burn shares immediately
        self.users[user].shares -= shares
        self.total_shares -= shares
        
        # Transfer assets from idle
        if self.idle_assets < assets:
            raise ValueError("Insufficient idle assets")
        
        self.idle_assets -= assets
        self.users[user].total_withdrawn += assets

        # Record transaction
        self.transactions.append(Transaction(
            timestamp=datetime.now(),
            user=user,
            tx_type='withdraw',
            amount=assets,
            shares=shares,
            share_price=self.share_price(),
            total_assets=self.total_assets(),
            total_shares=self.total_shares
        ))
        
        return assets

    def complete_withdrawal(self, user: str, request_id: int):
        """Complete a withdrawal request."""
        if user not in self.users or request_id >= len(self.users[user].withdrawal_queue):
            raise ValueError("Invalid request")
        
        request = self.users[user].withdrawal_queue[request_id]
        if request.claimed:
            raise ValueError("Already claimed")
        
        # Transfer assets from idle
        if self.idle_assets < request.assets:
            raise ValueError("Insufficient idle assets")
        
        self.idle_assets -= request.assets
        request.claimed = True
        self.users[user].pending_assets -= request.assets
        self.total_pending -= request.assets
        self.users[user].total_withdrawn += request.assets

    def sync_balances(self, balances: List[Decimal]):
        """Sync agent balances from keeper."""
        for i, balance in enumerate(balances):
            if balance > self.agents[i].credit_limit:
                raise ValueError(f"Exceeds credit limit for agent {i}")
            self.agents[i].current_balance = balance
        self.last_sync = datetime.now()

    def rebalance(self):
        """Rebalance assets across agents based on target weights."""
        total_deployed = self.get_total_deployed()
        if total_deployed == 0:
            return
        
        target_weights = [Decimal("0.4"), Decimal("0.3"), Decimal("0.3")]  # 40/30/30
        
        for i, agent in enumerate(self.agents):
            target = total_deployed * target_weights[i]
            diff = target - agent.current_balance
            if abs(diff) > total_deployed * Decimal("0.05"):  # 5% threshold
                if diff > 0:
                    # Need to add to agent
                    if self.idle_assets >= diff:
                        self.idle_assets -= diff
                        agent.current_balance += diff
                else:
                    # Need to remove from agent
                    agent.current_balance += diff  # diff is negative
                    self.idle_assets -= diff

    def apply_yield(self, rate: Decimal):
        """Apply yield to all agents."""
        for agent in self.agents:
            agent.apply_yield(rate)
        
        # Record yield history
        self.yield_history.append({
            'timestamp': datetime.now(),
            'total_assets': self.total_assets(),
            'share_price': self.share_price()
        })

    # -------------------------
    # UI helpers
    # -------------------------

    def get_user_info(self, user: str) -> User:
        """Get user info."""
        return self.users.get(user, User(user))

    def get_recent_transactions(self, limit: int = 10) -> List[Transaction]:
        """Get recent transactions."""
        return self.transactions[-limit:]

    def get_metrics(self) -> Dict:
        """Get vault metrics."""
        try:
            current_share_price = self.share_price()
            if current_share_price > 0:
                share_price_formatted = float(current_share_price / PRECISION)
            else:
                share_price_formatted = 0.0
        except Exception:
            share_price_formatted = 1.0
        
        total_assets_val = self.total_assets()
        
        return {
            'total_assets': str(total_assets_val),
            'total_shares': str(self.total_shares),
            'share_price': str(current_share_price),
            'share_price_formatted': share_price_formatted,
            'num_users': len(self.users),
            'num_transactions': len(self.transactions)
        }

    def sync(self):
        """Sync method for compatibility."""
        pass
