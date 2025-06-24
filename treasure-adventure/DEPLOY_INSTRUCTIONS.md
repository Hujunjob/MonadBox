# 部署更新后的合约

由于移除了挑战冷却功能，需要重新部署 Rank 合约。

## 步骤：

1. **编译合约**
   ```bash
   npm run contracts:compile
   ```

2. **重新部署合约**
   ```bash
   npm run contracts:deploy
   ```

3. **更新前端合约地址和 ABI**
   - 部署完成后，复制新的合约地址
   - 更新 `src/contracts/index.ts` 中的 RANK 合约地址
   - 如果有 ABI 变化，同时更新 RANK_ABI

## 主要变更：

### 合约变更 (Rank.sol)：
- ✅ 移除了 `lastChallengeTime` 映射
- ✅ 移除了 `CHALLENGE_COOLDOWN` 常量  
- ✅ 移除了 fight 函数中的冷却检查
- ✅ 移除了 `getNextChallengeTime` 函数
- ✅ 简化了 `canChallenge` 函数（始终返回 true）

### 前端变更 (Rank.tsx)：
- ✅ 移除了冷却相关的状态变量
- ✅ 移除了倒计时 useEffect
- ✅ 移除了冷却检查逻辑
- ✅ 移除了 UI 中的冷却时间显示
- ✅ 简化了挑战按钮状态逻辑

### Hook 变更 (useRank.ts)：
- ✅ 移除了 `getNextChallengeTime` 函数
- ✅ 保留了 `canChallenge` 函数（现在始终返回 true）

现在用户可以随时挑战，没有任何冷却限制！