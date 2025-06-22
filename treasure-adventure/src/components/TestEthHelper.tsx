import React, { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useToast } from './ToastManager';

const TestEthHelper: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const [showInstructions, setShowInstructions] = useState(false);
  
  const { data: balance } = useBalance({
    address: address,
  });

  const hasLowBalance = balance && Number(balance.formatted) < 0.01;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('已复制到剪贴板！', 'success');
  };

  const testAccounts = [
    {
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      balance: '10000 ETH'
    },
    {
      address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      balance: '10000 ETH'
    }
  ];

  if (!isConnected) return null;

  return (
    <div className="test-eth-helper">
      {hasLowBalance && (
        <div className="low-balance-warning">
          ⚠️ 余额不足，需要 ETH 来支付交易费用
        </div>
      )}

      <div className="balance-info">
        <span className="balance-label">当前余额:</span>
        <span className="balance-amount">
          {balance ? `${Number(balance.formatted).toFixed(4)} ${balance.symbol}` : '加载中...'}
        </span>
      </div>

      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="instructions-toggle"
      >
        {showInstructions ? '隐藏说明' : '获取测试 ETH'}
      </button>

      {showInstructions && (
        <div className="instructions-panel">
          <div className="instructions-header">
            <h4>📖 获取测试 ETH 指南</h4>
          </div>

          <div className="network-config">
            <h5>1. 配置本地网络</h5>
            <div className="config-item">
              <span>网络名称:</span>
              <code>Localhost 8545</code>
            </div>
            <div className="config-item">
              <span>RPC URL:</span>
              <code onClick={() => copyToClipboard('http://127.0.0.1:8545')}>
                http://127.0.0.1:8545 📋
              </code>
            </div>
            <div className="config-item">
              <span>链 ID:</span>
              <code onClick={() => copyToClipboard('31337')}>31337 📋</code>
            </div>
            <div className="config-item">
              <span>货币符号:</span>
              <code>ETH</code>
            </div>
          </div>

          <div className="test-accounts">
            <h5>2. 使用测试账户</h5>
            <p className="account-note">选择一个测试账户导入到 MetaMask：</p>
            
            {testAccounts.map((account, index) => (
              <div key={index} className="account-card">
                <div className="account-header">
                  <strong>测试账户 #{index + 1}</strong>
                  <span className="account-balance">{account.balance}</span>
                </div>
                
                <div className="account-info">
                  <div className="info-row">
                    <span>地址:</span>
                    <code onClick={() => copyToClipboard(account.address)}>
                      {account.address.slice(0, 10)}...{account.address.slice(-8)} 📋
                    </code>
                  </div>
                  
                  <div className="info-row">
                    <span>私钥:</span>
                    <code onClick={() => copyToClipboard(account.privateKey)}>
                      {account.privateKey.slice(0, 10)}...{account.privateKey.slice(-8)} 📋
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="import-steps">
            <h5>3. 导入步骤</h5>
            <ol>
              <li>打开 MetaMask → 点击账户图标</li>
              <li>选择"导入账户"</li>
              <li>粘贴上面的私钥</li>
              <li>确认导入</li>
              <li>切换到 Localhost 8545 网络</li>
            </ol>
          </div>

          <div className="security-warning">
            <h5>⚠️ 安全提醒</h5>
            <p>这些是公开的测试账户，仅用于本地开发。<br/>
            <strong>切勿在主网或其他网络中使用这些私钥！</strong></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestEthHelper;