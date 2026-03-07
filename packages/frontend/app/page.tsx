import { Metadata } from 'next'
import { VaultHeader } from '@/components/vault/VaultHeader'
import { SharePrice } from '@/components/vault/SharePrice'
import { TVLCard } from '@/components/vault/TVLCard'
import { UserPosition } from '@/components/vault/UserPosition'
import { AgentAllocation } from '@/components/vault/AgentAllocation'
import { ActionButtons } from '@/components/vault/ActionButtons'

export const metadata: Metadata = {
  title: 'Bond Credit Vault',
}

export default function Home() {
  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <VaultHeader />
        
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SharePrice />
          </div>
          <div className="space-y-4">
            <TVLCard />
            <UserPosition />
          </div>
        </div>
        
        {/* Actions */}
        <ActionButtons />
        
        {/* Agent Allocation */}
        <AgentAllocation />
        
      </div>
    </main>
  )
}
