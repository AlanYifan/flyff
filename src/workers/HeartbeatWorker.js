/**
 * @fileoverview 心跳检测 Web Worker
 * @description 在独立线程中定期发送心跳请求，不受主线程阻塞影响
 * 当主线程被卡住时（如加载28MB的ITEM_INFO数据），Worker中的fetch请求仍能正常发出，
 * 从而实现真正准确的服务端可用性检测
 *
 * 关键设计：
 * 1. 使用绝对路径直接请求Go后端，绕过Vite代理（避免代理层受主线程影响）
 *    开发模式下默认使用 http://localhost:8080/api/health 直连Go后端
 *    生产环境同源部署，使用相对路径 /api/health
 *    主线程启动时会通过 update-url 消息更新正确的URL
 * 2. 心跳成功时记录时间戳，主线程可据此判断是否为"陈旧断开消息"
 * 3. 连续失败后采用递增重试间隔（1分钟→3分钟→5分钟），降低高负载下的检测频率
 *    第1次失败：等待1分钟后重试
 *    第2次失败：等待3分钟后重试
 *    第3次失败：等待5分钟后重试，若仍失败则触发断开事件
 * 4. 使用递归 setTimeout 替代 setInterval，使每次检测可根据成功/失败状态使用不同间隔
 *
 * 通信协议：
 * 主线程 → Worker:
 *   { type: 'start' }                        开始心跳检测
 *   { type: 'stop' }                         停止心跳检测
 *   { type: 'update-url', url }              更新心跳请求URL
 *   { type: 'update-interval', interval }    更新心跳检测间隔（毫秒）
 *
 * Worker → 主线程:
 *   { type: 'success', timestamp }            心跳成功（含时间戳）
 *   { type: 'failure', count, threshold }      心跳失败
 *   { type: 'disconnected', failTimestamp }    连续失败达阈值（含最后失败时间戳）
 *   { type: 'log', level, args }               日志消息
 *
 * @author FLYFF Team
 * @version 1.3.0
 * @created 2026-06-21
 * @updated 2026-07-05 递增重试间隔：1分钟→3分钟→5分钟，降低高负载下的误判断开
 */

/** 默认心跳检测间隔（毫秒），待机状态60秒 */
const DEFAULT_INTERVAL_MS = 60000

/** 当前心跳检测间隔（毫秒），由主线程通过 update-interval 消息动态更新 */
let currentIntervalMs = DEFAULT_INTERVAL_MS

/** 连续失败阈值：连续失败此次数后触发断开事件 */
const FAILURE_THRESHOLD = 3

/**
 * 失败后递增重试间隔（毫秒）
 * 第1次失败后等待1分钟重试，第2次失败后等待3分钟重试，第3次失败后等待5分钟重试
 * 若失败次数超出数组长度，使用最后一个值
 */
const FAILURE_BACKOFF_INTERVALS = Object.freeze([
  60 * 1000,   // 第1次失败 → 1分钟后重试
  180 * 1000,  // 第2次失败 → 3分钟后重试
  300 * 1000   // 第3次失败 → 5分钟后重试
])

/** 心跳请求超时时间（毫秒） */
const HEARTBEAT_TIMEOUT_MS = 8000

/**
 * 心跳请求URL
 * 开发模式：使用绝对路径 http://localhost:8080/api/health 直连Go后端
 *   原因：相对路径 /api/health 在dev模式下走Vite代理，
 *   Vite代理运行在主线程中，主线程阻塞时代理也无法响应，导致心跳超时产生误判
 * 生产模式：使用相对路径 /api/health（前端和后端同源）
 *
 * 主线程启动时会通过 update-url 消息动态更新此值
 */
let healthUrl = 'http://localhost:8080/api/health'

/** 心跳定时器ID（递归 setTimeout） */
let heartbeatTimer = null

/** 连续失败计数 */
let failureCount = 0

/** 是否已触发断开事件（防止重复触发） */
let disconnectTriggered = false

/** 是否正在执行心跳请求（防止并发） */
let isChecking = false

/** 上次心跳成功的时间戳 */
let lastSuccessTime = 0

/**
 * 发送心跳请求
 * 使用 fetch API（Worker中可用）检测服务端是否在线
 * 成功则重置失败计数并按正常间隔安排下次检测
 * 失败则按递增间隔安排重试，连续失败达阈值则通知主线程断开
 * @returns {void}
 */
async function checkHealth () {
  // 防止并发请求
  if (isChecking) return
  isChecking = true

  let checkSucceeded = false

  try {
    // 使用 AbortController 实现超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), HEARTBEAT_TIMEOUT_MS)

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        // 标识心跳请求，服务端日志中便于区分
        'X-Heartbeat': 'true'
      }
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      // 心跳成功，重置失败计数
      lastSuccessTime = Date.now()
      if (failureCount > 0) {
        self.postMessage({ type: 'log', level: 'info', args: ['[HeartbeatWorker] 服务端已恢复连接'] })
      }
      failureCount = 0
      disconnectTriggered = false
      self.postMessage({ type: 'success', timestamp: lastSuccessTime })
      checkSucceeded = true
    } else {
      // HTTP错误状态码（如500、502等）
      handleFailure(`HTTP ${response.status}`)
    }
  } catch (error) {
    // 网络错误或超时
    const reason = error.name === 'AbortError' ? '请求超时' : (error.message || '网络错误')
    handleFailure(reason)
  } finally {
    isChecking = false
  }

  // 成功时按正常间隔安排下一次检测（失败时由 handleFailure 安排递增间隔）
  if (checkSucceeded && !disconnectTriggered) {
    scheduleNextHeartbeat(currentIntervalMs)
  }
}

/**
 * 处理心跳失败
 * 连续失败达阈值时通知主线程触发断开事件
 * 失败后按递增间隔（1分钟→3分钟→5分钟）安排下一次重试
 * @param {string} reason - 失败原因
 * @returns {void}
 */
function handleFailure (reason) {
  if (disconnectTriggered) return

  failureCount += 1
  self.postMessage({ type: 'failure', count: failureCount, threshold: FAILURE_THRESHOLD })
  self.postMessage({ type: 'log', level: 'warn', args: [`[HeartbeatWorker] 心跳失败 (${failureCount}/${FAILURE_THRESHOLD})`, reason] })

  if (failureCount >= FAILURE_THRESHOLD) {
    disconnectTriggered = true
    const failTimestamp = Date.now()
    self.postMessage({ type: 'log', level: 'warn', args: ['[HeartbeatWorker] 服务端连续无响应，触发断开事件'] })
    // 发送断开事件时附带失败时间戳，主线程可据此判断是否为陈旧消息
    self.postMessage({ type: 'disconnected', failTimestamp })
    stopHeartbeat()
    return
  }

  // 未达阈值，按递增间隔安排下一次重试
  const backoffIndex = Math.min(failureCount - 1, FAILURE_BACKOFF_INTERVALS.length - 1)
  const backoffMs = FAILURE_BACKOFF_INTERVALS[backoffIndex]
  self.postMessage({ type: 'log', level: 'info', args: [`[HeartbeatWorker] 将在 ${Math.round(backoffMs / 1000)} 秒后重试（第${failureCount}次失败）`] })

  scheduleNextHeartbeat(backoffMs)
}

/**
 * 安排下一次心跳检测
 * 使用递归 setTimeout，使每次检测可根据成功/失败状态使用不同间隔
 * @param {number} intervalMs - 下次检测的间隔（毫秒）
 * @returns {void}
 */
function scheduleNextHeartbeat (intervalMs) {
  if (disconnectTriggered) return

  if (heartbeatTimer) {
    clearTimeout(heartbeatTimer)
  }
  heartbeatTimer = setTimeout(checkHealth, intervalMs)
}

/**
 * 启动心跳检测定时器
 * @returns {void}
 */
function startHeartbeat () {
  if (heartbeatTimer) return

  failureCount = 0
  disconnectTriggered = false
  isChecking = false

  // 立即执行一次检测（检测完成后会自动安排下一次）
  checkHealth()
}

/**
 * 停止心跳检测并清理定时器
 * @returns {void}
 */
function stopHeartbeat () {
  if (heartbeatTimer) {
    clearTimeout(heartbeatTimer)
    heartbeatTimer = null
  }
  isChecking = false
}

/**
 * 更新心跳检测间隔并重启定时器
 * 如果新间隔与当前间隔不同，则重启定时器使新间隔立即生效
 * 注意：失败重试期间不中断递增间隔逻辑，仅在正常检测期间生效
 * @param {number} intervalMs - 新的心跳检测间隔（毫秒）
 * @returns {void}
 */
function updateInterval (intervalMs) {
  const newInterval = Number(intervalMs)
  if (!Number.isFinite(newInterval) || newInterval < 1000) return

  if (newInterval === currentIntervalMs) return

  currentIntervalMs = newInterval

  // 如果定时器正在运行且当前无失败重试中，重启以应用新间隔
  // 失败重试期间不中断递增间隔逻辑
  if (heartbeatTimer && failureCount === 0) {
    clearTimeout(heartbeatTimer)
    heartbeatTimer = setTimeout(checkHealth, currentIntervalMs)
  }
}

/**
 * 监听主线程消息
 */
self.onmessage = function (event) {
  const { type, url, interval } = event.data || {}

  switch (type) {
    case 'start':
      startHeartbeat()
      break
    case 'stop':
      stopHeartbeat()
      break
    case 'update-url':
      if (url && typeof url === 'string') {
        healthUrl = url
      }
      break
    case 'update-interval':
      updateInterval(interval)
      break
    default:
      break
  }
}
