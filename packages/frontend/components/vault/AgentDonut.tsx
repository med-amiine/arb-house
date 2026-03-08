'use client'

import { useKeeperData } from '@/hooks/useKeeper'

export function AgentDonut() {
  const { vaultState, isLoading } = useKeeperData()
  const balances = vaultState?.agent_balances || [0, 0, 0]
  const total = balances.reduce((a, b) => a + b, 0)
  
  const agents = [
    { name: 'Aave', color: '#B6509E', icon: '🏦' },
    { name: 'Pendle', color: '#6C5DD3', icon: '⚡' },
    { name: 'Morpho', color: '#00D4AA', icon: '🌊' }
  ]
  
  // Calculate segments
  let cumulativePercent = 0
  const segments = balances.map((balance, i) => {
    const percent = total > 0 ? (balance / total) * 100 : 33.33
    const startAngle = (cumulativePercent / 100) * 360
    cumulativePercent += percent
    const endAngle = (cumulativePercent / 100) * 360
    
    return {
      ...agents[i],
      balance,
      percent,
      startAngle,
      endAngle
    }
  })
  
  // Create SVG arc path
  const createArc = (start: number, end: number, radius: number) => {
    const startRad = (start - 90) * (Math.PI / 180)
    const endRad = (end - 90) * (Math.PI / 180)
    
    const x1 = 50 + radius * Math.cos(startRad)
    const y1 = 50 + radius * Math.sin(startRad)
    const x2 = 50 + radius * Math.cos(endRad)
    const y2 = 50 + radius * Math.sin(endRad)
    
    const largeArc = end - start > 180 ? 1 : 0
    
    return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
  }
  
  if (isLoading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-48 bg-surface rounded-xl" />
      </div>
    )
  }
  
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4">Capital Allocation</h3>
      
      <div className="flex items-center gap-8">
        {/* Donut Chart */}
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {segments.map((seg, i) => (
              <path
                key={i}
                d={createArc(seg.startAngle, seg.endAngle, 40)}
                fill={seg.color}
                className="hover:opacity-80 transition-opacity cursor-pointer animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
            {/* Center hole */}
            <circle cx="50" cy="50" r="25" fill="#0A0A0A" />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{Math.round(total).toLocaleString()}</span>
            <span className="text-xs text-text-muted">USDC</span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex-1 space-y-3">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg bg-void hover:bg-surface-hover transition-colors animate-slide-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-lg">{seg.icon}</span>
                <span className="font-medium">{seg.name}</span>
              </div>
              <div className="text-right">
                <div className="font-mono font-medium">
                  ${seg.balance.toLocaleString()}
                </div>
                <div className="text-xs text-text-muted">
                  {seg.percent.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
