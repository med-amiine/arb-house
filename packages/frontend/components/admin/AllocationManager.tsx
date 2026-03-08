'use client'

import { useState, useMemo } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { 
  Wallet, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Scale
} from 'lucide-react'
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts'
import { AGENTS_CONFIG } from '@/lib/agents'
import { formatNumber } from '@/lib/utils'

const USDC_DECIMALS = 6

export function AllocationManager() {
  const { address } = useAccount()
  const [allocations, setAllocations] = useState(['', '', ''])
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto')

  // Read vault state
  const { data: totalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
    query: {
      staleTime: 5 * 60 * 1000,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  })

  const { data: totalIdle } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalIdle',
    query: {
      staleTime: 5 * 60 * 1000,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  })

  const { data: agents } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'getAgentInfo',
    query: {
      staleTime: 5 * 60 * 1000,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  })

  const { data: targetWeights } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'targetWeights',
    query: {
      staleTime: 5 * 60 * 1000,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  })

  const { data: shouldRebalance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'shouldRebalance',
    query: {
      staleTime: 30 * 1000,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  })

  const { data: keeper } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'keeper',
  })

  // Write functions
  const { writeContract: allocate, isPending: isAllocating, data: allocateHash } = useWriteContract()
  const { writeContract: rebalance, isPending: isRebalancing, data: rebalanceHash } = useWriteContract()

  // Wait for transactions
  const { isLoading: isConfirmingAllocate, isSuccess: isAllocateSuccess } = useWaitForTransactionReceipt({ hash: allocateHash })
  const { isLoading: isConfirmingRebalance, isSuccess: isRebalanceSuccess } = useWaitForTransactionReceipt({ hash: rebalanceHash })

  const isKeeper = address && keeper && address.toLowerCase() === (keeper as string).toLowerCase()

  // Calculate values
  const tvl = totalAssets ? Number(formatUnits(totalAssets, USDC_DECIMALS)) : 0
  const idle = totalIdle ? Number(formatUnits(totalIdle, USDC_DECIMALS)) : 0
  const deployed = tvl - idle

  const agentData = useMemo(() => {
    if (!agents) return []
    return agents.map((agent, i) => {
      const balance = Number(formatUnits(agent.currentBalance, USDC_DECIMALS))
      const targetWeight = targetWeights ? Number(targetWeights[i]) / 100 : AGENTS_CONFIG[i]?.targetAllocation || 33.33
      const targetAmount = (tvl * targetWeight) / 100
      const diff = targetAmount - balance
      return {
        index: i,
        name: AGENTS_CONFIG[i]?.name || `Agent ${i}`,
        protocol: AGENTS_CONFIG[i]?.protocol || 'Unknown',
        balance,
        targetWeight,
        targetAmount,
        diff,
        creditLimit: Number(formatUnits(agent.creditLimit, USDC_DECIMALS)),
        active: agent.active,
      }
    })
  }, [agents, targetWeights, tvl])

  // Calculate optimal allocation of idle funds
  const optimalAllocations = useMemo(() => {
    if (!agentData.length || idle <= 0) return [0, 0, 0]
    
    let remainingIdle = idle
    const allocations = [0, 0, 0]
    
    // First pass: allocate to agents below target
    agentData.forEach((agent, i) => {
      if (agent.diff > 0 && remainingIdle > 0) {
        const allocateAmount = Math.min(agent.diff, remainingIdle)
        allocations[i] = allocateAmount
        remainingIdle -= allocateAmount
      }
    })
    
    return allocations
  }, [agentData, idle])

  const handleAutoAllocate = () => {
    if (!isKeeper) return
    const allocationAmounts = optimalAllocations.map(a => parseUnits(a.toFixed(6), USDC_DECIMALS))
    allocate({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'allocateToAgents',
      args: [allocationAmounts as [bigint, bigint, bigint]],
    })
  }

  const handleManualAllocate = () => {
    if (!isKeeper) return
    const allocationAmounts = allocations.map(a => parseUnits(a || '0', USDC_DECIMALS))
    allocate({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'allocateToAgents',
      args: [allocationAmounts as [bigint, bigint, bigint]],
    })
  }

  const handleRebalance = () => {
    if (!isKeeper) return
    rebalance({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'rebalance',
    })
  }

  const isProcessing = isAllocating || isConfirmingAllocate || isRebalancing || isConfirmingRebalance

  return (
    <div className="card p-6 border-accent/20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Scale className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Allocation Manager</h3>
          <p className="text-xs text-text-secondary">Allocate idle funds to agents (Keeper only)</p>
        </div>
      </div>

      {/* Keeper Status */}
      <div className={`p-3 rounded-lg mb-4 ${isKeeper ? 'bg-accent/10 border border-accent/20' : 'bg-warning/10 border border-warning/30'}`}>
        <div className="flex items-center gap-2">
          {isKeeper ? <CheckCircle2 className="w-4 h-4 text-accent" /> : <AlertTriangle className="w-4 h-4 text-warning" />}
          <span className={`text-sm font-medium ${isKeeper ? 'text-accent' : 'text-warning'}`}>
            {isKeeper ? 'You are the keeper' : 'Not the keeper'}
          </span>
        </div>
      </div>

      {/* Vault Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-xs text-text-secondary">Total TVL</p>
          <p className="font-mono font-medium">${formatNumber(tvl)}</p>
        </div>
        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-xs text-text-secondary">Idle Funds</p>
          <p className="font-mono font-medium text-accent">${formatNumber(idle)}</p>
        </div>
        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-xs text-text-secondary">Deployed</p>
          <p className="font-mono font-medium">${formatNumber(deployed)}</p>
        </div>
      </div>

      {/* Rebalance Status */}
      <div className={`p-3 rounded-lg mb-6 ${shouldRebalance ? 'bg-warning/10 border border-warning/30' : 'bg-accent/10 border border-accent/20'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {shouldRebalance ? <AlertTriangle className="w-4 h-4 text-warning" /> : <CheckCircle2 className="w-4 h-4 text-accent" />}
            <span className={`text-sm font-medium ${shouldRebalance ? 'text-warning' : 'text-accent'}`}>
              {shouldRebalance ? 'Rebalance Recommended' : 'Allocation Balanced'}
            </span>
          </div>
          <button
            onClick={handleRebalance}
            disabled={isProcessing || !isKeeper}
            className="px-3 py-1.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isRebalancing || isConfirmingRebalance ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Rebalance
          </button>
        </div>
      </div>

      {/* Agent Allocations */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-text-secondary">Agent Status</h4>
        {agentData.map((agent) => (
          <div key={agent.index} className="bg-surface-hover rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-medium">{agent.name}</span>
                <span className="text-xs text-text-secondary ml-2">({agent.protocol})</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${agent.active ? 'bg-accent/20 text-accent' : 'bg-text-muted/20 text-text-muted'}`}>
                {agent.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-text-secondary">Current</p>
                <p className="font-mono">${formatNumber(agent.balance)}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Target ({agent.targetWeight.toFixed(0)}%)</p>
                <p className="font-mono">${formatNumber(agent.targetAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Diff</p>
                <p className={`font-mono ${agent.diff > 0 ? 'text-accent' : agent.diff < 0 ? 'text-warning' : ''}`}>
                  {agent.diff > 0 ? '+' : ''}{formatNumber(agent.diff)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Allocation Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('auto')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'auto'
              ? 'bg-accent text-white'
              : 'bg-void text-text-secondary hover:bg-surface-hover'
          }`}
        >
          Auto Allocate
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'manual'
              ? 'bg-accent text-white'
              : 'bg-void text-text-secondary hover:bg-surface-hover'
          }`}
        >
          Manual Allocate
        </button>
      </div>

      {/* Auto Allocate */}
      {activeTab === 'auto' && (
        <div className="space-y-4">
          <div className="bg-surface-hover rounded-lg p-4">
            <p className="text-sm text-text-secondary mb-3">Optimal allocation based on target weights:</p>
            <div className="space-y-2">
              {agentData.map((agent, i) => (
                <div key={agent.index} className="flex justify-between text-sm">
                  <span>{agent.name}</span>
                  <span className="font-mono">
                    {optimalAllocations[i] > 0 ? `+${formatNumber(optimalAllocations[i])} USDC` : '0 USDC'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex justify-between text-sm font-medium">
                <span>Total to Allocate</span>
                <span className="font-mono text-accent">
                  {formatNumber(optimalAllocations.reduce((a, b) => a + b, 0))} USDC
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleAutoAllocate}
            disabled={isProcessing || !isKeeper || optimalAllocations.every(a => a === 0)}
            className="w-full py-3 px-4 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isAllocating || isConfirmingAllocate ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            {isAllocating ? 'Submitting...' : isConfirmingAllocate ? 'Confirming...' : 'Allocate Idle Funds'}
          </button>
        </div>
      )}

      {/* Manual Allocate */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {agentData.map((agent, i) => (
              <div key={agent.index}>
                <label className="text-xs text-text-secondary mb-1 block">
                  {agent.name} (Max: ${formatNumber(agent.creditLimit)})
                </label>
                <input
                  type="number"
                  value={allocations[i]}
                  onChange={(e) => {
                    const newAllocations = [...allocations]
                    newAllocations[i] = e.target.value
                    setAllocations(newAllocations)
                  }}
                  placeholder="0.00"
                  className="input w-full text-sm"
                  disabled={isProcessing}
                />
              </div>
            ))}
          </div>
          
          <div className="flex justify-between text-sm bg-surface-hover rounded-lg p-3">
            <span className="text-text-secondary">Total Allocation</span>
            <span className="font-mono">
              {formatNumber(allocations.reduce((a, b) => a + (parseFloat(b) || 0), 0))} USDC
            </span>
          </div>
          
          <button
            onClick={handleManualAllocate}
            disabled={isProcessing || !isKeeper || allocations.every(a => !a)}
            className="w-full py-3 px-4 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isAllocating || isConfirmingAllocate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            {isAllocating ? 'Submitting...' : isConfirmingAllocate ? 'Confirming...' : 'Allocate Manual Amounts'}
          </button>
        </div>
      )}

      {/* Success Message */}
      {(isAllocateSuccess || isRebalanceSuccess) && (
        <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">
              {isAllocateSuccess ? 'Allocation completed!' : 'Rebalance completed!'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
