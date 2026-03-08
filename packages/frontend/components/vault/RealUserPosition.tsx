'use client'

import { useAccount, useReadContract } from 'wagmi'
import { VAULT_ADDRESS, VAULT_ABI, USDC_ADDRESS, USDC_ABI } from '@/lib/contracts'
import { formatUnits } from 'viem'
import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface UserPosition {
  shares: bigint
  assets: bigint
  usdcBalance: bigint
  pendingWithdrawals: {
    shares: bigint
    assets: bigint
    timestamp: bigint
    claimed: boolean
  }[]
}

export function RealUserPosition() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)


  useEffect(() => {
    setMounted(true)
  }, [])

  // Get user's BCV shares
  const { data: shares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Convert shares to assets
  const { data: assets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'convertToAssets',
    args: shares ? [shares] : undefined,
    query: { enabled: !!shares }
  })

  // Get user's USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Get pending withdrawals
  const { data: withdrawals } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'getUserWithdrawals',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  if (!mounted || !isConnected) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Your Position</h3>
        <p className="text-text-secondary">Connect wallet to view</p>
      </div>
    )
  }

  const sharesNum = shares ? Number(formatUnits(shares, 18)) : 0
  const assetsNum = assets ? Number(formatUnits(assets, 6)) : 0
  const usdcNum = usdcBalance ? Number(formatUnits(usdcBalance, 6)) : 0
  
  const pendingAssets = withdrawals?.reduce((sum, w) => 
    !w.claimed ? sum + Number(formatUnits(w.assets, 6)) : sum, 0
  ) || 0

  const totalValue = assetsNum + usdcNum + pendingAssets

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-6">Your Position</h3>
      
      <div className="space-y-6">
        {/* Total Value */}
        <div>
          <p className="text-sm text-text-secondary mb-1">Total Value</p>
          <p className="text-3xl font-bold font-mono">
            {formatCurrency(totalValue)}
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-void rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-sm">Vault Deposits</span>
            </div>
            <span className="font-mono font-medium">
              {formatCurrency(assetsNum)}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-void rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-sm">Pending Withdrawals</span>
            </div>
            <span className="font-mono font-medium">
              {formatCurrency(pendingAssets)}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-void rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-text-muted" />
              <span className="text-sm">Wallet USDC</span>
            </div>
            <span className="font-mono font-medium">
              {formatCurrency(usdcNum)}
            </span>
          </div>
        </div>

        {/* Shares info */}
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Your Shares</span>
            <span className="font-mono">{`${sharesNum.toLocaleString(undefined, { maximumFractionDigits: 4 })} BCV`}</span>
          </div>
        </div>

        {/* Pending withdrawals list */}
        {withdrawals && withdrawals.length > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-medium mb-3">Withdrawal History</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {withdrawals.map((w, i) => (
                <div key={i} className="flex justify-between items-center text-sm p-2 bg-void rounded">
                  <div>
                    <span className={w.claimed ? 'text-accent' : 'text-warning'}>
                      {w.claimed ? '✓ Completed' : '⏳ Pending'}
                    </span>
                    <span className="text-text-muted ml-2 text-xs">
                      {new Date(Number(w.timestamp) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="font-mono">
                    {formatCurrency(Number(formatUnits(w.assets, 6)))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
