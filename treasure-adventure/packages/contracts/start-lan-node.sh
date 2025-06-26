#!/bin/bash

# 启动Hardhat节点，允许局域网访问
echo "启动Hardhat节点，允许局域网访问..."
echo "网络配置: 0.0.0.0:8545"
echo "Chain ID: 31337"
echo ""

# 获取本机IP地址
LOCAL_IP=$(ifconfig | grep "inet " | grep -Fv 127.0.0.1 | awk '{print $2}' | head -1)
echo "本机IP地址: $LOCAL_IP"
echo "局域网访问地址: http://$LOCAL_IP:8545"
echo ""

# 启动节点
npx hardhat node --hostname 0.0.0.0 --port 8545