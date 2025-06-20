import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateRandomEquipment, getEquipmentImage, getItemImage, getRarityColor } from '../utils/gameUtils';
import { RewardType } from '../types/game';
import TreasureBoxTimer from './TreasureBoxTimer';

const TreasureBox: React.FC = () => {
  const { player, buyTreasureBox, gainGold, updatePlayer } = useGameStore();
  const [openingBox, setOpeningBox] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  
  const handleOpenBox = () => {
    if (player.treasureBoxes <= 0 || openingBox) return;
    
    // 重置所有状态
    setOpeningBox(true);
    setShowSelection(false);
    setSelectedReward(null);
    
    setTimeout(() => {
      // 生成可能的奖励选项
      const possibleRewards: any[] = [];
      
      // 金币奖励
      const goldAmount = 50 + Math.floor(Math.random() * 150);
      possibleRewards.push({ 
        type: RewardType.GOLD, 
        amount: goldAmount,
        description: `金币 +${goldAmount}`
      });
      
      // 装备奖励
      const equipment = generateRandomEquipment(player.level);
      possibleRewards.push({ 
        type: RewardType.EQUIPMENT, 
        item: equipment,
        description: `装备: ${equipment.name}`
      });
      
      // 血瓶奖励
      const potionAmount = Math.floor(Math.random() * 3) + 1;
      possibleRewards.push({ 
        type: RewardType.HEALTH_POTION, 
        amount: potionAmount,
        description: `血瓶 +${potionAmount}`
      });
      
      // 随机选择一个奖励
      const selectedReward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
      
      // 给予选中的奖励
      switch (selectedReward.type) {
        case RewardType.GOLD:
          gainGold(selectedReward.amount);
          break;
          
        case RewardType.EQUIPMENT:
          const newInventory = [...player.inventory, {
            id: selectedReward.item.id,
            name: selectedReward.item.name,
            type: 'equipment' as any,
            quantity: 1,
            equipmentType: selectedReward.item.type,
            stats: selectedReward.item.stats,
            rarity: selectedReward.item.rarity,
            level: selectedReward.item.level || 1,
            baseStats: selectedReward.item.baseStats || selectedReward.item.stats
          }];
          updatePlayer({ inventory: newInventory });
          break;
          
        case RewardType.HEALTH_POTION:
          const existingPotionIndex = player.inventory.findIndex(item => item.type === 'health_potion');
          if (existingPotionIndex >= 0) {
            const updatedInventory = [...player.inventory];
            updatedInventory[existingPotionIndex].quantity += selectedReward.amount;
            updatePlayer({ inventory: updatedInventory });
          } else {
            const newPotionItem = {
              id: `health_potion_${Date.now()}`,
              name: '血瓶',
              type: 'health_potion' as any,
              quantity: selectedReward.amount,
              effect: { type: 'heal' as any, value: 50 }
            };
            const newInventoryWithPotion = [...player.inventory, newPotionItem];
            updatePlayer({ inventory: newInventoryWithPotion });
          }
          break;
      }
      
      setSelectedReward(selectedReward);
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
  
  const handleCloseRewards = () => {
    setShowSelection(false);
    setSelectedReward(null);
  };
  
  
  return (
    <div className="treasure-box-panel">
      <h2>宝箱系统</h2>
      
      <TreasureBoxTimer />
      
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
      
      {showSelection && selectedReward && (
        <div className="modal-overlay" onClick={handleCloseRewards}>
          <div className="reward-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎉 获得奖励</h3>
              <button className="close-btn" onClick={handleCloseRewards}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="reward-content">
                <div className="reward-icon">
                  {selectedReward.type === RewardType.EQUIPMENT && (
                    <div 
                      className="reward-item-icon"
                      style={{ backgroundColor: getRarityColor(selectedReward.item.rarity) }}
                    >
                      <img 
                        src={getEquipmentImage(selectedReward.item.type)} 
                        alt={selectedReward.item.name}
                        style={{ width: '48px', height: '48px' }}
                      />
                    </div>
                  )}
                  {selectedReward.type === RewardType.HEALTH_POTION && (
                    <div className="reward-item-icon">
                      <img 
                        src={getItemImage('health_potion')} 
                        alt="血瓶"
                        style={{ width: '48px', height: '48px' }}
                      />
                      <span className="item-quantity">×{selectedReward.amount}</span>
                    </div>
                  )}
                  {selectedReward.type === RewardType.GOLD && (
                    <div className="reward-item-icon gold">
                      <span style={{ fontSize: '32px' }}>💰</span>
                      <span className="item-quantity">×{selectedReward.amount}</span>
                    </div>
                  )}
                </div>
                
                <div className="reward-details">
                  <span className="reward-description">{selectedReward.description}</span>
                  {selectedReward.type === RewardType.EQUIPMENT && (
                    <div className="equipment-stats">
                      <div className="rarity" style={{ color: getRarityColor(selectedReward.item.rarity) }}>
                        {selectedReward.item.rarity}
                      </div>
                      <div className="stats">
                        {selectedReward.item.stats.attack > 0 && <span>攻击+{selectedReward.item.stats.attack}</span>}
                        {selectedReward.item.stats.defense > 0 && <span>防御+{selectedReward.item.stats.defense}</span>}
                        {selectedReward.item.stats.health > 0 && <span>血量+{selectedReward.item.stats.health}</span>}
                        {selectedReward.item.stats.agility > 0 && <span>敏捷+{selectedReward.item.stats.agility}</span>}
                        {selectedReward.item.stats.criticalRate > 0 && <span>暴击率+{selectedReward.item.stats.criticalRate}%</span>}
                        {selectedReward.item.stats.criticalDamage > 0 && <span>暴击伤害+{selectedReward.item.stats.criticalDamage}%</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="confirm-btn"
                onClick={handleCloseRewards}
              >
                确定
              </button>
            </div>
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