/**
 * @file PersistenceService.js
 * @description 持久化服务 - 负责页面关闭时的数据持久化
 * @description 基于old/fuben.js的页面关闭持久化逻辑重构
 * @description 自动战斗期间保存间隔自动翻倍，避免高负载下保存请求超时
 */

import { useGameStore } from '@/store'
import { useAutoBattleStore } from '@/store/autoBattle'

/** 自动战斗期间保存间隔倍率（翻倍以减少高负载下的保存请求） */
const AUTO_BATTLE_SAVE_MULTIPLIER = 2

export class PersistenceService {
  constructor (storageService, skillService, dungeonService, gameStore) {
    this.storageService = storageService
    this.skillService = skillService
    this.dungeonService = dungeonService
    this.gameStore = gameStore

    // 事件监听器引用
    this.beforeUnloadListener = null
    this.pageHideListener = null
    this.visibilityChangeListener = null

    // 持久化状态
    this.persistenceState = {
      lastSaveTime: null,
      saveCount: 0,
      isSaving: false,
      autoSaveEnabled: true
    }

    this.autoSaveTimerId = null
  }

  /**
   * 初始化持久化服务
   */
  initialize () {
    console.log('初始化持久化服务...')

    // 设置页面关闭事件监听器
    this.setupPageUnloadListeners()

    // 设置自动保存
    this.setupAutoSave()

    console.log('持久化服务初始化完成')
  }

  /**
   * 设置页面关闭事件监听器
   */
  setupPageUnloadListeners () {
    // 移除现有的事件监听器（防止重复绑定）
    this.removePageUnloadListeners()

    // 添加beforeunload事件监听器
    this.beforeUnloadListener = event => {
      this.handleBeforeUnload(event)
    }

    // 添加pagehide事件监听器（移动端支持）
    this.pageHideListener = event => {
      this.handlePageHide(event)
    }

    // 添加visibilitychange事件监听器（标签页切换）
    this.visibilityChangeListener = () => {
      this.handleVisibilityChange()
    }

    window.addEventListener('beforeunload', this.beforeUnloadListener)
  window.addEventListener('pagehide', this.pageHideListener)
  document.addEventListener('visibilitychange', this.visibilityChangeListener)
  }

  /**
   * 移除页面关闭事件监听器
   */
  removePageUnloadListeners () {
    if (this.beforeUnloadListener) {
      window.removeEventListener('beforeunload', this.beforeUnloadListener)
      this.beforeUnloadListener = null
    }

    if (this.pageHideListener) {
      window.removeEventListener('pagehide', this.pageHideListener)
      this.pageHideListener = null
    }

    if (this.visibilityChangeListener) {
      document.removeEventListener('visibilitychange', this.visibilityChangeListener)
      this.visibilityChangeListener = null
    }

    console.log('页面关闭事件监听器已移除')
  }

  /**
   * 处理beforeunload事件
   * @param {Event} event - beforeunload事件
   */
  handleBeforeUnload () {
    console.log('页面即将关闭，执行持久化操作...')

    // 执行持久化操作
    this.persistAllData('page-unload')

    // 可选：显示确认对话框
    // event.preventDefault();
    // event.returnValue = '确定要离开页面吗？游戏进度将自动保存。';
  }

  /**
   * 处理pagehide事件
   * @param {Event} event - pagehide事件
   */
  handlePageHide () {
    console.log('页面隐藏，执行持久化操作...')

    // 执行持久化操作
    this.persistAllData('page-hide')
  }

  /**
   * 处理visibilitychange事件
   */
  handleVisibilityChange () {
    if (document.hidden) {
      console.log('页面切换到后台，执行持久化操作...')

      // 执行持久化操作
      this.persistAllData('visibility-change')
    }
  }

  /**
   * 持久化所有数据
   * @param {string} reason - 持久化原因
   */
  persistAllData (reason = 'manual') {
    if (this.persistenceState.isSaving) {
      console.warn('持久化操作正在进行中，跳过本次操作')
      return
    }

    this.persistenceState.isSaving = true

    try {
      console.log(`开始持久化数据，原因: ${reason}`)

      // 1. 保存玩家数据
      this.persistPlayerData(reason)

      // 2. 保存技能冷却时间
      this.persistSkillCooldowns(reason)

      // 3. 保存副本数据
      this.persistDungeonData(reason)

      // 4. 保存用户设置
      this.persistUserSettings(reason)

      // 更新持久化状态
      this.persistenceState.lastSaveTime = new Date().toISOString()
      this.persistenceState.saveCount++

      console.log(`数据持久化完成，总保存次数: ${this.persistenceState.saveCount}`)
    } catch (error) {
      console.error('数据持久化失败:', error)
    } finally {
      this.persistenceState.isSaving = false
    }
  }

  /**
   * 持久化玩家数据
   * @param {string} reason - 持久化原因
   */
  persistPlayerData (reason) {
    console.log(`持久化玩家数据，原因: ${reason}`)

    // 从store中获取当前玩家数据
    if (this.gameStore && this.gameStore.player) {
      // 保存玩家数据到存储
      const saveResult = this.storageService.savePlayerData(this.gameStore.player)
      console.log('玩家数据持久化完成，结果:', saveResult)
    } else {
      console.warn('游戏存储或玩家数据不可用')
    }
  }

  /**
   * 持久化技能冷却时间
   * @param {string} reason - 持久化原因
   */
  persistSkillCooldowns () {
    // console.log(`持久化技能冷却时间，原因: ${reason}`);

    if (this.skillService) {
      // 获取所有技能冷却时间
      const cooldowns = this.skillService.getAllSkillCooldowns()

      // 保存技能冷却时间
      this.storageService.saveSkillCooldowns(cooldowns)

      // console.log(`技能冷却时间持久化完成，数量: ${Object.keys(cooldowns).length}`);
    } else {
      console.warn('技能服务未初始化，跳过技能冷却时间持久化')
    }
  }

  /**
   * 持久化副本数据
   * @param {string} reason - 持久化原因
   */
  persistDungeonData (reason) {
    console.log(`持久化副本数据，原因: ${reason}`)

    if (this.dungeonService) {
      // 这里应该保存副本数据
      // 由于副本数据在组件中，我们将在组件中实现具体的副本数据保存逻辑

      console.log('副本数据持久化完成')
    } else {
      console.warn('副本服务未初始化，跳过副本数据持久化')
    }
  }

  /**
   * 持久化用户设置
   * @param {string} reason - 持久化原因
   */
  persistUserSettings (reason) {
    // 这里应该保存用户设置
    // 由于用户设置在组件中，我们将在组件中实现具体的用户设置保存逻辑
  }

  /**
   * 设置自动保存
   * 使用递归 setTimeout 替代 setInterval，使每个周期都能根据当前自动战斗状态动态调整间隔
   * 自动战斗期间保存间隔翻倍，避免高负载下保存请求超时
   */
  setupAutoSave () {
    // 从用户设置中获取自动保存间隔
    const userSettings = this.storageService.getUserField('userSettings') || {}
    this.baseAutoSaveInterval = userSettings.autoSaveInterval || 60 // 默认60秒

    if (this.autoSaveTimerId) {
      clearTimeout(this.autoSaveTimerId)
      this.autoSaveTimerId = null
    }

    if (this.baseAutoSaveInterval > 0) {
      console.log(`自动保存基础间隔: ${this.baseAutoSaveInterval}秒`)

      // 递归调度：每次根据当前状态计算实际间隔
      this._scheduleNextAutoSave()
      console.log('自动保存已启用')
    } else {
      console.log('自动保存已禁用')
    }
  }

  /**
   * 检查当前是否处于自动战斗状态
   * @returns {boolean} 是否正在自动战斗
   * @private
   */
  _isAutoBattling () {
    try {
      const store = this.gameStore || useGameStore()
      if (store?.battle?.isAutoBattle) {
        return true
      }
      const autoBattleStore = useAutoBattleStore()
      return Boolean(autoBattleStore?.isActive)
    } catch (e) {
      return false
    }
  }

  /**
   * 计算当前实际保存间隔
   * 自动战斗时保存间隔翻倍，避免高负载下保存请求超时
   * @returns {number} 实际保存间隔（秒）
   * @private
   */
  _getEffectiveSaveInterval () {
    const base = this.baseAutoSaveInterval || 60
    if (this._isAutoBattling()) {
      return base * AUTO_BATTLE_SAVE_MULTIPLIER
    }
    return base
  }

  /**
   * 递归调度下一次自动保存
   * 使用 setTimeout 而非 setInterval，使每个周期能动态感知自动战斗状态变化
   * @private
   */
  _scheduleNextAutoSave () {
    const intervalSec = this._getEffectiveSaveInterval()
    this.autoSaveTimerId = setTimeout(() => {
      if (this.persistenceState.autoSaveEnabled) {
        this.persistAllData('auto-save')
      }
      // 递归调度下一次保存
      this._scheduleNextAutoSave()
    }, intervalSec * 1000)
  }

  /**
   * 启用自动保存
   */
  enableAutoSave () {
    this.persistenceState.autoSaveEnabled = true
    console.log('自动保存已启用')
  }

  /**
   * 禁用自动保存
   */
  disableAutoSave () {
    this.persistenceState.autoSaveEnabled = false
    console.log('自动保存已禁用')
  }

  /**
   * 手动保存数据
   */
  manualSave () {
    console.log('手动保存数据...')

    this.persistAllData('manual')

    console.log('手动保存完成')
  }

  /**
   * 获取持久化状态
   * @returns {Object} 持久化状态
   */
  getPersistenceState () {
    return { ...this.persistenceState }
  }

  /**
   * 获取最后保存时间
   * @returns {string|null} 最后保存时间
   */
  getLastSaveTime () {
    return this.persistenceState.lastSaveTime
  }

  /**
   * 获取保存次数
   * @returns {number} 保存次数
   */
  getSaveCount () {
    return this.persistenceState.saveCount
  }

  /**
   * 清理持久化服务
   */
  cleanup () {
    // 移除页面关闭事件监听器
    this.removePageUnloadListeners()

    // 执行最后一次持久化
    this.persistAllData('cleanup')

    if (this.autoSaveTimerId) {
      clearTimeout(this.autoSaveTimerId)
      this.autoSaveTimerId = null
    }

    console.log('持久化服务已清理')
  }
}
