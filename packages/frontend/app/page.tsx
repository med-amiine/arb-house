'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Shield, Zap, TrendingUp, Bot, Wallet } from 'lucide-react'
import { BondCreditLogo } from '@/components/icons/BondCreditLogo'

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    }
  },
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    }
  },
}

export default function LandingPage() {
  return (
    <motion.div 
      className="min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--void)_70%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              Live on Arbitrum Sepolia
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.div variants={itemVariants} className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-white to-text-secondary bg-clip-text text-transparent">
                Your Capital,
              </span>
              <br />
              <span className="bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
                Supercharged by AI
              </span>
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Deposit USDC and let our intelligent agents optimize your yield across 
              Aave, Pendle, and Morpho — automatically rebalancing for maximum returns.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link
              href="/dashboard"
              className="group flex items-center gap-3 px-8 py-4 bg-accent text-white rounded-2xl font-semibold text-lg hover:bg-accent/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/25"
            >
              <Wallet className="w-5 h-5" />
              Launch App
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/vault-analytics"
              className="flex items-center gap-3 px-8 py-4 bg-surface border border-border text-text-primary rounded-2xl font-semibold text-lg hover:bg-surface-hover transition-all hover:scale-105 active:scale-95"
            >
              <TrendingUp className="w-5 h-5" />
              View Analytics
            </Link>
          </motion.div>

          {/* Feature Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.4,
                },
              },
            }}
          >
            <FeatureCard
              icon={Bot}
              title="AI-Powered Agents"
              description="Three specialized agents work 24/7 to find and capture the best yields across DeFi protocols."
            />
            <FeatureCard
              icon={Shield}
              title="Institutional Security"
              description="Audited smart contracts with real-time monitoring and automatic rebalancing safeguards."
            />
            <FeatureCard
              icon={Zap}
              title="Instant Liquidity"
              description="No lock-up periods. Withdraw your funds anytime with zero exit fees."
            />
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <motion.section 
        className="py-24 border-t border-border/40"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Simple three-step process to start earning optimized yield
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.1,
                },
              },
            }}
          >
            <StepCard
              number="01"
              title="Deposit USDC"
              description="Connect your wallet and deposit USDC into the vault. No minimum amount required."
            />
            <StepCard
              number="02"
              title="AI Takes Over"
              description="Our agents automatically allocate capital across the highest-yielding strategies."
            />
            <StepCard
              number="03"
              title="Earn & Relax"
              description="Watch your balance grow. Withdraw anytime with no penalties or lock-ups."
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Supported Protocols */}
      <motion.section 
        className="py-24 border-t border-border/40"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Supported Protocols</h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Capital deployed across battle-tested DeFi protocols
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.1,
                },
              },
            }}
          >
            <ProtocolCard
              name="Aave V3"
              description="Conservative lending with deep liquidity and proven track record."
              risk="Low Risk"
            />
            <ProtocolCard
              name="Pendle"
              description="PT yield holding for fixed-rate yield exposure."
              risk="Medium Risk"
            />
            <ProtocolCard
              name="Morpho"
              description="Optimized lending with improved rates through peer-to-peer matching."
              risk="Low Risk"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-24 border-t border-border/40"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            variants={itemVariants}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/20 via-surface to-surface border border-border p-12 text-center"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
            <div className="relative">
              <Sparkles className="w-12 h-12 text-accent mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to start earning?
              </h2>
              <p className="text-text-secondary mb-8 max-w-lg mx-auto">
                Join the future of automated yield optimization. Deposit once, 
                let AI handle the rest.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-3 px-8 py-4 bg-accent text-white rounded-2xl font-semibold text-lg hover:bg-accent/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/25"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer Links */}
      <footer className="py-12 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <BondCreditLogo className="h-5 w-auto text-white" />
            <div className="flex items-center gap-6 text-sm text-text-secondary">
              <Link href="/dashboard" className="hover:text-accent transition-colors">
                Dashboard
              </Link>
              <Link href="/vault-analytics" className="hover:text-accent transition-colors">
                Analytics
              </Link>
              <Link href="/deposit" className="hover:text-accent transition-colors">
                Deposit
              </Link>
              <Link href="/withdraw" className="hover:text-accent transition-colors">
                Withdraw
              </Link>
            </div>
            <p className="text-sm text-text-muted">
              © 2025 bond.credit
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  )
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string 
}) {
  return (
    <motion.div 
      variants={cardVariants}
      className="group p-6 rounded-2xl bg-surface/50 border border-border hover:border-accent/30 transition-all hover:bg-surface"
    >
      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
        <Icon className="w-6 h-6 text-accent" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}

function StepCard({ 
  number, 
  title, 
  description 
}: { 
  number: string
  title: string
  description: string 
}) {
  return (
    <motion.div 
      variants={cardVariants}
      className="relative p-6 rounded-2xl bg-surface/30 border border-border"
    >
      <span className="text-4xl font-bold text-accent/20 absolute top-4 right-4">
        {number}
      </span>
      <h3 className="text-lg font-semibold mb-2 relative">{title}</h3>
      <p className="text-text-secondary text-sm leading-relaxed relative">{description}</p>
    </motion.div>
  )
}

function ProtocolCard({ 
  name, 
  description, 
  risk 
}: { 
  name: string
  description: string
  risk: string
}) {
  return (
    <motion.div 
      variants={cardVariants}
      className="p-6 rounded-2xl bg-surface/50 border border-border hover:border-accent/30 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{name}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${
          risk === 'Low Risk' 
            ? 'bg-accent/10 text-accent' 
            : 'bg-warning/10 text-warning'
        }`}>
          {risk}
        </span>
      </div>
      <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}
