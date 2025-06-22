# 宝物冒险 Web3 集成指南

## 🎯 项目概述

本项目已成功集成 Scaffold-ETH 2 框架，将原有的本地游戏转换为混合模式的区块链游戏。玩家可以在本地模式和 Web3 模式之间切换，享受传统游戏体验的同时获得区块链的透明性和真正的数字资产所有权。

## 🏗️ 架构说明

### 项目结构
```
treasure-adventure/
├── packages/
│   └── hardhat/           # 智能合约项目
│       ├── contracts/     # Solidity 合约
│       ├── scripts/       # 部署脚本
│       ├── test/         # 合约测试
│       └── hardhat.config.js
├── src/
│   ├── components/       # React 组件
│   ├── contracts/        # 合约 ABI 和地址
│   ├── hooks/           # Web3 钩子函数
│   └── store/           # 状态管理
└── ...
```

### 智能合约架构

#### 1. TreasureAdventure.sol (主游戏合约)
- 玩家注册和基本属性管理
- 战斗系统（链下计算，链上验证）
- 体力系统
- 宝箱领取系统

#### 2. AdventureGold.sol (游戏代币)
- ERC-20 标准代币
- 游戏内金币系统
- 铸造和分发机制

#### 3. Equipment.sol (装备 NFT)
- ERC-721 标准 NFT
- 装备属性和稀有度
- 可交易的装备系统

## 🚀 快速开始

### 1. 启动本地区块链网络
```bash
npm run contracts:node
```

### 2. 部署智能合约
```bash
npm run contracts:deploy
```

### 3. 启动前端应用
```bash
npm run dev
```

### 4. 连接钱包
- 打开浏览器访问 http://localhost:5173
- 点击 "Connect Wallet" 连接 MetaMask
- 切换到 Localhost 8545 网络

### 5. 切换到 Web3 模式
- 在角色页面找到 Web3 模式切换器
- 点击 "启用 Web3 模式"
- 首次使用需要注册链上玩家

## 🎮 游戏模式

### 本地模式
- **数据存储**: 浏览器本地存储
- **响应速度**: 即时
- **数据持久性**: 依赖本地缓存
- **适用场景**: 快速游戏体验、离线游戏

### Web3 模式  
- **数据存储**: 区块链
- **响应速度**: 需要交易确认
- **数据持久性**: 永久且去中心化
- **适用场景**: 资产保值、可交易装备

### 混合模式
- **自动同步**: 本地操作自动队列，连网时同步
- **离线游戏**: 本地模式下继续游戏
- **数据备份**: 重要数据在链上备份

## 🔧 核心功能

### 玩家系统
- **注册**: `registerPlayer(name)` - 链上创建玩家档案
- **属性**: 等级、经验、血量、攻击力等存储在链上
- **体力**: 自动恢复机制，链上验证

### 战斗系统
- **混合计算**: 战斗逻辑在前端计算，结果提交到链上
- **经验获取**: `completeBattle(exp, gold, stamina)` 
- **防作弊**: 链上验证战斗结果的合理性

### 装备系统（规划中）
- **NFT 装备**: 每件装备都是独特的 NFT
- **属性验证**: 装备属性存储在链上
- **交易市场**: 玩家间可自由交易装备

### 经济系统
- **金币代币**: AdventureGold (GOLD) ERC-20 代币
- **获取方式**: 战斗胜利、开启宝箱
- **使用场景**: 购买装备、升级强化

## 🛠️ 开发指南

### 智能合约开发
```bash
# 编译合约
npm run contracts:compile

# 运行测试
npm run contracts:test

# 部署到本地网络
npm run contracts:deploy
```

### 前端 Web3 集成

#### 使用 Web3 钩子
```typescript
import { useWeb3Game } from '../hooks/useWeb3Game';

function GameComponent() {
  const {
    playerData,
    isPlayerRegistered,
    registerPlayer,
    completeBattle,
    isPending
  } = useWeb3Game();
  
  // 组件逻辑
}
```

#### 混合状态管理
```typescript
import { useHybridGameStore } from '../store/web3GameStore';

function GameComponent() {
  const {
    isWeb3Mode,
    player,
    toggleWeb3Mode,
    syncWithBlockchain
  } = useHybridGameStore();
  
  // 根据模式调整逻辑
}
```

### 添加新功能

#### 1. 智能合约端
```solidity
// 在 TreasureAdventure.sol 中添加新函数
function newGameFeature(uint256 param) external {
    Player storage player = players[msg.sender];
    require(player.initialized, "Player not registered");
    
    // 功能逻辑
    emit NewFeatureUsed(msg.sender, param);
}
```

#### 2. 前端集成
```typescript
// 在 contracts/index.ts 中添加 ABI
{
  "inputs": [{"internalType": "uint256","name": "param","type": "uint256"}],
  "name": "newGameFeature",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
}

// 在 hooks/useWeb3Game.ts 中添加函数
const useNewFeature = async (param: number) => {
  writeContract({
    address: CONTRACT_ADDRESSES.TREASURE_ADVENTURE,
    abi: TREASURE_ADVENTURE_ABI,
    functionName: 'newGameFeature',
    args: [param],
  });
};
```

## 🧪 测试

### 智能合约测试
```bash
npm run contracts:test
```

### 功能测试流程
1. **注册测试**: 使用不同钱包地址注册多个玩家
2. **战斗测试**: 验证经验和金币获取
3. **体力测试**: 验证体力消耗和恢复
4. **宝箱测试**: 验证时间间隔和奖励分发

## 🔐 安全考虑

### 智能合约安全
- ✅ 使用 OpenZeppelin 安全库
- ✅ 防重入攻击保护
- ✅ 整数溢出保护
- ✅ 权限控制 (Ownable)

### 前端安全
- ✅ 输入验证和清理
- ✅ 私钥不在前端存储
- ✅ 交易签名用户确认

## 🚢 部署指南

### 测试网部署
1. 配置 hardhat.config.js 添加测试网
2. 设置环境变量 (私钥、RPC URL)
3. 部署并验证合约
4. 更新前端合约地址

### 主网部署
1. 安全审计智能合约
2. 配置生产环境参数
3. 多重签名部署
4. 逐步迁移用户数据

## 📈 未来规划

### 短期目标 (1-2个月)
- [ ] 装备交易市场
- [ ] 多人对战系统
- [ ] 公会功能
- [ ] 链上排行榜

### 中期目标 (3-6个月)
- [ ] 治理代币和 DAO
- [ ] 跨链资产桥接
- [ ] NFT 宠物系统
- [ ] 元宇宙集成

### 长期目标 (6-12个月)
- [ ] 移动端应用
- [ ] AR/VR 支持
- [ ] AI 驱动的游戏内容
- [ ] 社区创作工具

## 🔗 相关链接

- [Scaffold-ETH 2 文档](https://docs.scaffoldeth.io/)
- [OpenZeppelin 合约库](https://docs.openzeppelin.com/contracts/)
- [Wagmi 文档](https://wagmi.sh/)
- [RainbowKit 文档](https://www.rainbowkit.com/)

## 🤝 贡献指南

1. Fork 项目仓库
2. 创建功能分支
3. 提交代码和测试
4. 创建 Pull Request
5. 代码审查和合并

## 📞 支持

如有问题或建议，请：
- 创建 GitHub Issue
- 参与社区讨论
- 查看文档和示例