import { Metadata } from 'next'
import { VaultStats } from '@/components/vault/VaultStats'
import { YieldChart } from '@/components/vault/YieldChart'
import { AgentList } from '@/components/vault/AgentList'
import { QuickActions } from '@/components/vault/QuickActions'
import { RecentActivity } from '@/components/vault/RecentActivity'

export const metadata: Metadata = {
  title: 'Bond Credit Vault | Dashboard',
  description: 'Manage your deposits and earn optimized yield',
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Live on Arbitrum Sepolia
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Institutional Credit
              <span className="block text-accent">Powered by AI</span>
            </h1>
            
            <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
              Deposit USDC and let our AI agents optimize your yield across Aave, Pendle, and Morpho. 
              Withdraw anytime with no lock-up periods.
            </p>
            <QuickActions />
          </div>
        </div>
      </section>

      <section className="py-12 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <VaultStats />
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <YieldChart />
              <AgentList />
            </div>

            <div className="space-y-8">
              <RecentActivity />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
