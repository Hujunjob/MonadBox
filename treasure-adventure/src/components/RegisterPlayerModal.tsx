import React, { useState } from 'react';
import { useHybridGameStore } from '../store/web3GameStore';
import { useToast } from './ToastManager';

interface RegisterPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterPlayerModal: React.FC<RegisterPlayerModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const hybridStore = useHybridGameStore();
  const [playerName, setPlayerName] = useState('');

  const handleRegister = async () => {
    if (!playerName.trim()) {
      showToast('请输入玩家名称', 'error');
      return;
    }

    if (playerName.length < 2 || playerName.length > 20) {
      showToast('玩家名称长度应为2-20字符', 'error');
      return;
    }

    if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(playerName)) {
      showToast('玩家名称只能包含中文、英文、数字、下划线', 'error');
      return;
    }

    try {
      await hybridStore.registerPlayer(playerName);
      setPlayerName('');
      onClose();
      showToast('正在注册玩家...', 'info');
    } catch (error) {
      showToast('注册失败，请重试', 'error');
    }
  };

  const handleClose = () => {
    setPlayerName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal register-player-modal">
        <div className="modal-header">
          <h3>🎮 注册链上玩家</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="register-info">
            <p>首次使用需要在区块链上注册玩家角色</p>
            <p>注册后您的游戏数据将永久保存在链上</p>
          </div>
          
          <div className="form-group">
            <label>玩家名称:</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="输入玩家名称 (2-20字符)"
              maxLength={20}
              className="register-input"
              autoFocus
            />
          </div>
          
          <div className="register-rules">
            <small>只允许中文、英文、数字、下划线</small>
          </div>
          
          {hybridStore.isPending && (
            <div className="transaction-status">
              📝 交易待确认...
            </div>
          )}

          {hybridStore.isConfirming && (
            <div className="transaction-status">
              ⏳ 等待区块确认...
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button
            onClick={handleRegister}
            className="confirm-btn primary"
            disabled={hybridStore.isPending || hybridStore.isConfirming || !playerName.trim()}
          >
            {hybridStore.isPending ? '注册中...' : '确认注册'}
          </button>
          <button
            onClick={handleClose}
            className="cancel-btn"
            disabled={hybridStore.isPending || hybridStore.isConfirming}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPlayerModal;