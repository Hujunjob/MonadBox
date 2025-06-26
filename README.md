# Monad Hunter游戏开发指南

# Monad测试网可升级合约部署指南

本指南介绍如何将Treasure Adventure游戏的可升级合约部署到Monad测试网。

## 网络信息

- **网络名称**: Monad Testnet
- **Chain ID**: 10143
- **货币符号**: MON
- **RPC端点**: https://testnet-rpc.monad.xyz
- **区块浏览器**: https://testnet-explorer.monad.xyz

## 部署前准备

### 1. 配置私钥

在 `packages/contracts/.env` 文件中设置您的私钥：

```bash
# Monad Testnet Private Key
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
```

**重要提示**: 
- 请确保使用测试网专用的私钥，不要使用主网私钥
- 不要将包含真实资金的私钥提交到版本控制系统

### 2. 获取测试币

您需要获取一些MON测试币来支付部署费用：

1. 访问Monad测试网水龙头（如果可用）
2. 或联系项目方获取测试币
3. 确保部署地址有足够的MON余额

### 3. 安装依赖

```bash
cd packages/contracts
npm install
```

## 可升级合约特性

本项目使用 **UUPS (Universal Upgradeable Proxy Standard)** 代理模式部署可升级合约：

### 升级优势

- ✅ **状态保留**: 升级时完全保留合约状态和用户数据
- ✅ **地址不变**: 代理合约地址在升级时保持不变
- ✅ **权限控制**: 只有合约所有者可以执行升级
- ✅ **Gas优化**: 使用Gas费用优化的代理模式
- ✅ **向后兼容**: 升级不会破坏现有功能

### 升级风险提醒

- ⚠️ **升级权限**: 部署账户拥有升级权限，请妥善保管私钥
- ⚠️ **测试重要**: 升级前请在测试环境充分测试新实现
- ⚠️ **不可逆**: 升级操作不可撤销，请谨慎操作

## 部署步骤

### 1. 编译合约

```bash
npm run compile
```

### 2. 部署可升级合约到Monad测试网

```bash
npm run deploy:monad
```

或者使用完整命令名：

```bash
npm run deploy:upgradeable:monad
```

### 3. 部署基础版本（不推荐）

如果需要部署非升级版本（不推荐）：

```bash
npm run deploy:monad:basic
```

### 部署过程

可升级部署命令会：
- 使用UUPS代理模式部署所有游戏合约
- 创建代理合约和实现合约
- 设置必要的权限和授权
- 生成前端配置文件
- 保存部署信息到 `deployments-monad-testnet-upgradeable.json`

### 4. 验证部署

部署成功后，您会看到类似以下的输出：

```
🎉 === Monad测试网可升级合约部署完成 ===
🌐 网络: Monad Testnet (Chain ID: 10143)
🔗 RPC: https://testnet-rpc.monad.xyz
🔮 代理模式: UUPS (Universal Upgradeable Proxy Standard)
💰 部署账户: 0x...
📋 代理合约地址 (升级时保持不变):
   playerNFT: 0x...
   equipmentNFT: 0x...
   itemNFT: 0x...
   goldToken: 0x...
   treasureBoxSystem: 0x...
   battleSystem: 0x...
   equipmentSystem: 0x...
   market: 0x...
   rank: 0x...
   superMarket: 0x...

🔮 升级特性:
• ✅ 使用UUPS代理模式，支持合约升级
• ✅ 代理地址在升级时保持不变
• ✅ 状态数据在升级时完全保留
• ✅ 只有合约所有者可以执行升级
• ✅ Gas费用优化的代理模式
```

## 前端配置

部署脚本会自动生成前端配置文件：

- **文件位置**: `src/contracts/monad-testnet-upgradeable.ts`
- **包含内容**: 代理合约地址、ABI、网络配置、升级特性信息

### 使用前端配置

```typescript
import { 
  MONAD_TESTNET_UPGRADEABLE_CONTRACT_ADDRESSES, 
  MONAD_TESTNET_CONFIG,
  UPGRADE_FEATURES,
  PLAYER_NFT_ABI 
} from '../contracts/monad-testnet-upgradeable';

// 使用代理合约地址（这些地址在升级时保持不变）
const playerAddress = MONAD_TESTNET_UPGRADEABLE_CONTRACT_ADDRESSES.PLAYER_NFT;

// 使用网络配置
const chainId = MONAD_TESTNET_CONFIG.chainId; // 10143
const isUpgradeable = MONAD_TESTNET_CONFIG.upgradeable; // true

// 查看升级特性
console.log(UPGRADE_FEATURES.pattern); // 'UUPS'
console.log(UPGRADE_FEATURES.benefits); // 升级优势列表
```

## 文件说明

### 配置文件

- `packages/contracts/.env` - 私钥配置
- `packages/contracts/hardhat.config.js` - Hardhat网络配置
- `src/config/chains.ts` - 前端链配置
- `src/config/wagmi.ts` - Wagmi配置

### 部署文件

- `packages/contracts/scripts/deployMonadTestnetUpgradeable.js` - Monad测试网可升级合约部署脚本
- `packages/contracts/scripts/deployMonadTestnet.js` - Monad测试网基础合约部署脚本（不推荐）
- `packages/contracts/deployments-monad-testnet-upgradeable.json` - 可升级部署信息记录
- `src/contracts/monad-testnet-upgradeable.ts` - 前端可升级合约配置（自动生成）

### 包管理

- `packages/contracts/package.json` - 添加了Monad可升级部署命令和dotenv依赖

## 合约升级

### 升级前准备

1. **测试新实现**: 在本地环境充分测试新的合约实现
2. **备份数据**: 记录重要的合约状态数据
3. **检查兼容性**: 确保新实现与现有状态兼容
4. **验证权限**: 确认部署账户拥有升级权限

### 升级步骤

1. **准备新实现合约**:
```bash
# 修改合约代码后重新编译
npm run compile
```

2. **执行升级**:
```bash
# 使用hardhat升级插件
npx hardhat run scripts/upgrade-contracts.js --network monadTestnet
```

3. **验证升级**:
- 检查代理合约地址是否保持不变
- 验证状态数据是否完整保留
- 测试新功能是否正常工作

### 升级脚本示例

创建升级脚本 `scripts/upgrade-contracts.js`:

```javascript
const { upgrades } = require("hardhat");

async function main() {
  // 获取新的合约工厂
  const PlayerV2 = await ethers.getContractFactory("PlayerV2");
  
  // 升级合约（使用现有代理地址）
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, PlayerV2);
  
  console.log("Contract upgraded:", await upgraded.getAddress());
}
```

### 升级注意事项

- ⚠️ **不可逆性**: 升级操作无法撤销
- ⚠️ **存储布局**: 新实现不能改变现有存储变量的位置
- ⚠️ **初始化**: 升级后可能需要调用新的初始化函数
- ⚠️ **权限检查**: 确保只有授权账户能执行升级

## 故障排除

### 1. 部署失败

如果部署失败，请检查：

- 私钥是否正确设置
- 账户是否有足够的MON余额
- 网络连接是否正常
- RPC端点是否可访问

### 2. 前端连接问题

如果前端无法连接到Monad测试网：

- 确保MetaMask中添加了Monad测试网
- 检查网络配置是否正确
- 验证合约地址是否正确

### 3. 手动添加网络到MetaMask

在MetaMask中手动添加Monad测试网：

- **网络名称**: Monad Testnet
- **RPC URL**: https://testnet-rpc.monad.xyz
- **链ID**: 10143
- **货币符号**: MON
- **区块浏览器**: https://testnet-explorer.monad.xyz

## 安全提醒

1. **永远不要**将包含真实资金的私钥用于测试网部署
2. **永远不要**将私钥提交到版本控制系统
3. 使用专门的测试账户进行测试网部署
4. 部署前请仔细检查网络配置

## 下一步

部署完成后，您可以：

1. 在前端切换到Monad测试网
2. 测试游戏的各项功能
3. 验证可升级合约交互是否正常
4. 进行完整的端到端测试
5. 测试合约升级流程（可选）

## 最佳实践

### 开发环境

1. **本地测试**: 先在本地hardhat网络测试可升级合约
2. **测试网验证**: 在Monad测试网部署和测试
3. **升级测试**: 测试合约升级流程
4. **主网部署**: 最后部署到主网

### 安全建议

1. **多重签名**: 考虑使用多重签名钱包作为合约所有者
2. **时间锁**: 为升级操作添加时间延迟
3. **权限分离**: 将不同权限分配给不同账户
4. **监控告警**: 监控合约升级事件

### 版本管理

1. **标记版本**: 为每次升级打上版本标签
2. **文档更新**: 升级时更新相关文档
3. **变更日志**: 记录每次升级的变更内容
4. **回滚计划**: 准备紧急情况下的应对方案

---

**注意**: 这是测试网的可升级合约部署，所有资产都没有真实价值。可升级功能为合约提供了灵活性，但也带来了额外的复杂性和风险。请在主网部署前进行充分测试，并制定完善的升级策略。