'use client'

import { useVaultData } from '@/hooks/useVault'
import { formatCurrency } from '@/lib/utils'
import { LoadingState, LoadingCard } from '@/components/ui/LoadingState'

export function TVLCard() {
  const { tvl, isLoading } = useVaultData()
  
  if (isLoading) {
    return (
      <LoadingCard className="p-6">
        <LoadingState 
          size="sm" 
          text="Loading TVL..." 
          showSource 
          source="blockchain" 
        />
      </LoadingCard>
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
