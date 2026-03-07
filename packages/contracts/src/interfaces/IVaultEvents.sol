// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IVaultEvents
/// @notice Event interface for BondCreditVault
interface IVaultEvents {
    event DepositMade(address indexed receiver, uint256 assets, uint256 shares);
    
    event AgentAdded(uint256 indexed index, address adapter, uint256 creditLimit);
    event AgentUpdated(uint256 indexed index, address adapter, uint256 creditLimit);
    
    event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper);
    
    event BalancesSynced(uint256[3] balances, uint256 timestamp);
    
    event WithdrawalQueued(address indexed user, uint256 indexed requestId, uint256 shares, uint256 assets);
    event WithdrawalCompleted(address indexed user, uint256 indexed requestId, uint256 assets);
    
    event Rebalanced(uint16[3] oldWeights, uint16[3] newWeights);
    
    event EmergencyPause(string reason);
    event EmergencyUnpause();
}
