'use client'

import { TrendingUp, Info, Calculator, Loader2, Wallet, BarChart3 } from 'lucide-react'
import { useKeeperVault } from '@/hooks/useKeeper'
import { motion } from 'framer-motion'
import { DataSourceBadge } from '@/components/ui/LoadingState'
import { useKeeperData } from '@/hooks/useKeeper'

interface YieldChartProps {
  mode?: 'position' | 'estimate'
}

export function YieldChart({ mode = 'position' }: YieldChartProps) {
  const { yieldHistory, isLoading } = useKeeperVault()
  const { vaultState } = useKeeperData()
  
  // Calculate cumulative deposits from yield history
  const historyWithDeposits = yieldHistory.length > 0 
    ? yieldHistory.map((y, i) => ({
        ...y,
        deposits: y.deposits || (i === 0 ? 0 : yieldHistory.slice(0, i).reduce((acc, h) => acc + (h.deposits || 0), 0)),
      }))
    : [
        { date: 'Nov 15', apy: 6.2, deposits: 5000 },
        { date: 'Dec 01', apy: 7.1, deposits: 12500 },
        { date: 'Dec 15', apy: 7.8, deposits: 22500 },
        { date: 'Jan 01', apy: 8.2, deposits: 30000 },
        { date: 'Jan 15', apy: 8.5, deposits: 38000 },
        { date: 'Feb 01', apy: 8.8, deposits: 45000 },
        { date: 'Feb 15', apy: 9.1, deposits: 52000 },
        { date: 'Mar 01', apy: 9.4, deposits: 60000 },
        { date: 'Mar 08', apy: 9.78, deposits: vaultState?.tvl || 65000 },
      ]
  
  const maxDeposits = Math.max(...historyWithDeposits.map(d => d.deposits || 0))
  const maxApy = Math.max(...historyWithDeposits.map(d => d.apy || 0))
  const minApy = Math.min(...historyWithDeposits.map(d => d.apy || 0))

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-5 h-5 text-accent" />
          </motion.div>
          <span className="text-text-secondary text-sm">Loading yield data...</span>
          <DataSourceBadge source="backend" isLoading />
        </div>
        <div className="animate-pulse">
          <div className="h-6 bg-surface-hover rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-surface-hover rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {mode === 'position' ? (
              <>
                <TrendingUp className="w-5 h-5 text-accent" />
                Performance
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5 text-accent" />
                Yield Projection
              </>
            )}
          </h3>
          <p className="text-text-secondary text-sm">
            {mode === 'position' 
              ? 'APY history with deposit growth' 
              : 'Historical + Projected APY (12 months)'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-text-muted">
          <Info className="w-4 h-4" />
          <span className="text-sm">
            {mode === 'position' ? 'Real-time updates' : 'Based on 12% APY'}
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-void rounded-lg">
          <div className="flex items-center gap-2 text-text-secondary text-xs mb-1">
            <BarChart3 className="w-3 h-3" />
            Current APY
          </div>
          <div className="text-xl font-bold text-accent">
            {historyWithDeposits[historyWithDeposits.length - 1]?.apy.toFixed(2)}%
          </div>
        </div>
        <div className="p-3 bg-void rounded-lg">
          <div className="flex items-center gap-2 text-text-secondary text-xs mb-1">
            <Wallet className="w-3 h-3" />
            Total Deposits
          </div>
          <div className="text-xl font-bold text-white">
            ${(historyWithDeposits[historyWithDeposits.length - 1]?.deposits || 0).toLocaleString()}
          </div>
        </div>
        <div className="p-3 bg-void rounded-lg">
          <div className="flex items-center gap-2 text-text-secondary text-xs mb-1">
            <TrendingUp className="w-3 h-3" />
            Growth
          </div>
          <div className="text-xl font-bold text-emerald-400">
            +{((historyWithDeposits[historyWithDeposits.length - 1]?.apy || 0) - (historyWithDeposits[0]?.apy || 0)).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 relative">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="border-t border-border/30 h-0" />
          ))}
        </div>

        <div className="absolute inset-0 flex items-end gap-1">
          {historyWithDeposits.map((point, index) => {
            const isLast = index === historyWithDeposits.length - 1
            const depositHeight = ((point.deposits || 0) / (maxDeposits * 1.1)) * 70 + 10
            const apyHeight = ((point.apy - minApy * 0.8) / (maxApy - minApy * 0.8)) * 60 + 20
            
            return (
              <div
                key={index}
                className="flex-1 flex flex-col justify-end group relative"
              >
                {/* APY Line Point */}
                <div 
                  className="absolute w-full flex justify-center transition-all duration-300"
                  style={{ bottom: `${apyHeight}%` }}
                >
                  <div className={`w-2 h-2 rounded-full ${isLast ? 'bg-accent scale-125' : 'bg-accent/60'}`} />
                </div>

                {/* Deposit Bar */}
                <div
                  className={`w-full rounded-t transition-all duration-500 ${
                    isLast 
                      ? 'bg-accent/40' 
                      : 'bg-surface-hover/50 group-hover:bg-accent/20'
                  }`}
                  style={{ height: `${depositHeight}%` }}
                />

                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-void border border-border rounded-lg text-xs whitespace-nowrap z-10 transition-opacity">
                  <div className="font-medium text-accent">{point.apy.toFixed(2)}% APY</div>
                  <div className="text-text-secondary">${(point.deposits || 0).toLocaleString()} TVL</div>
                  <div className="text-text-muted text-[10px]">{point.date}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* APY Line */}
        <svg 
          className="absolute inset-0 pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="apyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#059669" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path
            d={historyWithDeposits.map((point, i) => {
              const x = (i / (historyWithDeposits.length - 1)) * 100
              const y = 100 - (((point.apy - minApy * 0.8) / (maxApy - minApy * 0.8)) * 60 + 20)
              return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`
            }).join(' ')}
            fill="none"
            stroke="url(#apyGradient)"
            strokeWidth="2"
            className="opacity-80"
          />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-text-muted">
          <span>{maxApy.toFixed(1)}% APY</span>
          <span>${(maxDeposits / 1000).toFixed(0)}K TVL</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-text-muted mt-4">
        {historyWithDeposits.filter((_, i) => i % 2 === 0 || i === historyWithDeposits.length - 1).map((point, i) => (
          <span key={i}>{point.date}</span>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-accent/40" />
          <span className="text-xs text-text-secondary">Total Value Locked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="text-xs text-text-secondary">APY %</span>
        </div>
      </div>
    </div>
  )
}
