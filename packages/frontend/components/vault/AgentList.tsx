'use client'

import { Bot, TrendingUp, Shield, AlertCircle } from 'lucide-react'
import { useVaultData } from '@/hooks/useVault'

export function AgentList() {
  const { agents, tvl, isLoading } = useVaultData()

  // Agent names and strategies based on deployment
  const agentInfo = [
    { name: 'Aave Agent', strategy: 'Conservative Lending', protocol: 'Aave V3', risk: 'low' },
    { name: 'Pendle Agent', strategy: 'PT Yield Holding', protocol: 'Pendle', risk: 'medium' },
    { name: 'Morpho Agent', strategy: 'Optimized Lending', protocol: 'Morpho', risk: 'low' },
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
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-accent" />
            AI Agents
          </h3>
          <p className="text-text-secondary text-sm">Your capital is managed by these strategies</p>
        </div>
      </div>

      <div className="space-y-4">
        {displayAgents.map((agent, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-void/50 border border-border hover:border-accent/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="font-semibold">{agent.name}</div>
                  <div className="text-xs text-text-muted">{agent.protocol}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-accent">${agent.balance?.toFixed(2) || '0.00'}</div>
                <div className="text-xs text-text-muted">{agent.allocation}% allocation</div>
              </div>
            </div>

            <p className="text-sm text-text-secondary mb-3">{agent.strategy}</p>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-text-muted" />
                <span className="text-text-muted">{agent.strategy}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-text-muted" />
                <span className={`capitalize ${
                  agent.risk === 'low' ? 'text-accent' : 'text-warning'
                }`}>
                  {agent.risk} risk
                </span>
              </div>

              <div className="flex items-center gap-1 ml-auto">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-accent capitalize">active</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary">
          Agents rebalance automatically based on market conditions. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  )
}
