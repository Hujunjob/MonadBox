import React from 'react';
import { useGameStore } from '../store/gameStore';
import { calculatePlayerStats } from '../utils/gameUtils';

const PlayerStats: React.FC = () => {
  const { player, initializeGame } = useGameStore();
  const stats = calculatePlayerStats(player);
  
  const expNeeded = player.level * 100;
  const expPercent = (player.experience / expNeeded) * 100;
  const healthPercent = (player.health / stats.maxHealth) * 100;
  
  return (
    <div className="player-stats">
      <h2>玩家信息</h2>
      <div className="stat-row">
        <span>姓名: {player.name}</span>
        <span>等级: {player.level}</span>
        <span>金币: {player.gold}</span>
      </div>
      
      <div className="stat-bar">
        <label>血量: {player.health}/{stats.maxHealth}</label>
        <div className="progress-bar">
          <div 
            className="progress-fill health" 
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>
      
      <div className="stat-bar">
        <label>经验: {player.experience}/{expNeeded}</label>
        <div className="progress-bar">
          <div 
            className="progress-fill experience" 
            style={{ width: `${expPercent}%` }}
          />
        </div>
      </div>
      
      <div className="stat-grid">
        <div className="stat-item">
          <span>攻击力</span>
          <span>{stats.attack}</span>
        </div>
        <div className="stat-item">
          <span>防御力</span>
          <span>{stats.defense}</span>
        </div>
        <div className="stat-item">
          <span>敏捷度</span>
          <span>{stats.agility}</span>
        </div>
        <div className="stat-item">
          <span>宝箱数</span>
          <span>{player.treasureBoxes}</span>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button 
          onClick={initializeGame}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          重置游戏
        </button>
      </div>
    </div>
  );
};

export default PlayerStats;