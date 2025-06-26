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
    BattleSystem: ['completeBattle', 'startAdventure', 'getBattleStats', 'canBattle', 'getMaxAdventureLevel', 'getMonsterStats'],
    FightSystem: ['startBattle', 'getBattleResult', 'getBattleLog'],
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
function generateContractsFile(addresses, networkName) {
  const contracts = ['Player', 'FightSystem', 'BattleSystem', 'AdventureGold', 'TreasureBoxSystem', 'EquipmentSystem', 'Equipment', 'Item', 'Market', 'Rank', 'SuperMarket'];
  
  let content = `// 合约地址配置（${networkName}网络 - 自动生成）
export const CONTRACT_ADDRESSES = {
  // ${networkName}网络地址
  PLAYER_NFT: '${addresses.PLAYER_NFT}' as \`0x\${string}\`,
  EQUIPMENT_NFT: '${addresses.EQUIPMENT_NFT}' as \`0x\${string}\`,
  ITEM_NFT: '${addresses.ITEM_NFT}' as \`0x\${string}\`,
  GOLD_TOKEN: '${addresses.GOLD_TOKEN}' as \`0x\${string}\`,
  TREASURE_BOX_SYSTEM: '${addresses.TREASURE_BOX_SYSTEM}' as \`0x\${string}\`,
  FIGHT_SYSTEM: '${addresses.FIGHT_SYSTEM}' as \`0x\${string}\`,
  BATTLE_SYSTEM: '${addresses.BATTLE_SYSTEM}' as \`0x\${string}\`,
  EQUIPMENT_SYSTEM: '${addresses.EQUIPMENT_SYSTEM}' as \`0x\${string}\`,
  MARKET: '${addresses.MARKET}' as \`0x\${string}\`,
  RANK: '${addresses.RANK}' as \`0x\${string}\`,
  SUPER_MARKET: '${addresses.SUPER_MARKET}' as \`0x\${string}\`
} as const;

// 网络信息
export const NETWORK_INFO = {
  chainId: ${networkName === 'Monad Testnet' ? '10143' : '31337'},
  name: '${networkName}',
  currency: '${networkName === 'Monad Testnet' ? 'MON' : 'ETH'}',
  rpcUrl: '${networkName === 'Monad Testnet' ? 'https://testnet-rpc.monad.xyz' : 'http://127.0.0.1:8545'}',
  explorer: '${networkName === 'Monad Testnet' ? 'https://testnet.monadexplorer.com' : ''}'
} as const;

// =============================================================================
// 合约 ABI 定义（自动生成）
// =============================================================================

`;
  
  contracts.forEach(contractName => {
    const abi = extractContractABI(contractName);
    const filteredABI = filterABI(abi, contractName);
    
    if (filteredABI.length > 0) {
      const abiName = contractName === 'FightSystem' ? 'FIGHT_SYSTEM_ABI' :
                     contractName === 'BattleSystem' ? 'BATTLE_SYSTEM_ABI' :
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
      FIGHT_SYSTEM: deploymentInfo.fightSystem,
      BATTLE_SYSTEM: deploymentInfo.battleSystem,
      EQUIPMENT_SYSTEM: deploymentInfo.equipmentSystem,
      MARKET: deploymentInfo.market,
      RANK: deploymentInfo.rank,
      SUPER_MARKET: deploymentInfo.superMarket,
    };

    // 生成完整的contracts文件内容（包含地址和ABI）
    const networkName = deploymentInfo.network === 'monadTestnet' ? 'Monad Testnet' : deploymentInfo.network;
    const contractsContent = generateContractsFile(addresses, networkName);

    // 写入到前端contracts文件
    fs.writeFileSync(frontendContractsPath, contractsContent, "utf8");

    console.log("✅ 合约地址和ABI已同步到前端");
    console.log(`📊 ${networkName}网络部署地址:`);
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
  // 检查网络配置
  if (hre.network.name !== 'monadTestnet') {
    console.error("❌ 请使用 --network monadTestnet 参数部署到Monad测试网");
    console.log("💡 正确的命令: npx hardhat run scripts/deployToMonadTestnet.js --network monadTestnet");
    process.exit(1);
  }

  console.log("🌐 部署到 Monad 测试网...");
  console.log("🔗 网络信息:");
  console.log("   名称: Monad Testnet");
  console.log("   Chain ID: 10143");
  console.log("   RPC: https://testnet-rpc.monad.xyz");
  console.log("   浏览器: https://testnet.monadexplorer.com");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n📋 部署账户:", deployer.address);
  
  try {
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 账户余额:", hre.ethers.formatEther(balance), "MON");
    
    // 检查余额是否足够
    const minBalance = hre.ethers.parseEther("0.1"); // 至少需要0.1 MON
    if (balance < minBalance) {
      console.error("❌ 账户余额不足！");
      console.log("💡 请从水龙头获取测试代币: https://faucet.testnet.monad.xyz");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ 获取账户余额失败:", error.message);
    console.log("💡 请检查网络连接和RPC端点");
    process.exit(1);
  }

  try {
    // 1. 部署 AdventureGold (upgradeable)
    console.log("\n1️⃣ 部署 AdventureGold...");
    const AdventureGold = await hre.ethers.getContractFactory("AdventureGold");
    const goldToken = await upgrades.deployProxy(AdventureGold, [deployer.address], {
      initializer: 'initialize',
      kind: 'uups'
    });
    await goldToken.waitForDeployment();
    const goldTokenAddress = await goldToken.getAddress();
    console.log("✅ AdventureGold 部署到:", goldTokenAddress);

    // 2. 部署 Equipment NFT (upgradeable)
    console.log("\n2️⃣ 部署 Equipment NFT...");
    const Equipment = await hre.ethers.getContractFactory("Equipment");
    const equipmentNFT = await upgrades.deployProxy(Equipment, [deployer.address], {
      initializer: 'initialize',
      kind: 'uups'
    });
    await equipmentNFT.waitForDeployment();
    const equipmentNFTAddress = await equipmentNFT.getAddress();
    console.log("✅ Equipment NFT 部署到:", equipmentNFTAddress);

    // 3. 部署 Item NFT (upgradeable)
    console.log("\n3️⃣ 部署 Item NFT...");
    const Item = await hre.ethers.getContractFactory("Item");
    const itemNFT = await upgrades.deployProxy(Item, [deployer.address], {
      initializer: 'initialize',
      kind: 'uups'
    });
    await itemNFT.waitForDeployment();
    const itemNFTAddress = await itemNFT.getAddress();
    console.log("✅ Item NFT 部署到:", itemNFTAddress);

    // 4. 部署 Player NFT (upgradeable)
    console.log("\n4️⃣ 部署 Player NFT...");
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
    console.log("✅ Player NFT 部署到:", playerNFTAddress);

    // 5. 部署 TreasureBoxSystem (upgradeable)
    console.log("\n5️⃣ 部署 TreasureBoxSystem...");
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
    console.log("✅ TreasureBoxSystem 部署到:", treasureBoxSystemAddress);

    // 6. 部署 FightSystem (upgradeable)
    console.log("\n6️⃣ 部署 FightSystem...");
    const FightSystem = await hre.ethers.getContractFactory("FightSystem");
    const fightSystem = await upgrades.deployProxy(FightSystem, [
      playerNFTAddress,
      itemNFTAddress,
      deployer.address
    ], {
      initializer: 'initialize',
      kind: 'uups'
    });
    await fightSystem.waitForDeployment();
    const fightSystemAddress = await fightSystem.getAddress();
    console.log("✅ FightSystem 部署到:", fightSystemAddress);

    // 7. 部署 BattleSystem (upgradeable)
    console.log("\n7️⃣ 部署 BattleSystem...");
    const BattleSystem = await hre.ethers.getContractFactory("BattleSystem");
    const battleSystem = await upgrades.deployProxy(BattleSystem, [
      playerNFTAddress,
      treasureBoxSystemAddress,
      fightSystemAddress,
      deployer.address
    ], {
      initializer: 'initialize',
      kind: 'uups'
    });
    await battleSystem.waitForDeployment();
    const battleSystemAddress = await battleSystem.getAddress();
    console.log("✅ BattleSystem 部署到:", battleSystemAddress);

    // 8. 部署 EquipmentSystem (upgradeable)
    console.log("\n8️⃣ 部署 EquipmentSystem...");
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
    console.log("✅ EquipmentSystem 部署到:", equipmentSystemAddress);

    // 9. 部署 Market (upgradeable)
    console.log("\n9️⃣ 部署 Market...");
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
    console.log("✅ Market 部署到:", marketAddress);

    // 10. 部署 Rank (upgradeable)
    console.log("\n🔟 部署 Rank...");
    const Rank = await hre.ethers.getContractFactory("Rank");
    const rank = await upgrades.deployProxy(Rank, [
      playerNFTAddress,
      goldTokenAddress,
      fightSystemAddress,
      deployer.address
    ], {
      initializer: 'initialize',
      kind: 'uups'
    });
    await rank.waitForDeployment();
    const rankAddress = await rank.getAddress();
    console.log("✅ Rank 部署到:", rankAddress);

    // 11. 部署 SuperMarket (upgradeable)
    console.log("\n1️⃣1️⃣ 部署 SuperMarket...");
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
    console.log("✅ SuperMarket 部署到:", superMarketAddress);

    // 设置权限
    console.log("\n🔑 设置合约权限...");
    
    await equipmentNFT.authorizeSystem(treasureBoxSystemAddress);
    console.log("✅ Equipment NFT 授权 TreasureBoxSystem");
    
    await goldToken.authorizeSystem(equipmentSystemAddress);
    console.log("✅ EquipmentSystem 获得金币权限");
    
    await goldToken.authorizeSystem(marketAddress);
    console.log("✅ Market 获得金币权限");
    
    await goldToken.authorizeSystem(rankAddress);
    console.log("✅ Rank 获得金币权限");
    
    await goldToken.authorizeSystem(superMarketAddress);
    console.log("✅ SuperMarket 获得金币权限");
    
    await goldToken.authorizeSystem(treasureBoxSystemAddress);
    console.log("✅ TreasureBoxSystem 获得金币权限");
    
    await playerNFT.authorizeSystem(fightSystemAddress);
    console.log("✅ FightSystem 获得玩家权限");
    
    await playerNFT.authorizeSystem(battleSystemAddress);
    console.log("✅ BattleSystem 获得玩家权限");
    
    await treasureBoxSystem.authorizeSystem(battleSystemAddress);
    console.log("✅ BattleSystem 获得宝箱权限");
    
    await fightSystem.authorizeSystem(battleSystemAddress);
    console.log("✅ BattleSystem 获得战斗权限");
    
    await fightSystem.authorizeSystem(rankAddress);
    console.log("✅ Rank 获得战斗权限");
    
    await playerNFT.authorizeSystem(treasureBoxSystemAddress);
    console.log("✅ TreasureBoxSystem 获得玩家权限");
    
    await itemNFT.authorizeSystem(treasureBoxSystemAddress);
    console.log("✅ TreasureBoxSystem 获得物品权限");
    
    await equipmentNFT.authorizeSystem(equipmentSystemAddress);
    console.log("✅ EquipmentSystem 获得装备权限");
    
    await playerNFT.authorizeSystem(equipmentSystemAddress);
    console.log("✅ EquipmentSystem 获得玩家权限");
    
    await playerNFT.authorizeSystem(marketAddress);
    console.log("✅ Market 获得玩家权限");
    
    await playerNFT.authorizeSystem(rankAddress);
    console.log("✅ Rank 获得玩家权限");
    
    await playerNFT.authorizeSystem(superMarketAddress);
    console.log("✅ SuperMarket 获得玩家权限");

    // 保存部署信息
    const deploymentInfo = {
      network: hre.network.name,
      chainId: 10143,
      playerNFT: playerNFTAddress,
      equipmentNFT: equipmentNFTAddress,
      itemNFT: itemNFTAddress,
      goldToken: goldTokenAddress,
      treasureBoxSystem: treasureBoxSystemAddress,
      fightSystem: fightSystemAddress,
      battleSystem: battleSystemAddress,
      equipmentSystem: equipmentSystemAddress,
      market: marketAddress,
      rank: rankAddress,
      superMarket: superMarketAddress,
      deployedAt: new Date().toISOString(),
      upgradeable: true,
      rpcUrl: 'https://testnet-rpc.monad.xyz',
      explorer: 'https://testnet.monadexplorer.com',
      faucet: 'https://faucet.testnet.monad.xyz'
    };

    const deploymentsPath = path.join(__dirname, "..", "deploymentsMonadTestnet.json");
    fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 部署信息保存到 deploymentsMonadTestnet.json");

    // 自动同步合约地址和ABI到前端
    console.log("\n🔄 正在同步合约到前端...");
    syncContractsToFrontend(deploymentInfo);

    console.log("\n=== 🎉 Monad 测试网部署完成 ===");
    console.log("🌐 网络: Monad Testnet (Chain ID: 10143)");
    console.log("🔗 RPC: https://testnet-rpc.monad.xyz");
    console.log("🔍 浏览器: https://testnet.monadexplorer.com");
    console.log("💧 水龙头: https://faucet.testnet.monad.xyz");
    
    console.log("\n📋 合约地址:");
    console.log(`   Player NFT: ${playerNFTAddress}`);
    console.log(`   Equipment NFT: ${equipmentNFTAddress}`);
    console.log(`   Item NFT: ${itemNFTAddress}`);
    console.log(`   Gold Token: ${goldTokenAddress}`);
    console.log(`   TreasureBox System: ${treasureBoxSystemAddress}`);
    console.log(`   Fight System: ${fightSystemAddress}`);
    console.log(`   Battle System: ${battleSystemAddress}`);
    console.log(`   Equipment System: ${equipmentSystemAddress}`);
    console.log(`   Market: ${marketAddress}`);
    console.log(`   Rank: ${rankAddress}`);
    console.log(`   Super Market: ${superMarketAddress}`);
    
    console.log("\n🔮 特性:");
    console.log("• 所有合约使用UUPS代理模式，支持升级");
    console.log("• 合约地址在升级时保持不变");
    console.log("• 只有owner可以授权升级");
    console.log("• 前端contracts文件已自动更新");

  } catch (error) {
    console.error("❌ 部署失败:", error);
    
    if (error.message.includes('insufficient funds')) {
      console.log("💡 余额不足，请从水龙头获取更多测试代币");
      console.log("   水龙头地址: https://faucet.testnet.monad.xyz");
    } else if (error.message.includes('network')) {
      console.log("💡 网络连接问题，请检查:");
      console.log("   1. 网络连接是否正常");
      console.log("   2. RPC端点是否可用: https://testnet-rpc.monad.xyz");
      console.log("   3. 私钥是否正确设置在.env文件中");
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  });