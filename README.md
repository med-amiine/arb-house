# Arb House - Bond Credit Vault

Decentralized lending protocol with AI-powered yield optimization on Arbitrum.

## 🔒 Security First

This repository uses **GitHub Secrets** for all sensitive data. Never commit:
- API tokens
- Private keys
- Database credentials
- Environment files

## 📁 Structure

```
packages/
├── contracts/    # Solidity smart contracts (Foundry)
├── keeper/       # Python automation service (FastAPI)
└── frontend/     # Next.js 14 web application
```

## 🚀 Deployment (Free Tier)

Deployments are automated via **GitHub Actions**:
- **Frontend** → Vercel (on push to main)
- **Keeper** → Railway (on push to main)

### Required GitHub Secrets

Add these in Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| `VERCEL` | Your Vercel API token |
| `RAILWAYS` | Your Railway API token |

### Required GitHub Variables

Add these in Settings → Secrets and variables → Actions (Variables tab):

| Variable | Default Value |
|----------|---------------|
| `VAULT_ADDRESS` | `0x910a7b063021eC417227F3Cb7f0178f28bc0BA4E` |
| `USDC_ADDRESS` | `0xA526233CdaAd2Ed586908E5D9B3446e0A6F262E5` |
| `WALLETCONNECT_PROJECT_ID` | `7efde86d6f5ee30bddcb4c0dc4173daf` |
| `VERCEL_ORG_ID` | `team_xaa4wm9qbJIzONgCoGLc20eD` |
| `VERCEL_PROJECT_ID` | `prj_M1KNmwlNbvWxO3qjYQZCWl4DtHBX` |

## 🌐 Networks

- **Testnet**: Arbitrum Sepolia (Chain ID: 421614)

## 📜 Deployed Contracts

| Contract | Address |
|----------|---------|
| BondCreditVault | `0x910a7b063021eC417227F3Cb7f0178f28bc0BA4E` |
| MockUSDC | `0xA526233CdaAd2Ed586908E5D9B3446e0A6F262E5` |

## 🛠️ Local Development

```bash
# Contracts
cd packages/contracts
forge build
forge test

# Keeper
cd packages/keeper
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd packages/frontend
npm install
npm run dev
```

## 📄 License

MIT
