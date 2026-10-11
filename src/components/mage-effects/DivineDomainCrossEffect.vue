<!--
  @file DivineDomainCrossEffect.vue
  @generated 2026-07-29
  @description 神圣领域十字效果 - 神圣领域DOT触发时显示的精简十字光芒动画
  仅包含神圣领域特效中阶段③的十字圣光爆发与阶段④的神圣十字闪烁
  GPU加速：所有动画仅使用 transform + opacity，避免重排，保证丝滑流畅
  动画总时长：1.6秒（显示0.8秒 + 消散0.8秒）
    ① 十字圣光爆发（0s ~ 0.5s）- 中心十字形光芒闪烁
    ② 神圣十字闪烁（0.2s ~ 0.8s）- 巨大十字光芒多次闪烁 + 光环扩散
    ③ 渐隐消散（0.8s ~ 1.6s）- 全体元素淡出移除
-->
<template>
  <!-- 3D舞台 - 透视容器，为十字效果提供空间深度 -->
  <div class="ddc-3d-stage">
    <!-- 十字圣光爆发（阶段①）- 中心十字形光芒闪烁 -->
    <div class="ddc-cross-burst">
      <div class="ddc-cross-h"></div>
      <div class="ddc-cross-v"></div>
    </div>

    <!-- 中心光脉冲 - 十字爆发时的光球脉动 -->
    <div class="ddc-pulse"></div>

    <!-- 神圣十字闪烁（阶段②）- 巨大十字光芒多次闪烁 -->
    <div class="ddc-cross-final">
      <div class="ddc-cross-final-h"></div>
      <div class="ddc-cross-final-v"></div>
      <div class="ddc-cross-final-glow"></div>
    </div>

    <!-- 神圣十字光环 - 十字外围扩散的光环 -->
    <div class="ddc-cross-final-ring"></div>
  </div>
</template>

<script setup>
/**
 * 神圣领域十字效果 - DOT触发专用精简动画
 * 仅包含神圣领域中十字圣光爆发与神圣十字闪烁阶段
 * 动画总时长1.6秒：显示0.8秒 + 消散0.8秒
 * 用于 guardian_q DOT tick 时的轻量级特效反馈
 */
</script>

<style scoped>
/* ================================================================
   神圣领域十字效果 (guardian_q DOT) - 十字圣光爆发·神圣十字闪烁
   色彩方案：金色(#FFD700) + 暖白(#FFF8DC) + 琥珀(#FFC125)
   GPU加速：contain隔离 + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：1.6秒
   ================================================================ */

/* 3D舞台 - 透视容器，为十字效果提供空间深度
   0.8秒后整体开始淡出，1.6秒完全移除 */
.ddc-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
  animation: ddc-stage-fade 1.6s ease-out forwards;
}
@keyframes ddc-stage-fade {
  0%   { opacity: 1; }
  50%  { opacity: 1; }
  100% { opacity: 0; }
}

/* ---------- 阶段①：十字圣光爆发（0s ~ 0.5s）---------- */

/* 十字圣光爆发容器 - 中心十字形光芒闪烁 */
.ddc-cross-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  transform: translate(-50%, -50%) scale(0);
  animation: ddc-cross-burst 0.5s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes ddc-cross-burst {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  60% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

/* 十字横光 - 水平方向的光芒 */
.ddc-cross-h {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 6px;
  transform: translate(-50%, -50%);
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 240, 160, 0.3) 15%,
    rgba(255, 255, 220, 0.9) 50%,
    rgba(255, 240, 160, 0.3) 85%,
    transparent 100%
  );
  box-shadow: 0 0 20px rgba(255, 220, 80, 0.6);
  filter: blur(2px);
}

/* 十字纵光 - 垂直方向的光芒 */
.ddc-cross-v {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 300px;
  transform: translate(-50%, -50%);
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 240, 160, 0.3) 15%,
    rgba(255, 255, 220, 0.9) 50%,
    rgba(255, 240, 160, 0.3) 85%,
    transparent 100%
  );
  box-shadow: 0 0 20px rgba(255, 220, 80, 0.6);
  filter: blur(2px);
}

/* 中心光脉冲 - 十字爆发时的光球脉动 */
.ddc-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 240, 0.9) 0%,
    rgba(255, 220, 100, 0.6) 30%,
    rgba(255, 190, 40, 0.3) 60%,
    transparent 85%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: ddc-pulse 0.8s ease-out forwards;
  will-change: transform, opacity;
  filter: blur(4px);
}
@keyframes ddc-pulse {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) scale(1.5);
    opacity: 1;
  }
  40% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.7;
  }
  65% {
    transform: translate3d(-50%, -50%, 0) scale(1.8);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2.5);
    opacity: 0;
  }
}

/* ---------- 阶段②：神圣十字闪烁（0.2s ~ 0.8s）---------- */

/* 神圣十字闪烁 - 巨大十字光芒多次闪烁
   从0.2s开始，通过多次opacity脉冲实现闪烁效果 */
.ddc-cross-final {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  transform: translate(-50%, -50%) scale(0);
  animation: ddc-cross-final 0.8s ease-out 0.2s forwards;
  will-change: transform, opacity;
}
@keyframes ddc-cross-final {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  10% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  20% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.3;
  }
  30% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 1;
  }
  45% {
    transform: translate(-50%, -50%) scale(1.8);
    opacity: 0.2;
  }
  55% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0.9;
  }
  70% {
    transform: translate(-50%, -50%) scale(2.2);
    opacity: 0.4;
  }
  85% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0.7;
  }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
  }
}

/* 神圣十字横光 - 巨大水平光芒 */
.ddc-cross-final-h {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 500px;
  height: 10px;
  transform: translate(-50%, -50%);
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 245, 180, 0.4) 10%,
    rgba(255, 255, 230, 1) 50%,
    rgba(255, 245, 180, 0.4) 90%,
    transparent 100%
  );
  box-shadow:
    0 0 30px rgba(255, 230, 100, 0.8),
    0 0 60px rgba(255, 200, 50, 0.5);
  filter: blur(3px);
}

/* 神圣十字纵光 - 巨大垂直光芒 */
.ddc-cross-final-v {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 500px;
  transform: translate(-50%, -50%);
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 245, 180, 0.4) 10%,
    rgba(255, 255, 230, 1) 50%,
    rgba(255, 245, 180, 0.4) 90%,
    transparent 100%
  );
  box-shadow:
    0 0 30px rgba(255, 230, 100, 0.8),
    0 0 60px rgba(255, 200, 50, 0.5);
  filter: blur(3px);
}

/* 神圣十字中心光球 - 十字交叉处的爆裂光球 */
.ddc-cross-final-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    rgba(255, 255, 240, 1) 0%,
    rgba(255, 230, 120, 0.7) 30%,
    rgba(255, 200, 50, 0.4) 60%,
    transparent 85%
  );
  filter: blur(6px);
}

/* 神圣十字光环 - 十字外围扩散的光环 */
.ddc-cross-final-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 4px solid rgba(255, 230, 100, 0.6);
  box-shadow:
    0 0 30px rgba(255, 210, 60, 0.5),
    inset 0 0 25px rgba(255, 230, 100, 0.3);
  transform: translate(-50%, -50%) scale(0);
  animation: ddc-cross-ring 0.8s ease-out 0.2s forwards;
  will-change: transform, opacity;
}
@keyframes ddc-cross-ring {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0;
  }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .ddc-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
