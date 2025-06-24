import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useConnect } from 'wagmi';
import { WalletChoiceModal } from './WalletChoiceModal';

const WalletConnect: React.FC = () => {
  const { connector } = useAccount();
  const [showWalletChoice, setShowWalletChoice] = useState(false);
  const { connect, connectors } = useConnect();
  
  const handleWalletChoice = (type: 'external' | 'burner') => {
    if (type === 'burner') {
      // 找到 burner wallet connector 并连接
      const burnerConnector = connectors.find(c => c.id === 'burnerWallet');
      if (burnerConnector) {
        connect({ connector: burnerConnector });
      }
    }
    // 对于外部钱包，WalletChoiceModal 会处理 openConnectModal
  };
  
  return (
    <>
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;
        const isBurnerWallet = connector?.id === 'burnerWallet';

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button 
                    onClick={() => setShowWalletChoice(true)} 
                    type="button"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      color: 'white',
                      padding: '8px 16px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    连接钱包
                  </button>
                );
              }

              if (chain && chain.unsupported) {
                return (
                  <button 
                    onClick={openChainModal} 
                    type="button"
                    style={{
                      background: '#ff4444',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      padding: '8px 16px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    错误网络
                  </button>
                );
              }

              return (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {!isBurnerWallet && chain && (
                    <button
                      onClick={openChainModal}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        color: 'white',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      type="button"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            overflow: 'hidden',
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 16, height: 16 }}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </button>
                  )}

                  <button 
                    onClick={openAccountModal} 
                    type="button"
                    style={{
                      background: isBurnerWallet ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                      border: isBurnerWallet ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      color: 'white',
                      padding: '8px 12px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    {isBurnerWallet ? '本地钱包 🔥' : account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
    
    <WalletChoiceModal
      isOpen={showWalletChoice}
      onClose={() => setShowWalletChoice(false)}
      onWalletConnected={handleWalletChoice}
    />
    </>
  );
};

export default WalletConnect;