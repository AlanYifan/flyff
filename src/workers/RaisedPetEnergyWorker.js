/**
 * @fileoverview 训养宠物能量消耗 Web Worker
 * @description 在独立线程中管理训养宠物的能量定时消耗，完全不阻塞主线程。
 *
 * 核心设计：
 * 1. Worker 内部维护能量数值和递归 setTimeout 定时器
 * 2. 每 60 秒消耗 1 点能量，通过 postMessage 通知主线程
 * 3. 主线程接收消息后只做轻量 Store 更新（赋值 + 定向 $patch + 签名比对）
 * 4. 能量耗尽时自动停止并发送 depleted 事件
 * 5. 支持外部能量刷新（糖果补满），通过 update-energy 消息同步新值
 *
 * 通信协议：
 * 主线程 → Worker:
 *   { type: 'start', petKey, energy, maxEnergy }     启动能量消耗
 *   { type: 'stop' }                                  停止能量消耗
 *   { type: 'update-energy', energy, maxEnergy? }     外部刷新能量（糖果等）
 *
 * Worker → 主线程:
 *   { type: 'energy-drain', energy, maxEnergy }       能量消耗通知
 *   { type: 'energy-depleted' }                       能量耗尽通知
 *   { type: 'log', level, args }                      日志消息
 *
 * @author FLYFF Team
 * @version 1.0.0
 * @created 2026-07-12
 */

/** 能量消耗间隔（毫秒），每 60 秒消耗 1 点 */
const DRAIN_INTERVAL_MS = 60 * 1000

/** 当前能量值 */
let currentEnergy = 0

/** 最大能量值 */
let maxEnergy = 0

/** 递归 setTimeout 定时器 ID */
let drainTimer = null

/** 是否正在运行 */
let isRunning = false

/**
 * 日志输出辅助函数
 * @param {'info'|'warn'|'error'} level - 日志级别
 * @param  {...any} args - 日志参数
 * @returns {void}
 */
function log (level, ...args) {
  self.postMessage({ type: 'log', level, args })
}

/**
 * 执行一次能量消耗
 * 消耗 1 点能量后通知主线程，若能量耗尽则发送 depleted 事件并停止
 * @returns {void}
 */
function performDrain () {
  if (currentEnergy > 0) {
    currentEnergy = Math.max(0, currentEnergy - 1)

    self.postMessage({
      type: 'energy-drain',
      energy: currentEnergy,
      maxEnergy
    })

    if (currentEnergy === 0) {
      log('info', '[RaisedPetEnergyWorker] 能量已耗尽')
      self.postMessage({ type: 'energy-depleted' })
      stopDrain()
      return
    }
  }

  // 安排下一次消耗
  drainTimer = setTimeout(performDrain, DRAIN_INTERVAL_MS)
}

/**
 * 启动能量消耗定时器
 * @param {Object} data - 启动参数
 * @param {string} data.petKey - 宠物唯一标识
 * @param {number} data.energy - 初始能量
 * @param {number} data.maxEnergy - 最大能量
 * @returns {void}
 */
function startDrain (data) {
  stopDrain()

  currentEnergy = Number.isFinite(data.energy) ? Math.max(0, Math.floor(data.energy)) : 0
  maxEnergy = Number.isFinite(data.maxEnergy) ? Math.max(0, Math.floor(data.maxEnergy)) : 0

  if (currentEnergy <= 0) {
    log('info', '[RaisedPetEnergyWorker] 能量为 0，不启动消耗定时器')
    return
  }

  isRunning = true
  log('info', `[RaisedPetEnergyWorker] 启动能量消耗: ${currentEnergy}/${maxEnergy}`)
  drainTimer = setTimeout(performDrain, DRAIN_INTERVAL_MS)
}

/**
 * 停止能量消耗定时器
 * @returns {void}
 */
function stopDrain () {
  if (drainTimer) {
    clearTimeout(drainTimer)
    drainTimer = null
  }
  isRunning = false
}

/**
 * 外部刷新能量（糖果补满等场景）
 * 更新能量值，若定时器未运行且能量 > 0 则重新启动
 * @param {Object} data - 更新参数
 * @param {number} data.energy - 新能量值
 * @param {number} [data.maxEnergy] - 新最大能量值（可选）
 * @returns {void}
 */
function updateEnergy (data) {
  const newEnergy = Number.isFinite(data.energy) ? Math.max(0, Math.floor(data.energy)) : 0
  if (data.maxEnergy !== undefined && Number.isFinite(data.maxEnergy)) {
    maxEnergy = Math.max(0, Math.floor(data.maxEnergy))
  }

  currentEnergy = newEnergy

  log('info', `[RaisedPetEnergyWorker] 能量更新: ${currentEnergy}/${maxEnergy}`)

  // 如果能量 > 0 但定时器未运行，重新启动
  if (currentEnergy > 0 && !isRunning) {
    isRunning = true
    drainTimer = setTimeout(performDrain, DRAIN_INTERVAL_MS)
  } else if (currentEnergy === 0 && isRunning) {
    // 能量被清零，停止定时器
    stopDrain()
    self.postMessage({ type: 'energy-depleted' })
  }
  // 如果定时器已在运行，不需要重启（它会继续按原间隔执行）
}

/**
 * 监听主线程消息
 */
self.onmessage = function (event) {
  const { type, ...data } = event.data || {}

  switch (type) {
    case 'start':
      startDrain(data)
      break
    case 'stop':
      stopDrain()
      break
    case 'update-energy':
      updateEnergy(data)
      break
    default:
      break
  }
}
