import { Metadata } from 'next'
import { WithdrawForm } from '@/components/withdraw/WithdrawForm'
import { PendingWithdrawals } from '@/components/withdraw/PendingWithdrawals'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Withdraw | bond.credit',
}

export default function WithdrawPage() {
  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="max-w-xl mx-auto space-y-6">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Vault
        </Link>
        
        <div className="card p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-text-primary mb-2">
              Request Withdrawal
            </h1>
            <p className="text-text-secondary text-sm">
              Request to redeem your BCV shares for USDC. Withdrawals are processed asynchronously and typically complete within 2-5 minutes.
            </p>
          </div>
          
          <WithdrawForm />
        </div>
        
        <PendingWithdrawals />
      </div>
    </main>
  )
}
