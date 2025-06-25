const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Monad测试网部署脚本
 * 基于deployV2.js但专门针对Monad测试网优化
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
 * 生成Monad测试网专用的前端contracts文件内容
 */
function generateMonadContractsFile(addresses) {
  const contracts = ['Player', 'BattleSystemV2', 'AdventureGold', 'TreasureBoxSystem', 'EquipmentSystem', 'Equipment', 'Item', 'Market', 'Rank', 'SuperMarket'];
  
  let content = `// Monad测试网合约地址配置（自动生成）
export const MONAD_TESTNET_CONTRACT_ADDRESSES = {
  // Monad测试网地址 (Chain ID: 10143)
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
  blockExplorer: 'https://testnet-explorer.monad.xyz'
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
 * 同步Monad测试网合约地址和ABI到前端
 */
function syncMonadContractsToFrontend(deploymentInfo) {
  try {
    const frontendContractsPath = path.join(__dirname, "..", "..", "..", "src", "contracts", "monad-testnet.ts");
    
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

    // 生成Monad测试网专用的contracts文件内容
    const contractsContent = generateMonadContractsFile(addresses);

    // 写入到前端contracts文件
    fs.writeFileSync(frontendContractsPath, contractsContent, "utf8");

    console.log("✅ Monad测试网合约地址和ABI已同步到前端");
    console.log("📊 更新的地址:");
    Object.entries(addresses).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log("📋 ABI已自动提取并更新到 src/contracts/monad-testnet.ts");

  } catch (error) {
    console.error("❌ 同步Monad测试网合约到前端失败:", error.message);
    console.log("💡 请检查 src/contracts/ 目录是否存在");
  }
}

async function main() {
  console.log("🚀 开始部署到Monad测试网...");
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

  // 1. 部署 AdventureGold (独立的金币合约)
  console.log("\n📦 部署 AdventureGold...");
  const AdventureGold = await hre.ethers.getContractFactory("AdventureGold");
  const goldToken = await AdventureGold.deploy();
  await goldToken.waitForDeployment();
  console.log("✅ AdventureGold deployed to:", await goldToken.getAddress());

  // 2. 部署 Equipment NFT
  console.log("\n📦 部署 Equipment NFT...");
  const Equipment = await hre.ethers.getContractFactory("Equipment");
  const equipmentNFT = await Equipment.deploy();
  await equipmentNFT.waitForDeployment();
  console.log("✅ Equipment NFT deployed to:", await equipmentNFT.getAddress());

  // 3. 部署 Item NFT (ERC1155 for potions, job books, pet eggs)
  console.log("\n📦 部署 Item NFT...");
  const Item = await hre.ethers.getContractFactory("Item");
  const itemNFT = await Item.deploy();
  await itemNFT.waitForDeployment();
  console.log("✅ Item NFT deployed to:", await itemNFT.getAddress());

  // 4. 部署 Player NFT
  console.log("\n📦 部署 Player NFT...");
  const Player = await hre.ethers.getContractFactory("Player");
  const playerNFT = await Player.deploy(
    await equipmentNFT.getAddress(), 
    await goldToken.getAddress(),
    await itemNFT.getAddress()
  );
  await playerNFT.waitForDeployment();
  console.log("✅ Player NFT deployed to:", await playerNFT.getAddress());

  // 5. 部署 TreasureBoxSystem
  console.log("\n📦 部署 TreasureBoxSystem...");
  const TreasureBoxSystem = await hre.ethers.getContractFactory("TreasureBoxSystem");
  const treasureBoxSystem = await TreasureBoxSystem.deploy(
    await goldToken.getAddress(),
    await equipmentNFT.getAddress(),
    await playerNFT.getAddress(),
    await itemNFT.getAddress()
  );
  await treasureBoxSystem.waitForDeployment();
  console.log("✅ TreasureBoxSystem deployed to:", await treasureBoxSystem.getAddress());

  // 6. 部署 BattleSystemV2
  console.log("\n📦 部署 BattleSystemV2...");
  const BattleSystemV2 = await hre.ethers.getContractFactory("BattleSystemV2");
  const battleSystem = await BattleSystemV2.deploy(
    await playerNFT.getAddress(),
    await treasureBoxSystem.getAddress()
  );
  await battleSystem.waitForDeployment();
  console.log("✅ BattleSystemV2 deployed to:", await battleSystem.getAddress());

  // 7. 部署 EquipmentSystem
  console.log("\n📦 部署 EquipmentSystem...");
  const EquipmentSystem = await hre.ethers.getContractFactory("EquipmentSystem");
  const equipmentSystem = await EquipmentSystem.deploy(
    await equipmentNFT.getAddress(),
    await goldToken.getAddress(),
    await playerNFT.getAddress()
  );
  await equipmentSystem.waitForDeployment();
  console.log("✅ EquipmentSystem deployed to:", await equipmentSystem.getAddress());

  // 8. 部署 Market
  console.log("\n📦 部署 Market...");
  const Market = await hre.ethers.getContractFactory("Market");
  const market = await Market.deploy(
    await playerNFT.getAddress(),
    await equipmentNFT.getAddress(),
    await itemNFT.getAddress(),
    await goldToken.getAddress()
  );
  await market.waitForDeployment();
  console.log("✅ Market deployed to:", await market.getAddress());

  // 9. 部署 Rank
  console.log("\n📦 部署 Rank...");
  const Rank = await hre.ethers.getContractFactory("Rank");
  const rank = await Rank.deploy(
    await playerNFT.getAddress(),
    await goldToken.getAddress()
  );
  await rank.waitForDeployment();
  console.log("✅ Rank deployed to:", await rank.getAddress());

  // 10. 部署 SuperMarket
  console.log("\n📦 部署 SuperMarket...");
  const SuperMarket = await hre.ethers.getContractFactory("SuperMarket");
  const superMarket = await SuperMarket.deploy(
    await playerNFT.getAddress(),
    await goldToken.getAddress()
  );
  await superMarket.waitForDeployment();
  console.log("✅ SuperMarket deployed to:", await superMarket.getAddress());

  // 设置权限
  console.log("\n🔐 设置权限...");
  
  // 权限分配策略：
  // - AdventureGold: TreasureBoxSystem负责奖励铸造，EquipmentSystem负责消耗
  // - Equipment: TreasureBoxSystem负责奖励铸造，EquipmentSystem负责升级修改
  // 所以让部署者保持owner，然后设置minter/burner角色
  
  // 暂时将Equipment ownership给TreasureBoxSystem，因为它需要铸造新装备
  await equipmentNFT.authorizeSystem(await treasureBoxSystem.getAddress());
  console.log("✅ Equipment NFT ownership transferred to TreasureBoxSystem");
  
  // 先授权EquipmentSystem、Market、Rank和SuperMarket调用AdventureGold的burn/mint函数，然后再转移ownership
  await goldToken.authorizeSystem(await equipmentSystem.getAddress());
  console.log("✅ EquipmentSystem authorized to burn gold");
  
  await goldToken.authorizeSystem(await market.getAddress());
  console.log("✅ Market authorized to burn gold");
  
  await goldToken.authorizeSystem(await rank.getAddress());
  console.log("✅ Rank authorized to burn gold");
  
  await goldToken.authorizeSystem(await superMarket.getAddress());
  console.log("✅ SuperMarket authorized to mint gold");
  
  // AdventureGold ownership给TreasureBoxSystem
  await goldToken.transferOwnership(await treasureBoxSystem.getAddress());
  console.log("✅ AdventureGold ownership transferred to TreasureBoxSystem");
  
  // BattleSystemV2需要调用Player合约的函数
  await playerNFT.authorizeSystem(await battleSystem.getAddress());
  console.log("✅ BattleSystemV2 authorized to call Player functions");
  
  // BattleSystemV2需要调用TreasureBoxSystem的函数
  await treasureBoxSystem.authorizeSystem(await battleSystem.getAddress());
  console.log("✅ BattleSystemV2 authorized to call TreasureBoxSystem functions");
  
  // TreasureBoxSystem需要调用Player合约的金币和装备管理函数
  await playerNFT.authorizeSystem(await treasureBoxSystem.getAddress());
  console.log("✅ TreasureBoxSystem authorized to call Player functions");
  
  // TreasureBoxSystem需要mint Item NFT作为奖励
  await itemNFT.authorizeSystem(await treasureBoxSystem.getAddress());
  console.log("✅ TreasureBoxSystem authorized to mint Item NFTs");
  
  // EquipmentSystem需要调用Equipment合约的upgradeEquipment和burn函数
  await equipmentNFT.authorizeSystem(await equipmentSystem.getAddress());
  console.log("✅ EquipmentSystem authorized to modify Equipment NFTs");
  
  // EquipmentSystem需要调用Player合约的金币和装备管理函数
  await playerNFT.authorizeSystem(await equipmentSystem.getAddress());
  console.log("✅ EquipmentSystem authorized to call Player functions");
  
  // Market需要调用Player合约的金币和装备管理函数
  await playerNFT.authorizeSystem(await market.getAddress());
  console.log("✅ Market authorized to call Player functions");
  
  // Rank需要调用Player合约的金币管理函数
  await playerNFT.authorizeSystem(await rank.getAddress());
  console.log("✅ Rank authorized to call Player functions");
  
  // SuperMarket需要调用Player合约的金币管理函数
  await playerNFT.authorizeSystem(await superMarket.getAddress());
  console.log("✅ SuperMarket authorized to call Player functions");

  // 保存部署信息
  const deploymentInfo = {
    network: "monad-testnet",
    chainId: 10143,
    playerNFT: await playerNFT.getAddress(),
    equipmentNFT: await equipmentNFT.getAddress(),
    itemNFT: await itemNFT.getAddress(),
    goldToken: await goldToken.getAddress(),
    treasureBoxSystem: await treasureBoxSystem.getAddress(),
    battleSystem: await battleSystem.getAddress(),
    equipmentSystem: await equipmentSystem.getAddress(),
    market: await market.getAddress(),
    rank: await rank.getAddress(),
    superMarket: await superMarket.getAddress(),
    deployedAt: new Date().toISOString(),
    deployedBy: deployer.address,
  };

  const deploymentsPath = path.join(__dirname, "..", "deployments-monad-testnet.json");
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 部署信息已保存到 deployments-monad-testnet.json");

  // 自动同步合约地址和ABI到前端
  console.log("\n🔄 正在同步合约到前端...");
  syncMonadContractsToFrontend(deploymentInfo);

  console.log("\n🎉 === Monad测试网部署完成 ===");
  console.log("🌐 网络: Monad Testnet (Chain ID: 10143)");
  console.log("🔗 RPC: https://testnet-rpc.monad.xyz");
  console.log("💰 部署账户:", deployer.address);
  console.log("📋 合约地址:");
  Object.entries(deploymentInfo).forEach(([key, value]) => {
    if (key.includes('NFT') || key.includes('Token') || key.includes('System') || key.includes('market') || key === 'rank') {
      console.log(`   ${key}: ${value}`);
    }
  });
  console.log("\n📄 前端配置文件已生成: src/contracts/monad-testnet.ts");
  console.log("💡 可以开始在Monad测试网上测试游戏了！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });