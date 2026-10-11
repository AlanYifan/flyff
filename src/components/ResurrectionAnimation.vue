<!--
  @file ResurrectionAnimation.vue
  @generated 2026-04-03
  @description 玩家复活特效动画组件
  - 金色圣光从天而降
  - 羽毛飘落效果
  - 光环扩散效果
  - 复活文字动画
-->
<template>
  <Teleport to="body">
    <Transition name="resurrection-fade">
      <div v-if="isVisible" class="resurrection-overlay" :style="overlayStyle">
        <!-- 背景光晕 -->
        <div class="resurrection-bg-glow"></div>

        <!-- 从天而降的光柱 -->
        <div class="light-pillar">
          <div class="pillar-core"></div>
          <div class="pillar-outer"></div>
          <div class="pillar-particles">
            <span v-for="i in 20" :key="i" class="pillar-particle"></span>
          </div>
        </div>

        <!-- 羽毛飘落 -->
        <div class="feathers-container">
          <span v-for="i in 15" :key="i" class="feather"></span>
        </div>

        <!-- 光环扩散 -->
        <div class="light-rings">
          <div v-for="i in 3" :key="i" class="ring"></div>
        </div>

        <!-- 地面光效 -->
        <div class="ground-light"></div>

        <!-- 复活文字 -->
        <div class="resurrection-text">
          <span class="text-glow">复 活</span>
          <span class="text-main">复 活</span>
        </div>

        <!-- 闪烁粒子 -->
        <div class="sparkles">
          <span v-for="i in 30" :key="i" class="sparkle"></span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * 复活特效动画组件
 * @description 玩家复活时显示的金色圣光特效动画
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

// ========== Props ==========
const props = defineProps({
  /**
   * 是否显示动画
   */
  visible: {
    type: Boolean,
    default: false
  },
  /**
   * 动画持续时间（毫秒）
   */
  duration: {
    type: Number,
    default: 3000
  },
  /**
   * 目标位置（相对于视口）
   */
  position: {
    type: Object,
    default: () => ({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    })
  }
})

// ========== Emits ==========
const emit = defineEmits(['complete'])

// ========== 响应式状态 ==========
const isVisible = ref(false)
let hideTimer = null

// ========== 计算属性 ==========
/**
 * 覆盖层样式
 */
const overlayStyle = computed(() => ({
  '--pos-x': `${props.position.x}px`,
  '--pos-y': `${props.position.y}px`
}))

// ========== 方法 ==========
/**
 * 显示动画
 */
const show = () => {
  isVisible.value = true

  // 清除之前的定时器
  if (hideTimer) {
    clearTimeout(hideTimer)
  }

  // 设置自动隐藏
  hideTimer = setTimeout(() => {
    hide()
  }, props.duration)
}

/**
 * 隐藏动画
 */
const hide = () => {
  isVisible.value = false
  emit('complete')
}

/**
 * 切换显示状态
 */
const toggle = () => {
  if (isVisible.value) {
    hide()
  } else {
    show()
  }
}

// ========== 监听 props.visible 变化 ==========
const stopWatch = ref(null)

onMounted(() => {
  // 动态导入 watch
  import('vue').then(({ watch }) => {
    stopWatch.value = watch(
      () => props.visible,
      (newVal) => {
        if (newVal) {
          show()
        } else {
          hide()
        }
      },
      { immediate: true }
    )
  })
})

onUnmounted(() => {
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
  if (stopWatch.value) {
    stopWatch.value()
  }
})

// ========== 暴露方法 ==========
defineExpose({
  show,
  hide,
  toggle
})
</script>

<style scoped>
/* ========== 容器样式 ========== */
.resurrection-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10000;
  overflow: hidden;
}

.resurrection-bg-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 300px 400px at var(--pos-x) var(--pos-y),
    rgba(255, 215, 0, 0.15) 0%,
    rgba(255, 200, 100, 0.08) 30%,
    transparent 70%
  );
  animation: bgPulse 2s ease-in-out infinite;
}

@keyframes bgPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* ========== 光柱效果 ========== */
.light-pillar {
  position: absolute;
  left: var(--pos-x);
  top: -100px;
  transform: translateX(-50%);
  width: 120px;
  height: calc(var(--pos-y) + 150px);
  animation: pillarDescend 0.5s ease-out forwards;
}

@keyframes pillarDescend {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(-50px);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.pillar-core {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 215, 0, 0.8) 30%,
    rgba(255, 180, 50, 0.6) 60%,
    rgba(255, 150, 0, 0.3) 100%
  );
  filter: blur(8px);
  animation: pillarFlicker 0.3s ease-in-out infinite alternate;
}

@keyframes pillarFlicker {
  0% { opacity: 0.8; width: 35px; }
  100% { opacity: 1; width: 45px; }
}

.pillar-outer {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(255, 215, 0, 0.4) 0%,
    rgba(255, 200, 100, 0.2) 50%,
    transparent 100%
  );
  filter: blur(20px);
}

.pillar-particles {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 100%;
}

.pillar-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  animation: particleFall 1.5s linear infinite;
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.8);
}

@keyframes particleFall {
  0% {
    transform: translateY(-20px);
    opacity: 1;
  }
  100% {
    transform: translateY(calc(var(--pos-y) + 100px));
    opacity: 0;
  }
}

/* 为每个粒子设置不同的位置和延迟 */
.pillar-particle:nth-child(1) { left: 10%; animation-delay: 0s; }
.pillar-particle:nth-child(2) { left: 20%; animation-delay: 0.1s; }
.pillar-particle:nth-child(3) { left: 30%; animation-delay: 0.2s; }
.pillar-particle:nth-child(4) { left: 40%; animation-delay: 0.15s; }
.pillar-particle:nth-child(5) { left: 50%; animation-delay: 0.25s; }
.pillar-particle:nth-child(6) { left: 60%; animation-delay: 0.05s; }
.pillar-particle:nth-child(7) { left: 70%; animation-delay: 0.3s; }
.pillar-particle:nth-child(8) { left: 80%; animation-delay: 0.12s; }
.pillar-particle:nth-child(9) { left: 15%; animation-delay: 0.35s; }
.pillar-particle:nth-child(10) { left: 25%; animation-delay: 0.08s; }
.pillar-particle:nth-child(11) { left: 35%; animation-delay: 0.22s; }
.pillar-particle:nth-child(12) { left: 45%; animation-delay: 0.18s; }
.pillar-particle:nth-child(13) { left: 55%; animation-delay: 0.28s; }
.pillar-particle:nth-child(14) { left: 65%; animation-delay: 0.03s; }
.pillar-particle:nth-child(15) { left: 75%; animation-delay: 0.32s; }
.pillar-particle:nth-child(16) { left: 85%; animation-delay: 0.14s; }
.pillar-particle:nth-child(17) { left: 5%; animation-delay: 0.38s; }
.pillar-particle:nth-child(18) { left: 95%; animation-delay: 0.06s; }
.pillar-particle:nth-child(19) { left: 50%; animation-delay: 0.24s; }
.pillar-particle:nth-child(20) { left: 30%; animation-delay: 0.1s; }

/* ========== 羽毛飘落效果 ========== */
.feathers-container {
  position: absolute;
  left: calc(var(--pos-x) - 150px);
  top: 0;
  width: 300px;
  height: var(--pos-y);
}

.feather {
  position: absolute;
  width: 20px;
  height: 8px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 230, 150, 0.8) 50%,
    rgba(255, 200, 100, 0.6) 100%
  );
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  filter: blur(1px);
  animation: featherFall 3s ease-in-out infinite;
  opacity: 0;
}

@keyframes featherFall {
  0% {
    transform: translateY(-30px) rotate(0deg) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateY(calc(var(--pos-y) + 50px)) rotate(360deg) translateX(calc(var(--pos-y) * 0.3px));
    opacity: 0;
  }
}

.feather:nth-child(1) { left: 10%; animation-delay: 0s; animation-duration: 2.5s; }
.feather:nth-child(2) { left: 20%; animation-delay: 0.3s; animation-duration: 3s; }
.feather:nth-child(3) { left: 30%; animation-delay: 0.6s; animation-duration: 2.8s; }
.feather:nth-child(4) { left: 40%; animation-delay: 0.2s; animation-duration: 3.2s; }
.feather:nth-child(5) { left: 50%; animation-delay: 0.5s; animation-duration: 2.6s; }
.feather:nth-child(6) { left: 60%; animation-delay: 0.1s; animation-duration: 3.1s; }
.feather:nth-child(7) { left: 70%; animation-delay: 0.4s; animation-duration: 2.9s; }
.feather:nth-child(8) { left: 80%; animation-delay: 0.7s; animation-duration: 3.3s; }
.feather:nth-child(9) { left: 15%; animation-delay: 0.15s; animation-duration: 2.7s; }
.feather:nth-child(10) { left: 25%; animation-delay: 0.45s; animation-duration: 3s; }
.feather:nth-child(11) { left: 35%; animation-delay: 0.25s; animation-duration: 2.8s; }
.feather:nth-child(12) { left: 45%; animation-delay: 0.55s; animation-duration: 3.1s; }
.feather:nth-child(13) { left: 55%; animation-delay: 0.35s; animation-duration: 2.9s; }
.feather:nth-child(14) { left: 65%; animation-delay: 0.65s; animation-duration: 3.2s; }
.feather:nth-child(15) { left: 75%; animation-delay: 0.8s; animation-duration: 2.6s; }

/* ========== 光环扩散效果 ========== */
.light-rings {
  position: absolute;
  left: var(--pos-x);
  top: var(--pos-y);
  transform: translate(-50%, -50%);
}

.ring {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border: 3px solid rgba(255, 215, 0, 0.8);
  border-radius: 50%;
  animation: ringExpand 1.5s ease-out infinite;
  box-shadow:
    0 0 10px rgba(255, 215, 0, 0.5),
    inset 0 0 10px rgba(255, 215, 0, 0.3);
}

@keyframes ringExpand {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
    border-width: 4px;
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
    border-width: 1px;
  }
}

.ring:nth-child(1) { animation-delay: 0s; }
.ring:nth-child(2) { animation-delay: 0.5s; }
.ring:nth-child(3) { animation-delay: 1s; }

/* ========== 地面光效 ========== */
.ground-light {
  position: absolute;
  left: var(--pos-x);
  top: var(--pos-y);
  transform: translate(-50%, -50%);
  width: 200px;
  height: 100px;
  background: radial-gradient(
    ellipse 100px 50px at center,
    rgba(255, 215, 0, 0.6) 0%,
    rgba(255, 200, 100, 0.3) 40%,
    transparent 70%
  );
  animation: groundPulse 1s ease-in-out infinite;
}

@keyframes groundPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
}

/* ========== 复活文字 ========== */
.resurrection-text {
  position: absolute;
  left: var(--pos-x);
  top: calc(var(--pos-y) - 80px);
  transform: translateX(-50%);
  font-size: 42px;
  font-weight: bold;
  letter-spacing: 8px;
  animation: textAppear 0.5s ease-out 0.3s forwards;
  opacity: 0;
}

@keyframes textAppear {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(20px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

.text-glow {
  position: absolute;
  left: 0;
  top: 0;
  color: rgba(255, 215, 0, 0.5);
  filter: blur(8px);
  animation: textGlow 1s ease-in-out infinite alternate;
}

@keyframes textGlow {
  0% { filter: blur(6px); opacity: 0.6; }
  100% { filter: blur(10px); opacity: 1; }
}

.text-main {
  position: relative;
  color: #fff;
  text-shadow:
    0 0 10px rgba(255, 215, 0, 0.8),
    0 0 20px rgba(255, 200, 100, 0.6),
    0 0 30px rgba(255, 180, 50, 0.4),
    2px 2px 4px rgba(0, 0, 0, 0.5);
}

/* ========== 闪烁粒子 ========== */
.sparkles {
  position: absolute;
  left: calc(var(--pos-x) - 100px);
  top: calc(var(--pos-y) - 100px);
  width: 200px;
  height: 200px;
}

.sparkle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #fff;
  border-radius: 50%;
  animation: sparkle 1.5s ease-in-out infinite;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
}

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}

/* 为闪烁粒子设置随机位置和延迟 */
.sparkle:nth-child(1) { left: 10%; top: 20%; animation-delay: 0s; }
.sparkle:nth-child(2) { left: 20%; top: 40%; animation-delay: 0.1s; }
.sparkle:nth-child(3) { left: 30%; top: 10%; animation-delay: 0.2s; }
.sparkle:nth-child(4) { left: 40%; top: 60%; animation-delay: 0.15s; }
.sparkle:nth-child(5) { left: 50%; top: 30%; animation-delay: 0.25s; }
.sparkle:nth-child(6) { left: 60%; top: 50%; animation-delay: 0.05s; }
.sparkle:nth-child(7) { left: 70%; top: 70%; animation-delay: 0.3s; }
.sparkle:nth-child(8) { left: 80%; top: 15%; animation-delay: 0.12s; }
.sparkle:nth-child(9) { left: 90%; top: 45%; animation-delay: 0.22s; }
.sparkle:nth-child(10) { left: 15%; top: 80%; animation-delay: 0.18s; }
.sparkle:nth-child(11) { left: 25%; top: 55%; animation-delay: 0.28s; }
.sparkle:nth-child(12) { left: 35%; top: 35%; animation-delay: 0.03s; }
.sparkle:nth-child(13) { left: 45%; top: 75%; animation-delay: 0.32s; }
.sparkle:nth-child(14) { left: 55%; top: 25%; animation-delay: 0.08s; }
.sparkle:nth-child(15) { left: 65%; top: 85%; animation-delay: 0.14s; }
.sparkle:nth-child(16) { left: 75%; top: 5%; animation-delay: 0.38s; }
.sparkle:nth-child(17) { left: 85%; top: 65%; animation-delay: 0.06s; }
.sparkle:nth-child(18) { left: 5%; top: 90%; animation-delay: 0.24s; }
.sparkle:nth-child(19) { left: 95%; top: 40%; animation-delay: 0.1s; }
.sparkle:nth-child(20) { left: 12%; top: 68%; animation-delay: 0.34s; }
.sparkle:nth-child(21) { left: 22%; top: 18%; animation-delay: 0.16s; }
.sparkle:nth-child(22) { left: 32%; top: 78%; animation-delay: 0.26s; }
.sparkle:nth-child(23) { left: 42%; top: 48%; animation-delay: 0.04s; }
.sparkle:nth-child(24) { left: 52%; top: 88%; animation-delay: 0.36s; }
.sparkle:nth-child(25) { left: 62%; top: 8%; animation-delay: 0.11s; }
.sparkle:nth-child(26) { left: 72%; top: 58%; animation-delay: 0.21s; }
.sparkle:nth-child(27) { left: 82%; top: 28%; animation-delay: 0.31s; }
.sparkle:nth-child(28) { left: 92%; top: 72%; animation-delay: 0.07s; }
.sparkle:nth-child(29) { left: 48%; top: 12%; animation-delay: 0.17s; }
.sparkle:nth-child(30) { left: 58%; top: 42%; animation-delay: 0.27s; }

/* ========== 过渡动画 ========== */
.resurrection-fade-enter-active {
  animation: fadeIn 0.3s ease-out;
}

.resurrection-fade-leave-active {
  animation: fadeOut 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
</style>
