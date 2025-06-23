import React, { useEffect, useState } from 'react';
import { GAME_CONFIG } from '../config/gameConfig';
import { useToast } from './ToastManager';
import { useHybridGameStore } from '../store/web3GameStore';

const OfflineRewardsModal: React.FC = () => {
  const { showToast } = useToast();
  const hybridStore = useHybridGameStore();
  const player = hybridStore.player;
  const [showModal, setShowModal] = useState(false);
  const [offlineRewards, setOfflineRewards] = useState<{
    boxes: number;
    timeOffline: number;
  } | null>(null);

  useEffect(() => {
    // 计算离线时间和奖励
    const calculateOfflineRewards = () => {
      const now = Math.floor(Date.now() / 1000);
      const timeSinceLastBox = now - player.lastTreasureBoxTime;
      
      // 如果离线超过1小时就显示奖励
      if (timeSinceLastBox >= GAME_CONFIG.TREASURE_BOX.AUTO_GAIN_INTERVAL) {
        const offlineBoxes = Math.floor(timeSinceLastBox / GAME_CONFIG.TREASURE_BOX.AUTO_GAIN_INTERVAL);
        const actualBoxes = Math.min(offlineBoxes, GAME_CONFIG.TREASURE_BOX.MAX_OFFLINE_BOXES); // 最多24个
        
        setOfflineRewards({
          boxes: actualBoxes,
          timeOffline: timeSinceLastBox
        });
        setShowModal(true);
      }
    };

    // 只在组件首次挂载时检查
    calculateOfflineRewards();
  }, []); // 空依赖数组，只在首次挂载时执行

  const handleClaimRewards = () => {
    if (offlineRewards) {
      // 在区块链模式下，离线奖励通过智能合约自动处理
      // 这里只是前端显示，实际奖励已经在链上
      showToast(`🎁 成功领取了 ${offlineRewards.boxes} 个离线宝箱！`, 'success');
      setShowModal(false);
      setOfflineRewards(null);
    }
  };

  if (!showModal || !offlineRewards) return null;

  const hoursOffline = Math.floor(offlineRewards.timeOffline / 3600);
  const minutesOffline = Math.floor((offlineRewards.timeOffline % 3600) / 60);

  return (
    <div className="modal-overlay">
      <div className="offline-rewards-modal">
        <div className="modal-header">
          <h2>🎁 离线奖励</h2>
        </div>
        
        <div className="modal-content">
          <div className="offline-info">
            <p>欢迎回来！</p>
            <p>你已经离线了：</p>
            <div className="offline-time">
              {hoursOffline > 0 && <span>{hoursOffline}小时 </span>}
              {minutesOffline > 0 && <span>{minutesOffline}分钟</span>}
            </div>
          </div>
          
          <div className="offline-rewards">
            <div className="reward-item">
              <span className="reward-icon">📦</span>
              <span className="reward-text">宝箱 ×{offlineRewards.boxes}</span>
            </div>
            {offlineRewards.boxes >= GAME_CONFIG.TREASURE_BOX.MAX_OFFLINE_BOXES && (
              <div className="max-rewards-note">
                <small>💡 宝箱最多积累{GAME_CONFIG.TREASURE_BOX.MAX_OFFLINE_BOXES}个</small>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-actions">
          <button 
            className="claim-btn"
            onClick={handleClaimRewards}
          >
            领取奖励
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflineRewardsModal;