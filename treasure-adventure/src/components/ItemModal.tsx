import React from 'react';
import { useGameStore } from '../store/gameStore';
import { getItemImage } from '../utils/gameUtils';
import { calculatePlayerStats } from '../utils/gameUtils';
import { useToast } from './ToastManager';

interface ItemModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
}

const ItemModal: React.FC<ItemModalProps> = ({ item, isOpen, onClose }) => {
  const { player, useHealthPotion } = useGameStore();
  const { showToast } = useToast();
  
  if (!isOpen || !item) return null;

  const stats = calculatePlayerStats(player);
  const isHealthFull = player.health >= stats.maxHealth;

  const handleUseItem = () => {
    if (item.type === 'health_potion') {
      if (isHealthFull) {
        showToast('血量已满，无需使用血瓶！', 'info');
        return;
      }
      
      const healAmount = item.effect?.value || 50;
      const currentHealth = player.health;
      const maxHealth = stats.maxHealth;
      const actualHeal = Math.min(healAmount, maxHealth - currentHealth);
      
      useHealthPotion();
      
      // 显示成功通知
      showToast(`使用成功！恢复血量 ${actualHeal} 点`, 'success');
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="equipment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{item.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="equipment-display">
            <div className="equipment-icon large">
              <img 
                src={getItemImage(item.type)} 
                alt={item.name}
                style={{ width: '64px', height: '64px' }}
              />
              <span className="equipment-level">lv{item.level || 1}</span>
            </div>
            
            <div className="equipment-info">
              {/* <div className="equipment-level">等级: {item.level || 1}</div> */}
              <div className="equipment-quantity">数量: {item.quantity}</div>
              <div className="equipment-rarity">
                {item.type === 'health_potion' && item.effect ? `恢复 ${item.effect.value} 血量` : ''}
                {item.type === 'pet_egg' ? '宠物蛋' : ''}
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-actions">
          {item.type === 'health_potion' && (
            <button 
              className="equip-btn" 
              onClick={handleUseItem}
              disabled={item.quantity <= 0 || isHealthFull}
            >
              {isHealthFull ? '血量已满' : '使用'}
            </button>
          )}
          {item.type === 'pet_egg' && (
            <button 
              className="equip-btn" 
              disabled={true}
            >
              暂不可使用
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemModal;