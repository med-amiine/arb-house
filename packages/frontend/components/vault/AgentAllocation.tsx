'use client'

import { useVaultData } from '@/hooks/useVault'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { DataSourceBadge } from '@/components/ui/LoadingState'

interface Agent {
  name: string
  balance: number
  weight: number
  targetWeight: number
}

export function AgentAllocation() {
  const { agents, isLoading } = useVaultData()
  
  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="stat-label">Agent Allocation</div>
          <DataSourceBadge source="blockchain" isLoading />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-4 h-4 text-accent" />
          </motion.div>
          <span className="text-text-secondary text-xs">Loading allocations...</span>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-12 bg-surface-hover rounded"></div>
          ))}
        </div>
      </div>
    )
  }
  
  const agentData: Agent[] = agents || [
    { name: 'Agent Alpha', balance: 0, weight: 0, targetWeight: 33.33 },
    { name: 'Agent Beta', balance: 0, weight: 0, targetWeight: 33.33 },
    { name: 'Agent Gamma', balance: 0, weight: 0, targetWeight: 33.34 },
  ]
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="stat-label">Agent Allocation</div>
        <div className="text-text-muted text-xs">Target: 33/33/34</div>
      </div>
      
      <div className="space-y-4">
        {agentData.map((agent, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{agent.name}</span>
              <span className="font-mono text-text-primary">
                {formatCurrency(agent.balance)}
              </span>
            </div>
            
            <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${Math.min(agent.weight * 3, 100)}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">{formatPercent(agent.weight / 100)}</span>
              <span className="text-text-muted">Target: {formatPercent(agent.targetWeight / 100)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
