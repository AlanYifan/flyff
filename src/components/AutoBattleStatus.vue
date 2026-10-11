<template>
  <div v-if="isActive || lastFailure?.message" class="auto-battle-status">
    <div class="status-header">
      <span class="status-indicator" :class="{ active: isActive }"></span>
      <span class="status-text">{{ isActive ? '自动战斗进行中...' : '自动战斗未启动' }}</span>
    </div>
    <div v-if="!isActive && lastFailure?.message" class="status-failure">
      <div class="failure-title">自动战斗失败</div>
      <div class="failure-message">{{ lastFailure.message }}</div>
    </div>
  </div>
</template>

<script>
/**
 * @file AutoBattleStatus.vue
 * @generated 2026-01-27
 */
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'AutoBattleStatus',
  props: {
    isActive: {
      type: Boolean,
      default: false
    },
    lastFailure: {
      type: Object,
      default: null
    }
  }
})
</script>

<style scoped>
  .auto-battle-status {
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 12px;
    color: white;
    font-size: 14px;
    min-width: 200px;
  }

  .status-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  .status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #666;
    margin-right: 8px;
    transition: background-color 0.3s ease;
  }

  .status-indicator.active {
    background: #4caf50;
  }

  .status-text {
    font-weight: bold;
  }

  .status-failure {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
  }

  .failure-title {
    font-weight: bold;
    color: #ff8a80;
    margin-bottom: 4px;
  }

  .failure-message {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.4;
  }

</style>
