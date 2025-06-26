// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./Player.sol";
import "./AdventureGold.sol";

/**
 * @title SuperMarket
 * @dev 超级市场合约 - 用户可以用ETH购买金币
 */
contract SuperMarket is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    Player public playerNFT;
    AdventureGold public goldToken;

    // 汇率：1 ETH = 10000 Gold
    uint256 public EXCHANGE_RATE;

    // 购买限制
    uint256 public MIN_GOLD_AMOUNT; // 最少购买100金币
    uint256 public MAX_GOLD_AMOUNT; // 最多购买100万金币

    // 事件
    event GoldPurchased(
        address indexed buyer,
        uint256 playerId,
        uint256 ethAmount,
        uint256 goldAmount
    );
    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _playerNFT,
        address _goldToken,
        address initialOwner
    ) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        playerNFT = Player(_playerNFT);
        goldToken = AdventureGold(_goldToken);
        initConfig();
    }

    function initConfig() internal {
        // 汇率：1 ETH = 10000 Gold
        EXCHANGE_RATE = 10000;

        // 购买限制
        MIN_GOLD_AMOUNT = 100e18; // 最少购买100金币
        MAX_GOLD_AMOUNT = 1000000e18; // 最多购买100万金币
    }

    /**
     * @dev 购买金币
     * @param playerId 玩家NFT ID
     * @param goldAmount 要购买的金币数量（单位：wei）
     */
    function buyGold(
        uint256 playerId,
        uint256 goldAmount
    ) external payable nonReentrant {
        require(playerNFT.ownerOf(playerId) == msg.sender, "Not your player");
        require(goldAmount >= MIN_GOLD_AMOUNT, "Gold amount too small");
        require(goldAmount <= MAX_GOLD_AMOUNT, "Gold amount too large");

        // 计算需要的ETH数量
        uint256 requiredEth = calculateEthRequired(goldAmount);
        require(msg.value >= requiredEth, "Insufficient ETH");

        // 给玩家NFT增加金币显示
        playerNFT.addGold(playerId, goldAmount);

        // 给用户mint真正的AdventureGold代币
        goldToken.mint(address(playerNFT), goldAmount);

        // 如果用户发送的ETH超过需要的数量，退还多余的ETH
        if (msg.value > requiredEth) {
            (bool success, ) = payable(msg.sender).call{
                value: msg.value - requiredEth
            }("");
            require(success, "ETH refund failed");
        }

        emit GoldPurchased(msg.sender, playerId, requiredEth, goldAmount);
    }

    /**
     * @dev 计算购买指定金币数量需要的ETH
     * @param goldAmount 金币数量（单位：wei）
     * @return 需要的ETH数量（单位：wei）
     */
    function calculateEthRequired(
        uint256 goldAmount
    ) public view returns (uint256) {
        return goldAmount / EXCHANGE_RATE;
    }

    /**
     * @dev 计算指定ETH可以购买的金币数量
     * @param ethAmount ETH数量（单位：wei）
     * @return 可购买的金币数量（单位：wei）
     */
    function calculateGoldAmount(
        uint256 ethAmount
    ) public view returns (uint256) {
        return ethAmount * EXCHANGE_RATE;
    }

    /**
     * @dev 获取购买限制信息
     * @return minGold 最小购买金币数量
     * @return maxGold 最大购买金币数量
     * @return rate 汇率（1 ETH = rate Gold）
     */
    function getPurchaseLimits()
        external
        view
        returns (uint256 minGold, uint256 maxGold, uint256 rate)
    {
        return (MIN_GOLD_AMOUNT, MAX_GOLD_AMOUNT, EXCHANGE_RATE);
    }

    /**
     * @dev 提取合约中的ETH（仅owner）
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ETH withdrawal failed");
    }

    /**
     * @dev 获取合约ETH余额
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev 授权升级函数 - 只有owner可以升级合约
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
