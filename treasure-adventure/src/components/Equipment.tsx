import React from 'react';
import { useGameStore } from '../store/gameStore';
import  { EquipmentType } from '../types/game';

const Equipment: React.FC = () => {
  const { player, equipItem, unequipItem } = useGameStore();
  
  const equipmentSlots = [
    { key: 'helmet', name: '头盔', type: EquipmentType.HELMET },
    { key: 'armor', name: '衣服', type: EquipmentType.ARMOR },
    { key: 'shoes', name: '鞋子', type: EquipmentType.SHOES },
    { key: 'weapon', name: '武器', type: EquipmentType.WEAPON },
    { key: 'accessory', name: '配饰', type: EquipmentType.ACCESSORY }
  ];
  
  const getEquipmentForSlot = (type: EquipmentType) => {
    return player.inventory.filter(item => 
      item.type === 'equipment' && 
      (item as any).equipmentType === type
    );
  };
  
  return (
    <div className="equipment-panel">
      <h2>装备</h2>
      
      <div className="equipment-slots">
        {equipmentSlots.map(slot => {
          const equippedItem = player.equipment[slot.key as keyof typeof player.equipment];
          
          return (
            <div key={slot.key} className="equipment-slot">
              <label>{slot.name}</label>
              <div className="slot-content">
                {equippedItem ? (
                  <div className="equipped-item">
                    <span>{equippedItem.name}</span>
                    <div className="item-stats">
                      {equippedItem.stats.attack && <span>攻击+{equippedItem.stats.attack}</span>}
                      {equippedItem.stats.defense && <span>防御+{equippedItem.stats.defense}</span>}
                      {equippedItem.stats.health && <span>血量+{equippedItem.stats.health}</span>}
                      {equippedItem.stats.agility && <span>敏捷+{equippedItem.stats.agility}</span>}
                    </div>
                    <button onClick={() => unequipItem(slot.key)}>
                      卸下
                    </button>
                  </div>
                ) : (
                  <div className="empty-slot">
                    <span>空</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="inventory-equipment">
        <h3>背包装备</h3>
        <div className="equipment-list">
          {player.inventory
            .filter(item => item.type === 'equipment')
            .map(item => {
              const equipmentItem = item as any;
              return (
                <div key={item.id} className="inventory-equipment-item">
                  <span>{item.name}</span>
                  <div className="item-stats">
                    {equipmentItem.stats?.attack && <span>攻击+{equipmentItem.stats.attack}</span>}
                    {equipmentItem.stats?.defense && <span>防御+{equipmentItem.stats.defense}</span>}
                    {equipmentItem.stats?.health && <span>血量+{equipmentItem.stats.health}</span>}
                    {equipmentItem.stats?.agility && <span>敏捷+{equipmentItem.stats.agility}</span>}
                  </div>
                  <button onClick={() => equipItem(equipmentItem, equipmentItem.equipmentType)}>
                    装备
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Equipment;