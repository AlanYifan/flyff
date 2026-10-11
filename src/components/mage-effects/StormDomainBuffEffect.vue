<!--
  @file StormDomainBuffEffect.vue
  @generated 2026-08-04
  @description 风暴领域 - 持久BUFF特效（领域展开·双刀引导·风暴庇护循环）
  风暴行者Q技能（storm_walker_q）BUFF持续期间特效：以双刀为引导展开风暴领域庇护全队
  持续期间提升全队闪避率和命中率；一阶强化额外提升全队暴击率，二阶强化进一步增加全队攻击速度
  BUFF持续期间一直显示，BUFF到期后由父组件通过 v-if 移除
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 1.2s）- 领域暗幕 + 领域闪光 + 地面法阵展开 + 双刀引导 + 领域波纹扩散
    持续循环 - 风暴领域光晕 + 旋转法阵三重环 + 风暴庇护光环 + 环绕风粒流转 + 领域核心脉动 + 庇护波纹扩散
  色彩方案：风暴翠青(#64FFC8) + 领域银白(#E8FFF8) + 庇护金白(#FFFFF0) + 深邃风暴青(#2A8A6A)
-->
<template>
  <!-- BUFF舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="sdb-buff-stage" :style="stageStyle">
    <!-- ===== 入场动画：领域展开（0s ~ 0.5s）===== -->
    <!-- 领域暗幕 - 深沉风暴阴霾笼罩 -->
    <div class="sdb-dim"></div>

    <!-- 领域全屏闪光 - 展开瞬间的翠青爆闪 -->
    <div class="sdb-flash"></div>

    <!-- 风能汇聚粒子 - 周围空气被猛烈抽向中心 -->
    <div
      v-for="i in 10"
      :key="'sdb-inhale-' + i"
      class="sdb-inhale-particle"
      :style="getInhaleStyle(i)"
    ></div>

    <!-- ===== 入场动画：法阵展开（0.2s ~ 0.8s）===== -->
    <!-- 地面层 - 3D倾斜地面平面 -->
    <div class="sdb-ground-plane">
      <!-- 领域法阵 - 地面展开的旋转风暴法阵 -->
      <div class="sdb-magic-circle">
        <div class="sdb-circle-outer"></div>
        <div class="sdb-circle-mid"></div>
        <div class="sdb-circle-inner"></div>
      </div>

      <!-- 领域波纹 - 从中心向外扩散的翠青光环（入场一次性） -->
      <div class="sdb-domain-ring ring-1"></div>
      <div class="sdb-domain-ring ring-2"></div>
      <div class="sdb-domain-ring ring-3"></div>

      <!-- 地面领域辉光 - 法阵中心的翠青光池 -->
      <div class="sdb-ground-glow"></div>
    </div>

    <!-- 双刀引导 - 双刀作为领域引导媒介 -->
    <div class="sdb-guide-blade blade-left">
      <div class="sdb-guide-edge"></div>
    </div>
    <div class="sdb-guide-blade blade-right">
      <div class="sdb-guide-edge"></div>
    </div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 风暴领域光晕 - 外层柔和翠青发光氛围（持续显示） -->
    <div class="sdb-aura"></div>

    <!-- 风暴庇护光环主体 - 发光的翠青双色光环边框（持续显示） -->
    <div class="sdb-halo">
      <div class="sdb-halo-field"></div>
      <div class="sdb-halo-border"></div>
    </div>

    <!-- 持续旋转法阵 - 三重环持续旋转（持续显示） -->
    <div class="sdb-rotate-ring rotate-outer"></div>
    <div class="sdb-rotate-ring rotate-mid"></div>
    <div class="sdb-rotate-ring rotate-inner"></div>

    <!-- 环绕风粒 - 沿光环周围环绕流转的翠青光粒（循环） -->
    <div
      v-for="i in 8"
      :key="'sdb-orbit-' + i"
      class="sdb-orbit-particle"
      :style="getOrbitStyle(i)"
    ></div>

    <!-- 持续庇护波纹 - 从中心向外扩散的庇护波纹（循环） -->
    <div class="sdb-pulse pulse-1"></div>
    <div class="sdb-pulse pulse-2"></div>

    <!-- 领域核心 - 发光的风暴领域之球，持续脉冲 -->
    <div class="sdb-core">
      <div class="sdb-core-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 风暴领域 - 持久BUFF特效（领域展开·双刀引导·风暴庇护循环）
 * 风暴行者Q技能（storm_walker_q）BUFF持续期间特效
 * 以双刀为引导展开风暴领域庇护全队，持续期间提升全队命中率
 * 以风暴翠青和领域银白为主色调，展现风暴领域展开与庇护全队的防御视觉效果
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
    '--sdb-inhale-angle': `${angle}deg`,
    '--sdb-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算环绕风粒的样式（持续循环）
 * 8个粒子沿光环周围以不同角度环绕流转
 * @param {number} index - 粒子索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getOrbitStyle (index) {
  const angle = (index - 1) * 45
  const delay = (index - 1) * 0.4
  const size = 4 + (index % 2) * 2
  return {
    '--sdb-orbit-angle': `${angle}deg`,
    '--sdb-orbit-size': `${size}px`,
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
   风暴领域 (storm_walker_q) - 持久BUFF特效
   技能描述：以双刀为引导展开风暴领域庇护全队，持续期间提升全队命中率
   色彩方案：风暴翠青(#64FFC8) + 领域银白(#E8FFF8) + 庇护金白(#FFFFF0) + 深邃风暴青(#2A8A6A)
   GPU加速：contain隔离 + will-change + translate3d
   ================================================================ */

/* BUFF舞台 - 定位容器 */
.sdb-buff-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：领域展开（0s ~ 0.5s）---------- */

/* 领域暗幕 - 深沉风暴阴霾笼罩 */
.sdb-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(3, 35, 25, 0.5) 0%,
    rgba(2, 22, 16, 0.3) 45%,
    rgba(1, 12, 8, 0.12) 75%,
    transparent 100%
  );
  animation: sdb-dim 1s ease-out forwards;
  will-change: opacity;
}

@keyframes sdb-dim {
  0% { opacity: 0; }
  10% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 领域全屏闪光 - 展开瞬间的翠青爆闪 */
.sdb-flash {
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
  animation: sdb-flash 0.6s ease-out forwards;
  will-change: opacity;
}

@keyframes sdb-flash {
  0%, 100% { opacity: 0; }
  5% { opacity: 1; }
  12% { opacity: 0.3; }
  20% { opacity: 0.8; }
  40% { opacity: 0.2; }
  80% { opacity: 0; }
}

/* 风能汇聚粒子 - 周围空气被猛烈抽向中心 */
.sdb-inhale-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--sdb-size, 5px);
  height: var(--sdb-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 240, 0.95) 0%,
    rgba(100, 255, 200, 0.7) 45%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(100, 255, 200, 0.5);
  transform: translate(-50%, -50%) rotate(var(--sdb-inhale-angle, 0deg)) translateX(80px) scale(1);
  opacity: 0;
  will-change: transform, opacity;
  animation: sdb-inhale 0.4s ease-in forwards;
}

@keyframes sdb-inhale {
  0% {
    transform: translate(-50%, -50%) rotate(var(--sdb-inhale-angle, 0deg)) translateX(80px) scale(1);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--sdb-inhale-angle, 0deg) + 180deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 入场动画：法阵展开（0.2s ~ 0.8s）---------- */

/* 地面层 - 3D倾斜地面平面 */
.sdb-ground-plane {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%) rotateX(75deg);
  transform-style: preserve-3d;
}

/* 领域法阵 */
.sdb-magic-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 140px;
  height: 140px;
  transform: translate(-50%, -50%) scale(0);
  animation: sdb-circle-appear 0.4s ease-out 0.2s forwards;
  will-change: transform, opacity;
}

@keyframes sdb-circle-appear {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  60% {
    transform: translate(-50%, -50%) scale(1.1) rotate(20deg);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1) rotate(30deg);
    opacity: 0.9;
  }
}

/* 外环 */
.sdb-circle-outer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(100, 255, 200, 0.8);
  box-shadow:
    0 0 12px rgba(100, 255, 200, 0.6),
    inset 0 0 12px rgba(50, 200, 150, 0.3);
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(100, 255, 200, 0.15) 2deg,
    transparent 4deg,
    transparent 12deg,
    rgba(50, 200, 150, 0.1) 14deg,
    transparent 16deg
  );
  animation: sdb-spin-cw 3s linear 0.2s infinite;
  will-change: transform;
}

@keyframes sdb-spin-cw {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 中环 */
.sdb-circle-mid {
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  border: 2px solid rgba(50, 200, 150, 0.7);
  box-shadow:
    0 0 10px rgba(50, 200, 150, 0.5),
    inset 0 0 10px rgba(100, 255, 200, 0.2);
  background: repeating-conic-gradient(
    from 15deg,
    transparent 0deg,
    rgba(50, 200, 150, 0.12) 3deg,
    transparent 6deg,
    transparent 18deg
  );
  animation: sdb-spin-ccw 2.5s linear 0.2s infinite;
  will-change: transform;
}

@keyframes sdb-spin-ccw {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

/* 内环 */
.sdb-circle-inner {
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 240, 0.6);
  box-shadow:
    0 0 8px rgba(100, 255, 200, 0.4),
    inset 0 0 8px rgba(50, 200, 150, 0.2);
  animation: sdb-spin-cw 1.5s linear 0.2s infinite;
  will-change: transform;
}

/* 领域波纹 - 从中心向外扩散的翠青光环（入场一次性） */
.sdb-domain-ring {
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
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.sdb-domain-ring.ring-1 { animation: sdb-domain-ring 0.7s ease-out 0.2s forwards; }
.sdb-domain-ring.ring-2 {
  border-color: rgba(50, 200, 150, 0.7);
  animation: sdb-domain-ring 0.8s ease-out 0.35s forwards;
}
.sdb-domain-ring.ring-3 {
  border-color: rgba(255, 255, 240, 0.5);
  animation: sdb-domain-ring 0.9s ease-out 0.5s forwards;
}

@keyframes sdb-domain-ring {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; }
  100% {
    transform: translate(-50%, -50%) scale(5);
    opacity: 0;
  }
}

/* 地面领域辉光 - 法阵中心的翠青光池 */
.sdb-ground-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 240, 0.5) 0%,
    rgba(100, 255, 200, 0.35) 30%,
    rgba(50, 200, 150, 0.2) 60%,
    transparent 85%
  );
  transform: translate(-50%, -50%) scale(0);
  animation: sdb-ground-glow 1.5s ease-out 0.2s forwards;
  will-change: transform, opacity;
}

@keyframes sdb-ground-glow {
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
    opacity: 0.7;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.5;
  }
}

/* 双刀引导 - 双刀作为领域引导媒介（入场一次性） */
.sdb-guide-blade {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 3px;
  transform: translate3d(-50%, -50%, 0) scaleX(0);
  will-change: transform, opacity;
  opacity: 0;
  backface-visibility: hidden;
}

.sdb-guide-blade.blade-left {
  animation: sdb-guide-left 0.5s ease-out 0.25s forwards;
}

.sdb-guide-blade.blade-right {
  animation: sdb-guide-right 0.5s ease-out 0.25s forwards;
}

@keyframes sdb-guide-left {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(35deg) translateX(-40px) scaleX(0);
    opacity: 0;
  }
  40% { opacity: 0.8; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(35deg) translateX(0) scaleX(1);
    opacity: 0.6;
  }
}

@keyframes sdb-guide-right {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(-35deg) translateX(40px) scaleX(0);
    opacity: 0;
  }
  40% { opacity: 0.8; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(-35deg) translateX(0) scaleX(1);
    opacity: 0.6;
  }
}

/* 引导刀锋 - 翠青锐利光带 */
.sdb-guide-edge {
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

/* ---------- 持续循环动画 ---------- */

/* 风暴领域光晕 - 外层柔和翠青发光氛围（持续显示） */
.sdb-aura {
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
  animation: sdb-aura-in 0.4s ease-out 0.8s forwards,
             sdb-aura-pulse 3s ease-in-out 1.2s infinite;
  will-change: opacity, transform;
}

@keyframes sdb-aura-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes sdb-aura-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.06); }
}

/* 风暴庇护光环主体 */
.sdb-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 85%;
  height: 85%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: sdb-halo-in 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) 0.8s forwards;
  will-change: transform, opacity;
}

@keyframes sdb-halo-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 */
.sdb-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(100, 255, 200, 0.12) 0%,
    rgba(50, 200, 150, 0.06) 50%,
    transparent 80%
  );
  animation: sdb-field-pulse 2.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes sdb-field-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 旋转的翠青双色 conic 边框 */
.sdb-halo-border {
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
  animation: sdb-border-glow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes sdb-border-glow {
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

/* 持续旋转法阵 - 三重环持续旋转（持续显示） */
.sdb-rotate-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  opacity: 0;
}

.sdb-rotate-ring.rotate-outer {
  width: 75%;
  height: 75%;
  border: 1px dashed rgba(100, 255, 200, 0.35);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(100, 255, 200, 0.15) 30deg,
    transparent 60deg,
    rgba(50, 200, 150, 0.12) 120deg,
    transparent 150deg,
    rgba(255, 255, 240, 0.14) 210deg,
    transparent 240deg,
    rgba(100, 255, 200, 0.15) 300deg,
    transparent 360deg
  );
  box-shadow: 0 0 5px rgba(100, 255, 200, 0.2);
  animation: sdb-rotate-outer-appear 0.3s ease-out 0.8s forwards,
             sdb-rotate-outer-spin 4s linear 1.1s infinite;
}

@keyframes sdb-rotate-outer-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.6; }
}

@keyframes sdb-rotate-outer-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.6; }
}

.sdb-rotate-ring.rotate-mid {
  width: 55%;
  height: 55%;
  border: 1px solid rgba(50, 200, 150, 0.2);
  background: conic-gradient(
    from 180deg,
    transparent 0deg,
    rgba(50, 200, 150, 0.12) 45deg,
    transparent 90deg,
    rgba(100, 255, 200, 0.12) 180deg,
    transparent 225deg,
    rgba(255, 255, 240, 0.13) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 5px rgba(50, 200, 150, 0.1);
  animation: sdb-rotate-mid-appear 0.3s ease-out 0.9s forwards,
             sdb-rotate-mid-spin 3s linear 1.2s infinite;
}

@keyframes sdb-rotate-mid-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.5; }
}

@keyframes sdb-rotate-mid-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.5; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0.5; }
}

.sdb-rotate-ring.rotate-inner {
  width: 35%;
  height: 35%;
  border: 1px solid rgba(255, 255, 240, 0.2);
  background: conic-gradient(
    from 90deg,
    transparent 0deg,
    rgba(255, 255, 240, 0.1) 60deg,
    transparent 120deg,
    rgba(100, 255, 200, 0.1) 240deg,
    transparent 300deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 4px rgba(100, 255, 200, 0.1);
  animation: sdb-rotate-inner-appear 0.3s ease-out 1.0s forwards,
             sdb-rotate-inner-spin 2s linear 1.3s infinite;
}

@keyframes sdb-rotate-inner-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.5; }
}

@keyframes sdb-rotate-inner-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.5; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.5; }
}

/* 环绕风粒 - 沿光环周围环绕流转的翠青光粒（循环） */
.sdb-orbit-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--sdb-orbit-size, 5px);
  height: var(--sdb-orbit-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 240, 0.95) 0%,
    rgba(100, 255, 200, 0.7) 45%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(100, 255, 200, 0.5);
  transform: translate3d(-50%, -50%, 0) rotate(var(--sdb-orbit-angle, 0deg)) translateX(0) scale(0);
  animation: sdb-orbit 3s linear infinite;
  will-change: transform, opacity;
}

@keyframes sdb-orbit {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sdb-orbit-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  10% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sdb-orbit-angle, 0deg)) translateX(35px) scale(1.2);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--sdb-orbit-angle, 0deg) + 180deg)) translateX(35px) scale(0.9);
    opacity: 0.7;
  }
  90% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--sdb-orbit-angle, 0deg) + 350deg)) translateX(35px) scale(0.8);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--sdb-orbit-angle, 0deg) + 360deg)) translateX(0) scale(0);
    opacity: 0;
  }
}

/* 持续庇护波纹 - 从中心向外扩散的庇护波纹（循环） */
.sdb-pulse {
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

.sdb-pulse.pulse-1 {
  animation: sdb-pulse-expand 1.2s ease-out 0.8s infinite;
  border-color: rgba(255, 255, 240, 0.8);
}
.sdb-pulse.pulse-2 {
  animation: sdb-pulse-expand 1.2s ease-out 1.4s infinite;
  border-color: rgba(50, 200, 150, 0.7);
}

@keyframes sdb-pulse-expand {
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

/* 领域核心 - 发光的风暴领域之球，持续脉冲 */
.sdb-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: sdb-core-in 0.3s ease-out 0.6s forwards,
             sdb-core-pulse 1.5s ease-in-out 0.9s infinite;
  will-change: transform, opacity;
}

@keyframes sdb-core-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes sdb-core-pulse {
  0%, 100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.85;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 1;
  }
}

.sdb-core-inner {
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
  .sdb-buff-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
