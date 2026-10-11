<!--
  @file DungeonProgress.vue
  @description 副本进度组件 - 显示当前副本进度，怪物从上到下垂直排列
  @generated 2026-03-15
-->
<template>
  <div class="dungeon-progress">
    <!-- 标题 -->
    <div class="progress-header">
      <span class="progress-title">📋 副本进度</span>
      <span class="progress-stats">{{ currentStage }}/{{ totalStages }}</span>
    </div>

    <!-- 总进度条 -->
    <div class="progress-bar-wrapper">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <span class="progress-percent">{{ Math.round(progressPercent) }}%</span>
    </div>

    <!-- 怪物列表 - 垂直排列 -->
    <div class="monster-list">
      <div
        v-for="(stage, index) in stages"
        :key="`stage-${index}`"
        class="monster-item"
        :class="{
          completed: index < currentStageIndex,
          current: index === currentStageIndex,
          boss: stage.count === 1
        }"
      >
        <!-- 序号 -->
        <div class="monster-index">{{ index + 1 }}</div>
        
        <!-- 怪物图标 -->
        <div class="monster-icon-wrapper">
          <img
            v-if="stage.monsterIcon"
            class="monster-icon"
            :src="stage.monsterIcon"
            :alt="stage.name"
            @error="handleImageError($event, index)"
          />
          <div v-else class="monster-icon-placeholder">?</div>
          <!-- 状态标记 -->
          <div v-if="index < currentStageIndex" class="status-badge completed">✓</div>
          <div v-else-if="index === currentStageIndex" class="status-badge current">⚔</div>
        </div>
        
        <!-- 怪物信息 -->
        <div class="monster-info">
          <div class="monster-name">{{ stage.name || '未知' }}</div>
          <div class="monster-count">x{{ stage.count || 0 }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 副本进度组件
 * 显示当前副本的进度条、阶段信息
 * 怪物从上到下垂直排列
 */
import { computed, ref } from 'vue'

const props = defineProps({
  /**
   * 副本阶段列表
   * @type {Array<{name: string, count: number, monsterIcon?: string}>}
   */
  stages: {
    type: Array,
    default: () => []
  },
  /**
   * 当前阶段索引（从0开始）
   * @type {Number}
   */
  currentStageIndex: {
    type: Number,
    default: 0
  },
  /**
   * 当前阶段已击杀数量
   * @type {Number}
   */
  currentStageKills: {
    type: Number,
    default: 0
  }
})

// 记录加载失败的图标
const failedIcons = ref(new Set())

/**
 * 阶段总数
 */
const totalStages = computed(() => {
  return Array.isArray(props.stages) ? props.stages.length : 0
})

/**
 * 当前阶段（从1开始）
 */
const currentStage = computed(() => {
  return props.currentStageIndex + 1
})

/**
 * 进度百分比
 */
const progressPercent = computed(() => {
  if (totalStages.value === 0) {
    return 0
  }
  // 计算已完成阶段的比例 + 当前阶段的进度
  const completedStageRatio = props.currentStageIndex / totalStages.value
  const currentStageRatio = 1 / totalStages.value
  const currentProgress = props.stages[props.currentStageIndex]
    ? (props.currentStageKills / (props.stages[props.currentStageIndex].count || 1)) * currentStageRatio
    : 0
  return Math.min(100, (completedStageRatio + currentProgress) * 100)
})

/**
 * 处理图片加载错误
 * @param {Event} event - 事件对象
 * @param {Number} index - 阶段索引
 */
const handleImageError = (event, index) => {
  if (event?.target) {
    failedIcons.value.add(index)
    event.target.style.display = 'none'
  }
}
</script>

<style scoped>
.dungeon-progress {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 标题 */
.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.progress-title {
  font-size: 11px;
  font-weight: bold;
  color: #ffd700;
}

.progress-stats {
  font-size: 10px;
  color: #fff;
  background: rgba(255, 215, 0, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
}

/* 进度条 */
.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-percent {
  font-size: 10px;
  font-weight: bold;
  color: #4CAF50;
  min-width: 30px;
  text-align: right;
}

/* 怪物列表 - 垂直排列 */
.monster-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  padding-right: 2px;
}

/* 单个怪物项 */
.monster-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.monster-item:hover {
  background: rgba(0, 0, 0, 0.4);
}

/* 已完成状态 */
.monster-item.completed {
  opacity: 0.5;
  border-color: rgba(76, 175, 80, 0.3);
}

/* 当前进行中 */
.monster-item.current {
  border-color: rgba(255, 215, 0, 0.5);
  background: rgba(255, 215, 0, 0.1);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.2);
}

/* Boss标记 */
.monster-item.boss {
  border-color: rgba(255, 100, 100, 0.4);
  background: rgba(255, 50, 50, 0.1);
}

/* 序号 */
.monster-index {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: bold;
  color: #888;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  flex-shrink: 0;
}

.monster-item.current .monster-index {
  color: #ffd700;
  background: rgba(255, 215, 0, 0.2);
}

.monster-item.completed .monster-index {
  color: #4CAF50;
  background: rgba(76, 175, 80, 0.2);
}

/* 怪物图标 */
.monster-icon-wrapper {
  position: relative;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.monster-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.monster-icon-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #666;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

/* 状态标记 */
.status-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  border-radius: 50%;
}

.status-badge.completed {
  background: #4CAF50;
  color: #fff;
}

.status-badge.current {
  background: #ffd700;
  color: #000;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

/* 怪物信息 */
.monster-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.monster-name {
  font-size: 10px;
  font-weight: 500;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.monster-count {
  font-size: 9px;
  color: #ffd700;
}

.monster-item.completed .monster-name {
  text-decoration: line-through;
  color: #888;
}

.monster-item.boss .monster-name {
  color: #ff8080;
}

/* 滚动条样式 */
.monster-list::-webkit-scrollbar {
  width: 3px;
}

.monster-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.monster-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.monster-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
