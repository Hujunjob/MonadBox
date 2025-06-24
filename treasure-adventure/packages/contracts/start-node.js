const { spawn } = require('child_process');
const os = require('os');

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
  return '192.168.1.100'; // 默认值，请根据你的网络修改
}

const localIP = getLocalIP();
console.log(`🌐 本机 IP 地址: ${localIP}`);
console.log(`🔗 局域网访问地址: http://${localIP}:8545`);
console.log(`📱 移动端可使用此地址访问区块链节点\n`);

// 启动 Hardhat 节点，绑定到所有网络接口
const hardhatNode = spawn('npx', [
  'hardhat', 
  'node',
  '--hostname', '0.0.0.0', // 绑定到所有网络接口
  '--port', '8545'
], {
  stdio: 'inherit',
  cwd: __dirname
});

hardhatNode.on('close', (code) => {
  console.log(`Hardhat node exited with code ${code}`);
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n👋 关闭 Hardhat 节点...');
  hardhatNode.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  hardhatNode.kill('SIGTERM');
  process.exit(0);
});