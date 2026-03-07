import { createPublicClient, http } from 'viem'
import { arbitrum, arbitrumSepolia } from 'viem/chains'

export const chain = process.env.NEXT_PUBLIC_CHAIN_ID === '42161' ? arbitrum : arbitrumSepolia

export const publicClient = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
})
