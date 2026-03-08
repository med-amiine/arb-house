'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { BondCreditLogo } from '@/components/icons/BondCreditLogo'

export function VaultHeader() {
  return (
    <header className="flex items-center justify-between">
      <div>
        <BondCreditLogo className="h-6 w-auto text-white mb-2" />
        <p className="text-text-secondary text-sm">
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
