/**
 * 战斗性能监控工具
 * 用于验证 AOE/DOT 优化效果
 *
 * @file performanceMonitor.js
 * @generated 2026-02-15
 */

const isDev = import.meta.env.DEV === true

/**
 * 性能监控器类
 */
export class BattlePerformanceMonitor {
  constructor () {
    this.isEnabled = false
    this.fpsHistory = []
    this.maxFpsHistory = 60
    this.lastFrameTime = 0
    this.frameCount = 0
    this.fpsUpdateInterval = 1000
    this.lastFpsUpdate = 0
    this.currentFps = 60

    // AOE 统计
    this.aoeStats = {
      totalCount: 0,
      totalMonstersAffected: 0,
      totalDamageEvents: 0,
      averageProcessTime: 0,
      batchUsedCount: 0,
      lastProcessTime: 0
    }

    // DOT 统计
    this.dotStats = {
      activeDots: 0,
      totalTicksProcessed: 0,
      averageTickTime: 0,
      schedulerRunning: false,
      lastTickBatchSize: 0
    }

    // 主线程阻塞统计
    this.blockingStats = {
      longTasksCount: 0,
      totalBlockingTime: 0,
      maxBlockingTime: 0
    }

    this.rafId = null
    this.observer = null
    this.listeners = new Set()
  }

  /**
   * 启动监控
   */
  start () {
    if (this.isEnabled) {
      return
    }
    this.isEnabled = true
    this.lastFrameTime = performance.now()
    this.lastFpsUpdate = this.lastFrameTime

    this.startFPSMonitor()
    this.startLongTaskObserver()

  }

  /**
   * 停止监控
   */
  stop () {
    this.isEnabled = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }

  /**
   * FPS 监控
   */
  startFPSMonitor () {
    const measureFrame = (timestamp) => {
      if (!this.isEnabled) {
        return
      }

      this.frameCount++

      const now = performance.now()
      const elapsed = now - this.lastFpsUpdate

      if (elapsed >= this.fpsUpdateInterval) {
        this.currentFps = Math.round((this.frameCount * 1000) / elapsed)
        this.frameCount = 0
        this.lastFpsUpdate = now

        // 记录历史
        this.fpsHistory.push(this.currentFps)
        if (this.fpsHistory.length > this.maxFpsHistory) {
          this.fpsHistory.shift()
        }

        this.notifyListeners('fps', {
          fps: this.currentFps,
          average: this.getAverageFPS(),
          min: this.getMinFPS(),
          max: this.getMaxFPS()
        })
      }

      this.lastFrameTime = timestamp
      this.rafId = requestAnimationFrame(measureFrame)
    }

    this.rafId = requestAnimationFrame(measureFrame)
  }

  /**
   * 长任务监控（主线程阻塞）
   */
  startLongTaskObserver () {
    if (typeof PerformanceObserver === 'undefined') {
      return
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            this.blockingStats.longTasksCount++
            this.blockingStats.totalBlockingTime += entry.duration
            this.blockingStats.maxBlockingTime = Math.max(
              this.blockingStats.maxBlockingTime,
              entry.duration
            )

            this.notifyListeners('longtask', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            })
          }
        }
      })

      this.observer.observe({ entryTypes: ['longtask'] })
    } catch (error) {
      // 浏览器不支持 longtask API
    }
  }

  /**
   * 记录 AOE 事件
   * @param {Object} data - AOE 事件数据
   */
  recordAoeEvent (data) {
    const { monsterCount, damageEventCount, processTime, usedBatch } = data

    this.aoeStats.totalCount++
    this.aoeStats.totalMonstersAffected += monsterCount || 0
    this.aoeStats.totalDamageEvents += damageEventCount || 0
    this.aoeStats.lastProcessTime = processTime || 0

    // 更新平均处理时间
    const prevAvg = this.aoeStats.averageProcessTime
    const prevCount = this.aoeStats.totalCount - 1
    this.aoeStats.averageProcessTime = prevCount > 0
      ? (prevAvg * prevCount + (processTime || 0)) / this.aoeStats.totalCount
      : (processTime || 0)

    if (usedBatch) {
      this.aoeStats.batchUsedCount++
    }

    this.notifyListeners('aoe', {
      ...data,
      stats: { ...this.aoeStats }
    })
  }

  /**
   * 记录 DOT 事件
   * @param {Object} data - DOT 事件数据
   */
  recordDotEvent (data) {
    const { activeDots, tickBatchSize, tickTime } = data

    this.dotStats.activeDots = activeDots || 0
    this.dotStats.totalTicksProcessed += tickBatchSize || 0
    this.dotStats.lastTickBatchSize = tickBatchSize || 0

    // 更新平均 tick 时间
    if (tickTime) {
      const prevAvg = this.dotStats.averageTickTime
      const totalTicks = this.dotStats.totalTicksProcessed
      this.dotStats.averageTickTime = totalTicks > 1
        ? (prevAvg * (totalTicks - 1) + tickTime) / totalTicks
        : tickTime
    }

    this.notifyListeners('dot', {
      ...data,
      stats: { ...this.dotStats }
    })
  }

  /**
   * 更新 DOT 调度器状态
   */
  updateDotSchedulerStatus (isRunning) {
    this.dotStats.schedulerRunning = isRunning
  }

  /**
   * 获取平均 FPS
   */
  getAverageFPS () {
    if (this.fpsHistory.length === 0) {
      return 60
    }
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0)
    return Math.round(sum / this.fpsHistory.length)
  }

  /**
   * 获取最低 FPS
   */
  getMinFPS () {
    if (this.fpsHistory.length === 0) {
      return 60
    }
    return Math.min(...this.fpsHistory)
  }

  /**
   * 获取最高 FPS
   */
  getMaxFPS () {
    if (this.fpsHistory.length === 0) {
      return 60
    }
    return Math.max(...this.fpsHistory)
  }

  /**
   * 添加监听器
   */
  addListener (callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback)
    }
    return () => this.listeners.delete(callback)
  }

  /**
   * 通知监听器
   */
  notifyListeners (type, data) {
    for (const callback of this.listeners) {
      try {
        callback({ type, data, timestamp: Date.now() })
      } catch (error) {
        console.error('[BattlePerfMonitor] 监听器回调错误:', error)
      }
    }
  }

  /**
   * 获取完整报告
   */
  getReport () {
    return {
      fps: {
        current: this.currentFps,
        average: this.getAverageFPS(),
        min: this.getMinFPS(),
        max: this.getMaxFPS(),
        history: [...this.fpsHistory]
      },
      aoe: { ...this.aoeStats },
      dot: { ...this.dotStats },
      blocking: { ...this.blockingStats },
      summary: this.getSummary()
    }
  }

  /**
   * 获取摘要
   */
  getSummary () {
    const avgFps = this.getAverageFPS()
    const minFps = this.getMinFPS()
    const batchUsageRate = this.aoeStats.totalCount > 0
      ? ((this.aoeStats.batchUsedCount / this.aoeStats.totalCount) * 100).toFixed(1)
      : 0

    let grade = 'A'
    if (avgFps < 30 || minFps < 20) {
      grade = 'D'
    } else if (avgFps < 45 || minFps < 30) {
      grade = 'C'
    } else if (avgFps < 55 || minFps < 45) {
      grade = 'B'
    }

    return {
      grade,
      avgFps,
      minFps,
      totalAoeEvents: this.aoeStats.totalCount,
      batchUsageRate: `${batchUsageRate}%`,
      avgAoeProcessTime: `${this.aoeStats.averageProcessTime.toFixed(2)}ms`,
      totalLongTasks: this.blockingStats.longTasksCount,
      totalBlockingTime: `${this.blockingStats.totalBlockingTime.toFixed(0)}ms`,
      recommendation: this.getRecommendation(grade)
    }
  }

  /**
   * 获取优化建议
   */
  getRecommendation (grade) {
    const recommendations = {
      A: '性能优秀，优化效果显著',
      B: '性能良好，可考虑进一步减少渲染压力',
      C: '性能一般，建议检查是否有大量独立 setTimeout 或 DOM 操作',
      D: '性能较差，建议检查 Worker 是否正常工作，是否有阻塞主线程的计算'
    }
    return recommendations[grade] || '未知状态'
  }

  /**
   * 重置统计
   */
  reset () {
    this.fpsHistory = []
    this.currentFps = 60
    this.aoeStats = {
      totalCount: 0,
      totalMonstersAffected: 0,
      totalDamageEvents: 0,
      averageProcessTime: 0,
      batchUsedCount: 0,
      lastProcessTime: 0
    }
    this.dotStats = {
      activeDots: 0,
      totalTicksProcessed: 0,
      averageTickTime: 0,
      schedulerRunning: false,
      lastTickBatchSize: 0
    }
    this.blockingStats = {
      longTasksCount: 0,
      totalBlockingTime: 0,
      maxBlockingTime: 0
    }
  }

  /**
   * 打印报告到控制台
   */
  printReport () {
    const report = this.getReport()
    console.group('🎮 战斗性能报告')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📊 FPS: 当前 ${report.fps.current} | 平均 ${report.fps.average} | 最低 ${report.fps.min}`)
    console.log(`⚡ AOE: ${report.aoe.totalCount} 次 | 批量使用率 ${report.summary.batchUsageRate} | 平均耗时 ${report.summary.avgAoeProcessTime}`)
    console.log(`🔥 DOT: ${report.dot.totalTicksProcessed} ticks | 活跃 ${report.dot.activeDots}`)
    console.log(`🚫 阻塞: ${report.blocking.longTasksCount} 次长任务 | 总计 ${report.summary.totalBlockingTime}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📈 评级: ${report.summary.grade} - ${report.summary.recommendation}`)
    console.groupEnd()
    return report
  }
}

// 单例导出
export const battlePerfMonitor = new BattlePerformanceMonitor()

// 开发模式下自动暴露到全局
if (isDev && typeof window !== 'undefined') {
  window.__battlePerfMonitor = battlePerfMonitor
  console.log('[BattlePerfMonitor] 已挂载到 window.__battlePerfMonitor')
}
