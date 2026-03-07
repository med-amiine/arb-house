'use client'

import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

export function ActionButtons() {
  return (
    <div className="flex gap-4">
      <Link 
        href="/deposit"
        className="btn-primary flex-1 flex items-center justify-center gap-2 py-4"
      >
        <ArrowDownLeft size={20} />
        Deposit USDC
      </Link>
      
      <Link 
        href="/withdraw"
        className="btn-secondary flex-1 flex items-center justify-center gap-2 py-4"
      >
        <ArrowUpRight size={20} />
        Request Withdrawal
      </Link>
    </div>
  )
}
