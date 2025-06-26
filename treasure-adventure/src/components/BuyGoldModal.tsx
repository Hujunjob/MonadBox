import React, { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'viem';
import { useWeb3GameV2 } from '../hooks/useWeb3GameV2';
import '../styles/BuyGoldModal.css';
import { useToast } from './ToastManager';

interface BuyGoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: number;
}

const BuyGoldModal: React.FC<BuyGoldModalProps> = ({ isOpen, onClose }) => {
  const [goldAmount, setGoldAmount] = useState<string>('1000');
  const [ethRequired, setEthRequired] = useState<string>('0');
  const { buyGold, isPending, isConfirming } = useWeb3GameV2();
  const { showToast } = useToast();
  // 购买限制常量 (从合约同步)
  const MIN_GOLD = 100;
  const MAX_GOLD = 1000000;
  const EXCHANGE_RATE = 10000; // 1 ETH = 10000 Gold

  // 加载状态
  const isLoading = isPending || isConfirming;

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

    // 调用hook中的buyGold方法
    await buyGold(goldValue);
    
    // 购买成功后关闭模态框
    onClose();
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
                  isPending ? '确认交易中...' :
                    isConfirming ? '等待确认...' :
                      '处理中...'
                ) : '购买'}
              </button>
              <button className="cancel-btn" onClick={onClose}>
                取消
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyGoldModal;