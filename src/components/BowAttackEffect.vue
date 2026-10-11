<!--
  @file BowAttackEffect.vue
  @generated 2026-07-18
  @description 弓箭普通攻击特效动画组件（GPU加速 + Web Animations API）
  装备弓箭武器时，普通攻击命中敌人时显示箭矢飞行特效。
  根据玩家武器攻击属性显示不同颜色的箭矢：
    - 无属性：木质色（棕色木纹）
    - 火属性：红色
    - 水属性：深蓝色
    - 风属性：青蓝色
    - 雷属性：紫色
    - 土属性：棕色

  动画阶段（总时长约0.55秒）：
  1. 箭矢飞行（0s ~ 0.35s）：单支箭矢从玩家头像处抛物线飞向目标怪物头像
  2. 命中爆发（0.3s ~ 0.55s）：目标位置小型元素冲击波，粒子飞溅

  实现方式（参考 GaleRapidFireEffect.vue）：
  - 所有元素通过 Teleport to="body" 渲染到 body，使用 position: fixed 避免被父容器裁剪
  - 通过 getBoundingClientRect() 获取玩家头像(#playerAvatar)和怪物头像(.enemy-icon)的真实屏幕坐标
  - 箭矢飞行动画通过 Web Animations API (element.animate) 驱动，飞行轨迹为抛物线
  - GPU加速：所有动画仅使用 transform（translate3d/scale/rotate）+ opacity，避免Layout/Paint
  - will-change 提前创建合成层，backface-visibility:hidden 消除闪烁
-->

<template>
  <Teleport to="body">
    <!-- ========== 阶段一：箭矢飞行（0s ~ 0.35s）—— 从玩家头像抛物线飞向怪物头像 ========== -->
    <div
      ref="arrowRef"
      class="ba-arrow-fixed"
      :class="`ba-arrow-${elementClass}`"
    >
      <!-- 箭杆 -->
      <div class="ba-arrow-shaft"></div>
      <!-- 箭头 -->
      <div class="ba-arrow-head"></div>
      <!-- 拖尾光晕 -->
      <div class="ba-arrow-trail"></div>
    </div>

    <!-- ========== 阶段二：命中爆发（0.3s ~ 0.55s）—— 在怪物头像处小型元素冲击波 ========== -->
    <div v-if="impactReady" class="ba-impact-fixed" :style="impactFixedStyle" :class="`ba-impact-${elementClass}`">
      <!-- 命中闪光核心 -->
      <div class="ba-impact-core"></div>
      <!-- 冲击波环 -->
      <div class="ba-shock-wave ba-wave-1"></div>
      <div class="ba-shock-wave ba-wave-2"></div>
      <!-- 元素粒子飞溅 -->
      <div
        v-for="spark in impactSparks"
        :key="spark.id"
        class="ba-impact-spark"
        :style="spark.style"
      ></div>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * 弓箭普通攻击特效动画组件
 *
 * 装备弓箭武器时，普通攻击命中敌人时显示箭矢飞行特效。
 * 根据玩家武器攻击属性显示不同颜色的箭矢：
 * - 无属性（none/空）：木质色
 * - 火属性（fire）：红色
 * - 水属性（water）：深蓝色
 * - 风属性（wind）：青蓝色
 * - 雷属性（electricity/thunder）：紫色
 * - 土属性（earth）：棕色
 *
 * 实现方式：
 * - Teleport to body，position: fixed，避免父容器裁剪和 scale 影响
 * - getBoundingClientRect() 获取玩家头像和怪物头像的真实屏幕坐标
 * - Web Animations API 驱动箭矢抛物线飞行，旋转角度跟随切线方向
 * - GPU加速：仅使用 transform + opacity
 *
 * @prop {number} targetIndex - 目标怪物索引（用于定位命中位置）
 * @prop {string} element - 元素属性（'none'|'fire'|'water'|'wind'|'electricity'|'earth'）
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

/** 命中爆发粒子数量 */
const IMPACT_SPARK_COUNT = 8

/** 箭矢飞行速度（像素/秒），用于动态计算飞行时间 */
const ARROW_FLIGHT_SPEED = 1400

/** 命中爆发粒子数据列表 */
const impactSparks = ref([])

/** 箭矢 DOM 引用 */
const arrowRef = ref(null)

/** 命中爆发是否就绪显示 */
const impactReady = ref(false)

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
  /** 元素属性（'none'|'fire'|'water'|'wind'|'electricity'|'earth'） */
  element: {
    type: String,
    default: 'none'
  }
})

/**
 * 元素属性归一化与 CSS 类名映射
 * 将 'thunder' 归一化为 'electricity'，空值归一化为 'none'
 * @returns {string} 元素 CSS 类名后缀
 */
const elementClass = (function () {
  const raw = String(props.element || '').trim().toLowerCase()
  const normalized = raw === 'thunder' ? 'electricity' : raw
  return normalized || 'none'
})()

/**
 * 元素配色配置表
 * 每种元素包含：箭杆渐变、箭头颜色、拖尾颜色、命中闪光、冲击波、粒子配色
 * @type {Object<string, Object>}
 */
const ELEMENT_COLORS = {
  none: {
    name: '木质色',
    shaft: 'linear-gradient(to right, rgba(101, 67, 33, 0.4) 0%, rgba(160, 110, 60, 0.95) 30%, rgba(205, 155, 95, 1) 50%, rgba(160, 110, 60, 0.95) 70%, rgba(101, 67, 33, 0.4) 100%)',
    head: 'rgba(180, 130, 75, 0.95)',
    trail: 'rgba(160, 110, 60, 0.5)',
    impactCore: 'rgba(220, 180, 130, 0.9)',
    shockWave: 'rgba(160, 110, 60, 0.6)',
    spark: ['rgba(205, 155, 95, 0.9)', 'rgba(160, 110, 60, 0.8)', 'rgba(255, 220, 170, 0.85)']
  },
  fire: {
    name: '红色',
    shaft: 'linear-gradient(to right, rgba(180, 30, 10, 0.4) 0%, rgba(255, 80, 30, 0.95) 30%, rgba(255, 180, 60, 1) 50%, rgba(255, 80, 30, 0.95) 70%, rgba(180, 30, 10, 0.4) 100%)',
    head: 'rgba(255, 220, 120, 0.95)',
    trail: 'rgba(255, 100, 30, 0.6)',
    impactCore: 'rgba(255, 240, 180, 0.95)',
    shockWave: 'rgba(255, 100, 30, 0.65)',
    spark: ['rgba(255, 180, 60, 0.9)', 'rgba(255, 100, 30, 0.85)', 'rgba(255, 220, 120, 0.9)']
  },
  water: {
    name: '深蓝色',
    shaft: 'linear-gradient(to right, rgba(10, 40, 100, 0.4) 0%, rgba(30, 90, 184, 0.95) 30%, rgba(80, 150, 230, 1) 50%, rgba(30, 90, 184, 0.95) 70%, rgba(10, 40, 100, 0.4) 100%)',
    head: 'rgba(180, 220, 255, 0.95)',
    trail: 'rgba(50, 120, 220, 0.55)',
    impactCore: 'rgba(200, 230, 255, 0.95)',
    shockWave: 'rgba(50, 120, 220, 0.6)',
    spark: ['rgba(80, 150, 230, 0.9)', 'rgba(30, 90, 184, 0.85)', 'rgba(180, 220, 255, 0.9)']
  },
  wind: {
    name: '青蓝色',
    shaft: 'linear-gradient(to right, rgba(0, 120, 130, 0.4) 0%, rgba(0, 200, 210, 0.95) 30%, rgba(120, 240, 230, 1) 50%, rgba(0, 200, 210, 0.95) 70%, rgba(0, 120, 130, 0.4) 100%)',
    head: 'rgba(180, 255, 245, 0.95)',
    trail: 'rgba(0, 220, 220, 0.55)',
    impactCore: 'rgba(200, 255, 250, 0.95)',
    shockWave: 'rgba(0, 220, 220, 0.6)',
    spark: ['rgba(120, 240, 230, 0.9)', 'rgba(0, 200, 210, 0.85)', 'rgba(180, 255, 245, 0.9)']
  },
  electricity: {
    name: '紫色',
    shaft: 'linear-gradient(to right, rgba(60, 20, 100, 0.4) 0%, rgba(140, 60, 200, 0.95) 30%, rgba(190, 130, 255, 1) 50%, rgba(140, 60, 200, 0.95) 70%, rgba(60, 20, 100, 0.4) 100%)',
    head: 'rgba(220, 180, 255, 0.95)',
    trail: 'rgba(160, 90, 230, 0.6)',
    impactCore: 'rgba(230, 200, 255, 0.95)',
    shockWave: 'rgba(160, 90, 230, 0.65)',
    spark: ['rgba(190, 130, 255, 0.9)', 'rgba(140, 60, 200, 0.85)', 'rgba(220, 180, 255, 0.9)']
  },
  earth: {
    name: '棕色',
    shaft: 'linear-gradient(to right, rgba(80, 50, 30, 0.4) 0%, rgba(130, 90, 60, 0.95) 30%, rgba(170, 130, 95, 1) 50%, rgba(130, 90, 60, 0.95) 70%, rgba(80, 50, 30, 0.4) 100%)',
    head: 'rgba(180, 145, 110, 0.95)',
    trail: 'rgba(120, 80, 50, 0.5)',
    impactCore: 'rgba(200, 165, 125, 0.9)',
    shockWave: 'rgba(120, 80, 50, 0.6)',
    spark: ['rgba(170, 130, 95, 0.9)', 'rgba(120, 80, 50, 0.85)', 'rgba(210, 175, 135, 0.85)']
  }
}

/**
 * 获取当前元素的配色配置
 * @returns {Object} 元素配色对象
 */
function getColors () {
  return ELEMENT_COLORS[elementClass] || ELEMENT_COLORS.none
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

/**
 * 生成命中爆发粒子数据
 * 8颗元素粒子从命中中心向各方向飞溅
 * @returns {Array} 粒子配置数组
 */
function generateImpactSparks () {
  const colors = getColors()
  const list = []
  for (let i = 0; i < IMPACT_SPARK_COUNT; i++) {
    const angle = (i / IMPACT_SPARK_COUNT) * 360 + rand(-15, 15)
    const distance = rand(25, 55)
    const rad = (angle * Math.PI) / 180
    const tx = Math.cos(rad) * distance
    const ty = Math.sin(rad) * distance
    const size = rand(4, 8)
    const color = colors.spark[i % colors.spark.length]
    const delay = rand(0, 0.05)
    const duration = rand(0.25, 0.4)

    list.push({
      id: `ba-spark-${i}`,
      style: {
        '--ba-spark-tx': `${tx}px`,
        '--ba-spark-ty': `${ty}px`,
        '--ba-spark-size': `${size}px`,
        '--ba-spark-color': color,
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
 * @param {number} t - 进度 [0, 1]
 * @param {number} startX - 起点 X
 * @param {number} startY - 起点 Y
 * @param {number} endX - 终点 X
 * @param {number} endY - 终点 Y
 * @param {number} arc - 抛物线弧度偏移（负值=向上凸起）
 * @returns {{x: number, y: number}} 抛物线上的坐标
 */
function parabolaPoint (t, startX, startY, endX, endY, arc) {
  const x = startX + (endX - startX) * t
  const y = startY + (endY - startY) * t + arc * 4 * t * (1 - t)
  return { x, y }
}

/**
 * 计算抛物线上某一点的切线角度（度）
 * 让箭矢旋转方向跟随飞行轨迹切线，视觉更自然
 * @param {number} t - 进度 [0, 1]
 * @param {number} startX - 起点 X
 * @param {number} startY - 起点 Y
 * @param {number} endX - 终点 X
 * @param {number} endY - 终点 Y
 * @param {number} arc - 抛物线弧度偏移
 * @returns {number} 切线角度（度）
 */
function parabolaTangentAngle (t, startX, startY, endX, endY, arc) {
  const dy = (endY - startY) + arc * 4 * (1 - 2 * t)
  const dx = (endX - startX)
  return Math.atan2(dy, dx) * 180 / Math.PI
}

/**
 * 使用 Web Animations API 启动箭矢的抛物线飞行动画
 * 箭矢从玩家头像中心飞向怪物头像中心，飞行轨迹为抛物线
 * 旋转角度跟随抛物线切线方向
 * @param {HTMLElement} arrowEl - 箭矢 DOM 元素
 * @param {number} duration - 飞行持续时间（毫秒）
 */
function startArrowFlight (arrowEl, duration) {
  if (!arrowEl) return

  // 飞行起点和终点
  const sX = playerCenterX
  const sY = playerCenterY
  const eX = targetCenterX
  const eY = targetCenterY

  // 抛物线弧度偏移（负值=向上凸起），根据飞行距离动态调整
  const flightDistance = Math.hypot(eX - sX, eY - sY)
  const arcOffset = -Math.max(30, Math.min(80, flightDistance * 0.12))

  // 箭矢容器宽高的一半（用于居中定位）
  const halfW = 22
  const halfH = 5

  // 抛物线插值辅助函数
  const point = (t) => parabolaPoint(t, sX, sY, eX, eY, arcOffset)
  const tangent = (t) => parabolaTangentAngle(t, sX, sY, eX, eY, arcOffset)

  // 构建抛物线飞行的关键帧
  const keyframes = [
    {
      transform: `translate3d(${sX - halfW}px, ${sY - halfH}px, 0) rotate(${tangent(0)}deg) scale(0.4)`,
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
      transform: `translate3d(${point(0.85).x - halfW}px, ${point(0.85).y - halfH}px, 0) rotate(${tangent(0.85)}deg) scale(0.95)`,
      opacity: 1,
      offset: 0.85
    },
    {
      transform: `translate3d(${eX - halfW}px, ${eY - halfH}px, 0) rotate(${tangent(1)}deg) scale(0.6)`,
      opacity: 0
    }
  ]

  const anim = arrowEl.animate(keyframes, {
    duration,
    easing: 'cubic-bezier(0.3, 0.1, 0.3, 1)',
    fill: 'forwards'
  })
  animations.push(anim)
}

/**
 * 组件挂载后：
 * 1. 获取玩家头像和怪物头像的屏幕坐标
 * 2. 设置命中爆发的 fixed 定位
 * 3. 启动箭矢飞行动画
 * 4. 延迟触发命中爆发
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

    // 设置命中爆发定位（怪物头像中心）
    impactFixedStyle.value = {
      left: `${targetCenterX}px`,
      top: `${targetCenterY}px`
    }

    // 生成粒子数据
    impactSparks.value = generateImpactSparks()

    // 等待 DOM 渲染完成后启动箭矢动画
    await nextTick()
    requestAnimationFrame(() => {
      // 飞行距离
      const distance = Math.hypot(targetCenterX - playerCenterX, targetCenterY - playerCenterY)
      // 飞行时间根据距离动态计算（250ms ~ 380ms），普通攻击需要快速反馈
      const durationMs = Math.max(250, Math.min(380, Math.round(distance / ARROW_FLIGHT_SPEED * 1000)))
      startArrowFlight(arrowRef.value, durationMs)

      // 延迟触发命中爆发（箭矢到达时）
      const impactTimer = setTimeout(() => {
        impactReady.value = true
      }, durationMs - 50)
      timers.push(impactTimer)
    })
  } catch (e) {
    console.warn('[BowAttackEffect] 初始化失败:', e)
    // 出错时直接显示命中爆发
    impactReady.value = true
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
   阶段一：箭矢飞行 —— position: fixed，通过 Web Animations API 驱动
   箭矢容器宽44px 高10px，内含箭杆、箭头、拖尾
   ================================================================ */
.ba-arrow-fixed {
  position: fixed;
  left: 0;
  top: 0;
  width: 44px;
  height: 10px;
  z-index: 99998;
  pointer-events: none;
  will-change: transform, opacity;
  backface-visibility: hidden;
  opacity: 0;
}

/* 箭杆 - 元素属性着色，通过 CSS 变量驱动 */
.ba-arrow-shaft {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translate3d(0, -50%, 0);
  width: 28px;
  height: 3px;
  border-radius: 1px;
  will-change: opacity;
}

/* 箭头 - 锐角三角，位于箭杆前端（右侧），箭头朝右 */
.ba-arrow-head {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translate3d(0, -50%, 0);
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 12px solid rgba(255, 255, 255, 0.95);
  will-change: opacity;
}

/* 拖尾光晕 - 箭杆尾端（左侧）的光轨 */
.ba-arrow-trail {
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translate3d(0, -50%, 0);
  width: 14px;
  height: 8px;
  border-radius: 50%;
  opacity: 0.6;
  filter: blur(2px);
  will-change: opacity;
}

/* ========== 元素属性配色 ========== */

/* 木质色（无属性） */
.ba-arrow-none .ba-arrow-shaft {
  background: linear-gradient(to right, rgba(101, 67, 33, 0.4) 0%, rgba(160, 110, 60, 0.95) 30%, rgba(205, 155, 95, 1) 50%, rgba(160, 110, 60, 0.95) 70%, rgba(101, 67, 33, 0.4) 100%);
}
.ba-arrow-none .ba-arrow-head {
  border-left-color: rgba(180, 130, 75, 0.95);
  filter: drop-shadow(0 0 3px rgba(160, 110, 60, 0.6));
}
.ba-arrow-none .ba-arrow-trail {
  background: radial-gradient(ellipse, rgba(160, 110, 60, 0.5) 0%, transparent 70%);
}

/* 火属性 - 红色 */
.ba-arrow-fire .ba-arrow-shaft {
  background: linear-gradient(to right, rgba(180, 30, 10, 0.4) 0%, rgba(255, 80, 30, 0.95) 30%, rgba(255, 180, 60, 1) 50%, rgba(255, 80, 30, 0.95) 70%, rgba(180, 30, 10, 0.4) 100%);
}
.ba-arrow-fire .ba-arrow-head {
  border-left-color: rgba(255, 220, 120, 0.95);
  filter: drop-shadow(0 0 4px rgba(255, 100, 30, 0.8));
}
.ba-arrow-fire .ba-arrow-trail {
  background: radial-gradient(ellipse, rgba(255, 100, 30, 0.6) 0%, transparent 70%);
}

/* 水属性 - 深蓝色 */
.ba-arrow-water .ba-arrow-shaft {
  background: linear-gradient(to right, rgba(10, 40, 100, 0.4) 0%, rgba(30, 90, 184, 0.95) 30%, rgba(80, 150, 230, 1) 50%, rgba(30, 90, 184, 0.95) 70%, rgba(10, 40, 100, 0.4) 100%);
}
.ba-arrow-water .ba-arrow-head {
  border-left-color: rgba(180, 220, 255, 0.95);
  filter: drop-shadow(0 0 4px rgba(50, 120, 220, 0.8));
}
.ba-arrow-water .ba-arrow-trail {
  background: radial-gradient(ellipse, rgba(50, 120, 220, 0.55) 0%, transparent 70%);
}

/* 风属性 - 青蓝色 */
.ba-arrow-wind .ba-arrow-shaft {
  background: linear-gradient(to right, rgba(0, 120, 130, 0.4) 0%, rgba(0, 200, 210, 0.95) 30%, rgba(120, 240, 230, 1) 50%, rgba(0, 200, 210, 0.95) 70%, rgba(0, 120, 130, 0.4) 100%);
}
.ba-arrow-wind .ba-arrow-head {
  border-left-color: rgba(180, 255, 245, 0.95);
  filter: drop-shadow(0 0 4px rgba(0, 220, 220, 0.8));
}
.ba-arrow-wind .ba-arrow-trail {
  background: radial-gradient(ellipse, rgba(0, 220, 220, 0.55) 0%, transparent 70%);
}

/* 雷属性 - 紫色 */
.ba-arrow-electricity .ba-arrow-shaft {
  background: linear-gradient(to right, rgba(60, 20, 100, 0.4) 0%, rgba(140, 60, 200, 0.95) 30%, rgba(190, 130, 255, 1) 50%, rgba(140, 60, 200, 0.95) 70%, rgba(60, 20, 100, 0.4) 100%);
}
.ba-arrow-electricity .ba-arrow-head {
  border-left-color: rgba(220, 180, 255, 0.95);
  filter: drop-shadow(0 0 4px rgba(160, 90, 230, 0.8));
}
.ba-arrow-electricity .ba-arrow-trail {
  background: radial-gradient(ellipse, rgba(160, 90, 230, 0.6) 0%, transparent 70%);
}

/* 土属性 - 棕色 */
.ba-arrow-earth .ba-arrow-shaft {
  background: linear-gradient(to right, rgba(80, 50, 30, 0.4) 0%, rgba(130, 90, 60, 0.95) 30%, rgba(170, 130, 95, 1) 50%, rgba(130, 90, 60, 0.95) 70%, rgba(80, 50, 30, 0.4) 100%);
}
.ba-arrow-earth .ba-arrow-head {
  border-left-color: rgba(180, 145, 110, 0.95);
  filter: drop-shadow(0 0 3px rgba(120, 80, 50, 0.7));
}
.ba-arrow-earth .ba-arrow-trail {
  background: radial-gradient(ellipse, rgba(120, 80, 50, 0.5) 0%, transparent 70%);
}

/* ================================================================
   阶段二：命中爆发 —— position: fixed，定位到怪物头像中心
   ================================================================ */
.ba-impact-fixed {
  position: fixed;
  width: 0;
  height: 0;
  z-index: 99999;
  pointer-events: none;
}

/* 命中闪光核心 - 圆形爆闪 */
.ba-impact-core {
  position: absolute;
  left: 0;
  top: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: baImpactCore 0.3s ease-out forwards;
  will-change: transform, opacity;
  z-index: 2;
}

@keyframes baImpactCore {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) scale(1.8); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3.5); opacity: 0; }
}

/* 冲击波环 - 从命中中心向外扩散 */
.ba-shock-wave {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  z-index: 1;
}

.ba-wave-1 {
  width: 60px;
  height: 60px;
  border: 2px solid;
  animation: baShockExpand 0.4s ease-out forwards;
}

.ba-wave-2 {
  width: 45px;
  height: 45px;
  border: 1.5px solid;
  animation: baShockExpand 0.35s ease-out 0.05s forwards;
}

@keyframes baShockExpand {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  20% { opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2.2); opacity: 0; }
}

/* 元素粒子飞溅 - 从命中中心向各方向飞射 */
.ba-impact-spark {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--ba-spark-size, 6px);
  height: var(--ba-spark-size, 6px);
  border-radius: 50%;
  background: var(--ba-spark-color, rgba(255, 255, 255, 0.9));
  box-shadow: 0 0 4px var(--ba-spark-color, rgba(255, 255, 255, 0.6));
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  backface-visibility: hidden;
  animation: baSparkScatter ease-out forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes baSparkScatter {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  20% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) scale(1.2);
  }
  100% {
    transform: translate3d(calc(-50% + var(--ba-spark-tx, 0px)), calc(-50% + var(--ba-spark-ty, 0px)), 0) scale(0.3);
    opacity: 0;
  }
}

/* ========== 命中爆发元素配色 ========== */

/* 木质色（无属性） */
.ba-impact-none .ba-impact-core {
  background: radial-gradient(circle, rgba(255, 245, 220, 0.95) 0%, rgba(220, 180, 130, 0.9) 30%, rgba(160, 110, 60, 0.4) 65%, transparent 100%);
}
.ba-impact-none .ba-shock-wave {
  border-color: rgba(160, 110, 60, 0.6);
  box-shadow: 0 0 6px rgba(160, 110, 60, 0.4);
}

/* 火属性 */
.ba-impact-fire .ba-impact-core {
  background: radial-gradient(circle, rgba(255, 255, 240, 0.95) 0%, rgba(255, 220, 120, 0.95) 30%, rgba(255, 100, 30, 0.4) 65%, transparent 100%);
}
.ba-impact-fire .ba-shock-wave {
  border-color: rgba(255, 100, 30, 0.65);
  box-shadow: 0 0 8px rgba(255, 100, 30, 0.5);
}

/* 水属性 */
.ba-impact-water .ba-impact-core {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(200, 230, 255, 0.95) 30%, rgba(50, 120, 220, 0.4) 65%, transparent 100%);
}
.ba-impact-water .ba-shock-wave {
  border-color: rgba(50, 120, 220, 0.6);
  box-shadow: 0 0 8px rgba(50, 120, 220, 0.5);
}

/* 风属性 */
.ba-impact-wind .ba-impact-core {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(200, 255, 250, 0.95) 30%, rgba(0, 220, 220, 0.4) 65%, transparent 100%);
}
.ba-impact-wind .ba-shock-wave {
  border-color: rgba(0, 220, 220, 0.6);
  box-shadow: 0 0 8px rgba(0, 220, 220, 0.5);
}

/* 雷属性 */
.ba-impact-electricity .ba-impact-core {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(230, 200, 255, 0.95) 30%, rgba(160, 90, 230, 0.4) 65%, transparent 100%);
}
.ba-impact-electricity .ba-shock-wave {
  border-color: rgba(160, 90, 230, 0.65);
  box-shadow: 0 0 8px rgba(160, 90, 230, 0.5);
}

/* 土属性 */
.ba-impact-earth .ba-impact-core {
  background: radial-gradient(circle, rgba(255, 245, 230, 0.9) 0%, rgba(200, 165, 125, 0.9) 30%, rgba(120, 80, 50, 0.4) 65%, transparent 100%);
}
.ba-impact-earth .ba-shock-wave {
  border-color: rgba(120, 80, 50, 0.6);
  box-shadow: 0 0 6px rgba(120, 80, 50, 0.4);
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .ba-impact-core,
  .ba-shock-wave,
  .ba-impact-spark {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
