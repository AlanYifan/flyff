/**
 * 自动战斗事件系统
 * 统一管理自动战斗相关的事件，减少组件间的直接耦合
 */
class AutoBattleEventBus {
  constructor () {
    this.events = {}
    this.eventHistory = []
    this.maxHistorySize = 100
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅的函数
   */
  on (event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }

    this.events[event].push(callback)

    const unsubscribe = () => {
      this.off(event, callback)
    }

    return unsubscribe
  }

  /**
   * 取消订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off (event, callback) {
    if (!this.events[event]) {
      return
    }

    const index = this.events[event].indexOf(callback)
    if (index > -1) {
      this.events[event].splice(index, 1)
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit (event, data) {
    if (!this.events[event]) {
      return
    }

    this._addToHistory(event, data)

    this.events[event].forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`事件 ${event} 处理出错:`, error)
      }
    })
  }

  /**
   * 一次性订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅的函数
   */
  once (event, callback) {
    const wrapper = data => {
      callback(data)
      this.off(event, wrapper)
    }

    return this.on(event, wrapper)
  }

  /**
   * 添加事件到历史记录
   * @private
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  _addToHistory (event, data) {
    this.eventHistory.push({
      event,
      data,
      timestamp: Date.now()
    })

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift()
    }
  }

  /**
   * 获取事件历史记录
   * @param {string} event - 可选的事件名称过滤
   * @returns {Array}
   */
  getHistory (event = null) {
    if (event) {
      return this.eventHistory.filter(item => item.event === event)
    }
    return [...this.eventHistory]
  }

  /**
   * 清空事件历史记录
   */
  clearHistory () {
    this.eventHistory = []
  }

  /**
   * 清除所有事件监听器
   */
  clearAll () {
    this.events = {}
    this.clearHistory()
  }

  /**
   * 获取事件监听器数量
   * @param {string} event - 可选的事件名称
   * @returns {number}
   */
  listenerCount (event = null) {
    if (event) {
      return this.events[event] ? this.events[event].length : 0
    }

    // 修复：使用Object.keys()而不是Object.values()
    // 避免出现"Too many properties to enumerate"错误
    return Object.keys(this.events).reduce((total, key) => total + this.events[key].length, 0)
  }
}

const autoBattleEventBus = new AutoBattleEventBus()

export const AutoBattleEvents = {
  START: 'auto-battle:start',
  STOP: 'auto-battle:stop',
  PAUSE: 'auto-battle:pause',
  RESUME: 'auto-battle:resume',
  TOGGLE: 'auto-battle:toggle',

  ATTACK: 'auto-battle:attack',
  SKILL_USE: 'auto-battle:skill-use',
  MONSTER_ATTACK: 'auto-battle:monster-attack',
  MONSTER_DEFEATED: 'auto-battle:monster-defeated',
  ALL_MONSTERS_DEFEATED: 'auto-battle:all-monsters-defeated',

  PLAYER_DEATH: 'auto-battle:player-death',
  PLAYER_DAMAGE: 'auto-battle:player-damage',
  PLAYER_HEAL: 'auto-battle:player-heal',

  CONFIG_UPDATE: 'auto-battle:config-update',
  CONFIG_RESET: 'auto-battle:config-reset',

  STATS_UPDATE: 'auto-battle:stats-update',
  LOG: 'auto-battle:log',

  REFRESH_MONSTERS: 'auto-battle:refresh-monsters',
  COOLDOWN_UPDATE: 'auto-battle:cooldown-update',

  ERROR: 'auto-battle:error',
  WARNING: 'auto-battle:warning'
}

export default autoBattleEventBus
