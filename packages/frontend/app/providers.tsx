'use client'

import * as React from 'react'
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit'
import { rabbyWallet } from '@rainbow-me/rainbowkit/wallets'
import { WagmiProvider } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const config = getDefaultConfig({
  appName: 'bond.credit',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '7efde86d6f5ee30bddcb4c0dc4173daf',
  chains: [arbitrumSepolia],
  ssr: true,
  wallets: [{
    groupName: 'Popular',
    wallets: [
      rabbyWallet,
    ],
  }],
})

const queryClient = new QueryClient()

const customTheme = darkTheme({
  accentColor: '#059669',
  accentColorForeground: '#ffffff',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
})

// ClientOnly wrapper prevents SSR issues with localStorage
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return mounted ? <>{children}</> : null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ClientOnly>
          <RainbowKitProvider 
            theme={customTheme}
            modalSize="compact"
            coolMode
          >
            {children}
          </RainbowKitProvider>
        </ClientOnly>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
