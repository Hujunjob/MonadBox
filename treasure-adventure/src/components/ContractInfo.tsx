import React from 'react';
import { CONTRACT_ADDRESSES } from '../contracts';
import { useToast } from './ToastManager';

const ContractInfo: React.FC = () => {
  const { showToast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('地址已复制！', 'success');
  };

  return (
    <div className="contract-info">
      <div className="contract-header">
        <h4>📋 合约信息</h4>
      </div>

      <div className="contract-addresses">
        <div className="address-item">
          <span>主合约:</span>
          <code onClick={() => copyToClipboard(CONTRACT_ADDRESSES.TREASURE_ADVENTURE)}>
            {CONTRACT_ADDRESSES.TREASURE_ADVENTURE.slice(0, 10)}...
            {CONTRACT_ADDRESSES.TREASURE_ADVENTURE.slice(-8)} 📋
          </code>
        </div>

        <div className="address-item">
          <span>金币代币:</span>
          <code onClick={() => copyToClipboard(CONTRACT_ADDRESSES.GOLD_TOKEN)}>
            {CONTRACT_ADDRESSES.GOLD_TOKEN.slice(0, 10)}...
            {CONTRACT_ADDRESSES.GOLD_TOKEN.slice(-8)} 📋
          </code>
        </div>

        <div className="address-item">
          <span>装备 NFT:</span>
          <code onClick={() => copyToClipboard(CONTRACT_ADDRESSES.EQUIPMENT_NFT)}>
            {CONTRACT_ADDRESSES.EQUIPMENT_NFT.slice(0, 10)}...
            {CONTRACT_ADDRESSES.EQUIPMENT_NFT.slice(-8)} 📋
          </code>
        </div>
      </div>

      <div className="contract-note">
        <p>💡 <strong>重要提醒</strong>: 合约重新部署后，之前的注册数据会丢失，需要重新注册。</p>
        <p>🔄 如果注册状态显示错误，请尝试刷新数据或重新注册。</p>
      </div>
    </div>
  );
};

export default ContractInfo;