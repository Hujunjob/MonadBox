import { useSimulateContract } from 'wagmi';
import { 
  CONTRACT_ADDRESSES,
  PLAYER_NFT_ABI,
  BATTLE_SYSTEM_ABI,
  TREASURE_BOX_SYSTEM_ABI,
  EQUIPMENT_SYSTEM_ABI
} from '../contracts';

/**
 * 新架构合约调用模拟验证 Hook
 * 在实际调用合约之前先模拟执行，确保交易会成功
 */

// 使用统一的合约地址配置
const CONTRACTS = {
  PLAYER_NFT: CONTRACT_ADDRESSES.PLAYER_NFT,
  EQUIPMENT_NFT: CONTRACT_ADDRESSES.EQUIPMENT_NFT,
  GOLD_TOKEN: CONTRACT_ADDRESSES.GOLD_TOKEN,
  TREASURE_BOX_SYSTEM: CONTRACT_ADDRESSES.TREASURE_BOX_SYSTEM,
  BATTLE_SYSTEM: CONTRACT_ADDRESSES.BATTLE_SYSTEM,
  EQUIPMENT_SYSTEM: CONTRACT_ADDRESSES.EQUIPMENT_SYSTEM,
} as const;

/**
 * 模拟注册玩家（使用安全的 registerPlayer 函数）
 */
export function useRegisterPlayerSimulation(
  name: string,
  enabled: boolean = false
) {
  return useSimulateContract({
    address: CONTRACTS.PLAYER_NFT,
    abi: PLAYER_NFT_ABI,
    functionName: 'registerPlayer',
    args: [name],
    query: { 
      enabled: enabled && !!name && name.length >= 2 && name.length <= 20,
      retry: false, // 禁用重试
      refetchOnWindowFocus: false, // 禁用窗口聚焦时重新获取
    }
  });
}

/**
 * 模拟完成战斗
 */
export function useCompleteBattleSimulation(
  playerId: number,
  experienceGained: number,
  staminaCost: number = 1,
  victory: boolean = true,
  monsterLevel: number = 1,
  enabled: boolean = false
) {
  return useSimulateContract({
    address: CONTRACTS.BATTLE_SYSTEM,
    abi: BATTLE_SYSTEM_ABI,
    functionName: 'completeBattle',
    args: [BigInt(playerId), experienceGained, staminaCost, victory, monsterLevel],
    query: { 
      enabled: enabled && playerId > 0 && experienceGained > 0 
    }
  });
}

/**
 * 模拟领取离线宝箱
 */
export function useClaimTreasureBoxesSimulation(enabled: boolean = false) {
  return useSimulateContract({
    address: CONTRACTS.TREASURE_BOX_SYSTEM,
    abi: TREASURE_BOX_SYSTEM_ABI,
    functionName: 'claimOfflineTreasureBoxes',
    query: { enabled }
  });
}

/**
 * 模拟开启宝箱
 */
export function useOpenTreasureBoxSimulation(boxIndex: number, enabled: boolean = false) {
  return useSimulateContract({
    address: CONTRACTS.TREASURE_BOX_SYSTEM,
    abi: TREASURE_BOX_SYSTEM_ABI,
    functionName: 'openTreasureBox',
    args: [BigInt(boxIndex)],
    query: { 
      enabled: enabled && boxIndex >= 0 
    }
  });
}

/**
 * 模拟装备道具
 */
export function useEquipItemSimulation(
  playerId: number,
  equipmentId: number,
  enabled: boolean = false
) {
  return useSimulateContract({
    address: CONTRACTS.PLAYER_NFT,
    abi: PLAYER_NFT_ABI,
    functionName: 'equipItem',
    args: [BigInt(playerId), BigInt(equipmentId)],
    query: { 
      enabled: enabled && playerId > 0 && equipmentId > 0 
    }
  });
}

/**
 * 模拟卸下装备
 */
export function useUnequipItemSimulation(
  playerId: number,
  slot: number,
  enabled: boolean = false
) {
  return useSimulateContract({
    address: CONTRACTS.PLAYER_NFT,
    abi: PLAYER_NFT_ABI,
    functionName: 'unequipItem',
    args: [BigInt(playerId), slot],
    query: { 
      enabled: enabled && playerId > 0 && slot >= 0 && slot < 8 
    }
  });
}

/**
 * 模拟装备升星
 */
export function useUpgradeStarsSimulation(equipmentId: number, enabled: boolean = false) {
  return useSimulateContract({
    address: CONTRACTS.EQUIPMENT_SYSTEM,
    abi: EQUIPMENT_SYSTEM_ABI,
    functionName: 'upgradeStars',
    args: [BigInt(equipmentId)],
    query: { 
      enabled: enabled && equipmentId > 0 
    }
  });
}

/**
 * 模拟装备强化
 */
export function useEnhanceEquipmentSimulation(equipmentId: number, enabled: boolean = false) {
  return useSimulateContract({
    address: CONTRACTS.EQUIPMENT_SYSTEM,
    abi: EQUIPMENT_SYSTEM_ABI,
    functionName: 'enhanceEquipment',
    args: [BigInt(equipmentId)],
    query: { 
      enabled: enabled && equipmentId > 0 
    }
  });
}