import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateRandomEquipment, generateHealthPotion, generateRewardLevel, getEquipmentImage, getItemImage, getRarityColor } from '../utils/gameUtils';
import { RewardType } from '../types/game';
import TreasureBoxTimer from './TreasureBoxTimer';
import { GAME_CONFIG } from '../config/gameConfig';

const TreasureBox: React.FC = () => {
  const { player, buyTreasureBox, gainGold, updatePlayer } = useGameStore();
  const [openingBox, setOpeningBox] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [isClosing, setIsClosing] = useState(false);
  
  const handleOpenBox = () => {
    const currentBoxes = Array.isArray(player.treasureBoxes) ? player.treasureBoxes : [];
    if (currentBoxes.length <= 0 || openingBox) return;
    
    // 重置所有状态
    setOpeningBox(true);
    setShowSelection(false);
    setSelectedReward(null);
    setIsClosing(false);
    
    setTimeout(() => {
      // 获取第一个宝箱
      const treasureBox = currentBoxes[0];
      const boxLevel = treasureBox.level;
      
      // 根据宝箱等级确定奖励等级
      const rewardLevel = generateRewardLevel(boxLevel);
      
      // 生成可能的奖励选项
      const possibleRewards: any[] = [];
      
      // 金币奖励
      const goldAmount = GAME_CONFIG.GOLD_REWARDS.TREASURE_BOX_BASE + 
                        rewardLevel * GAME_CONFIG.GOLD_REWARDS.PER_LEVEL_BONUS + 
                        Math.floor(Math.random() * GAME_CONFIG.GOLD_REWARDS.RANDOM_RANGE);
      possibleRewards.push({ 
        type: RewardType.GOLD, 
        amount: goldAmount,
        description: `金币 +${goldAmount}`
      });
      
      // 装备奖励
      const equipment = generateRandomEquipment(player.level, rewardLevel);
      possibleRewards.push({ 
        type: RewardType.EQUIPMENT, 
        item: equipment,
        description: `装备: ${equipment.name}`
      });
      
      // 血瓶奖励
      const healthPotion = generateHealthPotion(rewardLevel);
      const potionAmount = Math.floor(Math.random() * 2) + 1;
      possibleRewards.push({ 
        type: RewardType.HEALTH_POTION, 
        item: healthPotion,
        amount: potionAmount,
        description: `${healthPotion.name} +${potionAmount}`
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
            stars: selectedReward.item.stars || 1,
            baseStats: selectedReward.item.baseStats || selectedReward.item.stats
          }];
          updatePlayer({ inventory: newInventory });
          break;
          
        case RewardType.HEALTH_POTION:
          const potionLevel = selectedReward.item.level;
          const existingPotionIndex = player.inventory.findIndex(
            item => item.type === 'health_potion' && item.level === potionLevel
          );
          
          if (existingPotionIndex >= 0) {
            const updatedInventory = [...player.inventory];
            updatedInventory[existingPotionIndex].quantity += selectedReward.amount;
            updatePlayer({ inventory: updatedInventory });
          } else {
            const newPotionItem = {
              id: selectedReward.item.id,
              name: selectedReward.item.name,
              type: 'health_potion' as any,
              quantity: selectedReward.amount,
              level: selectedReward.item.level,
              effect: selectedReward.item.effect
            };
            const newInventoryWithPotion = [...player.inventory, newPotionItem];
            updatePlayer({ inventory: newInventoryWithPotion });
          }
          break;
      }
      
      setSelectedReward(selectedReward);
      setShowSelection(true);
      // 移除第一个宝箱
      const newTreasureBoxes = currentBoxes.slice(1);
      updatePlayer({ treasureBoxes: newTreasureBoxes });
      setOpeningBox(false);
    }, 1000);
  };
  
  const handleBuyBox = () => {
    if (player.gold >= GAME_CONFIG.TREASURE_BOX.PURCHASE_COST) {
      buyTreasureBox();
    }
  };
  
  const handleCloseRewards = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowSelection(false);
      setSelectedReward(null);
      setIsClosing(false);
    }, 300); // 动画持续时间
  };
  
  
  return (
    <div className="treasure-box-panel">
      <h2>宝箱系统</h2>
      
      <TreasureBoxTimer />
      
      <div className="treasure-box-info">
        <p>拥有宝箱: {Array.isArray(player.treasureBoxes) ? player.treasureBoxes.length : 0}个</p>
        {Array.isArray(player.treasureBoxes) && player.treasureBoxes.length > 0 && (
          <p>下一个宝箱等级: {player.treasureBoxes[0].level}级</p>
        )}
        <p>每个宝箱提供随机奖励，等级越高奖励越好！</p>
      </div>
      
      <div className="treasure-box-actions">
        <button 
          onClick={handleOpenBox}
          disabled={(Array.isArray(player.treasureBoxes) ? player.treasureBoxes.length : 0) <= 0 || openingBox || showSelection}
          className="open-box-btn"
        >
          {openingBox ? '开启中...' : '开启宝箱'}
        </button>
        
        <button 
          onClick={handleBuyBox}
          disabled={player.gold < GAME_CONFIG.TREASURE_BOX.PURCHASE_COST}
          className="buy-box-btn"
        >
          购买宝箱 ({GAME_CONFIG.TREASURE_BOX.PURCHASE_COST}金币)
        </button>
      </div>
      
      {showSelection && selectedReward && (
        <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleCloseRewards}>
          <div className={`reward-modal ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
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
                      <span className="equipment-level">lv{selectedReward.item.level}</span>
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
          <li>每{GAME_CONFIG.TREASURE_BOX.AUTO_GAIN_INTERVAL}秒自动获得 1 个</li>
          <li>击杀怪物获得 1 个 (等级与森林层级对应)</li>
          <li>用金币购买 ({GAME_CONFIG.TREASURE_BOX.PURCHASE_COST}金币/个)</li>
        </ul>
      </div>
    </div>
  );
};

export default TreasureBox;