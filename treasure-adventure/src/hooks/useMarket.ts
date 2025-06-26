import { useWriteContract, useReadContract, useAccount } from 'wagmi'
import { CONTRACT_ADDRESSES, MARKET_ABI } from '../contracts'
import { parseEther } from 'viem'

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
  const { data: activeListings, refetch: refetchActiveListings } = useReadContract({
    address: CONTRACT_ADDRESSES.MARKET,
    abi: MARKET_ABI,
    functionName: 'getActiveListings',
    args: [0n, 20n], // offset, limit
  })

  const { data: playerListings, refetch: refetchPlayerListings } = useReadContract({
    address: CONTRACT_ADDRESSES.MARKET,
    abi: MARKET_ABI,
    functionName: 'getPlayerListings',
    args: [1n], // For now using playerId 1, TODO: get actual playerId from player data
    query: { enabled: !!address },
  })

  // 写入合约函数
  const { writeContract, isPending } = useWriteContract()

  const isListingEquipment = isPending
  const isListingItem = isPending
  const isPurchasingEquipment = isPending
  const isPurchasingItem = isPending
  const isCancellingListing = isPending

  // 辅助函数
  const listEquipmentForSale = async (playerId: number, equipmentId: number, priceInGold: number) => {
    const priceInWei = parseEther(priceInGold.toString())
    writeContract({
      address: CONTRACT_ADDRESSES.MARKET,
      abi: MARKET_ABI,
      functionName: 'listEquipment',
      args: [BigInt(playerId), BigInt(equipmentId), priceInWei],
    })
  }

  const listItemForSale = async (playerId: number, itemId: number, quantity: number, priceInGold: number) => {
    const priceInWei = parseEther(priceInGold.toString())
    writeContract({
      address: CONTRACT_ADDRESSES.MARKET,
      abi: MARKET_ABI,
      functionName: 'listItem',
      args: [BigInt(playerId), BigInt(itemId), BigInt(quantity), priceInWei],
    })
  }

  const buyEquipment = async (listingId: number, buyerPlayerId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.MARKET,
      abi: MARKET_ABI,
      functionName: 'purchaseEquipment',
      args: [BigInt(listingId), BigInt(buyerPlayerId)],
    })
  }

  const buyItem = async (listingId: number, buyerPlayerId: number, quantity: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.MARKET,
      abi: MARKET_ABI,
      functionName: 'purchaseItem',
      args: [BigInt(listingId), BigInt(buyerPlayerId), BigInt(quantity)],
    })
  }

  const cancelListingById = async (listingId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.MARKET,
      abi: MARKET_ABI,
      functionName: 'cancelListing',
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