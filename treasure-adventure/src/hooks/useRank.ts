import { useWriteContract, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, RANK_ABI } from '../contracts';
import { usePublicClient } from 'wagmi';

export function useRank() {
  const { writeContract, isPending } = useWriteContract();
  const publicClient = usePublicClient();

  // 挑战指定排名
  const fight = async (playerId: number, targetRankIndex: number) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.RANK,
      abi: RANK_ABI,
      functionName: 'fight',
      args: [BigInt(playerId), BigInt(targetRankIndex)]
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

  // 获取下次挑战时间
  const getNextChallengeTime = async (playerId: number) => {
    if (!publicClient) throw new Error('Public client not available');
    
    const data = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.RANK,
      abi: RANK_ABI,
      functionName: 'getNextChallengeTime',
      args: [BigInt(playerId)]
    });
    return data as bigint;
  };

  // 检查是否可以挑战
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

  return {
    fight,
    getRankInfo,
    getPlayerRank,
    getTopRanks,
    getNextChallengeTime,
    canChallenge,
    isPending
  };
}