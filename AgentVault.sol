// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentVault
 * @notice Simplified vault for agent competition - no sync required
 * @dev Each agent gets a credit line based on performance score
 */
contract AgentVault is ERC4626, Ownable {
    
    struct Agent {
        address agentAddress;
        uint256 creditLine;      // Max USDC agent can borrow
        uint256 borrowed;        // Current borrowed amount
        uint256 performanceScore; // 0-10000 (100% = 10000)
        uint256 totalProfit;     // Cumulative profit
        uint256 totalLoss;       // Cumulative loss
        bool isActive;
        uint256 registrationTime;
    }
    
    struct Allocation {
        address agent;
        uint256 amount;
        uint256 timestamp;
    }
    
    // State
    mapping(address => Agent) public agents;
    mapping(address => Allocation[]) public userAllocations;
    address[] public agentList;
    
    uint256 public totalAllocated;  // Total USDC allocated to agents
    uint256 public constant PERFORMANCE_PRECISION = 10000;
    uint256 public constant MIN_CREDIT_LINE = 1000e6;  // $1k USDC
    uint256 public constant MAX_CREDIT_LINE = 1000000e6; // $1M USDC
    
    // Events
    event AgentRegistered(address indexed agent, uint256 initialCreditLine);
    event CreditLineUpdated(address indexed agent, uint256 newCreditLine);
    event PerformanceUpdated(address indexed agent, uint256 newScore, uint256 profit, uint256 loss);
    event CapitalAllocated(address indexed user, address indexed agent, uint256 amount);
    event CapitalRecalled(address indexed user, address indexed agent, uint256 amount);
    
    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol
    ) ERC4626(_asset) ERC20(_name, _symbol) Ownable(msg.sender) {}
    
    // ========== AGENT MANAGEMENT ==========
    
    function registerAgent(address _agent) external onlyOwner {
        require(!agents[_agent].isActive, "Agent already registered");
        
        agents[_agent] = Agent({
            agentAddress: _agent,
            creditLine: MIN_CREDIT_LINE,
            borrowed: 0,
            performanceScore: 5000, // Start at 50%
            totalProfit: 0,
            totalLoss: 0,
            isActive: true,
            registrationTime: block.timestamp
        });
        
        agentList.push(_agent);
        emit AgentRegistered(_agent, MIN_CREDIT_LINE);
    }
    
    function updatePerformance(
        address _agent,
        uint256 _profit,
        uint256 _loss
    ) external onlyOwner {
        Agent storage agent = agents[_agent];
        require(agent.isActive, "Agent not active");
        
        agent.totalProfit += _profit;
        agent.totalLoss += _loss;
        
        // Calculate new score based on P&L ratio
        uint256 totalTrades = agent.totalProfit + agent.totalLoss;
        if (totalTrades > 0) {
            uint256 winRate = (agent.totalProfit * PERFORMANCE_PRECISION) / totalTrades;
            agent.performanceScore = winRate;
        }
        
        // Update credit line based on performance
        uint256 newCreditLine = MIN_CREDIT_LINE + 
            ((MAX_CREDIT_LINE - MIN_CREDIT_LINE) * agent.performanceScore) / PERFORMANCE_PRECISION;
        
        agent.creditLine = newCreditLine;
        
        emit PerformanceUpdated(_agent, agent.performanceScore, _profit, _loss);
        emit CreditLineUpdated(_agent, newCreditLine);
    }
    
    // ========== DEPOSITOR FUNCTIONS ==========
    
    function allocateToAgent(address _agent, uint256 _amount) external {
        Agent storage agent = agents[_agent];
        require(agent.isActive, "Agent not active");
        require(_amount > 0, "Amount must be > 0");
        
        // Check available allocation capacity
        uint256 availableCapacity = agent.creditLine - agent.borrowed;
        require(_amount <= availableCapacity, "Exceeds agent credit line");
        
        // Transfer USDC from user
        IERC20(asset()).transferFrom(msg.sender, address(this), _amount);
        
        // Record allocation
        userAllocations[msg.sender].push(Allocation({
            agent: _agent,
            amount: _amount,
            timestamp: block.timestamp
        }));
        
        agent.borrowed += _amount;
        totalAllocated += _amount;
        
        emit CapitalAllocated(msg.sender, _agent, _amount);
    }
    
    function recallFromAgent(address _agent, uint256 _amount) external {
        Allocation[] storage allocations = userAllocations[msg.sender];
        uint256 totalAllocatedToAgent = 0;
        
        // Calculate total allocation to this agent
        for (uint i = 0; i < allocations.length; i++) {
            if (allocations[i].agent == _agent) {
                totalAllocatedToAgent += allocations[i].amount;
            }
        }
        
        require(_amount <= totalAllocatedToAgent, "Not enough allocated");
        
        Agent storage agent = agents[_agent];
        agent.borrowed -= _amount;
        totalAllocated -= _amount;
        
        // Return USDC to user
        IERC20(asset()).transfer(msg.sender, _amount);
        
        emit CapitalRecalled(msg.sender, _agent, _amount);
    }
    
    // ========== VIEW FUNCTIONS ==========
    
    function getAgentInfo(address _agent) external view returns (Agent memory) {
        return agents[_agent];
    }
    
    function getUserAllocations(address _user) external view returns (Allocation[] memory) {
        return userAllocations[_user];
    }
    
    function getAvailableCredit(address _agent) external view returns (uint256) {
        Agent memory agent = agents[_agent];
        if (!agent.isActive) return 0;
        return agent.creditLine - agent.borrowed;
    }
    
    function getAllAgents() external view returns (address[] memory) {
        return agentList;
    }
    
    // Override totalAssets to exclude allocated capital
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) + totalAllocated;
    }
}
