/**
 * 怪物淡出/隐藏过渡批处理器
 *
 * 核心设计思想：
 * - 替代为每只怪物创建独立 setTimeout 的做法
 * - 按延迟时间分桶（bucket），每个桶用一个 setTimeout 统一处理
 * - 桶回调内使用 toRaw() 绕过 Vue proxy，直接写入原始对象
 * - 写入完成后调用 triggerRef 通知 Vue 进行一次批量更新
 *
 * 问题根因（v2.1036 残留）：
 *   即使分批 10 只怪物，每次 monster.isFading = true 仍触发 Vue proxy set trap，
 *   每次设置都进入 Vue 的 effect 队列，导致 263ms/392ms 阻塞。
 *   递归 setTimeout(0) 被浏览器合并到同一 task 中执行。
 *
 * 解决方案：
 *   1. 使用 toRaw() 获取原始对象，直接设置属性，绕过 Vue 响应式 set trap
 *   2. 写入完成后不触发任何响应式更新（Canvas-First 架构下 isFading/isHidden
 *      由 Canvas 每帧直接从原始对象读取，不依赖 Vue proxy 重渲染）
 *   3. 单次回调最多处理 3 只怪物，剩余通过 setTimeout(0) 调度
 *
 * @file MonsterTransitionBatcher.js
 * @generated 2026-07-12
 */

import { toRaw } from 'vue'

/**
 * 延迟分桶粒度（毫秒）
 * stagger 0-400ms 会被分到 5 个桶：0ms, 100ms, 200ms, 300ms, 400ms
 */
const BUCKET_GRANULARITY_MS = 100

/**
 * 单次桶回调最多处理的怪物数量
 * 使用 toRaw 绕过 proxy 后，单次处理成本极低，但仍限制数量避免极端情况
 */
const MAX_MONSTERS_PER_BUCKET_CALLBACK = 3

/**
 * 怪物过渡批处理器单例
 *
 * 使用方式：
 * ```js
 * import { monsterTransitionBatcher } from './MonsterTransitionBatcher'
 *
 * // 替代 monster.fadeTimer = setTimeout(() => { monster.isFading = true }, 1000 + stagger)
 * monster.fadeTimer = monsterTransitionBatcher.scheduleFade(monster, 1000 + staggerMs)
 *
 * // 替代 monster.hideTimer = setTimeout(() => { monster.isHidden = true }, 2000 + stagger)
 * monster.hideTimer = monsterTransitionBatcher.scheduleHide(monster, 2000 + staggerMs)
 * ```
 */
class MonsterTransitionBatcher {
  constructor () {
    /** @type {Map<number, {monsters: Array, timerId: number|null}>} fade 桶（key=延迟毫秒） */
    this._fadeBuckets = new Map()

    /** @type {Map<number, {monsters: Array, timerId: number|null}>} hide 桶（key=延迟毫秒） */
    this._hideBuckets = new Map()
  }

  /**
   * 将延迟时间对齐到桶粒度
   * @param {number} delayMs - 原始延迟（毫秒）
   * @returns {number} 对齐后的延迟
   * @private
   */
  _alignToBucket (delayMs) {
    return Math.round(delayMs / BUCKET_GRANULARITY_MS) * BUCKET_GRANULARITY_MS
  }

  /**
   * 调度怪物淡出过渡
   *
   * 将怪物加入对应延迟桶，由桶的 setTimeout 统一触发 isFading = true。
   * 返回一个伪 timer ID（对象引用），可用于 cancelFade。
   *
   * @param {Object} monster - 怪物对象（Vue proxy）
   * @param {number} delayMs - 延迟毫秒（会被对齐到桶粒度）
   * @returns {Object} 桶条目引用，用于取消
   */
  scheduleFade (monster, delayMs) {
    if (!monster) {
      return null
    }

    const bucketDelay = this._alignToBucket(delayMs)
    let bucket = this._fadeBuckets.get(bucketDelay)

    if (!bucket) {
      bucket = { monsters: [], timerId: null }
      this._fadeBuckets.set(bucketDelay, bucket)
    }

    bucket.monsters.push(monster)

    // 如果桶还没有定时器，创建一个
    if (bucket.timerId === null) {
      bucket.timerId = setTimeout(() => {
        this._processFadeBucket(bucketDelay)
      }, bucketDelay)
    }

    // 返回一个引用，用于取消（包含桶延迟和怪物引用）
    return { bucketDelay, monster, type: 'fade' }
  }

  /**
   * 调度怪物隐藏过渡
   *
   * 将怪物加入对应延迟桶，由桶的 setTimeout 统一触发 isHidden = true。
   *
   * @param {Object} monster - 怪物对象（Vue proxy）
   * @param {number} delayMs - 延迟毫秒（会被对齐到桶粒度）
   * @returns {Object} 桶条目引用，用于取消
   */
  scheduleHide (monster, delayMs) {
    if (!monster) {
      return null
    }

    const bucketDelay = this._alignToBucket(delayMs)
    let bucket = this._hideBuckets.get(bucketDelay)

    if (!bucket) {
      bucket = { monsters: [], timerId: null }
      this._hideBuckets.set(bucketDelay, bucket)
    }

    bucket.monsters.push(monster)

    if (bucket.timerId === null) {
      bucket.timerId = setTimeout(() => {
        this._processHideBucket(bucketDelay)
      }, bucketDelay)
    }

    return { bucketDelay, monster, type: 'hide' }
  }

  /**
   * 处理 fade 桶：批量设置 isFading = true
   *
   * 使用 toRaw() 绕过 Vue proxy，直接写入原始对象属性，
   * 避免触发 Vue 响应式 set trap 和 effect 队列。
   * Canvas-First 架构下，Canvas 每帧直接从原始对象读取 isFading 状态，
   * 不依赖 Vue proxy 重渲染来反映视觉变化。
   *
   * 如果桶内怪物数量超过 MAX_MONSTERS_PER_BUCKET_CALLBACK，
   * 只处理前 MAX_MONSTERS_PER_BUCKET_CALLBACK 个，
   * 剩余通过 setTimeout(0) 调度下一批。
   *
   * @param {number} bucketDelay - 桶延迟
   * @private
   */
  _processFadeBucket (bucketDelay) {
    const bucket = this._fadeBuckets.get(bucketDelay)
    if (!bucket) {
      return
    }

    bucket.timerId = null

    const batch = bucket.monsters.splice(0, MAX_MONSTERS_PER_BUCKET_CALLBACK)

    // 如果桶已空，删除桶条目
    if (bucket.monsters.length === 0) {
      this._fadeBuckets.delete(bucketDelay)
    }

    for (let i = 0; i < batch.length; i++) {
      const monster = batch[i]
      try {
        if (monster && monster.currentHealth <= 0) {
          // ★ 使用 toRaw 绕过 Vue proxy，直接写入原始对象
          // 避免每次 set 触发 Vue effect 队列，这是 263ms 阻塞的根因
          const raw = toRaw(monster)
          raw.isFading = true
          raw.fadeTimer = null
        }
      } catch (error) {
        console.error('[MonsterTransitionBatcher] fade 处理失败:', error)
      }
    }

    // 如果还有剩余怪物，调度下一批
    if (bucket.monsters.length > 0) {
      setTimeout(() => {
        this._processFadeBucket(bucketDelay)
      }, 0)
    }
  }

  /**
   * 处理 hide 桶：批量设置 isHidden = true, isFading = false
   *
   * 使用 toRaw() 绕过 Vue proxy，直接写入原始对象属性。
   *
   * @param {number} bucketDelay - 桶延迟
   * @private
   */
  _processHideBucket (bucketDelay) {
    const bucket = this._hideBuckets.get(bucketDelay)
    if (!bucket) {
      return
    }

    bucket.timerId = null

    const batch = bucket.monsters.splice(0, MAX_MONSTERS_PER_BUCKET_CALLBACK)

    if (bucket.monsters.length === 0) {
      this._hideBuckets.delete(bucketDelay)
    }

    for (let i = 0; i < batch.length; i++) {
      const monster = batch[i]
      try {
        if (monster && monster.currentHealth <= 0) {
          // ★ 使用 toRaw 绕过 Vue proxy，直接写入原始对象
          const raw = toRaw(monster)
          raw.isHidden = true
          raw.isFading = false
          raw.hideTimer = null
        }
      } catch (error) {
        console.error('[MonsterTransitionBatcher] hide 处理失败:', error)
      }
    }

    // 如果还有剩余怪物，调度下一批
    if (bucket.monsters.length > 0) {
      setTimeout(() => {
        this._processHideBucket(bucketDelay)
      }, 0)
    }
  }

  /**
   * 取消 fade 调度
   * @param {Object} handle - scheduleFade 返回的引用
   */
  cancelFade (handle) {
    if (!handle || handle.type !== 'fade') {
      return
    }

    const bucket = this._fadeBuckets.get(handle.bucketDelay)
    if (!bucket) {
      return
    }

    const idx = bucket.monsters.indexOf(handle.monster)
    if (idx >= 0) {
      bucket.monsters.splice(idx, 1)
    }

    // 如果桶空了，清除定时器
    if (bucket.monsters.length === 0 && bucket.timerId !== null) {
      clearTimeout(bucket.timerId)
      bucket.timerId = null
      this._fadeBuckets.delete(handle.bucketDelay)
    }
  }

  /**
   * 取消 hide 调度
   * @param {Object} handle - scheduleHide 返回的引用
   */
  cancelHide (handle) {
    if (!handle || handle.type !== 'hide') {
      return
    }

    const bucket = this._hideBuckets.get(handle.bucketDelay)
    if (!bucket) {
      return
    }

    const idx = bucket.monsters.indexOf(handle.monster)
    if (idx >= 0) {
      bucket.monsters.splice(idx, 1)
    }

    if (bucket.monsters.length === 0 && bucket.timerId !== null) {
      clearTimeout(bucket.timerId)
      bucket.timerId = null
      this._hideBuckets.delete(handle.bucketDelay)
    }
  }

  /**
   * 清除所有待处理的过渡调度
   * 用于战斗停止/重置时
   */
  clear () {
    for (const [, bucket] of this._fadeBuckets) {
      if (bucket.timerId !== null) {
        clearTimeout(bucket.timerId)
      }
    }
    for (const [, bucket] of this._hideBuckets) {
      if (bucket.timerId !== null) {
        clearTimeout(bucket.timerId)
      }
    }
    this._fadeBuckets.clear()
    this._hideBuckets.clear()
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats () {
    let fadeMonsters = 0
    let hideMonsters = 0

    for (const [, bucket] of this._fadeBuckets) {
      fadeMonsters += bucket.monsters.length
    }
    for (const [, bucket] of this._hideBuckets) {
      hideMonsters += bucket.monsters.length
    }

    return {
      fadeBuckets: this._fadeBuckets.size,
      hideBuckets: this._hideBuckets.size,
      fadeMonsters,
      hideMonsters
    }
  }
}

/** 怪物过渡批处理器单例 */
export const monsterTransitionBatcher = new MonsterTransitionBatcher()

export default monsterTransitionBatcher
