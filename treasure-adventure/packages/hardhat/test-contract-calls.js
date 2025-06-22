const hre = require('hardhat');

async function testContractCalls() {
  try {
    console.log('=== Testing Contract Calls ===');
    
    const gameManager = await hre.ethers.getContractAt('GameManager', '0x0165878A594ca255338adfa4d48449f69242Eb8F');
    const [signer] = await hre.ethers.getSigners();
    
    console.log('Using account:', signer.address);
    
    // 测试1: 检查玩家状态
    console.log('\n1. Checking player status...');
    try {
      const playerData = await gameManager.getPlayer(signer.address);
      console.log('Player data:', {
        name: playerData.name,
        initialized: playerData.initialized,
        level: playerData.level.toString(),
        stamina: playerData.stamina.toString(),
        experience: playerData.experience.toString()
      });
      
      if (playerData.initialized) {
        console.log('✅ Player is already registered');
        await testBattleCall(gameManager, playerData);
        await testTreasureBoxCalls(gameManager);
        return;
      }
    } catch (error) {
      console.log('Player not found, can register');
    }
    
    // 测试2: 模拟注册
    console.log('\n2. Testing registerPlayer...');
    const testName = 'TestPlayer123';
    
    try {
      await gameManager.registerPlayer.staticCall(testName);
      console.log('✅ RegisterPlayer simulation successful');
      
      const gasEstimate = await gameManager.registerPlayer.estimateGas(testName);
      console.log('📊 Gas estimate:', gasEstimate.toString());
      
    } catch (error) {
      console.log('❌ RegisterPlayer simulation failed:', error.message);
      return;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testBattleCall(gameManager, playerData) {
  console.log('\n3. Testing completeBattle...');
  
  if (playerData.stamina < 1) {
    console.log('❌ Not enough stamina for battle');
    return;
  }
  
  try {
    const experienceGained = 50;
    const goldGained = 10; 
    const staminaCost = 1;
    const victory = true;
    const monsterLevel = 1;
    
    await gameManager.completeBattle.staticCall(experienceGained, goldGained, staminaCost, victory, monsterLevel);
    console.log('✅ Battle simulation successful');
    
    const gasEstimate = await gameManager.completeBattle.estimateGas(experienceGained, goldGained, staminaCost, victory, monsterLevel);
    console.log('📊 Gas estimate:', gasEstimate.toString());
    
  } catch (error) {
    console.log('❌ Battle simulation failed:', error.message);
  }
}

async function testTreasureBoxCalls(gameManager) {
  console.log('\n4. Testing treasure box functions...');
  
  try {
    // 测试领取离线宝箱
    const claimableBoxes = await gameManager.getClaimableOfflineBoxes('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    console.log('📦 Claimable offline boxes:', claimableBoxes.toString());
    
    if (claimableBoxes > 0) {
      await gameManager.claimOfflineTreasureBoxes.staticCall();
      console.log('✅ Claim offline boxes simulation successful');
    }
    
    // 测试宝箱数量
    const boxCount = await gameManager.getPlayerTreasureBoxCount('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    const unopenedCount = await gameManager.getUnopenedBoxCount('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    
    console.log('📊 Total boxes:', boxCount.toString());
    console.log('📊 Unopened boxes:', unopenedCount.toString());
    
    // 如果有未开启的宝箱，测试开箱
    if (unopenedCount > 0) {
      try {
        await gameManager.openTreasureBox.staticCall(0);
        console.log('✅ Open treasure box simulation successful');
      } catch (error) {
        console.log('❌ Open treasure box failed:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Treasure box test failed:', error.message);
  }
}

testContractCalls().catch(console.error);