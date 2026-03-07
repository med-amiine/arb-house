# Keeper API Testing Guide

## Current Status

✅ Keeper service is running on `localhost:8000`
✅ Nginx reverse proxy is running on port 80
⚠️ External access blocked by cloud security group (port 80 not open)

## Local Testing (works now)

```bash
# Test root endpoint
curl http://localhost/
# Output: {"service":"BCV Keeper","version":"0.1.0","vault":"0x910a7b063021eC417227F3Cb7f0178f28bc0BA4E","chain_id":421614}

# Test health endpoint
curl http://localhost/health
# Output: {"status":"healthy","vault":"0x910a7b063021eC417227F3Cb7f0178f28bc0BA4E","chain_id":421614,"last_sync":null,"pending_withdrawals":0,"queue_depth":0}

# Test readiness
curl http://localhost/health/ready
# Output: {"ready":true}

# Test liveness
curl http://localhost/health/live
# Output: {"alive":true}
```

## Exposed Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/health` | GET | Health status with metrics |
| `/health/ready` | GET | Kubernetes readiness probe |
| `/health/live` | GET | Kubernetes liveness probe |

## To Enable External Access

Option 1: Open port 80 in security group
```bash
# For Alibaba Cloud, run on host:
# Security Groups -> Inbound Rules -> Add Rule
# Port Range: 80/80
# Source: 0.0.0.0/0
```

Option 2: Use SSH tunnel (recommended for testing)
```bash
# From your local machine:
ssh -L 8080:localhost:80 root@47.84.17.138
# Then access http://localhost:8080 on your machine
```

Option 3: Use Railway (production)
```bash
# Deploy to Railway for public HTTPS URL
railway login
railway link
cd packages/keeper && railway up
```

## Server Details

- **Public IP**: 47.84.17.138
- **Internal API**: http://localhost:8000 (direct)
- **Nginx Proxy**: http://localhost (port 80)
- **Process ID**: `cat /root/.openclaw/workspace/open-house-project/packages/keeper/keeper.pid`
- **Logs**: `/root/.openclaw/workspace/open-house-project/packages/keeper/keeper.log`

## Contract Connection

The keeper is configured to connect to:
- **Network**: Arbitrum Sepolia (chain ID: 421614)
- **Vault**: 0x910a7b063021eC417227F3Cb7f0178f28bc0BA4E
- **RPC**: https://arbitrum-sepolia.drpc.org

## Next Steps

1. Open port 80 in security group OR use SSH tunnel
2. Test external access: `curl http://47.84.17.138/health`
3. Deploy frontend to Vercel
4. Update frontend API URL to point to keeper
