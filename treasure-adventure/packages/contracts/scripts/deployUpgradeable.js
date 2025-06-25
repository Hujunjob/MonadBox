const hre = require("hardhat");
const { upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

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
 * 生成完整的前端contracts文件内容
 */
function generateContractsFile(addresses) {
  const contracts = ['Player', 'BattleSystemV2', 'AdventureGold', 'TreasureBoxSystem', 'EquipmentSystem', 'Equipment', 'Item', 'Market', 'Rank', 'SuperMarket'];
  
  let content = `// 合约地址配置（自动生成）
export const CONTRACT_ADDRESSES = {
  // 本地测试网络地址（从 packages/contracts/deploymentsUpgradeable.json 自动更新）
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

// =============================================================================
// 合约 ABI 定义（自动生成）
// =============================================================================

`;
  
  contracts.forEach(contractName => {
    const abi = extractContractABI(contractName);
    const filteredABI = filterABI(abi, contractName);
    
    if (filteredABI.length > 0) {
      const abiName = contractName === 'BattleSystemV2' ? 'BATTLE_SYSTEM_ABI' :
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
 * 同步合约地址和ABI到前端
 */
function syncContractsToFrontend(deploymentInfo) {
  try {
    const frontendContractsPath = path.join(__dirname, "..", "..", "..", "src", "contracts", "index.ts");
    
    // 构建合约地址配置
    const addresses = {
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

    // 生成完整的contracts文件内容（包含地址和ABI）
    const contractsContent = generateContractsFile(addresses);

    // 写入到前端contracts文件
    fs.writeFileSync(frontendContractsPath, contractsContent, "utf8");

    console.log("✅ 合约地址和ABI已同步到前端");
    console.log("📊 更新的地址:");
    Object.entries(addresses).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log("📋 ABI已自动提取并更新到 src/contracts/index.ts");

  } catch (error) {
    console.error("❌ 同步合约到前端失败:", error.message);
    console.log("💡 请检查 src/contracts/index.ts 文件是否存在");
  }
}

async function main() {
  console.log("🚀 Deploying upgradeable contracts...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // 1. 部署 AdventureGold (upgradeable)
  console.log("\n1️⃣ Deploying AdventureGold...");
  const AdventureGold = await hre.ethers.getContractFactory("AdventureGold");
  const goldToken = await upgrades.deployProxy(AdventureGold, [deployer.address], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await goldToken.waitForDeployment();
  const goldTokenAddress = await goldToken.getAddress();
  console.log("✅ AdventureGold deployed to:", goldTokenAddress);

  // 2. 部署 Equipment NFT (upgradeable)
  console.log("\n2️⃣ Deploying Equipment NFT...");
  const Equipment = await hre.ethers.getContractFactory("Equipment");
  const equipmentNFT = await upgrades.deployProxy(Equipment, [deployer.address], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await equipmentNFT.waitForDeployment();
  const equipmentNFTAddress = await equipmentNFT.getAddress();
  console.log("✅ Equipment NFT deployed to:", equipmentNFTAddress);

  // 3. 部署 Item NFT (upgradeable)
  console.log("\n3️⃣ Deploying Item NFT...");
  const Item = await hre.ethers.getContractFactory("Item");
  const itemNFT = await upgrades.deployProxy(Item, [deployer.address], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await itemNFT.waitForDeployment();
  const itemNFTAddress = await itemNFT.getAddress();
  console.log("✅ Item NFT deployed to:", itemNFTAddress);

  // 4. 部署 Player NFT (upgradeable)
  console.log("\n4️⃣ Deploying Player NFT...");
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
  console.log("✅ Player NFT deployed to:", playerNFTAddress);

  // 5. 部署 TreasureBoxSystem (upgradeable)
  console.log("\n5️⃣ Deploying TreasureBoxSystem...");
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
  console.log("✅ TreasureBoxSystem deployed to:", treasureBoxSystemAddress);

  // 6. 部署 BattleSystemV2 (upgradeable)
  console.log("\n6️⃣ Deploying BattleSystemV2...");
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
  console.log("✅ BattleSystemV2 deployed to:", battleSystemAddress);

  // 7. 部署 EquipmentSystem (upgradeable)
  console.log("\n7️⃣ Deploying EquipmentSystem...");
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
  console.log("✅ EquipmentSystem deployed to:", equipmentSystemAddress);

  // 8. 部署 Market (upgradeable)
  console.log("\n8️⃣ Deploying Market...");
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
  console.log("✅ Market deployed to:", marketAddress);

  // 9. 部署 Rank (upgradeable)
  console.log("\n9️⃣ Deploying Rank...");
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
  console.log("✅ Rank deployed to:", rankAddress);

  // 10. 部署 SuperMarket (upgradeable)
  console.log("\n🔟 Deploying SuperMarket...");
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
  console.log("✅ SuperMarket deployed to:", superMarketAddress);

  // 设置权限
  console.log("\n🔑 Setting up permissions...");
  
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
    network: hre.network.name,
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
    upgradeable: true
  };

  const deploymentsPath = path.join(__dirname, "..", "deploymentsUpgradeable.json");
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to deploymentsUpgradeable.json");

  // 自动同步合约地址和ABI到前端
  console.log("\n🔄 正在同步合约到前端...");
  syncContractsToFrontend(deploymentInfo);

  console.log("\n=== 🎉 Upgradeable Architecture Deployment Summary ===");
  console.log("✅ AdventureGold (Upgradeable gold token)");
  console.log("✅ Equipment NFT (Upgradeable, lightweight)");
  console.log("✅ Item NFT (Upgradeable ERC1155 for potions, job books, pet eggs)");
  console.log("✅ Player NFT (Upgradeable, non-transferable, holds all player data and items)");
  console.log("✅ TreasureBoxSystem (Upgradeable, can mint gold, equipment and item rewards)");
  console.log("✅ BattleSystemV2 (Upgradeable, no registration, no gold rewards, reads Player NFT)");
  console.log("✅ EquipmentSystem (Upgradeable, star upgrade, enhancement, decomposition)");
  console.log("✅ Market (Upgradeable, buy/sell equipment and items with proper transfers)");
  console.log("✅ Rank (Upgradeable, player ranking system with challenge mechanics)");
  console.log("✅ SuperMarket (Upgradeable, buy gold with ETH)");
  console.log("\n🔮 Upgrade Features:");
  console.log("• All contracts use UUPS proxy pattern");
  console.log("• Contracts can be upgraded while preserving state");
  console.log("• Proxy addresses remain constant during upgrades");
  console.log("• Only owner can authorize upgrades");
  console.log("\n🎮 Architecture Features:");
  console.log("• Player registration = Mint Player NFT");
  console.log("• Equipment = Send NFT to Player NFT contract");
  console.log("• Items (potions, job books, pet eggs) = ERC1155 stored in Player items mapping");
  console.log("• Unequip = Withdraw NFT from Player NFT contract");
  console.log("• Battle victories no longer give gold");
  console.log("• Treasure box rewards include Item NFTs");
  console.log("• Each contract handles its own responsibility");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });