import React, { useEffect, useState } from 'react';
import { useHybridGameStore } from '../store/web3GameStore';
import { getEquipmentImage, getItemImage, getRarityColor, getJobAdvancementBookImage } from '../utils/gameUtils';
import EquipmentModal from '../components/EquipmentModal';
import ItemModal from '../components/ItemModal';
import JobAdvancementModal from '../components/JobAdvancementModal';

const Inventory: React.FC = () => {
  const hybridStore = useHybridGameStore();
  
  // 根据模式选择玩家数据
  const player = hybridStore.player
  useEffect(()=>{
    console.log("Player");
    console.log(player);
  },[player])
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  
  // 按类型分组物品
  const healthPotions = player.inventory.filter(item => item.type === 'health_potion');
  const equipment = player.inventory.filter(item => item.type === 'equipment');
  const petEggs = player.inventory.filter(item => item.type === 'pet_egg');
  
  // 转职书按目标职业分组合并
  const jobBooksRaw = player.inventory.filter(item => item.type === 'job_advancement_book');
  const jobBooksGrouped = jobBooksRaw.reduce((acc: any[], item) => {
    const existingBook = acc.find(book => book.targetJob === (item as any).targetJob);
    if (existingBook) {
      existingBook.quantity += item.quantity;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, []);
  
  const otherItems = player.inventory.filter(item => 
    item.type !== 'health_potion' && item.type !== 'equipment' && item.type !== 'pet_egg' && item.type !== 'job_advancement_book'
  );
  
  const handleEquipmentClick = (equipment: any) => {
    setSelectedEquipment(equipment);
    setIsEquipmentModalOpen(true);
  };

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    if (item.type === 'job_advancement_book') {
      setIsJobModalOpen(true);
    } else {
      setIsItemModalOpen(true);
    }
  };

  const handleCloseEquipmentModal = () => {
    setIsEquipmentModalOpen(false);
    setSelectedEquipment(null);
  };

  const handleCloseItemModal = () => {
    setIsItemModalOpen(false);
    setSelectedItem(null);
  };

  const handleCloseJobModal = () => {
    setIsJobModalOpen(false);
    setSelectedItem(null);
  };
  
  return (
    <div className="inventory-panel">      
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
              <div className="item-header">
                <span className="item-level-badge">Lv.{item.level || 1}</span>
              </div>
              <div className="item-display">
                <img 
                  src={getItemImage('health_potion')} 
                  alt={item.name}
                  style={{ width: '32px', height: '32px' }}
                />
              </div>
              <div className="item-info">
                <span className="item-quantity-text">×{item.quantity}</span>
              </div>
            </div>
          ))}
          {petEggs.map(item => (
            <div 
              key={item.id} 
              className="inventory-item consumable clickable"
              onClick={() => handleItemClick(item)}
            >
              <div className="item-header">
                <span className="item-level-badge">Lv.{item.level || 1}</span>
              </div>
              <div className="item-display">
                <img 
                  src={getItemImage('pet_egg')} 
                  alt={item.name}
                  style={{ width: '32px', height: '32px' }}
                />
              </div>
              <div className="item-info">
                <span className="item-quantity-text">×{item.quantity}</span>
              </div>
            </div>
          ))}
          {jobBooksGrouped.map(item => (
            <div 
              key={`${item.targetJob}_${item.id}`} 
              className="inventory-item job-book clickable"
              onClick={() => handleItemClick(item)}
            >
              <div className="item-header">
                <span className="job-book-label">转职书</span>
              </div>
              <div className="item-display">
                <img 
                  src={getJobAdvancementBookImage(item.targetJob)} 
                  alt={item.name}
                  style={{ width: '32px', height: '32px' }}
                />
              </div>
              <div className="item-info">
                <span className="item-quantity-text">×{item.quantity}</span>
              </div>
            </div>
          ))}
          {healthPotions.length === 0 && petEggs.length === 0 && jobBooksGrouped.length === 0 && (
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
                <div className="item-header">
                  <span className="equipment-level-badge">Lv.{equipmentItem.level || 1}</span>
                </div>
                <div className="item-display">
                  <img 
                    src={getEquipmentImage(equipmentItem.equipmentType || equipmentItem.type)} 
                    alt={item.name}
                    style={{ width: '32px', height: '32px' }}
                  />
                </div>
                <div className="item-info">
                  <div className="equipment-stars-clean">
                    {Array.from({length: 5}, (_, i) => (
                      <span key={i} className={`star-clean ${i < (equipmentItem.stars || 0) ? 'filled' : 'empty'}`}>
                        ★
                      </span>
                    ))}
                  </div>
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

      <JobAdvancementModal
        item={selectedItem}
        isOpen={isJobModalOpen}
        onClose={handleCloseJobModal}
      />
    </div>
  );
};

export default Inventory;