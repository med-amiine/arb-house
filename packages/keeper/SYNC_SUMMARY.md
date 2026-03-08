# Backend-UI Synchronization Summary

## ✅ Completed Changes

### 1. Configuration (`app/config.py`)
- ✅ Changed `mock_apy` from 8.42% → 11.8% (matches UI realized yield)
- ✅ Added `mock_risk_score` = 95
- ✅ Added agent names: "Aave Lending Agent", "Pendle Carry Agent", "Basis Trading Agent"
- ✅ Added agent strategies: "Conservative Lending", "PT Yield Holding", "Optimized Lending"
- ✅ Added agent protocols: "Aave V3", "Pendle", "Morpho"
- ✅ Added agent risks: "Low", "Medium", "Medium"
- ✅ Added agent target APYs: [6.2, 9.8, 7.5]

### 2. Vault API (`app/api/vault.py`)
- ✅ Updated `VaultStateResponse` with new fields:
  - `realized_yield` (11.8%)
  - `risk_score` (95)
  - `utilization` (calculated)
  - `active_agents` (count)
- ✅ Updated `AgentInfo` with:
  - `strategy` field
  - `risk` field
- ✅ Added new models:
  - `RadarMetric` for individual metrics
  - `RiskAnalysisResponse` for radar chart data
- ✅ Updated `/vault/state` endpoint to calculate utilization and active agents
- ✅ Updated `/vault/agents` to use config values for names/strategies/risks
- ✅ Added new `/vault/risk-metrics` endpoint returning 5 radar metrics

### 3. Health API (`app/api/health.py`)
- ✅ Updated `/health/agents` to include:
  - Full agent names from config
  - Strategy descriptions
  - Protocol names
  - Risk levels

### 4. Giza Client (`app/services/giza_client.py`)
- ✅ Updated `AgentStatus` dataclass with UI fields
- ✅ Updated `get_agent_balance()` to use `mock_tvl` and target allocations
- ✅ Updated `get_agent_status()` to include config values

### 5. Documentation
- ✅ Created `BACKEND_UI_SYNC.md` with complete sync documentation

## ⚠️ Flagged Inconsistencies (Require Attention)

### Issue 1: Random APY in UI vs Fixed in Backend
**Location**: `packages/frontend/components/vault/AgentList.tsx:20`
```typescript
apy: 7.5 + Math.random() * 5, // Mock APY for now
```
**Backend**: Uses fixed APYs from config: `[6.2, 9.8, 7.5]`

**Impact**: Each page refresh shows different APYs in UI
**Recommendation**: Remove random generation, use backend-provided APYs

---

### Issue 2: Target Weight Mismatch
**Location**: `packages/frontend/hooks/useVault.ts:117`
```typescript
targetWeight: 33.33,  // Equal split
```
**Backend**: Uses 40/35/25 split

**Impact**: UI shows equal targets, backend uses weighted targets
**Recommendation**: Update frontend to use 40/35/25 targets

---

### Issue 3: Agent Names Mismatch
**Location**: `packages/frontend/hooks/useVault.ts:114`
```typescript
name: `Agent ${['Alpha', 'Beta', 'Gamma'][i]}`,
```
**UI Display**: `packages/frontend/components/vault/AgentList.tsx`
```typescript
const agentInfo = [
  { name: 'Aave Lending Agent', ... },
  { name: 'Pendle Carry Agent', ... },
  { name: 'Basis Trading Agent', ... },
]
```

**Impact**: Hook returns "Agent Alpha", UI displays "Aave Lending Agent"
**Recommendation**: Use consistent names everywhere

---

### Issue 4: Frontend Doesn't Use Backend API
**Observation**: The frontend reads directly from the blockchain via wagmi, not from the keeper API.

**Files using direct contract reads**:
- `useVault.ts` - Uses `useReadContract` from wagmi
- `VaultState.tsx` - Uses `useReadContract` 
- `SyncHealth.tsx` - Uses `useReadContract`
- `VaultRadar.tsx` - Uses `useReadContract`

**Impact**: Backend API improvements don't reflect in UI
**Recommendation**: 
- Option A: Frontend should use backend API for enriched data
- Option B: Backend should be source of truth for calculations

---

### Issue 5: Risk Score Always Fixed
**Current**: Risk score is hardcoded to 95 in both UI and backend
**Future**: Should calculate dynamically based on:
- Agent diversification
- Protocol risk ratings  
- Liquidity ratios
- Historical volatility

---

### Issue 6: Mock vs Real Mode Gaps
**Mock Mode**: Returns consistent data matching UI
**Production Mode**: Returns actual blockchain data but may not have all enriched fields

**Recommendation**: Ensure production mode also calculates:
- Risk scores
- Agent strategies/names from config
- APYs from actual yield tracking

---

## 🔧 Recommended Next Steps

### High Priority
1. **Fix AgentList.tsx random APY** - Use consistent values
2. **Update useVault.ts target weights** - Change from 33.33 to 40/35/25
3. **Align agent names** - Use config values in all places

### Medium Priority  
4. **Add backend API integration** - Frontend could optionally use `/vault/risk-metrics`
5. **Implement real APY calculation** - Calculate 30-day trailing average
6. **Add sync status endpoint** - Backend should expose keeper health

### Low Priority
7. **Dynamic risk scoring** - Build actual risk calculation engine
8. **WebSocket updates** - Real-time data push instead of polling

## 📊 Current Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend API    │     │   Blockchain    │
│   (Next.js)     │     │   (FastAPI)      │     │   (Arbitrum)    │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│                 │     │                  │     │                 │
│  useVault.ts    │────▶│  /vault/state    │◀────│  totalAssets()  │
│  (wagmi hook)   │     │  (enriched)      │     │  totalIdle()    │
│                 │     │                  │     │  agents()       │
│  VaultState.tsx │────▶│  /vault/agents   │◀────│  lastSync()     │
│  (direct read)  │     │  (with strategy) │     │                 │
│                 │     │                  │     │                 │
│  AgentList.tsx  │────▶│  /vault/risk     │     │  Events         │
│  (local calc)   │     │  (5 metrics)     │◀────│  (indexed)      │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## ✅ Verification Checklist

Run these to verify sync:

```bash
# 1. Check backend starts without errors
cd packages/keeper && python3 -m app.main

# 2. Verify all endpoints work
curl http://localhost:8000/health
curl http://localhost:8000/vault/state | jq '.risk_score, .realized_yield'
curl http://localhost:8000/vault/agents | jq '.[].name, .[].strategy'
curl http://localhost:8000/vault/risk-metrics | jq '.overall_score, .metrics[].value'

# 3. Check Python syntax
python3 -m py_compile app/config.py app/api/vault.py app/api/health.py app/services/giza_client.py
```

## 📝 Files Modified

- `packages/keeper/app/config.py`
- `packages/keeper/app/api/vault.py`
- `packages/keeper/app/api/health.py`
- `packages/keeper/app/services/giza_client.py`
- `packages/keeper/BACKEND_UI_SYNC.md` (new)
- `packages/keeper/SYNC_SUMMARY.md` (new)

## 🎯 Alignment Status

| Component | Status | Notes |
|-----------|--------|-------|
| VaultState.tsx | ✅ Aligned | Risk score, realized yield match |
| VaultRadar.tsx | ✅ Aligned | 5 metrics, overall score 95 |
| AgentList.tsx | ⚠️ Partial | Uses random APY, names hardcoded |
| SyncHealth.tsx | ⚠️ N/A | Reads directly from contract |
| useVault.ts | ⚠️ Partial | Target weights differ from backend |
