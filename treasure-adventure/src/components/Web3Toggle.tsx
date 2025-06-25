import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWeb3GameStore, useHybridGameStore } from '../store/web3GameStore';
import RegisterPlayerModal from './RegisterPlayerModal';

const Web3Toggle: React.FC = () => {
  const { isConnected, address } = useAccount();
  const hybridStore = useHybridGameStore();
  const web3Store = useWeb3GameStore();
  const [showRegisterModal, setShowRegisterModal] = useState(false);

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
              onClick={() => setShowRegisterModal(true)}
              className="register-btn"
              disabled={hybridStore.isPending || hybridStore.isConfirming}
            >
              注册玩家
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

      </div>}

      <RegisterPlayerModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />
    </>
  );
};

export default Web3Toggle;