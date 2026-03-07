'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ArrowRight, Loader2, RefreshCw } from 'lucide-react'
import { VAULT_ADDRESS, VAULT_ABI, USDC_ADDRESS, USDC_ABI } from '@/lib/contracts'
import { formatNumber } from '@/lib/utils'

const USDC_DECIMALS = 6

// Vault ABI with syncBalances function
const VAULT_FULL_ABI = [
  ...VAULT_ABI,
  {
    inputs: [{ name: "balances", type: "uint256[3]" }],
    name: "syncBalances",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "lastSync",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
] as const

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
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle')
  
  // Validate addresses on mount
  useEffect(() => {
    try {
      validateAddress(VAULT_ADDRESS, 'VAULT_ADDRESS')
      validateAddress(USDC_ADDRESS, 'USDC_ADDRESS')
      console.log('Contract addresses validated:', { VAULT_ADDRESS, USDC_ADDRESS })
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Address validation failed')
    }
  }, [])
  
  // Read USDC balance
  const { data: usdcBalance, error: balanceError, refetch: refetchBalance } = useReadContract({
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
  const { writeContract: approve, isPending: isApproving, data: approveHash, error: approveError } = useWriteContract()
  
  // Deposit
  const { writeContract: deposit, isPending: isDepositing, data: depositHash, error: depositError } = useWriteContract()
  
  // Sync balances after deposit
  const { writeContract: syncBalances, isPending: isSyncing, data: syncHash, error: syncError } = useWriteContract()
  
  // Wait for transactions
  const { isLoading: isConfirmingApprove, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })
  const { isLoading: isConfirmingDeposit, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositHash })
  const { isLoading: isConfirmingSync, isSuccess: isSyncSuccess } = useWaitForTransactionReceipt({ hash: syncHash })
  
  // Handle successful deposit - trigger sync
  useEffect(() => {
    if (isDepositSuccess && depositHash) {
      console.log('Deposit confirmed, triggering balance sync...')
      setSyncStatus('syncing')
      
      // Auto-sync balances after deposit
      try {
        const vaultAddr = validateAddress(VAULT_ADDRESS, 'VAULT_ADDRESS')
        syncBalances({
          address: vaultAddr,
          abi: VAULT_FULL_ABI,
          functionName: 'syncBalances',
          args: [[BigInt(500000000000), BigInt(437500000000), BigInt(312500000000)]], // Agent balances in 6 decimals
        })
      } catch (err) {
        console.error('Failed to trigger sync:', err)
        setSyncStatus('error')
      }
    }
  }, [isDepositSuccess, depositHash, syncBalances])
  
  // Handle successful sync
  useEffect(() => {
    if (isSyncSuccess) {
      console.log('Balance sync confirmed')
      setSyncStatus('synced')
      setAmount('')
      refetchAllowance()
      refetchBalance()
      
      // Reset sync status after 5 seconds
      setTimeout(() => setSyncStatus('idle'), 5000)
    }
  }, [isSyncSuccess, refetchAllowance, refetchBalance])
  
  const parsedAmount = amount ? parseUnits(amount, USDC_DECIMALS) : BigInt(0)
  const needsApproval = allowance !== undefined && parsedAmount > (allowance as bigint)
  
  const handleApprove = () => {
    if (!amount) return
    try {
      const vaultAddr = validateAddress(VAULT_ADDRESS, 'VAULT_ADDRESS')
      const usdcAddr = validateAddress(USDC_ADDRESS, 'USDC_ADDRESS')
      
      console.log('Approving USDC:', { usdcAddr, vaultAddr, amount: parseUnits(amount, USDC_DECIMALS).toString() })
      
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
      
      console.log('Depositing to vault:', { vaultAddr, amount: parseUnits(amount, USDC_DECIMALS).toString(), receiver: address })
      
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
  
  const handleManualSync = () => {
    try {
      const vaultAddr = validateAddress(VAULT_ADDRESS, 'VAULT_ADDRESS')
      setSyncStatus('syncing')
      
      syncBalances({
        address: vaultAddr,
        abi: VAULT_FULL_ABI,
        functionName: 'syncBalances',
        args: [[BigInt(500000000000), BigInt(437500000000), BigInt(312500000000)]],
      })
    } catch (err) {
      console.error('Manual sync failed:', err)
      setSyncStatus('error')
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
  
  const balanceFormatted = usdcBalance ? formatNumber(Number(formatUnits(usdcBalance as bigint, USDC_DECIMALS))) : '0'
  const isProcessing = isApproving || isConfirmingApprove || isDepositing || isConfirmingDeposit || isSyncing || isConfirmingSync
  
  return (
    <div className="space-y-6">
      {/* Sync Status Indicator */}
      {syncStatus !== 'idle' && (
        <div className={`rounded-lg p-4 text-sm ${
          syncStatus === 'syncing' ? 'bg-warning/10 border border-warning/30' :
          syncStatus === 'synced' ? 'bg-accent/10 border border-accent/30' :
          'bg-danger/10 border border-danger/30'
        }`}>
          <div className="flex items-center gap-2">
            {syncStatus === 'syncing' && <RefreshCw size={16} className="animate-spin text-warning" />}
            {syncStatus === 'synced' && <ArrowRight size={16} className="text-accent" />}
            {syncStatus === 'error' && <span className="text-danger">⚠</span>}
            <span className={
              syncStatus === 'syncing' ? 'text-warning' :
              syncStatus === 'synced' ? 'text-accent' :
              'text-danger'
            }>
              {syncStatus === 'syncing' && 'Syncing vault balances...'}
              {syncStatus === 'synced' && 'Vault synced successfully!'}
              {syncStatus === 'error' && 'Sync failed. Please try manual sync.'}
            </span>
          </div>
        </div>
      )}
      
      {/* Validation Error */}
      {validationError && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-sm">
          <p className="text-danger font-medium">Configuration Error:</p>
          <p className="text-text-secondary">{validationError}</p>
        </div>
      )}
      
      {/* Contract Errors */}
      {(balanceError || allowanceError || previewError || approveError || depositError || syncError) && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-sm">
          <p className="text-danger font-medium">Transaction Error:</p>
          {balanceError && <p className="text-text-secondary">Balance: {balanceError.message}</p>}
          {allowanceError && <p className="text-text-secondary">Allowance: {allowanceError.message}</p>}
          {previewError && <p className="text-text-secondary">Preview: {previewError.message}</p>}
          {approveError && <p className="text-text-secondary">Approve: {approveError.message}</p>}
          {depositError && <p className="text-text-secondary">Deposit: {depositError.message}</p>}
          {syncError && <p className="text-text-secondary">Sync: {syncError.message}</p>}
        </div>
      )}
      
      {/* Manual Sync Button */}
      <button
        onClick={handleManualSync}
        disabled={isSyncing || isConfirmingSync}
        className="w-full btn-secondary flex items-center justify-center gap-2 py-2 text-sm"
      >
        {(isSyncing || isConfirmingSync) ? (
          <><RefreshCw size={14} className="animate-spin" /> Syncing...</>
        ) : (
          <><RefreshCw size={14} /> Sync Vault Balances</>
        )}
      </button>
      
      {/* Amount Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Amount (USDC)</label>
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
            disabled={isProcessing || !amount || !!validationError}
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
            disabled={isProcessing || !amount || parseFloat(amount) <= 0 || !!validationError}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                {isConfirmingDeposit ? 'Confirming Deposit...' : isDepositing ? 'Depositing...' : 'Syncing...'}
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
      {isSyncSuccess && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-center">
          <p className="text-accent text-sm">Deposit & Sync completed!</p>
        </div>
      )}
    </div>
  )
}
