// 合约地址配置（自动生成）
export const CONTRACT_ADDRESSES = {
  // 本地测试网络地址（从 packages/hardhat/deploymentsV2.json 自动更新）
  PLAYER_NFT: '0x4A679253410272dd5232B3Ff7cF5dbB88f295319' as `0x${string}`,
  EQUIPMENT_NFT: '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f' as `0x${string}`,
  GOLD_TOKEN: '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44' as `0x${string}`,
  TREASURE_BOX_SYSTEM: '0x7a2088a1bFc9d81c55368AE168C2C02570cB814F' as `0x${string}`,
  BATTLE_SYSTEM: '0x09635F643e140090A9A8Dcd712eD6285858ceBef' as `0x${string}`,
  EQUIPMENT_SYSTEM: '0xc5a5C42992dECbae36851359345FE25997F5C42d' as `0x${string}`
} as const;

// =============================================================================
// 合约 ABI 定义（自动生成）
// =============================================================================

// Player 合约 ABI
export const PLAYER_NFT_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "equipmentId",
        "type": "uint256"
      }
    ],
    "name": "addEquipmentToInventory",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authorizedSystems",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "staminaCost",
        "type": "uint8"
      }
    ],
    "name": "canBattle",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "equipmentId",
        "type": "uint256"
      }
    ],
    "name": "equipItem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "equipmentNFT",
    "outputs": [
      {
        "internalType": "contract Equipment",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "name": "equipmentTypeToSlot",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "name": "equippedItems",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getApproved",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "getEquippedItems",
    "outputs": [
      {
        "internalType": "uint256[8]",
        "name": "",
        "type": "uint256[8]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "getPlayer",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "uint16",
            "name": "level",
            "type": "uint16"
          },
          {
            "internalType": "uint32",
            "name": "experience",
            "type": "uint32"
          },
          {
            "internalType": "uint16",
            "name": "health",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "maxHealth",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "attack",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "defense",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "agility",
            "type": "uint16"
          },
          {
            "internalType": "uint8",
            "name": "criticalRate",
            "type": "uint8"
          },
          {
            "internalType": "uint16",
            "name": "criticalDamage",
            "type": "uint16"
          },
          {
            "internalType": "uint8",
            "name": "stamina",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "maxStamina",
            "type": "uint8"
          },
          {
            "internalType": "uint32",
            "name": "lastStaminaTime",
            "type": "uint32"
          },
          {
            "internalType": "uint16",
            "name": "currentForestLevel",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "currentForestProgress",
            "type": "uint16"
          },
          {
            "internalType": "uint256",
            "name": "lastTreasureBoxTime",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "initialized",
            "type": "bool"
          },
          {
            "internalType": "uint8",
            "name": "job",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "goldBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256[]",
            "name": "inventory",
            "type": "uint256[]"
          }
        ],
        "internalType": "struct GameStructs.Player",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "getPlayerGold",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "getPlayerInventory",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "getPlayerTotalStats",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "totalAttack",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "totalDefense",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "totalAgility",
        "type": "uint16"
      },
      {
        "internalType": "uint8",
        "name": "totalCritRate",
        "type": "uint8"
      },
      {
        "internalType": "uint16",
        "name": "totalCritDamage",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "goldToken",
    "outputs": [
      {
        "internalType": "contract AdventureGold",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "equipmentId",
        "type": "uint256"
      }
    ],
    "name": "hasEquipmentInInventory",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      },
      {
        "internalType": "uint16",
        "name": "amount",
        "type": "uint16"
      }
    ],
    "name": "heal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "levelUp",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "onERC721Received",
    "outputs": [
      {
        "internalType": "bytes4",
        "name": "",
        "type": "bytes4"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "players",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint16",
        "name": "level",
        "type": "uint16"
      },
      {
        "internalType": "uint32",
        "name": "experience",
        "type": "uint32"
      },
      {
        "internalType": "uint16",
        "name": "health",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "maxHealth",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "attack",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "defense",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "agility",
        "type": "uint16"
      },
      {
        "internalType": "uint8",
        "name": "criticalRate",
        "type": "uint8"
      },
      {
        "internalType": "uint16",
        "name": "criticalDamage",
        "type": "uint16"
      },
      {
        "internalType": "uint8",
        "name": "stamina",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "maxStamina",
        "type": "uint8"
      },
      {
        "internalType": "uint32",
        "name": "lastStaminaTime",
        "type": "uint32"
      },
      {
        "internalType": "uint16",
        "name": "currentForestLevel",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "currentForestProgress",
        "type": "uint16"
      },
      {
        "internalType": "uint256",
        "name": "lastTreasureBoxTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "initialized",
        "type": "bool"
      },
      {
        "internalType": "uint8",
        "name": "job",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "goldBalance",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "registerPlayer",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "equipmentId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      }
    ],
    "name": "removeEquipmentFromInventory",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenByIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "slot",
        "type": "uint8"
      }
    ],
    "name": "unequipItem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "updateLastTreasureBoxTime",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "updateStamina",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// BattleSystemV2 合约 ABI
export const BATTLE_SYSTEM_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "staminaCost",
        "type": "uint8"
      }
    ],
    "name": "canBattle",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      },
      {
        "internalType": "uint16",
        "name": "experienceGained",
        "type": "uint16"
      },
      {
        "internalType": "uint8",
        "name": "staminaCost",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "victory",
        "type": "bool"
      },
      {
        "internalType": "uint8",
        "name": "monsterLevel",
        "type": "uint8"
      }
    ],
    "name": "completeBattle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "getBattleStats",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "totalBattlesCount",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "totalVictoriesCount",
        "type": "uint32"
      },
      {
        "internalType": "uint8",
        "name": "winRate",
        "type": "uint8"
      },
      {
        "internalType": "uint32",
        "name": "lastBattle",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "lastBattleTime",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "playerNFT",
    "outputs": [
      {
        "internalType": "contract Player",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "totalBattles",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "totalVictories",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasureBoxSystem",
    "outputs": [
      {
        "internalType": "contract TreasureBoxSystem",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// AdventureGold 合约 ABI
export const GOLD_TOKEN_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// TreasureBoxSystem 合约 ABI
export const TREASURE_BOX_SYSTEM_ABI = [
  {
    "inputs": [],
    "name": "COMMON_RARITY",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "CURRENT_LEVEL_PROBABILITY",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "EPIC_RARITY",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "GOLD_PROBABILITY",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "HEALTH_POTION_PROBABILITY",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "JOB_BOOK_PROBABILITY",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "LEGENDARY_RARITY",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "NEXT_LEVEL_PROBABILITY",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PET_EGG_PROBABILITY",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "RARE_RARITY",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "UNCOMMON_RARITY",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authorizedSystems",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "claimOfflineTreasureBoxes",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "equipmentNFT",
    "outputs": [
      {
        "internalType": "contract Equipment",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "getClaimableOfflineBoxes",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "boxIndex",
        "type": "uint256"
      }
    ],
    "name": "getPlayerTreasureBox",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "rarity",
            "type": "uint8"
          },
          {
            "internalType": "uint32",
            "name": "createdTime",
            "type": "uint32"
          },
          {
            "internalType": "bool",
            "name": "opened",
            "type": "bool"
          }
        ],
        "internalType": "struct TreasureBoxSystem.TreasureBox",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "getPlayerTreasureBoxCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "getPlayerTreasureBoxes",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "rarity",
            "type": "uint8"
          },
          {
            "internalType": "uint32",
            "name": "createdTime",
            "type": "uint32"
          },
          {
            "internalType": "bool",
            "name": "opened",
            "type": "bool"
          }
        ],
        "internalType": "struct TreasureBoxSystem.TreasureBox[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "getUnopenedBoxCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "goldToken",
    "outputs": [
      {
        "internalType": "contract AdventureGold",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "boxIndex",
        "type": "uint256"
      }
    ],
    "name": "openTreasureBox",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "rewardType",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "goldAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256[]",
            "name": "equipmentIds",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256",
            "name": "itemId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "itemName",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "itemLevel",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "healAmount",
            "type": "uint256"
          }
        ],
        "internalType": "struct TreasureBoxSystem.BoxReward",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "playerNFT",
    "outputs": [
      {
        "internalType": "contract Player",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "playerTreasureBoxes",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "rarity",
        "type": "uint8"
      },
      {
        "internalType": "uint32",
        "name": "createdTime",
        "type": "uint32"
      },
      {
        "internalType": "bool",
        "name": "opened",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// EquipmentSystem 合约 ABI
export const EQUIPMENT_SYSTEM_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "name": "enhanceConfigs",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "goldCost",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "successRate",
        "type": "uint8"
      },
      {
        "internalType": "uint16",
        "name": "statBonus",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "enhanceEquipment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "equipmentEnhanceLevel",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "equipmentNFT",
    "outputs": [
      {
        "internalType": "contract Equipment",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getEquipmentFullData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "equipmentType",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "stars",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "rarity",
            "type": "uint8"
          },
          {
            "internalType": "uint16",
            "name": "attack",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "defense",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "agility",
            "type": "uint16"
          },
          {
            "internalType": "uint8",
            "name": "criticalRate",
            "type": "uint8"
          },
          {
            "internalType": "uint16",
            "name": "criticalDamage",
            "type": "uint16"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          }
        ],
        "internalType": "struct Equipment.EquipmentData",
        "name": "equipmentData",
        "type": "tuple"
      },
      {
        "internalType": "uint8",
        "name": "enhanceLevel",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "nextEnhanceCost",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "nextStarCost",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "goldToken",
    "outputs": [
      {
        "internalType": "contract AdventureGold",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "name": "starConfigs",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "goldCost",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "successRate",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "maxLevel",
        "type": "uint8"
      },
      {
        "internalType": "uint16",
        "name": "statMultiplier",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "upgradeStars",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Equipment 合约 ABI
export const EQUIPMENT_NFT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "equipmentData",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "equipmentType",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "stars",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "rarity",
        "type": "uint8"
      },
      {
        "internalType": "uint16",
        "name": "attack",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "defense",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "agility",
        "type": "uint16"
      },
      {
        "internalType": "uint8",
        "name": "criticalRate",
        "type": "uint8"
      },
      {
        "internalType": "uint16",
        "name": "criticalDamage",
        "type": "uint16"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getApproved",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getEquipment",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "equipmentType",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "stars",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "rarity",
            "type": "uint8"
          },
          {
            "internalType": "uint16",
            "name": "attack",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "defense",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "agility",
            "type": "uint16"
          },
          {
            "internalType": "uint8",
            "name": "criticalRate",
            "type": "uint8"
          },
          {
            "internalType": "uint16",
            "name": "criticalDamage",
            "type": "uint16"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          }
        ],
        "internalType": "struct Equipment.EquipmentData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenByIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalTokens",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

