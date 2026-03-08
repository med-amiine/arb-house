# Backend-UI Synchronization Documentation

## Overview
This document describes the synchronization between the Python FastAPI backend (`packages/keeper/`) and the Next.js frontend (`packages/frontend/`).

## Key Changes Made

### 1. Configuration Sync (`app/config.py`)

Updated mock values to match UI displays:

| Field | Old Value | New Value | UI Location |
|-------|-----------|-----------|-------------|
| `mock_apy` | 8.42% | **11.8%** | VaultState.tsx - "Realized Yield" |
| `mock_risk_score` | N/A | **95** | VaultState.tsx & VaultRadar.tsx |
| Agent names | Generic | **Aave Lending Agent, Pendle Carry Agent, Basis Trading Agent** | AgentList.tsx |
| Agent strategies | N/A | **Conservative Lending, PT Yield Holding, Optimized Lending** | AgentList.tsx |
| Agent protocols | Aave V3, Pendle, Morpho | Same | AgentList.tsx |
| Agent risks | N/A | **Low, Medium, Medium** | AgentList.tsx |
| Target allocations | 40/35/25 | Same | Backend calculation basis |

### 2. Vault API (`app/api/vault.py`)

#### Updated Models:

**VaultStateResponse** - Now matches UI display:
```python
- realized_yield: float  # 11.8% - 30-day trailing average
- risk_score: int        # Fixed at 95
- utilization: float     # Calculated: (totalAssets - totalIdle) / totalAssets
- active_agents: int     # Count of agents with balance > 0
```

**AgentInfo** - Now includes UI fields:
```python
- strategy: str    # e.g., "Conservative Lending"
- risk: str        # e.g., "Low", "Medium"
```

**New Model: RiskAnalysisResponse** - For VaultRadar component:
```python
- overall_score: int      # Fixed at 95
- metrics: List[RadarMetric]  # 5 metrics: Performance, Stability, Liquidity, Execution, Trust
- active_agents: int
- last_updated: str
```

#### New Endpoints:

**`GET /vault/risk-metrics`**
Returns the 5-metric radar chart data matching VaultRadar.tsx:
- Performance: 92 (fixed)
- Stability: 88-94 (varies with active agents)
- Liquidity: 90-96 (varies with active agents)
- Execution: 94 (fixed)
- Trust: 85-94 (varies with active agents)

### 3. Health API (`app/api/health.py`)

Updated `/health/agents` to include:
- Full agent names from config
- Strategy descriptions
- Protocol names
- Risk levels
- APYs from config

### 4. Giza Client (`app/services/giza_client.py`)

Updated `get_agent_balance()` to:
- Use `settings.mock_tvl` as base ($1.25M)
- Apply target allocations (40/35/25 split)
- Tighter variation (±3% vs ±5%) for stability
- Include agent names in logs

Updated `AgentStatus` dataclass to include:
- `name`, `strategy`, `protocol`, `risk_level`

## Data Flow Architecture

### Frontend (Reads Directly from Blockchain)
The UI primarily uses wagmi hooks to read from the vault contract:
- `useVaultData()` - TVL, agents, share price
- `VaultState` - Reads `totalAssets`, `totalIdle`, `lastSync`
- `VaultRadar` - Uses local calculations for metrics
- `SyncHealth` - Reads `lastSync` from contract

### Backend (Provides Enriched Data)
The keeper service provides:
- **Event indexing** - Historical deposits, withdrawals, syncs
- **Calculated metrics** - Risk scores, utilization, allocations
- **User positions** - Total deposited, withdrawn, yield earned
- **Agent enrichment** - Strategy names, risk levels, APYs

## Mock Mode vs Production

### Mock Mode (`MOCK_MODE=true`)
- Uses `mock_tvl`, `mock_apy`, `mock_risk_score` from config
- Agent balances calculated from target allocations
- No actual blockchain transactions
- Good for UI development and testing

### Production Mode (`MOCK_MODE=false`)
- Reads actual values from blockchain
- Giza client fetches real agent balances
- APY calculated from historical yield events
- Risk score could be calculated from actual metrics

## Flagged Inconsistencies

### ⚠️ Potential Issues:

1. **APY vs Realized Yield**
   - UI shows "Realized Yield 11.8%" as 30-day trailing average
   - Backend `mock_apy` set to 11.8% to match
   - In production, need to calculate actual trailing average

2. **Agent APYs in UI**
   - UI (`AgentList.tsx`) generates random APYs: `7.5 + Math.random() * 5`
   - Backend uses fixed values from config: `[6.2, 9.8, 7.5]`
   - **Recommendation**: Backend should provide consistent APYs

3. **Target Allocations**
   - Backend uses 40/35/25 split
   - UI `useVault.ts` shows `targetWeight: 33.33` for all agents
   - **Recommendation**: Update frontend to show 40/35/25 targets

4. **Risk Score Calculation**
   - Currently fixed at 95 in both UI and backend
   - In production, should calculate from:
     - Agent diversification
     - Protocol risk ratings
     - Liquidity ratios
     - Historical volatility

5. **Sync Health**
   - UI reads `lastSync` directly from contract
   - Backend doesn't expose this via API
   - Backend should add `last_sync_timestamp` to state response

## Environment Variables

Required for full sync:
```bash
# Core settings
MOCK_MODE=false  # Set to false for production
MOCK_TVL=1250000.0
MOCK_APY=11.8
MOCK_RISK_SCORE=95

# Agent configuration (optional, uses defaults)
# AGENT_NAMES=["Aave Lending Agent", "Pendle Carry Agent", "Basis Trading Agent"]

# Blockchain
VAULT_ADDRESS=0x5fced2ffc59401d5a3D2439C7b997E7bcCF85Ff8
KEEPER_ADDRESS=0xD8CDe62aCB881329EBb4694f37314b7bBA77EbDe
KEEPER_PRIVATE_KEY=<your-key>
ARB_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/<key>
```

## API Endpoints Summary

| Endpoint | Purpose | UI Component |
|----------|---------|--------------|
| `GET /` | Service info | - |
| `GET /status` | Detailed status | - |
| `GET /health` | Health check | - |
| `GET /health/agents` | Agent health | AgentList |
| `GET /vault/state` | Vault metrics | VaultState |
| `GET /vault/agents` | Agent details | AgentList |
| `GET /vault/risk-metrics` | Risk radar | VaultRadar |
| `GET /vault/transactions` | History | Transaction list |
| `GET /vault/yield-history` | Yield chart | YieldChart |
| `GET /vault/user/{addr}/balance` | User position | UserPosition |
| `POST /vault/sync` | Trigger sync | Admin only |

## Testing the Sync

```bash
# Start the backend
cd packages/keeper
source venv/bin/activate
python -m app.main

# Test the endpoints
curl http://localhost:8000/vault/state | jq
curl http://localhost:8000/vault/agents | jq
curl http://localhost:8000/vault/risk-metrics | jq
```

## Future Improvements

1. **Real-time Sync**: Use WebSocket for live updates
2. **APY Calculation**: Implement actual 30-day trailing calculation
3. **Risk Engine**: Build dynamic risk scoring based on:
   - Agent performance
   - Protocol TVL and liquidity
   - Historical drawdowns
   - Market volatility
4. **Caching**: Add Redis for frequently accessed data
5. **Metrics**: Add Prometheus metrics for monitoring
