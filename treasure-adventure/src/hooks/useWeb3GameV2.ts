import { useAccount, useReadContract } from 'wagmi';
import { useToast } from '../components/ToastManager';
import { useSafeContractCall } from './useSafeContractCall';
import { useState, useEffect } from 'react';
import { 
  CONTRACT_ADDRESSES,
  PLAYER_NFT_ABI,
  BATTLE_SYSTEM_ABI,
  GOLD_TOKEN_ABI,
  TREASURE_BOX_SYSTEM_ABI,
  EQUIPMENT_NFT_ABI
} from '../contracts';

// 使用统一的合约地址配置
const CONTRACTS = {
  PLAYER_NFT: CONTRACT_ADDRESSES.PLAYER_NFT,
  EQUIPMENT_NFT: CONTRACT_ADDRESSES.EQUIPMENT_NFT,
  GOLD_TOKEN: CONTRACT_ADDRESSES.GOLD_TOKEN,
  TREASURE_BOX_SYSTEM: CONTRACT_ADDRESSES.TREASURE_BOX_SYSTEM,
  BATTLE_SYSTEM: CONTRACT_ADDRESSES.BATTLE_SYSTEM,
  EQUIPMENT_SYSTEM: CONTRACT_ADDRESSES.EQUIPMENT_SYSTEM,
} as const;

export function useWeb3GameV2() {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const { safeCall, isPending, isConfirming, isConfirmed } = useSafeContractCall();
  
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

  // 获取总宝箱数量
  const { data: treasureBoxCount, refetch: refetchTreasureBoxes } = useReadContract({
    address: CONTRACTS.TREASURE_BOX_SYSTEM,
    abi: TREASURE_BOX_SYSTEM_ABI,
    functionName: 'getPlayerTreasureBoxCount',
    args: [address as `0x${string}`],
    query: { enabled: !!address && isConnected },
  });

  // 获取未开启的宝箱数量
  const { data: unopenedBoxCount, refetch: refetchUnopenedBoxes } = useReadContract({
    address: CONTRACTS.TREASURE_BOX_SYSTEM,
    abi: TREASURE_BOX_SYSTEM_ABI,
    functionName: 'getUnopenedBoxCount',
    args: [address as `0x${string}`],
    query: { enabled: !!address && isConnected },
  });

  // 获取可领取的离线宝箱数量
  const { data: claimableBoxes, refetch: refetchClaimableBoxes } = useReadContract({
    address: CONTRACTS.TREASURE_BOX_SYSTEM,
    abi: TREASURE_BOX_SYSTEM_ABI,
    functionName: 'getClaimableOfflineBoxes',
    args: [address as `0x${string}`],
    query: { enabled: !!address && isConnected },
  });

  // 调试：监听claimableBoxes的变化
  useEffect(() => {
    if (claimableBoxes !== undefined) {
      console.log('待领取宝箱数量:', Number(claimableBoxes));
    }
  }, [claimableBoxes]);

  // 获取玩家拥有的装备NFT数量
  const { data: equipmentBalance, refetch: refetchEquipmentBalance } = useReadContract({
    address: CONTRACTS.EQUIPMENT_NFT,
    abi: EQUIPMENT_NFT_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address && isConnected },
  });

  // 获取玩家已装备的装备
  const { data: equippedItems, refetch: refetchEquippedItems } = useReadContract({
    address: CONTRACTS.PLAYER_NFT,
    abi: PLAYER_NFT_ABI,
    functionName: 'getEquippedItems',
    args: [firstPlayerTokenId || 1n],
    query: { enabled: !!firstPlayerTokenId },
  });

  // 获取玩家宝箱列表
  const { data: playerTreasureBoxes, refetch: refetchPlayerTreasureBoxes } = useReadContract({
    address: CONTRACTS.TREASURE_BOX_SYSTEM,
    abi: TREASURE_BOX_SYSTEM_ABI,
    functionName: 'getPlayerTreasureBoxes',
    args: [address as `0x${string}`],
    query: { enabled: !!address && isConnected },
  });


  // 获取玩家背包装备数据
  const [playerEquipments, setPlayerEquipments] = useState<any[]>([]);
  
  // 当装备数量变化时，获取所有装备数据
  useEffect(() => {
    const fetchEquipments = async () => {
      if (!address || !equipmentBalance || Number(equipmentBalance) === 0) {
        setPlayerEquipments([]);
        return;
      }

      try {
        const equipments: any[] = [];
        
        // 暂时先显示一个简化的装备列表
        // TODO: 需要使用 multicall 或者 React Query 来批量获取装备数据
        console.log(`玩家拥有 ${Number(equipmentBalance)} 个装备NFT`);
        
        setPlayerEquipments(equipments);
      } catch (error) {
        console.error('获取装备数据失败:', error);
        setPlayerEquipments([]);
      }
    };

    fetchEquipments();
  }, [address, equipmentBalance]);

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

    // 直接调用，让 safeCall 处理模拟
    await safeCall(
      {
        address: CONTRACTS.PLAYER_NFT,
        abi: PLAYER_NFT_ABI,
        functionName: 'registerPlayer',
        args: [name],
      },
      undefined, // 暂时跳过模拟调用
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
      undefined,
      {
        loadingMessage: '⚔️ 正在处理战斗...',
        successMessage: '✅ 战斗结果已上链！',
        errorMessage: '❌ 战斗失败'
      }
    );
  };

  // 领取离线宝箱
  const claimTreasureBoxes = async () => {
    if (!isConnected || !address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    await safeCall(
      {
        address: CONTRACTS.TREASURE_BOX_SYSTEM,
        abi: TREASURE_BOX_SYSTEM_ABI,
        functionName: 'claimOfflineTreasureBoxes',
      },
      undefined,
      {
        loadingMessage: '📦 正在领取宝箱...',
        successMessage: '✅ 宝箱领取成功！',
        errorMessage: '❌ 宝箱领取失败'
      }
    );
  };

  // 获取第一个未开启的宝箱索引
  const getFirstUnopenedBoxIndex = (): number => {
    if (!playerTreasureBoxes || !Array.isArray(playerTreasureBoxes)) {
      return 0;
    }
    
    for (let i = 0; i < playerTreasureBoxes.length; i++) {
      const box = playerTreasureBoxes[i];
      if (!box.opened) {
        return i;
      }
    }
    
    return 0; // 如果没有找到未开启的宝箱，返回0
  };

  // 开启宝箱
  const openTreasureBox = async (boxIndex?: number, onReward?: (reward: any) => void) => {
    if (!isConnected || !address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    // 如果没有提供 boxIndex，自动找到第一个未开启的宝箱
    const targetBoxIndex = boxIndex !== undefined ? boxIndex : getFirstUnopenedBoxIndex();

    if (targetBoxIndex < 0) {
      showToast('无效的宝箱索引', 'error');
      return;
    }

    console.log(`正在开启宝箱索引: ${targetBoxIndex}`);

    await safeCall(
      {
        address: CONTRACTS.TREASURE_BOX_SYSTEM,
        abi: TREASURE_BOX_SYSTEM_ABI,
        functionName: 'openTreasureBox',
        args: [BigInt(targetBoxIndex)],
      },
      undefined,
      {
        loadingMessage: '🎁 正在开启宝箱...',
        successMessage: '✅ 宝箱开启成功！获得了奖励！',
        errorMessage: '❌ 开箱失败',
        onSuccess: () => {
          // 这里应该从交易事件中解析奖励，但为了简化，我们先显示一个通用消息
          if (onReward) {
            onReward({
              type: 'success',
              message: '恭喜获得奖励！请查看你的金币和装备余额。'
            });
          }
        }
      }
    );
  };

  // 装备道具
  const equipItem = async (equipmentId: number) => {
    if (!isConnected || !currentPlayerId) {
      showToast('请先连接钱包并注册玩家', 'error');
      return;
    }

    await safeCall(
      {
        address: CONTRACTS.PLAYER_NFT,
        abi: PLAYER_NFT_ABI,
        functionName: 'equipItem',
        args: [BigInt(currentPlayerId), BigInt(equipmentId)],
      },
      undefined,
      {
        loadingMessage: '🛡️ 正在装备道具...',
        successMessage: '✅ 装备成功！',
        errorMessage: '❌ 装备失败'
      }
    );
  };

  // 卸下装备
  const unequipItem = async (slot: number) => {
    if (!isConnected || !currentPlayerId) {
      showToast('请先连接钱包并注册玩家', 'error');
      return;
    }

    await safeCall(
      {
        address: CONTRACTS.PLAYER_NFT,
        abi: PLAYER_NFT_ABI,
        functionName: 'unequipItem',
        args: [BigInt(currentPlayerId), slot],
      },
      undefined,
      {
        loadingMessage: '🔄 正在卸下装备...',
        successMessage: '✅ 卸下成功！',
        errorMessage: '❌ 卸下失败'
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
      refetchUnopenedBoxes();
      refetchClaimableBoxes();
      refetchPlayerBalance();
      refetchPlayerTokenId();
      refetchEquipmentBalance();
      refetchEquippedItems();
      refetchPlayerTreasureBoxes();
    }
  }, [isConfirmed, refetchPlayer, refetchGold, refetchTreasureBoxes, refetchUnopenedBoxes, refetchClaimableBoxes, refetchPlayerBalance, refetchPlayerTokenId, refetchEquipmentBalance, refetchEquippedItems, refetchPlayerTreasureBoxes, showToast]);

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
    inventory: playerEquipments, // 使用链上装备数据
    treasureBoxes: [], // Web3模式下宝箱数据由单独的状态管理
    // 链上数据统计
    equipmentBalance: equipmentBalance ? Number(equipmentBalance) : 0,
    equippedItemIds: equippedItems || [],
  } : null;

  return {
    // 数据
    playerData: convertedPlayerData,
    goldBalance: goldBalance ? Number(goldBalance) / 10**18 : 0,
    treasureBoxCount: treasureBoxCount ? Number(treasureBoxCount) : 0,
    unopenedBoxCount: unopenedBoxCount ? Number(unopenedBoxCount) : 0,
    claimableBoxes: claimableBoxes ? Number(claimableBoxes) : 0,
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
    equipItem,
    unequipItem,
    
    // 数据刷新
    refetchPlayer,
    refetchGold,
    refetchTreasureBoxes,
    refetchUnopenedBoxes,
    refetchClaimableBoxes,
    refetchEquipmentBalance,
    refetchEquippedItems,
  };
}