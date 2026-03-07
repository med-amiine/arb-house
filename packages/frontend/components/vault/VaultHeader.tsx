'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export function VaultHeader() {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Bond Credit Vault
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Institutional credit for the agentic economy
        </p>
      </div>
      <ConnectButton 
        showBalance={false}
        accountStatus="address"
        chainStatus="icon"
      />
    </header>
  )
}
