<!--
  @file EnergyReflectEffect.vue
  @generated 2026-07-04
  @description 能量反弹 - 能量传送门特效
  精神使者BUFF技能（Energy Reflect）：将受到的物理伤害加倍返还回去
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画特性：持久化循环动画，BUFF存活期间持续播放，BUFF到期后由父组件移除
    ⓪ 传送门凝聚（0s ~ 0.6s）- 能量粒子从四周汇聚 → 传送门椭圆框架展开
    ① 传送门开启（0.4s ~ 1.0s）- 漩涡能量启动旋转 → 螺旋能量线浮现 → 中心亮核点亮
    ② 持续运转（1.0s ~ 持续）- 漩涡持续旋转 → 粒子螺旋吸入 → 脉冲呼吸 → 偶发闪烁
  色彩方案：守护金(#FFD700) + 反弹青(#00FFFF) + 能量白(#FFF8DC) + 深邃琥珀(#B8860B)
  定位：在 player-card-area 容器右侧外部贴合显示，竖向椭圆形传送门
-->
<template>
  <!-- 传送门舞台 - 定位容器 -->
  <div class="er-stage">
    <!-- ===== 阶段⓪：传送门凝聚 ===== -->
    <!-- 能量汇聚粒子 - 从四周向中心汇聚 -->
    <div
      v-for="i in 8"
      :key="'er-converge-' + i"
      class="er-converge"
      :style="getConvergeStyle(i)"
    ></div>

    <!-- ===== 阶段①：传送门开启 ===== -->
    <!-- 传送门外光晕 - 整体发光氛围 -->
    <div class="er-glow"></div>

    <!-- 传送门椭圆框架 - 金色+青色双色边框光门 -->
    <div class="er-portal">
      <!-- 传送门内部 - 深邃漩涡背景 -->
      <div class="er-portal-bg"></div>

      <!-- 漩涡层1 - 顺时针旋转的能量漩涡 -->
      <div class="er-vortex vortex-1"></div>
      <!-- 漩涡层2 - 逆时针旋转的能量漩涡 -->
      <div class="er-vortex vortex-2"></div>

      <!-- 螺旋能量线 - 从边缘向中心螺旋的能量光带 -->
      <div
        v-for="i in 4"
        :key="'er-spiral-' + i"
        class="er-spiral"
        :style="getSpiralStyle(i)"
      ></div>

      <!-- 中心亮核 - 传送门中心的发光球体 -->
      <div class="er-center">
        <div class="er-center-core"></div>
      </div>

      <!-- 粒子吸入 - 向中心螺旋吸入的能量粒子 -->
      <div
        v-for="i in 6"
        :key="'er-particle-' + i"
        class="er-particle"
        :style="getParticleStyle(i)"
      ></div>

      <!-- 闪烁sweep - 偶发的反射闪光 -->
      <div class="er-flash flash-1"></div>
      <div class="er-flash flash-2"></div>
    </div>

    <!-- 传送门边框光弧 - 椭圆形发光边框 -->
    <div class="er-rim rim-outer"></div>
    <div class="er-rim rim-inner"></div>
  </div>
</template>

<script setup>
/**
 * 能量反弹 - 能量传送门特效
 * 精神使者BUFF技能（Energy Reflect）特效组件
 * 将受到的物理伤害加倍返还回去
 * 持久化循环动画，BUFF存活期间持续播放
 * 色彩方案：守护金(#FFD700) + 反弹青(#00FFFF) + 能量白(#FFF8DC) + 深邃琥珀(#B8860B)
 */

/**
 * 计算能量汇聚粒子的样式
 * 每个粒子从不同方向向中心汇聚，模拟能量凝聚过程
 * @param {number} index - 粒子索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getConvergeStyle (index) {
  const angle = (index - 1) * 45
  const distance = 45 + (index % 3) * 12
  const delay = (index % 4) * 0.05
  return {
    '--er-conv-angle': `${angle}deg`,
    '--er-conv-dist': `${distance}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算螺旋能量线的样式
 * 每条螺旋线从传送门边缘向中心螺旋收缩
 * @param {number} index - 螺旋线索引（1~4）
 * @returns {Object} CSS自定义属性对象
 */
function getSpiralStyle (index) {
  const angle = (index - 1) * 90
  const delay = 0.5 + (index % 2) * 0.1
  const duration = 2 + (index % 2) * 0.5
  const isCyan = index % 2 === 0
  return {
    '--er-spiral-angle': `${angle}deg`,
    '--er-spiral-duration': `${duration}s`,
    '--er-spiral-color': isCyan ? 'rgba(0, 255, 255, 0.7)' : 'rgba(255, 215, 0, 0.7)',
    animationDelay: `${delay}s`
  }
}

/**
 * 计算粒子吸入的样式
 * 每个粒子从传送门边缘螺旋吸入中心
 * @param {number} index - 粒子索引（1~6）
 * @returns {Object} CSS自定义属性对象
 */
function getParticleStyle (index) {
  const angle = (index - 1) * 60
  const startRadius = 12 + (index % 3) * 4
  const duration = 1.8 + (index % 3) * 0.4
  const delay = 1 + (index % 3) * 0.3
  const isCyan = index % 2 === 0
  return {
    '--er-part-angle': `${angle}deg`,
    '--er-part-radius': `${startRadius}px`,
    '--er-part-duration': `${duration}s`,
    '--er-part-color': isCyan ? 'rgba(0, 255, 255, 0.9)' : 'rgba(255, 248, 220, 0.9)',
    '--er-part-glow': isCyan ? 'rgba(0, 255, 255, 0.6)' : 'rgba(255, 215, 0, 0.6)',
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   能量反弹 (spirit_mage_energy_reflect) - 能量传送门特效
   技能描述：将受到的物理伤害加倍返还回去
   色彩方案：守护金(#FFD700) + 反弹青(#00FFFF) + 能量白(#FFF8DC) + 深邃琥珀(#B8860B)
   GPU加速：contain隔离 + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   定位：贴合 player-card-area 容器右侧外部居中显示竖向椭圆形传送门
   ================================================================ */

/* 传送门舞台 - 定位容器，贴合玩家卡片右侧 */
.er-stage {
  position: absolute;
  left: 93%;
  top: 50%;
  transform: translate3d(-2px, -50%, 0);
  width: 40px;
  height: 110px;
  contain: layout style;
  pointer-events: none;
  z-index: 50;
  animation: er-stage-appear 0.6s ease-out forwards;
  will-change: opacity, transform;
}
@keyframes er-stage-appear {
  0% {
    opacity: 0;
    transform: translate3d(-2px, -50%, 0) scale(0.2);
  }
  60% {
    opacity: 1;
    transform: translate3d(-2px, -50%, 0) scale(1.1);
  }
  100% {
    opacity: 1;
    transform: translate3d(-2px, -50%, 0) scale(1);
  }
}

/* ================================================================
   阶段⓪：传送门凝聚（0s ~ 0.6s）
   ================================================================ */

/* 能量汇聚粒子 - 从四周向中心汇聚 */
.er-converge {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 248, 220, 1) 0%,
    rgba(255, 215, 0, 0.8) 40%,
    transparent 100%
  );
  box-shadow: 0 0 5px rgba(255, 215, 0, 0.6);
  transform: translate3d(-50%, -50%, 0) rotate(var(--er-conv-angle, 0deg)) translateX(var(--er-conv-dist, 45px)) scale(0);
  animation: er-converge 0.6s ease-in forwards;
  will-change: transform, opacity;
}
@keyframes er-converge {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--er-conv-angle, 0deg)) translateX(var(--er-conv-dist, 45px)) scale(0);
    opacity: 0;
  }
  30% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--er-conv-angle, 0deg)) translateX(var(--er-conv-dist, 45px)) scale(1.5);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--er-conv-angle, 0deg)) translateX(0px) scale(0.2);
    opacity: 0;
  }
}

/* ================================================================
   阶段①：传送门开启（0.4s ~ 1.0s）
   ================================================================ */

/* 传送门外光晕 - 整体发光氛围 */
.er-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 44px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(
    ellipse,
    rgba(255, 215, 0, 0.18) 0%,
    rgba(255, 215, 0, 0.08) 30%,
    rgba(0, 255, 255, 0.05) 55%,
    transparent 75%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: er-glow-appear 0.6s ease-out 0.3s forwards, er-glow-pulse 2.5s ease-in-out 1s infinite;
  will-change: transform, opacity;
  filter: blur(2px);
}
@keyframes er-glow-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}
@keyframes er-glow-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* 传送门椭圆框架 - 竖向椭圆形能量门 */
.er-portal {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 28px;
  height: 92px;
  border-radius: 50%;
  overflow: hidden;
  transform: translate3d(-50%, -50%, 0) scaleY(0);
  animation: er-portal-open 0.5s ease-out 0.35s forwards;
  will-change: transform, opacity;
}
@keyframes er-portal-open {
  0% {
    transform: translate3d(-50%, -50%, 0) scaleY(0) scaleX(0.3);
    opacity: 0;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) scaleY(0.7) scaleX(1.1);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scaleY(1) scaleX(1);
    opacity: 1;
  }
}

/* 传送门内部背景 - 深邃暗色漩涡底色 */
.er-portal-bg {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(20, 10, 5, 0.6) 0%,
    rgba(40, 25, 5, 0.5) 30%,
    rgba(60, 40, 10, 0.4) 60%,
    rgba(80, 60, 15, 0.3) 85%,
    transparent 100%
  );
}

/* 漩涡层1 - 顺时针旋转的conic-gradient能量漩涡 */
.er-vortex {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  will-change: transform, opacity;
}
.er-vortex.vortex-1 {
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.35) 40deg,
    transparent 80deg,
    rgba(255, 248, 220, 0.25) 120deg,
    transparent 160deg,
    rgba(0, 255, 255, 0.3) 200deg,
    transparent 240deg,
    rgba(255, 215, 0, 0.35) 280deg,
    transparent 320deg,
    transparent 360deg
  );
  transform: translate(-50%, -50%) scale(0);
  animation: er-vortex-1-appear 0.4s ease-out 0.5s forwards, er-vortex-1-spin 3s linear 0.9s infinite;
  filter: blur(1px);
}
.er-vortex.vortex-2 {
  background: conic-gradient(
    from 180deg,
    transparent 0deg,
    rgba(0, 255, 255, 0.25) 50deg,
    transparent 100deg,
    rgba(255, 215, 0, 0.3) 150deg,
    transparent 200deg,
    rgba(255, 248, 220, 0.2) 250deg,
    transparent 300deg,
    transparent 360deg
  );
  transform: translate(-50%, -50%) scale(0);
  animation: er-vortex-2-appear 0.4s ease-out 0.6s forwards, er-vortex-2-spin 4s linear 1s infinite reverse;
  filter: blur(2px);
}
@keyframes er-vortex-1-appear {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}
@keyframes er-vortex-2-appear {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.85);
    opacity: 0.8;
  }
}
@keyframes er-vortex-1-spin {
  from { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  to { transform: translate(-50%, -50%) scale(1) rotate(360deg); }
}
@keyframes er-vortex-2-spin {
  from { transform: translate(-50%, -50%) scale(0.85) rotate(0deg); }
  to { transform: translate(-50%, -50%) scale(0.85) rotate(360deg); }
}

/* 螺旋能量线 - 从边缘向中心螺旋收缩的能量光带 */
.er-spiral {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    transparent 0%,
    var(--er-spiral-color, rgba(255, 215, 0, 0.7)) 40%,
    rgba(255, 248, 220, 0.9) 60%,
    transparent 100%
  );
  box-shadow: 0 0 4px var(--er-spiral-color, rgba(255, 215, 0, 0.5));
  transform-origin: 100% 50%;
  transform: translate(-50%, -50%) rotate(var(--er-spiral-angle, 0deg)) translateX(14px) scaleX(0);
  opacity: 0;
  animation: er-spiral var(--er-spiral-duration, 2s) ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes er-spiral {
  0% {
    transform: translate(-50%, -50%) rotate(var(--er-spiral-angle, 0deg)) translateX(14px) scaleX(0.3);
    opacity: 0;
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--er-spiral-angle, 0deg)) translateX(14px) scaleX(1);
  }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--er-spiral-angle, 0deg) + 180deg)) translateX(0px) scaleX(0.1);
    opacity: 0;
  }
}

/* 中心亮核 - 传送门中心的发光球体 */
.er-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: er-center-appear 0.4s ease-out 0.7s forwards;
  will-change: transform, opacity;
}
@keyframes er-center-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  60% {
    transform: translate3d(-50%, -50%, 0) scale(1.5);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}

/* 中心亮核内部 - 发光能量球 */
.er-center-core {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 248, 220, 0.95) 25%,
    rgba(255, 215, 0, 0.8) 55%,
    rgba(184, 134, 11, 0.3) 100%
  );
  box-shadow:
    0 0 6px rgba(255, 215, 0, 0.9),
    0 0 12px rgba(255, 215, 0, 0.5),
    0 0 20px rgba(0, 255, 255, 0.3);
  animation: er-center-pulse 1.5s ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes er-center-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.4);
    opacity: 1;
  }
}

/* 粒子吸入 - 从边缘螺旋吸入中心的能量粒子 */
.er-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--er-part-color, rgba(255, 248, 220, 0.9)) 0%,
    transparent 100%
  );
  box-shadow: 0 0 3px var(--er-part-glow, rgba(255, 215, 0, 0.6));
  transform: translate3d(-50%, -50%, 0) rotate(var(--er-part-angle, 0deg)) translateX(var(--er-part-radius, 12px)) scale(0);
  opacity: 0;
  animation: er-particle var(--er-part-duration, 2s) ease-in infinite;
  will-change: transform, opacity;
}
@keyframes er-particle {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--er-part-angle, 0deg)) translateX(var(--er-part-radius, 12px)) scale(1);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--er-part-angle, 0deg) + 270deg)) translateX(0px) scale(0.2);
    opacity: 0;
  }
}

/* 闪烁sweep - 偶发的反射闪光，暗示伤害反弹 */
.er-flash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 28px;
  height: 92px;
  border-radius: 50%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 255, 255, 0) 35%,
    rgba(0, 255, 255, 0.5) 47%,
    rgba(255, 255, 255, 0.8) 50%,
    rgba(0, 255, 255, 0.5) 53%,
    rgba(255, 255, 255, 0) 65%,
    transparent 100%
  );
  transform: translate(-50%, -50%) scaleY(0);
  opacity: 0;
  will-change: transform, opacity;
}
.er-flash.flash-1 {
  animation: er-flash-sweep 3s ease-in-out 1.5s infinite;
}
.er-flash.flash-2 {
  animation: er-flash-sweep 3.5s ease-in-out 3s infinite;
}
@keyframes er-flash-sweep {
  0% {
    transform: translate(-50%, -50%) translateY(-25px) scaleY(0.2);
    opacity: 0;
  }
  10% {
    opacity: 0.7;
    transform: translate(-50%, -50%) translateY(-15px) scaleY(0.5);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) translateY(0px) scaleY(1);
  }
  90% {
    opacity: 0.7;
    transform: translate(-50%, -50%) translateY(15px) scaleY(0.5);
  }
  100% {
    transform: translate(-50%, -50%) translateY(25px) scaleY(0.2);
    opacity: 0;
  }
}

/* ================================================================
   传送门边框光弧 - 椭圆形发光边框
   ================================================================ */

/* 传送门边框基础样式 */
.er-rim {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
  pointer-events: none;
}

/* 外圈边框 - 金色发光椭圆环 */
.er-rim.rim-outer {
  width: 28px;
  height: 92px;
  border: 2px solid rgba(255, 215, 0, 0.5);
  box-shadow:
    0 0 8px rgba(255, 215, 0, 0.4),
    0 0 4px rgba(255, 248, 220, 0.3),
    inset 0 0 6px rgba(255, 215, 0, 0.2);
  animation: er-rim-outer-appear 0.4s ease-out 0.45s forwards, er-rim-pulse 2s ease-in-out 1s infinite;
}
@keyframes er-rim-outer-appear {
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
    opacity: 1;
  }
}

/* 内圈边框 - 青色发光椭圆环 */
.er-rim.rim-inner {
  width: 24px;
  height: 80px;
  border: 1px solid rgba(0, 255, 255, 0.4);
  box-shadow:
    0 0 6px rgba(0, 255, 255, 0.3),
    inset 0 0 4px rgba(0, 255, 255, 0.15);
  animation: er-rim-inner-appear 0.4s ease-out 0.55s forwards, er-rim-pulse 2.5s ease-in-out 1.2s infinite;
}
@keyframes er-rim-inner-appear {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.7;
  }
}

/* 边框脉冲呼吸 */
@keyframes er-rim-pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .er-stage * {
    animation-duration: 0.5s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
