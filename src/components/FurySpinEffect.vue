<!--
  @file FurySpinEffect.vue
  @generated 2026-06-25
  @description 怒焰回旋技能特效动画组件（GPU加速CSS动画版）
  技能描述："最大限度的利用身体的反作用力爆发出怒焰攻击对方"
  技能名称：怒焰回旋

  特效设计（纯CSS关键帧动画 + GPU合成层）——三阶段火焰旋风

  阶段1 - 蓄力爆发 (0~0.3s)：
    暗黑压缩→地面裂焰纹→能量球蓄力→爆发冲击

  阶段2 - 火焰回旋 (0.3~1.4s)：
    4火焰刃沿旋风轨道公转（容器旋转驱动）
    螺旋火线地面旋转（conic-gradient + mask）
    火花粒子法线喷射（translate + opacity动画）
    旋风柱碎片上升（translateY动画）

  阶段3 - 终结爆发 (1.4~2.0s)：
    旋风汇聚收缩→白热闪光→多层冲击波环→火焰环扩散→余烬飘散

  性能优化（核心）：
    - GPU加速：所有动画仅使用 transform + opacity，触发独立合成层
    - 零JS逐帧计算：CSS @keyframes 驱动全部动画，无 requestAnimationFrame 循环
    - will-change 提示浏览器提前创建合成层
    - contain: layout paint style 隔离重排重绘
    - mix-blend-mode: screen 实现火焰加法混合（真实光效）
    - DOM元素总量约60个，现代浏览器轻松处理
    - 动画总时长：2.0秒
-->
<template>
  <div
    v-if="isVisible"
    ref="containerRef"
    :key="animationKey"
    class="fury-spin-container"
    :style="containerStyle"
  >
    <!-- ===== 暗化背景层 ===== -->
    <div class="fs-dark-overlay"></div>

    <!-- ===== 蓄力阶段 ===== -->
    <!-- 地面裂纹：从中心向外放射 -->
    <div class="fs-crack-layer">
      <div
        v-for="crack in cracks"
        :key="crack.id"
        class="fs-crack-wrap"
        :style="crack.style"
      >
        <div class="fs-crack"></div>
      </div>
    </div>
    <!-- 蓄力能量球 -->
    <div class="fs-charge-orb"></div>
    <!-- 蓄力光晕 -->
    <div class="fs-charge-glow"></div>

    <!-- ===== 旋风阶段 ===== -->
    <!-- 旋风容器：旋转驱动火焰刃公转 -->
    <div class="fs-vortex">
      <!-- 螺旋火线 -->
      <div class="fs-spiral-fire"></div>
      <!-- 火焰刃：4刃均匀分布 -->
      <div
        v-for="blade in blades"
        :key="blade.id"
        class="fs-blade-pos"
        :style="blade.style"
      >
        <div class="fs-blade">
          <div class="fs-blade-trail"></div>
        </div>
      </div>
    </div>

    <!-- 旋风柱碎片：上升气流中的火焰碎片 -->
    <div
      v-for="debris in debrisList"
      :key="debris.id"
      class="fs-debris"
      :style="debris.style"
    ></div>

    <!-- 火花粒子：从旋风区域向外飞射 -->
    <div
      v-for="spark in sparks"
      :key="spark.id"
      class="fs-spark"
      :style="spark.style"
    ></div>

    <!-- ===== 终结爆发阶段 ===== -->
    <!-- 白热闪光 -->
    <div class="fs-flash"></div>
    <!-- 冲击波环 -->
    <div
      v-for="wave in shockwaves"
      :key="wave.id"
      class="fs-shockwave"
      :style="wave.style"
    ></div>
    <!-- 火焰环 -->
    <div
      v-for="ring in fireRings"
      :key="ring.id"
      class="fs-fire-ring"
      :style="ring.style"
    ></div>

    <!-- 余烬灰烬：爆炸后飘散 -->
    <div
      v-for="ember in embers"
      :key="ember.id"
      class="fs-ember"
      :style="ember.style"
    ></div>
  </div>
</template>

<script setup>
/**
 * 怒焰回旋技能特效动画组件（GPU加速CSS动画版）
 * 战士R技能 - AOE群体攻击
 *
 * 核心特性：
 * 1. 三阶段动画：蓄力爆发→火焰回旋→终结爆发
 * 2. 纯CSS @keyframes 驱动，零JS逐帧计算，GPU合成层加速
 * 3. 4火焰刃公转系统：容器旋转驱动，刃体自转脉冲
 * 4. 螺旋火线：conic-gradient + radial mask，旋转地面火线
 * 5. 粒子系统：火花飞射 + 旋风柱碎片 + 余烬飘散
 * 6. 冲击波系统：多层径向冲击波 + 火焰环扩散
 * 7. mix-blend-mode: screen 实现火焰加法混合光效
 * 8. 所有动画仅使用 transform + opacity，确保GPU合成
 */
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

// ==================== Props ====================

const props = defineProps({
  /** 是否启动动画（外部触发信号） */
  start: {
    type: Boolean,
    default: true
  }
})

// ==================== 响应式状态 ====================

/** 动画可见性 */
const isVisible = ref(false)

/** 容器引用 */
const containerRef = ref(null)

/** 动画key，递增以触发DOM重建（重启CSS动画） */
const animationKey = ref(0)

/** 容器样式（含CSS自定义属性） */
const containerStyle = ref({})

/** 蓄力裂纹数据 */
const cracks = ref([])

/** 火焰刃数据 */
const blades = ref([])

/** 火花粒子数据 */
const sparks = ref([])

/** 旋风柱碎片数据 */
const debrisList = ref([])

/** 冲击波数据 */
const shockwaves = ref([])

/** 火焰环数据 */
const fireRings = ref([])

/** 余烬数据 */
const embers = ref([])

// ==================== 常量配置 ====================

/** 动画总持续时间（毫秒） */
const ANIMATION_DURATION_MS = 2000

/** 清理缓冲时间（毫秒） */
const CLEANUP_BUFFER_MS = 100

/** 裂纹数量 */
const CRACK_COUNT = 10

/** 火焰刃数量 */
const BLADE_COUNT = 4

/** 火花粒子数量 */
const SPARK_COUNT = 18

/** 旋风柱碎片数量 */
const DEBRIS_COUNT = 8

/** 冲击波数量 */
const SHOCKWAVE_COUNT = 4

/** 火焰环数量 */
const FIRE_RING_COUNT = 3

/** 余烬数量 */
const EMBER_COUNT = 12

// ==================== 内部变量 ====================

/** 清理定时器 */
let cleanupTimer = null

// ==================== 工具函数 ====================

/**
 * 生成随机数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机数
 */
const rand = (min, max) => Math.random() * (max - min) + min

// ==================== 数据生成函数 ====================

/**
 * 生成蓄力裂纹数据
 * 从中心向外放射的裂纹线，带随机角度和长度
 * @param {number} minDim - 容器短边像素值
 * @returns {Array} 裂纹配置数组
 */
function generateCracks (minDim) {
  const list = []
  const maxLen = minDim * 0.32
  for (let i = 0; i < CRACK_COUNT; i++) {
    const angle = (i / CRACK_COUNT) * 360 + rand(-12, 12)
    const length = maxLen * rand(0.55, 1)
    const delay = rand(0, 0.08)
    list.push({
      id: `crack-${i}`,
      style: {
        transform: `rotate(${angle}deg)`,
        '--crack-len': `${length}px`,
        animationDelay: `${delay}s`
      }
    })
  }
  return list
}

/**
 * 生成火焰刃数据
 * 4个火焰刃均匀分布在旋风轨道上
 * @param {number} minDim - 容器短边像素值
 * @returns {Array} 火焰刃配置数组
 */
function generateBlades (minDim) {
  const list = []
  const radius = minDim * 0.26
  for (let i = 0; i < BLADE_COUNT; i++) {
    const angle = (i / BLADE_COUNT) * 360
    list.push({
      id: `blade-${i}`,
      style: {
        transform: `rotate(${angle}deg) translateY(-${radius}px)`
      }
    })
  }
  return list
}

/**
 * 生成火花粒子数据
 * 从旋风区域中心附近向外随机方向飞射
 * @param {number} minDim - 容器短边像素值
 * @returns {Array} 火花配置数组
 */
function generateSparks (minDim) {
  const list = []
  const maxDist = minDim * 0.42
  for (let i = 0; i < SPARK_COUNT; i++) {
    const angle = rand(0, 360)
    const rad = angle * Math.PI / 180
    const startDist = rand(8, 30)
    const endDist = startDist + rand(40, maxDist)
    const startX = Math.cos(rad) * startDist
    const startY = Math.sin(rad) * startDist
    const endX = Math.cos(rad) * endDist
    const endY = Math.sin(rad) * endDist
    const size = rand(3, 6)
    const delay = rand(0.35, 1.15)
    const duration = rand(0.4, 0.7)
    list.push({
      id: `spark-${i}`,
      style: {
        '--spark-sx': `${startX}px`,
        '--spark-sy': `${startY}px`,
        '--spark-ex': `${endX}px`,
        '--spark-ey': `${endY}px`,
        '--spark-size': `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }
    })
  }
  return list
}

/**
 * 生成旋风柱碎片数据
 * 上升气流中飘舞的火焰碎片
 * @param {number} minDim - 容器短边像素值
 * @returns {Array} 碎片配置数组
 */
function generateDebris (minDim) {
  const list = []
  const maxR = minDim * 0.22
  for (let i = 0; i < DEBRIS_COUNT; i++) {
    const angle = rand(0, 360)
    const rad = angle * Math.PI / 180
    const dist = rand(5, maxR)
    const x = Math.cos(rad) * dist
    const y = Math.sin(rad) * dist
    const rise = rand(50, 90)
    const drift = rand(-20, 20)
    const size = rand(2, 5)
    const delay = rand(0.4, 1.0)
    const duration = rand(0.6, 1.0)
    list.push({
      id: `debris-${i}`,
      style: {
        '--debris-x': `${x}px`,
        '--debris-y': `${y}px`,
        '--debris-rise': `${rise}px`,
        '--debris-drift': `${drift}px`,
        '--debris-size': `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }
    })
  }
  return list
}

/**
 * 生成冲击波数据
 * 终结爆炸时多层径向扩散的冲击波
 * @param {number} minDim - 容器短边像素值
 * @returns {Array} 冲击波配置数组
 */
function generateShockwaves (minDim) {
  const list = []
  const maxSize = minDim * 0.55
  for (let i = 0; i < SHOCKWAVE_COUNT; i++) {
    list.push({
      id: `shock-${i}`,
      style: {
        width: `${maxSize}px`,
        height: `${maxSize}px`,
        animationDelay: `${1.4 + i * 0.06}s`
      }
    })
  }
  return list
}

/**
 * 生成火焰环数据
 * 终结爆炸时向外扩散的环形火焰
 * @param {number} minDim - 容器短边像素值
 * @returns {Array} 火焰环配置数组
 */
function generateFireRings (minDim) {
  const list = []
  const maxSize = minDim * 0.65
  for (let i = 0; i < FIRE_RING_COUNT; i++) {
    list.push({
      id: `ring-${i}`,
      style: {
        width: `${maxSize}px`,
        height: `${maxSize}px`,
        animationDelay: `${1.42 + i * 0.09}s`
      }
    })
  }
  return list
}

/**
 * 生成余烬灰烬数据
 * 爆炸后从中心区域向上飘散的火星
 * @returns {Array} 余烬配置数组
 */
function generateEmbers () {
  const list = []
  for (let i = 0; i < EMBER_COUNT; i++) {
    const x = rand(-35, 35)
    const y = rand(-25, 25)
    const drift = rand(-25, 25)
    const rise = rand(70, 110)
    const size = rand(2, 4)
    const delay = rand(1.45, 1.75)
    const duration = rand(0.4, 0.6)
    list.push({
      id: `ember-${i}`,
      style: {
        '--ember-x': `${x}px`,
        '--ember-y': `${y}px`,
        '--ember-drift': `${drift}px`,
        '--ember-rise': `${rise}px`,
        '--ember-size': `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }
    })
  }
  return list
}

// ==================== 动画控制 ====================

/**
 * 测量容器尺寸并生成全部特效元素数据
 * 根据容器实际尺寸按比例生成，适配不同显示区域
 */
function measureAndGenerate () {
  const container = containerRef.value
  if (!container) return

  const parent = container.parentElement
  const cw = parent?.clientWidth || 600
  const ch = parent?.clientHeight || 400
  const minDim = Math.min(cw, ch)

  // 设置CSS自定义属性，供CSS中按比例计算尺寸
  container.style.setProperty('--fs-min', `${minDim}px`)
  container.style.setProperty('--fs-cw', `${cw}px`)
  container.style.setProperty('--fs-ch', `${ch}px`)

  // 生成所有特效元素数据
  cracks.value = generateCracks(minDim)
  blades.value = generateBlades(minDim)
  sparks.value = generateSparks(minDim)
  debrisList.value = generateDebris(minDim)
  shockwaves.value = generateShockwaves(minDim)
  fireRings.value = generateFireRings(minDim)
  embers.value = generateEmbers()
}

/**
 * 播放怒焰回旋特效动画
 * 递增animationKey强制DOM重建，重启所有CSS @keyframes动画
 */
function playAnimation () {
  // 清理上一次动画的定时器
  if (cleanupTimer) {
    clearTimeout(cleanupTimer)
    cleanupTimer = null
  }

  // 递增key强制Vue重建DOM，确保CSS动画从头播放
  animationKey.value++
  isVisible.value = true

  // 等待DOM挂载后测量容器并生成数据
  nextTick(() => {
    measureAndGenerate()
  })

  // 动画结束后自动隐藏
  cleanupTimer = setTimeout(() => {
    isVisible.value = false
    cleanupTimer = null
  }, ANIMATION_DURATION_MS + CLEANUP_BUFFER_MS)
}

// ==================== 暴露方法 ====================

defineExpose({ playAnimation })

// ==================== Watch监听 ====================

/**
 * 监听props.start变化，true时启动动画
 */
watch(() => props.start, (newVal) => {
  if (newVal) {
    playAnimation()
  }
})

// ==================== 生命周期 ====================

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
   特效容器 - 覆盖整个父容器
   GPU隔离：contain + 独立合成层
   ======================================== */
.fury-spin-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 60;
  border-radius: 10px;
  overflow: hidden;
  /* GPU合成层隔离，避免影响主文档流 */
  contain: layout paint style;
  /* 默认尺寸变量，JS会在运行时覆盖 */
  --fs-min: 200px;
  --fs-cw: 400px;
  --fs-ch: 300px;
  box-sizing: border-box;
}

/* ========================================
   暗化背景 - 径向渐变暗幕
   GPU: 仅 opacity 动画
   ======================================== */
.fs-dark-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(15, 3, 0, 0) 0%,
    rgba(10, 2, 0, 0.3) 25%,
    rgba(5, 1, 0, 0.55) 55%,
    rgba(0, 0, 0, 0.75) 100%
  );
  animation: fsDarkOverlay 2s ease-in-out forwards;
  will-change: opacity;
}

@keyframes fsDarkOverlay {
  0%   { opacity: 0; }
  7.5% { opacity: 0.65; }
  70%  { opacity: 0.65; }
  72%  { opacity: 0.8; }
  75%  { opacity: 0.6; }
  100% { opacity: 0; }
}

/* ========================================
   蓄力阶段 - 地面裂纹
   从中心向外放射状生长，GPU: transform scaleY
   ======================================== */
.fs-crack-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
}

.fs-crack-wrap {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  /* transform: rotate(angle) 由内联样式设置 */
}

.fs-crack {
  position: absolute;
  top: 0;
  left: -1px;
  width: 2px;
  height: var(--crack-len, 60px);
  transform-origin: top center;
  transform: scaleY(0);
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 200, 0.9) 0%,
    rgba(255, 180, 50, 0.7) 20%,
    rgba(255, 80, 0, 0.5) 50%,
    rgba(150, 20, 0, 0.2) 80%,
    transparent 100%
  );
  box-shadow:
    0 0 6px rgba(255, 100, 0, 0.6),
    0 0 12px rgba(255, 50, 0, 0.3);
  animation: fsCrackGrow 2s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes fsCrackGrow {
  0%   { transform: scaleY(0); opacity: 0; }
  3%   { opacity: 1; }
  15%  { transform: scaleY(1); opacity: 1; }
  70%  { transform: scaleY(1); opacity: 0.5; }
  100% { transform: scaleY(1); opacity: 0; }
}

/* ========================================
   蓄力能量球 - 中心火球压缩→爆发
   GPU: transform scale + opacity
   ======================================== */
.fs-charge-orb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(var(--fs-min) * 0.18);
  height: calc(var(--fs-min) * 0.18);
  margin-top: calc(-0.5 * var(--fs-min) * 0.18);
  margin-left: calc(-0.5 * var(--fs-min) * 0.18);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #ffffff 0%,
    #ffee88 12%,
    #ffaa00 28%,
    #ff5500 45%,
    rgba(204, 17, 0, 0.6) 65%,
    transparent 100%
  );
  box-shadow:
    0 0 20px rgba(255, 150, 0, 0.8),
    0 0 40px rgba(255, 80, 0, 0.5),
    0 0 60px rgba(255, 40, 0, 0.3);
  animation: fsChargeOrb 0.5s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes fsChargeOrb {
  0%   { transform: scale(0); opacity: 0; }
  30%  { transform: scale(0.5); opacity: 0.8; }
  55%  { transform: scale(1.1); opacity: 1; }
  75%  { transform: scale(0.7); opacity: 0.9; }
  100% { transform: scale(2.2); opacity: 0; }
}

/* ========================================
   蓄力光晕 - 环境火光扩散
   GPU: transform scale + opacity
   ======================================== */
.fs-charge-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(var(--fs-min) * 0.8);
  height: calc(var(--fs-min) * 0.8);
  margin-top: calc(-0.5 * var(--fs-min) * 0.8);
  margin-left: calc(-0.5 * var(--fs-min) * 0.8);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 120, 0, 0.3) 0%,
    rgba(255, 60, 0, 0.15) 30%,
    transparent 70%
  );
  animation: fsChargeGlow 0.5s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes fsChargeGlow {
  0%   { transform: scale(0.5); opacity: 0; }
  50%  { transform: scale(1); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}

/* ========================================
   旋风容器 - 旋转驱动火焰刃公转
   GPU: transform rotate + scale（容器整体旋转）
   4圈旋转：0→1440deg，先展开→持续旋风→收缩汇聚
   ======================================== */
.fs-vortex {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  animation: fsVortexSpin 1.1s linear 0.3s forwards;
  will-change: transform, opacity;
}

@keyframes fsVortexSpin {
  0%   { transform: rotate(0deg) scale(0.25); opacity: 0; }
  5%   { opacity: 1; }
  10%  { transform: rotate(36deg) scale(1); opacity: 1; }
  85%  { transform: rotate(1224deg) scale(1); opacity: 1; }
  100% { transform: rotate(1440deg) scale(0.08); opacity: 0; }
}

/* ========================================
   螺旋火线 - 地面旋转火线
   conic-gradient + radial mask 实现环形火线
   GPU: transform rotate（mask静态，仅旋转动画）
   ======================================== */
.fs-spiral-fire {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(var(--fs-min) * 0.72);
  height: calc(var(--fs-min) * 0.72);
  margin-top: calc(-0.5 * var(--fs-min) * 0.72);
  margin-left: calc(-0.5 * var(--fs-min) * 0.72);
  border-radius: 50%;
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg 8deg,
    rgba(255, 140, 30, 0.45) 10deg 14deg,
    rgba(255, 210, 100, 0.65) 14deg 16deg,
    rgba(255, 140, 30, 0.45) 16deg 20deg,
    transparent 22deg 30deg
  );
  -webkit-mask: radial-gradient(circle, transparent 10%, black 28%, black 78%, transparent 92%);
  mask: radial-gradient(circle, transparent 10%, black 28%, black 78%, transparent 92%);
  animation: fsSpiralSpin 1.1s linear 0.3s forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes fsSpiralSpin {
  0%   { transform: rotate(0deg) scale(0.3); opacity: 0; }
  10%  { transform: rotate(36deg) scale(1); opacity: 0.8; }
  85%  { transform: rotate(1224deg) scale(1); opacity: 0.5; }
  100% { transform: rotate(1440deg) scale(0.1); opacity: 0; }
}

/* ========================================
   火焰刃定位 - 将刃体放置到旋风轨道上
   transform: rotate(angle) translateY(-radius) 由内联样式设置
   ======================================== */
.fs-blade-pos {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
}

/* ========================================
   火焰刃本体 - 曲线剑身+火焰边缘
   GPU: transform scale + rotate（脉冲自转）
   mix-blend-mode: screen 加法混合
   ======================================== */
.fs-blade {
  position: absolute;
  top: calc(-0.5 * var(--fs-min) * 0.07);
  left: calc(-0.5 * var(--fs-min) * 0.04);
  width: calc(var(--fs-min) * 0.04);
  height: calc(var(--fs-min) * 0.07);
  /* 叶片/水滴形状：尖端朝上 */
  border-radius: 50% 50% 50% 50% / 80% 80% 20% 20%;
  background: radial-gradient(
    ellipse at 50% 20%,
    #ffffff 0%,
    #fff5cc 8%,
    #ffdd44 18%,
    #ffaa00 32%,
    #ff6600 48%,
    #ff2200 65%,
    rgba(153, 20, 0, 0.4) 82%,
    transparent 100%
  );
  box-shadow:
    0 0 12px rgba(255, 120, 0, 0.8),
    0 0 25px rgba(255, 50, 0, 0.5),
    0 0 45px rgba(255, 30, 0, 0.3);
  /* 切线方向旋转（垂直于半径）+ 脉冲缩放 */
  animation: fsBladePulse 0.35s ease-in-out 0.3s infinite alternate;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes fsBladePulse {
  0%   { transform: rotate(85deg) scale(0.85); }
  100% { transform: rotate(95deg) scale(1.12); }
}

/* ========================================
   火焰刃拖尾 - 刃体后方的火焰拖影
   GPU: transform继承父级，自身仅opacity呼吸
   ======================================== */
.fs-blade-trail {
  position: absolute;
  top: 70%;
  left: 50%;
  width: calc(var(--fs-min) * 0.025);
  height: calc(var(--fs-min) * 0.12);
  transform: translateX(-50%);
  background: linear-gradient(
    to bottom,
    rgba(255, 180, 80, 0.7) 0%,
    rgba(255, 80, 0, 0.4) 40%,
    rgba(200, 30, 0, 0.1) 70%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(2px);
  mix-blend-mode: screen;
  animation: fsTrailFlicker 0.25s ease-in-out 0.3s infinite alternate;
  will-change: opacity;
}

@keyframes fsTrailFlicker {
  0%   { opacity: 0.5; }
  100% { opacity: 1; }
}

/* ========================================
   火花粒子 - 从旋风区域向外飞射
   GPU: transform translate + scale + opacity
   ======================================== */
.fs-spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--spark-size, 4px);
  height: var(--spark-size, 4px);
  margin-top: calc(-0.5 * var(--spark-size, 4px));
  margin-left: calc(-0.5 * var(--spark-size, 4px));
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #ffee88 0%,
    #ff8800 40%,
    rgba(255, 40, 0, 0.5) 70%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(255, 120, 0, 0.6);
  animation: fsSparkFly 0.6s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes fsSparkFly {
  0% {
    transform: translate(var(--spark-sx, 0), var(--spark-sy, 0)) scale(0);
    opacity: 0;
  }
  12% {
    transform: translate(var(--spark-sx, 0), var(--spark-sy, 0)) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--spark-ex, 0), var(--spark-ey, 0)) scale(0.2);
    opacity: 0;
  }
}

/* ========================================
   旋风柱碎片 - 上升气流中的火焰碎片
   GPU: transform translate + scale + opacity
   ======================================== */
.fs-debris {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--debris-size, 3px);
  height: var(--debris-size, 3px);
  margin-top: calc(-0.5 * var(--debris-size, 3px));
  margin-left: calc(-0.5 * var(--debris-size, 3px));
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #ffcc44 0%,
    #ff6600 50%,
    rgba(200, 30, 0, 0.4) 80%,
    transparent 100%
  );
  box-shadow: 0 0 5px rgba(255, 100, 0, 0.5);
  animation: fsDebrisRise 0.8s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes fsDebrisRise {
  0% {
    transform: translate(var(--debris-x, 0), var(--debris-y, 0)) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate(var(--debris-x, 0), var(--debris-y, 0)) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(var(--debris-x, 0) + var(--debris-drift, 0)),
      calc(var(--debris-y, 0) - var(--debris-rise, 60px))
    ) scale(0.2);
    opacity: 0;
  }
}

/* ========================================
   白热闪光 - 终结爆炸瞬间全屏闪光
   GPU: transform scale + opacity
   ======================================== */
.fs-flash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%) scale(0);
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 250, 220, 0.9) 8%,
    rgba(255, 200, 100, 0.6) 20%,
    rgba(255, 100, 0, 0.25) 40%,
    transparent 70%
  );
  animation: fsFlash 0.4s ease-out 1.4s forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes fsFlash {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  12%  { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
}

/* ========================================
   冲击波环 - 多层径向扩散
   GPU: transform scale + opacity
   ======================================== */
.fs-shockwave {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2px solid rgba(255, 200, 100, 0.8);
  box-sizing: border-box;
  box-shadow:
    0 0 20px rgba(255, 150, 0, 0.6),
    inset 0 0 20px rgba(255, 100, 0, 0.3);
  transform: translate(-50%, -50%) scale(0);
  animation: fsShockwave 0.6s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes fsShockwave {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  10%  { transform: translate(-50%, -50%) scale(0.1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

/* ========================================
   火焰环 - 厚壁环形火焰扩散
   GPU: transform scale + opacity
   ======================================== */
.fs-fire-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: calc(var(--fs-min) * 0.025) solid rgba(255, 120, 0, 0.7);
  box-sizing: border-box;
  box-shadow:
    0 0 25px rgba(255, 80, 0, 0.6),
    0 0 50px rgba(255, 40, 0, 0.3),
    inset 0 0 25px rgba(255, 150, 0, 0.4);
  transform: translate(-50%, -50%) scale(0);
  animation: fsFireRing 0.55s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes fsFireRing {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  10%  { transform: translate(-50%, -50%) scale(0.1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

/* ========================================
   余烬灰烬 - 爆炸后向上飘散
   GPU: transform translate + scale + opacity
   ======================================== */
.fs-ember {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--ember-size, 3px);
  height: var(--ember-size, 3px);
  margin-top: calc(-0.5 * var(--ember-size, 3px));
  margin-left: calc(-0.5 * var(--ember-size, 3px));
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #ff8833 0%,
    #cc2200 50%,
    rgba(100, 10, 0, 0.3) 80%,
    transparent 100%
  );
  box-shadow: 0 0 4px rgba(255, 80, 0, 0.4);
  animation: fsEmberFloat 0.5s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes fsEmberFloat {
  0% {
    transform: translate(var(--ember-x, 0), var(--ember-y, 0)) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate(var(--ember-x, 0), var(--ember-y, 0)) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translate(
      calc(var(--ember-x, 0) + var(--ember-drift, 0)),
      calc(var(--ember-y, 0) - var(--ember-rise, 80px))
    ) scale(0.2);
    opacity: 0;
  }
}

/* ========================================
   减少动画偏好 - 无障碍支持
   ======================================== */
@media (prefers-reduced-motion: reduce) {
  .fury-spin-container {
    display: none;
  }
}
</style>
