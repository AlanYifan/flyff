<!--
  @file HolyShieldAwakeningBuffEffect.vue
  @generated 2026-08-04
  @description 圣盾觉醒 - 持久BUFF特效（圣光凝聚·圣盾觉醒·圣盾之力循环）
  圣殿骑士R技能（holy_knight_r）BUFF持续期间特效：将圣光之力极限压缩注入圣盾，进入「圣盾觉醒」状态
  持续期间大幅提升自身防御力和伤害减免
  BUFF持续期间一直显示，BUFF到期后由父组件通过 v-if 移除
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 1.2s）- 圣光凝聚 + 圣盾觉醒爆发 + 圣光冲击波扩散
    持续循环 - 圣盾觉醒光晕 + 圣盾光环边框 + 圣盾光刃流转 + 螺旋圣粒上升 + 能量波纹扩散
  色彩方案：圣光金(#FFD54F) + 神圣白(#FFF8E1) + 盾甲蓝(#42A5F5) + 守护金(#FFC107)
-->
<template>
  <!-- BUFF舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="hsa-buff-stage" :style="stageStyle">
    <!-- ===== 入场动画：圣光凝聚（0s ~ 0.5s）===== -->
    <!-- 圣光暗幕 - 深沉圣光阴霾笼罩 -->
    <div class="hsa-dim"></div>

    <!-- 圣光全屏闪光 - 觉醒瞬间的金光爆闪 -->
    <div class="hsa-flash"></div>

    <!-- 圣光能量光柱 - 从天而降的金色能量光柱 -->
    <div class="hsa-beam">
      <div class="hsa-beam-core"></div>
      <div class="hsa-beam-glow"></div>
    </div>

    <!-- 圣光汇聚粒子 - 周围圣光被猛烈抽向中心 -->
    <div
      v-for="i in 10"
      :key="'hsa-inhale-' + i"
      class="hsa-inhale-particle"
      :style="getInhaleStyle(i)"
    ></div>

    <!-- ===== 入场动画：圣盾觉醒（0.3s ~ 0.8s）===== -->
    <!-- 觉醒圣盾 - 圣盾成形并觉醒 -->
    <div class="hsa-awake-shield">
      <div class="hsa-shield-body"></div>
      <div class="hsa-shield-glow"></div>
    </div>

    <!-- 觉醒冲击波环 - 3层从中心扩散的金光冲击波 -->
    <div class="hsa-awake-ring ring-1"></div>
    <div class="hsa-awake-ring ring-2"></div>
    <div class="hsa-awake-ring ring-3"></div>

    <!-- 觉醒能量核心 - 中心爆发球 -->
    <div class="hsa-awake-burst"></div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 圣盾觉醒光晕 - 外层柔和金光发光氛围（持续显示） -->
    <div class="hsa-aura"></div>

    <!-- 圣盾光环主体 - 发光的金色双色光环边框（持续显示） -->
    <div class="hsa-halo">
      <div class="hsa-halo-field"></div>
      <div class="hsa-halo-border"></div>
    </div>

    <!-- 圣盾光刃流转 - 持续的圣盾光刃能量流（持续显示） -->
    <div class="hsa-shield-stream stream-left">
      <div class="hsa-stream-edge"></div>
      <div class="hsa-stream-glow"></div>
    </div>
    <div class="hsa-shield-stream stream-right">
      <div class="hsa-stream-edge"></div>
      <div class="hsa-stream-glow"></div>
    </div>

    <!-- 螺旋圣粒 - 从地面向上螺旋飘升的金色光粒（循环） -->
    <div
      v-for="i in 8"
      :key="'hsa-spiral-' + i"
      class="hsa-spiral-particle"
      :style="getSpiralStyle(i)"
    ></div>

    <!-- 持续能量波纹 - 从中心向外扩散的圣光波纹（循环） -->
    <div class="hsa-pulse pulse-1"></div>
    <div class="hsa-pulse pulse-2"></div>

    <!-- 圣盾觉醒核心 - 发光的圣盾之球，持续脉冲 -->
    <div class="hsa-core">
      <div class="hsa-core-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 圣盾觉醒 - 持久BUFF特效（圣光凝聚·圣盾觉醒·圣盾之力循环）
 * 圣殿骑士R技能（holy_knight_r）BUFF持续期间特效
 * 将圣光之力极限压缩注入圣盾，进入圣盾觉醒状态，持续期间大幅提升自身防御力和伤害减免
 * 以圣光金和神圣白为主色调，展现圣光凝聚与圣盾觉醒的防御视觉效果
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
 * 计算圣光汇聚粒子的样式（入场一次性）
 * @param {number} index - 粒子索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getInhaleStyle (index) {
  const angle = (index - 1) * 36
  const delay = (index - 1) * 0.03
  const size = 4 + (index % 2) * 2
  return {
    '--hsa-inhale-angle': `${angle}deg`,
    '--hsa-size': `${size}px`,
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
    '--hsa-spiral-angle': `${angle}deg`,
    '--hsa-spiral-size': `${size}px`,
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
   圣盾觉醒 (holy_knight_r) - 持久BUFF特效
   技能描述：将圣光之力极限压缩注入圣盾，进入圣盾觉醒状态，持续期间大幅提升自身防御力和伤害减免
   色彩方案：圣光金(#FFD54F) + 神圣白(#FFF8E1) + 盾甲蓝(#42A5F5) + 守护金(#FFC107)
   GPU加速：contain隔离 + will-change + translate3d
   ================================================================ */

/* BUFF舞台 - 定位容器 */
.hsa-buff-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：圣光凝聚（0s ~ 0.5s）---------- */

/* 圣光暗幕 - 深沉圣光阴霾笼罩 */
.hsa-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(35, 25, 3, 0.5) 0%,
    rgba(22, 16, 2, 0.3) 45%,
    rgba(12, 8, 1, 0.12) 75%,
    transparent 100%
  );
  animation: hsa-dim 1s ease-out forwards;
  will-change: opacity;
}

@keyframes hsa-dim {
  0% { opacity: 0; }
  10% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 圣光全屏闪光 - 觉醒瞬间的金光爆闪 */
.hsa-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 213, 79, 0.5) 20%,
    rgba(255, 193, 7, 0.25) 45%,
    transparent 75%
  );
  opacity: 0;
  animation: hsa-flash 0.6s ease-out forwards;
  will-change: opacity;
}

@keyframes hsa-flash {
  0%, 100% { opacity: 0; }
  5% { opacity: 1; }
  12% { opacity: 0.3; }
  20% { opacity: 0.8; }
  40% { opacity: 0.2; }
  80% { opacity: 0; }
}

/* 圣光能量光柱 - 从天而降的金色能量光柱 */
.hsa-beam {
  position: absolute;
  top: 0;
  left: 50%;
  width: 40px;
  height: 100%;
  transform: translateX(-50%);
  animation: hsa-beam 0.7s ease-out forwards;
  will-change: opacity, transform;
}

@keyframes hsa-beam {
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

.hsa-beam-core {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 248, 225, 0.95) 20%,
    rgba(255, 213, 79, 0.85) 50%,
    rgba(255, 193, 7, 0.5) 80%,
    rgba(100, 70, 3, 0.3) 100%
  );
  border-radius: 50% 50% 20% 20%;
  box-shadow:
    0 0 20px rgba(255, 213, 79, 0.9),
    0 0 40px rgba(255, 193, 7, 0.6),
    0 0 70px rgba(66, 165, 245, 0.3);
}

.hsa-beam-glow {
  position: absolute;
  inset: -20px -40px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 213, 79, 0.35) 0%,
    rgba(255, 193, 7, 0.2) 40%,
    transparent 70%
  );
  filter: blur(10px);
}

/* 圣光汇聚粒子 - 周围圣光被猛烈抽向中心 */
.hsa-inhale-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--hsa-size, 5px);
  height: var(--hsa-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 213, 79, 0.7) 45%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(255, 213, 79, 0.5);
  transform: translate(-50%, -50%) rotate(var(--hsa-inhale-angle, 0deg)) translateX(80px) scale(1);
  opacity: 0;
  will-change: transform, opacity;
  animation: hsa-inhale 0.4s ease-in forwards;
}

@keyframes hsa-inhale {
  0% {
    transform: translate(-50%, -50%) rotate(var(--hsa-inhale-angle, 0deg)) translateX(80px) scale(1);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--hsa-inhale-angle, 0deg) + 180deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 入场动画：圣盾觉醒（0.3s ~ 0.8s）---------- */

/* 觉醒圣盾容器 - 圣盾成形并觉醒 */
.hsa-awake-shield {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70px;
  height: 80px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  opacity: 0;
  backface-visibility: hidden;
  animation: hsa-shield-awake 0.5s ease-out 0.3s forwards;
}

@keyframes hsa-shield-awake {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0) rotate(-15deg);
    opacity: 0;
  }
  40% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.1) rotate(0deg);
    opacity: 0.8;
  }
}

/* 圣盾主体 - 八边形盾牌形状 */
.hsa-shield-body {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 213, 79, 0.3) 0%,
    rgba(255, 248, 225, 0.8) 30%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(255, 248, 225, 0.8) 70%,
    rgba(255, 213, 79, 0.3) 100%
  );
  clip-path: polygon(50% 0%, 90% 20%, 100% 50%, 90% 80%, 50% 100%, 10% 80%, 0% 50%, 10% 20%);
  box-shadow:
    0 0 20px rgba(255, 213, 79, 0.8),
    0 0 40px rgba(255, 193, 7, 0.4);
}

/* 圣盾光晕 - 盾牌周围的光效 */
.hsa-shield-glow {
  position: absolute;
  inset: -15px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 213, 79, 0.3) 0%,
    rgba(66, 165, 245, 0.15) 40%,
    transparent 70%
  );
  filter: blur(8px);
}

/* 觉醒冲击波环 - 3层从中心扩散的金光冲击波 */
.hsa-awake-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid rgba(255, 213, 79, 0.8);
  box-shadow:
    0 0 12px rgba(255, 213, 79, 0.6),
    inset 0 0 10px rgba(255, 193, 7, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.hsa-awake-ring.ring-1 { animation: hsa-awake-ring 0.6s ease-out 0.3s forwards; }
.hsa-awake-ring.ring-2 {
  border-color: rgba(255, 193, 7, 0.7);
  animation: hsa-awake-ring 0.65s ease-out 0.4s forwards;
}
.hsa-awake-ring.ring-3 {
  border-color: rgba(66, 165, 245, 0.5);
  animation: hsa-awake-ring 0.7s ease-out 0.5s forwards;
}

@keyframes hsa-awake-ring {
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
.hsa-awake-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 213, 79, 0.85) 18%,
    rgba(255, 193, 7, 0.6) 42%,
    rgba(66, 165, 245, 0.3) 68%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: hsa-awake-burst 0.5s cubic-bezier(0.15, 0.6, 0.3, 1) 0.3s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}

@keyframes hsa-awake-burst {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  50% { transform: translate3d(-50%, -50%, 0) scale(2); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3); opacity: 0; }
}

/* ---------- 持续循环动画 ---------- */

/* 圣盾觉醒光晕 - 外层柔和金光发光氛围（持续显示） */
.hsa-aura {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 50%,
    rgba(255, 213, 79, 0.08) 65%,
    rgba(255, 193, 7, 0.05) 80%,
    transparent 100%
  );
  opacity: 0;
  animation: hsa-aura-in 0.4s ease-out 0.8s forwards,
             hsa-aura-pulse 3s ease-in-out 1.2s infinite;
  will-change: opacity, transform;
}

@keyframes hsa-aura-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes hsa-aura-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.06); }
}

/* 圣盾光环主体 */
.hsa-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 85%;
  height: 85%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: hsa-halo-in 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) 0.8s forwards;
  will-change: transform, opacity;
}

@keyframes hsa-halo-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 */
.hsa-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 213, 79, 0.15) 0%,
    rgba(255, 193, 7, 0.08) 50%,
    transparent 80%
  );
  animation: hsa-field-pulse 2.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes hsa-field-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 旋转的金色双色 conic 边框 */
.hsa-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 213, 79, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(255, 213, 79, 0.5) 0deg,
    rgba(255, 193, 7, 0.35) 60deg,
    rgba(255, 255, 255, 0.5) 120deg,
    rgba(255, 213, 79, 0.35) 180deg,
    rgba(66, 165, 245, 0.4) 240deg,
    rgba(255, 248, 225, 0.35) 300deg,
    rgba(255, 213, 79, 0.5) 360deg
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
    0 0 10px rgba(255, 213, 79, 0.5),
    inset 0 0 10px rgba(255, 193, 7, 0.2);
  animation: hsa-border-glow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes hsa-border-glow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 10px rgba(255, 213, 79, 0.5),
      inset 0 0 10px rgba(255, 193, 7, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 14px rgba(255, 213, 79, 0.8),
      0 0 7px rgba(66, 165, 245, 0.3),
      inset 0 0 7px rgba(255, 248, 225, 0.3);
  }
}

/* 圣盾光刃流转 - 持续的圣盾光刃能量流（持续显示） */
.hsa-shield-stream {
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

.hsa-shield-stream.stream-left {
  animation: hsa-stream-left-in 0.4s ease-out 0.9s forwards,
             hsa-stream-left-flow 2s ease-in-out 1.3s infinite;
}

.hsa-shield-stream.stream-right {
  animation: hsa-stream-right-in 0.4s ease-out 0.9s forwards,
             hsa-stream-right-flow 2s ease-in-out 1.3s infinite;
}

@keyframes hsa-stream-left-in {
  0% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1); opacity: 0.7; }
}

@keyframes hsa-stream-right-in {
  0% { transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(1); opacity: 0.7; }
}

@keyframes hsa-stream-left-flow {
  0%, 100% {
    transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1);
    opacity: 0.5;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(35deg) scaleX(1.15);
    opacity: 0.9;
  }
}

@keyframes hsa-stream-right-flow {
  0%, 100% {
    transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(1);
    opacity: 0.5;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(-35deg) scaleX(1.15);
    opacity: 0.9;
  }
}

/* 圣盾光刃流光带 */
.hsa-stream-edge {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 213, 79, 0.3) 15%,
    rgba(255, 248, 225, 0.8) 40%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(255, 248, 225, 0.8) 60%,
    rgba(255, 213, 79, 0.3) 85%,
    transparent 100%
  );
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(255, 213, 79, 0.5);
}

/* 圣盾光刃流光晕 */
.hsa-stream-glow {
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 7px;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 213, 79, 0.15) 50%,
    transparent 100%
  );
  filter: blur(3px);
}

/* 螺旋圣粒 - 从地面向上螺旋飘升的金色光粒（循环） */
.hsa-spiral-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  width: var(--hsa-spiral-size, 5px);
  height: var(--hsa-spiral-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 213, 79, 0.7) 45%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(255, 213, 79, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: hsa-spiral 2.5s ease-out infinite;
  will-change: transform, opacity;
}

@keyframes hsa-spiral {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--hsa-spiral-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--hsa-spiral-angle, 0deg)) translateX(10px) scale(1.2);
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--hsa-spiral-angle, 0deg) + 180deg)) translateX(18px) scale(0.9);
    opacity: 0.6;
  }
  80% { opacity: 0.3; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--hsa-spiral-angle, 0deg) + 360deg)) translateX(8px) translateY(-50px) scale(0.2);
    opacity: 0;
  }
}

/* 持续能量波纹 - 从中心向外扩散的圣光波纹（循环） */
.hsa-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20%;
  height: 20%;
  border-radius: 50%;
  border: 2px solid rgba(255, 213, 79, 0.6);
  background: transparent;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.hsa-pulse.pulse-1 {
  animation: hsa-pulse-expand 1.2s ease-out 0.8s infinite;
  border-color: rgba(255, 255, 255, 0.8);
}
.hsa-pulse.pulse-2 {
  animation: hsa-pulse-expand 1.2s ease-out 1.4s infinite;
  border-color: rgba(66, 165, 245, 0.7);
}

@keyframes hsa-pulse-expand {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
  }
  20% { opacity: 0.8; }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
    border-color: rgba(66, 165, 245, 0.1);
  }
}

/* 圣盾觉醒核心 - 发光的圣盾之球，持续脉冲 */
.hsa-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: hsa-core-in 0.3s ease-out 0.6s forwards,
             hsa-core-pulse 1.5s ease-in-out 0.9s infinite;
  will-change: transform, opacity;
}

@keyframes hsa-core-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes hsa-core-pulse {
  0%, 100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.85;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 1;
  }
}

.hsa-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 248, 225, 0.95) 20%,
    rgba(255, 213, 79, 0.85) 50%,
    rgba(255, 193, 7, 0.5) 80%,
    transparent 100%
  );
  box-shadow:
    0 0 8px rgba(255, 213, 79, 0.9),
    0 0 16px rgba(255, 213, 79, 0.5),
    0 0 24px rgba(66, 165, 245, 0.3);
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .hsa-buff-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
