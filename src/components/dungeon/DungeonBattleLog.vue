<!--
  @file DungeonBattleLog.vue
  @description 副本战斗日志组件 - 显示战斗过程中的日志信息
  @generated 2026-03-15
-->
<template>
  <div class="dungeon-battle-log">
    <div class="log-header">
      <span class="log-title">战斗日志</span>
      <button class="clear-btn" @click="handleClearLogs">清空</button>
    </div>
    <div ref="logContentRef" class="log-content">
      <div
        v-for="(log, index) in displayLogs"
        :key="`log-${index}-${log.timestamp}`"
        class="log-entry"
        :style="{ color: log.color }"
      >
        <span v-if="log.timestamp" class="log-time">{{ formatTime(log.timestamp) }}</span>
        <span class="log-text">{{ log.text }}</span>
      </div>
      <div v-if="logs.length === 0" class="log-empty">
        暂无日志
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 副本战斗日志组件
 * 显示战斗过程中的日志信息，支持自动滚动
 */
import { computed, ref, watch, nextTick } from 'vue'

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
   * @type {Number}
   */
  maxLogs: {
    type: Number,
    default: 50
  }
})

const emit = defineEmits(['clear-logs'])

const logContentRef = ref(null)

/**
 * 显示的日志列表（限制数量）
 */
const displayLogs = computed(() => {
  const list = Array.isArray(props.logs) ? props.logs : []
  // 显示最近的日志，按时间倒序
  return list.slice(-props.maxLogs).reverse()
})

/**
 * 格式化时间戳
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的时间
 */
const formatTime = (timestamp) => {
  if (!timestamp) {
    return ''
  }
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * 清空日志
 */
const handleClearLogs = () => {
  emit('clear-logs')
}

/**
 * 监听日志变化，自动滚动
 */
watch(
  () => props.logs.length,
  () => {
    nextTick(() => {
      if (logContentRef.value) {
        logContentRef.value.scrollTop = 0
      }
    })
  }
)
</script>

<style scoped>
.dungeon-battle-log {
  background: linear-gradient(135deg, rgba(20, 20, 35, 0.95), rgba(15, 15, 30, 0.95));
  border: 2px solid rgba(139, 115, 85, 0.5);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 200px;
  overflow: hidden;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(139, 115, 85, 0.2);
  border-bottom: 1px solid rgba(139, 115, 85, 0.3);
}

.log-title {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
}

.clear-btn {
  padding: 4px 10px;
  font-size: 12px;
  color: #aaa;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.1);
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-content::-webkit-scrollbar {
  width: 6px;
}

.log-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.log-content::-webkit-scrollbar-thumb {
  background: rgba(139, 115, 85, 0.5);
  border-radius: 3px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 115, 85, 0.7);
}

.log-entry {
  font-size: 12px;
  line-height: 1.4;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  animation: fadeIn 0.2s ease;
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

.log-time {
  color: #888;
  margin-right: 8px;
  font-size: 10px;
}

.log-text {
  word-break: break-all;
}

.log-empty {
  font-size: 14px;
  color: #666;
  text-align: center;
  padding: 30px;
  font-style: italic;
}

@media (max-width: 480px) {
  .log-entry {
    font-size: 11px;
  }

  .log-time {
    font-size: 9px;
  }
}
</style>
