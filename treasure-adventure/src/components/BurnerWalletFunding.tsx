import React, { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { useBurnerWalletContract } from '../hooks/useBurnerWalletContract';
import { useWalletContext } from '../contexts/WalletContext';

interface BurnerWalletFundingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BurnerWalletFunding: React.FC<BurnerWalletFundingProps> = ({
  isOpen,
  onClose,
}) => {
  const [balance, setBalance] = useState<bigint | null>(null);
  const [fundingAmount, setFundingAmount] = useState('0.1');
  const [isLoading, setIsLoading] = useState(false);
  const { getBalance, burnerAddress } = useBurnerWalletContract();
  const { isBurnerWallet } = useWalletContext();

  useEffect(() => {
    if (isOpen && isBurnerWallet && burnerAddress) {
      loadBalance();
    }
  }, [isOpen, isBurnerWallet, burnerAddress]);

  const loadBalance = async () => {
    try {
      const bal = await getBalance();
      setBalance(bal);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleFunding = async () => {
    if (!burnerAddress) return;
    
    setIsLoading(true);
    try {
      // For development/testing, we can use test accounts to fund the burner wallet
      // In production, this would need to be handled differently (faucet, bridge, etc.)
      alert(`Funding mechanism not implemented yet. Please manually send ${fundingAmount} ETH to ${burnerAddress}`);
      
      // Refresh balance after funding
      setTimeout(() => {
        loadBalance();
      }, 2000);
    } catch (error) {
      console.error('Funding failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Burner Wallet Funding</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Wallet Address:</p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
              {burnerAddress}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Current Balance:</p>
            <p className="text-lg font-semibold">
              {balance !== null ? `${formatEther(balance)} ETH` : 'Loading...'}
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Funding Amount (ETH):
            </label>
            <input
              type="number"
              value={fundingAmount}
              onChange={(e) => setFundingAmount(e.target.value)}
              className="w-full p-2 border rounded"
              step="0.01"
              min="0"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This is a temporary burner wallet. Only fund it with small amounts needed for gameplay.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleFunding}
              disabled={isLoading}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Request Funding'}
            </button>
            
            <button
              onClick={loadBalance}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 p-2 text-gray-600 hover:text-gray-800"
        >
          Close
        </button>
      </div>
    </div>
  );
};