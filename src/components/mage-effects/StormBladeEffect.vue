<!--
  @file StormBladeEffect.vue
  @generated 2026-08-02
  @description 狂风绝刃 - 风暴凝聚·双刀成形·贯穿斩击·毁灭爆发·风暴消散
  风暴行者W技能（单体风属性伤害）：将狂暴风暴之力注入双刀，锁定单一敌人发起绝命之风刃斩击
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
  动画总时长：1.8秒（显示1.4秒 + 渐隐消散0.4秒）
    ⓪ 风暴凝聚（0s ~ 0.4s）- 风能向中心汇聚 + 地面风压龟裂 + 风眼蓄能
    ① 双刀成形（0.25s ~ 0.6s）- 双刀风刃成形 + 风暴光柱 + 能量凝聚
    ② 贯穿斩击（0.5s ~ 0.9s）- 双刀交叉贯穿斩击 + 风刃轨迹 + 切割闪光
    ③ 毁灭爆发（0.7s ~ 1.3s）- 中心能量爆发 + 冲击波环 + 风刃碎片飞溅
    ④ 风暴消散（1.1s ~ 1.8s）- 余波消散 + 残留风痕渐隐 + 风能上浮
  色彩方案：风暴翠青(#64FFC8) + 风刃银白(#E8FFF8) + 风眼金白(#FFFFF0) + 深邃风暴青(#2A8A6A)
-->
<template>
  <!-- 3D舞台 - 透视容器，为狂风绝刃提供3D空间深度 -->
  <div class="sb-3d-stage">
    <!-- ===== 阶段⓪：风暴凝聚 ===== -->
    <!-- 风暴暗幕 - 深沉风暴阴霾全程覆盖 -->
    <div class="sb-storm-dim"></div>

    <!-- 地面风压龟裂 - 三个风压点撕裂地面，翠青能量从裂缝溢出 -->
    <div
      v-for="i in 3"
      :key="'sb-crack-' + i"
      class="sb-ground-crack"
      :style="getCrackStyle(i)"
    ></div>

    <!-- 风能汇聚粒子 - 周围空气被猛烈抽向中心 -->
    <div
      v-for="i in 12"
      :key="'sb-inhale-' + i"
      class="sb-inhale-particle"
      :style="getInhaleStyle(i)"
    ></div>

    <!-- 风眼蓄能 - 中心蓄能光球脉动 -->
    <div class="sb-eye-charge"></div>

    <!-- ===== 阶段①：双刀成形 ===== -->
    <!-- 风暴光柱 - 从地面升腾的能量光柱 -->
    <div class="sb-energy-pillar"></div>

    <!-- 双刀风刃 - 左右两把风刃成形 -->
    <div class="sb-twin-blade blade-left">
      <div class="sb-blade-edge"></div>
      <div class="sb-blade-trail"></div>
    </div>
    <div class="sb-twin-blade blade-right">
      <div class="sb-blade-edge"></div>
      <div class="sb-blade-trail"></div>
    </div>

    <!-- ===== 阶段②：贯穿斩击 ===== -->
    <!-- 贯穿斩击线 - 双刀交叉X形斩击轨迹 -->
    <div class="sb-pierce-slash slash-1"></div>
    <div class="sb-pierce-slash slash-2"></div>

    <!-- 切割闪光 - 风刃经过瞬间的白光 -->
    <div class="sb-cut-flash"></div>

    <!-- ===== 阶段③：毁灭爆发 ===== -->
    <!-- 全屏风暴闪光 - 斩击命中瞬间的翠青爆闪 -->
    <div class="sb-strike-flash"></div>

    <!-- 中心能量爆发球 -->
    <div class="sb-burst-core"></div>

    <!-- 3D冲击波穹顶 - 从中心向上扩散的半球形翠青冲击波 -->
    <div class="sb-shockwave-dome"></div>

    <!-- 冲击波环 - 3层从中心扩散的冲击波 -->
    <div class="sb-shockwave-ring ring-1"></div>
    <div class="sb-shockwave-ring ring-2"></div>
    <div class="sb-shockwave-ring ring-3"></div>

    <!-- 风刃碎片 - 从中心3D飞溅的翠青风刃碎片 -->
    <div
      v-for="i in 10"
      :key="'sb-shard-' + i"
      class="sb-shard"
      :style="getShardStyle(i)"
    >
      <div class="sb-shard-head"></div>
      <div class="sb-shard-trail"></div>
    </div>

    <!-- 风刃火星 - 向四周飞溅的银白风粒 -->
    <div
      v-for="i in 12"
      :key="'sb-spark-' + i"
      class="sb-spark"
      :style="getSparkStyle(i)"
    ></div>

    <!-- ===== 阶段④：风暴消散 ===== -->
    <!-- 风能余烬 - 缓慢上浮的翠青余烬粒子 -->
    <div
      v-for="i in 8"
      :key="'sb-ember-' + i"
      class="sb-ember"
      :style="getEmberStyle(i)"
    ></div>

    <!-- 残留风痕 - 中心残留的X形风刃残影 -->
    <div class="sb-residual-slash"></div>

    <!-- 风暴余波 - 爆破后残留的风暴能量涟漪 -->
    <div class="sb-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 狂风绝刃 - 风暴凝聚·双刀成形·贯穿斩击·毁灭爆发·风暴消散
 * 风暴行者W技能特效组件，以风暴翠青和风刃银白为主色调
 * 展现将狂暴风暴之力注入双刀，锁定单一敌人发起绝命贯穿斩击的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 */

/**
 * 生成地面风压龟裂的位置样式
 * @param {number} index - 龟裂点序号（1~3）
 * @returns {Object} CSS样式对象，含水平/垂直偏移
 */
function getCrackStyle (index) {
  const angle = (index - 1) * 120 - 90
  const radius = 50
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * radius
  const ty = Math.sin(rad) * radius
  return {
    '--sb-crack-tx': `${tx}px`,
    '--sb-crack-ty': `${ty}px`
  }
}

/**
 * 生成风能汇聚粒子的样式
 * @param {number} index - 粒子序号（1~12）
 * @returns {Object} CSS样式对象，含角度、距离、尺寸、延迟
 */
function getInhaleStyle (index) {
  const angle = (index - 1) * 30
  const distance = 120 + (index % 4) * 16
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.02
  return {
    '--sb-inhale-angle': `${angle}deg`,
    '--sb-inhale-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成风刃碎片的3D飞溅样式
 * @param {number} index - 碎片序号（1~10）
 * @returns {Object} CSS样式对象，含飞溅角度、距离、Z轴深度、抛物线弧度、尺寸、延迟
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
    '--sb-shard-angle': `${angle}deg`,
    '--sb-shard-distance': `${distance}px`,
    '--sb-shard-size': `${size}px`,
    '--sb-shard-depth': `${depth}px`,
    '--sb-shard-arc': `${arc}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成风刃火星的3D飞溅样式
 * @param {number} index - 火星序号（1~12）
 * @returns {Object} CSS样式对象，含飞溅偏移、Z轴深度、尺寸、延迟
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
    '--sb-spark-tx': `${tx}px`,
    '--sb-spark-ty': `${ty}px`,
    '--sb-spark-tz': `${tz}px`,
    '--sb-spark-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成风能余烬的上浮样式
 * @param {number} index - 余烬序号（1~8）
 * @returns {Object} CSS样式对象，含水平偏移、上浮高度、尺寸、延迟
 */
function getEmberStyle (index) {
  const tx = (index % 2 === 0 ? 1 : -1) * (18 + (index % 4) * 12)
  const ty = -50 - (index % 3) * 25
  const size = 4 + (index % 3) * 2
  const delay = 0.75 + (index % 4) * 0.05
  return {
    '--sb-ember-tx': `${tx}px`,
    '--sb-ember-ty': `${ty}px`,
    '--sb-ember-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   狂风绝刃 (storm_blade) - 风暴凝聚·双刀成形·贯穿斩击·毁灭爆发·风暴消散
   技能描述：将狂暴风暴之力注入双刀，锁定单一敌人发起绝命之风刃斩击
   3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：1.8秒
   ================================================================ */

/* 3D舞台 - 透视容器，为所有3D变换提供深度视角 */
.sb-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
}

/* ---------- 阶段⓪：风暴凝聚 ---------- */

/* 风暴暗幕 - 深沉风暴阴霾全程覆盖 */
.sb-storm-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(3, 35, 25, 0.55) 0%,
    rgba(2, 22, 16, 0.35) 40%,
    rgba(1, 12, 8, 0.15) 70%,
    transparent 100%
  );
  animation: sbStormDim 1.8s ease-in-out forwards;
  will-change: opacity;
}

@keyframes sbStormDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  60% { opacity: 0.8; }
  100% { opacity: 0; }
}

/* 地面风压龟裂 - 三个风压点撕裂地面，翠青能量从裂缝中溢出 */
.sb-ground-crack {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70px;
  height: 70px;
  transform: translate(-50%, -50%) translate(var(--sb-crack-tx, 0), var(--sb-crack-ty, 0)) scale(0);
  opacity: 0;
  animation: sbGroundCrack 0.4s ease-out forwards;
  will-change: transform, opacity;
}

.sb-ground-crack::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(100, 255, 200, 0.4) 2deg,
    transparent 4deg,
    transparent 42deg,
    rgba(100, 255, 200, 0.3) 44deg,
    transparent 46deg,
    transparent 88deg,
    rgba(100, 255, 200, 0.4) 90deg,
    transparent 92deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 20%, black 30%, transparent 80%);
  mask: radial-gradient(circle, transparent 20%, black 30%, transparent 80%);
}

.sb-ground-crack::after {
  content: '';
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(150, 255, 200, 0.5) 0%,
    rgba(100, 255, 180, 0.2) 50%,
    transparent 80%
  );
}

@keyframes sbGroundCrack {
  0% { transform: translate(-50%, -50%) translate(var(--sb-crack-tx, 0), var(--sb-crack-ty, 0)) scale(0); opacity: 0; }
  30% { transform: translate(-50%, -50%) translate(var(--sb-crack-tx, 0), var(--sb-crack-ty, 0)) scale(0.8); opacity: 1; }
  100% { transform: translate(-50%, -50%) translate(var(--sb-crack-tx, 0), var(--sb-crack-ty, 0)) scale(1.3); opacity: 0; }
}

/* 风能汇聚粒子 - 周围空气被猛烈抽向中心 */
.sb-inhale-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(180, 255, 220, 0.9), rgba(80, 220, 170, 0.2));
  box-shadow: 0 0 6px rgba(120, 255, 200, 0.5);
  transform: translate(-50%, -50%) rotate(var(--sb-inhale-angle, 0deg)) translateX(var(--sb-inhale-distance, 80px)) scale(1);
  opacity: 0;
  will-change: transform, opacity;
  animation: sbInhale 0.4s ease-in forwards;
}

@keyframes sbInhale {
  0% {
    transform: translate(-50%, -50%) rotate(var(--sb-inhale-angle, 0deg)) translateX(var(--sb-inhale-distance, 80px)) scale(1);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--sb-inhale-angle, 0deg) + 180deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* 风眼蓄能 - 中心蓄能光球脉动 */
.sb-eye-charge {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(200, 255, 230, 0.7) 25%,
    rgba(100, 255, 180, 0.4) 55%,
    transparent 90%
  );
  box-shadow: 0 0 20px rgba(100, 255, 200, 0.7), 0 0 40px rgba(80, 255, 180, 0.4);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  animation: sbEyeCharge 0.45s ease-in forwards;
  will-change: transform, opacity;
}

@keyframes sbEyeCharge {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  30% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.9; }
  60% { transform: translate(-50%, -50%) scale(0.7); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}

/* ---------- 阶段①：双刀成形 ---------- */

/* 风暴光柱 - 从地面升腾的能量光柱 */
.sb-energy-pillar {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 200px;
  background: linear-gradient(to top,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(200, 255, 230, 0.7) 30%,
    rgba(120, 255, 200, 0.4) 60%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(2px);
  box-shadow: 0 0 20px rgba(150, 255, 200, 0.6);
  transform: translate(-50%, -100%) scaleX(0.3) scaleY(0);
  opacity: 0;
  animation: sbEnergyPillar 0.6s ease-out 0.25s forwards;
  will-change: transform, opacity;
}

@keyframes sbEnergyPillar {
  0% { transform: translate(-50%, -100%) scaleX(0.3) scaleY(0); opacity: 0; }
  20% { transform: translate(-50%, -100%) scaleX(1) scaleY(1); opacity: 1; }
  60% { transform: translate(-50%, -100%) scaleX(1) scaleY(1); opacity: 0.7; }
  100% { transform: translate(-50%, -100%) scaleX(0.5) scaleY(1.2); opacity: 0; }
}

/* 双刀风刃容器 - 左右两把风刃 */
.sb-twin-blade {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 160px;
  height: 6px;
  transform: translate3d(-50%, -50%, 0) scaleX(0);
  will-change: transform, opacity;
  opacity: 0;
  backface-visibility: hidden;
}

/* 左刀 - 从左侧斜向成形 */
.sb-twin-blade.blade-left {
  animation: sbBladeLeftForm 0.3s ease-out 0.3s forwards;
}

/* 右刀 - 从右侧斜向成形 */
.sb-twin-blade.blade-right {
  animation: sbBladeRightForm 0.3s ease-out 0.3s forwards;
}

@keyframes sbBladeLeftForm {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(35deg) translateX(-80px) scaleX(0);
    opacity: 0;
  }
  40% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(35deg) translateX(0) scaleX(1);
    opacity: 0.9;
  }
}

@keyframes sbBladeRightForm {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(-35deg) translateX(80px) scaleX(0);
    opacity: 0;
  }
  40% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(-35deg) translateX(0) scaleX(1);
    opacity: 0.9;
  }
}

/* 风刃刀锋 - 翠青锐利光带 */
.sb-blade-edge {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(100, 255, 200, 0.3) 15%,
    rgba(150, 255, 220, 0.9) 40%,
    rgba(255, 255, 255, 1) 50%,
    rgba(150, 255, 220, 0.9) 60%,
    rgba(100, 255, 200, 0.3) 85%,
    transparent 100%
  );
  border-radius: 50%;
  box-shadow:
    0 0 8px rgba(100, 255, 200, 0.7),
    0 0 16px rgba(80, 255, 180, 0.4);
}

/* 风刃拖尾 - 模糊的光效尾迹 */
.sb-blade-trail {
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  height: 12px;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(100, 255, 200, 0.15) 50%,
    transparent 100%
  );
  filter: blur(4px);
}

/* ---------- 阶段②：贯穿斩击 ---------- */

/* 贯穿斩击线 - 双刀交叉X形斩击轨迹 */
.sb-pierce-slash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 240px;
  height: 6px;
  border-radius: 3px;
  transform: translate3d(-50%, -50%, 0) scaleX(0);
  will-change: transform, opacity;
  opacity: 0;
  backface-visibility: hidden;
}

/* 斩击线1 - 左上到右下 */
.sb-pierce-slash.slash-1 {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(100, 255, 200, 0.9) 15%,
    rgba(255, 255, 255, 1) 50%,
    rgba(100, 255, 200, 0.9) 85%,
    transparent 100%
  );
  box-shadow:
    0 0 15px rgba(100, 255, 200, 0.8),
    0 0 30px rgba(80, 255, 180, 0.5),
    0 0 50px rgba(255, 255, 255, 0.3);
  animation: sbPierceSlash1 0.35s cubic-bezier(0.2, 0.6, 0.3, 1) 0.5s forwards;
}

/* 斩击线2 - 右上到左下 */
.sb-pierce-slash.slash-2 {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(100, 255, 200, 0.9) 15%,
    rgba(255, 255, 255, 1) 50%,
    rgba(100, 255, 200, 0.9) 85%,
    transparent 100%
  );
  box-shadow:
    0 0 15px rgba(100, 255, 200, 0.8),
    0 0 30px rgba(80, 255, 180, 0.5),
    0 0 50px rgba(255, 255, 255, 0.3);
  animation: sbPierceSlash2 0.35s cubic-bezier(0.2, 0.6, 0.3, 1) 0.52s forwards;
}

@keyframes sbPierceSlash1 {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1.3);
    opacity: 1;
  }
  60% {
    transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1);
    opacity: 0.6;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1.5);
    opacity: 0;
  }
}

@keyframes sbPierceSlash2 {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(1.3);
    opacity: 1;
  }
  60% {
    transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(1);
    opacity: 0.6;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(1.5);
    opacity: 0;
  }
}

/* 切割闪光 - 风刃经过瞬间的白光 */
.sb-cut-flash {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    115deg,
    transparent 30%,
    rgba(200, 255, 230, 0.25) 45%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(200, 255, 230, 0.25) 55%,
    transparent 70%
  );
  opacity: 0;
  animation: sbCutFlash 0.3s ease-out 0.55s forwards;
  will-change: opacity;
}

@keyframes sbCutFlash {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

/* ---------- 阶段③：毁灭爆发 ---------- */

/* 全屏风暴闪光 - 斩击命中瞬间的翠青爆闪 */
.sb-strike-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(100, 255, 200, 0.6) 12%,
    rgba(50, 200, 150, 0.3) 35%,
    rgba(20, 100, 70, 0.1) 60%,
    transparent 100%
  );
  opacity: 0;
  animation: sbStrikeFlash 0.5s ease-out 0.7s forwards;
  will-change: opacity;
}

@keyframes sbStrikeFlash {
  0% { opacity: 0; }
  8% { opacity: 1; }
  30% { opacity: 0.5; }
  100% { opacity: 0; }
}

/* 中心能量爆发球 */
.sb-burst-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(100, 255, 200, 0.85) 18%,
    rgba(50, 200, 150, 0.6) 42%,
    rgba(20, 100, 70, 0.3) 68%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: sbBurstCore 0.6s cubic-bezier(0.15, 0.6, 0.3, 1) 0.7s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}

@keyframes sbBurstCore {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  12% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 1; }
  50% { transform: translate3d(-50%, -50%, 0) scale(2.2); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3.5); opacity: 0; }
}

/* 3D冲击波穹顶 - 从中心向上扩散的半球形翠青冲击波 */
.sb-shockwave-dome {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  border: 5px solid rgba(100, 255, 200, 0.6);
  box-shadow:
    0 0 40px rgba(100, 255, 200, 0.5),
    inset 0 0 30px rgba(50, 200, 150, 0.3);
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  animation: sbShockwaveDome 0.55s cubic-bezier(0.2, 0.6, 0.3, 1) 0.7s forwards;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

@keyframes sbShockwaveDome {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0.8); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(3.5); opacity: 0; }
}

/* 冲击波环 - 3层从中心扩散的翠青冲击波 */
.sb-shockwave-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(100, 255, 200, 0.85);
  box-shadow:
    0 0 20px rgba(100, 255, 200, 0.6),
    inset 0 0 16px rgba(50, 200, 150, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.sb-shockwave-ring.ring-1 { animation: sbShockwaveRing 0.5s ease-out 0.7s forwards; }
.sb-shockwave-ring.ring-2 {
  border-color: rgba(80, 255, 180, 0.7);
  animation: sbShockwaveRing 0.55s ease-out 0.74s forwards;
}
.sb-shockwave-ring.ring-3 {
  border-color: rgba(50, 200, 150, 0.5);
  animation: sbShockwaveRing 0.6s ease-out 0.78s forwards;
}

@keyframes sbShockwaveRing {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  12% { opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(14); opacity: 0; }
}

/* 风刃碎片容器 - 从中心向指定角度3D飞溅 */
.sb-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--sb-shard-size, 30px);
  height: var(--sb-shard-size, 30px);
  transform: translate3d(-50%, -50%, 0) rotate(var(--sb-shard-angle, 0deg));
  animation: sbShardScatter3D 0.7s cubic-bezier(0.2, 0.5, 0.4, 1) 0.7s forwards;
  will-change: transform, opacity;
  opacity: 0;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

@keyframes sbShardScatter3D {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sb-shard-angle, 0deg)) translateX(0) translateZ(0) translateY(0) scale(0.5);
    opacity: 0;
  }
  10% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sb-shard-angle, 0deg)) translateX(12px) translateZ(var(--sb-shard-depth, 0px)) translateY(calc(var(--sb-shard-arc, 0px) * -0.5)) scale(1.3);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sb-shard-angle, 0deg)) translateX(calc(var(--sb-shard-distance, 100px) * 0.6)) translateZ(var(--sb-shard-depth, 0px)) translateY(calc(var(--sb-shard-arc, 0px) * -1)) scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sb-shard-angle, 0deg)) translateX(var(--sb-shard-distance, 100px)) translateZ(var(--sb-shard-depth, 0px)) translateY(0) scale(0.3);
    opacity: 0;
  }
}

/* 碎片头部 - 明亮的翠青菱形碎片 */
.sb-shard-head {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 40% 40%,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(200, 255, 230, 0.85) 25%,
    rgba(100, 255, 200, 0.75) 60%,
    rgba(50, 200, 150, 0.4) 100%
  );
  clip-path: polygon(50% 0%, 80% 30%, 100% 50%, 80% 70%, 50% 100%, 20% 70%, 0% 50%, 20% 30%);
  box-shadow:
    0 0 18px rgba(100, 255, 200, 0.8),
    0 0 35px rgba(50, 200, 150, 0.4);
}

/* 碎片拖尾 - 朝向中心的翠青尾迹 */
.sb-shard-trail {
  position: absolute;
  top: 50%;
  right: 75%;
  width: 50px;
  height: 55%;
  transform: translateY(-50%);
  background: linear-gradient(
    to left,
    rgba(100, 255, 200, 0.6) 0%,
    rgba(50, 200, 150, 0.3) 50%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(5px);
}

/* 风刃火星 - 向四周3D飞溅的银白风粒 */
.sb-spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--sb-spark-size, 6px);
  height: var(--sb-spark-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(200, 255, 230, 0.7) 45%,
    rgba(100, 255, 200, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(100, 255, 200, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: sbSparkFly3D 0.6s ease-out 0.7s forwards;
  will-change: transform, opacity;
}

@keyframes sbSparkFly3D {
  0% {
    transform: translate3d(-50%, -50%, 0) translateZ(0) scale(0);
    opacity: 0;
  }
  12% {
    transform: translate3d(-50%, -50%, 0) translateZ(0) scale(1.4);
    opacity: 1;
  }
  100% {
    transform: translate3d(calc(-50% + var(--sb-spark-tx, 0px)), calc(-50% + var(--sb-spark-ty, 0px)), var(--sb-spark-tz, 0px)) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段④：风暴消散 ---------- */

/* 风能余烬 - 缓慢上浮的翠青余烬粒子 */
.sb-ember {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--sb-ember-size, 6px);
  height: var(--sb-ember-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(100, 255, 200, 0.9) 0%,
    rgba(50, 200, 150, 0.5) 50%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(100, 255, 200, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: sbEmberFloat 1s ease-out 0.75s forwards;
  will-change: transform, opacity;
}

@keyframes sbEmberFloat {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% {
    transform: translate3d(calc(-50% + var(--sb-ember-tx, 0px) * 0.2), calc(-50% + var(--sb-ember-ty, 0px) * 0.2), 0) scale(1.2);
    opacity: 1;
  }
  80% { opacity: 0.5; }
  100% {
    transform: translate3d(calc(-50% + var(--sb-ember-tx, 0px)), calc(-50% + var(--sb-ember-ty, 0px)), 0) scale(0.2);
    opacity: 0;
  }
}

/* 残留风痕 - 中心残留的X形风刃残影 */
.sb-residual-slash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 140px;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(100, 255, 200, 0.5) 20%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(100, 255, 200, 0.5) 80%,
    transparent 100%
  );
  box-shadow: 0 0 12px rgba(100, 255, 200, 0.4);
  transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(0);
  opacity: 0;
  animation: sbResidualSlash 1s ease-out 1.1s forwards;
  will-change: transform, opacity;
}

@keyframes sbResidualSlash {
  0% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1.2); opacity: 0.7; }
  60% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1); opacity: 0.3; }
  100% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1.4); opacity: 0; }
}

/* 风暴余波 - 爆破后残留的风暴能量涟漪 */
.sb-afterglow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50%;
  height: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(100, 255, 200, 0.25) 0%,
    rgba(50, 200, 150, 0.1) 40%,
    transparent 70%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: sbAfterglow 0.9s ease-out 1.1s forwards;
  will-change: transform, opacity;
}

@keyframes sbAfterglow {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  25% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2); opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .sb-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
