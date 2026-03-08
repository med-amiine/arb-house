'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

export function YieldFlow() {
  const [particles, setParticles] = useState<number[]>([])
  const [totalYield, setTotalYield] = useState(0)
  
  // Generate yield particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => [...prev.slice(-20), Date.now()])
      setTotalYield(prev => prev + Math.random() * 0.01)
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="card p-6 overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Live Yield Generation</h3>
              <p className="text-sm text-text-muted">Real-time accrual from agents</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-accent font-mono">
              +{totalYield.toFixed(4)} USDC
            </div>
            <div className="text-xs text-text-muted">this session</div>
          </div>
        </div>
        
        {/* Flow visualization */}
        <div className="relative h-32 bg-void rounded-xl overflow-hidden">
          {/* Agent nodes */}
          {[
            { name: 'Aave', x: 15, color: '#B6509E' },
            { name: 'Pendle', x: 50, color: '#6C5DD3' },
            { name: 'Morpho', x: 85, color: '#00D4AA' }
          ].map((agent) => (
            <div
              key={agent.name}
              className="absolute top-1/2 w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ 
                left: `${agent.x}%`,
                backgroundColor: `${agent.color}20`,
                border: `2px solid ${agent.color}`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {agent.name[0]}
            </div>
          ))}
          
          {/* Flowing particles */}
          {particles.map((id, i) => (
            <div
              key={id}
              className="absolute top-1/2 w-2 h-2 rounded-full bg-accent animate-flow"
              style={{ 
                left: '15%',
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
          
          {/* Vault destination */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
            <span className="text-lg">🏦</span>
          </div>
          
          {/* Flow lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#B6509E" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#6C5DD3" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00D4AA" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path
              d="M 40 64 Q 150 30, 260 64"
              fill="none"
              stroke="url(#flow-gradient)"
              strokeWidth="2"
              strokeDasharray="5,5"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="20"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          </svg>
        </div>
        
        {/* APY indicators */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            { protocol: 'Aave', apy: 6.2, color: '#B6509E' },
            { protocol: 'Pendle', apy: 9.8, color: '#6C5DD3' },
            { protocol: 'Morpho', apy: 7.5, color: '#00D4AA' }
          ].map((item) => (
            <div key={item.protocol} className="text-center p-3 rounded-lg bg-void">
              <div className="text-xs text-text-muted mb-1">{item.protocol}</div>
              <div 
                className="text-lg font-bold"
                style={{ color: item.color }}
              >
                {item.apy}%
              </div>
              <div className="text-xs text-text-muted">APY</div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes flow {
          0% {
            transform: translate(0, -50%) scale(0.5);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translate(50px, -50%) scale(1);
          }
          60% {
            opacity: 1;
            transform: translate(150px, -50%) scale(1);
          }
          100% {
            transform: translate(300px, -50%) scale(0.5);
            opacity: 0;
          }
        }
        .animate-flow {
          animation: flow 3s ease-in-out forwards;
        }
      `}</style>
    </div>
  )
}
