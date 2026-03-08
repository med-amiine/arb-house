'use client'

import { useKeeperData } from '@/hooks/useKeeper'
import { TrendingUp, Users, Clock, Shield } from 'lucide-react'

export function StatsTicker() {
  const { vaultState } = useKeeperData()
  
  const stats = [
    { 
      icon: TrendingUp, 
      label: 'TVL', 
      value: `$${(vaultState?.tvl || 0).toLocaleString()}`,
      change: '+2.4%'
    },
    { 
      icon: Users, 
      label: 'Depositors', 
      value: (vaultState?.depositors || 0).toString(),
      change: '+12'
    },
    { 
      icon: Clock, 
      label: 'Last Sync', 
      value: vaultState?.last_sync ? `${Math.floor((Date.now()/1000 - vaultState.last_sync)/60)}m ago` : '--',
      change: 'Healthy'
    },
    { 
      icon: Shield, 
      label: 'Share Price', 
      value: `$${(vaultState?.share_price || 1).toFixed(4)}`,
      change: '+0.02%'
    },
    { 
      icon: TrendingUp, 
      label: 'APY', 
      value: `${(vaultState?.apy || 8.42).toFixed(2)}%`,
      change: '+0.5%'
    }
  ]
  
  // Duplicate for seamless loop
  const allStats = [...stats, ...stats]
  
  return (
    <div className="relative overflow-hidden bg-surface border-y border-border py-3">
      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
      
      <div className="flex animate-marquee whitespace-nowrap">
        {allStats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div 
              key={i}
              className="flex items-center gap-3 mx-8 px-4 py-2 rounded-full bg-void border border-border"
            >
              <Icon className="w-4 h-4 text-accent" />
              <span className="text-sm text-text-muted">{stat.label}</span>
              <span className="font-mono font-medium">{stat.value}</span>
              <span className="text-xs text-accent">{stat.change}</span>
            </div>
          )
        })}
      </div>
      
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
