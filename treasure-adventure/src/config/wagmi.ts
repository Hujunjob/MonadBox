import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { monad, monadTestnet } from './chains';
import { defineChain } from 'viem';
import { burnerWallet } from '../connectors/BurnerConnector';
import { metaMask, walletConnect, injected } from 'wagmi/connectors';

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
      http: [import.meta.env.VITE_LOCAL_RPC_URL || 'http://127.0.0.1:8545'],
    },
  },
});

const projectId = 'YOUR_PROJECT_ID'; // Get from https://cloud.walletconnect.com

export const config = createConfig({
  chains: [monadTestnet, monad, localhost],
  connectors: [
    // 标准连接器放在前面，让用户有选择
    injected(),
    metaMask(),
    walletConnect({ projectId }),
    // Burner Wallet Connector - 作为选项之一
    burnerWallet({
      enableBurnerWallet: true,
      alwaysAutoConnectToBurnerOnLoad: false, // 不自动连接
      storageKey: 'treasure-adventure-burner-wallet',
    }),
  ],
  transports: {
    [monadTestnet.id]: http(),
    [monad.id]: http(),
    [localhost.id]: http(),
  },
  ssr: false,
});