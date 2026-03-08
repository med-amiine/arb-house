'use client'

import { useAccount, useReadContract } from 'wagmi'
import { VAULT_ADDRESS, VAULT_ABI, USDC_ADDRESS, USDC_ABI } from '@/lib/contracts'
import { formatUnits } from 'viem'
import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

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

  // If user has no position, show onboarding panel
  if (totalValue === 0) {
    return (
      <div className="card p-6 min-h-[480px] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-accent" />
          </div>
          
          <h3 className="text-2xl font-bold mb-3">
            Deposit USDC
          </h3>
          
          <p className="text-text-secondary mb-6 max-w-xs">
            Start earning yield from AI-driven credit vaults
          </p>

          <div className="space-y-3 w-full max-w-xs mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Expected yield</span>
              <span className="font-semibold text-accent">8–12%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Minimum deposit</span>
              <span className="font-semibold">$100</span>
            </div>
          </div>

          <Link
            href="/deposit"
            className="group flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-all hover:scale-105"
          >
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 min-h-[480px] flex flex-col">
      <h3 className="text-lg font-semibold mb-6">Vault Overview</h3>
      
      <div className="space-y-6 flex-1">
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

        {/* Spacer to push withdrawal history to bottom */}
        <div className="flex-1" />

        {/* Pending withdrawals list - shown at bottom if exists */}
        {withdrawals && withdrawals.length > 0 && (
          <div className="pt-4 border-t border-border max-h-32 overflow-y-auto">
            <p className="text-sm font-medium mb-2">Withdrawal History</p>
            <div className="space-y-2">
              {withdrawals.slice(0, 3).map((w, i) => (
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
