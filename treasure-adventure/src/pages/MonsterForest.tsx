import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHybridGameStore } from '../store/web3GameStore';
import type { Monster } from '../types/game';
import { useToast } from '../components/ToastManager';

const MonsterForest: React.FC = () => {
  const navigate = useNavigate();
  const hybridStore = useHybridGameStore();
  const player = hybridStore.player;
  const [selectedAdventureLevel, setSelectedAdventureLevel] = useState(1);
  const [isLevelExpanded, setIsLevelExpanded] = useState(false);
  const [monsterKillCounts, setMonsterKillCounts] = useState<{[key: number]: number}>({});
  const { showToast } = useToast();
  const [monsterStats, setMonsterStats] = useState<{[key: number]: Monster}>({});
  // 获取玩家最大解锁层数和最高怪物等级
  const maxUnlockedLevel = hybridStore.maxAdventureLevel || 1;
  
  // 生成冒险层数列表 (当前层级前后5层)
  const getAvailableLevels = () => {
    const currentLevel = selectedAdventureLevel;
    const startLevel = Math.max(1, currentLevel - 5);
    const endLevel = Math.min(1000, currentLevel + 5);
    
    return Array.from({ length: endLevel - startLevel + 1 }, (_, i) => {
      const level = startLevel + i;
      return {
        level,
        name: `第${level}层冒险`,
        isUnlocked: level <= maxUnlockedLevel,
        monsterLevel: level,
        baseExp: level * 10 + 20,
        description: `挑战等级${level}的怪物`
      };
    });
  };
  
  const adventureLevels = getAvailableLevels();
  
  const currentAdventure = adventureLevels.find(adv => adv.level === selectedAdventureLevel);
  
  // 获取怪物图标
  const getMonsterIcon = (monsterLevel: number, status: string) => {
    const icons = ['👹', '👺', '🧌', '🧟', '👻', '🦇', '🐺', '🐉', '🦅', '👑'];
    const icon = icons[monsterLevel - 1] || '👹';
    
    // 根据状态调整图标
    if (status === 'locked') {
      return '🔒';
    }
    return icon;
  };

  // 获取怪物数据和玩家进度
  useEffect(() => {
    const fetchMonsterData = async () => {
      if (!hybridStore.currentPlayerId) return;
      
      try {
        // 获取当前层级的怪物击杀数据
        const killCounts: {[key: number]: number} = {};
        const stats: {[key: number]: any} = {};
        
        for (let monsterLevel = 1; monsterLevel <= 10; monsterLevel++) {
          // 获取怪物击杀次数
          if (typeof hybridStore.getMonsterKillCount === 'function') {
            const killCount = await hybridStore.getMonsterKillCount(selectedAdventureLevel, monsterLevel);
            killCounts[monsterLevel] = killCount || 0;
          }
          
          // 计算怪物完整属性
          const stat= await hybridStore.getMonsterStats(selectedAdventureLevel,monsterLevel)
          stats[monsterLevel] = stat
          console.log("getMonsterStats",selectedAdventureLevel,monsterLevel, stat);
          
        }
        
        setMonsterKillCounts(killCounts);
        setMonsterStats(stats);
      } catch (error) {
        console.error('Failed to fetch monster data:', error);
      }
    };
    
    fetchMonsterData();
  }, [hybridStore.currentPlayerId, selectedAdventureLevel]);

  // 监听战斗结果事件
  // useEffect(() => {
  //   const handleBattleResult = (event: any) => {
  //     const result = event.detail;
  //     setBattleResult({
  //       isOpen: true,
  //       isVictory: result.isVictory,
  //       monsterName: result.monsterName,
  //       expGained: result.experienceGained,
  //       adventureLevel: result.adventureLevel
  //     });
  //   };

  //   window.addEventListener('battleResult', handleBattleResult);
    
  //   return () => {
  //     window.removeEventListener('battleResult', handleBattleResult);
  //   };
  // }, []);

  // const handleCloseBattleResult = () => {
  //   setBattleResult(prev => ({ ...prev, isOpen: false }));
    
  //   // 战斗结果弹窗关闭后重新获取怪物数据，以更新挑战状态
  //   const refetchMonsterData = async () => {
  //     if (!hybridStore.currentPlayerId) return;
      
  //     try {
  //       // 重新获取当前层级的怪物击杀数据
  //       const killCounts: {[key: number]: number} = {};
        
  //       for (let monsterLevel = 1; monsterLevel <= 10; monsterLevel++) {
  //         if (typeof hybridStore.getMonsterKillCount === 'function') {
  //           const killCount = await hybridStore.getMonsterKillCount(selectedAdventureLevel, monsterLevel);
  //           killCounts[monsterLevel] = killCount || 0;
  //         }
  //       }
        
  //       setMonsterKillCounts(killCounts);
        
  //       // 刷新玩家数据
  //       // if (typeof hybridStore.refreshPlayerData === 'function') {
  //       //   await hybridStore.refreshPlayerData();
  //       // }
        
  //     } catch (error) {
  //       console.error('Failed to refresh monster data:', error);
  //     }
  //   };
    
    // 延迟一点执行，确保链上数据已更新
  //   setTimeout(() => {
  //     refetchMonsterData();
  //   }, 1000);
  // };
  
  // 获取怪物挑战状态
  const getMonsterChallengeStatus = (monsterLevel: number) => {
    const killCount = monsterKillCounts[monsterLevel] || 0;
    
    if (killCount > 0) {
      return 'defeated'; // 已击败，可以再次攻击
    } else if (monsterLevel === 1 || monsterKillCounts[monsterLevel - 1] > 0) {
      return 'available'; // 可以挑战
    } else {
      return 'locked'; // 未解锁
    }
  };
  
  // 获取挑战按钮文本
  const getChallengeButtonText = (monsterLevel: number) => {
    const status = getMonsterChallengeStatus(monsterLevel);
    switch (status) {
      case 'defeated':
        return '再次攻击';
      case 'available':
        return '挑战';
      case 'locked':
        return '未解锁';
      default:
        return '挑战';
    }
  };
  
  // 获取挑战按钮是否可用
  const isChallengeButtonEnabled = (monsterLevel: number) => {
    const status = getMonsterChallengeStatus(monsterLevel);
    return status === 'defeated' || status === 'available';
  };
  
  const handleStartAdventure = async (adventureLevel: number, monsterLevel: number) => {
    console.log('handleStartAdventure called:', { adventureLevel, monsterLevel });
    console.log('Player state:', { stamina: player.stamina, id: player.id, name: player.name });
    console.log('maxUnlockedLevel:', maxUnlockedLevel);
    
    if (player.stamina < 1) {
      showToast('体力不足，无法战斗！请等待体力恢复。');
      return;
    }
    
    if (adventureLevel > maxUnlockedLevel) {
      showToast(`第${adventureLevel}层尚未解锁！请先完成第${maxUnlockedLevel}层冒险。`);
      return;
    }
    
    // 检查是否可以挑战该怪物（必须按顺序挑战）
    if (monsterLevel > 1 && monsterKillCounts[monsterLevel - 1] === 0) {
      showToast(`必须先击败第${monsterLevel - 1}号怪物才能挑战第${monsterLevel}号怪物！`);
      return;
    }
    
    // 检查startAdventure方法是否存在
    if (typeof hybridStore.startAdventure !== 'function') {
      console.error('startAdventure method not available');
      showToast('游戏方法不可用，请重新加载页面');
      return;
    }
    
    console.log('Calling startAdventure...');
    try {
      const battleInfo = await hybridStore.startAdventure(adventureLevel, monsterLevel);
      console.log('startAdventure returned:', battleInfo);
      
      if (battleInfo && (typeof battleInfo === 'string' || battleInfo.battleId)) {
        // 兼容旧版本：如果返回string就是battleId，如果是对象就取battleId
        const battleId = typeof battleInfo === 'string' ? battleInfo : battleInfo.battleId;
        
        // 构建URL参数
        const params = new URLSearchParams({
          type: 'adventure',
          fighter1Name: player.name,
          fighter2Name: `第${adventureLevel}层怪物${monsterLevel}`,
          fighter1Id: player.id.toString(),
          fighter2Id: '0'
        });
        
        // 如果有fighter stats信息，添加到URL参数
        if (typeof battleInfo === 'object' && battleInfo.fighter1Stats && battleInfo.fighter2Stats) {
          params.append('fighter1Stats', JSON.stringify(battleInfo.fighter1Stats));
          params.append('fighter2Stats', JSON.stringify(battleInfo.fighter2Stats));
        } else {
          // 如果没有从receipt解析到stats，使用本地的数据
          
          // 玩家属性（从hybridStore获取）
          const playerStats = {
            id: player.id,
            type: 1, // Player type
            health: player.health,
            maxHealth: player.maxHealth,
            attack: player.attack,
            defense: player.defense,
            agility: player.agility,
            criticalRate: player.criticalRate || 5,
            criticalDamage: player.criticalDamage || 150
          };
          
          // 怪物属性
          const monsterData = monsterStats[monsterLevel] || {
            health: 100, attack: 10, defense: 10, agility: 10, 
            criticalRate: 5, criticalDamage: 150
          };
          
          const monsterStats2 = {
            id: 0,
            type: 2, // NPC type
            health: monsterData.health,
            maxHealth: monsterData.health,
            attack: monsterData.attack,
            defense: monsterData.defense,
            agility: monsterData.agility,
            criticalRate: monsterData.criticalRate,
            criticalDamage: monsterData.criticalDamage
          };
          
          params.append('fighter1Stats', JSON.stringify(playerStats));
          params.append('fighter2Stats', JSON.stringify(monsterStats2));
        }
        
        const url = `/battle/${battleId}?${params.toString()}`;
        console.log('Navigating to:', url);
        navigate(url);
      } else {
        console.log('No battleId returned');
      }
    } catch (error) {
      console.error('Adventure failed:', error);
      alert('战斗发起失败: ' + (error as Error).message);
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
          <h3>冒险模式</h3>
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
      
      {/* 当前层级的10只怪物 */}
      {currentAdventure && (
        <div className="monsters-section">          
          <div className="monsters-grid">
            {Array.from({ length: 10 }, (_, index) => {
              const monsterLevel = index + 1;
              const status = getMonsterChallengeStatus(monsterLevel);
              const monsterData = monsterStats[monsterLevel]?monsterStats[monsterLevel]:{criticalRate:5,health:100,attack:10,defense:10,agility:10,criticalDamage:150};
              console.log("monsterData",monsterLevel,currentAdventure.level,monsterData);
              
              const killCount = monsterKillCounts[monsterLevel] || 0;
              
              return (
                <div 
                  key={monsterLevel} 
                  className={`monster-card ${status}`}
                >
                  <div className="monster-header">
                    <div className="monster-level-badge">Lv.{monsterLevel}</div>
                    <div className="monster-name">怪物 {monsterLevel}</div>
                    {killCount > 0 && (
                      <div className="kill-count-badge">已击败 {killCount}次</div>
                    )}
                  </div>
                  
                  <div className="monster-avatar">
                    <div className="monster-icon">{getMonsterIcon(monsterLevel, status)}</div>
                  </div>
                  
                  <div className="monster-stats">
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-icon">❤️</span>
                        <span className="stat-value">{monsterData.health || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon">⚔️</span>
                        <span className="stat-value">{monsterData.attack || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon">🛡️</span>
                        <span className="stat-value">{monsterData.defense || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon">💨</span>
                        <span className="stat-value">{monsterData.agility || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon">💥</span>
                        <span className="stat-value">{monsterData.criticalRate || 0}%</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon">⭐</span>
                        <span className="stat-value">+{monsterData.criticalDamage || 0}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="monster-actions">
                    <button
                      className={`challenge-btn ${status} ${
                        player.stamina < 1 ? 'no-stamina' : ''
                      }`}
                      disabled={
                        !isChallengeButtonEnabled(monsterLevel) || 
                        player.stamina < 1 || 
                        hybridStore.isPending ||
                        selectedAdventureLevel > maxUnlockedLevel
                      }
                      onClick={() => handleStartAdventure(selectedAdventureLevel, monsterLevel)}
                    >
                      {hybridStore.isPending ? '⚔️ 战斗中...' :
                       player.stamina < 1 ? '😴 体力不足' :
                       selectedAdventureLevel > maxUnlockedLevel ? '🔒 层级未解锁' :
                       status === 'defeated' ? '🔄 再次挑战' :
                       status === 'available' ? '⚡ 挑战' :
                       '🔒 未解锁'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="adventure-info">
        <h3>📊 属性图标说明</h3>
        <div className="icon-legend">
          <div className="legend-row">
            <span className="legend-icon">❤️</span>
            <span className="legend-text">生命值</span>
            <span className="legend-icon">⚔️</span>
            <span className="legend-text">攻击力</span>
            <span className="legend-icon">🛡️</span>
            <span className="legend-text">防御力</span>
          </div>
          <div className="legend-row">
            <span className="legend-icon">💨</span>
            <span className="legend-text">敏捷度</span>
            <span className="legend-icon">💥</span>
            <span className="legend-text">暴击率</span>
            <span className="legend-icon">⭐</span>
            <span className="legend-text">暴击伤害</span>
          </div>
        </div>
        
        <h3>🎮 冒险系统说明</h3>
        <ul>
          <li>选择冒险层数1-1000，每层有10只逐渐变强的怪物</li>
          <li>必须按顺序击败怪物，击败10只怪物后解锁下一层</li>
          <li>战斗胜负基于你的攻击力与怪物防御力的随机对决</li>
          <li>胜利获得经验奖励和战斗宝箱</li>
          <li>每次冒险消耗1点体力</li>
          <li>怪物随层级增强，每1000层显著提升难度</li>
        </ul>
      </div>
    </div>
  );
};

export default MonsterForest;