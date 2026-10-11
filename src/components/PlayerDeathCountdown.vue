<!--
  @file PlayerDeathCountdown.vue
  @generated 2026-06-23
  @description 玩家死亡倒计时动画组件 - 浏览器居中显示，红色主题，沙漏翻转动画
  与 MonsterCountdown 转圈动画风格一致，但配色为红色系+沙漏翻转效果
-->
<template>
  <Teleport to="body">
    <transition name="death-fade" appear>
      <div v-if="showCountdown" class="death-overlay">
        <div class="death-panel">
          <!-- 沙漏翻转动画 + 转圈动画环 -->
          <div class="spinner-ring">
            <svg class="spinner-svg" viewBox="0 0 64 64">
              <!-- 底层轨道 -->
              <circle
                class="spinner-track"
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke-width="3"
              />
              <!-- 旋转弧线 -->
              <circle
                class="spinner-arc"
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke-width="3"
                stroke-linecap="round"
              />
            </svg>
            <!-- 沙漏图标（翻转动画） -->
            <div class="hourglass-wrapper">
              <svg class="hourglass-icon" viewBox="0 0 24 24" fill="none">
                <!-- 沙漏外框 -->
                <path
                  d="M6 2L6 6L10.5 10.5L6 15L6 20"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M18 2L18 6L13.5 10.5L18 15L18 20"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <!-- 上半部沙子 -->
                <path
                  class="sand-top"
                  d="M8 4H16L12 8Z"
                  fill="currentColor"
                  opacity="0.6"
                />
                <!-- 下半部沙子 -->
                <path
                  class="sand-bottom"
                  d="M8 18H16L12 14Z"
                  fill="currentColor"
                  opacity="0.8"
                />
                <!-- 沙漏颈部沙流 -->
                <line
                  class="sand-stream"
                  x1="12"
                  y1="8"
                  x2="12"
                  y2="14"
                  stroke="currentColor"
                  stroke-width="0.8"
                  opacity="0.5"
                />
              </svg>
            </div>
          </div>
          <!-- 死亡文字 -->
          <div class="death-text">你已死亡</div>
          <!-- 倒计时秒数 -->
          <div class="countdown-timer">{{ countdown }}秒后复活</div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
/**
 * 玩家死亡倒计时动画组件
 * 红色主题 + 沙漏翻转动画 + 转圈动画环
 * 与 MonsterCountdown 转圈动画风格一致
 */
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  /** 是否激活倒计时 */
  isActive: {
    type: Boolean,
    default: false
  },
  /** 倒计时秒数 */
  countdownSeconds: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['countdown-finished'])

/** 是否显示倒计时 */
const showCountdown = ref(false)

/** 当前剩余秒数 */
const countdown = ref(props.countdownSeconds)

/** requestAnimationFrame ID */
let rafId = 0

/** 动画开始时间戳 */
let startAt = 0

/** 上一秒记录 */
let lastSecond = 0

/**
 * 启动倒计时动画，使用 requestAnimationFrame 精确追踪时间
 */
const startCountdown = () => {
  if (!props.isActive) return

  const rawSeconds = Number(props.countdownSeconds)
  const totalSeconds = Number.isFinite(rawSeconds) && rawSeconds > 0 ? rawSeconds : 3

  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }

  showCountdown.value = true
  countdown.value = totalSeconds
  startAt = performance.now()
  lastSecond = totalSeconds

  /** 动画帧回调，精确计算剩余秒数 */
  const step = (now) => {
    const elapsed = Math.max(0, now - startAt)
    const remaining = Math.max(0, totalSeconds - Math.floor(elapsed / 1000))
    if (remaining !== lastSecond) {
      lastSecond = remaining
      countdown.value = remaining
    }
    if (remaining <= 0) {
      rafId = 0
      emit('countdown-finished')
      setTimeout(() => {
        showCountdown.value = false
      }, 100)
      return
    }
    rafId = requestAnimationFrame(step)
  }
  rafId = requestAnimationFrame(step)
}

/** 监听 isActive 变化，开始倒计时 */
const unwatch = watch(
  () => props.isActive,
  (newVal) => {
    if (newVal) {
      startCountdown()
      return
    }
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
    showCountdown.value = false
  },
  { immediate: true }
)

// 组件卸载时清理
onUnmounted(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  if (unwatch) {
    unwatch()
  }
})
</script>

<style scoped>
/* ========================================
   淡入淡出过渡
   ======================================== */
.death-fade-enter-active,
.death-fade-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
  will-change: opacity, transform;
}

.death-fade-enter-from,
.death-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.death-fade-enter-to,
.death-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* ========================================
   全屏遮罩 - 浏览器居中
   ======================================== */
.death-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.5);
}

/* ========================================
   面板主体 - 红色死亡主题
   ======================================== */
.death-panel {
  background: linear-gradient(145deg, #2a0505, #1a0000);
  border: 1px solid rgba(255, 60, 60, 0.3);
  border-radius: 12px;
  padding: 32px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(255, 0, 0, 0.08);
  pointer-events: auto;
}

/* ========================================
   转圈动画环 + 沙漏容器
   ======================================== */
.spinner-ring {
  position: relative;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform;
  transform: translateZ(0);
}

.spinner-svg {
  width: 72px;
  height: 72px;
  animation: spin 2.4s linear infinite;
  will-change: transform;
  transform: translateZ(0);
}

/* 底层轨道圆 - 红色调 */
.spinner-track {
  stroke: rgba(255, 80, 80, 0.15);
  opacity: 0.5;
}

/* 旋转弧线 - 红色 */
.spinner-arc {
  stroke: #ff4444;
  stroke-dasharray: 60 176;
  animation: arc-rotate 2.4s linear infinite;
  will-change: stroke-dasharray, stroke-dashoffset;
  transform: translateZ(0);
  filter: drop-shadow(0 0 4px rgba(255, 68, 68, 0.5));
}

/* ========================================
   沙漏图标（翻转动画）
   ======================================== */
.hourglass-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) translateZ(0);
  will-change: transform;
  animation: hourglass-flip 2.4s ease-in-out infinite;
}

.hourglass-icon {
  width: 22px;
  height: 22px;
  color: #ff6666;
  filter: drop-shadow(0 0 3px rgba(255, 68, 68, 0.6));
}

/* 上半部沙子动画：逐渐减少 */
.sand-top {
  animation: sand-drain 2.4s ease-in infinite;
}

/* 下半部沙子动画：逐渐增加 */
.sand-bottom {
  animation: sand-fill 2.4s ease-in infinite;
}

/* 沙流动画 */
.sand-stream {
  animation: sand-stream-blink 0.8s ease-in-out infinite;
}

/* ========================================
   文字样式
   ======================================== */
.death-text {
  font-size: 18px;
  color: #ff4444;
  font-weight: bold;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(255, 0, 0, 0.6);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.countdown-timer {
  font-size: 14px;
  color: rgba(255, 140, 140, 0.9);
  font-weight: bold;
  letter-spacing: 0.5px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  white-space: nowrap;
}

/* ========================================
   关键帧动画
   ======================================== */

/* 转圈旋转 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 弧线伸缩动画 */
@keyframes arc-rotate {
  0% {
    stroke-dasharray: 1 176;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 80 176;
    stroke-dashoffset: -30;
  }
  100% {
    stroke-dasharray: 1 176;
    stroke-dashoffset: -176;
  }
}

/* 沙漏翻转：每2.4秒翻转一次，与转圈动画同步 */
@keyframes hourglass-flip {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  45% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  50% {
    transform: translate(-50%, -50%) rotate(180deg);
  }
  95% {
    transform: translate(-50%, -50%) rotate(180deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* 上半部沙子逐渐减少 */
@keyframes sand-drain {
  0% {
    opacity: 0.6;
  }
  45% {
    opacity: 0;
  }
  50% {
    opacity: 0.6;
  }
  95% {
    opacity: 0;
  }
  100% {
    opacity: 0.6;
  }
}

/* 下半部沙子逐渐增加 */
@keyframes sand-fill {
  0% {
    opacity: 0.1;
  }
  45% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.1;
  }
  95% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.1;
  }
}

/* 沙流闪烁 */
@keyframes sand-stream-blink {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.15;
  }
}
</style>
