<!--
  @file AngelWingsEffect.vue
  @generated 2026-07-29
  @description 天使之翼 - 翼展庇护·圣盾凝结·羽毛飞散·圣辉消散
  炽天使R技能（nature_messenger_r）：展开天使之翼庇护全队，大幅提升物理防御和魔法防御
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + translateZ深度分层
  动画总时长：2.2秒（群体BUFF，覆盖全队区域）
    ⓪ 翼展庇护（0s ~ 0.5s）- 天使之翼从中心展开 + 全屏圣光闪 + 翼光笼罩
    ① 圣盾凝结（0.3s ~ 1.0s）- 圣盾光罩形成 + 防御符文旋转 + 圣光波纹
    ② 羽毛飞散（0.5s ~ 1.4s）- 金色羽毛向四周飘散 + 治愈光粒上升 + 圣光闪烁
    ③ 圣辉消散（1.2s ~ 2.2s）- 翼光渐隐 + 余韵消散
  色彩方案：圣翼金(#FFD700) + 圣盾白(#FFFEF0) + 庇护蓝(#87CEEB) + 暖光(#FFF8DC)
-->
<template>
  <!-- 3D舞台 - 透视容器，为天使之翼展开提供3D空间深度 -->
  <div class="aw2-3d-stage">
    <!-- ===== 阶段⓪：翼展庇护 ===== -->
    <!-- 翼展暗幕 - 金色暖光笼罩 -->
    <div class="aw2-dim"></div>

    <!-- 全屏圣光闪 - 翼展瞬间的金白色爆闪 -->
    <div class="aw2-flash"></div>

    <!-- 天使之翼主体 - 从中心展开的巨大光翼 -->
    <div class="aw2-wings">
      <!-- 左主翼 -->
      <div class="aw2-wing wing-main-left">
        <div class="aw2-wing-feather f1"></div>
        <div class="aw2-wing-feather f2"></div>
        <div class="aw2-wing-feather f3"></div>
      </div>
      <!-- 右主翼 -->
      <div class="aw2-wing wing-main-right">
        <div class="aw2-wing-feather f1"></div>
        <div class="aw2-wing-feather f2"></div>
        <div class="aw2-wing-feather f3"></div>
      </div>
      <!-- 上翼 -->
      <div class="aw2-wing wing-upper-left"></div>
      <div class="aw2-wing wing-upper-right"></div>
      <!-- 下翼 -->
      <div class="aw2-wing wing-lower-left"></div>
      <div class="aw2-wing wing-lower-right"></div>
    </div>

    <!-- 翼展光环 - 翼膀展开时的环形光波 -->
    <div class="aw2-wing-aura"></div>

    <!-- ===== 阶段①：圣盾凝结 ===== -->
    <!-- 圣盾光罩 - 半球形防护罩 -->
    <div class="aw2-shield">
      <div class="aw2-shield-glow"></div>
      <div class="aw2-shield-rim"></div>
      <div class="aw2-shield-rune"></div>
    </div>

    <!-- 防御符文圆环 - 旋转的防御符文（双层） -->
    <div class="aw2-rune-ring rune-outer"></div>
    <div class="aw2-rune-ring rune-inner"></div>

    <!-- 圣光波纹 - 从中心向外扩散的防护波纹 -->
    <div class="aw2-wave wave-1"></div>
    <div class="aw2-wave wave-2"></div>
    <div class="aw2-wave wave-3"></div>

    <!-- ===== 阶段②：羽毛飞散 ===== -->
    <!-- 金色羽毛 - 向四周飘散的发光羽毛 -->
    <div
      v-for="i in 14"
      :key="'aw2-feather-' + i"
      class="aw2-feather"
      :style="getFeatherStyle(i)"
    ></div>

    <!-- 治愈光粒 - 从地面向上飘升的光粒 -->
    <div
      v-for="i in 10"
      :key="'aw2-sparkle-' + i"
      class="aw2-sparkle"
      :style="getSparkleStyle(i)"
    ></div>

    <!-- 圣光闪烁 - 偶发的金白色闪现 -->
    <div class="aw2-glint glint-1"></div>
    <div class="aw2-glint glint-2"></div>

    <!-- 中央庇护核心 - 发光的圣盾之球 -->
    <div class="aw2-core">
      <div class="aw2-core-inner"></div>
    </div>

    <!-- ===== 阶段③：圣辉消散 ===== -->
    <!-- 翼展余韵 - 最终残留的金蓝光晕消散 -->
    <div class="aw2-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 天使之翼 - 翼展庇护·圣盾凝结·羽毛飞散·圣辉消散
 * 炽天使R技能（nature_messenger_r）群体BUFF特效组件
 * 展开天使之翼庇护全队，大幅提升物理防御和魔法防御
 * 以圣翼金和圣盾白为主色调，辅以庇护蓝，展现天使翼展与圣盾凝结的防御视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 * 动画总时长2.2秒
 */

/**
 * 计算金色羽毛的飘散样式
 * 每个羽毛从翼展中心向四周飘散，颜色交替使用金色和白色
 * @param {number} index - 羽毛索引（1~14）
 * @returns {Object} CSS自定义属性对象
 */
function getFeatherStyle (index) {
  const angle = (index - 1) * 25.7 + (index % 2) * 9
  const rad = (angle * Math.PI) / 180
  const distance = 60 + (index % 5) * 20
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance * 0.4 - 15
  const rotation = (index % 2 === 0 ? 1 : -1) * (60 + index * 12)
  const size = 8 + (index % 3) * 5
  const delay = 0.5 + (index % 7) * 0.04
  const colorType = index % 2
  const colors = [
    { color: 'rgba(255, 215, 0, 0.9)', glow: 'rgba(255, 215, 0, 0.6)' },
    { color: 'rgba(255, 254, 240, 0.9)', glow: 'rgba(255, 254, 240, 0.5)' }
  ]
  const c = colors[colorType]
  return {
    '--aw2-feather-tx': `${tx}px`,
    '--aw2-feather-ty': `${ty}px`,
    '--aw2-feather-rotate': `${rotation}deg`,
    '--aw2-feather-size': `${size}px`,
    '--aw2-feather-color': c.color,
    '--aw2-feather-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算治愈光粒的上浮样式
 * @param {number} index - 光粒索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getSparkleStyle (index) {
  const angle = (index - 1) * 36 + (index % 2) * 12
  const distance = 15 + (index % 4) * 10
  const riseHeight = 50 + (index % 3) * 20
  const delay = 0.6 + (index % 5) * 0.06
  const size = 4 + (index % 2) * 2
  return {
    '--aw2-sparkle-angle': `${angle}deg`,
    '--aw2-sparkle-dist': `${distance}px`,
    '--aw2-sparkle-height': `${riseHeight}px`,
    '--aw2-sparkle-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   天使之翼 (nature_messenger_r) - 翼展庇护·圣盾凝结·羽毛飞散·圣辉消散
   技能描述：展开天使之翼庇护全队，大幅提升物理防御和魔法防御
   色彩方案：圣翼金(#FFD700) + 圣盾白(#FFFEF0) + 庇护蓝(#87CEEB) + 暖光(#FFF8DC)
   GPU加速：contain隔离 + will-change + translate3d
   动画总时长：2.2秒
   ================================================================ */

/* 3D舞台 - 透视容器 */
.aw2-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1000px;
  perspective-origin: 50% 50%;
  transform-style: preserve-3d;
  contain: layout style;
  pointer-events: none;
}

/* ---------- 阶段⓪：翼展庇护（0s ~ 0.5s）---------- */

/* 翼展暗幕 */
.aw2-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 45%,
    rgba(60, 50, 10, 0.45) 0%,
    rgba(35, 30, 5, 0.25) 50%,
    transparent 100%
  );
  animation: aw2-dim 2.2s ease-out forwards;
  will-change: opacity;
}

@keyframes aw2-dim {
  0%   { opacity: 0; }
  10%  { opacity: 1; }
  50%  { opacity: 0.6; }
  100% { opacity: 0; }
}

/* 全屏圣光闪 */
.aw2-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 45%,
    rgba(255, 250, 220, 0.85) 0%,
    rgba(255, 220, 120, 0.45) 25%,
    rgba(135, 206, 235, 0.2) 55%,
    transparent 80%
  );
  opacity: 0;
  animation: aw2-flash 0.8s ease-out forwards;
  will-change: opacity;
}

@keyframes aw2-flash {
  0%, 100% { opacity: 0; }
  5%  { opacity: 1; }
  12% { opacity: 0.3; }
  20% { opacity: 0.7; }
  40% { opacity: 0.2; }
  80% { opacity: 0; }
}

/* 天使之翼主体容器 */
.aw2-wings {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  transform: translate(-50%, -50%) scale(0);
  animation: aw2-wings-appear 0.5s ease-out 0.1s forwards,
             aw2-wings-fade 0.5s ease-out 1.4s forwards;
  will-change: transform, opacity;
}

@keyframes aw2-wings-appear {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  60% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0.9; }
}

@keyframes aw2-wings-fade {
  0% { opacity: 0.9; }
  100% { opacity: 0; }
}

/* 单个光翼 */
.aw2-wing {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: 0% 50%;
  will-change: transform, opacity;
}

/* 主翼 - 左 */
.aw2-wing.wing-main-left {
  width: 140px;
  height: 35px;
  transform: translate(0, -50%) rotate(180deg) scaleX(0);
  background: linear-gradient(
    to right,
    rgba(255, 255, 240, 0.9) 0%,
    rgba(255, 235, 160, 0.7) 30%,
    rgba(255, 215, 0, 0.4) 60%,
    transparent 100%
  );
  clip-path: polygon(0% 50%, 25% 0%, 70% 10%, 100% 50%, 70% 90%, 25% 100%);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
  filter: blur(2px);
  animation: aw2-wing-left 0.5s ease-out 0.1s forwards;
}

/* 主翼 - 右 */
.aw2-wing.wing-main-right {
  width: 140px;
  height: 35px;
  transform: translate(0, -50%) scaleX(0);
  background: linear-gradient(
    to right,
    rgba(255, 255, 240, 0.9) 0%,
    rgba(255, 235, 160, 0.7) 30%,
    rgba(255, 215, 0, 0.4) 60%,
    transparent 100%
  );
  clip-path: polygon(0% 50%, 25% 0%, 70% 10%, 100% 50%, 70% 90%, 25% 100%);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
  filter: blur(2px);
  animation: aw2-wing-right 0.5s ease-out 0.1s forwards;
}

/* 上翼 - 左 */
.aw2-wing.wing-upper-left {
  width: 100px;
  height: 25px;
  transform: translate(0, -50%) rotate(205deg) scaleX(0);
  background: linear-gradient(to right, rgba(255, 255, 240, 0.8) 0%, rgba(255, 215, 0, 0.4) 60%, transparent 100%);
  clip-path: polygon(0% 50%, 30% 0%, 80% 15%, 100% 50%, 80% 85%, 30% 100%);
  filter: blur(2px);
  animation: aw2-wing-upper-left 0.5s ease-out 0.15s forwards;
}

/* 上翼 - 右 */
.aw2-wing.wing-upper-right {
  width: 100px;
  height: 25px;
  transform: translate(0, -50%) rotate(-25deg) scaleX(0);
  background: linear-gradient(to right, rgba(255, 255, 240, 0.8) 0%, rgba(255, 215, 0, 0.4) 60%, transparent 100%);
  clip-path: polygon(0% 50%, 30% 0%, 80% 15%, 100% 50%, 80% 85%, 30% 100%);
  filter: blur(2px);
  animation: aw2-wing-upper-right 0.5s ease-out 0.15s forwards;
}

/* 下翼 - 左 */
.aw2-wing.wing-lower-left {
  width: 90px;
  height: 22px;
  transform: translate(0, -50%) rotate(155deg) scaleX(0);
  background: linear-gradient(to right, rgba(255, 255, 240, 0.7) 0%, rgba(255, 215, 0, 0.35) 60%, transparent 100%);
  clip-path: polygon(0% 50%, 30% 0%, 80% 15%, 100% 50%, 80% 85%, 30% 100%);
  filter: blur(2px);
  animation: aw2-wing-lower-left 0.5s ease-out 0.2s forwards;
}

/* 下翼 - 右 */
.aw2-wing.wing-lower-right {
  width: 90px;
  height: 22px;
  transform: translate(0, -50%) rotate(25deg) scaleX(0);
  background: linear-gradient(to right, rgba(255, 255, 240, 0.7) 0%, rgba(255, 215, 0, 0.35) 60%, transparent 100%);
  clip-path: polygon(0% 50%, 30% 0%, 80% 15%, 100% 50%, 80% 85%, 30% 100%);
  filter: blur(2px);
  animation: aw2-wing-lower-right 0.5s ease-out 0.2s forwards;
}

/* 翼羽细节 */
.aw2-wing-feather {
  position: absolute;
  background: linear-gradient(to right, rgba(255, 255, 240, 0.6), transparent);
  height: 2px;
  border-radius: 2px;
}

.aw2-wing-feather.f1 { top: 30%; left: 20%; width: 60%; }
.aw2-wing-feather.f2 { top: 50%; left: 15%; width: 70%; }
.aw2-wing-feather.f3 { top: 70%; left: 20%; width: 60%; }

@keyframes aw2-wing-left {
  0% { transform: translate(0, -50%) rotate(180deg) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) rotate(180deg) scaleX(1); opacity: 0.85; }
}

@keyframes aw2-wing-right {
  0% { transform: translate(0, -50%) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) scaleX(1); opacity: 0.85; }
}

@keyframes aw2-wing-upper-left {
  0% { transform: translate(0, -50%) rotate(205deg) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) rotate(205deg) scaleX(1); opacity: 0.7; }
}

@keyframes aw2-wing-upper-right {
  0% { transform: translate(0, -50%) rotate(-25deg) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) rotate(-25deg) scaleX(1); opacity: 0.7; }
}

@keyframes aw2-wing-lower-left {
  0% { transform: translate(0, -50%) rotate(155deg) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) rotate(155deg) scaleX(1); opacity: 0.6; }
}

@keyframes aw2-wing-lower-right {
  0% { transform: translate(0, -50%) rotate(25deg) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) rotate(25deg) scaleX(1); opacity: 0.6; }
}

/* 翼展光环 - 翼膀展开时的环形光波 */
.aw2-wing-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.6);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.2);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  animation: aw2-wing-aura 0.6s ease-out 0.2s forwards;
  will-change: transform, opacity;
}

@keyframes aw2-wing-aura {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  30% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
}

/* ---------- 阶段①：圣盾凝结（0.3s ~ 1.0s）---------- */

/* 圣盾光罩 - 半球形防护罩 */
.aw2-shield {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 280px;
  height: 140px;
  transform: translate(-50%, -50%) scale(0);
  animation: aw2-shield-appear 0.5s ease-out 0.3s forwards,
             aw2-shield-fade 0.5s ease-out 1.5s forwards;
  will-change: transform, opacity;
}

@keyframes aw2-shield-appear {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  60% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
}

@keyframes aw2-shield-fade {
  0% { opacity: 0.6; }
  100% { opacity: 0; }
}

/* 圣盾发光层 */
.aw2-shield-glow {
  position: absolute;
  inset: 0;
  border-radius: 50% 50% 0 0;
  background: radial-gradient(
    ellipse at 50% 100%,
    rgba(255, 215, 0, 0.15) 0%,
    rgba(135, 206, 235, 0.1) 40%,
    transparent 70%
  );
  filter: blur(8px);
}

/* 圣盾边框光弧 */
.aw2-shield-rim {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 215, 0, 0.5) 25%,
    rgba(255, 255, 240, 0.8) 50%,
    rgba(135, 206, 235, 0.5) 75%,
    transparent 100%
  );
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
  filter: blur(2px);
}

/* 圣盾符文 - 盾面上的旋转符文 */
.aw2-shield-rune {
  position: absolute;
  top: 20%;
  left: 50%;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.08) 45deg,
    transparent 90deg,
    rgba(135, 206, 235, 0.06) 180deg,
    transparent 225deg,
    rgba(255, 254, 240, 0.08) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  animation: aw2-spin-cw 3s linear 0.3s infinite;
  will-change: transform;
}

@keyframes aw2-spin-cw {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* 防御符文圆环 */
.aw2-rune-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
}

.aw2-rune-ring.rune-outer {
  width: 70%;
  height: 70%;
  border: 1px dashed rgba(255, 215, 0, 0.35);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.15) 30deg,
    transparent 60deg,
    rgba(135, 206, 235, 0.12) 120deg,
    transparent 150deg,
    rgba(255, 254, 240, 0.14) 210deg,
    transparent 240deg,
    rgba(255, 215, 0, 0.15) 300deg,
    transparent 360deg
  );
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.2);
  animation: aw2-rune-outer-appear 0.3s ease-out 0.4s forwards,
             aw2-rune-outer-spin 3s linear 0.5s forwards;
}

@keyframes aw2-rune-outer-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.6; }
}

@keyframes aw2-rune-outer-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  80% { opacity: 0.4; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0; }
}

.aw2-rune-ring.rune-inner {
  width: 50%;
  height: 50%;
  border: 1px solid rgba(135, 206, 235, 0.2);
  background: conic-gradient(
    from 180deg,
    transparent 0deg,
    rgba(135, 206, 235, 0.12) 45deg,
    transparent 90deg,
    rgba(255, 215, 0, 0.12) 180deg,
    transparent 225deg,
    rgba(255, 254, 240, 0.13) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 5px rgba(135, 206, 235, 0.1);
  animation: aw2-rune-inner-appear 0.3s ease-out 0.5s forwards,
             aw2-rune-inner-spin 2.5s linear 0.6s forwards;
}

@keyframes aw2-rune-inner-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.5; }
}

@keyframes aw2-rune-inner-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.5; }
  80% { opacity: 0.3; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0; }
}

/* 圣光波纹 - 从中心向外扩散 */
.aw2-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.5);
  background: transparent;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.aw2-wave.wave-1 { animation: aw2-wave-expand 0.8s ease-out 0.4s forwards; }
.aw2-wave.wave-2 { animation: aw2-wave-expand 0.8s ease-out 0.6s forwards; }
.aw2-wave.wave-3 { animation: aw2-wave-expand 0.8s ease-out 0.8s forwards; }

@keyframes aw2-wave-expand {
  0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
  20% { opacity: 0.8; }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
    border-color: rgba(135, 206, 235, 0.1);
  }
}

/* ---------- 阶段②：羽毛飞散（0.5s ~ 1.4s）---------- */

/* 金色羽毛 */
.aw2-feather {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--aw2-feather-size, 10px);
  height: calc(var(--aw2-feather-size, 10px) * 0.4);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 240, 0.9) 0%,
    var(--aw2-feather-color, rgba(255, 215, 0, 0.6)) 50%,
    transparent 100%
  );
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  box-shadow: 0 0 6px var(--aw2-feather-glow, rgba(255, 215, 0, 0.5));
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: aw2-feather-drift 1s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes aw2-feather-drift {
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
      calc(-50% + var(--aw2-feather-tx, 0px)),
      calc(-50% + var(--aw2-feather-ty, 0px)),
      0
    ) scale(0.2) rotate(var(--aw2-feather-rotate, 0deg));
    opacity: 0;
  }
}

/* 治愈光粒 - 从地面向上飘升 */
.aw2-sparkle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--aw2-sparkle-size, 5px);
  height: var(--aw2-sparkle-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 254, 240, 1) 0%,
    rgba(255, 215, 0, 0.8) 40%,
    transparent 100%
  );
  box-shadow: 0 0 5px rgba(255, 215, 0, 0.6);
  transform: translate3d(-50%, -50%, 0) rotate(var(--aw2-sparkle-angle, 0deg)) translateX(0px) translateY(0px) scale(0);
  animation: aw2-sparkle-float 1s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes aw2-sparkle-float {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--aw2-sparkle-angle, 0deg)) translateX(0px) translateY(0px) scale(0);
    opacity: 0;
  }
  20% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--aw2-sparkle-angle, 0deg)) translateX(calc(var(--aw2-sparkle-dist, 20px) * 0.5)) translateY(calc(var(--aw2-sparkle-height, 60px) * -0.3)) scale(1.3);
  }
  80% { opacity: 0.6; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--aw2-sparkle-angle, 0deg)) translateX(var(--aw2-sparkle-dist, 20px)) translateY(calc(var(--aw2-sparkle-height, 60px) * -1)) scale(0.3);
    opacity: 0;
  }
}

/* 圣光闪烁 */
.aw2-glint {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80%;
  height: 80%;
  border-radius: 50%;
  border: 2px solid rgba(255, 254, 240, 0.5);
  background: transparent;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.aw2-glint.glint-1 { animation: aw2-glint-flash 0.6s ease-out 0.7s forwards; }
.aw2-glint.glint-2 { animation: aw2-glint-flash 0.6s ease-out 1.0s forwards; }

@keyframes aw2-glint-flash {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
  30% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}

/* 中央庇护核心 */
.aw2-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: aw2-core-appear 0.3s ease-out 0.5s forwards,
             aw2-core-fade 0.4s ease-out 1.3s forwards;
  will-change: transform, opacity;
}

@keyframes aw2-core-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes aw2-core-fade {
  0% { opacity: 1; transform: translate3d(-50%, -50%, 0) scale(1); }
  100% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale(1.8); }
}

.aw2-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 254, 240, 0.95) 20%,
    rgba(255, 215, 0, 0.85) 50%,
    rgba(135, 206, 235, 0.4) 80%,
    transparent 100%
  );
  box-shadow:
    0 0 8px rgba(255, 215, 0, 0.9),
    0 0 16px rgba(255, 215, 0, 0.5),
    0 0 24px rgba(135, 206, 235, 0.3);
  animation: aw2-core-pulse 0.8s ease-in-out 0.6s forwards;
  will-change: transform, opacity;
}

@keyframes aw2-core-pulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.4); opacity: 1; }
}

/* ---------- 阶段③：圣辉消散（1.2s ~ 2.2s）---------- */

.aw2-afterglow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(255, 215, 0, 0.1) 0%,
    rgba(135, 206, 235, 0.06) 45%,
    transparent 80%
  );
  opacity: 0;
  animation: aw2-afterglow 1s ease-out 1.2s forwards;
  will-change: opacity;
}

@keyframes aw2-afterglow {
  0% { opacity: 0; }
  25% { opacity: 0.5; }
  100% { opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .aw2-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
