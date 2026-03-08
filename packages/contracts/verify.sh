#!/bin/bash
# Contract Verification Script for Arbitrum Sepolia
# Usage: ARBISCAN_API_KEY=your_key ./verify.sh

set -e

if [ -z "$ARBISCAN_API_KEY" ]; then
    echo "Error: ARBISCAN_API_KEY not set"
    echo "Get your API key at: https://sepolia.arbiscan.io/myapikey"
    exit 1
fi

echo "Verifying contracts on Arbitrum Sepolia..."

# Verify MockUSDC
forge verify-contract \
    0xA92a00D083D9De8cD18B08fC2DDE27298633e422 \
    src/mocks/MockUSDC.sol:MockUSDC \
    --chain arbitrum-sepolia \
    --etherscan-api-key $ARBISCAN_API_KEY

echo "✓ MockUSDC verified"

# Verify BondCreditVault
forge verify-contract \
    0xEAEa45b8078f9fcA46DFb42b16016c8C234F7ff3 \
    src/BondCreditVault.sol:BondCreditVault \
    --chain arbitrum-sepolia \
    --etherscan-api-key $ARBISCAN_API_KEY \
    --constructor-args $(cast abi-encode "constructor(address,address,address[3],uint256[3])" \
        0xA92a00D083D9De8cD18B08fC2DDE27298633e422 \
        0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
        "[0xA004df2beeF4EF4a58333B814A16c677c1DF4E64,0xfE435387201D3327983d19293B60C1C014E61650,0xD86bc69b52508368622E4F9f8f70a603FFbFC89C]" \
        "[100000000000,100000000000,100000000000]")

echo "✓ BondCreditVault verified"

# Verify MockAgentAdapters
AGENTS=(
    "0xA004df2beeF4EF4a58333B814A16c677c1DF4E64"
    "0xfE435387201D3327983d19293B60C1C014E61650"
    "0xD86bc69b52508368622E4F9f8f70a603FFbFC89C"
)

for i in "${!AGENTS[@]}"; do
    forge verify-contract \
        "${AGENTS[$i]}" \
        src/MockAgentAdapter.sol:MockAgentAdapter \
        --chain arbitrum-sepolia \
        --etherscan-api-key $ARBISCAN_API_KEY
    echo "✓ Agent $i verified"
done

echo ""
echo "=== All contracts verified! ==="
