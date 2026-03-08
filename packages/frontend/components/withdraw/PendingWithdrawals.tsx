'use client'

import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { Clock, CheckCircle2, Info, Shield, Loader2 } from 'lucide-react'
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts'
import { formatNumber } from '@/lib/utils'

const USDC_DECIMALS = 6

interface WithdrawalRequest {
  shares: bigint
  assets: bigint
  timestamp: bigint
  claimed: boolean
}

export function PendingWithdrawals() {
  const { address, isConnected } = useAccount()
  
  // Read user's withdrawal queue - cached, no auto-refetch
  const { data: withdrawals, isLoading } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'getUserWithdrawals',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  })
  
  // Read pending assets - cached
  const { data: pendingAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'getUserPendingAssets',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  })

  // Read keeper address
  const { data: keeper } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'keeper',
  })
  
  if (!isConnected) return null
  
  const userWithdrawals = (withdrawals as WithdrawalRequest[] || [])
    .filter((w, i) => w.assets > BigInt(0)) // Only show non-empty
    .map((w, i) => ({ ...w, requestId: i }))
    .reverse() // Newest first

  // Separate claimed and unclaimed
  const unclaimedWithdrawals = userWithdrawals.filter(w => !w.claimed)
  const claimedWithdrawals = userWithdrawals.filter(w => w.claimed)
  
  const hasPending = unclaimedWithdrawals.length > 0 || (pendingAssets && pendingAssets > BigInt(0))
  
  if (userWithdrawals.length === 0 && (!pendingAssets || pendingAssets === BigInt(0))) {
    return null
  }
  
  const pendingFormatted = pendingAssets 
    ? formatNumber(Number(formatUnits(pendingAssets as bigint, USDC_DECIMALS)))
    : '0'
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">
          Withdrawal History
        </h2>
        {hasPending && (
          <span className="text-text-secondary text-sm">
            Total pending: <span className="font-mono text-text-primary">{pendingFormatted} USDC</span>
          </span>
        )}
      </div>

      {/* Keeper Processing Info */}
      {hasPending && (
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary">Keeper Processing</p>
              <p className="text-xs text-text-secondary mt-1">
                Your withdrawal is being processed by the keeper. USDC will be sent to your wallet automatically 
                once processed (typically within 2-5 minutes). The keeper address is{' '}
                <span className="font-mono text-xs">{keeper ? `${keeper.slice(0, 6)}...${keeper.slice(-4)}` : '...'}</span>.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-text-secondary">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading withdrawals...
          </div>
        ) : userWithdrawals.length === 0 ? (
          <div className="text-center py-6 text-text-secondary text-sm">
            No withdrawal history
          </div>
        ) : (
          userWithdrawals.slice(0, 5).map((req) => (
            <div 
              key={req.requestId}
              className="flex items-center justify-between bg-surface-hover rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                {req.claimed ? (
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-accent" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                    <Clock size={16} className="text-warning animate-pulse" />
                  </div>
                )}
                
                <div>
                  <div className="font-mono text-text-primary">
                    {formatNumber(Number(formatUnits(req.assets, USDC_DECIMALS)))} USDC
                  </div>
                  <div className="text-xs text-text-muted">
                    {formatNumber(Number(formatUnits(req.shares, USDC_DECIMALS)))} BCV burned
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  req.claimed 
                    ? 'bg-accent/20 text-accent' 
                    : 'bg-warning/20 text-warning'
                }`}>
                  {req.claimed ? 'Completed' : 'Processing'}
                </span>
                <div className="text-xs text-text-muted mt-1">
                  #{req.requestId} • {new Date(Number(req.timestamp) * 1000).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {userWithdrawals.length > 5 && (
        <p className="text-center text-text-muted text-sm mt-4">
          +{userWithdrawals.length - 5} more withdrawals
        </p>
      )}

      {/* Info Footer */}
      <div className="mt-4 pt-4 border-t border-border flex items-start gap-2 text-xs text-text-secondary">
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        <p>
          Withdrawals are processed asynchronously by the keeper. Shares are burned immediately, 
          and USDC is transferred once the keeper completes the request.
        </p>
      </div>
    </div>
  )
}
