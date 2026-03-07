'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ArrowRight, Loader2 } from 'lucide-react'
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

  // Redeem (withdraw)
  const { writeContract: redeem, isPending: isRedeeming, data: redeemHash } = useWriteContract()

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: redeemHash })
  
  // Handle successful withdrawal
  useEffect(() => {
    if (isConfirmed) {
      setAmount('')
      refetchBalance()
    }
  }, [isConfirmed, refetchBalance])

  const handleRedeem = () => {
    if (!amount || !address) return
    redeem({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'redeem',
      args: [parseUnits(amount, USDC_DECIMALS), address, address],
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

  const isProcessing = isRedeeming || isConfirming

  return (
    <div className="space-y-6">
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
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleRedeem}
        disabled={isProcessing || !amount || parseFloat(amount) <= 0}
        className="btn-secondary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-50"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            {isConfirming ? 'Confirming...' : 'Withdrawing...'}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Withdraw
            <ArrowRight size={18} />
          </span>
        )}
      </button>

      {/* Success Message */}
      {isConfirmed && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-center">
          <p className="text-accent text-sm font-medium">Withdrawal successful!</p>
        </div>
      )}
    </div>
  )
}
