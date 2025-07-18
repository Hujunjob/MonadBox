# 🔧 链 ID 错误修复指南

## ❌ 错误信息
```
trying to send raw tx to a wrong chain id
```

## ✅ 已修复的问题

### 1. Wagmi 配置更新
- 明确定义了本地链配置，确保链 ID 为 31337
- 使用 `defineChain` 自定义链配置
- 移除了可能的链 ID 冲突

### 2. Hardhat 配置更新  
- 明确指定 localhost 和 hardhat 网络的链 ID 为 31337
- 确保前后端配置一致

### 3. 新增调试工具
- **NetworkDebugger 组件**: 实时显示网络状态
- **一键网络切换**: 自动添加和切换到正确网络
- **详细错误提示**: 帮助快速定位问题

## 🛠️ 解决步骤

### 步骤 1: 确认 Hardhat 节点运行
```bash
npm run contracts:node
```
应该看到类似输出：
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

### 步骤 2: 检查网络配置
打开游戏页面，在角色页面查看 "网络调试信息" 面板：
- 当前链 ID 应该显示 31337 ✅
- 如果显示其他数字 ❌，点击 "切换到本地网络" 按钮

### 步骤 3: 手动配置网络（如果自动切换失败）
在 MetaMask 中手动添加网络：
- **网络名称**: Localhost 8545
- **RPC URL**: http://127.0.0.1:8545  
- **链 ID**: 31337
- **货币符号**: ETH

### 步骤 4: 导入测试账户
使用提供的测试账户私钥：
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 步骤 5: 重新尝试注册
1. 确认网络调试器显示 ✅ 状态
2. 点击 "启用 Web3 模式"
3. 点击 "注册玩家"
4. 填写玩家名称并确认交易

## 🔍 常见问题排查

### Q: 网络调试器显示错误的链 ID
**A**: 点击 "切换到本地网络" 按钮，或手动在 MetaMask 中切换

### Q: MetaMask 显示 "Internal JSON-RPC error"
**A**: 确认 Hardhat 节点正在运行，重启节点后重试

### Q: 交易一直待确认
**A**: 检查 MetaMask 是否连接到正确网络，清除待处理交易

### Q: 余额为 0
**A**: 确认已导入测试账户私钥，检查网络是否正确

## 📋 验证清单

- [ ] Hardhat 节点运行在 http://127.0.0.1:8545
- [ ] MetaMask 连接到 Localhost 8545 网络  
- [ ] 链 ID 显示为 31337 ✅
- [ ] 使用测试账户，余额充足
- [ ] 网络调试器显示 "网络配置正确"

## 🎯 修复结果

修复后应该能够：
- ✅ 成功注册链上玩家
- ✅ 进行战斗并获得奖励
- ✅ 领取宝箱和金币
- ✅ 所有交易正常确认

如果仍有问题，请检查浏览器控制台错误信息！