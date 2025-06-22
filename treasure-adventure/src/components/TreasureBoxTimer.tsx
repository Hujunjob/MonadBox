import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useToast } from './ToastManager';

const TreasureBoxTimer: React.FC = () => {
  const { claimTreasureBox, getClaimableTreasureBoxCount } = useGameStore();
  const { showToast } = useToast();

  // 处理领取宝箱
  const handleClaimTreasureBox = () => {
    const claimedCount = claimTreasureBox();
    if (claimedCount > 0) {
      showToast(`📦 成功领取了 ${claimedCount} 个宝箱！`, 'success');
    } else {
      showToast(`暂无待领取的宝箱`, 'info');
    }
  };
  
  const claimableCount = getClaimableTreasureBoxCount();
  
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