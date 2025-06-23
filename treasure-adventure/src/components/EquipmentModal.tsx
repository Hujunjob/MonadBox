import React from 'react';
import type { EquipmentItem } from '../types/game';
import { getEquipmentImage, getRarityColor } from '../utils/gameUtils';
import { GAME_CONFIG } from '../config/gameConfig';
import { useToast } from './ToastManager';

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
  const { equipItem, unequipItem, upgradeEquipmentStars, player } = useGameStore();
  const { showToast } = useToast();
  const [upgradeResult, setUpgradeResult] = React.useState<{success: boolean; newStars: number; message: string} | null>(null);
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  if (!isOpen || !equipment) return null;

  // 从store中获取最新的装备数据，确保响应式更新
  const getCurrentEquipment = () => {
    if (!equipment) return null;
    
    // 如果是已装备的装备，从装备槽中获取最新数据
    if (isEquipped && slot) {
      return player.equipment[slot as keyof typeof player.equipment] || equipment;
    }
    
    // 如果是背包中的装备，从背包中获取最新数据
    const inventoryItem = player.inventory.find(item => item.id === equipment.id);
    if (inventoryItem && inventoryItem.type === 'equipment') {
      return inventoryItem as any;
    }
    
    // 如果都找不到，返回原始装备数据
    return equipment;
  };

  const currentEquipment = getCurrentEquipment();

  const handleEquip = () => {
    if (!isEquipped) {
      // 装备类型到槽位的映射
      const typeToSlot = {
        'helmet': 'helmet',
        'armor': 'armor', 
        'shoes': 'shoes',
        'weapon': 'weapon',
        'shield': 'shield',
        'accessory': 'accessory',
        'ring': 'ring'
      };
      
      const actualEquipmentType = (currentEquipment as any).equipmentType || currentEquipment.type;
      const targetSlot = typeToSlot[actualEquipmentType as keyof typeof typeToSlot] || actualEquipmentType;
      equipItem(currentEquipment, targetSlot);
      
      // 显示装备成功提示
      showToast(`装备成功：${currentEquipment?.name}`, 'success');
    }
    onClose();
  };

  const handleUnequip = () => {
    if (isEquipped && slot) {
      unequipItem(slot);
    }
    onClose();
  };

  const handleUpgrade = async () => {
    if (!upgradeEquipmentStars || !currentEquipment) return;
    
    setIsUpgrading(true);
    try {
      const result = await upgradeEquipmentStars(currentEquipment.id);
      setUpgradeResult(result);
    } catch (error) {
      setUpgradeResult({ success: false, newStars: currentEquipment.stars || 0, message: '升星失败' });
    }
    setIsUpgrading(false);
  };

  // 计算升星成本和成功率
  const currentStars = currentEquipment?.stars || 0;
  const upgradeCost = (currentEquipment?.level || 1) * 100;
  const requiredMaterials = currentStars + 1; // 升到下一星级需要的材料数 = 当前星级 + 1
  const canAffordUpgrade = player.gold >= upgradeCost;
  const canUpgradeStars = currentStars < 5;
  
  // 查找背包中同类型同稀有度同等级的装备作为材料
  const availableMaterials = currentEquipment ? player.inventory.filter(item => 
    item.type === 'equipment' && 
    (item as any).equipmentType === currentEquipment.type &&
    (item as any).rarity === currentEquipment.rarity &&
    (item as any).level === currentEquipment.level &&
    item.id !== currentEquipment.id
  ).length : 0;
  
  // 从配置文件获取成功率
  const successRate = GAME_CONFIG.EQUIPMENT.UPGRADE_SUCCESS_RATES[currentStars as keyof typeof GAME_CONFIG.EQUIPMENT.UPGRADE_SUCCESS_RATES] || 50;
  
  const canUpgrade = canAffordUpgrade && availableMaterials >= requiredMaterials && canUpgradeStars;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="equipment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{currentEquipment.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="equipment-display">
            <div 
              className="equipment-icon large"
              style={{ backgroundColor: getRarityColor(currentEquipment?.rarity || 'common') }}
            >
              <img 
                src={getEquipmentImage((currentEquipment as any)?.equipmentType || currentEquipment?.type || 'weapon')} 
                alt={currentEquipment?.name || 'Equipment'}
                style={{ width: '32px', height: '32px' }}
              />
              <span className="equipment-level">lv{currentEquipment?.level || 1}</span>
            </div>
            
            <div className="equipment-info">
              <div className="equipment-stars">
                {Array.from({length: 5}, (_, i) => (
                  <span key={i} className={`star ${i < (currentEquipment?.stars || 0) ? 'filled' : 'empty'}`}>
                    ★
                  </span>
                ))}
              </div>
              
              <div className="equipment-stats-inline">
                {(currentEquipment.stats?.attack || 0) > 0 && <div>攻击: {currentEquipment.stats.attack}</div>}
                {(currentEquipment.stats?.defense || 0) > 0 && <div>防御: {currentEquipment.stats.defense}</div>}
                {(currentEquipment.stats?.health || 0) > 0 && <div>血量: {currentEquipment.stats.health}</div>}
                {(currentEquipment.stats?.agility || 0) > 0 && <div>敏捷: {currentEquipment.stats.agility}</div>}
                {(currentEquipment.stats?.criticalRate || 0) > 0 && <div>暴击率: {currentEquipment.stats.criticalRate}%</div>}
                {(currentEquipment.stats?.criticalDamage || 0) > 0 && <div>暴击伤害: {currentEquipment.stats.criticalDamage}%</div>}
              </div>
            </div>
          </div>
          
          <div className="equipment-upgrade">
            <h4>升星</h4>
            <div className="upgrade-info">
              <div>升星费用: {upgradeCost} 金币</div>
              <div>需要材料: {requiredMaterials} 个同类装备</div>
              <div>可用材料: {availableMaterials} 个</div>
              <div>成功率: {successRate}%</div>
              {!canUpgradeStars && <div style={{ color: '#dc3545' }}>已达到最大星级</div>}
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
            disabled={!canUpgrade || isUpgrading}
          >
            {isUpgrading ? '升星中...' : '升星'}
          </button>
        </div>
      </div>
      
      {/* 升星结果弹出框 */}
      {upgradeResult && (
        <div className="modal-overlay" onClick={() => setUpgradeResult(null)}>
          <div className="upgrade-result-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{upgradeResult.success ? '✨ 升星成功' : '❌ 升星失败'}</h3>
              <button className="close-btn" onClick={() => setUpgradeResult(null)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="result-message">
                <p>{upgradeResult.message}</p>
                <div className="star-display">
                  {Array.from({length: 5}, (_, i) => (
                    <span key={i} className={`star ${i < upgradeResult.newStars ? 'filled' : 'empty'}`}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="confirm-btn"
                onClick={() => setUpgradeResult(null)}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentModal;