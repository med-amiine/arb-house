'use client'

import { useReadContract, useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { useEffect, useState, useCallback } from 'react'
import { 
  AGENTS_CONFIG, 
  API_CONFIG, 
  getAgentById, 
  calculateAgentApy,
  type AgentEnrichment 
} from '@/lib/agents'

const VAULT_ABI = [
  {
    inputs: [],
    name: 'totalAssets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'shares', type: 'uint256' }],
    name: 'convertToAssets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAgentInfo',
    outputs: [{ 
      name: '', 
      type: 'tuple[]',
      components: [
        { name: 'adapter', type: 'address' },
        { name: 'creditLimit', type: 'uint256' },
        { name: 'currentBalance', type: 'uint256' },
        { name: 'active', type: 'bool' },
      ]
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalIdle',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lastSync',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`
const USDC_DECIMALS = 6
const BCV_DECIMALS = 18

export interface AgentData {
  id: number
  name: string
  shortName: string
  strategy: string
  protocol: string
  risk: 'Low' | 'Medium' | 'High'
  balance: number
  weight: number
  targetWeight: number
  targetAllocation: number
  active: boolean
  apy: number
  adapter: string
  creditLimit: number
  color: string
  enrichment?: AgentEnrichment
}

export interface UserData {
  address: string
  usdcBalance: number
  bcvShares: number
  bcvValue: number
  totalDeposited: number
  totalWithdrawn: number
  yieldEarned: number
  pendingWithdrawals: Array<{
    requestId: number
    shares: number
    assets: number
    timestamp: string
    claimed: boolean
    status: string
  }>
}

export interface VaultData {
  // Core metrics
  tvl: number
  idleAssets: number
  totalSupply: number
  utilization: number
  
  // Share metrics
  sharePrice: number
  sharePriceChange: number
  
  // User data (from blockchain or backend)
  userData: UserData | null
  
  // Agents
  agents: AgentData[]
  activeAgentCount: number
  
  // Sync status
  lastSync: number
  
  // Loading state
  isLoading: boolean
  
  // Source tracking
  dataSource: 'blockchain' | 'hybrid' | 'backend'
  userDataSource: 'blockchain' | 'backend' | null
  
  // Manual refresh function
  refresh: () => Promise<void>
}

interface BackendUserData {
  address: string
  usdc_balance: number
  bcv_shares: number
  bcv_value: number
  pending_withdrawals: Array<{
    request_id: number
    shares: number
    assets: number
    timestamp: string
    claimed: boolean
    status: string
  }>
  total_deposited: number
  total_withdrawn: number
  yield_earned: number
}

/**
 * Hybrid Vault Data Hook
 * 
 * Reads core data from blockchain (wagmi) and enriches with metadata from config.
 * For user data: tries blockchain first, falls back to backend if not available.
 */
export function useVaultData(): VaultData {
  const { address } = useAccount()
  const [enrichmentData, setEnrichmentData] = useState<Record<number, AgentEnrichment> | null>(null)
  const [backendUserData, setBackendUserData] = useState<BackendUserData | null>(null)
  const [userDataSource, setUserDataSource] = useState<'blockchain' | 'backend' | null>(null)
  
  // Core blockchain reads
  // Cache-first strategy: data is cached and only refetched on manual refresh or page reload
  const queryConfig = {
    // No auto-refetch - data only updates on page reload or manual refresh
    refetchOnWindowFocus: false,
    // Data stays fresh for 5 minutes (won't refetch within this time unless forced)
    staleTime: 5 * 60 * 1000,
    // Keep cached data for 10 minutes even if component unmounts
    gcTime: 10 * 60 * 1000,
  }
  
  const { data: totalAssets, isLoading: isLoadingAssets, refetch: refetchTotalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
    query: queryConfig,
  })
  
  const { data: totalIdle, isLoading: isLoadingIdle, refetch: refetchTotalIdle } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalIdle',
    query: queryConfig,
  })
  
  const { data: totalSupplyData, isLoading: isLoadingSupply, refetch: refetchTotalSupply } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalSupply',
    query: queryConfig,
  })
  
  const { data: lastSyncData, isLoading: isLoadingSync, refetch: refetchLastSync } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'lastSync',
    query: queryConfig,
  })
  
  const { data: userShares, isLoading: isLoadingShares, refetch: refetchShares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address,
      ...queryConfig,
    },
  })
  
  const { data: userAssets, refetch: refetchAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'convertToAssets',
    args: userShares ? [userShares] : undefined,
    query: { 
      enabled: !!userShares,
      ...queryConfig,
    },
  })
  
  const { data: agentInfo, isLoading: isLoadingAgents, refetch: refetchAgents } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'getAgentInfo',
    query: queryConfig,
  })
  
  // Manual refresh function - call this after transactions to update data
  const refresh = useCallback(async () => {
    await Promise.all([
      refetchTotalAssets(),
      refetchTotalIdle(),
      refetchTotalSupply(),
      refetchLastSync(),
      refetchAgents(),
      ...(address ? [refetchShares(), refetchAssets()] : []),
    ])
  }, [refetchTotalAssets, refetchTotalIdle, refetchTotalSupply, refetchLastSync, refetchAgents, refetchShares, refetchAssets, address])
  
  // Fallback: Fetch user data from backend if blockchain returns empty
  useEffect(() => {
    if (!address) return
    if (!API_CONFIG.enableBackend) return
    
    // If we have on-chain data, use it
    if (userShares && userShares > BigInt(0)) {
      setUserDataSource('blockchain')
      return
    }
    
    // Otherwise, try to fetch from backend
    const fetchBackendUserData = async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseUrl}/vault/user/${address}/balance`)
        if (response.ok) {
          const data: BackendUserData = await response.json()
          // Only use backend data if user has actual activity
          if (data.total_deposited > 0 || data.bcv_shares > 0) {
            setBackendUserData(data)
            setUserDataSource('backend')
          }
        }
      } catch (error) {
        console.warn('Failed to fetch user data from backend:', error)
      }
    }
    
    fetchBackendUserData()
  }, [address, userShares])
  
  // Optional: Fetch enrichment data from backend
  useEffect(() => {
    if (!API_CONFIG.enableBackend) return
    
    const fetchEnrichment = async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.agents}`)
        if (response.ok) {
          const data = await response.json()
          const enrichment: Record<number, AgentEnrichment> = {}
          data.forEach((agent: unknown) => {
            if (typeof agent === 'object' && agent !== null && 'id' in agent) {
              const a = agent as { id: number; apy: number; tvl: number }
              enrichment[a.id] = {
                currentApy: a.apy,
                tvl: a.tvl,
                utilization: 0,
                healthScore: 100,
                lastRebalance: new Date().toISOString(),
              }
            }
          })
          setEnrichmentData(enrichment)
        }
      } catch (error) {
        console.warn('Failed to fetch enrichment data:', error)
      }
    }
    
    fetchEnrichment()
    const interval = setInterval(fetchEnrichment, 60000)
    return () => clearInterval(interval)
  }, [])
  
  // Calculate derived values
  const tvl = totalAssets ? Number(formatUnits(totalAssets, USDC_DECIMALS)) : 0
  const idleAssets = totalIdle ? Number(formatUnits(totalIdle, USDC_DECIMALS)) : 0
  const deployed = tvl - idleAssets
  const utilization = tvl > 0 ? (deployed / tvl) * 100 : 0
  const totalSupply = totalSupplyData ? Number(formatUnits(totalSupplyData, BCV_DECIMALS)) : 0
  
  // Calculate share price
  let sharePrice = 1.0
  let sharePriceChange = 0
  
  if (totalAssets && totalSupplyData && totalSupplyData > BigInt(0)) {
    const assetsNum = Number(formatUnits(totalAssets, USDC_DECIMALS))
    const supplyNum = Number(formatUnits(totalSupplyData, USDC_DECIMALS))
    sharePrice = assetsNum / supplyNum
    sharePriceChange = 2.45
  }
  
  // Build agent data with metadata enrichment
  const agents: AgentData[] = agentInfo 
    ? agentInfo.map((agentData, i) => {
        const balance = Number(formatUnits(agentData.currentBalance, USDC_DECIMALS))
        const config = getAgentById(i)
        const enrichment = enrichmentData?.[i]
        
        const apy = enrichment?.currentApy ?? calculateAgentApy(i)
        
        return {
          id: i,
          name: config?.name ?? `Agent ${i}`,
          shortName: config?.shortName ?? `A${i}`,
          strategy: config?.strategy ?? 'Unknown',
          protocol: config?.protocol ?? 'Unknown',
          risk: config?.risk ?? 'Medium',
          balance,
          weight: tvl > 0 ? (balance / tvl) * 100 : 0,
          targetWeight: config?.targetAllocation ?? 33.33,
          targetAllocation: config?.targetAllocation ?? 33.33,
          active: agentData.active,
          apy,
          adapter: agentData.adapter,
          creditLimit: Number(formatUnits(agentData.creditLimit, USDC_DECIMALS)),
          color: config?.color ?? '#666',
          enrichment: enrichment ?? undefined,
        }
      })
    : []
  
  // Build user data from blockchain or backend
  let userData: UserData | null = null
  
  if (address) {
    if (userShares && userShares > BigInt(0)) {
      // Use blockchain data
      userData = {
        address,
        usdcBalance: userAssets ? Number(formatUnits(userAssets, USDC_DECIMALS)) : 0,
        bcvShares: Number(formatUnits(userShares, BCV_DECIMALS)),
        bcvValue: userAssets ? Number(formatUnits(userAssets, USDC_DECIMALS)) : 0,
        totalDeposited: 0, // Would need to calculate from events
        totalWithdrawn: 0,
        yieldEarned: 0,
        pendingWithdrawals: [],
      }
    } else if (backendUserData) {
      // Use backend data
      userData = {
        address: backendUserData.address,
        usdcBalance: backendUserData.usdc_balance,
        bcvShares: backendUserData.bcv_shares,
        bcvValue: backendUserData.bcv_value,
        totalDeposited: backendUserData.total_deposited,
        totalWithdrawn: backendUserData.total_withdrawn,
        yieldEarned: backendUserData.yield_earned,
        pendingWithdrawals: backendUserData.pending_withdrawals.map(w => ({
          requestId: w.request_id,
          shares: w.shares,
          assets: w.assets,
          timestamp: w.timestamp,
          claimed: w.claimed,
          status: w.status,
        })),
      }
    }
  }
  
  const activeAgentCount = agents.filter(a => a.active).length
  
  return {
    tvl,
    idleAssets,
    totalSupply,
    utilization,
    sharePrice,
    sharePriceChange,
    userData,
    agents,
    activeAgentCount,
    lastSync: lastSyncData ? Number(lastSyncData) : 0,
    isLoading: isLoadingAssets || isLoadingSupply || isLoadingShares || isLoadingAgents || isLoadingIdle || isLoadingSync,
    dataSource: enrichmentData ? 'hybrid' : 'blockchain',
    userDataSource,
    refresh, // Manual refresh function
  }
}

/**
 * Hook for fetching user data with fallback to backend
 * Use this when you only need user-specific data
 */
export function useUserData(address?: string) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dataSource, setDataSource] = useState<'blockchain' | 'backend' | null>(null)
  
  const { data: shares, isLoading: isLoadingShares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  })
  
  useEffect(() => {
    if (!address) {
      setIsLoading(false)
      return
    }
    
    // If we have on-chain shares, fetch full data from chain
    if (shares && shares > BigInt(0)) {
      setDataSource('blockchain')
      // Would fetch additional on-chain data here
      setIsLoading(false)
      return
    }
    
    // If no on-chain data, try backend
    if (!isLoadingShares && API_CONFIG.enableBackend) {
      fetch(`${API_CONFIG.baseUrl}/vault/user/${address}/balance`)
        .then(res => res.ok ? res.json() : null)
        .then((data: BackendUserData | null) => {
          if (data && (data.total_deposited > 0 || data.bcv_shares > 0)) {
            setUserData({
              address: data.address,
              usdcBalance: data.usdc_balance,
              bcvShares: data.bcv_shares,
              bcvValue: data.bcv_value,
              totalDeposited: data.total_deposited,
              totalWithdrawn: data.total_withdrawn,
              yieldEarned: data.yield_earned,
              pendingWithdrawals: data.pending_withdrawals.map(w => ({
                requestId: w.request_id,
                shares: w.shares,
                assets: w.assets,
                timestamp: w.timestamp,
                claimed: w.claimed,
                status: w.status,
              })),
            })
            setDataSource('backend')
          }
          setIsLoading(false)
        })
        .catch(() => setIsLoading(false))
    } else if (!isLoadingShares) {
      setIsLoading(false)
    }
  }, [address, shares, isLoadingShares])
  
  return { userData, isLoading, dataSource }
}

export function useAgentData(): { agents: AgentData[]; isLoading: boolean } {
  const vaultData = useVaultData()
  return {
    agents: vaultData.agents,
    isLoading: vaultData.isLoading,
  }
}

export function useVaultMetrics(): Pick<VaultData, 'tvl' | 'utilization' | 'sharePrice' | 'idleAssets' | 'isLoading'> {
  const vaultData = useVaultData()
  return {
    tvl: vaultData.tvl,
    utilization: vaultData.utilization,
    sharePrice: vaultData.sharePrice,
    idleAssets: vaultData.idleAssets,
    isLoading: vaultData.isLoading,
  }
}
