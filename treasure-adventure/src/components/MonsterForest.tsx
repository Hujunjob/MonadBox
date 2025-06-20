import React from 'react';
import { useGameStore } from '../store/gameStore';

const MonsterForest: React.FC = () => {
  const { player, forestLevels, startBattle } = useGameStore();
  const [selectedForestLevel, setSelectedForestLevel] = React.useState(player.currentForestLevel);
  
  const currentForest = forestLevels.find(forest => forest.level === selectedForestLevel);
  
  const handleFightMonster = (monster: any) => {
    if (player.health <= 0) {
      alert('血量不足，无法战斗！请使用血瓶恢复。');
      return;
    }
    if (player.stamina < 1) {
      alert('体力不足，无法战斗！请等待体力恢复。');
      return;
    }
    startBattle(monster);
  };
  
  return (
    <div className="monster-forest">
      <h2>怪物森林</h2>
      
      <div className="forest-levels">
        <h3>森林等级</h3>
        <div className="level-list">
          {forestLevels.map(forest => (
            <div 
              key={forest.level} 
              className={`forest-level ${forest.isUnlocked ? 'unlocked' : 'locked'} ${
                forest.level === selectedForestLevel ? 'selected' : ''
              } ${forest.level === player.currentForestLevel ? 'current' : ''}`}
              onClick={() => forest.isUnlocked && setSelectedForestLevel(forest.level)}
              style={{ cursor: forest.isUnlocked ? 'pointer' : 'default' }}
            >
              <span>{forest.name}</span>
              <span>
                {forest.isUnlocked ? 
                  (forest.level === player.currentForestLevel ? 
                    `进度: ${player.currentForestProgress}/10` : 
                    '已完成'
                  ) : 
                  '未解锁'
                }
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {currentForest && (
        <div className="current-forest">
          <h3>{currentForest.name} - 第{selectedForestLevel}层</h3>
          {selectedForestLevel === player.currentForestLevel ? (
            <p>当前进度: {player.currentForestProgress}/10 只怪物</p>
          ) : (
            <p>重新挑战已完成的森林层级</p>
          )}
          
          <div className="monsters-grid">
            {currentForest.monsters.map((monster, index) => {
              // 如果是当前层级，使用正常的进度逻辑
              // 如果是已完成的层级，所有怪物都可以挑战
              const isCurrentLevel = selectedForestLevel === player.currentForestLevel;
              const isDefeated = isCurrentLevel ? index < player.currentForestProgress : false;
              const isCurrent = isCurrentLevel ? index === player.currentForestProgress : false;
              const isLocked = isCurrentLevel ? index > player.currentForestProgress : false;
              const canFight = isCurrentLevel ? (!isLocked && player.health > 0 && player.stamina >= 1) : (player.health > 0 && player.stamina >= 1);
              
              return (
                <div 
                  key={monster.id} 
                  className={`monster-card-compact ${
                    isDefeated ? 'defeated' : 
                    isCurrent ? 'current' : 
                    isLocked ? 'locked' : 'available'
                  }`}
                >
                  <div className="monster-header">
                    <span className="monster-name">{monster.name}</span>
                    <span className="monster-level">Lv.{monster.level}</span>
                  </div>
                  
                  <div className="monster-info-compact">
                    <div className="stat-row">
                      <span>❤️{monster.health}</span>
                      <span>⚔️{monster.attack}</span>
                    </div>
                    <div className="reward-row">
                      <span>📖{monster.experience}</span>
                      <span>💰{monster.goldDrop}</span>
                    </div>
                  </div>
                  
                  {isDefeated && (
                    <div className="status-label defeated">✓</div>
                  )}
                  {isCurrent && (
                    <div className="status-label current">●</div>
                  )}
                  {isLocked && (
                    <div className="status-label locked">🔒</div>
                  )}
                  
                  <button 
                    onClick={() => handleFightMonster(monster)}
                    className={`fight-btn-compact ${!canFight ? 'disabled' : ''}`}
                    disabled={!canFight}
                  >
                    {isDefeated ? '重战' : '挑战'}
                  </button>
                </div>
              );
            })}
          </div>
          
          {player.currentForestProgress >= 10 && player.currentForestLevel < 10 && (
            <div className="level-complete">
              <p>恭喜！你已经完成了这一层森林！</p>
              <p>下一层森林已解锁！</p>
            </div>
          )}
          
          {player.currentForestLevel >= 10 && player.currentForestProgress >= 10 && (
            <div className="game-complete">
              <p>🎉 恭喜！你已经征服了整个怪物森林！🎉</p>
            </div>
          )}
        </div>
      )}
      
      <div className="forest-info">
        <h3>规则说明</h3>
        <ul>
          <li>每层森林有10只怪物，必须按顺序击败</li>
          <li>击败10只怪物后，下一层森林解锁</li>
          <li>每击败一只怪物获得经验、金币和宝箱</li>
          <li>怪物等级越高，奖励越丰富</li>
          <li>战斗需要消耗血量，注意及时恢复</li>
        </ul>
      </div>
    </div>
  );
};

export default MonsterForest;