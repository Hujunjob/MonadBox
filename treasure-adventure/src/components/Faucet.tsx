import React, { useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { localhost } from '../config/wagmi';
import { monad } from '../config/chains';

export const Faucet: React.FC = () => {
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
  if (process.env.NODE_ENV === 'production' && chainId !== 31337) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #333',
      zIndex: 9999,
      minWidth: '250px',
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>💰 Test Faucet</h4>
      
      <div style={{ marginBottom: '10px', fontSize: '12px' }}>
        <div><strong>Faucet:</strong> {faucetAccount.address.slice(0, 8)}...{faucetAccount.address.slice(-6)}</div>
        <div><strong>网络:</strong> {chainId === 41144 ? 'Monad' : 'Localhost'}</div>
      </div>

      {isConnected ? (
        <div>
          <div style={{ marginBottom: '10px', fontSize: '12px' }}>
            <div><strong>您的地址:</strong> {address?.slice(0, 8)}...{address?.slice(-6)}</div>
            <div><strong>余额:</strong> {balance ? `${balance} ETH` : '点击查询'}</div>
          </div>

          <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
            <button
              onClick={checkBalance}
              style={{
                background: '#2196F3',
                border: 'none',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              查询余额
            </button>

            <button
              onClick={sendETH}
              disabled={isLoading}
              style={{
                background: isLoading ? '#666' : '#4CAF50',
                border: 'none',
                color: 'white',
                padding: '8px 10px',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
              }}
            >
              {isLoading ? '发送中...' : '获取 1 ETH'}
            </button>
          </div>

          {txHash && (
            <div style={{ marginTop: '10px', fontSize: '10px', wordBreak: 'break-all' }}>
              <strong>交易:</strong> {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: '#999' }}>
          请先连接钱包
        </div>
      )}
    </div>
  );
};