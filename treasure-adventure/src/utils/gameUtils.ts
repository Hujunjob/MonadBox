import {EquipmentType, ItemRarity, JobType, ItemType } from '../types/game';
import type { ForestLevel, Monster, EquipmentItem, InventoryItem} from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';

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

// 根据配置的概率生成稀有度
const generateRarityByProbability = (): ItemRarity => {
  const random = Math.random() * 100;
  const probabilities = GAME_CONFIG.RARITY_PROBABILITIES;
  
  if (random < probabilities.COMMON) {
    return ItemRarity.COMMON;
  } else if (random < probabilities.COMMON + probabilities.UNCOMMON) {
    return ItemRarity.UNCOMMON;
  } else if (random < probabilities.COMMON + probabilities.UNCOMMON + probabilities.RARE) {
    return ItemRarity.RARE;
  } else if (random < probabilities.COMMON + probabilities.UNCOMMON + probabilities.RARE + probabilities.EPIC) {
    return ItemRarity.EPIC;
  } else {
    return ItemRarity.LEGENDARY;
  }
};

export const generateRandomEquipment = (level: number, targetLevel?: number): EquipmentItem => {
  const types = Object.values(EquipmentType);
  
  const type = types[Math.floor(Math.random() * types.length)];
  const rarity = generateRarityByProbability();
  
  // 确定装备等级，如果指定了目标等级则使用，否则使用传入的level
  const equipmentLevel = targetLevel || level;
  
  const rarityMultiplier = {
    [ItemRarity.COMMON]: 1,
    [ItemRarity.UNCOMMON]: 1.5,
    [ItemRarity.RARE]: 2,
    [ItemRarity.EPIC]: 3,
    [ItemRarity.LEGENDARY]: 5
  };
  
  const baseStats = {
    attack: type === EquipmentType.WEAPON ? 5 + equipmentLevel * 2 : 0,
    defense: type === EquipmentType.ARMOR || type === EquipmentType.HELMET || type === EquipmentType.SHIELD ? 3 + equipmentLevel : 0,
    health: type === EquipmentType.ARMOR || type === EquipmentType.SHIELD ? 10 + equipmentLevel * 3 : 0,
    agility: type === EquipmentType.SHOES ? 2 + equipmentLevel : 0,
    criticalRate: type === EquipmentType.WEAPON || type === EquipmentType.ACCESSORY || type === EquipmentType.RING ? 1 + Math.floor(equipmentLevel / 2) : 0,
    criticalDamage: type === EquipmentType.WEAPON || type === EquipmentType.ACCESSORY || type === EquipmentType.RING ? 5 + equipmentLevel * 2 : 0
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
    level: equipmentLevel,
    stars: 0, // 初始为0星
    baseStats: { ...finalStats },
    stats: { ...finalStats }
  };
};

// 生成不同等级的血瓶
export const generateHealthPotion = (level: number) => {
  const healValue = GAME_CONFIG.HEALTH_POTION.BASE_HEAL_AMOUNT + 
                   (level - 1) * GAME_CONFIG.HEALTH_POTION.HEAL_AMOUNT_PER_LEVEL;
  
  return {
    id: `health_potion_${Date.now()}_${Math.random()}`,
    name: `${level}级血瓶`,
    type: 'health_potion' as any,
    quantity: 1,
    level: level,
    effect: { type: 'heal' as any, value: healValue }
  };
};

// 根据宝箱等级生成奖励等级
export const generateRewardLevel = (boxLevel: number): number => {
  const random = Math.random();
  if (random < GAME_CONFIG.TREASURE_BOX.CURRENT_LEVEL_PROBABILITY) {
    return boxLevel; // 当前等级
  } else {
    return Math.min(boxLevel + 1, GAME_CONFIG.TREASURE_BOX.MAX_LEVEL); // 下一级，但不超过最大等级
  }
};

// 生成宠物蛋
export const generatePetEgg = (level: number) => {
  return {
    id: `pet_egg_${Date.now()}_${Math.random()}`,
    name: `${level}级宠物蛋`,
    type: 'pet_egg' as any,
    quantity: 1,
    level: level
  };
};

// 生成转职书
export const generateJobAdvancementBook = (boxLevel: number): InventoryItem => {
  // 根据宝箱等级确定转职书类型
  const { JOB_BOOK_LEVELS, BOOK_NAMES } = GAME_CONFIG.JOB_ADVANCEMENT;
  
  let targetJob: JobType | null = null;
  
  // 寻找匹配的转职书
  for (const [job, levelRange] of Object.entries(JOB_BOOK_LEVELS)) {
    if (boxLevel >= levelRange[0] && boxLevel <= levelRange[1]) {
      targetJob = job as JobType;
      break;
    }
  }
  
  // 如果没有找到匹配的，默认给大剑士转职书
  if (!targetJob) {
    targetJob = JobType.GREAT_SWORDSMAN;
  }
  
  const bookName = BOOK_NAMES[targetJob] || '大剑士转职书';
  
  return {
    id: `job_book_${targetJob}_${Date.now()}_${Math.random()}`,
    name: bookName,
    type: ItemType.JOB_ADVANCEMENT_BOOK,
    quantity: 1,
    targetJob: targetJob
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
    'accessory': '/assets/accessory.png',
    'ring': '/assets/ring.png'
  };
  
  return imageMap[type] || '/assets/weapon.png';
};

export const getItemImage = (type: string): string => {
  // 映射物品类型到对应的图片文件名
  const imageMap: { [key: string]: string } = {
    'health_potion': '/assets/blood.png',
    'pet_egg': '/assets/egg.png',
    'job_advancement_book': '/assets/scroll.png'
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

// 获取职业等级显示格式
export const getJobLevelDisplay = (level: number, job: JobType): string => {
  const { JOB_NAMES, LEVEL_PREFIXES } = GAME_CONFIG.JOB_ADVANCEMENT;
  
  // 计算当前职业内的等级（1-4）
  const jobInternalLevel = ((level - 1) % 4) + 1;
  const levelPrefix = LEVEL_PREFIXES[jobInternalLevel as keyof typeof LEVEL_PREFIXES] || '初级';
  const jobName = JOB_NAMES[job] || '剑士';
  
  return `${levelPrefix}${jobName}`;
};

// 检查是否可以转职
export const canAdvanceJob = (level: number): boolean => {
  // 每4级需要转职，且等级是4的倍数时可以转职
  return level % 4 === 0 && level > 0;
};

// 获取下一个职业
export const getNextJob = (currentJob: JobType): JobType | null => {
  const jobOrder = [
    JobType.SWORDSMAN,
    JobType.GREAT_SWORDSMAN,
    JobType.TEMPLE_KNIGHT,
    JobType.DRAGON_KNIGHT,
    JobType.SWORD_MASTER,
    JobType.SWORD_GOD,
    JobType.PLANE_LORD
  ];
  
  const currentIndex = jobOrder.indexOf(currentJob);
  if (currentIndex >= 0 && currentIndex < jobOrder.length - 1) {
    return jobOrder[currentIndex + 1];
  }
  
  return null;
};

// 获取转职成功率
export const getJobAdvancementSuccessRate = (targetJob: JobType): number => {
  const { SUCCESS_RATES } = GAME_CONFIG.JOB_ADVANCEMENT;
  return SUCCESS_RATES[targetJob as keyof typeof SUCCESS_RATES] || 20;
};