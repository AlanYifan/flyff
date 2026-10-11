/**
 * @file useDungeonTimer.js
 * @description 副本倒计时与CD管理组合式函数
 * @description 管理副本的活跃期（倒计时）和冷却期（CD）状态
 * @description 活跃期内可自由出入副本，倒计时结束后进入CD期，CD期间不可进入
 * @description 状态持久化到 localStorage，按存档槽（角色）独立存储，页面刷新后可恢复
 * @description 每个账号下的角色拥有独立的副本CD记录，互不影响
 * @generated 2026-07-06
 */

import { ref } from 'vue'

/** 旧版全局存储键（向后兼容，无存档槽时回退使用） */
const DUNGEON_TIMERS_KEY_LEGACY = 'flyff_dungeon_timers'

/** 存储键前缀（按存档槽拼接后缀） */
const DUNGEON_TIMERS_KEY_PREFIX = 'flyff_dungeon_timers'

/** 会话级存档槽存储键（与 StorageService.SESSION_SAVE_SLOT_KEY 一致） */
const SESSION_SAVE_SLOT_KEY = 'sessionSaveSlot'

/** 旧版本地存档槽存储键（与 StorageService.CURRENT_SAVE_SLOT_KEY 一致） */
const CURRENT_SAVE_SLOT_KEY = 'currentSaveSlot'

/** 单例响应式状态，所有组件共享 */
const dungeonTimers = ref({})

/** 是否已初始化（防止重复加载） */
let initialized = false

/** 当前已加载的存档槽 ID，用于检测角色切换 */
let loadedSlotId = null

/**
 * 副本状态枚举
 * @readonly
 * @enum {string}
 */
export const DUNGEON_STATE = {
  /** 可进入（无记录或CD已结束） */
  AVAILABLE: 'available',
  /** 活跃期（倒计时进行中，可自由出入） */
  ACTIVE: 'active',
  /** 冷却中（倒计时已结束，CD未结束，不可进入） */
  COOLDOWN: 'cooldown'
}

/**
 * 解析时间字符串为毫秒数
 * 支持 '24小时'、'1小时'、'30分钟'、'45秒' 等格式
 * @param {string} timeStr - 时间字符串
 * @returns {number} 毫秒数，无法解析时返回0
 */
export const parseTimeToMs = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0
  const str = timeStr.trim()
  const hourMatch = str.match(/(\d+)\s*小时/)
  if (hourMatch) return parseInt(hourMatch[1], 10) * 3600 * 1000
  const minMatch = str.match(/(\d+)\s*分钟/)
  if (minMatch) return parseInt(minMatch[1], 10) * 60 * 1000
  const secMatch = str.match(/(\d+)\s*秒/)
  if (secMatch) return parseInt(secMatch[1], 10) * 1000
  return 0
}

/**
 * 获取今天的日期字符串
 * @returns {string} YYYY-MM-DD 格式
 */
const getTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 获取当前存档槽 ID
 * 优先从 sessionStorage 读取，回退到 localStorage
 * @returns {string|null} 存档槽 ID 字符串，或 null
 */
const getCurrentSlotId = () => {
  try {
    const sessionSlot = sessionStorage.getItem(SESSION_SAVE_SLOT_KEY)
    if (sessionSlot !== null && sessionSlot !== '') {
      return sessionSlot
    }
    const localSlot = localStorage.getItem(CURRENT_SAVE_SLOT_KEY)
    if (localSlot !== null && localSlot !== '') {
      return localSlot
    }
  } catch (error) {
    console.error('[useDungeonTimer] 获取当前存档槽失败:', error)
  }
  return null
}

/**
 * 获取当前存档槽对应的 localStorage 存储键
 * 每个角色（存档槽）使用独立的键，实现副本CD按角色独立
 * @returns {string} localStorage 存储键
 */
const getStorageKey = () => {
  const slotId = getCurrentSlotId()
  if (slotId === null) {
    // 无存档槽时回退到旧版全局键（向后兼容）
    return DUNGEON_TIMERS_KEY_LEGACY
  }
  return `${DUNGEON_TIMERS_KEY_PREFIX}_${slotId}`
}

/**
 * 从 localStorage 加载当前存档槽的副本时间状态
 */
const loadTimers = () => {
  try {
    const storageKey = getStorageKey()
    const data = localStorage.getItem(storageKey)
    if (data) {
      dungeonTimers.value = JSON.parse(data)
    } else {
      dungeonTimers.value = {}
    }
  } catch (error) {
    console.error('[useDungeonTimer] 加载副本时间状态失败:', error)
    dungeonTimers.value = {}
  }
}

/**
 * 保存副本时间状态到当前存档槽的 localStorage
 */
const saveTimers = () => {
  try {
    const storageKey = getStorageKey()
    localStorage.setItem(storageKey, JSON.stringify(dungeonTimers.value))
  } catch (error) {
    console.error('[useDungeonTimer] 保存副本时间状态失败:', error)
  }
}

/**
 * 清理已过期的CD记录
 * CD结束后的记录会被自动清除
 */
const cleanupExpiredTimers = () => {
  const now = Date.now()
  let changed = false
  for (const id in dungeonTimers.value) {
    const timer = dungeonTimers.value[id]
    // CD已结束，清理记录
    if (timer.cooldownEndsAt && now >= timer.cooldownEndsAt) {
      delete dungeonTimers.value[id]
      changed = true
    }
  }
  if (changed) saveTimers()
}

/**
 * 获取副本当前状态
 * @param {number} dungeonId - 副本ID
 * @returns {{ state: string, remainingMs: number, countdownEndsAt: number, cooldownEndsAt: number }}
 *   state: DUNGEON_STATE 枚举值
 *   remainingMs: 剩余毫秒数（活跃期为倒计时剩余，CD期为CD剩余）
 *   countdownEndsAt: 倒计时结束时间戳
 *   cooldownEndsAt: CD结束时间戳
 */
const getDungeonState = (dungeonId) => {
  const timer = dungeonTimers.value[dungeonId]
  if (!timer) {
    return { state: DUNGEON_STATE.AVAILABLE, remainingMs: 0, countdownEndsAt: 0, cooldownEndsAt: 0 }
  }

  const now = Date.now()

  // 活跃期：倒计时未结束
  if (now < timer.countdownEndsAt) {
    return {
      state: DUNGEON_STATE.ACTIVE,
      remainingMs: timer.countdownEndsAt - now,
      countdownEndsAt: timer.countdownEndsAt,
      cooldownEndsAt: timer.cooldownEndsAt
    }
  }

  // CD期：倒计时已结束但CD未结束
  if (now < timer.cooldownEndsAt) {
    return {
      state: DUNGEON_STATE.COOLDOWN,
      remainingMs: timer.cooldownEndsAt - now,
      countdownEndsAt: timer.countdownEndsAt,
      cooldownEndsAt: timer.cooldownEndsAt
    }
  }

  // CD已结束
  return { state: DUNGEON_STATE.AVAILABLE, remainingMs: 0, countdownEndsAt: 0, cooldownEndsAt: 0 }
}

/**
 * 记录副本进入（设置倒计时和CD时间线）
 * 如果已在活跃期内重入，不重置倒计时（允许自由出入）
 * @param {number} dungeonId - 副本ID
 * @param {string} timeLimit - 倒计时时间字符串（如 '1小时'），无配置时默认1小时
 * @param {string} cooldown - CD时间字符串（如 '24小时'），无配置时CD为0
 */
const recordDungeonEntry = (dungeonId, timeLimit, cooldown) => {
  const now = Date.now()
  const countdownMs = parseTimeToMs(timeLimit) || 3600 * 1000
  const cooldownMs = parseTimeToMs(cooldown) || 0

  // 如果已经在活跃期，不重置倒计时（允许自由重入）
  const existing = dungeonTimers.value[dungeonId]
  if (existing && now < existing.countdownEndsAt) {
    return
  }

  dungeonTimers.value[dungeonId] = {
    countdownEndsAt: now + countdownMs,
    cooldownEndsAt: now + countdownMs + cooldownMs,
    date: getTodayStr()
  }
  saveTimers()
}

/**
 * 获取剩余倒计时秒数（活跃期内）
 * 用于 Dungeon.vue 恢复副本进度时计算剩余时间
 * @param {number} dungeonId - 副本ID
 * @returns {number} 剩余秒数，非活跃期返回0
 */
const getRemainingCountdownSeconds = (dungeonId) => {
  const stateInfo = getDungeonState(dungeonId)
  if (stateInfo.state === DUNGEON_STATE.ACTIVE) {
    return Math.ceil(stateInfo.remainingMs / 1000)
  }
  return 0
}

/**
 * 结束副本活跃期，立即进入CD期
 * 用于副本通关或主动退出时，将倒计时提前结束，使副本进入冷却状态
 * 保留原始的 cooldownEndsAt 不变，仅将 countdownEndsAt 设为当前时间
 * @param {number} dungeonId - 副本ID
 */
const finishDungeon = (dungeonId) => {
  const timer = dungeonTimers.value[dungeonId]
  if (!timer) {
    return
  }
  const now = Date.now()
  // 仅在活跃期内才需要结束（CD期或已过期不处理）
  if (now >= timer.countdownEndsAt) {
    return
  }
  // 将倒计时结束时间设为当前时间，使状态立即变为CD期
  timer.countdownEndsAt = now
  saveTimers()
}

/**
 * 获取今天进入的副本列表（用于J面板显示）
 * 只返回今天有进入记录的副本，并附带当前状态信息
 * @param {Array} allDungeons - 当前地图的所有副本列表
 * @returns {Array} 今天进入过的副本列表（附带 dungeonState 和 remainingMs 字段）
 */
const getTodayDungeons = (allDungeons) => {
  if (!allDungeons || !Array.isArray(allDungeons)) return []
  const today = getTodayStr()
  cleanupExpiredTimers()

  return allDungeons
    .filter(d => {
      const timer = dungeonTimers.value[d.id]
      return timer && timer.date === today
    })
    .map(d => {
      const stateInfo = getDungeonState(d.id)
      return { ...d, dungeonState: stateInfo.state, remainingMs: stateInfo.remainingMs }
    })
}

/**
 * 检查是否可以进入副本
 * @param {number} dungeonId - 副本ID
 * @returns {{ canEnter: boolean, reason: string }} canEnter为true时可进入，reason为不可进入原因
 */
const checkCanEnter = (dungeonId) => {
  const stateInfo = getDungeonState(dungeonId)
  if (stateInfo.state === DUNGEON_STATE.COOLDOWN) {
    const remainingSec = Math.ceil(stateInfo.remainingMs / 1000)
    const h = Math.floor(remainingSec / 3600)
    const m = Math.floor((remainingSec % 3600) / 60)
    const s = remainingSec % 60
    const timeStr = h > 0 ? `${h}小时${m}分钟` : `${m}分钟${s}秒`
    return { canEnter: false, reason: `副本冷却中 (${timeStr})` }
  }
  return { canEnter: true, reason: '' }
}

/**
 * 初始化组合式函数（仅执行一次）
 * 从 localStorage 加载当前存档槽的状态并清理过期记录
 */
const initDungeonTimer = () => {
  if (initialized) return
  initialized = true
  loadedSlotId = getCurrentSlotId()
  loadTimers()
  cleanupExpiredTimers()
}

/**
 * 角色切换时重新加载副本时间状态
 * 检测存档槽是否变化，若变化则从新存档槽加载副本CD数据
 * 应在角色切换完成后调用，确保每个角色的副本CD互相独立
 */
const reloadForSlotChange = () => {
  const currentSlot = getCurrentSlotId()
  if (loadedSlotId !== currentSlot) {
    loadedSlotId = currentSlot
    loadTimers()
    cleanupExpiredTimers()
  }
}

/**
 * 副本倒计时与CD管理组合式函数
 * 管理副本的活跃期（倒计时）和冷却期（CD）状态
 * 每个角色（存档槽）的副本CD独立存储，互不影响
 *
 * 状态模型：
 * - 活跃期（active）：倒计时进行中，可自由出入副本
 * - 冷却期（cooldown）：倒计时已结束，CD未结束，不可进入
 * - 可进入（available）：无记录或CD已结束
 *
 * @returns {Object} 副本时间管理方法和响应式状态
 */
export function useDungeonTimer () {
  initDungeonTimer()

  return {
    /** 响应式副本时间状态表 */
    dungeonTimers,
    /** 解析时间字符串为毫秒数 */
    parseTimeToMs,
    /** 获取副本当前状态 */
    getDungeonState,
    /** 记录副本进入（设置倒计时和CD） */
    recordDungeonEntry,
    /** 获取剩余倒计时秒数（活跃期内） */
    getRemainingCountdownSeconds,
    /** 结束副本活跃期，立即进入CD期（通关或退出时调用） */
    finishDungeon,
    /** 获取今天进入的副本列表（用于J面板） */
    getTodayDungeons,
    /** 检查是否可以进入副本 */
    checkCanEnter,
    /** 清理已过期的CD记录 */
    cleanupExpiredTimers,
    /** 角色切换时重新加载副本CD状态 */
    reloadForSlotChange
  }
}
