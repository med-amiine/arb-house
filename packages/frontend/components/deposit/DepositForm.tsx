'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ArrowRight, Loader2, RefreshCw, AlertTriangle, Shield, Zap } from 'lucide-react'
import { VAULT_ADDRESS, VAULT_ABI, USDC_ADDRESS, USDC_ABI } from '@/lib/contracts'
import { formatNumber } from '@/lib/utils'

const USDC_DECIMALS = 6

const TRANCHES = {
  senior: {
    name: 'Senior',
    apy: 3.96,
    description: 'Guaranteed yield',
    risk: 'Low',
    icon: Shield,
    color: 'accent',
    allocation: 'Lending strategies',
  },
  junior: {
    name: 'Junior',
    apy: 12.0,
    description: 'Open cap yield',
    risk: 'Medium',
    icon: Zap,
    color: 'warning',
    allocation: 'Full strategy mix',
  },
}

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
  {
    inputs: [],
    name: "keeper",
    outputs: [{ name: "", type: "address" }],
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
  const [tranche, setTranche] = useState<'senior' | 'junior'>('senior')
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
  
  // Read last sync time to check if vault is stale
  const { data: lastSync } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_FULL_ABI,
    functionName: 'lastSync',
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
  
  // Wait for transactions
  const { isLoading: isConfirmingApprove, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })
  const { isLoading: isConfirmingDeposit, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositHash })
  
  // Check if sync is stale (> 12 hours = 43200 seconds)
  const isSyncStale = lastSync ? (Date.now() / 1000 - Number(lastSync)) > 43200 : false
  const timeSinceSync = lastSync ? Math.floor((Date.now() / 1000 - Number(lastSync)) / 3600) : null
  
  // Handle successful deposit
  useEffect(() => {
    if (isDepositSuccess && depositHash) {
      console.log('Deposit confirmed:', depositHash)
      setAmount('')
      refetchAllowance()
      refetchBalance()
    }
  }, [isDepositSuccess, depositHash, refetchAllowance, refetchBalance])
  
  const parsedAmount = amount ? parseUnits(amount, USDC_DECIMALS) : BigInt(0)
  const needsApproval = allowance !== undefined && parsedAmount > (allowance as bigint)
  
  const selectedTranche = TRANCHES[tranche]

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
    
    // Check if sync is stale
    if (isSyncStale) {
      setValidationError('Vault balances are stale. Please wait for the keeper to sync before depositing.')
      return
    }
    
    try {
      const vaultAddr = validateAddress(VAULT_ADDRESS, 'VAULT_ADDRESS')
      
      console.log('Depositing to vault:', { vaultAddr, amount: parseUnits(amount, USDC_DECIMALS).toString(), receiver: address, tranche })
      
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
  
  const balanceFormatted = usdcBalance ? formatNumber(Number(formatUnits(usdcBalance as bigint, USDC_DECIMALS))) : '0'
  const isProcessing = isApproving || isConfirmingApprove || isDepositing || isConfirmingDeposit
  
  // Check for stale sync error
  const isStaleError = previewError?.message?.includes('StaleBalances') || 
                       depositError?.message?.includes('StaleBalances') ||
                       validationError?.includes('stale')
  
  return (
    <div className="space-y-6">
      {/* Stale Sync Warning */}
      {isSyncStale && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-warning font-medium text-sm">Vault Sync Stale</p>
              <p className="text-text-secondary text-sm mt-1">
                Last sync was {timeSinceSync} hours ago. Deposits require a sync within the last 12 hours.
                The keeper will sync automatically, or you can trigger a manual sync from the keeper service.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Stale Error Message */}
      {isStaleError && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-danger font-medium text-sm">Stale Balances</p>
              <p className="text-text-secondary text-sm mt-1">
                The vault requires a recent balance sync before deposits. Please wait for the keeper service to sync,
                or contact the administrator.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Validation Error */}
      {validationError && !isStaleError && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-sm">
          <p className="text-danger font-medium">Error:</p>
          <p className="text-text-secondary">{validationError}</p>
        </div>
      )}
      
      {/* Contract Errors */}
      {(balanceError || allowanceError || (previewError && !isStaleError) || (approveError && !isStaleError) || (depositError && !isStaleError)) && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-sm">
          <p className="text-danger font-medium">Transaction Error:</p>
          {balanceError && <p className="text-text-secondary">Balance: {balanceError.message}</p>}
          {allowanceError && <p className="text-text-secondary">Allowance: {allowanceError.message}</p>}
          {previewError && !isStaleError && <p className="text-text-secondary">Preview: {previewError.message}</p>}
          {approveError && <p className="text-text-secondary">Approve: {approveError.message}</p>}
          {depositError && !isStaleError && <p className="text-text-secondary">Deposit: {depositError.message}</p>}
        </div>
      )}
      
      {/* Tranche Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-secondary">Select Tranche</label>
        <div className="grid grid-cols-2 gap-3">
          {(['senior', 'junior'] as const).map((key) => {
            const t = TRANCHES[key]
            const Icon = t.icon
            const isSelected = tranche === key
            
            return (
              <button
                key={key}
                onClick={() => setTranche(key)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? key === 'senior'
                      ? 'bg-accent/10 border-accent/30'
                      : 'bg-warning/10 border-warning/30'
                    : 'bg-surface border-border hover:border-accent/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${key === 'senior' ? 'text-accent' : 'text-warning'}`} />
                  <span className="font-semibold text-sm">{t.name}</span>
                </div>
                <div className={`text-2xl font-bold font-mono ${key === 'senior' ? 'text-accent' : 'text-warning'}`}>
                  {t.apy.toFixed(2)}%
                </div>
                <div className="text-xs text-text-secondary mt-1">{t.description}</div>
              </button>
            )
          })}
        </div>
        
        {/* Tranche Info */}
        <div className={`p-3 rounded-lg text-sm ${
          tranche === 'senior' ? 'bg-accent/10 border border-accent/20' : 'bg-warning/10 border border-warning/20'
        }`}>
          {tranche === 'senior' ? (
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-accent font-medium">Guaranteed 3.96% APY</p>
                <p className="text-text-secondary text-xs">Principal protected • Fixed yield • Lower risk</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-warning font-medium">Up to 12% APY (variable)</p>
                <p className="text-text-secondary text-xs">Higher potential returns • Variable yield • Medium risk</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Amount Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Amount (USDC)</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setValidationError(null)
            }}
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
          <span>Min: $100</span>
        </div>
      </div>
      
      {/* Preview */}
      {previewShares && amount && !isStaleError && (
        <div className="bg-surface-hover rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Tranche</span>
            <span className="font-medium">{selectedTranche.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Expected APY</span>
            <span className={`font-mono font-medium ${tranche === 'senior' ? 'text-accent' : 'text-warning'}`}>
              {selectedTranche.apy}%
            </span>
          </div>
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
            disabled={isProcessing || !amount || parseFloat(amount) <= 0 || !!validationError || isSyncStale}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                {isConfirmingDeposit ? 'Confirming...' : 'Depositing...'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isSyncStale ? 'Vault Sync Required' : `Deposit to ${selectedTranche.name}`}
                {!isSyncStale && <ArrowRight size={18} />}
              </span>
            )}
          </button>
        )}
      </div>
      
      {/* Success Messages */}
      {isDepositSuccess && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-center">
          <p className="text-accent text-sm">Deposit completed successfully!</p>
        </div>
      )}
    </div>
  )
}
