import { useContractWrite, useContractRead, useAccount } from 'wagmi'
import { CONTRACT_ADDRESSES, MARKET_ABI } from '../contracts'
import { parseEther, formatEther } from 'viem'

export interface MarketListing {
  listingId: bigint
  seller: string
  playerId: bigint
  tokenId: bigint
  price: bigint
  quantity: bigint
  listingType: number // 0 = EQUIPMENT, 1 = ITEM
  active: boolean
  createdAt: bigint
}

export function useMarket() {
  const { address } = useAccount()

  // 读取合约函数
  const { data: activeListings, refetch: refetchActiveListings } = useContractRead({
    address: CONTRACT_ADDRESSES.MARKET,
    abi: MARKET_ABI,
    functionName: 'getActiveListings',
    args: [0n, 20n], // offset, limit
  })

  const { data: playerListings, refetch: refetchPlayerListings } = useContractRead({
    address: CONTRACT_ADDRESSES.MARKET,
    abi: MARKET_ABI,
    functionName: 'getPlayerListings',
    args: [1n], // For now using playerId 1, TODO: get actual playerId from player data
    enabled: !!address,
  })

  // 写入合约函数
  const { write: listEquipment, isLoading: isListingEquipment } = useContractWrite({
    address: CONTRACT_ADDRESSES.MARKET,
    abi: MARKET_ABI,
    functionName: 'listEquipment',
  })

  const { write: listItem, isLoading: isListingItem } = useContractWrite({
    address: CONTRACT_ADDRESSES.MARKET,
    abi: MARKET_ABI,
    functionName: 'listItem',
  })

  const { write: purchaseEquipment, isLoading: isPurchasingEquipment } = useContractWrite({
    address: CONTRACT_ADDRESSES.MARKET,
    abi: MARKET_ABI,
    functionName: 'purchaseEquipment',
  })

  const { write: purchaseItem, isLoading: isPurchasingItem } = useContractWrite({
    address: CONTRACT_ADDRESSES.MARKET,
    abi: MARKET_ABI,
    functionName: 'purchaseItem',
  })

  const { write: cancelListing, isLoading: isCancellingListing } = useContractWrite({
    address: CONTRACT_ADDRESSES.MARKET,
    abi: MARKET_ABI,
    functionName: 'cancelListing',
  })

  // 辅助函数
  const listEquipmentForSale = async (playerId: number, equipmentId: number, priceInGold: number) => {
    const priceInWei = parseEther(priceInGold.toString())
    listEquipment({
      args: [BigInt(playerId), BigInt(equipmentId), priceInWei],
    })
  }

  const listItemForSale = async (playerId: number, itemId: number, quantity: number, priceInGold: number) => {
    const priceInWei = parseEther(priceInGold.toString())
    listItem({
      args: [BigInt(playerId), BigInt(itemId), BigInt(quantity), priceInWei],
    })
  }

  const buyEquipment = async (listingId: number, buyerPlayerId: number) => {
    purchaseEquipment({
      args: [BigInt(listingId), BigInt(buyerPlayerId)],
    })
  }

  const buyItem = async (listingId: number, buyerPlayerId: number, quantity: number) => {
    purchaseItem({
      args: [BigInt(listingId), BigInt(buyerPlayerId), BigInt(quantity)],
    })
  }

  const cancelListingById = async (listingId: number) => {
    cancelListing({
      args: [BigInt(listingId)],
    })
  }

  // 格式化数据
  const formatActiveListings = (): MarketListing[] => {
    if (!activeListings || !Array.isArray(activeListings[0])) return []
    
    return activeListings[0].map((listing: any) => ({
      listingId: listing.listingId,
      seller: listing.seller,
      playerId: listing.playerId,
      tokenId: listing.tokenId,
      price: listing.price,
      quantity: listing.quantity,
      listingType: listing.listingType,
      active: listing.active,
      createdAt: listing.createdAt,
    }))
  }

  const formatPlayerListings = (): MarketListing[] => {
    if (!playerListings || !Array.isArray(playerListings)) return []
    
    return playerListings.map((listing: any) => ({
      listingId: listing.listingId,
      seller: listing.seller,
      playerId: listing.playerId,
      tokenId: listing.tokenId,
      price: listing.price,
      quantity: listing.quantity,
      listingType: listing.listingType,
      active: listing.active,
      createdAt: listing.createdAt,
    }))
  }

  return {
    // 数据
    activeListings: formatActiveListings(),
    playerListings: formatPlayerListings(),
    totalActiveListings: activeListings?.[1] || 0n,
    
    // 操作函数
    listEquipmentForSale,
    listItemForSale,
    buyEquipment,
    buyItem,
    cancelListingById,
    
    // 状态
    isListingEquipment,
    isListingItem,
    isPurchasingEquipment,
    isPurchasingItem,
    isCancellingListing,
    
    // 刷新函数
    refetchActiveListings,
    refetchPlayerListings,
  }
}