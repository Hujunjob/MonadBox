// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AdventureGold.sol";
import "./Equipment.sol";
import "./BattleSystem.sol";
import "./TreasureBoxSystem.sol";
import "./GameStructs.sol";

/**
 * @title GameManager
 * @dev 游戏主管理合约 - 协调各个子系统
 */
contract GameManager is Ownable {
    AdventureGold public goldToken;
    Equipment public equipmentNFT;
    BattleSystem public battleSystem;
    TreasureBoxSystem public treasureBoxSystem;
    
    // 装备系统
    mapping(address => GameStructs.EquippedItems) public equippedItems;
    
    // 事件
    event EquipmentEquipped(address indexed player, uint256 tokenId, uint8 slot);
    event EquipmentUnequipped(address indexed player, uint256 tokenId, uint8 slot);
    
    constructor() Ownable(msg.sender) {
        // 部署代币合约
        goldToken = new AdventureGold();
        equipmentNFT = new Equipment();
        
        // 部署子系统
        treasureBoxSystem = new TreasureBoxSystem(address(goldToken), address(equipmentNFT));
        battleSystem = new BattleSystem(address(goldToken), address(treasureBoxSystem));
        
        // 设置权限
        goldToken.transferOwnership(address(this)); // GameManager控制金币铸造
        equipmentNFT.transferOwnership(address(this)); // GameManager控制装备铸造
    }
    
    // ========== 玩家注册 ==========
    
    /**
     * @dev 玩家注册 (统一入口)
     * @param name 玩家名称
     */
    function registerPlayer(string memory name) external {
        battleSystem.registerPlayer(msg.sender, name);
        
        // 给新玩家初始金币
        goldToken.mint(msg.sender, 1000 * 10**18); // 1000 金币
        
        // 初始化离线宝箱时间
        treasureBoxSystem.claimOfflineTreasureBoxes(); // 这会设置初始时间
    }
    
    // ========== 战斗系统代理 ==========
    
    /**
     * @dev 完成战斗
     */
    function completeBattle(
        uint16 experienceGained,
        uint256 goldGained,
        uint8 staminaCost,
        bool victory,
        uint8 monsterLevel
    ) external {
        battleSystem.completeBattle(msg.sender, experienceGained, goldGained, staminaCost, victory, monsterLevel);
        
        // 如果胜利，给玩家铸造金币
        if (victory && goldGained > 0) {
            goldToken.mint(msg.sender, goldGained * 10**18);
        }
    }
    
    /**
     * @dev 更新体力
     */
    function updateStamina() external {
        battleSystem.updateStamina();
    }
    
    // ========== 宝箱系统代理 ==========
    
    /**
     * @dev 领取离线宝箱
     */
    function claimOfflineTreasureBoxes() external returns (uint8) {
        return treasureBoxSystem.claimOfflineTreasureBoxes();
    }
    
    /**
     * @dev 开启宝箱
     */
    function openTreasureBox(uint256 boxIndex) external {
        // 开启宝箱并获取奖励信息
        TreasureBoxSystem.BoxReward memory reward = treasureBoxSystem.openTreasureBox(boxIndex);
        
        // 铸造金币奖励
        if (reward.goldAmount > 0) {
            goldToken.mint(msg.sender, reward.goldAmount);
        }
    }
    
    /**
     * @dev 批量开启宝箱
     */
    function openMultipleTreasureBoxes(uint256[] calldata boxIndices) external {
        // 开启多个宝箱并获取总奖励信息
        TreasureBoxSystem.BoxReward memory totalReward = treasureBoxSystem.openMultipleTreasureBoxes(boxIndices);
        
        // 铸造金币奖励
        if (totalReward.goldAmount > 0) {
            goldToken.mint(msg.sender, totalReward.goldAmount);
        }
    }
    
    // ========== 装备系统 ==========
    
    /**
     * @dev 装备道具
     * @param tokenId 装备的 token ID
     * @param slot 装备槽位 (0-7)
     */
    function equipItem(uint256 tokenId, uint8 slot) external {
        require(equipmentNFT.ownerOf(tokenId) == msg.sender, "Not your equipment");
        require(slot < 8, "Invalid slot");
        
        GameStructs.EquippedItems storage equipped = equippedItems[msg.sender];
        
        // 卸下当前装备的道具
        uint256 oldTokenId = _getSlotTokenId(equipped, slot);
        if (oldTokenId != 0) {
            emit EquipmentUnequipped(msg.sender, oldTokenId, slot);
        }
        
        // 装备新道具
        _setSlotTokenId(equipped, tokenId, slot);
        
        emit EquipmentEquipped(msg.sender, tokenId, slot);
    }
    
    /**
     * @dev 卸下装备
     * @param slot 装备槽位
     */
    function unequipItem(uint8 slot) external {
        require(slot < 8, "Invalid slot");
        
        GameStructs.EquippedItems storage equipped = equippedItems[msg.sender];
        uint256 tokenId = _getSlotTokenId(equipped, slot);
        require(tokenId != 0, "No equipment in this slot");
        
        _setSlotTokenId(equipped, 0, slot);
        
        emit EquipmentUnequipped(msg.sender, tokenId, slot);
    }
    
    /**
     * @dev 铸造装备 (开宝箱奖励)
     */
    function mintEquipmentReward(
        address to,
        uint8 equipmentType,
        uint8 level,
        uint8 stars,
        uint8 rarity,
        string memory name
    ) external returns (uint256) {
        require(msg.sender == address(treasureBoxSystem), "Only treasure box system can mint rewards");
        
        // 根据等级和稀有度计算属性
        (uint16 attack, uint16 defense, uint16 agility, uint8 critRate, uint16 critDamage) = 
            _calculateEquipmentStats(level, rarity);
        
        return equipmentNFT.mintEquipment(
            to,
            equipmentType,
            level,
            stars,
            rarity,
            attack,
            defense,
            agility,
            critRate,
            critDamage,
            name
        );
    }
    
    /**
     * @dev 计算装备属性
     */
    function _calculateEquipmentStats(uint8 level, uint8 rarity) internal pure returns (
        uint16 attack,
        uint16 defense,
        uint16 agility,
        uint8 critRate,
        uint16 critDamage
    ) {
        // 基础属性
        uint16 baseAttack = level * 2;
        uint16 baseDefense = level * 1;
        uint16 baseAgility = level * 1;
        
        // 稀有度加成 (普通100%, 不普通150%, 稀有200%, 史诗300%, 传说500%)
        uint16 rarityMultiplier = 100 + (uint16(rarity) * 50);
        if (rarity >= 3) rarityMultiplier += 100; // 史诗和传说额外加成
        
        attack = (baseAttack * rarityMultiplier) / 100;
        defense = (baseDefense * rarityMultiplier) / 100;
        agility = (baseAgility * rarityMultiplier) / 100;
        critRate = rarity + 1; // 1-5%
        critDamage = 150 + (uint16(rarity) * 25); // 150%-275%
    }
    
    // ========== 内部工具函数 ==========
    
    function _getSlotTokenId(GameStructs.EquippedItems storage equipped, uint8 slot) internal view returns (uint256) {
        if (slot == 0) return equipped.helmet;
        if (slot == 1) return equipped.armor;
        if (slot == 2) return equipped.shoes;
        if (slot == 3) return equipped.weapon;
        if (slot == 4) return equipped.shield;
        if (slot == 5) return equipped.accessory;
        if (slot == 6) return equipped.ring;
        if (slot == 7) return equipped.pet;
        return 0;
    }
    
    function _setSlotTokenId(GameStructs.EquippedItems storage equipped, uint256 tokenId, uint8 slot) internal {
        if (slot == 0) equipped.helmet = tokenId;
        else if (slot == 1) equipped.armor = tokenId;
        else if (slot == 2) equipped.shoes = tokenId;
        else if (slot == 3) equipped.weapon = tokenId;
        else if (slot == 4) equipped.shield = tokenId;
        else if (slot == 5) equipped.accessory = tokenId;
        else if (slot == 6) equipped.ring = tokenId;
        else if (slot == 7) equipped.pet = tokenId;
    }
    
    // ========== 查询函数 ==========
    
    /**
     * @dev 获取玩家数据
     */
    function getPlayer(address playerAddress) external view returns (GameStructs.Player memory) {
        return battleSystem.getPlayer(playerAddress);
    }
    
    /**
     * @dev 获取装备数据
     */
    function getEquippedItems(address playerAddress) external view returns (GameStructs.EquippedItems memory) {
        return equippedItems[playerAddress];
    }
    
    /**
     * @dev 获取金币余额
     */
    function getGoldBalance(address playerAddress) external view returns (uint256) {
        return goldToken.balanceOf(playerAddress);
    }
    
    /**
     * @dev 获取未开启的宝箱数量
     */
    function getUnopenedBoxCount(address playerAddress) external view returns (uint256) {
        return treasureBoxSystem.getUnopenedBoxCount(playerAddress);
    }
    
    /**
     * @dev 获取宝箱总数
     */
    function getPlayerTreasureBoxCount(address playerAddress) external view returns (uint256) {
        return treasureBoxSystem.getPlayerTreasureBoxCount(playerAddress);
    }
    
    /**
     * @dev 获取可领取的离线宝箱数量
     */
    function getClaimableOfflineBoxes(address playerAddress) external view returns (uint8) {
        return treasureBoxSystem.getClaimableOfflineBoxes(playerAddress);
    }
    
    /**
     * @dev 获取战斗统计
     */
    function getBattleStats(address playerAddress) external view returns (
        uint32 totalBattlesCount,
        uint32 totalVictoriesCount,
        uint8 winRate,
        uint32 lastBattle
    ) {
        return battleSystem.getBattleStats(playerAddress);
    }
    
    /**
     * @dev 检查是否可以战斗
     */
    function canBattle(address playerAddress, uint8 staminaCost) external view returns (bool) {
        return battleSystem.canBattle(playerAddress, staminaCost);
    }
}