# Bond Credit Vault Frontend

## Environment Variables

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_API_URL=https://bcv-keeper-production.up.railway.app
NEXT_PUBLIC_VAULT_ADDRESS=0x910a7b063021eC417227F3Cb7f0178f28bc0BA4E
NEXT_PUBLIC_USDC_ADDRESS=0xA526233CdaAd2Ed586908E5D9B3446e0A6F262E5
NEXT_PUBLIC_CHAIN_ID=421614
NEXT_PUBLIC_RPC_URL=https://arbitrum-sepolia.drpc.org
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## Live Deployment

- **Frontend:** https://vclean-amber.vercel.app
- **Keeper API:** https://bcv-keeper-production.up.railway.app
- **Network:** Arbitrum Sepolia (Chain ID: 421614)

## Features

- Connect wallet (RainbowKit + Wagmi)
- Deposit USDC for BCV shares
- Request async withdrawal
- View share price, TVL, and APY
- Monitor AI agent allocations
- Real-time transaction status

## Architecture

- Next.js 14 with App Router
- Tailwind CSS for styling
- RainbowKit for wallet connection
- Wagmi for blockchain interactions
- Viem for encoding/decoding
