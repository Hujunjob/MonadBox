import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatTime } from '../utils/gameUtils';

const TreasureBoxTimer: React.FC = () => {
  const { player, incrementGameTime } = useGameStore();
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      incrementGameTime();
      
      const now = Math.floor(Date.now() / 1000);
      const timeSinceLastBox = now - player.lastTreasureBoxTime;
      const nextBoxTime = Math.max(0,20 - timeSinceLastBox); // 改为60秒测试
      setTimeUntilNext(nextBoxTime);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [incrementGameTime, player.lastTreasureBoxTime]);
  
  return (
    <div className="treasure-box-timer">
      <span style={{ color: 'black', fontSize: '18px', fontWeight: 'bold' }}>
        {timeUntilNext > 0 ? `${formatTime(timeUntilNext)}/00:00:20` : '00:00:00/00:00:20'}
      </span>
    </div>
  );
};

export default TreasureBoxTimer;