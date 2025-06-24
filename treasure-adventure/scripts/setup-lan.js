const os = require('os');
const fs = require('fs');
const path = require('path');

// 获取本机 IP 地址
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // 跳过内部地址和 IPv6
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return null;
}

const localIP = getLocalIP();

if (!localIP) {
  console.log('❌ 无法获取本机 IP 地址');
  process.exit(1);
}

console.log(`🌐 检测到本机 IP 地址: ${localIP}`);

// 更新 .env 文件
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.log('📝 创建新的 .env 文件');
}

// 更新 RPC URL
const newRpcUrl = `http://${localIP}:8545`;
const rpcUrlRegex = /VITE_LOCAL_RPC_URL=.*/;

if (rpcUrlRegex.test(envContent)) {
  envContent = envContent.replace(rpcUrlRegex, `VITE_LOCAL_RPC_URL=${newRpcUrl}`);
} else {
  envContent += `\nVITE_LOCAL_RPC_URL=${newRpcUrl}`;
}

fs.writeFileSync(envPath, envContent);

console.log(`✅ 已更新 .env 文件`);
console.log(`📡 RPC URL: ${newRpcUrl}`);
console.log(`\n🚀 使用以下命令启动服务:`);
console.log(`   npm run contracts:node-lan  # 启动区块链节点`);
console.log(`   npm run dev                 # 启动前端应用`);
console.log(`\n📱 局域网内其他设备可以访问:`);
console.log(`   区块链节点: ${newRpcUrl}`);
console.log(`   前端应用: http://${localIP}:5173`);
console.log(`\n⚠️  请确保防火墙允许 8545 和 5173 端口的访问`);