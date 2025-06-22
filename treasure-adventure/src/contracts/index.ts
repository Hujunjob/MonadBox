// 合约地址配置
export const CONTRACT_ADDRESSES = {
  // 本地测试网络地址（最新部署）
  TREASURE_ADVENTURE: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  GOLD_TOKEN: '0x75537828f2ce51be7289709686A69CbFDbB714F1',
  EQUIPMENT_NFT: '0xE451980132E65465d0a498c53f0b5227326Dd73F'
};

// 简化的 ABI，只包含前端需要的函数
export const TREASURE_ADVENTURE_ABI = [
  {
    "inputs": [{"internalType": "string","name": "name","type": "string"}],
    "name": "registerPlayer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint16","name": "experienceGained","type": "uint16"},
      {"internalType": "uint256","name": "goldGained","type": "uint256"},
      {"internalType": "uint8","name": "staminaCost","type": "uint8"}
    ],
    "name": "completeBattle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256","name": "tokenId","type": "uint256"},
      {"internalType": "uint8","name": "slot","type": "uint8"}
    ],
    "name": "equipItem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimTreasureBoxes",
    "outputs": [{"internalType": "uint8","name": "","type": "uint8"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "updateStamina",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "playerAddress","type": "address"}],
    "name": "getPlayer",
    "outputs": [
      {
        "components": [
          {"internalType": "string","name": "name","type": "string"},
          {"internalType": "uint16","name": "level","type": "uint16"},
          {"internalType": "uint32","name": "experience","type": "uint32"},
          {"internalType": "uint16","name": "health","type": "uint16"},
          {"internalType": "uint16","name": "maxHealth","type": "uint16"},
          {"internalType": "uint16","name": "attack","type": "uint16"},
          {"internalType": "uint16","name": "defense","type": "uint16"},
          {"internalType": "uint16","name": "agility","type": "uint16"},
          {"internalType": "uint8","name": "criticalRate","type": "uint8"},
          {"internalType": "uint16","name": "criticalDamage","type": "uint16"},
          {"internalType": "uint8","name": "stamina","type": "uint8"},
          {"internalType": "uint8","name": "maxStamina","type": "uint8"},
          {"internalType": "uint32","name": "lastStaminaTime","type": "uint32"},
          {"internalType": "uint16","name": "currentForestLevel","type": "uint16"},
          {"internalType": "uint16","name": "currentForestProgress","type": "uint16"},
          {"internalType": "uint32","name": "lastTreasureBoxTime","type": "uint32"},
          {"internalType": "bool","name": "initialized","type": "bool"},
          {"internalType": "uint8","name": "job","type": "uint8"}
        ],
        "internalType": "struct TreasureAdventure.Player",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "playerAddress","type": "address"}],
    "name": "getGoldBalance",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "playerAddress","type": "address"}],
    "name": "getEquippedItems",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256","name": "helmet","type": "uint256"},
          {"internalType": "uint256","name": "armor","type": "uint256"},
          {"internalType": "uint256","name": "shoes","type": "uint256"},
          {"internalType": "uint256","name": "weapon","type": "uint256"},
          {"internalType": "uint256","name": "shield","type": "uint256"},
          {"internalType": "uint256","name": "accessory","type": "uint256"},
          {"internalType": "uint256","name": "ring","type": "uint256"},
          {"internalType": "uint256","name": "pet","type": "uint256"}
        ],
        "internalType": "struct TreasureAdventure.EquippedItems",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const GOLD_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address","name": "account","type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;