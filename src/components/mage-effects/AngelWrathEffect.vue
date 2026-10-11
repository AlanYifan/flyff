<!--
  @file AngelWrathEffect.vue
  @generated 2026-07-29
  @description 天使之怒 - 天使降临·神圣光柱·光翼展开·圣光爆发·余韵消散
  炽天使U技能（nature_messenger_u）：凝聚天使之力化为神圣光柱，对范围内敌人造成神圣伤害并恢复全队生命值
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
  动画总时长：2.4秒（AOE覆盖整个怪物显示区域）
    ⓪ 天使降临（0s ~ 0.5s）- 天使暗幕 + 全屏圣光闪 + 能量汇聚
    ① 神圣光柱（0.3s ~ 1.0s）- 粗壮金色光柱从天而降 + 光柱波纹
    ② 光翼展开（0.5s ~ 1.2s）- 天使光翼从中心展开 + 羽毛光屑飞散
    ③ 圣光爆发（0.7s ~ 1.6s）- 中心光爆 + 冲击波环 + 神圣碎片3D飞溅 + 治愈粒子上升
    ④ 余韵消散（1.4s ~ 2.4s）- 光柱消散 + 圣光余韵上升
  色彩方案：神圣金(#FFD700) + 天使之白(#FFFEF0) + 治愈翠(#50C878) + 暖光(#FFF8DC)
-->
<template>
  <!-- 3D舞台 - 透视容器，为天使降临与碎片飞溅提供深度视角 -->
  <div class="aw-3d-stage">
    <!-- ===== 阶段⓪：天使降临 ===== -->
    <!-- 天使暗幕 - 金色暖光笼罩，营造天使降临的神圣氛围 -->
    <div class="aw-dim"></div>

    <!-- 全屏圣光闪 - 天使降临瞬间的金白色爆闪 -->
    <div class="aw-flash"></div>

    <!-- 能量汇聚粒子 - 从四周向中心螺旋汇聚 -->
    <div
      v-for="i in 12"
      :key="'aw-gather-' + i"
      class="aw-gather"
      :style="getGatherStyle(i)"
    ></div>

    <!-- ===== 阶段①：神圣光柱 ===== -->
    <!-- 粗壮金色光柱 - 从天而降的神圣光柱 -->
    <div class="aw-beam">
      <div class="aw-beam-core"></div>
      <div class="aw-beam-glow"></div>
      <div class="aw-beam-waves">
        <div
          v-for="i in 5"
          :key="'aw-beam-wave-' + i"
          class="aw-beam-wave"
          :style="{ animationDelay: `${(i - 1) * 0.06}s` }"
        ></div>
      </div>
    </div>

    <!-- ===== 阶段②：光翼展开 ===== -->
    <!-- 天使光翼 - 从中心展开的六翼天使光翼 -->
    <div class="aw-wings">
      <div class="aw-wing wing-left"></div>
      <div class="aw-wing wing-right"></div>
      <div class="aw-wing wing-upper-left"></div>
      <div class="aw-wing wing-upper-right"></div>
      <div class="aw-wing wing-lower-left"></div>
      <div class="aw-wing wing-lower-right"></div>
    </div>

    <!-- 羽毛光屑 - 从光翼飘散的金色羽毛碎片 -->
    <div
      v-for="i in 12"
      :key="'aw-feather-' + i"
      class="aw-feather"
      :style="getFeatherStyle(i)"
    ></div>

    <!-- ===== 阶段③：圣光爆发 ===== -->
    <!-- 地面层 - 3D倾斜地面平面 -->
    <div class="aw-ground-plane">
      <!-- 神圣法阵 - 地面展开的旋转法阵 -->
      <div class="aw-magic-circle">
        <div class="aw-circle-outer"></div>
        <div class="aw-circle-mid"></div>
      </div>

      <!-- 圣环扩散 - 从中心向外扩散的光环 -->
      <div class="aw-ring ring-1"></div>
      <div class="aw-ring ring-2"></div>
      <div class="aw-ring ring-3"></div>
    </div>

    <!-- 中心光爆 - 巨大金色光球爆发 -->
    <div class="aw-burst"></div>

    <!-- 冲击波环 - 从中心向外扩散的金色光环 -->
    <div class="aw-shockwave sw-1"></div>
    <div class="aw-shockwave sw-2"></div>

    <!-- 神圣碎片 - 从中心向外3D飞溅 -->
    <div
      v-for="i in 16"
      :key="'aw-shard-' + i"
      class="aw-shard"
      :style="getShardStyle(i)"
    ></div>

    <!-- 治愈粒子 - 从地面向上飘升的翠绿光粒 -->
    <div
      v-for="i in 10"
      :key="'aw-heal-' + i"
      class="aw-heal-particle"
      :style="getHealStyle(i)"
    ></div>

    <!-- ===== 阶段④：余韵消散 ===== -->
    <!-- 圣光余韵 - 最后的光芒消散 -->
    <div class="aw-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 天使之怒 - 天使降临·神圣光柱·光翼展开·圣光爆发·余韵消散
 * 炽天使U技能（nature_messenger_u）AOE特效组件
 * 凝聚天使之力化为神圣光柱，对范围内敌人造成神圣伤害并恢复全队生命值
 * 以神圣金和天使之白为主色调，展现天使降临光翼展开与圣光爆发的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 * 动画总时长2.4秒，覆盖整个怪物显示区域
 */

/**
 * 计算能量汇聚粒子的样式
 * 每个粒子从四周螺旋向中心汇聚
 * @param {number} index - 粒子索引（1~12）
 * @returns {Object} CSS自定义属性对象
 */
function getGatherStyle (index) {
  const angle = (index - 1) * 30 + (index % 2) * 8
  const distance = 120 + (index % 4) * 20
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.02
  return {
    '--aw-gather-angle': `${angle}deg`,
    '--aw-gather-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算羽毛光屑的飘散样式
 * 每个羽毛从光翼位置向四周飘散
 * @param {number} index - 羽毛索引（1~12）
 * @returns {Object} CSS自定义属性对象
 */
function getFeatherStyle (index) {
  const angle = (index - 1) * 30 + (index % 2) * 10
  const rad = (angle * Math.PI) / 180
  // 范围增大3倍：60→180，20→60
  const distance = 180 + (index % 4) * 60
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance * 0.4 - 20
  const rotation = (index % 2 === 0 ? 1 : -1) * (45 + index * 15)
  const size = 8 + (index % 3) * 5
  const delay = 0.6 + (index % 6) * 0.04
  return {
    '--aw-feather-tx': `${tx}px`,
    '--aw-feather-ty': `${ty}px`,
    '--aw-feather-rotate': `${rotation}deg`,
    '--aw-feather-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算神圣碎片的3D飞溅样式
 * @param {number} index - 碎片索引（1~16）
 * @returns {Object} CSS样式对象
 */
function getShardStyle (index) {
  const angle = (index - 1) * 22.5 + (index % 2) * 8
  // 范围增大3倍：70→210，25→75
  const distance = 210 + (index % 5) * 75
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 45 - (index % 3) * 30
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  // 范围增大3倍：30→90，20→60
  const tz = depthDir * (90 + (index % 2) * 60)
  const size = 6 + (index % 4) * 5
  const delay = 0.75 + (index % 4) * 0.02
  return {
    '--aw-shard-tx': `${tx}px`,
    '--aw-shard-ty': `${ty}px`,
    '--aw-shard-tz': `${tz}px`,
    '--aw-shard-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算治愈粒子的上浮样式
 * @param {number} index - 粒子索引（1~10）
 * @returns {Object} CSS样式对象
 */
function getHealStyle (index) {
  // 范围增大3倍：20→60，15→45，70→210，30→90
  const tx = (index % 2 === 0 ? 1 : -1) * (60 + (index % 4) * 45)
  const ty = -210 - (index % 3) * 90
  const size = 4 + (index % 3) * 3
  const delay = 1.0 + (index % 5) * 0.06
  return {
    '--aw-heal-tx': `${tx}px`,
    '--aw-heal-ty': `${ty}px`,
    '--aw-heal-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   天使之怒 (nature_messenger_u) - 天使降临·神圣光柱·光翼展开·圣光爆发·余韵消散
   技能描述：凝聚天使之力化为神圣光柱，对范围内敌人造成神圣伤害并恢复全队生命值
   色彩方案：神圣金(#FFD700) + 天使之白(#FFFEF0) + 治愈翠(#50C878) + 暖光(#FFF8DC)
   3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   动画总时长：2.4秒
   ================================================================ */

/* 3D舞台 - 透视容器 */
.aw-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
  pointer-events: none;
}

/* ---------- 阶段⓪：天使降临（0s ~ 0.5s）---------- */

/* 天使暗幕 */
.aw-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 35%,
    rgba(65, 50, 5, 0.5) 0%,
    rgba(40, 30, 0, 0.3) 45%,
    transparent 100%
  );
  animation: aw-dim 2.4s ease-out forwards;
  will-change: opacity;
}

@keyframes aw-dim {
  0%   { opacity: 0; }
  8%   { opacity: 1; }
  50%  { opacity: 0.6; }
  100% { opacity: 0; }
}

/* 全屏圣光闪 */
.aw-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(255, 250, 220, 0.9) 0%,
    rgba(255, 220, 120, 0.5) 25%,
    rgba(255, 180, 50, 0.25) 50%,
    transparent 75%
  );
  opacity: 0;
  animation: aw-flash 0.8s ease-out forwards;
  will-change: opacity;
}

@keyframes aw-flash {
  0%, 100% { opacity: 0; }
  5%  { opacity: 1; }
  12% { opacity: 0.3; }
  20% { opacity: 0.8; }
  40% { opacity: 0.2; }
  80% { opacity: 0; }
}

/* 能量汇聚粒子 */
.aw-gather {
  position: absolute;
  top: 45%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 240, 0.95) 0%,
    rgba(255, 215, 0, 0.7) 50%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
  opacity: 0;
  animation: aw-gather 0.4s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
}

@keyframes aw-gather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--aw-gather-angle, 0deg)) translateX(var(--aw-gather-distance, 120px)) scale(1);
    opacity: 0;
  }
  25% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--aw-gather-angle, 0deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段①：神圣光柱（0.3s ~ 1.0s）---------- */

/* 粗壮金色光柱 */
.aw-beam {
  position: absolute;
  top: 0;
  left: 50%;
  width: 80px;
  height: 100%;
  transform: translateX(-50%);
  animation: aw-beam 1s ease-out 0.3s forwards;
  will-change: opacity, transform;
}

@keyframes aw-beam {
  0% {
    transform: translateX(-50%) scaleY(0);
    transform-origin: top center;
    opacity: 0;
  }
  15% {
    transform: translateX(-50%) scaleY(1);
    opacity: 1;
  }
  50% {
    transform: translateX(-50%) scaleY(1);
    opacity: 0.7;
  }
  100% {
    transform: translateX(-50%) scaleY(1);
    opacity: 0;
  }
}

.aw-beam-core {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 240, 1) 0%,
    rgba(255, 235, 160, 0.95) 20%,
    rgba(255, 210, 80, 0.85) 50%,
    rgba(255, 190, 40, 0.6) 80%,
    rgba(255, 170, 20, 0.3) 100%
  );
  border-radius: 50% 50% 20% 20%;
  box-shadow:
    0 0 30px rgba(255, 220, 100, 0.9),
    0 0 60px rgba(255, 190, 50, 0.6),
    0 0 100px rgba(255, 160, 20, 0.3);
}

.aw-beam-glow {
  position: absolute;
  inset: -30px -60px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 220, 100, 0.35) 0%,
    rgba(255, 180, 40, 0.18) 40%,
    transparent 70%
  );
  filter: blur(12px);
}

.aw-beam-waves {
  position: absolute;
  inset: 0;
}

.aw-beam-wave {
  position: absolute;
  top: 0;
  left: 50%;
  width: 60px;
  height: 20px;
  transform: translateX(-50%);
  background: radial-gradient(
    ellipse,
    rgba(255, 255, 240, 0.7) 0%,
    rgba(255, 220, 100, 0.35) 50%,
    transparent 100%
  );
  filter: blur(3px);
  animation: aw-beam-wave 0.6s ease-in forwards;
  will-change: transform, opacity;
}

@keyframes aw-beam-wave {
  0% {
    transform: translateX(-50%) translateY(0) scale(1);
    opacity: 0;
  }
  10% { opacity: 1; }
  100% {
    transform: translateX(-50%) translateY(400px) scale(1.5);
    opacity: 0;
  }
}

/* ---------- 阶段②：光翼展开（0.5s ~ 1.2s）---------- */

/* 天使光翼 - 六翼天使光翼从中心展开 */
.aw-wings {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  transform: translate(-50%, -50%) scale(0);
  animation: aw-wings-appear 0.5s ease-out 0.5s forwards,
             aw-wings-fade 0.4s ease-out 1.2s forwards;
  will-change: transform, opacity;
}

@keyframes aw-wings-appear {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  60% {
    transform: translate(-50%, -50%) scale(1.15);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.9;
  }
}

@keyframes aw-wings-fade {
  0% { opacity: 0.9; }
  100% { opacity: 0; }
}

/* 单个光翼 - 水滴形发光翼片（范围增大3倍：120→360，30→90） */
.aw-wing {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 360px;
  height: 90px;
  transform-origin: 0% 50%;
  background: linear-gradient(
    to right,
    rgba(255, 255, 240, 0.9) 0%,
    rgba(255, 235, 160, 0.7) 30%,
    rgba(255, 215, 0, 0.4) 60%,
    transparent 100%
  );
  clip-path: polygon(0% 50%, 30% 0%, 80% 15%, 100% 50%, 80% 85%, 30% 100%);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
  filter: blur(2px);
  will-change: transform, opacity;
}

.aw-wing.wing-left {
  transform: translate(0, -50%) rotate(180deg) scaleX(0);
  animation: aw-wing-left 0.5s ease-out 0.5s forwards;
}

.aw-wing.wing-right {
  transform: translate(0, -50%) scaleX(0);
  animation: aw-wing-right 0.5s ease-out 0.5s forwards;
}

.aw-wing.wing-upper-left {
  width: 270px;
  transform: translate(0, -50%) rotate(200deg) scaleX(0);
  animation: aw-wing-upper-left 0.5s ease-out 0.55s forwards;
}

.aw-wing.wing-upper-right {
  width: 270px;
  transform: translate(0, -50%) rotate(-20deg) scaleX(0);
  animation: aw-wing-upper-right 0.5s ease-out 0.55s forwards;
}

.aw-wing.wing-lower-left {
  width: 240px;
  transform: translate(0, -50%) rotate(160deg) scaleX(0);
  animation: aw-wing-lower-left 0.5s ease-out 0.6s forwards;
}

.aw-wing.wing-lower-right {
  width: 240px;
  transform: translate(0, -50%) rotate(20deg) scaleX(0);
  animation: aw-wing-lower-right 0.5s ease-out 0.6s forwards;
}

@keyframes aw-wing-left {
  0% { transform: translate(0, -50%) rotate(180deg) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) rotate(180deg) scaleX(1); opacity: 0.8; }
}

@keyframes aw-wing-right {
  0% { transform: translate(0, -50%) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) scaleX(1); opacity: 0.8; }
}

@keyframes aw-wing-upper-left {
  0% { transform: translate(0, -50%) rotate(200deg) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) rotate(200deg) scaleX(1); opacity: 0.7; }
}

@keyframes aw-wing-upper-right {
  0% { transform: translate(0, -50%) rotate(-20deg) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) rotate(-20deg) scaleX(1); opacity: 0.7; }
}

@keyframes aw-wing-lower-left {
  0% { transform: translate(0, -50%) rotate(160deg) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) rotate(160deg) scaleX(1); opacity: 0.6; }
}

@keyframes aw-wing-lower-right {
  0% { transform: translate(0, -50%) rotate(20deg) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) rotate(20deg) scaleX(1); opacity: 0.6; }
}

/* 羽毛光屑 - 从光翼飘散的金色羽毛碎片 */
.aw-feather {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--aw-feather-size, 10px);
  height: calc(var(--aw-feather-size, 10px) * 0.4);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 240, 0.9) 0%,
    rgba(255, 215, 0, 0.6) 50%,
    transparent 100%
  );
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: aw-feather-drift 1s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes aw-feather-drift {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) scale(1.3) rotate(30deg);
    opacity: 1;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--aw-feather-tx, 0px)),
      calc(-50% + var(--aw-feather-ty, 0px)),
      0
    ) scale(0.2) rotate(var(--aw-feather-rotate, 0deg));
    opacity: 0;
  }
}

/* ---------- 阶段③：圣光爆发（0.7s ~ 1.6s）---------- */

/* 地面层 - 3D倾斜平面 */
.aw-ground-plane {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%) rotateX(72deg);
  transform-style: preserve-3d;
}

/* 神圣法阵（范围增大3倍：280→840） */
.aw-magic-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 840px;
  height: 840px;
  transform: translate(-50%, -50%) scale(0);
  animation: aw-circle-appear 0.4s ease-out 0.5s forwards,
             aw-circle-fade 0.4s ease-out 1.3s forwards;
  will-change: transform, opacity;
}

@keyframes aw-circle-appear {
  0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
  60% { transform: translate(-50%, -50%) scale(1.1) rotate(30deg); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1) rotate(45deg); opacity: 1; }
}

@keyframes aw-circle-fade {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

.aw-circle-outer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid rgba(255, 215, 0, 0.8);
  box-shadow: 0 0 20px rgba(255, 200, 50, 0.6), inset 0 0 20px rgba(255, 215, 0, 0.3);
  background: repeating-conic-gradient(from 0deg, transparent 0deg, rgba(255, 220, 100, 0.15) 2deg, transparent 4deg, transparent 12deg);
  animation: aw-spin-cw 3s linear 0.5s infinite;
  will-change: transform;
}

.aw-circle-mid {
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  border: 2px solid rgba(255, 230, 120, 0.7);
  box-shadow: 0 0 15px rgba(255, 210, 60, 0.5), inset 0 0 15px rgba(255, 230, 120, 0.2);
  animation: aw-spin-ccw 2.5s linear 0.5s infinite;
  will-change: transform;
}

@keyframes aw-spin-cw {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes aw-spin-ccw {
  from { transform: rotate(360deg); }
  to   { transform: rotate(0deg); }
}

/* 圣环扩散（范围增大3倍：40→120） */
.aw-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 3px solid rgba(255, 215, 0, 0.85);
  box-shadow: 0 0 20px rgba(255, 200, 50, 0.6), inset 0 0 16px rgba(255, 220, 100, 0.4);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.aw-ring.ring-1 { animation: aw-ring 0.7s ease-out 0.7s forwards; }
.aw-ring.ring-2 { border-color: rgba(255, 248, 220, 0.7); animation: aw-ring 0.8s ease-out 0.8s forwards; }
.aw-ring.ring-3 { border-color: rgba(80, 200, 120, 0.5); animation: aw-ring 0.9s ease-out 0.9s forwards; }

@keyframes aw-ring {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  15% { opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(30); opacity: 0; }
}

/* 中心光爆（范围增大3倍：120→360） */
.aw-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 248, 220, 0.85) 18%,
    rgba(255, 215, 0, 0.6) 42%,
    rgba(180, 140, 0, 0.3) 68%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: aw-burst 0.6s cubic-bezier(0.15, 0.6, 0.3, 1) 0.7s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}

@keyframes aw-burst {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 1; }
  50% { transform: translate3d(-50%, -50%, 0) scale(2.5); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(4); opacity: 0; }
}
/* 注：aw-burst 的 scale 值保持不变，因为基础尺寸已增大3倍，最终视觉范围自动放大3倍 */

/* 冲击波环（范围增大3倍：30→90） */
.aw-shockwave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 3px solid rgba(255, 215, 0, 0.85);
  box-shadow: 0 0 15px rgba(255, 200, 50, 0.5);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.aw-shockwave.sw-1 { animation: aw-shockwave 0.6s ease-out 0.75s forwards; }
.aw-shockwave.sw-2 { border-color: rgba(255, 248, 220, 0.7); animation: aw-shockwave 0.7s ease-out 0.82s forwards; }

@keyframes aw-shockwave {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  15% { opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(9); opacity: 0; }
}
/* 注：aw-shockwave 的 scale 值保持不变，因为基础尺寸已增大3倍，最终视觉范围自动放大3倍 */

/* 神圣碎片 - 3D飞溅 */
.aw-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--aw-shard-size, 8px);
  height: var(--aw-shard-size, 8px);
  border-radius: 40% 60% 50% 40% / 55% 40% 60% 45%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 215, 0, 0.75) 50%,
    rgba(180, 140, 0, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  backface-visibility: hidden;
  animation: aw-shard-scatter 0.7s cubic-bezier(0.2, 0.5, 0.4, 1) forwards;
  will-change: transform, opacity;
}

@keyframes aw-shard-scatter {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { opacity: 1; }
  100% {
    transform: translate3d(calc(-50% + var(--aw-shard-tx, 0px)), calc(-50% + var(--aw-shard-ty, 0px)), var(--aw-shard-tz, 0px)) scale(0.3) rotate(220deg);
    opacity: 0;
  }
}

/* 治愈粒子 - 从地面向上飘升的翠绿光粒 */
.aw-heal-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--aw-heal-size, 6px);
  height: var(--aw-heal-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 240, 0.9) 0%,
    rgba(80, 200, 120, 0.8) 50%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(80, 200, 120, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: aw-heal-float 0.9s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes aw-heal-float {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(calc(-50% + var(--aw-heal-tx, 0px) * 0.2), calc(-50% + var(--aw-heal-ty, 0px) * 0.2), 0) scale(1.2);
    opacity: 1;
  }
  80% { opacity: 0.5; }
  100% {
    transform: translate3d(calc(-50% + var(--aw-heal-tx, 0px)), calc(-50% + var(--aw-heal-ty, 0px)), 0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段④：余韵消散（1.4s ~ 2.4s）---------- */
/* 余韵消散范围增大3倍：扩大渐变覆盖区域 */
.aw-afterglow {
  position: absolute;
  inset: -100%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(255, 215, 0, 0.12) 0%,
    rgba(80, 200, 120, 0.06) 45%,
    transparent 80%
  );
  opacity: 0;
  animation: aw-afterglow 1s ease-out 1.4s forwards;
  will-change: opacity;
}

@keyframes aw-afterglow {
  0% { opacity: 0; }
  25% { opacity: 0.6; }
  100% { opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .aw-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
