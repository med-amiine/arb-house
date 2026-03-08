'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, X } from 'lucide-react'
import { createPortal } from 'react-dom'

export interface Notification {
  id: string
  type: 'success'
  title: string
  message: string
  txHash?: string
}

interface NotificationsContainerProps {
  notifications: Notification[]
  onDismiss: (id: string) => void
}

export function NotificationsContainer({ notifications, onDismiss }: NotificationsContainerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed top-4 right-4 z-[99999] space-y-2 pointer-events-auto">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            layout
            transition={{ 
              duration: 0.3,
              ease: [0.25, 0.1, 0.25, 1] as const
            }}
            className="bg-surface border-2 border-accent/50 rounded-xl p-4 shadow-2xl min-w-[340px] max-w-md"
            style={{ 
              boxShadow: '0 25px 50px -12px rgba(5, 150, 105, 0.35)',
            }}
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
                onClick={() => onDismiss(notification.id)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}
