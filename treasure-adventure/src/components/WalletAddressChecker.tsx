import React, { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, TREASURE_ADVENTURE_ABI } from '../contracts';
import { useToast } from './ToastManager';

const WalletAddressChecker: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const [checkAddress, setCheckAddress] = useState('');

  // 读取当前连接钱包的玩家数据
  const { data: currentPlayerData, refetch: refetchCurrent } = useReadContract({
    address: CONTRACT_ADDRESSES.TREASURE_ADVENTURE as `0x${string}`,
    abi: TREASURE_ADVENTURE_ABI,
    functionName: 'getPlayer',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && isConnected,
    },
  });

  // 读取指定地址的玩家数据
  const { data: checkPlayerData, refetch: refetchCheck } = useReadContract({
    address: CONTRACT_ADDRESSES.TREASURE_ADVENTURE as `0x${string}`,
    abi: TREASURE_ADVENTURE_ABI,
    functionName: 'getPlayer',
    args: [checkAddress as `0x${string}`],
    query: {
      enabled: !!checkAddress && checkAddress.length === 42,
    },
  });

  const handleCheckAddress = () => {
    if (!checkAddress || checkAddress.length !== 42) {
      showToast('请输入有效的钱包地址', 'error');
      return;
    }
    refetchCheck();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('地址已复制！', 'success');
  };

  return (
    <div className="wallet-checker">
      <div className="checker-header">
        <h4>🔍 钱包地址检查器</h4>
      </div>

      {/* 当前连接的钱包 */}
      {isConnected && (
        <div className="current-wallet">
          <h5>当前连接的钱包:</h5>
          <div className="wallet-info">
            <code onClick={() => copyToClipboard(address!)}>
              {address} 📋
            </code>
          </div>
          
          <div className="player-status">
            <span>注册状态: </span>
            <span className={currentPlayerData?.initialized ? 'registered' : 'not-registered'}>
              {currentPlayerData?.initialized ? '✅ 已注册' : '❌ 未注册'}
            </span>
          </div>

          {currentPlayerData?.initialized && (
            <div className="player-details">
              <div>玩家名称: {currentPlayerData.name}</div>
              <div>等级: {Number(currentPlayerData.level)}</div>
              <div>经验: {Number(currentPlayerData.experience)}</div>
            </div>
          )}

          <button onClick={() => refetchCurrent()} className="refresh-btn">
            🔄 刷新当前钱包数据
          </button>
        </div>
      )}

      {/* 检查其他地址 */}
      <div className="address-checker">
        <h5>检查其他地址:</h5>
        <div className="check-form">
          <input
            type="text"
            placeholder="输入钱包地址 (0x...)"
            value={checkAddress}
            onChange={(e) => setCheckAddress(e.target.value)}
            className="address-input"
          />
          <button onClick={handleCheckAddress} className="check-btn">
            检查
          </button>
        </div>

        {checkAddress && checkAddress.length === 42 && (
          <div className="check-result">
            <div className="player-status">
              <span>注册状态: </span>
              <span className={checkPlayerData?.initialized ? 'registered' : 'not-registered'}>
                {checkPlayerData?.initialized ? '✅ 已注册' : '❌ 未注册'}
              </span>
            </div>

            {checkPlayerData?.initialized && (
              <div className="player-details">
                <div>玩家名称: {checkPlayerData.name}</div>
                <div>等级: {Number(checkPlayerData.level)}</div>
                <div>经验: {Number(checkPlayerData.experience)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 测试账户快速检查 */}
      <div className="test-accounts">
        <h5>测试账户快速检查:</h5>
        <div className="test-account-list">
          {[
            '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
          ].map((addr, index) => (
            <button
              key={index}
              onClick={() => setCheckAddress(addr)}
              className="test-account-btn"
            >
              测试账户 #{index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletAddressChecker;