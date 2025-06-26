import React from 'react';
import '../styles/BattleResultModal.css';

interface BattleResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVictory: boolean;
  battleStats: {
    totalRounds: number;
    totalActions: number;
    fighter1Name: string;
    fighter2Name: string;
    fighter1FinalHP: number;
    fighter1MaxHP: number;
    fighter2FinalHP: number;
    fighter2MaxHP: number;
  };
  rewards?: {
    experience: number;
    hasBox: boolean;
    hasRareItem: boolean;
    rareItemName?: string;
  };
  escaped?: boolean;
}

const BattleResultModal: React.FC<BattleResultModalProps> = ({
  isOpen,
  onClose,
  isVictory,
  battleStats,
  rewards,
  escaped = false
}) => {
  if (!isOpen) return null;

  const getResultTitle = () => {
    if (escaped) return '战斗逃脱';
    return isVictory ? '战斗胜利！' : '战斗失败';
  };

  const getResultIcon = () => {
    if (escaped) return '🏃';
    return isVictory ? '🎉' : '💀';
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="battle-result-modal-overlay" onClick={handleOverlayClick} onKeyDown={handleKeyDown}>
      <div className="battle-result-modal">
        <div className="modal-header">
          <div className={`result-icon ${isVictory ? 'victory' : 'defeat'} ${escaped ? 'escape' : ''}`}>
            {getResultIcon()}
          </div>
          <h2 className={`result-title ${isVictory ? 'victory' : 'defeat'} ${escaped ? 'escape' : ''}`}>
            {getResultTitle()}
          </h2>
        </div>

        <div className="modal-content">
          <div className="battle-summary">
            <h3>战斗统计</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">总回合数:</span>
                <span className="stat-value">{battleStats.totalRounds}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">总动作数:</span>
                <span className="stat-value">{battleStats.totalActions}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{battleStats.fighter1Name}:</span>
                <span className="stat-value">{battleStats.fighter1FinalHP}/{battleStats.fighter1MaxHP} HP</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{battleStats.fighter2Name}:</span>
                <span className="stat-value">{battleStats.fighter2FinalHP}/{battleStats.fighter2MaxHP} HP</span>
              </div>
            </div>
          </div>

          {isVictory && !escaped && rewards && (
            <div className="battle-rewards">
              <h3>战斗奖励</h3>
              <div className="rewards-container">
                <div className="reward-item">
                  <span className="reward-icon">⭐</span>
                  <span className="reward-text">经验值 +{rewards.experience}</span>
                </div>
                
                {rewards.hasBox && (
                  <div className="reward-item">
                    <span className="reward-icon">📦</span>
                    <span className="reward-text">获得战斗宝箱</span>
                  </div>
                )}

                {rewards.hasRareItem && (
                  <div className="reward-item rare">
                    <span className="reward-icon">⚔️</span>
                    <span className="reward-text">发现稀有装备：{rewards.rareItemName || '神秘装备'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isVictory && !escaped && (
            <div className="defeat-message">
              <p>战斗失败，但不要气馁！</p>
              <p>提升装备和等级后再来挑战吧！</p>
            </div>
          )}

          {escaped && (
            <div className="escape-message">
              <p>成功逃脱战斗！</p>
              <p>有时候战略性撤退也是明智的选择。</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="confirm-btn"
            onClick={onClose}
            autoFocus
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleResultModal;