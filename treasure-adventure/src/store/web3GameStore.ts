import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useWeb3GameV2 } from '../hooks/useWeb3GameV2';

interface Web3GameState {    
  // Web3 同步状态
  lastSyncTime: number;
  syncInProgress: boolean;
  
  // 操作队列（用于离线时缓存操作）
  pendingOperations: Array<{
    id: string;
    type: 'battle' | 'claimBox' | 'openBox' | 'equipItem';
    data: any;
    timestamp: number;
  }>;
  
  // 功能函数
  addPendingOperation: (operation: any) => void;
  clearPendingOperations: () => void;
}

export const useWeb3GameStore = create<Web3GameState>()(
  persist(
    (set) => ({
      isWeb3Mode: false,
      localPlayer: null,
      localGameState: {},
      lastSyncTime: 0,
      syncInProgress: false,
      pendingOperations: [],

      addPendingOperation: (operation) => {
        set((state) => ({
          pendingOperations: [
            ...state.pendingOperations,
            {
              ...operation,
              id: Date.now().toString(),
              timestamp: Date.now(),
            }
          ]
        }));
      },

      clearPendingOperations: () => {
        set({ pendingOperations: [] });
      },
    }),
    {
      name: 'web3-game-storage',
      partialize: (state) => ({
        lastSyncTime: state.lastSyncTime,
        pendingOperations: state.pendingOperations,
      }),
    }
  )
);

// 创建一个高阶组件来处理 Web3 同步
export function useHybridGameStore() {
  const web3Store = useWeb3GameStore();
  const web3Game = useWeb3GameV2();

  // 混合模式下的玩家数据
  const getPlayer = () => {
    return web3Game.playerData;
  };

  // 混合模式下的战斗完成
  const completeBattle = async (experienceGained: number) => {
     // Web3 模式：直接调用智能合约（新架构不产生金币）
    await web3Game.completeBattle(experienceGained);
  };

  // 混合模式下的宝箱领取
  const claimTreasureBoxes = async () => {
    await web3Game.claimTreasureBoxes();
  };

  // 混合模式下的开启宝箱
  const openTreasureBox = async (boxIndex?: number, onReward?: (reward: any) => void) => {
     await web3Game.openTreasureBox(boxIndex, onReward);
  };

  return {
    // 状态
    player: getPlayer(),
    isPlayerRegistered: web3Game.isPlayerRegistered,
    isPending: web3Game.isPending,
    isConfirming: web3Game.isConfirming,
    syncInProgress: web3Store.syncInProgress,
    pendingOperations: web3Store.pendingOperations,
    
    // Web3 宝箱数据
    treasureBoxCount: web3Game.treasureBoxCount,
    unopenedBoxCount:  web3Game.unopenedBoxCount ,
    claimableBoxes:  web3Game.claimableBoxes ,
    
    registerPlayer: web3Game.registerPlayer,
    completeBattle,
    claimTreasureBoxes,
    openTreasureBox,
    equipItem: web3Game.equipItem,
    unequipItem: web3Game.unequipItem,
    upgradeEquipmentStars: web3Game.upgradeEquipmentStars,
    enhanceEquipment: web3Game.enhanceEquipment,
    updateStamina: () => {}, // 新架构中体力自动恢复
    
    // 数据刷新
    refetchPlayer: web3Game.refetchPlayer,
    refetchTreasureBoxes: web3Game.refetchTreasureBoxes,
    refetchUnopenedBoxes: web3Game.refetchUnopenedBoxes,
    refetchClaimableBoxes: web3Game.refetchClaimableBoxes,
  };
}