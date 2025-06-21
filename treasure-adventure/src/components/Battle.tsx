import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { calculatePlayerStats, getJobLevelDisplay } from '../utils/gameUtils';
import BattleResultModal from './BattleResultModal';

interface DamageDisplay {
  id: string;
  damage: number;
  target: 'player' | 'monster';
  type: 'damage' | 'heal';
  isCritical?: boolean;
  timestamp: number;
}

const Battle: React.FC = () => {
  const { 
    currentBattle, 
    playerAttack, 
    monsterAttack, 
    updateBattleCooldowns,
    updateActionBars,
    endBattle,
    useHealthPotion,
    player
  } = useGameStore();
  
  const [damageDisplays, setDamageDisplays] = useState<DamageDisplay[]>([]);
  const [previousPlayerHealth, setPreviousPlayerHealth] = useState<number | null>(null);
  const [previousMonsterHealth, setPreviousMonsterHealth] = useState<number | null>(null);
  const [previousBattleLogLength, setPreviousBattleLogLength] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isAutoBattle, setIsAutoBattle] = useState(false);
  
  // 检测战斗结束并显示结算模态框
  useEffect(() => {
    if (!currentBattle) return;
    
    if (!currentBattle.isActive && !showResultModal) {
      setShowResultModal(true);
    }
  }, [currentBattle?.isActive, showResultModal]);
  
  // 检测血量变化并创建显示
  useEffect(() => {
    if (!currentBattle) return;
    
    // 检测新的战斗日志来判断是否暴击
    const newLogEntries = currentBattle.battleLog.slice(previousBattleLogLength);
    const latestLog = newLogEntries[newLogEntries.length - 1];
    const isCritical = latestLog && latestLog.includes('（暴击！）');
    
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
          isCritical: Boolean(isCritical && latestLog.includes('攻击了你')),
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
        isCritical: Boolean(isCritical && latestLog.includes('你攻击了')),
        timestamp: Date.now()
      };
      setDamageDisplays(prev => [...prev, display]);
    }
    
    // 更新之前的血量和日志长度
    setPreviousPlayerHealth(currentBattle.player.health);
    setPreviousMonsterHealth(currentBattle.monster.health);
    setPreviousBattleLogLength(currentBattle.battleLog.length);
  }, [currentBattle?.player.health, currentBattle?.monster.health, currentBattle?.battleLog.length]);
  
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
      updateActionBars();
    }, 100);
    
    return () => clearInterval(timer);
  }, [currentBattle?.isActive]);
  
  // 怪物攻击逻辑 - 自动攻击
  useEffect(() => {
    if (!currentBattle?.isActive) {
      return;
    }
    
    // 检查怪物是否可以攻击
    const canMonsterAttack = currentBattle.monsterCooldown <= 0 &&
                            currentBattle.monsterActionBar >= 100;
    
    if (!canMonsterAttack) {
      return;
    }
    
    // 延迟500ms后自动怪物攻击
    const timeout = setTimeout(() => {
      monsterAttack();
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [currentBattle?.isActive, currentBattle?.turn, currentBattle?.monsterCooldown, currentBattle?.monsterActionBar]);

  // 自动战斗逻辑
  useEffect(() => {
    if (!isAutoBattle || !currentBattle?.isActive) {
      return;
    }

    // 计算玩家属性
    const playerStats = calculatePlayerStats(player);
    
    // 检查是否需要自动使用血瓶
    const playerHealthPercent = (currentBattle.player.health / playerStats.maxHealth) * 100;
    const hasHealthPotion = currentBattle.player.inventory.some(item => item.type === 'health_potion');
    
    if (playerHealthPercent < 30 && hasHealthPotion) {
      const timeout = setTimeout(() => {
        useHealthPotion();
      }, 300);
      return () => clearTimeout(timeout);
    }

    // 检查是否可以自动攻击
    const canAutoAttack = currentBattle.playerCooldown <= 0 && 
                         currentBattle.playerActionBar >= 100;
    
    if (canAutoAttack) {
      const timeout = setTimeout(() => {
        playerAttack();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [
    isAutoBattle, 
    currentBattle?.isActive, 
    currentBattle?.playerCooldown, 
    currentBattle?.playerActionBar,
    currentBattle?.player.health,
    currentBattle?.player.inventory,
    player
  ]);
  
  
  if (!currentBattle) {
    return null;
  }
  
  // 使用原始玩家数据计算属性，确保与角色界面一致
  const playerStats = calculatePlayerStats(player);
  
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
  const canAttack = currentBattle.playerCooldown <= 0 && 
                   currentBattle.playerActionBar >= 100 &&
                   currentBattle.isActive;
  
  const handleCloseResultModal = () => {
    setShowResultModal(false);
    endBattle();
  };
  
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
                  className={`damage-display ${
                    display.type === 'heal' ? 'player-heal' : 
                    display.isCritical ? 'player-critical' : 'player-damage'
                  }`}
                >
                  {display.type === 'heal' ? `+${display.damage}` : 
                   display.isCritical ? `暴击-${display.damage}` : `-${display.damage}`}
                </div>
              ))}
          </div>
          <h3>{currentBattle.player.name} ({getJobLevelDisplay(currentBattle.player.level, currentBattle.player.job || 'swordsman')})</h3>
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
            <span>暴击率: {playerStats.criticalRate}%</span>
            <span>暴击伤害: {playerStats.criticalDamage}%</span>
          </div>
          
          <div className="action-bar-section">
            <div className="action-bar-label">行动条</div>
            <div className="action-bar">
              <div 
                className="action-bar-fill player" 
                style={{ width: `${currentBattle.playerActionBar}%` }}
              />
            </div>
          </div>
          
          <div className="battle-actions">
            <button 
              onClick={handleAttack}
              disabled={!canAttack || isAutoBattle}
              className="attack-btn"
            >
              {currentBattle.playerCooldown > 0 ? 
                `攻击 (${Math.ceil(currentBattle.playerCooldown / 1000)}s)` : 
                '攻击'
              }
            </button>
            
            <button 
              onClick={handleUsePotion}
              disabled={!hasHealthPotion || !currentBattle.isActive || isAutoBattle}
              className="potion-btn"
            >
              使用血瓶
            </button>
            
            <button 
              onClick={() => setIsAutoBattle(!isAutoBattle)}
              className={`auto-battle-btn ${isAutoBattle ? 'active' : ''}`}
            >
              {isAutoBattle ? '🔄 自动中' : '⚡ 自动战斗'}
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
                  className={`damage-display ${display.isCritical ? 'monster-critical' : 'monster-damage'}`}
                >
                  {display.isCritical ? `暴击-${display.damage}` : `-${display.damage}`}
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
            <span>暴击率: {currentBattle.monster.criticalRate}%</span>
            <span>暴击伤害: {currentBattle.monster.criticalDamage}%</span>
          </div>
          
          <div className="action-bar-section">
            <div className="action-bar-label">行动条</div>
            <div className="action-bar">
              <div 
                className="action-bar-fill monster" 
                style={{ width: `${currentBattle.monsterActionBar}%` }}
              />
            </div>
          </div>
          
          <div className="monster-actions">
            {currentBattle.isActive && (
              <div className="monster-cooldown">
                {currentBattle.monsterCooldown > 0 ? 
                  `冷却中... (${Math.ceil(currentBattle.monsterCooldown / 1000)}s)` : 
                  currentBattle.monsterActionBar >= 100 ? '准备攻击!' : `行动条: ${Math.floor(currentBattle.monsterActionBar)}%`
                }
              </div>
            )}
          </div>
        </div>
      </div>
      
      
      {/* 自动战斗状态指示器 */}
      {isAutoBattle && (
        <div className="battle-status">
          <div className="status-item auto-status">
            <span className="auto-indicator">
              🤖 自动战斗中 - 血量低于30%自动使用血瓶
            </span>
          </div>
        </div>
      )}
      
      <BattleResultModal
        isOpen={showResultModal}
        isVictory={currentBattle.player.health > 0}
        monsterName={currentBattle.monster.name}
        expGained={currentBattle.monster.experience}
        goldGained={currentBattle.monster.goldDrop}
        onClose={handleCloseResultModal}
      />
    </div>
  );
};

export default Battle;