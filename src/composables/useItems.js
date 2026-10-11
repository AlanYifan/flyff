import { ref, computed } from 'vue'
import BagService from '@/services/BagService'
import { storageService } from '@/services/StorageService'
import { getItemName, getItemDescription } from '@/utils/itemUtils'
import { getRarityName } from '@/utils/itemHelpers'
import { useItemsStore } from '@/store/items'

/**
 * 物品组合式API（重构版）
 * 现在通过 itemsStore 统一管理物品数据
 */
export function useItems () {
  const itemsStore = useItemsStore()

  // 响应式数据
  const bagItems = computed(() => itemsStore.playerBag)
  const filteredItems = ref([])
  const selectedItem = ref(null)
  const showFilter = ref(false)
  const filterCategory = ref('')
  const filterRarity = ref('')

  // 计算属性
  const bagUsage = computed(() => {
    return {
      used: itemsStore.usedSlots,
      available: itemsStore.availableSlots,
      total: itemsStore.bagCapacity,
      percentage: itemsStore.bagUsageRate
    }
  })

  const emptySlots = computed(() => {
    return itemsStore.availableSlots
  })

  const displayedItems = computed(() => {
    if (!showFilter.value) {
      return bagItems.value
    }

    return bagItems.value.filter(item => {
      const matchesCategory = !filterCategory.value || item.category === filterCategory.value
      const matchesRarity = !filterRarity.value || item.rarity === filterRarity.value
      return matchesCategory && matchesRarity
    })
  })

  // 方法
  /**
   * 加载背包物品
   */
  const loadBagItems = () => {
    // bagItems 是 computed 属性，会自动反映 itemsStore.playerBag 的变化
    // 只需要更新 filteredItems
    filteredItems.value = [...itemsStore.playerBag]
    console.log('[useItems] 背包物品已从 itemsStore 加载')
  }

  /**
   * 切换筛选面板
   */
  const toggleFilter = () => {
    showFilter.value = !showFilter.value
    if (!showFilter.value) {
      filterCategory.value = ''
      filterRarity.value = ''
    }
  }

  /**
   * 应用筛选
   */
  const applyFilter = () => {
    // 筛选逻辑通过 displayedItems computed 自动执行
   
  }

  /**
   * 选择物品
   */
  const selectItem = item => {
    selectedItem.value = item
    console.log('[useItems] 选择物品:', item?.id)
  }

  /**
   * 检查物品是否已装备
   */
  const isEquipped = item => {
    return itemsStore.hasEquipment(item)
  }

  /**
   * 使用物品
   */
  const useItem = (item, callbacks = {}) => {
    const result = itemsStore.useItem(item.id, callbacks)
  
    return result
  }

  /**
   * 装备物品
   */
  const equipItem = (item, slotId) => {
    const success = itemsStore.equipItem(item.id, slotId)
    // 优化：移除重复的 loadPlayerData/savePlayerData 调用
    // BagService.equipItem() 已经处理了数据保存
    return success
  }

  /**
   * 卸下装备
   */
  const unequipItem = slotId => {
    const success = itemsStore.unequipItem(slotId)
    // 优化：移除重复的 loadPlayerData/savePlayerData 调用
    // BagService.unequipFromEquipment() 已经处理了数据保存
    return success
  }

  /**
   * 丢弃物品
   */
  const dropItem = (itemId, quantity = 1) => {
    const success = itemsStore.removeItemFromBag(itemId, quantity)
    // 优化：移除重复的 loadPlayerData/savePlayerData 调用
    // BagService.removeItemFromBag() 已经处理了数据保存
    return success
  }

  /**
   * 出售物品
   */
  const sellItem = (itemId, quantity = 1) => {
    const sellAmount = itemsStore.sellItem(itemId, quantity)
    console.log('[useItems] 出售物品:', { itemId, quantity, sellAmount })
    return sellAmount
  }

  /**
   * 添加物品到背包
   */
  const addItemToBag = (itemId, quantity = 1) => {
    const bagService = new BagService()
    const success = bagService.addItemToBag(itemId, null, quantity)
  
    return success
  }

  /**
   * 批量添加物品到背包
   */
  const addItemsToBag = items => {
    const bagService = new BagService()
    const success = bagService.addItemsToBag(items)
 
    return success
  }

  /**
   * 从背包移除物品
   */
  const removeItemFromBag = (itemId, quantity = 1) => {
    const success = itemsStore.removeItemFromBag(itemId, quantity)
    if (success) {
      // 保存玩家数据
      // storageService 已通过 import 导入全局单例
      storageService.savePlayerPatch({ bag: [...itemsStore.playerBag] })
    }
    return success
  }

  /**
   * 检查背包是否已满
   */
  const isBagFull = () => {
    return itemsStore.isBagFull
  }

  /**
   * 获取背包使用情况
   */
  const getBagUsageInfo = () => {
    return {
      used: itemsStore.usedSlots,
      available: itemsStore.availableSlots,
      total: itemsStore.bagCapacity,
      percentage: itemsStore.bagUsageRate
    }
  }

  /**
   * 更新背包容量
   */
  const updateBagCapacity = level => {
    itemsStore.updateBagCapacity(level)
    // 保存玩家数据
    // storageService 已通过 import 导入全局单例
    storageService.savePlayerPatch({ availableBagSlots: itemsStore.bagCapacity })
 
  }

  /**
   * 获取背包物品
   */
  const getBagItems = () => {
    return itemsStore.getBagItems()
  }

  /**
   * 在背包中查找物品
   */
  const findItemInBag = itemId => {
    return itemsStore.findItemInBag(itemId)
  }

  /**
   * 获取物品数量
   */
  const getItemCount = itemId => {
    return itemsStore.getItemCount(itemId)
  }

  /**
   * 根据类别筛选背包物品
   */
  const filterBagItemsByCategory = category => {
    return itemsStore.getBagItemsByCategory(category)
  }

  /**
   * 根据稀有度筛选背包物品
   */
  const filterBagItemsByRarity = rarity => {
    return itemsStore.getBagItemsByRarity(rarity)
  }

  /**
   * 显示工具提示
   */
  const showTooltip = (event, item) => {
    const tooltip = document.getElementById('itemTooltip')
    if (!tooltip || !item) {
      return
    }

    const rarity = item?.rarity || 'common'
    const rarityColor = itemsStore.getRarityTextColor(rarity)
    const rarityName = getRarityName(rarity)

    // 填充工具提示内容
    const tooltipContent = tooltip.querySelector('.tooltip-content')
    if (tooltipContent) {
      tooltipContent.innerHTML = `
        <div class="item-name">${getItemName(item)}</div>
        <div class="item-rarity" style="color: ${rarityColor}">${rarityName}</div>
        <div class="item-description">${getItemDescription(item)}</div>
      `
    }

    // 显示工具提示
    tooltip.style.display = 'block'

    // 保存当前工具提示的物品
    window.currentTooltipItem = item

    // 定位工具提示
    updateTooltipPosition(event)
  }

  /**
   * 隐藏工具提示
   */
  const hideTooltip = () => {
    const tooltip = document.getElementById('itemTooltip')
    if (tooltip) {
      tooltip.style.display = 'none'
      window.currentTooltipItem = null
    }
  }

  /**
   * 更新工具提示位置
   */
  const updateTooltipPosition = event => {
    const tooltip = document.getElementById('itemTooltip')
    if (!tooltip || !event) {
      return
    }

    const offsetX = 20
    const offsetY = 20
    const x = event.clientX + offsetX
    const y = event.clientY + offsetY

    tooltip.style.left = `${x}px`
    tooltip.style.top = `${y}px`
  }

  /**
   * 处理图片错误
   */
  const handleImageError = event => {
    const img = event.target
    if (img && img.src) {
      console.warn('[useItems] 物品图片加载失败:', img.src)
      // 可以设置默认图片
      img.src = '/pt/item_icon/1.png'
    }
  }

  // 暴露给外部使用的属性和方法
  return {
    // 响应式数据
    bagItems,
    filteredItems,
    selectedItem,
    showFilter,
    filterCategory,
    filterRarity,

    // 计算属性
    bagUsage,
    emptySlots,
    displayedItems,

    // 方法
    loadBagItems,
    toggleFilter,
    applyFilter,
    selectItem,
    isEquipped,
    useItem,
    equipItem,
    unequipItem,
    dropItem,
    sellItem,
    addItemToBag,
    addItemsToBag,
    removeItemFromBag,
    isBagFull,
    getBagUsageInfo,
    updateBagCapacity,
    getBagItems,
    findItemInBag,
    getItemCount,
    filterBagItemsByCategory,
    filterBagItemsByRarity,
    showTooltip,
    hideTooltip,
    updateTooltipPosition,
    handleImageError
  }
}
