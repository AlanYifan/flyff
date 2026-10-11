<!--
  @file MindResonanceBuffEffect.vue
  @generated 2026-08-12
  @description 心灵感应 - 持久BUFF特效（感应展开·心灵谐振·全队庇护循环）
  心灵师Q技能（mind_master_q）BUFF持续期间特效：开启心灵感应场域庇护全队
  持续期间提升全队魔法防御和法术闪避率；EX1额外提升全队物理防御，EX2增加法术暴击伤害，EX3提升攻击力
  BUFF持续期间一直显示，BUFF到期后由父组件通过 v-if 移除
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 1s）- 感应暗幕 + 感应闪光 + 能量汇聚 + 法阵展开
    持续循环 - 感应光环 + 旋转谐振环 + 感应粒子流 + 核心脉动 + 庇护波纹
  色彩方案：心灵粉(#E91E63) + 幻影紫(#AB47BC) + 精神白(#F8BBD0) + 深渊紫(#4A148C)
-->
<template>
  <!-- BUFF舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="mrb-buff-stage" :style="stageStyle">
    <!-- ===== 入场动画：感应展开（0s ~ 0.5s）===== -->
    <!-- 感应暗幕 - 深沉粉色阴霾笼罩 -->
    <div class="mrb-dim"></div>

    <!-- 感应闪光 - 展开瞬间的粉色爆闪 -->
    <div class="mrb-flash"></div>

    <!-- 能量汇聚粒子 - 周围心灵能量向中心汇聚 -->
    <div
      v-for="i in 10"
      :key="'mrb-inhale-' + i"
      class="mrb-inhale-particle"
      :style="getInhaleStyle(i)"
    ></div>

    <!-- ===== 入场动画：法阵展开（0.2s ~ 0.8s）===== -->
    <!-- 地面层 - 3D倾斜地面平面 -->
    <div class="mrb-ground-plane">
      <!-- 感应法阵 - 地面展开的旋转粉色法阵 -->
      <div class="mrb-magic-circle">
        <div class="mrb-circle-outer"></div>
        <div class="mrb-circle-mid"></div>
        <div class="mrb-circle-inner"></div>
      </div>

      <!-- 感应波纹 - 从中心向外扩散的粉色光环（入场一次性） -->
      <div class="mrb-domain-ring ring-1"></div>
      <div class="mrb-domain-ring ring-2"></div>
      <div class="mrb-domain-ring ring-3"></div>

      <!-- 地面感应辉光 - 法阵中心的粉色光池 -->
      <div class="mrb-ground-glow"></div>
    </div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 感应光环 - 外层柔和粉色发光氛围（持续显示） -->
    <div class="mrb-aura"></div>

    <!-- 感应庇护主体 - 发光的粉色双色光环边框（持续显示） -->
    <div class="mrb-halo">
      <div class="mrb-halo-field"></div>
      <div class="mrb-halo-border"></div>
    </div>

    <!-- 持续旋转谐振环 - 三重环持续旋转（持续显示） -->
    <div class="mrb-rotate-ring rotate-outer"></div>
    <div class="mrb-rotate-ring rotate-mid"></div>
    <div class="mrb-rotate-ring rotate-inner"></div>

    <!-- 感应粒子流 - 沿光环周围环绕流转的粉色光粒（循环） -->
    <div
      v-for="i in 8"
      :key="'mrb-orbit-' + i"
      class="mrb-orbit-particle"
      :style="getOrbitStyle(i)"
    ></div>

    <!-- 持续庇护波纹 - 从中心向外扩散的庇护波纹（循环） -->
    <div class="mrb-pulse pulse-1"></div>
    <div class="mrb-pulse pulse-2"></div>

    <!-- 感应核心 - 发光的心灵感应之球，持续脉冲 -->
    <div class="mrb-core">
      <div class="mrb-core-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 心灵感应 - 持久BUFF特效（感应展开·心灵谐振·全队庇护循环）
 * 心灵师Q技能（mind_master_q）BUFF持续期间特效
 * 开启心灵感应场域庇护全队，持续期间提升全队魔法防御和法术闪避率
 * 以心灵粉和幻影紫为主色调，展现心灵感应场域展开与全队庇护的视觉效果
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
 * 计算能量汇聚粒子的样式（入场一次性）
 * @param {number} index - 粒子索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getInhaleStyle (index) {
  const angle = (index - 1) * 36
  const delay = (index - 1) * 0.03
  const size = 4 + (index % 2) * 2
  return {
    '--mrb-inhale-angle': `${angle}deg`,
    '--mrb-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算感应粒子流的样式（持续循环）
 * 8个粒子沿光环周围以不同角度环绕流转
 * @param {number} index - 粒子索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getOrbitStyle (index) {
  const angle = (index - 1) * 45
  const delay = (index - 1) * 0.4
  const size = 4 + (index % 2) * 2
  return {
    '--mrb-orbit-angle': `${angle}deg`,
    '--mrb-orbit-size': `${size}px`,
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
   心灵感应 (mind_master_q) - 持久BUFF特效
   技能描述：开启心灵感应场域庇护全队，持续期间提升全队魔法防御和法术闪避率
   色彩方案：心灵粉(#E91E63) + 幻影紫(#AB47BC) + 精神白(#F8BBD0) + 深渊紫(#4A148C)
   GPU加速：contain隔离 + will-change + translate3d
   ================================================================ */

/* BUFF舞台 - 定位容器 */
.mrb-buff-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：感应展开（0s ~ 0.5s）---------- */

/* 感应暗幕 - 深沉粉色阴霾笼罩 */
.mrb-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(74, 20, 140, 0.5) 0%,
    rgba(50, 10, 100, 0.3) 45%,
    rgba(30, 0, 60, 0.12) 75%,
    transparent 100%
  );
  animation: mrb-dim 1s ease-out forwards;
  will-change: opacity;
}

@keyframes mrb-dim {
  0% { opacity: 0; }
  10% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 感应闪光 - 展开瞬间的粉色爆闪 */
.mrb-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(248, 187, 208, 0.9) 0%,
    rgba(233, 30, 99, 0.5) 20%,
    rgba(171, 71, 188, 0.25) 45%,
    transparent 75%
  );
  opacity: 0;
  animation: mrb-flash 0.6s ease-out forwards;
  will-change: opacity;
}

@keyframes mrb-flash {
  0%, 100% { opacity: 0; }
  5% { opacity: 1; }
  12% { opacity: 0.3; }
  20% { opacity: 0.8; }
  40% { opacity: 0.2; }
  80% { opacity: 0; }
}

/* 能量汇聚粒子 - 周围心灵能量向中心汇聚 */
.mrb-inhale-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--mrb-size, 5px);
  height: var(--mrb-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(248, 187, 208, 0.95) 0%,
    rgba(233, 30, 99, 0.7) 45%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(233, 30, 99, 0.5);
  transform: translate(-50%, -50%) rotate(var(--mrb-inhale-angle, 0deg)) translateX(80px) scale(1);
  opacity: 0;
  will-change: transform, opacity;
  animation: mrb-inhale 0.4s ease-in forwards;
}

@keyframes mrb-inhale {
  0% {
    transform: translate(-50%, -50%) rotate(var(--mrb-inhale-angle, 0deg)) translateX(80px) scale(1);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--mrb-inhale-angle, 0deg) + 180deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 入场动画：法阵展开（0.2s ~ 0.8s）---------- */

/* 地面层 - 3D倾斜地面平面 */
.mrb-ground-plane {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%) rotateX(75deg);
  transform-style: preserve-3d;
}

/* 感应法阵 */
.mrb-magic-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 140px;
  height: 140px;
  transform: translate(-50%, -50%) scale(0);
  animation: mrb-circle-appear 0.4s ease-out 0.2s forwards;
  will-change: transform, opacity;
}

@keyframes mrb-circle-appear {
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
.mrb-circle-outer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(233, 30, 99, 0.8);
  box-shadow:
    0 0 12px rgba(233, 30, 99, 0.6),
    inset 0 0 12px rgba(171, 71, 188, 0.3);
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(233, 30, 99, 0.15) 2deg,
    transparent 4deg,
    transparent 12deg,
    rgba(171, 71, 188, 0.1) 14deg,
    transparent 16deg
  );
  animation: mrb-spin-cw 3s linear 0.2s infinite;
  will-change: transform;
}

@keyframes mrb-spin-cw {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 中环 */
.mrb-circle-mid {
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  border: 2px solid rgba(171, 71, 188, 0.7);
  box-shadow:
    0 0 10px rgba(171, 71, 188, 0.5),
    inset 0 0 10px rgba(233, 30, 99, 0.2);
  background: repeating-conic-gradient(
    from 15deg,
    transparent 0deg,
    rgba(171, 71, 188, 0.12) 3deg,
    transparent 6deg,
    transparent 18deg
  );
  animation: mrb-spin-ccw 2.5s linear 0.2s infinite;
  will-change: transform;
}

@keyframes mrb-spin-ccw {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

/* 内环 */
.mrb-circle-inner {
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  border: 1px solid rgba(248, 187, 208, 0.6);
  box-shadow:
    0 0 8px rgba(233, 30, 99, 0.4),
    inset 0 0 8px rgba(171, 71, 188, 0.2);
  animation: mrb-spin-cw 1.5s linear 0.2s infinite;
  will-change: transform;
}

/* 感应波纹 - 从中心向外扩散的粉色光环（入场一次性） */
.mrb-domain-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid rgba(233, 30, 99, 0.8);
  box-shadow:
    0 0 12px rgba(233, 30, 99, 0.6),
    inset 0 0 10px rgba(171, 71, 188, 0.4);
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.mrb-domain-ring.ring-1 { animation: mrb-domain-ring 0.7s ease-out 0.2s forwards; }
.mrb-domain-ring.ring-2 {
  border-color: rgba(171, 71, 188, 0.7);
  animation: mrb-domain-ring 0.8s ease-out 0.35s forwards;
}
.mrb-domain-ring.ring-3 {
  border-color: rgba(248, 187, 208, 0.5);
  animation: mrb-domain-ring 0.9s ease-out 0.5s forwards;
}

@keyframes mrb-domain-ring {
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

/* 地面感应辉光 - 法阵中心的粉色光池 */
.mrb-ground-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(248, 187, 208, 0.5) 0%,
    rgba(233, 30, 99, 0.35) 30%,
    rgba(171, 71, 188, 0.2) 60%,
    transparent 85%
  );
  transform: translate(-50%, -50%) scale(0);
  animation: mrb-ground-glow 1.5s ease-out 0.2s forwards;
  will-change: transform, opacity;
}

@keyframes mrb-ground-glow {
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

/* ---------- 持续循环动画 ---------- */

/* 感应光环 - 外层柔和粉色发光氛围（持续显示） */
.mrb-aura {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 50%,
    rgba(233, 30, 99, 0.08) 65%,
    rgba(171, 71, 188, 0.05) 80%,
    transparent 100%
  );
  opacity: 0;
  animation: mrb-aura-in 0.4s ease-out 0.8s forwards,
             mrb-aura-pulse 3s ease-in-out 1.2s infinite;
  will-change: opacity, transform;
}

@keyframes mrb-aura-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes mrb-aura-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.06); }
}

/* 感应庇护主体 */
.mrb-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 85%;
  height: 85%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: mrb-halo-in 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) 0.8s forwards;
  will-change: transform, opacity;
}

@keyframes mrb-halo-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 */
.mrb-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(233, 30, 99, 0.12) 0%,
    rgba(171, 71, 188, 0.06) 50%,
    transparent 80%
  );
  animation: mrb-field-pulse 2.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes mrb-field-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 旋转的粉色双色 conic 边框 */
.mrb-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(233, 30, 99, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(233, 30, 99, 0.5) 0deg,
    rgba(171, 71, 188, 0.35) 60deg,
    rgba(233, 30, 99, 0.5) 120deg,
    rgba(171, 71, 188, 0.35) 180deg,
    rgba(233, 30, 99, 0.5) 240deg,
    rgba(171, 71, 188, 0.35) 300deg,
    rgba(233, 30, 99, 0.5) 360deg
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
    0 0 10px rgba(233, 30, 99, 0.5),
    inset 0 0 10px rgba(171, 71, 188, 0.2);
  animation: mrb-border-glow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes mrb-border-glow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 10px rgba(233, 30, 99, 0.5),
      inset 0 0 10px rgba(171, 71, 188, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 14px rgba(233, 30, 99, 0.8),
      0 0 7px rgba(248, 187, 208, 0.3),
      inset 0 0 7px rgba(248, 187, 208, 0.3);
  }
}

/* 持续旋转谐振环 - 三重环持续旋转（持续显示） */
.mrb-rotate-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  opacity: 0;
}

.mrb-rotate-ring.rotate-outer {
  width: 75%;
  height: 75%;
  border: 1px dashed rgba(233, 30, 99, 0.35);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(233, 30, 99, 0.15) 30deg,
    transparent 60deg,
    rgba(171, 71, 188, 0.12) 120deg,
    transparent 150deg,
    rgba(233, 30, 99, 0.14) 210deg,
    transparent 240deg,
    rgba(233, 30, 99, 0.15) 300deg,
    transparent 360deg
  );
  box-shadow: 0 0 5px rgba(233, 30, 99, 0.2);
  animation: mrb-rotate-outer-appear 0.3s ease-out 0.8s forwards,
             mrb-rotate-outer-spin 4s linear 1.1s infinite;
}

@keyframes mrb-rotate-outer-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.6; }
}

@keyframes mrb-rotate-outer-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.6; }
}

.mrb-rotate-ring.rotate-mid {
  width: 55%;
  height: 55%;
  border: 1px solid rgba(171, 71, 188, 0.2);
  background: conic-gradient(
    from 180deg,
    transparent 0deg,
    rgba(171, 71, 188, 0.12) 45deg,
    transparent 90deg,
    rgba(233, 30, 99, 0.12) 180deg,
    transparent 225deg,
    rgba(233, 30, 99, 0.13) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 5px rgba(171, 71, 188, 0.1);
  animation: mrb-rotate-mid-appear 0.3s ease-out 0.9s forwards,
             mrb-rotate-mid-spin 3s linear 1.2s infinite;
}

@keyframes mrb-rotate-mid-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.5; }
}

@keyframes mrb-rotate-mid-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.5; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0.5; }
}

.mrb-rotate-ring.rotate-inner {
  width: 35%;
  height: 35%;
  border: 1px solid rgba(248, 187, 208, 0.2);
  background: conic-gradient(
    from 90deg,
    transparent 0deg,
    rgba(248, 187, 208, 0.1) 60deg,
    transparent 120deg,
    rgba(233, 30, 99, 0.1) 240deg,
    transparent 300deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 4px rgba(233, 30, 99, 0.1);
  animation: mrb-rotate-inner-appear 0.3s ease-out 1.0s forwards,
             mrb-rotate-inner-spin 2s linear 1.3s infinite;
}

@keyframes mrb-rotate-inner-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.5; }
}

@keyframes mrb-rotate-inner-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.5; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.5; }
}

/* 感应粒子流 - 沿光环周围环绕流转的粉色光粒（循环） */
.mrb-orbit-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--mrb-orbit-size, 5px);
  height: var(--mrb-orbit-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(248, 187, 208, 0.95) 0%,
    rgba(233, 30, 99, 0.7) 45%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(233, 30, 99, 0.5);
  transform: translate3d(-50%, -50%, 0) rotate(var(--mrb-orbit-angle, 0deg)) translateX(0) scale(0);
  animation: mrb-orbit 3s linear infinite;
  will-change: transform, opacity;
}

@keyframes mrb-orbit {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--mrb-orbit-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  10% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--mrb-orbit-angle, 0deg)) translateX(35px) scale(1.2);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--mrb-orbit-angle, 0deg) + 180deg)) translateX(35px) scale(0.9);
    opacity: 0.7;
  }
  90% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--mrb-orbit-angle, 0deg) + 350deg)) translateX(35px) scale(0.8);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--mrb-orbit-angle, 0deg) + 360deg)) translateX(0) scale(0);
    opacity: 0;
  }
}

/* 持续庇护波纹 - 从中心向外扩散的庇护波纹（循环） */
.mrb-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20%;
  height: 20%;
  border-radius: 50%;
  border: 2px solid rgba(233, 30, 99, 0.6);
  background: transparent;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.mrb-pulse.pulse-1 {
  animation: mrb-pulse-expand 1.2s ease-out 0.8s infinite;
  border-color: rgba(248, 187, 208, 0.8);
}
.mrb-pulse.pulse-2 {
  animation: mrb-pulse-expand 1.2s ease-out 1.4s infinite;
  border-color: rgba(171, 71, 188, 0.7);
}

@keyframes mrb-pulse-expand {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
  }
  20% { opacity: 0.8; }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
    border-color: rgba(171, 71, 188, 0.1);
  }
}

/* 感应核心 - 发光的心灵感应之球，持续脉冲 */
.mrb-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: mrb-core-in 0.3s ease-out 0.6s forwards,
             mrb-core-pulse 1.5s ease-in-out 0.9s infinite;
  will-change: transform, opacity;
}

@keyframes mrb-core-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes mrb-core-pulse {
  0%, 100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.85;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 1;
  }
}

.mrb-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(248, 187, 208, 0.95) 20%,
    rgba(233, 30, 99, 0.85) 50%,
    rgba(171, 71, 188, 0.5) 80%,
    transparent 100%
  );
  box-shadow:
    0 0 8px rgba(233, 30, 99, 0.9),
    0 0 16px rgba(233, 30, 99, 0.5),
    0 0 24px rgba(171, 71, 188, 0.3);
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .mrb-buff-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
