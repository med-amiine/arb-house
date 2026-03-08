'use client'

import { motion } from 'framer-motion'
import { VaultState } from '@/components/vault/VaultState'
import { VaultAnalytics } from '@/components/vault/VaultAnalytics'
import { VaultRadar } from '@/components/vault/VaultRadar'
import { SyncHealth } from '@/components/vault/SyncHealth'

const itemVariants = {
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

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

export default function VaultAnalyticsPage() {
  return (
    <motion.div 
      className="min-h-screen py-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-3xl font-bold">Vault Analytics</h1>
          <p className="text-text-secondary mt-1">
            Detailed metrics on vault performance and capital deployment
          </p>
        </motion.div>

        {/* Keeper Health - Prominent Display */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold">Keeper Health Monitor</h2>
                <p className="text-sm text-text-secondary">
                  Real-time sync status for agent credit vault
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-secondary">Next Sync Deadline</p>
                <p className="text-sm font-mono text-accent">12 hours</p>
              </div>
            </div>
            <SyncHealth />
            <div className="mt-3 flex items-center gap-4 text-xs text-text-secondary">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span>Healthy (&gt;50% time remaining)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-warning" />
                <span>Warning (25-50%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-danger" />
                <span>Critical (&lt;25%)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Vault State - Dominant Card */}
        <motion.section variants={itemVariants} className="mb-6">
          <VaultState />
        </motion.section>

        {/* Risk Radar - Compact */}
        <motion.section variants={itemVariants} className="mb-6">
          <VaultRadar />
        </motion.section>

        {/* Detailed Vault Analytics */}
        <motion.div variants={itemVariants}>
          <VaultAnalytics />
        </motion.div>
      </div>
    </motion.div>
  )
}
