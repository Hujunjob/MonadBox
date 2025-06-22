// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GameStructs
 * @dev 宝物冒险游戏的数据结构定义
 */
library GameStructs {
    struct Player {
        string name;
        uint16 level;
        uint32 experience;
        uint16 health;
        uint16 maxHealth;
        uint16 attack;
        uint16 defense;
        uint16 agility;
        uint8 criticalRate;
        uint16 criticalDamage;
        uint8 stamina;
        uint8 maxStamina;
        uint32 lastStaminaTime;
        uint16 currentForestLevel;
        uint16 currentForestProgress;
        uint32 lastTreasureBoxTime;
        bool initialized;
        uint8 job; // 0=swordsman, 1=great_swordsman, etc.
    }
    
    struct EquippedItems {
        uint256 helmet;
        uint256 armor;
        uint256 shoes;
        uint256 weapon;
        uint256 shield;
        uint256 accessory;
        uint256 ring;
        uint256 pet;
    }
    
    struct BattleReward {
        uint16 experience;
        uint256 gold;
        uint256[] equipmentIds;
    }
}