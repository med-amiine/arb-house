'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { YieldChart } from '@/components/vault/YieldChart'
import { AgentList } from '@/components/vault/AgentList'

import { RecentActivity } from '@/components/vault/RecentActivity'
import { RealUserPosition } from '@/components/vault/RealUserPosition'
import { YieldEstimate } from '@/components/vault/YieldEstimate'
import { DepositForm } from '@/components/deposit/DepositForm'
import { WithdrawForm } from '@/components/withdraw/WithdrawForm'
import { Dialog } from '@/components/ui/Dialog'
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, CheckCircle2, X } from 'lucide-react'
import Link from 'next/link'

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

interface Notification {
  id: string
  type: 'success'
  title: string
  message: string
  txHash?: string
}

export default function DashboardPage() {
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'position' | 'estimate'>('position')
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Show notification helper
  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    const newNotification = { ...notification, id }
    setNotifications(prev => [...prev, newNotification])
    
    // Remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }

  // Handle deposit success - matches Demo.s.sol logging
  const handleDepositSuccess = (txHash: string, deposited: string, shares: string, sharePrice: string) => {
    // Match Demo.s.sol console format
    console.log('=== DEPOSIT ===')
    console.log('Deposited:', deposited, 'USDC')
    console.log('Received shares:', shares, 'BCV')
    console.log('Share price:', sharePrice, 'USDC per BCV (scaled)')
    
    showNotification({
      type: 'success',
      title: '=== DEPOSIT ===',
      message: `Deposited: ${deposited} USDC\nReceived shares: ${shares} BCV\nShare price: ${sharePrice} USDC per BCV (scaled)`,
      txHash,
    })
    
    // Close modal after 4 seconds
    setTimeout(() => {
      setIsDepositOpen(false)
    }, 4000)
  }

  // Handle approval success - matches Demo.s.sol logging
  const handleApprovalSuccess = (txHash: string, amount: string) => {
    console.log('=== USDC APPROVAL ===')
    console.log('Transaction hash:', txHash)
    console.log('Approved amount:', amount, 'USDC')
    
    showNotification({
      type: 'success',
      title: '=== USDC APPROVAL ===',
      message: `Transaction hash: ${txHash.slice(0, 20)}...${txHash.slice(-8)}\nApproved amount: ${amount} USDC`,
      txHash,
    })
  }

  // Handle withdraw success - matches Demo.s.sol logging
  const handleWithdrawSuccess = (txHash: string, shares: string, assets: string, requestId: string) => {
    // Match Demo.s.sol console format
    console.log('=== WITHDRAWAL REQUEST ===')
    console.log('Requested withdrawal of:', shares, 'BCV shares')
    console.log('Assets owed:', assets, 'USDC')
    console.log('Request ID:', requestId)
    
    showNotification({
      type: 'success',
      title: '=== WITHDRAWAL REQUEST ===',
      message: `Requested withdrawal of: ${shares} BCV shares\nAssets owed: ${assets} USDC\nRequest ID: ${requestId}`,
      txHash,
    })
    
    // Close modal after 4 seconds
    setTimeout(() => {
      setIsWithdrawOpen(false)
    }, 4000)
  }

  return (
    <motion.div 
      className="min-h-screen py-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Notifications - Outside modals, fixed position */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className="bg-surface border border-accent/30 rounded-xl p-4 shadow-lg min-w-[320px] max-w-md"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-mono font-semibold text-sm text-accent">{notification.title}</h4>
                  <div className="text-text-secondary text-xs mt-1 font-mono whitespace-pre-line">
                    {notification.message}
                  </div>
                  {notification.txHash && (
                    <a
                      href={`https://sepolia.arbiscan.io/tx/${notification.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline mt-2 inline-block font-mono"
                    >
                      View on Arbiscan →
                    </a>
                  )}
                </div>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
                  Projected Yield
                </button>
              </div>
            </div>

            {activeTab === 'position' ? (
              <RealUserPosition onDepositClick={() => setIsDepositOpen(true)} />
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
        <DepositForm 
          onSuccess={handleDepositSuccess}
          onApprovalSuccess={handleApprovalSuccess}
        />
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        title="Withdraw USDC"
      >
        <WithdrawForm onSuccess={handleWithdrawSuccess} />
      </Dialog>
    </motion.div>
  )
}
