'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { YieldChart } from '@/components/vault/YieldChart'
import { AgentList } from '@/components/vault/AgentList'
import { VaultRadar } from '@/components/vault/VaultRadar'
import { RecentActivity } from '@/components/vault/RecentActivity'
import { RealUserPosition } from '@/components/vault/RealUserPosition'
import { YieldEstimate } from '@/components/vault/YieldEstimate'
import { DepositForm } from '@/components/deposit/DepositForm'
import { WithdrawForm } from '@/components/withdraw/WithdrawForm'
import { Dialog } from '@/components/ui/Dialog'
import { ArrowDownCircle, ArrowUpCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

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

export default function DashboardPage() {
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'position' | 'estimate'>('position')

  return (
    <motion.div 
      className="min-h-screen py-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section - Compact */}
        <motion.section 
          variants={itemVariants}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-accent/5 via-surface to-surface border border-border mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />
          <div className="relative p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Live on Arbitrum Sepolia
                </div>
                <h1 className="text-xl font-bold tracking-tight hidden sm:block">
                  Your Dashboard
                </h1>
              </div>
              
              <div className="flex flex-row gap-2">
                <button
                  onClick={() => setIsDepositOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium text-sm hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  Deposit
                </button>
                <button
                  onClick={() => setIsWithdrawOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-surface border border-border text-text-primary rounded-lg font-medium text-sm hover:bg-surface-hover transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Main Content Grid */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column - User Data */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Tab Switcher */}
            <div className="bg-surface border border-border rounded-xl p-1">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('position')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'position'
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('estimate')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'estimate'
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  Yield Estimate
                </button>
              </div>
            </div>

            {activeTab === 'position' ? (
              <RealUserPosition />
            ) : (
              <YieldEstimate />
            )}
            
            {/* Link to Detailed Analytics */}
            <Link 
              href="/vault-analytics"
              className="group flex items-center justify-between p-6 rounded-2xl bg-surface border border-border hover:border-accent/30 transition-all hover:bg-surface-hover"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Capital Allocation</h3>
                  <p className="text-text-secondary text-sm">
                    View vault state, keeper health, and capital deployment
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-accent group-hover:bg-accent/10 transition-all">
                <TrendingUp className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
              </div>
            </Link>
            
            <RecentActivity />
          </motion.div>

          {/* Right Column - Charts & Agents */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <VaultRadar />
            <YieldChart mode={activeTab} />
            <AgentList />
          </motion.div>
        </motion.div>
      </div>

      {/* Deposit Modal */}
      <Dialog
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        title="Deposit USDC"
      >
        <DepositForm />
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        title="Withdraw USDC"
      >
        <WithdrawForm />
      </Dialog>
    </motion.div>
  )
}
