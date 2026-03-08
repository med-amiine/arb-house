'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ArrowRight, Loader2, Info, Clock, CheckCircle2 } from 'lucide-react'
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts'
import { useVaultData } from '@/hooks/useVault'
import { formatNumber } from '@/lib/utils'

const USDC_DECIMALS = 6

interface WithdrawalRequest {
  shares: bigint
  assets: bigint
  timestamp: bigint
  claimed: boolean
}

interface WithdrawFormProps {
  onSuccess?: (txHash: string, shares: string, assets: string, requestId: string) => void
}

export function WithdrawForm({ onSuccess }: WithdrawFormProps) {
  const { address, isConnected } = useAccount()
  const { refresh: refreshVault } = useVaultData()
  const [amount, setAmount] = useState('')

  // Read BCV balance - cached, no auto-refetch
  const { data: bcvBalance, refetch: refetchBalance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  })

  // Read preview redeem - short cache
  const { data: previewAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'previewRedeem',
    args: amount ? [parseUnits(amount, USDC_DECIMALS)] : undefined,
    query: { 
      enabled: !!amount,
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  })

  // Read user's pending assets - cached
  const { data: pendingAssets, refetch: refetchPending } = useReadContract({
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

  // Read user's withdrawal queue - cached
  const { data: withdrawalQueue, refetch: refetchQueue } = useReadContract({
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

  // Request withdraw
  const { writeContract: requestWithdraw, isPending: isRequesting, data: withdrawHash, error: withdrawError } = useWriteContract()

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: withdrawHash })

  // Handle successful request
  useEffect(() => {
    if (isConfirmed && withdrawHash) {
      console.log('Withdrawal requested:', withdrawHash)
      const sharesFormatted = amount ? formatNumber(Number(amount)) : '0'
      const assetsFormatted = previewAssets ? formatNumber(Number(formatUnits(previewAssets as bigint, USDC_DECIMALS))) : '0'
      
      // Calculate request ID (queue length after the new request)
      const currentQueueLength = withdrawalQueue ? (withdrawalQueue as WithdrawalRequest[]).length : 0
      const requestId = currentQueueLength.toString()
      
      // Match Demo.s.sol logging format
      console.log('=== WITHDRAWAL REQUEST ===')
      console.log('Requested withdrawal of:', sharesFormatted, 'BCV shares')
      console.log('Assets owed:', assetsFormatted, 'USDC')
      console.log('Request ID:', requestId)
      
      onSuccess?.(withdrawHash, sharesFormatted, assetsFormatted, requestId)
      setAmount('')
      
      // Refresh all vault data
      setTimeout(async () => {
        await refreshVault()
        await refetchBalance()
        await refetchPending()
        await refetchQueue()
      }, 2000)
    }
  }, [isConfirmed, withdrawHash, refetchBalance, refetchPending, refetchQueue, onSuccess, amount, previewAssets, withdrawalQueue])

  const handleRequestWithdraw = () => {
    if (!amount) return
    requestWithdraw({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'requestWithdraw',
      args: [parseUnits(amount, USDC_DECIMALS)],
    })
  }

  const setMaxAmount = () => {
    if (bcvBalance) {
      setAmount(formatUnits(bcvBalance as bigint, USDC_DECIMALS))
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary">Connect your wallet to withdraw</p>
      </div>
    )
  }

  const balanceFormatted = bcvBalance
    ? formatNumber(Number(formatUnits(bcvBalance as bigint, USDC_DECIMALS)))
    : '0'

  const pendingFormatted = pendingAssets
    ? formatNumber(Number(formatUnits(pendingAssets as bigint, USDC_DECIMALS)))
    : '0'

  const isProcessing = isRequesting || isConfirming

  // Filter pending (unclaimed) withdrawals
  const pendingWithdrawals = withdrawalQueue
    ? (withdrawalQueue as WithdrawalRequest[]).filter((w) => !w.claimed)
    : []

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {withdrawError && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-sm">
          <p className="text-danger font-medium">Error:</p>
          <p className="text-text-secondary">{withdrawError.message}</p>
        </div>
      )}

      {/* Pending Withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-accent" />
            <span className="font-medium text-sm">Pending Withdrawals</span>
          </div>
          <div className="space-y-2">
            {pendingWithdrawals.map((withdrawal, index) => (
              <div key={index} className="flex justify-between items-center text-sm py-2 border-b border-border/50 last:border-0">
                <div>
                  <span className="text-text-secondary">Request #{index + 1}</span>
                  <span className="text-text-muted text-xs ml-2">
                    {new Date(Number(withdrawal.timestamp) * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-medium">
                    {formatNumber(Number(formatUnits(withdrawal.assets, USDC_DECIMALS)))} USDC
                  </span>
                  <span className="text-warning text-xs ml-2">Pending</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-secondary mt-3">
            The keeper will process these withdrawals and send USDC to your wallet.
          </p>
        </div>
      )}

      {/* Total Pending */}
      {pendingAssets && (pendingAssets as bigint) > BigInt(0) && (
        <div className="bg-surface-hover rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary text-sm">Total Pending</span>
            <span className="font-mono font-medium text-accent">{pendingFormatted} USDC</span>
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">
          Amount (BCV Shares)
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="input w-full pr-20 text-lg"
            min="0"
            step="0.01"
            disabled={isProcessing}
          />
          <button
            onClick={setMaxAmount}
            disabled={isProcessing}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-accent hover:text-accent-hover font-medium disabled:opacity-50"
          >
            MAX
          </button>
        </div>
        <div className="flex justify-between text-xs text-text-muted">
          <span>Balance: {balanceFormatted} BCV</span>
        </div>
      </div>

      {/* Preview */}
      {previewAssets && amount && (
        <div className="bg-surface-hover rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">You will receive</span>
            <span className="font-mono text-text-primary">
              {formatNumber(Number(formatUnits(previewAssets as bigint, USDC_DECIMALS)))} USDC
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Current NAV</span>
            <span className="font-mono text-text-primary">~$1.0245/share</span>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="flex gap-3 bg-surface-hover rounded-lg p-4">
        <Info size={18} className="text-text-muted flex-shrink-0 mt-0.5" />
        <div className="text-sm text-text-secondary">
          <p className="mb-1"><strong className="text-text-primary">Async Withdrawal</strong></p>
          <p>Your shares will be burned immediately. USDC will be sent to your wallet once the keeper processes your request (typically within minutes).</p>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleRequestWithdraw}
        disabled={isProcessing || !amount || parseFloat(amount) <= 0}
        className="btn-secondary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-50"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            {isConfirming ? 'Confirming...' : 'Requesting...'}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Request Withdrawal
            <ArrowRight size={18} />
          </span>
        )}
      </button>

      {/* Success messages are shown outside the modal as notifications */}
    </div>
  )
}
