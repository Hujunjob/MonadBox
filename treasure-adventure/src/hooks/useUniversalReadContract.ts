import { useReadContract } from 'wagmi';
import { useWalletContext } from '../contexts/WalletContext';
import { useBurnerWalletContract } from './useBurnerWalletContract';
import { useState, useEffect } from 'react';

interface ReadContractConfig {
  address: `0x${string}`;
  abi: any;
  functionName: string;
  args?: any[];
  query?: {
    enabled?: boolean;
  };
}

export function useUniversalReadContract(config: ReadContractConfig) {
  const { isBurnerWallet, isConnected } = useWalletContext();
  const { readContract } = useBurnerWalletContract();
  const [burnerData, setBurnerData] = useState<any>(null);
  const [burnerError, setBurnerError] = useState<Error | null>(null);
  const [burnerLoading, setBurnerLoading] = useState(false);

  // Use wagmi's useReadContract for external wallets
  const wagmiRead = useReadContract({
    ...config,
    query: {
      ...config.query,
      enabled: !isBurnerWallet && (config.query?.enabled ?? true),
    },
  });

  // Handle burner wallet reads
  useEffect(() => {
    if (!isBurnerWallet || !isConnected || !(config.query?.enabled ?? true)) {
      return;
    }

    const performRead = async () => {
      setBurnerLoading(true);
      setBurnerError(null);
      
      try {
        const result = await readContract({
          address: config.address,
          abi: config.abi,
          functionName: config.functionName,
          args: config.args || [],
        });
        setBurnerData(result);
      } catch (error) {
        setBurnerError(error as Error);
        console.error('Burner wallet read contract error:', error);
      } finally {
        setBurnerLoading(false);
      }
    };

    performRead();
  }, [
    isBurnerWallet,
    isConnected,
    config.address,
    config.functionName,
    JSON.stringify(config.args),
    config.query?.enabled,
    readContract,
  ]);

  // Create refetch function
  const refetch = async () => {
    if (isBurnerWallet) {
      if (!isConnected || !(config.query?.enabled ?? true)) return;
      
      setBurnerLoading(true);
      setBurnerError(null);
      
      try {
        const result = await readContract({
          address: config.address,
          abi: config.abi,
          functionName: config.functionName,
          args: config.args || [],
        });
        setBurnerData(result);
        return { data: result };
      } catch (error) {
        setBurnerError(error as Error);
        throw error;
      } finally {
        setBurnerLoading(false);
      }
    } else {
      return wagmiRead.refetch();
    }
  };

  if (isBurnerWallet) {
    return {
      data: burnerData,
      error: burnerError,
      isLoading: burnerLoading,
      refetch,
      isSuccess: !burnerError && burnerData !== null,
      isPending: burnerLoading,
    };
  }

  return {
    ...wagmiRead,
    refetch,
  };
}