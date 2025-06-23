// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AdventureGold.sol";
import "./Equipment.sol";
import "./GameStructs.sol";
import "./GameConfig.sol";

/**
 * @title TreasureBoxSystem
 * @dev 宝箱系统合约 - 处理宝箱生成、存储和开启
 */
contract TreasureBoxSystem is Ownable {
    AdventureGold public goldToken;
    Equipment public equipmentNFT;

    struct TreasureBox {
        uint8 level; // 宝箱等级 (1-10)
        uint8 rarity; // 稀有度 (0-4)
        uint32 createdTime; // 创建时间
        bool opened; // 是否已开启
    }

    struct BoxReward {
        uint8 rewardType; // 0=gold, 1=equipment, 2=multiple
        uint256 goldAmount; // 金币数量
        uint256[] equipmentIds; // 装备ID数组
    }

    // 玩家宝箱存储
    mapping(address => TreasureBox[]) public playerTreasureBoxes;
    mapping(address => uint32) public lastOfflineBoxTime;

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

    // 宝箱奖励概率配置 (基于1000)
    uint16 public constant GOLD_PROBABILITY = 500; // 50%
    uint16 public constant EQUIPMENT_PROBABILITY = 350; // 35%
    uint16 public constant MULTIPLE_PROBABILITY = 150; // 15%

    // 事件
    event TreasureBoxAdded(address indexed player, uint8 level, uint8 rarity);
    event TreasureBoxOpened(
        address indexed player,
        uint256 boxIndex,
        uint8 rewardType,
        uint256 goldAmount,
        uint256[] equipmentIds
    );
    event OfflineBoxesClaimed(address indexed player, uint8 boxCount);

    constructor(address _goldToken, address _equipmentNFT) Ownable(msg.sender) {
        goldToken = AdventureGold(_goldToken);
        equipmentNFT = Equipment(_equipmentNFT);
    }

    /**
     * @dev 添加战斗宝箱 (由战斗合约调用)
     * @param player 玩家地址
     * @param level 宝箱等级
     */
    function addBattleTreasureBox(
        address player,
        uint8 level
    ) external onlyAuthorizedOrOwner {
        require(level >= 1 && level <= 10, "Invalid box level");

        // 根据等级确定稀有度
        uint8 rarity = _calculateBoxRarity(level);

        playerTreasureBoxes[player].push(
            TreasureBox({
                level: level,
                rarity: rarity,
                createdTime: uint32(block.timestamp),
                opened: false
            })
        );

        emit TreasureBoxAdded(player, level, rarity);
    }

    /**
     * @dev 领取离线宝箱
     * @return 领取的宝箱数量
     */
    function claimOfflineTreasureBoxes() external returns (uint8) {
        return claimOfflineTreasureBoxesForPlayer(msg.sender);
    }

    /**
     * @dev 为指定玩家领取离线宝箱（仅限授权系统调用）
     * @param playerAddress 玩家地址
     * @return 领取的宝箱数量
     */
    function claimOfflineTreasureBoxesForPlayer(
        address playerAddress
    ) public onlyAuthorizedOrOwner returns (uint8) {
        uint32 timeSinceLastBox = uint32(block.timestamp) -
            lastOfflineBoxTime[playerAddress];
        uint8 boxesToClaim = uint8(
            timeSinceLastBox / GameConfig.TREASURE_BOX_INTERVAL
        );

        if (boxesToClaim > GameConfig.MAX_OFFLINE_BOXES) {
            boxesToClaim = GameConfig.MAX_OFFLINE_BOXES;
        }

        if (boxesToClaim > 0) {
            lastOfflineBoxTime[playerAddress] = uint32(block.timestamp);

            // 添加离线宝箱 (等级1-3的普通宝箱)
            for (uint8 i = 0; i < boxesToClaim; i++) {
                uint8 boxLevel = uint8((block.timestamp + i) % 3) + 1; // 随机1-3级
                uint8 rarity = _calculateBoxRarity(boxLevel);

                playerTreasureBoxes[playerAddress].push(
                    TreasureBox({
                        level: boxLevel,
                        rarity: rarity,
                        createdTime: uint32(block.timestamp),
                        opened: false
                    })
                );

                emit TreasureBoxAdded(playerAddress, boxLevel, rarity);
            }

            emit OfflineBoxesClaimed(playerAddress, boxesToClaim);
        }

        return boxesToClaim;
    }

    /**
     * @dev 开启宝箱
     * @param boxIndex 宝箱索引
     * @return 奖励信息
     */
    function openTreasureBox(
        uint256 boxIndex
    ) external returns (BoxReward memory) {
        address playerAddress = msg.sender;
        require(
            boxIndex < playerTreasureBoxes[playerAddress].length,
            "Invalid box index"
        );

        TreasureBox storage box = playerTreasureBoxes[playerAddress][boxIndex];
        require(!box.opened, "Box already opened");

        box.opened = true;

        // 生成奖励
        BoxReward memory reward = _generateReward(box.level, box.rarity);

        // 发放金币奖励
        if (reward.goldAmount > 0) {
            goldToken.mint(playerAddress, reward.goldAmount);
        }

        // 发放装备奖励
        if (reward.equipmentIds.length > 0) {
            for (uint256 i = 0; i < reward.equipmentIds.length; i++) {
                // 实际铸造装备NFT
                reward.equipmentIds[i] = _mintEquipmentReward(playerAddress, box.level, box.rarity);
            }
        }

        emit TreasureBoxOpened(
            playerAddress,
            boxIndex,
            reward.rewardType,
            reward.goldAmount,
            reward.equipmentIds
        );

        return reward;
    }

    /**
     * @dev 批量开启宝箱
     * @param boxIndices 宝箱索引数组
     * @return 总奖励信息
     */
    function openMultipleTreasureBoxes(
        uint256[] calldata boxIndices
    ) external returns (BoxReward memory) {
        require(
            boxIndices.length > 0 && boxIndices.length <= 10,
            "Invalid box count"
        );

        BoxReward memory totalReward = BoxReward({
            rewardType: 2, // multiple type
            goldAmount: 0,
            equipmentIds: new uint256[](0)
        });

        for (uint256 i = 0; i < boxIndices.length; i++) {
            // 内联开箱逻辑避免递归调用
            require(
                boxIndices[i] < playerTreasureBoxes[msg.sender].length,
                "Invalid box index"
            );

            TreasureBox storage box = playerTreasureBoxes[msg.sender][
                boxIndices[i]
            ];
            require(!box.opened, "Box already opened");

            box.opened = true;

            BoxReward memory singleReward = _generateReward(
                box.level,
                box.rarity
            );

            // 发放金币奖励
            if (singleReward.goldAmount > 0) {
                goldToken.mint(msg.sender, singleReward.goldAmount);
            }

            totalReward.goldAmount += singleReward.goldAmount;

            // 发放装备奖励
            if (singleReward.equipmentIds.length > 0) {
                for (uint256 j = 0; j < singleReward.equipmentIds.length; j++) {
                    singleReward.equipmentIds[j] = _mintEquipmentReward(msg.sender, box.level, box.rarity);
                }
            }

            // 合并装备ID数组
            uint256[] memory newEquipmentIds = new uint256[](
                totalReward.equipmentIds.length +
                    singleReward.equipmentIds.length
            );
            for (uint256 j = 0; j < totalReward.equipmentIds.length; j++) {
                newEquipmentIds[j] = totalReward.equipmentIds[j];
            }
            for (uint256 j = 0; j < singleReward.equipmentIds.length; j++) {
                newEquipmentIds[
                    totalReward.equipmentIds.length + j
                ] = singleReward.equipmentIds[j];
            }
            totalReward.equipmentIds = newEquipmentIds;

            emit TreasureBoxOpened(
                msg.sender,
                boxIndices[i],
                singleReward.rewardType,
                singleReward.goldAmount,
                singleReward.equipmentIds
            );
        }

        return totalReward;
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
     * @dev 生成宝箱奖励
     * @param level 宝箱等级
     * @param rarity 宝箱稀有度
     * @return 奖励信息
     */
    function _generateReward(
        uint8 level,
        uint8 rarity
    ) internal view returns (BoxReward memory) {
        uint256 random = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, msg.sender, level, rarity)
            )
        ) % 1000;

        if (random < GOLD_PROBABILITY) {
            // 金币奖励
            uint256 goldAmount = _calculateGoldReward(level, rarity);
            return
                BoxReward({
                    rewardType: 0,
                    goldAmount: goldAmount,
                    equipmentIds: new uint256[](0)
                });
        } else if (random < GOLD_PROBABILITY + EQUIPMENT_PROBABILITY) {
            // 装备奖励
            uint256[] memory equipmentIds = new uint256[](1);
            equipmentIds[0] = _generateEquipmentId(level, rarity);
            return
                BoxReward({
                    rewardType: 1,
                    goldAmount: 0,
                    equipmentIds: equipmentIds
                });
        } else {
            // 多重奖励
            uint256 goldAmount = _calculateGoldReward(level, rarity) / 2; // 减半金币
            uint256[] memory equipmentIds = new uint256[](1);
            equipmentIds[0] = _generateEquipmentId(level, rarity);
            return
                BoxReward({
                    rewardType: 2,
                    goldAmount: goldAmount,
                    equipmentIds: equipmentIds
                });
        }
    }

    /**
     * @dev 计算金币奖励
     */
    function _calculateGoldReward(
        uint8 level,
        uint8 rarity
    ) internal pure returns (uint256) {
        uint256 baseAmount = uint256(level) * 10 * 10 ** 18; // 基础金币
        uint256 rarityMultiplier = (uint256(rarity) + 1) * 150; // 稀有度倍数 (150%, 300%, 450%, 600%, 750%)
        return (baseAmount * rarityMultiplier) / 100;
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
     * @dev 铸造装备奖励
     */
    function _mintEquipmentReward(
        address to,
        uint8 level,
        uint8 rarity
    ) internal returns (uint256) {
        // 随机装备类型 (0-7)
        uint8 equipmentType = uint8(
            uint256(keccak256(abi.encodePacked(block.timestamp, to, level))) % 8
        );

        // 根据宝箱等级和稀有度计算装备属性
        (uint16 attack, uint16 defense, uint16 agility, uint8 critRate, uint16 critDamage) = 
            _calculateEquipmentStats(level, rarity);

        // 生成装备名称
        string memory name = _generateEquipmentName(equipmentType, rarity);

        // 铸造装备NFT
        return equipmentNFT.mintEquipment(
            to,
            equipmentType,
            level,
            rarity + 1, // stars = rarity + 1 (1-5星)
            rarity,
            attack,
            defense,
            agility,
            critRate,
            critDamage,
            name
        );
    }

    /**
     * @dev 计算装备属性
     */
    function _calculateEquipmentStats(uint8 level, uint8 rarity) internal pure returns (
        uint16 attack,
        uint16 defense,
        uint16 agility,
        uint8 critRate,
        uint16 critDamage
    ) {
        // 基础属性
        uint16 baseAttack = level * 3;
        uint16 baseDefense = level * 2;
        uint16 baseAgility = level * 2;
        
        // 稀有度加成 (普通100%, 不普通150%, 稀有200%, 史诗300%, 传说500%)
        uint16 rarityMultiplier = 100 + (uint16(rarity) * 50);
        if (rarity >= 3) rarityMultiplier += 100; // 史诗和传说额外加成
        
        attack = (baseAttack * rarityMultiplier) / 100;
        defense = (baseDefense * rarityMultiplier) / 100;
        agility = (baseAgility * rarityMultiplier) / 100;
        critRate = rarity + 1; // 1-5%
        critDamage = 150 + (uint16(rarity) * 25); // 150%-275%
    }

    /**
     * @dev 生成装备名称
     */
    function _generateEquipmentName(uint8 equipmentType, uint8 rarity) internal pure returns (string memory) {
        string[8] memory typeNames = ["Helmet", "Armor", "Shoes", "Weapon", "Shield", "Accessory", "Ring", "Pet"];
        string[5] memory rarityPrefixes = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
        
        return string(abi.encodePacked(rarityPrefixes[rarity], " ", typeNames[equipmentType]));
    }

    // ========== 查询函数 ==========

    /**
     * @dev 获取玩家宝箱数量
     */
    function getPlayerTreasureBoxCount(
        address player
    ) external view returns (uint256) {
        return playerTreasureBoxes[player].length;
    }

    /**
     * @dev 获取玩家未开启的宝箱数量
     */
    function getUnopenedBoxCount(
        address player
    ) external view returns (uint256) {
        uint256 count = 0;
        TreasureBox[] memory boxes = playerTreasureBoxes[player];
        for (uint256 i = 0; i < boxes.length; i++) {
            if (!boxes[i].opened) {
                count++;
            }
        }
        return count;
    }

    /**
     * @dev 获取可领取的离线宝箱数量
     */
    function getClaimableOfflineBoxes(
        address player
    ) external view returns (uint8) {
        uint32 timeSinceLastBox = uint32(block.timestamp) -
            lastOfflineBoxTime[player];
        uint8 boxesToClaim = uint8(
            timeSinceLastBox / GameConfig.TREASURE_BOX_INTERVAL
        );

        if (boxesToClaim > GameConfig.MAX_OFFLINE_BOXES) {
            return GameConfig.MAX_OFFLINE_BOXES;
        }

        return boxesToClaim;
    }

    /**
     * @dev 获取玩家特定宝箱信息
     */
    function getPlayerTreasureBox(
        address player,
        uint256 boxIndex
    ) external view returns (TreasureBox memory) {
        require(
            boxIndex < playerTreasureBoxes[player].length,
            "Invalid box index"
        );
        return playerTreasureBoxes[player][boxIndex];
    }

    /**
     * @dev 获取玩家所有宝箱信息
     */
    function getPlayerTreasureBoxes(
        address player
    ) external view returns (TreasureBox[] memory) {
        return playerTreasureBoxes[player];
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
