'use client'

import { useVaultData } from '@/hooks/useVault'
import { LoadingState, LoadingCard } from '@/components/ui/LoadingState'

export function SharePrice() {
  const { sharePrice, sharePriceChange, isLoading } = useVaultData()
  
  if (isLoading) {
    return (
      <LoadingCard className="p-8 h-full">
        <LoadingState 
          size="sm" 
          text="Loading share price..." 
          showSource 
          source="blockchain" 
        />
      </LoadingCard>
    )
  }
  
  const isPositive = sharePriceChange && sharePriceChange >= 0
  const changeColor = isPositive ? 'text-accent' : 'text-danger'
  const changeSign = isPositive ? '+' : ''
  
  return (
    <div className="card p-8">
      <div className="text-text-secondary text-sm font-medium mb-4">
        Share Price
      </div>
      
      <div className="flex items-baseline gap-4">
        <span className="text-price-lg font-mono text-text-primary">
          ${sharePrice?.toFixed(4) || '1.0000'}
        </span>
        
        {sharePriceChange !== undefined && (
          <span className={`font-mono text-sm ${changeColor}`}>
            {changeSign}{sharePriceChange.toFixed(2)}%
          </span>
        )}
      </div>
      
      <div className="mt-6 flex items-center gap-2 text-text-muted text-xs">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse-slow"></div>
        Updated 2 min ago
      </div>
    </div>
  )
}
