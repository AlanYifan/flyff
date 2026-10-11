/**
 * @file useAchievementKillTracker.js
 * @description 成就击杀进度追踪组合式函数（非阻塞式延迟批量更新）
 * @description 击杀怪物后将击杀事件加入队列，通过 requestIdleCallback（或 setTimeout 回退）
 * @description 在主线程空闲时批量提交给 AchievementService.recordEvent
 * @description 设计目标：不阻塞战斗热路径，延迟更新可接受
 * @author FLYFF Team
 * @created 2026-07-13
 * @updated 2026-07-15 flush() 改为全量处理（processAll=true），确保页面卸载时所有击杀进度被提交，避免分批调度在 beforeunload 中无法执行
 */

import { useGameStore, useAchievementsStore } from '@/store'
import { achievementService } from '@/services/AchievementService.js'

// ==================== 模块级单例状态 ====================
// 队列与调度状态在整个应用生命周期共享，确保多次调用 useAchievementKillTracker() 共用同一个队列

/**
 * 击杀事件待处理队列：monsterId → 累计击杀数
 * @type {Map<number, number>}
 */
const killQueue = new Map()

/**
 * 是否已调度刷新
 * @type {boolean}
 */
let flushScheduled = false

/**
 * requestIdleCallback 返回的句柄，用于取消调度
 * @type {number|null}
 */
let idleCallbackHandle = null

/**
 * setTimeout 回退的定时器 ID，用于取消调度
 * @type {ReturnType<typeof setTimeout>|null}
 */
let flushTimerId = null

/**
 * Pinia gameStore 实例（首次调用 useAchievementKillTracker 时缓存）
 * @type {Object|null}
 */
let cachedGameStore = null

/**
 * Pinia achievementsStore 实例（首次调用 useAchievementKillTracker 时缓存）
 * @type {Object|null}
 */
let cachedAchievementsStore = null

// ==================== 常量配置 ====================

/**
 * setTimeout 回退模式下的刷新延迟（毫秒）
 * @type {number}
 */
const FLUSH_DELAY_MS = 300

/**
 * requestIdleCallback 的超时时间（毫秒），确保即使主线程持续忙碌也能在限定时间内刷新
 * @type {number}
 */
const IDLE_TIMEOUT_MS = 1000

/**
 * 单次刷新处理的最大怪物 ID 数量，防止队列过大时阻塞空闲回调
 * @type {number}
 */
const MAX_BATCH_PER_FLUSH = 30

// ==================== 内部方法 ====================

/**
 * 实际执行队列刷新：将累积的击杀事件批量提交给成就系统
 * 采用分批处理策略，每次最多处理 MAX_BATCH_PER_FLUSH 条，剩余的重新调度
 * @param {boolean} [processAll=false] - 是否一次性处理所有条目（用于页面卸载时确保全部刷新）
 * @returns {void}
 */
const flushQueue = (processAll = false) => {
  flushScheduled = false
  idleCallbackHandle = null
  flushTimerId = null

  if (killQueue.size === 0) return
  if (!cachedGameStore || !cachedAchievementsStore) return

  // 取出当前队列中的条目
  const allEntries = Array.from(killQueue.entries())

  // 分批处理或全量处理
  const batch = processAll ? allEntries : allEntries.slice(0, MAX_BATCH_PER_FLUSH)
  const remaining = processAll ? [] : allEntries.slice(MAX_BATCH_PER_FLUSH)

  // 清空队列后重新放入剩余部分
  killQueue.clear()
  for (const [id, count] of remaining) {
    killQueue.set(id, count)
  }

  // 批量提交击杀事件
  for (const [monsterId, count] of batch) {
    try {
      cachedAchievementsStore.recordEvent(cachedGameStore, 'killmonster', {
        monsterId,
        amount: count
      })
    } catch (error) {
      console.error('[AchievementKillTracker] recordEvent 失败:', error)
    }
  }

  // 如果还有剩余条目且不是全量模式，重新调度下一批
  if (!processAll && killQueue.size > 0) {
    scheduleFlush()
  }
}

/**
 * 调度一次队列刷新
 * 优先使用 requestIdleCallback（主线程空闲时执行），不支持时回退到 setTimeout
 * @returns {void}
 */
const scheduleFlush = () => {
  if (flushScheduled) return
  flushScheduled = true

  if (typeof requestIdleCallback === 'function') {
    idleCallbackHandle = requestIdleCallback(flushQueue, { timeout: IDLE_TIMEOUT_MS })
  } else {
    flushTimerId = setTimeout(flushQueue, FLUSH_DELAY_MS)
  }
}

/**
 * 取消已调度的刷新
 * @returns {void}
 */
const cancelScheduledFlush = () => {
  flushScheduled = false
  if (idleCallbackHandle !== null && typeof cancelIdleCallback === 'function') {
    cancelIdleCallback(idleCallbackHandle)
    idleCallbackHandle = null
  }
  if (flushTimerId !== null) {
    clearTimeout(flushTimerId)
    flushTimerId = null
  }
}

// ==================== 组合式函数 ====================

/**
 * 成就击杀进度追踪组合式函数
 *
 * 用途/业务意图：在战斗系统中击杀怪物后调用 recordKill(monsterId)，
 * 击杀事件会被加入模块级队列，通过 requestIdleCallback 在主线程空闲时
 * 批量提交给 AchievementService.recordEvent，避免阻塞战斗主循环。
 *
 * 特性：
 * - 同一怪物多次击杀会自动聚合为一次 recordEvent 调用（amount 累加）
 * - 使用 MONSTER_ID_INDEX 预过滤，无成就的怪物不会进入队列
 * - 分批处理，单次最多处理 MAX_BATCH_PER_FLUSH 条
 * - 支持手动 flush() 立即提交（如面板关闭前）
 *
 * @returns {{ recordKill: Function, flush: Function }} 记录击杀和立即刷新的方法
 */
export function useAchievementKillTracker () {
  // 获取并缓存 Store 实例（Pinia 单例，重复调用返回同一实例）
  if (!cachedGameStore) {
    cachedGameStore = useGameStore()
  }
  if (!cachedAchievementsStore) {
    cachedAchievementsStore = useAchievementsStore()
  }

  /**
   * 记录一次怪物击杀事件（非阻塞，仅加入队列）
   * @param {number|string} monsterId - 被击杀的怪物 ID
   * @param {number} [count=1] - 击杀数量（批量击杀时可传入大于 1 的值）
   * @returns {void}
   */
  const recordKill = (monsterId, count = 1) => {
    if (monsterId === null || monsterId === undefined) return

    const id = Number(monsterId)
    if (isNaN(id)) return

    // 预过滤：无对应成就的怪物直接跳过，不进入队列
    if (!achievementService.hasMonsterAchievement(id)) return

    // 满级跳过：该怪物的所有关联成就均已满级，不再统计
    const achievementData = cachedGameStore?.player?.achievement
    if (achievementData && achievementService.isMonsterAchievementsFullyCompleted(id, achievementData)) return

    const current = killQueue.get(id) || 0
    killQueue.set(id, current + count)

    scheduleFlush()
  }

  /**
   * 立即刷新队列，将所有待处理的击杀事件提交给成就系统
   * 适用于面板关闭前或页面卸载（beforeunload）时需要立即同步的场景
   * 使用 processAll=true 一次性处理所有条目，避免分批调度在页面卸载时无法执行
   * @returns {void}
   */
  const flush = () => {
    cancelScheduledFlush()
    flushQueue(true)
  }

  return {
    recordKill,
    flush
  }
}
