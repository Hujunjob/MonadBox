// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./Player.sol";
import "./Item.sol";
import "hardhat/console.sol";
/**
 * @title FightSystem
 * @dev 回合制战斗系统合约 - 处理玩家与NPC/玩家之间的回合制战斗
 */
contract FightSystem is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    Player public playerNFT;
    Item public itemNFT;
    
    // 战斗配置
    struct BattleConfig {
        bool canUsePotion;          // 是否能使用血瓶
        bool changePlayerHealth;    // 是否战斗后改变玩家血量
        bool canEscape;             // 是否可以逃跑
    }
    
    // 战斗者数据
    struct Fighter {
        uint256 id;
        uint8 fighterType;          // 1: player, 2: npc
        uint16 health;
        uint16 maxHealth;
        uint16 attack;
        uint16 defense;
        uint16 agility;
        uint8 criticalRate;
        uint16 criticalDamage;
        uint256[] potionCount;        // 10个等级的血瓶数量
        uint8 potionsUsed;            // 战斗中已使用的血瓶数量
    }
    
    // 战斗行动类型
    enum ActionType {
        ATTACK,
        USE_POTION,
        ESCAPE
    }
    
    // 战斗行动记录
    struct BattleAction {
        uint256 actorId;
        uint8 actorType;
        ActionType action;
        uint16 damage;
        uint16 healing;
        uint16 remainingHealth;
        bool isCritical;
        uint256 usedPotionId;       // 使用的血瓶ID
    }
    
    // 战斗结果
    struct BattleResult {
        uint256 winnerId;
        uint8 winnerType;
        uint256 loserId;
        uint8 loserType;
        bool escaped;
        uint256 totalRounds;
        BattleAction[] battleLog;
    }
    
    // 战斗状态
    mapping(bytes32 => BattleResult) public battleResults;
    
    // 常量
    uint8 public constant FIGHTER_TYPE_PLAYER = 1;
    uint8 public constant FIGHTER_TYPE_NPC = 2;

    uint8 public constant LOW_HEALTH_THRESHOLD = 30; // 30%
    uint8 public constant MAX_POTIONS_PER_BATTLE = 4; // 每场战斗最多使用3瓶血
    
    // 授权的系统合约
    mapping(address => bool) public authorizedSystems;
    
    // 修饰符：只有授权的系统或owner可以调用
    modifier onlyAuthorizedOrOwner() {
        require(authorizedSystems[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    // 事件
    event BattleStarted(
        bytes32 indexed battleId,
        uint256 fighter1Id,
        uint8 fighter1Type,
        uint16 fighter1Health,
        uint16 fighter1MaxHealth,
        uint16 fighter1Attack,
        uint16 fighter1Defense,
        uint16 fighter1Agility,
        uint8 fighter1CriticalRate,
        uint16 fighter1CriticalDamage,
        uint256 fighter2Id,
        uint8 fighter2Type,
        uint16 fighter2Health,
        uint16 fighter2MaxHealth,
        uint16 fighter2Attack,
        uint16 fighter2Defense,
        uint16 fighter2Agility,
        uint8 fighter2CriticalRate,
        uint16 fighter2CriticalDamage
    );
    event BattleEnded(bytes32 indexed battleId, uint256 winnerId, uint8 winnerType, bool escaped, uint256 totalRounds);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address _playerNFT, address _itemNFT, address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        
        playerNFT = Player(_playerNFT);
        itemNFT = Item(_itemNFT);
    }
    
    /**
     * @dev 开始战斗
     * @param fighter1Id 战斗者1的ID
     * @param fighter1Type 战斗者1的类型 (1: player, 2: npc)
     * @param fighter1Stats 战斗者1的属性 [health, maxHealth, attack, defense, agility, criticalRate, criticalDamage]
     * @param fighter2Id 战斗者2的ID
     * @param fighter2Type 战斗者2的类型 (1: player, 2: npc)
     * @param fighter2Stats 战斗者2的属性 [health, maxHealth, attack, defense, agility, criticalRate, criticalDamage]
     * @param config 战斗配置
     * @return battleId 战斗ID
     */
    function startBattle(
        uint256 fighter1Id,
        uint8 fighter1Type,
        uint16[7] memory fighter1Stats,
        uint256 fighter2Id,
        uint8 fighter2Type,
        uint16[7] memory fighter2Stats,
        BattleConfig memory config
    ) external onlyAuthorizedOrOwner returns (bytes32 battleId) {
        require(fighter1Type == FIGHTER_TYPE_PLAYER || fighter1Type == FIGHTER_TYPE_NPC, "Invalid fighter1 type");
        require(fighter2Type == FIGHTER_TYPE_PLAYER || fighter2Type == FIGHTER_TYPE_NPC, "Invalid fighter2 type");
        require(fighter1Stats[0] > 0 && fighter2Stats[0] > 0, "Fighters must have health");
        
        // 生成战斗ID
        battleId = keccak256(abi.encodePacked(block.timestamp, msg.sender, fighter1Id, fighter2Id));
        
        // 发出战斗开始事件
        emit BattleStarted(
            battleId,
            fighter1Id,
            fighter1Type,
            config.changePlayerHealth && fighter1Type == FIGHTER_TYPE_PLAYER ? 
                _getCurrentHealth(fighter1Id) : fighter1Stats[0],
            fighter1Stats[1], // maxHealth
            fighter1Stats[2], // attack
            fighter1Stats[3], // defense
            fighter1Stats[4], // agility
            uint8(fighter1Stats[5]), // criticalRate
            fighter1Stats[6], // criticalDamage
            fighter2Id,
            fighter2Type,
            config.changePlayerHealth && fighter2Type == FIGHTER_TYPE_PLAYER ? 
                _getCurrentHealth(fighter2Id) : fighter2Stats[0],
            fighter2Stats[1], // maxHealth
            fighter2Stats[2], // attack
            fighter2Stats[3], // defense
            fighter2Stats[4], // agility
            uint8(fighter2Stats[5]), // criticalRate
            fighter2Stats[6]  // criticalDamage
        );
        
        // 创建战斗者
        Fighter memory fighter1 = Fighter({
            id: fighter1Id,
            fighterType: fighter1Type,
            health: config.changePlayerHealth && fighter1Type == FIGHTER_TYPE_PLAYER ? 
                _getCurrentHealth(fighter1Id) : fighter1Stats[0],
            maxHealth: fighter1Stats[1],
            attack: fighter1Stats[2],
            defense: fighter1Stats[3],
            agility: fighter1Stats[4],
            criticalRate: uint8(fighter1Stats[5]),
            criticalDamage: fighter1Stats[6],
            potionCount: config.canUsePotion && fighter1Type == FIGHTER_TYPE_PLAYER ? 
                _getPotionCount(fighter1Id) : new uint256[](0),
            potionsUsed: 0
        });
        
        Fighter memory fighter2 = Fighter({
            id: fighter2Id,
            fighterType: fighter2Type,
            health: config.changePlayerHealth && fighter2Type == FIGHTER_TYPE_PLAYER ? 
                _getCurrentHealth(fighter2Id) : fighter2Stats[0],
            maxHealth: fighter2Stats[1],
            attack: fighter2Stats[2],
            defense: fighter2Stats[3],
            agility: fighter2Stats[4],
            criticalRate: uint8(fighter2Stats[5]),
            criticalDamage: fighter2Stats[6],
            potionCount: config.canUsePotion && fighter2Type == FIGHTER_TYPE_PLAYER ? 
                _getPotionCount(fighter2Id) : new uint256[](0),
            potionsUsed: 0
        });
        console.log("startBattle ",fighter1.health,fighter2.health);
        // 执行战斗
        BattleResult memory result = _executeBattle(battleId, fighter1, fighter2, config);
        
        // 保存战斗结果
        battleResults[battleId] = result;
        
        // FightSystem只模拟战斗，不实际改变玩家状态
        // 血瓶消耗和血量改变由调用方（BattleSystem/Rank）处理
        
        // emit BattleStarted(battleId, fighter1Id, fighter1Type, fighter2Id, fighter2Type);
        emit BattleEnded(battleId, result.winnerId, result.winnerType, result.escaped, result.totalRounds);
        
        return battleId;
    }
    
    /**
     * @dev 执行战斗逻辑
     */
    function _executeBattle(
        bytes32 battleId,
        Fighter memory fighter1,
        Fighter memory fighter2,
        BattleConfig memory config
    ) internal returns (BattleResult memory) {
        BattleAction[] memory tempLog = new BattleAction[](200); // 临时存储，最多200轮
        uint256 logIndex = 0;
        uint256 rounds = 0;
        
        // 确定先手顺序（敏捷度高的先攻击）
        bool fighter1First = fighter1.agility >= fighter2.agility;
        
        while (fighter1.health > 0 && fighter2.health > 0 && rounds < 100) {
            console.log("_executeBattle round,health 1,2",rounds,fighter1.health,fighter2.health);
            rounds++;
            
            // 回合开始
            Fighter memory attacker = fighter1First ? fighter1 : fighter2;
            Fighter memory defender = fighter1First ? fighter2 : fighter1;
            
            // 执行攻击者行动
            BattleAction memory action = _executeAction(attacker, defender, config);
            tempLog[logIndex] = action;
            logIndex++;
            
            // 更新战斗者状态
            if (fighter1First) {
                fighter1 = attacker;
                fighter2 = defender;
            } else {
                fighter1 = defender;
                fighter2 = attacker;
            }
            
            // emit ActionPerformed(battleId, action.actorId, action.actorType, action.action, action.damage, action.healing);
            
            // 检查逃跑
            if (action.action == ActionType.ESCAPE) {
                break;
            }
            
            // 检查战斗结束
            if (defender.health == 0) {
                break;
            }
            
            // 切换攻击顺序
            fighter1First = !fighter1First;
        }
        
        // 确定胜利者
        uint256 winnerId;
        uint8 winnerType;
        uint256 loserId;
        uint8 loserType;
        bool escaped = false;
        
        if (fighter1.health == 0) {
            winnerId = fighter2.id;
            winnerType = fighter2.fighterType;
            loserId = fighter1.id;
            loserType = fighter1.fighterType;
        } else if (fighter2.health == 0) {
            winnerId = fighter1.id;
            winnerType = fighter1.fighterType;
            loserId = fighter2.id;
            loserType = fighter2.fighterType;
        } else {
            // 逃跑或达到最大回合数
            escaped = true;
            winnerId = fighter2.id;
            winnerType = fighter2.fighterType;
            loserId = fighter1.id;
            loserType = fighter1.fighterType;
        }
        
        // 复制战斗日志到结果
        BattleAction[] memory finalLog = new BattleAction[](logIndex);
        for (uint256 i = 0; i < logIndex; i++) {
            finalLog[i] = tempLog[i];
        }
        
        return BattleResult({
            winnerId: winnerId,
            winnerType: winnerType,
            loserId:loserId,
            loserType:loserType,
            escaped: escaped,
            totalRounds: rounds,
            battleLog: finalLog
        });
    }
    
    /**
     * @dev 执行战斗者行动
     */
    function _executeAction(
        Fighter memory attacker,
        Fighter memory defender,
        BattleConfig memory config
    ) internal view returns (BattleAction memory) {
        // 判断行动类型
        ActionType actionType = _determineAction(attacker, config);
        
        BattleAction memory action = BattleAction({
            actorId: attacker.id,
            actorType: attacker.fighterType,
            action: actionType,
            damage: 0,
            healing: 0,
            remainingHealth: attacker.health,
            isCritical: false,
            usedPotionId: 0
        });
        
        if (actionType == ActionType.ATTACK) {
            // 执行攻击
            (uint16 damage, bool isCritical) = _calculateDamage(attacker, defender);
            defender.health = damage >= defender.health ? 0 : defender.health - damage;
            
            action.damage = damage;
            action.isCritical = isCritical;
            
        } else if (actionType == ActionType.USE_POTION) {
            // 使用血瓶，从最低级的开始使用
            (uint256 potionId, uint16 healing) = _useLowestPotion(attacker);
            
            if (attacker.health + healing > attacker.maxHealth) {
                healing = attacker.maxHealth - attacker.health;
            }
            attacker.health += healing;
            
            action.healing = healing;
            action.remainingHealth = attacker.health;
            action.usedPotionId = potionId;
        }
        
        return action;
    }
    
    /**
     * @dev 确定战斗者行动
     */
    function _determineAction(Fighter memory fighter, BattleConfig memory config) internal pure returns (ActionType) {
        uint16 lowHealthThreshold = (fighter.maxHealth * LOW_HEALTH_THRESHOLD) / 100;
        
        // 血量低于30%时的逻辑
        if (fighter.health <= lowHealthThreshold) {
            // 优先使用血瓶（检查是否还能使用血瓶）
            if (config.canUsePotion && _hasPotions(fighter) && fighter.potionsUsed < MAX_POTIONS_PER_BATTLE) {
                return ActionType.USE_POTION;
            }
            // 没有血瓶或已达到使用上限且可以逃跑 - 但只有玩家能逃跑，NPC不能逃跑
            if (config.canEscape && fighter.fighterType == FIGHTER_TYPE_PLAYER) {
                return ActionType.ESCAPE;
            }
        }
        
        // 默认攻击
        return ActionType.ATTACK;
    }
    
    /**
     * @dev 计算伤害
     */
    function _calculateDamage(Fighter memory attacker, Fighter memory defender) internal view returns (uint16 damage, bool isCritical) {
        // 基础伤害 = 攻击力 - 防御力
        uint16 baseDamage = attacker.attack > defender.defense ? 
            attacker.attack - defender.defense : 1;
        baseDamage = 4 * baseDamage;
        // 随机伤害 (80%-120%)
        uint256 randomFactor = 80 + (uint256(keccak256(abi.encodePacked(attacker.id, defender.id, block.timestamp))) % 41);
        baseDamage = uint16((baseDamage * randomFactor) / 100);
        
        // 暴击判定
        uint256 critRoll = uint256(keccak256(abi.encodePacked(attacker.id, block.timestamp))) % 100;
        isCritical = critRoll < attacker.criticalRate;
        
        if (isCritical) {
            damage = uint16((baseDamage * attacker.criticalDamage) / 100);
        } else {
            damage = baseDamage;
        }
    }
    
    /**
     * @dev 获取玩家当前血量
     */
    function _getCurrentHealth(uint256 playerId) internal view returns (uint16) {
        Player.PlayerData memory playerData = playerNFT.getPlayer(playerId);
        return playerData.health;
    }
    
    /**
     * @dev 获取玩家血瓶数量
     */
    function _getPotionCount(uint256 playerId) internal view returns (uint256[] memory) {
        uint256 potionTypeCount = itemNFT.HEALTH_POTION_END_ID() - itemNFT.HEALTH_POTION_START_ID();
        uint256[] memory potions = new uint256[](potionTypeCount);
        
        for (uint256 i = 0; i < potionTypeCount; i++) {
            uint256 potionId = itemNFT.HEALTH_POTION_START_ID() + i;
            potions[i] = playerNFT.getPlayerItemQuantity(playerId, potionId);
        }
        
        return potions;
    }
    
    /**
     * @dev 检查是否有血瓶
     */
    function _hasPotions(Fighter memory fighter) internal pure returns (bool) {
        for (uint256 i = 0; i < fighter.potionCount.length; i++) {
            if (fighter.potionCount[i] > 0) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev 使用最低级的血瓶
     */
    function _useLowestPotion(Fighter memory fighter) internal view returns (uint256 potionId, uint16 healing) {
        // 从最低级开始找有数量的血瓶
        for (uint256 i = 0; i < fighter.potionCount.length; i++) {
            if (fighter.potionCount[i] > 0) {
                potionId = itemNFT.HEALTH_POTION_START_ID() + i;
                // 计算血瓶恢复量：基础恢复量 + 等级 * 每级恢复量
                uint256 level = i + 1; // 等级从1开始
                healing = uint16(itemNFT.BASE_HEAL_AMOUNT() + (level - 1) * itemNFT.HEAL_AMOUNT_PER_LEVEL());
                fighter.potionCount[i]--; // 消耗血瓶
                fighter.potionsUsed++; // 增加已使用血瓶计数
                return (potionId, healing);
            }
        }
        return (0, 0);
    }
    
    
    /**
     * @dev 获取战斗结果
     */
    function getBattleResult(bytes32 battleId) external view returns (BattleResult memory) {
        return battleResults[battleId];
    }
    
    /**
     * @dev 获取战斗日志
     */
    function getBattleLog(bytes32 battleId) external view returns (BattleAction[] memory) {
        return battleResults[battleId].battleLog;
    }
    
    /**
     * @dev 更新Player NFT合约地址
     */
    function updatePlayerNFT(address _playerNFT) external onlyOwner {
        playerNFT = Player(_playerNFT);
    }
    
    /**
     * @dev 更新Item NFT合约地址
     */
    function updateItemNFT(address _itemNFT) external onlyOwner {
        itemNFT = Item(_itemNFT);
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
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}