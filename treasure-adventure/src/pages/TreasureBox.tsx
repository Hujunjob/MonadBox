import React, { useState, useCallback } from 'react';
import { useHybridGameStore } from '../store/web3GameStore';
import { getEquipmentImage, getItemImage, getRarityColor } from '../utils/gameUtils';
import { RewardType } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';

const TreasureBox: React.FC = () => {
  const hybridStore = useHybridGameStore();
  const player = hybridStore.player;
  // const { showToast } = useToast();

  // 处理领取宝箱
  const handleClaimTreasureBox = async () => {
    await hybridStore.claimTreasureBoxes();
  };

  // 获取可领取宝箱数量
  const claimableCount = hybridStore.claimableBoxes
  const [openingBox, setOpeningBox] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [isClosing, setIsClosing] = useState(false);
  // const [boxCount, setBoxCount, countPerUser] = useStateTogetherWithPerUserValues('treasure-box', 0)

  // 使用 useCallback 防止回调函数重复创建
  const handleReward = useCallback((reward: any) => {
    console.log('handleReward被调用:', reward);
    // 交易确认后显示真实奖励信息
    setSelectedReward({
      type: 'Web3',
      description: reward.description,
      rewardData: reward.rewardData
    });
    setShowSelection(true);
    setOpeningBox(false); // 交易确认后才停止加载状态
  }, []);

  const handleOpenBox = async () => {
    // Web3模式：调用智能合约开箱
    if (hybridStore.treasureBoxCount <= 0 || openingBox) return;

    setOpeningBox(true);
    try {
      // 调用Web3开箱函数 - 自动选择第一个未开启的宝箱
      await hybridStore.openTreasureBox?.(undefined, handleReward);
    } catch (error) {
      console.error('Web3开箱失败:', error);
      setOpeningBox(false);
    }
    // 注意：不在这里设置 setOpeningBox(false)，因为要等待交易确认
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
      <div className="treasure-box-timer">
        <button
          onClick={handleClaimTreasureBox}
          style={{
            backgroundColor: claimableCount > 0 ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            if (claimableCount > 0) {
              e.currentTarget.style.backgroundColor = '#218838';
              e.currentTarget.style.transform = 'translateY(-1px)';
            } else {
              e.currentTarget.style.backgroundColor = '#5a6268';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseOut={(e) => {
            if (claimableCount > 0) {
              e.currentTarget.style.backgroundColor = '#28a745';
            } else {
              e.currentTarget.style.backgroundColor = '#6c757d';
            }
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          📦 领取宝箱 ({claimableCount})
        </button>
      </div>

      {/* 显示宝箱信息 */}
      <div className="treasure-box-info">
        <>
          <p>总宝箱数: {hybridStore.treasureBoxCount}个</p>
          <p>待领取宝箱: {hybridStore.claimableBoxes}个</p>
        </>
      </div>

      {/* 宝箱列表 */}
      {Array.isArray(player.treasureBoxes) && player.treasureBoxes.length > 0 && (
        <div className="treasure-box-list">
          <h3>宝箱列表</h3>
          <div className="boxes-grid">
            {(() => {
              // 按等级分组并统计数量
              const groupedBoxes = player.treasureBoxes.reduce((acc: any, box: any) => {
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

              return sortedGroups.map(({ level, count, isNext }: any) => (
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
            return hybridStore.treasureBoxCount <= 0 || openingBox || showSelection;
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
              <h3>🎉 开箱结果</h3>
              <button className="close-btn" onClick={handleCloseRewards}>×</button>
            </div>

            <div className="modal-content">
              <div className="reward-content">
                <div className="reward-icon">
                  {selectedReward.type === 'Web3' && selectedReward.rewardData && (
                    <div className="reward-item-icon web3">
                      {/* 金币奖励 */}
                      {selectedReward.rewardData.rewardType === 0 && (
                        <div className="reward-item-icon gold">
                          <img
                            src="/assets/gold.png"
                            alt="金币"
                            style={{ width: '48px', height: '48px' }}
                            onError={(e) => {
                              // 如果金币图片不存在，使用emoji
                              e.currentTarget.style.display = 'none';
                              const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                              if (nextSibling) {
                                nextSibling.style.display = 'block';
                              }
                            }}
                          />
                          <span style={{ fontSize: '48px', display: 'none' }}>💰</span>
                        </div>
                      )}
                      {/* 装备奖励 */}
                      {selectedReward.rewardData.rewardType === 1 && (
                        <div
                          className="reward-item-icon equipment"
                          style={{
                            backgroundColor: selectedReward.rewardData.equipmentDetails
                              ? (() => {
                                const rarityColors = ['#9ca3af', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];
                                return rarityColors[selectedReward.rewardData.equipmentDetails.rarity] || '#9ca3af';
                              })()
                              : '#9ca3af'
                          }}
                        >
                          {selectedReward.rewardData.equipmentDetails ? (
                            <img
                              src={getEquipmentImage(selectedReward.rewardData.equipmentDetails.equipmentType)}
                              alt="装备"
                              style={{ width: '48px', height: '48px' }}
                            />
                          ) : (
                            // 显示加载状态或默认装备图标，直到装备详情加载完成
                            <div style={{
                              width: '48px',
                              height: '48px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '24px'
                            }}>
                              ⚔️
                            </div>
                          )}
                          <span className="equipment-level">Lv.{selectedReward.rewardData.itemLevel}</span>
                        </div>
                      )}
                      {/* 血瓶奖励 */}
                      {selectedReward.rewardData.rewardType === 2 && (
                        <div className="reward-item-icon">
                          <img
                            src={getItemImage('health_potion')}
                            alt="血瓶"
                            style={{ width: '48px', height: '48px' }}
                          />
                          <span className="item-level">Lv.{selectedReward.rewardData.itemLevel}</span>
                        </div>
                      )}
                      {/* 宠物蛋奖励 */}
                      {selectedReward.rewardData.rewardType === 3 && (
                        <div className="reward-item-icon">
                          <img
                            src={getItemImage('pet_egg')}
                            alt="宠物蛋"
                            style={{ width: '48px', height: '48px' }}
                          />
                          <span className="item-level">Lv.{selectedReward.rewardData.itemLevel}</span>
                        </div>
                      )}
                      {/* 转职书奖励 */}
                      {selectedReward.rewardData.rewardType === 4 && (
                        <div className="reward-item-icon">
                          <img
                            src={getItemImage('job_advancement_book')}
                            alt="转职书"
                            style={{ width: '48px', height: '48px' }}
                          />
                        </div>
                      )}
                      {/* 默认情况 */}
                      {![0, 1, 2, 3, 4].includes(selectedReward.rewardData.rewardType) && (
                        <span style={{ fontSize: '48px' }}>🎁</span>
                      )}
                    </div>
                  )}
                  {selectedReward.type === 'Web3' && !selectedReward.rewardData && (
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
                      {selectedReward.rewardData && (
                        <div className="detailed-reward-info">
                          {selectedReward.rewardData.rewardType === 0 && (
                            <div className="gold-reward-details">
                              <p><strong>💰 金币奖励</strong></p>
                              <p>数量: {(Number(selectedReward.rewardData.goldAmount) / 1e18).toFixed(2)} 金币</p>
                            </div>
                          )}
                          {selectedReward.rewardData.rewardType === 1 && (
                            <div className="equipment-reward-details">
                              {/* 显示装备详细属性 */}
                              {selectedReward.rewardData.equipmentDetails && (

                                <div className="equipment-stats-details">
                                  {/* <div className="equipment-rarity-display">
                                    <span>稀有度: {(() => {
                                      const rarityNames = ['普通', '不凡', '稀有', '史诗', '传说'];
                                      return rarityNames[selectedReward.rewardData.equipmentDetails.rarity] || '普通';
                                    })()}</span>
                                  </div> */}
                                  <div className="stats-grid">
                                    {selectedReward.rewardData.equipmentDetails.attack > 0 && (
                                      <span className="stat-item">⚔️ 攻击: +{selectedReward.rewardData.equipmentDetails.attack}</span>
                                    )}
                                    {selectedReward.rewardData.equipmentDetails.defense > 0 && (
                                      <span className="stat-item">🛡️ 防御: +{selectedReward.rewardData.equipmentDetails.defense}</span>
                                    )}
                                    {selectedReward.rewardData.equipmentDetails.health > 0 && (
                                      <span className="stat-item">❤️ 血量: +{selectedReward.rewardData.equipmentDetails.health}</span>
                                    )}
                                    {selectedReward.rewardData.equipmentDetails.agility > 0 && (
                                      <span className="stat-item">💨 敏捷: +{selectedReward.rewardData.equipmentDetails.agility}</span>
                                    )}
                                    {selectedReward.rewardData.equipmentDetails.criticalRate > 0 && (
                                      <span className="stat-item">💥 暴击率: +{selectedReward.rewardData.equipmentDetails.criticalRate}%</span>
                                    )}
                                    {selectedReward.rewardData.equipmentDetails.criticalDamage > 0 && (
                                      <span className="stat-item">💢 暴击伤害: +{selectedReward.rewardData.equipmentDetails.criticalDamage}%</span>
                                    )}
                                  </div>
                                  
                                </div>

                              )}

                              {!selectedReward.rewardData.equipmentDetails && (
                                <p className="reward-tip">请前往背包查看详细属性</p>
                              )}
                            </div>
                          )}
                          {selectedReward.rewardData.rewardType === 2 && (
                            <div className="potion-reward-details">
                              <p>治疗量: {selectedReward.rewardData.healAmount} HP</p>
                            </div>
                          )}
                          {selectedReward.rewardData.rewardType === 3 && (
                            <div className="pet-egg-reward-details">
                              {/* <p>名称: {selectedReward.rewardData.itemName}</p>
                              <p>等级: Lv.{selectedReward.rewardData.itemLevel}</p> */}
                            </div>
                          )}
                          {selectedReward.rewardData.rewardType === 4 && (
                            <div className="job-book-reward-details">
                              {/* <p>名称: {selectedReward.rewardData.itemName}</p> */}
                              <p>使用后可进行职业转职</p>
                            </div>
                          )}
                        </div>
                      )}
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
          <li>宝箱是金币、装备、血瓶等的唯一来源</li>
        </ul>
      </div>
    </div>
  );
};

export default TreasureBox;