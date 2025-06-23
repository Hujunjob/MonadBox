// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./GameStructs.sol";
import "./GameConfig.sol";
import "./Equipment.sol";
import "./AdventureGold.sol";
import "./Item.sol";
import "hardhat/console.sol";

/**
 * @title Player
 * @dev 玩家NFT合约 - 玩家就是一个NFT，包含所有玩家属性和装备槽
 */
contract Player is ERC721, ERC721Enumerable, IERC721Receiver, IERC1155Receiver, Ownable {
    using GameStructs for GameStructs.Player;
    
    // 玩家数据存储
    mapping(uint256 => GameStructs.Player) public players;
    
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
    
    // 授权的系统合约
    mapping(address => bool) public authorizedSystems;
    
    // 修饰符：只有授权的系统或owner可以调用
    modifier onlyAuthorizedOrOwner() {
        require(authorizedSystems[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    // 事件
    event PlayerMinted(address indexed to, uint256 indexed playerId, string name);
    event EquipmentEquipped(uint256 indexed playerId, uint256 indexed equipmentId, uint8 slot);
    event EquipmentUnequipped(uint256 indexed playerId, uint256 indexed equipmentId, uint8 slot);
    event PlayerLevelUp(uint256 indexed playerId, uint16 newLevel, uint16 oldLevel);
    event StaminaUpdated(uint256 indexed playerId, uint8 newStamina);
    event GoldAdded(uint256 indexed playerId, uint256 amount);
    event EquipmentAddedToInventory(uint256 indexed playerId, uint256 equipmentId);
    event EquipmentRemovedFromInventory(uint256 indexed playerId, uint256 equipmentId);
    event ItemAdded(uint256 indexed playerId, uint256 itemId, uint256 quantity);
    event ItemUsed(uint256 indexed playerId, uint256 itemId, uint256 quantity);
    
    constructor(address _equipmentNFT, address _goldToken, address _itemNFT) ERC721("Adventure Player", "PLAYER") Ownable(msg.sender) {
        equipmentNFT = Equipment(_equipmentNFT);
        goldToken = AdventureGold(_goldToken);
        itemNFT = Item(_itemNFT);
        _nextTokenId = 1;
        
        // 设置装备类型到槽位的映射
        equipmentTypeToSlot[0] = 0; // helmet
        equipmentTypeToSlot[1] = 1; // armor  
        equipmentTypeToSlot[2] = 2; // shoes
        equipmentTypeToSlot[3] = 3; // weapon
        equipmentTypeToSlot[4] = 4; // shield
        equipmentTypeToSlot[5] = 5; // accessory
        equipmentTypeToSlot[6] = 6; // ring
        equipmentTypeToSlot[7] = 7; // pet
    }
    
    /**
     * @dev 注册玩家（安全版本 - 只能为自己铸造）
     * @param name 玩家名称
     * @return playerId 玩家NFT ID
     */
    function registerPlayer(string memory name) external returns (uint256) {
        return mintPlayer(msg.sender, name);
    }

    /**
     * @dev 铸造Player NFT（内部函数 + 管理员功能）
     * @param to 接收地址
     * @param name 玩家名称
     * @return playerId 玩家NFT ID
     */
    function mintPlayer(address to, string memory name) public onlyAuthorizedOrOwner returns (uint256) {
        require(bytes(name).length >= 2 && bytes(name).length <= 20, "Invalid name length");
        require(balanceOf(to) == 0, "Player already exists"); // 每个地址只能有一个 Player NFT
        
        uint256 playerId = _nextTokenId++;
        _safeMint(to, playerId);
        
        // 初始化玩家数据
        players[playerId] = GameStructs.Player({
            name: name,
            level: 1,
            experience: 0,
            health: GameConfig.INITIAL_HEALTH,
            maxHealth: GameConfig.INITIAL_HEALTH,
            attack: GameConfig.INITIAL_ATTACK,
            defense: GameConfig.INITIAL_DEFENSE,
            agility: GameConfig.INITIAL_AGILITY,
            criticalRate: GameConfig.INITIAL_CRIT_RATE,
            criticalDamage: GameConfig.INITIAL_CRIT_DAMAGE,
            stamina: GameConfig.MAX_STAMINA,
            maxStamina: GameConfig.MAX_STAMINA,
            lastStaminaTime: uint32(block.timestamp),
            currentForestLevel: 1,
            currentForestProgress: 0,
            lastTreasureBoxTime: (block.timestamp),
            initialized: true,
            job: 0,
            goldBalance: 0,
            inventory: new uint256[](0)
        });
        
        emit PlayerMinted(to, playerId, name);
        return playerId;
    }
    
    /**
     * @dev 装备道具（从Player NFT背包装备）
     * @param equipmentId Equipment NFT ID
     */
    function equipItem(uint256 playerId, uint256 equipmentId) external {
        require(ownerOf(playerId) == msg.sender, "Not your player");
        require(_hasEquipmentInInventory(playerId, equipmentId), "Equipment not in inventory");
        require(equipmentNFT.ownerOf(equipmentId) == address(this), "Equipment not owned by Player NFT");
        
        // 获取装备类型和对应槽位
        Equipment.EquipmentData memory equipData = equipmentNFT.getEquipment(equipmentId);
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
        require(slot < 8, "Invalid slot");
        require(equippedItems[playerId][slot] != 0, "No equipment in this slot");
        
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
        GameStructs.Player storage player = players[playerId];
        require(player.initialized, "Player not exists");
        
        uint32 timeSinceLastUpdate = uint32(block.timestamp) - player.lastStaminaTime;
        uint8 staminaToRecover = uint8(timeSinceLastUpdate / GameConfig.STAMINA_RECOVERY_INTERVAL);
        
        if (staminaToRecover > 0 && player.stamina < player.maxStamina) {
            uint8 actualRecovery = staminaToRecover;
            if (player.stamina + actualRecovery > player.maxStamina) {
                actualRecovery = player.maxStamina - player.stamina;
            }
            
            player.stamina += actualRecovery;
            player.lastStaminaTime += actualRecovery * GameConfig.STAMINA_RECOVERY_INTERVAL;
            
            emit StaminaUpdated(playerId, player.stamina);
        }
    }
    
    /**
     * @dev 升级玩家（内部函数）
     */
    function _levelUp(uint256 playerId) internal {
        GameStructs.Player storage player = players[playerId];
        require(player.initialized, "Player not exists");
        
        uint16 oldLevel = player.level;
        uint32 expNeeded = player.level * GameConfig.BASE_EXP_PER_LEVEL;
        
        while (player.experience >= expNeeded && player.level < GameConfig.MAX_LEVEL) {
            player.experience -= expNeeded;
            player.level++;
            
            // 属性提升
            player.maxHealth += GameConfig.HEALTH_PER_LEVEL;
            player.health += GameConfig.HEALTH_PER_LEVEL;
            player.attack += GameConfig.ATTACK_PER_LEVEL;
            player.defense += GameConfig.DEFENSE_PER_LEVEL;
            player.agility += GameConfig.AGILITY_PER_LEVEL;
            
            // 每10级增加最大体力
            if (player.level % 10 == 0 && player.maxStamina < 50) {
                player.maxStamina += 2;
                player.stamina += 2;
            }
            
            expNeeded = player.level * GameConfig.BASE_EXP_PER_LEVEL;
        }
        
        if (player.level > oldLevel) {
            emit PlayerLevelUp(playerId, player.level, oldLevel);
        }
    }
    
    /**
     * @dev 升级玩家（只有玩家自己或授权系统可以调用）
     */
    function levelUp(uint256 playerId) external {
        require(ownerOf(playerId) == msg.sender || authorizedSystems[msg.sender] || msg.sender == owner(), "Not authorized");
        _levelUp(playerId);
    }
    
    /**
     * @dev 更新体力（只有玩家自己或授权系统可以调用）
     */
    function updateStamina(uint256 playerId) external {
        require(ownerOf(playerId) == msg.sender || authorizedSystems[msg.sender] || msg.sender == owner(), "Not authorized");
        _updateStamina(playerId);
    }
    
    /**
     * @dev 增加经验
     */
    function addExperience(uint256 playerId, uint16 experience) external onlyAuthorizedOrOwner {
        GameStructs.Player storage player = players[playerId];
        require(player.initialized, "Player not exists");
        
        player.experience += experience;
        _levelUp(playerId);
    }
    
    /**
     * @dev 消耗体力
     */
    function consumeStamina(uint256 playerId, uint8 amount) external onlyAuthorizedOrOwner {
        GameStructs.Player storage player = players[playerId];
        require(player.initialized, "Player not exists");
        require(player.stamina >= amount, "Not enough stamina");
        
        _updateStamina(playerId);
        player.stamina -= amount;
        player.lastStaminaTime = uint32(block.timestamp);
    }
    
    /**
     * @dev 恢复血量（只有玩家自己或授权系统可以调用）
     */
    function heal(uint256 playerId, uint16 amount) external {
        require(ownerOf(playerId) == msg.sender || authorizedSystems[msg.sender] || msg.sender == owner(), "Not authorized");
        GameStructs.Player storage player = players[playerId];
        require(player.initialized, "Player not exists");
        
        uint16 newHealth = player.health + amount;
        if (newHealth > player.maxHealth) {
            newHealth = player.maxHealth;
        }
        player.health = newHealth;
    }
    
    /**
     * @dev 获取玩家数据
     */
    function getPlayer(uint256 playerId) external view returns (GameStructs.Player memory) {
        require(players[playerId].initialized, "Player not exists");
        return players[playerId];
    }
    
    /**
     * @dev 获取玩家装备
     */
    function getEquippedItems(uint256 playerId) external view returns (uint256[8] memory) {
        uint256[8] memory equipped;
        for (uint8 i = 0; i < 8; i++) {
            equipped[i] = equippedItems[playerId][i];
        }
        return equipped;
    }
    
    /**
     * @dev 获取玩家总属性（包含装备加成）
     */
    function getPlayerTotalStats(uint256 playerId) external view returns (
        uint16 totalAttack,
        uint16 totalDefense,
        uint16 totalAgility,
        uint8 totalCritRate,
        uint16 totalCritDamage
    ) {
        GameStructs.Player memory player = players[playerId];
        require(player.initialized, "Player not exists");
        
        totalAttack = player.attack;
        totalDefense = player.defense;
        totalAgility = player.agility;
        totalCritRate = player.criticalRate;
        totalCritDamage = player.criticalDamage;
        
        // 计算装备加成
        for (uint8 slot = 0; slot < 8; slot++) {
            uint256 equipmentId = equippedItems[playerId][slot];
            if (equipmentId != 0) {
                Equipment.EquipmentData memory equipData = equipmentNFT.getEquipment(equipmentId);
                totalAttack += equipData.attack;
                totalDefense += equipData.defense;
                totalAgility += equipData.agility;
                totalCritRate += equipData.criticalRate;
                totalCritDamage += equipData.criticalDamage;
            }
        }
    }
    
    /**
     * @dev 检查是否可以战斗
     */
    function canBattle(uint256 playerId, uint8 staminaCost) external view returns (bool) {
        GameStructs.Player memory player = players[playerId];
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
    function revokeSystemAuthorization(address systemContract) external onlyOwner {
        authorizedSystems[systemContract] = false;
    }
    
    /**
     * @dev 重写_update函数以支持ERC721Enumerable和禁用转移
     */
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Player NFT is non-transferable");
        }
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev 重写_increaseBalance函数以支持ERC721Enumerable
     */
    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }
    
    /**
     * @dev 添加金币到玩家NFT（记录余额，实际金币由Player NFT合约持有）
     */
    function addGold(uint256 playerId, uint256 amount) external onlyAuthorizedOrOwner {
        GameStructs.Player storage player = players[playerId];
        require(player.initialized, "Player not exists");
        
        player.goldBalance += amount;
        emit GoldAdded(playerId, amount);
    }
    
    /**
     * @dev 消耗玩家金币（从余额和Player NFT合约中转移金币）
     */
    function spendGold(uint256 playerId, uint256 amount, address to) external onlyAuthorizedOrOwner {
        GameStructs.Player storage player = players[playerId];
        require(player.initialized, "Player not exists");
        require(player.goldBalance >= amount, "Insufficient gold");
        
        player.goldBalance -= amount;
        goldToken.transfer(to, amount);
    }
    
    
    /**
     * @dev 添加装备到玩家NFT背包
     */
    function addEquipmentToInventory(uint256 playerId, uint256 equipmentId) external onlyAuthorizedOrOwner {
        console.log("addEquipmentToInventory",playerId,equipmentId);
        GameStructs.Player storage player = players[playerId];
        require(player.initialized, "Player not exists");
        require(equipmentNFT.ownerOf(equipmentId) == address(this), "Equipment not owned by Player NFT");
        
        player.inventory.push(equipmentId);
        emit EquipmentAddedToInventory(playerId, equipmentId);
    }
    
    /**
     * @dev 从玩家NFT背包移除装备并转移给玩家
     */
    function removeEquipmentFromInventory(uint256 playerId, uint256 equipmentId, address to) external onlyAuthorizedOrOwner {
        GameStructs.Player storage player = players[playerId];
        require(player.initialized, "Player not exists");
        require(ownerOf(playerId) == to, "Not player owner");
        
        // 查找并移除装备
        for (uint256 i = 0; i < player.inventory.length; i++) {
            if (player.inventory[i] == equipmentId) {
                // 将最后一个元素移到当前位置，然后删除最后一个元素
                player.inventory[i] = player.inventory[player.inventory.length - 1];
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
        require(players[playerId].initialized, "Player not exists");
        return players[playerId].goldBalance;
    }
    
    /**
     * @dev 获取玩家背包装备
     */
    function getPlayerInventory(uint256 playerId) external view returns (uint256[] memory) {
        require(players[playerId].initialized, "Player not exists");
        return players[playerId].inventory;
    }
    
    /**
     * @dev 检查玩家是否拥有特定装备（内部函数）
     */
    function _hasEquipmentInInventory(uint256 playerId, uint256 equipmentId) internal view returns (bool) {
        if (!players[playerId].initialized) return false;
        
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
    function hasEquipmentInInventory(uint256 playerId, uint256 equipmentId) external view returns (bool) {
        return _hasEquipmentInInventory(playerId, equipmentId);
    }
    
    /**
     * @dev 更新宝箱时间
     */
    function updateLastTreasureBoxTime(uint256 playerId) external onlyAuthorizedOrOwner {
        GameStructs.Player storage player = players[playerId];
        require(player.initialized, "Player not exists");
        
        player.lastTreasureBoxTime = block.timestamp;
    }
    
    /**
     * @dev 添加物品到玩家NFT
     */
    function addItem(uint256 playerId, uint256 itemId, uint256 quantity) external onlyAuthorizedOrOwner {
        GameStructs.Player storage player = players[playerId];
        require(player.initialized, "Player not exists");
        
        playerItems[playerId][itemId] += quantity;
        emit ItemAdded(playerId, itemId, quantity);
    }
    
    /**
     * @dev 使用物品（减少数量）
     */
    function useItem(uint256 playerId, uint256 itemId, uint256 quantity) external {
        require(ownerOf(playerId) == msg.sender || authorizedSystems[msg.sender] || msg.sender == owner(), "Not authorized");
        require(playerItems[playerId][itemId] >= quantity, "Insufficient item quantity");
        
        playerItems[playerId][itemId] -= quantity;
        emit ItemUsed(playerId, itemId, quantity);
    }
    
    /**
     * @dev 获取玩家特定物品数量
     */
    function getPlayerItemQuantity(uint256 playerId, uint256 itemId) external view returns (uint256) {
        require(players[playerId].initialized, "Player not exists");
        return playerItems[playerId][itemId];
    }
    
    /**
     * @dev 获取玩家所有物品（返回有数量的物品）
     */
    function getPlayerItems(uint256 playerId) external view returns (uint256[] memory itemIds, uint256[] memory quantities) {
        require(players[playerId].initialized, "Player not exists");
        
        // 先计算有多少个非零物品
        uint256 count = 0;
        
        // 检查所有可能的item ID范围
        // 血瓶: 1000-1999, 转职书: 2000-2999, 宠物蛋: 3000-3999
        for (uint256 i = 1000; i < 4000; i++) {
            if (playerItems[playerId][i] > 0) {
                count++;
            }
        }
        
        // 创建结果数组
        itemIds = new uint256[](count);
        quantities = new uint256[](count);
        
        // 填充结果数组
        uint256 index = 0;
        for (uint256 i = 1000; i < 4000; i++) {
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
        require(itemId >= 1000 && itemId < 2000, "Not a health potion");
        
        GameStructs.Player storage player = players[playerId];
        require(player.initialized, "Player not exists");
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
    function _calculateHealAmount(uint256 itemId) internal pure returns (uint256) {
        // 根据itemId计算等级，然后计算治疗量
        // 假设itemId为1000+level的格式
        uint256 level = (itemId - 1000) + 1;
        if (level > 10) level = 10; // 最大等级10
        
        return 50 + (level - 1) * 25; // 基础50 + (level-1)*25
    }

    /**
     * @dev 重写supportsInterface函数
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, IERC165) returns (bool) {
        return 
            interfaceId == type(IERC1155Receiver).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}