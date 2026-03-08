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

        BondCreditVault vault = BondCreditVault(vaultAddr);
        IERC20 usdc = IERC20(vault.asset());

        vm.startBroadcast(deployerPk);

        // ensure investor has some USDC (if using a mock token)
        if (address(usdc) == address(0)) revert();
        // for a mock we can mint directly; real USDC would require a faucet or pre‑funded account
        try MockUSDC(address(usdc)).mint(investor, 1_000_000e6) {} catch {}

        // investor interaction
        usdc.approve(address(vault), type(uint256).max);
        uint256 shares = vault.deposit(100_000e6, investor);
        console.log("deposited shares", shares);

        // keeper sync & withdrawal demonstration
        vault.setKeeper(deployer); // Set deployer as keeper for demo
        vault.syncBalances([uint256(0),0,0]);

        vault.requestWithdraw(10_000e6);

        vault.completeWithdrawal(investor, 0);

        vm.stopBroadcast();
    }
}
