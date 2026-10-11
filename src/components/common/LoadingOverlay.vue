<template>
  <transition name="loading-overlay-fade">
    <div v-if="visible" class="loading-overlay">
      <div class="loading-overlay-content">
        <!-- 双环旋转动画 -->
        <div class="loading-overlay-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring spinner-ring-2"></div>
        </div>

        <!-- 游戏标题 -->
        <div class="loading-overlay-title">FlyFF</div>
        <div class="loading-overlay-subtitle">飞之梦想</div>

        <!-- 状态文字 -->
        <div class="loading-overlay-status">{{ statusText }}</div>

        <!-- 进度条 -->
        <div class="loading-overlay-bar">
          <div class="loading-overlay-bar-fill" :style="{ width: barWidth }"></div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
/**
 * @file LoadingOverlay.vue
 * @description 全局加载遮罩组件，在游戏数据初始化期间显示双环旋转动画、游戏标题和模拟进度条
 * @example <LoadingOverlay :visible="showLoading" />
 */
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  /** 是否显示加载遮罩 */
  visible: {
    type: Boolean,
    default: false
  },
  /** 加载状态文字轮播列表 */
  statusTexts: {
    type: Array,
    default: () => [
      '正在加载游戏资源...',
      '正在初始化物品数据...',
      '正在加载怪物信息...',
      '正在准备战斗系统...',
      '正在加载技能配置...',
      '即将进入游戏...'
    ]
  },
  /** 状态文字切换间隔（毫秒） */
  statusInterval: {
    type: Number,
    default: 3000
  },
  /** 进度条模拟更新间隔（毫秒） */
  progressInterval: {
    type: Number,
    default: 500
  }
})

/** 当前状态文字索引 */
const statusIndex = ref(0)
/** 模拟进度值 */
const loadingProgress = ref(0)
/** 状态文字轮播定时器 */
let statusTimer = null
/** 进度条模拟定时器 */
let progressTimer = null

/** 当前状态文字 */
const statusText = computed(() => {
  return props.statusTexts[statusIndex.value] || props.statusTexts[0]
})

/** 进度条宽度 */
const barWidth = computed(() => {
  return `${Math.min(loadingProgress.value, 95)}%`
})

/** 启动状态文字轮播和模拟进度 */
const startAnimation = () => {
  statusIndex.value = 0
  loadingProgress.value = 0

  // 状态文字轮播
  statusTimer = setInterval(() => {
    if (statusIndex.value < props.statusTexts.length - 1) {
      statusIndex.value += 1
    }
  }, props.statusInterval)

  // 模拟进度：前 80% 快速推进，后 20% 缓慢推进
  progressTimer = setInterval(() => {
    if (loadingProgress.value < 80) {
      loadingProgress.value += Math.random() * 3 + 1
    } else if (loadingProgress.value < 95) {
      loadingProgress.value += Math.random() * 0.5
    }
  }, props.progressInterval)
}

/** 停止动画并清理定时器 */
const stopAnimation = () => {
  if (statusTimer) {
    clearInterval(statusTimer)
    statusTimer = null
  }
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

// 监听 visible 变化，控制动画启停
watch(() => props.visible, (visible) => {
  if (visible) {
    startAnimation()
  } else {
    // 加载完成，进度条快速推进到 100%
    loadingProgress.value = 100
    stopAnimation()
  }
}, { immediate: true })

onUnmounted(() => {
  stopAnimation()
})
</script>

<style scoped>
/* 遮罩容器 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%);
  pointer-events: all;
}

.loading-overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* 双环旋转动画 */
.loading-overlay-spinner {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.spinner-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: loading-overlay-spin 1.2s linear infinite;
  border-top-color: #6c9fff;
  border-right-color: #6c9fff;
}

.spinner-ring-2 {
  top: 6px;
  left: 6px;
  width: calc(100% - 12px);
  height: calc(100% - 12px);
  border-top-color: transparent;
  border-right-color: transparent;
  border-bottom-color: #a78bfa;
  border-left-color: #a78bfa;
  animation-direction: reverse;
  animation-duration: 0.9s;
}

@keyframes loading-overlay-spin {
  to { transform: rotate(360deg); }
}

/* 游戏标题 */
.loading-overlay-title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #6c9fff, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
}

.loading-overlay-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 6px;
  margin-bottom: 24px;
}

/* 状态文字 */
.loading-overlay-status {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
  margin-bottom: 16px;
  min-height: 20px;
}

/* 进度条 */
.loading-overlay-bar {
  width: 240px;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.loading-overlay-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6c9fff, #a78bfa);
  border-radius: 2px;
  transition: width 0.5s ease;
}

/* 淡入淡出过渡 */
.loading-overlay-fade-enter-active {
  transition: opacity 0.3s ease;
}

.loading-overlay-fade-leave-active {
  transition: opacity 0.5s ease;
}

.loading-overlay-fade-enter-from,
.loading-overlay-fade-leave-to {
  opacity: 0;
}
</style>
