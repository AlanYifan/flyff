<!--
  @file MockeryBlastEffect.vue
  @generated 2026-07-05
  @description 戏虐爆破 - 戏谑蓄能·嘲弄印记·核心爆破·能量碎片飞散·戏谑余韵
  以戏谑之力凝聚爆破能量，引爆目标造成毁灭性伤害
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + translateZ深度分层 + rotateX地面倾斜
  动画总时长：2秒（显示1.6秒 + 移除渐隐0.4秒）
    ⓪ 戏谑氛围（0s ~ 2.0s）- 戏谑迷雾持续弥漫呼吸 + 戏谑能量丝带飘游
    ① 戏谑蓄能（0s ~ 0.5s）- 紫粉能量球扭曲旋转聚集 + 戏谑不规则晃动 + 蓄能光环脉动
    ② 嘲弄印记（0.3s ~ 0.65s）- 中心闪现扭曲嘲弄符文 + 戏谑笑纹扩散
    ③ 核心爆破（0.5s ~ 1.2s）- 白热中心爆炸 + 全屏粉紫闪光 + 多层冲击波 + 径向光束 + 3D冲击穹顶
    ④ 能量碎片飞散（0.55s ~ 1.6s）- 紫粉能量碎片3D飞射 + 戏谑火星飞溅 + 能量余烬上浮
    ⑤ 戏谑余韵（0.9s ~ 2.0s）- 扭曲余波涟漪 + 戏谑残影渐隐消散
  色彩方案：戏虐粉紫(#FF1493) + 爆裂暗紫(#8B008B) + 白热爆心(#FFFFFF) + 戏谑玫红(#C71585) + 爆裂橙焰(#FF4500)
-->
<template>
  <!-- 3D舞台 - 透视容器，为戏虐爆破提供3D空间深度 -->
  <div class="mb-3d-stage">
    <!-- ===== 阶段⓪：戏谑氛围（贯穿全程） ===== -->
    <!-- 戏谑迷雾 - 持续弥漫的紫粉雾气，营造戏谑能量充斥空间的氛围 -->
    <div class="mb-mist"></div>

    <!-- 戏谑能量丝带 - 空间中飘游的紫粉能量丝带，增强戏谑氛围 -->
    <div
      v-for="i in 8"
      :key="'mb-wisp-' + i"
      class="mb-wisp"
      :style="getWispStyle(i)"
    ></div>

    <!-- ===== 阶段①：戏谑蓄能 ===== -->
    <!-- 蓄能光环 - 围绕中心脉动的紫粉能量光环 -->
    <div class="mb-charge-aura"></div>

    <!-- 蓄能能量球 - 扭曲旋转聚集的紫粉能量核心，带有戏谑的不规则晃动 -->
    <div class="mb-charge-core">
      <div class="mb-charge-core-inner"></div>
      <div class="mb-charge-core-swirl-a"></div>
      <div class="mb-charge-core-swirl-b"></div>
      <div class="mb-charge-core-spark"></div>
    </div>

    <!-- 蓄能环绕粒子 - 围绕能量球旋转的戏谑粒子 -->
    <div
      v-for="i in 6"
      :key="'mb-orbit-' + i"
      class="mb-orbit-particle"
      :style="getOrbitStyle(i)"
    ></div>

    <!-- ===== 阶段②：嘲弄印记 ===== -->
    <!-- 嘲弄符文 - 中心闪现的扭曲嘲弄符号 -->
    <div class="mb-mockery-rune"></div>

    <!-- 嘲弄笑纹 - 从中心扩散的戏谑纹路 -->
    <div class="mb-mockery-ring"></div>

    <!-- ===== 阶段③：核心爆破 ===== -->
    <!-- 全屏粉紫闪光 - 爆破瞬间的粉紫全屏爆闪 -->
    <div class="mb-blast-flash"></div>

    <!-- 径向光束 - 爆破后从中心向四周放射的God Rays光束 -->
    <div class="mb-blast-beams"></div>

    <!-- 3D冲击波穹顶 - 从中心向上扩散的半球形粉紫冲击波 -->
    <div class="mb-shockwave-dome"></div>

    <!-- 核心爆炸火球 - 中心爆发的巨大粉紫能量球 -->
    <div class="mb-blast-core"></div>

    <!-- 冲击波环 - 多层从中心扩散的冲击波（3层错峰） -->
    <div class="mb-shockwave-ring ring-1"></div>
    <div class="mb-shockwave-ring ring-2"></div>
    <div class="mb-shockwave-ring ring-3"></div>

    <!-- 地面冲击波 - 沿地面快速扩散的扁平冲击波 -->
    <div class="mb-ground-blast"></div>

    <!-- ===== 阶段④：能量碎片飞散 ===== -->
    <!-- 能量碎片 - 12块紫粉能量碎片从中心3D飞射 -->
    <div
      v-for="i in 12"
      :key="'mb-shard-' + i"
      class="mb-shard"
      :style="getShardStyle(i)"
    >
      <div class="mb-shard-head"></div>
      <div class="mb-shard-trail"></div>
    </div>

    <!-- 戏谑火星 - 向四周3D飞溅的小型能量火花 -->
    <div
      v-for="i in 16"
      :key="'mb-spark-' + i"
      class="mb-spark"
      :style="getSparkStyle(i)"
    ></div>

    <!-- 能量余烬 - 爆破后缓慢上浮的紫粉余烬粒子 -->
    <div
      v-for="i in 8"
      :key="'mb-ember-' + i"
      class="mb-ember"
      :style="getEmberStyle(i)"
    ></div>

    <!-- ===== 阶段⑤：戏谑余韵 ===== -->
    <!-- 扭曲余波 - 爆破后残留的扭曲能量涟漪 -->
    <div class="mb-afterglow"></div>

    <!-- 戏谑残影 - 中心残留的嘲弄笑纹残影 -->
    <div class="mb-residual-rune"></div>
  </div>
</template>

<script setup>
/**
 * 戏虐爆破 - 戏谑蓄能·嘲弄印记·核心爆破·能量碎片飞散·戏谑余韵
 * 独立技能特效组件，以戏谑粉紫为主色调，展现嘲弄凝聚后猛烈爆裂的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 */

/**
 * 生成戏谑能量丝带的飘游样式
 * @param {number} index - 丝带序号（1~8）
 * @returns {Object} CSS样式对象，含起始位置、移动偏移、尺寸、延迟
 */
function getWispStyle (index) {
  const angle = (index - 1) * 45
  const distance = 80 + (index % 3) * 30
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 20
  const size = 20 + (index % 3) * 12
  const delay = (index % 4) * 0.25
  return {
    '--mb-wisp-tx': `${tx}px`,
    '--mb-wisp-ty': `${ty}px`,
    '--mb-wisp-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成蓄能环绕粒子的轨道样式
 * @param {number} index - 粒子序号（1~6）
 * @returns {Object} CSS样式对象，含旋转角度、轨道半径、尺寸、延迟
 */
function getOrbitStyle (index) {
  const angle = (index - 1) * 60
  const radius = 60 + (index % 2) * 15
  const size = 10 + (index % 3) * 4
  const delay = (index - 1) * 0.05
  return {
    '--mb-orbit-angle': `${angle}deg`,
    '--mb-orbit-radius': `${radius}px`,
    '--mb-orbit-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成能量碎片的3D飞射样式
 * @param {number} index - 碎片序号（1~12）
 * @returns {Object} CSS样式对象，含飞射角度、距离、Z轴深度、抛物线弧度、尺寸、延迟
 */
function getShardStyle (index) {
  const angle = (index - 1) * 30
  const distance = 140 + (index % 4) * 45
  const size = 32 + (index % 3) * 14
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const depth = depthDir * (60 + (index % 2) * 40)
  const arc = 30 + (index % 4) * 20
  const delay = 0.52 + (index % 3) * 0.03
  return {
    '--mb-shard-angle': `${angle}deg`,
    '--mb-shard-distance': `${distance}px`,
    '--mb-shard-size': `${size}px`,
    '--mb-shard-depth': `${depth}px`,
    '--mb-shard-arc': `${arc}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成戏谑火星的3D飞溅样式
 * @param {number} index - 火星序号（1~16）
 * @returns {Object} CSS样式对象，含飞溅偏移、Z轴深度、尺寸、延迟
 */
function getSparkStyle (index) {
  const angle = (index - 1) * 22.5 + (index % 2) * 6
  const distance = 70 + (index % 5) * 28
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 18 - (index % 3) * 12
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const tz = depthDir * (40 + (index % 2) * 25)
  const size = 6 + (index % 4) * 5
  const delay = 0.52 + (index % 5) * 0.02
  return {
    '--mb-spark-tx': `${tx}px`,
    '--mb-spark-ty': `${ty}px`,
    '--mb-spark-tz': `${tz}px`,
    '--mb-spark-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成能量余烬的上浮样式
 * @param {number} index - 余烬序号（1~8）
 * @returns {Object} CSS样式对象，含水平偏移、上浮高度、尺寸、延迟
 */
function getEmberStyle (index) {
  const tx = (index % 2 === 0 ? 1 : -1) * (25 + (index % 4) * 18)
  const ty = -70 - (index % 3) * 35
  const size = 5 + (index % 3) * 4
  const delay = 0.55 + (index % 4) * 0.06
  return {
    '--mb-ember-tx': `${tx}px`,
    '--mb-ember-ty': `${ty}px`,
    '--mb-ember-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   戏虐爆破 (mockery_blast) - 戏谑蓄能·嘲弄印记·核心爆破·能量碎片飞散·戏谑余韵
   技能描述：以戏谑之力凝聚爆破能量，引爆目标造成毁灭性伤害
   3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：2秒
     ⓪ 戏谑氛围（0s ~ 2.0s）- 迷雾弥漫 + 能量丝带飘游
     ① 戏谑蓄能（0s ~ 0.5s）- 能量球扭曲聚集 + 蓄能光环脉动 + 环绕粒子旋转
     ② 嘲弄印记（0.3s ~ 0.65s）- 嘲弄符文闪现 + 笑纹扩散
     ③ 核心爆破（0.5s ~ 1.2s）- 全屏闪光 + 径向光束 + 3D冲击穹顶 + 核心火球 + 3层冲击波 + 地面冲击
     ④ 能量碎片飞散（0.52s ~ 1.6s）- 12块碎片3D飞射 + 16个火星3D飞溅 + 8个余烬上浮
     ⑤ 戏谑余韵（0.9s ~ 2.0s）- 扭曲余波 + 嘲弄残影渐隐
   ================================================================ */

/* 3D舞台 - 透视容器，为所有3D变换提供深度视角 */
.mb-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
}

/* ---------- 阶段⓪：戏谑氛围 ---------- */

/* 戏谑迷雾 - 持续弥漫呼吸的紫粉雾气，覆盖整个区域 */
.mb-mist {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(199, 21, 85, 0.18) 0%,
    rgba(139, 0, 139, 0.12) 35%,
    rgba(75, 0, 80, 0.06) 70%,
    transparent 100%
  );
  animation: mbMist 2s ease-in-out infinite alternate;
  will-change: opacity;
}

@keyframes mbMist {
  0% { opacity: 0.4; transform: scale(0.95); }
  100% { opacity: 0.8; transform: scale(1.05); }
}

/* 戏谑能量丝带 - 空间中飘游的紫粉能量丝带 */
.mb-wisp {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--mb-wisp-size, 24px);
  height: var(--mb-wisp-size, 24px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 20, 147, 0.5) 0%,
    rgba(199, 21, 85, 0.3) 40%,
    transparent 70%
  );
  filter: blur(4px);
  transform: translate3d(-50%, -50%, 0);
  animation: mbWisp 2.5s ease-in-out infinite;
  will-change: transform, opacity;
}

@keyframes mbWisp {
  0%, 100% {
    transform: translate3d(-50%, -50%, 0) scale(0.5);
    opacity: 0.2;
  }
  50% {
    transform: translate3d(calc(-50% + var(--mb-wisp-tx, 0px)), calc(-50% + var(--mb-wisp-ty, 0px)), 0) scale(1.2);
    opacity: 0.7;
  }
}

/* ---------- 阶段①：戏谑蓄能 ---------- */

/* 蓄能光环 - 围绕中心脉动的紫粉能量光环 */
.mb-charge-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 30%,
    rgba(255, 20, 147, 0.35) 45%,
    rgba(199, 21, 85, 0.2) 60%,
    transparent 80%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: mbChargeAura 0.5s ease-out forwards;
  will-change: transform, opacity;
  filter: blur(6px);
}

@keyframes mbChargeAura {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  30% {
    transform: translate3d(-50%, -50%, 0) scale(0.6);
    opacity: 0.6;
  }
  80% {
    transform: translate3d(-50%, -50%, 0) scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 0;
  }
}

/* 蓄能能量球容器 - 扭曲旋转聚集，带有戏谑的不规则晃动 */
.mb-charge-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  transform: translate3d(-50%, -50%, 0);
  animation: mbChargeCore 0.5s cubic-bezier(0.35, 0, 0.65, 1) forwards;
  will-change: transform, opacity;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

@keyframes mbChargeCore {
  0% {
    transform: translate3d(-50%, -50%, -80px) scale(0.2);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  40% {
    transform: translate3d(-52%, -48%, -40px) scale(0.6) rotate(30deg);
  }
  60% {
    transform: translate3d(-48%, -52%, -20px) scale(0.85) rotate(-20deg);
  }
  80% {
    transform: translate3d(-51%, -49%, 0) scale(1.1) rotate(15deg);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.3) rotate(0deg);
    opacity: 0;
  }
}

/* 蓄能核心内层 - 紫粉能量核心球体 */
.mb-charge-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 40% 40%,
    rgba(255, 240, 250, 0.95) 0%,
    rgba(255, 20, 147, 0.85) 25%,
    rgba(199, 21, 85, 0.7) 55%,
    rgba(139, 0, 139, 0.4) 85%,
    transparent 100%
  );
  box-shadow:
    0 0 30px rgba(255, 20, 147, 0.7),
    0 0 60px rgba(199, 21, 85, 0.4);
  animation: mbChargeCorePulse 0.25s ease-in-out infinite alternate;
}

@keyframes mbChargeCorePulse {
  0% { transform: scale(0.9); filter: blur(1px); }
  100% { transform: scale(1.1); filter: blur(3px); }
}

/* 蓄能旋涡A - 正向旋转的能量旋涡层 */
.mb-charge-core-swirl-a {
  position: absolute;
  inset: -20%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 20, 147, 0.5) 60deg,
    transparent 120deg,
    rgba(199, 21, 85, 0.4) 180deg,
    transparent 240deg,
    rgba(255, 105, 180, 0.5) 300deg,
    transparent 360deg
  );
  filter: blur(6px);
  animation: mbSwirlA 0.4s linear infinite;
}

@keyframes mbSwirlA {
  0% { transform: rotate(0deg) scale(1); }
  100% { transform: rotate(360deg) scale(1.1); }
}

/* 蓄能旋涡B - 反向旋转的能量旋涡层 */
.mb-charge-core-swirl-b {
  position: absolute;
  inset: -15%;
  border-radius: 50%;
  background: conic-gradient(
    from 180deg,
    transparent 0deg,
    rgba(199, 21, 85, 0.45) 90deg,
    transparent 180deg,
    rgba(139, 0, 139, 0.4) 270deg,
    transparent 360deg
  );
  filter: blur(8px);
  animation: mbSwirlB 0.3s linear infinite reverse;
}

@keyframes mbSwirlB {
  0% { transform: rotate(0deg) scale(0.9); }
  100% { transform: rotate(360deg) scale(1.05); }
}

/* 蓄能核心火花 - 核心内闪烁的高亮火花 */
.mb-charge-core-spark {
  position: absolute;
  top: 35%;
  left: 35%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 200, 230, 0.6) 50%,
    transparent 100%
  );
  filter: blur(2px);
  animation: mbChargeSpark 0.15s ease-in-out infinite alternate;
}

@keyframes mbChargeSpark {
  0% { transform: scale(0.5) translate(0, 0); opacity: 0.6; }
  100% { transform: scale(1.3) translate(8px, -6px); opacity: 1; }
}

/* 蓄能环绕粒子 - 围绕能量球旋转的戏谑粒子 */
.mb-orbit-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--mb-orbit-size, 12px);
  height: var(--mb-orbit-size, 12px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 200, 230, 0.95) 0%,
    rgba(255, 20, 147, 0.7) 45%,
    rgba(199, 21, 85, 0.3) 100%
  );
  box-shadow: 0 0 8px rgba(255, 20, 147, 0.6);
  transform: translate3d(-50%, -50%, 0);
  animation: mbOrbit 0.5s linear forwards;
  will-change: transform, opacity;
  opacity: 0;
}

@keyframes mbOrbit {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--mb-orbit-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--mb-orbit-angle, 0deg)) translateX(calc(var(--mb-orbit-radius, 60px) * 0.5)) scale(1.2);
    opacity: 1;
  }
  80% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--mb-orbit-angle, 0deg) + 180deg)) translateX(var(--mb-orbit-radius, 60px)) scale(0.8);
    opacity: 0.7;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--mb-orbit-angle, 0deg) + 360deg)) translateX(0) scale(0);
    opacity: 0;
  }
}

/* ---------- 阶段②：嘲弄印记 ---------- */

/* 嘲弄符文 - 中心闪现的扭曲嘲弄符号（用clip-path绘制戏谑笑脸轮廓） */
.mb-mockery-rune {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90px;
  height: 90px;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(-45deg);
  opacity: 0;
  animation: mbMockeryRune 0.35s ease-out 0.3s forwards;
  will-change: transform, opacity;
}

/* 嘲弄符文外环 - 发光的粉紫圆环 */
.mb-mockery-rune::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid rgba(255, 20, 147, 0.85);
  box-shadow:
    0 0 20px rgba(255, 20, 147, 0.6),
    inset 0 0 15px rgba(199, 21, 85, 0.4);
}

/* 嘲弄符文笑眼 - 两个上弯的戏谑眼形（用box-shadow绘制） */
.mb-mockery-rune::after {
  content: '';
  position: absolute;
  top: 30%;
  left: 28%;
  width: 12px;
  height: 6px;
  border-radius: 50%;
  border-bottom: 2px solid rgba(255, 240, 250, 0.9);
  box-shadow:
    26px 0 0 -1px transparent,
    26px 0 0 0 rgba(255, 240, 250, 0);
  background:
    radial-gradient(circle at 0% 100%, transparent 60%, rgba(255, 240, 250, 0.9) 61%, transparent 72%),
    radial-gradient(circle at 100% 100%, transparent 60%, rgba(255, 240, 250, 0.9) 61%, transparent 72%);
  background-size: 14px 7px, 14px 7px;
  background-position: 0 0, 26px 0;
  background-repeat: no-repeat;
}

@keyframes mbMockeryRune {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0) rotate(-90deg);
    opacity: 0;
  }
  30% {
    transform: translate3d(-50%, -50%, 0) scale(1.2) rotate(-20deg);
    opacity: 1;
  }
  70% {
    transform: translate3d(-50%, -50%, 0) scale(1) rotate(10deg);
    opacity: 0.8;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.5) rotate(30deg);
    opacity: 0;
  }
}

/* 嘲弄笑纹 - 从中心扩散的戏谑纹路圆环 */
.mb-mockery-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid rgba(255, 105, 180, 0.7);
  box-shadow:
    0 0 15px rgba(255, 20, 147, 0.5),
    inset 0 0 10px rgba(199, 21, 85, 0.3);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: mbMockeryRing 0.4s ease-out 0.3s forwards;
  will-change: transform, opacity;
}

@keyframes mbMockeryRing {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(4);
    opacity: 0;
  }
}

/* ---------- 阶段③：核心爆破 ---------- */

/* 全屏粉紫闪光 - 爆破瞬间的粉紫全屏爆闪 */
.mb-blast-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 200, 230, 0.7) 12%,
    rgba(255, 20, 147, 0.4) 35%,
    rgba(199, 21, 85, 0.15) 60%,
    transparent 100%
  );
  opacity: 0;
  animation: mbBlastFlash 0.5s ease-out 0.5s forwards;
  will-change: opacity;
}

@keyframes mbBlastFlash {
  0% { opacity: 0; }
  8% { opacity: 1; }
  30% { opacity: 0.6; }
  100% { opacity: 0; }
}

/* 径向光束 - 爆破后从中心向四周放射的God Rays光束 */
.mb-blast-beams {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 600px;
  height: 600px;
  transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(0);
  background: conic-gradient(
    from 0deg,
    transparent 0deg, rgba(255, 105, 180, 0.18) 5deg, transparent 10deg,
    transparent 30deg, rgba(255, 20, 147, 0.15) 35deg, transparent 40deg,
    transparent 60deg, rgba(255, 105, 180, 0.18) 65deg, transparent 70deg,
    transparent 90deg, rgba(199, 21, 85, 0.15) 95deg, transparent 100deg,
    transparent 120deg, rgba(255, 105, 180, 0.18) 125deg, transparent 130deg,
    transparent 150deg, rgba(255, 20, 147, 0.15) 155deg, transparent 160deg,
    transparent 180deg, rgba(255, 105, 180, 0.18) 185deg, transparent 190deg,
    transparent 210deg, rgba(199, 21, 85, 0.15) 215deg, transparent 220deg,
    transparent 240deg, rgba(255, 105, 180, 0.18) 245deg, transparent 250deg,
    transparent 270deg, rgba(255, 20, 147, 0.15) 275deg, transparent 280deg,
    transparent 300deg, rgba(255, 105, 180, 0.18) 305deg, transparent 310deg,
    transparent 330deg, rgba(199, 21, 85, 0.15) 335deg, transparent 360deg
  );
  border-radius: 50%;
  opacity: 0;
  animation: mbBlastBeams 0.6s ease-out 0.5s forwards;
  will-change: transform, opacity;
  mask: radial-gradient(circle, transparent 10%, black 30%, transparent 70%);
  -webkit-mask: radial-gradient(circle, transparent 10%, black 30%, transparent 70%);
}

@keyframes mbBlastBeams {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) rotate(15deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(60deg) scale(1.5);
    opacity: 0;
  }
}

/* 3D冲击波穹顶 - 从中心向上扩散的半球形粉紫冲击波 */
.mb-shockwave-dome {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  border: 5px solid rgba(255, 20, 147, 0.65);
  box-shadow:
    0 0 50px rgba(255, 20, 147, 0.5),
    inset 0 0 35px rgba(255, 105, 180, 0.3);
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  animation: mbShockwaveDome 0.55s cubic-bezier(0.2, 0.6, 0.3, 1) 0.5s forwards;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

@keyframes mbShockwaveDome {
  0% {
    transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(4);
    opacity: 0;
  }
}

/* 核心爆炸火球 - 中心爆发的巨大粉紫能量球 */
.mb-blast-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 200, 230, 0.9) 18%,
    rgba(255, 20, 147, 0.75) 42%,
    rgba(199, 21, 85, 0.45) 68%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: mbBlastCore 0.6s cubic-bezier(0.15, 0.6, 0.3, 1) 0.5s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}

@keyframes mbBlastCore {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  12% {
    transform: translate3d(-50%, -50%, 0) scale(1.2);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) scale(2.5);
    opacity: 0.8;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(4);
    opacity: 0;
  }
}

/* 冲击波环 - 多层从中心扩散的冲击波（3层错峰） */
.mb-shockwave-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(255, 20, 147, 0.85);
  box-shadow:
    0 0 22px rgba(255, 20, 147, 0.6),
    inset 0 0 18px rgba(255, 105, 180, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.mb-shockwave-ring.ring-1 {
  animation: mbShockwaveRing 0.5s ease-out 0.5s forwards;
}

.mb-shockwave-ring.ring-2 {
  border-color: rgba(199, 21, 85, 0.7);
  animation: mbShockwaveRing 0.55s ease-out 0.54s forwards;
}

.mb-shockwave-ring.ring-3 {
  border-color: rgba(139, 0, 139, 0.5);
  animation: mbShockwaveRing 0.6s ease-out 0.58s forwards;
}

@keyframes mbShockwaveRing {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(16);
    opacity: 0;
  }
}

/* 地面冲击波 - 沿地面快速扩散的扁平冲击波 */
.mb-ground-blast {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 40%,
    rgba(255, 20, 147, 0.4) 50%,
    rgba(199, 21, 85, 0.2) 65%,
    transparent 80%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: mbGroundBlast 0.45s ease-out 0.52s forwards;
  will-change: transform, opacity;
}

@keyframes mbGroundBlast {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(10);
    opacity: 0;
  }
}

/* ---------- 阶段④：能量碎片飞散 ---------- */

/* 能量碎片容器 - 从中心向指定角度3D飞射，带Z轴深度和抛物线弧度 */
.mb-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--mb-shard-size, 40px);
  height: var(--mb-shard-size, 40px);
  transform: translate3d(-50%, -50%, 0) rotate(var(--mb-shard-angle, 0deg));
  animation: mbShardScatter3D 0.75s cubic-bezier(0.2, 0.5, 0.4, 1) 0.52s forwards;
  will-change: transform, opacity;
  opacity: 0;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

@keyframes mbShardScatter3D {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--mb-shard-angle, 0deg)) translateX(0) translateZ(0) translateY(0) scale(0.5);
    opacity: 0;
  }
  10% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--mb-shard-angle, 0deg)) translateX(12px) translateZ(var(--mb-shard-depth, 0px)) translateY(calc(var(--mb-shard-arc, 0px) * -0.5)) scale(1.3);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--mb-shard-angle, 0deg)) translateX(calc(var(--mb-shard-distance, 100px) * 0.6)) translateZ(var(--mb-shard-depth, 0px)) translateY(calc(var(--mb-shard-arc, 0px) * -1)) scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--mb-shard-angle, 0deg)) translateX(var(--mb-shard-distance, 100px)) translateZ(var(--mb-shard-depth, 0px)) translateY(0) scale(0.3);
    opacity: 0;
  }
}

/* 碎片头部 - 明亮燃烧的紫粉菱形碎片 */
.mb-shard-head {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 40% 40%,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(255, 105, 180, 0.9) 30%,
    rgba(255, 20, 147, 0.7) 60%,
    rgba(139, 0, 139, 0.4) 100%
  );
  clip-path: polygon(50% 0%, 80% 30%, 100% 50%, 80% 70%, 50% 100%, 20% 70%, 0% 50%, 20% 30%);
  box-shadow:
    0 0 20px rgba(255, 20, 147, 0.8),
    0 0 40px rgba(199, 21, 85, 0.4);
}

/* 碎片拖尾 - 朝向中心的紫粉火焰尾迹 */
.mb-shard-trail {
  position: absolute;
  top: 50%;
  right: 75%;
  width: 60px;
  height: 55%;
  transform: translateY(-50%);
  background: linear-gradient(
    to left,
    rgba(255, 105, 180, 0.6) 0%,
    rgba(199, 21, 85, 0.3) 50%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(5px);
}

/* 戏谑火星 - 向四周3D飞溅的小型能量火花 */
.mb-spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--mb-spark-size, 6px);
  height: var(--mb-spark-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 240, 250, 0.95) 0%,
    rgba(255, 105, 180, 0.7) 45%,
    rgba(255, 20, 147, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(255, 20, 147, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: mbSparkFly3D 0.6s ease-out 0.52s forwards;
  will-change: transform, opacity;
}

@keyframes mbSparkFly3D {
  0% {
    transform: translate3d(-50%, -50%, 0) translateZ(0) scale(0);
    opacity: 0;
  }
  12% {
    transform: translate3d(-50%, -50%, 0) translateZ(0) scale(1.4);
    opacity: 1;
  }
  100% {
    transform: translate3d(calc(-50% + var(--mb-spark-tx, 0px)), calc(-50% + var(--mb-spark-ty, 0px)), var(--mb-spark-tz, 0px)) scale(0.2);
    opacity: 0;
  }
}

/* 能量余烬 - 爆破后缓慢上浮的紫粉余烬粒子 */
.mb-ember {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--mb-ember-size, 7px);
  height: var(--mb-ember-size, 7px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 200, 230, 0.9) 0%,
    rgba(255, 20, 147, 0.6) 50%,
    transparent 100%
  );
  box-shadow: 0 0 7px rgba(255, 20, 147, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: mbEmberFloat 1s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes mbEmberFloat {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(calc(-50% + var(--mb-ember-tx, 0px) * 0.2), calc(-50% + var(--mb-ember-ty, 0px) * 0.2), 0) scale(1.2);
    opacity: 1;
  }
  80% {
    opacity: 0.6;
  }
  100% {
    transform: translate3d(calc(-50% + var(--mb-ember-tx, 0px)), calc(-50% + var(--mb-ember-ty, 0px)), 0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段⑤：戏谑余韵 ---------- */

/* 扭曲余波 - 爆破后残留的扭曲能量涟漪 */
.mb-afterglow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 55%;
  height: 55%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 20, 147, 0.25) 0%,
    rgba(199, 21, 85, 0.1) 40%,
    transparent 70%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: mbAfterglow 1s ease-out 0.7s forwards;
  will-change: transform, opacity;
}

@keyframes mbAfterglow {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  25% {
    transform: translate3d(-50%, -50%, 0) scale(1.4);
    opacity: 0.7;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2.2);
    opacity: 0;
  }
}

/* 戏谑残影 - 中心残留的嘲弄笑纹残影 */
.mb-residual-rune {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 2px solid rgba(255, 105, 180, 0.5);
  box-shadow:
    0 0 15px rgba(255, 20, 147, 0.3),
    inset 0 0 10px rgba(199, 21, 85, 0.2);
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  opacity: 0;
  animation: mbResidualRune 1.1s ease-out 0.7s forwards;
  will-change: transform, opacity;
}

@keyframes mbResidualRune {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) scale(1.2) rotate(20deg);
    opacity: 0.6;
  }
  60% {
    transform: translate3d(-50%, -50%, 0) scale(1.6) rotate(60deg);
    opacity: 0.3;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2) rotate(90deg);
    opacity: 0;
  }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .mb-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
