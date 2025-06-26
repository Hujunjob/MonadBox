# Monad 测试网部署指南

## 网络信息

- **网络名称**: Monad Testnet
- **Chain ID**: 10143
- **货币符号**: MON
- **RPC 端点**: https://testnet-rpc.monad.xyz
- **区块浏览器**: https://testnet.monadexplorer.com
- **水龙头**: https://faucet.testnet.monad.xyz

## 部署准备

### 1. 配置环境变量

```bash
# 复制示例配置文件
cp .env.example .env

# 编辑 .env 文件，填入您的私钥
nano .env
```

在 `.env` 文件中设置：
```env
PRIVATE_KEY=your_private_key_here_without_0x_prefix
```

⚠️ **安全提醒**: 
- 私钥不要包含 `0x` 前缀
- 不要将私钥提交到版本控制系统
- 使用测试钱包，不要使用主网钱包

### 2. 获取测试代币

访问 [Monad 测试网水龙头](https://faucet.testnet.monad.xyz) 获取测试 MON 代币。

建议获取至少 **0.5 MON** 用于部署所有合约。

### 3. 配置钱包（MetaMask）

如需在前端测试，请在 MetaMask 中添加 Monad 测试网：

- **网络名称**: Monad Testnet
- **RPC URL**: https://testnet-rpc.monad.xyz  
- **Chain ID**: 10143
- **货币符号**: MON
- **区块浏览器**: https://testnet.monadexplorer.com

## 部署步骤

### 1. 安装依赖

```bash
cd packages/contracts
npm install
```

### 2. 编译合约

```bash
npx hardhat compile
```

### 3. 部署到 Monad 测试网

```bash
npx hardhat run scripts/deployToMonadTestnet.js --network monadTestnet
```

### 4. 验证部署

部署成功后，脚本会：
- 输出所有合约地址
- 自动更新前端 `src/contracts/index.ts` 文件
- 保存部署信息到 `deploymentsMonadTestnet.json`

## 部署后验证

### 1. 检查合约

在 [Monad 测试网浏览器](https://testnet.monadexplorer.com) 中查看部署的合约地址。

### 2. 测试前端连接

```bash
# 返回项目根目录
cd ../../

# 启动前端
npm run dev
```

确保前端能够连接到 Monad 测试网并与合约交互。

## 合约架构

部署的合约包括：

1. **AdventureGold** - 游戏内金币代币
2. **Equipment** - 装备 NFT
3. **Item** - 物品 NFT (血瓶、转职书等)
4. **Player** - 玩家 NFT (不可转移，存储玩家数据)
5. **TreasureBoxSystem** - 宝箱系统
6. **FightSystem** - 回合制战斗系统
7. **BattleSystem** - PvE 战斗管理
8. **EquipmentSystem** - 装备升级系统
9. **Market** - 交易市场
10. **Rank** - PvP 排行榜系统  
11. **SuperMarket** - ETH购买金币系统

## 权限配置

部署脚本会自动配置以下权限：

- TreasureBoxSystem 可以铸造装备和物品奖励
- BattleSystem 可以调用 FightSystem 进行战斗
- Market 可以处理装备和物品交易
- 所有系统合约都有适当的玩家数据访问权限

## 升级功能

所有合约使用 UUPS 代理模式，支持升级：

- 合约地址在升级时保持不变
- 只有 owner 可以授权升级
- 升级时保留所有状态数据

## 故障排除

### 常见问题

1. **余额不足**
   ```
   Error: insufficient funds for intrinsic transaction cost
   ```
   解决：从水龙头获取更多 MON 代币

2. **网络连接问题**
   ```
   Error: could not detect network
   ```
   解决：检查网络连接和 RPC 端点

3. **私钥格式错误**
   ```
   Error: invalid private key
   ```
   解决：确保私钥不包含 `0x` 前缀

### 获取帮助

- 检查 [Monad 官方文档](https://docs.monad.xyz)
- 在 [Monad Discord](https://discord.gg/monad) 寻求帮助
- 查看项目 GitHub Issues

## 生产部署注意事项

在生产环境部署时：

1. 使用专用的部署钱包
2. 确保充足的代币余额
3. 备份所有私钥和助记词
4. 在主网部署前在测试网充分测试
5. 考虑使用多签钱包管理合约

## 监控和维护

- 定期检查合约状态
- 监控交易和事件日志
- 保持合约代码的最新版本
- 根据需要进行合约升级