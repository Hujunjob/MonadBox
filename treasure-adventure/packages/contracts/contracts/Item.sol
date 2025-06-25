// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
/**
 * @title Item
 * @dev 宝物冒险游戏的NFT，用于血瓶，转职书，宠物蛋等，id 1000-1999是保留给血瓶的，2000-2999是保留给转职书的，3000-3999保留给宠物蛋的
 */
contract Item is ERC1155, Ownable {
    constructor() ERC1155("Item URL") Ownable(msg.sender) {}

    // 授权的系统合约
    mapping(address => bool) public authorizedSystems;

    // 修饰符：只有授权的系统或owner可以调用
    modifier onlyAuthorizedOrOwner() {
        require(authorizedSystems[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    function mint(address to, uint256 id, uint256 value) external onlyAuthorizedOrOwner(){
            // function _mint(address to, uint256 id, uint256 value, bytes memory data) internal {
        _mint(to, id, value, '');
    }

    /**
     * @dev 销毁自己的物品
     * @param id 物品ID
     * @param value 销毁数量
     */
    function burn(uint256 id, uint256 value) external {
        _burn(msg.sender, id, value);
    }

    /**
     * @dev 系统销毁物品 - 只有授权系统可以调用
     * @param from 销毁地址
     * @param id 物品ID
     * @param value 销毁数量
     */
    function systemBurn(address from, uint256 id, uint256 value) external onlyAuthorizedOrOwner() {
        _burn(from, id, value);
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