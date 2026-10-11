<!--
  @file HolyLightEarthEffect.vue
  @generated 2026-07-06
  @description 圣光大地 - 圣光蓄能·武器坠击·大地碎裂·圣光冲击波·余韵消散
  圣职者R技能（priest_r）：将大量的圣光之力聚集在武器击向地面，对所有敌人造成伤害
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + translateZ深度分层 + rotateX地面倾斜
  动画总时长：2.2秒（AOE覆盖整个怪物显示区域）
    ⓪ 圣光蓄能（0s ~ 0.4s）- 圣光汇聚 + 光柱凝聚 + 地面法阵
    ① 武器坠击（0.3s ~ 0.7s）- 聚光武器从天而降砸向地面 + 拖尾光迹
    ② 大地碎裂（0.6s ~ 1.1s）- 地面碎裂闪光 + 冲击爆点 + 地裂裂纹扩散
    ③ 圣光冲击波（0.7s ~ 1.5s）- 多层圣光冲击波环扩散 + 圣光碎片3D飞溅
    ④ 余韵消散（1.3s ~ 2.2s）- 圣光余韵上升 + 光芒渐隐消散
  色彩方案：圣光金(#FFD700) + 炽白(#FFFFFF) + 大地棕(#8B7355) + 圣光暖白(#FFF8DC)
-->
<template>
  <!-- 3D舞台 - 透视容器，为武器坠击与碎片飞溅提供深度视角 -->
  <div class="hle-3d-stage">
    <!-- ===== 阶段⓪：圣光蓄能（0s ~ 0.4s）===== -->
    <!-- 圣光暗幕 - 金色覆盖，圣光蓄能氛围 -->
    <div class="hle-dim"></div>

    <!-- 地面法阵 - 旋转的金色圣光召唤阵 -->
    <div class="hle-ground-rune"></div>

    <!-- 圣光汇聚粒子 - 从四周螺旋汇聚至中心上方 -->
    <div
      v-for="i in 14"
      :key="'hle-gather-' + i"
      class="hle-gather-particle"
      :style="getGatherStyle(i)"
    ></div>

    <!-- ===== 阶段①：武器坠击（0.3s ~ 0.7s）===== -->
    <!-- 聚光武器主体 - 圣光凝聚的巨型光锤从天而降 -->
    <div class="hle-weapon">
      <div class="hle-weapon-head"></div>
      <div class="hle-weapon-trail"></div>
    </div>

    <!-- 武器拖尾光迹 - 下坠过程中的金色光迹 -->
    <div class="hle-weapon-glow"></div>

    <!-- ===== 阶段②：大地碎裂（0.6s ~ 1.1s）===== -->
    <!-- 砸地爆闪 - 武器落地瞬间的炽白全屏爆闪 -->
    <div class="hle-impact-flash"></div>

    <!-- 中心冲击爆点 - 落地点的巨大金色光球 -->
    <div class="hle-impact-core"></div>

    <!-- 地裂裂纹 - 从撞击点向外蔓延的金色裂纹 -->
    <div class="hle-crack crack-1"></div>
    <div class="hle-crack crack-2"></div>
    <div class="hle-crack crack-3"></div>
    <div class="hle-crack crack-4"></div>
    <div class="hle-crack crack-5"></div>
    <div class="hle-crack crack-6"></div>

    <!-- ===== 阶段③：圣光冲击波（0.7s ~ 1.5s）===== -->
    <!-- 3层圣光冲击波环 - 从中心向外扩散 -->
    <div class="hle-shockwave-ring ring-1"></div>
    <div class="hle-shockwave-ring ring-2"></div>
    <div class="hle-shockwave-ring ring-3"></div>

    <!-- 地面冲击波 - 沿地面快速扩散的扁平圣光冲击波 -->
    <div class="hle-ground-blast"></div>

    <!-- 圣光碎片 - 从撞击点向外3D飞溅 -->
    <div
      v-for="i in 16"
      :key="'hle-shard-' + i"
      class="hle-shard"
      :style="getShardStyle(i)"
    ></div>

    <!-- ===== 阶段④：余韵消散（1.3s ~ 2.2s）===== -->
    <!-- 上升圣光余烬 - 缓慢上浮的金色光粒 -->
    <div
      v-for="i in 10"
      :key="'hle-ember-' + i"
      class="hle-ember"
      :style="getEmberStyle(i)"
    ></div>

    <!-- 圣光余韵 - 最后的光芒消散 -->
    <div class="hle-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 圣光大地 - 圣光蓄能·武器坠击·大地碎裂·圣光冲击波·余韵消散
 * 圣职者R技能（priest_r）AOE特效组件
 * 将大量的圣光之力聚集在武器击向地面，对所有敌人造成伤害
 * 以圣光金和炽白为主色调，展现圣光凝聚武器砸地爆发的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 * 动画总时长2.2秒，覆盖整个怪物显示区域
 */

/**
 * 生成圣光汇聚粒子的样式
 * @param {number} index - 粒子序号（1~14）
 * @returns {Object} CSS样式对象，含角度、距离、尺寸、延迟
 */
function getGatherStyle (index) {
  const angle = (index - 1) * 25.7 + (index % 2) * 9
  const distance = 130 + (index % 5) * 22
  const size = 4 + (index % 4) * 3
  const delay = (index - 1) * 0.01
  return {
    '--hle-gather-angle': `${angle}deg`,
    '--hle-gather-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成圣光碎片的3D飞溅样式
 * @param {number} index - 碎片序号（1~16）
 * @returns {Object} CSS样式对象，含飞溅角度、距离、Z轴深度、尺寸、延迟
 */
function getShardStyle (index) {
  const angle = (index - 1) * 22.5 + (index % 2) * 8
  const distance = 70 + (index % 5) * 25
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 15 - (index % 3) * 10
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const tz = depthDir * (35 + (index % 2) * 22)
  const size = 6 + (index % 4) * 5
  const delay = 0.7 + (index % 4) * 0.02
  return {
    '--hle-shard-tx': `${tx}px`,
    '--hle-shard-ty': `${ty}px`,
    '--hle-shard-tz': `${tz}px`,
    '--hle-shard-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成圣光余烬的上浮样式
 * @param {number} index - 余烬序号（1~10）
 * @returns {Object} CSS样式对象，含水平偏移、上浮高度、尺寸、延迟
 */
function getEmberStyle (index) {
  const tx = (index % 2 === 0 ? 1 : -1) * (25 + (index % 4) * 18)
  const ty = -80 - (index % 3) * 35
  const size = 4 + (index % 3) * 3
  const delay = 1.3 + (index % 5) * 0.06
  return {
    '--hle-ember-tx': `${tx}px`,
    '--hle-ember-ty': `${ty}px`,
    '--hle-ember-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   圣光大地 (holy_light_earth) - 圣光蓄能·武器坠击·大地碎裂·圣光冲击波·余韵消散
   技能描述：将大量的圣光之力聚集在武器击向地面，对所有敌人造成伤害
   3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：2.2秒
     ⓪ 圣光蓄能（0s ~ 0.4s）- 圣光汇聚 + 地面法阵
     ① 武器坠击（0.3s ~ 0.7s）- 聚光武器从天而降 + 拖尾光迹
     ② 大地碎裂（0.6s ~ 1.1s）- 爆闪 + 冲击爆点 + 地裂裂纹
     ③ 圣光冲击波（0.7s ~ 1.5s）- 3层冲击波环 + 地面冲击波 + 16块碎片3D飞溅
     ④ 余韵消散（1.3s ~ 2.2s）- 10个余烬上浮 + 圣光余韵消散
   ================================================================ */

/* 3D舞台 - 透视容器，为武器坠击与碎片飞溅提供深度视角 */
.hle-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
  pointer-events: none;
}

/* ---------- 阶段⓪：圣光蓄能（0s ~ 0.4s）---------- */

/* 圣光暗幕 - 金色覆盖，圣光蓄能氛围 */
.hle-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(60, 45, 0, 0.45) 0%,
    rgba(40, 30, 0, 0.3) 50%,
    transparent 100%
  );
  animation: hleDim 2.2s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes hleDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  35% { opacity: 0.85; }
  70% { opacity: 0.3; }
  100% { opacity: 0; }
}

/* 地面法阵 - 旋转的金色圣光召唤阵 */
.hle-ground-rune {
  position: absolute;
  top: 60%;
  left: 50%;
  width: 320px;
  height: 320px;
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: hleGroundRuneIn 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) forwards,
             hleGroundRuneFade 0.5s ease-out 0.6s forwards;
  will-change: transform, opacity;
  z-index: 2;
}

.hle-ground-rune::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.3) 30deg,
    rgba(255, 255, 255, 0.5) 60deg,
    rgba(255, 215, 0, 0.3) 90deg,
    transparent 120deg,
    rgba(255, 248, 220, 0.25) 180deg,
    rgba(255, 215, 0, 0.4) 210deg,
    rgba(255, 248, 220, 0.25) 240deg,
    transparent 270deg,
    rgba(255, 215, 0, 0.3) 330deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 25%, black 45%, transparent 80%);
  mask: radial-gradient(circle, transparent 25%, black 45%, transparent 80%);
  box-shadow: 0 0 35px rgba(255, 215, 0, 0.3);
  will-change: transform;
  animation: hleSpinCW 0.6s linear infinite;
}

@keyframes hleSpinCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes hleGroundRuneIn {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1.15); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1); opacity: 0.9; }
}

@keyframes hleGroundRuneFade {
  0% { opacity: 0.9; }
  100% { opacity: 0; }
}

/* 圣光汇聚粒子 - 从四周螺旋汇聚至中心上方 */
.hle-gather-particle {
  position: absolute;
  top: 45%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 215, 0, 0.7) 50%,
    rgba(255, 248, 220, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
  opacity: 0;
  animation: hleGather 0.4s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes hleGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--hle-gather-angle, 0deg)) translateX(var(--hle-gather-distance, 130px)) scale(1);
    opacity: 0;
  }
  25% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--hle-gather-angle, 0deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段①：武器坠击（0.3s ~ 0.7s）---------- */

/* 聚光武器主体 - 圣光凝聚的巨型光锤从天而降 */
.hle-weapon {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50px;
  height: 180px;
  transform: translate3d(-50%, -100%, 0) scale(0);
  transform-origin: 50% 100%;
  opacity: 0;
  animation: hleWeaponCrash 0.4s cubic-bezier(0.3, 0, 0.85, 0.4) 0.3s forwards;
  will-change: transform, opacity;
  z-index: 6;
}

@keyframes hleWeaponCrash {
  0% {
    transform: translate3d(-50%, -100%, 0) scale(0.5) rotate(-5deg);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -90%, 0) scale(1) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, 60%, 0) scale(1.2) rotate(8deg);
    opacity: 0;
  }
}

/* 武器头部 - 聚光光锤造型 */
.hle-weapon-head {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50px;
  height: 70px;
  transform: translateX(-50%);
  background: radial-gradient(
    ellipse at 50% 30%,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 248, 220, 0.9) 25%,
    rgba(255, 215, 0, 0.75) 55%,
    rgba(180, 140, 0, 0.4) 100%
  );
  clip-path: polygon(
    50% 0%, 80% 15%, 100% 40%, 90% 70%, 70% 90%,
    50% 100%, 30% 90%, 10% 70%, 0% 40%, 20% 15%
  );
  box-shadow:
    0 0 25px rgba(255, 215, 0, 0.8),
    0 0 50px rgba(255, 215, 0, 0.4);
}

/* 武器拖尾 - 下坠过程中的金色光柱拖尾 */
.hle-weapon-trail {
  position: absolute;
  top: 50px;
  left: 50%;
  width: 20px;
  height: 110px;
  transform: translateX(-50%);
  background: linear-gradient(
    to bottom,
    rgba(255, 215, 0, 0.6) 0%,
    rgba(255, 248, 220, 0.4) 30%,
    rgba(255, 215, 0, 0.2) 60%,
    transparent 100%
  );
  filter: blur(4px);
  border-radius: 50%;
}

/* 武器拖尾光迹 - 包裹武器的巨大发光层 */
.hle-weapon-glow {
  position: absolute;
  top: 0;
  left: 50%;
  width: 100px;
  height: 200px;
  transform: translate3d(-50%, -100%, 0) scale(0);
  background: radial-gradient(
    ellipse at center,
    rgba(255, 215, 0, 0.4) 0%,
    rgba(255, 248, 220, 0.2) 40%,
    transparent 70%
  );
  filter: blur(8px);
  opacity: 0;
  animation: hleWeaponGlow 0.4s ease-out 0.3s forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes hleWeaponGlow {
  0% {
    transform: translate3d(-50%, -100%, 0) scale(0.5);
    opacity: 0;
  }
  30% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translate3d(-50%, 60%, 0) scale(1.2);
    opacity: 0;
  }
}

/* ---------- 阶段②：大地碎裂（0.6s ~ 1.1s）---------- */

/* 砸地爆闪 - 武器落地瞬间的炽白全屏爆闪 */
.hle-impact-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 248, 220, 0.5) 20%,
    rgba(255, 215, 0, 0.3) 45%,
    transparent 75%
  );
  opacity: 0;
  animation: hleImpactFlash 0.5s ease-out 0.65s forwards;
  will-change: opacity;
  z-index: 8;
}

@keyframes hleImpactFlash {
  0%, 100% { opacity: 0; }
  8% { opacity: 1; }
  25% { opacity: 0.4; }
  50% { opacity: 0.7; }
  80% { opacity: 0; }
}

/* 中心冲击爆点 - 落地点的巨大金色光球 */
.hle-impact-core {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 120px;
  height: 120px;
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
  animation: hleImpactCore 0.6s cubic-bezier(0.15, 0.6, 0.3, 1) 0.65s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
  z-index: 9;
}

@keyframes hleImpactCore {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) scale(1.5);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) scale(2.5);
    opacity: 0.6;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(4);
    opacity: 0;
  }
}

/* 地裂裂纹 - 从撞击点向外蔓延的金色裂纹 */
.hle-crack {
  position: absolute;
  top: 55%;
  left: 50%;
  background: linear-gradient(
    to right,
    rgba(255, 215, 0, 0.8) 0%,
    rgba(255, 248, 220, 0.5) 40%,
    rgba(180, 140, 0, 0.2) 80%,
    transparent 100%
  );
  box-shadow: 0 0 4px rgba(255, 215, 0, 0.5);
  transform-origin: left center;
  transform: translate3d(-50%, -50%, 0) rotate(var(--hle-crack-angle, 0deg)) scaleX(0);
  opacity: 0;
  animation: hleCrackSpread 0.4s ease-out 0.7s forwards;
  will-change: transform, opacity;
  z-index: 7;
}

.hle-crack-1 { --hle-crack-angle: 0deg; width: 180px; height: 3px; }
.hle-crack-2 { --hle-crack-angle: 60deg; width: 150px; height: 3px; animation-delay: 0.72s; }
.hle-crack-3 { --hle-crack-angle: 120deg; width: 170px; height: 3px; animation-delay: 0.74s; }
.hle-crack-4 { --hle-crack-angle: 180deg; width: 160px; height: 3px; animation-delay: 0.71s; }
.hle-crack-5 { --hle-crack-angle: 240deg; width: 140px; height: 3px; animation-delay: 0.76s; }
.hle-crack-6 { --hle-crack-angle: 300deg; width: 165px; height: 3px; animation-delay: 0.73s; }

@keyframes hleCrackSpread {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--hle-crack-angle, 0deg)) scaleX(0);
    opacity: 0;
  }
  25% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--hle-crack-angle, 0deg)) scaleX(1);
    opacity: 0.4;
  }
}

/* ---------- 阶段③：圣光冲击波（0.7s ~ 1.5s）---------- */

/* 3层圣光冲击波环 - 从中心向外扩散，rotateX贴地 */
.hle-shockwave-ring {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(255, 215, 0, 0.85);
  box-shadow:
    0 0 20px rgba(255, 215, 0, 0.6),
    inset 0 0 16px rgba(255, 248, 220, 0.4);
  transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  backface-visibility: hidden;
  z-index: 9;
}

.hle-shockwave-ring.ring-1 {
  animation: hleShockwaveRing 0.6s ease-out 0.7s forwards;
}

.hle-shockwave-ring.ring-2 {
  border-color: rgba(255, 248, 220, 0.7);
  animation: hleShockwaveRing 0.65s ease-out 0.76s forwards;
}

.hle-shockwave-ring.ring-3 {
  border-color: rgba(255, 215, 0, 0.5);
  animation: hleShockwaveRing 0.7s ease-out 0.82s forwards;
}

@keyframes hleShockwaveRing {
  0% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0);
    opacity: 0;
  }
  12% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(12);
    opacity: 0;
  }
}

/* 地面冲击波 - 沿地面快速扩散的扁平圣光冲击波 */
.hle-ground-blast {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 40%,
    rgba(255, 215, 0, 0.4) 50%,
    rgba(255, 248, 220, 0.2) 65%,
    transparent 80%
  );
  transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0);
  animation: hleGroundBlast 0.5s ease-out 0.72s forwards;
  will-change: transform, opacity;
  z-index: 8;
}

@keyframes hleGroundBlast {
  0% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(10);
    opacity: 0;
  }
}

/* 圣光碎片 - 从撞击点向外3D飞溅 */
.hle-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--hle-shard-size, 8px);
  height: var(--hle-shard-size, 8px);
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
  animation: hleShardScatter 0.7s cubic-bezier(0.2, 0.5, 0.4, 1) 0.7s forwards;
  will-change: transform, opacity;
  z-index: 10;
}

@keyframes hleShardScatter {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; }
  100% {
    transform: translate3d(calc(-50% + var(--hle-shard-tx, 0px)), calc(-50% + var(--hle-shard-ty, 0px)), var(--hle-shard-tz, 0px)) scale(0.3) rotate(220deg);
    opacity: 0;
  }
}

/* ---------- 阶段④：余韵消散（1.3s ~ 2.2s）---------- */

/* 上升圣光余烬 - 缓慢上浮的金色光粒 */
.hle-ember {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--hle-ember-size, 6px);
  height: var(--hle-ember-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.9) 0%,
    rgba(255, 248, 220, 0.5) 50%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: hleEmberFloat 0.9s ease-out forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes hleEmberFloat {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(calc(-50% + var(--hle-ember-tx, 0px) * 0.2), calc(-50% + var(--hle-ember-ty, 0px) * 0.2), 0) scale(1.2);
    opacity: 1;
  }
  80% { opacity: 0.5; }
  100% {
    transform: translate3d(calc(-50% + var(--hle-ember-tx, 0px)), calc(-50% + var(--hle-ember-ty, 0px)), 0) scale(0.2);
    opacity: 0;
  }
}

/* 圣光余韵 - 最后的光芒消散 */
.hle-afterglow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(255, 215, 0, 0.2) 0%,
    rgba(255, 248, 220, 0.1) 45%,
    transparent 80%
  );
  opacity: 0;
  animation: hleAfterglow 0.9s ease-out 1.3s forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes hleAfterglow {
  0% { opacity: 0; }
  25% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .hle-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
