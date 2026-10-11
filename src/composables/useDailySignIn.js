/**
 * @file useDailySignIn.js
 * @description 每日签到组合式函数
 * @description 提供签到状态管理、日历数据生成、奖励发放、数据持久化等逻辑
 * @description 每日签到必含基础物品(ID 1276、1277，各5个)，另加随机物品
 * @description 第7、14、21、28天为双倍奖励日(2个随机物品，全物品x2)，第31天为月末满勤(3个随机物品，全物品x3)
 * @description 每月随机奖励基于年月种子确定性生成，同月一致、跨月刷新
 * @description 签到前置条件：每日需击杀30只等级在玩家等级±10范围内的怪物 + 击杀指定数量BOSS
 * @description BOSS击杀要求阶梯递增：普通日1只，第7天2只，第14天3只，第28天4只，第31天5只
 * @description 签到奖励物品钻石价值上限不超过1000
 * @generated 2026-06-24
 */

import { ref, computed } from 'vue'
import { storageService } from '@/services/StorageService'
import BagService from '@/services/BagService'
import { useItemsStore } from '@/store/items'
import { DIAMOND_SHOP_ITEMS } from '@/data/DIAMOND_SHOP_ITEMS'

/**
 * 签到数据在玩家存档中的字段名
 * @type {string}
 */
const SIGN_IN_DATA_FIELD = 'dailySignIn'

/**
 * 每日签到基础击杀怪物数量（普通日）
 * @type {number}
 */
export const REQUIRED_KILLS = 30

/**
 * 获取指定日期的怪物击杀要求数量
 *
 * 规则：
 * - 普通日（非 7/14/21/28 的倍数、非月末最后一天）：20 + day × 10
 * - 里程碑日（第 7/14/21/28 天）：day × 20
 *   · 第 7 天 = 140，第 14 天 = 280，第 21 天 = 420，第 28 天 = 560
 * - 月末最后一天：day × 30
 *   · 如30日 = 900，31日 = 930
 *
 * @param {number} day - 当月日期
 * @param {number} [year] - 年份（提供后可判断月末最后一天）
 * @param {number} [month] - 月份（0~11，提供后可判断月末最后一天）
 * @returns {number} 需击杀的怪物数量
 */
export function getKillRequirement(day, year, month) {
  const isLastDay = year !== undefined && month !== undefined && day === getDaysInMonth(year, month)
  // 月末最后一天：day × 30
  if (isLastDay) {
    return day * 30
  }
  // 里程碑日（7/14/21/28 的倍数）：day × 20
  if (day % 7 === 0) {
    return day * 20
  }
  // 普通日：20 + day × 10
  return 20 + day * 10
}

/**
 * 击杀怪物等级允许偏差范围（玩家等级 ± 该值）
 * @type {number}
 */
export const KILL_LEVEL_RANGE = 10

/**
 * BOSS 怪物 rank 集合（巨大BOSS / BOSS / 堕落BOSS）
 * 任意 rank 在此集合中的怪物均视为 BOSS，击杀后计入签到 BOSS 击杀进度
 * @type {ReadonlyArray<string>}
 */
export const BOSS_RANKS = Object.freeze(['giant', 'boss', 'violet'])

/**
* 获取指定日期的 BOSS 击杀要求数量
*
* 规则：
* - 普通日（非 7/14/21/28 的倍数）：ceil(day / 7)（即第1周1只，第2周2只，第3周3只，第4周4只，第5周5只）
* - 里程碑日（第 7/14/21/28 天）：周序号 × 5
*   · 第 7 天 = 5，第 14 天 = 10，第 21 天 = 15，第 28 天 = 20
* - 月末最后一天：固定 31 只 BOSS
*
* @param {number} day - 当月日期
* @param {number} [year] - 年份（提供后可判断月末最后一天）
* @param {number} [month] - 月份（0~11，提供后可判断月末最后一天）
* @returns {number} 需击杀的 BOSS 数量
*/
export function getBossKillRequirement(day, year, month) {
  // 月末最后一天固定 31 只 BOSS
  if (year !== undefined && month !== undefined && day === getDaysInMonth(year, month)) {
    return 31
  }
  let req
  if (day % 7 === 0) {
    // 里程碑日：周序号 × 5
    const weekIndex = day / 7
    req = weekIndex * 5
  } else {
    // 普通日：ceil(day / 7)
    req = Math.ceil(day / 7)
  }
  return req
}

/**
 * 签到奖励物品钻石价值上限（超过此价值的物品不会出现在签到奖励中）
 * @type {number}
 */
const MAX_ITEM_DIAMOND_VALUE = 1000

// ==================== 基础必含物品 ====================

/**
 * 每日签到必含基础物品ID（1276、1277）
 * @type {ReadonlyArray<number>}
 */
const BASE_ITEM_IDS = Object.freeze([1276, 1277])

/**
 * 基础物品每日签到基础数量（特殊日期按倍率放大）
 * @type {number}
 */
const BASE_ITEM_COUNT = 5

// ==================== 物品池分类 ====================

/**
 * 从钻石商店物品中提取并分类物品池（排除 pickuppet 捡宠类、排除基础物品 1276/1277 避免重复）
 * 按价格分为四个梯队：基础、进阶、高级、至尊
 * @type {{basic: number[], advanced: number[], premium: number[], ultimate: number[]}}
 */
const ITEM_POOLS = (() => {
  const basic = []    // price 1~20，第一、二周日常奖励
  const advanced = [] // price 100，第三、四周日常奖励
  const premium = []  // price 200~500，里程碑奖励
  const ultimate = [] // price == 1000，月末至尊大奖

  for (const key of Object.keys(DIAMOND_SHOP_ITEMS)) {
    const item = DIAMOND_SHOP_ITEMS[key]
    // 排除捡宠类、注释项、无 id 项、基础必含物品（避免随机重复）
    if (!item || !item.id || item.category === 'pickuppet') continue
    if (BASE_ITEM_IDS.includes(item.id)) continue

    const price = item.price || 0
    // 钻石价值超过上限的物品不纳入签到奖励池
    if (price > MAX_ITEM_DIAMOND_VALUE) continue

    if (price <= 20) {
      basic.push(item.id)
    } else if (price <= 100) {
      advanced.push(item.id)
    } else if (price <= 500) {
      premium.push(item.id)
    } else {
      ultimate.push(item.id)
    }
  }

  // 防御性处理：如果某个池为空，回退到 basic
  return {
    basic: basic.length > 0 ? basic : [829, 8691, 9344, 2527, 1683, 3945],
    advanced: advanced.length > 0 ? advanced : [15012, 14737, 15403, 12908, 6672],
    premium: premium.length > 0 ? premium : [12252, 12944, 7027],
    ultimate: ultimate.length > 0 ? ultimate : [17866, 7027, 12252]
  }
})()

// ==================== 种子随机数生成器 ====================

/**
 * Mulberry32 伪随机数生成器
 * 基于种子产生确定性的 0~1 随机数序列，同一种子每次运行结果一致
 * @param {number} seed - 随机种子
 * @returns {Function} 返回 0~1 随机数的函数
 */
function createPRNG(seed) {
  let s = seed | 0
  return function () {
    s = (s + 0x6D2B79F5) | 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 根据年月生成种子
 * @param {number} year - 年份
 * @param {number} month - 月份（0~11）
 * @returns {number} 种子值
 */
function getMonthSeed(year, month) {
  return year * 100 + (month + 1)
}

// ==================== 特殊日期配置 ====================

/**
 * 特殊签到日期配置
 * - 普通日：1 个随机物品，倍率 x1
 * - 第 7/14/21/28 天：2 个随机物品，倍率 x2（含基础物品数量翻倍）
 * - 月末最后一天（月末满勤）：3 个随机物品，倍率 x3（含基础物品数量三倍）
 *   注意：最后一天根据实际月份天数动态确定（28/29/30/31日）
 * @type {ReadonlyMap<number, {randomItemCount: number, multiplier: number, label: string}>}
 */
const SPECIAL_DAYS = Object.freeze(new Map([
  [7, { randomItemCount: 2, multiplier: 2, label: '周签到里程碑' }],
  [14, { randomItemCount: 2, multiplier: 2, label: '双周签到里程碑' }],
  [21, { randomItemCount: 2, multiplier: 2, label: '三周签到里程碑' }],
  [28, { randomItemCount: 2, multiplier: 2, label: '月签到里程碑' }],
  [31, { randomItemCount: 3, multiplier: 3, label: '月末满勤大奖' }]
]))

/**
 * 获取某天的奖励配置（随机物品数量 + 倍率）
 * @param {number} day - 当月日期
 * @param {boolean} [isLastDay=false] - 是否为该月最后一天（动态月份天数）
 * @returns {{randomItemCount: number, multiplier: number, isSpecial: boolean, label?: string}}
 */
function getDayRewardConfig(day, isLastDay = false) {
  const special = SPECIAL_DAYS.get(day)
  if (special) {
    return {
      randomItemCount: special.randomItemCount,
      multiplier: special.multiplier,
      isSpecial: true,
      label: special.label
    }
  }
  // 非31日的月末最后一天，同样享受x3满勤大奖配置
  if (isLastDay) {
    return { randomItemCount: 3, multiplier: 3, isSpecial: true, label: '月末满勤大奖' }
  }
  return { randomItemCount: 1, multiplier: 1, isSpecial: false }
}

/**
 * 获取某天的奖励倍率
 * @param {number} day - 当月日期
 * @param {number} [year] - 年份（提供后可判断动态月末最后一天）
 * @param {number} [month] - 月份（0~11，提供后可判断动态月末最后一天）
 * @returns {number} 倍率（1、2 或 3）
 */
export function getDayMultiplier(day, year, month) {
  if (year !== undefined && month !== undefined) {
    if (day === getDaysInMonth(year, month)) return 3
  }
  const special = SPECIAL_DAYS.get(day)
  return special ? special.multiplier : 1
}

/**
 * 判断某天是否为特殊奖励日（倍率 > 1）
 * @param {number} day - 当月日期
 * @param {number} [year] - 年份（提供后可判断动态月末最后一天）
 * @param {number} [month] - 月份（0~11，提供后可判断动态月末最后一天）
 * @returns {boolean} 是否特殊奖励日
 */
export function isSpecialRewardDay(day, year, month) {
  if (year !== undefined && month !== undefined) {
    if (day === getDaysInMonth(year, month)) return true
  }
  return SPECIAL_DAYS.has(day)
}

/**
 * 根据天数确定从哪个物品池中抽取
 * 月末最后一天使用 ultimate 池，其余按日期递增
 * @param {number} day - 当月日期
 * @param {boolean} [isLastDay=false] - 是否为该月最后一天
 * @returns {string} 物品池名称（basic/advanced/premium/ultimate）
 */
function getPoolName(day, isLastDay = false) {
  if (day === 31 || isLastDay) return 'ultimate'
  if (day <= 14) return 'basic'
  if (day <= 28) return 'advanced'
  return 'premium'
}

/**
 * 从物品池中随机选取 N 个不重复的物品ID
 * @param {Function} rng - 随机数生成函数
 * @param {number[]} pool - 物品ID池
 * @param {number} count - 选取数量
 * @returns {number[]} 选中的物品ID数组
 */
function pickRandomItems(rng, pool, count) {
  const available = [...pool]
  const result = []
  const pickCount = Math.min(count, available.length)
  for (let i = 0; i < pickCount; i++) {
    const idx = Math.floor(rng() * available.length)
    result.push(available[idx])
    available.splice(idx, 1)
  }
  return result
}

/**
 * 从物品池中排除指定ID（用于确保最后两天随机物品不重复）
 * @param {number[]} pool - 原物品ID池
 * @param {number[]} excludeIds - 需排除的物品ID数组
 * @returns {number[]} 过滤后的物品ID池
 */
function filterExcludedItems(pool, excludeIds) {
  if (!excludeIds || excludeIds.length === 0) return pool
  return pool.filter(id => !excludeIds.includes(id))
}

// ==================== 月份奖励生成 ====================

/**
 * 缓存已生成的月份奖励，避免重复计算
 * @type {Map<string, Object>}
 */
const rewardCache = new Map()

/**
 * 生成指定年月的签到奖励配置（31天，每月随机）
 * 同一年月始终生成相同的奖励（确定性），不同月份奖励不同
 * @param {number} year - 年份
 * @param {number} month - 月份（0~11）
 * @returns {Map<number, {day: number, items: Array<{id: number, count: number}>, isMilestone: boolean, label?: string}>} 按天索引的奖励Map
 */
function generateMonthlyRewards(year, month) {
  const cacheKey = `${year}-${month}`
  if (rewardCache.has(cacheKey)) {
    return rewardCache.get(cacheKey)
  }

  const seed = getMonthSeed(year, month)
  const rng = createPRNG(seed)
  const result = new Map()
  const actualLastDay = getDaysInMonth(year, month)
  const secondToLastDay = actualLastDay - 1

  /** 记录倒数第二天使用的随机物品ID，用于确保最后两天物品不重复 */
  let secondToLastRandomIds = []

  for (let day = 1; day <= actualLastDay; day++) {
    const isLastDay = day === actualLastDay
    const config = getDayRewardConfig(day, isLastDay)
    const { randomItemCount, multiplier, isSpecial, label } = config
    const poolName = getPoolName(day, isLastDay)
    const pool = ITEM_POOLS[poolName]

    const items = []

    // 基础必含物品（1276、1277），数量 = 基础数量 × 倍率
    BASE_ITEM_IDS.forEach(id => {
      items.push({ id, count: BASE_ITEM_COUNT * multiplier })
    })

    // 随机物品：最后一天需排除倒数第二天已使用的物品，避免最后两天道具重复
    const availablePool = isLastDay ? filterExcludedItems(pool, secondToLastRandomIds) : pool
    const randomItemIds = pickRandomItems(rng, availablePool, randomItemCount)
    randomItemIds.forEach(id => {
      items.push({ id, count: multiplier })
    })

    // 记录倒数第二天的随机物品ID
    if (day === secondToLastDay) {
      secondToLastRandomIds = randomItemIds
    }

    result.set(day, {
      day,
      items,
      isMilestone: isSpecial,
      ...(label ? { label } : {})
    })
  }

  rewardCache.set(cacheKey, result)
  return result
}

/**
 * 获取指定日期的签到奖励配置（基于当前年月随机生成）
 * @param {number} day - 当月日期（1~31）
 * @param {number} [year] - 年份（默认当前年份）
 * @param {number} [month] - 月份（0~11，默认当前月份）
 * @returns {Object|null} 奖励配置对象，找不到则返回 null
 */
export function getSignInRewardForDay(day, year, month) {
  const now = new Date()
  const y = year !== undefined ? year : now.getFullYear()
  const m = month !== undefined ? month : now.getMonth()
  const rewards = generateMonthlyRewards(y, m)
  return rewards.get(day) || null
}

// ==================== 日期工具函数 ====================

/**
 * 获取格式化日期字符串（YYYY-MM-DD）
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取月份键（YYYY-MM）
 * @param {Date} date - 日期对象
 * @returns {string} 月份键
 */
function formatMonthKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * 获取指定月份的天数
 * @param {number} year - 年份
 * @param {number} month - 月份（0~11）
 * @returns {number} 该月天数
 */
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * 获取指定月份第一天是星期几
 * @param {number} year - 年份
 * @param {number} month - 月份（0~11）
 * @returns {number} 星期几（0=周日, 1=周一, ... 6=周六）
 */
function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay()
}

// ==================== 击杀进度管理 ====================

/**
 * 获取今日击杀数据（从玩家存档中读取）
 * 如果存档中没有击杀数据或日期不是今天，返回0
 * @param {Object} player - 玩家数据对象
 * @returns {number} 今日有效击杀数
 */
export function getTodayKillCount(player) {
  if (!player || !player[SIGN_IN_DATA_FIELD]) return 0
  const data = player[SIGN_IN_DATA_FIELD]
  const today = formatDateKey(new Date())
  // 日期不匹配则视为新一天，击杀计数归零
  if (data.lastKillDate !== today) return 0
  return data.todayKillCount || 0
}

/**
 * 记录签到击杀进度（独立函数，供 Main.vue 在怪物死亡时直接调用）
 * 同时追踪普通怪物击杀和 BOSS 击杀两种进度：
 * - 普通击杀：怪物等级必须在玩家等级 ± KILL_LEVEL_RANGE 范围内
 * - BOSS 击杀：任意等级，rank 在 BOSS_RANKS 中的怪物均计入
 * 击杀计数按天重置（跨天自动归零），签到后不再累计
 * 两项击杀要求均达标后停止统计（updated 返回 false），避免无意义计数和日志输出
 *
 * 参考任务面板模式：直接修改 player 代理对象的 dailySignIn 属性（整体替换为新引用），
 * 不在此函数内调用 useGameStore（避免独立函数中 Pinia 上下文问题），
 * 由调用方（Main.vue）在战斗结算完成后通过 gameStore.updatePlayer 同步状态。
 *
 * @param {Object} player - 玩家数据对象（gameStore.player 的响应式代理）
 * @param {number} monsterLevel - 被击杀怪物的等级
 * @param {string} [monsterRank] - 被击杀怪物的 rank（如 'boss'、'giant'、'violet'）
 * @returns {{todayKillCount: number, todayBossKillCount: number, updated: boolean}} 更新后的击杀进度数据
 */
export function recordSignInKill(player, monsterLevel, monsterRank) {
  try {
    if (!player) {
      console.warn('[DailySignIn] recordSignInKill: player 为空，跳过')
      return { todayKillCount: 0, todayBossKillCount: 0, updated: false }
    }

    const playerLevel = player.level || 1
    const mLevel = Number(monsterLevel) || 0
    const mRank = typeof monsterRank === 'string' ? monsterRank.toLowerCase() : ''
    const isBoss = BOSS_RANKS.includes(mRank)

    const today = formatDateKey(new Date())

    // 读取现有签到数据（或使用默认值）
    const existing = player[SIGN_IN_DATA_FIELD]
    const isDataValid = existing && typeof existing === 'object'

    // 构建当前签到数据快照（使用浅拷贝避免直接修改嵌套属性导致响应式丢失）
    let data = {
      lastSignInDate: isDataValid ? existing.lastSignInDate : null,
      signedDates: isDataValid && Array.isArray(existing.signedDates) ? [...existing.signedDates] : [],
      totalSignInDays: isDataValid ? (existing.totalSignInDays || 0) : 0,
      todayKillCount: isDataValid ? (existing.todayKillCount || 0) : 0,
      todayBossKillCount: isDataValid ? (existing.todayBossKillCount || 0) : 0,
      lastKillDate: isDataValid ? existing.lastKillDate : today
    }

    // 跨天重置击杀计数
    if (data.lastKillDate !== today) {
      data.todayKillCount = 0
      data.todayBossKillCount = 0
      data.lastKillDate = today
    }

    // 今天已签到则不再累计击杀
    if (data.signedDates.includes(today)) {
      return { todayKillCount: data.todayKillCount || 0, todayBossKillCount: data.todayBossKillCount || 0, updated: false }
    }

    // 获取当日击杀要求（统一计算一次，避免重复创建 Date 对象）
    const now = new Date()
    const killReq = getKillRequirement(now.getDate(), now.getFullYear(), now.getMonth())
    const bossReq = getBossKillRequirement(now.getDate(), now.getFullYear(), now.getMonth())

    // 两项击杀要求均已达标后不再继续统计，避免无意义的计数、存储和日志输出
    if ((data.todayKillCount || 0) >= killReq && (data.todayBossKillCount || 0) >= bossReq) {
      return { todayKillCount: data.todayKillCount || 0, todayBossKillCount: data.todayBossKillCount || 0, updated: false }
    }

    let updated = false

    // 普通击杀：等级必须在玩家等级 ± KILL_LEVEL_RANGE 范围内，且当前未达标时才继续统计
    const levelInRange = mLevel >= playerLevel - KILL_LEVEL_RANGE && mLevel <= playerLevel + KILL_LEVEL_RANGE
    if (levelInRange && (data.todayKillCount || 0) < killReq) {
      data.todayKillCount = Math.min((data.todayKillCount || 0) + 1, killReq)
      updated = true
    }

    // BOSS 击杀：任意等级，rank 在 BOSS_RANKS 中，且当前未达标时才继续统计
    if (isBoss && (data.todayBossKillCount || 0) < bossReq) {
      data.todayBossKillCount = Math.min((data.todayBossKillCount || 0) + 1, bossReq)
      updated = true
    }

    if (updated) {
      // 参考任务面板模式：直接修改 player 代理对象的 dailySignIn 属性（整体替换为新引用）
      // 不在此函数内调用 useGameStore（避免独立函数中 Pinia 上下文问题），
      // 后续 gainExp() 调用 gameStore.updatePlayer({ exp: ... }) 时，
      // Object.assign 会将 dailySignIn 属性复制到新的 player 对象中
      player[SIGN_IN_DATA_FIELD] = data
      // 持久化到后端存储
      storageService.savePlayerPatch({ [SIGN_IN_DATA_FIELD]: { ...data } })
    }

    return { todayKillCount: data.todayKillCount, todayBossKillCount: data.todayBossKillCount, updated }
  } catch (error) {
    console.error('[DailySignIn] 记录击杀进度失败:', error)
    return { todayKillCount: 0, todayBossKillCount: 0, updated: false }
  }
}

// ==================== 连续签到计算 ====================

/**
 * 计算连续签到天数
 * 从最近一次签到日期往前回溯，连续不间断则为连续天数
 * @param {string[]} signedDates - 已签到日期数组（YYYY-MM-DD 格式）
 * @returns {number} 连续签到天数
 */
function calculateConsecutiveDays(signedDates) {
  if (!signedDates || signedDates.length === 0) {
    return 0
  }

  const sortedDates = [...signedDates].sort()
  const lastDateStr = sortedDates[sortedDates.length - 1]
  const lastDate = new Date(lastDateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  lastDate.setHours(0, 0, 0, 0)

  // 如果最后一次签到不是今天或昨天，连续签到中断
  const diffDays = Math.round((today - lastDate) / (24 * 60 * 60 * 1000))
  if (diffDays > 1) {
    return 0
  }

  let consecutive = 0
  let checkDate = new Date(lastDate)

  // 从最后签到日往前回溯
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const dateStr = formatDateKey(checkDate)
    if (sortedDates.includes(dateStr)) {
      consecutive++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  return consecutive
}

// ==================== 组合式函数主逻辑 ====================

/**
 * 每日签到组合式函数
 * @param {import('vue').Ref<Object>} playerRef - 玩家数据的响应式引用
 * @param {Object} options - 配置选项
 * @param {Function} [options.onAddBattleLog] - 添加战斗日志回调
 * @param {Function} [options.onShowAnimationMessage] - 显示动画消息回调
 * @param {Function} [options.onPlaySfx] - 播放音效回调
 * @returns {Object} 签到相关状态和方法
 */
export function useDailySignIn(playerRef, options = {}) {
  // 兼容 Ref 和 getter 函数两种传参方式
  // DailySignIn.vue 传入 () => props.player（getter 函数），函数没有 .value 属性
  // 需要包装为 computed ref，使内部所有 playerRef.value 调用能正确获取响应式数据
  if (typeof playerRef === 'function') {
    playerRef = computed(playerRef)
  }

  const { onAddBattleLog, onShowAnimationMessage, onPlaySfx } = options

  /** itemsStore 实例 */
  const itemsStore = useItemsStore()

  /** 当前日期（响应式，每次打开面板时刷新） */
  const now = ref(new Date())

  /** 签到数据 */
  const signInData = ref({
    lastSignInDate: null,
    signedDates: [],
    totalSignInDays: 0,
    todayKillCount: 0,
    todayBossKillCount: 0,
    lastKillDate: null
  })

  /** 今日击杀进度（0 ~ REQUIRED_KILLS），直接从玩家数据读取以确保响应式追踪 */
  const todayKillCount = computed(() => {
    const player = playerRef.value
    if (!player) return 0
    const data = player[SIGN_IN_DATA_FIELD]
    if (!data || typeof data !== 'object') return 0
    const today = todayKey.value
    if (data.lastKillDate !== today) return 0
    return data.todayKillCount || 0
  })

  /** 今日 BOSS 击杀进度（0 ~ 当日要求），直接从玩家数据读取以确保响应式追踪 */
  const todayBossKillCount = computed(() => {
    const player = playerRef.value
    if (!player) return 0
    const data = player[SIGN_IN_DATA_FIELD]
    if (!data || typeof data !== 'object') return 0
    const today = todayKey.value
    if (data.lastKillDate !== today) return 0
    return data.todayBossKillCount || 0
  })

  /** 今日所需怪物击杀数量（根据当前日期阶梯递增，月末最后一天×3） */
  const requiredKills = computed(() => getKillRequirement(currentDay.value, currentYear.value, currentMonth.value))

  /** 今日所需 BOSS 击杀数量（根据当前日期阶梯递增，月末最后一天×3） */
  const requiredBossKills = computed(() => getBossKillRequirement(currentDay.value, currentYear.value, currentMonth.value))

  /** 击杀进度是否满足签到要求 */
  const killRequirementMet = computed(() => todayKillCount.value >= requiredKills.value)

  /** BOSS 击杀进度是否满足签到要求 */
  const bossKillRequirementMet = computed(() => todayBossKillCount.value >= requiredBossKills.value)

  /** 是否正在签到中（防止重复点击） */
  const isSigningIn = ref(false)

  /** 当前年月（计算属性） */
  const currentYear = computed(() => now.value.getFullYear())
  const currentMonth = computed(() => now.value.getMonth())
  const currentDay = computed(() => now.value.getDate())

  /** 当月天数 */
  const daysInMonth = computed(() => getDaysInMonth(currentYear.value, currentMonth.value))

  /** 当月第一天星期几 */
  const firstDayOfWeek = computed(() => getFirstDayOfWeek(currentYear.value, currentMonth.value))

  /** 今天的日期键 */
  const todayKey = computed(() => formatDateKey(now.value))

  /** 当月月份键 */
  const currentMonthKey = computed(() => formatMonthKey(now.value))

  /** 连续签到天数，直接从玩家数据读取以确保响应式追踪 */
  const consecutiveDays = computed(() => {
    const player = playerRef.value
    if (!player) return 0
    const data = player[SIGN_IN_DATA_FIELD]
    if (!data || !Array.isArray(data.signedDates)) return 0
    return calculateConsecutiveDays(data.signedDates)
  })

  /** 今天是否已签到，直接从玩家数据读取以确保响应式追踪 */
  const hasSignedInToday = computed(() => {
    const player = playerRef.value
    if (!player) return false
    const data = player[SIGN_IN_DATA_FIELD]
    if (!data || !Array.isArray(data.signedDates)) return false
    return data.signedDates.includes(todayKey.value)
  })

  /** 是否可以签到（今天未签到且击杀进度和BOSS击杀进度均达标） */
  const canSignIn = computed(() => !hasSignedInToday.value && !isSigningIn.value && killRequirementMet.value && bossKillRequirementMet.value)

  /** 当月奖励配置（基于年月种子随机生成，同月确定性一致） */
  const monthlyRewards = computed(() => generateMonthlyRewards(currentYear.value, currentMonth.value))

  /** 今天的奖励配置 */
  const todayReward = computed(() => monthlyRewards.value.get(currentDay.value) || null)

  /** 总签到天数，直接从玩家数据读取以确保响应式追踪 */
  const totalSignInDays = computed(() => {
    const player = playerRef.value
    if (!player) return 0
    const data = player[SIGN_IN_DATA_FIELD]
    if (!data) return 0
    return data.totalSignInDays || 0
  })

  /**
   * 从玩家数据加载签到记录
   */
  function loadSignInData() {
    try {
      const player = playerRef.value
      if (!player) {
        signInData.value = { lastSignInDate: null, signedDates: [], totalSignInDays: 0, todayKillCount: 0, todayBossKillCount: 0, lastKillDate: null }
        return
      }

      const saved = player[SIGN_IN_DATA_FIELD]
      if (saved && typeof saved === 'object') {
        signInData.value = {
          lastSignInDate: saved.lastSignInDate || null,
          signedDates: Array.isArray(saved.signedDates) ? [...saved.signedDates] : [],
          totalSignInDays: saved.totalSignInDays || 0,
          todayKillCount: saved.todayKillCount || 0,
          todayBossKillCount: saved.todayBossKillCount || 0,
          lastKillDate: saved.lastKillDate || null
        }
      } else {
        signInData.value = { lastSignInDate: null, signedDates: [], totalSignInDays: 0, todayKillCount: 0, todayBossKillCount: 0, lastKillDate: null }
      }
    } catch (error) {
      console.error('[DailySignIn] 加载签到数据失败:', error)
      signInData.value = { lastSignInDate: null, signedDates: [], totalSignInDays: 0, todayKillCount: 0, todayBossKillCount: 0, lastKillDate: null }
    }
  }

  /**
   * 保存签到数据到玩家存档
   */
  function saveSignInData() {
    try {
      const player = playerRef.value
      if (!player) return

      const dataToSave = {
        lastSignInDate: signInData.value.lastSignInDate,
        signedDates: signInData.value.signedDates,
        totalSignInDays: signInData.value.totalSignInDays,
        todayKillCount: signInData.value.todayKillCount,
        todayBossKillCount: signInData.value.todayBossKillCount,
        lastKillDate: signInData.value.lastKillDate
      }

      // 直接更新 player 代理对象的 dailySignIn 属性
      player[SIGN_IN_DATA_FIELD] = dataToSave

      // 持久化到后端存储
      storageService.savePlayerPatch({ [SIGN_IN_DATA_FIELD]: dataToSave })
    } catch (error) {
      console.error('[DailySignIn] 保存签到数据失败:', error)
    }
  }

  /**
   * 检查指定日期是否已签到（直接从玩家数据读取，确保响应式追踪）
   * @param {number} day - 当月日期
   * @returns {boolean} 是否已签到
   */
  function isDaySignedIn(day) {
    const dateKey = `${currentMonthKey.value}-${String(day).padStart(2, '0')}`
    const player = playerRef.value
    if (!player) return false
    const data = player[SIGN_IN_DATA_FIELD]
    if (!data || !Array.isArray(data.signedDates)) return false
    return data.signedDates.includes(dateKey)
  }

  /**
   * 获取日历网格数据（含前置空位）
   * @returns {Array<{day: number|null, isSignedIn: boolean, isToday: boolean, reward: Object|null}>} 日历格子数组
   */
  const calendarDays = computed(() => {
    const days = []
    const total = daysInMonth.value
    const firstDay = firstDayOfWeek.value
    const rewards = monthlyRewards.value

    // 前置空位（对齐星期）
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, isSignedIn: false, isToday: false, reward: null })
    }

    // 当月每一天
    for (let d = 1; d <= total; d++) {
      days.push({
        day: d,
        isSignedIn: isDaySignedIn(d),
        isToday: d === currentDay.value,
        reward: rewards.get(d) || null
      })
    }

    return days
  })

  /**
   * 获取物品名称
   * @param {number} itemId - 物品ID
   * @returns {string} 物品名称
   */
  function getItemName(itemId) {
    const config = itemsStore.getItemConfig(itemId)
    if (config?.name) {
      return typeof config.name === 'string' ? config.name : config.name.cns || config.name.en || '未知物品'
    }
    return '未知物品'
  }

  /**
   * 执行签到操作
   * @returns {boolean} 签到是否成功
   */
  function doSignIn() {
    if (!canSignIn.value) {
      return false
    }

    isSigningIn.value = true

    try {
      const player = playerRef.value
      if (!player) return false

      const dateKey = todayKey.value
      const day = currentDay.value
      const reward = monthlyRewards.value.get(day)

      // 确保玩家数据中存在 dailySignIn 对象
      if (!player[SIGN_IN_DATA_FIELD] || typeof player[SIGN_IN_DATA_FIELD] !== 'object') {
        player[SIGN_IN_DATA_FIELD] = {
          lastSignInDate: null,
          signedDates: [],
          totalSignInDays: 0,
          todayKillCount: 0,
          todayBossKillCount: 0,
          lastKillDate: dateKey
        }
      }

      const data = player[SIGN_IN_DATA_FIELD]

      // 记录签到（直接修改玩家数据，确保响应式追踪）
      if (!Array.isArray(data.signedDates)) {
        data.signedDates = []
      }
      data.signedDates.push(dateKey)
      data.lastSignInDate = dateKey
      data.totalSignInDays = (data.totalSignInDays || 0) + 1

      // 构建签到后的完整数据快照
      const updatedData = {
        lastSignInDate: data.lastSignInDate,
        signedDates: [...data.signedDates],
        totalSignInDays: data.totalSignInDays,
        todayKillCount: data.todayKillCount || 0,
        todayBossKillCount: data.todayBossKillCount || 0,
        lastKillDate: data.lastKillDate || null
      }

      // 同步更新本地 signInData ref（保持兼容）
      signInData.value = { ...updatedData }

      // 直接更新 player 代理对象的 dailySignIn 属性（整体替换为新引用）
      player[SIGN_IN_DATA_FIELD] = updatedData

      // 发放奖励物品到背包
      const bagService = new BagService()
      let successCount = 0
      const itemNames = []

      if (reward && reward.items) {
        reward.items.forEach(item => {
          const success = bagService.addItemToBag(item.id, null, item.count)
          if (success) {
            successCount++
            itemNames.push(`${getItemName(item.id)} x${item.count}`)
          }
        })
      }

      if (successCount > 0) {
        // 立即保存背包数据到存储
        bagService.savePlayerData()
      }

      // 持久化签到数据到后端存储
      storageService.savePlayerPatch({ [SIGN_IN_DATA_FIELD]: { ...updatedData } })

      // 立即刷新防抖队列，将签到数据和背包数据强制发送到后端
      // 避免10秒防抖延迟期间刷新页面导致签到状态和奖励物品丢失
      storageService.flushPendingPatches()

      // 触发回调：战斗日志
      if (onAddBattleLog) {
        const milestoneText = reward?.isMilestone ? `【${reward.label}】` : ''
        onAddBattleLog(
          `每日签到 ${milestoneText}第${day}天：${itemNames.join('、')}（连续签到${consecutiveDays.value}天，累计签到${data.totalSignInDays}天）`,
          'reward'
        )
      }

      // 触发回调：动画消息
      if (onShowAnimationMessage) {
        onShowAnimationMessage(
          `签到成功！连续签到${consecutiveDays.value}天`,
          'reward',
          '/pt/UI/gold.png'
        )
      }

      // 触发回调：音效
      if (onPlaySfx) {
        onPlaySfx('InfGroundPickup.wav')
      }

      return true
    } catch (error) {
      console.error('[DailySignIn] 签到失败:', error)
      return false
    } finally {
      isSigningIn.value = false
    }
  }

  /**
   * 刷新当前时间（面板打开时调用）
   */
  function refreshNow() {
    now.value = new Date()
  }

  return {
    // 状态
    now,
    signInData,
    isSigningIn,
    consecutiveDays,
    totalSignInDays,
    hasSignedInToday,
    canSignIn,
    todayReward,
    monthlyRewards,
    calendarDays,
    currentYear,
    currentMonth,
    currentDay,
    daysInMonth,
    todayKey,
    currentMonthKey,
    todayKillCount,
    todayBossKillCount,
    requiredKills,
    requiredBossKills,
    killRequirementMet,
    bossKillRequirementMet,
    // 方法
    loadSignInData,
    saveSignInData,
    doSignIn,
    refreshNow,
    isDaySignedIn,
    getSignInRewardForDay: (day) => getSignInRewardForDay(day, currentYear.value, currentMonth.value),
    getItemName
  }
}
