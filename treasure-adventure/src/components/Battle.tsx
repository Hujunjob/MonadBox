import React from 'react';
import { useHybridGameStore } from '../store/web3GameStore';

const Battle: React.FC = () => {
  const hybridStore = useHybridGameStore();
  const player = hybridStore.player;

  // 在区块链模式下，战斗通过 MonsterForest 组件直接调用智能合约
  // 这个组件不再需要本地战斗逻辑
  
  return (
    <div className="battle-panel">
      <div className="battle-status">
        <p>当前模式：区块链战斗</p>
        <p>请在怪物森林页面进行战斗</p>
        <p>玩家血量: {player.health}/{player.maxHealth}</p>
        <p>玩家体力: {player.stamina}/{player.maxStamina}</p>
      </div>
    </div>
  );
};

export default Battle;