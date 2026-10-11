<!--
  @file ArcaneNovaEffect.vue
  @generated 2026-08-12
  @description 奥术新星 - 以自身为中心释放奥术新星爆炸（AOE攻击特效）
  四阶段叙事：能量凝聚 → 新星升腾 → 星爆扩散 → 余韵消散
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  色彩方案：奥术紫(#9D4EDD) + 星光紫(#C77DFF) + 纯白紫(#E0AAFF) + 深渊紫(#3C096C)
-->
<template>
  <!-- 暗幕：奥术能量笼罩战场 -->
  <div class="an-dim"></div>

  <!-- 全屏闪光：新星爆发瞬间的紫色爆闪 -->
  <div class="an-flash"></div>

  <!-- ===== 阶段一：能量凝聚（0s ~ 0.35s）===== -->
  <!-- 地面法阵：奥术六芒星法阵从地面展开 -->
  <div class="an-ground-circle">
    <div class="an-gc-ring gc-ring-outer"></div>
    <div class="an-gc-ring gc-ring-mid"></div>
    <div class="an-gc-ring gc-ring-inner"></div>
  </div>

  <!-- 汇聚粒子：周围奥术能量向中心汇聚 -->
  <div
    v-for="i in 14"
    :key="'an-converge-' + i"
    class="an-converge-particle"
    :style="getConvergeStyle(i)"
  ></div>

  <!-- ===== 阶段二：新星升腾（0.35s ~ 0.7s）===== -->
  <!-- 奥术核心：中心能量球升腾膨胀 -->
  <div class="an-core">
    <div class="an-core-inner"></div>
    <div class="an-core-pulse"></div>
  </div>

  <!-- 升腾光柱：从地面向上喷射的紫色光柱 -->
  <div class="an-pillar"></div>

  <!-- ===== 阶段三：星爆扩散（0.7s ~ 1.6s）===== -->
  <!-- 多层冲击波：从中心向外扩散的紫色能量环 -->
  <div class="an-shockwave sw-1"></div>
  <div class="an-shockwave sw-2"></div>
  <div class="an-shockwave sw-3"></div>

  <!-- 能量碎片：爆发的奥术碎片向外飞射 -->
  <div
    v-for="i in 16"
    :key="'an-shard-' + i"
    class="an-shard"
    :style="getShardStyle(i)"
  ></div>

  <!-- 旋转符文环：爆发的奥术符文环绕中心旋转扩散 -->
  <div class="an-rune-ring">
    <div
      v-for="i in 6"
      :key="'an-rune-' + i"
      class="an-rune"
      :style="getRuneStyle(i)"
    ></div>
  </div>

  <!-- ===== 阶段四：余韵消散（1.6s ~ 2s）===== -->
  <!-- 消散余波：最后的旋转奥术场 -->
  <div class="an-dissipate"></div>
</template>

<script setup>
/**
 * 奥术新星 - 以自身为中心释放奥术新星爆炸（AOE攻击特效）
 * 四阶段叙事：能量凝聚 → 新星升腾 → 星爆扩散 → 余韵消散
 * 以奥术紫和星光紫为主色调，展现奥术新星从凝聚到爆发的完整视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 */

defineOptions({
  inheritAttrs: false
})

/**
 * 计算汇聚粒子的样式
 * @param {number} index - 粒子索引（1~14）
 * @returns {Object} CSS自定义属性对象
 */
function getConvergeStyle (index) {
  const angle = (index - 1) * 25.7 + (index % 2) * 8
  const distance = 120 + (index % 4) * 18
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.02
  return {
    '--an-conv-angle': `${angle}deg`,
    '--an-conv-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算能量碎片的飞射样式
 * @param {number} index - 碎片索引（1~16）
 * @returns {Object} CSS自定义属性对象
 */
function getShardStyle (index) {
  const angle = (index - 1) * 22.5 + (index % 2) * 6
  const distance = 160 + (index % 5) * 24
  const size = 5 + (index % 4) * 3
  const delay = (index % 4) * 0.04
  return {
    '--an-shard-angle': `${angle}deg`,
    '--an-shard-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算旋转符文的位置样式
 * @param {number} index - 符文索引（1~6）
 * @returns {Object} CSS自定义属性对象
 */
function getRuneStyle (index) {
  const angle = (index - 1) * 60
  return {
    '--an-rune-angle': `${angle}deg`
  }
}
</script>

<style scoped>
/* ================================================================
   奥术新星 (arcane_master_u) - AOE攻击特效
   技能描述：以自身为中心释放奥术新星，对范围内敌人造成毁灭性无属性法术范围伤害
   色彩方案：奥术紫(#9D4EDD) + 星光紫(#C77DFF) + 纯白紫(#E0AAFF) + 深渊紫(#3C096C)
   GPU加速：contain隔离 + will-change + translate3d
   ================================================================ */

/* 暗幕 - 奥术能量笼罩战场 */
.an-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center 55%,
    rgba(60, 9, 108, 0.55) 0%,
    rgba(40, 5, 80, 0.3) 40%,
    rgba(20, 0, 40, 0.12) 75%,
    transparent 100%
  );
  animation: anDim 2s ease-out forwards;
  will-change: opacity;
}

@keyframes anDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  60% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 全屏闪光 - 新星爆发瞬间的紫色爆闪 */
.an-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center 55%,
    rgba(224, 170, 255, 0.9) 0%,
    rgba(199, 125, 255, 0.5) 15%,
    rgba(157, 78, 221, 0.2) 40%,
    transparent 70%
  );
  opacity: 0;
  animation: anFlash 0.6s ease-out 0.35s forwards;
  will-change: opacity;
}

@keyframes anFlash {
  0%, 100% { opacity: 0; }
  5% { opacity: 1; }
  15% { opacity: 0.4; }
  30% { opacity: 0.7; }
  60% { opacity: 0.1; }
}

/* ===== 阶段一：能量凝聚（0s ~ 0.35s）===== */

/* 地面法阵 - 奥术六芒星法阵从地面展开 */
.an-ground-circle {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 200px;
  height: 200px;
  transform: translate(-50%, -50%) rotateX(75deg) scale(0);
  opacity: 0;
  animation: anGroundCircle 0.4s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes anGroundCircle {
  0% { transform: translate(-50%, -50%) rotateX(75deg) scale(0); opacity: 0; }
  40% { transform: translate(-50%, -50%) rotateX(75deg) scale(1.1); opacity: 0.9; }
  100% { transform: translate(-50%, -50%) rotateX(75deg) scale(1); opacity: 0.7; }
}

.an-gc-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  will-change: transform, opacity;
}

.an-gc-ring.gc-ring-outer {
  border: 2px solid rgba(157, 78, 221, 0.6);
  box-shadow: 0 0 12px rgba(157, 78, 221, 0.4);
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(199, 125, 255, 0.15) 3deg,
    transparent 6deg,
    transparent 30deg
  );
  animation: anSpinCW 3s linear infinite;
}

.an-gc-ring.gc-ring-mid {
  inset: 20%;
  border: 1px solid rgba(199, 125, 255, 0.5);
  background: repeating-conic-gradient(
    from 30deg,
    transparent 0deg,
    rgba(224, 170, 255, 0.12) 4deg,
    transparent 8deg,
    transparent 45deg
  );
  animation: anSpinCCW 2s linear infinite;
}

.an-gc-ring.gc-ring-inner {
  inset: 40%;
  border: 1px solid rgba(224, 170, 255, 0.4);
  animation: anSpinCW 1.2s linear infinite;
}

@keyframes anSpinCW {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes anSpinCCW {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

/* 汇聚粒子 - 周围奥术能量向中心汇聚 */
.an-converge-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(224, 170, 255, 0.95) 0%,
    rgba(199, 125, 255, 0.6) 50%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(199, 125, 255, 0.5);
  transform: translate(-50%, -50%) rotate(var(--an-conv-angle, 0deg)) translateX(var(--an-conv-distance, 100px)) scale(1);
  opacity: 0;
  will-change: transform, opacity;
  animation: anConverge 0.35s ease-in forwards;
}

@keyframes anConverge {
  0% {
    transform: translate(-50%, -50%) rotate(var(--an-conv-angle, 0deg)) translateX(var(--an-conv-distance, 100px)) scale(1);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--an-conv-angle, 0deg) + 180deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ===== 阶段二：新星升腾（0.35s ~ 0.7s）===== */

/* 奥术核心 - 中心能量球升腾膨胀 */
.an-core {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%) scale(0);
  animation: anCoreAppear 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) 0.35s forwards;
  will-change: transform, opacity;
}

@keyframes anCoreAppear {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  60% { transform: translate(-50%, -50%) scale(1.4); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

.an-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 40% 40%,
    rgba(255, 255, 255, 1) 0%,
    rgba(224, 170, 255, 0.95) 20%,
    rgba(199, 125, 255, 0.8) 45%,
    rgba(157, 78, 221, 0.5) 75%,
    transparent 100%
  );
  box-shadow:
    0 0 20px rgba(199, 125, 255, 0.9),
    0 0 40px rgba(157, 78, 221, 0.6),
    0 0 60px rgba(60, 9, 108, 0.3);
  animation: anCorePulse 0.8s ease-in-out 0.7s forwards;
  will-change: transform, opacity;
}

@keyframes anCorePulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.85; }
}

.an-core-pulse {
  position: absolute;
  inset: -50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(199, 125, 255, 0.3) 0%,
    rgba(157, 78, 221, 0.1) 50%,
    transparent 80%
  );
  animation: anCorePulseRing 1s ease-out 0.7s forwards;
  will-change: transform, opacity;
  opacity: 0;
}

@keyframes anCorePulseRing {
  0% { transform: scale(0.5); opacity: 0; }
  30% { opacity: 0.8; }
  100% { transform: scale(3); opacity: 0; }
}

/* 升腾光柱 - 从地面向上喷射的紫色光柱 */
.an-pillar {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 30px;
  height: 300px;
  background: linear-gradient(to top,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(224, 170, 255, 0.7) 20%,
    rgba(199, 125, 255, 0.4) 50%,
    rgba(157, 78, 221, 0.1) 80%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(3px);
  box-shadow: 0 0 20px rgba(199, 125, 255, 0.6);
  transform: translate(-50%, -100%) scaleY(0);
  transform-origin: 50% 100%;
  animation: anPillarRise 0.5s ease-out 0.35s forwards,
             anPillarFade 1s ease-out 0.85s forwards;
  will-change: transform, opacity;
}

@keyframes anPillarRise {
  0% { transform: translate(-50%, -100%) scaleY(0); }
  100% { transform: translate(-50%, -100%) scaleY(1); }
}

@keyframes anPillarFade {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* ===== 阶段三：星爆扩散（0.7s ~ 1.6s）===== */

/* 多层冲击波 - 从中心向外扩散的紫色能量环 */
.an-shockwave {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 4px solid rgba(199, 125, 255, 0.8);
  box-shadow:
    0 0 20px rgba(199, 125, 255, 0.6),
    0 0 40px rgba(157, 78, 221, 0.3);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.an-shockwave.sw-1 {
  border-width: 5px;
  animation: anShockwave 1s cubic-bezier(0.05, 0.9, 0.25, 1) 0.7s forwards;
}

.an-shockwave.sw-2 {
  border-width: 4px;
  border-color: rgba(199, 125, 255, 0.6);
  animation: anShockwave 1.1s cubic-bezier(0.05, 0.9, 0.25, 1) 0.85s forwards;
}

.an-shockwave.sw-3 {
  border-width: 3px;
  border-color: rgba(157, 78, 221, 0.5);
  animation: anShockwave 1.2s cubic-bezier(0.05, 0.9, 0.25, 1) 1s forwards;
}

@keyframes anShockwave {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  8% { opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(18); opacity: 0; }
}

/* 能量碎片 - 爆发的奥术碎片向外飞射 */
.an-shard {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 30%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(224, 170, 255, 0.8) 40%,
    rgba(157, 78, 221, 0.3) 100%
  );
  box-shadow: 0 0 8px rgba(199, 125, 255, 0.6);
  transform: translate(-50%, -50%) rotate(var(--an-shard-angle, 0deg)) translateX(0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: anShardFly 0.9s ease-out 0.7s forwards;
}

@keyframes anShardFly {
  0% {
    transform: translate(-50%, -50%) rotate(var(--an-shard-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--an-shard-angle, 0deg)) translateX(calc(var(--an-shard-distance, 160px) * 0.15)) scale(1.2);
  }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--an-shard-angle, 0deg) + 90deg)) translateX(var(--an-shard-distance, 160px)) scale(0.2);
    opacity: 0;
  }
}

/* 旋转符文环 - 爆发的奥术符文环绕中心旋转扩散 */
.an-rune-ring {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 0;
  height: 0;
  opacity: 0;
  animation: anRuneRingContainer 1.2s ease-out 0.7s forwards;
  will-change: transform, opacity;
}

@keyframes anRuneRingContainer {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3) rotate(0deg); }
  20% { opacity: 0.8; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5) rotate(120deg); }
}

.an-rune {
  position: absolute;
  top: 0;
  left: 0;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: rgba(224, 170, 255, 0.8);
  box-shadow: 0 0 8px rgba(199, 125, 255, 0.6);
  transform: translate(-50%, -50%) rotate(var(--an-rune-angle, 0deg)) translateX(100px);
  will-change: transform, opacity;
}

/* ===== 阶段四：余韵消散（1.6s ~ 2s）===== */

/* 消散余波 - 最后的旋转奥术场 */
.an-dissipate {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(157, 78, 221, 0.08) 30deg,
    rgba(199, 125, 255, 0.15) 60deg,
    rgba(157, 78, 221, 0.08) 90deg,
    transparent 120deg,
    rgba(157, 78, 221, 0.08) 180deg,
    rgba(199, 125, 255, 0.15) 210deg,
    rgba(157, 78, 221, 0.08) 240deg,
    transparent 270deg,
    rgba(157, 78, 221, 0.08) 330deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 20%, black 35%, transparent 85%);
  mask: radial-gradient(circle, transparent 20%, black 35%, transparent 85%);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: anDissipate 0.5s ease-out 1.6s forwards;
}

.an-dissipate::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 60deg,
    transparent 0deg,
    rgba(199, 125, 255, 0.08) 45deg,
    rgba(224, 170, 255, 0.12) 90deg,
    rgba(199, 125, 255, 0.08) 135deg,
    transparent 180deg,
    rgba(199, 125, 255, 0.08) 225deg,
    rgba(224, 170, 255, 0.12) 270deg,
    rgba(199, 125, 255, 0.08) 315deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 30%, black 50%, transparent 80%);
  mask: radial-gradient(circle, transparent 30%, black 50%, transparent 80%);
  will-change: transform;
  animation: anSpinCCW 1.2s linear infinite;
}

@keyframes anDissipate {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  20% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .an-dim, .an-flash, .an-ground-circle, .an-converge-particle,
  .an-core, .an-pillar, .an-shockwave, .an-shard,
  .an-rune-ring, .an-dissipate {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
