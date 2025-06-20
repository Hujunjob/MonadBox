import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { calculatePlayerStats } from '../utils/gameUtils';

const Battle: React.FC = () => {
  const { 
    currentBattle, 
    playerAttack, 
    monsterAttack, 
    updateBattleCooldowns, 
    endBattle,
    useHealthPotion,
    player
  } = useGameStore();
  
  const [battleTimer, setBattleTimer] = useState<number | null>(null);
  
  useEffect(() => {
    if (currentBattle?.isActive) {
      const timer = setInterval(() => {
        updateBattleCooldowns();
        
        // 自动怪物攻击
        if (currentBattle.turn === 'monster' && currentBattle.monsterCooldown <= 0) {
          monsterAttack();
        }
      }, 100);
      
      setBattleTimer(timer);
      return () => clearInterval(timer);
    } else {
      if (battleTimer) {
        clearInterval(battleTimer);
        setBattleTimer(null);
      }
    }
  }, [currentBattle, updateBattleCooldowns, monsterAttack, battleTimer]);
  
  useEffect(() => {
    if (currentBattle && !currentBattle.isActive) {
      const timer = setTimeout(() => {
        endBattle();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [currentBattle, endBattle]);
  
  if (!currentBattle) {
    return null;
  }
  
  const playerStats = calculatePlayerStats(currentBattle.player);
  const canAttack = currentBattle.turn === 'player' && 
                   currentBattle.playerCooldown <= 0 && 
                   currentBattle.isActive;
  
  const playerHealthPercent = (currentBattle.player.health / playerStats.maxHealth) * 100;
  const monsterHealthPercent = (currentBattle.monster.health / currentBattle.monster.maxHealth) * 100;
  
  const handleAttack = () => {
    if (canAttack) {
      playerAttack();
    }
  };
  
  const handleUsePotion = () => {
    if (currentBattle.isActive) {
      useHealthPotion();
    }
  };
  
  const hasHealthPotion = player.inventory.some(item => item.type === 'health_potion');
  
  return (
    <div className="battle-screen">
      <div className="battle-header">
        <h2>战斗中</h2>
        <button onClick={endBattle} className="end-battle-btn">
          逃跑
        </button>
      </div>
      
      <div className="battle-area">
        {/* 玩家状态 */}
        <div className="battle-participant player">
          <h3>{currentBattle.player.name} (等级 {currentBattle.player.level})</h3>
          <div className="health-bar">
            <div className="health-label">
              血量: {currentBattle.player.health}/{playerStats.maxHealth}
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill health" 
                style={{ width: `${playerHealthPercent}%` }}
              />
            </div>
          </div>
          
          <div className="stats">
            <span>攻击: {playerStats.attack}</span>
            <span>防御: {playerStats.defense}</span>
            <span>敏捷: {playerStats.agility}</span>
          </div>
          
          <div className="battle-actions">
            <button 
              onClick={handleAttack}
              disabled={!canAttack}
              className="attack-btn"
            >
              {currentBattle.playerCooldown > 0 ? 
                `攻击 (${Math.ceil(currentBattle.playerCooldown / 1000)}s)` : 
                '攻击'
              }
            </button>
            
            <button 
              onClick={handleUsePotion}
              disabled={!hasHealthPotion || !currentBattle.isActive}
              className="potion-btn"
            >
              使用血瓶
            </button>
          </div>
        </div>
        
        {/* VS 分隔符 */}
        <div className="vs-divider">
          <span>VS</span>
        </div>
        
        {/* 怪物状态 */}
        <div className="battle-participant monster">
          <h3>{currentBattle.monster.name} (等级 {currentBattle.monster.level})</h3>
          <div className="health-bar">
            <div className="health-label">
              血量: {currentBattle.monster.health}/{currentBattle.monster.maxHealth}
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill health monster" 
                style={{ width: `${monsterHealthPercent}%` }}
              />
            </div>
          </div>
          
          <div className="stats">
            <span>攻击: {currentBattle.monster.attack}</span>
            <span>防御: {currentBattle.monster.defense}</span>
            <span>敏捷: {currentBattle.monster.agility}</span>
          </div>
          
          <div className="monster-actions">
            {currentBattle.turn === 'monster' && currentBattle.isActive && (
              <div className="monster-cooldown">
                {currentBattle.monsterCooldown > 0 ? 
                  `准备攻击... (${Math.ceil(currentBattle.monsterCooldown / 1000)}s)` : 
                  '正在攻击...'
                }
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 战斗日志 */}
      <div className="battle-log">
        <h3>战斗日志</h3>
        <div className="log-content">
          {currentBattle.battleLog.map((log, index) => (
            <div key={index} className="log-entry">
              {log}
            </div>
          ))}
        </div>
      </div>
      
      {/* 回合指示器 */}
      <div className="turn-indicator">
        <span className={currentBattle.turn === 'player' ? 'active' : ''}>
          玩家回合
        </span>
        <span className={currentBattle.turn === 'monster' ? 'active' : ''}>
          怪物回合
        </span>
      </div>
      
      {!currentBattle.isActive && (
        <div className="battle-result">
          {currentBattle.player.health <= 0 ? (
            <div className="defeat">
              <h3>战斗失败！</h3>
              <p>你被击败了，请恢复血量后再次挑战。</p>
            </div>
          ) : (
            <div className="victory">
              <h3>战斗胜利！</h3>
              <p>获得经验: +{currentBattle.monster.experience}</p>
              <p>获得金币: +{currentBattle.monster.goldDrop}</p>
              <p>获得宝箱: +1</p>
            </div>
          )}
          <p>3秒后自动返回...</p>
        </div>
      )}
    </div>
  );
};

export default Battle;