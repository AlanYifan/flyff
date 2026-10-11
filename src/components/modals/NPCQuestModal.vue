<template>
  <div v-if="isVisible" ref="questPanel" class="quest-panel" :style="panelPosition">
    <div class="quest-panel-header" @mousedown="startDrag" @mouseup="stopDrag" @mousemove="onDrag">
      <div class="title-area">
        <img :src="npcAvatar" class="npc-icon" draggable="false" />
        <h2>任务系统</h2>
      </div>
      <div class="quest-tabs">
        <div class="quest-tab" :class="{ active: activeTab === 'available' }" @click="switchTab('available')">
          可接取
        </div>
      </div>
      <button id="questCloseButton" @click="close">&times;</button>
    </div>
    <div class="dialog-area">
      {{ currentDialog }}
    </div>
    <div class="quest-content-container">
      <!-- 任务列表区域 -->
      <div class="quest-list">
        <!-- 加载状态 -->
        <div v-if="isLoadingQuests" class="loading-quests">
          <div class="loading-spinner"></div>
          <div class="loading-text">正在加载任务列表...</div>
        </div>

        <!-- 任务列表 -->
        <div v-for="quest in availableQuests" :key="quest.id" class="quest-item" @click="showQuestDetail(quest)">
          <div class="quest-title">{{ quest.name?.cns || quest.name?.en || '未命名任务' }}</div>
          <div class="quest-level">等级 {{ quest.minLevel }} - {{ quest.maxLevel }}</div>
        </div>

        <div v-if="!isLoadingQuests && availableQuests.length === 0" class="no-quests">暂无可接取的任务</div>
      </div>

      <!-- 任务详情区域 -->
      <div v-if="selectedQuest" class="quest-detail">
        <div class="quest-detail-top">
          <img :src="npcAvatar" class="npc-avatar" draggable="false" />
          <h2 class="quest-detail-title">
            {{ selectedQuest.name?.cns || selectedQuest.name?.en || '未命名任务' }}
          </h2>
        </div>

        <div class="quest-detail-type">任务类型: {{ getQuestType(selectedQuest.type) }}</div>
        <div class="quest-detail-level">
          等级要求: {{ selectedQuest.minLevel }} - {{ selectedQuest.maxLevel }}
        </div>
        <div class="quest-detail-description">
          {{ selectedQuest.description?.cns || selectedQuest.description?.en || '暂无描述' }}
        </div>

        <!-- 任务需求 -->
        <div class="quest-detail-section">
          <h3>任务需求</h3>
          <div class="quest-requirements">
            <!-- 收集物品目标 -->
            <template v-if="selectedQuest.endNeededItems && selectedQuest.endNeededItems.length > 0">
              <div
                v-for="itemReq in selectedQuest.endNeededItems"
                :key="itemReq.item"
                class="quest-requirement"
              >
                <img
                  :src="`/pt/item_icon/${itemReq.item}.png`"
                  class="quest-requirement-icon"
                  @error="handleImageError"
                />
                <div class="quest-requirement-info">
                  <div class="quest-requirement-name">{{ getItemName(itemReq.item) }}</div>
                  <div class="quest-requirement-count">数量: x{{ itemReq.count }}</div>
                </div>
              </div>
            </template>

            <!-- 击杀怪物目标 -->
            <template v-if="selectedQuest.endKillMonsters && selectedQuest.endKillMonsters.length > 0">
              <template v-for="monsterReq in selectedQuest.endKillMonsters" :key="monsterReq.monster">
                <!-- 处理怪物数组：为每个怪物ID创建单独的显示项 -->
                <template v-if="Array.isArray(monsterReq.monster)">
                  <div
                    v-for="monsterId in monsterReq.monster"
                    :key="monsterId"
                    class="quest-requirement"
                  >
                    <img
                      :src="`/pt/monster_icon/${monsterId}.png`"
                      class="quest-requirement-icon"
                      @error="handleImageError"
                    />
                    <div class="quest-requirement-info">
                      <div class="quest-requirement-name">
                        {{ getMonsterName(monsterId) }}
                      </div>
                      <div class="quest-requirement-count">击杀: {{ monsterReq.count }}</div>
                    </div>
                  </div>
                </template>
                <!-- 处理单个怪物 -->
                <div v-else class="quest-requirement">
                  <img
                    :src="`/pt/monster_icon/${monsterReq.monster}.png`"
                    class="quest-requirement-icon"
                    @error="handleImageError"
                  />
                  <div class="quest-requirement-info">
                    <div class="quest-requirement-name">
                      {{ getMonsterName(monsterReq.monster) }}
                    </div>
                    <div class="quest-requirement-count">击杀: {{ monsterReq.count }}</div>
                  </div>
                </div>
              </template>
            </template>

            <!-- 无任务需求 -->
            <div
              v-if="(!selectedQuest.endNeededItems || selectedQuest.endNeededItems.length === 0) && (!selectedQuest.endKillMonsters || selectedQuest.endKillMonsters.length === 0)"
              class="no-requirements"
            >
              无特殊需求
            </div>
          </div>
        </div>

        <!-- 任务奖励 -->
        <div class="quest-detail-section">
          <h3>任务奖励</h3>
          <div class="quest-rewards">
            <div v-if="selectedQuest.endReceiveExperience" class="quest-reward-item">
              <img src="/pt/UI/exp.png" class="quest-reward-icon" @error="handleImageError" />
              <div class="quest-reward-info">
                <div class="quest-reward-name">经验值</div>
                <div class="quest-reward-value">{{ getExpReward(selectedQuest) }}%</div>
              </div>
            </div>

            <div v-if="selectedQuest.endReceiveGold" class="quest-reward-item">
              <img src="/pt/UI/gold.png" class="quest-reward-icon" @error="handleImageError" />
              <div class="quest-reward-info">
                <div class="quest-reward-name">金币</div>
                <div class="quest-reward-value">
                  {{ selectedQuest.endReceiveGold.toLocaleString() }}
                </div>
              </div>
            </div>

            <div v-for="itemReward in selectedQuest.endReceiveItems" :key="itemReward.item" class="quest-reward-item">
              <img :src="`/pt/item_icon/${itemReward.item}.png`" class="quest-reward-icon" @error="handleImageError" />
              <div class="quest-reward-info">
                <div class="quest-reward-name">{{ getItemName(itemReward.item) }}</div>
                <div class="quest-reward-value">x{{ itemReward.count || 1 }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 接受任务按钮 -->
        <div class="quest-action">
          <button
            v-if="player.level >= selectedQuest.minLevel"
            class="accept-quest-btn"
            @click="acceptQuest(selectedQuest)"
          >
            接受任务
          </button>
          <div v-else class="level-required">
            需要等级 {{ selectedQuest.minLevel }} 才能接受此任务
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useMapsStore } from '@/store/maps'
import { useMonstersStore } from '@/store/monsters'
import QuestCacheService from '@/services/QuestCacheService'
import StaticDataService from '@/services/StaticDataService'

// 创建 StaticDataService 实例
const staticDataService = new StaticDataService()

export default {
  name: 'NPCQuestModal',
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
    },
    currentMap: {
      type: Object,
      default: () => ({ name: '帕里大陆', levelRange: '1-20', background: '/pt/map/pl.png' })
    }
  },
  emits: ['close', 'quest-accepted'],
  setup (props, { emit }) {
    const mapsStore = useMapsStore()
    const monstersStore = useMonstersStore()
    const activeTab = ref('available')
    const selectedQuest = ref(null)
    const questPanel = ref(null)

    // 拖拽相关状态
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })
    const panelPosition = ref({
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    })

    // 根据当前地图获取对应的NPC头像
    const npcAvatar = computed(() => {
      const npcAvatars = {
        帕里大陆: '/pt/npc_icon/agent.png',
        晨光大陆: '/pt/npc_icon/agent.png',
        莱斯大陆: '/pt/npc_icon/agent.png',
        '达肯1,2大陆': '/pt/npc_icon/agent.png',
        达肯3大陆: '/pt/npc_icon/agent.png',
        阿兹利亚: '/pt/npc_icon/buur.png',
        珊瑚岛: '/pt/npc_icon/remi.png',
        凯伦草原: '/pt/npc_icon/miorang.png'
      }

      return npcAvatars[props.currentMap.name] || '/pt/npc_icon/agent.png'
    })

    const npcName = computed(() => {
      const npcNames = {
        帕里大陆: '任务委托中心-米歇尔',
        晨光大陆: '任务委托中心-兰科米',
        莱斯大陆: '任务委托中心-米歇尔',
        '达肯1,2大陆': '任务委托中心-皮姬',
        达肯3大陆: '任务委托中心-皮姬',
        阿兹利亚: '任务委托中心-布尔',
        珊瑚岛: '任务委托中心-发明家蕾米',
        凯伦草原: '任务委托中心-米奥朗'
      }

      return npcNames[props.currentMap.name] || '任务委托中心-米歇尔'
    })

    const createQuestDialogs = (name, mapName) => [
      `${name}：欢迎来到${mapName}的任务委托中心，有适合你的委托等着你。`,
      `勇敢的冒险者，${name}已为${mapName}准备好新的挑战与奖励。`,
      `别忘了查看任务详情，${name}会为你记录在${mapName}的功绩。`,
      `想要更快成长？听听${name}的建议，稳扎稳打最可靠。`,
      `${name}：在${mapName}行动前，先挑一项合适的委托更稳当。`
    ]

    const currentDialog = ref('')

    const updateDialog = () => {
      if (!props.isVisible) {
        return
      }
      const dialogs = createQuestDialogs(npcName.value, props.currentMap?.name || '帕里大陆')
      currentDialog.value = dialogs[Math.floor(Math.random() * dialogs.length)]
    }

    // 获取可接取任务列表（使用 IndexedDB 缓存优化性能）
    const availableQuests = ref([])
    const isLoadingQuests = ref(false)
    const isComputing = ref(false) // 防止重复计算

    const playerQuestSignature = computed(() => {
      const activeIds = Array.isArray(props.player?.quest?.activeQuests)
        ? props.player.quest.activeQuests.map(q => Number(q?.id)).filter(Number.isFinite).sort((a, b) => a - b)
        : []
      const completedIds = Array.isArray(props.player?.quest?.completedQuests)
        ? props.player.quest.completedQuests.map(q => Number(q?.id)).filter(Number.isFinite).sort((a, b) => a - b)
        : []
      return `${activeIds.join(',')}|${completedIds.join(',')}`
    })

    const filterPlayerQuestState = quests => {
      const activeQuestIds = new Set(props.player?.quest?.activeQuests?.map(q => q.id) || [])
      const completedQuestIds = new Set(props.player?.quest?.completedQuests?.map(q => q.id) || [])
      return Array.isArray(quests)
        ? quests.filter(quest => !activeQuestIds.has(quest.id) && !completedQuestIds.has(quest.id))
        : []
    }

    // 监听数据变化，重新计算任务列表
    watch(
      [() => props.isVisible, () => props.gameData?.quests, () => props.currentMap?.name, () => props.player?.level, playerQuestSignature],
      async () => {
        if (!props.isVisible) {
          return
        }

        // 如果 gameData.quests 不存在，从 StaticDataService 加载
        let questsData = props.gameData?.quests
        if (!questsData) {
          console.log('[NPCQuestModal] gameData.quests 不存在，尝试从 StaticDataService 加载...')
          try {
            questsData = await staticDataService.loadQuestData()
            console.log('[NPCQuestModal] 任务数据加载完成，任务数:', Object.keys(questsData || {}).length)
          } catch (error) {
            console.error('[NPCQuestModal] 加载任务数据失败:', error)
            availableQuests.value = []
            return
          }
        }

        if (!questsData) {
          availableQuests.value = []
          return
        }

        // 防止重复计算
        if (isComputing.value) {
          console.log('[NPCQuestModal] 正在计算中，跳过此次更新')
          return
        }

        // 生成缓存键
        const cacheKey = QuestCacheService.generateCacheKey(
          props.currentMap.name,
          props.player?.level || 1
        )

        console.log(`[NPCQuestModal] 尝试从缓存获取任务列表: ${cacheKey}`)

        // 先尝试从缓存获取
        const cachedQuests = await QuestCacheService.get(cacheKey)

        if (cachedQuests) {
          console.log(`[NPCQuestModal] 缓存命中，任务数: ${cachedQuests.length}`)
          availableQuests.value = filterPlayerQuestState(cachedQuests)
          return
        }

        // 缓存未命中，计算任务列表
        console.log('[NPCQuestModal] 缓存未命中，开始计算任务列表...')
        isComputing.value = true
        isLoadingQuests.value = true

        const startTime = performance.now()

        try {
          // 获取当前地图等级范围（从 Pinia Store）
          const mapLevelRange = mapsStore.getMapLevelRange(props.currentMap.name)

          // 筛选有效NPC的任务ID
          const validNpcIds = [29, 4000, 4677, 9645, 17461]

          // 筛选任务
          const baseQuests = Object.values(questsData || {})
            .filter(quest => validNpcIds.includes(quest.beginNPC))
            .filter(quest => {
              // 等级验证：任务最小等级必须在当前地图等级范围内
              const isLevelValid =
                quest.minLevel >= mapLevelRange.minLevel && quest.minLevel <= mapLevelRange.maxLevel

              return isLevelValid
            })
            .sort((a, b) => a.minLevel - b.minLevel)

          // 更新任务列表
          availableQuests.value = filterPlayerQuestState(baseQuests)

          // 缓存结果（有效期 1 小时）
          await QuestCacheService.set(cacheKey, baseQuests, 3600000)

          const endTime = performance.now()
          console.log(
            `[NPCQuestModal] 任务列表计算完成，耗时: ${(endTime - startTime).toFixed(2)}ms，任务数: ${availableQuests.value.length}`
          )
        } catch (error) {
          console.error('[NPCQuestModal] 计算任务列表失败:', error)
        } finally {
          isComputing.value = false
          isLoadingQuests.value = false
        }
      },
      { immediate: true, deep: false }
    )

    // 切换标签页
    const switchTab = tab => {
      activeTab.value = tab
      selectedQuest.value = null

      // 播放点击音效
      if (typeof window !== 'undefined' && window.playClickSound) {
        window.playClickSound()
      }
    }

    watch([() => props.isVisible, () => props.currentMap?.name], updateDialog, { immediate: true })

    // 关闭模态框
    const close = () => {
      emit('close')

      // 播放点击音效
      if (typeof window !== 'undefined' && window.playClickSound) {
        window.playClickSound()
      }
    }

    // 显示任务详情
    const showQuestDetail = quest => {
      selectedQuest.value = quest

      // 播放点击音效
      if (typeof window !== 'undefined' && window.playClickSound) {
        window.playClickSound()
      }
    }

    // 获取任务类型中文名
    const getQuestType = type => {
      const types = {
        chain: '链式任务',
        category: '普通任务',
        daily: '每日任务',
        weekly: '每周任务'
      }
      return types[type] || type
    }

    // 获取物品名称
    const getItemName = itemId => {
      let itemData
      const items = props.gameData?.items
      if (Array.isArray(items)) {
        itemData = items.find(item => item.id === itemId)
      } else if (items && typeof items === 'object') {
        itemData = items[itemId]
      }
      return itemData?.name?.cns || itemData?.name?.en || `物品ID: ${itemId}`
    }

    // 获取怪物名称
    const getMonsterName = monsterId => {
      // 优先从 monstersStore 获取（更可靠）
      const monsterConfig = monstersStore.getMonsterConfig(monsterId)
      if (monsterConfig?.name) {
        return monsterConfig.name.cns || monsterConfig.name.en || `怪物ID: ${monsterId}`
      }

      // 回退到 gameData.monsters
      const monsters = props.gameData?.monsters
      if (!monsters) {
        return `怪物ID: ${monsterId}`
      }

      let monsterData
      if (Array.isArray(monsters)) {
        monsterData = monsters.find(monster => monster.id === monsterId)
      } else if (monsters && typeof monsters === 'object') {
        monsterData = monsters[monsterId]
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
        return
      }

      // 检查任务是否已经在活动任务列表中
      const isAlreadyActive = props.player?.quest?.activeQuests?.some(q => q.id === quest.id)
      if (isAlreadyActive) {
        return
      }

      // 检查任务是否已经完成
      const isAlreadyCompleted = props.player?.quest?.completedQuests?.some(
        q => q.id === quest.id
      )
      if (isAlreadyCompleted) {
        return
      }

      // 发送任务接受事件
      emit('quest-accepted', quest)

      // 关闭面板
      close()
    }

    // 开始拖拽
    const startDrag = e => {
      // 只在标题栏上允许拖拽
      if (!e.target.closest('.quest-panel-header')) {
        return
      }

      isDragging.value = true
      const rect = questPanel.value.getBoundingClientRect()
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
      const maxX = window.innerWidth - questPanel.value.offsetWidth
      const maxY = window.innerHeight - questPanel.value.offsetHeight

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
      activeTab,
      selectedQuest,
      questPanel,
      panelPosition,
      npcAvatar,
      currentDialog,
      availableQuests,
      isLoadingQuests,
      switchTab,
      close,
      showQuestDetail,
      getQuestType,
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
.quest-panel {
  position: fixed;
  width: 60vh;
  height: 60vh;
  background: var(--theme-quest-bg);
  border: 2px solid #ffd700;
  border-radius: 15px;
  padding: 20px;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.3);
  color: var(--theme-text);
  cursor: move;
  user-select: none;
}

.quest-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
  margin-bottom: 20px;
  background-color: var(--theme-quest-bg);
  position: sticky;
  top: 0;
  cursor: move;
  user-select: none;
}

.dialog-area {
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 15px;
  text-align: center;
  font-size: 14px;
  line-height: 1.5;
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
}

.quest-panel-header h2 {
  font-size: 26px;
  color: var(--theme-accent);
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  margin: 0;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.quest-tabs {
  display: flex;
  gap: 10px;
  margin: 0 20px;
}

.quest-tab {
  padding: 8px 20px;
  color: var(--theme-text);
  cursor: pointer;
  border-radius: 15px;
  background: rgba(255, 215, 0, 0.1);
  transition: all 0.3s;
}

.quest-tab:hover {
  background: rgba(255, 215, 0, 0.2);
}

.quest-tab.active {
  background: rgba(255, 215, 0, 0.4);
  border-color: #ffd700;
}

#questCloseButton {
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #ffd700 0%, #b8860b 100%);
  color: var(--theme-text);
  border: none;
  border-radius: 50%;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

#questCloseButton:hover {
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
}

.quest-content-container {
  display: flex;
  flex: 1;
  gap: 20px;
  height: calc(100% - 135px);
}

.quest-list {
  width: 250px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 15px;
  overflow-y: auto;
}

.quest-list::-webkit-scrollbar {
  width: 8px;
}

.quest-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
}

.quest-list::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.3);
  border-radius: 4px;
}

.quest-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.5);
}

.quest-detail {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 20px;
  overflow-y: auto;
}

.quest-detail::-webkit-scrollbar {
  width: 8px;
}

.quest-detail::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
}

.quest-detail::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.3);
  border-radius: 4px;
}

.quest-detail::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.5);
}

.quest-item {
  padding: 10px;
  margin-bottom: 10px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.quest-item:hover {
  background: rgba(255, 215, 0, 0.2);
}

.quest-title {
  color: #ffd700;
  font-weight: bold;
  margin-bottom: 5px;
}

.quest-level {
  color: var(--theme-muted);
  font-size: 12px;
}

.no-quests {
  color: var(--theme-muted);
  font-style: italic;
  text-align: center;
  padding: 20px;
}

.quest-detail-top {
  display: flex;
  align-items: center;
  flex-direction: column;
}

.npc-avatar {
  width: 15%;
  height: 15%;
  border-radius: 5%;
}

.quest-detail-title {
  color: #ffd700;
  font-size: 24px;
  margin: 0;
}

.quest-detail-type,
.quest-detail-level,
.quest-detail-description {
  margin-bottom: 5px;
  color: var(--theme-text);
}

.quest-detail-type {
  color: var(--theme-muted);
}

.quest-detail-section {
  margin: 5px;
}

.quest-detail-section h3 {
  color: #ffd700;
  margin-bottom: 5px;
}

.quest-requirements,
.quest-rewards {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.quest-requirement,
.quest-reward-item {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
}

.quest-requirement-icon,
.quest-reward-icon {
  width: 50px;
  height: 50px;
  border-radius: 4px;
}

.quest-requirement-info,
.quest-reward-info {
  display: flex;
  flex-direction: column;
}

.quest-requirement-name,
.quest-reward-name {
  color: var(--theme-text);
}

.quest-requirement-count,
.quest-reward-value {
  color: var(--theme-muted);
  font-size: 15px;
}

.no-requirements {
  color: var(--theme-muted);
  font-style: italic;
  text-align: center;
  padding: 15px;
}

.quest-action {
  margin-top: 30px;
  text-align: center;
}

.accept-quest-btn {
  padding: 10px 30px;
  background: linear-gradient(135deg, #ffd700 0%, #b8860b 100%);
  color: var(--theme-text);
  border: none;
  border-radius: 20px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.accept-quest-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
}

.level-required {
  color: #ff4444;
  font-size: 16px;
  padding: 10px;
  background: rgba(255, 0, 0, 0.1);
  border-radius: 10px;
}

.loading-quests {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #ffd700;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 215, 0, 0.3);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.loading-text {
  font-size: 14px;
  color: var(--theme-muted);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
