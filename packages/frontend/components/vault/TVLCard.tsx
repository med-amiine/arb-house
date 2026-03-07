'use client'

import { useVaultData } from '@/hooks/useVault'
import { formatCurrency } from '@/lib/utils'

export function TVLCard() {
  const { tvl, isLoading } = useVaultData()
  
  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse h-8 w-24 bg-surface-hover rounded"></div>
      </div>
    )
  }
  
  return (
    <div className="card p-6">
      <div className="stat-label mb-2">Total Value Locked</div>
      <div className="stat-value text-2xl">
        {formatCurrency(tvl || 0)}
      </div>
    </div>
  )
}
