'use client'

import { useKeeperData } from '@/hooks/useKeeper'
import { formatNumber } from '@/lib/utils'
import { ArrowDownLeft, ArrowUpRight, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export function RecentActivity() {
  const { transactions, isLoading } = useKeeperData()

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-accent" />
      case 'withdraw_request':
        return <ArrowUpRight className="w-4 h-4 text-warning" />
      case 'withdraw_complete':
        return <ArrowUpRight className="w-4 h-4 text-accent" />
      default:
        return <Clock className="w-4 h-4 text-text-muted" />
    }
  }

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit'
      case 'withdraw_request':
        return 'Withdraw Request'
      case 'withdraw_complete':
        return 'Withdraw Completed'
      default:
        return type
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold">Recent Activity</h3>
        <Link 
          href="/transactions" 
          className="text-sm text-accent hover:text-accent-hover flex items-center gap-1"
        >
          View All
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-void animate-pulse">
              <div className="w-10 h-10 rounded-full bg-surface" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface rounded w-24" />
                <div className="h-3 bg-surface rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No recent activity</p>
          <p className="text-sm text-text-muted mt-1">
            Transactions will appear here when indexed
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.slice(0, 5).map((tx) => (
            <div 
              key={tx.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-void hover:bg-surface-hover transition-colors"
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${tx.type === 'deposit' ? 'bg-accent/10' : 
                  tx.type === 'withdraw_complete' ? 'bg-accent/10' : 'bg-warning/10'}
              `}>
                {getActivityIcon(tx.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {getActivityLabel(tx.type)}
                  </span>
                  <span className={`
                    font-mono text-sm
                    ${tx.type === 'deposit' ? 'text-accent' : 'text-text-primary'}
                  `}>
                    {tx.type === 'deposit' ? '+' : '-'}
                    ${formatNumber(parseFloat(tx.amount))}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-text-muted">
                    {formatTime(tx.timestamp)}
                  </span>
                  <span className="text-xs text-text-muted">•</span>
                  <a 
                    href={`https://sepolia.arbiscan.io/tx/${tx.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {tx.tx_hash.slice(0, 6)}...{tx.tx_hash.slice(-4)}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
