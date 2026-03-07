// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockAgentAdapter
/// @notice Mock agent adapter for testing - simulates yield-generating strategies
/// @dev In production, this integrates with Giza SDK via keeper off-chain
contract MockAgentAdapter is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public asset;
    uint256 public currentBalance;
    uint256 public creditLimit;
    string public strategy;
    
    // Yield simulation
    uint256 public yieldRateBps = 100; // 1% per day default
    uint256 public lastUpdate;
    
    // For testing: allow manual yield injection
    mapping(address => bool) public yieldInjectors;
    
    event Deposit(uint256 amount, uint256 newBalance);
    event Withdraw(uint256 amount, uint256 newBalance);
    event YieldInjected(uint256 amount, uint256 newBalance);
    event YieldAccrued(uint256 amount);

    modifier onlyYieldInjector() {
        require(yieldInjectors[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address _asset, uint256 _creditLimit, string memory _strategy) Ownable(msg.sender) {
        asset = IERC20(_asset);
        creditLimit = _creditLimit;
        strategy = _strategy;
        lastUpdate = block.timestamp;
        yieldInjectors[msg.sender] = true;
    }

    /// @notice Deposit USDC into agent strategy
    function deposit(uint256 amount) external onlyOwner {
        require(currentBalance + amount <= creditLimit, "Exceeds credit limit");
        
        asset.safeTransferFrom(msg.sender, address(this), amount);
        currentBalance += amount;
        lastUpdate = block.timestamp;
        
        emit Deposit(amount, currentBalance);
    }

    /// @notice Withdraw USDC from agent strategy
    function withdraw(uint256 amount) external onlyOwner returns (uint256) {
        require(amount <= currentBalance, "Insufficient balance");
        
        // Simulate yield accrual before withdrawal
        _accrueYield();
        
        uint256 withdrawAmount = amount > currentBalance ? currentBalance : amount;
        currentBalance -= withdrawAmount;
        
        asset.safeTransfer(msg.sender, withdrawAmount);
        
        emit Withdraw(withdrawAmount, currentBalance);
        return withdrawAmount;
    }

    /// @notice Get current balance (view)
    function balance() external view returns (uint256) {
        return currentBalance + _pendingYield();
    }

    /// @notice Get utilization (balance / limit)
    function utilization() external view returns (uint256) {
        if (creditLimit == 0) return 0;
        return (currentBalance * 10000) / creditLimit;
    }

    /// @notice Manually inject yield (for testing)
    function injectYield(uint256 amount) external onlyYieldInjector {
        // Transfer yield from injector to this contract
        asset.safeTransferFrom(msg.sender, address(this), amount);
        currentBalance += amount;
        
        emit YieldInjected(amount, currentBalance);
    }

    /// @notice Set yield rate (for testing)
    function setYieldRate(uint256 _yieldRateBps) external onlyOwner {
        yieldRateBps = _yieldRateBps;
    }

    /// @notice Add yield injector (for testing)
    function addYieldInjector(address injector) external onlyOwner {
        yieldInjectors[injector] = true;
    }

    /// @notice Remove yield injector
    function removeYieldInjector(address injector) external onlyOwner {
        yieldInjectors[injector] = false;
    }

    /// @notice Accrue yield based on time elapsed
    function _accrueYield() internal {
        uint256 pending = _pendingYield();
        if (pending > 0) {
            currentBalance += pending;
            emit YieldAccrued(pending);
        }
        lastUpdate = block.timestamp;
    }

    /// @notice Calculate pending yield
    function _pendingYield() internal view returns (uint256) {
        uint256 timeElapsed = block.timestamp - lastUpdate;
        // Simple linear yield: balance * rate * time / (10000 * 1 day)
        return (currentBalance * yieldRateBps * timeElapsed) / (10000 * 1 days);
    }

    /// @notice Emergency rescue
    function rescue(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
