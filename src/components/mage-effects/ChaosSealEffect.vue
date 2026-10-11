<!--
  @file ChaosSealEffect.vue
  @generated 2026-07-04
  @description 混沌封印 - 混沌弥漫·混沌降临·精神牵引·封印爆发·混沌余韵
  精神使者AOE技能（Psychic Square）：将目标牵引至混沌的精神世界，使其受到严重创伤
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + translateZ深度分层 + rotateX地面倾斜
  动画总时长：2秒（显示1.5秒 + 移除渐隐0.5秒）
    ⓪ 混沌弥漫（0s ~ 2.0s）- 混沌迷雾持续弥漫呼吸 + 混沌能量流丝飘游 + 地面混沌雾气蔓延
    ① 混沌降临（0s ~ 0.45s）- 虚空暗幕降临 + 混沌裂缝撕开 + 暗紫能量涌出
    ② 精神牵引（0.18s ~ 0.9s）- 混沌漩涡旋转 + 精神触手伸展 + 封印法阵浮现 + 混沌符文环绕
    ③ 封印爆发（0.6s ~ 1.25s）- 封印闭合爆闪 + 混沌冲击波扩散 + 混沌结晶飞溅 + 虚空裂痕
    ④ 混沌余韵（0.85s ~ 2.0s）- 残留混沌粒子飘散 + 虚空缓慢闭合 + 整体渐隐消散
  色彩方案：混沌暗紫(#2D0A4E) + 封印暗金(#B8860B) + 混沌赤红(#DC143C) + 精神靛蓝(#4169E1) + 混沌白(#E0D7FF)
  效果范围：所有距离与尺寸均乘以 SCALE_FACTOR(1.5)，整体动画范围较初版增大50%
-->
<template>
  <!-- 3D舞台 - 透视容器，为混沌封印提供3D空间深度 -->
  <div class="cs-3d-stage">
    <!-- ===== 阶段⓪：混沌弥漫（贯穿全程） ===== -->
    <!-- 混沌迷雾 - 持续弥漫呼吸的混沌雾气，覆盖整个区域，营造混沌能量充斥空间的气息 -->
    <div class="cs-mist"></div>

    <!-- 混沌能量流丝 - 在空间中飘游的混沌能量丝带，增强弥漫感 -->
    <div
      v-for="i in 10"
      :key="'cs-wisp-' + i"
      class="cs-wisp"
      :style="getWispStyle(i)"
    ></div>

    <!-- 地面混沌雾气 - 从中心向外蔓延的贴地混沌雾，增加空间层次的弥漫感 -->
    <div
      v-for="i in 6"
      :key="'cs-ground-fog-' + i"
      class="cs-ground-fog"
      :style="getGroundFogStyle(i)"
    ></div>

    <!-- ===== 阶段①：混沌降临 ===== -->
    <!-- 混沌暗幕 - 深紫黑色笼罩整个区域，营造混沌精神世界的异空间氛围 -->
    <div class="cs-void-dim"></div>

    <!-- 混沌裂缝 - 从天空撕裂的混沌空间裂缝，暗紫能量从中涌出 -->
    <div class="cs-rift">
      <div class="cs-rift-glow"></div>
      <div class="cs-rift-core"></div>
    </div>

    <!-- ===== 阶段②：精神牵引 ===== -->
    <!-- 混沌漩涡 - 旋转的混沌能量漩涡，将目标精神牵引至混沌世界 -->
    <div class="cs-vortex">
      <div
        v-for="i in 5"
        :key="'cs-vortex-ring-' + i"
        class="cs-vortex-ring"
        :style="getVortexRingStyle(i)"
      ></div>
    </div>

    <!-- 精神触手 - 从漩涡中心向外伸展的混沌能量触手，牵引目标精神 -->
    <div
      v-for="i in 8"
      :key="'cs-tentacle-' + i"
      class="cs-tentacle"
      :style="getTentacleStyle(i)"
    ></div>

    <!-- 封印法阵 - 地面浮现的混沌封印法阵，旋转的符文圆环 -->
    <div class="cs-seal-array">
      <!-- 外圈封印环 - 暗金色旋转圆环 -->
      <div class="cs-seal-ring cs-seal-ring-outer"></div>
      <!-- 中圈封印环 - 赤红色反向旋转圆环 -->
      <div class="cs-seal-ring cs-seal-ring-mid"></div>
      <!-- 内圈封印环 - 靛蓝色快速旋转圆环 -->
      <div class="cs-seal-ring cs-seal-ring-inner"></div>
      <!-- 混沌符文 - 环绕法阵的8个混沌符文标记 -->
      <div
        v-for="i in 8"
        :key="'cs-rune-' + i"
        class="cs-rune"
        :style="getRuneStyle(i)"
      ></div>
    </div>

    <!-- ===== 阶段③：封印爆发 ===== -->
    <!-- 封印闭合爆闪 - 法阵闭合瞬间的混沌能量大爆发 -->
    <div class="cs-burst">
      <div class="cs-burst-flash"></div>
      <div class="cs-burst-core"></div>
    </div>

    <!-- 混沌冲击波 - 封印闭合时向外扩散的多层混沌冲击波 -->
    <div class="cs-shockwave wave-1"></div>
    <div class="cs-shockwave wave-2"></div>
    <div class="cs-shockwave wave-3"></div>
    <div class="cs-shockwave wave-4"></div>

    <!-- 混沌结晶 - 封印爆发后飞溅的混沌能量结晶碎片 -->
    <div
      v-for="i in 18"
      :key="'cs-crystal-' + i"
      class="cs-crystal"
      :style="getCrystalStyle(i)"
    ></div>

    <!-- 虚空裂痕 - 封印爆发时空间被混沌撕裂的发光裂痕 -->
    <div class="cs-crack">
      <div
        v-for="i in 6"
        :key="'cs-crack-line-' + i"
        class="cs-crack-line"
        :style="getCrackLineStyle(i)"
      ></div>
    </div>

    <!-- ===== 阶段④：混沌余韵 ===== -->
    <!-- 混沌粒子 - 封印后缓慢飘散的残留混沌能量粒子 -->
    <div
      v-for="i in 16"
      :key="'cs-particle-' + i"
      class="cs-particle"
      :style="getParticleStyle(i)"
    ></div>

    <!-- 混沌余辉 - 最终残留的暗紫色光晕，缓慢消散 -->
    <div class="cs-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 混沌封印 - 混沌弥漫·混沌降临·精神牵引·封印爆发·混沌余韵
 * 精神使者AOE技能（Psychic Square）特效组件
 * 将目标牵引至混沌的精神世界，使其受到严重创伤
 * 动画总时长2秒：显示阶段1.5秒 + 移除渐隐0.5秒
 * 色彩方案：混沌暗紫(#2D0A4E) + 封印暗金(#B8860B) + 混沌赤红(#DC143C) + 精神靛蓝(#4169E1) + 混沌白(#E0D7FF)
 * 效果范围：所有距离与尺寸均乘以 SCALE_FACTOR(1.5)，整体动画范围较初版增大50%
 */

/** 范围放大系数（1.5 = 增大50%） */
const SCALE_FACTOR = 1.5

/**
 * 计算混沌能量流丝的样式
 * 每条流丝在空间中飘游飘散，模拟混沌能量弥漫整个空间的气息
 * @param {number} index - 流丝索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getWispStyle (index) {
  const startX = (((index % 5) - 2) * 80 + (index % 2) * 30) * SCALE_FACTOR
  const startY = (((index % 3) - 1) * 60 + (index % 2) * 25) * SCALE_FACTOR
  const driftX = ((index % 2 === 0) ? 1 : -1) * (30 + (index % 3) * 20) * SCALE_FACTOR
  const driftY = -(20 + (index % 4) * 15) * SCALE_FACTOR
  const width = (40 + (index % 4) * 30) * SCALE_FACTOR
  const height = (4 + (index % 2) * 3) * SCALE_FACTOR
  const delay = (index % 5) * 0.08
  const duration = 1.4 + (index % 3) * 0.2
  const isRed = index % 3 === 0
  const isBlue = index % 3 === 1
  const color = isRed
    ? 'rgba(220, 20, 60, 0.35)'
    : isBlue
      ? 'rgba(65, 105, 225, 0.3)'
      : 'rgba(184, 134, 11, 0.3)'
  return {
    '--cs-wisp-start-x': `${startX}px`,
    '--cs-wisp-start-y': `${startY}px`,
    '--cs-wisp-drift-x': `${driftX}px`,
    '--cs-wisp-drift-y': `${driftY}px`,
    '--cs-wisp-width': `${width}px`,
    '--cs-wisp-height': `${height}px`,
    '--cs-wisp-color': color,
    '--cs-wisp-duration': `${duration}s`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算地面混沌雾气的样式
 * 每团雾气从中心向外蔓延扩散，贴地漂浮，增加空间层次的混沌弥漫感
 * @param {number} index - 雾气索引（1~6）
 * @returns {Object} CSS自定义属性对象
 */
function getGroundFogStyle (index) {
  const angle = (index - 1) * 60 + (index % 2) * 15
  const rad = (angle * Math.PI) / 180
  const distance = (100 + (index % 3) * 50) * SCALE_FACTOR
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance * 0.4
  const size = (120 + (index % 3) * 60) * SCALE_FACTOR
  const delay = 0.05 + (index % 3) * 0.1
  const isRed = index % 3 === 0
  const isBlue = index % 3 === 1
  const color = isRed
    ? 'rgba(220, 20, 60, 0.15)'
    : isBlue
      ? 'rgba(65, 105, 225, 0.12)'
      : 'rgba(45, 10, 78, 0.2)'
  return {
    '--cs-fog-tx': `${tx}px`,
    '--cs-fog-ty': `${ty}px`,
    '--cs-fog-size': `${size}px`,
    '--cs-fog-color': color,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算混沌漩涡环的样式
 * 每个环以不同速度和半径旋转，形成向内收缩的混沌漩涡
 * @param {number} index - 漩涡环索引（1~5）
 * @returns {Object} CSS自定义属性对象
 */
function getVortexRingStyle (index) {
  const size = (60 + index * 40) * SCALE_FACTOR
  const delay = 0.02 + index * 0.035
  const duration = 0.7 + index * 0.09
  const direction = index % 2 === 0 ? 'reverse' : 'normal'
  return {
    '--cs-vortex-size': `${size}px`,
    '--cs-vortex-duration': `${duration}s`,
    '--cs-vortex-direction': direction,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算精神触手的样式
 * 每条触手从漩涡中心向外伸展，模拟混沌能量牵引目标精神
 * @param {number} index - 触手索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getTentacleStyle (index) {
  const angle = (index - 1) * 45
  const length = (80 + (index % 3) * 30) * SCALE_FACTOR
  const delay = 0.14 + (index % 4) * 0.025
  const isRed = index % 3 === 0
  const isBlue = index % 3 === 1
  const color = isRed
    ? 'rgba(220, 20, 60, 0.8)'
    : isBlue
      ? 'rgba(65, 105, 225, 0.8)'
      : 'rgba(184, 134, 11, 0.8)'
  const glow = isRed
    ? 'rgba(220, 20, 60, 0.5)'
    : isBlue
      ? 'rgba(65, 105, 225, 0.5)'
      : 'rgba(184, 134, 11, 0.5)'
  return {
    '--cs-tentacle-angle': `${angle}deg`,
    '--cs-tentacle-length': `${length}px`,
    '--cs-tentacle-color': color,
    '--cs-tentacle-glow': glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算混沌符文的样式
 * 每个符文环绕法阵旋转，散发混沌能量光芒
 * @param {number} index - 符文索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getRuneStyle (index) {
  const angle = (index - 1) * 45
  const delay = 0.18 + (index % 4) * 0.025
  const isGold = index % 2 === 0
  const color = isGold
    ? 'rgba(255, 215, 0, 0.9)'
    : 'rgba(220, 20, 60, 0.9)'
  const glow = isGold
    ? 'rgba(255, 215, 0, 0.6)'
    : 'rgba(220, 20, 60, 0.6)'
  return {
    '--cs-rune-angle': `${angle}deg`,
    '--cs-rune-color': color,
    '--cs-rune-glow': glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算混沌结晶碎片的样式
 * 每块结晶在封印爆发时从中心向四周飞溅，模拟混沌能量碎裂
 * @param {number} index - 结晶索引（1~18）
 * @returns {Object} CSS自定义属性对象
 */
function getCrystalStyle (index) {
  const angle = (index - 1) * 20 + (index % 2) * 8
  const rad = (angle * Math.PI) / 180
  const distance = (60 + (index % 4) * 30) * SCALE_FACTOR
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance * 0.55 - 20 * SCALE_FACTOR
  const size = (6 + (index % 3) * 5) * SCALE_FACTOR
  const delay = 0.6 + (index % 6) * 0.018
  const isGold = index % 3 === 0
  const isRed = index % 3 === 1
  const bgGradient = isGold
    ? 'linear-gradient(135deg, rgba(224, 215, 255, 0.95) 0%, rgba(255, 215, 0, 0.7) 50%, transparent 100%)'
    : isRed
      ? 'linear-gradient(135deg, rgba(224, 215, 255, 0.95) 0%, rgba(220, 20, 60, 0.7) 50%, transparent 100%)'
      : 'linear-gradient(135deg, rgba(224, 215, 255, 0.95) 0%, rgba(65, 105, 225, 0.7) 50%, transparent 100%)'
  const shadowColor = isGold
    ? 'rgba(255, 215, 0, 0.5)'
    : isRed
      ? 'rgba(220, 20, 60, 0.5)'
      : 'rgba(65, 105, 225, 0.5)'
  return {
    '--cs-crystal-tx': `${tx}px`,
    '--cs-crystal-ty': `${ty}px`,
    '--cs-crystal-size': `${size}px`,
    '--cs-crystal-bg': bgGradient,
    '--cs-crystal-shadow': shadowColor,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算虚空裂痕的样式
 * 每条裂痕从中心向指定方向蔓延，暗示空间被混沌撕裂
 * @param {number} index - 裂痕索引（1~6）
 * @returns {Object} CSS自定义属性对象
 */
function getCrackLineStyle (index) {
  const angle = (index - 1) * 60 + (index % 2) * 15
  const length = (70 + (index % 3) * 25) * SCALE_FACTOR
  const delay = 0.64 + (index % 3) * 0.025
  return {
    '--cs-crack-angle': `${angle}deg`,
    '--cs-crack-length': `${length}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算混沌粒子的样式
 * 每个粒子在封印爆发后缓慢飘散，代表残留的混沌能量
 * @param {number} index - 粒子索引（1~16）
 * @returns {Object} CSS自定义属性对象
 */
function getParticleStyle (index) {
  const angle = (index - 1) * 22.5 + (index % 2) * 8
  const rad = (angle * Math.PI) / 180
  const startRadius = (20 + (index % 4) * 15) * SCALE_FACTOR
  const startX = Math.cos(rad) * startRadius
  const startY = Math.sin(rad) * startRadius * 0.5
  const driftX = ((index % 2 === 0) ? 1 : -1) * (12 + (index % 3) * 10) * SCALE_FACTOR
  const riseY = -(45 + (index % 4) * 16) * SCALE_FACTOR
  const size = (3 + (index % 3) * 2) * SCALE_FACTOR
  const delay = 0.82 + (index % 5) * 0.025
  const isGold = index % 3 === 0
  const isRed = index % 3 === 1
  const bg = isGold
    ? 'rgba(255, 215, 0, 0.8)'
    : isRed
      ? 'rgba(220, 20, 60, 0.8)'
      : 'rgba(65, 105, 225, 0.8)'
  const glow = isGold
    ? 'rgba(255, 215, 0, 0.4)'
    : isRed
      ? 'rgba(220, 20, 60, 0.4)'
      : 'rgba(65, 105, 225, 0.4)'
  return {
    '--cs-particle-start-x': `${startX}px`,
    '--cs-particle-start-y': `${startY}px`,
    '--cs-particle-drift-x': `${driftX}px`,
    '--cs-particle-rise-y': `${riseY}px`,
    '--cs-particle-size': `${size}px`,
    '--cs-particle-bg': bg,
    '--cs-particle-glow': glow,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   混沌封印 (spirit_mage_chaos_seal) - 混沌弥漫·混沌降临·精神牵引·封印爆发·混沌余韵
   技能描述：将目标牵引至混沌的精神世界，使其受到严重创伤
   色彩方案：混沌暗紫(#2D0A4E) + 封印暗金(#B8860B) + 混沌赤红(#DC143C) + 精神靛蓝(#4169E1) + 混沌白(#E0D7FF)
   3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：2秒（显示1.5秒 + 移除渐隐0.5秒）
   效果范围：所有距离与尺寸均增大50%
   ================================================================ */

/* 3D舞台 - 透视容器，为混沌封印提供3D空间深度
   1.5秒后整体开始淡出，2秒完全移除 */
.cs-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 50%;
  transform-style: preserve-3d;
  contain: layout style;
  animation: cs-stage-fade 2s ease-out forwards;
}
@keyframes cs-stage-fade {
  0%   { opacity: 1; }
  75%  { opacity: 1; }
  100% { opacity: 0; }
}

/* ================================================================
   阶段⓪：混沌弥漫（贯穿全程 0s ~ 2.0s）
   ================================================================ */

/* 混沌迷雾 - 持续弥漫呼吸的混沌雾气，覆盖整个区域
   使用径向渐变模拟混沌能量充斥整个空间的气息，呼吸式缩放营造弥漫涌动感 */
.cs-mist {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(45, 10, 78, 0.35) 0%,
    rgba(220, 20, 60, 0.08) 25%,
    rgba(65, 105, 225, 0.06) 50%,
    rgba(45, 10, 78, 0.12) 75%,
    transparent 100%
  );
  filter: blur(8px);
  animation: cs-mist 2s ease-in-out forwards;
  will-change: opacity, transform;
}
@keyframes cs-mist {
  0% {
    opacity: 0;
    transform: scale(1);
  }
  10% {
    opacity: 0.8;
  }
  30% {
    opacity: 1;
    transform: scale(1.05);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.02);
  }
  70% {
    opacity: 0.8;
    transform: scale(1.08);
  }
  85% {
    opacity: 0.4;
    transform: scale(1.1);
  }
  100% {
    opacity: 0;
    transform: scale(1.15);
  }
}

/* 混沌能量流丝 - 在空间中飘游的混沌能量丝带
   每条流丝从不同位置出发，缓慢漂移飘散，增强混沌能量弥漫整个空间的气息 */
.cs-wisp {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--cs-wisp-width, 90px);
  height: var(--cs-wisp-height, 8px);
  border-radius: 50%;
  background: linear-gradient(
    to right,
    transparent 0%,
    var(--cs-wisp-color, rgba(220, 20, 60, 0.35)) 30%,
    var(--cs-wisp-color, rgba(220, 20, 60, 0.35)) 70%,
    transparent 100%
  );
  filter: blur(4px);
  transform: translate3d(
    calc(-50% + var(--cs-wisp-start-x, 0px)),
    calc(-50% + var(--cs-wisp-start-y, 0px)),
    0
  ) scale(0);
  animation: cs-wisp var(--cs-wisp-duration, 1.6s) ease-in-out forwards;
  will-change: transform, opacity;
}
@keyframes cs-wisp {
  0% {
    transform: translate3d(
      calc(-50% + var(--cs-wisp-start-x, 0px)),
      calc(-50% + var(--cs-wisp-start-y, 0px)),
      0
    ) scale(0) rotate(0deg);
    opacity: 0;
  }
  15% {
    transform: translate3d(
      calc(-50% + var(--cs-wisp-start-x, 0px) * 0.5),
      calc(-50% + var(--cs-wisp-start-y, 0px) * 0.5),
      0
    ) scale(1) rotate(15deg);
    opacity: 0.6;
  }
  50% {
    transform: translate3d(
      calc(-50% + var(--cs-wisp-start-x, 0px) + var(--cs-wisp-drift-x, 0px) * 0.5),
      calc(-50% + var(--cs-wisp-start-y, 0px) + var(--cs-wisp-drift-y, 0px) * 0.5),
      0
    ) scale(1.2) rotate(-10deg);
    opacity: 0.4;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--cs-wisp-start-x, 0px) + var(--cs-wisp-drift-x, 0px)),
      calc(-50% + var(--cs-wisp-start-y, 0px) + var(--cs-wisp-drift-y, 0px)),
      0
    ) scale(0.3) rotate(25deg);
    opacity: 0;
  }
}

/* 地面混沌雾气 - 从中心向外蔓延的贴地混沌雾
   增加空间层次的弥漫感，模糊扩散模拟混沌气息贴地弥漫 */
.cs-ground-fog {
  position: absolute;
  top: 55%;
  left: 50%;
  width: var(--cs-fog-size, 225px);
  height: var(--cs-fog-size, 225px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--cs-fog-color, rgba(45, 10, 78, 0.2)) 0%,
    rgba(45, 10, 78, 0.1) 35%,
    rgba(15, 3, 30, 0.05) 65%,
    transparent 85%
  );
  filter: blur(14px);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: cs-ground-fog 1.8s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes cs-ground-fog {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  10% {
    transform: translate3d(-50%, -50%, 0) scale(0.4);
    opacity: 0.7;
  }
  35% {
    transform: translate3d(
      calc(-50% + var(--cs-fog-tx, 0px) * 0.5),
      calc(-50% + var(--cs-fog-ty, 0px) * 0.5),
      0
    ) scale(0.9);
    opacity: 0.5;
  }
  65% {
    transform: translate3d(
      calc(-50% + var(--cs-fog-tx, 0px)),
      calc(-50% + var(--cs-fog-ty, 0px)),
      0
    ) scale(1.4);
    opacity: 0.3;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--cs-fog-tx, 0px) * 1.2),
      calc(-50% + var(--cs-fog-ty, 0px) * 1.2),
      0
    ) scale(2);
    opacity: 0;
  }
}

/* ================================================================
   阶段①：混沌降临（0s ~ 0.45s）
   ================================================================ */

/* 混沌暗幕 - 深紫黑色笼罩整个区域，营造混沌精神世界的异空间氛围 */
.cs-void-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(45, 10, 78, 0.65) 0%,
    rgba(30, 5, 55, 0.45) 35%,
    rgba(15, 3, 30, 0.25) 65%,
    transparent 100%
  );
  animation: cs-void-dim 1.6s ease-out forwards;
  will-change: opacity;
}
@keyframes cs-void-dim {
  0%   { opacity: 0; }
  10%  { opacity: 1; }
  55%  { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 混沌裂缝容器 - 从天空撕裂的混沌空间裂缝 */
.cs-rift {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: translate3d(-50%, -50%, 0);
  animation: cs-rift-container 0.7s ease-out forwards;
  will-change: opacity;
}
@keyframes cs-rift-container {
  0%   { opacity: 0; }
  15%  { opacity: 1; }
  60%  { opacity: 0.8; }
  100% { opacity: 0; }
}

/* 混沌裂缝光晕 - 裂缝周围的暗紫赤红混合光晕 */
.cs-rift-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  background: radial-gradient(
    circle,
    rgba(220, 20, 60, 0.4) 0%,
    rgba(45, 10, 78, 0.5) 30%,
    rgba(76, 29, 149, 0.3) 55%,
    transparent 80%
  );
  filter: blur(12px);
  animation: cs-rift-glow 0.55s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes cs-rift-glow {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  30% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
  }
}

/* 混沌裂缝核心 - 裂缝中心的混沌能量涌出 */
.cs-rift-core {
  position: absolute;
  top: 0;
  left: 0;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  background: radial-gradient(
    circle,
    rgba(224, 215, 255, 0.9) 0%,
    rgba(220, 20, 60, 0.7) 25%,
    rgba(45, 10, 78, 0.6) 55%,
    transparent 85%
  );
  filter: blur(4px);
  animation: cs-rift-core 0.45s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes cs-rift-core {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  40% {
    transform: translate(-50%, -50%) scale(1.2) rotate(90deg);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2) rotate(180deg);
    opacity: 0;
  }
}

/* ================================================================
   阶段②：精神牵引（0.18s ~ 0.9s）
   ================================================================ */

/* 混沌漩涡容器 - 旋转的混沌能量漩涡 */
.cs-vortex {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: translate3d(-50%, -50%, 0);
}

/* 混沌漩涡环 - 每个环以不同速度和半径旋转，形成向内收缩的漩涡 */
.cs-vortex-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--cs-vortex-size, 120px);
  height: var(--cs-vortex-size, 120px);
  border-radius: 50%;
  border: 2px solid transparent;
  transform: translate(-50%, -50%) scale(0);
  animation: cs-vortex-ring var(--cs-vortex-duration, 0.7s) ease-out forwards;
  animation-direction: var(--cs-vortex-direction, normal);
  will-change: transform, opacity;
}
/* 奇数环 - 暗金赤红双色边框 */
.cs-vortex-ring:nth-child(odd) {
  border-top-color: rgba(184, 134, 11, 0.8);
  border-right-color: rgba(220, 20, 60, 0.4);
  border-bottom-color: rgba(220, 20, 60, 0.8);
  border-left-color: rgba(184, 134, 11, 0.4);
  box-shadow: 0 0 12px rgba(220, 20, 60, 0.4);
}
/* 偶数环 - 靛蓝暗紫双色边框 */
.cs-vortex-ring:nth-child(even) {
  border-top-color: rgba(65, 105, 225, 0.7);
  border-right-color: rgba(45, 10, 78, 0.4);
  border-bottom-color: rgba(45, 10, 78, 0.7);
  border-left-color: rgba(65, 105, 225, 0.4);
  border-width: 1px;
  box-shadow: 0 0 10px rgba(65, 105, 225, 0.3);
}
@keyframes cs-vortex-ring {
  0% {
    transform: translate(-50%, -50%) scale(2) rotate(0deg);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.1) rotate(540deg);
    opacity: 0;
  }
}

/* 精神触手 - 从漩涡中心向外伸展的混沌能量触手 */
.cs-tentacle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 0;
  transform-origin: 50% 0%;
  transform: rotate(var(--cs-tentacle-angle, 0deg)) scaleY(0);
  background: linear-gradient(
    to bottom,
    var(--cs-tentacle-color, rgba(184, 134, 11, 0.8)) 0%,
    transparent 100%
  );
  box-shadow: 0 0 8px var(--cs-tentacle-glow, rgba(184, 134, 11, 0.5));
  border-radius: 2px;
  animation: cs-tentacle 0.55s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes cs-tentacle {
  0% {
    transform: rotate(var(--cs-tentacle-angle, 0deg)) scaleY(0);
    opacity: 0;
  }
  25% {
    transform: rotate(var(--cs-tentacle-angle, 0deg)) scaleY(1);
    opacity: 1;
  }
  70% {
    transform: rotate(calc(var(--cs-tentacle-angle, 0deg) + 25deg)) scaleY(0.8);
    opacity: 0.6;
  }
  100% {
    transform: rotate(calc(var(--cs-tentacle-angle, 0deg) + 45deg)) scaleY(0);
    opacity: 0;
  }
}

/* 封印法阵容器 - 地面浮现的混沌封印法阵 */
.cs-seal-array {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: translate3d(-50%, -50%, 0) rotateX(72deg);
  transform-style: preserve-3d;
  animation: cs-seal-array 1.25s ease-out forwards;
  will-change: opacity;
}
@keyframes cs-seal-array {
  0%   { opacity: 0; }
  15%  { opacity: 1; }
  55%  { opacity: 1; }
  100% { opacity: 0; }
}

/* 封印环基础样式 - 旋转的圆环 */
.cs-seal-ring {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
}

/* 外圈封印环 - 暗金色旋转圆环 */
.cs-seal-ring-outer {
  width: 390px;
  height: 390px;
  border: 3px solid rgba(184, 134, 11, 0.7);
  box-shadow:
    0 0 20px rgba(184, 134, 11, 0.4),
    inset 0 0 15px rgba(184, 134, 11, 0.2);
  animation: cs-seal-ring-outer 1.1s ease-out 0.14s forwards;
}
@keyframes cs-seal-ring-outer {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  20% {
    transform: translate(-50%, -50%) scale(1.1) rotate(30deg);
    opacity: 1;
  }
  60% {
    transform: translate(-50%, -50%) scale(1) rotate(180deg);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.3) rotate(360deg);
    opacity: 0;
  }
}

/* 中圈封印环 - 赤红色反向旋转圆环 */
.cs-seal-ring-mid {
  width: 270px;
  height: 270px;
  border: 2px solid rgba(220, 20, 60, 0.6);
  box-shadow:
    0 0 15px rgba(220, 20, 60, 0.4),
    inset 0 0 10px rgba(220, 20, 60, 0.2);
  animation: cs-seal-ring-mid 1.1s ease-out 0.18s forwards;
}
@keyframes cs-seal-ring-mid {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  20% {
    transform: translate(-50%, -50%) scale(1.1) rotate(-30deg);
    opacity: 1;
  }
  60% {
    transform: translate(-50%, -50%) scale(1) rotate(-180deg);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.3) rotate(-360deg);
    opacity: 0;
  }
}

/* 内圈封印环 - 靛蓝色快速旋转圆环 */
.cs-seal-ring-inner {
  width: 150px;
  height: 150px;
  border: 2px solid rgba(65, 105, 225, 0.6);
  box-shadow:
    0 0 12px rgba(65, 105, 225, 0.4),
    inset 0 0 8px rgba(65, 105, 225, 0.2);
  animation: cs-seal-ring-inner 0.9s ease-out 0.23s forwards;
}
@keyframes cs-seal-ring-inner {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  25% {
    transform: translate(-50%, -50%) scale(1.2) rotate(60deg);
    opacity: 1;
  }
  60% {
    transform: translate(-50%, -50%) scale(1) rotate(360deg);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.4) rotate(720deg);
    opacity: 0;
  }
}

/* 混沌符文 - 环绕法阵的8个混沌符文标记 */
.cs-rune {
  position: absolute;
  top: 0;
  left: 0;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: var(--cs-rune-color, rgba(255, 215, 0, 0.9));
  box-shadow: 0 0 8px var(--cs-rune-glow, rgba(255, 215, 0, 0.6));
  transform: rotate(var(--cs-rune-angle, 0deg)) translateX(150px) scale(0);
  animation: cs-rune 0.7s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes cs-rune {
  0% {
    transform: rotate(var(--cs-rune-angle, 0deg)) translateX(210px) scale(0);
    opacity: 0;
  }
  30% {
    transform: rotate(var(--cs-rune-angle, 0deg)) translateX(150px) scale(1.5);
    opacity: 1;
  }
  70% {
    transform: rotate(calc(var(--cs-rune-angle, 0deg) + 45deg)) translateX(120px) scale(1);
    opacity: 0.6;
  }
  100% {
    transform: rotate(calc(var(--cs-rune-angle, 0deg) + 90deg)) translateX(90px) scale(0);
    opacity: 0;
  }
}

/* ================================================================
   阶段③：封印爆发（0.6s ~ 1.25s）
   ================================================================ */

/* 封印爆发容器 - 法阵闭合瞬间的混沌能量大爆发 */
.cs-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: cs-burst 0.45s ease-out 0.6s forwards;
  will-change: transform, opacity;
}
@keyframes cs-burst {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) scale(1.5);
    opacity: 1;
  }
  40% {
    transform: translate3d(-50%, -50%, 0) scale(1.2);
    opacity: 0.6;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(3);
    opacity: 0;
  }
}

/* 封印爆发闪光 - 闭合瞬间的白金赤红混合爆闪 */
.cs-burst-flash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    rgba(224, 215, 255, 1) 0%,
    rgba(255, 215, 0, 0.7) 25%,
    rgba(220, 20, 60, 0.5) 50%,
    rgba(45, 10, 78, 0.3) 75%,
    transparent 100%
  );
  filter: blur(4px);
}

/* 封印爆发核心 - 闭合瞬间的纯白能量核心 */
.cs-burst-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(224, 215, 255, 0.9) 30%,
    rgba(184, 134, 11, 0.5) 60%,
    transparent 90%
  );
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
}

/* 混沌冲击波 - 封印闭合时向外扩散的多层混沌冲击波 */
.cs-shockwave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
  opacity: 0;
}
.cs-shockwave.wave-1 {
  border: 3px solid rgba(224, 215, 255, 0.8);
  box-shadow: 0 0 15px rgba(224, 215, 255, 0.5);
  animation: cs-shockwave 0.45s ease-out 0.6s forwards;
}
.cs-shockwave.wave-2 {
  border: 2px solid rgba(255, 215, 0, 0.6);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
  animation: cs-shockwave 0.5s ease-out 0.64s forwards;
}
.cs-shockwave.wave-3 {
  border: 2px solid rgba(220, 20, 60, 0.5);
  box-shadow: 0 0 10px rgba(220, 20, 60, 0.4);
  animation: cs-shockwave 0.55s ease-out 0.68s forwards;
}
.cs-shockwave.wave-4 {
  border: 1px solid rgba(65, 105, 225, 0.4);
  box-shadow: 0 0 8px rgba(65, 105, 225, 0.3);
  animation: cs-shockwave 0.6s ease-out 0.72s forwards;
}
@keyframes cs-shockwave {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(12);
    opacity: 0;
  }
}

/* 混沌结晶 - 封印爆发后飞溅的混沌能量结晶碎片 */
.cs-crystal {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--cs-crystal-size, 12px);
  height: var(--cs-crystal-size, 12px);
  background: var(--cs-crystal-bg, linear-gradient(135deg, rgba(224, 215, 255, 0.95) 0%, rgba(220, 20, 60, 0.7) 50%, transparent 100%));
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  box-shadow: 0 0 6px var(--cs-crystal-shadow, rgba(220, 20, 60, 0.5));
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: cs-crystal 0.45s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes cs-crystal {
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
      calc(-50% + var(--cs-crystal-tx, 0px)),
      calc(-50% + var(--cs-crystal-ty, 0px)),
      0
    ) scale(0.2) rotate(180deg);
    opacity: 0;
  }
}

/* 虚空裂痕容器 - 封印爆发时空间被混沌撕裂的发光裂痕 */
.cs-crack {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: translate3d(-50%, -50%, 0);
  animation: cs-crack-container 0.45s ease-out 0.64s forwards;
  opacity: 0;
  will-change: opacity;
}
@keyframes cs-crack-container {
  0%   { opacity: 0; }
  20%  { opacity: 1; }
  100% { opacity: 0; }
}

/* 虚空裂痕光带 - 空间被混沌撕裂的发光裂缝 */
.cs-crack-line {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--cs-crack-length, 120px);
  height: 2px;
  transform-origin: 0 50%;
  transform: rotate(var(--cs-crack-angle, 0deg)) scaleX(0);
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(224, 215, 255, 0.3) 15%,
    rgba(220, 20, 60, 0.9) 40%,
    rgba(224, 215, 255, 1) 50%,
    rgba(220, 20, 60, 0.9) 60%,
    rgba(224, 215, 255, 0.3) 85%,
    transparent 100%
  );
  box-shadow:
    0 0 8px rgba(220, 20, 60, 0.7),
    0 0 16px rgba(184, 134, 11, 0.4);
  filter: blur(1px);
  animation: cs-crack-line 0.35s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes cs-crack-line {
  0% {
    transform: rotate(var(--cs-crack-angle, 0deg)) scaleX(0);
    opacity: 0;
  }
  25% {
    opacity: 1;
  }
  100% {
    transform: rotate(var(--cs-crack-angle, 0deg)) scaleX(1.4);
    opacity: 0;
  }
}

/* ================================================================
   阶段④：混沌余韵（0.85s ~ 2.0s）
   ================================================================ */

/* 混沌粒子 - 封印后缓慢飘散的残留混沌能量粒子 */
.cs-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--cs-particle-size, 6px);
  height: var(--cs-particle-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--cs-particle-bg, rgba(220, 20, 60, 0.8)) 0%,
    transparent 100%
  );
  box-shadow: 0 0 5px var(--cs-particle-glow, rgba(220, 20, 60, 0.4));
  transform: translate3d(
    calc(-50% + var(--cs-particle-start-x, 0px)),
    calc(-50% + var(--cs-particle-start-y, 0px)),
    0
  ) scale(0);
  animation: cs-particle 0.7s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes cs-particle {
  0% {
    transform: translate3d(
      calc(-50% + var(--cs-particle-start-x, 0px)),
      calc(-50% + var(--cs-particle-start-y, 0px)),
      0
    ) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(
      calc(-50% + var(--cs-particle-start-x, 0px)),
      calc(-50% + var(--cs-particle-start-y, 0px)),
      0
    ) scale(1.2);
    opacity: 1;
  }
  80% {
    opacity: 0.3;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--cs-particle-start-x, 0px) + var(--cs-particle-drift-x, 0px)),
      calc(-50% + var(--cs-particle-start-y, 0px) + var(--cs-particle-rise-y, 0px)),
      0
    ) scale(0.1);
    opacity: 0;
  }
}

/* 混沌余辉 - 最终残留的暗紫色光晕，缓慢消散 */
.cs-afterglow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 75%;
  height: 75%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(45, 10, 78, 0.25) 0%,
    rgba(76, 29, 149, 0.12) 40%,
    transparent 70%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: cs-afterglow 0.7s ease-out 0.82s forwards;
  will-change: transform, opacity;
}
@keyframes cs-afterglow {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2.5);
    opacity: 0;
  }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .cs-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
