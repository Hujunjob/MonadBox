import React from 'react';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { useToast } from './ToastManager';
import { useWeb3GameV2 } from '../hooks/useWeb3GameV2';

const NetworkDebugger: React.FC = () => {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { showToast } = useToast();
  const { playerData, isPlayerRegistered, refetchPlayer } = useWeb3GameV2();
  
  const { data: balance } = useBalance({
    address: address,
  });

  const expectedChainId = 31337;
  const isCorrectNetwork = chainId === expectedChainId;

  const switchToLocalNetwork = async () => {
    if (!(window as any).ethereum) {
      showToast('请安装 MetaMask', 'error');
      return;
    }

    try {
      // 尝试切换到本地网络
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }], // 31337 的十六进制
      });
    } catch (switchError: any) {
      // 如果网络不存在，添加网络
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x7a69', // 31337 的十六进制
                chainName: 'Localhost 8545',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['http://127.0.0.1:8545'],
              },
            ],
          });
          showToast('网络添加成功！', 'success');
        } catch (addError) {
          showToast('添加网络失败', 'error');
        }
      } else {
        showToast('切换网络失败', 'error');
      }
    }
  };

  const handleRefreshData = async () => {
    try {
      await refetchPlayer();
      showToast('数据刷新成功！', 'success');
    } catch (error) {
      showToast('数据刷新失败', 'error');
    }
  };

  if (!isConnected) {
    return (
      <div className="network-debugger">
        <div className="debug-status">
          🔌 请先连接钱包
        </div>
      </div>
    );
  }

  return (
    <div className="network-debugger">
      <div className="debug-header">
        <h4>🔧 网络调试信息</h4>
      </div>

      <div className="debug-info">
        <div className="debug-item">
          <span>钱包地址:</span>
          <code>{address?.slice(0, 10)}...{address?.slice(-8)}</code>
        </div>

        <div className="debug-item">
          <span>当前链 ID:</span>
          <code className={isCorrectNetwork ? 'correct' : 'incorrect'}>
            {chainId} {isCorrectNetwork ? '✅' : '❌'}
          </code>
        </div>

        <div className="debug-item">
          <span>期望链 ID:</span>
          <code>31337 (Localhost)</code>
        </div>

        <div className="debug-item">
          <span>网络名称:</span>
          <code>{chain?.name || '未知'}</code>
        </div>

        <div className="debug-item">
          <span>余额:</span>
          <code>
            {balance ? `${Number(balance.formatted).toFixed(4)} ${balance.symbol}` : '加载中...'}
          </code>
        </div>

        <div className="debug-item">
          <span>玩家注册状态:</span>
          <code className={isPlayerRegistered ? 'correct' : 'incorrect'}>
            {isPlayerRegistered ? '已注册 ✅' : '未注册 ❌'}
          </code>
        </div>

        {playerData && (
          <div className="debug-item">
            <span>玩家数据:</span>
            <code>
              {playerData.name} (Lv.{playerData.level})
            </code>
          </div>
        )}
      </div>

      {!isCorrectNetwork && (
        <div className="network-warning">
          <div className="warning-message">
            ⚠️ 网络不匹配！当前连接的不是本地测试网络
          </div>
          <button
            onClick={switchToLocalNetwork}
            className="switch-network-btn"
          >
            🔄 切换到本地网络
          </button>
        </div>
      )}

      {isCorrectNetwork && (
        <div className="network-success">
          ✅ 网络配置正确，可以进行交易
          <button
            onClick={handleRefreshData}
            className="refresh-data-btn"
          >
            🔄 刷新数据
          </button>
        </div>
      )}

      <div className="debug-tips">
        <h5>📝 调试提示:</h5>
        <ul>
          <li>确保 Hardhat 节点正在运行 (npm run contracts:node)</li>
          <li>MetaMask 应连接到 Localhost 8545 网络</li>
          <li>使用提供的测试账户私钥导入钱包</li>
          <li>链 ID 必须是 31337</li>
        </ul>
      </div>
    </div>
  );
};

export default NetworkDebugger;