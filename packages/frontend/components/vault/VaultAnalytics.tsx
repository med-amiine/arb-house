'use client'

import { useReadContract } from 'wagmi'
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts'
import { formatUnits } from 'viem'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    }
  },
}

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

  // Idle assets in vault
  const { data: totalIdle } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalIdle',
  })

  // Get agent data
  const { data: agent0 } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'agents',
    args: [0n],
  })
  const { data: agent1 } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'agents',
    args: [1n],
  })
  const { data: agent2 } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'agents',
    args: [2n],
  })

  // Last sync time
  const { data: lastSync } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'lastSync',
  })

  if (!mounted) return null

  const tvl = totalAssets ? Number(formatUnits(totalAssets, 6)) : 0
  const shares = totalSupply ? Number(formatUnits(totalSupply, 18)) : 0
  const idle = totalIdle ? Number(formatUnits(totalIdle, 6)) : 0
  const deployed = tvl - idle
  
  const sharePrice = shares > 0 ? tvl / shares : 1

  const agents = [agent0, agent1, agent2].map((a, i) => ({
    index: i,
    balance: a ? Number(formatUnits(a[2], 6)) : 0,
    creditLimit: a ? Number(formatUnits(a[1], 6)) : 0,
    active: a ? a[3] : false,
    adapter: a ? a[0] : ''
  }))

  const timeSinceSync = lastSync 
    ? Math.floor((Date.now() / 1000 - Number(lastSync)) / 60)
    : null

  const isStale = timeSinceSync !== null && timeSinceSync > 12 * 60 // 12 hours

  return (
    <motion.div 
      className="card p-6"
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
      <h3 className="text-lg font-semibold mb-6">Vault Analytics</h3>
      
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {/* TVL */}
        <div className="p-4 bg-void rounded-lg">
          <p className="text-xs text-text-secondary mb-1">Total Value Locked</p>
          <p className="text-xl font-bold font-mono">
            ${tvl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Share Price */}
        <div className="p-4 bg-void rounded-lg">
          <p className="text-xs text-text-secondary mb-1">Share Price</p>
          <p className="text-xl font-bold font-mono">
            ${sharePrice.toFixed(4)}
          </p>
        </div>

        {/* Total Shares */}
        <div className="p-4 bg-void rounded-lg">
          <p className="text-xs text-text-secondary mb-1">Total Shares</p>
          <p className="text-xl font-bold font-mono">
            {shares.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Sync Status */}
        <div className={`p-4 rounded-lg ${isStale ? 'bg-danger/10' : 'bg-void'}`}>
          <p className="text-xs text-text-secondary mb-1">Last Sync</p>
          <p className={`text-xl font-bold font-mono ${isStale ? 'text-danger' : ''}`}>
            {timeSinceSync !== null ? `${timeSinceSync}m ago` : '--'}
          </p>
          {isStale && (
            <p className="text-xs text-danger mt-1">Sync required</p>
          )}
        </div>
      </motion.div>

      {/* Capital Deployment */}
      <motion.div variants={itemVariants} className="mb-6">
        <h4 className="text-sm font-medium mb-3">Capital Deployment</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Deployed to Agents</span>
              <span className="font-mono">${deployed.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="h-2 bg-void rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent"
                style={{ width: `${tvl > 0 ? (deployed / tvl) * 100 : 0}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Idle in Vault</span>
              <span className="font-mono">${idle.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="h-2 bg-void rounded-full overflow-hidden">
              <div 
                className="h-full bg-text-muted"
                style={{ width: `${tvl > 0 ? (idle / tvl) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Agent Allocations */}
      <motion.div variants={itemVariants}>
        <h4 className="text-sm font-medium mb-3">Agent Allocations</h4>
        <motion.div 
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1,
              },
            },
          }}
        >
          {agents.map((agent, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              className="p-3 bg-void rounded-lg"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-surface">
                    Agent {i}
                  </span>
                  <span className={`text-xs ${agent.active ? 'text-accent' : 'text-danger'}`}>
                    {agent.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <span className="font-mono text-sm">
                  ${agent.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              
              {/* Utilization bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent"
                    style={{ width: `${agent.creditLimit > 0 ? (agent.balance / agent.creditLimit) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted w-16 text-right">
                  {agent.creditLimit > 0 ? ((agent.balance / agent.creditLimit) * 100).toFixed(1) : 0}% of limit
                </span>
              </div>
              
              <p className="text-xs text-text-muted mt-1 font-mono truncate">
                {agent.adapter}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
