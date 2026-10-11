<!--
  @file HitEffectAnimation.vue
  @generated 2026-06-20
  @description 被击中动画特效组件：在受伤位移动画结束后播放受击视觉效果
  支持多种伤害类型（普通攻击、技能、DOT、暴击），自动区分玩家/怪物受击效果
-->
<template>
  <div v-if="isPlaying" class="hit-effect-container" :class="[`hit-type-${type}`, `hit-damage-${damageType}`]">
    <!-- 核心冲击波 -->
    <div class="hit-shockwave"></div>
    <!-- 中心闪光 -->
    <div class="hit-flash"></div>
    <!-- 碎片飞散 -->
    <div class="hit-sparks">
      <span v-for="i in 8" :key="i" class="spark"></span>
    </div>
    <!-- 边缘光晕 -->
    <div class="hit-glow"></div>
    <!-- 暴击专属：额外爆裂效果 -->
    <div v-if="damageType === 'critical'" class="hit-critical-burst"></div>
    <!-- 技能专属：元素光环 -->
    <div v-if="damageType === 'skill'" class="hit-skill-ring"></div>
    <!-- DOT专属：侵蚀粒子 -->
    <div v-if="damageType === 'dot'" class="hit-dot-particles">
      <span v-for="i in 6" :key="i" class="dot-particle"></span>
    </div>
  </div>
</template>

<script setup>
/**
 * 被击中动画特效组件
 * 在受伤位移动画（AttackAnimation的hit动画）结束后播放
 * 支持普通攻击、技能伤害、DOT伤害、暴击伤害等不同视觉风格
 */
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  /**
   * 目标类型：player=玩家受击, monster=怪物受击
   * 影响颜色方向和效果偏移
   */
  type: {
    type: String,
    default: 'monster',
    validator: value => ['player', 'monster'].includes(value)
  },
  /**
   * 伤害类型：normal=普攻, skill=技能, dot=持续伤害, critical=暴击
   * 影响视觉效果的强度和风格
   */
  damageType: {
    type: String,
    default: 'normal',
    validator: value => ['normal', 'skill', 'critical', 'dot'].includes(value)
  },
  /**
   * 是否触发播放受击特效
   * 每次从false变为true时触发一次完整动画
   */
  trigger: {
    type: Boolean,
    default: false
  }
})

/** 是否正在播放动画 */
const isPlaying = ref(false)

/** 动画结束定时器 */
let animationTimer = null

/** 受击动画持续时间（毫秒），根据伤害类型区分 */
const getAnimationDuration = () => {
  switch (props.damageType) {
    case 'critical': return 600
    case 'skill': return 550
    case 'dot': return 400
    default: return 450
  }
}

/**
 * 播放受击特效动画
 * 在受伤位移动画（0.3s）结束后延迟调用
 */
const playHitEffect = () => {
  try {
    if (animationTimer) {
      clearTimeout(animationTimer)
      animationTimer = null
    }
    isPlaying.value = true
    const duration = getAnimationDuration()
    animationTimer = setTimeout(() => {
      isPlaying.value = false
      animationTimer = null
    }, duration)
  } catch (error) {
    console.error('[HitEffectAnimation] 播放受击特效失败:', error)
    isPlaying.value = false
  }
}

/**
 * 监听 trigger prop 变化，触发受击特效
 */
watch(
  () => props.trigger,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      playHitEffect()
    }
  },
  { immediate: false }
)

onUnmounted(() => {
  if (animationTimer) {
    clearTimeout(animationTimer)
    animationTimer = null
  }
})
</script>

<style scoped>
/* ========================================
   容器基础样式
   ======================================== */
.hit-effect-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
  border-radius: 8px;
  overflow: hidden;
}

/* ========================================
   冲击波效果 - 从中心向外扩散的圆环
   ======================================== */
.hit-shockwave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: shockwaveExpand 0.4s ease-out forwards;
}

.hit-type-monster .hit-shockwave {
  border: 3px solid rgba(255, 100, 50, 0.8);
  box-shadow: 0 0 10px rgba(255, 80, 30, 0.6), inset 0 0 8px rgba(255, 150, 80, 0.3);
}

.hit-type-player .hit-shockwave {
  border: 3px solid rgba(100, 180, 255, 0.8);
  box-shadow: 0 0 10px rgba(80, 160, 255, 0.6), inset 0 0 8px rgba(150, 200, 255, 0.3);
}

@keyframes shockwaveExpand {
  0% {
    width: 10px;
    height: 10px;
    opacity: 1;
  }
  60% {
    opacity: 0.7;
  }
  100% {
    width: 120px;
    height: 120px;
    opacity: 0;
  }
}

/* ========================================
   中心闪光 - 受击瞬间白光
   ======================================== */
.hit-flash {
  position: absolute;
  inset: 0;
  animation: hitFlashBurst 0.3s ease-out forwards;
}

.hit-type-monster .hit-flash {
  background: radial-gradient(
    circle at center,
    rgba(255, 200, 150, 0.9) 0%,
    rgba(255, 120, 60, 0.6) 25%,
    rgba(255, 80, 30, 0.2) 50%,
    transparent 75%
  );
}

.hit-type-player .hit-flash {
  background: radial-gradient(
    circle at center,
    rgba(200, 220, 255, 0.9) 0%,
    rgba(120, 170, 255, 0.6) 25%,
    rgba(80, 140, 255, 0.2) 50%,
    transparent 75%
  );
}

@keyframes hitFlashBurst {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  15% {
    opacity: 1;
    transform: scale(1.2);
  }
  40% {
    opacity: 0.6;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.1);
  }
}

/* ========================================
   碎片火花 - 受击飞散的粒子
   ======================================== */
.hit-sparks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.spark {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  opacity: 0;
  animation: sparkFly 0.5s ease-out forwards;
}

.hit-type-monster .spark {
  background: radial-gradient(circle, #ffcc66, #ff6633);
  box-shadow: 0 0 4px #ff8844, 0 0 8px #ff4400;
}

.hit-type-player .spark {
  background: radial-gradient(circle, #88ccff, #4488ff);
  box-shadow: 0 0 4px #6699ff, 0 0 8px #3366ff;
}

/* 8个火花的位置和飞散方向 */
.spark:nth-child(1) { top: 30%; left: 25%; animation-delay: 0s; --sx: -18px; --sy: -15px; }
.spark:nth-child(2) { top: 30%; right: 25%; animation-delay: 0.03s; --sx: 18px; --sy: -12px; }
.spark:nth-child(3) { top: 50%; left: 15%; animation-delay: 0.06s; --sx: -22px; --sy: 0px; }
.spark:nth-child(4) { top: 50%; right: 15%; animation-delay: 0.02s; --sx: 22px; --sy: 5px; }
.spark:nth-child(5) { bottom: 30%; left: 25%; animation-delay: 0.05s; --sx: -16px; --sy: 14px; }
.spark:nth-child(6) { bottom: 30%; right: 25%; animation-delay: 0.04s; --sx: 20px; --sy: 12px; }
.spark:nth-child(7) { top: 20%; left: 50%; animation-delay: 0.01s; --sx: -5px; --sy: -20px; }
.spark:nth-child(8) { bottom: 20%; left: 50%; animation-delay: 0.07s; --sx: 8px; --sy: 18px; }

@keyframes sparkFly {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translate(calc(var(--sx) * 0.3), calc(var(--sy) * 0.3)) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--sx), var(--sy)) scale(0.2);
  }
}

/* ========================================
   边缘光晕 - 受击时边缘发光
   ======================================== */
.hit-glow {
  position: absolute;
  inset: -3px;
  border-radius: 11px;
  animation: hitGlowPulse 0.4s ease-out forwards;
}

.hit-type-monster .hit-glow {
  border: 2px solid rgba(255, 100, 50, 0.8);
  box-shadow: 0 0 12px rgba(255, 80, 30, 0.6), inset 0 0 10px rgba(255, 120, 60, 0.3);
}

.hit-type-player .hit-glow {
  border: 2px solid rgba(100, 160, 255, 0.8);
  box-shadow: 0 0 12px rgba(80, 140, 255, 0.6), inset 0 0 10px rgba(120, 180, 255, 0.3);
}

@keyframes hitGlowPulse {
  0% {
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
  }
}

/* ========================================
   暴击专属 - 爆裂效果
   ======================================== */
.hit-critical-burst {
  position: absolute;
  inset: -10px;
  border-radius: 15px;
  animation: criticalBurst 0.5s ease-out forwards;
}

.hit-type-monster .hit-critical-burst {
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 200, 0.95) 0%,
    rgba(255, 200, 50, 0.7) 20%,
    rgba(255, 100, 0, 0.4) 45%,
    transparent 70%
  );
  box-shadow: 0 0 25px rgba(255, 200, 0, 0.8), 0 0 50px rgba(255, 100, 0, 0.4);
}

.hit-type-player .hit-critical-burst {
  background: radial-gradient(
    circle at center,
    rgba(220, 240, 255, 0.95) 0%,
    rgba(150, 200, 255, 0.7) 20%,
    rgba(80, 140, 255, 0.4) 45%,
    transparent 70%
  );
  box-shadow: 0 0 25px rgba(150, 200, 255, 0.8), 0 0 50px rgba(80, 140, 255, 0.4);
}

@keyframes criticalBurst {
  0% {
    opacity: 0;
    transform: scale(0.4);
  }
  20% {
    opacity: 1;
    transform: scale(1.3);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}

/* ========================================
   技能专属 - 元素光环
   ======================================== */
.hit-skill-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: skillRingExpand 0.45s ease-out forwards;
}

.hit-type-monster .hit-skill-ring {
  border: 2px solid rgba(180, 100, 255, 0.8);
  box-shadow: 0 0 15px rgba(150, 80, 255, 0.6), inset 0 0 12px rgba(200, 150, 255, 0.3);
}

.hit-type-player .hit-skill-ring {
  border: 2px solid rgba(100, 200, 180, 0.8);
  box-shadow: 0 0 15px rgba(80, 180, 160, 0.6), inset 0 0 12px rgba(150, 220, 200, 0.3);
}

@keyframes skillRingExpand {
  0% {
    width: 20px;
    height: 20px;
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  60% {
    opacity: 0.6;
  }
  100% {
    width: 110px;
    height: 110px;
    opacity: 0;
  }
}

/* ========================================
   DOT专属 - 侵蚀粒子（缓慢上浮）
   ======================================== */
.hit-dot-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.dot-particle {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  opacity: 0;
  animation: dotParticleRise 0.35s ease-out forwards;
}

.hit-type-monster .dot-particle {
  background: radial-gradient(circle, #88ff44, #44aa22);
  box-shadow: 0 0 4px #66cc33, 0 0 8px #448811;
}

.hit-type-player .dot-particle {
  background: radial-gradient(circle, #cc88ff, #8844cc);
  box-shadow: 0 0 4px #aa66ee, 0 0 8px #7733aa;
}

.dot-particle:nth-child(1) { left: 20%; bottom: 30%; animation-delay: 0s; }
.dot-particle:nth-child(2) { left: 35%; bottom: 25%; animation-delay: 0.04s; }
.dot-particle:nth-child(3) { left: 50%; bottom: 35%; animation-delay: 0.08s; }
.dot-particle:nth-child(4) { left: 65%; bottom: 20%; animation-delay: 0.02s; }
.dot-particle:nth-child(5) { left: 75%; bottom: 40%; animation-delay: 0.06s; }
.dot-particle:nth-child(6) { left: 45%; bottom: 15%; animation-delay: 0.1s; }

@keyframes dotParticleRise {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0.4);
  }
  25% {
    opacity: 0.9;
    transform: translateY(-8px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-25px) scale(0.5);
  }
}

/* ========================================
   暴击效果增强 - 更大的冲击波和火花
   ======================================== */
.hit-damage-critical .hit-shockwave {
  animation-duration: 0.5s;
}
.hit-damage-critical .hit-flash {
  animation-duration: 0.4s;
}
.hit-damage-critical .hit-sparks .spark {
  animation-duration: 0.6s;
}
.hit-damage-critical .hit-glow {
  animation-duration: 0.5s;
}

/* ========================================
   技能效果增强 - 光环效果更强
   ======================================== */
.hit-damage-skill .hit-shockwave {
  animation-duration: 0.5s;
}
.hit-damage-skill .hit-flash {
  animation-duration: 0.35s;
}

/* ========================================
   DOT效果 - 更微弱但持续的视觉
   ======================================== */
.hit-damage-dot .hit-shockwave {
  animation-duration: 0.25s;
}
.hit-damage-dot .hit-flash {
  animation-duration: 0.2s;
  animation-name: hitFlashBurstSubtle;
}
.hit-damage-dot .hit-sparks .spark {
  width: 3px;
  height: 3px;
  animation-duration: 0.35s;
}

@keyframes hitFlashBurstSubtle {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  20% {
    opacity: 0.5;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.05);
  }
}

/* ========================================
   减少动画偏好 - 尊重用户设置
   ======================================== */
@media (prefers-reduced-motion: reduce) {
  .hit-shockwave,
  .hit-flash,
  .spark,
  .hit-glow,
  .hit-critical-burst,
  .hit-skill-ring,
  .dot-particle {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
