const hre = require('hardhat');

async function testNewArchitecture() {
  try {
    console.log('=== Testing New Architecture Registration ===');
    
    const deployments = require('./deploymentsV2.json');
    console.log('Using deployment addresses:', deployments);
    
    const playerNFT = await hre.ethers.getContractAt('Player', deployments.playerNFT);
    const [signer] = await hre.ethers.getSigners();
    
    console.log('Testing with account:', signer.address);
    
    // 测试注册功能
    const testName = 'FrontendTest';
    
    try {
      console.log('🔍 Testing mintPlayer function...');
      
      // 直接调用合约，跳过模拟
      const tx = await playerNFT.mintPlayer(signer.address, testName);
      console.log('✅ Transaction sent, hash:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed!');
      
      // 检查玩家数据
      const balance = await playerNFT.balanceOf(signer.address);
      console.log('Player NFT balance:', balance.toString());
      
      if (balance > 0) {
        const tokenId = await playerNFT.tokenOfOwnerByIndex(signer.address, balance - 1);
        console.log('Latest token ID:', tokenId.toString());
        
        const playerData = await playerNFT.getPlayer(tokenId);
        console.log('Player data:', {
          name: playerData.name,
          level: playerData.level.toString(),
          health: playerData.health.toString(),
          stamina: playerData.stamina.toString(),
          initialized: playerData.initialized
        });
        
        console.log('🎉 New architecture is working correctly!');
        console.log('Frontend should now be able to use useWeb3GameV2 hooks successfully.');
      }
      
    } catch (error) {
      console.log('❌ Test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Setup error:', error.message);
  }
}

testNewArchitecture().catch(console.error);