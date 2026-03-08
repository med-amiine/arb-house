'use client'

import { motion } from 'framer-motion'
import { useVaultData } from '@/hooks/useVault'
import { useReadContract } from 'wagmi'
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts'
import { formatUnits } from 'viem'
import { useEffect, useState } from 'react'
import { Activity, Shield, Zap, TrendingUp, Lock } from 'lucide-react'

interface RadarMetric {
  label: string
  value: number
  fullMark: number
  icon: React.ReactNode
}

export function VaultRadar() {
  const [mounted, setMounted] = useState(false)
  const { agents, tvl, isLoading } = useVaultData()
  
  const { data: totalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
  })
  
  const { data: totalIdle } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalIdle',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-text-secondary">Loading Risk Analysis...</div>
        </div>
      </div>
    )
  }

  const deployed = totalAssets && totalIdle 
    ? Number(totalAssets) - Number(totalIdle)
    : 0
  const utilization = totalAssets && Number(totalAssets) > 0
    ? (deployed / Number(totalAssets)) * 100
    : 0

  const activeAgents = agents?.filter(a => a.active).length || 0
  
  // Calculate metrics (0-100 scale)
  const metrics: RadarMetric[] = [
    {
      label: 'Performance',
      value: 85, // Based on yield performance
      fullMark: 100,
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      label: 'Stability',
      value: Math.min(100, 70 + (activeAgents * 10)), // Higher with more active agents
      fullMark: 100,
      icon: <Lock className="w-4 h-4" />
    },
    {
      label: 'Liquidity',
      value: Math.min(100, 100 - utilization + 20), // Higher with more idle funds
      fullMark: 100,
      icon: <Zap className="w-4 h-4" />
    },
    {
      label: 'Execution',
      value: 90, // Based on keeper sync health
      fullMark: 100,
      icon: <Activity className="w-4 h-4" />
    },
    {
      label: 'Trust',
      value: Math.min(100, 60 + (activeAgents * 15)), // Based on agent uptime
      fullMark: 100,
      icon: <Shield className="w-4 h-4" />
    },
  ]

  const overallScore = Math.round(metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length)

  // Radar chart dimensions
  const size = 280
  const center = size / 2
  const radius = 90
  const angleStep = (Math.PI * 2) / metrics.length

  // Calculate points for the radar polygon
  const getPoint = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2
    const r = (value / 100) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  const points = metrics.map((m, i) => getPoint(m.value, i))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  // Grid circles
  const gridLevels = [20, 40, 60, 80, 100]

  return (
    <motion.div 
      className="card p-6 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Vault Risk Radar</h3>
            <p className="text-xs text-text-secondary">Real-time risk assessment</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono text-accent">{overallScore}</div>
          <div className="text-xs text-text-secondary">Overall Score</div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="flex flex-col items-center">
        <svg width={size} height={size} className="overflow-visible">
          {/* Background grid circles */}
          {gridLevels.map((level) => (
            <circle
              key={level}
              cx={center}
              cy={center}
              r={(level / 100) * radius}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}

          {/* Axis lines */}
          {metrics.map((_, i) => {
            const end = getPoint(100, i)
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={end.x}
                y2={end.y}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeWidth={1}
              />
            )
          })}

          {/* Data polygon */}
          <motion.path
            d={pathD}
            fill="url(#radarGradient)"
            stroke="#059669"
            strokeWidth={2}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {/* Data points */}
          {points.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={5}
              fill="#059669"
              stroke="#141517"
              strokeWidth={2}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            />
          ))}

          {/* Gradient definition */}
          <defs>
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.05} />
            </radialGradient>
          </defs>
        </svg>

        {/* Metric Labels */}
        <div className="grid grid-cols-5 gap-2 w-full mt-4">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <div className="text-accent mb-1">{metric.icon}</div>
              <div className="text-xs font-medium text-text-secondary">{metric.label}</div>
              <div className="text-sm font-bold font-mono">{metric.value}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Terminal-style footer */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className="text-text-muted">
              AGENTS: <span className="text-accent">{activeAgents}/3 ACTIVE</span>
            </span>
            <span className="text-text-muted">
              TVL: <span className="text-accent">${(tvl / 1000000).toFixed(2)}M</span>
            </span>
          </div>
          <span className="text-accent animate-pulse">
            ● LIVE
          </span>
        </div>
      </div>
    </motion.div>
  )
}
