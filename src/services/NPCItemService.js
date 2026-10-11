/**
 * NPC物品服务
 * 负责处理和缓存NPC商店物品数据，避免重复计算
 * 现在从 itemsStore 获取数据，统一数据源
 * 包含 NPC 对话功能
 */

import { useItemsStore } from '@/store/items'
import { NPCDialogService } from './NPCDialogService'

export class NPCItemService {
  constructor () {
    // NPC对话服务
    this.dialogService = new NPCDialogService()
    
    // 稀有度价格倍率
    this.rarityPriceMultipliers = {
      common: 10,
      uncommon: 20,
      rare: 50,
      veryrare: 60,
      unique: 70,
      ultimate: 100
    }

    // 稀有度等级顺序
    this.rarityOrder = {
      common: 1,
      uncommon: 2,
      rare: 3,
      veryrare: 4,
      unique: 5,
      ultimate: 6
    }
    // 缓存存储
    this.cache = new Map()
    // 缓存时间（12小时）
    this.cacheTimeout = 12 * 60 * 60 * 1000
  }

  /**
   * 获取 itemsStore 实例
   * 每次调用都重新获取，确保获取最新的数据
   * @returns {Object} itemsStore 实例
   */
  getItemsStore () {
    return useItemsStore()
  }

  /**
   * 生成缓存键
   * @param {string} npcType - NPC类型
   * @param {string} levelRange - 等级范围
   * @param {number} itemCount - 物品数量
   * @returns {string} 缓存键
   */
  generateCacheKey (npcType, levelRange, itemCount) {
    return `${npcType}-${levelRange || '1-20'}-${itemCount || 0}`
  }

  /**
   * 检查缓存是否有效
   * @param {string} key - 缓存键
   * @returns {boolean} 是否有效
   */
  isCacheValid (key) {
    const cached = this.cache.get(key)
    if (!cached) {
      return false
    }

    const now = Date.now()
    return now - cached.timestamp < this.cacheTimeout
  }

  /**
   * 获取缓存数据
   * @param {string} key - 缓存键
   * @returns {any} 缓存数据
   */
  getCache (key) {
    if (this.isCacheValid(key)) {
      return this.cache.get(key).data
    }
    return null
  }

  /**
   * 设置缓存数据
   * @param {string} key - 缓存键
   * @param {any} data - 数据
   */
  setCache (key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * 清除所有缓存
   */
  clearCache () {
    this.cache.clear()
  }

  /**
   * 获取武器商店物品
   * @param {Object} currentMap - 当前地图信息
   * @returns {Array} 武器物品列表
   */
  getWeaponItems (currentMap) {
    // 生成缓存键
    const levelRange = currentMap?.levelRange || '1-20'
    const itemsStore = this.getItemsStore()
    const cacheKey = this.generateCacheKey(
      'weapons',
      levelRange,
      itemsStore?.staticItems?.length
    )

// 检查缓存 - 暂时禁用缓存以测试
/*
const cached = this.getCache(cacheKey);
if (cached) {
  return cached;
}
*/

    // 从 itemsStore 获取物品数据
    const allItems = itemsStore.staticItems || []
    
    // 处理对象格式的物品数据
    let itemsArray = []
    if (Array.isArray(allItems)) {
      itemsArray = allItems
    } else if (typeof allItems === 'object' && allItems !== null) {
      itemsArray = Object.values(allItems)
    }
    
    if (itemsArray.length === 0) {
      return []
    }

    // 获取当前地图等级范围
    let minLevel = 1
    let maxLevel = 20

    // 解析等级范围
    if (levelRange && levelRange.includes('-')) {
      const [min, max] = levelRange.split('-').map(Number)
      minLevel = min || 1
      maxLevel = max || 20
    }

    // 先筛选出所有武器
    const allWeapons = itemsArray.filter(item => item.category === 'weapon')

    // 筛选符合等级范围的武器
    const levelFilteredWeapons = allWeapons.filter(
      item => item.level >= minLevel && item.level <= maxLevel
    )

    // 筛选符合攻击力要求的武器
    // 放宽条件，只要有一个攻击力相关的属性就不排除
    const attackFilteredWeapons = levelFilteredWeapons.filter(item => {
      // 检查是否有任何攻击力相关的属性
      const hasAnyAttack =
        (item.minAttack !== undefined && item.minAttack >= 1) ||
        (item.maxAttack !== undefined && item.maxAttack >= 1)


      return hasAnyAttack
    })

    // 筛选符合价格要求的武器
    const priceFilteredWeapons = attackFilteredWeapons.filter(item => {
      const hasPrice = item.sellPrice >= 5 || item.buyPrice > 0
      // 保留前10个物品即使没有价格（用于调试或特殊处理）
      // if (!hasPrice && attackFilteredWeapons.indexOf(item) < 10) { }
      return hasPrice
    })

    const rarityFilteredWeapons = priceFilteredWeapons.filter(item => {
      const rawRarity = typeof item.rarity === 'string' ? item.rarity.trim() : ''
      const normalizedRarity = rawRarity ? rawRarity.toLowerCase() : 'common'
      return (
        normalizedRarity === 'common' ||
        normalizedRarity === 'uncommon' ||
        rawRarity === '普通' ||
        rawRarity === '罕见'
      )
    })

    // 筛选武器物品
    const weaponItems = rarityFilteredWeapons
      .map(item => ({
        id: item.id,
        name:
          typeof item.name === 'string'
            ? item.name
            : item.name && item.name.cns
              ? item.name.cns
              : `物品ID: ${item.id}`,
        description: item.description || '',
        level: item.level || 0,
        category: item.category,
        subcategory: item.subcategory,
        rarity: item.rarity || 'common',

        minAttack: item.minAttack || 0,
        maxAttack: item.maxAttack || 0,
        minDefense: item.minDefense || 0,
        maxDefense: item.maxDefense || 0,
        stack: 1,
        price:
          (item.buyPrice ? item.buyPrice : item.sellPrice ? item.sellPrice : 0) *
          (this.rarityPriceMultipliers[item.rarity || 'common'] || 2),
        sellPrice: item.sellPrice || 0,
        class: item.class || [],
        element: item.element || 'none',
        sex: item.sex || 'all',
        icon: `/pt/item_icon/${item.id}.png`,
        abilities: item.abilities || []
      }))
      .sort((a, b) => {
        // 首先按稀有度排序（品级从低到高）
        const rarityDiff =
          (this.rarityOrder[a.rarity || 'common'] || 1) -
          (this.rarityOrder[b.rarity || 'common'] || 1)
        if (rarityDiff !== 0) {
          return rarityDiff
        }
        // 如果稀有度相同，按价格从小到大排序
        return (a.price || 0) - (b.price || 0)
      })

    // 存储到缓存
    this.setCache(cacheKey, weaponItems)

    return weaponItems
  }

  /**
   * 获取防具商店物品
   * @param {Object} currentMap - 当前地图信息
   * @returns {Array} 防具物品列表
   */
  getArmorItems (currentMap) {
    // 生成缓存键
    const levelRange = currentMap?.levelRange || '1-20'
    const itemsStore = this.getItemsStore()
    const cacheKey = this.generateCacheKey(
      'armors',
      levelRange,
      itemsStore?.staticItems?.length
    )

    // 检查缓存 - 暂时禁用缓存以测试
    /*
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }
    */

    // 从 itemsStore 获取物品数据
    const allItems = itemsStore.staticItems || []
    
    // 处理对象格式的物品数据
    let itemsArray = []
    if (Array.isArray(allItems)) {
      itemsArray = allItems
    } else if (typeof allItems === 'object' && allItems !== null) {
      itemsArray = Object.values(allItems)
    }
    
    if (itemsArray.length === 0) {
      return []
    }

    // 获取当前地图等级范围
    let minLevel = 1
    let maxLevel = 20

    // 解析等级范围
    if (levelRange && levelRange.includes('-')) {
      const [min, max] = levelRange.split('-').map(Number)
      minLevel = min || 1
      maxLevel = max || 20
    }

    // 筛选防具物品
    const armorItems = itemsArray
      .filter(item => {
        const rawRarity = typeof item.rarity === 'string' ? item.rarity.trim() : ''
        const normalizedRarity = rawRarity ? rawRarity.toLowerCase() : 'common'
        const matches =
          item.category === 'armor' &&
          item.level >= minLevel &&
          item.level <= maxLevel &&
          (item.sellPrice > 1 || item.buyPrice > 0) &&
          (normalizedRarity === 'common' ||
            normalizedRarity === 'uncommon' ||
            rawRarity === '普通' ||
            rawRarity === '罕见')

        // 放宽防御力检查条件，允许防御力为0的防具
        return matches
      })
      .map(item => ({
        id: item.id,
        name:
          typeof item.name === 'string'
            ? item.name
            : item.name && item.name.cns
              ? item.name.cns
              : `物品ID: ${item.id}`,
        description: item.description || '',
        level: item.level || 0,
        category: item.category,
        subcategory: item.subcategory,
        rarity: item.rarity || 'common',

        minAttack: item.minAttack !== undefined ? item.minAttack : item.attack || 0,
        maxAttack: item.maxAttack !== undefined ? item.maxAttack : item.attack || 0,
        minDefense: item.minDefense !== undefined ? item.minDefense : item.defense || 0,
        maxDefense: item.maxDefense !== undefined ? item.maxDefense : item.defense || 0,
        stack: 1,
        price:
          (item.buyPrice ? item.buyPrice : item.sellPrice ? item.sellPrice : 0) *
          (this.rarityPriceMultipliers[item.rarity || 'common'] || 2),
        sellPrice: item.sellPrice || 0,
        class: item.class || [],
        element: item.element || 'none',
        sex: item.sex || 'all',
        icon: `/pt/item_icon/${item.id}.png`,
        abilities: item.abilities || []
      }))
      .sort((a, b) => {
        // 首先按稀有度排序（品级从低到高）
        const rarityDiff =
          (this.rarityOrder[a.rarity || 'common'] || 1) -
          (this.rarityOrder[b.rarity || 'common'] || 1)
        if (rarityDiff !== 0) {
          return rarityDiff
        }
        // 如果稀有度相同，按价格从小到大排序
        return (a.price || 0) - (b.price || 0)
      })

    // 存储到缓存
    this.setCache(cacheKey, armorItems)

    return armorItems
  }

  /**
   * 获取食品商店物品
   * @returns {Array} 食品物品列表
   */
  getFoodItems () {
    // 生成缓存键 - 注意：食物物品不依赖地图等级范围
    const itemsStore = this.getItemsStore()
    const cacheKey = this.generateCacheKey('foods', 'all', itemsStore?.staticItems?.length)

    // 检查缓存
    const cached = this.getCache(cacheKey)
    if (cached) {
      return cached
    }

    // 从 itemsStore 获取物品数据
    const allItems = itemsStore.staticItems || []
    
    // 处理对象格式的物品数据
    let itemsArray = []
    if (Array.isArray(allItems)) {
      itemsArray = allItems
    } else if (typeof allItems === 'object' && allItems !== null) {
      itemsArray = Object.values(allItems)
    }
    
    if (itemsArray.length === 0) {
      return []
    }

    // 筛选消耗品物品
    const foodItems = itemsArray
      .filter(
        item =>
          item.category === 'recovery' &&
          item.subcategory === 'food' &&
          item.rarity === 'common' &&
          item.cooldown &&
          item.id !== 18950 &&
          item.id !== 12756 &&
          item.id !== 14117 &&
          item.id !== 19542 &&
          item.id !== 11603 &&
          item.id !== 18726 &&
          item.id !== 2111 &&
          item.abilities[0].rate !== true &&
          item.abilities[0].add <= 3100
      )
      .map(item => ({
        id: item.id,
        name:
          typeof item.name === 'string'
            ? item.name
            : item.name && item.name.cns
              ? item.name.cns
              : `物品ID: ${item.id}`,
        price: item.abilities[0].add * 2,
        rarity: item.rarity || 'common',
        cooldown: item.cooldown || 0,
        category: item.category,
        subcategory: item.subcategory,
        description: item.description || '',
        abilities: item.abilities || [],
        stack: item.stack || 1
      }))
      .sort((a, b) => a.abilities[0].add - b.abilities[0].add || a.price - b.price)

    // 存储到缓存
    this.setCache(cacheKey, foodItems)

    return foodItems
  }

  /**
   * 获取魔法商店物品
   * @returns {Array} 魔法物品列表
   */
  getMagicItems () {
    // 生成缓存键 - 注意：魔法物品不依赖地图等级范围
    const itemsStore = this.getItemsStore()
    const cacheKey = this.generateCacheKey('magics', 'all', itemsStore?.staticItems?.length)

    // 检查缓存
    const cached = this.getCache(cacheKey)
    if (cached) {
      return cached
    }

    // 从 itemsStore 获取物品数据
    const allItems = itemsStore.staticItems || []
    
    // 处理对象格式的物品数据
    let itemsArray = []
    if (Array.isArray(allItems)) {
      itemsArray = allItems
    } else if (typeof allItems === 'object' && allItems !== null) {
      itemsArray = Object.values(allItems)
    }
    
    if (itemsArray.length === 0) {
      return []
    }

    // 筛选魔法物品 - 与Old版本保持一致，只筛选refresher子分类的物品，不受地图等级范围限制
    const magicItems = itemsArray
      .filter(
        item =>
          item.subcategory === 'refresher' && item.rarity === 'common' && item.abilities[0].add > 1
      )
      .map(item => ({
        id: item.id,
        name:
          typeof item.name === 'string'
            ? item.name
            : item.name && item.name.cns
              ? item.name.cns
              : `物品ID: ${item.id}`,
        description: item.description || '',
        level: item.level || 0,
        category: item.category,
        subcategory: item.subcategory,
        rarity: item.rarity || 'common',
        stack: item.stack || 1,
        sellPrice: item.abilities[0].add * 3,
        class: item.class || [],
        element: item.element || 'none',
        sex: item.sex || 'all',
        icon: `/pt/item_icon/${item.id}.png`,
        abilities: item.abilities || []
      }))
      .sort((a, b) => (a.sellPrice || 0) - (b.sellPrice || 0))

    // 存储到缓存
    this.setCache(cacheKey, magicItems)

    return magicItems
  }

  /**
   * 获取随机对话
   * @param {string} npcType - NPC类型
   * @returns {Array} 随机对话
   */
  getRandomDialog (npcType) {
    return this.dialogService.getRandomDialog(npcType)
  }

  /**
   * 获取NPC对话列表
   * @param {string} npcType - NPC类型
   * @returns {Array} 对话列表
   */
  getDialogs (npcType) {
    return this.dialogService.getDialogs(npcType)
  }

  /**
   * 添加NPC对话
   * @param {string} npcType - NPC类型
   * @param {Array} dialog - 对话内容
   */
  addDialog (npcType, dialog) {
    this.dialogService.addDialog(npcType, dialog)
  }
}
