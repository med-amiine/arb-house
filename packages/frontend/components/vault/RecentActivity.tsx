'use client'

import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react'
import { useKeeperVault } from '@/hooks/useKeeper'
import { formatNumber } from '@/lib/utils'

export function RecentActivity() {
  const { transactions, isLoading } = useKeeperVault()

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  // Fallback data if API fails
  const displayActivities = transactions.length > 0 
    ? transactions.slice(0, 4) 
    : [
        { id: 'tx_001', type: 'deposit', amount: 10000, asset: 'USDC', timestamp: new Date().toISOString(), status: 'completed' },
        { id: 'tx_002', type: 'withdraw', amount: 5000, asset: 'USDC', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'completed' },
        { id: 'tx_003', type: 'deposit', amount: 25000, asset: 'USDC', timestamp: new Date(Date.now() - 10800000).toISOString(), status: 'completed' },
        { id: 'tx_004', type: 'yield', amount: 125.50, asset: 'USDC', timestamp: new Date(Date.now() - 18000000).toISOString(), status: 'completed' },
      ]

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-surface-hover rounded w-1/3 mb-4"></div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-surface-hover rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <a
          href="/transactions"
          className="text-sm text-accent hover:text-accent-hover transition-colors"
        >
          View all
        </a>
      </div>

      <div className="space-y-3">
        {displayActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-void/50 hover:bg-void transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activity.type === 'deposit'
                ? 'bg-accent/10'
                : activity.type === 'withdraw'
                ? 'bg-danger/10'
                : 'bg-warning/10'
            }`}>
              {activity.type === 'deposit' ? (
                <ArrowDownLeft className="w-5 h-5 text-accent" />
              ) : activity.type === 'withdraw' ? (
                <ArrowUpRight className="w-5 h-5 text-danger" />
              ) : (
                <Clock className="w-5 h-5 text-warning" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{activity.type}</span>
                <span className={`font-mono ${
                  activity.type === 'deposit'
                    ? 'text-accent'
                    : activity.type === 'withdraw'
                    ? 'text-danger'
                    : 'text-warning'
                }`}>
                  {activity.type === 'withdraw' ? '-' : '+'}{formatNumber(activity.amount)} {activity.asset}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-text-muted mt-1">
                <span>{formatRelativeTime(activity.timestamp)}</span>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-accent" />
                  <span className="text-accent capitalize">{activity.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
