<!--
  @file ElementCollapseEffect.vue
  @generated 2026-08-12
  @description 元素崩坏 - 引发元素失衡对范围内敌人造成毁灭性全元素伤害（AOE攻击特效）
  四阶段叙事：元素紊乱 → 元素碰撞 → 崩坏爆发 → 元素消散
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  色彩方案：火红(#FF4444) + 水蓝(#4488FF) + 风绿(#44FF88) + 岩棕(#CC8844) + 雷黄(#FFEE44)
-->
<template>
  <!-- 暗幕：元素失衡笼罩战场 -->
  <div class="ec-dim"></div>

  <!-- ===== 阶段一：元素紊乱（0s ~ 0.4s）===== -->
  <!-- 五色法阵：五元素地面法阵展开 -->
  <div class="ec-ground-circle">
    <div class="ec-gc-pentagon"></div>
    <div class="ec-gc-ring ec-gc-fire"></div>
    <div class="ec-gc-ring ec-gc-water"></div>
    <div class="ec-gc-ring ec-gc-wind"></div>
    <div class="ec-gc-ring ec-gc-earth"></div>
    <div class="ec-gc-ring ec-gc-thunder"></div>
  </div>

  <!-- 紊乱粒子：五色粒子混乱交叉飞行 -->
  <div
    v-for="i in 20"
    :key="'ec-chaos-' + i"
    class="ec-chaos-particle"
    :style="getChaosStyle(i)"
  ></div>

  <!-- ===== 阶段二：元素碰撞（0.4s ~ 0.75s）===== -->
  <!-- 元素旋涡：五色能量向中心螺旋汇聚 -->
  <div class="ec-vortex">
    <div class="ec-vortex-ring vr-fire"></div>
    <div class="ec-vortex-ring vr-water"></div>
    <div class="ec-vortex-ring vr-wind"></div>
    <div class="ec-vortex-ring vr-earth"></div>
    <div class="ec-vortex-ring vr-thunder"></div>
  </div>

  <!-- 碰撞核心：五色能量碰撞的白热核心 -->
  <div class="ec-collide-core"></div>

  <!-- ===== 阶段三：崩坏爆发（0.75s ~ 1.6s）===== -->
  <!-- 崩坏闪光：全元素爆发的白色爆闪 -->
  <div class="ec-blast-flash"></div>

  <!-- 五色冲击波：各元素冲击波从中心向外扩散 -->
  <div class="ec-shockwave ec-sw-fire"></div>
  <div class="ec-shockwave ec-sw-water"></div>
  <div class="ec-shockwave ec-sw-wind"></div>

  <!-- 元素碎片：五色碎片向外飞射 -->
  <div
    v-for="i in 20"
    :key="'ec-shard-' + i"
    class="ec-element-shard"
    :style="getShardStyle(i)"
  ></div>

  <!-- 元素裂纹：从中心向外蔓延的五色裂纹 -->
  <div
    v-for="i in 8"
    :key="'ec-crack-' + i"
    class="ec-crack"
    :style="getCrackStyle(i)"
  ></div>

  <!-- ===== 阶段四：元素消散（1.6s ~ 2.2s）===== -->
  <!-- 消散光雾：五色光雾缓慢消散 -->
  <div class="ec-dissipate-mist">
    <div class="ec-mist-layer mist-fire"></div>
    <div class="ec-mist-layer mist-water"></div>
    <div class="ec-mist-layer mist-wind"></div>
  </div>
</template>

<script setup>
/**
 * 元素崩坏 - 引发元素失衡对范围内敌人造成毁灭性全元素伤害（AOE攻击特效）
 * 四阶段叙事：元素紊乱 → 元素碰撞 → 崩坏爆发 → 元素消散
 * 以五元素色彩（火红、水蓝、风绿、岩棕、雷黄）为主色调，展现元素从紊乱到崩坏爆发的完整视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 */

defineOptions({
  inheritAttrs: false
})

/** 五元素颜色配置 */
const ELEMENT_COLORS = [
  { name: 'fire', color: 'rgba(255, 68, 68, 0.9)', glow: 'rgba(255, 68, 68, 0.5)' },
  { name: 'water', color: 'rgba(68, 136, 255, 0.9)', glow: 'rgba(68, 136, 255, 0.5)' },
  { name: 'wind', color: 'rgba(68, 255, 136, 0.9)', glow: 'rgba(68, 255, 136, 0.5)' },
  { name: 'earth', color: 'rgba(204, 136, 68, 0.9)', glow: 'rgba(204, 136, 68, 0.5)' },
  { name: 'thunder', color: 'rgba(255, 238, 68, 0.9)', glow: 'rgba(255, 238, 68, 0.5)' }
]

/**
 * 计算紊乱粒子的样式
 * @param {number} index - 粒子索引（1~20）
 * @returns {Object} CSS自定义属性对象
 */
function getChaosStyle (index) {
  const element = ELEMENT_COLORS[(index - 1) % 5]
  const angle = (index - 1) * 18 + (index % 3) * 5
  const distance = 80 + (index % 5) * 16
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.015
  return {
    '--ec-chaos-angle': `${angle}deg`,
    '--ec-chaos-distance': `${distance}px`,
    '--ec-chaos-color': element.color,
    '--ec-chaos-glow': element.glow,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算元素碎片的飞射样式
 * @param {number} index - 碎片索引（1~20）
 * @returns {Object} CSS自定义属性对象
 */
function getShardStyle (index) {
  const element = ELEMENT_COLORS[(index - 1) % 5]
  const angle = (index - 1) * 18 + (index % 2) * 4
  const distance = 140 + (index % 5) * 20
  const size = 5 + (index % 4) * 3
  const delay = (index % 4) * 0.03
  return {
    '--ec-shard-angle': `${angle}deg`,
    '--ec-shard-distance': `${distance}px`,
    '--ec-shard-color': element.color,
    '--ec-shard-glow': element.glow,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算元素裂纹的方向样式
 * @param {number} index - 裂纹索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getCrackStyle (index) {
  const element = ELEMENT_COLORS[(index - 1) % 5]
  const angle = (index - 1) * 45
  return {
    '--ec-crack-angle': `${angle}deg`,
    '--ec-crack-color': element.color
  }
}
</script>

<style scoped>
/* ================================================================
   元素崩坏 (arcane_master_e) - AOE攻击特效
   技能描述：引发元素失衡对范围内敌人造成毁灭性全元素伤害
   色彩方案：火红(#FF4444) + 水蓝(#4488FF) + 风绿(#44FF88) + 岩棕(#CC8844) + 雷黄(#FFEE44)
   GPU加速：contain隔离 + will-change + translate3d
   ================================================================ */

/* 暗幕 - 元素失衡笼罩战场 */
.ec-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center 55%,
    rgba(20, 10, 5, 0.55) 0%,
    rgba(15, 10, 20, 0.3) 40%,
    rgba(10, 5, 15, 0.12) 75%,
    transparent 100%
  );
  animation: ecDim 2.2s ease-out forwards;
  will-change: opacity;
}

@keyframes ecDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  60% { opacity: 0.65; }
  100% { opacity: 0; }
}

/* ===== 阶段一：元素紊乱（0s ~ 0.4s）===== */

/* 五色法阵 - 五元素地面法阵展开 */
.ec-ground-circle {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 180px;
  height: 180px;
  transform: translate(-50%, -50%) rotateX(75deg) scale(0);
  opacity: 0;
  animation: ecGroundCircle 0.4s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes ecGroundCircle {
  0% { transform: translate(-50%, -50%) rotateX(75deg) scale(0); opacity: 0; }
  40% { transform: translate(-50%, -50%) rotateX(75deg) scale(1.1); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) rotateX(75deg) scale(1); opacity: 0.6; }
}

/* 五芒星底纹 */
.ec-gc-pentagon {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(255, 68, 68, 0.12) 0deg,
    rgba(68, 136, 255, 0.12) 72deg,
    rgba(68, 255, 136, 0.12) 144deg,
    rgba(204, 136, 68, 0.12) 216deg,
    rgba(255, 238, 68, 0.12) 288deg,
    rgba(255, 68, 68, 0.12) 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 30%, black 40%, black 90%, transparent 100%);
  mask: radial-gradient(circle, transparent 30%, black 40%, black 90%, transparent 100%);
}

/* 五元素环 */
.ec-gc-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid;
  will-change: transform, opacity;
}

.ec-gc-fire {
  border-color: rgba(255, 68, 68, 0.4);
  box-shadow: 0 0 8px rgba(255, 68, 68, 0.2);
  animation: ecSpinCW 3s linear infinite;
}

.ec-gc-water {
  inset: 15%;
  border-color: rgba(68, 136, 255, 0.4);
  box-shadow: 0 0 8px rgba(68, 136, 255, 0.2);
  animation: ecSpinCCW 2.5s linear infinite;
}

.ec-gc-wind {
  inset: 30%;
  border-color: rgba(68, 255, 136, 0.4);
  box-shadow: 0 0 8px rgba(68, 255, 136, 0.2);
  animation: ecSpinCW 2s linear infinite;
}

.ec-gc-earth {
  inset: 45%;
  border-color: rgba(204, 136, 68, 0.4);
  box-shadow: 0 0 6px rgba(204, 136, 68, 0.2);
  animation: ecSpinCCW 1.5s linear infinite;
}

.ec-gc-thunder {
  inset: 55%;
  border-color: rgba(255, 238, 68, 0.4);
  box-shadow: 0 0 6px rgba(255, 238, 68, 0.2);
  animation: ecSpinCW 1s linear infinite;
}

@keyframes ecSpinCW {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes ecSpinCCW {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

/* 紊乱粒子 - 五色粒子混乱交叉飞行 */
.ec-chaos-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--ec-chaos-color, rgba(255, 255, 255, 0.9)), transparent 100%);
  box-shadow: 0 0 5px var(--ec-chaos-glow, rgba(255, 255, 255, 0.3));
  transform: translate(-50%, -50%) rotate(var(--ec-chaos-angle, 0deg)) translateX(var(--ec-chaos-distance, 80px)) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: ecChaosFly 0.4s ease-out forwards;
}

@keyframes ecChaosFly {
  0% {
    transform: translate(-50%, -50%) rotate(var(--ec-chaos-angle, 0deg)) translateX(var(--ec-chaos-distance, 80px)) scale(0);
    opacity: 0;
  }
  30% { opacity: 0.8; transform: translate(-50%, -50%) rotate(var(--ec-chaos-angle, 0deg)) translateX(calc(var(--ec-chaos-distance, 80px) * 0.6)) scale(1); }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--ec-chaos-angle, 0deg) + 90deg)) translateX(calc(var(--ec-chaos-distance, 80px) * 0.3)) scale(0.3);
    opacity: 0;
  }
}

/* ===== 阶段二：元素碰撞（0.4s ~ 0.75s）===== */

/* 元素旋涡 - 五色能量向中心螺旋汇聚 */
.ec-vortex {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100px;
  height: 100px;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  animation: ecVortexContainer 0.35s ease-in 0.4s forwards;
  will-change: transform, opacity;
}

@keyframes ecVortexContainer {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  40% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(0.4); opacity: 0.9; }
}

.ec-vortex-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid;
  will-change: transform;
}

.vr-fire {
  border-color: rgba(255, 68, 68, 0.6);
  box-shadow: 0 0 8px rgba(255, 68, 68, 0.3);
  animation: ecSpinCW 0.3s linear infinite;
}

.vr-water {
  inset: 15%;
  border-color: rgba(68, 136, 255, 0.6);
  box-shadow: 0 0 8px rgba(68, 136, 255, 0.3);
  animation: ecSpinCCW 0.25s linear infinite;
}

.vr-wind {
  inset: 30%;
  border-color: rgba(68, 255, 136, 0.6);
  box-shadow: 0 0 6px rgba(68, 255, 136, 0.3);
  animation: ecSpinCW 0.2s linear infinite;
}

.vr-earth {
  inset: 45%;
  border-color: rgba(204, 136, 68, 0.6);
  box-shadow: 0 0 6px rgba(204, 136, 68, 0.3);
  animation: ecSpinCCW 0.15s linear infinite;
}

.vr-thunder {
  inset: 55%;
  border-color: rgba(255, 238, 68, 0.7);
  box-shadow: 0 0 6px rgba(255, 238, 68, 0.4);
  animation: ecSpinCW 0.1s linear infinite;
}

/* 碰撞核心 - 五色能量碰撞的白热核心 */
.ec-collide-core {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 238, 68, 0.9) 20%,
    rgba(255, 68, 68, 0.7) 40%,
    rgba(68, 136, 255, 0.5) 60%,
    transparent 100%
  );
  box-shadow:
    0 0 15px rgba(255, 255, 255, 0.9),
    0 0 30px rgba(255, 238, 68, 0.6),
    0 0 45px rgba(255, 68, 68, 0.3);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  animation: ecCollideCore 0.35s ease-in 0.4s forwards;
  will-change: transform, opacity;
}

@keyframes ecCollideCore {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
}

/* ===== 阶段三：崩坏爆发（0.75s ~ 1.6s）===== */

/* 崩坏闪光 - 全元素爆发的白色爆闪 */
.ec-blast-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center 55%,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(255, 238, 68, 0.4) 10%,
    rgba(255, 68, 68, 0.2) 20%,
    rgba(68, 136, 255, 0.1) 35%,
    transparent 60%
  );
  opacity: 0;
  animation: ecBlastFlash 0.5s ease-out 0.75s forwards;
  will-change: opacity;
}

@keyframes ecBlastFlash {
  0%, 100% { opacity: 0; }
  5% { opacity: 1; }
  15% { opacity: 0.5; }
  40% { opacity: 0.2; }
}

/* 五色冲击波 - 各元素冲击波从中心向外扩散 */
.ec-shockwave {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.ec-sw-fire {
  border-color: rgba(255, 68, 68, 0.7);
  box-shadow: 0 0 15px rgba(255, 68, 68, 0.5);
  animation: ecShockwave 0.9s cubic-bezier(0.05, 0.9, 0.25, 1) 0.75s forwards;
}

.ec-sw-water {
  border-color: rgba(68, 136, 255, 0.6);
  box-shadow: 0 0 15px rgba(68, 136, 255, 0.5);
  animation: ecShockwave 1s cubic-bezier(0.05, 0.9, 0.25, 1) 0.85s forwards;
}

.ec-sw-wind {
  border-color: rgba(68, 255, 136, 0.5);
  box-shadow: 0 0 12px rgba(68, 255, 136, 0.4);
  animation: ecShockwave 1.1s cubic-bezier(0.05, 0.9, 0.25, 1) 0.95s forwards;
}

@keyframes ecShockwave {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  8% { opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(16); opacity: 0; }
}

/* 元素碎片 - 五色碎片向外飞射 */
.ec-element-shard {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 30%;
  background: radial-gradient(circle at 30% 30%, var(--ec-shard-color, rgba(255, 255, 255, 0.9)), transparent 100%);
  box-shadow: 0 0 6px var(--ec-shard-glow, rgba(255, 255, 255, 0.3));
  transform: translate(-50%, -50%) rotate(var(--ec-shard-angle, 0deg)) translateX(0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: ecShardFly 0.9s ease-out 0.75s forwards;
}

@keyframes ecShardFly {
  0% {
    transform: translate(-50%, -50%) rotate(var(--ec-shard-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--ec-shard-angle, 0deg)) translateX(calc(var(--ec-shard-distance, 140px) * 0.15)) scale(1.3);
  }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--ec-shard-angle, 0deg) + 144deg)) translateX(var(--ec-shard-distance, 140px)) scale(0.2);
    opacity: 0;
  }
}

/* 元素裂纹 - 从中心向外蔓延的五色裂纹 */
.ec-crack {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg,
    var(--ec-crack-color, rgba(255, 255, 255, 0.6)) 0%,
    transparent 100%
  );
  box-shadow: 0 0 4px var(--ec-crack-color, rgba(255, 255, 255, 0.3));
  transform: translate(-50%, -50%) rotate(var(--ec-crack-angle, 0deg)) translateX(0) scaleX(0);
  transform-origin: 0 50%;
  opacity: 0;
  will-change: transform, opacity;
  animation: ecCrackSpread 0.6s ease-out 0.75s forwards;
}

@keyframes ecCrackSpread {
  0% { transform: translate(-50%, -50%) rotate(var(--ec-crack-angle, 0deg)) translateX(0) scaleX(0); opacity: 0; }
  20% { opacity: 0.8; }
  100% { transform: translate(-50%, -50%) rotate(var(--ec-crack-angle, 0deg)) translateX(0) scaleX(1); opacity: 0; }
}

/* ===== 阶段四：元素消散（1.6s ~ 2.2s）===== */

/* 消散光雾 - 五色光雾缓慢消散 */
.ec-dissipate-mist {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 200px;
  height: 200px;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  animation: ecMistContainer 0.6s ease-out 1.6s forwards;
  will-change: transform, opacity;
}

@keyframes ecMistContainer {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  30% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
  100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
}

.ec-mist-layer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  filter: blur(8px);
  will-change: transform, opacity;
}

.mist-fire {
  background: radial-gradient(circle, rgba(255, 68, 68, 0.15) 0%, transparent 70%);
  animation: ecSpinCW 2s linear infinite;
}

.mist-water {
  background: radial-gradient(circle, rgba(68, 136, 255, 0.12) 0%, transparent 70%);
  animation: ecSpinCCW 2.5s linear infinite;
}

.mist-wind {
  background: radial-gradient(circle, rgba(68, 255, 136, 0.1) 0%, transparent 70%);
  animation: ecSpinCW 3s linear infinite;
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .ec-dim, .ec-ground-circle, .ec-chaos-particle, .ec-vortex,
  .ec-collide-core, .ec-blast-flash, .ec-shockwave,
  .ec-element-shard, .ec-crack, .ec-dissipate-mist {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
