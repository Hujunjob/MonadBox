#!/bin/bash

# Monad 测试网快速部署脚本

echo "🌐 Monad 测试网部署脚本"
echo "================================"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在"
    echo "💡 请复制 .env.example 为 .env 并填入您的私钥"
    echo "   cp .env.example .env"
    exit 1
fi

# 检查私钥配置
if ! grep -q "PRIVATE_KEY=" .env || grep -q "your_private_key_here" .env; then
    echo "❌ 请在 .env 文件中设置 PRIVATE_KEY"
    echo "💡 编辑 .env 文件，填入您的私钥（不含0x前缀）"
    exit 1
fi

echo "✅ 环境配置检查通过"

# 安装依赖
echo "📦 安装依赖..."
npm install

# 编译合约
echo "🔨 编译合约..."
npx hardhat compile

if [ $? -ne 0 ]; then
    echo "❌ 合约编译失败"
    exit 1
fi

echo "✅ 合约编译成功"

# 部署到 Monad 测试网
echo "🚀 部署到 Monad 测试网..."
echo "🔗 网络: Monad Testnet (Chain ID: 10143)"
echo "🌐 RPC: https://testnet-rpc.monad.xyz"
echo "🔍 浏览器: https://testnet.monadexplorer.com"
echo ""

npx hardhat run scripts/deployToMonadTestnet.js --network monadTestnet

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 部署成功！"
    echo "📄 部署信息已保存到 deploymentsMonadTestnet.json"
    echo "🔄 前端合约配置已自动更新"
    echo ""
    echo "🔗 有用链接:"
    echo "   浏览器: https://testnet.monadexplorer.com"
    echo "   水龙头: https://faucet.testnet.monad.xyz"
    echo "   文档: https://docs.monad.xyz"
    echo ""
    echo "💡 下一步:"
    echo "   1. 在区块浏览器中验证合约地址"
    echo "   2. 启动前端测试: cd ../../ && npm run dev"
    echo "   3. 在 MetaMask 中添加 Monad 测试网"
else
    echo ""
    echo "❌ 部署失败"
    echo "💡 常见问题排查:"
    echo "   1. 检查账户余额是否足够"
    echo "   2. 从水龙头获取测试代币: https://faucet.testnet.monad.xyz"
    echo "   3. 检查网络连接"
    echo "   4. 验证私钥格式是否正确"
    exit 1
fi