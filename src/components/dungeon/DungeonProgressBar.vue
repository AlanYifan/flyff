<!--
  @file DungeonProgressBar.vue
  @description 副本进度条组件 - 深渊禁忌风格
  @features
    - 幽冥紫填充色
    - 发光粒子特效
    - 阶段名称显示
  @generated 2026-03-15
-->
<template>
  <div class="progress-bar-container">
    <div class="stage-name" v-if="stageName">{{ stageName }}</div>
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: `${percentage}%` }">
        <div class="progress-glow"></div>
        <div class="progress-particles">
          <span v-for="i in 5" :key="`p-${i}`" class="p-particle"></span>
        </div>
      </div>
    </div>
    <div class="progress-text">{{ current }} / {{ total }}</div>
  </div>
</template>

<script setup>
/**
 * 副本进度条组件
 * 深渊禁忌风格 - 幽冥紫填充 + 发光粒子
 */
import { computed } from 'vue'

const props = defineProps({
  /**
   * 当前进度
   */
  current: {
    type: Number,
    default: 0
  },
  /**
   * 总进度
   */
  total: {
    type: Number,
    default: 100
  },
  /**
   * 当前阶段名称
   */
  stageName: {
    type: String,
    default: ''
  }
})

const percentage = computed(() => {
  if (props.total <= 0) return 0
  return Math.min(100, Math.max(0, (props.current / props.total) * 100))
})
</script>

<style scoped>
.progress-bar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.stage-name {
  font-size: 11px;
  color: #8D99AE;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.progress-track {
  width: 100%;
  height: 6px;
  background: transparent;
  border: 1px solid #2A3040;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #9D4EDD, #C77DFF);
  border-radius: 2px;
  position: relative;
  transition: width 0.3s ease-out;
}

.progress-glow {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 10px;
  background: radial-gradient(ellipse at center, rgba(157, 78, 221, 0.8) 0%, transparent 70%);
  animation: glowPulse 1.5s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.6;
    transform: translateY(-50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateY(-50%) scale(1.5);
  }
}

.progress-particles {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 30px;
  overflow: visible;
}

.p-particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #fff;
  border-radius: 50%;
  opacity: 0;
  animation: particleFloat 2s ease-out infinite;
}

.p-particle:nth-child(1) { animation-delay: 0s; }
.p-particle:nth-child(2) { animation-delay: 0.4s; top: 2px; }
.p-particle:nth-child(3) { animation-delay: 0.8s; top: -2px; }
.p-particle:nth-child(4) { animation-delay: 1.2s; top: 1px; }
.p-particle:nth-child(5) { animation-delay: 1.6s; top: -1px; }

@keyframes particleFloat {
  0% {
    opacity: 0;
    transform: translateX(0) translateY(0);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(15px) translateY(var(--y-offset, 0));
  }
}

.p-particle:nth-child(1) { --y-offset: -3px; }
.p-particle:nth-child(2) { --y-offset: 5px; }
.p-particle:nth-child(3) { --y-offset: -6px; }
.p-particle:nth-child(4) { --y-offset: 4px; }
.p-particle:nth-child(5) { --y-offset: -2px; }

.progress-text {
  font-size: 10px;
  color: #748D92;
  font-family: 'Consolas', monospace;
}
</style>
