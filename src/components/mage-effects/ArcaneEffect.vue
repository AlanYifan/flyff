<!--
  @file ArcaneEffect.vue
  @generated 2026-06-29
  @description 奥术冲击 / 心灵风暴 - 奥术能量球 + 紫色波纹
  从 MageSkillEffect.vue 拆分而来，仅负责本特效的模板、脚本和样式
  GPU加速：所有动画仅使用 translate3d + opacity，避免重排，保证丝滑流畅
-->
<template>
          <div class="arcane-dim"></div>
          <div class="arcane-orb">
            <div class="arcane-orb-core"></div>
            <div class="arcane-orb-ring ring-a"></div>
            <div class="arcane-orb-ring ring-b"></div>
            <div class="arcane-orb-ring ring-c"></div>
          </div>
          <div class="arcane-burst">
            <div
              v-for="i in 10"
              :key="'arcane-particle-' + i"
              class="arcane-particle"
              :style="getArcaneParticleStyle(i)"
            ></div>
          </div>
          <div class="arcane-ripple ripple-a"></div>
          <div class="arcane-ripple ripple-b"></div>
          <div class="arcane-runes">
            <div class="arcane-rune rune-1"></div>
            <div class="arcane-rune rune-2"></div>
            <div class="arcane-rune rune-3"></div>
          </div>
</template>

<script setup>
/**
 * 奥术冲击 / 心灵风暴 - 奥术能量球 + 紫色波纹
 * 从 MageSkillEffect.vue 拆分的独立特效组件
 */

function getArcaneParticleStyle (index) {
  const angle = (index - 1) * 36 + (index % 2) * 8
  const distance = 30 + (index % 4) * 10
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance
  const size = 6 + (index % 3) * 3
  const delay = (index % 3) * 0.04
  return {
    '--arcane-tx': `${tx}px`,
    '--arcane-ty': `${ty}px`,
    '--arcane-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   奥术冲击 / 心灵风暴 (none) - 奥术能量球 + 紫色波纹
   技能描述：用奥术之力冲击敌人 / 心灵之力风暴
   ================================================================ */

/* 暗幕 - 紫色色调 */
.arcane-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(30, 0, 50, 0.4) 0%,
    rgba(20, 0, 40, 0.25) 50%,
    transparent 100%
  );
  animation: arcaneDim 1.5s ease-out forwards;
  will-change: opacity;
}

@keyframes arcaneDim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  60% { opacity: 0.6; }
  100% { opacity: 0; }
}

/* 奥术能量球容器 */
.arcane-orb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  transform: translate(-50%, -50%) scale(0);
  animation: arcaneOrbAppear 0.4s ease-out forwards;
  will-change: transform;
}

@keyframes arcaneOrbAppear {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  60% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

/* 能量球核心 - 紫色发光球体 */
.arcane-orb-core {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 40% 40%,
    rgba(230, 180, 255, 1) 0%,
    rgba(180, 100, 255, 0.9) 30%,
    rgba(120, 50, 200, 0.7) 60%,
    rgba(80, 20, 150, 0.5) 100%
  );
  box-shadow:
    0 0 15px rgba(160, 80, 255, 0.8),
    0 0 30px rgba(120, 50, 200, 0.5),
    inset 0 0 8px rgba(255, 200, 255, 0.3);
  animation: arcaneOrbPulse 1s ease-in-out 0.3s infinite;
  will-change: transform, opacity;
}

@keyframes arcaneOrbPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* 能量球光环 - 三层旋转环 */
.arcane-orb-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2px solid rgba(180, 100, 255, 0.5);
  box-shadow: 0 0 8px rgba(150, 80, 220, 0.3);
  will-change: transform, opacity;
}

.ring-a {
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%) scale(0);
  animation: arcaneRingExpand 0.8s ease-out 0.2s forwards;
}

.ring-b {
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%) scale(0);
  animation: arcaneRingExpand 0.8s ease-out 0.35s forwards;
}

.ring-c {
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%) scale(0);
  animation: arcaneRingExpand 0.8s ease-out 0.5s forwards;
}

@keyframes arcaneRingExpand {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  20% {
    opacity: 0.9;
  }
  100% {
    transform: translate(-50%, -50%) scale(3) rotate(120deg);
    opacity: 0;
  }
}

/* 能量爆发粒子容器 */
.arcane-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: arcaneBurstContainer 1s ease-out 0.3s forwards;
  opacity: 0;
  will-change: opacity;
}

@keyframes arcaneBurstContainer {
  0% { opacity: 0; }
  10% { opacity: 1; }
  100% { opacity: 0; }
}

/* 奥术粒子 - 紫色能量碎片 */
.arcane-particle {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--arcane-size, 8px);
  height: var(--arcane-size, 8px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(230, 180, 255, 0.95) 0%,
    rgba(180, 100, 255, 0.7) 40%,
    rgba(120, 50, 200, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(160, 80, 255, 0.5);
  transform: translate(-50%, -50%) scale(0);
  animation: arcaneParticleFly 0.7s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes arcaneParticleFly {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% + var(--arcane-tx, 0px)), calc(-50% + var(--arcane-ty, 0px))) scale(0.2);
    opacity: 0;
  }
}

/* 奥术波纹 - 从中心向外扩散 */
.arcane-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(180, 100, 255, 0.6);
  box-shadow: 0 0 10px rgba(150, 80, 220, 0.3);
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
}

.ripple-a {
  animation: arcaneRippleExpand 0.8s ease-out 0.4s forwards;
}

.ripple-b {
  animation: arcaneRippleExpand 0.8s ease-out 0.6s forwards;
}

@keyframes arcaneRippleExpand {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  20% {
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0;
  }
}

/* 奥术符文 - 三角排列的魔法符文 */
.arcane-runes {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  animation: arcaneRunesContainer 1.2s ease-out 0.2s forwards;
  opacity: 0;
  will-change: opacity, transform;
}

@keyframes arcaneRunesContainer {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5) rotate(0deg); }
  20% { opacity: 0.8; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5) rotate(60deg); }
}

.arcane-rune {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: rgba(200, 150, 255, 0.7);
  box-shadow: 0 0 6px rgba(180, 100, 255, 0.5);
}

.rune-1 {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}

.rune-2 {
  bottom: 5px;
  left: 10px;
  transform: rotate(60deg);
}

.rune-3 {
  bottom: 5px;
  right: 10px;
  transform: rotate(-60deg);
}

</style>
