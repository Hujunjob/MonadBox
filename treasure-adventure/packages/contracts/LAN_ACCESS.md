# 局域网访问Hardhat节点配置说明

## 配置概述

已配置Hardhat节点支持局域网访问，允许局域网内的其他设备连接到本地区块链节点。

## 启动方式

### 方式1: 使用npm脚本
```bash
npm run node:lan
```

### 方式2: 使用启动脚本
```bash
./start-lan-node.sh
```

### 方式3: 直接使用hardhat命令
```bash
npx hardhat node --hostname 0.0.0.0 --port 8545
```

## 网络配置

- **节点地址**: 0.0.0.0:8545 (监听所有网络接口)
- **Chain ID**: 31337
- **协议**: HTTP
- **默认账户**: 使用Hardhat默认测试账户

## 连接方式

### 获取本机IP地址
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

### 局域网连接地址
假设你的本机IP是 `192.168.1.100`，则：
- **RPC URL**: `http://192.168.1.100:8545`
- **Chain ID**: `31337`
- **网络名称**: `Hardhat Local (LAN)`

## MetaMask配置

1. 打开MetaMask
2. 点击网络下拉菜单
3. 选择"添加网络"
4. 输入以下信息：
   - 网络名称: `Hardhat Local (LAN)`
   - 新的RPC URL: `http://[你的IP地址]:8545`
   - 链ID: `31337`
   - 货币符号: `ETH`

## 前端应用配置

在你的前端应用中，将RPC URL配置为：
```javascript
const provider = new ethers.providers.JsonRpcProvider('http://[你的IP地址]:8545');
```

## 防火墙配置

### macOS
确保防火墙允许端口8545的连接：
```bash
sudo pfctl -f /etc/pf.conf
```

### Windows
在Windows防火墙中添加端口8545的入站规则。

### Linux (UFW)
```bash
sudo ufw allow 8545
```

## 安全注意事项

⚠️ **警告**: 此配置仅用于开发和测试环境！

- 不要在生产环境中使用此配置
- 确保只在可信的局域网环境中使用
- 定期重启节点以重置状态
- 不要在公网环境中暴露8545端口

## 常见问题

### 1. 连接被拒绝
- 检查防火墙设置
- 确认IP地址正确
- 验证节点是否正在运行

### 2. 交易失败
- 检查账户是否有足够的ETH
- 确认合约地址正确
- 验证网络配置

### 3. 无法访问合约
- 确认合约已部署到正确的网络
- 检查合约地址和ABI是否正确

## 测试连接

可以使用curl测试连接：
```bash
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://[你的IP地址]:8545
```

成功的响应应该返回当前区块号。