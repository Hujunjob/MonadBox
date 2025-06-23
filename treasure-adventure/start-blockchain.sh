#!/bin/bash

echo "🚀 启动本地区块链网络..."

# 进入hardhat目录
cd packages/contracts

# 启动本地网络，启用自动挖矿
echo "📦 启动Hardhat网络节点 (自动出块每1秒)..."
npx hardhat node --hostname 127.0.0.1 --port 8545

echo "✅ 区块链网络已启动在 http://127.0.0.1:8545"
echo "⛓️  Chain ID: 31337"
echo "⏰ 自动出块间隔: 1秒"