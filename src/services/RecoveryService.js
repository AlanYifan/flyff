/**
 * 恢复服务 - 负责自动恢复设置和监听器
 * 基于old/init.js的setupAutoRecoveryListeners重构
 */
export class RecoveryService {
  constructor (settingsService, uiService) {
    this.settingsService = settingsService
    this.uiService = uiService

    // 恢复定时器
    this.recoveryTimerId = null

    // 当前设置
    this.currentSettings = {
      autoHpRecoveryPercent: 50,
      autoMpRecoveryPercent: 50
    }
  }

  /**
   * 初始化恢复服务
   */
  initialize () {
    console.log('初始化恢复服务...')

    // 加载设置
    this.loadSettings()

    // 设置事件监听器
    this.setupEventListeners()

    // 启动恢复检查定时器
    this.startRecoveryTimer()

    console.log('恢复服务初始化完成')
  }

  /**
   * 加载设置
   */
  loadSettings () {
    const settings = this.settingsService.getCurrentSettings()

    this.currentSettings = {
      autoHpRecoveryPercent: settings.autoHpRecoveryPercent || 50,
      autoMpRecoveryPercent: settings.autoMpRecoveryPercent || 50
    }

  
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners () {
  

    // 由于Vue是响应式的，我们将在组件中处理事件监听
    // 这里提供方法供组件调用

  
  }

  /**
   * 启动恢复检查定时器
   */
  startRecoveryTimer () {
    // 清理现有的定时器
    if (this.recoveryTimerId) {
      clearInterval(this.recoveryTimerId)
    }

    // 每5秒检查一次恢复
    this.recoveryTimerId = setInterval(() => {
      this.checkAutoRecovery()
    }, 5000)

    console.log('恢复检查定时器已启动')
  }

  /**
   * 检查自动恢复
   */
  checkAutoRecovery () {
    // 这里应该检查玩家状态并执行自动恢复
    // 由于玩家数据在组件中，我们将在组件中实现具体的恢复逻辑

    console.log('检查自动恢复...')
  }

  /**
   * 设置HP自动恢复百分比
   * @param {number} percent - 百分比（1-100）
   */
  setHpRecoveryPercent (percent) {
    if (percent < 1) {
      percent = 1
    }
    if (percent > 100) {
      percent = 100
    }

    this.currentSettings.autoHpRecoveryPercent = percent

    // 保存设置
    this.settingsService.setAutoRecoveryPercent('hp', percent)

  
  }

  /**
   * 设置MP自动恢复百分比
   * @param {number} percent - 百分比（1-100）
   */
  setMpRecoveryPercent (percent) {
    if (percent < 1) {
      percent = 1
    }
    if (percent > 100) {
      percent = 100
    }

    this.currentSettings.autoMpRecoveryPercent = percent

    // 保存设置
    this.settingsService.setAutoRecoveryPercent('mp', percent)

  
  }

  /**
   * 获取HP自动恢复百分比
   * @returns {number} 百分比
   */
  getHpRecoveryPercent () {
    return this.currentSettings.autoHpRecoveryPercent
  }

  /**
   * 获取MP自动恢复百分比
   * @returns {number} 百分比
   */
  getMpRecoveryPercent () {
    return this.currentSettings.autoMpRecoveryPercent
  }

  /**
   * 检查是否需要恢复HP
   * @param {Object} player - 玩家对象
   * @returns {boolean} 是否需要恢复HP
   */
  needsHpRecovery (player) {
    if (!player || !player.maxHealth || !player.currentHealth) {
      return false
    }

    const recoveryThreshold = (this.currentSettings.autoHpRecoveryPercent / 100) * player.maxHealth
    return player.currentHealth <= recoveryThreshold
  }

  /**
   * 检查是否需要恢复MP
   * @param {Object} player - 玩家对象
   * @returns {boolean} 是否需要恢复MP
   */
  needsMpRecovery (player) {
    if (!player || !player.maxMana || !player.currentMana) {
      return false
    }

    const recoveryThreshold = (this.currentSettings.autoMpRecoveryPercent / 100) * player.maxMana
    return player.currentMana <= recoveryThreshold
  }

  /**
   * 执行自动恢复
   * @param {Object} player - 玩家对象
   * @param {Array} items - 物品列表
   * @returns {Object} 恢复结果
   */
  performAutoRecovery (player, items) {
    const result = {
      hpRecovered: false,
      mpRecovered: false,
      hpItemUsed: null,
      mpItemUsed: null
    }

    // 检查是否需要恢复HP
    if (this.needsHpRecovery(player)) {
      const hpItem = this.findRecoveryItem(items, 'health')
      if (hpItem) {
        result.hpRecovered = true
        result.hpItemUsed = hpItem
      
      }
    }

    // 检查是否需要恢复MP
    if (this.needsMpRecovery(player)) {
      const mpItem = this.findRecoveryItem(items, 'mana')
      if (mpItem) {
        result.mpRecovered = true
        result.mpItemUsed = mpItem
       
      }
    }

    return result
  }

  /**
   * 查找恢复物品
   * @param {Array} items - 物品列表
   * @param {string} type - 类型：'health' 或 'mana'
   * @returns {Object|null} 恢复物品
   */
  findRecoveryItem (items, type) {
    if (!items || !Array.isArray(items)) {
      return null
    }

    // 根据类型过滤物品
    const recoveryItems = items.filter(item => {
      if (!item || !item.category) {
        return false
      }

      if (type === 'health') {
        return item.category === 'potion' && item.subcategory === 'health'
      } else if (type === 'mana') {
        return item.category === 'potion' && item.subcategory === 'mana'
      }

      return false
    })

    // 返回第一个找到的物品
    return recoveryItems.length > 0 ? recoveryItems[0] : null
  }

  /**
   * 更新设置
   * @param {Object} settings - 新设置
   */
  updateSettings (settings) {
    if (settings.autoHpRecoveryPercent !== undefined) {
      this.setHpRecoveryPercent(settings.autoHpRecoveryPercent)
    }

    if (settings.autoMpRecoveryPercent !== undefined) {
      this.setMpRecoveryPercent(settings.autoMpRecoveryPercent)
    }

  
  }

  /**
   * 清理恢复服务
   */
  cleanup () {
    // 停止恢复定时器
    if (this.recoveryTimerId) {
      clearInterval(this.recoveryTimerId)
      this.recoveryTimerId = null
    }

    console.log('恢复服务已清理')
  }

  /**
   * 获取当前设置
   * @returns {Object} 当前设置
   */
  getCurrentSettings () {
    return { ...this.currentSettings }
  }

  /**
   * 重置为默认设置
   */
  resetToDefault () {
    this.currentSettings = {
      autoHpRecoveryPercent: 50,
      autoMpRecoveryPercent: 50
    }

  
  }
}
