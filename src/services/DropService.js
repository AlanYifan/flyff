/**
 * 掉落服务
 * 统一处理怪物掉落的经验、金币和物品逻辑
 */
import { useItemsStore } from '@/store/items'
import { useMonstersStore } from '@/store/monsters'
import { generateDropEnhanceLevel } from '@/utils/dropEnhanceGenerator'

export class DropService {
  /**
   * 处理怪物掉落
   * @param {Object} monster - 怪物对象
   * @param {number} playerLevel - 玩家等级
   * @param {number} playerMaxExp - 玩家当前等级所需的最大经验值
   * @param {Object} gameData - 游戏数据（已弃用，保留参数以兼容旧接口）
   * @returns {Object} 掉落奖励 { exp, gold, items }
   */
  static processMonsterDrop (monster, playerLevel, playerMaxExp, gameData = null, dropRateMultiplier = 1) {
    const startedAt = performance.now()
    const rewards = {
      exp: 0,
      gold: 0,
      items: []
    }

    if (!monster) {
      console.log(
        `[AutoBattlePerf] DropService.processMonsterDrop 耗时: ${(
          performance.now() - startedAt
        ).toFixed(2)} ms (无怪物)`
      )
      return rewards
    }

    rewards.exp = this.calculateExpReward(monster, playerLevel, playerMaxExp)
    rewards.gold = this.calculateGoldReward(monster)
    rewards.items = this.calculateItemDrops(monster, gameData, dropRateMultiplier)

    console.log(
      `[AutoBattlePerf] DropService.processMonsterDrop 耗时: ${(
        performance.now() - startedAt
      ).toFixed(2)} ms (exp: ${Number(rewards.exp || 0).toFixed(2)}, gold: ${
        rewards.gold || 0
      }, items: ${rewards.items?.length || 0})`
    )
    return rewards
  }

  /**
   * 获取物品完整数据（兼容旧接口）
   * @param {number|string} itemId - 物品ID
   * @returns {Object|null} 物品完整数据，未找到返回null
   */
  static getFullItemData (itemId) {
    const numericId = Number(itemId)
    if (!numericId || Number.isNaN(numericId)) {
      return null
    }

    const itemsStore = useItemsStore()
    const itemConfig = itemsStore.getItemConfig(numericId)

    if (itemConfig) {
      return {
        ...itemConfig,
        id: numericId,
        icon: `/pt/item_icon/${numericId}.png`,
        name: this.getItemName(itemConfig)
      }
    }

    console.warn(`[DropService] 未找到物品ID: ${numericId}`)
    return {
      id: numericId,
      name: `物品#${numericId}`,
      icon: `/pt/item_icon/${numericId}.png`
    }
  }

  /**
   * 计算经验奖励
   * @param {Object} monster - 怪物对象
   * @param {number} playerLevel - 玩家等级
   * @param {number} playerMaxExp - 玩家当前等级所需的最大经验值
   * @returns {number} 经验值
   */
  static calculateExpReward (monster, playerLevel, playerMaxExp) {
    const monstersStore = useMonstersStore()
    const monsterConfig = monster?.id ? monstersStore.getMonsterConfig(monster.id) : null

    const expTable = Array.isArray(monster?.experienceTable)
      ? monster.experienceTable
      : Array.isArray(monsterConfig?.experienceTable)
        ? monsterConfig.experienceTable
        : null

    if (!expTable || expTable.length === 0) {
      return 0
    }

    const expIndex = Math.min(playerLevel - 1, expTable.length - 1)
    const expPercentage = expTable[expIndex]

    return (expPercentage / 100) * playerMaxExp
  }

  /**
   * 计算金币奖励
   * @param {Object} monster - 怪物对象
   * @returns {number} 金币数量
   */
  static calculateGoldReward (monster) {
    if (monster.giveGold) {
      return monster.giveGold
    } else if (monster.gold) {
      return monster.gold
    } else if (monster.minDropGold !== undefined && monster.maxDropGold !== undefined) {
      return (
        Math.floor(Math.random() * (monster.maxDropGold - monster.minDropGold + 1)) +
        monster.minDropGold
      )
    }

    return 0
  }

  /**
   * 计算物品掉落
   * @param {Object} monster - 怪物对象
   * @param {Object} gameData - 游戏数据（已弃用，保留参数以兼容旧接口）
   * @returns {Array} 掉落的物品列表
   */
  static calculateItemDrops (monster, gameData = null, dropRateMultiplier = 1) {
    const startedAt = performance.now()
    if (!monster.drops || !Array.isArray(monster.drops)) {
      console.log(
        `[AutoBattlePerf] DropService.calculateItemDrops 耗时: ${(
          performance.now() - startedAt
        ).toFixed(2)} ms (无掉落配置)`
      )
      return []
    }

    // 判断是否为时空毁灭者（ID 4611）
    const isTimeDestroyer = monster.id === 4611

    const items = monster.drops
      .filter(drop => this.checkDropRate(drop, dropRateMultiplier))
      .map(drop => {
        const item = this.createDropItem(drop, gameData)
        // 如果是时空毁灭者掉落的物品，添加属性抗性
        if (isTimeDestroyer && item) {
          this.addElementalResistances(item)
        }
        return item
      })
      .filter(item => item !== null)
    console.log(
      `[AutoBattlePerf] DropService.calculateItemDrops 耗时: ${(
        performance.now() - startedAt
      ).toFixed(2)} ms (掉落数: ${items.length})`
    )
    return items
  }

  /**
   * 属性抗性子类型映射
   * key: subcategory 值
   * value: 全属性抗性加成百分比
   */
  static ELEMENTAL_RESISTANCE_CONFIG = {
    hat: 7,      // 帽子：全属性抗性 +7%
    helmet: 7,   // 头盔：全属性抗性 +7%
    suit: 10,    // 衣服：全属性抗性 +10%
    gauntlet: 9, // 手套：全属性抗性 +9%
    boots: 8     // 鞋子：全属性抗性 +8%
  }

  /**
   * 属性抗性英文名称映射
   * 用于 abilities 中的 parameter 字段
   */
  static ELEMENTAL_RESISTANCE_PARAMS = {
    fire: 'firedefense',       // 火属性抗性
    wind: 'winddefense',       // 风属性抗性
    earth: 'earthdefense',     // 土属性抗性
    electricity: 'electricitydefense', // 雷属性抗性
    water: 'waterdefense'      // 水属性抗性
  }

  /**
   * 为物品添加属性抗性
   * 仅对稀有品质的防具（帽子、衣服、手套、鞋子）生效
   * @param {Object} item - 物品对象
   */
  static addElementalResistances (item) {
    if (!item) return

    // 检查是否为稀有品质
    if (item.rarity !== 'rare') return

    // 检查是否为防具类型
    if (item.category !== 'armor') return

    // 获取子类型
    const subcategory = item.subcategory?.toLowerCase()
    if (!subcategory) return

    // 获取对应的抗性加成值
    const resistanceValue = this.ELEMENTAL_RESISTANCE_CONFIG[subcategory]
    if (!resistanceValue) return

    // 初始化 abilities 数组（如果不存在）
    if (!item.abilities) {
      item.abilities = []
    }

    // 添加全属性抗性
    const elementalResistances = [
      { parameter: 'firedefense', add: resistanceValue, rate: true },
      { parameter: 'winddefense', add: resistanceValue, rate: true },
      { parameter: 'earthdefense', add: resistanceValue, rate: true },
      { parameter: 'electricitydefense', add: resistanceValue, rate: true },
      { parameter: 'waterdefense', add: resistanceValue, rate: true }
    ]

    // 将属性抗性添加到 abilities 中
    for (const resistance of elementalResistances) {
      item.abilities.push(resistance)
    }

    console.log(`[DropService] 为 ${item.name} 添加全属性抗性 +${resistanceValue}%`)
  }

  /**
   * 检查掉落率
   * @param {Object} drop - 掉落对象
   * @returns {boolean} 是否掉落
   */
  static checkDropRate (drop, dropRateMultiplier = 1) {
    let dropRate = 0

    if (drop.prob) {
      const match = drop.prob.match(/\[(\d+(\.\d+)?)%?;([\d.]+)%?\[/)
      if (match) {
        const minProb = parseFloat(match[1])
        const maxProb = parseFloat(match[3])
        dropRate = minProb + Math.random() * (maxProb - minProb)
      } else {
        dropRate = parseFloat(drop.prob) || 0
      }
    } else if (drop.probability) {
      const match = drop.probability.match(/\[(\d+(\.\d+)?)%?;([\d.]+)%?\[/)
      if (match) {
        const minProb = parseFloat(match[1])
        const maxProb = parseFloat(match[3])
        dropRate = minProb + Math.random() * (maxProb - minProb)
      } else {
        dropRate = parseFloat(drop.probability) || 0
      }
    } else if (drop.rate) {
      dropRate = drop.rate
    }

    // 应用掉落倍率
    const adjustedDropRate = dropRate * dropRateMultiplier
    // 掉落概率上限为 100%
    const finalDropRate = Math.min(adjustedDropRate, 100)

    return Math.random() * 100 < finalDropRate
  }

  /**
   * 创建掉落物品对象
   * @param {Object} drop - 掉落对象
   * @param {Object} gameData - 游戏数据（已弃用，保留参数以兼容旧接口）
   * @returns {Object} 物品对象
   */
  static createDropItem (drop) {
    if (typeof drop.item === 'number') {
      return this.createDropItemFromId(drop.item, drop.stack || 1)
    } else if (typeof drop.item === 'object' && drop.item !== null) {
      return this.createDropItemFromObject(drop.item, drop.stack || 1)
    }

    return null
  }

  /**
   * 从物品ID创建掉落物品
   * @param {number} itemId - 物品ID
   * @param {number} stack - 堆叠数量
   * @param {Object} gameData - 游戏数据（已弃用，保留参数以兼容旧接口）
   * @returns {Object} 物品对象
   */
  static createDropItemFromId (itemId, stack = 1) {
    // 从 itemsStore 获取物品配置
    const itemsStore = useItemsStore()
    const fullItemData = itemsStore.getItemConfig(itemId)

    if (fullItemData) {
      const dropItem = {
        ...fullItemData,
        id: itemId,
        stack: fullItemData.stack || 9999,
        currentStack: stack,
        icon: `/pt/item_icon/${itemId}.png`,
        name: this.getItemName(fullItemData)
      }

      // 为装备类掉落物品附加强化等级数据
      const enhanceResult = generateDropEnhanceLevel(fullItemData)
      if (enhanceResult.enhanceLevel > 0) {
        dropItem.enhanceLevel = enhanceResult.enhanceLevel
        dropItem.StrengthenedAttributes = enhanceResult.StrengthenedAttributes
      }

      return dropItem
    }

    // 兜底：返回基础物品对象
    console.warn(`[DropService] 未找到物品ID: ${itemId}`)
    return {
      id: itemId,
      stack: stack || 1,
      currentStack: 1,
      name: `物品#${itemId}`,
      icon: `/pt/item_icon/${itemId}.png`
    }
  }

  /**
   * 从物品对象创建掉落物品
   * @param {Object} itemObj - 物品对象
   * @param {number} stack - 堆叠数量
   * @returns {Object} 物品对象
   */
  static createDropItemFromObject (itemObj, stack = 1) {
    const itemToAdd = {
      ...itemObj,
      stack: stack || 1,
      id: itemObj.id || itemObj.itemId || itemObj.item_id
    }

    if (!itemToAdd.id && typeof itemObj === 'object') {
      const possibleIdFields = ['id', 'itemId', 'item_id', 'itemID', 'item']
      for (const field of possibleIdFields) {
        if (itemObj[field] !== undefined) {
          itemToAdd.id = itemObj[field]
          break
        }
      }
    }

    return itemToAdd.id ? itemToAdd : null
  }

  /**
   * 获取物品名称
   * @param {Object} itemData - 物品数据
   * @returns {string} 物品名称
   */
  static getItemName (itemData) {
    if (!itemData || !itemData.name) {
      return `物品#${itemData?.id || '未知'}`
    }

    if (typeof itemData.name === 'object' && itemData.name.cns) {
      return itemData.name.cns
    } else if (typeof itemData.name === 'string') {
      return itemData.name
    }

    return `物品#${itemData.id}`
  }
}
