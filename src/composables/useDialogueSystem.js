/**
 * 对话系统组合式函数
 * 管理原神风格对话的状态机：问候 → 任务介绍 → 选项 → 接受/拒绝 → 告别
 *
 * @file useDialogueSystem.js
 * @generated 2026-06-26
 */

import { ref, computed, onUnmounted } from 'vue'
import { DialogueService, DIALOGUE_PHASE } from '@/services/DialogueService'
import { StaticDataService } from '@/services/StaticDataService'

/**
 * @typedef {Object} DialogueOption
 * @property {string} label - 选项文字
 * @property {string} action - 动作标识（select-quest / accept-quest / decline-quest / back-to-quest-list / view-quests / open-shop / complete-quest / close / skip / continue）
 * @property {number} [questId] - 关联任务ID
 * @property {string} [shopType] - 商店类型
 */

/**
 * @typedef {Object} DialoguePhase
 * @property {string} phase - 阶段标识（见 DIALOGUE_PHASE）
 * @property {Array<string>} lines - 对话文本行
 * @property {Array<DialogueOption>} options - 可选项
 * @property {Object} [quest] - 关联任务对象
 */

/**
 * @typedef {Object} DialogueNPC
 * @property {number} id - NPC ID
 * @property {string} name - NPC名称
 * @property {string} icon - NPC头像路径
 * @property {Object} [info] - NPC_INFO 原始信息
 */

/**
 * 对话系统组合式函数
 * @returns {Object} 对话系统状态和方法
 */
export function useDialogueSystem () {
  // 对话服务实例
  const dialogueService = new DialogueService(new StaticDataService())

  // ========== 响应式状态 ==========
  /** 对话框是否可见 */
  const isVisible = ref(false)
  /** 当前NPC信息 */
  const currentNPC = ref(null)
  /** 所有对话阶段 */
  const phases = ref([])
  /** 当前阶段索引 */
  const currentPhaseIndex = ref(0)
  /** 当前行索引（在当前阶段的多行对话中） */
  const currentLineIndex = ref(0)
  /** 是否正在打字机效果中 */
  const isTyping = ref(false)
  /** 当前显示的文本（打字机逐字显示） */
  const displayText = ref('')
  /** 是否正在加载对话数据 */
  const isLoading = ref(false)
  /** 当前选中的任务（用于回调） */
  const currentQuest = ref(null)
  /** 对话结束后的回调动作 */
  const pendingAction = ref(null)
  /** 物品数据映射（用于任务详情展示） */
  const itemData = ref({})
  /** 玩家等级（用于任务经验计算） */
  const playerLevel = ref(1)
  /** 是否自动跳过打字机效果（全局开关） */
  const autoSkipTypewriter = ref(false)

  // ========== 防重入标志 ==========
  // 防止 isVisible 和 npcId 两个 watch 同时触发 startDialogue 导致对话重复重启
  let isStartingDialogue = false

  // ========== 打字机效果 ==========
  let typewriterRAF = null
  let typewriterStartTime = 0
  const TYPE_SPEED = 35 // 每字35ms

  /**
   * 取消正在进行的打字机动画
   */
  const cancelTypewriter = () => {
    if (typewriterRAF) {
      cancelAnimationFrame(typewriterRAF)
      typewriterRAF = null
    }
    isTyping.value = false
  }

  /**
   * 启动打字机效果
   * 如果 autoSkipTypewriter 为 true，直接显示完整文本
   * @param {string} text - 要逐字显示的文本
   */
  const startTypewriter = (text) => {
    cancelTypewriter()
    if (!text) {
      displayText.value = ''
      return
    }

    // 如果开启了自动跳过，直接显示完整文本
    if (autoSkipTypewriter.value) {
      displayText.value = text
      return
    }

    isTyping.value = true
    displayText.value = ''
    typewriterStartTime = performance.now()
    const fullText = text

    const animate = (now) => {
      const elapsed = now - typewriterStartTime
      const charCount = Math.floor(elapsed / TYPE_SPEED)

      if (charCount >= fullText.length) {
        displayText.value = fullText
        isTyping.value = false
        typewriterRAF = null
        return
      }

      displayText.value = fullText.substring(0, charCount)
      typewriterRAF = requestAnimationFrame(animate)
    }

    typewriterRAF = requestAnimationFrame(animate)
  }

  /**
   * 切换自动跳过打字机效果
   * 开启后所有对话文本将直接显示，不再逐字播放
   */
  const toggleAutoSkip = () => {
    autoSkipTypewriter.value = !autoSkipTypewriter.value
    // 如果刚刚开启且当前正在打字，立即完成
    if (autoSkipTypewriter.value && isTyping.value) {
      skipTypewriter()
    }
  }

  /**
   * 跳过打字机效果，直接显示完整文本
   */
  const skipTypewriter = () => {
    if (!isTyping.value) return
    cancelTypewriter()
    const lines = currentPhase.value?.lines || []
    const line = lines[currentLineIndex.value] || ''
    displayText.value = line
  }

  // ========== 计算属性 ==========
  /** 当前阶段对象 */
  const currentPhase = computed(() => {
    return phases.value[currentPhaseIndex.value] || null
  })

  /** 当前行文本（完整） */
  const currentLine = computed(() => {
    const lines = currentPhase.value?.lines || []
    return lines[currentLineIndex.value] || ''
  })

  /** 是否还有下一行 */
  const hasNextLine = computed(() => {
    const lines = currentPhase.value?.lines || []
    return currentLineIndex.value < lines.length - 1
  })

  /** 是否还有下一阶段 */
  const hasNextPhase = computed(() => {
    return currentPhaseIndex.value < phases.value.length - 1
  })

  /** 当前是否显示选项 */
  const showOptions = computed(() => {
    if (isTyping.value) return false
    if (!currentPhase.value) return false
    // 当前行是最后一行时才显示选项
    if (hasNextLine.value) return false
    return (currentPhase.value.options || []).length > 0
  })

  /** 是否可以点击继续 */
  const canClickContinue = computed(() => {
    if (isTyping.value) return true // 点击跳过打字机
    if (!currentPhase.value) return false
    if (hasNextLine.value) return true // 还有下一行
    if (hasNextPhase.value && (currentPhase.value.options || []).length === 0) return true // 还有下一阶段且无选项
    return false
  })

  // ========== 核心方法 ==========

  /**
   * 更新当前行的显示
   */
  const updateDisplay = () => {
    const line = currentLine.value
    if (line) {
      startTypewriter(line)
    } else {
      displayText.value = ''
    }
  }

  /**
   * 前进到下一行或下一阶段
   */
  const advance = () => {
    // 如果正在打字，先跳过
    if (isTyping.value) {
      skipTypewriter()
      return
    }

    // 如果有下一行，前进到下一行
    if (hasNextLine.value) {
      currentLineIndex.value++
      updateDisplay()
      return
    }

    // 如果有选项，不自动前进（等玩家选择）
    if (showOptions.value) return

    // 如果有下一阶段且无选项，自动前进到下一阶段
    if (hasNextPhase.value) {
      currentPhaseIndex.value++
      currentLineIndex.value = 0
      updateDisplay()
    }
  }

  /**
   * 处理选项选择
   * @param {DialogueOption} option - 选中的选项
   * @param {Object} context - 上下文 { emit, close, openShop, openQuestPanel }
   */
  const selectOption = (option, context = {}) => {
    if (!option) return

    /** 关闭对话的统一方法，优先使用 context.close 以通知父组件 */
    const doClose = () => {
      closeDialogue()
      if (typeof context.close === 'function') {
        context.close()
      }
    }

    switch (option.action) {
      case 'select-quest': {
        // 从任务列表阶段中查找选中的任务
        const questListPhase = phases.value.find(p => p.phase === DIALOGUE_PHASE.QUEST_LIST)
        const quest = questListPhase?.quests?.find(q => q.id === option.questId)
        if (!quest) break

        // 等级不足拦截：不进入任务接取流程，显示提示后返回列表
        if (option.levelLocked || playerLevel.value < quest.minLevel) {
          const insertIndex = currentPhaseIndex.value + 1
          phases.value.splice(insertIndex, 0, {
            phase: DIALOGUE_PHASE.QUEST_INTRO,
            quest,
            lines: [`你的等级不足 ${quest.minLevel} 级，无法接取此任务。`, `请提升到 ${quest.minLevel} 级后再来找我。`],
            options: [{ label: '返回任务列表', action: 'back-to-quest-list' }]
          })
          currentPhaseIndex.value++
          currentLineIndex.value = 0
          updateDisplay()
          break
        }

        // 获取任务介绍对话
        const introLines = dialogueService.getQuestDialogLines(quest, DIALOGUE_PHASE.QUEST_INTRO, dialogueService._buildItemNameMap(quest, itemData.value))
        const questName = quest.name?.cns || quest.name?.en || '未知任务'

        // 构建任务详情（描述、目标、奖励）
        const detailLines = dialogueService.buildQuestDetails(quest, itemData.value, playerLevel.value)

        // 在当前阶段后插入任务介绍 + 任务详情选项两个阶段
        const insertIndex = currentPhaseIndex.value + 1
        phases.value.splice(insertIndex, 0, {
          phase: DIALOGUE_PHASE.QUEST_INTRO,
          quest,
          lines: introLines.length > 0 ? introLines : [quest.description?.cns || quest.description?.en || `这是「${questName}」的任务说明。`],
          options: []
        })
        phases.value.splice(insertIndex + 1, 0, {
          phase: DIALOGUE_PHASE.QUEST_OPTIONS,
          quest,
          lines: detailLines,
          options: [
            { label: '接受任务', action: 'accept-quest', questId: quest.id },
            { label: '拒绝任务', action: 'decline-quest', questId: quest.id },
            { label: '返回任务列表', action: 'back-to-quest-list' }
          ]
        })

        // 前进到任务介绍阶段
        currentPhaseIndex.value++
        currentLineIndex.value = 0
        updateDisplay()
        break
      }

      case 'select-complete-quest': {
        // 从可提交任务列表阶段中查找选中的任务
        const completeListPhase = phases.value.find(p => p.phase === DIALOGUE_PHASE.QUEST_COMPLETE_LIST)
        const quest = completeListPhase?.quests?.find(q => q.id === option.questId)
        if (!quest) break

        // 获取任务完成对话
        const completeLines = dialogueService.getQuestDialogLines(quest, DIALOGUE_PHASE.QUEST_COMPLETE, dialogueService._buildItemNameMap(quest, itemData.value))

        // 在当前阶段后插入任务完成阶段
        const insertIndex = currentPhaseIndex.value + 1
        phases.value.splice(insertIndex, 0, {
          phase: DIALOGUE_PHASE.QUEST_COMPLETE,
          quest,
          lines: completeLines.length > 0 ? completeLines : ['任务完成了！这是给你的奖励。'],
          options: [
            { label: '领取奖励', action: 'complete-quest', questId: quest.id },
            { label: '返回任务列表', action: 'back-to-complete-list' }
          ]
        })

        // 前进到任务完成阶段
        currentPhaseIndex.value++
        currentLineIndex.value = 0
        updateDisplay()
        break
      }

      case 'back-to-complete-list': {
        // 查找可提交任务列表阶段的索引
        const completeListIndex = phases.value.findIndex(p => p.phase === DIALOGUE_PHASE.QUEST_COMPLETE_LIST)
        if (completeListIndex < 0) {
          doClose()
          break
        }

        const completeListPhase = phases.value[completeListIndex]
        // 从列表中移除已处理的任务
        const handledQuest = currentPhase.value?.quest
        if (handledQuest) {
          completeListPhase.quests = completeListPhase.quests.filter(q => q.id !== handledQuest.id)
          completeListPhase.options = completeListPhase.options.filter(o => o.questId !== handledQuest.id)
        }

        // 删除列表之后插入的所有阶段
        phases.value.splice(completeListIndex + 1)

        // 如果列表还有任务，返回列表
        if (completeListPhase.quests.length > 0) {
          currentPhaseIndex.value = completeListIndex
          currentLineIndex.value = 0
          updateDisplay()
        } else {
          // 列表为空，移除列表阶段，前进到后续阶段
          phases.value.splice(completeListIndex, 1)
          if (completeListIndex < phases.value.length) {
            currentPhaseIndex.value = completeListIndex
          } else {
            currentPhaseIndex.value = Math.max(0, phases.value.length - 1)
          }
          currentLineIndex.value = 0
          updateDisplay()
        }
        break
      }

      case 'back-to-quest-list': {
        // 查找任务列表阶段的索引
        const questListIndex = phases.value.findIndex(p => p.phase === DIALOGUE_PHASE.QUEST_LIST)
        if (questListIndex < 0) {
          // 没有任务列表，直接关闭
          doClose()
          break
        }

        const questListPhase = phases.value[questListIndex]
        // 从任务列表中移除已处理的任务（接受或拒绝的）
        const handledQuest = currentPhase.value?.quest
        if (handledQuest) {
          questListPhase.quests = questListPhase.quests.filter(q => q.id !== handledQuest.id)
          questListPhase.options = questListPhase.options.filter(o => o.questId !== handledQuest.id)
        }

        // 删除任务列表之后插入的所有阶段（任务介绍/选项/接受/拒绝等）
        phases.value.splice(questListIndex + 1)

        // 如果任务列表还有任务，返回任务列表
        if (questListPhase.quests.length > 0) {
          currentPhaseIndex.value = questListIndex
          currentLineIndex.value = 0
          updateDisplay()
        } else {
          // 任务列表为空，移除任务列表阶段，前进到后续阶段（商店/告别）
          phases.value.splice(questListIndex, 1)
          if (questListIndex < phases.value.length) {
            currentPhaseIndex.value = questListIndex
          } else {
            currentPhaseIndex.value = Math.max(0, phases.value.length - 1)
          }
          currentLineIndex.value = 0
          updateDisplay()
        }
        break
      }

      case 'accept-quest': {
        const phase = currentPhase.value
        if (phase?.quest) {
          currentQuest.value = phase.quest
          // 显示接受对话
          const acceptLines = dialogueService.getQuestDialogLines(
            phase.quest,
            DIALOGUE_PHASE.QUEST_ACCEPT,
            dialogueService._buildItemNameMap(phase.quest, itemData.value)
          )
          // 插入接受阶段，完成后返回任务列表
          phases.value.splice(currentPhaseIndex.value + 1, 0, {
            phase: DIALOGUE_PHASE.QUEST_ACCEPT,
            quest: phase.quest,
            lines: acceptLines.length > 0 ? acceptLines : ['好的，我接受这个任务！'],
            options: [{ label: '返回任务列表', action: 'back-to-quest-list' }]
          })
          // 通知外部接受任务
          if (context.emit) {
            context.emit('quest-accepted', phase.quest)
          }
        }
        // 前进到接受阶段
        currentPhaseIndex.value++
        currentLineIndex.value = 0
        updateDisplay()
        break
      }

      case 'decline-quest': {
        const phase = currentPhase.value
        if (phase?.quest) {
          const declineLines = dialogueService.getQuestDialogLines(
            phase.quest,
            DIALOGUE_PHASE.QUEST_DECLINE,
            dialogueService._buildItemNameMap(phase.quest, itemData.value)
          )
          phases.value.splice(currentPhaseIndex.value + 1, 0, {
            phase: DIALOGUE_PHASE.QUEST_DECLINE,
            quest: phase.quest,
            lines: declineLines.length > 0 ? declineLines : ['没关系，你想好了再来找我吧。'],
            options: [{ label: '返回任务列表', action: 'back-to-quest-list' }]
          })
        }
        currentPhaseIndex.value++
        currentLineIndex.value = 0
        updateDisplay()
        break
      }

      case 'complete-quest': {
        const phase = currentPhase.value
        if (phase?.quest && context.emit) {
          context.emit('quest-completed', phase.quest)
        }
        // 前进到下一阶段
        if (hasNextPhase.value) {
          currentPhaseIndex.value++
          currentLineIndex.value = 0
          updateDisplay()
        }
        break
      }

      case 'view-quests': {
        pendingAction.value = 'view-quests'
        if (context.openQuestPanel) {
          context.openQuestPanel()
        }
        doClose()
        break
      }

      case 'open-shop': {
        pendingAction.value = `open-shop:${option.shopType}`
        if (context.openShop) {
          context.openShop(option.shopType)
        }
        doClose()
        break
      }

      case 'close':
        doClose()
        break

      case 'skip':
        // 跳过当前任务，前进到下一阶段
        if (hasNextPhase.value) {
          currentPhaseIndex.value++
          currentLineIndex.value = 0
          updateDisplay()
        }
        break

      case 'continue':
        // 继续到下一阶段
        if (hasNextPhase.value) {
          currentPhaseIndex.value++
          currentLineIndex.value = 0
          updateDisplay()
        } else {
          doClose()
        }
        break

      default:
        break
    }
  }

  /**
   * 启动对话
   * @param {Object} params - 启动参数
   * @param {number} params.npcId - NPC ID
   * @param {Object} params.npcConfig - NPC配置 { name, icon }
   * @param {Object} params.player - 玩家数据
   * @param {Object} [params.mapLevelRange] - 地图等级范围
   * @param {string} [params.shopType] - 商店类型
   * @param {Function} [onError] - 加载失败时的回调
   */
  const startDialogue = async (params, onError) => {
    // 防重入：如果上一次 startDialogue 尚未完成，直接跳过
    // 避免 isVisible / npcId 两个 watch 同时触发导致对话重复构建
    if (isStartingDialogue) return
    isStartingDialogue = true
    isLoading.value = true

    try {
      const sequence = await dialogueService.buildDialogueSequence(params)
      currentNPC.value = sequence.npc
      phases.value = sequence.phases
      currentPhaseIndex.value = 0
      currentLineIndex.value = 0
      currentQuest.value = null
      pendingAction.value = null
      // 存储物品数据和玩家等级，供任务详情展示使用
      itemData.value = sequence.itemData || {}
      playerLevel.value = sequence.playerLevel || 1

      // 启动第一行对话
      updateDisplay()
    } catch (error) {
      console.error('[useDialogueSystem] 启动对话失败:', error)
      // 通知外部关闭模态框
      if (typeof onError === 'function') {
        onError(error)
      }
    } finally {
      isLoading.value = false
      isStartingDialogue = false
    }
  }

  /**
   * 关闭对话
   */
  const closeDialogue = () => {
    cancelTypewriter()
    isVisible.value = false
    currentNPC.value = null
    phases.value = []
    currentPhaseIndex.value = 0
    currentLineIndex.value = 0
    displayText.value = ''
    currentQuest.value = null
    itemData.value = {}
    playerLevel.value = 1
  }

  // ========== 生命周期 ==========
  onUnmounted(() => {
    cancelTypewriter()
  })

  return {
    // 状态
    isVisible,
    currentNPC,
    currentPhase,
    currentLine,
    displayText,
    isTyping,
    isLoading,
    showOptions,
    canClickContinue,
    hasNextLine,
    hasNextPhase,
    currentQuest,
    pendingAction,
    autoSkipTypewriter,
    itemData,
    playerLevel,

    // 方法
    startDialogue,
    advance,
    selectOption,
    skipTypewriter,
    toggleAutoSkip,
    closeDialogue,

    // 服务（供外部调用）
    dialogueService
  }
}
