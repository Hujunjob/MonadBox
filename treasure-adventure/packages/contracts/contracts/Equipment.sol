// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "hardhat/console.sol";
/**
 * @title Equipment
 * @dev 宝物冒险游戏的装备 NFT (ERC721)
 */
contract Equipment is Initializable, ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721BurnableUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    uint256 private _tokenIds;

    struct EquipmentData {
        uint8 equipmentType; //1=armor, 2=shoes, 3=weapon, 4=shield, 5=accessory, 6=ring， 7=helmet
        uint8 level;
        uint8 stars;
        uint8 rarity; // 0=common, 1=uncommon, 2=rare, 3=epic, 4=legendary
        uint16 attack;
        uint16 defense;
        uint16 agility;
        uint8 criticalRate;
        uint16 criticalDamage;
    }

    // 授权的系统合约
    mapping(address => bool) public authorizedSystems;
    
    // 修饰符：只有授权的系统或owner可以调用
    modifier onlyAuthorizedOrOwner() {
        require(authorizedSystems[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    mapping(uint256 => EquipmentData) public equipmentData;

    event EquipmentMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint8 equipmentType,
        uint8 rarity
    );
    event EquipmentUpdated(
        uint256 indexed tokenId,
        uint8 stars,
        uint16 attack,
        uint16 defense,
        uint16 agility
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address initialOwner) public initializer {
        __ERC721_init("Adventure Equipment", "EQUIP");
        __ERC721Enumerable_init();
        __ERC721Burnable_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    /**
     * @dev 铸造装备 NFT
     * @param to 接收地址
     * @param equipmentType 装备类型
     * @param level 装备等级
     * @param stars 星级
     * @param rarity 稀有度
     * @param attack 攻击力
     * @param defense 防御力
     * @param agility 敏捷
     * @param criticalRate 暴击率
     * @param criticalDamage 暴击伤害
     * @return 新装备的 tokenId
     */
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
        uint16 criticalDamage
    ) external onlyAuthorizedOrOwner returns (uint256) {
        console.log("mintEquipment");
        // require(equipmentType < 8, "Invalid equipment type");
        // require(rarity < 5, "Invalid rarity");
        // require(stars <= 5, "Invalid stars");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        console.log("mintEquipment 1",to,newTokenId);
        _safeMint(to, newTokenId);
        console.log("mintEquipment 2");
        equipmentData[newTokenId] = EquipmentData({
            equipmentType: equipmentType,
            level: level,
            stars: stars,
            rarity: rarity,
            attack: attack,
            defense: defense,
            agility: agility,
            criticalRate: criticalRate,
            criticalDamage: criticalDamage
        });
        console.log("mintEquipment 3");
        emit EquipmentMinted(to, newTokenId, equipmentType, rarity);
        return newTokenId;
    }

    /**
     * @dev 获取装备数据
     * @param tokenId 装备 ID
     * @return 装备数据结构
     */
    function getEquipment(
        uint256 tokenId
    ) external view returns (EquipmentData memory) {
        require(_ownerOf(tokenId) != address(0), "Equipment does not exist");
        return equipmentData[tokenId];
    }

    function updateEquipment(
        uint256 tokenId,
        uint8 stars,
        uint16 attack,
        uint16 defense,
        uint16 agility,
        uint8 criticalRate,
        uint16 criticalDamage
    ) external onlyAuthorizedOrOwner {
        require(_ownerOf(tokenId) != address(0), "Equipment does not exist");

        EquipmentData storage equipment = equipmentData[tokenId];
        equipment.stars = stars;
        equipment.attack = attack;
        equipment.defense = defense;
        equipment.agility = agility;
        equipment.criticalRate = criticalRate;
        equipment.criticalDamage = criticalDamage;

        emit EquipmentUpdated(tokenId, stars, attack, defense, agility);
    }


    /**
     * @dev 销毁装备NFT - 只有拥有者可以销毁自己的装备
     * @param tokenId 装备ID
     */
    function burn(uint256 tokenId) public override {
        // ERC721Burnable 已经检查了调用者是否是 owner 或 approved
        delete equipmentData[tokenId];
        super.burn(tokenId);
    }


    /**
     * @dev 重写_update函数以支持ERC721Enumerable
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) returns (address) {
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
     * @dev 重写supportsInterface函数
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Upgradeable, ERC721EnumerableUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev 获取当前总 tokenId 数量（保留原有函数，但ERC721Enumerable.totalSupply()也可用）
     * @return 总数量
     */
    function totalTokens() external view returns (uint256) {
        return _tokenIds;
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
    
}
