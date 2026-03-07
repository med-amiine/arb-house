// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MockAgentAdapter} from "../src/MockAgentAdapter.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {BondCreditVault} from "../src/BondCreditVault.sol";

/// @title SimulateYield
/// @notice Inject yield into agents to test accounting and rebalancing
contract SimulateYield is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address vault = vm.envAddress("VAULT_ADDRESS");
        
        // Load agent addresses from deployment or env
        address[3] memory agents = [
            vm.envOr("AGENT_0_ADDRESS", address(0)),
            vm.envOr("AGENT_1_ADDRESS", address(0)),
            vm.envOr("AGENT_2_ADDRESS", address(0))
        ];
        
        require(agents[0] != address(0), "Agent addresses not set");
        
        address usdc = BondCreditVault(vault).asset();
        
        vm.startBroadcast(deployerPrivateKey);

        // Mint USDC for yield injection (if using mock)
        uint256 totalYield = 5000e6; // 5000 USDC total yield
        MockUSDC(usdc).mint(vm.addr(deployerPrivateKey), totalYield);
        console.log("Minted", totalYield / 1e6, "USDC for yield injection");

        // Approve all agents to spend USDC
        MockUSDC(usdc).approve(agents[0], totalYield);
        MockUSDC(usdc).approve(agents[1], totalYield);
        MockUSDC(usdc).approve(agents[2], totalYield);

        // Inject yield to each agent (different amounts to create imbalance)
        uint256[3] memory yields = [uint256(2000e6), uint256(1500e6), uint256(1500e6)];
        
        for (uint256 i = 0; i < 3; i++) {
            uint256 balanceBefore = MockAgentAdapter(agents[i]).currentBalance();
            
            MockAgentAdapter(agents[i]).injectYield(yields[i]);
            
            uint256 balanceAfter = MockAgentAdapter(agents[i]).currentBalance();
            
            console.log(string.concat("Agent ", vm.toString(i), ":"));
            console.log(string.concat("  Injected: ", vm.toString(yields[i] / 1e6), " USDC"));
            console.log(string.concat("  Balance: ", vm.toString(balanceBefore / 1e6), " -> ", vm.toString(balanceAfter / 1e6), " USDC"));
        }

        vm.stopBroadcast();

        console.log("\n=== YIELD INJECTION COMPLETE ===");
        console.log("Now run the keeper to syncBalances() to update vault NAV");
        console.log("Expected share price increase: ~5% (if vault has 100k USDC)");
    }
}
