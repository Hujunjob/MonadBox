# 获取测试 ETH 指南

## 方法1: 使用 Hardhat 提供的测试账户

本地 Hardhat 网络提供了 20 个预充值的测试账户，每个账户有 10000 ETH：

### 账户信息
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

### 导入步骤：
1. 打开 MetaMask
2. 点击账户图标 → "导入账户"
3. 粘贴私钥（如上面的 Private Key）
4. 确认导入

### 配置网络：
1. 打开 MetaMask 设置
2. 网络 → 添加网络 → 手动添加网络
3. 填入以下信息：
   - 网络名称: Localhost 8545
   - RPC URL: http://127.0.0.1:8545
   - 链 ID: 31337
   - 货币符号: ETH

## 方法2: 自动配置脚本

我创建了一个便捷的配置脚本：