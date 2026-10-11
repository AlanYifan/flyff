/**
 * 物品数据统一管理 Store
 * 统一管理物品静态数据、背包、装备和物品操作
 */
import { defineStore } from 'pinia'
import { ENHANCE_SET_BONUS_TABLE } from '@/data/items'
import { storageService } from '@/services/StorageService'
import { checkLevelRequirement } from '@/utils/itemUtils'
import { getEffectiveEquipLevel } from '@/services/MasterGradeService'
import { classMapping, classNameToKeyMap, classParents } from '@/utils/itemHelpers'
import { generateDropEnhanceLevel, getEnhanceSellPriceBonus } from '@/utils/dropEnhanceGenerator'
import { useRaisedPetSummonStore } from './raisedPetSummon'
import { useGameStore, useAchievementsStore } from '@/store'
import { HUAFU_SELL_PRICES } from '@/data/HUAFU_SHOPING'
import { canDualWield } from '@/composables/useDualWield'
import { openMagicCage, MAGIC_CAGE_ITEM_ID } from '@/services/MagicCageService'
import { achievementService } from '@/services/AchievementService.js'

const normalizeItemRarityKey = rarity => {
  const safe = String(rarity ?? '').trim()
  if (!safe) {
    return 'common'
  }
  const lower = safe.toLowerCase()
  if (lower === 'mythic') {
    return 'mythic'
  }
  return lower
}

const ITEM_RARITY_STYLE_FORMULA = Object.freeze({
  common: Object.freeze({ textColor: '#C0C0C0', borderColor: '#C0C0C0' }),
  uncommon: Object.freeze({ textColor: '#0070DD', borderColor: '#0070DD' }),
  rare: Object.freeze({ textColor: 'rgb(81, 209, 77)', borderColor: 'rgb(81, 209, 77)' }),
  veryrare: Object.freeze({ textColor: 'rgb(255, 136, 0)', borderColor: 'rgb(255, 136, 0)' }),
  unique: Object.freeze({ textColor: 'rgb(255, 0, 13)', borderColor: 'rgb(255, 0, 13)' }),
  ultimate: Object.freeze({ textColor: '#A335EE', borderColor: '#A335EE' }),
  mythic: Object.freeze({
    textColor: '#FF4500',
    borderColor: 'transparent',
    textClass: 'rarity-mythic-text',
    borderClass: 'rarity-mythic-border'
  })
})

export const useItemsStore = defineStore('items', {
  state: () => ({
    // ========== 静态数据 ==========
    // 静态物品数据（由 StaticGameInitializer 加载）
    staticItems: [],
    // 钻石商店数据（由 StaticGameInitializer 加载）
    diamondShopItems: [],

    // 玩家背包
    playerBag: [],

    // 玩家金币
    playerGold: 0,

    // 装备栏
    equipment: {
      weapon: null,
      shield: null,
      mask: null,
      cloak: null,
      helmet: null,
      armor: null,
      gloves: null,
      boots: null,
      necklace: null,
      ring1: null,
      ring2: null,
      earring1: null,
      earring2: null,
      fashionHat: null,
      fashionSuit: null,
      fashionGloves: null,
      fashionBoots: null
    },

    // 背包配置
    bagCapacity: 165,

    // 装备套装数据
    equipmentSets: [],

    enhanceSetBonusTable: Object.freeze(ENHANCE_SET_BONUS_TABLE),

    // 背包状态
    isBagFull: false,

    lastEquipErrorMessage: ''
  }),

  getters: {
    // ========== 获取器 ==========
    rarityStyleFormula: () => ITEM_RARITY_STYLE_FORMULA,

    normalizeRarityKey: () => {
      return rarity => normalizeItemRarityKey(rarity)
    },

    getRarityTextColor: () => {
      return rarity => {
        const key = normalizeItemRarityKey(rarity)
        const entry = ITEM_RARITY_STYLE_FORMULA[key] || ITEM_RARITY_STYLE_FORMULA.common
        return entry.textColor || '#C0C0C0'
      }
    },

    getRarityTextClass: () => {
      return rarity => {
        const key = normalizeItemRarityKey(rarity)
        const entry = ITEM_RARITY_STYLE_FORMULA[key]
        return entry?.textClass || ''
      }
    },

    getRarityTextStyle: () => {
      return rarity => {
        const key = normalizeItemRarityKey(rarity)
        const entry = ITEM_RARITY_STYLE_FORMULA[key] || ITEM_RARITY_STYLE_FORMULA.common
        if (entry?.textClass) {
          return {}
        }
        return { color: entry.textColor || '#C0C0C0' }
      }
    },

    getRarityBorderCss: () => {
      return rarity => {
        const key = normalizeItemRarityKey(rarity)
        const entry = ITEM_RARITY_STYLE_FORMULA[key] || ITEM_RARITY_STYLE_FORMULA.common
        const borderColor = entry.borderColor || '#C0C0C0'
        return `2px solid ${borderColor}`
      }
    },

    getRarityBorderClass: () => {
      return rarity => {
        const key = normalizeItemRarityKey(rarity)
        const entry = ITEM_RARITY_STYLE_FORMULA[key]
        return entry?.borderClass || ''
      }
    },

    rarityTextColorMap: () => {
      const resolved = {}
      Object.keys(ITEM_RARITY_STYLE_FORMULA).forEach(key => {
        resolved[key] = ITEM_RARITY_STYLE_FORMULA[key]?.textColor || '#C0C0C0'
      })
      resolved.Mythic = ITEM_RARITY_STYLE_FORMULA.mythic.textColor
      return resolved
    },

    /**
     * 获取背包使用率
     */
    bagUsageRate: state => {
      if (state.bagCapacity === 0) {
        return 0
      }
      return Math.round((state.playerBag.length / state.bagCapacity) * 100)
    },

    /**
     * 获取剩余格子数
     */
    availableSlots: state => {
      return Math.max(0, state.bagCapacity - state.playerBag.length)
    },

    /**
     * 获取已使用格子数
     */
    usedSlots: state => {
      return state.playerBag.length
    },

    /**
     * 根据ID获取物品静态配置
     * 优先从 staticItems 查找，如果找不到则从 diamondShopItems 查找
     */
    getItemConfig: state => {
      return itemId => {
        let itemConfig = null

        // 优先从 diamondShopItems 查找（钻石商店物品优先级更高）
        if (state.diamondShopItems) {
          if (Array.isArray(state.diamondShopItems)) {
            itemConfig = state.diamondShopItems.find(item => item.id === itemId)
          } else if (typeof state.diamondShopItems === 'object' && state.diamondShopItems !== null) {
            // 将 itemId 转换为字符串进行查找（DIAMOND_SHOP_ITEMS 的键是字符串）
            itemConfig = state.diamondShopItems[String(itemId)]
          }
        }

        // 如果 diamondShopItems 中找不到，再从 staticItems 查找
        if (!itemConfig && state.staticItems) {
          if (Array.isArray(state.staticItems)) {
            itemConfig = state.staticItems.find(item => item.id === itemId)
          } else if (typeof state.staticItems === 'object' && state.staticItems !== null) {
            itemConfig = state.staticItems[itemId]
          }
        }

        return itemConfig || null
      }
    },

    /**
     * 根据类型筛选背包物品
     */
    getBagItemsByCategory: state => {
      return category => {
        return state.playerBag.filter(item => item.category === category)
      }
    },

    /**
     * 根据稀有度筛选背包物品
     */
    getBagItemsByRarity: state => {
      return rarity => {
        return state.playerBag.filter(item => item.rarity === rarity)
      }
    },

    /**
     * 检查装备栏是否有指定槽位的装备
     */
    hasEquipment: state => {
      return slotId => {
        return state.equipment[slotId] !== null && state.equipment[slotId] !== undefined
      }
    },

    /**
     * 获取装备的物品数量
     */
    equippedCount: state => {
      return Object.values(state.equipment).filter(item => item !== null).length
    }
  },

  actions: {
    // ========== 静态数据管理 ==========

    /**
     * 加载静态物品数据（从静态文件）
     * @param {Array|Object} itemsData - 物品配置数据数组或对象
     */
    loadStaticData (itemsData) {
      if (Array.isArray(itemsData)) {
     
        // 优化：冻结静态数据，避免 Vue 追踪其变化，提高性能
        this.staticItems = Object.freeze(itemsData) || []
      } else if (typeof itemsData === 'object' && itemsData !== null) {
      
        // 优化：冻结静态数据，避免 Vue 追踪其变化，提高性能
        this.staticItems = Object.freeze(itemsData) || {}
      } else {
        console.warn('[ItemsStore] 无效的物品数据格式:', itemsData)
        this.staticItems = Object.freeze([])
      }
    },

    /**
     * 加载装备套装数据
     * @param {Array} setsData - 装备套装数据
     */
    loadEquipmentSets (setsData) {
      if (Array.isArray(setsData)) {
        this.equipmentSets = Object.freeze(setsData) || []
        return
      }
      if (setsData && typeof setsData === 'object') {
        this.equipmentSets = Object.freeze(setsData) || {}
        return
      }
      console.warn('[ItemsStore] 无效的套装数据格式:', setsData)
      this.equipmentSets = Object.freeze([])
    },

    // ========== 背包管理 ==========

    /**
     * 添加物品到背包
     * @param {number} itemId - 物品ID
     * @param {number} quantity - 数量
     * @returns {boolean} 是否添加成功
     */
    addItemToBag (itemId, quantity = 1) {
      const itemConfig = this.getItemConfig(itemId)
      
      if (!itemConfig) {
        console.error(`[ItemsStore] 未找到物品ID ${itemId} 的配置`)
        return false
      }

      // 防御性清理：移除背包中 currentStack <= 0 的残留物品
      const beforeLen = this.playerBag.length
      for (let i = this.playerBag.length - 1; i >= 0; i -= 1) {
        const bagItem = this.playerBag[i]
        const stack = Number(bagItem?.currentStack ?? bagItem?.quantity ?? 1)
        if (!Number.isFinite(stack) || stack <= 0) {
          this.playerBag.splice(i, 1)
        }
      }

      /**
       * 生成唯一ID
       * 用于标识不可堆叠物品（stack=1），后续强化需要用到
       * @returns {string} 唯一ID
       */
      const generateUniqueId = () => {
        const getItemType = (itemId) => {
          const config = this.getItemConfig(itemId)
          return config?.category || 'other'
        }

        const generateRandomNumbers = () => {
          let result = ''
          for (let i = 0; i < 5; i++) {
            result += Math.floor(Math.random() * 10).toString()
          }
          return result
        }

        const generateRandomLetters = () => {
          let result = ''
          for (let i = 0; i < 5; i++) {
            result += String.fromCharCode(97 + Math.floor(Math.random() * 26))
          }
          return result
        }

        const itemType = getItemType(itemId)
        const randomNumbers = generateRandomNumbers()
        const randomLetters = generateRandomLetters()

        return `${itemType}_${itemId}_${randomNumbers}${randomLetters}`
      }

      // 查找背包中是否已有该物品（可堆叠物品）
      // 只查找 currentStack 未满的物品，避免在已满堆叠上重复叠加
      const maxStack = itemConfig.stack || 9999
      const itemInBagIndex = maxStack > 1
        ? this.playerBag.findIndex(item => item.id === itemId && (item.currentStack || 0) > 0 && (item.currentStack || 0) < maxStack)
        : -1
      let actualQuantity = quantity

      // 如果物品已存在且可堆叠，直接修改state中的属性
      if (itemInBagIndex !== -1 && maxStack > 1) {
        const currentStack = this.playerBag[itemInBagIndex].currentStack || 0
        const canAddQuantity = maxStack - currentStack

        if (canAddQuantity > 0 && actualQuantity > 0) {
          const addQuantity = Math.min(canAddQuantity, actualQuantity)
          // 直接修改state中的对象属性，触发响应式更新
          this.playerBag[itemInBagIndex].currentStack = currentStack + addQuantity
            actualQuantity -= addQuantity

            if (actualQuantity === 0) {
            return true
          }
        }
      }

      // 如果还有剩余数量，先尝试叠加到背包中其他未满的同ID物品
      while (actualQuantity > 0 && maxStack > 1) {
        const nextUnfilledIndex = this.playerBag.findIndex(
          item => item.id === itemId && (item.currentStack || 0) > 0 && (item.currentStack || 0) < maxStack
        )
        if (nextUnfilledIndex === -1) {
          break
        }
        const existingStack = this.playerBag[nextUnfilledIndex].currentStack || 0
        const canAddQuantity = Math.min(maxStack - existingStack, actualQuantity)
        this.playerBag[nextUnfilledIndex].currentStack = existingStack + canAddQuantity
        actualQuantity -= canAddQuantity
      }

      // 如果仍有剩余数量，需要创建新物品
      while (actualQuantity > 0) {
        // 检查背包是否已满
        if (this.playerBag.length >= this.bagCapacity) {
          try {
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
              const event = new CustomEvent('bag-full', {
                detail: { itemId, quantity }
              })
              window.dispatchEvent(event)
            }
          } catch (error) {
            console.error('[ItemsStore] 派发 bag-full 事件失败:', error)
          }
          return false
        }

        // 计算当前堆叠应该添加的数量
        const stackQuantity = Math.min(actualQuantity, maxStack)

        // 创建新物品对象
        const newItem = {
          id: itemConfig.id,
          icon: `/pt/item_icon/${itemConfig.id}.png`,
          name:
            typeof itemConfig.name === 'string'
              ? itemConfig.name
              : itemConfig.name?.cns || `物品#${itemConfig.id}`,
          description:
            typeof itemConfig.description === 'string'
              ? itemConfig.description
              : itemConfig.description?.cns || '',
          level: itemConfig.level || 0,
          cooldown: itemConfig.cooldown || 0,
          category: itemConfig.category || 'other',
          subcategory: itemConfig.subcategory || 'other',
          stack: maxStack,
          currentStack: stackQuantity,
          buyPrice: itemConfig.buyPrice || 0,
          sellPrice: HUAFU_SELL_PRICES[String(itemConfig.id)] || itemConfig.sellPrice || 0,
          abilities: itemConfig.abilities || [],
          minAttack: itemConfig.minAttack || 0,
          maxAttack: itemConfig.maxAttack || 0,
          attackSpeedValue: itemConfig.attackSpeedValue,
          minDefense: itemConfig.minDefense || 0,
          maxDefense: itemConfig.maxDefense || 0,
          class: Array.isArray(itemConfig.class) ? itemConfig.class : [itemConfig.class],
          rarity: itemConfig.rarity || 'common',
          element: itemConfig.element || 'none',
          sex: itemConfig.sex || 'all',
          upgradeLevels: itemConfig.upgradeLevels || [],
          ultimateConvertible: itemConfig.ultimateConvertible || false,
          twoHanded: Boolean(itemConfig.twoHanded)
        }

        // 如果物品不可堆叠（stack=1），添加唯一ID并附加强化等级
        if (maxStack === 1) {
          newItem.uniqueId = generateUniqueId()

          // 为掉落的装备类物品按照精炼概率表附加强化等级和属性加成
          const dropEnhanceResult = generateDropEnhanceLevel(itemConfig)
          if (dropEnhanceResult.enhanceLevel > 0) {
            newItem.enhanceLevel = dropEnhanceResult.enhanceLevel
            newItem.StrengthenedAttributes = dropEnhanceResult.StrengthenedAttributes
          }
        }

        // 直接push到state.playerBag，触发响应式更新
        this.playerBag.push(newItem)
        actualQuantity -= stackQuantity
      }

      return true
    },

    /**
     * 添加完整物品对象到背包
     * 用于从仓库取出已强化的装备等场景，保留物品的所有属性（强化等级、uniqueId等）
     * @param {Object} itemObject - 完整的物品对象
     * @returns {boolean} 是否添加成功
     */
    addItemObjectToBag (itemObject) {
      if (!itemObject || typeof itemObject !== 'object') {
        console.error('[ItemsStore] addItemObjectToBag: 物品对象无效')
        return false
      }

      const itemId = Number(itemObject.id)
      if (!Number.isFinite(itemId) || itemId <= 0) {
        console.error('[ItemsStore] addItemObjectToBag: 物品ID无效', itemObject)
        return false
      }

      // 检查背包是否已满
      if (this.playerBag.length >= this.bagCapacity) {
        try {
          if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            const event = new CustomEvent('bag-full', {
              detail: { itemId, quantity: 1 }
            })
            window.dispatchEvent(event)
          }
        } catch (error) {
          console.error('[ItemsStore] 派发 bag-full 事件失败:', error)
        }
        return false
      }

      // 获取物品配置以补充缺失字段
      const itemConfig = this.getItemConfig(itemId)

      // 创建物品副本，保留原有属性
      const newItem = {
        ...itemObject
      }

      // 确保必要字段存在
      if (!newItem.icon && itemConfig) {
        newItem.icon = `/pt/item_icon/${itemConfig.id}.png`
      }
      if (!newItem.name && itemConfig) {
        newItem.name = typeof itemConfig.name === 'string'
          ? itemConfig.name
          : itemConfig.name?.cns || `物品#${itemConfig.id}`
      }

      // 直接添加到背包
      this.playerBag.push(newItem)

      return true
    },

    /**
     * 添加终极武器到背包（带随机属性生成）
     * 终极武器转化成功后调用此方法，会从 possibleRandomStats 中随机生成1-3条属性
     * 概率规则：
     * - 随机1条属性：30%概率
     * - 随机2条属性：15%概率
     * - 随机3条属性：7.5%概率
     * - 无属性：47.5%概率
     * 属性值随机规则：
     * - 数值越小概率越高，数值越大概率越低
     * - 最小概率0.1%，最大概率80%
     * @param {number} itemId - 终极武器ID
     * @returns {{ success: boolean, randomStats: Array }} 添加结果和生成的随机属性
     */
    addUltimateWeaponToBag (itemId) {
      const itemConfig = this.getItemConfig(itemId)

      if (!itemConfig) {
        console.error(`[ItemsStore] 未找到终极武器ID ${itemId} 的配置`)
        return { success: false, randomStats: [] }
      }

      // 检查背包是否已满
      if (this.playerBag.length >= this.bagCapacity) {
        try {
          if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            const event = new CustomEvent('bag-full', {
              detail: { itemId, quantity: 1 }
            })
            window.dispatchEvent(event)
          }
        } catch (error) {
          console.error('[ItemsStore] 派发 bag-full 事件失败:', error)
        }
        return { success: false, randomStats: [] }
      }

      /**
       * 生成唯一ID
       */
      const generateUniqueId = () => {
        const getItemType = (id) => {
          const config = this.getItemConfig(id)
          return config?.category || 'other'
        }

        const generateRandomNumbers = () => {
          let result = ''
          for (let i = 0; i < 5; i += 1) {
            result += Math.floor(Math.random() * 10).toString()
          }
          return result
        }

        const generateRandomLetters = () => {
          let result = ''
          for (let i = 0; i < 5; i += 1) {
            result += String.fromCharCode(97 + Math.floor(Math.random() * 26))
          }
          return result
        }

        const itemType = getItemType(itemId)
        const randomNumbers = generateRandomNumbers()
        const randomLetters = generateRandomLetters()

        return `${itemType}_${itemId}_${randomNumbers}${randomLetters}`
      }

      /**
       * 根据权重概率随机选择属性数量
       * @returns {number} 属性数量（0-3）
       */
      const rollRandomStatCount = () => {
        const roll = Math.random() * 100
        // 累计概率：3条(7.5%) -> 2条(15%) -> 1条(30%) -> 0条(47.5%)
        if (roll < 7.5) return 3 // 7.5%概率获得3条
        if (roll < 22.5) return 2 // 15%概率获得2条（累计22.5%）
        if (roll < 52.5) return 1 // 30%概率获得1条（累计52.5%）
        return 0 // 47.5%概率获得0条
      }

      /**
       * 生成属性随机值（小数值高概率，大数值低概率）
       * 使用指数衰减分布：value = min + (max - min) * (1 - random^power)
       * power > 1 时，值偏向最小值
       * @param {number} addMin - 最小值（0.1）
       * @param {number} addMax - 最大值
       * @returns {number} 随机生成的属性值
       */
      const rollRandomAddValue = (addMin, addMax) => {
        // 确保最小值至少为0.1
        const min = Math.max(0.1, addMin)
        const max = Math.max(min, addMax)

        // 使用指数衰减，power=2 使概率偏向小值
        // random^2 使得结果更偏向0，从而最终值偏向min
        const random = Math.random()
        const power = 2
        const factor = 1 - Math.pow(random, power)

        const value = min + (max - min) * factor

        // 保留一位小数
        return Math.round(value * 10) / 10
      }

      /**
       * 从 possibleRandomStats 中随机选择指定数量的属性
       * @param {Array} possibleStats - 可能的属性列表
       * @param {number} count - 需要选择的数量
       * @returns {Array} 选中的属性数组（含随机值）
       */
      const selectRandomStats = (possibleStats, count) => {
        if (!possibleStats || possibleStats.length === 0 || count <= 0) {
          return []
        }

        // 复制数组以避免修改原数组
        const available = [...possibleStats]
        const selected = []

        // Fisher-Yates 洗牌选择
        for (let i = 0; i < count && available.length > 0; i += 1) {
          const randomIndex = Math.floor(Math.random() * available.length)
          const stat = available[randomIndex]

          // 生成随机属性值
          const randomAdd = rollRandomAddValue(0.1, stat.addMax || stat.add)

          selected.push({
            parameter: stat.parameter,
            add: randomAdd,
            addMax: stat.addMax,
            rate: stat.rate
          })

          // 移除已选中的属性，避免重复
          available.splice(randomIndex, 1)
        }

        return selected
      }

      // 生成随机属性
      const possibleStats = itemConfig.possibleRandomStats || []
      const statCount = rollRandomStatCount()
      const randomStats = selectRandomStats(possibleStats, statCount)

      // 创建新物品
      const maxStack = itemConfig.stack || 1
      const newItem = {
        id: itemConfig.id,
        icon: `/pt/item_icon/${itemConfig.id}.png`,
        name:
          typeof itemConfig.name === 'string'
            ? itemConfig.name
            : itemConfig.name?.cns || `物品#${itemConfig.id}`,
        description:
          typeof itemConfig.description === 'string'
            ? itemConfig.description
            : itemConfig.description?.cns || '',
        level: itemConfig.level || 0,
        cooldown: itemConfig.cooldown || 0,
        category: itemConfig.category || 'other',
        subcategory: itemConfig.subcategory || 'other',
        stack: maxStack,
        currentStack: 1,
        buyPrice: itemConfig.buyPrice || 0,
        sellPrice: itemConfig.sellPrice || 0,
        abilities: itemConfig.abilities || [],
        minAttack: itemConfig.minAttack || 0,
        maxAttack: itemConfig.maxAttack || 0,
        attackSpeedValue: itemConfig.attackSpeedValue,
        minDefense: itemConfig.minDefense || 0,
        maxDefense: itemConfig.maxDefense || 0,
        class: Array.isArray(itemConfig.class) ? itemConfig.class : [itemConfig.class],
        rarity: itemConfig.rarity || 'ultimate',
        element: itemConfig.element || 'none',
        sex: itemConfig.sex || 'all',
        upgradeLevels: itemConfig.upgradeLevels || [],
        uniqueId: generateUniqueId(),
        // 存储生成的随机属性（格式与 possibleRandomStats 相同，但 add 值已随机）
        possibleRandomStats: randomStats.length > 0 ? randomStats : undefined,
        ultimateConvertible: itemConfig.ultimateConvertible || false
      }

      // 添加到背包
      this.playerBag.push(newItem)

      return { success: true, randomStats }
    },

    /**
     * 批量添加物品到背包
     * @param {Array} items - 物品数组 [{itemId, quantity}]
     * @returns {boolean} 是否全部添加成功
     */
    addItemsToBag (items, options = {}) {
      if (!items || items.length === 0) {
        return false
      }

      let anySuccess = false
      let allSuccess = true

      // 防御性清理：移除背包中 currentStack <= 0 的残留物品
      // 这些物品可能是某些代码路径（如自动恢复）减少数量后未正确移除的
      const newPlayerBag = [...this.playerBag]
      const cleanedBag = newPlayerBag.filter(bagItem => {
        if (!bagItem) return false
        const stack = Number(bagItem.currentStack ?? bagItem.quantity ?? 1)
        return Number.isFinite(stack) && stack > 0
      })
      if (cleanedBag.length !== newPlayerBag.length) {
        newPlayerBag.length = 0
        newPlayerBag.push(...cleanedBag)
      }

      const bagCapacity = this.bagCapacity
      const stackableIndexByItemId = new Map()
      const addedByItemId =
        options && typeof options === 'object' ? options.addedByItemId || null : null
      const recordAdded = (itemId, quantity) => {
        if (!addedByItemId) {
          return
        }
        const key = String(itemId)
        const current = Number(addedByItemId[key] ?? 0)
        const next = current + quantity
        addedByItemId[key] = next
      }

      for (let i = 0; i < newPlayerBag.length; i += 1) {
        const bagItem = newPlayerBag[i]
        const bagItemId = Number(bagItem?.id)
        if (!Number.isFinite(bagItemId) || bagItemId <= 0) {
          continue
        }
        if (stackableIndexByItemId.has(bagItemId)) {
          continue
        }
        const bagItemConfig = this.getItemConfig(bagItemId)
        const bagItemMaxStack = Number(bagItemConfig?.stack ?? 1)
        if (!Number.isFinite(bagItemMaxStack) || bagItemMaxStack <= 1) {
          continue
        }
        const bagItemCurrentStack = Number(bagItem?.currentStack ?? bagItem?.quantity ?? 1)
        if (!Number.isFinite(bagItemCurrentStack) || bagItemCurrentStack <= 0) {
          continue
        }
        if (bagItemCurrentStack < bagItemMaxStack) {
          stackableIndexByItemId.set(bagItemId, i)
        }
      }

      for (const item of items) {
        const itemId = Number(item?.itemId)
        const quantityNumber = Number(item?.quantity ?? 1)
        const quantity = Number.isFinite(quantityNumber) && quantityNumber > 0 ? quantityNumber : 1
        if (!Number.isFinite(itemId) || itemId <= 0) {
          console.error('[ItemsStore] 批量添加物品失败：itemId 无效', item)
          allSuccess = false
          continue
        }

        const itemConfig = this.getItemConfig(itemId)
        if (!itemConfig) {
          console.error(`[ItemsStore] 未找到物品ID ${itemId} 的配置`)
          allSuccess = false
          continue
        }

        const maxStack = Number(itemConfig.stack || 9999)
        const mappedIndex = stackableIndexByItemId.has(itemId) ? stackableIndexByItemId.get(itemId) : -1
        const itemInBagIndex = Number.isInteger(mappedIndex) ? mappedIndex : -1
        const canStack =
          itemInBagIndex !== -1 &&
          maxStack > 1 &&
          newPlayerBag[itemInBagIndex] &&
          Number(newPlayerBag[itemInBagIndex].id) === itemId
        const currentStack = canStack ? Number(newPlayerBag[itemInBagIndex].currentStack || 0) : 0
        const availableStack = canStack ? Math.max(0, maxStack - currentStack) : 0
        const freeSlots = Math.max(0, bagCapacity - newPlayerBag.length)
        const totalCapacity = availableStack + freeSlots * maxStack

        if (quantity > totalCapacity) {
          allSuccess = false
          try {
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
              const event = new CustomEvent('bag-full', {
                detail: {
                  itemId,
                  quantity
                }
              })
              window.dispatchEvent(event)
            }
          } catch (error) {
            console.error('[ItemsStore] 派发 bag-full 事件失败:', error)
          }
          continue
        }

        let actualQuantity = quantity
        if (canStack && actualQuantity > 0) {
          const addQuantity = Math.min(availableStack, actualQuantity)
          if (addQuantity > 0) {
            const nextStack = currentStack + addQuantity
            newPlayerBag[itemInBagIndex].currentStack = nextStack
            actualQuantity -= addQuantity
            anySuccess = true
            recordAdded(itemId, addQuantity)
            if (nextStack >= maxStack) {
              stackableIndexByItemId.delete(itemId)
            } else {
              stackableIndexByItemId.set(itemId, itemInBagIndex)
            }
          }
        }

        while (actualQuantity > 0) {
          if (newPlayerBag.length >= bagCapacity) {
            allSuccess = false
            break
          }

          const stackQuantity = Math.min(actualQuantity, maxStack)
          const newItem = {
            id: itemConfig.id,
            icon: `/pt/item_icon/${itemConfig.id}.png`,
            name:
              typeof itemConfig.name === 'string'
                ? itemConfig.name
                : itemConfig.name?.cns || `物品#${itemConfig.id}`,
            description:
              typeof itemConfig.description === 'string'
                ? itemConfig.description
                : itemConfig.description?.cns || '',
            level: itemConfig.level || 0,
            cooldown: itemConfig.cooldown || 0,
            category: itemConfig.category || 'other',
            subcategory: itemConfig.subcategory || 'other',
            stack: maxStack,
            currentStack: stackQuantity,
            buyPrice: itemConfig.buyPrice || 0,
            sellPrice: HUAFU_SELL_PRICES[String(itemConfig.id)] || itemConfig.sellPrice || 0,
            abilities: itemConfig.abilities || [],
            minAttack: itemConfig.minAttack || 0,
            maxAttack: itemConfig.maxAttack || 0,
            attackSpeedValue: itemConfig.attackSpeedValue,
            minDefense: itemConfig.minDefense || 0,
            maxDefense: itemConfig.maxDefense || 0,
            class: Array.isArray(itemConfig.class) ? itemConfig.class : [itemConfig.class],
            rarity: itemConfig.rarity || 'common',
            element: itemConfig.element || 'none',
            sex: itemConfig.sex || 'all',
            upgradeLevels: itemConfig.upgradeLevels || [],
            twoHanded: itemConfig.twoHanded || false,
            ultimateConvertible: itemConfig.ultimateConvertible || false
          }

          if (maxStack === 1) {
            const itemType = itemConfig.category || 'other'
            let randomNumbers = ''
            for (let i = 0; i < 5; i += 1) {
              randomNumbers += Math.floor(Math.random() * 10).toString()
            }
            let randomLetters = ''
            for (let i = 0; i < 5; i += 1) {
              randomLetters += String.fromCharCode(97 + Math.floor(Math.random() * 26))
            }
            newItem.uniqueId = `${itemType}_${itemConfig.id}_${randomNumbers}${randomLetters}`

            // 为掉落的装备类物品按照精炼概率表附加强化等级和属性加成
            const dropEnhanceResult = generateDropEnhanceLevel(itemConfig)
            if (dropEnhanceResult.enhanceLevel > 0) {
              newItem.enhanceLevel = dropEnhanceResult.enhanceLevel
              newItem.StrengthenedAttributes = dropEnhanceResult.StrengthenedAttributes
            }
          }

          const newIndex = newPlayerBag.length
          newPlayerBag.push(newItem)
          actualQuantity -= stackQuantity
          anySuccess = true
          recordAdded(itemId, stackQuantity)
          if (maxStack > 1 && stackQuantity < maxStack && !stackableIndexByItemId.has(itemId)) {
            stackableIndexByItemId.set(itemId, newIndex)
          }
        }
      }

      if (anySuccess) {
        const isBagFull = newPlayerBag.length >= bagCapacity
        this.$patch((state) => {
          state.playerBag = newPlayerBag
          state.isBagFull = isBagFull
        })
      }

      return allSuccess
    },

    /**
     * 从背包中移除物品
     * @param {number} itemId - 物品ID
     * @param {number} quantity - 移除数量
     * @returns {boolean} 是否移除成功
     */
    removeItemFromBag (itemId, quantity = 1, options = {}) {
      const resolvedItemId = Number(itemId)
      if (!Number.isFinite(resolvedItemId) || resolvedItemId <= 0) {
        console.error('[ItemsStore] 移除物品失败：itemId 无效', itemId)
        return false
      }
      const resolvedQuantity = Math.floor(Number(quantity ?? 1))
      if (!Number.isFinite(resolvedQuantity) || resolvedQuantity <= 0) {
        console.error('[ItemsStore] 移除物品失败：quantity 无效', quantity)
        return false
      }

      const resolveStackCount = item => {
        const raw = item?.currentStack ?? item?.quantity ?? 1
        const count = Number(raw)
        return Number.isFinite(count) && count > 0 ? Math.floor(count) : 1
      }

      const uniqueId = options && typeof options === 'object' ? options.uniqueId : null
      
      // 如果指定了uniqueId，按uniqueId查找（不可堆叠物品）
      if (uniqueId !== null && uniqueId !== undefined && String(uniqueId)) {
        const targetIndex = this.playerBag.findIndex(
          item => item && Number(item.id) === resolvedItemId && String(item.uniqueId || '') === String(uniqueId)
        )

        if (targetIndex === -1) {
          console.warn(`[ItemsStore] 背包中未找到物品 uniqueId=${uniqueId}`)
          return false
        }
        const targetItem = this.playerBag[targetIndex]
        const targetCount = resolveStackCount(targetItem)
        if (resolvedQuantity > targetCount) {
          console.error(`[ItemsStore] 移除数量 ${resolvedQuantity} 超过物品数量 ${targetCount}`)
          return false
        }
        const remainingCount = targetCount - resolvedQuantity
        if (remainingCount <= 0) {
          // 直接从state.playerBag中移除，触发响应式更新
          this.playerBag.splice(targetIndex, 1)
        } else {
          // 直接修改state中的属性
          this.playerBag[targetIndex].currentStack = remainingCount
        }

        return true
      }

      // 按itemId查找（可堆叠物品）
      // 先计算总拥有数量
      let totalOwned = 0
      for (const item of this.playerBag) {
        if (item && Number(item.id) === resolvedItemId) {
          totalOwned += resolveStackCount(item)
          if (totalOwned >= resolvedQuantity) {
            break
          }
        }
      }

      if (totalOwned < resolvedQuantity) {
        console.error(`[ItemsStore] 移除数量 ${resolvedQuantity} 超过物品数量 ${totalOwned}`)
        return false
      }

      // 从后往前遍历移除
      let remaining = resolvedQuantity
      for (let index = this.playerBag.length - 1; index >= 0; index -= 1) {
        if (!remaining) {
          break
        }
        const item = this.playerBag[index]
        if (!item || Number(item.id) !== resolvedItemId) {
          continue
        }
        const itemQuantity = resolveStackCount(item)
        const removeCount = Math.min(itemQuantity, remaining)
        if (removeCount >= itemQuantity) {
          // 直接从state.playerBag中移除，触发响应式更新
          this.playerBag.splice(index, 1)
        } else {
          // 直接修改state中的属性
          this.playerBag[index].currentStack = itemQuantity - removeCount
        }
        remaining -= removeCount
      }

      if (remaining) {
        console.error(`[ItemsStore] 移除物品失败：扣除后仍剩余 ${remaining}`)
        return false
      }

      return true
    },

    /**
     * 出售物品
     * @param {number} itemId - 物品ID
     * @param {number} quantity - 出售数量
     * @param {{ uniqueId?: string|null, item?: object|null }} options - 可选参数
     * @returns {number} 出售获得的金币数量，-1表示失败
     */
    sellItem (itemId, quantity = 1, options = {}) {
      const itemConfig = this.getItemConfig(itemId)
      if (!itemConfig) {
        console.error(`[ItemsStore] 未找到物品ID ${itemId} 的配置`)
        return -1
      }
 
      const safeOptions = options && typeof options === 'object' ? options : {}
      const optionItem = safeOptions.item && typeof safeOptions.item === 'object' ? safeOptions.item : null
      const resolvedStack = Number(optionItem?.stack ?? itemConfig?.stack ?? 1)
      const stackValue = Number.isFinite(resolvedStack) ? Math.max(1, Math.floor(resolvedStack)) : 1
      const isNonStackable = stackValue <= 1
      let resolvedUniqueId = safeOptions.uniqueId ?? optionItem?.uniqueId ?? null

      // 旧数据兼容：不可叠加物品缺少 uniqueId 时，自动在背包中查找并补上
      if (isNonStackable && !resolvedUniqueId) {
        const fallbackIndex = this.playerBag.findIndex(
          item => item && Number(item.id) === Number(itemId)
        )
        if (fallbackIndex === -1) {
          console.warn(`[ItemsStore] 出售失败：不可叠加物品缺少唯一ID，且背包中未找到物品ID ${itemId}`)
          return -1
        }
        // 为旧数据自动生成唯一ID，使后续流程正常工作
        const fallbackId = `legacy_${itemId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        this.playerBag[fallbackIndex].uniqueId = fallbackId
        if (optionItem) {
          optionItem.uniqueId = fallbackId
        }
        resolvedUniqueId = fallbackId
        console.info(`[ItemsStore] 旧数据兼容：已为物品ID ${itemId} 自动补上唯一ID ${fallbackId}`)
      }

      const itemIndex = isNonStackable
        ? this.playerBag.findIndex(
          item =>
            item &&
            Number(item.id) === Number(itemId) &&
            String(item.uniqueId || '') === String(resolvedUniqueId || '')
        )
        : this.playerBag.findIndex(item => item.id === itemId)
      if (itemIndex === -1) {
        console.warn(`[ItemsStore] 背包中未找到物品ID ${itemId}`)
        return -1
      }

      const item = this.playerBag[itemIndex]
      const itemQuantity = item.currentStack || item.quantity || 1

      if (quantity > itemQuantity) {
        console.error(`[ItemsStore] 出售数量 ${quantity} 超过物品数量 ${itemQuantity}`)
        return -1
      }

      // 计算出售价格
      // 优先级：华弗商店配置 > 背包物品实例 > itemConfig(钻石商店/ITEM_INFO) > buyPrice/4
      const huafuSellPrice = HUAFU_SELL_PRICES[String(itemId)]
      const instanceSellPrice = Number(item?.sellPrice)
      let sellPrice = 0

      if (huafuSellPrice !== null && huafuSellPrice !== undefined && Number(huafuSellPrice) > 0) {
        // 优先使用华弗商店配置的出售价格
        sellPrice = Number(huafuSellPrice)
      } else if (Number.isFinite(instanceSellPrice) && instanceSellPrice > 0) {
        // 其次使用背包物品实例的出售价格
        sellPrice = instanceSellPrice
      } else {
        // 最后使用 itemConfig 的出售价格或 buyPrice/4
        sellPrice = itemConfig.sellPrice || Math.floor((itemConfig.buyPrice || 0) / 4)
      }

      // 强化等级出售价格加成：有强化等级的装备出售时额外增加金币
      const enhanceLevel = Number(item?.enhanceLevel ?? 0)
      const enhanceBonus = getEnhanceSellPriceBonus(enhanceLevel)
      const totalSellAmount = (sellPrice + enhanceBonus) * quantity
  
      // 移除物品
      const removeOptions = isNonStackable ? { uniqueId: resolvedUniqueId } : undefined
      this.removeItemFromBag(itemId, quantity, removeOptions)

      // 更新玩家金币
      this.playerGold += totalSellAmount

      return totalSellAmount
    },

    /**
     * 分解物品（批量操作，一次patch完成移除和添加）
     * 性能优化：将移除物品和添加分解产物合并为一次 patch 操作
     * @param {number} itemId - 要分解的物品ID
     * @param {string} uniqueId - 要分解的物品唯一ID
     * @param {Array<{itemId: number, count: number}>} products - 分解产物数组
     * @returns {{success: boolean, reason: string}} 分解结果
     */
    decomposeItem (itemId, uniqueId, products) {
      // 参数校验
      const resolvedItemId = Number(itemId)
      if (!Number.isFinite(resolvedItemId) || resolvedItemId <= 0) {
        return { success: false, reason: '物品ID无效' }
      }
      if (!uniqueId || typeof uniqueId !== 'string') {
        return { success: false, reason: '唯一ID无效' }
      }
      if (!Array.isArray(products) || products.length === 0) {
        return { success: false, reason: '分解产物无效' }
      }

      // 复制背包数组
      const newPlayerBag = [...this.playerBag]

      // 1. 移除物品
      const targetIndex = newPlayerBag.findIndex(
        item => item && Number(item.id) === resolvedItemId && String(item.uniqueId || '') === String(uniqueId)
      )
      if (targetIndex === -1) {
        return { success: false, reason: '背包中未找到该物品' }
      }
      newPlayerBag.splice(targetIndex, 1)

      // 2. 添加分解产物
      for (const product of products) {
        const productId = Number(product?.itemId)
        const quantity = Number(product?.count) || 0
        if (!Number.isFinite(productId) || productId <= 0 || quantity <= 0) {
          continue
        }

        const itemConfig = this.getItemConfig(productId)
        if (!itemConfig) {
          console.warn(`[ItemsStore] decomposeItem: 未找到物品配置 ${productId}`)
          continue
        }

        const maxStack = Number(itemConfig.stack) || 9999
        let remaining = quantity

        // 尝试堆叠到现有物品（查找所有未满的同ID物品）
        while (maxStack > 1 && remaining > 0) {
          const existingIndex = newPlayerBag.findIndex(
            item => item && Number(item.id) === productId && (Number(item.currentStack) || 0) < maxStack
          )
          if (existingIndex === -1) {
            break
          }
          const currentStack = Number(newPlayerBag[existingIndex].currentStack) || 0
          const canAdd = Math.min(maxStack - currentStack, remaining)
          if (canAdd > 0) {
            newPlayerBag[existingIndex].currentStack = currentStack + canAdd
            remaining -= canAdd
          } else {
            break
          }
        }

        // 添加新物品
        while (remaining > 0 && newPlayerBag.length < this.bagCapacity) {
          const stackQuantity = Math.min(remaining, maxStack)
          const newItem = {
            id: itemConfig.id,
            icon: `/pt/item_icon/${itemConfig.id}.png`,
            name: typeof itemConfig.name === 'string' ? itemConfig.name : itemConfig.name?.cns || `物品#${itemConfig.id}`,
            description: typeof itemConfig.description === 'string' ? itemConfig.description : itemConfig.description?.cns || '',
            level: itemConfig.level || 0,
            cooldown: itemConfig.cooldown || 0,
            category: itemConfig.category || 'other',
            subcategory: itemConfig.subcategory || 'other',
            stack: maxStack,
            currentStack: stackQuantity,
            buyPrice: itemConfig.buyPrice || 0,
            sellPrice: HUAFU_SELL_PRICES[String(itemConfig.id)] || itemConfig.sellPrice || 0,
            abilities: itemConfig.abilities || [],
            minAttack: itemConfig.minAttack || 0,
            maxAttack: itemConfig.maxAttack || 0,
            attackSpeedValue: itemConfig.attackSpeedValue,
            minDefense: itemConfig.minDefense || 0,
            maxDefense: itemConfig.maxDefense || 0,
            class: Array.isArray(itemConfig.class) ? itemConfig.class : [itemConfig.class],
            rarity: itemConfig.rarity || 'common',
            element: itemConfig.element || 'none',
            sex: itemConfig.sex || 'all',
            upgradeLevels: itemConfig.upgradeLevels || [],
            twoHanded: itemConfig.twoHanded || false,
            ultimateConvertible: itemConfig.ultimateConvertible || false
          }
          newPlayerBag.push(newItem)
          remaining -= stackQuantity
        }

        if (remaining > 0) {
          console.warn(`[ItemsStore] decomposeItem: 背包空间不足，${productId} 剩余 ${remaining} 个未添加`)
        }
      }

      // 3. 一次性更新 state
      const isBagFull = newPlayerBag.length >= this.bagCapacity
      this.$patch((state) => {
        state.playerBag = newPlayerBag
        state.isBagFull = isBagFull
      })

      // 4. 同步到 gameStore.player.bag 并保存到 localStorage
      try {
        const gameStore = useGameStore()
        if (gameStore?.player) {
          gameStore.player.bag = [...newPlayerBag]
        }
        // 保存到 localStorage 以确保持久化
        // storageService 已通过 import 导入全局单例
        storageService.savePlayerPatch({
          bag: [...newPlayerBag]
        })
      } catch (e) {
        console.warn('[ItemsStore] decomposeItem: 同步到gameStore或保存失败', e)
      }

      return { success: true, reason: '' }
    },

    /**
     * 清空背包
     */
    clearBag () {

      // 优化：使用 $patch 批量更新
      this.$patch((state) => {
        state.playerBag = []
        state.isBagFull = false
      })
    },

    organizeBag () {
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
        const itemConfig = this.getItemConfig(itemId)
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

      this.playerBag.forEach(item => {
        if (!item) {
          return
        }
        const itemId = Number(item.id)
        if (!Number.isFinite(itemId) || itemId <= 0) {
          kept.push({ ...item })
          return
        }
        const itemConfig = this.getItemConfig(itemId)
        if (!isMergeable(item, itemConfig)) {
          kept.push({ ...item })
          return
        }
        const key = itemId
        const entry = mergeGroups.get(key)
        const count = resolveStackCount(item)
        if (entry) {
          entry.total += count
          return
        }
        mergeGroups.set(key, { sample: item, config: itemConfig, total: count })
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

      const isBagFull = nextBag.length >= this.bagCapacity
      this.$patch((state) => {
        state.playerBag = nextBag
        state.isBagFull = isBagFull
      })
    },

    // ========== 装备管理 ==========

    /**
     * 装备物品
     * @param {number} itemId - 物品ID
     * @param {string} slotId - 装备槽ID
     * @returns {boolean} 是否装备成功
     */
    equipItem (itemId, slotId, options = {}) {
      this.$patch({ lastEquipErrorMessage: '' })

      const emitEquipError = message => {
        if (!message) {
          return
        }
        this.$patch({ lastEquipErrorMessage: message })
        console.warn('[ItemsStore] 装备失败:', message)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('show-message', {
              detail: {
                message,
                type: 'error'
              }
            })
          )
        }
      }

      const itemConfig = this.getItemConfig(itemId)
   
      if (!itemConfig) {
        console.error(`[ItemsStore] 未找到物品ID ${itemId} 的配置`)
        return false
      }

      const itemName = itemConfig.name?.cns || itemConfig.name?.en || itemConfig.name || '装备'

      // 检查物品是否可装备
      if (!['weapon', 'armor', 'accessory', 'jewelry', 'fashion'].includes(itemConfig.category)) {
        console.error(`[ItemsStore] 物品类别 ${itemConfig.category} 不可装备`)
        return false
      }

      let playerData = options?.player
      if (!playerData) {
        try {
          // storageService 已通过 import 导入全局单例
          playerData = storageService.loadPlayerData()
        } catch (error) {
          console.error('[ItemsStore] 获取玩家数据失败:', error)
        }
      }

      const playerLevel = Number(playerData?.level ?? 0)
      const playerSex = String(playerData?.sex ?? '')
      const playerClass = String(playerData?.class ?? '')

      const normalizeRestrictionValue = value => {
        if (value === null || value === undefined) {
          return ''
        }
        return String(value).trim().toLowerCase()
      }

      const normalizeRestrictionList = value => {
        if (value === null || value === undefined) {
          return []
        }
        if (Array.isArray(value)) {
          return value.map(entry => normalizeRestrictionValue(entry)).filter(Boolean)
        }
        return [normalizeRestrictionValue(value)].filter(Boolean)
      }

      const formatSexLabel = value => {
        const normalized = normalizeRestrictionValue(value)
        if (normalized === 'male') {
          return '男性'
        }
        if (normalized === 'female') {
          return '女性'
        }
        if (normalized === 'all') {
          return '所有'
        }
        return value || ''
      }

      const formatClassLabel = value => {
        const normalized = normalizeRestrictionValue(value)
        if (normalized === 'beginner') {
          return '初心者'
        }
        if (normalized === 'warrior') {
          return '战士'
        }
        if (normalized === 'knight') {
          return '骑士'
        }
        if (normalized === 'blade_warrior') {
          return '刀锋战士'
        }
        if (normalized === 'priest') {
          return '圣职者'
        }
        if (normalized === 'mage') {
          return '魔导士'
        }
        if (normalized === 'element_mage') {
          return '元素使者'
        }
        if (normalized === 'spirit_mage') {
          return '精神使者'
        }
        if (normalized === 'archer') {
          return '弓箭手'
        }
        if (normalized === 'ranger') {
          return '游侠'
        }
        if (normalized === 'assassin') {
          return '暗杀者'
        }
        if (normalized === 'guardian') {
          return '守护使者'
        }
        if (normalized === 'technician') {
          return '暴力技师'
        }
        if (normalized === 'holy_knight') {
          return '圣殿骑士'
        }
        if (normalized === 'storm_walker') {
          return '风暴行者'
        }
        if (normalized === 'arcane_master') {
          return '奥数师'
        }
        if (normalized === 'mind_master') {
          return '心灵师'
        }
        if (normalized === 'nature_messenger') {
          return '自然使者'
        }
        if (normalized === 'combat_master') {
          return '格斗宗师'
        }
        if (normalized === 'fierce_shooter') {
          return '暴烈射手'
        }
        if (normalized === 'joker_emperor') {
          return '暗夜主宰'
        }
        if (normalized === 'all') {
          return '全职业'
        }
        return value || ''
      }

      const requiredLevel = Number(itemConfig.level ?? 0)
      const normalizedRequiredLevel = Number.isFinite(requiredLevel) ? requiredLevel : 0
      if (normalizedRequiredLevel > 0) {
        if (!Number.isFinite(playerLevel) || playerLevel <= 0) {
          emitEquipError(`无法装备 ${itemName}：无法获取玩家等级信息`)
          return false
        }
        // ★ 大师进阶期间使用转生前原始等级进行装备等级判断
        const effectiveLevel = getEffectiveEquipLevel(playerData)
        if (!checkLevelRequirement(itemConfig, effectiveLevel)) {
          emitEquipError(`无法装备 ${itemName}：需要等级 ${normalizedRequiredLevel}，当前等级 ${playerLevel}`)
          return false
        }
      }

      const requiredSex = normalizeRestrictionValue(itemConfig.sex ?? itemConfig.gender ?? 'all')
      if (
        requiredSex &&
        requiredSex !== 'all' &&
        (!playerSex || normalizeRestrictionValue(playerSex) !== requiredSex)
      ) {
        emitEquipError(
          `无法装备 ${itemName}：性别限制 ${formatSexLabel(requiredSex)}，当前 ${formatSexLabel(playerSex) || '未知'}`
        )
        return false
      }

      const resolveJobRequirementId = value => {
        const normalized = normalizeRestrictionValue(value)
        if (!normalized) {
          return ''
        }

        if (/^\d+$/.test(normalized)) {
          const classId = Number(normalized)
          const chineseName = classMapping?.[classId]
          const mapped = chineseName ? classNameToKeyMap[chineseName] : ''
          return mapped || normalized
        }

        return normalized
      }

      const requiredClasses = normalizeRestrictionList(itemConfig.class ?? itemConfig.classRestriction)
        .map(resolveJobRequirementId)
        .filter(Boolean)

      const isPlayerClassAllowed = (playerJob, requiredJob) => {
        if (!requiredJob || requiredJob === 'all') {
          return true
        }
        if (requiredJob === 'beginner') {
          return true
        }

        let current = normalizeRestrictionValue(playerJob)
        const target = normalizeRestrictionValue(requiredJob)
        while (current) {
          if (current === target) {
            return true
          }
          current = classParents[current]
        }
        return false
      }

      if (
        requiredClasses.length > 0 &&
        !requiredClasses.includes('all') &&
        !playerClass
      ) {
        const requiredLabels = requiredClasses.map(formatClassLabel).filter(Boolean).join('/')
        emitEquipError(`无法装备 ${itemName}：职业限制 ${requiredLabels}，当前 未知`)
        return false
      }

      if (requiredClasses.length > 0 && !requiredClasses.includes('all') && playerClass) {
        const normalizedPlayerClass = normalizeRestrictionValue(playerClass)
        const allowed = requiredClasses.some(requiredJob => isPlayerClassAllowed(normalizedPlayerClass, requiredJob))
        if (!allowed) {
          const requiredLabels = requiredClasses.map(formatClassLabel).filter(Boolean).join('/')
          emitEquipError(
            `无法装备 ${itemName}：职业限制 ${requiredLabels}，当前 ${formatClassLabel(normalizedPlayerClass)}`
          )
          return false
        }
      }

      // 检查装备槽是否有效
      const validSlots = [
        'weapon',
        'shield',
        'mask',
        'cloak',
        'helmet',
        'armor',
        'gloves',
        'boots',
        'necklace',
        'ring1',
        'ring2',
        'earring1',
        'earring2',
        'fashionHat',
        'fashionSuit',
        'fashionGloves',
        'fashionBoots'
      ]
      if (!validSlots.includes(slotId)) {
        console.error(`[ItemsStore] 无效的装备槽: ${slotId}`)
        return false
      }

      // 双刀流检测：武器装备到副手(shield)槽位时，需玩家拥有双持能力
      const isWeaponToOffhand = itemConfig.category === 'weapon' && slotId === 'shield'
      if (isWeaponToOffhand) {
        if (!canDualWield(playerData)) {
          emitEquipError(`无法装备 ${itemName}：需要刀锋战士60级解锁双刀流后才能将武器装备到副手`)
          return false
        }
      }

      const { bagIndex, uniqueId, sourceItem } = options || {}
      const resolveItemIndex = () => {
        if (uniqueId) {
          const uniqueIndex = this.playerBag.findIndex(item => item && item.uniqueId === uniqueId)
          if (uniqueIndex !== -1) {
            return uniqueIndex
          }
        }
        if (typeof bagIndex === 'number' && this.playerBag[bagIndex]) {
          if (Number(this.playerBag[bagIndex]?.id) === Number(itemId)) {
            return bagIndex
          }
        }
        return this.playerBag.findIndex(item => item && Number(item.id) === Number(itemId))
      }
      const itemIndex = resolveItemIndex()
   
      if (itemIndex === -1) {
        console.error(`[ItemsStore] 背包中未找到物品ID ${itemId}`)
        return false
      }

      // 优化：先在本地变量中完成所有修改，然后一次性更新 state
      // 这样可以避免每次修改都触发 Vue 的响应式更新
      // 检查槽位中是否已经有装备
      let currentEquip = null
      if (this.equipment[slotId]) {
        currentEquip = this.equipment[slotId]
      }

      // 创建新的背包数组（避免直接修改原数组）
      const newPlayerBag = [...this.playerBag]

      // 如果有装备需要卸下，先添加到背包
      if (currentEquip) {
        newPlayerBag.push(currentEquip)
      }

      // 从背包中移除物品
      const item = newPlayerBag.splice(itemIndex, 1)[0]
 
      if (sourceItem?.StrengthenedAttributes && !item?.StrengthenedAttributes) {
        item.StrengthenedAttributes = { ...sourceItem.StrengthenedAttributes }
      }
      if (sourceItem?.enhanceLevel !== undefined && item?.enhanceLevel === undefined) {
        item.enhanceLevel = sourceItem.enhanceLevel
      }

      if ((item?.category || itemConfig.category) === 'weapon' && item.attackSpeedValue === undefined) {
        item.attackSpeedValue = itemConfig.attackSpeedValue
      }

      // 标记副手武器（双刀流场景：shield槽位中的weapon类型物品）
      // 属性计算时将根据此标记仅应用25%的属性加成
      if (isWeaponToOffhand) {
        item._isOffhandWeapon = true
      } else {
        // 移除可能残留的副手标记
        delete item._isOffhandWeapon
      }

      // 创建新的装备对象
      const newEquipment = { ...this.equipment }
      newEquipment[slotId] = item
 
      // 一次性批量更新 state，只触发一次响应式更新
      this.$patch((state) => {
        state.playerBag = newPlayerBag
        state.equipment = newEquipment
      })
      
      return true
    },

    /**
     * 卸下装备
     * @param {string} slotId - 装备槽ID
     * @returns {boolean} 是否卸下成功
     */
    unequipItem (slotId) {
      if (!this.equipment[slotId]) {
        console.warn(`[ItemsStore] 槽位 ${slotId} 没有装备`)
        return false
      }

      // 检查背包是否已满
      if (this.playerBag.length >= this.bagCapacity) {
        console.warn('[ItemsStore] 背包已满，无法卸下装备')
        return false
      }

      // 优化：先在本地变量中完成所有修改，然后一次性更新 state
      const equipment = this.equipment[slotId]

      // 清除副手武器标记（双刀流场景），避免标记残留到背包
      if (equipment && equipment._isOffhandWeapon) {
        delete equipment._isOffhandWeapon
      }

      // 创建新的背包数组
      const newPlayerBag = [...this.playerBag]
      newPlayerBag.push(equipment)

      // 创建新的装备对象
      const newEquipment = { ...this.equipment }
      newEquipment[slotId] = null

      // 更新背包状态
      const isBagFull = newPlayerBag.length >= this.bagCapacity

      // 一次性批量更新 state，只触发一次响应式更新
      this.$patch((state) => {
        state.playerBag = newPlayerBag
        state.equipment = newEquipment
        state.isBagFull = isBagFull
      })
    
      return true
    },

    /**
     * 使用物品
     * 物品使用成功后自动追踪消耗品成就进度（通过 achievementService 预过滤）
     * @param {number} itemId - 物品ID
     * @param {Function} callbacks - 回调函数对象
     * @param {number} quantity - 使用数量
     * @returns {Object} 使用结果 {success, message, effect}
     */
    useItem (itemId, callbacks = {}, quantity = 1) {
      
      const itemConfig = this.getItemConfig(itemId)
       
      
      if (!itemConfig) {
        return { success: false, message: '未找到该物品' }
      }

      const normalizedQuantity = Math.max(1, Number(quantity) || 1)

      const itemIndex = this.playerBag.findIndex(item => item.id === itemId)
      
      
      if (itemIndex === -1) {
        return { success: false, message: '背包中没有该物品' }
      }

      const item = this.playerBag[itemIndex]
      const availableQuantity = item.currentStack || item.quantity || 1

      if (normalizedQuantity > availableQuantity) {
        return { success: false, message: '使用数量超过背包数量' }
      }

      let result = null
      // petfeed 每次仅消耗1个，其余类型按 normalizedQuantity 消耗
      let consumedAmount = normalizedQuantity

      // 根据物品类型执行不同的使用逻辑
      if (itemConfig.category === 'recovery') {
        result = this.useRecoveryItem(item, itemConfig, callbacks, normalizedQuantity)
      } else if (itemConfig.category === 'buff') {
        result = this.useBuffItem(item, itemConfig, callbacks, normalizedQuantity)
      } else if (itemConfig.subcategory === 'petfeed') {
        result = this.usePetFeedItem(item, itemConfig, callbacks, normalizedQuantity)
        consumedAmount = 1
      } else if (itemConfig.category === 'scroll') {
        result = this.useScrollItem(item, itemConfig, callbacks, normalizedQuantity)
      } else if (itemConfig.category === 'material') {
        result = this.useMaterialItem(item, itemConfig, callbacks, normalizedQuantity)
      } else if (itemConfig.category === 'pack') {
        result = this.usePackItem(item, itemConfig, callbacks, normalizedQuantity)
      } else {
        result = { success: false, message: '该物品无法使用' }
      }

      // 物品使用成功后，追踪消耗品成就进度
      if (result?.success) {
        this._trackItemAchievement(itemId, consumedAmount)
      }

      return result
    },

    /**
     * 追踪消耗品物品使用成就进度
     * 业务意图：物品使用成功后，通过 achievementService 预过滤判断是否有对应成就，
     * 有则调用 achievementsStore.recordEvent 更新进度，无则直接跳过
     * @param {number} itemId - 物品ID
     * @param {number} amount - 消耗数量
     * @returns {void}
     */
    _trackItemAchievement (itemId, amount) {
      try {
        // 预过滤：无对应成就的物品直接跳过，避免不必要的 Store 调用
        if (!achievementService.hasItemAchievement(itemId)) return

        const gameStore = useGameStore()
        const achievementData = gameStore?.player?.achievement
        if (!achievementData) return

        // 满级跳过：该物品的所有关联成就均已满级，不再统计
        if (achievementService.isItemAchievementsFullyCompleted(itemId, achievementData)) return

        const achievementsStore = useAchievementsStore()
        achievementsStore.recordEvent(gameStore, 'useitem', { itemId, amount })
      } catch (error) {
        console.error('[itemsStore] 追踪消耗品成就失败:', error)
      }
    },

    /**
     * 使用礼包类物品（如属性攻击魔法石箱）
     * 开启礼包后获得礼包内所有物品，或通过回调处理特殊礼包
     * @param {Object} item - 背包中的物品实例
     * @param {Object} itemConfig - 物品配置
     * @param {Object} callbacks - 回调函数集合
     * @param {number} quantity - 使用数量
     * @returns {Object} 使用结果 {success, message, effect}
     */
    usePackItem (item, itemConfig, callbacks, quantity = 1) {
      const itemId = Number(item?.id)

      // 魔法宝笼 ID: 1000000 - 随机获得 F-S 级宠物
      if (itemId === MAGIC_CAGE_ITEM_ID) {
        return this.useMagicCageItem(item, itemConfig, callbacks, quantity)
      }

      // 属性攻击魔法石箱 ID: 347 - 需要打开选择面板
      if (itemId === 347) {
        // 检查是否有选择回调
        if (callbacks.onStoneSelect && typeof callbacks.onStoneSelect === 'function') {
          callbacks.onStoneSelect(item, itemConfig)
          return { success: true, message: '打开石头选择面板', effect: { type: 'stoneSelect' } }
        }
        return { success: false, message: '石头选择功能暂不可用' }
      }

      // 检查是否有礼包内容
      const contents = itemConfig.contents
      if (!contents || !Array.isArray(contents) || contents.length === 0) {
        return { success: false, message: '礼包内容为空' }
      }

      // selectbox 类型礼盒：需要选择性别后再获得对应物品，而非全部获得
      if (itemConfig.subcategory === 'selectbox' && contents.length >= 2) {
        if (callbacks.onGenderSelect && typeof callbacks.onGenderSelect === 'function') {
          callbacks.onGenderSelect(item, itemConfig, contents)
          return { success: true, message: '打开性别选择面板', effect: { type: 'genderSelect' } }
        }
        // 无回调时回退为默认行为（获得全部）
      }

      const obtainedItems = []

      // 遍历礼包内容，添加每个物品到背包
      for (const content of contents) {
        const contentItemId = Number(content.item)
        const contentCount = Math.max(1, Number(content.count) || 1) * quantity

        // 获取物品配置以获取名称
        const contentItemConfig = this.getItemConfig(contentItemId)
        const itemName = contentItemConfig?.name?.cns || contentItemConfig?.name || `物品ID: ${contentItemId}`

        // 添加物品到背包
        const addResult = this.addItemToBag(contentItemId, contentCount)
        if (addResult) {
          obtainedItems.push({
            id: contentItemId,
            name: itemName,
            count: contentCount
          })
        } else {
          console.warn(`[itemsStore] 礼包物品添加失败: ${contentItemId}`)
        }
      }

      // 礼包使用成功，移除礼包物品
      if (obtainedItems.length > 0) {
        this.removeItemFromBag(item.id, quantity)

        // 生成获得物品的描述
        const itemsDesc = obtainedItems.map(i => `${i.name} x${i.count}`).join('、')

        return {
          success: true,
          message: `开启礼包成功，获得: ${itemsDesc}`,
          effect: {
            type: 'pack',
            obtainedItems
          }
        }
      }

      return { success: false, message: '礼包开启失败' }
    },

    /**
     * 使用魔法宝笼（ID: 1000000）
     * 业务意图：消耗宠物笼钥匙，随机获得 F-S 级宠物
     * 品级概率受钥匙等级影响：低级+25%、中级+50%、高级+100%
     * @param {Object} item - 背包中的魔法宝笼实例
     * @param {Object} itemConfig - 物品配置
     * @param {Object} callbacks - 回调函数集合（未使用，保留兼容）
     * @param {number} quantity - 使用数量
     * @returns {Object} 使用结果 {success, message, effect}
     */
    useMagicCageItem (item, itemConfig, _callbacks, quantity = 1) {
      try {
        const result = openMagicCage(this.playerBag)

        if (!result.success) {
          return { success: false, message: result.message }
        }

        // 防御性检查：必须消耗钥匙才能开启，无钥匙不允许继续
        if (!result.keyUsed || !result.keyUsed.keyId) {
          console.warn('[itemsStore] 魔法牢笼：openMagicCage 未返回有效钥匙信息，中止开启')
          return { success: false, message: '需要宠物笼钥匙才能开启魔法牢笼！' }
        }

        // 消耗宠物笼钥匙（必须消耗三把钥匙之一）
        this.removeItemFromBag(result.keyUsed.keyId, 1)

        // 消耗魔法牢笼
        this.removeItemFromBag(item.id, quantity)

        // 如果开出了宠物，添加到背包
        // 与宠物训练师进化逻辑一致：先 addItemToBag 生成 uniqueId，再合并 pet_data
        if (result.petItem) {
          const petId = Number(result.petItem.id)
          const added = this.addItemToBag(petId, 1)
          if (!added) {
            console.warn('[itemsStore] 魔法牢笼：宠物添加背包失败，背包可能已满')
            return {
              success: true,
              message: `${result.message}（背包已满，宠物未能添加！）`,
              effect: {
                type: 'magicCage',
                petItem: null,
                grade: result.grade,
                keyUsed: result.keyUsed,
                bagFull: true
              }
            }
          }

          // 从背包末尾向前查找刚添加的宠物（与 PetTrainerModal 进化逻辑一致）
          // 原因：addItemToBag 对 stack=1 的宠物会在末尾创建新条目，
          //       若用 findIndex 从头部查找，会错误匹配到已有的同 ID 宠物，
          //       导致品级数据写入到旧宠物上，新宠物反而没有品级数据
          let outputIndex = -1
          for (let i = this.playerBag.length - 1; i >= 0; i -= 1) {
            const bagItem = this.playerBag[i]
            if (bagItem && Number(bagItem.id) === petId) {
              outputIndex = i
              break
            }
          }
          if (outputIndex >= 0) {
            const bagItem = this.playerBag[outputIndex]
            const mergedItem = {
              ...bagItem,
              ...(result.petItem.petConfig || {}),
              rarity: result.petItem.rarity || bagItem?.rarity || 'common',
              pet_level: result.petItem.pet_level,
              pet_data: result.petItem.pet_data,
              sellPrice: result.petItem.sellPrice || 0
            }
            this.playerBag.splice(outputIndex, 1, mergedItem)
          }

          return {
            success: true,
            message: result.message,
            effect: {
              type: 'magicCage',
              petItem: result.petItem,
              grade: result.grade,
              keyUsed: result.keyUsed
            }
          }
        }

        // 钥匙消耗了但没开出宠物
        return {
          success: true,
          message: result.message,
          effect: {
            type: 'magicCage',
            petItem: null,
            grade: null,
            keyUsed: result.keyUsed
          }
        }
      } catch (error) {
        console.error('[itemsStore] 使用魔法牢笼失败:', error)
        return { success: false, message: '魔法牢笼开启失败，请稍后再试' }
      }
    },

    /**
     * 使用卷轴类物品（如改名卷轴、属性更改卷轴、属性点重置卷）
     */
    useScrollItem (item, itemConfig, callbacks, _quantity = 1) {
      const itemId = Number(item?.id)
    

      // 改名卷轴 ID: 4656
      if (itemId === 4656) {
        // 调用改名回调
        if (callbacks.onRename && typeof callbacks.onRename === 'function') {
          callbacks.onRename(item, itemConfig)
          return { success: true, message: '打开改名面板', effect: { type: 'rename' } }
        }
        return { success: false, message: '改名功能暂不可用' }
      }

      // 属性更改卷轴 ID: 1529
      if (itemId === 1529) {
        // 调用属性更改回调
        if (callbacks.onElementChange && typeof callbacks.onElementChange === 'function') {
          callbacks.onElementChange(item, itemConfig)
          return { success: true, message: '打开属性选择面板', effect: { type: 'elementChange' } }
        }
        return { success: false, message: '属性更改功能暂不可用' }
      }

      // 属性点重置卷 ID: 1099
      if (itemId === 1099) {
        // 调用属性点重置回调
        if (callbacks.onStatReset && typeof callbacks.onStatReset === 'function') {
          callbacks.onStatReset(item, itemConfig)
          return { success: true, message: '属性点重置成功', effect: { type: 'statReset' } }
        }
        return { success: false, message: '属性点重置功能暂不可用' }
      }

      return { success: false, message: '该卷轴无法使用' }
    },

    /**
     * 使用材料类物品（如属性更改卷轴、属性攻击石头）
     * 材料类物品中的特殊物品可以使用
     */
    useMaterialItem (item, itemConfig, callbacks, quantity = 1) {
      const itemId = Number(item?.id)
      
      // 终极之力卷轴 ID: 12252 - 重置史诗＆终极武器特殊属性
      if (itemId === 12252) {
        // 调用重置武器属性回调
        if (callbacks.onResetWeaponAttribute && typeof callbacks.onResetWeaponAttribute === 'function') {
          callbacks.onResetWeaponAttribute(item, itemConfig)
          return { success: true, message: '打开重置武器属性面板', effect: { type: 'resetWeaponAttribute' } }
        }
        return { success: false, message: '重置武器属性功能暂不可用' }
      }

      // 终极加成卷轴 ID: 12944 - 重置转化终极武器新增特殊属性
      if (itemId === 12944) {
        // 调用重置终极武器新增特殊属性回调
        if (callbacks.onResetUltimateWeaponBonus && typeof callbacks.onResetUltimateWeaponBonus === 'function') {
          callbacks.onResetUltimateWeaponBonus(item, itemConfig)
          return { success: true, message: '打开重置终极武器新增特殊属性面板', effect: { type: 'resetUltimateWeaponBonus' } }
        }
        return { success: false, message: '重置终极武器新增特殊属性功能暂不可用' }
      }

      // 属性攻击石头ID与元素映射
      const ELEMENT_STONE_MAP = {
        8241: { element: 'fire', elementName: '火' },    // 蹈火之石
        2541: { element: 'water', elementName: '水' },   // 碧波之石
        547: { element: 'wind', elementName: '风' },     // 风驰之石
        5088: { element: 'thunder', elementName: '雷' }, // 电掣之石
        4053: { element: 'earth', elementName: '土' }    // 泥沙之石
      }

      // 检查是否为属性攻击石头
      if (ELEMENT_STONE_MAP[itemId]) {
        const stoneElement = ELEMENT_STONE_MAP[itemId]
        return this.useElementAttackStone(item, itemConfig, callbacks, stoneElement, quantity)
      }

  // 属性更改卷轴 ID: 1529
  if (itemId === 1529) {
    // 调用属性更改回调
    if (callbacks.onElementChange && typeof callbacks.onElementChange === 'function') {
      callbacks.onElementChange(item, itemConfig)
      return { success: true, message: '打开属性选择面板', effect: { type: 'elementChange' } }
    }
    return { success: false, message: '属性更改功能暂不可用' }
  }

    // 武器唤醒卷轴 ID: 5189
    if (itemId === 5189) {
      // 调用武器唤醒回调
      if (callbacks.onWeaponAwakening && typeof callbacks.onWeaponAwakening === 'function') {
        callbacks.onWeaponAwakening(item, itemConfig)
        return { success: true, message: '打开武器唤醒面板', effect: { type: 'weaponAwakening' } }
      }
      return { success: false, message: '武器唤醒功能暂不可用' }
    }

    // 祝福唤醒卷轴 ID: 7064(女神的祝福), 27754(恶魔祝福)
    if (itemId === 7064 || itemId === 27754) {
      // 调用祝福唤醒回调
      if (callbacks.onBlessingAwakening && typeof callbacks.onBlessingAwakening === 'function') {
        callbacks.onBlessingAwakening(item, itemConfig)
        return { success: true, message: '打开祝福唤醒面板', effect: { type: 'blessingAwakening' } }
      }
      return { success: false, message: '祝福唤醒功能暂不可用' }
    }

    return { success: false, message: '该材料无法使用' }
    },

    /**
     * 使用属性攻击石头
     * @param {Object} item - 背包中的物品实例
     * @param {Object} itemConfig - 物品配置
     * @param {Object} callbacks - 回调函数集合
     * @param {Object} stoneElement - 石头元素信息 { element, elementName }
     * @param {number} quantity - 使用数量
     * @returns {Object} 使用结果 {success, message, effect}
     */
    useElementAttackStone (item, itemConfig, callbacks, stoneElement, quantity = 1) {
     
      // 元素名称映射（用于错误提示）
      const elementNames = {
        fire: '火',
        water: '水',
        wind: '风',
        thunder: '雷',
        electricity: '雷',
        earth: '土'
      }

      // 获取已装备的武器
      const weapon = this.equipment?.weapon
      if (!weapon) {
        return { success: false, message: '未装备武器，无法使用属性攻击石头' }
      }

      // 检查武器是否有元素强化数据
      const elementalEnhancement = weapon.elementalEnhancement || weapon.StrengthenedAttributes?.elementalEnhancement
      if (!elementalEnhancement) {
        return { success: false, message: '武器无属性强化信息，无法使用属性攻击石头' }
      }

      // 从元素强化数据中获取武器的实际元素属性
      const elementKey = Object.keys(elementalEnhancement).find(key =>
        key !== 'attributeEnhanceCount' && elementalEnhancement[key]?.enhancementLevel > 0
      )

      if (!elementKey) {
        return { success: false, message: '武器无属性强化等级，无法使用属性攻击石头' }
      }

      // 元素匹配映射（处理 thunder/electricity 同为雷属性的情况）
      const elementMatchMap = {
        thunder: 'thunder',
        electricity: 'thunder',
        fire: 'fire',
        water: 'water',
        wind: 'wind',
        earth: 'earth'
      }

      const normalizedWeaponElement = elementMatchMap[elementKey] || elementKey
      const normalizedStoneElement = elementMatchMap[stoneElement.element] || stoneElement.element

      // 检查武器元素与石头元素是否匹配
      if (normalizedWeaponElement !== normalizedStoneElement) {
        const weaponElementName = elementNames[elementKey] || elementKey
        return {
          success: false,
          message: `武器属性为${weaponElementName}，无法使用${stoneElement.elementName}属性石头`
        }
      }

      // 增加20%属性攻击（持续1小时，通过BUFF实现）
      const attackIncrease = 20
      const duration = 3600 // 1小时

      // 移除石头
      this.removeItemFromBag(item.id, quantity)

      // 添加BUFF效果（用于显示持续时间并应用属性加成）
      const itemId = Number(item?.id)
      const buffId = 9000 + itemId // 使用唯一的BUFF ID
      if (callbacks.onAddBuff && typeof callbacks.onAddBuff === 'function') {
        callbacks.onAddBuff({
          id: buffId,
          name: `${stoneElement.elementName}属性攻击+${attackIncrease}%`,
          description: `武器${stoneElement.elementName}属性攻击提升${attackIncrease}%，持续1小时`,
          icon: itemConfig.icon ? `/pt/item_icon/${item.id}.png` : null,
          duration: duration,
          type: 'elementAttack',
          source: 'item',
          element: stoneElement.element,
          attackPercent: attackIncrease,
          addedAt: Date.now(),
          startTime: Date.now(),
          expiresAt: Date.now() + duration * 1000
        })
      }

      const message = `武器${stoneElement.elementName}属性攻击提升${attackIncrease}%，持续1小时`
      
      return {
        success: true,
        message,
        effect: {
          type: 'elementAttack',
          element: stoneElement.element,
          attackIncrease,
          duration
        }
      }
    },

    /**
     * 使用恢复类物品
     * 支持普通恢复（hp/mp/fp）和特殊维持型恢复（set: -1 表示维持满值）
     * 特殊物品如「无敌魔力多」(ID:5883) 使用 set:-1 + duration 创建维持MP满值的BUFF
     */
    useRecoveryItem (item, itemConfig, callbacks, quantity = 1) {
      // 计算恢复效果
      if (!itemConfig.abilities || itemConfig.abilities.length === 0) {
        return { success: false, message: '该物品没有使用效果' }
      }

      const effect = itemConfig.abilities.find(ability =>
        ['hp', 'mp', 'fp'].includes(ability.parameter)
      )

      if (!effect) {
        return { success: false, message: '该物品没有恢复效果' }
      }

      // 特殊处理：set: -1 表示维持满值（如「无敌魔力多」ID:5883）
      // 当物品具有 set:-1 能力且配置了 duration 时，创建维持型BUFF而非一次性恢复
      if (effect.set === -1 && Number(itemConfig.duration) > 0) {
        const buffDuration = Number(itemConfig.duration) * quantity
        const resolvedBuffIcon = (() => {
          const candidate = itemConfig?.icon
          if (typeof candidate === 'string') {
            const trimmed = candidate.trim()
            if (trimmed && !trimmed.includes('undefined')) {
              return trimmed
            }
          }
          const iconId = Number(item?.id)
          if (Number.isFinite(iconId) && iconId > 0) {
            return `/pt/item_icon/${iconId}.png`
          }
          return '/pt/item_icon/default_item.png'
        })()

        const buff = {
          id: item.id,
          name: itemConfig.name?.cns || itemConfig.name || '未知BUFF',
          description: typeof itemConfig.description === 'string' ? itemConfig.description : '',
          icon: resolvedBuffIcon,
          duration: buffDuration,
          type: 'mp_maintain',
          source: 'item',
          parameter: effect.parameter,
          effects: {},
          effectsRate: false,
          addedAt: Date.now(),
          startTime: Date.now(),
          expiresAt: Date.now() + buffDuration * 1000
        }

        // 调用BUFF回调
        if (callbacks.onAddBuff && typeof callbacks.onAddBuff === 'function') {
          callbacks.onAddBuff(buff)
        }

        // 立即将MP恢复到满值
        if (callbacks.onRestore && typeof callbacks.onRestore === 'function') {
          const maxValue = effect.parameter === 'mp' ? callbacks.maxMana : callbacks.maxHealth
          // 传入超大值确保直接回满
          callbacks.onRestore(effect.parameter, maxValue, item.id)
        }

        // 减少物品数量
        this.removeItemFromBag(item.id, quantity)

        const name = itemConfig.name?.cns || itemConfig.name
        const message = quantity > 1 ? `使用 ${name} x${quantity}，${effect.parameter.toUpperCase()}将维持满值` : `使用 ${name}，${effect.parameter.toUpperCase()}将维持满值`
        return { success: true, message, effect: { type: 'buff', buff } }
      }

      let restoreValue = 0
      if (effect.rate) {
        // 百分比恢复
        const maxValue = effect.parameter === 'hp' ? callbacks.maxHealth : callbacks.maxMana
        restoreValue = Math.floor(maxValue * (effect.add / 100))
      } else {
        // 固定值恢复
        restoreValue = effect.add || 0
      }

      // 调用恢复回调
      if (callbacks.onRestore && typeof callbacks.onRestore === 'function') {
        callbacks.onRestore(effect.parameter, restoreValue, item.id)
      }

      // 减少物品数量
      this.removeItemFromBag(item.id, quantity)

      const message = `使用 ${itemConfig.name?.cns || itemConfig.name} 恢复 ${restoreValue} ${effect.parameter.toUpperCase()}`
      return { success: true, message, effect: { type: effect.parameter, value: restoreValue } }
    },

    /**
     * 使用BUFF类物品
     */
    useBuffItem (item, itemConfig, callbacks, quantity = 1) {
      const itemId = Number(item?.id)
      const abilities = Array.isArray(itemConfig?.abilities) ? itemConfig.abilities : []
      if (!abilities.length) {
        return { success: false, message: '该物品没有BUFF效果' }
      }

      const baseDuration = Number(itemConfig.duration ?? 300)
      // 对于物品ID 829，不使用quantity计算持续时间，因为后续使用不延长持续时间
      const effectiveDuration = itemId === 829 ? baseDuration : (Number.isFinite(baseDuration) ? baseDuration : 300) * quantity

      const resolvedBuffIcon = (() => {
        const candidate = itemConfig?.icon
        if (typeof candidate === 'string') {
          const trimmed = candidate.trim()
          if (trimmed && !trimmed.includes('undefined')) {
            return trimmed
          }
        }
        const iconId = Number(item?.id)
        if (Number.isFinite(iconId) && iconId > 0) {
          return `/pt/item_icon/${iconId}.png`
        }
        return '/pt/item_icon/default_item.png'
      })()

      // 特殊物品ID处理：自动恢复卷轴(1276) 和 自动出售卷轴(1277)
      if (itemId === 1276 || itemId === 1277) {
        const ability = abilities[0] || {}
        const buffType = ability.type || (itemId === 1276 ? 'autoRecovery' : 'autoSell')

        const buff = {
          id: item.id,
          name: itemConfig.name?.cns || itemConfig.name || '未知BUFF',
          description: typeof itemConfig.description === 'string' ? itemConfig.description : '',
          icon: resolvedBuffIcon,
          duration: effectiveDuration,
          type: buffType,
          source: 'item',
          effects: {},
          effectsRate: false,
          addedAt: Date.now(),
          startTime: Date.now(),
          expiresAt: Date.now() + effectiveDuration * 1000
        }

        // 调用BUFF回调
        if (callbacks.onAddBuff && typeof callbacks.onAddBuff === 'function') {
          callbacks.onAddBuff(buff)
        }

        // 减少物品数量
        this.removeItemFromBag(item.id, quantity)

        const name = itemConfig.name?.cns || itemConfig.name
        const message = quantity > 1 ? `使用 ${name} x${quantity}` : `使用 ${name}`
        return { success: true, message, effect: { type: 'buff', buff } }
      }

      // 特殊物品ID处理：ES经验卷轴(829) - 最多叠加5次，经验倍率最高600%
      // 改进：通过callbacks获取当前玩家的activeBuffs，支持队友使用
      if (itemId === 829) {
        const maxStackCount = 5 // 最大叠加次数
        
        // 通过callbacks获取当前操作的玩家的activeBuffs
        // 如果callbacks提供了getActiveBuffs方法，使用它；否则回退到gameStore.player
        let currentBuffs = []
        if (callbacks.getActiveBuffs && typeof callbacks.getActiveBuffs === 'function') {
          currentBuffs = callbacks.getActiveBuffs() || []
        } else {
          // 回退方案：从gameStore获取（兼容旧代码）
          const gameStore = useGameStore()
          currentBuffs = gameStore.player?.activeBuffs || []
        }
        
        const now = Date.now()
        
        // 查找BUFF
        const existingBuffIndex = currentBuffs.findIndex(b => b.id === 829)

        let currentStackCount = 0
        let existingBuff = null
        let isBuffExpired = false

        if (existingBuffIndex !== -1) {
          existingBuff = currentBuffs[existingBuffIndex]
          // 检查BUFF是否已过期
          isBuffExpired = !existingBuff.expiresAt || existingBuff.expiresAt <= now
          
          if (!isBuffExpired) {
            // BUFF未过期，可以叠加
            currentStackCount = existingBuff.stackCount || 1
          } else {
            // BUFF已过期，重置为创建新BUFF
            existingBuff = null
            currentStackCount = 0
          }
        }

        // 检查是否已达到最大叠加次数
        if (currentStackCount >= maxStackCount) {
          const name = itemConfig.name?.cns || itemConfig.name
          return { success: false, message: `${name}已叠加至最大次数(${maxStackCount}次)，无法继续使用` }
        }

        // 计算新的叠加次数
        const newStackCount = currentStackCount + 1

        // 计算叠加后的增加百分比：每次使用增加100%
        // 使用1个 = +100%（2倍经验）
        // 使用2个 = +200%（3倍经验）
        // 使用3个 = +300%（4倍经验）
        // 使用4个 = +400%（5倍经验）
        // 使用5个 = +500%（6倍经验）
        const expRateAddPercent = newStackCount * 100 // 增加的百分比（100、200、300、400、500）
        
        // 动态生成描述：根据叠加次数显示当前经验倍率
        const dynamicDescription = `当前经验倍率：+${expRateAddPercent}%`

        // 如果已存在BUFF，更新叠加次数和效果
        if (existingBuff) {
          existingBuff.stackCount = newStackCount
          existingBuff.description = dynamicDescription
          existingBuff.effects = {
            ...existingBuff.effects,
            expRate: {
              add: expRateAddPercent,
              rate: true // 使用百分比形式
            }
          }
          existingBuff.effectsRate = true
          
          // 确保duration字段也更新（用于显示）
          existingBuff.duration = baseDuration

          // 调用BUFF更新回调
          if (callbacks.onUpdateBuff && typeof callbacks.onUpdateBuff === 'function') {
            callbacks.onUpdateBuff(existingBuff)
          }
        } else {
          // 创建新的BUFF
          const buff = {
            id: item.id,
            name: itemConfig.name?.cns || itemConfig.name || '未知BUFF',
            description: dynamicDescription,
            icon: resolvedBuffIcon,
            duration: baseDuration, // 首次使用持续60分钟（3600秒）
            type: 'buff',
            source: 'item',
            stackCount: 1,
            effects: {
              expRate: {
                add: expRateAddPercent,
                rate: true // 使用百分比形式
              }
            },
            effectsRate: true,
            addedAt: Date.now(),
            startTime: Date.now(),
            expiresAt: Date.now() + baseDuration * 1000
          }

          // 调用BUFF回调
          if (callbacks.onAddBuff && typeof callbacks.onAddBuff === 'function') {
            callbacks.onAddBuff(buff)
          }
        }

        // 减少物品数量
        this.removeItemFromBag(item.id, quantity)

        const name = itemConfig.name?.cns || itemConfig.name
        const message = `使用 ${name}，经验倍率增加${expRateAddPercent}%`
        return { success: true, message, effect: { type: 'buff', stackCount: newStackCount } }
      }

      // 参数映射表：将配置参数映射到 effects 中的标准键名
      const parameterToEffectKey = {
        hp: 'maxHealth',
        maxhp: 'maxHealth',
        maxhealth: 'maxHealth',
        mp: 'maxMana',
        maxmp: 'maxMana',
        maxmana: 'maxMana',
        attack: 'attack',
        def: 'defense',
        defense: 'defense',
        exprate: 'expRate',
        droprate: 'dropRate',
        criticalchance: 'criticalRate',
        criticalrate: 'criticalRate',
        criticaldamage: 'criticalDamage',
        attackspeed: 'attackSpeed',
        hitrate: 'hitRate',
        dodgerate: 'dodgeRate',
        blockrate: 'blockRate',
        // 四维属性映射（支持BUFF类物品的四维加成，如祝福的全能棉花糖）
        str: 'strength',
        strength: 'strength',
        sta: 'constitution',
        con: 'constitution',
        vit: 'constitution',
        constitution: 'constitution',
        int: 'intelligence',
        intelligence: 'intelligence',
        agi: 'agility',
        dex: 'agility',
        dexterity: 'agility',
        agility: 'agility'
      }

      // 处理多个 abilities，构建 effects 对象
      const effects = {}
      let hasEffects = false

      abilities.forEach(ability => {
        if (!ability || typeof ability !== 'object') {
          return
        }

        const rawParameter = String(ability.parameter ?? ability.type ?? '').trim().toLowerCase()
        const rawValue = Number(ability.add ?? 0)
        const isRate = Boolean(ability.rate)

        if (!rawParameter || !Number.isFinite(rawValue) || rawValue === 0) {
          return
        }

        // 特殊处理：经验倍率
        // 保留 rate: true，让 BUFF Tooltip 显示百分比形式（如 +5555%），与道具 Tooltip 一致
        // useExperienceCalculator 中 rate=true 时执行 multiplier += add / 100
        if (rawParameter === 'exprate') {
          effects.expRate = {
            add: rawValue,
            rate: isRate
          }
          hasEffects = true
          return
        }

        // 特殊处理：掉落倍率
        if (rawParameter === 'droprate') {
          effects.dropRate = {
            add: rawValue,
            rate: isRate
          }
          hasEffects = true
          return
        }

        // 通用处理：使用映射表
        const effectKey = parameterToEffectKey[rawParameter] || rawParameter
        effects[effectKey] = {
          add: rawValue,
          rate: isRate
        }
        hasEffects = true
      })

      if (!hasEffects) {
        return { success: false, message: '该物品没有有效的BUFF效果' }
      }

      const buff = {
        id: item.id,
        name: itemConfig.name?.cns || itemConfig.name || '未知BUFF',
        description: typeof itemConfig.description === 'string' ? itemConfig.description : '',
        icon: resolvedBuffIcon,
        duration: effectiveDuration,
        type: 'buff',
        source: 'item',
        effects,
        effectsRate: Object.values(effects).some(e => e.rate),
        addedAt: Date.now(),
        startTime: Date.now(),
        expiresAt: Date.now() + effectiveDuration * 1000
      }

      // 调用BUFF回调
      if (callbacks.onAddBuff && typeof callbacks.onAddBuff === 'function') {
        callbacks.onAddBuff(buff)
      }

      // 减少物品数量
      this.removeItemFromBag(item.id, quantity)

      const name = itemConfig.name?.cns || itemConfig.name
      const message = quantity > 1 ? `使用 ${name} x${quantity}` : `使用 ${name}`
      return { success: true, message, effect: { type: 'buff', buff } }
    },

    updateRaisedPetEnergyByKey (petKey, energy, maxEnergy) {
      const key = petKey === null || petKey === undefined ? '' : String(petKey)
      if (!key) {
        return false
      }

      const numericEnergy = Number(energy)
      const safeEnergy = Number.isFinite(numericEnergy) ? Math.max(0, Math.floor(numericEnergy)) : 0
      const numericMax = Number(maxEnergy)
      const safeMaxEnergy = Number.isFinite(numericMax) ? Math.max(0, Math.floor(numericMax)) : 0

      const newPlayerBag = [...this.playerBag]
      const isIdKey = key.startsWith('id:')
      const idValue = isIdKey ? Number(key.slice(3)) : NaN
      const index = newPlayerBag.findIndex(row => {
        if (!row) {
          return false
        }
        if (isIdKey) {
          return Number(row.id) === idValue
        }
        return String(row.uniqueId || '') === key
      })
      if (index === -1) {
        return false
      }

      const target = { ...newPlayerBag[index] }
      target.pet_energy = safeEnergy
      target.energy = safeEnergy
      target.currentEnergy = safeEnergy

      if (safeMaxEnergy > 0) {
        target.max_energy = safeMaxEnergy
        target.maxEnergy = safeMaxEnergy
      }

      if (target.pet_data && (typeof target.pet_data === 'object' || Array.isArray(target.pet_data))) {
        let nextPetData = target.pet_data
        try {
          nextPetData = JSON.parse(JSON.stringify(target.pet_data))
        } catch (error) {
          console.error('[ItemsStore] 克隆 pet_data 失败:', error)
          nextPetData = target.pet_data
        }

        const applyToEntry = entry => {
          if (!entry || typeof entry !== 'object') {
            return
          }
          entry.current_energy = safeEnergy
          if (safeMaxEnergy > 0) {
            entry.max_energy = safeMaxEnergy
          }
        }

        const pickLatestAndApply = list => {
          if (!Array.isArray(list) || list.length === 0) {
            return false
          }
          let best = null
          let bestLevel = -1
          list.forEach(candidate => {
            const level = Number(candidate?.pet_level ?? candidate?.petLevel ?? 0)
            const numericLevel = Number.isFinite(level) ? level : 0
            if (numericLevel >= bestLevel) {
              bestLevel = numericLevel
              best = candidate
            }
          })
          if (!best) {
            return false
          }
          applyToEntry(best)
          return true
        }

        let updated = false
        if (Array.isArray(nextPetData)) {
          const directEntries = nextPetData.filter(
            row =>
              row &&
              typeof row === 'object' &&
              ('pet_level' in row || 'current_energy' in row || 'max_energy' in row)
          )
          updated = pickLatestAndApply(directEntries)
          if (!updated) {
            const nestedEntries = []
            nextPetData.forEach(row => {
              if (!row || typeof row !== 'object') {
                return
              }
              Object.values(row).forEach(value => {
                if (
                  value &&
                  typeof value === 'object' &&
                  ('pet_level' in value || 'current_energy' in value || 'max_energy' in value)
                ) {
                  nestedEntries.push(value)
                }
              })
            })
            updated = pickLatestAndApply(nestedEntries)
          }
        } else if (typeof nextPetData === 'object' && nextPetData !== null) {
          const entries = Object.values(nextPetData).filter(
            value =>
              value &&
              typeof value === 'object' &&
              ('pet_level' in value || 'current_energy' in value || 'max_energy' in value)
          )
          updated = pickLatestAndApply(entries)
        }

        if (updated) {
          target.pet_data = nextPetData
        }
      }

      newPlayerBag[index] = target
      this.$patch((state) => {
        state.playerBag[index] = target
      })

      // 移除了同步 StorageService I/O：loadPlayerData() 是 async 方法但未 await，
      // 传入 savePlayerData 的是 Promise 而非真实数据（已修复 bug）。
      // 玩家数据保存由 useEventHandler 中的 savePlayerData 统一处理（带防抖），
      // 能量变化无需立即持久化。

      return true
    },

    /**
     * 使用训养宠物糖果（petfeed）
     * 用途/业务意图：当存在“召唤中”的训养宠物时，使用对应等级糖果可将其能量补满。
     * @param {object} item - 背包物品实例
     * @param {object} itemConfig - 静态物品配置
     * @param {object} callbacks - 回调集合（保留兼容）
     * @param {number} quantity - 使用数量
     * @returns {{ success:boolean, message:string, effect?:object }} 使用结果
     */
    usePetFeedItem (item, itemConfig, callbacks, quantity = 1) {
      const raisedPetSummonStore = useRaisedPetSummonStore()
      if (!raisedPetSummonStore.hasSummonedPet) {
        return { success: false, message: '当前没有召唤训养宠物，无法使用该糖果' }
      }

      if (!raisedPetSummonStore.isCurrentTierCandy(item?.id)) {
        const requiredCandyItemId = raisedPetSummonStore.currentTierCandyItemId
        const requiredConfig =
          requiredCandyItemId && Number.isFinite(Number(requiredCandyItemId))
            ? this.getItemConfig(Number(requiredCandyItemId))
            : null
        const requiredName =
          requiredConfig && requiredConfig.name
            ? typeof requiredConfig.name === 'object'
              ? requiredConfig.name.cns || requiredConfig.name.eng || requiredConfig.name.en
              : requiredConfig.name
            : requiredCandyItemId
              ? `糖果ID:${requiredCandyItemId}`
              : '对应等级糖果'

        return { success: false, message: `当前糖果不匹配,请使用${requiredName}` }
      }

      const result = raisedPetSummonStore.refillEnergyWithTierCandy(item.id)
      if (!result?.success) {
        return { success: false, message: result?.message || '使用失败' }
      }

      this.updateRaisedPetEnergyByKey(
        raisedPetSummonStore.summonedPetKey,
        raisedPetSummonStore.summonedPetEnergy,
        raisedPetSummonStore.summonedPetMaxEnergy
      )

      const consumedQuantity = 1
      this.removeItemFromBag(item.id, consumedQuantity)

      const name = itemConfig.name?.cns || itemConfig.name
      const suffix = quantity > 1 ? '（本次仅消耗 1 个）' : ''
      return {
        success: true,
        message: `使用 ${name}，${result.message}${suffix}`,
        effect: { type: 'raisedpet_energy', value: raisedPetSummonStore.summonedPetEnergy }
      }
    },

    // ========== 背包容量管理 ==========

    /**
     * 更新背包容量
     * @param {number} level - 玩家等级
     */
    updateBagCapacity (level) {
      const initialSlots = 35 // 初始可使用格子数
      const totalSlots = 400 // 背包总格子数
      const slotsPerLevel = 1 // 每升1级解锁一个格子

      const unlockedSlots = Math.min(Math.floor(level * slotsPerLevel), totalSlots - initialSlots)

      this.bagCapacity = initialSlots + unlockedSlots

      // 更新背包状态
      this.isBagFull = this.playerBag.length >= this.bagCapacity
    },

    /**
     * 获取背包物品
     * @returns {Array} 背包物品列表的副本
     */
    getBagItems () {
      return [...this.playerBag]
    },

    /**
     * 在背包中查找物品
     * @param {number} itemId - 物品ID
     * @returns {Object|null} 物品对象或null
     */
    findItemInBag (itemId) {
      return this.playerBag.find(item => item.id === itemId) || null
    },

    /**
     * 获取背包中指定物品的总数量
     * @param {number} itemId - 物品ID
     * @returns {number} 物品总数量
     */
    getItemCount (itemId) {
      const resolvedItemId = Number(itemId)
      if (!Number.isFinite(resolvedItemId) || resolvedItemId <= 0) {
        return 0
      }
      const resolveStackCount = item => {
        const raw = item?.currentStack ?? item?.quantity ?? 1
        const count = Number(raw)
        return Number.isFinite(count) && count > 0 ? Math.floor(count) : 1
      }
      return this.playerBag
        .filter(item => item && Number(item.id) === resolvedItemId)
        .reduce((total, item) => total + resolveStackCount(item), 0)
    }
  }
})
