import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { calculatePlayerStats, getEquipmentImage, getRarityColor, getBaseStats, calculateEquipmentBonus, getJobLevelDisplay, getCanGainExperience } from '../utils/gameUtils';
import { EquipmentType, JobType, ItemType } from '../types/game';
import EquipmentModal from './EquipmentModal';
import Web3Toggle from './Web3Toggle';
import TestEthHelper from './TestEthHelper';
import NetworkDebugger from './NetworkDebugger';
import ContractInfo from './ContractInfo';

const PlayerStats: React.FC = () => {
  const { player, initializeGame, updatePlayer, gainExperience, updateStamina } = useGameStore();
  const stats = calculatePlayerStats(player);
  const baseStats = getBaseStats(player);
  const equipmentBonus = calculateEquipmentBonus(player);
  
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  // 通知数据（示例）
  const notifications = [
    "🎉 欢迎来到宝物冒险！",
    "💰 在线可以赚取MON，段位越高MON越多",
    "📦 快开启宝箱获得资源",
    "🐾 宠物系统即将上线！"
  ];
  
  // 确保体力属性存在
  // React.useEffect(() => {
  //   if (player.stamina === undefined || player.maxStamina === undefined || player.lastStaminaTime === undefined) {
  //     updatePlayer({
  //       stamina: 24,
  //       maxStamina: 24,
  //       lastStaminaTime: Math.floor(Date.now() / 1000)
  //     });
  //   }
  // }, [player.stamina, player.maxStamina, player.lastStaminaTime, updatePlayer]);

  // 点击外部隐藏tooltip
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.stat-icon')) {
        setActiveTooltip(null);
      }
    };

    if (activeTooltip) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeTooltip]);

  // // 进入角色页面时检查体力
  // React.useEffect(() => {
  //   updateStamina();
  // }, [updateStamina]);
  
  // // 离开角色页面时也检查体力（清理时）
  // React.useEffect(() => {
  //   return () => {
  //     updateStamina();
  //   };
  // }, [updateStamina]);
  
  const expNeeded = player.level * 100;
  
  const equipmentSlots = [
    { key: 'helmet', name: '头盔', type: EquipmentType.HELMET },
    { key: 'armor', name: '衣服', type: EquipmentType.ARMOR },
    { key: 'shoes', name: '鞋子', type: EquipmentType.SHOES },
    { key: 'weapon', name: '武器', type: EquipmentType.WEAPON },
    { key: 'shield', name: '盾牌', type: EquipmentType.SHIELD },
    { key: 'accessory', name: '配饰', type: EquipmentType.ACCESSORY },
    { key: 'ring', name: '戒指', type: EquipmentType.RING },
    { key: 'pet', name: '宠物', type: EquipmentType.PET }
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

  const handleTooltipClick = (tooltipId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveTooltip(activeTooltip === tooltipId ? null : tooltipId);
  };
  
  return (
    <div className="player-stats">
      {/* Web3 模式切换 */}
      <Web3Toggle />
      
      {/* 网络调试器 */}
      <NetworkDebugger />
      
      {/* 合约信息 */}
      <ContractInfo />
      
      {/* 测试 ETH 助手 */}
      <TestEthHelper />
      
      {/* 通知栏 */}
      <div className="notification-bar">
        <div className="notification-content">
          {notifications.map((notification, index) => (
            <span key={index} className="notification-item">
              {notification}
            </span>
          ))}
        </div>
      </div>
      
      <div className="stat-row">
        <span>姓名: {player.name}</span>
        <span>{getJobLevelDisplay(player.level, player.experience)}</span>
        <span>金币: {player.gold}</span>
      </div>
      
      <div className="stat-row">
        <span>经验: {player.experience}/{expNeeded}</span>
        <span>血量: {player.health}/{stats.maxHealth}</span>
        <span>体力: {player.stamina || 0}/{player.maxStamina || 24}</span>
      </div>
      
      {!getCanGainExperience(player.level, player.experience) && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '5px', 
          padding: '10px', 
          margin: '10px 0',
          color: '#856404',
          textAlign: 'center'
        }}>
          <strong>⚠️ 需要转职才能继续获得经验！</strong>
        </div>
      )}
      
      <div className="stat-grid-3col">
        <div className="stat-item">
          <span 
            className="stat-icon" 
            onClick={(e) => handleTooltipClick('attack', e)}
          >
            ⚔️
            {activeTooltip === 'attack' && <span className="tooltip">攻击力</span>}
          </span>
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
          <span 
            className="stat-icon" 
            onClick={(e) => handleTooltipClick('defense', e)}
          >
            🛡️
            {activeTooltip === 'defense' && <span className="tooltip">防御力</span>}
          </span>
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
          <span 
            className="stat-icon" 
            onClick={(e) => handleTooltipClick('agility', e)}
          >
            💨
            {activeTooltip === 'agility' && <span className="tooltip">敏捷度</span>}
          </span>
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
          <span 
            className="stat-icon" 
            onClick={(e) => handleTooltipClick('criticalRate', e)}
          >
            💥
            {activeTooltip === 'criticalRate' && <span className="tooltip">暴击率</span>}
          </span>
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
          <span 
            className="stat-icon" 
            onClick={(e) => handleTooltipClick('criticalDamage', e)}
          >
            🔥
            {activeTooltip === 'criticalDamage' && <span className="tooltip">暴击伤害</span>}
          </span>
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
          <span 
            className="stat-icon" 
            onClick={(e) => handleTooltipClick('treasureBox', e)}
          >
            📦
            {activeTooltip === 'treasureBox' && <span className="tooltip">宝箱数</span>}
          </span>
          <span>{Array.isArray(player.treasureBoxes) ? player.treasureBoxes.length : 0}</span>
        </div>
      </div>
      
      {/* 装备区域 */}
      <div className="equipment-section">
        <div className="equipment-slots">
          {equipmentSlots.map(slot => {
            const equippedItem = player.equipment[slot.key as keyof typeof player.equipment];
            
            
            return (
              <div key={slot.key} className="equipment-slot">
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
                      <span>{slot.name}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        
      </div>
      
      <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {import.meta.env.DEV && (
          <>
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
            <button 
              onClick={() => {
                const newBoxes = [];
                for (let i = 0; i < 10; i++) {
                  newBoxes.push({
                    id: `debug_box_${Date.now()}_${i}`,
                    level: Math.floor(Math.random() * 10) + 1 // 随机1-10级
                  });
                }
                updatePlayer({
                  treasureBoxes: [...(Array.isArray(player.treasureBoxes) ? player.treasureBoxes : []), ...newBoxes]
                });
              }}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#17a2b8', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              调试:给10个宝箱
            </button>
            <button 
              onClick={() => {
                gainExperience(100);
              }}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#6f42c1', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              调试:增加100经验
            </button>
            <button 
              onClick={() => {
                const jobBooks = [
                  JobType.GREAT_SWORDSMAN,
                  JobType.TEMPLE_KNIGHT,
                  JobType.DRAGON_KNIGHT,
                  JobType.SWORD_MASTER,
                  JobType.SWORD_GOD,
                  JobType.PLANE_LORD
                ];
                
                const newBooks = jobBooks.map(job => ({
                  id: `debug_job_book_${job}_${Date.now()}`,
                  name: `${job === JobType.GREAT_SWORDSMAN ? '大剑士' : 
                          job === JobType.TEMPLE_KNIGHT ? '圣殿骑士' :
                          job === JobType.DRAGON_KNIGHT ? '龙骑士' :
                          job === JobType.SWORD_MASTER ? '剑圣' :
                          job === JobType.SWORD_GOD ? '剑神' : '位面领主'}转职书`,
                  type: ItemType.JOB_ADVANCEMENT_BOOK,
                  quantity: 2,
                  targetJob: job
                }));
                
                updatePlayer({
                  inventory: [...player.inventory, ...newBooks]
                });
              }}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#fd7e14', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              调试:给转职书
            </button>
          </>
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