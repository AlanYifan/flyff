<!--
  @file HolyShieldBashEffect.vue
  @generated 2026-08-04
  @description 荣耀之剑 - 圣光凝聚·圣剑成形·荣耀斩击·圣光爆发·余韵消散
  圣殿骑士W技能（单体大地属性伤害）：将圣光之力凝聚为荣耀之剑，锁定单一敌人发起荣耀斩击
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
  动画总时长：1.8秒（显示1.4秒 + 渐隐消散0.4秒）
    ⓪ 圣光凝聚（0s ~ 0.4s）- 圣光向中心汇聚 + 地面圣印龟裂 + 光球蓄能
    ① 盾牌成形（0.25s ~ 0.6s）- 圣光盾牌成形 + 光柱升腾 + 能量凝聚
    ② 冲锋突进（0.5s ~ 0.9s）- 盾牌冲锋轨迹 + 圣光拖尾 + 突进闪光
    ③ 圣光爆发（0.7s ~ 1.3s）- 中心能量爆发 + 冲击波环 + 圣光碎片飞溅
    ④ 余韵消散（1.1s ~ 1.8s）- 余波消散 + 残留圣痕渐隐 + 圣光上浮
  色彩方案：圣光金(#FFD54F) + 神圣白(#FFF8E1) + 盾甲蓝(#42A5F5) + 守护金(#FFC107)
-->
<template>
  <div class="hsb-3d-stage">
    <!-- ===== 阶段⓪：圣光凝聚 ===== -->
    <div class="hsb-holy-dim"></div>
    <div
      v-for="i in 3"
      :key="'hsb-seal-' + i"
      class="hsb-ground-seal"
      :style="getSealStyle(i)"
    ></div>
    <div
      v-for="i in 12"
      :key="'hsb-inhale-' + i"
      class="hsb-inhale-particle"
      :style="getInhaleStyle(i)"
    ></div>
    <div class="hsb-orb-charge"></div>

    <!-- ===== 阶段①：盾牌成形 ===== -->
    <div class="hsb-energy-pillar"></div>
    <div class="hsb-shape-shield">
      <div class="hsb-shield-body"></div>
      <div class="hsb-shield-glow"></div>
    </div>

    <!-- ===== 阶段②：冲锋突进 ===== -->
    <div class="hsb-charge-trail trail-1"></div>
    <div class="hsb-charge-trail trail-2"></div>
    <div class="hsb-charge-flash"></div>

    <!-- ===== 阶段③：圣光爆发 ===== -->
    <div class="hsb-strike-flash"></div>
    <div class="hsb-burst-core"></div>
    <div class="hsb-shockwave-dome"></div>
    <div class="hsb-shockwave-ring ring-1"></div>
    <div class="hsb-shockwave-ring ring-2"></div>
    <div class="hsb-shockwave-ring ring-3"></div>
    <div
      v-for="i in 10"
      :key="'hsb-shard-' + i"
      class="hsb-shard"
      :style="getShardStyle(i)"
    >
      <div class="hsb-shard-head"></div>
      <div class="hsb-shard-trail"></div>
    </div>
    <div
      v-for="i in 12"
      :key="'hsb-spark-' + i"
      class="hsb-spark"
      :style="getSparkStyle(i)"
    ></div>

    <!-- ===== 阶段④：余韵消散 ===== -->
    <div
      v-for="i in 8"
      :key="'hsb-ember-' + i"
      class="hsb-ember"
      :style="getEmberStyle(i)"
    ></div>
    <div class="hsb-residual-shield"></div>
    <div class="hsb-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 荣耀之剑 - 圣光凝聚·圣剑成形·荣耀斩击·圣光爆发·余韵消散
 * 圣殿骑士W技能特效组件，以圣光金和神圣白为主色调
 * 展现将圣光之力凝聚为荣耀之剑，锁定单一敌人发起荣耀斩击的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 */

/**
 * 生成地面圣印龟裂的位置样式
 * @param {number} index - 圣印点序号（1~3）
 * @returns {Object} CSS样式对象，含水平/垂直偏移
 */
function getSealStyle (index) {
  const angle = (index - 1) * 120 - 90
  const radius = 50
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * radius
  const ty = Math.sin(rad) * radius
  return {
    '--hsb-seal-tx': `${tx}px`,
    '--hsb-seal-ty': `${ty}px`
  }
}

/**
 * 生成圣光汇聚粒子的样式
 * @param {number} index - 粒子序号（1~12）
 * @returns {Object} CSS样式对象，含角度、距离、尺寸、延迟
 */
function getInhaleStyle (index) {
  const angle = (index - 1) * 30
  const distance = 120 + (index % 4) * 16
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.02
  return {
    '--hsb-inhale-angle': `${angle}deg`,
    '--hsb-inhale-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成圣光碎片的3D飞溅样式
 * @param {number} index - 碎片序号（1~10）
 * @returns {Object} CSS样式对象
 */
function getShardStyle (index) {
  const angle = (index - 1) * 36
  const distance = 110 + (index % 4) * 35
  const size = 24 + (index % 3) * 10
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const depth = depthDir * (40 + (index % 2) * 30)
  const arc = 20 + (index % 4) * 15
  const delay = 0.7 + (index % 3) * 0.03
  return {
    '--hsb-shard-angle': `${angle}deg`,
    '--hsb-shard-distance': `${distance}px`,
    '--hsb-shard-size': `${size}px`,
    '--hsb-shard-depth': `${depth}px`,
    '--hsb-shard-arc': `${arc}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成圣光火星的3D飞溅样式
 * @param {number} index - 火星序号（1~12）
 * @returns {Object} CSS样式对象
 */
function getSparkStyle (index) {
  const angle = (index - 1) * 30 + (index % 2) * 8
  const distance = 55 + (index % 5) * 22
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 12 - (index % 3) * 8
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const tz = depthDir * (30 + (index % 2) * 18)
  const size = 5 + (index % 4) * 3
  const delay = 0.68 + (index % 5) * 0.02
  return {
    '--hsb-spark-tx': `${tx}px`,
    '--hsb-spark-ty': `${ty}px`,
    '--hsb-spark-tz': `${tz}px`,
    '--hsb-spark-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成圣光余烬的上浮样式
 * @param {number} index - 余烬序号（1~8）
 * @returns {Object} CSS样式对象
 */
function getEmberStyle (index) {
  const tx = (index % 2 === 0 ? 1 : -1) * (18 + (index % 4) * 12)
  const ty = -50 - (index % 3) * 25
  const size = 4 + (index % 3) * 2
  const delay = 0.75 + (index % 4) * 0.05
  return {
    '--hsb-ember-tx': `${tx}px`,
    '--hsb-ember-ty': `${ty}px`,
    '--hsb-ember-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   荣耀之剑 (holy_shield_bash) - 圣光凝聚·圣剑成形·荣耀斩击·圣光爆发·余韵消散
   色彩方案：圣光金(#FFD54F) + 神圣白(#FFF8E1) + 盾甲蓝(#42A5F5) + 守护金(#FFC107)
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   动画总时长：1.8秒
   ================================================================ */

.hsb-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
}

/* ---------- 阶段⓪：圣光凝聚 ---------- */

.hsb-holy-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(35, 25, 3, 0.55) 0%,
    rgba(22, 16, 2, 0.35) 40%,
    rgba(12, 8, 1, 0.15) 70%,
    transparent 100%
  );
  animation: hsbHolyDim 1.8s ease-in-out forwards;
  will-change: opacity;
}

@keyframes hsbHolyDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  60% { opacity: 0.8; }
  100% { opacity: 0; }
}

.hsb-ground-seal {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70px;
  height: 70px;
  transform: translate(-50%, -50%) translate(var(--hsb-seal-tx, 0), var(--hsb-seal-ty, 0)) scale(0);
  opacity: 0;
  animation: hsbGroundSeal 0.4s ease-out forwards;
  will-change: transform, opacity;
}

.hsb-ground-seal::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 213, 79, 0.4) 2deg,
    transparent 4deg,
    transparent 42deg,
    rgba(255, 193, 7, 0.3) 44deg,
    transparent 46deg,
    transparent 88deg,
    rgba(255, 213, 79, 0.4) 90deg,
    transparent 92deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 20%, black 30%, transparent 80%);
  mask: radial-gradient(circle, transparent 20%, black 30%, transparent 80%);
}

.hsb-ground-seal::after {
  content: '';
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255, 248, 225, 0.5) 0%,
    rgba(255, 213, 79, 0.2) 50%,
    transparent 80%
  );
}

@keyframes hsbGroundSeal {
  0% { transform: translate(-50%, -50%) translate(var(--hsb-seal-tx, 0), var(--hsb-seal-ty, 0)) scale(0); opacity: 0; }
  30% { transform: translate(-50%, -50%) translate(var(--hsb-seal-tx, 0), var(--hsb-seal-ty, 0)) scale(0.8); opacity: 1; }
  100% { transform: translate(-50%, -50%) translate(var(--hsb-seal-tx, 0), var(--hsb-seal-ty, 0)) scale(1.3); opacity: 0; }
}

.hsb-inhale-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 248, 225, 0.9), rgba(255, 193, 7, 0.2));
  box-shadow: 0 0 6px rgba(255, 213, 79, 0.5);
  transform: translate(-50%, -50%) rotate(var(--hsb-inhale-angle, 0deg)) translateX(var(--hsb-inhale-distance, 80px)) scale(1);
  opacity: 0;
  will-change: transform, opacity;
  animation: hsbInhale 0.4s ease-in forwards;
}

@keyframes hsbInhale {
  0% {
    transform: translate(-50%, -50%) rotate(var(--hsb-inhale-angle, 0deg)) translateX(var(--hsb-inhale-distance, 80px)) scale(1);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--hsb-inhale-angle, 0deg) + 180deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

.hsb-orb-charge {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 248, 225, 0.7) 25%,
    rgba(255, 213, 79, 0.4) 55%,
    transparent 90%
  );
  box-shadow: 0 0 20px rgba(255, 213, 79, 0.7), 0 0 40px rgba(255, 193, 7, 0.4);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  animation: hsbOrbCharge 0.45s ease-in forwards;
  will-change: transform, opacity;
}

@keyframes hsbOrbCharge {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  30% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.9; }
  60% { transform: translate(-50%, -50%) scale(0.7); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}

/* ---------- 阶段①：盾牌成形 ---------- */

.hsb-energy-pillar {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 200px;
  background: linear-gradient(to top,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 248, 225, 0.7) 30%,
    rgba(255, 213, 79, 0.4) 60%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(2px);
  box-shadow: 0 0 20px rgba(255, 213, 79, 0.6);
  transform: translate(-50%, -100%) scaleX(0.3) scaleY(0);
  opacity: 0;
  animation: hsbEnergyPillar 0.6s ease-out 0.25s forwards;
  will-change: transform, opacity;
}

@keyframes hsbEnergyPillar {
  0% { transform: translate(-50%, -100%) scaleX(0.3) scaleY(0); opacity: 0; }
  20% { transform: translate(-50%, -100%) scaleX(1) scaleY(1); opacity: 1; }
  60% { transform: translate(-50%, -100%) scaleX(1) scaleY(1); opacity: 0.7; }
  100% { transform: translate(-50%, -100%) scaleX(0.5) scaleY(1.2); opacity: 0; }
}

.hsb-shape-shield {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 120px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: hsbShieldForm 0.35s ease-out 0.3s forwards;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

@keyframes hsbShieldForm {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(-10deg); opacity: 0; }
  40% { transform: translate3d(-50%, -50%, 0) scale(1.1) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.9; }
}

.hsb-shield-body {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 213, 79, 0.3) 0%,
    rgba(255, 248, 225, 0.8) 30%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(255, 248, 225, 0.8) 70%,
    rgba(255, 213, 79, 0.3) 100%
  );
  clip-path: polygon(50% 0%, 90% 20%, 100% 50%, 90% 80%, 50% 100%, 10% 80%, 0% 50%, 10% 20%);
  box-shadow:
    0 0 20px rgba(255, 213, 79, 0.8),
    0 0 40px rgba(255, 193, 7, 0.4);
}

.hsb-shield-glow {
  position: absolute;
  inset: -15px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 213, 79, 0.3) 0%,
    rgba(255, 193, 7, 0.15) 40%,
    transparent 70%
  );
  filter: blur(8px);
}

/* ---------- 阶段②：冲锋突进 ---------- */

.hsb-charge-trail {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 180px;
  height: 8px;
  border-radius: 4px;
  transform: translate3d(-50%, -50%, 0) scaleX(0);
  will-change: transform, opacity;
  opacity: 0;
  backface-visibility: hidden;
}

.hsb-charge-trail.trail-1 {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 213, 79, 0.9) 15%,
    rgba(255, 255, 255, 1) 50%,
    rgba(255, 213, 79, 0.9) 85%,
    transparent 100%
  );
  box-shadow: 0 0 15px rgba(255, 213, 79, 0.8), 0 0 30px rgba(255, 193, 7, 0.5);
  animation: hsbChargeTrail1 0.35s cubic-bezier(0.2, 0.6, 0.3, 1) 0.5s forwards;
}

.hsb-charge-trail.trail-2 {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(66, 165, 245, 0.7) 15%,
    rgba(255, 248, 225, 0.9) 50%,
    rgba(66, 165, 245, 0.7) 85%,
    transparent 100%
  );
  box-shadow: 0 0 12px rgba(66, 165, 245, 0.6);
  animation: hsbChargeTrail2 0.35s cubic-bezier(0.2, 0.6, 0.3, 1) 0.52s forwards;
}

@keyframes hsbChargeTrail1 {
  0% { transform: translate3d(-50%, -50%, 0) rotate(20deg) scaleX(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) rotate(20deg) scaleX(1.3); opacity: 1; }
  60% { transform: translate3d(-50%, -50%, 0) rotate(20deg) scaleX(1); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) rotate(20deg) scaleX(1.5); opacity: 0; }
}

@keyframes hsbChargeTrail2 {
  0% { transform: translate3d(-50%, -50%, 0) rotate(-20deg) scaleX(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) rotate(-20deg) scaleX(1.3); opacity: 1; }
  60% { transform: translate3d(-50%, -50%, 0) rotate(-20deg) scaleX(1); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) rotate(-20deg) scaleX(1.5); opacity: 0; }
}

.hsb-charge-flash {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    115deg,
    transparent 30%,
    rgba(255, 248, 225, 0.25) 45%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 248, 225, 0.25) 55%,
    transparent 70%
  );
  opacity: 0;
  animation: hsbChargeFlash 0.3s ease-out 0.55s forwards;
  will-change: opacity;
}

@keyframes hsbChargeFlash {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

/* ---------- 阶段③：圣光爆发 ---------- */

.hsb-strike-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 213, 79, 0.6) 12%,
    rgba(255, 193, 7, 0.3) 35%,
    rgba(100, 70, 3, 0.1) 60%,
    transparent 100%
  );
  opacity: 0;
  animation: hsbStrikeFlash 0.5s ease-out 0.7s forwards;
  will-change: opacity;
}

@keyframes hsbStrikeFlash {
  0% { opacity: 0; }
  8% { opacity: 1; }
  30% { opacity: 0.5; }
  100% { opacity: 0; }
}

.hsb-burst-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 213, 79, 0.85) 18%,
    rgba(255, 193, 7, 0.6) 42%,
    rgba(100, 70, 3, 0.3) 68%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: hsbBurstCore 0.6s cubic-bezier(0.15, 0.6, 0.3, 1) 0.7s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}

@keyframes hsbBurstCore {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  12% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 1; }
  50% { transform: translate3d(-50%, -50%, 0) scale(2.2); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3.5); opacity: 0; }
}

.hsb-shockwave-dome {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  border: 5px solid rgba(255, 213, 79, 0.6);
  box-shadow:
    0 0 40px rgba(255, 213, 79, 0.5),
    inset 0 0 30px rgba(255, 193, 7, 0.3);
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  animation: hsbShockwaveDome 0.55s cubic-bezier(0.2, 0.6, 0.3, 1) 0.7s forwards;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

@keyframes hsbShockwaveDome {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0.8); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(3.5); opacity: 0; }
}

.hsb-shockwave-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(255, 213, 79, 0.85);
  box-shadow:
    0 0 20px rgba(255, 213, 79, 0.6),
    inset 0 0 16px rgba(255, 193, 7, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.hsb-shockwave-ring.ring-1 { animation: hsbShockwaveRing 0.5s ease-out 0.7s forwards; }
.hsb-shockwave-ring.ring-2 {
  border-color: rgba(255, 193, 7, 0.7);
  animation: hsbShockwaveRing 0.55s ease-out 0.74s forwards;
}
.hsb-shockwave-ring.ring-3 {
  border-color: rgba(66, 165, 245, 0.5);
  animation: hsbShockwaveRing 0.6s ease-out 0.78s forwards;
}

@keyframes hsbShockwaveRing {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  12% { opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(14); opacity: 0; }
}

.hsb-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--hsb-shard-size, 30px);
  height: var(--hsb-shard-size, 30px);
  transform: translate3d(-50%, -50%, 0) rotate(var(--hsb-shard-angle, 0deg));
  animation: hsbShardScatter3D 0.7s cubic-bezier(0.2, 0.5, 0.4, 1) 0.7s forwards;
  will-change: transform, opacity;
  opacity: 0;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

@keyframes hsbShardScatter3D {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--hsb-shard-angle, 0deg)) translateX(0) translateZ(0) translateY(0) scale(0.5);
    opacity: 0;
  }
  10% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--hsb-shard-angle, 0deg)) translateX(12px) translateZ(var(--hsb-shard-depth, 0px)) translateY(calc(var(--hsb-shard-arc, 0px) * -0.5)) scale(1.3);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--hsb-shard-angle, 0deg)) translateX(calc(var(--hsb-shard-distance, 100px) * 0.6)) translateZ(var(--hsb-shard-depth, 0px)) translateY(calc(var(--hsb-shard-arc, 0px) * -1)) scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--hsb-shard-angle, 0deg)) translateX(var(--hsb-shard-distance, 100px)) translateZ(var(--hsb-shard-depth, 0px)) translateY(0) scale(0.3);
    opacity: 0;
  }
}

.hsb-shard-head {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 40% 40%,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(255, 248, 225, 0.85) 25%,
    rgba(255, 213, 79, 0.75) 60%,
    rgba(255, 193, 7, 0.4) 100%
  );
  clip-path: polygon(50% 0%, 80% 30%, 100% 50%, 80% 70%, 50% 100%, 20% 70%, 0% 50%, 20% 30%);
  box-shadow:
    0 0 18px rgba(255, 213, 79, 0.8),
    0 0 35px rgba(255, 193, 7, 0.4);
}

.hsb-shard-trail {
  position: absolute;
  top: 50%;
  right: 75%;
  width: 50px;
  height: 55%;
  transform: translateY(-50%);
  background: linear-gradient(
    to left,
    rgba(255, 213, 79, 0.6) 0%,
    rgba(255, 193, 7, 0.3) 50%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(5px);
}

.hsb-spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--hsb-spark-size, 6px);
  height: var(--hsb-spark-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(255, 248, 225, 0.7) 45%,
    rgba(255, 213, 79, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(255, 213, 79, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: hsbSparkFly3D 0.6s ease-out 0.7s forwards;
  will-change: transform, opacity;
}

@keyframes hsbSparkFly3D {
  0% {
    transform: translate3d(-50%, -50%, 0) translateZ(0) scale(0);
    opacity: 0;
  }
  12% {
    transform: translate3d(-50%, -50%, 0) translateZ(0) scale(1.4);
    opacity: 1;
  }
  100% {
    transform: translate3d(calc(-50% + var(--hsb-spark-tx, 0px)), calc(-50% + var(--hsb-spark-ty, 0px)), var(--hsb-spark-tz, 0px)) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段④：余韵消散 ---------- */

.hsb-ember {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--hsb-ember-size, 6px);
  height: var(--hsb-ember-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 213, 79, 0.9) 0%,
    rgba(255, 193, 7, 0.5) 50%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(255, 213, 79, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: hsbEmberFloat 1s ease-out 0.75s forwards;
  will-change: transform, opacity;
}

@keyframes hsbEmberFloat {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% {
    transform: translate3d(calc(-50% + var(--hsb-ember-tx, 0px) * 0.2), calc(-50% + var(--hsb-ember-ty, 0px) * 0.2), 0) scale(1.2);
    opacity: 1;
  }
  80% { opacity: 0.5; }
  100% {
    transform: translate3d(calc(-50% + var(--hsb-ember-tx, 0px)), calc(-50% + var(--hsb-ember-ty, 0px)), 0) scale(0.2);
    opacity: 0;
  }
}

.hsb-residual-shield {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 213, 79, 0.5) 20%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(255, 213, 79, 0.5) 80%,
    transparent 100%
  );
  box-shadow: 0 0 12px rgba(255, 213, 79, 0.4);
  transform: translate3d(-50%, -50%, 0) rotate(20deg) scaleX(0);
  opacity: 0;
  animation: hsbResidualShield 1s ease-out 1.1s forwards;
  will-change: transform, opacity;
}

@keyframes hsbResidualShield {
  0% { transform: translate3d(-50%, -50%, 0) rotate(20deg) scaleX(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) rotate(20deg) scaleX(1.2); opacity: 0.7; }
  60% { transform: translate3d(-50%, -50%, 0) rotate(20deg) scaleX(1); opacity: 0.3; }
  100% { transform: translate3d(-50%, -50%, 0) rotate(20deg) scaleX(1.4); opacity: 0; }
}

.hsb-afterglow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50%;
  height: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 213, 79, 0.25) 0%,
    rgba(255, 193, 7, 0.1) 40%,
    transparent 70%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: hsbAfterglow 0.9s ease-out 1.1s forwards;
  will-change: transform, opacity;
}

@keyframes hsbAfterglow {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  25% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .hsb-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
