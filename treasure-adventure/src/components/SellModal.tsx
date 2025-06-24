import React, { useState } from 'react';
import { useMarket } from '../hooks/useMarket';
import { useHybridGameStore } from '../store/web3GameStore';
import { getEquipmentImage, getItemImage, getRarityColor } from '../utils/gameUtils';
import { parseEther } from 'viem';
import { useToast } from './ToastManager';

interface SellModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  itemType: 'equipment' | 'item';
  onSellSuccess?: () => void;
}

const SellModal: React.FC<SellModalProps> = ({ item, isOpen, onClose, itemType, onSellSuccess }) => {
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { listEquipmentForSale, listItemForSale, isListingEquipment, isListingItem } = useMarket();
  const hybridStore = useHybridGameStore();
  const player = hybridStore.player;
  const { showToast } = useToast();

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!player || !price || parseFloat(price) <= 0) {
      showToast('请输入有效的价格', 'error');
      return;
    }

    if (itemType === 'item' && quantity <= 0) {
      showToast('请输入有效的数量', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const priceInGold = parseFloat(price);
      
      if (itemType === 'equipment') {
        await listEquipmentForSale(player.id, parseInt(item.id), priceInGold);
      } else {
        await listItemForSale(player.id, parseInt(item.id), quantity, priceInGold);
      }
      
      showToast('物品已成功上架！', 'success');
      // 刷新玩家数据
      hybridStore.refetchPlayer();
      // 通知父组件销售成功
      onSellSuccess?.();
      onClose();
    } catch (error) {
      console.error('上架失败:', error);
      showToast('上架失败: ' + (error as Error).message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxQuantity = itemType === 'item' ? item.quantity : 1;
  const isLoading = isSubmitting || isListingEquipment || isListingItem;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="equipment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>出售 {item.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="equipment-display">
            <div 
              className="equipment-icon large"
              style={{ 
                backgroundColor: itemType === 'equipment' && item.rarity 
                  ? getRarityColor(item.rarity) 
                  : undefined 
              }}
            >
              <img 
                src={itemType === 'equipment' 
                  ? getEquipmentImage(item.equipmentType || item.type) 
                  : getItemImage(item.type)
                } 
                alt={item.name}
                style={{ width: '64px', height: '64px' }}
              />
              {itemType === 'equipment' && (
                <span className="equipment-level">lv{item.level || 1}</span>
              )}
            </div>
            
            <div className="equipment-info">
              <div className="equipment-name">{item.name}</div>
              {itemType === 'equipment' && item.stars && (
                <div className="equipment-stars">
                  {Array.from({length: 5}, (_, i) => (
                    <span key={i} className={`star ${i < item.stars ? 'filled' : 'empty'}`}>
                      ★
                    </span>
                  ))}
                </div>
              )}
              {itemType === 'item' && (
                <div className="equipment-quantity">拥有数量: {item.quantity}</div>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="sell-form">
            <div className="form-group">
              <label htmlFor="price">售价 (金币)</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="输入售价"
                required
              />
            </div>
            
            {itemType === 'item' && maxQuantity > 1 && (
              <div className="form-group">
                <label htmlFor="quantity">出售数量</label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  required
                />
                <small>最大可售: {maxQuantity}</small>
              </div>
            )}
            
            <div className="form-group">
              <div className="price-info">
                <div>总售价: {price ? (parseFloat(price) * (itemType === 'item' ? quantity : 1)).toFixed(2) : '0'} 金币</div>
                <div>市场手续费 (10%): {price ? ((parseFloat(price) * (itemType === 'item' ? quantity : 1)) * 0.1).toFixed(2) : '0'} 金币</div>
                <div className="net-income">
                  净收入: {price ? ((parseFloat(price) * (itemType === 'item' ? quantity : 1)) * 0.9).toFixed(2) : '0'} 金币
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <div className="modal-actions">
          <button 
            type="button"
            className="cancel-btn" 
            onClick={onClose}
            disabled={isLoading}
          >
            取消
          </button>
          <button 
            type="submit"
            className="confirm-btn" 
            onClick={handleSubmit}
            disabled={isLoading || !price || parseFloat(price) <= 0}
          >
            {isLoading ? '上架中...' : '确认上架'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellModal;