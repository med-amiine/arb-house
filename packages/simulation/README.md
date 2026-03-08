# Vault Simulation Environment

This simulation environment models the share-based vault system without requiring blockchain deployment. It's perfect for testing, understanding the system behavior, and demonstrating fairness guarantees.

## Features

- ✅ Simulates deposits and withdrawals at any time
- ✅ Automatic share price calculations
- ✅ 3 agents receiving equal capital allocation
- ✅ 7% yield generated every 5 minutes
- ✅ Real-time state tracking
- ✅ Transaction history
- ✅ User balance tracking

## Quick Start

### Web UI (Recommended)

Launch the beautiful web interface:

```bash
cd simulation/ui
pip install -r requirements.txt
python app.py
```

Then open `http://localhost:5000` in your browser.

Features:
- Real-time vault metrics
- Interactive share price chart
- Deposit/withdraw interface
- User and agent monitoring
- Transaction history

### Example Simulation

Run a predefined simulation with example user actions:

```bash
cd simulation
python3 simulate.py
```

This will run a 60-minute simulation with:
- User A deposits 100 tokens at start
- User B deposits 150 tokens at 10 minutes
- User A withdraws 50 tokens worth at 20 minutes
- User C deposits 200 tokens at 30 minutes
- All users withdraw at different times
- 7% yield applied every 5 minutes

### Interactive Simulation (CLI)

Run an interactive simulation where you can deposit/withdraw in real-time:

```bash
cd simulation
python3 interactive_sim.py
```

Commands:
- `deposit <user> <amount>` - Deposit tokens
- `withdraw <user> <shares>` - Withdraw specific shares
- `withdraw-all <user>` - Withdraw all shares for a user
- `status` - Show current vault state
- `user <address>` - Show user information
- `sync` - Manually sync vault state
- `quit` - Exit simulation

## Custom Simulation

Create your own simulation script:

```python
from decimal import Decimal
from vault_simulator import VaultSimulator

# Create vault with 3 agents
vault = VaultSimulator(num_agents=3)

# User A deposits 100 tokens
shares_a = vault.deposit('0xUserA', Decimal('100'))
print(f"User A received {shares_a} shares")

# Apply 7% yield
vault.apply_yield(Decimal('0.07'))

# User B deposits 150 tokens
shares_b = vault.deposit('0xUserB', Decimal('150'))
print(f"User B received {shares_b} shares")

# Check metrics
metrics = vault.get_metrics()
print(f"Share Price: {metrics['share_price_formatted']}")

# User A withdraws
assets = vault.withdraw('0xUserA', shares_a)
print(f"User A received {assets} tokens")

# Get user info
user_info = vault.get_user_info('0xUserB')
print(f"User B claimable: {user_info['claimable_assets']}")
```

## Simulation Features

### Financial Invariants

The simulation implements the same invariants as the smart contract:

1. **Share Price**: `sharePrice = totalAssets / totalShares`
2. **Deposit**: `sharesMinted = depositAmount / sharePrice`
3. **Withdraw**: `assetsOut = sharesBurned * sharePrice`
4. **Yield**: Increases `totalAssets` (not shares)
5. **Losses**: Decrease `totalAssets` proportionally

### Agent Allocation

- Capital is allocated equally to all 3 agents
- Each agent receives `amount / num_agents`
- Yield is applied to each agent independently
- Withdrawals are taken proportionally from all agents

### Yield Generation

- 7% yield is applied every 5 minutes (configurable)
- Yield increases agent assets: `assets *= 1.07`
- Total assets increase, share price increases
- Shares remain constant (yield never mints shares)

## Example Output

```
================================================================================
VAULT STATE - 2024-01-15 10:30:00
================================================================================
Total Assets: 150.000000000000000000
Total Shares: 100.000000000000000000
Share Price: 1.500000

Agent Assets:
  Agent1: 50.000000000000000000
  Agent2: 50.000000000000000000
  Agent3: 50.000000000000000000

Users: 1
Transactions: 1
================================================================================
```

## Use Cases

1. **Testing**: Verify share calculations and fairness
2. **Education**: Understand how share-based vaults work
3. **Demonstration**: Show fairness guarantees to stakeholders
4. **Prototyping**: Test different yield scenarios
5. **Analysis**: Study behavior under various conditions

## Differences from Smart Contract

The simulation is simplified for clarity:

- No gas costs
- No blockchain delays
- Instant transactions
- All assets immediately in agents (no vault balance)
- Simplified rounding (still rounds down like Solidity)

The core financial logic is identical to the smart contract implementation.

