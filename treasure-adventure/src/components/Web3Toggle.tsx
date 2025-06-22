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

  const handleToggleWeb3Mode = () => {
    if (!hybridStore.isWeb3Mode && !isConnected) {
      showToast('请先连接钱包以启用 Web3 模式', 'error');
      return;
    }

    hybridStore.toggleWeb3Mode();
    
    if (!hybridStore.isWeb3Mode) {
      showToast('已启用 Web3 模式 - 数据将存储在区块链上', 'success');
    } else {
      showToast('已切换到本地模式 - 数据存储在本地', 'info');
    }
  };

  const handleSync = async () => {
    if (!isConnected) {
      showToast('请先连接钱包', 'error');
      return;
    }

    try {
      await hybridStore.syncWithBlockchain();
      showToast('数据同步成功！', 'success');
    } catch (error) {
      showToast('数据同步失败', 'error');
    }
  };

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
    <div className="web3-toggle-container">
      <div className="mode-info">
        <div className="current-mode">
          当前模式: {hybridStore.isWeb3Mode ? '🔗 Web3 链上模式' : '💻 本地模式'}
        </div>
        
        {hybridStore.isWeb3Mode && hybridStore.isPlayerRegistered && (
          <div style={{ fontSize: '12px', color: '#28a745', marginTop: '5px' }}>
            ⚔️ 战斗结果将自动上链记录
          </div>
        )}
        
        {hybridStore.isWeb3Mode && isConnected && (
          <div className="web3-info">
            <div className="wallet-info">
              钱包: {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
            {hybridStore.isPlayerRegistered ? (
              <div className="player-status">✅ 已注册</div>
            ) : (
              <div className="player-status">❌ 未注册</div>
            )}
          </div>
        )}

        {/* 注册提示 */}
        {hybridStore.isWeb3Mode && isConnected && !hybridStore.isPlayerRegistered && (
          <div className="register-prompt">
            <div className="register-message">
              🎮 首次使用需要在区块链上注册玩家
            </div>
          </div>
        )}
      </div>

      <div className="mode-controls">
        <button
          onClick={handleToggleWeb3Mode}
          className={`mode-toggle-btn ${hybridStore.isWeb3Mode ? 'web3-active' : 'local-active'}`}
          disabled={hybridStore.isPending || hybridStore.isConfirming}
        >
          {hybridStore.isWeb3Mode ? '切换到本地模式' : '启用 Web3 模式'}
        </button>

        {/* 注册按钮 */}
        {hybridStore.isWeb3Mode && isConnected && !hybridStore.isPlayerRegistered && (
          <button
            onClick={() => setShowRegisterForm(!showRegisterForm)}
            className="register-btn"
            disabled={hybridStore.isPending || hybridStore.isConfirming}
          >
            {showRegisterForm ? '取消注册' : '注册玩家'}
          </button>
        )}

        {hybridStore.isWeb3Mode && isConnected && web3Store.pendingOperations.length > 0 && (
          <button
            onClick={handleSync}
            className="sync-btn"
            disabled={hybridStore.syncInProgress}
          >
            {hybridStore.syncInProgress ? '同步中...' : `同步 (${web3Store.pendingOperations.length})`}
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

      {!hybridStore.isWeb3Mode && web3Store.pendingOperations.length > 0 && (
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
      {showRegisterForm && hybridStore.isWeb3Mode && isConnected && !hybridStore.isPlayerRegistered && (
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
    </div>
  );
};

export default Web3Toggle;