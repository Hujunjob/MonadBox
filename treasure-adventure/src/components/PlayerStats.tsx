import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { calculatePlayerStats, getEquipmentImage, getRarityColor } from '../utils/gameUtils';
import { EquipmentType } from '../types/game';
import EquipmentModal from './EquipmentModal';

const PlayerStats: React.FC = () => {
  const { player, initializeGame, updatePlayer } = useGameStore();
  const stats = calculatePlayerStats(player);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 确保体力属性存在
  React.useEffect(() => {
    if (player.stamina === undefined || player.maxStamina === undefined || player.lastStaminaTime === undefined) {
      updatePlayer({
        stamina: 24,
        maxStamina: 24,
        lastStaminaTime: Math.floor(Date.now() / 1000)
      });
    }
  }, [player.stamina, player.maxStamina, player.lastStaminaTime, updatePlayer]);
  
  const expNeeded = player.level * 100;
  const expPercent = (player.experience / expNeeded) * 100;
  const healthPercent = (player.health / stats.maxHealth) * 100;
  const staminaPercent = ((player.stamina || 0) / (player.maxStamina || 24)) * 100;
  
  const equipmentSlots = [
    { key: 'helmet', name: '头盔', type: EquipmentType.HELMET },
    { key: 'armor', name: '衣服', type: EquipmentType.ARMOR },
    { key: 'shoes', name: '鞋子', type: EquipmentType.SHOES },
    { key: 'weapon', name: '武器', type: EquipmentType.WEAPON },
    { key: 'shield', name: '盾牌', type: EquipmentType.SHIELD },
    { key: 'accessory', name: '配饰', type: EquipmentType.ACCESSORY }
  ];
  
  const handleEquipmentClick = (equipment: any, slot: string) => {
    setSelectedEquipment(equipment);
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEquipment(null);
    setSelectedSlot('');
  };
  
  return (
    <div className="player-stats">
      <h2>玩家信息</h2>
      <div className="stat-row">
        <span>姓名: {player.name}</span>
        <span>等级: {player.level}</span>
        <span>金币: {player.gold}</span>
      </div>
      
      <div className="stat-bar">
        <label>血量: {player.health}/{stats.maxHealth}</label>
        <div className="progress-bar">
          <div 
            className="progress-fill health" 
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>
      
      <div className="stat-bar">
        <label>经验: {player.experience}/{expNeeded}</label>
        <div className="progress-bar">
          <div 
            className="progress-fill experience" 
            style={{ width: `${expPercent}%` }}
          />
        </div>
      </div>
      
      <div className="stat-bar">
        <label>体力: {player.stamina || 0}/{player.maxStamina || 24}</label>
        <div className="progress-bar">
          <div 
            className="progress-fill stamina" 
            style={{ width: `${staminaPercent}%` }}
          />
        </div>
      </div>
      
      <div className="stat-grid">
        <div className="stat-item">
          <span>攻击力</span>
          <span>{stats.attack}</span>
        </div>
        <div className="stat-item">
          <span>防御力</span>
          <span>{stats.defense}</span>
        </div>
        <div className="stat-item">
          <span>敏捷度</span>
          <span>{stats.agility}</span>
        </div>
        <div className="stat-item">
          <span>暴击率</span>
          <span>{stats.criticalRate}%</span>
        </div>
        <div className="stat-item">
          <span>暴击伤害</span>
          <span>{stats.criticalDamage}%</span>
        </div>
        <div className="stat-item">
          <span>宝箱数</span>
          <span>{player.treasureBoxes}</span>
        </div>
      </div>
      
      {/* 装备区域 */}
      <div className="equipment-section">
        <h3>装备</h3>
        <div className="equipment-slots">
          {equipmentSlots.map(slot => {
            const equippedItem = player.equipment[slot.key as keyof typeof player.equipment];
            
            return (
              <div key={slot.key} className="equipment-slot">
                <label>{slot.name}</label>
                <div className="slot-content">
                  {equippedItem ? (
                    <div 
                      className="equipped-item clickable"
                      style={{ backgroundColor: getRarityColor(equippedItem.rarity) }}
                      onClick={() => handleEquipmentClick(equippedItem, slot.key)}
                    >
                      <img 
                        src={getEquipmentImage(equippedItem.type)} 
                        alt={equippedItem.name}
                        style={{ width: '32px', height: '32px' }}
                      />
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
        
        
        <div className="equipment-note">
          <p>💡 点击装备查看详情和进行操作</p>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button 
          onClick={initializeGame}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          重置游戏
        </button>
      </div>

      <EquipmentModal
        equipment={selectedEquipment}
        slot={selectedSlot}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isEquipped={true}
      />
    </div>
  );
};

export default PlayerStats;