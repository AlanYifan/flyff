<!--
  @file HolyJudgmentEffect.vue
  @generated 2026-07-29
  @description 圣光审判 - 天降审判·圣印封刻·虚弱锁链·审判消散
  炽天使E技能（nature_messenger_e）：以圣光之力审判单体敌人，造成神圣伤害并施加虚弱印记
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + translateZ深度分层
  动画总时长：2.0秒（单体DEBUFF，覆盖目标区域）
    ⓪ 天降审判（0s ~ 0.5s）- 审判光柱从天而降 + 全屏圣光闪 + 审判之剑凝聚
    ① 圣印封刻（0.3s ~ 1.0s）- 审判法阵展开 + 虚弱印记烙刻 + 圣光锁链
    ② 审判爆发（0.6s ~ 1.4s）- 审判光爆 + 神圣碎片飞溅 + 虚弱紫雾扩散
    ③ 审判消散（1.2s ~ 2.0s）- 印记残光 + 余韵消散
  色彩方案：审判金(#FFD700) + 圣光白(#FFFEF0) + 虚弱紫(#9370DB) + 暖光(#FFF8DC)
-->
<template>
  <!-- 3D舞台 - 透视容器，为审判降临提供3D空间深度 -->
  <div class="hj-3d-stage">
    <!-- ===== 阶段⓪：天降审判 ===== -->
    <!-- 审判暗幕 - 金紫色暗光笼罩，营造审判降临的庄严氛围 -->
    <div class="hj-dim"></div>

    <!-- 审判全屏闪光 - 光柱降临瞬间的金白色爆闪 -->
    <div class="hj-flash"></div>

    <!-- 审判光柱 - 从天而降的金色审判之光 -->
    <div class="hj-beam">
      <div class="hj-beam-core"></div>
      <div class="hj-beam-glow"></div>
    </div>

    <!-- 审判之剑 - 凝聚的圣光审判之剑从天降下 -->
    <div class="hj-sword">
      <div class="hj-sword-blade"></div>
      <div class="hj-sword-hilt"></div>
      <div class="hj-sword-glow"></div>
    </div>

    <!-- ===== 阶段①：圣印封刻 ===== -->
    <!-- 审判法阵 - 地面展开的旋转审判法阵 -->
    <div class="hj-ground-plane">
      <div class="hj-seal">
        <div class="hj-seal-outer"></div>
        <div class="hj-seal-mid"></div>
        <div class="hj-seal-inner"></div>
      </div>

      <!-- 虚弱印记 - 紫色虚弱印记烙刻在目标身上 -->
      <div class="hj-weakness-mark">
        <div class="hj-weakness-ring"></div>
        <div class="hj-weakness-rune"></div>
      </div>

      <!-- 圣光锁链 - 从法阵升起的锁链光纹 -->
      <div class="hj-chain chain-1"></div>
      <div class="hj-chain chain-2"></div>
      <div class="hj-chain chain-3"></div>
      <div class="hj-chain chain-4"></div>
    </div>

    <!-- ===== 阶段②：审判爆发 ===== -->
    <!-- 审判光爆 - 中心爆发的金色光球 -->
    <div class="hj-burst"></div>

    <!-- 神圣碎片 - 从中心向外飞溅的金紫碎片 -->
    <div
      v-for="i in 14"
      :key="'hj-shard-' + i"
      class="hj-shard"
      :style="getShardStyle(i)"
    ></div>

    <!-- 虚弱紫雾 - 从印记扩散的紫色虚弱雾气 -->
    <div
      v-for="i in 8"
      :key="'hj-mist-' + i"
      class="hj-mist"
      :style="getMistStyle(i)"
    ></div>

    <!-- 审判冲击波环 - 从中心向外扩散的金色光环 -->
    <div class="hj-shockwave sw-1"></div>
    <div class="hj-shockwave sw-2"></div>

    <!-- ===== 阶段③：审判消散 ===== -->
    <!-- 印记残光 - 虚弱印记的残留紫色光芒 -->
    <div class="hj-lingering-mark"></div>

    <!-- 审判余韵 - 最终残留的金紫光晕消散 -->
    <div class="hj-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 圣光审判 - 天降审判·圣印封刻·虚弱锁链·审判消散
 * 炽天使E技能（nature_messenger_e）单体DEBUFF特效组件
 * 以圣光之力审判单体敌人，造成神圣伤害并施加虚弱印记
 * 以审判金和虚弱紫为主色调，展现圣光审判降临与虚弱印记烙刻的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 * 动画总时长2.0秒
 */

/**
 * 计算神圣碎片的飞溅样式
 * 每个碎片从审判爆发中心向外飞溅，颜色交替使用金色和紫色
 * @param {number} index - 碎片索引（1~14）
 * @returns {Object} CSS自定义属性对象
 */
function getShardStyle (index) {
  const angle = (index - 1) * 25.7 + (index % 2) * 9
  const rad = (angle * Math.PI) / 180
  const distance = 60 + (index % 5) * 22
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance * 0.5 - 10 - (index % 3) * 8
  const size = 6 + (index % 4) * 4
  const delay = 0.65 + (index % 5) * 0.03
  const colorType = index % 2
  const colors = [
    { color: 'rgba(255, 215, 0, 0.9)', glow: 'rgba(255, 215, 0, 0.6)' },
    { color: 'rgba(147, 112, 219, 0.85)', glow: 'rgba(147, 112, 219, 0.5)' }
  ]
  const c = colors[colorType]
  return {
    '--hj-shard-tx': `${tx}px`,
    '--hj-shard-ty': `${ty}px`,
    '--hj-shard-size': `${size}px`,
    '--hj-shard-color': c.color,
    '--hj-shard-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算虚弱紫雾的扩散样式
 * 每个雾气从印记中心向四周扩散，模拟虚弱效果蔓延
 * @param {number} index - 雾气索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getMistStyle (index) {
  const angle = (index - 1) * 45 + (index % 2) * 12
  const rad = (angle * Math.PI) / 180
  const distance = 40 + (index % 3) * 18
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance * 0.4
  const size = 20 + (index % 3) * 12
  const delay = 0.8 + (index % 4) * 0.06
  return {
    '--hj-mist-tx': `${tx}px`,
    '--hj-mist-ty': `${ty}px`,
    '--hj-mist-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   圣光审判 (nature_messenger_e) - 天降审判·圣印封刻·虚弱锁链·审判消散
   技能描述：以圣光之力审判单体敌人，造成神圣伤害并施加虚弱印记
   色彩方案：审判金(#FFD700) + 圣光白(#FFFEF0) + 虚弱紫(#9370DB) + 暖光(#FFF8DC)
   GPU加速：contain隔离 + will-change + translate3d
   动画总时长：2.0秒
   ================================================================ */

/* 3D舞台 - 透视容器 */
.hj-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1000px;
  perspective-origin: 50% 50%;
  transform-style: preserve-3d;
  contain: layout style;
  pointer-events: none;
}

/* ---------- 阶段⓪：天降审判（0s ~ 0.5s）---------- */

/* 审判暗幕 - 金紫色暗光笼罩 */
.hj-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(50, 35, 10, 0.5) 0%,
    rgba(35, 20, 40, 0.3) 45%,
    transparent 100%
  );
  animation: hj-dim 2s ease-out forwards;
  will-change: opacity;
}

@keyframes hj-dim {
  0%   { opacity: 0; }
  10%  { opacity: 1; }
  50%  { opacity: 0.6; }
  100% { opacity: 0; }
}

/* 审判全屏闪光 */
.hj-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 45%,
    rgba(255, 250, 220, 0.9) 0%,
    rgba(255, 220, 120, 0.5) 25%,
    rgba(147, 112, 219, 0.2) 55%,
    transparent 80%
  );
  opacity: 0;
  animation: hj-flash 0.8s ease-out forwards;
  will-change: opacity;
}

@keyframes hj-flash {
  0%, 100% { opacity: 0; }
  5%  { opacity: 1; }
  12% { opacity: 0.3; }
  20% { opacity: 0.8; }
  40% { opacity: 0.2; }
  80% { opacity: 0; }
}

/* 审判光柱 - 从天而降的金色审判之光 */
.hj-beam {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50px;
  height: 100%;
  transform: translateX(-50%);
  animation: hj-beam 0.8s ease-out forwards;
  will-change: opacity, transform;
}

@keyframes hj-beam {
  0% {
    transform: translateX(-50%) scaleY(0);
    transform-origin: top center;
    opacity: 0;
  }
  20% {
    transform: translateX(-50%) scaleY(1);
    opacity: 1;
  }
  60% {
    transform: translateX(-50%) scaleY(1);
    opacity: 0.5;
  }
  100% {
    transform: translateX(-50%) scaleY(1);
    opacity: 0;
  }
}

.hj-beam-core {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 240, 1) 0%,
    rgba(255, 235, 160, 0.95) 20%,
    rgba(255, 210, 80, 0.8) 50%,
    rgba(147, 112, 219, 0.4) 85%,
    transparent 100%
  );
  border-radius: 50% 50% 20% 20%;
  box-shadow:
    0 0 25px rgba(255, 220, 100, 0.9),
    0 0 50px rgba(255, 190, 50, 0.5);
}

.hj-beam-glow {
  position: absolute;
  inset: -25px -50px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 220, 100, 0.3) 0%,
    rgba(147, 112, 219, 0.15) 40%,
    transparent 70%
  );
  filter: blur(10px);
}

/* 审判之剑 - 凝聚的圣光审判之剑 */
.hj-sword {
  position: absolute;
  top: 0;
  left: 50%;
  width: 30px;
  height: 140px;
  transform: translate3d(-50%, -100%, 0) scale(0);
  transform-origin: 50% 100%;
  animation: hj-sword-descend 0.5s cubic-bezier(0.3, 0, 0.85, 0.4) 0.1s forwards;
  will-change: transform, opacity;
}

@keyframes hj-sword-descend {
  0% {
    transform: translate3d(-50%, -100%, 0) scale(0.5) rotate(-10deg);
    opacity: 0;
  }
  30% {
    transform: translate3d(-50%, -80%, 0) scale(1) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, 50%, 0) scale(1.1) rotate(5deg);
    opacity: 0;
  }
}

/* 审判之剑剑身 */
.hj-sword-blade {
  position: absolute;
  top: 0;
  left: 50%;
  width: 14px;
  height: 100px;
  transform: translateX(-50%);
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 248, 220, 0.9) 30%,
    rgba(255, 215, 0, 0.75) 70%,
    rgba(255, 180, 30, 0.4) 100%
  );
  clip-path: polygon(50% 0%, 100% 15%, 80% 100%, 20% 100%, 0% 15%);
  box-shadow:
    0 0 20px rgba(255, 215, 0, 0.8),
    0 0 40px rgba(255, 200, 50, 0.4);
}

/* 审判之剑剑柄 */
.hj-sword-hilt {
  position: absolute;
  top: 95px;
  left: 50%;
  width: 30px;
  height: 8px;
  transform: translateX(-50%);
  background: linear-gradient(
    to right,
    rgba(255, 215, 0, 0.8) 0%,
    rgba(255, 248, 220, 1) 50%,
    rgba(255, 215, 0, 0.8) 100%
  );
  border-radius: 4px;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
}

/* 审判之剑光晕 */
.hj-sword-glow {
  position: absolute;
  top: -10px;
  left: 50%;
  width: 60px;
  height: 160px;
  transform: translateX(-50%);
  background: radial-gradient(
    ellipse at center,
    rgba(255, 215, 0, 0.3) 0%,
    rgba(255, 248, 220, 0.15) 40%,
    transparent 70%
  );
  filter: blur(6px);
}

/* ---------- 阶段①：圣印封刻（0.3s ~ 1.0s）---------- */

/* 地面层 - 3D倾斜平面 */
.hj-ground-plane {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%) rotateX(72deg);
  transform-style: preserve-3d;
}

/* 审判法阵 - 地面展开的旋转审判法阵 */
.hj-seal {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  transform: translate(-50%, -50%) scale(0);
  animation: hj-seal-appear 0.4s ease-out 0.3s forwards,
             hj-seal-fade 0.5s ease-out 1.2s forwards;
  will-change: transform, opacity;
}

@keyframes hj-seal-appear {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  60% {
    transform: translate(-50%, -50%) scale(1.15) rotate(30deg);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1) rotate(45deg);
    opacity: 0.9;
  }
}

@keyframes hj-seal-fade {
  0% { opacity: 0.9; }
  100% { opacity: 0; }
}

.hj-seal-outer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid rgba(255, 215, 0, 0.8);
  box-shadow:
    0 0 20px rgba(255, 200, 50, 0.6),
    inset 0 0 20px rgba(147, 112, 219, 0.2);
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 220, 100, 0.18) 3deg,
    transparent 6deg,
    transparent 15deg
  );
  animation: hj-spin-cw 2.5s linear 0.3s infinite;
  will-change: transform;
}

.hj-seal-mid {
  position: absolute;
  inset: 18%;
  border-radius: 50%;
  border: 2px solid rgba(147, 112, 219, 0.6);
  box-shadow:
    0 0 15px rgba(147, 112, 219, 0.4),
    inset 0 0 12px rgba(255, 215, 0, 0.2);
  animation: hj-spin-ccw 2s linear 0.3s infinite;
  will-change: transform;
}

.hj-seal-inner {
  position: absolute;
  inset: 35%;
  border-radius: 50%;
  border: 1px solid rgba(255, 245, 180, 0.5);
  box-shadow: 0 0 10px rgba(255, 230, 100, 0.3);
  animation: hj-spin-cw 1.5s linear 0.3s infinite;
  will-change: transform;
}

@keyframes hj-spin-cw {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes hj-spin-ccw {
  from { transform: rotate(360deg); }
  to   { transform: rotate(0deg); }
}

/* 虚弱印记 - 紫色虚弱印记烙刻在目标身上 */
.hj-weakness-mark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  transform: translate(-50%, -50%) scale(0);
  animation: hj-weakness-appear 0.3s ease-out 0.5s forwards,
             hj-weakness-pulse 0.8s ease-in-out 0.8s forwards;
  will-change: transform, opacity;
}

@keyframes hj-weakness-appear {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  60% {
    transform: translate(-50%, -50%) scale(1.3) rotate(15deg);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
    opacity: 0.9;
  }
}

@keyframes hj-weakness-pulse {
  0% { opacity: 0.9; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.3); }
}

.hj-weakness-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(147, 112, 219, 0.8);
  box-shadow:
    0 0 15px rgba(147, 112, 219, 0.6),
    inset 0 0 12px rgba(147, 112, 219, 0.3);
}

.hj-weakness-rune {
  position: absolute;
  inset: 20%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(147, 112, 219, 0.3) 45deg,
    transparent 90deg,
    rgba(147, 112, 219, 0.3) 225deg,
    transparent 270deg,
    transparent 360deg
  );
  animation: hj-spin-cw 2s linear 0.5s infinite;
}

/* 圣光锁链 - 从法阵升起的锁链光纹 */
.hj-chain {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 60px;
  background: linear-gradient(
    to top,
    rgba(255, 215, 0, 0.8) 0%,
    rgba(255, 248, 220, 0.4) 50%,
    transparent 100%
  );
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
  transform-origin: bottom center;
  transform: translate(-50%, -100%) rotate(var(--hj-chain-angle, 0deg)) scaleY(0);
  opacity: 0;
  animation: hj-chain-rise 0.5s ease-out 0.4s forwards;
  will-change: transform, opacity;
}

.hj-chain.chain-1 { --hj-chain-angle: 0deg; }
.hj-chain.chain-2 { --hj-chain-angle: 90deg; animation-delay: 0.42s; }
.hj-chain.chain-3 { --hj-chain-angle: 180deg; animation-delay: 0.44s; }
.hj-chain.chain-4 { --hj-chain-angle: 270deg; animation-delay: 0.46s; }

@keyframes hj-chain-rise {
  0% {
    transform: translate(-50%, -100%) rotate(var(--hj-chain-angle, 0deg)) scaleY(0);
    opacity: 0;
  }
  40% { opacity: 1; }
  100% {
    transform: translate(-50%, -100%) rotate(var(--hj-chain-angle, 0deg)) scaleY(1);
    opacity: 0.3;
  }
}

/* ---------- 阶段②：审判爆发（0.6s ~ 1.4s）---------- */

/* 审判光爆 - 中心爆发的金紫光球 */
.hj-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 240, 1) 0%,
    rgba(255, 248, 220, 0.8) 18%,
    rgba(255, 215, 0, 0.6) 42%,
    rgba(147, 112, 219, 0.35) 68%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: hj-burst 0.6s cubic-bezier(0.15, 0.6, 0.3, 1) 0.6s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}

@keyframes hj-burst {
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

/* 神圣碎片 - 从中心向外飞溅 */
.hj-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--hj-shard-size, 8px);
  height: var(--hj-shard-size, 8px);
  border-radius: 40% 60% 50% 40% / 55% 40% 60% 45%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(255, 255, 240, 0.9) 0%,
    var(--hj-shard-color, rgba(255, 215, 0, 0.75)) 50%,
    transparent 100%
  );
  box-shadow: 0 0 6px var(--hj-shard-glow, rgba(255, 215, 0, 0.6));
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  backface-visibility: hidden;
  animation: hj-shard-scatter 0.7s cubic-bezier(0.2, 0.5, 0.4, 1) forwards;
  will-change: transform, opacity;
}

@keyframes hj-shard-scatter {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; }
  100% {
    transform: translate3d(
      calc(-50% + var(--hj-shard-tx, 0px)),
      calc(-50% + var(--hj-shard-ty, 0px)),
      0
    ) scale(0.3) rotate(200deg);
    opacity: 0;
  }
}

/* 虚弱紫雾 - 从印记扩散的紫色虚弱雾气 */
.hj-mist {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--hj-mist-size, 20px);
  height: var(--hj-mist-size, 20px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(147, 112, 219, 0.35) 0%,
    rgba(147, 112, 219, 0.15) 50%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: hj-mist-spread 0.8s ease-out forwards;
  will-change: transform, opacity;
  filter: blur(4px);
}

@keyframes hj-mist-spread {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.7;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--hj-mist-tx, 0px)),
      calc(-50% + var(--hj-mist-ty, 0px)),
      0
    ) scale(2);
    opacity: 0;
  }
}

/* 审判冲击波环 */
.hj-shockwave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid rgba(255, 215, 0, 0.8);
  box-shadow: 0 0 15px rgba(255, 200, 50, 0.5);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.hj-shockwave.sw-1 { animation: hj-shockwave 0.6s ease-out 0.65s forwards; }
.hj-shockwave.sw-2 {
  border-color: rgba(147, 112, 219, 0.6);
  animation: hj-shockwave 0.7s ease-out 0.72s forwards;
}

@keyframes hj-shockwave {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; }
  100% {
    transform: translate(-50%, -50%) scale(8);
    opacity: 0;
  }
}

/* ---------- 阶段③：审判消散（1.2s ~ 2.0s）---------- */

/* 印记残光 - 虚弱印记的残留紫色光芒 */
.hj-lingering-mark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(147, 112, 219, 0.2) 0%,
    rgba(147, 112, 219, 0.08) 50%,
    transparent 80%
  );
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  animation: hj-lingering 1s ease-out 1.2s forwards;
  will-change: transform, opacity;
}

@keyframes hj-lingering {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }
  20% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.8);
    opacity: 0;
  }
}

/* 审判余韵 - 最终残留的金紫光晕消散 */
.hj-afterglow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(255, 215, 0, 0.1) 0%,
    rgba(147, 112, 219, 0.06) 40%,
    transparent 75%
  );
  opacity: 0;
  animation: hj-afterglow 0.8s ease-out 1.2s forwards;
  will-change: opacity;
}

@keyframes hj-afterglow {
  0% { opacity: 0; }
  25% { opacity: 0.5; }
  100% { opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .hj-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
