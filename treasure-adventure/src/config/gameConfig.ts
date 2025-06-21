// 游戏配置文件 - 统一管理所有游戏设定值

export const GAME_CONFIG = {
  // 宝箱系统配置
  TREASURE_BOX: {
    // 自动获取宝箱的时间间隔（秒）
    AUTO_GAIN_INTERVAL: 20, // 20秒获得1个宝箱（调试用）
    // AUTO_GAIN_INTERVAL: 3600, // 1小时获得1个宝箱（正式版）
    
    // 最大离线宝箱积累数量
    MAX_OFFLINE_BOXES: 24,
    
    // 购买宝箱的金币价格
    PURCHASE_COST: 200,
    
    // 宝箱等级概率设定
    CURRENT_LEVEL_PROBABILITY: 0.95, // 95%概率获得当前等级奖励
    NEXT_LEVEL_PROBABILITY: 0.05,    // 5%概率获得下一级奖励
    
    // 宝箱等级范围
    MIN_LEVEL: 1,
    MAX_LEVEL: 10
  },

  // 装备系统配置
  EQUIPMENT: {
    // 装备星级范围
    MIN_STARS: 0,
    MAX_STARS: 5,
    
    // 装备等级范围
    MIN_LEVEL: 1,
    MAX_LEVEL: 10,
    
    // 升星费用基数
    UPGRADE_BASE_COST: 100,
    
    // 升星成功率配置（百分比）
    UPGRADE_SUCCESS_RATES: {
      0: 100, // 0星升1星：90%成功率
      1: 80, // 1星升2星：80%成功率
      2: 60, // 2星升3星：70%成功率
      3: 40, // 3星升4星：60%成功率
      4: 20  // 4星升5星：50%成功率
    }
  },

  // 血瓶系统配置
  HEALTH_POTION: {
    // 基础治疗量
    BASE_HEAL_AMOUNT: 50,
    
    // 每级增加的治疗量
    HEAL_AMOUNT_PER_LEVEL: 25,
    
    // 血瓶等级范围
    MIN_LEVEL: 1,
    MAX_LEVEL: 10
  },

  // 体力系统配置
  STAMINA: {
    // 最大体力值
    MAX_STAMINA: 24,
    
    // 体力恢复间隔（秒）
    RECOVERY_INTERVAL: 3600, // 1小时恢复1点体力
    
    // 战斗消耗体力
    BATTLE_COST: 1
  },

  // 森林系统配置
  FOREST: {
    // 森林总层数
    MAX_LEVELS: 10,
    
    // 每层怪物数量
    MONSTERS_PER_LEVEL: 10
  },

  // 金币奖励配置
  GOLD_REWARDS: {
    // 宝箱金币基础奖励
    TREASURE_BOX_BASE: 50,
    
    // 每级额外金币
    PER_LEVEL_BONUS: 25,
    
    // 随机金币范围
    RANDOM_RANGE: 50
  },

  // 宝箱奖励概率配置
  TREASURE_BOX_PROBABILITIES: {
    GOLD: 20,     // 金币 20%
    BLOOD_POTION: 7,  // 血瓶 7%
    PET_EGG: 3,   // 宠物蛋 3%
    // 装备 70% (7种装备类型，每种10%)
    // 剩余概率自动分配给装备
  },

  // 稀有度概率配置
  RARITY_PROBABILITIES: {
    COMMON: 60,     // 普通 60%
    UNCOMMON: 23,   // 非凡 23%
    RARE: 10,       // 稀有 10%
    EPIC: 5,        // 史诗 5%
    LEGENDARY: 2    // 传说 2%
  }
} as const;

// 导出常用的配置值
export const {
  TREASURE_BOX: TREASURE_BOX_CONFIG,
  EQUIPMENT: EQUIPMENT_CONFIG,
  HEALTH_POTION: HEALTH_POTION_CONFIG,
  STAMINA: STAMINA_CONFIG,
  FOREST: FOREST_CONFIG,
  GOLD_REWARDS: GOLD_REWARDS_CONFIG
} = GAME_CONFIG;