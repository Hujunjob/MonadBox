// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Player.sol";
import "./AdventureGold.sol";

/**
 * @title Rank
 * @dev 排名系统合约 - 玩家可以挑战其他玩家争夺排名位置
 */
contract Rank is Ownable, ReentrancyGuard {
    Player public playerNFT;
    AdventureGold public goldToken;
    
    // 挑战费用和手续费配置
    uint256 public constant CHALLENGE_COST = 20e18; // 200 gold
    uint256 public constant FEE_RATE = 2000; // 20% = 2000 basis points
    uint256 public constant BASIS_POINTS = 10000; // 100%
    
    // 排名数据存储
    mapping(uint256 => uint256) public rankToPlayer; // rank index => player ID
    mapping(uint256 => uint256) public playerToRank; // player ID => rank index
    uint256 public maxRankIndex; // 当前最高排名索引
    
    // 挑战冷却时间（防止频繁挑战）
    mapping(uint256 => uint256) public lastChallengeTime;
    uint256 public constant CHALLENGE_COOLDOWN = 20; // 20 seconds
    
    // 事件
    event ChallengeIssued(
        uint256 indexed challengerPlayerId,
        uint256 indexed targetRankIndex,
        uint256 indexed targetPlayerId,
        uint256 challengeCost
    );
    
    event ChallengeResult(
        uint256 indexed challengerPlayerId,
        uint256 indexed targetPlayerId,
        uint256 challengerOldRank,
        uint256 targetOldRank,
        uint256 challengerNewRank,
        uint256 targetNewRank,
        bool challengerWon,
        uint256 reward,
        uint256 fee
    );
    
    event RankClaimed(
        uint256 indexed playerId,
        uint256 indexed rankIndex,
        uint256 burnedGold
    );
    
    constructor(
        address _playerNFT,
        address _goldToken
    ) Ownable(msg.sender) {
        playerNFT = Player(_playerNFT);
        goldToken = AdventureGold(_goldToken);
        maxRankIndex = 0;
    }
    
    /**
     * @dev 挑战指定排名的玩家
     * @param playerId 挑战者玩家ID
     * @param targetRankIndex 目标排名索引（1开始）
     */
    function fight(uint256 playerId, uint256 targetRankIndex) external nonReentrant {
        require(playerNFT.ownerOf(playerId) == msg.sender, "Not your player");
        require(targetRankIndex > 0, "Invalid rank index");
        require(
            block.timestamp >= lastChallengeTime[playerId] + CHALLENGE_COOLDOWN,
            "Challenge cooldown active"
        );
        
        // 验证目标排名索引的有效性
        require(
            targetRankIndex <= maxRankIndex + 1,
            "Cannot challenge beyond max rank + 1"
        );
        
        // 检查挑战者金币余额
        require(
            playerNFT.getPlayerGold(playerId) >= CHALLENGE_COST,
            "Insufficient gold for challenge"
        );
        
        uint256 targetPlayerId = rankToPlayer[targetRankIndex];
        
        // 更新挑战冷却时间
        lastChallengeTime[playerId] = block.timestamp;
        
        if (targetPlayerId == 0) {
            // 挑战空位置 - 必须是连续的下一个排名
            require(
                targetRankIndex == maxRankIndex + 1,
                "Can only claim the next available rank"
            );
            
            _claimEmptyRank(playerId, targetRankIndex);
        } else {
            // 挑战现有玩家
            require(targetPlayerId != playerId, "Cannot challenge yourself");
            _challengePlayer(playerId, targetPlayerId, targetRankIndex);
        }
    }
    
    /**
     * @dev 占据空排名位置
     */
    function _claimEmptyRank(uint256 playerId, uint256 rankIndex) internal {
        // 支付挑战费用 - 全部销毁
        playerNFT.spendGold(playerId, CHALLENGE_COST, address(this));
        goldToken.burn(address(this), CHALLENGE_COST);
        
        // 如果玩家已有排名，清除旧排名
        uint256 oldRank = playerToRank[playerId];
        if (oldRank != 0) {
            rankToPlayer[oldRank] = 0;
        }
        
        // 设置新排名
        rankToPlayer[rankIndex] = playerId;
        playerToRank[playerId] = rankIndex;
        
        // 更新最大排名索引
        if (rankIndex > maxRankIndex) {
            maxRankIndex = rankIndex;
        }
        
        emit RankClaimed(playerId, rankIndex, CHALLENGE_COST);
    }
    
    /**
     * @dev 挑战现有玩家
     */
    function _challengePlayer(
        uint256 challengerPlayerId,
        uint256 targetPlayerId,
        uint256 targetRankIndex
    ) internal {
        // 支付挑战费用
        playerNFT.spendGold(challengerPlayerId, CHALLENGE_COST, address(this));
        
        // 计算手续费和奖励
        uint256 fee = (CHALLENGE_COST * FEE_RATE) / BASIS_POINTS;
        uint256 reward = CHALLENGE_COST - fee;
        
        // 获取双方战斗属性
        (uint16 challengerAttack, uint16 challengerDefense, uint16 challengerAgility,,) = 
            playerNFT.getPlayerTotalStats(challengerPlayerId);
        (uint16 targetAttack, uint16 targetDefense, uint16 targetAgility,,) = 
            playerNFT.getPlayerTotalStats(targetPlayerId);
        
        // 简单的战斗计算
        bool challengerWins = _calculateBattleResult(
            challengerAttack, challengerDefense, challengerAgility,
            targetAttack, targetDefense, targetAgility,
            challengerPlayerId
        );
        
        uint256 challengerOldRank = playerToRank[challengerPlayerId];
        uint256 targetOldRank = targetRankIndex;
        uint256 challengerNewRank = challengerOldRank;
        uint256 targetNewRank = targetOldRank;
        
        emit ChallengeIssued(challengerPlayerId, targetRankIndex, targetPlayerId, CHALLENGE_COST);
        
        if (challengerWins) {
            // 挑战者胜利 - 交换排名
            if (challengerOldRank != 0) {
                // 挑战者原本有排名
                rankToPlayer[challengerOldRank] = targetPlayerId;
                playerToRank[targetPlayerId] = challengerOldRank;
                targetNewRank = challengerOldRank;
            } else {
                // 挑战者原本无排名，目标玩家失去排名
                playerToRank[targetPlayerId] = 0;
                targetNewRank = 0;
            }
            
            // 挑战者获得目标排名
            rankToPlayer[targetRankIndex] = challengerPlayerId;
            playerToRank[challengerPlayerId] = targetRankIndex;
            challengerNewRank = targetRankIndex;
            
            // 挑战者获得奖励（扣除手续费）
            playerNFT.addGold(challengerPlayerId, reward);
        } else {
            // 挑战者失败 - 目标玩家获得奖励
            playerNFT.addGold(targetPlayerId, reward);
        }
        
        // 销毁手续费
        goldToken.burn(address(this), fee);
        
        emit ChallengeResult(
            challengerPlayerId,
            targetPlayerId,
            challengerOldRank,
            targetOldRank,
            challengerNewRank,
            targetNewRank,
            challengerWins,
            reward,
            fee
        );
    }
    
    /**
     * @dev 计算战斗结果
     */
    function _calculateBattleResult(
        uint16 challengerAttack,
        uint16 challengerDefense,
        uint16 challengerAgility,
        uint16 targetAttack,
        uint16 targetDefense,
        uint16 targetAgility,
        uint256 challengerPlayerId
    ) internal view returns (bool) {
        // 计算综合战力
        uint256 challengerPower = uint256(challengerAttack) * 3 + 
                                 uint256(challengerDefense) * 2 + 
                                 uint256(challengerAgility);
        uint256 targetPower = uint256(targetAttack) * 3 + 
                             uint256(targetDefense) * 2 + 
                             uint256(targetAgility);
        
        // 添加随机因素（基于区块哈希和玩家ID）
        uint256 randomFactor = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            challengerPlayerId
        ))) % 100;
        
        // 战力差异越大，胜率越高，但保留随机性
        if (challengerPower > targetPower) {
            uint256 advantage = ((challengerPower - targetPower) * 100) / targetPower;
            return randomFactor < (50 + advantage); // 基础50%胜率 + 优势加成
        } else {
            uint256 disadvantage = ((targetPower - challengerPower) * 100) / challengerPower;
            return randomFactor > (50 + disadvantage); // 基础50%胜率 - 劣势减成
        }
    }
    
    /**
     * @dev 获取排名信息
     */
    function getRankInfo(uint256 rankIndex) external view returns (uint256 playerId, string memory playerName) {
        playerId = rankToPlayer[rankIndex];
        if (playerId != 0) {
            GameStructs.Player memory player = playerNFT.getPlayer(playerId);
            playerName = player.name;
        }
    }
    
    /**
     * @dev 获取玩家排名
     */
    function getPlayerRank(uint256 playerId) external view returns (uint256) {
        return playerToRank[playerId];
    }
    
    /**
     * @dev 获取排行榜（前N名）
     */
    function getTopRanks(uint256 limit) external view returns (
        uint256[] memory rankIndexes,
        uint256[] memory playerIds,
        string[] memory playerNames
    ) {
        uint256 actualLimit = limit > maxRankIndex ? maxRankIndex : limit;
        
        rankIndexes = new uint256[](actualLimit);
        playerIds = new uint256[](actualLimit);
        playerNames = new string[](actualLimit);
        
        for (uint256 i = 0; i < actualLimit; i++) {
            uint256 rankIndex = i + 1;
            uint256 playerId = rankToPlayer[rankIndex];
            
            rankIndexes[i] = rankIndex;
            playerIds[i] = playerId;
            
            if (playerId != 0) {
                GameStructs.Player memory player = playerNFT.getPlayer(playerId);
                playerNames[i] = player.name;
            }
        }
    }
    
    /**
     * @dev 获取玩家下次可挑战时间
     */
    function getNextChallengeTime(uint256 playerId) external view returns (uint256) {
        uint256 lastChallenge = lastChallengeTime[playerId];
        if (lastChallenge == 0) return block.timestamp;
        
        uint256 nextChallenge = lastChallenge + CHALLENGE_COOLDOWN;
        return nextChallenge > block.timestamp ? nextChallenge : block.timestamp;
    }
    
    /**
     * @dev 检查玩家是否可以挑战
     */
    function canChallenge(uint256 playerId) external view returns (bool) {
        return block.timestamp >= lastChallengeTime[playerId] + CHALLENGE_COOLDOWN;
    }
}