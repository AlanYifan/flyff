/**
 * 增强的自动战斗事件总线
 * 添加组件级的事件监听器生命周期管理，防止内存泄漏
 */
import autoBattleEventBus, { AutoBattleEvents } from './autoBattleEventBus'

const warn = () => {}
const debug = () => {}
const log = () => {}
const group = () => {}
const groupEnd = () => {}

class EnhancedAutoBattleEventBus {
  constructor () {
    this.componentListeners = new WeakMap()
    this.componentEventCounts = new WeakMap()
    this.componentEventCache = new WeakMap() // 缓存组件已注册的事件
    this.leakDetectionInterval = null
    this.maxListenersPerComponent = 20
    this.eventRegistrationStats = {
      totalRegistrations: 0,
      cachedRegistrations: 0,
      duplicatePreventions: 0
    }
  }

  /**
   * 为组件注册事件监听器（带缓存优化）
   * @param {Object} component - Vue组件实例
   * @param {Object} events - 事件映射 { eventName: callback }
   * @returns {Function} 清理函数
   */
  registerForComponent (component, events) {
    if (!component || typeof component !== 'object') {
      warn('无效的组件实例')
      return () => {}
    }

    // 检查是否已经注册过相同的事件
    const existingEvents = this.componentEventCache.get(component) || new Set()

    // 找出需要注册的新事件
    const eventsToRegister = {}
    let duplicateCount = 0

    Object.entries(events).forEach(([event, callback]) => {
      if (existingEvents.has(event)) {
        // 事件已注册，跳过重复注册
        duplicateCount++
        return
      }

      if (typeof callback !== 'function') {
        warn(`事件 ${event} 的回调不是函数`)
        return
      }

      eventsToRegister[event] = callback
    })

    // 更新统计
    this.eventRegistrationStats.totalRegistrations++
    if (duplicateCount > 0) {
      this.eventRegistrationStats.duplicatePreventions += duplicateCount
      debug(
        `[EventBus] 为组件 ${component.uid || 'unknown'} 跳过 ${duplicateCount} 个重复事件注册`
      )
    }

    const unsubscribers = []
    let totalListeners = 0

    // 只注册新事件
    Object.entries(eventsToRegister).forEach(([event, callback]) => {
      const unsubscribe = autoBattleEventBus.on(event, callback)
      unsubscribers.push(unsubscribe)
      totalListeners++

      // 添加到缓存
      existingEvents.add(event)
    })

    // 更新缓存
    this.componentEventCache.set(component, existingEvents)

    // 合并现有的和新的监听器
    const existingUnsubscribers = this.componentListeners.get(component) || []
    const allUnsubscribers = [...existingUnsubscribers, ...unsubscribers]
    const existingCount = this.componentEventCounts.get(component) || 0
    const newTotalListeners = existingCount + totalListeners

    // 存储组件的监听器
    this.componentListeners.set(component, allUnsubscribers)
    this.componentEventCounts.set(component, newTotalListeners)

    // 检查是否超过限制
    if (newTotalListeners > this.maxListenersPerComponent) {
      warn(`组件注册了过多事件监听器 (${newTotalListeners})，建议优化`)
    }

    // 返回清理函数
    return () => {
      this.unregisterComponent(component)
    }
  }

  /**
   * 清理组件的事件监听器
   * @param {Object} component - Vue组件实例
   */
  unregisterComponent (component) {
    const unsubscribers = this.componentListeners.get(component)
    if (unsubscribers) {
      unsubscribers.forEach(unsubscribe => {
        try {
          unsubscribe()
        } catch (error) {
          console.error('取消订阅事件时出错:', error)
        }
      })

      this.componentListeners.delete(component)
      this.componentEventCounts.delete(component)
      this.componentEventCache.delete(component) // 清理缓存
    }
  }

  /**
   * 获取组件的事件监听器数量
   * @param {Object} component - Vue组件实例
   * @returns {number}
   */
  getComponentListenerCount (component) {
    return this.componentEventCounts.get(component) || 0
  }

  /**
   * 获取事件注册统计信息
   * @returns {Object}
   */
  getRegistrationStats () {
    return {
      ...this.eventRegistrationStats,
      cacheHitRate:
        this.eventRegistrationStats.totalRegistrations > 0
          ? (
            (this.eventRegistrationStats.duplicatePreventions /
                this.eventRegistrationStats.totalRegistrations) *
              100
          ).toFixed(1)
          : 0
    }
  }

  /**
   * 获取所有组件的监听器统计
   * @returns {Object}
   */
  getComponentStats () {
    const stats = {
      totalComponents: 0,
      totalListeners: 0,
      components: []
    }

    for (const [component, count] of this.componentEventCounts.entries()) {
      stats.totalComponents++
      stats.totalListeners += count
      stats.components.push({
        component,
        listenerCount: count
      })
    }

    return stats
  }

  /**
   * 启动内存泄漏检测
   * @param {number} interval - 检测间隔（毫秒）
   */
  startLeakDetection (interval = 30000) {
    if (this.leakDetectionInterval) {
      clearInterval(this.leakDetectionInterval)
    }

    this.leakDetectionInterval = setInterval(() => {
      this.detectMemoryLeaks()
    }, interval)

    log('内存泄漏检测已启动，间隔:', interval, 'ms')
  }

  /**
   * 停止内存泄漏检测
   */
  stopLeakDetection () {
    if (this.leakDetectionInterval) {
      clearInterval(this.leakDetectionInterval)
      this.leakDetectionInterval = null
      log('内存泄漏检测已停止')
    }
  }

  /**
   * 检测内存泄漏
   * @private
   */
  detectMemoryLeaks () {
    const stats = this.getComponentStats()
    const totalListeners = autoBattleEventBus.listenerCount()

    group('内存泄漏检测报告')
    log('检测时间:', new Date().toISOString())
    log('注册组件数量:', stats.totalComponents)
    log('组件监听器总数:', stats.totalListeners)
    log('事件总线总监听器数:', totalListeners)

    // 检查异常情况
    if (stats.totalListeners > 100) {
      warn('⚠️ 检测到大量事件监听器，可能存在内存泄漏')
    }

    if (stats.totalComponents > 50) {
      warn('⚠️ 注册组件数量过多，建议检查组件卸载逻辑')
    }

    // 检查单个组件监听器过多
    stats.components.forEach(({ component, listenerCount }) => {
      if (listenerCount > this.maxListenersPerComponent) {
        warn(`⚠️ 组件注册了过多监听器 (${listenerCount})`, component)
      }
    })

    groupEnd()
  }

  /**
   * 清理所有组件的事件监听器
   */
  cleanupAllComponents () {
    const components = Array.from(this.componentListeners.keys())

    log(`清理 ${components.length} 个组件的事件监听器`)

    components.forEach(component => {
      this.unregisterComponent(component)
    })

    this.componentListeners = new WeakMap()
    this.componentEventCounts = new WeakMap()
  }

  /**
   * 代理原始事件总线的方法
   */
  on (event, callback) {
    return autoBattleEventBus.on(event, callback)
  }

  off (event, callback) {
    return autoBattleEventBus.off(event, callback)
  }

  emit (event, data) {
    return autoBattleEventBus.emit(event, data)
  }

  once (event, callback) {
    return autoBattleEventBus.once(event, callback)
  }

  clearAll () {
    this.cleanupAllComponents()
    return autoBattleEventBus.clearAll()
  }

  listenerCount (event = null) {
    return autoBattleEventBus.listenerCount(event)
  }

  getEventHistory () {
    return autoBattleEventBus.getEventHistory()
  }

  clearHistory () {
    return autoBattleEventBus.clearHistory()
  }
}

// 创建单例实例
const enhancedAutoBattleEventBus = new EnhancedAutoBattleEventBus()

// 导出增强的事件总线和原始事件常量
export { AutoBattleEvents }
export default enhancedAutoBattleEventBus
