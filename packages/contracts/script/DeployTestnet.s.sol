// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {BondCreditVault} from "../src/BondCreditVault.sol";
import {MockAgentAdapter} from "../src/MockAgentAdapter.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";

/// @title DeployTestnet
/// @notice Full deployment for testnet testing
/// @dev Deploys: USDC (mock), 3 Agent Adapters, Vault
contract DeployTestnet is Script {
    struct Deployment {
        address usdc;
        address vault;
        address[3] agents;
    }

    function run() external returns (Deployment memory) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address keeper = vm.envAddress("KEEPER_ADDRESS");
        
        // Use existing USDC if provided, otherwise deploy mock
        address usdc = vm.envOr("USDC_ADDRESS", address(0));
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock USDC if needed
        if (usdc == address(0)) {
            MockUSDC mockUsdc = new MockUSDC();
            usdc = address(mockUsdc);
            console.log("MockUSDC deployed:", usdc);
            
            // Mint some USDC to deployer for testing
            MockUSDC(usdc).mint(vm.addr(deployerPrivateKey), 1_000_000e6); // 1M USDC
            console.log("Minted 1M USDC to deployer");
        }

        // Deploy 3 agent adapters with different strategies
        address[3] memory agentAdapters;
        uint256[3] memory creditLimits = [uint256(100_000e6), uint256(100_000e6), uint256(100_000e6)];
        string[3] memory strategies = ["Aave USDC Lending", "Pendle PT Holding", "Morpho Lending"];
        
        for (uint256 i = 0; i < 3; i++) {
            MockAgentAdapter agent = new MockAgentAdapter(
                usdc,
                creditLimits[i],
                strategies[i]
            );
            agentAdapters[i] = address(agent);
            console.log(string.concat("Agent ", vm.toString(i), " deployed:"), address(agent));
            console.log("  Strategy:", strategies[i]);
            console.log("  Credit Limit:", creditLimits[i] / 1e6, "USDC");
        }

        // Deploy vault
        BondCreditVault vault = new BondCreditVault(
            usdc,
            keeper,
            agentAdapters,
            creditLimits
        );
        
        console.log("BondCreditVault deployed:", address(vault));
        console.log("  Keeper:", keeper);
        console.log("  Asset:", usdc);

        // Transfer agent ownership to vault (so vault can call deposit/withdraw)
        for (uint256 i = 0; i < 3; i++) {
            MockAgentAdapter(agentAdapters[i]).transferOwnership(address(vault));
            console.log(string.concat("Agent ", vm.toString(i), " ownership transferred to vault"));
        }

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("USDC:", usdc);
        console.log("Vault:", address(vault));
        console.log("Agent 0:", agentAdapters[0]);
        console.log("Agent 1:", agentAdapters[1]);
        console.log("Agent 2:", agentAdapters[2]);
        console.log("Keeper:", keeper);
        console.log("==========================\n");

        return Deployment({
            usdc: usdc,
            vault: address(vault),
            agents: [
                agentAdapters[0],
                agentAdapters[1],
                agentAdapters[2]
            ]
        });
    }
}
