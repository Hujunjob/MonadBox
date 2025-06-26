import React, { useState } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

interface WalletChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletConnected: (type: 'external' | 'burner') => void;
}

export const WalletChoiceModal: React.FC<WalletChoiceModalProps> = ({
  isOpen,
  onClose,
  onWalletConnected,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { openConnectModal } = useConnectModal();
  const { } = useAccount();

  const handleExternalWallet = () => {
    onWalletConnected('external');
    if (openConnectModal) {
      openConnectModal();
    }
    onClose();
  };

  const handleBurnerWallet = async () => {
    try {
      setIsConnecting(true);
      onWalletConnected('burner');
      onClose();
    } catch (error) {
      console.error('Failed to create burner wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <h2 
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '16px',
            textAlign: 'center',
            color: '#333',
          }}
        >
          选择钱包类型
        </h2>
        
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={handleExternalWallet}
            disabled={isConnecting}
            style={{
              width: '100%',
              padding: '16px',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              marginBottom: '12px',
              transition: 'background-color 0.2s',
              opacity: isConnecting ? 0.5 : 1,
            }}
            onMouseOver={(e) => {
              if (!isConnecting) {
                e.currentTarget.style.backgroundColor = '#eff6ff';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontWeight: '600', fontSize: '16px', color: '#333', marginBottom: '4px' }}>
                外部钱包
              </h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                连接你的 MetaMask、WalletConnect 或其他外部钱包
              </p>
              <ul style={{ fontSize: '12px', color: '#888', listStyle: 'none', padding: 0 }}>
                <li>• 完全控制你的资金</li>
                <li>• 每笔交易需要确认</li>
                <li>• 安全且永久</li>
              </ul>
            </div>
          </button>

          <button
            onClick={handleBurnerWallet}
            disabled={isConnecting}
            style={{
              width: '100%',
              padding: '16px',
              border: '2px solid #10b981',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              opacity: isConnecting ? 0.7 : 1,
            }}
            onMouseOver={(e) => {
              if (!isConnecting) {
                e.currentTarget.style.backgroundColor = '#f0fdf4';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontWeight: '600', fontSize: '16px', color: '#333', marginBottom: '4px' }}>
                本地钱包 {isConnecting && '(创建中...)'}
              </h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                生成临时钱包，享受无缝游戏体验
              </p>
              <ul style={{ fontSize: '12px', color: '#888', listStyle: 'none', padding: 0 }}>
                <li>• 自动签名交易</li>
                <li>• 无缝游戏体验</li>
                <li>• 临时使用 - 不要存储大额资金</li>
              </ul>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          disabled={isConnecting}
          style={{
            width: '100%',
            padding: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#666',
            cursor: isConnecting ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            transition: 'color 0.2s',
            opacity: isConnecting ? 0.5 : 1,
          }}
          onMouseOver={(e) => {
            if (!isConnecting) {
              e.currentTarget.style.color = '#333';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#666';
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
};