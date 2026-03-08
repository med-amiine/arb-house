'use client'

import { motion } from 'framer-motion'
import { VaultState } from '@/components/vault/VaultState'
import { VaultAnalytics } from '@/components/vault/VaultAnalytics'
import { VaultRadar } from '@/components/vault/VaultRadar'

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

        {/* Vault State with Health Bar */}
        <motion.section variants={itemVariants} className="mb-8">
          <VaultState />
        </motion.section>

        {/* Risk Radar - Signature Component */}
        <motion.section variants={itemVariants} className="mb-8">
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
