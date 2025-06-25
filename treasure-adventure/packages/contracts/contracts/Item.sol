// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "hardhat/console.sol";
/**
 * @title Item
 * @dev 宝物冒险游戏的NFT，用于血瓶，转职书，宠物蛋等，id 1000-1999是保留给血瓶的，2000-2999是保留给转职书的，3000-3999保留给宠物蛋的
 */
contract Item is Initializable, ERC1155Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address initialOwner) public initializer {
        __ERC1155_init("Item URL");
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

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
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}