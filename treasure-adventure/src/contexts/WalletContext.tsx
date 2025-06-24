import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { burnerWalletService } from '../services/burnerWallet';

interface WalletContextType {
  walletType: 'external' | 'burner' | null;
  isConnected: boolean;
  address: `0x${string}` | undefined;
  showWalletChoice: boolean;
  setShowWalletChoice: (show: boolean) => void;
  handleWalletConnected: (type: 'external' | 'burner') => void;
  disconnectWallet: () => void;
  isBurnerWallet: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletType, setWalletType] = useState<'external' | 'burner' | null>(null);
  const [showWalletChoice, setShowWalletChoice] = useState(false);
  const { isConnected: isExternalConnected, address: externalAddress } = useAccount();
  const { disconnect } = useDisconnect();

  const burnerAddress = burnerWalletService.getBurnerWalletAddress();
  const isBurnerActive = burnerWalletService.isBurnerWalletActive();

  const isConnected = isExternalConnected || isBurnerActive;
  const address = isExternalConnected ? externalAddress : burnerAddress;
  const isBurnerWallet = walletType === 'burner' && isBurnerActive;

  useEffect(() => {
    if (isExternalConnected) {
      setWalletType('external');
      burnerWalletService.deactivateBurnerWallet();
    } else if (isBurnerActive) {
      setWalletType('burner');
    } else {
      setWalletType(null);
    }
  }, [isExternalConnected, isBurnerActive]);

  const handleWalletConnected = (type: 'external' | 'burner') => {
    setWalletType(type);
    if (type === 'burner' && isExternalConnected) {
      disconnect();
    }
  };

  const disconnectWallet = () => {
    if (walletType === 'external') {
      disconnect();
    } else if (walletType === 'burner') {
      burnerWalletService.deactivateBurnerWallet();
    }
    setWalletType(null);
  };

  const contextValue: WalletContextType = {
    walletType,
    isConnected,
    address,
    showWalletChoice,
    setShowWalletChoice,
    handleWalletConnected,
    disconnectWallet,
    isBurnerWallet,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};