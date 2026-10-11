<!--
  @file DungeonAtmosphere.vue
  @description 副本氛围特效组件 - 幽暗恐怖的背景动画效果
  @features 
    - 暗黑迷雾流动效果
    - 血色闪电随机闪烁
    - 幽灵粒子漂浮
    - 恐怖光晕脉动
    - 暗影裂隙效果
    - Boss战特殊增强效果
  @generated 2026-03-15
-->
<template>
  <div class="dungeon-atmosphere" :class="{ 'boss-mode': isBossStage }">
    <!-- 暗黑迷雾层 -->
    <div class="fog-container">
      <div class="fog-layer fog-1"></div>
      <div class="fog-layer fog-2"></div>
      <div class="fog-layer fog-3"></div>
    </div>

    <!-- 暗影裂隙 -->
    <div class="rift-container">
      <div
        v-for="rift in rifts"
        :key="rift.id"
        class="shadow-rift"
        :style="rift.style"
      ></div>
    </div>

    <!-- 幽灵粒子 -->
    <div class="particle-container">
      <div
        v-for="particle in particles"
        :key="particle.id"
        class="ghost-particle"
        :class="particle.type"
        :style="particle.style"
      ></div>
    </div>

    <!-- 血色闪电 -->
    <Transition name="lightning">
      <div v-if="showLightning" class="lightning-overlay">
        <div class="lightning-flash"></div>
        <svg class="lightning-bolt" viewBox="0 0 100 100" :style="lightningStyle">
          <path
            :d="lightningPath"
            fill="none"
            stroke="rgba(255, 50, 50, 0.9)"
            stroke-width="0.5"
            filter="url(#glow)"
          />
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>
    </Transition>

    <!-- 恐怖光晕 -->
    <div class="aura-container">
      <div class="evil-aura aura-1"></div>
      <div class="evil-aura aura-2"></div>
      <div class="evil-aura aura-3"></div>
    </div>

    <!-- Boss模式增强效果 -->
    <template v-if="isBossStage">
      <!-- 血色边缘渐变 -->
      <div class="boss-blood-vignette"></div>
      
      <!-- 恶魔符文 -->
      <div class="rune-container">
        <div
          v-for="rune in runes"
          :key="rune.id"
          class="demon-rune"
          :style="rune.style"
        >
          {{ rune.symbol }}
        </div>
      </div>

      <!-- 暗影触手 -->
      <div class="tentacle-container">
        <div
          v-for="tentacle in tentacles"
          :key="tentacle.id"
          class="shadow-tentacle"
          :style="tentacle.style"
        ></div>
      </div>

      <!-- 地狱火焰 -->
      <div class="hellfire-container">
        <div class="hellfire hellfire-left"></div>
        <div class="hellfire hellfire-right"></div>
      </div>
    </template>

    <!-- 恐怖闪烁效果 -->
    <div
      v-if="horrorFlicker"
      class="horror-flicker"
      :style="{ opacity: flickerOpacity }"
    ></div>

    <!-- 暗影手印 -->
    <Transition name="shadow-hand">
      <div
        v-if="showShadowHand"
        class="shadow-hand"
        :style="shadowHandStyle"
      ></div>
    </Transition>
  </div>
</template>

<script setup>
/**
 * 副本氛围特效组件
 * 提供幽暗恐怖的背景动画效果
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  /**
   * 是否为Boss战阶段
   */
  isBossStage: {
    type: Boolean,
    default: false
  },
  /**
   * 恐怖强度 (0-1)
   */
  intensity: {
    type: Number,
    default: 0.5
  },
  /**
   * 是否启用闪电效果
   */
  enableLightning: {
    type: Boolean,
    default: true
  }
})

// ============ 状态 ============
const particles = ref([])
const rifts = ref([])
const runes = ref([])
const tentacles = ref([])
const showLightning = ref(false)
const lightningPath = ref('')
const lightningStyle = ref({})
const horrorFlicker = ref(false)
const flickerOpacity = ref(0)
const showShadowHand = ref(false)
const shadowHandStyle = ref({})

// ============ 计时器 ============
let particleTimer = null
let riftTimer = null
let lightningTimer = null
let flickerTimer = null
let shadowHandTimer = null
let idCounter = 0

// ============ 符文符号 ============
const runeSymbols = ['☵', '☲', '☶', '☴', '☳', '☱', '☰', '☷', '⍟', '☆', '☠', '⚡', '⛥', '⚝']

// ============ 生命周期 ============
onMounted(() => {
  initParticles()
  initRifts()
  
  if (props.enableLightning) {
    startLightningTimer()
  }
  
  startFlickerTimer()
  startShadowHandTimer()
  
  if (props.isBossStage) {
    initBossEffects()
  }
})

onUnmounted(() => {
  cleanup()
})

// 监听Boss模式变化
watch(() => props.isBossStage, (newVal) => {
  if (newVal) {
    initBossEffects()
    // Boss出现时触发强烈闪电
    triggerLightning()
  } else {
    runes.value = []
    tentacles.value = []
  }
})

// ============ 初始化方法 ============

/**
 * 初始化幽灵粒子
 */
const initParticles = () => {
  // 初始生成一批粒子（数量翻倍）
  for (let i = 0; i < 60; i++) {
    createParticle()
  }
  
  // 定期生成新粒子
  particleTimer = setInterval(() => {
    if (particles.value.length < 100) {
      createParticle()
    }
    // 移除过期粒子
    const now = Date.now()
    particles.value = particles.value.filter(p => p.expiresAt > now)
  }, 500)
}

/**
 * 创建单个粒子
 */
const createParticle = () => {
  const types = ['ghost', 'soul', 'ember', 'spark', 'dust']
  const type = types[Math.floor(Math.random() * types.length)]
  const duration = 8 + Math.random() * 12
  const size = 2 + Math.random() * 6
  
  particles.value.push({
    id: idCounter++,
    type,
    style: {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      width: `${size}px`,
      height: `${size}px`,
      animationDuration: `${duration}s`,
      animationDelay: `${Math.random() * 5}s`
    },
    expiresAt: Date.now() + duration * 1000
  })
}

/**
 * 初始化暗影裂隙
 */
const initRifts = () => {
  for (let i = 0; i < 8; i++) {
    createRift()
  }
  
  riftTimer = setInterval(() => {
    if (rifts.value.length < 12) {
      createRift()
    }
    rifts.value = rifts.value.filter(r => r.expiresAt > Date.now())
  }, 3000)
}

/**
 * 创建暗影裂隙
 */
const createRift = () => {
  const duration = 5 + Math.random() * 8
  
  rifts.value.push({
    id: idCounter++,
    style: {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      width: `${20 + Math.random() * 40}px`,
      height: `${100 + Math.random() * 200}px`,
      transform: `rotate(${-30 + Math.random() * 60}deg)`,
      animationDuration: `${duration}s`
    },
    expiresAt: Date.now() + duration * 1000
  })
}

/**
 * 初始化Boss模式效果
 */
const initBossEffects = () => {
  // 生成恶魔符文
  for (let i = 0; i < 6; i++) {
    createRune()
  }
  
  // 生成暗影触手
  for (let i = 0; i < 4; i++) {
    createTentacle()
  }
}

/**
 * 创建恶魔符文
 */
const createRune = () => {
  runes.value.push({
    id: idCounter++,
    symbol: runeSymbols[Math.floor(Math.random() * runeSymbols.length)],
    style: {
      left: `${10 + Math.random() * 80}%`,
      top: `${10 + Math.random() * 80}%`,
      fontSize: `${30 + Math.random() * 40}px`,
      animationDelay: `${Math.random() * 3}s`
    }
  })
}

/**
 * 创建暗影触手
 */
const createTentacle = () => {
  const isLeft = Math.random() > 0.5
  
  tentacles.value.push({
    id: idCounter++,
    style: {
      left: isLeft ? '0' : 'auto',
      right: isLeft ? 'auto' : '0',
      top: `${20 + Math.random() * 60}%`,
      transform: `scaleX(${isLeft ? 1 : -1})`,
      animationDelay: `${Math.random() * 2}s`
    }
  })
}

/**
 * 启动闪电计时器
 */
const startLightningTimer = () => {
  const scheduleNext = () => {
    const delay = props.isBossStage 
      ? 3000 + Math.random() * 5000  // Boss模式下更频繁
      : 8000 + Math.random() * 15000
    
    lightningTimer = setTimeout(() => {
      triggerLightning()
      scheduleNext()
    }, delay)
  }
  
  scheduleNext()
}

/**
 * 触发闪电效果
 */
const triggerLightning = () => {
  if (!props.enableLightning) return
  
  // 生成随机闪电路径
  lightningPath.value = generateLightningPath()
  lightningStyle.value = {
    left: `${10 + Math.random() * 80}%`,
    top: '0',
    transform: `scale(${0.5 + Math.random() * 0.5}) rotate(${-20 + Math.random() * 40}deg)`
  }
  
  showLightning.value = true
  
  setTimeout(() => {
    showLightning.value = false
  }, 200)
}

/**
 * 生成闪电路径
 */
const generateLightningPath = () => {
  let path = 'M50,0'
  let y = 0
  
  while (y < 100) {
    y += 10 + Math.random() * 15
    const x = 50 + (Math.random() - 0.5) * 30
    path += ` L${x},${y}`
    
    // 随机分叉
    if (Math.random() > 0.7 && y < 80) {
      const branchX = x + (Math.random() - 0.5) * 20
      const branchY = y + 10 + Math.random() * 10
      path += ` M${x},${y} L${branchX},${branchY} M${x},${y}`
    }
  }
  
  return path
}

/**
 * 启动恐怖闪烁计时器
 */
const startFlickerTimer = () => {
  flickerTimer = setInterval(() => {
    if (Math.random() > 0.95) {
      // 随机触发恐怖闪烁
      horrorFlicker.value = true
      flickerOpacity.value = 0.1 + Math.random() * 0.3
      
      setTimeout(() => {
        horrorFlicker.value = false
      }, 50 + Math.random() * 100)
    }
  }, 500)
}

/**
 * 启动暗影手印计时器
 */
const startShadowHandTimer = () => {
  const scheduleNext = () => {
    const delay = 15000 + Math.random() * 30000
    
    shadowHandTimer = setTimeout(() => {
      if (Math.random() > 0.5) {
        showShadowHand.value = true
        shadowHandStyle.value = {
          left: `${Math.random() * 80}%`,
          top: `${Math.random() * 80}%`,
          transform: `rotate(${-30 + Math.random() * 60}deg) scale(${0.5 + Math.random() * 0.5})`
        }
        
        setTimeout(() => {
          showShadowHand.value = false
        }, 2000)
      }
      
      scheduleNext()
    }, delay)
  }
  
  scheduleNext()
}

/**
 * 清理资源
 */
const cleanup = () => {
  if (particleTimer) clearInterval(particleTimer)
  if (riftTimer) clearInterval(riftTimer)
  if (lightningTimer) clearTimeout(lightningTimer)
  if (flickerTimer) clearInterval(flickerTimer)
  if (shadowHandTimer) clearTimeout(shadowHandTimer)
  
  particleTimer = null
  riftTimer = null
  lightningTimer = null
  flickerTimer = null
  shadowHandTimer = null
}

// 暴露方法供外部调用
defineExpose({
  triggerLightning
})
</script>

<style scoped>
/* ============ 主容器 ============ */
.dungeon-atmosphere {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.dungeon-atmosphere.boss-mode {
  z-index: 1;
}

/* ============ 暗黑迷雾 ============ */
.fog-container {
  position: absolute;
  inset: 0;
}

.fog-layer {
  position: absolute;
  inset: -50%;
  width: 200%;
  height: 200%;
  background: 
    radial-gradient(ellipse at 20% 50%, rgba(20, 0, 0, 0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 30%, rgba(10, 0, 20, 0.5) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(0, 10, 20, 0.4) 0%, transparent 50%);
  animation: fogDrift 30s ease-in-out infinite;
}

.fog-1 {
  animation-duration: 35s;
  opacity: 0.8;
}

.fog-2 {
  animation-duration: 45s;
  animation-direction: reverse;
  opacity: 0.6;
  background: 
    radial-gradient(ellipse at 70% 20%, rgba(30, 0, 10, 0.5) 0%, transparent 50%),
    radial-gradient(ellipse at 30% 70%, rgba(0, 20, 30, 0.4) 0%, transparent 50%);
}

.fog-3 {
  animation-duration: 50s;
  opacity: 0.4;
  background: 
    radial-gradient(ellipse at 40% 40%, rgba(20, 10, 0, 0.3) 0%, transparent 60%),
    radial-gradient(ellipse at 60% 60%, rgba(0, 0, 20, 0.3) 0%, transparent 60%);
}

@keyframes fogDrift {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(-5%, 5%) rotate(2deg);
  }
  50% {
    transform: translate(-10%, 0) rotate(-1deg);
  }
  75% {
    transform: translate(-5%, -5%) rotate(1deg);
  }
}

/* Boss模式增强迷雾 */
.boss-mode .fog-layer {
  background: 
    radial-gradient(ellipse at 20% 50%, rgba(40, 0, 0, 0.5) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 30%, rgba(30, 0, 0, 0.6) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(20, 0, 0, 0.5) 0%, transparent 50%);
}

/* ============ 暗影裂隙 ============ */
.rift-container {
  position: absolute;
  inset: 0;
}

.shadow-rift {
  position: absolute;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(100, 0, 50, 0.3) 20%,
    rgba(50, 0, 100, 0.5) 50%,
    rgba(100, 0, 50, 0.3) 80%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(5px);
  animation: riftPulse 3s ease-in-out infinite;
}

@keyframes riftPulse {
  0%, 100% {
    opacity: 0;
    transform: scaleY(0.8);
  }
  50% {
    opacity: 1;
    transform: scaleY(1);
  }
}

/* ============ 幽灵粒子 ============ */
.particle-container {
  position: absolute;
  inset: 0;
}

.ghost-particle {
  position: absolute;
  border-radius: 50%;
  animation: ghostFloat 15s ease-in-out infinite;
}

.ghost-particle.ghost {
  background: radial-gradient(circle, rgba(150, 150, 200, 0.6) 0%, transparent 70%);
  box-shadow: 0 0 10px rgba(100, 100, 150, 0.3);
}

.ghost-particle.soul {
  background: radial-gradient(circle, rgba(100, 200, 255, 0.5) 0%, transparent 70%);
  box-shadow: 0 0 15px rgba(50, 150, 200, 0.3);
}

.ghost-particle.ember {
  background: radial-gradient(circle, rgba(255, 100, 50, 0.6) 0%, transparent 70%);
  box-shadow: 0 0 8px rgba(200, 50, 0, 0.4);
  animation-name: emberFloat;
}

.ghost-particle.spark {
  background: radial-gradient(circle, rgba(255, 255, 200, 0.8) 0%, transparent 70%);
  box-shadow: 0 0 5px rgba(255, 255, 150, 0.5);
  animation-name: sparkFloat;
}

.ghost-particle.dust {
  background: radial-gradient(circle, rgba(100, 80, 60, 0.4) 0%, transparent 70%);
  animation-name: dustFloat;
}

@keyframes ghostFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  50% {
    transform: translate(30px, -100px) scale(1.2);
    opacity: 0.8;
  }
  90% {
    opacity: 0.4;
  }
}

@keyframes emberFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 0.7;
  }
  50% {
    transform: translate(-20px, -80px) scale(0.8);
    opacity: 0.5;
  }
  90% {
    transform: translate(10px, -150px) scale(0.3);
    opacity: 0;
  }
}

@keyframes sparkFloat {
  0% {
    transform: translate(0, 0) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate(10px, -20px) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(5px, -100px) scale(0);
    opacity: 0;
  }
}

@keyframes dustFloat {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: translate(50px, -50px) rotate(180deg);
    opacity: 0.3;
  }
}

/* Boss模式粒子增强 */
.boss-mode .ghost-particle.ghost {
  background: radial-gradient(circle, rgba(200, 50, 50, 0.6) 0%, transparent 70%);
  box-shadow: 0 0 15px rgba(150, 0, 0, 0.5);
}

.boss-mode .ghost-particle.ember {
  background: radial-gradient(circle, rgba(255, 50, 0, 0.7) 0%, transparent 70%);
  box-shadow: 0 0 12px rgba(200, 0, 0, 0.6);
}

/* ============ 血色闪电 ============ */
.lightning-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
}

.lightning-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(255, 50, 50, 0.3) 0%, transparent 70%);
  animation: lightningFlash 0.2s ease-out;
}

@keyframes lightningFlash {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.lightning-bolt {
  position: absolute;
  width: 100px;
  height: 100vh;
  filter: drop-shadow(0 0 10px rgba(255, 50, 50, 0.8));
}

.lightning-enter-active {
  animation: lightningIn 0.1s ease-out;
}

.lightning-leave-active {
  animation: lightningOut 0.1s ease-out;
}

@keyframes lightningIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes lightningOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* ============ 恐怖光晕 ============ */
.aura-container {
  position: absolute;
  inset: 0;
}

.evil-aura {
  position: absolute;
  border-radius: 50%;
  animation: auraPulse 4s ease-in-out infinite;
}

.aura-1 {
  width: 300px;
  height: 300px;
  left: 10%;
  top: 20%;
  background: radial-gradient(circle, rgba(100, 0, 50, 0.2) 0%, transparent 70%);
  animation-delay: 0s;
}

.aura-2 {
  width: 400px;
  height: 400px;
  right: 5%;
  bottom: 10%;
  background: radial-gradient(circle, rgba(50, 0, 100, 0.2) 0%, transparent 70%);
  animation-delay: 1.5s;
}

.aura-3 {
  width: 250px;
  height: 250px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(0, 50, 100, 0.15) 0%, transparent 70%);
  animation-delay: 3s;
}

@keyframes auraPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.6;
  }
}

.aura-3 {
  animation-name: auraPulseCenter;
}

@keyframes auraPulseCenter {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.2;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0.4;
  }
}

/* Boss模式光晕增强 */
.boss-mode .evil-aura {
  background: radial-gradient(circle, rgba(150, 0, 0, 0.3) 0%, transparent 70%);
}

/* ============ Boss模式特效 ============ */

/* 血色边缘渐变 */
.boss-blood-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(80, 0, 0, 0.5) 100%);
  animation: vignettePulse 3s ease-in-out infinite;
}

@keyframes vignettePulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

/* 恶魔符文 */
.rune-container {
  position: absolute;
  inset: 0;
}

.demon-rune {
  position: absolute;
  color: rgba(150, 0, 50, 0.3);
  font-size: 40px;
  text-shadow: 0 0 20px rgba(200, 0, 50, 0.5);
  animation: runeGlow 5s ease-in-out infinite;
}

@keyframes runeGlow {
  0%, 100% {
    opacity: 0.2;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

/* 暗影触手 */
.tentacle-container {
  position: absolute;
  inset: 0;
}

.shadow-tentacle {
  position: absolute;
  width: 60px;
  height: 200px;
  background: linear-gradient(90deg, 
    transparent 0%,
    rgba(30, 0, 20, 0.6) 20%,
    rgba(50, 0, 30, 0.8) 50%,
    rgba(30, 0, 20, 0.6) 80%,
    transparent 100%
  );
  border-radius: 0 50% 50% 0;
  filter: blur(2px);
  transform-origin: left center;
  animation: tentacleWave 4s ease-in-out infinite;
}

@keyframes tentacleWave {
  0%, 100% {
    transform: scaleX(1) rotate(-10deg);
  }
  50% {
    transform: scaleX(1.2) rotate(10deg);
  }
}

/* 地狱火焰 */
.hellfire-container {
  position: absolute;
  inset: 0;
}

.hellfire {
  position: absolute;
  bottom: 0;
  width: 150px;
  height: 200px;
  filter: blur(3px);
  opacity: 0.4;
}

.hellfire-left {
  left: 0;
  background: linear-gradient(0deg, 
    rgba(255, 50, 0, 0.6) 0%,
    rgba(200, 30, 0, 0.4) 30%,
    rgba(150, 20, 0, 0.2) 60%,
    transparent 100%
  );
  animation: hellfireFlicker 2s ease-in-out infinite;
}

.hellfire-right {
  right: 0;
  background: linear-gradient(0deg, 
    rgba(255, 50, 0, 0.6) 0%,
    rgba(200, 30, 0, 0.4) 30%,
    rgba(150, 20, 0, 0.2) 60%,
    transparent 100%
  );
  animation: hellfireFlicker 2.5s ease-in-out infinite reverse;
}

@keyframes hellfireFlicker {
  0%, 100% {
    transform: scaleY(1) scaleX(1);
    opacity: 0.4;
  }
  25% {
    transform: scaleY(1.1) scaleX(0.9);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(0.9) scaleX(1.1);
    opacity: 0.35;
  }
  75% {
    transform: scaleY(1.05) scaleX(0.95);
    opacity: 0.45;
  }
}

/* ============ 恐怖闪烁 ============ */
.horror-flicker {
  position: absolute;
  inset: 0;
  background: rgba(50, 0, 0, 1);
  pointer-events: none;
}

/* ============ 暗影手印 ============ */
.shadow-hand {
  position: absolute;
  width: 150px;
  height: 200px;
  background: 
    radial-gradient(ellipse at 50% 30%, rgba(20, 0, 10, 0.8) 0%, transparent 50%),
    radial-gradient(ellipse at 30% 60%, rgba(30, 0, 15, 0.6) 0%, transparent 40%),
    radial-gradient(ellipse at 70% 60%, rgba(30, 0, 15, 0.6) 0%, transparent 40%);
  filter: blur(1px);
  animation: handAppear 2s ease-out forwards;
}

@keyframes handAppear {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  20% {
    opacity: 0.8;
    transform: scale(1.1);
  }
  40% {
    opacity: 0.6;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
}

.shadow-hand-enter-active {
  animation: handAppear 2s ease-out forwards;
}

.shadow-hand-leave-active {
  animation: handDisappear 0.5s ease-out forwards;
}

@keyframes handDisappear {
  to {
    opacity: 0;
  }
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .hellfire {
    width: 100px;
    height: 150px;
  }
  
  .shadow-tentacle {
    width: 40px;
    height: 150px;
  }
  
  .demon-rune {
    font-size: 30px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fog-layer,
  .ghost-particle,
  .shadow-rift,
  .evil-aura,
  .demon-rune,
  .shadow-tentacle,
  .hellfire,
  .boss-blood-vignette {
    animation: none;
  }
}
</style>
