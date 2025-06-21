import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatTime } from '../utils/gameUtils';
import { GAME_CONFIG } from '../config/gameConfig';

const TreasureBoxTimer: React.FC = () => {
  const { player, incrementGameTime } = useGameStore();
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  
  // 计算倒计时的函数
  const calculateTimeUntilNext = () => {
    const now = Math.floor(Date.now() / 1000);
    const timeSinceLastBox = now - player.lastTreasureBoxTime;
    return Math.max(0, GAME_CONFIG.TREASURE_BOX.AUTO_GAIN_INTERVAL - timeSinceLastBox);
  };
  
  // 组件初始化时立即计算一次倒计时
  useEffect(() => {
    setTimeUntilNext(calculateTimeUntilNext());
  }, [player.lastTreasureBoxTime]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      incrementGameTime();
      setTimeUntilNext(calculateTimeUntilNext());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [incrementGameTime, player.lastTreasureBoxTime]);
  
  return (
    <div className="treasure-box-timer">
      <span style={{ color: 'black', fontSize: '18px', fontWeight: 'bold' }}>
        {timeUntilNext > 0 ? `${formatTime(timeUntilNext)}/${formatTime(GAME_CONFIG.TREASURE_BOX.AUTO_GAIN_INTERVAL)}` : `00:00:00/${formatTime(GAME_CONFIG.TREASURE_BOX.AUTO_GAIN_INTERVAL)}`}
      </span>
    </div>
  );
};

export default TreasureBoxTimer;