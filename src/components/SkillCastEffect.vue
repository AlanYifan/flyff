<!--
  @file SkillCastEffect.vue
  @generated 2026-06-27
  @description 技能施法特效组件：环绕玩家头像边框播放元素施法动画
  根据技能元素属性（火/水/风/土/雷）显示不同边框环绕视觉效果，无属性默认播放风元素
  通过监听全局 window CustomEvent 'skill-cast-effect' 触发，事件 detail.element 携带元素类型
-->
<template>
  <div v-if="isActive" class="cast-effect-container" :class="`element-${currentElement}`">
    <!-- ========== 公共：边框能量光环（脉冲发光边框） ========== -->
    <div class="cast-border-glow"></div>
    <div class="cast-border-glow cast-border-glow-2"></div>

    <!-- ========== 公共：环绕轨道粒子（沿边框旋转的光点） ========== -->
    <div class="cast-orbit">
      <span v-for="i in 6" :key="`orbit-${i}`" class="orbit-particle" :style="getOrbitStyle(i)"></span>
    </div>
    <div class="cast-orbit cast-orbit-reverse">
      <span v-for="i in 4" :key="`orbit-r-${i}`" class="orbit-particle-sm" :style="getOrbitReverseStyle(i)"></span>
    </div>

    <!-- ========== 火：边框火焰舌（从边框向上窜出的火苗） ========== -->
    <template v-if="currentElement === 'fire'">
      <div class="fire-edges">
        <span v-for="i in 14" :key="`fire-${i}`" class="fire-tongue" :style="getFireEdgeStyle(i)"></span>
      </div>
    </template>

    <!-- ========== 水：边框水滴涟漪（从边框向外扩散的水波） ========== -->
    <template v-if="currentElement === 'water'">
      <div class="water-ring-1"></div>
      <div class="water-ring-2"></div>
      <div class="water-ring-3"></div>
      <div class="water-droplets">
        <span v-for="i in 10" :key="`water-${i}`" class="water-droplet" :style="getWaterEdgeStyle(i)"></span>
      </div>
    </template>

    <!-- ========== 风：边框旋转气流（沿边框螺旋旋转的风刃） ========== -->
    <template v-if="currentElement === 'wind'">
      <div class="wind-streams">
        <span v-for="i in 8" :key="`wind-${i}`" class="wind-stream" :style="getWindEdgeStyle(i)"></span>
      </div>
    </template>

    <!-- ========== 土：边框岩石尖刺（从边框向外突出的岩晶） ========== -->
    <template v-if="currentElement === 'earth'">
      <div class="earth-spikes">
        <span v-for="i in 12" :key="`earth-${i}`" class="earth-spike" :style="getEarthEdgeStyle(i)"></span>
      </div>
    </template>

    <!-- ========== 雷：锯齿闪电辐射 + 电流边框流动 + 四角粗闪电 ========== -->
    <template v-if="currentElement === 'thunder'">
      <!-- 从边框向外辐射的锯齿闪电 -->
      <div class="thunder-bolts">
        <span v-for="i in 10" :key="`thunder-${i}`" class="thunder-bolt" :style="getThunderBoltStyle(i)"></span>
      </div>
      <!-- 沿边框流动的电流光线 -->
      <div class="thunder-current-top"></div>
      <div class="thunder-current-right"></div>
      <div class="thunder-current-bottom"></div>
      <div class="thunder-current-left"></div>
      <!-- 四角粗闪电分叉 -->
      <div class="thunder-corner thunder-corner-tl"></div>
      <div class="thunder-corner thunder-corner-tr"></div>
      <div class="thunder-corner thunder-corner-bl"></div>
      <div class="thunder-corner thunder-corner-br"></div>
      <!-- 边框闪络白光 -->
      <div class="thunder-edge-flash"></div>
    </template>
  </div>
</template>

<script setup>
/**
 * 技能施法特效组件（边框环绕版）
 * 环绕玩家头像边框播放元素属性施法动画
 * 通过监听全局 CustomEvent 'skill-cast-effect' 触发
 * 事件 detail.element 可选值: fire / water / wind / earth / thunder / electricity / none
 * 无属性或未知属性默认播放风元素效果
 *
 * @file SkillCastEffect.vue
 * @generated 2026-06-27
 */
import { ref, onMounted, onUnmounted } from 'vue'

/** 元素类型 → 内部标准化映射，electricity 和 thunder 统一为 thunder */
const ELEMENT_MAP = {
  fire: 'fire',
  water: 'water',
  wind: 'wind',
  earth: 'earth',
  thunder: 'thunder',
  electricity: 'thunder',
  none: 'wind',
  '': 'wind'
}

/** 是否正在播放特效 */
const isActive = ref(false)

/** 当前元素类型（标准化后） */
const currentElement = ref('wind')

/** 动画结束定时器引用 */
let effectTimer = null

/** 特效持续时间（毫秒） */
const EFFECT_DURATION = 1000

/**
 * 环绕轨道粒子样式生成器
 * 沿头像边框均匀分布6个光点，通过父容器旋转实现环绕效果
 * @param {number} index - 粒子索引（1-based）
 * @returns {Object} CSS样式对象
 */
const getOrbitStyle = (index) => {
  const angle = (index - 1) * 60
  return {
    transform: `rotate(${angle}deg) translateX(52px)`,
    animationDelay: `${(index * 80) % 300}ms`
  }
}

/**
 * 反向轨道小粒子样式生成器
 * @param {number} index - 粒子索引（1-based）
 * @returns {Object} CSS样式对象
 */
const getOrbitReverseStyle = (index) => {
  const angle = (index - 1) * 90
  return {
    transform: `rotate(${angle}deg) translateX(56px)`,
    animationDelay: `${(index * 100) % 250}ms`
  }
}

/**
 * 火焰舌样式生成器 - 沿边框四周分布
 * @param {number} index - 粒子索引（1-based）
 * @returns {Object} CSS样式对象
 */
const getFireEdgeStyle = (index) => {
  const sides = ['top', 'right', 'bottom', 'left']
  const side = sides[(index - 1) % 4]
  const pos = 10 + (index * 23) % 80
  const base = { animationDelay: `${(index * 50) % 300}ms` }
  if (side === 'top') return { ...base, top: '0', left: `${pos}%` }
  if (side === 'right') return { ...base, right: '0', top: `${pos}%` }
  if (side === 'bottom') return { ...base, bottom: '0', left: `${pos}%` }
  return { ...base, left: '0', top: `${pos}%` }
}

/**
 * 水滴样式生成器 - 沿边框四周分布
 * @param {number} index - 粒子索引（1-based）
 * @returns {Object} CSS样式对象
 */
const getWaterEdgeStyle = (index) => {
  const angle = (index - 1) * 36
  return {
    transform: `rotate(${angle}deg) translateX(54px)`,
    animationDelay: `${(index * 60) % 300}ms`
  }
}

/**
 * 风刃气流样式生成器 - 沿边框螺旋分布
 * @param {number} index - 粒子索引（1-based）
 * @returns {Object} CSS样式对象
 */
const getWindEdgeStyle = (index) => {
  const angle = (index - 1) * 45
  return {
    transform: `rotate(${angle}deg) translateX(51px)`,
    animationDelay: `${(index * 60) % 250}ms`
  }
}

/**
 * 岩石尖刺样式生成器 - 沿边框四周分布
 * @param {number} index - 粒子索引（1-based）
 * @returns {Object} CSS样式对象
 */
const getEarthEdgeStyle = (index) => {
  const angle = (index - 1) * 30
  return {
    transform: `rotate(${angle}deg) translateX(50px) rotate(${index * 37}deg)`,
    animationDelay: `${(index * 40) % 200}ms`
  }
}

/**
 * 雷电锯齿闪电样式生成器 - 从边框向外辐射
 * 10道闪电沿边框均匀分布，各自有微妙的随机延迟和高度差异
 * @param {number} index - 闪电索引（1-based）
 * @returns {Object} CSS样式对象
 */
const getThunderBoltStyle = (index) => {
  const angle = (index - 1) * 36
  const heightVar = 16 + (index % 3) * 6
  return {
    transform: `rotate(${angle}deg) translateX(50px)`,
    height: `${heightVar}px`,
    animationDelay: `${(index * 30) % 150}ms`
  }
}

/**
 * 播放施法特效
 * @param {string} element - 元素类型（原始值，未标准化）
 */
const playEffect = (element) => {
  try {
    if (effectTimer) {
      clearTimeout(effectTimer)
      effectTimer = null
    }
    // 标准化元素类型，无属性默认风
    const normalized = ELEMENT_MAP[element] || 'wind'
    currentElement.value = normalized
    isActive.value = true
    effectTimer = setTimeout(() => {
      isActive.value = false
      effectTimer = null
    }, EFFECT_DURATION)
  } catch (error) {
    console.error('[SkillCastEffect] 播放施法特效失败:', error)
    isActive.value = false
  }
}

/**
 * 全局事件监听器：接收 skill-cast-effect CustomEvent
 * @param {CustomEvent} event - 自定义事件，detail.element 携带元素类型
 */
const handleCastEvent = (event) => {
  const element = event?.detail?.element || 'none'
  playEffect(element)
}

onMounted(() => {
  window.addEventListener('skill-cast-effect', handleCastEvent)
})

onUnmounted(() => {
  window.removeEventListener('skill-cast-effect', handleCastEvent)
  if (effectTimer) {
    clearTimeout(effectTimer)
    effectTimer = null
  }
})
</script>

<style scoped>
/* ========================================
   容器基础样式 - 覆盖头像区域，允许溢出
   ======================================== */
.cast-effect-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 60;
  border-radius: 8px;
  overflow: visible;
}

/* ========================================
   边框能量光环 - 脉冲发光边框
   ======================================== */
.cast-border-glow {
  position: absolute;
  inset: -2px;
  border-radius: 10px;
  border: 2px solid;
  animation: borderGlowPulse 1s ease-out forwards;
}

.cast-border-glow-2 {
  inset: -5px;
  border-radius: 13px;
  border: 1px solid;
  animation-delay: 0.2s;
}

@keyframes borderGlowPulse {
  0% {
    opacity: 0;
    transform: scale(0.92);
  }
  25% {
    opacity: 1;
    transform: scale(1);
  }
  70% {
    opacity: 0.6;
    transform: scale(1.05);
  }
  100% {
    opacity: 0;
    transform: scale(1.15);
  }
}

/* ========================================
   环绕轨道粒子容器 - 旋转动画
   ======================================== */
.cast-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  animation: orbitRotate 1s linear forwards;
}

.cast-orbit-reverse {
  animation: orbitRotateReverse 1s linear forwards;
}

@keyframes orbitRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes orbitRotateReverse {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

.orbit-particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin: -3px 0 0 -3px;
  opacity: 0;
  animation: orbitParticleFade 1s ease-out forwards;
}

.orbit-particle-sm {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  margin: -2px 0 0 -2px;
  opacity: 0;
  animation: orbitParticleFade 1s ease-out forwards;
}

@keyframes orbitParticleFade {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* ========================================
   火元素 - 橙红色调
   ======================================== */
.element-fire .cast-border-glow {
  border-color: rgba(255, 120, 30, 0.9);
  box-shadow: 0 0 12px rgba(255, 80, 20, 0.7), inset 0 0 8px rgba(255, 150, 50, 0.3);
}

.element-fire .cast-border-glow-2 {
  border-color: rgba(255, 80, 20, 0.5);
  box-shadow: 0 0 8px rgba(255, 60, 0, 0.4);
}

.element-fire .orbit-particle {
  background: radial-gradient(circle, rgba(255, 220, 100, 1), rgba(255, 100, 20, 0.6));
  box-shadow: 0 0 6px rgba(255, 120, 30, 0.8);
}

.element-fire .orbit-particle-sm {
  background: radial-gradient(circle, rgba(255, 200, 80, 1), rgba(255, 80, 0, 0.5));
  box-shadow: 0 0 4px rgba(255, 100, 20, 0.6);
}

.fire-edges {
  position: absolute;
  inset: 0;
}

.fire-tongue {
  position: absolute;
  width: 6px;
  height: 16px;
  border-radius: 50% 50% 30% 30%;
  background: radial-gradient(ellipse at bottom, rgba(255, 220, 100, 0.95), rgba(255, 100, 20, 0.7) 50%, transparent 100%);
  box-shadow: 0 0 5px rgba(255, 120, 30, 0.8);
  opacity: 0;
  animation: fireTongueRise 0.7s ease-out forwards;
  transform-origin: bottom center;
}

@keyframes fireTongueRise {
  0% {
    opacity: 0;
    height: 0;
    transform: scaleY(0.2);
  }
  25% {
    opacity: 1;
    height: 18px;
    transform: scaleY(1);
  }
  70% {
    opacity: 0.6;
    height: 24px;
    transform: scaleY(1.3);
  }
  100% {
    opacity: 0;
    height: 10px;
    transform: scaleY(0.5);
  }
}

/* ========================================
   水元素 - 蓝色调
   ======================================== */
.element-water .cast-border-glow {
  border-color: rgba(60, 160, 255, 0.9);
  box-shadow: 0 0 12px rgba(40, 140, 240, 0.7), inset 0 0 8px rgba(100, 190, 255, 0.3);
}

.element-water .cast-border-glow-2 {
  border-color: rgba(30, 120, 220, 0.5);
  box-shadow: 0 0 8px rgba(30, 120, 220, 0.4);
}

.element-water .orbit-particle {
  background: radial-gradient(circle, rgba(200, 240, 255, 1), rgba(60, 160, 255, 0.6));
  box-shadow: 0 0 6px rgba(80, 180, 255, 0.8);
}

.element-water .orbit-particle-sm {
  background: radial-gradient(circle, rgba(180, 230, 255, 1), rgba(30, 130, 220, 0.5));
  box-shadow: 0 0 4px rgba(60, 160, 255, 0.6);
}

.water-ring-1,
.water-ring-2,
.water-ring-3 {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 8px;
  border: 2px solid rgba(80, 180, 255, 0.7);
  transform: translate(-50%, -50%);
  animation: waterRingExpand 1s ease-out forwards;
}

.water-ring-2 { animation-delay: 0.2s; }
.water-ring-3 { animation-delay: 0.4s; }

@keyframes waterRingExpand {
  0% {
    width: 100px;
    height: 100px;
    opacity: 0.8;
  }
  100% {
    width: 140px;
    height: 140px;
    opacity: 0;
  }
}

.water-droplets {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  animation: orbitRotate 1.2s linear forwards;
}

.water-droplet {
  position: absolute;
  width: 5px;
  height: 7px;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  background: radial-gradient(circle at 35% 30%, rgba(200, 240, 255, 0.95), rgba(60, 160, 255, 0.5));
  box-shadow: 0 0 4px rgba(80, 180, 255, 0.7);
  margin: -3.5px 0 0 -2.5px;
  opacity: 0;
  animation: orbitParticleFade 1s ease-out forwards;
}

/* ========================================
   风元素 - 青绿色调
   ======================================== */
.element-wind .cast-border-glow {
  border-color: rgba(80, 220, 160, 0.9);
  box-shadow: 0 0 12px rgba(60, 200, 140, 0.7), inset 0 0 8px rgba(120, 240, 180, 0.3);
}

.element-wind .cast-border-glow-2 {
  border-color: rgba(40, 180, 120, 0.5);
  box-shadow: 0 0 8px rgba(40, 180, 120, 0.4);
}

.element-wind .orbit-particle {
  background: radial-gradient(circle, rgba(200, 255, 220, 1), rgba(80, 220, 160, 0.6));
  box-shadow: 0 0 6px rgba(100, 240, 170, 0.8);
}

.element-wind .orbit-particle-sm {
  background: radial-gradient(circle, rgba(180, 255, 210, 1), rgba(60, 200, 140, 0.5));
  box-shadow: 0 0 4px rgba(80, 220, 150, 0.6);
}

.wind-streams {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  animation: orbitRotate 0.8s linear forwards;
}

.wind-stream {
  position: absolute;
  width: 24px;
  height: 3px;
  border-radius: 50%;
  background: linear-gradient(90deg, transparent, rgba(100, 240, 170, 0.9), rgba(150, 255, 200, 0.5), transparent);
  box-shadow: 0 0 4px rgba(80, 220, 150, 0.6);
  margin: -1.5px 0 0 -12px;
  opacity: 0;
  animation: windStreamFlow 0.8s ease-out forwards;
}

@keyframes windStreamFlow {
  0% {
    opacity: 0;
    width: 0;
  }
  30% {
    opacity: 1;
    width: 30px;
  }
  100% {
    opacity: 0;
    width: 40px;
  }
}

/* ========================================
   土元素 - 棕褐色调
   ======================================== */
.element-earth .cast-border-glow {
  border-color: rgba(200, 150, 60, 0.9);
  box-shadow: 0 0 12px rgba(180, 130, 50, 0.7), inset 0 0 8px rgba(220, 180, 80, 0.3);
}

.element-earth .cast-border-glow-2 {
  border-color: rgba(160, 110, 40, 0.5);
  box-shadow: 0 0 8px rgba(160, 110, 40, 0.4);
}

.element-earth .orbit-particle {
  background: radial-gradient(circle, rgba(255, 230, 160, 1), rgba(200, 150, 60, 0.6));
  box-shadow: 0 0 6px rgba(200, 150, 60, 0.8);
}

.element-earth .orbit-particle-sm {
  background: radial-gradient(circle, rgba(240, 210, 130, 1), rgba(160, 110, 40, 0.5));
  box-shadow: 0 0 4px rgba(180, 140, 50, 0.6);
}

.earth-spikes {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  animation: orbitRotate 1.5s linear forwards;
}

.earth-spike {
  position: absolute;
  width: 5px;
  height: 14px;
  margin: -7px 0 0 -2.5px;
  background: linear-gradient(180deg, rgba(220, 180, 90, 0.95), rgba(140, 100, 40, 0.7));
  clip-path: polygon(50% 0%, 100% 30%, 80% 100%, 20% 100%, 0% 30%);
  box-shadow: 0 0 4px rgba(180, 140, 50, 0.6);
  opacity: 0;
  animation: earthSpikePop 0.6s ease-out forwards;
}

@keyframes earthSpikePop {
  0% {
    opacity: 0;
    height: 0;
  }
  30% {
    opacity: 1;
    height: 18px;
  }
  70% {
    opacity: 0.8;
    height: 16px;
  }
  100% {
    opacity: 0;
    height: 8px;
  }
}

/* ========================================
   雷元素 - 黄紫色调
   ======================================== */
.element-thunder .cast-border-glow {
  border-color: rgba(255, 220, 50, 0.9);
  box-shadow: 0 0 15px rgba(255, 200, 50, 0.8), inset 0 0 10px rgba(200, 150, 255, 0.3);
}

.element-thunder .cast-border-glow-2 {
  border-color: rgba(180, 100, 255, 0.5);
  box-shadow: 0 0 8px rgba(180, 100, 255, 0.4);
}

.element-thunder .orbit-particle {
  background: radial-gradient(circle, rgba(255, 255, 200, 1), rgba(255, 220, 50, 0.6));
  box-shadow: 0 0 6px rgba(255, 220, 50, 0.9), 0 0 12px rgba(180, 100, 255, 0.4);
}

.element-thunder .orbit-particle-sm {
  background: radial-gradient(circle, rgba(255, 250, 180, 1), rgba(180, 100, 255, 0.5));
  box-shadow: 0 0 4px rgba(255, 220, 50, 0.7);
}

/* ---- 锯齿闪电辐射：从边框向外延伸的之字形电弧 ---- */
.thunder-bolts {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  animation: orbitRotate 0.8s linear forwards;
}

.thunder-bolt {
  position: absolute;
  width: 4px;
  margin: 0 0 0 -2px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 220, 1) 0%,
    rgba(255, 240, 100, 0.95) 25%,
    rgba(200, 130, 255, 0.7) 60%,
    rgba(160, 80, 255, 0.3) 90%,
    transparent 100%
  );
  box-shadow:
    0 0 6px rgba(255, 240, 100, 0.9),
    0 0 12px rgba(200, 130, 255, 0.5);
  /* 之字形锯齿闪电轮廓：多个折点形成闪电的曲折感 */
  clip-path: polygon(
    50% 0%,
    75% 15%,
    30% 30%,
    70% 45%,
    25% 60%,
    65% 72%,
    40% 85%,
    55% 100%,
    45% 100%,
    60% 85%,
    35% 72%,
    75% 60%,
    30% 45%,
    70% 30%,
    25% 15%,
    50% 0%
  );
  opacity: 0;
  transform-origin: bottom center;
  animation: thunderBoltStrike 0.5s ease-out forwards;
}

@keyframes thunderBoltStrike {
  0% {
    opacity: 0;
    transform: scaleY(0);
  }
  10% {
    opacity: 1;
    transform: scaleY(1);
  }
  20% {
    opacity: 0.3;
  }
  30% {
    opacity: 1;
  }
  45% {
    opacity: 0.5;
  }
  60% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: scaleY(1.1);
  }
}

/* ---- 电流边框流动：四条边各有一道光线沿边框快速移动 ---- */
.thunder-current-top,
.thunder-current-right,
.thunder-current-bottom,
.thunder-current-left {
  position: absolute;
  opacity: 0;
}

.thunder-current-top {
  top: -2px;
  left: -2px;
  width: 30px;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 200, 1), rgba(200, 130, 255, 0.6), transparent);
  box-shadow: 0 0 8px rgba(255, 240, 100, 0.9);
  border-radius: 2px;
  animation: thunderCurrentTopRun 0.4s linear forwards;
}

.thunder-current-right {
  top: -2px;
  right: -2px;
  width: 3px;
  height: 30px;
  background: linear-gradient(180deg, transparent, rgba(255, 255, 200, 1), rgba(200, 130, 255, 0.6), transparent);
  box-shadow: 0 0 8px rgba(255, 240, 100, 0.9);
  border-radius: 2px;
  animation: thunderCurrentRightRun 0.4s linear forwards;
  animation-delay: 0.1s;
}

.thunder-current-bottom {
  bottom: -2px;
  right: -2px;
  width: 30px;
  height: 3px;
  background: linear-gradient(270deg, transparent, rgba(255, 255, 200, 1), rgba(200, 130, 255, 0.6), transparent);
  box-shadow: 0 0 8px rgba(255, 240, 100, 0.9);
  border-radius: 2px;
  animation: thunderCurrentBottomRun 0.4s linear forwards;
  animation-delay: 0.2s;
}

.thunder-current-left {
  bottom: -2px;
  left: -2px;
  width: 3px;
  height: 30px;
  background: linear-gradient(0deg, transparent, rgba(255, 255, 200, 1), rgba(200, 130, 255, 0.6), transparent);
  box-shadow: 0 0 8px rgba(255, 240, 100, 0.9);
  border-radius: 2px;
  animation: thunderCurrentLeftRun 0.4s linear forwards;
  animation-delay: 0.3s;
}

@keyframes thunderCurrentTopRun {
  0% { opacity: 0; transform: translateX(0); }
  20% { opacity: 1; }
  100% { opacity: 0; transform: translateX(calc(100% + 4px)); }
}

@keyframes thunderCurrentRightRun {
  0% { opacity: 0; transform: translateY(0); }
  20% { opacity: 1; }
  100% { opacity: 0; transform: translateY(calc(100% + 4px)); }
}

@keyframes thunderCurrentBottomRun {
  0% { opacity: 0; transform: translateX(0); }
  20% { opacity: 1; }
  100% { opacity: 0; transform: translateX(calc(-100% - 4px)); }
}

@keyframes thunderCurrentLeftRun {
  0% { opacity: 0; transform: translateY(0); }
  20% { opacity: 1; }
  100% { opacity: 0; transform: translateY(calc(-100% - 4px)); }
}

/* ---- 四角粗闪电分叉：从四个角向外延伸的粗电弧 ---- */
.thunder-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  opacity: 0;
  animation: thunderCornerBurst 0.5s ease-out forwards;
  animation-delay: 0.1s;
}

.thunder-corner-tl {
  top: -6px;
  left: -6px;
  background: linear-gradient(135deg, rgba(255, 255, 220, 1) 0%, rgba(255, 240, 100, 0.9) 30%, rgba(200, 130, 255, 0.4) 60%, transparent 100%);
  clip-path: polygon(0% 0%, 40% 20%, 20% 40%, 60% 50%, 30% 70%, 50% 100%, 0% 60%);
  box-shadow: 0 0 10px rgba(255, 240, 100, 0.8);
}

.thunder-corner-tr {
  top: -6px;
  right: -6px;
  background: linear-gradient(225deg, rgba(255, 255, 220, 1) 0%, rgba(255, 240, 100, 0.9) 30%, rgba(200, 130, 255, 0.4) 60%, transparent 100%);
  clip-path: polygon(100% 0%, 60% 20%, 80% 40%, 40% 50%, 70% 70%, 50% 100%, 100% 60%);
  box-shadow: 0 0 10px rgba(255, 240, 100, 0.8);
}

.thunder-corner-bl {
  bottom: -6px;
  left: -6px;
  background: linear-gradient(45deg, rgba(255, 255, 220, 1) 0%, rgba(255, 240, 100, 0.9) 30%, rgba(200, 130, 255, 0.4) 60%, transparent 100%);
  clip-path: polygon(0% 100%, 40% 80%, 20% 60%, 60% 50%, 30% 30%, 50% 0%, 0% 40%);
  box-shadow: 0 0 10px rgba(255, 240, 100, 0.8);
}

.thunder-corner-br {
  bottom: -6px;
  right: -6px;
  background: linear-gradient(315deg, rgba(255, 255, 220, 1) 0%, rgba(255, 240, 100, 0.9) 30%, rgba(200, 130, 255, 0.4) 60%, transparent 100%);
  clip-path: polygon(100% 100%, 60% 80%, 80% 60%, 40% 50%, 70% 30%, 50% 0%, 100% 40%);
  box-shadow: 0 0 10px rgba(255, 240, 100, 0.8);
}

@keyframes thunderCornerBurst {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  20% {
    opacity: 1;
    transform: scale(1);
  }
  40% {
    opacity: 0.4;
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.4);
  }
}

.thunder-edge-flash {
  position: absolute;
  inset: -2px;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 200, 0.8);
  box-shadow: 0 0 20px rgba(255, 220, 50, 0.9), inset 0 0 15px rgba(255, 220, 50, 0.5);
  opacity: 0;
  animation: thunderEdgeFlash 0.5s ease-out forwards;
  animation-delay: 0.1s;
}

@keyframes thunderEdgeFlash {
  0% { opacity: 0; }
  10% { opacity: 1; }
  20% { opacity: 0.2; }
  30% { opacity: 0.9; }
  50% { opacity: 0.3; }
  100% { opacity: 0; }
}

/* ========================================
   减少动画偏好 - 尊重用户设置
   ======================================== */
@media (prefers-reduced-motion: reduce) {
  .cast-border-glow,
  .cast-orbit,
  .orbit-particle,
  .orbit-particle-sm,
  .fire-tongue,
  .water-ring-1,
  .water-ring-2,
  .water-ring-3,
  .water-droplet,
  .wind-stream,
  .earth-spike,
  .thunder-bolt,
  .thunder-current-top,
  .thunder-current-right,
  .thunder-current-bottom,
  .thunder-current-left,
  .thunder-corner,
  .thunder-edge-flash {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
