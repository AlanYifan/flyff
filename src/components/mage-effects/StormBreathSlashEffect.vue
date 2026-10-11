<!--
  @file StormBreathSlashEffect.vue
  @generated 2026-08-02
  @description 狂风绝息斩 - 风暴领域·连续风刃·绝息斩击·范围爆发·风暴消散
  风暴行者U技能（AOE风属性伤害）：将狂暴风暴之力注入双刀，以极快攻速对范围内敌人发动绝息之风刃斩击
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
  动画总时长：2.2秒（显示1.8秒 + 渐隐消散0.4秒）
    ⓪ 风暴领域（0s ~ 0.4s）- 风暴领域展开 + 地面风压阵 + 风能汇聚
    ① 连续风刃（0.3s ~ 1.2s）- 多重风刃连续横扫 + 风刃轨迹交错 + 切割闪光
    ② 绝息斩击（0.6s ~ 1.5s）- 交叉绝息斩 + 中心能量爆发 + 冲击波环
    ③ 范围爆发（1.0s ~ 1.8s）- AOE风暴冲击波 + 风刃碎片飞溅 + 碎石飞溅
    ④ 风暴消散（1.6s ~ 2.2s）- 余波消散 + 残留风痕 + 风能上浮
  色彩方案：风暴翠青(#64FFC8) + 风刃银白(#E8FFF8) + 绝息金白(#FFFFF0) + 深邃风暴青(#2A8A6A)
-->
<template>
  <!-- 3D舞台 - 透视容器，为狂风绝息斩提供3D空间深度 -->
  <div class="sbs-3d-stage">
    <!-- ===== 阶段⓪：风暴领域 ===== -->
    <!-- 风暴暗幕 - 深沉风暴阴霾全程覆盖 -->
    <div class="sbs-storm-dim"></div>

    <!-- 风暴领域阵 - 地面展开的风暴法阵 -->
    <div class="sbs-domain-circle">
      <div class="sbs-domain-ring ring-1"></div>
      <div class="sbs-domain-ring ring-2"></div>
      <div class="sbs-domain-ring ring-3"></div>
      <div class="sbs-domain-core"></div>
    </div>

    <!-- 风能汇聚粒子 - 周围空气被猛烈抽向中心 -->
    <div
      v-for="i in 16"
      :key="'sbs-inhale-' + i"
      class="sbs-inhale-particle"
      :style="getInhaleStyle(i)"
    ></div>

    <!-- ===== 阶段①：连续风刃 ===== -->
    <!-- 多重风刃 - 连续横扫的月牙形风刃 -->
    <div
      v-for="i in 8"
      :key="'sbs-blade-' + i"
      class="sbs-wind-blade"
      :style="getBladeStyle(i)"
    >
      <div class="sbs-blade-edge"></div>
      <div class="sbs-blade-trail"></div>
    </div>

    <!-- 风刃轨迹 - 交错的刀光线条 -->
    <div
      v-for="i in 6"
      :key="'sbs-trail-' + i"
      class="sbs-blade-trail-line"
      :style="getTrailLineStyle(i)"
    ></div>

    <!-- ===== 阶段②：绝息斩击 ===== -->
    <!-- 交叉绝息斩 - 中心X形绝息斩击 -->
    <div class="sbs-fatal-slash slash-1"></div>
    <div class="sbs-fatal-slash slash-2"></div>

    <!-- 全屏风暴闪光 - 绝息斩瞬间的翠青爆闪 -->
    <div class="sbs-strike-flash"></div>

    <!-- 中心能量爆发球 -->
    <div class="sbs-burst-core"></div>

    <!-- ===== 阶段③：范围爆发 ===== -->
    <!-- 3D冲击波穹顶 - 从中心向上扩散的半球形翠青冲击波 -->
    <div class="sbs-shockwave-dome"></div>

    <!-- AOE冲击波环 - 多层从中心扩散的冲击波 -->
    <div class="sbs-shockwave-ring sw-1"></div>
    <div class="sbs-shockwave-ring sw-2"></div>
    <div class="sbs-shockwave-ring sw-3"></div>
    <div class="sbs-shockwave-ring sw-4"></div>

    <!-- 地面冲击波 - 沿地面快速扩散的扁平风暴冲击波 -->
    <div class="sbs-ground-blast"></div>

    <!-- 风刃碎片 - 从中心3D飞溅的翠青风刃碎片 -->
    <div
      v-for="i in 14"
      :key="'sbs-shard-' + i"
      class="sbs-shard"
      :style="getShardStyle(i)"
    >
      <div class="sbs-shard-head"></div>
      <div class="sbs-shard-trail"></div>
    </div>

    <!-- 碎石飞溅 - 被风暴卷起的碎石弧线飞散 -->
    <div
      v-for="i in 10"
      :key="'sbs-debris-' + i"
      class="sbs-flying-debris"
      :style="getDebrisStyle(i)"
    ></div>

    <!-- 旋转卷风 - 被风暴卷着旋转飘散的风尘 -->
    <div
      v-for="i in 10"
      :key="'sbs-swirl-' + i"
      class="sbs-swirl-dust"
      :style="getSwirlStyle(i)"
    ></div>

    <!-- ===== 阶段④：风暴消散 ===== -->
    <!-- 风能余烬 - 缓慢上浮的翠青余烬粒子 -->
    <div
      v-for="i in 10"
      :key="'sbs-ember-' + i"
      class="sbs-ember"
      :style="getEmberStyle(i)"
    ></div>

    <!-- 残留风痕 - 中心残留的X形风刃残影 -->
    <div class="sbs-residual-slash"></div>

    <!-- 风暴余波 - 爆破后残留的风暴能量涟漪 -->
    <div class="sbs-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 狂风绝息斩 - 风暴领域·连续风刃·绝息斩击·范围爆发·风暴消散
 * 风暴行者U技能特效组件，以风暴翠青和风刃银白为主色调
 * 展现以极快攻速对范围内敌人发动连续绝息风刃斩击的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 */

/**
 * 生成风能汇聚粒子的样式
 * @param {number} index - 粒子序号（1~16）
 * @returns {Object} CSS样式对象，含角度、距离、尺寸、延迟
 */
function getInhaleStyle (index) {
  const angle = (index - 1) * 22.5
  const distance = 140 + (index % 4) * 18
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.02
  return {
    '--sbs-inhale-angle': `${angle}deg`,
    '--sbs-inhale-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成多重风刃的横扫样式
 * @param {number} index - 风刃序号（1~8）
 * @returns {Object} CSS样式对象，含角度、距离、尺寸、延迟
 */
function getBladeStyle (index) {
  const angle = (index - 1) * 45 + (index % 2) * 12
  const distance = 180 + (index % 3) * 35
  const delay = 0.3 + (index - 1) * 0.08
  return {
    '--sbs-blade-angle': `${angle}deg`,
    '--sbs-blade-distance': `${distance}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成风刃轨迹线的样式
 * @param {number} index - 轨迹线序号（1~6）
 * @returns {Object} CSS样式对象，含角度、偏移、尺寸、延迟
 */
function getTrailLineStyle (index) {
  const angle = -30 + (index - 1) * 20 + (index % 2) * 10
  const offset = (index % 2 === 0 ? 1 : -1) * (20 + (index % 3) * 15)
  const size = 100 + (index % 3) * 30
  const delay = 0.35 + (index - 1) * 0.06
  return {
    '--sbs-trail-angle': `${angle}deg`,
    '--sbs-trail-offset': `${offset}px`,
    '--sbs-trail-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成风刃碎片的3D飞溅样式
 * @param {number} index - 碎片序号（1~14）
 * @returns {Object} CSS样式对象，含飞溅角度、距离、Z轴深度、抛物线弧度、尺寸、延迟
 */
function getShardStyle (index) {
  const angle = (index - 1) * 25.7
  const distance = 120 + (index % 4) * 40
  const size = 26 + (index % 3) * 12
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const depth = depthDir * (45 + (index % 2) * 30)
  const arc = 25 + (index % 4) * 18
  const delay = 1.0 + (index % 3) * 0.03
  return {
    '--sbs-shard-angle': `${angle}deg`,
    '--sbs-shard-distance': `${distance}px`,
    '--sbs-shard-size': `${size}px`,
    '--sbs-shard-depth': `${depth}px`,
    '--sbs-shard-arc': `${arc}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成碎石飞溅的3D弧线样式
 * @param {number} index - 碎石序号（1~10）
 * @returns {Object} CSS样式对象，含飞溅角度、距离、高度、尺寸、延迟
 */
function getDebrisStyle (index) {
  const angle = (index - 1) * 36 + (index % 2) * 9
  const distance = 100 + (index % 4) * 28
  const height = 60 + (index % 3) * 25
  const size = 6 + (index % 3) * 3
  const delay = 0.9 + (index % 4) * 0.05
  return {
    '--sbs-debris-angle': `${angle}deg`,
    '--sbs-debris-distance': `${distance}px`,
    '--sbs-debris-height': `${height}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成旋转卷风的样式
 * @param {number} index - 卷风序号（1~10）
 * @returns {Object} CSS样式对象，含起始角度、旋转半径、尺寸、延迟
 */
function getSwirlStyle (index) {
  const angle = (index - 1) * 36
  const radius = 80 + (index % 5) * 20
  const size = 3 + (index % 3) * 2
  const delay = 0.8 + (index % 7) * 0.06
  return {
    '--sbs-swirl-angle': `${angle}deg`,
    '--sbs-swirl-radius': `${radius}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成风能余烬的上浮样式
 * @param {number} index - 余烬序号（1~10）
 * @returns {Object} CSS样式对象，含水平偏移、上浮高度、尺寸、延迟
 */
function getEmberStyle (index) {
  const tx = (index % 2 === 0 ? 1 : -1) * (22 + (index % 4) * 14)
  const ty = -55 - (index % 3) * 28
  const size = 4 + (index % 3) * 2
  const delay = 1.1 + (index % 4) * 0.05
  return {
    '--sbs-ember-tx': `${tx}px`,
    '--sbs-ember-ty': `${ty}px`,
    '--sbs-ember-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   狂风绝息斩 (storm_breath_slash) - 风暴领域·连续风刃·绝息斩击·范围爆发·风暴消散
   技能描述：以极快攻速对范围内敌人发动绝息之风刃斩击，造成毁灭性风属性范围伤害
   3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：2.2秒
   ================================================================ */

/* 3D舞台 - 透视容器，为所有3D变换提供深度视角 */
.sbs-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
}

/* ---------- 阶段⓪：风暴领域 ---------- */

/* 风暴暗幕 - 深沉风暴阴霾全程覆盖 */
.sbs-storm-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(3, 35, 25, 0.6) 0%,
    rgba(2, 22, 16, 0.4) 40%,
    rgba(1, 12, 8, 0.15) 70%,
    transparent 100%
  );
  animation: sbsStormDim 2.2s ease-in-out forwards;
  will-change: opacity;
}

@keyframes sbsStormDim {
  0% { opacity: 0; }
  5% { opacity: 1; }
  70% { opacity: 0.85; }
  100% { opacity: 0; }
}

/* 风暴领域阵 - 地面展开的风暴法阵 */
.sbs-domain-circle {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%) rotateX(75deg);
  transform-style: preserve-3d;
}

/* 领域环 - 3层旋转的风暴法阵环 */
.sbs-domain-ring {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  border: 3px solid rgba(100, 255, 200, 0.5);
  box-shadow: 0 0 15px rgba(100, 255, 200, 0.3);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.sbs-domain-ring.ring-1 {
  width: 200px;
  height: 200px;
  animation: sbsDomainRing 0.4s ease-out forwards, sbsSpinCW 1.5s linear 0.4s infinite;
}
.sbs-domain-ring.ring-2 {
  width: 280px;
  height: 280px;
  border-color: rgba(80, 255, 180, 0.4);
  animation: sbsDomainRing 0.4s ease-out 0.1s forwards, sbsSpinCCW 2s linear 0.5s infinite;
}
.sbs-domain-ring.ring-3 {
  width: 360px;
  height: 360px;
  border-color: rgba(50, 200, 150, 0.3);
  animation: sbsDomainRing 0.4s ease-out 0.2s forwards, sbsSpinCW 2.5s linear 0.6s infinite;
}

@keyframes sbsDomainRing {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  30% { opacity: 0.9; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
}

/* 领域核心 - 法阵中心光晕 */
.sbs-domain-core {
  position: absolute;
  top: 0;
  left: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(100, 255, 200, 0.5) 30%,
    rgba(50, 200, 150, 0.2) 60%,
    transparent 85%
  );
  box-shadow: 0 0 30px rgba(100, 255, 200, 0.5);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  animation: sbsDomainCore 1.5s ease-in-out forwards;
  will-change: transform, opacity;
}

@keyframes sbsDomainCore {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  15% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
  60% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
}

/* 风能汇聚粒子 - 周围空气被猛烈抽向中心 */
.sbs-inhale-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(180, 255, 220, 0.9), rgba(80, 220, 170, 0.2));
  box-shadow: 0 0 6px rgba(120, 255, 200, 0.5);
  transform: translate(-50%, -50%) rotate(var(--sbs-inhale-angle, 0deg)) translateX(var(--sbs-inhale-distance, 80px)) scale(1);
  opacity: 0;
  will-change: transform, opacity;
  animation: sbsInhale 0.4s ease-in forwards;
}

@keyframes sbsInhale {
  0% {
    transform: translate(-50%, -50%) rotate(var(--sbs-inhale-angle, 0deg)) translateX(var(--sbs-inhale-distance, 80px)) scale(1);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--sbs-inhale-angle, 0deg) + 180deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段①：连续风刃 ---------- */

/* 多重风刃 - 连续横扫的月牙形风刃 */
.sbs-wind-blade {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%) rotate(var(--sbs-blade-angle, 0deg));
  opacity: 0;
  will-change: transform, opacity;
  animation: sbsBladeFly 0.6s ease-out forwards;
}

@keyframes sbsBladeFly {
  0% { opacity: 0; }
  10% { opacity: 1; }
  80% { opacity: 0.5; }
  100% { opacity: 0; }
}

/* 风刃本体 - 月牙形翠青光刃 */
.sbs-blade-edge {
  position: absolute;
  top: 0;
  left: 0;
  width: 80px;
  height: 18px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(180, 255, 220, 0.15) 10%,
    rgba(220, 255, 240, 0.5) 35%,
    rgba(255, 255, 255, 0.9) 50%,
    rgba(220, 255, 240, 0.5) 65%,
    rgba(180, 255, 220, 0.15) 90%,
    transparent 100%
  );
  border-radius: 50%;
  box-shadow: 0 0 14px rgba(100, 255, 200, 0.6), 0 0 28px rgba(80, 255, 180, 0.3);
  transform: translateX(0) scaleX(0);
  will-change: transform;
  animation: sbsBladeEdge 0.6s ease-out forwards;
}

@keyframes sbsBladeEdge {
  0% { transform: translateX(0) scaleX(0); }
  15% { transform: translateX(calc(var(--sbs-blade-distance, 180px) * 0.15)) scaleX(1); }
  100% { transform: translateX(var(--sbs-blade-distance, 180px)) scaleX(0.3); }
}

/* 风刃拖尾 */
.sbs-blade-trail {
  position: absolute;
  top: -2px;
  left: 0;
  width: 60px;
  height: 22px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(100, 255, 200, 0.2) 50%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(5px);
}

/* 风刃轨迹线 - 交错的刀光线条 */
.sbs-blade-trail-line {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--sbs-trail-size, 100px);
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(100, 255, 200, 0.8) 15%,
    rgba(255, 255, 255, 1) 50%,
    rgba(100, 255, 200, 0.8) 85%,
    transparent 100%
  );
  box-shadow:
    0 0 10px rgba(100, 255, 200, 0.6),
    0 0 20px rgba(80, 255, 180, 0.4);
  transform: translate3d(-50%, -50%, 0) rotate(var(--sbs-trail-angle, 0deg)) translateX(var(--sbs-trail-offset, 0px)) scaleX(0);
  animation: sbsTrailLine 0.3s ease-out forwards;
  will-change: transform, opacity;
  opacity: 0;
  backface-visibility: hidden;
}

@keyframes sbsTrailLine {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sbs-trail-angle, 0deg)) translateX(var(--sbs-trail-offset, 0px)) scaleX(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sbs-trail-angle, 0deg)) translateX(var(--sbs-trail-offset, 0px)) scaleX(1.2);
    opacity: 1;
  }
  60% { opacity: 0.5; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sbs-trail-angle, 0deg)) translateX(var(--sbs-trail-offset, 0px)) scaleX(1.4);
    opacity: 0;
  }
}

/* ---------- 阶段②：绝息斩击 ---------- */

/* 交叉绝息斩 - 中心X形绝息斩击 */
.sbs-fatal-slash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 280px;
  height: 8px;
  border-radius: 4px;
  transform: translate3d(-50%, -50%, 0) scaleX(0);
  will-change: transform, opacity;
  opacity: 0;
  backface-visibility: hidden;
}

.sbs-fatal-slash.slash-1 {
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
    0 0 30px rgba(50, 200, 150, 0.5),
    0 0 50px rgba(255, 255, 255, 0.3);
  animation: sbsFatalSlash1 0.4s cubic-bezier(0.2, 0.6, 0.3, 1) 0.6s forwards;
}

.sbs-fatal-slash.slash-2 {
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
    0 0 30px rgba(50, 200, 150, 0.5),
    0 0 50px rgba(255, 255, 255, 0.3);
  animation: sbsFatalSlash2 0.4s cubic-bezier(0.2, 0.6, 0.3, 1) 0.62s forwards;
}

@keyframes sbsFatalSlash1 {
  0% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1.3); opacity: 1; }
  60% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1.5); opacity: 0; }
}

@keyframes sbsFatalSlash2 {
  0% { transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(1.3); opacity: 1; }
  60% { transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(1); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(1.5); opacity: 0; }
}

/* 全屏风暴闪光 - 绝息斩瞬间的翠青爆闪 */
.sbs-strike-flash {
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
  animation: sbsStrikeFlash 0.5s ease-out 0.6s forwards;
  will-change: opacity;
}

@keyframes sbsStrikeFlash {
  0% { opacity: 0; }
  8% { opacity: 1; }
  30% { opacity: 0.5; }
  100% { opacity: 0; }
}

/* 中心能量爆发球 */
.sbs-burst-core {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 180px;
  height: 180px;
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
  animation: sbsBurstCore 0.6s cubic-bezier(0.15, 0.6, 0.3, 1) 0.6s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}

@keyframes sbsBurstCore {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  12% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 1; }
  50% { transform: translate3d(-50%, -50%, 0) scale(2.2); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3.5); opacity: 0; }
}

/* ---------- 阶段③：范围爆发 ---------- */

/* 3D冲击波穹顶 - 从中心向上扩散的半球形翠青冲击波 */
.sbs-shockwave-dome {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  border: 5px solid rgba(100, 255, 200, 0.6);
  box-shadow:
    0 0 40px rgba(100, 255, 200, 0.5),
    inset 0 0 30px rgba(50, 200, 150, 0.3);
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  animation: sbsShockwaveDome 0.6s cubic-bezier(0.2, 0.6, 0.3, 1) 1s forwards;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

@keyframes sbsShockwaveDome {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0.8); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(4); opacity: 0; }
}

/* AOE冲击波环 - 4层从中心扩散的翠青冲击波 */
.sbs-shockwave-ring {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 4px solid rgba(100, 255, 200, 0.85);
  box-shadow:
    0 0 20px rgba(100, 255, 200, 0.6),
    inset 0 0 16px rgba(50, 200, 150, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.sbs-shockwave-ring.sw-1 {
  border-width: 6px;
  animation: sbsShockwaveRing 1s cubic-bezier(0.05, 0.9, 0.25, 1) 1s forwards;
}
.sbs-shockwave-ring.sw-2 {
  border-width: 5px;
  border-color: rgba(80, 255, 180, 0.65);
  animation: sbsShockwaveRing 1.1s cubic-bezier(0.05, 0.9, 0.25, 1) 1.1s forwards;
}
.sbs-shockwave-ring.sw-3 {
  border-width: 4px;
  border-color: rgba(50, 200, 150, 0.5);
  animation: sbsShockwaveRing 1.2s cubic-bezier(0.05, 0.9, 0.25, 1) 1.2s forwards;
}
.sbs-shockwave-ring.sw-4 {
  border-width: 3px;
  border-color: rgba(30, 150, 100, 0.35);
  animation: sbsShockwaveRing 1.3s cubic-bezier(0.05, 0.9, 0.25, 1) 1.3s forwards;
}

@keyframes sbsShockwaveRing {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  8% { opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(22); opacity: 0; }
}

/* 地面冲击波 - 沿地面快速扩散的扁平风暴冲击波 */
.sbs-ground-blast {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 40%,
    rgba(100, 255, 200, 0.4) 50%,
    rgba(50, 200, 150, 0.2) 65%,
    transparent 80%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: sbsGroundBlast 0.5s ease-out 1s forwards;
  will-change: transform, opacity;
}

@keyframes sbsGroundBlast {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(10); opacity: 0; }
}

/* 风刃碎片容器 - 从中心向指定角度3D飞溅 */
.sbs-shard {
  position: absolute;
  top: 55%;
  left: 50%;
  width: var(--sbs-shard-size, 30px);
  height: var(--sbs-shard-size, 30px);
  transform: translate3d(-50%, -50%, 0) rotate(var(--sbs-shard-angle, 0deg));
  animation: sbsShardScatter3D 0.8s cubic-bezier(0.2, 0.5, 0.4, 1) 1s forwards;
  will-change: transform, opacity;
  opacity: 0;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

@keyframes sbsShardScatter3D {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sbs-shard-angle, 0deg)) translateX(0) translateZ(0) translateY(0) scale(0.5);
    opacity: 0;
  }
  10% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sbs-shard-angle, 0deg)) translateX(12px) translateZ(var(--sbs-shard-depth, 0px)) translateY(calc(var(--sbs-shard-arc, 0px) * -0.5)) scale(1.3);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sbs-shard-angle, 0deg)) translateX(calc(var(--sbs-shard-distance, 100px) * 0.6)) translateZ(var(--sbs-shard-depth, 0px)) translateY(calc(var(--sbs-shard-arc, 0px) * -1)) scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sbs-shard-angle, 0deg)) translateX(var(--sbs-shard-distance, 100px)) translateZ(var(--sbs-shard-depth, 0px)) translateY(0) scale(0.3);
    opacity: 0;
  }
}

/* 碎片头部 - 明亮的翠青菱形碎片 */
.sbs-shard-head {
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
.sbs-shard-trail {
  position: absolute;
  top: 50%;
  right: 75%;
  width: 55px;
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

/* 碎石飞溅 - 被风暴卷起的碎石弧线飞散 */
.sbs-flying-debris {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 30%;
  background: radial-gradient(circle at 30% 30%,
    rgba(220, 255, 240, 0.9) 0%,
    rgba(150, 230, 200, 0.5) 50%,
    rgba(80, 180, 150, 0.2) 100%
  );
  box-shadow: 0 0 5px rgba(180, 255, 220, 0.5);
  transform: translate(-50%, -50%) rotate(var(--sbs-debris-angle, 0deg)) translateX(0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: sbsDebrisFly 0.9s ease-out 0.9s forwards;
}

@keyframes sbsDebrisFly {
  0% {
    transform: translate(-50%, -50%) rotate(var(--sbs-debris-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--sbs-debris-angle, 0deg)) translateX(calc(var(--sbs-debris-distance, 100px) * 0.2)) translateY(calc(var(--sbs-debris-height, 60px) * -0.4)) scale(1) rotate(0deg);
  }
  50% {
    transform: translate(-50%, -50%) rotate(var(--sbs-debris-angle, 0deg)) translateX(calc(var(--sbs-debris-distance, 100px) * 0.6)) translateY(calc(var(--sbs-debris-height, 60px) * -1)) scale(0.9) rotate(120deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--sbs-debris-angle, 0deg)) translateX(var(--sbs-debris-distance, 100px)) translateY(10px) scale(0.4) rotate(360deg);
    opacity: 0;
  }
}

/* 旋转卷风 - 被风暴卷着旋转飘散的风尘 */
.sbs-swirl-dust {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(200, 255, 230, 0.55), rgba(100, 220, 180, 0.12));
  box-shadow: 0 0 4px rgba(150, 255, 210, 0.3);
  transform: translate(-50%, -50%) rotate(var(--sbs-swirl-angle, 0deg)) translateX(0) scale(0.3);
  opacity: 0;
  will-change: transform, opacity;
  animation: sbsSwirlDust 1.8s ease-out 0.8s forwards;
}

@keyframes sbsSwirlDust {
  0% {
    transform: translate(-50%, -50%) rotate(var(--sbs-swirl-angle, 0deg)) translateX(0) scale(0.3);
    opacity: 0;
  }
  10% {
    transform: translate(-50%, -50%) rotate(var(--sbs-swirl-angle, 0deg)) translateX(calc(var(--sbs-swirl-radius, 80px) * 0.4)) scale(1);
    opacity: 0.7;
  }
  40% {
    transform: translate(-50%, -50%) rotate(calc(var(--sbs-swirl-angle, 0deg) + 240deg)) translateX(var(--sbs-swirl-radius, 80px)) scale(0.8);
    opacity: 0.5;
  }
  70% {
    transform: translate(-50%, -50%) rotate(calc(var(--sbs-swirl-angle, 0deg) + 540deg)) translateX(calc(var(--sbs-swirl-radius, 80px) * 0.8)) scale(0.5);
    opacity: 0.3;
  }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--sbs-swirl-angle, 0deg) + 720deg)) translateX(calc(var(--sbs-swirl-radius, 80px) * 0.5)) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段④：风暴消散 ---------- */

/* 风能余烬 - 缓慢上浮的翠青余烬粒子 */
.sbs-ember {
  position: absolute;
  top: 55%;
  left: 50%;
  width: var(--sbs-ember-size, 6px);
  height: var(--sbs-ember-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(100, 255, 200, 0.9) 0%,
    rgba(50, 200, 150, 0.5) 50%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(100, 255, 200, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: sbsEmberFloat 1s ease-out 1.1s forwards;
  will-change: transform, opacity;
}

@keyframes sbsEmberFloat {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% {
    transform: translate3d(calc(-50% + var(--sbs-ember-tx, 0px) * 0.2), calc(-50% + var(--sbs-ember-ty, 0px) * 0.2), 0) scale(1.2);
    opacity: 1;
  }
  80% { opacity: 0.5; }
  100% {
    transform: translate3d(calc(-50% + var(--sbs-ember-tx, 0px)), calc(-50% + var(--sbs-ember-ty, 0px)), 0) scale(0.2);
    opacity: 0;
  }
}

/* 残留风痕 - 中心残留的X形风刃残影 */
.sbs-residual-slash {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 180px;
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
  animation: sbsResidualSlash 1s ease-out 1.6s forwards;
  will-change: transform, opacity;
}

@keyframes sbsResidualSlash {
  0% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1.2); opacity: 0.7; }
  60% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1); opacity: 0.3; }
  100% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1.4); opacity: 0; }
}

/* 风暴余波 - 爆破后残留的风暴能量涟漪 */
.sbs-afterglow {
  position: absolute;
  top: 55%;
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
  animation: sbsAfterglow 0.9s ease-out 1.6s forwards;
  will-change: transform, opacity;
}

@keyframes sbsAfterglow {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  25% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2); opacity: 0; }
}

/* 通用旋转关键帧 */
@keyframes sbsSpinCW {
  0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  100% { transform: translate(-50%, -50%) scale(1) rotate(360deg); }
}

@keyframes sbsSpinCCW {
  0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  100% { transform: translate(-50%, -50%) scale(1) rotate(-360deg); }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .sbs-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
