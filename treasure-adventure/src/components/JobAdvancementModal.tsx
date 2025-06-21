import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getJobAdvancementSuccessRate, getNextJob, canAdvanceJob } from '../utils/gameUtils';
import { GAME_CONFIG } from '../config/gameConfig';
import { JobType } from '../types/game';

interface JobAdvancementModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
}

const JobAdvancementModal: React.FC<JobAdvancementModalProps> = ({ item, isOpen, onClose }) => {
  const { player, updatePlayer, advanceJob } = useGameStore();
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen || !item || item.type !== 'job_advancement_book') {
    return null;
  }

  const targetJob = item.targetJob as JobType;
  const successRate = getJobAdvancementSuccessRate(targetJob);
  const canUse = canAdvanceJob(player.level);
  const nextJob = getNextJob(player.job);
  const isCorrectBook = nextJob === targetJob;

  const handleAdvancement = async () => {
    if (!canUse || !isCorrectBook || isAdvancing) return;

    setIsAdvancing(true);
    
    try {
      // 使用转职书
      const newInventory = player.inventory.map(invItem => {
        if (invItem.id === item.id) {
          return { ...invItem, quantity: invItem.quantity - 1 };
        }
        return invItem;
      }).filter(invItem => invItem.quantity > 0);

      updatePlayer({ inventory: newInventory });

      // 执行转职
      const advancementResult = await advanceJob(targetJob);
      setResult(advancementResult);
    } catch (error) {
      setResult({
        success: false,
        message: '转职过程中发生错误，请重试。'
      });
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  const jobName = GAME_CONFIG.JOB_ADVANCEMENT.JOB_NAMES[targetJob] || '未知职业';
  const currentJobName = GAME_CONFIG.JOB_ADVANCEMENT.JOB_NAMES[player.job] || '剑士';

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{item.name}</h3>
          <button onClick={handleClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-content">
          {result ? (
            <div className="advancement-result">
              <div style={{ 
                textAlign: 'center', 
                padding: '20px',
                color: result.success ? '#28a745' : '#dc3545'
              }}>
                <h4>{result.success ? '🎉 转职成功！' : '😞 转职失败！'}</h4>
                <p>{result.message}</p>
              </div>
              <button 
                onClick={handleClose}
                className="confirm-btn"
                style={{ width: '100%', padding: '12px', marginTop: '20px' }}
              >
                确定
              </button>
            </div>
          ) : (
            <div className="advancement-info">
              <div className="item-description">
                <p><strong>转职书:</strong> {jobName}</p>
                <p><strong>当前职业:</strong> {currentJobName}</p>
                <p><strong>当前等级:</strong> {player.level}</p>
                <p><strong>成功率:</strong> <span style={{ color: '#007bff', fontWeight: 'bold' }}>{successRate}%</span></p>
              </div>

              {!canUse && (
                <div style={{ 
                  backgroundColor: '#f8d7da', 
                  border: '1px solid #f5c6cb', 
                  borderRadius: '5px', 
                  padding: '10px', 
                  margin: '15px 0',
                  color: '#721c24'
                }}>
                  <strong>⚠️ 只有在4级倍数等级时才能使用转职书！</strong>
                </div>
              )}

              {canUse && !isCorrectBook && (
                <div style={{ 
                  backgroundColor: '#f8d7da', 
                  border: '1px solid #f5c6cb', 
                  borderRadius: '5px', 
                  padding: '10px', 
                  margin: '15px 0',
                  color: '#721c24'
                }}>
                  <strong>⚠️ 这不是您下一个职业的转职书！</strong><br/>
                  您需要的是: {GAME_CONFIG.JOB_ADVANCEMENT.JOB_NAMES[nextJob || 'swordsman']}转职书
                </div>
              )}

              <div style={{ 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                borderRadius: '5px', 
                padding: '10px', 
                margin: '15px 0',
                color: '#856404'
              }}>
                <strong>⚠️ 转职失败将会导致等级下降1级！</strong>
              </div>

              <div className="modal-buttons">
                <button 
                  onClick={handleAdvancement}
                  disabled={!canUse || !isCorrectBook || isAdvancing}
                  className="confirm-btn"
                  style={{ 
                    backgroundColor: canUse && isCorrectBook ? '#28a745' : '#6c757d',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: canUse && isCorrectBook ? 'pointer' : 'not-allowed',
                    opacity: isAdvancing ? 0.7 : 1
                  }}
                >
                  {isAdvancing ? '转职中...' : `使用转职书 (${successRate}%)`}
                </button>
                <button 
                  onClick={handleClose}
                  className="cancel-btn"
                  style={{ 
                    backgroundColor: '#6c757d',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginLeft: '10px'
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobAdvancementModal;