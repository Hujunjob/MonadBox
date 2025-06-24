import React, { useEffect, useState } from 'react';
import { useHybridGameStore } from '../store/web3GameStore';
import { useMarket } from '../hooks/useMarket';
import { getEquipmentImage, getItemImage, getRarityColor } from '../utils/gameUtils';
import { formatEther } from 'viem';

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

const Market: React.FC = () => {
  const hybridStore = useHybridGameStore();
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const itemsPerPage = 20;
  
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
  const listings = activeTab === 'all' ? (activeListings || []) : (playerListings || []);
  const totalCount = activeTab === 'all' ? Number(totalActiveListings || 0n) : listings.length;

  const handlePurchase = async (listing: MarketListing) => {
    if (!player) {
      alert('请先连接钱包并创建角色');
      return;
    }

    try {
      if (listing.listingType === 0) { // EQUIPMENT
        await buyEquipment(Number(listing.listingId), player.id);
      } else { // ITEM
        await buyItem(Number(listing.listingId), player.id, Number(listing.quantity));
      }
      
      // alert('购买成功！');
      // 刷新列表
      refetchActiveListings();
      refetchPlayerListings();
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('购买失败：' + (error as Error).message);
    }
  };

  const handleCancelListing = async (listing: MarketListing) => {
    if (!player) {
      alert('请先连接钱包并创建角色');
      return;
    }

    try {
      await cancelListingById(Number(listing.listingId));
      alert('取消挂单成功！');
      // 刷新列表
      refetchActiveListings();
      refetchPlayerListings();
    } catch (error) {
      console.error('Cancel listing failed:', error);
      alert('取消挂单失败：' + (error as Error).message);
    }
  };

  const getItemInfo = (listing: MarketListing) => {
    if (listing.listingType === 0) { // EQUIPMENT
      // TODO: 从合约获取装备信息
      return {
        name: `装备 #${listing.tokenId}`,
        image: getEquipmentImage('weapon'),
        rarity: 'common'
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
      <h2>市场</h2>
      
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
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>加载中...</p>
        </div>
      ) : (
        <>
          <div className="market-stats">
            <p>{activeTab === 'all' ? `共 ${totalCount} 个挂单` : `我的挂单: ${totalCount} 个`}</p>
          </div>
          
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
                          style={{ width: '48px', height: '48px' }}
                        />
                        <div className="item-info">
                          <h4>{itemInfo.name}</h4>
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
                      
                      <div className="listing-seller">
                        <span>卖家: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}</span>
                      </div>
                      
                      {activeTab === 'all' ? (
                        <button 
                          className="purchase-btn"
                          onClick={() => handlePurchase(listing)}
                          disabled={!player || isPurchasingEquipment || isPurchasingItem || Number(formatEther(listing.price)) > player.goldBalance}
                        >
                          {!player ? '请先连接钱包' : 
                           (isPurchasingEquipment || isPurchasingItem) ? '购买中...' :
                           Number(formatEther(listing.price)) > player.goldBalance ? '金币不足' : '购买'}
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