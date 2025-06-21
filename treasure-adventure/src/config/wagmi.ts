import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { monad } from './chains';

export const config = getDefaultConfig({
  appName: 'Treasure Adventure',
  projectId: 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [monad],
  ssr: false,
});