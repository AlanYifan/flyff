/**
 * @fileoverview DPS排行榜组件 - 显示玩家和队伍成员的DPS排名
 * @description 在副本战斗中实时显示每个成员的伤害输出排名，包含总伤害、每秒伤害和伤害占比
 */
<template>
  <div
    v-if="visible"
    class="dps-ranking-panel"
    :style="panelStyle"
    ref="panelRef"
  >
    <!-- 可拖拽头部 -->
    <div class="dps-header" @mousedown="startDrag">
      <span class="dps-title">DPS排行榜</span>
      <span class="dps-count">({{ activeCount }}/{{ totalCount }})</span>
    </div>

    <!-- 排行榜内容 -->
    <div class="dps-content" :style="contentStyle">
      <div
        v-for="(entry, index) in sortedDpsList"
        :key="entry.id"
        class="dps-row"
        :class="{ 'is-player': entry.isPlayer }"
      >
        <!-- 背景进度条（宽度=伤害占比百分比） -->
        <div
          class="dps-row-bg"
          :style="getBackgroundStyle(entry, index)"
        ></div>
        <!-- 内容层 -->
        <div class="dps-row-content">
          <span class="dps-rank" :style="{ color: getRankColor(index) }">{{ index + 1 }}</span>
          <span class="dps-name">{{ entry.name }}</span>
          <span class="dps-total" :title="'总伤害: ' + formatFullNumber(entry.totalDamage)">{{ formatDps(entry.totalDamage) }}</span>
          <span class="dps-per-sec" :title="'每秒伤害: ' + formatFullNumber(entry.dps)">{{ formatDps(entry.dps) }}/s</span>
          <span class="dps-percent">({{ getDamagePercent(entry) }}%)</span>
        </div>
      </div>
      <div v-if="sortedDpsList.length === 0" class="dps-empty">
        暂无数据
      </div>
    </div>

    <!-- 缩放手柄 -->
    <div class="resize-handle resize-right" @mousedown="startResize('right', $event)"></div>
    <div class="resize-handle resize-bottom" @mousedown="startResize('bottom', $event)"></div>
    <div class="resize-handle resize-corner" @mousedown="startResize('corner', $event)"></div>
  </div>
</template>

<script setup>
/**
 * DPS排行榜组件
 * @module DpsRanking
 */
import { ref, computed, onUnmounted } from 'vue'

// ============ Props ============
const props = defineProps({
  /** 是否显示面板 */
  visible: {
    type: Boolean,
    default: false
  },
  /** DPS数据列表 */
  dpsData: {
    type: Array,
    default: () => []
  },
  /** 总成员数量 */
  totalMembers: {
    type: Number,
    default: 10
  }
})

// ============ 状态 ============
/** 面板位置 */
const position = ref({ x: 100, y: 100 })
/** 面板尺寸 */
const size = ref({ width: 320, height: 200 })
/** 最小尺寸 */
const minSize = { width: 280, height: 120 }
/** 最大尺寸 */
const maxSize = { width: 600, height: 600 }
/** 面板引用 */
const panelRef = ref(null)
/** 是否正在拖拽 */
const isDragging = ref(false)
/** 是否正在缩放 */
const isResizing = ref(false)
/** 缩放方向 */
const resizeDirection = ref('')
/** 拖拽/缩放起始位置 */
const startPos = ref({ x: 0, y: 0 })
/** 拖拽/缩放起始尺寸/位置 */
const startSize = ref({ width: 0, height: 0 })
const startPosPanel = ref({ x: 0, y: 0 })

/** 排行榜颜色配置（按排名） */
const rankColors = [
  { bg: 'rgba(255, 215, 0, 0.35)', border: '#ffd700', text: '#ffd700' },   // 第1名 - 金色
  { bg: 'rgba(192, 192, 192, 0.3)', border: '#c0c0c0', text: '#c0c0c0' }, // 第2名 - 银色
  { bg: 'rgba(205, 127, 50, 0.3)', border: '#cd7f32', text: '#cd7f32' },   // 第3名 - 铜色
  { bg: 'rgba(100, 149, 237, 0.25)', border: '#6495ed', text: '#6495ed' }, // 第4名 - 蓝色
  { bg: 'rgba(50, 205, 50, 0.25)', border: '#32cd32', text: '#32cd32' },    // 第5名 - 绿色
  { bg: 'rgba(255, 105, 180, 0.25)', border: '#ff69b4', text: '#ff69b4' }, // 第6名 - 粉色
  { bg: 'rgba(148, 0, 211, 0.25)', border: '#9400d3', text: '#9400d3' },    // 第7名 - 紫色
  { bg: 'rgba(255, 140, 0, 0.25)', border: '#ff8c00', text: '#ff8c00' },    // 第8名 - 橙色
  { bg: 'rgba(0, 206, 209, 0.25)', border: '#00ced1', text: '#00ced1' },    // 第9名 - 青色
  { bg: 'rgba(169, 169, 169, 0.2)', border: '#a9a9a9', text: '#a9a9a9' } // 第10名及以后 - 灰色
]

// ============ 计算属性 ============
/** 面板样式 */
const panelStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  width: `${size.value.width}px`,
  height: `${size.value.height}px`
}))

/** 内容区域样式（等比例缩放字体） */
const contentStyle = computed(() => {
  const scale = Math.min(size.value.width / 320, size.value.height / 200)
  const fontSize = Math.max(10, Math.min(14, 12 * scale))
  return {
    fontSize: `${fontSize}px`
  }
})

/** 排序后的DPS列表（按总伤害排序） */
const sortedDpsList = computed(() => {
  if (!props.dpsData || props.dpsData.length === 0) return []
  return [...props.dpsData].sort((a, b) => (b.totalDamage || 0) - (a.totalDamage || 0))
})

/** 总伤害 */
const totalDamage = computed(() => {
  return sortedDpsList.value.reduce((sum, entry) => sum + (entry.totalDamage || 0), 0)
})

/** 有伤害的成员数量 */
const activeCount = computed(() => {
  return sortedDpsList.value.filter(e => (e.totalDamage || 0) > 0).length
})

/** 总成员数量 */
const totalCount = computed(() => props.totalMembers || sortedDpsList.value.length || 10)

// ============ 方法 ============
/**
 * 获取伤害占比百分比数值
 * @param {Object} entry - 成员数据
 * @returns {number} 百分比数值
 */
const getDamagePercentValue = (entry) => {
  if (totalDamage.value === 0) return 0
  return ((entry.totalDamage || 0) / totalDamage.value * 100)
}

/**
 * 获取伤害占比百分比字符串
 * @param {Object} entry - 成员数据
 * @returns {string} 百分比字符串
 */
const getDamagePercent = (entry) => {
  const percent = getDamagePercentValue(entry)
  if (percent >= 99.9) return '100'
  if (percent < 0.1 && entry.totalDamage > 0) return '0.1'
  return percent.toFixed(1)
}

/**
 * 获取排名颜色
 * @param {number} index - 排名索引
 * @returns {string} 颜色值
 */
const getRankColor = (index) => {
  const colorConfig = rankColors[Math.min(index, rankColors.length - 1)]
  return colorConfig.text
}

/**
 * 获取背景样式（宽度=伤害占比百分比）
 * @param {Object} entry - 成员数据
 * @param {number} index - 排名索引
 * @returns {Object} 样式对象
 */
const getBackgroundStyle = (entry, index) => {
  const percent = getDamagePercentValue(entry)
  const colorConfig = rankColors[Math.min(index, rankColors.length - 1)]
  
  // 玩家有特殊高亮效果
  if (entry.isPlayer) {
    return {
      width: `${Math.max(percent, 5)}%`,
      background: `linear-gradient(90deg, ${colorConfig.bg} 0%, rgba(255, 215, 0, 0.2) 100%)`,
      borderLeft: `3px solid ${colorConfig.border}`
    }
  }
  
  return {
    width: `${Math.max(percent, 5)}%`,
    background: colorConfig.bg,
    borderLeft: `3px solid ${colorConfig.border}`
  }
}

/**
 * 格式化伤害数值（简写形式）
 * @param {number} value - 伤害数值
 * @returns {string} 格式化后的字符串
 */
const formatDps = (value) => {
  if (!value || value === 0) return '0'
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + 'B'
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  }
  return Math.floor(value).toString()
}

/**
 * 格式化完整数字（带千分位）
 * @param {number} value - 数值
 * @returns {string} 格式化后的字符串
 */
const formatFullNumber = (value) => {
  if (!value || value === 0) return '0'
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 开始拖拽
 * @param {MouseEvent} event - 鼠标事件
 */
const startDrag = (event) => {
  if (event.button !== 0) return
  isDragging.value = true
  startPos.value = { x: event.clientX, y: event.clientY }
  startPosPanel.value = { ...position.value }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  event.preventDefault()
}

/**
 * 拖拽中
 * @param {MouseEvent} event - 鼠标事件
 */
const onDrag = (event) => {
  if (!isDragging.value) return
  const deltaX = event.clientX - startPos.value.x
  const deltaY = event.clientY - startPos.value.y
  position.value = {
    x: Math.max(0, startPosPanel.value.x + deltaX),
    y: Math.max(0, startPosPanel.value.y + deltaY)
  }
}

/**
 * 停止拖拽
 */
const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

/**
 * 开始缩放
 * @param {string} direction - 缩放方向
 * @param {MouseEvent} event - 鼠标事件
 */
const startResize = (direction, event) => {
  if (event.button !== 0) return
  isResizing.value = true
  resizeDirection.value = direction
  startPos.value = { x: event.clientX, y: event.clientY }
  startSize.value = { ...size.value }
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  event.preventDefault()
  event.stopPropagation()
}

/**
 * 缩放中
 * @param {MouseEvent} event - 鼠标事件
 */
const onResize = (event) => {
  if (!isResizing.value) return
  const deltaX = event.clientX - startPos.value.x
  const deltaY = event.clientY - startPos.value.y

  let newWidth = startSize.value.width
  let newHeight = startSize.value.height

  if (resizeDirection.value === 'right' || resizeDirection.value === 'corner') {
    newWidth = Math.min(maxSize.width, Math.max(minSize.width, startSize.value.width + deltaX))
  }
  if (resizeDirection.value === 'bottom' || resizeDirection.value === 'corner') {
    newHeight = Math.min(maxSize.height, Math.max(minSize.height, startSize.value.height + deltaY))
  }

  size.value = { width: newWidth, height: newHeight }
}

/**
 * 停止缩放
 */
const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

// ============ 生命周期 ============
onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.dps-ranking-panel {
  position: fixed;
  background: rgba(0, 0, 0, 0.85);
  border: 2px solid rgba(255, 215, 0, 0.6);
  border-radius: 8px;
  z-index: 1500;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  user-select: none;
}

.dps-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  background: linear-gradient(180deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0.1) 100%);
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  cursor: move;
  border-radius: 6px 6px 0 0;
}

.dps-title {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.dps-count {
  font-size: 12px;
  color: #aaa;
  margin-left: 6px;
}

.dps-content {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dps-row {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: all 0.2s;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
}

.dps-row:hover {
  filter: brightness(1.2);
}

.dps-row-bg {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 4px 0 0 4px;
  transition: width 0.3s ease;
}

.dps-row-content {
  position: relative;
  display: flex;
  align-items: center;
  padding: 8px 10px;
  width: 100%;
  z-index: 1;
}

.dps-rank {
  width: 20px;
  font-weight: bold;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.dps-name {
  flex: 1;
  min-width: 50px;
  margin-left: 8px;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.dps-total {
  min-width: 50px;
  color: #ffd700;
  font-weight: bold;
  text-align: right;
  margin-left: 8px;
}

.dps-per-sec {
  min-width: 55px;
  color: #ff6b6b;
  font-weight: bold;
  text-align: right;
  margin-left: 8px;
}

.dps-percent {
  min-width: 45px;
  color: #88ff88;
  text-align: right;
  margin-left: 6px;
  font-size: 0.95em;
}

.dps-empty {
  text-align: center;
  color: #666;
  padding: 20px;
}

/* 缩放手柄 */
.resize-handle {
  position: absolute;
  background: transparent;
}

.resize-right {
  right: 0;
  top: 10%;
  width: 6px;
  height: 80%;
  cursor: ew-resize;
}

.resize-bottom {
  bottom: 0;
  left: 10%;
  width: 80%;
  height: 6px;
  cursor: ns-resize;
}

.resize-corner {
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
}

.resize-corner::after {
  content: '';
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 8px;
  height: 8px;
  border-right: 2px solid rgba(255, 215, 0, 0.5);
  border-bottom: 2px solid rgba(255, 215, 0, 0.5);
}

/* 滚动条样式 */
.dps-content::-webkit-scrollbar {
  width: 4px;
}

.dps-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.dps-content::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.3);
  border-radius: 2px;
}

.dps-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.5);
}
</style>
