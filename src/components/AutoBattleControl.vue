<template>
  <div class="auto-battle-control" :class="[`mode-${mode}`, { 'is-active': isActive }]">
    <template v-if="mode === 'minimal'">
      <button
        class="auto-battle-btn"
        :class="{ active: isActive }"
        :disabled="isToggling || isPending"
        @click="handleToggleAutoBattle"
      >
        {{ toggleButtonText }}
      </button>

      <div v-if="showMinimalStatus" class="auto-battle-status">
        <span>{{ statusHintText }}</span>
      </div>
    </template>

    <template v-else-if="mode === 'full'">
      <div class="auto-battle-panel">
        <div class="panel-header">
          <h3>自动战斗控制</h3>
          <button class="close-btn" title="关闭面板" @click="closePanel">×</button>
        </div>

        <div class="status-section">
          <div class="status-item">
            <span class="status-label">状态:</span>
            <span class="status-value" :class="statusClass">
              {{ statusText }}
            </span>
          </div>

          <div v-if="isActive" class="status-item">
            <span class="status-label">攻击间隔:</span>
            <span class="status-value">{{ resolvedAttackInterval }}ms</span>
          </div>

          <div v-if="isActive" class="status-item">
            <span class="status-label">运行时间:</span>
            <span class="status-value">{{ formatDuration(runTime * 1000) }}</span>
          </div>
        </div>

        <div class="control-section">
          <button
            class="control-btn toggle-btn"
            :class="{ active: isActive, inactive: !isActive }"
            :disabled="isToggling || isPending"
            @click="handleToggleAutoBattle"
          >
            {{ togglePanelButtonText }}
          </button>
        </div>

        <div v-if="showLogs" class="log-section">
          <h4>战斗日志</h4>
          <div class="log-container">
            <div v-for="(log, index) in battleLogs.slice().reverse()" :key="index" class="log-entry">
              {{ typeof log === 'object' ? JSON.stringify(log) : log }}
            </div>
            <div v-if="battleLogs.length === 0" class="empty-log">暂无战斗日志</div>
          </div>
          <button
            class="control-btn clear-btn"
            :disabled="battleLogs.length === 0"
            @click="clearLogs"
          >
            清空日志
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'AutoBattleControl',

  props: {
    mode: {
      type: String,
      default: 'full',
      validator: value => ['minimal', 'full'].includes(value)
    },
    showLogs: {
      type: Boolean,
      default: true
    },
    phase: {
      type: String,
      default: 'idle'
    },
    isActive: {
      type: Boolean,
      default: false
    },
    runTime: {
      type: Number,
      default: 0
    },
    attackInterval: {
      type: Number,
      default: 1000
    },
    battleLogs: {
      type: Array,
      default: () => []
    }
  },

  emits: [
    'close',
    'toggle-auto-battle',
    'clear-logs'
  ],

  setup (props, { emit }) {
    const isToggling = ref(false)
    const resolvedAttackInterval = computed(() => Number(props.attackInterval) || 1000)

    const statusText = computed(() => {
      const currentPhase = props.phase
      if (currentPhase === 'starting') {
        return '启动中'
      }
      if (currentPhase === 'refreshing') {
        return '刷新怪物中'
      }
      if (currentPhase === 'countdown') {
        return '获取怪物中'
      }
      if (currentPhase === 'paused') {
        return '已暂停'
      }
      if (currentPhase === 'running') {
        return '运行中'
      }
      return '已停止'
    })

    const statusHintText = computed(() => {
      const currentPhase = props.phase
      if (currentPhase === 'starting') {
        return '自动战斗启动中...'
      }
      if (currentPhase === 'refreshing') {
        return '正在刷新怪物...'
      }
      if (currentPhase === 'countdown') {
        return '正在获取怪物...'
      }
      if (currentPhase === 'paused') {
        return '自动战斗已暂停'
      }
      if (currentPhase === 'running') {
        return '自动战斗进行中...'
      }
      return '自动战斗已停止'
    })

    const statusClass = computed(() => ({
      active: props.phase === 'running',
      inactive: props.phase === 'idle',
      paused: props.phase === 'paused',
      pending: ['starting', 'refreshing', 'countdown'].includes(props.phase)
    }))

    const isPending = computed(() => ['starting', 'refreshing', 'countdown'].includes(props.phase))
    const showMinimalStatus = computed(() =>
      ['starting', 'refreshing', 'countdown', 'running', 'paused'].includes(props.phase)
    )

    const toggleButtonText = computed(() => {
      if (props.phase === 'paused') {
        return '继续自动战斗'
      }
      if (props.phase === 'starting') {
        return '启动中...'
      }
      if (props.phase === 'refreshing') {
        return '刷新中...'
      }
      if (props.phase === 'countdown') {
        return '获取怪物中...'
      }
      if (props.isActive) {
        return '停止自动战斗'
      }
      return '自动战斗'
    })

    const togglePanelButtonText = computed(() => {
      if (props.phase === 'paused') {
        return '继续自动战斗'
      }
      if (props.phase === 'starting') {
        return '启动中...'
      }
      if (props.phase === 'refreshing') {
        return '刷新中...'
      }
      if (props.phase === 'countdown') {
        return '获取怪物中...'
      }
      if (props.isActive) {
        return '停止自动战斗'
      }
      return '开始自动战斗'
    })

    const handleToggleAutoBattle = () => {
      if (isToggling.value) {return}
      isToggling.value = true

      Promise.resolve()
        .then(() => {
          emit('toggle-auto-battle')
        })
        .catch(error => {
          console.error('[AutoBattleControl] toggle-auto-battle 失败:', error)
        })
        .finally(() => {
          isToggling.value = false
        })
    }

    const clearLogs = () => {
      try {
        emit('clear-logs')
      } catch (error) {
        console.error('[AutoBattleControl] clear-logs 失败:', error)
      }
    }

    const closePanel = () => {
      try {
        if (props.isActive) {
          emit('toggle-auto-battle')
        }
        emit('close')
      } catch (error) {
        console.error('[AutoBattleControl] closePanel 失败:', error)
      }
    }

    const formatDuration = milliseconds => {
      if (!milliseconds || milliseconds <= 0) {
        return '0秒'
      }

      const totalSeconds = Math.floor(milliseconds / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      const parts = []

      if (hours > 0) {
        parts.push(`${hours}小时`)
      }

      if (minutes > 0) {
        parts.push(`${minutes}分`)
      }

      if (seconds > 0 || parts.length === 0) {
        parts.push(`${seconds}秒`)
      }

      return parts.join('')
    }

    return {
      isToggling,
      resolvedAttackInterval,
      statusText,
      statusHintText,
      statusClass,
      isPending,
      showMinimalStatus,
      toggleButtonText,
      togglePanelButtonText,
      handleToggleAutoBattle,
      clearLogs,
      formatDuration,
      closePanel
    }
  }
}
</script>

<style scoped>
  .auto-battle-control {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .auto-battle-control.mode-minimal {
    gap: 10px;
  }

  .auto-battle-control.mode-full {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
  }

  .auto-battle-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .auto-battle-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .auto-battle-btn.active {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  .auto-battle-status {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    padding: 10px;
    font-size: 12px;
  }

  .auto-battle-status span {
    display: block;
    margin-bottom: 4px;
    color: #ccc;
  }

  .auto-battle-panel {
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid #4a90e2;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(74, 144, 226, 0.5);
    min-width: 400px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    padding: 20px;
    color: #fff;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #4a90e2;
  }

  .panel-header h3 {
    margin: 0;
    color: #4a90e2;
    font-size: 18px;
  }

  .close-btn {
    background: none;
    border: none;
    color: #fff;
    font-size: 24px;
    cursor: pointer;
    padding: 0 10px;
    transition: color 0.3s;
  }

  .close-btn:hover {
    color: #ff6b6b;
  }

  .status-section {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    padding: 15px;
    margin-bottom: 15px;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .status-item:last-child {
    margin-bottom: 0;
  }

  .status-label {
    color: #aaa;
  }

  .status-value {
    font-weight: bold;
  }

  .status-value.active {
    color: #4caf50;
  }

  .status-value.inactive {
    color: #ff6b6b;
  }

  .control-section {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  }

  .control-btn {
    flex: 1;
    padding: 10px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s;
  }

  .toggle-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .toggle-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }

  .toggle-btn.active {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  .log-section {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    padding: 15px;
  }

  .log-section h4 {
    margin: 0 0 10px 0;
    color: #4a90e2;
  }

  .log-container {
    max-height: 200px;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 10px;
  }

  .log-entry {
    padding: 5px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 12px;
    color: #ddd;
  }

  .log-entry:last-child {
    border-bottom: none;
  }

  .empty-log {
    text-align: center;
    color: #777;
    padding: 20px;
  }

  .clear-btn {
    background: #e74c3c;
    color: white;
  }

  .clear-btn:hover {
    background: #c0392b;
  }

  .clear-btn:disabled {
    background: #7f8c8d;
    cursor: not-allowed;
  }

  .log-container::-webkit-scrollbar {
    width: 8px;
  }

  .log-container::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }

  .log-container::-webkit-scrollbar-thumb {
    background: #4a90e2;
    border-radius: 4px;
  }

  .log-container::-webkit-scrollbar-thumb:hover {
    background: #357ae8;
  }
</style>
