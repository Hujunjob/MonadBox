import { 
  createConnector,
} from 'wagmi';
import { 
  generatePrivateKey, 
  privateKeyToAccount, 
  type PrivateKeyAccount 
} from 'viem/accounts';
import { 
  createWalletClient, 
  createPublicClient,
  http,
  type Chain,
  type WalletClient,
  custom,
} from 'viem';

export interface BurnerConnectorOptions {
  enableBurnerWallet?: boolean;
  alwaysAutoConnectToBurnerOnLoad?: boolean;
  storageKey?: string;
}

interface BurnerWalletData {
  privateKey: `0x${string}`;
  address: `0x${string}`;
  createdAt: number;
}

export function burnerWallet(options: BurnerConnectorOptions = {}) {
  const storageKey = options.storageKey || 'treasure-adventure-burner-wallet';
  let account: PrivateKeyAccount | null = null;
  let walletClient: WalletClient | null = null;

  // 创建自定义 EIP-1193 provider
  const createBurnerProvider = (chain: Chain, acc: PrivateKeyAccount) => {
    return {
      request: async ({ method, params }: { method: string; params?: any[] }) => {
        // 为 burner wallet 创建专用的 wallet client
        const client = createWalletClient({
          account: acc,
          chain,
          transport: http(),
        });

        switch (method) {
          case 'eth_accounts':
            return [acc.address];
          
          case 'eth_chainId':
            return `0x${chain.id.toString(16)}`;
          
          case 'eth_sendTransaction':
            // 使用 wallet client 直接发送交易，避免通过节点
            const [transaction] = params || [];
            return await client.sendTransaction({
              to: transaction.to,
              value: transaction.value ? BigInt(transaction.value) : undefined,
              data: transaction.data,
              gas: transaction.gas ? BigInt(transaction.gas) : undefined,
              gasPrice: transaction.gasPrice ? BigInt(transaction.gasPrice) : undefined,
            });
          
          case 'personal_sign':
            const [message] = params || [];
            return await client.signMessage({ message });
          
          case 'eth_signTypedData_v4':
            const [, typedData] = params || [];
            return await client.signTypedData(JSON.parse(typedData));
          
          default:
            // 对于其他方法，使用 HTTP transport 查询节点
            const publicClient = createPublicClient({
              chain,
              transport: http(),
            });
            // @ts-ignore
            return await publicClient.request({ method, params });
        }
      },
    };
  };

  const generateBurnerWallet = (): BurnerWalletData => {
    const privateKey = generatePrivateKey();
    const acc = privateKeyToAccount(privateKey);
    
    const walletData: BurnerWalletData = {
      privateKey,
      address: acc.address,
      createdAt: Date.now(),
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(walletData));
    } catch (error) {
      console.error('Error saving burner wallet to storage:', error);
    }
    
    return walletData;
  };

  const getBurnerWalletFromStorage = (): BurnerWalletData | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;
      return JSON.parse(stored) as BurnerWalletData;
    } catch (error) {
      console.error('Error reading burner wallet from storage:', error);
      return null;
    }
  };

  const getAccount = (): PrivateKeyAccount => {
    if (account) {
      return account;
    }

    let walletData = getBurnerWalletFromStorage();
    
    if (!walletData) {
      walletData = generateBurnerWallet();
    }

    account = privateKeyToAccount(walletData.privateKey);
    return account;
  };

  return createConnector((config) => ({
    id: 'burnerWallet',
    name: 'Burner Wallet',
    type: 'burnerWallet' as const,
    
    async connect({ chainId }: { chainId?: number } = {}) {
      const acc = getAccount();
      const chain = config.chains.find(c => c.id === chainId) || config.chains[0];
      
      if (!chain) {
        throw new Error('No chains configured');
      }

      // 使用自定义 provider 来处理交易签名
      const provider = createBurnerProvider(chain, acc);
      walletClient = createWalletClient({
        account: acc,
        chain,
        transport: custom(provider),
      });

      return {
        accounts: [acc.address],
        chainId: chain.id,
      };
    },

    async disconnect() {
      account = null;
      walletClient = null;
    },

    async getAccounts() {
      const acc = getAccount();
      return [acc.address];
    },

    async getChainId() {
      if (!walletClient) {
        return config.chains[0]?.id || 1;
      }
      return walletClient.chain?.id ?? 698;
    },

    async getProvider({ chainId }: { chainId?: number } = {}) {
      const acc = getAccount();
      const chain = config.chains.find(c => c.id === chainId) || config.chains[0];
      
      if (!chain) {
        throw new Error('No chains configured');
      }

      // 创建自定义 provider，处理 burner wallet 的交易签名
      const provider = createBurnerProvider(chain, acc);
      
      // 创建使用自定义 provider 的 wallet client
      walletClient = createWalletClient({
        account: acc,
        chain,
        transport: custom(provider),
      });
      
      return walletClient;
    },

    async isAuthorized() {
      try {
        const walletData = getBurnerWalletFromStorage();
        return !!walletData && (options.alwaysAutoConnectToBurnerOnLoad ?? false);
      } catch {
        return false;
      }
    },

    async switchChain({ chainId }: { chainId: number }) {
      const chain = config.chains.find(c => c.id === chainId);
      if (!chain) {
        throw new Error(`Chain ${chainId} not configured`);
      }

      if (walletClient && account) {
        const provider = createBurnerProvider(chain, account);
        walletClient = createWalletClient({
          account,
          chain,
          transport: custom(provider),
        });
      }

      return chain;
    },

    onAccountsChanged() {},
    onChainChanged() {},
    onDisconnect() {
      account = null;
      walletClient = null;
    },
  }));
}