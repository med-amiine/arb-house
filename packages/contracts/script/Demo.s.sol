// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {BondCreditVault} from "../src/BondCreditVault.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Demo is Script {
    function run() external {
        // adjust these addresses as appropriate for the network/demo
        address vaultAddr = vm.envAddress("VAULT_ADDRESS");
        uint256 deployerPk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPk);
        address investor = deployer; // Use deployer as investor for demo
        address keeper = deployer; // Use deployer as keeper for demo

        BondCreditVault vault = BondCreditVault(vaultAddr);
        IERC20 usdc = IERC20(vault.asset());

        console.log("=========================================");
        console.log("BondCreditVault Demo Script");
        console.log("=========================================");
        console.log("Vault Address:", vaultAddr);
        console.log("USDC Address:", address(usdc));
        console.log("Deployer/Investor/Keeper:", deployer);
        console.log("Block Number:", block.number);
        console.log("Timestamp:", block.timestamp);
        console.log("");

        vm.startBroadcast(deployerPk);

        // ensure investor has some USDC (if using a mock token)
        if (address(usdc) == address(0)) revert();
        console.log("=== INITIAL SETUP ===");
        console.log("Initial USDC Balance:", usdc.balanceOf(investor) / 1e6, "USDC");

        // for a mock we can mint directly; real USDC would require a faucet or pre‑funded account
        try MockUSDC(address(usdc)).mint(investor, 1_000_000e6) {
            console.log("Minted 1,000,000 USDC to investor (mock token)");
        } catch {
            console.log("Using existing USDC balance (real token)");
        }

        console.log("USDC Balance after mint:", usdc.balanceOf(investor) / 1e6, "USDC");
        console.log("Initial BCV Balance:", vault.balanceOf(investor) / 1e18, "BCV");
        console.log("Initial Vault Total Assets:", vault.totalAssets() / 1e6, "USDC");
        console.log("");

        // investor interaction
        console.log("=== DEPOSIT PHASE ===");
        console.log("Approving vault to spend unlimited USDC...");
        usdc.approve(address(vault), type(uint256).max);

        uint256 depositAmount = 100_000e6; // 100k USDC
        console.log("Depositing", depositAmount / 1e6, "USDC into vault...");

        uint256 shares = vault.deposit(depositAmount, investor);

        console.log("Deposit Summary:");
        console.log("  Deposited:", depositAmount / 1e6, "USDC");
        console.log("  Received:", shares / 1e18, "BCV shares");
        console.log("  Share Price:", (depositAmount * 1e18 / shares) / 1e6, "USDC per BCV");
        console.log("  Exchange Rate: 1 BCV =", vault.convertToAssets(1e18) / 1e6, "USDC");
        console.log("Post-Deposit Balances:");
        console.log("  USDC Balance:", usdc.balanceOf(investor) / 1e6, "USDC");
        console.log("  BCV Balance:", vault.balanceOf(investor) / 1e18, "BCV");
        console.log("  Vault Total Assets:", vault.totalAssets() / 1e6, "USDC");
        console.log("");

        // keeper sync & withdrawal demonstration
        console.log("=== KEEPER OPERATIONS ===");
        console.log("Setting keeper address...");
        vault.setKeeper(keeper);

        console.log("Syncing agent balances to [0, 0, 0] (all idle)...");
        vault.syncBalances([uint256(0),0,0]);

        console.log("Balance Sync Complete:");
        console.log("  Last Sync Timestamp:", vault.lastSync());
        console.log("  Vault Total Assets:", vault.totalAssets() / 1e6, "USDC");
        console.log("  Vault Idle Assets:", vault.totalIdle() / 1e6, "USDC");
        console.log("  Vault Deployed Assets:", vault.getTotalDeployed() / 1e6, "USDC");
        console.log("");

        console.log("=== WITHDRAWAL PHASE ===");
        uint256 withdrawSharesWei = 100_000_000; // Small amount that fits available balance

        console.log("Requesting withdrawal of", withdrawSharesWei, "BCV wei shares...");
        console.log("  BCV Shares to Burn:", withdrawSharesWei / 1e6, "BCV (display)");

        uint256 requestId = vault.requestWithdraw(withdrawSharesWei);
        uint256 withdrawAssets = vault.convertToAssets(withdrawSharesWei);

        console.log("Withdrawal Request Summary:");
        console.log("  Request ID:", requestId);
        console.log("  Shares Burned:", withdrawSharesWei / 1e18, "BCV");
        console.log("  Assets Owed:", withdrawAssets / 1e6, "USDC");
        console.log("  Timestamp:", block.timestamp);
        console.log("Post-Request State:");
        console.log("  BCV Balance:", vault.balanceOf(investor) / 1e18, "BCV");
        console.log("  Pending Assets:", vault.getUserPendingAssets(investor) / 1e6, "USDC");
        console.log("  Withdrawal Queue Length:", vault.getWithdrawalQueueLength(investor));
        console.log("");

        // Complete the latest withdrawal request (the one we just created)
        console.log("=== WITHDRAWAL COMPLETION ===");
        uint256 latestRequestId = vault.getWithdrawalQueueLength(investor) - 1;
        console.log("Completing withdrawal request ID:", latestRequestId, "...");

        vault.completeWithdrawal(investor, latestRequestId);

        console.log("Withdrawal Completion Summary:");
        console.log("  Request ID:", latestRequestId);
        console.log("  USDC Received:", withdrawAssets / 1e6, "USDC");
        console.log("Final Balances:");
        console.log("  USDC Balance:", usdc.balanceOf(investor) / 1e6, "USDC");
        console.log("  BCV Balance:", vault.balanceOf(investor) / 1e18, "BCV");
        console.log("  Pending Assets:", vault.getUserPendingAssets(investor) / 1e6, "USDC");
        console.log("  Vault Total Assets:", vault.totalAssets() / 1e6, "USDC");
        console.log("");

        console.log("=========================================");
        console.log("Demo completed successfully!");
        console.log("=========================================");

        vm.stopBroadcast();
    }
}
