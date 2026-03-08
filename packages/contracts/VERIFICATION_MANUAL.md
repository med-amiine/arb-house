# Manual Contract Verification Guide

Since automatic verification is having issues with Arbiscan's API, here are the steps to manually verify the contracts.

## Contract Details

| Contract | Address | Flattened File |
|----------|---------|----------------|
| BondCreditVault | 0xEAEa45b8078f9fcA46DFb42b16016c8C234F7ff3 | flattened/BondCreditVault.flattened.sol |
| MockUSDC | 0xA92a00D083D9De8cD18B08fC2DDE27298633e422 | flattened/MockUSDC.flattened.sol |
| Agent 0 | 0xA004df2beeF4EF4a58333B814A16c677c1DF4E64 | flattened/MockAgentAdapter.flattened.sol |
| Agent 1 | 0xfE435387201D3327983d19293B60C1C014E61650 | flattened/MockAgentAdapter.flattened.sol |
| Agent 2 | 0xD86bc69b52508368622E4F9f8f70a603FFbFC89C | flattened/MockAgentAdapter.flattened.sol |

## Manual Verification Steps

### 1. BondCreditVault

Go to: https://sepolia.arbiscan.io/verifyContract?a=0xEAEa45b8078f9fcA46DFb42b16016c8C234F7ff3

**Settings:**
- Compiler Type: Solidity (Single file)
- Compiler Version: v0.8.20+commit.a1b79de6
- Open Source License Type: MIT License (MIT)
- Optimization: Yes, with 200 runs
- EVM Version: Default (Paris/Shanghai)

**Constructor Arguments (ABI-encoded):**
```
0x000000000000000000000000a92a00d083d9de8cd18b08fc2dde27298633e422000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000a004df2beef4ef4a58333b814a16c677c1df4e64000000000000000000000000fe435387201d3327983d19293b60c1c014e61650000000000000000000000000d86bc69b52508368622e4f9f8f70a603ffbfc89c000000000000000000000000000000000000000000000000000000174876e800000000000000000000000000000000000000000000000000000000174876e800000000000000000000000000000000000000000000000000000000174876e800
```

**Source Code:** Copy contents of `flattened/BondCreditVault.flattened.sol`

### 2. MockUSDC

Go to: https://sepolia.arbiscan.io/verifyContract?a=0xA92a00D083D9De8cD18B08fC2DDE27298633e422

**Settings:**
- Compiler Type: Solidity (Single file)
- Compiler Version: v0.8.20+commit.a1b79de6
- Open Source License Type: MIT License (MIT)
- Optimization: Yes, with 200 runs

**Constructor Arguments:** None

**Source Code:** Copy contents of `flattened/MockUSDC.flattened.sol`

### 3. MockAgentAdapter (for all 3 agents)

Go to: 
- Agent 0: https://sepolia.arbiscan.io/verifyContract?a=0xA004df2beeF4EF4a58333B814A16c677c1DF4E64
- Agent 1: https://sepolia.arbiscan.io/verifyContract?a=0xfE435387201D3327983d19293B60C1C014E61650
- Agent 2: https://sepolia.arbiscan.io/verifyContract?a=0xD86bc69b52508368622E4F9f8f70a603FFbFC89C

**Settings:**
- Compiler Type: Solidity (Single file)
- Compiler Version: v0.8.20+commit.a1b79de6
- Open Source License Type: MIT License (MIT)
- Optimization: Yes, with 200 runs

**Constructor Arguments for each Agent:**

**Agent 0:**
```
0x000000000000000000000000a92a00d083d9de8cd18b08fc2dde27298633e422000000000000000000000000000000000000000000000000000000174876e80000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000011416176652055534443204c656e64696e67000000000000000000000000000000
```

**Agent 1:**
```
0x000000000000000000000000a92a00d083d9de8cd18b08fc2dde27298633e422000000000000000000000000000000000000000000000000000000174876e8000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000001050656e646c6520505420486f6c64696e67000000000000000000000000000000
```

**Agent 2:**
```
0x000000000000000000000000a92a00d083d9de8cd18b08fc2dde27298633e422000000000000000000000000000000000000000000000000000000174876e8000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000d4d6f7270686f204c656e64696e67000000000000000000000000000000000000
```

**Source Code:** Copy contents of `flattened/MockAgentAdapter.flattened.sol`

## Alternative: Run the verification script

```bash
cd packages/contracts
./verify_arbiscan.sh
```

## Check Verification Status

- Vault: https://sepolia.arbiscan.io/address/0xEAEa45b8078f9fcA46DFb42b16016c8C234F7ff3#code
- USDC: https://sepolia.arbiscan.io/address/0xA92a00D083D9De8cD18B08fC2DDE27298633e422#code
