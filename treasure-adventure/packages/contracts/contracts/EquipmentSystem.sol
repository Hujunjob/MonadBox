// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Equipment.sol";
import "./AdventureGold.sol";

/**
 * @title EquipmentSystem
 * @dev 装备系统合约 - 管理装备升星、强化、消耗等功能
 */
contract EquipmentSystem is Ownable {
    Equipment public equipmentNFT;
    AdventureGold public goldToken;
    
    // 升星配置
    struct StarUpgradeConfig {
        uint256 goldCost;      // 金币消耗
        uint8 successRate;     // 成功率 (0-100)
        uint8 maxLevel;        // 该星级的最大强化等级
        uint16 statMultiplier; // 属性倍数 (百分比)
    }
    
    // 强化配置
    struct EnhanceConfig {
        uint256 goldCost;      // 金币消耗
        uint8 successRate;     // 成功率 (0-100)
        uint16 statBonus;      // 属性加成
    }
    
    // 升星配置 (星级 => 配置)
    mapping(uint8 => StarUpgradeConfig) public starConfigs;
    
    // 强化配置 (强化等级 => 配置)
    mapping(uint8 => EnhanceConfig) public enhanceConfigs;
    
    // 装备强化等级 (tokenId => level)
    mapping(uint256 => uint8) public equipmentEnhanceLevel;
    
    // 事件
    event EquipmentStarUpgraded(uint256 indexed tokenId, uint8 oldStars, uint8 newStars);
    event EquipmentEnhanced(uint256 indexed tokenId, uint8 oldLevel, uint8 newLevel);
    event EquipmentUpgradeFailed(uint256 indexed tokenId, string reason);
    
    constructor(address _equipmentNFT, address _goldToken) Ownable(msg.sender) {
        equipmentNFT = Equipment(_equipmentNFT);
        goldToken = AdventureGold(_goldToken);
        
        _initializeConfigs();
    }
    
    /**
     * @dev 初始化升星和强化配置
     */
    function _initializeConfigs() internal {
        // 升星配置 (星级越高，消耗越大，成功率越低)
        starConfigs[1] = StarUpgradeConfig(1000e18, 80, 5, 120);   // 1星->2星: 1000金币, 80%成功率
        starConfigs[2] = StarUpgradeConfig(2500e18, 70, 10, 150);  // 2星->3星: 2500金币, 70%成功率
        starConfigs[3] = StarUpgradeConfig(5000e18, 60, 15, 200);  // 3星->4星: 5000金币, 60%成功率
        starConfigs[4] = StarUpgradeConfig(10000e18, 50, 20, 300); // 4星->5星: 10000金币, 50%成功率
        
        // 强化配置 (等级越高，消耗越大)
        for (uint8 i = 1; i <= 20; i++) {
            enhanceConfigs[i] = EnhanceConfig(
                uint256(i) * 100e18,  // 金币消耗递增
                uint8(95 - i * 2),    // 成功率递减
                uint16(i * 5)         // 属性加成递增
            );
        }
    }
    
    /**
     * @dev 装备升星
     * @param tokenId 装备NFT ID
     */
    function upgradeStars(uint256 tokenId) external {
        require(equipmentNFT.ownerOf(tokenId) == msg.sender, "Not your equipment");
        
        Equipment.EquipmentData memory equipment = equipmentNFT.getEquipment(tokenId);
        require(equipment.stars < 5, "Already max stars");
        
        // 获取升星配置（要升到下一个星级的配置）
        uint8 targetStars = equipment.stars + 1;
        StarUpgradeConfig memory config = starConfigs[targetStars];
        require(config.goldCost > 0, "Invalid star level");
        require(goldToken.balanceOf(msg.sender) >= config.goldCost, "Insufficient gold");
        
        // 消耗金币
        goldToken.burn(msg.sender, config.goldCost);
        
        // 随机判断成功
        uint256 random = _generateRandom(tokenId, block.timestamp) % 100;
        if (random < config.successRate) {
            // 升星成功
            uint8 oldStars = equipment.stars;
            uint8 newStars = oldStars + 1;
            
            // 更新装备属性 (基于新星级的倍数)
            StarUpgradeConfig memory newConfig = starConfigs[newStars];
            uint16 multiplier = newConfig.statMultiplier;
            
            uint16 newAttack = (equipment.attack * multiplier) / 100;
            uint16 newDefense = (equipment.defense * multiplier) / 100;
            uint16 newAgility = (equipment.agility * multiplier) / 100;
            uint8 newCritRate = equipment.criticalRate + 1;
            uint16 newCritDamage = equipment.criticalDamage + 25;
            
            equipmentNFT.updateEquipment(
                tokenId,
                newStars,
                newAttack,
                newDefense,
                newAgility,
                newCritRate,
                newCritDamage
            );
            
            emit EquipmentStarUpgraded(tokenId, oldStars, newStars);
        } else {
            // 升星失败
            emit EquipmentUpgradeFailed(tokenId, "Star upgrade failed");
        }
    }
    
    /**
     * @dev 装备强化
     * @param tokenId 装备NFT ID
     */
    function enhanceEquipment(uint256 tokenId) external {
        require(equipmentNFT.ownerOf(tokenId) == msg.sender, "Not your equipment");
        
        uint8 currentLevel = equipmentEnhanceLevel[tokenId];
        require(currentLevel < 20, "Already max enhance level");
        
        Equipment.EquipmentData memory equipment = equipmentNFT.getEquipment(tokenId);
        StarUpgradeConfig memory starConfig = starConfigs[equipment.stars];
        require(currentLevel < starConfig.maxLevel, "Enhance level limited by stars");
        
        EnhanceConfig memory config = enhanceConfigs[currentLevel + 1];
        require(goldToken.balanceOf(msg.sender) >= config.goldCost, "Insufficient gold");
        
        // 消耗金币
        goldToken.burn(msg.sender, config.goldCost);
        
        // 随机判断成功
        uint256 random = _generateRandom(tokenId, block.timestamp + 1) % 100;
        if (random < config.successRate) {
            // 强化成功
            uint8 oldLevel = currentLevel;
            uint8 newLevel = currentLevel + 1;
            equipmentEnhanceLevel[tokenId] = newLevel;
            
            // 增加装备属性
            uint16 newAttack = equipment.attack + config.statBonus;
            uint16 newDefense = equipment.defense + config.statBonus;
            uint16 newAgility = equipment.agility + config.statBonus;
            
            equipmentNFT.updateEquipment(
                tokenId,
                equipment.stars,
                newAttack,
                newDefense,
                newAgility,
                equipment.criticalRate,
                equipment.criticalDamage
            );
            
            emit EquipmentEnhanced(tokenId, oldLevel, newLevel);
        } else {
            // 强化失败
            emit EquipmentUpgradeFailed(tokenId, "Enhancement failed");
        }
    }
    
    /**
     * @dev 装备分解（获得金币）
     * @param tokenId 装备NFT ID
     */
    function decomposeEquipment(uint256 tokenId) external {
        require(equipmentNFT.ownerOf(tokenId) == msg.sender, "Not your equipment");
        
        Equipment.EquipmentData memory equipment = equipmentNFT.getEquipment(tokenId);
        uint8 enhanceLevel = equipmentEnhanceLevel[tokenId];
        
        // 计算回收金币 (基于星级、等级、强化等级)
        uint256 baseValue = uint256(equipment.level) * 100e18;
        uint256 starBonus = uint256(equipment.stars) * uint256(equipment.stars) * 500e18;
        uint256 enhanceBonus = uint256(enhanceLevel) * 200e18;
        uint256 totalValue = baseValue + starBonus + enhanceBonus;
        
        // 删除装备记录
        delete equipmentEnhanceLevel[tokenId];
        
        // 销毁NFT
        equipmentNFT.burn(tokenId);
        
        // 给予金币
        goldToken.mint(msg.sender, totalValue);
    }
    
    /**
     * @dev 批量强化
     * @param tokenIds 装备NFT ID数组
     */
    function batchEnhance(uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            // 检查owner和条件，如果满足就强化
            if (equipmentNFT.ownerOf(tokenIds[i]) == msg.sender) {
                uint8 currentLevel = equipmentEnhanceLevel[tokenIds[i]];
                if (currentLevel < 20) {
                    EnhanceConfig memory config = enhanceConfigs[currentLevel + 1];
                    if (goldToken.balanceOf(msg.sender) >= config.goldCost) {
                        // 内部调用强化逻辑
                        _internalEnhance(tokenIds[i]);
                    }
                }
            }
        }
    }
    
    /**
     * @dev 内部强化函数
     */
    function _internalEnhance(uint256 tokenId) internal {
        uint8 currentLevel = equipmentEnhanceLevel[tokenId];
        Equipment.EquipmentData memory equipment = equipmentNFT.getEquipment(tokenId);
        StarUpgradeConfig memory starConfig = starConfigs[equipment.stars];
        
        if (currentLevel >= starConfig.maxLevel) return;
        
        EnhanceConfig memory config = enhanceConfigs[currentLevel + 1];
        goldToken.burn(msg.sender, config.goldCost);
        
        uint256 random = _generateRandom(tokenId, block.timestamp + currentLevel) % 100;
        if (random < config.successRate) {
            equipmentEnhanceLevel[tokenId] = currentLevel + 1;
            
            uint16 newAttack = equipment.attack + config.statBonus;
            uint16 newDefense = equipment.defense + config.statBonus;
            uint16 newAgility = equipment.agility + config.statBonus;
            
            equipmentNFT.updateEquipment(
                tokenId,
                equipment.stars,
                newAttack,
                newDefense,
                newAgility,
                equipment.criticalRate,
                equipment.criticalDamage
            );
            
            emit EquipmentEnhanced(tokenId, currentLevel, currentLevel + 1);
        } else {
            emit EquipmentUpgradeFailed(tokenId, "Enhancement failed");
        }
    }
    
    /**
     * @dev 生成随机数
     */
    function _generateRandom(uint256 tokenId, uint256 seed) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, tokenId, seed)));
    }
    
    /**
     * @dev 获取装备完整信息（包含强化等级）
     */
    function getEquipmentFullData(uint256 tokenId) external view returns (
        Equipment.EquipmentData memory equipmentData,
        uint8 enhanceLevel,
        uint256 nextEnhanceCost,
        uint256 nextStarCost
    ) {
        equipmentData = equipmentNFT.getEquipment(tokenId);
        enhanceLevel = equipmentEnhanceLevel[tokenId];
        
        if (enhanceLevel < 20) {
            nextEnhanceCost = enhanceConfigs[enhanceLevel + 1].goldCost;
        }
        
        if (equipmentData.stars < 5) {
            nextStarCost = starConfigs[equipmentData.stars].goldCost;
        }
    }
    
    /**
     * @dev 更新升星配置 (仅owner)
     */
    function updateStarConfig(uint8 stars, StarUpgradeConfig memory config) external onlyOwner {
        starConfigs[stars] = config;
    }
    
    /**
     * @dev 更新强化配置 (仅owner)
     */
    function updateEnhanceConfig(uint8 level, EnhanceConfig memory config) external onlyOwner {
        enhanceConfigs[level] = config;
    }
}