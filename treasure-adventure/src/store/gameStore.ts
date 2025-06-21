import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, GameState, Monster, Equipment } from '../types/game';
import { generateForestLevels, calculatePlayerStats } from '../utils/gameUtils';
import { GAME_CONFIG } from '../config/gameConfig';

interface GameStore extends GameState {
  initializeGame: () => void;
  updatePlayer: (updates: Partial<Player>) => void;
  equipItem: (item: any, slot: string) => void;
  unequipItem: (slot: string) => void;
  useHealthPotion: () => void;
  gainExperience: (amount: number) => void;
  gainGold: (amount: number) => void;
  startBattle: (monster: Monster) => void;
  endBattle: () => void;
  playerAttack: () => void;
  monsterAttack: () => void;
  updateBattleCooldowns: () => void;
  updateActionBars: () => void;
  openTreasureBox: () => void;
  buyTreasureBox: () => void;
  addTreasureBox: (boxLevel?: number) => void;
  unlockNextForestLevel: () => void;
  incrementGameTime: () => void;
  calculateOfflineRewards: () => void;
  upgradeEquipment: (equipmentId: string, count: number) => void;
  upgradeEquipmentStars: (equipmentId: string) => Promise<{ success: boolean; newStars: number; message: string }>;
  updateStamina: () => void;
  consumeStamina: (amount: number) => boolean;
}

const createInitialPlayer = (): Player => ({
  id: 'player1',
  name: '冒险者',
  level: 1,
  experience: 0,
  health: 100,
  maxHealth: 100,
  agility: 10,
  attack: 15,
  defense: 5,
  criticalRate: 5,
  criticalDamage: 150,
  gold: 100,
  stamina: 24,
  maxStamina: 24,
  lastStaminaTime: Math.floor(Date.now() / 1000),
  equipment: {
    helmet: undefined,
    armor: undefined,
    shoes: undefined,
    weapon: undefined,
    shield: undefined,
    accessory: undefined
  },
  inventory: [
    {
      id: 'health_potion_1',
      name: '血瓶',
      type: 'health_potion' as any,
      quantity: 3,
      level: 1,
      effect: { type: 'heal' as any, value: 50 }
    }
  ],
  treasureBoxes: [{ id: 'box_1', level: 1 }],
  currentForestLevel: 1,
  currentForestProgress: 0,
  lastTreasureBoxTime: Math.floor(Date.now() / 1000)
});

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      player: createInitialPlayer(),
      forestLevels: generateForestLevels(),
      currentBattle: undefined,
      gameTime: 0,

      initializeGame: () => {
        // 这个函数现在主要用于重置游戏
        set({
          player: createInitialPlayer(),
          forestLevels: generateForestLevels(),
          currentBattle: undefined,
          gameTime: 0
        });
      },

      updatePlayer: (updates) => {
        set((state) => ({
          player: { ...state.player, ...updates }
        }));
      },

      equipItem: (item, slot) => {
        set((state) => {
          // 计算装备前的最大血量
          const oldStats = calculatePlayerStats(state.player);
          
          const newEquipment = { ...state.player.equipment };
          
          // 确保slot值正确映射
          const slotKey = slot === 'helmet' ? 'helmet' :
                         slot === 'armor' ? 'armor' :
                         slot === 'shoes' ? 'shoes' :
                         slot === 'weapon' ? 'weapon' :
                         slot === 'shield' ? 'shield' :
                         slot === 'accessory' ? 'accessory' : slot;
          
          const equipmentItem = {
            id: item.id,
            name: item.name,
            type: item.equipmentType || item.type,
            rarity: item.rarity,
            stats: item.stats,
            level: item.level || 1,
            stars: item.stars || 0,
            baseStats: item.baseStats || item.stats
          };
          
          newEquipment[slotKey as keyof Equipment] = equipmentItem;
          
          // 计算装备后的最大血量
          const tempPlayer = { ...state.player, equipment: newEquipment };
          const newStats = calculatePlayerStats(tempPlayer);
          
          // 如果最大血量发生变化，按比例调整当前血量
          let newHealth = state.player.health;
          if (newStats.maxHealth !== oldStats.maxHealth) {
            const healthRatio = state.player.health / oldStats.maxHealth;
            newHealth = Math.floor(healthRatio * newStats.maxHealth);
          }
          
          const newInventory = state.player.inventory.filter(invItem => invItem.id !== item.id);
          
          return {
            player: {
              ...state.player,
              equipment: newEquipment,
              inventory: newInventory,
              health: newHealth
            }
          };
        });
      },

      unequipItem: (slot) => {
        set((state) => {
          const equipment = state.player.equipment;
          const item = equipment[slot as keyof Equipment];
          
          if (item) {
            // 计算卸装前的最大血量
            const oldStats = calculatePlayerStats(state.player);
            
            const newEquipment = { ...equipment };
            delete newEquipment[slot as keyof Equipment];
            
            // 计算卸装后的最大血量
            const tempPlayer = { ...state.player, equipment: newEquipment };
            const newStats = calculatePlayerStats(tempPlayer);
            
            // 如果最大血量发生变化，按比例调整当前血量
            let newHealth = state.player.health;
            if (newStats.maxHealth !== oldStats.maxHealth) {
              const healthRatio = state.player.health / oldStats.maxHealth;
              newHealth = Math.floor(healthRatio * newStats.maxHealth);
            }
            
            const newInventory = [...state.player.inventory, {
              id: item.id,
              name: item.name,
              type: 'equipment' as any,
              quantity: 1,
              equipmentType: item.type,
              rarity: item.rarity,
              stats: item.stats,
              level: item.level || 1,
              baseStats: item.baseStats || item.stats
            }];
            
            return {
              player: {
                ...state.player,
                equipment: newEquipment,
                inventory: newInventory,
                health: newHealth
              }
            };
          }
          
          return state;
        });
      },

      useHealthPotion: () => {
        set((state) => {
          // 使用calculatePlayerStats计算实际最大血量（包括装备加成）
          const stats = calculatePlayerStats(state.player);
          
          // 检查血量是否已满
          if (state.player.health >= stats.maxHealth) {
            return state;
          }
          
          const potionIndex = state.player.inventory.findIndex(item => item.type === 'health_potion');
          if (potionIndex === -1) {
            return state;
          }
          
          const potion = state.player.inventory[potionIndex];
          const healAmount = potion.effect?.value || 50;
          const newHealth = Math.min(state.player.health + healAmount, stats.maxHealth);
          
          const newInventory = [...state.player.inventory];
          if (potion.quantity > 1) {
            newInventory[potionIndex] = { ...potion, quantity: potion.quantity - 1 };
          } else {
            newInventory.splice(potionIndex, 1);
          }
          
          const updatedPlayer = {
            ...state.player,
            health: newHealth,
            inventory: newInventory
          };
          
          // 如果在战斗中，同时更新战斗状态并切换回合
          const updatedBattle = state.currentBattle ? {
            ...state.currentBattle,
            player: {
              ...state.currentBattle.player,
              health: newHealth,
              inventory: newInventory
            },
            turn: 'monster' as const,
            playerCooldown: Math.max(1000, 2000 - state.currentBattle.player.agility * 10),
            battleLog: [...state.currentBattle.battleLog, `你使用了血瓶，恢复了${healAmount}点血量`]
          } : state.currentBattle;
          
          return {
            player: updatedPlayer,
            currentBattle: updatedBattle
          };
        });
      },

      gainExperience: (amount) => {
        set((state) => {
          let newExp = state.player.experience + amount;
          let newLevel = state.player.level;
          let newMaxHealth = state.player.maxHealth;
          let newHealth = state.player.health;
          let newAttack = state.player.attack;
          let newDefense = state.player.defense;
          let newAgility = state.player.agility;
          let newCriticalRate = state.player.criticalRate;
          let newCriticalDamage = state.player.criticalDamage;
          
          const expNeeded = newLevel * 100;
          
          if (newExp >= expNeeded) {
            newLevel++;
            newExp -= expNeeded;
            newMaxHealth += 20;
            newHealth = newMaxHealth;
            newAttack += 3;
            newDefense += 2;
            newAgility += 1;
            newCriticalRate += 1;
            newCriticalDamage += 5;
          }
          
          return {
            player: {
              ...state.player,
              experience: newExp,
              level: newLevel,
              maxHealth: newMaxHealth,
              health: newHealth,
              attack: newAttack,
              defense: newDefense,
              agility: newAgility,
              criticalRate: newCriticalRate,
              criticalDamage: newCriticalDamage
            }
          };
        });
      },

      gainGold: (amount) => {
        set((state) => ({
          player: {
            ...state.player,
            gold: state.player.gold + amount
          }
        }));
      },

      startBattle: (monster) => {
        const state = get();
        // 检查体力是否足够
        if (state.player.stamina < 1) {
          return;
        }
        
        // 消耗体力
        get().consumeStamina(1);
        
        set((state) => {
          // 计算玩家的实际属性（包含装备加成）
          const playerStats = calculatePlayerStats(state.player);
          const playerWithStats = {
            ...state.player,
            attack: playerStats.attack,
            defense: playerStats.defense,
            agility: playerStats.agility,
            criticalRate: playerStats.criticalRate || 5,
            criticalDamage: playerStats.criticalDamage || 150
            // 注意：这里不修改maxHealth，因为当前血量已经是正确的
          };
          
          return {
            currentBattle: {
              player: playerWithStats,
              monster: { ...monster },
              turn: 'player',
              playerActionBar: 0,
              monsterActionBar: 0,
              playerCooldown: 0,
              monsterCooldown: 0,
              battleLog: [],
              isActive: true
            }
          };
        });
      },

      endBattle: () => {
        set({ currentBattle: undefined });
      },

      playerAttack: () => {
        set((state) => {
          if (!state.currentBattle || 
              state.currentBattle.playerCooldown > 0 || 
              state.currentBattle.playerActionBar < 100 ||
              !state.currentBattle.isActive) {
            return state;
          }
          
          const battle = state.currentBattle;
          let damage = Math.max(1, battle.player.attack - battle.monster.defense);
          
          // 暴击计算
          const playerCritRate = battle.player.criticalRate || 5;
          const playerCritDamage = battle.player.criticalDamage || 150;
          const isCritical = Math.random() * 100 < playerCritRate;
          if (isCritical) {
            damage = Math.floor(damage * (playerCritDamage / 100));
          }
          
          const newMonsterHealth = Math.max(0, battle.monster.health - damage);
          
          const newBattleLog = [...battle.battleLog, `你攻击了${battle.monster.name}，造成${damage}点伤害${isCritical ? '（暴击！）' : ''}`];
          
          if (newMonsterHealth <= 0) {
            newBattleLog.push(`${battle.monster.name}被击败了！`);
            get().gainExperience(battle.monster.experience);
            get().gainGold(battle.monster.goldDrop);
            get().addTreasureBox();
            
            const newProgress = state.player.currentForestProgress + 1;
            if (newProgress >= 10) {
              get().unlockNextForestLevel();
            } else {
              get().updatePlayer({ currentForestProgress: newProgress });
            }
          }
          
          return {
            currentBattle: {
              ...battle,
              monster: { ...battle.monster, health: newMonsterHealth },
              playerActionBar: 0, // 重置玩家行动条
              playerCooldown: Math.max(1000, 2000 - battle.player.agility * 10),
              battleLog: newBattleLog,
              isActive: newMonsterHealth > 0
            }
          };
        });
      },

      monsterAttack: () => {
        set((state) => {
          if (!state.currentBattle || 
              state.currentBattle.monsterCooldown > 0 || 
              state.currentBattle.monsterActionBar < 100 ||
              !state.currentBattle.isActive) {
            return state;
          }
          
          const battle = state.currentBattle;
          let damage = Math.max(1, battle.monster.attack - battle.player.defense);
          
          // 暴击计算
          const monsterCritRate = battle.monster.criticalRate || 3;
          const monsterCritDamage = battle.monster.criticalDamage || 130;
          const isCritical = Math.random() * 100 < monsterCritRate;
          if (isCritical) {
            damage = Math.floor(damage * (monsterCritDamage / 100));
          }
          
          const newPlayerHealth = Math.max(0, battle.player.health - damage);
          
          const newBattleLog = [...battle.battleLog, `${battle.monster.name}攻击了你，造成${damage}点伤害${isCritical ? '（暴击！）' : ''}`];
          
          if (newPlayerHealth <= 0) {
            newBattleLog.push('你被击败了！');
          }
          
          get().updatePlayer({ health: newPlayerHealth });
          
          return {
            currentBattle: {
              ...battle,
              player: { ...battle.player, health: newPlayerHealth },
              monsterActionBar: 0, // 重置怪物行动条
              monsterCooldown: Math.max(1000, 2000 - battle.monster.agility * 10),
              battleLog: newBattleLog,
              isActive: newPlayerHealth > 0
            }
          };
        });
      },

      updateBattleCooldowns: () => {
        set((state) => {
          if (!state.currentBattle || !state.currentBattle.isActive) return state;
          
          const newPlayerCooldown = Math.max(0, state.currentBattle.playerCooldown - 100);
          const newMonsterCooldown = Math.max(0, state.currentBattle.monsterCooldown - 100);
          
          // 避免不必要的更新
          if (newPlayerCooldown === state.currentBattle.playerCooldown && 
              newMonsterCooldown === state.currentBattle.monsterCooldown) {
            return state;
          }
          
          return {
            currentBattle: {
              ...state.currentBattle,
              playerCooldown: newPlayerCooldown,
              monsterCooldown: newMonsterCooldown
            }
          };
        });
      },

      updateActionBars: () => {
        set((state) => {
          if (!state.currentBattle || !state.currentBattle.isActive) return state;
          
          const battle = state.currentBattle;
          
          // 根据敏捷度计算行动条增长速度
          const playerSpeed = battle.player.agility || 10;
          const monsterSpeed = battle.monster.agility || 10;
          
          // 基础增长值，敏捷度越高增长越快
          const playerGrowth = playerSpeed * 0.8;
          const monsterGrowth = monsterSpeed * 0.8;
          
          let newPlayerActionBar = battle.playerActionBar + playerGrowth;
          let newMonsterActionBar = battle.monsterActionBar + monsterGrowth;
          
          // 行动条满了（100）就可以行动
          const maxActionBar = 100;
          let newTurn = battle.turn;
          
          // 行动条系统不需要严格的回合制，移除回合切换逻辑
          // newTurn 保持当前值即可
          
          // 确保行动条不超过最大值
          newPlayerActionBar = Math.min(newPlayerActionBar, maxActionBar);
          newMonsterActionBar = Math.min(newMonsterActionBar, maxActionBar);
          
          return {
            currentBattle: {
              ...battle,
              playerActionBar: newPlayerActionBar,
              monsterActionBar: newMonsterActionBar,
              turn: newTurn
            }
          };
        });
      },

      openTreasureBox: () => {
        set((state) => {
          const currentBoxes = Array.isArray(state.player.treasureBoxes) ? state.player.treasureBoxes : [];
          if (currentBoxes.length <= 0) return state;
          
          const rewards = Math.floor(Math.random() * 4) + 1;
          let newInventory = [...state.player.inventory];
          
          for (let i = 0; i < rewards; i++) {
            const rewardType = Math.floor(Math.random() * 4);
            
            switch (rewardType) {
              case 0:
                get().gainExperience(50);
                break;
              case 1:
                get().gainGold(100);
                break;
              case 2:
                const healthPotion = {
                  id: `health_potion_${Date.now()}_${i}`,
                  name: '血瓶',
                  type: 'health_potion' as any,
                  quantity: 1,
                  effect: { type: 'heal' as any, value: 50 }
                };
                newInventory.push(healthPotion);
                break;
            }
          }
          
          return {
            player: {
              ...state.player,
              treasureBoxes: currentBoxes.slice(1),
              inventory: newInventory
            }
          };
        });
      },

      buyTreasureBox: () => {
        set((state) => {
          if (state.player.gold < GAME_CONFIG.TREASURE_BOX.PURCHASE_COST) return state;
          
          // 购买的宝箱等级为1级
          const newTreasureBox = {
            id: `box_${Date.now()}`,
            level: 1
          };
          
          // 确保treasureBoxes是数组
          const currentBoxes = Array.isArray(state.player.treasureBoxes) ? state.player.treasureBoxes : [];
          
          return {
            player: {
              ...state.player,
              gold: state.player.gold - GAME_CONFIG.TREASURE_BOX.PURCHASE_COST,
              treasureBoxes: [...currentBoxes, newTreasureBox]
            }
          };
        });
      },

      addTreasureBox: (boxLevel?: number) => {
        set((state) => {
          // 如果没有指定等级，根据当前森林等级确定宝箱等级
          const level = boxLevel || state.player.currentForestLevel;
          const newTreasureBox = {
            id: `box_${Date.now()}`,
            level: Math.min(level, GAME_CONFIG.TREASURE_BOX.MAX_LEVEL)
          };
          
          // 确保treasureBoxes是数组
          const currentBoxes = Array.isArray(state.player.treasureBoxes) ? state.player.treasureBoxes : [];
          
          return {
            player: {
              ...state.player,
              treasureBoxes: [...currentBoxes, newTreasureBox]
            }
          };
        });
      },

      unlockNextForestLevel: () => {
        set((state) => {
          const nextLevel = state.player.currentForestLevel + 1;
          if (nextLevel > 10) return state;
          
          const newForestLevels = state.forestLevels.map(level => 
            level.level === nextLevel ? { ...level, isUnlocked: true } : level
          );
          
          return {
            player: {
              ...state.player,
              currentForestLevel: nextLevel,
              currentForestProgress: 0
            },
            forestLevels: newForestLevels
          };
        });
      },

      incrementGameTime: () => {
        set((state) => {
          const newTime = state.gameTime + 1;
          const now = Math.floor(Date.now() / 1000);
          const timeSinceLastBox = now - state.player.lastTreasureBoxTime;
          
          if (timeSinceLastBox >= GAME_CONFIG.TREASURE_BOX.AUTO_GAIN_INTERVAL) {
            get().addTreasureBox();
            get().updatePlayer({ lastTreasureBoxTime: now });
          }
          
          // 更新体力
          get().updateStamina();
          
          return { gameTime: newTime };
        });
      },

      // 计算离线宝箱奖励
      calculateOfflineRewards: () => {
        set((state) => {
          const now = Math.floor(Date.now() / 1000);
          const timeSinceLastBox = now - state.player.lastTreasureBoxTime;
          
          // 根据配置的时间间隔获得宝箱
          const offlineBoxes = Math.floor(timeSinceLastBox / GAME_CONFIG.TREASURE_BOX.AUTO_GAIN_INTERVAL);
          
          if (offlineBoxes > 0) {
            // 最多积累24个宝箱(24小时)
            const actualBoxes = Math.min(offlineBoxes, GAME_CONFIG.TREASURE_BOX.MAX_OFFLINE_BOXES);
            // 确保treasureBoxes是数组
            const currentBoxes = Array.isArray(state.player.treasureBoxes) ? state.player.treasureBoxes : [];
            const newTreasureBoxes = [...currentBoxes];
            
            // 添加离线获得的宝箱
            for (let i = 0; i < actualBoxes; i++) {
              newTreasureBoxes.push({
                id: `offline_box_${now}_${i}`,
                level: 1 // 离线获得的宝箱为1级
              });
            }
            
            // 更新最后宝箱时间为当前时间减去余数时间
            const newLastBoxTime = now - (timeSinceLastBox % GAME_CONFIG.TREASURE_BOX.AUTO_GAIN_INTERVAL);
            
            return {
              player: {
                ...state.player,
                treasureBoxes: newTreasureBoxes,
                lastTreasureBoxTime: newLastBoxTime
              }
            };
          }
          
          return state;
        });
      },

      upgradeEquipment: (equipmentId: string, count: number) => {
        set((state) => {
          // 查找要升级的装备
          let targetEquipment: any = null;
          let equipmentLocation: 'inventory' | 'equipped' = 'inventory';
          let equipmentSlot: string | null = null;

          // 在背包中查找
          const inventoryIndex = state.player.inventory.findIndex(item => item.id === equipmentId);
          if (inventoryIndex >= 0) {
            targetEquipment = state.player.inventory[inventoryIndex];
          } else {
            // 在装备中查找
            for (const [slot, equipment] of Object.entries(state.player.equipment)) {
              if (equipment && equipment.id === equipmentId) {
                targetEquipment = equipment;
                equipmentLocation = 'equipped';
                equipmentSlot = slot;
                break;
              }
            }
          }

          if (!targetEquipment) return state;

          // 计算升级成本
          const upgradeCost = targetEquipment.level * 100 * count;
          if (state.player.gold < upgradeCost) return state;

          // 查找材料装备
          const materialItems = state.player.inventory.filter(item => 
            item.type === 'equipment' && 
            item.id !== equipmentId &&
            (item as any).equipmentType === targetEquipment.type &&
            (item as any).rarity === targetEquipment.rarity
          );

          if (materialItems.length < count) return state;

          // 升级装备
          const upgradedEquipment = {
            ...targetEquipment,
            level: targetEquipment.level + count,
            stats: {
              attack: Math.floor((targetEquipment.baseStats.attack || 0) * (1 + count * 0.1)),
              defense: Math.floor((targetEquipment.baseStats.defense || 0) * (1 + count * 0.1)),
              health: Math.floor((targetEquipment.baseStats.health || 0) * (1 + count * 0.1)),
              agility: Math.floor((targetEquipment.baseStats.agility || 0) * (1 + count * 0.1)),
              criticalRate: Math.floor((targetEquipment.baseStats.criticalRate || 0) * (1 + count * 0.1)),
              criticalDamage: Math.floor((targetEquipment.baseStats.criticalDamage || 0) * (1 + count * 0.1))
            }
          };

          // 移除消耗的材料
          let newInventory = [...state.player.inventory];
          let removedCount = 0;
          newInventory = newInventory.filter(item => {
            if (removedCount < count &&
                item.type === 'equipment' && 
                item.id !== equipmentId &&
                (item as any).equipmentType === targetEquipment.type &&
                (item as any).rarity === targetEquipment.rarity) {
              removedCount++;
              return false;
            }
            return true;
          });

          // 更新装备
          let newEquipment = { ...state.player.equipment };
          if (equipmentLocation === 'equipped' && equipmentSlot) {
            newEquipment[equipmentSlot as keyof typeof newEquipment] = upgradedEquipment;
          } else {
            // 更新背包中的装备
            const updatedInventoryIndex = newInventory.findIndex(item => item.id === equipmentId);
            if (updatedInventoryIndex >= 0) {
              newInventory[updatedInventoryIndex] = {
                ...newInventory[updatedInventoryIndex],
                ...upgradedEquipment
              };
            }
          }

          return {
            player: {
              ...state.player,
              gold: state.player.gold - upgradeCost,
              inventory: newInventory,
              equipment: newEquipment
            }
          };
        });
      },

      upgradeEquipmentStars: async (equipmentId: string) => {
        return new Promise((resolve) => {
          set((state) => {
            // 查找要升星的装备
            let targetEquipment: any = null;
            let equipmentLocation: 'inventory' | 'equipped' = 'inventory';
            let equipmentSlot: string | null = null;

            // 在背包中查找
            const inventoryIndex = state.player.inventory.findIndex(item => item.id === equipmentId);
            if (inventoryIndex >= 0) {
              targetEquipment = state.player.inventory[inventoryIndex];
            } else {
              // 在装备中查找
              for (const [slot, equipment] of Object.entries(state.player.equipment)) {
                if (equipment && equipment.id === equipmentId) {
                  targetEquipment = equipment;
                  equipmentLocation = 'equipped';
                  equipmentSlot = slot;
                  break;
                }
              }
            }

            if (!targetEquipment) {
              resolve({ success: false, newStars: 0, message: '装备未找到' });
              return state;
            }

            const currentStars = targetEquipment.stars || 0;
            
            // 检查是否已达到最大星级
            if (currentStars >= 5) {
              resolve({ success: false, newStars: currentStars, message: '已达到最大星级' });
              return state;
            }

            // 计算升星成本
            const upgradeCost = targetEquipment.level * 100;
            if (state.player.gold < upgradeCost) {
              resolve({ success: false, newStars: currentStars, message: '金币不足' });
              return state;
            }

            // 计算所需材料数量：升到下一星级需要的材料数 = 当前星级 + 1
            const requiredMaterials = currentStars + 1;
            
            // 查找材料装备
            const materialItems = state.player.inventory.filter(item => 
              item.type === 'equipment' && 
              item.id !== equipmentId &&
              (item as any).equipmentType === targetEquipment.type &&
              (item as any).rarity === targetEquipment.rarity
            );

            if (materialItems.length < requiredMaterials) {
              resolve({ success: false, newStars: currentStars, message: `材料不足，需要${requiredMaterials}个` });
              return state;
            }

            // 从配置文件获取升星成功率
            const successRatePercent = GAME_CONFIG.EQUIPMENT.UPGRADE_SUCCESS_RATES[currentStars as keyof typeof GAME_CONFIG.EQUIPMENT.UPGRADE_SUCCESS_RATES] || 50;
            const successRate = successRatePercent / 100;
            const isSuccess = Math.random() < successRate;

            // 扣除金币和材料
            let newInventory = [...state.player.inventory];
            let materialsRemoved = 0;
            newInventory = newInventory.filter(item => {
              if (materialsRemoved < requiredMaterials &&
                  item.type === 'equipment' && 
                  item.id !== equipmentId &&
                  (item as any).equipmentType === targetEquipment.type &&
                  (item as any).rarity === targetEquipment.rarity) {
                materialsRemoved++;
                return false;
              }
              return true;
            });

            let newStars = currentStars;
            let message = '';
            
            if (isSuccess) {
              newStars = currentStars + 1;
              message = `升星成功！装备星级提升至${newStars}星`;
              
              // 计算新属性：每星增加20%基础属性
              const starMultiplier = 1 + newStars * 0.2;
              const upgradedEquipment = {
                ...targetEquipment,
                stars: newStars,
                stats: {
                  attack: Math.floor((targetEquipment.baseStats?.attack || 0) * starMultiplier),
                  defense: Math.floor((targetEquipment.baseStats?.defense || 0) * starMultiplier),
                  health: Math.floor((targetEquipment.baseStats?.health || 0) * starMultiplier),
                  agility: Math.floor((targetEquipment.baseStats?.agility || 0) * starMultiplier),
                  criticalRate: Math.floor((targetEquipment.baseStats?.criticalRate || 0) * starMultiplier),
                  criticalDamage: Math.floor((targetEquipment.baseStats?.criticalDamage || 0) * starMultiplier)
                }
              };

              // 更新装备
              let newEquipment = { ...state.player.equipment };
              if (equipmentLocation === 'equipped' && equipmentSlot) {
                newEquipment[equipmentSlot as keyof typeof newEquipment] = upgradedEquipment;
              } else {
                // 更新背包中的装备
                const updatedInventoryIndex = newInventory.findIndex(item => item.id === equipmentId);
                if (updatedInventoryIndex >= 0) {
                  newInventory[updatedInventoryIndex] = {
                    ...newInventory[updatedInventoryIndex],
                    ...upgradedEquipment
                  };
                }
              }

              resolve({ success: true, newStars, message });
              
              return {
                player: {
                  ...state.player,
                  gold: state.player.gold - upgradeCost,
                  inventory: newInventory,
                  equipment: newEquipment
                }
              };
            } else {
              message = `升星失败！装备保持${currentStars}星`;
              resolve({ success: false, newStars: currentStars, message });
              
              return {
                player: {
                  ...state.player,
                  gold: state.player.gold - upgradeCost,
                  inventory: newInventory
                }
              };
            }
          });
        });
      },

      updateStamina: () => {
        set((state) => {
          const now = Math.floor(Date.now() / 1000);
          const timeSinceLastUpdate = now - state.player.lastStaminaTime;
          const hoursElapsed = Math.floor(timeSinceLastUpdate / 3600); // 3600秒 = 1小时
          
          if (hoursElapsed > 0) {
            const staminaToRecover = Math.min(hoursElapsed, state.player.maxStamina - state.player.stamina);
            const newStamina = Math.min(state.player.stamina + staminaToRecover, state.player.maxStamina);
            
            return {
              player: {
                ...state.player,
                stamina: newStamina,
                lastStaminaTime: now
              }
            };
          }
          
          return state;
        });
      },

      consumeStamina: (amount: number) => {
        const state = get();
        if (state.player.stamina >= amount) {
          set((state) => ({
            player: {
              ...state.player,
              stamina: state.player.stamina - amount
            }
          }));
          return true;
        }
        return false;
      }
    }),
    {
      name: 'treasure-adventure-game',
      version: 5,
      partialize: (state) => ({
        player: state.player,
        forestLevels: state.forestLevels,
        gameTime: state.gameTime
      }),
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // 迁移到版本2：添加暴击属性
          if (persistedState.player) {
            persistedState.player.criticalRate = persistedState.player.criticalRate || 5;
            persistedState.player.criticalDamage = persistedState.player.criticalDamage || 150;
          }
        }
        if (version < 3) {
          // 迁移到版本3：添加体力属性
          if (persistedState.player) {
            persistedState.player.stamina = persistedState.player.stamina || 24;
            persistedState.player.maxStamina = persistedState.player.maxStamina || 24;
            persistedState.player.lastStaminaTime = persistedState.player.lastStaminaTime || Math.floor(Date.now() / 1000);
            
            // 确保equipment对象正确初始化
            if (!persistedState.player.equipment || typeof persistedState.player.equipment !== 'object') {
              persistedState.player.equipment = {
                helmet: undefined,
                armor: undefined,
                shoes: undefined,
                weapon: undefined,
                shield: undefined,
                accessory: undefined
              };
            } else {
              // 确保所有槽位都存在
              const equipment = persistedState.player.equipment;
              equipment.helmet = equipment.helmet || undefined;
              equipment.armor = equipment.armor || undefined;
              equipment.shoes = equipment.shoes || undefined;
              equipment.weapon = equipment.weapon || undefined;
              equipment.shield = equipment.shield || undefined;
              equipment.accessory = equipment.accessory || undefined;
            }
          }
        }
        if (version < 4) {
          // 迁移到版本4：修复equipment初始化问题
          if (persistedState.player) {
            // 重新初始化equipment对象以确保正确结构
            if (!persistedState.player.equipment || typeof persistedState.player.equipment !== 'object') {
              persistedState.player.equipment = {
                helmet: undefined,
                armor: undefined,
                shoes: undefined,
                weapon: undefined,
                shield: undefined,
                accessory: undefined
              };
            }
          }
        }
        if (version < 5) {
          // 迁移到版本5：宝箱系统升级（number -> 数组）和装备星级系统
          if (persistedState.player) {
            // 迁移treasureBoxes从number到数组
            if (typeof persistedState.player.treasureBoxes === 'number') {
              const boxCount = persistedState.player.treasureBoxes;
              persistedState.player.treasureBoxes = [];
              for (let i = 0; i < boxCount; i++) {
                persistedState.player.treasureBoxes.push({
                  id: `migrated_box_${i}`,
                  level: 1 // 旧宝箱默认为1级
                });
              }
            }
            
            // 为现有装备添加stars属性
            if (persistedState.player.inventory) {
              persistedState.player.inventory = persistedState.player.inventory.map((item: any) => {
                if (item.type === 'equipment' && item.stars === undefined) {
                  return { ...item, stars: 0 };
                }
                return item;
              });
            }
            
            // 为已装备的装备添加stars属性
            if (persistedState.player.equipment) {
              Object.keys(persistedState.player.equipment).forEach(slot => {
                const item = persistedState.player.equipment[slot];
                if (item && item.stars === undefined) {
                  persistedState.player.equipment[slot] = { ...item, stars: 0 };
                }
              });
            }
            
            // 为血瓶添加level属性并更新名称
            if (persistedState.player.inventory) {
              persistedState.player.inventory = persistedState.player.inventory.map((item: any) => {
                if (item.type === 'health_potion') {
                  const level = item.level || 1;
                  return { 
                    ...item, 
                    level: level,
                    name: `${level}级血瓶`, // 统一名称格式
                    effect: item.effect || { type: 'heal', value: 50 + (level - 1) * 25 } // 确保效果值正确
                  };
                }
                return item;
              });
            }
          }
        }
        return persistedState;
      },
      // 确保在hydration完成后才开始使用
      skipHydration: false,
    }
  )
);