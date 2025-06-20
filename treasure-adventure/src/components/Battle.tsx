import React, { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { calculatePlayerStats } from '../utils/gameUtils';

interface DamageDisplay {
  id: string;
  damage: number;
  target: 'player' | 'monster';
  type: 'damage' | 'heal';
  timestamp: number;
}

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
  
  const [damageDisplays, setDamageDisplays] = useState<DamageDisplay[]>([]);
  const [previousPlayerHealth, setPreviousPlayerHealth] = useState<number | null>(null);
  const [previousMonsterHealth, setPreviousMonsterHealth] = useState<number | null>(null);
  
  // 检测血量变化并创建显示
  useEffect(() => {
    if (!currentBattle) return;
    
    // 检测玩家血量变化
    if (previousPlayerHealth !== null && currentBattle.player.health !== previousPlayerHealth) {
      const healthChange = currentBattle.player.health - previousPlayerHealth;
      
      if (healthChange < 0) {
        // 受到伤害
        const display: DamageDisplay = {
          id: `player-damage-${Date.now()}`,
          damage: Math.abs(healthChange),
          target: 'player',
          type: 'damage',
          timestamp: Date.now()
        };
        setDamageDisplays(prev => [...prev, display]);
      } else if (healthChange > 0) {
        // 恢复血量
        const display: DamageDisplay = {
          id: `player-heal-${Date.now()}`,
          damage: healthChange,
          target: 'player',
          type: 'heal',
          timestamp: Date.now()
        };
        setDamageDisplays(prev => [...prev, display]);
      }
    }
    
    // 检测怪物受到伤害
    if (previousMonsterHealth !== null && currentBattle.monster.health < previousMonsterHealth) {
      const damage = previousMonsterHealth - currentBattle.monster.health;
      const display: DamageDisplay = {
        id: `monster-damage-${Date.now()}`,
        damage,
        target: 'monster',
        type: 'damage',
        timestamp: Date.now()
      };
      setDamageDisplays(prev => [...prev, display]);
    }
    
    // 更新之前的血量
    setPreviousPlayerHealth(currentBattle.player.health);
    setPreviousMonsterHealth(currentBattle.monster.health);
  }, [currentBattle?.player.health, currentBattle?.monster.health]);
  
  // 清除过期的伤害显示
  useEffect(() => {
    const timer = setInterval(() => {
      setDamageDisplays(prev => 
        prev.filter(display => Date.now() - display.timestamp < 1500)
      );
    }, 100);
    
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    if (!currentBattle?.isActive) return;
    
    const timer = setInterval(() => {
      updateBattleCooldowns();
    }, 100);
    
    return () => clearInterval(timer);
  }, [currentBattle?.isActive]);
  
  // 怪物攻击逻辑 - 简化版本
  useEffect(() => {
    if (!currentBattle?.isActive || 
        currentBattle.turn !== 'monster' || 
        currentBattle.monsterCooldown > 0) {
      return;
    }
    
    // 延迟1秒后自动怪物攻击
    const timeout = setTimeout(() => {
      monsterAttack();
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [currentBattle?.isActive, currentBattle?.turn, currentBattle?.monsterCooldown]);
  
  
  if (!currentBattle) {
    return null;
  }
  
  // 使用原始玩家数据计算属性，确保与角色界面一致
  const playerStats = calculatePlayerStats(player);
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
  
  const hasHealthPotion = currentBattle?.player.inventory.some(item => item.type === 'health_potion') || false;
  
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
          <div className="damage-display-container">
            {damageDisplays
              .filter(display => display.target === 'player')
              .map(display => (
                <div
                  key={display.id}
                  className={`damage-display ${display.type === 'heal' ? 'player-heal' : 'player-damage'}`}
                >
                  {display.type === 'heal' ? `+${display.damage}` : `-${display.damage}`}
                </div>
              ))}
          </div>
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
          <div className="damage-display-container">
            {damageDisplays
              .filter(display => display.target === 'monster')
              .map(display => (
                <div
                  key={display.id}
                  className="damage-display monster-damage"
                >
                  -{display.damage}
                </div>
              ))}
          </div>
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
              <button onClick={endBattle} className="confirm-btn">
                确定
              </button>
            </div>
          ) : (
            <div className="victory">
              <h3>战斗胜利！</h3>
              <p>获得经验: +{currentBattle.monster.experience}</p>
              <p>获得金币: +{currentBattle.monster.goldDrop}</p>
              <p>获得宝箱: +1</p>
              <button onClick={endBattle} className="confirm-btn">
                确定
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Battle;