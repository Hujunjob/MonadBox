import React, { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, SUPER_MARKET_ABI } from '../contracts';
import { useHybridGameStore } from '../store/web3GameStore';
import './BuyGoldModal.css';
import { useToast } from './ToastManager';

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
  const { showToast } = useToast();
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
      // onClose();
      console.log("onClose");
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
      showToast(`请输入有效的金币数量 (${MIN_GOLD} - ${MAX_GOLD})`);
      return;
    }

    if (!playerId) {
      showToast('玩家ID无效');
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

            {/* {(writeError || confirmError) && (
              <div className="error-message">
                交易失败: {(writeError || confirmError)?.message}
              </div>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyGoldModal;