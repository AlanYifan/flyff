/**
 * @file usePickuppetFilter.js
 * @description 捡宠过滤逻辑组合式函数
 * 业务意图：根据用户配置的捡宠过滤设置，判断掉落物是否应该被捡宠自动拾取
 * - 金币始终拾取（不过滤）
 * - 物品根据 category/subcategory 与用户过滤配置匹配
 * - 配置从 localStorage 的 userSettings 中读取
 * - 未匹配到过滤规则的物品默认不拾取（只拾取已勾选的类别）
 * - 提供缓存机制避免高频扫描时反复读取并解析 localStorage
 * @since 2026-06-23
 */

/** 捡宠过滤配置键名列表 */
const PICKUPPET_FILTER_KEYS = [
  'pickuppetFilterWeapon',
  'pickuppetFilterHelmet',
  'pickuppetFilterSuit',
  'pickuppetFilterGloves',
  'pickuppetFilterBoots',
  'pickuppetFilterShield',
  'pickuppetFilterNecklace',
  'pickuppetFilterRing',
  'pickuppetFilterEarring',
  'pickuppetFilterBooty',
  'pickuppetFilterHp',
  'pickuppetFilterMp',
  'pickuppetFilterFp',
  'pickuppetFilterPetEgg',
  'pickuppetFilterPkPaper',
  'pickuppetFilterElementCard',
  'pickuppetFilterPiercingCard',
  'pickuppetFilterOtherMaterial'
]

/** 默认过滤配置（全部拾取） */
const DEFAULT_FILTER = {}
for (const key of PICKUPPET_FILTER_KEYS) {
  DEFAULT_FILTER[key] = true
}

/** 过滤配置缓存（避免每次扫描都读取并解析 localStorage） */
let _cachedFilter = null

/** 缓存有效期（毫秒），2秒内复用缓存 */
const CACHE_TTL_MS = 2000

/** 缓存写入时间戳 */
let _cacheTimestamp = 0

/**
 * 从 localStorage 加载捡宠过滤配置
 * @returns {Object} 过滤配置对象
 */
export const loadPickuppetFilterSettings = () => {
  try {
    const rawSettings = localStorage.getItem('userSettings')
    const savedSettings = rawSettings ? JSON.parse(rawSettings) : {}
    const filter = { ...DEFAULT_FILTER }
    for (const key of PICKUPPET_FILTER_KEYS) {
      if (savedSettings[key] !== undefined) {
        filter[key] = Boolean(savedSettings[key])
      }
    }
    return filter
  } catch (error) {
    console.error('[usePickuppetFilter] 加载过滤配置失败:', error)
    return { ...DEFAULT_FILTER }
  }
}

/**
 * 获取捡宠过滤配置（带缓存）
 * 在缓存有效期内直接返回缓存结果，避免高频扫描时反复读取并解析 localStorage
 * @returns {Object} 过滤配置对象
 */
export const getCachedPickuppetFilterSettings = () => {
  const now = Date.now()
  if (_cachedFilter && (now - _cacheTimestamp) < CACHE_TTL_MS) {
    return _cachedFilter
  }
  _cachedFilter = loadPickuppetFilterSettings()
  _cacheTimestamp = now
  return _cachedFilter
}

/**
 * 使过滤配置缓存失效
 * 在用户保存新的过滤设置后调用，确保下次扫描使用最新配置
 */
export const invalidatePickuppetFilterCache = () => {
  _cachedFilter = null
  _cacheTimestamp = 0
}

/**
 * 判断物品是否应该被捡宠自动拾取
 * 规则：只有勾选的类别才拾取，未勾选的不拾取，未匹配到过滤规则的默认不拾取
 * @param {Object} item - 掉落物数据（DropAnimation 的 item prop，已包含 category/subcategory）
 * @param {Object|null} itemConfig - 物品配置信息（从 ITEM_INFO 查询，可为 null）
 * @param {Object} filter - 过滤配置对象
 * @returns {boolean} 是否应该拾取
 */
export const shouldPickuppetPickup = (item, itemConfig, filter) => {
  if (!item) return false

  // 优先从 itemConfig 获取分类信息，其次从 item 本身获取
  const category = String(
    itemConfig?.category || item.category || ''
  ).toLowerCase()
  const subcategory = String(
    itemConfig?.subcategory || item.subcategory || ''
  ).toLowerCase()

  // 武器
  if (category === 'weapon') {
    return Boolean(filter.pickuppetFilterWeapon)
  }

  // 防具按子类别判断
  if (category === 'armor') {
    if (subcategory === 'shield') {
      return Boolean(filter.pickuppetFilterShield)
    }
    if (subcategory === 'helmet') {
      return Boolean(filter.pickuppetFilterHelmet)
    }
    if (subcategory === 'suit') {
      return Boolean(filter.pickuppetFilterSuit)
    }
    if (subcategory === 'gloves' || subcategory === 'gauntlet') {
      return Boolean(filter.pickuppetFilterGloves)
    }
    if (subcategory === 'boots') {
      return Boolean(filter.pickuppetFilterBoots)
    }
    // 未知子类别的防具默认不拾取
    return false
  }

  // 盾牌（category 为 shield 的情况）
  if (category === 'shield') {
    return Boolean(filter.pickuppetFilterShield)
  }

  // 首饰
  if (category === 'jewelry' || category === 'accessory') {
    if (subcategory === 'necklace') {
      return Boolean(filter.pickuppetFilterNecklace)
    }
    if (subcategory === 'ring') {
      return Boolean(filter.pickuppetFilterRing)
    }
    if (subcategory === 'earring') {
      return Boolean(filter.pickuppetFilterEarring)
    }
    // 未知子类别的首饰默认不拾取
    return false
  }

  // 战利品
  if (category === 'booty') {
    return Boolean(filter.pickuppetFilterBooty)
  }

  // HP恢复道具
  if (category === 'recovery' && subcategory === 'food') {
    return Boolean(filter.pickuppetFilterHp)
  }

  // MP恢复道具
  if (category === 'recovery' && subcategory === 'refresher') {
    return Boolean(filter.pickuppetFilterMp)
  }

  // FP恢复道具
  if (category === 'recovery' && subcategory === 'drink') {
    return Boolean(filter.pickuppetFilterFp)
  }

  // 宠物蛋
  if (Number(itemConfig?.id || item.id) === 8600) {
    return Boolean(filter.pickuppetFilterPetEgg)
  }

  // PK纸片（物品ID 814）
  if (Number(itemConfig?.id || item.id) === 814) {
    return Boolean(filter.pickuppetFilterPkPaper)
  }

  // 元素卡片
  if (subcategory === 'elementcard') {
    return Boolean(filter.pickuppetFilterElementCard)
  }

  // 穿洞卡片
  if (subcategory === 'piercingcard') {
    return Boolean(filter.pickuppetFilterPiercingCard)
  }

  // 其他材料：不符合以上任何过滤规则的物品，勾选后自动拾取
  if (filter.pickuppetFilterOtherMaterial) {
    return true
  }

  // 未匹配到过滤规则的物品默认不拾取
  return false
}
