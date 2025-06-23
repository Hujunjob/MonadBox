import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useHybridGameStore } from '../store/web3GameStore';
import { generateRandomEquipment, generateHealthPotion, generatePetEgg, generateJobAdvancementBook, generateRewardLevel, getEquipmentImage, getItemImage, getRarityColor } from '../utils/gameUtils';
import { RewardType } from '../types/game';
import TreasureBoxTimer from './TreasureBoxTimer';
import { GAME_CONFIG } from '../config/gameConfig';

const TreasureBox: React.FC = () => {
  const { player, gainGold, updatePlayer } = useGameStore();
  const hybridStore = useHybridGameStore();
  const [openingBox, setOpeningBox] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [isClosing, setIsClosing] = useState(false);
  // const [boxCount, setBoxCount, countPerUser] = useStateTogetherWithPerUserValues('treasure-box', 0)

  const handleOpenBox = async () => {
    if (hybridStore.isWeb3Mode) {
      // Web3模式：调用智能合约开箱
      if (hybridStore.unopenedBoxCount <= 0 || openingBox) return;
      
      setOpeningBox(true);
      try {
        // 调用Web3开箱函数 - 自动选择第一个未开启的宝箱
        await hybridStore.openTreasureBox?.(undefined, (reward: any) => {
          // 显示奖励信息
          setTimeout(() => {
            setSelectedReward({
              type: 'Web3',
              description: reward.message,
            });
            setShowSelection(true);
          }, 1000);
        });
      } catch (error) {
        console.error('Web3开箱失败:', error);
      } finally {
        setOpeningBox(false);
      }
      return;
    }

    // 本地模式：原有逻辑
    const currentBoxes = Array.isArray(player.treasureBoxes) ? player.treasureBoxes : [];
    if (currentBoxes.length <= 0 || openingBox) return;

    // 重置所有状态
    setOpeningBox(true);
    setShowSelection(false);
    setSelectedReward(null);
    setIsClosing(false);
    
    setTimeout(() => {      
      // 获取第一个宝箱
      const treasureBox = currentBoxes[0];
      const boxLevel = treasureBox.level;
      
      // 根据宝箱等级确定奖励等级
      const rewardLevel = generateRewardLevel(boxLevel);
      
      // 从配置文件获取概率设置
      const probabilities = GAME_CONFIG.TREASURE_BOX_PROBABILITIES;
      const random = Math.random() * 100;
      let selectedReward: any;
      
      if (random < probabilities.GOLD) {
        // 金币
        const goldAmount = GAME_CONFIG.GOLD_REWARDS.TREASURE_BOX_BASE + 
                          rewardLevel * GAME_CONFIG.GOLD_REWARDS.PER_LEVEL_BONUS + 
                          Math.floor(Math.random() * GAME_CONFIG.GOLD_REWARDS.RANDOM_RANGE);
        selectedReward = { 
          type: RewardType.GOLD, 
          amount: goldAmount,
          description: `金币 +${goldAmount}`
        };
      } else if (random < probabilities.GOLD + probabilities.BLOOD_POTION) {
        // 血瓶
        const healthPotion = generateHealthPotion(rewardLevel);
        selectedReward = { 
          type: RewardType.HEALTH_POTION, 
          item: healthPotion,
          amount: 1,
          description: `${healthPotion.name} +1`
        };
      } else if (random < probabilities.GOLD + probabilities.BLOOD_POTION + probabilities.PET_EGG) {
        // 宠物蛋
        const petEgg = generatePetEgg(rewardLevel);
        selectedReward = { 
          type: RewardType.PET_EGG, 
          item: petEgg,
          amount: 1,
          description: `宠物蛋: ${petEgg.name}`
        };
      } else if (random < probabilities.GOLD + probabilities.BLOOD_POTION + probabilities.PET_EGG + probabilities.JOB_ADVANCEMENT_BOOK) {
        // 转职书
        const jobBook = generateJobAdvancementBook(boxLevel);
        selectedReward = { 
          type: RewardType.JOB_ADVANCEMENT_BOOK, 
          item: jobBook,
          amount: 1,
          description: `转职书: ${jobBook.name}`
        };
      } else {
        // 剩余概率为装备 (69%)
        const equipment = generateRandomEquipment(player.level, rewardLevel);
        selectedReward = { 
          type: RewardType.EQUIPMENT, 
          item: equipment,
          description: `装备: ${equipment.name}`
        };
      }
      
      // 给予选中的奖励
      switch (selectedReward.type) {
        case RewardType.GOLD:
          gainGold(selectedReward.amount);
          break;
          
        case RewardType.EQUIPMENT:
          const newInventory = [...player.inventory, {
            id: selectedReward.item.id,
            name: selectedReward.item.name,
            type: 'equipment' as any,
            quantity: 1,
            equipmentType: selectedReward.item.type,
            stats: selectedReward.item.stats,
            rarity: selectedReward.item.rarity,
            level: selectedReward.item.level || 1,
            stars: selectedReward.item.stars || 0,
            baseStats: selectedReward.item.baseStats || selectedReward.item.stats
          }];
          updatePlayer({ inventory: newInventory });
          break;
          
        case RewardType.HEALTH_POTION:
          const potionLevel = selectedReward.item.level;
          const existingPotionIndex = player.inventory.findIndex(
            item => item.type === 'health_potion' && item.level === potionLevel
          );
          
          if (existingPotionIndex >= 0) {
            const updatedInventory = [...player.inventory];
            const existingPotion = updatedInventory[existingPotionIndex];
            updatedInventory[existingPotionIndex] = {
              ...existingPotion,
              quantity: existingPotion.quantity + selectedReward.amount,
              name: selectedReward.item.name, // 更新名称为统一格式
              effect: selectedReward.item.effect // 确保效果值正确
            };
            updatePlayer({ inventory: updatedInventory });
          } else {
            const newPotionItem = {
              id: selectedReward.item.id,
              name: selectedReward.item.name,
              type: 'health_potion' as any,
              quantity: selectedReward.amount,
              level: selectedReward.item.level,
              effect: selectedReward.item.effect
            };
            const newInventoryWithPotion = [...player.inventory, newPotionItem];
            updatePlayer({ inventory: newInventoryWithPotion });
          }
          break;
          
        case RewardType.PET_EGG:
          const newInventoryWithEgg = [...player.inventory, {
            id: selectedReward.item.id,
            name: selectedReward.item.name,
            type: 'pet_egg' as any,
            quantity: selectedReward.amount,
            level: selectedReward.item.level
          }];
          updatePlayer({ inventory: newInventoryWithEgg });
          break;
          
        case RewardType.JOB_ADVANCEMENT_BOOK:
          const newInventoryWithBook = [...player.inventory, {
            id: selectedReward.item.id,
            name: selectedReward.item.name,
            type: 'job_advancement_book' as any,
            quantity: selectedReward.amount,
            targetJob: selectedReward.item.targetJob
          }];
          updatePlayer({ inventory: newInventoryWithBook });
          break;
      }
      
      setSelectedReward(selectedReward);
      setShowSelection(true);
      // 移除第一个宝箱
      const newTreasureBoxes = currentBoxes.slice(1);
      updatePlayer({ treasureBoxes: newTreasureBoxes });
      setOpeningBox(false);
    }, 1000);
  };
  
  
  const handleCloseRewards = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowSelection(false);
      setSelectedReward(null);
      setIsClosing(false);
    }, 300); // 动画持续时间
  };
  
  
  return (
    <div className="treasure-box-panel">      
      <TreasureBoxTimer />
      
      {/* 显示宝箱信息 */}
      <div className="treasure-box-info">
        {hybridStore.isWeb3Mode ? (
          <>
            <p>总宝箱数: {hybridStore.treasureBoxCount}个</p>
            <p>未开启宝箱: {hybridStore.unopenedBoxCount}个</p>
            <p>待领取宝箱: {hybridStore.claimableBoxes}个</p>
            <p><small>（每小时可领取1个，需要间隔1小时）</small></p>
            <p>金币余额: {hybridStore.goldBalance.toFixed(2)}</p>
            <p>装备NFT: {hybridStore.player?.equipmentBalance || 0}个</p>
          </>
        ) : (
          <>
            <p>拥有宝箱: {Array.isArray(player.treasureBoxes) ? player.treasureBoxes.length : 0}个</p>
            {Array.isArray(player.treasureBoxes) && player.treasureBoxes.length > 0 && (
              <p>下一个宝箱等级: {player.treasureBoxes[0].level}级</p>
            )}
          </>
        )}
        <p>每个宝箱提供随机奖励，等级越高奖励越好！</p>
      </div>
      
      {/* 宝箱列表 */}
      {Array.isArray(player.treasureBoxes) && player.treasureBoxes.length > 0 && (
        <div className="treasure-box-list">
          <h3>宝箱列表</h3>
          <div className="boxes-grid">
            {(() => {
              // 按等级分组并统计数量
              const groupedBoxes = player.treasureBoxes.reduce((acc, box) => {
                const level = box.level;
                if (!acc[level]) {
                  acc[level] = 0;
                }
                acc[level]++;
                return acc;
              }, {} as Record<number, number>);
              
              // 将分组结果转换为数组并排序
              const sortedGroups = Object.entries(groupedBoxes)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([level, count], index) => ({
                  level: parseInt(level),
                  count,
                  isNext: index === 0
                }));
              
              return sortedGroups.map(({ level, count, isNext }) => (
                <div key={level} className="treasure-box-item">
                  <div className="box-icon">
                    📦
                  </div>
                  <span className="box-level">Lv.{level}</span>
                  <span className="box-count">×{count}</span>
                  {isNext && <span className="next-label">下一个</span>}
                </div>
              ));
            })()}
          </div>
        </div>
      )}
      
      <div className="treasure-box-actions">
        <button 
          onClick={handleOpenBox}
          disabled={(() => {
            if (hybridStore.isWeb3Mode) {
              return hybridStore.unopenedBoxCount <= 0 || openingBox || showSelection;
            } else {
              return (Array.isArray(player.treasureBoxes) ? player.treasureBoxes.length : 0) <= 0 || openingBox || showSelection;
            }
          })()}
          className="open-box-btn"
        >
          {openingBox ? '开启中...' : '开启宝箱'}
        </button>
      </div>
      
      {showSelection && selectedReward && (
        <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleCloseRewards}>
          <div className={`reward-modal ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎉 获得奖励</h3>
              <button className="close-btn" onClick={handleCloseRewards}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="reward-content">
                <div className="reward-icon">
                  {selectedReward.type === 'Web3' && (
                    <div className="reward-item-icon web3">
                      <span style={{ fontSize: '48px' }}>🎁</span>
                    </div>
                  )}
                  {selectedReward.type === RewardType.EQUIPMENT && (
                    <div 
                      className="reward-item-icon"
                      style={{ backgroundColor: getRarityColor(selectedReward.item.rarity) }}
                    >
                      <img 
                        src={getEquipmentImage(selectedReward.item.type)} 
                        alt={selectedReward.item.name}
                        style={{ width: '48px', height: '48px' }}
                      />
                      <span className="equipment-level">lv{selectedReward.item.level}</span>
                    </div>
                  )}
                  {selectedReward.type === RewardType.HEALTH_POTION && (
                    <div className="reward-item-icon">
                      <img 
                        src={getItemImage('health_potion')} 
                        alt="血瓶"
                        style={{ width: '48px', height: '48px' }}
                      />
                      <span className="item-quantity">×{selectedReward.amount}</span>
                    </div>
                  )}
                  {selectedReward.type === RewardType.PET_EGG && (
                    <div className="reward-item-icon">
                      <img 
                        src={getItemImage('pet_egg')} 
                        alt="宠物蛋"
                        style={{ width: '48px', height: '48px' }}
                      />
                      <span className="item-level">lv{selectedReward.item.level}</span>
                    </div>
                  )}
                  {selectedReward.type === RewardType.GOLD && (
                    <div className="reward-item-icon gold">
                      <span style={{ fontSize: '32px' }}>💰</span>
                      <span className="item-quantity">×{selectedReward.amount}</span>
                    </div>
                  )}
                </div>
                
                <div className="reward-details">
                  <span className="reward-description">{selectedReward.description}</span>
                  {selectedReward.type === 'Web3' && (
                    <div className="web3-reward-info">
                      <p>🎉 开箱成功！</p>
                      <p>奖励已自动发放到您的账户</p>
                      <p>请查看金币余额和装备变化</p>
                    </div>
                  )}
                  {selectedReward.type === RewardType.EQUIPMENT && (
                    <div className="equipment-stats">
                      <div className="stats">
                        {selectedReward.item.stats.attack > 0 && <span>攻击+{selectedReward.item.stats.attack}</span>}
                        {selectedReward.item.stats.defense > 0 && <span>防御+{selectedReward.item.stats.defense}</span>}
                        {selectedReward.item.stats.health > 0 && <span>血量+{selectedReward.item.stats.health}</span>}
                        {selectedReward.item.stats.agility > 0 && <span>敏捷+{selectedReward.item.stats.agility}</span>}
                        {selectedReward.item.stats.criticalRate > 0 && <span>暴击率+{selectedReward.item.stats.criticalRate}%</span>}
                        {selectedReward.item.stats.criticalDamage > 0 && <span>暴击伤害+{selectedReward.item.stats.criticalDamage}%</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="confirm-btn"
                onClick={handleCloseRewards}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="treasure-box-sources">
        <h3>宝箱获取方式:</h3>
        <ul>
          <li>每{GAME_CONFIG.TREASURE_BOX.AUTO_GAIN_INTERVAL}秒自动获得 1 个</li>
          <li>击杀怪物获得 1 个 (等级与森林层级对应)</li>
        </ul>
      </div>
    </div>
  );
};

export default TreasureBox;