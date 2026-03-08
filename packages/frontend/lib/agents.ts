/**
 * Agent Configuration - Synced with Backend
 * 
 * This file contains agent metadata that enriches blockchain data.
 * It's designed to work in hybrid mode:
 * - Core data (balances, TVL) comes from blockchain via wagmi
 * - Metadata (names, strategies) comes from this config
 * - Optional: Enriched data can come from backend API
 */

export interface AgentMetadata {
  id: number
  name: string
  shortName: string      // For compact displays
  strategy: string
  protocol: string
  risk: 'Low' | 'Medium' | 'High'
  baseApy: number        // Base APY for this strategy
  targetAllocation: number // Target weight % (40/35/25 split)
  description: string
  color: string          // For charts/visuals
}

export interface AgentEnrichment {
  currentApy: number
  tvl: number
  utilization: number
  healthScore: number
  lastRebalance: string
}

// Agent configuration - synced with backend (packages/keeper/app/config.py)
export const AGENTS_CONFIG: AgentMetadata[] = [
  {
    id: 0,
    name: 'Claude Alpha',
    shortName: 'Claude',
    strategy: 'Conservative Lending',
    protocol: 'Aave V3',
    risk: 'Low',
    baseApy: 6.2,
    targetAllocation: 40, // 40% target
    description: 'Supplies USDC to Aave V3 lending markets for stable yield generation',
    color: '#3b82f6', // blue-500
  },
  {
    id: 1,
    name: 'Codex Core',
    shortName: 'Codex',
    strategy: 'PT Yield Holding',
    protocol: 'Pendle',
    risk: 'Medium',
    baseApy: 9.8,
    targetAllocation: 35, // 35% target
    description: 'Holds Pendle PT tokens to capture fixed-rate yield opportunities',
    color: '#8b5cf6', // violet-500
  },
  {
    id: 2,
    name: 'Kimi Nexus',
    shortName: 'Kimi',
    strategy: 'Optimized Lending',
    protocol: 'Morpho',
    risk: 'Medium',
    baseApy: 7.5,
    targetAllocation: 25, // 25% target
    description: 'Utilizes Morpho Blue for optimized peer-to-peer lending rates',
    color: '#10b981', // emerald-500
  },
]

// Total target allocation (should be 100)
export const TOTAL_TARGET_ALLOCATION = AGENTS_CONFIG.reduce(
  (sum, agent) => sum + agent.targetAllocation, 
  0
)

// Risk score configuration - synced with backend
export const RISK_CONFIG = {
  overallScore: 95,
  maxScore: 100,
  metrics: {
    performance: { label: 'Performance', baseValue: 92, icon: 'TrendingUp' },
    stability: { label: 'Stability', baseValue: 88, icon: 'Lock' },
    liquidity: { label: 'Liquidity', baseValue: 90, icon: 'Zap' },
    execution: { label: 'Execution', baseValue: 94, icon: 'Activity' },
    trust: { label: 'Trust', baseValue: 85, icon: 'Shield' },
  }
}

// API configuration for hybrid mode
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_KEEPER_API_URL || 'http://localhost:8000',
  endpoints: {
    vaultState: '/vault/state',
    agents: '/vault/agents',
    riskMetrics: '/vault/risk-metrics',
    transactions: '/vault/transactions',
    userBalance: (address: string) => `/vault/user/${address}/balance`,
    userCached: (address: string) => `/vault/user/${address}/cached`,
  },
  // Enable/disable backend API fetching
  // When false, only blockchain data is used (wagmi only)
  // When true, attempts to fetch enriched data from backend
  enableBackend: process.env.NEXT_PUBLIC_USE_BACKEND_API === 'true',
}

/**
 * Get agent metadata by ID
 */
export function getAgentById(id: number): AgentMetadata | undefined {
  return AGENTS_CONFIG.find(agent => agent.id === id)
}

/**
 * Get all agent names for display
 */
export function getAgentNames(): string[] {
  return AGENTS_CONFIG.map(agent => agent.name)
}

/**
 * Calculate dynamic APY based on base APY and market conditions
 * This replaces the random APY generation in AgentList.tsx
 */
export function calculateAgentApy(agentId: number, _marketConditions?: unknown): number {
  const agent = getAgentById(agentId)
  if (!agent) return 0
  
  // For now, return base APY from config
  // In the future, this could factor in:
  // - Current utilization
  // - Market rates
  // - Historical performance
  return agent.baseApy
}

/**
 * Calculate current allocation %
 */
export function calculateAllocation(balance: number, tvl: number): number {
  if (tvl === 0) return 0
  return Math.round((balance / tvl) * 100)
}

/**
 * Check if agent is at target allocation (within threshold)
 */
export function isAtTarget(
  currentAllocation: number, 
  targetAllocation: number, 
  threshold: number = 5
): boolean {
  return Math.abs(currentAllocation - targetAllocation) <= threshold
}
