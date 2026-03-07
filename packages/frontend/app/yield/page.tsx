import { Metadata } from 'next'
import { YieldChart } from '@/components/vault/YieldChart'
import { AgentList } from '@/components/vault/AgentList'

export const metadata: Metadata = {
  title: 'Yield | Bond Credit Vault',
  description: 'Track yield performance across all AI agents',
}

export default function YieldPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Yield Performance</h1>
          <p className="text-text-secondary mt-2">
            Track historical performance and optimize your returns
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <YieldChart />
          <AgentList />
        </div>
      </div>
    </div>
  )
}
