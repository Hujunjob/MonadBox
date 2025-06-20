import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateRandomEquipment } from '../utils/gameUtils';
import { RewardType } from '../types/game';

const TreasureBox: React.FC = () => {
  const { player, buyTreasureBox, gainExperience, gainGold, updatePlayer } = useGameStore();
  const [openingBox, setOpeningBox] = useState(false);
  const [rewardOptions, setRewardOptions] = useState<any[]>([]);
  const [showSelection, setShowSelection] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  
  const handleOpenBox = () => {
    if (player.treasureBoxes <= 0 || openingBox) return;
    
    // 重置所有状态
    setOpeningBox(true);
    setShowSelection(false);
    setSelectedReward(null);
    setRewardOptions([]);
    
    setTimeout(() => {
      // 生成4个不同的奖励选项
      const rewards: any[] = [];
      
      // 经验奖励
      const expAmount = 30 + Math.floor(Math.random() * 70);
      rewards.push({ 
        type: RewardType.EXPERIENCE, 
        amount: expAmount,
        description: `经验 +${expAmount}`
      });
      
      // 金币奖励
      const goldAmount = 50 + Math.floor(Math.random() * 150);
      rewards.push({ 
        type: RewardType.GOLD, 
        amount: goldAmount,
        description: `金币 +${goldAmount}`
      });
      
      // 装备奖励
      const equipment = generateRandomEquipment(player.level);
      rewards.push({ 
        type: RewardType.EQUIPMENT, 
        item: equipment,
        description: `装备: ${equipment.name}`
      });
      
      // 血瓶奖励
      const potionAmount = Math.floor(Math.random() * 3) + 1;
      rewards.push({ 
        type: RewardType.HEALTH_POTION, 
        amount: potionAmount,
        description: `血瓶 +${potionAmount}`
      });
      
      setRewardOptions(rewards);
      setShowSelection(true);
      updatePlayer({ treasureBoxes: player.treasureBoxes - 1 });
      setOpeningBox(false);
    }, 1000);
  };
  
  const handleBuyBox = () => {
    if (player.gold >= 200) {
      buyTreasureBox();
    }
  };
  
  const handleSelectReward = (reward: any) => {
    switch (reward.type) {
      case RewardType.EXPERIENCE:
        gainExperience(reward.amount);
        break;
        
      case RewardType.GOLD:
        gainGold(reward.amount);
        break;
        
      case RewardType.EQUIPMENT:
        const newInventory = [...player.inventory, {
          id: reward.item.id,
          name: reward.item.name,
          type: 'equipment' as any,
          quantity: 1,
          equipmentType: reward.item.type,
          stats: reward.item.stats,
          rarity: reward.item.rarity
        }];
        updatePlayer({ inventory: newInventory });
        break;
        
      case RewardType.HEALTH_POTION:
        const existingPotionIndex = player.inventory.findIndex(item => item.type === 'health_potion');
        if (existingPotionIndex >= 0) {
          const updatedInventory = [...player.inventory];
          updatedInventory[existingPotionIndex].quantity += reward.amount;
          updatePlayer({ inventory: updatedInventory });
        } else {
          const newPotionItem = {
            id: `health_potion_${Date.now()}`,
            name: '血瓶',
            type: 'health_potion' as any,
            quantity: reward.amount,
            effect: { type: 'heal' as any, value: 50 }
          };
          const newInventoryWithPotion = [...player.inventory, newPotionItem];
          updatePlayer({ inventory: newInventoryWithPotion });
        }
        break;
    }
    
    setSelectedReward(reward);
    setShowSelection(false);
    // 清除奖励选项，为下次开箱做准备
    setRewardOptions([]);
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
        <p>每个宝箱提供4个奖励选项，你可以选择其中1个</p>
      </div>
      
      <div className="treasure-box-actions">
        <button 
          onClick={handleOpenBox}
          disabled={player.treasureBoxes <= 0 || openingBox || showSelection}
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
      
      {showSelection && (
        <div className="reward-selection">
          <h3>选择你的奖励 (只能选择1个):</h3>
          <div className="reward-options">
            {rewardOptions.map((reward, index) => (
              <div 
                key={index} 
                className="reward-option"
                onClick={() => handleSelectReward(reward)}
              >
                <div className="reward-content">
                  <span className="reward-description">{reward.description}</span>
                  {reward.type === RewardType.EQUIPMENT && (
                    <div className="equipment-stats">
                      <div className="rarity" style={{ color: getRarityColor(reward.item.rarity) }}>
                        {reward.item.rarity}
                      </div>
                      <div className="stats">
                        {reward.item.stats.attack && <span>攻击+{reward.item.stats.attack}</span>}
                        {reward.item.stats.defense && <span>防御+{reward.item.stats.defense}</span>}
                        {reward.item.stats.health && <span>血量+{reward.item.stats.health}</span>}
                        {reward.item.stats.agility && <span>敏捷+{reward.item.stats.agility}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {selectedReward && (
        <div className="selected-reward">
          <h3>你选择了:</h3>
          <div 
            className="reward-item selected"
            style={{ 
              color: selectedReward.type === RewardType.EQUIPMENT ? 
                getRarityColor(selectedReward.item?.rarity) : 
                '#333' 
            }}
          >
            {selectedReward.description}
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