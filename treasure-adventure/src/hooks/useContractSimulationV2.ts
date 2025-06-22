import { useSimulateContract } from 'wagmi';

/**
 * 新架构合约调用模拟验证 Hook
 * 在实际调用合约之前先模拟执行，确保交易会成功
 */

// 从部署信息中读取合约地址
const CONTRACTS = {
  PLAYER_NFT: '0x3347B4d90ebe72BeFb30444C9966B2B990aE9FcB',
  EQUIPMENT_NFT: '0x276C216D241856199A83bf27b2286659e5b877D3',
  GOLD_TOKEN: '0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c',
  TREASURE_BOX_SYSTEM: '0x3155755b79aA083bd953911C92705B7aA82a18F9',
  BATTLE_SYSTEM: '0x5bf5b11053e734690269C6B9D438F8C9d48F528A',
  EQUIPMENT_SYSTEM: '0xffa7CA1AEEEbBc30C874d32C7e22F052BbEa0429',
} as const;

// 简化的 ABI 定义（只包含需要模拟的函数）
const PLAYER_NFT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "string", "name": "name", "type": "string"}],
    "name": "mintPlayer",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "playerId", "type": "uint256"}, {"internalType": "uint256", "name": "equipmentId", "type": "uint256"}],
    "name": "equipItem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "playerId", "type": "uint256"}, {"internalType": "uint8", "name": "slot", "type": "uint8"}],
    "name": "unequipItem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const BATTLE_SYSTEM_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "playerId", "type": "uint256"},
      {"internalType": "uint16", "name": "experienceGained", "type": "uint16"},
      {"internalType": "uint8", "name": "staminaCost", "type": "uint8"},
      {"internalType": "bool", "name": "victory", "type": "bool"},
      {"internalType": "uint8", "name": "monsterLevel", "type": "uint8"}
    ],
    "name": "completeBattle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const TREASURE_BOX_ABI = [
  {
    "inputs": [],
    "name": "claimOfflineTreasureBoxes",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "boxIndex", "type": "uint256"}],
    "name": "openTreasureBox",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const EQUIPMENT_SYSTEM_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "upgradeStars",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "enhanceEquipment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

/**
 * 模拟注册玩家（铸造Player NFT）
 */
export function useRegisterPlayerSimulation(
  playerAddress: string,
  name: string,
  enabled: boolean = false
) {
  return useSimulateContract({
    address: CONTRACTS.PLAYER_NFT,
    abi: PLAYER_NFT_ABI,
    functionName: 'mintPlayer',
    args: [playerAddress as `0x${string}`, name],
    query: { 
      enabled: enabled && !!playerAddress && !!name && name.length >= 2 && name.length <= 20 
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
    abi: TREASURE_BOX_ABI,
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
    abi: TREASURE_BOX_ABI,
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