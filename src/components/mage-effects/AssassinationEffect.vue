<!--
  @file AssassinationEffect.vue
  @generated 2026-07-05
  @description 暗杀 - 暗影潜行·幻影突袭·致命一击·多倍连斩·暗影消散
  暗杀者R技能（Assassination）：从潜行状态下现身，给予对方致命一击，有一定几率造成多倍伤害
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + translateZ深度分层 + rotateX地面倾斜
  动画总时长：1.8秒（显示1.4秒 + 渐隐消散0.4秒）
    ⓪ 暗影潜行（0s ~ 0.4s）- 暗影迷雾从四周汇聚 + 暗影触须缠绕 + 潜行轮廓若隐若现
    ① 幻影突袭（0.3s ~ 0.65s）- 暗影残影高速划过 + 刀光轨迹线交叉 + 影分身闪烁
    ② 致命一击（0.5s ~ 1.1s）- 中心X形刀刃斩击 + 暗红能量爆发 + 冲击波环 + 地面冲击
    ③ 多倍连斩（0.6s ~ 1.4s）- 连续多重斩击痕迹 + 暴击金光闪现 + 血红碎片飞溅
    ④ 暗影消散（1.0s ~ 1.8s）- 暗影能量上浮消散 + 残留刀痕渐隐 + 影雾蒸发
  色彩方案：暗影黑紫(#1A0033) + 致命血红(#DC143C) + 刀锋银白(#E8E8E8) + 暴击金(#FFD700) + 暗杀靛紫(#4B0082)
-->
<template>
  <!-- 3D舞台 - 透视容器，为暗杀提供3D空间深度 -->
  <div class="as-3d-stage">
    <!-- ===== 阶段⓪：暗影潜行 ===== -->
    <!-- 暗影迷雾 - 从四周向中心汇聚的暗紫黑雾，营造潜行现身的氛围 -->
    <div class="as-shadow-mist"></div>

    <!-- 暗影触须 - 从边缘向中心延伸的暗影能量丝线 -->
    <div
      v-for="i in 8"
      :key="'as-tendril-' + i"
      class="as-tendril"
      :style="getTendrilStyle(i)"
    ></div>

    <!-- 潜行轮廓 - 若隐若现的暗杀者影子 -->
    <div class="as-silhouette"></div>

    <!-- ===== 阶段①：幻影突袭 ===== -->
    <!-- 暗影残影 - 高速划过的暗杀者残影 -->
    <div class="as-phantom-dash dash-1"></div>
    <div class="as-phantom-dash dash-2"></div>
    <div class="as-phantom-dash dash-3"></div>

    <!-- 刀光轨迹 - 交叉划过的刀光线条 -->
    <div class="as-blade-trail trail-1"></div>
    <div class="as-blade-trail trail-2"></div>

    <!-- ===== 阶段②：致命一击 ===== -->
    <!-- 全屏暗红闪光 - 致命一击瞬间的暗红爆闪 -->
    <div class="as-strike-flash"></div>

    <!-- X形刀刃斩击 - 中心交叉的致命斩击痕迹 -->
    <div class="as-fatal-slash slash-x1"></div>
    <div class="as-fatal-slash slash-x2"></div>

    <!-- 致命核心爆发 - 中心暗红能量爆发球 -->
    <div class="as-strike-core"></div>

    <!-- 3D冲击波穹顶 - 从中心向上扩散的半球形暗红冲击波 -->
    <div class="as-shockwave-dome"></div>

    <!-- 冲击波环 - 多层从中心扩散的暗影冲击波（3层错峰） -->
    <div class="as-shockwave-ring ring-1"></div>
    <div class="as-shockwave-ring ring-2"></div>
    <div class="as-shockwave-ring ring-3"></div>

    <!-- 地面冲击波 - 沿地面快速扩散的扁平暗影冲击波 -->
    <div class="as-ground-blast"></div>

    <!-- ===== 阶段③：多倍连斩 ===== -->
    <!-- 连续斩击痕迹 - 快速闪现的多重刀痕 -->
    <div
      v-for="i in 6"
      :key="'as-multislash-' + i"
      class="as-multi-slash"
      :style="getMultiSlashStyle(i)"
    ></div>

    <!-- 暴击金光 - 多倍伤害触发的金色闪光 -->
    <div class="as-critical-glow"></div>

    <!-- 血红碎片 - 从中心3D飞溅的暗红能量碎片 -->
    <div
      v-for="i in 12"
      :key="'as-shard-' + i"
      class="as-shard"
      :style="getShardStyle(i)"
    >
      <div class="as-shard-head"></div>
      <div class="as-shard-trail"></div>
    </div>

    <!-- 刀锋火星 - 向四周3D飞溅的银白火花 -->
    <div
      v-for="i in 14"
      :key="'as-spark-' + i"
      class="as-spark"
      :style="getSparkStyle(i)"
    ></div>

    <!-- ===== 阶段④：暗影消散 ===== -->
    <!-- 暗影余烬 - 爆破后缓慢上浮的暗紫余烬粒子 -->
    <div
      v-for="i in 8"
      :key="'as-ember-' + i"
      class="as-ember"
      :style="getEmberStyle(i)"
    ></div>

    <!-- 残留刀痕 - 中心残留的X形刀痕残影 -->
    <div class="as-residual-slash"></div>

    <!-- 暗影余波 - 爆破后残留的暗影能量涟漪 -->
    <div class="as-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 暗杀 - 暗影潜行·幻影突袭·致命一击·多倍连斩·暗影消散
 * 暗杀者R技能特效组件，以暗影黑紫和致命血红为主色调
 * 展现从潜行中现身给予致命一击、多倍连斩的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 */

/**
 * 生成暗影触须的延伸样式
 * @param {number} index - 触须序号（1~8）
 * @returns {Object} CSS样式对象，含角度、长度、尺寸、延迟
 */
function getTendrilStyle (index) {
  const angle = (index - 1) * 45
  const length = 100 + (index % 3) * 30
  const delay = (index % 4) * 0.04
  return {
    '--as-tendril-angle': `${angle}deg`,
    '--as-tendril-length': `${length}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成多倍连斩痕迹的样式
 * @param {number} index - 斩痕序号（1~6）
 * @returns {Object} CSS样式对象，含角度、偏移、尺寸、延迟
 */
function getMultiSlashStyle (index) {
  const angle = -45 + (index - 1) * 30 + (index % 2) * 15
  const offset = (index % 2 === 0 ? 1 : -1) * (15 + (index % 3) * 10)
  const size = 80 + (index % 3) * 20
  const delay = 0.6 + (index - 1) * 0.08
  return {
    '--as-multislash-angle': `${angle}deg`,
    '--as-multislash-offset': `${offset}px`,
    '--as-multislash-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成血红碎片的3D飞溅样式
 * @param {number} index - 碎片序号（1~12）
 * @returns {Object} CSS样式对象，含飞溅角度、距离、Z轴深度、抛物线弧度、尺寸、延迟
 */
function getShardStyle (index) {
  const angle = (index - 1) * 30
  const distance = 130 + (index % 4) * 40
  const size = 28 + (index % 3) * 12
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const depth = depthDir * (50 + (index % 2) * 35)
  const arc = 25 + (index % 4) * 18
  const delay = 0.55 + (index % 3) * 0.03
  return {
    '--as-shard-angle': `${angle}deg`,
    '--as-shard-distance': `${distance}px`,
    '--as-shard-size': `${size}px`,
    '--as-shard-depth': `${depth}px`,
    '--as-shard-arc': `${arc}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成刀锋火星的3D飞溅样式
 * @param {number} index - 火星序号（1~14）
 * @returns {Object} CSS样式对象，含飞溅偏移、Z轴深度、尺寸、延迟
 */
function getSparkStyle (index) {
  const angle = (index - 1) * 25.7 + (index % 2) * 7
  const distance = 65 + (index % 5) * 25
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 15 - (index % 3) * 10
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const tz = depthDir * (35 + (index % 2) * 20)
  const size = 5 + (index % 4) * 4
  const delay = 0.52 + (index % 5) * 0.02
  return {
    '--as-spark-tx': `${tx}px`,
    '--as-spark-ty': `${ty}px`,
    '--as-spark-tz': `${tz}px`,
    '--as-spark-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成暗影余烬的上浮样式
 * @param {number} index - 余烬序号（1~8）
 * @returns {Object} CSS样式对象，含水平偏移、上浮高度、尺寸、延迟
 */
function getEmberStyle (index) {
  const tx = (index % 2 === 0 ? 1 : -1) * (20 + (index % 4) * 15)
  const ty = -60 - (index % 3) * 30
  const size = 4 + (index % 3) * 3
  const delay = 0.6 + (index % 4) * 0.05
  return {
    '--as-ember-tx': `${tx}px`,
    '--as-ember-ty': `${ty}px`,
    '--as-ember-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   暗杀 (assassination) - 暗影潜行·幻影突袭·致命一击·多倍连斩·暗影消散
   技能描述：从潜行状态下现身，给予对方致命一击，有一定几率造成多倍伤害
   3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：1.8秒
     ⓪ 暗影潜行（0s ~ 0.4s）- 暗影迷雾汇聚 + 暗影触须缠绕 + 潜行轮廓
     ① 幻影突袭（0.3s ~ 0.65s）- 残影高速划过 + 刀光轨迹交叉
     ② 致命一击（0.5s ~ 1.1s）- 全屏暗红闪光 + X形斩击 + 核心爆发 + 3D冲击穹顶 + 3层冲击波 + 地面冲击
     ③ 多倍连斩（0.6s ~ 1.4s）- 6道连续斩痕 + 暴击金光 + 12块碎片3D飞溅 + 14个火星3D飞溅
     ④ 暗影消散（1.0s ~ 1.8s）- 8个余烬上浮 + 残留刀痕渐隐 + 暗影余波
   ================================================================ */

/* 3D舞台 - 透视容器，为所有3D变换提供深度视角 */
.as-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
}

/* ---------- 阶段⓪：暗影潜行 ---------- */

/* 暗影迷雾 - 从四周向中心汇聚的暗紫黑雾，营造潜行现身的氛围 */
.as-shadow-mist {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(26, 0, 51, 0.5) 0%,
    rgba(45, 27, 78, 0.3) 35%,
    rgba(75, 0, 130, 0.1) 70%,
    transparent 100%
  );
  animation: asShadowMist 1.8s ease-in-out forwards;
  will-change: opacity, transform;
}

@keyframes asShadowMist {
  0% {
    opacity: 0;
    transform: scale(1.5);
  }
  15% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
  100% {
    opacity: 0;
    transform: scale(1.2);
  }
}

/* 暗影触须 - 从边缘向中心延伸的暗影能量丝线 */
.as-tendril {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(75, 0, 130, 0.8) 0%,
    rgba(45, 27, 78, 0.4) 50%,
    transparent 100%
  );
  box-shadow: 0 0 8px rgba(75, 0, 130, 0.5);
  transform: translate3d(-50%, -50%, 0) rotate(var(--as-tendril-angle, 0deg)) translateX(0);
  animation: asTendril 0.4s ease-out forwards;
  will-change: transform, opacity;
  opacity: 0;
}

@keyframes asTendril {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--as-tendril-angle, 0deg)) translateX(150px) scale(0);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--as-tendril-angle, 0deg)) translateX(0) scale(1.5);
    opacity: 0;
  }
}

/* 潜行轮廓 - 若隐若现的暗杀者影子 */
.as-silhouette {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 80px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(26, 0, 51, 0.7) 0%,
    rgba(45, 27, 78, 0.4) 40%,
    transparent 70%
  );
  filter: blur(6px);
  animation: asSilhouette 0.5s ease-out forwards;
  will-change: transform, opacity;
  opacity: 0;
}

@keyframes asSilhouette {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.3) translateX(-30px);
    opacity: 0;
  }
  40% {
    transform: translate3d(-50%, -50%, 0) scale(1) translateX(0);
    opacity: 0.8;
  }
  70% {
    transform: translate3d(-50%, -50%, 0) scale(1.2) translateX(20px);
    opacity: 0.4;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.5) translateX(40px);
    opacity: 0;
  }
}

/* ---------- 阶段①：幻影突袭 ---------- */

/* 暗影残影 - 高速划过的暗杀者残影（3条错峰） */
.as-phantom-dash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 180px;
  height: 6px;
  border-radius: 3px;
  transform: translate3d(-50%, -50%, 0) scaleX(0);
  will-change: transform, opacity;
  opacity: 0;
  backface-visibility: hidden;
}

/* 残影1 - 水平划过 */
.as-phantom-dash.dash-1 {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(75, 0, 130, 0.6) 20%,
    rgba(220, 20, 60, 0.8) 50%,
    rgba(75, 0, 130, 0.6) 80%,
    transparent 100%
  );
  filter: blur(3px);
  animation: asPhantomDash 0.3s ease-out 0.3s forwards;
}

/* 残影2 - 斜向划过 */
.as-phantom-dash.dash-2 {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(45, 27, 78, 0.5) 20%,
    rgba(220, 20, 60, 0.7) 50%,
    rgba(45, 27, 78, 0.5) 80%,
    transparent 100%
  );
  filter: blur(4px);
  animation: asPhantomDash2 0.3s ease-out 0.35s forwards;
}

/* 残影3 - 反向斜向划过 */
.as-phantom-dash.dash-3 {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(75, 0, 130, 0.4) 20%,
    rgba(139, 0, 0, 0.6) 50%,
    rgba(75, 0, 130, 0.4) 80%,
    transparent 100%
  );
  filter: blur(3px);
  animation: asPhantomDash3 0.3s ease-out 0.4s forwards;
}

@keyframes asPhantomDash {
  0% {
    transform: translate3d(-50%, -50%, 0) translateX(-200px) scaleX(0.3);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) translateX(200px) scaleX(1.5);
    opacity: 0;
  }
}

@keyframes asPhantomDash2 {
  0% {
    transform: translate3d(-50%, -50%, 0) translate(-180px, -30px) rotate(15deg) scaleX(0.3);
    opacity: 0;
  }
  30% {
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) translate(180px, 30px) rotate(15deg) scaleX(1.5);
    opacity: 0;
  }
}

@keyframes asPhantomDash3 {
  0% {
    transform: translate3d(-50%, -50%, 0) translate(180px, 25px) rotate(-15deg) scaleX(0.3);
    opacity: 0;
  }
  30% {
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) translate(-180px, -25px) rotate(-15deg) scaleX(1.5);
    opacity: 0;
  }
}

/* 刀光轨迹 - 交叉划过的明亮刀光线条 */
.as-blade-trail {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 280px;
  height: 3px;
  border-radius: 2px;
  transform: translate3d(-50%, -50%, 0) scaleX(0);
  will-change: transform, opacity;
  opacity: 0;
  backface-visibility: hidden;
}

/* 刀光1 - 左上到右下 */
.as-blade-trail.trail-1 {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(232, 232, 232, 0.9) 30%,
    rgba(255, 255, 255, 1) 50%,
    rgba(232, 232, 232, 0.9) 70%,
    transparent 100%
  );
  box-shadow: 0 0 10px rgba(220, 20, 60, 0.6), 0 0 20px rgba(255, 255, 255, 0.4);
  animation: asBladeTrail1 0.25s ease-out 0.35s forwards;
}

/* 刀光2 - 右上到左下 */
.as-blade-trail.trail-2 {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(232, 232, 232, 0.9) 30%,
    rgba(255, 255, 255, 1) 50%,
    rgba(232, 232, 232, 0.9) 70%,
    transparent 100%
  );
  box-shadow: 0 0 10px rgba(220, 20, 60, 0.6), 0 0 20px rgba(255, 255, 255, 0.4);
  animation: asBladeTrail2 0.25s ease-out 0.4s forwards;
}

@keyframes asBladeTrail1 {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(45deg) scaleX(0);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(45deg) scaleX(1.2);
    opacity: 0;
  }
}

@keyframes asBladeTrail2 {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(-45deg) scaleX(0);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(-45deg) scaleX(1.2);
    opacity: 0;
  }
}

/* ---------- 阶段②：致命一击 ---------- */

/* 全屏暗红闪光 - 致命一击瞬间的暗红全屏爆闪 */
.as-strike-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(220, 20, 60, 0.6) 12%,
    rgba(139, 0, 0, 0.3) 35%,
    rgba(75, 0, 130, 0.1) 60%,
    transparent 100%
  );
  opacity: 0;
  animation: asStrikeFlash 0.5s ease-out 0.5s forwards;
  will-change: opacity;
}

@keyframes asStrikeFlash {
  0% { opacity: 0; }
  8% { opacity: 1; }
  30% { opacity: 0.5; }
  100% { opacity: 0; }
}

/* X形刀刃斩击 - 中心交叉的致命斩击痕迹 */
.as-fatal-slash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 8px;
  border-radius: 4px;
  transform: translate3d(-50%, -50%, 0) scaleX(0);
  will-change: transform, opacity;
  opacity: 0;
  backface-visibility: hidden;
}

/* 斩击线1 - 左上到右下 */
.as-fatal-slash.slash-x1 {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(220, 20, 60, 0.9) 15%,
    rgba(255, 255, 255, 1) 50%,
    rgba(220, 20, 60, 0.9) 85%,
    transparent 100%
  );
  box-shadow:
    0 0 15px rgba(220, 20, 60, 0.8),
    0 0 30px rgba(139, 0, 0, 0.5),
    0 0 50px rgba(255, 255, 255, 0.3);
  animation: asFatalSlash 0.4s cubic-bezier(0.2, 0.6, 0.3, 1) 0.5s forwards;
}

/* 斩击线2 - 右上到左下 */
.as-fatal-slash.slash-x2 {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(220, 20, 60, 0.9) 15%,
    rgba(255, 255, 255, 1) 50%,
    rgba(220, 20, 60, 0.9) 85%,
    transparent 100%
  );
  box-shadow:
    0 0 15px rgba(220, 20, 60, 0.8),
    0 0 30px rgba(139, 0, 0, 0.5),
    0 0 50px rgba(255, 255, 255, 0.3);
  animation: asFatalSlash2 0.4s cubic-bezier(0.2, 0.6, 0.3, 1) 0.52s forwards;
}

@keyframes asFatalSlash {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(45deg) scaleX(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(-50%, -50%, 0) rotate(45deg) scaleX(1.3);
    opacity: 1;
  }
  60% {
    transform: translate3d(-50%, -50%, 0) rotate(45deg) scaleX(1);
    opacity: 0.6;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(45deg) scaleX(1.5);
    opacity: 0;
  }
}

@keyframes asFatalSlash2 {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(-45deg) scaleX(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(-50%, -50%, 0) rotate(-45deg) scaleX(1.3);
    opacity: 1;
  }
  60% {
    transform: translate3d(-50%, -50%, 0) rotate(-45deg) scaleX(1);
    opacity: 0.6;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(-45deg) scaleX(1.5);
    opacity: 0;
  }
}

/* 致命核心爆发 - 中心暗红能量爆发球 */
.as-strike-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(220, 20, 60, 0.85) 18%,
    rgba(139, 0, 0, 0.6) 42%,
    rgba(75, 0, 130, 0.3) 68%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: asStrikeCore 0.6s cubic-bezier(0.15, 0.6, 0.3, 1) 0.5s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}

@keyframes asStrikeCore {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  12% {
    transform: translate3d(-50%, -50%, 0) scale(1.2);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) scale(2.2);
    opacity: 0.7;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(3.5);
    opacity: 0;
  }
}

/* 3D冲击波穹顶 - 从中心向上扩散的半球形暗红冲击波 */
.as-shockwave-dome {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  border: 5px solid rgba(220, 20, 60, 0.6);
  box-shadow:
    0 0 40px rgba(220, 20, 60, 0.5),
    inset 0 0 30px rgba(139, 0, 0, 0.3);
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  animation: asShockwaveDome 0.55s cubic-bezier(0.2, 0.6, 0.3, 1) 0.5s forwards;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

@keyframes asShockwaveDome {
  0% {
    transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(3.5);
    opacity: 0;
  }
}

/* 冲击波环 - 多层从中心扩散的暗影冲击波（3层错峰） */
.as-shockwave-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(220, 20, 60, 0.85);
  box-shadow:
    0 0 20px rgba(220, 20, 60, 0.6),
    inset 0 0 16px rgba(139, 0, 0, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.as-shockwave-ring.ring-1 {
  animation: asShockwaveRing 0.5s ease-out 0.5s forwards;
}

.as-shockwave-ring.ring-2 {
  border-color: rgba(75, 0, 130, 0.7);
  animation: asShockwaveRing 0.55s ease-out 0.54s forwards;
}

.as-shockwave-ring.ring-3 {
  border-color: rgba(45, 27, 78, 0.5);
  animation: asShockwaveRing 0.6s ease-out 0.58s forwards;
}

@keyframes asShockwaveRing {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(14);
    opacity: 0;
  }
}

/* 地面冲击波 - 沿地面快速扩散的扁平暗影冲击波 */
.as-ground-blast {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 40%,
    rgba(220, 20, 60, 0.4) 50%,
    rgba(75, 0, 130, 0.2) 65%,
    transparent 80%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: asGroundBlast 0.45s ease-out 0.52s forwards;
  will-change: transform, opacity;
}

@keyframes asGroundBlast {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(9);
    opacity: 0;
  }
}

/* ---------- 阶段③：多倍连斩 ---------- */

/* 连续斩击痕迹 - 快速闪现的多重刀痕 */
.as-multi-slash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--as-multislash-size, 100px);
  height: 5px;
  border-radius: 3px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 215, 0, 0.8) 15%,
    rgba(255, 255, 255, 1) 50%,
    rgba(220, 20, 60, 0.8) 85%,
    transparent 100%
  );
  box-shadow:
    0 0 10px rgba(255, 215, 0, 0.6),
    0 0 20px rgba(220, 20, 60, 0.4);
  transform: translate3d(-50%, -50%, 0) rotate(var(--as-multislash-angle, 0deg)) translateX(var(--as-multislash-offset, 0px)) scaleX(0);
  animation: asMultiSlash 0.3s ease-out forwards;
  will-change: transform, opacity;
  opacity: 0;
  backface-visibility: hidden;
}

@keyframes asMultiSlash {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--as-multislash-angle, 0deg)) translateX(var(--as-multislash-offset, 0px)) scaleX(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--as-multislash-angle, 0deg)) translateX(var(--as-multislash-offset, 0px)) scaleX(1.2);
    opacity: 1;
  }
  60% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--as-multislash-angle, 0deg)) translateX(var(--as-multislash-offset, 0px)) scaleX(1);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--as-multislash-angle, 0deg)) translateX(var(--as-multislash-offset, 0px)) scaleX(1.4);
    opacity: 0;
  }
}

/* 暴击金光 - 多倍伤害触发的金色闪光 */
.as-critical-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.7) 0%,
    rgba(255, 255, 255, 0.4) 20%,
    rgba(220, 20, 60, 0.2) 50%,
    transparent 80%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: asCriticalGlow 0.5s ease-out 0.65s forwards;
  will-change: transform, opacity;
  filter: blur(4px);
}

@keyframes asCriticalGlow {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) scale(1.8);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2.5);
    opacity: 0;
  }
}

/* 血红碎片容器 - 从中心向指定角度3D飞溅，带Z轴深度和抛物线弧度 */
.as-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--as-shard-size, 36px);
  height: var(--as-shard-size, 36px);
  transform: translate3d(-50%, -50%, 0) rotate(var(--as-shard-angle, 0deg));
  animation: asShardScatter3D 0.7s cubic-bezier(0.2, 0.5, 0.4, 1) 0.55s forwards;
  will-change: transform, opacity;
  opacity: 0;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

@keyframes asShardScatter3D {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--as-shard-angle, 0deg)) translateX(0) translateZ(0) translateY(0) scale(0.5);
    opacity: 0;
  }
  10% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--as-shard-angle, 0deg)) translateX(12px) translateZ(var(--as-shard-depth, 0px)) translateY(calc(var(--as-shard-arc, 0px) * -0.5)) scale(1.3);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--as-shard-angle, 0deg)) translateX(calc(var(--as-shard-distance, 100px) * 0.6)) translateZ(var(--as-shard-depth, 0px)) translateY(calc(var(--as-shard-arc, 0px) * -1)) scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--as-shard-angle, 0deg)) translateX(var(--as-shard-distance, 100px)) translateZ(var(--as-shard-depth, 0px)) translateY(0) scale(0.3);
    opacity: 0;
  }
}

/* 碎片头部 - 明亮燃烧的暗红菱形碎片 */
.as-shard-head {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 40% 40%,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(255, 215, 0, 0.85) 25%,
    rgba(220, 20, 60, 0.75) 60%,
    rgba(75, 0, 130, 0.4) 100%
  );
  clip-path: polygon(50% 0%, 80% 30%, 100% 50%, 80% 70%, 50% 100%, 20% 70%, 0% 50%, 20% 30%);
  box-shadow:
    0 0 18px rgba(220, 20, 60, 0.8),
    0 0 35px rgba(139, 0, 0, 0.4);
}

/* 碎片拖尾 - 朝向中心的暗红火焰尾迹 */
.as-shard-trail {
  position: absolute;
  top: 50%;
  right: 75%;
  width: 55px;
  height: 55%;
  transform: translateY(-50%);
  background: linear-gradient(
    to left,
    rgba(220, 20, 60, 0.6) 0%,
    rgba(75, 0, 130, 0.3) 50%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(5px);
}

/* 刀锋火星 - 向四周3D飞溅的银白火花 */
.as-spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--as-spark-size, 6px);
  height: var(--as-spark-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(232, 232, 232, 0.7) 45%,
    rgba(220, 20, 60, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(220, 20, 60, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: asSparkFly3D 0.6s ease-out 0.55s forwards;
  will-change: transform, opacity;
}

@keyframes asSparkFly3D {
  0% {
    transform: translate3d(-50%, -50%, 0) translateZ(0) scale(0);
    opacity: 0;
  }
  12% {
    transform: translate3d(-50%, -50%, 0) translateZ(0) scale(1.4);
    opacity: 1;
  }
  100% {
    transform: translate3d(calc(-50% + var(--as-spark-tx, 0px)), calc(-50% + var(--as-spark-ty, 0px)), var(--as-spark-tz, 0px)) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段④：暗影消散 ---------- */

/* 暗影余烬 - 爆破后缓慢上浮的暗紫余烬粒子 */
.as-ember {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--as-ember-size, 6px);
  height: var(--as-ember-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(75, 0, 130, 0.9) 0%,
    rgba(220, 20, 60, 0.5) 50%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(75, 0, 130, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: asEmberFloat 1s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes asEmberFloat {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(calc(-50% + var(--as-ember-tx, 0px) * 0.2), calc(-50% + var(--as-ember-ty, 0px) * 0.2), 0) scale(1.2);
    opacity: 1;
  }
  80% {
    opacity: 0.5;
  }
  100% {
    transform: translate3d(calc(-50% + var(--as-ember-tx, 0px)), calc(-50% + var(--as-ember-ty, 0px)), 0) scale(0.2);
    opacity: 0;
  }
}

/* 残留刀痕 - 中心残留的X形刀痕残影 */
.as-residual-slash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 150px;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(220, 20, 60, 0.5) 20%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(220, 20, 60, 0.5) 80%,
    transparent 100%
  );
  box-shadow: 0 0 12px rgba(220, 20, 60, 0.4);
  transform: translate3d(-50%, -50%, 0) rotate(45deg) scaleX(0);
  opacity: 0;
  animation: asResidualSlash 1s ease-out 0.9s forwards;
  will-change: transform, opacity;
}

@keyframes asResidualSlash {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(45deg) scaleX(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) rotate(45deg) scaleX(1.2);
    opacity: 0.7;
  }
  60% {
    transform: translate3d(-50%, -50%, 0) rotate(45deg) scaleX(1);
    opacity: 0.3;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(45deg) scaleX(1.4);
    opacity: 0;
  }
}

/* 暗影余波 - 爆破后残留的暗影能量涟漪 */
.as-afterglow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50%;
  height: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(75, 0, 130, 0.25) 0%,
    rgba(220, 20, 60, 0.1) 40%,
    transparent 70%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: asAfterglow 0.9s ease-out 0.9s forwards;
  will-change: transform, opacity;
}

@keyframes asAfterglow {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  25% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 0.6;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2);
    opacity: 0;
  }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .as-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
