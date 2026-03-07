'use client'

import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bcv-keeper-production.up.railway.app'

interface VaultState {
  tvl: number
  tvl_change_24h: number
  apy: number
  apy_change_24h: number
  share_price: number
  depositors: number
  total_shares: number
  last_update: string
}

interface Agent {
  id: number
  name: string
  protocol: string
  apy: number
  allocation: number
  balance: number
  risk: string
  strategy: string
  active: boolean
}

interface Transaction {
  id: string
  type: string
  amount: number
  asset: string
  user: string
  timestamp: string
  status: string
  hash: string
}

interface YieldData {
  month: string
  apy: number
}

export function useKeeperVault() {
  const [state, setState] = useState<VaultState | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [yieldHistory, setYieldHistory] = useState<YieldData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch all data in parallel
        const [stateRes, agentsRes, txRes, yieldRes] = await Promise.all([
          fetch(`${API_URL}/vault/state`),
          fetch(`${API_URL}/vault/agents`),
          fetch(`${API_URL}/vault/transactions`),
          fetch(`${API_URL}/vault/yield-history`),
        ])
        
        if (stateRes.ok) setState(await stateRes.json())
        if (agentsRes.ok) setAgents(await agentsRes.json())
        if (txRes.ok) setTransactions(await txRes.json())
        if (yieldRes.ok) setYieldHistory(await yieldRes.json())
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vault data')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    state,
    agents,
    transactions,
    yieldHistory,
    isLoading,
    error,
  }
}

export function useUserBalance(userAddress?: string) {
  const [balance, setBalance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userAddress) return
    
    const fetchBalance = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`${API_URL}/vault/user/${userAddress}/balance`)
        if (res.ok) setBalance(await res.json())
      } catch (err) {
        console.error('Failed to fetch user balance:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchBalance()
  }, [userAddress])

  return { balance, isLoading }
}
