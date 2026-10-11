<!--
  @file GaleRapidFireEffect.vue
  @generated 2026-07-18
  @description 狂风连射技能特效动画组件（GPU加速 + Web Animations API）
  爆裂射手I技能 - 单体风系多段连射攻击

  技能叙事：引狂风之力凝于长弓（玩家头像处）→ 聚集风系能量蓄能 → 密集连射多支风凝箭矢抛物线飞向目标 → 命中爆发风刃撕裂护甲

  三阶段动画（总时长1.7秒）：
  1. 狂风聚集（0s ~ 0.5s）：在玩家头像处旋转风系法阵蓄能，螺旋风力线汇聚，聚能核心闪烁
  2. 密集连射（0.4s ~ 1.1s）：多支风凝箭矢从玩家头像处按抛物线轨迹飞向目标怪物头像，每支箭矢错开发射，带风系尾迹与光晕
  3. 命中爆发（0.9s ~ 1.7s）：目标位置风系爆炸冲击波，风刃飞散，护甲撕裂裂纹，能量余波消散

  实现方式（参考 SpiritMindEffect.vue）：
  - 所有元素通过 Teleport to="body" 渲染到 body，使用 position: fixed 避免被父容器裁剪
  - 通过 getBoundingClientRect() 获取玩家头像(#playerAvatar)和怪物头像(.enemy-icon)的真实屏幕坐标
  - 箭矢飞行动画通过 Web Animations API (element.animate) 驱动，飞行轨迹为抛物线
  - GPU加速：所有动画仅使用 transform（translate3d/scale/rotate）+ opacity，避免Layout/Paint
  - will-change 提前创建合成层，backface-visibility:hidden 消除闪烁
  - mix-blend-mode: screen 实现光效加法混合

  箭矢飞行路径：
  - 起点：玩家头像中心屏幕坐标（通过 #playerAvatar 获取）
  - 终点：目标怪物头像中心屏幕坐标（通过 enemy-container-{index} .enemy-icon 获取）
  - 轨迹：抛物线，通过关键帧中间点添加弧度偏移实现
  - 每支箭矢的旋转角度跟随抛物线切线方向，视觉更自然
-->

<template>
  <Teleport to="body">
    <!-- ========== 阶段一：狂风聚集（0s ~ 0.5s）—— 在玩家头像处旋转法阵·螺旋汇聚·聚能核心 ========== -->
    <div v-if="gatherReady" class="grf-gather-fixed" :style="gatherFixedStyle">
      <!-- 两层旋转风系法阵（外/内） -->
      <div class="grf-wind-rune grf-wind-rune-outer"></div>
      <div class="grf-wind-rune grf-wind-rune-inner"></div>
      <!-- 聚能核心：风系能量汇聚点 -->
      <div class="grf-charge-core"></div>
      <!-- 蓄能光柱：垂直能量光柱 -->
      <div class="grf-charge-pillar"></div>
      <!-- 螺旋风力线：从四周汇聚到中心 -->
      <div
        v-for="stream in windStreams"
        :key="stream.id"
        class="grf-wind-stream"
        :style="stream.style"
      ></div>
      <!-- 聚能光环：扩散的能量环 -->
      <div class="grf-charge-ring"></div>
    </div>

    <!-- ========== 阶段二：密集连射（0.4s ~ 1.1s）—— 多箭齐发·抛物线飞行·风系尾迹 ========== -->
    <!-- 风凝箭矢：每支由 Web Animations API 驱动，从玩家头像飞向怪物头像 -->
    <div
      v-for="(arrow, index) in arrowList"
      :key="arrow.id"
      :ref="el => setArrowRef(el, index)"
      class="grf-arrow-fixed"
    >
      <div class="grf-arrow-body"></div>
      <div class="grf-arrow-head"></div>
      <div class="grf-arrow-trail"></div>
    </div>

    <!-- ========== 阶段三：命中爆发（0.9s ~ 1.7s）—— 在怪物头像处爆炸冲击·风刃飞散·护甲撕裂 ========== -->
    <div v-if="phaseStarted" class="grf-impact-fixed" :style="impactFixedStyle">
      <!-- 命中爆炸核心 -->
      <div class="grf-impact-core"></div>
      <!-- 二次爆炸核心 -->
      <div class="grf-impact-core-2"></div>
      <!-- 多层冲击波 -->
      <div class="grf-shock-wave grf-wave-1"></div>
      <div class="grf-shock-wave grf-wave-2"></div>
      <div class="grf-shock-wave grf-wave-3"></div>
      <div class="grf-shock-wave grf-wave-4"></div>
      <!-- 护甲撕裂裂纹：表现降低防御DEBUFF -->
      <div class="grf-armor-crack"></div>
      <!-- 风刃飞散 -->
      <div
        v-for="blade in impactBlades"
        :key="blade.id"
        class="grf-impact-blade"
        :style="blade.style"
      ></div>
      <!-- 能量余波 -->
      <div class="grf-energy-aftermath"></div>
    </div>

    <!-- 终结闪光：围绕命中位置的局部闪光 -->
    <div v-if="phaseStarted" class="grf-final-flash" :style="impactFixedStyle"></div>
  </Teleport>
</template>

<script setup>
/**
 * 狂风连射技能特效动画组件
 * 爆裂射手I技能 - 单体风系多段连射攻击
 *
 * 三阶段叙事动画（总时长1.7秒）：
 * 1. 狂风聚集（0s ~ 0.5s）：在玩家头像处旋转风系法阵蓄能，螺旋风力线汇聚
 * 2. 密集连射（0.4s ~ 1.1s）：多支风凝箭矢从玩家头像按抛物线飞向目标怪物头像
 * 3. 命中爆发（0.9s ~ 1.7s）：目标位置风系爆炸冲击波，风刃飞散，护甲撕裂
 *
 * 实现方式（参考 SpiritMindEffect.vue）：
 * - 所有元素 Teleport to body，position: fixed，避免父容器裁剪和 scale 影响
 * - getBoundingClientRect() 获取玩家头像和怪物头像的真实屏幕坐标
 * - Web Animations API 驱动箭矢抛物线飞行，旋转角度跟随切线方向
 * - GPU加速：仅使用 transform + opacity
 *
 * @prop {number} targetIndex - 目标怪物索引（用于定位命中位置）
 * @prop {number} arrowCount - 箭矢发射数量（影响连射视觉密度）
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

/** 螺旋风力线数量 */
const WIND_STREAM_COUNT = 10

/** 命中爆炸风刃数量 */
const IMPACT_BLADE_COUNT = 10

/** 最大渲染箭矢数（防止极端数值导致DOM过载） */
const MAX_RENDER_ARROWS = 20

/** 箭矢飞行速度（像素/秒），用于动态计算飞行时间 */
const ARROW_FLIGHT_SPEED = 1200

/** 连射阶段时间窗口（秒）：0.4s ~ 1.6s，扩大窗口让箭矢发射节奏清晰可见 */
const FIRE_WINDOW_START = 0.4
const FIRE_WINDOW_END = 1.6

/** 是否就绪显示聚集效果（位置计算完成后才渲染） */
const gatherReady = ref(false)

/** 阶段三是否开始播放（箭矢开始飞行后置为 true） */
const phaseStarted = ref(false)

/** 螺旋风力线数据列表 */
const windStreams = ref([])

/** 箭矢数据列表 */
const arrowList = ref([])

/** 命中风刃数据列表 */
const impactBlades = ref([])

/** 箭矢 DOM 引用数组（通过函数式 ref 收集） */
const arrowRefs = ref([])

/** 聚集效果容器的 fixed 定位样式（定位到玩家头像中心） */
const gatherFixedStyle = ref({})

/** 命中爆发容器的 fixed 定位样式（定位到怪物头像中心） */
const impactFixedStyle = ref({})

/** 玩家头像中心屏幕坐标 */
let playerCenterX = 0
let playerCenterY = 0

/** 怪物头像中心屏幕坐标 */
let targetCenterX = 0
let targetCenterY = 0

/** 所有正在运行的定时器（用于卸载时清理） */
const timers = []

/** 所有正在运行的 Animation 对象（用于卸载时清理） */
const animations = []

const props = defineProps({
  /** 目标怪物索引（用于定位命中爆发位置） */
  targetIndex: {
    type: Number,
    default: 0
  },
  /** 箭矢发射数量（影响连射视觉密度） */
  arrowCount: {
    type: Number,
    default: 5
  }
})

/**
 * 设置箭矢 DOM 引用（函数式 ref）
 * @param {HTMLElement|null} el - DOM 元素
 * @param {number} index - 箭矢索引
 */
function setArrowRef (el, index) {
  if (el) {
    arrowRefs.value[index] = el
  }
}

/**
 * 生成随机数（含最小值，不含最大值）
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机数
 */
function rand (min, max) {
  return Math.random() * (max - min) + min
}

/** 风系配色数组 - 青绿/翠绿/天蓝/白色 */
const WIND_COLORS = [
  'rgba(127, 255, 212, 0.9)',   // 青绿 aquamarine
  'rgba(0, 229, 204, 0.85)',    // 翠绿
  'rgba(100, 200, 255, 0.9)',   // 天蓝
  'rgba(170, 255, 238, 0.85)',  // 浅青绿
  'rgba(255, 255, 255, 0.95)'   // 白色高光
]

/**
 * 获取随机风系色
 * @param {number} index - 索引（用于稳定配色）
 * @returns {string} CSS颜色值
 */
function getWindColor (index) {
  return WIND_COLORS[index % WIND_COLORS.length]
}

/**
 * 生成螺旋汇聚的多彩风力线数据
 * 10条风力线从中心四周不同角度螺旋汇聚至中心
 * @returns {Array} 风力线配置数组
 */
function generateWindStreams () {
  const list = []
  for (let i = 0; i < WIND_STREAM_COUNT; i++) {
    const angle = (i / WIND_STREAM_COUNT) * 360 + rand(-12, 12)
    const startDistance = rand(80, 130)
    const delay = rand(0, 0.15)
    const duration = rand(0.35, 0.5)
    const width = rand(35, 55)
    const height = rand(4, 7)
    const color = getWindColor(i)

    list.push({
      id: `grf-stream-${i}`,
      style: {
        '--grf-stream-angle': `${angle}deg`,
        '--grf-stream-distance': `${startDistance}px`,
        '--grf-stream-color': color,
        width: `${width}px`,
        height: `${height}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }
    })
  }
  return list
}

/**
 * 生成密集连射箭矢数据
 * 根据arrowCount生成对应数量箭矢配置
 * 箭矢数量超过MAX_RENDER_ARROWS时降采样，防止DOM过载
 * @param {number} rawCount - 原始箭矢数量
 * @returns {Array} 箭矢配置数组
 */
function generateArrowList (rawCount) {
  const renderCount = Math.min(Math.max(1, rawCount), MAX_RENDER_ARROWS)
  const list = []
  for (let i = 0; i < renderCount; i++) {
    // 垂直微偏移：每支箭矢略微不同的飞行轨迹，增加视觉层次
    const offsetY = rand(-15, 15)
    // 抛物线弧度偏移（负值=向上凸起）
    const arcOffset = rand(-60, -20)
    // 箭矢尺寸
    const arrowLength = rand(40, 60)
    const arrowWidth = rand(8, 12)
    // 配色
    const color = getWindColor(i + 1)

    list.push({
      id: `grf-arrow-${i}`,
      offsetY,
      arcOffset,
      arrowLength,
      arrowWidth,
      color
    })
  }
  return list
}

/**
 * 生成命中爆炸风刃数据
 * 10道风刃在命中后围绕目标位置旋转飞散
 * @returns {Array} 风刃配置数组
 */
function generateImpactBlades () {
  const list = []
  for (let i = 0; i < IMPACT_BLADE_COUNT; i++) {
    const angle = (i / IMPACT_BLADE_COUNT) * 360 + rand(-10, 10)
    const distance = rand(80, 140)
    const delay = rand(0, 0.15)
    const duration = rand(0.45, 0.65)
    const width = rand(35, 50)
    const height = rand(10, 16)
    const color = getWindColor(i + 2)

    list.push({
      id: `grf-blade-${i}`,
      style: {
        '--grf-blade-angle': `${angle}deg`,
        '--grf-blade-distance': `${distance}px`,
        '--grf-blade-color': color,
        width: `${width}px`,
        height: `${height}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }
    })
  }
  return list
}

/**
 * 计算抛物线上某一点的坐标
 * 抛物线公式：y = y0 + (y1-y0)*t + arc * 4*t*(1-t)
 * 其中 arc 为顶点偏移（负值=向上凸起），4*t*(1-t) 在 t=0.5 时为1（最大值）
 * @param {number} t - 进度 [0, 1]
 * @param {number} startX - 起点 X
 * @param {number} startY - 起点 Y
 * @param {number} endX - 终点 X
 * @param {number} endY - 终点 Y
 * @param {number} arc - 抛物线弧度偏移
 * @returns {{x: number, y: number}} 抛物线上的坐标
 */
function parabolaPoint (t, startX, startY, endX, endY, arc) {
  const x = startX + (endX - startX) * t
  const y = startY + (endY - startY) * t + arc * 4 * t * (1 - t)
  return { x, y }
}

/**
 * 计算抛物线上某一点的切线角度（度）
 * 用于让箭矢旋转方向跟随飞行轨迹切线，视觉更自然
 * @param {number} t - 进度 [0, 1]
 * @param {number} startX - 起点 X
 * @param {number} startY - 起点 Y
 * @param {number} endX - 终点 X
 * @param {number} endY - 终点 Y
 * @param {number} arc - 抛物线弧度偏移
 * @returns {number} 切线角度（度）
 */
function parabolaTangentAngle (t, startX, startY, endX, endY, arc) {
  // dy/dt = (endY - startY) + arc * 4 * (1 - 2t)
  // dx/dt = (endX - startX)
  const dy = (endY - startY) + arc * 4 * (1 - 2 * t)
  const dx = (endX - startX)
  return Math.atan2(dy, dx) * 180 / Math.PI
}

/**
 * 使用 Web Animations API 启动单支箭矢的抛物线飞行动画
 * 箭矢从玩家头像中心飞向怪物头像中心，飞行轨迹为抛物线
 * 旋转角度跟随抛物线切线方向
 * @param {HTMLElement} arrowEl - 箭矢 DOM 元素
 * @param {number} delay - 发射延迟（毫秒）
 * @param {number} duration - 飞行持续时间（毫秒）
 * @param {number} offsetY - 垂直偏移（像素）
 * @param {number} arcOffset - 抛物线弧度偏移（负值=向上凸起）
 */
function startArrowFlight (arrowEl, delay, duration, offsetY, arcOffset) {
  if (!arrowEl) return

  // 飞行起点和终点（加上垂直偏移）
  const sX = playerCenterX
  const sY = playerCenterY
  const eX = targetCenterX
  const eY = targetCenterY + offsetY

  // 箭矢容器宽高的一半（用于居中定位）
  const halfW = 20
  const halfH = 5

  // 抛物线插值辅助函数
  const point = (t) => parabolaPoint(t, sX, sY, eX, eY, arcOffset)
  const tangent = (t) => parabolaTangentAngle(t, sX, sY, eX, eY, arcOffset)

  // 构建抛物线飞行的关键帧
  // 5个关键帧：起点 → 出现 → 抛物线顶点 → 接近终点 → 终点消失
  const keyframes = [
    {
      transform: `translate3d(${sX - halfW}px, ${sY - halfH}px, 0) rotate(${tangent(0)}deg) scale(0.3)`,
      opacity: 0
    },
    {
      transform: `translate3d(${point(0.15).x - halfW}px, ${point(0.15).y - halfH}px, 0) rotate(${tangent(0.15)}deg) scale(1)`,
      opacity: 1,
      offset: 0.15
    },
    {
      transform: `translate3d(${point(0.5).x - halfW}px, ${point(0.5).y - halfH}px, 0) rotate(${tangent(0.5)}deg) scale(1)`,
      opacity: 1,
      offset: 0.5
    },
    {
      transform: `translate3d(${point(0.85).x - halfW}px, ${point(0.85).y - halfH}px, 0) rotate(${tangent(0.85)}deg) scale(0.9)`,
      opacity: 1,
      offset: 0.85
    },
    {
      transform: `translate3d(${eX - halfW}px, ${eY - halfH}px, 0) rotate(${tangent(1)}deg) scale(0.5)`,
      opacity: 0
    }
  ]

  // 延迟启动动画
  const timer = setTimeout(() => {
    const anim = arrowEl.animate(keyframes, {
      duration,
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      fill: 'forwards'
    })
    animations.push(anim)
  }, delay)
  timers.push(timer)
}

/**
 * 启动所有箭矢的飞行动画
 * 每支箭矢错开发射延迟，形成连射视觉效果
 */
function startAllArrows () {
  const rawCount = Math.max(1, Math.min(props.arrowCount, 30))
  const renderCount = arrowList.value.length
  if (renderCount === 0) return

  // 连射时间窗口
  const fireWindow = (FIRE_WINDOW_END - FIRE_WINDOW_START) * 1000
  // 每支箭矢的发射间隔，最小间隔 60ms 保证视觉可分辨
  const rawInterval = rawCount > 1 ? fireWindow / (rawCount - 1) : 0
  const interval = Math.max(60, rawInterval)

  for (let i = 0; i < renderCount; i++) {
    const arrow = arrowList.value[i]
    const arrowEl = arrowRefs.value[i]
    if (!arrowEl) continue

    // 发射延迟（毫秒）
    const delayMs = FIRE_WINDOW_START * 1000 + i * interval
    // 飞行距离
    const distance = Math.hypot(targetCenterX - playerCenterX, targetCenterY - playerCenterY)
    // 飞行时间根据距离动态计算（300ms ~ 450ms）
    const durationMs = Math.max(300, Math.min(450, Math.round(distance / ARROW_FLIGHT_SPEED * 1000)))

    startArrowFlight(arrowEl, delayMs, durationMs, arrow.offsetY, arrow.arcOffset)
  }
}

/**
 * 组件挂载后：
 * 1. 获取玩家头像和怪物头像的屏幕坐标
 * 2. 设置聚集效果和命中爆发的 fixed 定位
 * 3. 显示聚集效果（阶段一）
 * 4. 启动箭矢飞行动画（阶段二）
 * 5. 延迟触发命中爆发（阶段三）
 */
onMounted(async () => {
  try {
    // 查找玩家头像元素
    const playerAvatar = document.getElementById('playerAvatar')
    // 查找目标怪物头像元素
    const targetEl = document.getElementById('enemy-container-' + props.targetIndex)
    const enemyIcon = targetEl?.querySelector('.enemy-icon')

    // 计算玩家头像中心屏幕坐标
    if (playerAvatar) {
      const avatarRect = playerAvatar.getBoundingClientRect()
      playerCenterX = Math.round(avatarRect.left + avatarRect.width / 2)
      playerCenterY = Math.round(avatarRect.top + avatarRect.height / 2)
    } else {
      // 找不到玩家头像时，使用屏幕左侧中部作为兜底
      playerCenterX = Math.round(window.innerWidth * 0.15)
      playerCenterY = Math.round(window.innerHeight * 0.5)
    }

    // 计算怪物头像中心屏幕坐标
    if (enemyIcon) {
      const iconRect = enemyIcon.getBoundingClientRect()
      targetCenterX = Math.round(iconRect.left + iconRect.width / 2)
      targetCenterY = Math.round(iconRect.top + iconRect.height / 2)
    } else {
      // 找不到怪物头像时，使用屏幕右侧中部作为兜底
      targetCenterX = Math.round(window.innerWidth * 0.75)
      targetCenterY = Math.round(window.innerHeight * 0.5)
    }

    // 设置聚集效果定位（玩家头像中心）
    gatherFixedStyle.value = {
      left: `${playerCenterX}px`,
      top: `${playerCenterY}px`
    }

    // 设置命中爆发定位（怪物头像中心）
    impactFixedStyle.value = {
      left: `${targetCenterX}px`,
      top: `${targetCenterY}px`
    }

    // 生成粒子数据
    windStreams.value = generateWindStreams()
    arrowList.value = generateArrowList(props.arrowCount)
    impactBlades.value = generateImpactBlades()

    // 显示聚集效果（阶段一）
    gatherReady.value = true

    // 等待 DOM 渲染完成后启动箭矢动画
    await nextTick()
    requestAnimationFrame(() => {
      startAllArrows()
    })

    // 延迟触发命中爆发（阶段三），与最后一支箭到达时间同步
    const impactTimer = setTimeout(() => {
      phaseStarted.value = true
    }, 1800)
    timers.push(impactTimer)

    // 延迟隐藏聚集效果（阶段一在 0.6s 后隐藏）
    const gatherHideTimer = setTimeout(() => {
      gatherReady.value = false
    }, 600)
    timers.push(gatherHideTimer)
  } catch (e) {
    console.warn('[GaleRapidFireEffect] 初始化失败:', e)
    // 出错时直接显示命中爆发
    phaseStarted.value = true
  }
})

onUnmounted(() => {
  // 清理所有定时器
  timers.forEach(t => clearTimeout(t))
  timers.length = 0
  // 取消所有正在运行的动画
  animations.forEach(a => {
    try { a.cancel() } catch (e) { /* ignore */ }
  })
  animations.length = 0
})
</script>

<style scoped>
/* ================================================================
   阶段一：狂风聚集（0s ~ 0.5s）—— 在玩家头像处旋转法阵·螺旋汇聚·聚能核心
   容器通过 position: fixed 定位到玩家头像中心，内层元素相对中心做动画
   ================================================================ */

/* 聚集效果容器 - position: fixed，定位到玩家头像中心
   宽高为0，子元素以容器中心为原点定位 */
.grf-gather-fixed {
  position: fixed;
  width: 0;
  height: 0;
  z-index: 99999;
  pointer-events: none;
}

/* 两层旋转风系法阵 - 旋转的多彩风系蓄能阵（外/内）
   定位到容器中心（left:0, top:0），通过 translate(-50%,-50%) 居中 */
.grf-wind-rune {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 50%;
  will-change: transform, opacity;
  opacity: 0;
}

/* 外层法阵 - 180px */
.grf-wind-rune-outer {
  width: 180px;
  height: 180px;
  transform: translate3d(-50%, -50%, 0);
  background:
    conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(127, 255, 212, 0.5) 30deg,
      transparent 70deg,
      rgba(100, 200, 255, 0.45) 150deg,
      transparent 190deg,
      rgba(170, 255, 238, 0.4) 270deg,
      transparent 310deg
    );
  -webkit-mask: radial-gradient(circle, transparent 35%, #000 38%, #000 92%, transparent 96%);
  mask: radial-gradient(circle, transparent 35%, #000 38%, #000 92%, transparent 96%);
  animation: grfRuneRotate 0.5s linear forwards;
  filter: drop-shadow(0 0 10px rgba(127, 255, 212, 0.5));
}

/* 内层法阵 - 110px */
.grf-wind-rune-inner {
  width: 110px;
  height: 110px;
  transform: translate3d(-50%, -50%, 0);
  background:
    conic-gradient(
      from 90deg,
      transparent 0deg,
      rgba(255, 255, 255, 0.55) 40deg,
      transparent 100deg,
      rgba(127, 255, 212, 0.5) 200deg,
      transparent 260deg
    );
  -webkit-mask: radial-gradient(circle, transparent 40%, #000 43%, #000 88%, transparent 92%);
  mask: radial-gradient(circle, transparent 40%, #000 43%, #000 88%, transparent 92%);
  animation: grfRuneRotateReverse 0.5s linear forwards;
  animation-delay: 0.05s;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
}

@keyframes grfRuneRotate {
  0% { transform: translate3d(-50%, -50%, 0) scale(0.2) rotate(0deg); opacity: 0; }
  30% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(60deg); opacity: 0.9; }
  70% { transform: translate3d(-50%, -50%, 0) scale(1.1) rotate(150deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1.3) rotate(220deg); opacity: 0; }
}

@keyframes grfRuneRotateReverse {
  0% { transform: translate3d(-50%, -50%, 0) scale(0.15) rotate(0deg); opacity: 0; }
  30% { transform: translate3d(-50%, -50%, 0) scale(0.9) rotate(-50deg); opacity: 0.85; }
  70% { transform: translate3d(-50%, -50%, 0) scale(1.05) rotate(-140deg); opacity: 0.55; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1.2) rotate(-200deg); opacity: 0; }
}

/* 聚能核心 - 风系能量汇聚点，径向渐变 + 缩放脉冲 */
.grf-charge-core {
  position: absolute;
  left: 0;
  top: 0;
  width: 70px;
  height: 70px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(170, 255, 238, 0.85) 20%,
    rgba(127, 255, 212, 0.7) 40%,
    rgba(100, 200, 255, 0.4) 65%,
    transparent 100%
  );
  filter: blur(2px);
  animation: grfChargeCore 0.5s ease-in-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
}

@keyframes grfChargeCore {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  40% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 1; }
  70% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2); opacity: 0; }
}

/* 蓄能光柱 - 垂直能量光柱 */
.grf-charge-pillar {
  position: absolute;
  left: 0;
  top: 0;
  width: 50px;
  height: 120px;
  transform: translate(-50%, -50%) scaleY(0);
  transform-origin: center;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(127, 255, 212, 0.4) 30%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(100, 200, 255, 0.4) 70%,
    transparent 100%
  );
  filter: blur(3px);
  animation: grfChargePillar 0.45s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
}

@keyframes grfChargePillar {
  0% { transform: translate(-50%, -50%) scaleY(0); opacity: 0; }
  40% { transform: translate(-50%, -50%) scaleY(1); opacity: 0.8; }
  70% { transform: translate(-50%, -50%) scaleY(1) scaleX(0.5); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scaleY(1) scaleX(0.2); opacity: 0; }
}

/* 螺旋汇聚的多彩风力线 - 从中心四周螺旋汇聚至中心
   通过CSS自定义属性参数化角度、距离和颜色 */
.grf-wind-stream {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--grf-stream-color, rgba(170, 255, 238, 0.85)) 30%,
    rgba(255, 255, 255, 0.95) 50%,
    var(--grf-stream-color, rgba(127, 255, 212, 0.7)) 70%,
    transparent 100%
  );
  filter: blur(0.5px) drop-shadow(0 0 6px var(--grf-stream-color, rgba(127, 255, 212, 0.7)));
  transform: translate3d(-50%, -50%, 0) rotate(var(--grf-stream-angle)) translateX(var(--grf-stream-distance)) scale(0);
  animation: grfWindStreamGather linear forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
}

@keyframes grfWindStreamGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--grf-stream-angle)) translateX(var(--grf-stream-distance)) scale(0.3);
    opacity: 0;
  }
  25% { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(var(--grf-stream-angle)) translateX(var(--grf-stream-distance)) scale(1); }
  100% {
    transform: translate3d(-50%, -50%, 0)
      rotate(calc(var(--grf-stream-angle) + 160deg))
      translateX(0px)
      scale(0.2);
    opacity: 0;
  }
}

/* 聚能光环 - 扩散的能量环 */
.grf-charge-ring {
  position: absolute;
  left: 0;
  top: 0;
  width: 100px;
  height: 100px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  border-radius: 50%;
  border: 2px solid rgba(170, 255, 238, 0.8);
  box-shadow:
    0 0 15px rgba(127, 255, 212, 0.5),
    inset 0 0 12px rgba(100, 200, 255, 0.3);
  animation: grfChargeRing 0.5s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
}

@keyframes grfChargeRing {
  0% { transform: translate3d(-50%, -50%, 0) scale(0.2); opacity: 0; }
  30% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.85; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2.2); opacity: 0; }
}

/* ================================================================
   阶段二：密集连射（0.4s ~ 1.1s）—— 多箭齐发·抛物线飞行·风系尾迹
   箭矢通过 position: fixed + Web Animations API 驱动
   容器初始不可见，由 JS animate() 控制 transform 和 opacity
   ================================================================ */

/* 风凝箭矢容器 - position: fixed，初始在屏幕左上角（由 JS animate 移动）
   横向设计：箭头在右（前进方向），尾迹在左
   宽40px 高10px，由 JS animate 的 translate3d 控制位置 */
.grf-arrow-fixed {
  position: fixed;
  top: 0;
  left: 0;
  width: 40px;
  height: 10px;
  z-index: 99999;
  pointer-events: none;
  opacity: 0;
  will-change: transform, opacity;
  transform-origin: center;
}

/* 箭身 - 风系能量构成的箭身主体（横向） */
.grf-arrow-body {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70%;
  height: 60%;
  transform: translate(-50%, -50%);
  background: linear-gradient(
    to right,
    rgba(170, 255, 238, 0.5) 0%,
    rgba(127, 255, 212, 0.9) 30%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(100, 200, 255, 0.85) 70%,
    rgba(170, 255, 238, 0.5) 100%
  );
  border-radius: 50%;
  box-shadow:
    0 0 8px rgba(127, 255, 212, 0.8),
    0 0 16px rgba(100, 200, 255, 0.4);
  filter: blur(0.5px);
}

/* 箭头 - 风系能量凝聚的箭头（在右侧，前进方向） */
.grf-arrow-head {
  position: absolute;
  top: 50%;
  right: 0;
  width: 0;
  height: 0;
  transform: translateY(-50%);
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 10px solid rgba(255, 255, 255, 0.95);
  filter: drop-shadow(0 0 6px rgba(170, 255, 238, 0.9))
          drop-shadow(0 0 12px rgba(100, 200, 255, 0.5));
}

/* 箭矢尾迹 - 风系箭矢飞行时拖拽的尾迹（在左侧） */
.grf-arrow-trail {
  position: absolute;
  top: 50%;
  left: 0;
  width: 80%;
  height: 130%;
  transform: translate(-50%, -50%);
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(170, 255, 238, 0.4) 40%,
    rgba(100, 200, 255, 0.3) 70%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(3px);
  mix-blend-mode: screen;
}

/* ================================================================
   阶段三：命中爆发（0.9s ~ 1.7s）—— 在怪物头像处爆炸冲击·风刃飞散·护甲撕裂
   容器通过 position: fixed 定位到怪物头像中心
   ================================================================ */

/* 命中爆发容器 - position: fixed，定位到怪物头像中心 */
.grf-impact-fixed {
  position: fixed;
  width: 0;
  height: 0;
  z-index: 99999;
  pointer-events: none;
}

/* 命中爆炸核心 - 目标位置的风系能量爆发 */
.grf-impact-core {
  position: absolute;
  left: 0;
  top: 0;
  width: 120px;
  height: 120px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(170, 255, 238, 0.9) 15%,
    rgba(127, 255, 212, 0.7) 35%,
    rgba(100, 200, 255, 0.5) 55%,
    transparent 100%
  );
  filter: blur(2px);
  animation: grfImpactCore 0.6s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
}

@keyframes grfImpactCore {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  50% { transform: translate3d(-50%, -50%, 0) scale(2); opacity: 0.8; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3); opacity: 0; }
}

/* 二次爆炸核心 - 延迟爆发的次级能量核 */
.grf-impact-core-2 {
  position: absolute;
  left: 0;
  top: 0;
  width: 70px;
  height: 70px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(127, 255, 212, 0.7) 30%,
    rgba(100, 200, 255, 0.5) 60%,
    transparent 100%
  );
  filter: blur(3px);
  animation: grfImpactCore2 0.5s ease-out forwards;
  animation-delay: 0.15s;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
}

@keyframes grfImpactCore2 {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  25% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3); opacity: 0; }
}

/* 多层冲击波 - 径向扩散的冲击波环 */
.grf-shock-wave {
  position: absolute;
  left: 0;
  top: 0;
  width: 90px;
  height: 90px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  border-radius: 50%;
  border: 3px solid rgba(170, 255, 238, 0.9);
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
}

.grf-wave-1 {
  animation: grfShockWave 0.55s ease-out forwards;
  animation-delay: 0.02s;
  border-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 25px rgba(255, 255, 255, 0.6);
}

.grf-wave-2 {
  animation: grfShockWave 0.55s ease-out forwards;
  animation-delay: 0.1s;
  border-color: rgba(170, 255, 238, 0.85);
  border-width: 3px;
  box-shadow: 0 0 22px rgba(127, 255, 212, 0.6);
}

.grf-wave-3 {
  animation: grfShockWave 0.5s ease-out forwards;
  animation-delay: 0.18s;
  border-color: rgba(100, 200, 255, 0.8);
  border-width: 2px;
  box-shadow: 0 0 20px rgba(100, 200, 255, 0.5);
}

.grf-wave-4 {
  animation: grfShockWave 0.5s ease-out forwards;
  animation-delay: 0.26s;
  border-color: rgba(170, 255, 238, 0.7);
  border-width: 2px;
  box-shadow: 0 0 18px rgba(170, 255, 238, 0.5);
}

@keyframes grfShockWave {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(5.5); opacity: 0; border-width: 1px; }
}

/* 护甲撕裂裂纹 - 表现降低防御力DEBUFF的视觉表现 */
.grf-armor-crack {
  position: absolute;
  left: 0;
  top: 0;
  width: 100px;
  height: 100px;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 100, 100, 0.5) 15deg,
    transparent 30deg,
    rgba(255, 150, 100, 0.4) 60deg,
    transparent 75deg,
    rgba(255, 100, 100, 0.5) 120deg,
    transparent 135deg,
    rgba(255, 150, 100, 0.4) 180deg,
    transparent 195deg,
    rgba(255, 100, 100, 0.5) 240deg,
    transparent 255deg,
    rgba(255, 150, 100, 0.4) 300deg,
    transparent 315deg
  );
  -webkit-mask: radial-gradient(circle, transparent 30%, #000 33%, #000 80%, transparent 85%);
  mask: radial-gradient(circle, transparent 30%, #000 33%, #000 80%, transparent 85%);
  filter: blur(1px);
  animation: grfArmorCrack 0.7s ease-out forwards;
  animation-delay: 0.05s;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
}

@keyframes grfArmorCrack {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(30deg); opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2.5) rotate(180deg); opacity: 0; }
}

/* 命中爆炸风刃 - 命中后围绕目标位置旋转飞散的风刃 */
.grf-impact-blade {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--grf-blade-color, rgba(170, 255, 238, 0.85)) 30%,
    rgba(255, 255, 255, 0.95) 50%,
    var(--grf-blade-color, rgba(127, 255, 212, 0.7)) 70%,
    transparent 100%
  );
  filter: blur(0.5px) drop-shadow(0 0 6px var(--grf-blade-color, rgba(127, 255, 212, 0.7)));
  transform: translate3d(-50%, -50%, 0) rotate(var(--grf-blade-angle)) translateX(0px) scale(0);
  animation: grfBladeScatter linear forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
}

@keyframes grfBladeScatter {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--grf-blade-angle)) translateX(0px) scale(0);
    opacity: 0;
  }
  20% { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(var(--grf-blade-angle)) translateX(20px) scale(1); }
  100% {
    transform: translate3d(-50%, -50%, 0)
      rotate(calc(var(--grf-blade-angle) + 180deg))
      translateX(var(--grf-blade-distance))
      scale(0.4);
    opacity: 0;
  }
}

/* 能量余波 - 命中后的余波涟漪 */
.grf-energy-aftermath {
  position: absolute;
  left: 0;
  top: 0;
  width: 160px;
  height: 160px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 30%,
    rgba(127, 255, 212, 0.3) 45%,
    transparent 55%,
    rgba(100, 200, 255, 0.25) 70%,
    transparent 80%,
    rgba(170, 255, 238, 0.2) 90%,
    transparent 100%
  );
  filter: blur(3px);
  animation: grfEnergyAftermath 0.8s ease-out forwards;
  animation-delay: 0.2s;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
}

@keyframes grfEnergyAftermath {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3); opacity: 0; }
}

/* 终结闪光 - 围绕命中位置的局部闪光 */
.grf-final-flash {
  position: fixed;
  width: 400px;
  height: 400px;
  transform: translate3d(-50%, -50%, 0);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(170, 255, 238, 0.4) 15%,
    rgba(100, 200, 255, 0.25) 30%,
    transparent 60%
  );
  animation: grfFinalFlash 0.45s ease-out forwards;
  animation-delay: 0.05s;
  will-change: opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 99998;
  pointer-events: none;
}

@keyframes grfFinalFlash {
  0% { opacity: 0; }
  15% { opacity: 1; }
  40% { opacity: 0.5; }
  100% { opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .grf-gather-fixed *,
  .grf-impact-fixed *,
  .grf-final-flash {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
