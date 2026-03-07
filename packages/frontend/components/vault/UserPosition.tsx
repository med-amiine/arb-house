'use client'

import { useAccount } from 'wagmi'
import { useVaultData } from '@/hooks/useVault'
import { formatCurrency, formatNumber } from '@/lib/utils'

export function UserPosition() {
  const { isConnected } = useAccount()
  const { userShares, userAssets, isLoading } = useVaultData()
  
  if (!isConnected) {
    return (
      <div className="card p-6">
        <div className="stat-label mb-2">Your Position</div>
        <div className="text-text-muted text-sm">Connect wallet to view</div>
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse h-8 w-24 bg-surface-hover rounded"></div>
      </div>
    )
  }
  
  if (!userShares || userShares === 0) {
    return (
      <div className="card p-6">
        <div className="stat-label mb-2">Your Position</div>
        <div className="text-text-muted text-sm">No position yet</div>
      </div>
    )
  }
  
  return (
    <div className="card p-6">
      <div className="stat-label mb-2">Your Position</div>
      
      <div className="stat-value text-2xl mb-1">
        {formatCurrency(userAssets || 0)}
      </div>
      
      <div className="font-mono text-text-secondary text-sm">
        {formatNumber(userShares || 0)} BCV
      </div>
    </div>
  )
}
