/**
 * 背包服务（重构版）
 * 现在通过 itemsStore 统一管理背包数据
 * 保留静态方法以向后兼容
 * 添加防抖保存机制，优化性能
 */
import { storageService as storageServiceSingleton } from './StorageService'
import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store'
import PlayerStatsService from '@/services/PlayerStatsService'
import { debounce } from '@/utils/debounce'
import { Player } from '@/models/Player'

/**
 * 派发背包刷新事件（用于背包面板打开时的即时刷新）
 * @returns {void}
 */
const dispatchBagUpdateEvent = () => {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return
  }

  try {
    const updateBagEvent = new CustomEvent('update-bag-ui')
    window.dispatchEvent(updateBagEvent)
  } catch (error) {
    console.error('[BagService] 派发 update-bag-ui 事件失败:', error)
  }
}

/**
 * 派发金币刷新事件（用于金币显示组件即时更新）
 * @param {number} gold - 当前金币数量
 * @returns {void}
 */
const dispatchGoldUpdateEvent = (gold) => {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return
  }

  try {
    const goldUpdateEvent = new CustomEvent('gold-update', { detail: { gold } })
    window.dispatchEvent(goldUpdateEvent)
  } catch (error) {
    console.error('[BagService] 派发 gold-update 事件失败:', error)
  }
}

const isEquipmentSetsAvailable = sets => {
  if (!sets) {
    return false
  }
  if (Array.isArray(sets)) {
    return sets.length > 0
  }
  if (typeof sets === 'object') {
    return Object.keys(sets).length > 0
  }
  return false
}

const resolveEquipmentSets = (gameStore, itemsStore) => {
  if (isEquipmentSetsAvailable(gameStore?.equipmentSets)) {
    return gameStore.equipmentSets
  }
  if (isEquipmentSetsAvailable(itemsStore?.equipmentSets)) {
    return itemsStore.equipmentSets
  }
  return []
}

class BagService {
  constructor (storageService = null) {
    this.storageService = storageService || storageServiceSingleton
    // 创建防抖保存函数（延迟 1000ms）
    this.debouncedSavePlayerData = debounce(() => this._savePlayerDataInternal(), 1000)
  }

  /**
   * 获取 itemsStore 实例
   * @returns {Object} itemsStore 实例
   */
  getItemsStore () {
    return useItemsStore()
  }

  /**
   * 添加物品到背包
   * @param {number} itemId - 物品ID
   * @param {string} itemIcon - 物品图标路径（已废弃，自动从配置获取）
   * @param {number} quantity - 数量
   * @param {boolean} skipSave - 是否跳过保存
   * @returns {boolean} 是否添加成功
   */
  addItemToBag (itemId, itemIcon = null, quantity = 1, skipSave = false) {
    const itemsStore = this.getItemsStore()
    const success = itemsStore.addItemToBag(itemId, quantity)

    if (success && typeof itemIcon === 'string' && itemIcon) {
      for (let i = itemsStore.playerBag.length - 1; i >= 0; i -= 1) {
        const item = itemsStore.playerBag[i]
        if (!item || item.id !== itemId) {
          continue
        }
        const currentIcon = item.icon || ''
        if (!currentIcon || currentIcon.includes('undefined')) {
          item.icon = itemIcon
        }
        break
      }
    }

    if (!skipSave && success) {
      // 使用防抖保存
      this.debouncedSavePlayerData()
    }

    if (success) {
      dispatchBagUpdateEvent()
    }

    return success
  }

  /**
   * 添加大批量物品到背包
   * @param {Array} items - 物品数组 [{itemId, quantity, icon}]
   * @returns {boolean} 是否全部添加成功
   */
  static addItemsToBag (items) {
 
    if (!items || items.length === 0) {
      return false
    }

    const itemsStore = useItemsStore()
    let allSuccess = true
    let anySuccess = false

    // 遍历所有物品，添加到背包
    items.forEach(item => {
      const { itemId, quantity = 1 } = item
      const success = itemsStore.addItemToBag(itemId, quantity)
      if (!success) {
        allSuccess = false
      } else {
        anySuccess = true
      }
    })

    // 保存玩家数据（批量操作立即保存）
    const storageService = storageServiceSingleton
    storageService.savePlayerPatch({ bag: [...itemsStore.playerBag] })

    if (anySuccess) {
      dispatchBagUpdateEvent()
    }

    return allSuccess
  }

  /**
   * 从背包中移除物品
   * 参考 DecomposeModal 的处理方式：只操作 store，不进行存储操作
   * @param {number} itemId - 物品ID
   * @param {number} quantity - 移除数量
   * @returns {boolean} 是否移除成功
   */
  static removeItemFromBag (itemId, quantity = 1) {
    const itemsStore = useItemsStore()
    const success = itemsStore.removeItemFromBag(itemId, quantity)

    if (success) {
      // 只派发事件更新 UI，不进行存储操作
      dispatchBagUpdateEvent()
    }

    return success
  }

  /**
   * 出售物品
   * 更新 store 并保存到 localStorage
   * @param {number|object} itemOrId - 物品ID或物品实例
   * @param {number} quantity - 出售数量
   * @returns {number} 出售获得的金币数量，-1表示失败
   */
  static sellItem (itemOrId, quantity = 1) {
    const itemsStore = useItemsStore()
    const gameStore = useGameStore()
    const resolvedItem = itemOrId && typeof itemOrId === 'object' ? itemOrId : null
    const itemId = resolvedItem ? resolvedItem.id : itemOrId
    const sellAmount = itemsStore.sellItem(itemId, quantity, {
      uniqueId: resolvedItem?.uniqueId ?? null,
      item: resolvedItem
    })

    if (sellAmount >= 0) {
      // 派发金币更新事件
      dispatchGoldUpdateEvent(itemsStore.playerGold)
      
      // 同步更新 gameStore.player 的背包和金币
      if (gameStore?.player) {
        gameStore.player.bag = [...itemsStore.playerBag]
        gameStore.player.gold = itemsStore.playerGold
      }
      
      // 保存到 localStorage 以确保持久化
      const storageService = storageServiceSingleton
      storageService.savePlayerPatch({
        bag: [...itemsStore.playerBag],
        gold: itemsStore.playerGold
      })
    }

    return sellAmount
  }

  static organizeBag () {
    const itemsStore = useItemsStore()
    try {
      if (typeof itemsStore.organizeBag === 'function') {
        itemsStore.organizeBag()
      } else {
        const resolveStackCount = item => {
          const raw = item?.currentStack ?? item?.quantity ?? item?.stack ?? 1
          const count = Number(raw)
          return Number.isFinite(count) && count > 0 ? Math.floor(count) : 1
        }

        const resolveUnitSellPrice = item => {
          const itemId = Number(item?.id)
          if (!Number.isFinite(itemId) || itemId <= 0) {
            return 0
          }
          const instanceSellPrice = Number(item?.sellPrice)
          if (Number.isFinite(instanceSellPrice)) {
            return Math.max(0, Math.floor(instanceSellPrice))
          }
          const itemConfig = itemsStore.getItemConfig(itemId)
          if (!itemConfig) {
            return 0
          }
          const configSellPrice = Number(itemConfig?.sellPrice)
          if (Number.isFinite(configSellPrice) && configSellPrice > 0) {
            return Math.max(0, Math.floor(configSellPrice))
          }
          const buyPrice = Number(itemConfig?.buyPrice ?? 0)
          if (Number.isFinite(buyPrice) && buyPrice > 0) {
            return Math.max(0, Math.floor(buyPrice / 4))
          }
          return 0
        }

        const isMergeable = (item, itemConfig) => {
          if (!item) {
            return false
          }
          if (item.uniqueId !== undefined && item.uniqueId !== null && String(item.uniqueId)) {
            return false
          }
          if (item.StrengthenedAttributes || item.PerforationAttributes || item.pet_data) {
            return false
          }
          if (item.enhanceLevel !== undefined && item.enhanceLevel !== null) {
            return false
          }
          const maxStack = Number(itemConfig?.stack ?? item?.stack ?? 1)
          return Number.isFinite(maxStack) && maxStack > 1
        }

        const mergeGroups = new Map()
        const kept = []

        itemsStore.playerBag.forEach(item => {
          if (!item) {
            return
          }
          const itemId = Number(item.id)
          if (!Number.isFinite(itemId) || itemId <= 0) {
            kept.push({ ...item })
            return
          }
          const itemConfig = itemsStore.getItemConfig(itemId)
          if (!isMergeable(item, itemConfig)) {
            kept.push({ ...item })
            return
          }
          const entry = mergeGroups.get(itemId)
          const count = resolveStackCount(item)
          if (entry) {
            entry.total += count
            return
          }
          mergeGroups.set(itemId, { sample: item, config: itemConfig, total: count })
        })

        const merged = []
        mergeGroups.forEach(entry => {
          const maxStack = Math.max(1, Number(entry?.config?.stack ?? entry?.sample?.stack ?? 1))
          const safeMaxStack = Number.isFinite(maxStack) ? Math.max(1, Math.floor(maxStack)) : 1
          let remaining = Math.max(0, Math.floor(Number(entry?.total ?? 0)))
          if (!remaining) {
            return
          }
          while (remaining > 0) {
            const chunk = Math.min(remaining, safeMaxStack)
            merged.push({
              ...entry.sample,
              currentStack: chunk
            })
            remaining -= chunk
          }
        })

        const nextBag = [...kept, ...merged]
        nextBag.sort((a, b) => {
          const priceB = resolveUnitSellPrice(b)
          const priceA = resolveUnitSellPrice(a)
          if (priceB !== priceA) {
            return priceB - priceA
          }
          const idA = Number(a?.id)
          const idB = Number(b?.id)
          if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) {
            return idA - idB
          }
          return 0
        })

        const isBagFull = nextBag.length >= itemsStore.bagCapacity
        itemsStore.$patch((state) => {
          state.playerBag = nextBag
          state.isBagFull = isBagFull
        })
      }
    } catch (error) {
      console.error('[BagService] 整理背包失败:', error)
      try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(
            new CustomEvent('show-message', {
              detail: {
                message: '整理背包失败，请稍后重试',
                type: 'error'
              }
            })
          )
        }
      } catch (innerError) {
        console.error('[BagService] 整理背包失败提示派发失败:', innerError)
      }
      return
    }

    try {
      const storageService = storageServiceSingleton
      setTimeout(() => {
        storageService.savePlayerPatch({ bag: [...itemsStore.playerBag] })
      }, 0)
    } catch (error) {
      console.error('[BagService] 整理背包保存失败:', error)
    }

    dispatchBagUpdateEvent()
  }

  /**
   * 装备物品
   * @param {number} itemId - 物品ID
   * @param {string} slotId - 装备槽ID
   * @returns {boolean} 是否装备成功
   */
  static equipItem (itemId, slotId, options = {}) {
    const itemsStore = useItemsStore()
    const success = itemsStore.equipItem(itemId, slotId, options)

    if (success) {
      const gameStore = useGameStore()
      const storageService = storageServiceSingleton

      // 直接使用 gameStore.player 重新计算属性（不再调用 async loadPlayerData）
      const playerRef = gameStore.player
      if (playerRef) {
        playerRef.equipment = { ...itemsStore.equipment }
        playerRef.bag = [...itemsStore.playerBag]

        if (typeof playerRef.applyFinalStats === 'function') {
          playerRef.applyFinalStats(resolveEquipmentSets(gameStore, itemsStore))
        }

        gameStore.equipment = { ...itemsStore.equipment }

        // 使用补丁保存，只保存 bag 和 equipment，避免触发后端存档覆盖保护
        storageService.savePlayerPatch({
          bag: [...itemsStore.playerBag],
          equipment: itemsStore.equipment ? { ...itemsStore.equipment } : {}
        })
      }
    }

    return success
  }

  /**
   * 卸下装备（从 equipmentBag）
   * @param {string} slotId - 装备槽ID
   * @returns {boolean} 是否卸下成功
   */
  static unequipItem (slotId) {
    // 注意：此方法已废弃，请使用 unequipFromEquipment
    console.warn('[BagService] unequipItem 方法已废弃，请使用 unequipFromEquipment')
    return BagService.unequipFromEquipment(slotId)
  }

  /**
   * 从equipment对象中卸下装备
   * @param {string} slotId - 装备槽ID
   * @returns {boolean} 是否卸下成功
   */
  static unequipFromEquipment (slotId) {
    const itemsStore = useItemsStore()
    const success = itemsStore.unequipItem(slotId)

    if (success) {
      const gameStore = useGameStore()
      const storageService = storageServiceSingleton

      // 直接使用 gameStore.player 重新计算属性（不再调用 async loadPlayerData）
      const playerRef = gameStore.player
      if (playerRef) {
        playerRef.equipment = { ...itemsStore.equipment }
        playerRef.bag = [...itemsStore.playerBag]

        if (typeof playerRef.applyFinalStats === 'function') {
          playerRef.applyFinalStats(resolveEquipmentSets(gameStore, itemsStore))
        }

        gameStore.equipment = { ...itemsStore.equipment }

        // 使用补丁保存，只保存 bag 和 equipment，避免触发后端存档覆盖保护
        storageService.savePlayerPatch({
          bag: [...itemsStore.playerBag],
          equipment: itemsStore.equipment ? { ...itemsStore.equipment } : {}
        })
      }
    }

    return success
  }

  /**
   * 检查背包是否已满
   * @returns {boolean} 背包是否已满
   */
  static isBagFull () {
    const itemsStore = useItemsStore()
    return itemsStore.isBagFull
  }

  /**
   * 获取背包使用情况
   * @returns {Object} 背包使用情况 {used, available, total, percentage}
   */
  static getBagUsage () {
    const itemsStore = useItemsStore()
    return {
      used: itemsStore.usedSlots,
      available: itemsStore.availableSlots,
      total: itemsStore.bagCapacity,
      percentage: itemsStore.bagUsageRate
    }
  }

  /**
   * 更新背包容量
   * @param {number} level - 玩家等级
   */
  static updateBagCapacity (level) {
    const itemsStore = useItemsStore()
    itemsStore.updateBagCapacity(level)

    // 同步到 player
    const storageService = storageServiceSingleton
    storageService.savePlayerPatch({ availableBagSlots: itemsStore.bagCapacity })
  }

  /**
   * 获取背包物品列表
   * @returns {Array} 背包物品列表
   */
  static getBagItems () {
    const itemsStore = useItemsStore()
    return itemsStore.getBagItems()
  }

  /**
   * 获取装备背包物品列表（已废弃，使用 itemsStore.equipment）
   * @returns {Array} 装备背包物品列表
   */
  static getEquipmentBagItems () {
    console.warn('[BagService] getEquipmentBagItems 已废弃，请使用 itemsStore.equipment')
    return []
  }

  /**
   * 清空背包
   * @returns {boolean} 是否清空成功
   */
  clearBag () {
    const itemsStore = this.getItemsStore()
    itemsStore.clearBag()

    // 使用防抖保存
    this.debouncedSavePlayerData()

    return true
  }

  /**
   * 根据ID查找背包中的物品
   * @param {number} itemId - 物品ID
   * @returns {Object|null} 物品对象或null
   */
  static findItemInBag (itemId) {
    const itemsStore = useItemsStore()
    return itemsStore.findItemInBag(itemId)
  }

  /**
   * 获取指定物品在背包中的总数量
   * @param {number} itemId - 物品ID
   * @returns {number} 物品总数量
   */
  static getItemCount (itemId) {
    const itemsStore = useItemsStore()
    return itemsStore.getItemCount(itemId)
  }

  /**
   * 根据类别筛选背包物品
   * @param {string} category - 物品类别
   * @returns {Array} 筛选后的物品列表
   */
  static filterBagItemsByCategory (category) {
    const itemsStore = useItemsStore()
    return itemsStore.getBagItemsByCategory(category)
  }

  /**
   * 根据稀有度筛选背包物品
   * @param {string} rarity - 物品稀有度
   * @returns {Array} 筛选后的物品列表
   */
  static filterBagItemsByRarity (rarity) {
    const itemsStore = useItemsStore()
    return itemsStore.getBagItemsByRarity(rarity)
  }

  /**
   * 保存玩家数据到 localStorage（内部实现）
   */
  _savePlayerDataInternal () {
    const storageService = storageServiceSingleton
    const itemsStore = this.getItemsStore()
    storageService.savePlayerPatch({
      bag: [...itemsStore.playerBag],
      equipment: { ...itemsStore.equipment }
    })
  }

  /**
   * 立即保存玩家数据到 localStorage（跳过防抖）
   * （辅助方法，用于同步 itemsStore 的变更到 player）
   */
  savePlayerData () {
    // 取消防抖，立即保存
    this.debouncedSavePlayerData.cancel()
    this._savePlayerDataInternal()
  }

  /**
   * 获取防抖保存函数
   * @returns {Function} 防抖保存函数
   */
  getDebouncedSave () {
    return this.debouncedSavePlayerData
  }

  /**
   * 从 StorageService 同步背包数据到 itemsStore
   * （用于初始化时从 localStorage 加载数据）
   */
  /**
   * 从 StorageService 异步加载背包数据并同步到 itemsStore
   * 修复：loadPlayerData() 是 async 方法，必须 await 等待结果
   * 否则 player 为 Promise 对象，player.bag 为 undefined，导致背包被清空
   * @returns {Promise<void>}
   */
  async syncFromStorage () {
    const player = await this.storageService.loadPlayerData()
    if (player) {
      const itemsStore = this.getItemsStore()
      itemsStore.playerBag = player.bag || []
      itemsStore.equipment = player.equipment || {
        weapon: null,
        shield: null,
        helmet: null,
        armor: null,
        gloves: null,
        boots: null,
        necklace: null,
        ring1: null,
        ring2: null,
        earring1: null,
        earring2: null
      }
      if (player.availableBagSlots) {
        itemsStore.bagCapacity = player.availableBagSlots
      }
    }
  }
}

export default BagService
