import React from 'react';
import { useGameStore } from '../store/gameStore';
import { calculatePlayerStats } from '../utils/gameUtils';
import { EquipmentType } from '../types/game';

const PlayerStats: React.FC = () => {
  const { player, initializeGame, unequipItem } = useGameStore();
  const stats = calculatePlayerStats(player);
  
  const expNeeded = player.level * 100;
  const expPercent = (player.experience / expNeeded) * 100;
  const healthPercent = (player.health / stats.maxHealth) * 100;
  
  const equipmentSlots = [
    { key: 'helmet', name: '头盔', type: EquipmentType.HELMET },
    { key: 'armor', name: '衣服', type: EquipmentType.ARMOR },
    { key: 'shoes', name: '鞋子', type: EquipmentType.SHOES },
    { key: 'weapon', name: '武器', type: EquipmentType.WEAPON },
    { key: 'accessory', name: '配饰', type: EquipmentType.ACCESSORY }
  ];
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#808080';
      case 'uncommon': return '#00ff00';
      case 'rare': return '#0080ff';
      case 'epic': return '#8000ff';
      case 'legendary': return '#ff8000';
      default: return '#000000';
    }
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
                    <div className="equipped-item">
                      <span style={{ color: getRarityColor(equippedItem.rarity) }}>
                        {equippedItem.name}
                      </span>
                      <div className="item-stats">
                        {equippedItem.stats.attack && <span>攻击+{equippedItem.stats.attack}</span>}
                        {equippedItem.stats.defense && <span>防御+{equippedItem.stats.defense}</span>}
                        {equippedItem.stats.health && <span>血量+{equippedItem.stats.health}</span>}
                        {equippedItem.stats.agility && <span>敏捷+{equippedItem.stats.agility}</span>}
                        {equippedItem.stats.criticalRate && <span>暴击率+{equippedItem.stats.criticalRate}%</span>}
                        {equippedItem.stats.criticalDamage && <span>暴击伤害+{equippedItem.stats.criticalDamage}%</span>}
                      </div>
                      <button onClick={() => unequipItem(slot.key)} className="unequip-btn">
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
        
        
        <div className="equipment-note">
          <p>💡 要装备新物品，请到"背包"栏选择装备</p>
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
    </div>
  );
};

export default PlayerStats;