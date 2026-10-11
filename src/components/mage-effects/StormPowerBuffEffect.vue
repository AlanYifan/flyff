<!--
  @file StormPowerBuffEffect.vue
  @generated 2026-08-04
  @description 风暴之力 - 持久BUFF特效（风暴凝聚·双刀觉醒·风暴之力循环）
  风暴行者R技能（storm_walker_r）BUFF持续期间特效：将风暴之力极限压缩注入双刀，进入「风暴觉醒」状态
  持续期间大幅提升自身风属性攻击力
  BUFF持续期间一直显示，BUFF到期后由父组件通过 v-if 移除
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 1.2s）- 风暴凝聚 + 双刀觉醒爆发 + 能量冲击波扩散
    持续循环 - 风暴觉醒光晕 + 双刀风刃流转 + 风暴核心脉动 + 螺旋风粒上升 + 能量波纹扩散
  色彩方案：风暴翠青(#64FFC8) + 风刃银白(#E8FFF8) + 风眼金白(#FFFFF0) + 深邃风暴青(#2A8A6A)
-->
<template>
  <!-- BUFF舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="spb-buff-stage" :style="stageStyle">
    <!-- ===== 入场动画：风暴凝聚（0s ~ 0.5s）===== -->
    <!-- 风暴暗幕 - 深沉风暴阴霾笼罩 -->
    <div class="spb-dim"></div>

    <!-- 风暴全屏闪光 - 觉醒瞬间的翠青爆闪 -->
    <div class="spb-flash"></div>

    <!-- 风暴能量光柱 - 从天而降的翠青能量光柱 -->
    <div class="spb-beam">
      <div class="spb-beam-core"></div>
      <div class="spb-beam-glow"></div>
    </div>

    <!-- 风能汇聚粒子 - 周围空气被猛烈抽向中心 -->
    <div
      v-for="i in 10"
      :key="'spb-inhale-' + i"
      class="spb-inhale-particle"
      :style="getInhaleStyle(i)"
    ></div>

    <!-- ===== 入场动画：双刀觉醒（0.3s ~ 0.8s）===== -->
    <!-- 觉醒双刀 - 左右两把风刃觉醒成形 -->
    <div class="spb-awake-blade blade-left">
      <div class="spb-blade-edge"></div>
      <div class="spb-blade-trail"></div>
    </div>
    <div class="spb-awake-blade blade-right">
      <div class="spb-blade-edge"></div>
      <div class="spb-blade-trail"></div>
    </div>

    <!-- 觉醒冲击波环 - 3层从中心扩散的翠青冲击波 -->
    <div class="spb-awake-ring ring-1"></div>
    <div class="spb-awake-ring ring-2"></div>
    <div class="spb-awake-ring ring-3"></div>

    <!-- 觉醒能量核心 - 中心爆发球 -->
    <div class="spb-awake-burst"></div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 风暴觉醒光晕 - 外层柔和翠青发光氛围（持续显示） -->
    <div class="spb-aura"></div>

    <!-- 风暴光环主体 - 发光的翠青双色光环边框（持续显示） -->
    <div class="spb-halo">
      <div class="spb-halo-field"></div>
      <div class="spb-halo-border"></div>
    </div>

    <!-- 双刀风刃流转 - 持续的风刃能量流（持续显示） -->
    <div class="spb-blade-stream stream-left">
      <div class="spb-stream-edge"></div>
      <div class="spb-stream-glow"></div>
    </div>
    <div class="spb-blade-stream stream-right">
      <div class="spb-stream-edge"></div>
      <div class="spb-stream-glow"></div>
    </div>

    <!-- 螺旋风粒 - 从地面向上螺旋飘升的翠青光粒（循环） -->
    <div
      v-for="i in 8"
      :key="'spb-spiral-' + i"
      class="spb-spiral-particle"
      :style="getSpiralStyle(i)"
    ></div>

    <!-- 持续能量波纹 - 从中心向外扩散的风暴波纹（循环） -->
    <div class="spb-pulse pulse-1"></div>
    <div class="spb-pulse pulse-2"></div>

    <!-- 风暴觉醒核心 - 发光的风暴之球，持续脉冲 -->
    <div class="spb-core">
      <div class="spb-core-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 风暴之力 - 持久BUFF特效（风暴凝聚·双刀觉醒·风暴之力循环）
 * 风暴行者R技能（storm_walker_r）BUFF持续期间特效
 * 将风暴之力极限压缩注入双刀，进入风暴觉醒状态，持续期间大幅提升自身风属性攻击力
 * 以风暴翠青和风刃银白为主色调，展现风暴凝聚与双刀觉醒的进攻视觉效果
 * BUFF持续期间一直显示，BUFF到期后由父组件通过 v-if 移除
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 * 定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

/** 舞台 DOM 引用 */
const stageRef = ref(null)

/** 头像区域位置信息（相对定位父容器） */
const avatarRect = ref({ left: 0, top: 0, width: 100, height: 100 })

/** 窗口 resize 回调引用 */
let resizeHandler = null

/**
 * 计算BUFF舞台的动态样式
 * 根据 #playerAvatar 的实际位置和尺寸，精确定位光环覆盖头像区域
 * 光环略大于头像（各方向延伸 14px），确保完全覆盖头像边框
 * @returns {Object} CSS 样式对象
 */
const stageStyle = computed(() => {
  const expand = 14
  const w = avatarRect.value.width + expand * 2
  const h = avatarRect.value.height + expand * 2
  return {
    left: `${avatarRect.value.left - expand}px`,
    top: `${avatarRect.value.top - expand}px`,
    width: `${w}px`,
    height: `${h}px`,
    transform: 'none'
  }
})

/**
 * 查找 #playerAvatar 元素并计算其相对于定位父容器的偏移位置
 * 使用 offsetLeft/offsetTop 遍历方式，避免祖先 transform: scale 导致的双重缩放问题
 */
function updateAvatarPosition () {
  try {
    const stage = stageRef.value
    if (!stage) return

    const avatar = document.getElementById('playerAvatar')
    if (!avatar) {
      return
    }

    const positioningParent = stage.offsetParent
    if (!positioningParent) {
      return
    }

    let offsetX = 0
    let offsetY = 0
    let current = avatar
    while (current && current !== positioningParent) {
      offsetX += current.offsetLeft || 0
      offsetY += current.offsetTop || 0
      current = current.offsetParent
    }

    avatarRect.value = {
      left: offsetX,
      top: offsetY,
      width: avatar.offsetWidth || 100,
      height: avatar.offsetHeight || 100
    }
  } catch (e) {
    // 更新头像位置失败，静默处理
  }
}

/**
 * 计算风能汇聚粒子的样式（入场一次性）
 * @param {number} index - 粒子索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getInhaleStyle (index) {
  const angle = (index - 1) * 36
  const delay = (index - 1) * 0.03
  const size = 4 + (index % 2) * 2
  return {
    '--spb-inhale-angle': `${angle}deg`,
    '--spb-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算螺旋上升粒子的样式（持续循环）
 * @param {number} index - 粒子索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getSpiralStyle (index) {
  const angle = (index - 1) * 45
  const delay = (index - 1) * 0.5
  const size = 4 + (index % 2) * 2
  return {
    '--spb-spiral-angle': `${angle}deg`,
    '--spb-spiral-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

onMounted(async () => {
  await nextTick()
  requestAnimationFrame(() => {
    updateAvatarPosition()
  })

  resizeHandler = () => updateAvatarPosition()
  window.addEventListener('resize', resizeHandler)
})

onBeforeUnmount(() => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
})
</script>

<style scoped>
/* ================================================================
   风暴之力 (storm_walker_r) - 持久BUFF特效
   技能描述：将风暴之力极限压缩注入双刀，进入风暴觉醒状态，持续期间大幅提升自身风属性攻击力
   色彩方案：风暴翠青(#64FFC8) + 风刃银白(#E8FFF8) + 风眼金白(#FFFFF0) + 深邃风暴青(#2A8A6A)
   GPU加速：contain隔离 + will-change + translate3d
   ================================================================ */

/* BUFF舞台 - 定位容器 */
.spb-buff-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：风暴凝聚（0s ~ 0.5s）---------- */

/* 风暴暗幕 - 深沉风暴阴霾笼罩 */
.spb-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(3, 35, 25, 0.5) 0%,
    rgba(2, 22, 16, 0.3) 45%,
    rgba(1, 12, 8, 0.12) 75%,
    transparent 100%
  );
  animation: spb-dim 1s ease-out forwards;
  will-change: opacity;
}

@keyframes spb-dim {
  0% { opacity: 0; }
  10% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 风暴全屏闪光 - 觉醒瞬间的翠青爆闪 */
.spb-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(255, 255, 240, 0.9) 0%,
    rgba(100, 255, 200, 0.5) 20%,
    rgba(50, 200, 150, 0.25) 45%,
    transparent 75%
  );
  opacity: 0;
  animation: spb-flash 0.6s ease-out forwards;
  will-change: opacity;
}

@keyframes spb-flash {
  0%, 100% { opacity: 0; }
  5% { opacity: 1; }
  12% { opacity: 0.3; }
  20% { opacity: 0.8; }
  40% { opacity: 0.2; }
  80% { opacity: 0; }
}

/* 风暴能量光柱 - 从天而降的翠青能量光柱 */
.spb-beam {
  position: absolute;
  top: 0;
  left: 50%;
  width: 40px;
  height: 100%;
  transform: translateX(-50%);
  animation: spb-beam 0.7s ease-out forwards;
  will-change: opacity, transform;
}

@keyframes spb-beam {
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
    opacity: 0.6;
  }
  100% {
    transform: translateX(-50%) scaleY(1);
    opacity: 0;
  }
}

.spb-beam-core {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 1) 0%,
    rgba(200, 255, 230, 0.95) 20%,
    rgba(100, 255, 200, 0.85) 50%,
    rgba(50, 200, 150, 0.5) 80%,
    rgba(20, 100, 70, 0.3) 100%
  );
  border-radius: 50% 50% 20% 20%;
  box-shadow:
    0 0 20px rgba(100, 255, 200, 0.9),
    0 0 40px rgba(80, 255, 180, 0.6),
    0 0 70px rgba(50, 200, 150, 0.3);
}

.spb-beam-glow {
  position: absolute;
  inset: -20px -40px;
  background: radial-gradient(
    ellipse at center,
    rgba(100, 255, 200, 0.35) 0%,
    rgba(50, 200, 150, 0.2) 40%,
    transparent 70%
  );
  filter: blur(10px);
}

/* 风能汇聚粒子 - 周围空气被猛烈抽向中心 */
.spb-inhale-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--spb-size, 5px);
  height: var(--spb-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 240, 0.95) 0%,
    rgba(100, 255, 200, 0.7) 45%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(100, 255, 200, 0.5);
  transform: translate(-50%, -50%) rotate(var(--spb-inhale-angle, 0deg)) translateX(80px) scale(1);
  opacity: 0;
  will-change: transform, opacity;
  animation: spb-inhale 0.4s ease-in forwards;
}

@keyframes spb-inhale {
  0% {
    transform: translate(-50%, -50%) rotate(var(--spb-inhale-angle, 0deg)) translateX(80px) scale(1);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--spb-inhale-angle, 0deg) + 180deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 入场动画：双刀觉醒（0.3s ~ 0.8s）---------- */

/* 觉醒双刀容器 - 左右两把风刃 */
.spb-awake-blade {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70px;
  height: 4px;
  transform: translate3d(-50%, -50%, 0) scaleX(0);
  will-change: transform, opacity;
  opacity: 0;
  backface-visibility: hidden;
}

/* 左刀 - 从左侧斜向成形 */
.spb-awake-blade.blade-left {
  animation: spb-blade-left 0.4s ease-out 0.3s forwards;
}

/* 右刀 - 从右侧斜向成形 */
.spb-awake-blade.blade-right {
  animation: spb-blade-right 0.4s ease-out 0.3s forwards;
}

@keyframes spb-blade-left {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(35deg) translateX(-60px) scaleX(0);
    opacity: 0;
  }
  40% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(35deg) translateX(0) scaleX(1);
    opacity: 0.8;
  }
}

@keyframes spb-blade-right {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(-35deg) translateX(60px) scaleX(0);
    opacity: 0;
  }
  40% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(-35deg) translateX(0) scaleX(1);
    opacity: 0.8;
  }
}

/* 风刃刀锋 - 翠青锐利光带 */
.spb-blade-edge {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(100, 255, 200, 0.3) 15%,
    rgba(150, 255, 220, 0.9) 40%,
    rgba(255, 255, 255, 1) 50%,
    rgba(150, 255, 220, 0.9) 60%,
    rgba(100, 255, 200, 0.3) 85%,
    transparent 100%
  );
  border-radius: 50%;
  box-shadow:
    0 0 8px rgba(100, 255, 200, 0.7),
    0 0 16px rgba(80, 255, 180, 0.4);
}

/* 风刃拖尾 - 模糊的光效尾迹 */
.spb-blade-trail {
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  height: 10px;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(100, 255, 200, 0.15) 50%,
    transparent 100%
  );
  filter: blur(4px);
}

/* 觉醒冲击波环 - 3层从中心扩散的翠青冲击波 */
.spb-awake-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid rgba(100, 255, 200, 0.8);
  box-shadow:
    0 0 12px rgba(100, 255, 200, 0.6),
    inset 0 0 10px rgba(50, 200, 150, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.spb-awake-ring.ring-1 { animation: spb-awake-ring 0.6s ease-out 0.3s forwards; }
.spb-awake-ring.ring-2 {
  border-color: rgba(80, 255, 180, 0.7);
  animation: spb-awake-ring 0.65s ease-out 0.4s forwards;
}
.spb-awake-ring.ring-3 {
  border-color: rgba(50, 200, 150, 0.5);
  animation: spb-awake-ring 0.7s ease-out 0.5s forwards;
}

@keyframes spb-awake-ring {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(5);
    opacity: 0;
  }
}

/* 觉醒能量核心 - 中心爆发球 */
.spb-awake-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(100, 255, 200, 0.85) 18%,
    rgba(50, 200, 150, 0.6) 42%,
    rgba(20, 100, 70, 0.3) 68%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: spb-awake-burst 0.5s cubic-bezier(0.15, 0.6, 0.3, 1) 0.3s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}

@keyframes spb-awake-burst {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  50% { transform: translate3d(-50%, -50%, 0) scale(2); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3); opacity: 0; }
}

/* ---------- 持续循环动画 ---------- */

/* 风暴觉醒光晕 - 外层柔和翠青发光氛围（持续显示） */
.spb-aura {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 50%,
    rgba(100, 255, 200, 0.08) 65%,
    rgba(50, 200, 150, 0.05) 80%,
    transparent 100%
  );
  opacity: 0;
  animation: spb-aura-in 0.4s ease-out 0.8s forwards,
             spb-aura-pulse 3s ease-in-out 1.2s infinite;
  will-change: opacity, transform;
}

@keyframes spb-aura-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes spb-aura-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.06); }
}

/* 风暴光环主体 */
.spb-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 85%;
  height: 85%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: spb-halo-in 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) 0.8s forwards;
  will-change: transform, opacity;
}

@keyframes spb-halo-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 */
.spb-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(100, 255, 200, 0.15) 0%,
    rgba(50, 200, 150, 0.08) 50%,
    transparent 80%
  );
  animation: spb-field-pulse 2.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes spb-field-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 旋转的翠青双色 conic 边框 */
.spb-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(100, 255, 200, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(100, 255, 200, 0.5) 0deg,
    rgba(50, 200, 150, 0.35) 60deg,
    rgba(255, 255, 240, 0.5) 120deg,
    rgba(100, 255, 200, 0.35) 180deg,
    rgba(50, 200, 150, 0.5) 240deg,
    rgba(255, 255, 240, 0.35) 300deg,
    rgba(100, 255, 200, 0.5) 360deg
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  padding: 2px;
  box-shadow:
    0 0 10px rgba(100, 255, 200, 0.5),
    inset 0 0 10px rgba(50, 200, 150, 0.2);
  animation: spb-border-glow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes spb-border-glow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 10px rgba(100, 255, 200, 0.5),
      inset 0 0 10px rgba(50, 200, 150, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 14px rgba(100, 255, 200, 0.8),
      0 0 7px rgba(50, 200, 150, 0.3),
      inset 0 0 7px rgba(255, 255, 240, 0.3);
  }
}

/* 双刀风刃流转 - 持续的风刃能量流（持续显示） */
.spb-blade-stream {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 3px;
  transform: translate3d(-50%, -50%, 0);
  opacity: 0;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.spb-blade-stream.stream-left {
  animation: spb-stream-left-in 0.4s ease-out 0.9s forwards,
             spb-stream-left-flow 2s ease-in-out 1.3s infinite;
}

.spb-blade-stream.stream-right {
  animation: spb-stream-right-in 0.4s ease-out 0.9s forwards,
             spb-stream-right-flow 2s ease-in-out 1.3s infinite;
}

@keyframes spb-stream-left-in {
  0% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1); opacity: 0.7; }
}

@keyframes spb-stream-right-in {
  0% { transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(1); opacity: 0.7; }
}

@keyframes spb-stream-left-flow {
  0%, 100% {
    transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1);
    opacity: 0.5;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1.15);
    opacity: 0.9;
  }
}

@keyframes spb-stream-right-flow {
  0%, 100% {
    transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(1);
    opacity: 0.5;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(1.15);
    opacity: 0.9;
  }
}

/* 风刃流光带 */
.spb-stream-edge {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(100, 255, 200, 0.3) 15%,
    rgba(150, 255, 220, 0.8) 40%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(150, 255, 220, 0.8) 60%,
    rgba(100, 255, 200, 0.3) 85%,
    transparent 100%
  );
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(100, 255, 200, 0.5);
}

/* 风刃流光晕 */
.spb-stream-glow {
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 7px;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(100, 255, 200, 0.15) 50%,
    transparent 100%
  );
  filter: blur(3px);
}

/* 螺旋风粒 - 从地面向上螺旋飘升的翠青光粒（循环） */
.spb-spiral-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  width: var(--spb-spiral-size, 5px);
  height: var(--spb-spiral-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 240, 0.95) 0%,
    rgba(100, 255, 200, 0.7) 45%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(100, 255, 200, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: spb-spiral 2.5s ease-out infinite;
  will-change: transform, opacity;
}

@keyframes spb-spiral {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--spb-spiral-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--spb-spiral-angle, 0deg)) translateX(10px) scale(1.2);
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--spb-spiral-angle, 0deg) + 180deg)) translateX(18px) scale(0.9);
    opacity: 0.6;
  }
  80% { opacity: 0.3; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--spb-spiral-angle, 0deg) + 360deg)) translateX(8px) translateY(-50px) scale(0.2);
    opacity: 0;
  }
}

/* 持续能量波纹 - 从中心向外扩散的风暴波纹（循环） */
.spb-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20%;
  height: 20%;
  border-radius: 50%;
  border: 2px solid rgba(100, 255, 200, 0.6);
  background: transparent;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.spb-pulse.pulse-1 {
  animation: spb-pulse-expand 1.2s ease-out 0.8s infinite;
  border-color: rgba(255, 255, 240, 0.8);
}
.spb-pulse.pulse-2 {
  animation: spb-pulse-expand 1.2s ease-out 1.4s infinite;
  border-color: rgba(50, 200, 150, 0.7);
}

@keyframes spb-pulse-expand {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
  }
  20% { opacity: 0.8; }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
    border-color: rgba(50, 200, 150, 0.1);
  }
}

/* 风暴觉醒核心 - 发光的风暴之球，持续脉冲 */
.spb-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: spb-core-in 0.3s ease-out 0.6s forwards,
             spb-core-pulse 1.5s ease-in-out 0.9s infinite;
  will-change: transform, opacity;
}

@keyframes spb-core-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes spb-core-pulse {
  0%, 100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.85;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 1;
  }
}

.spb-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 240, 0.95) 20%,
    rgba(100, 255, 200, 0.85) 50%,
    rgba(50, 200, 150, 0.5) 80%,
    transparent 100%
  );
  box-shadow:
    0 0 8px rgba(100, 255, 200, 0.9),
    0 0 16px rgba(100, 255, 200, 0.5),
    0 0 24px rgba(50, 200, 150, 0.3);
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .spb-buff-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
