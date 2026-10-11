<!--
  @file BerserkAnimation.vue
  @generated 2026-02-23
  @description 怪物狂暴效果动画组件：支持7种不同风格的狂暴视觉效果
  - chaos: 混沌狂暴（默认）- 时空撕裂，混沌降临
  - flame: 红色火焰光环
  - frost: 蓝色冰霜结晶
  - thunder: 紫色雷电环绕
  - shadow: 黑紫色暗影
  - divine: 金色圣光
  - poison: 绿色毒雾
-->
<template>
  <div
    v-if="isBerserk"
    class="berserk-container"
    :class="[`berserk-type-${animationType}`, { 'berserk-trigger': isTriggering }]"
  >
    <!-- ========== 火焰狂暴（默认）========== -->
    <template v-if="animationType === 'flame'">
      <div class="berserk-outer-glow"></div>
      <div class="berserk-aura"></div>
      <div class="berserk-inner-flame"></div>
      <div class="berserk-particles">
        <span v-for="i in 12" :key="i" class="particle"></span>
      </div>
      <div v-if="isTriggering" class="berserk-flash"></div>
      <div class="berserk-edge-flames">
        <span v-for="i in 8" :key="i" class="edge-flame"></span>
      </div>
      <div class="berserk-eyes"></div>
    </template>

    <!-- ========== 冰霜狂暴 ========== -->
    <template v-if="animationType === 'frost'">
      <div class="frost-outer-mist"></div>
      <div class="frost-aura"></div>
      <div class="frost-crystals">
        <span v-for="i in 8" :key="i" class="crystal"></span>
      </div>
      <div class="frost-particles">
        <span v-for="i in 15" :key="i" class="frost-particle"></span>
      </div>
      <div v-if="isTriggering" class="frost-flash"></div>
      <div class="frost-spikes">
        <span v-for="i in 6" :key="i" class="spike"></span>
      </div>
    </template>

    <!-- ========== 雷电狂暴 ========== -->
    <template v-if="animationType === 'thunder'">
      <div class="thunder-outer-field"></div>
      <div class="thunder-aura"></div>
      <div class="thunder-arcs">
        <span v-for="i in 6" :key="i" class="arc"></span>
      </div>
      <div class="thunder-particles">
        <span v-for="i in 20" :key="i" class="spark"></span>
      </div>
      <div v-if="isTriggering" class="thunder-flash"></div>
      <div class="thunder-orbs">
        <span v-for="i in 4" :key="i" class="orb"></span>
      </div>
    </template>

    <!-- ========== 暗影狂暴 ========== -->
    <template v-if="animationType === 'shadow'">
      <div class="shadow-outer-mist"></div>
      <div class="shadow-aura"></div>
      <div class="shadow-hands">
        <span v-for="i in 6" :key="i" class="hand"></span>
      </div>
      <div class="shadow-particles">
        <span v-for="i in 16" :key="i" class="wisp"></span>
      </div>
      <div v-if="isTriggering" class="shadow-flash"></div>
      <div class="shadow-vortex"></div>
    </template>

    <!-- ========== 神圣狂暴 ========== -->
    <template v-if="animationType === 'divine'">
      <div class="divine-outer-light"></div>
      <div class="divine-aura"></div>
      <div class="divine-pillars">
        <span v-for="i in 8" :key="i" class="pillar"></span>
      </div>
      <div class="divine-particles">
        <span v-for="i in 18" :key="i" class="light-particle"></span>
      </div>
      <div v-if="isTriggering" class="divine-flash"></div>
      <div class="divine-halo"></div>
      <div class="divine-runes">
        <span v-for="i in 6" :key="i" class="rune"></span>
      </div>
    </template>

    <!-- ========== 剧毒狂暴 ========== -->
    <template v-if="animationType === 'poison'">
      <div class="poison-outer-cloud"></div>
      <div class="poison-aura"></div>
      <div class="poison-bubbles">
        <span v-for="i in 12" :key="i" class="bubble"></span>
      </div>
      <div class="poison-particles">
        <span v-for="i in 14" :key="i" class="toxin"></span>
      </div>
      <div v-if="isTriggering" class="poison-flash"></div>
      <div class="poison-drips">
        <span v-for="i in 8" :key="i" class="drip"></span>
      </div>
      <div class="poison-skull"></div>
    </template>

    <!-- ========== 混沌狂暴（默认）========== -->
    <template v-if="animationType === 'chaos'">
      <div class="chaos-outer-field"></div>
      <div class="chaos-vortex"></div>
      <div class="chaos-shards">
        <span v-for="i in 12" :key="i" class="shard"></span>
      </div>
      <div class="chaos-particles">
        <span v-for="i in 16" :key="i" class="chaos-particle"></span>
      </div>
      <div v-if="isTriggering" class="chaos-flash"></div>
      <div class="reality-crack"></div>
    </template>
  </div>
</template>

<script setup>
/**
 * 怪物狂暴效果动画组件
 * 支持7种不同风格的狂暴视觉效果：
 * - chaos: 混沌狂暴（默认）- 时空撕裂，混沌降临
 * - flame: 红色火焰光环
 * - frost: 蓝色冰霜结晶
 * - thunder: 紫色雷电环绕
 * - shadow: 黑紫色暗影
 * - divine: 金色圣光
 * - poison: 绿色毒雾
 */
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  /**
   * 是否处于狂暴状态
   */
  isBerserk: {
    type: Boolean,
    default: false
  },
  /**
   * 狂暴触发时间戳（用于触发闪光效果）
   */
  berserkActivatedAt: {
    type: Number,
    default: null
  },
  /**
   * 狂暴动画类型
   * @type {'chaos'|'flame'|'frost'|'thunder'|'shadow'|'divine'|'poison'}
   */
  animationType: {
    type: String,
    default: 'chaos',
    validator: (value) => ['chaos', 'flame', 'frost', 'thunder', 'shadow', 'divine', 'poison'].includes(value)
  }
})

/** 是否正在播放触发动画 */
const isTriggering = ref(false)

/** 触发动画定时器 */
let triggerTimer = null

/**
 * 监听狂暴触发时间，播放触发动画
 */
watch(
  () => props.berserkActivatedAt,
  (newVal, oldVal) => {
    if (newVal && newVal !== oldVal && props.isBerserk) {
      playTriggerAnimation()
    }
  },
  { immediate: false }
)

/**
 * 播放狂暴触发动画
 */
function playTriggerAnimation () {
  if (triggerTimer) {
    clearTimeout(triggerTimer)
  }
  isTriggering.value = true
  triggerTimer = setTimeout(() => {
    isTriggering.value = false
    triggerTimer = null
  }, 800)
}

onUnmounted(() => {
  if (triggerTimer) {
    clearTimeout(triggerTimer)
    triggerTimer = null
  }
})
</script>

<style scoped>
/* ========================================
   通用样式
   ======================================== */
.berserk-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0; /* 在怪物图片同一层级的背景 */
  overflow: visible;
}

/* ========================================
   火焰狂暴（默认）- 红色火焰效果
   ======================================== */
.berserk-outer-glow {
  position: absolute;
  inset: -30px;
  border-radius: 30px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 0, 0, 0.4) 0%,
    rgba(255, 0, 0, 0.2) 30%,
    rgba(255, 0, 0, 0) 60%
  );
  animation: outerGlowPulse 1s ease-in-out infinite;
  filter: blur(8px);
}

@keyframes outerGlowPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}

.berserk-aura {
  position: absolute;
  inset: 0;
  border-radius: 15px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 50, 0, 0.6) 0%,
    rgba(255, 0, 0, 0.4) 30%,
    rgba(255, 0, 0, 0.1) 60%,
    rgba(255, 0, 0, 0) 80%
  );
  animation: berserkAuraPulse 0.8s ease-in-out infinite;
  box-shadow:
    0 0 20px rgba(255, 0, 0, 0.8),
    0 0 40px rgba(255, 50, 0, 0.6),
    inset 0 0 30px rgba(255, 100, 0, 0.3);
}

@keyframes berserkAuraPulse {
  0%, 100% {
    opacity: 0.8;
    transform: scale(1);
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.8), 0 0 40px rgba(255, 50, 0, 0.6), inset 0 0 30px rgba(255, 100, 0, 0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
    box-shadow: 0 0 30px rgba(255, 0, 0, 1), 0 0 60px rgba(255, 50, 0, 0.8), 0 0 80px rgba(255, 100, 0, 0.4), inset 0 0 40px rgba(255, 150, 0, 0.4);
  }
}

.berserk-inner-flame {
  position: absolute;
  inset: 15px;
  border-radius: 10px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 200, 0, 0.5) 0%,
    rgba(255, 100, 0, 0.3) 40%,
    rgba(255, 0, 0, 0) 70%
  );
  animation: innerFlamePulse 0.5s ease-in-out infinite alternate;
}

@keyframes innerFlamePulse {
  0% { opacity: 0.5; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1.05); }
}

.berserk-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: linear-gradient(to top, #ff0000, #ffaa00);
  border-radius: 50%;
  opacity: 0;
  animation: particleRise 1.2s ease-out infinite;
  box-shadow: 0 0 6px #ff4400, 0 0 12px #ff0000;
}

.particle:nth-child(1) { left: 8%; animation-delay: 0s; }
.particle:nth-child(2) { left: 18%; animation-delay: 0.1s; }
.particle:nth-child(3) { left: 28%; animation-delay: 0.2s; }
.particle:nth-child(4) { left: 38%; animation-delay: 0.3s; }
.particle:nth-child(5) { left: 48%; animation-delay: 0s; }
.particle:nth-child(6) { left: 58%; animation-delay: 0.15s; }
.particle:nth-child(7) { left: 68%; animation-delay: 0.25s; }
.particle:nth-child(8) { left: 78%; animation-delay: 0.35s; }
.particle:nth-child(9) { left: 12%; animation-delay: 0.4s; }
.particle:nth-child(10) { left: 42%; animation-delay: 0.5s; }
.particle:nth-child(11) { left: 62%; animation-delay: 0.45s; }
.particle:nth-child(12) { left: 88%; animation-delay: 0.55s; }

@keyframes particleRise {
  0% { bottom: 0; opacity: 0; transform: translateY(0) scale(0.5); }
  15% { opacity: 1; }
  50% { opacity: 0.8; }
  100% { bottom: 120%; opacity: 0; transform: translateY(-20px) scale(0.2); }
}

.berserk-flash {
  position: absolute;
  inset: -50px;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 100, 50, 0.9) 20%,
    rgba(255, 0, 0, 0.7) 40%,
    rgba(255, 0, 0, 0) 70%
  );
  animation: flashBurst 0.8s ease-out forwards;
}

@keyframes flashBurst {
  0% { opacity: 0; transform: scale(0.3); }
  20% { opacity: 1; transform: scale(1.3); }
  100% { opacity: 0; transform: scale(1.8); }
}

.berserk-edge-flames {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.edge-flame {
  position: absolute;
  width: 20px;
  height: 30px;
  background: linear-gradient(to top, rgba(255, 200, 0, 0.8), rgba(255, 50, 0, 0.4), transparent);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  animation: edgeFlamePulse 0.4s ease-in-out infinite alternate;
  filter: blur(1px);
}

.edge-flame:nth-child(1) { top: -10px; left: 10%; transform: rotate(-15deg); animation-delay: 0s; }
.edge-flame:nth-child(2) { top: -10px; left: 30%; transform: rotate(-10deg); animation-delay: 0.1s; }
.edge-flame:nth-child(3) { top: -10px; left: 50%; transform: rotate(0deg); animation-delay: 0.05s; }
.edge-flame:nth-child(4) { top: -10px; left: 70%; transform: rotate(10deg); animation-delay: 0.15s; }
.edge-flame:nth-child(5) { bottom: -10px; left: 15%; transform: rotate(165deg); animation-delay: 0.2s; }
.edge-flame:nth-child(6) { bottom: -10px; left: 40%; transform: rotate(175deg); animation-delay: 0.1s; }
.edge-flame:nth-child(7) { bottom: -10px; left: 65%; transform: rotate(185deg); animation-delay: 0.25s; }
.edge-flame:nth-child(8) { bottom: -10px; left: 85%; transform: rotate(195deg); animation-delay: 0.05s; }

@keyframes edgeFlamePulse {
  0% { opacity: 0.6; transform: scaleY(0.8); }
  100% { opacity: 1; transform: scaleY(1.2); }
}

.berserk-eyes {
  position: absolute;
  top: 25%;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 12px;
  display: flex;
  justify-content: space-between;
}

.berserk-eyes::before,
.berserk-eyes::after {
  content: '';
  width: 16px;
  height: 12px;
  background: radial-gradient(ellipse, #ff0000 20%, rgba(255, 100, 0, 0.8) 50%, rgba(255, 0, 0, 0) 80%);
  border-radius: 50%;
  animation: eyeGlow 0.5s ease-in-out infinite alternate;
  filter: blur(2px);
  box-shadow: 0 0 10px rgba(255, 0, 0, 1), 0 0 20px rgba(255, 50, 0, 0.8), 0 0 30px rgba(255, 100, 0, 0.6);
}

.berserk-eyes::after { animation-delay: 0.25s; }

@keyframes eyeGlow {
  0% { opacity: 0.6; box-shadow: 0 0 10px rgba(255, 0, 0, 0.8), 0 0 20px rgba(255, 50, 0, 0.5); }
  100% { opacity: 1; box-shadow: 0 0 15px rgba(255, 0, 0, 1), 0 0 30px rgba(255, 50, 0, 0.9), 0 0 45px rgba(255, 100, 0, 0.6); }
}

/* ========================================
   冰霜狂暴 - 蓝色冰晶效果
   ======================================== */
.frost-outer-mist {
  position: absolute;
  inset: -25px;
  border-radius: 25px;
  background: radial-gradient(
    ellipse at center,
    rgba(100, 200, 255, 0.3) 0%,
    rgba(50, 150, 255, 0.2) 40%,
    rgba(0, 100, 255, 0) 70%
  );
  animation: frostMistPulse 2s ease-in-out infinite;
  filter: blur(12px);
}

@keyframes frostMistPulse {
  0%, 100% { opacity: 0.5; transform: scale(1) rotate(0deg); }
  50% { opacity: 0.8; transform: scale(1.1) rotate(5deg); }
}

.frost-aura {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: radial-gradient(
    ellipse at center,
    rgba(150, 220, 255, 0.5) 0%,
    rgba(100, 180, 255, 0.4) 30%,
    rgba(50, 150, 255, 0.2) 60%,
    rgba(0, 100, 255, 0) 80%
  );
  animation: frostAuraPulse 1.2s ease-in-out infinite;
  box-shadow: 0 0 25px rgba(100, 200, 255, 0.8), 0 0 50px rgba(50, 150, 255, 0.5), inset 0 0 35px rgba(150, 220, 255, 0.3);
}

@keyframes frostAuraPulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); box-shadow: 0 0 35px rgba(100, 200, 255, 1), 0 0 70px rgba(50, 150, 255, 0.7), inset 0 0 50px rgba(200, 240, 255, 0.4); }
}

.frost-crystals {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.crystal {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 20px solid rgba(200, 240, 255, 0.7);
  animation: crystalSpin 4s linear infinite;
  filter: drop-shadow(0 0 5px rgba(150, 220, 255, 0.8));
}

.crystal:nth-child(1) { top: 5%; left: 20%; animation-delay: 0s; }
.crystal:nth-child(2) { top: 15%; left: 75%; animation-delay: 0.5s; transform: scale(0.8); }
.crystal:nth-child(3) { top: 60%; left: 10%; animation-delay: 1s; transform: scale(1.2); }
.crystal:nth-child(4) { top: 70%; left: 85%; animation-delay: 1.5s; }
.crystal:nth-child(5) { top: 30%; left: 5%; animation-delay: 2s; transform: scale(0.6); }
.crystal:nth-child(6) { top: 40%; left: 90%; animation-delay: 0.3s; transform: scale(0.9); }
.crystal:nth-child(7) { top: 80%; left: 30%; animation-delay: 0.8s; transform: scale(0.7); }
.crystal:nth-child(8) { top: 10%; left: 50%; animation-delay: 1.2s; transform: scale(1.1); }

@keyframes crystalSpin {
  0% { transform: rotate(0deg); opacity: 0.5; }
  50% { opacity: 1; }
  100% { transform: rotate(360deg); opacity: 0.5; }
}

.frost-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.frost-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: radial-gradient(circle, #ffffff, #88ddff);
  border-radius: 50%;
  opacity: 0;
  animation: frostFall 2s linear infinite;
  box-shadow: 0 0 6px #88ddff, 0 0 12px #44aaff;
}

.frost-particle:nth-child(1) { left: 5%; animation-delay: 0s; }
.frost-particle:nth-child(2) { left: 12%; animation-delay: 0.2s; }
.frost-particle:nth-child(3) { left: 20%; animation-delay: 0.4s; }
.frost-particle:nth-child(4) { left: 28%; animation-delay: 0.1s; }
.frost-particle:nth-child(5) { left: 35%; animation-delay: 0.3s; }
.frost-particle:nth-child(6) { left: 42%; animation-delay: 0.5s; }
.frost-particle:nth-child(7) { left: 50%; animation-delay: 0.15s; }
.frost-particle:nth-child(8) { left: 58%; animation-delay: 0.35s; }
.frost-particle:nth-child(9) { left: 65%; animation-delay: 0.25s; }
.frost-particle:nth-child(10) { left: 72%; animation-delay: 0.45s; }
.frost-particle:nth-child(11) { left: 80%; animation-delay: 0.05s; }
.frost-particle:nth-child(12) { left: 88%; animation-delay: 0.55s; }
.frost-particle:nth-child(13) { left: 15%; animation-delay: 0.6s; }
.frost-particle:nth-child(14) { left: 55%; animation-delay: 0.7s; }
.frost-particle:nth-child(15) { left: 78%; animation-delay: 0.8s; }

@keyframes frostFall {
  0% { top: 0%; opacity: 0; transform: translateY(0) rotate(0deg); }
  10% { opacity: 1; }
  90% { opacity: 0.8; }
  100% { top: 110%; opacity: 0; transform: translateY(20px) rotate(180deg); }
}

.frost-flash {
  position: absolute;
  inset: -40px;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 1) 0%,
    rgba(150, 220, 255, 0.9) 20%,
    rgba(50, 150, 255, 0.6) 50%,
    rgba(0, 100, 255, 0) 80%
  );
  animation: frostFlashBurst 1s ease-out forwards;
}

@keyframes frostFlashBurst {
  0% { opacity: 0; transform: scale(0.3) rotate(0deg); }
  30% { opacity: 1; transform: scale(1.2) rotate(15deg); }
  100% { opacity: 0; transform: scale(1.6) rotate(30deg); }
}

.frost-spikes {
  position: absolute;
  inset: -10px;
  pointer-events: none;
}

.spike {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0.8;
  animation: spikeGrow 0.8s ease-in-out infinite alternate;
}

.spike:nth-child(1) { top: -5px; left: 15%; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 25px solid rgba(150, 220, 255, 0.9); animation-delay: 0s; }
.spike:nth-child(2) { top: -5px; left: 45%; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 30px solid rgba(100, 200, 255, 0.9); animation-delay: 0.15s; }
.spike:nth-child(3) { top: -5px; left: 75%; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 22px solid rgba(180, 230, 255, 0.9); animation-delay: 0.3s; }
.spike:nth-child(4) { bottom: -5px; left: 25%; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 28px solid rgba(120, 200, 255, 0.9); animation-delay: 0.1s; }
.spike:nth-child(5) { bottom: -5px; left: 55%; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 24px solid rgba(150, 220, 255, 0.9); animation-delay: 0.25s; }
.spike:nth-child(6) { bottom: -5px; left: 85%; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 26px solid rgba(100, 180, 255, 0.9); animation-delay: 0.4s; }

@keyframes spikeGrow {
  0% { opacity: 0.5; transform: scaleY(0.7); }
  100% { opacity: 1; transform: scaleY(1.3); }
}

/* ========================================
   雷电狂暴 - 紫色闪电效果
   ======================================== */
.thunder-outer-field {
  position: absolute;
  inset: -25px;
  border-radius: 25px;
  background: radial-gradient(
    ellipse at center,
    rgba(150, 50, 255, 0.3) 0%,
    rgba(100, 0, 200, 0.2) 40%,
    rgba(50, 0, 150, 0) 70%
  );
  animation: thunderFieldPulse 0.3s ease-in-out infinite alternate;
  filter: blur(10px);
}

@keyframes thunderFieldPulse {
  0% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.05); }
}

.thunder-aura {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: radial-gradient(
    ellipse at center,
    rgba(180, 100, 255, 0.5) 0%,
    rgba(150, 50, 255, 0.4) 30%,
    rgba(100, 0, 200, 0.2) 60%,
    rgba(50, 0, 150, 0) 80%
  );
  animation: thunderAuraPulse 0.6s ease-in-out infinite;
  box-shadow: 0 0 25px rgba(150, 50, 255, 0.8), 0 0 50px rgba(100, 0, 200, 0.6), inset 0 0 35px rgba(200, 150, 255, 0.3);
}

@keyframes thunderAuraPulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); box-shadow: 0 0 35px rgba(180, 100, 255, 1), 0 0 70px rgba(150, 50, 255, 0.8), inset 0 0 50px rgba(220, 180, 255, 0.4); }
}

.thunder-arcs {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.arc {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  animation: arcFlash 1.5s ease-in-out infinite;
}

.arc::before {
  content: '';
  position: absolute;
  width: 3px;
  height: 60px;
  background: linear-gradient(to bottom, transparent, #cc88ff, #ffffff, #cc88ff, transparent);
  box-shadow: 0 0 10px #aa66ff, 0 0 20px #8844ff;
  transform-origin: center;
}

.arc:nth-child(1)::before { left: 15%; top: 10%; transform: rotate(25deg); animation-delay: 0s; }
.arc:nth-child(2)::before { left: 40%; top: 5%; transform: rotate(-15deg); animation-delay: 0.25s; }
.arc:nth-child(3)::before { right: 15%; top: 15%; transform: rotate(35deg); animation-delay: 0.5s; }
.arc:nth-child(4)::before { left: 25%; bottom: 10%; transform: rotate(-30deg); animation-delay: 0.75s; }
.arc:nth-child(5)::before { left: 55%; bottom: 5%; transform: rotate(20deg); animation-delay: 1s; }
.arc:nth-child(6)::before { right: 25%; bottom: 15%; transform: rotate(-40deg); animation-delay: 1.25s; }

@keyframes arcFlash {
  0%, 90%, 100% { opacity: 0; }
  5%, 15% { opacity: 1; }
  20%, 85% { opacity: 0.3; }
}

.thunder-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.spark {
  position: absolute;
  width: 3px;
  height: 3px;
  background: #ffffff;
  border-radius: 50%;
  opacity: 0;
  animation: sparkJump 0.8s ease-out infinite;
  box-shadow: 0 0 8px #cc88ff, 0 0 16px #aa66ff;
}

.spark:nth-child(1) { left: 10%; animation-delay: 0s; }
.spark:nth-child(2) { left: 15%; animation-delay: 0.1s; }
.spark:nth-child(3) { left: 20%; animation-delay: 0.05s; }
.spark:nth-child(4) { left: 30%; animation-delay: 0.15s; }
.spark:nth-child(5) { left: 35%; animation-delay: 0.08s; }
.spark:nth-child(6) { left: 45%; animation-delay: 0.2s; }
.spark:nth-child(7) { left: 50%; animation-delay: 0.12s; }
.spark:nth-child(8) { left: 55%; animation-delay: 0.03s; }
.spark:nth-child(9) { left: 60%; animation-delay: 0.18s; }
.spark:nth-child(10) { left: 65%; animation-delay: 0.07s; }
.spark:nth-child(11) { left: 70%; animation-delay: 0.22s; }
.spark:nth-child(12) { left: 75%; animation-delay: 0.11s; }
.spark:nth-child(13) { left: 80%; animation-delay: 0.04s; }
.spark:nth-child(14) { left: 85%; animation-delay: 0.16s; }
.spark:nth-child(15) { left: 12%; animation-delay: 0.25s; }
.spark:nth-child(16) { left: 38%; animation-delay: 0.09s; }
.spark:nth-child(17) { left: 62%; animation-delay: 0.14s; }
.spark:nth-child(18) { left: 78%; animation-delay: 0.23s; }
.spark:nth-child(19) { left: 92%; animation-delay: 0.06s; }
.spark:nth-child(20) { left: 48%; animation-delay: 0.19s; }

@keyframes sparkJump {
  0% { top: 50%; opacity: 0; transform: translateX(0) translateY(0) scale(0.5); }
  20% { opacity: 1; }
  100% { opacity: 0; transform: translateX(var(--dx, 15px)) translateY(var(--dy, -25px)) scale(1.5); }
}

.spark:nth-child(odd) { --dx: 15px; --dy: -25px; }
.spark:nth-child(even) { --dx: -15px; --dy: -30px; }
.spark:nth-child(3n) { --dx: 0px; --dy: -35px; }

.thunder-flash {
  position: absolute;
  inset: -50px;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 1) 0%,
    rgba(200, 150, 255, 0.9) 15%,
    rgba(150, 50, 255, 0.7) 35%,
    rgba(100, 0, 200, 0) 60%
  );
  animation: thunderFlashBurst 0.6s ease-out forwards;
}

@keyframes thunderFlashBurst {
  0% { opacity: 0; transform: scale(0.2); }
  15% { opacity: 1; transform: scale(1.4); }
  30% { opacity: 0.8; transform: scale(1.2); }
  45% { opacity: 1; transform: scale(1.5); }
  100% { opacity: 0; transform: scale(1.8); }
}

.thunder-orbs {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.orb {
  position: absolute;
  width: 12px;
  height: 12px;
  background: radial-gradient(circle, #ffffff, #cc88ff);
  border-radius: 50%;
  animation: orbOrbit 2s linear infinite;
  box-shadow: 0 0 15px #aa66ff, 0 0 30px #8844ff;
}

.orb:nth-child(1) { animation-delay: 0s; }
.orb:nth-child(2) { animation-delay: 0.5s; }
.orb:nth-child(3) { animation-delay: 1s; }
.orb:nth-child(4) { animation-delay: 1.5s; }

@keyframes orbOrbit {
  0% { top: 50%; left: -5%; transform: translateY(-50%); }
  25% { top: -5%; left: 50%; transform: translateX(-50%); }
  50% { top: 50%; left: 105%; transform: translateY(-50%); }
  75% { top: 105%; left: 50%; transform: translateX(-50%); }
  100% { top: 50%; left: -5%; transform: translateY(-50%); }
}

/* ========================================
   暗影狂暴 - 黑紫色暗影效果
   ======================================== */
.shadow-outer-mist {
  position: absolute;
  inset: -30px;
  border-radius: 30px;
  background: radial-gradient(
    ellipse at center,
    rgba(50, 0, 80, 0.4) 0%,
    rgba(30, 0, 50, 0.3) 40%,
    rgba(10, 0, 20, 0) 70%
  );
  animation: shadowMistFlow 3s ease-in-out infinite;
  filter: blur(15px);
}

@keyframes shadowMistFlow {
  0%, 100% { opacity: 0.6; transform: scale(1) rotate(0deg); }
  50% { opacity: 0.9; transform: scale(1.1) rotate(5deg); }
}

.shadow-aura {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: radial-gradient(
    ellipse at center,
    rgba(80, 20, 120, 0.6) 0%,
    rgba(50, 0, 80, 0.5) 30%,
    rgba(30, 0, 50, 0.3) 60%,
    rgba(10, 0, 20, 0) 80%
  );
  animation: shadowAuraPulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 30px rgba(80, 20, 120, 0.7), 0 0 60px rgba(50, 0, 80, 0.5), inset 0 0 40px rgba(100, 30, 150, 0.4);
}

@keyframes shadowAuraPulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.06); box-shadow: 0 0 40px rgba(100, 30, 150, 0.9), 0 0 80px rgba(80, 20, 120, 0.6), inset 0 0 60px rgba(120, 40, 180, 0.5); }
}

.shadow-hands {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hand {
  position: absolute;
  width: 20px;
  height: 35px;
  background: linear-gradient(to top, rgba(30, 0, 50, 0.9), rgba(80, 20, 120, 0.6), transparent);
  border-radius: 5px 5px 50% 50%;
  opacity: 0;
  animation: handReach 2s ease-out infinite;
  filter: blur(2px);
}

.hand::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 12px;
  background: rgba(80, 20, 120, 0.8);
  border-radius: 50%;
}

.hand:nth-child(1) { bottom: -15px; left: 10%; animation-delay: 0s; }
.hand:nth-child(2) { bottom: -15px; left: 28%; animation-delay: 0.35s; }
.hand:nth-child(3) { bottom: -15px; left: 46%; animation-delay: 0.7s; }
.hand:nth-child(4) { bottom: -15px; left: 64%; animation-delay: 1.05s; }
.hand:nth-child(5) { bottom: -15px; left: 82%; animation-delay: 1.4s; }
.hand:nth-child(6) { bottom: -15px; left: 55%; animation-delay: 1.75s; }

@keyframes handReach {
  0% { opacity: 0; transform: translateY(20px) scaleY(0.5); }
  30% { opacity: 0.8; transform: translateY(0) scaleY(1); }
  60% { opacity: 0.6; transform: translateY(-10px) scaleY(1.1); }
  100% { opacity: 0; transform: translateY(-25px) scaleY(0.8); }
}

.shadow-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.wisp {
  position: absolute;
  width: 8px;
  height: 15px;
  background: linear-gradient(to top, rgba(80, 20, 120, 0.8), rgba(50, 0, 80, 0.4), transparent);
  border-radius: 50%;
  opacity: 0;
  animation: wispFloat 2.5s ease-in-out infinite;
  filter: blur(3px);
}

.wisp:nth-child(1) { left: 5%; animation-delay: 0s; }
.wisp:nth-child(2) { left: 12%; animation-delay: 0.2s; }
.wisp:nth-child(3) { left: 22%; animation-delay: 0.4s; }
.wisp:nth-child(4) { left: 32%; animation-delay: 0.15s; }
.wisp:nth-child(5) { left: 42%; animation-delay: 0.35s; }
.wisp:nth-child(6) { left: 50%; animation-delay: 0.1s; }
.wisp:nth-child(7) { left: 58%; animation-delay: 0.3s; }
.wisp:nth-child(8) { left: 68%; animation-delay: 0.5s; }
.wisp:nth-child(9) { left: 75%; animation-delay: 0.25s; }
.wisp:nth-child(10) { left: 82%; animation-delay: 0.45s; }
.wisp:nth-child(11) { left: 90%; animation-delay: 0.55s; }
.wisp:nth-child(12) { left: 18%; animation-delay: 0.6s; }
.wisp:nth-child(13) { left: 48%; animation-delay: 0.7s; }
.wisp:nth-child(14) { left: 72%; animation-delay: 0.8s; }
.wisp:nth-child(15) { left: 8%; animation-delay: 0.65s; }
.wisp:nth-child(16) { left: 85%; animation-delay: 0.75s; }

@keyframes wispFloat {
  0% { bottom: 0%; opacity: 0; transform: translateY(0) scale(0.5); }
  20% { opacity: 0.8; }
  80% { opacity: 0.5; }
  100% { bottom: 120%; opacity: 0; transform: translateY(-30px) scale(1.2); }
}

.shadow-flash {
  position: absolute;
  inset: -40px;
  background: radial-gradient(
    circle at center,
    rgba(150, 80, 200, 0.9) 0%,
    rgba(100, 30, 150, 0.7) 25%,
    rgba(50, 0, 80, 0.5) 50%,
    rgba(20, 0, 30, 0) 75%
  );
  animation: shadowFlashBurst 1s ease-out forwards;
}

@keyframes shadowFlashBurst {
  0% { opacity: 0; transform: scale(0.5) rotate(0deg); }
  30% { opacity: 1; transform: scale(1.1) rotate(-10deg); }
  60% { opacity: 0.7; transform: scale(1.3) rotate(5deg); }
  100% { opacity: 0; transform: scale(1.5) rotate(-5deg); }
}

.shadow-vortex {
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  border: 2px solid transparent;
  animation: vortexSpin 4s linear infinite;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(100, 30, 150, 0.4) 60deg,
    transparent 120deg,
    rgba(80, 20, 120, 0.3) 180deg,
    transparent 240deg,
    rgba(60, 10, 100, 0.4) 300deg,
    transparent 360deg
  );
  filter: blur(2px);
}

@keyframes vortexSpin {
  0% { transform: rotate(0deg); opacity: 0.5; }
  50% { opacity: 0.8; }
  100% { transform: rotate(360deg); opacity: 0.5; }
}

/* ========================================
   神圣狂暴 - 金色圣光效果
   ======================================== */
.divine-outer-light {
  position: absolute;
  inset: -30px;
  border-radius: 30px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 215, 0, 0.3) 0%,
    rgba(255, 180, 0, 0.2) 40%,
    rgba(255, 150, 0, 0) 70%
  );
  animation: divineLightPulse 1.5s ease-in-out infinite;
  filter: blur(12px);
}

@keyframes divineLightPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

.divine-aura {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 230, 100, 0.5) 0%,
    rgba(255, 200, 50, 0.4) 30%,
    rgba(255, 180, 0, 0.2) 60%,
    rgba(255, 150, 0, 0) 80%
  );
  animation: divineAuraPulse 1s ease-in-out infinite;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.7), 0 0 60px rgba(255, 180, 0, 0.5), inset 0 0 40px rgba(255, 240, 150, 0.3);
}

@keyframes divineAuraPulse {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); box-shadow: 0 0 40px rgba(255, 230, 100, 0.9), 0 0 80px rgba(255, 200, 50, 0.7), inset 0 0 60px rgba(255, 250, 200, 0.4); }
}

.divine-pillars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.pillar {
  position: absolute;
  width: 4px;
  height: 50px;
  background: linear-gradient(to top, rgba(255, 215, 0, 0.8), rgba(255, 240, 150, 0.4), transparent);
  opacity: 0;
  animation: pillarRise 1.5s ease-out infinite;
  filter: blur(1px);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
}

.pillar:nth-child(1) { left: 10%; animation-delay: 0s; }
.pillar:nth-child(2) { left: 22%; animation-delay: 0.2s; }
.pillar:nth-child(3) { left: 35%; animation-delay: 0.4s; }
.pillar:nth-child(4) { left: 48%; animation-delay: 0.6s; }
.pillar:nth-child(5) { left: 58%; animation-delay: 0.1s; }
.pillar:nth-child(6) { left: 70%; animation-delay: 0.3s; }
.pillar:nth-child(7) { left: 82%; animation-delay: 0.5s; }
.pillar:nth-child(8) { left: 92%; animation-delay: 0.7s; }

@keyframes pillarRise {
  0% { bottom: 0%; opacity: 0; transform: scaleY(0.3); }
  30% { opacity: 1; transform: scaleY(1); }
  80% { opacity: 0.6; }
  100% { bottom: 120%; opacity: 0; transform: scaleY(1.2); }
}

.divine-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.light-particle {
  position: absolute;
  width: 5px;
  height: 5px;
  background: radial-gradient(circle, #ffffff, #ffd700);
  border-radius: 50%;
  opacity: 0;
  animation: lightFloat 2s ease-in-out infinite;
  box-shadow: 0 0 8px #ffd700, 0 0 16px #ffaa00;
}

.light-particle:nth-child(1) { left: 5%; animation-delay: 0s; }
.light-particle:nth-child(2) { left: 12%; animation-delay: 0.15s; }
.light-particle:nth-child(3) { left: 20%; animation-delay: 0.3s; }
.light-particle:nth-child(4) { left: 28%; animation-delay: 0.45s; }
.light-particle:nth-child(5) { left: 35%; animation-delay: 0.1s; }
.light-particle:nth-child(6) { left: 42%; animation-delay: 0.25s; }
.light-particle:nth-child(7) { left: 50%; animation-delay: 0.4s; }
.light-particle:nth-child(8) { left: 57%; animation-delay: 0.55s; }
.light-particle:nth-child(9) { left: 65%; animation-delay: 0.05s; }
.light-particle:nth-child(10) { left: 72%; animation-delay: 0.2s; }
.light-particle:nth-child(11) { left: 78%; animation-delay: 0.35s; }
.light-particle:nth-child(12) { left: 85%; animation-delay: 0.5s; }
.light-particle:nth-child(13) { left: 92%; animation-delay: 0.6s; }
.light-particle:nth-child(14) { left: 8%; animation-delay: 0.7s; }
.light-particle:nth-child(15) { left: 45%; animation-delay: 0.8s; }
.light-particle:nth-child(16) { left: 62%; animation-delay: 0.65s; }
.light-particle:nth-child(17) { left: 88%; animation-delay: 0.75s; }
.light-particle:nth-child(18) { left: 30%; animation-delay: 0.85s; }

@keyframes lightFloat {
  0% { bottom: 0%; opacity: 0; transform: translateY(0) scale(0.5); }
  20% { opacity: 1; transform: translateY(-10px) scale(1); }
  50% { opacity: 0.8; }
  100% { bottom: 130%; opacity: 0; transform: translateY(-40px) scale(0.3); }
}

.divine-flash {
  position: absolute;
  inset: -50px;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 240, 200, 0.95) 15%,
    rgba(255, 215, 0, 0.8) 30%,
    rgba(255, 180, 0, 0.4) 50%,
    rgba(255, 150, 0, 0) 70%
  );
  animation: divineFlashBurst 1s ease-out forwards;
}

@keyframes divineFlashBurst {
  0% { opacity: 0; transform: scale(0.2); }
  25% { opacity: 1; transform: scale(1.2); }
  50% { opacity: 0.9; transform: scale(1); }
  75% { opacity: 0.6; transform: scale(1.3); }
  100% { opacity: 0; transform: scale(1.6); }
}

.divine-halo {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 3px solid rgba(255, 215, 0, 0.6);
  animation: haloRotate 3s linear infinite;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
}

.divine-halo::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px dashed rgba(255, 230, 100, 0.4);
  animation: haloRotate 2s linear infinite reverse;
}

@keyframes haloRotate {
  0% { transform: rotate(0deg); opacity: 0.5; }
  50% { opacity: 0.8; }
  100% { transform: rotate(360deg); opacity: 0.5; }
}

.divine-runes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.rune {
  position: absolute;
  width: 16px;
  height: 16px;
  opacity: 0.6;
  animation: runeGlow 2s ease-in-out infinite;
}

.rune::before {
  content: '✦';
  font-size: 14px;
  color: rgba(255, 215, 0, 0.8);
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
}

.rune:nth-child(1) { top: 10%; left: 15%; animation-delay: 0s; }
.rune:nth-child(2) { top: 10%; right: 15%; animation-delay: 0.3s; }
.rune:nth-child(3) { top: 50%; left: 5%; animation-delay: 0.6s; }
.rune:nth-child(4) { top: 50%; right: 5%; animation-delay: 0.9s; }
.rune:nth-child(5) { bottom: 10%; left: 20%; animation-delay: 1.2s; }
.rune:nth-child(6) { bottom: 10%; right: 20%; animation-delay: 1.5s; }

@keyframes runeGlow {
  0%, 100% { opacity: 0.4; transform: scale(0.8) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
}

/* ========================================
   剧毒狂暴 - 绿色毒雾效果
   ======================================== */
.poison-outer-cloud {
  position: absolute;
  inset: -25px;
  border-radius: 25px;
  background: radial-gradient(
    ellipse at center,
    rgba(50, 200, 50, 0.3) 0%,
    rgba(30, 150, 30, 0.2) 40%,
    rgba(0, 100, 0, 0) 70%
  );
  animation: poisonCloudFlow 2s ease-in-out infinite;
  filter: blur(12px);
}

@keyframes poisonCloudFlow {
  0%, 100% { opacity: 0.5; transform: scale(1) translateY(0); }
  50% { opacity: 0.8; transform: scale(1.08) translateY(-5px); }
}

.poison-aura {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: radial-gradient(
    ellipse at center,
    rgba(100, 220, 100, 0.5) 0%,
    rgba(50, 180, 50, 0.4) 30%,
    rgba(30, 150, 30, 0.2) 60%,
    rgba(0, 100, 0, 0) 80%
  );
  animation: poisonAuraPulse 1.2s ease-in-out infinite;
  box-shadow: 0 0 25px rgba(50, 200, 50, 0.6), 0 0 50px rgba(30, 150, 30, 0.4), inset 0 0 35px rgba(100, 220, 100, 0.3);
}

@keyframes poisonAuraPulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.06); box-shadow: 0 0 35px rgba(80, 220, 80, 0.8), 0 0 70px rgba(50, 180, 50, 0.5), inset 0 0 50px rgba(120, 240, 120, 0.4); }
}

.poison-bubbles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bubble {
  position: absolute;
  width: 10px;
  height: 10px;
  background: radial-gradient(circle at 30% 30%, rgba(200, 255, 200, 0.8), rgba(50, 200, 50, 0.6));
  border-radius: 50%;
  opacity: 0;
  animation: bubbleRise 2s ease-out infinite;
  box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.5);
}

.bubble:nth-child(1) { left: 8%; animation-delay: 0s; }
.bubble:nth-child(2) { left: 18%; animation-delay: 0.2s; width: 8px; height: 8px; }
.bubble:nth-child(3) { left: 28%; animation-delay: 0.4s; }
.bubble:nth-child(4) { left: 38%; animation-delay: 0.15s; width: 12px; height: 12px; }
.bubble:nth-child(5) { left: 48%; animation-delay: 0.35s; }
.bubble:nth-child(6) { left: 58%; animation-delay: 0.5s; width: 9px; height: 9px; }
.bubble:nth-child(7) { left: 68%; animation-delay: 0.25s; }
.bubble:nth-child(8) { left: 78%; animation-delay: 0.1s; width: 11px; height: 11px; }
.bubble:nth-child(9) { left: 88%; animation-delay: 0.45s; }
.bubble:nth-child(10) { left: 15%; animation-delay: 0.6s; width: 7px; height: 7px; }
.bubble:nth-child(11) { left: 55%; animation-delay: 0.55s; }
.bubble:nth-child(12) { left: 82%; animation-delay: 0.3s; width: 8px; height: 8px; }

@keyframes bubbleRise {
  0% { bottom: 0%; opacity: 0; transform: translateY(0) scale(0.5); }
  20% { opacity: 0.9; transform: translateY(-10px) scale(1); }
  80% { opacity: 0.6; }
  100% { bottom: 130%; opacity: 0; transform: translateY(-30px) scale(0.8); }
}

.poison-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.toxin {
  position: absolute;
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, #88ff88, #44aa44);
  border-radius: 50%;
  opacity: 0;
  animation: toxinDrift 2.5s ease-in-out infinite;
  filter: blur(1px);
}

.toxin:nth-child(1) { left: 5%; animation-delay: 0s; }
.toxin:nth-child(2) { left: 15%; animation-delay: 0.2s; }
.toxin:nth-child(3) { left: 25%; animation-delay: 0.4s; }
.toxin:nth-child(4) { left: 35%; animation-delay: 0.15s; }
.toxin:nth-child(5) { left: 45%; animation-delay: 0.35s; }
.toxin:nth-child(6) { left: 55%; animation-delay: 0.1s; }
.toxin:nth-child(7) { left: 65%; animation-delay: 0.3s; }
.toxin:nth-child(8) { left: 75%; animation-delay: 0.5s; }
.toxin:nth-child(9) { left: 85%; animation-delay: 0.25s; }
.toxin:nth-child(10) { left: 95%; animation-delay: 0.45s; }
.toxin:nth-child(11) { left: 10%; animation-delay: 0.55s; }
.toxin:nth-child(12) { left: 40%; animation-delay: 0.6s; }
.toxin:nth-child(13) { left: 70%; animation-delay: 0.65s; }
.toxin:nth-child(14) { left: 90%; animation-delay: 0.7s; }

@keyframes toxinDrift {
  0% { bottom: 0%; opacity: 0; transform: translateX(0) translateY(0) scale(0.5); }
  20% { opacity: 0.8; }
  80% { opacity: 0.5; }
  100% { bottom: 120%; opacity: 0; transform: translateX(20px) translateY(-30px) scale(1.2); }
}

.toxin:nth-child(even) { animation-name: toxinDriftAlt; }

@keyframes toxinDriftAlt {
  0% { bottom: 0%; opacity: 0; transform: translateX(0) translateY(0) scale(0.5); }
  20% { opacity: 0.8; }
  80% { opacity: 0.5; }
  100% { bottom: 120%; opacity: 0; transform: translateX(-20px) translateY(-30px) scale(1.2); }
}

.poison-flash {
  position: absolute;
  inset: -40px;
  background: radial-gradient(
    circle at center,
    rgba(200, 255, 200, 0.9) 0%,
    rgba(100, 220, 100, 0.7) 25%,
    rgba(50, 180, 50, 0.5) 50%,
    rgba(0, 100, 0, 0) 75%
  );
  animation: poisonFlashBurst 1s ease-out forwards;
}

@keyframes poisonFlashBurst {
  0% { opacity: 0; transform: scale(0.4); }
  30% { opacity: 1; transform: scale(1.1); }
  60% { opacity: 0.7; transform: scale(1.2); }
  100% { opacity: 0; transform: scale(1.5); }
}

.poison-drips {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.drip {
  position: absolute;
  width: 4px;
  height: 12px;
  background: linear-gradient(to bottom, rgba(100, 220, 100, 0.8), rgba(50, 180, 50, 0.6), rgba(30, 150, 30, 0.4));
  border-radius: 0 0 50% 50%;
  opacity: 0;
  animation: dripFall 1.8s ease-in infinite;
}

.drip:nth-child(1) { left: 12%; animation-delay: 0s; }
.drip:nth-child(2) { left: 25%; animation-delay: 0.25s; }
.drip:nth-child(3) { left: 38%; animation-delay: 0.5s; }
.drip:nth-child(4) { left: 52%; animation-delay: 0.15s; }
.drip:nth-child(5) { left: 65%; animation-delay: 0.4s; }
.drip:nth-child(6) { left: 78%; animation-delay: 0.6s; }
.drip:nth-child(7) { left: 88%; animation-delay: 0.1s; }
.drip:nth-child(8) { left: 45%; animation-delay: 0.35s; }

@keyframes dripFall {
  0% { top: 0%; opacity: 0; transform: scaleY(0.5); }
  20% { opacity: 0.9; transform: scaleY(1); }
  90% { opacity: 0.7; }
  100% { top: 110%; opacity: 0; transform: scaleY(1); }
}

.poison-skull {
  position: absolute;
  top: 25%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20px;
  opacity: 0;
  animation: skullPulse 2s ease-in-out infinite;
  text-shadow: 0 0 10px rgba(100, 220, 100, 0.8), 0 0 20px rgba(50, 180, 50, 0.6);
}

.poison-skull::before {
  content: '☠';
  color: rgba(150, 255, 150, 0.7);
}

@keyframes skullPulse {
  0%, 100% { opacity: 0.3; transform: translateX(-50%) scale(0.8); }
  50% { opacity: 0.8; transform: translateX(-50%) scale(1.1); }
}

/* ========================================
   混沌狂暴 - 时空撕裂效果（默认）
   ======================================== */
.chaos-outer-field {
  position: absolute;
  inset: -40px;
  border-radius: 40px;
  background: radial-gradient(
    ellipse at center,
    rgba(128, 0, 128, 0.25) 0%,
    rgba(75, 0, 130, 0.15) 40%,
    rgba(50, 0, 80, 0) 70%
  );
  animation: chaosFieldPulse 2s ease-in-out infinite;
  filter: blur(15px);
}

@keyframes chaosFieldPulse {
  0%, 100% { opacity: 0.5; transform: scale(1) rotate(0deg); }
  50% { opacity: 0.8; transform: scale(1.1) rotate(10deg); }
}

.chaos-vortex {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90px;
  height: 90px;
  border: 3px dashed rgba(128, 0, 128, 0.6);
  border-radius: 50%;
  animation: chaosVortex 1s linear infinite;
  box-shadow: 0 0 15px rgba(128, 0, 128, 0.5);
}

.chaos-vortex::before {
  content: '';
  position: absolute;
  inset: -10px;
  border: 2px dashed rgba(255, 0, 255, 0.4);
  border-radius: 50%;
  animation: chaosVortex 1.5s linear infinite reverse;
}

@keyframes chaosVortex {
  0% { transform: translate(-50%, -50%) rotate(0deg); opacity: 0.6; }
  50% { opacity: 1; }
  100% { transform: translate(-50%, -50%) rotate(-360deg); opacity: 0.6; }
}

.chaos-shards {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 18px solid rgba(128, 0, 128, 0.7);
  transform-origin: center center;
  animation: shardFloat 2s ease-in-out infinite;
  filter: drop-shadow(0 0 4px rgba(200, 0, 255, 0.8));
}

.shard:nth-child(1) { transform: rotate(0deg) translate(45px, -15px); animation-delay: 0s; }
.shard:nth-child(2) { transform: rotate(30deg) translate(45px, -15px); animation-delay: 0.15s; }
.shard:nth-child(3) { transform: rotate(60deg) translate(45px, -15px); animation-delay: 0.3s; }
.shard:nth-child(4) { transform: rotate(90deg) translate(45px, -15px); animation-delay: 0.45s; }
.shard:nth-child(5) { transform: rotate(120deg) translate(45px, -15px); animation-delay: 0.6s; }
.shard:nth-child(6) { transform: rotate(150deg) translate(45px, -15px); animation-delay: 0.75s; }
.shard:nth-child(7) { transform: rotate(180deg) translate(45px, -15px); animation-delay: 0.9s; }
.shard:nth-child(8) { transform: rotate(210deg) translate(45px, -15px); animation-delay: 1.05s; }
.shard:nth-child(9) { transform: rotate(240deg) translate(45px, -15px); animation-delay: 1.2s; }
.shard:nth-child(10) { transform: rotate(270deg) translate(45px, -15px); animation-delay: 1.35s; }
.shard:nth-child(11) { transform: rotate(300deg) translate(45px, -15px); animation-delay: 1.5s; }
.shard:nth-child(12) { transform: rotate(330deg) translate(45px, -15px); animation-delay: 1.65s; }

@keyframes shardFloat {
  0%, 100% { opacity: 0.3; filter: drop-shadow(0 0 4px rgba(200, 0, 255, 0.5)); }
  50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(255, 0, 255, 1)); }
}

.chaos-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.chaos-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: radial-gradient(circle, #ff00ff, #800080);
  border-radius: 50%;
  opacity: 0;
  animation: chaosParticleDrift 2.5s ease-in-out infinite;
  box-shadow: 0 0 8px #ff00ff;
}

.chaos-particle:nth-child(1) { left: 10%; animation-delay: 0s; }
.chaos-particle:nth-child(2) { left: 20%; animation-delay: 0.15s; }
.chaos-particle:nth-child(3) { left: 30%; animation-delay: 0.3s; }
.chaos-particle:nth-child(4) { left: 40%; animation-delay: 0.45s; }
.chaos-particle:nth-child(5) { left: 50%; animation-delay: 0.6s; }
.chaos-particle:nth-child(6) { left: 60%; animation-delay: 0.75s; }
.chaos-particle:nth-child(7) { left: 70%; animation-delay: 0.9s; }
.chaos-particle:nth-child(8) { left: 80%; animation-delay: 1.05s; }
.chaos-particle:nth-child(9) { left: 15%; animation-delay: 1.2s; }
.chaos-particle:nth-child(10) { left: 35%; animation-delay: 0.12s; }
.chaos-particle:nth-child(11) { left: 55%; animation-delay: 0.27s; }
.chaos-particle:nth-child(12) { left: 75%; animation-delay: 0.42s; }
.chaos-particle:nth-child(13) { left: 25%; animation-delay: 0.57s; }
.chaos-particle:nth-child(14) { left: 45%; animation-delay: 0.72s; }
.chaos-particle:nth-child(15) { left: 65%; animation-delay: 0.87s; }
.chaos-particle:nth-child(16) { left: 85%; animation-delay: 1.02s; }

@keyframes chaosParticleDrift {
  0% { bottom: 0%; opacity: 0; transform: translateY(0) scale(0.5) rotate(0deg); }
  20% { opacity: 0.9; }
  80% { opacity: 0.6; }
  100% { bottom: 130%; opacity: 0; transform: translateY(-40px) scale(1.2) rotate(180deg); }
}

.chaos-flash {
  position: absolute;
  inset: -60px;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 0, 255, 0.9) 15%,
    rgba(128, 0, 128, 0.7) 35%,
    rgba(75, 0, 130, 0.4) 55%,
    rgba(50, 0, 80, 0) 75%
  );
  animation: chaosFlashBurst 0.8s ease-out forwards;
}

@keyframes chaosFlashBurst {
  0% { opacity: 0; transform: scale(0.3) rotate(0deg); }
  25% { opacity: 1; transform: scale(1.2) rotate(15deg); }
  50% { opacity: 0.8; transform: scale(1.1) rotate(-10deg); }
  75% { opacity: 0.5; transform: scale(1.3) rotate(5deg); }
  100% { opacity: 0; transform: scale(1.6) rotate(-5deg); }
}

.reality-crack {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70px;
  height: 70px;
  background: 
    linear-gradient(45deg, transparent 45%, rgba(255, 0, 255, 0.8) 45%, rgba(255, 0, 255, 0.8) 55%, transparent 55%),
    linear-gradient(-45deg, transparent 45%, rgba(0, 255, 255, 0.8) 45%, rgba(0, 255, 255, 0.8) 55%, transparent 55%);
  animation: realityCrack 0.4s ease-in-out infinite;
  opacity: 0.8;
}

@keyframes realityCrack {
  0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.15) rotate(5deg); opacity: 1; }
}

/* ========================================
   触发时的增强效果
   ======================================== */
.berserk-trigger .berserk-aura { animation-duration: 0.3s; }
.berserk-trigger .berserk-outer-glow { animation-duration: 0.2s; }
.berserk-trigger .frost-aura { animation-duration: 0.4s; }
.berserk-trigger .thunder-aura { animation-duration: 0.2s; }
.berserk-trigger .shadow-aura { animation-duration: 0.5s; }
.berserk-trigger .divine-aura { animation-duration: 0.3s; }
.berserk-trigger .poison-aura { animation-duration: 0.4s; }
.berserk-trigger .chaos-vortex { animation-duration: 0.3s; }

/* ========================================
   减少动画偏好
   ======================================== */
@media (prefers-reduced-motion: reduce) {
  .berserk-aura,
  .berserk-outer-glow,
  .berserk-inner-flame,
  .particle,
  .berserk-flash,
  .berserk-eyes::before,
  .berserk-eyes::after,
  .edge-flame,
  .frost-outer-mist,
  .frost-aura,
  .crystal,
  .frost-particle,
  .frost-flash,
  .spike,
  .thunder-outer-field,
  .thunder-aura,
  .arc,
  .spark,
  .thunder-flash,
  .orb,
  .shadow-outer-mist,
  .shadow-aura,
  .hand,
  .wisp,
  .shadow-flash,
  .shadow-vortex,
  .divine-outer-light,
  .divine-aura,
  .pillar,
  .light-particle,
  .divine-flash,
  .divine-halo,
  .divine-halo::before,
  .rune,
  .poison-outer-cloud,
  .poison-aura,
  .bubble,
  .toxin,
  .poison-flash,
  .drip,
  .poison-skull,
  .chaos-outer-field,
  .chaos-vortex,
  .chaos-vortex::before,
  .shard,
  .chaos-particle,
  .chaos-flash,
  .reality-crack {
    animation: none;
  }

  .berserk-aura,
  .frost-aura,
  .thunder-aura,
  .shadow-aura,
  .divine-aura,
  .poison-aura,
  .chaos-vortex {
    opacity: 0.9;
  }
}
</style>
