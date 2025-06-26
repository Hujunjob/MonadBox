import { useWriteContract, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, RANK_ABI, PLAYER_NFT_ABI, FIGHT_SYSTEM_ABI } from '../contracts';
import { usePublicClient } from 'wagmi';
import { useSafeContractCall } from './useSafeContractCall';
import { decodeEventLog } from 'viem';

export function useRank() {
  const { writeContract, isPending: writePending } = useWriteContract();
  const publicClient = usePublicClient();
  const { safeCall, isPending, isConfirming, isConfirmed } = useSafeContractCall();

  // 解析battle信息（包括battleId和双方stats）
  const parseBattleInfo = (receipt: any): { battleId: string; fighter1Stats: any; fighter2Stats: any } | null => {
    try {
      if (!receipt?.logs) return null;
      
      for (const log of receipt.logs) {
        try {
          // 先尝试解析FightSystem的BattleStarted事件
          const decodedLog = decodeEventLog({
            abi: FIGHT_SYSTEM_ABI,
            data: log.data,
            topics: log.topics,
          });
          
          if (decodedLog.eventName === 'BattleStarted') {
            const args = decodedLog.args as any;
            return {
              battleId: args.battleId.toString(),
              fighter1Stats: {
                id: args.fighter1Id,
                type: args.fighter1Type,
                health: Number(args.fighter1Health),
                maxHealth: Number(args.fighter1MaxHealth),
                attack: Number(args.fighter1Attack),
                defense: Number(args.fighter1Defense),
                agility: Number(args.fighter1Agility),
                criticalRate: Number(args.fighter1CriticalRate),
                criticalDamage: Number(args.fighter1CriticalDamage)
              },
              fighter2Stats: {
                id: args.fighter2Id,
                type: args.fighter2Type,
                health: Number(args.fighter2Health),
                maxHealth: Number(args.fighter2MaxHealth),
                attack: Number(args.fighter2Attack),
                defense: Number(args.fighter2Defense),
                agility: Number(args.fighter2Agility),
                criticalRate: Number(args.fighter2CriticalRate),
                criticalDamage: Number(args.fighter2CriticalDamage)
              }
            };
          }
        } catch (error) {
          // 如果FightSystem解析失败，尝试用RANK_ABI解析
          try {
            const decodedLog = decodeEventLog({
              abi: RANK_ABI,
              data: log.data,
              topics: log.topics,
            });
            
            if (decodedLog.eventName === 'RankBattleStarted') {
              const { battleId } = decodedLog.args as any;
              return {
                battleId: battleId ? battleId.toString() : '',
                fighter1Stats: null,
                fighter2Stats: null
              };
            }
          } catch (error2) {
            // 忽略无法解析的日志
            continue;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('解析battle信息失败:', error);
      return null;
    }
  };

  // 挑战指定排名
  const fight = async (playerId: number, targetRankIndex: number): Promise<{ battleId: string; fighter1Stats: any; fighter2Stats: any } | null> => {
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
              // 解析战斗信息
              const battleInfo = parseBattleInfo(receipt);
              resolve(battleInfo);
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