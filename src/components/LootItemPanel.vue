<!--
  @file LootItemPanel.vue
  @description 掉落物品分配面板组件
  @features
    - 每个角色显示独立的物品选择面板（横向排列）
    - 每个角色必须选择"需求"或"放弃"
    - 所有角色选择完毕后自动ROLL点分配
  @generated 2026-04-02
-->
<template>
  <Teleport to="body">
    <Transition name="loot-panel-fade" appear>
      <div v-if="visible" class="loot-item-panel-overlay">
        <div 
          class="loot-item-panel"
          :style="panelStyle"
        >
          <!-- 头部（可拖拽） -->
          <div class="panel-header" @mousedown="startDrag">
            <h3>🎁 掉落物品分配</h3>
            <div class="header-right">
              <!-- 倒计时显示 -->
              <div 
                v-if="!showResult && countdown > 0" 
                class="countdown-timer"
                :class="{ 'countdown-urgent': countdown <= 10 }"
              >
                ⏱ {{ countdown }}s
              </div>
              <div class="progress-info">
                {{ currentIndex + 1 }} / {{ totalItems }}
              </div>
            </div>
          </div>

          <!-- 物品信息 -->
          <div class="item-section">
            <div 
              class="item-display"
              @mouseenter="showItemTooltip($event, props.item)"
              @mousemove="moveItemTooltip($event)"
              @mouseleave="hideItemTooltip"
            >
              <img
                :src="itemIcon"
                :alt="itemName"
                class="item-icon"
                @error="handleIconError"
              />
              <div class="item-info">
                <span class="item-name" :style="{ color: itemColor }">{{ itemName }}</span>
                <span class="item-quantity">x{{ itemQuantity }}</span>
              </div>
            </div>
          </div>

          <!-- 角色选择面板列表（横向排列） -->
          <div class="characters-panel-list">
            <!-- 队长（玩家）面板 -->
            <div class="character-panel" :class="{ decided: decisions.player !== null }">
              <div class="character-header">
                <img
                  :src="playerAvatar"
                  :alt="playerName"
                  class="character-avatar"
                  @error="handleAvatarError($event, 'player')"
                />
                <div class="character-info">
                  <span class="character-name">{{ playerName }}</span>
                  <span class="character-role">队长</span>
                </div>
              </div>
              
              <!-- 物品预览 -->
              <div class="item-preview">
                <img :src="itemIcon" :alt="itemName" class="preview-icon" @error="handleIconError" />
                <div class="preview-info">
                  <span class="preview-name" :style="{ color: itemColor }">{{ itemName }}</span>
                  <span class="preview-quantity">x{{ itemQuantity }}</span>
                </div>
              </div>
              
              <!-- ROLL点结果或状态 -->
              <div v-if="decisions.player === 'need'" class="roll-result" :class="{ winner: winner === 'player' }">
                🎲 {{ playerRollResult }}
              </div>
              <div v-else-if="decisions.player === 'pass'" class="pass-label">
                已放弃
              </div>
              
              <!-- 操作按钮 -->
              <div class="action-buttons">
                <button
                  v-if="decisions.player === null"
                  class="btn need-btn"
                  @click="handleNeed('player')"
                >
                  需求
                </button>
                <button
                  v-if="decisions.player === null"
                  class="btn pass-btn"
                  @click="handlePass('player')"
                >
                  放弃
                </button>
              </div>
            </div>

            <!-- 队伍成员面板 -->
            <div
              v-for="member in teamMembers"
              :key="member.slotId"
              class="character-panel"
              :class="{ decided: decisions[member.slotId] !== null }"
            >
              <div class="character-header">
                <img
                  :src="getMemberAvatar(member)"
                  :alt="member.nickname"
                  class="character-avatar"
                  @error="handleAvatarError($event, member.slotId)"
                />
                <div class="character-info">
                  <span class="character-name">{{ member.nickname }}</span>
                  <span class="character-role">队员</span>
                </div>
              </div>
              
              <!-- 物品预览 -->
              <div class="item-preview">
                <img :src="itemIcon" :alt="itemName" class="preview-icon" @error="handleIconError" />
                <div class="preview-info">
                  <span class="preview-name" :style="{ color: itemColor }">{{ itemName }}</span>
                  <span class="preview-quantity">x{{ itemQuantity }}</span>
                </div>
              </div>
              
              <!-- ROLL点结果或状态 -->
              <div v-if="decisions[member.slotId] === 'need'" class="roll-result" :class="{ winner: winner === member.slotId }">
                🎲 {{ memberRollResults[member.slotId] }}
              </div>
              <div v-else-if="decisions[member.slotId] === 'pass'" class="pass-label">
                已放弃
              </div>
              
              <!-- 操作按钮 -->
              <div class="action-buttons">
                <button
                  v-if="decisions[member.slotId] === null"
                  class="btn need-btn"
                  @click="handleNeed(member.slotId)"
                >
                  需求
                </button>
                <button
                  v-if="decisions[member.slotId] === null"
                  class="btn pass-btn"
                  @click="handlePass(member.slotId)"
                >
                  放弃
                </button>
              </div>
            </div>
          </div>

          <!-- 结果显示 -->
          <div v-if="showResult" class="result-section">
            <div class="winner-announcement">
              🎉 {{ getWinnerName() }} 获得了 {{ itemName }} x{{ itemQuantity }}!
            </div>
          </div>
          
          <!-- 提示信息 -->
          <div v-if="!showResult" class="hint-section">
            所有角色选择完毕后自动ROLL点 · {{ countdown > 0 ? `${countdown}秒后自动投掷` : '正在投掷...' }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, reactive, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/store'
import { useItemsStore } from '@/store/items'
import { classIconMap, getClassIconPath } from '@/utils/itemHelpers'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: null
  },
  members: {
    type: Array,
    default: () => []
  },
  currentIndex: {
    type: Number,
    default: 0
  },
  totalItems: {
    type: Number,
    default: 1
  }
})

// Emits
const emit = defineEmits(['close', 'confirm', 'pass'])

// Stores
const gameStore = useGameStore()
const itemsStore = useItemsStore()

// 状态
const decisions = reactive({}) // { characterId: 'need' | 'pass' }
const playerRollResult = ref(null)
const memberRollResults = reactive({}) // { slotId: rollResult }
const winner = ref(null)
const showResult = ref(false)

// 倒计时相关
/** 倒计时秒数 */
const COUNTDOWN_SECONDS = 30
/** 当前剩余秒数 */
const countdown = ref(0)
/** 倒计时定时器引用 */
let countdownTimer = null

// 拖拽相关
/** 面板位置（拖拽时使用像素定位） */
const panelPosition = ref({ x: 0, y: 0 })
/** 是否正在拖拽 */
const isDragging = ref(false)
/** 拖拽偏移量 */
const dragOffset = ref({ x: 0, y: 0 })
/** 是否已拖拽过（首次拖拽后从 CSS 居中切换为像素定位） */
const hasDragged = ref(false)

/**
 * 面板动态样式
 * 用途/业务意图：未拖拽时使用 CSS transform 居中，拖拽后切换为像素定位
 * @returns {Object} CSS 样式对象
 */
const panelStyle = computed(() => {
  if (hasDragged.value) {
    return {
      left: panelPosition.value.x + 'px',
      top: panelPosition.value.y + 'px',
      transform: 'none'
    }
  }
  // 默认：CSS 居中
  return {
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)'
  }
})

// 物品信息
const itemIcon = computed(() => {
  if (!props.item) return '/pt/item_icon/default_item.png'
  return `/pt/item_icon/${props.item.id}.png`
})

const itemName = computed(() => {
  if (!props.item) return '未知物品'
  return props.item.name || `物品#${props.item.id}`
})

const itemQuantity = computed(() => {
  if (!props.item) return 1
  return props.item.currentStack || props.item.quantity || 1
})

const itemColor = computed(() => {
  if (!props.item) return '#C0C0C0'
  const rarity = props.item.rarity || 'common'
  return itemsStore.getRarityTextColor(rarity) || '#C0C0C0'
})

// 玩家信息
const playerAvatar = computed(() => {
  const player = gameStore.player

  if (!player) return '/pt/Icon_res/default_avatar.png'
  
  // 优先使用玩家存档中的头像
  if (player.avatar) {
    return player.avatar
  }
  
  // 使用职业图标（优先使用 class 字段，兼容 job 字段）
  const className = player.class || player.job
  if (className) {
    const gender = player.sex === 'female' ? 'female' : 'male'
    // 使用统一的 getClassIconPath 函数，正确处理三转职业图标命名（无_icon后缀）
    return getClassIconPath(className, gender)
  }

  return '/pt/Icon_res/default_avatar.png'
})

const playerName = computed(() => {
  const player = gameStore.player
  return player?.nickname || '玩家'
})

// 队伍成员
const teamMembers = computed(() => {
  return props.members || []
})

// 所有角色ID列表
const allCharacterIds = computed(() => {
  const ids = ['player']
  for (const member of teamMembers.value) {
    ids.push(member.slotId)
  }
  return ids
})

// 检查是否所有角色都已决定
const allDecided = computed(() => {
  return allCharacterIds.value.every(id => decisions[id] !== null)
})

// 获取成员头像
const getMemberAvatar = (member) => {
  if (!member) return '/pt/Icon_res/default_avatar.png'
  
  // 优先使用成员存档中的头像
  if (member.avatar) {
    return member.avatar
  }
  
  // 使用职业图标（优先使用 class 字段，兼容 job 字段）
  const className = member.class || member.job
  if (className) {
    const gender = member.sex === 'female' ? 'female' : 'male'
    // 使用统一的 getClassIconPath 函数，正确处理三转职业图标命名（无_icon后缀）
    return getClassIconPath(className, gender)
  }

  return '/pt/Icon_res/default_avatar.png'
}

// 选择需求
const handleNeed = (characterId) => {
  decisions[characterId] = 'need'
  // 生成ROLL点结果
  const roll = Math.floor(Math.random() * 100) + 1
  if (characterId === 'player') {
    playerRollResult.value = roll
  } else {
    memberRollResults[characterId] = roll
  }
  
  // 检查是否所有角色都已决定
  checkAllDecided()
}

// 选择放弃
const handlePass = (characterId) => {
  decisions[characterId] = 'pass'
  
  // 检查是否所有角色都已决定
  checkAllDecided()
}

/**
 * 启动倒计时
 * 用途/业务意图：为当前物品启动30秒倒计时，超时后自动为所有未操作的角色投掷骰子
 */
const startCountdown = () => {
  stopCountdown()
  countdown.value = COUNTDOWN_SECONDS
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      stopCountdown()
      autoRollUndecided()
    }
  }, 1000)
}

/**
 * 停止倒计时
 * 用途/业务意图：清除倒计时定时器并重置计数
 */
const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  countdown.value = 0
}

/**
 * 超时自动投掷骰子
 * 用途/业务意图：倒计时结束时，为所有未操作的角色自动选择需求并投掷骰子
 */
const autoRollUndecided = () => {
  // 为所有未决定的角色自动选择需求并ROLL点
  for (const id of allCharacterIds.value) {
    if (decisions[id] === null || decisions[id] === undefined) {
      decisions[id] = 'need'
      const roll = Math.floor(Math.random() * 100) + 1
      if (id === 'player') {
        playerRollResult.value = roll
      } else {
        memberRollResults[id] = roll
      }
    }
  }
  // 执行ROLL点分配
  checkAllDecided()
}

// 检查是否所有角色都已决定
const checkAllDecided = () => {
  if (allDecided.value) {
    // 执行ROLL点
    performRoll()
  }
}

// 执行ROLL点
const performRoll = () => {
  // 停止倒计时
  stopCountdown()
  
  let maxRoll = 0
  let currentWinner = null
  
  // 检查玩家的ROLL点
  if (decisions.player === 'need' && playerRollResult.value !== null) {
    if (playerRollResult.value > maxRoll) {
      maxRoll = playerRollResult.value
      currentWinner = 'player'
    }
  }
  
  // 检查队员的ROLL点
  for (const [slotId, decision] of Object.entries(decisions)) {
    if (decision === 'need' && slotId !== 'player') {
      const roll = memberRollResults[slotId]
      if (roll !== undefined && roll > maxRoll) {
        maxRoll = roll
        currentWinner = slotId
      }
    }
  }
  
  winner.value = currentWinner
  showResult.value = true
  
  // 1秒后自动关闭并确认分配
  setTimeout(() => {
    if (currentWinner === null) {
      emit('pass')
    } else {
      emit('confirm', {
        winner: currentWinner,
        item: props.item,
        quantity: itemQuantity.value
      })
    }
    // 注意：不调用resetPanelState()，由父组件关闭面板时触发watch重置状态
  }, 1000)
}

// 获取获胜者名称
const getWinnerName = () => {
  if (!winner.value) return '无人'
  
  if (winner.value === 'player') {
    return playerName.value
  }
  
  // 使用 String() 统一类型比较，避免数字 slotId 与字符串 key 不匹配
  const member = teamMembers.value.find(m => String(m.slotId) === String(winner.value))
  return member?.nickname || '未知'
}

/**
 * 重置面板状态
 * 用途/业务意图：清空所有角色的decisions、ROLL点结果、获胜者等状态，为新一轮分配做准备
 */
const resetPanelState = () => {
  // 先清空所有已有的decisions
  Object.keys(decisions).forEach(key => {
    delete decisions[key]
  })
  // 重新初始化所有角色的decision为null
  for (const id of allCharacterIds.value) {
    decisions[id] = null
  }
  // 重置其他状态
  playerRollResult.value = null
  Object.keys(memberRollResults).forEach(key => {
    delete memberRollResults[key]
  })
  winner.value = null
  showResult.value = false
}

// 监听visible变化重置状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 面板打开时，重置状态并启动倒计时
    resetPanelState()
    // 重置拖拽标记，使用 CSS 居中
    hasDragged.value = false
    startCountdown()
  } else {
    // 面板关闭时停止倒计时并隐藏物品详情提示
    stopCountdown()
    window.dispatchEvent(new CustomEvent('hide-item-tooltip'))
  }
}, { immediate: true })

// 监听item变化：面板已打开但物品切换时，重置状态并重启倒计时
watch(() => props.item, (newItem, oldItem) => {
  // 仅在面板可见且物品确实发生变化时重置
  if (props.visible && newItem && newItem !== oldItem) {
    resetPanelState()
    startCountdown()
  }
})

// 组件挂载时注册拖拽事件监听
onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

// 组件卸载时清理定时器和事件监听
onUnmounted(() => {
  stopCountdown()
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

// 图片加载错误处理
const handleIconError = (e) => {
  e.target.src = '/pt/item_icon/default_item.png'
}

const handleAvatarError = (e) => {
  e.target.src = '/pt/Icon_res/default_avatar.png'
}

/**
 * 开始拖拽面板
 * 用途/业务意图：鼠标按下在头部时记录偏移量，首次拖拽从 CSS 居中切换为像素定位
 * @param {MouseEvent} event - 鼠标按下事件
 */
const startDrag = (event) => {
  // 阻止默认行为（文本选择、原生拖拽），确保自定义拖拽正常工作
  event.preventDefault()
  isDragging.value = true

  const panelEl = event.currentTarget.closest('.loot-item-panel')
  if (!panelEl) return
  const rect = panelEl.getBoundingClientRect()

  // 首次拖拽：从 CSS 居中切换为像素定位，记录当前位置
  if (!hasDragged.value) {
    panelPosition.value = { x: rect.left, y: rect.top }
    hasDragged.value = true
  }

  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

/**
 * 处理鼠标移动（拖拽中）
 * 用途/业务意图：拖拽时更新面板位置，限制在视口范围内
 * @param {MouseEvent} event - 鼠标移动事件
 */
const handleMouseMove = (event) => {
  if (!isDragging.value) return
  const nextX = event.clientX - dragOffset.value.x
  const nextY = event.clientY - dragOffset.value.y
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
  // 限制面板至少有部分在视口内
  const maxX = Math.max(0, viewportWidth - 100)
  const maxY = Math.max(0, viewportHeight - 50)
  panelPosition.value = {
    x: Math.min(Math.max(0, nextX), maxX),
    y: Math.min(Math.max(0, nextY), maxY)
  }
}

/**
 * 处理鼠标松开
 * 用途/业务意图：结束拖拽状态
 */
const handleMouseUp = () => {
  isDragging.value = false
}

/**
 * 显示物品详情提示框
 * @param {MouseEvent} event - 鼠标事件
 * @param {Object} item - 物品数据
 */
const showItemTooltip = (event, item) => {
  if (!item) return
  window.dispatchEvent(
    new CustomEvent('show-item-tooltip', {
      detail: {
        item,
        position: { x: event.clientX, y: event.clientY }
      }
    })
  )
}

/**
 * 移动物品详情提示框
 * @param {MouseEvent} event - 鼠标事件
 */
const moveItemTooltip = (event) => {
  window.dispatchEvent(
    new CustomEvent('move-item-tooltip', {
      detail: {
        position: { x: event.clientX, y: event.clientY }
      }
    })
  )
}

/**
 * 隐藏物品详情提示框
 */
const hideItemTooltip = () => {
  window.dispatchEvent(new CustomEvent('hide-item-tooltip'))
}
</script>

<style scoped>
.loot-item-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10002;
}

.loot-item-panel {
  position: fixed;
  background: linear-gradient(145deg, rgba(30, 30, 45, 0.98), rgba(20, 20, 35, 0.98));
  border: 1px solid rgba(100, 100, 150, 0.5);
  border-radius: 16px;
  padding: 20px;
  min-width: 600px;
  max-width: 900px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  animation: panel-appear 0.3s ease;
  pointer-events: auto;
}

@keyframes panel-appear {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(100, 100, 150, 0.3);
  cursor: move;
  user-select: none;
  -webkit-user-drag: none;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #fff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.countdown-timer {
  font-size: 14px;
  font-weight: bold;
  color: #FFD700;
  background: rgba(255, 215, 0, 0.15);
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  transition: all 0.3s;
}

.countdown-timer.countdown-urgent {
  color: #FF4444;
  background: rgba(255, 68, 68, 0.2);
  border-color: rgba(255, 68, 68, 0.5);
  animation: countdown-pulse 0.5s ease infinite alternate;
}

@keyframes countdown-pulse {
  from { transform: scale(1); }
  to { transform: scale(1.15); }
}

.progress-info {
  font-size: 13px;
  color: #aaa;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
}

.item-section {
  margin-bottom: 16px;
}

.item-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(100, 100, 150, 0.2);
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.3);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 15px;
  font-weight: bold;
}

.item-quantity {
  font-size: 13px;
  color: #aaa;
}

/* 角色面板列表（横向排列） */
.characters-panel-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  justify-content: center;
}

.character-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  min-width: 140px;
  max-width: 160px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(100, 100, 150, 0.3);
  border-radius: 12px;
  transition: all 0.2s;
}

.character-panel.decided {
  opacity: 0.7;
  border-color: rgba(100, 100, 150, 0.2);
}

.character-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  width: 100%;
}

.character-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(100, 100, 150, 0.5);
}

.character-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.character-name {
  font-size: 13px;
  font-weight: bold;
  color: #fff;
  text-align: center;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.character-role {
  font-size: 11px;
  color: #888;
}

/* 物品预览 */
.item-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  margin-bottom: 8px;
  width: 100%;
  justify-content: center;
}

.preview-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.2);
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.preview-name {
  font-size: 11px;
  font-weight: bold;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-quantity {
  font-size: 10px;
  color: #aaa;
}

/* ROLL点结果 */
.roll-result {
  background: rgba(255, 215, 0, 0.9);
  color: #000;
  font-size: 14px;
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 8px;
}

.roll-result.winner {
  background: rgba(0, 255, 100, 0.9);
  animation: winner-pulse 0.5s ease infinite alternate;
}

@keyframes winner-pulse {
  from { transform: scale(1); }
  to { transform: scale(1.1); }
}

.pass-label {
  font-size: 12px;
  color: #888;
  background: rgba(100, 100, 100, 0.3);
  padding: 4px 10px;
  border-radius: 10px;
  margin-bottom: 8px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.btn {
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.need-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #fff;
}

.need-btn:hover {
  background: linear-gradient(135deg, #5CBF60, #55b059);
  transform: translateY(-1px);
}

.pass-btn {
  background: linear-gradient(135deg, #666, #555);
  color: #fff;
}

.pass-btn:hover {
  background: linear-gradient(135deg, #777, #666);
  transform: translateY(-1px);
}

/* 结果显示 */
.result-section {
  text-align: center;
  padding: 16px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.winner-announcement {
  font-size: 16px;
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 12px;
}

.confirm-btn {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: #fff;
  min-width: 150px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #32a6f3, #2986e2);
  transform: translateY(-1px);
}

/* 提示信息 */
.hint-section {
  text-align: center;
  font-size: 12px;
  color: #888;
  padding: 8px;
}

/* 过渡动画 */
.loot-panel-fade-enter-active,
.loot-panel-fade-leave-active {
  transition: opacity 0.3s ease;
}

.loot-panel-fade-enter-from,
.loot-panel-fade-leave-to {
  opacity: 0;
}

/* 响应式布局 */
@media (max-width: 700px) {
  .loot-item-panel {
    min-width: 320px;
    max-width: 95vw;
    padding: 16px;
  }
  
  .characters-panel-list {
    flex-direction: column;
    align-items: center;
  }
  
  .character-panel {
    max-width: 200px;
  }
}
</style>
