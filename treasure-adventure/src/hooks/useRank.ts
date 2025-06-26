import { useWriteContract, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, RANK_ABI, PLAYER_NFT_ABI } from '../contracts';
import { usePublicClient } from 'wagmi';
import { useSafeContractCall } from './useSafeContractCall';
import { decodeEventLog } from 'viem';

export function useRank() {
  const { writeContract, isPending: writePending } = useWriteContract();
  const publicClient = usePublicClient();
  const { safeCall, isPending, isConfirming, isConfirmed } = useSafeContractCall();

  // 解析battleId
  const parseBattleId = (receipt: any): string | null => {
    try {
      if (!receipt?.logs) return null;
      
      for (const log of receipt.logs) {
        try {
          const decodedLog = decodeEventLog({
            abi: RANK_ABI,
            data: log.data,
            topics: log.topics,
          });
          
          if (decodedLog.eventName === 'RankBattleStarted' || decodedLog.eventName === 'BattleStarted') {
            const { battleId } = decodedLog.args as any;
            return battleId ? battleId.toString() : null;
          }
        } catch (error) {
          // 忽略无法解析的日志
          continue;
        }
      }
      return null;
    } catch (error) {
      console.error('解析battleId失败:', error);
      return null;
    }
  };

  // 挑战指定排名
  const fight = async (playerId: number, targetRankIndex: number): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      try {
        safeCall(
          {
            address: CONTRACT_ADDRESSES.RANK,
            abi: RANK_ABI,
            functionName: 'fight',
            args: [BigInt(playerId), BigInt(targetRankIndex)],
            gas: BigInt(2500000),
          },
          undefined,
          {
            loadingMessage: '⚔️ 正在发起挑战...',
            successMessage: '✅ 挑战开始！',
            errorMessage: '❌ 挑战失败',
            onSuccess: (receipt: any) => {
              // 解析战斗ID
              const battleId = parseBattleId(receipt);
              if (battleId) {
                resolve(battleId);
              } else {
                resolve(null);
              }
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  };

  // 获取排名信息
  const getRankInfo = async (rankIndex: number) => {
    if (!publicClient) throw new Error('Public client not available');
    
    const data = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.RANK,
      abi: RANK_ABI,
      functionName: 'getRankInfo',
      args: [BigInt(rankIndex)]
    });
    return data as [bigint, string];
  };

  // 获取玩家排名
  const getPlayerRank = async (playerId: number) => {
    if (!publicClient) throw new Error('Public client not available');
    
    const data = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.RANK,
      abi: RANK_ABI,
      functionName: 'getPlayerRank',
      args: [BigInt(playerId)]
    });
    return data as bigint;
  };

  // 获取排行榜
  const getTopRanks = async (limit: number) => {
    if (!publicClient) throw new Error('Public client not available');
    
    const data = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.RANK,
      abi: RANK_ABI,
      functionName: 'getTopRanks',
      args: [BigInt(limit)]
    });
    return data as [bigint[], bigint[], string[]];
  };

  // 检查是否可以挑战（冷却已移除，始终返回true）
  const canChallenge = async (playerId: number) => {
    if (!publicClient) throw new Error('Public client not available');
    
    const data = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.RANK,
      abi: RANK_ABI,
      functionName: 'canChallenge',
      args: [BigInt(playerId)]
    });
    return data as boolean;
  };

  // 获取玩家详细信息
  const getPlayerData = async (playerId: number) => {
    if (!publicClient) throw new Error('Public client not available');
    
    const data = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.PLAYER_NFT,
      abi: PLAYER_NFT_ABI,
      functionName: 'getPlayer',
      args: [BigInt(playerId)]
    });
    return data as any;
  };

  return {
    fight,
    getRankInfo,
    getPlayerRank,
    getTopRanks,
    canChallenge,
    getPlayerData,
    isPending
  };
}