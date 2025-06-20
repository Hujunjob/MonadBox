import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, GameState, ForestLevel, Monster, BattleState, Equipment, InventoryItem } from '../types/game';
import { generateForestLevels, generateMonster, calculatePlayerStats } from '../utils/gameUtils';

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
  addTreasureBox: () => void;
  unlockNextForestLevel: () => void;
  incrementGameTime: () => void;
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
  equipment: {} as Equipment,
  inventory: [
    {
      id: 'health_potion_1',
      name: '血瓶',
      type: 'health_potion' as any,
      quantity: 3,
      effect: { type: 'heal' as any, value: 50 }
    }
  ],
  treasureBoxes: 1,
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
                         slot === 'accessory' ? 'accessory' : slot;
          
          newEquipment[slotKey as keyof Equipment] = {
            id: item.id,
            name: item.name,
            type: item.equipmentType || item.type,
            rarity: item.rarity,
            stats: item.stats
          };
          
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
              quantity: 1
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
          
          // 添加调试信息
          if (newMonsterActionBar >= maxActionBar && battle.monsterActionBar < maxActionBar) {
            console.log('Monster action bar full! Setting turn to monster');
          }
          
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
          if (state.player.treasureBoxes <= 0) return state;
          
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
              treasureBoxes: state.player.treasureBoxes - 1,
              inventory: newInventory
            }
          };
        });
      },

      buyTreasureBox: () => {
        set((state) => {
          if (state.player.gold < 200) return state;
          
          return {
            player: {
              ...state.player,
              gold: state.player.gold - 200,
              treasureBoxes: state.player.treasureBoxes + 1
            }
          };
        });
      },

      addTreasureBox: () => {
        set((state) => ({
          player: {
            ...state.player,
            treasureBoxes: state.player.treasureBoxes + 1
          }
        }));
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
          
          if (timeSinceLastBox >= 20) { // 改为20秒测试
            get().addTreasureBox();
            get().updatePlayer({ lastTreasureBoxTime: now });
          }
          
          return { gameTime: newTime };
        });
      }
    }),
    {
      name: 'treasure-adventure-game',
      version: 2,
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
        return persistedState;
      },
      // 确保在hydration完成后才开始使用
      skipHydration: false,
    }
  )
);