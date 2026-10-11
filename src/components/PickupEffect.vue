/**
 * @file PickupEffect.vue
 * @description 捡宠拾取特效动画组件
 * 业务意图：在捡宠触碰到物品和金币时，在宠物图片四周触发模拟拾取的视觉特效
 * - 多个粒子从宠物中心向外扩散，模拟拾取光效
 * - 金币拾取显示金色粒子，物品拾取显示蓝绿色粒子
 * - 粒子自动消失，无需手动清理
 * @since 2026-06-22
 */
<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="pickup-effect-container"
      :style="containerStyle"
    >
      <!-- 扩散粒子 -->
      <div
        v-for="particle in particles"
        :key="particle.id"
        class="pickup-particle"
        :style="particle.style"
      />
      <!-- 中心光环 -->
      <div
        class="pickup-ring"
        :class="ringClass"
      />
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  /** 特效触发位置X坐标 */
  x: {
    type: Number,
    default: 0
  },
  /** 特效触发位置Y坐标 */
  y: {
    type: Number,
    default: 0
  },
  /** 拾取类型：gold=金币，item=物品 */
  type: {
    type: String,
    default: 'gold',
    validator: val => ['gold', 'item'].includes(val)
  },
  /** 是否显示特效 */
  active: {
    type: Boolean,
    default: false
  }
})

/** 特效是否可见 */
const visible = ref(false)

/** 粒子列表 */
const particles = ref([])

/** 粒子ID计数器 */
let particleIdCounter = 0

/** 特效自动关闭定时器 */
let effectTimer = null

/** 金币拾取的颜色配置 */
const goldColors = ['#ffd700', '#ffec8b', '#ffcc00', '#ffe066', '#fff8dc']

/** 物品拾取的颜色配置 */
const itemColors = ['#00e5ff', '#00bcd4', '#26c6da', '#4dd0e1', '#80deea']

/** 根据类型返回光环样式类 */
const ringClass = computed(() => ({
  'ring-gold': props.type === 'gold',
  'ring-item': props.type === 'item'
}))

/** 容器定位样式 */
const containerStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`
}))

/**
 * 生成拾取粒子
 * 在宠物图片四周均匀分布8个粒子，向外扩散
 */
const generateParticles = () => {
  const colors = props.type === 'gold' ? goldColors : itemColors
  const count = 8
  const newParticles = []

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4
    const distance = 28 + Math.random() * 16
    const dx = Math.cos(angle) * distance
    const dy = Math.sin(angle) * distance
    const color = colors[Math.floor(Math.random() * colors.length)]
    const size = 4 + Math.random() * 4
    const duration = 500 + Math.random() * 300

    newParticles.push({
      id: ++particleIdCounter,
      style: {
        '--dx': `${dx}px`,
        '--dy': `${dy}px`,
        '--color': color,
        '--size': `${size}px`,
        '--duration': `${duration}ms`
      }
    })
  }

  particles.value = newParticles
}

/**
 * 触发拾取特效
 * 生成粒子并显示，定时后自动消失
 */
const triggerEffect = () => {
  // 清理之前的定时器
  if (effectTimer) {
    clearTimeout(effectTimer)
  }

  generateParticles()
  visible.value = true

  // 特效持续800ms后自动消失
  effectTimer = setTimeout(() => {
    visible.value = false
    particles.value = []
    effectTimer = null
  }, 900)
}

// 监听active变化，触发特效
watch(
  () => props.active,
  (newVal) => {
    if (newVal) {
      triggerEffect()
    }
  }
)

onUnmounted(() => {
  if (effectTimer) {
    clearTimeout(effectTimer)
    effectTimer = null
  }
})

/** 暴露方法供父组件手动触发 */
defineExpose({
  /** 手动触发拾取特效 */
  triggerEffect
})
</script>

<style scoped>
.pickup-effect-container {
  position: fixed;
  width: 48px;
  height: 48px;
  z-index: 10001;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

/* 粒子扩散动画 */
.pickup-particle {
  position: absolute;
  width: var(--size, 6px);
  height: var(--size, 6px);
  border-radius: 50%;
  background: var(--color, #ffd700);
  box-shadow: 0 0 6px var(--color, #ffd700);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  animation: particleBurst var(--duration, 600ms) ease-out forwards;
}

/* 中心光环 */
.pickup-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ringExpand 600ms ease-out forwards;
}

.pickup-ring.ring-gold {
  border: 2px solid #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.6), inset 0 0 6px rgba(255, 215, 0, 0.3);
}

.pickup-ring.ring-item {
  border: 2px solid #00e5ff;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.6), inset 0 0 6px rgba(0, 229, 255, 0.3);
}

@keyframes particleBurst {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) translate(0, 0) scale(1);
  }
  60% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) translate(var(--dx), var(--dy)) scale(0.3);
  }
}

@keyframes ringExpand {
  0% {
    width: 10px;
    height: 10px;
    opacity: 1;
  }
  100% {
    width: 56px;
    height: 56px;
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pickup-particle,
  .pickup-ring {
    animation: none;
  }
}
</style>
