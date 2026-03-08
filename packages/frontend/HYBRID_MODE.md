# Hybrid Mode Implementation

## Overview
The frontend now operates in **hybrid mode** - reading core data from the blockchain via wagmi, while enriching it with metadata from local config, and optionally fetching additional data from the backend API.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Data Flow                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│  │  Blockchain  │────▶│   useVault   │◀────│   Backend    │              │
│  │   (wagmi)    │     │    Hook      │     │    API       │              │
│  └──────────────┘     └──────────────┘     └──────────────┘              │
│         │                   │                     │                        │
│         │                   │                     │                        │
│         ▼                   ▼                     ▼                        │
│  • TVL (totalAssets)   • Agent metadata    • Historical APYs              │
│  • Agent balances      • Target weights    • Risk metrics                 │
│  • User shares         • Strategy info     • Detailed analytics           │
│  • Share price         • Risk levels                                      │
│  • lastSync                                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Agent Configuration (`lib/agents.ts`)
Centralized agent metadata synced with backend:

```typescript
export const AGENTS_CONFIG: AgentMetadata[] = [
  {
    id: 0,
    name: 'Aave Lending Agent',      // Not "Agent Alpha"
    shortName: 'Aave',
    strategy: 'Conservative Lending',
    protocol: 'Aave V3',
    risk: 'Low',
    baseApy: 6.2,                     // Fixed, not random
    targetAllocation: 40,             // 40% target (not 33.33%)
    color: '#3b82f6',
  },
  // ... Pendle (35%), Morpho (25%)
]
```

### 2. Enhanced Hook (`hooks/useVault.ts`)

**Returns enriched data:**
```typescript
interface VaultData {
  // Blockchain data (always present)
  tvl: number
  utilization: number
  sharePrice: number
  userShares: number
  
  // Enriched agent data
  agents: AgentData[]  // Includes names, strategies, APYs
  activeAgentCount: number
  
  // Source tracking
  dataSource: 'blockchain' | 'hybrid' | 'backend'
}
```

**Hybrid fetching:**
```typescript
// Always fetches from blockchain
const { data: totalAssets } = useReadContract({...})
const { data: agentInfo } = useReadContract({...})

// Optionally enriches from backend
useEffect(() => {
  if (API_CONFIG.enableBackend) {
    fetch(`${API_CONFIG.baseUrl}/vault/agents`)
    // Merges backend data with blockchain data
  }
}, [])
```

### 3. Updated Components

#### AgentList.tsx
- **Before**: Random APYs (`7.5 + Math.random() * 5`)
- **After**: Consistent APYs from config (`agent.apy`)
- **Before**: Equal target weights (33.33%)
- **After**: Proper targets (40/35/25)
- **Added**: Target vs current allocation bars

#### VaultState.tsx
- **Before**: Read agentInfo separately from contract
- **After**: Uses enriched data from `useVaultData()`
- **Added**: `activeAgentCount` from hook

#### VaultRadar.tsx
- **Before**: Local calculation only
- **After**: Attempts backend fetch first, falls back to local
- **Added**: "Live" indicator when backend data available

## Configuration

### Environment Variables
```bash
# Enable backend API fetching (optional)
NEXT_PUBLIC_USE_BACKEND_API=true
NEXT_PUBLIC_KEEPER_API_URL=http://localhost:8000
```

### Without Backend (Blockchain Only)
```bash
# .env.local
NEXT_PUBLIC_USE_BACKEND_API=false
```
- Agent metadata from local config
- APYs from config base values
- Risk metrics calculated locally

### With Backend (Hybrid Mode)
```bash
# .env.local
NEXT_PUBLIC_USE_BACKEND_API=true
NEXT_PUBLIC_KEEPER_API_URL=http://localhost:8000
```
- Blockchain data for real-time values
- Backend for historical APYs
- Backend for risk metrics
- Config for metadata (names, strategies)

## Data Source Priority

### Agent Metadata (names, strategies, risks)
1. Local config (`lib/agents.ts`)
2. (Backend can override if needed)

### Financial Data (TVL, balances, shares)
1. Blockchain (wagmi) - primary source
2. Backend cache (fallback if blockchain fails)

### Enrichment Data (APYs, risk scores)
1. Backend API (if enabled and available)
2. Local calculation (fallback)

## Sync Checklist

| Data Point | Source | Synced? |
|------------|--------|---------|
| Agent Names | Config ↔ Backend | ✅ Yes |
| Target Allocations | 40/35/25 | ✅ Yes |
| Base APYs | Config ↔ Backend | ✅ Yes |
| Risk Score | 95 (both) | ✅ Yes |
| Realized Yield | 11.8% (both) | ✅ Yes |
| Protocol Names | Config ↔ Backend | ✅ Yes |
| Risk Levels | Config ↔ Backend | ✅ Yes |

## Usage Example

```typescript
import { useVaultData } from '@/hooks/useVault'

function MyComponent() {
  const { 
    tvl, 
    utilization, 
    agents, 
    activeAgentCount,
    dataSource 
  } = useVaultData()
  
  // agents now have proper names, strategies, and APYs
  return (
    <div>
      {agents.map(agent => (
        <div key={agent.id}>
          <h3>{agent.name}</h3>           {/* "Aave Lending Agent" */}
          <p>{agent.strategy}</p>          {/* "Conservative Lending" */}
          <p>APY: {agent.apy}%</p>        {/* 6.2% (not random) */}
          <p>Target: {agent.targetAllocation}%</p>  {/* 40% */}
        </div>
      ))}
      <p>Data source: {dataSource}</p>    {/* "blockchain" | "hybrid" */}
    </div>
  )
}
```

## Benefits

1. **Resilient**: Works without backend (blockchain only)
2. **Rich**: Full metadata even in pure blockchain mode
3. **Consistent**: Same names, APYs, targets across UI
4. **Flexible**: Easy to add backend enrichment later
5. **Fast**: No waiting for backend for critical data

## Future Enhancements

1. **Caching**: Add React Query for backend data caching
2. **Optimistic Updates**: Update UI immediately, verify with blockchain
3. **Fallback Chain**: Blockchain → Backend Cache → Hardcoded Defaults
4. **Real-time**: WebSocket for backend push updates
