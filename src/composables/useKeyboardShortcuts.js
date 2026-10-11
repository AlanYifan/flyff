/**
 * @fileoverview 键盘快捷键组合式API
 * 用于处理游戏内的键盘快捷键，控制面板的打开/关闭
 * @author FLYFF Team
 * @created 2026-02-16
 */

import { onMounted, onUnmounted } from 'vue'

/**
 * 键盘快捷键配置
 * @typedef {Object} ShortcutConfig
 * @property {string} key - 按键
 * @property {Function} handler - 处理函数
 * @property {string} description - 快捷键描述
 */

/**
 * useKeyboardShortcuts 组合式API
 * 用途/业务意图：提供统一的键盘快捷键管理，支持面板的打开/关闭切换
 *
 * @param {Object} options - 配置选项
 * @param {Function} options.toggleBagModal - 切换背包面板
 * @param {Function} options.toggleQuestPanel - 切换任务面板
 * @param {Function} options.toggleMapModal - 切换地图面板
 * @param {Function} options.togglePlayerDetailModal - 切换玩家详情面板
 * @param {Function} options.toggleFunctionPanel - 切换功能面板
 * @param {Function} options.toggleBuffTimerPanel - 切换BUFF计时面板
 * @param {Function} options.toggleSkillPanel - 切换技能面板
 * @param {Function} options.toggleAchievementPanel - 切换成就面板
 * @returns {Object} 快捷键管理对象
 */
export function useKeyboardShortcuts (options) {
  const {
    toggleBagModal,
    toggleQuestPanel,
    toggleMapModal,
    togglePlayerDetailModal,
    toggleFunctionPanel,
    toggleBuffTimerPanel,
    toggleSkillPanel,
    toggleAchievementPanel
  } = options

  /**
   * 快捷键映射表
   * @type {Map<string, Function>}
   */
  const shortcutMap = new Map()

  /**
   * 初始化快捷键映射
   */
  function initShortcuts () {
    // I 键 - 背包
    if (typeof toggleBagModal === 'function') {
      shortcutMap.set('i', {
        handler: toggleBagModal,
        description: '打开/关闭背包'
      })
      shortcutMap.set('I', {
        handler: toggleBagModal,
        description: '打开/关闭背包'
      })
    }

    // Q 键 - 任务面板
    if (typeof toggleQuestPanel === 'function') {
      shortcutMap.set('q', {
        handler: toggleQuestPanel,
        description: '打开/关闭任务面板'
      })
      shortcutMap.set('Q', {
        handler: toggleQuestPanel,
        description: '打开/关闭任务面板'
      })
    }

    // M 键 - 地图面板
    if (typeof toggleMapModal === 'function') {
      shortcutMap.set('m', {
        handler: toggleMapModal,
        description: '打开/关闭地图'
      })
      shortcutMap.set('M', {
        handler: toggleMapModal,
        description: '打开/关闭地图'
      })
    }

    // H 键 - 玩家详情面板
    if (typeof togglePlayerDetailModal === 'function') {
      shortcutMap.set('h', {
        handler: togglePlayerDetailModal,
        description: '打开/关闭玩家详情'
      })
      shortcutMap.set('H', {
        handler: togglePlayerDetailModal,
        description: '打开/关闭玩家详情'
      })
    }

    // U 键 - 功能面板
    if (typeof toggleFunctionPanel === 'function') {
      shortcutMap.set('u', {
        handler: toggleFunctionPanel,
        description: '打开/关闭功能面板'
      })
      shortcutMap.set('U', {
        handler: toggleFunctionPanel,
        description: '打开/关闭功能面板'
      })
    }

    // J 键 - BUFF计时面板
    if (typeof toggleBuffTimerPanel === 'function') {
      shortcutMap.set('j', {
        handler: toggleBuffTimerPanel,
        description: '打开/关闭计时面板'
      })
      shortcutMap.set('J', {
        handler: toggleBuffTimerPanel,
        description: '打开/关闭计时面板'
      })
    }

    // K 键 - 技能面板
    if (typeof toggleSkillPanel === 'function') {
      shortcutMap.set('k', {
        handler: toggleSkillPanel,
        description: '打开/关闭技能面板'
      })
      shortcutMap.set('K', {
        handler: toggleSkillPanel,
        description: '打开/关闭技能面板'
      })
    }

    // R 键 - 成就面板
    if (typeof toggleAchievementPanel === 'function') {
      shortcutMap.set('r', {
        handler: toggleAchievementPanel,
        description: '打开/关闭成就面板'
      })
      shortcutMap.set('R', {
        handler: toggleAchievementPanel,
        description: '打开/关闭成就面板'
      })
    }
  }

  /**
   * 判断事件目标是否为可输入元素
   * @param {EventTarget} target - 事件目标
   * @returns {boolean} 是否为可输入元素
   */
  function isInputElement (target) {
    if (!target || !target.tagName) {
      return false
    }
    const tagName = target.tagName.toLowerCase()
    const isEditable = target.isContentEditable

    // 检查是否为输入类元素
    const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select'
    // 检查是否为可编辑元素
    const isEditableElement = isEditable || target.getAttribute('contenteditable') === 'true'

    return isInput || isEditableElement
  }

  /**
   * 处理键盘按下事件
   * @param {KeyboardEvent} event - 键盘事件
   */
  function handleKeyDown (event) {
    // 如果焦点在输入框中，不处理快捷键
    if (isInputElement(event.target)) {
      return
    }

    const key = event.key
    const shortcut = shortcutMap.get(key)

    if (shortcut) {
      event.preventDefault()
      event.stopPropagation()

      try {
        shortcut.handler()
      } catch (error) {
        console.error('[KeyboardShortcuts] 快捷键处理失败:', error)
      }
    }
  }

  /**
   * 启用快捷键监听
   */
  function enableShortcuts () {
    document.addEventListener('keydown', handleKeyDown)
  }

  /**
   * 禁用快捷键监听
   */
  function disableShortcuts () {
    document.removeEventListener('keydown', handleKeyDown)
  }

  /**
   * 获取所有快捷键列表
   * @returns {Array<{key: string, description: string}>} 快捷键列表
   */
  function getShortcutsList () {
    const list = []
    const seenKeys = new Set()

    shortcutMap.forEach((value, key) => {
      // 只显示小写版本，避免重复
      const lowerKey = key.toLowerCase()
      if (!seenKeys.has(lowerKey)) {
        seenKeys.add(lowerKey)
        list.push({
          key: lowerKey.toUpperCase(),
          description: value.description
        })
      }
    })

    return list
  }

  // 组件挂载时初始化并启用快捷键
  onMounted(() => {
    initShortcuts()
    enableShortcuts()
  })

  // 组件卸载时禁用快捷键
  onUnmounted(() => {
    disableShortcuts()
  })

  return {
    enableShortcuts,
    disableShortcuts,
    getShortcutsList
  }
}
