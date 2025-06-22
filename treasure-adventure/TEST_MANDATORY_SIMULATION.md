# 测试强制模拟调用功能

## 实现完成的功能

### ✅ 强制模拟调用机制
- 修改 `useSafeContractCall.ts` - 模拟调用参数从可选改为必需
- 创建 `useContractSimulationV2.ts` - 支持新合约架构的模拟调用hooks
- 更新 `useWeb3GameV2.ts` - 实现动态模拟参数管理，遵循React hooks规则

### ✅ 核心安全验证
- **玩家注册**: 调用前必须通过 `useRegisterPlayerSimulation` 验证
- **战斗完成**: 调用前必须通过 `useCompleteBattleSimulation` 验证  
- **宝箱领取**: 调用前必须通过 `useClaimOfflineTreasureBoxesSimulation` 验证
- **宝箱开启**: 调用前必须通过 `useOpenTreasureBoxSimulation` 验证

### ✅ Hook架构设计
- 使用 `useState` 管理模拟参数，避免在函数内调用hooks
- 动态启用/禁用模拟调用，确保只在需要时进行验证
- 异步等待机制确保hook状态更新后再执行合约调用

### ✅ 错误处理机制
- 模拟失败时，`useSafeContractCall` 会阻止实际合约调用
- 提供清晰的错误提示，告知用户模拟验证失败的原因
- 自动重置模拟参数，避免状态污染

## 测试验证步骤

### 1. 启动开发环境
```bash
cd /Users/junhu/git/MonadBox/treasure-adventure
npm run dev
```

### 2. 连接MetaMask
- 确保连接到 `localhost:8545` 网络
- 导入测试账户

### 3. 测试玩家注册
- 尝试注册新玩家
- 验证模拟调用在实际交易前执行
- 确认只有模拟成功的交易才会被提交

### 4. 测试战斗功能
- 完成一次战斗
- 观察控制台中的模拟调用日志
- 验证experience和stamina更新

### 5. 测试宝箱功能
- 领取离线宝箱（如果有）
- 开启宝箱（如果有）
- 验证奖励正确发放

## 关键实现细节

### 动态模拟参数管理
```typescript
const [simulationParams, setSimulationParams] = useState<{
  registerPlayer?: { address: string; name: string; enabled: boolean };
  // ... 其他参数
}>({});

// 在调用前启用模拟
setSimulationParams(prev => ({
  ...prev,
  registerPlayer: { address, name, enabled: true }
}));

// 等待React更新
await new Promise(resolve => setTimeout(resolve, 0));

// 使用模拟结果
await safeCall(contractConfig, registerPlayerSim, options);
```

### 强制模拟验证
```typescript
const safeCall = async (
  contractConfig: any,
  simulationHook: any, // 现在是必需的
  options?: {...}
) => {
  if (!simulationHook) {
    throw new Error('模拟调用是必需的，不能跳过安全验证');
  }
  // ... 验证逻辑
}
```

## 预期行为

### ✅ 正常流程
1. 用户触发合约操作
2. 系统启用对应的模拟调用
3. 模拟调用验证合约状态和参数
4. 模拟成功后执行实际交易
5. 交易完成后重置模拟参数

### ⚠️ 错误流程  
1. 用户触发合约操作
2. 模拟调用失败（余额不足、权限不够等）
3. 系统阻止实际交易执行
4. 显示具体错误信息给用户
5. 重置模拟参数

## 下一步测试项目
- [ ] 验证所有合约调用都通过模拟验证
- [ ] 测试模拟失败时的错误处理
- [ ] 确认用户体验流畅，无明显延迟
- [ ] 检查控制台无React hooks警告