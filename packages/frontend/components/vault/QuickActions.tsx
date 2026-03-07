'use client'

import { useState } from 'react'
import { ArrowRight, Wallet, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  const [hovered, setHovered] = useState<string | null>(null)

  const actions = [
    {
      id: 'deposit',
      label: 'Deposit',
      description: 'Add USDC to earn yield',
      icon: Wallet,
      href: '/deposit',
      primary: true,
    },
    {
      id: 'withdraw',
      label: 'Withdraw',
      description: 'Request withdrawal',
      icon: ArrowUpRight,
      href: '/withdraw',
      primary: false,
    },
  ]

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.id}
            href={action.href}
            onMouseEnter={() => setHovered(action.id)}
            onMouseLeave={() => setHovered(null)}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-medium transition-all ${
              action.primary
                ? 'bg-accent hover:bg-accent-hover text-white'
                : 'bg-surface hover:bg-surface-hover border border-border text-text-primary'
            }`}
          >
            <Icon className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold">{action.label}</div>
              <div className={`text-xs ${action.primary ? 'text-white/70' : 'text-text-muted'}`}>
                {action.description}
              </div>
            </div>
            <ArrowRight
              className={`w-5 h-5 transition-transform ${
                hovered === action.id ? 'translate-x-1' : ''
              }`}
            />
          </Link>
        )
      })}
    </div>
  )
}
