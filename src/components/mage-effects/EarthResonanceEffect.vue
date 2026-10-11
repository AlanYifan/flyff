<!--
  @file EarthResonanceEffect.vue
  @generated 2026-07-03
  @description 大地共鸣 - 冲击波·涟漪震荡·碎石飞溅·烟尘蔓延
  骑士Q技能（Power Stomp）：打击地面制造冲击波攻击周围敌人，一定几率击晕附近敌人
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
  动画总时长：2秒（显示1秒 + 移除1秒）
    ① 砸地冲击（0s ~ 0.5s）- 暗幕降临 + 多层冲击波环扩散 + 涟漪震荡
    ② 碎石飞溅（0.1s ~ 0.8s）- 碎石从中心向四周飞溅
    ③ 烟尘蔓延（0.3s ~ 2.0s）- 烟尘云层向外蔓延扩散 + 尘埃飘升 + 整体渐隐消散
-->
<template>
  <!-- 3D舞台 - 透视容器，为大地共鸣提供3D空间深度 -->
  <div class="er-3d-stage">
    <!-- 大地暗幕 - 褐色暖光笼罩，营造大地震动的压迫氛围 -->
    <div class="er-dim"></div>

    <!-- 地面层 - 3D倾斜地面平面，冲击波与涟漪的容器 -->
    <div class="er-ground-plane">
      <!-- 冲击波环 - 从中心向外扩散的多层大地冲击波（border环） -->
      <div class="er-shockwave wave-1"></div>
      <div class="er-shockwave wave-2"></div>
      <div class="er-shockwave wave-3"></div>
      <div class="er-shockwave wave-4"></div>
      <div class="er-shockwave wave-5"></div>

      <!-- 涟漪冲击波 - 砸击地面的同心圆涟漪扩散，渐变填充模拟地面波纹 -->
      <div class="er-ripple ripple-1"></div>
      <div class="er-ripple ripple-2"></div>
      <div class="er-ripple ripple-3"></div>
      <div class="er-ripple ripple-4"></div>
      <div class="er-ripple ripple-5"></div>

      <!-- 地面烟尘云 - 从中心向外蔓延扩散的大面积贴地烟尘 -->
      <div
        v-for="i in 8"
        :key="'er-ground-smoke-' + i"
        class="er-ground-smoke"
        :style="getGroundSmokeStyle(i)"
      ></div>
    </div>

    <!-- 碎石飞溅 - 从中心向四周飞溅的岩石碎片 -->
    <div
      v-for="i in 18"
      :key="'er-debris-' + i"
      class="er-debris"
      :style="getDebrisStyle(i)"
    ></div>

    <!-- 尘埃粒子 - 向上飘升的大地尘埃 -->
    <div
      v-for="i in 20"
      :key="'er-dust-' + i"
      class="er-dust"
      :style="getDustStyle(i)"
    ></div>

    <!-- 前景烟尘蔓延云团 - 从中心向四周蔓延扩散的大型烟尘云 -->
    <div
      v-for="i in 10"
      :key="'er-smoke-' + i"
      class="er-smoke"
      :style="getSmokeStyle(i)"
    ></div>
  </div>
</template>

<script setup>
/**
 * 大地共鸣 - 冲击波·涟漪震荡·碎石飞溅·烟尘蔓延
 * 骑士Q技能（Power Stomp）AOE特效组件
 * 打击地面制造冲击波攻击周围敌人，一定几率击晕附近敌人
 * 动画总时长2秒：显示阶段1秒 + 移除渐隐1秒
 * 效果范围较初版增大50%
 * 色彩方案：琥珀棕(#C4A35A) + 深褐(#8B7355) + 沙土色(#DEB887)
 */

/** 范围放大系数（1.5 = 增大50%） */
const SCALE_FACTOR = 1.5

/**
 * 计算碎石飞溅的样式
 * 每块碎石从中心向四周飞溅，带重力下落效果
 * @param {number} index - 碎石索引（1~18）
 * @returns {Object} CSS自定义属性对象
 */
function getDebrisStyle (index) {
  const angle = (index - 1) * 20 + (index % 2) * 10
  const rad = (angle * Math.PI) / 180
  const distance = (50 + (index % 4) * 25) * SCALE_FACTOR
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance * 0.5 - 30 * SCALE_FACTOR
  const fallY = (40 + (index % 3) * 20) * SCALE_FACTOR
  const size = Math.round((6 + (index % 3) * 5) * SCALE_FACTOR)
  const delay = 0.1 + (index % 5) * 0.03
  return {
    '--er-debris-tx': `${tx}px`,
    '--er-debris-ty': `${ty}px`,
    '--er-debris-fall': `${fallY}px`,
    '--er-debris-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算尘埃粒子的样式
 * 每个尘埃粒子从地面附近向上飘升，模拟地震扬尘
 * @param {number} index - 尘埃索引（1~20）
 * @returns {Object} CSS自定义属性对象
 */
function getDustStyle (index) {
  const angle = (index - 1) * 18 + (index % 3) * 6
  const rad = (angle * Math.PI) / 180
  const startRadius = (25 + (index % 4) * 15) * SCALE_FACTOR
  const startX = Math.cos(rad) * startRadius
  const startY = Math.sin(rad) * startRadius * 0.3
  const driftX = ((index % 2 === 0) ? 1 : -1) * (12 + (index % 3) * 8) * SCALE_FACTOR
  const riseY = -(80 + (index % 5) * 20) * SCALE_FACTOR
  const size = Math.round((5 + (index % 3) * 4) * SCALE_FACTOR)
  const delay = 0.1 + (index % 6) * 0.03
  return {
    '--er-dust-start-x': `${startX}px`,
    '--er-dust-start-y': `${startY}px`,
    '--er-dust-drift-x': `${driftX}px`,
    '--er-dust-rise-y': `${riseY}px`,
    '--er-dust-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算地面烟尘云的样式（3D地面层）
 * 每团烟尘从中心向外蔓延扩散，贴地滚动
 * @param {number} index - 烟尘云索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getGroundSmokeStyle (index) {
  const angle = (index - 1) * 45 + (index % 2) * 10
  const rad = (angle * Math.PI) / 180
  const distance = (120 + (index % 3) * 40) * SCALE_FACTOR
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance * 0.4
  const size = Math.round((100 + (index % 3) * 50) * SCALE_FACTOR)
  const delay = 0.2 + (index % 3) * 0.06
  return {
    '--er-gsmoke-tx': `${tx}px`,
    '--er-gsmoke-ty': `${ty}px`,
    '--er-gsmoke-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算前景烟尘蔓延云团的样式（2D前景层）
 * 每团烟尘从中心向指定方向蔓延扩散，由小变大、由浓变淡
 * @param {number} index - 烟尘云索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getSmokeStyle (index) {
  const angle = (index - 1) * 36 + (index % 2) * 8
  const rad = (angle * Math.PI) / 180
  const distance = (80 + (index % 4) * 30) * SCALE_FACTOR
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance * 0.5 - 10 * SCALE_FACTOR
  const size = Math.round((60 + (index % 3) * 40) * SCALE_FACTOR)
  const delay = 0.15 + (index % 4) * 0.05
  return {
    '--er-smoke-tx': `${tx}px`,
    '--er-smoke-ty': `${ty}px`,
    '--er-smoke-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   大地共鸣 (knight_q) - 冲击波·涟漪震荡·碎石飞溅·烟尘蔓延
   技能描述：打击地面制造冲击波攻击周围敌人，一定几率击晕附近敌人
   色彩方案：琥珀棕(#C4A35A) + 深褐(#8B7355) + 沙土色(#DEB887)
   3D技术：perspective透视 + rotateX地面倾斜
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：2秒（显示1秒 + 移除渐隐1秒）
   效果范围较初版增大50%
   ================================================================ */

/* 3D舞台 - 透视容器，为大地共鸣提供3D空间深度
   1秒后整体开始淡出，2秒完全移除 */
.er-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
  animation: er-stage-fade 2s ease-out forwards;
}
@keyframes er-stage-fade {
  0%   { opacity: 1; }
  50%  { opacity: 1; }
  100% { opacity: 0; }
}

/* 大地暗幕 - 褐色暖光笼罩，营造大地震动的压迫氛围 */
.er-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 60%,
    rgba(60, 40, 10, 0.55) 0%,
    rgba(40, 25, 5, 0.35) 40%,
    rgba(20, 12, 0, 0.15) 75%,
    transparent 100%
  );
  animation: er-dim 1.5s ease-out forwards;
  will-change: opacity;
}
@keyframes er-dim {
  0%   { opacity: 0; }
  10%  { opacity: 1; }
  50%  { opacity: 0.5; }
  100% { opacity: 0; }
}

/* ---------- 地面层 - 3D倾斜平面 ---------- */

.er-ground-plane {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%) rotateX(72deg);
  transform-style: preserve-3d;
}

/* ---------- 阶段①：砸地冲击（0s ~ 0.5s）---------- */

/* 冲击波环 - 从中心向外扩散的多层大地冲击波（border环）
   范围增大50%：scale终值从9→13.5 */
.er-shockwave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(196, 163, 90, 0.8);
  box-shadow:
    0 0 20px rgba(180, 140, 50, 0.6),
    inset 0 0 15px rgba(210, 170, 80, 0.4);
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
  opacity: 0;
}
.er-shockwave.wave-1 {
  animation: er-shock 0.6s ease-out 0.05s forwards;
}
.er-shockwave.wave-2 {
  border-color: rgba(222, 184, 135, 0.7);
  animation: er-shock 0.7s ease-out 0.12s forwards;
}
.er-shockwave.wave-3 {
  border-color: rgba(255, 200, 50, 0.6);
  animation: er-shock 0.7s ease-out 0.2s forwards;
}
.er-shockwave.wave-4 {
  border-color: rgba(180, 140, 50, 0.5);
  animation: er-shock 0.8s ease-out 0.28s forwards;
}
.er-shockwave.wave-5 {
  border-color: rgba(160, 110, 30, 0.4);
  animation: er-shock 0.8s ease-out 0.36s forwards;
}
@keyframes er-shock {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(13.5);
    opacity: 0;
  }
}

/* 涟漪冲击波 - 砸击地面的同心圆涟漪扩散
   渐变填充模拟地面起伏波纹，范围增大50%：scale终值从10→15 */
.er-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 0%,
    transparent 55%,
    rgba(210, 170, 80, 0.5) 62%,
    rgba(180, 140, 50, 0.35) 70%,
    rgba(140, 100, 30, 0.15) 80%,
    transparent 92%
  );
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
  opacity: 0;
}
.er-ripple.ripple-1 {
  animation: er-ripple 0.8s ease-out 0.05s forwards;
}
.er-ripple.ripple-2 {
  animation: er-ripple 0.9s ease-out 0.15s forwards;
}
.er-ripple.ripple-3 {
  animation: er-ripple 1s ease-out 0.25s forwards;
}
.er-ripple.ripple-4 {
  animation: er-ripple 1s ease-out 0.35s forwards;
}
.er-ripple.ripple-5 {
  animation: er-ripple 1.1s ease-out 0.45s forwards;
}
@keyframes er-ripple {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  60% {
    opacity: 0.4;
  }
  100% {
    transform: translate(-50%, -50%) scale(15);
    opacity: 0;
  }
}

/* ---------- 阶段②：碎石飞溅（0.1s ~ 0.8s）---------- */

/* 碎石飞溅 - 从中心向四周飞溅的岩石碎片，带重力下落 */
.er-debris {
  position: absolute;
  top: 55%;
  left: 50%;
  width: var(--er-debris-size, 12px);
  height: var(--er-debris-size, 12px);
  border-radius: 40% 60% 50% 45%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(200, 170, 110, 0.95),
    rgba(100, 75, 40, 0.9)
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: er-debris 0.7s cubic-bezier(0.3, 0.7, 0.5, 1) forwards;
  will-change: transform, opacity;
  box-shadow: 0 0 4px rgba(160, 120, 50, 0.4);
}
@keyframes er-debris {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
    opacity: 0;
  }
  12% {
    transform: translate3d(-50%, -50%, 0) scale(1.2) rotate(45deg);
    opacity: 1;
  }
  50% {
    transform: translate3d(
      calc(-50% + var(--er-debris-tx, 0px) * 0.7),
      calc(-50% + var(--er-debris-ty, 0px)),
      0
    ) scale(1) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--er-debris-tx, 0px)),
      calc(-50% + var(--er-debris-ty, 0px) + var(--er-debris-fall, 0px)),
      0
    ) scale(0.3) rotate(360deg);
    opacity: 0;
  }
}

/* ---------- 阶段③：烟尘蔓延（0.2s ~ 2.0s）---------- */

/* 尘埃粒子 - 向上飘升的大地尘埃 */
.er-dust {
  position: absolute;
  top: 55%;
  left: 50%;
  width: var(--er-dust-size, 9px);
  height: var(--er-dust-size, 9px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(220, 190, 130, 0.8) 0%,
    rgba(180, 140, 60, 0.5) 45%,
    rgba(140, 100, 30, 0.2) 100%
  );
  box-shadow: 0 0 6px rgba(200, 160, 60, 0.4);
  transform: translate3d(
    calc(-50% + var(--er-dust-start-x, 0px)),
    calc(-50% + var(--er-dust-start-y, 0px)),
    0
  ) scale(0);
  animation: er-dust 1.2s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes er-dust {
  0% {
    transform: translate3d(
      calc(-50% + var(--er-dust-start-x, 0px)),
      calc(-50% + var(--er-dust-start-y, 0px)),
      0
    ) scale(0);
    opacity: 0;
  }
  12% {
    transform: translate3d(
      calc(-50% + var(--er-dust-start-x, 0px)),
      calc(-50% + var(--er-dust-start-y, 0px)),
      0
    ) scale(1.2);
    opacity: 1;
  }
  80% {
    opacity: 0.3;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--er-dust-start-x, 0px) + var(--er-dust-drift-x, 0px)),
      calc(-50% + var(--er-dust-start-y, 0px) + var(--er-dust-rise-y, 0px)),
      0
    ) scale(0.2);
    opacity: 0;
  }
}

/* 地面烟尘云（3D地面层）- 从中心向外蔓延扩散的大面积贴地烟尘
   范围增大50%：扩散距离和尺寸均乘以1.5 */
.er-ground-smoke {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--er-gsmoke-size, 180px);
  height: var(--er-gsmoke-size, 180px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(160, 130, 80, 0.5) 0%,
    rgba(120, 95, 50, 0.35) 35%,
    rgba(90, 70, 35, 0.2) 65%,
    transparent 85%
  );
  filter: blur(10px);
  transform: translate(-50%, -50%) scale(0);
  animation: er-ground-smoke 1.6s ease-out forwards;
  will-change: transform, opacity;
  opacity: 0;
}
@keyframes er-ground-smoke {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  12% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0.8;
  }
  35% {
    transform: translate3d(
      calc(-50% + var(--er-gsmoke-tx, 0px) * 0.5),
      calc(-50% + var(--er-gsmoke-ty, 0px) * 0.5),
      0
    ) scale(1.2);
    opacity: 0.6;
  }
  65% {
    transform: translate3d(
      calc(-50% + var(--er-gsmoke-tx, 0px)),
      calc(-50% + var(--er-gsmoke-ty, 0px)),
      0
    ) scale(1.8);
    opacity: 0.3;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--er-gsmoke-tx, 0px)),
      calc(-50% + var(--er-gsmoke-ty, 0px)),
      0
    ) scale(2.5);
    opacity: 0;
  }
}

/* 前景烟尘蔓延云团（2D前景层）- 从中心向四周蔓延扩散的大型烟尘云
   范围增大50%：扩散距离和尺寸均乘以1.5 */
.er-smoke {
  position: absolute;
  top: 55%;
  left: 50%;
  width: var(--er-smoke-size, 120px);
  height: var(--er-smoke-size, 120px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(180, 150, 100, 0.45) 0%,
    rgba(140, 110, 60, 0.3) 35%,
    rgba(100, 75, 40, 0.15) 65%,
    transparent 85%
  );
  filter: blur(12px);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: er-smoke-spread 1.6s ease-out forwards;
  will-change: transform, opacity;
  opacity: 0;
}
@keyframes er-smoke-spread {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  10% {
    transform: translate3d(-50%, -50%, 0) scale(0.6);
    opacity: 0.8;
  }
  30% {
    transform: translate3d(
      calc(-50% + var(--er-smoke-tx, 0px) * 0.5),
      calc(-50% + var(--er-smoke-ty, 0px) * 0.5),
      0
    ) scale(1.2);
    opacity: 0.6;
  }
  60% {
    transform: translate3d(
      calc(-50% + var(--er-smoke-tx, 0px)),
      calc(-50% + var(--er-smoke-ty, 0px)),
      0
    ) scale(1.8);
    opacity: 0.35;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--er-smoke-tx, 0px) * 1.3),
      calc(-50% + var(--er-smoke-ty, 0px) * 1.3),
      0
    ) scale(2.5);
    opacity: 0;
  }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .er-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
