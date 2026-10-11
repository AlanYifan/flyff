<!--
  @file HotRecoveryEffect.vue
  @generated 2026-07-29
  @description 圣光庇护HOT恢复特效 - 持续治疗·魔力涌泉（每次HOT触发时播放）
  圣光庇护Q技能HOT触发时显示恢复动画，覆盖在玩家头像区域
  动画总时长：1.2秒（轻量化，适配每2秒一次的HOT触发频率）
    ⓪ 治愈涌现（0s ~ 0.5s）- 亮绿生命能量脉冲 + HP恢复数字飘升
    ① 魔力涌泉（0s ~ 0.5s）- 亮蓝魔力能量脉冲 + MP恢复数字飘升
    ② 能量消散（0.5s ~ 1.2s）- 恢复光芒渐隐消散
  色彩方案：亮绿(#00FF66) + 亮蓝(#00BFFF) + 圣光白(#FFFFFF)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
-->
<template>
  <!-- HOT恢复舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="hot-recovery-stage" :style="stageStyle">
    <!-- ===== HP恢复效果（亮绿色）===== -->
    <template v-if="healAmount > 0">
      <!-- 生命脉冲 - 亮绿治愈能量径向爆发 -->
      <div class="hot-hp-pulse"></div>
      <!-- 生命波纹 - 向外扩散的亮绿光环 -->
      <div class="hot-hp-wave wave-1"></div>
      <div class="hot-hp-wave wave-2"></div>
      <!-- 生命上升粒子 - 从中心向上飘升的亮绿光粒 -->
      <div
        v-for="i in 8"
        :key="'hot-hp-particle-' + i"
        class="hot-hp-particle"
        :style="getHpParticleStyle(i)"
      ></div>
      <!-- HP恢复数字 -->
      <div class="hot-recovery-number hot-hp-number">
        +{{ formatNumber(healAmount) }}
      </div>
    </template>

    <!-- ===== MP恢复效果（亮蓝色）===== -->
    <template v-if="mpAmount > 0">
      <!-- 魔力脉冲 - 亮蓝魔力能量径向爆发 -->
      <div class="hot-mp-pulse"></div>
      <!-- 魔力波纹 - 向外扩散的亮蓝光环 -->
      <div class="hot-mp-wave wave-1"></div>
      <div class="hot-mp-wave wave-2"></div>
      <!-- 魔力上升粒子 - 从中心向上飘升的亮蓝光粒 -->
      <div
        v-for="i in 8"
        :key="'hot-mp-particle-' + i"
        class="hot-mp-particle"
        :style="getMpParticleStyle(i)"
      ></div>
      <!-- MP恢复数字 -->
      <div class="hot-recovery-number hot-mp-number">
        +{{ formatNumber(mpAmount) }}
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * 圣光庇护HOT恢复特效 - 持续治疗·魔力涌泉
 * 圣光庇护Q技能HOT每2秒触发恢复时播放的轻量恢复动画
 * 显示HP恢复（亮绿）和MP恢复（亮蓝）的视觉反馈，附带恢复数字飘升
 * 一次性播放，动画结束后由父组件通过 v-if 移除
 * 定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

/** Props定义 */
defineProps({
  /** HP恢复量，大于0时显示亮绿治愈动画 */
  healAmount: {
    type: Number,
    default: 0
  },
  /** MP恢复量，大于0时显示亮蓝魔力动画 */
  mpAmount: {
    type: Number,
    default: 0
  }
})

/** 舞台 DOM 引用 */
const stageRef = ref(null)

/** 头像区域位置信息（相对定位父容器） */
const avatarRect = ref({ left: 0, top: 0, width: 100, height: 100 })

/** 窗口 resize 回调引用 */
let resizeHandler = null

/**
 * 计算HOT恢复舞台的动态样式
 * 根据 #playerAvatar 的实际位置和尺寸，精确定位覆盖头像区域
 * @returns {Object} CSS 样式对象
 */
const stageStyle = computed(() => {
  const expand = 8
  const w = avatarRect.value.width + expand * 2
  const h = avatarRect.value.height + expand * 2
  return {
    left: `${avatarRect.value.left - expand}px`,
    top: `${avatarRect.value.top - expand}px`,
    width: `${w}px`,
    height: `${h}px`,
    transform: 'none'
  }
})

/**
 * 格式化恢复数值显示（千分位逗号分隔）
 * @param {number} num - 恢复量
 * @returns {string} 格式化后的字符串
 */
function formatNumber (num) {
  return Number(num).toLocaleString('en-US')
}

/**
 * 查找 #playerAvatar 元素并计算其相对于定位父容器的偏移位置
 * 使用 offsetLeft/offsetTop 遍历方式，避免祖先 transform: scale 导致的双重缩放问题
 */
function updateAvatarPosition () {
  try {
    const stage = stageRef.value
    if (!stage) return

    const avatar = document.getElementById('playerAvatar')
    if (!avatar) return

    const positioningParent = stage.offsetParent
    if (!positioningParent) return

    let offsetX = 0
    let offsetY = 0
    let current = avatar
    while (current && current !== positioningParent) {
      offsetX += current.offsetLeft || 0
      offsetY += current.offsetTop || 0
      current = current.offsetParent
    }

    avatarRect.value = {
      left: offsetX,
      top: offsetY,
      width: avatar.offsetWidth || 100,
      height: avatar.offsetHeight || 100
    }
  } catch (e) {
    // 更新头像位置失败，静默处理
  }
}

/**
 * 计算HP治愈上升粒子的样式
 * @param {number} index - 粒子索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getHpParticleStyle (index) {
  const angle = (index - 1) * 45 + (index % 2) * 12
  const distance = 15 + (index % 3) * 8
  const riseHeight = 45 + (index % 3) * 15
  const delay = (index % 4) * 0.05
  return {
    '--hot-particle-angle': `${angle}deg`,
    '--hot-particle-dist': `${distance}px`,
    '--hot-particle-rise': `${riseHeight}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算MP魔力上升粒子的样式
 * @param {number} index - 粒子索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getMpParticleStyle (index) {
  const angle = (index - 1) * 45 + (index % 2) * 12
  const distance = 15 + (index % 3) * 8
  const riseHeight = 45 + (index % 3) * 15
  const delay = 0.1 + (index % 4) * 0.05
  return {
    '--hot-particle-angle': `${angle}deg`,
    '--hot-particle-dist': `${distance}px`,
    '--hot-particle-rise': `${riseHeight}px`,
    animationDelay: `${delay}s`
  }
}

onMounted(async () => {
  await nextTick()
  requestAnimationFrame(() => {
    updateAvatarPosition()
  })

  resizeHandler = () => updateAvatarPosition()
  window.addEventListener('resize', resizeHandler)
})

onBeforeUnmount(() => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
})
</script>

<style scoped>
/* ================================================================
   圣光庇护HOT恢复特效 - 持续治疗·魔力涌泉
   轻量级恢复动画，适配每2秒一次的HOT触发频率
   色彩方案：亮绿(#00FF66) + 亮蓝(#00BFFF) + 纯白(#FFFFFF)
   动画总时长：1.2秒（一次性播放）
   ================================================================ */

/* HOT恢复舞台 - 定位容器 */
.hot-recovery-stage {
  position: absolute;
  contain: layout style;
  pointer-events: none;
  z-index: 55;
  will-change: opacity;
  animation: hot-stage-fade 0.3s ease-out forwards;
}

@keyframes hot-stage-fade {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* ================================================================
   HP恢复效果（亮绿色 #00FF66）
   ================================================================ */

/* 生命脉冲 - 亮绿治愈能量径向爆发 */
.hot-hp-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(0, 255, 102, 0.7) 20%,
    rgba(0, 255, 102, 0.35) 50%,
    rgba(0, 200, 80, 0.15) 75%,
    transparent 90%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: hot-hp-pulse 0.6s ease-out forwards;
  will-change: transform, opacity;
  filter: blur(1px);
}

@keyframes hot-hp-pulse {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  30% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2);
    opacity: 0;
  }
}

/* 生命波纹 - 向外扩散的亮绿光环 */
.hot-hp-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 45%;
  height: 45%;
  border-radius: 50%;
  border: 3px solid rgba(0, 255, 102, 0.8);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  box-shadow:
    0 0 8px rgba(0, 255, 102, 0.6),
    inset 0 0 6px rgba(0, 255, 102, 0.4);
}

.hot-hp-wave.wave-1 {
  animation: hot-hp-wave-expand 0.8s ease-out 0.1s forwards;
}

.hot-hp-wave.wave-2 {
  animation: hot-hp-wave-expand 0.9s ease-out 0.25s forwards;
  border-color: rgba(100, 255, 150, 0.6);
}

@keyframes hot-hp-wave-expand {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.3);
    opacity: 0;
  }
  20% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2.5);
    opacity: 0;
  }
}

/* 生命上升粒子 - 从中心向上飘升的亮绿光粒 */
.hot-hp-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(0, 255, 102, 1) 35%,
    rgba(0, 200, 80, 0.6) 70%,
    transparent 100%
  );
  box-shadow:
    0 0 6px rgba(0, 255, 102, 0.9),
    0 0 12px rgba(0, 255, 102, 0.5);
  transform: translate3d(-50%, -50%, 0) rotate(var(--hot-particle-angle, 0deg)) translateX(0px) translateY(0px) scale(0);
  animation: hot-particle-rise 1s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes hot-particle-rise {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--hot-particle-angle, 0deg)) translateX(0px) translateY(0px) scale(0);
    opacity: 0;
  }
  20% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--hot-particle-angle, 0deg)) translateX(calc(var(--hot-particle-dist, 20px) * 0.5)) translateY(calc(var(--hot-particle-rise, 50px) * -0.3)) scale(1.3);
  }
  80% { opacity: 0.7; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--hot-particle-angle, 0deg)) translateX(var(--hot-particle-dist, 20px)) translateY(calc(var(--hot-particle-rise, 50px) * -1)) scale(0.3);
    opacity: 0;
  }
}

/* ================================================================
   MP恢复效果（亮蓝色 #00BFFF）
   ================================================================ */

/* 魔力脉冲 - 亮蓝魔力能量径向爆发 */
.hot-mp-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(0, 191, 255, 0.7) 20%,
    rgba(0, 191, 255, 0.35) 50%,
    rgba(0, 140, 200, 0.15) 75%,
    transparent 90%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: hot-mp-pulse 0.6s ease-out 0.1s forwards;
  will-change: transform, opacity;
  filter: blur(1px);
}

@keyframes hot-mp-pulse {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  30% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2);
    opacity: 0;
  }
}

/* 魔力波纹 - 向外扩散的亮蓝光环 */
.hot-mp-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 45%;
  height: 45%;
  border-radius: 50%;
  border: 3px solid rgba(0, 191, 255, 0.8);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  box-shadow:
    0 0 8px rgba(0, 191, 255, 0.6),
    inset 0 0 6px rgba(0, 191, 255, 0.4);
}

.hot-mp-wave.wave-1 {
  animation: hot-mp-wave-expand 0.8s ease-out 0.2s forwards;
}

.hot-mp-wave.wave-2 {
  animation: hot-mp-wave-expand 0.9s ease-out 0.35s forwards;
  border-color: rgba(100, 200, 255, 0.6);
}

@keyframes hot-mp-wave-expand {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.3);
    opacity: 0;
  }
  20% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2.5);
    opacity: 0;
  }
}

/* 魔力上升粒子 - 从中心向上飘升的亮蓝光粒 */
.hot-mp-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(0, 191, 255, 1) 35%,
    rgba(0, 140, 200, 0.6) 70%,
    transparent 100%
  );
  box-shadow:
    0 0 6px rgba(0, 191, 255, 0.9),
    0 0 12px rgba(0, 191, 255, 0.5);
  transform: translate3d(-50%, -50%, 0) rotate(var(--hot-particle-angle, 0deg)) translateX(0px) translateY(0px) scale(0);
  animation: hot-particle-rise 1s ease-out forwards;
  will-change: transform, opacity;
}

/* ================================================================
   恢复数字显示
   ================================================================ */

.hot-recovery-number {
  position: absolute;
  left: 50%;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.5px;
  transform: translate3d(-50%, 0, 0);
  animation: hot-number-rise 1.2s ease-out forwards;
  will-change: transform, opacity;
  white-space: nowrap;
  z-index: 10;
}

/* HP恢复数字 - 亮绿，位于上方，带深色描边确保对比度 */
.hot-hp-number {
  top: 20%;
  color: #00FF66;
  text-shadow:
    -1px -1px 0 rgba(0, 0, 0, 0.9),
    1px -1px 0 rgba(0, 0, 0, 0.9),
    -1px 1px 0 rgba(0, 0, 0, 0.9),
    1px 1px 0 rgba(0, 0, 0, 0.9),
    0 0 6px rgba(0, 255, 102, 0.8),
    0 0 12px rgba(0, 255, 102, 0.5);
}

/* MP恢复数字 - 亮蓝，位于下方，带深色描边确保对比度 */
.hot-mp-number {
  top: 70%;
  color: #00BFFF;
  text-shadow:
    -1px -1px 0 rgba(0, 0, 0, 0.9),
    1px -1px 0 rgba(0, 0, 0, 0.9),
    -1px 1px 0 rgba(0, 0, 0, 0.9),
    1px 1px 0 rgba(0, 0, 0, 0.9),
    0 0 6px rgba(0, 191, 255, 0.8),
    0 0 12px rgba(0, 191, 255, 0.5);
}

@keyframes hot-number-rise {
  0% {
    opacity: 0;
    transform: translate3d(-50%, 10px, 0) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translate3d(-50%, 0, 0) scale(1.2);
  }
  40% {
    transform: translate3d(-50%, -5px, 0) scale(1);
  }
  80% {
    opacity: 0.8;
    transform: translate3d(-50%, -25px, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate3d(-50%, -40px, 0) scale(0.8);
  }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .hot-recovery-stage * {
    animation-duration: 0.3s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
