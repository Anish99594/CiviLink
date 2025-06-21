// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts@4.9.0/access/Ownable.sol";

// Interface for ERC-20 token (minimal for LiquidDemocracy.sol)
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function burn(uint256 amount) external;
}

/// @title CITYToken - Governance token for Crypto Cities
/// @notice ERC-20 token with burning and restricted minting for LiquidDemocracy
/// @dev Minting is owner-controlled; transfer ownership to LiquidDemocracy or DAO for production
contract CITYToken is IERC20, Ownable {
    // State Variables
    string public constant name = "CITY";
    string public constant symbol = "CITY";
    uint8 public constant decimals = 18;
    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // Events
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

    // Constructor
    constructor(uint256 initialSupply) Ownable() {
        _totalSupply = initialSupply * 10**decimals;
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
        emit Mint(msg.sender, _totalSupply);
    }

    // Total supply of tokens
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    // Balance of an account
    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    // Transfer tokens
    function transfer(address to, uint256 amount) external override returns (bool) {
        require(to != address(0), "Invalid recipient");
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    // Approve spender to use tokens
    function approve(address spender, uint256 amount) external override returns (bool) {
        require(spender != address(0), "Invalid spender");
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    // Allowance for a spender
    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }

    // Transfer tokens on behalf of another account
    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(from != address(0), "Invalid sender");
        require(to != address(0), "Invalid recipient");
        require(_balances[from] >= amount, "Insufficient balance");
        require(_allowances[from][msg.sender] >= amount, "Insufficient allowance");

        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }

    // Burn tokens
    function burn(uint256 amount) external override {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
        emit Burn(msg.sender, amount);
    }

    // Mint new tokens (restricted to owner)
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
        emit Mint(to, amount);
    }
} 