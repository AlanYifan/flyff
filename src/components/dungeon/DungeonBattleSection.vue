<!--
  @file DungeonBattleSection.vue
  @description 副本战斗信息区域组件 - 显示副本信息、倒计时、自动战斗控制
  @generated 2026-03-15
-->
<template>
  <div class="dungeon-battle-section">
    <div class="battle-info">
      <div class="dungeon-header">
        <h3 class="dungeon-name">{{ dungeonName }}</h3>
        <div class="difficulty-badge" :class="difficultyClass">{{ difficultyText }}</div>
      </div>

      <div class="info-row">
        <span class="info-label">剩余时间:</span>
        <span class="info-value time">{{ formattedTime }}</span>
      </div>

      <div class="info-row">
        <span class="info-label">当前状态:</span>
        <span class="info-value status">{{ statusMessage }}</span>
      </div>

      <div class="info-row">
        <span class="info-label">已击杀:</span>
        <span class="info-value">{{ killedCount }}/{{ totalMonsters }}</span>
      </div>
    </div>

    <div class="battle-controls">
      <button
        v-if="!autoBattle"
        class="control-btn start-btn"
        :disabled="isStarting"
        @click="handleStartAutoBattle"
      >
        {{ isStarting ? '启动中...' : '开始战斗' }}
      </button>
      <button
        v-else
        class="control-btn stop-btn"
        @click="handleStopAutoBattle"
      >
        停止战斗
      </button>
    </div>

    <div class="buffs-container" v-if="activeBuffs && activeBuffs.length > 0">
      <div
        v-for="buff in displayBuffs"
        :key="buff.id"
        class="buff-icon"
        @mouseenter="showBuffTooltip(buff, $event)"
        @mouseleave="hideBuffTooltip"
      >
        <img :src="buff.icon" :alt="buff.name" />
        <div v-if="buff.duration > 0" class="buff-timer">
          {{ formatBuffDuration(buff.duration) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 副本战斗信息区域组件
 * 显示副本名称、难度、剩余时间、战斗状态、自动战斗控制
 */
import { computed, ref } from 'vue'

const props = defineProps({
  /**
   * 副本名称
   * @type {String}
   */
  dungeonName: {
    type: String,
    default: '未知副本'
  },
  /**
   * 副本难度
   * @type {String}
   */
  difficulty: {
    type: String,
    default: '普通'
  },
  /**
   * 剩余时间（秒）
   * @type {Number}
   */
  remainingSeconds: {
    type: Number,
    default: 3600
  },
  /**
   * 是否正在自动战斗
   * @type {Boolean}
   */
  autoBattle: {
    type: Boolean,
    default: false
  },
  /**
   * 是否正在启动
   * @type {Boolean}
   */
  isStarting: {
    type: Boolean,
    default: false
  },
  /**
   * 已击杀怪物数量
   * @type {Number}
   */
  killedCount: {
    type: Number,
    default: 0
  },
  /**
   * 怪物总数
   * @type {Number}
   */
  totalMonsters: {
    type: Number,
    default: 0
  },
  /**
   * 活跃的BUFF列表
   * @type {Array}
   */
  activeBuffs: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['start-auto-battle', 'stop-auto-battle'])

/**
 * 难度样式类
 */
const difficultyClass = computed(() => {
  const classMap = {
    简单: 'easy',
    普通: 'normal',
    困难: 'hard',
    地狱: 'hell'
  }
  return classMap[props.difficulty] || 'normal'
})

/**
 * 难度文本
 */
const difficultyText = computed(() => {
  return props.difficulty || '普通'
})

/**
 * 格式化剩余时间
 */
const formattedTime = computed(() => {
  const hours = Math.floor(props.remainingSeconds / 3600)
  const minutes = Math.floor((props.remainingSeconds % 3600) / 60)
  const seconds = props.remainingSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
})

/**
 * 状态消息
 */
const statusMessage = computed(() => {
  if (props.isStarting) {
    return '启动中...'
  }
  if (props.autoBattle) {
    return '战斗中...'
  }
  return '等待开始'
})

/**
 * 显示的BUFF列表（最多显示8个）
 */
const displayBuffs = computed(() => {
  const list = Array.isArray(props.activeBuffs) ? props.activeBuffs : []
  return list.slice(0, 8)
})

/**
 * 格式化BUFF持续时间
 * @param {number} duration - 持续时间（秒）
 * @returns {string} 格式化后的时间
 */
const formatBuffDuration = (duration) => {
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * 显示BUFF提示
 */
const showBuffTooltip = (buff, event) => {
  // 简单实现，可以通过事件传递给父组件处理
}

/**
 * 隐藏BUFF提示
 */
const hideBuffTooltip = () => {
  // 简单实现
}

/**
 * 处理开始自动战斗
 */
const handleStartAutoBattle = () => {
  emit('start-auto-battle')
}

/**
 * 处理停止自动战斗
 */
const handleStopAutoBattle = () => {
  emit('stop-auto-battle')
}
</script>

<style scoped>
.dungeon-battle-section {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.95), rgba(20, 20, 40, 0.95));
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
}

.dungeon-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dungeon-name {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
  margin: 0;
}

.difficulty-badge {
  font-size: 12px;
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 4px;
}

.difficulty-badge.easy {
  background: linear-gradient(135deg, #4CAF50, #66BB6A);
  color: #fff;
}

.difficulty-badge.normal {
  background: linear-gradient(135deg, #2196f3, #42A5F5);
  color: #fff;
}

.difficulty-badge.hard {
  background: linear-gradient(135deg, #ff9800, #FFB74D);
  color: #fff;
}

.difficulty-badge.hell {
  background: linear-gradient(135deg, #f44336, #EF5350);
  color: #fff;
  animation: hellPulse 1s ease-in-out infinite;
}

@keyframes hellPulse {
  0%, 100% {
    box-shadow: 0 0 5px rgba(244, 67, 54, 0.5);
  }
  50% {
    box-shadow: 0 0 15px rgba(244, 67, 54, 0.8);
  }
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-label {
  font-size: 14px;
  color: #aaa;
}

.info-value {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}

.info-value.time {
  color: #4CAF50;
  font-family: monospace;
}

.info-value.status {
  color: #ffd700;
}

.battle-controls {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.control-btn {
  padding: 12px 30px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.start-btn {
  background: linear-gradient(135deg, #4CAF50, #66BB6A);
  color: #fff;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
}

.stop-btn {
  background: linear-gradient(135deg, #f44336, #EF5350);
  color: #fff;
}

.stop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(244, 67, 54, 0.4);
}

.buffs-container {
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.buff-icon {
  position: relative;
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}

.buff-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.buff-timer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  font-size: 8px;
  color: #fff;
  text-align: center;
  padding: 1px;
}

@media (max-width: 480px) {
  .dungeon-name {
    font-size: 16px;
  }

  .control-btn {
    padding: 10px 20px;
    font-size: 14px;
  }
}
</style>
