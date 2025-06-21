import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getEquipmentImage, getItemImage, getRarityColor } from '../utils/gameUtils';
import EquipmentModal from './EquipmentModal';
import ItemModal from './ItemModal';

const Inventory: React.FC = () => {
  const { player } = useGameStore();
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  
  // 按类型分组物品
  const healthPotions = player.inventory.filter(item => item.type === 'health_potion');
  const equipment = player.inventory.filter(item => item.type === 'equipment');
  const otherItems = player.inventory.filter(item => 
    item.type !== 'health_potion' && item.type !== 'equipment'
  );
  
  const handleEquipmentClick = (equipment: any) => {
    setSelectedEquipment(equipment);
    setIsEquipmentModalOpen(true);
  };

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setIsItemModalOpen(true);
  };

  const handleCloseEquipmentModal = () => {
    setIsEquipmentModalOpen(false);
    setSelectedEquipment(null);
  };

  const handleCloseItemModal = () => {
    setIsItemModalOpen(false);
    setSelectedItem(null);
  };
  
  return (
    <div className="inventory-panel">
      <h2>背包</h2>
      
      {/* 血瓶区域 */}
      <div className="inventory-section">
        <h3>消耗品</h3>
        <div className="items-grid">
          {healthPotions.map(item => (
            <div 
              key={item.id} 
              className="inventory-item consumable clickable"
              onClick={() => handleItemClick(item)}
            >
              <div className="item-display">
                <img 
                  src={getItemImage('health_potion')} 
                  alt={item.name}
                  style={{ width: '32px', height: '32px' }}
                />
                <span className="item-level">lv{item.level || 1}</span>
                <span className="item-quantity">×{item.quantity}</span>
              </div>
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
              <div 
                key={item.id} 
                className="inventory-item equipment clickable"
                style={{ backgroundColor: getRarityColor(equipmentItem.rarity) }}
                onClick={() => handleEquipmentClick(equipmentItem)}
              >
                <div className="item-display">
                  <img 
                    src={getEquipmentImage(equipmentItem.equipmentType || equipmentItem.type)} 
                    alt={item.name}
                    style={{ width: '32px', height: '32px' }}
                  />
                  <span className="equipment-level">lv{equipmentItem.level || 1}</span>
                </div>
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

      <EquipmentModal
        equipment={selectedEquipment}
        isOpen={isEquipmentModalOpen}
        onClose={handleCloseEquipmentModal}
        isEquipped={false}
      />

      <ItemModal
        item={selectedItem}
        isOpen={isItemModalOpen}
        onClose={handleCloseItemModal}
      />
    </div>
  );
};

export default Inventory;