<!--
  @file MoonlightPunishmentEffect.vue
  @generated 2026-07-06
  @description 月光惩戒 - 月华凝聚·月光降下·惩戒冲击·月华消散
  圣职者Q技能（priest_q）：借助月神之力惩戒目标，DeBuff持续期间目标受到的所有伤害增加
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + translateZ深度分层 + rotateX地面倾斜
  动画总时长：1秒（与技能DOT tickInterval一致，每次tick触发同步显示）
    ⓪ 月华凝聚（0s ~ 0.2s）- 夜幕降临 + 银辉汇聚 + 月纹法阵
    ① 月光降下（0.15s ~ 0.5s）- 粗壮月光柱从天而降直劈目标
    ② 惩戒冲击（0.4s ~ 0.7s）- 月华爆闪 + 3层银辉冲击波 + 地面月痕
    ③ 月华消散（0.6s ~ 1.0s）- 月光碎片飞溅 + 银辉余韵消散
  色彩方案：月光银白(#E8F0FF) + 冷月蓝(#B0C4DE) + 纯白(#FFFFFF) + 深夜蓝(#0A0A2E)
-->
<template>
  <!-- 3D舞台 - 透视容器，为月光降下与碎片飞溅提供深度视角 -->
  <div class="mp-3d-stage">
    <!-- ===== 阶段⓪：月华凝聚 ===== -->
    <!-- 夜幕暗幕 - 深蓝覆盖，月光将至 -->
    <div class="mp-dim"></div>

    <!-- 月纹法阵 - 地面旋转的银色月牙召唤阵 -->
    <div class="mp-moon-rune"></div>

    <!-- 银辉汇聚粒子 - 从四周螺旋汇聚至中心 -->
    <div
      v-for="i in 12"
      :key="'mp-gather-' + i"
      class="mp-gather-particle"
      :style="getGatherStyle(i)"
    ></div>

    <!-- ===== 阶段①：月光降下 ===== -->
    <!-- 月光柱外层光晕 - 包裹月光柱的巨大银色发光层 -->
    <div class="mp-beam-glow"></div>

    <!-- 月光柱主体 - 粗壮银白光柱从天而降直劈目标 -->
    <div class="mp-beam-main"></div>

    <!-- 月光柱核心 - 中心纯白高亮核心 -->
    <div class="mp-beam-core"></div>

    <!-- ===== 阶段②：惩戒冲击 ===== -->
    <!-- 月华爆闪 - 月光落地瞬间的银白全屏爆闪 -->
    <div class="mp-impact-flash"></div>

    <!-- 3层银辉冲击波环 - 从中心向外扩散 -->
    <div class="mp-shockwave-ring ring-1"></div>
    <div class="mp-shockwave-ring ring-2"></div>
    <div class="mp-shockwave-ring ring-3"></div>

    <!-- 地面月痕 - 撞击点扩散的月牙形裂纹 -->
    <div class="mp-ground-moon"></div>

    <!-- ===== 阶段③：月华消散 ===== -->
    <!-- 月光碎片 - 从撞击点向外3D飞溅 -->
    <div
      v-for="i in 14"
      :key="'mp-shard-' + i"
      class="mp-shard"
      :style="getShardStyle(i)"
    ></div>

    <!-- 银辉余韵 - 最后的月光消散 -->
    <div class="mp-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 月光惩戒 - 月华凝聚·月光降下·惩戒冲击·月华消散
 * 圣职者Q技能特效组件，以月光银白和冷月蓝为主色调
 * 展现月神之力凝聚、月光柱从天降下惩戒目标的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 * 动画总时长1秒，与技能DOT tickInterval(1s)一致
 */

/**
 * 生成银辉汇聚粒子的样式
 * @param {number} index - 粒子序号（1~12）
 * @returns {Object} CSS样式对象，含角度、距离、尺寸、延迟
 */
function getGatherStyle (index) {
  const angle = (index - 1) * 30 + (index % 2) * 8
  const distance = 120 + (index % 4) * 20
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.008
  return {
    '--mp-gather-angle': `${angle}deg`,
    '--mp-gather-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成月光碎片的3D飞溅样式
 * @param {number} index - 碎片序号（1~14）
 * @returns {Object} CSS样式对象，含飞溅角度、距离、Z轴深度、尺寸、延迟
 */
function getShardStyle (index) {
  const angle = (index - 1) * 25.7 + (index % 2) * 9
  const distance = 60 + (index % 5) * 22
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 12 - (index % 3) * 8
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const tz = depthDir * (30 + (index % 2) * 18)
  const size = 5 + (index % 4) * 4
  const delay = 0.45 + (index % 4) * 0.02
  return {
    '--mp-shard-tx': `${tx}px`,
    '--mp-shard-ty': `${ty}px`,
    '--mp-shard-tz': `${tz}px`,
    '--mp-shard-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   月光惩戒 (moonlight_punishment) - 月华凝聚·月光降下·惩戒冲击·月华消散
   技能描述：借助月神之力惩戒目标，DeBuff持续期间目标受到的所有伤害增加
   3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：1秒（与DOT tickInterval一致）
     ⓪ 月华凝聚（0s ~ 0.2s）- 夜幕降临 + 银辉汇聚 + 月纹法阵
     ① 月光降下（0.15s ~ 0.5s）- 月光柱从天而降直劈目标
     ② 惩戒冲击（0.4s ~ 0.7s）- 月华爆闪 + 3层银辉冲击波 + 地面月痕
     ③ 月华消散（0.6s ~ 1.0s）- 14块月光碎片3D飞溅 + 银辉余韵消散
   ================================================================ */

/* 3D舞台 - 透视容器，为月光降下与碎片飞溅提供深度视角 */
.mp-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 40%;
  transform-style: preserve-3d;
  contain: layout style;
  pointer-events: none;
}

/* ---------- 阶段⓪：月华凝聚（0s ~ 0.2s）---------- */

/* 夜幕暗幕 - 深蓝覆盖，月光将至，全程1s持续覆盖 */
.mp-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 30%,
    rgba(10, 10, 46, 0.5) 0%,
    rgba(5, 5, 30, 0.35) 50%,
    transparent 100%
  );
  animation: mpDim 1s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes mpDim {
  0% { opacity: 0; }
  10% { opacity: 1; }
  40% { opacity: 0.8; }
  75% { opacity: 0.3; }
  100% { opacity: 0; }
}

/* 月纹法阵 - 地面旋转的银色月牙召唤阵 */
.mp-moon-rune {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 280px;
  height: 280px;
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: mpMoonRuneIn 0.2s cubic-bezier(0.2, 0.8, 0.3, 1) forwards,
             mpMoonRuneFade 0.4s ease-out 0.3s forwards;
  will-change: transform, opacity;
  z-index: 2;
}

.mp-moon-rune::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(232, 240, 255, 0.3) 30deg,
    rgba(255, 255, 255, 0.5) 60deg,
    rgba(232, 240, 255, 0.3) 90deg,
    transparent 120deg,
    rgba(176, 196, 222, 0.25) 180deg,
    rgba(232, 240, 255, 0.4) 210deg,
    rgba(176, 196, 222, 0.25) 240deg,
    transparent 270deg,
    rgba(232, 240, 255, 0.3) 330deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 25%, black 45%, transparent 80%);
  mask: radial-gradient(circle, transparent 25%, black 45%, transparent 80%);
  box-shadow: 0 0 30px rgba(200, 220, 255, 0.3);
  will-change: transform;
  animation: mpSpinCW 0.5s linear infinite;
}

@keyframes mpSpinCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes mpMoonRuneIn {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1.15); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1); opacity: 0.9; }
}

@keyframes mpMoonRuneFade {
  0% { opacity: 0.9; }
  100% { opacity: 0; }
}

/* 银辉汇聚粒子 - 从四周螺旋汇聚至中心 */
.mp-gather-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(232, 240, 255, 0.7) 50%,
    rgba(176, 196, 222, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(200, 220, 255, 0.6);
  opacity: 0;
  animation: mpGather 0.2s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes mpGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--mp-gather-angle, 0deg)) translateX(var(--mp-gather-distance, 120px)) scale(1);
    opacity: 0;
  }
  25% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--mp-gather-angle, 0deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段①：月光降下（0.15s ~ 0.5s）---------- */

/* 月光柱外层光晕 - 包裹月光柱的巨大银色发光层 */
.mp-beam-glow {
  position: absolute;
  top: 0;
  left: 50%;
  width: 60px;
  height: 100%;
  transform: translate3d(-50%, 0, 0) scaleX(0);
  background: radial-gradient(
    ellipse at center,
    rgba(232, 240, 255, 0.5) 0%,
    rgba(176, 196, 222, 0.25) 40%,
    transparent 70%
  );
  filter: blur(6px);
  opacity: 0;
  animation: mpBeamGlow 0.35s ease-out 0.15s forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes mpBeamGlow {
  0% { transform: translate3d(-50%, 0, 0) scaleX(0); opacity: 0; }
  20% { transform: translate3d(-50%, 0, 0) scaleX(1); opacity: 1; }
  70% { transform: translate3d(-50%, 0, 0) scaleX(1.2); opacity: 0.6; }
  100% { transform: translate3d(-50%, 0, 0) scaleX(1.5); opacity: 0; }
}

/* 月光柱主体 - 粗壮银白光柱从天而降直劈目标 */
.mp-beam-main {
  position: absolute;
  top: 0;
  left: 50%;
  width: 16px;
  height: 100%;
  transform: translate3d(-50%, 0, 0) scaleY(0);
  transform-origin: 50% 0;
  background: linear-gradient(
    to bottom,
    rgba(232, 240, 255, 0.3) 0%,
    rgba(232, 240, 255, 0.7) 15%,
    rgba(255, 255, 255, 0.95) 40%,
    rgba(232, 240, 255, 0.85) 70%,
    rgba(176, 196, 222, 0.5) 100%
  );
  box-shadow:
    0 0 20px rgba(200, 220, 255, 0.8),
    0 0 40px rgba(176, 196, 222, 0.5);
  opacity: 0;
  animation: mpBeamMain 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) 0.15s forwards;
  will-change: transform, opacity;
  z-index: 6;
}

@keyframes mpBeamMain {
  0% { transform: translate3d(-50%, 0, 0) scaleY(0); opacity: 0; }
  20% { transform: translate3d(-50%, 0, 0) scaleY(1); opacity: 1; }
  60% { transform: translate3d(-50%, 0, 0) scaleY(1); opacity: 0.8; }
  100% { transform: translate3d(-50%, 0, 0) scaleY(1); opacity: 0; }
}

/* 月光柱核心 - 中心纯白高亮核心 */
.mp-beam-core {
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
    rgba(232, 240, 255, 0.6) 100%
  );
  box-shadow: 0 0 12px rgba(255, 255, 255, 1);
  opacity: 0;
  animation: mpBeamCore 0.35s ease-out 0.15s forwards;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes mpBeamCore {
  0% { transform: translate3d(-50%, 0, 0) scaleY(0); opacity: 0; }
  15% { transform: translate3d(-50%, 0, 0) scaleY(1); opacity: 1; }
  60% { transform: translate3d(-50%, 0, 0) scaleY(1); opacity: 0.7; }
  100% { transform: translate3d(-50%, 0, 0) scaleY(1); opacity: 0; }
}

/* ---------- 阶段②：惩戒冲击（0.4s ~ 0.7s）---------- */

/* 月华爆闪 - 月光落地瞬间的银白全屏爆闪 */
.mp-impact-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(232, 240, 255, 0.5) 25%,
    rgba(176, 196, 222, 0.2) 55%,
    transparent 80%
  );
  opacity: 0;
  animation: mpImpactFlash 0.4s ease-out 0.4s forwards;
  will-change: opacity;
  z-index: 8;
}

@keyframes mpImpactFlash {
  0%, 100% { opacity: 0; }
  8% { opacity: 1; }
  25% { opacity: 0.4; }
  50% { opacity: 0.7; }
  80% { opacity: 0; }
}

/* 3层银辉冲击波环 - 从中心向外扩散，rotateX贴地 */
.mp-shockwave-ring {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(232, 240, 255, 0.85);
  box-shadow:
    0 0 20px rgba(200, 220, 255, 0.6),
    inset 0 0 16px rgba(176, 196, 222, 0.4);
  transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  backface-visibility: hidden;
  z-index: 9;
}

.mp-shockwave-ring.ring-1 {
  animation: mpShockwaveRing 0.4s ease-out 0.4s forwards;
}

.mp-shockwave-ring.ring-2 {
  border-color: rgba(176, 196, 222, 0.7);
  animation: mpShockwaveRing 0.45s ease-out 0.44s forwards;
}

.mp-shockwave-ring.ring-3 {
  border-color: rgba(232, 240, 255, 0.5);
  animation: mpShockwaveRing 0.5s ease-out 0.48s forwards;
}

@keyframes mpShockwaveRing {
  0% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0);
    opacity: 0;
  }
  12% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(10);
    opacity: 0;
  }
}

/* 地面月痕 - 撞击点扩散的月牙形裂纹，rotateX贴地 */
.mp-ground-moon {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(232, 240, 255, 0.5) 0deg,
    transparent 40deg,
    rgba(255, 255, 255, 0.6) 90deg,
    transparent 130deg,
    rgba(232, 240, 255, 0.5) 180deg,
    transparent 220deg,
    rgba(255, 255, 255, 0.6) 270deg,
    transparent 310deg,
    rgba(232, 240, 255, 0.5) 360deg
  );
  -webkit-mask: radial-gradient(circle, black 10%, transparent 70%);
  mask: radial-gradient(circle, black 10%, transparent 70%);
  box-shadow: 0 0 40px rgba(200, 220, 255, 0.3);
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: mpGroundMoon 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) 0.42s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes mpGroundMoon {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  25% { opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(2); opacity: 0; }
}

/* ---------- 阶段③：月华消散（0.6s ~ 1.0s）---------- */

/* 月光碎片 - 从撞击点向外3D飞溅 */
.mp-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--mp-shard-size, 6px);
  height: var(--mp-shard-size, 6px);
  border-radius: 40% 60% 50% 40% / 55% 40% 60% 45%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(232, 240, 255, 0.75) 50%,
    rgba(176, 196, 222, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(200, 220, 255, 0.6);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  backface-visibility: hidden;
  animation: mpShardScatter 0.5s cubic-bezier(0.2, 0.5, 0.4, 1) 0.45s forwards;
  will-change: transform, opacity;
  z-index: 10;
}

@keyframes mpShardScatter {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; }
  100% {
    transform: translate3d(calc(-50% + var(--mp-shard-tx, 0px)), calc(-50% + var(--mp-shard-ty, 0px)), var(--mp-shard-tz, 0px)) scale(0.3) rotate(180deg);
    opacity: 0;
  }
}

/* 银辉余韵 - 最后的月光消散 */
.mp-afterglow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(232, 240, 255, 0.2) 0%,
    rgba(176, 196, 222, 0.1) 45%,
    transparent 80%
  );
  opacity: 0;
  animation: mpAfterglow 0.5s ease-out 0.55s forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes mpAfterglow {
  0% { opacity: 0; }
  25% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .mp-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
