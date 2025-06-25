import React, { useState, useEffect } from 'react';
import { useHybridGameStore } from '../store/web3GameStore';
import BattleResultModal from '../components/BattleResultModal';

const MonsterForest: React.FC = () => {
  const hybridStore = useHybridGameStore();
  const player = hybridStore.player;
  const [selectedAdventureLevel, setSelectedAdventureLevel] = useState(1);
  const [isLevelExpanded, setIsLevelExpanded] = useState(false);
  
  // 战斗结果弹窗状态
  const [battleResult, setBattleResult] = useState<{
    isOpen: boolean;
    isVictory: boolean;
    monsterName: string;
    expGained: number;
    adventureLevel: number;
  }>({
    isOpen: false,
    isVictory: false,
    monsterName: '',
    expGained: 0,
    adventureLevel: 1
  });
  
  // 获取玩家最大解锁层数和最高怪物等级
  const maxUnlockedLevel = hybridStore.maxAdventureLevel || 1;
  const playerProgress = hybridStore.playerProgress || { currentLevel: 1, maxMonster: 0 };
  
  // 生成冒险层数列表 (1-1000)
  const adventureLevels = Array.from({ length: 1000 }, (_, i) => {
    const level = i + 1;
    return {
      level,
      name: `第${level}层冒险`,
      isUnlocked: level <= maxUnlockedLevel,
      monsterLevel: level,
      baseExp: level * 10 + 20,
      description: `挑战等级${level}的怪物`
    };
  });
  
  const currentAdventure = adventureLevels.find(adv => adv.level === selectedAdventureLevel);
  
  // 获取怪物属性和胜率
  useEffect(() => {
    const fetchBattleData = async () => {
      // 检查必要的方法是否存在
      if (typeof hybridStore.getMonsterStats !== 'function' || 
          typeof hybridStore.estimateWinRate !== 'function') {
        console.error('Required game methods not available');
        return;
      }

      // 只获取当前选中层级的数据以提升性能
      try {
        // 获取怪物属性
        const stats = await hybridStore.getMonsterStats(selectedAdventureLevel, 1);
        if (stats) {
          setMonsterStats(prev => ({ ...prev, [selectedAdventureLevel]: stats }));
        }
        
        // 获取胜率
        const winRate = await hybridStore.estimateWinRate(selectedAdventureLevel, 1);
        setWinRates(prev => ({ ...prev, [selectedAdventureLevel]: winRate }));
      } catch (error) {
        console.error(`Failed to fetch data for level ${selectedAdventureLevel}:`, error);
      }
    };
    
    if (hybridStore.currentPlayerId) {
      fetchBattleData();
    }
  }, [hybridStore.currentPlayerId, player]);

  // 监听战斗结果事件
  useEffect(() => {
    const handleBattleResult = (event: any) => {
      const result = event.detail;
      setBattleResult({
        isOpen: true,
        isVictory: result.isVictory,
        monsterName: result.monsterName,
        expGained: result.experienceGained,
        adventureLevel: result.adventureLevel
      });
    };

    window.addEventListener('battleResult', handleBattleResult);
    
    return () => {
      window.removeEventListener('battleResult', handleBattleResult);
    };
  }, []);

  const handleCloseBattleResult = () => {
    setBattleResult(prev => ({ ...prev, isOpen: false }));
  };
  
  const handleStartAdventure = async (adventureLevel: number) => {
    if (player.stamina < 1) {
      alert('体力不足，无法战斗！请等待体力恢复。');
      return;
    }
    
    if (adventureLevel > maxUnlockedLevel) {
      alert(`第${adventureLevel}层尚未解锁！请先完成第${maxUnlockedLevel}层冒险。`);
      return;
    }
    
    // 检查startAdventure方法是否存在
    if (typeof hybridStore.startAdventure !== 'function') {
      console.error('startAdventure method not available');
      alert('游戏方法不可用，请重新加载页面');
      return;
    }
    
    try {
      await hybridStore.startAdventure(adventureLevel);
    } catch (error) {
      console.error('Adventure failed:', error);
    }
  };
  
  return (
    <div className="monster-forest">
      <div className="adventure-levels">
        <div 
          className="adventure-levels-header"
          onClick={() => setIsLevelExpanded(!isLevelExpanded)}
          style={{ cursor: 'pointer' }}
        >
          <h3>冒险层数选择</h3>
          <span className="expand-icon">{isLevelExpanded ? '▼' : '▶'}</span>
        </div>
        
        {isLevelExpanded && (
          <div className="level-list">
            {adventureLevels.map(adventure => (
              <div 
                key={adventure.level} 
                className={`adventure-level ${adventure.isUnlocked ? 'unlocked' : 'locked'} ${
                  adventure.level === selectedAdventureLevel ? 'selected' : ''
                }`}
                onClick={() => adventure.isUnlocked && setSelectedAdventureLevel(adventure.level)}
                style={{ cursor: adventure.isUnlocked ? 'pointer' : 'default' }}
              >
                <div className="level-info">
                  <span className="level-name">{adventure.name}</span>
                  <span className="level-status">
                    {adventure.isUnlocked ? '可挑战' : '未解锁'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!isLevelExpanded && (
          <div className="current-adventure-summary">
            <span>{currentAdventure?.name || `第${selectedAdventureLevel}层冒险`}</span>
          </div>
        )}
      </div>
      
      {/* 玩家进度 */}
      {/* <div className="player-progress">
        <h3>冒险进度</h3>
        <div className="progress-grid">
          <div className="progress-item">
            <span className="progress-label">最高到达层级</span>
            <span className="progress-value">{playerProgress.currentLevel}</span>
          </div>
          <div className="progress-item">
            <span className="progress-label">该层最高怪物</span>
            <span className="progress-value">{playerProgress.maxMonster || '未挑战'}</span>
          </div>
        </div>
      </div> */}
      
      {currentAdventure && (
        <div className="current-adventure">
          <div className="adventure-card">
            <div className="adventure-header">
              {/* <h2>{currentAdventure.name}</h2> */}
              <div className="adventure-level">怪物等级 {currentAdventure.level}</div>
            </div>
            
            
            <div className="player-status">
              <h3>玩家状态</h3>
              <div className="status-grid">
                <div className="status-item">
                  <span>体力:</span>
                  <span className={player.stamina < 1 ? 'low' : ''}>{player.stamina}/{player.maxStamina}</span>
                </div>
                <div className="status-item">
                  <span>攻击力:</span>
                  <span>{player.attack}</span>
                </div>
                <div className="status-item">
                  <span>防御力:</span>
                  <span>{player.defense}</span>
                </div>
                <div className="status-item">
                  <span>敏捷:</span>
                  <span>{player.agility}</span>
                </div>
              </div>
            </div>
            
            <div className="adventure-actions">
              <button 
                onClick={() => handleStartAdventure(currentAdventure.level)}
                className={`adventure-btn ${
                  !currentAdventure.isUnlocked || player.stamina < 1 ? 'disabled' : 'ready'
                }`}
                disabled={!currentAdventure.isUnlocked || player.stamina < 1 || hybridStore.isPending}
              >
                {hybridStore.isPending ? '冒险中...' : 
                 !currentAdventure.isUnlocked ? '未解锁' :
                 player.stamina < 1 ? '体力不足' :
                 `开始第${currentAdventure.level}层冒险`}
              </button>
              
              {currentAdventure.level > maxUnlockedLevel && (
                <div className="unlock-hint">
                  需要先完成第{maxUnlockedLevel}层冒险才能解锁
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="adventure-info">
        <h3>冒险系统说明</h3>
        <ul>
          <li>选择冒险层数1-1000，每层有10只逐渐变强的怪物</li>
          <li>必须按顺序击败怪物，击败10只怪物后解锁下一层</li>
          <li>战斗胜负基于你的攻击力与怪物防御力的随机对决</li>
          <li>胜利获得经验奖励和战斗宝箱</li>
          <li>每次冒险消耗1点体力</li>
          <li>怪物随层级增强，每1000层显著提升难度</li>
        </ul>
      </div>

      {/* 战斗结果弹窗 */}
      <BattleResultModal
        isOpen={battleResult.isOpen}
        isVictory={battleResult.isVictory}
        monsterName={battleResult.monsterName}
        expGained={battleResult.expGained}
        adventureLevel={battleResult.adventureLevel}
        onClose={handleCloseBattleResult}
      />
    </div>
  );
};

export default MonsterForest;