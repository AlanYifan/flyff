/**
 * 统一帧调度器
 *
 * 核心设计思想：
 * - requestAnimationFrame 仅用于"视觉提交"（将计算结果写入 DOM / Canvas / Vue 响应式）
 * - 所有"计算工作"（战斗逻辑、DOT tick、冷却更新）通过 setTimeout / scheduler.postTask 调度
 * - 单一调度入口，优先级队列 + 严格预算控制，彻底消除 RAF handler 长任务违规
 *
 * 优先级（从高到低）：
 * 1. commit   — 视觉提交（RAF 对齐，每帧最多 8ms）
 * 2. critical — 用户输入响应 / 状态切换（立即执行）
 * 3. high     — 战斗主循环 / 普通攻击 / 技能释放（setTimeout 0，单次最多 8ms）
 * 4. medium   — DOT tick 处理（setTimeout 0，单次最多 6ms）
 * 5. low      — 冷却 UI 更新 / 统计刷新（setTimeout 16ms 节流，单次最多 4ms）
 *
 * @file UnifiedFrameScheduler.js
 * @generated 2026-07-12
 */

/** 优先级枚举 */
export const PRIORITY = Object.freeze({
  COMMIT: 'commit',
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
})

/** 各优先级的单次执行时间预算（毫秒） */
const PRIORITY_BUDGET_MS = Object.freeze({
  commit: 8,
  critical: 4,
  high: 8,
  medium: 6,
  low: 4
})

/** 各优先级的调度延迟（毫秒），0 表示 setTimeout(0) */
const PRIORITY_DELAY_MS = Object.freeze({
  commit: 0,
  critical: 0,
  high: 0,
  medium: 0,
  low: 16
})

/** 各优先级每轮最多执行的任务数 */
const PRIORITY_MAX_TASKS = Object.freeze({
  commit: 1,
  critical: 3,
  high: 1,
  medium: 1,
  low: 1
})

/** 提交阶段子预算：每个回调的最大执行时间（毫秒） */
const COMMIT_PER_CALLBACK_BUDGET_MS = 6

/** 提交阶段最大回调数/帧 */
const COMMIT_MAX_CALLBACKS_PER_FRAME = 5

/**
 * 统一帧调度器单例
 *
 * 使用方式：
 * ```js
 * import { unifiedScheduler, PRIORITY } from './UnifiedFrameScheduler'
 *
 * // 注册一个高优先级任务
 * const taskId = unifiedScheduler.schedule(PRIORITY.HIGH, () => {
 *   doHeavyWork()
 * })
 *
 * // 取消任务
 * unifiedScheduler.cancel(taskId)
 *
 * // 注册每帧提交任务（RAF 对齐）
 * unifiedScheduler.onCommit(() => flushVitals())
 * ```
 */
class UnifiedFrameScheduler {
  constructor () {
    /** @type {Map<string, Array<{id:string, fn:Function,cancelled:boolean}>>} 按优先级分组的待执行任务 */
    this.queues = new Map()
    for (const p of Object.values(PRIORITY)) {
      this.queues.set(p, [])
    }

    /** @type {number} 自增任务 ID */
    this._nextId = 1

    /** @type {Map<string, {fn:Function}>} 提交阶段回调（RAF 对齐） */
    this._commitCallbacks = new Map()

    /** @type {number|null} RAF ID */
    this._rafId = null

    /** @type {Set<string>} 已调度的优先级（防止重复 setTimeout） */
    this._scheduledPriorities = new Set()

    /** @type {number} 总调度次数（用于诊断） */
    this._totalScheduled = 0

    /** @type {number} 总执行次数（用于诊断） */
    this._totalExecuted = 0

    /** @type {boolean} 是否已销毁 */
    this._destroyed = false
  }

  /**
   * 调度一个任务到指定优先级队列
   * @param {string} priority - 优先级（PRIORITY 枚举值）
   * @param {Function} fn - 任务函数
   * @returns {string} 任务 ID，可用于取消
   */
  schedule (priority, fn) {
    if (this._destroyed || typeof fn !== 'function') {
      return ''
    }
    const queue = this.queues.get(priority)
    if (!queue) {
      return ''
    }

    const id = `task_${this._nextId++}`
    queue.push({ id, fn, cancelled: false })
    this._totalScheduled++

    this._ensureScheduled(priority)
    return id
  }

  /**
   * 取消一个已调度的任务
   * @param {string} taskId - schedule 返回的任务 ID
   */
  cancel (taskId) {
    if (!taskId) {
      return
    }
    for (const queue of this.queues.values()) {
      for (const task of queue) {
        if (task.id === taskId) {
          task.cancelled = true
          return
        }
      }
    }
    // 也检查提交回调
    if (this._commitCallbacks.has(taskId)) {
      this._commitCallbacks.delete(taskId)
    }
  }

  /**
   * 注册一个"每帧提交"回调，在 RAF 回调中执行
   * 用于将计算结果批量写入 DOM / Canvas / Vue 响应式
   * @param {Function} fn - 提交函数
   * @returns {string} 回调 ID，可用于移除
   */
  onCommit (fn) {
    if (this._destroyed || typeof fn !== 'function') {
      return ''
    }
    const id = `commit_${this._nextId++}`
    this._commitCallbacks.set(id, { fn })
    this._ensureRafScheduled()
    return id
  }

  /**
   * 移除一个提交回调
   * @param {string} callbackId - onCommit 返回的 ID
   */
  offCommit (callbackId) {
    if (callbackId) {
      this._commitCallbacks.delete(callbackId)
    }
  }

  /**
   * 确保指定优先级的队列会被调度执行
   * @param {string} priority - 优先级
   * @private
   */
  _ensureScheduled (priority) {
    if (priority === PRIORITY.COMMIT) {
      this._ensureRafScheduled()
      return
    }
    if (this._scheduledPriorities.has(priority)) {
      return
    }
    this._scheduledPriorities.add(priority)
    const delay = PRIORITY_DELAY_MS[priority] || 0
    setTimeout(() => {
      this._scheduledPriorities.delete(priority)
      this._drainQueue(priority)
    }, delay)
  }

  /**
   * 确保 RAF 提交循环已调度
   * @private
   */
  _ensureRafScheduled () {
    if (this._rafId !== null || this._destroyed) {
      return
    }
    if (typeof requestAnimationFrame !== 'function') {
      // 回退到 setTimeout
      this._rafId = setTimeout(() => {
        this._rafId = null
        this._runCommit()
      }, 16)
      return
    }
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null
      this._runCommit()
    })
  }

  /**
   * 执行提交阶段回调（RAF 对齐，分阶段预算控制）
   *
   * 提交阶段是唯一使用 RAF 的地方，用于视觉同步。
   * 每个回调有独立的执行时间预算（COMMIT_PER_CALLBACK_BUDGET_MS），
   * 总回调数不超过 COMMIT_MAX_CALLBACKS_PER_FRAME，
   * 整个提交阶段不超过 PRIORITY_BUDGET_MS.commit。
   *
   * 如果某个回调耗时超过预算，会记录警告日志，
   * 帮助定位阻塞主线程的回调。
   *
   * @private
   */
  _runCommit () {
    if (this._destroyed) {
      return
    }

    // 先执行 commit 队列中的任务
    this._drainQueue(PRIORITY.COMMIT)

    // 再执行注册的提交回调（分阶段预算控制）
    if (this._commitCallbacks.size > 0) {
      const frameStartedAt = this._now()
      const totalBudget = PRIORITY_BUDGET_MS.commit
      let callbackCount = 0

      for (const [id, entry] of this._commitCallbacks) {
        // 总预算检查：整个提交阶段不超过 totalBudget
        const elapsed = this._now() - frameStartedAt
        if (elapsed > totalBudget) {
          // 超出总预算，剩余回调推迟到下一帧
          break
        }

        // 单次回调数量上限
        if (callbackCount >= COMMIT_MAX_CALLBACKS_PER_FRAME) {
          break
        }

        // 单个回调预算检查
        const callbackStart = this._now()
        try {
          entry.fn()
        } catch (error) {
          console.error('[UnifiedFrameScheduler] 提交回调执行失败:', error)
        }
        const callbackElapsed = this._now() - callbackStart

        // 诊断：如果单个回调耗时超过预算，记录警告
        if (callbackElapsed > COMMIT_PER_CALLBACK_BUDGET_MS) {
          console.warn(
            `[UnifiedFrameScheduler] 提交回调 ${id} 耗时 ${callbackElapsed.toFixed(1)}ms，超过预算 ${COMMIT_PER_CALLBACK_BUDGET_MS}ms`
          )
        }

        this._totalExecuted++
        callbackCount++
      }
    }

    // 如果还有提交任务或回调，继续调度下一帧
    const hasCommitWork =
      this.queues.get(PRIORITY.COMMIT).length > 0 ||
      this._commitCallbacks.size > 0
    if (hasCommitWork) {
      this._ensureRafScheduled()
    }
  }

  /**
   * 排空指定优先级的队列，受时间预算限制
   * @param {string} priority - 优先级
   * @private
   */
  _drainQueue (priority) {
    if (this._destroyed) {
      return
    }
    const queue = this.queues.get(priority)
    if (!queue || queue.length === 0) {
      return
    }

    const budget = PRIORITY_BUDGET_MS[priority] || 4
    const maxTasks = PRIORITY_MAX_TASKS[priority] || 1
    const startedAt = this._now()
    let executed = 0

    while (queue.length > 0 && executed < maxTasks) {
      if (this._now() - startedAt > budget) {
        break
      }

      const task = queue.shift()
      if (!task || task.cancelled) {
        continue
      }

      try {
        task.fn()
      } catch (error) {
        console.error(`[UnifiedFrameScheduler] ${priority} 任务执行失败:`, error)
      }
      executed++
      this._totalExecuted++
    }

    // 如果队列中还有任务，继续调度下一轮
    if (queue.length > 0) {
      this._ensureScheduled(priority)
    }
  }

  /**
   * 获取当前时间戳（优先使用 performance.now）
   * @returns {number}
   * @private
   */
  _now () {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now()
    }
    return Date.now()
  }

  /**
   * 获取调度器统计信息
   * @returns {Object}
   */
  getStats () {
    const queueSizes = {}
    for (const [priority, queue] of this.queues) {
      queueSizes[priority] = queue.length
    }
    return {
      queueSizes,
      commitCallbacks: this._commitCallbacks.size,
      totalScheduled: this._totalScheduled,
      totalExecuted: this._totalExecuted,
      hasRafScheduled: this._rafId !== null,
      destroyed: this._destroyed
    }
  }

  /**
   * 清空所有队列和回调（不销毁实例）
   */
  clear () {
    for (const queue of this.queues.values()) {
      queue.length = 0
    }
    this._commitCallbacks.clear()
    this._scheduledPriorities.clear()
    if (this._rafId !== null) {
      if (typeof cancelAnimationFrame === 'function' && this._rafId > 0 && this._rafId < 1000000) {
        cancelAnimationFrame(this._rafId)
      } else {
        clearTimeout(this._rafId)
      }
      this._rafId = null
    }
  }

  /**
   * 销毁调度器，释放所有资源
   */
  destroy () {
    this._destroyed = true
    this.clear()
  }
}

/** 统一帧调度器单例 */
export const unifiedScheduler = new UnifiedFrameScheduler()

export default unifiedScheduler
