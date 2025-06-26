import React, { useEffect, useState } from 'react';
import { useHybridGameStore } from '../store/web3GameStore';

const Battle: React.FC = () => {
  const hybridStore = useHybridGameStore();
  const [playerProgress, setPlayerProgress] = useState({ currentLevel: 1, maxMonster: 0 });
  
  // 获取玩家进度
  useEffect(() => {
    const fetchProgress = async () => {
      if (hybridStore.currentPlayerId && typeof hybridStore.getPlayerProgress === 'function') {
        try {
          const progress = await hybridStore.getPlayerProgress();
          if (progress) {
            setPlayerProgress(progress);
          }
        } catch (error) {
          console.error('Failed to fetch player progress:', error);
        }
      }
    };
    
    fetchProgress();
  }, [hybridStore.currentPlayerId]);
  
  return (
    <div className="battle-panel">
      <div className="battle-status">
        <h3>冒险进度</h3>
        <div className="progress-display">
          <div className="progress-item">
            <span className="label">最高层级:</span>
            <span className="value">{playerProgress.currentLevel}</span>
          </div>
          <div className="progress-item">
            <span className="label">该层最高怪物:</span>
            <span className="value">{playerProgress.maxMonster || '未挑战'}</span>
          </div>
        </div>
        
        <div className="navigation-hint">
          <p>请在怪物森林页面进行战斗</p>
        </div>
      </div>
    </div>
  );
};

export default Battle;