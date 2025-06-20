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
      const nextBoxTime = Math.max(0, 60 - timeSinceLastBox); // 改为60秒测试
      setTimeUntilNext(nextBoxTime);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [incrementGameTime, player.lastTreasureBoxTime]);
  
  return (
    <div className="treasure-box-timer">
      <h3>下一个免费宝箱</h3>
      {timeUntilNext > 0 ? (
        <div className="timer-display">
          <span className="time">{formatTime(timeUntilNext)}</span>
          <div className="timer-bar">
            <div 
              className="timer-progress" 
              style={{ 
                width: `${((60 - timeUntilNext) / 60) * 100}%` 
              }}
            />
          </div>
        </div>
      ) : (
        <div className="timer-ready">
          <span>宝箱已准备好！</span>
        </div>
      )}
    </div>
  );
};

export default TreasureBoxTimer;