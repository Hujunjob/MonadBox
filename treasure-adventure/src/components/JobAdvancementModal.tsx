import React, { useState } from 'react';
import { useHybridGameStore } from '../store/web3GameStore';
import { getNextJob, canAdvanceJob, getJobLevelDisplay, getJobAdvancementBookImage } from '../utils/gameUtils';
import { GAME_CONFIG } from '../config/gameConfig';
import { JobType } from '../types/game';

interface JobAdvancementModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
}

const JobAdvancementModal: React.FC<JobAdvancementModalProps> = ({ item, isOpen, onClose }) => {
  const hybridStore = useHybridGameStore();
  const player = hybridStore.player;
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen || !item || item.type !== 'job_advancement_book') {
    return null;
  }

  const targetJob = item.targetJob as JobType;
  const bookSuccessRate = GAME_CONFIG.JOB_ADVANCEMENT.SUCCESS_RATES[targetJob] || 20;
  const canUse = canAdvanceJob(player.level);
  const nextJob = getNextJob(player.level);
  const isCorrectBook = nextJob === targetJob;
  
  // 获取源职业和目标职业名称
  const getSourceJobForTarget = (target: JobType): JobType => {
    const jobOrder = [
      JobType.SWORDSMAN,
      JobType.GREAT_SWORDSMAN,
      JobType.TEMPLE_KNIGHT,
      JobType.DRAGON_KNIGHT,
      JobType.SWORD_MASTER,
      JobType.SWORD_GOD,
      JobType.PLANE_LORD
    ];
    const targetIndex = jobOrder.indexOf(target);
    return targetIndex > 0 ? jobOrder[targetIndex - 1] : JobType.SWORDSMAN;
  };
  
  const sourceJob = getSourceJobForTarget(targetJob);
  const sourceJobName = GAME_CONFIG.JOB_ADVANCEMENT.JOB_NAMES[sourceJob] || '剑士';
  const targetJobName = GAME_CONFIG.JOB_ADVANCEMENT.JOB_NAMES[targetJob] || '未知职业';

  const handleAdvancement = async () => {
    if (!canUse || !isCorrectBook || isAdvancing) return;

    setIsAdvancing(true);
    
    try {
      // 在区块链模式下，转职需要调用智能合约
      // 这里暂时显示提示，实际功能需要合约支持
      const advancementResult = {
        success: false,
        message: '区块链模式下暂不支持转职功能'
      };
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

  const currentJobLevelDisplay = getJobLevelDisplay(player.level, player.experience);

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="equipment-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{item.name}</h3>
          <button onClick={handleClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-content">
          {result ? (
            <div className="advancement-result">
              <div style={{ 
                textAlign: 'center', 
                padding: '15px',
                color: result.success ? '#28a745' : '#dc3545'
              }}>
                <h4>{result.success ? '🎉 转职成功！' : '😞 转职失败！'}</h4>
                <p>{result.message}</p>
              </div>
              <button 
                onClick={handleClose}
                className="confirm-btn"
                style={{ width: '100%', padding: '10px', marginTop: '15px' }}
              >
                确定
              </button>
            </div>
          ) : (
            <div className="advancement-info">
              <div className="item-icon-display" style={{ textAlign: 'center', marginBottom: '15px' }}>
                <img 
                  src={getJobAdvancementBookImage(targetJob)} 
                  alt={item.name}
                  style={{ width: '48px', height: '48px', marginBottom: '8px' }}
                />
              </div>
              <div className="item-description">
                <p><strong>转职书:</strong> {sourceJobName}转职为{targetJobName}</p>
                <p><strong>当前级别:</strong> {currentJobLevelDisplay}</p>
                <p><strong>成功率:</strong> <span style={{ color: '#007bff', fontWeight: 'bold' }}>{bookSuccessRate}%</span></p>
              </div>


              <div className="modal-buttons">
                <button 
                  onClick={handleAdvancement}
                  disabled={!canUse || !isCorrectBook || isAdvancing}
                  className="confirm-btn"
                  style={{ 
                    backgroundColor: canUse && isCorrectBook ? '#28a745' : '#6c757d',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: canUse && isCorrectBook ? 'pointer' : 'not-allowed',
                    opacity: isAdvancing ? 0.7 : 1
                  }}
                >
                  {isAdvancing ? '转职中...' : '转职'}
                </button>
                <button 
                  onClick={handleClose}
                  className="cancel-btn"
                  style={{ 
                    backgroundColor: '#6c757d',
                    color: 'white',
                    padding: '8px 16px',
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