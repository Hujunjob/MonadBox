import {EquipmentType, ItemRarity } from '../types/game';
import type { ForestLevel, Monster, EquipmentItem} from '../types/game';

export const generateForestLevels = (): ForestLevel[] => {
  const levels: ForestLevel[] = [];
  
  for (let i = 1; i <= 10; i++) {
    const monsters: Monster[] = [];
    
    for (let j = 1; j <= 10; j++) {
      monsters.push(generateMonster(i, j));
    }
    
    levels.push({
      level: i,
      name: `第${i}层森林`,
      monsters,
      isUnlocked: i === 1,
      monstersKilled: 0,
      requiredKills: 10
    });
  }
  
  return levels;
};

export const generateMonster = (forestLevel: number, monsterIndex: number): Monster => {
  const baseStats = {
    health: 50 + forestLevel * 20 + monsterIndex * 5,
    attack: 10 + forestLevel * 3 + monsterIndex * 2,
    defense: 5 + forestLevel * 2 + monsterIndex * 1,
    agility: 8 + forestLevel * 1 + Math.floor(monsterIndex / 2),
    criticalRate: Math.max(1, 3 + forestLevel * 1),
    criticalDamage: Math.max(120, 130 + forestLevel * 5)
  };
  
  const monsterNames = [
    '野狼', '熊', '蜘蛛', '骷髅', '哥布林',
    '兽王', '恶魔', '巨龙', '幽灵', '魔王'
  ];
  
  return {
    id: `monster_${forestLevel}_${monsterIndex}`,
    name: `${monsterNames[forestLevel - 1]} ${monsterIndex}`,
    level: forestLevel,
    health: baseStats.health,
    maxHealth: baseStats.health,
    attack: baseStats.attack,
    defense: baseStats.defense,
    agility: baseStats.agility,
    criticalRate: baseStats.criticalRate,
    criticalDamage: baseStats.criticalDamage,
    experience: 20 + forestLevel * 10 + monsterIndex * 5,
    goldDrop: 10 + forestLevel * 5 + monsterIndex * 3
  };
};

export const generateRandomEquipment = (level: number): EquipmentItem => {
  const types = Object.values(EquipmentType);
  const rarities = Object.values(ItemRarity);
  
  const type = types[Math.floor(Math.random() * types.length)];
  const rarity = rarities[Math.floor(Math.random() * rarities.length)];
  
  const rarityMultiplier = {
    [ItemRarity.COMMON]: 1,
    [ItemRarity.UNCOMMON]: 1.5,
    [ItemRarity.RARE]: 2,
    [ItemRarity.EPIC]: 3,
    [ItemRarity.LEGENDARY]: 5
  };
  
  const baseStats = {
    attack: type === EquipmentType.WEAPON ? 5 + level * 2 : 0,
    defense: type === EquipmentType.ARMOR || type === EquipmentType.HELMET || type === EquipmentType.SHIELD ? 3 + level : 0,
    health: type === EquipmentType.ARMOR || type === EquipmentType.SHIELD ? 10 + level * 3 : 0,
    agility: type === EquipmentType.SHOES ? 2 + level : 0,
    criticalRate: type === EquipmentType.WEAPON || type === EquipmentType.ACCESSORY ? 1 + Math.floor(level / 2) : 0,
    criticalDamage: type === EquipmentType.WEAPON || type === EquipmentType.ACCESSORY ? 5 + level * 2 : 0
  };
  
  const multiplier = rarityMultiplier[rarity];
  
  const finalStats = {
    attack: Math.floor(baseStats.attack * multiplier),
    defense: Math.floor(baseStats.defense * multiplier),
    health: Math.floor(baseStats.health * multiplier),
    agility: Math.floor(baseStats.agility * multiplier),
    criticalRate: Math.floor(baseStats.criticalRate * multiplier),
    criticalDamage: Math.floor(baseStats.criticalDamage * multiplier)
  };
  
  return {
    id: `equipment_${Date.now()}_${Math.random()}`,
    name: `${rarity} ${type}`,
    type,
    rarity,
    level: 1,
    baseStats: { ...finalStats },
    stats: { ...finalStats }
  };
};

// 计算装备加成
export const calculateEquipmentBonus = (player: any) => {
  let attackBonus = 0;
  let defenseBonus = 0;
  let healthBonus = 0;
  let agilityBonus = 0;
  let criticalRateBonus = 0;
  let criticalDamageBonus = 0;
  
  const equipment = player.equipment || {};
  
  Object.values(equipment).forEach((item: any) => {
    if (item && item.stats) {
      attackBonus += item.stats.attack || 0;
      defenseBonus += item.stats.defense || 0;
      healthBonus += item.stats.health || 0;
      agilityBonus += item.stats.agility || 0;
      criticalRateBonus += item.stats.criticalRate || 0;
      criticalDamageBonus += item.stats.criticalDamage || 0;
    }
  });
  
  return {
    attack: attackBonus,
    defense: defenseBonus,
    health: healthBonus,
    agility: agilityBonus,
    criticalRate: criticalRateBonus,
    criticalDamage: criticalDamageBonus
  };
};

// 获取基础属性
export const getBaseStats = (player: any) => {
  return {
    attack: player.attack || 0,
    defense: player.defense || 0,
    maxHealth: player.maxHealth || 0,
    agility: player.agility || 0,
    criticalRate: player.criticalRate || 5,
    criticalDamage: player.criticalDamage || 150
  };
};

export const calculatePlayerStats = (player: any) => {
  const baseStats = getBaseStats(player);
  const equipmentBonus = calculateEquipmentBonus(player);
  
  return {
    attack: baseStats.attack + equipmentBonus.attack,
    defense: baseStats.defense + equipmentBonus.defense,
    maxHealth: baseStats.maxHealth + equipmentBonus.health,
    agility: baseStats.agility + equipmentBonus.agility,
    criticalRate: baseStats.criticalRate + equipmentBonus.criticalRate,
    criticalDamage: baseStats.criticalDamage + equipmentBonus.criticalDamage
  };
};

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getNextTreasureBoxTime = (lastBoxTime: number): number => {
  const now = Math.floor(Date.now() / 1000); // 转换为秒
  const lastTime = Math.floor(lastBoxTime / 1000); // 转换为秒
  const timePassed = now - lastTime;
  const timeUntilNext = 3600 - timePassed; // 1小时 = 3600秒
  return Math.max(0, timeUntilNext);
};

export const getEquipmentImage = (type: string): string => {
  // 映射装备类型到对应的图片文件名
  const imageMap: { [key: string]: string } = {
    'helmet': '/assets/helmet.png',
    'armor': '/assets/armor.png',
    'shoes': '/assets/shoe.png',
    'weapon': '/assets/weapon.png',
    'shield': '/assets/shield.png',
    'accessory': '/assets/accessory.png'
  };
  
  return imageMap[type] || '/assets/weapon.png';
};

export const getItemImage = (type: string): string => {
  // 映射物品类型到对应的图片文件名
  const imageMap: { [key: string]: string } = {
    'health_potion': '/assets/blood.png'
  };
  
  return imageMap[type] || '/assets/blood.png';
};

export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'common': return '#9ca3af';
    case 'uncommon': return '#10b981';
    case 'rare': return '#3b82f6';
    case 'epic': return '#8b5cf6';
    case 'legendary': return '#f59e0b';
    default: return '#6b7280';
  }
};