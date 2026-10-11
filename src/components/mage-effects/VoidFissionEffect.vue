<!--
  @file VoidFissionEffect.vue
  @generated 2026-08-12
  @description 虚空寂灭 - 将奥术能量压缩至极限后释放（单体攻击特效）
  四阶段叙事：虚空凝聚 → 极限压缩 → 寂灭释放 → 虚空消散
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  色彩方案：虚空黑(#10002B) + 深渊紫(#240046) + 暗紫(#5A189A) + 虚空洋红(#FF006E)
-->
<template>
  <!-- 暗幕：虚空能量笼罩目标区域 -->
  <div class="vf-dim"></div>

  <!-- ===== 阶段一：虚空凝聚（0s ~ 0.4s）===== -->
  <!-- 虚空裂缝：目标周围出现虚空裂缝 -->
  <div
    v-for="i in 6"
    :key="'vf-rift-' + i"
    class="vf-rift"
    :style="getRiftStyle(i)"
  ></div>

  <!-- 虚空粒子：暗色粒子向中心汇聚 -->
  <div
    v-for="i in 12"
    :key="'vf-particle-' + i"
    class="vf-dark-particle"
    :style="getDarkParticleStyle(i)"
  ></div>

  <!-- ===== 阶段二：极限压缩（0.4s ~ 0.7s）===== -->
  <!-- 虚空核心：黑色能量球压缩成形 -->
  <div class="vf-core">
    <div class="vf-core-inner"></div>
    <div class="vf-core-crack"></div>
  </div>

  <!-- 压缩光环：向内收缩的紫色光环 -->
  <div class="vf-compress-ring ring-a"></div>
  <div class="vf-compress-ring ring-b"></div>

  <!-- ===== 阶段三：寂灭释放（0.7s ~ 1.4s）===== -->
  <!-- 寂灭闪光：极限释放的白色爆闪 -->
  <div class="vf-blast-flash"></div>

  <!-- 虚空射线：从核心向外射出的暗紫色射线 -->
  <div
    v-for="i in 8"
    :key="'vf-beam-' + i"
    class="vf-beam"
    :style="getBeamStyle(i)"
  ></div>

  <!-- 寂灭冲击波：从中心扩散的暗色冲击波 -->
  <div class="vf-blast-wave bw-1"></div>
  <div class="vf-blast-wave bw-2"></div>

  <!-- 虚空碎片：爆发的暗色碎片向外飞射 -->
  <div
    v-for="i in 10"
    :key="'vf-fragment-' + i"
    class="vf-fragment"
    :style="getFragmentStyle(i)"
  ></div>

  <!-- ===== 阶段四：虚空消散（1.4s ~ 1.8s）===== -->
  <!-- 消散涟漪：最后的虚空涟漪 -->
  <div class="vf-dissipate-ripple"></div>
</template>

<script setup>
/**
 * 虚空寂灭 - 将奥术能量压缩至极限后释放（单体攻击特效）
 * 四阶段叙事：虚空凝聚 → 极限压缩 → 寂灭释放 → 虚空消散
 * 以虚空黑和深渊紫为主色调，展现虚空能量从凝聚到极限压缩再到寂灭爆发的完整视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 */

defineOptions({
  inheritAttrs: false
})

/**
 * 计算虚空裂缝的位置样式
 * @param {number} index - 裂缝索引（1~6）
 * @returns {Object} CSS自定义属性对象
 */
function getRiftStyle (index) {
  const angle = (index - 1) * 60
  const distance = 40 + (index % 3) * 12
  return {
    '--vf-rift-angle': `${angle}deg`,
    '--vf-rift-distance': `${distance}px`
  }
}

/**
 * 计算暗色粒子的汇聚样式
 * @param {number} index - 粒子索引（1~12）
 * @returns {Object} CSS自定义属性对象
 */
function getDarkParticleStyle (index) {
  const angle = (index - 1) * 30
  const distance = 90 + (index % 4) * 15
  const size = 4 + (index % 3) * 2
  const delay = (index - 1) * 0.02
  return {
    '--vf-particle-angle': `${angle}deg`,
    '--vf-particle-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算虚空射线的方向样式
 * @param {number} index - 射线索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getBeamStyle (index) {
  const angle = (index - 1) * 45
  return {
    '--vf-beam-angle': `${angle}deg`
  }
}

/**
 * 计算虚空碎片的飞射样式
 * @param {number} index - 碎片索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getFragmentStyle (index) {
  const angle = (index - 1) * 36 + (index % 2) * 8
  const distance = 100 + (index % 4) * 20
  const size = 5 + (index % 3) * 3
  const delay = (index % 3) * 0.03
  return {
    '--vf-frag-angle': `${angle}deg`,
    '--vf-frag-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   虚空寂灭 (arcane_master_w) - 单体攻击特效
   技能描述：将奥术能量压缩至极限后释放，对单体目标造成毁灭性无属性法术伤害
   色彩方案：虚空黑(#10002B) + 深渊紫(#240046) + 暗紫(#5A189A) + 虚空洋红(#FF006E)
   GPU加速：contain隔离 + will-change + translate3d
   ================================================================ */

/* 暗幕 - 虚空能量笼罩目标区域 */
.vf-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(16, 0, 43, 0.6) 0%,
    rgba(36, 0, 70, 0.35) 35%,
    rgba(16, 0, 43, 0.15) 70%,
    transparent 100%
  );
  animation: vfDim 1.8s ease-out forwards;
  will-change: opacity;
}

@keyframes vfDim {
  0% { opacity: 0; }
  10% { opacity: 1; }
  50% { opacity: 0.75; }
  100% { opacity: 0; }
}

/* ===== 阶段一：虚空凝聚（0s ~ 0.4s）===== */

/* 虚空裂缝 - 目标周围出现虚空裂缝 */
.vf-rift {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(90, 24, 154, 0.6) 20%,
    rgba(255, 0, 110, 0.4) 50%,
    rgba(90, 24, 154, 0.6) 80%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(90, 24, 154, 0.4);
  transform: translate(-50%, -50%) rotate(var(--vf-rift-angle, 0deg)) translateX(var(--vf-rift-distance, 40px)) scaleX(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: vfRiftAppear 0.4s ease-out forwards;
}

@keyframes vfRiftAppear {
  0% { transform: translate(-50%, -50%) rotate(var(--vf-rift-angle, 0deg)) translateX(var(--vf-rift-distance, 40px)) scaleX(0); opacity: 0; }
  40% { transform: translate(-50%, -50%) rotate(var(--vf-rift-angle, 0deg)) translateX(var(--vf-rift-distance, 40px)) scaleX(1); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) rotate(var(--vf-rift-angle, 0deg)) translateX(calc(var(--vf-rift-distance, 40px) * 0.7)) scaleX(0.5); opacity: 0; }
}

/* 虚空粒子 - 暗色粒子向中心汇聚 */
.vf-dark-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(90, 24, 154, 0.9) 0%,
    rgba(36, 0, 70, 0.5) 50%,
    transparent 100%
  );
  box-shadow: 0 0 5px rgba(90, 24, 154, 0.4);
  transform: translate(-50%, -50%) rotate(var(--vf-particle-angle, 0deg)) translateX(var(--vf-particle-distance, 90px)) scale(1);
  opacity: 0;
  will-change: transform, opacity;
  animation: vfDarkParticleConverge 0.4s ease-in forwards;
}

@keyframes vfDarkParticleConverge {
  0% {
    transform: translate(-50%, -50%) rotate(var(--vf-particle-angle, 0deg)) translateX(var(--vf-particle-distance, 90px)) scale(1);
    opacity: 0;
  }
  20% { opacity: 0.8; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--vf-particle-angle, 0deg) + 180deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ===== 阶段二：极限压缩（0.4s ~ 0.7s）===== */

/* 虚空核心 - 黑色能量球压缩成形 */
.vf-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  transform: translate(-50%, -50%) scale(0);
  animation: vfCoreCompress 0.3s cubic-bezier(0.5, 0, 0.8, 0.2) 0.4s forwards;
  will-change: transform, opacity;
}

@keyframes vfCoreCompress {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  30% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(0.4); opacity: 1; }
}

.vf-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 40% 40%,
    rgba(255, 0, 110, 0.4) 0%,
    rgba(90, 24, 154, 0.8) 25%,
    rgba(36, 0, 70, 0.95) 50%,
    rgba(16, 0, 43, 1) 80%,
    rgba(0, 0, 0, 1) 100%
  );
  box-shadow:
    0 0 15px rgba(90, 24, 154, 0.8),
    0 0 30px rgba(36, 0, 70, 0.5),
    inset 0 0 10px rgba(255, 0, 110, 0.2);
  animation: vfCoreInnerPulse 0.3s ease-in-out 0.4s infinite;
  will-change: transform;
}

@keyframes vfCoreInnerPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.vf-core-crack {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(255, 0, 110, 0.6);
  box-shadow: 0 0 8px rgba(255, 0, 110, 0.4), inset 0 0 8px rgba(255, 0, 110, 0.2);
  animation: vfCoreCrack 0.3s ease-in 0.4s forwards;
  will-change: transform, opacity;
  opacity: 0;
}

@keyframes vfCoreCrack {
  0% { opacity: 0; transform: scale(1); }
  50% { opacity: 1; }
  100% { opacity: 0.8; transform: scale(1.3); }
}

/* 压缩光环 - 向内收缩的紫色光环 */
.vf-compress-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid rgba(90, 24, 154, 0.5);
  box-shadow: 0 0 10px rgba(90, 24, 154, 0.3);
  transform: translate(-50%, -50%) scale(2);
  opacity: 0;
  will-change: transform, opacity;
}

.vf-compress-ring.ring-a {
  animation: vfCompressRing 0.3s ease-in 0.4s forwards;
}

.vf-compress-ring.ring-b {
  border-color: rgba(255, 0, 110, 0.4);
  animation: vfCompressRing 0.3s ease-in 0.5s forwards;
}

@keyframes vfCompressRing {
  0% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
  30% { opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
}

/* ===== 阶段三：寂灭释放（0.7s ~ 1.4s）===== */

/* 寂灭闪光 - 极限释放的白色爆闪 */
.vf-blast-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 0, 110, 0.5) 10%,
    rgba(90, 24, 154, 0.3) 25%,
    transparent 50%
  );
  opacity: 0;
  animation: vfBlastFlash 0.5s ease-out 0.7s forwards;
  will-change: opacity;
}

@keyframes vfBlastFlash {
  0%, 100% { opacity: 0; }
  5% { opacity: 1; }
  20% { opacity: 0.5; }
  50% { opacity: 0.2; }
}

/* 虚空射线 - 从核心向外射出的暗紫色射线 */
.vf-beam {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 3px;
  background: linear-gradient(90deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 0, 110, 0.7) 15%,
    rgba(90, 24, 154, 0.5) 40%,
    rgba(36, 0, 70, 0.2) 80%,
    transparent 100%
  );
  box-shadow: 0 0 8px rgba(255, 0, 110, 0.4);
  transform: translate(-50%, -50%) rotate(var(--vf-beam-angle, 0deg)) translateX(0) scaleX(0);
  transform-origin: 0 50%;
  opacity: 0;
  will-change: transform, opacity;
  animation: vfBeamShoot 0.5s ease-out 0.7s forwards;
}

@keyframes vfBeamShoot {
  0% { transform: translate(-50%, -50%) rotate(var(--vf-beam-angle, 0deg)) translateX(0) scaleX(0); opacity: 0; }
  15% { transform: translate(-50%, -50%) rotate(var(--vf-beam-angle, 0deg)) translateX(0) scaleX(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) rotate(var(--vf-beam-angle, 0deg)) translateX(30px) scaleX(0.3); opacity: 0; }
}

/* 寂灭冲击波 - 从中心扩散的暗色冲击波 */
.vf-blast-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid rgba(255, 0, 110, 0.7);
  box-shadow: 0 0 15px rgba(255, 0, 110, 0.5), 0 0 30px rgba(90, 24, 154, 0.3);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.vf-blast-wave.bw-1 {
  animation: vfBlastWave 0.8s cubic-bezier(0.05, 0.9, 0.25, 1) 0.7s forwards;
}

.vf-blast-wave.bw-2 {
  border-color: rgba(90, 24, 154, 0.6);
  animation: vfBlastWave 0.9s cubic-bezier(0.05, 0.9, 0.25, 1) 0.85s forwards;
}

@keyframes vfBlastWave {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(12); opacity: 0; }
}

/* 虚空碎片 - 爆发的暗色碎片向外飞射 */
.vf-fragment {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 30%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 0, 110, 0.9) 0%,
    rgba(90, 24, 154, 0.7) 40%,
    rgba(36, 0, 70, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(90, 24, 154, 0.5);
  transform: translate(-50%, -50%) rotate(var(--vf-frag-angle, 0deg)) translateX(0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: vfFragmentFly 0.8s ease-out 0.7s forwards;
}

@keyframes vfFragmentFly {
  0% {
    transform: translate(-50%, -50%) rotate(var(--vf-frag-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--vf-frag-angle, 0deg)) translateX(calc(var(--vf-frag-distance, 100px) * 0.15)) scale(1.2);
  }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--vf-frag-angle, 0deg) + 120deg)) translateX(var(--vf-frag-distance, 100px)) scale(0.2);
    opacity: 0;
  }
}

/* ===== 阶段四：虚空消散（1.4s ~ 1.8s）===== */

/* 消散涟漪 - 最后的虚空涟漪 */
.vf-dissipate-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 1px solid rgba(90, 24, 154, 0.3);
  background: radial-gradient(
    circle,
    rgba(36, 0, 70, 0.08) 0%,
    rgba(16, 0, 43, 0.04) 50%,
    transparent 80%
  );
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: vfDissipateRipple 0.4s ease-out 1.4s forwards;
}

@keyframes vfDissipateRipple {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  30% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
  100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .vf-dim, .vf-rift, .vf-dark-particle, .vf-core,
  .vf-compress-ring, .vf-blast-flash, .vf-beam,
  .vf-blast-wave, .vf-fragment, .vf-dissipate-ripple {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
