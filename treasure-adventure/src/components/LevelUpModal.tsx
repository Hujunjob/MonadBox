import React from 'react';
import { getJobLevelDisplay } from '../utils/gameUtils';
import { JobType } from '../types/game';

interface LevelUpModalProps {
  isOpen: boolean;
  oldLevel: number;
  newLevel: number;
  job: JobType;
  statsGained: {
    maxHealth: number;
    attack: number;
    defense: number;
    agility: number;
    criticalRate: number;
    criticalDamage: number;
  };
  onClose: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  oldLevel,
  newLevel,
  job: _job,
  statsGained,
  onClose
}) => {
  if (!isOpen) return null;
  
  // 判断是否为满级提示（等级没有变化且属性提升为0）
  const isMaxLevel = oldLevel === newLevel && statsGained.maxHealth === 0;

  return (
    <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="level-up-modal">
        <div className="level-up-header">
          <h2>{isMaxLevel ? '📊 经验已满！' : '🎉 升级了！'}</h2>
        </div>
        
        <div className="level-up-content">
          <div className="level-display">
            <div className="level-change">
              <span className="old-level">{getJobLevelDisplay(oldLevel, isMaxLevel ? oldLevel * 100 - 1 : 0)}</span>
              <span className="arrow">→</span>
              <span className="new-level">{getJobLevelDisplay(newLevel, newLevel * 100)}</span>
            </div>
          </div>

          {!isMaxLevel && (
            <div className="stats-gained">
              <h3>属性提升</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-name">最大血量</span>
                  <span className="stat-value">+{statsGained.maxHealth}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-name">攻击力</span>
                  <span className="stat-value">+{statsGained.attack}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-name">防御力</span>
                  <span className="stat-value">+{statsGained.defense}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-name">敏捷度</span>
                  <span className="stat-value">+{statsGained.agility}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-name">暴击率</span>
                  <span className="stat-value">+{statsGained.criticalRate}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-name">暴击伤害</span>
                  <span className="stat-value">+{statsGained.criticalDamage}%</span>
                </div>
              </div>
            </div>
          )}

          {isMaxLevel && (
            <div className="max-level-info">
              <div className="info-box">
                <h4>🏆 当前职业经验已满！</h4>
                <p>需要使用转职书提升职业等级才能继续获得经验</p>
                <p>可从宝箱中获取转职书或在商店购买</p>
              </div>
            </div>
          )}

          {newLevel % 4 === 0 && !isMaxLevel && (
            <div className="advancement-warning">
              <div className="warning-box">
                <h4>⚠️ 需要转职！</h4>
                <p>达到{newLevel}级需要转职书才能继续获得经验</p>
              </div>
            </div>
          )}
          
          <button 
            onClick={onClose}
            className="level-up-close-btn"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;