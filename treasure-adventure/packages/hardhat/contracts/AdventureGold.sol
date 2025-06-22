// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AdventureGold
 * @dev 宝物冒险游戏的金币代币 (ERC20)
 */
contract AdventureGold is ERC20, Ownable {
    constructor() ERC20("Adventure Gold", "GOLD") Ownable(msg.sender) {}
    
    /**
     * @dev 铸造金币，只能由合约所有者调用
     * @param to 接收地址
     * @param amount 铸造数量 (wei 单位)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev 销毁金币，只能由合约所有者调用
     * @param from 销毁地址
     * @param amount 销毁数量 (wei 单位)
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}