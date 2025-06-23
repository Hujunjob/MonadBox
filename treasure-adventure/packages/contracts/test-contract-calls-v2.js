const hre = require('hardhat');

async function testContractCallsV2() {
  try {
    console.log('=== Testing New Architecture Contract Calls ===');
    
    // 从部署文件读取合约地址
    const deployments = require('./deploymentsV2.json');
    
    const playerNFT = await hre.ethers.getContractAt('Player', deployments.playerNFT);
    const battleSystem = await hre.ethers.getContractAt('BattleSystemV2', deployments.battleSystem);
    const treasureBoxSystem = await hre.ethers.getContractAt('TreasureBoxSystem', deployments.treasureBoxSystem);
    const goldToken = await hre.ethers.getContractAt('AdventureGold', deployments.goldToken);
    
    const [signer] = await hre.ethers.getSigners();
    
    console.log('Using account:', signer.address);
    console.log('Player NFT:', deployments.playerNFT);
    console.log('Battle System:', deployments.battleSystem);
    console.log('Treasure Box System:', deployments.treasureBoxSystem);
    
    // 测试1: 检查Player NFT余额
    console.log('\n1. Checking Player NFT balance...');
    try {
      const balance = await playerNFT.balanceOf(signer.address);
      console.log('Player NFT balance:', balance.toString());
      
      if (balance > 0) {
        const tokenId = await playerNFT.tokenOfOwnerByIndex(signer.address, 0);
        console.log('First Player Token ID:', tokenId.toString());
        
        const playerData = await playerNFT.getPlayer(tokenId);
        console.log('Player data:', {
          name: playerData.name,
          level: playerData.level.toString(),
          stamina: playerData.stamina.toString(),
          experience: playerData.experience.toString(),
          initialized: playerData.initialized
        });
        
        await testBattleCallV2(battleSystem, tokenId, playerData);
        await testTreasureBoxCallsV2(treasureBoxSystem);
        return;
      }
    } catch (error) {
      console.log('Player NFT not found, can register');
    }
    
    // 测试2: 模拟注册Player NFT
    console.log('\n2. Testing mintPlayer (Player NFT registration)...');
    const testName = 'TestPlayer123';
    
    try {
      // 跳过staticCall，直接尝试gas估算
      console.log('⛽ Estimating gas for mintPlayer...');
      const gasEstimate = await playerNFT.mintPlayer.estimateGas(signer.address, testName);
      console.log('📊 Gas estimate:', gasEstimate.toString());
      
      // 实际执行一次铸造
      console.log('🔄 Executing actual mintPlayer transaction...');
      const tx = await playerNFT.mintPlayer(signer.address, testName);
      const receipt = await tx.wait();
      console.log('✅ Player NFT minted successfully! TX hash:', receipt.hash);
      
      // 等待一个区块确认
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 获取新铸造的Player数据
      try {
        const newBalance = await playerNFT.balanceOf(signer.address);
        console.log('New Player NFT balance:', newBalance.toString());
        
        if (newBalance > 0) {
          const tokenId = await playerNFT.tokenOfOwnerByIndex(signer.address, 0);
          console.log('First Player Token ID:', tokenId.toString());
          
          const playerData = await playerNFT.getPlayer(tokenId);
          console.log('Minted Player data:', {
            name: playerData.name,
            level: playerData.level.toString(),
            health: playerData.health.toString(),
            attack: playerData.attack.toString(),
            initialized: playerData.initialized
          });
          
          await testBattleCallV2(battleSystem, tokenId, playerData);
          await testTreasureBoxCallsV2(treasureBoxSystem);
        }
      } catch (balanceError) {
        console.log('⚠️ Balance check failed, but minting transaction was successful');
        console.log('Assuming token ID 1 for the new player...');
        
        try {
          const playerData = await playerNFT.getPlayer(1);
          console.log('Player data for token ID 1:', {
            name: playerData.name,
            level: playerData.level.toString(),
            health: playerData.health.toString(),
            attack: playerData.attack.toString(),
            initialized: playerData.initialized
          });
          
          await testBattleCallV2(battleSystem, 1, playerData);
          await testTreasureBoxCallsV2(treasureBoxSystem);
        } catch (playerError) {
          console.log('❌ Could not read player data:', playerError.message);
        }
      }
      
    } catch (error) {
      console.log('❌ MintPlayer failed:', error.message);
      return;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function testBattleCallV2(battleSystem, playerId, playerData) {
  console.log('\n3. Testing completeBattle V2...');
  
  if (playerData.stamina < 1) {
    console.log('❌ Not enough stamina for battle');
    return;
  }
  
  try {
    const experienceGained = 50;
    const staminaCost = 1;
    const victory = true;
    const monsterLevel = 1;
    
    await battleSystem.completeBattle.staticCall(playerId, experienceGained, staminaCost, victory, monsterLevel);
    console.log('✅ Battle V2 simulation successful');
    
    const gasEstimate = await battleSystem.completeBattle.estimateGas(playerId, experienceGained, staminaCost, victory, monsterLevel);
    console.log('📊 Gas estimate:', gasEstimate.toString());
    
  } catch (error) {
    console.log('❌ Battle V2 simulation failed:', error.message);
  }
}

async function testTreasureBoxCallsV2(treasureBoxSystem) {
  console.log('\n4. Testing treasure box functions V2...');
  
  try {
    // 测试宝箱数量
    const boxCount = await treasureBoxSystem.getPlayerTreasureBoxCount('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    console.log('📊 Total boxes:', boxCount.toString());
    
    // 测试领取离线宝箱
    try {
      await treasureBoxSystem.claimOfflineTreasureBoxes.staticCall();
      console.log('✅ Claim offline boxes V2 simulation successful');
      
      const gasEstimate = await treasureBoxSystem.claimOfflineTreasureBoxes.estimateGas();
      console.log('📊 Gas estimate:', gasEstimate.toString());
    } catch (error) {
      console.log('❌ Claim offline boxes failed:', error.message);
    }
    
    // 如果有宝箱，测试开箱
    if (boxCount > 0) {
      try {
        await treasureBoxSystem.openTreasureBox.staticCall(0);
        console.log('✅ Open treasure box V2 simulation successful');
        
        const gasEstimate = await treasureBoxSystem.openTreasureBox.estimateGas(0);
        console.log('📊 Gas estimate:', gasEstimate.toString());
      } catch (error) {
        console.log('❌ Open treasure box V2 failed:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Treasure box V2 test failed:', error.message);
  }
}

testContractCallsV2().catch(console.error);