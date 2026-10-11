/**
 * 错误处理服务
 * 统一处理应用中的错误，提供友好的错误提示和日志记录
 */

export class ErrorHandler {
  static errorCount = 0
  static maxErrorCount = 10
  static isMonitoring = false

  /**
   * 处理错误
   * @param {Error} error - 错误对象
   * @param {string} context - 错误发生的上下文
   * @param {Object} data - 附加数据
   */
  static handle (error, context = '', data = null) {
    this.errorCount++

    const errorInfo = {
      message: error.message || '未知错误',
      stack: error.stack,
      context,
      data,
      timestamp: new Date().toISOString(),
      errorCount: this.errorCount
    }

    console.error(context || 'Global', `错误发生: ${error.message}`, errorInfo)

    if (import.meta.env.PROD) {
      this.sendToMonitoring(errorInfo)
    }

    if (this.errorCount >= this.maxErrorCount) {
      console.error('ErrorHandler', `错误次数过多(${this.errorCount})，可能需要重启应用`)
      this.disableMonitoring()
    }
  }

  /**
   * 处理异步错误
   * @param {Error} error - 错误对象
   * @param {string} context - 错误发生的上下文
   */
  static handleAsync (error, context = '') {
    if (error instanceof Error) {
      this.handle(error, context)
    } else {
      this.handle(new Error(String(error)), context)
    }
  }

  /**
   * 包装异步函数，自动捕获错误
   * @param {Function} fn - 异步函数
   * @param {string} context - 错误发生的上下文
   * @returns {Function} 包装后的函数
   */
  static wrapAsync (fn, context = '') {
    return async (...args) => {
      try {
        return await fn(...args)
      } catch (error) {
        this.handle(error, context, { args })
        throw error
      }
    }
  }

  /**
   * 包装同步函数，自动捕获错误
   * @param {Function} fn - 同步函数
   * @param {string} context - 错误发生的上下文
   * @returns {Function} 包装后的函数
   */
  static wrapSync (fn, context = '') {
    return (...args) => {
      try {
        return fn(...args)
      } catch (error) {
        this.handle(error, context, { args })
        throw error
      }
    }
  }

  /**
   * 发送错误到监控服务
   * @param {Object} errorInfo - 错误信息
   */
  static sendToMonitoring (errorInfo) {
    if (typeof window !== 'undefined' && window.Sentry) {
      try {
        window.Sentry.captureException(new Error(errorInfo.message), {
          extra: errorInfo
        })
      } catch (e) {
        console.error('发送错误到监控服务失败:', e)
      }
    }
  }

  /**
   * 需要忽略的良性错误消息列表
   * @type {string[]}
   */
  static ignoredErrors = [
    'ResizeObserver loop completed with undelivered notifications',
    'ResizeObserver loop limit exceeded',
    'Network request failed',
    'Non-Error promise rejection captured'
  ]

  /**
   * 检查错误是否应该被忽略
   * @param {string} message - 错误消息
   * @returns {boolean} 是否应该忽略
   */
  static shouldIgnoreError (message) {
    if (!message) return false
    return this.ignoredErrors.some(ignored =>
      message.includes(ignored) || message === ignored
    )
  }

  /**
   * 启用错误监控
   */
  static enableMonitoring () {
    if (this.isMonitoring) {
      return
    }

    this.isMonitoring = true

    if (typeof window !== 'undefined') {
      window.addEventListener('error', event => {
        const message = event.error?.message || event.message || ''
        // 忽略良性错误（如 ResizeObserver 警告）
        if (this.shouldIgnoreError(message)) {
          return
        }
        this.handle(event.error || new Error(event.message), 'Window Error', {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        })
      })

      window.addEventListener('unhandledrejection', event => {
        const message = event.reason?.message || String(event.reason) || ''
        // 忽略良性错误
        if (this.shouldIgnoreError(message)) {
          return
        }
        this.handle(event.reason || new Error('Unhandled Promise Rejection'), 'Unhandled Rejection')
      })
    }

    console.info('ErrorHandler', '错误监控已启用')
  }

  /**
   * 禁用错误监控
   */
  static disableMonitoring () {
    this.isMonitoring = false
    console.info('ErrorHandler', '错误监控已禁用')
  }

  /**
   * 重置错误计数
   */
  static resetErrorCount () {
    this.errorCount = 0
    console.debug('ErrorHandler', '错误计数已重置')
  }

  /**
   * 获取错误统计
   * @returns {Object} 错误统计信息
   */
  static getErrorStats () {
    return {
      errorCount: this.errorCount,
      maxErrorCount: this.maxErrorCount,
      isMonitoring: this.isMonitoring
    }
  }

  /**
   * 创建安全的异步函数执行器
   * @param {Function} fn - 要执行的函数
   * @param {Function} onError - 错误回调
   * @returns {Function} 安全的执行器
   */
  static createSafeExecutor (fn, onError = null) {
    return async (...args) => {
      try {
        const result = await fn(...args)
        return { success: true, data: result }
      } catch (error) {
        if (onError) {
          onError(error)
        }
        return { success: false, error }
      }
    }
  }

  /**
   * 验证函数参数
   * @param {Object} params - 参数对象
   * @param {Array} required - 必需参数列表
   * @param {string} context - 上下文
   * @throws {Error} 参数验证失败时抛出错误
   */
  static validateParams (params, required, context = '') {
    const missing = required.filter(param => params[param] === undefined || params[param] === null)

    if (missing.length > 0) {
      const error = new Error(`缺少必需参数: ${missing.join(', ')}`)
      this.handle(error, context, { params, required })
      throw error
    }
  }

  /**
   * 验证对象类型
   * @param {*} value - 要验证的值
   * @param {string} expectedType - 期望的类型
   * @param {string} paramName - 参数名称
   * @param {string} context - 上下文
   * @throws {Error} 类型验证失败时抛出错误
   */
  static validateType (value, expectedType, paramName, context = '') {
    const actualType = typeof value

    if (actualType !== expectedType) {
      const error = new Error(
        `参数 ${paramName} 类型错误: 期望 ${expectedType}, 实际 ${actualType}`
      )
      this.handle(error, context, { value, expectedType, actualType })
      throw error
    }
  }
}

export default ErrorHandler
