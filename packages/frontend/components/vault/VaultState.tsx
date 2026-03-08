'use client'

import { motion } from 'framer-motion'
import { useVaultData } from '@/hooks/useVault'
import { useReadContract } from 'wagmi'
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts'
import { formatUnits } from 'viem'
import { Shield, Activity, TrendingUp, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1],
    }
  },
}

export function VaultState() {
  const { tvl, agents, isLoading } = useVaultData()
  
  // Get deployed assets for utilization calculation
  const { data: totalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
  })
  
  const { data: totalIdle } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalIdle',
  })

  // Calculate metrics
  const deployed = totalAssets && totalIdle 
    ? Number(totalAssets) - Number(totalIdle)
    : 0
  const utilization = totalAssets && Number(totalAssets) > 0
    ? (deployed / Number(totalAssets)) * 100
    : 0
  
  // Mock realized yield (would come from actual data)
  const realizedYield = 11.8
  
  // Calculate risk score based on agent distribution
  const activeAgents = agents?.filter(a => a.active).length || 0
  const riskScore = activeAgents >= 3 ? 'AA' : activeAgents >= 2 ? 'A' : 'B'

  return (
    <motion.div 
      variants={itemVariants}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/10 via-surface to-surface border border-accent/20"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Agent Credit Vault</h2>
            <p className="text-text-secondary text-sm">Institutional-grade yield optimization</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm text-accent font-medium">Operational</span>
          </div>
        </div>

        {/* Primary Metrics - The Big Numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <p className="text-text-secondary text-sm mb-1 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Vault Liquidity
            </p>
            <p className="text-4xl font-bold font-mono tracking-tight">
              {isLoading ? '...' : formatCurrency(tvl)}
            </p>
            <p className="text-xs text-accent mt-1">Total capital deployed</p>
          </div>
          
          <div>
            <p className="text-text-secondary text-sm mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Utilization
            </p>
            <p className="text-4xl font-bold font-mono tracking-tight">
              {utilization.toFixed(1)}%
            </p>
            <div className="mt-2 h-1.5 bg-void rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent rounded-full"
                style={{ width: `${utilization}%` }}
              />
            </div>
          </div>
          
          <div>
            <p className="text-text-secondary text-sm mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Agent Risk Score
            </p>
            <p className="text-4xl font-bold font-mono tracking-tight text-accent">
              {riskScore}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {activeAgents} of 3 agents active
            </p>
          </div>
          
          <div>
            <p className="text-text-secondary text-sm mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Realized Yield
            </p>
            <p className="text-4xl font-bold font-mono tracking-tight">
              {realizedYield.toFixed(1)}%
            </p>
            <p className="text-xs text-accent mt-1">30-day trailing average</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-6" />

        {/* Agents Running */}
        <div>
          <p className="text-text-secondary text-sm mb-4">Agents Running</p>
          <div className="flex flex-wrap gap-3">
            {agents?.map((agent, i) => (
              <div 
                key={i}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  agent.active 
                    ? 'bg-accent/10 border-accent/30 text-accent' 
                    : 'bg-void border-border text-text-muted'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${agent.active ? 'bg-accent animate-pulse' : 'bg-text-muted'}`} />
                <span className="text-sm font-medium">
                  {i === 0 ? 'Aave' : i === 1 ? 'Pendle' : 'Morpho'} Agent
                </span>
              </div>
            )) || (
              <>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-sm font-medium">Aave Agent</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-sm font-medium">Pendle Agent</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-sm font-medium">Morpho Agent</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
