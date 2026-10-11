<template>
  <div
    ref="battleLogRef"
    class="battle-log"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px',
      width: size.width + 'px',
      height: size.height + 'px',
      transform: `scale(${scale})`,
      transformOrigin: 'top left'
    }"
    @mousedown="startDrag"
  >
    <div class="battle-log-header" @mousedown="startDrag">
      <span>战斗日志</span>
      <div class="battle-log-controls">
        <button class="control-btn" title="缩小" @click.stop="zoomOut">-</button>
        <span class="scale-display">{{ Math.round(scale * 100) }}%</span>
        <button class="control-btn" title="放大" @click.stop="zoomIn">+</button>
        <button class="control-btn close-btn" title="最小化/展开" @click.stop="toggleMinimize">
          {{ isMinimized ? '▼' : '▲' }}
        </button>
      </div>
    </div>
    <div v-show="!isMinimized" ref="battleLogContentRef" class="battle-log-content">
      <div
        v-for="(log, index) in displayLogs"
        :key="log?.id ?? `${log?.timestamp ?? 't'}-${index}`"
        class="log-entry"
        :style="{ color: log.color }"
      >
        <span v-if="log.timestamp" class="log-timestamp">{{ formatTimestamp(log.timestamp) }}</span>{{ log.text }}
      </div>
      <div v-if="displayLogs.length === 0" class="log-empty">
        暂无日志
      </div>
    </div>
    
    <!-- 调整大小的手柄 -->
    <div v-show="!isMinimized" class="resize-handle resize-n" @mousedown.stop="startResize('n')"></div>
    <div v-show="!isMinimized" class="resize-handle resize-s" @mousedown.stop="startResize('s')"></div>
    <div v-show="!isMinimized" class="resize-handle resize-e" @mousedown.stop="startResize('e')"></div>
    <div v-show="!isMinimized" class="resize-handle resize-w" @mousedown.stop="startResize('w')"></div>
    <div v-show="!isMinimized" class="resize-handle resize-nw" @mousedown.stop="startResize('nw')"></div>
    <div v-show="!isMinimized" class="resize-handle resize-ne" @mousedown.stop="startResize('ne')"></div>
    <div v-show="!isMinimized" class="resize-handle resize-sw" @mousedown.stop="startResize('sw')"></div>
    <div v-show="!isMinimized" class="resize-handle resize-se" @mousedown.stop="startResize('se')"></div>
  </div>

  <!-- 动画消息容器 -->
  <div class="animation-messages-container">
    <div
      v-for="msg in animationMessages"
      :key="msg.id"
      class="animation-message"
      :class="msg.type"
      :style="{ 
        animationDelay: msg.delay + 'ms'
      }"
    >
      <span v-if="msg.prefixText" class="message-prefix">{{ msg.prefixText }}</span>
      <span v-if="msg.connectorText" class="message-connector">{{ msg.connectorText }}</span>
      <span class="message-text">{{ msg.secondaryText || msg.text }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

/**
 * 战斗日志组件
 * 用于显示游戏中的战斗日志、系统消息等
 * 支持拖动、缩放、最小化、调整大小功能
 */
const props = defineProps({
  /**
   * 日志列表
   * @type {Array<{text: string, color: string, timestamp: number}>}
   */
  logs: {
    type: Array,
    default: () => []
  },
  /**
   * 最大显示日志数量
   * @type {number}
   */
  maxLogs: {
    type: Number,
    default: 100
  }
})

/**
 * 组件事件定义
 */
const emit = defineEmits({
  /**
   * 清空日志事件
   */
  clearLogs: () => true
})

const battleLogRef = ref(null)
const battleLogContentRef = ref(null)
let pendingScrollRafId = 0

/**
 * 动画消息列表
 * @type {Array<{id: number, text: string, type: string, icon: string, secondaryIcon?: string, connectorText?: string, secondaryText?: string, prefixText?: string, delay: number}>}
 */
const animationMessages = ref([])

/**
 * 动画消息ID计数器
 */
let animationMessageId = 0

/**
 * 战斗日志初始化位置状态
 */
const position = ref({
  x: 8,
  y: 759
})

/**
 * 大小状态
 */
const size = ref({
  width: 300,
  height: 400
})

/**
 * 缩放状态
 */
const scale = ref(1)

/**
 * 最小化状态
 */
const isMinimized = ref(false)

/**
 * 拖动状态
 */
const isDragging = ref(false)
const dragOffset = ref({
  x: 0,
  y: 0
})

/**
 * 调整大小状态
 */
const isResizing = ref(false)
const resizeDirection = ref('')
const resizeStart = ref({
  x: 0,
  y: 0,
  width: 0,
  height: 0
})

/**
 * 最小/最大尺寸
 */
const MIN_WIDTH = 200
const MIN_HEIGHT = 150
const MAX_WIDTH = 800
const MAX_HEIGHT = 800

/**
 * 调整大小的阻尼系数
 * 值越小，调整速度越慢，越平滑
 */
const RESIZE_DAMPING = 0.3

/**
 * 格式化时间戳为 HH:MM:SS 格式
 * @param {number} timestamp - 毫秒级时间戳
 * @returns {string} 格式化后的时间字符串
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp || !Number.isFinite(timestamp)) return ''
  const date = new Date(timestamp)
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  const s = date.getSeconds().toString().padStart(2, '0')
  return `${h}:${m}:${s} `
}

/**
 * 计算显示的日志列表
 * 限制显示数量，最多显示 maxLogs 条
 */
const displayLogs = computed(() => {
  const logs = props.logs.slice(-props.maxLogs)
  return logs.reverse()
})

/**
 * 初始化位置
 */
onMounted(() => {
  if (battleLogRef.value) {
    const rect = battleLogRef.value.getBoundingClientRect()
    position.value = {
      x: rect.left,
      y: rect.top
    }
    size.value = {
      width: rect.width,
      height: rect.height
    }
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

/**
 * 监听日志变化，自动滚动到最新内容
 */
watch(
  () => props.logs.length,
  () => {
    if (isMinimized.value) {
      return
    }

    nextTick(() => {
      if (pendingScrollRafId) {
        cancelAnimationFrame(pendingScrollRafId)
        pendingScrollRafId = 0
      }
      pendingScrollRafId = requestAnimationFrame(() => {
        pendingScrollRafId = 0
        const target = battleLogContentRef.value
        if (!target) {
          return
        }
        target.scrollTop = 0
      })
    })
  },
  { flush: 'post' }
)

/**
 * 清理事件监听
 */
onUnmounted(() => {
  if (pendingScrollRafId) {
    cancelAnimationFrame(pendingScrollRafId)
    pendingScrollRafId = 0
  }
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

/**
 * 开始拖动
 */
const startDrag = (event) => {
  if (event.target.closest('.control-btn') || event.target.closest('.resize-handle')) {
    return
  }

  isDragging.value = true
  dragOffset.value = {
    x: event.clientX - position.value.x,
    y: event.clientY - position.value.y
  }
}

/**
 * 开始调整大小
 */
const startResize = (direction) => {
  isResizing.value = true
  resizeDirection.value = direction
  resizeStart.value = {
    x: event.clientX,
    y: event.clientY,
    width: size.value.width,
    height: size.value.height
  }
}

/**
 * 处理鼠标移动
 */
const handleMouseMove = (event) => {
  if (isDragging.value) {
    const nextX = event.clientX - dragOffset.value.x
    const nextY = event.clientY - dragOffset.value.y
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
    const scaledWidth = size.value.width * scale.value
    const scaledHeight = size.value.height * scale.value
    const maxX = Math.max(0, viewportWidth - scaledWidth)
    const maxY = Math.max(0, viewportHeight - scaledHeight)
    position.value = {
      x: Math.min(Math.max(0, nextX), maxX),
      y: Math.min(Math.max(0, nextY), maxY)
    }
  } else if (isResizing.value) {
    const deltaX = (event.clientX - resizeStart.value.x) * RESIZE_DAMPING
    const deltaY = (event.clientY - resizeStart.value.y) * RESIZE_DAMPING

    let newWidth = resizeStart.value.width
    let newHeight = resizeStart.value.height
    let newX = position.value.x
    let newY = position.value.y

    switch (resizeDirection.value) {
    case 'n':
      newHeight = resizeStart.value.height - deltaY
      newY = position.value.y + deltaY
      break
    case 's':
      newHeight = resizeStart.value.height + deltaY
      break
    case 'e':
      newWidth = resizeStart.value.width + deltaX
      break
    case 'w':
      newWidth = resizeStart.value.width - deltaX
      newX = position.value.x + deltaX
      break
    case 'nw':
      newWidth = resizeStart.value.width - deltaX
      newHeight = resizeStart.value.height - deltaY
      newX = position.value.x + deltaX
      newY = position.value.y + deltaY
      break
    case 'ne':
      newWidth = resizeStart.value.width + deltaX
      newHeight = resizeStart.value.height - deltaY
      newY = position.value.y + deltaY
      break
    case 'sw':
      newWidth = resizeStart.value.width - deltaX
      newHeight = resizeStart.value.height + deltaY
      newX = position.value.x + deltaX
      break
    case 'se':
      newWidth = resizeStart.value.width + deltaX
      newHeight = resizeStart.value.height + deltaY
      break
    default:
      break
    }

    const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth))
    const clampedHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight))
    size.value = {
      width: clampedWidth,
      height: clampedHeight
    }

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
    const scaledWidth = clampedWidth * scale.value
    const scaledHeight = clampedHeight * scale.value
    const maxX = Math.max(0, viewportWidth - scaledWidth)
    const maxY = Math.max(0, viewportHeight - scaledHeight)
    const nextPosition = {
      x: resizeDirection.value.includes('w') ? newX : position.value.x,
      y: resizeDirection.value.includes('n') ? newY : position.value.y
    }

    position.value = {
      x: Math.min(Math.max(0, nextPosition.x), maxX),
      y: Math.min(Math.max(0, nextPosition.y), maxY)
    }
  }
}

/**
 * 处理鼠标松开
 */
const handleMouseUp = () => {
  isDragging.value = false
  isResizing.value = false
}

/**
 * 放大
 */
const zoomIn = () => {
  scale.value = Math.min(2, scale.value + 0.1)
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
  const scaledWidth = size.value.width * scale.value
  const scaledHeight = size.value.height * scale.value
  const maxX = Math.max(0, viewportWidth - scaledWidth)
  const maxY = Math.max(0, viewportHeight - scaledHeight)
  position.value = {
    x: Math.min(Math.max(0, position.value.x), maxX),
    y: Math.min(Math.max(0, position.value.y), maxY)
  }
}

/**
 * 缩小
 */
const zoomOut = () => {
  scale.value = Math.max(0.5, scale.value - 0.1)
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
  const scaledWidth = size.value.width * scale.value
  const scaledHeight = size.value.height * scale.value
  const maxX = Math.max(0, viewportWidth - scaledWidth)
  const maxY = Math.max(0, viewportHeight - scaledHeight)
  position.value = {
    x: Math.min(Math.max(0, position.value.x), maxX),
    y: Math.min(Math.max(0, position.value.y), maxY)
  }
}

/**
 * 切换最小化状态
 */
const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

/**
 * 添加日志到日志列表
 * @param {string} text - 日志文本
 * @param {string} type - 日志类型（normal, success, warning, error, quest, info, drop, buy, sell, use, equip, decompose）
 */
const addLog = (text, type = 'normal') => {
  let color = '#ffffff'
  switch (type) {
  case 'success':
    color = '#4CAF50'
    break
  case 'warning':
    color = '#FF9800'
    break
  case 'error':
    color = '#F44336'
    break
  case 'quest':
    color = 'rgb(104, 174, 255)'
    break
  case 'info':
    color = '#9E9E9E'
    break
  case 'drop':
    color = '#8B0000'
    break
  case 'buy':
    color = '#4CAF50'
    break
  case 'sell':
    color = 'rgb(222, 255, 4)'
    break
  case 'use':
  case 'equip':
    color = '#008000'
    break
  case 'decompose':
    color = '#ff9800'
    break
  default:
    break
  }

  return {
    text,
    color,
    timestamp: Date.now()
  }
}

/**
 * 显示动画消息
 * @param {string} text - 消息文本
 * @param {string} type - 消息类型（buy, sell, equip, use, drop）
 * @param {string} icon - 物品图标路径
 * @param {string} secondaryIcon - 第二个物品图标路径（用于“X 进化/合成 Y”类动画）
 * @param {string} connectorText - 两个图标之间的连接文字
 * @param {string} secondaryText - 第二图标后的消息文本（存在 secondaryIcon 时优先显示）
 * @param {string} prefixText - 第一图标前的前缀文本（例如“玩家 的”）
 */
const showAnimationMessage = (
  text,
  type = 'info',
  icon = '',
  secondaryIcon = '',
  connectorText = '',
  secondaryText = '',
  prefixText = ''
) => {
  const id = ++animationMessageId
  const delay = 0

  // 新消息插入到数组头部，使其显示在最顶部，旧消息依次向下排列
  animationMessages.value.unshift({
    id,
    text,
    type,
    icon,
    secondaryIcon,
    connectorText,
    secondaryText,
    prefixText,
    delay
  })

  // 限制动画消息数量上限，防止堆积导致内存泄漏
  // 最多同时显示10条动画消息，超出时移除数组末尾最旧的消息
  const MAX_ANIMATION_MESSAGES = 10
  if (animationMessages.value.length > MAX_ANIMATION_MESSAGES) {
    animationMessages.value.splice(MAX_ANIMATION_MESSAGES)
  }

  // 3秒后移除消息
  setTimeout(() => {
    const index = animationMessages.value.findIndex(msg => msg.id === id)
    if (index !== -1) {
      animationMessages.value.splice(index, 1)
    }
  }, 3000)
}

defineExpose({
  addLog,
  showAnimationMessage
})
</script>

<style scoped>
.battle-log {
  position: fixed;
  width: 300px;
  height: 400px;
  display: flex;
  flex-direction: column;
  background: var(--theme-battle-log-bg);
  border: 2px solid #8b7355;
  border-radius: 5px;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  cursor: move;
  transition: transform 0.1s ease-out;
  color: var(--theme-text);
}

.battle-log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
  color: var(--theme-accent);
  padding: 10px;
  border-bottom: 1px solid #8b7355;
  background: rgba(139, 115, 85, 0.3);
  cursor: move;
  user-select: none;
}

.battle-log-header span {
  flex: 1;
}

.battle-log-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  background: rgba(139, 115, 85, 0.5);
  border: 1px solid #8b7355;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: rgba(139, 115, 85, 0.8);
  border-color: #ffd700;
  transform: scale(1.1);
}

.control-btn:active {
  transform: scale(0.95);
}

.close-btn {
  min-width: 30px;
}

.scale-display {
  min-width: 50px;
  text-align: center;
  font-size: 12px;
  color: var(--theme-accent);
  font-weight: normal;
}

.battle-log-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  min-height: 0;
}

.battle-log-content::-webkit-scrollbar {
  width: 6px;
}

.battle-log-content::-webkit-scrollbar-track {
  background: #000000;
  border-radius: 3px;
}

.battle-log-content::-webkit-scrollbar-thumb {
  background: #8b7355;
  border-radius: 3px;
}

.battle-log-content::-webkit-scrollbar-thumb:hover {
  background: #a08060;
}

.log-entry {
  font-size: 12px;
  line-height: 1.4;
  padding: 3px 5px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.3);
  word-wrap: break-word;
  animation: fadeIn 0.3s ease-in;
}

.log-timestamp {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  margin-right: 2px;
  font-family: 'Consolas', 'Courier New', monospace;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.log-empty {
  font-size: 12px;
  color: var(--theme-text);
  text-align: center;
  padding: 20px;
  font-style: italic;
}

/* 调整大小的手柄 */
.resize-handle {
  position: absolute;
  background: transparent;
  z-index: 1001;
}

.resize-handle:hover {
  background: rgba(255, 215, 0, 0.3);
}

.resize-n {
  top: 0;
  left: 10px;
  right: 10px;
  height: 5px;
  cursor: n-resize;
}

.resize-s {
  bottom: 0;
  left: 10px;
  right: 10px;
  height: 5px;
  cursor: s-resize;
}

.resize-e {
  top: 10px;
  right: 0;
  bottom: 10px;
  width: 5px;
  cursor: e-resize;
}

.resize-w {
  top: 10px;
  left: 0;
  bottom: 10px;
  width: 5px;
  cursor: w-resize;
}

.resize-nw {
  top: 0;
  left: 0;
  width: 10px;
  height: 10px;
  cursor: nw-resize;
}

.resize-ne {
  top: 0;
  right: 0;
  width: 10px;
  height: 10px;
  cursor: ne-resize;
}

.resize-sw {
  bottom: 0;
  left: 0;
  width: 10px;
  height: 10px;
  cursor: sw-resize;
}

.resize-se {
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  cursor: se-resize;
}

/* 动画消息容器 - 浏览器水平居中，从顶部开始依次向下排列 */
.animation-messages-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 60px;
  gap: 8px;
}

/* 动画消息 */
.animation-message {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px 25px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  animation: messageAnimation 3s ease-in-out forwards;
  pointer-events: auto;
  white-space: nowrap;
}

.message-connector {
  font-weight: bold;
  opacity: 0.95;
}

.message-prefix {
  font-weight: bold;
  opacity: 0.95;
}

/* 消息文本 */
.message-text {
  flex: 1;
}

/* 不同类型的消息颜色 */
.animation-message.buy {
  color: #4CAF50;
}

.animation-message.sell {
  color: rgb(222, 255, 4);
}

.animation-message.equip {
  color: #008000;
}

.animation-message.use {
  color: #008000;
}

.animation-message.drop {
  color: #8B0000;
}

.animation-message.quest {
  color: rgb(104, 174, 255);
}

.animation-message.decompose {
  color: #ff9800;
}

.animation-message.error {
  color: #F44336;
}

/* 强化成功 - 金色发光效果 */
.animation-message.upgrade-success {
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.6);
  animation: upgradeSuccessAnimation 3s ease-out forwards, glowPulse 0.5s ease-in-out infinite;
}

/* 强化失败 - 红色闪烁效果 */
.animation-message.upgrade-fail {
  color: #ff4444;
  text-shadow: 0 0 10px rgba(255, 68, 68, 0.8), 0 0 20px rgba(255, 68, 68, 0.6);
  animation: upgradeFailAnimation 3s ease-out forwards, shake 0.3s ease-in-out;
}

/* 获得奖励 - 绿色发光效果 */
.animation-message.reward {
  color: #00ff88;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.8), 0 0 20px rgba(0, 255, 136, 0.6);
}

/* 强化成功动画 */
@keyframes upgradeSuccessAnimation {
  0% {
    opacity: 0;
    transform: scale(0.5) translateY(20px);
  }
  20% {
    opacity: 1;
    transform: scale(1.2) translateY(0);
  }
  40% {
    transform: scale(1) translateY(0);
  }
  80% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  100% {
    opacity: 0;
    transform: scale(1.1) translateY(-30px);
  }
}

/* 强化失败动画 */
@keyframes upgradeFailAnimation {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  20% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  80% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  100% {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
}

/* 发光脉冲效果 */
@keyframes glowPulse {
  0%, 100% {
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.6);
  }
  50% {
    text-shadow: 0 0 20px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 215, 0, 0.8);
  }
}

/* 抖动效果 */
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-5px);
  }
  40% {
    transform: translateX(5px);
  }
  60% {
    transform: translateX(-5px);
  }
  80% {
    transform: translateX(5px);
  }
}

/* 消息动画 - 从上方滑入，停留后向上淡出（使用 transform 避免影响 flex 布局） */
@keyframes messageAnimation {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }

  20% {
    opacity: 1;
    transform: translateY(0);
  }

  80% {
    opacity: 1;
    transform: translateY(0);
  }

  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}
</style>
