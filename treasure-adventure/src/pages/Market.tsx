import React, { useEffect, useState } from 'react';
import { useHybridGameStore } from '../store/web3GameStore';
import { useMarket } from '../hooks/useMarket';
import { getEquipmentImage, getItemImage, getRarityColor, getEquipmentTypeString } from '../utils/gameUtils';
import { formatEther } from 'viem';
import { useAccount, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES, EQUIPMENT_NFT_ABI } from '../contracts';
import { useToast } from '../components/ToastManager';

interface MarketListing {
  listingId: bigint;
  seller: string;
  playerId: bigint;
  tokenId: bigint;
  price: bigint;
  quantity: bigint;
  listingType: number;
  active: boolean;
  createdAt: bigint;
}

interface EquipmentDetails {
  name: string;
  equipmentType: number;
  level: number;
  stars: number;
  rarity: number;
  attack: number;
  defense: number;
  agility: number;
  criticalRate: number;
  criticalDamage: number;
}

const Market: React.FC = () => {
  const hybridStore = useHybridGameStore();
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [equipmentCache, setEquipmentCache] = useState<Map<string, EquipmentDetails>>(new Map());
  const [selectedItemType, setSelectedItemType] = useState<string>('all');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortByPrice, setSortByPrice] = useState<boolean>(false);
  const itemsPerPage = 20;
  const publicClient = usePublicClient();
  const { showToast } = useToast();
  const {address} = useAccount();
  
  const player = hybridStore.player;
  const { 
    activeListings, 
    totalActiveListings, 
    playerListings,
    buyEquipment, 
    buyItem, 
    cancelListingById,
    isPurchasingEquipment, 
    isPurchasingItem,
    isCancellingListing,
    refetchActiveListings,
    refetchPlayerListings
  } = useMarket();

  const loading = false; // Market hook handles loading states
  const rawListings = activeTab === 'all' ? (activeListings || []) : (playerListings || []);
  
  // 过滤和排序逻辑
  const filteredListings = rawListings.filter(listing => {
    // 物品类型过滤
    if (selectedItemType !== 'all') {
      if (selectedItemType === 'equipment' && listing.listingType !== 0) return false;
      if (selectedItemType === 'item' && listing.listingType !== 1) return false;
      if (selectedItemType === 'health_potion') {
        if (listing.listingType !== 1) return false;
        const tokenId = Number(listing.tokenId);
        if (tokenId < 1000 || tokenId >= 2000) return false;
      }
      if (selectedItemType === 'job_advancement_book') {
        if (listing.listingType !== 1) return false;
        const tokenId = Number(listing.tokenId);
        if (tokenId < 2000 || tokenId >= 3000) return false;
      }
      if (selectedItemType === 'pet_egg') {
        if (listing.listingType !== 1) return false;
        const tokenId = Number(listing.tokenId);
        if (tokenId < 3000 || tokenId >= 4000) return false;
      }
    }
    
    // 装备子类型过滤（仅对装备有效）
    if (selectedEquipmentType !== 'all' && listing.listingType === 0) {
      const cacheKey = listing.tokenId.toString();
      const cachedEquipment = equipmentCache.get(cacheKey);
      if (cachedEquipment) {
        const equipmentTypeStr = getEquipmentTypeString(cachedEquipment.equipmentType);
        if (selectedEquipmentType !== equipmentTypeStr) return false;
      }
    }
    
    // 等级过滤（仅对装备有效）
    if (selectedLevel !== 'all' && listing.listingType === 0) {
      const cacheKey = listing.tokenId.toString();
      const cachedEquipment = equipmentCache.get(cacheKey);
      if (cachedEquipment) {
        const level = cachedEquipment.level;
        const targetLevel = parseInt(selectedLevel);
        if (!isNaN(targetLevel) && level !== targetLevel) return false;
      }
    }
    
    // 稀有度过滤（仅对装备有效）
    if (selectedRarity !== 'all' && listing.listingType === 0) {
      const cacheKey = listing.tokenId.toString();
      const cachedEquipment = equipmentCache.get(cacheKey);
      if (cachedEquipment) {
        const rarityNames = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        const rarityName = rarityNames[cachedEquipment.rarity] || 'common';
        if (selectedRarity !== rarityName) return false;
      }
    }
    
    return true;
  });
  
  // 价格排序
  const sortedListings = sortByPrice 
    ? [...filteredListings].sort((a, b) => Number(a.price - b.price))
    : filteredListings;
  
  const listings = sortedListings;
  const totalCount = listings.length;

  const handlePurchase = async (listing: MarketListing) => {
    if (!player) {
      showToast('请先连接钱包并创建角色', 'error');
      return;
    }

    // 检查是否购买自己的商品
    if (listing.seller.toLowerCase() === address?.toLowerCase()) {
      showToast('不能购买自己的商品', 'error');
      return;
    }

    // 检查金币是否足够
    if (Number(formatEther(listing.price)) > player.gold) {
      showToast('金币不足', 'error');
      return;
    }

    try {
      if (listing.listingType === 0) { // EQUIPMENT
        await buyEquipment(Number(listing.listingId), player.id);
        showToast('🎉 装备购买成功！', 'success');
      } else { // ITEM
        await buyItem(Number(listing.listingId), player.id, Number(listing.quantity));
        showToast('🎉 物品购买成功！', 'success');
      }
      
      // 刷新列表
      refetchActiveListings();
      refetchPlayerListings();
    } catch (error) {
      console.error('Purchase failed:', error);
      
      // 将合约错误转换为用户友好的提示
      let errorMessage = '购买失败';
      const errorStr = (error as Error).message;
      
      if (errorStr.includes('Cannot buy your own item')) {
        errorMessage = '不能购买自己的商品';
      } else if (errorStr.includes('Insufficient gold')) {
        errorMessage = '金币不足';
      } else if (errorStr.includes('Listing not active')) {
        errorMessage = '商品已下架或已售出';
      } else if (errorStr.includes('rejected')) {
        errorMessage = '交易被用户取消';
      } else if (errorStr.includes('insufficient funds')) {
        errorMessage = 'Gas 费不足';
      }
      
      showToast(errorMessage, 'error');
    }
  };

  const handleCancelListing = async (listing: MarketListing) => {
    if (!player) {
      showToast('请先连接钱包并创建角色', 'error');
      return;
    }

    try {
      await cancelListingById(Number(listing.listingId));
      showToast('✅ 取消挂单成功！', 'success');
      // 刷新列表
      refetchActiveListings();
      refetchPlayerListings();
    } catch (error) {
      console.error('Cancel listing failed:', error);
      
      // 将合约错误转换为用户友好的提示
      let errorMessage = '取消挂单失败';
      const errorStr = (error as Error).message;
      
      if (errorStr.includes('Not the seller')) {
        errorMessage = '只能取消自己的挂单';
      } else if (errorStr.includes('Listing not active')) {
        errorMessage = '挂单已取消或已售出';
      } else if (errorStr.includes('rejected')) {
        errorMessage = '交易被用户取消';
      } else if (errorStr.includes('insufficient funds')) {
        errorMessage = 'Gas 费不足';
      }
      
      showToast(errorMessage, 'error');
    }
  };

  // 获取装备详细信息
  const fetchEquipmentDetails = async (equipmentId: bigint): Promise<EquipmentDetails | null> => {
    if (!publicClient) return null;
    
    try {
      const data = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.EQUIPMENT_NFT,
        abi: EQUIPMENT_NFT_ABI,
        functionName: 'getEquipment',
        args: [equipmentId]
      }) as any;
      
      return {
        name: data.name || `装备${equipmentId}`,
        equipmentType: Number(data.equipmentType),
        level: Number(data.level),
        stars: Number(data.stars),
        rarity: Number(data.rarity),
        attack: Number(data.attack),
        defense: Number(data.defense),
        agility: Number(data.agility),
        criticalRate: Number(data.criticalRate),
        criticalDamage: Number(data.criticalDamage),
      };
    } catch (error) {
      console.error('Failed to fetch equipment details:', error);
      return null;
    }
  };

  // 获取缓存的装备信息或从合约获取
  const getEquipmentInfo = async (equipmentId: bigint) => {
    const cacheKey = equipmentId.toString();
    
    if (equipmentCache.has(cacheKey)) {
      return equipmentCache.get(cacheKey)!;
    }
    
    const details = await fetchEquipmentDetails(equipmentId);
    if (details) {
      setEquipmentCache(prev => new Map(prev.set(cacheKey, details)));
      return details;
    }
    
    // 返回默认值
    return {
      name: `装备 #${equipmentId}`,
      equipmentType: 3, // weapon
      level: 1,
      stars: 0,
      rarity: 0, // common
      attack: 0,
      defense: 0,
      agility: 0,
      criticalRate: 0,
      criticalDamage: 0,
    };
  };

  const getItemInfo = (listing: MarketListing) => {
    if (listing.listingType === 0) { // EQUIPMENT
      // 从缓存获取装备信息
      const cacheKey = listing.tokenId.toString();
      const cachedEquipment = equipmentCache.get(cacheKey);
      
      if (cachedEquipment) {
        const equipmentTypeStr = getEquipmentTypeString(cachedEquipment.equipmentType);
        const rarityStr = ['common', 'uncommon', 'rare', 'epic', 'legendary'][cachedEquipment.rarity] || 'common';
        return {
          name: cachedEquipment.name,
          image: getEquipmentImage(equipmentTypeStr),
          rarity: rarityStr,
          level: cachedEquipment.level,
          stars: cachedEquipment.stars
        };
      }
      
      // 如果缓存中没有，返回默认值并异步加载
      getEquipmentInfo(listing.tokenId);
      return {
        name: `装备 #${listing.tokenId}`,
        image: getEquipmentImage('weapon'),
        rarity: 'common',
        level: 1,
        stars: 0
      };
    } else { // ITEM
      // 根据物品ID范围判断类型
      const tokenId = Number(listing.tokenId);
      if (tokenId >= 1000 && tokenId < 2000) {
        return {
          name: `血瓶 Lv.${tokenId - 1000 + 1}`,
          image: getItemImage('health_potion'),
          type: 'health_potion'
        };
      } else if (tokenId >= 2000 && tokenId < 3000) {
        return {
          name: `转职书`,
          image: getItemImage('job_advancement_book'),
          type: 'job_advancement_book'
        };
      } else if (tokenId >= 3000 && tokenId < 4000) {
        return {
          name: `宠物蛋`,
          image: getItemImage('pet_egg'),
          type: 'pet_egg'
        };
      }
    }
    return {
      name: `物品 #${listing.tokenId}`,
      image: getItemImage('health_potion'),
      type: 'unknown'
    };
  };

  // 当listings变化时，预加载装备信息
  useEffect(() => {
    const loadEquipmentDetails = async () => {
      if (!publicClient || !listings) return;
      
      const equipmentListings = listings.filter(listing => listing.listingType === 0);
      const uncachedEquipmentIds = equipmentListings
        .map(listing => listing.tokenId)
        .filter(tokenId => !equipmentCache.has(tokenId.toString()));
      
      if (uncachedEquipmentIds.length > 0) {
        // 批量加载装备详情
        for (const equipmentId of uncachedEquipmentIds) {
          getEquipmentInfo(equipmentId);
        }
      }
    };
    
    loadEquipmentDetails();
  }, [listings, publicClient]);

  const formatTime = (timestamp: bigint) => {
    const now = Date.now();
    const diff = now - Number(timestamp) * 1000; // Convert from seconds to milliseconds
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else {
      return '刚刚';
    }
  };

  return (
    <div className="market-panel">
      <h3>市场</h3>
      {/* Tab Navigation */}
      <div className="market-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          所有商品
        </button>
        <button 
          className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          我的物品
        </button>
      </div>
      
      {/* 过滤器 */}
      <div className="market-filters">
        <div className="filter-group">
          <label>物品:</label>
          <select 
            value={selectedItemType} 
            onChange={(e) => {
              setSelectedItemType(e.target.value);
              // 如果不是装备类型，重置装备子类型
              if (e.target.value !== 'all' && e.target.value !== 'equipment') {
                setSelectedEquipmentType('all');
              }
            }}
          >
            <option value="all">全部</option>
            <option value="equipment">装备</option>
            <option value="health_potion">血瓶</option>
            <option value="job_advancement_book">转职书</option>
            <option value="pet_egg">宠物蛋</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>装备:</label>
          <select 
            value={selectedEquipmentType} 
            onChange={(e) => setSelectedEquipmentType(e.target.value)}
            disabled={selectedItemType !== 'all' && selectedItemType !== 'equipment'}
          >
            <option value="all">全部</option>
            <option value="weapon">武器</option>
            <option value="armor">护甲</option>
            <option value="helmet">头盔</option>
            <option value="shield">盾牌</option>
            <option value="shoes">鞋子</option>
            <option value="accessory">饰品</option>
            <option value="ring">戒指</option>
            <option value="pet">宠物</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>等级:</label>
          <select 
            value={selectedLevel} 
            onChange={(e) => setSelectedLevel(e.target.value)}
            disabled={selectedItemType !== 'all' && selectedItemType !== 'equipment'}
          >
            <option value="all">全部</option>
            {Array.from({length: 50}, (_, i) => i + 1).map(level => (
              <option key={level} value={level.toString()}>{level}级</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>稀有度:</label>
          <select 
            value={selectedRarity} 
            onChange={(e) => setSelectedRarity(e.target.value)}
            disabled={selectedItemType !== 'all' && selectedItemType !== 'equipment'}
          >
            <option value="all">全部</option>
            <option value="common">普通</option>
            <option value="uncommon">优秀</option>
            <option value="rare">稀有</option>
            <option value="epic">史诗</option>
            <option value="legendary">传说</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>
            <input 
              type="checkbox" 
              checked={sortByPrice} 
              onChange={(e) => setSortByPrice(e.target.checked)}
            />
            价格从低到高
          </label>
        </div>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>加载中...</p>
        </div>
      ) : (
        <>
          {/* <div className="market-stats">
            <p>{activeTab === 'all' ? `共 ${totalCount} 个挂单` : `我的挂单: ${totalCount} 个`}</p>
          </div> */}
          
          <div className="market-listings">
            {listings.length === 0 ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                color: '#666',
                background: '#f8f9fa',
                borderRadius: '10px',
                margin: '20px 0'
              }}>
                <p>{activeTab === 'all' ? '暂无商品挂单' : '您还没有挂单'}</p>
              </div>
            ) : (
              <div className="listings-grid">
                {listings.map(listing => {
                  const itemInfo = getItemInfo(listing);
                  return (
                    <div key={listing.listingId} className="market-listing-card">
                      <div className="listing-header">
                        <span className="listing-type">
                          {listing.listingType === 0 ? '装备' : '物品'}
                        </span>
                        <span className="listing-time">{formatTime(listing.createdAt)}</span>
                      </div>
                      
                      <div className="listing-item" 
                           style={{
                             backgroundColor: listing.listingType === 0 && itemInfo.rarity 
                               ? getRarityColor(itemInfo.rarity) 
                               : undefined
                           }}>
                        <img 
                          src={itemInfo.image} 
                          alt={itemInfo.name}
                          style={{ width: '24px', height: '24px' }}
                        />
                        <div className="item-info">
                          <h4>{itemInfo.name}</h4>
                          {listing.listingType === 0 && itemInfo.level && (
                            <span className="quantity">Lv.{itemInfo.level} {itemInfo.stars ? `★${itemInfo.stars}` : ''}</span>
                          )}
                          {Number(listing.quantity) > 1 && (
                            <span className="quantity">数量: {Number(listing.quantity)}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="listing-price">
                        <span className="price">{formatEther(listing.price)} 金币</span>
                        {Number(listing.quantity) > 1 && (
                          <span className="unit-price">
                            (单价: {formatEther(listing.price)} 金币)
                          </span>
                        )}
                      </div>
                      
                      {activeTab === 'all' ? (
                        <button 
                          className="purchase-btn"
                          onClick={() => {
                            // 即使按钮禁用，点击自己的商品时也要显示提示
                            if (listing.seller.toLowerCase() === address?.toLowerCase()) {
                              showToast('不能购买自己的商品', 'error');
                              return;
                            }
                            handlePurchase(listing);
                          }}
                          disabled={
                            !player || 
                            isPurchasingEquipment || 
                            isPurchasingItem || 
                            Number(formatEther(listing.price)) > player.gold
                          }
                        >
                          {!player ? '请先连接钱包' : 
                           (isPurchasingEquipment || isPurchasingItem) ? '购买中...' :
                           listing.seller.toLowerCase() === address?.toLowerCase() ? '自己的挂单' :
                           Number(formatEther(listing.price)) > player.gold ? '金币不足' : '购买'}
                        </button>
                      ) : (
                        <div className="my-listing-actions">
                          <button 
                            className={`listing-action-btn ${listing.active ? 'cancel-btn' : 'inactive-btn'}`}
                            onClick={() => handleCancelListing(listing)}
                            disabled={!player || !listing.active || isCancellingListing}
                          >
                            {!player ? '请先连接钱包' : 
                             isCancellingListing ? '取消中...' :
                             !listing.active ? '已取消/已售出' : '取消挂单'}
                          </button>
                          <div className="listing-status">
                            {listing.active ? (
                              <span className="status-active">挂单中</span>
                            ) : (
                              <span className="status-inactive">已完成</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* 分页控件 */}
          {totalCount > itemsPerPage && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                上一页
              </button>
              <span>第 {currentPage + 1} 页</span>
              <button 
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={(currentPage + 1) * itemsPerPage >= totalCount}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Market;