import React from 'react';
import { useAccount } from 'wagmi';

export const WalletDebugInfo: React.FC = () => {
  const { address, isConnected, connector, status, chainId } = useAccount();

  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
    }}>
      <h4>钱包调试信息</h4>
      <div><strong>连接状态:</strong> {isConnected ? '已连接' : '未连接'}</div>
      <div><strong>状态:</strong> {status}</div>
      <div><strong>钱包类型:</strong> {connector?.id || '无'}</div>
      <div><strong>链 ID:</strong> {chainId || '无'}</div>
      <div><strong>地址:</strong> {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : '无'}</div>
      <div><strong>是否 Burner:</strong> {connector?.id === 'burnerWallet' ? '是' : '否'}</div>
    </div>
  );
};