<!--
  @file StormArrowEffect.vue
  @generated 2026-07-18
  @description 暴风箭矢技能特效动画组件（GPU加速CSS动画版·炫彩重构版）
  爆裂射手U技能 - AOE风系群体攻击

  技能叙事：向天空聚集七彩风暴之力 → 汇聚成巨大彩虹箭矢 → 射向敌人后发生炫彩爆炸

  三阶段动画（总时长2.2秒）：
  1. 七彩汇聚（0s ~ 0.7s）：多彩风暴之力从四周螺旋上升汇聚至天空中心，三层能量法阵旋转蓄能，符文环环绕
  2. 彩虹坠击（0.6s ~ 1.3s）：巨大七彩风暴箭矢从天而降破空射落，伴随闪电链与空气扭曲波
  3. 爆裂风暴（1.2s ~ 2.2s）：箭矢命中爆炸，五层多彩冲击波径向扩散，彩色碎片飞散，能量余波涟漪，终结炫彩闪光

  GPU加速优化：
  - 纯CSS @keyframes 驱动，零JS逐帧计算
  - 仅使用 transform（translate3d/scale/rotate）+ opacity，避免Layout/Paint
  - will-change 提前创建合成层，backface-visibility:hidden 消除闪烁
  - mix-blend-mode: screen 实现光效加法混合
  - 特效覆盖整个right-section怪物显示区域（inset: 0），范围较原版增大50%

  炫彩重构要点：
  - 多彩配色：青绿/翠绿/天蓝/靛蓝/紫罗兰/金色/白色七色混合
  - 增加闪电链、能量符文环、聚能光柱、空气扭曲波、色彩光环、能量余波等新视觉层
  - 屏幕震动效果增强冲击感
  - 粒子数量提升（风力线12条、碎片24个、风刃12道、冲击波5层）
-->

<template>
  <div v-if="isVisible" class="sa-container" :style="containerStyle">
    <!-- ========== 阶段一：七彩汇聚（0s ~ 0.7s）—— 螺旋上升·三层法阵·符文环绕·聚能光柱 ========== -->
    <!-- 多彩风暴暗幕：青绿到蓝紫的多色覆盖，营造七彩风暴降临氛围 -->
    <div class="sa-dim"></div>
    <!-- 三层能量法阵：旋转的多彩风系蓄能阵（外/中/内） -->
    <div class="sa-wind-rune sa-wind-rune-outer"></div>
    <div class="sa-wind-rune sa-wind-rune-mid"></div>
    <div class="sa-wind-rune sa-wind-rune-inner"></div>
    <!-- 能量符文环：围绕法阵旋转的符文光点（新增） -->
    <div class="sa-rune-ring"></div>
    <!-- 天空汇聚核心：多彩风暴之力向天空中心汇聚的能量核 -->
    <div class="sa-gather-core"></div>
    <!-- 聚能光柱：从地面到天空的垂直能量光柱（新增） -->
    <div class="sa-charge-pillar"></div>
    <!-- 螺旋上升的多彩风力线：从四周向天空中心螺旋汇聚 -->
    <div
      v-for="stream in windStreams"
      :key="stream.id"
      class="sa-wind-stream"
      :style="stream.style"
    ></div>

    <!-- ========== 阶段二：彩虹坠击（0.6s ~ 1.3s）—— 巨矢破空·闪电链·空气扭曲·风压撕裂 ========== -->
    <!-- 巨大七彩风暴箭矢：从天而降的巨大彩虹风暴箭矢 -->
    <div class="sa-giant-arrow">
      <div class="sa-arrow-body"></div>
      <div class="sa-arrow-head"></div>
      <div class="sa-arrow-trail"></div>
      <div class="sa-arrow-glow"></div>
    </div>
    <!-- 闪电链：箭矢周围的分叉闪电（新增） -->
    <div
      v-for="bolt in lightnings"
      :key="bolt.id"
      class="sa-lightning"
      :style="bolt.style"
    ></div>
    <!-- 空气扭曲波：箭矢下坠产生的扭曲波纹（新增） -->
    <div class="sa-distort-wave"></div>
    <!-- 箭矢破空风压线：箭矢下坠时两侧的风压撕裂线 -->
    <div class="sa-air-pressure sa-air-pressure-left"></div>
    <div class="sa-air-pressure sa-air-pressure-right"></div>
    <!-- 箭矢下坠光柱：伴随箭矢的垂直多彩光柱 -->
    <div class="sa-descent-pillar"></div>

    <!-- ========== 阶段三：爆裂风暴（1.2s ~ 2.2s）—— 爆炸冲击·五层冲击波·彩色碎片·能量余波·终结闪光 ========== -->
    <!-- 爆炸核心：箭矢命中点的多彩能量爆发 -->
    <div class="sa-explosion-core"></div>
    <!-- 二次爆炸核心：增加爆炸层次感（新增） -->
    <div class="sa-explosion-core-2"></div>
    <!-- 多层多彩冲击波：径向扩散的冲击波环 -->
    <div
      v-for="wave in shockWaves"
      :key="wave.id"
      class="sa-shock-wave"
      :class="wave.className"
    ></div>
    <!-- 色彩光环：扩散的彩色光环（新增） -->
    <div class="sa-color-aura"></div>
    <!-- 能量余波：爆炸后的余波涟漪（新增） -->
    <div class="sa-energy-aftermath"></div>
    <!-- 风暴碎片：爆炸后飞散的多彩碎片粒子 -->
    <div
      v-for="i in SHARD_COUNT"
      :key="'sa-shard-' + i"
      class="sa-storm-shard"
      :style="getShardStyle(i)"
    ></div>
    <!-- 风刃旋风：爆炸后围绕中心旋转的多彩风刃 -->
    <div
      v-for="blade in explosionBlades"
      :key="blade.id"
      class="sa-explosion-blade"
      :style="blade.style"
    ></div>
    <!-- 终结闪光：全屏终结多彩闪光 -->
    <div class="sa-final-flash"></div>
  </div>
</template>

<script setup>
/**
 * 暴风箭矢技能特效动画组件（炫彩重构版）
 * 爆裂射手U技能 - AOE风系群体攻击
 *
 * 三阶段叙事动画（总时长2.2秒）：
 * 1. 七彩汇聚（0s ~ 0.7s）：多彩风暴之力从四周螺旋上升汇聚至天空中心，三层能量法阵旋转蓄能，符文环环绕
 * 2. 彩虹坠击（0.6s ~ 1.3s）：巨大七彩风暴箭矢从天而降破空射落，伴随闪电链与空气扭曲波
 * 3. 爆裂风暴（1.2s ~ 2.2s）：箭矢命中爆炸，五层多彩冲击波径向扩散，彩色碎片飞散，能量余波涟漪，终结炫彩闪光
 *
 * GPU加速：所有动画仅使用 transform（translate3d/scale/rotate）+ opacity，避免重排，保证丝滑流畅
 * 特效范围覆盖整个right-section怪物显示区域（inset: 0），范围较原版增大50%
 * 显示2.2秒后自动移除
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

/** 动画总持续时间（毫秒） - 较原版1.8s延长至2.2s以充分展示炫彩效果 */
const ANIMATION_DURATION_MS = 2200

/** 清理缓冲时间（毫秒） */
const CLEANUP_BUFFER_MS = 150

/** 螺旋风力线数量（较原版10条增至12条） */
const WIND_STREAM_COUNT = 12

/** 爆炸风刃数量（较原版8道增至12道） */
const EXPLOSION_BLADE_COUNT = 12

/** 闪电链数量（新增） */
const LIGHTNING_COUNT = 6

/** 风暴碎片数量（较原版18个增至24个） */
const SHARD_COUNT = 24

/** 冲击波层数（较原版3层增至5层） */
const SHOCK_WAVE_COUNT = 5

/** 是否可见 */
const isVisible = ref(false)

/** 螺旋风力线数据列表 */
const windStreams = ref([])

/** 冲击波数据列表 */
const shockWaves = ref([])

/** 爆炸风刃数据列表 */
const explosionBlades = ref([])

/** 闪电链数据列表 */
const lightnings = ref([])

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
 * 七彩配色数组 - 青绿/翠绿/天蓝/靛蓝/紫罗兰/金色/白色
 * 用于风力线、风刃、碎片的随机配色
 */
const PRISMATIC_COLORS = [
  'rgba(127, 255, 212, 0.9)',   // 青绿 aquamarine
  'rgba(0, 229, 204, 0.85)',    // 翠绿
  'rgba(100, 200, 255, 0.9)',   // 天蓝
  'rgba(120, 160, 255, 0.85)',  // 靛蓝
  'rgba(180, 130, 255, 0.9)',   // 紫罗兰
  'rgba(255, 220, 100, 0.9)',   // 金色
  'rgba(255, 255, 255, 0.95)'   // 白色高光
]

/**
 * 获取随机七彩色
 * @param {number} index - 索引（用于稳定配色）
 * @returns {string} CSS颜色值
 */
const getPrismaticColor = (index) => PRISMATIC_COLORS[index % PRISMATIC_COLORS.length]

/**
 * 生成螺旋上升的多彩风力线数据
 * 12条风力线从四周不同角度螺旋上升汇聚至天空中心
 * 每条线有不同的初始角度、起始距离、延迟、持续时间和七彩配色
 * 范围较原版增大50%（起始距离180~270px）
 * @returns {Array} 风力线配置数组
 */
function generateWindStreams () {
  const list = []
  for (let i = 0; i < WIND_STREAM_COUNT; i++) {
    // 初始角度：均匀分布 + 随机偏移
    const angle = (i / WIND_STREAM_COUNT) * 360 + rand(-15, 15)
    // 起始距离：180px ~ 270px（原120~180增大50%）
    const startDistance = rand(180, 270)
    // 动画延迟：0s ~ 0.18s（错开起始时间）
    const delay = rand(0, 0.18)
    // 持续时间：0.4s ~ 0.55s
    const duration = rand(0.4, 0.55)
    // 风力线尺寸（增大50%）
    const width = rand(45, 75)
    const height = rand(4, 8)
    // 七彩配色
    const color = getPrismaticColor(i)

    list.push({
      id: `sa-stream-${i}`,
      style: {
        '--sa-stream-angle': `${angle}deg`,
        '--sa-stream-distance': `${startDistance}px`,
        '--sa-stream-color': color,
        width: `${width}px`,
        height: `${height}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        willChange: 'transform, opacity'
      }
    })
  }
  return list
}

/**
 * 生成五层多彩冲击波数据
 * 5层不同颜色的径向冲击波在爆炸时依次扩散（原3层增至5层）
 * @returns {Array} 冲击波配置数组
 */
function generateShockWaves () {
  const waves = []
  for (let i = 0; i < SHOCK_WAVE_COUNT; i++) {
    waves.push({
      id: `sa-wave-${i + 1}`,
      className: `sa-wave-${i + 1}`
    })
  }
  return waves
}

/**
 * 生成爆炸多彩风刃数据
 * 12道风刃在爆炸后围绕中心旋转飞散（原8道增至12道）
 * 范围较原版增大50%（飞散距离150~225px）
 * @returns {Array} 风刃配置数组
 */
function generateExplosionBlades () {
  const list = []
  for (let i = 0; i < EXPLOSION_BLADE_COUNT; i++) {
    // 初始角度：均匀分布
    const angle = (i / EXPLOSION_BLADE_COUNT) * 360
    // 飞散距离：150px ~ 225px（原100~150增大50%）
    const distance = rand(150, 225)
    // 延迟：1.25s ~ 1.4s（爆炸后开始飞散）
    const delay = rand(1.25, 1.4)
    // 持续时间：0.55s ~ 0.8s
    const duration = rand(0.55, 0.8)
    // 风刃尺寸（增大50%）
    const width = rand(42, 63)
    const height = rand(12, 21)
    // 七彩配色
    const color = getPrismaticColor(i + 2)

    list.push({
      id: `sa-blade-${i}`,
      style: {
        '--sa-blade-angle': `${angle}deg`,
        '--sa-blade-distance': `${distance}px`,
        '--sa-blade-color': color,
        width: `${width}px`,
        height: `${height}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        willChange: 'transform, opacity'
      }
    })
  }
  return list
}

/**
 * 生成闪电链数据（新增）
 * 6道分叉闪电围绕箭矢下坠路径闪现
 * @returns {Array} 闪电配置数组
 */
function generateLightnings () {
  const list = []
  for (let i = 0; i < LIGHTNING_COUNT; i++) {
    // 闪电位置：左右两侧分布
    const side = i % 2 === 0 ? -1 : 1
    // 水平偏移：40px ~ 90px
    const offsetX = rand(40, 90) * side
    // 垂直起始位置：10% ~ 40%
    const top = rand(10, 40)
    // 闪电尺寸（增大50%）
    const width = rand(3, 6)
    const height = rand(90, 150)
    // 延迟：0.7s ~ 1.1s（箭矢下坠期间闪现）
    const delay = rand(0.7, 1.1)
    // 持续时间：0.15s ~ 0.3s（快速闪现）
    const duration = rand(0.15, 0.3)
    // 随机倾斜角度
    const skew = rand(-15, 15)

    list.push({
      id: `sa-lightning-${i}`,
      style: {
        '--sa-lightning-offset': `${offsetX}px`,
        '--sa-lightning-top': `${top}%`,
        '--sa-lightning-skew': `${skew}deg`,
        width: `${width}px`,
        height: `${height}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        willChange: 'transform, opacity'
      }
    })
  }
  return list
}

/**
 * 生成爆炸后飞散的多彩风暴碎片粒子样式
 * 24个碎片从爆炸中心以不同角度、速度和七彩配色向外飞散（原18个增至24个）
 * 范围较原版增大50%（飞散距离120~240px）
 * @param {number} index - 粒子索引（1-based）
 * @returns {Object} CSS样式对象，包含CSS自定义属性
 */
function getShardStyle (index) {
  const angle = (index - 1) * 15 + rand(-8, 8)
  // 飞散距离：120px ~ 240px（原80~160增大50%）
  const distance = rand(120, 240)
  // 碎片尺寸（增大50%）
  const size = rand(6, 15)
  const delay = rand(1.2, 1.45)
  const duration = rand(0.6, 0.9)
  // 七彩配色
  const color = getPrismaticColor(index + 3)
  return {
    '--sa-shard-angle': `${angle}deg`,
    '--sa-shard-distance': `${distance}px`,
    '--sa-shard-color': color,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

onMounted(async () => {
  // 生成粒子数据
  windStreams.value = generateWindStreams()
  shockWaves.value = generateShockWaves()
  explosionBlades.value = generateExplosionBlades()
  lightnings.value = generateLightnings()

  // 等待下一帧确保DOM挂载完成，再触发CSS动画
  await nextTick()
  isVisible.value = true

  // 动画结束后自动清理
  cleanupTimer = setTimeout(() => {
    isVisible.value = false
  }, ANIMATION_DURATION_MS + CLEANUP_BUFFER_MS)
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
   容器基础样式 - 覆盖整个right-section，允许溢出，pointer-events:none
   包含屏幕震动动画增强冲击感
   ================================================================ */
.sa-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 50;
  /* 建立合成层根，子元素动画独立合成 */
  contain: layout style paint;
  backface-visibility: hidden;
  /* 屏幕震动：增强爆炸冲击感（0.9s后开始，模拟箭矢命中震动） */
  animation: saScreenShake 0.4s ease-out;
  animation-delay: 1.15s;
}

@keyframes saScreenShake {
  0%, 100% { transform: translate3d(0, 0, 0); }
  15% { transform: translate3d(-3px, 2px, 0); }
  30% { transform: translate3d(3px, -2px, 0); }
  45% { transform: translate3d(-2px, -2px, 0); }
  60% { transform: translate3d(2px, 2px, 0); }
  75% { transform: translate3d(-1px, 1px, 0); }
}

/* ================================================================
   阶段一：七彩汇聚（0s ~ 0.7s）—— 螺旋上升·三层法阵·符文环绕·聚能光柱
   ================================================================ */

/* 多彩风暴暗幕 - 青绿到蓝紫的多色覆盖，营造七彩风暴降临氛围
   GPU: 仅 opacity 过渡 */
.sa-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(20, 70, 60, 0.45) 0%,
    rgba(15, 50, 80, 0.32) 30%,
    rgba(25, 35, 90, 0.22) 55%,
    rgba(10, 25, 20, 0.12) 80%,
    transparent 100%
  );
  animation: saDimFade 2.2s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes saDimFade {
  0% { opacity: 0; }
  10% { opacity: 1; }
  55% { opacity: 0.85; }
  80% { opacity: 0.5; }
  100% { opacity: 0; }
}

/* 三层能量法阵 - 旋转的多彩风系蓄能阵（外/中/内）
   多层conic-gradient构成七彩法阵纹理，整体旋转
   范围增大50%：外层450px（原300px） */
.sa-wind-rune {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  will-change: transform, opacity;
  z-index: 2;
  opacity: 0;
}

/* 外层法阵 - 450px（原300px增大50%） */
.sa-wind-rune-outer {
  width: 450px;
  height: 450px;
  transform: translate3d(-50%, -50%, 0);
  background:
    conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(127, 255, 212, 0.55) 25deg,
      transparent 55deg,
      rgba(100, 200, 255, 0.45) 100deg,
      transparent 140deg,
      rgba(180, 130, 255, 0.5) 200deg,
      transparent 235deg,
      rgba(255, 220, 100, 0.4) 290deg,
      transparent 325deg
    );
  -webkit-mask: radial-gradient(circle, transparent 33%, #000 36%, #000 92%, transparent 96%);
  mask: radial-gradient(circle, transparent 33%, #000 36%, #000 92%, transparent 96%);
  animation: saRuneRotate 1.4s linear forwards;
  filter: drop-shadow(0 0 12px rgba(127, 255, 212, 0.5));
}

/* 中层法阵 - 300px（原200px增大50%） */
.sa-wind-rune-mid {
  width: 300px;
  height: 300px;
  transform: translate3d(-50%, -50%, 0);
  background:
    conic-gradient(
      from 45deg,
      transparent 0deg,
      rgba(170, 255, 238, 0.5) 40deg,
      transparent 85deg,
      rgba(120, 180, 255, 0.45) 180deg,
      transparent 225deg,
      rgba(200, 150, 255, 0.5) 310deg,
      transparent 355deg
    );
  -webkit-mask: radial-gradient(circle, transparent 40%, #000 43%, #000 90%, transparent 94%);
  mask: radial-gradient(circle, transparent 40%, #000 43%, #000 90%, transparent 94%);
  animation: saRuneRotateReverse 1.4s linear forwards;
  animation-delay: 0.08s;
  filter: drop-shadow(0 0 10px rgba(100, 200, 255, 0.5));
}

/* 内层法阵 - 180px（新增，增加层次） */
.sa-wind-rune-inner {
  width: 180px;
  height: 180px;
  transform: translate3d(-50%, -50%, 0);
  background:
    conic-gradient(
      from 90deg,
      transparent 0deg,
      rgba(255, 255, 255, 0.6) 30deg,
      transparent 90deg,
      rgba(127, 255, 212, 0.5) 180deg,
      transparent 240deg,
      rgba(255, 220, 100, 0.45) 330deg,
      transparent 360deg
    );
  -webkit-mask: radial-gradient(circle, transparent 38%, #000 42%, #000 88%, transparent 92%);
  mask: radial-gradient(circle, transparent 38%, #000 42%, #000 88%, transparent 92%);
  animation: saRuneRotate 1.2s linear forwards;
  animation-delay: 0.15s;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
}

@keyframes saRuneRotate {
  0% { transform: translate3d(-50%, -50%, 0) scale(0.3) rotate(0deg); opacity: 0; }
  25% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(40deg); opacity: 0.9; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1) rotate(120deg); opacity: 0.55; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1.2) rotate(200deg); opacity: 0; }
}

@keyframes saRuneRotateReverse {
  0% { transform: translate3d(-50%, -50%, 0) scale(0.2) rotate(0deg); opacity: 0; }
  30% { transform: translate3d(-50%, -50%, 0) scale(0.95) rotate(-50deg); opacity: 0.8; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.05) rotate(-120deg); opacity: 0.5; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1.15) rotate(-180deg); opacity: 0; }
}

/* 能量符文环 - 围绕法阵旋转的符文光点（新增）
   使用虚线边框 + 旋转模拟符文环绕 */
.sa-rune-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 390px;
  height: 390px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  border-radius: 50%;
  border: 2px dashed rgba(170, 255, 238, 0.7);
  box-shadow:
    0 0 15px rgba(127, 255, 212, 0.5),
    inset 0 0 15px rgba(100, 200, 255, 0.3);
  animation: saRuneRing 1.3s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 2;
}

@keyframes saRuneRing {
  0% { transform: translate3d(-50%, -50%, 0) scale(0.2) rotate(0deg); opacity: 0; }
  30% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(60deg); opacity: 0.85; }
  70% { transform: translate3d(-50%, -50%, 0) scale(1.1) rotate(180deg); opacity: 0.5; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1.25) rotate(300deg); opacity: 0; }
}

/* 天空汇聚核心 - 多彩风暴之力向天空中心汇聚的能量核
   位于面板上方区域，模拟天空中的风暴汇聚点
   范围增大50%：90px（原60px） */
.sa-gather-core {
  position: absolute;
  top: 15%;
  left: 50%;
  width: 90px;
  height: 90px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(170, 255, 238, 0.85) 20%,
    rgba(100, 200, 255, 0.6) 45%,
    rgba(180, 130, 255, 0.4) 70%,
    transparent 100%
  );
  filter: blur(2px);
  animation: saGatherCore 0.7s ease-in-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  z-index: 3;
  opacity: 0;
}

@keyframes saGatherCore {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  40% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 1; }
  70% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2); opacity: 0; }
}

/* 聚能光柱 - 从地面到天空的垂直能量光柱（新增）
   多色渐变光柱，模拟能量从地面涌向天空汇聚点 */
.sa-charge-pillar {
  position: absolute;
  top: 15%;
  left: 50%;
  width: 75px;
  height: 45%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: bottom center;
  background: linear-gradient(
    to top,
    rgba(127, 255, 212, 0.5) 0%,
    rgba(100, 200, 255, 0.4) 30%,
    rgba(180, 130, 255, 0.3) 60%,
    rgba(255, 255, 255, 0.5) 90%,
    transparent 100%
  );
  filter: blur(4px);
  animation: saChargePillar 0.6s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 3;
}

@keyframes saChargePillar {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  40% { transform: translateX(-50%) scaleY(1); opacity: 0.8; }
  70% { transform: translateX(-50%) scaleY(1) scaleX(0.6); opacity: 0.5; }
  100% { transform: translateX(-50%) scaleY(1) scaleX(0.2); opacity: 0; }
}

/* 螺旋上升的多彩风力线 - 从四周向天空中心螺旋汇聚
   通过CSS自定义属性参数化角度、距离和颜色
   GPU: translate3d + rotate + scale + opacity */
.sa-wind-stream {
  position: absolute;
  top: 15%;
  left: 50%;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--sa-stream-color, rgba(170, 255, 238, 0.85)) 30%,
    rgba(255, 255, 255, 0.95) 50%,
    var(--sa-stream-color, rgba(127, 255, 212, 0.7)) 70%,
    transparent 100%
  );
  filter: blur(0.5px) drop-shadow(0 0 7px var(--sa-stream-color, rgba(127, 255, 212, 0.7)));
  transform: translate3d(-50%, -50%, 0) rotate(var(--sa-stream-angle)) translateX(var(--sa-stream-distance)) scale(0);
  animation: saWindStreamGather linear forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 3;
}

@keyframes saWindStreamGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sa-stream-angle)) translateX(var(--sa-stream-distance)) scale(0.3);
    opacity: 0;
  }
  20% { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(var(--sa-stream-angle)) translateX(var(--sa-stream-distance)) scale(1); }
  100% {
    transform: translate3d(-50%, -50%, 0)
      rotate(calc(var(--sa-stream-angle) + 180deg))
      translateX(0px)
      scale(0.2);
    opacity: 0;
  }
}

/* ================================================================
   阶段二：彩虹坠击（0.6s ~ 1.3s）—— 巨矢破空·闪电链·空气扭曲·风压撕裂
   ================================================================ */

/* 巨大七彩风暴箭矢 - 从天而降的巨大彩虹风暴箭矢
   由箭身、箭头、尾迹、光晕四部分组成，整体垂直下坠
   范围增大50%：75x360px（原50x240px） */
.sa-giant-arrow {
  position: absolute;
  top: 0;
  left: 50%;
  width: 75px;
  height: 360px;
  transform: translate3d(-50%, -420px, 0);
  animation: saArrowDescent 0.75s cubic-bezier(0.35, 0, 0.65, 1) forwards;
  animation-delay: 0.6s;
  will-change: transform, opacity;
  z-index: 5;
  opacity: 0;
}

/* 箭身 - 七彩风系能量构成的箭身主体（增大50%：24x270px） */
.sa-arrow-body {
  position: absolute;
  top: 45px;
  left: 50%;
  width: 24px;
  height: 270px;
  transform: translateX(-50%);
  background: linear-gradient(
    to bottom,
    rgba(170, 255, 238, 0.45) 0%,
    rgba(127, 255, 212, 0.9) 15%,
    rgba(100, 200, 255, 0.85) 35%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(180, 130, 255, 0.85) 65%,
    rgba(127, 255, 212, 0.9) 85%,
    rgba(170, 255, 238, 0.45) 100%
  );
  border-radius: 12px;
  box-shadow:
    0 0 15px rgba(127, 255, 212, 0.8),
    0 0 30px rgba(100, 200, 255, 0.5),
    0 0 45px rgba(180, 130, 255, 0.3);
  filter: blur(0.5px);
}

/* 箭头 - 七彩风系能量凝聚的箭头（增大50%） */
.sa-arrow-head {
  position: absolute;
  top: 0;
  left: 50%;
  width: 0;
  height: 0;
  transform: translateX(-50%);
  border-left: 27px solid transparent;
  border-right: 27px solid transparent;
  border-top: 54px solid rgba(255, 255, 255, 0.95);
  filter: drop-shadow(0 0 12px rgba(170, 255, 238, 0.9))
          drop-shadow(0 0 24px rgba(100, 200, 255, 0.6))
          drop-shadow(0 0 36px rgba(180, 130, 255, 0.4));
}

/* 箭矢尾迹 - 七彩箭矢下坠时拖拽的风系尾迹（增大50%） */
.sa-arrow-trail {
  position: absolute;
  top: 75px;
  left: 50%;
  width: 45px;
  height: 285px;
  transform: translateX(-50%);
  background: linear-gradient(
    to bottom,
    rgba(170, 255, 238, 0.6) 0%,
    rgba(100, 200, 255, 0.4) 30%,
    rgba(180, 130, 255, 0.3) 60%,
    transparent 100%
  );
  border-radius: 22px;
  filter: blur(5px);
  mix-blend-mode: screen;
}

/* 箭矢光晕 - 包裹箭矢的七彩光晕（新增，增大视觉冲击） */
.sa-arrow-glow {
  position: absolute;
  top: 0;
  left: 50%;
  width: 120px;
  height: 360px;
  transform: translateX(-50%);
  background: radial-gradient(
    ellipse at center,
    rgba(127, 255, 212, 0.35) 0%,
    rgba(100, 200, 255, 0.2) 30%,
    rgba(180, 130, 255, 0.15) 60%,
    transparent 100%
  );
  filter: blur(8px);
  mix-blend-mode: screen;
  opacity: 0.8;
}

@keyframes saArrowDescent {
  0% {
    transform: translate3d(-50%, -420px, 0) scale(0.6);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -300px, 0) scale(0.9);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -30px, 0) scale(1);
    opacity: 1;
  }
  75% {
    transform: translate3d(-50%, 45px, 0) scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, 75px, 0) scale(0.5);
    opacity: 0;
  }
}

/* 闪电链 - 箭矢周围的分叉闪电（新增）
   使用锯齿状渐变模拟闪电形态，快速闪现 */
.sa-lightning {
  position: absolute;
  top: var(--sa-lightning-top, 20%);
  left: 50%;
  transform: translateX(calc(-50% + var(--sa-lightning-offset, 0px))) skewX(var(--sa-lightning-skew, 0deg)) scaleY(0);
  transform-origin: top center;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 255, 255, 0.95) 15%,
    rgba(170, 255, 238, 0.7) 35%,
    rgba(255, 255, 255, 0.9) 55%,
    rgba(100, 200, 255, 0.6) 75%,
    transparent 100%
  );
  filter: drop-shadow(0 0 6px rgba(170, 255, 238, 0.9))
          drop-shadow(0 0 12px rgba(100, 200, 255, 0.6));
  clip-path: polygon(40% 0%, 60% 15%, 35% 30%, 65% 50%, 30% 70%, 60% 85%, 45% 100%, 55% 100%, 70% 85%, 40% 70%, 75% 50%, 45% 30%, 70% 15%, 50% 0%);
  animation: saLightningFlicker linear forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 6;
}

@keyframes saLightningFlicker {
  0% { transform: translateX(calc(-50% + var(--sa-lightning-offset, 0px))) skewX(var(--sa-lightning-skew, 0deg)) scaleY(0); opacity: 0; }
  20% { transform: translateX(calc(-50% + var(--sa-lightning-offset, 0px))) skewX(var(--sa-lightning-skew, 0deg)) scaleY(1); opacity: 1; }
  40% { transform: translateX(calc(-50% + var(--sa-lightning-offset, 0px))) skewX(var(--sa-lightning-skew, 0deg)) scaleY(1.1); opacity: 0.7; }
  60% { transform: translateX(calc(-50% + var(--sa-lightning-offset, 0px))) skewX(var(--sa-lightning-skew, 0deg)) scaleY(0.9); opacity: 1; }
  100% { transform: translateX(calc(-50% + var(--sa-lightning-offset, 0px))) skewX(var(--sa-lightning-skew, 0deg)) scaleY(1); opacity: 0; }
}

/* 空气扭曲波 - 箭矢下坠产生的扭曲波纹（新增）
   沿垂直方向扩散的水平波纹 */
.sa-distort-wave {
  position: absolute;
  top: 0;
  left: 50%;
  width: 150px;
  height: 100%;
  transform: translateX(-50%) scaleX(0);
  transform-origin: center;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(170, 255, 238, 0.25) 20%,
    rgba(100, 200, 255, 0.2) 40%,
    rgba(180, 130, 255, 0.2) 60%,
    rgba(170, 255, 238, 0.25) 80%,
    transparent 100%
  );
  filter: blur(6px);
  animation: saDistortWave 0.5s ease-out forwards;
  animation-delay: 0.7s;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 4;
}

@keyframes saDistortWave {
  0% { transform: translateX(-50%) scaleX(0); opacity: 0; }
  30% { transform: translateX(-50%) scaleX(1); opacity: 0.6; }
  70% { transform: translateX(-50%) scaleX(2); opacity: 0.3; }
  100% { transform: translateX(-50%) scaleX(3); opacity: 0; }
}

/* 箭矢破空风压线 - 箭矢下坠时两侧的风压撕裂线
   左右对称，模拟箭矢破开空气的风压
   位置增大50%：偏移52.5px（原35px） */
.sa-air-pressure {
  position: absolute;
  top: 0;
  width: 6px;
  height: 100%;
  transform: scaleY(0);
  transform-origin: top center;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(170, 255, 238, 0.55) 25%,
    rgba(100, 200, 255, 0.5) 40%,
    rgba(255, 255, 255, 0.75) 50%,
    rgba(180, 130, 255, 0.5) 60%,
    rgba(170, 255, 238, 0.55) 75%,
    transparent 100%
  );
  filter: blur(2px);
  animation: saAirPressure 0.55s ease-out forwards;
  animation-delay: 0.75s;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 4;
}

.sa-air-pressure-left {
  left: calc(50% - 52px);
}

.sa-air-pressure-right {
  left: calc(50% + 52px);
}

@keyframes saAirPressure {
  0% { transform: scaleY(0); opacity: 0; }
  30% { transform: scaleY(1); opacity: 0.85; }
  100% { transform: scaleY(1) scaleX(2); opacity: 0; }
}

/* 箭矢下坠光柱 - 伴随箭矢的垂直多彩光柱
   范围增大50%：105px宽（原70px） */
.sa-descent-pillar {
  position: absolute;
  top: 0;
  left: 50%;
  width: 105px;
  height: 100%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: top center;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.65) 0%,
    rgba(170, 255, 238, 0.45) 25%,
    rgba(100, 200, 255, 0.35) 50%,
    rgba(180, 130, 255, 0.25) 70%,
    rgba(127, 255, 212, 0.2) 85%,
    transparent 100%
  );
  filter: blur(3px);
  animation: saDescentPillar 0.65s ease-out forwards;
  animation-delay: 0.65s;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 4;
}

@keyframes saDescentPillar {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  30% { transform: translateX(-50%) scaleY(1); opacity: 0.75; }
  70% { transform: translateX(-50%) scaleY(1) scaleX(0.8); opacity: 0.4; }
  100% { transform: translateX(-50%) scaleY(1) scaleX(0.3); opacity: 0; }
}

/* ================================================================
   阶段三：爆裂风暴（1.2s ~ 2.2s）—— 爆炸冲击·五层冲击波·彩色碎片·能量余波·终结闪光
   ================================================================ */

/* 爆炸核心 - 箭矢命中点的多彩能量爆发
   径向渐变 + 缩放，表现爆炸核心能量爆发
   范围增大50%：150px（原100px） */
.sa-explosion-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 150px;
  height: 150px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(170, 255, 238, 0.9) 15%,
    rgba(100, 200, 255, 0.7) 35%,
    rgba(180, 130, 255, 0.5) 55%,
    rgba(255, 220, 100, 0.3) 75%,
    transparent 100%
  );
  filter: blur(2px);
  animation: saExplosionCore 0.7s ease-out forwards;
  animation-delay: 1.2s;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 6;
}

@keyframes saExplosionCore {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  50% { transform: translate3d(-50%, -50%, 0) scale(2); opacity: 0.8; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3.2); opacity: 0; }
}

/* 二次爆炸核心 - 延迟爆发的次级能量核（新增）
   增加爆炸层次感和视觉冲击 */
.sa-explosion-core-2 {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90px;
  height: 90px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 220, 100, 0.7) 30%,
    rgba(180, 130, 255, 0.5) 60%,
    transparent 100%
  );
  filter: blur(3px);
  animation: saExplosionCore2 0.5s ease-out forwards;
  animation-delay: 1.35s;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 6;
}

@keyframes saExplosionCore2 {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  25% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3); opacity: 0; }
}

/* 多层多彩冲击波 - 径向扩散的冲击波环
   5层不同延迟、颜色、尺寸，形成层次感（原3层增至5层）
   范围增大50%：105px（原70px） */
.sa-shock-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 105px;
  height: 105px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  border-radius: 50%;
  border: 4px solid rgba(170, 255, 238, 0.9);
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 7;
}

/* 第1层 - 白色高光冲击波 */
.sa-wave-1 {
  animation: saShockWave 0.65s ease-out forwards;
  animation-delay: 1.22s;
  border-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.6);
}

/* 第2层 - 青绿色冲击波 */
.sa-wave-2 {
  animation: saShockWave 0.65s ease-out forwards;
  animation-delay: 1.32s;
  border-color: rgba(170, 255, 238, 0.85);
  border-width: 3px;
  box-shadow: 0 0 25px rgba(127, 255, 212, 0.6);
}

/* 第3层 - 天蓝色冲击波 */
.sa-wave-3 {
  animation: saShockWave 0.6s ease-out forwards;
  animation-delay: 1.42s;
  border-color: rgba(100, 200, 255, 0.8);
  border-width: 3px;
  box-shadow: 0 0 25px rgba(100, 200, 255, 0.5);
}

/* 第4层 - 紫罗兰冲击波（新增） */
.sa-wave-4 {
  animation: saShockWave 0.6s ease-out forwards;
  animation-delay: 1.52s;
  border-color: rgba(180, 130, 255, 0.75);
  border-width: 2px;
  box-shadow: 0 0 22px rgba(180, 130, 255, 0.5);
}

/* 第5层 - 金色冲击波（新增） */
.sa-wave-5 {
  animation: saShockWave 0.55s ease-out forwards;
  animation-delay: 1.62s;
  border-color: rgba(255, 220, 100, 0.7);
  border-width: 2px;
  box-shadow: 0 0 20px rgba(255, 220, 100, 0.5);
}

@keyframes saShockWave {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(6.5); opacity: 0; border-width: 1px; }
}

/* 色彩光环 - 扩散的彩色光环（新增）
   使用conic-gradient形成旋转彩虹光环，径向扩散 */
.sa-color-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(127, 255, 212, 0.6),
    rgba(100, 200, 255, 0.6),
    rgba(180, 130, 255, 0.6),
    rgba(255, 220, 100, 0.6),
    rgba(255, 255, 255, 0.6),
    rgba(127, 255, 212, 0.6)
  );
  -webkit-mask: radial-gradient(circle, transparent 60%, #000 63%, #000 72%, transparent 75%);
  mask: radial-gradient(circle, transparent 60%, #000 63%, #000 72%, transparent 75%);
  filter: blur(2px);
  animation: saColorAura 0.8s ease-out forwards;
  animation-delay: 1.25s;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 7;
}

@keyframes saColorAura {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(60deg); opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) scale(5) rotate(360deg); opacity: 0; }
}

/* 能量余波 - 爆炸后的余波涟漪（新增）
   多层径向渐变涟漪，表现能量震荡余波 */
.sa-energy-aftermath {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 30%,
    rgba(127, 255, 212, 0.3) 45%,
    transparent 55%,
    rgba(100, 200, 255, 0.25) 70%,
    transparent 80%,
    rgba(180, 130, 255, 0.2) 90%,
    transparent 100%
  );
  filter: blur(3px);
  animation: saEnergyAftermath 0.9s ease-out forwards;
  animation-delay: 1.4s;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 7;
}

@keyframes saEnergyAftermath {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3.5); opacity: 0; }
}

/* 多彩风暴碎片 - 爆炸后飞散的七彩碎片粒子
   从中心以不同角度向外飞散，每个碎片有独立七彩配色 */
.sa-storm-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 1px;
  background: var(--sa-shard-color, rgba(200, 255, 240, 0.9));
  box-shadow:
    0 0 6px var(--sa-shard-color, rgba(127, 255, 212, 0.7)),
    0 0 12px var(--sa-shard-color, rgba(127, 255, 212, 0.4));
  transform: translate3d(-50%, -50%, 0) rotate(var(--sa-shard-angle)) translateX(0px) scale(0);
  animation: saShardScatter linear forwards;
  will-change: transform, opacity;
  opacity: 0;
  z-index: 7;
}

@keyframes saShardScatter {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sa-shard-angle)) translateX(0px) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(var(--sa-shard-angle)) translateX(15px) scale(1); }
  100% {
    transform: translate3d(-50%, -50%, 0)
      rotate(calc(var(--sa-shard-angle) + 90deg))
      translateX(var(--sa-shard-distance))
      scale(0.3);
    opacity: 0;
  }
}

/* 爆炸多彩风刃 - 爆炸后围绕中心旋转飞散的七彩风刃
   GPU: translate3d + rotate + opacity */
.sa-explosion-blade {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--sa-blade-color, rgba(170, 255, 238, 0.85)) 30%,
    rgba(255, 255, 255, 0.95) 50%,
    var(--sa-blade-color, rgba(127, 255, 212, 0.7)) 70%,
    transparent 100%
  );
  filter: blur(0.5px) drop-shadow(0 0 8px var(--sa-blade-color, rgba(127, 255, 212, 0.7)));
  transform: translate3d(-50%, -50%, 0) rotate(var(--sa-blade-angle)) translateX(0px) scale(0);
  animation: saBladeScatter linear forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 8;
}

@keyframes saBladeScatter {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sa-blade-angle)) translateX(0px) scale(0);
    opacity: 0;
  }
  20% { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(var(--sa-blade-angle)) translateX(30px) scale(1); }
  100% {
    transform: translate3d(-50%, -50%, 0)
      rotate(calc(var(--sa-blade-angle) + 180deg))
      translateX(var(--sa-blade-distance))
      scale(0.4);
    opacity: 0;
  }
}

/* 终结闪光 - 全屏终结多彩闪光
   径向渐变覆盖全屏，快速爆闪后消散
   采用七彩渐变增强炫彩效果 */
.sa-final-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.75) 0%,
    rgba(170, 255, 238, 0.5) 15%,
    rgba(100, 200, 255, 0.35) 30%,
    rgba(180, 130, 255, 0.25) 45%,
    rgba(255, 220, 100, 0.15) 60%,
    transparent 80%
  );
  animation: saFinalFlash 0.5s ease-out forwards;
  animation-delay: 1.25s;
  will-change: opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 9;
}

@keyframes saFinalFlash {
  0% { opacity: 0; }
  15% { opacity: 1; }
  40% { opacity: 0.5; }
  100% { opacity: 0; }
}
</style>
