// 游戏配置文件 - 统一管理所有游戏设定值

export const GAME_CONFIG = {
  // 宝箱系统配置
  TREASURE_BOX: {
    // 自动获取宝箱的时间间隔（秒）
    AUTO_GAIN_INTERVAL: 20, // 20秒获得1个宝箱（调试用）
    // AUTO_GAIN_INTERVAL: 3600, // 1小时获得1个宝箱（正式版）
    
    // 最大离线宝箱积累数量
    MAX_OFFLINE_BOXES: 100,
    
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
    RECOVERY_INTERVAL: 20, // 1小时恢复1点体力
    
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
    GOLD: 1,     // 金币 17%
    BLOOD_POTION: 9,  // 血瓶 9%（原来10%减少为9%）
    PET_EGG: 3,   // 宠物蛋 3%
    JOB_ADVANCEMENT_BOOK: 17, // 转职书 1%
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
  },

  // 职业转职系统配置
  JOB_ADVANCEMENT: {
    // 转职成功率配置（百分比）
    SUCCESS_RATES: {
      'swordsman': 100,         // 默认职业：100%（不需要转职书）
      'great_swordsman': 80,    // 转职大剑士：80%
      'temple_knight': 60,      // 转职圣殿骑士：60%
      'dragon_knight': 40,      // 转职龙骑士：40%
      'sword_master': 20,       // 转职剑圣：20%
      'sword_god': 20,          // 转职剑神：20%（最低20%）
      'plane_lord': 20          // 转职位面领主：20%（最低20%）
    },
    
    // 每个等级段对应的职业
    LEVEL_TO_JOB: {
      1: 'swordsman',
      5: 'great_swordsman',
      9: 'temple_knight',
      13: 'dragon_knight',
      17: 'sword_master',
      21: 'sword_god',
      25: 'plane_lord'
    },
    
    // 职业对应的转职书等级范围
    JOB_BOOK_LEVELS: {
      'great_swordsman': [1, 2],      // 1-2级宝箱获得大剑士转职书
      'temple_knight': [3, 4],        // 3-4级宝箱获得圣殿骑士转职书
      'dragon_knight': [5, 6],        // 5-6级宝箱获得龙骑士转职书
      'sword_master': [7, 8],         // 7-8级宝箱获得剑圣转职书
      'sword_god': [9, 10],           // 9-10级宝箱获得剑神转职书
      'plane_lord': [11, 12]          // 11-12级宝箱获得位面领主转职书（如果有的话）
    },
    
    // 转职书名称
    BOOK_NAMES: {
      'swordsman': '剑士转职书',
      'great_swordsman': '大剑士转职书',
      'temple_knight': '圣殿骑士转职书',
      'dragon_knight': '龙骑士转职书',
      'sword_master': '剑圣转职书',
      'sword_god': '剑神转职书',
      'plane_lord': '位面领主转职书'
    },
    
    // 职业中文名称
    JOB_NAMES: {
      'swordsman': '剑士',
      'great_swordsman': '大剑士',
      'temple_knight': '圣殿骑士',
      'dragon_knight': '龙骑士',
      'sword_master': '剑圣',
      'sword_god': '剑神',
      'plane_lord': '位面领主'
    },
    
    // 等级前缀
    LEVEL_PREFIXES: {
      1: '初级',
      2: '中级',
      3: '高级',
      4: '顶级'
    }
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