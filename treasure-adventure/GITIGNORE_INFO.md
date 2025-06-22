# Git Ignore Configuration

此项目已配置完整的 `.gitignore` 文件以避免提交不必要的文件到版本控制。

## 被忽略的文件类型

### 📦 依赖和构建产物
- `node_modules/` - npm/yarn依赖包
- `dist/` - 前端构建输出
- `build/` - 其他构建输出
- `package-lock.json` - 锁定文件

### ⛓️ Hardhat 特定文件
- `packages/hardhat/cache/` - Hardhat编译缓存
- `packages/hardhat/artifacts/` - 合约编译产物
- `packages/hardhat/coverage/` - 测试覆盖率报告
- `packages/hardhat/typechain/` - TypeScript类型生成
- `.hardhat_console_history` - Hardhat控制台历史

### 🔐 环境和配置文件
- `.env*` - 环境变量文件（包含私钥等敏感信息）
- `*.local` - 本地配置文件

### 💻 IDE 和编辑器文件
- `.vscode/` - VSCode配置（保留extensions.json）
- `.idea/` - IntelliJ IDEA配置
- `*.swp`, `*.swo` - Vim临时文件

### 🖥️ 操作系统文件
- `.DS_Store` - macOS系统文件
- `Thumbs.db` - Windows缩略图缓存
- `._*` - macOS资源分叉文件

### 🔍 分析和测试文件
- `coverage/` - 测试覆盖率
- `.slither/` - Slither静态分析
- `gas-report.txt` - Gas使用报告

### 🚀 部署文件 (可选忽略)
- `deployments/` - 部署记录（已注释，可根据需要启用）
- `deploymentsV2.json` - 部署配置（已注释）

## 注意事项

1. **环境变量**: `.env` 文件被忽略以保护私钥和敏感配置
2. **部署文件**: 部署配置文件默认不被忽略，便于团队共享合约地址
3. **双重保护**: 根目录和 `packages/hardhat/` 都有 `.gitignore` 文件

## 如果需要强制添加被忽略的文件

```bash
git add -f path/to/ignored/file
```

## 检查被忽略的文件

```bash
git status --ignored
```