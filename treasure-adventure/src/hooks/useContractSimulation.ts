import { useSimulateContract } from 'wagmi';
import { CONTRACT_ADDRESSES, TREASURE_ADVENTURE_ABI } from '../contracts';

/**
 * 合约调用模拟验证 Hook
 * 在实际调用合约之前先模拟执行，确保交易会成功
 */

export function useRegisterPlayerSimulation(name: string, enabled: boolean = false) {
  return useSimulateContract({
    address: CONTRACT_ADDRESSES.TREASURE_ADVENTURE as `0x${string}`,
    abi: TREASURE_ADVENTURE_ABI,
    functionName: 'registerPlayer',
    args: [name],
    query: { 
      enabled: enabled && !!name && name.length >= 2 && name.length <= 20 
    }
  });
}

export function useCompleteBattleSimulation(
  experienceGained: number,
  goldGained: number,
  staminaCost: number = 1,
  enabled: boolean = false
) {
  return useSimulateContract({
    address: CONTRACT_ADDRESSES.TREASURE_ADVENTURE as `0x${string}`,
    abi: TREASURE_ADVENTURE_ABI,
    functionName: 'completeBattle',
    args: [experienceGained, goldGained, staminaCost, true, 1], // victory=true, monsterLevel=1
    query: { 
      enabled: enabled && experienceGained > 0 && goldGained > 0 
    }
  });
}

export function useClaimTreasureBoxesSimulation(enabled: boolean = false) {
  return useSimulateContract({
    address: CONTRACT_ADDRESSES.TREASURE_ADVENTURE as `0x${string}`,
    abi: TREASURE_ADVENTURE_ABI,
    functionName: 'claimOfflineTreasureBoxes',
    query: { enabled }
  });
}

export function useOpenTreasureBoxSimulation(boxIndex: number, enabled: boolean = false) {
  return useSimulateContract({
    address: CONTRACT_ADDRESSES.TREASURE_ADVENTURE as `0x${string}`,
    abi: TREASURE_ADVENTURE_ABI,
    functionName: 'openTreasureBox',
    args: [boxIndex],
    query: { 
      enabled: enabled && boxIndex >= 0 
    }
  });
}