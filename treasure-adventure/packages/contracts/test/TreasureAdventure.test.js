const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TreasureAdventure", function () {
  let treasureAdventure;
  let goldToken;
  let equipmentNFT;
  let owner;
  let player1;
  let player2;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    const TreasureAdventure = await ethers.getContractFactory("TreasureAdventure");
    treasureAdventure = await TreasureAdventure.deploy();
    await treasureAdventure.waitForDeployment();

    const goldTokenAddress = await treasureAdventure.goldToken();
    const equipmentNFTAddress = await treasureAdventure.equipmentNFT();

    goldToken = await ethers.getContractAt("AdventureGold", goldTokenAddress);
    equipmentNFT = await ethers.getContractAt("Equipment", equipmentNFTAddress);
  });

  describe("Player Registration", function () {
    it("Should register a new player", async function () {
      await treasureAdventure.connect(player1).registerPlayer("TestPlayer");
      
      const playerData = await treasureAdventure.getPlayer(player1.address);
      expect(playerData.name).to.equal("TestPlayer");
      expect(playerData.level).to.equal(1);
      expect(playerData.initialized).to.be.true;
    });

    it("Should give initial gold to new players", async function () {
      await treasureAdventure.connect(player1).registerPlayer("TestPlayer");
      
      const balance = await treasureAdventure.getGoldBalance(player1.address);
      expect(balance).to.equal(ethers.parseEther("100"));
    });

    it("Should not allow duplicate registration", async function () {
      await treasureAdventure.connect(player1).registerPlayer("TestPlayer");
      
      await expect(
        treasureAdventure.connect(player1).registerPlayer("TestPlayer2")
      ).to.be.revertedWith("Player already registered");
    });
  });

  describe("Battle System", function () {
    beforeEach(async function () {
      await treasureAdventure.connect(player1).registerPlayer("TestPlayer");
    });

    it("Should complete battle and gain experience and gold", async function () {
      await treasureAdventure.connect(player1).completeBattle(50, 100, 1);
      
      const playerData = await treasureAdventure.getPlayer(player1.address);
      expect(playerData.experience).to.equal(50);
      expect(playerData.stamina).to.equal(23); // 24 - 1
      
      const balance = await treasureAdventure.getGoldBalance(player1.address);
      expect(balance).to.equal(ethers.parseEther("200")); // 100 initial + 100 from battle
    });

    it("Should level up when experience threshold is reached", async function () {
      // Complete battle to get close to level up (level 1 needs 100 exp)
      await treasureAdventure.connect(player1).completeBattle(100, 50, 1);
      
      const playerData = await treasureAdventure.getPlayer(player1.address);
      expect(playerData.level).to.equal(2);
      expect(playerData.experience).to.equal(0); // Should reset after level up
    });

    it("Should not allow battle without enough stamina", async function () {
      // Use up all stamina
      for (let i = 0; i < 24; i++) {
        await treasureAdventure.connect(player1).completeBattle(10, 10, 1);
      }
      
      await expect(
        treasureAdventure.connect(player1).completeBattle(10, 10, 1)
      ).to.be.revertedWith("Not enough stamina");
    });
  });

  describe("Treasure Box System", function () {
    beforeEach(async function () {
      await treasureAdventure.connect(player1).registerPlayer("TestPlayer");
    });

    it("Should claim treasure boxes based on time", async function () {
      // Fast forward time by 2 hours (should get 2 boxes)
      await ethers.provider.send("evm_increaseTime", [7200]);
      await ethers.provider.send("evm_mine");
      
      const boxesClaimed = await treasureAdventure.connect(player1).claimTreasureBoxes();
      // Note: This is a call, not a transaction, so it returns the value
      
      // Make the actual transaction
      await treasureAdventure.connect(player1).claimTreasureBoxes();
      
      const balance = await treasureAdventure.getGoldBalance(player1.address);
      expect(balance).to.be.above(ethers.parseEther("100")); // Should be more than initial
    });
  });
});