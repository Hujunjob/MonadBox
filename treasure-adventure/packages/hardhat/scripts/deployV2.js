const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying new architecture contracts...");

  // 1. 部署 AdventureGold (独立的金币合约)
  const AdventureGold = await hre.ethers.getContractFactory("AdventureGold");
  const goldToken = await AdventureGold.deploy();
  await goldToken.waitForDeployment();
  console.log("AdventureGold deployed to:", await goldToken.getAddress());

  // 2. 部署 Equipment NFT
  const Equipment = await hre.ethers.getContractFactory("Equipment");
  const equipmentNFT = await Equipment.deploy();
  await equipmentNFT.waitForDeployment();
  console.log("Equipment NFT deployed to:", await equipmentNFT.getAddress());

  // 3. 部署 Player NFT
  const Player = await hre.ethers.getContractFactory("Player");
  const playerNFT = await Player.deploy(await equipmentNFT.getAddress());
  await playerNFT.waitForDeployment();
  console.log("Player NFT deployed to:", await playerNFT.getAddress());

  // 4. 部署 TreasureBoxSystem
  const TreasureBoxSystem = await hre.ethers.getContractFactory("TreasureBoxSystem");
  const treasureBoxSystem = await TreasureBoxSystem.deploy(
    await goldToken.getAddress(),
    await equipmentNFT.getAddress()
  );
  await treasureBoxSystem.waitForDeployment();
  console.log("TreasureBoxSystem deployed to:", await treasureBoxSystem.getAddress());

  // 5. 部署 BattleSystemV2
  const BattleSystemV2 = await hre.ethers.getContractFactory("BattleSystemV2");
  const battleSystem = await BattleSystemV2.deploy(
    await playerNFT.getAddress(),
    await treasureBoxSystem.getAddress()
  );
  await battleSystem.waitForDeployment();
  console.log("BattleSystemV2 deployed to:", await battleSystem.getAddress());

  // 6. 部署 EquipmentSystem
  const EquipmentSystem = await hre.ethers.getContractFactory("EquipmentSystem");
  const equipmentSystem = await EquipmentSystem.deploy(
    await equipmentNFT.getAddress(),
    await goldToken.getAddress()
  );
  await equipmentSystem.waitForDeployment();
  console.log("EquipmentSystem deployed to:", await equipmentSystem.getAddress());

  // 设置权限
  console.log("Setting up permissions...");
  
  // 权限分配策略：
  // - AdventureGold: TreasureBoxSystem负责奖励铸造，EquipmentSystem负责消耗
  // - Equipment: TreasureBoxSystem负责奖励铸造，EquipmentSystem负责升级修改
  // 所以让部署者保持owner，然后设置minter/burner角色
  
  // 暂时将Equipment ownership给TreasureBoxSystem，因为它需要铸造新装备
  await equipmentNFT.transferOwnership(await treasureBoxSystem.getAddress());
  console.log("Equipment NFT ownership transferred to TreasureBoxSystem");
  
  // AdventureGold ownership给TreasureBoxSystem
  await goldToken.transferOwnership(await treasureBoxSystem.getAddress());
  console.log("AdventureGold ownership transferred to TreasureBoxSystem");
  
  // BattleSystemV2需要调用Player合约的函数
  await playerNFT.authorizeSystem(await battleSystem.getAddress());
  console.log("BattleSystemV2 authorized to call Player functions");
  
  // BattleSystemV2需要调用TreasureBoxSystem的函数
  await treasureBoxSystem.authorizeSystem(await battleSystem.getAddress());
  console.log("BattleSystemV2 authorized to call TreasureBoxSystem functions");

  // 保存部署信息
  const deploymentInfo = {
    network: hre.network.name,
    playerNFT: await playerNFT.getAddress(),
    equipmentNFT: await equipmentNFT.getAddress(),
    goldToken: await goldToken.getAddress(),
    treasureBoxSystem: await treasureBoxSystem.getAddress(),
    battleSystem: await battleSystem.getAddress(),
    equipmentSystem: await equipmentSystem.getAddress(),
    deployedAt: new Date().toISOString(),
  };

  const deploymentsPath = path.join(__dirname, "..", "deploymentsV2.json");
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to deploymentsV2.json");

  console.log("\n=== New Architecture Deployment Summary ===");
  console.log("✅ AdventureGold (Independent gold token, owned by TreasureBoxSystem)");
  console.log("✅ Equipment NFT (Lightweight, owned by TreasureBoxSystem for minting)");
  console.log("✅ Player NFT (Non-transferable, holds all player data)");
  console.log("✅ TreasureBoxSystem (Can mint gold and equipment rewards)");
  console.log("✅ BattleSystemV2 (No registration, no gold rewards, reads Player NFT)");
  console.log("✅ EquipmentSystem (Star upgrade, enhancement, decomposition)");
  console.log("✅ TreasureBoxSystem has minting permissions for rewards");
  console.log("\n🎮 Architecture Features:");
  console.log("• Player registration = Mint Player NFT");
  console.log("• Equipment = Send NFT to Player NFT contract");
  console.log("• Unequip = Withdraw NFT from Player NFT contract");
  console.log("• Battle victories no longer give gold");
  console.log("• Each contract handles its own responsibility");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });