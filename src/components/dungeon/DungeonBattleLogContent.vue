<!--
  @file DungeonBattleLogContent.vue
  @description 副本战斗日志内容组件 - 卷轴式设计
  @features
    - 等宽字体打字机效果
    - 不同类型日志颜色区分
    - 自定义滚动条样式
  @generated 2026-03-15
-->
<template>
  <div class="dungeon-battle-log-content" ref="logContentRef">
    <div
      v-for="(log, index) in displayLogs"
      :key="`log-${log.timestamp || index}`"
      class="log-entry"
      :class="getLogClass(log)"
    >
      <span class="log-time" v-if="showTimestamp">{{ formatTime(log.timestamp) }}</span>
      <span class="log-text">{{ log.text }}</span>
    </div>
    <div v-if="displayLogs.length === 0" class="log-empty">
      <span class="empty-icon">⏳</span>
      <span class="empty-text">等待战斗开始...</span>
    </div>
  </div>
</template>

<script setup>
/**
 * 副本战斗日志内容组件
 * 卷轴式设计 - 古老羊皮卷感觉
 */
import { computed, ref, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  /**
   * 日志列表
   */
  logs: {
    type: Array,
    default: () => []
  },
  /**
   * 最大显示日志数量
   */
  maxLogs: {
    type: Number,
    default: 50
  },
  /**
   * 是否显示时间戳
   */
  showTimestamp: {
    type: Boolean,
    default: false
  }
})

const logContentRef = ref(null)

/**
 * 计算显示的日志列表
 */
const displayLogs = computed(() => {
  const logs = props.logs.slice(-props.maxLogs)
  return [...logs].reverse()
})

/**
 * 获取日志类型CSS类
 * @param {Object} log - 日志对象
 * @returns {string} CSS类名
 */
const getLogClass = (log) => {
  const text = log.text || ''
  const color = log.color || ''
  
  // 根据颜色判断类型
  if (color.includes('#EF476F') || color.includes('#ff') || text.includes('伤害') || text.includes('暴击')) {
    return 'log-damage'
  }
  if (color.includes('#00F5D4') || color.includes('#4CAF50') || text.includes('Buff') || text.includes('触发')) {
    return 'log-system'
  }
  if (color.includes('#ffd700') || color.includes('#FFD700') || text.includes('获得') || text.includes('击败')) {
    return 'log-reward'
  }
  if (color.includes('#ff4444') || color.includes('#F44336') || text.includes('失败') || text.includes('死亡')) {
    return 'log-error'
  }
  return 'log-normal'
}

/**
 * 格式化时间戳
 */
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `[${hours}:${minutes}:${seconds}]`
}
</script>

<style scoped>
/* ============ CSS变量 ============ */
.dungeon-battle-log-content {
  --text-cold: #8D99AE;
  --damage-pink: #EF476F;
  --glow-curse-green: #00F5D4;
  --speed-amber: #FFD166;
  --glow-blood-red: #D90429;
  --material-dark: #1C2028;
  --border-iron: #2A3040;
  
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 15px;
  font-family: 'Consolas', 'Courier New', monospace;
}

/* 自定义滚动条 - 细线样式 */
.dungeon-battle-log-content::-webkit-scrollbar {
  width: 3px;
}

.dungeon-battle-log-content::-webkit-scrollbar-track {
  background: transparent;
}

.dungeon-battle-log-content::-webkit-scrollbar-thumb {
  background: #4A4E69;
  border-radius: 2px;
}

.dungeon-battle-log-content::-webkit-scrollbar-thumb:hover {
  background: #6B7094;
}

/* ============ 日志条目 ============ */
.log-entry {
  font-size: 12px;
  line-height: 1.6;
  padding: 3px 8px;
  border-radius: 2px;
  word-wrap: break-word;
  animation: typeIn 0.15s ease-out;
}

.log-time {
  font-size: 10px;
  color: #4A4E69;
  margin-right: 8px;
}

.log-text {
  color: inherit;
}

/* 不同类型日志样式 */
.log-normal {
  color: var(--text-cold);
}

.log-damage {
  color: var(--damage-pink);
  font-weight: 600;
}

.log-system {
  color: var(--glow-curse-green);
  font-size: 11px;
}

.log-reward {
  color: var(--speed-amber);
  font-weight: 500;
}

.log-error {
  color: var(--glow-blood-red);
}

@keyframes typeIn {
  from {
    opacity: 0;
    transform: translateX(-5px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ============ 空日志提示 ============ */
.log-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: var(--text-cold);
  font-style: italic;
}

.empty-icon {
  font-size: 24px;
  opacity: 0.5;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.empty-text {
  font-size: 12px;
}

/* ============ 响应式 ============ */
@media (max-width: 480px) {
  .dungeon-battle-log-content {
    padding: 8px 10px;
    font-size: 11px;
  }
  
  .log-entry {
    padding: 2px 6px;
  }
  
  .log-time {
    display: none;
  }
}
</style>
