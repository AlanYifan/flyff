<!--
  @file BuffDisplay.vue
  @description BUFF增益效果显示组件 - 支持单人和多人模式
  @generated 2026-03-17
-->
<template>
  <div class="buff-display-container">
    <div class="buff-icons-container">
      <div
        v-for="buff in sortedBuffs"
        :key="buff.id"
        class="buff-icon"
        :class="{
          'buff-icon-warning': getBuffDisplayDuration(buff) > 0 && getBuffDisplayDuration(buff) < 30
        }"
        @mouseenter="handleShowBuffTooltip(buff, $event)"
        @mouseleave="handleHideBuffTooltip"
        @mousemove="handleMoveBuffTooltip($event)"
        @dblclick="handleBuffDoubleClick(buff, $event)"
      >
        <img :src="buff.icon" :alt="buff.name" @error="handleImageError" />
        <div v-if="getBuffDisplayDuration(buff) > 0" class="buff-timer">
          {{ formatBuffDuration(getBuffDisplayDuration(buff)) }}
        </div>
        <div v-if="buff.stackCount > 1" class="buff-stack-count">
          {{ buff.stackCount }}
        </div>
      </div>
      <div v-if="(!sortedBuffs || sortedBuffs.length === 0) && !compact" class="buff-empty">
        暂无增益
      </div>
    </div>
    <!-- 使用 Teleport 将 tooltip 传送到 body，避免父元素 transform 影响 position:fixed -->
    <Teleport to="body">
      <BuffTooltip :visible="buffTooltipVisible" :buff="hoveredBuff" :position="buffTooltipPosition" />
    </Teleport>
  </div>
</template>

<script setup>
/**
 * BUFF增益效果显示组件
 * 支持单人模式（传入单个activeBuffs数组）和多人模式（传入多个角色的activeBuffs）
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BuffTooltip from './BuffTooltip.vue'

const props = defineProps({
  /**
   * 活跃的BUFF列表
   * @type {Array}
   */
  activeBuffs: {
    type: Array,
    default: () => []
  },
  /**
   * 版本号（用于强制刷新，因为 markRaw 阻止了响应式更新）
   * @type {Number}
   */
  version: {
    type: Number,
    default: 0
  },
  /**
   * 紧凑模式（用于队伍成员卡片中）
   * @type {Boolean}
   */
  compact: {
    type: Boolean,
    default: false
  },
  /**
   * 最大显示数量（紧凑模式下使用）
   * @type {Number}
   */
  maxDisplay: {
    type: Number,
    default: 0 // 0表示不限制
  },
  /**
   * 目标对象（拥有这些buff的角色）
   * @type {Object}
   */
  target: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['buff-removed', 'buff-remove-request'])

// BUFF Tooltip 状态
const buffTooltipVisible = ref(false)
const hoveredBuff = ref(null)
const buffTooltipPosition = ref({ x: 0, y: 0 })

// 响应式时间戳，用于触发BUFF倒计时更新
const currentTime = ref(Date.now())
let updateTimer = null

/**
 * 启动倒计时更新定时器
 */
const startUpdateTimer = () => {
  if (updateTimer) return
  
  updateTimer = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
}

/**
 * 停止倒计时更新定时器
 */
const stopUpdateTimer = () => {
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
  }
}

// 组件挂载时启动定时器
onMounted(() => {
  startUpdateTimer()
})

// 组件卸载时停止定时器
onBeforeUnmount(() => {
  stopUpdateTimer()
})

/**
 * 获取BUFF显示用的duration
 * @param {Object} buff - BUFF对象
 * @returns {number} 剩余时间（秒）
 */
const getBuffDisplayDuration = (buff) => {
  if (!buff) return 0
  
  // 访问 currentTime.value 触发响应式更新
  // eslint-disable-next-line no-unused-vars
  const _ = currentTime.value
  
  // 如果有endTime或expiresAt，计算剩余时间
  const buffEndTime = buff.endTime || buff.expiresAt
  if (buffEndTime) {
    const remaining = Math.ceil((buffEndTime - Date.now()) / 1000)
    return Math.max(0, remaining)
  }
  
  // 否则使用duration字段
  return buff.duration || 0
}

/**
 * 排序后的BUFF列表
 */
const sortedBuffs = computed(() => {
  // 依赖 version 强制刷新（因为 activeBuffs 被 markRaw 包装，不会触发响应式更新）
  // eslint-disable-next-line no-unused-vars
  const _version = props.version
  
  const buffs = Array.isArray(props.activeBuffs) ? props.activeBuffs : []
  
  // 过滤无效BUFF和已过期的BUFF
  const now = Date.now()
  let filtered = buffs.filter(buff => {
    if (!buff || (!buff.id && !buff.key)) return false
    // 检查 expiresAt 是否已过期
    const expiresAt = Number(buff.expiresAt ?? 0)
    if (expiresAt > 0 && expiresAt <= now) return false
    return true
  })
  
  // 按添加时间和优先级排序
  const withIndex = filtered.map((buff, index) => ({ buff, index }))
  
  const getPriority = (buff) => {
    const id = Number(buff?.id)
    // 自动恢复和自动出售优先级最高
    if (id === 1276) return 0
    if (id === 1277) return 1
    return 10
  }
  
  const getAddedAt = (buff) => {
    const value = Number(buff?.addedAt ?? buff?.startTime ?? 0)
    return Number.isFinite(value) ? value : 0
  }
  
  let sorted = withIndex
    .sort((a, b) => {
      const priorityDiff = getPriority(a.buff) - getPriority(b.buff)
      if (priorityDiff !== 0) return priorityDiff
      
      const timeDiff = getAddedAt(a.buff) - getAddedAt(b.buff)
      if (timeDiff !== 0) return timeDiff
      
      return a.index - b.index
    })
    .map(entry => entry.buff)
  
  // 如果设置了最大显示数量，截断列表
  if (props.maxDisplay > 0 && sorted.length > props.maxDisplay) {
    sorted = sorted.slice(0, props.maxDisplay)
  }
  
  return sorted
})

/**
 * 格式化BUFF持续时间
 * @param {number} duration - 持续时间（秒）
 * @returns {string} 格式化后的时间字符串（格式：xx:xx 或 x:xx:xx）
 */
const formatBuffDuration = (duration) => {
  const safeDuration = Number(duration)
  if (!Number.isFinite(safeDuration) || safeDuration <= 0) {
    return '0:00'
  }
  
  const totalSeconds = Math.floor(safeDuration)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  // 统一使用 xx:xx 格式，超过1小时使用 x:xx:xx 格式
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * 处理图片加载错误
 * @param {Event} e - 事件对象
 */
const handleImageError = (e) => {
  e.target.src = '/pt/skill_icon/default_skill.png'
}

/**
 * 获取客户端坐标
 * @param {Event} event - 事件对象
 * @returns {Object} 坐标对象
 */
const getClientPoint = (event) => {
  if (event?.touches && event.touches[0]) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    }
  }
  return {
    x: event?.clientX ?? 0,
    y: event?.clientY ?? 0
  }
}

/**
 * 获取Tooltip锚点位置
 * @param {Event} event - 事件对象
 * @returns {Object} 坐标对象
 */
const getBuffTooltipAnchorPoint = (event) => {
  const point = getClientPoint(event)
  return {
    x: point.x - 300,
    y: point.y - 100
  }
}

/**
 * 更新Tooltip位置
 * @param {Event} event - 事件对象
 */
const updateBuffTooltipPosition = (event) => {
  buffTooltipPosition.value = getBuffTooltipAnchorPoint(event)
}

/**
 * 显示BUFF Tooltip
 * @param {Object} buff - BUFF对象
 * @param {Event} event - 事件对象
 */
const handleShowBuffTooltip = (buff, event) => {
  hoveredBuff.value = buff || null
  updateBuffTooltipPosition(event)
  buffTooltipVisible.value = true
}

/**
 * 移动BUFF Tooltip
 * @param {Event} event - 事件对象
 */
const handleMoveBuffTooltip = (event) => {
  if (!buffTooltipVisible.value) return
  updateBuffTooltipPosition(event)
}

/**
 * 隐藏BUFF Tooltip
 */
const handleHideBuffTooltip = () => {
  buffTooltipVisible.value = false
  hoveredBuff.value = null
}

/**
 * 处理BUFF图标双击事件 - 触发移除Buff请求
 * @param {Object} buff - BUFF对象
 * @param {Event} event - 事件对象
 */
const handleBuffDoubleClick = (buff, event) => {
  // 隐藏tooltip
  handleHideBuffTooltip()
  
  // 触发移除请求事件
  emit('buff-remove-request', {
    buff,
    target: props.target,
    event
  })
}
</script>

<style scoped>
.buff-display-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  align-items: center;
}

.buff-icons-container {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: center;
}

.buff-icon {
  position: relative;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(52, 152, 219, 0.15);
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.buff-icon:hover {
  transform: scale(1.1);
  border-color: rgba(52, 152, 219, 0.6);
}

.buff-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.buff-icon-warning {
  border-color: rgba(231, 76, 60, 0.6);
  animation: buff-warning-pulse 1s ease-in-out infinite;
}

@keyframes buff-warning-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.buff-timer {
  position: absolute;
  bottom: -1px;
  right: -1px;
  font-size: 8px;
  color: #fff;
  background: linear-gradient(180deg, #3498db 0%, #2980b9 100%);
  padding: 0 2px;
  border-radius: 2px;
  font-weight: bold;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
}

.buff-stack-count {
  position: absolute;
  top: -2px;
  right: -2px;
  font-size: 9px;
  min-width: 12px;
  height: 12px;
  line-height: 12px;
  text-align: center;
  color: #fff;
  background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%);
  border-radius: 6px;
  font-weight: bold;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
  padding: 0 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.buff-empty {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  padding: 2px 4px;
}

/* 紧凑模式样式 */
.buff-display-container.compact .buff-icons-container {
  gap: 2px;
}

.buff-display-container.compact .buff-icon {
  width: 18px;
  height: 18px;
}

.buff-display-container.compact .buff-timer {
  font-size: 5px;
  padding: 0 1px;
}

.buff-display-container.compact .buff-stack-count {
  font-size: 7px;
  min-width: 10px;
  height: 10px;
  line-height: 10px;
  top: -1px;
  right: -1px;
}
</style>
