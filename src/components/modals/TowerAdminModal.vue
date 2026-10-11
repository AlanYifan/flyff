<template>
  <div v-if="isVisible" ref="towerPanel" class="tower-panel" :style="panelPosition">
    <div class="tower-panel-header" @mousedown="startDrag" @mouseup="stopDrag" @mousemove="onDrag">
      <div class="title-area">
        <img :src="npcAvatar" class="npc-icon" draggable="false" />
        <h2>深渊之塔管理员</h2>
      </div>
      <button id="towerCloseButton" @click="close">&times;</button>
    </div>
    <div class="tower-content-container">
      <!-- 任务列表区域 -->
      <div class="tower-list">
        <div class="tower-list-header">任务列表</div>

        <!-- 加载中提示 -->
        <div v-if="isLoadingQuests" class="loading-quests">
          <div class="loading-spinner"></div>
          <div class="loading-text">正在加载任务列表...</div>
        </div>

        <!-- 无任务提示 -->
        <div v-else-if="towerQuests.length === 0" class="no-towers">
          暂无深渊之塔任务
        </div>

        <!-- 任务列表 -->
        <div v-for="quest in towerQuests" :key="quest.id" class="tower-item" @click="showQuestDetail(quest)">
          <div class="tower-title">{{ getQuestDisplayName(quest) }}</div>
          <div class="tower-level">等级 {{ quest.minLevel }} - {{ quest.maxLevel }}</div>
        </div>
      </div>

      <!-- 任务详情区域 -->
      <div v-if="selectedQuest" class="tower-detail">
        <div class="tower-detail-top">
          <img :src="npcAvatar" class="npc-avatar" draggable="false" />
          <h2 class="tower-detail-title">
            {{ getQuestDisplayName(selectedQuest) }}
          </h2>
        </div>

        <div class="tower-detail-level">
          等级要求: {{ selectedQuest.minLevel }} - {{ selectedQuest.maxLevel }}
        </div>
        <div class="tower-detail-description">
          {{ selectedQuest.description?.cns || selectedQuest.description?.en || '暂无描述' }}
        </div>

        <!-- 击杀目标 -->
        <div class="tower-detail-section">
          <h3>击杀目标</h3>
          <!-- 显示击杀总数 -->
          <template v-for="monsterReq in selectedQuest.endKillMonsters" :key="monsterReq.monster">
            <div v-if="monsterReq.count > 0" class="tower-target-count-header">
              总计击杀: {{ monsterReq.count }}
            </div>
          </template>

          <div class="tower-targets">
            <template v-for="monsterReq in selectedQuest.endKillMonsters" :key="monsterReq.monster">
              <!-- 处理怪物数组：为每个怪物ID创建单独的显示项 -->
              <template v-if="Array.isArray(monsterReq.monster)">
                <div v-for="monsterId in monsterReq.monster" :key="monsterId" class="tower-target">
                  <img :src="`/pt/monster_icon/${monsterId}.png`" class="tower-target-icon" @error="handleImageError" />
                  <div class="tower-target-info">
                    <div class="tower-target-name">
                      {{ getMonsterName(monsterId) }}
                    </div>
                  </div>
                </div>
              </template>
              <!-- 处理单个怪物 -->
              <div v-else class="tower-target">
                <img :src="`/pt/monster_icon/${monsterReq.monster}.png`" class="tower-target-icon"
                  @error="handleImageError" />
                <div class="tower-target-info">
                  <div class="tower-target-name">
                    {{ getMonsterName(monsterReq.monster) }}
                  </div>
                </div>
              </div>
            </template>

            <div v-if="!selectedQuest.endKillMonsters || selectedQuest.endKillMonsters.length === 0" class="no-targets">
              无击杀目标
            </div>
          </div>
        </div>

        <!-- 任务奖励 -->
        <div class="tower-detail-section">
          <h3>任务奖励</h3>
          <div class="tower-rewards">
            <div v-if="selectedQuest.endReceiveExperience" class="tower-reward-item">
              <img src="/pt/UI/exp.png" class="tower-reward-icon" @error="handleImageError" />
              <div class="tower-reward-info">
                <div class="tower-reward-name">经验值</div>
                <div class="tower-reward-value">{{ getExpReward(selectedQuest) }}</div>
              </div>
            </div>

            <div v-if="selectedQuest.endReceiveGold" class="tower-reward-item">
              <img src="/pt/UI/gold.png" class="tower-reward-icon" @error="handleImageError" />
              <div class="tower-reward-info">
                <div class="tower-reward-name">金币</div>
                <div class="tower-reward-value">
                  {{ selectedQuest.endReceiveGold.toLocaleString() }}
                </div>
              </div>
            </div>

            <div v-for="itemReward in selectedQuest.endReceiveItems" :key="itemReward.item" class="tower-reward-item">
              <img :src="`/pt/item_icon/${itemReward.item}.png`" class="tower-reward-icon" @error="handleImageError" />
              <div class="tower-reward-info">
                <div class="tower-reward-name">{{ getItemName(itemReward.item) }}</div>
                <div class="tower-reward-value">x{{ itemReward.count || 1 }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 接受任务按钮 -->
        <div class="tower-action">
          <button v-if="player.level >= selectedQuest.minLevel" class="accept-tower-btn"
            @click="acceptQuest(selectedQuest)">
            接受任务
          </button>
          <div v-else class="level-required">
            需要等级 {{ selectedQuest.minLevel }} 才能接受此任务
          </div>
        </div>
      </div>

      <!-- 默认提示信息 -->
      <div v-if="!selectedQuest" class="tower-detail">
        <div class="default-info">请选择一个任务查看详情</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { StaticDataService } from '@/services/StaticDataService'

/**
 * 深渊之塔管理员模态框
 * 显示深渊之塔相关任务列表，支持按需加载任务数据
 */
export default {
  name: 'TowerAdminModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    player: {
      type: Object,
      default: () => ({})
    },
    gameData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'quest-accepted'],
  setup(props, { emit }) {
    const selectedQuest = ref(null)
    const towerPanel = ref(null)

    // 加载状态
    const isLoadingQuests = ref(false)
    const loadedQuestsData = ref(null)

    // 静态数据服务实例
    const staticDataService = new StaticDataService()

    // 拖拽相关状态
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })
    const panelPosition = ref({
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    })

    // 深渊之塔管理员NPC头像
    const npcAvatar = computed(() => {
      return '/pt/npc_icon/knight01.png'
    })

    // 获取深渊之塔任务列表
    const towerQuests = computed(() => {
      // 优先使用已加载的数据
      const questsData = loadedQuestsData.value || props.gameData?.quests

      if (!questsData) {
        return []
      }

      // 筛选beginNPC为11734的深渊之塔任务
      return Object.values(questsData || {})
        .filter(quest => quest.beginNPC === 11734)
        .sort((a, b) => a.minLevel - b.minLevel)
    })

    // 加载任务数据
    const loadQuestsData = async () => {
      // 如果已有数据，直接返回
      if (loadedQuestsData.value || props.gameData?.quests) {
        return
      }

      isLoadingQuests.value = true
      console.log('[TowerAdminModal] 开始按需加载任务数据...')

      try {
        const questsData = await staticDataService.loadQuestData()
        loadedQuestsData.value = questsData
        console.log('[TowerAdminModal] 任务数据加载完成，任务数:', Object.keys(questsData || {}).length)
      } catch (error) {
        console.error('[TowerAdminModal] 加载任务数据失败:', error)
        loadedQuestsData.value = null
      } finally {
        isLoadingQuests.value = false
      }
    }

    // 监听 isVisible 变化，按需加载任务数据
    watch(
      () => props.isVisible,
      async (isVisible) => {
        if (isVisible) {
          await loadQuestsData()
        }
      },
      { immediate: true }
    )

    // 关闭模态框
    const close = () => {
      emit('close')
    }

    // 显示任务详情
    const showQuestDetail = quest => {
      selectedQuest.value = quest
    }

    /**
     * 获取任务显示名称（深渊之塔任务为每日任务，添加[每日任务]后缀）
     * @param {Object} quest - 任务对象
     * @returns {string} 显示名称
     */
    const getQuestDisplayName = quest => {
      const baseName = quest.name?.cns || quest.name?.en || '未命名任务'
      // 深渊之塔任务（beginNPC 11734）为每日任务
      if (quest.beginNPC === 11734) {
        return `${baseName} [每日任务]`
      }
      return baseName
    }

    // 获取物品名称
    const getItemName = itemId => {
      const itemData = props.gameData?.items?.find(item => item.id === itemId)
      return itemData?.name?.cns || itemData?.name?.en || `物品ID: ${itemId}`
    }

    // 获取怪物名称
    const getMonsterName = monsterId => {
      // 处理怪物数据可能为对象或数组的情况
      let monsterData
      if (props.gameData?.monsters && typeof props.gameData.monsters === 'object') {
        if (Array.isArray(props.gameData.monsters)) {
          // 如果是数组，使用find方法
          monsterData = props.gameData.monsters.find(monster => monster.id === monsterId)
        } else {
          // 如果是对象，使用ID作为键直接访问
          monsterData = props.gameData.monsters[monsterId]
        }
      }
      return monsterData?.name?.cns || monsterData?.name?.en || `怪物ID: ${monsterId}`
    }

    // 获取经验奖励
    const getExpReward = quest => {
      if (Array.isArray(quest.endReceiveExperience)) {
        return (
          quest.endReceiveExperience[props.player.level - 1] || quest.endReceiveExperience[0] || 0
        )
      }
      return quest.endReceiveExperience || 0
    }

    // 处理图片加载错误
    const handleImageError = event => {
      event.target.src = '/pt/item_icon/default_item.png'
    }

    // 接受任务
    const acceptQuest = quest => {
      // 检查玩家等级是否满足任务要求
      if (props.player.level < quest.minLevel) {
        // 显示等级不足提示
        showLevelInsufficientMessage(quest.minLevel)
        return
      }

      // 检查任务是否已经在活动任务列表中
      const isAlreadyActive = props.player.quest?.activeQuests?.some(q => q.id === quest.id)
      if (isAlreadyActive) {
        showQuestAlreadyAcceptedMessage()
        return
      }

      // 每日任务（深渊之塔任务 beginNPC 11734）：检查今天是否已完成
      if (quest.beginNPC === 11734) {
        const todayStr = getTodayDateString()
        const dailyCompleted = props.player.quest?.dailyCompletedQuests || {}
        if (dailyCompleted[quest.id] === todayStr) {
          showDailyQuestCompletedMessage()
          return
        }
        // 每日任务不检查 completedQuests
      } else {
        // 普通任务：检查任务是否已经完成
        const isAlreadyCompleted = props.player.quest?.completedQuests?.some(q => q.id === quest.id)
        if (isAlreadyCompleted) {
          return
        }
      }

      // 发送任务接受事件
      emit('quest-accepted', quest)

      // 关闭面板
      close()
    }

    // 显示等级不足提示动画
    const showLevelInsufficientMessage = requiredLevel => {
      // 创建提示消息元素
      const message = document.createElement('div')
      message.textContent = `等级不足${requiredLevel}级，无法接受任务`
      message.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        z-index: 10000;
        opacity: 0;
        animation: slideUpFadeOut 3s ease-in-out forwards;
      `

      // 添加动画样式
      const style = document.createElement('style')
      style.textContent = `
        @keyframes slideUpFadeOut {
          0% {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
        }
      `
      document.head.appendChild(style)

      document.body.appendChild(message)

      // 3秒后移除消息
      setTimeout(() => {
        message.remove()
        style.remove()
      }, 3000)
    }

    // 显示任务已接受提示
    const showQuestAlreadyAcceptedMessage = () => {
      // 创建提示消息元素
      const message = document.createElement('div')
      message.textContent = '该任务已在进行中'
      message.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 165, 0, 0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        z-index: 10000;
        opacity: 0;
        animation: slideUpFadeOut 3s ease-in-out forwards;
      `

      // 添加动画样式
      const style = document.createElement('style')
      style.textContent = `
        @keyframes slideUpFadeOut {
          0% {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
        }
      `
      document.head.appendChild(style)

      document.body.appendChild(message)

      // 3秒后移除消息
      setTimeout(() => {
        message.remove()
        style.remove()
      }, 3000)
    }

    // 获取今日日期字符串（YYYY-MM-DD格式）
    const getTodayDateString = () => {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    }

    // 显示每日任务今日已完成提示
    const showDailyQuestCompletedMessage = () => {
      // 创建提示消息元素
      const message = document.createElement('div')
      message.textContent = '该每日任务今日已完成，请明天再来'
      message.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(100, 100, 100, 0.9);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        z-index: 10000;
        opacity: 0;
        animation: slideUpFadeOut 3s ease-in-out forwards;
      `

      // 添加动画样式
      const style = document.createElement('style')
      style.textContent = `
        @keyframes slideUpFadeOut {
          0% {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
        }
      `
      document.head.appendChild(style)

      document.body.appendChild(message)

      // 3秒后移除消息
      setTimeout(() => {
        message.remove()
        style.remove()
      }, 3000)
    }

    // 开始拖拽
    const startDrag = e => {
      // 只在标题栏上允许拖拽
      if (!e.target.closest('.tower-panel-header')) {
        return
      }

      isDragging.value = true
      const rect = towerPanel.value.getBoundingClientRect()
      dragOffset.value = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }

      // 移除transform以使用绝对定位
      panelPosition.value = {
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        transform: 'none'
      }

      // 防止文本选择
      e.preventDefault()
    }

    // 拖拽中
    const onDrag = e => {
      if (!isDragging.value) {
        return
      }

      const x = e.clientX - dragOffset.value.x
      const y = e.clientY - dragOffset.value.y

      // 边界检查
      const maxX = window.innerWidth - towerPanel.value.offsetWidth
      const maxY = window.innerHeight - towerPanel.value.offsetHeight

      const boundedX = Math.max(0, Math.min(x, maxX))
      const boundedY = Math.max(0, Math.min(y, maxY))

      panelPosition.value = {
        top: `${boundedY}px`,
        left: `${boundedX}px`,
        transform: 'none'
      }
    }

    // 停止拖拽
    const stopDrag = () => {
      isDragging.value = false
    }

    // 添加全局事件监听
    onMounted(() => {
      document.addEventListener('mousemove', onDrag)
      document.addEventListener('mouseup', stopDrag)
    })

    // 移除事件监听
    onUnmounted(() => {
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', stopDrag)
    })

    return {
      selectedQuest,
      towerPanel,
      panelPosition,
      npcAvatar,
      towerQuests,
      isLoadingQuests,
      close,
      showQuestDetail,
      getQuestDisplayName,
      getItemName,
      getMonsterName,
      getExpReward,
      handleImageError,
      acceptQuest,
      startDrag,
      onDrag,
      stopDrag
    }
  }
}
</script>

<style scoped>
.tower-panel {
  position: fixed;
  width: 77vh;
  height: 58vh;
  background: var(--theme-modal-bg);
  border: 5px solid var(--theme-border-strong);
  border-radius: 10px;
  padding: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 25px var(--theme-border);
  color: var(--theme-text);
  cursor: move;
  user-select: none;
}

.tower-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--theme-border);
  margin-bottom: 20px;
  background-color: var(--theme-surface-muted);
  position: sticky;
  top: 0;
  cursor: move;
  user-select: none;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 15px;
}

.npc-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid var(--theme-border-strong);
}

.tower-panel-header h2 {
  font-size: 24px;
  color: var(--theme-text);
  margin: 0;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

#towerCloseButton {
  width: 30px;
  height: 30px;
  background: none;
  color: var(--theme-text);
  border: none;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.3s ease;
}

#towerCloseButton:hover {
  transform: scale(1.1);
  color: var(--theme-accent-strong);
}

.tower-content-container {
  display: flex;
  flex: 1;
  gap: 20px;
  height: calc(100% - 80px);
}

  .tower-list {
    width: 300px;
    background: var(--theme-surface-muted);
    border-right: 1px solid var(--theme-border);
    border-radius: 5px;
    padding: 10px;
    overflow-y: auto;
    scrollbar-color: #ffd700 #000000;
    scrollbar-width: thin;
  }

  .tower-list::-webkit-scrollbar {
    width: 12px;
  }

  .tower-list::-webkit-scrollbar-track {
    background: #000000;
    border-radius: 6px;
  }

  .tower-list::-webkit-scrollbar-thumb {
    background: #ffd700;
    border-radius: 6px;
    border: 2px solid rgba(255, 215, 0, 0.3);
  }

  .tower-list::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 215, 0, 0.85);
  }

.tower-list-header {
  color: var(--theme-accent);
  margin-top: 0;
  border-bottom: 1px solid var(--theme-border);
  padding-bottom: 5px;
  margin-bottom: 10px;
  font-weight: bold;
}

  .tower-detail {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    scrollbar-color: #ffd700 #000000;
    scrollbar-width: thin;
  }

  .tower-detail::-webkit-scrollbar {
    width: 12px;
  }

  .tower-detail::-webkit-scrollbar-track {
    background: #000000;
    border-radius: 6px;
  }

  .tower-detail::-webkit-scrollbar-thumb {
    background: #ffd700;
    border-radius: 6px;
    border: 2px solid rgba(255, 215, 0, 0.3);
  }

  .tower-detail::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 215, 0, 0.85);
  }

.tower-item {
  padding: 10px;
  margin-bottom: 5px;
  background: var(--theme-surface-muted);
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.tower-item:hover {
  background: var(--theme-surface-strong);
}

.tower-title {
  color: var(--theme-text);
  font-weight: bold;
  margin-bottom: 5px;
}

.tower-level {
  color: var(--theme-muted);
  font-size: 12px;
}

.no-towers {
  color: var(--theme-muted);
  font-style: italic;
  text-align: center;
  padding: 20px;
}

.loading-quests {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--theme-muted);
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--theme-border);
  border-top-color: var(--theme-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.loading-text {
  font-size: 14px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.tower-detail-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.npc-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px solid var(--theme-border-strong);
}

.tower-detail-title {
  color: var(--theme-accent);
  font-size: 20px;
  margin: 0;
}

.tower-detail-level,
.tower-detail-description {
  margin-bottom: 15px;
  color: var(--theme-text);
}

.tower-detail-section {
  margin: 20px 0;
}

.tower-detail-section h3 {
  color: var(--theme-accent);
  border-bottom: 1px solid var(--theme-border);
  padding-bottom: 5px;
  margin-bottom: 15px;
}

.tower-targets,
.tower-rewards {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
}

.tower-target-count-header {
  color: var(--theme-accent);
  font-size: 16px;
  font-weight: bold;
  padding: 12px;
  background: var(--theme-surface-muted);
  border-radius: 5px;
  text-align: center;
  margin-bottom: 15px;
  display: block;
}

.tower-target,
.tower-reward-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--theme-surface-muted);
  padding: 8px;
  border-radius: 5px;
}

.tower-target-icon,
.tower-reward-icon {
  width: 40px;
  height: 40px;
  border-radius: 4px;
}

.tower-target-info,
.tower-reward-info {
  display: flex;
  flex-direction: column;
}

.tower-target-name,
.tower-reward-name {
  color: var(--theme-text);
}

.tower-target-count,
.tower-reward-value {
  color: var(--theme-muted);
  font-size: 14px;
}

.no-targets {
  color: var(--theme-muted);
  font-style: italic;
  text-align: center;
  padding: 10px;
}

.tower-action {
  margin-top: 20px;
  text-align: center;
}

.accept-tower-btn {
  padding: 10px 30px;
  background: var(--theme-accent);
  color: var(--theme-text-inverse);
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.accept-tower-btn:hover {
  background: var(--theme-accent-strong);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.level-required {
  color: var(--theme-accent-strong);
  font-size: 16px;
  padding: 10px;
  background: var(--theme-surface-muted);
  border-radius: 5px;
}

.default-info {
  text-align: center;
  color: var(--theme-muted);
  margin-top: 50px;
}
</style>
