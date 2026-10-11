/**
 * 分解系统配置数据
 * 定义首饰分解规则和产出
 * @file DECOMPOSE_CONFIG.js
 * @generated 2026-02-23
 */

/**
 * 分解产出物品ID
 */
export const DECOMPOSE_OUTPUT_ITEMS = Object.freeze({
  JEWELRY_DUST: 12055, // 首饰粉尘
  CURSED_JEWELRY_FRAGMENT: 19291 // 被诅咒的首饰碎片
})

/**
 * 普通首饰分解规则
 * 根据强化等级返回分解产出
 * @param {number} enhanceLevel - 强化等级
 * @returns {Object} 分解产出 { itemId: number, count: number }[]
 */
export const getNormalJewelryDecomposeResult = (enhanceLevel) => {
  const level = Math.floor(enhanceLevel)
  if (level < 8) {
    return []
  }

  const rules = {
    8: [
      { itemId: DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST, count: 4 },
      { itemId: DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT, count: 0 }
    ],
    9: [
      { itemId: DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST, count: 5 },
      { itemId: DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT, count: 0 }
    ],
    10: [
      { itemId: DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST, count: 7 },
      { itemId: DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT, count: 0 }
    ],
    11: [
      { itemId: DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST, count: 9 },
      { itemId: DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT, count: 0 }
    ],
    12: [
      { itemId: DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST, count: 22 },
      { itemId: DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT, count: 0 }
    ],
    13: [
      { itemId: DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST, count: 28 },
      { itemId: DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT, count: 0 }
    ],
    14: [
      { itemId: DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST, count: 35 },
      { itemId: DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT, count: 0 }
    ],
    15: [
      { itemId: DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST, count: 88 },
      { itemId: DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT, count: 0 }
    ],
    16: [
      { itemId: DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST, count: 113 },
      { itemId: DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT, count: 24 }
    ],
    17: [
      { itemId: DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST, count: 149 },
      { itemId: DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT, count: 60 }
    ],
    18: [
      { itemId: DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST, count: 222 },
      { itemId: DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT, count: 134 }
    ],
    19: [
      { itemId: DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST, count: 326 },
      { itemId: DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT, count: 178 }
    ],
    20: [
      { itemId: DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST, count: 1000 },
      { itemId: DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT, count: 912 }
    ]
  }

  // 如果等级超过20，使用20级的规则
  const effectiveLevel = Math.min(level, 20)
  return rules[effectiveLevel] || []
}

/**
 * 终极首饰分解规则
 * 根据物品的dismantle字段获取分解产出
 * 如果当前强化等级没有对应dismantle数据，则使用模拟推算
 * @param {Object} item - 物品对象（必须包含dismantle字段）
 * @returns {Object} 分解产出 { itemId: number, count: number }[]
 */
export const getUltimateJewelryDecomposeResult = (item) => {
  if (!item || !item.dismantle || !Array.isArray(item.dismantle)) {
    return []
  }

  const enhanceLevel = item.enhanceLevel || 0
  const results = []

  // 遍历dismantle数组，找到匹配当前强化等级的条目
  item.dismantle.forEach(entry => {
    const inputLevel = entry.inputUpgradeLevel ?? 0
    if (inputLevel === enhanceLevel && entry.item && entry.count > 0) {
      results.push({
        itemId: entry.item,
        count: entry.count
      })
    }
  })

  // 如果没有找到对应的dismantle数据，尝试使用模拟推算（仅支持+6到+10）
  if (results.length === 0 && enhanceLevel >= 6 && enhanceLevel <= 10) {
    const allResults = getUltimateJewelryAllDecomposeResults(item)
    if (allResults.has(enhanceLevel)) {
      const simulatedResults = allResults.get(enhanceLevel)
      simulatedResults.forEach(result => {
        results.push({
          itemId: result.itemId,
          count: result.count
        })
      })
    }
  }

  return results
}

/**
 * 获取终极首饰所有可能的分解产出（用于规则展示）
 * 包含模拟推算6-10级的数据
 * @param {Object} item - 物品对象
 * @returns {Map<number, Array<{itemId: number, count: number}>>} 按强化等级分组的分解产出
 */
export const getUltimateJewelryAllDecomposeResults = (item) => {
  const resultsByLevel = new Map()

  if (!item || !item.dismantle || !Array.isArray(item.dismantle)) {
    return resultsByLevel
  }

  // 收集原始数据
  item.dismantle.forEach(entry => {
    const inputLevel = entry.inputUpgradeLevel ?? 0
    if (!resultsByLevel.has(inputLevel)) {
      resultsByLevel.set(inputLevel, [])
    }
    resultsByLevel.get(inputLevel).push({
      itemId: entry.item,
      count: entry.count,
      isSimulated: false // 标记为原始数据
    })
  })

  // 获取已有的等级
  const existingLevels = Array.from(resultsByLevel.keys())
  const maxExistingLevel = Math.max(...existingLevels)
  const minExistingLevel = Math.min(...existingLevels)

  // 检查是否需要模拟推算（最大等级小于10时需要推算到10级）
  // 只有当有足够的基础数据（至少3级）时才进行推算
  if (maxExistingLevel < 10 && existingLevels.length >= 3) {
    // 获取首饰粉尘(12055)和碎片(19291)的最后一级数据
    const dustValues = []
    const fragmentValues = []

    // 按等级顺序收集数据
    existingLevels.sort((a, b) => a - b).forEach(level => {
      const items = resultsByLevel.get(level)
      if (items) {
        const dustItem = items.find(i => i.itemId === DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST)
        const fragmentItem = items.find(i => i.itemId === DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT)
        dustValues.push({ level, count: dustItem?.count || 0 })
        fragmentValues.push({ level, count: fragmentItem?.count || 0 })
      }
    })

    // 获取最后一级的粉尘和碎片值
    const lastDustData = dustValues[dustValues.length - 1]
    const lastFragmentData = fragmentValues[fragmentValues.length - 1]
    const lastDustValue = lastDustData.count || 0
    const lastFragmentValue = lastFragmentData.count || 0

    // 固定模拟数值：+10 粉尘=3552，碎片=888
    // 从最后一级（通常是+5）到+10，按比例分配
    const targetDustAt10 = 3552
    const targetFragmentAt10 = 888

    // 计算需要模拟的等级数量
    const startLevel = maxExistingLevel + 1
    const totalSteps = 10 - maxExistingLevel

    // 为每个等级计算数值（线性插值到目标值）
    for (let level = startLevel; level <= 10; level++) {
      const step = level - maxExistingLevel
      const ratio = step / totalSteps

      // 线性插值计算粉尘和碎片
      const dustCount = Math.round(lastDustValue + (targetDustAt10 - lastDustValue) * ratio)
      const fragmentCount = Math.round(lastFragmentValue + (targetFragmentAt10 - lastFragmentValue) * ratio)

      resultsByLevel.set(level, [
        { itemId: DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST, count: dustCount, isSimulated: true },
        { itemId: DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT, count: fragmentCount, isSimulated: true }
      ])
    }
  }

  return resultsByLevel
}

/**
 * 检查物品是否可以分解
 * @param {Object} item - 物品对象
 * @returns {boolean} 是否可以分解
 */
export const canDecomposeItem = (item) => {
  if (!item) return false

  // 检查是否是首饰类（category === 'jewelry'）
  const category = String(item.category || '').toLowerCase()
  if (category !== 'jewelry') return false

  // 检查是否是戒指、项链或耳环
  const subcategory = String(item.subcategory || '').toLowerCase()
  const validSubcategories = ['ring', 'necklace', 'earring']
  if (!validSubcategories.includes(subcategory)) return false

  return true
}

/**
 * 获取物品的分解结果（自动判断普通/终极首饰）
 * @param {Object} item - 物品对象
 * @returns {Array<{itemId: number, count: number}>} 分解产出
 */
export const getDecomposeResult = (item) => {
  if (!item) return []

  const rarity = String(item.rarity || '').toLowerCase()

  if (rarity === 'ultimate') {
    // 终极首饰使用dismantle字段
    return getUltimateJewelryDecomposeResult(item)
  } else {
    // 普通首饰使用强化等级规则
    const enhanceLevel = item.enhanceLevel || 0
    return getNormalJewelryDecomposeResult(enhanceLevel)
  }
}

/**
 * 检查物品是否可以分解（包含强化等级检查）
 * @param {Object} item - 物品对象
 * @returns {{canDecompose: boolean, reason: string}} 分解检查结果
 */
export const checkDecomposeCondition = (item) => {
  if (!item) {
    return { canDecompose: false, reason: '物品不存在' }
  }

  if (!canDecomposeItem(item)) {
    return { canDecompose: false, reason: '该物品不可分解' }
  }

  const rarity = String(item.rarity || '').toLowerCase()

  if (rarity === 'ultimate') {
    // 终极首饰：检查当前强化等级是否有对应的dismantle产出或模拟数据
    const results = getUltimateJewelryDecomposeResult(item)
    if (results.length > 0) {
      return { canDecompose: true, reason: '' }
    } else {
      // 检查是否可以模拟推算
      const enhanceLevel = item.enhanceLevel || 0
      if (enhanceLevel >= 6 && enhanceLevel <= 10 && item.dismantle && Array.isArray(item.dismantle) && item.dismantle.length >= 3) {
        return { canDecompose: true, reason: '' }
      }
      return { canDecompose: false, reason: '该强化等级无法分解' }
    }
  } else {
    // 普通首饰：需要强化等级>=8
    const enhanceLevel = item.enhanceLevel || 0
    if (enhanceLevel >= 8) {
      return { canDecompose: true, reason: '' }
    } else {
      return { canDecompose: false, reason: '强化等级不足，请提高强化等级至+8以上' }
    }
  }
}

/**
 * 检查物品是否是终极首饰
 * @param {Object} item - 物品对象
 * @returns {boolean} 是否是终极首饰
 */
export const isUltimateJewelry = (item) => {
  if (!item) return false
  const rarity = String(item.rarity || '').toLowerCase()
  return rarity === 'ultimate'
}

/**
 * 获取分解结果描述
 * @param {number} enhanceLevel - 强化等级
 * @returns {string} 分解结果描述
 */
export const getDecomposeResultDescription = (enhanceLevel) => {
  const level = Math.floor(enhanceLevel)
  if (level < 8) {
    return '强化等级不足，请提高强化等级'
  }

  const result = getNormalJewelryDecomposeResult(level)
  if (result.length === 0) {
    return '无法分解'
  }

  const parts = []
  result.forEach(item => {
    if (item.count > 0) {
      parts.push(`×${item.count}`)
    }
  })

  return parts.length > 0 ? parts.join(' + ') : '无产出'
}
