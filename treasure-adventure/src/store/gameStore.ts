import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, GameState, ForestLevel, Monster, BattleState, Equipment, InventoryItem } from '../types/game';
import { generateForestLevels, generateMonster } from '../utils/gameUtils';

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
          const newEquipment = { ...state.player.equipment };
          newEquipment[slot as keyof Equipment] = item;
          
          const newInventory = state.player.inventory.filter(invItem => invItem.id !== item.id);
          
          return {
            player: {
              ...state.player,
              equipment: newEquipment,
              inventory: newInventory
            }
          };
        });
      },

      unequipItem: (slot) => {
        set((state) => {
          const equipment = state.player.equipment;
          const item = equipment[slot as keyof Equipment];
          
          if (item) {
            const newEquipment = { ...equipment };
            delete newEquipment[slot as keyof Equipment];
            
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
                inventory: newInventory
              }
            };
          }
          
          return state;
        });
      },

      useHealthPotion: () => {
        set((state) => {
          const potionIndex = state.player.inventory.findIndex(item => item.type === 'health_potion');
          if (potionIndex === -1) return state;
          
          const potion = state.player.inventory[potionIndex];
          const healAmount = potion.effect?.value || 50;
          const newHealth = Math.min(state.player.health + healAmount, state.player.maxHealth);
          
          const newInventory = [...state.player.inventory];
          if (potion.quantity > 1) {
            newInventory[potionIndex] = { ...potion, quantity: potion.quantity - 1 };
          } else {
            newInventory.splice(potionIndex, 1);
          }
          
          return {
            player: {
              ...state.player,
              health: newHealth,
              inventory: newInventory
            }
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
          
          const expNeeded = newLevel * 100;
          
          if (newExp >= expNeeded) {
            newLevel++;
            newExp -= expNeeded;
            newMaxHealth += 20;
            newHealth = newMaxHealth;
            newAttack += 3;
            newDefense += 2;
            newAgility += 1;
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
              agility: newAgility
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
        set((state) => ({
          currentBattle: {
            player: state.player,
            monster: { ...monster },
            turn: 'player',
            playerCooldown: 0,
            monsterCooldown: 0,
            battleLog: [],
            isActive: true
          }
        }));
      },

      endBattle: () => {
        set({ currentBattle: undefined });
      },

      playerAttack: () => {
        set((state) => {
          if (!state.currentBattle || state.currentBattle.turn !== 'player' || state.currentBattle.playerCooldown > 0) {
            return state;
          }
          
          const battle = state.currentBattle;
          const damage = Math.max(1, battle.player.attack - battle.monster.defense);
          const newMonsterHealth = Math.max(0, battle.monster.health - damage);
          
          const newBattleLog = [...battle.battleLog, `你攻击了${battle.monster.name}，造成${damage}点伤害`];
          
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
              turn: 'monster',
              playerCooldown: Math.max(1000, 2000 - battle.player.agility * 10),
              battleLog: newBattleLog,
              isActive: newMonsterHealth > 0
            }
          };
        });
      },

      monsterAttack: () => {
        set((state) => {
          if (!state.currentBattle || state.currentBattle.turn !== 'monster' || state.currentBattle.monsterCooldown > 0) {
            return state;
          }
          
          const battle = state.currentBattle;
          const damage = Math.max(1, battle.monster.attack - battle.player.defense);
          const newPlayerHealth = Math.max(0, battle.player.health - damage);
          
          const newBattleLog = [...battle.battleLog, `${battle.monster.name}攻击了你，造成${damage}点伤害`];
          
          if (newPlayerHealth <= 0) {
            newBattleLog.push('你被击败了！');
          }
          
          get().updatePlayer({ health: newPlayerHealth });
          
          return {
            currentBattle: {
              ...battle,
              player: { ...battle.player, health: newPlayerHealth },
              turn: 'player',
              monsterCooldown: Math.max(1000, 2000 - battle.monster.agility * 10),
              battleLog: newBattleLog,
              isActive: newPlayerHealth > 0
            }
          };
        });
      },

      updateBattleCooldowns: () => {
        set((state) => {
          if (!state.currentBattle) return state;
          
          return {
            currentBattle: {
              ...state.currentBattle,
              playerCooldown: Math.max(0, state.currentBattle.playerCooldown - 100),
              monsterCooldown: Math.max(0, state.currentBattle.monsterCooldown - 100)
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
          
          if (timeSinceLastBox >= 60) { // 改为60秒测试
            get().addTreasureBox();
            get().updatePlayer({ lastTreasureBoxTime: now });
          }
          
          return { gameTime: newTime };
        });
      }
    }),
    {
      name: 'treasure-adventure-game',
      partialize: (state) => ({
        player: state.player,
        forestLevels: state.forestLevels,
        gameTime: state.gameTime
      })
    }
  )
);