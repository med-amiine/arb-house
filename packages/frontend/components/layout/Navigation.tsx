'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Vault, History, Menu, X, LayoutDashboard, TrendingUp, Crown } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Home', icon: Vault },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vault-analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/transactions', label: 'History', icon: History },
  { href: '/admin', label: 'Admin', icon: Crown },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-void/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
              <Vault className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight group-hover:text-accent transition-colors">
              BCV
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden md:block">
            <ConnectButton />
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-surface"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
            <div className="pt-4 px-4">
              <ConnectButton />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
