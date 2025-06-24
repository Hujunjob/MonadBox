import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http, type WalletClient, type Account } from 'viem';
import { localhost } from '../config/wagmi';
import { monad } from '../config/chains';

interface BurnerWalletData {
  privateKey: `0x${string}`;
  address: `0x${string}`;
  createdAt: number;
}

interface BurnerWalletState {
  isActive: boolean;
  account: Account | null;
  walletClient: WalletClient | null;
}

class BurnerWalletService {
  private static instance: BurnerWalletService;
  private storageKey = 'treasure-adventure-burner-wallet';
  private state: BurnerWalletState = {
    isActive: false,
    account: null,
    walletClient: null,
  };

  static getInstance(): BurnerWalletService {
    if (!BurnerWalletService.instance) {
      BurnerWalletService.instance = new BurnerWalletService();
    }
    return BurnerWalletService.instance;
  }

  generateBurnerWallet(): BurnerWalletData {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    
    const walletData: BurnerWalletData = {
      privateKey,
      address: account.address,
      createdAt: Date.now(),
    };

    localStorage.setItem(this.storageKey, JSON.stringify(walletData));
    return walletData;
  }

  getBurnerWallet(): BurnerWalletData | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      return JSON.parse(stored) as BurnerWalletData;
    } catch (error) {
      console.error('Error reading burner wallet from storage:', error);
      return null;
    }
  }

  async createBurnerWalletClient(chainId?: number): Promise<{ account: Account; walletClient: WalletClient }> {
    let walletData = this.getBurnerWallet();
    
    if (!walletData) {
      walletData = this.generateBurnerWallet();
    }

    const account = privateKeyToAccount(walletData.privateKey);
    
    const chain = chainId === 41144 ? monad : localhost;
    
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(),
    });

    this.state = {
      isActive: true,
      account,
      walletClient,
    };

    return { account, walletClient };
  }

  async activateBurnerWallet(chainId?: number): Promise<void> {
    await this.createBurnerWalletClient(chainId);
  }

  deactivateBurnerWallet(): void {
    this.state = {
      isActive: false,
      account: null,
      walletClient: null,
    };
  }

  isBurnerWalletActive(): boolean {
    return this.state.isActive;
  }

  getBurnerWalletAccount(): Account | null {
    return this.state.account;
  }

  getBurnerWalletClient(): WalletClient | null {
    return this.state.walletClient;
  }

  getBurnerWalletAddress(): `0x${string}` | null {
    return this.state.account?.address || null;
  }

  clearBurnerWallet(): void {
    localStorage.removeItem(this.storageKey);
    this.deactivateBurnerWallet();
  }

  async signTransaction(transaction: any): Promise<any> {
    if (!this.state.walletClient) {
      throw new Error('Burner wallet not activated');
    }
    
    return this.state.walletClient.signTransaction(transaction);
  }

  async sendTransaction(transaction: any): Promise<`0x${string}`> {
    if (!this.state.walletClient) {
      throw new Error('Burner wallet not activated');
    }
    
    return this.state.walletClient.sendTransaction(transaction);
  }
}

export const burnerWalletService = BurnerWalletService.getInstance();
export type { BurnerWalletData, BurnerWalletState };