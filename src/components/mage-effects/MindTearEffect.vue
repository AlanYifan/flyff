<!--
  @file MindTearEffect.vue
  @generated 2026-08-12
  @description 星思坠寂 - 使目标如星辰般闪烁的万千思绪逐一坠落，归于死寂（单体攻击特效）
  四阶段叙事：精神凝聚 → 意识压缩 → 撕裂释放 → 精神消散
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  色彩方案：心灵粉(#E91E63) + 幻影紫(#AB47BC) + 精神白(#F8BBD0) + 深渊紫(#4A148C)
-->
<template>
  <!-- 暗幕：精神能量笼罩目标区域 -->
  <div class="mt-dim"></div>

  <!-- ===== 阶段一：精神凝聚（0s ~ 0.4s）===== -->
  <!-- 精神裂痕：目标周围出现精神裂痕 -->
  <div
    v-for="i in 6"
    :key="'mt-rift-' + i"
    class="mt-rift"
    :style="getRiftStyle(i)"
  ></div>

  <!-- 精神粒子：粉色粒子向中心汇聚 -->
  <div
    v-for="i in 12"
    :key="'mt-particle-' + i"
    class="mt-pink-particle"
    :style="getPinkParticleStyle(i)"
  ></div>

  <!-- ===== 阶段二：意识压缩（0.4s ~ 0.7s）===== -->
  <!-- 精神核心：粉色能量球压缩成形 -->
  <div class="mt-core">
    <div class="mt-core-inner"></div>
    <div class="mt-core-crack"></div>
  </div>

  <!-- 压缩光环：向内收缩的粉色光环 -->
  <div class="mt-compress-ring ring-a"></div>
  <div class="mt-compress-ring ring-b"></div>

  <!-- ===== 阶段三：撕裂释放（0.7s ~ 1.4s）===== -->
  <!-- 撕裂闪光：极限释放的白色爆闪 -->
  <div class="mt-blast-flash"></div>

  <!-- 精神射线：从核心向外射出的粉色射线 -->
  <div
    v-for="i in 8"
    :key="'mt-beam-' + i"
    class="mt-beam"
    :style="getBeamStyle(i)"
  ></div>

  <!-- 撕裂冲击波：从中心扩散的粉色冲击波 -->
  <div class="mt-blast-wave bw-1"></div>
  <div class="mt-blast-wave bw-2"></div>

  <!-- 精神碎片：爆发的粉色碎片向外飞射 -->
  <div
    v-for="i in 10"
    :key="'mt-fragment-' + i"
    class="mt-fragment"
    :style="getFragmentStyle(i)"
  ></div>

  <!-- ===== 阶段四：精神消散（1.4s ~ 1.8s）===== -->
  <!-- 消散涟漪：最后的精神涟漪 -->
  <div class="mt-dissipate-ripple"></div>
</template>

<script setup>
/**
 * 星思坠寂 - 使目标如星辰般闪烁的万千思绪逐一坠落，归于死寂（单体攻击特效）
 * 四阶段叙事：精神凝聚 → 意识压缩 → 撕裂释放 → 精神消散
 * 以心灵粉和幻影紫为主色调，展现星思坠寂从凝聚到极限压缩再到撕裂爆发的完整视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 */

defineOptions({
  inheritAttrs: false
})

/**
 * 计算精神裂痕的样式
 * @param {number} index - 裂痕索引（1~6）
 * @returns {Object} CSS自定义属性对象
 */
function getRiftStyle (index) {
  const angle = (index - 1) * 60
  return {
    '--mt-rift-angle': `${angle}deg`
  }
}

/**
 * 计算精神粒子的样式
 * @param {number} index - 粒子索引（1~12）
 * @returns {Object} CSS自定义属性对象
 */
function getPinkParticleStyle (index) {
  const angle = (index - 1) * 30
  const distance = 100 + (index % 3) * 20
  const size = 4 + (index % 3) * 2
  const delay = (index - 1) * 0.02
  return {
    '--mt-particle-angle': `${angle}deg`,
    '--mt-particle-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算精神射线的样式
 * @param {number} index - 射线索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getBeamStyle (index) {
  const angle = (index - 1) * 45
  return {
    '--mt-beam-angle': `${angle}deg`
  }
}

/**
 * 计算精神碎片的飞射样式
 * @param {number} index - 碎片索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getFragmentStyle (index) {
  const angle = (index - 1) * 36 + (index % 2) * 8
  const distance = 140 + (index % 4) * 20
  const size = 5 + (index % 3) * 2
  const delay = (index % 3) * 0.03
  return {
    '--mt-fragment-angle': `${angle}deg`,
    '--mt-fragment-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   星思坠寂 (mind_master_w) - 单体攻击特效
   技能描述：使目标如星辰般闪烁的万千思绪逐一坠落，归于死寂。精神冲击穿透识海，造成高额精神伤害
   色彩方案：心灵粉(#E91E63) + 幻影紫(#AB47BC) + 精神白(#F8BBD0) + 深渊紫(#4A148C)
   GPU加速：contain隔离 + will-change + translate3d
   ================================================================ */

/* 暗幕 - 精神能量笼罩目标区域 */
.mt-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center 55%,
    rgba(74, 20, 140, 0.55) 0%,
    rgba(50, 10, 100, 0.3) 40%,
    rgba(30, 0, 60, 0.12) 75%,
    transparent 100%
  );
  animation: mtDim 1.8s ease-out forwards;
  will-change: opacity;
}

@keyframes mtDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  60% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* ===== 阶段一：精神凝聚（0s ~ 0.4s）===== */

/* 精神裂痕 - 目标周围出现精神裂痕 */
.mt-rift {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 3px;
  height: 60px;
  background: linear-gradient(to bottom,
    transparent 0%,
    rgba(233, 30, 99, 0.6) 30%,
    rgba(233, 30, 99, 0.9) 50%,
    rgba(233, 30, 99, 0.6) 70%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(233, 30, 99, 0.5);
  transform: translate(-50%, -50%) rotate(var(--mt-rift-angle, 0deg)) translateY(0) scaleX(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: mtRift 0.4s ease-out forwards;
}

@keyframes mtRift {
  0% {
    transform: translate(-50%, -50%) rotate(var(--mt-rift-angle, 0deg)) translateY(50px) scaleX(0);
    opacity: 0;
  }
  30% { opacity: 0.8; }
  100% {
    transform: translate(-50%, -50%) rotate(var(--mt-rift-angle, 0deg)) translateY(0) scaleX(1);
    opacity: 0;
  }
}

/* 精神粒子 - 粉色粒子向中心汇聚 */
.mt-pink-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(248, 187, 208, 0.95) 0%,
    rgba(233, 30, 99, 0.7) 50%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(233, 30, 99, 0.5);
  transform: translate(-50%, -50%) rotate(var(--mt-particle-angle, 0deg)) translateX(var(--mt-particle-distance, 100px)) scale(1);
  opacity: 0;
  will-change: transform, opacity;
  animation: mtParticle 0.4s ease-in forwards;
}

@keyframes mtParticle {
  0% {
    transform: translate(-50%, -50%) rotate(var(--mt-particle-angle, 0deg)) translateX(var(--mt-particle-distance, 100px)) scale(1);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--mt-particle-angle, 0deg) + 180deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ===== 阶段二：意识压缩（0.4s ~ 0.7s）===== */

/* 精神核心 - 粉色能量球压缩成形 */
.mt-core {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%) scale(0);
  animation: mtCoreAppear 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) 0.4s forwards;
  will-change: transform, opacity;
}

@keyframes mtCoreAppear {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  60% { transform: translate(-50%, -50%) scale(1.4); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

.mt-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 40% 40%,
    rgba(255, 255, 255, 1) 0%,
    rgba(248, 187, 208, 0.95) 20%,
    rgba(233, 30, 99, 0.8) 45%,
    rgba(171, 71, 188, 0.5) 75%,
    transparent 100%
  );
  box-shadow:
    0 0 20px rgba(233, 30, 99, 0.9),
    0 0 40px rgba(171, 71, 188, 0.6),
    0 0 60px rgba(74, 20, 140, 0.3);
  animation: mtCorePulse 0.8s ease-in-out 0.7s forwards;
  will-change: transform, opacity;
}

@keyframes mtCorePulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.85; }
}

.mt-core-crack {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  border: 1px solid rgba(248, 187, 208, 0.4);
  animation: mtCoreCrack 0.5s ease-out 0.6s forwards;
  will-change: transform, opacity;
  opacity: 0;
}

@keyframes mtCoreCrack {
  0% { transform: scale(0.8); opacity: 0; }
  40% { opacity: 0.8; }
  100% { transform: scale(2); opacity: 0; }
}

/* 压缩光环 - 向内收缩的粉色光环 */
.mt-compress-ring {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid rgba(233, 30, 99, 0.7);
  box-shadow: 0 0 12px rgba(233, 30, 99, 0.5);
  transform: translate(-50%, -50%) scale(2);
  opacity: 0;
  will-change: transform, opacity;
}

.mt-compress-ring.ring-a {
  animation: mtCompressRing 0.35s ease-in 0.4s forwards;
}

.mt-compress-ring.ring-b {
  border-color: rgba(171, 71, 188, 0.6);
  animation: mtCompressRing 0.4s ease-in 0.5s forwards;
}

@keyframes mtCompressRing {
  0% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
  20% { opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
}

/* ===== 阶段三：撕裂释放（0.7s ~ 1.4s）===== */

/* 撕裂闪光 - 极限释放的白色爆闪 */
.mt-blast-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center 55%,
    rgba(248, 187, 208, 0.9) 0%,
    rgba(233, 30, 99, 0.5) 15%,
    rgba(171, 71, 188, 0.2) 40%,
    transparent 70%
  );
  opacity: 0;
  animation: mtBlastFlash 0.6s ease-out 0.7s forwards;
  will-change: opacity;
}

@keyframes mtBlastFlash {
  0%, 100% { opacity: 0; }
  5% { opacity: 1; }
  15% { opacity: 0.4; }
  30% { opacity: 0.7; }
  60% { opacity: 0.1; }
}

/* 精神射线 - 从核心向外射出的粉色射线 */
.mt-beam {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 3px;
  height: 120px;
  background: linear-gradient(to top,
    rgba(233, 30, 99, 0.9) 0%,
    rgba(248, 187, 208, 0.7) 50%,
    transparent 100%
  );
  box-shadow: 0 0 8px rgba(233, 30, 99, 0.6);
  transform: translate(-50%, -100%) rotate(var(--mt-beam-angle, 0deg)) scaleY(0);
  transform-origin: 50% 100%;
  opacity: 0;
  will-change: transform, opacity;
  animation: mtBeam 0.5s ease-out 0.7s forwards;
}

@keyframes mtBeam {
  0% { transform: translate(-50%, -100%) rotate(var(--mt-beam-angle, 0deg)) scaleY(0); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: translate(-50%, -100%) rotate(var(--mt-beam-angle, 0deg)) scaleY(1); opacity: 0; }
}

/* 撕裂冲击波 - 从中心扩散的粉色冲击波 */
.mt-blast-wave {
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

.mt-blast-wave.bw-1 {
  animation: mtBlastWave 1s cubic-bezier(0.05, 0.9, 0.25, 1) 0.7s forwards;
}

.mt-blast-wave.bw-2 {
  border-color: rgba(171, 71, 188, 0.6);
  animation: mtBlastWave 1.1s cubic-bezier(0.05, 0.9, 0.25, 1) 0.85s forwards;
}

@keyframes mtBlastWave {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  8% { opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(15); opacity: 0; }
}

/* 精神碎片 - 爆发的粉色碎片向外飞射 */
.mt-fragment {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 30%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 187, 208, 0.8) 40%,
    rgba(233, 30, 99, 0.3) 100%
  );
  box-shadow: 0 0 8px rgba(233, 30, 99, 0.6);
  transform: translate(-50%, -50%) rotate(var(--mt-fragment-angle, 0deg)) translateX(0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: mtFragmentFly 0.9s ease-out 0.7s forwards;
}

@keyframes mtFragmentFly {
  0% {
    transform: translate(-50%, -50%) rotate(var(--mt-fragment-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--mt-fragment-angle, 0deg)) translateX(calc(var(--mt-fragment-distance, 140px) * 0.15)) scale(1.2);
  }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--mt-fragment-angle, 0deg) + 90deg)) translateX(var(--mt-fragment-distance, 140px)) scale(0.2);
    opacity: 0;
  }
}

/* ===== 阶段四：精神消散（1.4s ~ 1.8s）===== */

/* 消散涟漪 - 最后的精神涟漪 */
.mt-dissipate-ripple {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(233, 30, 99, 0.08) 30deg,
    rgba(171, 71, 188, 0.15) 60deg,
    rgba(233, 30, 99, 0.08) 90deg,
    transparent 120deg,
    rgba(233, 30, 99, 0.08) 180deg,
    rgba(171, 71, 188, 0.15) 210deg,
    rgba(233, 30, 99, 0.08) 240deg,
    transparent 270deg,
    rgba(233, 30, 99, 0.08) 330deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 20%, black 35%, transparent 85%);
  mask: radial-gradient(circle, transparent 20%, black 35%, transparent 85%);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: mtDissipate 0.5s ease-out 1.4s forwards;
}

@keyframes mtDissipate {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  20% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .mt-dim, .mt-rift, .mt-pink-particle, .mt-core, .mt-compress-ring,
  .mt-blast-flash, .mt-beam, .mt-blast-wave, .mt-fragment, .mt-dissipate-ripple {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
