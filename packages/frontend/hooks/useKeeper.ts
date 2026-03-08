'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'

// Allow overriding via localStorage for development
const getKeeperApiUrl = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('keeper_api_url')
    if (stored) return stored
  }
  return process.env.NEXT_PUBLIC_KEEPER_API_URL || 'http://localhost:8000'
}

const KEEPER_API_URL = process.env.NEXT_PUBLIC_KEEPER_API_URL || 'http://localhost:8000'

export interface Transaction {
  id: string
  type: 'deposit' | 'withdraw_request' | 'withdraw_complete'
  amount: string
  shares: string
  asset: string
  user: string
  timestamp: string
  block_number: number
  tx_hash: string
}

export interface VaultState {
  tvl: number
  tvl_change_24h: number
  apy: number
  apy_change_24h: number
  share_price: number
  depositors: number
  total_shares: number
  last_update: string
  last_sync: number
  idle_assets: number
  agent_balances: number[]
}

export interface AgentInfo {
  id: number
  name: string
  protocol: string
  adapter: string
  credit_limit: number
  balance: number
  apy: number
  allocation: number
  target_allocation: number
  active: boolean
}

export interface WithdrawalRequest {
  request_id: number
  shares: number
  assets: number
  timestamp: string
  claimed: boolean
  status: string
}

export interface UserBalance {
  address: string
  usdc_balance: number
  bcv_shares: number
  bcv_value: number
  pending_withdrawals: WithdrawalRequest[]
  total_deposited: number
  total_withdrawn: number
  yield_earned: number
}

// Hook to get/set keeper API URL dynamically
export function useKeeperConfig() {
  const [apiUrl, setApiUrl] = useState(KEEPER_API_URL)

  useEffect(() => {
    setApiUrl(getKeeperApiUrl())
  }, [])

  const updateApiUrl = useCallback((url: string) => {
    setApiUrl(url)
    if (typeof window !== 'undefined') {
      localStorage.setItem('keeper_api_url', url)
    }
  }, [])

  return { apiUrl, updateApiUrl }
}

export function useKeeperData() {
  const { address } = useAccount()
  const { apiUrl } = useKeeperConfig()
  const [vaultState, setVaultState] = useState<VaultState | null>(null)
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch vault state
  const fetchVaultState = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/vault/state`)
      if (!response.ok) throw new Error('Failed to fetch vault state')
      const data = await response.json()
      setVaultState(data)
    } catch (err) {
      console.error('Error fetching vault state:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [apiUrl])

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/vault/agents`)
      if (!response.ok) throw new Error('Failed to fetch agents')
      const data = await response.json()
      setAgents(data)
    } catch (err) {
      console.error('Error fetching agents:', err)
    }
  }, [apiUrl])

  // Fetch transactions
  const fetchTransactions = useCallback(async (limit = 10) => {
    try {
      const response = await fetch(`${apiUrl}/vault/transactions?limit=${limit}`)
      if (!response.ok) throw new Error('Failed to fetch transactions')
      const data = await response.json()
      setTransactions(data)
    } catch (err) {
      console.error('Error fetching transactions:', err)
    }
  }, [apiUrl])

  // Fetch user balance
  const fetchUserBalance = useCallback(async (userAddress: string) => {
    try {
      const response = await fetch(`${apiUrl}/vault/user/${userAddress}/balance`)
      if (!response.ok) throw new Error('Failed to fetch user balance')
      const data = await response.json()
      setUserBalance(data)
    } catch (err) {
      console.error('Error fetching user balance:', err)
    }
  }, [apiUrl])

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/vault/sync`, { method: 'POST' })
      if (!response.ok) throw new Error('Failed to trigger sync')
      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error triggering sync:', err)
      throw err
    }
  }, [apiUrl])

  // Initial fetch
  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      fetchVaultState(),
      fetchAgents(),
      fetchTransactions()
    ]).finally(() => setIsLoading(false))

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchVaultState()
      fetchAgents()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchVaultState, fetchAgents, fetchTransactions])

  // Fetch user balance when address changes
  useEffect(() => {
    if (address) {
      fetchUserBalance(address)
    }
  }, [address, fetchUserBalance])

  return {
    vaultState,
    agents,
    transactions,
    userBalance,
    isLoading,
    error,
    apiUrl,
    refetch: {
      vaultState: fetchVaultState,
      agents: fetchAgents,
      transactions: fetchTransactions,
      userBalance: fetchUserBalance
    },
    triggerSync
  }
}

// Hook for vault yield history (used by YieldChart)
export function useKeeperVault() {
  const { apiUrl } = useKeeperConfig()
  const [yieldHistory, setYieldHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchYieldHistory = async () => {
      try {
        const response = await fetch(`${apiUrl}/vault/yield-history`)
        if (response.ok) {
          const data = await response.json()
          setYieldHistory(data)
        } else {
          // Fallback to mock data if API fails
          setYieldHistory([
            { date: '2024-01-01', apy: 4.2 },
            { date: '2024-02-01', apy: 5.1 },
            { date: '2024-03-01', apy: 4.8 },
            { date: '2024-04-01', apy: 6.2 },
            { date: '2024-05-01', apy: 5.9 },
            { date: '2024-06-01', apy: 7.1 },
            { date: '2024-07-01', apy: 6.8 },
            { date: '2024-08-01', apy: 8.2 },
            { date: '2024-09-01', apy: 7.9 },
            { date: '2024-10-01', apy: 8.5 },
            { date: '2024-11-01', apy: 8.1 },
            { date: '2024-12-01', apy: 8.42 },
          ])
        }
      } catch (error) {
        console.error('Error fetching yield history:', error)
        // Use fallback data
        setYieldHistory([
          { date: '2024-01-01', apy: 4.2 },
          { date: '2024-02-01', apy: 5.1 },
          { date: '2024-03-01', apy: 4.8 },
          { date: '2024-04-01', apy: 6.2 },
          { date: '2024-05-01', apy: 5.9 },
          { date: '2024-06-01', apy: 7.1 },
          { date: '2024-07-01', apy: 6.8 },
          { date: '2024-08-01', apy: 8.2 },
          { date: '2024-09-01', apy: 7.9 },
          { date: '2024-10-01', apy: 8.5 },
          { date: '2024-11-01', apy: 8.1 },
          { date: '2024-12-01', apy: 8.42 },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchYieldHistory()
  }, [apiUrl])

  return { yieldHistory, isLoading }
}

// Hook for user-specific transactions
export function useUserTransactions(userAddress?: string) {
  const { apiUrl } = useKeeperConfig()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userAddress) return

    setIsLoading(true)
    fetch(`${apiUrl}/vault/user/${userAddress}/transactions`)
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [userAddress, apiUrl])

  return { transactions, isLoading }
}
