'use client'

import Link from 'next/link'
import { ArrowDownCircle, ArrowUpCircle, TrendingUp } from 'lucide-react'

export function QuickActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Link
        href="/deposit"
        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <ArrowDownCircle className="w-5 h-5" />
        Deposit
      </Link>
      
      <Link
        href="/withdraw"
        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-surface border border-border text-text-primary rounded-xl font-medium hover:bg-surface-hover transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <ArrowUpCircle className="w-5 h-5" />
        Withdraw
      </Link>
      
      <Link
        href="/dashboard"
        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-void border border-border text-text-primary rounded-xl font-medium hover:bg-surface transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <TrendingUp className="w-5 h-5" />
        Dashboard
      </Link>
    </div>
  )
}
