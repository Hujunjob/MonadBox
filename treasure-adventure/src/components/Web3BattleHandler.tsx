import React, { useEffect } from 'react';
import { useHybridGameStore } from '../store/web3GameStore';
import { useWeb3Game } from '../hooks/useWeb3Game';
import { useToast } from './ToastManager';

const Web3BattleHandler: React.FC = () => {
  const { isWeb3Mode, isPlayerRegistered } = useHybridGameStore();
  const { completeBattle, updateStamina } = useWeb3Game();
  const { showToast } = useToast();

  useEffect(() => {
    const handleBattleVictory = async (event: any) => {
      const { experienceGained, goldGained, monster } = event.detail;
      
      if (isWeb3Mode && isPlayerRegistered) {
        try {
          console.log('🔗 Web3 模式: 将战斗结果上链...');
          console.log(`怪物: ${monster.name}, 经验: ${experienceGained}, 金币: ${goldGained}`);
          
          // 调用智能合约记录战斗结果（包含体力消耗）
          await completeBattle(experienceGained, goldGained, 1);
          
          showToast('🎉 战斗结果已上链！经验和金币已到账', 'success');
        } catch (error) {
          console.error('Web3 战斗处理失败:', error);
          showToast('⚠️ 链上战斗处理失败，但本地已记录', 'warning');
        }
      } else if (isWeb3Mode && !isPlayerRegistered) {
        showToast('⚠️ 请先注册玩家才能使用 Web3 模式', 'warning');
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