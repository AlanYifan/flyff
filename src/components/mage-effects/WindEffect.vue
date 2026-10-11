<!--
  @file WindEffect.vue
  @generated 2026-06-29
  @description 风之利刃 - 风刃斜斩 + 切割轨迹
  从 MageSkillEffect.vue 拆分而来，仅负责本特效的模板、脚本和样式
  GPU加速：所有动画仅使用 translate3d + opacity，避免重排，保证丝滑流畅
-->
<template>
          <div class="wind-dim"></div>
          <div
            v-for="i in 5"
            :key="'wind-blade-' + i"
            class="wind-blade"
            :style="getWindBladeStyle(i)"
          >
            <div class="wind-blade-edge"></div>
            <div class="wind-blade-trail"></div>
          </div>
          <div class="wind-vortex">
            <div class="wind-vortex-ring ring-1"></div>
            <div class="wind-vortex-ring ring-2"></div>
            <div class="wind-vortex-ring ring-3"></div>
          </div>
          <div class="wind-cut-flash"></div>
</template>

<script setup>
/**
 * 风之利刃 - 风刃斜斩 + 切割轨迹
 * 从 MageSkillEffect.vue 拆分的独立特效组件
 */

function getWindBladeStyle (index) {
  const offsetY = (index - 3) * 18
  const delay = (index - 1) * 0.08
  const rotate = -25 + (index - 3) * 8
  return {
    '--wind-offset-y': `${offsetY}px`,
    '--wind-rotate': `${rotate}deg`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   风之利刃 (mage_e) - 风刃斜斩 + 风涡
   技能描述：用锋利的风刃攻击敌人
   ================================================================ */

/* 暗幕 */
.wind-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 40, 30, 0.3) 0%,
    rgba(0, 20, 15, 0.2) 60%,
    transparent 100%
  );
  animation: windDim 1.2s ease-out forwards;
  will-change: opacity;
}

@keyframes windDim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  70% { opacity: 0.6; }
  100% { opacity: 0; }
}

/* 风刃 - 斜向切割 */
.wind-blade {
  position: absolute;
  top: 50%;
  left: -20%;
  width: 140%;
  height: 4px;
  transform: translateY(var(--wind-offset-y, 0)) rotate(var(--wind-rotate, 0deg));
  animation: windBladeSlash 0.6s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes windBladeSlash {
  0% {
    transform: translateY(var(--wind-offset-y, 0)) translateX(-60px) rotate(var(--wind-rotate, 0deg));
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translateY(var(--wind-offset-y, 0)) translateX(60px) rotate(var(--wind-rotate, 0deg));
    opacity: 0;
  }
}

/* 风刃刀锋 - 翠绿色锐利光带 */
.wind-blade-edge {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(100, 255, 200, 0.3) 15%,
    rgba(150, 255, 220, 0.9) 40%,
    rgba(200, 255, 240, 1) 50%,
    rgba(150, 255, 220, 0.9) 60%,
    rgba(100, 255, 200, 0.3) 85%,
    transparent 100%
  );
  border-radius: 50%;
  box-shadow:
    0 0 8px rgba(100, 255, 200, 0.7),
    0 0 16px rgba(80, 255, 180, 0.4);
}

/* 风刃拖尾 - 模糊的光效尾迹 */
.wind-blade-trail {
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  height: 10px;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(100, 255, 200, 0.15) 50%,
    transparent 100%
  );
  filter: blur(4px);
}

/* 风涡 - 中心旋转的风环 */
.wind-vortex {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: windVortexContainer 1s ease-out 0.2s forwards;
  opacity: 0;
  will-change: opacity;
}

@keyframes windVortexContainer {
  0% { opacity: 0; }
  20% { opacity: 1; }
  100% { opacity: 0; }
}

.wind-vortex-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2px solid rgba(120, 255, 200, 0.5);
  box-shadow: 0 0 10px rgba(100, 255, 180, 0.3);
  will-change: transform, opacity;
}

.ring-1 {
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%) scale(0);
  animation: windRingExpand 0.6s ease-out 0.2s forwards;
}

.ring-2 {
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%) scale(0);
  animation: windRingExpand 0.6s ease-out 0.35s forwards;
}

.ring-3 {
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%) scale(0);
  animation: windRingExpand 0.6s ease-out 0.5s forwards;
}

@keyframes windRingExpand {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  20% {
    opacity: 0.9;
  }
  100% {
    transform: translate(-50%, -50%) scale(3) rotate(180deg);
    opacity: 0;
  }
}

/* 切割闪光 - 风刃经过时的瞬间白光 */
.wind-cut-flash {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    115deg,
    transparent 30%,
    rgba(200, 255, 230, 0.25) 45%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(200, 255, 230, 0.25) 55%,
    transparent 70%
  );
  animation: windCutFlash 0.3s ease-out 0.3s forwards;
  opacity: 0;
  will-change: opacity;
}

@keyframes windCutFlash {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

</style>
