import React, { useState } from 'react';
import type { EquipmentItem } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { getEquipmentImage, getRarityColor } from '../utils/gameUtils';

interface EquipmentModalProps {
  equipment: EquipmentItem | null;
  slot?: string;
  isOpen: boolean;
  onClose: () => void;
  isEquipped?: boolean;
}

const EquipmentModal: React.FC<EquipmentModalProps> = ({ 
  equipment, 
  slot, 
  isOpen, 
  onClose, 
  isEquipped = false 
}) => {
  const { equipItem, unequipItem, upgradeEquipment, player } = useGameStore();
  const [upgradeCount, setUpgradeCount] = useState(1);

  if (!isOpen || !equipment) return null;

  const handleEquip = () => {
    if (!isEquipped) {
      // 装备类型到槽位的映射
      const typeToSlot = {
        'helmet': 'helmet',
        'armor': 'armor', 
        'shoes': 'shoes',
        'weapon': 'weapon',
        'shield': 'shield',
        'accessory': 'accessory'
      };
      
      const actualEquipmentType = (equipment as any).equipmentType || equipment.type;
      const targetSlot = typeToSlot[actualEquipmentType as keyof typeof typeToSlot] || actualEquipmentType;
      equipItem(equipment, targetSlot);
    }
    onClose();
  };

  const handleUnequip = () => {
    if (isEquipped && slot) {
      unequipItem(slot);
    }
    onClose();
  };

  const handleUpgrade = () => {
    if (upgradeEquipment) {
      upgradeEquipment(equipment.id, upgradeCount);
    }
    onClose();
  };

  // 计算升级成本
  const upgradeCost = (equipment?.level || 1) * 100 * upgradeCount;
  const requiredMaterials = upgradeCount;
  const canAffordUpgrade = player.gold >= upgradeCost;
  
  // 查找背包中同类型同稀有度的装备作为材料
  const availableMaterials = equipment ? player.inventory.filter(item => 
    item.type === 'equipment' && 
    (item as any).equipmentType === equipment.type &&
    (item as any).rarity === equipment.rarity
  ).length : 0;
  
  const canUpgrade = canAffordUpgrade && availableMaterials >= requiredMaterials;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="equipment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{equipment.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="equipment-display">
            <div 
              className="equipment-icon large"
              style={{ backgroundColor: getRarityColor(equipment?.rarity || 'common') }}
            >
              <img 
                src={getEquipmentImage(equipment?.type || 'weapon')} 
                alt={equipment?.name || 'Equipment'}
                style={{ width: '64px', height: '64px' }}
              />
            </div>
            
            <div className="equipment-info">
              <div className="equipment-level">等级 {equipment?.level || 1}</div>
              <div className="equipment-rarity" style={{ color: getRarityColor(equipment?.rarity || 'common') }}>
                {equipment?.rarity || 'common'}
              </div>
            </div>
          </div>
          
          <div className="equipment-stats">
            <h4>属性</h4>
            <div className="stats-grid">
              {equipment.stats?.attack && <div>攻击: {equipment.stats.attack}</div>}
              {equipment.stats?.defense && <div>防御: {equipment.stats.defense}</div>}
              {equipment.stats?.health && <div>血量: {equipment.stats.health}</div>}
              {equipment.stats?.agility && <div>敏捷: {equipment.stats.agility}</div>}
              {equipment.stats?.criticalRate && <div>暴击率: {equipment.stats.criticalRate}%</div>}
              {equipment.stats?.criticalDamage && <div>暴击伤害: {equipment.stats.criticalDamage}%</div>}
            </div>
          </div>
          
          <div className="equipment-upgrade">
            <h4>升级</h4>
            <div className="upgrade-info">
              <div>升级费用: {upgradeCost} 金币</div>
              <div>需要材料: {requiredMaterials} 个同类装备</div>
              <div>可用材料: {availableMaterials} 个</div>
            </div>
            
            <div className="upgrade-controls">
              <label>升级次数:</label>
              <input 
                type="number" 
                min="1" 
                max="10" 
                value={upgradeCount}
                onChange={(e) => setUpgradeCount(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>
        </div>
        
        <div className="modal-actions">
          {!isEquipped && (
            <button 
              className="equip-btn" 
              onClick={handleEquip}
            >
              装备
            </button>
          )}
          
          {isEquipped && (
            <button 
              className="unequip-btn" 
              onClick={handleUnequip}
            >
              卸下
            </button>
          )}
          
          <button 
            className="upgrade-btn" 
            onClick={handleUpgrade}
            disabled={!canUpgrade}
          >
            升级
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentModal;