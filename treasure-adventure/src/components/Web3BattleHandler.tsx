import React, { useEffect } from 'react';
import { useHybridGameStore } from '../store/web3GameStore';
import { useWeb3GameV2 } from '../hooks/useWeb3GameV2';
import { useToast } from './ToastManager';

const Web3BattleHandler: React.FC = () => {
  const { isWeb3Mode, isPlayerRegistered } = useHybridGameStore();
  const { completeBattle } = useWeb3GameV2();
  const { showToast } = useToast();

  useEffect(() => {
    const handleBattleVictory = async (event: any) => {
      const { experienceGained, goldGained, monster } = event.detail;
      
      if (isWeb3Mode && isPlayerRegistered) {
        try {
          console.log('🔗 Web3 模式: 将战斗结果上链...');
          console.log(`怪物: ${monster.name}, 经验: ${experienceGained}, 金币: ${goldGained}`);
          
          // 调用智能合约记录战斗结果（新架构不产生金币）
          await completeBattle(experienceGained, 1, true, monster.level || 1);
          
          showToast('🎉 战斗结果已上链！经验和金币已到账', 'success');
        } catch (error) {
          console.error('Web3 战斗处理失败:', error);
          showToast('⚠️ 链上战斗处理失败，但本地已记录', 'error');
        }
      } else if (isWeb3Mode && !isPlayerRegistered) {
        showToast('⚠️ 请先注册玩家才能使用 Web3 模式', 'info');
      }
    };

    // 监听战斗胜利事件
    window.addEventListener('battleVictory', handleBattleVictory);

    return () => {
      window.removeEventListener('battleVictory', handleBattleVictory);
    };
  }, [isWeb3Mode, isPlayerRegistered, completeBattle, showToast]);

  // 这个组件不渲染任何内容，只处理事件
  return null;
};

export default Web3BattleHandler;