'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts'
import { formatUnits } from 'viem'
import { 
  Shield, 
  Users, 
  Settings, 
  AlertTriangle, 
  Wallet,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react'

const cardVariants = {
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
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
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
      {/* Emergency Controls */}
      <motion.div variants={cardVariants}>
        <EmergencyControls paused={paused} />
      </motion.div>
      
      {/* Keeper Management */}
      <motion.div variants={cardVariants}>
        <KeeperManagement currentKeeper={keeper} />
      </motion.div>
      
      {/* Agent Management */}
      <motion.div variants={cardVariants}>
        <AgentManagement agents={agents} />
      </motion.div>
      
      {/* Weight Management - Fixed Layout */}
      <motion.div variants={cardVariants}>
        <WeightManagement 
          currentWeights={targetWeights} 
          threshold={rebalanceThreshold}
        />
      </motion.div>
      
      {/* Rescue Tokens */}
      <motion.div variants={cardVariants} className="lg:col-span-2">
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
      args: [newKeeper],
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
function AgentManagement({ agents }: { agents?: any[] }) {
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
      args: [BigInt(selectedAgent), adapter, BigInt(creditLimit) * BigInt(1e6)],
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
  currentWeights?: number[]
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
      args: [w],
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
      args: [token, BigInt(amount)],
    })
  }
  
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold">Rescue Tokens</h3>
          <p className="text-xs text-text-secondary">Recover stuck tokens (excludes vault asset)</p>
        </div>
      </div>
      
      <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg mb-4">
        <p className="text-sm text-warning flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          This is for emergency use only. Cannot rescue the vault's underlying asset.
        </p>
      </div>
      
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
      <button
        onClick={handleRescue}
        disabled={isPending || !token || !amount}
        className="mt-3 w-full py-2 px-4 bg-warning/10 text-warning border border-warning/30 rounded-lg font-medium hover:bg-warning/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Rescue Tokens
      </button>
    </div>
  )
}
