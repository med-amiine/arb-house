// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {IVaultEvents} from "./interfaces/IVaultEvents.sol";

/// @title BondCreditVault
/// @notice ERC-4626 credit vault for AI agent capital deployment
/// @dev Async withdrawal pattern: shares burned immediately, USDC delivered later by keeper
contract BondCreditVault is ERC4626, Ownable, Pausable, ReentrancyGuard, IVaultEvents {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // ============ Structs ============
    
    struct Agent {
        address adapter;           // Giza agent adapter contract
        uint256 creditLimit;       // Max USDC this agent can hold
        uint256 currentBalance;    // Last synced balance
        bool active;               // Can receive new allocations
    }
    
    struct WithdrawalRequest {
        uint256 shares;            // Shares burned
        uint256 assets;            // USDC amount owed
        uint256 timestamp;         // Request time
        bool claimed;              // Whether completed
    }

    // ============ Constants ============
    
    uint256 public constant MAX_SINGLE_AGENT_ALLOCATION = 5000; // 50% in bps
    uint16 public constant WEIGHT_PRECISION = 10000;            // 100% in bps
    uint256 public constant MAX_SYNC_STALE = 12 hours;

    // ============ State ============
    
    Agent[3] public agents;
    address public keeper;
    
    // Async withdrawal state
    mapping(address => WithdrawalRequest[]) public withdrawalQueues;
    mapping(address => uint256) public pendingAssets; // Total USDC owed per user
    uint256 public totalPending;                       // Global pending USDC
    
    // Rebalancing
    uint16[3] public targetWeights; // Basis points (e.g., 4000, 3000, 3000 = 40/30/30)
    uint16 public rebalanceThreshold = 500; // 5% drift triggers rebalance
    
    uint256 public lastSync;

    // ============ Modifiers ============
    
    modifier onlyKeeper() {
        if (msg.sender != keeper) revert Unauthorized(msg.sender);
        _;
    }
    
    modifier syncNotStale() {
        if (block.timestamp - lastSync > MAX_SYNC_STALE) revert StaleBalances();
        _;
    }

    // ============ Errors ============
    
    error ZeroAddress();
    error Unauthorized(address caller);
    error StaleBalances();
    error ExceedsCreditLimit(uint256 agentIndex, uint256 balance, uint256 limit);
    error InvalidWeights();
    error ZeroShares();
    error InsufficientShares(uint256 requested, uint256 available);
    error AlreadyClaimed(uint256 requestId);
    error NoSuchRequest(uint256 requestId);
    error InsufficientIdleFunds(uint256 requested, uint256 available);

    // ============ Constructor ============
    
    constructor(
        address asset_,
        address keeper_,
        address[3] memory agentAdapters_,
        uint256[3] memory creditLimits_
    ) ERC4626(IERC20(asset_)) ERC20("Bond Credit Vault", "BCV") Ownable(msg.sender) {
        // asset must be a valid ERC20 token address
        if (asset_ == address(0)) revert ZeroAddress();
        if (keeper_ == address(0)) revert ZeroAddress();
        keeper = keeper_;
        
        for (uint256 i = 0; i < 3; i++) {
            agents[i] = Agent({
                adapter: agentAdapters_[i],
                creditLimit: creditLimits_[i],
                currentBalance: 0,
                active: agentAdapters_[i] != address(0)
            });
            emit AgentAdded(i, agentAdapters_[i], creditLimits_[i]);
        }
        
        // Default weights: 30/30/40
        targetWeights = [3000, 3000, 4000];
        
        // Initialize lastSync to allow deposits immediately after deployment
        lastSync = block.timestamp;
    }

    // ============ View Functions ============
    
    /// @notice Total assets = idle USDC + deployed to agents
    /// @dev Pending withdrawals are still in vault but shares burned
    function totalAssets() public view override returns (uint256) {
        address _asset = asset();
        if (_asset == address(0)) revert ZeroAddress();
        uint256 idle = IERC20(_asset).balanceOf(address(this));
        uint256 deployed = agents[0].currentBalance + 
                          agents[1].currentBalance + 
                          agents[2].currentBalance;
        return idle + deployed;
    }
    
    /// @notice Get total assets deployed to agents
    function getTotalDeployed() external view returns (uint256) {
        return agents[0].currentBalance + agents[1].currentBalance + agents[2].currentBalance;
    }
    
    /// @notice Get idle USDC in vault
    function totalIdle() external view returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }
    
    /// @notice Get all agent info in one call
    function getAgentInfo() external view returns (Agent[3] memory) {
        return agents;
    }
    
    /// @notice Get user's withdrawal queue length
    function getWithdrawalQueueLength(address user) external view returns (uint256) {
        return withdrawalQueues[user].length;
    }
    
    /// @notice Get user's total pending withdrawal amount
    function getUserPendingAssets(address user) external view returns (uint256) {
        return pendingAssets[user];
    }
    
    /// @notice Check if rebalancing is needed based on drift threshold
    function shouldRebalance() external view returns (bool) {
        uint256 deployedTotal = agents[0].currentBalance + 
                               agents[1].currentBalance + 
                               agents[2].currentBalance;
        if (deployedTotal == 0) return false;
        
        for (uint256 i = 0; i < 3; i++) {
            if (agents[i].currentBalance == 0) continue;
            uint256 currentWeight = (agents[i].currentBalance * WEIGHT_PRECISION) / deployedTotal;
            if (_absDiff(currentWeight, targetWeights[i]) > rebalanceThreshold) {
                return true;
            }
        }
        return false;
    }

    // ============ ERC-4626 Overrides (with stale sync protection) ============
    
    function previewDeposit(uint256 assets) public view override returns (uint256) {
        if (asset() == address(0)) revert ZeroAddress();
        return super.previewDeposit(assets);
    }
    
    function previewMint(uint256 shares) public view override returns (uint256) {
        return super.previewMint(shares);
    }
    
    function previewWithdraw(uint256 assets) public view override returns (uint256) {
        return super.previewWithdraw(assets);
    }
    
    function previewRedeem(uint256 shares) public view override returns (uint256) {
        return super.previewRedeem(shares);
    }
    
    function maxDeposit(address) public view override returns (uint256) {
        return paused() ? 0 : type(uint256).max;
    }
    
    function maxMint(address) public view override returns (uint256) {
        return paused() ? 0 : type(uint256).max;
    }

    // ============ Deposit (Standard ERC-4626) ============
    
    function deposit(uint256 assets, address receiver) 
        public 
        override 
        whenNotPaused 
        syncNotStale 
        returns (uint256 shares) 
    {
        shares = super.deposit(assets, receiver);
        emit DepositMade(receiver, assets, shares);
    }
    
    function mint(uint256 shares, address receiver) 
        public 
        override 
        whenNotPaused 
        syncNotStale 
        returns (uint256 assets) 
    {
        assets = super.mint(shares, receiver);
        emit DepositMade(receiver, assets, shares);
    }

    // ============ Async Withdrawal (Custom Pattern) ============
    
    /// @notice Request withdrawal: burns shares immediately, queues USDC delivery
    /// @param shares Amount of shares to redeem
    /// @return requestId Index in user's withdrawal queue
    function requestWithdraw(uint256 shares) 
        external 
        whenNotPaused 
        syncNotStale 
        nonReentrant 
        returns (uint256 requestId) 
    {
        if (shares == 0) revert ZeroShares();
        if (shares > balanceOf(msg.sender)) revert InsufficientShares(shares, balanceOf(msg.sender));
        
        uint256 assets = convertToAssets(shares);
        
        // Burn shares immediately (protects against NAV drift during processing)
        _burn(msg.sender, shares);
        
        // Queue the withdrawal
        withdrawalQueues[msg.sender].push(WithdrawalRequest({
            shares: shares,
            assets: assets,
            timestamp: block.timestamp,
            claimed: false
        }));
        
        requestId = withdrawalQueues[msg.sender].length - 1;
        pendingAssets[msg.sender] += assets;
        totalPending += assets;
        
        emit WithdrawalQueued(msg.sender, requestId, shares, assets);
    }
    
    /// @notice Complete a withdrawal after keeper has returned funds
    /// @param user Address to complete withdrawal for
    /// @param requestId Index in user's withdrawal queue
    function completeWithdrawal(address user, uint256 requestId) 
        external 
        onlyKeeper 
        nonReentrant 
    {
        if (requestId >= withdrawalQueues[user].length) revert NoSuchRequest(requestId);
        
        WithdrawalRequest storage request = withdrawalQueues[user][requestId];
        if (request.claimed) revert AlreadyClaimed(requestId);
        
        uint256 assets = request.assets;
        request.claimed = true;
        pendingAssets[user] -= assets;
        totalPending -= assets;
        
        IERC20(asset()).safeTransfer(user, assets);
        
        emit WithdrawalCompleted(user, requestId, assets);
    }
    
    /// @notice Get withdrawal request details
    function getWithdrawalRequest(address user, uint256 requestId) 
        external 
        view 
        returns (WithdrawalRequest memory) 
    {
        if (requestId >= withdrawalQueues[user].length) revert NoSuchRequest(requestId);
        return withdrawalQueues[user][requestId];
    }
    
    /// @notice Get all withdrawal requests for a user
    function getUserWithdrawals(address user) 
        external 
        view 
        returns (WithdrawalRequest[] memory) 
    {
        return withdrawalQueues[user];
    }

    // ============ Keeper Operations ============
    
    /// @notice Sync agent balances from off-chain keeper
    /// @param balances Current balances for each agent
    function syncBalances(uint256[3] calldata balances) external onlyKeeper {
        for (uint256 i = 0; i < 3; i++) {
            if (balances[i] > agents[i].creditLimit) {
                revert ExceedsCreditLimit(i, balances[i], agents[i].creditLimit);
            }
            agents[i].currentBalance = balances[i];
        }
        lastSync = block.timestamp;
        emit BalancesSynced(balances, block.timestamp);
    }
    
    /// @notice Allocate idle funds to agents based on target weights
    /// @param allocations Amounts to allocate to each agent (must not exceed credit limits)
    function allocateToAgents(uint256[3] calldata allocations) external onlyKeeper nonReentrant {
        uint256 idleFunds = IERC20(asset()).balanceOf(address(this));
        
        for (uint256 i = 0; i < 3; i++) {
            if (!agents[i].active) continue;
            if (allocations[i] > 0) {
                if (agents[i].currentBalance + allocations[i] > agents[i].creditLimit) {
                    revert ExceedsCreditLimit(i, agents[i].currentBalance + allocations[i], agents[i].creditLimit);
                }
                if (allocations[i] > idleFunds) {
                    revert InsufficientIdleFunds(allocations[i], idleFunds);
                }
                
                // Transfer to agent adapter
                IERC20(asset()).safeTransfer(agents[i].adapter, allocations[i]);
                agents[i].currentBalance += allocations[i];
                idleFunds -= allocations[i];
                
                emit FundsAllocated(i, allocations[i], agents[i].currentBalance);
            }
        }
    }
    
    /// @notice Calculate optimal allocations based on target weights and available idle funds
    /// @return allocations Array of amounts to allocate to each agent
    function calculateAllocations() external view returns (uint256[3] memory allocations) {
        uint256 idleFunds = IERC20(asset()).balanceOf(address(this));
        if (idleFunds == 0) return allocations;
        
        uint256 totalDeployed = agents[0].currentBalance + agents[1].currentBalance + agents[2].currentBalance;
        uint256 totalTarget = totalDeployed + idleFunds;
        
        for (uint256 i = 0; i < 3; i++) {
            if (!agents[i].active) continue;
            
            // Calculate target balance for this agent
            uint256 targetBalance = (totalTarget * targetWeights[i]) / WEIGHT_PRECISION;
            
            if (targetBalance > agents[i].currentBalance) {
                uint256 needed = targetBalance - agents[i].currentBalance;
                // Don't allocate more than available or credit limit
                uint256 maxAlloc = Math.min(needed, agents[i].creditLimit - agents[i].currentBalance);
                allocations[i] = Math.min(maxAlloc, idleFunds);
                idleFunds -= allocations[i];
            }
        }
    }
    
    /// @notice Update target weights for rebalancing
    /// @param newWeights Array of 3 weights in basis points (must sum to 10000)
    function setWeights(uint16[3] calldata newWeights) external onlyOwner {
        uint256 total = uint256(newWeights[0]) + newWeights[1] + newWeights[2];
        if (total != WEIGHT_PRECISION) revert InvalidWeights();
        
        uint16[3] memory oldWeights = targetWeights;
        targetWeights = newWeights;
        
        emit Rebalanced(oldWeights, newWeights);
    }
    
    /// @notice Update rebalance threshold
    function setRebalanceThreshold(uint16 newThreshold) external onlyOwner {
        rebalanceThreshold = newThreshold;
    }

    // ============ Admin Functions ============
    
    function setKeeper(address newKeeper) external onlyOwner {
        if (newKeeper == address(0)) revert ZeroAddress();
        address oldKeeper = keeper;
        keeper = newKeeper;
        emit KeeperUpdated(oldKeeper, newKeeper);
    }
    
    function updateAgent(uint256 index, address adapter, uint256 creditLimit) external onlyOwner {
        if (index >= 3) revert NoSuchRequest(index);
        agents[index] = Agent({
            adapter: adapter,
            creditLimit: creditLimit,
            currentBalance: 0,
            active: adapter != address(0)
        });
        emit AgentAdded(index, adapter, creditLimit);
    }
    
    function pause() external onlyOwner {
        _pause();
        emit EmergencyPause("Manual pause by owner");
    }
    
    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyUnpause();
    }
    
    /// @notice Emergency pause by keeper (for agent failure detection)
    function emergencyPause(string calldata reason) external onlyKeeper {
        _pause();
        emit EmergencyPause(reason);
    }
    
    /// @notice Rescue stuck tokens (excluding vault asset)
    function rescue(address token, uint256 amount) external onlyOwner {
        if (token == asset()) revert InvalidRescue();
        IERC20(token).safeTransfer(owner(), amount);
    }
    
    error InvalidRescue();

    // ============ Internal Helpers ============
    
    function _absDiff(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a - b : b - a;
    }
}