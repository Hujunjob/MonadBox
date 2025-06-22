// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// 游戏金币代币
contract AdventureGold is ERC20, Ownable {
    constructor() ERC20("Adventure Gold", "GOLD") Ownable(msg.sender) {}
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

// 装备 NFT
contract Equipment is ERC721, Ownable {
    uint256 private _tokenIds;
    
    struct EquipmentData {
        uint8 equipmentType; // 0=helmet, 1=armor, 2=shoes, 3=weapon, 4=shield, 5=accessory, 6=ring, 7=pet
        uint8 level;
        uint8 stars;
        uint8 rarity; // 0=common, 1=uncommon, 2=rare, 3=epic, 4=legendary
        uint16 attack;
        uint16 defense;
        uint16 agility;
        uint8 criticalRate;
        uint16 criticalDamage;
        string name;
    }
    
    mapping(uint256 => EquipmentData) public equipmentData;
    
    constructor() ERC721("Adventure Equipment", "EQUIP") Ownable(msg.sender) {}
    
    function mintEquipment(
        address to,
        uint8 equipmentType,
        uint8 level,
        uint8 stars,
        uint8 rarity,
        uint16 attack,
        uint16 defense,
        uint16 agility,
        uint8 criticalRate,
        uint16 criticalDamage,
        string memory name
    ) external onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(to, newTokenId);
        
        equipmentData[newTokenId] = EquipmentData({
            equipmentType: equipmentType,
            level: level,
            stars: stars,
            rarity: rarity,
            attack: attack,
            defense: defense,
            agility: agility,
            criticalRate: criticalRate,
            criticalDamage: criticalDamage,
            name: name
        });
        
        return newTokenId;
    }
}

// 主游戏合约
contract TreasureAdventure is Ownable {
    AdventureGold public goldToken;
    Equipment public equipmentNFT;
    
    struct Player {
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
        uint32 lastTreasureBoxTime;
        bool initialized;
        uint8 job; // 0=swordsman, 1=great_swordsman, etc.
    }
    
    struct EquippedItems {
        uint256 helmet;
        uint256 armor;
        uint256 shoes;
        uint256 weapon;
        uint256 shield;
        uint256 accessory;
        uint256 ring;
        uint256 pet;
    }
    
    mapping(address => Player) public players;
    mapping(address => EquippedItems) public equippedItems;
    mapping(address => uint256[]) public playerTreasureBoxes;
    
    // 游戏配置
    uint8 public constant MAX_STAMINA = 24;
    uint32 public constant STAMINA_RECOVERY_INTERVAL = 3600; // 1 hour
    uint32 public constant TREASURE_BOX_INTERVAL = 3600; // 1 hour
    uint8 public constant MAX_OFFLINE_BOXES = 100;
    
    event PlayerRegistered(address indexed player, string name);
    event BattleCompleted(address indexed player, uint16 experience, uint256 gold);
    event LevelUp(address indexed player, uint16 newLevel);
    event EquipmentEquipped(address indexed player, uint256 tokenId, uint8 slot);
    event TreasureBoxOpened(address indexed player, uint256[] rewards);
    
    constructor() Ownable(msg.sender) {
        goldToken = new AdventureGold();
        equipmentNFT = new Equipment();
    }
    
    // 玩家注册
    function registerPlayer(string memory name) external {
        require(!players[msg.sender].initialized, "Player already registered");
        require(bytes(name).length >= 2 && bytes(name).length <= 20, "Invalid name length");
        
        players[msg.sender] = Player({
            name: name,
            level: 1,
            experience: 0,
            health: 100,
            maxHealth: 100,
            attack: 15,
            defense: 5,
            agility: 10,
            criticalRate: 5,
            criticalDamage: 150,
            stamina: MAX_STAMINA,
            maxStamina: MAX_STAMINA,
            lastStaminaTime: uint32(block.timestamp),
            currentForestLevel: 1,
            currentForestProgress: 0,
            lastTreasureBoxTime: uint32(block.timestamp),
            initialized: true,
            job: 0
        });
        
        // 给新玩家100金币
        goldToken.mint(msg.sender, 100 * 10**18);
        
        emit PlayerRegistered(msg.sender, name);
    }
    
    // 更新体力
    function updateStamina() public {
        Player storage player = players[msg.sender];
        require(player.initialized, "Player not registered");
        
        uint32 timeSinceLastUpdate = uint32(block.timestamp) - player.lastStaminaTime;
        uint8 staminaToRecover = uint8(timeSinceLastUpdate / STAMINA_RECOVERY_INTERVAL);
        
        if (staminaToRecover > 0 && player.stamina < player.maxStamina) {
            uint8 actualRecovery = staminaToRecover;
            if (player.stamina + actualRecovery > player.maxStamina) {
                actualRecovery = player.maxStamina - player.stamina;
            }
            
            player.stamina += actualRecovery;
            player.lastStaminaTime += actualRecovery * STAMINA_RECOVERY_INTERVAL;
        }
    }
    
    // 战斗（简化版，实际战斗在链下计算）
    function completeBattle(
        uint16 experienceGained,
        uint256 goldGained,
        uint8 staminaCost
    ) external {
        Player storage player = players[msg.sender];
        require(player.initialized, "Player not registered");
        require(player.stamina >= staminaCost, "Not enough stamina");
        
        // 消耗体力
        player.stamina -= staminaCost;
        player.lastStaminaTime = uint32(block.timestamp);
        
        // 获得经验和金币
        player.experience += experienceGained;
        goldToken.mint(msg.sender, goldGained * 10**18);
        
        // 检查升级
        uint16 expNeeded = player.level * 100;
        if (player.experience >= expNeeded) {
            player.level++;
            player.experience -= expNeeded;
            
            // 升级属性提升
            player.maxHealth += 10;
            player.health = player.maxHealth; // 升级时满血
            player.attack += 2;
            player.defense += 1;
            player.agility += 1;
            
            emit LevelUp(msg.sender, player.level);
        }
        
        emit BattleCompleted(msg.sender, experienceGained, goldGained);
    }
    
    // 装备道具
    function equipItem(uint256 tokenId, uint8 slot) external {
        require(equipmentNFT.ownerOf(tokenId) == msg.sender, "Not your equipment");
        require(slot < 8, "Invalid slot");
        
        EquippedItems storage equipped = equippedItems[msg.sender];
        
        // 卸下当前装备的道具
        if (slot == 0 && equipped.helmet != 0) {
            equipped.helmet = 0;
        } else if (slot == 1 && equipped.armor != 0) {
            equipped.armor = 0;
        } else if (slot == 2 && equipped.shoes != 0) {
            equipped.shoes = 0;
        } else if (slot == 3 && equipped.weapon != 0) {
            equipped.weapon = 0;
        } else if (slot == 4 && equipped.shield != 0) {
            equipped.shield = 0;
        } else if (slot == 5 && equipped.accessory != 0) {
            equipped.accessory = 0;
        } else if (slot == 6 && equipped.ring != 0) {
            equipped.ring = 0;
        } else if (slot == 7 && equipped.pet != 0) {
            equipped.pet = 0;
        }
        
        // 装备新道具
        if (slot == 0) equipped.helmet = tokenId;
        else if (slot == 1) equipped.armor = tokenId;
        else if (slot == 2) equipped.shoes = tokenId;
        else if (slot == 3) equipped.weapon = tokenId;
        else if (slot == 4) equipped.shield = tokenId;
        else if (slot == 5) equipped.accessory = tokenId;
        else if (slot == 6) equipped.ring = tokenId;
        else if (slot == 7) equipped.pet = tokenId;
        
        emit EquipmentEquipped(msg.sender, tokenId, slot);
    }
    
    // 领取宝箱
    function claimTreasureBoxes() external returns (uint8) {
        Player storage player = players[msg.sender];
        require(player.initialized, "Player not registered");
        
        uint32 timeSinceLastBox = uint32(block.timestamp) - player.lastTreasureBoxTime;
        uint8 boxesToClaim = uint8(timeSinceLastBox / TREASURE_BOX_INTERVAL);
        
        if (boxesToClaim > MAX_OFFLINE_BOXES) {
            boxesToClaim = MAX_OFFLINE_BOXES;
        }
        
        if (boxesToClaim > 0) {
            player.lastTreasureBoxTime = uint32(block.timestamp);
            
            // 为简化，直接给金币奖励 - 防止溢出
            uint256 goldReward = uint256(boxesToClaim) * 50 * 10**18;
            goldToken.mint(msg.sender, goldReward);
        }
        
        return boxesToClaim;
    }
    
    // 获取玩家数据
    function getPlayer(address playerAddress) external view returns (Player memory) {
        return players[playerAddress];
    }
    
    // 获取装备数据
    function getEquippedItems(address playerAddress) external view returns (EquippedItems memory) {
        return equippedItems[playerAddress];
    }
    
    // 获取金币余额
    function getGoldBalance(address playerAddress) external view returns (uint256) {
        return goldToken.balanceOf(playerAddress);
    }
}