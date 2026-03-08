'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
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

          {/* Main Headline with Animated Background */}
          <motion.div variants={itemVariants} className="text-center max-w-4xl mx-auto mb-12 relative">
            {/* Animated background behind text */}
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
              <AnimatedBackground />
            </div>
            
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

          {/* CTA Buttons - No Icons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-2xl font-semibold text-lg hover:bg-accent/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/25"
            >
              Launch App
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/vault-analytics"
              className="flex items-center px-8 py-4 bg-surface border border-border text-text-primary rounded-2xl font-semibold text-lg hover:bg-surface-hover transition-all hover:scale-105 active:scale-95"
            >
              View Analytics
            </Link>
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
            <p className="text-text-secondary max-w-2xl mx-auto">
              Simple, secure, and automated yield optimization in three steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="01"
              title="Connect Wallet"
              description="Link your wallet and deposit USDC. No minimum deposit required."
            />
            <StepCard
              number="02"
              title="AI Takes Over"
              description="Our agents automatically allocate funds across top DeFi protocols."
            />
            <StepCard
              number="03"
              title="Earn Yield"
              description="Watch your balance grow with real-time yield accrual and auto-compounding."
            />
          </div>
        </div>
      </motion.section>

      {/* Live Stats Section */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value="$2.4M+" label="Total Value Locked" />
            <StatCard value="12.5%" label="Average APY" />
            <StatCard value="3" label="Active Agents" />
            <StatCard value="0" label="Exit Fees" />
          </div>
        </div>
      </section>

      {/* Protocols Section */}
      <motion.section 
        className="py-24 border-t border-border/40"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Integrated Protocols</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              We leverage battle-tested DeFi protocols to generate sustainable yields
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProtocolCard
              name="Aave V3"
              description="Lending protocol with deep liquidity and risk-adjusted yields"
              risk="Low"
            />
            <ProtocolCard
              name="Pendle"
              description="Yield tokenization for fixed and leveraged yield exposure"
              risk="Medium"
            />
            <ProtocolCard
              name="Morpho"
              description="Peer-to-peer lending optimizer on top of Aave & Compound"
              risk="Low"
            />
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Optimize Your Yield?</h2>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto">
            Join the future of DeFi yield optimization. Start earning passive income with institutional-grade security.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-2xl font-semibold text-lg hover:bg-accent/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/25"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
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

// Simple animated background behind hero text
function AnimatedBackground() {
  return (
    <div className="relative w-full h-full max-w-3xl">
      {/* Orbiting circles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2"
          style={{
            width: 200 + i * 100,
            height: 200 + i * 100,
            marginLeft: -(100 + i * 50),
            marginTop: -(100 + i * 50),
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 20 + i * 10,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div 
            className="absolute rounded-full border border-accent/10"
            style={{
              width: '100%',
              height: '100%',
            }}
          />
          {/* Dot on the orbit */}
          <div 
            className="absolute w-2 h-2 rounded-full bg-accent/30"
            style={{
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
        </motion.div>
      ))}
      
      {/* Pulsing center glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
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
  const riskColor = risk === 'Low' ? 'text-accent' : risk === 'Medium' ? 'text-yellow-400' : 'text-red-400'
  
  return (
    <motion.div 
      variants={cardVariants}
      className="p-6 rounded-2xl bg-surface/30 border border-border hover:border-accent/30 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{name}</h3>
        <span className={`text-xs font-medium ${riskColor}`}>{risk} Risk</span>
      </div>
      <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <motion.div 
      variants={cardVariants}
      className="text-center p-6 rounded-2xl bg-surface/30 border border-border"
    >
      <div className="text-3xl font-bold text-accent mb-1">{value}</div>
      <div className="text-sm text-text-secondary">{label}</div>
    </motion.div>
  )
}
