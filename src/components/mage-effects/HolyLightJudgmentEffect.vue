<!--
  @file HolyLightJudgmentEffect.vue
  @generated 2026-08-04
  @description 圣殿裁决 - 圣光降临·裁决法阵·光柱天降·范围爆发·余韵消散
  圣殿骑士U技能（AOE大地属性伤害）：将圣光之力注入重武器，对范围内敌人发动圣殿裁决斩击
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
  动画总时长：2.0秒
    ⓪ 圣光降临（0s ~ 0.5s）- 天空暗幕 + 圣光汇聚 + 地面法阵展开
    ① 裁决法阵（0.3s ~ 0.8s）- 三重法阵旋转 + 光柱凝聚 + 能量牵引
    ② 光柱天降（0.6s ~ 1.2s）- 多重圣光光柱 + 天降斩击 + 范围震击
    ③ 范围爆发（0.9s ~ 1.6s）- 中心爆发 + 冲击波扩散 + 圣光碎片飞散
    ④ 余韵消散（1.3s ~ 2.0s）- 圣光余波 + 残留法阵渐隐 + 圣粒上浮
  色彩方案：圣光金(#FFD54F) + 神圣白(#FFF8E1) + 盾甲蓝(#42A5F5) + 守护金(#FFC107)
-->
<template>
  <div class="hlj-3d-stage">
    <!-- ===== 阶段⓪：圣光降临 ===== -->
    <div class="hlj-dim"></div>
    <div class="hlj-sky-flash"></div>
    <div
      v-for="i in 10"
      :key="'hlj-descend-' + i"
      class="hlj-descend-particle"
      :style="getDescendStyle(i)"
    ></div>

    <!-- ===== 阶段①：裁决法阵 ===== -->
    <div class="hlj-ground-plane">
      <div class="hlj-magic-circle">
        <div class="hlj-circle-outer"></div>
        <div class="hlj-circle-mid"></div>
        <div class="hlj-circle-inner"></div>
      </div>
      <div class="hlj-ground-glow"></div>
    </div>

    <!-- ===== 阶段②：光柱天降 ===== -->
    <div
      v-for="i in 5"
      :key="'hlj-pillar-' + i"
      class="hlj-light-pillar"
      :style="getPillarStyle(i)"
    >
      <div class="hlj-pillar-core"></div>
      <div class="hlj-pillar-glow"></div>
    </div>
    <div class="hlj-strike-beam"></div>

    <!-- ===== 阶段③：范围爆发 ===== -->
    <div class="hlj-strike-flash"></div>
    <div class="hlj-burst-core"></div>
    <div class="hlj-shockwave-dome"></div>
    <div class="hlj-shockwave-ring ring-1"></div>
    <div class="hlj-shockwave-ring ring-2"></div>
    <div class="hlj-shockwave-ring ring-3"></div>
    <div
      v-for="i in 12"
      :key="'hlj-fragment-' + i"
      class="hlj-fragment"
      :style="getFragmentStyle(i)"
    ></div>

    <!-- ===== 阶段④：余韵消散 ===== -->
    <div
      v-for="i in 10"
      :key="'hlj-ember-' + i"
      class="hlj-ember"
      :style="getEmberStyle(i)"
    ></div>
    <div class="hlj-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 圣殿裁决 - 圣光降临·裁决法阵·光柱天降·范围爆发·余韵消散
 * 圣殿骑士U技能AOE特效组件，以圣光金和神圣白为主色调
 * 展现圣光之力注入重武器，对范围内敌人发动圣殿裁决斩击的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 */

/**
 * 生成天降圣光粒子的样式
 * @param {number} index - 粒子序号（1~10）
 * @returns {Object} CSS样式对象
 */
function getDescendStyle (index) {
  const angle = (index - 1) * 36
  const distance = 80 + (index % 3) * 30
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.03
  return {
    '--hlj-descend-angle': `${angle}deg`,
    '--hlj-descend-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成圣光光柱的位置样式
 * @param {number} index - 光柱序号（1~5）
 * @returns {Object} CSS样式对象
 */
function getPillarStyle (index) {
  const angle = (index - 1) * 72
  const distance = 40 + (index % 2) * 30
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance
  const delay = 0.6 + (index - 1) * 0.05
  return {
    '--hlj-pillar-tx': `${tx}px`,
    '--hlj-pillar-ty': `${ty}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成圣光碎片的飞溅样式
 * @param {number} index - 碎片序号（1~12）
 * @returns {Object} CSS样式对象
 */
function getFragmentStyle (index) {
  const angle = (index - 1) * 30
  const distance = 90 + (index % 4) * 30
  const size = 6 + (index % 3) * 4
  const delay = 0.9 + (index % 3) * 0.03
  return {
    '--hlj-frag-angle': `${angle}deg`,
    '--hlj-frag-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成圣光余烬的上浮样式
 * @param {number} index - 余烬序号（1~10）
 * @returns {Object} CSS样式对象
 */
function getEmberStyle (index) {
  const tx = (index % 2 === 0 ? 1 : -1) * (20 + (index % 5) * 15)
  const ty = -60 - (index % 4) * 20
  const size = 4 + (index % 3) * 2
  const delay = 1.3 + (index % 5) * 0.04
  return {
    '--hlj-ember-tx': `${tx}px`,
    '--hlj-ember-ty': `${ty}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   圣殿裁决 (holy_light_judgment) - 圣光降临·裁决法阵·光柱天降·范围爆发·余韵消散
   色彩方案：圣光金(#FFD54F) + 神圣白(#FFF8E1) + 盾甲蓝(#42A5F5) + 守护金(#FFC107)
   GPU加速：contain隔离 + will-change + translate3d
   动画总时长：2.0秒
   ================================================================ */

.hlj-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
}

/* ---------- 阶段⓪：圣光降临 ---------- */

.hlj-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 30%,
    rgba(35, 25, 3, 0.6) 0%,
    rgba(22, 16, 2, 0.4) 40%,
    rgba(12, 8, 1, 0.2) 70%,
    transparent 100%
  );
  animation: hljDim 2s ease-in-out forwards;
  will-change: opacity;
}

@keyframes hljDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  50% { opacity: 0.8; }
  100% { opacity: 0; }
}

.hlj-sky-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 20%,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 213, 79, 0.5) 15%,
    rgba(255, 193, 7, 0.2) 35%,
    transparent 60%
  );
  opacity: 0;
  animation: hljSkyFlash 0.6s ease-out forwards;
  will-change: opacity;
}

@keyframes hljSkyFlash {
  0% { opacity: 0; }
  10% { opacity: 1; }
  40% { opacity: 0.3; }
  100% { opacity: 0; }
}

.hlj-descend-particle {
  position: absolute;
  top: 10%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 248, 225, 0.9), rgba(255, 213, 79, 0.3));
  box-shadow: 0 0 6px rgba(255, 213, 79, 0.5);
  transform: translate(-50%, 0) rotate(var(--hlj-descend-angle, 0deg)) translateX(var(--hlj-descend-distance, 80px)) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: hljDescend 0.5s ease-in forwards;
}

@keyframes hljDescend {
  0% {
    transform: translate(-50%, 0) rotate(var(--hlj-descend-angle, 0deg)) translateX(var(--hlj-descend-distance, 80px)) scale(0);
    opacity: 0;
  }
  20% { opacity: 0.9; transform: translate(-50%, 0) rotate(var(--hlj-descend-angle, 0deg)) translateX(var(--hlj-descend-distance, 80px)) scale(1); }
  100% {
    transform: translate(-50%, 250px) rotate(var(--hlj-descend-angle, 0deg)) translateX(0) scale(0.3);
    opacity: 0;
  }
}

/* ---------- 阶段①：裁决法阵 ---------- */

.hlj-ground-plane {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 300px;
  height: 300px;
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: hljGroundPlane 0.5s ease-out 0.3s forwards;
  will-change: transform, opacity;
  transform-style: preserve-3d;
}

@keyframes hljGroundPlane {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  40% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1); opacity: 0.8; }
}

.hlj-magic-circle {
  position: absolute;
  inset: 0;
}

.hlj-circle-outer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid rgba(255, 213, 79, 0.6);
  box-shadow: 0 0 20px rgba(255, 213, 79, 0.4);
  animation: hljCircleRotate 4s linear infinite;
}

.hlj-circle-mid {
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  border: 2px solid rgba(255, 193, 7, 0.5);
  animation: hljCircleRotate 3s linear infinite reverse;
}

.hlj-circle-inner {
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  border: 2px solid rgba(66, 165, 245, 0.4);
  animation: hljCircleRotate 2s linear infinite;
}

@keyframes hljCircleRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.hlj-ground-glow {
  position: absolute;
  inset: 20%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 213, 79, 0.3) 0%,
    rgba(255, 193, 7, 0.15) 50%,
    transparent 80%
  );
  filter: blur(10px);
}

/* ---------- 阶段②：光柱天降 ---------- */

.hlj-light-pillar {
  position: absolute;
  top: 0;
  left: 50%;
  width: 30px;
  height: 100%;
  transform: translate3d(calc(-50% + var(--hlj-pillar-tx, 0px)), 0, 0) scaleY(0);
  transform-origin: top center;
  opacity: 0;
  will-change: transform, opacity;
  animation: hljPillarStrike 0.5s ease-out forwards;
}

@keyframes hljPillarStrike {
  0% { transform: translate3d(calc(-50% + var(--hlj-pillar-tx, 0px)), 0, 0) scaleY(0); opacity: 0; }
  20% { transform: translate3d(calc(-50% + var(--hlj-pillar-tx, 0px)), 0, 0) scaleY(1); opacity: 1; }
  60% { transform: translate3d(calc(-50% + var(--hlj-pillar-tx, 0px)), 0, 0) scaleY(1); opacity: 0.6; }
  100% { transform: translate3d(calc(-50% + var(--hlj-pillar-tx, 0px)), 0, 0) scaleY(1); opacity: 0; }
}

.hlj-pillar-core {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 248, 225, 0.9) 20%,
    rgba(255, 213, 79, 0.7) 50%,
    rgba(255, 193, 7, 0.4) 80%,
    rgba(100, 70, 3, 0.2) 100%
  );
  border-radius: 50% 50% 20% 20%;
  box-shadow:
    0 0 15px rgba(255, 213, 79, 0.8),
    0 0 30px rgba(255, 193, 7, 0.5);
}

.hlj-pillar-glow {
  position: absolute;
  inset: -15px -30px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 213, 79, 0.3) 0%,
    rgba(255, 193, 7, 0.15) 40%,
    transparent 70%
  );
  filter: blur(8px);
}

.hlj-strike-beam {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50px;
  height: 100%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: top center;
  opacity: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 248, 225, 0.8) 30%,
    rgba(255, 213, 79, 0.5) 60%,
    transparent 100%
  );
  filter: blur(5px);
  box-shadow: 0 0 30px rgba(255, 213, 79, 0.6);
  animation: hljStrikeBeam 0.6s ease-out 0.6s forwards;
  will-change: transform, opacity;
}

@keyframes hljStrikeBeam {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  15% { transform: translateX(-50%) scaleY(1); opacity: 1; }
  60% { transform: translateX(-50%) scaleY(1); opacity: 0.5; }
  100% { transform: translateX(-50%) scaleY(1); opacity: 0; }
}

/* ---------- 阶段③：范围爆发 ---------- */

.hlj-strike-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 213, 79, 0.5) 15%,
    rgba(255, 193, 7, 0.2) 40%,
    transparent 70%
  );
  opacity: 0;
  animation: hljStrikeFlash 0.5s ease-out 0.9s forwards;
  will-change: opacity;
}

@keyframes hljStrikeFlash {
  0% { opacity: 0; }
  10% { opacity: 1; }
  40% { opacity: 0.4; }
  100% { opacity: 0; }
}

.hlj-burst-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 213, 79, 0.85) 18%,
    rgba(255, 193, 7, 0.5) 42%,
    rgba(100, 70, 3, 0.2) 68%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: hljBurstCore 0.7s cubic-bezier(0.15, 0.6, 0.3, 1) 0.9s forwards;
  will-change: transform, opacity;
  filter: blur(4px);
}

@keyframes hljBurstCore {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  12% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  50% { transform: translate3d(-50%, -50%, 0) scale(2.5); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(4); opacity: 0; }
}

.hlj-shockwave-dome {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 350px;
  height: 350px;
  border-radius: 50%;
  border: 5px solid rgba(255, 213, 79, 0.5);
  box-shadow: 0 0 40px rgba(255, 213, 79, 0.4), inset 0 0 30px rgba(255, 193, 7, 0.2);
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  animation: hljShockwaveDome 0.6s cubic-bezier(0.2, 0.6, 0.3, 1) 0.9s forwards;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

@keyframes hljShockwaveDome {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0.8); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(3.5); opacity: 0; }
}

.hlj-shockwave-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(255, 213, 79, 0.8);
  box-shadow: 0 0 20px rgba(255, 213, 79, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.hlj-shockwave-ring.ring-1 { animation: hljShockwaveRing 0.6s ease-out 0.9s forwards; }
.hlj-shockwave-ring.ring-2 {
  border-color: rgba(255, 193, 7, 0.6);
  animation: hljShockwaveRing 0.65s ease-out 0.95s forwards;
}
.hlj-shockwave-ring.ring-3 {
  border-color: rgba(66, 165, 245, 0.5);
  animation: hljShockwaveRing 0.7s ease-out 1s forwards;
}

@keyframes hljShockwaveRing {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  12% { opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(16); opacity: 0; }
}

.hlj-fragment {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95), rgba(255, 213, 79, 0.6), transparent);
  box-shadow: 0 0 8px rgba(255, 213, 79, 0.6);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: hljFragmentScatter 0.7s cubic-bezier(0.2, 0.5, 0.4, 1) 0.9s forwards;
  will-change: transform, opacity;
  opacity: 0;
}

@keyframes hljFragmentScatter {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--hlj-frag-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--hlj-frag-angle, 0deg)) translateX(15px) scale(1.4);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--hlj-frag-angle, 0deg)) translateX(var(--hlj-frag-distance, 100px)) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段④：余韵消散 ---------- */

.hlj-ember {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 213, 79, 0.9), rgba(255, 193, 7, 0.4), transparent);
  box-shadow: 0 0 6px rgba(255, 213, 79, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: hljEmberFloat 1.2s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes hljEmberFloat {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% {
    transform: translate3d(calc(-50% + var(--hlj-ember-tx, 0px) * 0.2), calc(-50% + var(--hlj-ember-ty, 0px) * 0.2), 0) scale(1.2);
    opacity: 1;
  }
  80% { opacity: 0.4; }
  100% {
    transform: translate3d(calc(-50% + var(--hlj-ember-tx, 0px)), calc(-50% + var(--hlj-ember-ty, 0px)), 0) scale(0.2);
    opacity: 0;
  }
}

.hlj-afterglow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 213, 79, 0.2) 0%,
    rgba(255, 193, 7, 0.08) 40%,
    transparent 70%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: hljAfterglow 1s ease-out 1.3s forwards;
  will-change: transform, opacity;
}

@keyframes hljAfterglow {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  25% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 0.5; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2.2); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .hlj-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
