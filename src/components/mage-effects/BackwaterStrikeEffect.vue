<!--
  @file BackwaterStrikeEffect.vue
  @generated 2026-07-06
  @description 背水一击 - 蓝能枯竭·斗气汇聚·能量凝缩·致命贯穿·余波消散
  技师E技能（technician_e）：消耗当前100%的MP，对敌人造成致命一击
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + translateZ深度分层 + rotateX地面倾斜
  动画总时长：1.2秒
    ⓪ 蓝能枯竭（0s ~ 0.35s）- 暗幕降临 + 蓝色法阵 + 16粒子螺旋汇聚 + 蓝能漩涡成形
    ① 能量凝缩（0.3s ~ 0.6s）- 漩涡压缩为致密能量球 + 能量脊柱脉动 + 蓄力光冠扩散
    ② 致命贯穿（0.55s ~ 0.9s）- 贯穿光柱直劈目标 + 蓝白爆闪 + 3层冲击波环 + 地面裂纹
    ③ 余波消散（0.8s ~ 1.2s）- 16块能量碎片3D飞溅 + 蓝辉余韵消散
  色彩方案：魔力蓝(#0080FF) + 苍蓝辉光(#00DDFF) + 纯白(#FFFFFF) + 深蓝暗(#0A0033)
-->
<template>
  <!-- 3D舞台 - 透视容器，为能量贯穿与碎片飞溅提供深度视角 -->
  <div class="bws-3d-stage">
    <!-- ===== 阶段⓪：蓝能枯竭·斗气汇聚 ===== -->
    <!-- 暗幕 - 深蓝覆盖，魔力正在被抽离，背水之势将成 -->
    <div class="bws-dim"></div>

    <!-- 蓝色法阵 - 地面旋转的蓝色魔力召唤阵 -->
    <div class="bws-rune"></div>

    <!-- 魔力汇聚粒子 - 从四周螺旋汇聚至中心，象征全部MP被抽离 -->
    <div
      v-for="i in 16"
      :key="'bws-gather-' + i"
      class="bws-gather-particle"
      :style="getGatherStyle(i)"
    ></div>

    <!-- 蓝能漩涡 - 中心成形的蓝色能量螺旋 -->
    <div class="bws-vortex">
      <div
        v-for="i in 8"
        :key="'bws-vortex-ring-' + i"
        class="bws-vortex-ring"
        :style="getVortexRingStyle(i)"
      ></div>
    </div>

    <!-- ===== 阶段①：能量凝缩 ===== -->
    <!-- 致密能量球 - 漩涡压缩后的高密度蓝色能量核心 -->
    <div class="bws-core-orb"></div>

    <!-- 能量脊柱 - 中心脉动的蓝色光柱 -->
    <div class="bws-spine"></div>

    <!-- 蓄力光冠 - 能量球顶端扩散的蓄力能量盘 -->
    <div class="bws-charge-crown">
      <div class="bws-crown-layer bws-crown-1"></div>
      <div class="bws-crown-layer bws-crown-2"></div>
    </div>

    <!-- ===== 阶段②：致命贯穿 ===== -->
    <!-- 蓝白爆闪 - 致命一击瞬间的蓝白全屏爆闪 -->
    <div class="bws-impact-flash"></div>

    <!-- 贯穿光柱外层光晕 - 包裹贯穿光柱的巨大蓝色发光层 -->
    <div class="bws-pierce-glow"></div>

    <!-- 贯穿光柱主体 - 粗壮蓝白光柱直劈目标 -->
    <div class="bws-pierce-main"></div>

    <!-- 贯穿光柱核心 - 中心纯白高亮核心 -->
    <div class="bws-pierce-core"></div>

    <!-- 3层冲击波环 - 从中心向外扩散 -->
    <div class="bws-shockwave-ring ring-1"></div>
    <div class="bws-shockwave-ring ring-2"></div>
    <div class="bws-shockwave-ring ring-3"></div>

    <!-- 地面裂纹 - 撞击点扩散的蓝色裂纹 -->
    <div class="bws-ground-crack"></div>

    <!-- ===== 阶段③：余波消散 ===== -->
    <!-- 能量碎片 - 从撞击点向外3D飞溅 -->
    <div
      v-for="i in 16"
      :key="'bws-shard-' + i"
      class="bws-shard"
      :style="getShardStyle(i)"
    ></div>

    <!-- 蓝辉余韵 - 最后的能量消散 -->
    <div class="bws-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 背水一击 - 蓝能枯竭·斗气汇聚·能量凝缩·致命贯穿·余波消散
 * 技师E技能（technician_e）单体致命一击特效组件，以魔力蓝和苍蓝辉光为主色调
 * 展现消耗全部MP凝聚为致密能量球、以贯穿光柱直劈目标造成致命一击的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 * 动画总时长1.2秒
 */

/**
 * 生成魔力汇聚粒子的样式
 * 16颗蓝色魔力粒子从四周螺旋汇聚至中心，象征全部MP被抽离
 * @param {number} index - 粒子序号（1~16）
 * @returns {Object} CSS样式对象，含角度、距离、尺寸、延迟
 */
function getGatherStyle (index) {
  const angle = (index - 1) * 22.5 + (index % 2) * 7
  const distance = 140 + (index % 4) * 22
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.006
  return {
    '--bws-gather-angle': `${angle}deg`,
    '--bws-gather-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成蓝能漩涡环的样式
 * 8层椭圆能量环自底向上递增旋转，形成螺旋上升的蓝色能量漩涡
 * @param {number} index - 漩涡环序号（1~8）
 * @returns {Object} CSS样式对象，含垂直偏移、缩放、旋转方向、延迟
 */
function getVortexRingStyle (index) {
  const yOffset = (index - 1) * 16 - 30
  const scale = 0.4 + (index - 1) * 0.14
  const spinDir = index % 2 === 0 ? 'bwsSpinCW' : 'bwsSpinCCW'
  const delay = (index - 1) * 0.012
  return {
    '--bws-vortex-y': `${yOffset}px`,
    '--bws-vortex-scale': scale,
    animationName: spinDir,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成能量碎片的3D飞溅样式
 * 16块能量碎片从撞击点向外3D飞溅，含Z轴深度变化
 * @param {number} index - 碎片序号（1~16）
 * @returns {Object} CSS样式对象，含飞溅角度、距离、Z轴深度、尺寸、延迟
 */
function getShardStyle (index) {
  const angle = (index - 1) * 22.5 + (index % 2) * 8
  const distance = 70 + (index % 5) * 24
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 15 - (index % 3) * 8
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const tz = depthDir * (35 + (index % 2) * 20)
  const size = 5 + (index % 4) * 4
  const delay = 0.8 + (index % 4) * 0.02
  return {
    '--bws-shard-tx': `${tx}px`,
    '--bws-shard-ty': `${ty}px`,
    '--bws-shard-tz': `${tz}px`,
    '--bws-shard-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   背水一击 (backwater_strike) - 蓝能枯竭·斗气汇聚·能量凝缩·致命贯穿·余波消散
   技能描述：消耗当前100%的MP，对敌人造成致命一击
   3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：1.2秒
     ⓪ 蓝能枯竭（0s ~ 0.35s）- 暗幕降临 + 蓝色法阵 + 16粒子螺旋汇聚 + 蓝能漩涡
     ① 能量凝缩（0.3s ~ 0.6s）- 致密能量球 + 能量脊柱 + 蓄力光冠
     ② 致命贯穿（0.55s ~ 0.9s）- 贯穿光柱直劈 + 蓝白爆闪 + 3层冲击波 + 地面裂纹
     ③ 余波消散（0.8s ~ 1.2s）- 16块能量碎片3D飞溅 + 蓝辉余韵消散
   ================================================================ */

/* 3D舞台 - 透视容器，为能量贯穿与碎片飞溅提供深度视角 */
.bws-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 40%;
  transform-style: preserve-3d;
  contain: layout style;
  pointer-events: none;
}

/* ---------- 阶段⓪：蓝能枯竭·斗气汇聚（0s ~ 0.35s）---------- */

/* 暗幕 - 深蓝覆盖，魔力正在被抽离，背水之势将成 */
.bws-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 45%,
    rgba(10, 0, 51, 0.5) 0%,
    rgba(5, 0, 30, 0.35) 50%,
    transparent 100%
  );
  animation: bwsDim 1.2s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes bwsDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  35% { opacity: 0.8; }
  65% { opacity: 0.4; }
  85% { opacity: 0.15; }
  100% { opacity: 0; }
}

/* 蓝色法阵 - 地面旋转的蓝色魔力召唤阵 */
.bws-rune {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 300px;
  height: 300px;
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: bwsRuneIn 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) forwards,
             bwsRuneFade 0.4s ease-out 0.35s forwards;
  will-change: transform, opacity;
  z-index: 2;
}

.bws-rune::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(0, 128, 255, 0.35) 25deg,
    rgba(0, 221, 255, 0.55) 50deg,
    rgba(0, 128, 255, 0.35) 75deg,
    transparent 120deg,
    rgba(0, 100, 200, 0.3) 180deg,
    rgba(0, 200, 255, 0.45) 210deg,
    rgba(0, 100, 200, 0.3) 240deg,
    transparent 270deg,
    rgba(0, 128, 255, 0.35) 330deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 25%, black 45%, transparent 80%);
  mask: radial-gradient(circle, transparent 25%, black 45%, transparent 80%);
  box-shadow: 0 0 30px rgba(0, 128, 255, 0.35);
  will-change: transform;
  animation: bwsSpinCW 0.5s linear infinite;
}

@keyframes bwsSpinCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes bwsSpinCCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
}

@keyframes bwsRuneIn {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1.15); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1); opacity: 0.9; }
}

@keyframes bwsRuneFade {
  0% { opacity: 0.9; }
  100% { opacity: 0; }
}

/* 魔力汇聚粒子 - 从四周螺旋汇聚至中心，象征全部MP被抽离 */
.bws-gather-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(0, 221, 255, 0.75) 50%,
    rgba(0, 128, 255, 0.35) 100%
  );
  box-shadow: 0 0 6px rgba(0, 170, 255, 0.7);
  opacity: 0;
  animation: bwsGather 0.35s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes bwsGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--bws-gather-angle, 0deg)) translateX(var(--bws-gather-distance, 140px)) scale(1);
    opacity: 0;
  }
  25% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--bws-gather-angle, 0deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* 蓝能漩涡 - 中心成形的蓝色能量螺旋 */
.bws-vortex {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  transform: translate3d(-50%, -50%, 0);
  opacity: 0;
  animation: bwsVortexContainer 0.35s ease-out forwards,
             bwsVortexFade 0.2s ease-out 0.35s forwards;
  will-change: opacity;
  z-index: 5;
}

@keyframes bwsVortexContainer {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes bwsVortexFade {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* 漩涡环 - 每层为一个旋转的椭圆能量环，自底向上递增 */
.bws-vortex-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 24px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(0, 221, 255, 0.7) 60deg,
    rgba(255, 255, 255, 0.9) 90deg,
    rgba(0, 128, 255, 0.6) 120deg,
    transparent 180deg,
    rgba(0, 100, 200, 0.5) 240deg,
    rgba(0, 200, 255, 0.7) 270deg,
    rgba(0, 100, 200, 0.5) 300deg,
    transparent 360deg
  );
  filter: blur(1px);
  box-shadow: 0 0 12px rgba(0, 170, 255, 0.5);
  transform: translate3d(-50%, var(--bws-vortex-y, 0px), 0) rotateX(72deg) scale(var(--bws-vortex-scale, 1));
  opacity: 0;
  animation: bwsVortexRing 0.35s ease-out forwards, bwsSpinCW 0.4s linear infinite;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

@keyframes bwsVortexRing {
  0% { opacity: 0; }
  50% { opacity: 0.85; }
  100% { opacity: 0.6; }
}

/* ---------- 阶段①：能量凝缩（0.3s ~ 0.6s）---------- */

/* 致密能量球 - 漩涡压缩后的高密度蓝色能量核心 */
.bws-core-orb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(255, 255, 255, 1) 0%,
    rgba(0, 221, 255, 0.9) 25%,
    rgba(0, 128, 255, 0.7) 55%,
    rgba(0, 50, 150, 0.3) 85%,
    transparent 100%
  );
  box-shadow:
    0 0 30px rgba(0, 170, 255, 0.8),
    0 0 60px rgba(0, 128, 255, 0.5),
    0 0 90px rgba(0, 100, 200, 0.3);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: bwsCoreOrb 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) 0.3s forwards,
             bwsCoreOrbFade 0.25s ease-out 0.55s forwards;
  will-change: transform, opacity;
  z-index: 6;
}

@keyframes bwsCoreOrb {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  40% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  70% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) scale(0.8); opacity: 0.7; }
}

@keyframes bwsCoreOrbFade {
  0% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 能量脊柱 - 中心脉动的蓝色光柱 */
.bws-spine {
  position: absolute;
  top: 20%;
  left: 50%;
  width: 8px;
  height: 60%;
  transform: translate3d(-50%, 0, 0) scaleY(0);
  transform-origin: 50% 100%;
  background: linear-gradient(
    to top,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(0, 221, 255, 0.85) 30%,
    rgba(0, 128, 255, 0.6) 60%,
    rgba(0, 100, 200, 0.2) 100%
  );
  box-shadow:
    0 0 16px rgba(0, 170, 255, 0.8),
    0 0 32px rgba(0, 128, 255, 0.5);
  opacity: 0;
  animation: bwsSpine 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) 0.3s forwards;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes bwsSpine {
  0% { transform: translate3d(-50%, 0, 0) scaleY(0); opacity: 0; }
  30% { transform: translate3d(-50%, 0, 0) scaleY(1); opacity: 1; }
  70% { transform: translate3d(-50%, 0, 0) scaleY(1.05); opacity: 0.8; }
  100% { transform: translate3d(-50%, 0, 0) scaleY(0.9); opacity: 0; }
}

/* 蓄力光冠 - 能量球顶端扩散的蓄力能量盘 */
.bws-charge-crown {
  position: absolute;
  top: 25%;
  left: 50%;
  width: 80px;
  height: 80px;
  transform: translate3d(-50%, -50%, 0) rotateX(68deg) scale(0);
  opacity: 0;
  animation: bwsChargeCrown 0.3s ease-out 0.35s forwards;
  will-change: transform, opacity;
  z-index: 8;
}

.bws-crown-layer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.bws-crown-1 {
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(0, 221, 255, 0.3) 40%,
    transparent 70%
  );
  animation: bwsSpinCW 0.5s linear infinite;
}

.bws-crown-2 {
  inset: 15%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(0, 200, 255, 0.6) 60deg,
    transparent 120deg,
    rgba(0, 128, 255, 0.5) 180deg,
    transparent 240deg,
    rgba(0, 200, 255, 0.6) 300deg,
    transparent 360deg
  );
  filter: blur(2px);
  animation: bwsSpinCCW 0.4s linear infinite;
}

@keyframes bwsChargeCrown {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(68deg) scale(0); opacity: 0; }
  40% { transform: translate3d(-50%, -50%, 0) rotateX(68deg) scale(1.2); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(68deg) scale(1.8); opacity: 0; }
}

/* ---------- 阶段②：致命贯穿（0.55s ~ 0.9s）---------- */

/* 蓝白爆闪 - 致命一击瞬间的蓝白全屏爆闪 */
.bws-impact-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(0, 221, 255, 0.6) 20%,
    rgba(0, 128, 255, 0.3) 50%,
    transparent 80%
  );
  opacity: 0;
  animation: bwsImpactFlash 0.4s ease-out 0.55s forwards;
  will-change: opacity;
  z-index: 9;
}

@keyframes bwsImpactFlash {
  0%, 100% { opacity: 0; }
  8% { opacity: 1; }
  25% { opacity: 0.4; }
  50% { opacity: 0.6; }
  80% { opacity: 0; }
}

/* 贯穿光柱外层光晕 - 包裹贯穿光柱的巨大蓝色发光层 */
.bws-pierce-glow {
  position: absolute;
  top: 0;
  left: 50%;
  width: 60px;
  height: 100%;
  transform: translate3d(-50%, 0, 0) scaleX(0);
  background: radial-gradient(
    ellipse at center,
    rgba(0, 221, 255, 0.5) 0%,
    rgba(0, 128, 255, 0.25) 40%,
    transparent 70%
  );
  filter: blur(6px);
  opacity: 0;
  animation: bwsPierceGlow 0.35s ease-out 0.55s forwards;
  will-change: transform, opacity;
  z-index: 10;
}

@keyframes bwsPierceGlow {
  0% { transform: translate3d(-50%, 0, 0) scaleX(0); opacity: 0; }
  20% { transform: translate3d(-50%, 0, 0) scaleX(1); opacity: 1; }
  70% { transform: translate3d(-50%, 0, 0) scaleX(1.2); opacity: 0.6; }
  100% { transform: translate3d(-50%, 0, 0) scaleX(1.5); opacity: 0; }
}

/* 贯穿光柱主体 - 粗壮蓝白光柱直劈目标 */
.bws-pierce-main {
  position: absolute;
  top: 0;
  left: 50%;
  width: 16px;
  height: 100%;
  transform: translate3d(-50%, 0, 0) scaleY(0);
  transform-origin: 50% 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 221, 255, 0.3) 0%,
    rgba(0, 221, 255, 0.7) 15%,
    rgba(255, 255, 255, 0.95) 40%,
    rgba(0, 221, 255, 0.85) 70%,
    rgba(0, 128, 255, 0.5) 100%
  );
  box-shadow:
    0 0 20px rgba(0, 170, 255, 0.8),
    0 0 40px rgba(0, 128, 255, 0.5);
  opacity: 0;
  animation: bwsPierceMain 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) 0.55s forwards;
  will-change: transform, opacity;
  z-index: 11;
}

@keyframes bwsPierceMain {
  0% { transform: translate3d(-50%, 0, 0) scaleY(0); opacity: 0; }
  20% { transform: translate3d(-50%, 0, 0) scaleY(1); opacity: 1; }
  60% { transform: translate3d(-50%, 0, 0) scaleY(1); opacity: 0.8; }
  100% { transform: translate3d(-50%, 0, 0) scaleY(1); opacity: 0; }
}

/* 贯穿光柱核心 - 中心纯白高亮核心 */
.bws-pierce-core {
  position: absolute;
  top: 0;
  left: 50%;
  width: 6px;
  height: 100%;
  transform: translate3d(-50%, 0, 0) scaleY(0);
  transform-origin: 50% 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 1) 30%,
    rgba(255, 255, 255, 1) 70%,
    rgba(0, 221, 255, 0.6) 100%
  );
  box-shadow: 0 0 12px rgba(255, 255, 255, 1);
  opacity: 0;
  animation: bwsPierceCore 0.35s ease-out 0.55s forwards;
  will-change: transform, opacity;
  z-index: 12;
}

@keyframes bwsPierceCore {
  0% { transform: translate3d(-50%, 0, 0) scaleY(0); opacity: 0; }
  15% { transform: translate3d(-50%, 0, 0) scaleY(1); opacity: 1; }
  60% { transform: translate3d(-50%, 0, 0) scaleY(1); opacity: 0.7; }
  100% { transform: translate3d(-50%, 0, 0) scaleY(1); opacity: 0; }
}

/* 3层冲击波环 - 从中心向外扩散，rotateX贴地 */
.bws-shockwave-ring {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(0, 221, 255, 0.85);
  box-shadow:
    0 0 20px rgba(0, 170, 255, 0.6),
    inset 0 0 16px rgba(0, 128, 255, 0.4);
  transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  backface-visibility: hidden;
  z-index: 13;
}

.bws-shockwave-ring.ring-1 {
  animation: bwsShockwaveRing 0.4s ease-out 0.55s forwards;
}

.bws-shockwave-ring.ring-2 {
  border-color: rgba(0, 128, 255, 0.7);
  animation: bwsShockwaveRing 0.45s ease-out 0.59s forwards;
}

.bws-shockwave-ring.ring-3 {
  border-color: rgba(0, 221, 255, 0.5);
  animation: bwsShockwaveRing 0.5s ease-out 0.63s forwards;
}

@keyframes bwsShockwaveRing {
  0% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0);
    opacity: 0;
  }
  12% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(11);
    opacity: 0;
  }
}

/* 地面裂纹 - 撞击点扩散的蓝色裂纹 */
.bws-ground-crack {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(0, 221, 255, 0.5) 0deg,
    transparent 40deg,
    rgba(255, 255, 255, 0.6) 90deg,
    transparent 130deg,
    rgba(0, 128, 255, 0.5) 180deg,
    transparent 220deg,
    rgba(0, 200, 255, 0.6) 270deg,
    transparent 310deg,
    rgba(0, 221, 255, 0.5) 360deg
  );
  -webkit-mask: radial-gradient(circle, black 10%, transparent 70%);
  mask: radial-gradient(circle, black 10%, transparent 70%);
  box-shadow: 0 0 40px rgba(0, 128, 255, 0.35);
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: bwsGroundCrack 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) 0.57s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes bwsGroundCrack {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  25% { opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(2.2); opacity: 0; }
}

/* ---------- 阶段③：余波消散（0.8s ~ 1.2s）---------- */

/* 能量碎片 - 从撞击点向外3D飞溅 */
.bws-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--bws-shard-size, 6px);
  height: var(--bws-shard-size, 6px);
  border-radius: 40% 60% 50% 40% / 55% 40% 60% 45%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(0, 221, 255, 0.75) 50%,
    rgba(0, 128, 255, 0.35) 100%
  );
  box-shadow: 0 0 6px rgba(0, 170, 255, 0.7);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  backface-visibility: hidden;
  animation: bwsShardScatter 0.5s cubic-bezier(0.2, 0.5, 0.4, 1) 0.8s forwards;
  will-change: transform, opacity;
  z-index: 14;
}

@keyframes bwsShardScatter {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; }
  100% {
    transform: translate3d(calc(-50% + var(--bws-shard-tx, 0px)), calc(-50% + var(--bws-shard-ty, 0px)), var(--bws-shard-tz, 0px)) scale(0.3) rotate(180deg);
    opacity: 0;
  }
}

/* 蓝辉余韵 - 最后的能量消散 */
.bws-afterglow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(0, 221, 255, 0.2) 0%,
    rgba(0, 128, 255, 0.1) 45%,
    transparent 80%
  );
  opacity: 0;
  animation: bwsAfterglow 0.5s ease-out 0.85s forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes bwsAfterglow {
  0% { opacity: 0; }
  25% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .bws-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
