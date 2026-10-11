<!--
  @file IceArrowEffect.vue
  @generated 2026-06-30
  @description 冰箭技能特效动画组件：冰寒蓄力·冰箭天降·冰冻爆裂
  技能描述：爆发性地射出具有冻结周围对象效果的箭，给予伤害的同时牵制对方移动。
  冰属性箭矢从天而降，落地产生冰冻冲击波，显示2秒后自动移除
  GPU加速（translate3d + opacity），覆盖整个right-section怪物显示区域
-->
<template>
  <div v-if="isVisible" class="ice-arrow-container" :style="containerStyle">
    <!-- ========== 阶段一：冰寒蓄力（0s ~ 0.3s）—— 寒气凝聚·法阵成型 ========== -->
    <!-- 冰寒暗幕：冰蓝覆盖，寒气逼人 -->
    <div class="ia-dim"></div>
    <!-- 冰霜法阵：地面旋转的冰霜召唤阵 -->
    <div class="ia-frost-rune"></div>
    <!-- 寒能汇聚：四周冰晶被抽向中心 -->
    <div
      v-for="i in 10"
      :key="'ia-gather-' + i"
      class="ia-gather-particle"
      :style="getGatherStyle(i)"
    ></div>
    <!-- 蓄力冰球：中心凝聚的冰能量球 -->
    <div class="ia-charge-core"></div>

    <!-- ========== 阶段二：冰箭天降（0.2s ~ 1.2s）—— 冰属性箭矢从天而降·冰晶拖尾 ========== -->
    <!-- 冰箭层：多支冰属性箭矢从上方落下 -->
    <div class="ia-arrows-layer">
      <div
        v-for="arrow in arrows"
        :key="arrow.id"
        class="ia-arrow"
        :style="arrow.style"
      ></div>
    </div>
    <!-- 天降爆发闪光：冰箭开始落下时的天空冰蓝爆闪 -->
    <div class="ia-sky-flash"></div>

    <!-- ========== 阶段三：冰冻爆裂（0.7s ~ 1.5s）—— 落地碎裂·冰晶飞溅·冲击波 ========== -->
    <!-- 落地冰冻冲击波层 -->
    <div class="ia-impacts-layer">
      <div
        v-for="impact in impacts"
        :key="impact.id"
        class="ia-impact-ripple"
        :style="impact.style"
      ></div>
    </div>
    <!-- 冰晶碎片飞溅 -->
    <div
      v-for="i in 14"
      :key="'ia-shard-' + i"
      class="ia-shard"
      :style="getShardStyle(i)"
    ></div>
    <!-- 中央命中冰爆闪光 -->
    <div class="ia-impact-flash"></div>
  </div>
</template>

<script setup>
/**
 * 冰箭技能特效动画组件
 * 技能描述：爆发性地射出具有冻结周围对象效果的箭，给予伤害的同时牵制对方移动。
 *
 * 三阶段叙事动画（总时长2秒）：
 * 1. 冰寒蓄力（0s ~ 0.3s）：寒气凝聚，冰霜法阵旋转，冰晶粒子汇聚至中心
 * 2. 冰箭天降（0.2s ~ 1.2s）：冰属性箭矢从天而降，带冰晶拖尾，箭头朝下
 * 3. 冰冻爆裂（0.7s ~ 1.5s）：箭矢落地后冰晶碎裂飞溅，冰冻冲击波扩散
 *
 * GPU加速：所有动画仅使用 translate3d + opacity + scale，避免重排，保证丝滑流畅
 * 特效范围覆盖整个right-section怪物显示区域（inset: 0）
 * 显示2秒后自动移除
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

/** 动画总持续时间（毫秒） */
const ANIMATION_DURATION_MS = 2000

/** 冰箭数量 */
const ARROW_COUNT = 24

/** 落地冲击波数量 */
const IMPACT_COUNT = 14

/** 是否可见 */
const isVisible = ref(false)

/** 冰箭数据列表 */
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
 * 生成寒能汇聚冰晶粒子的样式
 * 10颗冰晶从四周以不同角度和距离向中心螺旋汇聚
 * @param {number} index - 粒子索引（1-based）
 * @returns {Object} CSS样式对象，包含CSS自定义属性
 */
function getGatherStyle (index) {
  const angle = (index - 1) * 36 + (index % 2) * 8
  const distance = 110 + (index % 4) * 18
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.012
  return {
    '--ia-gather-angle': `${angle}deg`,
    '--ia-gather-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成冰箭数据
 * 每支冰属性箭矢从容器上方随机位置落下，带有不同的延迟和水平位置
 * 冰箭使用纯CSS绘制：冰晶箭头(::after) + 冰晶箭杆(主体) + 拖尾(::before)
 * @returns {Array} 冰箭配置数组
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
      id: `ia-arrow-${i}`,
      style: {
        left: `${leftPos}%`,
        top: `-${size + 40}px`,
        width: `${Math.max(3, size * 0.05)}px`,
        height: `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        '--ia-arrow-rotate': `${rotate}deg`,
        '--ia-arrow-opacity': opacity,
        willChange: 'transform, opacity'
      }
    })
  }
  return list
}

/**
 * 生成落地冰冻冲击波数据
 * 每个冲击波在冰箭落地后从落点向外扩散，呈冰蓝色涟漪
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
      id: `ia-impact-${i}`,
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
 * 生成冰晶碎片飞溅的样式
 * 14块冰晶从中心向各方向飞溅，配合旋转
 * @param {number} index - 碎片索引（1-based）
 * @returns {Object} CSS样式对象，包含CSS自定义属性
 */
function getShardStyle (index) {
  const angle = (index - 1) * 25.7 + (index % 2) * 6
  const distance = 45 + (index % 5) * 18
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 10
  const size = 5 + (index % 4) * 4
  const rotate = index * 47
  const delay = (index % 3) * 0.02
  return {
    '--ia-shard-tx': `${tx}px`,
    '--ia-shard-ty': `${ty}px`,
    '--ia-shard-size': `${size}px`,
    '--ia-shard-rotate': `${rotate}deg`,
    animationDelay: `${delay}s`
  }
}

/**
 * 播放冰箭特效动画
 * 生成冰箭和冲击波数据，2秒后自动清理
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
   冰箭特效容器 - 覆盖整个right-section区域
   使用 inset: 0 撑满父容器，pointer-events: none 不阻挡点击
   ================================================================ */
.ice-arrow-container {
  pointer-events: none;
  z-index: 60;
  overflow: hidden;
  border-radius: 10px;
}

/* ================================================================
   阶段一：冰寒蓄力（0s ~ 0.3s）—— 寒气凝聚·法阵成型
   ================================================================ */

/* 冰寒暗幕 - 冰蓝覆盖，寒气逼人 */
.ia-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 30%,
    rgba(10, 50, 100, 0.5) 0%,
    rgba(5, 30, 70, 0.35) 50%,
    transparent 100%
  );
  animation: iaDim 2s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes iaDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  30% { opacity: 0.85; }
  70% { opacity: 0.35; }
  100% { opacity: 0; }
}

/* 冰霜法阵 - 地面旋转的冰霜召唤阵，预示冰箭降临
   父级负责入场缩放与淡出，::before 负责持续自转 */
.ia-frost-rune {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 240px;
  height: 240px;
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: iaFrostRuneIn 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) forwards,
             iaFrostRuneFade 0.6s ease-out 0.4s forwards;
  will-change: transform, opacity;
  z-index: 2;
}

.ia-frost-rune::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(120, 220, 255, 0.3) 30deg,
    rgba(180, 240, 255, 0.5) 60deg,
    rgba(120, 220, 255, 0.3) 90deg,
    transparent 120deg,
    rgba(120, 220, 255, 0.3) 180deg,
    rgba(180, 240, 255, 0.5) 210deg,
    rgba(120, 220, 255, 0.3) 240deg,
    transparent 270deg,
    rgba(120, 220, 255, 0.3) 330deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 25%, black 45%, transparent 80%);
  mask: radial-gradient(circle, transparent 25%, black 45%, transparent 80%);
  box-shadow: 0 0 30px rgba(100, 200, 255, 0.25);
  will-change: transform;
  animation: iaSpinCW 1s linear infinite;
}

@keyframes iaSpinCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes iaFrostRuneIn {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1.15); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1); opacity: 0.85; }
}

@keyframes iaFrostRuneFade {
  0% { opacity: 0.85; }
  100% { opacity: 0; }
}

/* 寒能汇聚冰晶 - 从四周螺旋汇聚至中心 */
.ia-gather-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(230, 250, 255, 0.95) 0%,
    rgba(120, 210, 255, 0.7) 50%,
    rgba(40, 130, 220, 0.3) 100%
  );
  box-shadow: 0 0 5px rgba(120, 210, 255, 0.6);
  opacity: 0;
  animation: iaGather 0.35s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes iaGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--ia-gather-angle, 0deg)) translateX(var(--ia-gather-distance, 110px)) scale(1);
    opacity: 0;
  }
  25% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--ia-gather-angle, 0deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* 蓄力冰球 - 中心凝聚的冰能量球，蓄满后爆发引动天降冰箭 */
.ia-charge-core {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(200, 240, 255, 0.9) 30%,
    rgba(120, 210, 255, 0.6) 60%,
    transparent 100%
  );
  box-shadow: 0 0 18px rgba(150, 220, 255, 0.7), 0 0 36px rgba(100, 200, 255, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: iaChargeCore 0.35s ease-out forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes iaChargeCore {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  40% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 1; }
  70% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2.5); opacity: 0; }
}

/* ================================================================
   阶段二：冰箭天降（0.2s ~ 1.2s）—— 冰属性箭矢从天而降·冰晶拖尾
   ================================================================ */

/* 冰箭层 - 容纳所有从天而降的冰箭 */
.ia-arrows-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 6;
}

/* 冰箭本体 - 纯CSS绘制，冰属性箭矢从上方落下
   结构：冰晶箭头(::after) + 冰晶箭杆(主体) + 拖尾(::before)
   箭头朝下，从容器顶部上方落下
   GPU: 仅 translateY + opacity */
.ia-arrow {
  position: absolute;
  /* 冰晶箭杆：冰蓝渐变 */
  background: linear-gradient(
    to right,
    rgba(100, 180, 240, 0.5) 0%,
    rgba(160, 220, 255, 0.9) 30%,
    rgba(210, 245, 255, 1) 50%,
    rgba(160, 220, 255, 0.9) 70%,
    rgba(100, 180, 240, 0.5) 100%
  );
  border-radius: 1px;
  opacity: 0;
  transform: rotate(var(--ia-arrow-rotate));
  animation: iaArrowFall linear forwards;
  will-change: transform, opacity;
}

/* 冰晶箭头 - 锐角冰晶三角，位于箭杆底部（下落方向前端），箭头朝下 */
.ia-arrow::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 14px solid rgba(220, 245, 255, 0.95);
  filter: drop-shadow(0 0 4px rgba(120, 210, 255, 0.8))
          drop-shadow(0 1px 2px rgba(255, 255, 255, 0.6));
}

/* 冰晶拖尾 - 箭杆顶部（下落方向尾端）的冰晶光轨 */
.ia-arrow::before {
  content: '';
  position: absolute;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 9px;
  background:
    linear-gradient(135deg, rgba(120, 200, 255, 0.6) 0%, transparent 50%),
    linear-gradient(225deg, rgba(120, 200, 255, 0.6) 0%, transparent 50%),
    linear-gradient(
      to bottom,
      rgba(100, 180, 255, 0.2) 0%,
      rgba(150, 220, 255, 0.45) 40%,
      rgba(100, 180, 255, 0.1) 100%
    );
  filter: drop-shadow(0 -2px 4px rgba(100, 200, 255, 0.5));
  clip-path: polygon(0% 100%, 50% 0%, 100% 100%);
}

@keyframes iaArrowFall {
  0% {
    transform: translateY(0) rotate(var(--ia-arrow-rotate));
    opacity: 0;
  }
  8% {
    opacity: var(--ia-arrow-opacity, 0.85);
  }
  80% {
    opacity: var(--ia-arrow-opacity, 0.85);
  }
  100% {
    transform: translateY(calc(100vh + 100px)) rotate(var(--ia-arrow-rotate));
    opacity: 0;
  }
}

/* 天降爆发闪光 - 冰箭开始落下时的天空冰蓝爆闪 */
.ia-sky-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 15%,
    rgba(150, 220, 255, 0.35) 0%,
    rgba(100, 180, 255, 0.12) 35%,
    transparent 65%
  );
  animation: iaSkyFlash 1.5s ease-in-out forwards;
  will-change: opacity;
  z-index: 5;
}

@keyframes iaSkyFlash {
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
   阶段三：冰冻爆裂（0.7s ~ 1.5s）—— 落地碎裂·冰晶飞溅·冲击波
   ================================================================ */

/* 落地冰冻冲击波层 - 容纳所有冰冻涟漪 */
.ia-impacts-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 7;
}

/* 单个冰冻冲击波 - 椭圆形从落点向外扩散，冰蓝色涟漪
   GPU: 仅 transform: scale + opacity */
.ia-impact-ripple {
  position: absolute;
  transform: translate(-50%, -50%) scale(0);
  border-radius: 50%;
  opacity: 0;
  animation: iaImpactExpand ease-out forwards;
  will-change: transform, opacity;
  /* 外环 - 冰蓝发光边框 */
  border: 2px solid rgba(120, 210, 255, 0.7);
  box-shadow:
    0 0 8px rgba(80, 180, 255, 0.5),
    0 0 16px rgba(60, 150, 255, 0.3),
    inset 0 0 6px rgba(100, 190, 255, 0.2);
  background: radial-gradient(
    ellipse at center,
    rgba(150, 220, 255, 0.15) 0%,
    rgba(100, 180, 255, 0.08) 40%,
    transparent 70%
  );
}

/* 冲击波中心冰晶闪光点 */
.ia-impact-ripple::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(220, 245, 255, 0.9);
  box-shadow: 0 0 6px rgba(150, 220, 255, 0.8);
  animation: iaImpactFlash 0.3s ease-out forwards;
  animation-delay: inherit;
}

/* 冲击波内环 - 更快的第二层冰冻波纹 */
.ia-impact-ripple::after {
  content: '';
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  border: 1px solid rgba(150, 220, 255, 0.4);
  animation: iaImpactInnerRing ease-out forwards;
  animation-delay: inherit;
}

@keyframes iaImpactExpand {
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

@keyframes iaImpactFlash {
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

@keyframes iaImpactInnerRing {
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

/* 冰晶碎片飞溅 - 从中心向各方向飞射，配合旋转 */
.ia-shard {
  position: absolute;
  top: 55%;
  left: 50%;
  width: var(--ia-shard-size, 8px);
  height: var(--ia-shard-size, 8px);
  border-radius: 40% 60% 50% 40% / 55% 40% 60% 45%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(240, 252, 255, 0.95) 0%,
    rgba(150, 215, 255, 0.75) 50%,
    rgba(40, 120, 200, 0.3) 100%
  );
  box-shadow: 0 0 5px rgba(120, 210, 255, 0.6);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  backface-visibility: hidden;
  animation: iaShardScatter 0.6s cubic-bezier(0.2, 0.5, 0.4, 1) 0.7s forwards;
  will-change: transform, opacity;
  z-index: 8;
}

@keyframes iaShardScatter {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; }
  100% {
    transform: translate3d(calc(-50% + var(--ia-shard-tx, 0px)), calc(-50% + var(--ia-shard-ty, 0px)), 0) scale(0.4) rotate(var(--ia-shard-rotate, 0deg));
    opacity: 0;
  }
}

/* 中央命中冰爆闪光 - 冰箭命中瞬间的冰蓝白光爆闪 */
.ia-impact-flash {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(220, 245, 255, 0.85) 30%,
    rgba(120, 210, 255, 0.4) 65%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: iaImpactFlash 0.4s ease-out 0.7s forwards;
  will-change: transform, opacity;
  z-index: 9;
}

@keyframes iaImpactFlash {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) scale(4); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(8); opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .ia-dim,
  .ia-frost-rune,
  .ia-gather-particle,
  .ia-charge-core,
  .ia-arrow,
  .ia-sky-flash,
  .ia-impact-ripple,
  .ia-shard,
  .ia-impact-flash {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
