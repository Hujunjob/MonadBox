import React, { useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { localhost } from '../config/wagmi';
import { monad } from '../config/chains';

interface FaucetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Faucet: React.FC<FaucetProps> = ({ isOpen, onClose }) => {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [balance, setBalance] = useState<string>('');

  // Faucet 私钥
  const FAUCET_PRIVATE_KEY = '0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd' as const;
  const faucetAccount = privateKeyToAccount(FAUCET_PRIVATE_KEY);

  const checkBalance = async () => {
    if (!address || !publicClient) return;
    
    try {
      const bal = await publicClient.getBalance({ address });
      setBalance(formatEther(bal));
    } catch (error) {
      console.error('获取余额失败:', error);
    }
  };

  const sendETH = async () => {
    if (!address || !publicClient) {
      alert('请先连接钱包');
      return;
    }

    setIsLoading(true);
    setTxHash('');

    try {
      // 确定使用的链
      const chain = chainId === 41144 ? monad : localhost;
      
      // 创建 faucet 钱包客户端
      const faucetWalletClient = createWalletClient({
        account: faucetAccount,
        chain,
        transport: http(),
      });

      // 检查 faucet 余额
      const faucetBalance = await publicClient.getBalance({ 
        address: faucetAccount.address 
      });
      
      console.log('Faucet 余额:', formatEther(faucetBalance), 'ETH');
      console.log('Faucet 地址:', faucetAccount.address);
      console.log('目标地址:', address);
      
      if (faucetBalance < parseEther('1')) {
        alert('Faucet 余额不足，请联系管理员');
        return;
      }

      // 发送 1 ETH
      const hash = await faucetWalletClient.sendTransaction({
        to: address,
        value: parseEther('1'),
      });

      setTxHash(hash);
      console.log('交易哈希:', hash);

      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('交易确认:', receipt);

      // 更新余额
      await checkBalance();
      
      alert('成功发送 1 ETH！');
    } catch (error: any) {
      console.error('发送失败:', error);
      let errorMessage = '发送失败';
      
      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Faucet 余额不足';
      } else if (error.message?.includes('execution reverted')) {
        errorMessage = '交易被拒绝，可能是网络问题';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 只在开发环境或本地网络显示
  if (!isOpen || (process.env.NODE_ENV === 'production' && chainId !== 31337)) {
    return null;
  }

  return (
    <div style={{
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
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#666',
          }}
        >
          ×
        </button>
        
        <h4 style={{ margin: '0 0 15px 0', color: '#4CAF50', textAlign: 'center' }}>💰 测试水龙头</h4>
      
        <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
          <div><strong>Faucet 地址:</strong> {faucetAccount.address.slice(0, 10)}...{faucetAccount.address.slice(-8)}</div>
          <div><strong>当前网络:</strong> {chainId === 41144 ? 'Monad Testnet' : 'Localhost'}</div>
        </div>

        {isConnected ? (
          <div>
            <div style={{ marginBottom: '15px', fontSize: '14px' }}>
              <div><strong>您的地址:</strong> {address?.slice(0, 10)}...{address?.slice(-8)}</div>
              <div><strong>当前余额:</strong> {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '点击查询'}</div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <button
                onClick={checkBalance}
                style={{
                  background: '#2196F3',
                  border: 'none',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#1976D2';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#2196F3';
                }}
              >
                🔍 查询余额
              </button>

              <button
                onClick={sendETH}
                disabled={isLoading}
                style={{
                  background: isLoading ? '#ccc' : '#4CAF50',
                  border: 'none',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#45a049';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#4CAF50';
                  }
                }}
              >
                {isLoading ? '⏳ 发送中...' : '💰 获取 1 ETH'}
              </button>
            </div>

            {txHash && (
              <div style={{ 
                marginTop: '15px', 
                fontSize: '12px', 
                wordBreak: 'break-all',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                color: '#666'
              }}>
                <strong>交易哈希:</strong><br />
                {txHash}
              </div>
            )}

            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#856404'
            }}>
              ⚠️ 这是测试网络，仅用于开发和测试目的
            </div>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            color: '#666',
            fontSize: '14px'
          }}>
            请先连接钱包才能使用水龙头功能
          </div>
        )}
      </div>
    </div>
  );
};