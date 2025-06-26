// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./Player.sol";

contract FightSystem is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    enum UserType { PLAYER, NPC, PET }
    enum ActionType { ATTACK, USE_POTION, FLEE }
    enum FightStatus { ACTIVE, ENDED }
    
    struct ParticipantData {
        UserType userType;
        uint256 entityId;
        uint16 health;
        uint16 maxHealth;
        uint16 attack;
        uint16 defense;
        uint16 agility;
        uint8 criticalRate;
        uint16 criticalDamage;
    }
    
    struct Participant {
        UserType userType;
        uint256 entityId;
        uint16 health;
        uint16 maxHealth;
        uint16 originalHealth;
        uint16 attack;
        uint16 defense;
        uint16 agility;
        uint8 criticalRate;
        uint16 criticalDamage;
        uint32 nextActionTime;
        bool hasFled;
    }
    
    struct FightData {
        uint256 fightId;
        Participant[] participants;
        FightStatus status;
        uint256 startTime;
        bool potionDisabled;
        bool healthChangeDisabled;
        uint256 winner;
        uint8 sideACount;
        uint8 sideBCount;
    }
    
    mapping(uint256 => FightData) public fights;
    uint256 private _nextFightId;
    Player public playerContract;
    
    event FightStarted(uint256 indexed fightId, uint256 startTime);
    event ActionTaken(uint256 indexed fightId, UserType userType, uint256 entityId, ActionType actionType, uint256 timestamp);
    event FightEnded(uint256 indexed fightId, uint256 winner, uint256 endTime);
    event DamageDealt(uint256 indexed fightId, uint256 attacker, uint256 target, uint16 damage, bool critical);
    
    modifier onlyActiveFight(uint256 fightId) {
        require(fights[fightId].status == FightStatus.ACTIVE, "Fight not active");
        _;
    }
    
    modifier validParticipant(uint256 fightId, UserType userType, uint256 entityId) {
        require(_isValidParticipant(fightId, userType, entityId), "Invalid participant");
        _;
    }
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address _playerContract, address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        
        playerContract = Player(_playerContract);
        _nextFightId = 1;
    }
    
    function startFight(
        ParticipantData[] calldata sideA,
        ParticipantData[] calldata sideB,
        bool potionDisabled,
        bool healthChangeDisabled
    ) external returns (uint256) {
        require(sideA.length > 0, "Need at least one participant in side A");
        require(sideA.length <= 20, "Too many participants in side A");
        require(sideB.length > 0, "Need at least one participant in side B");
        require(sideB.length <= 20, "Too many participants in side B");
        
        uint256 fightId = _nextFightId++;
        FightData storage fight = fights[fightId];
        
        fight.fightId = fightId;
        fight.status = FightStatus.ACTIVE;
        fight.startTime = block.timestamp;
        fight.potionDisabled = potionDisabled;
        fight.healthChangeDisabled = healthChangeDisabled;
        fight.sideACount = uint8(sideA.length);
        fight.sideBCount = uint8(sideB.length);
        
        _initializeParticipants(fightId, sideA, sideB, healthChangeDisabled);
        
        emit FightStarted(fightId, block.timestamp);
        return fightId;
    }
    
    function takeAction(
        uint256 fightId,
        UserType userType,
        uint256 entityId,
        ActionType actionType
    ) external onlyActiveFight(fightId) validParticipant(fightId, userType, entityId) {
        FightData storage fight = fights[fightId];
        
        uint256 participantIndex = _findParticipantIndex(fightId, userType, entityId);
        Participant storage participant = fight.participants[participantIndex];
        
        require(block.timestamp >= participant.nextActionTime, "Action not ready");
        require(participant.health > 0, "Participant is dead");
        require(!participant.hasFled, "Participant has fled");
        
        if (actionType == ActionType.ATTACK) {
            _performAttack(fightId, participantIndex);
        } else if (actionType == ActionType.USE_POTION) {
            require(!fight.potionDisabled, "Potions disabled");
            _usePotion(fightId, participantIndex);
        } else if (actionType == ActionType.FLEE) {
            _flee(fightId, participantIndex);
        }
        
        uint32 actionInterval = _calculateActionInterval(participant.agility);
        participant.nextActionTime = uint32(block.timestamp) + actionInterval;
        
        emit ActionTaken(fightId, userType, entityId, actionType, block.timestamp);
        
        _checkFightEnd(fightId);
    }
    
    function _initializeParticipants(
        uint256 fightId,
        ParticipantData[] calldata sideA,
        ParticipantData[] calldata sideB,
        bool healthChangeDisabled
    ) internal {
        FightData storage fight = fights[fightId];
        
        _addParticipants(fight, sideA, healthChangeDisabled);
        _addParticipants(fight, sideB, healthChangeDisabled);
    }
    
    function _addParticipants(
        FightData storage fight,
        ParticipantData[] calldata participants,
        bool healthChangeDisabled
    ) internal {
        for (uint256 i = 0; i < participants.length; i++) {
            ParticipantData memory data = participants[i];
            require(data.userType != UserType.PET, "PET type not supported yet");
            
            uint16 health = healthChangeDisabled ? data.maxHealth : data.health;
            uint16 originalHealth = 0;
            
            // Store original health for PLAYER entities only when health changes are enabled
            if (data.userType == UserType.PLAYER && !healthChangeDisabled) {
                Player.PlayerData memory playerData = playerContract.getPlayer(data.entityId);
                originalHealth = playerData.health;
            }
            
            uint32 actionInterval = _calculateActionInterval(data.agility);
            
            fight.participants.push(Participant({
                userType: data.userType,
                entityId: data.entityId,
                health: health,
                maxHealth: data.maxHealth,
                originalHealth: originalHealth,
                attack: data.attack,
                defense: data.defense,
                agility: data.agility,
                criticalRate: data.criticalRate,
                criticalDamage: data.criticalDamage,
                nextActionTime: uint32(block.timestamp) + actionInterval,
                hasFled: false
            }));
        }
    }
    
    //时间为1-10s。敏捷度提高10，行动cd减少1s。敏捷90就到最大
    function _calculateActionInterval(uint16 agility) internal pure returns (uint32) {
        if (agility == 0) return 10;
        uint32 baseInterval = 10;
        uint32 interval = baseInterval - (agility / 10);
        return interval > 1 ? interval : 1;
    }
    
    function _performAttack(uint256 fightId, uint256 attackerIndex) internal {
        FightData storage fight = fights[fightId];
        Participant storage attacker = fight.participants[attackerIndex];
        
        uint256 targetIndex = _findRandomTarget(fightId, attackerIndex);
        if (targetIndex == type(uint256).max) return;
        
        Participant storage target = fight.participants[targetIndex];
        
        uint16 damage = _calculateDamage(attacker, target);
        bool critical = _isCritical(attacker.criticalRate);
        
        if (critical) {
            damage = (damage * attacker.criticalDamage) / 100;
        }
        
        if (damage > target.health) {
            target.health = 0;
        } else {
            target.health -= damage;
        }
        
        emit DamageDealt(fightId, attacker.entityId, target.entityId, damage, critical);
    }
    
    function _usePotion(uint256 fightId, uint256 participantIndex) internal {
        FightData storage fight = fights[fightId];
        Participant storage participant = fight.participants[participantIndex];
        
        if (participant.userType == UserType.PLAYER) {
            uint256 potionItemId = 100;
            uint256 potionCount = playerContract.getPlayerItemQuantity(participant.entityId, potionItemId);
            require(potionCount > 0, "No potions available");
            
            uint256 healAmount = 50;
            uint16 newHealth = participant.health + uint16(healAmount);
            if (newHealth > participant.maxHealth) {
                newHealth = participant.maxHealth;
            }
            participant.health = newHealth;
            
            playerContract.useItem(participant.entityId, potionItemId, 1);
        }
    }
    
    function _flee(uint256 fightId, uint256 participantIndex) internal {
        FightData storage fight = fights[fightId];
        Participant storage participant = fight.participants[participantIndex];
        
        participant.hasFled = true;
        _endFight(fightId, 0); // 0 indicates flee/draw
    }
    
    //简化版攻击伤害，需要优化
    function _calculateDamage(Participant storage attacker, Participant storage target) internal view returns (uint16) {
        uint16 baseDamage = attacker.attack;
        uint16 defense = target.defense;
        
        if (baseDamage <= defense) {
            return 1;
        }
        
        return baseDamage - defense;
    }
    
    function _isCritical(uint8 criticalRate) internal view returns (bool) {
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % 100;
        return random < criticalRate;
    }
    
    function _findRandomTarget(uint256 fightId, uint256 attackerIndex) internal view returns (uint256) {
        FightData storage fight = fights[fightId];
        uint256[] memory validTargets = new uint256[](fight.participants.length);
        uint256 count = 0;
        
        bool attackerInSideA = attackerIndex < fight.sideACount;
        
        for (uint256 i = 0; i < fight.participants.length; i++) {
            bool targetInSideA = i < fight.sideACount;
            // Can only attack participants from the opposite side
            if (attackerInSideA != targetInSideA && fight.participants[i].health > 0 && !fight.participants[i].hasFled) {
                validTargets[count] = i;
                count++;
            }
        }
        
        if (count == 0) return type(uint256).max;
        
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % count;
        return validTargets[randomIndex];
    }
    
    function _checkFightEnd(uint256 fightId) internal {
        FightData storage fight = fights[fightId];
        
        bool sideAAlive = false;
        bool sideBAlive = false;
        
        for (uint256 i = 0; i < fight.participants.length; i++) {
            if (fight.participants[i].health > 0 && !fight.participants[i].hasFled) {
                if (i < fight.sideACount) {
                    sideAAlive = true;
                } else {
                    sideBAlive = true;
                }
            }
        }
        
        if (!sideAAlive) {
            _endFight(fightId, 2); // Side B wins
        } else if (!sideBAlive) {
            _endFight(fightId, 1); // Side A wins
        }
    }
    
    function _endFight(uint256 fightId, uint256 winner) internal {
        FightData storage fight = fights[fightId];
        fight.status = FightStatus.ENDED;
        fight.winner = winner;
        
        if (!fight.healthChangeDisabled) {
            for (uint256 i = 0; i < fight.participants.length; i++) {
                if (fight.participants[i].userType == UserType.PLAYER) {
                    uint256 entityId = fight.participants[i].entityId;
                    uint16 newHealth = fight.participants[i].health;
                    uint16 originalHealth = fight.participants[i].originalHealth;
                    
                    if (newHealth != originalHealth) {
                        if (newHealth > originalHealth) {
                            playerContract.heal(entityId, newHealth - originalHealth);
                        } else {
                            uint16 damage = originalHealth - newHealth;
                            if (damage >= originalHealth) {
                                playerContract.heal(entityId, originalHealth - 1);
                            } else {
                                playerContract.heal(entityId, originalHealth - damage);
                            }
                        }
                    }
                }
            }
        }
        
        emit FightEnded(fightId, winner, block.timestamp);
    }
    
    function _findParticipantIndex(uint256 fightId, UserType userType, uint256 entityId) internal view returns (uint256) {
        FightData storage fight = fights[fightId];
        for (uint256 i = 0; i < fight.participants.length; i++) {
            if (fight.participants[i].userType == userType && fight.participants[i].entityId == entityId) {
                return i;
            }
        }
        revert("Participant not found");
    }
    
    function _isValidParticipant(uint256 fightId, UserType userType, uint256 entityId) internal view returns (bool) {
        FightData storage fight = fights[fightId];
        for (uint256 i = 0; i < fight.participants.length; i++) {
            if (fight.participants[i].userType == userType && fight.participants[i].entityId == entityId) {
                return true;
            }
        }
        return false;
    }
    
    function getFightData(uint256 fightId) external view returns (
        uint256 id,
        FightStatus status,
        uint256 startTime,
        bool potionDisabled,
        bool healthChangeDisabled,
        uint256 winner,
        uint256 participantCount
    ) {
        FightData storage fight = fights[fightId];
        return (
            fight.fightId,
            fight.status,
            fight.startTime,
            fight.potionDisabled,
            fight.healthChangeDisabled,
            fight.winner,
            fight.participants.length
        );
    }
    
    function getFightParticipant(uint256 fightId, uint256 index) external view returns (
        UserType userType,
        uint256 entityId,
        uint16 health,
        uint16 maxHealth,
        uint16 originalHealth,
        uint16 attack,
        uint16 defense,
        uint16 agility,
        uint8 criticalRate,
        uint16 criticalDamage,
        uint32 nextActionTime,
        bool hasFled
    ) {
        require(index < fights[fightId].participants.length, "Invalid index");
        Participant storage participant = fights[fightId].participants[index];
        return (
            participant.userType,
            participant.entityId,
            participant.health,
            participant.maxHealth,
            participant.originalHealth,
            participant.attack,
            participant.defense,
            participant.agility,
            participant.criticalRate,
            participant.criticalDamage,
            participant.nextActionTime,
            participant.hasFled
        );
    }
    
    function canTakeAction(uint256 fightId, UserType userType, uint256 entityId) external view returns (bool) {
        if (fights[fightId].status != FightStatus.ACTIVE) return false;
        
        uint256 participantIndex = _findParticipantIndex(fightId, userType, entityId);
        Participant storage participant = fights[fightId].participants[participantIndex];
        
        return block.timestamp >= participant.nextActionTime && participant.health > 0 && !participant.hasFled;
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}