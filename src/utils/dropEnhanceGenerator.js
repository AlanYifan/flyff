/**
 * @fileoverview 掉落装备强化等级生成器
 * @description 怪物掉落装备时，按照对应物品类型的强化概率表，随机附加强化等级数据
 * 仅保留普通装备和普通首饰概率表（终极装备/首饰不会掉落，通过转换获得）
 * 概率表：
 *   - 普通装备（武器/防具/盾牌）：最大+10
 *   - 普通首饰（项链/耳环/戒指）：最大+10
 * 强化属性加成计算与 EnhancePanel.vue / PlayerStatsService.js 中的逻辑一致：
 *   enhancedValue = Math.round(baseValue * (1 + enhanceRatePerLevel * enhanceLevel))
 * @author FLYFF Team
 * @version 1.2.0
 * @created 2026-06-20
 * @updated 2026-06-20 - 删除终极装备/首饰概率表（掉落不含终极品质）
 */

/**
 * 普通装备（武器/防具/盾牌）精炼概率表
 * key: 目标强化等级, value: 成功概率(%)
 */
const NORMAL_ENHANCE_PROBABILITY_TABLE = {
  1: 10,
  2: 9,
  3: 8,
  4: 7,
  5: 6,
  6: 5,
  7: 4,
  8: 2,
  9: 1,
  10: 0.05
}

/**
 * 普通首饰（项链/耳环/戒指）精炼概率表
 * key: 目标强化等级, value: 成功概率(%)
 */
const JEWELRY_ENHANCE_PROBABILITY_TABLE = {
  1: 100,
  2: 50,
  3: 25, 
  4: 15, 
  5: 10, 
  6: 5, 
  7: 4, 
  8: 2, 
  9: 1, 
  10: 0.05
}

/**
 * 强化等级对应的出售价格加成表
 * key: 强化等级, value: 出售时额外增加的金币数量
 */
const ENHANCE_SELL_PRICE_BONUS_TABLE = {
  1: 15000,
  2: 50000,
  3: 75000,
  4: 150000,
  5: 300000,
  6: 600000,
  7: 1500000,
  8: 3000000,
  9: 8500000,
  10: 20000000
}

/**
 * 根据强化等级获取出售价格加成
 * @param {number} enhanceLevel - 强化等级
 * @returns {number} 出售价格加成金额，0表示无加成
 */
export function getEnhanceSellPriceBonus (enhanceLevel) {
  const level = Number(enhanceLevel)
  if (!Number.isFinite(level) || level <= 0) {
    return 0
  }
  return ENHANCE_SELL_PRICE_BONUS_TABLE[level] || 0
}

/**
 * 可附加强化等级的防具子分类集合
 */
const ENHANCEABLE_ARMOR_SUBCATEGORIES = new Set([
  'helmet', 'suit', 'gloves', 'gauntlet', 'boots', 'shield'
])

/**
 * 判断物品是否为可附加强化等级的装备类型
 * 武器（weapon）、防具（armor的helmet/suit/gloves/gauntlet/boots/shield）、首饰（jewelry）
 * @param {Object} itemConfig - 物品配置对象
 * @returns {boolean} 是否可附加强化等级
 */
export function isEnhanceableEquipment (itemConfig) {
  if (!itemConfig) {
    return false
  }
  const { category, subcategory } = itemConfig

  // 武器
  if (category === 'weapon') {
    return true
  }

  // 防具：帽子、衣服、手套、鞋子、盾牌
  if (category === 'armor' && subcategory) {
    return ENHANCEABLE_ARMOR_SUBCATEGORIES.has(subcategory)
  }

  // 首饰：项链、耳环、戒指
  if (category === 'jewelry') {
    return true
  }

  return false
}

/**
 * 根据物品分类获取对应的精炼概率表
 * 掉落仅含普通品质，终极装备/首饰通过转换获得，不使用此生成器
 * @param {Object} itemConfig - 物品配置对象
 * @returns {Object} 精炼概率表
 */
function getEnhanceProbabilityTable (itemConfig) {
  const isJewelry = itemConfig.category === 'jewelry'

  if (isJewelry) {
    return JEWELRY_ENHANCE_PROBABILITY_TABLE
  }
  return NORMAL_ENHANCE_PROBABILITY_TABLE
}

/**
 * 根据精炼概率表，逐级判断能成功达到的最高强化等级
 * 从+1开始逐级尝试，每级独立判定是否成功，失败则停止
 * @param {Object} probabilityTable - 精炼概率表
 * @returns {number} 最终强化等级（0表示无强化）
 */
function rollEnhanceLevel (probabilityTable) {
  const levels = Object.keys(probabilityTable)
    .map(Number)
    .sort((a, b) => a - b)

  let enhanceLevel = 0

  for (const level of levels) {
    const probability = probabilityTable[level]
    // 以概率百分比判定是否成功升到该等级
    if (Math.random() * 100 < probability) {
      enhanceLevel = level
    } else {
      // 失败则停止继续尝试
      break
    }
  }

  return enhanceLevel
}

/**
 * 计算+10时的总强化倍率
 * 与 EnhancePanel.vue 中 resolveEnhanceRateAtPlus10 逻辑一致
 * @param {number} equipmentLevel - 装备等级
 * @param {string} equipmentRarity - 装备稀有度
 * @returns {number} +10时的总倍率
 */
function resolveEnhanceRateAtPlus10 (equipmentLevel, equipmentRarity) {
  const normalizedLevel = Number(equipmentLevel)
  if (!Number.isFinite(normalizedLevel) || normalizedLevel <= 0) {
    return 0
  }
  if (equipmentRarity === 'ultimate' && normalizedLevel >= 150) {
    return 0.656
  }
  if (normalizedLevel <= 60) {
    return 0.358
  }
  if (normalizedLevel <= 70) {
    return 0.3525
  }
  if (normalizedLevel <= 105) {
    return 0.3345
  }
  if (normalizedLevel <= 120) {
    return 0.329
  }
  if (normalizedLevel <= 150) {
    return 0.2955
  }
  if (normalizedLevel <= 175) {
    return 0.2935
  }
  return 0.2935
}

/**
 * 计算每级强化倍率
 * 与 EnhancePanel.vue 中 resolveEnhanceRatePerLevel 逻辑一致
 * @param {number} equipmentLevel - 装备等级
 * @param {string} equipmentRarity - 装备稀有度
 * @returns {number} 每级强化倍率
 */
function resolveEnhanceRatePerLevel (equipmentLevel, equipmentRarity) {
  const rateAtPlus10 = resolveEnhanceRateAtPlus10(equipmentLevel, equipmentRarity)
  if (!Number.isFinite(rateAtPlus10) || rateAtPlus10 <= 0) {
    return 0
  }
  return rateAtPlus10 / 10
}

/**
 * 判断装备是否为武器类型
 * @param {Object} itemConfig - 物品配置对象
 * @returns {boolean} 是否为武器
 */
function isWeaponType (itemConfig) {
  return itemConfig.category === 'weapon'
}

/**
 * 判断装备是否为防具类型（帽子/衣服/手套/鞋子/盾牌）
 * @param {Object} itemConfig - 物品配置对象
 * @returns {boolean} 是否为防具
 */
function isArmorType (itemConfig) {
  return itemConfig.category === 'armor' &&
    ENHANCEABLE_ARMOR_SUBCATEGORIES.has(itemConfig.subcategory)
}

/**
 * 计算强化后的属性加成并构建 StrengthenedAttributes
 * 与 EnhancePanel.vue 中精炼成功后写入的逻辑一致
 * 武器：enhancedMinAttack / enhancedMaxAttack
 * 防具：enhancedMinDefense / enhancedMaxDefense
 * 首饰：只记录 enhanceLevel 和 enhanceCount（首饰加成通过 upgradeLevels/abilities 体现）
 * @param {Object} itemConfig - 物品配置对象
 * @param {number} enhanceLevel - 强化等级
 * @returns {Object} StrengthenedAttributes 对象
 */
function buildStrengthenedAttributes (itemConfig, enhanceLevel) {
  // 首饰（含终极首饰）：只记录强化等级和精炼次数
  if (itemConfig.category === 'jewelry') {
    return {
      enhanceLevel,
      enhanceCount: enhanceLevel
    }
  }

  // 武器或防具：计算强化后的攻击力/防御力
  const enhanceRatePerLevel = resolveEnhanceRatePerLevel(itemConfig.level, itemConfig.rarity)
  const isWeapon = isWeaponType(itemConfig)
  const isArmor = isArmorType(itemConfig)
  const canCalculateEnhance =
    enhanceLevel > 0 &&
    Number.isFinite(enhanceRatePerLevel) &&
    enhanceRatePerLevel > 0 &&
    (isWeapon || isArmor)

  if (!canCalculateEnhance) {
    return {
      enhanceLevel,
      enhanceCount: enhanceLevel
    }
  }

  // 基础属性：武器取攻击力，防具取防御力
  const baseMin = Number(isWeapon ? itemConfig.minAttack : itemConfig.minDefense ?? 0)
  const baseMax = Number(isWeapon ? itemConfig.maxAttack : itemConfig.maxDefense ?? 0)

  const enhancedMin = Math.round(baseMin * (1 + enhanceRatePerLevel * enhanceLevel))
  const enhancedMax = Math.round(baseMax * (1 + enhanceRatePerLevel * enhanceLevel))

  const result = {
    enhanceLevel,
    enhanceCount: enhanceLevel,
    // 按 enhanceLevel 键存储该等级的加成数据（PlayerStatsService 中 levelAttrs 读取路径）
    [String(enhanceLevel)]: {
      enhanceLevel,
      ...(isWeapon
        ? {
            enhancedMinAttack: enhancedMin,
            enhancedMaxAttack: enhancedMax
          }
        : {
            enhancedMinDefense: enhancedMin,
            enhancedMaxDefense: enhancedMax
          })
    },
    // 顶层也写入加成数据（PlayerStatsService 中 attrs.enhancedMin* 读取路径）
    ...(isWeapon
      ? {
          enhancedMinAttack: enhancedMin,
          enhancedMaxAttack: enhancedMax
        }
      : {
          enhancedMinDefense: enhancedMin,
          enhancedMaxDefense: enhancedMax
        })
  }

  return result
}

/**
 * 为掉落的装备生成随机强化等级和完整的强化属性数据
 * 仅对可强化的装备类型（武器、帽子、衣服、手套、鞋子、盾牌、项链、耳环、戒指）生效
 * 按照对应物品的稀有度和分类使用精炼概率表，逐级判定最终强化等级
 * 同时计算并写入完整的 StrengthenedAttributes（含攻击/防御加成），确保 PlayerStatsService 可正确识别
 * @param {Object} itemConfig - 物品配置对象
 * @returns {{ enhanceLevel: number, StrengthenedAttributes: Object|null }} 强化数据，enhanceLevel=0 表示未强化
 */
export function generateDropEnhanceLevel (itemConfig) {
  if (!isEnhanceableEquipment(itemConfig)) {
    return { enhanceLevel: 0, StrengthenedAttributes: null }
  }

  // 不可堆叠物品才附加强化等级（stack <= 1 的装备）
  const maxStack = Number(itemConfig.stack ?? 1)
  if (maxStack > 1) {
    return { enhanceLevel: 0, StrengthenedAttributes: null }
  }

  const probabilityTable = getEnhanceProbabilityTable(itemConfig)
  const enhanceLevel = rollEnhanceLevel(probabilityTable)

  if (enhanceLevel <= 0) {
    return { enhanceLevel: 0, StrengthenedAttributes: null }
  }

  const StrengthenedAttributes = buildStrengthenedAttributes(itemConfig, enhanceLevel)

  return { enhanceLevel, StrengthenedAttributes }
}
