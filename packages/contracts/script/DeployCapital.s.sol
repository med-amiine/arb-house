// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {BondCreditVault} from "../src/BondCreditVault.sol";
import {MockAgentAdapter} from "../src/MockAgentAdapter.sol";

/// @title DeployCapital
/// @notice Deploy vault capital to agents (called by keeper)
contract DeployCapital is Script {
    
    function run() external {
        uint256 keeperPrivateKey = vm.envUint("KEEPER_PRIVATE_KEY");
        address vault = vm.envAddress("VAULT_ADDRESS");
        
        // Amount to deploy to each agent
        uint256[3] memory amounts = [
            uint256(30_000e6), // 30k to Agent 0
            uint256(30_000e6), // 30k to Agent 1
            uint256(30_000e6)  // 30k to Agent 2
        ];
        
        vm.startBroadcast(keeperPrivateKey);

        // Deploy capital to each agent
        for (uint256 i = 0; i < 3; i++) {
            (address adapter,,,) = BondCreditVault(vault).agents(i);
            
            // Note: In actual implementation, keeper calls agent via Giza SDK
            // This is a simplified version for testing
            MockAgentAdapter(adapter).deposit(amounts[i]);
            
            console.log(string.concat("Deployed ", vm.toString(amounts[i] / 1e6), " USDC to Agent ", vm.toString(i)));
        }

        // Sync balances
        uint256[3] memory balances;
        for (uint256 i = 0; i < 3; i++) {
            (address adapter,,,) = BondCreditVault(vault).agents(i);
            balances[i] = MockAgentAdapter(adapter).balance();
        }
        
        BondCreditVault(vault).syncBalances(balances);
        console.log("Balances synced to vault");

        vm.stopBroadcast();

        console.log("\n=== CAPITAL DEPLOYMENT COMPLETE ===");
        console.log("Total deployed:", (amounts[0] + amounts[1] + amounts[2]) / 1e6, "USDC");
    }
}
