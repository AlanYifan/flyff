/**
 * @fileoverview 服务端心跳检测服务
 * @description 使用 Web Worker 在独立线程中定期发送心跳请求，检测服务端是否在线
 * 当连续检测失败时，派发 server-disconnected 全局事件，
 * 由 App.vue 显示断开连接遮罩并跳转登录页
 *
 * 失败重试策略（递增间隔）：
 * 心跳检测失败后采用递增间隔重试，降低高负载下的误判断开：
 *   第1次失败 → 等待1分钟后重试
 *   第2次失败 → 等待3分钟后重试
 *   第3次失败 → 等待5分钟后重试，若仍失败则触发断开事件
 * 心跳成功后立即恢复正常检测间隔
 *
 * 为什么使用 Web Worker：
 * 前端主线程在加载大型数据（如28MB的ITEM_INFO）时会被长时间阻塞，
 * 导致 setInterval 回调无法按时执行、axios请求无法发出/处理，
 * 从而产生"伪断开"——服务端实际正常，但前端误判为断开。
 * Web Worker 运行在独立线程，不受主线程阻塞影响，心跳请求始终能正常发出和响应。
 *
 * 为什么心跳请求必须直连Go后端（绕过Vite代理）：
 * Vite的dev server代理运行在主线程中。当主线程阻塞时：
 * 1. Worker的心跳请求如果走Vite代理（/api/health），代理无法响应 → 心跳超时
 * 2. 主线程的二次确认请求如果走Vite代理，同样无法发出 → 二次确认必定失败
 * 3. 结果：服务端正常，但心跳和二次确认都失败 → 误跳转登录页
 * 解决方案：Worker和二次确认都使用绝对路径直连Go后端（http://localhost:8080/api/health），
 * 彻底绕过Vite代理，主线程阻塞不影响心跳检测。
 *
 * 陈旧断开消息处理：
 * 主线程阻塞期间，Worker可能已判定断开并排队了disconnected消息。
 * 主线程恢复后，这些消息可能已经"陈旧"（服务端实际正常）。
 * 通过检测lastWorkerSuccessTime与当前时间的差距，判断断开消息是否可能为陈旧消息：
 * - 如果距上次成功超过2个心跳周期，说明主线程曾长时间阻塞，断开消息可能不可靠
 * - 此时先等待主线程网络栈恢复（500ms延迟），再做二次确认
 * - 二次确认使用绝对路径直连Go后端，不受主线程状态影响
 *
 * @author FLYFF Team
 * @version 2.2.0
 * @created 2026-06-20
 * @updated 2026-06-21 修复：Worker和二次确认都直连Go后端，绕过Vite代理防止主线程阻塞时误判断开
 */

import axios from 'axios'
import { watch } from 'vue'
import { useAutoBattleStore } from '@/store/autoBattle'

/** 心跳 Web Worker 实例 */
let heartbeatWorker = null

/** 是否已触发断开事件（防止重复触发） */
let disconnectTriggered = false

/** 心跳检测是否正在运行 */
let isRunning = false

/** 是否已就绪（Main页面初始化完成后才开始真正的心跳检测） */
let readyToCheck = false

/** 等待就绪期间的轮询定时器 */
let readyPoller = null

/** 启动延迟定时器ID */
let startupDelayTimer = null

/** Worker 最近一次心跳成功的时间戳 */
let lastWorkerSuccessTime = 0

/**
 * 心跳启动延迟时间（毫秒）
 * Vite dev server 启动比 Go 后端快，前端立即发心跳请求会遇到 ECONNREFUSED
 * 延迟 10 秒等待 Go 后端完全就绪后再开始检测，避免启动期间误判断开
 */
const STARTUP_DELAY_MS = 10000

/** 二次确认请求超时时间（毫秒） */
const VERIFY_TIMEOUT_MS = 8000

/** 待机状态心跳间隔（毫秒） */
const IDLE_INTERVAL_MS = 60000

/** 自动战斗状态心跳间隔（毫秒） */
const BATTLE_INTERVAL_MS = 100000

/** 自动战斗状态 watcher 取消函数 */
let autoBattleWatcherStop = null

/**
 * 直连Go后端的健康检查URL
 * 开发模式：http://localhost:8080/api/health（绕过Vite代理）
 * 生产模式：/api/health（同源部署）
 * 主线程阻塞时Vite代理无法响应，必须直连Go后端才能准确检测服务端状态
 */
let directHealthUrl = '/api/health'

/**
 * 检测并设置直连Go后端的URL
 * 开发环境下使用绝对路径直连Go后端，绕过Vite代理
 * 生产环境下使用相对路径（同源部署）
 * @returns {void}
 */
function detectDirectHealthUrl () {
  const isDev = import.meta.env.DEV === true
  if (isDev) {
    // 开发模式：直连Go后端HTTP端口，绕过Vite代理
    directHealthUrl = 'http://localhost:8080/api/health'
  } else {
    // 生产模式：同源部署，使用相对路径
    directHealthUrl = '/api/health'
  }
}

/**
 * 初始化 Web Worker 实例
 * 创建 Worker 并监听消息，根据消息类型派发对应事件
 * @returns {void}
 */
function initWorker () {
  if (heartbeatWorker) return

  try {
    heartbeatWorker = new Worker(
      new URL('../workers/HeartbeatWorker.js', import.meta.url),
      { type: 'module' }
    )
  } catch (error) {
    console.error('[HeartbeatService] 创建 Web Worker 失败，回退到主线程模式:', error)
    return
  }

  // 初始化后立即通知Worker使用正确的直连URL
  heartbeatWorker.postMessage({ type: 'update-url', url: directHealthUrl })

  heartbeatWorker.onmessage = function (event) {
    const { type } = event.data || {}

    switch (type) {
      case 'success':
        // 心跳成功，重置断开标记
        disconnectTriggered = false
        lastWorkerSuccessTime = event.data.timestamp || Date.now()
        break

      case 'failure':
        // 心跳失败（Worker中已计数），无需主线程额外处理
        break

      case 'disconnected':
        // Worker判定连续失败达阈值，执行二次确认后再决定是否跳转
        handleWorkerDisconnected(event.data.failTimestamp)
        break

      case 'log': {
        // 委托主线程输出日志（Worker中console输出在某些环境不可见）
        const { level, args } = event.data
        const logFn = level === 'warn' ? console.warn
          : level === 'error' ? console.error
            : console.log
        if (Array.isArray(args)) {
          logFn(...args)
        }
        break
      }

      default:
        break
    }
  }

  heartbeatWorker.onerror = function (error) {
    console.error('[HeartbeatService] Web Worker 错误:', error)
  }
}

/**
 * 处理 Worker 报告的服务端断开事件
 * 执行二次确认：在主线程发一次验证请求，确认服务端是否真的不可达
 * 如果验证成功则说明是误判（主线程刚恢复/网络短暂波动），重置状态继续运行
 *
 * 陈旧消息检测：
 * 如果距Worker上次成功心跳超过2个心跳周期，说明主线程可能曾长时间阻塞，
 * Worker的断开判定可能基于陈旧信息。此时先延迟500ms等待主线程网络栈恢复，再做验证。
 *
 * @param {number} [failTimestamp] - Worker报告断开时的时间戳
 * @returns {void}
 */
async function handleWorkerDisconnected (failTimestamp) {
  if (disconnectTriggered) return

  console.warn('[HeartbeatService] Worker 报告服务端断开，开始二次确认...')

  // 陈旧消息检测：如果距上次成功心跳时间过长，说明主线程可能曾阻塞
  // Worker在主线程阻塞期间可能产生了基于陈旧信息的断开判定
  const now = Date.now()
  const timeSinceLastSuccess = now - lastWorkerSuccessTime
  const twoHeartbeatCycles = 2 * IDLE_INTERVAL_MS // 2个心跳周期（120秒）

  if (lastWorkerSuccessTime > 0 && timeSinceLastSuccess > twoHeartbeatCycles) {
    // 主线程可能刚从阻塞中恢复，网络栈可能还不稳定
    // 延迟一小段时间让网络栈恢复后再做验证
    const staleInfo = failTimestamp
      ? `（断开消息产生于 ${Math.round((now - failTimestamp) / 1000)} 秒前）`
      : `（距上次成功心跳 ${Math.round(timeSinceLastSuccess / 1000)} 秒）`
    console.warn(`[HeartbeatService] 检测到可能的陈旧断开消息 ${staleInfo}，延迟验证等待网络恢复...`)
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  try {
    // 二次确认：使用绝对路径直连Go后端，绕过Vite代理
    // 主线程阻塞时Vite代理无法响应，只有直连才能准确判断服务端是否在线
    await axios.get(directHealthUrl, { timeout: VERIFY_TIMEOUT_MS })

    // 验证成功！服务端实际正常，这是误判
    console.warn('[HeartbeatService] 二次确认成功：服务端正常，重置状态继续运行')
    disconnectTriggered = false
    lastWorkerSuccessTime = Date.now()

    // 通知 Worker 重新开始心跳（之前 Worker 已 stopHeartbeat）
    if (heartbeatWorker) {
      // 确保 Worker 使用正确的直连URL
      heartbeatWorker.postMessage({ type: 'update-url', url: directHealthUrl })
      heartbeatWorker.postMessage({ type: 'start' })
    }
    return
  } catch (verifyError) {
    // 验证也失败了，服务端确实不可达
    console.warn('[HeartbeatService] 二次确认失败：服务端确实不可达', verifyError.code || verifyError.message || '')
  }

  // 确认服务端真的断开，派发断开事件
  disconnectTriggered = true

  try {
    const disconnectEvent = new CustomEvent('server-disconnected')
    window.dispatchEvent(disconnectEvent)
  } catch (e) {
    console.error('[HeartbeatService] 派发断开事件失败:', e)
  }
}

/**
 * 根据自动战斗状态更新心跳检测间隔
 * 待机状态：60秒检测一次
 * 自动战斗状态：100秒检测一次
 * @param {boolean} isBattling - 是否正在自动战斗
 * @returns {void}
 */
function updateHeartbeatInterval (isBattling) {
  if (!heartbeatWorker) return

  const interval = isBattling ? BATTLE_INTERVAL_MS : IDLE_INTERVAL_MS
  heartbeatWorker.postMessage({ type: 'update-interval', interval })
}

/**
 * 启动自动战斗状态监听
 * 监听 autoBattleStore.isActive 变化，动态切换心跳间隔
 * @returns {void}
 */
function startAutoBattleWatcher () {
  if (autoBattleWatcherStop) return

  try {
    const autoBattleStore = useAutoBattleStore()

    autoBattleWatcherStop = watch(
      () => autoBattleStore.isActive,
      isActive => {
        updateHeartbeatInterval(isActive)
      },
      { immediate: false }
    )
  } catch (error) {
    console.error('[HeartbeatService] 启动自动战斗状态监听失败:', error)
  }
}

/**
 * 停止自动战斗状态监听
 * @returns {void}
 */
function stopAutoBattleWatcher () {
  if (autoBattleWatcherStop) {
    autoBattleWatcherStop()
    autoBattleWatcherStop = null
  }
}

/**
 * 启动真正的心跳检测
 * 通过 Worker 发送开始指令，并启动自动战斗状态监听
 * @returns {void}
 */
function startRealHeartbeat () {
  if (!heartbeatWorker) return

  disconnectTriggered = false
  // 确保 Worker 使用正确的直连URL
  heartbeatWorker.postMessage({ type: 'update-url', url: directHealthUrl })

  // 根据当前自动战斗状态设置初始间隔
  try {
    const autoBattleStore = useAutoBattleStore()
    const initialInterval = autoBattleStore.isActive ? BATTLE_INTERVAL_MS : IDLE_INTERVAL_MS
    heartbeatWorker.postMessage({ type: 'update-interval', interval: initialInterval })
  } catch (_) {
    // store 未就绪时使用默认待机间隔
  }

  heartbeatWorker.postMessage({ type: 'start' })

  // 启动自动战斗状态监听
  startAutoBattleWatcher()
}

/**
 * 通知心跳服务：Main页面已初始化完成，可以开始心跳检测
 * 由 Main 页面在 initGame 完成后调用
 * @returns {void}
 */
export function notifyMainReady () {
  readyToCheck = true

  // 如果心跳已在运行但一直等不到就绪，现在可以启动真正的心跳了
  if (isRunning && heartbeatWorker) {
    startRealHeartbeat()
  }

  // 清除就绪轮询器
  if (readyPoller) {
    clearInterval(readyPoller)
    readyPoller = null
  }
}

/**
 * 启动心跳检测
 * 进入Main页面时调用，但会等待页面初始化完成后再开始真正的心跳
 * 避免在加载重型数据期间因网络请求超时而误判断开
 * @returns {void}
 */
export function startHeartbeat () {
  if (isRunning) return

  // 登录/注册页面不启用心跳（有自己的 ServerStatusBar 组件检测）
  const pathname = window.location.pathname
  if (pathname === '/' || pathname === '/register') return

  isRunning = true
  disconnectTriggered = false
  readyToCheck = false

  // 检测直连Go后端的URL（开发模式vs生产模式）
  detectDirectHealthUrl()

  // 初始化 Web Worker
  initWorker()

  // 启动延迟：等待 Go 后端完全就绪后再开始心跳检测
  startupDelayTimer = setTimeout(() => {
    startupDelayTimer = null

    // 如果Main页面已就绪，直接启动心跳
    if (readyToCheck) {
      startRealHeartbeat()
      return
    }

    // Main页面尚未就绪，等待就绪通知
    // 设置轮询器定期检查就绪状态（兜底机制，防止 notifyMainReady 未被调用）
    readyPoller = setInterval(() => {
      if (readyToCheck) {
        clearInterval(readyPoller)
        readyPoller = null
        startRealHeartbeat()
      }
    }, 2000)
  }, STARTUP_DELAY_MS)
}

/**
 * 停止心跳检测
 * 通知 Worker 停止并清理资源
 * @returns {void}
 */
export function stopHeartbeat () {
  if (heartbeatWorker) {
    heartbeatWorker.postMessage({ type: 'stop' })
  }

  stopAutoBattleWatcher()

  if (readyPoller) {
    clearInterval(readyPoller)
    readyPoller = null
  }
  if (startupDelayTimer) {
    clearTimeout(startupDelayTimer)
    startupDelayTimer = null
  }

  isRunning = false
}

/**
 * 重置心跳状态（登录后重新开始检测）
 * @returns {void}
 */
export function resetHeartbeat () {
  stopHeartbeat()
  disconnectTriggered = false
  readyToCheck = false
  lastWorkerSuccessTime = 0

  // 终止并重建 Worker 实例，确保状态完全干净
  // Worker内部状态（failureCount、currentIntervalMs等）会随terminate一起清除
  if (heartbeatWorker) {
    heartbeatWorker.terminate()
    heartbeatWorker = null
  }
}
