import { useState, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { burnerWalletService } from '../services/burnerWallet';
import { useWalletContext } from '../contexts/WalletContext';
import type { Abi, ContractFunctionArgs, ContractFunctionName } from 'viem';

interface ContractCallResult {
  hash?: `0x${string}`;
  success: boolean;
  error?: string;
}

export const useBurnerWalletContract = () => {
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient();
  const { isBurnerWallet } = useWalletContext();

  const writeContract = useCallback(async <
    TAbi extends Abi,
    TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>
  >(
    options: {
      address: `0x${string}`;
      abi: TAbi;
      functionName: TFunctionName;
      args?: ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName>;
      value?: bigint;
    }
  ): Promise<ContractCallResult> => {
    if (!isBurnerWallet) {
      return { success: false, error: 'Burner wallet not active' };
    }

    const walletClient = burnerWalletService.getBurnerWalletClient();
    if (!walletClient) {
      return { success: false, error: 'Burner wallet client not available' };
    }

    try {
      setIsLoading(true);

      // Simulate the transaction first to check for errors
      if (publicClient) {
        try {
          await publicClient.simulateContract({
            address: options.address,
            abi: options.abi,
            functionName: options.functionName,
            args: options.args || [],
            account: walletClient.account,
            value: options.value,
          } as any);
        } catch (simulationError) {
          console.error('Transaction simulation failed:', simulationError);
          return { 
            success: false, 
            error: `Simulation failed: ${simulationError instanceof Error ? simulationError.message : 'Unknown error'}` 
          };
        }
      }

      // Execute the transaction automatically with burner wallet
      const hash = await walletClient.writeContract({
        address: options.address,
        abi: options.abi,
        functionName: options.functionName,
        args: options.args || [],
        value: options.value,
      } as any);

      // Wait for transaction confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      return { hash, success: true };
    } catch (error) {
      console.error('Contract call failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Transaction failed' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [isBurnerWallet, publicClient]);

  const readContract = useCallback(async <
    TAbi extends Abi,
    TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>
  >(
    options: {
      address: `0x${string}`;
      abi: TAbi;
      functionName: TFunctionName;
      args?: ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName>;
    }
  ) => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    return publicClient.readContract({
      address: options.address,
      abi: options.abi,
      functionName: options.functionName,
      args: options.args || [],
    } as any);
  }, [publicClient]);

  const getBalance = useCallback(async (address?: `0x${string}`) => {
    if (!publicClient) return null;
    
    const targetAddress = address || burnerWalletService.getBurnerWalletAddress();
    if (!targetAddress) return null;

    return publicClient.getBalance({ address: targetAddress });
  }, [publicClient]);

  return {
    writeContract,
    readContract,
    getBalance,
    isLoading,
    isBurnerWallet,
    burnerAddress: burnerWalletService.getBurnerWalletAddress(),
  };
};