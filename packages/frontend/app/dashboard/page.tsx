'use client'

import { VaultStats } from '@/components/vault/VaultStats'
import { YieldChart } from '@/components/vault/YieldChart'
import { AgentList } from '@/components/vault/AgentList'
import { RecentActivity } from '@/components/vault/RecentActivity'
import { RealUserPosition } from '@/components/vault/RealUserPosition'
import { SyncHealth } from '@/components/vault/SyncHealth'
import { ArrowDownCircle, ArrowUpCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section - Compact */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-accent/5 via-surface to-surface border border-border mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />
          <div className="relative p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Live on Arbitrum Sepolia
                </div>
                <h1 className="text-xl font-bold tracking-tight hidden sm:block">
                  Your Dashboard
                </h1>
              </div>
              
              <div className="flex flex-row gap-2">
                <Link
                  href="/deposit"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium text-sm hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  Deposit
                </Link>
                <Link
                  href="/withdraw"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-surface border border-border text-text-primary rounded-lg font-medium text-sm hover:bg-surface-hover transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  Withdraw
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Sync Health Banner - Compact */}
        <div className="mb-6">
          <SyncHealth />
        </div>

        {/* Stats Section */}
        <section className="mb-8">
          <VaultStats />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - User Data */}
          <div className="space-y-6">
            <RealUserPosition />
            
            {/* Link to Detailed Analytics */}
            <Link 
              href="/vault-analytics"
              className="group flex items-center justify-between p-6 rounded-2xl bg-surface border border-border hover:border-accent/30 transition-all hover:bg-surface-hover"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Detailed Analytics</h3>
                  <p className="text-text-secondary text-sm">
                    View capital deployment, agent allocations, and share metrics
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-accent group-hover:bg-accent/10 transition-all">
                <TrendingUp className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
              </div>
            </Link>
            
            <RecentActivity />
          </div>

          {/* Right Column - Charts & Agents */}
          <div className="lg:col-span-2 space-y-6">
            <YieldChart />
            <AgentList />
          </div>
        </div>
      </div>
    </div>
  )
}
