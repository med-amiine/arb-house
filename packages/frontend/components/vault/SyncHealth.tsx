'use client'

import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface KeeperStatus {
  last_sync: number
  synced: boolean
}

export function SyncHealth() {
  const [mounted, setMounted] = useState(false)
  const [lastSync, setLastSync] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch keeper status from API
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const keeperUrl = process.env.NEXT_PUBLIC_KEEPER_API_URL || 'http://localhost:8000'
        const response = await fetch(`${keeperUrl}/status`)
        if (response.ok) {
          const data: KeeperStatus = await response.json()
          setLastSync(data.last_sync)
        }
      } catch (error) {
        console.error('Failed to fetch keeper status:', error)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 60000) // Poll every minute
    return () => clearInterval(interval)
  }, [])

  const MAX_SYNC_AGE = 12 * 60 * 60 // 12 hours in seconds

  const [timeLeft, setTimeLeft] = useState(0)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!lastSync) return

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      const age = now - lastSync
      const remaining = Math.max(0, MAX_SYNC_AGE - age)
      const pct = (remaining / MAX_SYNC_AGE) * 100

      setTimeLeft(remaining)
      setProgress(pct)
    }, 1000)

    return () => clearInterval(interval)
  }, [lastSync])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}h ${m}m ${s}s`
  }

  if (!mounted || !lastSync) return null

  const status = progress > 50 ? 'healthy' : progress > 25 ? 'warning' : 'critical'

  const colors = {
    healthy: 'text-accent bg-accent/10 border-accent/30',
    warning: 'text-warning bg-warning/10 border-warning/30',
    critical: 'text-danger bg-danger/10 border-danger/30'
  }

  const icons = {
    healthy: CheckCircle2,
    warning: Activity,
    critical: AlertTriangle
  }

  const Icon = icons[status]

  return (
    <div className={`rounded-lg px-3 py-2 border ${colors[status]}`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Icon className="w-4 h-4" />
          <span className="text-xs font-medium">Keeper Health</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                status === 'healthy' ? 'bg-accent' :
                status === 'warning' ? 'bg-warning' : 'bg-danger'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-bold font-mono flex-shrink-0">
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  )
}
