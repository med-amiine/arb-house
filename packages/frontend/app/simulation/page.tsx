'use client'

import { useState, useEffect } from 'react'
import { useVaultData } from '@/hooks/useVault'
import { useAccount } from 'wagmi'
import { formatNumber } from '@/lib/utils'

export default function SimulationPage() {
  const { address } = useAccount()
  const { sharePrice, tvl, userShares, userAssets, agents, isLoading } = useVaultData()
  const [userAddress, setUserAddress] = useState<string>(address || '0xUser1')

  // Update user address when wallet connects
  useEffect(() => {
    if (address) {
      setUserAddress(address)
    }
  }, [address])

  const metrics = {
    totalAssets: tvl,
    totalShares: tvl / sharePrice,
    sharePrice,
    totalUsers: 1,
  }

  const displayAgents = agents ? agents.map((agent, index) => ({
    name: agent.name,
    assets: agent.balance.toString(),
  })) : []

  const displayUsers = userShares ? [{
    address: userAddress,
    shares: userShares.toString(),
    claimableAssets: userAssets?.toString() || '0',
    totalDeposited: userAssets?.toString() || '0',
    totalWithdrawn: '0',
    netGain: '0',
  }] : []

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Vault Simulation</h1>
          <p className="text-text-secondary">Real-time vault data from Arbitrum Sepolia testnet</p>
        </div>

        {/* Controls */}
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Wallet Address</label>
              <input
                type="text"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                className="w-full px-3 py-2 bg-void border border-border rounded-lg"
                placeholder="0x..."
              />
            </div>
            <div className="flex items-end">
              <div className="w-full">
                <div className="text-sm text-text-secondary mb-1">Connected Wallet</div>
                <div className="px-3 py-2 bg-void border border-border rounded-lg font-mono text-sm">
                  {address || 'Not connected'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-sm font-medium text-text-secondary">Total Assets</h3>
            <p className="text-2xl font-bold">{isLoading ? '...' : `$${formatNumber(metrics.totalAssets)}`}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-sm font-medium text-text-secondary">Total Shares</h3>
            <p className="text-2xl font-bold">{isLoading ? '...' : formatNumber(metrics.totalShares)}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-sm font-medium text-text-secondary">Share Price</h3>
            <p className="text-2xl font-bold">{isLoading ? '...' : `$${metrics.sharePrice.toFixed(4)}`}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-sm font-medium text-text-secondary">Users</h3>
            <p className="text-2xl font-bold">{metrics.totalUsers}</p>
          </div>
        </div>

        {/* Agents */}
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayAgents.map((agent, index) => (
              <div key={index} className="p-4 border border-border rounded-lg">
                <h3 className="font-medium">{agent.name}</h3>
                <p className="text-2xl font-bold text-accent">{isLoading ? '...' : `$${parseFloat(agent.assets).toFixed(2)}`}</p>
                <p className="text-sm text-text-secondary">Current Balance</p>
              </div>
            ))}
          </div>
        </div>

        {/* Users */}
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2">Address</th>
                  <th className="text-right p-2">Shares</th>
                  <th className="text-right p-2">Claimable</th>
                  <th className="text-right p-2">Deposited</th>
                  <th className="text-right p-2">Withdrawn</th>
                  <th className="text-right p-2">Net Gain</th>
                </tr>
              </thead>
              <tbody>
                {displayUsers.map((user, index) => (
                  <tr key={index} className="border-b border-border">
                    <td className="p-2 font-mono text-sm">{user.address}</td>
                    <td className="p-2 text-right">{parseFloat(user.shares).toFixed(2)}</td>
                    <td className="p-2 text-right">{parseFloat(user.claimableAssets).toFixed(2)}</td>
                    <td className="p-2 text-right">{parseFloat(user.totalDeposited).toFixed(2)}</td>
                    <td className="p-2 text-right">{parseFloat(user.totalWithdrawn).toFixed(2)}</td>
                    <td className="p-2 text-right">{parseFloat(user.netGain).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}