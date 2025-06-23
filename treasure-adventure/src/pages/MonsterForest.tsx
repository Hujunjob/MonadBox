import React, { useState, useEffect } from 'react';
import { useHybridGameStore } from '../store/web3GameStore';
import BattleResultModal from '../components/BattleResultModal';

const MonsterForest: React.FC = () => {
  const hybridStore = useHybridGameStore();
  const player = hybridStore.player;
  const [selectedAdventureLevel, setSelectedAdventureLevel] = useState(1);
  const [isLevelExpanded, setIsLevelExpanded] = useState(false);
  const [monsterStats, setMonsterStats] = useState<{[key: number]: any}>({});
  const [winRates, setWinRates] = useState<{[key: number]: number}>({});
  
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
  
  // 获取玩家最大解锁层数
  const maxUnlockedLevel = hybridStore.maxAdventureLevel || 1;
  const battleStats = hybridStore.battleStats || { totalBattles: 0, totalVictories: 0, winRate: 0, lastBattle: 0 };
  
  // 生成冒险层数列表 (1-10)
  const adventureLevels = Array.from({ length: 10 }, (_, i) => {
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

      for (let level = 1; level <= 10; level++) {
        try {
          // 获取怪物属性
          const stats = await hybridStore.getMonsterStats(level);
          if (stats) {
            setMonsterStats(prev => ({ ...prev, [level]: stats }));
          }
          
          // 获取胜率
          const winRate = await hybridStore.estimateWinRate(level);
          setWinRates(prev => ({ ...prev, [level]: winRate }));
        } catch (error) {
          console.error(`Failed to fetch data for level ${level}:`, error);
        }
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
                <div className="level-details">
                  <span>怪物防御: {monsterStats[adventure.level] || '...'}</span>
                  <span>胜率: {winRates[adventure.level] || 0}%</span>
                  <span>经验: {adventure.baseExp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!isLevelExpanded && (
          <div className="current-adventure-summary">
            <span>{currentAdventure?.name || `第${selectedAdventureLevel}层冒险`}</span>
            <span>胜率: {winRates[selectedAdventureLevel] || 0}%</span>
          </div>
        )}
      </div>
      
      {/* 战斗统计 */}
      <div className="battle-stats">
        <h3>战斗统计</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">总战斗次数</span>
            <span className="stat-value">{battleStats.totalBattles}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">胜利次数</span>
            <span className="stat-value">{battleStats.totalVictories}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">胜率</span>
            <span className="stat-value">{battleStats.winRate}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">最大解锁层数</span>
            <span className="stat-value">{maxUnlockedLevel}</span>
          </div>
        </div>
      </div>
      
      {currentAdventure && (
        <div className="current-adventure">
          <div className="adventure-card">
            <div className="adventure-header">
              <h2>{currentAdventure.name}</h2>
              <div className="adventure-level">等级 {currentAdventure.level}</div>
            </div>
            
            <div className="monster-info">
              <h3>怪物信息</h3>
              <div className="monster-stats">
                <div className="stat-row">
                  <span>怪物等级:</span>
                  <span>{currentAdventure.monsterLevel}</span>
                </div>
                <div className="stat-row">
                  <span>怪物防御:</span>
                  <span>{monsterStats[currentAdventure.level] || '加载中...'}</span>
                </div>
                <div className="stat-row">
                  <span>预估胜率:</span>
                  <span className={`win-rate ${winRates[currentAdventure.level] > 70 ? 'high' : winRates[currentAdventure.level] > 40 ? 'medium' : 'low'}`}>
                    {winRates[currentAdventure.level] || 0}%
                  </span>
                </div>
                <div className="stat-row">
                  <span>经验奖励:</span>
                  <span>{currentAdventure.baseExp}</span>
                </div>
              </div>
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
                  !currentAdventure.isUnlocked || player.stamina < 1 ? 'disabled' : 
                  winRates[currentAdventure.level] > 70 ? 'high-chance' :
                  winRates[currentAdventure.level] > 40 ? 'medium-chance' : 'low-chance'
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
        <h3>新战斗系统说明</h3>
        <ul>
          <li>选择冒险层数1-10，挑战对应等级的怪物</li>
          <li>胜利后自动解锁下一层冒险</li>
          <li>战斗胜负基于你的攻击力与怪物防御力的随机对决</li>
          <li>胜利获得经验奖励和战斗宝箱</li>
          <li>每次冒险消耗1点体力</li>
          <li>怪物防御力 = 等级 × 5 + 10</li>
          <li>胜率基于你的总攻击力（包含装备加成）</li>
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