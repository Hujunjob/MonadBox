// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Player.sol";
import "./TreasureBoxSystem.sol";
import "./GameConfig.sol";

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
    
    // 事件
    event BattleCompleted(uint256 indexed playerId, uint16 experienceGained, bool victory, uint8 monsterLevel);
    
    constructor(address _playerNFT, address _treasureBoxSystem) Ownable(msg.sender) {
        playerNFT = Player(_playerNFT);
        treasureBoxSystem = TreasureBoxSystem(_treasureBoxSystem);
    }
    
    /**
     * @dev 完成战斗（移除金币奖励）
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
        require(playerNFT.canBattle(playerId, staminaCost), "Cannot battle - insufficient stamina or player not exists");
        
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
            treasureBoxSystem.addBattleTreasureBox(playerNFT.ownerOf(playerId), boxLevel);
        }
        
        emit BattleCompleted(playerId, experienceGained, victory, monsterLevel);
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
     * @dev 检查是否可以战斗（委托给Player合约）
     */
    function canBattle(uint256 playerId, uint8 staminaCost) external view returns (bool) {
        return playerNFT.canBattle(playerId, staminaCost);
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