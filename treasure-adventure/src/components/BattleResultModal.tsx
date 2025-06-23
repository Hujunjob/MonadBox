import React from 'react';

interface BattleResultModalProps {
  isOpen: boolean;
  isVictory: boolean;
  monsterName: string;
  expGained: number;
  adventureLevel: number;
  onClose: () => void;
}

const BattleResultModal: React.FC<BattleResultModalProps> = ({
  isOpen,
  isVictory,
  monsterName,
  expGained,
  adventureLevel,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="battle-result-modal">
        <div className="battle-result-header">
          <h2>{isVictory ? '🎉 胜利!' : '💀 失败'}</h2>
        </div>
        
        <div className="battle-result-content">
          {isVictory ? (
            <>
              <p>成功击败了 <strong>{monsterName}</strong>！</p>
              <div className="rewards">
                <div className="reward-item">
                  <span className="reward-icon">📖</span>
                  <span>获得经验: +{expGained}</span>
                </div>
                <div className="reward-item">
                  <span className="reward-icon">📦</span>
                  <span>获得宝箱: +1 (等级{adventureLevel})</span>
                </div>
              </div>
            </>
          ) : (
            <p>被 <strong>{monsterName}</strong> 击败了！</p>
          )}
        </div>
        
        <div className="battle-result-actions">
          <button className="confirm-btn" onClick={onClose}>
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleResultModal;