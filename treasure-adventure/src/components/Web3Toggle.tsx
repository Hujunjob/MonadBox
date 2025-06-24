import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWeb3GameStore, useHybridGameStore } from '../store/web3GameStore';
import { useToast } from './ToastManager';

const Web3Toggle: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { showToast } = useToast();
  const hybridStore = useHybridGameStore();
  const web3Store = useWeb3GameStore();
  const [showRegisterForm, setShowRegisterForm] = useState(false);
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
      setShowRegisterForm(false);
      setPlayerName('');
      showToast('正在注册玩家...', 'info');
    } catch (error) {
      showToast('注册失败，请重试', 'error');
    }
  };

  return (
    <>
      {hybridStore.isPlayerRegistered ? <></> : <div className="web3-toggle-container">
        <div className="mode-info">

          {isConnected && (
            <div className="web3-info">
              {/* <div className="wallet-info">
              钱包: {address?.slice(0, 6)}...{address?.slice(-4)}
            </div> */}
              {hybridStore.isPlayerRegistered ? (
                <div className="player-status"></div>
              ) : (
                <div className="player-status">❌ 未注册</div>
              )}
            </div>
          )}

          {/* 注册提示 */}
          {isConnected && !hybridStore.isPlayerRegistered && (
            <div className="register-prompt">
              <div className="register-message">
                🎮 首次使用需要在区块链上注册玩家
              </div>
            </div>
          )}
        </div>

        <div className="mode-controls">
          {/* 注册按钮 */}
          {isConnected && !hybridStore.isPlayerRegistered && (
            <button
              onClick={() => setShowRegisterForm(!showRegisterForm)}
              className="register-btn"
              disabled={hybridStore.isPending || hybridStore.isConfirming}
            >
              {showRegisterForm ? '取消注册' : '注册玩家'}
            </button>
          )}
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

        {web3Store.pendingOperations.length > 0 && (
          <div className="pending-operations">
            <div className="pending-info">
              📋 待同步操作: {web3Store.pendingOperations.length} 项
            </div>
            <div className="pending-hint">
              启用 Web3 模式后可同步到区块链
            </div>
          </div>
        )}

        {/* 注册表单 */}
        {showRegisterForm && isConnected && !hybridStore.isPlayerRegistered && (
          <div className="register-form">
            <h4>注册链上玩家</h4>
            <div className="form-group">
              <label>玩家名称:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="输入玩家名称 (2-20字符)"
                maxLength={20}
                className="register-input"
              />
            </div>
            <div className="register-rules">
              只允许中文、英文、数字、下划线
            </div>
            <div className="form-actions">
              <button
                onClick={handleRegister}
                className="confirm-register-btn"
                disabled={hybridStore.isPending || hybridStore.isConfirming || !playerName.trim()}
              >
                {hybridStore.isPending ? '注册中...' : '确认注册'}
              </button>
              <button
                onClick={() => setShowRegisterForm(false)}
                className="cancel-register-btn"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>}

    </>

  );
};

export default Web3Toggle;