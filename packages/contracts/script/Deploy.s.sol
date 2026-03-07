// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {BondCreditVault} from "../src/BondCreditVault.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address keeper = vm.envAddress("KEEPER_ADDRESS");
        address usdc = vm.envOr("USDC_ADDRESS", address(0));
        
        // Agent configuration
        address[3] memory agentAdapters = [
            vm.envOr("AGENT_1_ADAPTER", address(0)),
            vm.envOr("AGENT_2_ADAPTER", address(0)),
            vm.envOr("AGENT_3_ADAPTER", address(0))
        ];
        
        uint256[3] memory creditLimits = [
            vm.envOr("AGENT_1_CREDIT_LIMIT", uint256(1_000_000e6)),
            vm.envOr("AGENT_2_CREDIT_LIMIT", uint256(1_000_000e6)),
            vm.envOr("AGENT_3_CREDIT_LIMIT", uint256(1_000_000e6))
        ];
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy mock USDC if not provided (local/testing only)
        if (usdc == address(0)) {
            MockUSDC mockUsdc = new MockUSDC();
            usdc = address(mockUsdc);
            console.log("MockUSDC deployed to:", usdc);
        }
        
        // Deploy vault
        BondCreditVault vault = new BondCreditVault(
            usdc,
            keeper,
            agentAdapters,
            creditLimits
        );
        
        vm.stopBroadcast();
        
        console.log("BondCreditVault deployed to:", address(vault));
        console.log("Asset (USDC):", vault.asset());
        console.log("Keeper:", vault.keeper());
        console.log("Owner:", vault.owner());
    }
}
