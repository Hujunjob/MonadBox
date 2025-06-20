import React from 'react';
import { useGameStore } from '../store/gameStore';
import { calculatePlayerStats } from '../utils/gameUtils';

const Inventory: React.FC = () => {
  const { player, useHealthPotion, equipItem } = useGameStore();
  
  // 按类型分组物品
  const healthPotions = player.inventory.filter(item => item.type === 'health_potion');
  const equipment = player.inventory.filter(item => item.type === 'equipment');
  const otherItems = player.inventory.filter(item => 
    item.type !== 'health_potion' && item.type !== 'equipment'
  );
  
  // 计算玩家实际属性（包括装备加成）
  const stats = calculatePlayerStats(player);
  const isHealthFull = player.health >= stats.maxHealth;
  
  const handleUsePotion = () => {
    if (isHealthFull) {
      alert('血量已满，无需使用血瓶！');
      return;
    }
    
    useHealthPotion();
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
    <div className="inventory-panel">
      <h2>背包</h2>
      
      {/* 血瓶区域 */}
      <div className="inventory-section">
        <h3>消耗品</h3>
        <div className="items-grid">
          {healthPotions.map(item => (
            <div key={item.id} className="inventory-item consumable">
              <div className="item-info">
                <span className="item-name">{item.name}</span>
                <span className="item-quantity">×{item.quantity}</span>
                <span className="item-effect">恢复 {item.effect?.value || 50} 血量</span>
              </div>
              <button 
                onClick={handleUsePotion}
                className="use-item-btn"
                disabled={item.quantity <= 0 || isHealthFull}
              >
                {isHealthFull ? '血量已满' : '使用'}
              </button>
            </div>
          ))}
          {healthPotions.length === 0 && (
            <div className="empty-slot">
              <span>没有消耗品</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 装备区域 */}
      <div className="inventory-section">
        <h3>装备</h3>
        <div className="items-grid">
          {equipment.map(item => {
            const equipmentItem = item as any;
            return (
              <div key={item.id} className="inventory-item equipment">
                <div className="item-info">
                  <span 
                    className="item-name"
                    style={{ color: getRarityColor(equipmentItem.rarity) }}
                  >
                    {item.name}
                  </span>
                  <div className="item-stats">
                    {equipmentItem.stats?.attack && <span>攻击+{equipmentItem.stats.attack}</span>}
                    {equipmentItem.stats?.defense && <span>防御+{equipmentItem.stats.defense}</span>}
                    {equipmentItem.stats?.health && <span>血量+{equipmentItem.stats.health}</span>}
                    {equipmentItem.stats?.agility && <span>敏捷+{equipmentItem.stats.agility}</span>}
                  </div>
                  <span className="item-type">类型: {equipmentItem.equipmentType}</span>
                </div>
                <button 
                  onClick={() => equipItem(equipmentItem, equipmentItem.equipmentType)}
                  className="use-item-btn"
                >
                  装备
                </button>
              </div>
            );
          })}
          {equipment.length === 0 && (
            <div className="empty-slot">
              <span>没有装备</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 其他物品 */}
      {otherItems.length > 0 && (
        <div className="inventory-section">
          <h3>其他物品</h3>
          <div className="items-grid">
            {otherItems.map(item => (
              <div key={item.id} className="inventory-item other">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">×{item.quantity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="inventory-summary">
        <p>背包空间: {player.inventory.length}/50</p>
      </div>
    </div>
  );
};

export default Inventory;