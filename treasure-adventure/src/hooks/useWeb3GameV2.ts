import { useAccount, useReadContract } from 'wagmi';
import { useToast } from '../components/ToastManager';
import { useSafeContractCall } from './useSafeContractCall';
import { useState, useEffect } from 'react';
import { 
  useRegisterPlayerSimulation,
  useCompleteBattleSimulation,
  useClaimTreasureBoxesSimulation,
  useOpenTreasureBoxSimulation
} from './useContractSimulationV2';
import { 
  CONTRACT_ADDRESSES,
  PLAYER_NFT_ABI,
  BATTLE_SYSTEM_ABI,
  GOLD_TOKEN_ABI,
  TREASURE_BOX_SYSTEM_ABI
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

  // 获取宝箱数量
  const { data: treasureBoxCount, refetch: refetchTreasureBoxes } = useReadContract({
    address: CONTRACTS.TREASURE_BOX_SYSTEM,
    abi: TREASURE_BOX_SYSTEM_ABI,
    functionName: 'getPlayerTreasureBoxCount',
    args: [address as `0x${string}`],
    query: { enabled: !!address && isConnected },
  });

  // 状态管理为模拟调用参数
  const [simulationParams, setSimulationParams] = useState<{
    registerPlayer?: { name: string; enabled: boolean };
    completeBattle?: { playerId: number; experienceGained: number; staminaCost: number; victory: boolean; monsterLevel: number; enabled: boolean };
    claimTreasureBoxes?: { enabled: boolean };
    openTreasureBox?: { boxIndex: number; enabled: boolean };
  }>({});

  // 模拟调用hooks
  const registerPlayerSim = useRegisterPlayerSimulation(
    simulationParams.registerPlayer?.name || '',
    simulationParams.registerPlayer?.enabled || false
  );

  const completeBattleSim = useCompleteBattleSimulation(
    simulationParams.completeBattle?.playerId || 0,
    simulationParams.completeBattle?.experienceGained || 0,
    simulationParams.completeBattle?.staminaCost || 1,
    simulationParams.completeBattle?.victory || true,
    simulationParams.completeBattle?.monsterLevel || 1,
    simulationParams.completeBattle?.enabled || false
  );

  const claimTreasureBoxesSim = useClaimTreasureBoxesSimulation(
    simulationParams.claimTreasureBoxes?.enabled || false
  );

  const openTreasureBoxSim = useOpenTreasureBoxSimulation(
    simulationParams.openTreasureBox?.boxIndex || 0,
    simulationParams.openTreasureBox?.enabled || false
  );

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

    // ✅ 使用安全的 registerPlayer 函数，只能为自己注册
    
    // 启用模拟调用验证
    setSimulationParams(prev => ({
      ...prev,
      registerPlayer: { name, enabled: true }
    }));

    // 等待一个微任务让hook更新
    await new Promise(resolve => setTimeout(resolve, 0));
    console.log("registerPlayerSim");
    console.log(registerPlayerSim);
    
    
    await safeCall(
      {
        address: CONTRACTS.PLAYER_NFT,
        abi: PLAYER_NFT_ABI,
        functionName: 'registerPlayer',
        args: [name], // 只需要名称，合约会自动使用 msg.sender
      },
      registerPlayerSim,
      {
        loadingMessage: '🔍 正在注册玩家...',
        successMessage: '✅ 玩家注册成功！',
        errorMessage: '❌ 注册失败'
      }
    );

    // 重置模拟参数
    setSimulationParams(prev => ({
      ...prev,
      registerPlayer: { name: '', enabled: false }
    }));
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

    // 启用模拟调用验证
    setSimulationParams(prev => ({
      ...prev,
      completeBattle: { playerId: currentPlayerId, experienceGained, staminaCost, victory, monsterLevel, enabled: true }
    }));

    // 等待一个微任务让hook更新
    await new Promise(resolve => setTimeout(resolve, 0));

    await safeCall(
      {
        address: CONTRACTS.BATTLE_SYSTEM,
        abi: BATTLE_SYSTEM_ABI,
        functionName: 'completeBattle',
        args: [BigInt(currentPlayerId), experienceGained, staminaCost, victory, monsterLevel],
      },
      completeBattleSim,
      {
        loadingMessage: '⚔️ 正在处理战斗...',
        successMessage: '✅ 战斗结果已上链！',
        errorMessage: '❌ 战斗失败'
      }
    );

    // 重置模拟参数
    setSimulationParams(prev => ({
      ...prev,
      completeBattle: { playerId: 0, experienceGained: 0, staminaCost: 1, victory: true, monsterLevel: 1, enabled: false }
    }));
  };

  // 领取离线宝箱
  const claimTreasureBoxes = async () => {
    if (!isConnected || !address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    // 启用模拟调用验证
    setSimulationParams(prev => ({
      ...prev,
      claimTreasureBoxes: { enabled: true }
    }));

    // 等待一个微任务让hook更新
    await new Promise(resolve => setTimeout(resolve, 0));

    await safeCall(
      {
        address: CONTRACTS.TREASURE_BOX_SYSTEM,
        abi: TREASURE_BOX_SYSTEM_ABI,
        functionName: 'claimOfflineTreasureBoxes',
      },
      claimTreasureBoxesSim,
      {
        loadingMessage: '📦 正在领取宝箱...',
        successMessage: '✅ 宝箱领取成功！',
        errorMessage: '❌ 宝箱领取失败'
      }
    );

    // 重置模拟参数
    setSimulationParams(prev => ({
      ...prev,
      claimTreasureBoxes: { enabled: false }
    }));
  };

  // 开启宝箱
  const openTreasureBox = async (boxIndex: number) => {
    if (!isConnected || !address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    if (boxIndex < 0) {
      showToast('无效的宝箱索引', 'error');
      return;
    }

    // 启用模拟调用验证
    setSimulationParams(prev => ({
      ...prev,
      openTreasureBox: { boxIndex, enabled: true }
    }));

    // 等待一个微任务让hook更新
    await new Promise(resolve => setTimeout(resolve, 0));

    await safeCall(
      {
        address: CONTRACTS.TREASURE_BOX_SYSTEM,
        abi: TREASURE_BOX_SYSTEM_ABI,
        functionName: 'openTreasureBox',
        args: [BigInt(boxIndex)],
      },
      openTreasureBoxSim,
      {
        loadingMessage: '🎁 正在开启宝箱...',
        successMessage: '✅ 宝箱开启成功！',
        errorMessage: '❌ 开箱失败'
      }
    );

    // 重置模拟参数
    setSimulationParams(prev => ({
      ...prev,
      openTreasureBox: { boxIndex: 0, enabled: false }
    }));
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