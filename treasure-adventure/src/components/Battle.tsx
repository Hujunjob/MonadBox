import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { calculatePlayerStats, getJobLevelDisplay } from '../utils/gameUtils';
import BattleResultModal from './BattleResultModal';
import LevelUpModal from './LevelUpModal';

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
    player,
    lastLevelUp,
    clearLevelUp
  } = useGameStore();
  
  const [damageDisplays, setDamageDisplays] = useState<DamageDisplay[]>([]);
  const [previousPlayerHealth, setPreviousPlayerHealth] = useState<number | null>(null);
  const [previousMonsterHealth, setPreviousMonsterHealth] = useState<number | null>(null);
  const [previousBattleLogLength, setPreviousBattleLogLength] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isAutoBattle, setIsAutoBattle] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  
  // 检测战斗结束并显示结算模态框
  useEffect(() => {
    if (!currentBattle) return;
    
    if (!currentBattle.isActive && !showResultModal) {
      setShowResultModal(true);
    }
  }, [currentBattle?.isActive, showResultModal]);

  // 检测升级并显示升级模态框（在战斗结果模态框关闭后）
  useEffect(() => {
    if (lastLevelUp && !currentBattle?.isActive && !showResultModal && !showLevelUpModal) {
      setShowLevelUpModal(true);
    }
  }, [lastLevelUp, currentBattle?.isActive, showResultModal, showLevelUpModal]);

  // 2级后自动启用自动战斗
  useEffect(() => {
    if (player.level >= 2 && !isAutoBattle) {
      setIsAutoBattle(true);
    }
  }, [player.level, isAutoBattle]);
  
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

  const handleCloseLevelUpModal = () => {
    setShowLevelUpModal(false);
    clearLevelUp();
  };
  
  return (
    <div className="battle-screen">
      <div className="battle-header">
        <h2>战斗中</h2>
        <button onClick={endBattle} className="end-battle-btn">
          逃跑
        </button>
      </div>
      
      <div className="battle-area-vertical">
        {/* 怪物状态 - 上方 */}
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
          <h3>{currentBattle.monster.name} (Lv.{currentBattle.monster.level})</h3>
          
          <div className="health-row">
            <span className="health-text">血量: {currentBattle.monster.health}/{currentBattle.monster.maxHealth}</span>
            <div className="progress-bar-small">
              <div 
                className="progress-fill health monster" 
                style={{ width: `${monsterHealthPercent}%` }}
              />
            </div>
          </div>
          
          <div className="stats-compact">
            <span>⚔️{currentBattle.monster.attack}</span>
            <span>🛡️{currentBattle.monster.defense}</span>
            <span>💨{currentBattle.monster.agility}</span>
            <span>💥{currentBattle.monster.criticalRate}%</span>
          </div>
          
          <div className="action-bar-compact">
            <span>行动条:</span>
            <div className="action-bar-small">
              <div 
                className="action-bar-fill monster" 
                style={{ width: `${currentBattle.monsterActionBar}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* VS 分隔符 */}
        <div className="vs-divider-horizontal">
          <span>VS</span>
        </div>
        
        {/* 玩家状态 - 下方 */}
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
          <h3>{currentBattle.player.name} ({getJobLevelDisplay(currentBattle.player.level, currentBattle.player.job || 'swordsman', currentBattle.player.canGainExperience)})</h3>
          
          <div className="health-row">
            <span className="health-text">血量: {currentBattle.player.health}/{playerStats.maxHealth}</span>
            <div className="progress-bar-small">
              <div 
                className="progress-fill health" 
                style={{ width: `${playerHealthPercent}%` }}
              />
            </div>
          </div>
          
          <div className="stats-compact">
            <span>⚔️{playerStats.attack}</span>
            <span>🛡️{playerStats.defense}</span>
            <span>💨{playerStats.agility}</span>
            <span>💥{playerStats.criticalRate}%</span>
          </div>
          
          <div className="action-bar-compact">
            <span>行动条:</span>
            <div className="action-bar-small">
              <div 
                className="action-bar-fill player" 
                style={{ width: `${currentBattle.playerActionBar}%` }}
              />
            </div>
          </div>
          
          <div className="battle-actions-compact">
            <button 
              onClick={handleAttack}
              disabled={!canAttack || isAutoBattle}
              className="battle-btn attack-btn"
            >
              {currentBattle.playerCooldown > 0 ? 
                `攻击 (${Math.ceil(currentBattle.playerCooldown / 1000)}s)` : 
                '攻击'
              }
            </button>
            
            <button 
              onClick={handleUsePotion}
              disabled={!hasHealthPotion || !currentBattle.isActive || isAutoBattle}
              className="battle-btn potion-btn"
            >
              血瓶
            </button>
            
            <button 
              onClick={() => setIsAutoBattle(!isAutoBattle)}
              className={`battle-btn auto-battle-btn ${isAutoBattle ? 'active' : ''}`}
            >
              {isAutoBattle ? '🔄 自动' : '⚡ 自动'}
            </button>
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
      
      {lastLevelUp && (
        <LevelUpModal
          isOpen={showLevelUpModal}
          oldLevel={lastLevelUp.oldLevel}
          newLevel={lastLevelUp.newLevel}
          job={player.job || 'swordsman'}
          statsGained={lastLevelUp.statsGained}
          onClose={handleCloseLevelUpModal}
        />
      )}
    </div>
  );
};

export default Battle;