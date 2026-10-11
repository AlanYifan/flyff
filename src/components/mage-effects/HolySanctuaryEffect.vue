<!--
  @file HolySanctuaryEffect.vue
  @generated 2026-07-29
  @description 圣光庇护 - 圣光降临·领域展开·治愈涌泉·圣辉消散
  炽天使Q技能（nature_messenger_q）：展开圣光领域庇护全队，持续恢复全体队友生命值
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
  动画总时长：2.6秒（一次性播放，BUFF施放时触发）
    ⓪ 圣光降临（0s ~ 0.5s）- 金色光柱从天而降 + 圣光全屏闪 + 领域萌芽
    ① 领域展开（0.3s ~ 1.0s）- 地面神圣法阵旋转展开 + 三层圣环扩散 + 圣光穹顶
    ② 治愈涌泉（0.6s ~ 1.8s）- 治愈粒子上升 + 生命波纹脉冲 + 圣光雨滴 + 符文旋转
    ③ 圣辉消散（1.6s ~ 2.6s）- 领域渐隐 + 余韵光粒消散
  色彩方案：圣光金(#FFD700) + 治愈翠(#50C878) + 圣光白(#FFFEF0) + 暖光(#FFF8DC)
-->
<template>
  <!-- 3D舞台 - 透视容器，为圣光领域提供3D空间深度 -->
  <div class="hs-3d-stage">
    <!-- ===== 阶段⓪：圣光降临 ===== -->
    <!-- 圣域暗幕 - 金色暖光笼罩，营造神圣降临的氛围 -->
    <div class="hs-dim"></div>

    <!-- 圣光全屏闪光 - 光柱降临瞬间的金白色爆闪 -->
    <div class="hs-flash"></div>

    <!-- 圣光光柱 - 从天而降的金色治愈光柱 -->
    <div class="hs-beam">
      <div class="hs-beam-core"></div>
      <div class="hs-beam-glow"></div>
      <div class="hs-beam-waves">
        <div
          v-for="i in 4"
          :key="'hs-beam-wave-' + i"
          class="hs-beam-wave"
          :style="{ animationDelay: `${(i - 1) * 0.08}s` }"
        ></div>
      </div>
    </div>

    <!-- ===== 阶段①：领域展开 ===== -->
    <!-- 地面层 - 3D倾斜地面平面，所有地面特效的容器 -->
    <div class="hs-ground-plane">
      <!-- 神圣法阵 - 地面展开的旋转魔法阵 -->
      <div class="hs-magic-circle">
        <div class="hs-circle-outer"></div>
        <div class="hs-circle-mid"></div>
        <div class="hs-circle-inner"></div>
      </div>

      <!-- 圣环扩散 - 从中心向外扩散的金绿双色光环 -->
      <div class="hs-ring ring-1"></div>
      <div class="hs-ring ring-2"></div>
      <div class="hs-ring ring-3"></div>

      <!-- 地面圣辉 - 法阵中心的金绿光池 -->
      <div class="hs-ground-glow"></div>
    </div>

    <!-- 圣光穹顶 - 半球形发光罩覆盖全队 -->
    <div class="hs-dome">
      <div class="hs-dome-glow"></div>
      <div class="hs-dome-rim"></div>
    </div>

    <!-- ===== 阶段②：治愈涌泉 ===== -->
    <!-- 治愈粒子 - 从地面向上飘升的金绿双色光粒 -->
    <div
      v-for="i in 14"
      :key="'hs-particle-' + i"
      class="hs-particle"
      :style="getParticleStyle(i)"
    ></div>

    <!-- 生命波纹脉冲 - 从中心向外扩散的治愈波纹 -->
    <div class="hs-pulse pulse-1"></div>
    <div class="hs-pulse pulse-2"></div>
    <div class="hs-pulse pulse-3"></div>

    <!-- 圣光雨滴 - 从穹顶降落的治愈光滴 -->
    <div
      v-for="i in 10"
      :key="'hs-rain-' + i"
      class="hs-rain"
      :style="getRainStyle(i)"
    ></div>

    <!-- 符文圆环 - 旋转的治愈符文（双层） -->
    <div class="hs-rune-ring rune-outer"></div>
    <div class="hs-rune-ring rune-inner"></div>

    <!-- 中央治愈核心 - 发光的圣光之球 -->
    <div class="hs-core">
      <div class="hs-core-inner"></div>
    </div>

    <!-- ===== 阶段③：圣辉消散 ===== -->
    <!-- 圣域余韵 - 最终残留的金绿光晕消散 -->
    <div class="hs-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 圣光庇护 - 圣光降临·领域展开·治愈涌泉·圣辉消散
 * 炽天使Q技能（nature_messenger_q）群体BUFF特效组件
 * 展开圣光领域庇护全队，持续恢复全体队友生命值
 * 以圣光金和治愈翠绿为主色调，展现神圣领域展开与治愈涌泉的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 * 动画总时长2.6秒
 */

/**
 * 计算治愈上升粒子的样式
 * 每个粒子从法阵中心附近随机偏移起始，向上飘升并渐隐
 * 颜色交替使用金色和翠绿，对应圣光与治愈的双重效果
 * @param {number} index - 粒子索引（1~14）
 * @returns {Object} CSS自定义属性对象
 */
function getParticleStyle (index) {
  const angle = (index - 1) * 25.7 + (index % 3) * 8
  const rad = (angle * Math.PI) / 180
  const startRadius = 15 + (index % 5) * 14
  const startX = Math.cos(rad) * startRadius
  const startY = Math.sin(rad) * startRadius * 0.4
  const driftX = ((index % 2 === 0) ? 1 : -1) * (10 + (index % 3) * 8)
  const riseY = -90 - (index % 4) * 25
  const size = 4 + (index % 3) * 3
  const delay = 0.5 + (index % 7) * 0.05
  const colorType = index % 2
  const colors = [
    { color: 'rgba(255, 215, 0, 0.95)', glow: 'rgba(255, 215, 0, 0.7)' },
    { color: 'rgba(80, 200, 120, 0.95)', glow: 'rgba(80, 200, 120, 0.7)' }
  ]
  const c = colors[colorType]
  return {
    '--hs-start-x': `${startX}px`,
    '--hs-start-y': `${startY}px`,
    '--hs-drift-x': `${driftX}px`,
    '--hs-rise-y': `${riseY}px`,
    '--hs-size': `${size}px`,
    '--hs-color': c.color,
    '--hs-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算圣光雨滴的样式
 * 每个光滴从穹顶上方降落，模拟圣光治愈雨的效果
 * @param {number} index - 雨滴索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getRainStyle (index) {
  const startX = -80 + (index - 1) * 17 + (index % 2) * 6
  const fallDistance = 180 + (index % 3) * 20
  const delay = 0.7 + (index % 5) * 0.08
  const size = 3 + (index % 2) * 2
  return {
    '--hs-rain-x': `${startX}px`,
    '--hs-rain-fall': `${fallDistance}px`,
    '--hs-rain-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   圣光庇护 (nature_messenger_q) - 圣光降临·领域展开·治愈涌泉·圣辉消散
   技能描述：展开圣光领域庇护全队，持续恢复全体队友生命值
   色彩方案：圣光金(#FFD700) + 治愈翠(#50C878) + 圣光白(#FFFEF0) + 暖光(#FFF8DC)
   3D技术：perspective透视 + rotateX地面倾斜
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：2.6秒
   ================================================================ */

/* 3D舞台 - 透视容器 */
.hs-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
  pointer-events: none;
}

/* ---------- 阶段⓪：圣光降临（0s ~ 0.5s）---------- */

/* 圣域暗幕 - 金色暖光笼罩 */
.hs-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 35%,
    rgba(70, 55, 5, 0.5) 0%,
    rgba(45, 35, 0, 0.3) 45%,
    rgba(20, 15, 0, 0.15) 75%,
    transparent 100%
  );
  animation: hs-dim 2.6s ease-out forwards;
  will-change: opacity;
}

@keyframes hs-dim {
  0%   { opacity: 0; }
  8%   { opacity: 1; }
  50%  { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 圣光全屏闪光 - 光柱降临瞬间的金白色爆闪 */
.hs-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(255, 250, 220, 0.9) 0%,
    rgba(255, 220, 120, 0.5) 25%,
    rgba(255, 180, 50, 0.25) 50%,
    transparent 75%
  );
  opacity: 0;
  animation: hs-flash 0.8s ease-out forwards;
  will-change: opacity;
}

@keyframes hs-flash {
  0%, 100% { opacity: 0; }
  5%  { opacity: 1; }
  12% { opacity: 0.3; }
  20% { opacity: 0.8; }
  40% { opacity: 0.2; }
  80% { opacity: 0; }
}

/* 圣光光柱 - 从天而降的金色治愈光柱 */
.hs-beam {
  position: absolute;
  top: 0;
  left: 50%;
  width: 70px;
  height: 100%;
  transform: translateX(-50%);
  animation: hs-beam 1s ease-out forwards;
  will-change: opacity, transform;
}

@keyframes hs-beam {
  0% {
    transform: translateX(-50%) scaleY(0);
    transform-origin: top center;
    opacity: 0;
  }
  15% {
    transform: translateX(-50%) scaleY(1);
    opacity: 1;
  }
  50% {
    transform: translateX(-50%) scaleY(1);
    opacity: 0.7;
  }
  100% {
    transform: translateX(-50%) scaleY(1);
    opacity: 0;
  }
}

/* 光柱核心 - 明亮的白金色光柱本体 */
.hs-beam-core {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 240, 1) 0%,
    rgba(255, 235, 160, 0.95) 20%,
    rgba(255, 210, 80, 0.85) 50%,
    rgba(80, 200, 120, 0.5) 80%,
    rgba(255, 170, 20, 0.3) 100%
  );
  border-radius: 50% 50% 20% 20%;
  box-shadow:
    0 0 30px rgba(255, 220, 100, 0.9),
    0 0 60px rgba(255, 190, 50, 0.6),
    0 0 100px rgba(80, 200, 120, 0.3);
}

/* 光柱外层光晕 */
.hs-beam-glow {
  position: absolute;
  inset: -30px -60px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 220, 100, 0.35) 0%,
    rgba(80, 200, 120, 0.2) 40%,
    transparent 70%
  );
  filter: blur(12px);
}

/* 光柱波纹层容器 */
.hs-beam-waves {
  position: absolute;
  inset: 0;
}

/* 光柱下行波纹 */
.hs-beam-wave {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50px;
  height: 18px;
  transform: translateX(-50%);
  background: radial-gradient(
    ellipse,
    rgba(255, 255, 240, 0.7) 0%,
    rgba(80, 200, 120, 0.35) 50%,
    transparent 100%
  );
  filter: blur(3px);
  animation: hs-beam-wave 0.6s ease-in forwards;
  will-change: transform, opacity;
}

@keyframes hs-beam-wave {
  0% {
    transform: translateX(-50%) translateY(0) scale(1);
    opacity: 0;
  }
  10% { opacity: 1; }
  100% {
    transform: translateX(-50%) translateY(400px) scale(1.5);
    opacity: 0;
  }
}

/* ---------- 阶段①：领域展开（0.3s ~ 1.0s）---------- */

/* 地面层 - 3D倾斜平面 */
.hs-ground-plane {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%) rotateX(72deg);
  transform-style: preserve-3d;
}

/* 神圣法阵 - 地面展开的旋转魔法阵 */
.hs-magic-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 280px;
  height: 280px;
  transform: translate(-50%, -50%) scale(0);
  animation: hs-circle-appear 0.5s ease-out 0.3s forwards,
             hs-circle-fade 0.5s ease-out 1.5s forwards;
  will-change: transform, opacity;
}

@keyframes hs-circle-appear {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  60% {
    transform: translate(-50%, -50%) scale(1.1) rotate(30deg);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1) rotate(45deg);
    opacity: 1;
  }
}

@keyframes hs-circle-fade {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* 外环 - 旋转的金绿符文圆环 */
.hs-circle-outer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid rgba(255, 215, 0, 0.8);
  box-shadow:
    0 0 20px rgba(255, 200, 50, 0.6),
    inset 0 0 20px rgba(80, 200, 120, 0.3);
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 220, 100, 0.15) 2deg,
    transparent 4deg,
    transparent 12deg,
    rgba(80, 200, 120, 0.1) 14deg,
    transparent 16deg
  );
  animation: hs-spin-cw 3s linear 0.3s infinite;
  will-change: transform;
}

/* 中环 - 反向旋转 */
.hs-circle-mid {
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  border: 2px solid rgba(80, 200, 120, 0.7);
  box-shadow:
    0 0 15px rgba(80, 200, 120, 0.5),
    inset 0 0 15px rgba(255, 230, 120, 0.2);
  background: repeating-conic-gradient(
    from 15deg,
    transparent 0deg,
    rgba(80, 200, 120, 0.12) 3deg,
    transparent 6deg,
    transparent 18deg
  );
  animation: hs-spin-ccw 2.5s linear 0.3s infinite;
  will-change: transform;
}

/* 内环 - 快速旋转 */
.hs-circle-inner {
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  border: 1px solid rgba(255, 245, 180, 0.6);
  box-shadow:
    0 0 10px rgba(255, 230, 100, 0.4),
    inset 0 0 10px rgba(80, 200, 120, 0.2);
  animation: hs-spin-cw 1.5s linear 0.3s infinite;
  will-change: transform;
}

@keyframes hs-spin-cw {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes hs-spin-ccw {
  from { transform: rotate(360deg); }
  to   { transform: rotate(0deg); }
}

/* 圣环扩散 - 从中心向外扩散的金绿光环 */
.hs-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(255, 215, 0, 0.8);
  box-shadow:
    0 0 20px rgba(255, 200, 50, 0.6),
    inset 0 0 15px rgba(80, 200, 120, 0.4);
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.hs-ring.ring-1 { animation: hs-ring 0.8s ease-out 0.3s forwards; }
.hs-ring.ring-2 {
  border-color: rgba(80, 200, 120, 0.7);
  animation: hs-ring 0.9s ease-out 0.45s forwards;
}
.hs-ring.ring-3 {
  border-color: rgba(255, 200, 80, 0.5);
  animation: hs-ring 1s ease-out 0.6s forwards;
}

@keyframes hs-ring {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; }
  100% {
    transform: translate(-50%, -50%) scale(7);
    opacity: 0;
  }
}

/* 地面圣辉 - 法阵中心的金绿光池 */
.hs-ground-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 245, 180, 0.5) 0%,
    rgba(80, 200, 120, 0.35) 30%,
    rgba(255, 180, 30, 0.2) 60%,
    transparent 85%
  );
  transform: translate(-50%, -50%) scale(0);
  animation: hs-ground-glow 1.8s ease-out 0.3s forwards;
  will-change: transform, opacity;
}

@keyframes hs-ground-glow {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
  60% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 0;
  }
}

/* 圣光穹顶 - 半球形发光罩 */
.hs-dome {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 320px;
  height: 160px;
  transform: translate(-50%, -50%) scale(0);
  animation: hs-dome-appear 0.5s ease-out 0.4s forwards,
             hs-dome-fade 0.6s ease-out 1.8s forwards;
  will-change: transform, opacity;
}

@keyframes hs-dome-appear {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  60% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
}

@keyframes hs-dome-fade {
  0% { opacity: 0.6; }
  100% { opacity: 0; }
}

/* 穹顶发光层 */
.hs-dome-glow {
  position: absolute;
  inset: 0;
  border-radius: 50% 50% 0 0;
  background: radial-gradient(
    ellipse at 50% 100%,
    rgba(255, 215, 0, 0.15) 0%,
    rgba(80, 200, 120, 0.1) 40%,
    transparent 70%
  );
  filter: blur(8px);
}

/* 穹顶边框光弧 */
.hs-dome-rim {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 215, 0, 0.5) 30%,
    rgba(255, 255, 240, 0.8) 50%,
    rgba(80, 200, 120, 0.5) 70%,
    transparent 100%
  );
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
  filter: blur(2px);
}

/* ---------- 阶段②：治愈涌泉（0.6s ~ 1.8s）---------- */

/* 治愈粒子 - 从地面向上飘升的金绿光粒 */
.hs-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  width: var(--hs-size, 6px);
  height: var(--hs-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 220, 0.95) 0%,
    var(--hs-color, rgba(255, 215, 0, 0.7)) 45%,
    transparent 100%
  );
  box-shadow: 0 0 8px var(--hs-glow, rgba(255, 215, 0, 0.5));
  transform: translate3d(
    calc(-50% + var(--hs-start-x, 0px)),
    calc(-50% + var(--hs-start-y, 0px)),
    0
  ) scale(0);
  animation: hs-particle 1.4s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes hs-particle {
  0% {
    transform: translate3d(
      calc(-50% + var(--hs-start-x, 0px)),
      calc(-50% + var(--hs-start-y, 0px)),
      0
    ) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(
      calc(-50% + var(--hs-start-x, 0px)),
      calc(-50% + var(--hs-start-y, 0px)),
      0
    ) scale(1.2);
    opacity: 1;
  }
  80% { opacity: 0.5; }
  100% {
    transform: translate3d(
      calc(-50% + var(--hs-start-x, 0px) + var(--hs-drift-x, 0px)),
      calc(-50% + var(--hs-start-y, 0px) + var(--hs-rise-y, 0px)),
      0
    ) scale(0.2);
    opacity: 0;
  }
}

/* 生命波纹脉冲 - 从中心向外扩散的治愈波纹 */
.hs-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.6);
  background: transparent;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.hs-pulse.pulse-1 { animation: hs-pulse-expand 1s ease-out 0.6s forwards; }
.hs-pulse.pulse-2 { animation: hs-pulse-expand 1s ease-out 0.85s forwards; }
.hs-pulse.pulse-3 { animation: hs-pulse-expand 1s ease-out 1.1s forwards; }

@keyframes hs-pulse-expand {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
    border-color: rgba(255, 254, 240, 0.8);
  }
  20% { opacity: 0.8; }
  100% {
    transform: translate(-50%, -50%) scale(3.5);
    opacity: 0;
    border-color: rgba(80, 200, 120, 0.1);
  }
}

/* 圣光雨滴 - 从穹顶降落的治愈光滴 */
.hs-rain {
  position: absolute;
  top: 30%;
  left: 50%;
  width: var(--hs-rain-size, 4px);
  height: calc(var(--hs-rain-size, 4px) * 3);
  border-radius: 50%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 240, 0.95) 0%,
    rgba(255, 215, 0, 0.7) 50%,
    rgba(80, 200, 120, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.5);
  transform: translate3d(
    calc(-50% + var(--hs-rain-x, 0px)),
    0,
    0
  ) scale(0);
  animation: hs-rain-fall 1s ease-in forwards;
  will-change: transform, opacity;
}

@keyframes hs-rain-fall {
  0% {
    transform: translate3d(
      calc(-50% + var(--hs-rain-x, 0px)),
      0,
      0
    ) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate3d(
      calc(-50% + var(--hs-rain-x, 0px)),
      10px,
      0
    ) scale(1);
  }
  85% { opacity: 0.7; }
  100% {
    transform: translate3d(
      calc(-50% + var(--hs-rain-x, 0px)),
      var(--hs-rain-fall, 180px),
      0
    ) scale(0.3);
    opacity: 0;
  }
}

/* 符文圆环 - 旋转的治愈符文（双层） */
.hs-rune-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
}

.rune-outer {
  width: 70%;
  height: 70%;
  border: 1px dashed rgba(255, 215, 0, 0.4);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.18) 30deg,
    transparent 60deg,
    rgba(80, 200, 120, 0.14) 120deg,
    transparent 150deg,
    rgba(255, 254, 240, 0.16) 210deg,
    transparent 240deg,
    rgba(255, 215, 0, 0.18) 300deg,
    transparent 360deg
  );
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.25);
  animation: hs-rune-outer-appear 0.3s ease-out 0.5s forwards,
             hs-rune-outer-spin 3s linear 0.6s forwards;
}

@keyframes hs-rune-outer-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.7;
  }
}

@keyframes hs-rune-outer-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
  80% { opacity: 0.5; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0; }
}

.rune-inner {
  width: 50%;
  height: 50%;
  border: 1px solid rgba(80, 200, 120, 0.25);
  background: conic-gradient(
    from 180deg,
    transparent 0deg,
    rgba(80, 200, 120, 0.16) 45deg,
    transparent 90deg,
    rgba(255, 215, 0, 0.14) 180deg,
    transparent 225deg,
    rgba(255, 254, 240, 0.15) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 5px rgba(80, 200, 120, 0.15);
  animation: hs-rune-inner-appear 0.3s ease-out 0.6s forwards,
             hs-rune-inner-spin 2.5s linear 0.7s forwards;
}

@keyframes hs-rune-inner-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.6;
  }
}

@keyframes hs-rune-inner-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  80% { opacity: 0.3; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0; }
}

/* 中央治愈核心 - 发光的圣光之球 */
.hs-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: hs-core-appear 0.3s ease-out 0.5s forwards,
             hs-core-fade 0.4s ease-out 1.6s forwards;
  will-change: transform, opacity;
}

@keyframes hs-core-appear {
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

@keyframes hs-core-fade {
  0% { opacity: 1; transform: translate3d(-50%, -50%, 0) scale(1); }
  100% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale(1.8); }
}

.hs-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 254, 240, 0.95) 20%,
    rgba(255, 215, 0, 0.85) 50%,
    rgba(80, 200, 120, 0.5) 80%,
    transparent 100%
  );
  box-shadow:
    0 0 8px rgba(255, 215, 0, 0.9),
    0 0 16px rgba(255, 215, 0, 0.5),
    0 0 24px rgba(80, 200, 120, 0.3);
  animation: hs-core-pulse 0.8s ease-in-out 0.6s forwards;
  will-change: transform, opacity;
}

@keyframes hs-core-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.4);
    opacity: 1;
  }
}

/* ---------- 阶段③：圣辉消散（1.6s ~ 2.6s）---------- */

/* 圣域余韵 - 最终残留的金绿光晕消散 */
.hs-afterglow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(255, 215, 0, 0.15) 0%,
    rgba(80, 200, 120, 0.08) 40%,
    transparent 75%
  );
  opacity: 0;
  animation: hs-afterglow 1s ease-out 1.6s forwards;
  will-change: opacity;
}

@keyframes hs-afterglow {
  0% { opacity: 0; }
  25% { opacity: 0.6; }
  100% { opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .hs-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
