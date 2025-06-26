// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./AdventureGold.sol";
import "./Equipment.sol";
import "./Player.sol";
import "./Item.sol";

/**
 * @title TreasureBoxSystem
 * @dev 宝箱系统合约 - 处理宝箱生成、存储和开启
 */
contract TreasureBoxSystem is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    AdventureGold public goldToken;
    Equipment public equipmentNFT;
    Player public playerNFT;
    Item public itemNFT;

    // 宝箱配置
    uint256 public TREASURE_BOX_INTERVAL; // 10 seconds
    uint256 public MAX_OFFLINE_BOXES;

    // 奖励类型配置
    uint8 public REWARD_TYPE_GOLD;
    uint8 public REWARD_TYPE_EQUIPMENT;
    uint8 public REWARD_TYPE_HEALTH_POTION;
    uint8 public REWARD_TYPE_PET_EGG;
    uint8 public REWARD_TYPE_JOB_BOOK;

    // 稀有度配置
    uint8 public RARITY_COMMON;
    uint8 public RARITY_UNCOMMON;
    uint8 public RARITY_RARE;
    uint8 public RARITY_EPIC;
    uint8 public RARITY_LEGENDARY;

    // 装备类型配置
    uint8 public EQUIPMENT_TYPE_HELMET;
    uint8 public EQUIPMENT_TYPE_ARMOR_T;
    uint8 public EQUIPMENT_TYPE_SHOES_T;
    uint8 public EQUIPMENT_TYPE_WEAPON_T;
    uint8 public EQUIPMENT_TYPE_SHIELD_T;
    uint8 public EQUIPMENT_TYPE_ACCESSORY_T;
    uint8 public EQUIPMENT_TYPE_RING_T;
    uint8 public EQUIPMENT_TYPE_PET_T;
    uint8 public MAX_EQUIPMENT_TYPES;

    // 金币奖励配置
    uint256 public BASE_GOLD_AMOUNT;
    uint256 public GOLD_PER_LEVEL;
    uint256 public GOLD_RANDOM_BONUS_RANGE;

    // 稀有度倍数配置
    uint16 public RARITY_MULTIPLIER_COMMON; // 1x
    uint16 public RARITY_MULTIPLIER_UNCOMMON; // 1.5x
    uint16 public RARITY_MULTIPLIER_RARE; // 2x
    uint16 public RARITY_MULTIPLIER_EPIC; // 3x
    uint16 public RARITY_MULTIPLIER_LEGENDARY; // 5x

    // 装备属性基础值配置
    uint16 public WEAPON_BASE_ATTACK;
    uint16 public WEAPON_ATTACK_PER_LEVEL;
    uint8 public WEAPON_BASE_CRIT_RATE;
    uint8 public WEAPON_CRIT_RATE_LEVEL_DIVISOR;
    uint16 public WEAPON_BASE_CRIT_DAMAGE;
    uint16 public WEAPON_CRIT_DAMAGE_PER_LEVEL;

    uint16 public DEFENSE_BASE_VALUE;
    uint16 public DEFENSE_PER_LEVEL;
    uint16 public HEALTH_BASE_VALUE;
    uint16 public HEALTH_PER_LEVEL;

    uint16 public AGILITY_BASE_VALUE;
    uint16 public AGILITY_PER_LEVEL;

    // 概率计算相
    uint16 public RANDOM_RANGE_1000;
    uint16 public RANDOM_RANGE_100;

    struct TreasureBox {
        uint32 level; // 宝箱等级 (1-10)
        uint32 createdTime; // 创建时间
    }

    struct BoxReward {
        uint8 rewardType; // 0=gold, 1=equipment, 2=health_potion, 3=pet_egg, 4=job_book
        uint256 goldAmount; // 金币数量
        uint256 equipmentId; // 装备ID
        uint256 itemId; // 其他物品ID（血瓶、宠物蛋、转职书）
    }

    // 玩家宝箱存储（改为基于playerId）
    mapping(uint256 => TreasureBox[]) public playerTreasureBoxes;

    // 授权的系统合约
    mapping(address => bool) public authorizedSystems;

    mapping(uint256 => uint32) public playerBattleLevels;

    // 宝箱奖励概率配置 (基于100，匹配前端逻辑)
    uint8 public GOLD_PROBABILITY; // 1%
    uint8 public HEALTH_POTION_PROBABILITY; // 13%
    uint8 public PET_EGG_PROBABILITY; // 8%
    uint8 public JOB_BOOK_PROBABILITY; // 7%
    // 装备 71% (剩余概率)

    // 稀有度概率配置 (基于100)
    uint8 public COMMON_RARITY; // 60%
    uint8 public UNCOMMON_RARITY; // 23%
    uint8 public RARE_RARITY; // 10%
    uint8 public EPIC_RARITY; // 5%
    uint8 public LEGENDARY_RARITY; // 2%

    // 奖励等级概率配置
    uint8 public CURRENT_LEVEL_PROBABILITY; // 95%
    uint8 public NEXT_LEVEL_PROBABILITY; // 5%

    // 修饰符：只有授权的系统或owner可以调用
    modifier onlyAuthorizedOrOwner() {
        require(
            authorizedSystems[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    // 事件（改为基于playerId）
    event TreasureBoxAdded(uint256 indexed playerId, uint8 level);
    event TreasureBoxOpened(
        uint256 indexed playerId,
        uint256 boxIndex,
        uint8 rewardType,
        uint256 goldAmount,
        uint256 equipmentId,
        uint256 itemId
    );
    event OfflineBoxesClaimed(uint256 indexed playerId, uint256 boxCount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _goldToken,
        address _equipmentNFT,
        address _playerNFT,
        address _itemNFT,
        address initialOwner
    ) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();

        goldToken = AdventureGold(_goldToken);
        equipmentNFT = Equipment(_equipmentNFT);
        playerNFT = Player(_playerNFT);
        itemNFT = Item(_itemNFT);
        intiConfig();
    }

    function intiConfig() internal {
        // 宝箱配置
        TREASURE_BOX_INTERVAL = 10; // 10 seconds
        MAX_OFFLINE_BOXES = 100;

        // 奖励类型配置
        REWARD_TYPE_GOLD = 0;
        REWARD_TYPE_EQUIPMENT = 1;
        REWARD_TYPE_HEALTH_POTION = 2;
        REWARD_TYPE_PET_EGG = 3;
        REWARD_TYPE_JOB_BOOK = 4;

        // 稀有度配置
        RARITY_COMMON = 0;
        RARITY_UNCOMMON = 1;
        RARITY_RARE = 2;
        RARITY_EPIC = 3;
        RARITY_LEGENDARY = 4;

        // 装备类型配置
        EQUIPMENT_TYPE_HELMET = 0;
        EQUIPMENT_TYPE_ARMOR_T = 1;
        EQUIPMENT_TYPE_SHOES_T = 2;
        EQUIPMENT_TYPE_WEAPON_T = 3;
        EQUIPMENT_TYPE_SHIELD_T = 4;
        EQUIPMENT_TYPE_ACCESSORY_T = 5;
        EQUIPMENT_TYPE_RING_T = 6;
        EQUIPMENT_TYPE_PET_T = 7;
        MAX_EQUIPMENT_TYPES = 7;

        // 金币奖励配置
        BASE_GOLD_AMOUNT = 50;
        GOLD_PER_LEVEL = 25;
        GOLD_RANDOM_BONUS_RANGE = 50;

        // 稀有度倍数配置
        RARITY_MULTIPLIER_COMMON = 100; // 1x
        RARITY_MULTIPLIER_UNCOMMON = 150; // 1.5x
        RARITY_MULTIPLIER_RARE = 200; // 2x
        RARITY_MULTIPLIER_EPIC = 300; // 3x
        RARITY_MULTIPLIER_LEGENDARY = 500; // 5x

        // 装备属性基础值配置
        WEAPON_BASE_ATTACK = 5;
        WEAPON_ATTACK_PER_LEVEL = 2;
        WEAPON_BASE_CRIT_RATE = 1;
        WEAPON_CRIT_RATE_LEVEL_DIVISOR = 2;
        WEAPON_BASE_CRIT_DAMAGE = 5;
        WEAPON_CRIT_DAMAGE_PER_LEVEL = 2;

        DEFENSE_BASE_VALUE = 3;
        DEFENSE_PER_LEVEL = 1;
        HEALTH_BASE_VALUE = 10;
        HEALTH_PER_LEVEL = 3;

        AGILITY_BASE_VALUE = 2;
        AGILITY_PER_LEVEL = 1;

        // 概率计算相
        RANDOM_RANGE_1000 = 1000;
        RANDOM_RANGE_100 = 100;

        // 宝箱奖励概率配置 (基于100，匹配前端逻辑)
        GOLD_PROBABILITY = 10; // 1%
        HEALTH_POTION_PROBABILITY = 4; // 13%
        PET_EGG_PROBABILITY = 8; // 8%
        JOB_BOOK_PROBABILITY = 8; // 7%
        // 装备 71% (剩余概率)

        // 稀有度概率配置 (基于100)
        COMMON_RARITY = 60; // 60%
        UNCOMMON_RARITY = 23; // 23%
        RARE_RARITY = 10; // 10%
        EPIC_RARITY = 5; // 5%
        LEGENDARY_RARITY = 2; // 2%

        // 奖励等级概率配置
        CURRENT_LEVEL_PROBABILITY = 95; // 95%
        NEXT_LEVEL_PROBABILITY = 5; // 5%
    }

    /**
     * @dev 添加战斗宝箱 (由战斗合约调用)
     * @param playerId 玩家ID
     * @param level 宝箱等级
     */
    function addBattleTreasureBox(
        uint256 playerId,
        uint32 level
    ) external onlyAuthorizedOrOwner {
        require(level >= 1 && level <= 100, "Invalid box level");

        playerTreasureBoxes[playerId].push(
            TreasureBox({level: level, createdTime: uint32(block.timestamp)})
        );
        if (level > playerBattleLevels[playerId]) {
            playerBattleLevels[playerId] = level;
        }

        emit TreasureBoxAdded(playerId, uint8(level));
    }

    /**
     * @dev 领取离线宝箱
     * @param playerId 玩家ID
     * @return 领取的宝箱数量
     */
    function claimOfflineTreasureBoxes(
        uint256 playerId
    ) external returns (uint256) {
        // 验证调用者拥有该Player NFT
        require(
            playerNFT.ownerOf(playerId) == msg.sender,
            "Not owner of player NFT"
        );
        // 获取Player NFT中的lastTreasureBoxTime
        Player.PlayerData memory player = playerNFT.getPlayer(playerId);

        uint256 timeSinceLastBox = block.timestamp - player.lastTreasureBoxTime;
        uint256 boxesToClaim = timeSinceLastBox / TREASURE_BOX_INTERVAL;

        if (boxesToClaim > MAX_OFFLINE_BOXES) {
            boxesToClaim = MAX_OFFLINE_BOXES;
        }

        if (boxesToClaim > 0) {
            uint32 level = playerBattleLevels[playerId];
            if (level == 0) {
                playerBattleLevels[playerId] = 1;
                level = 1;
            }
            // 更新Player NFT中的lastTreasureBoxTime
            playerNFT.updateLastTreasureBoxTime(playerId);

            // 添加离线宝箱 (等级1-level的普通宝箱)
            for (uint32 i = 0; i < boxesToClaim; i++) {
                uint32 boxLevel = (i % level) + 1;

                playerTreasureBoxes[playerId].push(
                    TreasureBox({
                        level: boxLevel,
                        createdTime: uint32(block.timestamp)
                    })
                );

                emit TreasureBoxAdded(playerId, uint8(boxLevel));
            }

            emit OfflineBoxesClaimed(playerId, boxesToClaim);
        }

        return boxesToClaim;
    }

    /**
     * @dev 开启宝箱
     * @param playerId 玩家ID
     * @param boxIndex 宝箱索引
     * @return 奖励信息
     */
    function openTreasureBox(
        uint256 playerId,
        uint256 boxIndex
    ) external returns (BoxReward memory) {
        // 验证调用者拥有该Player NFT
        require(
            playerNFT.ownerOf(playerId) == msg.sender,
            "Not owner of player NFT"
        );

        require(
            boxIndex < playerTreasureBoxes[playerId].length,
            "Invalid box index"
        );

        TreasureBox storage box = playerTreasureBoxes[playerId][boxIndex];

        console.log("openTreasureBox 1");
        // 生成奖励
        BoxReward memory reward = _generateReward(uint8(box.level));

        // 删除已开启的宝箱
        _removeBox(playerId, boxIndex);

        // 发放金币奖励到Player NFT合约
        if (reward.goldAmount > 0) {
            goldToken.mint(address(playerNFT), reward.goldAmount);
            playerNFT.addGold(playerId, reward.goldAmount);
        }
        console.log("openTreasureBox 2", reward.rewardType);
        // 发放装备奖励到Player NFT合约
        if (reward.rewardType == 1) {
            // 铸造装备NFT到Player NFT合约并添加到背包
            reward.equipmentId = _mintEquipmentToPlayerNFT(
                playerId,
                uint8(box.level)
            );
        }

        // 发放物品奖励（血瓶、转职书、宠物蛋）
        if (reward.itemId > 0) {
            // mint Item NFT 给 Player NFT 合约
            itemNFT.mint(address(playerNFT), reward.itemId, 1);
            // 添加到玩家的物品库存
            playerNFT.addItem(playerId, reward.itemId, 1);
        }
        console.log("openTreasureBox 3");
        emit TreasureBoxOpened(
            playerId,
            boxIndex,
            reward.rewardType,
            reward.goldAmount,
            reward.equipmentId,
            reward.itemId
        );

        return reward;
    }

    /**
     * @dev 删除指定索引的宝箱
     * @param playerId 玩家ID
     * @param boxIndex 宝箱索引
     */
    function _removeBox(uint256 playerId, uint256 boxIndex) internal {
        TreasureBox[] storage boxes = playerTreasureBoxes[playerId];
        require(boxIndex < boxes.length, "Invalid box index");

        // 将最后一个元素移到要删除的位置
        boxes[boxIndex] = boxes[boxes.length - 1];
        // 删除最后一个元素
        boxes.pop();
    }

    /**
     * @dev 生成宝箱奖励（按照正确的随机顺序）
     * @param level 宝箱等级
     * @return 奖励信息
     */
    function _generateReward(
        uint8 level
    ) internal view returns (BoxReward memory) {
        // 步骤1：先随机奖励等级（95%当前等级，5%下一级）
        uint8 rewardLevel = _generateRewardLevel(level);

        // 步骤2：再随机奖励类型
        uint8 rewardType = _generateRewardType(level);

        // 步骤3：根据奖励类型生成具体奖励
        if (rewardType == 0) {
            // 金币奖励
            uint256 goldAmount = _calculateGoldReward(rewardLevel);
            return
                BoxReward({
                    rewardType: 0,
                    goldAmount: goldAmount,
                    equipmentId: 0,
                    itemId: 0
                });
        } else if (rewardType == 1) {
            // 装备奖励
            return
                BoxReward({
                    rewardType: 1,
                    goldAmount: 0,
                    equipmentId: 0, // 占位符，实际铸造在后面
                    itemId: 0
                });
        } else if (rewardType == 2) {
            // 血瓶奖励
            uint256 itemId = _generateHealthPotion(rewardLevel);
            return
                BoxReward({
                    rewardType: 2,
                    goldAmount: 0,
                    equipmentId: 0,
                    itemId: itemId
                });
        } else if (rewardType == 3) {
            // 宠物蛋奖励
            uint256 itemId = _generatePetEgg(rewardLevel);
            return
                BoxReward({
                    rewardType: 3,
                    goldAmount: 0,
                    equipmentId: 0,
                    itemId: itemId
                });
        } else {
            // 转职书奖励 (rewardType == 4)
            uint256 itemId = _generateJobAdvancementBook(level); // 转职书使用原始等级
            return
                BoxReward({
                    rewardType: 4,
                    goldAmount: 0,
                    equipmentId: 0,
                    itemId: itemId
                });
        }
    }

    /**
     * @dev 生成奖励类型（第二步随机）
     * @param level 宝箱等级
     * @return 奖励类型 (0=金币, 1=装备, 2=血瓶, 3=宠物蛋, 4=转职书)
     */
    function _generateRewardType(uint8 level) internal view returns (uint8) {
        uint256 random = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    msg.sender,
                    level,
                    "rewardType"
                )
            )
        ) % 100;

        if (random < GOLD_PROBABILITY) {
            return 0; // 金币 10%
        } else if (random < GOLD_PROBABILITY + HEALTH_POTION_PROBABILITY) {
            return 2; // 血瓶 4%
        } else if (
            random <
            GOLD_PROBABILITY + HEALTH_POTION_PROBABILITY + PET_EGG_PROBABILITY
        ) {
            return 3; // 宠物蛋 8%
        } else if (
            random <
            GOLD_PROBABILITY +
                HEALTH_POTION_PROBABILITY +
                PET_EGG_PROBABILITY +
                JOB_BOOK_PROBABILITY
        ) {
            return 4; // 转职书 8%
        } else {
            return 1; // 装备 70% (剩余概率)
        }
    }

    /**
     * @dev 生成奖励等级（95%当前等级，5%下一级）
     */
    function _generateRewardLevel(
        uint8 boxLevel
    ) internal view returns (uint8) {
        uint256 random = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    msg.sender,
                    boxLevel,
                    "rewardLevel"
                )
            )
        ) % 100;

        if (random < CURRENT_LEVEL_PROBABILITY) {
            return boxLevel; // 95%概率返回当前等级
        } else {
            return boxLevel >= 10 ? 10 : boxLevel + 1; // 5%概率返回下一级，最大10级
        }
    }

    /**
     * @dev 计算金币奖励（第三步随机 - 根据等级随机金币数量）
     * @param rewardLevel 奖励等级
     * @return 金币数量 (wei)
     */
    function _calculateGoldReward(
        uint8 rewardLevel
    ) internal view returns (uint256) {
        uint256 baseAmount = 50; // 基础50金币
        uint256 levelBonus = uint256(rewardLevel) * 25; // 每级25金币

        // 根据等级随机金币数量 (0-49)
        uint256 randomBonus = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    msg.sender,
                    rewardLevel,
                    "goldAmount"
                )
            )
        ) % 50;

        return (baseAmount + levelBonus + randomBonus) * 10 ** 18; // 转换为wei
    }

    /**
     * @dev 生成血瓶ID
     * @param level 血瓶等级
     * @return 血瓶ID
     */
    function _generateHealthPotion(
        uint8 level
    ) internal view returns (uint256) {
        // 血瓶ID范围：100-199，根据等级生成ID
        uint256 itemId = itemNFT.HEALTH_POTION_START_ID() + (level - 1);
        return itemId;
    }

    /**
     * @dev 生成宠物蛋ID
     * @param level 宠物蛋等级
     * @return 宠物蛋ID
     */
    function _generatePetEgg(uint8 level) internal view returns (uint256) {
        // 宠物蛋ID范围：300-399，根据等级生成ID
        uint256 itemId = itemNFT.PET_EGG_START_ID() + (level - 1);
        return itemId;
    }

    /**
     * @dev 生成转职书ID
     * @param boxLevel 宝箱等级
     * @return 转职书ID
     */
    function _generateJobAdvancementBook(
        uint8 boxLevel
    ) internal view returns (uint256) {
        uint256 jobType;

        if (boxLevel <= 2) {
            jobType = 1; // Great Swordsman
        } else if (boxLevel <= 4) {
            jobType = 2; // Temple Knight
        } else if (boxLevel <= 6) {
            jobType = 3; // Dragon Knight
        } else if (boxLevel <= 8) {
            jobType = 4; // Sword Master
        } else if (boxLevel <= 10) {
            jobType = 5; // Sword God
        } else {
            jobType = 6; // Plane Lord
        }

        // 转职书ID范围：200-299，根据职业类型生成ID
        uint256 itemId = itemNFT.JOB_BOOK_START_ID() + jobType;
        return itemId;
    }

    /**
     * @dev 生成装备稀有度（第三步随机 - 装备子步骤2）
     * @param playerId 玩家ID
     * @param level 装备等级
     * @return 装备稀有度 (0-4)
     */
    function _generateEquipmentRarity(
        uint256 playerId,
        uint8 level
    ) internal view returns (uint8) {
        uint256 random = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    msg.sender,
                    playerId,
                    level,
                    "equipRarity"
                )
            )
        ) % 100;

        if (random < COMMON_RARITY) {
            return 0; // 普通 60%
        } else if (random < COMMON_RARITY + UNCOMMON_RARITY) {
            return 1; // 非凡 23%
        } else if (random < COMMON_RARITY + UNCOMMON_RARITY + RARE_RARITY) {
            return 2; // 稀有 10%
        } else if (
            random < COMMON_RARITY + UNCOMMON_RARITY + RARE_RARITY + EPIC_RARITY
        ) {
            return 3; // 史诗 5%
        } else {
            return 4; // 传说 2%
        }
    }

    /**
     * @dev 铸造装备NFT到Player NFT合约（按照正确的随机顺序）
     */
    function _mintEquipmentToPlayerNFT(
        uint256 playerId,
        uint8 level
    ) internal returns (uint256) {
        console.log("_mintEquipmentToPlayerNFT level", level);

        // 步骤3.1：随机装备类型 (0-7: helmet, armor, shoes, weapon, shield, accessory, ring, pet)
        uint8 equipmentType = _generateEquipmentType(playerId, level);

        // 步骤3.2：随机装备稀有度（独立于宝箱稀有度）
        uint8 equipmentRarity = _generateEquipmentRarity(playerId, level);

        // 根据装备等级和稀有度计算装备属性
        (
            uint16 attack,
            uint16 defense,
            uint16 health,
            uint16 agility,
            uint8 critRate,
            uint16 critDamage
        ) = _calculateEquipmentStats(level, equipmentType, equipmentRarity);
        console.log("_mintEquipmentToPlayerNFT 2", equipmentType);

        console.log(
            "_mintEquipmentToPlayerNFT 2.5",
            address(playerNFT),
            equipmentType
        );

        // 铸造装备NFT到Player NFT合约
        uint256 equipmentId = equipmentNFT.mintEquipment(
            address(playerNFT),
            equipmentType,
            level,
            0, // stars = 0 (升星系统)
            equipmentRarity,
            attack,
            defense,
            agility,
            critRate,
            critDamage
        );
        console.log(
            "_mintEquipmentToPlayerNFT 3 type,id",
            equipmentType,
            equipmentId
        );

        // 添加到Player的背包
        playerNFT.addEquipmentToInventory(playerId, equipmentId);
        console.log("_mintEquipmentToPlayerNFT 4");
        return equipmentId;
    }

    /**
     * @dev 生成装备类型（第三步随机 - 装备子步骤1）
     * @param playerId 玩家ID
     * @param level 装备等级
     * @return 装备类型 (1-7)
     */
    function _generateEquipmentType(
        uint256 playerId,
        uint8 level
    ) internal view returns (uint8) {
        uint256 random = (uint256(
            keccak256(
                abi.encodePacked(block.timestamp, playerId, level, "equipType")
            )
        ) % 7) + 1;

        return uint8(random);
    }

    /**
     * @dev 计算装备属性（按照前端逻辑）
     */
    function _calculateEquipmentStats(
        uint8 level,
        uint8 equipmentType,
        uint8 rarity
    )
        internal
        pure
        returns (
            uint16 attack,
            uint16 defense,
            uint16 health,
            uint16 agility,
            uint8 critRate,
            uint16 critDamage
        )
    {
        // 稀有度倍数: Common(1x), Uncommon(1.5x), Rare(2x), Epic(3x), Legendary(5x)
        uint16 rarityMultiplier;
        if (rarity == 0)
            rarityMultiplier = 100; // 普通 1x
        else if (rarity == 1)
            rarityMultiplier = 150; // 非凡 1.5x
        else if (rarity == 2)
            rarityMultiplier = 200; // 稀有 2x
        else if (rarity == 3)
            rarityMultiplier = 300; // 史诗 3x
        else rarityMultiplier = 500; // 传说 5x

        // 根据装备类型计算基础属性
        if (equipmentType == 3) {
            // weapon
            attack = uint16(((5 + level * 2) * rarityMultiplier) / 100);
            critRate = uint8(1 + level / 2);
            critDamage = uint16(5 + level * 2);
        } else if (
            equipmentType == 1 || equipmentType == 7 || equipmentType == 4
        ) {
            // armor, helmet, shield
            defense = uint16(((3 + level) * rarityMultiplier) / 100);
            if (equipmentType == 1 || equipmentType == 4) {
                // armor, shield
                health = uint16(((10 + level * 3) * rarityMultiplier) / 100);
            }
        } else if (equipmentType == 2) {
            // shoes
            agility = uint16(((2 + level) * rarityMultiplier) / 100);
        } else if (equipmentType == 5 || equipmentType == 6) {
            // accessory, ring
            critRate = uint8(1 + level / 2);
            critDamage = uint16(5 + level * 2);
        }
        // pet (equipmentType == 7) 暂时不设置属性
    }

    // ========== 查询函数 ==========

    /**
     * @dev 获取玩家宝箱数量
     */
    function getPlayerTreasureBoxCount(
        uint256 playerId
    ) external view returns (uint256) {
        return playerTreasureBoxes[playerId].length;
    }

    /**
     * @dev 获取可领取的离线宝箱数量
     */
    function getClaimableOfflineBoxes(
        uint256 playerId
    ) external view returns (uint256) {
        // 获取Player NFT中的lastTreasureBoxTime
        Player.PlayerData memory player = playerNFT.getPlayer(playerId);

        uint256 timeSinceLastBox = block.timestamp - player.lastTreasureBoxTime;
        uint256 boxesToClaim = timeSinceLastBox / TREASURE_BOX_INTERVAL;

        if (boxesToClaim > MAX_OFFLINE_BOXES) {
            return MAX_OFFLINE_BOXES;
        }

        return boxesToClaim;
    }

    /**
     * @dev 获取玩家特定宝箱信息
     */
    function getPlayerTreasureBox(
        uint256 playerId,
        uint256 boxIndex
    ) external view returns (TreasureBox memory) {
        require(
            boxIndex < playerTreasureBoxes[playerId].length,
            "Invalid box index"
        );
        return playerTreasureBoxes[playerId][boxIndex];
    }

    /**
     * @dev 获取玩家所有宝箱信息
     */
    function getPlayerTreasureBoxes(
        uint256 playerId
    ) external view returns (TreasureBox[] memory) {
        return playerTreasureBoxes[playerId];
    }

    /**
     * @dev 授权系统合约
     */
    function authorizeSystem(address systemContract) external onlyOwner {
        authorizedSystems[systemContract] = true;
    }

    /**
     * @dev 取消授权系统合约
     */
    function revokeSystemAuthorization(
        address systemContract
    ) external onlyOwner {
        authorizedSystems[systemContract] = false;
    }

    /**
     * @dev 授权升级函数 - 只有owner可以升级合约
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
