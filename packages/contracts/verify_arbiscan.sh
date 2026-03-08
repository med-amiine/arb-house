#!/bin/bash
# Contract Verification Script for Arbitrum Sepolia using Standard JSON Input

set -e

ARBISCAN_API_KEY="${ARBISCAN_API_KEY:-VB2JSK9GINK5Q6QKZTSCY3E6HABNJ59EV8}"
CHAIN_ID="421614"

# Contract addresses
USDC="0xA92a00D083D9De8cD18B08fC2DDE27298633e422"
VAULT="0xEAEa45b8078f9fcA46DFb42b16016c8C234F7ff3"
AGENT0="0xA004df2beeF4EF4a58333B814A16c677c1DF4E64"
AGENT1="0xfE435387201D3327983d19293B60C1C014E61650"
AGENT2="0xD86bc69b52508368622E4F9f8f70a603FFbFC89C"

echo "=============================================="
echo "Contract Verification for Arbitrum Sepolia"
echo "=============================================="
echo ""

# Verify BondCreditVault
echo "[1/5] Verifying BondCreditVault..."
echo "Address: $VAULT"
echo ""

forge verify-contract \
    "$VAULT" \
    src/BondCreditVault.sol:BondCreditVault \
    --chain arbitrum-sepolia \
    --etherscan-api-key "$ARBISCAN_API_KEY" \
    --compiler-version "v0.8.20+commit.a1b79de6" \
    --num-of-optimizations 200 \
    --constructor-args $(cast abi-encode "constructor(address,address,address[3],uint256[3])" \
        "$USDC" \
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
        "[$AGENT0,$AGENT1,$AGENT2]" \
        "[100000000000,100000000000,100000000000]") 2>&1 || echo "Verification pending or failed"

echo ""
echo "[2/5] Verifying MockUSDC..."
forge verify-contract \
    "$USDC" \
    src/mocks/MockUSDC.sol:MockUSDC \
    --chain arbitrum-sepolia \
    --etherscan-api-key "$ARBISCAN_API_KEY" \
    --compiler-version "v0.8.20+commit.a1b79de6" \
    --num-of-optimizations 200 2>&1 || echo "Verification pending or failed"

echo ""
echo "[3/5] Verifying Agent 0..."
forge verify-contract \
    "$AGENT0" \
    src/MockAgentAdapter.sol:MockAgentAdapter \
    --chain arbitrum-sepolia \
    --etherscan-api-key "$ARBISCAN_API_KEY" \
    --compiler-version "v0.8.20+commit.a1b79de6" \
    --num-of-optimizations 200 2>&1 || echo "Verification pending or failed"

echo ""
echo "[4/5] Verifying Agent 1..."
forge verify-contract \
    "$AGENT1" \
    src/MockAgentAdapter.sol:MockAgentAdapter \
    --chain arbitrum-sepolia \
    --etherscan-api-key "$ARBISCAN_API_KEY" \
    --compiler-version "v0.8.20+commit.a1b79de6" \
    --num-of-optimizations 200 2>&1 || echo "Verification pending or failed"

echo ""
echo "[5/5] Verifying Agent 2..."
forge verify-contract \
    "$AGENT2" \
    src/MockAgentAdapter.sol:MockAgentAdapter \
    --chain arbitrum-sepolia \
    --etherscan-api-key "$ARBISCAN_API_KEY" \
    --compiler-version "v0.8.20+commit.a1b79de6" \
    --num-of-optimizations 200 2>&1 || echo "Verification pending or failed"

echo ""
echo "=============================================="
echo "Verification process completed!"
echo "=============================================="
echo ""
echo "Check verification status at:"
echo "Vault: https://sepolia.arbiscan.io/address/$VAULT"
echo "USDC:  https://sepolia.arbiscan.io/address/$USDC"
