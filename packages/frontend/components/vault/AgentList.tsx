'use client'

import { useVaultData, type AgentData } from '@/hooks/useVault'
import { TrendingUp, Shield, AlertCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { DataSourceBadge } from '@/components/ui/LoadingState'

interface AgentCardProps {
  agent: AgentData
}

function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className="p-4 rounded-lg bg-void/50 border border-border hover:border-accent/30 transition-colors">
      {/* Strategy Name & Allocation */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">{agent.name}</div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-text-secondary">
            APY: <span className="text-accent font-mono">{agent.apy.toFixed(1)}%</span>
          </div>
          <div className="text-lg font-bold font-mono text-accent">
            {agent.weight.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Strategy Details */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-text-muted" />
          <span className="text-text-secondary">Risk:</span>
          <span className={`font-medium ${
            agent.risk === 'Low' ? 'text-accent' : 'text-warning'
          }`}>
            {agent.risk}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-text-muted" />
          <span className="text-text-secondary">Protocol:</span>
          <span className="text-text-primary">{agent.protocol}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            agent.active ? 'bg-accent' : 'bg-text-muted'
          }`} />
          <span className={agent.active ? 'text-accent text-sm' : 'text-text-muted text-sm'}>
            {agent.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Target vs Current Allocation Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
          <span>Target: {agent.targetAllocation}%</span>
          <span>Current: {agent.weight.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-void rounded-full overflow-hidden flex">
          {/* Target allocation marker */}
          <div 
            className="h-full bg-accent/30 rounded-full"
            style={{ width: `${agent.targetAllocation}%` }}
          />
        </div>
        <div className="h-1 bg-void rounded-full overflow-hidden -mt-1.5">
          {/* Current allocation */}
          <div 
            className="h-full bg-accent rounded-full"
            style={{ width: `${Math.min(agent.weight, 100)}%` }}
          />
        </div>
      </div>

      {/* Strategy Description */}
      <p className="mt-2 text-xs text-text-secondary">
        {agent.strategy} • Balance: ${agent.balance.toLocaleString()}
      </p>
    </div>
  )
}

export function AgentList() {
  const { agents, isLoading } = useVaultData()

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
          <span className="text-text-secondary text-sm">Loading agent strategies...</span>
          <DataSourceBadge source="blockchain" isLoading />
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface-hover rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">
            Agent Strategies
          </h3>
          <p className="text-text-secondary text-sm">Current capital allocations</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-secondary">Target Allocations</p>
          <p className="text-sm font-mono text-accent">40% / 35% / 25%</p>
        </div>
      </div>

      <div className="space-y-3">
        {agents?.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary">
          Strategies rebalance automatically based on market conditions. Target allocations: 
          Aave 40%, Pendle 35%, Morpho 25%. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  )
}
