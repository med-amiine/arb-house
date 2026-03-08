// Mock data for development/demo purposes
// These are used when the backend has no data yet

export interface Transaction {
  id: string
  type: 'deposit' | 'withdraw_request' | 'withdraw_complete'
  amount: string
  shares: string
  asset: string
  user: string
  timestamp: string
  block_number: number
  tx_hash: string
}

// Generate mock transactions for demo
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'mock-1',
    type: 'deposit',
    amount: '5000.00',
    shares: '4950.50',
    asset: 'USDC',
    user: '0x742d35Cc6634C0532925a3b8D4C9db96590f6C7E',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    block_number: 12345678,
    tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  },
  {
    id: 'mock-2',
    type: 'deposit',
    amount: '2500.00',
    shares: '2475.25',
    asset: 'USDC',
    user: '0x8ba1f109551bD432803012645Hac136c82C3e8C9',
    timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), // 1.5 days ago
    block_number: 12345700,
    tx_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  },
  {
    id: 'mock-3',
    type: 'deposit',
    amount: '10000.00',
    shares: '9901.00',
    asset: 'USDC',
    user: '0x742d35Cc6634C0532925a3b8D4C9db96590f6C7E',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    block_number: 12345800,
    tx_hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
  },
  {
    id: 'mock-4',
    type: 'withdraw_request',
    amount: '2000.00',
    shares: '1980.20',
    asset: 'USDC',
    user: '0x8ba1f109551bD432803012645Hac136c82C3e8C9',
    timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    block_number: 12345900,
    tx_hash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
  },
  {
    id: 'mock-5',
    type: 'deposit',
    amount: '7500.00',
    shares: '7425.75',
    asset: 'USDC',
    user: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hours ago
    block_number: 12346000,
    tx_hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  },
  {
    id: 'mock-6',
    type: 'withdraw_complete',
    amount: '1500.00',
    shares: '1485.15',
    asset: 'USDC',
    user: '0x8ba1f109551bD432803012645Hac136c82C3e8C9',
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
    block_number: 12346100,
    tx_hash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  },
]

// Mock yield history showing growth from deposits
export const MOCK_YIELD_HISTORY = [
  { date: '2024-11-01', apy: 0, tvl: 0, deposits: 0 },
  { date: '2024-11-15', apy: 6.2, tvl: 5000, deposits: 5000 },
  { date: '2024-12-01', apy: 7.1, tvl: 12500, deposits: 7500 },
  { date: '2024-12-15', apy: 7.8, tvl: 22500, deposits: 10000 },
  { date: '2025-01-01', apy: 8.2, tvl: 30000, deposits: 7500 },
  { date: '2025-01-15', apy: 8.5, tvl: 38000, deposits: 8000 },
  { date: '2025-02-01', apy: 8.8, tvl: 45000, deposits: 7000 },
  { date: '2025-02-15', apy: 9.1, tvl: 52000, deposits: 7000 },
  { date: '2025-03-01', apy: 9.4, tvl: 60000, deposits: 8000 },
  { date: '2025-03-08', apy: 9.78, tvl: 65000, deposits: 5000 },
]

// Get transactions with fallback to mock data
export function getTransactionsWithFallback(
  apiTransactions: Transaction[], 
  minCount: number = 3
): Transaction[] {
  if (apiTransactions.length >= minCount) {
    return apiTransactions
  }
  
  // Mix real transactions with mock ones if needed
  const needed = minCount - apiTransactions.length
  const mockToUse = MOCK_TRANSACTIONS.slice(0, needed).map((tx, i) => ({
    ...tx,
    id: `mock-${Date.now()}-${i}`, // Ensure unique IDs
  }))
  
  return [...apiTransactions, ...mockToUse]
}

// Get yield history with deposit growth data
export function getYieldHistoryWithDeposits(): typeof MOCK_YIELD_HISTORY {
  return MOCK_YIELD_HISTORY
}
