const hre = require("hardhat");
const { upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Monad测试网可升级合约部署脚本
 * 基于deployUpgradeable.js，专门针对Monad测试网优化
 */

/**
 * 从artifacts中提取合约ABI
 */
function extractContractABI(contractName) {
  try {
    const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`);
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      return artifact.abi;
    }
    return null;
  } catch (error) {
    console.warn(`⚠️ 无法读取 ${contractName} 的 ABI:`, error.message);
    return null;
  }
}

/**
 * 过滤ABI，保留前端需要的函数和所有事件
 */
function filterABI(abi, contractName) {
  if (!abi) return [];
  
  // 定义每个合约前端需要的函数
  const requiredFunctions = {
    GameConfigUpgradeable: [
      'getAllConfig', 'getStaminaConfig', 'getTreasureBoxConfig', 'getLevelConfig',
      'getInitialPlayerAttributes', 'getLevelUpAttributes', 'getRewardConfig',
      'updateStaminaConfig', 'updateTreasureBoxConfig', 'updateLevelConfig',
      'updateInitialPlayerAttributes', 'updateLevelUpAttributes', 'updateRewardConfig',
      'version'
    ],
    Player: [
      'registerPlayer', 'getPlayer', 'balanceOf', 'tokenOfOwnerByIndex', 
      'equipItem', 'unequipItem', 'heal', 'levelUp', 'updateStamina',
      'getPlayerGold', 'getPlayerInventory', 'hasEquipmentInInventory',
      'addEquipmentToInventory', 'removeEquipmentFromInventory', 'getEquippedItems',
      'getPlayerTotalStats', 'updateLastTreasureBoxTime',
      'getPlayerItemQuantity', 'getPlayerItems', 'useHealthPotion', 'useItem', 'transferItemToMarket'
    ],
    BattleSystemV2: ['completeBattle', 'startAdventure', 'getBattleStats', 'canBattle', 'getMaxAdventureLevel', 'getMonsterStats', 'estimateWinRate'],
    AdventureGold: ['balanceOf'],
    TreasureBoxSystem: ['claimOfflineTreasureBoxes', 'openTreasureBox', 'getPlayerTreasureBoxCount', 'getClaimableOfflineBoxes', 'getPlayerTreasureBoxes'],
    EquipmentSystem: ['upgradeStars', 'enhanceEquipment'],
    Equipment: ['getEquipment'],
    Item: ['balanceOf', 'balanceOfBatch'],
    Market: ['listEquipment', 'listItem', 'purchaseEquipment', 'purchaseItem', 'cancelListing', 'getListing', 'getActiveListings', 'getPlayerListings'],
    Rank: ['fight', 'getRankInfo', 'getPlayerRank', 'getTopRanks', 'getNextChallengeTime', 'canChallenge'],
    SuperMarket: ['buyGold', 'calculateEthRequired', 'calculateGoldAmount', 'getPurchaseLimits']
  };
  
  const required = requiredFunctions[contractName] || [];
  
  return abi.filter(item => {
    // 包含所有事件
    if (item.type === 'event') {
      return true;
    }
    // 包含需要的函数
    if (item.type === 'function') {
      return item.stateMutability === 'view' || 
             item.stateMutability === 'pure' || 
             required.includes(item.name);
    }
    return false;
  });
}

/**
 * 生成Monad测试网专用的前端contracts文件内容（可升级版本）
 */
function generateMonadUpgradeableContractsFile(addresses) {
  const contracts = ['GameConfigUpgradeable', 'Player', 'BattleSystemV2', 'AdventureGold', 'TreasureBoxSystem', 'EquipmentSystem', 'Equipment', 'Item', 'Market', 'Rank', 'SuperMarket'];
  
  let content = `// Monad测试网可升级合约地址配置（自动生成）
export const MONAD_TESTNET_UPGRADEABLE_CONTRACT_ADDRESSES = {
  // Monad测试网可升级合约地址 (Chain ID: 10143)
  // 这些地址是代理合约地址，升级时保持不变
  GAME_CONFIG: '${addresses.GAME_CONFIG}' as \`0x\${string}\`,
  PLAYER_NFT: '${addresses.PLAYER_NFT}' as \`0x\${string}\`,
  EQUIPMENT_NFT: '${addresses.EQUIPMENT_NFT}' as \`0x\${string}\`,
  ITEM_NFT: '${addresses.ITEM_NFT}' as \`0x\${string}\`,
  GOLD_TOKEN: '${addresses.GOLD_TOKEN}' as \`0x\${string}\`,
  TREASURE_BOX_SYSTEM: '${addresses.TREASURE_BOX_SYSTEM}' as \`0x\${string}\`,
  BATTLE_SYSTEM: '${addresses.BATTLE_SYSTEM}' as \`0x\${string}\`,
  EQUIPMENT_SYSTEM: '${addresses.EQUIPMENT_SYSTEM}' as \`0x\${string}\`,
  MARKET: '${addresses.MARKET}' as \`0x\${string}\`,
  RANK: '${addresses.RANK}' as \`0x\${string}\`,
  SUPER_MARKET: '${addresses.SUPER_MARKET}' as \`0x\${string}\`
} as const;

// Monad测试网络配置
export const MONAD_TESTNET_CONFIG = {
  chainId: 10143,
  name: 'Monad Testnet',
  symbol: 'MON',
  rpcUrl: 'https://testnet-rpc.monad.xyz',
  blockExplorer: 'https://testnet-explorer.monad.xyz',
  upgradeable: true
} as const;

// 可升级合约特性
export const UPGRADE_FEATURES = {
  pattern: 'UUPS',
  description: 'Universal Upgradeable Proxy Standard',
  benefits: [
    'State preservation during upgrades',
    'Constant proxy addresses',
    'Owner-controlled upgrades',
    'Gas-efficient proxy pattern'
  ]
} as const;

// =============================================================================
// 合约 ABI 定义（自动生成）
// =============================================================================

`;
  
  contracts.forEach(contractName => {
    const abi = extractContractABI(contractName);
    const filteredABI = filterABI(abi, contractName);
    
    if (filteredABI.length > 0) {
      const abiName = contractName === 'GameConfigUpgradeable' ? 'GAME_CONFIG_ABI' :
                     contractName === 'BattleSystemV2' ? 'BATTLE_SYSTEM_ABI' :
                     contractName === 'AdventureGold' ? 'GOLD_TOKEN_ABI' :
                     contractName === 'TreasureBoxSystem' ? 'TREASURE_BOX_SYSTEM_ABI' :
                     contractName === 'EquipmentSystem' ? 'EQUIPMENT_SYSTEM_ABI' :
                     contractName === 'Equipment' ? 'EQUIPMENT_NFT_ABI' :
                     contractName === 'Item' ? 'ITEM_NFT_ABI' :
                     contractName === 'Market' ? 'MARKET_ABI' :
                     contractName === 'Rank' ? 'RANK_ABI' :
                     contractName === 'SuperMarket' ? 'SUPER_MARKET_ABI' :
                     'PLAYER_NFT_ABI';
      
      content += `// ${contractName} 合约 ABI\n`;
      content += `export const ${abiName} = ${JSON.stringify(filteredABI, null, 2)} as const;\n\n`;
    }
  });
  
  return content;
}

/**
 * 同步Monad测试网可升级合约地址和ABI到前端
 */
function syncMonadUpgradeableContractsToFrontend(deploymentInfo) {
  try {
    const frontendContractsPath = path.join(__dirname, "..", "..", "..", "src", "contracts", "monad-testnet-upgradeable.ts");
    
    // 构建合约地址配置
    const addresses = {
      GAME_CONFIG: deploymentInfo.gameConfig,
      PLAYER_NFT: deploymentInfo.playerNFT,
      EQUIPMENT_NFT: deploymentInfo.equipmentNFT,
      ITEM_NFT: deploymentInfo.itemNFT,
      GOLD_TOKEN: deploymentInfo.goldToken,
      TREASURE_BOX_SYSTEM: deploymentInfo.treasureBoxSystem,
      BATTLE_SYSTEM: deploymentInfo.battleSystem,
      EQUIPMENT_SYSTEM: deploymentInfo.equipmentSystem,
      MARKET: deploymentInfo.market,
      RANK: deploymentInfo.rank,
      SUPER_MARKET: deploymentInfo.superMarket,
    };

    // 生成Monad测试网可升级合约专用的contracts文件内容
    const contractsContent = generateMonadUpgradeableContractsFile(addresses);

    // 写入到前端contracts文件
    fs.writeFileSync(frontendContractsPath, contractsContent, "utf8");

    console.log("✅ Monad测试网可升级合约地址和ABI已同步到前端");
    console.log("📊 更新的代理合约地址:");
    Object.entries(addresses).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log("📋 ABI已自动提取并更新到 src/contracts/monad-testnet-upgradeable.ts");
    console.log("🔮 这些是代理合约地址，升级时保持不变");

  } catch (error) {
    console.error("❌ 同步Monad测试网可升级合约到前端失败:", error.message);
    console.log("💡 请检查 src/contracts/ 目录是否存在");
  }
}

async function main() {
  console.log("🚀 开始部署可升级合约到Monad测试网...");
  console.log("🔮 使用UUPS代理模式进行可升级部署");
  console.log("📡 网络信息:");
  console.log(`   - 名称: ${hre.network.name}`);
  console.log(`   - Chain ID: ${hre.network.config.chainId}`);
  console.log(`   - RPC URL: ${hre.network.config.url}`);
  
  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("💰 部署账户:", deployer.address);
  
  // 检查账户余额
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💵 账户余额:", hre.ethers.formatEther(balance), "MON");
  
  if (balance === 0n) {
    console.error("❌ 账户余额为0，请先获取一些MON测试币");
    console.log("💡 获取测试币方法:");
    console.log("   1. 访问 Monad测试网水龙头");
    console.log("   2. 或联系项目方获取测试币");
    process.exit(1);
  }

  // 1. 部署 GameConfigUpgradeable (upgradeable)
  console.log("\n1️⃣ 部署 GameConfigUpgradeable (可升级)...");
  const GameConfigUpgradeable = await hre.ethers.getContractFactory("GameConfigUpgradeable");
  const gameConfig = await upgrades.deployProxy(GameConfigUpgradeable, [deployer.address], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await gameConfig.waitForDeployment();
  const gameConfigAddress = await gameConfig.getAddress();
  console.log("✅ GameConfigUpgradeable (可升级) deployed to:", gameConfigAddress);

  // 2. 部署 AdventureGold (upgradeable)
  console.log("\n2️⃣ 部署 AdventureGold (可升级)...");
  const AdventureGold = await hre.ethers.getContractFactory("AdventureGold");
  const goldToken = await upgrades.deployProxy(AdventureGold, [deployer.address], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await goldToken.waitForDeployment();
  const goldTokenAddress = await goldToken.getAddress();
  console.log("✅ AdventureGold (可升级) deployed to:", goldTokenAddress);

  // 3. 部署 Equipment NFT (upgradeable)
  console.log("\n3️⃣ 部署 Equipment NFT (可升级)...");
  const Equipment = await hre.ethers.getContractFactory("Equipment");
  const equipmentNFT = await upgrades.deployProxy(Equipment, [deployer.address], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await equipmentNFT.waitForDeployment();
  const equipmentNFTAddress = await equipmentNFT.getAddress();
  console.log("✅ Equipment NFT (可升级) deployed to:", equipmentNFTAddress);

  // 4. 部署 Item NFT (upgradeable)
  console.log("\n4️⃣ 部署 Item NFT (可升级)...");
  const Item = await hre.ethers.getContractFactory("Item");
  const itemNFT = await upgrades.deployProxy(Item, [deployer.address], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await itemNFT.waitForDeployment();
  const itemNFTAddress = await itemNFT.getAddress();
  console.log("✅ Item NFT (可升级) deployed to:", itemNFTAddress);

  // 5. 部署 Player NFT (upgradeable)
  console.log("\n5️⃣ 部署 Player NFT (可升级)...");
  const Player = await hre.ethers.getContractFactory("Player");
  const playerNFT = await upgrades.deployProxy(Player, [
    equipmentNFTAddress,
    goldTokenAddress,
    itemNFTAddress,
    deployer.address
  ], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await playerNFT.waitForDeployment();
  const playerNFTAddress = await playerNFT.getAddress();
  console.log("✅ Player NFT (可升级) deployed to:", playerNFTAddress);

  // 6. 部署 TreasureBoxSystem (upgradeable)
  console.log("\n6️⃣ 部署 TreasureBoxSystem (可升级)...");
  const TreasureBoxSystem = await hre.ethers.getContractFactory("TreasureBoxSystem");
  const treasureBoxSystem = await upgrades.deployProxy(TreasureBoxSystem, [
    goldTokenAddress,
    equipmentNFTAddress,
    playerNFTAddress,
    itemNFTAddress,
    deployer.address
  ], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await treasureBoxSystem.waitForDeployment();
  const treasureBoxSystemAddress = await treasureBoxSystem.getAddress();
  console.log("✅ TreasureBoxSystem (可升级) deployed to:", treasureBoxSystemAddress);

  // 7. 部署 BattleSystemV2 (upgradeable)
  console.log("\n7️⃣ 部署 BattleSystemV2 (可升级)...");
  const BattleSystemV2 = await hre.ethers.getContractFactory("BattleSystemV2");
  const battleSystem = await upgrades.deployProxy(BattleSystemV2, [
    playerNFTAddress,
    treasureBoxSystemAddress,
    deployer.address
  ], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await battleSystem.waitForDeployment();
  const battleSystemAddress = await battleSystem.getAddress();
  console.log("✅ BattleSystemV2 (可升级) deployed to:", battleSystemAddress);

  // 8. 部署 EquipmentSystem (upgradeable)
  console.log("\n8️⃣ 部署 EquipmentSystem (可升级)...");
  const EquipmentSystem = await hre.ethers.getContractFactory("EquipmentSystem");
  const equipmentSystem = await upgrades.deployProxy(EquipmentSystem, [
    equipmentNFTAddress,
    goldTokenAddress,
    playerNFTAddress,
    deployer.address
  ], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await equipmentSystem.waitForDeployment();
  const equipmentSystemAddress = await equipmentSystem.getAddress();
  console.log("✅ EquipmentSystem (可升级) deployed to:", equipmentSystemAddress);

  // 9. 部署 Market (upgradeable)
  console.log("\n9️⃣ 部署 Market (可升级)...");
  const Market = await hre.ethers.getContractFactory("Market");
  const market = await upgrades.deployProxy(Market, [
    playerNFTAddress,
    equipmentNFTAddress,
    itemNFTAddress,
    goldTokenAddress,
    deployer.address
  ], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("✅ Market (可升级) deployed to:", marketAddress);

  // 10. 部署 Rank (upgradeable)
  console.log("\n🔟 部署 Rank (可升级)...");
  const Rank = await hre.ethers.getContractFactory("Rank");
  const rank = await upgrades.deployProxy(Rank, [
    playerNFTAddress,
    goldTokenAddress,
    deployer.address
  ], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await rank.waitForDeployment();
  const rankAddress = await rank.getAddress();
  console.log("✅ Rank (可升级) deployed to:", rankAddress);

  // 11. 部署 SuperMarket (upgradeable)
  console.log("\n1️⃣1️⃣ 部署 SuperMarket (可升级)...");
  const SuperMarket = await hre.ethers.getContractFactory("SuperMarket");
  const superMarket = await upgrades.deployProxy(SuperMarket, [
    playerNFTAddress,
    goldTokenAddress,
    deployer.address
  ], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await superMarket.waitForDeployment();
  const superMarketAddress = await superMarket.getAddress();
  console.log("✅ SuperMarket (可升级) deployed to:", superMarketAddress);

  // 设置权限
  console.log("\n🔑 设置权限...");
  
  // 权限分配策略：
  // - AdventureGold: TreasureBoxSystem负责奖励铸造，EquipmentSystem负责消耗
  // - Equipment: TreasureBoxSystem负责奖励铸造，EquipmentSystem负责升级修改
  // 所以让部署者保持owner，然后设置minter/burner角色
  
  // 暂时将Equipment ownership给TreasureBoxSystem，因为它需要铸造新装备
  await equipmentNFT.authorizeSystem(treasureBoxSystemAddress);
  console.log("✅ Equipment NFT authorized TreasureBoxSystem");
  
  // 先授权EquipmentSystem、Market、Rank和SuperMarket调用AdventureGold的burn/mint函数
  await goldToken.authorizeSystem(equipmentSystemAddress);
  console.log("✅ EquipmentSystem authorized to burn gold");
  
  await goldToken.authorizeSystem(marketAddress);
  console.log("✅ Market authorized to burn gold");
  
  await goldToken.authorizeSystem(rankAddress);
  console.log("✅ Rank authorized to burn gold");
  
  await goldToken.authorizeSystem(superMarketAddress);
  console.log("✅ SuperMarket authorized to mint gold");
  
  // TreasureBoxSystem 授权
  await goldToken.authorizeSystem(treasureBoxSystemAddress);
  console.log("✅ TreasureBoxSystem authorized to mint gold");
  
  // BattleSystemV2需要调用Player合约的函数
  await playerNFT.authorizeSystem(battleSystemAddress);
  console.log("✅ BattleSystemV2 authorized to call Player functions");
  
  // BattleSystemV2需要调用TreasureBoxSystem的函数
  await treasureBoxSystem.authorizeSystem(battleSystemAddress);
  console.log("✅ BattleSystemV2 authorized to call TreasureBoxSystem functions");
  
  // TreasureBoxSystem需要调用Player合约的金币和装备管理函数
  await playerNFT.authorizeSystem(treasureBoxSystemAddress);
  console.log("✅ TreasureBoxSystem authorized to call Player functions");
  
  // TreasureBoxSystem需要mint Item NFT作为奖励
  await itemNFT.authorizeSystem(treasureBoxSystemAddress);
  console.log("✅ TreasureBoxSystem authorized to mint Item NFTs");
  
  // EquipmentSystem需要调用Equipment合约的upgradeEquipment和burn函数
  await equipmentNFT.authorizeSystem(equipmentSystemAddress);
  console.log("✅ EquipmentSystem authorized to modify Equipment NFTs");
  
  // EquipmentSystem需要调用Player合约的金币和装备管理函数
  await playerNFT.authorizeSystem(equipmentSystemAddress);
  console.log("✅ EquipmentSystem authorized to call Player functions");
  
  // Market需要调用Player合约的金币和装备管理函数
  await playerNFT.authorizeSystem(marketAddress);
  console.log("✅ Market authorized to call Player functions");
  
  // Rank需要调用Player合约的金币管理函数
  await playerNFT.authorizeSystem(rankAddress);
  console.log("✅ Rank authorized to call Player functions");
  
  // SuperMarket需要调用Player合约的金币管理函数
  await playerNFT.authorizeSystem(superMarketAddress);
  console.log("✅ SuperMarket authorized to call Player functions");

  // 保存部署信息
  const deploymentInfo = {
    network: "monad-testnet",
    chainId: 10143,
    gameConfig: gameConfigAddress,
    playerNFT: playerNFTAddress,
    equipmentNFT: equipmentNFTAddress,
    itemNFT: itemNFTAddress,
    goldToken: goldTokenAddress,
    treasureBoxSystem: treasureBoxSystemAddress,
    battleSystem: battleSystemAddress,
    equipmentSystem: equipmentSystemAddress,
    market: marketAddress,
    rank: rankAddress,
    superMarket: superMarketAddress,
    deployedAt: new Date().toISOString(),
    deployedBy: deployer.address,
    upgradeable: true,
    proxyPattern: 'UUPS'
  };

  const deploymentsPath = path.join(__dirname, "..", "deployments-monad-testnet-upgradeable.json");
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 可升级部署信息已保存到 deployments-monad-testnet-upgradeable.json");

  // 自动同步合约地址和ABI到前端
  console.log("\n🔄 正在同步可升级合约到前端...");
  syncMonadUpgradeableContractsToFrontend(deploymentInfo);

  console.log("\n🎉 === Monad测试网可升级合约部署完成 ===");
  console.log("🌐 网络: Monad Testnet (Chain ID: 10143)");
  console.log("🔗 RPC: https://testnet-rpc.monad.xyz");
  console.log("🔮 代理模式: UUPS (Universal Upgradeable Proxy Standard)");
  console.log("💰 部署账户:", deployer.address);
  console.log("📋 代理合约地址 (升级时保持不变):");
  Object.entries(deploymentInfo).forEach(([key, value]) => {
    if (key.includes('NFT') || key.includes('Token') || key.includes('System') || key.includes('market') || key === 'rank') {
      console.log(`   ${key}: ${value}`);
    }
  });
  
  console.log("\n🔮 升级特性:");
  console.log("• ✅ 使用UUPS代理模式，支持合约升级");
  console.log("• ✅ 代理地址在升级时保持不变");
  console.log("• ✅ 状态数据在升级时完全保留");
  console.log("• ✅ 只有合约所有者可以执行升级");
  console.log("• ✅ Gas费用优化的代理模式");
  
  console.log("\n📄 前端配置文件已生成: src/contracts/monad-testnet-upgradeable.ts");
  console.log("💡 可以开始在Monad测试网上测试可升级游戏合约了！");
  
  console.log("\n⚠️ 重要提醒:");
  console.log("• 这些是代理合约地址，请在前端使用");
  console.log("• 升级合约时需要使用 hardhat 的 upgrades 插件");
  console.log("• 升级前请充分测试新的实现合约");
  console.log("• 保管好部署账户的私钥，它拥有升级权限");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 可升级部署失败:", error);
    process.exit(1);
  });