const fs = require('fs');
const path = require('path');

// 读取部署地址
const deploymentsPath = path.join(__dirname, '../packages/hardhat/deploymentsV2.json');
const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));

// 合约名称映射
const contracts = {
  'PLAYER_NFT': 'Player',
  'EQUIPMENT_NFT': 'Equipment', 
  'GOLD_TOKEN': 'AdventureGold',
  'TREASURE_BOX_SYSTEM': 'TreasureBoxSystem',
  'BATTLE_SYSTEM': 'BattleSystemV2',
  'EQUIPMENT_SYSTEM': 'EquipmentSystem'
};

// 生成前端 ABI 文件
function generateABI() {
  let output = `// 合约地址配置（自动生成）
export const CONTRACT_ADDRESSES = {
  // 本地测试网络地址（从 packages/hardhat/deploymentsV2.json 自动更新）
`;

  // 生成地址配置
  for (const [key, contractName] of Object.entries(contracts)) {
    const address = deployments[contractName];
    output += `  ${key}: '${address}' as \`0x\${string}\`,\n`;
  }

  output += `} as const;

// =============================================================================
// 合约 ABI 定义（自动生成）
// =============================================================================

`;

  // 生成每个合约的 ABI
  for (const [key, contractName] of Object.entries(contracts)) {
    try {
      // 读取编译后的 ABI
      const artifactPath = path.join(__dirname, `../packages/hardhat/artifacts/contracts/${getContractFile(contractName)}.sol/${contractName}.json`);
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      
      // 生成 ABI 常量
      const abiName = `${key}_ABI`;
      output += `// ${contractName} 合约 ABI\n`;
      output += `export const ${abiName} = ${JSON.stringify(artifact.abi, null, 2)} as const;\n\n`;
      
    } catch (error) {
      console.error(`Error reading ABI for ${contractName}:`, error.message);
    }
  }

  // 写入文件
  const outputPath = path.join(__dirname, '../src/contracts/index.ts');
  fs.writeFileSync(outputPath, output);
  console.log('✅ ABI文件已生成:', outputPath);
}

// 获取合约文件名
function getContractFile(contractName) {
  const fileMap = {
    'Player': 'Player',
    'Equipment': 'Equipment',
    'AdventureGold': 'AdventureGold',
    'TreasureBoxSystem': 'TreasureBoxSystem',
    'BattleSystemV2': 'BattleSystemV2',
    'EquipmentSystem': 'EquipmentSystem'
  };
  return fileMap[contractName] || contractName;
}

generateABI();