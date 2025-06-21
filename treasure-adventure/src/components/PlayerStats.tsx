import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { calculatePlayerStats, getEquipmentImage, getRarityColor, getBaseStats, calculateEquipmentBonus } from '../utils/gameUtils';
import { EquipmentType } from '../types/game';
import EquipmentModal from './EquipmentModal';

const PlayerStats: React.FC = () => {
  const { player, initializeGame, updatePlayer } = useGameStore();
  const stats = calculatePlayerStats(player);
  const baseStats = getBaseStats(player);
  const equipmentBonus = calculateEquipmentBonus(player);
  
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
  const healthPercent = (player.health / stats.maxHealth) * 100;
  
  const equipmentSlots = [
    { key: 'helmet', name: '头盔', type: EquipmentType.HELMET },
    { key: 'armor', name: '衣服', type: EquipmentType.ARMOR },
    { key: 'shoes', name: '鞋子', type: EquipmentType.SHOES },
    { key: 'weapon', name: '武器', type: EquipmentType.WEAPON },
    { key: 'shield', name: '盾牌', type: EquipmentType.SHIELD },
    { key: 'accessory', name: '配饰', type: EquipmentType.ACCESSORY },
    { key: 'ring', name: '戒指', type: EquipmentType.RING }
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
      
      <div className="stat-row">
        <span>经验: {player.experience}/{expNeeded}</span>
        <span>体力: {player.stamina || 0}/{player.maxStamina || 24}</span>
      </div>
      
      <div className="stat-grid">
        <div className="stat-item">
          <span>攻击力</span>
          <span>
            {baseStats.attack}
            {equipmentBonus.attack > 0 && (
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                +{equipmentBonus.attack}
              </span>
            )}
          </span>
        </div>
        <div className="stat-item">
          <span>防御力</span>
          <span>
            {baseStats.defense}
            {equipmentBonus.defense > 0 && (
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                +{equipmentBonus.defense}
              </span>
            )}
          </span>
        </div>
        <div className="stat-item">
          <span>敏捷度</span>
          <span>
            {baseStats.agility}
            {equipmentBonus.agility > 0 && (
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                +{equipmentBonus.agility}
              </span>
            )}
          </span>
        </div>
        <div className="stat-item">
          <span>暴击率</span>
          <span>
            {baseStats.criticalRate}%
            {equipmentBonus.criticalRate > 0 && (
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                +{equipmentBonus.criticalRate}%
              </span>
            )}
          </span>
        </div>
        <div className="stat-item">
          <span>暴击伤害</span>
          <span>
            {baseStats.criticalDamage}%
            {equipmentBonus.criticalDamage > 0 && (
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                +{equipmentBonus.criticalDamage}%
              </span>
            )}
          </span>
        </div>
        <div className="stat-item">
          <span>宝箱数</span>
          <span>{Array.isArray(player.treasureBoxes) ? player.treasureBoxes.length : 0}</span>
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
                      className="equipped-item clickable inventory-item equipment"
                      style={{ backgroundColor: getRarityColor(equippedItem.rarity) }}
                      onClick={() => handleEquipmentClick(equippedItem, slot.key)}
                    >
                      <div className="item-header">
                        <span className="equipment-level-badge">Lv.{equippedItem.level}</span>
                      </div>
                      <div className="item-display">
                        <img 
                          src={getEquipmentImage(equippedItem.type)} 
                          alt={equippedItem.name}
                          style={{ width: '32px', height: '32px' }}
                        />
                      </div>
                      <div className="item-info">
                        <div className="equipment-stars-clean">
                          {Array.from({length: 5}, (_, i) => (
                            <span key={i} className={`star-clean ${i < (equippedItem.stars || 0) ? 'filled' : 'empty'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
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
      
      <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {import.meta.env.DEV && (
          <button 
            onClick={() => {
              updatePlayer({
                stamina: player.maxStamina || 24,
                lastStaminaTime: Math.floor(Date.now() / 1000)
              });
            }}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            调试:恢复体力
          </button>
        )}
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
        <button 
          onClick={() => {
            localStorage.removeItem('treasure-adventure-game');
            window.location.reload();
          }}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#ffc107', 
            color: 'black', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          清理存储并重启
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