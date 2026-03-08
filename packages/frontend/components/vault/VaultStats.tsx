'use client'

import { motion } from 'framer-motion'
import { useVaultData } from '@/hooks/useVault'
import { TrendingUp, Users, Wallet, Percent } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1] as const,
    }
  },
}

export function VaultStats() {
  const { sharePrice, tvl, agents, isLoading } = useVaultData()

  const stats = [
    {
      label: 'Total Value Locked',
      value: isLoading ? '...' : formatCurrency(tvl),
      change: '+2.45%', // Mock change for now
      icon: Wallet,
      trend: 'up',
    },
    {
      label: 'Share Price',
      value: isLoading ? '...' : `$${sharePrice.toFixed(4)}`,
      change: '+1.23%', // Mock change for now
      icon: TrendingUp,
      trend: 'up',
    },
    {
      label: 'Active Agents',
      value: agents ? agents.length.toString() : '0',
      change: '+0%',
      icon: Users,
      trend: 'up',
    },
    {
      label: 'Current APY',
      value: '12.5%', // Mock APY for now
      change: '+2.1%',
      icon: Percent,
      trend: 'up',
    },
  ]

  return (
    <motion.div 
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.06,
          },
        },
      }}
    >
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            variants={cardVariants}
            className="bg-surface border border-border rounded-xl p-6 hover:border-accent/50 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-secondary text-sm">{stat.label}</span>
              <div className="w-10 h-10 rounded-lg bg-surface-hover flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                <Icon className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-accent">{stat.change}</span>
                <span className="text-text-muted">vs last week</span>
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
