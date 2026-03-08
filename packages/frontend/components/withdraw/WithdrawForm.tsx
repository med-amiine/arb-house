'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ArrowRight, Loader2, Info } from 'lucide-react'
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts'
import { formatNumber } from '@/lib/utils'

const USDC_DECIMALS = 6

export function WithdrawForm() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')

  // Read BCV balance
  const { data: bcvBalance, refetch: refetchBalance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Read preview redeem
  const { data: previewAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'previewRedeem',
    args: amount ? [parseUnits(amount, USDC_DECIMALS)] : undefined,
    query: { enabled: !!amount },
  })

  // Request withdraw
  const { writeContract: requestWithdraw, isPending: isRequesting, data: withdrawHash, error: withdrawError } = useWriteContract()
  
  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: withdrawHash })
  
  // Handle successful request
  useEffect(() => {
    if (isConfirmed && withdrawHash) {
      console.log('Withdrawal requested:', withdrawHash)
      setAmount('')
      refetchBalance()
    }
  }, [isConfirmed, withdrawHash, refetchBalance])

  const handleRequestWithdraw = () => {
    if (!amount) return
    requestWithdraw({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'requestWithdraw',
      args: [parseUnits(amount, USDC_DECIMALS)],
    })
  }
  
  const handleManualSync = () => {
    setSyncStatus('syncing')
    syncBalances({
      address: VAULT_ADDRESS,
      abi: VAULT_FULL_ABI,
      functionName: 'syncBalances',
      args: [[BigInt(500000000000), BigInt(437500000000), BigInt(312500000000)]],
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
    
  const isProcessing = isRequesting || isConfirming

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {withdrawError && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-sm">
          <p className="text-danger font-medium">Error:</p>
          <p className="text-text-secondary">{withdrawError.message}</p>
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
          <p>Your shares will be burned immediately. USDC will be sent to your wallet once the keeper processes your request (typically 2-5 minutes).</p>
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

      {/* Success Message */}
      {isConfirmed && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-center">
          <p className="text-accent text-sm font-medium">Withdrawal requested!</p>
          <p className="text-text-secondary text-xs mt-1">Your request is being processed by the keeper.</p>
        </div>
      )}
    </div>
  )
}
