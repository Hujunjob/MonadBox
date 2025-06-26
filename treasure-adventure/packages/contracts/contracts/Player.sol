// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./Equipment.sol";
import "./AdventureGold.sol";
import "./Item.sol";
import "hardhat/console.sol";

/**
 * @title Player
 * @dev 玩家NFT合约 - 玩家就是一个NFT，包含所有玩家属性和装备槽
 */
contract Player is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    IERC721Receiver,
    IERC1155Receiver,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    struct PlayerData {
        string name;
        uint16 level;
        uint32 experience;
        uint16 health;
        uint16 maxHealth;
        uint16 attack;
        uint16 defense;
        uint16 agility;
        uint8 criticalRate;
        uint16 criticalDamage;
        uint8 stamina;
        uint8 maxStamina;
        uint32 lastStaminaTime;
        uint16 currentForestLevel;
        uint16 currentForestProgress;
        uint256 lastTreasureBoxTime;
        uint256 goldBalance; // Player NFT owns gold directly
        uint256[] inventory; // Equipment IDs owned by Player NFT
    }

    // 玩家数据存储
    mapping(uint256 => PlayerData) public players;

    // 装备槽存储 (Player NFT ID => Equipment ID)
    mapping(uint256 => mapping(uint8 => uint256)) public equippedItems; // slot => equipmentId

    // 装备类型槽位映射
    mapping(uint8 => uint8) public equipmentTypeToSlot; // equipmentType => slot

    // 玩家物品存储 (Player NFT ID => Item ID => quantity)
    mapping(uint256 => mapping(uint256 => uint256)) public playerItems;

    uint256 private _nextTokenId;
    Equipment public equipmentNFT;
    AdventureGold public goldToken;
    Item public itemNFT;

    // 体力配置
    uint8 public MAX_STAMINA;
    uint32 public STAMINA_RECOVERY_INTERVAL; // 30 seconds

    // 经验和等级配置
    uint16 public BASE_EXP_PER_LEVEL;
    uint16 public MAX_LEVEL;

    // 初始玩家属性
    uint16 public INITIAL_HEALTH;
    uint16 public INITIAL_ATTACK;
    uint16 public INITIAL_DEFENSE;
    uint16 public INITIAL_AGILITY;
    uint8 public INITIAL_CRIT_RATE;
    uint16 public INITIAL_CRIT_DAMAGE;

    // 升级属性提升
    uint16 public HEALTH_PER_LEVEL;
    uint16 public ATTACK_PER_LEVEL;
    uint16 public DEFENSE_PER_LEVEL;
    uint16 public AGILITY_PER_LEVEL;

    // 装备槽位数量
    uint8 public TOTAL_EQUIPMENT_SLOTS;

    // 玩家名称长度限制
    uint8 public MIN_NAME_LENGTH;
    uint8 public MAX_NAME_LENGTH;

    // 初始值
    // uint256 public const INITIAL_TOKEN_ID = 1;
    uint16 public INITIAL_LEVEL;
    uint32 public INITIAL_EXPERIENCE;
    uint16 public INITIAL_FOREST_LEVEL;
    uint16 public INITIAL_FOREST_PROGRESS;
    uint256 public INITIAL_GOLD_BALANCE;

    // 体力相关
    uint8 public STAMINA_GAIN_PER_10_LEVELS;
    uint8 public STAMINA_LEVEL_INTERVAL;
    uint8 public MAX_POSSIBLE_STAMINA;

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

    // 事件
    event PlayerMinted(
        address indexed to,
        uint256 indexed playerId,
        string name
    );
    event EquipmentEquipped(
        uint256 indexed playerId,
        uint256 indexed equipmentId,
        uint8 slot
    );
    event EquipmentUnequipped(
        uint256 indexed playerId,
        uint256 indexed equipmentId,
        uint8 slot
    );
    event PlayerLevelUp(
        uint256 indexed playerId,
        uint16 newLevel,
        uint16 oldLevel
    );
    event StaminaUpdated(uint256 indexed playerId, uint8 newStamina);
    event GoldAdded(uint256 indexed playerId, uint256 amount);
    event EquipmentAddedToInventory(
        uint256 indexed playerId,
        uint256 equipmentId
    );
    event EquipmentRemovedFromInventory(
        uint256 indexed playerId,
        uint256 equipmentId
    );
    event ItemAdded(uint256 indexed playerId, uint256 itemId, uint256 quantity);
    event ItemUsed(uint256 indexed playerId, uint256 itemId, uint256 quantity);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _equipmentNFT,
        address _goldToken,
        address _itemNFT,
        address initialOwner
    ) public initializer {
        __ERC721_init("Adventure Player", "PLAYER");
        __ERC721Enumerable_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();

        equipmentNFT = Equipment(_equipmentNFT);
        goldToken = AdventureGold(_goldToken);
        itemNFT = Item(_itemNFT);

        if (_nextTokenId == 0) {
            _nextTokenId = 1000;
        }

        // 设置装备类型到槽位的映射
        equipmentTypeToSlot[equipmentNFT.EQUIPMENT_TYPE_ARMOR()] = 1; // armor
        equipmentTypeToSlot[equipmentNFT.EQUIPMENT_TYPE_SHOES()] = 2; // shoes
        equipmentTypeToSlot[equipmentNFT.EQUIPMENT_TYPE_WEAPON()] = 3; // weapon
        equipmentTypeToSlot[equipmentNFT.EQUIPMENT_TYPE_SHIELD()] = 4; // shield
        equipmentTypeToSlot[equipmentNFT.EQUIPMENT_TYPE_ACCESSORY()] = 5; // accessory
        equipmentTypeToSlot[equipmentNFT.EQUIPMENT_TYPE_RING()] = 6; // ring
        equipmentTypeToSlot[equipmentNFT.EQUIPMENT_TYPE_HELMET()] = 7; // helmet
        // equipmentTypeToSlot[0] = 0; // helmet
        initConfig();
    }

    function initConfig() internal {
        // 体力配置
        MAX_STAMINA = 24;
        STAMINA_RECOVERY_INTERVAL = 30; // 30 seconds

        // 经验和等级配置
        BASE_EXP_PER_LEVEL = 100;
        MAX_LEVEL = 100;

        // 初始玩家属性
        INITIAL_HEALTH = 100;
        INITIAL_ATTACK = 15;
        INITIAL_DEFENSE = 10;
        INITIAL_AGILITY = 10;
        INITIAL_CRIT_RATE = 5;
        INITIAL_CRIT_DAMAGE = 150;

        // 升级属性提升
        HEALTH_PER_LEVEL = 10;
        ATTACK_PER_LEVEL = 2;
        DEFENSE_PER_LEVEL = 1;
        AGILITY_PER_LEVEL = 1;

        // 装备槽位数量
        TOTAL_EQUIPMENT_SLOTS = 8;

        // 玩家名称长度限制
        MIN_NAME_LENGTH = 2;
        MAX_NAME_LENGTH = 20;

        // 初始值
        // uint256 public const INITIAL_TOKEN_ID = 1;
        INITIAL_LEVEL = 1;
        INITIAL_EXPERIENCE = 0;
        INITIAL_FOREST_LEVEL = 1;
        INITIAL_FOREST_PROGRESS = 0;
        INITIAL_GOLD_BALANCE = 0;

        // 体力相关
        STAMINA_GAIN_PER_10_LEVELS = 2;
        STAMINA_LEVEL_INTERVAL = 10;
        MAX_POSSIBLE_STAMINA = 50;
    }

    /**
     * @dev 注册玩家（安全版本 - 只能为自己铸造）
     * @param name 玩家名称
     * @return playerId 玩家NFT ID
     */
    function registerPlayer(string memory name) external returns (uint256) {
        address to = msg.sender;
        require(
            bytes(name).length >= MIN_NAME_LENGTH &&
                bytes(name).length <= MAX_NAME_LENGTH,
            "Invalid name length"
        );
        require(balanceOf(to) == 0, "Player already exists"); // 每个地址只能有一个 Player NFT

        uint256 playerId = _nextTokenId++;
        _safeMint(to, playerId);

        // 初始化玩家数据
        players[playerId] = PlayerData({
            name: name,
            level: INITIAL_LEVEL,
            experience: INITIAL_EXPERIENCE,
            health: INITIAL_HEALTH,
            maxHealth: INITIAL_HEALTH,
            attack: INITIAL_ATTACK,
            defense: INITIAL_DEFENSE,
            agility: INITIAL_AGILITY,
            criticalRate: INITIAL_CRIT_RATE,
            criticalDamage: INITIAL_CRIT_DAMAGE,
            stamina: MAX_STAMINA,
            maxStamina: MAX_STAMINA,
            lastStaminaTime: uint32(block.timestamp),
            currentForestLevel: INITIAL_FOREST_LEVEL,
            currentForestProgress: INITIAL_FOREST_PROGRESS,
            lastTreasureBoxTime: (block.timestamp),
            goldBalance: INITIAL_GOLD_BALANCE,
            inventory: new uint256[](0)
        });

        emit PlayerMinted(to, playerId, name);
        return playerId;
        // return mintPlayer(msg.sender, name);
    }

    /**
     * @dev 装备道具（从Player NFT背包装备）
     * @param equipmentId Equipment NFT ID
     */
    function equipItem(uint256 playerId, uint256 equipmentId) external {
        require(ownerOf(playerId) == msg.sender, "Not your player");
        require(
            _hasEquipmentInInventory(playerId, equipmentId),
            "Equipment not in inventory"
        );
        require(
            equipmentNFT.ownerOf(equipmentId) == address(this),
            "Equipment not owned by Player NFT"
        );

        // 获取装备类型和对应槽位
        Equipment.EquipmentData memory equipData = equipmentNFT.getEquipment(
            equipmentId
        );
        uint8 slot = equipmentTypeToSlot[equipData.equipmentType];

        // 如果槽位已有装备，先卸下
        uint256 currentEquipment = equippedItems[playerId][slot];
        if (currentEquipment != 0) {
            _unequipItem(playerId, slot);
        }

        // 装备新道具（装备已在Player合约中）
        equippedItems[playerId][slot] = equipmentId;

        emit EquipmentEquipped(playerId, equipmentId, slot);
    }

    /**
     * @dev 卸下装备
     * @param playerId 玩家ID
     * @param slot 装备槽位
     */
    function unequipItem(uint256 playerId, uint8 slot) external {
        require(ownerOf(playerId) == msg.sender, "Not your player");
        require(slot < TOTAL_EQUIPMENT_SLOTS, "Invalid slot");
        require(
            equippedItems[playerId][slot] != 0,
            "No equipment in this slot"
        );

        _unequipItem(playerId, slot);
    }

    /**
     * @dev 内部卸装备函数（装备回到背包）
     */
    function _unequipItem(uint256 playerId, uint8 slot) internal {
        uint256 equipmentId = equippedItems[playerId][slot];
        require(equipmentId != 0, "No equipment in this slot");

        // 装备回到背包（装备仍在Player合约中）
        equippedItems[playerId][slot] = 0;

        emit EquipmentUnequipped(playerId, equipmentId, slot);
    }

    /**
     * @dev 更新体力（内部函数）
     */
    function _updateStamina(uint256 playerId) internal {
        PlayerData storage player = players[playerId];
        require(player.maxHealth > 0, "Player not exists");

        uint32 timeSinceLastUpdate = uint32(block.timestamp) -
            player.lastStaminaTime;
        uint8 staminaToRecover = uint8(
            timeSinceLastUpdate / STAMINA_RECOVERY_INTERVAL
        );

        if (staminaToRecover > 0 && player.stamina < player.maxStamina) {
            uint8 actualRecovery = staminaToRecover;
            if (player.stamina + actualRecovery > player.maxStamina) {
                actualRecovery = player.maxStamina - player.stamina;
            }

            player.stamina += actualRecovery;
            player.lastStaminaTime +=
                actualRecovery *
                STAMINA_RECOVERY_INTERVAL;

            emit StaminaUpdated(playerId, player.stamina);
        }
    }

    /**
     * @dev 升级玩家（内部函数）
     */
    function _levelUp(uint256 playerId) internal {
        PlayerData storage player = players[playerId];
        require(player.maxHealth > 0, "Player not exists");

        uint16 oldLevel = player.level;
        uint32 expNeeded = player.level * BASE_EXP_PER_LEVEL;

        while (player.experience >= expNeeded && player.level < MAX_LEVEL) {
            player.experience -= expNeeded;
            player.level++;

            // 属性提升
            player.maxHealth += HEALTH_PER_LEVEL;
            player.health += HEALTH_PER_LEVEL;
            player.attack += ATTACK_PER_LEVEL;
            player.defense += DEFENSE_PER_LEVEL;
            player.agility += AGILITY_PER_LEVEL;

            // 每10级增加最大体力
            if (
                player.level % STAMINA_LEVEL_INTERVAL == 0 &&
                player.maxStamina < MAX_POSSIBLE_STAMINA
            ) {
                player.maxStamina += STAMINA_GAIN_PER_10_LEVELS;
                player.stamina += STAMINA_GAIN_PER_10_LEVELS;
            }

            expNeeded = player.level * BASE_EXP_PER_LEVEL;
        }

        if (player.level > oldLevel) {
            emit PlayerLevelUp(playerId, player.level, oldLevel);
        }
    }

    /**
     * @dev 升级玩家（只有玩家自己或授权系统可以调用）
     */
    function levelUp(uint256 playerId) external {
        require(
            ownerOf(playerId) == msg.sender ||
                authorizedSystems[msg.sender] ||
                msg.sender == owner(),
            "Not authorized"
        );
        _levelUp(playerId);
    }

    /**
     * @dev 更新体力（只有玩家自己或授权系统可以调用）
     */
    function updateStamina(uint256 playerId) external {
        require(
            ownerOf(playerId) == msg.sender ||
                authorizedSystems[msg.sender] ||
                msg.sender == owner(),
            "Not authorized"
        );
        _updateStamina(playerId);
    }

    /**
     * @dev 增加经验
     */
    function addExperience(
        uint256 playerId,
        uint16 experience
    ) external onlyAuthorizedOrOwner {
        PlayerData storage player = players[playerId];
        require(player.maxHealth > 0, "Player not exists");

        player.experience += experience;
        _levelUp(playerId);
    }

    /**
     * @dev 消耗体力
     */
    function consumeStamina(
        uint256 playerId,
        uint8 amount
    ) external onlyAuthorizedOrOwner {
        PlayerData storage player = players[playerId];
        require(player.maxHealth > 0, "Player not exists");
        require(player.stamina >= amount, "Not enough stamina");

        _updateStamina(playerId);
        player.stamina -= amount;
        player.lastStaminaTime = uint32(block.timestamp);
    }

    /**
     * @dev 恢复血量（只有玩家自己或授权系统可以调用）
     */
    function heal(uint256 playerId, uint16 amount) external {
        require(
            ownerOf(playerId) == msg.sender ||
                authorizedSystems[msg.sender] ||
                msg.sender == owner(),
            "Not authorized"
        );
        PlayerData storage player = players[playerId];
        require(player.maxHealth > 0, "Player not exists");

        uint16 newHealth = player.health + amount;
        if (newHealth > player.maxHealth) {
            newHealth = player.maxHealth;
        }
        player.health = newHealth;
    }

    /**
     * @dev 获取玩家数据
     */
    function getPlayer(
        uint256 playerId
    ) external view returns (PlayerData memory) {
        require(players[playerId].maxHealth > 0, "Player not exists");
        return players[playerId];
    }

    /**
     * @dev 获取玩家装备
     */
    function getEquippedItems(
        uint256 playerId
    ) external view returns (uint256[8] memory) {
        uint256[8] memory equipped;
        for (uint8 i = 0; i < TOTAL_EQUIPMENT_SLOTS; i++) {
            equipped[i] = equippedItems[playerId][i];
        }
        return equipped;
    }

    /**
     * @dev 获取玩家总属性（包含装备加成）
     */
    function getPlayerTotalStats(
        uint256 playerId
    )
        external
        view
        returns (
            uint16 totalAttack,
            uint16 totalDefense,
            uint16 totalAgility,
            uint8 totalCritRate,
            uint16 totalCritDamage
        )
    {
        PlayerData memory player = players[playerId];
        require(player.maxHealth > 0, "Player not exists");

        totalAttack = player.attack;
        totalDefense = player.defense;
        totalAgility = player.agility;
        totalCritRate = player.criticalRate;
        totalCritDamage = player.criticalDamage;

        // 计算装备加成
        for (uint8 slot = 0; slot < TOTAL_EQUIPMENT_SLOTS; slot++) {
            uint256 equipmentId = equippedItems[playerId][slot];
            if (equipmentId != 0) {
                Equipment.EquipmentData memory equipData = equipmentNFT
                    .getEquipment(equipmentId);
                totalAttack += equipData.attack;
                totalDefense += equipData.defense;
                totalAgility += equipData.agility;
                totalCritRate += equipData.criticalRate;
                totalCritDamage += equipData.criticalDamage;
            }
        }
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
     * @dev 实现IERC1155Receiver以接收Item NFT
     */
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }

    /**
     * @dev 实现IERC1155Receiver以接收批量Item NFT
     */
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155BatchReceived.selector;
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
     * @dev 重写_update函数以支持ERC721Enumerable和禁用转移
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    )
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Player NFT is non-transferable");
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev 重写_increaseBalance函数以支持ERC721Enumerable
     */
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._increaseBalance(account, value);
    }

    /**
     * @dev 添加金币到玩家NFT（记录余额，实际金币由Player NFT合约持有）
     */
    function addGold(
        uint256 playerId,
        uint256 amount
    ) external onlyAuthorizedOrOwner {
        PlayerData storage player = players[playerId];
        require(player.maxHealth > 0, "Player not exists");

        player.goldBalance += amount;
        emit GoldAdded(playerId, amount);
    }

    /**
     * @dev 消耗玩家金币（从余额和Player NFT合约中转移金币）
     */
    function spendGold(
        uint256 playerId,
        uint256 amount,
        address to
    ) external onlyAuthorizedOrOwner {
        PlayerData storage player = players[playerId];
        require(player.maxHealth > 0, "Player not exists");
        require(player.goldBalance >= amount, "Insufficient gold");

        player.goldBalance -= amount;
        goldToken.transfer(to, amount);
    }

    /**
     * @dev 添加装备到玩家NFT背包
     */
    function addEquipmentToInventory(
        uint256 playerId,
        uint256 equipmentId
    ) external onlyAuthorizedOrOwner {
        console.log("addEquipmentToInventory", playerId, equipmentId);
        PlayerData storage player = players[playerId];
        require(player.maxHealth > 0, "Player not exists");
        require(
            equipmentNFT.ownerOf(equipmentId) == address(this),
            "Equipment not owned by Player NFT"
        );

        player.inventory.push(equipmentId);
        emit EquipmentAddedToInventory(playerId, equipmentId);
    }

    /**
     * @dev 从玩家NFT背包移除装备并转移给玩家
     */
    function removeEquipmentFromInventory(
        uint256 playerId,
        uint256 equipmentId,
        address to
    ) external onlyAuthorizedOrOwner {
        PlayerData storage player = players[playerId];
        require(player.maxHealth > 0, "Player not exists");

        // 查找并移除装备
        for (uint256 i = 0; i < player.inventory.length; i++) {
            if (player.inventory[i] == equipmentId) {
                // 将最后一个元素移到当前位置，然后删除最后一个元素
                player.inventory[i] = player.inventory[
                    player.inventory.length - 1
                ];
                player.inventory.pop();

                // 转移装备NFT给玩家
                equipmentNFT.safeTransferFrom(address(this), to, equipmentId);

                emit EquipmentRemovedFromInventory(playerId, equipmentId);
                return;
            }
        }
        revert("Equipment not found in inventory");
    }

    /**
     * @dev 获取玩家金币余额
     */
    function getPlayerGold(uint256 playerId) external view returns (uint256) {
        require(players[playerId].maxHealth > 0, "Player not exists");
        return players[playerId].goldBalance;
    }

    /**
     * @dev 获取玩家背包装备
     */
    function getPlayerInventory(
        uint256 playerId
    ) external view returns (uint256[] memory) {
        require(players[playerId].maxHealth > 0, "Player not exists");
        return players[playerId].inventory;
    }

    /**
     * @dev 检查玩家是否拥有特定装备（内部函数）
     */
    function _hasEquipmentInInventory(
        uint256 playerId,
        uint256 equipmentId
    ) internal view returns (bool) {
        if (players[playerId].maxHealth == 0) return false;

        uint256[] memory inventory = players[playerId].inventory;
        for (uint256 i = 0; i < inventory.length; i++) {
            if (inventory[i] == equipmentId) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev 检查玩家是否拥有特定装备（外部函数）
     */
    function hasEquipmentInInventory(
        uint256 playerId,
        uint256 equipmentId
    ) external view returns (bool) {
        return _hasEquipmentInInventory(playerId, equipmentId);
    }

    /**
     * @dev 更新宝箱时间
     */
    function updateLastTreasureBoxTime(
        uint256 playerId
    ) external onlyAuthorizedOrOwner {
        PlayerData storage player = players[playerId];
        require(player.maxHealth > 0, "Player not exists");

        player.lastTreasureBoxTime = block.timestamp;
    }

    /**
     * @dev 添加物品到玩家NFT
     */
    function addItem(
        uint256 playerId,
        uint256 itemId,
        uint256 quantity
    ) external onlyAuthorizedOrOwner {
        PlayerData storage player = players[playerId];
        require(player.maxHealth > 0, "Player not exists");

        playerItems[playerId][itemId] += quantity;
        emit ItemAdded(playerId, itemId, quantity);
    }

    /**
     * @dev 使用物品（减少数量）
     */
    function useItem(
        uint256 playerId,
        uint256 itemId,
        uint256 quantity
    ) external {
        require(
            ownerOf(playerId) == msg.sender ||
                authorizedSystems[msg.sender] ||
                msg.sender == owner(),
            "Not authorized"
        );
        require(
            playerItems[playerId][itemId] >= quantity,
            "Insufficient item quantity"
        );

        playerItems[playerId][itemId] -= quantity;

        // 实际销毁 ERC1155 NFT
        itemNFT.burn(itemId, quantity);

        emit ItemUsed(playerId, itemId, quantity);
    }

    function setHealth(
        uint256 playerId,
        uint16 newHealth
    ) external onlyAuthorizedOrOwner {
        PlayerData storage player = players[playerId];
        require(player.maxHealth > 0, "Player not exists");
        require(newHealth <= player.maxHealth, "Health exceed max");
        player.health = newHealth;
    }

    /**
     * @dev 将物品从玩家转移到市场
     */
    function transferItemToMarket(
        uint256 playerId,
        uint256 itemId,
        uint256 quantity,
        address marketAddress
    ) external onlyAuthorizedOrOwner {
        PlayerData storage player = players[playerId];
        require(player.maxHealth > 0, "Player not exists");
        require(
            playerItems[playerId][itemId] >= quantity,
            "Insufficient item quantity"
        );

        // 减少玩家的物品记录
        playerItems[playerId][itemId] -= quantity;

        // 实际转移 ERC1155 NFT 到市场
        itemNFT.safeTransferFrom(
            address(this),
            marketAddress,
            itemId,
            quantity,
            ""
        );

        emit ItemUsed(playerId, itemId, quantity);
    }

    /**
     * @dev 获取玩家特定物品数量
     */
    function getPlayerItemQuantity(
        uint256 playerId,
        uint256 itemId
    ) external view returns (uint256) {
        require(players[playerId].maxHealth > 0, "Player not exists");
        return playerItems[playerId][itemId];
    }

    /**
     * @dev 获取玩家所有物品（返回有数量的物品）
     */
    function getPlayerItems(
        uint256 playerId
    )
        external
        view
        returns (uint256[] memory itemIds, uint256[] memory quantities)
    {
        require(players[playerId].maxHealth > 0, "Player not exists");

        // 先计算有多少个非零物品
        uint256 count = 0;

        // 检查所有可能的item ID范围
        // 血瓶: 100-199, 转职书: 200-299, 宠物蛋: 300-399
        for (
            uint256 i = itemNFT.HEALTH_POTION_START_ID();
            i < itemNFT.ITEM_SEARCH_END_ID();
            i++
        ) {
            if (playerItems[playerId][i] > 0) {
                count++;
            }
        }

        // 创建结果数组
        itemIds = new uint256[](count);
        quantities = new uint256[](count);

        // 填充结果数组
        uint256 index = 0;
        for (
            uint256 i = itemNFT.HEALTH_POTION_START_ID();
            i < itemNFT.ITEM_SEARCH_END_ID();
            i++
        ) {
            if (playerItems[playerId][i] > 0) {
                itemIds[index] = i;
                quantities[index] = playerItems[playerId][i];
                index++;
            }
        }
    }

    /**
     * @dev 使用血瓶恢复血量
     */
    function useHealthPotion(uint256 playerId, uint256 itemId) external {
        require(ownerOf(playerId) == msg.sender, "Not your player");
        require(playerItems[playerId][itemId] > 0, "No health potion");
        require(
            itemId >= itemNFT.HEALTH_POTION_START_ID() &&
                itemId < itemNFT.HEALTH_POTION_END_ID(),
            "Not a health potion"
        );

        PlayerData storage player = players[playerId];
        require(player.maxHealth > 0, "Player not exists");
        require(player.health < player.maxHealth, "Health already full");

        // 计算治疗量（根据血瓶等级）
        uint256 healAmount = _calculateHealAmount(itemId);

        // 恢复血量
        uint16 newHealth = player.health + uint16(healAmount);
        if (newHealth > player.maxHealth) {
            newHealth = player.maxHealth;
        }
        player.health = newHealth;

        // 消耗血瓶
        playerItems[playerId][itemId] -= 1;
        emit ItemUsed(playerId, itemId, 1);
    }

    /**
     * @dev 计算血瓶治疗量（内部函数）
     */
    function _calculateHealAmount(
        uint256 itemId
    ) internal view returns (uint256) {
        // 根据itemId计算等级，然后计算治疗量
        // 假设itemId为100+level的格式
        uint256 level = (itemId - itemNFT.HEALTH_POTION_START_ID()) + 1;
        return
            itemNFT.BASE_HEAL_AMOUNT() +
            (level - 1) *
            itemNFT.HEAL_AMOUNT_PER_LEVEL(); // 基础50 + (level-1)*25
    }

    /**
     * @dev 重写supportsInterface函数
     */
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC1155Receiver).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
