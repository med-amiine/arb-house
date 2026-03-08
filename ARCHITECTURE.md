# Bond Credit Vault - Complete Architecture & Workflow

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE LAYER                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Frontend (Next.js)                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │  Deposit │ │ Withdraw │ │ Dashboard│ │ Analytics│ │Transactions│  │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │   │
│  │       └─────────────┴─────────────┴─────────────┴─────────────┘      │   │
│  │                           │                                          │   │
│  │              RainbowKit + Wagmi (Wallet Connection)                  │   │
│  └───────────────────────────┼──────────────────────────────────────────┘   │
└───────────────────────────────┼─────────────────────────────────────────────┘
                                │
                                ▼ Web3 RPC Calls
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BLOCKCHAIN LAYER                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Arbitrum Sepolia Testnet                          │    │
│  │                                                                      │    │
│  │   ┌─────────────────┐         ┌─────────────────────────────────┐   │    │
│  │   │   MockUSDC      │◄────────│        BondCreditVault          │   │    │
│  │   │   (ERC20)       │         │        (ERC-4626)               │   │    │
│  │   └─────────────────┘         │                                 │   │    │
│  │                               │  ┌─────────────────────────┐    │   │    │
│  │                               │  │    Async Withdrawal     │    │   │    │
│  │                               │  │    Queue Management     │    │   │    │
│  │                               │  └─────────────────────────┘    │   │    │
│  │                               │                                 │   │    │
│  │   ┌─────────────┐             │  ┌─────────────────────────┐    │   │    │
│  │   │  Agent 0    │◄────────────│  │    Balance Sync         │    │   │    │
│  │   │ (Aave)      │             │  │    (Keeper Only)        │    │   │    │
│  │   └─────────────┘             │  └─────────────────────────┘    │   │    │
│  │                               │                                 │   │    │
│  │   ┌─────────────┐             │  ┌─────────────────────────┐    │   │    │
│  │   │  Agent 1    │◄────────────│  │    Agent Management     │    │   │    │
│  │   │ (Pendle)    │             │  │    (3 strategies)       │    │   │    │
│  │   └─────────────┘             │  └─────────────────────────┘    │   │    │
│  │                               │                                 │   │    │
│  │   ┌─────────────┐             │  ┌─────────────────────────┐    │   │    │
│  │   │  Agent 2    │◄────────────│  │    Rebalancing          │    │   │    │
│  │   │ (Morpho)    │             │  │    (Target Weights)     │    │   │    │
│  │   └─────────────┘             │  └─────────────────────────┘    │   │    │
│  │                               └─────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                ▲
                                │ Event Logs / Transactions
                                │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              KEEPER LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    BCV Keeper Service (FastAPI)                      │    │
│  │                                                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │    │
│  │  │  Event Listener │  │ Balance Sync    │  │  Withdrawal     │     │    │
│  │  │                 │  │                 │  │  Processor      │     │    │
│  │  │ • Polls chain   │  │ • Updates agent │  │                 │     │    │
│  │  │ • Indexes events│  │   balances      │  │ • Monitors queue│     │    │
│  │  │ • Updates DB    │  │ • Calls         │  │ • Completes     │     │    │
│  │  │   every 10s     │  │   syncBalances()│  │   withdrawals   │     │    │
│  │  │                 │  │ • Every 5 min   │  │ • FIFO order    │     │    │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │    │
│  │           └─────────────────────┴─────────────────────┘              │    │
│  │                              │                                       │    │
│  │                              ▼                                       │    │
│  │                    ┌─────────────────┐                               │    │
│  │                    │   Database      │                               │    │
│  │                    │  (SQLite/Postgres)│                              │    │
│  │                    │                 │                               │    │
│  │                    │ • events        │                               │    │
│  │                    │ • user_positions│                               │    │
│  │                    │ • vault_state   │                               │    │
│  │                    │ • pending_withdrawals                         │    │
│  │                    └─────────────────┘                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Component Details

### 1. Smart Contracts (Solidity)

#### BondCreditVault (ERC-4626)
```solidity
// Core functionality
- deposit(uint256 assets, address receiver) → shares
- mint(uint256 shares, address receiver) → assets
- requestWithdraw(uint256 shares) → requestId    // Async withdrawal
- syncBalances(uint256[3] balances)              // Keeper only
- completeWithdrawal(address user, uint256 requestId) // Keeper only

// View functions
- totalAssets() → uint256
- totalIdle() → uint256
- getAgentInfo() → Agent[3]
- getUserWithdrawals(address user) → WithdrawalRequest[]

// State
- Agent[3] agents              // 3 AI agent adapters
- mapping withdrawalQueues     // User → WithdrawalRequest[]
- uint256 totalPending         // Total USDC owed
- uint256 lastSync             // Last balance sync timestamp
```

#### Key Features
| Feature | Description |
|---------|-------------|
| **ERC-4626 Standard** | Tokenized vault with shares representing ownership |
| **Async Withdrawal** | Shares burned immediately, USDC delivered later by keeper |
| **Balance Sync** | Keeper periodically updates agent balances on-chain |
| **Stale Protection** | Deposits blocked if sync is > 12 hours old |
| **Credit Limits** | Each agent has max allocation limit |
| **Rebalancing** | Target weights enforce allocation strategy |

---

### 2. Frontend (Next.js + Wagmi)

#### User Flows

```
DEPOSIT FLOW:
┌────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐
│  User  │───▶│ Approve  │───▶│ Deposit  │───▶│ Receive  │───▶│ Shares │
│        │    │   USDC   │    │  USDC    │    │  BCV     │    │        │
└────────┘    └──────────┘    └──────────┘    └──────────┘    └────────┘
                  │                 │
                  ▼                 ▼
            ┌──────────┐      ┌──────────┐
            │ USDC.approve│    │ vault.deposit()│
            │ (if needed)│      │            │
            └──────────┘      └──────────┘

WITHDRAWAL FLOW:
┌────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐
│  User  │───▶│ Request  │───▶│  Burn    │───▶│  Keeper  │───▶│ Receive│
│        │    │ Withdraw │    │  Shares  │    │ Processes│    │  USDC  │
└────────┘    └──────────┘    └──────────┘    └──────────┘    └────────┘
                                                  │
                                                  ▼
                                            ┌──────────┐
                                            │complete  │
                                            │Withdrawal│
                                            └──────────┘
```

#### Pages
| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Vault overview, stats, quick actions |
| Deposit | `/deposit` | Deposit USDC for BCV shares |
| Withdraw | `/withdraw` | Request async withdrawal |
| Dashboard | `/dashboard` | User position, history |
| Transactions | `/transactions` | All vault transactions |
| Analytics | `/vault-analytics` | TVL, yield, agent performance |

---

### 3. Keeper Service (Python/FastAPI)

#### Background Services

```
┌────────────────────────────────────────────────────────────────────────┐
│                         Event Listener                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │ Poll     │───▶│ Get Logs │───▶│ Parse    │───▶│ Index to │         │
│  │ Every 10s│    │ from RPC │    │ Events   │    │ Database │         │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘         │
│                                                          │              │
│  Events Indexed:                                         ▼              │
│  • DepositMade                              ┌─────────────────┐         │
│  • WithdrawalQueued                         │ Update User     │         │
│  • WithdrawalCompleted                      │ Positions       │         │
│  • BalancesSynced                           └─────────────────┘         │
│  • Rebalanced                                                          │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                        Balance Sync Service                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │ Every 5  │───▶│ Fetch    │───▶│ Call     │───▶│ Update   │         │
│  │ Minutes  │    │ Agent    │    │ syncBalances()│  Vault State│         │
│  └──────────┘    │ Balances │    │ (on-chain)│    └──────────┘         │
│                  └──────────┘    └──────────┘                          │
│                                                                      │
│  Purpose: Keep vault.sharePrice accurate by syncing agent balances   │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                      Withdrawal Processor                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │ Monitor  │───▶│ Check    │───▶│ Process  │───▶│ Complete │         │
│  │ Queue    │    │ Idle     │    │ FIFO     │    │ Withdrawal│        │
│  └──────────┘    │ Balance  │    │          │    │ (on-chain)│        │
│                  └──────────┘    └──────────┘    └──────────┘         │
│                                                                      │
│  If insufficient idle funds:                                         │
│  1. Trigger recall from agents (via Giza SDK)                        │
│  2. Wait for funds to return                                         │
│  3. Process withdrawal                                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔁 Detailed Workflows

### Deposit Workflow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Step 1 │────▶│  Step 2 │────▶│  Step 3 │────▶│  Step 4 │────▶│  Step 5 │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │
     ▼               ▼               ▼               ▼               ▼
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Connect │     │ Check   │     │ Approve │     │ Deposit │     │ Receive │
│ Wallet  │     │ Sync    │     │  USDC   │     │  USDC   │     │  BCV    │
│         │     │ Status  │     │         │     │         │     │ Shares  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │               │
     │               │               │               │               │
     │               ▼               │               │               │
     │          ┌─────────┐          │               │               │
     │          │ Is sync │          │               │               │
     │          │ < 12hrs?│          │               │               │
     │          └────┬────┘          │               │               │
     │               │               │               │               │
     │          No ┌─┴─┐ Yes         │               │               │
     │             ▼   ▼             │               │               │
     │    ┌────────┐   ┌────────┐    │               │               │
     │    │ Block  │   │Allow   │◄───┘               │               │
     │    │Deposit │   │Deposit │◄───────────────────┘               │
     │    └────────┘   └────────┘                                    │
     │                              ┌────────────────────────────────┘
     │                              ▼
     │                         ┌─────────┐
     │                         │ Event   │
     │                         │ Indexed │
     │                         │ by      │
     │                         │ Keeper  │
     │                         └─────────┘
```

**Code Flow:**
```typescript
// 1. User enters amount
const [amount, setAmount] = useState('')

// 2. Check sync status (must be < 12 hours)
const { data: lastSync } = useReadContract({
  functionName: 'lastSync'
})
const isSyncStale = (Date.now() / 1000 - Number(lastSync)) > 43200

// 3. Approve USDC (if needed)
const { writeContract: approve } = useWriteContract()
approve({
  address: USDC_ADDRESS,
  functionName: 'approve',
  args: [VAULT_ADDRESS, amount]
})

// 4. Deposit to vault
const { writeContract: deposit } = useWriteContract()
deposit({
  address: VAULT_ADDRESS,
  functionName: 'deposit',
  args: [amount, userAddress]
})

// 5. Receive shares (calculated by ERC-4626)
// shares = (assets * totalSupply) / totalAssets
```

---

### Withdrawal Workflow (Async)

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Step 1 │────▶│  Step 2 │────▶│  Step 3 │────▶│  Step 4 │────▶│  Step 5 │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │
     ▼               ▼               ▼               ▼               ▼
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Request │     │  Burn   │     │ Queue   │     │ Keeper  │     │ Receive │
│Withdraw │────▶│ Shares  │────▶│ Request │────▶│Processes│────▶│  USDC   │
│         │     │         │     │         │     │         │     │         │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │               │
     │               │               │               │               │
     │               │               │               ▼               │
     │               │               │          ┌─────────┐          │
     │               │               │          │ Check   │          │
     │               │               │          │ Idle    │          │
     │               │               │          │ Balance │          │
     │               │               │          └────┬────┘          │
     │               │               │               │               │
     │               │               │          Yes┌─┴─┐No           │
     │               │               │             ▼   ▼             │
     │               │               │    ┌────────┐  ┌────────┐    │
     │               │               │    │Complete│  │ Recall │    │
     │               │               │    │Withdraw│  │ from   │    │
     │               │               │    │        │  │ Agents │    │
     │               │               │    └────────┘  └────────┘    │
     │               │               │                              │
     │               │               └──────────────────────────────┤
     │               │                                              │
     │               └──────────────────────────────────────────────┤
     │                                                              │
     └──────────────────────────────────────────────────────────────┘
                              Event Emitted
```

**Code Flow:**
```typescript
// 1. User requests withdrawal
const { writeContract: requestWithdraw } = useWriteContract()
requestWithdraw({
  address: VAULT_ADDRESS,
  functionName: 'requestWithdraw',
  args: [sharesAmount]
})

// 2. Contract burns shares and creates request
function requestWithdraw(uint256 shares) {
    uint256 assets = convertToAssets(shares);
    _burn(msg.sender, shares);  // Shares burned immediately
    
    // Queue the withdrawal
    withdrawalQueues[msg.sender].push(WithdrawalRequest({
        shares: shares,
        assets: assets,
        timestamp: block.timestamp,
        claimed: false
    }));
    
    emit WithdrawalQueued(msg.sender, requestId, shares, assets);
}

// 3. Keeper processes the queue
class WithdrawalProcessor {
    async _process_queue() {
        const idleBalance = await vault.totalIdle()
        
        for (const withdrawal of queue) {
            if (idleBalance >= withdrawal.assets) {
                await this._complete_withdrawal(withdrawal)
                idleBalance -= withdrawal.assets
            } else {
                await this._recall_from_agents(withdrawal.assets)
            }
        }
    }
    
    async _complete_withdrawal(withdrawal) {
        const tx = await vault.completeWithdrawal(
            withdrawal.user,
            withdrawal.request_id
        )
        await tx.wait()
    }
}

// 4. User receives USDC
function completeWithdrawal(address user, uint256 requestId) onlyKeeper {
    WithdrawalRequest storage request = withdrawalQueues[user][requestId];
    require(!request.claimed, "Already claimed");
    
    request.claimed = true;
    IERC20(asset()).safeTransfer(user, request.assets);
    
    emit WithdrawalCompleted(user, requestId, request.assets);
}
```

---

### Balance Sync Workflow

```
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│ Keeper Service│         │   Giza SDK    │         │   Blockchain  │
└───────┬───────┘         └───────┬───────┘         └───────┬───────┘
        │                         │                         │
        │  1. Every 5 minutes     │                         │
        │────────────────────────▶│                         │
        │                         │                         │
        │  2. Fetch agent balances│                         │
        │  (from Giza AI agents)  │                         │
        │────────────────────────▶│                         │
        │                         │                         │
        │  3. Calculate target    │                         │
        │     allocations         │                         │
        │◀────────────────────────│                         │
        │                         │                         │
        │  4. Call syncBalances() │                         │
        │───────────────────────────────────────────────────▶│
        │                         │                         │
        │                         │                         │  5. Update
        │                         │                         │    agent
        │                         │                         │    balances
        │  6. Emit BalancesSynced │                         │
        │◀───────────────────────────────────────────────────│
        │                         │                         │
        │  7. Index event         │                         │
        │  (update share price)   │                         │
        │                         │                         │
```

---

## 🗄️ Database Schema

```sql
-- Events table (indexed from blockchain)
CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    block_number INTEGER NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,  -- DepositMade, WithdrawalQueued, etc.
    contract_address VARCHAR(42) NOT NULL,
    user_address VARCHAR(42),
    args JSON,  -- Event arguments
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(transaction_hash, log_index)
);

-- User positions (aggregated from events)
CREATE TABLE user_positions (
    id INTEGER PRIMARY KEY,
    user_address VARCHAR(42) UNIQUE NOT NULL,
    total_deposited DECIMAL(36, 18) DEFAULT 0,
    total_withdrawn DECIMAL(36, 18) DEFAULT 0,
    current_shares DECIMAL(36, 18) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pending withdrawals (queue)
CREATE TABLE pending_withdrawals (
    id INTEGER PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    request_id INTEGER NOT NULL,
    shares DECIMAL(36, 18) NOT NULL,
    assets DECIMAL(36, 18) NOT NULL,
    block_number INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, completed, failed
    completed_tx_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Vault state (cached metrics)
CREATE TABLE vault_state (
    id INTEGER PRIMARY KEY,
    total_assets DECIMAL(36, 18) DEFAULT 0,
    total_shares DECIMAL(36, 18) DEFAULT 0,
    agent_0_balance DECIMAL(36, 18) DEFAULT 0,
    agent_1_balance DECIMAL(36, 18) DEFAULT 0,
    agent_2_balance DECIMAL(36, 18) DEFAULT 0,
    last_sync_block INTEGER,
    last_sync_timestamp TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔐 Security Model

### Access Control
```
┌─────────────────────────────────────────────────────────────────┐
│                      Access Control Matrix                       │
├─────────────────┬─────────────┬─────────────┬───────────────────┤
│    Function     │    Owner    │   Keeper    │     Anyone        │
├─────────────────┼─────────────┼─────────────┼───────────────────┤
│ deposit()       │             │             │       ✓           │
│ requestWithdraw │             │             │       ✓           │
│ syncBalances()  │             │     ✓       │                   │
│ completeWithdraw│             │     ✓       │                   │
│ setWeights()    │     ✓       │             │                   │
│ pause()         │     ✓       │             │                   │
│ emergencyPause()│     ✓       │     ✓       │                   │
└─────────────────┴─────────────┴─────────────┴───────────────────┘
```

### Key Security Features
1. **ReentrancyGuard** - Protects against reentrancy attacks
2. **Pausable** - Emergency pause mechanism
3. **Stale Sync Protection** - Blocks operations if data is stale
4. **Credit Limits** - Caps agent exposure
5. **Async Withdrawal** - Prevents flash loan attacks

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service info |
| GET | `/status` | Service health |
| GET | `/vault/state` | Current vault metrics |
| GET | `/vault/agents` | Agent allocations |
| GET | `/vault/transactions` | All transactions |
| GET | `/vault/user/{address}/balance` | User position |
| GET | `/vault/user/{address}/transactions` | User history |
| POST | `/vault/sync` | Trigger manual sync |

---

## 🚀 Deployment Architecture

```
Production Deployment:
┌─────────────────────────────────────────────────────────────────────────┐
│                              Vercel                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Frontend (Next.js)                            │   │
│  │              https://vclean-amber.vercel.app                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            Railway.app                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Keeper Service (FastAPI)                      │   │
│  │       https://bcv-keeper-production.up.railway.app              │   │
│  │                                                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │
│  │  │Event Listener│  │Balance Sync │  │  Withdrawal Processor   │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │   │
│  │                                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │              PostgreSQL Database                         │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Arbitrum Sepolia Testnet                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Vault: 0xEAEa45b8078f9fcA46DFb42b16016c8C234F7ff3              │   │
│  │  USDC:  0xA92a00D083D9De8cD18B08fC2DDE27298633e422              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Summary

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Blockchain│    │   Keeper    │    │   Database  │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       │  1. deposit()    │                  │                  │
       │─────────────────▶│                  │                  │
       │                  │                  │                  │
       │                  │  2. emit         │                  │
       │                  │     DepositMade  │                  │
       │                  │─────────────────▶│                  │
       │                  │                  │                  │
       │                  │                  │  3. index event  │
       │                  │                  │─────────────────▶│
       │                  │                  │                  │
       │  4. refresh data │                  │                  │
       │◀─────────────────│                  │◀─────────────────│
       │                  │                  │                  │
```

---

## 🔧 Configuration Files

### Contract Addresses (Current Deployment)
```json
{
  "network": "arbitrum-sepolia",
  "chainId": 421614,
  "vault": "0xEAEa45b8078f9fcA46DFb42b16016c8C234F7ff3",
  "usdc": "0xA92a00D083D9De8cD18B08fC2DDE27298633e422",
  "agents": [
    "0xA004df2beeF4EF4a58333B814A16c677c1DF4E64",
    "0xfE435387201D3327983d19293B60C1C014E61650",
    "0xD86bc69b52508368622E4F9f8f70a603FFbFC89C"
  ],
  "keeper": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

### Environment Variables
```bash
# Frontend
NEXT_PUBLIC_VAULT_ADDRESS=0xEAEa45b8078f9fcA46DFb42b16016c8C234F7ff3
NEXT_PUBLIC_USDC_ADDRESS=0xA92a00D083D9De8cD18B08fC2DDE27298633e422
NEXT_PUBLIC_CHAIN_ID=421614

# Keeper
KEEPER_PRIVATE_KEY=your_private_key
KEEPER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
ARB_RPC_URL=https://arbitrum-sepolia.drpc.org
```

---

This architecture provides a secure, scalable, and transparent way for users to deposit USDC and earn yield from AI-powered DeFi strategies while maintaining full custody through the async withdrawal pattern.
