<!--
  @file BladeDanceEffect.vue
  @generated 2026-06-25
  @description 刀剑乱舞技能特效动画组件（GPU加速CSS动画版）
  技能描述："挥舞手中的武器攻击周围所有敌人"
  技能名称：刀剑乱舞
  职业：刀锋战士 Q技能 - AOE群体攻击

  特效设计核心理念：
    "刀剑乱舞" = 挥舞武器狂乱起舞，刀光剑影覆盖周围所有方向
    核心视觉 = 脉冲气场环（挥舞能量波）+ 多波次多方向新月剑气放射 + 终结十字斩
    全程零旋转动画，仅用 scale + opacity + translate 表达挥舞与乱舞

  视觉方案：银白冷冽刀锋能量风暴（纯CSS关键帧 + GPU合成层）

  阶段1 - 蓄力拔刀 (0~0.3s)：
    暗幕压缩→地面能量裂纹（银白放射）→刀锋能量核心凝聚→出鞘闪光

  阶段2 - 刀剑乱舞 (0.3~1.4s)：
    核心：脉冲气场环 + 多波次新月剑气放射 + 中心能量脉冲
    - 脉冲气场环：3波从中心向外扩散的银白光环，表现持续挥舞产生的能量冲击波
    - 12道新月形剑气分3波次从四面八方放射，体现"乱"的多方向密集覆盖
    - 中心能量脉冲：刀锋能量源周期性呼吸缩放，表现挥舞节奏
    - 银白火花沿剑气方向飞溅
    - 上升气流中的刀锋碎片

  阶段3 - 终结十字斩 (1.4~2.0s)：
    能量汇聚→白热闪光→X形十字终结斩→多层冲击波环→刀气环扩散→碎光飘散

  性能优化：
    - GPU加速：所有动画仅使用 transform(scale/translate) + opacity，零旋转
    - will-change 提示浏览器提前创建合成层
    - contain: layout paint style 隔离重排重绘
    - mix-blend-mode: screen 实现光效加法混合
    - 动画总时长：2.0秒
-->
<template>
  <div
    v-if="isVisible"
    ref="containerRef"
    :key="animationKey"
    class="blade-dance-container"
    :style="containerStyle"
  >
    <!-- ===== 暗化背景层 ===== -->
    <div class="bd-dark-overlay"></div>

    <!-- ===== 蓄力阶段 ===== -->
    <!-- 地面能量裂纹：银白放射状 -->
    <div class="bd-crack-layer">
      <div
        v-for="crack in cracks"
        :key="crack.id"
        class="bd-crack-wrap"
        :style="crack.style"
      >
        <div class="bd-crack"></div>
      </div>
    </div>
    <!-- 刀锋能量核心 -->
    <div class="bd-charge-core"></div>
    <!-- 出鞘光晕 -->
    <div class="bd-charge-glow"></div>

    <!-- ===== 乱舞阶段：脉冲气场环（挥舞能量波，纯缩放扩散）===== -->
    <div
      v-for="pulse in pulseRings"
      :key="pulse.id"
      class="bd-pulse-ring"
      :style="pulse.style"
    ></div>

    <!-- ===== 乱舞阶段：中心能量脉冲（呼吸缩放，挥舞节奏源）===== -->
    <div class="bd-core-pulse"></div>

    <!-- ===== 核心阶段：多波次多方向新月剑气放射（"乱舞"主体）===== -->
    <div
      v-for="slash in slashes"
      :key="slash.id"
      class="bd-slash"
      :style="slash.style"
    ></div>

    <!-- 银白火花 -->
    <div
      v-for="spark in sparks"
      :key="spark.id"
      class="bd-spark"
      :style="spark.style"
    ></div>

    <!-- 上升刀锋碎片 -->
    <div
      v-for="frag in fragments"
      :key="frag.id"
      class="bd-fragment"
      :style="frag.style"
    ></div>

    <!-- ===== 终结十字斩阶段 ===== -->
    <!-- 白热闪光 -->
    <div class="bd-flash"></div>
    <!-- X形十字终结斩（静态角度，纯缩放爆发）-->
    <div class="bd-final-cross">
      <div class="bd-final-slash bd-final-slash-a"></div>
      <div class="bd-final-slash bd-final-slash-b"></div>
    </div>
    <!-- 冲击波环 -->
    <div
      v-for="wave in shockwaves"
      :key="wave.id"
      class="bd-shockwave"
      :style="wave.style"
    ></div>
    <!-- 刀气环 -->
    <div class="bd-blade-ring"></div>
    <!-- 碎光飘散 -->
    <div
      v-for="sparkle in sparkles"
      :key="sparkle.id"
      class="bd-sparkle"
      :style="sparkle.style"
    ></div>
  </div>
</template>

<script setup>
/**
 * 刀剑乱舞技能特效动画组件（GPU加速CSS动画版）
 * 刀锋战士Q技能 - AOE群体攻击
 *
 * 核心特性：
 * 1. 三阶段动画：蓄力拔刀→刀剑乱舞→终结十字斩
 * 2. 纯CSS @keyframes 驱动，零JS逐帧计算，GPU合成层加速
 * 3. 脉冲气场环：3波从中心向外纯缩放扩散的银白光环，表现持续挥舞的能量冲击波
 * 4. 多波次新月剑气：12道conic-gradient新月弧分3波次从四面八方放射，体现"乱"的多方向密集覆盖
 * 5. 中心能量脉冲：刀锋能量源周期性呼吸缩放，表现挥舞节奏
 * 6. 粒子系统：银白火花飞射 + 上升刀锋碎片 + 终结碎光飘散
 * 7. 终结十字斩：X形双新月弧纯缩放爆发，多层冲击波 + 刀气环扩散
 * 8. 全程零旋转动画，仅用 scale + opacity + translate，确保GPU合成且视觉清晰
 * 9. 银白冷冽色调统一刀锋能量美学，与怒焰回旋的火焰美学形成明确区分
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

/** 脉冲气场环数据 */
const pulseRings = ref([])

/** 新月剑气放射数据 */
const slashes = ref([])

/** 银白火花粒子数据 */
const sparks = ref([])

/** 上升刀锋碎片数据 */
const fragments = ref([])

/** 冲击波数据 */
const shockwaves = ref([])

/** 终结碎光数据 */
const sparkles = ref([])

// ==================== 常量配置 ====================

/** 动画总持续时间（毫秒） */
const ANIMATION_DURATION_MS = 2000

/** 清理缓冲时间（毫秒） */
const CLEANUP_BUFFER_MS = 100

/** 裂纹数量 */
const CRACK_COUNT = 10

/** 脉冲气场环数量 */
const PULSE_RING_COUNT = 3

/** 新月剑气数量 */
const SLASH_COUNT = 12

/** 银白火花粒子数量 */
const SPARK_COUNT = 16

/** 上升刀锋碎片数量 */
const FRAGMENT_COUNT = 6

/** 冲击波数量 */
const SHOCKWAVE_COUNT = 4

/** 终结碎光数量 */
const SPARKLE_COUNT = 10

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
 * 从中心向外放射的银白能量裂纹线
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
 * 生成脉冲气场环数据
 * 3波从中心向外纯缩放扩散的银白光环，表现持续挥舞产生的能量冲击波
 * @param {number} minDim - 容器短边像素值
 * @returns {Array} 脉冲环配置数组
 */
function generatePulseRings (minDim) {
  const list = []
  const maxSize = minDim * 0.6
  for (let i = 0; i < PULSE_RING_COUNT; i++) {
    list.push({
      id: `pulse-${i}`,
      style: {
        width: `${maxSize}px`,
        height: `${maxSize}px`,
        animationDelay: `${0.3 + i * 0.28}s`
      }
    })
  }
  return list
}

/**
 * 生成新月剑气放射数据
 * 12道新月形剑气分3波次从四面八方放射，体现"乱"的多方向密集覆盖
 * 每道剑气有独立角度（静态定位，非旋转动画）和延迟
 * @returns {Array} 剑气配置数组
 */
function generateSlashes () {
  const list = []
  for (let i = 0; i < SLASH_COUNT; i++) {
    // 角度均匀分布360度，加随机偏移增加"乱"感
    const angle = (i / SLASH_COUNT) * 360 + rand(-10, 10)
    // 分3波次：每波4道，波次间隔0.18s，波内间隔约0.06s
    const wave = i % 3
    const indexInWave = Math.floor(i / 3)
    const delay = 0.3 + wave * 0.18 + indexInWave * 0.06 + rand(-0.02, 0.02)
    const duration = rand(0.3, 0.38)
    list.push({
      id: `slash-${i}`,
      style: {
        '--slash-angle': `${angle}deg`,
        '--slash-delay': `${delay}s`,
        '--slash-duration': `${duration}s`
      }
    })
  }
  return list
}

/**
 * 生成银白火花粒子数据
 * 沿剑气挥舞方向从中心附近向外飞射
 * @param {number} minDim - 容器短边像素值
 * @returns {Array} 火花配置数组
 */
function generateSparks (minDim) {
  const list = []
  const maxDist = minDim * 0.4
  for (let i = 0; i < SPARK_COUNT; i++) {
    const angle = rand(0, 360)
    const rad = angle * Math.PI / 180
    const startDist = rand(8, 28)
    const endDist = startDist + rand(38, maxDist)
    const startX = Math.cos(rad) * startDist
    const startY = Math.sin(rad) * startDist
    const endX = Math.cos(rad) * endDist
    const endY = Math.sin(rad) * endDist
    const size = rand(2, 5)
    const delay = rand(0.35, 1.15)
    const duration = rand(0.35, 0.6)
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
 * 生成上升刀锋碎片数据
 * 上升气流中飘舞的银白刀锋碎片
 * @param {number} minDim - 容器短边像素值
 * @returns {Array} 碎片配置数组
 */
function generateFragments (minDim) {
  const list = []
  const maxR = minDim * 0.2
  for (let i = 0; i < FRAGMENT_COUNT; i++) {
    const angle = rand(0, 360)
    const rad = angle * Math.PI / 180
    const dist = rand(5, maxR)
    const x = Math.cos(rad) * dist
    const y = Math.sin(rad) * dist
    const rise = rand(50, 85)
    const drift = rand(-18, 18)
    const size = rand(2, 4)
    const delay = rand(0.4, 1.0)
    const duration = rand(0.6, 0.9)
    list.push({
      id: `frag-${i}`,
      style: {
        '--frag-x': `${x}px`,
        '--frag-y': `${y}px`,
        '--frag-rise': `${rise}px`,
        '--frag-drift': `${drift}px`,
        '--frag-size': `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }
    })
  }
  return list
}

/**
 * 生成冲击波数据
 * 终结十字斩时多层径向扩散的银白冲击波
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
 * 生成终结碎光数据
 * 终结斩后从中心区域向上飘散的银白光点
 * @returns {Array} 碎光配置数组
 */
function generateSparkles () {
  const list = []
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const x = rand(-32, 32)
    const y = rand(-22, 22)
    const drift = rand(-22, 22)
    const rise = rand(65, 100)
    const size = rand(2, 4)
    const delay = rand(1.45, 1.75)
    const duration = rand(0.4, 0.55)
    list.push({
      id: `sparkle-${i}`,
      style: {
        '--sparkle-x': `${x}px`,
        '--sparkle-y': `${y}px`,
        '--sparkle-drift': `${drift}px`,
        '--sparkle-rise': `${rise}px`,
        '--sparkle-size': `${size}px`,
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
  container.style.setProperty('--bd-min', `${minDim}px`)
  container.style.setProperty('--bd-cw', `${cw}px`)
  container.style.setProperty('--bd-ch', `${ch}px`)

  // 生成所有特效元素数据
  cracks.value = generateCracks(minDim)
  pulseRings.value = generatePulseRings(minDim)
  slashes.value = generateSlashes()
  sparks.value = generateSparks(minDim)
  fragments.value = generateFragments(minDim)
  shockwaves.value = generateShockwaves(minDim)
  sparkles.value = generateSparkles()
}

/**
 * 播放刀剑乱舞特效动画
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

  // 动画结束后自动隐藏（显示2秒 + 100ms缓冲后销毁）
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
.blade-dance-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 60;
  border-radius: 10px;
  overflow: hidden;
  /* GPU合成层隔离，避免影响主文档流 */
  contain: layout paint style;
  /* 默认尺寸变量，JS会在运行时覆盖 */
  --bd-min: 200px;
  --bd-cw: 400px;
  --bd-ch: 300px;
  box-sizing: border-box;
}

/* ========================================
   暗化背景 - 径向渐变暗幕
   GPU: 仅 opacity 动画
   ======================================== */
.bd-dark-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(2, 4, 8, 0) 0%,
    rgba(2, 4, 10, 0.3) 25%,
    rgba(1, 2, 6, 0.55) 55%,
    rgba(0, 0, 2, 0.75) 100%
  );
  animation: bdDarkOverlay 2s ease-in-out forwards;
  will-change: opacity;
}

@keyframes bdDarkOverlay {
  0%   { opacity: 0; }
  7.5% { opacity: 0.65; }
  70%  { opacity: 0.65; }
  72%  { opacity: 0.8; }
  75%  { opacity: 0.6; }
  100% { opacity: 0; }
}

/* ========================================
   蓄力阶段 - 地面能量裂纹
   从中心向外放射状生长，银白刀锋能量
   GPU: transform scaleY
   ======================================== */
.bd-crack-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
}

.bd-crack-wrap {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  /* transform: rotate(angle) 由内联样式设置（静态定位，非旋转动画）*/
}

.bd-crack {
  position: absolute;
  top: 0;
  left: -1px;
  width: 2px;
  height: var(--crack-len, 60px);
  transform-origin: top center;
  transform: scaleY(0);
  background: linear-gradient(
    to bottom,
    rgba(240, 250, 255, 0.9) 0%,
    rgba(180, 220, 255, 0.7) 20%,
    rgba(108, 182, 255, 0.5) 50%,
    rgba(42, 109, 217, 0.2) 80%,
    transparent 100%
  );
  box-shadow:
    0 0 6px rgba(108, 182, 255, 0.6),
    0 0 12px rgba(42, 109, 217, 0.3);
  animation: bdCrackGrow 2s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes bdCrackGrow {
  0%   { transform: scaleY(0); opacity: 0; }
  3%   { opacity: 1; }
  15%  { transform: scaleY(1); opacity: 1; }
  70%  { transform: scaleY(1); opacity: 0.5; }
  100% { transform: scaleY(1); opacity: 0; }
}

/* ========================================
   刀锋能量核心 - 中心银白能量球压缩→爆发
   GPU: transform scale + opacity
   ======================================== */
.bd-charge-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(var(--bd-min) * 0.16);
  height: calc(var(--bd-min) * 0.16);
  margin-top: calc(-0.5 * var(--bd-min) * 0.16);
  margin-left: calc(-0.5 * var(--bd-min) * 0.16);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #ffffff 0%,
    #e0f0ff 12%,
    #80bfff 28%,
    #2a7ddd 45%,
    rgba(20, 60, 140, 0.6) 65%,
    transparent 100%
  );
  box-shadow:
    0 0 20px rgba(108, 182, 255, 0.8),
    0 0 40px rgba(42, 109, 217, 0.5),
    0 0 60px rgba(20, 80, 180, 0.3);
  animation: bdChargeCore 0.5s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes bdChargeCore {
  0%   { transform: scale(0); opacity: 0; }
  30%  { transform: scale(0.5); opacity: 0.8; }
  55%  { transform: scale(1.1); opacity: 1; }
  75%  { transform: scale(0.7); opacity: 0.9; }
  100% { transform: scale(2.2); opacity: 0; }
}

/* ========================================
   出鞘光晕 - 环境刀锋光气扩散
   GPU: transform scale + opacity
   ======================================== */
.bd-charge-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(var(--bd-min) * 0.8);
  height: calc(var(--bd-min) * 0.8);
  margin-top: calc(-0.5 * var(--bd-min) * 0.8);
  margin-left: calc(-0.5 * var(--bd-min) * 0.8);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(108, 182, 255, 0.3) 0%,
    rgba(42, 109, 217, 0.15) 30%,
    transparent 70%
  );
  animation: bdChargeGlow 0.5s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes bdChargeGlow {
  0%   { transform: scale(0.5); opacity: 0; }
  50%  { transform: scale(1); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}

/* ========================================
   ★ 脉冲气场环 - 挥舞能量波（纯缩放扩散，零旋转）
   3波从中心向外扩散的银白光环，表现持续挥舞产生的能量冲击波
   GPU: transform scale + opacity
   ======================================== */
.bd-pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2px solid rgba(160, 210, 255, 0.7);
  box-sizing: border-box;
  box-shadow:
    0 0 15px rgba(108, 182, 255, 0.5),
    inset 0 0 15px rgba(42, 109, 217, 0.2);
  transform: translate(-50%, -50%) scale(0);
  animation: bdPulseRing 0.6s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes bdPulseRing {
  0%   { transform: translate(-50%, -50%) scale(0.1); opacity: 0; }
  15%  { transform: translate(-50%, -50%) scale(0.3); opacity: 0.9; }
  100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}

/* ========================================
   ★ 中心能量脉冲 - 挥舞节奏源（呼吸缩放，零旋转）
   刀锋能量源周期性呼吸，表现持续挥舞的节奏感
   GPU: transform scale + opacity
   ======================================== */
.bd-core-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(var(--bd-min) * 0.12);
  height: calc(var(--bd-min) * 0.12);
  margin-top: calc(-0.5 * var(--bd-min) * 0.12);
  margin-left: calc(-0.5 * var(--bd-min) * 0.12);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #ffffff 0%,
    #c0e0ff 20%,
    #6cb6ff 45%,
    rgba(42, 109, 217, 0.4) 70%,
    transparent 100%
  );
  box-shadow:
    0 0 15px rgba(108, 182, 255, 0.8),
    0 0 30px rgba(42, 109, 217, 0.5);
  animation: bdCorePulse 0.32s ease-in-out 0.3s 3 alternate;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes bdCorePulse {
  0%   { transform: scale(0.6); opacity: 0.5; }
  100% { transform: scale(1.4); opacity: 1; }
}

/* ========================================
   ★ 核心：多波次多方向新月剑气放射（"乱舞"主体，零旋转动画）
   conic-gradient绘制新月弧形 + radial mask裁切为环形带
   每道剑气从中心向外纯缩放放射，角度为静态定位（非旋转动画）
   GPU: transform scale + opacity
   ======================================== */
.bd-slash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(var(--bd-min) * 0.55);
  height: calc(var(--bd-min) * 0.55);
  margin-top: calc(-0.5 * var(--bd-min) * 0.275);
  margin-left: calc(-0.5 * var(--bd-min) * 0.275);
  border-radius: 50%;
  /* conic-gradient绘制新月剑气：90度弧，中心最亮两端渐隐 */
  background: conic-gradient(
    from -45deg,
    transparent 0deg,
    rgba(108, 182, 255, 0.2) 5deg,
    rgba(180, 220, 255, 0.7) 15deg,
    rgba(230, 245, 255, 1) 30deg,
    rgba(230, 245, 255, 1) 45deg,
    rgba(180, 220, 255, 0.7) 60deg,
    rgba(108, 182, 255, 0.2) 75deg,
    transparent 90deg,
    transparent 360deg
  );
  box-shadow: 0 0 15px rgba(108, 182, 255, 0.6);
  /* radial mask裁切为10px厚的环形带，仅保留边缘新月弧 */
  -webkit-mask: radial-gradient(
    circle,
    transparent 0%,
    transparent calc(50% - 6px),
    black calc(50% - 5px),
    black calc(50% + 5px),
    transparent calc(50% + 6px),
    transparent 100%
  );
  mask: radial-gradient(
    circle,
    transparent 0%,
    transparent calc(50% - 6px),
    black calc(50% - 5px),
    black calc(50% + 5px),
    transparent calc(50% + 6px),
    transparent 100%
  );
  /* 静态角度定位（非旋转动画），初始缩放为0 */
  transform: rotate(var(--slash-angle, 0deg)) scale(0);
  animation: bdSlashOut var(--slash-duration, 0.4s) ease-out var(--slash-delay, 0s) forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

/* 新月剑气放射动画：从中心小弧→向外纯缩放放大→消散（角度保持不变）*/
@keyframes bdSlashOut {
  0% {
    transform: rotate(var(--slash-angle, 0deg)) scale(0.15);
    opacity: 0;
  }
  15% {
    transform: rotate(var(--slash-angle, 0deg)) scale(0.4);
    opacity: 1;
  }
  55% {
    transform: rotate(var(--slash-angle, 0deg)) scale(1);
    opacity: 0.85;
  }
  100% {
    transform: rotate(var(--slash-angle, 0deg)) scale(1.5);
    opacity: 0;
  }
}

/* ========================================
   银白火花 - 从中心区域向外飞射
   GPU: transform translate + scale + opacity
   ======================================== */
.bd-spark {
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
    #ffffff 0%,
    #a0c8ff 40%,
    rgba(42, 109, 217, 0.5) 70%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(108, 182, 255, 0.6);
  animation: bdSparkFly 0.55s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes bdSparkFly {
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
   上升刀锋碎片 - 上升气流中的银白碎片
   GPU: transform translate + scale + opacity
   ======================================== */
.bd-fragment {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--frag-size, 3px);
  height: var(--frag-size, 3px);
  margin-top: calc(-0.5 * var(--frag-size, 3px));
  margin-left: calc(-0.5 * var(--frag-size, 3px));
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #c0d8ff 0%,
    #4a8edd 50%,
    rgba(20, 60, 140, 0.4) 80%,
    transparent 100%
  );
  box-shadow: 0 0 5px rgba(108, 182, 255, 0.5);
  animation: bdFragmentRise 0.75s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes bdFragmentRise {
  0% {
    transform: translate(var(--frag-x, 0), var(--frag-y, 0)) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate(var(--frag-x, 0), var(--frag-y, 0)) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(var(--frag-x, 0) + var(--frag-drift, 0)),
      calc(var(--frag-y, 0) - var(--frag-rise, 60px))
    ) scale(0.2);
    opacity: 0;
  }
}

/* ========================================
   白热闪光 - 终结十字斩瞬间全屏闪光
   GPU: transform scale + opacity
   ======================================== */
.bd-flash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%) scale(0);
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 1) 0%,
    rgba(230, 245, 255, 0.9) 8%,
    rgba(150, 200, 255, 0.6) 20%,
    rgba(42, 109, 217, 0.25) 40%,
    transparent 70%
  );
  animation: bdFlash 0.4s ease-out 1.4s forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes bdFlash {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  12%  { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
}

/* ========================================
   终结十字斩 - X形双新月弧纯缩放爆发（零旋转动画）
   两道巨大新月剑气交叉45度，角度为静态定位，仅缩放变化
   GPU: transform scale + opacity
   ======================================== */
.bd-final-cross {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
}

.bd-final-slash {
  position: absolute;
  top: calc(-0.5 * var(--bd-min) * 0.35);
  left: calc(-0.5 * var(--bd-min) * 0.35);
  width: calc(var(--bd-min) * 0.7);
  height: calc(var(--bd-min) * 0.7);
  border-radius: 50%;
  /* 巨大新月弧：120度弧，比普通剑气更宽更亮 */
  background: conic-gradient(
    from -60deg,
    transparent 0deg,
    rgba(108, 182, 255, 0.2) 5deg,
    rgba(180, 220, 255, 0.7) 15deg,
    rgba(230, 245, 255, 1) 30deg,
    rgba(255, 255, 255, 1) 45deg,
    rgba(255, 255, 255, 1) 60deg,
    rgba(180, 220, 255, 0.7) 75deg,
    rgba(108, 182, 255, 0.2) 90deg,
    transparent 105deg,
    transparent 360deg
  );
  box-shadow: 0 0 25px rgba(108, 182, 255, 0.8);
  -webkit-mask: radial-gradient(
    circle,
    transparent 0%,
    transparent calc(50% - 8px),
    black calc(50% - 7px),
    black calc(50% + 7px),
    transparent calc(50% + 8px),
    transparent 100%
  );
  mask: radial-gradient(
    circle,
    transparent 0%,
    transparent calc(50% - 8px),
    black calc(50% - 7px),
    black calc(50% + 7px),
    transparent calc(50% + 8px),
    transparent 100%
  );
  transform: scale(0);
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

/* 第一道斩：左上→右下方向（静态45度定位，纯缩放爆发）*/
.bd-final-slash-a {
  animation: bdFinalSlashA 0.5s ease-out 1.4s forwards;
}

@keyframes bdFinalSlashA {
  0%   { transform: rotate(45deg) scale(0.1); opacity: 0; }
  15%  { transform: rotate(45deg) scale(0.3); opacity: 1; }
  45%  { transform: rotate(45deg) scale(1); opacity: 1; }
  100% { transform: rotate(45deg) scale(1.35); opacity: 0; }
}

/* 第二道斩：右上→左下方向（静态-45度定位，纯缩放爆发）*/
.bd-final-slash-b {
  animation: bdFinalSlashB 0.5s ease-out 1.45s forwards;
}

@keyframes bdFinalSlashB {
  0%   { transform: rotate(-45deg) scale(0.1); opacity: 0; }
  15%  { transform: rotate(-45deg) scale(0.3); opacity: 1; }
  45%  { transform: rotate(-45deg) scale(1); opacity: 1; }
  100% { transform: rotate(-45deg) scale(1.35); opacity: 0; }
}

/* ========================================
   冲击波环 - 多层径向扩散（纯缩放，零旋转）
   GPU: transform scale + opacity
   ======================================== */
.bd-shockwave {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2px solid rgba(180, 220, 255, 0.8);
  box-sizing: border-box;
  box-shadow:
    0 0 20px rgba(108, 182, 255, 0.6),
    inset 0 0 20px rgba(42, 109, 217, 0.3);
  transform: translate(-50%, -50%) scale(0);
  animation: bdShockwave 0.6s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes bdShockwave {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  10%  { transform: translate(-50%, -50%) scale(0.1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

/* ========================================
   刀气环 - 厚壁环形刀锋能量扩散（纯缩放，零旋转）
   GPU: transform scale + opacity
   ======================================== */
.bd-blade-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(var(--bd-min) * 0.5);
  height: calc(var(--bd-min) * 0.5);
  margin-top: calc(-0.5 * var(--bd-min) * 0.25);
  margin-left: calc(-0.5 * var(--bd-min) * 0.25);
  border-radius: 50%;
  border: calc(var(--bd-min) * 0.025) solid rgba(108, 182, 255, 0.7);
  box-sizing: border-box;
  box-shadow:
    0 0 25px rgba(42, 109, 217, 0.6),
    0 0 50px rgba(20, 80, 180, 0.3),
    inset 0 0 25px rgba(108, 182, 255, 0.4);
  transform: translate(-50%, -50%) scale(0);
  animation: bdBladeRing 0.55s ease-out 1.42s forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes bdBladeRing {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  10%  { transform: translate(-50%, -50%) scale(0.1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

/* ========================================
   碎光飘散 - 终结斩后向上飘散
   GPU: transform translate + scale + opacity
   ======================================== */
.bd-sparkle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--sparkle-size, 3px);
  height: var(--sparkle-size, 3px);
  margin-top: calc(-0.5 * var(--sparkle-size, 3px));
  margin-left: calc(-0.5 * var(--sparkle-size, 3px));
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #e0f0ff 0%,
    #6cb6ff 50%,
    rgba(20, 60, 140, 0.3) 80%,
    transparent 100%
  );
  box-shadow: 0 0 4px rgba(108, 182, 255, 0.4);
  animation: bdSparkleFloat 0.5s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes bdSparkleFloat {
  0% {
    transform: translate(var(--sparkle-x, 0), var(--sparkle-y, 0)) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate(var(--sparkle-x, 0), var(--sparkle-y, 0)) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translate(
      calc(var(--sparkle-x, 0) + var(--sparkle-drift, 0)),
      calc(var(--sparkle-y, 0) - var(--sparkle-rise, 80px))
    ) scale(0.2);
    opacity: 0;
  }
}

/* ========================================
   减少动画偏好 - 无障碍支持
   ======================================== */
@media (prefers-reduced-motion: reduce) {
  .blade-dance-container {
    display: none;
  }
}
</style>
