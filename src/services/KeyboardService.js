/**
 * 键盘服务 - 负责键盘快捷键支持
 * 基于old/fuben.js的键盘快捷键支持逻辑重构
 */
export class KeyboardService {
  constructor (skillService, uiService) {
    this.skillService = skillService
    this.uiService = uiService

    // 所有可能的技能键
    this.allSkillKeys = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']

    // 快捷键配置
    this.shortcuts = {
      // 技能快捷键
      skills: {
        Q: 'skillQ',
        W: 'skillW',
        E: 'skillE',
        R: 'skillR',
        T: 'skillT',
        Y: 'skillY',
        U: 'skillU',
        I: 'skillI',
        O: 'skillO',
        P: 'skillP'
      },

      // 功能快捷键
      functions: {
        F1: 'toggleSettings',
        F2: 'toggleInventory',
        F3: 'toggleCharacter',
        F4: 'toggleSkills',
        F5: 'toggleQuests',
        F6: 'toggleMap',
        F7: 'toggleFriends',
        F8: 'toggleGuild',
        F9: 'toggleHelp',
        F10: 'toggleSystem',
        F11: 'toggleFullscreen',
        F12: 'toggleDebug'
      },

      // 调试快捷键
      debug: {
        'Ctrl+H': 'forceUpdateHealthBars',
        'Ctrl+D': 'showBattleStatus',
        'Ctrl+R': 'refreshDOM',
        'Ctrl+T': 'testMonsterDamage',
        'Ctrl+P': 'testPlayerDamage'
      },

      // 游戏控制快捷键
      gameControls: {
        Space: 'toggleAutoBattle',
        Enter: 'attack',
        Escape: 'closeAllWindows',
        Tab: 'switchTarget'
      }
    }

    // 事件监听器引用
    this.keydownListener = null

    // 是否启用快捷键
    this.enabled = true
  }

  /**
   * 初始化键盘服务
   */
  initialize () {
    // 设置键盘事件监听器
    this.setupKeyboardListeners()
  }

  /**
   * 设置键盘事件监听器
   */
  setupKeyboardListeners () {
    // 移除现有的事件监听器（防止重复绑定）
    this.removeKeyboardListeners()

    // 添加键盘按下事件监听器
    this.keydownListener = event => {
      this.handleKeyDown(event)
    }

    window.addEventListener('keydown', this.keydownListener)
  }

  /**
   * 移除键盘事件监听器
   */
  removeKeyboardListeners () {
    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener)
      this.keydownListener = null
    }
  }

  /**
   * 处理键盘按下事件
   * @param {KeyboardEvent} event - 键盘事件
   */
  handleKeyDown (event) {
    if (!this.enabled) {
      return
    }

    const key = event.key.toUpperCase()
    const isCtrl = event.ctrlKey || event.metaKey
    const isAlt = event.altKey
    const isShift = event.shiftKey

    // 构建快捷键标识
    let shortcutKey = ''
    if (isCtrl) {
      shortcutKey += 'Ctrl+'
    }
    if (isAlt) {
      shortcutKey += 'Alt+'
    }
    if (isShift) {
      shortcutKey += 'Shift+'
    }
    shortcutKey += key

    // 处理技能快捷键
    if (this.handleSkillShortcut(key)) {
      event.preventDefault()
      return
    }

    // 处理功能快捷键
    if (this.handleFunctionShortcut(key)) {
      event.preventDefault()
      return
    }

    // 处理调试快捷键
    if (this.handleDebugShortcut(shortcutKey)) {
      event.preventDefault()
      return
    }

    // 处理游戏控制快捷键
    if (this.handleGameControlShortcut(key)) {
      event.preventDefault()
      
    }
  }

  /**
   * 处理技能快捷键
   * @param {string} key - 按键
   * @returns {boolean} 是否处理了快捷键
   */
  handleSkillShortcut (key) {
    // 检查是否是技能键
    if (this.allSkillKeys.includes(key)) {
      // 使用技能
      this.useSkill(key)

      return true
    }

    return false
  }

  /**
   * 使用技能
   * @param {string} skillKey - 技能键
   */
  useSkill (skillKey) {
    if (skillKey === undefined) {
      this.enabled = Boolean(this.enabled)
    }
  }

  /**
   * 处理功能快捷键
   * @param {string} key - 按键
   * @returns {boolean} 是否处理了快捷键
   */
  handleFunctionShortcut (key) {
    const functionName = this.shortcuts.functions[key]

    if (functionName) {
      // 执行功能
      this.executeFunction(functionName)

      return true
    }

    return false
  }

  /**
   * 执行功能
   * @param {string} functionName - 功能名称
   */
  executeFunction (functionName) {
    // 这里应该调用UI服务执行功能
    // 由于UI服务在组件中，我们将在组件中实现具体的功能逻辑

    switch (functionName) {
    case 'toggleSettings':
      break
    case 'toggleInventory':
      break
    case 'toggleCharacter':
      break
    case 'toggleSkills':
      break
    case 'toggleQuests':
      break
    case 'toggleMap':
      break
    case 'toggleFriends':
      break
    case 'toggleGuild':
      break
    case 'toggleHelp':
      break
    case 'toggleSystem':
      break
    case 'toggleFullscreen':
      this.toggleFullscreen()
      break
    case 'toggleDebug':
      break
    default:
    }
  }

  /**
   * 处理调试快捷键
   * @param {string} shortcutKey - 快捷键
   * @returns {boolean} 是否处理了快捷键
   */
  handleDebugShortcut (shortcutKey) {
    const debugFunction = this.shortcuts.debug[shortcutKey]

    if (debugFunction) {
      // 执行调试功能
      this.executeDebugFunction(debugFunction)

      return true
    }

    return false
  }

  /**
   * 执行调试功能
   * @param {string} debugFunction - 调试功能名称
   */
  executeDebugFunction (debugFunction) {
    switch (debugFunction) {
    case 'forceUpdateHealthBars':
      this.forceUpdateHealthBars()
      break
    case 'showBattleStatus':
      this.showBattleStatus()
      break
    case 'refreshDOM':
      this.refreshDOM()
      break
    case 'testMonsterDamage':
      this.testMonsterDamage()
      break
    case 'testPlayerDamage':
      this.testPlayerDamage()
      break
    default:
    }
  }

  /**
   * 处理游戏控制快捷键
   * @param {string} key - 按键
   * @returns {boolean} 是否处理了快捷键
   */
  handleGameControlShortcut (key) {
    const controlFunction = this.shortcuts.gameControls[key]

    if (controlFunction) {
      // 执行游戏控制功能
      this.executeGameControl(controlFunction)

      return true
    }

    return false
  }

  /**
   * 执行游戏控制功能
   * @param {string} controlFunction - 控制功能名称
   */
  executeGameControl (controlFunction) {
    switch (controlFunction) {
    case 'toggleAutoBattle':
      break
    case 'attack':
      break
    case 'closeAllWindows':
      break
    case 'switchTarget':
      break
    default:
    }
  }

  /**
   * 强制更新血条
   */
  forceUpdateHealthBars () {
    // 这里应该调用UI服务强制更新血条
    // 由于UI服务在组件中，我们将在组件中实现具体的血条更新逻辑

  }

  /**
   * 显示战斗状态
   */
  showBattleStatus () {
    // 这里应该显示详细的战斗状态信息
    // 由于数据在组件中，我们将在组件中实现具体的状态显示逻辑

  }

  /**
   * 刷新DOM引用
   */
  refreshDOM () {
    // 这里应该刷新DOM元素引用
    // 由于DOM操作在组件中，我们将在组件中实现具体的DOM刷新逻辑

  }

  /**
   * 测试怪物伤害
   */
  testMonsterDamage () {
    // 这里应该模拟怪物受到伤害
    // 由于战斗逻辑在组件中，我们将在组件中实现具体的伤害测试逻辑

  }

  /**
   * 测试玩家伤害
   */
  testPlayerDamage () {
    // 这里应该模拟玩家受到伤害
    // 由于战斗逻辑在组件中，我们将在组件中实现具体的伤害测试逻辑

  }

  /**
   * 切换全屏模式
   */
  toggleFullscreen () {
    if (!document.fullscreenElement) {
      // 进入全屏
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen()
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen()
      }
    } else {
      // 退出全屏
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
    }
  }

  /**
   * 启用快捷键
   */
  enable () {
    this.enabled = true
  }

  /**
   * 禁用快捷键
   */
  disable () {
    this.enabled = false
  }

  /**
   * 获取快捷键配置
   * @returns {Object} 快捷键配置
   */
  getShortcuts () {
    return { ...this.shortcuts }
  }

  /**
   * 更新快捷键配置
   * @param {Object} newShortcuts - 新的快捷键配置
   */
  updateShortcuts (newShortcuts) {
    this.shortcuts = {
      ...this.shortcuts,
      ...newShortcuts
    }
  }

  /**
   * 清理键盘服务
   */
  cleanup () {
    // 移除键盘事件监听器
    this.removeKeyboardListeners()
  }
}
