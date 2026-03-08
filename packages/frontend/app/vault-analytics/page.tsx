import { Metadata } from 'next'
import { VaultAnalytics } from '@/components/vault/VaultAnalytics'

export const metadata: Metadata = {
  title: 'Vault Analytics | Bond Credit Vault',
  description: 'Detailed vault analytics and capital deployment metrics',
}

export default function VaultAnalyticsPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Vault Analytics</h1>
          <p className="text-text-secondary mt-1">
            Detailed metrics on vault performance and capital deployment
          </p>
        </div>

        {/* Vault Analytics Component */}
        <VaultAnalytics />
      </div>
    </div>
  )
}
