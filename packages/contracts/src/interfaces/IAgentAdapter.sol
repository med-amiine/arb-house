// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IAgentAdapter
/// @notice Interface for Giza agent adapters
interface IAgentAdapter {
    /// @notice Get current balance managed by agent
    function balance() external view returns (uint256);
    
    /// @notice Get credit limit for this agent
    function creditLimit() external view returns (uint256);
    
    /// @notice Deploy capital to strategy (called by vault via keeper)
    function deploy(uint256 amount) external returns (bool);
    
    /// @notice Withdraw capital from strategy (called by vault via keeper)
    function withdraw(uint256 amount) external returns (uint256);
    
    /// @notice Get current utilization (balance / limit)
    function utilization() external view returns (uint256);
    
    /// @notice Get strategy name/description
    function strategy() external view returns (string memory);
}
