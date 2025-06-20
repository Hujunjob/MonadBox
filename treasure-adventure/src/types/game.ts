export interface Player {
  id: string;
  name: string;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  agility: number;
  attack: number;
  defense: number;
  criticalRate: number;
  criticalDamage: number;
  gold: number;
  stamina: number;
  maxStamina: number;
  lastStaminaTime: number;
  equipment: Equipment;
  inventory: InventoryItem[];
  treasureBoxes: number;
  currentForestLevel: number;
  currentForestProgress: number;
  lastTreasureBoxTime: number;
}

export interface Equipment {
  helmet?: EquipmentItem;
  armor?: EquipmentItem;
  shoes?: EquipmentItem;
  weapon?: EquipmentItem;
  shield?: EquipmentItem;
  accessory?: EquipmentItem;
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: EquipmentType;
  rarity: ItemRarity;
  stats: ItemStats;
  level: number;
  baseStats: ItemStats;
}

export interface ItemStats {
  attack?: number;
  defense?: number;
  health?: number;
  agility?: number;
  criticalRate?: number;
  criticalDamage?: number;
}

export const EquipmentType = {
  HELMET: 'helmet',
  ARMOR: 'armor',
  SHOES: 'shoes',
  WEAPON: 'weapon',
  SHIELD: 'shield',
  ACCESSORY: 'accessory'
} as const;

export type EquipmentType = typeof EquipmentType[keyof typeof EquipmentType];

export const ItemRarity = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
} as const;

export type ItemRarity = typeof ItemRarity[keyof typeof ItemRarity];

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  quantity: number;
  effect?: ItemEffect;
}

export const ItemType = {
  HEALTH_POTION: 'health_potion',
  EQUIPMENT: 'equipment',
  GOLD: 'gold',
  EXPERIENCE: 'experience'
} as const;

export type ItemType = typeof ItemType[keyof typeof ItemType];

export interface ItemEffect {
  type: EffectType;
  value: number;
}

export const EffectType = {
  HEAL: 'heal',
  DAMAGE: 'damage',
  BUFF: 'buff'
} as const;

export type EffectType = typeof EffectType[keyof typeof EffectType];

export interface Monster {
  id: string;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  agility: number;
  criticalRate: number;
  criticalDamage: number;
  experience: number;
  goldDrop: number;
}

export interface ForestLevel {
  level: number;
  name: string;
  monsters: Monster[];
  isUnlocked: boolean;
  monstersKilled: number;
  requiredKills: number;
}

export interface TreasureBox {
  id: string;
  rarity: ItemRarity;
  contents: TreasureBoxContent[];
}

export interface TreasureBoxContent {
  type: RewardType;
  item?: EquipmentItem | InventoryItem;
  amount?: number;
}

export const RewardType = {
  EXPERIENCE: 'experience',
  GOLD: 'gold',
  EQUIPMENT: 'equipment',
  HEALTH_POTION: 'health_potion'
} as const;

export type RewardType = typeof RewardType[keyof typeof RewardType];

export interface BattleState {
  player: Player;
  monster: Monster;
  turn: 'player' | 'monster';
  playerActionBar: number;
  monsterActionBar: number;
  playerCooldown: number;
  monsterCooldown: number;
  battleLog: string[];
  isActive: boolean;
}

export interface GameState {
  player: Player;
  forestLevels: ForestLevel[];
  currentBattle?: BattleState;
  gameTime: number;
}