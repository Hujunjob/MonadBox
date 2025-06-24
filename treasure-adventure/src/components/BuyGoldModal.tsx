import React, { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, SUPER_MARKET_ABI } from '../contracts';
import { useHybridGameStore } from '../store/web3GameStore';

interface BuyGoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: number;
}

const BuyGoldModal: React.FC<BuyGoldModalProps> = ({ isOpen, onClose, playerId }) => {
  const [goldAmount, setGoldAmount] = useState<string>('1000');
  const [ethRequired, setEthRequired] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const hybridStore = useHybridGameStore();

  // 购买限制常量 (从合约同步)
  const MIN_GOLD = 100;
  const MAX_GOLD = 1000000;
  const EXCHANGE_RATE = 10000; // 1 ETH = 10000 Gold

  // 合约交互hooks
  const { 
    writeContract, 
    data: hash, 
    error: writeError, 
    isPending: isWritePending 
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({ 
    hash 
  });

  // 计算所需ETH
  useEffect(() => {
    const goldValue = parseFloat(goldAmount) || 0;
    if (goldValue > 0) {
      // goldAmount是以gold为单位，需要转换为wei
      const goldInWei = parseEther(goldAmount.toString());
      const ethInWei = goldInWei / BigInt(EXCHANGE_RATE);
      setEthRequired(formatEther(ethInWei));
    } else {
      setEthRequired('0');
    }
  }, [goldAmount]);

  // 监听交易确认
  useEffect(() => {
    if (isConfirmed) {
      setIsLoading(false);
      // 刷新玩家数据
      hybridStore.refetchPlayer();
      onClose();
    }
  }, [isConfirmed, hybridStore, onClose]);

  // 监听错误
  useEffect(() => {
    if (writeError || confirmError) {
      setIsLoading(false);
      console.error('Purchase error:', writeError || confirmError);
    }
  }, [writeError, confirmError]);

  const handleGoldAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 只允许数字
    if (/^\d*$/.test(value)) {
      setGoldAmount(value);
    }
  };

  const handlePurchase = async () => {
    const goldValue = parseFloat(goldAmount);
    
    // 验证输入
    if (!goldValue || goldValue < MIN_GOLD || goldValue > MAX_GOLD) {
      alert(`请输入有效的金币数量 (${MIN_GOLD} - ${MAX_GOLD})`);
      return;
    }

    if (!playerId) {
      alert('玩家ID无效');
      return;
    }

    setIsLoading(true);

    try {
      // goldAmount需要转换为wei单位
      const goldInWei = parseEther(goldAmount.toString());
      const ethInWei = goldInWei / BigInt(EXCHANGE_RATE);

      writeContract({
        address: CONTRACT_ADDRESSES.SUPER_MARKET,
        abi: SUPER_MARKET_ABI,
        functionName: 'buyGold',
        args: [BigInt(playerId), goldInWei],
        value: ethInWei,
      });
    } catch (error) {
      console.error('Purchase failed:', error);
      setIsLoading(false);
    }
  };

  const isValidAmount = () => {
    const goldValue = parseFloat(goldAmount);
    return goldValue >= MIN_GOLD && goldValue <= MAX_GOLD;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>购买金币</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="buy-gold-form">
            <div className="form-group">
              <label htmlFor="goldAmount">金币数量:</label>
              <input
                id="goldAmount"
                type="text"
                value={goldAmount}
                onChange={handleGoldAmountChange}
                placeholder={`输入金币数量 (${MIN_GOLD} - ${MAX_GOLD})`}
                className="form-input"
              />
              <div className="input-range">
                范围: {MIN_GOLD.toLocaleString()} - {MAX_GOLD.toLocaleString()} 金币
              </div>
            </div>

            <div className="form-group">
              <label>所需ETH:</label>
              <div className="eth-display">
                {ethRequired} ETH
              </div>
              <div className="exchange-rate">
                汇率: 1 ETH = {EXCHANGE_RATE.toLocaleString()} 金币
              </div>
            </div>

            <div className="form-actions">
              <button
                className={`purchase-btn ${!isValidAmount() || isLoading ? 'disabled' : ''}`}
                onClick={handlePurchase}
                disabled={!isValidAmount() || isLoading}
              >
                {isLoading ? (
                  isWritePending ? '确认交易中...' : 
                  isConfirming ? '等待确认...' : 
                  '处理中...'
                ) : '购买'}
              </button>
              <button className="cancel-btn" onClick={onClose}>
                取消
              </button>
            </div>

            {(writeError || confirmError) && (
              <div className="error-message">
                交易失败: {(writeError || confirmError)?.message}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: #f8f9fa;
          border-radius: 8px;
          width: 90%;
          max-width: 380px;
          color: #333;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          border: 1px solid #ddd;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #e0e0e0;
          background: #fff;
          border-radius: 8px 8px 0 0;
        }

        .modal-header h2 {
          margin: 0;
          color: #333;
          font-size: 18px;
        }

        .close-btn {
          background: none;
          border: none;
          color: #666;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 25px;
          height: 25px;
        }

        .close-btn:hover {
          color: #333;
        }

        .modal-body {
          padding: 15px 20px 20px;
        }

        .buy-gold-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-weight: 600;
          color: #555;
          font-size: 14px;
        }

        .form-input {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: #fff;
          color: #333;
          font-size: 14px;
        }

        .form-input:focus {
          outline: none;
          border-color: #ffd700;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
        }

        .input-range {
          font-size: 11px;
          color: #666;
        }

        .eth-display {
          padding: 10px 12px;
          background: #f0f8ff;
          border: 1px solid #e0e8f0;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          color: #2563eb;
        }

        .exchange-rate {
          font-size: 11px;
          color: #666;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .purchase-btn {
          flex: 1;
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }

        .purchase-btn:hover:not(.disabled) {
          background: #45a049;
        }

        .purchase-btn.disabled {
          background: #ccc;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .cancel-btn {
          flex: 1;
          padding: 10px 20px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }

        .cancel-btn:hover {
          background: #5a6268;
        }

        .error-message {
          color: #dc3545;
          font-size: 12px;
          margin-top: 8px;
          padding: 8px 12px;
          background: #f8d7da;
          border-radius: 4px;
          border: 1px solid #f5c6cb;
        }
      `}</style>
    </div>
  );
};

export default BuyGoldModal;