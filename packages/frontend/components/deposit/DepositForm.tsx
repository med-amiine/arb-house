'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ArrowRight, Loader2 } from 'lucide-react'
import { VAULT_ADDRESS, VAULT_ABI, USDC_ADDRESS, USDC_ABI } from '@/lib/contracts'
import { formatNumber } from '@/lib/utils'

const USDC_DECIMALS = 6

// Validate contract addresses
const validateAddress = (addr: string, name: string): `0x${string}` => {
  if (!addr || addr === 'undefined' || addr === 'null') {
    throw new Error(`${name} is not defined`)
  }
  if (!addr.startsWith('0x') || addr.length !== 42) {
    throw new Error(`${name} is invalid: ${addr}`)
  }
  return addr as `0x${string}`
}

export function DepositForm() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  
  // Validate addresses on mount
  useEffect(() => {
    try {
      validateAddress(VAULT_ADDRESS, 'VAULT_ADDRESS')
      validateAddress(USDC_ADDRESS, 'USDC_ADDRESS')
      console.log('Contract addresses validated:', {
        VAULT_ADDRESS,
        USDC_ADDRESS,
      })
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Address validation failed')
    }
  }, [])
  
  // Read USDC balance
  const { data: usdcBalance, error: balanceError } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
  
  // Read USDC allowance
  const { data: allowance, refetch: refetchAllowance, error: allowanceError } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address && !!VAULT_ADDRESS },
  })
  
  // Read preview deposit
  const { data: previewShares, error: previewError } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'previewDeposit',
    args: amount ? [parseUnits(amount, USDC_DECIMALS)] : undefined,
    query: { enabled: !!amount && !!VAULT_ADDRESS },
  })
  
  // Approve USDC
  const { 
    writeContract: approve,
    isPending: isApproving,
    data: approveHash,
    error: approveError 
  } = useWriteContract()
  
  // Deposit
  const { 
    writeContract: deposit,
    isPending: isDepositing,
    data: depositHash,
    error: depositError 
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
    
    try {
      const vaultAddr = validateAddress(VAULT_ADDRESS, 'VAULT_ADDRESS')
      const usdcAddr = validateAddress(USDC_ADDRESS, 'USDC_ADDRESS')
      
      console.log('Approving USDC:', {
        usdcAddr,
        vaultAddr,
        amount: parseUnits(amount, USDC_DECIMALS).toString(),
      })
      
      approve({
        address: usdcAddr,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [vaultAddr, parseUnits(amount, USDC_DECIMALS)],
      })
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Approval failed')
    }
  }
  
  const handleDeposit = () => {
    if (!amount || !address) return
    
    try {
      const vaultAddr = validateAddress(VAULT_ADDRESS, 'VAULT_ADDRESS')
      
      console.log('Depositing to vault:', {
        vaultAddr,
        amount: parseUnits(amount, USDC_DECIMALS).toString(),
        receiver: address,
      })
      
      deposit({
        address: vaultAddr,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [parseUnits(amount, USDC_DECIMALS), address],
      })
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Deposit failed')
    }
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
      {/* Validation Error */}
      {validationError && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-sm">
          <p className="text-danger font-medium">Configuration Error:</p>
          <p className="text-text-secondary">{validationError}</p>
        </div>
      )}
      
      {/* Contract Errors */}
      {(balanceError || allowanceError || previewError || approveError || depositError) && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-sm">
          <p className="text-danger font-medium">Transaction Error:</p>
          {balanceError && <p className="text-text-secondary">Balance: {balanceError.message}</p>}
          {allowanceError && <p className="text-text-secondary">Allowance: {allowanceError.message}</p>}
          {previewError && <p className="text-text-secondary">Preview: {previewError.message}</p>}
          {approveError && <p className="text-text-secondary">Approve: {approveError.message}</p>}
          {depositError && <p className="text-text-secondary">Deposit: {depositError.message}</p>}
        </div>
      )}
      
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
            disabled={isApproving || isConfirmingApprove || !amount || !!validationError}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-50"
          >
            {(isApproving || isConfirmingApprove) ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                {isConfirmingApprove ? 'Confirming...' : 'Approving...'}
              </span>
            ) : (
              <span>Approve USDC</span>
            )}
          </button>
        ) : (
          <button
            onClick={handleDeposit}
            disabled={isDepositing || isConfirmingDeposit || !amount || parseFloat(amount) <= 0 || !!validationError}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-50"
          >
            {(isDepositing || isConfirmingDeposit) ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                {isConfirmingDeposit ? 'Confirming...' : 'Depositing...'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Deposit
                <ArrowRight size={18} />
              </span>
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
