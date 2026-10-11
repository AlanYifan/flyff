/**
 * DOT 效果统一调度器（重构版 — 异步分块）
 *
 * 重构要点：
 * - 不再使用 requestAnimationFrame 调度（改用 setTimeout，消除 RAF 违规）
 * - 不再直接写入 Vue 代理（通过 BattleMutationBatcher 批量提交）
 * - 回调延迟到 unifiedScheduler 的 commit 阶段执行
 * - processTicks / applyTickBatch 改为 async，分块 yield 让出主线程
 * - ★ 入口处立即 yield，消除 async 函数"同步前段"导致的伪异步阻塞
 * - ★ 小步长分块（COLLECT=5, APPLY=4），单次处理不超过 8ms 时间预算
 *
 * 数据流：
 *   setTimeout 回调 → processTicks (async) → applyTickBatch (async)
 *     ├→ 每处理 COLLECT_CHUNK_SIZE 个怪物后 yield
 *     ├→ applyTickBatch 每处理 APPLY_CHUNK_SIZE 个怪物后 yield
 *     └→ battleMutationBatcher.queueVitalsUpdate / queueCallback
 *
 * 内存优化：音效播放通过 playSFX 回调委托给 AudioService，
 * 避免每次 tick 创建 new Audio() 对象导致内存泄漏。
 *
 * @file DotTickScheduler.js
 * @generated 2026-07-12
 */

import { battlePerfMonitor } from '@/utils/performanceMonitor'
import { applyLifeSteal } from '@/utils/lifeStealHelper'
import { weaponSkillTriggerService } from '@/services/WeaponSkillTriggerService'
import { battleMutationBatcher } from './BattleMutationBatcher'

const debug = () => {}

/** DOT 收集阶段：每处理 N 个怪物后 yield 让出主线程（小步长，确保单帧不超过 8ms） */
const COLLECT_CHUNK_SIZE = 5

/** DOT 伤害应用阶段：每处理 N 个怪物后 yield 让出主线程（含吸血/武器技能触发等重逻辑） */
const APPLY_CHUNK_SIZE = 4

/**
 * 让出主线程到下一个宏任务
 * @returns {Promise<void>}
 */
function yieldToMacrotask () {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * DOT 效果统一调度器类
 * 优化要点：
 * 1. 单一 setTimeout 循环调度
 * 2. 批量收集和处理 DOT tick
 * 3. 同一怪物多 DOT 伤害合并
 * 4. 批量 UI 更新
 * 5. processTicks / applyTickBatch 异步分块，每块之间 yield 让出主线程
 */
export class DotTickScheduler {
  constructor () {
    /** @type {Map<string, Array>} 活跃的 DOT 效果，按怪物 ID 分组 */
    this.activeDots = new Map()

    /** @type {number|null} 调度的 setTimeout ID */
    this.scheduledRaf = null

    /** @type {number} 上次 tick 检查时间 */
    this.lastTickTime = 0

    /** @type {number} tick 检查间隔（毫秒） */
    this.tickInterval = 100

    /** @type {Function|null} 伤害应用回调 */
    this.onDamageApplied = null

    /** @type {Function|null} 怪物死亡回调 */
    this.onMonsterDefeated = null

    /** @type {Function|null} 玩家治疗回调（吸血等） */
    this.onPlayerHeal = null

    /** @type {Object|null} 玩家引用（用于 PVE 伤害加成等） */
    this.player = null

    /** @type {Function|null} 获取怪物引用的回调 */
    this.getMonsterById = null

    /** @type {boolean} 是否正在运行 */
    this.isRunning = false

    /** @type {Map<string, Object>} 怪物引用缓存 */
    this.monsterCache = new Map()

    /** @type {number} 调度器版本号，用于重置 */
    this.version = 0

    /** @type {number} 每个怪物最多 DOT 数量限制 */
    this.maxDotsPerMonster = 5

    /** @type {number} 全局最大 DOT 数量限制 */
    this.maxTotalDots = 80

    /** @type {Array} 待处理的 tick 结果队列 */
    this.pendingTickResults = []

    /** @type {boolean} 是否有待处理的 tick */
    this.hasPendingTicks = false

    /** @type {number} 批量处理的最大数量 */
    this.batchSize = 50

    /** @type {number} 上次孤儿DOT清理时间戳，用于限频 */
    this.lastOrphanCleanupAt = 0

    /** @type {number} 单次 tick 处理的最大时间预算（毫秒） */
    this.tickTimeBudget = 8

    /** @type {boolean} 是否正在处理中 */
    this.isProcessing = false

    /** @type {Function|null} 音效播放回调（由 AudioService 提供，避免 new Audio 泄漏） */
    this.playSFX = null

    /** @type {Object<string, number>} DOT特效派发冷却时间戳，按技能ID记录上次派发时间，避免同一DOT间隔内重复触发动画 */
    this.dotEffectLastDispatch = {}
  }

  /**
   * 检查DOT特效是否可以派发（基于冷却时间戳去重）
   * 同一技能ID的DOT特效在单个tickInterval周期内只允许派发一次
   * 解决processTicks被setTimeout(0)高频调用时，不同怪物DOT在不同调用中到期导致的重复派发问题
   * @param {string} skillId - 技能ID，用作冷却key
   * @param {number} tickInterval - DOT的tick间隔（秒）
   * @param {number} now - 当前时间戳（毫秒）
   * @returns {boolean} 是否允许派发
   */
  canDispatchDotEffect (skillId, tickInterval, now) {
    const lastDispatch = this.dotEffectLastDispatch[skillId]
    if (lastDispatch === undefined) {
      return true
    }
    // 冷却时间 = DOT间隔（秒）× 1000毫秒，最小500ms防止过短间隔
    const cooldownMs = Math.max(500, tickInterval * 1000)
    return (now - lastDispatch) >= cooldownMs
  }

  /**
   * 初始化调度器
   * @param {Object} options - 配置选项
   * @param {Function} [options.onDamageApplied] - 伤害应用回调
   * @param {Function} [options.onMonsterDefeated] - 怪物死亡回调
   * @param {Function} [options.onPlayerHeal] - 玩家治疗回调（吸血等）
   * @param {Function} [options.getMonsterById] - 获取怪物引用的回调
   * @param {number} [options.tickInterval] - tick 检查间隔
   */
  initialize (options = {}) {
    this.onDamageApplied = typeof options.onDamageApplied === 'function' ? options.onDamageApplied : null
    this.onMonsterDefeated = typeof options.onMonsterDefeated === 'function' ? options.onMonsterDefeated : null
    this.onPlayerHeal = typeof options.onPlayerHeal === 'function' ? options.onPlayerHeal : null
    this.getMonsterById = typeof options.getMonsterById === 'function' ? options.getMonsterById : null
    this.playSFX = typeof options.playSFX === 'function' ? options.playSFX : null
    this.player = options.player || null

    if (Number.isFinite(options.tickInterval) && options.tickInterval > 0) {
      this.tickInterval = Math.max(50, Math.min(500, options.tickInterval))
    }

    this.version++
    this.isRunning = false
    this.activeDots.clear()
    this.monsterCache.clear()
    this.pendingTickResults = []
    this.hasPendingTicks = false

  }

  /**
   * 注册 DOT 效果
   * @param {string|number} monsterId - 怪物唯一标识
   * @param {Object} dotEffect - DOT 效果配置
   * @param {string} [dotEffect.name] - DOT 名称
   * @param {number} dotEffect.damage - 每次tick的伤害
   * @param {number} dotEffect.tickInterval - tick间隔（秒）
   * @param {number} dotEffect.ticksRemaining - 剩余tick次数
   * @param {Object} dotEffect.skill - 技能引用
   * @param {string} [dotEffect.icon] - 图标
   * @param {Object} [dotEffect.monster] - 怪物引用（直接存储，避免回调查找失败）
   * @returns {boolean} 是否注册成功
   */
  register (monsterId, dotEffect) {
    const key = this.normalizeMonsterId(monsterId)
    if (!key) {
      return false
    }

    if (!dotEffect || typeof dotEffect !== 'object') {
      return false
    }

    const damage = Number(dotEffect.damage)
    const tickInterval = Number(dotEffect.tickInterval)
    const ticksRemaining = Number(dotEffect.ticksRemaining)

    if (!Number.isFinite(damage) || damage <= 0) {
      return false
    }
    if (!Number.isFinite(tickInterval) || tickInterval <= 0) {
      return false
    }
    if (!Number.isFinite(ticksRemaining) || ticksRemaining <= 0) {
      return false
    }

    if (!this.activeDots.has(key)) {
      this.activeDots.set(key, [])
    }

    const dots = this.activeDots.get(key)

    // 计算当前总 DOT 数量
    let totalDots = 0
    for (const d of this.activeDots.values()) {
      totalDots += d.length
    }

    // 全局 DOT 数量限制检查
    if (totalDots >= this.maxTotalDots) {
      // 移除最早注册的 DOT（全局范围内）
      this.removeOldestDot()
    }

    // 限制每个怪物的 DOT 数量
    if (dots.length >= this.maxDotsPerMonster) {
      // 移除最早的一个 DOT
      const removed = dots.shift()
      if (removed?.timerId !== undefined && removed.timerId !== null) {
        clearTimeout(removed.timerId)
      }
    }

    const now = Date.now()
    const dotEntry = {
      id: `${key}_${now}_${Math.random().toString(16).slice(2, 8)}`,
      name: dotEffect.name || 'DOT',
      damage: Math.max(1, Math.floor(damage)),
      tickInterval: Math.max(0.5, tickInterval),
      nextTickTime: now + tickInterval * 1000,
      ticksRemaining: Math.max(1, Math.floor(ticksRemaining)),
      skill: dotEffect.skill || null,
      icon: dotEffect.icon || '',
      monster: dotEffect.monster || null, // 直接存储怪物引用
      canCrit: Boolean(dotEffect.canCrit), // DOT是否可以暴击
      registeredAt: now,
      version: this.version
    }

    dots.push(dotEntry)

    // 启动调度器
    this.start()

    return true
  }

  /**
   * 更新玩家引用（当玩家对象被替换时调用）
   * 暴击判定依赖 this.player.criticalRate 和 this.player.criticalDamage，
   * 若不同步更新，DOT 暴击将使用过期的玩家属性，导致暴击永远不触发
   * @param {Object} player - 新的玩家对象
   */
  updatePlayer (player) {
    this.player = player || null
  }

  /**
   * 标准化怪物 ID
   * @param {string|number} monsterId
   * @returns {string|null}
   */
  normalizeMonsterId (monsterId) {
    if (monsterId === null || monsterId === undefined) {
      return null
    }
    if (typeof monsterId === 'number') {
      return String(monsterId)
    }
    if (typeof monsterId === 'string' && monsterId.trim()) {
      return monsterId.trim()
    }
    return null
  }

  /**
   * 启动调度器
   */
  start () {
    if (this.isRunning) {
      return
    }
    this.isRunning = true
    this.lastTickTime = Date.now()
    this.scheduleTick()
    debug('调度器启动, activeDots:', this.activeDots.size)
  }

  /**
   * 停止调度器
   */
  stop () {
    this.isRunning = false
    if (this.scheduledRaf !== null) {
      // 清理 setTimeout 调度
      clearTimeout(this.scheduledRaf)
      this.scheduledRaf = null
    }
    // 重置DOT特效冷却记录
    this.dotEffectLastDispatch = {}
  }

  /**
   * 调度下一次 tick 检查
   * 使用 setTimeout 调度，回调内异步调用 processTicks
   * setTimeout 回调在遇到第一个 await 时立即返回，Chrome 不再将其计为长任务
   */
  scheduleTick () {
    if (!this.isRunning) {
      return
    }

    if (this.scheduledRaf !== null) {
      return
    }

    this.scheduledRaf = setTimeout(() => {
      this.scheduledRaf = null
      // 异步调用 processTicks，不阻塞 setTimeout 回调
      this.processTicksAsync()
    }, 0)
  }

  /**
   * 异步执行 processTicks 的包装器
   * fire-and-forget：不等待完成，确保 setTimeout 回调立即返回
   */
  processTicksAsync () {
    this.processTicks().catch(error => {
      console.error('[DotTickScheduler] processTicks 异步执行失败:', error)
      this.isProcessing = false
    })
  }

  /**
   * 处理所有到期的 DOT tick（异步分块版）
   *
   * 重构要点：
   * - 改为 async，每处理 COLLECT_CHUNK_SIZE 个怪物后 yield 让出主线程
   * - yield 后重新检查 isRunning，防止停止后继续处理
   * - applyTickBatch 也改为 async，内部分块 yield
   */
  async processTicks () {
    if (!this.isRunning || this.isProcessing) {
      return
    }

    this.isProcessing = true

    // ★ 关键：入口处立即 yield，确保 setTimeout 回调在此处返回
    // async 函数在第一个 await 之前是同步执行的，
    // 不先 yield 的话前 N 个怪物的处理仍会阻塞 setTimeout 回调
    await yieldToMacrotask()
    if (!this.isRunning) {
      this.isProcessing = false
      return
    }

    const processStartTime = performance.now()
    const now = Date.now()
    const tickBatch = []

    // 使用迭代器遍历，支持中断恢复
    const entries = Array.from(this.activeDots.entries())

    for (let i = 0; i < entries.length; i++) {
      // === YIELD: 每处理 COLLECT_CHUNK_SIZE 个怪物后让出主线程 ===
      // 确保 DOT 收集阶段不会长时间阻塞事件循环
      if (i > 0 && i % COLLECT_CHUNK_SIZE === 0) {
        // 先应用已收集的批次，避免 yield 期间数据不一致
        if (tickBatch.length > 0) {
          await this.applyTickBatch(tickBatch)
          tickBatch.length = 0
        }
        await yieldToMacrotask()
        // yield 后重新检查运行状态
        if (!this.isRunning) {
          this.isProcessing = false
          return
        }
      }

      // 时间切片检查：如果处理时间超过预算，立即让出
      const elapsed = performance.now() - processStartTime
      if (elapsed > this.tickTimeBudget && tickBatch.length > 0) {
        await this.applyTickBatch(tickBatch)
        tickBatch.length = 0
        this.isProcessing = false
        this.scheduleTick()
        return
      }

      const [monsterId, dots] = entries[i]
      // 优先使用 DOT 条目中存储的怪物引用，否则回退到 resolveMonster
      let monster = null
      if (dots.length > 0 && dots[0].monster) {
        monster = dots[0].monster
      } else {
        monster = this.resolveMonster(monsterId)
      }

      // 检查怪物是否有效
      if (!monster || monster.currentHealth <= 0 || monster.isDefeated) {
        this.activeDots.delete(monsterId)
        this.monsterCache.delete(monsterId)
        continue
      }

      const activeDots = []

      for (const dot of dots) {
        // 检查版本是否过期
        if (dot.version !== this.version) {
          continue
        }

        // 检查是否还有剩余 tick
        if (dot.ticksRemaining <= 0) {
          continue
        }

        // 检查是否到期 tick
        if (now >= dot.nextTickTime) {
          // 使用存储的怪物引用或当前怪物
          const dotMonster = dot.monster || monster

          // 暴击判定：canCrit为true时使用玩家暴击率判定
          let isCrit = false
          let tickDamage = dot.damage
          if (dot.canCrit && this.player) {
            const critRate = Number(this.player.criticalRate) || 0
            // criticalRate 以小数形式存储（1.0 = 100%），超过1.0表示100%+暴击率
            // 使用 Math.min(1, critRate) 截断为100%，保证>=100%暴击率时必定暴击
            const critChance = Math.min(1, critRate)
            isCrit = Math.random() < critChance
            if (isCrit) {
              // 暴击伤害倍率（criticalDamage 为小数形式，如 1.5 = 150%）
              const multiplier = Number(this.player.criticalDamage) || 1.5
              tickDamage = Math.max(1, Math.floor(dot.damage * multiplier))
            }
          }

          tickBatch.push({
            monsterId,
            monster: dotMonster,
            damage: tickDamage,
            baseDamage: dot.damage,
            skill: dot.skill,
            dotName: dot.name,
            dotId: dot.id,
            canCrit: dot.canCrit,
            isCrit
          })

          // 箭雨DOT tick时：派发箭雨特效事件 + 播放音效
          // 基于DOT间隔冷却去重，同一间隔内只派发一次
          if (dot.skill?.id === 'archer_e' && this.canDispatchDotEffect('archer_e', dot.tickInterval, now)) {
            this.dotEffectLastDispatch['archer_e'] = now
            try {
              window.dispatchEvent(new CustomEvent('skill-arrow-rain'))
            } catch (e) {
              // 忽略事件派发失败
            }
            // 播放箭雨技能音效（通过回调委托给 AudioService，避免 new Audio 泄漏）
            this.playDotSkillAudio(dot.skill)
          }

          // 神圣领域DOT tick时：派发神圣领域十字效果特效事件
          // DOT触发时仅显示十字效果阶段动画，不播放完整的神圣领域动画
          // 基于DOT间隔冷却去重，同一间隔内只派发一次
          if (dot.skill?.id === 'guardian_q' && this.canDispatchDotEffect('guardian_q', dot.tickInterval, now)) {
            this.dotEffectLastDispatch['guardian_q'] = now
            try {
              window.dispatchEvent(new CustomEvent('mage-skill-effect', {
                detail: { effectType: 'divine_domain_cross', targetIndex: 0, isAOE: true }
              }))
            } catch (e) {
              // 忽略事件派发失败
            }
          }

          // 月光惩戒DOT tick时：派发月光惩戒特效事件
          // 基于DOT间隔冷却去重，同一间隔内只派发一次
          if (dot.skill?.id === 'priest_q' && this.canDispatchDotEffect('priest_q', dot.tickInterval, now)) {
            this.dotEffectLastDispatch['priest_q'] = now
            try {
              window.dispatchEvent(new CustomEvent('mage-skill-effect', {
                detail: { effectType: 'moonlight_punishment', targetIndex: Number(monsterId) || 0, isAOE: false }
              }))
            } catch (e) {
              // 忽略事件派发失败
            }
          }

          // 毒箭DOT tick时：派发毒箭特效事件 + 播放技能音效
          // 基于DOT间隔冷却去重，同一间隔内只派发一次
          if (dot.skill?.id === 'ranger_t' && this.canDispatchDotEffect('ranger_t', dot.tickInterval, now)) {
            this.dotEffectLastDispatch['ranger_t'] = now
            try {
              window.dispatchEvent(new CustomEvent('mage-skill-effect', {
                detail: { effectType: 'poison_arrow', targetIndex: 0, isAOE: true }
              }))
            } catch (e) {
              // 忽略事件派发失败
            }
            // 播放毒箭技能音效（通过回调委托给 AudioService，避免 new Audio 泄漏）
            this.playDotSkillAudio(dot.skill)
          }

          // 通用暴击音效：所有可暴击DOT（箭雨、毒箭等）暴击时统一播放 PcDmgSwdC.wav
          // 通过回调委托给 AudioService，避免 new Audio 泄漏
          if (isCrit) {
            this.playDotSFX('PcDmgSwdC.wav', 0.4)
          }

          dot.ticksRemaining--
          dot.nextTickTime = now + dot.tickInterval * 1000
        }

        // 保留活跃的 DOT
        if (dot.ticksRemaining > 0) {
          activeDots.push(dot)
        }
      }

      // 更新或删除 DOT 列表
      if (activeDots.length > 0) {
        this.activeDots.set(monsterId, activeDots)
      } else {
        this.activeDots.delete(monsterId)
      }
    }

    // 批量应用 tick 伤害（异步分块）
    if (tickBatch.length > 0) {
      await this.applyTickBatch(tickBatch)
    }

    this.isProcessing = false

    // 定期清理孤儿DOT引用（每60秒一次），防止已击败怪物的DOT残留
    const nowForCleanup = Date.now()
    if (nowForCleanup - this.lastOrphanCleanupAt >= 60000) {
      this.lastOrphanCleanupAt = nowForCleanup
      this.cleanupOrphanDots()
    }

    // 继续调度
    if (this.activeDots.size > 0 && this.isRunning) {
      // 使用 setTimeout 间隔调度，避免持续占用
      setTimeout(() => {
        if (this.isRunning) {
          this.scheduleTick()
        }
      }, this.tickInterval)
    } else {
      this.isRunning = false
    }
  }

  /**
   * 解析怪物引用
   * @param {string} monsterId
   * @returns {Object|null}
   */
  resolveMonster (monsterId) {
    // 先检查缓存
    const cached = this.monsterCache.get(monsterId)
    if (cached && cached.currentHealth > 0 && !cached.isDefeated) {
      return cached
    }

    // 通过回调获取
    if (typeof this.getMonsterById === 'function') {
      try {
        const monster = this.getMonsterById(monsterId)
        if (monster) {
          this.monsterCache.set(monsterId, monster)
          return monster
        }
      } catch (error) {
        console.error('[DotTickScheduler] 获取怪物引用失败:', error)
      }
    }

    return null
  }

  /**
   * 批量应用 DOT tick 伤害（异步分块版）
   *
   * 重构要点：
   * - 改为 async，每处理 APPLY_CHUNK_SIZE 个怪物后 yield 让出主线程
   * - 不再直接写入 Vue 代理（monster.currentHealth = ...）
   * - 所有怪物 vitals 变更通过 battleMutationBatcher 队列化
   * - 所有回调通过 battleMutationBatcher 延迟执行
   * - 在 unifiedScheduler 的 commit 阶段统一 flush
   *
   * @param {Array} tickBatch - tick 结果数组
   */
  async applyTickBatch (tickBatch) {
    // ★ 入口处立即 yield，确保调用方的 setTimeout 回调不会因 applyTickBatch 的同步部分而阻塞
    await yieldToMacrotask()

    const tickStartTime = performance.now()

    // 按怪物分组，合并伤害
    const damageByMonster = new Map()

    for (const tick of tickBatch) {
      const existing = damageByMonster.get(tick.monsterId)
      if (!existing) {
        damageByMonster.set(tick.monsterId, {
          monster: tick.monster,
          totalDamage: tick.damage,
          dots: [tick]
        })
      } else {
        existing.totalDamage += tick.damage
        existing.dots.push(tick)
      }
    }

    // 应用合并后的伤害（分块处理）
    const monsterEntries = Array.from(damageByMonster.entries())
    for (let mi = 0; mi < monsterEntries.length; mi++) {
      // === YIELD: 每处理 APPLY_CHUNK_SIZE 个怪物后让出主线程 ===
      if (mi > 0 && mi % APPLY_CHUNK_SIZE === 0) {
        await yieldToMacrotask()
      }

      const [monsterId, data] = monsterEntries[mi]
      const { monster, totalDamage, dots } = data

      // 应用碎甲DEBUFF效果（承受伤害增加）
      let finalDamage = totalDamage
      const armorBreakDebuff = monster?.armorBreakDebuff
      if (armorBreakDebuff?.active && armorBreakDebuff?.expiresAt > Date.now()) {
        const damageIncrease = Number(armorBreakDebuff.damageIncrease ?? 0)
        if (Number.isFinite(damageIncrease) && damageIncrease > 0) {
          finalDamage = Math.floor(totalDamage * (1 + damageIncrease / 100))
        }
      }

      // 应用 PVE 伤害加成（增加对怪物的最终伤害）
      const pveDamage = Number(this.player?.pveDamage) || 0
      if (pveDamage > 0) {
        finalDamage = Math.floor(finalDamage * (1 + pveDamage / 100))
      }

      // 计算新血量（不直接写入 Vue 代理）
      const currentHealth = Number(monster.currentHealth) || 0
      const maxHealth = Number(monster.maxHealth) || 1
      const nextHealth = Math.max(0, currentHealth - finalDamage)
      const nextHealthPercentage = Math.max(0, Math.min(100, (nextHealth / maxHealth) * 100))

      // 通过批处理器队列化 vitals 更新（不写 Vue 代理）
      const monsterIndex = Number.isFinite(Number(monster.index)) ? Number(monster.index) : -1
      if (monsterIndex >= 0) {
        battleMutationBatcher.queueVitalsUpdate(monsterIndex, {
          currentHealth: nextHealth,
          healthPercentage: nextHealthPercentage
        })
      } else {
        // 回退：如果没有 index，直接写入（兼容旧逻辑）
        monster.currentHealth = nextHealth
        monster.healthPercentage = nextHealthPercentage
      }

      // 吸血效果：DOT伤害也能触发吸血（写入玩家对象，不是怪物）
      if (this.player && finalDamage > 0) {
        applyLifeSteal(this.player, finalDamage, {
          addBattleLog: this.addBattleLog,
          onPlayerHeal: this.onPlayerHeal
        })
      }

      // 触发武器附加技能（水弹等）
      if (this.player && nextHealth > 0) {
        try {
          const weapon = this.player?.equipment?.weapon
          if (weapon) {
            weaponSkillTriggerService.triggerWeaponSkill({
              player: this.player,
              monster,
              monsterIndex: null,
              weapon,
              triggerType: 'dot',
              showDamageNumber: null,
              addBattleLog: this.addBattleLog
            })
          }
        } catch (error) {
          console.error('[DotTickScheduler] DOT触发武器技能失败:', error)
        }
      }

      // 通过批处理器队列化伤害回调（延迟到 commit 阶段执行）
      if (this.onDamageApplied) {
        battleMutationBatcher.queueCallback(() => {
          if (this.onDamageApplied) {
            this.onDamageApplied({
              monsterId,
              monster,
              totalDamage: finalDamage,
              dots,
              isDot: true,
              timestamp: Date.now()
            })
          }
        }, 'dotDamage')
      }

      // 检查死亡 — 通过批处理器队列化
      if (nextHealth <= 0 && !monster.isDefeated) {
        if (monsterIndex >= 0) {
          battleMutationBatcher.queueDefeated(monsterIndex, monster)
        }

        if (this.onMonsterDefeated) {
          // 通过 setTimeout(0) 调度，避免 onMonsterDefeated 触发的微任务在当前 RAF 帧内执行
          battleMutationBatcher.queueDeferredCallback(() => {
            if (this.onMonsterDefeated) {
              this.onMonsterDefeated({
                monsterId,
                monster,
                killedByDot: true,
                dots
              })
            }
          }, 'dotDefeated')
        }

        // 清除该怪物的所有 DOT
        this.activeDots.delete(monsterId)
        this.monsterCache.delete(monsterId)
      }
    }

    // 性能监控记录
    const tickTime = performance.now() - tickStartTime
    let totalActiveDots = 0
    for (const dots of this.activeDots.values()) {
      totalActiveDots += dots.length
    }
    battlePerfMonitor.recordDotEvent({
      activeDots: totalActiveDots,
      tickBatchSize: tickBatch.length,
      tickTime
    })
  }

  /**
   * 通过回调播放技能音效，避免直接 new Audio() 导致内存泄漏
   * @param {Object} skill - 技能对象（包含 audio 字段）
   * @returns {void}
   */
  playDotSkillAudio (skill) {
    if (!this.playSFX || !skill?.audio) {
      return
    }
    try {
      const audioList = Array.isArray(skill.audio) ? skill.audio : [skill.audio]
      const audioPath = audioList[Math.floor(Math.random() * audioList.length)]
      if (audioPath) {
        // 提取文件名部分，交给 AudioService 统一管理复用
        const sfxName = audioPath.startsWith('/sound/') ? audioPath.slice(7) : audioPath
        this.playSFX(sfxName, 0.3)
      }
    } catch (e) {
      // 忽略音效播放失败
    }
  }

  /**
   * 通过回调播放通用音效，避免直接 new Audio() 导致内存泄漏
   * @param {string} sfxName - 音效文件名（相对于 /sound/ 目录）
   * @param {number} [volume=0.4] - 音量因子
   * @returns {void}
   */
  playDotSFX (sfxName, volume = 0.4) {
    if (!this.playSFX) {
      return
    }
    try {
      this.playSFX(sfxName, volume)
    } catch (e) {
      // 忽略音效播放失败
    }
  }

  /**
   * 清除指定怪物的所有 DOT
   * @param {string|number} monsterId
   */
  clearMonsterDots (monsterId) {
    const key = this.normalizeMonsterId(monsterId)
    if (!key) {
      return
    }

    this.activeDots.delete(key)
    this.monsterCache.delete(key)
  }

  /**
   * 移除最早注册的 DOT（用于全局限制）
   * @returns {boolean} 是否成功移除
   */
  removeOldestDot () {
    let oldestEntry = null
    let oldestMonsterId = null
    let oldestIndex = -1
    let oldestTime = Infinity

    // 遍历所有怪物，找到最早注册的 DOT
    for (const [monsterId, dots] of this.activeDots) {
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        if (dot.registeredAt < oldestTime) {
          oldestTime = dot.registeredAt
          oldestEntry = dot
          oldestMonsterId = monsterId
          oldestIndex = i
        }
      }
    }

    if (oldestEntry && oldestMonsterId !== null && oldestIndex >= 0) {
      const dots = this.activeDots.get(oldestMonsterId)
      if (dots) {
        dots.splice(oldestIndex, 1)
        // 如果该怪物没有 DOT 了，删除条目
        if (dots.length === 0) {
          this.activeDots.delete(oldestMonsterId)
        }
      }
      return true
    }

    return false
  }

  /**
   * 获取当前总 DOT 数量
   * @returns {number}
   */
  getTotalDotsCount () {
    let total = 0
    for (const dots of this.activeDots.values()) {
      total += dots.length
    }
    return total
  }

  /**
   * 清除所有 DOT
   */
  clearAllDots () {
    this.activeDots.clear()
    this.monsterCache.clear()
  }

  /**
   * 重置调度器
   */
  reset () {
    this.stop()
    this.version++
    this.activeDots.clear()
    this.monsterCache.clear()
    this.pendingTickResults = []
    this.hasPendingTicks = false
    debug('调度器已重置')
  }

  /**
   * 清理孤儿DOT引用
   * 当怪物已被击败或从场景中移除，但其DOT效果仍残留在activeDots中时，
   * 需要清理这些孤儿引用，防止长时间运行导致内存泄漏
   * @returns {number} 清理的孤儿DOT数量
   */
  cleanupOrphanDots () {
    let cleanedCount = 0
    const keysToRemove = []

    for (const [monsterKey, dots] of this.activeDots.entries()) {
      if (!Array.isArray(dots) || dots.length === 0) {
        keysToRemove.push(monsterKey)
        continue
      }

      // 清理已完成（ticksRemaining<=0）或怪物已死亡的DOT
      const validDots = dots.filter(dot => {
        const monster = dot?.monster
        const ticksRemaining = Number(dot?.ticksRemaining ?? 0)

        // DOT已完成
        if (ticksRemaining <= 0) return false

        // 怪物已死亡或不存在
        if (!monster) return false
        if (monster.currentHealth <= 0 || monster.isDefeated || monster.isHidden) return false

        return true
      })

      if (validDots.length !== dots.length) {
        cleanedCount += dots.length - validDots.length
        if (validDots.length === 0) {
          keysToRemove.push(monsterKey)
        } else {
          this.activeDots.set(monsterKey, validDots)
        }
      }
    }

    // 清理空键
    for (const key of keysToRemove) {
      this.activeDots.delete(key)
      this.monsterCache.delete(key)
    }

    // 清理过期的怪物缓存引用
    if (this.monsterCache.size > 50) {
      this.monsterCache.clear()
    }

    if (cleanedCount > 0) {
      debug(`清理了 ${cleanedCount} 个孤儿DOT引用`)
    }

    return cleanedCount
  }

  /**
   * 获取调度器状态
   * @returns {Object}
   */
  getStats () {
    let totalDots = 0
    for (const dots of this.activeDots.values()) {
      totalDots += dots.length
    }

    return {
      isRunning: this.isRunning,
      activeMonsters: this.activeDots.size,
      totalDots,
      maxTotalDots: this.maxTotalDots,
      maxDotsPerMonster: this.maxDotsPerMonster,
      version: this.version,
      tickInterval: this.tickInterval
    }
  }

  /**
   * 获取指定怪物的 DOT 信息
   * @param {string|number} monsterId
   * @returns {Array}
   */
  getMonsterDots (monsterId) {
    const key = this.normalizeMonsterId(monsterId)
    if (!key) {
      return []
    }

    const dots = this.activeDots.get(key)
    if (!dots) {
      return []
    }

    return dots.map(dot => ({
      name: dot.name,
      damage: dot.damage,
      ticksRemaining: dot.ticksRemaining,
      tickInterval: dot.tickInterval,
      nextTickTime: dot.nextTickTime,
      icon: dot.icon
    }))
  }

  /**
   * 检查怪物是否有活跃的 DOT
   * @param {string|number} monsterId
   * @returns {boolean}
   */
  hasActiveDots (monsterId) {
    const key = this.normalizeMonsterId(monsterId)
    if (!key) {
      return false
    }

    const dots = this.activeDots.get(key)
    return Array.isArray(dots) && dots.length > 0
  }
}

// 导出单例
export const dotTickScheduler = new DotTickScheduler()
