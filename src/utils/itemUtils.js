/**
 * 物品工具函数
 * 统一的物品数据处理工具，通过 Pinia Stores 访问数据
 */

import { useItemsStore } from '@/store/items'

/**
 * 获取物品信息
 * @param {number|string} itemId - 物品ID
 * @returns {Object|null} 物品信息对象或null
 */
export function getItemInfo (itemId) {
  try {
    const itemsStore = useItemsStore()
    
    if (!itemsStore.staticItems) {
      console.warn('[itemUtils] itemsStore.staticItems 未初始化')
      return null
    }

    // 支持数组和对象两种格式
    if (Array.isArray(itemsStore.staticItems)) {
      return itemsStore.staticItems.find(item => item.id === itemId) || null
    } else if (typeof itemsStore.staticItems === 'object' && itemsStore.staticItems !== null) {
      return itemsStore.staticItems[itemId] || null
    }

    return null
  } catch (error) {
    console.error('[itemUtils] getItemInfo 获取物品信息时出错:', error)
    return null
  }
}

/**
 * 获取物品名称
 * @param {Object|number} item - 物品对象或物品ID
 * @returns {string} 物品名称
 */
export function getItemName (item) {
  if (!item) {
    return '未知物品'
  }

  // 如果传入的是物品ID，先获取物品信息
  if (typeof item === 'number' || typeof item === 'string') {
    const itemInfo = getItemInfo(item)
    if (!itemInfo) {
      return `物品ID: ${item}`
    }
    item = itemInfo
  }

  // 如果物品已经有名称，直接返回
  if (item.name && item.name !== `物品#${item.id}`) {
    // 处理多语言名称（如果name是对象）
    if (typeof item.name === 'object') {
      return item.name.cns || item.name.eng || item.name.en || `物品ID: ${item.id}`
    }
    return item.name
  }

  // 尝试从 Store 中获取正确的物品名称
  try {
    const itemsStore = useItemsStore()
    
    if (!itemsStore.staticItems) {
      return item.name || `物品ID: ${item.id}`
    }

    let itemData = null
    
    // 支持数组和对象两种格式
    if (Array.isArray(itemsStore.staticItems)) {
      itemData = itemsStore.staticItems.find(i => i.id === item.id)
    } else if (typeof itemsStore.staticItems === 'object' && itemsStore.staticItems !== null) {
      itemData = itemsStore.staticItems[item.id]
    }

    if (itemData && itemData.name) {
      // 处理多语言名称（如果name是对象）
      if (typeof itemData.name === 'object') {
        return itemData.name.cns || itemData.name.eng || itemData.name.en || `物品ID: ${item.id}`
      }
      return itemData.name
    }
  } catch (error) {
    console.error('[itemUtils] getItemName 获取物品名称时出错:', error)
  }

  // 如果都没有找到，返回默认名称
  return item.name || `物品ID: ${item.id}`
}

/**
 * 获取物品描述
 * @param {Object|number} item - 物品对象或物品ID
 * @returns {string} 物品描述
 */
export function getItemDescription (item) {
  if (!item) {
    return ''
  }

  // 如果传入的是物品ID，先获取物品信息
  if (typeof item === 'number' || typeof item === 'string') {
    const itemInfo = getItemInfo(item)
    if (!itemInfo) {
      return ''
    }
    item = itemInfo
  }

  // 如果物品已经有描述，直接返回
  if (item.description) {
    return item.description
  }

  // 尝试从 Store 中获取正确的物品描述
  try {
    const itemsStore = useItemsStore()
    
    if (!itemsStore.staticItems) {
      return ''
    }

    let itemData = null
    
    // 支持数组和对象两种格式
    if (Array.isArray(itemsStore.staticItems)) {
      itemData = itemsStore.staticItems.find(i => i.id === item.id)
    } else if (typeof itemsStore.staticItems === 'object' && itemsStore.staticItems !== null) {
      itemData = itemsStore.staticItems[item.id]
    }

    if (itemData && itemData.description) {
      return itemData.description
    }
  } catch (error) {
    console.error('[itemUtils] getItemDescription 获取物品描述时出错:', error)
  }

  // 如果都没有找到，返回空字符串
  return ''
}

/**
 * 获取物品图标
 * @param {Object|number} item - 物品对象或物品ID
 * @returns {string} 物品图标路径
 */
export function getItemIcon (item) {
  if (!item) {
    return '/pt/item_icon/default_item.png'
  }

  // 如果传入的是物品ID，先获取物品信息
  if (typeof item === 'number' || typeof item === 'string') {
    const itemInfo = getItemInfo(item)
    if (!itemInfo) {
      return `/pt/item_icon/${item}.png`
    }
    item = itemInfo
  }

  // 物品图片使用物品 ID: /pt/item_icon/物品ID.png
  return item.id ? `/pt/item_icon/${item.id}.png` : '/pt/item_icon/default_item.png'
}

/**
 * 检查物品是否可装备
 * @param {Object} item - 物品对象
 * @returns {boolean} 是否可装备
 */
export function isEquippable (item) {
  if (!item) {
    return false
  }
  return ['weapon', 'armor', 'accessory'].includes(item.category)
}

/**
 * 检查物品是否可出售
 * @param {Object} item - 物品对象
 * @returns {boolean} 是否可出售
 */
export function isSellable (item) {
  if (!item) {
    return false
  }
  return item.sellPrice > 0
}

/**
 * 检查物品是否可堆叠
 * @param {Object} item - 物品对象
 * @returns {boolean} 是否可堆叠
 */
export function isStackable (item) {
  if (!item) {
    return false
  }
  return item.stack > 1
}

/**
 * 获取物品出售价格
 * @param {Object} item - 物品对象
 * @param {number} quantity - 数量
 * @returns {number} 出售价格
 */
export function getSellPrice (item, quantity = 1) {
  if (!item) {
    return 0
  }
  const price = item.sellPrice || Math.floor((item.buyPrice || 0) / 4)
  return price * quantity
}

/**
 * 获取物品购买价格
 * @param {Object} item - 物品对象
 * @param {number} quantity - 数量
 * @returns {number} 购买价格
 */
export function getBuyPrice (item, quantity = 1) {
  if (!item) {
    return 0
  }
  return (item.buyPrice || 0) * quantity
}

/**
 * 检查物品是否符合职业要求
 * @param {Object} item - 物品对象
 * @param {string} playerClass - 玩家职业
 * @returns {boolean} 是否符合职业要求
 */
export function checkClassRequirement (item, playerClass) {
  if (!item || !item.class) {
    return true
  }
  if (item.class.includes('all')) {
    return true
  }
  return item.class.includes(playerClass)
}

/**
 * 检查物品是否符合等级要求
 * @param {Object} item - 物品对象
 * @param {number} playerLevel - 玩家等级
 * @returns {boolean} 是否符合等级要求
 */
export function checkLevelRequirement (item, playerLevel) {
  if (!item || !item.level) {
    return true
  }
  return playerLevel >= item.level
}

/**
 * 检查物品是否符合性别要求
 * @param {Object} item - 物品对象
 * @param {string} playerGender - 玩家性别
 * @returns {boolean} 是否符合性别要求
 */
export function checkGenderRequirement (item, playerGender) {
  if (!item || !item.sex) {
    return true
  }
  if (item.sex === 'all') {
    return true
  }
  return item.sex === playerGender
}

/**
 * 获取物品完整信息（包含从 Store 获取的详细信息）
 * @param {Object} item - 物品对象
 * @returns {Object} 完整的物品信息
 */
export function getFullItemInfo (item) {
  if (!item) {
    return null
  }

  // 从 Store 获取完整的物品信息
  const itemInfo = getItemInfo(item.id)
  
  if (itemInfo) {
    // 合并物品信息，优先使用传入的物品对象的运行时数据
    return {
      ...itemInfo,
      ...item,
      // 确保使用传入物品的 ID
      id: item.id
    }
  }

  // 如果没有找到，返回原物品对象
  return item
}
