import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { useToast } from '../components/ToastManager';
import { useSafeContractCall } from './useSafeContractCall';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { decodeEventLog } from 'viem';
import { 
  CONTRACT_ADDRESSES,
  PLAYER_NFT_ABI,
  BATTLE_SYSTEM_ABI,
  TREASURE_BOX_SYSTEM_ABI,
  EQUIPMENT_SYSTEM_ABI,
  EQUIPMENT_NFT_ABI
} from '../contracts';

// 使用统一的合约地址配置
const CONTRACTS = {
  PLAYER_NFT: CONTRACT_ADDRESSES.PLAYER_NFT,
  EQUIPMENT_NFT: CONTRACT_ADDRESSES.EQUIPMENT_NFT,
  ITEM_NFT: CONTRACT_ADDRESSES.ITEM_NFT,
  GOLD_TOKEN: CONTRACT_ADDRESSES.GOLD_TOKEN,
  TREASURE_BOX_SYSTEM: CONTRACT_ADDRESSES.TREASURE_BOX_SYSTEM,
  BATTLE_SYSTEM: CONTRACT_ADDRESSES.BATTLE_SYSTEM,
  EQUIPMENT_SYSTEM: CONTRACT_ADDRESSES.EQUIPMENT_SYSTEM,
} as const;

export function useWeb3GameV2() {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const { safeCall, isPending, isConfirming, isConfirmed } = useSafeContractCall();
  const publicClient = usePublicClient();
  
  const [currentPlayerId, setCurrentPlayerId] = useState<number>(0);
  const [inventoryEquipments, setInventoryEquipments] = useState<any[]>([]);
  const [playerItems, setPlayerItems] = useState<any[]>([]);

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

  // 获取总宝箱数量
  const { data: treasureBoxCount, refetch: refetchTreasureBoxes } = useReadContract({
    address: CONTRACTS.TREASURE_BOX_SYSTEM,
    abi: TREASURE_BOX_SYSTEM_ABI,
    functionName: 'getPlayerTreasureBoxCount',
    args: [BigInt(currentPlayerId)],
    query: { enabled: !!currentPlayerId && currentPlayerId > 0 },
  });

  // 获取可领取的离线宝箱数量
  const { data: claimableBoxes, refetch: refetchClaimableBoxes } = useReadContract({
    address: CONTRACTS.TREASURE_BOX_SYSTEM,
    abi: TREASURE_BOX_SYSTEM_ABI,
    functionName: 'getClaimableOfflineBoxes',
    args: [BigInt(currentPlayerId)],
    query: { enabled: !!currentPlayerId && currentPlayerId > 0 },
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
    args: [BigInt(currentPlayerId)],
    query: { enabled: !!currentPlayerId && currentPlayerId > 0 },
  });

  // 获取玩家背包装备列表
  const { data: playerInventory, refetch: refetchPlayerInventory } = useReadContract({
    address: CONTRACTS.PLAYER_NFT,
    abi: PLAYER_NFT_ABI,
    functionName: 'getPlayerInventory',
    args: [firstPlayerTokenId || 1n],
    query: { enabled: !!firstPlayerTokenId },
  });

  // 获取玩家items列表
  const { data: playerItemsData, refetch: refetchPlayerItems } = useReadContract({
    address: CONTRACTS.PLAYER_NFT,
    abi: PLAYER_NFT_ABI,
    functionName: 'getPlayerItems',
    args: [firstPlayerTokenId || 1n],
    query: { enabled: !!firstPlayerTokenId },
  });
  

  // 更新当前玩家ID
  useEffect(() => {
    if (firstPlayerTokenId) {
      setCurrentPlayerId(Number(firstPlayerTokenId));
    }
  }, [firstPlayerTokenId]);

  // 获取装备详细信息的辅助函数
  const fetchEquipmentDetails = useCallback(async (equipmentIds: readonly bigint[]) => {
    if (!equipmentIds || equipmentIds.length === 0) {
      setInventoryEquipments([]);
      return;
    }
    console.log("fetchEquipmentDetails - optimized");
    

    if (!publicClient) {
      console.warn('Public client not available, using fallback data');
      setInventoryEquipments([]);
      return;
    }

    try {
      // 使用publicClient并行获取所有装备数据
      const equipmentDataPromises = equipmentIds.map(async (equipmentId) => {
        try {
          const data = await publicClient.readContract({
            address: CONTRACTS.EQUIPMENT_NFT,
            abi: EQUIPMENT_NFT_ABI,
            functionName: 'getEquipment',
            args: [equipmentId]
          });
          console.log("equipmentId",equipmentId,data);
          
          return {
            id: Number(equipmentId),
            data
          };
        } catch (error) {
          console.error(`Error reading equipment ${equipmentId}:`, error);
          // 如果读取失败，返回基础模拟数据
          return {
            id: Number(equipmentId),
            data: {
              equipmentType: 3, // 默认武器
              level: 1,
              stars: 0,
              rarity: 0,
              attack: 10,
              defense: 5,
              agility: 8,
              criticalRate: 5,
              criticalDamage: 150,
              name: `装备${equipmentId}`
            }
          };
        }
      });

      const equipmentResults = await Promise.all(equipmentDataPromises);

      // 转换为前端格式
      const equipments = equipmentResults.map(({ id, data }) => {
        console.log("equipments type",data.equipmentType);
        
        return {
          id,
          name: data.name || `装备${id}`,
          equipmentType: Number(data.equipmentType),
          level: Number(data.level || 1),
          stars: Number(data.stars || 0),
          rarity: Number(data.rarity || 0),
          attack: Number(data.attack || 0),
          defense: Number(data.defense || 0),
          agility: Number(data.agility || 0),
          criticalRate: Number(data.criticalRate || 0),
          criticalDamage: Number(data.criticalDamage || 0),
        };
      });
      
      setInventoryEquipments(equipments);
    } catch (error) {
      console.error('Failed to fetch equipment details:', error);
      setInventoryEquipments([]);
    }
  }, [publicClient]);

  // 处理玩家物品数据
  const processPlayerItemsData = () => {
    if (!playerItemsData || !Array.isArray(playerItemsData) || playerItemsData.length !== 2) {
      setPlayerItems([]);
      return;
    }

    try {
      const [itemIds, quantities] = playerItemsData;
      
      if (!itemIds || !quantities || itemIds.length !== quantities.length) {
        setPlayerItems([]);
        return;
      }
      
      // 转换为前端格式
      const items = itemIds.map((id: bigint, index: number) => {
        const itemId = Number(id);
        const quantity = Number(quantities[index]);
        const type = getItemType(itemId);
        
        return {
          id: itemId,
          type,
          quantity,
        };
      });
      
      setPlayerItems(items);
    } catch (error) {
      console.error('Failed to process player items data:', error);
      setPlayerItems([]);
    }
  };

  // 判断物品类型的辅助函数
  const getItemType = (itemId: number) => {
    if (itemId >= 1000 && itemId < 2000) return 'health_potion';
    if (itemId >= 2000 && itemId < 3000) return 'job_advancement_book';
    if (itemId >= 3000 && itemId < 4000) return 'pet_egg';
    return 'unknown';
  };

  // 监听装备数据变化
  useEffect(() => {
    if (playerInventory && Array.isArray(playerInventory) && playerInventory.length > 0) {
      fetchEquipmentDetails(playerInventory);
    } else {
      // 如果没有装备，清空装备列表
      setInventoryEquipments([]);
    }
  }, [playerInventory, fetchEquipmentDetails]);

  // 监听玩家items数据变化
  useEffect(() => {
    processPlayerItemsData();
  }, [playerItemsData]);


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
        errorMessage: '❌ 注册失败',
        onSuccess: () => {
          setTimeout(() => {
            refreshAllData();
          }, 500);
        }
      }
    );
  };

  // 获取玩家最大冒险层数
  const { data: maxAdventureLevel, refetch: refetchMaxAdventureLevel } = useReadContract({
    address: CONTRACTS.BATTLE_SYSTEM,
    abi: BATTLE_SYSTEM_ABI,
    functionName: 'getMaxAdventureLevel',
    args: [BigInt(currentPlayerId)],
    query: { enabled: !!currentPlayerId && currentPlayerId > 0 },
  });

  // 获取玩家战斗统计
  const { data: battleStats, refetch: refetchBattleStats } = useReadContract({
    address: CONTRACTS.BATTLE_SYSTEM,
    abi: BATTLE_SYSTEM_ABI,
    functionName: 'getBattleStats',
    args: [BigInt(currentPlayerId)],
    query: { enabled: !!currentPlayerId && currentPlayerId > 0 },
  });

  // 开始冒险 - 新的战斗系统
  const startAdventure = async (adventureLevel: number, monsterLevel?: number) => {
    if (!isConnected || !currentPlayerId) {
      showToast('请先连接钱包并注册玩家', 'error');
      return;
    }

    if (adventureLevel < 1 || adventureLevel > 10) {
      showToast('冒险层数必须在1-10之间', 'error');
      return;
    }

    // 检查用户是否已通关该层级
    const currentMaxLevel = maxAdventureLevel || 1;
    if (adventureLevel > currentMaxLevel) {
      showToast(`第${adventureLevel}层尚未解锁！请先通关第${currentMaxLevel}层`, 'error');
      return;
    }

    // 默认怪物等级等于冒险层级
    const finalMonsterLevel = monsterLevel || adventureLevel;

    await safeCall(
      {
        address: CONTRACTS.BATTLE_SYSTEM,
        abi: BATTLE_SYSTEM_ABI,
        functionName: 'startAdventure',
        args: [BigInt(currentPlayerId), adventureLevel, finalMonsterLevel],
      },
      undefined,
      {
        loadingMessage: `⚔️ 正在挑战第${adventureLevel}层...`,
        successMessage: '✅ 冒险结果已上链！',
        errorMessage: '❌ 冒险失败',
        onSuccess: (receipt: any) => {
          // 解析战斗结果事件
          const battleResult = parseBattleResult(receipt);
          if (battleResult && typeof window !== 'undefined') {
            // 触发自定义事件来显示战斗结果
            window.dispatchEvent(new CustomEvent('battleResult', { 
              detail: battleResult 
            }));
          }
          setTimeout(() => {
            refreshAllData();
          }, 500);
        }
      }
    );
  };

  // 解析战斗结果事件
  const parseBattleResult = (receipt: any) => {
    try {
      if (!receipt?.logs) return null;
      
      for (const log of receipt.logs) {
        try {
          const decodedLog = decodeEventLog({
            abi: BATTLE_SYSTEM_ABI,
            data: log.data,
            topics: log.topics,
          });
          
          if (decodedLog.eventName === 'BattleCompleted') {
            const { playerId, experienceGained, victory, adventureLevel, monsterLevel } = decodedLog.args as any;
            return {
              isVictory: victory,
              experienceGained: Number(experienceGained),
              adventureLevel: Number(adventureLevel),
              monsterLevel: Number(monsterLevel),
              monsterName: `第${adventureLevel}层怪物 (等级${monsterLevel})`
            };
          }
        } catch (error) {
          // 忽略无法解析的日志
          continue;
        }
      }
      return null;
    } catch (error) {
      console.error('解析战斗结果失败:', error);
      return null;
    }
  };

  // 获取怪物属性
  const getMonsterStats = async (monsterLevel: number) => {
    if (!publicClient) return null;
    
    try {
      const stats = await publicClient.readContract({
        address: CONTRACTS.BATTLE_SYSTEM,
        abi: BATTLE_SYSTEM_ABI,
        functionName: 'getMonsterStats',
        args: [monsterLevel]
      });
      return stats;
    } catch (error) {
      console.error('Failed to get monster stats:', error);
      return null;
    }
  };

  // 估算胜率
  const estimateWinRate = async (monsterLevel: number) => {
    if (!publicClient || !currentPlayerId) return 0;
    
    try {
      const winRate = await publicClient.readContract({
        address: CONTRACTS.BATTLE_SYSTEM,
        abi: BATTLE_SYSTEM_ABI,
        functionName: 'estimateWinRate',
        args: [BigInt(currentPlayerId), monsterLevel]
      });
      return Number(winRate);
    } catch (error) {
      console.error('Failed to estimate win rate:', error);
      return 0;
    }
  };

  // 完成战斗 - 保留旧版本兼容性
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
        errorMessage: '❌ 战斗失败',
        onSuccess: () => {
          setTimeout(() => {
            refreshAllData();
          }, 500);
        }
      }
    );
  };

  // 领取离线宝箱
  const claimTreasureBoxes = async () => {
    if (!isConnected || !currentPlayerId) {
      showToast('请先连接钱包并注册玩家', 'error');
      return;
    }

    await safeCall(
      {
        address: CONTRACTS.TREASURE_BOX_SYSTEM,
        abi: TREASURE_BOX_SYSTEM_ABI,
        functionName: 'claimOfflineTreasureBoxes',
        args: [BigInt(currentPlayerId)],
      },
      undefined,
      {
        loadingMessage: '📦 正在领取宝箱...',
        successMessage: '✅ 宝箱领取成功！',
        errorMessage: '❌ 宝箱领取失败',
        onSuccess: () => {
          setTimeout(() => {
            refreshAllData();
          }, 500);
        }
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

  // 解析宝箱开启事件
  const parseTreasureBoxEvent = (receipt: any) => {
    if (!receipt || !receipt.logs) {
      console.error('收据为空或没有日志:', receipt);
      return null;
    }
    
    try {
      for (const log of receipt.logs) {
        try {
          const decodedLog = decodeEventLog({
            abi: TREASURE_BOX_SYSTEM_ABI,
            data: log.data,
            topics: log.topics,
          });
          
          if (decodedLog.eventName === 'TreasureBoxOpened') {
            const {
              playerId,
              boxIndex,
              rewardType,
              goldAmount,
              equipmentIds,
              itemId,
              itemName,
              itemLevel,
              healAmount
            } = decodedLog.args as any;
            
            console.log('解析到宝箱开启事件:', {
              playerId: playerId.toString(),
              boxIndex: boxIndex.toString(),
              rewardType: rewardType.toString(),
              goldAmount: goldAmount.toString(),
              equipmentIds: equipmentIds.map((id: any) => id.toString()),
              itemId: itemId.toString(),
              itemName,
              itemLevel: itemLevel.toString(),
              healAmount: healAmount.toString()
            });
            
            return {
              rewardType: Number(rewardType),
              goldAmount: goldAmount.toString(),
              equipmentIds: equipmentIds.map((id: any) => id.toString()),
              itemId: itemId.toString(),
              itemName: itemName,
              itemLevel: Number(itemLevel),
              healAmount: healAmount.toString(),
              // 如果是装备奖励，添加equipmentType (稍后会从合约中获取)
              equipmentType: Number(rewardType) === 1 && equipmentIds.length > 0 ? null : undefined
            };
          }
        } catch (parseError) {
          // 忽略无法解析的日志
          continue;
        }
      }
    } catch (error) {
      console.error('解析事件失败:', error);
    }
    return null;
  };

  // 开启宝箱
  const openTreasureBox = async (boxIndex?: number, onReward?: (reward: any) => void) => {
    if (!isConnected || !currentPlayerId) {
      showToast('请先连接钱包并注册玩家', 'error');
      return;
    }

    // 如果没有提供 boxIndex，自动找到第一个未开启的宝箱
    const targetBoxIndex = boxIndex !== undefined ? boxIndex : getFirstUnopenedBoxIndex();

    if (targetBoxIndex < 0) {
      showToast('无效的宝箱索引', 'error');
      return;
    }

    console.log(`正在开启宝箱索引: ${targetBoxIndex}，玩家ID: ${currentPlayerId}`);

    await safeCall(
      {
        gas: BigInt(10000000), // 手动设置 gasLimit 为 300,000
        gasPrice: BigInt(10000000),
        address: CONTRACTS.TREASURE_BOX_SYSTEM,
        abi: TREASURE_BOX_SYSTEM_ABI,
        functionName: 'openTreasureBox',
        args: [BigInt(currentPlayerId), BigInt(targetBoxIndex)],
      },
      undefined,
      {
        loadingMessage: '🎁 正在开启宝箱...',
        successMessage: '✅ 宝箱开启成功！',
        errorMessage: '❌ 开箱失败',
        onSuccess: (receipt: any) => {
          console.log('开箱onSuccess被调用，receipt:', receipt);
          
          // 刷新数据
          setTimeout(() => {
            refreshAllData();
          }, 500);
          
          // 确保收据存在且有效
          if (!receipt) {
            console.error('收据为空，无法解析奖励');
            if (onReward) {
              onReward({
                type: 'Web3',
                description: '宝箱开启成功！请查看你的金币和装备余额。'
              });
            }
            return;
          }
          
          // 解析交易事件获取实际奖励
          const rewardData = parseTreasureBoxEvent(receipt);
          
          if (onReward && rewardData) {
            // 根据奖励类型构造详细的奖励信息
            let rewardDescription = '';
            let rewardType = 'Web3';
            
            switch (rewardData.rewardType) {
              case 0: // 金币
                rewardDescription = `获得 ${Number(rewardData.goldAmount) / 1e18} 金币！`;
                break;
              case 1: // 装备
                rewardDescription = `获得 Lv.${rewardData.itemLevel} 装备！`;
                // 如果是装备奖励且有装备ID，尝试获取装备详细信息
                if (rewardData.equipmentIds && rewardData.equipmentIds.length > 0 && publicClient) {
                  const equipmentId = BigInt(rewardData.equipmentIds[0]);
                  publicClient.readContract({
                    address: CONTRACTS.EQUIPMENT_NFT,
                    abi: EQUIPMENT_NFT_ABI,
                    functionName: 'getEquipment',
                    args: [equipmentId]
                  }).then((equipmentData: any) => {
                    console.log('获取到装备详细信息:', equipmentData);
                    // 更新奖励数据包含装备详细信息和equipmentType
                    const enhancedRewardData = {
                      ...rewardData,
                      equipmentType: Number(equipmentData.equipmentType || 3),
                      equipmentDetails: {
                        equipmentType: Number(equipmentData.equipmentType || 3),
                        rarity: Number(equipmentData.rarity || 0),
                        attack: Number(equipmentData.attack || 0),
                        defense: Number(equipmentData.defense || 0),
                        health: Number(equipmentData.health || 0),
                        agility: Number(equipmentData.agility || 0),
                        criticalRate: Number(equipmentData.criticalRate || 0),
                        criticalDamage: Number(equipmentData.criticalDamage || 0),
                        stars: Number(equipmentData.stars || 0)
                      }
                    };
                    
                    // 重新调用回调函数更新UI
                    onReward({
                      type: rewardType,
                      description: rewardDescription,
                      rewardData: enhancedRewardData
                    });
                  }).catch(error => {
                    console.error('获取装备详细信息失败:', error);
                  });
                }
                break;
              case 2: // 血瓶
                rewardDescription = `获得 ${rewardData.itemName}！`;
                break;
              case 3: // 宠物蛋
                rewardDescription = `获得 ${rewardData.itemName}！`;
                break;
              case 4: // 转职书
                rewardDescription = `获得 ${rewardData.itemName}！`;
                break;
              default:
                rewardDescription = '获得神秘奖励！';
            }
            
            onReward({
              type: rewardType,
              description: rewardDescription,
              rewardData: rewardData
            });
          } else if (onReward) {
            // 如果无法解析事件，显示通用消息
            onReward({
              type: 'Web3',
              description: '恭喜获得奖励！请查看你的金币和装备余额。'
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
        errorMessage: '❌ 装备失败',
        onSuccess: () => {
          setTimeout(() => {
            refreshAllData();
          }, 500);
        }
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
        errorMessage: '❌ 卸下失败',
        onSuccess: () => {
          setTimeout(() => {
            refreshAllData();
          }, 500);
        }
      }
    );
  };

  // 装备升星 - 更新为使用playerId
  const upgradeEquipmentStars = async (equipmentId: number) => {
    if (!isConnected || !currentPlayerId) {
      showToast('请先连接钱包并注册玩家', 'error');
      return;
    }

    await safeCall(
      {
        address: CONTRACTS.EQUIPMENT_SYSTEM,
        abi: EQUIPMENT_SYSTEM_ABI,
        functionName: 'upgradeStars',
        args: [BigInt(currentPlayerId), BigInt(equipmentId)],
      },
      undefined,
      {
        loadingMessage: '⭐ 正在升星...',
        successMessage: '✅ 升星成功！',
        errorMessage: '❌ 升星失败',
        onSuccess: () => {
          setTimeout(() => {
            refreshAllData();
          }, 500);
        }
      }
    );
  };

  // 装备强化
  const enhanceEquipment = async (equipmentId: number) => {
    if (!isConnected || !address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    await safeCall(
      {
        address: CONTRACTS.EQUIPMENT_SYSTEM,
        abi: EQUIPMENT_SYSTEM_ABI,
        functionName: 'enhanceEquipment',
        args: [BigInt(equipmentId)],
      },
      undefined,
      {
        loadingMessage: '🔨 正在强化装备...',
        successMessage: '✅ 强化成功！',
        errorMessage: '❌ 强化失败',
        onSuccess: () => {
          setTimeout(() => {
            refreshAllData();
          }, 500);
        }
      }
    );
  };

  // 数据刷新辅助函数
  const refreshAllData = () => {
    console.log('刷新所有数据...');
    refetchPlayer();
    refetchTreasureBoxes();
    refetchClaimableBoxes();
    refetchPlayerBalance();
    refetchPlayerTokenId();
    refetchEquippedItems();
    refetchPlayerTreasureBoxes();
    refetchPlayerInventory();
    refetchPlayerItems();
    refetchMaxAdventureLevel();
    refetchBattleStats();
  };

  // 监听交易确认并自动刷新数据
  useEffect(() => {
    console.log('useWeb3GameV2 - 交易状态变化:', { isConfirmed, isConfirming, isPending });
    if (isConfirmed) {
      console.log('useWeb3GameV2 - 交易确认成功，开始刷新数据');
      // 延迟刷新，确保区块链状态已更新
      setTimeout(() => {
        refreshAllData();
      }, 1000);
    }
  }, [isConfirmed]);

  // 将装备类型数字转换为名称
  const getEquipmentTypeName = (type: number) => {
    const typeNames = ['helmet', 'armor', 'shoes', 'weapon', 'shield', 'accessory', 'ring', 'pet'];
    return typeNames[type] || 'weapon';
  };

  // 处理装备槽位映射
  const getEquippedItemsMap = useMemo(() => {
    const equippedMap: any = {
      helmet: undefined,
      armor: undefined,
      shoes: undefined,
      weapon: undefined,
      shield: undefined,
      accessory: undefined,
      ring: undefined,
      pet: undefined,
    };

    if (equippedItems && Array.isArray(equippedItems)) {
      const slotNames = ['helmet', 'armor', 'shoes', 'weapon', 'shield', 'accessory', 'ring', 'pet'];
      equippedItems.forEach((equipmentId, index) => {
        if (equipmentId && Number(equipmentId) > 0 && index < slotNames.length) {
          // 从inventoryEquipments中找到对应的装备详细信息
          const equipment = inventoryEquipments.find(eq => eq.id === Number(equipmentId));
          if (equipment) {
            equippedMap[slotNames[index]] = {
              id: equipment.id.toString(),
              name: equipment.name || `装备${equipment.id}`,
              type: getEquipmentTypeName(equipment.equipmentType || 0),
              equipmentType: equipment.equipmentType || 0,
              level: equipment.level || 1,
              stars: equipment.stars || 0,
              rarity: equipment.rarity || 0,
              stats: {
                attack: equipment.attack || 0,
                defense: equipment.defense || 0,
                agility: equipment.agility || 0,
                criticalRate: equipment.criticalRate || 0,
                criticalDamage: equipment.criticalDamage || 0,
              }
            };
          }
        }
      });
    }

    return equippedMap;
  }, [equippedItems, inventoryEquipments]);

  // 获取物品名称
  const getItemName = (itemId: number, type: string) => {
    if (type === 'health_potion') {
      const level = itemId - 1000 + 1;
      return `Lv${level} Health Potion`;
    }
    if (type === 'job_advancement_book') {
      const jobNames = ['', 'Great Swordsman', 'Temple Knight', 'Dragon Knight', 'Sword Master', 'Sword God', 'Plane Lord'];
      const jobType = itemId - 2000;
      return `${jobNames[jobType] || 'Unknown'} Job Book`;
    }
    if (type === 'pet_egg') {
      const level = itemId - 3000 + 1;
      return `Lv${level} Pet Egg`;
    }
    return `Item ${itemId}`;
  };

  // 获取物品等级
  const getItemLevel = (itemId: number) => {
    if (itemId >= 1000 && itemId < 2000) return itemId - 1000 + 1; // 血瓶
    if (itemId >= 3000 && itemId < 4000) return itemId - 3000 + 1; // 宠物蛋
    return 1;
  };

  // 获取转职书目标职业
  const getJobTarget = (itemId: number) => {
    if (itemId >= 2000 && itemId < 3000) return itemId - 2000;
    return 0;
  };

  // 处理背包物品数据
  const getInventoryItems = useMemo(() => {
    console.log("getInventoryItems - memoized");
    
    const items: any[] = [];
    
    // 添加装备
    inventoryEquipments.forEach(equipment => {
      // 如果装备没有被装备，就加入背包
      const isEquipped = equippedItems && equippedItems.some(id => Number(id) === equipment.id);
      // console.log("getInventoryItems",equipment);
      
      if (!isEquipped) {
        items.push({
          id: equipment.id.toString(),
          name: equipment.name || `装备${equipment.id}`,
          type: 'equipment',
          equipmentType: equipment.equipmentType || 0,
          level: equipment.level || 1,
          stars: equipment.stars || 0,
          rarity: equipment.rarity || 0,
          quantity: 1,
          stats: {
            attack: equipment.attack || 0,
            defense: equipment.defense || 0,
            agility: equipment.agility || 0,
            criticalRate: equipment.criticalRate || 0,
            criticalDamage: equipment.criticalDamage || 0,
          }
        });
      }
    });

    // 添加物品（血瓶、转职书、宠物蛋）
    playerItems.forEach(item => {
      if (item.quantity > 0) {
        items.push({
          id: item.id.toString(),
          name: getItemName(item.id, item.type),
          type: item.type,
          level: getItemLevel(item.id),
          quantity: item.quantity,
          targetJob: item.type === 'job_advancement_book' ? getJobTarget(item.id) : undefined,
        });
      }
    });

    return items;
  }, [inventoryEquipments, equippedItems, playerItems]);

  // 转换Player数据为前端格式，确保所有字段都有默认值
  const convertedPlayerData = useMemo(() => ({
    id: currentPlayerId,
    name: playerData?.name || '未命名',
    level: playerData ? Number(playerData.level) : 1,
    experience: playerData ? Number(playerData.experience) : 0,
    health: playerData ? Number(playerData.health) : 100,
    maxHealth: playerData ? Number(playerData.maxHealth) : 100,
    attack: playerData ? Number(playerData.attack) : 10,
    defense: playerData ? Number(playerData.defense) : 5,
    agility: playerData ? Number(playerData.agility) : 8,
    criticalRate: playerData ? Number(playerData.criticalRate) : 5,
    criticalDamage: playerData ? Number(playerData.criticalDamage) : 150,
    stamina: playerData ? Number(playerData.stamina) : 10,
    maxStamina: playerData ? Number(playerData.maxStamina) : 10,
    lastStaminaTime: playerData ? Number(playerData.lastStaminaTime) : 0,
    currentForestLevel: playerData ? Number(playerData.currentForestLevel) : 1,
    currentForestProgress: playerData ? Number(playerData.currentForestProgress) : 0,
    lastTreasureBoxTime: playerData ? Number(playerData.lastTreasureBoxTime) : 0,
    initialized: playerData?.initialized || false,
    job: playerData ? Number(playerData.job) : 0,
    // 前端需要的额外字段
    gold: playerData ? Number(playerData.goldBalance)/10**18 : 0,
    equipment: getEquippedItemsMap,
    inventory: getInventoryItems, // 使用处理后的装备和物品数据
    treasureBoxes: [], // Web3模式下宝箱数据由单独的状态管理
    equippedItemIds: equippedItems || [],
  }), [currentPlayerId, playerData, getInventoryItems, getEquippedItemsMap, equippedItems]);

  return {
    // 数据
    playerData: convertedPlayerData,
    treasureBoxCount: treasureBoxCount ? Number(treasureBoxCount) : 0,
    claimableBoxes: claimableBoxes ? Number(claimableBoxes) : 0,
    isPlayerRegistered: !!playerData?.initialized,
    currentPlayerId,
    
    // 新战斗系统数据
    maxAdventureLevel: maxAdventureLevel ? Number(maxAdventureLevel) : 1,
    battleStats: battleStats ? {
      totalBattles: Number(battleStats[0]),
      totalVictories: Number(battleStats[1]),
      winRate: Number(battleStats[2]),
      lastBattle: Number(battleStats[3])
    } : { totalBattles: 0, totalVictories: 0, winRate: 0, lastBattle: 0 },
    
    // 状态
    isPending,
    isConfirming,
    isConfirmed,
    
    // 函数
    registerPlayer,
    completeBattle,
    startAdventure,
    getMonsterStats,
    estimateWinRate,
    claimTreasureBoxes,
    openTreasureBox,
    equipItem,
    unequipItem,
    upgradeEquipmentStars,
    enhanceEquipment,
    
    // 数据刷新
    refreshAllData,
    refetchPlayer,
    refetchTreasureBoxes,
    refetchClaimableBoxes,
    refetchEquippedItems,
    refetchPlayerInventory,
    refetchPlayerItems,
    refetchMaxAdventureLevel,
    refetchBattleStats,
  };
}