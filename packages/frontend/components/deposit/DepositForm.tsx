'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ArrowRight, Loader2 } from 'lucide-react'
import { VAULT_ADDRESS, VAULT_ABI, USDC_ADDRESS, USDC_ABI } from '@/lib/contracts'
import { formatNumber } from '@/lib/utils'

const USDC_DECIMALS = 6

export function DepositForm() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [isApproved, setIsApproved] = useState(false)
  
  // Read USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
  
  // Read USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address },
  })
  
  // Read preview deposit
  const { data: previewShares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'previewDeposit',
    args: amount ? [parseUnits(amount, USDC_DECIMALS)] : undefined,
    query: { enabled: !!amount },
  })
  
  // Approve USDC
  const { 
    writeContract: approve,
    isPending: isApproving,
    data: approveHash 
  } = useWriteContract()
  
  // Deposit
  const { 
    writeContract: deposit,
    isPending: isDepositing,
    data: depositHash 
  } = useWriteContract()
  
  // Wait for transactions
  const { isLoading: isConfirmingApprove, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })
  const { isLoading: isConfirmingDeposit, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositHash })
  
  // Handle successful deposit
  useEffect(() => {
    if (isDepositSuccess) {
      setAmount('')
      refetchAllowance()
    }
  }, [isDepositSuccess, refetchAllowance])
  
  const parsedAmount = amount ? parseUnits(amount, USDC_DECIMALS) : BigInt(0)
  const needsApproval = allowance !== undefined && parsedAmount > (allowance as bigint)
  
  const handleApprove = () => {
    if (!amount) return
    approve({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [VAULT_ADDRESS, parseUnits(amount, USDC_DECIMALS)],
    })
  }
  
  const handleDeposit = () => {
    if (!amount) return
    deposit({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'deposit',
      args: [parseUnits(amount, USDC_DECIMALS), address],
    })
  }
  
  const setMaxAmount = () => {
    if (usdcBalance) {
      setAmount(formatUnits(usdcBalance as bigint, USDC_DECIMALS))
    }
  }
  
  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary">Connect your wallet to deposit</p>
      </div>
    )
  }
  
  const balanceFormatted = usdcBalance 
    ? formatNumber(Number(formatUnits(usdcBalance as bigint, USDC_DECIMALS)))
    : '0'
  
  return (
    <div className="space-y-6">
      {/* Amount Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">
          Amount (USDC)
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
          />
          <button
            onClick={setMaxAmount}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-accent hover:text-accent-hover font-medium"
          >
            MAX
          </button>
        </div>
        <div className="flex justify-between text-xs text-text-muted">
          <span>Balance: {balanceFormatted} USDC</span>
        </div>
      </div>
      
      {/* Preview */}
      {previewShares && amount && (
        <div className="bg-surface-hover rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">You will receive</span>
            <span className="font-mono text-text-primary">
              {formatNumber(Number(formatUnits(previewShares as bigint, USDC_DECIMALS)))} BCV
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Share price</span>
            <span className="font-mono text-text-primary">~$1.00</span>
          </div>
        </div>
      )}
      
      {/* Action Button */}
      <div className="space-y-3">
        {needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={isApproving || isConfirmingApprove || !amount}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-50"
          >
            {(isApproving || isConfirmingApprove) ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {isConfirmingApprove ? 'Confirming...' : 'Approving...'}
              </>
            ) : (
              <>Approve USDC</>
            )}
          </button>
        ) : (
          <button
            onClick={handleDeposit}
            disabled={isDepositing || isConfirmingDeposit || !amount || parseFloat(amount) <= 0}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-50"
          >
            {(isDepositing || isConfirmingDeposit) ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {isConfirmingDeposit ? 'Confirming...' : 'Depositing...'}
              </>
            ) : (
              <>
                Deposit
                <ArrowRight size={18} />
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Success Messages */}
      {depositHash && !isConfirmingDeposit && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-center">
          <p className="text-accent text-sm">Deposit successful!</p>
        </div>
      )}
    </div>
  )
}
