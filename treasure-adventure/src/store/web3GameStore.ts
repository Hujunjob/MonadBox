import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, GameState } from '../types/game';
import { useWeb3GameV2 } from '../hooks/useWeb3GameV2';

interface Web3GameState {
  // 模式配置
  isWeb3Mode: boolean;
  toggleWeb3Mode: () => void;
  
  // 本地游戏状态（作为备份和快速响应）
  localPlayer: Player | null;
  localGameState: Partial<GameState>;
  
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
  syncWithBlockchain: () => Promise<void>;
  updateLocalPlayer: (updates: Partial<Player>) => void;
}

export const useWeb3GameStore = create<Web3GameState>()(
  persist(
    (set, get) => ({
      isWeb3Mode: false,
      localPlayer: null,
      localGameState: {},
      lastSyncTime: 0,
      syncInProgress: false,
      pendingOperations: [],

      toggleWeb3Mode: () => {
        set((state) => ({ 
          isWeb3Mode: !state.isWeb3Mode 
        }));
      },

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

      updateLocalPlayer: (updates) => {
        set((state) => ({
          localPlayer: state.localPlayer ? {
            ...state.localPlayer,
            ...updates
          } : null
        }));
      },

      syncWithBlockchain: async () => {
        const { isWeb3Mode, pendingOperations } = get();
        if (!isWeb3Mode) return;

        set({ syncInProgress: true });

        try {
          // 这里应该使用 Web3 hooks 来同步数据
          // 由于hooks只能在组件中使用，我们需要在组件层面处理同步
          
          // 处理待同步的操作
          for (const operation of pendingOperations) {
            // 根据操作类型执行相应的链上操作
            console.log('Syncing operation:', operation);
          }

          set({
            lastSyncTime: Date.now(),
            syncInProgress: false,
            pendingOperations: []
          });
        } catch (error) {
          console.error('Sync error:', error);
          set({ syncInProgress: false });
        }
      },
    }),
    {
      name: 'web3-game-storage',
      partialize: (state) => ({
        isWeb3Mode: state.isWeb3Mode,
        localPlayer: state.localPlayer,
        localGameState: state.localGameState,
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
    if (web3Store.isWeb3Mode && web3Game.playerData) {
      return web3Game.playerData;
    }
    return web3Store.localPlayer;
  };

  // 混合模式下的战斗完成
  const completeBattle = async (experienceGained: number, goldGained: number) => {
    if (web3Store.isWeb3Mode && web3Game.isPlayerRegistered) {
      // Web3 模式：直接调用智能合约（新架构不产生金币）
      await web3Game.completeBattle(experienceGained);
    } else {
      // 本地模式或离线模式：添加到待处理队列
      web3Store.addPendingOperation({
        type: 'battle',
        data: { experienceGained, goldGained }
      });
      
      // 更新本地状态
      const currentPlayer = getPlayer();
      if (currentPlayer) {
        web3Store.updateLocalPlayer({
          experience: currentPlayer.experience + experienceGained,
          gold: currentPlayer.gold + goldGained,
          stamina: Math.max(0, currentPlayer.stamina - 1)
        });
      }
    }
  };

  // 混合模式下的宝箱领取
  const claimTreasureBoxes = async () => {
    if (web3Store.isWeb3Mode && web3Game.isPlayerRegistered) {
      await web3Game.claimTreasureBoxes();
    } else {
      web3Store.addPendingOperation({
        type: 'claimBox',
        data: {}
      });
    }
  };

  // 混合模式下的开启宝箱
  const openTreasureBox = async (boxIndex: number) => {
    if (web3Store.isWeb3Mode && web3Game.isPlayerRegistered) {
      await web3Game.openTreasureBox(boxIndex);
    } else {
      web3Store.addPendingOperation({
        type: 'openBox',
        data: { boxIndex }
      });
    }
  };

  return {
    // 状态
    isWeb3Mode: web3Store.isWeb3Mode,
    player: getPlayer(),
    isPlayerRegistered: web3Store.isWeb3Mode ? web3Game.isPlayerRegistered : !!web3Store.localPlayer,
    isPending: web3Game.isPending,
    isConfirming: web3Game.isConfirming,
    syncInProgress: web3Store.syncInProgress,
    pendingOperations: web3Store.pendingOperations,
    
    // 操作
    toggleWeb3Mode: web3Store.toggleWeb3Mode,
    registerPlayer: web3Game.registerPlayer,
    completeBattle,
    claimTreasureBoxes,
    openTreasureBox,
    updateStamina: () => {}, // 新架构中体力自动恢复
    syncWithBlockchain: web3Store.syncWithBlockchain,
    
    // 数据刷新
    refetchPlayer: web3Game.refetchPlayer,
    refetchGold: web3Game.refetchGold,
  };
}