'use client'

import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts'
import { formatUnits } from 'viem'
import { formatCurrency } from '@/lib/utils'
import { Calculator, TrendingUp, Clock, Shield, Zap, AlertTriangle } from 'lucide-react'

const TRANCHES = {
  senior: {
    name: 'Senior',
    apy: 0.0396, // 3.96% guaranteed
    description: 'Guaranteed yield',
    risk: 'Low',
    icon: Shield,
    color: 'accent',
    allocation: 'Lending strategies',
  },
  junior: {
    name: 'Junior',
    apy: 0.12, // 12% variable
    description: 'Open cap yield',
    risk: 'Medium',
    icon: Zap,
    color: 'warning',
    allocation: 'Full strategy mix',
  },
}

export function YieldEstimate() {
  const { address, isConnected } = useAccount()
  const [timeframe, setTimeframe] = useState<1 | 6 | 12>(12)
  const [tranche, setTranche] = useState<'senior' | 'junior'>('senior')

  const { data: shares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

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
        <h3 className="text-lg font-semibold mb-4">Projected Yield</h3>
        <p className="text-text-secondary">Connect wallet to view projections</p>
      </div>
    )
  }

  const assetsNum = assets ? Number(formatUnits(assets as bigint, 6)) : 0
  const selectedTranche = TRANCHES[tranche]
  const apy = selectedTranche.apy
  
  const projectedValue = assetsNum * Math.pow(1 + apy, timeframe / 12)
  const yieldEarned = projectedValue - assetsNum

  return (
    <div className="card p-6 min-h-[480px] flex flex-col">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-accent" />
        Projected Yield
      </h3>

      <div className="space-y-6 flex-1 flex flex-col">
        {/* Current Deposit */}
        <div>
          <p className="text-sm text-text-secondary mb-1">Current Deposit</p>
          <p className="text-2xl font-bold font-mono">
            {formatCurrency(assetsNum)}
          </p>
        </div>

        {/* Tranche Selector - Risk Allocation */}
        <div>
          <p className="text-sm text-text-secondary mb-3">Risk Allocation</p>
          <div className="space-y-3">
            {(['senior', 'junior'] as const).map((key) => {
              const t = TRANCHES[key]
              const Icon = t.icon
              const isSelected = tranche === key
              
              return (
                <button
                  key={key}
                  onClick={() => setTranche(key)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? key === 'senior'
                        ? 'bg-accent/10 border-accent/30'
                        : 'bg-warning/10 border-warning/30'
                      : 'bg-void border-border hover:border-accent/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        key === 'senior' ? 'bg-accent/20' : 'bg-warning/20'
                      }`}>
                        <Icon className={`w-5 h-5 ${key === 'senior' ? 'text-accent' : 'text-warning'}`} />
                      </div>
                      <div>
                        <div className="font-semibold">{t.name} Tranche</div>
                        <div className="text-xs text-text-secondary">{t.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold font-mono ${key === 'senior' ? 'text-accent' : 'text-warning'}`}>
                        {(t.apy * 100).toFixed(2)}%
                      </div>
                      <div className="text-xs text-text-secondary">APY</div>
                    </div>
                  </div>
                  
                  {key === 'senior' && (
                    <div className="mt-3 pt-3 border-t border-accent/20">
                      <div className="flex items-center gap-2 text-xs text-accent">
                        <Shield className="w-3 h-3" />
                        <span>Principal protected • Fixed yield</span>
                      </div>
                    </div>
                  )}
                  
                  {key === 'junior' && (
                    <div className="mt-3 pt-3 border-t border-warning/20">
                      <div className="flex items-center gap-2 text-xs text-warning">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Higher risk • Variable returns</span>
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Timeframe Selector */}
        <div>
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

        {/* Spacer */}
        <div className="flex-1" />

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

        <p className="text-xs text-text-muted">
          * {tranche === 'senior' 
            ? 'Senior tranche offers guaranteed 3.96% APY with principal protection.' 
            : 'Junior tranche offers higher potential returns with variable yield.'}
        </p>
      </div>
    </div>
  )
}
