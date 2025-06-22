import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, TREASURE_ADVENTURE_ABI, GOLD_TOKEN_ABI } from '../contracts';
import { useToast } from '../components/ToastManager';
import { useState, useEffect } from 'react';

export function useWeb3Game() {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  
  // 读取玩家数据
  const { 
    data: playerData, 
    refetch: refetchPlayer,
    isLoading: isLoadingPlayer,
    error: playerError 
  } = useReadContract({
    address: CONTRACT_ADDRESSES.TREASURE_ADVENTURE as `0x${string}`,
    abi: TREASURE_ADVENTURE_ABI,
    functionName: 'getPlayer',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && isConnected,
    },
  });

  // 调试日志
  useEffect(() => {
    if (address && isConnected) {
      console.log('=== Web3Game Hook Debug ===');
      console.log('Address:', address);
      console.log('Contract Address:', CONTRACT_ADDRESSES.TREASURE_ADVENTURE);
      console.log('Player Data:', playerData);
      console.log('Player Error:', playerError);
      console.log('Is Loading:', isLoadingPlayer);
      console.log('Is Registered (initialized):', playerData?.initialized);
      console.log('Player Data Structure:', playerData ? Object.keys(playerData) : 'No data');
    }
  }, [address, isConnected, playerData, playerError, isLoadingPlayer]);

  // 读取金币余额
  const { 
    data: goldBalance, 
    refetch: refetchGold 
  } = useReadContract({
    address: CONTRACT_ADDRESSES.GOLD_TOKEN as `0x${string}`,
    abi: GOLD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && isConnected,
    },
  });

  // 玩家注册
  const registerPlayer = async (name: string) => {
    if (!isConnected) {
      showToast('请先连接钱包', 'error');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.TREASURE_ADVENTURE as `0x${string}`,
        abi: TREASURE_ADVENTURE_ABI,
        functionName: 'registerPlayer',
        args: [name],
      });
    } catch (error) {
      console.error('Registration error:', error);
      showToast('注册失败', 'error');
    }
  };

  // 完成战斗
  const completeBattle = async (experienceGained: number, goldGained: number, staminaCost: number = 1) => {
    if (!isConnected) {
      showToast('请先连接钱包', 'error');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.TREASURE_ADVENTURE as `0x${string}`,
        abi: TREASURE_ADVENTURE_ABI,
        functionName: 'completeBattle',
        args: [experienceGained, BigInt(goldGained), staminaCost],
      });
    } catch (error) {
      console.error('Battle completion error:', error);
      showToast('战斗完成失败', 'error');
    }
  };

  // 更新体力
  const updateStamina = async () => {
    if (!isConnected) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.TREASURE_ADVENTURE as `0x${string}`,
        abi: TREASURE_ADVENTURE_ABI,
        functionName: 'updateStamina',
      });
    } catch (error) {
      console.error('Update stamina error:', error);
    }
  };

  // 领取宝箱
  const claimTreasureBoxes = async () => {
    if (!isConnected) {
      showToast('请先连接钱包', 'error');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.TREASURE_ADVENTURE as `0x${string}`,
        abi: TREASURE_ADVENTURE_ABI,
        functionName: 'claimTreasureBoxes',
      });
    } catch (error) {
      console.error('Claim treasure boxes error:', error);
      showToast('领取宝箱失败', 'error');
    }
  };

  // 监听交易确认
  useEffect(() => {
    if (isConfirmed) {
      showToast('交易确认成功！', 'success');
      // 刷新数据
      refetchPlayer();
      refetchGold();
    }
  }, [isConfirmed, refetchPlayer, refetchGold, showToast]);

  // 转换链上数据为前端格式
  const convertedPlayerData = playerData ? {
    id: 'web3-player',
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
    isPlayerRegistered: playerData?.initialized || false,
    
    // 状态
    isLoadingPlayer,
    isPending,
    isConfirming,
    isConfirmed,
    
    // 函数
    registerPlayer,
    completeBattle,
    updateStamina,
    claimTreasureBoxes,
    refetchPlayer,
    refetchGold,
  };
}