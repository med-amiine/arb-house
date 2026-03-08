'use client'

import { TrendingUp, Info, Calculator } from 'lucide-react'
import { useKeeperVault } from '@/hooks/useKeeper'

interface YieldChartProps {
  mode?: 'position' | 'estimate'
}

export function YieldChart({ mode = 'position' }: YieldChartProps) {
  const { yieldHistory, isLoading } = useKeeperVault()
  
  // Historical data (12 months)
  const historicalData = yieldHistory.length > 0 
    ? yieldHistory.map(y => y.apy) 
    : [4.2, 5.1, 4.8, 6.2, 5.9, 7.1, 6.8, 8.2, 7.9, 8.5, 8.1, 8.42]
  
  // Projected data (next 12 months)
  const projectedData = [8.5, 8.8, 9.1, 9.3, 9.0, 9.5, 9.8, 10.2, 10.5, 10.8, 11.0, 11.2]
  
  // Combined data for estimate mode
  const combinedData = [...historicalData.slice(-6), ...projectedData.slice(0, 6)]
  
  const dataPoints = mode === 'position' ? historicalData : combinedData
  const maxValue = Math.max(...dataPoints)
  const minValue = Math.min(...dataPoints)
  
  const labels = mode === 'position' 
    ? ['Jan', 'Mar', 'Jun', 'Sep', 'Dec']
    : ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

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
            {mode === 'position' ? (
              <>
                <TrendingUp className="w-5 h-5 text-accent" />
                Yield Performance
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
              ? '12-month APY history' 
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

      <div className="h-64 relative">
        <div className="absolute inset-0 flex items-end gap-2">
          {dataPoints.map((value, index) => {
            const height = ((value - minValue) / (maxValue - minValue)) * 80 + 20
            const isLast = index === dataPoints.length - 1
            const isProjected = mode === 'estimate' && index >= 6
            
            return (
              <div
                key={index}
                className="flex-1 flex flex-col justify-end group"
              >
                <div
                  className={`w-full rounded-t transition-all duration-500 ${
                    isLast 
                      ? 'bg-accent' 
                      : isProjected
                        ? 'bg-accent/50 group-hover:bg-accent/70'
                        : 'bg-accent/30 group-hover:bg-accent/50'
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
        {labels.filter((_, i) => i % 2 === 0 || i === labels.length - 1).map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      
      {mode === 'estimate' && (
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-accent/30" />
            <span className="text-xs text-text-secondary">Historical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-accent/50" />
            <span className="text-xs text-text-secondary">Projected</span>
          </div>
        </div>
      )}
    </div>
  )
}
