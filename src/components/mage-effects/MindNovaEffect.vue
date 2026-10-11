<!--
  @file MindNovaEffect.vue
  @generated 2026-08-12
  @description 万绪沉宵 - 引无边幽夜笼罩一片区域，将范围内诸多敌人的思绪一同沉入永夜（AOE攻击特效）
  四阶段叙事：心灵凝聚 → 新星升腾 → 心爆扩散 → 余韵消散
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  色彩方案：心灵粉(#E91E63) + 幻影紫(#AB47BC) + 精神白(#F8BBD0) + 深渊紫(#4A148C)
-->
<template>
  <!-- 暗幕：心灵能量笼罩战场 -->
  <div class="mn-dim"></div>

  <!-- 全屏闪光：新星爆发瞬间的粉色爆闪 -->
  <div class="mn-flash"></div>

  <!-- ===== 阶段一：心灵凝聚（0s ~ 0.35s）===== -->
  <!-- 地面法阵：心灵六芒星法阵从地面展开 -->
  <div class="mn-ground-circle">
    <div class="mn-gc-ring gc-ring-outer"></div>
    <div class="mn-gc-ring gc-ring-mid"></div>
    <div class="mn-gc-ring gc-ring-inner"></div>
  </div>

  <!-- 汇聚粒子：周围心灵能量向中心汇聚 -->
  <div
    v-for="i in 14"
    :key="'mn-converge-' + i"
    class="mn-converge-particle"
    :style="getConvergeStyle(i)"
  ></div>

  <!-- ===== 阶段二：新星升腾（0.35s ~ 0.7s）===== -->
  <!-- 心灵核心：中心能量球升腾膨胀 -->
  <div class="mn-core">
    <div class="mn-core-inner"></div>
    <div class="mn-core-pulse"></div>
  </div>

  <!-- 升腾光柱：从地面向上喷射的粉色光柱 -->
  <div class="mn-pillar"></div>

  <!-- ===== 阶段三：心爆扩散（0.7s ~ 1.6s）===== -->
  <!-- 多层冲击波：从中心向外扩散的粉色能量环 -->
  <div class="mn-shockwave sw-1"></div>
  <div class="mn-shockwave sw-2"></div>
  <div class="mn-shockwave sw-3"></div>

  <!-- 能量碎片：爆发的心灵碎片向外飞射 -->
  <div
    v-for="i in 16"
    :key="'mn-shard-' + i"
    class="mn-shard"
    :style="getShardStyle(i)"
  ></div>

  <!-- 旋转符文环：爆发的心灵符文环绕中心旋转扩散 -->
  <div class="mn-rune-ring">
    <div
      v-for="i in 6"
      :key="'mn-rune-' + i"
      class="mn-rune"
      :style="getRuneStyle(i)"
    ></div>
  </div>

  <!-- ===== 阶段四：余韵消散（1.6s ~ 2s）===== -->
  <!-- 消散余波：最后的旋转心灵场 -->
  <div class="mn-dissipate"></div>
</template>

<script setup>
/**
 * 万绪沉宵 - 引无边幽夜笼罩一片区域，将范围内诸多敌人的思绪一同沉入永夜（AOE攻击特效）
 * 四阶段叙事：心灵凝聚 → 新星升腾 → 心爆扩散 → 余韵消散
 * 以心灵粉和幻影紫为主色调，展现万绪沉宵从凝聚到爆发的完整视觉效果
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
    '--mn-conv-angle': `${angle}deg`,
    '--mn-conv-distance': `${distance}px`,
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
    '--mn-shard-angle': `${angle}deg`,
    '--mn-shard-distance': `${distance}px`,
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
    '--mn-rune-angle': `${angle}deg`
  }
}
</script>

<style scoped>
/* ================================================================
   万绪沉宵 (mind_master_u) - AOE攻击特效
   技能描述：引无边幽夜笼罩一片区域，将范围内诸多敌人的思绪一同沉入永夜。对多名目标造成精神侵蚀，并使其陷入短暂的意志低迷
   色彩方案：心灵粉(#E91E63) + 幻影紫(#AB47BC) + 精神白(#F8BBD0) + 深渊紫(#4A148C)
   GPU加速：contain隔离 + will-change + translate3d
   ================================================================ */

/* 暗幕 - 心灵能量笼罩战场 */
.mn-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center 55%,
    rgba(74, 20, 140, 0.55) 0%,
    rgba(50, 10, 100, 0.3) 40%,
    rgba(30, 0, 60, 0.12) 75%,
    transparent 100%
  );
  animation: mnDim 2s ease-out forwards;
  will-change: opacity;
}

@keyframes mnDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  60% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 全屏闪光 - 新星爆发瞬间的粉色爆闪 */
.mn-flash {
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
  animation: mnFlash 0.6s ease-out 0.35s forwards;
  will-change: opacity;
}

@keyframes mnFlash {
  0%, 100% { opacity: 0; }
  5% { opacity: 1; }
  15% { opacity: 0.4; }
  30% { opacity: 0.7; }
  60% { opacity: 0.1; }
}

/* ===== 阶段一：心灵凝聚（0s ~ 0.35s）===== */

/* 地面法阵 - 心灵六芒星法阵从地面展开 */
.mn-ground-circle {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 200px;
  height: 200px;
  transform: translate(-50%, -50%) rotateX(75deg) scale(0);
  opacity: 0;
  animation: mnGroundCircle 0.4s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes mnGroundCircle {
  0% { transform: translate(-50%, -50%) rotateX(75deg) scale(0); opacity: 0; }
  40% { transform: translate(-50%, -50%) rotateX(75deg) scale(1.1); opacity: 0.9; }
  100% { transform: translate(-50%, -50%) rotateX(75deg) scale(1); opacity: 0.7; }
}

.mn-gc-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  will-change: transform, opacity;
}

.mn-gc-ring.gc-ring-outer {
  border: 2px solid rgba(233, 30, 99, 0.6);
  box-shadow: 0 0 12px rgba(233, 30, 99, 0.4);
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(171, 71, 188, 0.15) 3deg,
    transparent 6deg,
    transparent 30deg
  );
  animation: mnSpinCW 3s linear infinite;
}

.mn-gc-ring.gc-ring-mid {
  inset: 20%;
  border: 1px solid rgba(171, 71, 188, 0.5);
  background: repeating-conic-gradient(
    from 30deg,
    transparent 0deg,
    rgba(248, 187, 208, 0.12) 4deg,
    transparent 8deg,
    transparent 45deg
  );
  animation: mnSpinCCW 2s linear infinite;
}

.mn-gc-ring.gc-ring-inner {
  inset: 40%;
  border: 1px solid rgba(248, 187, 208, 0.4);
  animation: mnSpinCW 1.2s linear infinite;
}

@keyframes mnSpinCW {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes mnSpinCCW {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

/* 汇聚粒子 - 周围心灵能量向中心汇聚 */
.mn-converge-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(248, 187, 208, 0.95) 0%,
    rgba(233, 30, 99, 0.6) 50%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(233, 30, 99, 0.5);
  transform: translate(-50%, -50%) rotate(var(--mn-conv-angle, 0deg)) translateX(var(--mn-conv-distance, 100px)) scale(1);
  opacity: 0;
  will-change: transform, opacity;
  animation: mnConverge 0.35s ease-in forwards;
}

@keyframes mnConverge {
  0% {
    transform: translate(-50%, -50%) rotate(var(--mn-conv-angle, 0deg)) translateX(var(--mn-conv-distance, 100px)) scale(1);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--mn-conv-angle, 0deg) + 180deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ===== 阶段二：新星升腾（0.35s ~ 0.7s）===== */

/* 心灵核心 - 中心能量球升腾膨胀 */
.mn-core {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%) scale(0);
  animation: mnCoreAppear 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) 0.35s forwards;
  will-change: transform, opacity;
}

@keyframes mnCoreAppear {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  60% { transform: translate(-50%, -50%) scale(1.4); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

.mn-core-inner {
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
  animation: mnCorePulse 5s ease-in-out 0.7s forwards;
  will-change: transform, opacity;
}

@keyframes mnCorePulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.85; }
}

.mn-core-pulse {
  position: absolute;
  inset: -50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(233, 30, 99, 0.3) 0%,
    rgba(171, 71, 188, 0.1) 50%,
    transparent 80%
  );
  animation: mnCorePulseRing 1s ease-out 0.7s forwards;
  will-change: transform, opacity;
  opacity: 0;
}

@keyframes mnCorePulseRing {
  0% { transform: scale(0.5); opacity: 0; }
  30% { opacity: 0.8; }
  100% { transform: scale(3); opacity: 0; }
}

/* 升腾光柱 - 从地面向上喷射的粉色光柱 */
.mn-pillar {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 30px;
  height: 300px;
  background: linear-gradient(to top,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(248, 187, 208, 0.7) 20%,
    rgba(233, 30, 99, 0.4) 50%,
    rgba(171, 71, 188, 0.1) 80%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(3px);
  box-shadow: 0 0 20px rgba(233, 30, 99, 0.6);
  transform: translate(-50%, -100%) scaleY(0);
  transform-origin: 50% 100%;
  animation: mnPillarRise 0.5s ease-out 0.35s forwards,
             mnPillarFade 1s ease-out 0.85s forwards;
  will-change: transform, opacity;
}

@keyframes mnPillarRise {
  0% { transform: translate(-50%, -100%) scaleY(0); }
  100% { transform: translate(-50%, -100%) scaleY(1); }
}

@keyframes mnPillarFade {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* ===== 阶段三：心爆扩散（0.7s ~ 1.6s）===== */

/* 多层冲击波 - 从中心向外扩散的粉色能量环 */
.mn-shockwave {
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

.mn-shockwave.sw-1 {
  border-width: 5px;
  animation: mnShockwave 1s cubic-bezier(0.05, 0.9, 0.25, 1) 0.7s forwards;
}

.mn-shockwave.sw-2 {
  border-width: 4px;
  border-color: rgba(171, 71, 188, 0.6);
  animation: mnShockwave 1.1s cubic-bezier(0.05, 0.9, 0.25, 1) 0.85s forwards;
}

.mn-shockwave.sw-3 {
  border-width: 3px;
  border-color: rgba(233, 30, 99, 0.5);
  animation: mnShockwave 1.2s cubic-bezier(0.05, 0.9, 0.25, 1) 1s forwards;
}

@keyframes mnShockwave {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  8% { opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(18); opacity: 0; }
}

/* 能量碎片 - 爆发的心灵碎片向外飞射 */
.mn-shard {
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
  transform: translate(-50%, -50%) rotate(var(--mn-shard-angle, 0deg)) translateX(0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: mnShardFly 0.9s ease-out 0.7s forwards;
}

@keyframes mnShardFly {
  0% {
    transform: translate(-50%, -50%) rotate(var(--mn-shard-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--mn-shard-angle, 0deg)) translateX(calc(var(--mn-shard-distance, 160px) * 0.15)) scale(1.2);
  }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--mn-shard-angle, 0deg) + 90deg)) translateX(var(--mn-shard-distance, 160px)) scale(0.2);
    opacity: 0;
  }
}

/* 旋转符文环 - 爆发的心灵符文环绕中心旋转扩散 */
.mn-rune-ring {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 0;
  height: 0;
  opacity: 0;
  animation: mnRuneRingContainer 1.2s ease-out 0.7s forwards;
  will-change: transform, opacity;
}

@keyframes mnRuneRingContainer {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3) rotate(0deg); }
  20% { opacity: 0.8; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5) rotate(120deg); }
}

.mn-rune {
  position: absolute;
  top: 0;
  left: 0;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: rgba(248, 187, 208, 0.8);
  box-shadow: 0 0 8px rgba(233, 30, 99, 0.6);
  transform: translate(-50%, -50%) rotate(var(--mn-rune-angle, 0deg)) translateX(100px);
  will-change: transform, opacity;
}

/* ===== 阶段四：余韵消散（1.6s ~ 2s）===== */

/* 消散余波 - 最后的旋转心灵场 */
.mn-dissipate {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 200px;
  height: 200px;
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
  animation: mnDissipate 0.5s ease-out 1.6s forwards;
}

.mn-dissipate::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 60deg,
    transparent 0deg,
    rgba(171, 71, 188, 0.08) 45deg,
    rgba(248, 187, 208, 0.12) 90deg,
    rgba(171, 71, 188, 0.08) 135deg,
    transparent 180deg,
    rgba(171, 71, 188, 0.08) 225deg,
    rgba(248, 187, 208, 0.12) 270deg,
    rgba(171, 71, 188, 0.08) 315deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 30%, black 50%, transparent 80%);
  mask: radial-gradient(circle, transparent 30%, black 50%, transparent 80%);
  will-change: transform;
  animation: mnSpinCCW 1.2s linear infinite;
}

@keyframes mnDissipate {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  20% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .mn-dim, .mn-flash, .mn-ground-circle, .mn-converge-particle,
  .mn-core, .mn-pillar, .mn-shockwave, .mn-shard,
  .mn-rune-ring, .mn-dissipate {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
