<!--
  @file StormMarkEffect.vue
  @generated 2026-08-02
  @description 风暴印记 - 风暴凝聚·印记铭刻·属性破碎·印记侵蚀·风暴消散
  风暴行者E技能（单体DEBUFF）：将风暴之力注入双刀斩击敌人，命中后施加「风暴印记」降低所有属性抗性
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
  动画总时长：1.8秒（显示1.4秒 + 渐隐消散0.4秒）
    ⓪ 风暴凝聚（0s ~ 0.35s）- 风能向中心汇聚 + 风刃成形 + 蓄能脉动
    ① 印记铭刻（0.3s ~ 0.7s）- 斩击命中 + 印记法阵铭刻 + 风刃轨迹
    ② 属性破碎（0.5s ~ 1.1s）- 五元素抗性破碎 + 碎裂冲击波 + 中心爆发
    ③ 印记侵蚀（0.7s ~ 1.4s）- 印记锁链缠绕 + 虚弱光环 + 侵蚀粒子
    ④ 风暴消散（1.1s ~ 1.8s）- 余波消散 + 残留印记渐隐 + 风能上浮
  色彩方案：风暴翠青(#64FFC8) + 印记银白(#E8FFF8) + 破碎金白(#FFFFF0) + 虚弱暗青(#1A6B4F)
-->
<template>
  <!-- 3D舞台 - 透视容器，为风暴印记提供3D空间深度 -->
  <div class="sm-3d-stage">
    <!-- ===== 阶段⓪：风暴凝聚 ===== -->
    <!-- 风暴暗幕 - 深沉风暴阴霾全程覆盖 -->
    <div class="sm-storm-dim"></div>

    <!-- 风能汇聚粒子 - 周围空气被猛烈抽向中心 -->
    <div
      v-for="i in 10"
      :key="'sm-inhale-' + i"
      class="sm-inhale-particle"
      :style="getInhaleStyle(i)"
    ></div>

    <!-- 风刃蓄能 - 中心蓄能光球脉动 -->
    <div class="sm-charge-core"></div>

    <!-- ===== 阶段①：印记铭刻 ===== -->
    <!-- 斩击轨迹 - 双刀斩击刀光 -->
    <div class="sm-slash-trail trail-1"></div>
    <div class="sm-slash-trail trail-2"></div>

    <!-- 切割闪光 - 风刃经过瞬间的白光 -->
    <div class="sm-cut-flash"></div>

    <!-- 印记法阵 - 地面铭刻的风暴印记法阵 -->
    <div class="sm-mark-circle">
      <div class="sm-mark-ring outer-ring"></div>
      <div class="sm-mark-ring mid-ring"></div>
      <div class="sm-mark-ring inner-ring"></div>
      <!-- 五元素节点 - 对应五种属性抗性降低 -->
      <div
        v-for="i in 5"
        :key="'sm-element-' + i"
        class="sm-element-node"
        :style="getElementNodeStyle(i)"
      ></div>
      <div class="sm-mark-sigil"></div>
    </div>

    <!-- ===== 阶段②：属性破碎 ===== -->
    <!-- 全屏破碎闪光 - 属性抗性破碎瞬间的翠青爆闪 -->
    <div class="sm-shatter-flash"></div>

    <!-- 中心能量爆发球 -->
    <div class="sm-burst-core"></div>

    <!-- 碎裂冲击波环 - 3层从中心扩散的碎裂冲击波 -->
    <div class="sm-shockwave-ring ring-1"></div>
    <div class="sm-shockwave-ring ring-2"></div>
    <div class="sm-shockwave-ring ring-3"></div>

    <!-- 元素碎片 - 五种属性抗性破碎飞溅的碎片 -->
    <div
      v-for="i in 10"
      :key="'sm-fragment-' + i"
      class="sm-fragment"
      :style="getFragmentStyle(i)"
    >
      <div class="sm-fragment-head"></div>
      <div class="sm-fragment-trail"></div>
    </div>

    <!-- ===== 阶段③：印记侵蚀 ===== -->
    <!-- 印记锁链 - 从印记法阵延伸的虚弱锁链 -->
    <div
      v-for="i in 6"
      :key="'sm-chain-' + i"
      class="sm-vulnerability-chain"
      :style="getChainStyle(i)"
    ></div>

    <!-- 虚弱光环 - 印记侵蚀的暗青色光环 -->
    <div class="sm-weakness-aura"></div>

    <!-- 侵蚀粒子 - 向中心汇聚的侵蚀能量 -->
    <div
      v-for="i in 8"
      :key="'sm-erosion-' + i"
      class="sm-erosion-particle"
      :style="getErosionStyle(i)"
    ></div>

    <!-- ===== 阶段④：风暴消散 ===== -->
    <!-- 风能余烬 - 缓慢上浮的翠青余烬粒子 -->
    <div
      v-for="i in 8"
      :key="'sm-ember-' + i"
      class="sm-ember"
      :style="getEmberStyle(i)"
    ></div>

    <!-- 残留印记 - 中心残留的印记残影 -->
    <div class="sm-residual-mark"></div>

    <!-- 风暴余波 - 爆破后残留的风暴能量涟漪 -->
    <div class="sm-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 风暴印记 - 风暴凝聚·印记铭刻·属性破碎·印记侵蚀·风暴消散
 * 风暴行者E技能特效组件，以风暴翠青和印记银白为主色调
 * 展现斩击敌人并施加风暴印记、降低所有属性抗性的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 */

/**
 * 生成风能汇聚粒子的样式
 * @param {number} index - 粒子序号（1~10）
 * @returns {Object} CSS样式对象，含角度、距离、尺寸、延迟
 */
function getInhaleStyle (index) {
  const angle = (index - 1) * 36
  const distance = 110 + (index % 4) * 14
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.025
  return {
    '--sm-inhale-angle': `${angle}deg`,
    '--sm-inhale-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成五元素节点的位置样式
 * 五个节点对应火、风、土、雷、水五种属性抗性降低
 * @param {number} index - 节点序号（1~5）
 * @returns {Object} CSS样式对象，含角度、延迟
 */
function getElementNodeStyle (index) {
  const angle = (index - 1) * 72 - 90
  const delay = 0.4 + (index - 1) * 0.04
  return {
    '--sm-element-angle': `${angle}deg`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成元素碎片的3D飞溅样式
 * @param {number} index - 碎片序号（1~10）
 * @returns {Object} CSS样式对象，含飞溅角度、距离、Z轴深度、抛物线弧度、尺寸、延迟
 */
function getFragmentStyle (index) {
  const angle = (index - 1) * 36
  const distance = 100 + (index % 4) * 30
  const size = 22 + (index % 3) * 10
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const depth = depthDir * (40 + (index % 2) * 25)
  const arc = 18 + (index % 4) * 12
  const delay = 0.55 + (index % 3) * 0.03
  return {
    '--sm-fragment-angle': `${angle}deg`,
    '--sm-fragment-distance': `${distance}px`,
    '--sm-fragment-size': `${size}px`,
    '--sm-fragment-depth': `${depth}px`,
    '--sm-fragment-arc': `${arc}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成虚弱锁链的位置样式
 * @param {number} index - 锁链序号（1~6）
 * @returns {Object} CSS样式对象，含角度、长度、延迟
 */
function getChainStyle (index) {
  const angle = (index - 1) * 60
  const length = 80 + (index % 3) * 20
  const delay = 0.7 + (index % 3) * 0.05
  return {
    '--sm-chain-angle': `${angle}deg`,
    '--sm-chain-length': `${length}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成侵蚀粒子的样式
 * @param {number} index - 粒子序号（1~8）
 * @returns {Object} CSS样式对象，含角度、距离、尺寸、延迟
 */
function getErosionStyle (index) {
  const angle = (index - 1) * 45
  const distance = 70 + (index % 3) * 20
  const size = 4 + (index % 3) * 2
  const delay = 0.75 + (index % 4) * 0.04
  return {
    '--sm-erosion-angle': `${angle}deg`,
    '--sm-erosion-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
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
  const ty = -50 - (index % 3) * 22
  const size = 4 + (index % 3) * 2
  const delay = 0.8 + (index % 4) * 0.05
  return {
    '--sm-ember-tx': `${tx}px`,
    '--sm-ember-ty': `${ty}px`,
    '--sm-ember-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   风暴印记 (storm_mark) - 风暴凝聚·印记铭刻·属性破碎·印记侵蚀·风暴消散
   技能描述：斩击敌人并施加风暴印记，降低所有属性抗性70%
   3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：1.8秒
   ================================================================ */

/* 3D舞台 - 透视容器，为所有3D变换提供深度视角 */
.sm-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
}

/* ---------- 阶段⓪：风暴凝聚 ---------- */

/* 风暴暗幕 - 深沉风暴阴霾全程覆盖 */
.sm-storm-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(3, 30, 22, 0.5) 0%,
    rgba(2, 20, 14, 0.3) 40%,
    rgba(1, 10, 7, 0.12) 70%,
    transparent 100%
  );
  animation: smStormDim 1.8s ease-in-out forwards;
  will-change: opacity;
}

@keyframes smStormDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  60% { opacity: 0.8; }
  100% { opacity: 0; }
}

/* 风能汇聚粒子 - 周围空气被猛烈抽向中心 */
.sm-inhale-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(180, 255, 220, 0.9), rgba(80, 220, 170, 0.2));
  box-shadow: 0 0 6px rgba(120, 255, 200, 0.5);
  transform: translate(-50%, -50%) rotate(var(--sm-inhale-angle, 0deg)) translateX(var(--sm-inhale-distance, 80px)) scale(1);
  opacity: 0;
  will-change: transform, opacity;
  animation: smInhale 0.35s ease-in forwards;
}

@keyframes smInhale {
  0% {
    transform: translate(-50%, -50%) rotate(var(--sm-inhale-angle, 0deg)) translateX(var(--sm-inhale-distance, 80px)) scale(1);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--sm-inhale-angle, 0deg) + 180deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* 风刃蓄能 - 中心蓄能光球脉动 */
.sm-charge-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 36px;
  height: 36px;
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
  animation: smChargeCore 0.4s ease-in forwards;
  will-change: transform, opacity;
}

@keyframes smChargeCore {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  30% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.9; }
  60% { transform: translate(-50%, -50%) scale(0.7); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}

/* ---------- 阶段①：印记铭刻 ---------- */

/* 斩击轨迹 - 双刀斩击刀光 */
.sm-slash-trail {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 220px;
  height: 4px;
  border-radius: 2px;
  transform: translate3d(-50%, -50%, 0) scaleX(0);
  will-change: transform, opacity;
  opacity: 0;
  backface-visibility: hidden;
}

.sm-slash-trail.trail-1 {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(100, 255, 200, 0.9) 15%,
    rgba(255, 255, 255, 1) 50%,
    rgba(100, 255, 200, 0.9) 85%,
    transparent 100%
  );
  box-shadow: 0 0 10px rgba(100, 255, 200, 0.6), 0 0 20px rgba(255, 255, 255, 0.4);
  animation: smSlashTrail1 0.3s ease-out 0.3s forwards;
}

.sm-slash-trail.trail-2 {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(100, 255, 200, 0.9) 15%,
    rgba(255, 255, 255, 1) 50%,
    rgba(100, 255, 200, 0.9) 85%,
    transparent 100%
  );
  box-shadow: 0 0 10px rgba(100, 255, 200, 0.6), 0 0 20px rgba(255, 255, 255, 0.4);
  animation: smSlashTrail2 0.3s ease-out 0.35s forwards;
}

@keyframes smSlashTrail1 {
  0% { transform: translate3d(-50%, -50%, 0) rotate(40deg) scaleX(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) rotate(40deg) scaleX(1.2); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotate(40deg) scaleX(1.4); opacity: 0; }
}

@keyframes smSlashTrail2 {
  0% { transform: translate3d(-50%, -50%, 0) rotate(-40deg) scaleX(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) rotate(-40deg) scaleX(1.2); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotate(-40deg) scaleX(1.4); opacity: 0; }
}

/* 切割闪光 - 风刃经过瞬间的白光 */
.sm-cut-flash {
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
  animation: smCutFlash 0.3s ease-out 0.35s forwards;
  will-change: opacity;
}

@keyframes smCutFlash {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

/* 印记法阵 - 地面铭刻的风暴印记法阵 */
.sm-mark-circle {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%) rotateX(75deg);
  transform-style: preserve-3d;
}

/* 印记环 - 3层旋转的风暴印记法阵环 */
.sm-mark-ring {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  border: 2px solid rgba(100, 255, 200, 0.5);
  box-shadow: 0 0 12px rgba(100, 255, 200, 0.3);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.sm-mark-ring.outer-ring {
  width: 200px;
  height: 200px;
  animation: smMarkRingAppear 0.4s ease-out 0.4s forwards, smSpinCW 2s linear 0.8s infinite;
}
.sm-mark-ring.mid-ring {
  width: 140px;
  height: 140px;
  border-color: rgba(80, 255, 180, 0.6);
  animation: smMarkRingAppear 0.4s ease-out 0.45s forwards, smSpinCCW 1.5s linear 0.85s infinite;
}
.sm-mark-ring.inner-ring {
  width: 80px;
  height: 80px;
  border-color: rgba(255, 255, 255, 0.7);
  animation: smMarkRingAppear 0.4s ease-out 0.5s forwards, smSpinCW 1s linear 0.9s infinite;
}

@keyframes smMarkRingAppear {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  30% { opacity: 0.9; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
}

/* 五元素节点 - 对应五种属性抗性降低 */
.sm-element-node {
  position: absolute;
  top: 0;
  left: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(100, 255, 200, 0.7) 40%,
    rgba(50, 200, 150, 0.3) 100%
  );
  box-shadow: 0 0 10px rgba(100, 255, 200, 0.6);
  transform: translate(-50%, -50%) rotate(var(--sm-element-angle, 0deg)) translateX(100px) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: smElementNode 0.3s ease-out forwards;
}

@keyframes smElementNode {
  0% { transform: translate(-50%, -50%) rotate(var(--sm-element-angle, 0deg)) translateX(100px) scale(0); opacity: 0; }
  40% { transform: translate(-50%, -50%) rotate(var(--sm-element-angle, 0deg)) translateX(100px) scale(1.4); opacity: 1; }
  100% { transform: translate(-50%, -50%) rotate(var(--sm-element-angle, 0deg)) translateX(100px) scale(1); opacity: 0.8; }
}

/* 印记符文 - 法阵中心的符文标记 */
.sm-mark-sigil {
  position: absolute;
  top: 0;
  left: 0;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(100, 255, 200, 0.6) 30%,
    transparent 70%
  );
  box-shadow: 0 0 20px rgba(100, 255, 200, 0.5);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  animation: smMarkSigil 1.2s ease-in-out 0.5s forwards;
  will-change: transform, opacity;
}

@keyframes smMarkSigil {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  15% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
}

/* ---------- 阶段②：属性破碎 ---------- */

/* 全屏破碎闪光 - 属性抗性破碎瞬间的翠青爆闪 */
.sm-shatter-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(100, 255, 200, 0.5) 15%,
    rgba(50, 200, 150, 0.25) 35%,
    rgba(20, 100, 70, 0.08) 60%,
    transparent 100%
  );
  opacity: 0;
  animation: smShatterFlash 0.5s ease-out 0.5s forwards;
  will-change: opacity;
}

@keyframes smShatterFlash {
  0% { opacity: 0; }
  8% { opacity: 1; }
  30% { opacity: 0.5; }
  100% { opacity: 0; }
}

/* 中心能量爆发球 */
.sm-burst-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 140px;
  height: 140px;
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
  animation: smBurstCore 0.5s cubic-bezier(0.15, 0.6, 0.3, 1) 0.5s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}

@keyframes smBurstCore {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  12% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 1; }
  50% { transform: translate3d(-50%, -50%, 0) scale(2); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3); opacity: 0; }
}

/* 碎裂冲击波环 - 3层从中心扩散的碎裂冲击波 */
.sm-shockwave-ring {
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

.sm-shockwave-ring.ring-1 { animation: smShockwaveRing 0.5s ease-out 0.5s forwards; }
.sm-shockwave-ring.ring-2 {
  border-color: rgba(80, 255, 180, 0.7);
  animation: smShockwaveRing 0.55s ease-out 0.54s forwards;
}
.sm-shockwave-ring.ring-3 {
  border-color: rgba(50, 200, 150, 0.5);
  animation: smShockwaveRing 0.6s ease-out 0.58s forwards;
}

@keyframes smShockwaveRing {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  12% { opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(12); opacity: 0; }
}

/* 元素碎片容器 - 从中心向指定角度3D飞溅 */
.sm-fragment {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--sm-fragment-size, 24px);
  height: var(--sm-fragment-size, 24px);
  transform: translate3d(-50%, -50%, 0) rotate(var(--sm-fragment-angle, 0deg));
  animation: smFragmentScatter3D 0.7s cubic-bezier(0.2, 0.5, 0.4, 1) 0.55s forwards;
  will-change: transform, opacity;
  opacity: 0;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

@keyframes smFragmentScatter3D {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sm-fragment-angle, 0deg)) translateX(0) translateZ(0) translateY(0) scale(0.5);
    opacity: 0;
  }
  10% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sm-fragment-angle, 0deg)) translateX(10px) translateZ(var(--sm-fragment-depth, 0px)) translateY(calc(var(--sm-fragment-arc, 0px) * -0.5)) scale(1.3);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sm-fragment-angle, 0deg)) translateX(calc(var(--sm-fragment-distance, 100px) * 0.6)) translateZ(var(--sm-fragment-depth, 0px)) translateY(calc(var(--sm-fragment-arc, 0px) * -1)) scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sm-fragment-angle, 0deg)) translateX(var(--sm-fragment-distance, 100px)) translateZ(var(--sm-fragment-depth, 0px)) translateY(0) scale(0.3);
    opacity: 0;
  }
}

/* 碎片头部 - 明亮的翠青菱形碎片 */
.sm-fragment-head {
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
    0 0 15px rgba(100, 255, 200, 0.8),
    0 0 30px rgba(50, 200, 150, 0.4);
}

/* 碎片拖尾 - 朝向中心的翠青尾迹 */
.sm-fragment-trail {
  position: absolute;
  top: 50%;
  right: 75%;
  width: 45px;
  height: 55%;
  transform: translateY(-50%);
  background: linear-gradient(
    to left,
    rgba(100, 255, 200, 0.6) 0%,
    rgba(50, 200, 150, 0.3) 50%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(4px);
}

/* ---------- 阶段③：印记侵蚀 ---------- */

/* 虚弱锁链 - 从印记法阵延伸的虚弱锁链 */
.sm-vulnerability-chain {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(100, 255, 200, 0.8), rgba(50, 200, 150, 0.3));
  box-shadow: 0 0 8px rgba(100, 255, 200, 0.5);
  transform: translate(-50%, -50%) rotate(var(--sm-chain-angle, 0deg)) translateX(0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: smChainExtend 0.5s ease-out forwards;
}

@keyframes smChainExtend {
  0% {
    transform: translate(-50%, -50%) rotate(var(--sm-chain-angle, 0deg)) translateX(0) scaleX(0) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate(-50%, -50%) rotate(var(--sm-chain-angle, 0deg)) translateX(calc(var(--sm-chain-length, 80px) * 0.2)) scaleX(1) scale(1);
    opacity: 0.9;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--sm-chain-angle, 0deg)) translateX(var(--sm-chain-length, 80px)) scaleX(0.3) scale(0.5);
    opacity: 0;
  }
}

/* 虚弱光环 - 印记侵蚀的暗青色光环 */
.sm-weakness-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 30%,
    rgba(100, 255, 200, 0.15) 50%,
    rgba(50, 200, 150, 0.08) 70%,
    transparent 85%
  );
  box-shadow: 0 0 25px rgba(100, 255, 200, 0.2), inset 0 0 20px rgba(50, 200, 150, 0.15);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: smWeaknessAura 0.8s ease-in-out 0.7s forwards;
  will-change: transform, opacity;
}

@keyframes smWeaknessAura {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 0.8; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.5; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 0; }
}

/* 侵蚀粒子 - 向中心汇聚的侵蚀能量 */
.sm-erosion-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(100, 255, 200, 0.7), rgba(50, 200, 150, 0.15));
  box-shadow: 0 0 4px rgba(100, 255, 200, 0.3);
  transform: translate(-50%, -50%) rotate(var(--sm-erosion-angle, 0deg)) translateX(var(--sm-erosion-distance, 70px)) scale(0.5);
  opacity: 0;
  will-change: transform, opacity;
  animation: smErosionParticle 0.6s ease-in-out 0.75s forwards;
}

@keyframes smErosionParticle {
  0% {
    transform: translate(-50%, -50%) rotate(var(--sm-erosion-angle, 0deg)) translateX(var(--sm-erosion-distance, 70px)) scale(0.5);
    opacity: 0;
  }
  20% { opacity: 0.8; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--sm-erosion-angle, 0deg) + 120deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段④：风暴消散 ---------- */

/* 风能余烬 - 缓慢上浮的翠青余烬粒子 */
.sm-ember {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--sm-ember-size, 6px);
  height: var(--sm-ember-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(100, 255, 200, 0.9) 0%,
    rgba(50, 200, 150, 0.5) 50%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(100, 255, 200, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: smEmberFloat 1s ease-out 0.8s forwards;
  will-change: transform, opacity;
}

@keyframes smEmberFloat {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% {
    transform: translate3d(calc(-50% + var(--sm-ember-tx, 0px) * 0.2), calc(-50% + var(--sm-ember-ty, 0px) * 0.2), 0) scale(1.2);
    opacity: 1;
  }
  80% { opacity: 0.5; }
  100% {
    transform: translate3d(calc(-50% + var(--sm-ember-tx, 0px)), calc(-50% + var(--sm-ember-ty, 0px)), 0) scale(0.2);
    opacity: 0;
  }
}

/* 残留印记 - 中心残留的印记残影 */
.sm-residual-mark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px solid rgba(100, 255, 200, 0.5);
  box-shadow: 0 0 15px rgba(100, 255, 200, 0.3), inset 0 0 10px rgba(50, 200, 150, 0.2);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: smResidualMark 1s ease-out 1.1s forwards;
  will-change: transform, opacity;
}

@keyframes smResidualMark {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 0.7; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.3; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1.4); opacity: 0; }
}

/* 风暴余波 - 爆破后残留的风暴能量涟漪 */
.sm-afterglow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50%;
  height: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(100, 255, 200, 0.2) 0%,
    rgba(50, 200, 150, 0.08) 40%,
    transparent 70%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: smAfterglow 0.9s ease-out 1.1s forwards;
  will-change: transform, opacity;
}

@keyframes smAfterglow {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  25% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 0.5; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2); opacity: 0; }
}

/* 通用旋转关键帧 */
@keyframes smSpinCW {
  0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  100% { transform: translate(-50%, -50%) scale(1) rotate(360deg); }
}

@keyframes smSpinCCW {
  0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  100% { transform: translate(-50%, -50%) scale(1) rotate(-360deg); }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .sm-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
