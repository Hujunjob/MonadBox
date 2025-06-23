const hre = require('hardhat');

async function simpleTest() {
  try {
    console.log('=== Simple Contract Test ===');
    
    const deployments = require('./deploymentsV2.json');
    delete require.cache[require.resolve('./deploymentsV2.json')];
    const [signer] = await hre.ethers.getSigners();
    
    console.log('Signer:', signer.address);
    console.log('Player NFT Address:', deployments.playerNFT);
    
    // 检查合约代码
    const code = await hre.ethers.provider.getCode(deployments.playerNFT);
    console.log('Contract code length:', code.length);
    
    if (code === '0x') {
      console.log('❌ No contract deployed at this address!');
      return;
    }
    
    // 获取合约实例
    const playerNFT = await hre.ethers.getContractAt('Player', deployments.playerNFT);
    
    // 测试简单的view函数
    try {
      const name = await playerNFT.name();
      console.log('Contract name:', name);
      
      const symbol = await playerNFT.symbol();
      console.log('Contract symbol:', symbol);
      
      const balance = await playerNFT.balanceOf(signer.address);
      console.log('Balance:', balance.toString());
      
      console.log('✅ Contract is working correctly!');
      
    } catch (error) {
      console.log('❌ Contract call failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

simpleTest().catch(console.error);