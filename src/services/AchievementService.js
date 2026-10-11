/**
 * @file AchievementService.js
 * @description 成就系统业务逻辑层
 * @description 提供成就进度跟踪、等级完成检查、称号解锁等核心功能
 * @description 数据来源为 src/data/ACHIEVEMENT_INFO.js 静态数据
 * @description 怪物击杀成就支持关联名称匹配：击杀名称包含成就目标怪物名的怪物也计入进度
 * @description 消耗品成就通过物品名称匹配 ITEM_INFO 建立物品ID索引，使用物品时按ID精确匹配成就
 * @description 消耗品成就支持关联名称匹配：使用名称包含成就目标物品名的消耗品也计入进度（如金枪鱼寿司各等级变体）
 * @description 消耗品成就预构建 recoveryValue 字段（物品 abilities 中 hp/mp/fp 恢复值之和），用于面板排序
 * @author FLYFF Team
 * @created 2026-07-13
 * @updated 2026-07-15 新增消耗品成就物品ID索引，recordEvent 支持 useitem 按 itemId 精确匹配
 * @updated 2026-07-15 新增 recoveryValue 字段，消耗品成就面板按恢复值从低到高排序
 * @updated 2026-07-15 新增 fuzzyMatchItemId 前缀匹配回退，修复金枪鱼寿司等名称不完全匹配的成就图标和排序问题
 * @updated 2026-07-15 ITEM_ACHIEVEMENT_INDEX 升级为 ITEM_RELATED_INDEX，使用名称包含匹配，所有名称含成就目标物品名的消耗品均计入进度
 * @updated 2026-08-13 将顶层 IIFE 改为延迟初始化，修复 deferHeavyChunkPlugin 导致 MONSTER_INFO/ITEM_INFO 为 null 时 Object.entries 报错
 */

import { ACHIEVEMENT_INFO } from '@/data/ACHIEVEMENT_INFO.js'
import { MONSTER_INFO } from '@/data/MONSTER_INFO.js'
import { ITEM_INFO } from '@/data/ITEM_INFO.js'
import { storageService } from '@/services/StorageService'

// ==================== 延迟初始化 ====================
// deferHeavyChunkPlugin 将 MONSTER_INFO/ITEM_INFO 的静态 import 改为异步延迟加载，
// 模块加载时这些变量为 null，因此所有依赖它们的索引不能在顶层 IIFE 中立即构建，
// 改为首次访问时通过 ensureInitialized() 统一构建并缓存。

/** @type {boolean} 索引是否已构建 */
let _initialized = false

/** @type {Record<string, string>|null} 怪物英文名称 → 怪物 ID 索引 */
let _MONSTER_EN_NAME_INDEX = null

/** @type {Record<string, number>|null} 物品名称 → 物品ID 索引 */
let _ITEM_NAME_INDEX = null

/** @type {Object[]|null} 冻结成就静态数据 */
let _FROZEN_ACHIEVEMENTS = null

/** @type {Record<string, Object[]>|null} 按 type 分组的成就索引 */
let _TYPE_INDEX = null

/** @type {Record<string, Object[]>|null} 怪物 ID → 成就列表 关联名称索引 */
let _MONSTER_RELATED_INDEX = null

/** @type {Record<string, Object[]>|null} 物品 ID → 消耗品成就列表 关联名称索引 */
let _ITEM_RELATED_INDEX = null

/** @type {Record<number, Object>|null} 按 id 索引的成就查找表 */
let _ID_INDEX = null

/** @type {Object[]|null} 所有带称号奖励的成就等级列表 */
let _ALL_TITLE_ENTRIES = null

/** @type {Object[]|null} 所有带徽章奖励的成就列表 */
let _ALL_BADGE_ENTRIES = null

/**
 * 从物品配置中提取恢复值（hp/mp/fp 的 add 值之和）
 * 业务意图：消耗品成就排序需按物品恢复值从低到高排列，
 * 遍历 abilities 中 parameter 为 hp/mp/fp 的条目，累加 add 值作为恢复值
 * @param {Object} itemConfig - ITEM_INFO 中的物品配置
 * @returns {number} 恢复值总和，无恢复能力返回 0
 */
const getItemRecoveryValue = (itemConfig) => {
  if (!itemConfig?.abilities || !Array.isArray(itemConfig.abilities)) return 0
  let total = 0
  for (const ability of itemConfig.abilities) {
    if (!ability || typeof ability !== 'object') continue
    const param = String(ability.parameter ?? '').toLowerCase()
    // 仅统计 hp/mp/fp 恢复值，排除 buff 类百分比加成
    if (['hp', 'mp', 'fp'].includes(param) && !ability.rate) {
      total += Number(ability.add) || 0
    }
  }
  return total
}

/**
 * 延迟构建所有依赖重型数据的索引
 * 业务意图：deferHeavyChunkPlugin 将 MONSTER_INFO/ITEM_INFO 改为异步加载，
 * 模块顶层执行时这些变量为 null，因此所有索引必须在数据加载完成后才构建。
 * ensureInitialized() 在首次调用任何类方法时触发，此时 Main.vue 的
 * ensureGameStores() 已完成，重型数据已加载完毕。
 * @returns {void}
 */
function ensureInitialized () {
  if (_initialized) return

  // ---------- 怪物英文名称 → 怪物 ID 索引 ----------
  _MONSTER_EN_NAME_INDEX = Object.freeze(
    (() => {
      const index = {}
      for (const [id, mon] of Object.entries(MONSTER_INFO)) {
        const en = mon?.name?.en
        if (!en) continue
        if (!(en in index)) index[en] = id
      }
      return index
    })()
  )

  // ---------- 物品名称 → 物品ID 索引 ----------
  _ITEM_NAME_INDEX = Object.freeze(
    (() => {
      const index = {}
      for (const [id, item] of Object.entries(ITEM_INFO)) {
        const cns = item?.name?.cns
        const en = item?.name?.en
        // cns 名称优先，en 名称作为补充
        if (cns && !(cns in index)) index[cns] = Number(id)
        if (en && !(en in index)) index[en] = Number(id)
      }
      return index
    })()
  )

  // ---------- 精确匹配失败时通过前缀匹配查找物品 ID ----------
  // 业务意图：部分成就名称与物品名称不完全一致（如成就"金枪鱼寿司"对应物品"金枪鱼寿司（D级）"），
  // 遍历 ITEM_INFO 查找 cns/en 名称以成就名称开头的物品，取最小 ID 作为代表
  // @param {string} achCns - 成就中文名称
  // @param {string} achEn - 成就英文名称
  // @returns {number|null} 匹配到的物品 ID，无匹配返回 null
  const fuzzyMatchItemId = (achCns, achEn) => {
    let bestId = null
    for (const [id, item] of Object.entries(ITEM_INFO)) {
      const cns = item?.name?.cns || ''
      const en = item?.name?.en || ''
      // 物品名称以成就名称开头（如"金枪鱼寿司（D级）"以"金枪鱼寿司"开头）
      const cnsMatch = achCns && cns.startsWith(achCns) && cns.length > achCns.length
      const enMatch = achEn && en.startsWith(achEn) && en.length > achEn.length
      if (cnsMatch || enMatch) {
        const numId = Number(id)
        if (bestId === null || numId < bestId) bestId = numId
      }
    }
    return bestId
  }

  // ---------- 冻结成就静态数据 ----------
  _FROZEN_ACHIEVEMENTS = Object.freeze(
    Object.values(ACHIEVEMENT_INFO).map((ach) => {
      // 消耗品成就：通过物品名称匹配物品 ID（精确匹配优先，前缀匹配回退）
      let itemId = null
      if (ach.type === 'useitem') {
        itemId = _ITEM_NAME_INDEX[ach.name?.cns] || _ITEM_NAME_INDEX[ach.name?.en] || null
        // 精确匹配失败时，尝试前缀匹配（如"金枪鱼寿司"匹配"金枪鱼寿司（D级）"）
        if (itemId === null) {
          itemId = fuzzyMatchItemId(ach.name?.cns, ach.name?.en)
        }
      }
      // 消耗品成就：通过物品 ID 查找恢复值（用于排序）
      let recoveryValue = 0
      if (itemId !== null) {
        const itemConfig = ITEM_INFO[String(itemId)]
        recoveryValue = getItemRecoveryValue(itemConfig)
      }
      return Object.freeze({
        id: ach.id,
        category: ach.category,
        type: ach.type,
        accountWide: Boolean(ach.accountWide),
        mainMonster: ach.mainMonster || null,
        monsterIconId: _MONSTER_EN_NAME_INDEX[ach.name?.en] || ach.mainMonster || null,
        itemId,
        recoveryValue,
        badgeReward: ach.badgeReward || null,
        name: ach.name?.cns || ach.name?.en || `成就#${ach.id}`,
        description: ach.description?.cns || ach.description?.en || '',
        levels: Object.freeze(
          (ach.levels || []).map(
            (lv, idx) =>
              Object.freeze({
                index: idx,
                value: lv.value,
                attackPower: lv.attackPower || 0,
                title: lv.title?.cns || lv.title?.en || '',
                name: lv.name?.cns || lv.name?.en || ''
              })
          )
        )
      })
    })
  )

  // ---------- 按 type 分组的成就索引 ----------
  _TYPE_INDEX = Object.freeze(
    _FROZEN_ACHIEVEMENTS.reduce((acc, ach) => {
      if (!ach.type) return acc
      if (!acc[ach.type]) acc[ach.type] = []
      acc[ach.type].push(ach)
      return acc
    }, {})
  )

  // ---------- 怪物 ID → 成就列表 关联名称索引 ----------
  _MONSTER_RELATED_INDEX = Object.freeze(
    (() => {
      const index = {}

      // 取出所有有 mainMonster 的击杀怪物成就
      const killAchs = _FROZEN_ACHIEVEMENTS.filter(
        (ach) => ach.type === 'killmonster' && ach.mainMonster
      )

      for (const ach of killAchs) {
        const mainMonsterInfo = MONSTER_INFO[String(ach.mainMonster)]
        const mainName = mainMonsterInfo?.name?.cns
        if (!mainName) continue

        // 扫描所有怪物，若怪物 cns 名称包含成就目标怪物名，则建立映射
        for (const [monsterId, monsterData] of Object.entries(MONSTER_INFO)) {
          const monsterName = monsterData?.name?.cns
          if (!monsterName) continue
          if (monsterName.includes(mainName)) {
            if (!index[monsterId]) index[monsterId] = []
            index[monsterId].push(ach)
          }
        }
      }

      return index
    })()
  )

  // ---------- 物品 ID → 消耗品成就列表 关联名称索引 ----------
  _ITEM_RELATED_INDEX = Object.freeze(
    (() => {
      const index = {}

      // 取出所有 useitem 类型成就
      const useItemAchs = _FROZEN_ACHIEVEMENTS.filter(
        (ach) => ach.type === 'useitem'
      )

      for (const ach of useItemAchs) {
        // 从原始 ACHIEVEMENT_INFO 获取多语言名称用于匹配
        const rawAch = ACHIEVEMENT_INFO[String(ach.id)]
        const rawCns = rawAch?.name?.cns
        const rawEn = rawAch?.name?.en

        // 扫描所有物品，若物品 cns/en 名称包含成就目标物品名，则建立映射
        for (const [itemId, itemData] of Object.entries(ITEM_INFO)) {
          const itemCns = itemData?.name?.cns
          const itemEn = itemData?.name?.en
          const cnsMatch = rawCns && itemCns && itemCns.includes(rawCns)
          const enMatch = rawEn && itemEn && itemEn.includes(rawEn)
          if (cnsMatch || enMatch) {
            if (!index[itemId]) index[itemId] = []
            // 避免重复添加同一成就
            if (!index[itemId].includes(ach)) {
              index[itemId].push(ach)
            }
          }
        }
      }

      return index
    })()
  )

  // ---------- 按 id 索引的成就查找表 ----------
  _ID_INDEX = Object.freeze(
    _FROZEN_ACHIEVEMENTS.reduce((acc, ach) => {
      acc[ach.id] = ach
      return acc
    }, {})
  )

  // ---------- 所有带称号奖励的成就等级列表 ----------
  _ALL_TITLE_ENTRIES = Object.freeze(
    _FROZEN_ACHIEVEMENTS.flatMap((ach) =>
      ach.levels
        .filter((lv) => lv.title)
        .map((lv) =>
          Object.freeze({
            achievementId: ach.id,
            levelIndex: lv.index,
            title: lv.title,
            levelName: lv.name,
            value: lv.value,
            achievementName: ach.name,
            description: ach.description,
            type: ach.type,
            category: ach.category,
            badgeReward: ach.badgeReward || null
          })
        )
    )
  )

  // ---------- 所有带徽章奖励的成就列表 ----------
  _ALL_BADGE_ENTRIES = Object.freeze(
    _FROZEN_ACHIEVEMENTS
      .filter((ach) => ach.badgeReward)
      .map((ach) =>
        Object.freeze({
          achievementId: ach.id,
          badgeReward: ach.badgeReward,
          achievementName: ach.name,
          description: ach.description,
          type: ach.type,
          category: ach.category
        })
      )
  )

  _initialized = true
}

/**
 * AchievementService 成就业务逻辑服务
 *
 * 用途/业务意图：作为成就系统框架的核心，统一管理成就进度跟踪、等级完成和称号解锁
 * 通过 recordEvent 方法接收游戏事件（击杀怪物、使用物品等），自动匹配并更新相关成就进度
 *
 * @class AchievementService
 */
class AchievementService {
  /**
   * 获取冻结的成就静态数据列表
   * @returns {Object[]} 成就数组（已冻结）
   */
  getAchievements () {
    ensureInitialized()
    return _FROZEN_ACHIEVEMENTS
  }

  /**
   * 根据 ID 获取单个成就
   * @param {number} id - 成就 ID
   * @returns {Object|undefined} 成就对象
   */
  getAchievementById (id) {
    ensureInitialized()
    return _ID_INDEX[id]
  }

  /**
   * 按分类获取成就列表
   * @param {string} category - 分类 key
   * @returns {Object[]} 成就数组
   */
  getByCategory (category) {
    ensureInitialized()
    return _FROZEN_ACHIEVEMENTS.filter((ach) => ach.category === category)
  }

  /**
   * 获取所有带称号奖励的成就等级条目
   * @returns {Object[]} 称号条目数组
   */
  getAllTitleEntries () {
    ensureInitialized()
    return _ALL_TITLE_ENTRIES
  }

  /**
   * 获取按 type 分组的成就索引
   * @returns {Record<string, Object[]>} type → 成就数组
   */
  getTypeIndex () {
    ensureInitialized()
    return _TYPE_INDEX
  }

  /**
   * 检查指定怪物 ID 是否有对应的击杀成就（含关联名称匹配）
   * 利用 MONSTER_RELATED_INDEX 实现 O(1) 查找，用于在战斗热路径中快速跳过无关怪物
   * 关联匹配：击杀「小独眼蝠」等名称包含成就目标怪物名的怪物也会命中
   * @param {number|string} monsterId - 怪物 ID
   * @returns {boolean} 该怪物是否存在击杀成就（含关联）
   */
  hasMonsterAchievement (monsterId) {
    if (monsterId === null || monsterId === undefined) return false
    ensureInitialized()
    return Boolean(_MONSTER_RELATED_INDEX[String(monsterId)])
  }

  /**
   * 检查指定怪物的所有关联成就是否已全部满级（所有等级均已达成）
   * 用于在击杀追踪中跳过已满级的怪物，避免不必要的计算和存储
   * @param {number|string} monsterId - 怪物 ID
   * @param {Object} achievementData - 玩家 achievement 字段
   * @returns {boolean} true 表示所有关联成就均已满级，无需再统计
   */
  isMonsterAchievementsFullyCompleted (monsterId, achievementData) {
    ensureInitialized()
    const achievements = _MONSTER_RELATED_INDEX[String(monsterId)]
    if (!achievements || achievements.length === 0) return true

    for (const ach of achievements) {
      const completed = this.getCompletedLevels(achievementData, ach.id)
      // 已完成等级数小于总等级数，说明尚未全部满级
      if (completed.length < ach.levels.length) return false
    }
    return true
  }

  /**
   * 检查指定物品 ID 是否有对应的消耗品成就（含关联名称匹配）
   * 利用 ITEM_RELATED_INDEX 实现 O(1) 查找，用于在物品使用时快速跳过无关物品
   * 关联匹配：使用「金枪鱼寿司（A+级）」等名称包含成就目标物品名的物品也会命中
   * @param {number|string} itemId - 物品 ID
   * @returns {boolean} 该物品是否存在消耗品成就（含关联）
   */
  hasItemAchievement (itemId) {
    if (itemId === null || itemId === undefined) return false
    ensureInitialized()
    return Boolean(_ITEM_RELATED_INDEX[String(itemId)])
  }

  /**
   * 检查指定物品的所有关联消耗品成就是否已全部满级（所有等级均已达成）
   * 用于在物品使用时跳过已满级的物品，避免不必要的计算和存储
   * @param {number|string} itemId - 物品 ID
   * @param {Object} achievementData - 玩家 achievement 字段
   * @returns {boolean} true 表示所有关联成就均已满级，无需再统计
   */
  isItemAchievementsFullyCompleted (itemId, achievementData) {
    ensureInitialized()
    const achievements = _ITEM_RELATED_INDEX[String(itemId)]
    if (!achievements || achievements.length === 0) return true

    for (const ach of achievements) {
      const completed = this.getCompletedLevels(achievementData, ach.id)
      if (completed.length < ach.levels.length) return false
    }
    return true
  }

  /**
   * 从玩家成就数据中获取指定成就的当前进度
   * @param {Object} achievementData - 玩家 achievement 字段
   * @param {number} achievementId - 成就 ID
   * @returns {number} 当前进度值
   */
  getProgress (achievementData, achievementId) {
    if (!achievementData?.progress) return 0
    return Number(achievementData.progress[achievementId]) || 0
  }

  /**
   * 获取指定成就已完成的等级索引列表
   * @param {Object} achievementData - 玩家 achievement 字段
   * @param {number} achievementId - 成就 ID
   * @returns {number[]} 已完成等级索引数组
   */
  getCompletedLevels (achievementData, achievementId) {
    if (!achievementData?.completedLevels) return []
    return Array.isArray(achievementData.completedLevels[achievementId])
      ? achievementData.completedLevels[achievementId]
      : []
  }

  /**
   * 检查指定成就等级是否已完成
   * @param {Object} achievementData - 玩家 achievement 字段
   * @param {number} achievementId - 成就 ID
   * @param {number} levelIndex - 等级索引
   * @returns {boolean}
   */
  isLevelCompleted (achievementData, achievementId, levelIndex) {
    return this.getCompletedLevels(achievementData, achievementId).includes(levelIndex)
  }

  /**
   * 检查指定成就 ID 的称号是否已解锁
   * @param {Object} achievementData - 玩家 achievement 字段
   * @param {number} achievementId - 成就 ID
   * @returns {boolean}
   */
  isTitleUnlocked (achievementData, achievementId) {
    if (!achievementData?.unlockedTitles) return false
    return achievementData.unlockedTitles.some((t) => t.achievementId === achievementId)
  }

  /**
   * 获取玩家已解锁的称号列表
   * @param {Object} achievementData - 玩家 achievement 字段
   * @returns {Object[]} 已解锁称号数组
   */
  getUnlockedTitles (achievementData) {
    if (!achievementData?.unlockedTitles) return []
    return achievementData.unlockedTitles
  }

  /**
   * 获取总徽章数量（所有带 badgeReward 的成就数）
   * @returns {number}
   */
  getTotalBadgeCount () {
    ensureInitialized()
    return _ALL_BADGE_ENTRIES.length
  }

  /**
   * 检查指定成就 ID 的徽章是否已解锁
   * @param {Object} achievementData - 玩家 achievement 字段
   * @param {number} achievementId - 成就 ID
   * @returns {boolean}
   */
  isBadgeUnlocked (achievementData, achievementId) {
    if (!achievementData?.unlockedBadges) return false
    return achievementData.unlockedBadges.some((b) => b.achievementId === achievementId)
  }

  /**
   * 获取玩家已解锁的徽章列表
   * @param {Object} achievementData - 玩家 achievement 字段
   * @returns {Object[]} 已解锁徽章数组
   */
  getUnlockedBadges (achievementData) {
    if (!achievementData?.unlockedBadges) return []
    return achievementData.unlockedBadges
  }

  /**
   * 获取当前装备的徽章
   * @param {Object} achievementData - 玩家 achievement 字段
   * @returns {string|null} 当前徽章的 badgeReward 文件名
   */
  getCurrentBadge (achievementData) {
    return achievementData?.currentBadge || null
  }

  /**
   * 获取所有成就的分类统计
   * @returns {Record<string, number>} 各分类的成就数量
   */
  getCategoryCounts () {
    ensureInitialized()
    const counts = {}
    for (const ach of _FROZEN_ACHIEVEMENTS) {
      if (ach.category) {
        counts[ach.category] = (counts[ach.category] || 0) + 1
      }
    }
    return counts
  }

  /**
   * 获取总成就数量
   * @returns {number}
   */
  getTotalCount () {
    ensureInitialized()
    return _FROZEN_ACHIEVEMENTS.length
  }

  /**
   * 获取总称号数量（所有带称号的成就等级数）
   * @returns {number}
   */
  getTotalTitleCount () {
    ensureInitialized()
    return _ALL_TITLE_ENTRIES.length
  }

  // ==================== 核心：事件匹配与进度更新 ====================

  /**
   * 记录游戏事件，自动匹配相关成就并更新进度
   *
   * 用途/业务意图：游戏系统（战斗、背包、登录等）调用此方法报告事件，
   * Service 自动找到与该事件相关的成就，更新进度并检查等级完成
   *
   * @param {Object} gameStore - Pinia game store 实例（用于读取/修改玩家数据）
   * @param {string} eventType - 事件类型，对应成就的 type 字段（如 'killmonster'、'useitem'）
   * @param {Object} payload - 事件载荷（如 { monsterId: 6413, amount: 1 } 或 { itemId: 58, amount: 1 }）
   * @returns {Object} 更新结果 { updated: boolean, newlyUnlockedTitles: Object[] }
   */
  recordEvent (gameStore, eventType, payload = {}) {
    const result = { updated: false, newlyUnlockedTitles: [] }
    const player = gameStore?.player
    if (!player?.achievement) return result

    ensureInitialized()

    // 击杀怪物事件：使用 _MONSTER_RELATED_INDEX 进行 O(1) 查找（含关联名称匹配）
    // 消耗品使用事件：使用 _ITEM_RELATED_INDEX 进行 O(1) 查找（含关联名称匹配）
    let achievements = null
    if (eventType === 'killmonster' && payload.monsterId !== null && payload.monsterId !== undefined) {
      achievements = _MONSTER_RELATED_INDEX[String(payload.monsterId)]
      if (!achievements || achievements.length === 0) return result
    } else if (eventType === 'useitem' && payload.itemId !== null && payload.itemId !== undefined) {
      // 消耗品成就按物品 ID 查找（含关联名称匹配，如金枪鱼寿司各等级变体）
      achievements = _ITEM_RELATED_INDEX[String(payload.itemId)]
      if (!achievements || achievements.length === 0) return result
    } else {
      achievements = _TYPE_INDEX[eventType]
      if (!achievements || achievements.length === 0) return result
    }

    for (const ach of achievements) {
      // killmonster 事件已通过 _MONSTER_RELATED_INDEX 确保关联性，无需再检查 mainMonster 精确匹配
      // useitem 事件已通过 _ITEM_RELATED_INDEX 确保物品ID匹配（含关联名称匹配）
      // 非击杀怪物事件仍需检查 mainMonster 匹配（理论上不会走到这里，但保持防御性）
      if (eventType !== 'killmonster' && eventType !== 'useitem' && ach.mainMonster) {
        if (Number(ach.mainMonster) !== Number(payload.monsterId)) continue
      }

      const updated = this._updateAchievementProgress(player.achievement, ach, payload.amount || 1)
      if (updated.updated) {
        result.updated = true
        result.newlyUnlockedTitles.push(...updated.newTitles)
      }
    }

    // 如果有更新，持久化
    if (result.updated) {
      this._persistAchievement(gameStore)
    }

    return result
  }

  /**
   * 直接设置某成就的进度值（用于 stat、level 等绝对值类型）
   *
   * @param {Object} gameStore - Pinia game store 实例
   * @param {number} achievementId - 成就 ID
   * @param {number} value - 当前进度值
   * @returns {Object} 更新结果
   */
  setProgress (gameStore, achievementId, value) {
    const result = { updated: false, newlyUnlockedTitles: [] }
    ensureInitialized()
    const ach = _ID_INDEX[achievementId]
    if (!ach) return result

    const player = gameStore?.player
    if (!player?.achievement) return result

    const updated = this._setAchievementProgress(player.achievement, ach, value)
    if (updated.updated) {
      result.updated = true
      result.newlyUnlockedTitles.push(...updated.newTitles)
      this._persistAchievement(gameStore)
    }

    return result
  }

  /**
   * 累加某成就的进度值
   *
   * @param {Object} gameStore - Pinia game store 实例
   * @param {number} achievementId - 成就 ID
   * @param {number} amount - 增加量
   * @returns {Object} 更新结果
   */
  addProgress (gameStore, achievementId, amount = 1) {
    const result = { updated: false, newlyUnlockedTitles: [] }
    ensureInitialized()
    const ach = _ID_INDEX[achievementId]
    if (!ach) return result

    const player = gameStore?.player
    if (!player?.achievement) return result

    const updated = this._updateAchievementProgress(player.achievement, ach, amount)
    if (updated.updated) {
      result.updated = true
      result.newlyUnlockedTitles.push(...updated.newTitles)
      this._persistAchievement(gameStore)
    }

    return result
  }

  // ==================== 内部方法 ====================

  /**
   * 累加成就进度并检查等级完成
   * @param {Object} achievementData - 玩家 achievement 字段
   * @param {Object} ach - 成就静态数据
   * @param {number} amount - 增加量
   * @returns {{ updated: boolean, newTitles: Object[] }}
   * @private
   */
  _updateAchievementProgress (achievementData, ach, amount) {
    const currentProgress = Number(achievementData.progress[ach.id]) || 0
    const newProgress = currentProgress + amount
    return this._applyProgress(achievementData, ach, newProgress)
  }

  /**
   * 设置成就进度（绝对值）并检查等级完成
   * @param {Object} achievementData - 玩家 achievement 字段
   * @param {Object} ach - 成就静态数据
   * @param {number} value - 目标进度值
   * @returns {{ updated: boolean, newTitles: Object[] }}
   * @private
   */
  _setAchievementProgress (achievementData, ach, value) {
    return this._applyProgress(achievementData, ach, value)
  }

  /**
   * 应用进度值到成就数据，检查新完成的等级并解锁称号
   * @param {Object} achievementData - 玩家 achievement 字段（会被修改）
   * @param {Object} ach - 成就静态数据
   * @param {number} newProgress - 新的进度值
   * @returns {{ updated: boolean, newTitles: Object[] }}
   * @private
   */
  _applyProgress (achievementData, ach, newProgress) {
    const result = { updated: false, newTitles: [] }
    const oldProgress = Number(achievementData.progress[ach.id]) || 0

    // 进度只增不减
    if (newProgress <= oldProgress) return result

    // 封顶进度：不超过最高等级的目标值，避免满级后继续无限增长
    if (ach.levels.length > 0) {
      const maxLevelValue = ach.levels[ach.levels.length - 1].value
      if (maxLevelValue > 0 && newProgress > maxLevelValue) {
        newProgress = maxLevelValue
      }
    }

    // 封顶后再次检查是否需要更新（可能封顶后与旧值相等）
    if (newProgress <= oldProgress) return result

    // 更新进度
    achievementData.progress[ach.id] = newProgress
    result.updated = true

    // 确保已完成等级数组存在
    if (!achievementData.completedLevels[ach.id]) {
      achievementData.completedLevels[ach.id] = []
    }
    const completed = achievementData.completedLevels[ach.id]

    // 检查所有未完成的等级
    for (const level of ach.levels) {
      if (completed.includes(level.index)) continue
      if (newProgress >= level.value) {
        completed.push(level.index)

        // 如果该等级有称号奖励，解锁称号
        if (level.title && !this.isTitleUnlocked(achievementData, ach.id)) {
          const titleEntry = {
            achievementId: ach.id,
            levelIndex: level.index,
            title: level.title,
            levelName: level.name,
            achievementName: ach.name,
            description: ach.description,
            type: ach.type,
            category: ach.category,
            badgeReward: ach.badgeReward || null,
            unlockedAt: Date.now()
          }
          if (!Array.isArray(achievementData.unlockedTitles)) {
            achievementData.unlockedTitles = []
          }
          achievementData.unlockedTitles.push(titleEntry)
          result.newTitles.push(titleEntry)
        }

        // ★ 如果该成就有徽章奖励（badgeReward），解锁徽章
        if (ach.badgeReward && !this.isBadgeUnlocked(achievementData, ach.id)) {
          const badgeEntry = {
            achievementId: ach.id,
            badgeReward: ach.badgeReward,
            achievementName: ach.name,
            description: ach.description,
            unlockedAt: Date.now()
          }
          if (!Array.isArray(achievementData.unlockedBadges)) {
            achievementData.unlockedBadges = []
          }
          achievementData.unlockedBadges.push(badgeEntry)
        }
      }
    }

    return result
  }

  /**
   * 持久化成就数据到后端（公开方法，供 Store 调用）
   * @param {Object} gameStore - Pinia game store 实例
   * @returns {void}
   */
  persistAchievement (gameStore) {
    this._persistAchievement(gameStore)
  }

  /**
   * 持久化成就数据到后端
   * @param {Object} gameStore - Pinia game store 实例
   * @returns {void}
   * @private
   */
  _persistAchievement (gameStore) {
    try {
      const achievement = gameStore?.player?.achievement
      if (!achievement) return

      // 使用 StorageService 的补丁式保存，带防抖
      storageService.savePlayerPatch({ achievement })
    } catch (error) {
      console.error('[AchievementService] 持久化成就数据失败:', error)
    }
  }
}

/**
 * AchievementService 全局单例实例
 * @type {AchievementService}
 */
export const achievementService = new AchievementService()

export default AchievementService
