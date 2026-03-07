# Bond Credit Vault Frontend

## Environment Variables

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_VAULT_ADDRESS=0x910a7b063021eC417227F3Cb7f0178f28bc0BA4E
NEXT_PUBLIC_USDC_ADDRESS=0xd51391fa22b32E87c1B7Ebe5a8Db412dc7c15A92
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

## Features

- Connect wallet (RainbowKit)
- Deposit USDC
- Request withdrawal (async)
- View share price and TVL
- Monitor agent allocations
