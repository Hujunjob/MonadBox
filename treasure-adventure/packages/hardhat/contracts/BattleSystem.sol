// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AdventureGold.sol";
import "./TreasureBoxSystem.sol";
import "./GameStructs.sol";
import "./GameConfig.sol";

/**
 * @title BattleSystem
 * @dev 战斗系统合约 - 处理战斗逻辑、经验、升级
 */
contract BattleSystem is Ownable {
    AdventureGold public goldToken;
    TreasureBoxSystem public treasureBoxSystem;
    
    // 玩家战斗数据
    mapping(address => GameStructs.Player) public players;
    mapping(address => uint32) public lastBattleTime;
    
    // 战斗统计
    mapping(address => uint32) public totalBattles;
    mapping(address => uint32) public totalVictories;
    
    // 事件
    event PlayerRegistered(address indexed player, string name);
    event BattleCompleted(address indexed player, uint16 experience, uint256 gold, bool victory);
    event LevelUp(address indexed player, uint16 newLevel, uint16 oldLevel);
    event StaminaUpdated(address indexed player, uint8 newStamina);
    
    constructor(address _goldToken, address _treasureBoxSystem) Ownable(msg.sender) {
        goldToken = AdventureGold(_goldToken);
        treasureBoxSystem = TreasureBoxSystem(_treasureBoxSystem);
    }
    
    /**
     * @dev 玩家注册
     * @param playerAddress 玩家地址
     * @param name 玩家名称
     */
    function registerPlayer(address playerAddress, string memory name) external {
        require(!players[playerAddress].initialized, "Player already registered");
        require(bytes(name).length >= 2 && bytes(name).length <= 20, "Invalid name length");
        
        players[playerAddress] = GameStructs.Player({
            name: name,
            level: 1,
            experience: 0,
            health: GameConfig.INITIAL_HEALTH,
            maxHealth: GameConfig.INITIAL_HEALTH,
            attack: GameConfig.INITIAL_ATTACK,
            defense: GameConfig.INITIAL_DEFENSE,
            agility: GameConfig.INITIAL_AGILITY,
            criticalRate: GameConfig.INITIAL_CRIT_RATE,
            criticalDamage: GameConfig.INITIAL_CRIT_DAMAGE,
            stamina: GameConfig.MAX_STAMINA,
            maxStamina: GameConfig.MAX_STAMINA,
            lastStaminaTime: uint32(block.timestamp),
            currentForestLevel: 1,
            currentForestProgress: 0,
            lastTreasureBoxTime: uint32(block.timestamp),
            initialized: true,
            job: 0
        });
        
        // 初始金币由 GameManager 负责铸造
        
        emit PlayerRegistered(playerAddress, name);
    }
    
    /**
     * @dev 更新体力
     */
    function updateStamina() public {
        updateStaminaForPlayer(msg.sender);
    }
    
    /**
     * @dev 为指定玩家更新体力
     */
    function updateStaminaForPlayer(address playerAddress) public {
        GameStructs.Player storage player = players[playerAddress];
        require(player.initialized, "Player not registered");
        
        uint32 timeSinceLastUpdate = uint32(block.timestamp) - player.lastStaminaTime;
        uint8 staminaToRecover = uint8(timeSinceLastUpdate / GameConfig.STAMINA_RECOVERY_INTERVAL);
        
        if (staminaToRecover > 0 && player.stamina < player.maxStamina) {
            uint8 actualRecovery = staminaToRecover;
            if (player.stamina + actualRecovery > player.maxStamina) {
                actualRecovery = player.maxStamina - player.stamina;
            }
            
            player.stamina += actualRecovery;
            player.lastStaminaTime += actualRecovery * GameConfig.STAMINA_RECOVERY_INTERVAL;
            
            emit StaminaUpdated(playerAddress, player.stamina);
        }
    }
    
    /**
     * @dev 完成战斗
     * @param experienceGained 获得的经验
     * @param goldGained 获得的金币 (不包含小数点)
     * @param staminaCost 消耗的体力
     * @param victory 是否胜利
     * @param monsterLevel 怪物等级 (用于确定宝箱等级)
     */
    function completeBattle(
        address playerAddress,
        uint16 experienceGained,
        uint256 goldGained,
        uint8 staminaCost,
        bool victory,
        uint8 monsterLevel
    ) external {
        GameStructs.Player storage player = players[playerAddress];
        require(player.initialized, "Player not registered");
        require(player.stamina >= staminaCost, "Not enough stamina");
        
        // 更新体力
        updateStaminaForPlayer(playerAddress);
        
        // 消耗体力
        player.stamina -= staminaCost;
        player.lastStaminaTime = uint32(block.timestamp);
        
        // 更新战斗统计
        totalBattles[playerAddress]++;
        lastBattleTime[playerAddress] = uint32(block.timestamp);
        
        if (victory) {
            totalVictories[playerAddress]++;
            
            // 获得经验和金币
            uint16 oldLevel = player.level;
            player.experience += experienceGained;
            // 金币铸造由调用者（GameManager）负责
            
            // 检查升级
            _checkLevelUp(player, oldLevel, playerAddress);
            
            // 森林进度
            _updateForestProgress(player);
            
            // 生成战斗宝箱 (胜利才给宝箱)
            uint8 boxLevel = _calculateBattleBoxLevel(monsterLevel, player.level, playerAddress);
            treasureBoxSystem.addBattleTreasureBox(playerAddress, boxLevel);
        }
        
        emit BattleCompleted(playerAddress, experienceGained, goldGained, victory);
    }
    
    /**
     * @dev 检查并处理升级
     * @param player 玩家数据
     * @param oldLevel 旧等级
     * @param playerAddress 玩家地址
     */
    function _checkLevelUp(GameStructs.Player storage player, uint16 oldLevel, address playerAddress) internal {
        uint16 expNeeded = player.level * GameConfig.BASE_EXP_PER_LEVEL;
        
        while (player.experience >= expNeeded && player.level < 100) { // 最大等级100
            player.level++;
            player.experience -= expNeeded;
            
            // 升级属性提升
            player.maxHealth += GameConfig.HEALTH_PER_LEVEL;
            player.health = player.maxHealth; // 升级时满血
            player.attack += GameConfig.ATTACK_PER_LEVEL;
            player.defense += GameConfig.DEFENSE_PER_LEVEL;
            player.agility += GameConfig.AGILITY_PER_LEVEL;
            
            // 每10级增加最大体力
            if (player.level % 10 == 0 && player.maxStamina < 50) {
                player.maxStamina += 2;
                player.stamina += 2; // 升级时恢复体力
            }
            
            emit LevelUp(playerAddress, player.level, oldLevel);
            
            // 更新经验需求
            expNeeded = player.level * GameConfig.BASE_EXP_PER_LEVEL;
            oldLevel = player.level;
        }
    }
    
    /**
     * @dev 更新森林进度
     * @param player 玩家数据
     */
    function _updateForestProgress(GameStructs.Player storage player) internal {
        player.currentForestProgress++;
        
        // 每完成10场战斗解锁下一层森林
        if (player.currentForestProgress >= 10) {
            player.currentForestLevel++;
            player.currentForestProgress = 0;
        }
    }
    
    /**
     * @dev 计算战斗宝箱等级
     * @param monsterLevel 怪物等级
     * @param playerLevel 玩家等级
     * @param playerAddress 玩家地址 (用于随机种子)
     * @return 宝箱等级 (1-10)
     */
    function _calculateBattleBoxLevel(uint8 monsterLevel, uint16 playerLevel, address playerAddress) internal view returns (uint8) {
        // 基础宝箱等级基于怪物等级
        uint8 baseLevel = (monsterLevel + 2) / 3; // 怪物等级1-3给1级宝箱，4-6给2级宝箱...
        
        // 如果玩家等级比怪物高很多，降低宝箱等级
        if (playerLevel > monsterLevel + 5) {
            baseLevel = baseLevel > 1 ? baseLevel - 1 : 1;
        }
        
        // 小概率提升宝箱等级
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, playerAddress, monsterLevel))) % 100;
        if (random < 10 && baseLevel < 10) { // 10%概率提升一级
            baseLevel++;
        }
        
        return baseLevel > 10 ? 10 : baseLevel;
    }
    
    /**
     * @dev 恢复血量 (使用药水等)
     * @param amount 恢复量
     */
    function healPlayer(uint16 amount) external {
        GameStructs.Player storage player = players[msg.sender];
        require(player.initialized, "Player not registered");
        
        uint16 newHealth = player.health + amount;
        if (newHealth > player.maxHealth) {
            newHealth = player.maxHealth;
        }
        player.health = newHealth;
    }
    
    /**
     * @dev 消耗体力 (其他系统调用)
     * @param amount 消耗量
     */
    function consumeStamina(address player, uint8 amount) external onlyOwner {
        GameStructs.Player storage playerData = players[player];
        require(playerData.initialized, "Player not registered");
        require(playerData.stamina >= amount, "Not enough stamina");
        
        playerData.stamina -= amount;
        playerData.lastStaminaTime = uint32(block.timestamp);
        
        emit StaminaUpdated(player, playerData.stamina);
    }
    
    // ========== 查询函数 ==========
    
    /**
     * @dev 获取玩家数据
     * @param playerAddress 玩家地址
     * @return 玩家数据结构
     */
    function getPlayer(address playerAddress) external view returns (GameStructs.Player memory) {
        return players[playerAddress];
    }
    
    /**
     * @dev 获取玩家战斗统计
     * @param playerAddress 玩家地址
     * @return totalBattlesCount 总战斗次数
     * @return totalVictoriesCount 总胜利次数
     * @return winRate 胜率 (百分比)
     * @return lastBattle 最后战斗时间
     */
    function getBattleStats(address playerAddress) external view returns (
        uint32 totalBattlesCount,
        uint32 totalVictoriesCount,
        uint8 winRate,
        uint32 lastBattle
    ) {
        totalBattlesCount = totalBattles[playerAddress];
        totalVictoriesCount = totalVictories[playerAddress];
        winRate = totalBattlesCount > 0 ? uint8((totalVictoriesCount * 100) / totalBattlesCount) : 0;
        lastBattle = lastBattleTime[playerAddress];
    }
    
    /**
     * @dev 检查玩家是否可以进行战斗
     * @param playerAddress 玩家地址
     * @param staminaCost 所需体力
     * @return 是否可以战斗
     */
    function canBattle(address playerAddress, uint8 staminaCost) external view returns (bool) {
        GameStructs.Player memory player = players[playerAddress];
        if (!player.initialized) return false;
        
        // 计算当前体力 (包括恢复的体力)
        uint32 timeSinceLastUpdate = uint32(block.timestamp) - player.lastStaminaTime;
        uint8 staminaToRecover = uint8(timeSinceLastUpdate / GameConfig.STAMINA_RECOVERY_INTERVAL);
        uint8 currentStamina = player.stamina;
        
        if (staminaToRecover > 0 && currentStamina < player.maxStamina) {
            uint8 actualRecovery = staminaToRecover;
            if (currentStamina + actualRecovery > player.maxStamina) {
                actualRecovery = player.maxStamina - currentStamina;
            }
            currentStamina += actualRecovery;
        }
        
        return currentStamina >= staminaCost;
    }
    
    /**
     * @dev 获取升级所需经验
     * @param playerAddress 玩家地址
     * @return 升级所需经验
     */
    function getExpNeededForNextLevel(address playerAddress) external view returns (uint32) {
        GameStructs.Player memory player = players[playerAddress];
        if (!player.initialized) return 0;
        
        uint32 expNeeded = uint32(player.level) * uint32(GameConfig.BASE_EXP_PER_LEVEL);
        return expNeeded > player.experience ? expNeeded - player.experience : 0;
    }
}