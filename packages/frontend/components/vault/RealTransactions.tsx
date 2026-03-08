'use client'

import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { ExternalLink, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react'
import { formatUnits } from 'viem'

interface Transaction {
  type: 'deposit' | 'withdraw_request' | 'withdraw_complete'
  hash: string
  blockNumber: number
  timestamp: number
  amount: string
  shares?: string
  user: string
}

export function RealTransactions() {
  const { address } = useAccount()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) return
    
    // Fetch from keeper API
    const fetchTransactions = async () => {
      setLoading(true)
      try {
        const keeperUrl = process.env.NEXT_PUBLIC_KEEPER_API_URL || 'http://localhost:8000'
        const response = await fetch(`${keeperUrl}/vault/user/${address}/transactions`)
        if (response.ok) {
          const data = await response.json()
          setTransactions(data)
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
    // Poll every 30 seconds
    const interval = setInterval(fetchTransactions, 30000)
    return () => clearInterval(interval)
  }, [address])

  if (!address) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
        <p className="text-text-secondary">Connect wallet to view</p>
      </div>
    )
  }

  const formatTime = (timestamp: string | number) => {
    const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp * 1000)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        {loading && <Clock className="w-4 h-4 animate-spin text-text-muted" />}
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-text-secondary">No transactions found</p>
          <p className="text-xs text-text-muted mt-1">
            Deposits and withdrawals will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {transactions.map((tx, i) => (
            <div 
              key={i}
              className="flex items-center gap-4 p-3 bg-void rounded-lg hover:bg-surface-hover transition-colors"
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.type === 'deposit' ? 'bg-accent/10' : 
                tx.type === 'withdraw_complete' ? 'bg-accent/10' : 'bg-warning/10'
              }`}>
                {tx.type === 'deposit' ? (
                  <ArrowDownLeft className="w-5 h-5 text-accent" />
                ) : (
                  <ArrowUpRight className={`w-5 h-5 ${
                    tx.type === 'withdraw_complete' ? 'text-accent' : 'text-warning'
                  }`} />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium capitalize">
                    {tx.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatTime(tx.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={tx.type === 'deposit' ? 'text-accent' : ''}>
                    {tx.type === 'deposit' ? '+' : '-'}
                    ${Number(tx.amount).toFixed(2)}
                  </span>
                  {tx.shares && (
                    <span className="text-text-muted">
                      ({Number(tx.shares).toFixed(4)} shares)
                    </span>
                  )}
                </div>
              </div>

              {/* Link */}
              <a 
                href={`https://sepolia.arbiscan.io/tx/${tx.tx_hash || tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-surface rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-text-muted" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
