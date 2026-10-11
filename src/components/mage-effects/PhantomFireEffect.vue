<!--
  @file PhantomFireEffect.vue
  @generated 2026-06-29
  @description 灼烈幻火 - 火焰从地面升腾螺旋包裹 + 灼烧飞散
  从 MageSkillEffect.vue 拆分而来，仅负责本特效的模板、脚本和样式
  GPU加速：所有动画仅使用 translate3d + opacity，避免重排，保证丝滑流畅
-->
<template>
          <div class="phfire-dim"></div>
          <!-- 火焰螺旋柱 - 从底部升腾的螺旋火柱包裹目标 -->
          <div class="phfire-spiral">
            <div class="phfire-spiral-flame flame-1"></div>
            <div class="phfire-spiral-flame flame-2"></div>
            <div class="phfire-spiral-flame flame-3"></div>
            <div class="phfire-spiral-core"></div>
          </div>
          <!-- 灼烧火柱 - 中心向上喷涌的烈焰 -->
          <div class="phfire-pillar">
            <div class="phfire-pillar-body"></div>
            <div class="phfire-pillar-glow"></div>
          </div>
          <!-- 火焰粒子 - 向上飘散的灼热火星 -->
          <div class="phfire-embers">
            <div
              v-for="i in 14"
              :key="'phfire-ember-' + i"
              class="phfire-ember"
              :style="getPhantomFlameStyle(i)"
            ></div>
          </div>
          <!-- 地面火焰环 - 从脚下扩散的火圈 -->
          <div class="phfire-ground-ring ring-g1"></div>
          <div class="phfire-ground-ring ring-g2"></div>
          <!-- 灼烧余烬 -->
          <div class="phfire-ash"></div>
</template>

<script setup>
/**
 * 灼烈幻火 - 火焰从地面升腾螺旋包裹 + 灼烧飞散
 * 从 MageSkillEffect.vue 拆分的独立特效组件
 */

function getPhantomFlameStyle (index) {
  const spreadX = ((index % 2 === 0 ? 1 : -1)) * (8 + (index % 5) * 6)
  const riseY = -40 - (index % 4) * 15
  const size = 5 + (index % 3) * 3
  const delay = (index % 5) * 0.06
  const duration = 0.9 + (index % 3) * 0.15
  return {
    '--phf-tx': `${spreadX}px`,
    '--phf-ty': `${riseY}px`,
    '--phf-size': `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}
</script>

<style scoped>
/* ================================================================
   灼烈幻火 (mage_w) - 火焰从地面升腾螺旋包裹 + 灼烧飞散
   技能描述：召唤灼热的火焰攻击敌人
   灼烈：猛烈灼烧；幻火：从地面升腾的虚幻火焰
   ================================================================ */

/* 暗幕 */
.phfire-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center bottom, rgba(255, 80, 0, 0.25), transparent 65%);
  animation: phf-dim 1.4s ease-out forwards;
  pointer-events: none;
}
@keyframes phf-dim {
  0%   { opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0; }
}

/* 火焰螺旋柱 - 三条螺旋火带从底部升腾包裹目标 */
.phfire-spiral {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 90px;
  height: 130px;
  transform: translateX(-50%);
  pointer-events: none;
}
.phfire-spiral-flame {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 36px;
  height: 110px;
  border-radius: 50% 50% 30% 30% / 60% 60% 40% 40%;
  background: linear-gradient(to top, rgba(255, 240, 100, 0.9), rgba(255, 120, 0, 0.7) 50%, rgba(255, 40, 0, 0) 100%);
  filter: blur(3px);
  transform-origin: bottom center;
  will-change: transform, opacity;
}
.phfire-spiral-flame.flame-1 {
  animation: phf-spiral-a 1.4s cubic-bezier(0.2, 0.6, 0.3, 1) forwards;
}
.phfire-spiral-flame.flame-2 {
  animation: phf-spiral-b 1.4s cubic-bezier(0.2, 0.6, 0.3, 1) 0.1s forwards;
}
.phfire-spiral-flame.flame-3 {
  animation: phf-spiral-c 1.4s cubic-bezier(0.2, 0.6, 0.3, 1) 0.2s forwards;
}
@keyframes phf-spiral-a {
  0%   { transform: translateX(-50%) scaleY(0) rotate(0deg); opacity: 0; }
  25%  { transform: translateX(-50%) scaleY(1) rotate(30deg); opacity: 0.9; }
  60%  { transform: translateX(-50%) scaleY(1.1) rotate(120deg); opacity: 0.8; }
  100% { transform: translateX(-50%) scaleY(0.3) rotate(200deg); opacity: 0; }
}
@keyframes phf-spiral-b {
  0%   { transform: translateX(-50%) scaleY(0) rotate(120deg); opacity: 0; }
  25%  { transform: translateX(-50%) scaleY(1) rotate(150deg); opacity: 0.9; }
  60%  { transform: translateX(-50%) scaleY(1.1) rotate(240deg); opacity: 0.8; }
  100% { transform: translateX(-50%) scaleY(0.3) rotate(320deg); opacity: 0; }
}
@keyframes phf-spiral-c {
  0%   { transform: translateX(-50%) scaleY(0) rotate(240deg); opacity: 0; }
  25%  { transform: translateX(-50%) scaleY(1) rotate(270deg); opacity: 0.9; }
  60%  { transform: translateX(-50%) scaleY(1.1) rotate(360deg); opacity: 0.8; }
  100% { transform: translateX(-50%) scaleY(0.3) rotate(440deg); opacity: 0; }
}
/* 螺旋中心核心 */
.phfire-spiral-core {
  position: absolute;
  bottom: 30%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 200, 1), rgba(255, 120, 0, 0.6) 60%, transparent);
  filter: blur(2px);
  transform: translateX(-50%);
  animation: phf-core 1.4s ease-out forwards;
}
@keyframes phf-core {
  0%   { transform: translateX(-50%) scale(0); opacity: 0; }
  30%  { transform: translateX(-50%) scale(1.5); opacity: 1; }
  100% { transform: translateX(-50%) scale(0.5); opacity: 0; }
}

/* 中心火柱 - 向上喷涌的烈焰 */
.phfire-pillar {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 50px;
  height: 120px;
  transform: translateX(-50%);
  pointer-events: none;
}
.phfire-pillar-body {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50% 50% 20% 20% / 70% 70% 30% 30%;
  background: linear-gradient(to top, rgba(255, 200, 50, 0.95), rgba(255, 80, 0, 0.7) 60%, transparent);
  filter: blur(4px);
  transform-origin: bottom center;
  animation: phf-pillar 1.4s ease-out forwards;
}
@keyframes phf-pillar {
  0%   { transform: scaleY(0); opacity: 0; }
  20%  { transform: scaleY(1); opacity: 1; }
  60%  { transform: scaleY(1); opacity: 0.8; }
  100% { transform: scaleY(0.2); opacity: 0; }
}
.phfire-pillar-glow {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 150, 0, 0.4), transparent 70%);
  transform: translateX(-50%);
  animation: phf-glow 1.4s ease-out forwards;
}
@keyframes phf-glow {
  0%   { transform: translateX(-50%) scale(0); opacity: 0; }
  25%  { transform: translateX(-50%) scale(1.2); opacity: 1; }
  100% { transform: translateX(-50%) scale(0.8); opacity: 0; }
}

/* 火焰粒子 - 向上飘散的灼热火星 */
.phfire-embers {
  position: absolute;
  bottom: 5%;
  left: 50%;
  pointer-events: none;
}
.phfire-ember {
  position: absolute;
  bottom: 0;
  left: 0;
  width: var(--phf-size);
  height: var(--phf-size);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 180, 1), rgba(255, 100, 0, 0.7) 60%, transparent);
  filter: blur(1px);
  will-change: transform, opacity;
  animation: phf-ember 1.2s ease-out forwards;
}
@keyframes phf-ember {
  0%   { transform: translate(0, 0) scale(0.5); opacity: 0; }
  15%  { transform: translate(calc(var(--phf-tx) * 0.3), calc(var(--phf-ty) * 0.3)) scale(1); opacity: 1; }
  70%  { transform: translate(var(--phf-tx), var(--phf-ty)) scale(0.8); opacity: 0.7; }
  100% { transform: translate(calc(var(--phf-tx) * 1.2), calc(var(--phf-ty) * 1.3)) scale(0.2); opacity: 0; }
}

/* 地面火焰环 - 从脚下扩散的火圈 */
.phfire-ground-ring {
  position: absolute;
  bottom: 3%;
  left: 50%;
  width: 80px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 140, 0, 0.8);
  box-shadow: 0 0 12px rgba(255, 100, 0, 0.6);
  transform: translateX(-50%);
  pointer-events: none;
  will-change: transform, opacity;
}
.phfire-ground-ring.ring-g1 {
  animation: phf-ring 1.4s ease-out forwards;
}
.phfire-ground-ring.ring-g2 {
  animation: phf-ring 1.4s ease-out 0.15s forwards;
}
@keyframes phf-ring {
  0%   { transform: translateX(-50%) scale(0.2); opacity: 0; border-width: 3px; }
  25%  { transform: translateX(-50%) scale(1); opacity: 1; border-width: 2px; }
  100% { transform: translateX(-50%) scale(2); opacity: 0; border-width: 1px; }
}

/* 灼烧余烬 */
.phfire-ash {
  position: absolute;
  bottom: 3%;
  left: 50%;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(200, 60, 0, 0.3), transparent 70%);
  transform: translateX(-50%);
  animation: phf-ash 1.4s ease-out 0.6s forwards;
  opacity: 0;
  pointer-events: none;
}
@keyframes phf-ash {
  0%   { opacity: 0; transform: translateX(-50%) scale(0.8); }
  40%  { opacity: 0.6; transform: translateX(-50%) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) scale(1.1); }
}

</style>
