<!--
  @file ConsciousnessCollapseEffect.vue
  @generated 2026-08-12
  @description 意识崩塌 - 释放精神冲击波对范围内敌人造成精神伤害（AOE DEBUFF特效）
  四阶段叙事：意识紊乱 → 精神冲击 → 崩塌爆发 → 意识消散
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  色彩方案：心灵粉(#E91E63) + 幻影紫(#AB47BC) + 精神白(#F8BBD0) + 深渊紫(#4A148C)
-->
<template>
  <!-- 暗幕：意识紊乱笼罩战场 -->
  <div class="cc-dim"></div>

  <!-- 全屏闪光：崩塌爆发瞬间的紫色爆闪 -->
  <div class="cc-flash"></div>

  <!-- ===== 阶段一：意识紊乱（0s ~ 0.45s）===== -->
  <!-- 紊乱波纹：地面出现多层扩散的紊乱波 -->
  <div class="cc-chaos-ring ring-1"></div>
  <div class="cc-chaos-ring ring-2"></div>
  <div class="cc-chaos-ring ring-3"></div>

  <!-- 紊乱粒子：无规则飘散的精神碎片 -->
  <div
    v-for="i in 12"
    :key="'cc-chaos-' + i"
    class="cc-chaos-particle"
    :style="getChaosStyle(i)"
  ></div>

  <!-- ===== 阶段二：精神冲击（0.45s ~ 0.9s）===== -->
  <!-- 冲击核心：精神能量球膨胀成形 -->
  <div class="cc-core">
    <div class="cc-core-inner"></div>
    <div class="cc-core-wave"></div>
  </div>

  <!-- 冲击波纹：从中心向外扩散的精神冲击环 -->
  <div class="cc-impact-wave iw-1"></div>
  <div class="cc-impact-wave iw-2"></div>

  <!-- ===== 阶段三：崩塌爆发（0.9s ~ 1.6s）===== -->
  <!-- 崩塌冲击波：多层从中心向外扩散的毁灭波 -->
  <div class="cc-collapse-wave cw-1"></div>
  <div class="cc-collapse-wave cw-2"></div>
  <div class="cc-collapse-wave cw-3"></div>

  <!-- 精神碎片：爆发的精神碎片向外飞射 -->
  <div
    v-for="i in 14"
    :key="'cc-fragment-' + i"
    class="cc-fragment"
    :style="getFragmentStyle(i)"
  ></div>

  <!-- 崩塌符文：环绕中心旋转扩散的精神符文 -->
  <div class="cc-rune-ring">
    <div
      v-for="i in 8"
      :key="'cc-rune-' + i"
      class="cc-rune"
      :style="getRuneStyle(i)"
    ></div>
  </div>

  <!-- ===== 阶段四：意识消散（1.6s ~ 2.1s）===== -->
  <!-- 消散涟漪：最后的意识涟漪 -->
  <div class="cc-dissipate"></div>
</template>

<script setup>
/**
 * 意识崩塌 - 释放精神冲击波对范围内敌人造成精神伤害（AOE DEBUFF特效）
 * 四阶段叙事：意识紊乱 → 精神冲击 → 崩塌爆发 → 意识消散
 * 以心灵粉和幻影紫为主色调，展现精神冲击波从紊乱到崩塌爆发的完整视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 */

defineOptions({
  inheritAttrs: false
})

/**
 * 计算紊乱粒子的样式
 * @param {number} index - 粒子索引（1~12）
 * @returns {Object} CSS自定义属性对象
 */
function getChaosStyle (index) {
  const angle = (index - 1) * 30 + (index % 2) * 12
  const distance = 80 + (index % 4) * 25
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.03
  return {
    '--cc-chaos-angle': `${angle}deg`,
    '--cc-chaos-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算精神碎片的飞射样式
 * @param {number} index - 碎片索引（1~14）
 * @returns {Object} CSS自定义属性对象
 */
function getFragmentStyle (index) {
  const angle = (index - 1) * 25.7 + (index % 2) * 8
  const distance = 150 + (index % 5) * 22
  const size = 5 + (index % 4) * 3
  const delay = (index % 4) * 0.04
  return {
    '--cc-frag-angle': `${angle}deg`,
    '--cc-frag-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算崩塌符文的位置样式
 * @param {number} index - 符文索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getRuneStyle (index) {
  const angle = (index - 1) * 45
  return {
    '--cc-rune-angle': `${angle}deg`
  }
}
</script>

<style scoped>
/* ================================================================
   意识崩塌 (mind_master_e) - AOE DEBUFF特效
   技能描述：释放精神冲击波对范围内敌人造成毁灭性精神伤害，施加「意识混乱」DEBUFF
   色彩方案：心灵粉(#E91E63) + 幻影紫(#AB47BC) + 精神白(#F8BBD0) + 深渊紫(#4A148C)
   GPU加速：contain隔离 + will-change + translate3d
   ================================================================ */

/* 暗幕 - 意识紊乱笼罩战场 */
.cc-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center 55%,
    rgba(74, 20, 140, 0.6) 0%,
    rgba(50, 10, 100, 0.35) 40%,
    rgba(30, 0, 60, 0.15) 75%,
    transparent 100%
  );
  animation: ccDim 2.1s ease-out forwards;
  will-change: opacity;
}

@keyframes ccDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  60% { opacity: 0.75; }
  100% { opacity: 0; }
}

/* 全屏闪光 - 崩塌爆发瞬间的紫色爆闪 */
.cc-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center 55%,
    rgba(248, 187, 208, 0.85) 0%,
    rgba(171, 71, 188, 0.5) 15%,
    rgba(233, 30, 99, 0.2) 40%,
    transparent 70%
  );
  opacity: 0;
  animation: ccFlash 0.7s ease-out 0.45s forwards;
  will-change: opacity;
}

@keyframes ccFlash {
  0%, 100% { opacity: 0; }
  5% { opacity: 1; }
  15% { opacity: 0.4; }
  30% { opacity: 0.7; }
  60% { opacity: 0.1; }
}

/* ===== 阶段一：意识紊乱（0s ~ 0.45s）===== */

/* 紊乱波纹 - 地面出现多层扩散的紊乱波 */
.cc-chaos-ring {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(171, 71, 188, 0.7);
  box-shadow: 0 0 10px rgba(171, 71, 188, 0.5);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.cc-chaos-ring.ring-1 {
  animation: ccChaosRing 0.45s ease-out forwards;
}

.cc-chaos-ring.ring-2 {
  border-color: rgba(233, 30, 99, 0.6);
  animation: ccChaosRing 0.5s ease-out 0.1s forwards;
}

.cc-chaos-ring.ring-3 {
  border-color: rgba(248, 187, 208, 0.5);
  animation: ccChaosRing 0.55s ease-out 0.2s forwards;
}

@keyframes ccChaosRing {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  20% { opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(6); opacity: 0; }
}

/* 紊乱粒子 - 无规则飘散的精神碎片 */
.cc-chaos-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(248, 187, 208, 0.9) 0%,
    rgba(171, 71, 188, 0.6) 50%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(171, 71, 188, 0.5);
  transform: translate(-50%, -50%) rotate(var(--cc-chaos-angle, 0deg)) translateX(var(--cc-chaos-distance, 80px)) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: ccChaosParticle 0.45s ease-out forwards;
}

@keyframes ccChaosParticle {
  0% {
    transform: translate(-50%, -50%) rotate(var(--cc-chaos-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  30% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--cc-chaos-angle, 0deg) + 120deg)) translateX(var(--cc-chaos-distance, 80px)) scale(0.3);
    opacity: 0;
  }
}

/* ===== 阶段二：精神冲击（0.45s ~ 0.9s）===== */

/* 冲击核心 - 精神能量球膨胀成形 */
.cc-core {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 50px;
  height: 50px;
  transform: translate(-50%, -50%) scale(0);
  animation: ccCoreAppear 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) 0.45s forwards;
  will-change: transform, opacity;
}

@keyframes ccCoreAppear {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  60% { transform: translate(-50%, -50%) scale(1.4); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

.cc-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 40% 40%,
    rgba(255, 255, 255, 1) 0%,
    rgba(248, 187, 208, 0.95) 20%,
    rgba(171, 71, 188, 0.85) 45%,
    rgba(233, 30, 99, 0.5) 75%,
    transparent 100%
  );
  box-shadow:
    0 0 25px rgba(171, 71, 188, 0.9),
    0 0 50px rgba(233, 30, 99, 0.6),
    0 0 75px rgba(74, 20, 140, 0.3);
  animation: ccCorePulse 1s ease-in-out 0.8s forwards;
  will-change: transform, opacity;
}

@keyframes ccCorePulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.cc-core-wave {
  position: absolute;
  inset: -50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(171, 71, 188, 0.3) 0%,
    rgba(233, 30, 99, 0.1) 50%,
    transparent 80%
  );
  animation: ccCoreWave 1.2s ease-out 0.8s forwards;
  will-change: transform, opacity;
  opacity: 0;
}

@keyframes ccCoreWave {
  0% { transform: scale(0.5); opacity: 0; }
  30% { opacity: 0.8; }
  100% { transform: scale(3.5); opacity: 0; }
}

/* 冲击波纹 - 从中心向外扩散的精神冲击环 */
.cc-impact-wave {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 4px solid rgba(171, 71, 188, 0.8);
  box-shadow: 0 0 15px rgba(171, 71, 188, 0.6);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.cc-impact-wave.iw-1 {
  animation: ccImpactWave 0.6s ease-out 0.5s forwards;
}

.cc-impact-wave.iw-2 {
  border-color: rgba(233, 30, 99, 0.6);
  animation: ccImpactWave 0.7s ease-out 0.65s forwards;
}

@keyframes ccImpactWave {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(8); opacity: 0; }
}

/* ===== 阶段三：崩塌爆发（0.9s ~ 1.6s）===== */

/* 崩塌冲击波 - 多层从中心向外扩散的毁灭波 */
.cc-collapse-wave {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 4px solid rgba(233, 30, 99, 0.8);
  box-shadow:
    0 0 20px rgba(233, 30, 99, 0.6),
    0 0 40px rgba(171, 71, 188, 0.3);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.cc-collapse-wave.cw-1 {
  animation: ccCollapseWave 1s cubic-bezier(0.05, 0.9, 0.25, 1) 0.9s forwards;
}

.cc-collapse-wave.cw-2 {
  border-color: rgba(171, 71, 188, 0.7);
  animation: ccCollapseWave 1.1s cubic-bezier(0.05, 0.9, 0.25, 1) 1.05s forwards;
}

.cc-collapse-wave.cw-3 {
  border-color: rgba(248, 187, 208, 0.5);
  animation: ccCollapseWave 1.2s cubic-bezier(0.05, 0.9, 0.25, 1) 1.2s forwards;
}

@keyframes ccCollapseWave {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  8% { opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(16); opacity: 0; }
}

/* 精神碎片 - 爆发的精神碎片向外飞射 */
.cc-fragment {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 30%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 187, 208, 0.8) 40%,
    rgba(171, 71, 188, 0.3) 100%
  );
  box-shadow: 0 0 8px rgba(171, 71, 188, 0.6);
  transform: translate(-50%, -50%) rotate(var(--cc-frag-angle, 0deg)) translateX(0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: ccFragmentFly 0.9s ease-out 0.9s forwards;
}

@keyframes ccFragmentFly {
  0% {
    transform: translate(-50%, -50%) rotate(var(--cc-frag-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--cc-frag-angle, 0deg)) translateX(calc(var(--cc-frag-distance, 150px) * 0.15)) scale(1.2);
  }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--cc-frag-angle, 0deg) + 90deg)) translateX(var(--cc-frag-distance, 150px)) scale(0.2);
    opacity: 0;
  }
}

/* 崩塌符文 - 环绕中心旋转扩散的精神符文 */
.cc-rune-ring {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 0;
  height: 0;
  opacity: 0;
  animation: ccRuneRingContainer 1.2s ease-out 0.9s forwards;
  will-change: transform, opacity;
}

@keyframes ccRuneRingContainer {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3) rotate(0deg); }
  20% { opacity: 0.8; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5) rotate(120deg); }
}

.cc-rune {
  position: absolute;
  top: 0;
  left: 0;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: rgba(248, 187, 208, 0.8);
  box-shadow: 0 0 8px rgba(171, 71, 188, 0.6);
  transform: translate(-50%, -50%) rotate(var(--cc-rune-angle, 0deg)) translateX(100px);
  will-change: transform, opacity;
}

/* ===== 阶段四：意识消散（1.6s ~ 2.1s）===== */

/* 消散涟漪 - 最后的意识涟漪 */
.cc-dissipate {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(171, 71, 188, 0.08) 30deg,
    rgba(233, 30, 99, 0.15) 60deg,
    rgba(171, 71, 188, 0.08) 90deg,
    transparent 120deg,
    rgba(171, 71, 188, 0.08) 180deg,
    rgba(233, 30, 99, 0.15) 210deg,
    rgba(171, 71, 188, 0.08) 240deg,
    transparent 270deg,
    rgba(171, 71, 188, 0.08) 330deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 20%, black 35%, transparent 85%);
  mask: radial-gradient(circle, transparent 20%, black 35%, transparent 85%);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: ccDissipate 0.5s ease-out 1.6s forwards;
}

@keyframes ccDissipate {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  20% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .cc-dim, .cc-flash, .cc-chaos-ring, .cc-chaos-particle,
  .cc-core, .cc-impact-wave, .cc-collapse-wave, .cc-fragment,
  .cc-rune-ring, .cc-dissipate {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
