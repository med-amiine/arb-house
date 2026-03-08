'use client'

import { motion } from 'framer-motion'
import { OwnerDashboard } from '@/components/owner/OwnerDashboard'

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

export default function OwnerPage() {
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
          <h1 className="text-3xl font-bold">Owner Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Manage vault settings, agents, and emergency controls
          </p>
        </motion.div>

        <OwnerDashboard />
      </div>
    </motion.div>
  )
}
