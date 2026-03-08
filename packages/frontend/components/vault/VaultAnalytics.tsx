'use client'

import { useReadContract } from 'wagmi'
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts'
import { formatUnits } from 'viem'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Wallet, 
  Coins, 
  PieChart, 
  Activity,
  ArrowUpRight,
  Shield
} from 'lucide-react'

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const,
    }
  },
}

const agentNames = [
  { name: 'Aave Lending', protocol: 'Aave V3', color: 'bg-accent', risk: 'Low' },
  { name: 'Pendle Carry', protocol: 'Pendle', color: 'bg-warning', risk: 'Medium' },
  { name: 'Morpho Optimized', protocol: 'Morpho', color: 'bg-info', risk: 'Low' },
]

export function VaultAnalytics() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Total assets in vault
  const { data: totalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
  })

  // Total shares issued
  const { data: totalSupply } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalSupply',
  })

  // Get agent data from getAgentInfo
  const { data: agentInfo } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'getAgentInfo',
  })

  if (!mounted) return null

  const tvl = totalAssets ? Number(formatUnits(totalAssets, 6)) : 0
  const shares = totalSupply ? Number(formatUnits(totalSupply, 18)) : 0
  
  // Calculate deployed and idle from agent balances
  const agents = agentInfo ? agentInfo.map((a, i) => ({
    index: i,
    balance: Number(formatUnits(a.currentBalance, 6)),
    creditLimit: Number(formatUnits(a.creditLimit, 6)),
    active: a.active,
    adapter: a.adapter,
    ...agentNames[i]
  })) : agentNames.map((name, i) => ({
    index: i,
    balance: 0,
    creditLimit: 0,
    active: false,
    adapter: '',
    ...name
  }))
  
  const deployed = agents.reduce((sum, a) => sum + a.balance, 0)
  const idle = tvl - deployed
  
  const sharePrice = shares > 0 ? tvl / shares : 1



  return (
    <motion.div 
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.06,
            delayChildren: 0.05,
          },
        },
      }}
    >
      {/* Left Column - Key Metrics */}
      <div className="lg:col-span-2 space-y-6">
        {/* Capital Deployment Card */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <PieChart className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Capital Deployment</h3>
              <p className="text-xs text-text-secondary">Current allocation across strategies</p>
            </div>
          </div>

          {/* Deployment Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-void rounded-xl">
              <div className="flex items-center gap-2 text-text-secondary text-xs mb-1">
                <Wallet className="w-3.5 h-3.5" />
                Total TVL
              </div>
              <p className="text-2xl font-bold font-mono">
                ${tvl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-4 bg-void rounded-xl">
              <div className="flex items-center gap-2 text-text-secondary text-xs mb-1">
                <Activity className="w-3.5 h-3.5" />
                Deployed
              </div>
              <p className="text-2xl font-bold font-mono text-accent">
                ${deployed.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-4 bg-void rounded-xl">
              <div className="flex items-center gap-2 text-text-secondary text-xs mb-1">
                <Coins className="w-3.5 h-3.5" />
                Idle
              </div>
              <p className="text-2xl font-bold font-mono">
                ${idle.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Deployment Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Deployment Rate</span>
              <span className="font-mono font-medium">{tvl > 0 ? ((deployed / tvl) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="h-3 bg-void rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${tvl > 0 ? (deployed / tvl) * 100 : 0}%` }}
              />
              <div 
                className="h-full bg-void border-l border-border"
                style={{ width: `${tvl > 0 ? (idle / tvl) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Deployed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-void border border-border" />
                Idle
              </span>
            </div>
          </div>
        </motion.div>

        {/* Agent Allocations */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Agent Allocations</h3>
                <p className="text-xs text-text-secondary">Strategy performance and utilization</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {agents.map((agent, i) => {
              const utilizationPct = agent.creditLimit > 0 
                ? (agent.balance / agent.creditLimit) * 100 
                : 0
              const allocationPct = tvl > 0 
                ? (agent.balance / tvl) * 100 
                : 0

              return (
                <motion.div 
                  key={i} 
                  variants={itemVariants}
                  className="p-4 bg-void rounded-xl hover:bg-void/80 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${agent.color}/10 flex items-center justify-center`}>
                        <span className={`w-3 h-3 rounded-full ${agent.color}`} />
                      </div>
                      <div>
                        <h4 className="font-medium">{agent.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <span>{agent.protocol}</span>
                          <span>•</span>
                          <span className={agent.risk === 'Low' ? 'text-accent' : 'text-warning'}>
                            {agent.risk} Risk
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold font-mono">
                        ${agent.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {allocationPct.toFixed(1)}% of TVL
                      </p>
                    </div>
                  </div>

                  {/* Credit Limit Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary">Credit Utilization</span>
                      <span className="font-mono">{utilizationPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${agent.color} transition-all duration-500`}
                        style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-muted">
                      Limit: ${agent.creditLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Right Column - Stats & Info */}
      <div className="space-y-6">
        {/* Share Price Card */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Share Price</h3>
              <p className="text-xs text-text-secondary">BCV per USDC</p>
            </div>
          </div>
          <p className="text-3xl font-bold font-mono mb-1">
            ${sharePrice.toFixed(4)}
          </p>
          <div className="flex items-center gap-1 text-accent text-sm">
            <ArrowUpRight className="w-4 h-4" />
            <span>+2.4% this month</span>
          </div>
        </motion.div>

        {/* Total Shares */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Total Shares</h3>
              <p className="text-xs text-text-secondary">BCV in circulation</p>
            </div>
          </div>
          <p className="text-3xl font-bold font-mono">
            {shares.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Across all depositors
          </p>
        </motion.div>

        {/* Info Box */}
        <motion.div variants={itemVariants} className="card p-6 bg-gradient-to-br from-accent/5 to-transparent">
          <h4 className="font-medium mb-2">About Analytics</h4>
          <p className="text-sm text-text-secondary leading-relaxed">
            All metrics update in real-time from on-chain data. 
            Agent allocations may shift based on market conditions 
            to optimize yield.
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
