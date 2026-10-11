<script setup>
/**
 * 批量伤害数字渲染器
 * 使用 Canvas 批量渲染伤害数字，支持粒子动画效果
 * 优化要点：
 * 1. 批量收集伤害事件
 * 2. 单一 Canvas 渲染
 * 3. 粒子动画池
 * 4. 分帧刷新
 *
 * @file DamageNumberRenderer.vue
 * @generated 2026-02-15
 */
import { ref, onMounted, onUnmounted, shallowRef, markRaw } from 'vue'

// ========== 配置常量 ==========
const CONFIG = {
  maxParticles: 100,
  particleLifespan: 1200,
  fps: 60,
  gravity: 0.15,
  baseFontSize: 20,
  criticalFontSize: 26,
  healingFontSize: 18,
  batchFlushInterval: 16,
  maxBatchSize: 50
}

// ========== 粒子类 ==========
class DamageParticle {
  constructor (x, y, damage, options = {}) {
    this.x = x
    this.y = y
    this.damage = damage
    this.isCritical = options.isCritical || false
    this.isHeal = options.isHeal || false
    this.elementType = options.elementType || null
    this.elementAdvantage = options.elementAdvantage || 1

    this.vx = (Math.random() - 0.5) * 2
    this.vy = -3 - Math.random() * 2

    this.life = CONFIG.particleLifespan
    this.maxLife = CONFIG.particleLifespan
    this.opacity = 1

    this.fontSize = this.isHeal
      ? CONFIG.healingFontSize
      : this.isCritical
        ? CONFIG.criticalFontSize
        : CONFIG.baseFontSize

    this.color = this.determineColor()

    this.id = `particle_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
  }

  determineColor () {
    if (this.isHeal) {
      return '#4ade80'
    }

    if (this.elementAdvantage > 1) {
      return '#ffd700'
    }

    if (this.elementAdvantage < 1) {
      return '#888888'
    }

    if (this.isCritical) {
      return '#ff6b6b'
    }

    return '#ffffff'
  }

  update (deltaTime) {
    this.x += this.vx
    this.y += this.vy
    this.vy += CONFIG.gravity

    this.life -= deltaTime
    this.opacity = Math.max(0, this.life / this.maxLife)

    return this.life > 0
  }

  render (ctx) {
    if (this.opacity <= 0) {
      return
    }

    ctx.save()
    ctx.globalAlpha = this.opacity

    const fontSize = Math.max(12, this.fontSize)
    ctx.font = `bold ${fontSize}px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // 文字阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 3
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1

    // 描边
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.lineWidth = 2
    ctx.strokeText(this.damage.toString(), this.x, this.y)

    // 填充
    ctx.fillStyle = this.color
    ctx.fillText(this.damage.toString(), this.x, this.y)

    // 暴击特效
    if (this.isCritical && this.opacity > 0.5) {
      ctx.font = `bold ${Math.max(10, fontSize * 0.6)}px Arial, sans-serif`
      ctx.fillStyle = '#ff0000'
      ctx.fillText('暴击!', this.x, this.y - fontSize * 0.8)
    }

    ctx.restore()
  }
}

// ========== Props ==========
const props = defineProps({
  containerSelector: {
    type: String,
    default: '.battle-container'
  },
  enabled: {
    type: Boolean,
    default: true
  }
})

// ========== Emits ==========
const emit = defineEmits(['rendered'])

// ========== 状态 ==========
const canvasRef = shallowRef(null)
const particles = shallowRef([])
const pendingBatch = ref([])
let animationFrameId = null
let lastFrameTime = 0
let flushTimerId = null

// ========== 粒子池 ==========
const particlePool = []
const getParticleFromPool = () => {
  if (particlePool.length > 0) {
    return particlePool.pop()
  }
  return null
}

const returnParticleToPool = (particle) => {
  if (particlePool.length < CONFIG.maxParticles) {
    particlePool.push(particle)
  }
}

// ========== 方法 ==========
const getContainerRect = () => {
  if (typeof document === 'undefined') {
    return null
  }

  const container = document.querySelector(props.containerSelector)
  if (!container) {
    return { x: 0, y: 0, width: 800, height: 600 }
  }

  return container.getBoundingClientRect()
}

const calculatePosition = (targetIndex, containerRect) => {
  // 根据目标索引计算位置
  // 简化实现：假设怪物以网格排列
  const cols = 8
  const cellWidth = containerRect.width / cols
  const row = Math.floor(targetIndex / cols)
  const col = targetIndex % cols

  const baseX = containerRect.x + col * cellWidth + cellWidth / 2
  const baseY = containerRect.y + row * 80 + 40

  // 添加随机偏移
  return {
    x: baseX + (Math.random() - 0.5) * 20,
    y: baseY + (Math.random() - 0.5) * 10
  }
}

/**
 * 添加单个伤害数字
 */
const addDamageNumber = (targetIndex, damage, options = {}) => {
  if (!props.enabled || damage <= 0) {
    return
  }

  pendingBatch.value.push({
    targetIndex,
    damage,
    ...options,
    timestamp: Date.now()
  })

  scheduleBatchFlush()
}

/**
 * 批量添加伤害数字（方案一核心方法）
 */
const addDamageNumberBatch = (damageEvents, skill = null) => {
  if (!props.enabled || !Array.isArray(damageEvents) || damageEvents.length === 0) {
    return
  }

  const now = Date.now()
  const containerRect = getContainerRect()

  // 批量创建粒子
  const newParticles = []
  for (const event of damageEvents) {
    const { targetIndex, damage, isCritical, elementInfo } = event

    if (damage <= 0) {
      continue
    }

    const position = calculatePosition(targetIndex, containerRect)

    newParticles.push(new DamageParticle(position.x, position.y, damage, {
      isCritical: isCritical || false,
      isHeal: false,
      elementType: elementInfo?.elementType || null,
      elementAdvantage: elementInfo?.elementAdvantage || 1
    }))

    if (newParticles.length >= CONFIG.maxBatchSize) {
      break
    }
  }

  // 添加到粒子列表
  particles.value = [...particles.value, ...newParticles]

  // 启动动画
  startAnimation()

  emit('rendered', {
    count: newParticles.length,
    timestamp: now
  })
}

/**
 * 调度批量刷新
 */
const scheduleBatchFlush = () => {
  if (flushTimerId) return

  flushTimerId = setTimeout(() => {
    flushTimerId = null
    flushBatch()
  }, CONFIG.batchFlushInterval)
}

/**
 * 刷新批量队列
 */
const flushBatch = () => {
  if (pendingBatch.value.length === 0) return

  const batch = [...pendingBatch.value]
  pendingBatch.value = []

  addDamageNumberBatch(batch.map(event => ({
    targetIndex: event.targetIndex,
    damage: event.damage,
    isCritical: event.isCritical || false,
    elementInfo: event.elementInfo || null
  })))
}

/**
 * 启动动画循环
 */
const startAnimation = () => {
  if (animationFrameId) return

  lastFrameTime = performance.now()

  const animate = (currentTime) => {
    if (particles.value.length === 0) {
      animationFrameId = null
      return
    }

    const deltaTime = currentTime - lastFrameTime
    lastFrameTime = currentTime

    // 更新粒子
    const updatedParticles = particles.value.filter(particle => particle.update(deltaTime))

    // 回收死亡粒子
    for (const particle of particles.value) {
      if (!updatedParticles.includes(particle)) {
        returnParticleToPool(particle)
      }
    }

    particles.value = updatedParticles

    // 渲染
    render()

    animationFrameId = requestAnimationFrame(animate)
  }

  animationFrameId = requestAnimationFrame(animate)
}

/**
 * 渲染画面
 */
const render = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const containerRect = getContainerRect()

  // 调整画布大小
  if (canvas.width !== containerRect.width || canvas.height !== containerRect.height) {
    canvas.width = containerRect.width
    canvas.height = containerRect.height
  }

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 渲染所有粒子
  for (const particle of particles.value) {
    particle.render(ctx)
  }
}

/**
 * 清除所有粒子
 */
const clearAll = () => {
  particles.value = []
  pendingBatch.value = []

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  if (flushTimerId) {
    clearTimeout(flushTimerId)
    flushTimerId = null
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', render)
  }
})

onUnmounted(() => {
  clearAll()
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', render)
  }
})

// ========== 暴露方法 ==========
defineExpose({
  addDamageNumber,
  addDamageNumberBatch,
  clearAll,
  flushBatch
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="damage-number-canvas"
    :style="{
      position: 'absolute',
      top: 0,
      left: 0,
      pointerEvents: 'none',
      zIndex: 1000
    }"
  />
</template>

<style scoped>
.damage-number-canvas {
  image-rendering: optimizeSpeed;
}
</style>
