const hre = require('hardhat');

async function testSimulationFrontend() {
  try {
    console.log('=== Testing Frontend Simulation Pattern ===');
    
    const deployments = require('./deploymentsV2.json');
    const playerNFT = await hre.ethers.getContractAt('Player', deployments.playerNFT);
    const battleSystem = await hre.ethers.getContractAt('BattleSystemV2', deployments.battleSystem);
    const treasureBoxSystem = await hre.ethers.getContractAt('TreasureBoxSystem', deployments.treasureBoxSystem);
    
    const [signer] = await hre.ethers.getSigners();
    console.log('Using account:', signer.address);
    
    // 测试1: 模拟注册Player NFT（前端模拟调用模式）
    console.log('\n1. Testing simulation pattern for mintPlayer...');
    const testName = 'SimTestPlayer';
    
    try {
      // 第1步：模拟调用（前端会这样做）
      console.log('🔍 Step 1: Simulating mintPlayer call...');
      const result = await playerNFT.mintPlayer.staticCall(signer.address, testName);
      console.log('✅ Simulation successful! Would return token ID:', result.toString());
      
      // 第2步：Gas估算
      console.log('⛽ Step 2: Estimating gas...');
      const gasEstimate = await playerNFT.mintPlayer.estimateGas(signer.address, testName);
      console.log('📊 Gas estimate:', gasEstimate.toString());
      
      // 第3步：实际执行（前端会在模拟成功后执行）
      console.log('🚀 Step 3: Executing real transaction...');
      const tx = await playerNFT.mintPlayer(signer.address, testName);
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed! Hash:', receipt.hash);
      
      // 验证结果
      const tokenId = result; // 从模拟结果获取token ID
      console.log('🔍 Step 4: Verifying minted player...');
      const playerData = await playerNFT.getPlayer(tokenId);
      console.log('Player data verified:', {
        name: playerData.name,
        level: playerData.level.toString(),
        health: playerData.health.toString(),
        stamina: playerData.stamina.toString(),
        initialized: playerData.initialized
      });
      
      // 测试战斗模拟
      await testBattleSimulation(battleSystem, tokenId, playerData);
      
    } catch (error) {
      console.log('❌ Simulation test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testBattleSimulation(battleSystem, playerId, playerData) {
  console.log('\n2. Testing battle simulation pattern...');
  
  if (playerData.stamina < 1) {
    console.log('❌ Not enough stamina for battle test');
    return;
  }
  
  try {
    const experienceGained = 50;
    const staminaCost = 1;
    const victory = true;
    const monsterLevel = 1;
    
    // 第1步：模拟战斗调用
    console.log('🔍 Step 1: Simulating battle...');
    await battleSystem.completeBattle.staticCall(playerId, experienceGained, staminaCost, victory, monsterLevel);
    console.log('✅ Battle simulation successful!');
    
    // 第2步：Gas估算
    console.log('⛽ Step 2: Estimating battle gas...');
    const gasEstimate = await battleSystem.completeBattle.estimateGas(playerId, experienceGained, staminaCost, victory, monsterLevel);
    console.log('📊 Gas estimate:', gasEstimate.toString());
    
    // 第3步：实际执行战斗
    console.log('🚀 Step 3: Executing battle...');
    const tx = await battleSystem.completeBattle(playerId, experienceGained, staminaCost, victory, monsterLevel);
    const receipt = await tx.wait();
    console.log('✅ Battle completed! Hash:', receipt.hash);
    
    console.log('🎉 Frontend simulation pattern test completed successfully!');
    
  } catch (error) {
    console.log('❌ Battle simulation failed:', error.message);
  }
}

testSimulationFrontend().catch(console.error);