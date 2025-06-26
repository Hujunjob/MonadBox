// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./Equipment.sol";
import "./AdventureGold.sol";
import "./Player.sol";
import "hardhat/console.sol";
/**
 * @title EquipmentSystem
 * @dev 装备系统合约 - 管理装备升星、强化、消耗等功能
 */
contract EquipmentSystem is Initializable, OwnableUpgradeable, UUPSUpgradeable, IERC721Receiver {
    Equipment public equipmentNFT;
    AdventureGold public goldToken;
    Player public playerNFT;

    // 升星配置
    struct StarUpgradeConfig {
        uint256 goldCost; // 金币消耗
        uint8 successRate; // 成功率 (0-100)
        uint8 maxLevel; // 该星级的最大强化等级
        uint16 statMultiplier; // 属性倍数 (百分比)
        uint8 materialCount; // 需要的同类装备数量
    }

    // 升星配置 (星级 => 配置)
    mapping(uint8 => StarUpgradeConfig) public starConfigs;

    // 事件
    event EquipmentStarUpgraded(
        uint256 indexed tokenId,
        uint8 oldStars,
        uint8 newStars
    );
    // event EquipmentEnhanced(uint256 indexed tokenId, uint8 oldLevel, uint8 newLevel);
    event EquipmentUpgradeFailed(uint256 indexed tokenId, string reason);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _equipmentNFT,
        address _goldToken,
        address _playerNFT,
        address initialOwner
    ) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        
        equipmentNFT = Equipment(_equipmentNFT);
        goldToken = AdventureGold(_goldToken);
        playerNFT = Player(_playerNFT);

        _initializeConfigs();
    }

    /**
     * @dev 初始化升星和强化配置
     */
    function _initializeConfigs() internal {
        // 升星配置 (星级越高，消耗越大，成功率越低)
        starConfigs[1] = StarUpgradeConfig(100e18, 80, 5, 120, 1); // 1星->2星: 100金币, 80%成功率, 1个同类装备
        starConfigs[2] = StarUpgradeConfig(250e18, 70, 10, 150, 2); // 2星->3星: 250金币, 70%成功率, 2个同类装备
        starConfigs[3] = StarUpgradeConfig(500e18, 60, 15, 200, 3); // 3星->4星: 500金币, 60%成功率, 3个同类装备
        starConfigs[4] = StarUpgradeConfig(1000e18, 50, 20, 300, 4); // 4星->5星: 1000金币, 50%成功率, 4个同类装备
    }

    /**
     * @dev 装备升星 - 优化版本，直接传入消耗的装备IDs
     * @param playerId 玩家NFT ID
     * @param tokenId 装备NFT ID
     * @param materialIds 消耗的装备ID数组
     */
    function upgradeStars(
        uint256 playerId,
        uint256 tokenId,
        uint256[] calldata materialIds
    ) external {
        require(playerNFT.ownerOf(playerId) == msg.sender, "Not your player");
        require(
            playerNFT.hasEquipmentInInventory(playerId, tokenId),
            "Equipment not in inventory"
        );

        Equipment.EquipmentData memory equipment = equipmentNFT.getEquipment(
            tokenId
        );
        require(equipment.stars < 5, "Already max stars");
        console.log("upgradeStars 1");
        // 获取升星配置（要升到下一个星级的配置）
        uint8 targetStars = equipment.stars + 1;
        StarUpgradeConfig memory config = starConfigs[targetStars];
        require(config.goldCost > 0, "Invalid star level");
        require(
            playerNFT.getPlayerGold(playerId) >= config.goldCost,
            "Insufficient gold"
        );
        console.log("upgradeStars 2");
        // 验证材料装备数量和类型
        require(
            materialIds.length == config.materialCount,
            "Incorrect material count"
        );
        _validateMaterialEquipments(
            playerId,
            materialIds,
            equipment.equipmentType,
            equipment.rarity,
            tokenId
        );
        console.log("upgradeStars 3");
        // 消耗金币 (从PlayerNFT的金币余额)
        playerNFT.spendGold(playerId, config.goldCost, address(this));
        console.log("upgradeStars 4");
        goldToken.burn(config.goldCost);
        console.log("upgradeStars 5");
        // 消耗同类装备 (烧毁材料装备)
        for (uint256 i = 0; i < materialIds.length; i++) {
            _burnMaterialEquipment(playerId, materialIds[i]);
        }
        console.log("upgradeStars 6");
        // 随机判断成功
        uint256 random = _generateRandom(tokenId, block.timestamp) % 100;
        if (random < config.successRate) {
            // 升星成功
            uint8 oldStars = equipment.stars;
            uint8 newStars = oldStars + 1;

            // 更新装备属性 (基于新星级的倍数)
            StarUpgradeConfig memory newConfig = starConfigs[newStars];
            uint16 multiplier = newConfig.statMultiplier;

            uint16 newAttack = (equipment.attack * multiplier) / 100;
            uint16 newDefense = (equipment.defense * multiplier) / 100;
            uint16 newAgility = (equipment.agility * multiplier) / 100;
            uint8 newCritRate = equipment.criticalRate + 1;
            uint16 newCritDamage = equipment.criticalDamage + 25;

            equipmentNFT.updateEquipment(
                tokenId,
                newStars,
                newAttack,
                newDefense,
                newAgility,
                newCritRate,
                newCritDamage
            );

            emit EquipmentStarUpgraded(tokenId, oldStars, newStars);
        } else {
            // 升星失败
            emit EquipmentUpgradeFailed(tokenId, "Star upgrade failed");
        }
    }

    /**
     * @dev 生成随机数
     */
    function _generateRandom(
        uint256 tokenId,
        uint256 seed
    ) internal view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(block.timestamp, msg.sender, tokenId, seed)
                )
            );
    }

    /**
     * @dev 获取装备完整信息（包含强化等级）
     */
    function getEquipmentFullData(
        uint256 tokenId
    )
        external
        view
        returns (
            Equipment.EquipmentData memory equipmentData,
            uint256 nextStarCost
        )
    {
        equipmentData = equipmentNFT.getEquipment(tokenId);

        if (equipmentData.stars < 5) {
            nextStarCost = starConfigs[equipmentData.stars].goldCost;
        }
    }

    /**
     * @dev 验证材料装备是否符合要求
     * @param playerId 玩家ID
     * @param materialIds 材料装备ID数组
     * @param equipmentType 目标装备类型
     * @param rarity 目标装备稀有度
     * @param excludeId 排除的装备ID（要升星的装备本身）
     */
    function _validateMaterialEquipments(
        uint256 playerId,
        uint256[] calldata materialIds,
        uint8 equipmentType,
        uint8 rarity,
        uint256 excludeId
    ) internal view {
        for (uint256 i = 0; i < materialIds.length; i++) {
            uint256 materialId = materialIds[i];

            // 不能使用要升星的装备本身作为材料
            require(
                materialId != excludeId,
                "Cannot use equipment itself as material"
            );

            // 验证装备是否在玩家背包中
            require(
                playerNFT.hasEquipmentInInventory(playerId, materialId),
                "Material equipment not in inventory"
            );

            // 验证装备类型和稀有度
            Equipment.EquipmentData memory materialData = equipmentNFT
                .getEquipment(materialId);
            require(
                materialData.equipmentType == equipmentType,
                "Wrong equipment type"
            );
            require(materialData.rarity == rarity, "Wrong equipment rarity");
        }
    }

    /**
     * @dev 查找相似装备作为升星材料 - 保留用于UI查询
     * @param playerId 玩家ID
     * @param equipmentType 装备类型
     * @param rarity 稀有度
     * @param excludeId 排除的装备ID（要升星的装备本身）
     * @param needed 需要的数量
     * @return 符合条件的装备ID数组
     */
    function _findSimilarEquipments(
        uint256 playerId,
        uint8 equipmentType,
        uint8 rarity,
        uint256 excludeId,
        uint8 needed
    ) internal view returns (uint256[] memory) {
        uint256[] memory inventory = playerNFT.getPlayerInventory(playerId);
        uint256[] memory materials = new uint256[](needed);
        uint256 found = 0;

        for (uint256 i = 0; i < inventory.length && found < needed; i++) {
            uint256 equipId = inventory[i];
            if (equipId != excludeId) {
                Equipment.EquipmentData memory equipData = equipmentNFT
                    .getEquipment(equipId);
                // 同类型、同稀有度的装备可以作为材料
                if (
                    equipData.equipmentType == equipmentType &&
                    equipData.rarity == rarity
                ) {
                    materials[found] = equipId;
                    found++;
                }
            }
        }

        // 创建实际大小的数组
        uint256[] memory result = new uint256[](found);
        for (uint256 i = 0; i < found; i++) {
            result[i] = materials[i];
        }

        return result;
    }

    /**
     * @dev 烧毁材料装备
     * @param playerId 玩家ID
     * @param equipmentId 装备ID
     */
    function _burnMaterialEquipment(
        uint256 playerId,
        uint256 equipmentId
    ) internal {
        console.log("_burnMaterialEquipment 1");
        // 从玩家背包中移除装备
        playerNFT.removeEquipmentFromInventory(
            playerId,
            equipmentId,
            address(this)
        );
        console.log("_burnMaterialEquipment 2");
        // 烧毁装备NFT
        // 装备已经通过removeEquipmentFromInventory转移到合约，现在销毁
        equipmentNFT.burn(equipmentId);
        console.log("_burnMaterialEquipment 3");
    }

    /**
     * @dev 更新升星配置 (仅owner)
     */
    function updateStarConfig(
        uint8 stars,
        StarUpgradeConfig memory config
    ) external onlyOwner {
        starConfigs[stars] = config;
    }

    /**
     * @dev 获取可用于升星的材料装备 - 供UI调用
     * @param playerId 玩家ID
     * @param tokenId 要升星的装备ID
     * @return materialIds 可用的材料装备ID数组
     * @return materialsNeeded 升星需要的材料数量
     */
    function getAvailableMaterials(
        uint256 playerId,
        uint256 tokenId
    )
        external
        view
        returns (uint256[] memory materialIds, uint8 materialsNeeded)
    {
        Equipment.EquipmentData memory equipment = equipmentNFT.getEquipment(
            tokenId
        );
        require(equipment.stars < 5, "Already max stars");

        uint8 targetStars = equipment.stars + 1;
        StarUpgradeConfig memory config = starConfigs[targetStars];
        materialsNeeded = config.materialCount;

        materialIds = _findSimilarEquipments(
            playerId,
            equipment.equipmentType,
            equipment.rarity,
            tokenId,
            materialsNeeded
        );
    }

    /**
     * @dev 实现IERC721Receiver以接收Equipment NFT
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * @dev 授权升级函数 - 只有owner可以升级合约
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
