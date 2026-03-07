'use client'

import { useVaultData } from '@/hooks/useVault'
import { TrendingUp, Users, Wallet, Percent } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export function VaultStats() {
  const { sharePrice, sharePriceChange, tvl, isLoading } = useVaultData()

  const stats = [
    {
      label: 'Total Value Locked',
      value: isLoading ? '...' : `$${formatNumber(tvl)}`,
      change: '+12.5%',
      icon: Wallet,
      trend: 'up',
    },
    {
      label: 'Share Price',
      value: isLoading ? '...' : `$${sharePrice.toFixed(4)}`,
      change: `+${sharePriceChange.toFixed(2)}%`,
      icon: TrendingUp,
      trend: 'up',
    },
    {
      label: 'Active Depositors',
      value: '1,234',
      change: '+5.2%',
      icon: Users,
      trend: 'up',
    },
    {
      label: 'Current APY',
      value: '8.42%',
      change: '+0.3%',
      icon: Percent,
      trend: 'up',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="bg-surface border border-border rounded-xl p-6 hover:border-accent/50 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-secondary text-sm">{stat.label}</span>
              <div className="w-10 h-10 rounded-lg bg-surface-hover flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                <Icon className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-accent">{stat.change}</span>
                <span className="text-text-muted">vs last week</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
