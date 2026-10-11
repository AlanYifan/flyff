/**
 * 自动战斗统一错误处理器
 * 提供统一的错误分类、处理和用户通知机制
 * 包含指数退避重试和错误恢复策略
 */
import autoBattleEventBus from '../utils/autoBattleEventBus'

export const AutoBattleErrorTypes = {
  INITIALIZATION: 'INITIALIZATION',
  START: 'START',
  STOP: 'STOP',
  PLAYER_DATA: 'PLAYER_DATA',
  MONSTER_DATA: 'MONSTER_DATA',
  SKILL: 'SKILL',
  CONFIG: 'CONFIG',
  NETWORK: 'NETWORK',
  PERFORMANCE: 'PERFORMANCE',
  MEMORY: 'MEMORY',
  STATE: 'STATE',
  SYNC: 'SYNC',
  TIMER: 'TIMER',
  CACHE: 'CACHE',
  UNKNOWN: 'UNKNOWN'
}

export const AutoBattleErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
}

class AutoBattleErrorHandler {
  constructor () {
    this.errorCallbacks = {
      [AutoBattleErrorSeverity.INFO]: [],
      [AutoBattleErrorSeverity.WARNING]: [],
      [AutoBattleErrorSeverity.ERROR]: [],
      [AutoBattleErrorSeverity.CRITICAL]: []
    }

    this.errorHistory = []
    this.maxHistorySize = 50

    this.recoveryStrategies = {
      [AutoBattleErrorTypes.MONSTER_DATA]: () => {
        autoBattleEventBus.emit('auto-battle:refresh-monsters', {})
      },
      [AutoBattleErrorTypes.PLAYER_DATA]: () => {
        autoBattleEventBus.emit('auto-battle:stop', { reason: 'player-data-error' })
      },
      [AutoBattleErrorTypes.SKILL]: () => {
        console.debug('AutoBattleErrorHandler', '技能错误恢复策略：跳过当前技能')
      },
      [AutoBattleErrorTypes.INITIALIZATION]: () => {
        console.debug('AutoBattleErrorHandler', '初始化错误恢复策略：等待用户重试')
      },
      [AutoBattleErrorTypes.PERFORMANCE]: () => {
        console.debug('AutoBattleErrorHandler', '性能错误恢复策略：降低攻击频率')
        return { action: 'reduce_frequency', factor: 0.8 }
      },
      [AutoBattleErrorTypes.MEMORY]: () => {
        console.debug('AutoBattleErrorHandler', '内存错误恢复策略：清理缓存')
        return { action: 'clear_cache' }
      },
      [AutoBattleErrorTypes.TIMER]: () => {
        console.debug('AutoBattleErrorHandler', '定时器错误恢复策略：重置定时器')
        return { action: 'reset_timer' }
      },
      [AutoBattleErrorTypes.CACHE]: () => {
        console.debug('AutoBattleErrorHandler', '缓存错误恢复策略：清除缓存')
        return { action: 'clear_cache' }
      }
    }
  }

  /**
   * 处理错误
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文（模块名）
   * @param {Object} options - 处理选项
   * @returns {Object} 错误处理结果
   */
  handle (error, context, options = {}) {
    const {
      notifyUser = true,
      stopAutoBattle = false,
      retry = false,
      customMessage = null,
      useRecoveryStrategy = true
    } = options

    const errorInfo = this._classifyError(error, context)

    this._addToHistory(errorInfo)
    this._logError(errorInfo)

    if (notifyUser) {
      this._notifyUser(errorInfo, customMessage)
    }

    if (useRecoveryStrategy && this.recoveryStrategies[errorInfo.type]) {
      try {
        this.recoveryStrategies[errorInfo.type]()
        console.debug('AutoBattleErrorHandler', `执行错误恢复策略: ${errorInfo.type}`)
      } catch (recoveryError) {
        console.error('AutoBattleErrorHandler', '错误恢复策略执行失败:', recoveryError)
      }
    }

    if (stopAutoBattle) {
      this._triggerStopAutoBattle()
    }

    if (retry) {
      return this._attemptRetry(errorInfo)
    }

    return {
      handled: true,
      severity: errorInfo.severity,
      type: errorInfo.type,
      message: errorInfo.message
    }
  }

  /**
   * 分类错误
   * @private
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   * @returns {Object} 错误信息
   */
  _classifyError (error, context) {
    const errorType = this._determineErrorType(error)
    const severity = this._determineSeverity(errorType)

    return {
      type: errorType,
      severity,
      message: error.message || '未知错误',
      stack: error.stack,
      context,
      timestamp: Date.now(),
      originalError: error
    }
  }

  /**
   * 确定错误类型
   * @private
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   * @returns {string}
   */
  _determineErrorType (error) {
    const message = error.message?.toLowerCase() || ''

    if (message.includes('初始化') || message.includes('initialize')) {
      return AutoBattleErrorTypes.INITIALIZATION
    }

    if (message.includes('启动') || message.includes('start')) {
      return AutoBattleErrorTypes.START
    }

    if (message.includes('停止') || message.includes('stop')) {
      return AutoBattleErrorTypes.STOP
    }

    if (message.includes('玩家') || message.includes('player')) {
      return AutoBattleErrorTypes.PLAYER_DATA
    }

    if (message.includes('怪物') || message.includes('monster')) {
      return AutoBattleErrorTypes.MONSTER_DATA
    }

    if (message.includes('技能') || message.includes('skill')) {
      return AutoBattleErrorTypes.SKILL
    }

    if (message.includes('配置') || message.includes('config')) {
      return AutoBattleErrorTypes.CONFIG
    }

    if (message.includes('网络') || message.includes('network')) {
      return AutoBattleErrorTypes.NETWORK
    }

    if (message.includes('性能') || message.includes('performance') || message.includes('fps')) {
      return AutoBattleErrorTypes.PERFORMANCE
    }

    if (message.includes('内存') || message.includes('memory') || message.includes('leak')) {
      return AutoBattleErrorTypes.MEMORY
    }

    if (message.includes('状态') || message.includes('state')) {
      return AutoBattleErrorTypes.STATE
    }

    if (message.includes('同步') || message.includes('sync')) {
      return AutoBattleErrorTypes.SYNC
    }

    if (message.includes('定时器') || message.includes('timer') || message.includes('timeout')) {
      return AutoBattleErrorTypes.TIMER
    }

    if (message.includes('缓存') || message.includes('cache')) {
      return AutoBattleErrorTypes.CACHE
    }

    return AutoBattleErrorTypes.UNKNOWN
  }

  /**
   * 确定错误严重程度
   * @private
   * @param {string} errorType - 错误类型
   * @param {Error} error - 错误对象
   * @returns {string}
   */
  _determineSeverity (errorType) {
    if (errorType === AutoBattleErrorTypes.INITIALIZATION) {
      return AutoBattleErrorSeverity.ERROR
    }

    if (errorType === AutoBattleErrorTypes.PLAYER_DATA) {
      return AutoBattleErrorSeverity.CRITICAL
    }

    if (errorType === AutoBattleErrorTypes.MONSTER_DATA) {
      return AutoBattleErrorSeverity.WARNING
    }

    if (errorType === AutoBattleErrorTypes.SKILL) {
      return AutoBattleErrorSeverity.WARNING
    }

    if (errorType === AutoBattleErrorTypes.CONFIG) {
      return AutoBattleErrorSeverity.INFO
    }

    return AutoBattleErrorSeverity.ERROR
  }

  /**
   * 记录错误
   * @private
   * @param {Object} errorInfo - 错误信息
   */
  _logError (errorInfo) {
    const logMethod = this._getLogMethod(errorInfo.severity)

    logMethod('AutoBattleErrorHandler', `[${errorInfo.type}] ${errorInfo.message}`, errorInfo)
  }

  /**
   * 获取日志方法
   * @private
   * @param {string} severity - 严重程度
   * @returns {Function}
   */
  _getLogMethod (severity) {
    switch (severity) {
    case AutoBattleErrorSeverity.INFO:
      return console.info.bind(console)
    case AutoBattleErrorSeverity.WARNING:
      return console.warn.bind(console)
    case AutoBattleErrorSeverity.ERROR:
    case AutoBattleErrorSeverity.CRITICAL:
      return console.error.bind(console)
    default:
      return console.debug.bind(console)
    }
  }

  /**
   * 通知用户
   * @private
   * @param {Object} errorInfo - 错误信息
   * @param {string} customMessage - 自定义消息
   */
  _notifyUser (errorInfo, customMessage) {
    const userMessage = customMessage || this._getUserFriendlyMessage(errorInfo)

    const callbacks = this.errorCallbacks[errorInfo.severity]
    callbacks.forEach(callback => {
      try {
        callback(userMessage, errorInfo)
      } catch (err) {
        console.error('错误回调执行失败:', err)
      }
    })
  }

  /**
   * 获取用户友好的错误消息
   * @private
   * @param {Object} errorInfo - 错误信息
   * @returns {string}
   */
  _getUserFriendlyMessage (errorInfo) {
    const messages = {
      [AutoBattleErrorTypes.INITIALIZATION]: '自动战斗初始化失败，请刷新页面重试',
      [AutoBattleErrorTypes.START]: '无法启动自动战斗，请检查怪物数据',
      [AutoBattleErrorTypes.STOP]: '自动战斗停止失败',
      [AutoBattleErrorTypes.PLAYER_DATA]: '玩家数据异常，自动战斗已停止',
      [AutoBattleErrorTypes.MONSTER_DATA]: '怪物数据异常，请刷新怪物',
      [AutoBattleErrorTypes.SKILL]: '技能使用失败，已跳过',
      [AutoBattleErrorTypes.CONFIG]: '配置更新失败',
      [AutoBattleErrorTypes.NETWORK]: '网络连接异常',
      [AutoBattleErrorTypes.UNKNOWN]: '发生未知错误'
    }

    return messages[errorInfo.type] || messages[AutoBattleErrorTypes.UNKNOWN]
  }

  /**
   * 触发停止自动战斗
   * @private
   */
  _triggerStopAutoBattle () {
    autoBattleEventBus.emit('auto-battle:stop', { reason: 'error' })
  }

  /**
   * 尝试重试
   * @private
   * @param {Object} errorInfo - 错误信息
   * @returns {Promise<Object>}
   */
  async _attemptRetry () {
    const maxRetries = 3
    const baseDelay = 1000
    const maxDelay = 10000

    for (let i = 0; i < maxRetries; i++) {
      try {
        const delay = Math.min(baseDelay * Math.pow(2, i), maxDelay)
        const jitter = Math.random() * 0.1 * delay
        const actualDelay = delay + jitter

        console.debug(
          'AutoBattleErrorHandler',
          `重试 ${i + 1}/${maxRetries}，延迟: ${actualDelay.toFixed(0)}ms`
        )

        await new Promise(resolve => setTimeout(resolve, actualDelay))

        return { success: true, attempt: i + 1, delay: actualDelay }
      } catch (err) {
        console.warn('AutoBattleErrorHandler', `重试 ${i + 1} 失败:`, err.message)

        if (i === maxRetries - 1) {
          return { success: false, attempts: maxRetries, lastError: err }
        }
      }
    }

    return { success: false, attempts: maxRetries }
  }

  /**
   * 添加到历史记录
   * @private
   * @param {Object} errorInfo - 错误信息
   */
  _addToHistory (errorInfo) {
    this.errorHistory.push(errorInfo)

    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift()
    }
  }

  /**
   * 注册错误回调
   * @param {string} severity - 严重程度
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消注册的函数
   */
  onError (severity, callback) {
    if (!this.errorCallbacks[severity]) {
      return () => {}
    }

    this.errorCallbacks[severity].push(callback)

    const unregister = () => {
      const index = this.errorCallbacks[severity].indexOf(callback)
      if (index > -1) {
        this.errorCallbacks[severity].splice(index, 1)
      }
    }

    return unregister
  }

  /**
   * 获取错误历史记录
   * @param {string} type - 可选的错误类型过滤
   * @returns {Array}
   */
  getHistory (type = null) {
    if (type) {
      return this.errorHistory.filter(error => error.type === type)
    }
    return [...this.errorHistory]
  }

  /**
   * 清空错误历史记录
   */
  clearHistory () {
    this.errorHistory = []
  }

  /**
   * 获取错误统计
   * @returns {Object}
   */
  getStats () {
    const stats = {
      total: this.errorHistory.length,
      byType: {},
      bySeverity: {}
    }

    this.errorHistory.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1
    })

    return stats
  }

  /**
   * 清空所有回调
   */
  clearAllCallbacks () {
    Object.keys(this.errorCallbacks).forEach(severity => {
      this.errorCallbacks[severity] = []
    })
  }

  registerRecoveryStrategy (errorType, strategy) {
    if (AutoBattleErrorTypes[errorType]) {
      this.recoveryStrategies[errorType] = strategy
      console.debug('AutoBattleErrorHandler', `注册错误恢复策略: ${errorType}`)
      return () => {
        delete this.recoveryStrategies[errorType]
      }
    }
    return () => {}
  }

  getRecoveryStrategies () {
    return Object.keys(this.recoveryStrategies)
  }
}

const autoBattleErrorHandler = new AutoBattleErrorHandler()

export function handleAutoBattleError (error, context, options = {}) {
  return autoBattleErrorHandler.handle(error, context, options)
}

export default autoBattleErrorHandler
