import { Metadata } from 'next'
import { RecentActivity } from '@/components/vault/RecentActivity'

export const metadata: Metadata = {
  title: 'Transaction History | Bond Credit Vault',
  description: 'View your complete transaction history',
}

export default function TransactionsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-text-secondary mt-2">
            View all your deposits, withdrawals, and yield distributions
          </p>
        </div>

        <div className="max-w-2xl">
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}
