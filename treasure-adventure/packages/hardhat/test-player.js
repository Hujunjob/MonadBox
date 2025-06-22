const { ethers } = require('hardhat');

async function testPlayer() {
  console.log('Testing player registration status...');
  
  // 获取部署的合约
  const TreasureAdventure = await ethers.getContractFactory('TreasureAdventure');
  const treasureAdventure = TreasureAdventure.attach('0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0');
  
  // 测试账户地址
  const testAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  
  try {
    const playerData = await treasureAdventure.getPlayer(testAddress);
    
    console.log('=== Player Data ===');
    console.log('Name:', playerData[0]);
    console.log('Level:', playerData[1].toString());
    console.log('Experience:', playerData[2].toString());
    console.log('Health:', playerData[3].toString());
    console.log('Max Health:', playerData[4].toString());
    console.log('Attack:', playerData[5].toString());
    console.log('Defense:', playerData[6].toString());
    console.log('Agility:', playerData[7].toString());
    console.log('Critical Rate:', playerData[8].toString());
    console.log('Critical Damage:', playerData[9].toString());
    console.log('Stamina:', playerData[10].toString());
    console.log('Max Stamina:', playerData[11].toString());
    console.log('Last Stamina Time:', playerData[12].toString());
    console.log('Current Forest Level:', playerData[13].toString());
    console.log('Current Forest Progress:', playerData[14].toString());
    console.log('Last Treasure Box Time:', playerData[15].toString());
    console.log('Initialized:', playerData[16]);
    console.log('Job:', playerData[17].toString());
    
    if (playerData[16]) {
      console.log('\n✅ Player IS registered in the contract!');
    } else {
      console.log('\n❌ Player is NOT registered in the contract');
    }
    
    // 检查金币余额
    const goldTokenAddress = await treasureAdventure.goldToken();
    console.log('\nGold Token Address:', goldTokenAddress);
    
    const AdventureGold = await ethers.getContractFactory('AdventureGold');
    const goldToken = AdventureGold.attach(goldTokenAddress);
    const balance = await goldToken.balanceOf(testAddress);
    console.log('Gold Balance:', ethers.formatEther(balance), 'GOLD');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPlayer().catch(console.error);