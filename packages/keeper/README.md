# BCV Keeper Service

Production-ready keeper service for the BondCreditVault on Arbitrum Sepolia.

## Features

- **Event Indexing**: Polls blockchain and indexes all vault events to SQLite/PostgreSQL
- **Balance Sync**: Periodically calls `syncBalances()` to update agent balances
- **Withdrawal Processing**: Automatically completes async withdrawals
- **REST API**: Exposes vault state, transactions, and user data via HTTP

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Keeper API     │────▶│   Database      │
│  (Next.js)      │     │  (FastAPI)      │     │ (SQLite/Postgres│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Event Listener │
                        │ Balance Sync    │
                        │ Withdrawal Proc │
                        └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │ Arbitrum Sepolia│
                        │  Testnet        │
                        └─────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
cd packages/keeper
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your keeper private key
```

Required:
- `KEEPER_PRIVATE_KEY`: Private key of the authorized keeper address
- `KEEPER_ADDRESS`: Address that matches the keeper in the vault contract

### 3. Initialize Database

```bash
python -c "from app.database import init_db; init_db()"
```

### 4. Run the Service

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Test the API

```bash
# Check service status
curl http://localhost:8000/

# Get vault state
curl http://localhost:8000/vault/state

# Get indexed transactions
curl http://localhost:8000/vault/transactions

# Get user balance
curl http://localhost:8000/vault/user/0x.../balance
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Service info |
| `GET /status` | Detailed service status |
| `GET /vault/state` | Current vault state (TVL, share price, etc.) |
| `GET /vault/agents` | Agent allocations and balances |
| `GET /vault/transactions` | Indexed transaction history |
| `GET /vault/yield-history` | Historical yield data |
| `GET /vault/user/{address}/balance` | User position and pending withdrawals |
| `GET /vault/user/{address}/transactions` | User-specific transactions |
| `POST /vault/sync` | Trigger manual balance sync |

## Background Services

### Event Listener
- Polls blockchain every 10 seconds
- Indexes events: `DepositMade`, `WithdrawalQueued`, `WithdrawalCompleted`, `BalancesSynced`
- Updates user positions and vault state

### Balance Sync
- Runs every 5 minutes (configurable)
- Fetches agent balances from contract
- Calls `syncBalances()` on vault

### Withdrawal Processor
- Monitors pending withdrawals
- When vault has sufficient idle funds, calls `completeWithdrawal()`
- Handles recall from agents if needed

## Database Schema

### Tables
- **events**: Indexed blockchain events
- **vault_state**: Cached vault metrics
- **pending_withdrawals**: Withdrawal requests
- **user_positions**: User balances and totals

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MOCK_MODE` | `false` | Use mock data instead of blockchain |
| `ENABLE_EVENT_LISTENER` | `true` | Enable event indexing |
| `ENABLE_BALANCE_SYNC` | `true` | Enable automated balance sync |
| `ENABLE_WITHDRAWAL_PROCESSOR` | `true` | Enable withdrawal processing |
| `SYNC_INTERVAL_SECONDS` | `300` | Balance sync interval |
| `WITHDRAWAL_POLL_INTERVAL_SECONDS` | `10` | Event polling interval |

## Production Deployment

### Using Docker

```bash
docker build -t bcv-keeper .
docker run -d \
  -e KEEPER_PRIVATE_KEY=$KEEPER_PRIVATE_KEY \
  -e KEEPER_ADDRESS=$KEEPER_ADDRESS \
  -e DATABASE_URL=postgresql://... \
  -p 8000:8000 \
  bcv-keeper
```

### Using Railway

```bash
railway login
railway up
```

## Troubleshooting

### Keeper not authorized
Make sure `KEEPER_ADDRESS` matches the keeper set in the vault contract.

### Events not indexing
Check RPC URL is working:
```bash
curl $ARB_RPC_URL -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Database locked (SQLite)
SQLite doesn't support concurrent writes. Use PostgreSQL for production.

## Contract Addresses (Arbitrum Sepolia)

- **Vault**: `0x910a7b063021eC417227F3Cb7f0178f28bc0BA4E`
- **USDC**: `0xd51391fa22b32E87c1B7Ebe5a8Db412dc7c15A92`
- **Agent 0**: `0x3E17F1f04870Df48Aca3481CCD58ADb61CD59BDc`
- **Agent 1**: `0x959353a97A01A03614E7475D423DFCffC4619a06`
- **Agent 2**: `0xbA0385cbB5DBEd0C450c81167808A99633d8578D`
