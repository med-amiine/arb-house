'use client'

import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Activity, 
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  PieChart,
  ArrowRight
} from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
}

export default function ReportPage() {
  return (
    <motion.div 
      className="min-h-screen py-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-12">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-surface to-surface border border-emerald-500/20 p-8 lg:p-12">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 mb-6">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Agent Credit Report · Nov 2024 – Feb 2025
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                  Agentic Alpha<br />
                  <span className="text-emerald-400">Season 0</span>
                </h1>
                
                <p className="text-xl text-text-secondary font-light mb-6">
                  Inaugural Capital Deployment Report
                </p>
                
                <p className="text-text-secondary leading-relaxed mb-8 max-w-lg">
                  $10,000 deployed across five autonomous onchain agents over 107 days. 
                  Blended portfolio APY of <strong className="text-emerald-400">9.78%</strong> total, 
                  <strong className="text-emerald-400"> 6.12%</strong> native-only. 
                  $549,466 in season volume.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-void/50 border border-border">
                    <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Period</div>
                    <div className="font-mono text-sm">Nov 5, 2024 – Feb 19, 2025</div>
                  </div>
                  <div className="p-4 rounded-xl bg-void/50 border border-border">
                    <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Duration</div>
                    <div className="font-mono text-sm">107 days</div>
                  </div>
                  <div className="p-4 rounded-xl bg-void/50 border border-border">
                    <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Capital</div>
                    <div className="font-mono text-sm">$10,000 ($2K/agent)</div>
                  </div>
                  <div className="p-4 rounded-xl bg-void/50 border border-border">
                    <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Data</div>
                    <div className="font-mono text-sm">Dune · @abdelhaks</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="p-6">
                  <p className="text-text-secondary italic mb-4 border-l-2 border-emerald-400 pl-4">
                    "$10,000 deployed. 107 days. Five agents. $277.32 verified yield. 
                    Every transaction onchain — building the credit history of the agentic economy."
                  </p>
                  <div className="text-xs text-text-secondary font-mono">
                    — bond.credit · Agentic Alpha Season 0
                  </div>
                </div>
                <div className="grid grid-cols-2 border-t border-border">
                  <div className="p-4 border-r border-border bg-emerald-500/5">
                    <div className="font-mono text-2xl font-bold text-emerald-400">9.78%</div>
                    <div className="text-xs text-text-secondary uppercase tracking-wider mt-1">Portfolio APY</div>
                  </div>
                  <div className="p-4 bg-surface">
                    <div className="font-mono text-2xl font-bold text-white">6.12%</div>
                    <div className="text-xs text-text-secondary uppercase tracking-wider mt-1">Native APY</div>
                  </div>
                  <div className="p-4 border-r border-t border-border bg-surface">
                    <div className="font-mono text-2xl font-bold text-white">$549,466</div>
                    <div className="text-xs text-text-secondary uppercase tracking-wider mt-1">Season Volume</div>
                  </div>
                  <div className="p-4 border-t border-border bg-surface">
                    <div className="font-mono text-2xl font-bold text-white">$277.32</div>
                    <div className="text-xs text-text-secondary uppercase tracking-wider mt-1">Total Yield</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section 01 - Executive Summary */}
        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-12">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">
            <div className="w-4 h-px bg-emerald-400" />
            01 · Season 0 at a Glance
          </div>
          
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">
            Executive Summary & True Capital APY
          </h2>
          
          <p className="text-text-secondary leading-relaxed mb-8 max-w-3xl">
            Across 107 days of live deployment, five agent-powered protocols solidified a combined 
            $549,466 in transaction volume and $277.32 in total yield — $175.56 native and $101.76 
            from reward emissions. Using confirmed initial capital of $2,000 per agent ($10,000 total), 
            the portfolio delivered <strong className="text-emerald-400">9.78% blended Capital APY</strong> on a compound annualized basis.
          </p>

          {/* Core Metrics Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
            <div className="bg-surface p-6 border-t-2 border-emerald-400">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Season Total Volume</div>
              <div className="font-mono text-2xl font-bold text-emerald-400">$549,466</div>
              <div className="text-xs text-text-secondary mt-1">5 protocols · 107-day window</div>
            </div>
            <div className="bg-surface p-6">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Total Yield Generated</div>
              <div className="font-mono text-2xl font-bold text-emerald-400">$277.32</div>
              <div className="text-xs text-text-secondary mt-1">Native $175.56 · Rewards $101.76</div>
            </div>
            <div className="bg-surface p-6">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Season Transactions</div>
              <div className="font-mono text-2xl font-bold text-blue-400">432</div>
              <div className="text-xs text-text-secondary mt-1">Verified onchain</div>
            </div>
            <div className="bg-surface p-6">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Realized USDC ROI</div>
              <div className="font-mono text-2xl font-bold text-purple-400">$274.43</div>
              <div className="text-xs text-text-secondary mt-1">As reported @gbond_team</div>
            </div>
          </div>

          {/* Capital APY Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border mt-px">
            <div className="bg-surface p-6 border-t-2 border-emerald-400">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Portfolio Capital APY (Total)</div>
              <div className="font-mono text-2xl font-bold text-emerald-400">9.78%</div>
              <div className="text-xs text-text-secondary mt-1">$277.32 yield on $10,000 capital</div>
            </div>
            <div className="bg-surface p-6 border-t-2 border-emerald-500">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Portfolio Capital APY (Native)</div>
              <div className="font-mono text-2xl font-bold text-emerald-400">6.12%</div>
              <div className="text-xs text-text-secondary mt-1">Reward-stripped sustainable floor</div>
            </div>
            <div className="bg-surface p-6">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Risk-Adjusted APY</div>
              <div className="font-mono text-2xl font-bold text-yellow-400">7.95%</div>
              <div className="text-xs text-text-secondary mt-1">Conservative underwriting input</div>
            </div>
            <div className="bg-surface p-6">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Total Capital Deployed</div>
              <div className="font-mono text-2xl font-bold text-white">$10,000</div>
              <div className="text-xs text-text-secondary mt-1">5 agents × $2,000 · 107 days</div>
            </div>
          </div>

          {/* Agent Performance Table */}
          <div className="mt-8 bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-void border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">Agent</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">Capital</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">Volume</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">Total Yield</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">Native Yield</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">Capital APY Total</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">Reward Dep.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-void/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="font-medium">Sail</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm">$2,000</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-emerald-400">$389,245</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-emerald-400">$34.21</td>
                    <td className="py-4 px-4 text-right font-mono text-sm">$34.12</td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-bold text-emerald-400">5.96%</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-emerald-400">0.3%</td>
                  </tr>
                  <tr className="hover:bg-void/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-medium">Mamo</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm">$2,000</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-emerald-400">$213,378</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-emerald-400">$28.08</td>
                    <td className="py-4 px-4 text-right font-mono text-sm">$25.71</td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-bold text-emerald-400">4.87%</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-emerald-400">8.4%</td>
                  </tr>
                  <tr className="hover:bg-void/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-medium">Arma GIZA</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm">$2,000</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-emerald-400">$88,769</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-emerald-400">$59.77</td>
                    <td className="py-4 px-4 text-right font-mono text-sm">$29.02</td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-bold text-emerald-400">10.57%</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-orange-400">51.4%</td>
                  </tr>
                  <tr className="hover:bg-void/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        <span className="font-medium">ZyFAI</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm">$2,000</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-emerald-400">$16,299</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-emerald-400">$54.94</td>
                    <td className="py-4 px-4 text-right font-mono text-sm">$54.94</td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-bold text-emerald-400">9.68%</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-emerald-400">0.0%</td>
                  </tr>
                  <tr className="hover:bg-void/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                        <span className="font-medium">SurfLiquid</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm">$2,000</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-emerald-400">$8,079</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-emerald-400">$100.32</td>
                    <td className="py-4 px-4 text-right font-mono text-sm">$31.77</td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-bold text-emerald-400">18.17%</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-red-400">68.3%</td>
                  </tr>
                </tbody>
                <tfoot className="bg-void border-t border-border">
                  <tr>
                    <td className="py-4 px-4 font-semibold">Portfolio</td>
                    <td className="py-4 px-4 text-right font-mono font-bold">$10,000</td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-emerald-400">$715,770*</td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-emerald-400">$277.32</td>
                    <td className="py-4 px-4 text-right font-mono font-bold">$175.56</td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-emerald-400">9.78%</td>
                    <td className="py-4 px-4 text-right font-mono font-bold">36.7%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Formula Box */}
          <div className="mt-6 p-4 rounded-lg bg-void border-l-2 border-emerald-400">
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">Formula</div>
            <p className="text-sm text-text-secondary">
              <code className="bg-void px-2 py-0.5 rounded text-text-primary">Capital APY = (1 + Yield / Capital)^(365 / 107) − 1</code>
              &nbsp;·&nbsp; Capital = $2,000/agent confirmed &nbsp;·&nbsp; Exponent = 3.411×
            </p>
          </div>
        </motion.section>

        {/* Section 02 - Protocol Matrix */}
        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-12">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">
            <div className="w-4 h-px bg-emerald-400" />
            02 · Protocol Matrix
          </div>
          
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">
            Protocol Performance & Volume Distribution
          </h2>
          
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-400">
                <strong>Volume Accounting Note:</strong> Individual protocol volumes sum to $715,770 vs. 
                the reported season total of $549,466 — a $166,304 discrepancy indicating agents deployed 
                capital across multiple protocols simultaneously.
              </p>
            </div>
          </div>

          {/* Volume & Yield Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
                Volume by Protocol
              </h3>
              {[
                { name: 'Sail', color: 'bg-blue-400', pct: 100, value: '$389,245' },
                { name: 'Mamo', color: 'bg-emerald-400', pct: 54.8, value: '$213,378' },
                { name: 'Arma', color: 'bg-emerald-400', pct: 22.8, value: '$88,769' },
                { name: 'ZyFAI', color: 'bg-purple-400', pct: 4.2, value: '$16,299' },
                { name: 'SurfLiquid', color: 'bg-orange-400', pct: 2.1, value: '$8,079' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 mb-3">
                  <span className="text-sm w-20">{item.name}</span>
                  <div className="flex-1 h-2 bg-void rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="text-sm font-mono text-text-secondary w-24 text-right">{item.value}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
                Total Yield by Protocol
              </h3>
              {[
                { name: 'SurfLiquid', color: 'bg-orange-400', pct: 100, value: '$100.32' },
                { name: 'Arma', color: 'bg-emerald-400', pct: 59.6, value: '$59.77' },
                { name: 'ZyFAI', color: 'bg-purple-400', pct: 54.8, value: '$54.94' },
                { name: 'Sail', color: 'bg-blue-400', pct: 34.1, value: '$34.21' },
                { name: 'Mamo', color: 'bg-emerald-400', pct: 28.0, value: '$28.08' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 mb-3">
                  <span className="text-sm w-20">{item.name}</span>
                  <div className="flex-1 h-2 bg-void rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="text-sm font-mono text-text-secondary w-24 text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Section 03 - Risk Metrics */}
        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-12">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">
            <div className="w-4 h-px bg-emerald-400" />
            03 · Risk Metrics
          </div>
          
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">
            Concentration, Reward Dependency & Sustainability
          </h2>
          
          <p className="text-text-secondary leading-relaxed mb-8 max-w-3xl">
            Institutional credit scoring requires conservative, risk-adjusted inputs. Three risk dimensions: 
            reward dependency ratio, HHI concentration, and reward-stripped APY floors for underwriting.
          </p>

          {/* Risk Grid */}
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-px bg-border rounded-xl overflow-hidden border border-border">
            <div className="bg-surface p-6 border-t-2 border-blue-400">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Sail · Reward Dep.</div>
              <div className="font-mono text-2xl font-bold text-blue-400">0.3%</div>
              <div className="text-xs text-emerald-400 mt-2">✓ Highly sustainable</div>
            </div>
            <div className="bg-surface p-6 border-t-2 border-emerald-400">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Mamo · Reward Dep.</div>
              <div className="font-mono text-2xl font-bold text-emerald-400">8.4%</div>
              <div className="text-xs text-emerald-400 mt-2">✓ Low dependency</div>
            </div>
            <div className="bg-surface p-6 border-t-2 border-emerald-400">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Arma · Reward Dep.</div>
              <div className="font-mono text-2xl font-bold text-emerald-400">51.4%</div>
              <div className="text-xs text-orange-400 mt-2">⚑ High — monitor</div>
            </div>
            <div className="bg-surface p-6 border-t-2 border-purple-400">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">ZyFAI · Reward Dep.</div>
              <div className="font-mono text-2xl font-bold text-purple-400">0.0%</div>
              <div className="text-xs text-emerald-400 mt-2">✓ 100% native</div>
            </div>
            <div className="bg-surface p-6 border-t-2 border-orange-400">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Surf · Reward Dep.</div>
              <div className="font-mono text-2xl font-bold text-orange-400">68.3%</div>
              <div className="text-xs text-red-400 mt-2">⚠ Critical risk</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border mt-px">
            <div className="bg-surface p-6 border-t-2 border-emerald-400">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">HHI (Transaction Share)</div>
              <div className="font-mono text-2xl font-bold text-emerald-400">0.521</div>
              <div className="text-xs text-text-secondary mt-2">S1 target: ≤0.35</div>
            </div>
            <div className="bg-surface p-6">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Effective Protocol Count</div>
              <div className="font-mono text-2xl font-bold text-white">1.92</div>
              <div className="text-xs text-text-secondary mt-2">S1 target: ≥2.86</div>
            </div>
            <div className="bg-surface p-6">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Portfolio APY Native Floor</div>
              <div className="font-mono text-2xl font-bold text-emerald-400">6.12%</div>
              <div className="text-xs text-text-secondary mt-2">Sustainable minimum</div>
            </div>
            <div className="bg-surface p-6">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Risk-Adj. APY (0.5× disc.)</div>
              <div className="font-mono text-2xl font-bold text-yellow-400">7.95%</div>
              <div className="text-xs text-text-secondary mt-2">Recommended credit input</div>
            </div>
          </div>
        </motion.section>

        {/* Section 10 - Timeline */}
        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-12">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">
            <div className="w-4 h-px bg-emerald-400" />
            10 · Chronological Milestones
          </div>
          
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">
            Season 0 Timeline
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="relative pl-6 border-l border-border">
              {[
                { date: 'November 5, 2024', title: 'Season 0 Launch — All 5 Agents Activated', desc: '$10,000 deployed. Sail, Mamo, Arma, SurfLiquid, and ZyFAI first transactions recorded onchain simultaneously.', color: 'bg-emerald-400' },
                { date: 'November 14, 2024', title: 'Arma Enters Sustained Execution', desc: 'Arma records consecutive daily activity, establishing its 2.43-day cadence and high-conviction allocation rhythm.', color: 'bg-emerald-400' },
                { date: 'November 21, 2024', title: 'Sail Crosses $100K Volume (Day 16)', desc: 'First protocol to hit $100K. Sub-daily cadence (0.30 days/tx) confirmed as the defining behavioral pattern.', color: 'bg-blue-400' },
                { date: 'December 6–8, 2024', title: 'Mamo Peak — 9 Txns on December 8', desc: "Mamo's highest single-day transaction count. Cumulative volume reaches $88,292 mid-month.", color: 'bg-emerald-400' },
                { date: 'December 17, 2024', title: 'SurfLiquid Completes Initial Deployment', desc: "First 3 transactions executed. $68.55 in reward yield captured — 68.3% of SurfLiquid's Season 0 total.", color: 'bg-emerald-400' },
              ].map((item, i) => (
                <div key={i} className="relative mb-8">
                  <div className={`absolute -left-[29px] top-1 w-3 h-3 rounded-full ${item.color} border-2 border-bg`} />
                  <div className="font-mono text-xs text-emerald-400 mb-1">{item.date}</div>
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-text-secondary">{item.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="relative pl-6 border-l border-border">
              {[
                { date: 'December 29, 2024', title: 'Sail Crosses $200K (30 Cumulative Txns)', desc: "Season 0 volume concentration solidifies. Sail's dominance establishes HHI = 0.521.", color: 'bg-blue-400' },
                { date: 'January 13–15, 2025', title: 'Arma 6-Transaction Burst (48 Hours)', desc: 'Most concentrated execution cluster of Season 0. Volume crosses $36,109 — 4× monthly acceleration.', color: 'bg-emerald-400' },
                { date: 'February 6, 2025', title: 'SurfLiquid Closes — $100.32 Total Yield', desc: '18.17% Capital APY recorded. Highest absolute yield and $20.06 yield/tx of any Season 0 agent.', color: 'bg-emerald-400' },
                { date: 'February 8–9, 2025', title: 'ZyFAI Activates — 4 Txns in 48 Hours', desc: '$54.94 native yield, 9.68% Capital APY, 0% reward dependency. Cleanest credit signal in cohort.', color: 'bg-blue-400' },
                { date: 'February 19, 2025', title: 'Season 0 Close — Credit Engine Ingestion', desc: '$10,000 → $277.32 yield → 9.78% portfolio APY. Parametric baseline for Season 1 underwriting established.', color: 'bg-emerald-400' },
              ].map((item, i) => (
                <div key={i} className="relative mb-8">
                  <div className={`absolute -left-[29px] top-1 w-3 h-3 rounded-full ${item.color} border-2 border-bg`} />
                  <div className="font-mono text-xs text-emerald-400 mb-1">{item.date}</div>
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-text-secondary">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Section 11 - Outlook */}
        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-12">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">
            <div className="w-4 h-px bg-emerald-400" />
            11 · Season 1 Outlook
          </div>
          
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">
            Strategic Priorities for 2026
          </h2>
          
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {[
              { num: '01', title: 'Scale ZyFAI — Best Risk-Adjusted Signal', desc: '9.68% native Capital APY, 0% reward dependency. Increasing allocation from $2,000 to $5,000–$8,000 materially improves portfolio native APY floor and reduces HHI simultaneously. Primary Season 1 scale candidate.' },
              { num: '02', title: 'Reduce HHI to ≤0.35 (Target N ≥2.86)', desc: "Sail's 68.7% tx dominance drives HHI to 0.521. Season 1 target: ≤45% single-agent tx share. Achieved by scaling ZyFAI and Arma — not reducing Sail — while adding 1–2 new protocols." },
              { num: '03', title: 'Apply Reward Sustainability Discounts', desc: 'Arma at 0.5× discount (51.4% dep.), SurfLiquid at 0.3–0.5× (68.3% dep.). Report Capital APY (total) and Capital APY (native) as separate dashboard fields for all Season 1 agents.' },
            ].map((item, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-6 hover:border-emerald-500/25 transition-colors">
                <div className="font-mono text-4xl font-bold text-void/50 mb-4">{item.num}</div>
                <h3 className="font-bold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Projections */}
          <h3 className="text-lg font-bold mb-4">Season 1 Baseline Projections (180-day, flat-rate)</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
            <div className="bg-surface p-6 border-t-2 border-emerald-400">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Projected Volume (180d)</div>
              <div className="font-mono text-2xl font-bold text-emerald-400">$923,644</div>
              <div className="text-xs text-text-secondary mt-1">$5,135/day × 180 · +68% vs S0</div>
            </div>
            <div className="bg-surface p-6">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Projected Transactions</div>
              <div className="font-mono text-2xl font-bold text-blue-400">727</div>
              <div className="text-xs text-text-secondary mt-1">4.04 tx/day × 180 days</div>
            </div>
            <div className="bg-surface p-6">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Projected Yield</div>
              <div className="font-mono text-2xl font-bold text-emerald-400">$466.07</div>
              <div className="text-xs text-text-secondary mt-1">$277.32 × (180÷107) at S0 rate</div>
            </div>
            <div className="bg-surface p-6">
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Projected Portfolio APY</div>
              <div className="font-mono text-2xl font-bold text-white">~9.78%</div>
              <div className="text-xs text-text-secondary mt-1">Improves with ZyFAI scaling</div>
            </div>
          </div>
        </motion.section>

        {/* Footer Note */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="p-4 bg-void border-y border-border mb-8">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs font-mono text-text-secondary">
            <div>Capital APY: <span className="text-text-primary">(1 + yield/capital)^(365/107) − 1 · compound · $2,000/agent</span></div>
            <div>TYR: <span className="text-text-primary">(1 + yield/volume)^(365/107) − 1 · yield per $ cycled</span></div>
            <div>HHI: <span className="text-text-primary">0.521 on tx share · Effective N = 1.92</span></div>
            <div>Data: <span className="text-text-primary">Dune · @abdelhaks · @gbond_team · Feb 2025</span></div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="border-t border-border pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
            <div>
              <div className="text-xl font-bold tracking-tight">
                bond<span className="text-emerald-400">.</span>credit
              </div>
              <div className="text-sm text-text-secondary mt-2">The Credit Layer for the Agentic Economy</div>
              <div className="text-xs text-text-secondary mt-1">Agentic Alpha · Season 0 · Agent Credit Report · 2025</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-text-secondary leading-relaxed">
                Capital: $10,000 total · $2,000 per agent · 5 agents<br />
                Window: Nov 5, 2024 – Feb 19, 2025 (107 days)<br />
                APY formula: compound (1 + r)^(365/107) − 1<br />
                Data: Dune Analytics (@abdelhaks · @gbond_team)
              </div>
            </div>
          </div>
        </motion.footer>
      </div>
    </motion.div>
  )
}
