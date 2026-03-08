'use client'

import { useVaultData } from '@/hooks/useVault'
import { TrendingUp, Shield, AlertCircle } from 'lucide-react'

export function AgentList() {
  const { agents, tvl, isLoading } = useVaultData()

  // Agent names and strategies based on deployment
  const agentInfo = [
    { name: 'Aave Lending Agent', strategy: 'Conservative Lending', protocol: 'Aave V3', risk: 'Low' },
    { name: 'Pendle Carry Agent', strategy: 'PT Yield Holding', protocol: 'Pendle', risk: 'Medium' },
    { name: 'Basis Trading Agent', strategy: 'Optimized Lending', protocol: 'Morpho', risk: 'Medium' },
  ]

  // Combine real agent data with strategy info
  const displayAgents = agents ? agents.map((agent, index) => ({
    ...agent,
    ...agentInfo[index],
    apy: 7.5 + Math.random() * 5, // Mock APY for now
    allocation: tvl > 0 ? Math.round((agent.balance / tvl) * 100) : 33,
    active: true,
  })) : []

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-hover rounded w-1/3"></div>
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
            Active Strategies
          </h3>
          <p className="text-text-secondary text-sm">Current capital allocations</p>
        </div>
      </div>

      <div className="space-y-3">
        {displayAgents.map((agent, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-void/50 border border-border hover:border-accent/30 transition-colors"
          >
            {/* Strategy Name & Allocation */}
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">{agent.name}</div>
              <div className="text-lg font-bold font-mono text-accent">
                {agent.allocation}%
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
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-accent text-sm">Active</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary">
          Strategies rebalance automatically based on market conditions. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  )
}
