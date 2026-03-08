'use client'

import { useAccount } from 'wagmi'
import { useVaultData } from '@/hooks/useVault'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { LoadingState, LoadingCard, DataSourceBadge } from '@/components/ui/LoadingState'

export function UserPosition() {
  const { isConnected } = useAccount()
  const { userData, isLoading, userDataSource } = useVaultData()
  
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
      <LoadingCard className="p-6">
        <LoadingState 
          size="sm" 
          text="Loading your position..." 
          showSource 
          source={userDataSource === 'backend' ? 'backend' : 'blockchain'} 
        />
      </LoadingCard>
    )
  }
  
  if (!userData || userData.bcvShares === 0) {
    return (
      <div className="card p-6">
        <div className="stat-label mb-2">Your Position</div>
        <div className="text-text-muted text-sm">No position yet</div>
        {userDataSource === 'backend' && (
          <div className="text-xs text-text-secondary mt-1">(From cache)</div>
        )}
      </div>
    )
  }
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="stat-label">Your Position</div>
        {userDataSource === 'backend' && (
          <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
            Cached
          </span>
        )}
      </div>
      
      <div className="stat-value text-2xl mb-1">
        {formatCurrency(userData.bcvValue)}
      </div>
      
      <div className="font-mono text-text-secondary text-sm">
        {formatNumber(userData.bcvShares)} BCV
      </div>
      
      {(userData.totalDeposited > 0 || userData.totalWithdrawn > 0) && (
        <div className="mt-3 pt-3 border-t border-border text-xs text-text-secondary">
          <div className="flex justify-between">
            <span>Deposited:</span>
            <span className="font-mono">{formatCurrency(userData.totalDeposited)}</span>
          </div>
          <div className="flex justify-between">
            <span>Withdrawn:</span>
            <span className="font-mono">{formatCurrency(userData.totalWithdrawn)}</span>
          </div>
          {userData.yieldEarned > 0 && (
            <div className="flex justify-between text-accent">
              <span>Yield Earned:</span>
              <span className="font-mono">+{formatCurrency(userData.yieldEarned)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
