const hre = require("hardhat");

async function main() {
  console.log("Deploying TreasureAdventure contract...");

  // Deploy the main contract
  const TreasureAdventure = await hre.ethers.getContractFactory("TreasureAdventure");
  const treasureAdventure = await TreasureAdventure.deploy();

  await treasureAdventure.waitForDeployment();

  const contractAddress = await treasureAdventure.getAddress();
  console.log("TreasureAdventure deployed to:", contractAddress);

  // Get the addresses of the token contracts
  const goldTokenAddress = await treasureAdventure.goldToken();
  const equipmentNFTAddress = await treasureAdventure.equipmentNFT();

  console.log("AdventureGold token deployed to:", goldTokenAddress);
  console.log("Equipment NFT deployed to:", equipmentNFTAddress);

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    treasureAdventure: contractAddress,
    goldToken: goldTokenAddress,
    equipmentNFT: equipmentNFTAddress,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    './deployments.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployments.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});