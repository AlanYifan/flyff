<!--
  @file FireArrowEffect.vue
  @generated 2026-06-30
  @description 火焰箭矢技能特效动画组件：烈焰蓄力·火箭天降·烈焰爆裂
  技能描述：赋予箭矢火元素，灼烧周围敌人。
  火属性箭矢从天而降，落地产生烈焰冲击波与火星飞溅，显示2秒后自动移除
  GPU加速（translate3d + opacity），覆盖整个right-section怪物显示区域
-->
<template>
  <div v-if="isVisible" class="fire-arrow-container" :style="containerStyle">
    <!-- ========== 阶段一：烈焰蓄力（0s ~ 0.3s）—— 烈焰凝聚·火阵成型 ========== -->
    <!-- 烈焰暗幕：赤红覆盖，热浪逼人 -->
    <div class="fa-dim"></div>
    <!-- 烈焰法阵：地面旋转的火焰召唤阵 -->
    <div class="fa-flame-rune"></div>
    <!-- 烈能汇聚：四周火星被抽向中心 -->
    <div
      v-for="i in 10"
      :key="'fa-gather-' + i"
      class="fa-gather-particle"
      :style="getGatherStyle(i)"
    ></div>
    <!-- 蓄力火球：中心凝聚的火能量球 -->
    <div class="fa-charge-core"></div>

    <!-- ========== 阶段二：火箭天降（0.2s ~ 1.2s）—— 火属性箭矢从天而降·烈焰拖尾 ========== -->
    <!-- 火箭层：多支火属性箭矢从上方落下 -->
    <div class="fa-arrows-layer">
      <div
        v-for="arrow in arrows"
        :key="arrow.id"
        class="fa-arrow"
        :style="arrow.style"
      ></div>
    </div>
    <!-- 天降爆发闪光：火箭开始落下时的天空赤红爆闪 -->
    <div class="fa-sky-flash"></div>

    <!-- ========== 阶段三：烈焰爆裂（0.7s ~ 1.5s）—— 落地爆裂·火星飞溅·冲击波 ========== -->
    <!-- 落地烈焰冲击波层 -->
    <div class="fa-impacts-layer">
      <div
        v-for="impact in impacts"
        :key="impact.id"
        class="fa-impact-ripple"
        :style="impact.style"
      ></div>
    </div>
    <!-- 火星碎片飞溅 -->
    <div
      v-for="i in 14"
      :key="'fa-ember-' + i"
      class="fa-ember"
      :style="getEmberStyle(i)"
    ></div>
    <!-- 中央命中烈焰闪光 -->
    <div class="fa-impact-flash"></div>
  </div>
</template>

<script setup>
/**
 * 火焰箭矢技能特效动画组件
 * 技能描述：赋予箭矢火元素，灼烧周围敌人。
 *
 * 三阶段叙事动画（总时长2秒）：
 * 1. 烈焰蓄力（0s ~ 0.3s）：烈焰凝聚，火焰法阵旋转，火星粒子汇聚至中心
 * 2. 火箭天降（0.2s ~ 1.2s）：火属性箭矢从天而降，带烈焰拖尾，箭头朝下
 * 3. 烈焰爆裂（0.7s ~ 1.5s）：箭矢落地后烈焰爆裂飞溅，火焰冲击波扩散
 *
 * GPU加速：所有动画仅使用 translate3d + opacity + scale，避免重排，保证丝滑流畅
 * 特效范围覆盖整个right-section怪物显示区域（inset: 0）
 * 显示2秒后自动移除
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

/** 动画总持续时间（毫秒） */
const ANIMATION_DURATION_MS = 2000

/** 火箭数量 */
const ARROW_COUNT = 24

/** 落地冲击波数量 */
const IMPACT_COUNT = 14

/** 是否可见 */
const isVisible = ref(false)

/** 火箭数据列表 */
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
 * 生成烈能汇聚火星粒子的样式
 * 10颗火星从四周以不同角度和距离向中心螺旋汇聚
 * @param {number} index - 粒子索引（1-based）
 * @returns {Object} CSS样式对象，包含CSS自定义属性
 */
function getGatherStyle (index) {
  const angle = (index - 1) * 36 + (index % 2) * 8
  const distance = 110 + (index % 4) * 18
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.012
  return {
    '--fa-gather-angle': `${angle}deg`,
    '--fa-gather-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成火箭数据
 * 每支火属性箭矢从容器上方随机位置落下，带有不同的延迟和水平位置
 * 火箭使用纯CSS绘制：火焰箭头(::after) + 火焰箭杆(主体) + 拖尾(::before)
 * @returns {Array} 火箭配置数组
 */
function generateArrows () {
  const list = []
  for (let i = 0; i < ARROW_COUNT; i++) {
    const leftPos = rand(5, 95)
    const delay = rand(0, 0.7)
    const duration = rand(0.4, 0.7)
    const size = rand(44, 72)
    const rotate = rand(-4, 4)
    const opacity = rand(0.85, 1)

    list.push({
      id: `fa-arrow-${i}`,
      style: {
        left: `${leftPos}%`,
        top: `-${size + 40}px`,
        width: `${Math.max(3, size * 0.05)}px`,
        height: `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        '--fa-arrow-rotate': `${rotate}deg`,
        '--fa-arrow-opacity': opacity,
        willChange: 'transform, opacity'
      }
    })
  }
  return list
}

/**
 * 生成落地烈焰冲击波数据
 * 每个冲击波在火箭落地后从落点向外扩散，呈赤红涟漪
 * @returns {Array} 冲击波配置数组
 */
function generateImpacts () {
  const list = []
  for (let i = 0; i < IMPACT_COUNT; i++) {
    const leftPos = rand(8, 92)
    const bottomPos = rand(5, 50)
    const delay = rand(0.3, 1.0)
    const size = rand(28, 60)
    const duration = rand(0.5, 0.8)

    list.push({
      id: `fa-impact-${i}`,
      style: {
        left: `${leftPos}%`,
        top: `${100 - bottomPos}%`,
        width: `${size}px`,
        height: `${size * 0.5}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        willChange: 'transform, opacity'
      }
    })
  }
  return list
}

/**
 * 生成火星碎片飞溅的样式
 * 14颗火星从中心向各方向飞溅，配合旋转
 * @param {number} index - 碎片索引（1-based）
 * @returns {Object} CSS样式对象，包含CSS自定义属性
 */
function getEmberStyle (index) {
  const angle = (index - 1) * 25.7 + (index % 2) * 6
  const distance = 45 + (index % 5) * 18
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 10
  const size = 5 + (index % 4) * 4
  const rotate = index * 47
  const delay = (index % 3) * 0.02
  return {
    '--fa-ember-tx': `${tx}px`,
    '--fa-ember-ty': `${ty}px`,
    '--fa-ember-size': `${size}px`,
    '--fa-ember-rotate': `${rotate}deg`,
    animationDelay: `${delay}s`
  }
}

/**
 * 播放火焰箭矢特效动画
 * 生成火箭和冲击波数据，2秒后自动清理
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
/* ================================================================
   火焰箭矢特效容器 - 覆盖整个right-section区域
   使用 inset: 0 撑满父容器，pointer-events: none 不阻挡点击
   ================================================================ */
.fire-arrow-container {
  pointer-events: none;
  z-index: 60;
  overflow: hidden;
  border-radius: 10px;
}

/* ================================================================
   阶段一：烈焰蓄力（0s ~ 0.3s）—— 烈焰凝聚·火阵成型
   ================================================================ */

/* 烈焰暗幕 - 赤红覆盖，热浪逼人 */
.fa-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 30%,
    rgba(120, 20, 5, 0.5) 0%,
    rgba(90, 15, 5, 0.35) 50%,
    transparent 100%
  );
  animation: faDim 2s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes faDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  30% { opacity: 0.85; }
  70% { opacity: 0.35; }
  100% { opacity: 0; }
}

/* 烈焰法阵 - 地面旋转的火焰召唤阵，预示火箭降临
   父级负责入场缩放与淡出，::before 负责持续自转 */
.fa-flame-rune {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 240px;
  height: 240px;
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: faFlameRuneIn 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) forwards,
             faFlameRuneFade 0.6s ease-out 0.4s forwards;
  will-change: transform, opacity;
  z-index: 2;
}

.fa-flame-rune::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 100, 30, 0.3) 30deg,
    rgba(255, 180, 50, 0.5) 60deg,
    rgba(255, 100, 30, 0.3) 90deg,
    transparent 120deg,
    rgba(255, 100, 30, 0.3) 180deg,
    rgba(255, 180, 50, 0.5) 210deg,
    rgba(255, 100, 30, 0.3) 240deg,
    transparent 270deg,
    rgba(255, 100, 30, 0.3) 330deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 25%, black 45%, transparent 80%);
  mask: radial-gradient(circle, transparent 25%, black 45%, transparent 80%);
  box-shadow: 0 0 30px rgba(255, 120, 30, 0.25);
  will-change: transform;
  animation: faSpinCW 1s linear infinite;
}

@keyframes faSpinCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes faFlameRuneIn {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1.15); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1); opacity: 0.85; }
}

@keyframes faFlameRuneFade {
  0% { opacity: 0.85; }
  100% { opacity: 0; }
}

/* 烈能汇聚火星 - 从四周螺旋汇聚至中心 */
.fa-gather-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 250, 220, 0.95) 0%,
    rgba(255, 160, 40, 0.7) 50%,
    rgba(200, 60, 10, 0.3) 100%
  );
  box-shadow: 0 0 5px rgba(255, 140, 30, 0.6);
  opacity: 0;
  animation: faGather 0.35s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes faGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--fa-gather-angle, 0deg)) translateX(var(--fa-gather-distance, 110px)) scale(1);
    opacity: 0;
  }
  25% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--fa-gather-angle, 0deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* 蓄力火球 - 中心凝聚的火能量球，蓄满后爆发引动天降火箭 */
.fa-charge-core {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 240, 1) 0%,
    rgba(255, 200, 80, 0.9) 30%,
    rgba(255, 120, 30, 0.6) 60%,
    transparent 100%
  );
  box-shadow: 0 0 18px rgba(255, 150, 40, 0.7), 0 0 36px rgba(255, 100, 20, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: faChargeCore 0.35s ease-out forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes faChargeCore {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  40% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 1; }
  70% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2.5); opacity: 0; }
}

/* ================================================================
   阶段二：火箭天降（0.2s ~ 1.2s）—— 火属性箭矢从天而降·烈焰拖尾
   ================================================================ */

/* 火箭层 - 容纳所有从天而降的火箭 */
.fa-arrows-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 6;
}

/* 火箭本体 - 纯CSS绘制，火属性箭矢从上方落下
   结构：火焰箭头(::after) + 火焰箭杆(主体) + 拖尾(::before)
   箭头朝下，从容器顶部上方落下
   GPU: 仅 translateY + opacity */
.fa-arrow {
  position: absolute;
  /* 火焰箭杆：赤橙渐变 */
  background: linear-gradient(
    to right,
    rgba(200, 60, 20, 0.5) 0%,
    rgba(255, 120, 30, 0.9) 30%,
    rgba(255, 200, 80, 1) 50%,
    rgba(255, 120, 30, 0.9) 70%,
    rgba(200, 60, 20, 0.5) 100%
  );
  border-radius: 1px;
  opacity: 0;
  transform: rotate(var(--fa-arrow-rotate));
  animation: faArrowFall linear forwards;
  will-change: transform, opacity;
}

/* 火焰箭头 - 锐角火焰三角，位于箭杆底部（下落方向前端），箭头朝下 */
.fa-arrow::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 14px solid rgba(255, 220, 120, 0.95);
  filter: drop-shadow(0 0 4px rgba(255, 150, 40, 0.8))
          drop-shadow(0 1px 2px rgba(255, 255, 200, 0.6));
}

/* 烈焰拖尾 - 箭杆顶部（下落方向尾端）的火焰光轨 */
.fa-arrow::before {
  content: '';
  position: absolute;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 9px;
  background:
    linear-gradient(135deg, rgba(255, 120, 30, 0.6) 0%, transparent 50%),
    linear-gradient(225deg, rgba(255, 120, 30, 0.6) 0%, transparent 50%),
    linear-gradient(
      to bottom,
      rgba(200, 60, 10, 0.2) 0%,
      rgba(255, 140, 40, 0.45) 40%,
      rgba(200, 60, 10, 0.1) 100%
    );
  filter: drop-shadow(0 -2px 4px rgba(255, 100, 20, 0.5));
  clip-path: polygon(0% 100%, 50% 0%, 100% 100%);
}

@keyframes faArrowFall {
  0% {
    transform: translateY(0) rotate(var(--fa-arrow-rotate));
    opacity: 0;
  }
  8% {
    opacity: var(--fa-arrow-opacity, 0.85);
  }
  80% {
    opacity: var(--fa-arrow-opacity, 0.85);
  }
  100% {
    transform: translateY(calc(100vh + 100px)) rotate(var(--fa-arrow-rotate));
    opacity: 0;
  }
}

/* 天降爆发闪光 - 火箭开始落下时的天空赤红爆闪 */
.fa-sky-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 15%,
    rgba(255, 120, 40, 0.35) 0%,
    rgba(255, 80, 20, 0.12) 35%,
    transparent 65%
  );
  animation: faSkyFlash 1.5s ease-in-out forwards;
  will-change: opacity;
  z-index: 5;
}

@keyframes faSkyFlash {
  0% { opacity: 0; }
  8% { opacity: 0.8; }
  15% { opacity: 0.3; }
  25% { opacity: 0.6; }
  35% { opacity: 0.2; }
  50% { opacity: 0.4; }
  65% { opacity: 0; }
  100% { opacity: 0; }
}

/* ================================================================
   阶段三：烈焰爆裂（0.7s ~ 1.5s）—— 落地爆裂·火星飞溅·冲击波
   ================================================================ */

/* 落地烈焰冲击波层 - 容纳所有烈焰涟漪 */
.fa-impacts-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 7;
}

/* 单个烈焰冲击波 - 椭圆形从落点向外扩散，赤红涟漪
   GPU: 仅 transform: scale + opacity */
.fa-impact-ripple {
  position: absolute;
  transform: translate(-50%, -50%) scale(0);
  border-radius: 50%;
  opacity: 0;
  animation: faImpactExpand ease-out forwards;
  will-change: transform, opacity;
  /* 外环 - 赤红发光边框 */
  border: 2px solid rgba(255, 140, 40, 0.7);
  box-shadow:
    0 0 8px rgba(255, 100, 20, 0.5),
    0 0 16px rgba(255, 80, 10, 0.3),
    inset 0 0 6px rgba(255, 120, 30, 0.2);
  background: radial-gradient(
    ellipse at center,
    rgba(255, 150, 50, 0.15) 0%,
    rgba(255, 100, 20, 0.08) 40%,
    transparent 70%
  );
}

/* 冲击波中心火星闪光点 */
.fa-impact-ripple::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 240, 180, 0.9);
  box-shadow: 0 0 6px rgba(255, 160, 50, 0.8);
  animation: faImpactFlash 0.3s ease-out forwards;
  animation-delay: inherit;
}

/* 冲击波内环 - 更快的第二层烈焰波纹 */
.fa-impact-ripple::after {
  content: '';
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  border: 1px solid rgba(255, 160, 50, 0.4);
  animation: faImpactInnerRing ease-out forwards;
  animation-delay: inherit;
}

@keyframes faImpactExpand {
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

@keyframes faImpactFlash {
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

@keyframes faImpactInnerRing {
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

/* 火星碎片飞溅 - 从中心向各方向飞射，配合旋转 */
.fa-ember {
  position: absolute;
  top: 55%;
  left: 50%;
  width: var(--fa-ember-size, 8px);
  height: var(--fa-ember-size, 8px);
  border-radius: 40% 60% 50% 40% / 55% 40% 60% 45%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(255, 250, 220, 0.95) 0%,
    rgba(255, 160, 40, 0.75) 50%,
    rgba(200, 50, 10, 0.3) 100%
  );
  box-shadow: 0 0 5px rgba(255, 140, 30, 0.6);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  backface-visibility: hidden;
  animation: faEmberScatter 0.6s cubic-bezier(0.2, 0.5, 0.4, 1) 0.7s forwards;
  will-change: transform, opacity;
  z-index: 8;
}

@keyframes faEmberScatter {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; }
  100% {
    transform: translate3d(calc(-50% + var(--fa-ember-tx, 0px)), calc(-50% + var(--fa-ember-ty, 0px)), 0) scale(0.4) rotate(var(--fa-ember-rotate, 0deg));
    opacity: 0;
  }
}

/* 中央命中烈焰闪光 - 火箭命中瞬间的赤红白光爆闪 */
.fa-impact-flash {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 240, 1) 0%,
    rgba(255, 220, 120, 0.85) 30%,
    rgba(255, 120, 30, 0.4) 65%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: faImpactFlash 0.4s ease-out 0.7s forwards;
  will-change: transform, opacity;
  z-index: 9;
}

@keyframes faImpactFlash {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) scale(4); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(8); opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .fa-dim,
  .fa-flame-rune,
  .fa-gather-particle,
  .fa-charge-core,
  .fa-arrow,
  .fa-sky-flash,
  .fa-impact-ripple,
  .fa-ember,
  .fa-impact-flash {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
