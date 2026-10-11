<!--
  @file NenEnergyBombEffect.vue
  @generated 2026-07-21
  @description 念气能量弹 - 念气引导·能量凝聚·投掷飞行·落地爆发·余波消散
  格斗宗师U技能（combat_master_u）：引导能量后，向目标区域扔去能量炸弹，造成巨大范围伤害
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + translateZ深度分层 + rotateX地面倾斜
  动画总时长：1.4秒
    ⓪ 念气引导（0s ~ 0.35s）- 暗幕降临 + 紫粉念气法阵 + 14颗念气粒子汇聚
    ① 能量凝聚（0.2s ~ 0.5s）- 粉白能量弹成形 + 双层轨道环 + 能量脉络脉动
    ② 投掷飞行（0.45s ~ 0.7s）- 能量弹沿抛物线坠入目标区 + 彗星尾焰 + 旋转光环
    ③ 落地爆发（0.65s ~ 1.05s）- 巨大爆闪 + 膨胀能量穹顶 + 3层冲击波环 + 6道念气柱 + 地面龟裂 + 碎片飞溅
    ④ 余波消散（1.0s ~ 1.4s）- 12颗余烬上升 + 粉辉余韵消散
  色彩方案：核心白(#FFFFFF) + 念粉(#FF6EC7) + 灵紫(#BA68C8) + 深紫(#7B1FA2) + 金辉(#FFD54F)
-->
<template>
  <!-- 3D舞台 - 透视容器，为抛物线投掷与穹顶爆发提供深度视角 -->
  <div class="neb-3d-stage">
    <!-- ===== 阶段⓪：念气引导 ===== -->
    <!-- 暗幕 - 深紫覆盖，念气引导前的压迫感 -->
    <div class="neb-dim"></div>

    <!-- 念气法阵 - 目标区域地面旋转的紫粉能量阵 -->
    <div class="neb-rune"></div>

    <!-- 引导汇聚粒子 - 从四周螺旋汇聚至引导点 -->
    <div
      v-for="i in 14"
      :key="'neb-gather-' + i"
      class="neb-gather-particle"
      :style="getGatherStyle(i)"
    ></div>

    <!-- ===== 阶段②：投掷飞行 ===== -->
    <!-- 念气能量弹 - 沿抛物线从引导点飞向目标区域（阶段①的凝聚成形也在此容器内完成） -->
    <div class="neb-bomb">
      <!-- 彗星尾焰 - 弹体后方拖曳的粉紫流光 -->
      <div class="neb-bomb-tail"></div>
      <!-- 弹体外层气场 - 灵紫辉光 -->
      <div class="neb-bomb-aura"></div>
      <!-- 弹体核心 - 高亮粉白核心 -->
      <div class="neb-bomb-core"></div>
      <!-- 双层轨道环 - 交错旋转的能量环 -->
      <div class="neb-bomb-ring ring-a"></div>
      <div class="neb-bomb-ring ring-b"></div>
    </div>

    <!-- ===== 阶段③：落地爆发 ===== -->
    <!-- 落地爆闪 - 能量弹炸裂瞬间的粉白全屏爆闪 -->
    <div class="neb-impact-flash"></div>

    <!-- 能量穹顶 - 从落点膨胀而出的半球形冲击气浪 -->
    <div class="neb-dome"></div>

    <!-- 3层冲击波环 - 从落点沿地面向外扩散 -->
    <div class="neb-shockwave-ring ring-1"></div>
    <div class="neb-shockwave-ring ring-2"></div>
    <div class="neb-shockwave-ring ring-3"></div>

    <!-- 6道念气柱 - 落点周围冲天而起的粉紫能量柱 -->
    <div
      v-for="i in 6"
      :key="'neb-pillar-' + i"
      class="neb-pillar"
      :style="getPillarStyle(i)"
    ></div>

    <!-- 地面龟裂 - 落点扩散的念气裂纹 -->
    <div class="neb-ground-crack"></div>

    <!-- 16块念气碎片 - 从爆点向外3D飞溅 -->
    <div
      v-for="i in 16"
      :key="'neb-shard-' + i"
      class="neb-shard"
      :style="getShardStyle(i)"
    ></div>

    <!-- ===== 阶段④：余波消散 ===== -->
    <!-- 上升余烬 - 爆点残留念气缓缓上升消散 -->
    <div
      v-for="i in 12"
      :key="'neb-ember-' + i"
      class="neb-ember"
      :style="getEmberStyle(i)"
    ></div>

    <!-- 粉辉余韵 - 最后的念气余晖 -->
    <div class="neb-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 念气能量弹 - 念气引导·能量凝聚·投掷飞行·落地爆发·余波消散
 * 格斗宗师U技能（combat_master_u）AOE特效组件，以念粉和灵紫为主色调
 * 展现引导念气凝聚成能量炸弹、抛物线投掷至目标区域并引发大范围爆炸的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 * 动画总时长1.4秒
 */

/**
 * 生成引导汇聚粒子的样式
 * 粒子分布于引导点四周，沿各自角度螺旋汇聚，象征念气被引导集中
 * @param {number} index - 粒子序号（1~14）
 * @returns {Object} CSS样式对象，含角度、距离、尺寸、延迟
 */
function getGatherStyle (index) {
  const angle = (index - 1) * 25.7 + (index % 2) * 7
  const distance = 110 + (index % 4) * 22
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.007
  return {
    '--neb-gather-angle': `${angle}deg`,
    '--neb-gather-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成念气柱的样式
 * 6道能量柱环绕落点排布，落地瞬间冲天而起
 * @param {number} index - 念气柱序号（1~6）
 * @returns {Object} CSS样式对象，含环绕角度、半径、高度、延迟
 */
function getPillarStyle (index) {
  const angle = (index - 1) * 60 + 15
  const rad = (angle * Math.PI) / 180
  const radius = 58 + (index % 2) * 26
  const x = Math.cos(rad) * radius
  const y = Math.sin(rad) * radius * 0.42
  const height = 90 + (index % 3) * 28
  const delay = 0.65 + (index % 3) * 0.03
  return {
    '--neb-pillar-x': `${x}px`,
    '--neb-pillar-y': `${y}px`,
    '--neb-pillar-h': `${height}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成念气碎片的3D飞溅样式
 * @param {number} index - 碎片序号（1~16）
 * @returns {Object} CSS样式对象，含飞溅角度、距离、Z轴深度、尺寸、延迟
 */
function getShardStyle (index) {
  const angle = (index - 1) * 22.5 + (index % 2) * 8
  const distance = 70 + (index % 5) * 26
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 18 - (index % 3) * 9
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const tz = depthDir * (38 + (index % 2) * 22)
  const size = 5 + (index % 4) * 4
  const delay = 0.66 + (index % 4) * 0.02
  return {
    '--neb-shard-tx': `${tx}px`,
    '--neb-shard-ty': `${ty}px`,
    '--neb-shard-tz': `${tz}px`,
    '--neb-shard-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成上升余烬的样式
 * 爆点残留念气余烬，带水平随机偏移向上飘升消散
 * @param {number} index - 余烬序号（1~12）
 * @returns {Object} CSS样式对象，含水平偏移、上升高度、尺寸、延迟
 */
function getEmberStyle (index) {
  const xOffset = (index - 6.5) * 20 + (index % 2) * 10
  const riseHeight = 80 + (index % 4) * 28
  const size = 3 + (index % 3) * 2
  const delay = 1.0 + (index % 5) * 0.05
  return {
    '--neb-ember-x': `${xOffset}px`,
    '--neb-ember-h': `${riseHeight}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   念气能量弹 (nen_energy_bomb) - 念气引导·能量凝聚·投掷飞行·落地爆发·余波消散
   技能描述：引导能量后，向目标区域扔去能量炸弹，造成巨大范围伤害
   3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：1.4秒
     ⓪ 念气引导（0s ~ 0.35s）- 暗幕 + 紫粉法阵 + 14粒子螺旋汇聚
     ① 能量凝聚（0.2s ~ 0.5s）- 粉白能量弹成形 + 双层轨道环
     ② 投掷飞行（0.45s ~ 0.7s）- 抛物线坠入 + 彗星尾焰 + 旋转光环
     ③ 落地爆发（0.65s ~ 1.05s）- 爆闪 + 能量穹顶 + 3层冲击波 + 6道念气柱 + 地面龟裂 + 16碎片
     ④ 余波消散（1.0s ~ 1.4s）- 12颗余烬上升 + 粉辉余韵
   ================================================================ */

/* 3D舞台 - 透视容器，为抛物线投掷与穹顶爆发提供深度视角
   整体 scale(1.3) 将特效范围放大30%，transform-origin 对齐效果中心 */
.neb-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 40%;
  transform: scale(1.3);
  transform-origin: 50% 55%;
  transform-style: preserve-3d;
  contain: layout style;
  pointer-events: none;
}

/* ---------- 阶段⓪：念气引导（0s ~ 0.35s）---------- */

/* 暗幕 - 深紫覆盖，念气引导前的压迫感 */
.neb-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(45, 10, 60, 0.55) 0%,
    rgba(30, 8, 42, 0.35) 50%,
    transparent 100%
  );
  animation: nebDim 1.4s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes nebDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  35% { opacity: 0.85; }
  70% { opacity: 0.4; }
  88% { opacity: 0.15; }
  100% { opacity: 0; }
}

/* 念气法阵 - 目标区域地面旋转的紫粉能量阵 */
.neb-rune {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 280px;
  height: 280px;
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: nebRuneIn 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) forwards,
             nebRuneFade 0.4s ease-out 0.4s forwards;
  will-change: transform, opacity;
  z-index: 2;
}

.neb-rune::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 110, 199, 0.4) 25deg,
    rgba(186, 104, 200, 0.6) 55deg,
    rgba(255, 110, 199, 0.4) 85deg,
    transparent 130deg,
    rgba(255, 213, 79, 0.35) 185deg,
    rgba(255, 255, 255, 0.5) 215deg,
    rgba(255, 213, 79, 0.35) 245deg,
    transparent 290deg,
    rgba(186, 104, 200, 0.45) 335deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 24%, black 45%, transparent 80%);
  mask: radial-gradient(circle, transparent 24%, black 45%, transparent 80%);
  box-shadow: 0 0 30px rgba(186, 104, 200, 0.4);
  will-change: transform;
  animation: nebSpinCW 0.55s linear infinite;
}

@keyframes nebSpinCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes nebSpinCCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
}

@keyframes nebRuneIn {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1.15); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1); opacity: 0.9; }
}

@keyframes nebRuneFade {
  0% { opacity: 0.9; }
  100% { opacity: 0; }
}

/* 引导汇聚粒子 - 从四周螺旋汇聚至左上方引导点 */
.neb-gather-particle {
  position: absolute;
  top: 20%;
  left: 14%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 110, 199, 0.8) 50%,
    rgba(123, 31, 162, 0.4) 100%
  );
  box-shadow: 0 0 8px rgba(255, 110, 199, 0.8);
  opacity: 0;
  animation: nebGather 0.32s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes nebGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--neb-gather-angle, 0deg)) translateX(var(--neb-gather-distance, 120px)) scale(1);
    opacity: 0;
  }
  25% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--neb-gather-angle, 0deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段①②：能量凝聚 + 投掷飞行（0.2s ~ 0.7s）---------- */

/* 念气能量弹容器 - 先在引导点凝聚成形，再沿抛物线坠入目标区域 */
.neb-bomb {
  position: absolute;
  top: 20%;
  left: 14%;
  width: 72px;
  height: 72px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: nebBombForm 0.28s cubic-bezier(0.2, 0.8, 0.3, 1) 0.2s forwards,
             nebBombFly 0.25s cubic-bezier(0.35, 0, 0.65, 1) 0.45s forwards;
  will-change: transform, opacity;
  z-index: 6;
}

/* 阶段①：弹体凝聚成形，回弹式放大 */
@keyframes nebBombForm {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  55% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 1; }
  80% { transform: translate3d(-50%, -50%, 0) scale(0.95); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 阶段②：抛物线投掷，先扬后落坠入目标区域中心 */
@keyframes nebBombFly {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
  30% {
    transform: translate3d(calc(-50% + 11vw), calc(-50% - 6vh), 0) scale(1.05);
    opacity: 1;
  }
  55% {
    transform: translate3d(calc(-50% + 20vw), calc(-50% - 6.5vh), 0) scale(1.1);
    opacity: 1;
  }
  80% {
    transform: translate3d(calc(-50% + 29vw), calc(-50% + 12vh), 0) scale(1.18);
    opacity: 1;
  }
  100% {
    transform: translate3d(calc(-50% + 36vw), calc(-50% + 35vh), 0) scale(1.3);
    opacity: 1;
  }
}

/* 彗星尾焰 - 弹体后方拖曳的粉紫流光 */
.neb-bomb-tail {
  position: absolute;
  top: 50%;
  right: 55%;
  width: 90px;
  height: 26px;
  transform: translate3d(0, -50%, 0) rotate(-18deg);
  transform-origin: 100% 50%;
  background: linear-gradient(
    to left,
    rgba(255, 110, 199, 0.85) 0%,
    rgba(186, 104, 200, 0.5) 45%,
    transparent 100%
  );
  filter: blur(3px);
  border-radius: 50%;
  animation: nebTailFlow 0.1s linear infinite alternate;
  will-change: transform, opacity;
}

@keyframes nebTailFlow {
  0% { transform: translate3d(0, -50%, 0) rotate(-18deg) scaleX(0.85); opacity: 0.7; }
  100% { transform: translate3d(0, -50%, 0) rotate(-18deg) scaleX(1.15); opacity: 1; }
}

/* 弹体外层气场 - 灵紫辉光 */
.neb-bomb-aura {
  position: absolute;
  inset: -18%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 110, 199, 0.55) 0%,
    rgba(186, 104, 200, 0.32) 45%,
    transparent 72%
  );
  filter: blur(2px);
  animation: nebAuraPulse 0.14s ease-in-out infinite alternate;
  will-change: transform, opacity;
}

@keyframes nebAuraPulse {
  0% { transform: scale(0.94); opacity: 0.75; }
  100% { transform: scale(1.14); opacity: 1; }
}

/* 弹体核心 - 高亮粉白核心 */
.neb-bomb-core {
  position: absolute;
  inset: 18%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 38% 35%,
    #FFFFFF 0%,
    rgba(255, 255, 255, 0.95) 30%,
    rgba(255, 110, 199, 0.75) 68%,
    rgba(123, 31, 162, 0.35) 100%
  );
  box-shadow:
    0 0 18px rgba(255, 255, 255, 0.9),
    0 0 40px rgba(255, 110, 199, 0.75);
  animation: nebCorePulse 0.12s ease-in-out infinite alternate;
  will-change: transform;
}

@keyframes nebCorePulse {
  0% { transform: scale(0.9); }
  100% { transform: scale(1.1); }
}

/* 双层轨道环 - 交错旋转的能量环 */
.neb-bomb-ring {
  position: absolute;
  inset: -4%;
  border-radius: 50%;
  border: 2px solid transparent;
  will-change: transform;
  backface-visibility: hidden;
}

.neb-bomb-ring.ring-a {
  border-top-color: rgba(255, 255, 255, 0.9);
  border-right-color: rgba(255, 110, 199, 0.6);
  animation: nebSpinCW 0.35s linear infinite;
}

.neb-bomb-ring.ring-b {
  inset: 6%;
  border-bottom-color: rgba(255, 213, 79, 0.75);
  border-left-color: rgba(186, 104, 200, 0.5);
  animation: nebSpinCCW 0.5s linear infinite;
}

/* ---------- 阶段③：落地爆发（0.65s ~ 1.05s）---------- */

/* 落地爆闪 - 能量弹炸裂瞬间的粉白全屏爆闪 */
.neb-impact-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 110, 199, 0.6) 20%,
    rgba(123, 31, 162, 0.3) 52%,
    transparent 82%
  );
  opacity: 0;
  animation: nebImpactFlash 0.45s ease-out 0.65s forwards;
  will-change: opacity;
  z-index: 8;
}

@keyframes nebImpactFlash {
  0%, 100% { opacity: 0; }
  8% { opacity: 1; }
  25% { opacity: 0.45; }
  50% { opacity: 0.65; }
  80% { opacity: 0; }
}

/* 能量穹顶 - 从落点膨胀而出的半球形冲击气浪 */
.neb-dome {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 130px;
  height: 130px;
  border-radius: 50% 50% 50% 50% / 100% 100% 0% 0%;
  background: radial-gradient(
    ellipse at 50% 100%,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(255, 110, 199, 0.55) 35%,
    rgba(186, 104, 200, 0.3) 65%,
    transparent 95%
  );
  box-shadow:
    0 0 30px rgba(255, 110, 199, 0.6),
    0 0 60px rgba(123, 31, 162, 0.4);
  transform: translate3d(-50%, -100%, 0) scale(0);
  transform-origin: 50% 100%;
  opacity: 0;
  animation: nebDome 0.5s cubic-bezier(0.15, 0.7, 0.3, 1) 0.65s forwards;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes nebDome {
  0% {
    transform: translate3d(-50%, -100%, 0) scale(0);
    opacity: 0;
  }
  18% {
    transform: translate3d(-50%, -100%, 0) scale(1.05);
    opacity: 0.95;
  }
  55% {
    transform: translate3d(-50%, -100%, 0) scale(2.1);
    opacity: 0.6;
  }
  100% {
    transform: translate3d(-50%, -100%, 0) scale(3);
    opacity: 0;
  }
}

/* 3层冲击波环 - 从落点沿地面向外扩散，rotateX贴地 */
.neb-shockwave-ring {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.85);
  box-shadow:
    0 0 20px rgba(255, 110, 199, 0.65),
    inset 0 0 16px rgba(186, 104, 200, 0.45);
  transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  backface-visibility: hidden;
  z-index: 9;
}

.neb-shockwave-ring.ring-1 {
  animation: nebShockwaveRing 0.45s ease-out 0.65s forwards;
}

.neb-shockwave-ring.ring-2 {
  border-color: rgba(255, 110, 199, 0.7);
  animation: nebShockwaveRing 0.5s ease-out 0.7s forwards;
}

.neb-shockwave-ring.ring-3 {
  border-color: rgba(255, 213, 79, 0.5);
  animation: nebShockwaveRing 0.55s ease-out 0.75s forwards;
}

@keyframes nebShockwaveRing {
  0% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0);
    opacity: 0;
  }
  12% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(12);
    opacity: 0;
  }
}

/* 6道念气柱 - 落点周围冲天而起的粉紫能量柱 */
.neb-pillar {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 14px;
  height: var(--neb-pillar-h, 100px);
  transform: translate3d(calc(-50% + var(--neb-pillar-x, 0px)), calc(-100% + var(--neb-pillar-y, 0px)), 0) scaleY(0);
  transform-origin: 50% 100%;
  background: linear-gradient(
    to top,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 110, 199, 0.8) 30%,
    rgba(186, 104, 200, 0.55) 65%,
    transparent 100%
  );
  border-radius: 8px;
  box-shadow:
    0 0 14px rgba(255, 110, 199, 0.7),
    0 0 28px rgba(123, 31, 162, 0.45);
  opacity: 0;
  animation: nebPillar 0.42s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
  will-change: transform, opacity;
  z-index: 8;
}

@keyframes nebPillar {
  0% {
    transform: translate3d(calc(-50% + var(--neb-pillar-x, 0px)), calc(-100% + var(--neb-pillar-y, 0px)), 0) scaleY(0);
    opacity: 0;
  }
  22% {
    transform: translate3d(calc(-50% + var(--neb-pillar-x, 0px)), calc(-100% + var(--neb-pillar-y, 0px)), 0) scaleY(1.08);
    opacity: 1;
  }
  60% {
    transform: translate3d(calc(-50% + var(--neb-pillar-x, 0px)), calc(-100% + var(--neb-pillar-y, 0px)), 0) scaleY(0.95);
    opacity: 0.65;
  }
  100% {
    transform: translate3d(calc(-50% + var(--neb-pillar-x, 0px)), calc(-100% + var(--neb-pillar-y, 0px)), 0) scaleY(0.2);
    opacity: 0;
  }
}

/* 地面龟裂 - 落点扩散的念气裂纹 */
.neb-ground-crack {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(255, 110, 199, 0.55) 0deg,
    transparent 40deg,
    rgba(255, 255, 255, 0.6) 90deg,
    transparent 130deg,
    rgba(186, 104, 200, 0.55) 180deg,
    transparent 220deg,
    rgba(255, 213, 79, 0.55) 270deg,
    transparent 310deg,
    rgba(255, 110, 199, 0.55) 360deg
  );
  -webkit-mask: radial-gradient(circle, black 10%, transparent 70%);
  mask: radial-gradient(circle, black 10%, transparent 70%);
  box-shadow: 0 0 40px rgba(186, 104, 200, 0.35);
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: nebGroundCrack 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) 0.67s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes nebGroundCrack {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  25% { opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(2.4); opacity: 0; }
}

/* 16块念气碎片 - 从爆点向外3D飞溅 */
.neb-shard {
  position: absolute;
  top: 52%;
  left: 50%;
  width: var(--neb-shard-size, 6px);
  height: var(--neb-shard-size, 6px);
  border-radius: 40% 60% 50% 40% / 55% 40% 60% 45%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 110, 199, 0.75) 50%,
    rgba(123, 31, 162, 0.35) 100%
  );
  box-shadow: 0 0 6px rgba(255, 110, 199, 0.7);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  backface-visibility: hidden;
  animation: nebShardScatter 0.5s cubic-bezier(0.2, 0.5, 0.4, 1) forwards;
  will-change: transform, opacity;
  z-index: 11;
}

@keyframes nebShardScatter {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; }
  100% {
    transform: translate3d(calc(-50% + var(--neb-shard-tx, 0px)), calc(-50% + var(--neb-shard-ty, 0px)), var(--neb-shard-tz, 0px)) scale(0.3) rotate(180deg);
    opacity: 0;
  }
}

/* ---------- 阶段④：余波消散（1.0s ~ 1.4s）---------- */

/* 上升余烬 - 爆点残留念气缓缓上升消散 */
.neb-ember {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 110, 199, 0.7) 55%,
    rgba(123, 31, 162, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(255, 110, 199, 0.7);
  transform: translate3d(calc(-50% + var(--neb-ember-x, 0px)), -50%, 0) scale(0.8);
  opacity: 0;
  animation: nebEmber 0.4s ease-out forwards;
  will-change: transform, opacity;
  z-index: 10;
}

@keyframes nebEmber {
  0% {
    transform: translate3d(calc(-50% + var(--neb-ember-x, 0px)), -50%, 0) scale(0.8);
    opacity: 0;
  }
  20% { opacity: 0.95; }
  100% {
    transform: translate3d(calc(-50% + var(--neb-ember-x, 0px)), calc(-50% - var(--neb-ember-h, 90px)), 0) scale(0.2);
    opacity: 0;
  }
}

/* 粉辉余韵 - 最后的念气余晖 */
.neb-afterglow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(255, 110, 199, 0.2) 0%,
    rgba(123, 31, 162, 0.1) 45%,
    transparent 80%
  );
  opacity: 0;
  animation: nebAfterglow 0.4s ease-out 1.05s forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes nebAfterglow {
  0% { opacity: 0; }
  25% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .neb-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
