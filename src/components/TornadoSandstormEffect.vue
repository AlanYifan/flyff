<!--
  @file TornadoSandstormEffect.vue
  @generated 2026-06-29
  @description 风沙吞噬·龙卷风3D特效动画组件
  技能名称：风沙吞噬
  技能描述：用3D技术模拟真实的龙卷风+沙尘暴，企图吞噬一切的感觉

  特效设计（Canvas 2D + 3D透视投影粒子系统）

  三阶段动画：
  阶段1 - 聚沙成塔 (0~0.8s)：地面沙尘汇聚，漏斗从地面升起
  阶段2 - 肆虐吞噬 (0.8~2.8s)：完整龙卷风，吞噬地面一切，碎片飞射
  阶段3 - 消散余尘 (2.8~3.5s)：龙卷风减弱消散，余尘飘散

  3D技术核心：
  - 透视投影：screenX = cx + (x * focal) / (focal + z)
  - 深度排序：按z值从远到近绘制，保证遮挡关系正确
  - 深度缩放：近大远小，size *= focal / (focal + z)
  - 深度透明度：远处粒子更透明
  - 多层粒子系统：漏斗沙粒 + 地面吸入 + 飞射碎片 + 顶部尘云 + 环境风沙

  性能优化：
  - requestAnimationFrame 驱动动画循环
  - 时间切片：单帧预算8ms，超时则跳过部分粒子更新
  - 粒子总量约400，Z排序后批量绘制
  - contain: layout paint style 隔离重排重绘
-->
<template>
  <canvas
    v-show="isVisible"
    ref="canvasRef"
    class="tornado-canvas"
  ></canvas>
</template>

<script setup>
/**
 * 风沙吞噬·龙卷风3D特效动画组件
 * 使用Canvas 2D + 3D透视投影模拟真实龙卷风+沙尘暴
 *
 * 核心特性：
 * 1. 三阶段动画：聚沙成塔→肆虐吞噬→消散余尘
 * 2. 3D透视投影：粒子拥有(x,y,z)三维坐标，投影到2D屏幕
 * 3. 深度排序：按z值排序后绘制，保证遮挡关系正确
 * 4. 五层粒子系统：漏斗沙粒/地面吸入/飞射碎片/顶部尘云/环境风沙
 * 5. 龙卷风摇摆：中心轴随时间正弦摆动，模拟真实龙卷风形态
 * 6. 吞噬效果：地面粒子螺旋吸入龙卷风底部，"吞噬一切"
 * 7. requestAnimationFrame + 时间切片保证性能
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

// ==================== 响应式状态 ====================

/** 动画可见性 */
const isVisible = ref(false)

/** Canvas元素引用 */
const canvasRef = ref(null)

// ==================== 常量配置 ====================

/** 动画总持续时间（毫秒） */
const ANIMATION_DURATION_MS = 3500

/** 清理缓冲时间（毫秒） */
const CLEANUP_BUFFER_MS = 200

/** 单帧时间预算（毫秒），超时则跳过部分粒子更新 */
const FRAME_BUDGET_MS = 8

/** 3D透视焦距 */
const FOCAL_LENGTH = 400

/** 摄像机俯视系数（Y轴向后倾斜量） */
const CAMERA_TILT = 0.15

/** 各阶段时间节点（秒） */
const PHASE_FORM_END = 0.8
const PHASE_RAMPAGE_END = 2.8

/** 粒子数量配置 */
const FUNNEL_COUNT = 180
const SUCTION_COUNT = 70
const DEBRIS_COUNT = 25
const DUST_CLOUD_COUNT = 50
const AMBIENT_COUNT = 50

/** 龙卷风尺寸常量（相对canvas高度的比例） */
const TORNADO_BOTTOM_R = 12
const TORNADO_TOP_R = 110
const TORNADO_H_RATIO = 0.75

/** 龙卷风摇摆参数 */
const SWAY_AMP = 25
const SWAY_FREQ = 1.2

// ==================== 内部变量 ====================

/** Canvas 2D上下文 */
let ctx = null

/** 动画帧ID */
let rafId = null

/** 动画开始时间戳 */
let startTime = 0

/** 清理定时器 */
let cleanupTimer = null

/** Canvas逻辑尺寸 */
let cw = 0
let ch = 0

/** 龙卷风中心X（屏幕坐标） */
let cx = 0
/** 地面线Y（屏幕坐标） */
let groundY = 0
/** 龙卷风总高度（3D空间） */
let tornadoH = 0

/** 设备像素比 */
let dpr = 1

/** 粒子数组 */
let funnelP = []
let suctionP = []
let debrisP = []
let dustP = []
let ambientP = []

/** 地面冲击波列表 */
let groundWaves = []

// ==================== 3D投影 ====================

/**
 * 3D点到2D屏幕坐标的透视投影
 * @param {number} x - 3D空间X（左右）
 * @param {number} y - 3D空间Y（上下，0=地面）
 * @param {number} z - 3D空间Z（深度，正值远离观察者）
 * @returns {{sx: number, sy: number, scale: number}} 屏幕坐标和缩放比
 */
function project (x, y, z) {
  const ty = y - z * CAMERA_TILT
  const depth = FOCAL_LENGTH + z
  const s = FOCAL_LENGTH / depth
  return { sx: cx + x * s, sy: groundY - ty * s, scale: s }
}

// ==================== 粒子初始化 ====================

/**
 * 初始化漏斗沙粒
 * 粒子在漏斗壁上螺旋上升，底部窄顶部宽
 */
function initFunnel () {
  funnelP = []
  for (let i = 0; i < FUNNEL_COUNT; i++) {
    const hNorm = Math.random()
    funnelP.push({
      hNorm,
      angle: Math.random() * Math.PI * 2,
      angularSpeed: (3.5 - hNorm * 2) * (0.8 + Math.random() * 0.4),
      riseSpeed: (0.3 + Math.random() * 0.4) * (60 + hNorm * 40),
      radiusJitter: 0.85 + Math.random() * 0.3,
      size: 1.5 + Math.random() * 3,
      hue: 30 + Math.random() * 20,
      sat: 25 + Math.random() * 25,
      light: 35 + Math.random() * 25,
      alpha: 0.4 + Math.random() * 0.4,
      hNormOffset: 0
    })
  }
}

/**
 * 初始化地面吸入粒子
 * 从地面随机位置螺旋吸入龙卷风底部
 */
function initSuction () {
  suctionP = []
  for (let i = 0; i < SUCTION_COUNT; i++) {
    const startAngle = Math.random() * Math.PI * 2
    const startRadius = 60 + Math.random() * 120
    suctionP.push({
      angle: startAngle,
      radius: startRadius,
      startRadius,
      spiralSpeed: 1.5 + Math.random() * 1.5,
      shrinkSpeed: 25 + Math.random() * 30,
      riseSpeed: 20 + Math.random() * 30,
      y: 0,
      size: 2 + Math.random() * 3,
      hue: 28 + Math.random() * 15,
      sat: 30 + Math.random() * 20,
      light: 30 + Math.random() * 20,
      alpha: 0.5 + Math.random() * 0.3,
      delay: Math.random() * 0.6,
      absorbed: false
    })
  }
}

/**
 * 初始化飞射碎片
 * 从龙卷风中上部向外抛射的大颗粒碎片
 */
function initDebris () {
  debrisP = []
  for (let i = 0; i < DEBRIS_COUNT; i++) {
    debrisP.push({
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      size: 3 + Math.random() * 4,
      hue: 25 + Math.random() * 20,
      sat: 20 + Math.random() * 20,
      light: 25 + Math.random() * 15,
      alpha: 0.7 + Math.random() * 0.3,
      life: 0,
      maxLife: 0.8 + Math.random() * 0.6,
      delay: Math.random() * 1.5 + 0.5,
      launched: false,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 8
    })
  }
}

/**
 * 初始化顶部尘云粒子
 * 龙卷风顶部的扩散尘云
 */
function initDustCloud () {
  dustP = []
  for (let i = 0; i < DUST_CLOUD_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * TORNADO_TOP_R * 0.8
    dustP.push({
      angle,
      radius,
      expandSpeed: 15 + Math.random() * 25,
      angularSpeed: 0.5 + Math.random() * 0.8,
      y: tornadoH * (0.85 + Math.random() * 0.15),
      ySpeed: 5 + Math.random() * 10,
      size: 8 + Math.random() * 20,
      hue: 30 + Math.random() * 15,
      sat: 15 + Math.random() * 15,
      light: 30 + Math.random() * 15,
      alpha: 0.08 + Math.random() * 0.12,
      delay: Math.random() * 0.5
    })
  }
}

/**
 * 初始化环境风沙粒子
 * 背景横向吹过的沙尘，营造沙尘暴氛围
 */
function initAmbient () {
  ambientP = []
  for (let i = 0; i < AMBIENT_COUNT; i++) {
    ambientP.push({
      x: (Math.random() - 0.5) * cw * 2,
      y: Math.random() * ch,
      z: Math.random() * 300 - 50,
      vx: 80 + Math.random() * 120,
      vy: (Math.random() - 0.5) * 20,
      size: 1 + Math.random() * 2.5,
      hue: 30 + Math.random() * 15,
      sat: 20 + Math.random() * 15,
      light: 40 + Math.random() * 20,
      alpha: 0.15 + Math.random() * 0.25,
      wave: Math.random() * Math.PI * 2,
      waveSpeed: 1 + Math.random() * 2
    })
  }
}

/**
 * 初始化地面冲击波
 * 龙卷风底部扩散的地面尘环
 */
function initGroundWaves () {
  groundWaves = []
  for (let i = 0; i < 3; i++) {
    groundWaves.push({
      radius: 0,
      maxRadius: 80 + i * 30,
      delay: i * 0.4,
      alpha: 0.3 - i * 0.08,
      speed: 60 + i * 20
    })
  }
}

// ==================== 粒子更新逻辑 ====================

/**
 * 获取龙卷风中心X偏移（摇摆）
 * @param {number} t - 动画时间（秒）
 * @returns {number} X偏移量
 */
function getSwayX (t) {
  return Math.sin(t * SWAY_FREQ) * SWAY_AMP + Math.sin(t * SWAY_FREQ * 2.3) * SWAY_AMP * 0.3
}

/**
 * 获取当前高度对应的漏斗半径
 * @param {number} hNorm - 高度归一化(0~1)
 * @returns {number} 漏斗半径
 */
function getFunnelRadius (hNorm) {
  return TORNADO_BOTTOM_R + (TORNADO_TOP_R - TORNADO_BOTTOM_R) * hNorm
}

/**
 * 获取阶段强度系数
 * @param {number} t - 动画时间（秒）
 * @returns {number} 强度系数(0~1)
 */
function getIntensity (t) {
  if (t < PHASE_FORM_END) {
    return t / PHASE_FORM_END
  } else if (t < PHASE_RAMPAGE_END) {
    return 1.0
  } else {
    const fadeT = (t - PHASE_RAMPAGE_END) / (ANIMATION_DURATION_MS / 1000 - PHASE_RAMPAGE_END)
    return Math.max(0, 1 - fadeT)
  }
}

/**
 * 更新漏斗沙粒
 * @param {number} dt - 时间增量（秒）
 * @param {number} t - 动画时间（秒）
 */
function updateFunnel (dt, t) {
  const intensity = getIntensity(t)
  const swayX = getSwayX(t)
  for (let i = 0; i < funnelP.length; i++) {
    const p = funnelP[i]
    // 旋转
    p.angle += p.angularSpeed * dt
    // 上升
    p.hNormOffset += p.riseSpeed * dt / tornadoH
    let hNorm = (p.hNorm + p.hNormOffset) % 1
    if (hNorm < 0) hNorm += 1
    // 阶段1时漏斗从底部向上生长
    if (t < PHASE_FORM_END) {
      const growth = t / PHASE_FORM_END
      if (hNorm > growth) {
        hNorm = hNorm * growth
      }
    }
    p.hNorm = hNorm
    const radius = getFunnelRadius(hNorm) * p.radiusJitter * intensity
    const height = hNorm * tornadoH
    p._x = swayX + Math.cos(p.angle) * radius
    p._y = height
    p._z = Math.sin(p.angle) * radius
    p._renderAlpha = p.alpha * intensity
  }
}

/**
 * 更新地面吸入粒子
 * @param {number} dt - 时间增量（秒）
 * @param {number} t - 动画时间（秒）
 */
function updateSuction (dt, t) {
  const intensity = getIntensity(t)
  const swayX = getSwayX(t)
  for (let i = 0; i < suctionP.length; i++) {
    const p = suctionP[i]
    if (t < p.delay) {
      p._renderAlpha = 0
      continue
    }
    if (p.absorbed) {
      // 被吸入后转为漏斗粒子行为
      p.angle += p.spiralSpeed * 1.5 * dt
      p.y += p.riseSpeed * dt
      p.radius += 5 * dt
      if (p.y > tornadoH * 0.5) {
        // 重置
        p.absorbed = false
        p.angle = Math.random() * Math.PI * 2
        p.radius = 60 + Math.random() * 120
        p.y = 0
      }
    } else {
      // 螺旋吸入
      p.angle += p.spiralSpeed * dt
      p.radius -= p.shrinkSpeed * dt
      if (p.radius <= TORNADO_BOTTOM_R) {
        p.absorbed = true
      }
    }
    p._x = swayX + Math.cos(p.angle) * p.radius
    p._y = p.y
    p._z = Math.sin(p.angle) * p.radius
    p._renderAlpha = p.alpha * intensity
  }
}

/**
 * 更新飞射碎片
 * @param {number} dt - 时间增量（秒）
 * @param {number} t - 动画时间（秒）
 */
function updateDebris (dt, t) {
  const intensity = getIntensity(t)
  const swayX = getSwayX(t)
  for (let i = 0; i < debrisP.length; i++) {
    const p = debrisP[i]
    if (t < p.delay) {
      p._renderAlpha = 0
      continue
    }
    if (!p.launched) {
      // 从龙卷风中上部发射
      const launchH = tornadoH * (0.4 + Math.random() * 0.4)
      const launchR = getFunnelRadius(launchH / tornadoH)
      const launchAngle = Math.random() * Math.PI * 2
      p.x = swayX + Math.cos(launchAngle) * launchR
      p.y = launchH
      p.z = Math.sin(launchAngle) * launchR
      const ejectAngle = Math.random() * Math.PI * 2
      const ejectSpeed = 80 + Math.random() * 120
      p.vx = Math.cos(ejectAngle) * ejectSpeed
      p.vz = Math.sin(ejectAngle) * ejectSpeed
      p.vy = 40 + Math.random() * 60
      p.launched = true
      p.life = 0
    }
    // 物理：重力 + 空气阻力
    p.vy -= 200 * dt
    p.vx *= (1 - 0.5 * dt)
    p.vz *= (1 - 0.5 * dt)
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.z += p.vz * dt
    p.rotation += p.rotSpeed * dt
    p.life += dt
    p._x = p.x
    p._y = p.y
    p._z = p.z
    // 淡出
    const lifeRatio = p.life / p.maxLife
    p._renderAlpha = p.alpha * intensity * (1 - lifeRatio)
    // 碰地重置
    if (p.y <= 0 || p.life >= p.maxLife) {
      p.launched = false
      p.delay = t + Math.random() * 0.8 + 0.3
    }
  }
}

/**
 * 更新顶部尘云
 * @param {number} dt - 时间增量（秒）
 * @param {number} t - 动画时间（秒）
 */
function updateDustCloud (dt, t) {
  const intensity = getIntensity(t)
  const swayX = getSwayX(t)
  for (let i = 0; i < dustP.length; i++) {
    const p = dustP[i]
    if (t < p.delay) {
      p._renderAlpha = 0
      continue
    }
    p.angle += p.angularSpeed * dt
    p.radius += p.expandSpeed * dt
    p.y += p.ySpeed * dt
    p._x = swayX + Math.cos(p.angle) * p.radius
    p._y = p.y
    p._z = Math.sin(p.angle) * p.radius
    p._renderAlpha = p.alpha * intensity
  }
}

/**
 * 更新环境风沙
 * @param {number} dt - 时间增量（秒）
 * @param {number} t - 动画时间（秒）
 */
function updateAmbient (dt, t) {
  const intensity = getIntensity(t)
  for (let i = 0; i < ambientP.length; i++) {
    const p = ambientP[i]
    p.x += p.vx * dt
    p.wave += p.waveSpeed * dt
    p.y += p.vy * dt + Math.sin(p.wave) * 15 * dt
    // 循环
    if (p.x > cw) {
      p.x = -cw * 0.5
      p.y = Math.random() * ch
    }
    p._x = p.x - cx
    p._y = groundY - p.y
    p._z = p.z
    p._renderAlpha = p.alpha * (0.3 + intensity * 0.7)
  }
}

/**
 * 更新地面冲击波
 * @param {number} dt - 时间增量（秒）
 * @param {number} t - 动画时间（秒）
 */
function updateGroundWaves (dt, t) {
  const intensity = getIntensity(t)
  for (let i = 0; i < groundWaves.length; i++) {
    const w = groundWaves[i]
    if (t < w.delay) {
      w._renderAlpha = 0
      continue
    }
    const cycle = ((t - w.delay) % 1.5) / 1.5
    w.radius = cycle * w.maxRadius
    w._renderAlpha = w.alpha * intensity * (1 - cycle)
  }
}

// ==================== 渲染 ====================

/**
 * 收集所有粒子并按深度排序后绘制
 * @param {number} t - 动画时间（秒）
 */
function render (t) {
  ctx.clearRect(0, 0, cw, ch)

  // 1. 绘制环境暗化背景
  const intensity = getIntensity(t)
  const bgGrad = ctx.createRadialGradient(cx, groundY - tornadoH * 0.4, 0, cx, groundY, cw * 0.8)
  bgGrad.addColorStop(0, `rgba(60, 40, 20, ${0.15 * intensity})`)
  bgGrad.addColorStop(0.5, `rgba(40, 25, 10, ${0.08 * intensity})`)
  bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, cw, ch)

  // 2. 绘制地面冲击波（椭圆环）
  const swayX = getSwayX(t)
  for (let i = 0; i < groundWaves.length; i++) {
    const w = groundWaves[i]
    if (!w._renderAlpha || w._renderAlpha <= 0) continue
    const p = project(swayX, 0, 0)
    ctx.save()
    ctx.strokeStyle = `rgba(180, 140, 80, ${w._renderAlpha})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(p.sx, p.sy, w.radius * p.scale, w.radius * p.scale * 0.3, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  // 3. 收集所有可渲染粒子
  const allParticles = []

  // 环境风沙（背景层，不参与深度排序，先绘制）
  for (let i = 0; i < ambientP.length; i++) {
    const p = ambientP[i]
    if (!p._renderAlpha || p._renderAlpha <= 0) continue
    const proj = project(p._x, p._y, p._z)
    const sz = p.size * proj.scale
    ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${p._renderAlpha})`
    ctx.beginPath()
    ctx.arc(proj.sx, proj.sy, sz, 0, Math.PI * 2)
    ctx.fill()
  }

  // 收集需要深度排序的粒子
  for (let i = 0; i < funnelP.length; i++) {
    const p = funnelP[i]
    if (!p._renderAlpha || p._renderAlpha <= 0) continue
    allParticles.push({ p, z: p._z, type: 'funnel' })
  }
  for (let i = 0; i < suctionP.length; i++) {
    const p = suctionP[i]
    if (!p._renderAlpha || p._renderAlpha <= 0) continue
    allParticles.push({ p, z: p._z, type: 'suction' })
  }
  for (let i = 0; i < debrisP.length; i++) {
    const p = debrisP[i]
    if (!p._renderAlpha || p._renderAlpha <= 0) continue
    allParticles.push({ p, z: p._z, type: 'debris' })
  }
  for (let i = 0; i < dustP.length; i++) {
    const p = dustP[i]
    if (!p._renderAlpha || p._renderAlpha <= 0) continue
    allParticles.push({ p, z: p._z, type: 'dust' })
  }

  // 4. 按z从远到近排序（z大的远，先画）
  allParticles.sort((a, b) => b.z - a.z)

  // 5. 绘制排序后的粒子
  for (let i = 0; i < allParticles.length; i++) {
    const item = allParticles[i]
    const p = item.p
    const proj = project(p._x, p._y, p._z)
    const sz = Math.max(0.5, p.size * proj.scale)
    const depthAlpha = Math.min(1, proj.scale * 1.2)
    const finalAlpha = p._renderAlpha * depthAlpha

    if (item.type === 'dust') {
      // 尘云粒子用径向渐变
      const grad = ctx.createRadialGradient(proj.sx, proj.sy, 0, proj.sx, proj.sy, sz)
      grad.addColorStop(0, `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${finalAlpha})`)
      grad.addColorStop(1, `hsla(${p.hue}, ${p.sat}%, ${p.light}%, 0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(proj.sx, proj.sy, sz, 0, Math.PI * 2)
      ctx.fill()
    } else if (item.type === 'debris') {
      // 碎片用旋转矩形
      ctx.save()
      ctx.translate(proj.sx, proj.sy)
      ctx.rotate(p.rotation)
      ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${finalAlpha})`
      ctx.fillRect(-sz / 2, -sz / 2, sz, sz * 0.6)
      ctx.restore()
    } else {
      // 普通沙粒用圆形
      ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${finalAlpha})`
      ctx.beginPath()
      ctx.arc(proj.sx, proj.sy, sz, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // 6. 绘制底部暗影（地面被吞噬区域）
  if (intensity > 0.1) {
    const shadowP = project(swayX, 0, 0)
    const shadowGrad = ctx.createRadialGradient(shadowP.sx, shadowP.sy, 0, shadowP.sx, shadowP.sy, 40 * shadowP.scale)
    shadowGrad.addColorStop(0, `rgba(20, 10, 0, ${0.6 * intensity})`)
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = shadowGrad
    ctx.beginPath()
    ctx.ellipse(shadowP.sx, shadowP.sy, 40 * shadowP.scale, 12 * shadowP.scale, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ==================== 动画循环 ====================

/**
 * 动画主循环
 * 使用requestAnimationFrame驱动，时间切片控制单帧预算
 */
function animate () {
  const now = performance.now()
  const t = (now - startTime) / 1000

  if (t >= ANIMATION_DURATION_MS / 1000) {
    isVisible.value = false
    rafId = null
    return
  }

  const frameStart = performance.now()
  const dt = Math.min(0.05, (now - (animate._lastTime || now)) / 1000)
  animate._lastTime = now

  // 更新各粒子系统
  updateFunnel(dt, t)
  updateSuction(dt, t)
  updateDebris(dt, t)
  updateDustCloud(dt, t)
  updateAmbient(dt, t)
  updateGroundWaves(dt, t)

  // 渲染
  render(t)

  // 时间切片：如果本帧已超预算，跳过下一帧的部分更新
  const frameTime = performance.now() - frameStart
  if (frameTime > FRAME_BUDGET_MS) {
    // 超预算时仍然继续，但记录警告（开发调试用）
  }

  rafId = requestAnimationFrame(animate)
}

// ==================== Canvas初始化 ====================

/**
 * 初始化Canvas尺寸和上下文
 * 根据父容器尺寸设置Canvas，支持高DPI
 */
function initCanvas () {
  const canvas = canvasRef.value
  if (!canvas) return
  const parent = canvas.parentElement
  if (!parent) return

  cw = parent.clientWidth || 300
  ch = parent.clientHeight || 220
  dpr = window.devicePixelRatio || 1

  canvas.width = cw * dpr
  canvas.height = ch * dpr
  canvas.style.width = cw + 'px'
  canvas.style.height = ch + 'px'

  ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // 计算龙卷风位置参数
  cx = cw / 2
  groundY = ch * 0.92
  tornadoH = ch * TORNADO_H_RATIO
}

// ==================== 动画控制 ====================

/**
 * 播放风沙吞噬·龙卷风3D特效动画
 * 初始化所有粒子系统并启动动画循环
 */
function playAnimation () {
  // 清理上一次动画
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (cleanupTimer) {
    clearTimeout(cleanupTimer)
    cleanupTimer = null
  }

  isVisible.value = true

  nextTick(() => {
    initCanvas()
    if (!ctx) return

    // 初始化所有粒子系统
    initFunnel()
    initSuction()
    initDebris()
    initDustCloud()
    initAmbient()
    initGroundWaves()

    // 启动动画
    startTime = performance.now()
    animate._lastTime = startTime
    rafId = requestAnimationFrame(animate)

    // 动画结束后自动隐藏
    cleanupTimer = setTimeout(() => {
      isVisible.value = false
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      cleanupTimer = null
    }, ANIMATION_DURATION_MS + CLEANUP_BUFFER_MS)
  })
}

// ==================== 暴露方法 ====================

defineExpose({ playAnimation })

// ==================== 生命周期 ====================

onMounted(() => {
  nextTick(() => {
    playAnimation()
  })
})

onUnmounted(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (cleanupTimer) {
    clearTimeout(cleanupTimer)
    cleanupTimer = null
  }
  ctx = null
})
</script>

<style scoped>
/* Canvas样式 - 填满父容器 */
.tornado-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  contain: layout paint style;
  will-change: transform;
}
</style>
