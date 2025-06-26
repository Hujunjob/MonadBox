// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./Player.sol";
import "./TreasureBoxSystem.sol";
import "./FightSystem.sol";

/**
 * @title BattleSystem
 * @dev 战斗系统合约 - 处理战斗逻辑，经验获得，不再产生金币
 */
contract BattleSystem is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    Player public playerNFT;
    TreasureBoxSystem public treasureBoxSystem;
    FightSystem public fightSystem;

    // 体力配置
    uint8 public STAMINA_COST_PER_BATTLE;

    // 冒险等级配置
    uint16 public MIN_ADVENTURE_LEVEL;
    uint16 public MAX_ADVENTURE_LEVEL;
    uint8 public MIN_MONSTER_LEVEL;
    uint8 public MAX_MONSTER_LEVEL;

    // 经验配置
    uint16 public BASE_EXPERIENCE_REWARD;
    uint16 public EXPERIENCE_PER_MONSTER_LEVEL;
    uint16 public EXPERIENCE_PER_ADVENTURE_LEVEL;

    // 怪物配置
    uint16 public MONSTER_BASE_DEFENSE;
    uint16 public MONSTER_DEFENSE_PER_LEVEL;
    uint16 public MONSTER_DEFENSE_PER_ADVENTURE_LEVEL;

    uint16 public MONSTER_BASE_HEALTH;
    uint16 public MONSTER_HEALTH_PER_LEVEL;
    uint16 public MONSTER_HEALTH_PER_ADVENTURE_LEVEL;

    uint16 public MONSTER_BASE_ATTACK;
    uint16 public MONSTER_ATTACK_PER_LEVEL;
    uint16 public MONSTER_ATTACK_PER_ADVENTURE_LEVEL;

    uint16 public MONSTER_BASE_AGILITY;
    uint16 public MONSTER_AGILITY_PER_LEVEL;
    uint16 public MONSTER_AGILITY_PER_ADVENTURE_LEVEL;
    // totalCritRate,
    // totalCritDamage
    uint16 public MONSTER_BASE_CRITI_RATE;
    uint16 public MONSTER_BASE_CRITI_DAMAGE;

    // 宝箱等级配置
    uint8 public TREASURE_BOX_LEVEL_DIVISOR;
    uint8 public TREASURE_BOX_UPGRADE_CHANCE; // 10%
    uint8 public TREASURE_BOX_RANDOM_RANGE;
    uint8 public MAX_TREASURE_BOX_LEVEL;
    uint8 public PLAYER_LEVEL_ADVANTAGE_THRESHOLD;

    // 胜率计算配置
    uint8 public WIN_RATE_MULTIPLIER;
    uint8 public DOUBLE_ATTACK_WIN_RATE;
    uint8 public MIN_WIN_RATE;

    // 阵列大小配置
    uint8 public MONSTER_TYPES_COUNT;
    // 战斗统计
    mapping(uint256 => uint32) public totalBattles; // playerId => 总战斗次数
    mapping(uint256 => uint32) public totalVictories; // playerId => 总胜利次数
    mapping(uint256 => uint32) public lastBattleTime; // playerId => 最后战斗时间
    mapping(uint256 => uint16) public maxAdventureLevel; // playerId => 最大冒险层数记录

    // 每层怪物击杀记录 playerId => adventureLevel => monsterLevel => 击杀次数
    mapping(uint256 => mapping(uint16 => mapping(uint8 => uint16)))
        public monsterKillCount;
    // 每层总击杀数 playerId => adventureLevel => 总击杀数
    mapping(uint256 => mapping(uint16 => uint16)) public levelKillCount;
    // 记录玩家当前层级的最高怪物等级
    mapping(uint256 => mapping(uint16 => uint8)) public maxMonsterLevel;

    // 事件
    event BattleCompleted(
        uint256 indexed playerId,
        uint16 experienceGained,
        bool victory,
        uint16 adventureLevel,
        uint8 monsterLevel
    );
    event AdventureLevelUnlocked(uint256 indexed playerId, uint16 newMaxLevel);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initParams() internal {
        // 体力配置
        STAMINA_COST_PER_BATTLE = 1;

        // 冒险等级配置
        MIN_ADVENTURE_LEVEL = 1;
        MAX_ADVENTURE_LEVEL = 1000;
        MIN_MONSTER_LEVEL = 1;
        MAX_MONSTER_LEVEL = 10;

        // 经验配置
        BASE_EXPERIENCE_REWARD = 30;
        EXPERIENCE_PER_MONSTER_LEVEL = 10;
        EXPERIENCE_PER_ADVENTURE_LEVEL = 5;

        // 怪物配置
        MONSTER_BASE_DEFENSE = 5;
        MONSTER_DEFENSE_PER_LEVEL = 2;
        MONSTER_DEFENSE_PER_ADVENTURE_LEVEL = 3;

        MONSTER_BASE_HEALTH = 50;
        MONSTER_HEALTH_PER_LEVEL = 10;
        MONSTER_HEALTH_PER_ADVENTURE_LEVEL = 10;

        MONSTER_BASE_ATTACK = 5;
        MONSTER_ATTACK_PER_LEVEL = 2;
        MONSTER_ATTACK_PER_ADVENTURE_LEVEL = 3;

        MONSTER_BASE_AGILITY = 4;
        MONSTER_AGILITY_PER_LEVEL = 1;
        MONSTER_AGILITY_PER_ADVENTURE_LEVEL = 1;

        MONSTER_BASE_CRITI_RATE = 5;
        MONSTER_BASE_CRITI_DAMAGE = 150;

        // 宝箱等级配置
        TREASURE_BOX_LEVEL_DIVISOR = 3;
        TREASURE_BOX_UPGRADE_CHANCE = 10; // 10%
        TREASURE_BOX_RANDOM_RANGE = 100;
        MAX_TREASURE_BOX_LEVEL = 10;
        PLAYER_LEVEL_ADVANTAGE_THRESHOLD = 5;

        // 胜率计算配置
        WIN_RATE_MULTIPLIER = 100;
        DOUBLE_ATTACK_WIN_RATE = 100;
        MIN_WIN_RATE = 0;

        // 阵列大小配置
        MONSTER_TYPES_COUNT = 10;
    }

    function initialize(
        address _playerNFT,
        address _treasureBoxSystem,
        address _fightSystem,
        address initialOwner
    ) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();

        playerNFT = Player(_playerNFT);
        treasureBoxSystem = TreasureBoxSystem(_treasureBoxSystem);
        fightSystem = FightSystem(_fightSystem);
        initParams();
    }

    /**
     * @dev 获取怪物属性预览
     * @param monsterLevel 怪物等级
     * @return defense 怪物防御力
     */
    function getMonsterStats(
        uint16 adventureLevel,
        uint8 monsterLevel
    ) public view returns (uint16[7] memory) {
        // 计算怪物属性
        uint16 monsterDefense = uint16(
            MONSTER_BASE_DEFENSE +
                (monsterLevel - 1) *
                MONSTER_DEFENSE_PER_LEVEL +
                (adventureLevel - 1) *
                MONSTER_DEFENSE_PER_ADVENTURE_LEVEL
        );

        // 怪物血量和攻击力基于等级计算
        uint16 monsterHealth = uint16(
            MONSTER_BASE_HEALTH +
                (monsterLevel - 1) *
                MONSTER_HEALTH_PER_LEVEL +
                (adventureLevel - 1) *
                MONSTER_HEALTH_PER_ADVENTURE_LEVEL
        );
        uint16 monsterAttack = uint16(
            MONSTER_BASE_ATTACK +
                (monsterLevel - 1) *
                MONSTER_ATTACK_PER_LEVEL +
                (adventureLevel - 1) *
                MONSTER_ATTACK_PER_ADVENTURE_LEVEL
        );
        uint16 monsterAgility = uint16(
            MONSTER_BASE_AGILITY +
                (monsterLevel - 1) *
                MONSTER_AGILITY_PER_LEVEL +
                (adventureLevel - 1) *
                MONSTER_AGILITY_PER_ADVENTURE_LEVEL
        );

        // 怪物属性数组
        uint16[7] memory monsterStats = [
            monsterHealth,
            monsterHealth,
            monsterAttack,
            monsterDefense,
            monsterAgility,
            MONSTER_BASE_CRITI_RATE,
            MONSTER_BASE_CRITI_DAMAGE
        ];
        return monsterStats;
    }

    /**
     * @dev 开始冒险战斗 - 新版本包含完整战斗逻辑
     * @param playerId 玩家NFT ID
     * @param adventureLevel 选择的冒险层数 (1-10)
     * @param monsterLevel 在adventureLevel层数时，选择怪物的等级。每1层，有10个怪物
     * 必须杀死10个怪物，才能通往下一层。杀死过的怪物，用户还可以继续杀
     */
    function startAdventure(
        uint256 playerId,
        uint16 adventureLevel,
        uint8 monsterLevel
    ) external returns (bytes32 battleId) {
        require(playerNFT.ownerOf(playerId) == msg.sender, "Not your player");
        require(
            adventureLevel >= MIN_ADVENTURE_LEVEL &&
                adventureLevel <= MAX_ADVENTURE_LEVEL,
            "Invalid adventure level"
        );
        require(
            monsterLevel >= MIN_MONSTER_LEVEL &&
                monsterLevel <= MAX_MONSTER_LEVEL,
            "Invalid monster level"
        );

        // 检查层级解锁逻辑：第1层总是解锁的，其他层需要前一层通关
        if (adventureLevel > MIN_ADVENTURE_LEVEL) {
            require(
                adventureLevel <= maxAdventureLevel[playerId] + 1,
                "Adventure level not unlocked"
            );
        }

        // 检查怪物等级解锁逻辑：必须按顺序击败怪物
        if (monsterLevel > MIN_MONSTER_LEVEL) {
            require(
                monsterKillCount[playerId][adventureLevel][monsterLevel - 1] >
                    0,
                "Previous monster not defeated"
            );
        }

        // 消耗体力 (每层消耗1点体力)
        uint8 staminaCost = STAMINA_COST_PER_BATTLE;
        require(
            _canBattle(playerId, staminaCost),
            "Cannot battle - insufficient stamina"
        );

        // 消耗体力
        playerNFT.consumeStamina(playerId, staminaCost);

        // 使用FightSystem进行战斗
        (
            bool victory,
            bytes32 fightBattleId,
            uint16 finalHealth
        ) = _useFightSystem(playerId, adventureLevel, monsterLevel);
        battleId = fightBattleId;

        // 更新战斗统计
        totalBattles[playerId]++;
        lastBattleTime[playerId] = uint32(block.timestamp);

        if (victory) {
            totalVictories[playerId]++;

            // 记录怪物击杀
            monsterKillCount[playerId][adventureLevel][monsterLevel]++;
            levelKillCount[playerId][adventureLevel]++;

            // 更新该层级的最高怪物等级
            if (monsterLevel > maxMonsterLevel[playerId][adventureLevel]) {
                maxMonsterLevel[playerId][adventureLevel] = monsterLevel;
            }

            // 经验获得 (基于怪物等级和层级)
            uint16 experienceGained = uint16(
                monsterLevel *
                    EXPERIENCE_PER_MONSTER_LEVEL +
                    adventureLevel *
                    EXPERIENCE_PER_ADVENTURE_LEVEL +
                    BASE_EXPERIENCE_REWARD
            );
            playerNFT.addExperience(playerId, experienceGained);

            // 检查是否解锁下一层 (需要在当前层杀死10个不同等级的怪物)
            if (_checkLevelUnlock(playerId, adventureLevel)) {
                if (adventureLevel > maxAdventureLevel[playerId]) {
                    maxAdventureLevel[playerId] = adventureLevel;
                    emit AdventureLevelUnlocked(playerId, adventureLevel);
                }
            }

            // 更新森林进度
            Player.PlayerData memory player = playerNFT.getPlayer(playerId);

            // 生成战斗宝箱 (胜利才给宝箱)
            uint8 boxLevel = _calculateBattleBoxLevel(
                monsterLevel,
                player.level,
                playerId
            );
            treasureBoxSystem.addBattleTreasureBox(playerId, boxLevel);

            emit BattleCompleted(
                playerId,
                experienceGained,
                victory,
                adventureLevel,
                monsterLevel
            );
        } else {
            emit BattleCompleted(
                playerId,
                0,
                victory,
                adventureLevel,
                monsterLevel
            );
        }

        return battleId;
    }

    /**
     * @dev 检查是否解锁下一层 (需要杀死10个不同等级的怪物)
     * @param playerId 玩家ID
     * @param adventureLevel 当前冒险层数
     * @return 是否可以解锁下一层
     */
    function _checkLevelUnlock(
        uint256 playerId,
        uint16 adventureLevel
    ) internal view returns (bool) {
        // 检查是否已经杀死了10个不同等级的怪物
        uint8 killedMonsterTypes = 0;
        for (uint8 i = MIN_MONSTER_LEVEL; i <= MAX_MONSTER_LEVEL; i++) {
            if (monsterKillCount[playerId][adventureLevel][i] > 0) {
                killedMonsterTypes++;
            }
        }
        return killedMonsterTypes >= MONSTER_TYPES_COUNT;
    }

    /**
     * @dev 使用FightSystem进行战斗
     * @param playerId 玩家ID
     * @param adventureLevel 冒险等级
     * @param monsterLevel 怪物等级
     * @return victory 是否胜利
     * @return battleId 战斗ID
     * @return finalHealth 战斗结束后玩家血量
     */
    function _useFightSystem(
        uint256 playerId,
        uint16 adventureLevel,
        uint8 monsterLevel
    ) internal returns (bool victory, bytes32 battleId, uint16 finalHealth) {
        // 获取玩家属性
        Player.PlayerData memory playerData = playerNFT.getPlayer(playerId);
        (
            uint16 totalAttack,
            uint16 totalDefense,
            uint16 totalAgility,
            uint8 totalCritRate,
            uint16 totalCritDamage
        ) = playerNFT.getPlayerTotalStats(playerId);

        // 玩家属性数组
        uint16[7] memory playerStats = [
            playerData.health,
            playerData.maxHealth,
            totalAttack,
            totalDefense,
            totalAgility,
            totalCritRate,
            totalCritDamage
        ];

        uint16[7] memory monsterStats = getMonsterStats(
            adventureLevel,
            monsterLevel
        );

        // 战斗配置：可以使用血瓶，可以逃跑，战斗后改变血量
        FightSystem.BattleConfig memory config = FightSystem.BattleConfig({
            canUsePotion: true,
            changePlayerHealth: true,
            canEscape: true
        });

        uint256 monsterId = adventureLevel * 100 + monsterLevel;
        // 开始战斗
        battleId = fightSystem.startBattle(
            playerId,
            fightSystem.FIGHTER_TYPE_PLAYER(),
            playerStats,
            monsterId, // 怪物ID
            fightSystem.FIGHTER_TYPE_NPC(),
            monsterStats,
            config
        );

        // 获取战斗结果
        FightSystem.BattleResult memory result = fightSystem.getBattleResult(
            battleId
        );

        // 处理战斗后的玩家状态（血瓶消耗和血量更新）
        _processBattleResult(playerId, result);

        victory = result.winnerId == playerId && !result.escaped;
        finalHealth = playerNFT.getPlayer(playerId).health;
    }

    /**
     * @dev 处理战斗结果，更新玩家状态和消耗血瓶
     */
    function _processBattleResult(
        uint256 playerId,
        FightSystem.BattleResult memory result
    ) internal {
        // 获取玩家最终血量
        uint16 finalHealth = 0;
        for (uint256 i = 0; i < result.battleLog.length; i++) {
            FightSystem.BattleAction memory action = result.battleLog[i];
            if (action.actorId == playerId) {
                finalHealth = action.remainingHealth;
                // 如果使用了血瓶，消耗玩家的血瓶
                if (
                    action.action == FightSystem.ActionType.USE_POTION &&
                    action.usedPotionId > 0
                ) {
                    playerNFT.useItem(playerId, action.usedPotionId, 1);
                }
            }
        }

        // 更新玩家血量为战斗结束后的血量
        Player.PlayerData memory playerData = playerNFT.getPlayer(playerId);
        playerNFT.setHealth(playerId, playerData.health);
    }

    /**
     * @dev 检查是否可以战斗 (替代Player合约中的canBattle)
     * @param playerId 玩家ID
     * @param staminaCost 体力消耗
     * @return 是否可以战斗
     */
    function _canBattle(
        uint256 playerId,
        uint8 staminaCost
    ) internal view returns (bool) {
        Player.PlayerData memory player = playerNFT.getPlayer(playerId);
        //玩家不存在
        if (player.maxHealth == 0) return false;
        if (player.health == 0) return false;
        uint8 currentStamina = player.stamina;
        return currentStamina >= staminaCost;
    }

    /**
     * @dev 生成战斗随机数
     */
    function _generateRandom(
        uint256 playerId,
        uint8 monsterLevel
    ) internal view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.prevrandao,
                        playerId,
                        monsterLevel
                    )
                )
            );
    }

    /**
     * @dev 计算战斗宝箱等级
     * @param monsterLevel 怪物等级
     * @param playerLevel 玩家等级
     * @param playerId 玩家ID (用于随机种子)
     * @return 宝箱等级 (1-10)
     */
    function _calculateBattleBoxLevel(
        uint8 monsterLevel,
        uint16 playerLevel,
        uint256 playerId
    ) internal view returns (uint8) {
        // 基础宝箱等级基于怪物等级
        uint8 baseLevel = (monsterLevel + 2) / TREASURE_BOX_LEVEL_DIVISOR; // 怪物等级1-3给1级宝箱，4-6给2级宝箱...

        // 如果玩家等级比怪物高很多，降低宝箱等级
        if (playerLevel > monsterLevel + PLAYER_LEVEL_ADVANTAGE_THRESHOLD) {
            baseLevel = baseLevel > MIN_MONSTER_LEVEL
                ? baseLevel - 1
                : MIN_MONSTER_LEVEL;
        }

        // 小概率提升宝箱等级
        uint256 random = uint256(
            keccak256(abi.encodePacked(block.timestamp, playerId, monsterLevel))
        ) % TREASURE_BOX_RANDOM_RANGE;
        if (
            random < TREASURE_BOX_UPGRADE_CHANCE &&
            baseLevel < MAX_TREASURE_BOX_LEVEL
        ) {
            // 10%概率提升一级
            baseLevel++;
        }

        return
            baseLevel > MAX_TREASURE_BOX_LEVEL
                ? MAX_TREASURE_BOX_LEVEL
                : baseLevel;
    }

    /**
     * @dev 获取战斗统计
     */
    function getBattleStats(
        uint256 playerId
    )
        external
        view
        returns (
            uint32 totalBattlesCount,
            uint32 totalVictoriesCount,
            uint8 winRate,
            uint32 lastBattle
        )
    {
        totalBattlesCount = totalBattles[playerId];
        totalVictoriesCount = totalVictories[playerId];
        winRate = totalBattlesCount > 0
            ? uint8(
                (totalVictoriesCount * WIN_RATE_MULTIPLIER) / totalBattlesCount
            )
            : MIN_WIN_RATE;
        lastBattle = lastBattleTime[playerId];
    }

    /**
     * @dev 检查是否可以战斗 (新版本)
     */
    function canBattle(
        uint256 playerId,
        uint8 staminaCost
    ) external view returns (bool) {
        return _canBattle(playerId, staminaCost);
    }

    /**
     * @dev 获取玩家最大冒险层数
     */
    function getMaxAdventureLevel(
        uint256 playerId
    ) external view returns (uint16) {
        return
            maxAdventureLevel[playerId] == 0
                ? MIN_ADVENTURE_LEVEL
                : maxAdventureLevel[playerId];
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
    function updateTreasureBoxSystem(
        address _treasureBoxSystem
    ) external onlyOwner {
        treasureBoxSystem = TreasureBoxSystem(_treasureBoxSystem);
    }

    /**
     * @dev 更新FightSystem合约地址
     */
    function updateFightSystem(address _fightSystem) external onlyOwner {
        fightSystem = FightSystem(_fightSystem);
    }

    // ========== 查询函数 ==========

    /**
     * @dev 获取特定怪物的击杀次数
     */
    function getMonsterKillCount(
        uint256 playerId,
        uint16 adventureLevel,
        uint8 monsterLevel
    ) external view returns (uint16) {
        return monsterKillCount[playerId][adventureLevel][monsterLevel];
    }

    /**
     * @dev 获取某层的总击杀数
     */
    function getLevelKillCount(
        uint256 playerId,
        uint16 adventureLevel
    ) external view returns (uint16) {
        return levelKillCount[playerId][adventureLevel];
    }

    /**
     * @dev 获取某层已击杀的不同怪物类型数量
     */
    function getKilledMonsterTypes(
        uint256 playerId,
        uint16 adventureLevel
    ) external view returns (uint8) {
        uint8 killedTypes = 0;
        for (uint8 i = MIN_MONSTER_LEVEL; i <= MAX_MONSTER_LEVEL; i++) {
            if (monsterKillCount[playerId][adventureLevel][i] > 0) {
                killedTypes++;
            }
        }
        return killedTypes;
    }

    /**
     * @dev 检查某层是否已解锁下一层
     */
    function isNextLevelUnlocked(
        uint256 playerId,
        uint16 adventureLevel
    ) external view returns (bool) {
        return _checkLevelUnlock(playerId, adventureLevel);
    }

    /**
     * @dev 获取某层的怪物击杀详情
     */
    function getLevelMonsterKills(
        uint256 playerId,
        uint16 adventureLevel
    ) external view returns (uint16[10] memory) {
        uint16[10] memory kills;
        for (uint8 i = 0; i < MONSTER_TYPES_COUNT; i++) {
            kills[i] = monsterKillCount[playerId][adventureLevel][i + 1];
        }
        return kills;
    }

    /**
     * @dev 获取玩家当前层级和最高怪物等级
     */
    function getPlayerProgress(
        uint256 playerId
    ) external view returns (uint16 currentLevel, uint8 maxMonster) {
        currentLevel = maxAdventureLevel[playerId] == 0
            ? MIN_ADVENTURE_LEVEL
            : maxAdventureLevel[playerId];
        maxMonster = maxMonsterLevel[playerId][currentLevel];
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
