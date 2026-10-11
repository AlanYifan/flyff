<!--
  @file EagleInfoPanel.vue
  @generated 2026-07-17
  @description 神鹰召唤物详情面板 - 居中浏览器显示，无背景模态框，头部可拖拽
  展示神鹰的攻击、防御、生命、魔法值等详细属性
-->
<template>
  <Teleport to="body">
    <transition name="eagle-info-fade" appear>
      <div
        v-if="isVisible"
        ref="panelRef"
        class="eagle-info-panel"
        :style="panelStyle"
      >
        <!-- 头部（可拖拽） -->
        <div class="eagle-info-header" @mousedown="startDrag">
          <div class="header-left">
            <img
              src="/pt/skill_icon/shenyingjianglin.png"
              alt="神鹰"
              class="header-icon"
              draggable="false"
            />
            <span class="header-title">神鹰详情</span>
          </div>
          <button class="header-close" @click="$emit('close')">&times;</button>
        </div>

        <!-- 主体内容 -->
        <div class="eagle-info-body">
          <!-- 神鹰图标与名称 -->
          <div class="eagle-portrait">
            <img
              src="/pt/skill_icon/shenyingjianglin.png"
              alt="神鹰"
              class="portrait-image"
              draggable="false"
            />
            <div class="portrait-name">神鹰真身</div>
            <div v-if="skillLevel" class="portrait-level">Lv.{{ skillLevel }}</div>
          </div>

          <!-- 属性列表 -->
          <div class="stats-section">
            <div class="stats-section-title">基础属性</div>
            <div class="stats-grid">
              <div class="stat-row">
                <span class="stat-label">生命值</span>
                <span class="stat-value">{{ formatNumber(stats.maxHealth) }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">魔法值</span>
                <span class="stat-value">{{ formatNumber(stats.maxMana) }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">攻击力（最小）</span>
                <span class="stat-value stat-attack">{{ formatNumber(stats.minAttack) }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">攻击力（最大）</span>
                <span class="stat-value stat-attack">{{ formatNumber(stats.maxAttack) }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">防御力</span>
                <span class="stat-value">{{ formatNumber(stats.defense) }}</span>
              </div>
            </div>
          </div>

          <!-- 战斗属性 -->
          <div class="stats-section">
            <div class="stats-section-title">战斗属性</div>
            <div class="stats-grid">
              <div class="stat-row">
                <span class="stat-label">暴击率</span>
                <span class="stat-value">{{ formatPercent(stats.critRate) }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">暴击伤害</span>
                <span class="stat-value">{{ formatMultiplier(stats.critDamage) }}</span>
              </div>
            </div>
          </div>

          <!-- 剩余持续时间 -->
          <div v-if="remainingSeconds > 0" class="duration-bar">
            <span class="duration-label">剩余时间</span>
            <div class="duration-track">
              <div class="duration-fill" :style="{ width: durationPercent + '%' }"></div>
            </div>
            <span class="duration-time">{{ formatDuration(remainingSeconds) }}</span>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
/**
 * 神鹰召唤物详情面板
 * 居中浏览器显示，无背景模态框，头部可拖拽
 * 展示神鹰的攻击、防御、生命、魔法值等详细属性
 *
 * @file EagleInfoPanel.vue
 * @generated 2026-07-17
 */
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'

// 禁用属性自动继承：组件根节点为 Teleport（多根片段），Vue 无法自动继承非 props 属性
defineOptions({
  inheritAttrs: false
})

// ==================== Props ====================

const props = defineProps({
  /** 面板是否可见 */
  isVisible: {
    type: Boolean,
    default: false
  },
  /** 神鹰属性数据（来自 calculateSummonStats） */
  summonStats: {
    type: Object,
    default: null
  },
  /** 属性继承百分比 */
  statRatio: {
    type: Number,
    default: 0
  },
  /** 技能熟练度等级 */
  skillLevel: {
    type: Number,
    default: 0
  },
  /** 总持续时间（秒） */
  totalDuration: {
    type: Number,
    default: 0
  },
  /** 召唤开始时间戳（毫秒） */
  startTime: {
    type: Number,
    default: 0
  }
})

// ==================== Emits ====================

defineEmits(['close'])

// ==================== 拖拽逻辑 ====================

/** 面板DOM引用 */
const panelRef = ref(null)

/** 面板位置 */
const position = ref({ x: 0, y: 0 })

/** 定位模式：center 居中 / absolute 绝对定位 */
const positionMode = ref('center')

/** 是否正在拖拽 */
const isDragging = ref(false)

/** 拖拽偏移量 */
const dragOffset = ref({ x: 0, y: 0 })

/** 面板尺寸缓存 */
const panelSize = ref({ width: 0, height: 0 })

/** 是否已初始化位置 */
const hasInitializedPosition = ref(false)

/** 响应式时间戳，每秒更新用于倒计时 */
const currentTime = ref(Date.now())
let tickTimer = null

/**
 * 面板样式计算
 * center 模式居中浏览器，absolute 模式使用拖拽位置
 * @returns {Record<string, string>} CSS样式对象
 */
const panelStyle = computed(() => {
  if (positionMode.value === 'center') {
    return {
      left: '50%',
      top: '50%',
      translate: '-50% -50%'
    }
  }
  return {
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    translate: '0 0'
  }
})

/**
 * 将数值限制在范围内
 * @param {number} value - 输入值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的值
 */
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

/**
 * 刷新面板尺寸缓存
 */
const updatePanelSize = () => {
  const el = panelRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  panelSize.value = { width: rect.width, height: rect.height }
}

/**
 * 确保面板居中显示
 */
const ensureDefaultPosition = async () => {
  if (hasInitializedPosition.value) return
  await nextTick()
  positionMode.value = 'center'
  hasInitializedPosition.value = true
}

/**
 * 拖拽开始
 * @param {MouseEvent} event - 鼠标事件
 */
const startDrag = (event) => {
  if (!event || event.button !== 0) return
  if (event.target.closest('button')) return

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
}

/**
 * 拖拽移动
 * @param {MouseEvent} event - 鼠标事件
 */
const handleDragMove = (event) => {
  if (!isDragging.value) return
  const width = panelSize.value.width || 360
  const height = panelSize.value.height || 480
  const maxX = Math.max(0, window.innerWidth - width)
  const maxY = Math.max(0, window.innerHeight - height)
  position.value = {
    x: clamp(event.clientX - dragOffset.value.x, 0, maxX),
    y: clamp(event.clientY - dragOffset.value.y, 0, maxY)
  }
}

/**
 * 拖拽结束
 */
const stopDrag = () => {
  if (!isDragging.value) return
  isDragging.value = false
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', stopDrag)
}

// ==================== 数据格式化 ====================

/**
 * 安全获取属性数据，避免 null/undefined 导致报错
 */
const stats = computed(() => props.summonStats || {})

/**
 * 计算剩余持续时间（秒）
 */
const remainingSeconds = computed(() => {
  // eslint-disable-next-line no-unused-vars
  const _ = currentTime.value
  if (!props.startTime || !props.totalDuration) return 0
  const elapsed = Math.floor((Date.now() - props.startTime) / 1000)
  return Math.max(0, props.totalDuration - elapsed)
})

/**
 * 持续时间百分比
 */
const durationPercent = computed(() => {
  if (!props.totalDuration || props.totalDuration <= 0) return 0
  return Math.max(0, Math.min(100, (remainingSeconds.value / props.totalDuration) * 100))
})

/**
 * 格式化数值（每4位添加逗号）
 * @param {number} value - 数值
 * @returns {string} 格式化后的字符串
 */
const formatNumber = (value) => {
  const num = Number(value || 0)
  return num.toLocaleString('en-US')
}

/**
 * 格式化百分比
 * @param {number} value - 小数形式百分比（0.05 = 5%）
 * @returns {string} 格式化后的百分比字符串
 */
const formatPercent = (value) => {
  const num = Number(value || 0)
  return (num * 100).toFixed(1) + '%'
}

/**
 * 格式化暴击伤害倍率
 * @param {number} value - 倍率值（1.5 = 150%）
 * @returns {string} 格式化后的倍率字符串
 */
const formatMultiplier = (value) => {
  const num = Number(value || 1.0)
  return num.toFixed(2) + 'x'
}

/**
 * 格式化持续时间
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串
 */
const formatDuration = (seconds) => {
  const safe = Number(seconds)
  if (!Number.isFinite(safe) || safe <= 0) return '0:00'
  const total = Math.floor(safe)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ==================== 定时器管理 ====================

/**
 * 启动倒计时定时器
 */
const startTickTimer = () => {
  if (tickTimer) return
  tickTimer = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
}

/**
 * 停止倒计时定时器
 */
const stopTickTimer = () => {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

// ==================== 生命周期 ====================

watch(
  () => props.isVisible,
  (visible) => {
    if (visible) {
      hasInitializedPosition.value = false
      ensureDefaultPosition()
      startTickTimer()
    } else {
      stopDrag()
      stopTickTimer()
    }
  }
)

onBeforeUnmount(() => {
  stopDrag()
  stopTickTimer()
})
</script>

<style scoped>
/* ========================================
   面板根容器 - 居中浏览器，无背景模态框
   ======================================== */
.eagle-info-panel {
  position: fixed;
  width: 360px;
  background: linear-gradient(180deg, #2a1f14 0%, #1e1610 100%);
  border: 2px solid #8b6f47;
  border-radius: 12px;
  box-shadow:
    0 0 30px rgba(255, 200, 50, 0.15),
    0 8px 40px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  color: #f0e6d3;
  z-index: 10001;
  box-sizing: border-box;
  overflow: hidden;
}

/* 过渡动画 */
.eagle-info-fade-enter-active,
.eagle-info-fade-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.eagle-info-fade-enter-from,
.eagle-info-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.96);
}

/* ========================================
   头部 - 可拖拽
   ======================================== */
.eagle-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(180deg, #3a2a1c 0%, #2a1f14 100%);
  border-bottom: 2px solid #6b5234;
  cursor: move;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 4px rgba(255, 200, 50, 0.6));
}

.header-title {
  font-size: 16px;
  font-weight: bold;
  color: #d4af37;
  font-family: 'Georgia', serif;
}

.header-close {
  background: transparent;
  border: 1px solid #6b5234;
  color: #f0e6d3;
  font-size: 18px;
  cursor: pointer;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  padding: 0;
}

.header-close:hover {
  background: #e74c3c;
  color: #fff;
  border-color: #c0392b;
}

/* ========================================
   主体内容
   ======================================== */
.eagle-info-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 70vh;
  overflow-y: auto;
}

.eagle-info-body::-webkit-scrollbar {
  width: 8px;
}

.eagle-info-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.eagle-info-body::-webkit-scrollbar-thumb {
  background: #6b5234;
  border-radius: 4px;
}

/* ========================================
   神鹰头像区域
   ======================================== */
.eagle-portrait {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background: radial-gradient(circle, rgba(255, 200, 50, 0.08) 0%, transparent 70%);
  border-radius: 8px;
}

.portrait-image {
  width: 64px;
  height: 64px;
  object-fit: contain;
  image-rendering: pixelated;
  filter:
    drop-shadow(0 0 8px rgba(255, 200, 50, 0.5))
    drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  animation: portraitFloat 3s ease-in-out infinite;
}

@keyframes portraitFloat {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-6px) rotate(2deg); }
}

.portrait-name {
  font-size: 15px;
  font-weight: bold;
  color: #d4af37;
  font-family: 'Georgia', serif;
}

.portrait-level {
  font-size: 12px;
  color: #8bc34a;
  font-weight: bold;
}

/* ========================================
   属性区块
   ======================================== */
.stats-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stats-section-title {
  font-size: 12px;
  color: #8b6f47;
  font-weight: bold;
  border-bottom: 1px solid #3a2a1c;
  padding-bottom: 4px;
  font-family: 'Georgia', serif;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 8px;
  background: rgba(58, 42, 28, 0.5);
  border-radius: 4px;
  transition: background 0.2s;
}

.stat-row:hover {
  background: rgba(58, 42, 28, 0.8);
}

.stat-label {
  font-size: 13px;
  color: #b0a090;
}

.stat-value {
  font-size: 13px;
  font-weight: bold;
  color: #f0e6d3;
}

.stat-attack {
  color: #ff6b4a;
}

.stat-ratio {
  color: #d4af37;
}

/* ========================================
   持续时间进度条
   ======================================== */
.duration-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(58, 42, 28, 0.5);
  border-radius: 6px;
}

.duration-label {
  font-size: 12px;
  color: #b0a090;
  white-space: nowrap;
}

.duration-track {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  overflow: hidden;
}

.duration-fill {
  height: 100%;
  background: linear-gradient(90deg, #d4af37, #ffd700);
  border-radius: 4px;
  transition: width 1s linear;
}

.duration-time {
  font-size: 12px;
  color: #d4af37;
  font-weight: bold;
  white-space: nowrap;
  min-width: 40px;
  text-align: right;
}
</style>
