<!--
  @file FightingSpiritStormEffect.vue
  @generated 2026-07-06
  @description 斗气风暴 - 斗气凝聚·风暴成形·风暴爆发·多段蔓延·斗气消散
  技师W技能（technician_w）：将斗气化作风暴，打击周围的敌人
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + translateZ深度分层 + rotateX地面倾斜
  动画总时长：1.2秒
    ⓪ 斗气凝聚（0s ~ 0.25s）- 暗幕降临 + 金色法阵 + 斗气粒子螺旋汇聚
    ① 风暴成形（0.2s ~ 0.5s）- 斗气龙卷螺旋上升 + 能量脊柱脉动 + 顶部能量冠扩散
    ② 风暴爆发（0.4s ~ 0.75s）- 金色爆闪 + 3层冲击波环 + 8道斗气刃辐射 + 地面裂纹
    ③ 多段蔓延（0.55s ~ 1.0s）- 3波蔓延冲击波环递延扩散 + 12条地面蔓延纹2波延伸 + 8颗二次脉冲粒子2波推进
    ④ 斗气消散（0.85s ~ 1.2s）- 16块斗气碎片3D飞溅 + 金辉余韵消散
  色彩方案：斗气金橙(#FF8C00) + 烈焰橙(#FF6B00) + 核心白(#FFFFFF) + 深褐(#2B1A0A)
-->
<template>
  <!-- 3D舞台 - 透视容器，为龙卷上升与碎片飞溅提供深度视角 -->
  <div class="fss-3d-stage">
    <!-- ===== 阶段⓪：斗气凝聚 ===== -->
    <!-- 暗幕 - 深褐金覆盖，斗气风暴将至 -->
    <div class="fss-dim"></div>

    <!-- 斗气法阵 - 地面旋转的金色能量阵 -->
    <div class="fss-rune"></div>

    <!-- 斗气汇聚粒子 - 从四周螺旋汇聚至中心 -->
    <div
      v-for="i in 14"
      :key="'fss-gather-' + i"
      class="fss-gather-particle"
      :style="getGatherStyle(i)"
    ></div>

    <!-- ===== 阶段①：风暴成形 ===== -->
    <!-- 斗气龙卷 - 螺旋上升的金色能量带 -->
    <div class="fss-tornado">
      <div
        v-for="i in 10"
        :key="'fss-spiral-' + i"
        class="fss-spiral-ring"
        :style="getSpiralStyle(i)"
      ></div>
    </div>

    <!-- 能量脊柱 - 中心脉动的金色光柱 -->
    <div class="fss-spine"></div>

    <!-- 顶部能量冠 - 龙卷顶端扩散的能量盘 -->
    <div class="fss-crown">
      <div class="fss-crown-layer fss-crown-1"></div>
      <div class="fss-crown-layer fss-crown-2"></div>
    </div>

    <!-- ===== 阶段②：风暴爆发 ===== -->
    <!-- 金色爆闪 - 风暴爆发瞬间的金白全屏爆闪 -->
    <div class="fss-impact-flash"></div>

    <!-- 3层冲击波环 - 从中心向外扩散 -->
    <div class="fss-shockwave-ring ring-1"></div>
    <div class="fss-shockwave-ring ring-2"></div>
    <div class="fss-shockwave-ring ring-3"></div>

    <!-- 8道斗气刃 - 从中心呈放射状爆射 -->
    <div
      v-for="i in 8"
      :key="'fss-blade-' + i"
      class="fss-blade"
      :style="getBladeStyle(i)"
    ></div>

    <!-- 地面裂纹 - 撞击点扩散的金色裂纹 -->
    <div class="fss-ground-crack"></div>

    <!-- ===== 阶段③：多段蔓延（0.55s ~ 1.0s）===== -->
    <!-- 3波蔓延冲击波环 - 递延扩散，每波递减递宽，营造一浪接一浪的蔓延感 -->
    <div class="fss-creep-wave creep-1"></div>
    <div class="fss-creep-wave creep-2"></div>
    <div class="fss-creep-wave creep-3"></div>

    <!-- 12条地面蔓延纹 - 从中心沿地面向外延伸的金色能量脉络，分2波蔓延 -->
    <div
      v-for="i in 12"
      :key="'fss-creep-vein-' + i"
      class="fss-creep-vein"
      :style="getCreepVeinStyle(i)"
    ></div>

    <!-- 8颗二次脉冲粒子 - 沿地面从中心向外推进的斗气脉冲，分2波蔓延 -->
    <div
      v-for="i in 8"
      :key="'fss-pulse-' + i"
      class="fss-pulse-particle"
      :style="getPulseParticleStyle(i)"
    ></div>

    <!-- ===== 阶段④：斗气消散 ===== -->
    <!-- 斗气碎片 - 从爆发点向外3D飞溅 -->
    <div
      v-for="i in 16"
      :key="'fss-shard-' + i"
      class="fss-shard"
      :style="getShardStyle(i)"
    ></div>

    <!-- 金辉余韵 - 最后的斗气消散 -->
    <div class="fss-afterglow"></div>

    <!-- 蔓延余烬 - 多段蔓延结束后的残留能量缓慢消散 -->
    <div class="fss-creep-ember"></div>
  </div>
</template>

<script setup>
/**
 * 斗气风暴 - 斗气凝聚·风暴成形·风暴爆发·多段蔓延·斗气消散
 * 技师W技能（technician_w）AOE特效组件，以斗气金橙和烈焰橙为主色调
 * 展现斗气凝聚成龙卷风暴、爆发辐射、多段蔓延扩散打击周围敌人的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 * 动画总时长1.2秒
 */

/**
 * 生成斗气汇聚粒子的样式
 * @param {number} index - 粒子序号（1~14）
 * @returns {Object} CSS样式对象，含角度、距离、尺寸、延迟
 */
function getGatherStyle (index) {
  const angle = (index - 1) * 25.7 + (index % 2) * 7
  const distance = 130 + (index % 4) * 22
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.006
  return {
    '--fss-gather-angle': `${angle}deg`,
    '--fss-gather-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成龙卷螺旋环的样式
 * @param {number} index - 螺旋环序号（1~10）
 * @returns {Object} CSS样式对象，含垂直偏移、缩放、旋转方向、延迟
 */
function getSpiralStyle (index) {
  const yOffset = (index - 1) * 18 - 40
  const scale = 0.4 + (index - 1) * 0.12
  const spinDir = index % 2 === 0 ? 'fssSpinCW' : 'fssSpinCCW'
  const delay = (index - 1) * 0.015
  return {
    '--fss-spiral-y': `${yOffset}px`,
    '--fss-spiral-scale': scale,
    animationName: spinDir,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成斗气刃的放射样式
 * @param {number} index - 刃序号（1~8）
 * @returns {Object} CSS样式对象，含旋转角度、延迟
 */
function getBladeStyle (index) {
  const angle = (index - 1) * 45
  const delay = 0.4 + (index % 3) * 0.015
  return {
    '--fss-blade-angle': `${angle}deg`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成斗气碎片的3D飞溅样式
 * @param {number} index - 碎片序号（1~16）
 * @returns {Object} CSS样式对象，含飞溅角度、距离、Z轴深度、尺寸、延迟
 */
function getShardStyle (index) {
  const angle = (index - 1) * 22.5 + (index % 2) * 8
  const distance = 65 + (index % 5) * 24
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 15 - (index % 3) * 8
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const tz = depthDir * (35 + (index % 2) * 20)
  const size = 5 + (index % 4) * 4
  const delay = 0.55 + (index % 4) * 0.02
  return {
    '--fss-shard-tx': `${tx}px`,
    '--fss-shard-ty': `${ty}px`,
    '--fss-shard-tz': `${tz}px`,
    '--fss-shard-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成地面蔓延纹的样式
 * 12条能量脉络从中心沿地面向外延伸，分2波（前6条0.5s，后6条0.65s）
 * @param {number} index - 蔓延纹序号（1~12）
 * @returns {Object} CSS样式对象，含旋转角度、蔓延距离、波次延迟
 */
function getCreepVeinStyle (index) {
  const angle = (index - 1) * 30 + (index % 2) * 5
  const wave = index <= 6 ? 0 : 1
  const baseDelay = wave === 0 ? 0.5 : 0.65
  const delay = baseDelay + (index % 3) * 0.02
  const length = 100 + (index % 4) * 25
  return {
    '--fss-vein-angle': `${angle}deg`,
    '--fss-vein-length': `${length}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成二次脉冲粒子的样式
 * 8颗斗气脉冲沿地面从中心向外推进，分2波（前4颗0.55s，后4颗0.72s）
 * @param {number} index - 脉冲粒子序号（1~8）
 * @returns {Object} CSS样式对象，含推进角度、推进距离、波次延迟、尺寸
 */
function getPulseParticleStyle (index) {
  const angle = (index - 1) * 45 + (index % 2) * 10
  const wave = index <= 4 ? 0 : 1
  const baseDelay = wave === 0 ? 0.55 : 0.72
  const delay = baseDelay + (index % 2) * 0.015
  const distance = 80 + (index % 3) * 30
  const size = 5 + (index % 2) * 3
  return {
    '--fss-pulse-angle': `${angle}deg`,
    '--fss-pulse-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   斗气风暴 (fighting_spirit_storm) - 斗气凝聚·风暴成形·风暴爆发·多段蔓延·斗气消散
   技能描述：将斗气化作风暴，打击周围的敌人
   3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：1.2秒
     ⓪ 斗气凝聚（0s ~ 0.25s）- 暗幕降临 + 金色法阵 + 14粒子螺旋汇聚
     ① 风暴成形（0.2s ~ 0.5s）- 10层龙卷螺旋上升 + 能量脊柱 + 顶部能量冠
     ② 风暴爆发（0.4s ~ 0.75s）- 金色爆闪 + 3层冲击波 + 8道斗气刃 + 地面裂纹
     ③ 多段蔓延（0.55s ~ 1.0s）- 3波蔓延冲击波递延扩散 + 12条地面蔓延纹2波延伸 + 8颗二次脉冲粒子2波推进
     ④ 斗气消散（0.85s ~ 1.2s）- 16块斗气碎片3D飞溅 + 金辉余韵 + 蔓延余烬消散
   ================================================================ */

/* 3D舞台 - 透视容器，为龙卷上升与碎片飞溅提供深度视角
   整体 scale(1.5) 将所有特效范围放大50%，transform-origin 对齐效果中心 */
.fss-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 40%;
  transform: scale(1.5);
  transform-origin: 50% 55%;
  transform-style: preserve-3d;
  contain: layout style;
  pointer-events: none;
}

/* ---------- 阶段⓪：斗气凝聚（0s ~ 0.25s）---------- */

/* 暗幕 - 深褐金覆盖，斗气风暴将至 */
.fss-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 45%,
    rgba(43, 26, 10, 0.5) 0%,
    rgba(30, 15, 5, 0.35) 50%,
    transparent 100%
  );
  animation: fssDim 1.2s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes fssDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  35% { opacity: 0.8; }
  65% { opacity: 0.4; }
  85% { opacity: 0.15; }
  100% { opacity: 0; }
}

/* 斗气法阵 - 地面旋转的金色能量阵 */
.fss-rune {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 300px;
  height: 300px;
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: fssRuneIn 0.25s cubic-bezier(0.2, 0.8, 0.3, 1) forwards,
             fssRuneFade 0.4s ease-out 0.3s forwards;
  will-change: transform, opacity;
  z-index: 2;
}

.fss-rune::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 140, 0, 0.35) 25deg,
    rgba(255, 215, 0, 0.55) 50deg,
    rgba(255, 140, 0, 0.35) 75deg,
    transparent 120deg,
    rgba(255, 107, 0, 0.3) 180deg,
    rgba(255, 200, 0, 0.45) 210deg,
    rgba(255, 107, 0, 0.3) 240deg,
    transparent 270deg,
    rgba(255, 140, 0, 0.35) 330deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 25%, black 45%, transparent 80%);
  mask: radial-gradient(circle, transparent 25%, black 45%, transparent 80%);
  box-shadow: 0 0 30px rgba(255, 140, 0, 0.35);
  will-change: transform;
  animation: fssSpinCW 0.5s linear infinite;
}

@keyframes fssSpinCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fssSpinCCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
}

@keyframes fssRuneIn {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1.15); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1); opacity: 0.9; }
}

@keyframes fssRuneFade {
  0% { opacity: 0.9; }
  100% { opacity: 0; }
}

/* 斗气汇聚粒子 - 从四周螺旋汇聚至中心 */
.fss-gather-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 200, 0, 0.75) 50%,
    rgba(255, 107, 0, 0.35) 100%
  );
  box-shadow: 0 0 6px rgba(255, 165, 0, 0.7);
  opacity: 0;
  animation: fssGather 0.25s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes fssGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--fss-gather-angle, 0deg)) translateX(var(--fss-gather-distance, 130px)) scale(1);
    opacity: 0;
  }
  25% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--fss-gather-angle, 0deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段①：风暴成形（0.2s ~ 0.5s）---------- */

/* 斗气龙卷 - 螺旋上升的金色能量带 */
.fss-tornado {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  transform: translate3d(-50%, -50%, 0);
  opacity: 0;
  animation: fssTornadoContainer 0.3s ease-out 0.2s forwards,
             fssTornadoFade 0.2s ease-out 0.5s forwards;
  will-change: opacity;
  z-index: 5;
}

@keyframes fssTornadoContainer {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes fssTornadoFade {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* 龙卷螺旋环 - 每层为一个旋转的椭圆能量环，自底向上递增 */
.fss-spiral-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 24px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 200, 0, 0.7) 60deg,
    rgba(255, 255, 255, 0.9) 90deg,
    rgba(255, 140, 0, 0.6) 120deg,
    transparent 180deg,
    rgba(255, 107, 0, 0.5) 240deg,
    rgba(255, 200, 0, 0.7) 270deg,
    rgba(255, 107, 0, 0.5) 300deg,
    transparent 360deg
  );
  filter: blur(1px);
  box-shadow: 0 0 12px rgba(255, 140, 0, 0.5);
  transform: translate3d(-50%, var(--fss-spiral-y, 0px), 0) rotateX(72deg) scale(var(--fss-spiral-scale, 1));
  opacity: 0;
  animation: fssSpiralRing 0.3s ease-out 0.2s forwards, fssSpinCW 0.4s linear infinite;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

@keyframes fssSpiralRing {
  0% { opacity: 0; }
  50% { opacity: 0.85; }
  100% { opacity: 0.6; }
}

/* 能量脊柱 - 中心脉动的金色光柱 */
.fss-spine {
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
    rgba(255, 200, 0, 0.85) 30%,
    rgba(255, 140, 0, 0.6) 60%,
    rgba(255, 107, 0, 0.2) 100%
  );
  box-shadow:
    0 0 16px rgba(255, 165, 0, 0.8),
    0 0 32px rgba(255, 140, 0, 0.5);
  opacity: 0;
  animation: fssSpine 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) 0.2s forwards;
  will-change: transform, opacity;
  z-index: 6;
}

@keyframes fssSpine {
  0% { transform: translate3d(-50%, 0, 0) scaleY(0); opacity: 0; }
  30% { transform: translate3d(-50%, 0, 0) scaleY(1); opacity: 1; }
  70% { transform: translate3d(-50%, 0, 0) scaleY(1.05); opacity: 0.8; }
  100% { transform: translate3d(-50%, 0, 0) scaleY(0.9); opacity: 0; }
}

/* 顶部能量冠 - 龙卷顶端扩散的能量盘 */
.fss-crown {
  position: absolute;
  top: 25%;
  left: 50%;
  width: 80px;
  height: 80px;
  transform: translate3d(-50%, -50%, 0) rotateX(68deg) scale(0);
  opacity: 0;
  animation: fssCrown 0.3s ease-out 0.25s forwards;
  will-change: transform, opacity;
  z-index: 7;
}

.fss-crown-layer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.fss-crown-1 {
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 200, 0, 0.3) 40%,
    transparent 70%
  );
  animation: fssSpinCW 0.5s linear infinite;
}

.fss-crown-2 {
  inset: 15%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 220, 100, 0.6) 60deg,
    transparent 120deg,
    rgba(255, 165, 0, 0.5) 180deg,
    transparent 240deg,
    rgba(255, 220, 100, 0.6) 300deg,
    transparent 360deg
  );
  filter: blur(2px);
  animation: fssSpinCCW 0.4s linear infinite;
}

@keyframes fssCrown {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(68deg) scale(0); opacity: 0; }
  40% { transform: translate3d(-50%, -50%, 0) rotateX(68deg) scale(1.2); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(68deg) scale(1.8); opacity: 0; }
}

/* ---------- 阶段②：风暴爆发（0.4s ~ 0.75s）---------- */

/* 金色爆闪 - 风暴爆发瞬间的金白全屏爆闪 */
.fss-impact-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 220, 100, 0.6) 20%,
    rgba(255, 140, 0, 0.3) 50%,
    transparent 80%
  );
  opacity: 0;
  animation: fssImpactFlash 0.4s ease-out 0.4s forwards;
  will-change: opacity;
  z-index: 8;
}

@keyframes fssImpactFlash {
  0%, 100% { opacity: 0; }
  8% { opacity: 1; }
  25% { opacity: 0.4; }
  50% { opacity: 0.6; }
  80% { opacity: 0; }
}

/* 3层冲击波环 - 从中心向外扩散，rotateX贴地 */
.fss-shockwave-ring {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(255, 200, 0, 0.85);
  box-shadow:
    0 0 20px rgba(255, 165, 0, 0.6),
    inset 0 0 16px rgba(255, 107, 0, 0.4);
  transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  backface-visibility: hidden;
  z-index: 9;
}

.fss-shockwave-ring.ring-1 {
  animation: fssShockwaveRing 0.4s ease-out 0.4s forwards;
}

.fss-shockwave-ring.ring-2 {
  border-color: rgba(255, 140, 0, 0.7);
  animation: fssShockwaveRing 0.45s ease-out 0.44s forwards;
}

.fss-shockwave-ring.ring-3 {
  border-color: rgba(255, 200, 0, 0.5);
  animation: fssShockwaveRing 0.5s ease-out 0.48s forwards;
}

@keyframes fssShockwaveRing {
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

/* 8道斗气刃 - 从中心呈放射状爆射 */
.fss-blade {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 90px;
  height: 6px;
  transform-origin: 0% 50%;
  transform: translate3d(0, -50%, 0) rotate(var(--fss-blade-angle, 0deg)) scaleX(0);
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 220, 100, 0.8) 20%,
    rgba(255, 140, 0, 0.6) 60%,
    transparent 100%
  );
  box-shadow:
    0 0 10px rgba(255, 165, 0, 0.7),
    0 0 20px rgba(255, 107, 0, 0.4);
  border-radius: 0 50% 50% 0;
  opacity: 0;
  animation: fssBladeBurst 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) 0.4s forwards;
  will-change: transform, opacity;
  z-index: 10;
}

@keyframes fssBladeBurst {
  0% {
    transform: translate3d(0, -50%, 0) rotate(var(--fss-blade-angle, 0deg)) scaleX(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(0, -50%, 0) rotate(var(--fss-blade-angle, 0deg)) scaleX(1);
    opacity: 1;
  }
  70% {
    transform: translate3d(0, -50%, 0) rotate(var(--fss-blade-angle, 0deg)) scaleX(1.5);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(0, -50%, 0) rotate(var(--fss-blade-angle, 0deg)) scaleX(2);
    opacity: 0;
  }
}

/* 地面裂纹 - 撞击点扩散的金色裂纹 */
.fss-ground-crack {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(255, 200, 0, 0.5) 0deg,
    transparent 40deg,
    rgba(255, 255, 255, 0.6) 90deg,
    transparent 130deg,
    rgba(255, 140, 0, 0.5) 180deg,
    transparent 220deg,
    rgba(255, 220, 100, 0.6) 270deg,
    transparent 310deg,
    rgba(255, 200, 0, 0.5) 360deg
  );
  -webkit-mask: radial-gradient(circle, black 10%, transparent 70%);
  mask: radial-gradient(circle, black 10%, transparent 70%);
  box-shadow: 0 0 40px rgba(255, 140, 0, 0.35);
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: fssGroundCrack 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) 0.42s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes fssGroundCrack {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  25% { opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(2.2); opacity: 0; }
}

/* ---------- 阶段③：斗气消散（0.65s ~ 1.0s）---------- */

/* 斗气碎片 - 从爆发点向外3D飞溅 */
.fss-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--fss-shard-size, 6px);
  height: var(--fss-shard-size, 6px);
  border-radius: 40% 60% 50% 40% / 55% 40% 60% 45%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 200, 0, 0.75) 50%,
    rgba(255, 107, 0, 0.35) 100%
  );
  box-shadow: 0 0 6px rgba(255, 165, 0, 0.7);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  backface-visibility: hidden;
  animation: fssShardScatter 0.5s cubic-bezier(0.2, 0.5, 0.4, 1) 0.85s forwards;
  will-change: transform, opacity;
  z-index: 11;
}

@keyframes fssShardScatter {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; }
  100% {
    transform: translate3d(calc(-50% + var(--fss-shard-tx, 0px)), calc(-50% + var(--fss-shard-ty, 0px)), var(--fss-shard-tz, 0px)) scale(0.3) rotate(180deg);
    opacity: 0;
  }
}

/* 金辉余韵 - 最后的斗气消散 */
.fss-afterglow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(255, 200, 0, 0.2) 0%,
    rgba(255, 140, 0, 0.1) 45%,
    transparent 80%
  );
  opacity: 0;
  animation: fssAfterglow 0.5s ease-out 0.85s forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes fssAfterglow {
  0% { opacity: 0; }
  25% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* ---------- 阶段③：多段蔓延（0.55s ~ 1.0s）---------- */

/* 3波蔓延冲击波环 - 递延扩散，每波递减递宽，营造一浪接一浪的蔓延感 */
.fss-creep-wave {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  backface-visibility: hidden;
  z-index: 9;
}

/* 第1波蔓延 - 最强，范围适中 */
.fss-creep-wave.creep-1 {
  border: 2px solid rgba(255, 200, 0, 0.7);
  box-shadow:
    0 0 16px rgba(255, 165, 0, 0.5),
    inset 0 0 12px rgba(255, 107, 0, 0.3);
  animation: fssCreepWave1 0.45s ease-out 0.55s forwards;
}

/* 第2波蔓延 - 中等，范围更广 */
.fss-creep-wave.creep-2 {
  border: 2px solid rgba(255, 140, 0, 0.55);
  box-shadow:
    0 0 14px rgba(255, 140, 0, 0.4),
    inset 0 0 10px rgba(255, 107, 0, 0.25);
  animation: fssCreepWave2 0.45s ease-out 0.68s forwards;
}

/* 第3波蔓延 - 最弱，范围最广，尾端消散 */
.fss-creep-wave.creep-3 {
  border: 1px solid rgba(255, 200, 0, 0.4);
  box-shadow:
    0 0 12px rgba(255, 165, 0, 0.3),
    inset 0 0 8px rgba(255, 107, 0, 0.2);
  animation: fssCreepWave3 0.45s ease-out 0.82s forwards;
}

@keyframes fssCreepWave1 {
  0% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0);
    opacity: 0;
  }
  15% { opacity: 0.9; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(9);
    opacity: 0;
  }
}

@keyframes fssCreepWave2 {
  0% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(2);
    opacity: 0;
  }
  15% { opacity: 0.7; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(12);
    opacity: 0;
  }
}

@keyframes fssCreepWave3 {
  0% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(4);
    opacity: 0;
  }
  15% { opacity: 0.5; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(15);
    opacity: 0;
  }
}

/* 12条地面蔓延纹 - 从中心沿地面向外延伸的金色能量脉络，分2波蔓延 */
.fss-creep-vein {
  position: absolute;
  top: 55%;
  left: 50%;
  width: var(--fss-vein-length, 120px);
  height: 3px;
  transform-origin: 0% 50%;
  transform: translate3d(0, -50%, 0) rotate(var(--fss-vein-angle, 0deg)) scaleX(0);
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 220, 100, 0.7) 15%,
    rgba(255, 165, 0, 0.5) 50%,
    rgba(255, 107, 0, 0.2) 85%,
    transparent 100%
  );
  box-shadow: 0 0 8px rgba(255, 165, 0, 0.5);
  border-radius: 0 2px 2px 0;
  opacity: 0;
  animation: fssCreepVein 0.45s cubic-bezier(0.2, 0.6, 0.4, 1) forwards;
  will-change: transform, opacity;
  z-index: 8;
}

@keyframes fssCreepVein {
  0% {
    transform: translate3d(0, -50%, 0) rotate(var(--fss-vein-angle, 0deg)) scaleX(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(0, -50%, 0) rotate(var(--fss-vein-angle, 0deg)) scaleX(0.7);
    opacity: 0.9;
  }
  60% {
    transform: translate3d(0, -50%, 0) rotate(var(--fss-vein-angle, 0deg)) scaleX(1);
    opacity: 0.6;
  }
  100% {
    transform: translate3d(0, -50%, 0) rotate(var(--fss-vein-angle, 0deg)) scaleX(1.2);
    opacity: 0;
  }
}

/* 8颗二次脉冲粒子 - 沿地面从中心向外推进的斗气脉冲，分2波蔓延 */
.fss-pulse-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 200, 0, 0.7) 50%,
    rgba(255, 107, 0, 0.3) 100%
  );
  box-shadow: 0 0 8px rgba(255, 165, 0, 0.7);
  transform: translate3d(-50%, -50%, 0) rotate(var(--fss-pulse-angle, 0deg)) translateX(0) scale(0);
  opacity: 0;
  animation: fssPulseTravel 0.5s cubic-bezier(0.2, 0.5, 0.3, 1) forwards;
  will-change: transform, opacity;
  z-index: 10;
}

@keyframes fssPulseTravel {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--fss-pulse-angle, 0deg)) translateX(0) scale(0.8);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--fss-pulse-angle, 0deg)) translateX(10px) scale(1.2);
    opacity: 1;
  }
  70% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--fss-pulse-angle, 0deg)) translateX(var(--fss-pulse-distance, 100px)) scale(0.7);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--fss-pulse-angle, 0deg)) translateX(var(--fss-pulse-distance, 100px)) scale(0.2);
    opacity: 0;
  }
}

/* 蔓延余烬 - 多段蔓延结束后的残留能量缓慢消散 */
.fss-creep-ember {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(255, 165, 0, 0.12) 0%,
    rgba(255, 107, 0, 0.06) 40%,
    transparent 75%
  );
  opacity: 0;
  animation: fssCreepEmber 0.5s ease-out 0.95s forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes fssCreepEmber {
  0% { opacity: 0; }
  30% { opacity: 0.6; }
  100% { opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .fss-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
