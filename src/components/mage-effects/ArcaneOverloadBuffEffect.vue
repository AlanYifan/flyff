<!--
  @file ArcaneOverloadBuffEffect.vue
  @generated 2026-08-12
  @description 奥术超载 - 持久BUFF特效（超载觉醒·奥术涌动·法力护盾循环）
  奥术师R技能（arcane_master_r）BUFF持续期间特效：奥术能量超限释放进入超载状态
  持续期间大幅提升法术攻击力和全元素攻击力；EX1额外获得法力护盾，EX2增加暴击伤害，EX3获得法术反弹
  BUFF持续期间一直显示，BUFF到期后由父组件通过 v-if 移除
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 1s）- 超载暗幕 + 超载闪光 + 能量爆发 + 法阵展开
    持续循环 - 超载光环 + 旋转能量环 + 涌动粒子 + 核心脉动 + 护盾波纹
  色彩方案：超载紫(#9D4EDD) + 能量洋红(#FF006E) + 法力蓝(#00B4D8) + 深渊紫(#3C096C)
-->
<template>
  <!-- BUFF舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="aob-buff-stage" :style="stageStyle">
    <!-- ===== 入场动画：超载觉醒（0s ~ 0.5s）===== -->
    <!-- 超载暗幕 - 深沉紫色阴霾笼罩 -->
    <div class="aob-dim"></div>

    <!-- 超载闪光 - 觉醒瞬间的紫色爆闪 -->
    <div class="aob-flash"></div>

    <!-- 能量爆发粒子 - 奥术能量从中心爆发 -->
    <div
      v-for="i in 10"
      :key="'aob-burst-' + i"
      class="aob-burst-particle"
      :style="getBurstStyle(i)"
    ></div>

    <!-- ===== 入场动画：法阵展开（0.2s ~ 0.8s）===== -->
    <!-- 地面层 - 3D倾斜地面平面 -->
    <div class="aob-ground-plane">
      <!-- 超载法阵 - 地面展开的旋转紫色法阵 -->
      <div class="aob-magic-circle">
        <div class="aob-circle-outer"></div>
        <div class="aob-circle-mid"></div>
        <div class="aob-circle-inner"></div>
      </div>

      <!-- 超载波纹 - 从中心向外扩散的紫色光环（入场一次性） -->
      <div class="aob-domain-ring ring-1"></div>
      <div class="aob-domain-ring ring-2"></div>
      <div class="aob-domain-ring ring-3"></div>

      <!-- 地面超载辉光 - 法阵中心的紫色光池 -->
      <div class="aob-ground-glow"></div>
    </div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 超载光环 - 外层柔和紫色发光氛围（持续显示） -->
    <div class="aob-aura"></div>

    <!-- 超载护盾主体 - 发光的紫色双色光环边框（持续显示） -->
    <div class="aob-halo">
      <div class="aob-halo-field"></div>
      <div class="aob-halo-border"></div>
    </div>

    <!-- 持续旋转能量环 - 三重环持续旋转（持续显示） -->
    <div class="aob-rotate-ring rotate-outer"></div>
    <div class="aob-rotate-ring rotate-mid"></div>
    <div class="aob-rotate-ring rotate-inner"></div>

    <!-- 涌动粒子 - 沿光环周围环绕流转的紫色光粒（循环） -->
    <div
      v-for="i in 8"
      :key="'aob-orbit-' + i"
      class="aob-orbit-particle"
      :style="getOrbitStyle(i)"
    ></div>

    <!-- 持续护盾波纹 - 从中心向外扩散的护盾波纹（循环） -->
    <div class="aob-pulse pulse-1"></div>
    <div class="aob-pulse pulse-2"></div>

    <!-- 超载核心 - 发光的奥术超载之球，持续脉冲 -->
    <div class="aob-core">
      <div class="aob-core-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 奥术超载 - 持久BUFF特效（超载觉醒·奥术涌动·法力护盾循环）
 * 奥术师R技能（arcane_master_r）BUFF持续期间特效
 * 奥术能量超限释放进入超载状态，持续期间大幅提升法术攻击力和全元素攻击力
 * 以超载紫和能量洋红为主色调，展现奥术超载的爆发与持续涌动视觉效果
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
 * 计算能量爆发粒子的样式（入场一次性）
 * @param {number} index - 粒子索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getBurstStyle (index) {
  const angle = (index - 1) * 36
  const delay = (index - 1) * 0.03
  const size = 4 + (index % 2) * 2
  return {
    '--aob-burst-angle': `${angle}deg`,
    '--aob-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算涌动粒子的样式（持续循环）
 * 8个粒子沿光环周围以不同角度环绕流转
 * @param {number} index - 粒子索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getOrbitStyle (index) {
  const angle = (index - 1) * 45
  const delay = (index - 1) * 0.4
  const size = 4 + (index % 2) * 2
  return {
    '--aob-orbit-angle': `${angle}deg`,
    '--aob-orbit-size': `${size}px`,
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
   奥术超载 (arcane_master_r) - 持久BUFF特效
   技能描述：奥术能量超限释放，进入超载状态，持续期间大幅提升法术攻击力和全元素攻击力
   色彩方案：超载紫(#9D4EDD) + 能量洋红(#FF006E) + 法力蓝(#00B4D8) + 深渊紫(#3C096C)
   GPU加速：contain隔离 + will-change + translate3d
   ================================================================ */

/* BUFF舞台 - 定位容器 */
.aob-buff-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：超载觉醒（0s ~ 0.5s）---------- */

/* 超载暗幕 - 深沉紫色阴霾笼罩 */
.aob-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(60, 9, 108, 0.5) 0%,
    rgba(36, 0, 70, 0.3) 45%,
    rgba(16, 0, 43, 0.12) 75%,
    transparent 100%
  );
  animation: aob-dim 1s ease-out forwards;
  will-change: opacity;
}

@keyframes aob-dim {
  0% { opacity: 0; }
  10% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 超载闪光 - 觉醒瞬间的紫色爆闪 */
.aob-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(255, 0, 110, 0.9) 0%,
    rgba(157, 78, 221, 0.5) 20%,
    rgba(60, 9, 108, 0.25) 45%,
    transparent 75%
  );
  opacity: 0;
  animation: aob-flash 0.6s ease-out forwards;
  will-change: opacity;
}

@keyframes aob-flash {
  0%, 100% { opacity: 0; }
  5% { opacity: 1; }
  12% { opacity: 0.3; }
  20% { opacity: 0.8; }
  40% { opacity: 0.2; }
  80% { opacity: 0; }
}

/* 能量爆发粒子 - 奥术能量从中心爆发 */
.aob-burst-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--aob-size, 5px);
  height: var(--aob-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 0, 110, 0.95) 0%,
    rgba(157, 78, 221, 0.7) 45%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(157, 78, 221, 0.5);
  transform: translate(-50%, -50%) rotate(var(--aob-burst-angle, 0deg)) translateX(0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: aob-burst 0.4s ease-out forwards;
}

@keyframes aob-burst {
  0% {
    transform: translate(-50%, -50%) rotate(var(--aob-burst-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--aob-burst-angle, 0deg) + 180deg)) translateX(60px) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 入场动画：法阵展开（0.2s ~ 0.8s）---------- */

/* 地面层 - 3D倾斜地面平面 */
.aob-ground-plane {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%) rotateX(75deg);
  transform-style: preserve-3d;
}

/* 超载法阵 */
.aob-magic-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 140px;
  height: 140px;
  transform: translate(-50%, -50%) scale(0);
  animation: aob-circle-appear 0.4s ease-out 0.2s forwards;
  will-change: transform, opacity;
}

@keyframes aob-circle-appear {
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
.aob-circle-outer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(157, 78, 221, 0.8);
  box-shadow:
    0 0 12px rgba(157, 78, 221, 0.6),
    inset 0 0 12px rgba(90, 24, 154, 0.3);
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(157, 78, 221, 0.15) 2deg,
    transparent 4deg,
    transparent 12deg,
    rgba(255, 0, 110, 0.1) 14deg,
    transparent 16deg
  );
  animation: aob-spin-cw 3s linear 0.2s infinite;
  will-change: transform;
}

@keyframes aob-spin-cw {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 中环 */
.aob-circle-mid {
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  border: 2px solid rgba(90, 24, 154, 0.7);
  box-shadow:
    0 0 10px rgba(90, 24, 154, 0.5),
    inset 0 0 10px rgba(157, 78, 221, 0.2);
  background: repeating-conic-gradient(
    from 15deg,
    transparent 0deg,
    rgba(90, 24, 154, 0.12) 3deg,
    transparent 6deg,
    transparent 18deg
  );
  animation: aob-spin-ccw 2.5s linear 0.2s infinite;
  will-change: transform;
}

@keyframes aob-spin-ccw {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

/* 内环 */
.aob-circle-inner {
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  border: 1px solid rgba(255, 0, 110, 0.6);
  box-shadow:
    0 0 8px rgba(255, 0, 110, 0.4),
    inset 0 0 8px rgba(157, 78, 221, 0.2);
  animation: aob-spin-cw 1.5s linear 0.2s infinite;
  will-change: transform;
}

/* 超载波纹 - 从中心向外扩散的紫色光环（入场一次性） */
.aob-domain-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid rgba(157, 78, 221, 0.8);
  box-shadow:
    0 0 12px rgba(157, 78, 221, 0.6),
    inset 0 0 10px rgba(90, 24, 154, 0.4);
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.aob-domain-ring.ring-1 { animation: aob-domain-ring 0.7s ease-out 0.2s forwards; }
.aob-domain-ring.ring-2 {
  border-color: rgba(90, 24, 154, 0.7);
  animation: aob-domain-ring 0.8s ease-out 0.35s forwards;
}
.aob-domain-ring.ring-3 {
  border-color: rgba(255, 0, 110, 0.5);
  animation: aob-domain-ring 0.9s ease-out 0.5s forwards;
}

@keyframes aob-domain-ring {
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

/* 地面超载辉光 - 法阵中心的紫色光池 */
.aob-ground-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 0, 110, 0.5) 0%,
    rgba(157, 78, 221, 0.35) 30%,
    rgba(90, 24, 154, 0.2) 60%,
    transparent 85%
  );
  transform: translate(-50%, -50%) scale(0);
  animation: aob-ground-glow 1.5s ease-out 0.2s forwards;
  will-change: transform, opacity;
}

@keyframes aob-ground-glow {
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

/* 超载光环 - 外层柔和紫色发光氛围（持续显示） */
.aob-aura {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 50%,
    rgba(157, 78, 221, 0.08) 65%,
    rgba(90, 24, 154, 0.05) 80%,
    transparent 100%
  );
  opacity: 0;
  animation: aob-aura-in 0.4s ease-out 0.8s forwards,
             aob-aura-pulse 3s ease-in-out 1.2s infinite;
  will-change: opacity, transform;
}

@keyframes aob-aura-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes aob-aura-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.06); }
}

/* 超载护盾主体 */
.aob-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 85%;
  height: 85%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: aob-halo-in 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) 0.8s forwards;
  will-change: transform, opacity;
}

@keyframes aob-halo-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 */
.aob-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(157, 78, 221, 0.12) 0%,
    rgba(90, 24, 154, 0.06) 50%,
    transparent 80%
  );
  animation: aob-field-pulse 2.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes aob-field-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 旋转的紫色双色 conic 边框 */
.aob-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(157, 78, 221, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(157, 78, 221, 0.5) 0deg,
    rgba(90, 24, 154, 0.35) 60deg,
    rgba(255, 0, 110, 0.5) 120deg,
    rgba(157, 78, 221, 0.35) 180deg,
    rgba(90, 24, 154, 0.5) 240deg,
    rgba(255, 0, 110, 0.35) 300deg,
    rgba(157, 78, 221, 0.5) 360deg
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
    0 0 10px rgba(157, 78, 221, 0.5),
    inset 0 0 10px rgba(90, 24, 154, 0.2);
  animation: aob-border-glow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes aob-border-glow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 10px rgba(157, 78, 221, 0.5),
      inset 0 0 10px rgba(90, 24, 154, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 14px rgba(157, 78, 221, 0.8),
      0 0 7px rgba(255, 0, 110, 0.3),
      inset 0 0 7px rgba(255, 0, 110, 0.3);
  }
}

/* 持续旋转能量环 - 三重环持续旋转（持续显示） */
.aob-rotate-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  opacity: 0;
}

.aob-rotate-ring.rotate-outer {
  width: 75%;
  height: 75%;
  border: 1px dashed rgba(157, 78, 221, 0.35);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(157, 78, 221, 0.15) 30deg,
    transparent 60deg,
    rgba(90, 24, 154, 0.12) 120deg,
    transparent 150deg,
    rgba(255, 0, 110, 0.14) 210deg,
    transparent 240deg,
    rgba(157, 78, 221, 0.15) 300deg,
    transparent 360deg
  );
  box-shadow: 0 0 5px rgba(157, 78, 221, 0.2);
  animation: aob-rotate-outer-appear 0.3s ease-out 0.8s forwards,
             aob-rotate-outer-spin 4s linear 1.1s infinite;
}

@keyframes aob-rotate-outer-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.6; }
}

@keyframes aob-rotate-outer-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.6; }
}

.aob-rotate-ring.rotate-mid {
  width: 55%;
  height: 55%;
  border: 1px solid rgba(90, 24, 154, 0.2);
  background: conic-gradient(
    from 180deg,
    transparent 0deg,
    rgba(90, 24, 154, 0.12) 45deg,
    transparent 90deg,
    rgba(157, 78, 221, 0.12) 180deg,
    transparent 225deg,
    rgba(255, 0, 110, 0.13) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 5px rgba(90, 24, 154, 0.1);
  animation: aob-rotate-mid-appear 0.3s ease-out 0.9s forwards,
             aob-rotate-mid-spin 3s linear 1.2s infinite;
}

@keyframes aob-rotate-mid-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.5; }
}

@keyframes aob-rotate-mid-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.5; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0.5; }
}

.aob-rotate-ring.rotate-inner {
  width: 35%;
  height: 35%;
  border: 1px solid rgba(255, 0, 110, 0.2);
  background: conic-gradient(
    from 90deg,
    transparent 0deg,
    rgba(255, 0, 110, 0.1) 60deg,
    transparent 120deg,
    rgba(157, 78, 221, 0.1) 240deg,
    transparent 300deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 4px rgba(157, 78, 221, 0.1);
  animation: aob-rotate-inner-appear 0.3s ease-out 1.0s forwards,
             aob-rotate-inner-spin 2s linear 1.3s infinite;
}

@keyframes aob-rotate-inner-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.5; }
}

@keyframes aob-rotate-inner-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.5; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.5; }
}

/* 涌动粒子 - 沿光环周围环绕流转的紫色光粒（循环） */
.aob-orbit-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--aob-orbit-size, 5px);
  height: var(--aob-orbit-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 0, 110, 0.95) 0%,
    rgba(157, 78, 221, 0.7) 45%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(157, 78, 221, 0.5);
  transform: translate3d(-50%, -50%, 0) rotate(var(--aob-orbit-angle, 0deg)) translateX(0) scale(0);
  animation: aob-orbit 3s linear infinite;
  will-change: transform, opacity;
}

@keyframes aob-orbit {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--aob-orbit-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  10% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--aob-orbit-angle, 0deg)) translateX(35px) scale(1.2);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--aob-orbit-angle, 0deg) + 180deg)) translateX(35px) scale(0.9);
    opacity: 0.7;
  }
  90% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--aob-orbit-angle, 0deg) + 350deg)) translateX(35px) scale(0.8);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--aob-orbit-angle, 0deg) + 360deg)) translateX(0) scale(0);
    opacity: 0;
  }
}

/* 持续护盾波纹 - 从中心向外扩散的护盾波纹（循环） */
.aob-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20%;
  height: 20%;
  border-radius: 50%;
  border: 2px solid rgba(157, 78, 221, 0.6);
  background: transparent;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.aob-pulse.pulse-1 {
  animation: aob-pulse-expand 1.2s ease-out 0.8s infinite;
  border-color: rgba(255, 0, 110, 0.8);
}
.aob-pulse.pulse-2 {
  animation: aob-pulse-expand 1.2s ease-out 1.4s infinite;
  border-color: rgba(90, 24, 154, 0.7);
}

@keyframes aob-pulse-expand {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
  }
  20% { opacity: 0.8; }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
    border-color: rgba(90, 24, 154, 0.1);
  }
}

/* 超载核心 - 发光的奥术超载之球，持续脉冲 */
.aob-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: aob-core-in 0.3s ease-out 0.6s forwards,
             aob-core-pulse 1.5s ease-in-out 0.9s infinite;
  will-change: transform, opacity;
}

@keyframes aob-core-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes aob-core-pulse {
  0%, 100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.85;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 1;
  }
}

.aob-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 0, 110, 0.95) 20%,
    rgba(157, 78, 221, 0.85) 50%,
    rgba(90, 24, 154, 0.5) 80%,
    transparent 100%
  );
  box-shadow:
    0 0 8px rgba(255, 0, 110, 0.9),
    0 0 16px rgba(157, 78, 221, 0.5),
    0 0 24px rgba(90, 24, 154, 0.3);
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .aob-buff-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
