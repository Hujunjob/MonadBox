// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
/**
 * @title Equipment
 * @dev 宝物冒险游戏的装备 NFT (ERC721)
 */
contract Equipment is ERC721, ERC721Enumerable, Ownable {
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

    constructor() ERC721("Adventure Equipment", "EQUIP") Ownable(msg.sender) {}

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
     * @param name 装备名称
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
        uint16 criticalDamage,
        string memory name
    ) external onlyAuthorizedOrOwner returns (uint256) {
        console.log("mintEquipment");
        require(equipmentType < 8, "Invalid equipment type");
        require(rarity < 5, "Invalid rarity");
        require(stars <= 5, "Invalid stars");

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
            criticalDamage: criticalDamage,
            name: name
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

    /**
     * @dev 更新装备属性（用于升星和强化）
     * @param tokenId 装备ID
     * @param stars 新星级
     * @param attack 新攻击力
     * @param defense 新防御力
     * @param agility 新敏捷
     * @param criticalRate 新暴击率
     * @param criticalDamage 新暴击伤害
     */
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
     * @dev 销毁装备NFT
     * @param tokenId 装备ID
     */
    function burn(uint256 tokenId) external onlyAuthorizedOrOwner {
        require(_ownerOf(tokenId) != address(0), "Equipment does not exist");
        delete equipmentData[tokenId];
        _burn(tokenId);
    }

    /**
     * @dev 重写_update函数以支持ERC721Enumerable
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev 重写_increaseBalance函数以支持ERC721Enumerable
     */
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    /**
     * @dev 重写supportsInterface函数
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

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
