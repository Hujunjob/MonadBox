const hre = require("hardhat");

async function main() {
  console.log("Deploying GameManager and all subsystems...");

  // Deploy the main GameManager contract (which creates all subsystems internally)
  const GameManager = await hre.ethers.getContractFactory("GameManager");
  const gameManager = await GameManager.deploy();

  await gameManager.waitForDeployment();

  const gameManagerAddress = await gameManager.getAddress();
  console.log("GameManager deployed to:", gameManagerAddress);

  // Get the addresses of all subsystem contracts
  const goldTokenAddress = await gameManager.goldToken();
  const equipmentNFTAddress = await gameManager.equipmentNFT();
  const battleSystemAddress = await gameManager.battleSystem();
  const treasureBoxSystemAddress = await gameManager.treasureBoxSystem();

  console.log("AdventureGold token deployed to:", goldTokenAddress);
  console.log("Equipment NFT deployed to:", equipmentNFTAddress);
  console.log("BattleSystem deployed to:", battleSystemAddress);
  console.log("TreasureBoxSystem deployed to:", treasureBoxSystemAddress);

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    gameManager: gameManagerAddress,
    treasureAdventure: gameManagerAddress, // Keep for compatibility
    treasureAdventureGame: gameManagerAddress, // Keep for compatibility
    goldToken: goldTokenAddress,
    equipmentNFT: equipmentNFTAddress,
    battleSystem: battleSystemAddress,
    treasureBoxSystem: treasureBoxSystemAddress,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    './deployments.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployments.json");
  console.log("\n=== Deployment Summary ===");
  console.log("✅ All contracts deployed successfully!");
  console.log("✅ GameManager coordinates all subsystems");
  console.log("✅ BattleSystem handles combat and leveling");
  console.log("✅ TreasureBoxSystem handles box generation and opening");
  console.log("✅ AdventureGold ERC20 token for in-game currency");
  console.log("✅ Equipment ERC721 NFTs for gear");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});