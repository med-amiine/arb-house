// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC
/// @notice Mock USDC for testing (6 decimals)
contract MockUSDC is ERC20 {
    uint8 private constant _DECIMALS = 6;
    
    constructor() ERC20("USD Coin", "USDC") {}
    
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
