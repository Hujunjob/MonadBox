// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GameConfig
 * @dev 宝物冒险游戏的配置常量
 */
library GameConfig {
    // 体力配置
    uint8 public constant MAX_STAMINA = 24;
    uint32 public constant STAMINA_RECOVERY_INTERVAL = 30; // 1 hour
    
    // 宝箱配置
    uint256 public constant TREASURE_BOX_INTERVAL = 10; // 1 hour
    uint256 public constant MAX_OFFLINE_BOXES = 100;
    
    // 经验和等级配置
    uint16 public constant BASE_EXP_PER_LEVEL = 100;
    uint16 public constant MAX_LEVEL = 100;
    
    // 初始玩家属性
    uint16 public constant INITIAL_HEALTH = 100;
    uint16 public constant INITIAL_ATTACK = 15;
    uint16 public constant INITIAL_DEFENSE = 5;
    uint16 public constant INITIAL_AGILITY = 10;
    uint8 public constant INITIAL_CRIT_RATE = 5;
    uint16 public constant INITIAL_CRIT_DAMAGE = 150;
    
    // 升级属性提升
    uint16 public constant HEALTH_PER_LEVEL = 10;
    uint16 public constant ATTACK_PER_LEVEL = 2;
    uint16 public constant DEFENSE_PER_LEVEL = 1;
    uint16 public constant AGILITY_PER_LEVEL = 1;
    
    // 奖励配置
    uint256 public constant INITIAL_GOLD_REWARD = 100 * 10**18; // 100 GOLD
    uint256 public constant TREASURE_BOX_GOLD_REWARD = 50 * 10**18; // 50 GOLD per box
}