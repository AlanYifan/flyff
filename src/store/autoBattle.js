/**
 * 自动战斗状态管理Store
 * 使用Pinia统一管理自动战斗的状态
 * 注意：怪物数据已统一到 monsters Store 管理
 *
 * @file autoBattle.js
 * @generated 2026-01-27
 */
import { defineStore } from 'pinia'
import { AutoBattleConfig } from '@/services/autoBattle/AutoBattleConfig'
import { validateConfig } from '@/utils/autoBattleUtils'

const debug = () => {}

export const useAutoBattleStore = defineStore('autoBattle', {
  state: () => ({
    basePhase: 'idle',
    overlayPhase: null,
    allMonstersDefeated: false,
    lastFailure: null,
    config: new AutoBattleConfig().getAll(),
    stats: {
      totalAttacks: 0,
      totalDamage: 0,
      monstersDefeated: 0,
      skillsUsed: 0,
      startTime: null,
      endTime: null,
      lastAttackTime: null
    },
    // monsters 数据已移至 monsters Store，此处不再维护独立副本
    currentTargetIndex: null,
    isPlayerAttacking: false,
    playerDeathCountdown: 0,
    isPlayerDead: false,
    timerStats: null,
    pendingUpdates: {},
    updateTimer: null,
    runTime: 0,
    runTimeTimer: null,
    runTimeStartAt: 0,
    runTimeLastSecond: 0
  }),

  getters: {
    phase: state => state.overlayPhase || state.basePhase,

    isActive: state => state.basePhase !== 'idle',

    isPaused: state => state.basePhase === 'paused',

    isRunning: state => state.basePhase === 'running',

    isStarting: state => state.overlayPhase === 'starting',

    isRefreshing: state => state.overlayPhase === 'refreshing',

    isInCountdownPeriod: state => state.overlayPhase === 'countdown',

    healthThresholdPercent: state => Math.round(state.config.healthThreshold * 100),

    manaThresholdPercent: state => Math.round(state.config.manaThreshold * 100),

    recoveryThresholdPercent: state => Math.round(state.config.recoveryThreshold * 100),

    attackInterval: state => state.config.baseAttackInterval,

    battleDuration: state => {
      if (!state.stats.startTime) {
        return 0
      }
      const endTime = state.stats.endTime || Date.now()
      return endTime - state.stats.startTime
    },

    averageDamage: state => {
      if (state.stats.totalAttacks === 0) {
        return 0
      }
      return Math.floor(state.stats.totalDamage / state.stats.totalAttacks)
    },

    attacksPerSecond: state => {
      if (!state.stats.startTime) {
        return 0
      }
      const endTime = state.stats.endTime || Date.now()
      const duration = endTime - state.stats.startTime
      if (duration === 0) {
        return 0
      }
      return (state.stats.totalAttacks / (duration / 1000)).toFixed(2)
    },

    damagePerSecond: state => {
      if (!state.stats.startTime) {
        return 0
      }
      const endTime = state.stats.endTime || Date.now()
      const duration = endTime - state.stats.startTime
      if (duration === 0) {
        return 0
      }
      return Math.floor(state.stats.totalDamage / (duration / 1000))
    },

    formattedStats: state => {
      const formatDuration = milliseconds => {
        if (!milliseconds || milliseconds <= 0) {
          return '0秒'
        }

        const totalSeconds = Math.floor(milliseconds / 1000)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        const parts = []
        if (hours > 0) {parts.push(`${hours}小时`)}
        if (minutes > 0) {parts.push(`${minutes}分`)}
        if (seconds > 0 || parts.length === 0) {parts.push(`${seconds}秒`)}
        return parts.join('')
      }

      const endTime = state.stats.endTime || Date.now()
      const duration = state.stats.startTime ? endTime - state.stats.startTime : 0
      const durationSeconds = duration > 0 ? duration / 1000 : 0

      return {
        总攻击次数: state.stats.totalAttacks,
        总伤害: state.stats.totalDamage,
        击败怪物: state.stats.monstersDefeated,
        使用技能: state.stats.skillsUsed,
        平均伤害:
          state.stats.totalAttacks === 0
            ? 0
            : Math.floor(state.stats.totalDamage / state.stats.totalAttacks),
        攻击频率: `${durationSeconds > 0 ? (state.stats.totalAttacks / durationSeconds).toFixed(2) : 0} 次/秒`,
        伤害输出: `${durationSeconds > 0 ? Math.floor(state.stats.totalDamage / durationSeconds) : 0} 伤害/秒`,
        战斗时长: formatDuration(duration)
      }
    }
  },

  actions: {
    /**
     * 写入最近一次失败原因，用于 UI 展示与快速定位
     * @param {{message: string, context?: string, detail?: any} | null} payload
     * @returns {void}
     */
    setLastFailure (payload) {
      if (!payload) {
        this.lastFailure = null
        return
      }
      const message = payload?.message
      if (!message) {
        this.lastFailure = null
        return
      }
      this.lastFailure = {
        message,
        context: payload?.context || 'unknown',
        detail: payload?.detail || null,
        timestamp: Date.now()
      }
    },

    /**
     * 清除最近一次失败原因
     * @returns {void}
     */
    clearLastFailure () {
      this.lastFailure = null
    },

    start () {
      debug('AUTO_BATTLE', 'start() 被调用')
      this.clearLastFailure()
      this.overlayPhase = null
      this.basePhase = 'running'
      this.allMonstersDefeated = false
      this.isPlayerAttacking = true
      this.stats = {
        totalAttacks: 0,
        totalDamage: 0,
        monstersDefeated: 0,
        skillsUsed: 0,
        startTime: Date.now(),
        endTime: null,
        lastAttackTime: null
      }
      this.startRunTimeTimer()
      debug('AUTO_BATTLE', 'start() 完成，新的 phase:', this.phase)
    },

    stop () {
      debug('AUTO_BATTLE', 'stop() 被调用')
      this.overlayPhase = null
      this.basePhase = 'idle'
      this.allMonstersDefeated = false
      this.isPlayerAttacking = false
      this.stats.endTime = Date.now()
      this.stopRunTimeTimer()
      debug('AUTO_BATTLE', 'stop() 完成，新的 phase:', this.phase)
    },

    pause () {
      if (!this.isActive) {
        return false
      }
      this.basePhase = 'paused'
      this.stopRunTimeTimer()
      return true
    },

    resume () {
      if (!this.isActive || !this.isPaused) {
        return false
      }
      this.basePhase = 'running'
      this.resumeRunTimeTimer()
      return true
    },

    toggle () {
      if (this.isStarting || this.isRefreshing || this.isInCountdownPeriod) {
        this.stop()
        return this.isActive
      }
      if (this.isPaused) {
        this.resume()
        return this.isActive
      }
      if (this.isActive) {
        this.stop()
        return this.isActive
      }
      this.start()
      return this.isActive
    },

    updateConfig (newConfig) {
      this.config = validateConfig({ ...this.config, ...newConfig }, AutoBattleConfig.DEFAULT)
    },

    batchUpdate (updates) {
      const nextUpdates = { ...updates }
      if (nextUpdates.config) {
        nextUpdates.config = validateConfig(nextUpdates.config, AutoBattleConfig.DEFAULT)
      }
      Object.assign(this.$state, nextUpdates)
      this.pendingUpdates = {}
    },

    scheduleUpdate (key, value) {
      this.pendingUpdates[key] = value

      if (!this.updateTimer) {
        this.updateTimer = setTimeout(() => {
          this.batchUpdate(this.pendingUpdates)
          this.updateTimer = null
        }, 16)
      }
    },

    setStarting (value) {
      if (value) {
        this.overlayPhase = 'starting'
        return
      }
      if (this.overlayPhase === 'starting') {
        this.overlayPhase = null
      }
    },

    setRefreshing (value) {
      if (value) {
        this.overlayPhase = 'refreshing'
        return
      }
      if (this.overlayPhase === 'refreshing') {
        this.overlayPhase = null
      }
    },

    setCountdownPeriod (value) {
      if (value) {
        this.overlayPhase = 'countdown'
        return
      }
      if (this.overlayPhase === 'countdown') {
        this.overlayPhase = null
      }
    },

    setConfig (key, value, options = {}) {
      const { debounce = true, immediate = false } = options

      if (debounce && !immediate) {
        this.scheduleUpdate(
          'config',
          validateConfig({ ...this.config, [key]: value }, AutoBattleConfig.DEFAULT)
        )
      } else {
        this.updateConfig({ [key]: value })
      }
    },

    incrementAttacks (damage = 0) {
      this.stats.totalAttacks++
      this.stats.totalDamage += damage
      this.stats.lastAttackTime = Date.now()
    },

    incrementMonstersDefeated () {
      this.stats.monstersDefeated++
    },

    incrementSkillsUsed () {
      this.stats.skillsUsed++
    },

    resetStats () {
      this.stats = {
        totalAttacks: 0,
        totalDamage: 0,
        monstersDefeated: 0,
        skillsUsed: 0,
        startTime: null,
        endTime: null,
        lastAttackTime: null
      }
    },

    setCurrentTargetIndex (index) {
      this.currentTargetIndex = index
    },

    setPlayerAttacking (isAttacking) {
      this.isPlayerAttacking = isAttacking
    },

    setPlayerDead (isDead) {
      this.isPlayerDead = isDead
    },

    setPlayerDeathCountdown (countdown) {
      this.playerDeathCountdown = countdown
    },

    startRunTimeTimer () {
      this.runTime = 0
      this.runTimeStartAt = performance.now()
      this.runTimeLastSecond = 0
      if (this.runTimeTimer) {
        cancelAnimationFrame(this.runTimeTimer)
        clearTimeout(this.runTimeTimer)
      }
      const step = now => {
        const elapsed = Math.max(0, now - this.runTimeStartAt)
        const seconds = Math.floor(elapsed / 1000)
        if (seconds !== this.runTimeLastSecond) {
          this.runTimeLastSecond = seconds
          this.runTime = seconds
        }
        this.runTimeTimer = requestAnimationFrame(step)
      }
      this.runTimeTimer = requestAnimationFrame(step)
    },

    resumeRunTimeTimer () {
      if (this.runTimeTimer) {
        return
      }
      this.runTimeStartAt = performance.now() - this.runTime * 1000
      this.runTimeLastSecond = this.runTime
      const step = now => {
        const elapsed = Math.max(0, now - this.runTimeStartAt)
        const seconds = Math.floor(elapsed / 1000)
        if (seconds !== this.runTimeLastSecond) {
          this.runTimeLastSecond = seconds
          this.runTime = seconds
        }
        this.runTimeTimer = requestAnimationFrame(step)
      }
      this.runTimeTimer = requestAnimationFrame(step)
    },

    stopRunTimeTimer () {
      if (this.runTimeTimer) {
        cancelAnimationFrame(this.runTimeTimer)
        clearTimeout(this.runTimeTimer)
        this.runTimeTimer = null
      }
    },

    reset () {
      this.stop()
      this.resetStats()
      this.currentTargetIndex = null
      this.isPlayerAttacking = false
      this.playerDeathCountdown = 0
      this.isPlayerDead = false
      this.runTime = 0
      this.stopRunTimeTimer()
      this.timerStats = null
    },

    loadConfig () {
      const config = AutoBattleConfig.load()
      this.config = config.getAll()
    },

    saveConfig () {
      try {
        localStorage.setItem('autoBattleConfig', JSON.stringify(this.config))
        return true
      } catch (error) {
        console.error('保存自动战斗配置失败:', error)
        return false
      }
    }
  }
})
