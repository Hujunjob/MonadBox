// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./AdventureGold.sol";
import "./Equipment.sol";
import "./GameStructs.sol";
import "./GameConfig.sol";
import "./Player.sol";
import "./Item.sol";

/**
 * @title TreasureBoxSystem
 * @dev 宝箱系统合约 - 处理宝箱生成、存储和开启
 */
contract TreasureBoxSystem is Ownable {
    AdventureGold public goldToken;
    Equipment public equipmentNFT;
    Player public playerNFT;
    Item public itemNFT;

    struct TreasureBox {
        uint8 level; // 宝箱等级 (1-10)
        uint8 rarity; // 稀有度 (0-4)
        uint32 createdTime; // 创建时间
    }

    struct BoxReward {
        uint8 rewardType; // 0=gold, 1=equipment, 2=health_potion, 3=pet_egg, 4=job_book
        uint256 goldAmount; // 金币数量
        uint256[] equipmentIds; // 装备ID数组
        uint256 itemId; // 其他物品ID（血瓶、宠物蛋、转职书）
        string itemName; // 物品名称
        uint8 itemLevel; // 物品等级
        uint256 healAmount; // 血瓶治疗量
    }

    // 玩家宝箱存储（改为基于playerId）
    mapping(uint256 => TreasureBox[]) public playerTreasureBoxes;

    // 授权的系统合约
    mapping(address => bool) public authorizedSystems;

    // 修饰符：只有授权的系统或owner可以调用
    modifier onlyAuthorizedOrOwner() {
        require(
            authorizedSystems[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    // 宝箱奖励概率配置 (基于100，匹配前端逻辑)
    uint8 public constant GOLD_PROBABILITY = 1; // 1%
    uint8 public constant HEALTH_POTION_PROBABILITY = 13; // 13%
    uint8 public constant PET_EGG_PROBABILITY = 8; // 8%
    uint8 public constant JOB_BOOK_PROBABILITY = 7; // 7%
    // 装备 71% (剩余概率)

    // 稀有度概率配置 (基于100)
    uint8 public constant COMMON_RARITY = 60; // 60%
    uint8 public constant UNCOMMON_RARITY = 23; // 23%
    uint8 public constant RARE_RARITY = 10; // 10%
    uint8 public constant EPIC_RARITY = 5; // 5%
    uint8 public constant LEGENDARY_RARITY = 2; // 2%

    // 奖励等级概率配置
    uint8 public constant CURRENT_LEVEL_PROBABILITY = 95; // 95%
    uint8 public constant NEXT_LEVEL_PROBABILITY = 5; // 5%

    // 事件（改为基于playerId）
    event TreasureBoxAdded(uint256 indexed playerId, uint8 level, uint8 rarity);
    event TreasureBoxOpened(
        uint256 indexed playerId,
        uint256 boxIndex,
        uint8 rewardType,
        uint256 goldAmount,
        uint256[] equipmentIds,
        uint256 itemId,
        string itemName,
        uint256 itemLevel,
        uint256 healAmount
    );
    event OfflineBoxesClaimed(uint256 indexed playerId, uint256 boxCount);

    constructor(
        address _goldToken,
        address _equipmentNFT,
        address _playerNFT,
        address _itemNFT
    ) Ownable(msg.sender) {
        goldToken = AdventureGold(_goldToken);
        equipmentNFT = Equipment(_equipmentNFT);
        playerNFT = Player(_playerNFT);
        itemNFT = Item(_itemNFT);
    }

    /**
     * @dev 添加战斗宝箱 (由战斗合约调用)
     * @param playerId 玩家ID
     * @param level 宝箱等级
     */
    function addBattleTreasureBox(
        uint256 playerId,
        uint8 level
    ) external onlyAuthorizedOrOwner {
        require(level >= 1 && level <= 10, "Invalid box level");

        // 根据等级确定稀有度
        uint8 rarity = _calculateBoxRarity(level);

        playerTreasureBoxes[playerId].push(
            TreasureBox({
                level: level,
                rarity: rarity,
                createdTime: uint32(block.timestamp)
            })
        );

        emit TreasureBoxAdded(playerId, level, rarity);
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
        return claimOfflineTreasureBoxesForPlayer(playerId);
    }

    /**
     * @dev 为指定玩家领取离线宝箱（仅限授权系统调用）
     * @param playerId 玩家ID
     * @return 领取的宝箱数量
     */
    function claimOfflineTreasureBoxesForPlayer(
        uint256 playerId
    ) public onlyAuthorizedOrOwner returns (uint256) {
        // 获取Player NFT中的lastTreasureBoxTime
        GameStructs.Player memory player = playerNFT.getPlayer(playerId);

        uint256 timeSinceLastBox = block.timestamp - player.lastTreasureBoxTime;
        uint256 boxesToClaim = timeSinceLastBox /
            GameConfig.TREASURE_BOX_INTERVAL;

        if (boxesToClaim > GameConfig.MAX_OFFLINE_BOXES) {
            boxesToClaim = GameConfig.MAX_OFFLINE_BOXES;
        }

        if (boxesToClaim > 0) {
            // 更新Player NFT中的lastTreasureBoxTime
            playerNFT.updateLastTreasureBoxTime(playerId);

            // 添加离线宝箱 (等级1-3的普通宝箱)
            for (uint8 i = 0; i < boxesToClaim; i++) {
                uint8 boxLevel = uint8((block.timestamp + i) % 3) + 1; // 随机1-3级
                uint8 rarity = _calculateBoxRarity(boxLevel);

                playerTreasureBoxes[playerId].push(
                    TreasureBox({
                        level: boxLevel,
                        rarity: rarity,
                        createdTime: uint32(block.timestamp)
                    })
                );

                emit TreasureBoxAdded(playerId, boxLevel, rarity);
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
        BoxReward memory reward = _generateReward(box.level, box.rarity);
        
        // 删除已开启的宝箱
        _removeBox(playerId, boxIndex);

        // 发放金币奖励到Player NFT合约
        if (reward.goldAmount > 0) {
            goldToken.mint(address(playerNFT), reward.goldAmount);
            playerNFT.addGold(playerId, reward.goldAmount);
        }
        console.log("openTreasureBox 2",reward.rewardType);
        // 发放装备奖励到Player NFT合约
        if (reward.equipmentIds.length > 0) {
            for (uint256 i = 0; i < reward.equipmentIds.length; i++) {
                // 铸造装备NFT到Player NFT合约并添加到背包
                reward.equipmentIds[i] = _mintEquipmentToPlayerNFT(
                    playerId,
                    reward.itemLevel,
                    box.rarity
                );
            }
        }
        
        // 发放物品奖励（血瓶、转职书、宠物蛋）
        if (reward.rewardType >= 2 && reward.rewardType <= 4 && reward.itemId > 0) {
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
            reward.equipmentIds,
            reward.itemId,
            reward.itemName,
            reward.itemLevel,
            reward.healAmount
        );

        return reward;
    }

    /**
     * @dev 生成装备名称
     */
    // function _generateEquipmentName(uint8 equipmentType, uint8 rarity) internal pure returns (string memory) {
    //     string[8] memory typeNames = ["Helmet", "Armor", "Shoes", "Weapon", "Shield", "Accessory", "Ring", "Pet"];
    //     string[5] memory rarityPrefixes = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

    //     return string(abi.encodePacked(rarityPrefixes[rarity], " ", typeNames[equipmentType]));
    // }

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
     * @dev 计算宝箱稀有度
     * @param level 宝箱等级
     * @return 稀有度
     */
    function _calculateBoxRarity(uint8 level) internal view returns (uint8) {
        uint256 random = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender, level))
        ) % 1000;

        if (level <= 2) {
            // 低级宝箱：80%普通，20%不普通
            return random < 800 ? 0 : 1;
        } else if (level <= 5) {
            // 中级宝箱：50%普通，35%不普通，15%稀有
            if (random < 500) return 0;
            else if (random < 850) return 1;
            else return 2;
        } else if (level <= 8) {
            // 高级宝箱：30%普通，40%不普通，25%稀有，5%史诗
            if (random < 300) return 0;
            else if (random < 700) return 1;
            else if (random < 950) return 2;
            else return 3;
        } else {
            // 顶级宝箱：20%普通，30%不普通，30%稀有，15%史诗，5%传说
            if (random < 200) return 0;
            else if (random < 500) return 1;
            else if (random < 800) return 2;
            else if (random < 950) return 3;
            else return 4;
        }
    }

    /**
     * @dev 生成宝箱奖励（完全按照前端游戏逻辑）
     * @param level 宝箱等级
     * @param rarity 宝箱稀有度（未使用，保持兼容）
     * @return 奖励信息
     */
    function _generateReward(
        uint8 level,
        uint8 rarity
    ) internal view returns (BoxReward memory) {
        // 首先确定奖励等级（95%当前等级，5%下一级）
        uint8 rewardLevel = _generateRewardLevel(level);

        // 生成0-99的随机数
        uint256 random = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, msg.sender, level, rarity)
            )
        ) % 100;

        if (random < GOLD_PROBABILITY) {
            // 金币奖励 1%
            uint256 goldAmount = _calculateGoldReward(rewardLevel);
            return
                BoxReward({
                    rewardType: 0,
                    goldAmount: goldAmount,
                    equipmentIds: new uint256[](0),
                    itemId: 0,
                    itemName: "",
                    itemLevel: 0,
                    healAmount: 0
                });
        } else if (random < GOLD_PROBABILITY + HEALTH_POTION_PROBABILITY) {
            // 血瓶奖励 13%
            (
                uint256 itemId,
                string memory itemName,
                uint256 healAmount
            ) = _generateHealthPotion(rewardLevel);
            return
                BoxReward({
                    rewardType: 2,
                    goldAmount: 0,
                    equipmentIds: new uint256[](0),
                    itemId: itemId,
                    itemName: itemName,
                    itemLevel: rewardLevel,
                    healAmount: healAmount
                });
        } else if (
            random <
            GOLD_PROBABILITY + HEALTH_POTION_PROBABILITY + PET_EGG_PROBABILITY
        ) {
            // 宠物蛋奖励 8%
            (uint256 itemId, string memory itemName) = _generatePetEgg(
                rewardLevel
            );
            return
                BoxReward({
                    rewardType: 3,
                    goldAmount: 0,
                    equipmentIds: new uint256[](0),
                    itemId: itemId,
                    itemName: itemName,
                    itemLevel: rewardLevel,
                    healAmount: 0
                });
        } else if (
            random <
            GOLD_PROBABILITY +
                HEALTH_POTION_PROBABILITY +
                PET_EGG_PROBABILITY +
                JOB_BOOK_PROBABILITY
        ) {
            // 转职书奖励 7%
            (
                uint256 itemId,
                string memory itemName
            ) = _generateJobAdvancementBook(level); // 注意这里用原始level
            return
                BoxReward({
                    rewardType: 4,
                    goldAmount: 0,
                    equipmentIds: new uint256[](0),
                    itemId: itemId,
                    itemName: itemName,
                    itemLevel: level,
                    healAmount: 0
                });
        } else {
            // 装备奖励 71% (剩余概率)
            uint256[] memory equipmentIds = new uint256[](1);
            equipmentIds[0] = 0; // 占位符，实际铸造在后面
            return
                BoxReward({
                    rewardType: 1,
                    goldAmount: 0,
                    equipmentIds: equipmentIds,
                    itemId: 0,
                    itemName: "",
                    itemLevel: rewardLevel,
                    healAmount: 0
                });
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
     * @dev 计算金币奖励（按照前端逻辑：50 + level*25 + random(0-49)）
     */
    function _calculateGoldReward(
        uint8 rewardLevel
    ) internal view returns (uint256) {
        uint256 baseAmount = 50; // 基础50金币
        uint256 levelBonus = uint256(rewardLevel) * 25; // 每级25金币
        uint256 randomBonus = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    msg.sender,
                    rewardLevel,
                    "gold"
                )
            )
        ) % 50; // 0-49随机金币

        return (baseAmount + levelBonus + randomBonus) * 10 ** 18; // 转换为wei
    }

    /**
     * @dev 生成血瓶（按照前端逻辑：50 + (level-1)*25治疗量）
     */
    function _generateHealthPotion(
        uint8 level
    ) internal pure returns (uint256, string memory, uint256) {
        uint256 healAmount = 50 + (uint256(level - 1)) * 25; // 基础50 + (level-1)*25
        string memory name = string(
            abi.encodePacked("Lv", _toString(level), " Health Potion")
        );
        // 血瓶ID范围：1000-1999，根据等级生成ID
        uint256 itemId = 1000 + (level - 1);

        return (itemId, name, healAmount);
    }

    /**
     * @dev 生成宠物蛋
     */
    function _generatePetEgg(
        uint8 level
    ) internal pure returns (uint256, string memory) {
        string memory name = string(
            abi.encodePacked("Lv", _toString(level), " Pet Egg")
        );
        // 宠物蛋ID范围：3000-3999，根据等级生成ID
        uint256 itemId = 3000 + (level - 1);

        return (itemId, name);
    }

    /**
     * @dev 生成转职书（按照前端等级范围逻辑）
     */
    function _generateJobAdvancementBook(
        uint8 boxLevel
    ) internal pure returns (uint256, string memory) {
        string memory bookName;
        uint256 jobType;

        if (boxLevel <= 2) {
            bookName = "Great Swordsman Job Book";
            jobType = 1;
        } else if (boxLevel <= 4) {
            bookName = "Temple Knight Job Book";
            jobType = 2;
        } else if (boxLevel <= 6) {
            bookName = "Dragon Knight Job Book";
            jobType = 3;
        } else if (boxLevel <= 8) {
            bookName = "Sword Master Job Book";
            jobType = 4;
        } else if (boxLevel <= 10) {
            bookName = "Sword God Job Book";
            jobType = 5;
        } else {
            bookName = "Plane Lord Job Book";
            jobType = 6;
        }

        // 转职书ID范围：2000-2999，根据职业类型生成ID
        uint256 itemId = 2000 + jobType;
        return (itemId, bookName);
    }

    /**
     * @dev 生成装备ID (占位符，实际铸造在_mintEquipmentReward中进行)
     */
    function _generateEquipmentId(
        uint8 level,
        uint8 rarity
    ) internal pure returns (uint256) {
        // 返回占位符ID，实际装备在开箱时铸造
        return 0;
    }

    /**
     * @dev 生成装备稀有度（按照前端概率）
     */
    function _generateEquipmentRarity(uint256 playerId, uint8 level) internal view returns (uint8) {
        uint256 random = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender, playerId, level, "rarity"))
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
     * @dev 铸造装备NFT到Player NFT合约（按照前端逻辑）
     */
    function _mintEquipmentToPlayerNFT(
        uint256 playerId,
        uint8 level,
        uint8 boxRarity
    ) internal returns (uint256) {
        console.log("_mintEquipmentToPlayerNFT level", level);
        // 随机装备类型 (0-7: helmet, armor, shoes, weapon, shield, accessory, ring, pet)
        uint8 equipmentType = uint8(
            uint256(
                keccak256(abi.encodePacked(block.timestamp, playerId, level, "equipType"))
            ) % 8
        );

        // 生成装备稀有度（独立于宝箱稀有度）
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
        console.log("_mintEquipmentToPlayerNFT 2",equipmentType);
        // 生成装备名称
        string memory name = _generateEquipmentName(
            equipmentType,
            equipmentRarity
        );
        console.log("_mintEquipmentToPlayerNFT 2.5", address(playerNFT),equipmentType,level);
            // level,
            // 0, // stars = 0 (升星系统)
            // equipmentRarity,
            // attack,
            // defense,
            // agility,
            // critRate,
            // critDamage,
            // name);
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
            critDamage,
            name
        );
        console.log("_mintEquipmentToPlayerNFT 3 type,id",equipmentType,equipmentId);
        // 添加到Player的背包
        playerNFT.addEquipmentToInventory(playerId, equipmentId);
        console.log("_mintEquipmentToPlayerNFT 4");
        return equipmentId;
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
            equipmentType == 1 || equipmentType == 0 || equipmentType == 4
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

    /**
     * @dev 数字转字符串辅助函数
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @dev 生成装备名称
     */
    function _generateEquipmentName(
        uint8 equipmentType,
        uint8 rarity
    ) internal pure returns (string memory) {
        string[8] memory typeNames = [
            "Helmet",
            "Armor",
            "Shoes",
            "Weapon",
            "Shield",
            "Accessory",
            "Ring",
            "Pet"
        ];
        string[5] memory rarityPrefixes = [
            "Common",
            "Uncommon",
            "Rare",
            "Epic",
            "Legendary"
        ];

        return
            string(
                abi.encodePacked(
                    rarityPrefixes[rarity],
                    " ",
                    typeNames[equipmentType]
                )
            );
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
     * @dev 获取玩家未开启的宝箱数量（现在等同于总宝箱数量，因为已开启的宝箱会被删除）
     */
    function getUnopenedBoxCount(
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
        GameStructs.Player memory player = playerNFT.getPlayer(playerId);

        uint256 timeSinceLastBox = block.timestamp - player.lastTreasureBoxTime;
        uint256 boxesToClaim = timeSinceLastBox /
            GameConfig.TREASURE_BOX_INTERVAL;

        if (boxesToClaim > GameConfig.MAX_OFFLINE_BOXES) {
            return GameConfig.MAX_OFFLINE_BOXES;
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
}
