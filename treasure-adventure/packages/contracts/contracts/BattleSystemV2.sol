// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Player.sol";
import "./TreasureBoxSystem.sol";
import "./GameConfig.sol";
import "./GameStructs.sol";

/**
 * @title BattleSystemV2
 * @dev 战斗系统合约 - 处理战斗逻辑，经验获得，不再产生金币
 */
contract BattleSystemV2 is Ownable {
    Player public playerNFT;
    TreasureBoxSystem public treasureBoxSystem;
    
    // 战斗统计
    mapping(uint256 => uint32) public totalBattles;      // playerId => 总战斗次数
    mapping(uint256 => uint32) public totalVictories;    // playerId => 总胜利次数
    mapping(uint256 => uint32) public lastBattleTime;    // playerId => 最后战斗时间
    mapping(uint256 => uint8) public maxAdventureLevel;  // playerId => 最大冒险层数记录
    
    // 事件
    event BattleCompleted(uint256 indexed playerId, uint16 experienceGained, bool victory, uint8 adventureLevel, uint8 monsterLevel);
    event AdventureLevelUnlocked(uint256 indexed playerId, uint8 newMaxLevel);
    
    constructor(address _playerNFT, address _treasureBoxSystem) Ownable(msg.sender) {
        playerNFT = Player(_playerNFT);
        treasureBoxSystem = TreasureBoxSystem(_treasureBoxSystem);
    }
    
    /**
     * @dev 开始冒险战斗 - 新版本包含完整战斗逻辑
     * @param playerId 玩家NFT ID
     * @param adventureLevel 选择的冒险层数 (1-10)
     */
    function startAdventure(uint256 playerId, uint8 adventureLevel) external {
        require(playerNFT.ownerOf(playerId) == msg.sender, "Not your player");
        require(adventureLevel >= 1 && adventureLevel <= 10, "Invalid adventure level");
        require(adventureLevel <= maxAdventureLevel[playerId] + 1, "Adventure level not unlocked");
        
        // 消耗体力 (每层消耗1点体力)
        uint8 staminaCost = 1;
        require(_canBattle(playerId, staminaCost), "Cannot battle - insufficient stamina");
        
        // 消耗体力
        playerNFT.consumeStamina(playerId, staminaCost);
        
        // 怪物等级等于冒险层数
        uint8 monsterLevel = adventureLevel;
        
        // 进行战斗判定
        bool victory = _battleResolution(playerId, monsterLevel);
        
        // 更新战斗统计
        totalBattles[playerId]++;
        lastBattleTime[playerId] = uint32(block.timestamp);
        
        if (victory) {
            totalVictories[playerId]++;
            
            // 经验获得 (基于冒险层数)
            uint16 experienceGained = uint16(adventureLevel * 10 + 20);
            playerNFT.addExperience(playerId, experienceGained);
            
            // 更新最大冒险层数记录
            if (adventureLevel > maxAdventureLevel[playerId]) {
                maxAdventureLevel[playerId] = adventureLevel;
                emit AdventureLevelUnlocked(playerId, adventureLevel);
            }
            
            // 更新森林进度
            GameStructs.Player memory player = playerNFT.getPlayer(playerId);
            _updateForestProgress(playerId, player);
            
            // 生成战斗宝箱 (胜利才给宝箱)
            uint8 boxLevel = _calculateBattleBoxLevel(monsterLevel, player.level, playerId);
            treasureBoxSystem.addBattleTreasureBox(playerId, boxLevel);
            
            emit BattleCompleted(playerId, experienceGained, victory, adventureLevel, monsterLevel);
        } else {
            emit BattleCompleted(playerId, 0, victory, adventureLevel, monsterLevel);
        }
    }
    
    /**
     * @dev 战斗判定逻辑
     * @param playerId 玩家ID
     * @param monsterLevel 怪物等级
     * @return 是否胜利
     */
    function _battleResolution(uint256 playerId, uint8 monsterLevel) internal view returns (bool) {
        // 获取玩家总属性（包含装备加成）
        (uint16 playerAttack, uint16 playerDefense, , , ) = playerNFT.getPlayerTotalStats(playerId);
        
        // 计算怪物属性 (基于等级)
        uint16 monsterDefense = uint16(monsterLevel * 5 + 10); // 基础防御 + 等级加成
        
        // 战斗判定：随机值(0到玩家攻击力) vs 怪物防御力
        uint256 randomAttack = _generateRandom(playerId, monsterLevel) % (playerAttack + 1);
        
        return randomAttack > monsterDefense;
    }
    
    /**
     * @dev 检查是否可以战斗 (替代Player合约中的canBattle)
     * @param playerId 玩家ID
     * @param staminaCost 体力消耗
     * @return 是否可以战斗
     */
    function _canBattle(uint256 playerId, uint8 staminaCost) internal view returns (bool) {
        GameStructs.Player memory player = playerNFT.getPlayer(playerId);
        if (!player.initialized) return false;
        
        // 计算当前体力
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
     * @dev 生成战斗随机数
     */
    function _generateRandom(uint256 playerId, uint8 monsterLevel) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, playerId, monsterLevel)));
    }
    
    /**
     * @dev 旧版本的completeBattle函数 - 保持兼容性
     * @param playerId 玩家NFT ID
     * @param experienceGained 获得的经验
     * @param staminaCost 消耗的体力
     * @param victory 是否胜利
     * @param monsterLevel 怪物等级 (用于确定宝箱等级)
     */
    function completeBattle(
        uint256 playerId,
        uint16 experienceGained,
        uint8 staminaCost,
        bool victory,
        uint8 monsterLevel
    ) external {
        // 验证调用者是玩家NFT的所有者
        require(playerNFT.ownerOf(playerId) == msg.sender, "Not your player");
        
        // 检查是否可以战斗
        require(_canBattle(playerId, staminaCost), "Cannot battle - insufficient stamina or player not exists");
        
        // 消耗体力
        playerNFT.consumeStamina(playerId, staminaCost);
        
        // 更新战斗统计
        totalBattles[playerId]++;
        lastBattleTime[playerId] = uint32(block.timestamp);
        
        if (victory) {
            totalVictories[playerId]++;
            
            // 获得经验（不再给金币）
            playerNFT.addExperience(playerId, experienceGained);
            
            // 更新森林进度
            GameStructs.Player memory player = playerNFT.getPlayer(playerId);
            _updateForestProgress(playerId, player);
            
            // 生成战斗宝箱 (胜利才给宝箱)
            uint8 boxLevel = _calculateBattleBoxLevel(monsterLevel, player.level, playerId);
            treasureBoxSystem.addBattleTreasureBox(playerId, boxLevel);
        }
        
        emit BattleCompleted(playerId, experienceGained, victory, monsterLevel, monsterLevel);
    }
    
    /**
     * @dev 更新森林进度
     */
    function _updateForestProgress(uint256 playerId, GameStructs.Player memory player) internal {
        // 简化的森林进度逻辑 - 每10次胜利进入下一层
        uint16 newProgress = player.currentForestProgress + 1;
        
        if (newProgress >= 10) {
            // 进入下一层森林
            // 这里需要Player合约提供更新森林进度的函数
            // 暂时跳过，因为Player合约没有这个功能
        }
    }
    
    /**
     * @dev 计算战斗宝箱等级
     * @param monsterLevel 怪物等级
     * @param playerLevel 玩家等级
     * @param playerId 玩家ID (用于随机种子)
     * @return 宝箱等级 (1-10)
     */
    function _calculateBattleBoxLevel(uint8 monsterLevel, uint16 playerLevel, uint256 playerId) internal view returns (uint8) {
        // 基础宝箱等级基于怪物等级
        uint8 baseLevel = (monsterLevel + 2) / 3; // 怪物等级1-3给1级宝箱，4-6给2级宝箱...
        
        // 如果玩家等级比怪物高很多，降低宝箱等级
        if (playerLevel > monsterLevel + 5) {
            baseLevel = baseLevel > 1 ? baseLevel - 1 : 1;
        }
        
        // 小概率提升宝箱等级
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, playerId, monsterLevel))) % 100;
        if (random < 10 && baseLevel < 10) { // 10%概率提升一级
            baseLevel++;
        }
        
        return baseLevel > 10 ? 10 : baseLevel;
    }
    
    /**
     * @dev 获取战斗统计
     */
    function getBattleStats(uint256 playerId) external view returns (
        uint32 totalBattlesCount,
        uint32 totalVictoriesCount,
        uint8 winRate,
        uint32 lastBattle
    ) {
        totalBattlesCount = totalBattles[playerId];
        totalVictoriesCount = totalVictories[playerId];
        winRate = totalBattlesCount > 0 ? uint8((totalVictoriesCount * 100) / totalBattlesCount) : 0;
        lastBattle = lastBattleTime[playerId];
    }
    
    /**
     * @dev 检查是否可以战斗 (新版本)
     */
    function canBattle(uint256 playerId, uint8 staminaCost) external view returns (bool) {
        return _canBattle(playerId, staminaCost);
    }
    
    /**
     * @dev 获取玩家最大冒险层数
     */
    function getMaxAdventureLevel(uint256 playerId) external view returns (uint8) {
        return maxAdventureLevel[playerId] == 0 ? 1 : maxAdventureLevel[playerId];
    }
    
    /**
     * @dev 获取怪物属性预览
     * @param monsterLevel 怪物等级
     * @return defense 怪物防御力
     */
    function getMonsterStats(uint8 monsterLevel) external pure returns (uint16 defense) {
        defense = uint16(monsterLevel * 5 + 10);
    }
    
    /**
     * @dev 战斗胜率预估
     * @param playerId 玩家ID
     * @param monsterLevel 怪物等级
     * @return 胜率百分比 (0-100)
     */
    function estimateWinRate(uint256 playerId, uint8 monsterLevel) external view returns (uint8) {
        (uint16 playerAttack, , , , ) = playerNFT.getPlayerTotalStats(playerId);
        uint16 monsterDefense = uint16(monsterLevel * 5 + 10);
        
        if (playerAttack <= monsterDefense) {
            return 0;
        } else if (playerAttack >= monsterDefense * 2) {
            return 100;
        } else {
            // 简化的胜率计算
            return uint8(((playerAttack - monsterDefense) * 100) / playerAttack);
        }
    }
    
    /**
     * @dev 更新Player NFT合约地址
     */
    function updatePlayerNFT(address _playerNFT) external onlyOwner {
        playerNFT = Player(_playerNFT);
    }
    
    /**
     * @dev 更新TreasureBoxSystem合约地址
     */
    function updateTreasureBoxSystem(address _treasureBoxSystem) external onlyOwner {
        treasureBoxSystem = TreasureBoxSystem(_treasureBoxSystem);
    }
}