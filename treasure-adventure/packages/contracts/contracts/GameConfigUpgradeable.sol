// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title GameConfigUpgradeable
 * @dev 宝物冒险游戏的可升级配置合约
 */
contract GameConfigUpgradeable is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    // 体力配置
    uint8 public maxStamina;
    uint32 public staminaRecoveryInterval;
    
    // 宝箱配置
    uint256 public treasureBoxInterval;
    uint256 public maxOfflineBoxes;
    
    // 经验和等级配置
    uint16 public baseExpPerLevel;
    uint16 public maxLevel;
    
    // 初始玩家属性
    uint16 public initialHealth;
    uint16 public initialAttack;
    uint16 public initialDefense;
    uint16 public initialAgility;
    uint8 public initialCritRate;
    uint16 public initialCritDamage;
    
    // 升级属性提升
    uint16 public healthPerLevel;
    uint16 public attackPerLevel;
    uint16 public defensePerLevel;
    uint16 public agilityPerLevel;
    
    // 奖励配置
    uint256 public initialGoldReward;
    uint256 public treasureBoxGoldReward;
    
    // 事件
    event ConfigUpdated(string configName, uint256 oldValue, uint256 newValue);
    event StaminaConfigUpdated(uint8 maxStamina, uint32 recoveryInterval);
    event TreasureBoxConfigUpdated(uint256 interval, uint256 maxOfflineBoxes);
    event PlayerAttributesUpdated(uint16 health, uint16 attack, uint16 defense, uint16 agility);
    event RewardConfigUpdated(uint256 initialGold, uint256 treasureBoxGold);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address owner) public initializer {
        __Ownable_init(owner);
        __UUPSUpgradeable_init();
        
        // 设置默认配置值
        _setDefaultConfig();
    }

    function _setDefaultConfig() internal {
        // 体力配置
        maxStamina = 24;
        staminaRecoveryInterval = 30; // 30秒（测试用）
        
        // 宝箱配置
        treasureBoxInterval = 10; // 10秒（测试用）
        maxOfflineBoxes = 100;
        
        // 经验和等级配置
        baseExpPerLevel = 100;
        maxLevel = 100;
        
        // 初始玩家属性
        initialHealth = 100;
        initialAttack = 15;
        initialDefense = 5;
        initialAgility = 10;
        initialCritRate = 5;
        initialCritDamage = 150;
        
        // 升级属性提升
        healthPerLevel = 10;
        attackPerLevel = 2;
        defensePerLevel = 1;
        agilityPerLevel = 1;
        
        // 奖励配置
        initialGoldReward = 100 * 10**18; // 100 GOLD
        treasureBoxGoldReward = 50 * 10**18; // 50 GOLD per box
    }

    // =============================================================================
    // 配置更新函数（只有owner可以调用）
    // =============================================================================

    /**
     * @dev 更新体力配置
     */
    function updateStaminaConfig(uint8 _maxStamina, uint32 _recoveryInterval) external onlyOwner {
        require(_maxStamina > 0, "Max stamina must be greater than 0");
        require(_recoveryInterval > 0, "Recovery interval must be greater than 0");
        
        maxStamina = _maxStamina;
        staminaRecoveryInterval = _recoveryInterval;
        
        emit StaminaConfigUpdated(_maxStamina, _recoveryInterval);
    }

    /**
     * @dev 更新宝箱配置
     */
    function updateTreasureBoxConfig(uint256 _interval, uint256 _maxOfflineBoxes) external onlyOwner {
        require(_interval > 0, "Interval must be greater than 0");
        require(_maxOfflineBoxes > 0, "Max offline boxes must be greater than 0");
        
        treasureBoxInterval = _interval;
        maxOfflineBoxes = _maxOfflineBoxes;
        
        emit TreasureBoxConfigUpdated(_interval, _maxOfflineBoxes);
    }

    /**
     * @dev 更新等级配置
     */
    function updateLevelConfig(uint16 _baseExpPerLevel, uint16 _maxLevel) external onlyOwner {
        require(_baseExpPerLevel > 0, "Base exp per level must be greater than 0");
        require(_maxLevel > 0, "Max level must be greater than 0");
        
        baseExpPerLevel = _baseExpPerLevel;
        maxLevel = _maxLevel;
        
        emit ConfigUpdated("baseExpPerLevel", baseExpPerLevel, _baseExpPerLevel);
        emit ConfigUpdated("maxLevel", maxLevel, _maxLevel);
    }

    /**
     * @dev 更新初始玩家属性
     */
    function updateInitialPlayerAttributes(
        uint16 _health,
        uint16 _attack,
        uint16 _defense,
        uint16 _agility,
        uint8 _critRate,
        uint16 _critDamage
    ) external onlyOwner {
        require(_health > 0, "Health must be greater than 0");
        require(_attack > 0, "Attack must be greater than 0");
        require(_critDamage >= 100, "Crit damage must be at least 100%");
        
        initialHealth = _health;
        initialAttack = _attack;
        initialDefense = _defense;
        initialAgility = _agility;
        initialCritRate = _critRate;
        initialCritDamage = _critDamage;
        
        emit PlayerAttributesUpdated(_health, _attack, _defense, _agility);
    }

    /**
     * @dev 更新升级属性提升
     */
    function updateLevelUpAttributes(
        uint16 _healthPerLevel,
        uint16 _attackPerLevel,
        uint16 _defensePerLevel,
        uint16 _agilityPerLevel
    ) external onlyOwner {
        healthPerLevel = _healthPerLevel;
        attackPerLevel = _attackPerLevel;
        defensePerLevel = _defensePerLevel;
        agilityPerLevel = _agilityPerLevel;
        
        emit ConfigUpdated("healthPerLevel", healthPerLevel, _healthPerLevel);
        emit ConfigUpdated("attackPerLevel", attackPerLevel, _attackPerLevel);
        emit ConfigUpdated("defensePerLevel", defensePerLevel, _defensePerLevel);
        emit ConfigUpdated("agilityPerLevel", agilityPerLevel, _agilityPerLevel);
    }

    /**
     * @dev 更新奖励配置
     */
    function updateRewardConfig(uint256 _initialGoldReward, uint256 _treasureBoxGoldReward) external onlyOwner {
        require(_initialGoldReward > 0, "Initial gold reward must be greater than 0");
        require(_treasureBoxGoldReward > 0, "Treasure box gold reward must be greater than 0");
        
        initialGoldReward = _initialGoldReward;
        treasureBoxGoldReward = _treasureBoxGoldReward;
        
        emit RewardConfigUpdated(_initialGoldReward, _treasureBoxGoldReward);
    }

    // =============================================================================
    // 便利函数（与原来的library保持兼容）
    // =============================================================================

    /**
     * @dev 获取所有体力配置
     */
    function getStaminaConfig() external view returns (uint8, uint32) {
        return (maxStamina, staminaRecoveryInterval);
    }

    /**
     * @dev 获取所有宝箱配置
     */
    function getTreasureBoxConfig() external view returns (uint256, uint256) {
        return (treasureBoxInterval, maxOfflineBoxes);
    }

    /**
     * @dev 获取所有等级配置
     */
    function getLevelConfig() external view returns (uint16, uint16) {
        return (baseExpPerLevel, maxLevel);
    }

    /**
     * @dev 获取所有初始属性
     */
    function getInitialPlayerAttributes() external view returns (
        uint16 health,
        uint16 attack,
        uint16 defense,
        uint16 agility,
        uint8 critRate,
        uint16 critDamage
    ) {
        return (
            initialHealth,
            initialAttack,
            initialDefense,
            initialAgility,
            initialCritRate,
            initialCritDamage
        );
    }

    /**
     * @dev 获取所有升级属性提升
     */
    function getLevelUpAttributes() external view returns (uint16, uint16, uint16, uint16) {
        return (healthPerLevel, attackPerLevel, defensePerLevel, agilityPerLevel);
    }

    /**
     * @dev 获取所有奖励配置
     */
    function getRewardConfig() external view returns (uint256, uint256) {
        return (initialGoldReward, treasureBoxGoldReward);
    }

    /**
     * @dev 批量获取所有配置（用于前端显示）
     */
    function getAllConfig() external view returns (
        uint8 _maxStamina,
        uint32 _staminaRecoveryInterval,
        uint256 _treasureBoxInterval,
        uint256 _maxOfflineBoxes,
        uint16 _baseExpPerLevel,
        uint16 _maxLevel,
        uint256 _initialGoldReward,
        uint256 _treasureBoxGoldReward
    ) {
        return (
            maxStamina,
            staminaRecoveryInterval,
            treasureBoxInterval,
            maxOfflineBoxes,
            baseExpPerLevel,
            maxLevel,
            initialGoldReward,
            treasureBoxGoldReward
        );
    }

    // =============================================================================
    // 升级函数
    // =============================================================================

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev 获取合约版本（用于升级验证）
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}