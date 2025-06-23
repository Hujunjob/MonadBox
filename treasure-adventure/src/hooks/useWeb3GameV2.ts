import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { useToast } from '../components/ToastManager';
import { useSafeContractCall } from './useSafeContractCall';
import { useState, useEffect } from 'react';
import { decodeEventLog } from 'viem';
import { 
  CONTRACT_ADDRESSES,
  PLAYER_NFT_ABI,
  BATTLE_SYSTEM_ABI,
  GOLD_TOKEN_ABI,
  TREASURE_BOX_SYSTEM_ABI,
  EQUIPMENT_NFT_ABI,
  ITEM_NFT_ABI,
  EQUIPMENT_SYSTEM_ABI
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

  // 获取未开启的宝箱数量
  const { data: unopenedBoxCount, refetch: refetchUnopenedBoxes } = useReadContract({
    address: CONTRACTS.TREASURE_BOX_SYSTEM,
    abi: TREASURE_BOX_SYSTEM_ABI,
    functionName: 'getUnopenedBoxCount',
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
  

  // 更新当前玩家ID
  useEffect(() => {
    if (firstPlayerTokenId) {
      setCurrentPlayerId(Number(firstPlayerTokenId));
    }
  }, [firstPlayerTokenId]);

  // 获取装备详细信息的辅助函数
  const fetchEquipmentDetails = async (equipmentIds: readonly bigint[]) => {
    if (!equipmentIds || equipmentIds.length === 0) {
      setInventoryEquipments([]);
      return;
    }

    try {
      // TODO: 实际项目中需要通过Equipment合约的getEquipment函数读取每个装备的详细信息
      // 现在暂时使用基于ID的模拟数据，但只有当链上确实有装备时才生成
      const mockEquipments = equipmentIds.map((id) => {
        const numId = Number(id);
        const seed = numId; // 使用ID作为种子保证一致性
        
        return {
          id: numId,
          name: `装备${numId}`,
          equipmentType: numId % 8, // 0-7 分别对应不同类型
          level: (seed % 10) + 1,
          stars: seed % 3,
          rarity: seed % 5,
          attack: 10 + (seed % 20),
          defense: 5 + (seed % 15),
          agility: 8 + (seed % 12),
          criticalRate: seed % 10,
          criticalDamage: 150 + (seed % 50),
        };
      });
      
      setInventoryEquipments(mockEquipments);
    } catch (error) {
      console.error('Failed to fetch equipment details:', error);
      setInventoryEquipments([]);
    }
  };

  // 获取玩家物品数据的辅助函数
  const fetchPlayerItems = async (playerId: number) => {
    try {
      // TODO: 实际项目中需要通过Player合约的getPlayerItemQuantity函数读取
      // 现在返回空数组，新玩家开始时应该没有任何物品
      setPlayerItems([]);
    } catch (error) {
      console.error('Failed to fetch player items:', error);
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
  }, [playerInventory]);

  // 监听玩家ID变化，获取物品数据
  useEffect(() => {
    if (currentPlayerId > 0) {
      fetchPlayerItems(currentPlayerId);
    } else {
      // 如果没有玩家ID，清空物品列表
      setPlayerItems([]);
    }
  }, [currentPlayerId]);


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
              healAmount: healAmount.toString()
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
                break;
              case 2: // 血瓶
                rewardDescription = `获得 ${rewardData.itemName}！可恢复 ${rewardData.healAmount} 血量`;
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

  // 装备升星
  const upgradeEquipmentStars = async (equipmentId: number) => {
    if (!isConnected || !address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    await safeCall(
      {
        address: CONTRACTS.EQUIPMENT_SYSTEM,
        abi: EQUIPMENT_SYSTEM_ABI,
        functionName: 'upgradeStars',
        args: [BigInt(equipmentId)],
      },
      undefined,
      {
        loadingMessage: '⭐ 正在升星...',
        successMessage: '✅ 升星成功！',
        errorMessage: '❌ 升星失败'
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
        errorMessage: '❌ 强化失败'
      }
    );
  };

  // 监听交易确认
  // useEffect(() => {
  //   console.log('useWeb3GameV2 - 交易状态变化:', { isConfirmed, isConfirming, isPending });
  //   if (isConfirmed) {
  //     console.log('useWeb3GameV2 - 交易确认成功，开始刷新数据');
  //     showToast('交易确认成功！', 'success');
  //     // 刷新数据
  //     refetchPlayer();
  //     refetchTreasureBoxes();
  //     refetchUnopenedBoxes();
  //     refetchClaimableBoxes();
  //     refetchPlayerBalance();
  //     refetchPlayerTokenId();
  //     refetchEquippedItems();
  //     refetchPlayerTreasureBoxes();
  //   }
  // }, [isConfirmed, isConfirming, isPending, refetchPlayer, refetchTreasureBoxes, refetchUnopenedBoxes, refetchClaimableBoxes, refetchPlayerBalance, refetchPlayerTokenId, refetchEquippedItems, refetchPlayerTreasureBoxes]);

  // 处理装备槽位映射
  const getEquippedItemsMap = () => {
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
  };

  // 将装备类型数字转换为名称
  const getEquipmentTypeName = (type: number) => {
    const typeNames = ['helmet', 'armor', 'shoes', 'weapon', 'shield', 'accessory', 'ring', 'pet'];
    return typeNames[type] || 'weapon';
  };

  // 处理背包物品数据
  const getInventoryItems = () => {
    const items: any[] = [];
    
    // 添加装备
    inventoryEquipments.forEach(equipment => {
      // 如果装备没有被装备，就加入背包
      const isEquipped = equippedItems && equippedItems.some(id => Number(id) === equipment.id);
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
  };

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

  // 转换Player数据为前端格式，确保所有字段都有默认值
  const convertedPlayerData = {
    id: currentPlayerId.toString(),
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
    equipment: getEquippedItemsMap(),
    inventory: getInventoryItems(), // 使用处理后的装备和物品数据
    treasureBoxes: [], // Web3模式下宝箱数据由单独的状态管理
    equippedItemIds: equippedItems || [],
  };

  return {
    // 数据
    playerData: convertedPlayerData,
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
    upgradeEquipmentStars,
    enhanceEquipment,
    
    // 数据刷新
    refetchPlayer,
    refetchTreasureBoxes,
    refetchUnopenedBoxes,
    refetchClaimableBoxes,
    refetchEquippedItems,
    refetchPlayerInventory,
  };
}