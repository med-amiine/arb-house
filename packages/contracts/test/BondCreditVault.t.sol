// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BondCreditVault} from "../src/BondCreditVault.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";

contract BondCreditVaultTest is Test {
    BondCreditVault public vault;
    MockUSDC public usdc;
    
    address public owner = address(1);
    address public keeper = address(2);
    address public investor = address(3);
    
    address[3] public agentAdapters;
    uint256[3] public creditLimits;
    
    // Events for testing
    event DepositMade(address indexed receiver, uint256 assets, uint256 shares);
    event WithdrawalQueued(address indexed user, uint256 indexed requestId, uint256 shares, uint256 assets);
    event WithdrawalCompleted(address indexed user, uint256 indexed requestId, uint256 assets);
    event BalancesSynced(uint256[3] balances, uint256 timestamp);

    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy mock USDC
        usdc = new MockUSDC();
        
        // Setup agents
        agentAdapters = [address(10), address(11), address(12)];
        creditLimits = [1_000_000e6, 1_000_000e6, 1_000_000e6]; // 1M each
        
        // Deploy vault
        vault = new BondCreditVault(
            address(usdc),
            keeper,
            agentAdapters,
            creditLimits
        );
        
        // Mint USDC to investor
        usdc.mint(investor, 100_000e6); // 100k USDC
        
        vm.stopPrank();
    }

    // ============ Deployment Tests ============
    
    function test_Deployment() public {
        assertEq(vault.name(), "Bond Credit Vault");
        assertEq(vault.symbol(), "BCV");
        assertEq(address(vault.asset()), address(usdc));
        assertEq(vault.keeper(), keeper);
        assertEq(vault.owner(), owner);
    }
    
    function test_AgentConfiguration() public {
        (address adapter0, uint256 limit0,, bool active0) = vault.agents(0);
        assertEq(adapter0, agentAdapters[0]);
        assertEq(limit0, creditLimits[0]);
        assertTrue(active0);
    }
    
    function test_Deployment_ZeroKeeperReverts() public {
        vm.expectRevert(BondCreditVault.ZeroAddress.selector);
        new BondCreditVault(address(usdc), address(0), agentAdapters, creditLimits);
    }

    // ============ Deposit Tests ============
    
    function test_Deposit_MintsCorrectShares() public {
        uint256 depositAmount = 10_000e6; // 10k USDC
        
        vm.startPrank(investor);
        usdc.approve(address(vault), depositAmount);
        
        vm.expectEmit(true, false, false, true);
        emit DepositMade(investor, depositAmount, depositAmount); // 1:1 at start
        
        uint256 shares = vault.deposit(depositAmount, investor);
        vm.stopPrank();
        
        assertEq(shares, depositAmount);
        assertEq(vault.balanceOf(investor), depositAmount);
        assertEq(vault.totalAssets(), depositAmount);
    }
    
    function test_Deposit_UpdatesTotalAssets() public {
        uint256 depositAmount = 50_000e6;
        
        vm.startPrank(investor);
        usdc.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, investor);
        vm.stopPrank();
        
        assertEq(vault.totalAssets(), depositAmount);
        assertEq(vault.totalIdle(), depositAmount);
        assertEq(vault.getTotalDeployed(), 0);
    }

    // ============ Async Withdrawal Tests ============
    
    function test_RequestWithdraw_BurnsShares() public {
        // Setup: deposit first
        uint256 depositAmount = 10_000e6;
        vm.startPrank(investor);
        usdc.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, investor);
        
        uint256 withdrawShares = 5_000e6;
        
        vm.expectEmit(true, true, false, true);
        emit WithdrawalQueued(investor, 0, withdrawShares, withdrawShares);
        
        uint256 requestId = vault.requestWithdraw(withdrawShares);
        vm.stopPrank();
        
        assertEq(requestId, 0);
        assertEq(vault.balanceOf(investor), depositAmount - withdrawShares);
        assertEq(vault.pendingAssets(investor), withdrawShares);
        assertEq(vault.totalPending(), withdrawShares);
    }
    
    function test_RequestWithdraw_ZeroSharesReverts() public {
        vm.prank(investor);
        vm.expectRevert(BondCreditVault.ZeroShares.selector);
        vault.requestWithdraw(0);
    }
    
    function test_RequestWithdraw_InsufficientSharesReverts() public {
        vm.prank(investor);
        vm.expectRevert(abi.encodeWithSelector(BondCreditVault.InsufficientShares.selector, 1000e6, 0));
        vault.requestWithdraw(1000e6);
    }
    
    function test_CompleteWithdrawal() public {
        // Setup deposit and request
        uint256 depositAmount = 10_000e6;
        vm.startPrank(investor);
        usdc.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, investor);
        vault.requestWithdraw(5_000e6);
        vm.stopPrank();
        
        // Keeper completes withdrawal
        uint256 investorBalanceBefore = usdc.balanceOf(investor);
        
        vm.prank(keeper);
        vm.expectEmit(true, true, false, true);
        emit WithdrawalCompleted(investor, 0, 5_000e6);
        vault.completeWithdrawal(investor, 0);
        
        assertEq(usdc.balanceOf(investor), investorBalanceBefore + 5_000e6);
        assertEq(vault.pendingAssets(investor), 0);
        assertEq(vault.totalPending(), 0);
        
        // Check request is marked claimed
        BondCreditVault.WithdrawalRequest memory request = vault.getWithdrawalRequest(investor, 0);
        assertTrue(request.claimed);
    }
    
    function test_CompleteWithdrawal_NotKeeperReverts() public {
        vm.prank(investor);
        vm.expectRevert(abi.encodeWithSelector(BondCreditVault.Unauthorized.selector, investor));
        vault.completeWithdrawal(investor, 0);
    }
    
    function test_CompleteWithdrawal_AlreadyClaimedReverts() public {
        // Setup
        vm.startPrank(investor);
        usdc.approve(address(vault), 10_000e6);
        vault.deposit(10_000e6, investor);
        vault.requestWithdraw(5_000e6);
        vm.stopPrank();
        
        // Complete once
        vm.prank(keeper);
        vault.completeWithdrawal(investor, 0);
        
        // Try again
        vm.prank(keeper);
        vm.expectRevert(abi.encodeWithSelector(BondCreditVault.AlreadyClaimed.selector, 0));
        vault.completeWithdrawal(investor, 0);
    }

    // ============ Keeper Balance Sync Tests ============
    
    function test_SyncBalances() public {
        uint256[3] memory balances = [uint256(100e6), uint256(200e6), uint256(300e6)];
        
        vm.prank(keeper);
        vm.expectEmit(false, false, false, true);
        emit BalancesSynced(balances, block.timestamp);
        vault.syncBalances(balances);
        
        (, , uint256 balance0, ) = vault.agents(0);
        (, , uint256 balance1, ) = vault.agents(1);
        (, , uint256 balance2, ) = vault.agents(2);
        
        assertEq(balance0, 100e6);
        assertEq(balance1, 200e6);
        assertEq(balance2, 300e6);
        assertEq(vault.lastSync(), block.timestamp);
    }
    
    function test_SyncBalances_ExceedsCreditLimitReverts() public {
        uint256[3] memory balances = [uint256(2_000_000e6), uint256(0), uint256(0)]; // Exceeds 1M limit
        
        vm.prank(keeper);
        vm.expectRevert(abi.encodeWithSelector(BondCreditVault.ExceedsCreditLimit.selector, 0, 2_000_000e6, 1_000_000e6));
        vault.syncBalances(balances);
    }
    
    function test_SyncBalances_NotKeeperReverts() public {
        uint256[3] memory balances = [uint256(100e6), uint256(0), uint256(0)];
        
        vm.prank(investor);
        vm.expectRevert(abi.encodeWithSelector(BondCreditVault.Unauthorized.selector, investor));
        vault.syncBalances(balances);
    }

    // ============ Total Assets Tests ============
    
    function test_TotalAssets_AccountsForAgents() public {
        // Deposit to vault
        vm.startPrank(investor);
        usdc.approve(address(vault), 10_000e6);
        vault.deposit(10_000e6, investor);
        vm.stopPrank();
        
        // Sync agent balances
        uint256[3] memory balances = [uint256(300e6), uint256(200e6), uint256(100e6)];
        vm.prank(keeper);
        vault.syncBalances(balances);
        
        // Total = idle (10k) + deployed (600)
        assertEq(vault.totalAssets(), 10_600e6);
        assertEq(vault.totalIdle(), 10_000e6);
        assertEq(vault.getTotalDeployed(), 600e6);
    }
    
    function test_TotalAssets_AfterWithdrawalRequest() public {
        // Deposit
        vm.startPrank(investor);
        usdc.approve(address(vault), 10_000e6);
        vault.deposit(10_000e6, investor);
        
        // Request withdraw
        vault.requestWithdraw(5_000e6);
        vm.stopPrank();
        
        // Total assets unchanged (shares burned but USDC still in vault)
        assertEq(vault.totalAssets(), 10_000e6);
        assertEq(vault.totalPending(), 5_000e6);
    }

    // ============ Share Price Tests ============
    
    function test_SharePrice_UpdatesOnSync() public {
        // Initial deposit 1:1
        vm.startPrank(investor);
        usdc.approve(address(vault), 10_000e6);
        vault.deposit(10_000e6, investor);
        vm.stopPrank();
        
        assertEq(vault.convertToAssets(1e6), 1e6); // 1 share = 1 USDC
        
        // Simulate agent yield: sync shows more assets
        uint256[3] memory balances = [uint256(500e6), uint256(0), uint256(0)];
        vm.prank(keeper);
        vault.syncBalances(balances);
        
        // New price = (10000 + 500) / 10000 ≈ 1.05 (allow rounding)
        uint256 newPrice = vault.convertToAssets(1e6);
        assertGe(newPrice, 1.049e6); // Should be ~1.05
        assertLe(newPrice, 1.051e6);
    }

    // ============ Rebalance Tests ============
    
    function test_SetWeights() public {
        uint16[3] memory newWeights = [4000, 3000, 3000];
        
        vm.prank(owner);
        vault.setWeights(newWeights);
        
        (uint16 w0, uint16 w1, uint16 w2) = (vault.targetWeights(0), vault.targetWeights(1), vault.targetWeights(2));
        assertEq(w0, 4000);
        assertEq(w1, 3000);
        assertEq(w2, 3000);
    }
    
    function test_SetWeights_InvalidSumReverts() public {
        uint16[3] memory badWeights = [5000, 3000, 3000]; // Sum = 11000
        
        vm.prank(owner);
        vm.expectRevert(BondCreditVault.InvalidWeights.selector);
        vault.setWeights(badWeights);
    }
    
    function test_ShouldRebalance() public {
        // Setup equal deployment
        uint256[3] memory balances = [uint256(333e6), uint256(333e6), uint256(334e6)];
        vm.prank(keeper);
        vault.syncBalances(balances);
        
        // Set weights to 40/30/30
        vm.prank(owner);
        vault.setWeights([uint16(4000), uint16(3000), uint16(3000)]);
        
        // Should need rebalance (agent 0 is underweight by ~7%)
        assertTrue(vault.shouldRebalance());
    }

    // ============ Stale Sync Tests ============
    
    function test_StaleSync_PreventsDeposits() public {
        // Deposit to set initial state
        vm.startPrank(investor);
        usdc.approve(address(vault), 2000e6); // Approve both deposits at once
        vault.deposit(1000e6, investor);
        
        // Warp past stale threshold
        vm.warp(block.timestamp + 13 hours);
        
        // Try to deposit
        vm.expectRevert(BondCreditVault.StaleBalances.selector);
        vault.deposit(1000e6, investor);
        vm.stopPrank();
    }

    // ============ Pause Tests ============
    
    function test_Pause() public {
        vm.prank(owner);
        vault.pause();
        
        assertTrue(vault.paused());
        
        vm.prank(investor);
        usdc.approve(address(vault), 1000e6);
        vm.expectRevert();
        vault.deposit(1000e6, investor);
    }
    
    function test_Unpause() public {
        vm.startPrank(owner);
        vault.pause();
        vault.unpause();
        vm.stopPrank();
        
        assertFalse(vault.paused());
    }
    
    function test_EmergencyPause_Keeper() public {
        vm.prank(keeper);
        vault.emergencyPause("Agent failure detected");
        
        assertTrue(vault.paused());
    }

    // ============ Admin Tests ============
    
    function test_SetKeeper() public {
        address newKeeper = address(99);
        
        vm.prank(owner);
        vault.setKeeper(newKeeper);
        
        assertEq(vault.keeper(), newKeeper);
    }
    
    function test_UpdateAgent() public {
        address newAdapter = address(88);
        uint256 newLimit = 500_000e6;
        
        vm.prank(owner);
        vault.updateAgent(0, newAdapter, newLimit);
        
        (address adapter, uint256 limit,,) = vault.agents(0);
        assertEq(adapter, newAdapter);
        assertEq(limit, newLimit);
    }
}
