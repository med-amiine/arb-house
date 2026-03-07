# Arb House - Bond Credit Vault

Decentralized lending protocol with AI-powered yield optimization on Arbitrum.

## Security

This repository uses GitHub Secrets for all sensitive data. Never commit:
- API tokens
- Private keys
- Database credentials
- Environment files

## Structure

```
packages/
├── contracts/    # Solidity smart contracts (Foundry)
├── keeper/       # Python automation service (FastAPI)
└── frontend/     # Next.js web application
```

## Deployment

Deployments are automated via GitHub Actions:
- **Frontend** → Vercel (on push to main)
- **Keeper** → Railway (on push to main)

### Required Secrets

Add these in GitHub Settings → Secrets:
- `VERCEL` - Vercel API token
- `RAILWAYS` - Railway API token

### Required Variables

Add these in GitHub Settings → Variables:
- `VAULT_ADDRESS` - Deployed vault contract
- `USDC_ADDRESS` - USDC token contract
- `WALLETCONNECT_PROJECT_ID` - WalletConnect project ID

## Networks

- **Testnet**: Arbitrum Sepolia (Chain ID: 421614)

## License

MIT
