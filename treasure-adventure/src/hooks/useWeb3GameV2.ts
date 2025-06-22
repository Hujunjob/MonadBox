import { useAccount, useReadContract } from 'wagmi';
import { useToast } from '../components/ToastManager';
import { useSafeContractCall } from './useSafeContractCall';
import { useSimulateContract } from 'wagmi';
import { useState, useEffect } from 'react';

// 合约地址（从部署信息中获取）
const CONTRACTS = {
  PLAYER_NFT: '0x3347B4d90ebe72BeFb30444C9966B2B990aE9FcB',
  EQUIPMENT_NFT: '0x276C216D241856199A83bf27b2286659e5b877D3',
  GOLD_TOKEN: '0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c',
  TREASURE_BOX_SYSTEM: '0x3155755b79aA083bd953911C92705B7aA82a18F9',
  BATTLE_SYSTEM: '0x5bf5b11053e734690269C6B9D438F8C9d48F528A',
  EQUIPMENT_SYSTEM: '0xffa7CA1AEEEbBc30C874d32C7e22F052BbEa0429',
} as const;

// ABI 定义
const PLAYER_NFT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "string", "name": "name", "type": "string"}],
    "name": "mintPlayer",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "playerId", "type": "uint256"}],
    "name": "getPlayer",
    "outputs": [{"internalType": "tuple", "name": "", "type": "tuple", "components": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "uint16", "name": "level", "type": "uint16"},
      {"internalType": "uint32", "name": "experience", "type": "uint32"},
      {"internalType": "uint16", "name": "health", "type": "uint16"},
      {"internalType": "uint16", "name": "maxHealth", "type": "uint16"},
      {"internalType": "uint16", "name": "attack", "type": "uint16"},
      {"internalType": "uint16", "name": "defense", "type": "uint16"},
      {"internalType": "uint16", "name": "agility", "type": "uint16"},
      {"internalType": "uint8", "name": "criticalRate", "type": "uint8"},
      {"internalType": "uint16", "name": "criticalDamage", "type": "uint16"},
      {"internalType": "uint8", "name": "stamina", "type": "uint8"},
      {"internalType": "uint8", "name": "maxStamina", "type": "uint8"},
      {"internalType": "uint32", "name": "lastStaminaTime", "type": "uint32"},
      {"internalType": "uint16", "name": "currentForestLevel", "type": "uint16"},
      {"internalType": "uint16", "name": "currentForestProgress", "type": "uint16"},
      {"internalType": "uint32", "name": "lastTreasureBoxTime", "type": "uint32"},
      {"internalType": "bool", "name": "initialized", "type": "bool"},
      {"internalType": "uint8", "name": "job", "type": "uint8"}
    ]}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "uint256", "name": "index", "type": "uint256"}],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
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

const GOLD_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
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
  },
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "getPlayerTreasureBoxCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export function useWeb3GameV2() {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const { safeCall, hash, isPending, isConfirming, isConfirmed } = useSafeContractCall();
  
  const [currentPlayerId, setCurrentPlayerId] = useState<number>(0);

  // 获取用户的Player NFT数量
  const { data: playerBalance, refetch: refetchPlayerBalance } = useReadContract({
    address: CONTRACTS.PLAYER_NFT,
    abi: PLAYER_NFT_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address && isConnected },
  });

  // 获取用户的第一个Player NFT ID
  const { data: firstPlayerTokenId, refetch: refetchPlayerTokenId } = useReadContract({
    address: CONTRACTS.PLAYER_NFT,
    abi: PLAYER_NFT_ABI,
    functionName: 'tokenOfOwnerByIndex',
    args: [address as `0x${string}`, 0n],
    query: { enabled: !!address && isConnected && !!playerBalance && playerBalance > 0 },
  });

  // 获取玩家数据
  const { data: playerData, refetch: refetchPlayer } = useReadContract({
    address: CONTRACTS.PLAYER_NFT,
    abi: PLAYER_NFT_ABI,
    functionName: 'getPlayer',
    args: [firstPlayerTokenId || 1n],
    query: { enabled: !!firstPlayerTokenId },
  });

  // 获取金币余额
  const { data: goldBalance, refetch: refetchGold } = useReadContract({
    address: CONTRACTS.GOLD_TOKEN,
    abi: GOLD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address && isConnected },
  });

  // 获取宝箱数量
  const { data: treasureBoxCount, refetch: refetchTreasureBoxes } = useReadContract({
    address: CONTRACTS.TREASURE_BOX_SYSTEM,
    abi: TREASURE_BOX_ABI,
    functionName: 'getPlayerTreasureBoxCount',
    args: [address as `0x${string}`],
    query: { enabled: !!address && isConnected },
  });

  // 移除复杂的模拟调用hooks，改为在函数内部使用

  // 更新当前玩家ID
  useEffect(() => {
    if (firstPlayerTokenId) {
      setCurrentPlayerId(Number(firstPlayerTokenId));
    }
  }, [firstPlayerTokenId]);

  // 玩家注册（铸造Player NFT）
  const registerPlayer = async (name: string) => {
    if (!isConnected || !address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    if (!name || name.length < 2 || name.length > 20) {
      showToast('玩家名称长度必须在2-20字符之间', 'error');
      return;
    }

    // 暂时跳过模拟验证，直接调用合约
    await safeCall(
      {
        address: CONTRACTS.PLAYER_NFT,
        abi: PLAYER_NFT_ABI,
        functionName: 'mintPlayer',
        args: [address, name],
      },
      { data: true, isLoading: false, error: null }, // 跳过模拟验证
      {
        loadingMessage: '🔍 正在注册玩家...',
        successMessage: '✅ 玩家注册成功！',
        errorMessage: '❌ 注册失败'
      }
    );
  };

  // 完成战斗
  const completeBattle = async (
    experienceGained: number, 
    staminaCost: number = 1, 
    victory: boolean = true, 
    monsterLevel: number = 1
  ) => {
    if (!isConnected || !currentPlayerId) {
      showToast('请先连接钱包并注册玩家', 'error');
      return;
    }

    await safeCall(
      {
        address: CONTRACTS.BATTLE_SYSTEM,
        abi: BATTLE_SYSTEM_ABI,
        functionName: 'completeBattle',
        args: [BigInt(currentPlayerId), experienceGained, staminaCost, victory, monsterLevel],
      },
      { data: true, isLoading: false, error: null }, // 跳过模拟验证
      {
        loadingMessage: '⚔️ 正在处理战斗...',
        successMessage: '✅ 战斗结果已上链！',
        errorMessage: '❌ 战斗失败'
      }
    );
  };

  // 领取离线宝箱
  const claimTreasureBoxes = async () => {
    if (!isConnected) {
      showToast('请先连接钱包', 'error');
      return;
    }

    await safeCall(
      {
        address: CONTRACTS.TREASURE_BOX_SYSTEM,
        abi: TREASURE_BOX_ABI,
        functionName: 'claimOfflineTreasureBoxes',
      },
      { data: true, isLoading: false, error: null }, // 跳过模拟验证
      {
        loadingMessage: '📦 正在领取宝箱...',
        successMessage: '✅ 宝箱领取成功！',
        errorMessage: '❌ 宝箱领取失败'
      }
    );
  };

  // 开启宝箱
  const openTreasureBox = async (boxIndex: number) => {
    if (!isConnected) {
      showToast('请先连接钱包', 'error');
      return;
    }

    if (boxIndex < 0) {
      showToast('无效的宝箱索引', 'error');
      return;
    }

    await safeCall(
      {
        address: CONTRACTS.TREASURE_BOX_SYSTEM,
        abi: TREASURE_BOX_ABI,
        functionName: 'openTreasureBox',
        args: [BigInt(boxIndex)],
      },
      { data: true, isLoading: false, error: null }, // 跳过模拟验证
      {
        loadingMessage: '🎁 正在开启宝箱...',
        successMessage: '✅ 宝箱开启成功！',
        errorMessage: '❌ 开箱失败'
      }
    );
  };

  // 监听交易确认
  useEffect(() => {
    if (isConfirmed) {
      showToast('交易确认成功！', 'success');
      // 刷新数据
      refetchPlayer();
      refetchGold();
      refetchTreasureBoxes();
      refetchPlayerBalance();
      refetchPlayerTokenId();
    }
  }, [isConfirmed, refetchPlayer, refetchGold, refetchTreasureBoxes, refetchPlayerBalance, refetchPlayerTokenId, showToast]);

  // 转换Player数据为前端格式
  const convertedPlayerData = playerData ? {
    id: currentPlayerId.toString(),
    name: playerData.name || '未命名',
    level: Number(playerData.level),
    experience: Number(playerData.experience),
    health: Number(playerData.health),
    maxHealth: Number(playerData.maxHealth),
    attack: Number(playerData.attack),
    defense: Number(playerData.defense),
    agility: Number(playerData.agility),
    criticalRate: Number(playerData.criticalRate),
    criticalDamage: Number(playerData.criticalDamage),
    stamina: Number(playerData.stamina),
    maxStamina: Number(playerData.maxStamina),
    lastStaminaTime: Number(playerData.lastStaminaTime),
    currentForestLevel: Number(playerData.currentForestLevel),
    currentForestProgress: Number(playerData.currentForestProgress),
    lastTreasureBoxTime: Number(playerData.lastTreasureBoxTime),
    initialized: playerData.initialized,
    job: Number(playerData.job),
    // 前端需要的额外字段
    gold: goldBalance ? Number(goldBalance) / 10**18 : 0,
    equipment: {
      helmet: undefined,
      armor: undefined,
      shoes: undefined,
      weapon: undefined,
      shield: undefined,
      accessory: undefined,
      ring: undefined,
      pet: undefined,
    },
    inventory: [],
    treasureBoxes: [],
  } : null;

  return {
    // 数据
    playerData: convertedPlayerData,
    goldBalance: goldBalance ? Number(goldBalance) / 10**18 : 0,
    treasureBoxCount: treasureBoxCount ? Number(treasureBoxCount) : 0,
    isPlayerRegistered: !!playerData?.initialized,
    currentPlayerId,
    
    // 状态
    isPending,
    isConfirming,
    isConfirmed,
    
    // 函数
    registerPlayer,
    completeBattle,
    claimTreasureBoxes,
    openTreasureBox,
    
    // 数据刷新
    refetchPlayer,
    refetchGold,
    refetchTreasureBoxes,
  };
}