// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Player.sol";
import "./Equipment.sol";
import "./Item.sol";
import "./AdventureGold.sol";

/**
 * @title Market
 * @dev 市场合约 - 玩家可以在这里买卖物品和装备
 */
contract Market is Ownable, ReentrancyGuard {
    Player public playerNFT;
    Equipment public equipmentNFT;
    Item public itemNFT;
    AdventureGold public goldToken;
    
    // 挂单结构
    struct Listing {
        uint256 listingId;
        address seller;
        uint256 playerId;
        uint256 tokenId;
        uint256 price;
        uint256 quantity; // 对于ERC1155 Item使用，ERC721 Equipment始终为1
        ListingType listingType;
        bool active;
        uint256 createdAt;
    }
    
    enum ListingType {
        EQUIPMENT,
        ITEM
    }
    
    // 挂单存储
    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId = 1;
    
    // 市场费率（10% = 1000 basis points）
    uint256 public constant MARKET_FEE_RATE = 1000; // 10%
    uint256 public constant BASIS_POINTS = 10000; // 100%
    
    // 事件
    event ItemListed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed playerId,
        uint256 tokenId,
        uint256 price,
        uint256 quantity,
        ListingType listingType
    );
    
    event ItemPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 indexed buyerPlayerId,
        address seller,
        uint256 sellerPlayerId,
        uint256 tokenId,
        uint256 price,
        uint256 quantity,
        uint256 fee
    );
    
    event ListingCancelled(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed playerId
    );
    
    constructor(
        address _playerNFT,
        address _equipmentNFT,
        address _itemNFT,
        address _goldToken
    ) Ownable(msg.sender) {
        playerNFT = Player(_playerNFT);
        equipmentNFT = Equipment(_equipmentNFT);
        itemNFT = Item(_itemNFT);
        goldToken = AdventureGold(_goldToken);
    }
    
    /**
     * @dev 上架装备
     * @param playerId 玩家ID
     * @param equipmentId 装备ID
     * @param price 价格（单位：gold）
     */
    function listEquipment(
        uint256 playerId,
        uint256 equipmentId,
        uint256 price
    ) external nonReentrant {
        require(playerNFT.ownerOf(playerId) == msg.sender, "Not your player");
        require(price > 0, "Price must be greater than 0");
        require(
            playerNFT.hasEquipmentInInventory(playerId, equipmentId),
            "Equipment not in inventory"
        );
        
        // 创建挂单
        uint256 listingId = nextListingId++;
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            playerId: playerId,
            tokenId: equipmentId,
            price: price,
            quantity: 1,
            listingType: ListingType.EQUIPMENT,
            active: true,
            createdAt: block.timestamp
        });
        
        emit ItemListed(
            listingId,
            msg.sender,
            playerId,
            equipmentId,
            price,
            1,
            ListingType.EQUIPMENT
        );
    }
    
    /**
     * @dev 上架物品
     * @param playerId 玩家ID
     * @param itemId 物品ID
     * @param quantity 数量
     * @param price 单价（单位：gold）
     */
    function listItem(
        uint256 playerId,
        uint256 itemId,
        uint256 quantity,
        uint256 price
    ) external nonReentrant {
        require(playerNFT.ownerOf(playerId) == msg.sender, "Not your player");
        require(price > 0, "Price must be greater than 0");
        require(quantity > 0, "Quantity must be greater than 0");
        require(
            playerNFT.getPlayerItemQuantity(playerId, itemId) >= quantity,
            "Insufficient item quantity"
        );
        
        // 创建挂单
        uint256 listingId = nextListingId++;
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            playerId: playerId,
            tokenId: itemId,
            price: price,
            quantity: quantity,
            listingType: ListingType.ITEM,
            active: true,
            createdAt: block.timestamp
        });
        
        emit ItemListed(
            listingId,
            msg.sender,
            playerId,
            itemId,
            price,
            quantity,
            ListingType.ITEM
        );
    }
    
    /**
     * @dev 购买装备
     * @param listingId 挂单ID
     * @param buyerPlayerId 买家玩家ID
     */
    function purchaseEquipment(
        uint256 listingId,
        uint256 buyerPlayerId
    ) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.listingType == ListingType.EQUIPMENT, "Not an equipment listing");
        require(playerNFT.ownerOf(buyerPlayerId) == msg.sender, "Not your player");
        require(listing.seller != msg.sender, "Cannot buy your own item");
        
        uint256 totalPrice = listing.price;
        uint256 fee = (totalPrice * MARKET_FEE_RATE) / BASIS_POINTS;
        uint256 sellerAmount = totalPrice - fee;
        
        // 检查买家金币余额
        require(
            playerNFT.getPlayerGold(buyerPlayerId) >= totalPrice,
            "Insufficient gold"
        );
        
        // 验证装备仍在卖家背包中
        require(
            playerNFT.hasEquipmentInInventory(listing.playerId, listing.tokenId),
            "Equipment no longer available"
        );
        
        // 转移金币：买家 -> 卖家
        playerNFT.spendGold(buyerPlayerId, sellerAmount, address(this));
        playerNFT.addGold(listing.playerId, sellerAmount-fee);
        
        // 销毁手续费金币
        // playerNFT.spendGold(buyerPlayerId, fee, address(this));
        goldToken.burn(address(this), fee);
        
        // 转移装备：卖家 -> 买家
        playerNFT.removeEquipmentFromInventory(listing.playerId, listing.tokenId, address(this));
        equipmentNFT.safeTransferFrom(address(this), address(playerNFT), listing.tokenId);
        playerNFT.addEquipmentToInventory(buyerPlayerId, listing.tokenId);
        
        // 标记挂单为已完成
        listing.active = false;
        
        emit ItemPurchased(
            listingId,
            msg.sender,
            buyerPlayerId,
            listing.seller,
            listing.playerId,
            listing.tokenId,
            totalPrice,
            1,
            fee
        );
    }
    
    /**
     * @dev 购买物品
     * @param listingId 挂单ID
     * @param buyerPlayerId 买家玩家ID
     * @param quantity 购买数量
     */
    function purchaseItem(
        uint256 listingId,
        uint256 buyerPlayerId,
        uint256 quantity
    ) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.listingType == ListingType.ITEM, "Not an item listing");
        require(playerNFT.ownerOf(buyerPlayerId) == msg.sender, "Not your player");
        require(listing.seller != msg.sender, "Cannot buy your own item");
        require(quantity > 0, "Quantity must be greater than 0");
        require(quantity <= listing.quantity, "Insufficient quantity available");
        
        uint256 totalPrice = listing.price * quantity;
        uint256 fee = (totalPrice * MARKET_FEE_RATE) / BASIS_POINTS;
        uint256 sellerAmount = totalPrice - fee;
        
        // 检查买家金币余额
        require(
            playerNFT.getPlayerGold(buyerPlayerId) >= totalPrice,
            "Insufficient gold"
        );
        
        // 验证物品仍在卖家背包中
        require(
            playerNFT.getPlayerItemQuantity(listing.playerId, listing.tokenId) >= quantity,
            "Item no longer available"
        );
        
        // 转移金币：买家 -> 卖家
        playerNFT.spendGold(buyerPlayerId, sellerAmount, address(this));
        playerNFT.addGold(listing.playerId, sellerAmount);
        
        // 销毁手续费金币
        playerNFT.spendGold(buyerPlayerId, fee, address(this));
        goldToken.burn(address(this), fee);
        
        // 转移物品：卖家 -> 买家
        playerNFT.useItem(listing.playerId, listing.tokenId, quantity);
        playerNFT.addItem(buyerPlayerId, listing.tokenId, quantity);
        
        // 更新挂单数量
        listing.quantity -= quantity;
        if (listing.quantity == 0) {
            listing.active = false;
        }
        
        emit ItemPurchased(
            listingId,
            msg.sender,
            buyerPlayerId,
            listing.seller,
            listing.playerId,
            listing.tokenId,
            totalPrice,
            quantity,
            fee
        );
    }
    
    /**
     * @dev 取消挂单
     * @param listingId 挂单ID
     */
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(
            listing.seller == msg.sender || msg.sender == owner(),
            "Not authorized to cancel"
        );
        
        listing.active = false;
        
        emit ListingCancelled(listingId, listing.seller, listing.playerId);
    }
    
    /**
     * @dev 获取挂单信息
     * @param listingId 挂单ID
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
    
    /**
     * @dev 获取活跃挂单列表（分页）
     * @param offset 偏移量
     * @param limit 限制数量
     */
    function getActiveListings(
        uint256 offset,
        uint256 limit
    ) external view returns (Listing[] memory activeListings, uint256 totalCount) {
        // 先计算总数
        totalCount = 0;
        for (uint256 i = 1; i < nextListingId; i++) {
            if (listings[i].active) {
                totalCount++;
            }
        }
        
        // 计算实际返回数量
        uint256 actualLimit = limit;
        if (offset >= totalCount) {
            actualLimit = 0;
        } else if (offset + limit > totalCount) {
            actualLimit = totalCount - offset;
        }
        
        activeListings = new Listing[](actualLimit);
        
        if (actualLimit > 0) {
            uint256 currentIndex = 0;
            uint256 skipped = 0;
            
            for (uint256 i = 1; i < nextListingId && currentIndex < actualLimit; i++) {
                if (listings[i].active) {
                    if (skipped >= offset) {
                        activeListings[currentIndex] = listings[i];
                        currentIndex++;
                    } else {
                        skipped++;
                    }
                }
            }
        }
    }
    
    /**
     * @dev 获取玩家的挂单列表
     * @param playerId 玩家ID
     */
    function getPlayerListings(uint256 playerId) external view returns (Listing[] memory) {
        address playerOwner = playerNFT.ownerOf(playerId);
        
        // 先计算总数
        uint256 count = 0;
        for (uint256 i = 1; i < nextListingId; i++) {
            if (listings[i].seller == playerOwner && listings[i].playerId == playerId) {
                count++;
            }
        }
        
        // 创建结果数组
        Listing[] memory playerListings = new Listing[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextListingId; i++) {
            if (listings[i].seller == playerOwner && listings[i].playerId == playerId) {
                playerListings[index] = listings[i];
                index++;
            }
        }
        
        return playerListings;
    }
}