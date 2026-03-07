'use client'

import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { Clock, CheckCircle2 } from 'lucide-react'
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
  
  // Read user's withdrawal queue
  const { data: withdrawals } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'getUserWithdrawals',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: 10000, // Refetch every 10s
    },
  })
  
  // Read pending assets
  const { data: pendingAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'pendingAssets',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
  
  if (!isConnected) return null
  
  const userWithdrawals = (withdrawals as WithdrawalRequest[] || [])
    .filter((w, i) => w.assets > 0n) // Only show non-empty
    .map((w, i) => ({ ...w, requestId: i }))
    .reverse() // Newest first
  
  if (userWithdrawals.length === 0 && (!pendingAssets || pendingAssets === 0n)) {
    return null
  }
  
  const pendingFormatted = pendingAssets 
    ? formatNumber(Number(formatUnits(pendingAssets as bigint, USDC_DECIMALS)))
    : '0'
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">
          Pending Withdrawals
        </h2>
        <span className="text-text-secondary text-sm">
          Total pending: <span className="font-mono text-text-primary">{pendingFormatted} USDC</span>
        </span>
      </div>
      
      <div className="space-y-3">
        {userWithdrawals.slice(0, 5).map((req) => (
          <div 
            key={req.requestId}
            className="flex items-center justify-between bg-surface-hover rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              {req.claimed ? (
                <CheckCircle2 size={18} className="text-accent" />
              ) : (
                <Clock size={18} className="text-warning animate-pulse" />
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
                #{req.requestId}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {userWithdrawals.length > 5 && (
        <p className="text-center text-text-muted text-sm mt-4">
          +{userWithdrawals.length - 5} more withdrawals
        </p>
      )}
    </div>
  )
}
