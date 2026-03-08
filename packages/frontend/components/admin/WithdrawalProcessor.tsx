'use client'

import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits } from 'viem'
import { 
  Wallet, 
  CheckCircle2, 
  Loader2, 
  Search, 
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts'
import { formatNumber } from '@/lib/utils'

const USDC_DECIMALS = 6

interface WithdrawalRequest {
  shares: bigint
  assets: bigint
  timestamp: bigint
  claimed: boolean
}

export function WithdrawalProcessor() {
  const { address } = useAccount()
  const [userAddress, setUserAddress] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [completedRequests, setCompletedRequests] = useState<Set<number>>(new Set())

  // Read keeper address to verify current user is keeper
  const { data: keeper } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'keeper',
  })

  // Read user's withdrawal queue
  const { 
    data: withdrawals, 
    refetch: refetchWithdrawals,
    isLoading: isLoadingWithdrawals 
  } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'getUserWithdrawals',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { enabled: !!userAddress },
  })

  // Complete withdrawal
  const { 
    writeContract: completeWithdrawal, 
    isPending: isCompleting, 
    data: completeHash,
    error: completeError 
  } = useWriteContract()

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash: completeHash 
  })

  const isKeeper = address && keeper && address.toLowerCase() === (keeper as string).toLowerCase()

  const userWithdrawals = (withdrawals as WithdrawalRequest[] || [])
    .map((w, i) => ({ ...w, requestId: i }))
    .filter(w => w.assets > BigInt(0)) // Only show non-empty

  const pendingWithdrawals = userWithdrawals.filter(w => !w.claimed && !completedRequests.has(w.requestId))
  const processedWithdrawals = userWithdrawals.filter(w => w.claimed || completedRequests.has(w.requestId))

  const handleComplete = (requestId: number) => {
    if (!userAddress || !isKeeper) return
    
    setSelectedRequestId(requestId)
    
    completeWithdrawal({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'completeWithdrawal',
      args: [userAddress as `0x${string}`, BigInt(requestId)],
    })
  }

  // Handle successful completion
  if (isConfirmed && selectedRequestId !== null && !completedRequests.has(selectedRequestId)) {
    setCompletedRequests(prev => new Set(prev).add(selectedRequestId))
    setSelectedRequestId(null)
    refetchWithdrawals()
    
    // Match Demo.s.sol logging format
    console.log('=== WITHDRAWAL COMPLETION ===')
    console.log('Request ID:', selectedRequestId)
    console.log('User:', userAddress)
    console.log('Transaction:', completeHash)
  }

  const isProcessing = isCompleting || isConfirming

  return (
    <div className="card p-6 border-accent/20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Withdrawal Processor</h3>
          <p className="text-xs text-text-secondary">Complete withdrawals for users (Keeper only)</p>
        </div>
      </div>

      {/* Keeper Status */}
      <div className={`p-3 rounded-lg mb-4 ${isKeeper ? 'bg-accent/10 border border-accent/20' : 'bg-warning/10 border border-warning/30'}`}>
        <div className="flex items-center gap-2">
          {isKeeper ? (
            <CheckCircle2 className="w-4 h-4 text-accent" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-warning" />
          )}
          <span className={`text-sm font-medium ${isKeeper ? 'text-accent' : 'text-warning'}`}>
            {isKeeper ? 'You are the keeper' : 'Not the keeper'}
          </span>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          Current keeper: <span className="font-mono">{keeper ? `${(keeper as string).slice(0, 10)}...` : 'Loading...'}</span>
        </p>
      </div>

      {/* User Address Input */}
      <div className="space-y-3 mb-6">
        <label className="text-sm font-medium text-text-secondary">User Address</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            placeholder="0x..."
            className="input w-full text-sm"
            disabled={isProcessing}
          />
          <button
            onClick={() => refetchWithdrawals()}
            disabled={!userAddress || isLoadingWithdrawals}
            className="px-3 py-2 bg-surface border border-border rounded-lg hover:bg-surface-hover disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingWithdrawals ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {completeError && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-danger">Transaction Error</p>
              <p className="text-xs text-text-secondary">{completeError.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Display */}
      {isConfirmed && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-accent">Withdrawal Completed</p>
              <p className="text-xs text-text-secondary">
                Transaction: <span className="font-mono">{completeHash?.slice(0, 20)}...</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawals List */}
      {userAddress && (
        <div className="space-y-4">
          {/* Pending Withdrawals */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Withdrawals ({pendingWithdrawals.length})
            </h4>
            
            {isLoadingWithdrawals ? (
              <div className="flex items-center justify-center py-8 text-text-secondary">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : pendingWithdrawals.length === 0 ? (
              <div className="text-center py-6 bg-surface-hover rounded-lg">
                <p className="text-sm text-text-secondary">No pending withdrawals</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingWithdrawals.map((req) => (
                  <div 
                    key={req.requestId}
                    className="flex items-center justify-between bg-surface-hover rounded-lg p-4 border border-warning/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                        <Clock size={14} className="text-warning" />
                      </div>
                      <div>
                        <div className="font-mono text-text-primary">
                          {formatNumber(Number(formatUnits(req.assets, USDC_DECIMALS)))} USDC
                        </div>
                        <div className="text-xs text-text-muted">
                          {formatNumber(Number(formatUnits(req.shares, USDC_DECIMALS)))} BCV • Request #{req.requestId}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleComplete(req.requestId)}
                      disabled={isProcessing || !isKeeper}
                      className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isProcessing && selectedRequestId === req.requestId ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isConfirming ? 'Confirming...' : 'Processing...'}
                        </>
                      ) : (
                        <>
                          Complete
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Processed Withdrawals */}
          {processedWithdrawals.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Completed ({processedWithdrawals.length})
              </h4>
              <div className="space-y-2">
                {processedWithdrawals.slice(0, 3).map((req) => (
                  <div 
                    key={req.requestId}
                    className="flex items-center justify-between bg-surface-hover/50 rounded-lg p-4 opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <CheckCircle2 size={14} className="text-accent" />
                      </div>
                      <div>
                        <div className="font-mono text-text-primary">
                          {formatNumber(Number(formatUnits(req.assets, USDC_DECIMALS)))} USDC
                        </div>
                        <div className="text-xs text-text-muted">
                          Request #{req.requestId} • {new Date(Number(req.timestamp) * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-accent font-medium">Completed</span>
                  </div>
                ))}
                {processedWithdrawals.length > 3 && (
                  <p className="text-center text-text-muted text-xs">
                    +{processedWithdrawals.length - 3} more completed
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-text-secondary">
          <strong className="text-text-primary">How it works:</strong> Enter a user address to view their pending withdrawals. 
          As the keeper, you can complete each withdrawal by clicking the &quot;Complete&quot; button. 
          This transfers USDC from the vault to the user&apos;s wallet and marks the request as claimed.
        </p>
      </div>
    </div>
  )
}
