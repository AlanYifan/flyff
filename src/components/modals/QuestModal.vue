<template>
  <transition name="player-quest-panel" appear>
    <div v-if="isVisible" ref="panelRef" class="player-quest-panel" :style="panelStyle">
      <!-- 内层缩放容器：固定基础尺寸，通过 transform: scale 等比例缩放所有内容 -->
      <div class="player-quest-panel-scaler" :style="scalerStyle">
      <div class="player-quest-panel-header" @mousedown="startDrag">
        <h2>玩家任务面板</h2>
        <div class="quest-tabs">
          <div class="quest-tab" :class="{ active: activeTab === 'active' }" @click="switchTab('active')">
            进行中任务
          </div>
          <div class="quest-tab" :class="{ active: activeTab === 'completed' }" @click="switchTab('completed')">
            已完成任务
          </div>
        </div>
        <button id="questCloseButton" @click="close">&times;</button>
      </div>
      <div ref="questListContainer" class="quest-list-container">
        <!-- 任务列表将在这里显示 -->
        <div
          v-for="quest in filteredQuests"
          :key="quest.id"
          class="quest-item"
          :class="{ active: activeTab === 'active', completed: activeTab === 'completed' }"
          @click="showQuestDetail(quest)"
        >
          <div class="quest-title">{{ quest.name?.cns || quest.name?.en || '未命名任务' }}</div>
          <div class="quest-level">
            等级要求: {{ quest.minLevel || 1 }} - {{ quest.maxLevel || 99 }}
          </div>
          <div class="quest-description">
            {{ quest.description?.cns || quest.description?.en || '无任务描述' }}
          </div>

          <!-- 任务需求 -->
          <div
            v-if="
              getQuestData(quest)?.endNeededItems?.length > 0 ||
              getQuestData(quest)?.endKillMonsters?.length > 0
            "
            class="quest-objectives"
          >
            <div class="quest-objectives-title">📋 任务需求</div>
            <div v-for="itemReq in getQuestData(quest)?.endNeededItems" :key="itemReq.item" class="quest-requirement">
              <img
                :src="`/pt/item_icon/${itemReq.item}.png`"
                class="quest-requirement-icon"
                @error="handleImageError"
                @mouseenter="showItemTooltip($event, getItemData(itemReq.item))"
                @mouseleave="hideItemTooltip"
              />
              <span :style="{ color: activeTab === 'completed' || getPlayerItemCount(itemReq.item) >= itemReq.count ? '#00ff00' : '#ccc' }">
                收集 {{ getItemName(itemReq.item) }}: {{
                  activeTab === 'completed' ? itemReq.count : getPlayerItemCount(itemReq.item)
                }}/{{ itemReq.count }}
              </span>
            </div>

            <div v-for="monsterReq in getQuestData(quest)?.endKillMonsters" :key="monsterReq.monster[0]" class="quest-requirement">
              <img
                :src="`/pt/monster_icon/${monsterReq.monster[0]}.png`"
                class="quest-requirement-icon"
                @error="handleImageError"
                @mouseenter="showMonsterTooltip($event, monsterReq.monster[0])"
                @mousemove="moveMonsterTooltip($event)"
                @mouseleave="hideMonsterTooltip"
              />
              <span :style="{ color: activeTab === 'completed' || (monsterReq.current || 0) >= monsterReq.count ? '#00ff00' : '#ccc' }">
                击杀 {{ getMonsterName(monsterReq.monster[0]) }}:
                {{ activeTab === 'completed' ? monsterReq.count : (monsterReq.current || 0) }}/{{ monsterReq.count }}
              </span>
            </div>
          </div>

          <!-- 大师进阶任务目标等级提示 -->
          <div v-if="isMasterQuest(quest)" class="quest-master-grade-info">
            <span class="master-grade-target">
              🎯 目标等级: {{ getMasterTargetLevel(quest) }}级
              <span class="master-grade-current">（当前: {{ player.level }}级）</span>
            </span>
            <!-- 大师进阶活跃状态惩罚提示 -->
            <div v-if="activeTab === 'active' && player.masterGradeState?.isActive" class="master-grade-penalty">
              <span class="penalty-tag penalty-exp">⚠️ 经验值 -50%</span>
              <span class="penalty-tag penalty-drop">⚠️ 掉落率 -50%</span>
            </div>
          </div>

          <!-- 任务奖励 -->
          <div
            v-if="
              getQuestExpReward(quest) > 0 ||
              getQuestGoldReward(quest) > 0 ||
              getQuestItemRewards(quest).length > 0
            "
            class="quest-reward"
          >
            <div class="quest-reward-title">🎁 奖励明细</div>
            <div v-if="getQuestExpReward(quest) > 0" class="quest-reward-line quest-reward-exp">
              <span class="quest-reward-exp-tag">EXP</span>
              <span class="quest-reward-text">经验奖励: {{ getQuestExpReward(quest).toLocaleString() }}</span>
            </div>
            <div v-if="getQuestGoldReward(quest) > 0" class="quest-reward-line quest-reward-gold">
              <img
                src="/pt/UI/gold.png"
                class="quest-reward-gold-icon"
                alt="金币"
                @error="handleImageError"
              />
              <span class="quest-reward-text">金币奖励: {{ formatGold4(getQuestGoldReward(quest)) }}</span>
            </div>
            <div v-for="itemReward in getQuestItemRewards(quest)" :key="itemReward.item" class="quest-reward-item">
              <img
                :src="`/pt/item_icon/${itemReward.item}.png`"
                class="quest-requirement-icon"
                @error="handleImageError"
                @mouseenter="showItemTooltip($event, getItemData(itemReward.item))"
                @mouseleave="hideItemTooltip"
              />
              <span>{{ getItemName(itemReward.item) }} x{{ itemReward.count || 1 }}</span>
            </div>
          </div>

          <!-- 任务操作按钮区（仅在进行中任务标签页显示） -->
          <div v-if="activeTab === 'active'" class="quest-action-section">
            <button
              v-if="isQuestCompletable(quest)"
              class="complete-quest-btn"
              @click.stop="completeQuest(quest)"
            >
              完成
            </button>
            <button
              class="remove-quest-btn"
              @click.stop="confirmRemoveQuest(quest)"
            >
              放弃
            </button>
          </div>

          <!-- 移除确认弹窗 -->
          <div
            v-if="removingQuestId === quest.id"
            class="quest-remove-confirm"
            @click.stop
          >
            <span class="quest-remove-confirm-text">确定要放弃此任务吗？</span>
            <div class="quest-remove-confirm-btns">
              <button class="quest-remove-confirm-yes" @click.stop="executeRemove(quest)">确定</button>
              <button class="quest-remove-confirm-no" @click.stop="cancelRemove">取消</button>
            </div>
          </div>
        </div>

        <div v-if="filteredQuests.length === 0" class="no-quests">
          {{ activeTab === 'active' ? '暂无进行中的任务' : '暂无已完成的任务' }}
        </div>
      </div>
      </div>
      <!-- 右下角拉伸手柄 -->
      <div
        class="resize-handle"
        :class="{ 'resize-handle--active': isResizing }"
        @mousedown="startResize"
        title="拖拽缩放面板"
      >
        <span class="resize-handle-arrow"></span>
        <span class="resize-handle-arrow"></span>
        <span class="resize-handle-arrow"></span>
      </div>
    </div>
  </transition>
</template>

<script>
/**
 * 任务面板（玩家任务）
 *
 * @file QuestModal.vue
 * @generated 2026-01-28
 */
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { isMasterGradeQuest, getMasterQuestConfig, isMasterQuestLevelMet } from '@/services/MasterGradeService'
import { ITEM_INFO } from '@/data/ITEM_INFO'
import { formatGold4 } from '@/utils/goldDisplay'

export default {
  name: 'QuestModal',
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
  emits: ['close', 'quest-completed', 'quest-removed'],
  setup (props, { emit }) {
    const activeTab = ref('active')
    const selectedQuest = ref(null)
    const questListContainer = ref(null)
    const panelRef = ref(null)
    const removingQuestId = ref(null)

    const position = ref({ x: 0, y: 0 })
    const positionMode = ref('center')
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })
    const panelSize = ref({ width: 0, height: 0 })
    const hasInitializedPosition = ref(false)

    // ===== 面板缩放（右下角拉伸）=====
    /** 基础宽度（px），缩放基准 */
    const BASE_WIDTH = 500
    /** 基础高度（px），缩放基准 */
    const BASE_HEIGHT = 400
    /** 最小缩放比例 */
    const MIN_SCALE = 0.6
    /** 最大缩放比例 */
    const MAX_SCALE = 2.0

    /** 当前缩放比例 */
    const scale = ref(1)
    /** 是否正在拉伸 */
    const isResizing = ref(false)
    /** 拉伸起始信息（记录鼠标位置和初始缩放） */
    const resizeStart = ref({ scale: 1, x: 0, y: 0 })

    /**
     * 计算面板样式（通过 top/left 固定定位，便于拖拽移动）。
     * @returns {Record<string, string>}
     */
    const panelStyle = computed(() => {
      const sizeStyle = {
        width: `${BASE_WIDTH * scale.value}px`,
        height: `${BASE_HEIGHT * scale.value}px`
      }

      if (positionMode.value === 'center') {
        return {
          ...sizeStyle,
          left: '50%',
          top: '50%',
          translate: '-50% -50%'
        }
      }

      return {
        ...sizeStyle,
        left: `${position.value.x}px`,
        top: `${position.value.y}px`,
        translate: '0 0'
      }
    })

    /**
     * 内层缩放容器样式（固定基础尺寸，通过 transform: scale 等比例缩放）。
     * @returns {Record<string, string>}
     */
    const scalerStyle = computed(() => ({
      width: `${BASE_WIDTH}px`,
      height: `${BASE_HEIGHT}px`,
      transform: `scale(${scale.value})`,
      transformOrigin: 'top left'
    }))

    // 切换标签页
    const switchTab = tab => {
      activeTab.value = tab
      selectedQuest.value = null
    }

    // 关闭模态框
    const close = () => {
      emit('close')
    }

    // 显示任务详情
    const showQuestDetail = quest => {
      selectedQuest.value = quest
    }

    /**
     * 刷新面板尺寸缓存（用于拖拽边界限制）。
     * @returns {void}
     */
    const updatePanelSize = () => {
      const el = panelRef.value
      if (!el) {
        return
      }
      const rect = el.getBoundingClientRect()
      panelSize.value = { width: rect.width, height: rect.height }
    }

    /**
     * 将面板定位到屏幕中央（仅首次打开时执行），并缓存面板尺寸。
     * @returns {Promise<void>}
     */
    const ensureDefaultPosition = async () => {
      if (hasInitializedPosition.value) {
        return
      }
      await nextTick()
      positionMode.value = 'center'
      hasInitializedPosition.value = true
    }

    /**
     * 将数值限制在范围内。
     * @param {number} value
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    const clamp = (value, min, max) => {
      return Math.max(min, Math.min(max, value))
    }

    /**
     * 面板拖拽开始（仅允许从头部拖拽，且不影响按钮/标签点击）。
     * @param {MouseEvent} event
     * @returns {void}
     */
    const startDrag = event => {
      if (!event || event.button !== 0) {
        return
      }
      if (
        event.target.closest('button, input, select, textarea') ||
        event.target.closest('.quest-tab')
      ) {
        return
      }

      if (positionMode.value === 'center' && panelRef.value) {
        const rect = panelRef.value.getBoundingClientRect()
        position.value = { x: rect.left, y: rect.top }
        positionMode.value = 'absolute'
      }

      updatePanelSize()
      isDragging.value = true
      dragOffset.value = {
        x: event.clientX - position.value.x,
        y: event.clientY - position.value.y
      }
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', stopDrag)
      document.addEventListener('mouseleave', stopDrag)
    }

    /**
     * 面板拖拽移动处理。
     * @param {MouseEvent} event
     * @returns {void}
     */
    const handleDragMove = event => {
      if (!isDragging.value) {
        return
      }

      const width = panelSize.value.width || 500
      const height = panelSize.value.height || 400

      const minX = 0
      const minY = 0
      const maxX = Math.max(0, window.innerWidth - width)
      const maxY = Math.max(0, window.innerHeight - height)

      const nextX = clamp(event.clientX - dragOffset.value.x, minX, maxX)
      const nextY = clamp(event.clientY - dragOffset.value.y, minY, maxY)

      position.value = { x: nextX, y: nextY }
    }

    /**
     * 面板拖拽结束处理。
     * @returns {void}
     */
    const stopDrag = () => {
      if (!isDragging.value) {
        return
      }
      isDragging.value = false
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', stopDrag)
      document.removeEventListener('mouseleave', stopDrag)
    }

    /**
     * 右下角拉伸开始（mousedown），以水平拖拽距离为基准等比例缩放。
     * @param {MouseEvent} event - 鼠标按下事件
     * @returns {void}
     */
    const startResize = event => {
      if (!event || event.button !== 0) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      isResizing.value = true
      resizeStart.value = {
        scale: scale.value,
        x: event.clientX,
        y: event.clientY
      }
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', stopResize)
    }

    /**
     * 拉伸移动处理，根据水平拖拽距离计算新的缩放比例。
     * @param {MouseEvent} event - 鼠标移动事件
     * @returns {void}
     */
    const handleResizeMove = event => {
      if (!isResizing.value) {
        return
      }
      const deltaX = event.clientX - resizeStart.value.x
      const newScale = resizeStart.value.scale + deltaX / BASE_WIDTH
      scale.value = clamp(newScale, MIN_SCALE, MAX_SCALE)
    }

    /**
     * 拉伸结束，移除事件监听。
     * @returns {void}
     */
    const stopResize = () => {
      if (!isResizing.value) {
        return
      }
      isResizing.value = false
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', stopResize)
    }

    // 获取过滤后的任务列表
    const filteredQuests = computed(() => {
      if (activeTab.value === 'active') {
        return props.player.quest?.activeQuests || []
      } else {
        return props.player.quest?.completedQuests || []
      }
    })

    /**
     * 从 gameData 的集合中按 id 获取配置对象（兼容数组/对象两种结构）。
     * @param {any} source - props.gameData?.items / props.gameData?.monsters
     * @param {number|string} id - 目标 id
     * @returns {any|null} 找到的对象或 null
     */
    const resolveGameDataEntry = (source, id) => {
      if (!source) {
        return null
      }

      const key = String(id)

      if (Array.isArray(source)) {
        return (
          source.find(entry => {
            if (!entry) {
              return false
            }
            const entryId = entry.id ?? entry.key
            return String(entryId) === key
          }) || null
        )
      }

      if (typeof source === 'object') {
        return source[id] || source[key] || null
      }

      return null
    }

    // 获取物品名称
    const getItemName = itemId => {
      const itemData = resolveGameDataEntry(props.gameData?.items, itemId)
        || resolveGameDataEntry(ITEM_INFO, itemId)
      return itemData?.name?.cns || itemData?.name?.en || `物品ID: ${itemId}`
    }

    // 获取怪物名称
    const getMonsterName = monsterId => {
      const monsterData = resolveGameDataEntry(props.gameData?.monsters, monsterId)
      return monsterData?.name?.cns || monsterData?.name?.en || `怪物ID: ${monsterId}`
    }

    // 获取物品数据
    const getItemData = itemId => {
      // 优先从 gameData 查找，回退到静态 ITEM_INFO
      return resolveGameDataEntry(props.gameData?.items, itemId)
        || resolveGameDataEntry(ITEM_INFO, itemId)
    }

    // 获取玩家物品数量
    const getPlayerItemCount = itemId => {
      if (!props.player.bag) {
        return 0
      }
      const key = String(itemId)
      return props.player.bag
        .filter(item => item && String(item.id) === key)
        .reduce((total, item) => {
          const raw = item.currentStack ?? item.quantity ?? 1
          const value = Number(raw)
          return total + (Number.isFinite(value) && value > 0 ? value : 1)
        }, 0)
    }

    const getQuestData = quest => {
      if (!quest) {
        return null
      }
      return resolveGameDataEntry(props.gameData?.quests, quest.id) || quest
    }

    const getQuestExpReward = quest => {
      const questData = getQuestData(quest)
      const source = questData?.endReceiveExperience
      if (!source) {
        return 0
      }
      if (Array.isArray(source)) {
        const index = Number(props.player?.level) - 1
        const safeIndex = Number.isFinite(index) && index >= 0 ? index : 0
        const raw = source[safeIndex] ?? source[0] ?? 0
        const value = Number(raw)
        return Number.isFinite(value) && value > 0 ? value : 0
      }
      const value = Number(source)
      return Number.isFinite(value) && value > 0 ? value : 0
    }

    const getQuestGoldReward = quest => {
      const questData = getQuestData(quest)
      const source = questData?.endReceiveGold
      if (!source) {
        return 0
      }
      if (Array.isArray(source)) {
        const index = Number(props.player?.level) - 1
        const safeIndex = Number.isFinite(index) && index >= 0 ? index : 0
        const raw = source[safeIndex] ?? source[0] ?? 0
        const value = Number(raw)
        return Number.isFinite(value) && value > 0 ? value : 0
      }
      const value = Number(source)
      return Number.isFinite(value) && value > 0 ? value : 0
    }

    const getQuestItemRewards = quest => {
      const questData = getQuestData(quest)
      const items = questData?.endReceiveItems
      return Array.isArray(items) ? items : []
    }

    /**
     * 判断任务是否为大师进阶任务
     * @param {Object} quest - 任务对象
     * @returns {boolean}
     */
    const isMasterQuest = (quest) => {
      return quest ? isMasterGradeQuest(quest.id) : false
    }

    /**
     * 获取大师进阶任务的目标等级
     * @param {Object} quest - 任务对象
     * @returns {number|null}
     */
    const getMasterTargetLevel = (quest) => {
      if (!quest) return null
      const config = getMasterQuestConfig(quest.id)
      return config?.targetLevel || null
    }

    // 处理图片加载错误
    const handleImageError = event => {
      event.target.src = '/pt/item_icon/default_item.png'
    }

    // 显示物品详情提示框
    const showItemTooltip = (event, itemData) => {
      if (!itemData) {
        return
      }

      // 创建自定义事件显示物品详情
      const tooltipEvent = new CustomEvent('show-item-tooltip', {
        detail: {
          item: itemData,
          position: { x: event.clientX, y: event.clientY }
        }
      })
      window.dispatchEvent(tooltipEvent)
    }

    // 隐藏物品详情提示框
    const hideItemTooltip = () => {
      const tooltipEvent = new CustomEvent('hide-item-tooltip')
      window.dispatchEvent(tooltipEvent)
    }

    /**
     * 显示怪物详情提示框
     * @param {MouseEvent} event - 鼠标事件
     * @param {number|string} monsterId - 怪物 ID
     */
    const showMonsterTooltip = (event, monsterId) => {
      if (monsterId === null || monsterId === undefined) return
      window.dispatchEvent(new CustomEvent('show-monster-tooltip', {
        detail: {
          monsterId,
          position: { x: event.clientX, y: event.clientY }
        }
      }))
    }

    /**
     * 移动怪物详情提示框
     * @param {MouseEvent} event - 鼠标事件
     */
    const moveMonsterTooltip = event => {
      window.dispatchEvent(new CustomEvent('move-monster-tooltip', {
        detail: {
          position: { x: event.clientX, y: event.clientY }
        }
      }))
    }

    /**
     * 隐藏怪物详情提示框
     */
    const hideMonsterTooltip = () => {
      window.dispatchEvent(new CustomEvent('hide-monster-tooltip'))
    }

    // 监听任务数据变化，更新任务列表
    watch(
      () => [props.player.quest?.activeQuests, props.player.quest?.completedQuests],
      () => {
        // 任务数据更新时的处理逻辑
      },
      { deep: true }
    )

    // 检查任务是否可完成
    const isQuestCompletable = quest => {
      // 检查物品收集是否完成
      if (quest.endNeededItems && Array.isArray(quest.endNeededItems)) {
        for (const itemReq of quest.endNeededItems) {
          const playerItemCount = getPlayerItemCount(itemReq.item)
          if (playerItemCount < itemReq.count) {
            return false
          }
        }
      }

      // 检查怪物击杀是否完成
      if (quest.endKillMonsters && Array.isArray(quest.endKillMonsters)) {
        for (const monsterReq of quest.endKillMonsters) {
          const current = monsterReq.current || 0
          if (current < monsterReq.count) {
            return false
          }
        }
      }

      // ★ 大师进阶任务：检查玩家等级是否达到目标等级
      if (isMasterGradeQuest(quest.id)) {
        if (!isMasterQuestLevelMet(props.player, quest)) {
          return false
        }
      }

      return true
    }

    // 完成任务
    const completeQuest = quest => {
      // 触发任务完成事件
      emit('quest-completed', quest)
    }

    /**
     * 点击移除按钮，显示二次确认面板
     * @param {Object} quest - 要移除的任务对象
     * @returns {void}
     */
    const confirmRemoveQuest = quest => {
      removingQuestId.value = quest.id
    }

    /**
     * 取消移除，关闭确认面板
     * @returns {void}
     */
    const cancelRemove = () => {
      removingQuestId.value = null
    }

    /**
     * 确认移除任务，派发 quest-removed 事件
     * @param {Object} quest - 要移除的任务对象
     * @returns {void}
     */
    const executeRemove = quest => {
      removingQuestId.value = null
      emit('quest-removed', quest)
    }

    watch(
      () => props.isVisible,
      newValue => {
        if (newValue) {
          hasInitializedPosition.value = false
          ensureDefaultPosition()
          return
        }
        stopDrag()
      }
    )

    onUnmounted(() => {
      stopDrag()
      stopResize()
    })

    return {
      activeTab,
      selectedQuest,
      questListContainer,
      panelRef,
      panelStyle,
      filteredQuests,
      switchTab,
      close,
      showQuestDetail,
      getItemName,
      getMonsterName,
      getItemData,
      getPlayerItemCount,
      getQuestExpReward,
      getQuestGoldReward,
      formatGold4,
      getQuestItemRewards,
      isMasterQuest,
      getMasterTargetLevel,
      getQuestData,
      handleImageError,
      showItemTooltip,
      hideItemTooltip,
      showMonsterTooltip,
      moveMonsterTooltip,
      hideMonsterTooltip,
      isQuestCompletable,
      completeQuest,
      confirmRemoveQuest,
      cancelRemove,
      executeRemove,
      removingQuestId,
      startDrag,
      startResize,
      isResizing,
      scalerStyle
    }
  }
}
</script>

<style scoped>
/* 任务面板基础样式 - 牛皮纸信封风格 */
.player-quest-panel {
  position: fixed;
  /* 宽高由 JS panelStyle 动态控制（基础尺寸 × 缩放比例） */
  background: var(--theme-quest-bg);
  border-radius: 15px;
  box-shadow:
    0 0 25px rgba(0, 0, 0, 0.5),
    inset 0 0 50px rgba(139, 90, 43, 0.3),
    inset 0 0 20px rgba(0, 0, 0, 0.1);
  color: var(--theme-text);
  z-index: 1000;
  box-sizing: border-box;
  opacity: 1;
  transform: translateY(0) scale(1);
  will-change: transform, opacity;
  overflow: hidden;
}

/* 内层缩放容器 - 固定基础尺寸，通过 transform: scale 等比例缩放所有内容 */
.player-quest-panel-scaler {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: stretch;
  align-items: stretch;
  overflow: hidden;
  border-radius: 15px;
}

.player-quest-panel-enter-active,
.player-quest-panel-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.player-quest-panel-enter-from,
.player-quest-panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.player-quest-panel-enter-to,
.player-quest-panel-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.player-quest-panel-scaler::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: repeating-linear-gradient(0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 4px);
  pointer-events: none;
  border-radius: 15px;
}

.player-quest-panel-scaler::after {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border: 2px dashed var(--theme-border);
  border-radius: 10px;
  pointer-events: none;
}

/* 任务面板头部 - 牛皮纸信封风格 */
.player-quest-panel-header {
  position: sticky;
  top: 0;
  padding: 15px 20px;
  border-bottom: 2px solid var(--theme-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--theme-quest-bg);
  border-radius: 15px 15px 0 0;
  z-index: 1;
  user-select: none;
  cursor: move;
  width: 100%;
  box-sizing: border-box;
}

.player-quest-panel-header h2 {
  font-size: 24px;
  color: var(--theme-accent);
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
  margin: 0;
  font-family: 'Georgia', serif;
  font-weight: bold;
}

/* 任务标签页样式 - 牛皮纸信封风格 */
.quest-tabs {
  display: flex;
  gap: 10px;
}

.quest-tab {
  padding: 8px 15px;
  background: var(--theme-panel-bg);
  border: 2px solid var(--theme-border);
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--theme-text);
  font-weight: bold;
}

.quest-tab:hover {
  background: var(--theme-surface-muted);
  border-color: var(--theme-border-strong);
}

.quest-tab.active {
  background: var(--theme-surface);
  border-color: var(--theme-border-strong);
  color: var(--theme-text);
}

/* 任务列表容器 - 牛皮纸信封风格 */
.quest-list-container {
  flex: 1;
  padding: 10px;
  margin: 10px;
  overflow-y: auto;
  width: calc(100% - 20px);
  display: flex;
  flex-direction: row;
  align-content: flex-start;
  box-sizing: border-box;
  flex-wrap: wrap;
}

.quest-list-container::-webkit-scrollbar {
  width: 12px;
}

.quest-list-container::-webkit-scrollbar-track {
  background: var(--theme-surface-muted);
  border-radius: 6px;
}

.quest-list-container::-webkit-scrollbar-thumb {
  background: var(--theme-surface-strong);
  border-radius: 6px;
  border: 2px solid var(--theme-border);
}

/* 任务信息样式 - 牛皮纸信封风格 */
#quest-info {
  background: var(--theme-surface-muted);
  border-radius: 10px;
  padding: 5px;
  border: 1px solid var(--theme-border);
}

#quest-name {
  font-size: 20px;
  color: var(--theme-accent);
  font-weight: bold;
  font-family: 'Georgia', serif;
}

#quest-description {
  color: var(--theme-text);
  line-height: 1.6;
  margin-bottom: 5px;
}

#quest-level {
  color: var(--theme-text);
}

/* 任务相关样式 - 牛皮纸信封风格 */
.quest-item {
  position: relative;
  background: var(--theme-panel-bg);
  border-radius: 8px;
  padding: 10px;
  margin: 10px;
  border: 2px solid var(--theme-border);
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  overflow-x: hidden;
  width: 100%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.quest-item:hover {
  background: var(--theme-surface-muted);
  border-color: var(--theme-border-strong);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

 

.quest-title {
  font-weight: bold;
  color: var(--theme-accent);
  margin-bottom: 5px;
  font-family: 'Georgia', serif;
}

.quest-description {
  color: var(--theme-text);
  font-size: 14px;
  margin-bottom: 8px;
}

.quest-objectives {
  color: var(--theme-text);
  font-size: 13px;
  margin-top: 8px;
  padding: 8px 10px;
  background: var(--theme-surface-muted);
  border: 1px solid var(--theme-border);
  border-left: 4px solid rgba(79, 195, 255, 0.9);
  border-radius: 8px;
}

.quest-objectives-title {
  font-size: 13px;
  font-weight: bold;
  color: var(--theme-accent, #ffd700);
  margin-bottom: 6px;
}

.quest-reward-title {
  font-size: 13px;
  font-weight: bold;
  color: var(--theme-accent, #ffd700);
  margin-bottom: 6px;
}

.quest-reward {
  color: var(--theme-text);
  font-size: 13px;
  margin-top: 5px;
  padding: 8px 10px;
  background: var(--theme-surface-muted);
  border: 1px solid var(--theme-border);
  border-radius: 8px;
}

.quest-reward > div:not(.quest-reward-item) {
  color: var(--theme-accent);
}

.quest-reward-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quest-reward-text {
  color: inherit;
}

.quest-reward-exp-tag {
  color: #00ff00;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.quest-reward-exp .quest-reward-text {
  color: var(--theme-text);
}

.quest-reward-gold-icon {
  width: 25px;
  height: 25px;
  border-radius: 4px;
  object-fit: contain;
}

.quest-requirement {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.quest-requirement-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  border-radius: 4px;
}

.quest-action-section {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
}

.quest-complete-section {
  margin-top: 10px;
  text-align: center;
}

.complete-quest-btn {
  padding: 8px 20px;
  background: var(--theme-button-bg);
  color: var(--theme-button-text);
  border: 2px solid var(--theme-border);
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  font-family: 'Georgia', serif;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.complete-quest-btn:hover {
  background: var(--theme-button-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-color: var(--theme-border-strong);
}

.remove-quest-btn {
  padding: 8px 20px;
  background: var(--theme-panel-bg, #8b3a3a);
  color: #ffcccc;
  border: 2px solid #6b2a2a;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  font-family: 'Georgia', serif;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.remove-quest-btn:hover {
  background: #6b2a2a;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-color: #4a1a1a;
}

.quest-remove-confirm {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--theme-surface, #2a2a2a);
  border: 2px solid var(--theme-border-strong, #8b4513);
  border-radius: 10px;
  padding: 15px 20px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  width: 80%;
}

.quest-remove-confirm-text {
  color: var(--theme-text, #fff);
  font-size: 14px;
  font-weight: bold;
  text-align: center;
}

.quest-remove-confirm-btns {
  display: flex;
  gap: 15px;
}

.quest-remove-confirm-yes {
  padding: 6px 18px;
  background: #8b3a3a;
  color: #fff;
  border: 2px solid #6b2a2a;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
}

.quest-remove-confirm-yes:hover {
  background: #a04a4a;
  border-color: #4a1a1a;
}

.quest-remove-confirm-no {
  padding: 6px 18px;
  background: var(--theme-button-bg, #4a4a4a);
  color: var(--theme-text, #fff);
  border: 2px solid var(--theme-border, #6a6a6a);
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
}

.quest-remove-confirm-no:hover {
  background: var(--theme-button-hover, #5a5a5a);
}

.quest-reward-item {
  display: flex;
  align-items: center;
  margin-top: 5px;
}

.quest-master-grade-info {
  margin-top: 8px;
  padding: 6px 10px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
}

.master-grade-target {
  font-size: 13px;
  font-weight: bold;
  color: #ffd700;
}

.master-grade-current {
  font-size: 12px;
  color: var(--theme-text);
  font-weight: normal;
}

/* 大师进阶惩罚提示 */
.master-grade-penalty {
  margin-top: 6px;
  display: flex;
  gap: 10px;
}

.penalty-tag {
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 4px;
}

.penalty-exp {
  color: #ff6464;
  background: rgba(255, 100, 100, 0.15);
  border: 1px solid rgba(255, 100, 100, 0.3);
}

.penalty-drop {
  color: #ff9c4a;
  background: rgba(255, 156, 74, 0.15);
  border: 1px solid rgba(255, 156, 74, 0.3);
}

.no-quests {
  color: var(--theme-text);
  font-style: italic;
  text-align: center;
  padding: 20px;
  font-family: 'Georgia', serif;
}

#questCloseButton {
  background: var(--theme-button-bg);
  border: 2px solid var(--theme-border);
  color: var(--theme-text);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  transition: all 0.3s ease;
}

#questCloseButton:hover {
  background: var(--theme-button-hover);
  border-color: var(--theme-border-strong);
  transform: rotate(90deg);
}

/* ===== 右下角拉伸手柄及动画 ===== */
.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 22px;
  height: 22px;
  cursor: nwse-resize;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 4px;
  gap: 3px;
}

.resize-handle-arrow {
  display: block;
  height: 2px;
  background: var(--theme-border-strong, #8b4513);
  border-radius: 1px;
  transform: rotate(-45deg);
  transform-origin: right center;
  opacity: 0.5;
  animation: resize-flow 1.8s ease-in-out infinite;
}

.resize-handle-arrow:nth-child(1) {
  width: 6px;
  animation-delay: 0s;
}

.resize-handle-arrow:nth-child(2) {
  width: 8px;
  animation-delay: 0.25s;
}

.resize-handle-arrow:nth-child(3) {
  width: 10px;
  animation-delay: 0.5s;
}

/* 拉伸指示流动动画 - 三条斜线依次点亮，持续提示可拉伸 */
@keyframes resize-flow {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 1;
  }
}

.resize-handle:hover .resize-handle-arrow,
.resize-handle--active .resize-handle-arrow {
  opacity: 1;
  animation-play-state: paused;
}
</style>
