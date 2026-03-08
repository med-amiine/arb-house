'use client'

import { motion } from 'framer-motion'
import { Loader2, Database, Link2, Server, Sparkles } from 'lucide-react'

interface LoadingStateProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  showSource?: boolean
  source?: 'blockchain' | 'backend' | 'hybrid'
}

const sourceConfig = {
  blockchain: {
    icon: Link2,
    text: 'Reading from blockchain...',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/20',
  },
  backend: {
    icon: Server,
    text: 'Fetching from keeper service...',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
  },
  hybrid: {
    icon: Database,
    text: 'Syncing data sources...',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20',
  },
}

const sizeConfig = {
  sm: {
    container: 'p-3',
    icon: 'w-4 h-4',
    spinner: 'w-4 h-4',
    text: 'text-xs',
  },
  md: {
    container: 'p-4',
    icon: 'w-5 h-5',
    spinner: 'w-5 h-5',
    text: 'text-sm',
  },
  lg: {
    container: 'p-6',
    icon: 'w-6 h-6',
    spinner: 'w-6 h-6',
    text: 'text-base',
  },
}

export function LoadingState({ 
  size = 'md', 
  text = 'Loading...',
  showSource = false,
  source = 'hybrid',
}: LoadingStateProps) {
  const config = sourceConfig[source]
  const SourceIcon = config.icon
  const sizes = sizeConfig[size]

  return (
    <div className={`flex items-center gap-3 ${sizes.container}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className={`${sizes.spinner} text-accent`} />
      </motion.div>
      
      <div className="flex flex-col gap-1">
        <span className={`${sizes.text} text-text-secondary`}>{text}</span>
        
        {showSource && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${config.bgColor} ${config.borderColor} border w-fit`}
          >
            <SourceIcon className={`w-3 h-3 ${config.color}`} />
            <span className={`text-xs ${config.color}`}>{config.text}</span>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export function LoadingCard({ 
  children,
  className = '',
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-center min-h-[120px]">
        {children}
      </div>
    </div>
  )
}

export function SkeletonPulse({ 
  className = '',
  lines = 1,
}: { 
  className?: string
  lines?: number 
}) {
  return (
    <div className="space-y-2 w-full">
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className={`bg-surface-hover rounded ${className}`}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: 'easeInOut',
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  )
}

export function DataSourceBadge({ 
  source,
  isLoading = false,
}: { 
  source?: 'blockchain' | 'backend' | 'hybrid'
  isLoading?: boolean
}) {
  if (!source) return null
  
  const config = sourceConfig[source]
  const Icon = config.icon
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${config.bgColor} ${config.borderColor} border text-xs`}
    >
      {isLoading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className={`w-3 h-3 ${config.color}`} />
        </motion.div>
      ) : (
        <Icon className={`w-3 h-3 ${config.color}`} />
      )}
      <span className={config.color}>
        {source === 'blockchain' ? 'On-chain' : source === 'backend' ? 'Keeper' : 'Hybrid'}
      </span>
    </motion.div>
  )
}

// Badge to indicate demo/mock data is being shown
export function DemoDataBadge({ count }: { count?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border-amber-500/20 border text-xs"
      title="Showing sample transactions for demonstration"
    >
      <Sparkles className="w-3 h-3 text-amber-400" />
      <span className="text-amber-400">
        Demo Data{count ? ` (${count} txns)` : ''}
      </span>
    </motion.div>
  )
}
