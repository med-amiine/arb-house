'use client'

import { motion } from 'framer-motion'
import { useVaultData } from '@/hooks/useVault'
import { useReadContract } from 'wagmi'
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts'
import { useEffect, useState } from 'react'
import { Activity, Shield, Zap, TrendingUp, Lock } from 'lucide-react'

interface RadarMetric {
  label: string
  value: number
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
      <div className="card p-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-text-secondary text-sm">Loading Risk Analysis...</div>
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
      value: 85,
      icon: <TrendingUp className="w-3 h-3" />
    },
    {
      label: 'Stability',
      value: Math.min(100, 70 + (activeAgents * 10)),
      icon: <Lock className="w-3 h-3" />
    },
    {
      label: 'Liquidity',
      value: Math.min(100, 100 - utilization + 20),
      icon: <Zap className="w-3 h-3" />
    },
    {
      label: 'Execution',
      value: 90,
      icon: <Activity className="w-3 h-3" />
    },
    {
      label: 'Trust',
      value: Math.min(100, 60 + (activeAgents * 15)),
      icon: <Shield className="w-3 h-3" />
    },
  ]

  const overallScore = Math.round(metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length)

  // Compact radar chart
  const size = 140
  const center = size / 2
  const radius = 55
  const angleStep = (Math.PI * 2) / metrics.length

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

  return (
    <motion.div 
      className="card p-5"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        {/* Left: Radar Chart */}
        <div className="flex-shrink-0 flex items-center gap-4">
          <svg width={size} height={size} className="overflow-visible flex-shrink-0">
            {/* Background circles */}
            {[25, 50, 75, 100].map((level) => (
              <circle
                key={level}
                cx={center}
                cy={center}
                r={(level / 100) * radius}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeWidth={1}
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
              fill="url(#radarGradientSmall)"
              stroke="#059669"
              strokeWidth={1.5}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />

            {/* Data points */}
            {points.map((p, i) => (
              <motion.circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={3}
                fill="#059669"
                stroke="#141517"
                strokeWidth={1.5}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.08 }}
              />
            ))}

            <defs>
              <radialGradient id="radarGradientSmall" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#059669" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.1} />
              </radialGradient>
            </defs>
          </svg>

          {/* Overall Score */}
          <div className="text-center sm:text-left">
            <div className="text-4xl font-bold font-mono text-accent">{overallScore}</div>
            <div className="text-xs text-text-secondary uppercase tracking-wider">Risk Score</div>
            <div className="mt-1 text-xs text-accent">
              {activeAgents}/3 agents active
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-24 bg-border" />

        {/* Right: Metrics List */}
        <div className="flex-1 grid grid-cols-5 gap-2">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              className="text-center p-2 rounded-lg bg-void/50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
            >
              <div className="text-accent mb-1 flex justify-center">{metric.icon}</div>
              <div className="text-[10px] text-text-secondary uppercase">{metric.label}</div>
              <div className="text-sm font-bold font-mono">{metric.value}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
