import React, { useState } from 'react';
import { useHybridGameStore } from '../store/web3GameStore';
import type { EquipmentItem } from '../types/game';
import { getEquipmentImage, getRarityColor } from '../utils/gameUtils';
import SellModal from './SellModal';

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
  const hybridStore = useHybridGameStore();
  const player = hybridStore.player;
  const [upgradeResult, setUpgradeResult] = React.useState<{success: boolean; newStars: number; message: string} | null>(null);
  const [isUpgrading, setIsUpgrading] = React.useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [availableMaterials, setAvailableMaterials] = React.useState<{materialIds: number[]; materialsNeeded: number}>({materialIds: [], materialsNeeded: 0});
  const [selectedMaterials, setSelectedMaterials] = React.useState<number[]>([]);

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

  // 加载可用材料
  React.useEffect(() => {
    if (currentEquipment && isOpen) {
      const loadMaterials = async () => {
        try {
          const materials = await hybridStore.getAvailableMaterials(currentEquipment.id);
          setAvailableMaterials(materials);
          // 自动选择足够的材料
          setSelectedMaterials(materials.materialIds.slice(0, materials.materialsNeeded));
        } catch (error) {
          console.error('Failed to load materials:', error);
        }
      };
      loadMaterials();
    }
  }, [currentEquipment?.id, isOpen]);

  if (!isOpen || !equipment) return null;

  const handleEquip = async () => {
    if (!isEquipped && currentEquipment) {
      try {
        await hybridStore.equipItem(parseInt(currentEquipment.id));
        // 装备成功后刷新数据
        hybridStore.refetchPlayer();
        onClose();
      } catch (error) {
        console.error('装备失败:', error);
      }
    }
  };

  const handleUnequip = async () => {
    if (isEquipped && slot) {
      try {
        // 将槽位名称转换为索引
        const slotNames = ['helmet', 'armor', 'shoes', 'weapon', 'shield', 'accessory', 'ring', 'pet'];
        const slotIndex = slotNames.indexOf(slot);
        
        if (slotIndex >= 0) {
          await hybridStore.unequipItem(slotIndex);
          // 卸下成功后刷新数据
          hybridStore.refetchPlayer();
          onClose();
        }
      } catch (error) {
        console.error('卸下装备失败:', error);
      }
    }
  };

  const handleUpgrade = async () => {
    if (!currentEquipment) return;
    
    setIsUpgrading(true);
    try {
      await hybridStore.upgradeEquipmentStars(parseInt(currentEquipment.id), selectedMaterials);
      
      // 升星成功
      const newStars = Math.min((currentEquipment.stars || 0) + 1, 5);
      setUpgradeResult({ 
        success: true, 
        newStars: newStars, 
        message: `装备成功升至 ${newStars} 星！` 
      });
      
      // 刷新数据
      hybridStore.refetchPlayer();
    } catch (error) {
      console.error('升星失败:', error);
      setUpgradeResult({ 
        success: false, 
        newStars: currentEquipment.stars || 0, 
        message: '升星失败，请检查金币余额和升星材料' 
      });
    }
    setIsUpgrading(false);
  };

  // 计算升星成本和成功率 (根据合约中的配置)
  const currentStars = currentEquipment?.stars || 0;
  
  // 合约中的升星成本配置
  const getStarUpgradeCost = (currentStars: number) => {
    const costs = [0, 1000, 2500, 5000, 10000]; // costs[1] = 0->1星的费用, costs[2] = 1->2星的费用
    const targetStars = currentStars + 1; // 要升到的目标星级
    return costs[targetStars] || 0;
  };
  
  // 合约中的成功率配置
  const getStarUpgradeSuccessRate = (currentStars: number) => {
    const rates = [0, 80, 70, 60, 50]; // rates[1] = 0->1星成功率, rates[2] = 1->2星成功率
    const targetStars = currentStars + 1; // 要升到的目标星级
    return rates[targetStars] || 0;
  };
  
  const upgradeCost = getStarUpgradeCost(currentStars);
  const successRate = getStarUpgradeSuccessRate(currentStars);
  const canAffordUpgrade = player.gold >= upgradeCost;
  const canUpgradeStars = currentStars < 5;
  const hasSufficientMaterials = selectedMaterials.length >= availableMaterials.materialsNeeded;
  
  // 需要金币和足够的材料装备
  const canUpgrade = canAffordUpgrade && canUpgradeStars && hasSufficientMaterials;

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
              <div>成功率: {successRate}%</div>
              <div>当前金币: {Math.floor(player.gold)}</div>
              <div>需要材料: {availableMaterials.materialsNeeded} 个同类装备</div>
              <div>可用材料: {availableMaterials.materialIds.length} 个</div>
              <div>已选择: {selectedMaterials.length} 个</div>
              {!canUpgradeStars && <div style={{ color: '#dc3545' }}>已达到最大星级</div>}
              {!canAffordUpgrade && canUpgradeStars && <div style={{ color: '#dc3545' }}>金币不足</div>}
              {!hasSufficientMaterials && canUpgradeStars && <div style={{ color: '#dc3545' }}>材料装备不足</div>}
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
          
          {!isEquipped && (
            <button 
              className="sell-btn" 
              onClick={() => setIsSellModalOpen(true)}
            >
              卖出
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
      
      {/* 卖出模态框 */}
      <SellModal
        item={currentEquipment}
        itemType="equipment"
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
      />
    </div>
  );
};

export default EquipmentModal;