// Contract Addresses - Arbitrum Sepolia Testnet
// NEW Simplified AgentVault (no sync required)
export const VAULT_ADDRESS = '0x3627bF3832aba2A9eb9e4D82Db6aBdFFd4A75E81' as `0x${string}`
export const USDC_ADDRESS = '0x3d66B0BFebDf2A674273977c73e57Bf6529148a1' as `0x${string}`

// RPC URLs
export const RPC_URL = 'https://arb-sepolia.g.alchemy.com/v2/7JENWA60Eynfh2ipu6KWZ'

// AgentVault ABI - Simplified for agent competition
export const VAULT_ABI = [
  // Deposit/Withdraw (ERC4626)
  {
    inputs: [{ name: 'assets', type: 'uint256' }, { name: 'receiver', type: 'address' }],
    name: 'deposit',
    outputs: [{ name: 'shares', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'shares', type: 'uint256' }, { name: 'receiver', type: 'address' }, { name: 'owner', type: 'address' }],
    name: 'redeem',
    outputs: [{ name: 'assets', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'assets', type: 'uint256' }],
    name: 'previewDeposit',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'shares', type: 'uint256' }],
    name: 'previewRedeem',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Balance/Allowance
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
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
    inputs: [],
    name: 'totalAllocated',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Agent Management
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'agents',
    outputs: [
      { name: 'agentAddress', type: 'address' },
      { name: 'creditLine', type: 'uint256' },
      { name: 'borrowed', type: 'uint256' },
      { name: 'performanceScore', type: 'uint256' },
      { name: 'totalProfit', type: 'uint256' },
      { name: 'totalLoss', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'registrationTime', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_agent', type: 'address' }],
    name: 'getAgentInfo',
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'agentAddress', type: 'address' },
        { name: 'creditLine', type: 'uint256' },
        { name: 'borrowed', type: 'uint256' },
        { name: 'performanceScore', type: 'uint256' },
        { name: 'totalProfit', type: 'uint256' },
        { name: 'totalLoss', type: 'uint256' },
        { name: 'isActive', type: 'bool' },
        { name: 'registrationTime', type: 'uint256' },
      ]
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllAgents',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'agentList',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Allocation
  {
    inputs: [{ name: '_agent', type: 'address' }, { name: '_amount', type: 'uint256' }],
    name: 'allocateToAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }, { name: '', type: 'uint256' }],
    name: 'userAllocations',
    outputs: [
      { name: 'agent', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const USDC_ABI = [
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
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
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
