'use client'

import { Bot, TrendingUp, Shield, AlertCircle } from 'lucide-react'

const agents = [
  {
    id: 0,
    name: 'Aave Agent',
    strategy: 'Conservative Lending',
    protocol: 'Aave V3',
    allocation: 40,
    apy: 6.2,
    risk: 'low',
    status: 'active',
    description: 'Supplies USDC to Aave to earn lending yield',
  },
  {
    id: 1,
    name: 'Pendle Agent',
    strategy: 'PT Yield Holding',
    protocol: 'Pendle',
    allocation: 35,
    apy: 9.8,
    risk: 'medium',
    status: 'active',
    description: 'Holds Pendle PT tokens for fixed yield',
  },
  {
    id: 2,
    name: 'Morpho Agent',
    strategy: 'Optimized Lending',
    protocol: 'Morpho',
    allocation: 25,
    apy: 7.5,
    risk: 'low',
    status: 'active',
    description: 'Uses Morpho for optimized peer-to-peer lending',
  },
]

export function AgentList() {
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
        {agents.map((agent) => (
          <div
            key={agent.id}
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
                <div className="text-lg font-bold text-accent">{agent.apy.toFixed(1)}% APY</div>
                <div className="text-xs text-text-muted">{agent.allocation}% allocation</div>
              </div>
            </div>

            <p className="text-sm text-text-secondary mb-3">{agent.description}</p>

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
                <span className="text-accent capitalize">{agent.status}</span>
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
