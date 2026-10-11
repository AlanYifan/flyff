import { ref, computed } from 'vue'
import { QuestService } from '@/services/QuestService'

/**
 * 任务组合式API
 * 将任务相关的逻辑从Main.vue中抽离出来
 */
export function useQuest (gameDataService, uiService, audioService) {
  // 响应式数据
  const questService = ref(new QuestService(gameDataService, uiService, audioService))
  const activeQuestTab = ref('available')
  const selectedQuest = ref(null)
  const showQuestPanel = ref(false)
  const showNPCQuestPanel = ref(false)

  // 计算属性
  const availableQuests = computed(() => {
    if (!questService.value || !gameDataService) {
      return []
    }
    return questService.value.getAvailableQuests()
  })

  const activeQuests = computed(() => {
    if (!questService.value) {
      return []
    }
    return questService.value.getActiveQuests()
  })

  const completedQuests = computed(() => {
    if (!questService.value) {
      return []
    }
    return questService.value.getCompletedQuests()
  })

  const filteredQuests = computed(() => {
    if (activeQuestTab.value === 'available') {
      return availableQuests.value
    } else if (activeQuestTab.value === 'active') {
      return activeQuests.value
    } else {
      return completedQuests.value
    }
  })

  // 方法
  const switchQuestTab = tab => {
    activeQuestTab.value = tab
    selectedQuest.value = null
  }

  const openQuestPanel = () => {
    showQuestPanel.value = true
  }

  const closeQuestPanel = () => {
    showQuestPanel.value = false
  }

  const openNPCQuestPanel = () => {
    showNPCQuestPanel.value = true
  }

  const closeNPCQuestPanel = () => {
    showNPCQuestPanel.value = false
  }

  const selectQuest = quest => {
    selectedQuest.value = quest
  }

  const acceptQuest = (quest, playerLevel) => {
    if (!questService.value) {
      console.error('任务服务未初始化')
      return false
    }

    return questService.value.acceptQuest(quest, playerLevel)
  }

  const completeQuest = (quest, player, bagService) => {
    if (!questService.value) {
      console.error('任务服务未初始化')
      return false
    }

    return questService.value.completeQuest(quest, player, bagService)
  }

  const isQuestCompletable = (quest, player, bagService) => {
    if (!questService.value) {
      console.error('任务服务未初始化')
      return false
    }

    return questService.value.isQuestCompletable(quest, player, bagService)
  }

  const updateKillProgress = (monsterId, count = 1) => {
    if (!questService.value) {
      console.error('任务服务未初始化')
      return
    }

    questService.value.updateKillProgress(monsterId, count)
  }

  const updateCollectProgress = (itemId, count = 1) => {
    if (!questService.value) {
      console.error('任务服务未初始化')
      return
    }

    questService.value.updateCollectProgress(itemId, count)
  }

  // 暴露给外部使用的属性和方法
  return {
    // 响应式数据
    questService,
    activeQuestTab,
    selectedQuest,
    showQuestPanel,
    showNPCQuestPanel,

    // 计算属性
    availableQuests,
    activeQuests,
    completedQuests,
    filteredQuests,

    // 方法
    switchQuestTab,
    openQuestPanel,
    closeQuestPanel,
    openNPCQuestPanel,
    closeNPCQuestPanel,
    selectQuest,
    acceptQuest,
    completeQuest,
    isQuestCompletable,
    updateKillProgress,
    updateCollectProgress
  }
}
