import { ref } from 'vue'
import { QuestService } from '@/services/QuestService'
import { useGameStore } from '@/store'
import { syncQuestDataToPlayerQuest } from '@/utils/questSync'
import { buildJobChangeQuestRewardText } from '@/utils/jobChangeQuestHelper'

/**
 * 任务管理组合式API
 * 将任务相关的逻辑从Main.vue中抽离出来
 */
export function useQuestManager (gameInitializer, player) {
  // 响应式数据
  const quests = ref([])
  const questService = ref(null)

  // 加载任务数据
  const loadQuests = async () => {
    try {
      // 从游戏数据服务获取任务数据
      const questData = await gameInitializer.value.services.data.loadQuestData()
      quests.value = questData ? Object.values(questData) : []
    } catch (error) {
      console.error('加载任务数据失败:', error)
      quests.value = []
    }
  }

  // 处理任务接受
  const handleQuestAccepted = quest => {
    // 检查任务服务是否存在
    if (!questService.value) {
      console.error('任务服务未初始化')
      return
    }

    // 调用任务服务接受任务
    // ★ 传入玩家对象（而非仅等级），以支持大师进阶任务降级
    const success = questService.value.acceptQuest(quest, player.value)

    if (success) {
      // 同步任务服务数据到玩家对象
      syncQuestDataToPlayer()

      // ★ 大师进阶任务降级后，强制刷新 store 以触发 UI 响应式更新
      if (player.value?.masterGradeState?.isActive) {
        const gameStore = useGameStore()
        gameStore.updatePlayer({
          level: player.value.level,
          exp: player.value.exp,
          maxExp: player.value.maxExp,
          currentHealth: player.value.currentHealth,
          maxHealth: player.value.maxHealth,
          currentMana: player.value.currentMana,
          maxMana: player.value.maxMana,
          masterGradeState: { ...player.value.masterGradeState }
        })
      }

      // 保存玩家数据
      if (gameInitializer.value && gameInitializer.value.services.storage) {
        gameInitializer.value.services.storage.savePlayerData(player.value)
      }

      // 更新任务面板
      if (gameInitializer.value && gameInitializer.value.uiService) {
        gameInitializer.value.uiService.updateQuestPanel()
      }

      // 播放任务接受音乐（与深渊之塔管理员一致）
      if (gameInitializer.value && gameInitializer.value.services.audio) {
        gameInitializer.value.services.audio.playMusicSFX('BgmEvStart.mp3')
      }
    }
  }

  // 同步任务服务数据到玩家对象
  const syncQuestDataToPlayer = () => {
    if (!questService.value || !player.value) {
      return
    }
    syncQuestDataToPlayerQuest(player.value, questService.value)
  }

  // 处理任务完成
  const handleQuestCompleted = quest => {
    if (!quest) return

    // ★ 转职任务走专用的完成逻辑
    if (quest.isJobChangeQuest && quest.targetJobKey !== undefined && quest.questIndex !== undefined) {
      const gameStore = useGameStore()
      gameStore.completeJobChangeQuest(quest.targetJobKey, quest.questIndex)

      const questName = quest.name?.cns || quest.name?.en || quest.id
      // ★ 构建转职任务奖励文本，在战斗日志文字和动画中同时显示奖励
      const rewardText = buildJobChangeQuestRewardText(quest.targetJobKey, quest.questIndex)
      if (typeof window.addBattleLog === 'function') {
        window.addBattleLog(`[任务完成] ${questName}${rewardText}`, 'quest')
      }
      if (typeof window.showAnimationMessage === 'function') {
        window.showAnimationMessage(`任务完成: ${questName}${rewardText}`, 'quest', '', '', '', '', '✅')
      }
      if (typeof window.playQuestCompleteSound === 'function') {
        window.playQuestCompleteSound()
      }

      // 保存玩家数据
      if (gameInitializer.value && gameInitializer.value.services.storage) {
        gameInitializer.value.services.storage.savePlayerData(player.value)
      }
      return
    }

    // 检查任务服务是否存在
    if (!questService.value) {
      console.error('任务服务未初始化')
      return
    }

    // 检查任务是否可以完成
    const isCompletable = questService.value.isQuestCompletable(
      quest,
      player.value
    )
    if (!isCompletable) {
      return
    }

    // 调用任务服务完成任务
    const gameStore = useGameStore()
    const success = questService.value.completeQuest(
      quest,
      player.value,
      undefined,
      gameStore.equipmentSets
    )

    if (success) {
      const questName = quest.name?.cns || quest.name?.en || quest.id

      // 获取任务奖励信息
      const gameData = gameInitializer.value?.state?.gameData || window.gameData
      const questData = gameData?.quests?.[quest.id] || quest

      // 获取经验奖励
      let expReward = 0
      if (questData?.endReceiveExperience) {
        const source = questData.endReceiveExperience
        if (Array.isArray(source)) {
          const index = Number(player.value?.level) - 1
          const safeIndex = Number.isFinite(index) && index >= 0 ? index : 0
          expReward = Number(source[safeIndex] ?? source[0] ?? 0)
        } else {
          expReward = Number(source)
        }
        if (!Number.isFinite(expReward) || expReward <= 0) {
          expReward = 0
        }
      }

      // 获取金币奖励
      let goldReward = 0
      if (questData?.endReceiveGold) {
        const source = questData.endReceiveGold
        if (Array.isArray(source)) {
          const index = Number(player.value?.level) - 1
          const safeIndex = Number.isFinite(index) && index >= 0 ? index : 0
          goldReward = Number(source[safeIndex] ?? source[0] ?? 0)
        } else {
          goldReward = Number(source)
        }
        if (!Number.isFinite(goldReward) || goldReward <= 0) {
          goldReward = 0
        }
      }

      // 获取物品奖励
      const itemRewards = questData?.endReceiveItems || []

      // 构建奖励文本
      const rewardParts = []
      if (expReward > 0) {
        rewardParts.push(`经验 ${expReward}%`)
      }
      if (goldReward > 0) {
        rewardParts.push(`金币 ${goldReward.toLocaleString()}`)
      }
      if (itemRewards.length > 0) {
        itemRewards.forEach(item => {
          const itemData = gameData?.items?.[item.item] || window.gameData?.items?.[item.item]
          const itemName = itemData?.name?.cns || itemData?.name?.en || `物品${item.item}`
          rewardParts.push(`${itemName} x${item.count || 1}`)
        })
      }

      const rewardText = rewardParts.length > 0 ? ` 获得: ${rewardParts.join(', ')}` : ''

      // 添加战斗日志文字
      if (typeof window.addBattleLog === 'function') {
        window.addBattleLog(`[任务完成] ${questName}${rewardText}`, 'quest')
      }

      // 显示战斗日志动画
      if (typeof window.showAnimationMessage === 'function') {
        window.showAnimationMessage(`任务完成: ${questName}`, 'quest', '', '', '', '', '✅')
      }

      // 播放任务完成音效
      if (typeof window.playQuestCompleteSound === 'function') {
        window.playQuestCompleteSound()
      }

      // 同步任务服务数据到玩家对象
      syncQuestDataToPlayer()

      // ★ 大师进阶任务完成后恢复等级，强制刷新 store 以触发 UI 响应式更新
      if (player.value?.masterGradeState && !player.value.masterGradeState.isActive) {
        const gameStore = useGameStore()
        gameStore.updatePlayer({
          level: player.value.level,
          exp: player.value.exp,
          maxExp: player.value.maxExp,
          currentHealth: player.value.currentHealth,
          maxHealth: player.value.maxHealth,
          currentMana: player.value.currentMana,
          maxMana: player.value.maxMana,
          masterGradeState: { ...player.value.masterGradeState }
        })
      }

      // 保存玩家数据
      if (gameInitializer.value && gameInitializer.value.services.storage) {
        gameInitializer.value.services.storage.savePlayerData(player.value)
      }

      // 更新任务面板
      if (gameInitializer.value && gameInitializer.value.uiService) {
        gameInitializer.value.uiService.updateQuestPanel()
      }
    }
  }

  /**
   * 处理任务移除（放弃任务）
   * 从进行中任务列表中移除任务，不发放奖励，不记录完成
   * @param {Object} quest - 要移除的任务对象
   * @returns {void}
   */
  const handleQuestRemoved = quest => {
    if (!quest) {
      console.error('[useQuestManager] 移除任务失败：任务对象为空')
      return
    }

    // ★ 转职任务不支持通过面板移除
    if (quest.isJobChangeQuest) {
      console.warn('[useQuestManager] 转职任务不支持移除')
      return
    }

    if (!questService.value) {
      console.error('[useQuestManager] 任务服务未初始化')
      return
    }

    // ★ 传入玩家对象，以支持大师进阶任务放弃时恢复等级
    const success = questService.value.removeQuest(quest, player.value)

    if (success) {
      const questName = quest.name?.cns || quest.name?.en || quest.id

      // 同步任务服务数据到玩家对象
      syncQuestDataToPlayer()

      // ★ 大师进阶任务放弃后恢复等级，强制刷新 store 以触发 UI 响应式更新
      if (player.value?.masterGradeState && !player.value.masterGradeState.isActive) {
        const gameStore = useGameStore()
        gameStore.updatePlayer({
          level: player.value.level,
          exp: player.value.exp,
          maxExp: player.value.maxExp,
          currentHealth: player.value.currentHealth,
          maxHealth: player.value.maxHealth,
          currentMana: player.value.currentMana,
          maxMana: player.value.maxMana,
          masterGradeState: { ...player.value.masterGradeState }
        })
      }

      // 保存玩家数据到 localStorage
      if (gameInitializer.value && gameInitializer.value.services.storage) {
        gameInitializer.value.services.storage.savePlayerData(player.value)
      }

      // 更新任务面板
      if (gameInitializer.value && gameInitializer.value.uiService) {
        gameInitializer.value.uiService.updateQuestPanel()
      }

      // 添加战斗日志
      if (typeof window.addBattleLog === 'function') {
        window.addBattleLog(`[任务放弃] ${questName}`, 'quest')
      }

      // 显示提示动画
      if (typeof window.showAnimationMessage === 'function') {
        window.showAnimationMessage(`已放弃任务: ${questName}`, 'quest', '', '', '', '', '🗑')
      }

      console.log(`[useQuestManager] 任务已移除: ${questName}`)
    }
  }

  // 初始化任务服务
  const initQuestService = () => {
    if (gameInitializer.value && gameInitializer.value.services.quest) {
      // 如果gameInitializer已经提供了任务服务，直接使用
      questService.value = gameInitializer.value.services.quest
    } else if (
      gameInitializer.value &&
      gameInitializer.value.services.data &&
      gameInitializer.value.services.ui &&
      gameInitializer.value.services.audio
    ) {
      // 否则创建新的QuestService实例
      questService.value = new QuestService(
        gameInitializer.value.services.data,
        gameInitializer.value.services.ui,
        gameInitializer.value.services.audio
      )
    } else {
      console.warn('无法初始化任务服务：缺少必要的服务')
    }

    // 从玩家对象加载任务数据到任务服务
    // ★ 过滤掉转职任务，questService 不管理转职任务
    if (player.value && player.value.quest && questService.value) {
      const questData = {
        activeQuests: (player.value.quest.activeQuests || []).filter(q => !q.isJobChangeQuest),
        completedQuests: (player.value.quest.completedQuests || []).filter(q => !q.isJobChangeQuest),
        dailyCompletedQuests: player.value.quest.dailyCompletedQuests || {}
      }
      questService.value.setPlayerQuests(questData)
    }

    // 初始化后同步任务数据到玩家对象
    syncQuestDataToPlayer()
  }

  // 暴露给外部使用的属性和方法
  return {
    // 响应式数据
    quests,
    questService,

    // 方法
    loadQuests,
    handleQuestAccepted,
    handleQuestCompleted,
    handleQuestRemoved,
    initQuestService
  }
}
