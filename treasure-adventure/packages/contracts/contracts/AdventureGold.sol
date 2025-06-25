// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AdventureGold
 * @dev 宝物冒险游戏的金币代币 (ERC20)
 */
contract AdventureGold is ERC20, ERC20Burnable, Ownable {
    // 授权的系统合约
    mapping(address => bool) public authorizedSystems;
    
    // 修饰符：只有授权的系统或owner可以调用
    modifier onlyAuthorizedOrOwner() {
        require(authorizedSystems[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor() ERC20("Adventure Gold", "GOLD") Ownable(msg.sender) {}
    
    /**
     * @dev 铸造金币，只能由授权系统或合约所有者调用
     * @param to 接收地址
     * @param amount 铸造数量 (wei 单位)
     */
    function mint(address to, uint256 amount) external onlyAuthorizedOrOwner {
        _mint(to, amount);
    }
    
    
    /**
     * @dev 授权系统合约
     */
    function authorizeSystem(address systemContract) external onlyOwner {
        authorizedSystems[systemContract] = true;
    }
    
    /**
     * @dev 取消授权系统合约
     */
    function revokeSystemAuthorization(address systemContract) external onlyOwner {
        authorizedSystems[systemContract] = false;
    }
}