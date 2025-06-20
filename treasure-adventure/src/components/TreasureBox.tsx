import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateRandomEquipment } from '../utils/gameUtils';
import type { RewardType } from '../types/game';

const TreasureBox: React.FC = () => {
  const { player, openTreasureBox, buyTreasureBox, gainExperience, gainGold, updatePlayer } = useGameStore();
  const [openingBox, setOpeningBox] = useState(false);
  const [lastRewards, setLastRewards] = useState<any[]>([]);
  
  const handleOpenBox = () => {
    if (player.treasureBoxes <= 0 || openingBox) return;
    
    setOpeningBox(true);
    
    setTimeout(() => {
      const numRewards = Math.floor(Math.random() * 4) + 1;
      const rewards: any[] = [];
      
      for (let i = 0; i < numRewards; i++) {
        const rewardType = Math.floor(Math.random() * 4);
        
        switch (rewardType) {
          case 0: // 经验
            const expAmount = 30 + Math.floor(Math.random() * 40);
            gainExperience(expAmount);
            rewards.push({ type: RewardType.EXPERIENCE, amount: expAmount });
            break;
            
          case 1: // 金币
            const goldAmount = 50 + Math.floor(Math.random() * 100);
            gainGold(goldAmount);
            rewards.push({ type: RewardType.GOLD, amount: goldAmount });
            break;
            
          case 2: // 装备
            const equipment = generateRandomEquipment(player.level);
            const newInventory = [...player.inventory, {
              id: equipment.id,
              name: equipment.name,
              type: 'equipment' as any,
              quantity: 1,
              equipmentType: equipment.type,
              stats: equipment.stats,
              rarity: equipment.rarity
            }];
            updatePlayer({ inventory: newInventory });
            rewards.push({ type: RewardType.EQUIPMENT, item: equipment });
            break;
            
          case 3: // 血瓶
            const healthPotion = {
              id: `health_potion_${Date.now()}_${i}`,
              name: '血瓶',
              type: 'health_potion' as any,
              quantity: Math.floor(Math.random() * 3) + 1,
              effect: { type: 'heal' as any, value: 50 }
            };
            
            const existingPotionIndex = player.inventory.findIndex(item => item.type === 'health_potion');
            if (existingPotionIndex >= 0) {
              const updatedInventory = [...player.inventory];
              updatedInventory[existingPotionIndex].quantity += healthPotion.quantity;
              updatePlayer({ inventory: updatedInventory });
            } else {
              const newInventoryWithPotion = [...player.inventory, healthPotion];
              updatePlayer({ inventory: newInventoryWithPotion });
            }
            
            rewards.push({ type: RewardType.HEALTH_POTION, amount: healthPotion.quantity });
            break;
        }
      }
      
      setLastRewards(rewards);
      updatePlayer({ treasureBoxes: player.treasureBoxes - 1 });
      setOpeningBox(false);
    }, 1000);
  };
  
  const handleBuyBox = () => {
    if (player.gold >= 200) {
      buyTreasureBox();
    }
  };
  
  const formatReward = (reward: any) => {
    switch (reward.type) {
      case RewardType.EXPERIENCE:
        return `经验 +${reward.amount}`;
      case RewardType.GOLD:
        return `金币 +${reward.amount}`;
      case RewardType.EQUIPMENT:
        return `装备: ${reward.item.name}`;
      case RewardType.HEALTH_POTION:
        return `血瓶 +${reward.amount}`;
      default:
        return '未知奖励';
    }
  };
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#808080';
      case 'uncommon': return '#00ff00';
      case 'rare': return '#0080ff';
      case 'epic': return '#8000ff';
      case 'legendary': return '#ff8000';
      default: return '#000000';
    }
  };
  
  return (
    <div className="treasure-box-panel">
      <h2>宝箱系统</h2>
      
      <div className="treasure-box-info">
        <p>拥有宝箱: {player.treasureBoxes}个</p>
        <p>每个宝箱包含 1-4 个随机奖励</p>
      </div>
      
      <div className="treasure-box-actions">
        <button 
          onClick={handleOpenBox}
          disabled={player.treasureBoxes <= 0 || openingBox}
          className="open-box-btn"
        >
          {openingBox ? '开启中...' : '开启宝箱'}
        </button>
        
        <button 
          onClick={handleBuyBox}
          disabled={player.gold < 200}
          className="buy-box-btn"
        >
          购买宝箱 (200金币)
        </button>
      </div>
      
      {lastRewards.length > 0 && (
        <div className="last-rewards">
          <h3>上次开箱奖励:</h3>
          <div className="rewards-list">
            {lastRewards.map((reward, index) => (
              <div 
                key={index} 
                className="reward-item"
                style={{ 
                  color: reward.type === RewardType.EQUIPMENT ? 
                    getRarityColor(reward.item?.rarity) : 
                    '#333' 
                }}
              >
                {formatReward(reward)}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="treasure-box-sources">
        <h3>宝箱获取方式:</h3>
        <ul>
          <li>每小时自动获得 1 个</li>
          <li>击杀怪物获得 1 个</li>
          <li>用金币购买 (200金币/个)</li>
        </ul>
      </div>
    </div>
  );
};

export default TreasureBox;