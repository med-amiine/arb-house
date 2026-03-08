'use client'

import { useAccount, useReadContract } from 'wagmi'
import { VAULT_ADDRESS, VAULT_ABI, USDC_ADDRESS, USDC_ABI } from '@/lib/contracts'
import { formatUnits } from 'viem'
import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, PiggyBank, ArrowUpRight } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import Link from 'next/link'

export function UserGlassCard() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get user's BCV shares
  const { data: shares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Convert shares to assets
  const { data: assets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'convertToAssets',
    args: shares ? [shares] : undefined,
    query: { enabled: !!shares }
  })

  // Get user's USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  if (!mounted) return null

  if (!isConnected) {
    return (
      <div className="card p-8 text-center">
        <Wallet className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium">Connect Wallet</h3>
        <p className="text-text-secondary text-sm mt-2">
          Connect to view your portfolio
        </p>
      </div>
    )
  }

  const balance = assets ? Number(formatUnits(assets, 6)) : 0
  const sharesNum = shares ? Number(formatUnits(shares, 18)) : 0
  const usdcNum = usdcBalance ? Number(formatUnits(usdcBalance, 6)) : 0
  
  const totalValue = balance + usdcNum

  return (
    <div 
      className="relative overflow-hidden rounded-2xl p-8 animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Background glow effects */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-text-secondary text-sm">Your Balance</p>
            <h2 className="text-4xl font-bold mt-1">
              ${formatNumber(totalValue)}
            </h2>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
            <Wallet className="w-7 h-7 text-white" />
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
              <PiggyBank className="w-4 h-4" />
              Shares
            </div>
            <div className="text-xl font-mono font-medium">
              {formatNumber(sharesNum)}
            </div>
            <div className="text-xs text-text-muted">BCV</div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Vault Balance
            </div>
            <div className="text-xl font-mono font-medium text-accent">
              ${formatNumber(balance)}
            </div>
            <div className="text-xs text-accent/70">USDC</div>
          </div>
        </div>
        
        {/* Progress bar */}
        {totalValue > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">In Vault</span>
              <span className="text-text-secondary">In Wallet</span>
            </div>
            <div className="h-3 bg-black/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-accent to-purple-500 transition-all duration-1000"
                style={{ width: `${totalValue > 0 ? (balance / totalValue) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>${formatNumber(balance)}</span>
              <span>${formatNumber(usdcNum)}</span>
            </div>
          </div>
        )}
        
        {/* Quick actions */}
        <div className="flex gap-3 mt-6">
          <Link 
            href="/deposit"
            className="flex-1 py-3 bg-accent rounded-xl font-medium text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
          >
            Deposit
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/withdraw"
            className="flex-1 py-3 bg-white/10 rounded-xl font-medium text-sm hover:bg-white/20 transition-colors text-center"
          >
            Withdraw
          </Link>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
