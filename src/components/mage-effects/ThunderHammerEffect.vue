<!--
  @file ThunderHammerEffect.vue
  @generated 2026-07-29
  @description 雷神之锤 - 雷霆凝聚·天锤降临·雷爆冲击·麻痹余韵
  炽天使T技能（nature_messenger_t）：挥舞蕴含雷霆神力的巨锤锁定单一敌人发起重击，造成雷电伤害并有概率眩晕
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + translateZ深度分层
  动画总时长：2.0秒（单体伤害，覆盖目标区域）
    ⓪ 雷霆凝聚（0s ~ 0.4s）- 雷电暗幕 + 能量汇聚 + 地面雷纹法阵
    ① 天锤降临（0.3s ~ 0.7s）- 蕴含雷霆的巨锤从天而降 + 闪电拖尾 + 雷光闪烁
    ② 雷爆冲击（0.6s ~ 1.2s）- 砸地爆闪 + 冲击爆点 + 雷电冲击波 + 闪电分支飞溅
    ③ 麻痹余韵（1.0s ~ 2.0s）- 雷电余烬 + 地面焦痕 + 余韵消散
  色彩方案：雷电蓝(#4FC3F7) + 雷光白(#E1F5FE) + 雷霆金(#FFD700) + 暗紫(#1A0033)
-->
<template>
  <!-- 3D舞台 - 透视容器，为天锤降临与雷电飞溅提供深度视角 -->
  <div class="th-3d-stage">
    <!-- ===== 阶段⓪：雷霆凝聚 ===== -->
    <!-- 雷电暗幕 - 蓝紫色暗光笼罩，营造雷霆降临的氛围 -->
    <div class="th-dim"></div>

    <!-- 雷电全屏闪光 - 能量凝聚瞬间的蓝白色闪烁 -->
    <div class="th-flash"></div>

    <!-- 地面雷纹法阵 - 旋转的雷电召唤阵 -->
    <div class="th-ground-plane">
      <div class="th-rune-circle">
        <div class="th-rune-outer"></div>
        <div class="th-rune-mid"></div>
        <div class="th-rune-inner"></div>
      </div>
    </div>

    <!-- 能量汇聚粒子 - 从四周螺旋汇聚至中心上方 -->
    <div
      v-for="i in 10"
      :key="'th-gather-' + i"
      class="th-gather"
      :style="getGatherStyle(i)"
    ></div>

    <!-- ===== 阶段①：天锤降临 ===== -->
    <!-- 雷神之锤 - 蕴含雷霆神力的巨锤从天而降 -->
    <div class="th-hammer">
      <div class="th-hammer-head"></div>
      <div class="th-hammer-shaft"></div>
      <div class="th-hammer-glow"></div>
    </div>

    <!-- 闪电拖尾 - 巨锤下坠过程中的雷电拖尾 -->
    <div class="th-lightning-trail">
      <div class="th-lightning-main"></div>
      <div class="th-lightning-branch lb-1"></div>
      <div class="th-lightning-branch lb-2"></div>
      <div class="th-lightning-branch lb-3"></div>
    </div>

    <!-- ===== 阶段②：雷爆冲击 ===== -->
    <!-- 砸地爆闪 - 巨锤落地瞬间的蓝白色全屏爆闪 -->
    <div class="th-impact-flash"></div>

    <!-- 中心冲击爆点 - 落地点的巨大蓝金光球 -->
    <div class="th-impact-core"></div>

    <!-- 雷电冲击波环 - 从中心向外扩散的蓝色光环 -->
    <div class="th-shockwave sw-1"></div>
    <div class="th-shockwave sw-2"></div>
    <div class="th-shockwave sw-3"></div>

    <!-- 闪电分支飞溅 - 从落点向四周飞溅的闪电分支 -->
    <div class="th-sparks">
      <div
        v-for="i in 12"
        :key="'th-spark-' + i"
        class="th-spark"
        :style="getSparkStyle(i)"
      ></div>
    </div>

    <!-- 雷电碎片 - 从撞击点向外飞溅 -->
    <div
      v-for="i in 10"
      :key="'th-shard-' + i"
      class="th-shard"
      :style="getShardStyle(i)"
    ></div>

    <!-- ===== 阶段③：麻痹余韵 ===== -->
    <!-- 雷电余烬 - 缓慢上浮的蓝色电弧光粒 -->
    <div
      v-for="i in 8"
      :key="'th-ember-' + i"
      class="th-ember"
      :style="getEmberStyle(i)"
    ></div>

    <!-- 地面焦痕 - 雷击留下的蓝紫色焦痕 -->
    <div class="th-scorch"></div>

    <!-- 雷霆余韵 - 最终残留的蓝金光晕消散 -->
    <div class="th-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 雷神之锤 - 雷霆凝聚·天锤降临·雷爆冲击·麻痹余韵
 * 炽天使T技能（nature_messenger_t）单体伤害特效组件
 * 挥舞蕴含雷霆神力的巨锤锁定单一敌人发起重击，造成雷电伤害并有概率眩晕
 * 以雷电蓝和雷光白为主色调，辅以雷霆金，展现雷霆巨锤降临与雷爆冲击的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 * 动画总时长2.0秒
 */

/**
 * 计算能量汇聚粒子的样式
 * @param {number} index - 粒子索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getGatherStyle (index) {
  const angle = (index - 1) * 36 + (index % 2) * 8
  const distance = 100 + (index % 4) * 18
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.02
  return {
    '--th-gather-angle': `${angle}deg`,
    '--th-gather-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算闪电分支飞溅的样式
 * @param {number} index - 闪电索引（1~12）
 * @returns {Object} CSS自定义属性对象
 */
function getSparkStyle (index) {
  const angle = (index - 1) * 30
  const distance = 30 + (index % 3) * 14
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance
  const delay = (index % 4) * 0.03
  return {
    '--th-spark-tx': `${tx}px`,
    '--th-spark-ty': `${ty}px`,
    '--th-spark-angle': `${angle}deg`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算雷电碎片的飞溅样式
 * @param {number} index - 碎片索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getShardStyle (index) {
  const angle = (index - 1) * 36 + (index % 2) * 10
  const rad = (angle * Math.PI) / 180
  const distance = 50 + (index % 4) * 18
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance * 0.5 - 10
  const size = 6 + (index % 3) * 4
  const delay = 0.7 + (index % 5) * 0.03
  return {
    '--th-shard-tx': `${tx}px`,
    '--th-shard-ty': `${ty}px`,
    '--th-shard-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算雷电余烬的上浮样式
 * @param {number} index - 余烬索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getEmberStyle (index) {
  const tx = (index % 2 === 0 ? 1 : -1) * (15 + (index % 3) * 12)
  const ty = -60 - (index % 3) * 25
  const size = 3 + (index % 2) * 2
  const delay = 1.0 + (index % 4) * 0.06
  return {
    '--th-ember-tx': `${tx}px`,
    '--th-ember-ty': `${ty}px`,
    '--th-ember-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   雷神之锤 (nature_messenger_t) - 雷霆凝聚·天锤降临·雷爆冲击·麻痹余韵
   技能描述：挥舞蕴含雷霆神力的巨锤锁定单一敌人发起重击，造成雷电伤害并有概率眩晕
   色彩方案：雷电蓝(#4FC3F7) + 雷光白(#E1F5FE) + 雷霆金(#FFD700) + 暗紫(#1A0033)
   GPU加速：contain隔离 + will-change + translate3d
   动画总时长：2.0秒
   ================================================================ */

/* 3D舞台 - 透视容器 */
.th-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1000px;
  perspective-origin: 50% 50%;
  transform-style: preserve-3d;
  contain: layout style;
  pointer-events: none;
}

/* ---------- 阶段⓪：雷霆凝聚（0s ~ 0.4s）---------- */

/* 雷电暗幕 */
.th-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(10, 0, 50, 0.55) 0%,
    rgba(5, 0, 30, 0.3) 45%,
    transparent 100%
  );
  animation: th-dim 2s ease-out forwards;
  will-change: opacity;
}

@keyframes th-dim {
  0%   { opacity: 0; }
  10%  { opacity: 1; }
  50%  { opacity: 0.5; }
  100% { opacity: 0; }
}

/* 雷电全屏闪光 */
.th-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 45%,
    rgba(220, 235, 255, 0.85) 0%,
    rgba(150, 180, 255, 0.45) 25%,
    rgba(79, 195, 247, 0.2) 55%,
    transparent 80%
  );
  opacity: 0;
  animation: th-flash 0.6s ease-out forwards;
  will-change: opacity;
}

@keyframes th-flash {
  0%, 100% { opacity: 0; }
  5%  { opacity: 0.8; }
  12% { opacity: 0.2; }
  20% { opacity: 0.6; }
  40% { opacity: 0.1; }
  80% { opacity: 0; }
}

/* 地面层 - 3D倾斜平面 */
.th-ground-plane {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%) rotateX(72deg);
  transform-style: preserve-3d;
}

/* 地面雷纹法阵 */
.th-rune-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  transform: translate(-50%, -50%) scale(0);
  animation: th-rune-appear 0.3s ease-out 0.05s forwards,
             th-rune-fade 0.3s ease-out 0.5s forwards;
  will-change: transform, opacity;
}

@keyframes th-rune-appear {
  0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate(-50%, -50%) scale(1) rotate(45deg); opacity: 0.8; }
}

@keyframes th-rune-fade {
  0% { opacity: 0.8; }
  100% { opacity: 0; }
}

.th-rune-outer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(79, 195, 247, 0.6);
  box-shadow: 0 0 15px rgba(79, 195, 247, 0.4), inset 0 0 15px rgba(79, 195, 247, 0.2);
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(79, 195, 247, 0.15) 3deg,
    transparent 6deg,
    transparent 15deg
  );
  animation: th-spin-cw 2s linear 0.05s infinite;
  will-change: transform;
}

.th-rune-mid {
  position: absolute;
  inset: 20%;
  border-radius: 50%;
  border: 1px solid rgba(225, 245, 254, 0.5);
  box-shadow: 0 0 10px rgba(225, 245, 254, 0.3);
  animation: th-spin-ccw 1.5s linear 0.05s infinite;
  will-change: transform;
}

.th-rune-inner {
  position: absolute;
  inset: 38%;
  border-radius: 50%;
  border: 1px dashed rgba(255, 215, 0, 0.4);
  animation: th-spin-cw 1s linear 0.05s infinite;
  will-change: transform;
}

@keyframes th-spin-cw {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes th-spin-ccw {
  from { transform: rotate(360deg); }
  to   { transform: rotate(0deg); }
}

/* 能量汇聚粒子 */
.th-gather {
  position: absolute;
  top: 45%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(225, 245, 254, 0.95) 0%,
    rgba(79, 195, 247, 0.7) 50%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(79, 195, 247, 0.6);
  opacity: 0;
  animation: th-gather 0.35s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
}

@keyframes th-gather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--th-gather-angle, 0deg)) translateX(var(--th-gather-distance, 100px)) scale(1);
    opacity: 0;
  }
  25% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--th-gather-angle, 0deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段①：天锤降临（0.3s ~ 0.7s）---------- */

/* 雷神之锤 - 蕴含雷霆神力的巨锤 */
.th-hammer {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50px;
  height: 120px;
  transform: translate3d(-50%, -100%, 0) scale(0);
  transform-origin: 50% 100%;
  animation: th-hammer-crash 0.4s cubic-bezier(0.3, 0, 0.85, 0.4) 0.3s forwards;
  will-change: transform, opacity;
}

@keyframes th-hammer-crash {
  0% {
    transform: translate3d(-50%, -100%, 0) scale(0.5) rotate(-8deg);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -85%, 0) scale(1) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, 60%, 0) scale(1.2) rotate(6deg);
    opacity: 0;
  }
}

/* 锤头 - 雷霆凝聚的巨型锤头 */
.th-hammer-head {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50px;
  height: 55px;
  transform: translateX(-50%);
  background: radial-gradient(
    ellipse at 50% 30%,
    rgba(225, 245, 254, 1) 0%,
    rgba(79, 195, 247, 0.8) 30%,
    rgba(25, 118, 210, 0.5) 60%,
    rgba(10, 0, 50, 0.3) 100%
  );
  clip-path: polygon(
    20% 0%, 80% 0%, 100% 25%, 100% 75%, 80% 100%, 20% 100%, 0% 75%, 0% 25%
  );
  box-shadow:
    0 0 25px rgba(79, 195, 247, 0.8),
    0 0 50px rgba(79, 195, 247, 0.4),
    inset 0 0 15px rgba(225, 245, 254, 0.3);
}

/* 锤柄 */
.th-hammer-shaft {
  position: absolute;
  top: 50px;
  left: 50%;
  width: 10px;
  height: 70px;
  transform: translateX(-50%);
  background: linear-gradient(
    to bottom,
    rgba(79, 195, 247, 0.7) 0%,
    rgba(255, 215, 0, 0.5) 50%,
    rgba(79, 195, 247, 0.3) 100%
  );
  border-radius: 5px;
  box-shadow: 0 0 12px rgba(79, 195, 247, 0.5);
}

/* 锤体光晕 */
.th-hammer-glow {
  position: absolute;
  top: -10px;
  left: 50%;
  width: 90px;
  height: 80px;
  transform: translateX(-50%);
  background: radial-gradient(
    ellipse at center,
    rgba(79, 195, 247, 0.35) 0%,
    rgba(225, 245, 254, 0.15) 40%,
    transparent 70%
  );
  filter: blur(6px);
}

/* 闪电拖尾 - 巨锤下坠过程中的雷电 */
.th-lightning-trail {
  position: absolute;
  top: 0;
  left: 50%;
  width: 20px;
  height: 100%;
  transform: translateX(-50%);
  animation: th-lightning-flash 0.5s ease-out 0.3s forwards;
  will-change: opacity;
}

@keyframes th-lightning-flash {
  0%, 100% { opacity: 0; }
  10% { opacity: 1; }
  20% { opacity: 0.3; }
  30% { opacity: 0.9; }
  50% { opacity: 0.2; }
  70% { opacity: 0.6; }
  90% { opacity: 0; }
}

/* 主闪电 - 粗壮之字形 */
.th-lightning-main {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 1),
    rgba(180, 220, 255, 1),
    rgba(255, 255, 255, 1)
  );
  box-shadow:
    0 0 20px rgba(79, 195, 247, 1),
    0 0 40px rgba(79, 195, 247, 0.6),
    0 0 60px rgba(25, 118, 210, 0.3);
  clip-path: polygon(
    35% 0%, 65% 3%, 30% 12%, 70% 22%, 25% 32%,
    65% 42%, 30% 52%, 70% 62%, 35% 72%, 65% 82%,
    40% 92%, 60% 100%
  );
}

/* 闪电分支 */
.th-lightning-branch {
  position: absolute;
  background: rgba(220, 235, 255, 0.9);
  box-shadow:
    0 0 8px rgba(79, 195, 247, 0.8),
    0 0 16px rgba(79, 195, 247, 0.4);
  border-radius: 2px;
}

.th-lightning-branch.lb-1 {
  top: 25%;
  left: 50%;
  width: 3px;
  height: 28px;
  transform: translateX(-50%) rotate(-35deg);
  transform-origin: top center;
}

.th-lightning-branch.lb-2 {
  top: 50%;
  left: 50%;
  width: 3px;
  height: 22px;
  transform: translateX(-50%) rotate(40deg);
  transform-origin: top center;
}

.th-lightning-branch.lb-3 {
  top: 70%;
  left: 50%;
  width: 2px;
  height: 18px;
  transform: translateX(-50%) rotate(-25deg);
  transform-origin: top center;
}

/* ---------- 阶段②：雷爆冲击（0.6s ~ 1.2s）---------- */

/* 砸地爆闪 */
.th-impact-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(225, 245, 254, 0.5) 20%,
    rgba(79, 195, 247, 0.3) 45%,
    transparent 75%
  );
  opacity: 0;
  animation: th-impact-flash 0.5s ease-out 0.65s forwards;
  will-change: opacity;
}

@keyframes th-impact-flash {
  0%, 100% { opacity: 0; }
  8%  { opacity: 1; }
  25% { opacity: 0.4; }
  50% { opacity: 0.6; }
  80% { opacity: 0; }
}

/* 中心冲击爆点 */
.th-impact-core {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(225, 245, 254, 0.85) 18%,
    rgba(79, 195, 247, 0.6) 42%,
    rgba(25, 118, 210, 0.3) 68%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: th-impact-core 0.5s cubic-bezier(0.15, 0.6, 0.3, 1) 0.65s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}

@keyframes th-impact-core {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 1; }
  50% { transform: translate3d(-50%, -50%, 0) scale(2.5); opacity: 0.5; }
  100% { transform: translate3d(-50%, -50%, 0) scale(4); opacity: 0; }
}

/* 雷电冲击波环 */
.th-shockwave {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  border: 3px solid rgba(79, 195, 247, 0.85);
  box-shadow: 0 0 15px rgba(79, 195, 247, 0.6);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.th-shockwave.sw-1 { animation: th-shockwave 0.5s ease-out 0.65s forwards; }
.th-shockwave.sw-2 { border-color: rgba(225, 245, 254, 0.7); animation: th-shockwave 0.6s ease-out 0.7s forwards; }
.th-shockwave.sw-3 { border-color: rgba(255, 215, 0, 0.5); animation: th-shockwave 0.7s ease-out 0.75s forwards; }

@keyframes th-shockwave {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  15% { opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(9); opacity: 0; }
}

/* 闪电分支飞溅容器 */
.th-sparks {
  position: absolute;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* 闪电分支 */
.th-spark {
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 14px;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 1),
    rgba(79, 195, 247, 0.5)
  );
  box-shadow: 0 0 6px rgba(79, 195, 247, 0.6);
  border-radius: 2px;
  transform-origin: top center;
  transform: rotate(var(--th-spark-angle, 0deg)) scale(0);
  animation: th-spark 0.6s ease-out 0.65s forwards;
  will-change: transform, opacity;
}

@keyframes th-spark {
  0% { transform: rotate(var(--th-spark-angle, 0deg)) scale(0); opacity: 0; }
  15% { transform: rotate(var(--th-spark-angle, 0deg)) scale(1.2); opacity: 1; }
  100% {
    transform: rotate(var(--th-spark-angle, 0deg)) translate(var(--th-spark-tx, 0px), var(--th-spark-ty, 0px)) scale(0.3);
    opacity: 0;
  }
}

/* 雷电碎片 - 从撞击点向外飞溅 */
.th-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--th-shard-size, 8px);
  height: var(--th-shard-size, 8px);
  border-radius: 40% 60% 50% 40% / 55% 40% 60% 45%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(79, 195, 247, 0.7) 50%,
    rgba(25, 118, 210, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(79, 195, 247, 0.6);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  backface-visibility: hidden;
  animation: th-shard-scatter 0.6s cubic-bezier(0.2, 0.5, 0.4, 1) forwards;
  will-change: transform, opacity;
}

@keyframes th-shard-scatter {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { opacity: 1; }
  100% {
    transform: translate3d(calc(-50% + var(--th-shard-tx, 0px)), calc(-50% + var(--th-shard-ty, 0px)), 0) scale(0.3) rotate(180deg);
    opacity: 0;
  }
}

/* ---------- 阶段③：麻痹余韵（1.0s ~ 2.0s）---------- */

/* 雷电余烬 - 缓慢上浮的蓝色电弧光粒 */
.th-ember {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--th-ember-size, 4px);
  height: var(--th-ember-size, 4px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(225, 245, 254, 0.9) 0%,
    rgba(79, 195, 247, 0.6) 50%,
    transparent 100%
  );
  box-shadow: 0 0 5px rgba(79, 195, 247, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: th-ember-float 0.9s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes th-ember-float {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% {
    transform: translate3d(calc(-50% + var(--th-ember-tx, 0px) * 0.2), calc(-50% + var(--th-ember-ty, 0px) * 0.2), 0) scale(1.2);
    opacity: 1;
  }
  80% { opacity: 0.4; }
  100% {
    transform: translate3d(calc(-50% + var(--th-ember-tx, 0px)), calc(-50% + var(--th-ember-ty, 0px)), 0) scale(0.2);
    opacity: 0;
  }
}

/* 地面焦痕 - 雷击留下的蓝紫色焦痕 */
.th-scorch {
  position: absolute;
  bottom: 8%;
  left: 50%;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(79, 195, 247, 0.3) 0%,
    rgba(25, 118, 210, 0.2) 40%,
    rgba(10, 0, 50, 0.15) 70%,
    transparent 100%
  );
  transform: translateX(-50%) scale(0);
  animation: th-scorch 0.6s ease-out 0.7s forwards;
  will-change: transform, opacity;
}

@keyframes th-scorch {
  0% { transform: translateX(-50%) scale(0); opacity: 0; }
  30% { transform: translateX(-50%) scale(1.5); opacity: 0.7; }
  100% { transform: translateX(-50%) scale(2); opacity: 0; }
}

/* 雷霆余韵 - 最终残留的蓝金光晕消散 */
.th-afterglow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(79, 195, 247, 0.1) 0%,
    rgba(255, 215, 0, 0.05) 40%,
    transparent 75%
  );
  opacity: 0;
  animation: th-afterglow 0.8s ease-out 1.0s forwards;
  will-change: opacity;
}

@keyframes th-afterglow {
  0% { opacity: 0; }
  25% { opacity: 0.5; }
  100% { opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .th-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
