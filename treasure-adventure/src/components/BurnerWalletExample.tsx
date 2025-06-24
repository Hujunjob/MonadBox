import React, { useState } from 'react';
import { useBurnerWalletContract } from '../hooks/useBurnerWalletContract';
import { useWalletContext } from '../contexts/WalletContext';
import { BurnerWalletFunding } from './BurnerWalletFunding';
import { formatEther } from 'viem';

export const BurnerWalletExample: React.FC = () => {
  const [showFunding, setShowFunding] = useState(false);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string>('');
  const { writeContract, getBalance, isLoading, isBurnerWallet, burnerAddress } = useBurnerWalletContract();
  const { walletType } = useWalletContext();

  const handleGetBalance = async () => {
    try {
      const bal = await getBalance();
      setBalance(bal);
    } catch (error) {
      console.error('Failed to get balance:', error);
    }
  };

  // Example contract interaction - replace with your actual contract
  const handleTestTransaction = async () => {
    if (!isBurnerWallet) {
      alert('Please connect with burner wallet first');
      return;
    }

    try {
      // This is a placeholder - replace with actual contract address and ABI
      // const result = await writeContract({
      //   address: '0x...', // Your contract address
      //   abi: [...], // Your contract ABI
      //   functionName: 'someFunction',
      //   args: [],
      // });
      
      // For demo purposes, just show that automatic signing would work
      alert('This would automatically sign and send a transaction without user confirmation!');
      
      // if (result.success && result.hash) {
      //   setLastTxHash(result.hash);
      //   alert(`Transaction sent automatically! Hash: ${result.hash}`);
      // } else {
      //   alert(`Transaction failed: ${result.error}`);
      // }
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  if (!isBurnerWallet) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">Burner Wallet Test</h3>
        <p className="text-gray-600">Please connect with a burner wallet to test automatic signing.</p>
        <p className="text-sm text-gray-500 mt-2">Current wallet type: {walletType || 'none'}</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-green-50">
      <h3 className="text-lg font-semibold mb-2">🔥 Burner Wallet Active</h3>
      
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-600">Address:</p>
          <p className="font-mono text-xs">{burnerAddress}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Balance:</p>
          <p className="text-lg">
            {balance !== null ? `${formatEther(balance)} ETH` : 'Click to check'}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleGetBalance}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Check Balance
          </button>

          <button
            onClick={() => setShowFunding(true)}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
          >
            Fund Wallet
          </button>

          <button
            onClick={handleTestTransaction}
            disabled={isLoading}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? 'Signing...' : 'Test Auto-Sign'}
          </button>
        </div>

        {lastTxHash && (
          <div>
            <p className="text-sm text-gray-600">Last Transaction:</p>
            <p className="font-mono text-xs break-all">{lastTxHash}</p>
          </div>
        )}

        <div className="bg-white p-3 rounded border">
          <p className="text-sm">
            <strong>✨ Automatic Signing Enabled:</strong> Contract calls will be signed automatically without user confirmation, providing seamless gameplay experience.
          </p>
        </div>
      </div>

      <BurnerWalletFunding
        isOpen={showFunding}
        onClose={() => setShowFunding(false)}
      />
    </div>
  );
};