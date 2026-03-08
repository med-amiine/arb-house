'use client'

import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts'
import { formatUnits } from 'viem'
import { formatCurrency } from '@/lib/utils'
import { Calculator, TrendingUp, Clock } from 'lucide-react'

const APY_ESTIMATES = {
  conservative: 0.08,  // 8%
  moderate: 0.12,      // 12%
  optimistic: 0.18,    // 18%
}

export function YieldEstimate() {
  const { address, isConnected } = useAccount()
  const [timeframe, setTimeframe] = useState<1 | 6 | 12>(12) // months
  const [scenario, setScenario] = useState<'conservative' | 'moderate' | 'optimistic'>('moderate')

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

  if (!isConnected) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Yield Estimate</h3>
        <p className="text-text-secondary">Connect wallet to view projections</p>
      </div>
    )
  }

  const assetsNum = assets ? Number(formatUnits(assets as bigint, 6)) : 0
  const apy = APY_ESTIMATES[scenario]
  
  // Calculate projected value
  const projectedValue = assetsNum * Math.pow(1 + apy, timeframe / 12)
  const yieldEarned = projectedValue - assetsNum

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calculator className="w-5 h-5 text-accent" />
          Yield Estimate
        </h3>
      </div>

      {/* Current Deposit */}
      <div className="mb-6">
        <p className="text-sm text-text-secondary mb-1">Current Deposit</p>
        <p className="text-2xl font-bold font-mono">
          {formatCurrency(assetsNum)}
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="mb-6">
        <p className="text-sm text-text-secondary mb-2">APY Scenario</p>
        <div className="grid grid-cols-3 gap-2">
          {(['conservative', 'moderate', 'optimistic'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScenario(s)}
              className={`py-2 px-3 rounded-lg text-xs font-medium capitalize transition-all ${
                scenario === s
                  ? 'bg-accent text-white'
                  : 'bg-void text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-2">
          {(apy * 100).toFixed(0)}% APY
        </p>
      </div>

      {/* Timeframe Selector */}
      <div className="mb-6">
        <p className="text-sm text-text-secondary mb-2">Timeframe</p>
        <div className="flex gap-2">
          {[
            { value: 1, label: '1M' },
            { value: 6, label: '6M' },
            { value: 12, label: '1Y' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTimeframe(value as 1 | 6 | 12)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                timeframe === value
                  ? 'bg-accent text-white'
                  : 'bg-void text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Projected Results */}
      <div className="space-y-4 p-4 bg-void rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-sm">Projected Value</span>
          </div>
          <span className="font-mono font-bold text-lg">
            {formatCurrency(projectedValue)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-sm">Yield Earned</span>
          </div>
          <span className="font-mono font-bold text-lg text-accent">
            +{formatCurrency(yieldEarned)}
          </span>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex justify-between text-xs text-text-muted">
            <span>Return</span>
            <span className="text-accent">
              +{((yieldEarned / assetsNum) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-text-muted mt-4">
        * Estimates are based on historical APY and do not guarantee future returns.
      </p>
    </div>
  )
}
