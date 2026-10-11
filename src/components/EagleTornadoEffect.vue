<!--
  @file EagleTornadoEffect.vue
  @generated 2026-07-18
  @description 神鹰-寂灭龙卷风技能特效动画组件（GPU加速CSS动画版）
  爆裂射手T技能 - AOE风系群体攻击（神鹰降临R技能的后续进阶）

  技能叙事：召唤九霄神鹰俯冲现世 → 双翼卷起灭世龙卷风撕裂敌人 → 神鹰化作金光俯冲寂灭一击

  三阶段动画（总时长2秒）：
  1. 神鹰降临（0s ~ 0.4s）：金色光柱破空，神鹰俯冲而下，鹰啸冲击波震碎苍穹
  2. 灭世龙卷风（0.3s ~ 1.5s）：多层龙卷风柱旋转撕裂，风刃螺旋飞舞，碎片被卷入风暴中心
  3. 寂灭一击（1.4s ~ 2.0s）：神鹰化作金光俯冲轰击，多层金色冲击波爆裂，寂灭白光终结

  GPU加速优化：
  - 纯CSS @keyframes 驱动，零JS逐帧计算
  - 仅使用 transform（translate3d/scale/rotate）+ opacity，避免Layout/Paint
  - will-change 提前创建合成层，backface-visibility:hidden 消除闪烁
  - mix-blend-mode: screen 实现光效加法混合
  - 特效覆盖整个right-section怪物显示区域（inset: 0）
-->

<template>
  <div v-if="isVisible" class="et-container" :style="containerStyle">
    <!-- ========== 阶段一：神鹰降临（0s ~ 0.4s）—— 金光破空·神鹰俯冲·鹰啸震碎 ========== -->
    <!-- 风暴暗幕：青绿风暴覆盖，营造风暴降临氛围 -->
    <div class="et-dim"></div>
    <!-- 地面风纹法阵：旋转的青绿色风系召唤阵 -->
    <div class="et-wind-rune"></div>
    <div class="et-wind-rune et-wind-rune-2"></div>
    <!-- 金色光柱：神鹰降临时从天而降的金色光柱 -->
    <div class="et-pillar"></div>
    <!-- 神鹰俯冲：技能图标从上方旋转俯冲而下 -->
    <div class="et-eagle-dive">
      <img
        src="/pt/skill_icon/shenyingjimielongjuanfeng.png"
        alt="神鹰"
        class="et-eagle-img"
        draggable="false"
      />
    </div>
    <!-- 鹰啸冲击波：神鹰降临时向外扩散的金色声波环 -->
    <div class="et-sonic-wave"></div>
    <div class="et-sonic-wave et-sonic-wave-2"></div>

    <!-- ========== 阶段二：灭世龙卷风（0.3s ~ 1.5s）—— 旋转撕裂·风刃飞舞·碎片卷入 ========== -->
    <!-- 龙卷风核心：中心高亮能量核 -->
    <div class="et-tornado-core"></div>
    <!-- 龙卷风层：多层conic-gradient旋转，从下宽上窄形成漏斗龙卷 -->
    <div class="et-tornado-layer et-tornado-layer-1"></div>
    <div class="et-tornado-layer et-tornado-layer-2"></div>
    <div class="et-tornado-layer et-tornado-layer-3"></div>
    <!-- 风刃粒子：围绕风暴中心螺旋飞舞的青绿色弯月风刃 -->
    <div
      v-for="blade in windBlades"
      :key="blade.id"
      class="et-wind-blade"
      :style="blade.style"
    ></div>
    <!-- 碎片粒子：被卷入风暴中心的旋转碎片 -->
    <div
      v-for="i in 16"
      :key="'et-debris-' + i"
      class="et-debris"
      :style="getDebrisStyle(i)"
    ></div>
    <!-- 风暴光环：龙卷风外围的脉冲气流环 -->
    <div class="et-storm-aura"></div>
    <div class="et-storm-aura et-storm-aura-2"></div>

    <!-- ========== 阶段三：寂灭一击（1.4s ~ 2.0s）—— 金光俯冲·冲击爆裂·寂灭终结 ========== -->
    <!-- 金光俯冲：神鹰化作一道金光从上方轰击地面 -->
    <div class="et-golden-strike"></div>
    <!-- 寂灭冲击波：多层金色径向冲击波扩散 -->
    <div
      v-for="wave in annihilationWaves"
      :key="wave.id"
      class="et-annihilation-wave"
      :class="wave.className"
    ></div>
    <!-- 寂灭核心爆光：中心金色高光爆发 -->
    <div class="et-annihilation-core"></div>
    <!-- 寂灭白光：全屏终结白光闪烁 -->
    <div class="et-final-flash"></div>
  </div>
</template>

<script setup>
/**
 * 神鹰-寂灭龙卷风技能特效动画组件
 * 爆裂射手T技能 - AOE风系群体攻击
 *
 * 三阶段叙事动画（总时长2秒）：
 * 1. 神鹰降临（0s ~ 0.4s）：金光破空，神鹰俯冲，鹰啸冲击波震碎苍穹
 * 2. 灭世龙卷风（0.3s ~ 1.5s）：多层龙卷风柱旋转撕裂，风刃螺旋飞舞，碎片卷入风暴
 * 3. 寂灭一击（1.4s ~ 2.0s）：神鹰化作金光俯冲轰击，金色冲击波爆裂，寂灭白光终结
 *
 * GPU加速：所有动画仅使用 transform（translate3d/scale/rotate）+ opacity，避免重排，保证丝滑流畅
 * 特效范围覆盖整个right-section怪物显示区域（inset: 0）
 * 显示2秒后自动移除
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

/** 动画总持续时间（毫秒） */
const ANIMATION_DURATION_MS = 2000

/** 清理缓冲时间（毫秒） */
const CLEANUP_BUFFER_MS = 100

/** 风刃粒子数量 */
const WIND_BLADE_COUNT = 14

/** 是否可见 */
const isVisible = ref(false)

/** 风刃粒子数据列表 */
const windBlades = ref([])

/** 寂灭冲击波数据列表 */
const annihilationWaves = ref([])

/** 清理定时器 */
let cleanupTimer = null

/**
 * 特效容器样式 - 覆盖整个right-section父容器
 * 使用 inset: 0 撑满父元素
 */
const containerStyle = {
  position: 'absolute',
  inset: '0'
}

/**
 * 生成随机数（含最小值，不含最大值）
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机数
 */
const rand = (min, max) => Math.random() * (max - min) + min

/**
 * 生成风刃粒子数据
 * 14道青绿色弯月风刃围绕风暴中心螺旋飞舞
 * 每道风刃有不同的初始角度、旋转半径、延迟和持续时间
 * @returns {Array} 风刃配置数组
 */
function generateWindBlades () {
  const list = []
  for (let i = 0; i < WIND_BLADE_COUNT; i++) {
    // 初始角度：均匀分布 + 随机偏移
    const angle = (i / WIND_BLADE_COUNT) * 360 + rand(-12, 12)
    // 旋转半径：80px ~ 140px
    const radius = rand(80, 140)
    // 动画延迟：0.3s ~ 0.6s（龙卷风成型后开始飞舞）
    const delay = rand(0.3, 0.6)
    // 持续时间：0.7s ~ 1.0s
    const duration = rand(0.7, 1.0)
    // 风刃尺寸
    const width = rand(24, 40)
    const height = rand(10, 16)
    // 旋转方向系数（正向/反向螺旋）
    const direction = i % 2 === 0 ? 1 : -1

    list.push({
      id: `et-blade-${i}`,
      style: {
        '--et-blade-angle': `${angle}deg`,
        '--et-blade-radius': `${radius}px`,
        '--et-blade-direction': direction,
        width: `${width}px`,
        height: `${height}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        willChange: 'transform, opacity'
      }
    })
  }
  return list
}

/**
 * 生成被卷入风暴的碎片粒子样式
 * 16个碎片从四周以不同角度和距离被吸入风暴中心
 * @param {number} index - 粒子索引（1-based）
 * @returns {Object} CSS样式对象，包含CSS自定义属性
 */
function getDebrisStyle (index) {
  const angle = (index - 1) * 22.5 + rand(-8, 8)
  const distance = rand(120, 200)
  const size = rand(4, 9)
  const delay = rand(0.35, 0.7)
  const duration = rand(0.6, 0.9)
  return {
    '--et-debris-angle': `${angle}deg`,
    '--et-debris-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

/**
 * 生成寂灭冲击波数据
 * 3层金色径向冲击波在寂灭一击时依次扩散
 * @returns {Array} 冲击波配置数组
 */
function generateAnnihilationWaves () {
  return [
    { id: 'et-wave-1', className: 'et-wave-1' },
    { id: 'et-wave-2', className: 'et-wave-2' },
    { id: 'et-wave-3', className: 'et-wave-3' }
  ]
}

onMounted(async () => {
  // 生成粒子数据
  windBlades.value = generateWindBlades()
  annihilationWaves.value = generateAnnihilationWaves()

  // 等待下一帧确保DOM挂载完成，再触发CSS动画
  await nextTick()
  isVisible.value = true

  // 动画结束后自动清理
  cleanupTimer = setTimeout(() => {
    isVisible.value = false
  }, ANIMATION_DURATION_MS + CLEANUP_BUFFER_MS)
})

onUnmounted(() => {
  if (cleanupTimer) {
    clearTimeout(cleanupTimer)
    cleanupTimer = null
  }
})
</script>

<style scoped>
/* ================================================================
   容器基础样式 - 覆盖整个right-section，允许溢出，pointer-events:none
   ================================================================ */
.et-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 50;
  /* 建立合成层根，子元素动画独立合成 */
  contain: layout style paint;
  backface-visibility: hidden;
}

/* ================================================================
   阶段一：神鹰降临（0s ~ 0.4s）—— 金光破空·神鹰俯冲·鹰啸震碎
   ================================================================ */

/* 风暴暗幕 - 青绿风暴覆盖，营造风暴降临氛围
   GPU: 仅 opacity 过渡 */
.et-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 45%,
    rgba(20, 60, 50, 0.45) 0%,
    rgba(10, 40, 35, 0.3) 40%,
    rgba(5, 20, 18, 0.15) 75%,
    transparent 100%
  );
  animation: etDimFade 2s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes etDimFade {
  0% { opacity: 0; }
  15% { opacity: 1; }
  70% { opacity: 0.85; }
  85% { opacity: 0.6; }
  100% { opacity: 0; }
}

/* 地面风纹法阵 - 旋转的青绿色风系召唤阵
   双层conic-gradient构成法阵纹理，整体旋转 */
.et-wind-rune {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 320px;
  height: 320px;
  transform: translate3d(-50%, -50%, 0);
  border-radius: 50%;
  background:
    conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(127, 255, 212, 0.55) 30deg,
      transparent 60deg,
      rgba(0, 229, 204, 0.4) 120deg,
      transparent 150deg,
      rgba(127, 255, 212, 0.55) 210deg,
      transparent 240deg,
      rgba(0, 229, 204, 0.4) 300deg,
      transparent 330deg
    );
  -webkit-mask: radial-gradient(circle, transparent 38%, #000 40%, #000 92%, transparent 96%);
  mask: radial-gradient(circle, transparent 38%, #000 40%, #000 92%, transparent 96%);
  animation: etRuneRotate 1.6s linear forwards;
  will-change: transform, opacity;
  z-index: 2;
  opacity: 0;
}

.et-wind-rune-2 {
  width: 220px;
  height: 220px;
  animation: etRuneRotateReverse 1.6s linear forwards;
  animation-delay: 0.1s;
  opacity: 0;
  background:
    conic-gradient(
      from 45deg,
      transparent 0deg,
      rgba(170, 255, 238, 0.5) 45deg,
      transparent 90deg,
      rgba(170, 255, 238, 0.5) 225deg,
      transparent 270deg
    );
  -webkit-mask: radial-gradient(circle, transparent 45%, #000 48%, #000 90%, transparent 94%);
  mask: radial-gradient(circle, transparent 45%, #000 48%, #000 90%, transparent 94%);
}

@keyframes etRuneRotate {
  0% { transform: translate3d(-50%, -50%, 0) scale(0.3) rotate(0deg); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(30deg); opacity: 0.9; }
  75% { transform: translate3d(-50%, -50%, 0) scale(1.15) rotate(180deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1.3) rotate(270deg); opacity: 0; }
}

@keyframes etRuneRotateReverse {
  0% { transform: translate3d(-50%, -50%, 0) scale(0.2) rotate(0deg); opacity: 0; }
  25% { transform: translate3d(-50%, -50%, 0) scale(0.95) rotate(-40deg); opacity: 0.8; }
  75% { transform: translate3d(-50%, -50%, 0) scale(1.1) rotate(-160deg); opacity: 0.5; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1.25) rotate(-250deg); opacity: 0; }
}

/* 金色光柱 - 神鹰降临时从天而降的金色光柱
   线性渐变 + 垂直缩放，模拟光柱降临 */
.et-pillar {
  position: absolute;
  top: 0;
  left: 50%;
  width: 90px;
  height: 100%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: top center;
  background: linear-gradient(
    to bottom,
      rgba(255, 250, 200, 0.95) 0%,
      rgba(255, 215, 0, 0.8) 20%,
      rgba(255, 180, 40, 0.5) 50%,
      rgba(255, 215, 0, 0.25) 80%,
      transparent 100%
  );
  filter: blur(2px);
  animation: etPillarDescend 0.6s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  z-index: 3;
}

@keyframes etPillarDescend {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  30% { transform: translateX(-50%) scaleY(1); opacity: 1; }
  60% { transform: translateX(-50%) scaleY(1) scaleX(0.85); opacity: 0.85; }
  100% { transform: translateX(-50%) scaleY(1) scaleX(0.5); opacity: 0; }
}

/* 神鹰俯冲 - 技能图标从上方旋转俯冲而下
   GPU: translate3d + rotate + scale */
.et-eagle-dive {
  position: absolute;
  top: 0;
  left: 50%;
  width: 120px;
  height: 120px;
  transform: translate3d(-50%, -160px, 0) rotate(0deg) scale(0.4);
  animation: etEagleDive 0.9s cubic-bezier(0.3, 0.1, 0.5, 1) forwards;
  will-change: transform, opacity;
  z-index: 4;
  filter: drop-shadow(0 0 16px rgba(255, 215, 0, 0.9))
          drop-shadow(0 0 32px rgba(255, 200, 60, 0.5));
}

.et-eagle-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

@keyframes etEagleDive {
  0% {
    transform: translate3d(-50%, -160px, 0) rotate(0deg) scale(0.4);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -60px, 0) rotate(15deg) scale(0.7);
    opacity: 1;
  }
  35% {
    transform: translate3d(-50%, -10px, 0) rotate(25deg) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, 10px, 0) rotate(20deg) scale(0.9);
    opacity: 0.9;
  }
  70% {
    transform: translate3d(-50%, -5px, 0) rotate(10deg) scale(0.7);
    opacity: 0.6;
  }
  100% {
    transform: translate3d(-50%, -30px, 0) rotate(0deg) scale(0.3);
    opacity: 0;
  }
}

/* 鹰啸冲击波 - 神鹰降临时向外扩散的金色声波环
   径向缩放 + 透明度衰减 */
.et-sonic-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  transform: translate3d(-50%, -50%, 0) scale(0.3);
  border-radius: 50%;
  border: 3px solid rgba(255, 215, 0, 0.85);
  box-shadow:
    0 0 20px rgba(255, 215, 0, 0.6),
    inset 0 0 20px rgba(255, 200, 60, 0.4);
  animation: etSonicWave 0.8s ease-out forwards;
  animation-delay: 0.15s;
  will-change: transform, opacity;
  opacity: 0;
  z-index: 4;
}

.et-sonic-wave-2 {
  animation-delay: 0.3s;
  border-color: rgba(255, 245, 180, 0.7);
  border-width: 2px;
}

@keyframes etSonicWave {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.3);
    opacity: 0;
  }
  20% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(6);
    opacity: 0;
    border-width: 1px;
  }
}

/* ================================================================
   阶段二：灭世龙卷风（0.3s ~ 1.5s）—— 旋转撕裂·风刃飞舞·碎片卷入
   ================================================================ */

/* 龙卷风核心 - 中心高亮能量核
   脉冲缩放表现风暴核心能量波动 */
.et-tornado-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 50px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(170, 255, 238, 0.8) 25%,
    rgba(0, 229, 204, 0.5) 55%,
    transparent 100%
  );
  filter: blur(2px);
  animation: etTornadoCore 1.3s ease-in-out forwards;
  animation-delay: 0.3s;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  z-index: 5;
  opacity: 0;
}

@keyframes etTornadoCore {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
  50% { transform: translate3d(-50%, -50%, 0) scale(1.4); opacity: 0.9; }
  75% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(0.6); opacity: 0; }
}

/* 龙卷风层 - 多层conic-gradient旋转，从下宽上窄形成漏斗龙卷
   每层不同尺寸、旋转速度、透明度，叠加形成立体龙卷风柱 */
.et-tornado-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  z-index: 5;
}

.et-tornado-layer-1 {
  width: 200px;
  height: 360px;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(127, 255, 212, 0.55) 40deg,
    transparent 80deg,
    rgba(0, 229, 204, 0.45) 140deg,
    transparent 180deg,
    rgba(170, 255, 238, 0.5) 220deg,
    transparent 260deg,
    rgba(0, 229, 204, 0.45) 320deg,
    transparent 360deg
  );
  filter: blur(3px);
  /* 漏斗形：底宽顶窄，clip-path 切出龙卷风轮廓 */
  clip-path: polygon(30% 100%, 70% 100%, 58% 0%, 42% 0%);
  animation: etTornadoSpin1 1.2s linear forwards;
  animation-delay: 0.3s;
}

.et-tornado-layer-2 {
  width: 150px;
  height: 300px;
  background: conic-gradient(
    from 60deg,
    transparent 0deg,
    rgba(255, 255, 255, 0.4) 50deg,
    transparent 100deg,
    rgba(127, 255, 212, 0.35) 170deg,
    transparent 220deg,
    rgba(255, 255, 255, 0.3) 290deg,
    transparent 340deg
  );
  filter: blur(2px);
  clip-path: polygon(32% 100%, 68% 100%, 56% 0%, 44% 0%);
  animation: etTornadoSpin2 1.2s linear forwards;
  animation-delay: 0.35s;
}

.et-tornado-layer-3 {
  width: 110px;
  height: 240px;
  background: conic-gradient(
    from 120deg,
    transparent 0deg,
    rgba(170, 255, 238, 0.45) 60deg,
    transparent 120deg,
    rgba(255, 255, 255, 0.3) 200deg,
    transparent 260deg,
    rgba(127, 255, 212, 0.35) 320deg,
    transparent 360deg
  );
  filter: blur(1.5px);
  clip-path: polygon(35% 100%, 65% 100%, 55% 0%, 45% 0%);
  animation: etTornadoSpin3 1.2s linear forwards;
  animation-delay: 0.4s;
}

@keyframes etTornadoSpin1 {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(72deg); opacity: 0.9; }
  75% { transform: translate3d(-50%, -50%, 0) scale(1.1) rotate(360deg); opacity: 0.8; }
  100% { transform: translate3d(-50%, -50%, 0) scale(0.85) rotate(540deg); opacity: 0; }
}

@keyframes etTornadoSpin2 {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-72deg); opacity: 0.85; }
  75% { transform: translate3d(-50%, -50%, 0) scale(1.1) rotate(-360deg); opacity: 0.75; }
  100% { transform: translate3d(-50%, -50%, 0) scale(0.8) rotate(-540deg); opacity: 0; }
}

@keyframes etTornadoSpin3 {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(108deg); opacity: 0.8; }
  75% { transform: translate3d(-50%, -50%, 0) scale(1.15) rotate(540deg); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(0.75) rotate(720deg); opacity: 0; }
}

/* 风刃粒子 - 围绕风暴中心螺旋飞舞的青绿色弯月风刃
   通过CSS自定义属性参数化角度、半径、方向
   GPU: translate3d + rotate + opacity */
.et-wind-blade {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(170, 255, 238, 0.9) 30%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(127, 255, 212, 0.7) 70%,
    transparent 100%
  );
  filter: blur(0.5px) drop-shadow(0 0 6px rgba(127, 255, 212, 0.7));
  transform: translate3d(-50%, -50%, 0) rotate(var(--et-blade-angle)) translateX(var(--et-blade-radius)) scale(0);
  animation: etWindBladeSpin linear forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 6;
}

@keyframes etWindBladeSpin {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--et-blade-angle)) translateX(var(--et-blade-radius)) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(var(--et-blade-angle)) translateX(var(--et-blade-radius)) scale(1); }
  50% {
    transform: translate3d(-50%, -50%, 0)
      rotate(calc(var(--et-blade-angle) + 180deg * var(--et-blade-direction)))
      translateX(calc(var(--et-blade-radius) * 0.7))
      scale(0.85);
    opacity: 0.85;
  }
  100% {
    transform: translate3d(-50%, -50%, 0)
      rotate(calc(var(--et-blade-angle) + 360deg * var(--et-blade-direction)))
      translateX(calc(var(--et-blade-radius) * 0.4))
      scale(0.3);
    opacity: 0;
  }
}

/* 碎片粒子 - 被卷入风暴中心的旋转碎片
   从外围以螺旋轨迹向中心汇聚 */
.et-debris {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 1px;
  background: rgba(200, 255, 240, 0.85);
  box-shadow: 0 0 4px rgba(127, 255, 212, 0.6);
  transform: translate3d(-50%, -50%, 0) rotate(var(--et-debris-angle)) translateX(var(--et-debris-distance)) scale(0);
  animation: etDebrisSpiral linear forwards;
  will-change: transform, opacity;
  opacity: 0;
  z-index: 6;
}

@keyframes etDebrisSpiral {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--et-debris-angle)) translateX(var(--et-debris-distance)) scale(0);
    opacity: 0;
  }
  20% { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(var(--et-debris-angle)) translateX(var(--et-debris-distance)) scale(1); }
  100% {
    transform: translate3d(-50%, -50%, 0)
      rotate(calc(var(--et-debris-angle) + 270deg))
      translateX(10px)
      scale(0.4);
    opacity: 0;
  }
}

/* 风暴光环 - 龙卷风外围的脉冲气流环
   多层径向缩放扩散，表现风暴气流向四周冲击 */
.et-storm-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 180px;
  height: 180px;
  transform: translate3d(-50%, -50%, 0) scale(0.5);
  border-radius: 50%;
  border: 2px solid rgba(127, 255, 212, 0.5);
  background: radial-gradient(
    circle,
    transparent 60%,
    rgba(0, 229, 204, 0.12) 75%,
    transparent 95%
  );
  animation: etStormAura 1.2s ease-out forwards;
  animation-delay: 0.4s;
  will-change: transform, opacity;
  opacity: 0;
  z-index: 4;
}

.et-storm-aura-2 {
  width: 240px;
  height: 240px;
  animation-delay: 0.6s;
  border-color: rgba(170, 255, 238, 0.35);
}

@keyframes etStormAura {
  0% { transform: translate3d(-50%, -50%, 0) scale(0.5); opacity: 0; }
  25% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.8; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2.2); opacity: 0; }
}

/* ================================================================
   阶段三：寂灭一击（1.4s ~ 2.0s）—— 金光俯冲·冲击爆裂·寂灭终结
   ================================================================ */

/* 金光俯冲 - 神鹰化作一道金光从上方轰击地面
   垂直方向 scaleY + 透明度，模拟金光下坠轰击 */
.et-golden-strike {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50px;
  height: 100%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: top center;
  background: linear-gradient(
    to bottom,
      rgba(255, 255, 255, 1) 0%,
      rgba(255, 245, 180, 0.95) 15%,
      rgba(255, 215, 0, 0.85) 35%,
      rgba(255, 200, 60, 0.5) 60%,
      rgba(255, 180, 40, 0.2) 85%,
      transparent 100%
  );
  filter: blur(1px) drop-shadow(0 0 12px rgba(255, 215, 0, 0.9));
  animation: etGoldenStrike 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: 1.4s;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 7;
}

@keyframes etGoldenStrike {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  20% { transform: translateX(-50%) scaleY(1); opacity: 1; }
  50% { transform: translateX(-50%) scaleY(1) scaleX(1.3); opacity: 1; }
  75% { transform: translateX(-50%) scaleY(1) scaleX(0.9); opacity: 0.7; }
  100% { transform: translateX(-50%) scaleY(1) scaleX(0.4); opacity: 0; }
}

/* 寂灭冲击波 - 多层金色径向冲击波在寂灭一击时依次扩散
   每层不同延迟、颜色、尺寸，形成层次感 */
.et-annihilation-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  border-radius: 50%;
  border: 4px solid rgba(255, 215, 0, 0.9);
  box-shadow:
    0 0 30px rgba(255, 215, 0, 0.7),
    inset 0 0 30px rgba(255, 200, 60, 0.5);
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 8;
}

.et-wave-1 {
  animation: etAnnihilationWave 0.6s ease-out forwards;
  animation-delay: 1.45s;
  border-color: rgba(255, 245, 180, 0.95);
}

.et-wave-2 {
  animation: etAnnihilationWave 0.6s ease-out forwards;
  animation-delay: 1.55s;
  border-color: rgba(255, 215, 0, 0.85);
  border-width: 3px;
}

.et-wave-3 {
  animation: etAnnihilationWave 0.55s ease-out forwards;
  animation-delay: 1.65s;
  border-color: rgba(255, 255, 255, 0.75);
  border-width: 2px;
}

@keyframes etAnnihilationWave {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(5.5); opacity: 0; border-width: 1px; }
}

/* 寂灭核心爆光 - 中心金色高光爆发
   径向渐变 + 缩放，表现寂灭一击的核心能量爆发 */
.et-annihilation-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 245, 180, 0.95) 20%,
    rgba(255, 215, 0, 0.7) 45%,
    rgba(255, 180, 40, 0.3) 70%,
    transparent 100%
  );
  filter: blur(3px);
  animation: etAnnihilationCore 0.5s ease-out forwards;
  animation-delay: 1.45s;
  will-change: transform, opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 9;
}

@keyframes etAnnihilationCore {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2.8); opacity: 0; }
}

/* 寂灭白光 - 全屏终结白光闪烁
   径向渐变覆盖全屏，快速爆闪后消散 */
.et-final-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(255, 245, 180, 0.5) 30%,
    rgba(255, 215, 0, 0.2) 55%,
    transparent 80%
  );
  animation: etFinalFlash 0.5s ease-out forwards;
  animation-delay: 1.5s;
  will-change: opacity;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 10;
}

@keyframes etFinalFlash {
  0% { opacity: 0; }
  15% { opacity: 1; }
  40% { opacity: 0.6; }
  100% { opacity: 0; }
}
</style>
