import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { monad } from './chains';
import { defineChain } from 'viem';

// 自定义本地链配置，确保链 ID 正确
export const localhost = defineChain({
  id: 31337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
});

export const config = getDefaultConfig({
  appName: 'Treasure Adventure',
  projectId: 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [localhost, monad], // 使用自定义的本地链配置
  ssr: false,
});