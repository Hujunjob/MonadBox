import React from 'react';
import { useHybridGameStore } from '../store/web3GameStore';
import { useToast } from './ToastManager';

const TreasureBoxTimer: React.FC = () => {
  const hybridStore = useHybridGameStore();
  const { showToast } = useToast();

  // 处理领取宝箱
  const handleClaimTreasureBox = async () => {
    await hybridStore.claimTreasureBoxes();
  };
  
  // 获取可领取宝箱数量
  const claimableCount = hybridStore.claimableBoxes 
  
  return (
    <div className="treasure-box-timer">
      <button 
        onClick={handleClaimTreasureBox}
        style={{
          backgroundColor: claimableCount > 0 ? '#28a745' : '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => {
          if (claimableCount > 0) {
            e.currentTarget.style.backgroundColor = '#218838';
            e.currentTarget.style.transform = 'translateY(-1px)';
          } else {
            e.currentTarget.style.backgroundColor = '#5a6268';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseOut={(e) => {
          if (claimableCount > 0) {
            e.currentTarget.style.backgroundColor = '#28a745';
          } else {
            e.currentTarget.style.backgroundColor = '#6c757d';
          }
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        📦 领取宝箱 ({claimableCount})
      </button>
    </div>
  );
};

export default TreasureBoxTimer;