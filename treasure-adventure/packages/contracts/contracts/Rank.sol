// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./Player.sol";
import "./AdventureGold.sol";
import "./FightSystem.sol";

/**
 * @title Rank
 * @dev 排名系统合约 - 玩家可以挑战其他玩家争夺排名位置
 */
contract Rank is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    Player public playerNFT;
    AdventureGold public goldToken;
    FightSystem public fightSystem;

    // 挑战费用和手续费配置
    uint256 public CHALLENGE_COST; // 200 gold
    uint256 public FEE_RATE; // 20% = 2000 basis points
    uint256 public constant BASIS_POINTS = 10000; // 100%

    // 排名数据存储
    mapping(uint256 => uint256) public rankToPlayer; // rank index => player ID
    mapping(uint256 => uint256) public playerToRank; // player ID => rank index
    uint256 public maxRankIndex; // 当前最高排名索引

    // 挑战冷却时间已移除 - 可随时挑战

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

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _playerNFT,
        address _goldToken,
        address _fightSystem,
        address initialOwner
    ) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        playerNFT = Player(_playerNFT);
        goldToken = AdventureGold(_goldToken);
        fightSystem = FightSystem(_fightSystem);
        initConfig();
    }

    function initConfig() internal {
        // 挑战费用和手续费配置
        CHALLENGE_COST = 20e18; // 200 gold
        FEE_RATE = 2000; // 20% = 2000 basis points
    }

    /**
     * @dev 挑战指定排名的玩家
     * @param playerId 挑战者玩家ID
     * @param targetRankIndex 目标排名索引（1开始）
     */
    function fight(
        uint256 playerId,
        uint256 targetRankIndex
    ) external nonReentrant returns (bytes32 battleId) {
        require(playerNFT.ownerOf(playerId) == msg.sender, "Not your player");
        require(targetRankIndex > 0, "Invalid rank index");

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
        // 检查不能挑战比自己排名低的玩家
        uint256 challengerRank = playerToRank[playerId];
        if (challengerRank != 0) {
            require(
                targetRankIndex < challengerRank,
                "Cannot challenge players with lower rank than yourself"
            );
        }
        if (targetPlayerId == 0) {
            // 挑战空位置 - 必须是连续的下一个排名
            require(
                targetRankIndex == maxRankIndex + 1,
                "Can only claim the next available rank"
            );

            battleId = _claimEmptyRank(playerId, targetRankIndex);
        } else {
            // 挑战现有玩家
            require(targetPlayerId != playerId, "Cannot challenge yourself");

            battleId = _challengePlayer(
                playerId,
                targetPlayerId,
                targetRankIndex
            );
        }

        return battleId;
    }

    /**
     * @dev 占据空排名位置
     */
    function _claimEmptyRank(
        uint256 playerId,
        uint256 rankIndex
    ) internal returns (bytes32 battleId) {
        // 支付挑战费用 - 全部销毁
        playerNFT.spendGold(playerId, CHALLENGE_COST, address(this));
        goldToken.burn(CHALLENGE_COST);

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

        // 生成一个虚拟的battleId，因为占据空位置不需要战斗
        battleId = keccak256(
            abi.encodePacked(block.timestamp, playerId, rankIndex, "claim")
        );
        return battleId;
    }

    /**
     * @dev 挑战现有玩家
     */
    function _challengePlayer(
        uint256 challengerPlayerId,
        uint256 targetPlayerId,
        uint256 targetRankIndex
    ) internal returns (bytes32 battleId) {
        // 支付挑战费用
        playerNFT.spendGold(challengerPlayerId, CHALLENGE_COST, address(this));

        // 计算手续费和奖励
        uint256 fee = (CHALLENGE_COST * FEE_RATE) / BASIS_POINTS;
        uint256 reward = CHALLENGE_COST - fee;

        // 使用FightSystem进行战斗
        (bool challengerWins, bytes32 fightBattleId) = _useFightSystemForRank(
            challengerPlayerId,
            targetPlayerId
        );
        battleId = fightBattleId;

        uint256 challengerOldRank = playerToRank[challengerPlayerId];
        uint256 targetOldRank = targetRankIndex;
        uint256 challengerNewRank = challengerOldRank;
        uint256 targetNewRank = targetOldRank;

        emit ChallengeIssued(
            challengerPlayerId,
            targetRankIndex,
            targetPlayerId,
            CHALLENGE_COST
        );

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
        goldToken.burn(fee);

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

        return battleId;
    }

    /**
     * @dev 使用FightSystem进行排名战斗
     * @param challengerPlayerId 挑战者ID
     * @param targetPlayerId 目标玩家ID
     * @return 挑战者是否胜利
     */
    function _useFightSystemForRank(
        uint256 challengerPlayerId,
        uint256 targetPlayerId
    ) internal returns (bool, bytes32) {
        // 获取挑战者属性
        Player.PlayerData memory challengerData = playerNFT.getPlayer(
            challengerPlayerId
        );
        (
            uint16 challengerAttack,
            uint16 challengerDefense,
            uint16 challengerAgility,
            uint8 challengerCritRate,
            uint16 challengerCritDamage
        ) = playerNFT.getPlayerTotalStats(challengerPlayerId);

        // 获取目标玩家属性
        Player.PlayerData memory targetData = playerNFT.getPlayer(
            targetPlayerId
        );
        (
            uint16 targetAttack,
            uint16 targetDefense,
            uint16 targetAgility,
            uint8 targetCritRate,
            uint16 targetCritDamage
        ) = playerNFT.getPlayerTotalStats(targetPlayerId);

        // 挑战者属性数组（使用最大血量）
        uint16[7] memory challengerStats = [
            challengerData.maxHealth,
            challengerData.maxHealth,
            challengerAttack,
            challengerDefense,
            challengerAgility,
            challengerCritRate,
            challengerCritDamage
        ];

        // 目标玩家属性数组（使用最大血量）
        uint16[7] memory targetStats = [
            targetData.maxHealth,
            targetData.maxHealth,
            targetAttack,
            targetDefense,
            targetAgility,
            targetCritRate,
            targetCritDamage
        ];

        // 战斗配置：不可以使用血瓶，不可以逃跑，战斗后不改变血量
        FightSystem.BattleConfig memory config = FightSystem.BattleConfig({
            canUsePotion: false,
            changePlayerHealth: false,
            canEscape: false
        });

        // 开始战斗
        bytes32 battleId = fightSystem.startBattle(
            challengerPlayerId,
            fightSystem.FIGHTER_TYPE_PLAYER(),
            challengerStats,
            targetPlayerId,
            fightSystem.FIGHTER_TYPE_PLAYER(),
            targetStats,
            config
        );

        // 获取战斗结果
        FightSystem.BattleResult memory result = fightSystem.getBattleResult(
            battleId
        );

        // 返回挑战者是否胜利和battleId
        return (
            result.winnerId == challengerPlayerId && !result.escaped,
            battleId
        );
    }

    /**
     * @dev 获取排名信息
     */
    function getRankInfo(
        uint256 rankIndex
    ) external view returns (uint256 playerId, string memory playerName) {
        playerId = rankToPlayer[rankIndex];
        if (playerId != 0) {
            Player.PlayerData memory player = playerNFT.getPlayer(playerId);
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
    function getTopRanks(
        uint256 limit
    )
        external
        view
        returns (
            uint256[] memory rankIndexes,
            uint256[] memory playerIds,
            string[] memory playerNames
        )
    {
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
                Player.PlayerData memory player = playerNFT.getPlayer(playerId);
                playerNames[i] = player.name;
            }
        }
    }

    /**
     * @dev 检查玩家是否可以挑战（冷却已移除，始终返回true）
     */
    function canChallenge(uint256 playerId) external pure returns (bool) {
        return true;
    }

    /**
     * @dev 更新玩家NFT合约地址
     */
    function updatePlayerNFT(address _playerNFT) external onlyOwner {
        playerNFT = Player(_playerNFT);
    }

    /**
     * @dev 更新金币合约地址
     */
    function updateGoldToken(address _goldToken) external onlyOwner {
        goldToken = AdventureGold(_goldToken);
    }

    /**
     * @dev 更新FightSystem合约地址
     */
    function updateFightSystem(address _fightSystem) external onlyOwner {
        fightSystem = FightSystem(_fightSystem);
    }

    /**
     * @dev 授权升级函数 - 只有owner可以升级合约
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
