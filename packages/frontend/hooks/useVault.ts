'use client'

import { useReadContract, useAccount } from 'wagmi'
import { formatUnits } from 'viem'

const VAULT_ABI = [
  {
    inputs: [],
    name: 'totalAssets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'shares', type: 'uint256' }],
    name: 'convertToAssets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'agents',
    outputs: [
      { name: 'adapter', type: 'address' },
      { name: 'creditLimit', type: 'uint256' },
      { name: 'currentBalance', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`
const USDC_DECIMALS = 6

export function useVaultData() {
  const { address } = useAccount()
  
  const { data: totalAssets, isLoading: isLoadingAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
  })
  
  const { data: totalSupply, isLoading: isLoadingSupply } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalSupply',
  })
  
  const { data: userShares, isLoading: isLoadingShares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })
  
  const { data: userAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'convertToAssets',
    args: userShares ? [userShares] : undefined,
    query: {
      enabled: !!userShares,
    },
  })
  
  // Calculate share price
  let sharePrice = 1.0
  let sharePriceChange = 0
  
  if (totalAssets && totalSupply && totalSupply > BigInt(0)) {
    const assetsNum = Number(formatUnits(totalAssets, USDC_DECIMALS))
    const supplyNum = Number(formatUnits(totalSupply, USDC_DECIMALS))
    sharePrice = assetsNum / supplyNum
    
    // Mock change for now - would come from historical data
    sharePriceChange = 2.45
  }
  
  // Fetch agent data
  const agents = []
  for (let i = 0; i < 3; i++) {
    const { data: agentData } = useReadContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'agents',
      args: [BigInt(i)],
    })
    
    if (agentData) {
      const balance = Number(formatUnits(agentData[2], USDC_DECIMALS))
      const tvl = totalAssets ? Number(formatUnits(totalAssets, USDC_DECIMALS)) : 0
      agents.push({
        name: `Agent ${['Alpha', 'Beta', 'Gamma'][i]}`,
        balance,
        weight: tvl > 0 ? (balance / tvl) * 100 : 0,
        targetWeight: 33.33,
      })
    }
  }
  
  return {
    sharePrice,
    sharePriceChange,
    tvl: totalAssets ? Number(formatUnits(totalAssets, USDC_DECIMALS)) : 0,
    userShares: userShares ? Number(formatUnits(userShares, USDC_DECIMALS)) : 0,
    userAssets: userAssets ? Number(formatUnits(userAssets, USDC_DECIMALS)) : 0,
    agents: agents.length > 0 ? agents : undefined,
    isLoading: isLoadingAssets || isLoadingSupply || isLoadingShares,
  }
}
