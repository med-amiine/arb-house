'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useKeeperData, useUserTransactions } from '@/hooks/useKeeper'
import { useAccount } from 'wagmi'
import { formatNumber } from '@/lib/utils'
import { ArrowDownLeft, ArrowUpRight, Clock, ExternalLink, Loader2 } from 'lucide-react'
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

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const,
    }
  },
}

export default function TransactionsPage() {
  const { address } = useAccount()
  const { transactions: allTransactions, isLoading: allLoading, isUsingMockData } = useKeeperData()
  const { transactions: userTransactions, isLoading: userLoading } = useUserTransactions(address)
  
  const [showAll, setShowAll] = useState(true)
  const transactions = showAll ? allTransactions : userTransactions
  const isLoading = showAll ? allLoading : userLoading

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-5 h-5 text-accent" />
      case 'withdraw_request':
        return <ArrowUpRight className="w-5 h-5 text-warning" />
      case 'withdraw_complete':
        return <ArrowUpRight className="w-5 h-5 text-accent" />
      default:
        return <Clock className="w-5 h-5 text-text-muted" />
    }
  }

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit'
      case 'withdraw_request':
        return 'Withdraw Request'
      case 'withdraw_complete':
        return 'Withdraw Completed'
      default:
        return type
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <motion.div 
      className="min-h-screen py-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href="/"
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              Dashboard
            </Link>
            <span className="text-text-muted">/</span>
            <span className="text-sm">Transactions</span>
          </div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-text-secondary mt-2">
            View all vault activity indexed from Arbitrum Sepolia
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAll(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showAll 
                  ? 'bg-accent text-white' 
                  : 'bg-surface text-text-secondary hover:text-text-primary'
              }`}
            >
              All Transactions
            </button>
            {address && (
              <button
                onClick={() => setShowAll(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !showAll 
                    ? 'bg-accent text-white' 
                    : 'bg-surface text-text-secondary hover:text-text-primary'
                }`}
              >
                My Transactions
              </button>
            )}
          </div>
          
          {isUsingMockData && showAll && (
            <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-medium">
              DEMO DATA
            </span>
          )}
        </motion.div>

        {/* Transactions Table */}
        <motion.div variants={itemVariants} className="card overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-void animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-surface" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface rounded w-32" />
                    <div className="h-3 bg-surface rounded w-24" />
                  </div>
                  <div className="h-4 bg-surface rounded w-20" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                No transactions found
              </h3>
              <p className="text-text-secondary max-w-md mx-auto">
                {showAll 
                  ? "No transactions have been indexed yet. Transactions will appear here once the keeper indexes them from the blockchain."
                  : "You haven't made any transactions yet. Deposit USDC to get started."}
              </p>
              {!address && !showAll && (
                <p className="text-sm text-text-muted mt-4">
                  Connect your wallet to view your transactions
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="text-left p-4 text-sm font-medium text-text-secondary">Type</th>
                    <th className="text-left p-4 text-sm font-medium text-text-secondary">Amount</th>
                    <th className="text-left p-4 text-sm font-medium text-text-secondary">Shares</th>
                    <th className="text-left p-4 text-sm font-medium text-text-secondary">User</th>
                    <th className="text-left p-4 text-sm font-medium text-text-secondary">Time</th>
                    <th className="text-left p-4 text-sm font-medium text-text-secondary">Block</th>
                    <th className="text-left p-4 text-sm font-medium text-text-secondary">Tx</th>
                  </tr>
                </thead>
                <motion.tbody
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        staggerChildren: 0.03,
                        delayChildren: 0.1,
                      },
                    },
                  }}
                >
                  {transactions.map((tx) => (
                    <motion.tr 
                      key={tx.id}
                      variants={rowVariants}
                      className="border-b border-border/50 hover:bg-surface/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            ${tx.type === 'deposit' ? 'bg-accent/10' : 
                              tx.type === 'withdraw_complete' ? 'bg-accent/10' : 'bg-warning/10'}
                          `}>
                            {getActivityIcon(tx.type)}
                          </div>
                          <span className="font-medium">
                            {getActivityLabel(tx.type)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`
                          font-mono font-medium
                          ${tx.type === 'deposit' ? 'text-accent' : 'text-text-primary'}
                        `}>
                          {tx.type === 'deposit' ? '+' : '-'}
                          ${formatNumber(parseFloat(tx.amount))}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm text-text-secondary">
                          {formatNumber(parseFloat(tx.shares))} BCV
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm">
                          {tx.user.slice(0, 6)}...{tx.user.slice(-4)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-text-secondary">
                          {formatTime(tx.timestamp)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm text-text-secondary">
                          #{tx.block_number.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <a 
                          href={`https://sepolia.arbiscan.io/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-accent hover:underline flex items-center gap-1"
                        >
                          {tx.tx_hash.slice(0, 6)}...{tx.tx_hash.slice(-4)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
