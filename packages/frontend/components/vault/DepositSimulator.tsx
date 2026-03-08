'use client'

import { useState } from 'react'
import { Calculator, Info } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export function DepositSimulator() {
  const [amount, setAmount] = useState(1000)
  const [duration, setDuration] = useState(12) // months
  const apy = 8.42 // current APY
  
  // Compound interest calculation
  const projectedYield = amount * (Math.pow(1 + apy / 100, duration / 12) - 1)
  const totalValue = amount + projectedYield
  
  const scenarios = [
    { months: 1, label: '1M' },
    { months: 3, label: '3M' },
    { months: 6, label: '6M' },
    { months: 12, label: '1Y' },
    { months: 24, label: '2Y' }
  ]
  
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold">Yield Simulator</h3>
      </div>
      
      {/* Amount Input */}
      <div className="mb-6">
        <label className="text-sm text-text-secondary mb-2 block">
          Deposit Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full pl-8 pr-4 py-3 bg-void border border-border rounded-xl text-lg font-mono focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex gap-2 mt-2">
          {[100, 1000, 10000].map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              className="px-3 py-1 text-xs rounded-full bg-surface hover:bg-surface-hover transition-colors"
            >
              ${preset.toLocaleString()}
            </button>
          ))}
        </div>
      </div>
      
      {/* Duration Selector */}
      <div className="mb-6">
        <label className="text-sm text-text-secondary mb-2 block">
          Duration
        </label>
        <div className="flex gap-2">
          {scenarios.map((s) => (
            <button
              key={s.months}
              onClick={() => setDuration(s.months)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                duration === s.months
                  ? 'bg-accent text-white'
                  : 'bg-void text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Results */}
      <div className="bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 rounded-xl p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-text-secondary mb-1">Projected Yield</div>
            <div className="text-3xl font-bold text-accent font-mono">
              +${formatNumber(projectedYield)}
            </div>
            <div className="text-xs text-text-muted mt-1">
              at {apy}% APY
            </div>
          </div>
          
          <div>
            <div className="text-sm text-text-secondary mb-1">Total Value</div>
            <div className="text-3xl font-bold font-mono">
              ${formatNumber(totalValue)}
            </div>
            <div className="text-xs text-text-muted mt-1">
              after {duration} months
            </div>
          </div>
        </div>
        
        {/* Growth bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-text-muted mb-2">
            <span>Initial</span>
            <span>+{((projectedYield / amount) * 100).toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-void rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent/50 to-accent transition-all duration-500"
              style={{ width: `${(amount / totalValue) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-text-muted">Principal</span>
            <span className="text-accent">Yield</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-4 text-xs text-text-muted">
        <Info className="w-3 h-3" />
        <span>Estimates assume constant APY. Actual yields may vary.</span>
      </div>
    </div>
  )
}
