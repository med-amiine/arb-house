'use client'

import { TrendingUp, Info } from 'lucide-react'
import { useKeeperVault } from '@/hooks/useKeeper'

export function YieldChart() {
  const { yieldHistory, isLoading } = useKeeperVault()
  
  // Use API data or fallback to defaults
  const dataPoints = yieldHistory.length > 0 
    ? yieldHistory.map(y => y.apy) 
    : [4.2, 5.1, 4.8, 6.2, 5.9, 7.1, 6.8, 8.2, 7.9, 8.5, 8.1, 8.42]
  
  const maxValue = Math.max(...dataPoints)
  const minValue = Math.min(...dataPoints)

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6">
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
            <TrendingUp className="w-5 h-5 text-accent" />
            Yield Performance
          </h3>
          <p className="text-text-secondary text-sm">12-month APY history</p>
        </div>
        <div className="flex items-center gap-2 text-text-muted">
          <Info className="w-4 h-4" />
          <span className="text-sm">Real-time updates</span>
        </div>
      </div>

      <div className="h-64 relative">
        <div className="absolute inset-0 flex items-end gap-2">
          {dataPoints.map((value, index) => {
            const height = ((value - minValue) / (maxValue - minValue)) * 80 + 20
            const isLast = index === dataPoints.length - 1
            return (
              <div
                key={index}
                className="flex-1 flex flex-col justify-end group"
              >
                <div
                  className={`w-full rounded-t transition-all duration-500 ${
                    isLast ? 'bg-accent' : 'bg-accent/30 group-hover:bg-accent/50'
                  }`}
                  style={{ height: `${height}%` }}
                />
                <div className="opacity-0 group-hover:opacity-100 text-center text-xs text-text-muted mt-2 transition-opacity">
                  {value.toFixed(2)}%
                </div>
              </div>
            )
          })}
        </div>

        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-text-muted">
          <span>{maxValue.toFixed(1)}%</span>
          <span>{((maxValue + minValue) / 2).toFixed(1)}%</span>
          <span>{minValue.toFixed(1)}%</span>
        </div>
      </div>

      <div className="flex justify-between text-xs text-text-muted mt-4">
        <span>Jan</span>
        <span>Mar</span>
        <span>Jun</span>
        <span>Sep</span>
        <span>Dec</span>
      </div>
    </div>
  )
}
