/**
 * 自动战斗定时器管理类（彻底重构版）
 *
 * 核心变更：
 * - 不再使用 requestAnimationFrame 调度战斗逻辑（RAF 仅用于视觉提交）
 * - 主循环改为 setTimeout 调度，彻底消除 'requestAnimationFrame' handler took Xms 违规
 * - 每帧只执行 1 个任务（maxTasksPerFrame = 1），避免多个重任务叠加阻塞
 * - 通过 UnifiedFrameScheduler 的优先级队列统一调度，确保战斗逻辑不与渲染竞争
 *
 * 循环链：_loopTick → _scheduleNext(setTimeout) → _loopTick → ...
 * 任务排空：scheduleTaskDrain → setTimeout → drainPendingTasks → 每次只执行 1 个任务
 *
 * @file AutoBattleTimerManager.js
 * @generated 2026-07-12
 */
import { AutoBattleConfig } from './AutoBattleConfig'
import { battleMutationBatcher } from './BattleMutationBatcher'

/** 主循环基础间隔（毫秒）— 不与显示刷新率绑定 */
const LOOP_INTERVAL = 16

export class AutoBattleTimerManager {
  constructor () {
    /** @type {number|null} 当前调度 ID（RAF ID） */
    this._scheduledId = null
    /** @type {boolean} 是否正在运行 */
    this.isRunning = false
    /** @type {boolean} 是否被用户暂停 */
    this.isPaused = false
    /** @type {{ type: string, request: Function, cancel: Function }} 调度器（setTimeout 实现，不再使用 RAF） */
    this.frameScheduler = this.createFrameScheduler()
    /** @type {Array<{key: string, task: Function}>} 待执行任务队列 */
    this.pendingTasks = []
    /** @type {Set<string>} 待执行任务key集合（防重复） */
    this.pendingTaskKeys = new Set()
    /** @type {number} 每次排空最多执行任务数（1 = 严格单任务，避免多重任务叠加阻塞） */
    this.maxTasksPerFrame = 1
    /** @type {number|null} 任务排空定时器 ID */
    this.taskDrainTimer = null
    /** @type {boolean} 是否已调度任务排空 */
    this.isTaskDrainScheduled = false
    /** @type {boolean} 异步任务排空是否正在进行（防止并发 drain） */
    this.isTaskDrainInProgress = false
    /** @type {number} 任务排空时间预算（毫秒） */
    this.taskDrainBudgetMs = 8
    /** @type {number} 上一帧时间戳 */
    this.lastFrameTimestamp = 0

    /** @type {Object} 回调函数集合 */
    this.callbacks = {
      onMainLoop: null,
      onSkillCheck: null,
      onCooldownUpdate: null,
      onMonsterAttack: null,
      onPause: null,
      onResume: null
    }

    /** @type {Object} 各定时器间隔配置 */
    this.intervals = {
      skillCheckInterval: AutoBattleConfig.DEFAULT.skillCheckInterval,
      cooldownUpdateInterval: 1000,
      monsterAttackInterval: 100
    }

    /** @type {Object} 各定时器上次触发时间戳 */
    this.timers = {
      lastSkillCheck: 0,
      lastCooldownUpdate: 0,
      lastMonsterAttack: 0
    }

    /** @type {number} 连续错误计数 */
    this.errorCount = 0
    /** @type {number} 最大允许错误数 */
    this.maxErrors = 5

    /** @type {Object} 性能指标 */
    this.performanceMetrics = {
      frameCount: 0,
      lastFPSUpdate: 0,
      fps: 60
    }
    /** @type {number} 上次主循环触发时间戳 */
    this.lastMainLoopTimestamp = 0
    /** @type {number} 当前主循环间隔（毫秒） */
    this.mainLoopInterval = LOOP_INTERVAL
    this.lastTimerLogAt = 0
    this.lastSkillCheckTriggerAt = 0
    this.lastMainLoopTriggerAt = 0
    this.lastHeartbeatLogAt = 0

    /** @type {number|null} 暂停时低频轮询定时器 ID */
    this.lowFrequencyTimer = null
    /** @type {boolean} 低频轮询是否正在运行（比 lowFrequencyTimer !== null 更可靠的去重标志） */
    this.isLowFreqPollingActive = false
  }

  /**
   * 将待执行任务加入队列
   * @param {string} key - 任务唯一标识，重复key会被忽略
   * @param {Function} task - 任务函数
   */
  enqueueTask (key, task) {
    if (!key || typeof task !== 'function') {
      return
    }
    if (this.pendingTaskKeys.has(key)) {
      return
    }
    this.pendingTaskKeys.add(key)
    this.pendingTasks.push({ key, task })
  }

  /**
   * 执行待处理任务直到时间预算耗尽
   * 支持 async 任务：如果任务返回 Promise，会 await 它，让出主线程
   * @param {number} deadline - 截止时间戳
   * @param {Object} context - 执行上下文
   */
  async runPendingTasks (deadline, context) {
    const now = context?.now || (() => Date.now())
    let executed = 0
    const maxTasks = Number(this.maxTasksPerFrame) > 0 ? Number(this.maxTasksPerFrame) : 1
    while (this.pendingTasks.length > 0 && now() < deadline && executed < maxTasks) {
      const entry = this.pendingTasks.shift()
      if (!entry) {
        continue
      }
      this.pendingTaskKeys.delete(entry.key)
      try {
        const result = entry.task(context)
        // 支持 async 任务：await Promise 会在 yield 点让出主线程
        if (result && typeof result.then === 'function') {
          await result
        } else if (typeof result === 'function') {
          this.enqueueTask(entry.key, result)
        }
      } catch (error) {
        console.error('AutoBattleTimer', `任务执行失败: ${entry.key}`, error)
      }
      executed++
    }
  }

  /**
   * 调度任务排空（在下一帧/时间片中执行）
   */
  scheduleTaskDrain () {
    if (this.isTaskDrainScheduled) {
      return
    }
    if (!this.isRunning || this.isPaused) {
      return
    }
    if (this.pendingTasks.length === 0) {
      return
    }

    this.isTaskDrainScheduled = true
    this.taskDrainTimer = this.frameScheduler.request(() => {
      this.taskDrainTimer = null
      this.isTaskDrainScheduled = false
      this.drainPendingTasks()
    })
  }

  /**
   * 排空待处理任务队列（异步）
   * 异步执行：当任务本身是 async 时，await 会让出主线程，
   * setTimeout 回调立即返回，Chrome 不会将其计为长任务
   */
  async drainPendingTasks () {
    if (!this.isRunning || this.isPaused) {
      return
    }
    if (this.isTaskDrainInProgress) {
      return
    }
    this.isTaskDrainInProgress = true

    try {
      const now = performance.now ? () => performance.now() : () => Date.now()
      const startedAt = now()
      const budgetMs = Number(this.taskDrainBudgetMs) > 0 ? Number(this.taskDrainBudgetMs) : 4
      const deadline = startedAt + budgetMs
      const frameTimestamp =
        Number.isFinite(this.lastFrameTimestamp) && this.lastFrameTimestamp > 0
          ? this.lastFrameTimestamp
          : Date.now()
      const context = { frameTimestamp, now, deadline }

      await this.runPendingTasks(deadline, context)

      if (this.pendingTasks.length > 0) {
        this.scheduleTaskDrain()
      }
    } finally {
      this.isTaskDrainInProgress = false
    }
  }

  /**
   * 创建调度器（使用 setTimeout，不再使用 requestAnimationFrame）
   *
   * 设计理由：requestAnimationFrame 的语义是"为渲染服务"，
   * Chrome 会将 RAF 回调中的长任务标记为 'requestAnimationFrame' handler took Xms 违规。
   * 战斗逻辑不是渲染工作，改用 setTimeout 调度后，
   * 长任务虽然仍会被标记为 Long Task，但不再触发 RAF 特定的违规警告。
   *
   * 同时，setTimeout(0) 的最小延迟约为 4ms（浏览器规范），
   * 这天然为渲染帧留出了呼吸空间，避免战斗逻辑持续占用主线程。
   *
   * @returns {{ type: string, request: Function, cancel: Function }}
   */
  createFrameScheduler () {
    return {
      type: 'timeout',
      request: callback => setTimeout(() => callback(Date.now()), 0),
      cancel: id => clearTimeout(id)
    }
  }

  /**
   * 设置回调函数
   * @param {Object} callbacks - 回调集合
   */
  setCallbacks (callbacks) {
    this.callbacks = {
      onMainLoop: null,
      onSkillCheck: null,
      onCooldownUpdate: null,
      onMonsterAttack: null,
      onPause: null,
      onResume: null
    }
    Object.assign(this.callbacks, callbacks)
  }

  /**
   * 设置各定时器间隔
   * @param {Object} intervals - 间隔配置
   */
  setIntervals (intervals) {
    if (!intervals || typeof intervals !== 'object') {
      return
    }

    const nextIntervals = { ...this.intervals }
    const applyPositiveNumber = (key, value) => {
      const nextValue = Number(value)
      if (Number.isFinite(nextValue) && nextValue > 0) {
        nextIntervals[key] = nextValue
      }
    }

    if ('skillCheckInterval' in intervals) {
      applyPositiveNumber('skillCheckInterval', intervals.skillCheckInterval)
    }
    if ('cooldownUpdateInterval' in intervals) {
      applyPositiveNumber('cooldownUpdateInterval', intervals.cooldownUpdateInterval)
    }
    if ('monsterAttackInterval' in intervals) {
      applyPositiveNumber('monsterAttackInterval', intervals.monsterAttackInterval)
    }

    this.intervals = nextIntervals
  }

  /**
   * 启动定时器管理器
   * @returns {boolean} 是否启动成功
   */
  start () {
    try {
      if (this.isRunning) {
        return false
      }

      this.isRunning = true
      this.isPaused = false
      this.errorCount = 0
      this.performanceMetrics.frameCount = 0
      this.performanceMetrics.lastFPSUpdate = 0

      // 通过 setTimeout 调度第一次 tick，避免同步执行回调阻塞主线程
      this._scheduleNext()

      return true
    } catch (error) {
      console.error('AutoBattleTimer', '定时器启动失败:', error)
      this.isRunning = false
      this.isPaused = false
      return false
    }
  }

  /**
   * 取消当前主循环调度
   * @private
   */
  _cancelScheduledLoop () {
    if (this._scheduledId !== null) {
      this.frameScheduler.cancel(this._scheduledId)
      this._scheduledId = null
    }
  }

  /**
   * 主循环 tick：执行回调检查 + 调度下一次
   * 经典单一循环链模式，每帧执行一次
   * @param {number} timestamp - 当前时间戳
   * @private
   */
  _loopTick (timestamp) {
    if (!this.isRunning) {
      return
    }

    // 用户主动暂停时，低频轮询等待恢复
    if (this.isPaused) {
      this._startLowFrequencyPolling()
      return
    }

    try {
      const frameTimestamp = typeof timestamp === 'number' ? timestamp : Date.now()
      this.lastFrameTimestamp = frameTimestamp
      const now = performance.now ? () => performance.now() : () => Date.now()
      const startTime = now()

      if (this.callbacks.onMainLoop) {
        if (
          this.lastMainLoopTimestamp === 0 ||
          frameTimestamp - this.lastMainLoopTimestamp >= this.mainLoopInterval
        ) {
          this.enqueueTask('mainLoop', () => {
            this.lastMainLoopTimestamp = frameTimestamp
            // 返回 Promise 以支持异步任务链
            return this.callbacks.onMainLoop()
          })
        }
      }

      if (this.callbacks.onMonsterAttack) {
        if (
          this.timers.lastMonsterAttack === 0 ||
          frameTimestamp - this.timers.lastMonsterAttack >= this.intervals.monsterAttackInterval
        ) {
          this.enqueueTask('monsterAttack', () => {
            this.timers.lastMonsterAttack = frameTimestamp
            return this.callbacks.onMonsterAttack(frameTimestamp)
          })
        }
      }

      if (this.callbacks.onSkillCheck) {
        if (
          this.timers.lastSkillCheck === 0 ||
          frameTimestamp - this.timers.lastSkillCheck >= this.intervals.skillCheckInterval
        ) {
          this.enqueueTask('skillCheck', () => {
            this.timers.lastSkillCheck = frameTimestamp
            return this.callbacks.onSkillCheck()
          })
        }
      }

      if (this.callbacks.onCooldownUpdate) {
        if (
          this.timers.lastCooldownUpdate === 0 ||
          frameTimestamp - this.timers.lastCooldownUpdate >= this.intervals.cooldownUpdateInterval
        ) {
          this.enqueueTask('cooldownUpdate', () => {
            this.timers.lastCooldownUpdate = frameTimestamp
            return this.callbacks.onCooldownUpdate()
          })
        }
      }

      this.scheduleTaskDrain()

      // 检查执行时间是否过长，动态调整间隔
      const executionTime = now() - startTime
      if (executionTime > 16) {
        this.mainLoopInterval = Math.min(
          Math.max(this.mainLoopInterval + 4, 16),
          100
        )
      } else if (
        executionTime < 8 &&
        this.mainLoopInterval > 16
      ) {
        this.mainLoopInterval = Math.max(16, this.mainLoopInterval - 2)
      }

      this.performanceMetrics.frameCount++
      this.updateFPS(frameTimestamp)

      this.errorCount = 0
    } catch (error) {
      this.errorCount++
      console.error('AutoBattleTimer', '主循环错误:', error)

      if (this.errorCount >= this.maxErrors) {
        console.error('AutoBattleTimer', '错误次数过多，停止定时器')
        this.stop()
        return
      }
    }

    // 调度下一次循环
    this._scheduleNext()
  }

  /**
   * 安全地重启循环链
   * 取消旧调度，然后通过 _scheduleNext 启动新循环
   * @private
   */
  _restartLoop () {
    this._cancelScheduledLoop()
    this._scheduleNext()
  }

  /**
   * 调度下一次主循环 tick
   * 使用 setTimeout 调度（不再使用 RAF），每次调度前先取消旧的，确保只有一条循环链
   * @private
   */
  _scheduleNext () {
    if (!this.isRunning || this.isPaused) {
      return
    }

    // 先取消旧的调度，防止多循环链
    this._cancelScheduledLoop()

    this._scheduledId = this.frameScheduler.request(ts => {
      this._scheduledId = null
      this._loopTick(ts)
    })
  }

  /**
   * 更新FPS统计
   * @param {number} timestamp - 当前时间戳
   */
  updateFPS (timestamp) {
    if (this.performanceMetrics.lastFPSUpdate === 0) {
      this.performanceMetrics.lastFPSUpdate = timestamp
      return
    }

    const elapsed = timestamp - this.performanceMetrics.lastFPSUpdate

    if (elapsed >= 1000) {
      this.performanceMetrics.fps = Math.round(
        (this.performanceMetrics.frameCount * 1000) / elapsed
      )

      this.performanceMetrics.frameCount = 0
      this.performanceMetrics.lastFPSUpdate = timestamp
    }
  }

  /**
   * 暂停定时器（仅用于用户主动暂停）
   * 暂停时 flush 批处理器，确保数据一致性
   * @param {Object} options - 暂停选项
   * @param {string} [options.source] - 暂停来源
   * @returns {boolean} 是否暂停成功
   */
  pause (options = {}) {
    const { source = 'unknown' } = options
    if (!this.isRunning || this.isPaused) {
      return false
    }

    this.isPaused = true

    // 取消所有调度
    this._cancelScheduledLoop()

    // 清理 taskDrain
    if (this.taskDrainTimer) {
      this.frameScheduler.cancel(this.taskDrainTimer)
      this.taskDrainTimer = null
    }
    this.isTaskDrainScheduled = false

    // 暂停后启动低频轮询定时器，确保在恢复时能自动重启循环链
    this._startLowFrequencyPolling()

    // 确保所有待提交的战斗变更写入 store
    try {
      battleMutationBatcher.flushNow()
    } catch (error) {
      console.error('AutoBattleTimer', '暂停时 flush 批处理器失败:', error)
    }

    if (this.callbacks.onPause) {
      try {
        this.callbacks.onPause({ source })
      } catch (error) {
        console.error('AutoBattleTimer', 'onPause 回调错误:', error)
      }
    }
    return true
  }

  /**
   * 恢复定时器
   * @param {Object} options - 恢复选项
   * @param {string} [options.source] - 恢复来源
   * @returns {boolean} 是否恢复成功
   */
  resume (options = {}) {
    const { source = 'unknown' } = options
    if (!this.isRunning || !this.isPaused) {
      return false
    }

    this.isPaused = false

    // 清理低频轮询定时器（由 pause() 启动的）
    if (this.lowFrequencyTimer) {
      clearTimeout(this.lowFrequencyTimer)
      this.lowFrequencyTimer = null
    }
    this.isLowFreqPollingActive = false

    // 重新启动主循环（异步调度，避免同步执行回调阻塞主线程）
    this._restartLoop()
    this.scheduleTaskDrain()

    if (this.callbacks.onResume) {
      try {
        this.callbacks.onResume({ source })
      } catch (error) {
        console.error('AutoBattleTimer', 'onResume 回调错误:', error)
      }
    }
    return true
  }

  /**
   * 停止定时器
   * 停止时 flush 批处理器，确保所有待提交的变更写入 store
   * @returns {boolean} 是否停止成功
   */
  stop () {
    if (!this.isRunning) {
      return false
    }

    this.isRunning = false
    this.isPaused = false

    this._cancelScheduledLoop()

    if (this.lowFrequencyTimer) {
      clearTimeout(this.lowFrequencyTimer)
      this.lowFrequencyTimer = null
    }
    this.isLowFreqPollingActive = false

    if (this.taskDrainTimer) {
      this.frameScheduler.cancel(this.taskDrainTimer)
      this.taskDrainTimer = null
    }
    this.isTaskDrainScheduled = false

    this.pendingTasks.length = 0
    this.pendingTaskKeys.clear()

    // 确保所有待提交的战斗变更写入 store
    try {
      battleMutationBatcher.flushNow()
    } catch (error) {
      console.error('AutoBattleTimer', '停止时 flush 批处理器失败:', error)
    }

    return true
  }

  /**
   * 获取运行状态
   * @returns {boolean}
   */
  getIsRunning () {
    return this.isRunning
  }

  /**
   * 获取暂停状态
   * @returns {boolean}
   */
  getIsPaused () {
    return this.isPaused
  }

  /**
   * 重置定时器
   */
  reset () {
    this.stop()
    this.timers.lastSkillCheck = 0
    this.timers.lastCooldownUpdate = 0
    this.timers.lastMonsterAttack = 0
    this.errorCount = 0
    this.performanceMetrics.frameCount = 0
    this.lastMainLoopTimestamp = 0
    this.mainLoopInterval = LOOP_INTERVAL
  }

  /**
   * 启动低频轮询定时器，在暂停状态下定期检查是否已恢复
   * 确保 pause() 后循环链不会完全断裂，自动检测恢复并重启循环
   * @param {number} [interval=1000] - 轮询间隔（毫秒）
   */
  _startLowFrequencyPolling (interval = 1000) {
    if (this.isLowFreqPollingActive) {
      return // 已有轮询在运行
    }
    this.isLowFreqPollingActive = true

    this.lowFrequencyTimer = setTimeout(() => {
      this.lowFrequencyTimer = null
      this.isLowFreqPollingActive = false

      if (this.isRunning && !this.isPaused) {
        // 已恢复，重启循环链
        this._scheduleNext()
      } else if (this.isRunning && this.isPaused) {
        // 仍在暂停，继续轮询
        this._startLowFrequencyPolling(interval)
      }
    }, interval)
  }

  /**
   * 获取定时器统计信息
   * @returns {Object}
   */
  getStats () {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      schedulerType: this.frameScheduler?.type || 'unknown',
      fps: this.performanceMetrics.fps,
      errorCount: this.errorCount,
      lastSkillCheck: this.timers.lastSkillCheck,
      lastCooldownUpdate: this.timers.lastCooldownUpdate,
      lastMonsterAttack: this.timers.lastMonsterAttack
    }
  }
}
