<!--
  @file DivineDomainEffect.vue
  @generated 2026-07-02
  @description 神圣领域 - 圣光降临·神圣法阵·梅尔卡巴星·神光射线·圣粒飞升·神圣十字闪烁
  守护使者Q技能（Merkaba Hanzelrusha）：在圣之光照射下形成具有圣力的领域，打击踏入领域的敌人
  GPU加速：所有动画仅使用 translate3d + opacity + scale，避免重排，保证丝滑流畅
  3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
  动画总时长：4秒（显示2秒 + 移除2秒）
    ① 圣光降临（0s ~ 0.4s）- 金色光柱从天而降 + 全屏圣光闪
    ② 领域成形（0.2s ~ 0.8s）- 地面神圣法阵展开 + 梅尔卡巴六芒星旋转 + 圣环扩散
    ③ 神圣辐射（0.4s ~ 1.5s）- 神光射线放射 + 圣粒飞升 + 十字圣光爆发
    ④ 神圣十字闪烁（1.2s ~ 2.0s）- 巨大十字光芒多次闪烁 + 圣光脉冲
    ⑤ 渐隐消散（2.0s ~ 4.0s）- 全体元素整体淡出移除
-->
<template>
  <!-- 3D舞台 - 透视容器，为神圣领域的3D空间感提供深度视角 -->
  <div class="divine-3d-stage">
    <!-- 圣域暗幕 - 金色暖光笼罩，营造神圣降临的氛围 -->
    <div class="divine-dim"></div>

    <!-- 圣光全屏闪光 - 光柱降临瞬间的金白色爆闪 -->
    <div class="divine-flash"></div>

    <!-- 圣光光柱 - 从天而降的粗壮金色光柱 -->
    <div class="divine-beam">
      <div class="divine-beam-core"></div>
      <div class="divine-beam-glow"></div>
      <div class="divine-beam-waves">
        <div
          v-for="i in 5"
          :key="'divine-beam-wave-' + i"
          class="divine-beam-wave"
          :style="{ animationDelay: `${(i - 1) * 0.06}s` }"
        ></div>
      </div>
    </div>

    <!-- 地面层 - 3D倾斜地面平面，所有地面特效的容器 -->
    <div class="divine-ground-plane">
      <!-- 神圣法阵 - 地面展开的旋转魔法阵 -->
      <div class="divine-magic-circle">
        <!-- 外环 - 旋转的符文圆环 -->
        <div class="divine-circle-outer"></div>
        <!-- 中环 - 反向旋转的符文圆环 -->
        <div class="divine-circle-mid"></div>
        <!-- 内环 - 快速旋转的精细圆环 -->
        <div class="divine-circle-inner"></div>
      </div>

      <!-- 梅尔卡巴六芒星 - 两个交叠三角组成的神圣几何 -->
      <div class="divine-merkaba">
        <div class="divine-triangle-up"></div>
        <div class="divine-triangle-down"></div>
      </div>

      <!-- 圣环扩散 - 从中心向外扩散的金色光环（3层错峰） -->
      <div class="divine-ring ring-1"></div>
      <div class="divine-ring ring-2"></div>
      <div class="divine-ring ring-3"></div>

      <!-- 地面圣辉 - 法阵中心的金色光池 -->
      <div class="divine-ground-glow"></div>
    </div>

    <!-- 神光射线 - 从中心向四周放射的金色God Rays光束 -->
    <div class="divine-god-rays"></div>

    <!-- 十字圣光爆发 - 中心十字形光芒闪烁（阶段③） -->
    <div class="divine-cross-burst">
      <div class="divine-cross-h"></div>
      <div class="divine-cross-v"></div>
    </div>

    <!-- 圣粒飞升 - 金色光粒从地面向上飘升 -->
    <div
      v-for="i in 16"
      :key="'divine-particle-' + i"
      class="divine-particle"
      :style="getDivineParticleStyle(i)"
    ></div>

    <!-- 圣羽光屑 - 向四周飘散的光芒碎片 -->
    <div
      v-for="i in 10"
      :key="'divine-shard-' + i"
      class="divine-shard"
      :style="getDivineShardStyle(i)"
    ></div>

    <!-- 神圣脉冲 - 中心持续脉动的圣光球 -->
    <div class="divine-pulse"></div>

    <!-- 神圣十字闪烁（阶段④）- 巨大十字光芒多次闪烁，领域终结之光 -->
    <div class="divine-cross-final">
      <div class="divine-cross-final-h"></div>
      <div class="divine-cross-final-v"></div>
      <div class="divine-cross-final-glow"></div>
      <div class="divine-cross-final-ring"></div>
    </div>

    <!-- 圣域余辉 - 最终残留的金色光晕 -->
    <div class="divine-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 神圣领域 - 圣光降临·神圣法阵·梅尔卡巴星·神光射线·圣粒飞升·神圣十字闪烁
 * 守护使者Q技能（Merkaba Hanzelrusha）AOE特效组件
 * 在圣之光照射下形成具有圣力的领域，打击踏入领域的敌人
 * 动画总时长4秒：显示阶段2秒 + 移除渐隐2秒
 */

/**
 * 计算圣粒飞升粒子的样式
 * 每个粒子从法阵中心附近随机偏移起始，向上飘升并渐隐
 * @param {number} index - 粒子索引（1~16）
 * @returns {Object} CSS自定义属性对象
 */
function getDivineParticleStyle (index) {
  const angle = (index - 1) * 22.5 + (index % 3) * 7
  const rad = (angle * Math.PI) / 180
  const startRadius = 20 + (index % 4) * 18
  const startX = Math.cos(rad) * startRadius
  const startY = Math.sin(rad) * startRadius * 0.4
  const driftX = ((index % 2 === 0) ? 1 : -1) * (15 + (index % 3) * 10)
  const riseY = -120 - (index % 5) * 30
  const size = 4 + (index % 3) * 3
  const delay = 0.3 + (index % 6) * 0.06
  return {
    '--dv-start-x': `${startX}px`,
    '--dv-start-y': `${startY}px`,
    '--dv-drift-x': `${driftX}px`,
    '--dv-rise-y': `${riseY}px`,
    '--dv-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算圣羽光屑的样式
 * 每个光屑从中心向四周呈放射状飞散
 * @param {number} index - 光屑索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getDivineShardStyle (index) {
  const angle = (index - 1) * 36 + (index % 2) * 8
  const rad = (angle * Math.PI) / 180
  const distance = 80 + (index % 4) * 35
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance * 0.5 - 20
  const size = 8 + (index % 3) * 6
  const delay = 0.4 + (index % 5) * 0.05
  return {
    '--dv-shard-tx': `${tx}px`,
    '--dv-shard-ty': `${ty}px`,
    '--dv-shard-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   神圣领域 (guardian_q) - 圣光降临·神圣法阵·梅尔卡巴星·神光射线·圣粒飞升·神圣十字闪烁
   技能描述：在圣之光照射下形成具有圣力的领域，打击踏入领域的敌人
   色彩方案：金色(#FFD700) + 暖白(#FFF8DC) + 琥珀(#FFC125) + 浅金(#FFE4B5)
   3D技术：perspective透视 + rotateX地面倾斜
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：4秒（显示2秒 + 移除渐隐2秒）
   ================================================================ */

/* 3D舞台 - 透视容器，为神圣领域提供3D空间深度
   2秒后整体开始淡出，4秒完全移除 */
.divine-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
  animation: dv-stage-fade 4s ease-out forwards;
}
@keyframes dv-stage-fade {
  0%   { opacity: 1; }
  50%  { opacity: 1; }
  100% { opacity: 0; }
}

/* ---------- 阶段①：圣光降临（0s ~ 0.4s）---------- */

/* 圣域暗幕 - 金色暖光笼罩，营造神圣降临的庄严氛围 */
.divine-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 30%,
    rgba(80, 60, 10, 0.6) 0%,
    rgba(50, 38, 5, 0.4) 40%,
    rgba(20, 15, 0, 0.2) 75%,
    transparent 100%
  );
  animation: dv-dim 2s ease-out forwards;
  will-change: opacity;
}
@keyframes dv-dim {
  0%   { opacity: 0; }
  10%  { opacity: 1; }
  60%  { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 圣光全屏闪光 - 光柱降临瞬间的金白色爆闪 */
.divine-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(255, 250, 220, 0.95) 0%,
    rgba(255, 220, 120, 0.6) 25%,
    rgba(255, 180, 50, 0.3) 50%,
    transparent 75%
  );
  opacity: 0;
  animation: dv-flash 0.8s ease-out forwards;
  will-change: opacity;
}
@keyframes dv-flash {
  0%, 100% { opacity: 0; }
  5%  { opacity: 1; }
  12% { opacity: 0.3; }
  20% { opacity: 0.9; }
  40% { opacity: 0.2; }
  80% { opacity: 0; }
}

/* 圣光光柱 - 从天而降的粗壮金色光柱 */
.divine-beam {
  position: absolute;
  top: 0;
  left: 50%;
  width: 80px;
  height: 100%;
  transform: translateX(-50%);
  animation: dv-beam 1s ease-out forwards;
  will-change: opacity, transform;
}
@keyframes dv-beam {
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
.divine-beam-core {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 240, 1) 0%,
    rgba(255, 235, 160, 0.95) 20%,
    rgba(255, 210, 80, 0.85) 50%,
    rgba(255, 190, 40, 0.6) 80%,
    rgba(255, 170, 20, 0.3) 100%
  );
  border-radius: 50% 50% 20% 20%;
  box-shadow:
    0 0 30px rgba(255, 220, 100, 0.9),
    0 0 60px rgba(255, 190, 50, 0.6),
    0 0 100px rgba(255, 160, 20, 0.3);
}

/* 光柱外层光晕 - 包裹光柱的巨大发光层 */
.divine-beam-glow {
  position: absolute;
  inset: -30px -60px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 220, 100, 0.4) 0%,
    rgba(255, 180, 40, 0.2) 40%,
    transparent 70%
  );
  filter: blur(12px);
}

/* 光柱波纹层容器 */
.divine-beam-waves {
  position: absolute;
  inset: 0;
}

/* 光柱下行波纹 - 从顶部向下流动的能量波 */
.divine-beam-wave {
  position: absolute;
  top: 0;
  left: 50%;
  width: 60px;
  height: 20px;
  transform: translateX(-50%);
  background: radial-gradient(
    ellipse,
    rgba(255, 255, 240, 0.8) 0%,
    rgba(255, 220, 100, 0.4) 50%,
    transparent 100%
  );
  filter: blur(3px);
  animation: dv-beam-wave 0.6s ease-in forwards;
  will-change: transform, opacity;
}
@keyframes dv-beam-wave {
  0% {
    transform: translateX(-50%) translateY(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(400px) scale(1.5);
    opacity: 0;
  }
}

/* ---------- 阶段②：领域成形（0.2s ~ 0.8s）---------- */

/* 地面层 - 3D倾斜平面，所有地面特效的容器 */
.divine-ground-plane {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%) rotateX(72deg);
  transform-style: preserve-3d;
}

/* 神圣法阵 - 地面展开的旋转魔法阵容器 */
.divine-magic-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  transform: translate(-50%, -50%) scale(0);
  animation: dv-circle-appear 0.5s ease-out 0.2s forwards;
  will-change: transform, opacity;
}
@keyframes dv-circle-appear {
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

/* 外环 - 旋转的符文圆环，带金色发光边框 */
.divine-circle-outer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid rgba(255, 215, 0, 0.8);
  box-shadow:
    0 0 20px rgba(255, 200, 50, 0.6),
    inset 0 0 20px rgba(255, 215, 0, 0.3);
  background:
    repeating-conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(255, 220, 100, 0.15) 2deg,
      transparent 4deg,
      transparent 12deg,
      rgba(255, 200, 80, 0.1) 14deg,
      transparent 16deg
    );
  animation: dv-rotate-cw 3s linear 0.2s infinite;
  will-change: transform;
}

/* 中环 - 反向旋转的符文圆环 */
.divine-circle-mid {
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  border: 2px solid rgba(255, 230, 120, 0.7);
  box-shadow:
    0 0 15px rgba(255, 210, 60, 0.5),
    inset 0 0 15px rgba(255, 230, 120, 0.2);
  background:
    repeating-conic-gradient(
      from 15deg,
      transparent 0deg,
      rgba(255, 235, 150, 0.12) 3deg,
      transparent 6deg,
      transparent 18deg
    );
  animation: dv-rotate-ccw 2.5s linear 0.2s infinite;
  will-change: transform;
}

/* 内环 - 快速旋转的精细圆环 */
.divine-circle-inner {
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  border: 1px solid rgba(255, 245, 180, 0.6);
  box-shadow:
    0 0 10px rgba(255, 230, 100, 0.4),
    inset 0 0 10px rgba(255, 245, 180, 0.2);
  animation: dv-rotate-cw 1.5s linear 0.2s infinite;
  will-change: transform;
}

@keyframes dv-rotate-cw {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes dv-rotate-ccw {
  from { transform: rotate(360deg); }
  to   { transform: rotate(0deg); }
}

/* 梅尔卡巴六芒星 - 两个交叠三角组成的神圣几何 */
.divine-merkaba {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 160px;
  height: 160px;
  transform: translate(-50%, -50%) scale(0);
  animation: dv-merkaba 1.8s ease-out 0.3s forwards;
  will-change: transform, opacity;
}
@keyframes dv-merkaba {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  15% {
    transform: translate(-50%, -50%) scale(1.2) rotate(30deg);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1) rotate(180deg);
    opacity: 0.9;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.3) rotate(360deg);
    opacity: 0;
  }
}

/* 向上三角 - 梅尔卡巴的上三角部分 */
.divine-triangle-up {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(255, 200, 50, 0.3) 0%,
    rgba(255, 230, 120, 0.5) 50%,
    rgba(255, 250, 200, 0.7) 100%
  );
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
  animation: dv-rotate-cw 4s linear 0.3s infinite;
}

/* 向下三角 - 梅尔卡巴的下三角部分 */
.divine-triangle-down {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 200, 50, 0.3) 0%,
    rgba(255, 230, 120, 0.5) 50%,
    rgba(255, 250, 200, 0.7) 100%
  );
  clip-path: polygon(50% 100%, 100% 0%, 0% 0%);
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
  animation: dv-rotate-ccw 4s linear 0.3s infinite;
}

/* 圣环扩散 - 从中心向外扩散的金色光环（3层错峰） */
.divine-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(255, 215, 0, 0.8);
  box-shadow:
    0 0 20px rgba(255, 200, 50, 0.6),
    inset 0 0 15px rgba(255, 220, 100, 0.4);
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}
.divine-ring.ring-1 {
  animation: dv-ring 0.8s ease-out 0.3s forwards;
}
.divine-ring.ring-2 {
  border-color: rgba(255, 200, 80, 0.7);
  animation: dv-ring 0.9s ease-out 0.45s forwards;
}
.divine-ring.ring-3 {
  border-color: rgba(255, 180, 50, 0.5);
  animation: dv-ring 1s ease-out 0.6s forwards;
}
@keyframes dv-ring {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(8);
    opacity: 0;
  }
}

/* 地面圣辉 - 法阵中心的金色光池 */
.divine-ground-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 245, 180, 0.6) 0%,
    rgba(255, 210, 80, 0.4) 30%,
    rgba(255, 180, 30, 0.2) 60%,
    transparent 85%
  );
  transform: translate(-50%, -50%) scale(0);
  animation: dv-ground-glow 1.6s ease-out 0.2s forwards;
  will-change: transform, opacity;
}
@keyframes dv-ground-glow {
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

/* ---------- 阶段③：神圣辐射（0.4s ~ 1.5s）---------- */

/* 神光射线 - 从中心向四周放射的金色God Rays光束 */
.divine-god-rays {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 600px;
  height: 600px;
  transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(0);
  background: conic-gradient(
    from 0deg,
    transparent 0deg, rgba(255, 230, 120, 0.18) 4deg, transparent 8deg,
    transparent 24deg, rgba(255, 215, 80, 0.15) 28deg, transparent 32deg,
    transparent 48deg, rgba(255, 240, 150, 0.18) 52deg, transparent 56deg,
    transparent 72deg, rgba(255, 210, 70, 0.14) 76deg, transparent 80deg,
    transparent 96deg, rgba(255, 235, 130, 0.18) 100deg, transparent 104deg,
    transparent 120deg, rgba(255, 220, 90, 0.15) 124deg, transparent 128deg,
    transparent 144deg, rgba(255, 245, 160, 0.18) 148deg, transparent 152deg,
    transparent 168deg, rgba(255, 215, 80, 0.15) 172deg, transparent 176deg,
    transparent 192deg, rgba(255, 230, 120, 0.18) 196deg, transparent 200deg,
    transparent 216deg, rgba(255, 210, 70, 0.14) 220deg, transparent 224deg,
    transparent 240deg, rgba(255, 240, 150, 0.18) 244deg, transparent 248deg,
    transparent 264deg, rgba(255, 220, 90, 0.15) 268deg, transparent 272deg,
    transparent 288deg, rgba(255, 245, 160, 0.18) 292deg, transparent 296deg,
    transparent 312deg, rgba(255, 215, 80, 0.15) 316deg, transparent 320deg,
    transparent 336deg, rgba(255, 235, 130, 0.18) 340deg, transparent 344deg,
    transparent 360deg
  );
  border-radius: 50%;
  opacity: 0;
  animation: dv-god-rays 1s ease-out 0.4s forwards;
  will-change: transform, opacity;
  mask: radial-gradient(circle, transparent 8%, black 25%, transparent 65%);
  -webkit-mask: radial-gradient(circle, transparent 8%, black 25%, transparent 65%);
}
@keyframes dv-god-rays {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(-50%, -50%, 0) rotate(20deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(80deg) scale(1.6);
    opacity: 0;
  }
}

/* 十字圣光爆发（阶段③）- 中心十字形光芒闪烁 */
.divine-cross-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  transform: translate(-50%, -50%) scale(0);
  animation: dv-cross-burst 0.7s ease-out 0.5s forwards;
  will-change: transform, opacity;
}
@keyframes dv-cross-burst {
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
.divine-cross-h {
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
.divine-cross-v {
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

/* 圣粒飞升 - 金色光粒从地面向上飘升 */
.divine-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  width: var(--dv-size, 6px);
  height: var(--dv-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 220, 0.95) 0%,
    rgba(255, 215, 80, 0.7) 45%,
    rgba(255, 180, 30, 0.3) 100%
  );
  box-shadow: 0 0 8px rgba(255, 210, 60, 0.5);
  transform: translate3d(
    calc(-50% + var(--dv-start-x, 0px)),
    calc(-50% + var(--dv-start-y, 0px)),
    0
  ) scale(0);
  animation: dv-particle 1.4s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes dv-particle {
  0% {
    transform: translate3d(
      calc(-50% + var(--dv-start-x, 0px)),
      calc(-50% + var(--dv-start-y, 0px)),
      0
    ) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(
      calc(-50% + var(--dv-start-x, 0px)),
      calc(-50% + var(--dv-start-y, 0px)),
      0
    ) scale(1.2);
    opacity: 1;
  }
  80% {
    opacity: 0.5;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--dv-start-x, 0px) + var(--dv-drift-x, 0px)),
      calc(-50% + var(--dv-start-y, 0px) + var(--dv-rise-y, 0px)),
      0
    ) scale(0.2);
    opacity: 0;
  }
}

/* 圣羽光屑 - 向四周飘散的光芒碎片 */
.divine-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--dv-shard-size, 10px);
  height: var(--dv-shard-size, 10px);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 220, 0.9) 0%,
    rgba(255, 215, 80, 0.6) 50%,
    transparent 100%
  );
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  box-shadow: 0 0 6px rgba(255, 210, 60, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: dv-shard 1s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes dv-shard {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) scale(1.3) rotate(45deg);
    opacity: 1;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--dv-shard-tx, 0px)),
      calc(-50% + var(--dv-shard-ty, 0px)),
      0
    ) scale(0.2) rotate(180deg);
    opacity: 0;
  }
}

/* 神圣脉冲 - 中心持续脉动的圣光球 */
.divine-pulse {
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
  animation: dv-pulse 1.2s ease-out 0.4s forwards;
  will-change: transform, opacity;
  filter: blur(4px);
}
@keyframes dv-pulse {
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

/* ---------- 阶段④：神圣十字闪烁（1.2s ~ 2.0s）---------- */

/* 神圣十字闪烁 - 巨大十字光芒多次闪烁，领域终结之光
   从1.2s开始，通过多次opacity脉冲实现闪烁效果 */
.divine-cross-final {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  transform: translate(-50%, -50%) scale(0);
  animation: dv-cross-final 0.8s ease-out 1.2s forwards;
  will-change: transform, opacity;
}
@keyframes dv-cross-final {
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
.divine-cross-final-h {
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
.divine-cross-final-v {
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
.divine-cross-final-glow {
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
.divine-cross-final-ring {
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
  animation: dv-cross-ring 0.8s ease-out 1.2s forwards;
  will-change: transform, opacity;
}
@keyframes dv-cross-ring {
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

/* ---------- 阶段⑤：渐隐消散（2.0s ~ 4.0s）---------- */

/* 圣域余辉 - 最终残留的金色光晕，缓慢消散 */
.divine-afterglow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 210, 80, 0.2) 0%,
    rgba(255, 180, 30, 0.1) 40%,
    transparent 70%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: dv-afterglow 2s ease-out 1.2s forwards;
  will-change: transform, opacity;
}
@keyframes dv-afterglow {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 0.6;
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
  .divine-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
