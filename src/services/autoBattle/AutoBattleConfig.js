/**
 * 自动战斗配置管理类（简化版）
 * 统一管理自动战斗的配置项
 * 包含简化的防抖配置更新功能
 */
import { validateConfig } from '@/utils/autoBattleUtils'

const debug = () => {}
const warn = () => {}

export class AutoBattleConfig {
  static DEFAULT = {
    targetSelection: 'nearest',
    baseAttackInterval: 2000,
    minAttackInterval: 500,
    maxAttackInterval: 5000,
    skillCheckInterval: 1000,
    healthThreshold: 0.8,
    manaThreshold: 0.2,
    autoUseSkills: true,
    skillSelectionStrategy: 'priority',
    monsterMinLevel: 1,
    monsterMaxLevel: 3,
    monsterDisplayCount: 2,
    monsterRefreshStrategy: 'countdown',
    autoUseRecoveryItems: true,
    recoveryThreshold: 0.8,
    attackActionPriorities: ['buff', 'aoe', 'single', 'normal']
  }

  static PRESETS = {
    aggressive: {
      name: '激进',
      description: '快速攻击，适合高攻速玩家',
      baseAttackInterval: 1000,
      healthThreshold: 0.8,
      manaThreshold: 0.3,
      recoveryThreshold: 0.8,
      autoUseSkills: true
    },
    defensive: {
      name: '防御',
      description: '保守攻击，优先保持高血量',
      baseAttackInterval: 3000,
      healthThreshold: 0.8,
      manaThreshold: 0.4,
      recoveryThreshold: 0.8,
      autoUseSkills: true
    },
    balanced: {
      name: '平衡',
      description: '平衡的攻击节奏和资源使用',
      baseAttackInterval: 2000,
      healthThreshold: 0.8,
      manaThreshold: 0.2,
      recoveryThreshold: 0.8,
      autoUseSkills: true
    },
    farming: {
      name: '刷怪',
      description: '快速刷怪，适合经验 farming',
      baseAttackInterval: 1500,
      healthThreshold: 0.8,
      manaThreshold: 0.25,
      recoveryThreshold: 0.8,
      autoUseSkills: true
    },
    boss: {
      name: 'Boss战',
      description: '针对Boss的配置，更谨慎',
      baseAttackInterval: 2500,
      healthThreshold: 0.8,
      manaThreshold: 0.3,
      recoveryThreshold: 0.8,
      autoUseSkills: true
    }
  }

  constructor (config = {}) {
    this.config = this.validate({ ...AutoBattleConfig.DEFAULT, ...config })
    this.debounceTimers = new Map()
    this.changeListeners = []
  }

  validate (config) {
    return validateConfig(config, AutoBattleConfig.DEFAULT)
  }

  get (key) {
    return this.config[key]
  }

  set (key, value, options = {}) {
    const { debounce = true, immediate = false } = options

    if (debounce && !immediate) {
      this.debouncedSet(key, value)
    } else {
      this.immediateSet(key, value)
    }
  }

  debouncedSet (key, value) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key))
    }

    const timer = setTimeout(() => {
      this.immediateSet(key, value)
      this.debounceTimers.delete(key)
    }, 300)

    this.debounceTimers.set(key, timer)
  }

  immediateSet (key, value) {
    this.config[key] = value
    this.notifyConfigChange(key, value)
  }

  update (newConfig, options = {}) {
    const { debounce = true, immediate = false } = options

    if (debounce && !immediate) {
      this.debouncedUpdate(newConfig)
    } else {
      this.immediateUpdate(newConfig)
    }
  }

  debouncedUpdate (newConfig) {
    if (this.debounceTimers.has('batch')) {
      clearTimeout(this.debounceTimers.get('batch'))
    }

    const timer = setTimeout(() => {
      this.immediateUpdate(newConfig)
      this.debounceTimers.delete('batch')
    }, 50)

    this.debounceTimers.set('batch', timer)
  }

  immediateUpdate (newConfig) {
    this.config = this.validate({ ...this.config, ...newConfig })
    debug('AutoBattleConfig', '配置已更新:', this.config)
    this.notifyConfigChange('batch', newConfig)
  }

  cancelPendingUpdates () {
    this.debounceTimers.forEach(timer => {
      clearTimeout(timer)
    })
    this.debounceTimers.clear()
  }

  isUpdatePending (key) {
    return this.debounceTimers.has(key) || this.debounceTimers.has('batch')
  }

  getAll () {
    return { ...this.config }
  }

  notifyConfigChange (key, value) {
    this.changeListeners.forEach(listener => {
      try {
        listener(key, value, this.config)
      } catch (error) {
        console.error('AutoBattleConfig', '配置变更监听器错误:', error)
      }
    })
  }

  addChangeListener (listener) {
    if (typeof listener === 'function') {
      this.changeListeners.push(listener)
      return () => {
        const index = this.changeListeners.indexOf(listener)
        if (index > -1) {
          this.changeListeners.splice(index, 1)
        }
      }
    }
    return () => {}
  }

  removeChangeListener (listener) {
    const index = this.changeListeners.indexOf(listener)
    if (index > -1) {
      this.changeListeners.splice(index, 1)
    }
  }

  clearChangeListeners () {
    this.changeListeners = []
  }

  save () {
    try {
      localStorage.setItem('autoBattleConfig', JSON.stringify(this.config))
      debug('AutoBattleConfig', '配置已保存到localStorage')
      return true
    } catch (error) {
      console.error('AutoBattleConfig', '保存配置失败:', error)
      return false
    }
  }

  static load () {
    try {
      const saved = localStorage.getItem('autoBattleConfig')
      if (saved) {
        const parsed = JSON.parse(saved)
        return new AutoBattleConfig(parsed)
      }
    } catch (error) {
      console.error('AutoBattleConfig', '加载配置失败:', error)
    }
    return new AutoBattleConfig()
  }

  static clear () {
    try {
      localStorage.removeItem('autoBattleConfig')
      debug('AutoBattleConfig', '配置已清除')
      return true
    } catch (error) {
      console.error('AutoBattleConfig', '清除配置失败:', error)
      return false
    }
  }

  reset () {
    this.config = { ...AutoBattleConfig.DEFAULT }
    this.cancelPendingUpdates()
    debug('AutoBattleConfig', '配置已重置为默认值')
    this.notifyConfigChange('reset', this.config)
  }

  applyPreset (presetName) {
    if (!AutoBattleConfig.PRESETS[presetName]) {
      warn('AutoBattleConfig', `未知的预设配置: ${presetName}`)
      return false
    }

    const preset = AutoBattleConfig.PRESETS[presetName]
    this.update(preset, { debounce: true, immediate: false })
    debug('AutoBattleConfig', `已应用预设配置: ${preset.name}`)
    return true
  }

  getAvailablePresets () {
    return Object.keys(AutoBattleConfig.PRESETS).map(key => ({
      key,
      ...AutoBattleConfig.PRESETS[key]
    }))
  }

  exportConfig () {
    return JSON.stringify(this.config, null, 2)
  }

  importConfig (configString) {
    try {
      const imported = JSON.parse(configString)
      this.update(imported, { debounce: true, immediate: false })
      debug('AutoBattleConfig', '配置已导入')
      return true
    } catch (error) {
      console.error('AutoBattleConfig', '导入配置失败:', error)
      return false
    }
  }

  getDebouncedUpdaterStats () {
    return this.debouncedUpdater.getStats()
  }
}
