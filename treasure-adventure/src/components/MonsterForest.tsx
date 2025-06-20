import React from 'react';
import { useGameStore } from '../store/gameStore';

const MonsterForest: React.FC = () => {
  const { player, forestLevels, startBattle } = useGameStore();
  
  const currentForest = forestLevels.find(forest => forest.level === player.currentForestLevel);
  
  const handleFightMonster = (monster: any) => {
    if (player.health <= 0) {
      alert('血量不足，无法战斗！请使用血瓶恢复。');
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
                forest.level === player.currentForestLevel ? 'current' : ''
              }`}
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
          <h3>{currentForest.name} - 第{player.currentForestLevel}层</h3>
          <p>进度: {player.currentForestProgress}/10 只怪物</p>
          
          <div className="monsters-grid">
            {currentForest.monsters.map((monster, index) => {
              const isDefeated = index < player.currentForestProgress;
              const isCurrent = index === player.currentForestProgress;
              const isLocked = index > player.currentForestProgress;
              
              return (
                <div 
                  key={monster.id} 
                  className={`monster-card ${
                    isDefeated ? 'defeated' : 
                    isCurrent ? 'current' : 
                    'locked'
                  }`}
                >
                  <h4>{monster.name}</h4>
                  <div className="monster-stats">
                    <div>等级: {monster.level}</div>
                    <div>血量: {monster.health}</div>
                    <div>攻击: {monster.attack}</div>
                    <div>防御: {monster.defense}</div>
                    <div>敏捷: {monster.agility}</div>
                  </div>
                  <div className="monster-rewards">
                    <div>经验: +{monster.experience}</div>
                    <div>金币: +{monster.goldDrop}</div>
                  </div>
                  
                  {isDefeated && (
                    <div className="defeated-label">已击败</div>
                  )}
                  
                  {isCurrent && (
                    <button 
                      onClick={() => handleFightMonster(monster)}
                      className="fight-btn"
                      disabled={player.health <= 0}
                    >
                      战斗
                    </button>
                  )}
                  
                  {isLocked && (
                    <div className="locked-label">未解锁</div>
                  )}
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