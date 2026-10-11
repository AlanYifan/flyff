/**
 * 战斗变更批处理器
 *
 * 核心设计思想：
 * - 战斗计算阶段（performAttack / applySkillEffect / DOT tick / 怪物攻击）只写入本批处理器
 * - 绝不直接写入 Vue 代理（monster.currentHealth = ... 会导致响应式级联）
 * - 在一帧结束时，通过 unifiedScheduler 的 commit 阶段统一 flush 到 store
 * - flush 调用 applyMonsterVitalsBatchUpdates 一次性提交所有变更
 * - 每个阶段都有严格的时间预算和数量上限，超限自动延迟到下一帧
 * - 回调（onAttack / onDamageApplied 等）不在 RAF commit 中执行，通过 setTimeout(0) 调度
 *
 * 数据流：
 *   战斗计算 → batcher.queueVitalsUpdate(i, {currentHealth, isDefeated})
 *            → batcher.queueDefeated(i, monster)
 *            → batcher.queueCallback(fn)
 *            ↓ (RAF commit 阶段，仅 proxy/TypedArray 写入)
 *            → Phase 1: _flushDefeated (≤3ms, ≤5只/帧)
 *            → Phase 2: _flushVitals   (≤3ms, handleDefeated=false)
 *            → Phase 3: 回调 → setTimeout(0) 异步执行，不阻塞 RAF
 *            → 剩余数据 → 下一帧继续
 *
 * @file BattleMutationBatcher.js
 * @generated 2026-07-12
 */

import { toRaw } from 'vue'
import { unifiedScheduler } from './UnifiedFrameScheduler'
import { useMonstersStore } from '@/store/monsters'
import { monsterTransitionBatcher } from './MonsterTransitionBatcher'

/**
 * 战斗变更批处理器单例
 *
 * 使用方式：
 * ```js
 * import { battleMutationBatcher } from './BattleMutationBatcher'
 *
 * // 在战斗计算中（不写 Vue 代理）
 * battleMutationBatcher.queueVitalsUpdate(monsterIndex, {
 *   currentHealth: newHealth,
 *   isDefeated: shouldDie
 * })
 * battleMutationBatcher.queueCallback(() => {
 *   this.onAttack({ targetIndex, damage, isCritical })
 * })
 *
 * // 不需要手动 flush — 批处理器在每帧 commit 阶段自动 flush
 * // 如果需要立即 flush（如战斗停止时）：
 * battleMutationBatcher.flushNow()
 * ```
 */
class BattleMutationBatcher {
  constructor () {
    /** @type {Array<{index:number,currentHealth?:number,healthPercentage?:number,isDefeated?:boolean}>} 待提交的怪物 vitals 更新 */
    this._vitalsUpdates = []

    /** @type {Map<number, {index:number,currentHealth?:number,healthPercentage?:number,isDefeated?:boolean}>} 按怪物索引去重 */
    this._vitalsUpdateMap = new Map()

    /** @type {Array<{type:string,data:Object}>} 延迟执行的回调 */
    this._pendingCallbacks = []

    /** @type {Array<{index:number,monster:Object}>} 延迟执行的死亡处理 */
    this._pendingDefeated = []

    /** @type {string|null} 提交回调注册 ID */
    this._commitId = null

    /** @type {boolean} 是否已有待 flush 的数据 */
    this._dirty = false

    /** @type {number} 单次 flush 最多执行的回调数 */
    this._maxCallbacksPerFlush = 10

    /** @type {number} 单次 flush 回调的时间预算（毫秒） */
    this._callbackBudgetMs = 2

    /** @type {number} 单次 flush 最多处理的死亡怪物数 */
    this._maxDefeatedPerFlush = 1

    /** @type {number} 单次 flush 死亡处理的时间预算（毫秒） */
    this._defeatedBudgetMs = 1

    /** @type {number} 单次 flush vitals 更新的时间预算（毫秒） */
    this._vitalsBudgetMs = 3

    /** @type {number} 单次 flush vitals 更新的最大数量 */
    this._maxVitalsPerFlush = 30

    /** @type {boolean} 回调 flush 是否已调度（防止重复 setTimeout） */
    this._callbackFlushScheduled = false

    /** @type {boolean} 死亡处理 flush 是否已调度（防止重复 setTimeout） */
    this._defeatedFlushScheduled = false

    /** @type {number} 回调异步 flush 的单批最大数量 */
    this._maxCallbacksPerAsyncBatch = 5

    /** @type {number} 回调异步 flush 的单批时间预算（毫秒） */
    this._asyncCallbackBudgetMs = 4
  }

  /**
   * 确保提交回调已注册到统一调度器
   * @private
   */
  _ensureCommitRegistered () {
    if (this._commitId) {
      return
    }
    this._commitId = unifiedScheduler.onCommit(() => {
      this.flushNow()
    })
  }

  /**
   * 将怪物 vitals 更新加入队列
   * 同一怪物的多次更新会被合并（后写覆盖前写）
   * @param {number} index - 怪物索引
   * @param {Object} update - 更新数据
   * @param {number} [update.currentHealth] - 新的当前生命值
   * @param {number} [update.healthPercentage] - 新的血量百分比
   * @param {boolean} [update.isDefeated] - 是否已击败
   */
  queueVitalsUpdate (index, update) {
    if (!Number.isFinite(index) || index < 0) {
      return
    }

    const existing = this._vitalsUpdateMap.get(index)
    if (existing) {
      // 合并：后写覆盖前写
      if (update.currentHealth !== undefined) {
        existing.currentHealth = update.currentHealth
      }
      if (update.healthPercentage !== undefined) {
        existing.healthPercentage = update.healthPercentage
      }
      if (update.isDefeated !== undefined) {
        existing.isDefeated = update.isDefeated
      }
    } else {
      const entry = { index, ...update }
      this._vitalsUpdateMap.set(index, entry)
      this._vitalsUpdates.push(entry)
    }

    this._markDirty()
  }

  /**
   * 将怪物死亡事件加入队列
   * 死亡处理会在 flush 时执行，包括设置 isDefeated/isFading/isHidden 等
   * @param {number} index - 怪物索引
   * @param {Object} monster - 怪物对象（原始引用）
   */
  queueDefeated (index, monster) {
    if (!Number.isFinite(index) || index < 0 || !monster) {
      return
    }

    // 避免重复入队
    for (const entry of this._pendingDefeated) {
      if (entry.index === index) {
        return
      }
    }

    this._pendingDefeated.push({ index, monster })

    // 同时确保 vitals 会被更新
    this.queueVitalsUpdate(index, { currentHealth: 0, healthPercentage: 0, isDefeated: true })

    this._markDirty()
  }

  /**
   * 将回调函数加入延迟执行队列
   * 回调会在 flush 时按顺序执行，受时间预算限制
   * @param {Function} fn - 回调函数
   * @param {string} [type='generic'] - 回调类型（用于诊断）
   */
  queueCallback (fn, type = 'generic') {
    if (typeof fn !== 'function') {
      return
    }
    this._pendingCallbacks.push({ type, fn })
    this._markDirty()
  }

  /**
   * 将回调函数通过 setTimeout(0) 调度，而非在 RAF commit 阶段同步执行
   *
   * 用于 onMonsterDefeated 等会触发级联计算（微任务）的回调，
   * 避免微任务在当前 RAF 帧内执行导致阻塞。
   * setTimeout(0) 会创建独立任务，让浏览器有机会先渲染当前帧。
   *
   * @param {Function} fn - 回调函数
   * @param {string} [type='deferred'] - 回调类型（用于诊断）
   */
  queueDeferredCallback (fn, type = 'deferred') {
    if (typeof fn !== 'function') {
      return
    }
    // 使用 setTimeout(0) 调度，确保回调在独立宏任务中执行
    // 而非在 RAF commit 阶段同步执行，避免微任务（Promise.resolve().then）阻塞当前帧
    setTimeout(() => {
      try {
        fn()
      } catch (error) {
        console.error(`[BattleMutationBatcher] 延迟回调执行失败 (${type}):`, error)
      }
    }, 0)
  }

  /**
   * 标记批处理器为脏状态，确保 commit 回调已注册
   * @private
   */
  _markDirty () {
    if (!this._dirty) {
      this._dirty = true
      this._ensureCommitRegistered()
    }
  }

  /**
   * 立即 flush 所有待提交的变更（分阶段 + 预算控制）
   *
   * RAF commit 阶段只执行 TypedArray 写入（vitals 更新），
   * 不执行死亡处理（proxy 写入）和回调（onAttack / onDamageApplied 等），
   * 因为这些操作可能触发 Vue 响应式更新导致阻塞。
   *
   * - 死亡处理 → _scheduleDefeatedFlush() 用 setTimeout(0) 异步执行
   * - 回调 → _scheduleCallbackFlush() 用 setTimeout(0) 异步执行
   *
   * 如果没有剩余数据，注销 commit 回调以停止空转 RAF 循环。
   */
  flushNow () {
    if (!this._dirty && this._vitalsUpdates.length === 0 && this._pendingCallbacks.length === 0 && this._pendingDefeated.length === 0) {
      // 无数据：注销 commit 回调，停止 RAF 空转
      this._unregisterCommit()
      return
    }

    this._dirty = false

    // Phase 1: vitals 更新（TypedArray 写入） — 快，在 RAF 中执行
    if (this._vitalsUpdates.length > 0) {
      this._flushVitals()
    }

    // Phase 2: 死亡处理（proxy 写入 + 定时器） — 不在 RAF 中执行，通过 setTimeout(0) 异步调度
    if (this._pendingDefeated.length > 0) {
      this._scheduleDefeatedFlush()
    }

    // Phase 3: 回调 — 不在 RAF 中执行，通过 setTimeout(0) 异步调度
    if (this._pendingCallbacks.length > 0) {
      this._scheduleCallbackFlush()
    }

    // 如果还有剩余 vitals 数据，确保下一帧继续 flush
    if (this._vitalsUpdates.length > 0) {
      this._markDirty()
    } else if (this._pendingDefeated.length === 0 && this._pendingCallbacks.length === 0) {
      // 所有数据已处理完毕，注销 commit 回调停止 RAF 空转
      this._unregisterCommit()
    }
  }

  /**
   * 通过 setTimeout(0) 异步调度死亡处理
   * 确保死亡处理不在 RAF commit 中同步执行，避免 Vue proxy 写入阻塞渲染
   * @private
   */
  _scheduleDefeatedFlush () {
    if (this._defeatedFlushScheduled) {
      return
    }
    this._defeatedFlushScheduled = true
    setTimeout(() => {
      this._defeatedFlushScheduled = false
      this._flushDefeatedAsync()
    }, 0)
  }

  /**
   * 异步分批执行死亡处理（不在 RAF 中执行）
   * 每批最多 _maxDefeatedPerFlush 只怪物或 _defeatedBudgetMs 毫秒，
   * 超出部分通过 setTimeout(0) 调度下一批
   * @private
   */
  _flushDefeatedAsync () {
    if (this._pendingDefeated.length === 0) {
      return
    }

    this._flushDefeated()

    // 如果还有剩余死亡处理，调度下一批
    if (this._pendingDefeated.length > 0) {
      this._scheduleDefeatedFlush()
    }
  }

  /**
   * 注销 commit 回调，停止 RAF 空转循环
   * 当有新数据时 _markDirty → _ensureCommitRegistered 会重新注册
   * @private
   */
  _unregisterCommit () {
    if (this._commitId) {
      unifiedScheduler.offCommit(this._commitId)
      this._commitId = null
    }
  }

  /**
   * 通过 setTimeout(0) 异步调度回调执行
   * 确保回调不在 RAF commit 中同步执行，避免 Vue 响应式更新阻塞渲染
   * @private
   */
  _scheduleCallbackFlush () {
    if (this._callbackFlushScheduled) {
      return
    }
    this._callbackFlushScheduled = true
    setTimeout(() => {
      this._callbackFlushScheduled = false
      this._flushCallbacksAsync()
    }, 0)
  }

  /**
   * 异步分批执行回调（不在 RAF 中执行）
   * 每批最多 _maxCallbacksPerAsyncBatch 个回调或 _asyncCallbackBudgetMs 毫秒，
   * 超出部分通过 setTimeout(0) 调度下一批
   * @private
   */
  _flushCallbacksAsync () {
    if (this._pendingCallbacks.length === 0) {
      return
    }

    const startedAt = performance.now()
    let executed = 0

    while (this._pendingCallbacks.length > 0 && executed < this._maxCallbacksPerAsyncBatch) {
      if (performance.now() - startedAt > this._asyncCallbackBudgetMs) {
        break
      }

      const entry = this._pendingCallbacks.shift()
      try {
        entry.fn()
      } catch (error) {
        console.error(`[BattleMutationBatcher] 异步回调执行失败 (${entry.type}):`, error)
      }
      executed++
    }

    // 如果还有剩余回调，调度下一批
    if (this._pendingCallbacks.length > 0) {
      this._scheduleCallbackFlush()
    }
  }

  /**
   * flush 怪物死亡处理（分批 + 时间预算控制）
   *
   * 每次最多处理 _maxDefeatedPerFlush 只怪物或耗时 _defeatedBudgetMs 毫秒，
   * 超出部分保留在队列中，由 flushNow 的 _markDirty 触发下一帧继续。
   * 这样避免 AOE 批量击杀时大量 Vue proxy 写入阻塞主线程。
   *
   * @private
   */
  _flushDefeated () {
    const startedAt = performance.now()
    let processed = 0

    while (this._pendingDefeated.length > 0 && processed < this._maxDefeatedPerFlush) {
      // 时间预算检查
      if (performance.now() - startedAt > this._defeatedBudgetMs) {
        break
      }

      const { index, monster } = this._pendingDefeated.shift()
      processed++

      try {
        if (!monster) {
          continue
        }

        // ★ 先获取 raw，所有读写都通过 raw 绕过 Vue proxy
        // 避免 isDefeated 读取、fadeTimer/hideTimer 读写触发 proxy get/set trap
        // 这是 842ms 阻塞的根因：每次 proxy set trap 都进入 Vue effect 队列
        const raw = toRaw(monster)

        if (raw.isDefeated) {
          continue
        }

        const now = Date.now()

        // 清除已有定时器（通过 raw 读取，避免 proxy get trap）
        if (raw.fadeTimer) {
          monsterTransitionBatcher.cancelFade(raw.fadeTimer)
          raw.fadeTimer = null
        }
        if (raw.hideTimer) {
          monsterTransitionBatcher.cancelHide(raw.hideTimer)
          raw.hideTimer = null
        }

        // 所有属性写入通过 raw，绕过 Vue proxy set trap
        raw.isDefeated = true
        raw.isFading = false
        raw.isHidden = false
        raw.defeatedAt = now
        raw.currentHealth = 0
        raw.healthPercentage = 0

        // ★ 批量过渡调度：通过 MonsterTransitionBatcher 按延迟分桶
        // timer 赋值也通过 raw，避免触发 Vue proxy set trap
        const staggerMs = Math.min(index * 20, 400)
        raw.fadeTimer = monsterTransitionBatcher.scheduleFade(monster, 1000 + staggerMs)
        raw.hideTimer = monsterTransitionBatcher.scheduleHide(monster, 2000 + staggerMs)
      } catch (error) {
        console.error('[BattleMutationBatcher] 死亡处理失败:', error, { index })
      }
    }
  }

  /**
   * flush vitals 更新到 monsters store（分批 + 时间预算控制）
   *
   * 传入 handleDefeated: false 以跳过 store 中的死亡处理逻辑（proxy 写入 + 定时器创建），
   * 因为死亡处理已由 _flushDefeated 统一负责，避免对同一只怪物做双重 proxy 写入。
   *
   * 每次最多提交 _maxVitalsPerFlush 条更新或耗时 _vitalsBudgetMs 毫秒，
   * 超出部分保留在队列中，由 flushNow 的 _markDirty 触发下一帧继续。
   *
   * @private
   */
  _flushVitals () {
    if (this._vitalsUpdates.length === 0) {
      return
    }

    const startedAt = performance.now()
    const maxPerFlush = Math.min(this._maxVitalsPerFlush, this._vitalsUpdates.length)

    // 取出本批次要处理的更新
    const updates = this._vitalsUpdates.splice(0, maxPerFlush)

    // 从去重 Map 中移除已取出的条目
    for (const update of updates) {
      this._vitalsUpdateMap.delete(update.index)
    }

    // 如果还有剩余但已超时，缩减本批次数量，保留剩余在队列中
    if (this._vitalsUpdates.length > 0 && performance.now() - startedAt > this._vitalsBudgetMs) {
      // 只处理前半部分，剩余的由 flushNow 的 _markDirty 触发下一帧处理
      const halfCount = Math.floor(updates.length / 2)
      if (halfCount > 0) {
        const deferred = updates.splice(halfCount)
        // 将 deferred 放回队列头部
        this._vitalsUpdates.unshift(...deferred)
        // 恢复去重 Map
        for (const update of deferred) {
          this._vitalsUpdateMap.set(update.index, update)
        }
      }
    }

    try {
      const store = useMonstersStore()
      if (store && typeof store.applyMonsterVitalsBatchUpdates === 'function') {
        // handleDefeated: false — 死亡处理由 _flushDefeated 负责，此处跳过避免重复
        store.applyMonsterVitalsBatchUpdates(updates, {
          updateProxies: false,
          handleDefeated: false
        })
      }
    } catch (error) {
      console.error('[BattleMutationBatcher] vitals flush 失败:', error)
    }
  }

  /**
   * flush 延迟回调（同步版，仅用于 flushNow 手动调用时）
   * 注意：RAF commit 阶段不调用此方法，回调通过 _scheduleCallbackFlush 异步执行
   * @private
   */
  _flushCallbacks () {
    const callbacks = this._pendingCallbacks
    this._pendingCallbacks = []

    const startedAt = performance.now()
    let executed = 0

    for (const entry of callbacks) {
      if (executed >= this._maxCallbacksPerFlush) {
        // 超过单次上限，剩余回调推迟
        this._pendingCallbacks = callbacks.slice(executed)
        break
      }
      if (performance.now() - startedAt > this._callbackBudgetMs) {
        // 超过时间预算，剩余回调推迟
        this._pendingCallbacks = callbacks.slice(executed)
        break
      }
      try {
        entry.fn()
      } catch (error) {
        console.error(`[BattleMutationBatcher] 回调执行失败 (${entry.type}):`, error)
      }
      executed++
    }

    // 如果还有剩余回调，异步调度
    if (this._pendingCallbacks.length > 0) {
      this._scheduleCallbackFlush()
    }
  }

  /**
   * 清空所有待处理数据（不执行 flush）
   * 用于战斗停止 / 重置时丢弃未提交的变更
   */
  clear () {
    this._vitalsUpdates = []
    this._vitalsUpdateMap.clear()
    this._pendingCallbacks = []
    this._pendingDefeated = []
    this._dirty = false
    this._callbackFlushScheduled = false
    this._defeatedFlushScheduled = false

    this._unregisterCommit()
  }

  /**
   * 获取批处理器统计信息
   * @returns {Object}
   */
  getStats () {
    return {
      pendingVitals: this._vitalsUpdates.length,
      pendingCallbacks: this._pendingCallbacks.length,
      pendingDefeated: this._pendingDefeated.length,
      isDirty: this._dirty,
      hasCommitRegistered: this._commitId !== null
    }
  }
}

/** 战斗变更批处理器单例 */
export const battleMutationBatcher = new BattleMutationBatcher()

export default battleMutationBatcher
