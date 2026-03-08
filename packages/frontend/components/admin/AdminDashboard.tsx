'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts'
import { formatUnits } from 'viem'
import { WithdrawalProcessor } from './WithdrawalProcessor'
import { 
  Shield, 
  Users, 
  Settings, 
  AlertTriangle, 
  Wallet,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react'

const cardVariants = {
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

export function AdminDashboard() {
  const { address } = useAccount()
  
  // Read vault state
  const { data: paused } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'paused',
  })
  
  const { data: keeper } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'keeper',
  })
  
  const { data: agents } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'getAgentInfo',
  })
  
  const { data: targetWeights } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'targetWeights',
  })
  
  const { data: rebalanceThreshold } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'rebalanceThreshold',
  })

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
          },
        },
      }}
    >
      {/* Top Row - Emergency, Keeper, Sync Vault */}
      <motion.div variants={cardVariants}>
        <EmergencyControls paused={paused} />
      </motion.div>
      
      <motion.div variants={cardVariants}>
        <KeeperManagement currentKeeper={keeper} />
      </motion.div>
      
      <motion.div variants={cardVariants}>
        <SyncVault />
      </motion.div>
      
      {/* Middle Row - Agent Management (spans 2) & Weight Management */}
      <motion.div variants={cardVariants} className="lg:col-span-2">
        <AgentManagement agents={agents} />
      </motion.div>
      
      <motion.div variants={cardVariants}>
        <WeightManagement 
          currentWeights={targetWeights} 
          threshold={rebalanceThreshold}
        />
      </motion.div>
      
      {/* Bottom Row - Withdrawal Processor (full width) */}
      <motion.div variants={cardVariants} className="lg:col-span-3">
        <WithdrawalProcessor />
      </motion.div>
      
      {/* Bottom Row - Rescue Tokens (full width) */}
      <motion.div variants={cardVariants} className="lg:col-span-3">
        <RescueTokens />
      </motion.div>
    </motion.div>
  )
}

// Emergency Pause/Unpause
function EmergencyControls({ paused }: { paused?: boolean }) {
  const { writeContract: pause, isPending: isPausing } = useWriteContract()
  const { writeContract: unpause, isPending: isUnpausing } = useWriteContract()
  
  const handlePause = () => {
    pause({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'pause',
    })
  }
  
  const handleUnpause = () => {
    unpause({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'unpause',
    })
  }
  
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          paused ? 'bg-danger/10' : 'bg-accent/10'
        }`}>
          <Shield className={`w-5 h-5 ${paused ? 'text-danger' : 'text-accent'}`} />
        </div>
        <div>
          <h3 className="font-semibold">Emergency Controls</h3>
          <p className="text-xs text-text-secondary">
            Status: {paused ? 'Paused' : 'Active'}
          </p>
        </div>
      </div>
      
      <p className="text-sm text-text-secondary mb-4">
        Pause the vault to prevent deposits and withdrawals during emergencies.
      </p>
      
      <div className="flex gap-3">
        <button
          onClick={handlePause}
          disabled={isPausing || paused}
          className="flex-1 py-2 px-4 bg-danger/10 text-danger rounded-lg font-medium hover:bg-danger/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isPausing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
          Pause Vault
        </button>
        <button
          onClick={handleUnpause}
          disabled={isUnpausing || !paused}
          className="flex-1 py-2 px-4 bg-accent/10 text-accent rounded-lg font-medium hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isUnpausing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Unpause Vault
        </button>
      </div>
    </div>
  )
}

// Keeper Management
function KeeperManagement({ currentKeeper }: { currentKeeper?: string }) {
  const [newKeeper, setNewKeeper] = useState('')
  const { writeContract, isPending } = useWriteContract()
  
  const handleUpdateKeeper = () => {
    if (!newKeeper) return
    writeContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'setKeeper',
      args: [newKeeper as `0x${string}`],
    })
  }
  
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold">Keeper Management</h3>
          <p className="text-xs text-text-secondary">Update keeper address</p>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-xs text-text-secondary mb-1">Current Keeper</p>
        <p className="font-mono text-sm truncate">{currentKeeper || 'Loading...'}</p>
      </div>
      
      <div className="space-y-3">
        <input
          type="text"
          value={newKeeper}
          onChange={(e) => setNewKeeper(e.target.value)}
          placeholder="0x..."
          className="input w-full text-sm"
        />
        <button
          onClick={handleUpdateKeeper}
          disabled={isPending || !newKeeper}
          className="w-full py-2 px-4 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Update Keeper
        </button>
      </div>
    </div>
  )
}

// Agent Management
function AgentManagement({ agents }: { agents?: readonly any[] }) {
  const [selectedAgent, setSelectedAgent] = useState(0)
  const [adapter, setAdapter] = useState('')
  const [creditLimit, setCreditLimit] = useState('')
  
  const { writeContract, isPending } = useWriteContract()
  
  const handleUpdateAgent = () => {
    if (!adapter || !creditLimit) return
    writeContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'updateAgent',
      args: [BigInt(selectedAgent), adapter as `0x${string}`, BigInt(creditLimit) * BigInt(1e6)],
    })
  }
  
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold">Agent Management</h3>
          <p className="text-xs text-text-secondary">Update agent adapters and limits</p>
        </div>
      </div>
      
      {/* Agent Selector */}
      <div className="flex gap-2 mb-4">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => setSelectedAgent(i)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              selectedAgent === i
                ? 'bg-accent text-white'
                : 'bg-void text-text-secondary hover:bg-surface-hover'
            }`}
          >
            Agent {i}
          </button>
        ))}
      </div>
      
      {/* Current Info */}
      {agents && agents[selectedAgent] && (
        <div className="mb-4 p-3 bg-void rounded-lg text-sm">
          <p className="text-text-secondary">Current: {agents[selectedAgent].adapter?.slice(0, 10)}...</p>
          <p className="text-text-secondary">Limit: ${(Number(agents[selectedAgent].creditLimit) / 1e6).toLocaleString()}</p>
          <p className={agents[selectedAgent].active ? 'text-accent' : 'text-danger'}>
            {agents[selectedAgent].active ? 'Active' : 'Inactive'}
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        <input
          type="text"
          value={adapter}
          onChange={(e) => setAdapter(e.target.value)}
          placeholder="New Adapter Address (0x...)"
          className="input w-full text-sm"
        />
        <input
          type="number"
          value={creditLimit}
          onChange={(e) => setCreditLimit(e.target.value)}
          placeholder="Credit Limit (USDC)"
          className="input w-full text-sm"
        />
        <button
          onClick={handleUpdateAgent}
          disabled={isPending || !adapter || !creditLimit}
          className="w-full py-2 px-4 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Update Agent
        </button>
      </div>
    </div>
  )
}

// Weight Management - FIXED LAYOUT
function WeightManagement({ 
  currentWeights, 
  threshold
}: { 
  currentWeights?: readonly number[]
  threshold?: number
}) {
  const [weights, setWeights] = useState(['', '', ''])
  const [newThreshold, setNewThreshold] = useState('')
  
  const { writeContract: setWeightsFn, isPending: isSettingWeights } = useWriteContract()
  const { writeContract: setThresholdFn, isPending: isSettingThreshold } = useWriteContract()
  
  const handleUpdateWeights = () => {
    const w = weights.map(w => parseInt(w) || 0)
    if (w.reduce((a, b) => a + b, 0) !== 10000) {
      alert('Weights must sum to 10000 (100%)')
      return
    }
    setWeightsFn({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'setWeights',
      args: [w as [number, number, number]],
    })
  }
  
  const handleUpdateThreshold = () => {
    if (!newThreshold) return
    setThresholdFn({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'setRebalanceThreshold',
      args: [parseInt(newThreshold)],
    })
  }
  
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold">Weight Management</h3>
          <p className="text-xs text-text-secondary">Rebalancing configuration</p>
        </div>
      </div>
      
      {/* Current Weights */}
      {currentWeights && (
        <div className="mb-4 p-3 bg-void rounded-lg text-sm">
          <p className="text-text-secondary">Current: {currentWeights.map(w => w/100 + '%').join(', ')}</p>
          <p className="text-text-secondary">Threshold: {Number(threshold) / 100}%</p>
        </div>
      )}
      
      {/* Update Weights - FIXED: Using grid instead of flex */}
      <div className="space-y-3 mb-6">
        <p className="text-sm font-medium">Update Target Weights</p>
        <div className="grid grid-cols-3 gap-2">
          {weights.map((w, i) => (
            <div key={i} className="flex flex-col">
              <label className="text-xs text-text-secondary mb-1">Agent {i}</label>
              <input
                type="number"
                value={w}
                onChange={(e) => {
                  const newWeights = [...weights]
                  newWeights[i] = e.target.value
                  setWeights(newWeights)
                }}
                placeholder="3333"
                className="input w-full text-sm"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted">Basis points (e.g., 3333 = 33.33%). Must sum to 10000.</p>
        <button
          onClick={handleUpdateWeights}
          disabled={isSettingWeights || weights.some(w => !w)}
          className="w-full py-2 px-4 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isSettingWeights ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Update Weights
        </button>
      </div>
      
      {/* Update Threshold */}
      <div className="space-y-3 pt-4 border-t border-border">
        <p className="text-sm font-medium">Update Rebalance Threshold</p>
        <input
          type="number"
          value={newThreshold}
          onChange={(e) => setNewThreshold(e.target.value)}
          placeholder="500 = 5%"
          className="input w-full text-sm"
        />
        <p className="text-xs text-text-muted">Basis points (e.g., 500 = 5% drift triggers rebalance)</p>
        <button
          onClick={handleUpdateThreshold}
          disabled={isSettingThreshold || !newThreshold}
          className="w-full py-2 px-4 bg-surface border border-border text-text-primary rounded-lg font-medium hover:bg-surface-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isSettingThreshold ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Update Threshold
        </button>
      </div>
    </div>
  )
}

// Sync Vault - New Component
function SyncVault() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null)
  
  const { writeContract, isPending } = useWriteContract()
  
  const handleSync = () => {
    setIsSyncing(true)
    setResult(null)
    
    writeContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'syncBalances',
      args: [[BigInt(0), BigInt(0), BigInt(0)]], // Pass current balances or zeros
    }, {
      onSuccess: () => {
        setResult({ success: true, message: 'Sync transaction submitted' })
        setIsSyncing(false)
      },
      onError: (error) => {
        setResult({ success: false, message: error.message || 'Sync failed' })
        setIsSyncing(false)
      }
    })
  }
  
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold">Sync Vault</h3>
          <p className="text-xs text-text-secondary">Trigger balance synchronization</p>
        </div>
      </div>
      
      <p className="text-sm text-text-secondary mb-4">
        Manually trigger a vault sync to update agent balances and refresh the lastSync timestamp. 
        This keeps deposits enabled (requires sync within 12 hours).
      </p>
      
      <button
        onClick={handleSync}
        disabled={isPending || isSyncing}
        className="w-full py-2 px-4 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {(isPending || isSyncing) ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {isPending ? 'Submitting...' : isSyncing ? 'Syncing...' : 'Sync Vault'}
      </button>
      
      {result && (
        <div className={`mt-3 p-2 rounded-lg text-sm ${
          result.success ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'
        }`}>
          {result.message}
        </div>
      )}
    </div>
  )
}

// Rescue Tokens
function RescueTokens() {
  const [token, setToken] = useState('')
  const [amount, setAmount] = useState('')
  
  const { writeContract, isPending } = useWriteContract()
  
  const handleRescue = () => {
    if (!token || !amount) return
    writeContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'rescue',
      args: [token as `0x${string}`, BigInt(amount)],
    })
  }
  
  return (
    <div className="card p-6 border-warning/20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Rescue Tokens</h3>
          <p className="text-xs text-text-secondary">Recover stuck tokens (excludes vault asset)</p>
        </div>
      </div>
      
      {/* Warning */}
      <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg mb-4">
        <p className="text-sm text-warning flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Emergency use only. Cannot rescue the vault's underlying asset (USDC).
        </p>
      </div>
      
      {/* Form */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token Address (0x...)"
            className="input text-sm md:col-span-2"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="input text-sm"
          />
        </div>
        
        {/* Rescue Button - Clearly under Rescue Tokens section */}
        <button
          onClick={handleRescue}
          disabled={isPending || !token || !amount}
          className="w-full py-3 px-4 bg-warning text-white rounded-lg font-medium hover:bg-warning/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
          Rescue Tokens
        </button>
      </div>
    </div>
  )
}
