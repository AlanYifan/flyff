<!--
  @file PoisonArrowEffect.vue
  @generated 2026-07-07
  @description 毒箭技能特效动画组件：箭矢从天而降，落地产生毒气涟漪冲击波
  复用箭雨特效动画结构（ArrowRainEffect），颜色改为绿色中毒色调
  显示2秒后自动移除，GPU加速，覆盖整个right-section怪物显示区域
-->
<template>
  <div v-if="isVisible" class="pa-stage" :style="containerStyle">
    <!-- 暗幕压顶 - 天空暗化效果（毒绿色调） -->
    <div class="pa-sky-dim"></div>

    <!-- 箭矢层 - 纯CSS箭头从上方落下 -->
    <div class="pa-arrows-layer">
      <div
        v-for="arrow in arrows"
        :key="arrow.id"
        class="pa-arrow"
        :style="arrow.style"
      ></div>
    </div>

    <!-- 落地冲击波层 -->
    <div class="pa-impacts-layer">
      <div
        v-for="impact in impacts"
        :key="impact.id"
        class="pa-impact-ripple"
        :style="impact.style"
      ></div>
    </div>

    <!-- 全屏毒光闪烁 - 箭雨结束时闪烁 -->
    <div class="pa-screen-flash"></div>
  </div>
</template>

<script setup>
/**
 * 毒箭技能特效动画组件
 * 复用箭雨特效动画结构（ArrowRainEffect），箭矢从空中密集落下，落地产生毒气涟漪冲击波扩散效果
 * 颜色从蓝白色改为绿色中毒色调（剧毒绿 #7CFC00 + 毒液黄绿 #ADFF2F + 深毒绿 #006400）
 * GPU加速：所有动画使用 transform + opacity，避免触发重排
 * 特效范围覆盖整个right-section怪物显示区域（inset: 0）
 * 显示2秒后自动移除
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

/** 动画总持续时间（毫秒） */
const ANIMATION_DURATION_MS = 2000

/** 箭矢数量 */
const ARROW_COUNT = 30

/** 落地冲击波数量 */
const IMPACT_COUNT = 18

/** 是否可见 */
const isVisible = ref(false)

/** 箭矢数据列表 */
const arrows = ref([])

/** 落地冲击波数据列表 */
const impacts = ref([])

/** 清理定时器 */
let cleanupTimer = null

/**
 * 特效容器样式 - 覆盖整个right-section父容器
 * 使用 inset: 0 撑满父元素
 */
const containerStyle = {
  position: 'absolute',
  inset: '0'
}

/**
 * 生成随机数（含最小值，不含最大值）
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机数
 */
const rand = (min, max) => Math.random() * (max - min) + min

/**
 * 生成剧毒箭矢数据
 * 每支箭从容器顶部上方随机位置落下，带有不同的延迟和水平位置
 * 颜色使用绿色中毒色调，结构与箭雨特效一致
 * @returns {Array} 箭矢配置数组
 */
function generateArrows () {
  const list = []
  for (let i = 0; i < ARROW_COUNT; i++) {
    const leftPos = rand(3, 97)          // 水平位置（%）
    const delay = rand(0, 1.2)           // 下落延迟（秒）
    const duration = rand(0.5, 0.9)       // 下落时长（秒）
    const size = rand(48, 82)             // 箭矢长度
    const rotate = rand(-5, 5)            // 微小旋转偏移，箭头朝下为主
    const opacity = rand(0.8, 1)          // 透明度变化

    list.push({
      id: `pa-arrow-${i}`,
      style: {
        left: `${leftPos}%`,
        top: `-${size + 40}px`,
        width: `${Math.max(3, size * 0.05)}px`,   // 箭杆宽度
        height: `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        '--pa-arrow-rotate': `${rotate}deg`,
        '--pa-arrow-opacity': opacity,
        willChange: 'transform, opacity'
      }
    })
  }
  return list
}

/**
 * 生成落地毒气冲击波数据
 * 每个冲击波在箭矢落地后从落点向外扩散
 * @returns {Array} 冲击波配置数组
 */
function generateImpacts () {
  const list = []
  for (let i = 0; i < IMPACT_COUNT; i++) {
    const leftPos = rand(5, 95)          // 水平位置（%）
    const bottomPos = rand(5, 55)        // 垂直位置（%），偏向下方
    const delay = rand(0.3, 1.5)         // 延迟（秒），在箭落地后触发
    const size = rand(30, 70)            // 冲击波尺寸
    const duration = rand(0.6, 1.0)      // 扩散时长

    list.push({
      id: `pa-impact-${i}`,
      style: {
        left: `${leftPos}%`,
        top: `${100 - bottomPos}%`,
        width: `${size}px`,
        height: `${size * 0.5}px`,       // 椭圆形，模拟透视
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        willChange: 'transform, opacity'
      }
    })
  }
  return list
}

/**
 * 播放毒箭特效动画
 * 生成箭矢和冲击波数据，2秒后自动清理
 */
function playAnimation () {
  if (cleanupTimer) {
    clearTimeout(cleanupTimer)
    cleanupTimer = null
  }

  arrows.value = generateArrows()
  impacts.value = generateImpacts()
  isVisible.value = true

  cleanupTimer = setTimeout(() => {
    isVisible.value = false
    arrows.value = []
    impacts.value = []
    cleanupTimer = null
  }, ANIMATION_DURATION_MS)
}

/**
 * 暴露给父组件的方法
 */
defineExpose({
  playAnimation
})

onMounted(() => {
  nextTick(() => {
    playAnimation()
  })
})

onUnmounted(() => {
  if (cleanupTimer) {
    clearTimeout(cleanupTimer)
    cleanupTimer = null
  }
})
</script>

<style scoped>
/* ========================================
   毒箭特效容器 - 覆盖整个right-section区域
   使用 inset: 0 撑满父容器
   ======================================== */
.pa-stage {
  pointer-events: none;
  z-index: 60;
  overflow: hidden;
  border-radius: 10px;
}

/* ========================================
   天空暗化效果 - 毒箭来临时天色变暗（毒绿色调）
   GPU: 仅 opacity 动画
   ======================================== */
.pa-sky-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 20%,
    rgba(10, 40, 0, 0.5) 0%,
    rgba(5, 20, 0, 0.7) 40%,
    rgba(0, 10, 0, 0.85) 100%
  );
  animation: pa-sky-dim 2s ease-in-out forwards;
  will-change: opacity;
}

@keyframes pa-sky-dim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}

/* ========================================
   箭矢层 - 容纳所有箭矢
   ======================================== */
.pa-arrows-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* ========================================
   单支箭矢 - 纯CSS绘制
   结构：箭头(::after) + 箭杆(主体) + 尾羽(::before)
   箭头：剧毒绿色锐角三角
   箭杆：深毒绿色，带毒液高光
   尾羽：分叉羽毛 + 毒液光轨拖尾
   GPU: 仅 transform: translateY + opacity
   ======================================== */
.pa-arrow {
  position: absolute;
  /* 箭杆：深毒绿色 */
  background: linear-gradient(
    to right,
    rgba(20, 60, 0, 0.6) 0%,
    rgba(40, 100, 0, 0.9) 30%,
    rgba(60, 140, 0, 1) 50%,
    rgba(40, 100, 0, 0.9) 70%,
    rgba(20, 60, 0, 0.6) 100%
  );
  border-radius: 1px;
  opacity: 0;
  transform: rotate(var(--pa-arrow-rotate));
  animation: pa-arrow-fall linear forwards;
  will-change: transform, opacity;
}

/* 箭头 - 剧毒绿色锐角箭头，位于箭杆底部（下落方向前端），箭头朝下 */
.pa-arrow::after {
  content: '';
  position: absolute;
  bottom: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  /* 向下的锐角三角箭头，加大尺寸匹配更长的箭杆 */
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 16px solid rgba(173, 255, 47, 0.95);
  filter: drop-shadow(0 0 4px rgba(124, 252, 0, 0.8))
          drop-shadow(0 1px 2px rgba(173, 255, 47, 0.5));
}

/* 尾羽 + 毒液光轨拖尾，位于箭杆顶部（下落方向尾端），加大匹配更长箭杆 */
.pa-arrow::before {
  content: '';
  position: absolute;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 10px;
  /* 羽毛分叉效果 - 用V形渐变模拟 */
  background:
    linear-gradient(135deg, rgba(40, 100, 0, 0.7) 0%, transparent 50%),
    linear-gradient(225deg, rgba(40, 100, 0, 0.7) 0%, transparent 50%),
    linear-gradient(
      to bottom,
      rgba(124, 252, 0, 0.3) 0%,
      rgba(173, 255, 47, 0.5) 40%,
      rgba(124, 252, 0, 0.1) 100%
    );
  filter: drop-shadow(0 -2px 4px rgba(124, 252, 0, 0.4));
  clip-path: polygon(0% 100%, 50% 0%, 100% 100%);
}

@keyframes pa-arrow-fall {
  0% {
    transform: translateY(0) rotate(var(--pa-arrow-rotate));
    opacity: 0;
  }
  8% {
    opacity: var(--pa-arrow-opacity, 0.8);
  }
  80% {
    opacity: var(--pa-arrow-opacity, 0.8);
  }
  100% {
    /* 从上方落到容器底部再延伸一段距离 */
    transform: translateY(calc(100vh + 100px)) rotate(var(--pa-arrow-rotate));
    opacity: 0;
  }
}

/* ========================================
   落地冲击波层 - 容纳所有毒气涟漪
   ======================================== */
.pa-impacts-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* ========================================
   单个毒气涟漪冲击波
   椭圆形从落点向外扩散，模拟透视效果
   GPU: 仅 transform: scale + opacity
   ======================================== */
.pa-impact-ripple {
  position: absolute;
  transform: translate(-50%, -50%) scale(0);
  border-radius: 50%;
  opacity: 0;
  animation: pa-impact-expand ease-out forwards;
  will-change: transform, opacity;
  /* 外环 - 剧毒绿色发光边框 */
  border: 2px solid rgba(124, 252, 0, 0.7);
  box-shadow:
    0 0 8px rgba(124, 252, 0, 0.5),
    0 0 16px rgba(0, 100, 0, 0.3),
    inset 0 0 6px rgba(124, 252, 0, 0.2);
  background: radial-gradient(
    ellipse at center,
    rgba(173, 255, 47, 0.15) 0%,
    rgba(124, 252, 0, 0.08) 40%,
    transparent 70%
  );
}

/* 冲击波中心毒光闪光点 */
.pa-impact-ripple::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(173, 255, 47, 0.9);
  box-shadow: 0 0 6px rgba(124, 252, 0, 0.8);
  animation: pa-impact-flash 0.3s ease-out forwards;
  animation-delay: inherit;
}

/* 冲击波内环 - 更快的第二层毒气波纹 */
.pa-impact-ripple::after {
  content: '';
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  border: 1px solid rgba(173, 255, 47, 0.4);
  animation: pa-impact-inner-ring ease-out forwards;
  animation-delay: inherit;
}

@keyframes pa-impact-expand {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 0.9;
  }
  40% {
    opacity: 0.6;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
  }
}

@keyframes pa-impact-flash {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.5);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }
}

@keyframes pa-impact-inner-ring {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  20% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: scale(1.8);
  }
}

/* ========================================
   全屏毒光闪烁 - 箭雨高潮时刻闪烁
   GPU: 仅 opacity + transform: scale
   ======================================== */
.pa-screen-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 30%,
    rgba(124, 252, 0, 0.25) 0%,
    rgba(0, 100, 0, 0.1) 40%,
    transparent 70%
  );
  animation: pa-screen-flash 2s ease-in-out forwards;
  will-change: opacity;
}

@keyframes pa-screen-flash {
  0% { opacity: 0; }
  30% { opacity: 0; }
  35% { opacity: 0.8; }
  40% { opacity: 0.3; }
  50% { opacity: 0.6; }
  55% { opacity: 0.2; }
  60% { opacity: 0.5; }
  65% { opacity: 0; }
  100% { opacity: 0; }
}

/* ========================================
   减少动画偏好 - 尊重用户设置
   ======================================== */
@media (prefers-reduced-motion: reduce) {
  .pa-arrow,
  .pa-impact-ripple,
  .pa-sky-dim,
  .pa-screen-flash {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
