<!--
  @file ArcaneResonanceBuffEffect.vue
  @generated 2026-08-12
  @description 奥术共鸣 - 持久BUFF特效（共鸣展开·奥术谐振·全队庇护循环）
  奥术师Q技能（arcane_master_q）BUFF持续期间特效：开启奥术共鸣场域庇护全队
  持续期间提升全队法术攻击力和全元素攻击力；EX1额外提升全队最大MP，EX2增加法术穿透，EX3提升法术暴击率
  BUFF持续期间一直显示，BUFF到期后由父组件通过 v-if 移除
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 1s）- 共鸣暗幕 + 共鸣闪光 + 能量汇聚 + 法阵展开
    持续循环 - 共鸣光环 + 旋转谐振环 + 共鸣粒子流 + 核心脉动 + 庇护波纹
  色彩方案：共鸣青(#00B4D8) + 星光紫(#9D4EDD) + 纯白蓝(#CAF0F8) + 深邃青(#023E8A)
-->
<template>
  <!-- BUFF舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="arb-buff-stage" :style="stageStyle">
    <!-- ===== 入场动画：共鸣展开（0s ~ 0.5s）===== -->
    <!-- 共鸣暗幕 - 深沉青色阴霾笼罩 -->
    <div class="arb-dim"></div>

    <!-- 共鸣闪光 - 展开瞬间的青色爆闪 -->
    <div class="arb-flash"></div>

    <!-- 能量汇聚粒子 - 周围奥术能量向中心汇聚 -->
    <div
      v-for="i in 10"
      :key="'arb-inhale-' + i"
      class="arb-inhale-particle"
      :style="getInhaleStyle(i)"
    ></div>

    <!-- ===== 入场动画：法阵展开（0.2s ~ 0.8s）===== -->
    <!-- 地面层 - 3D倾斜地面平面 -->
    <div class="arb-ground-plane">
      <!-- 共鸣法阵 - 地面展开的旋转青色法阵 -->
      <div class="arb-magic-circle">
        <div class="arb-circle-outer"></div>
        <div class="arb-circle-mid"></div>
        <div class="arb-circle-inner"></div>
      </div>

      <!-- 共鸣波纹 - 从中心向外扩散的青色光环（入场一次性） -->
      <div class="arb-domain-ring ring-1"></div>
      <div class="arb-domain-ring ring-2"></div>
      <div class="arb-domain-ring ring-3"></div>

      <!-- 地面共鸣辉光 - 法阵中心的青色光池 -->
      <div class="arb-ground-glow"></div>
    </div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 共鸣光环 - 外层柔和青色发光氛围（持续显示） -->
    <div class="arb-aura"></div>

    <!-- 共鸣庇护主体 - 发光的青色双色光环边框（持续显示） -->
    <div class="arb-halo">
      <div class="arb-halo-field"></div>
      <div class="arb-halo-border"></div>
    </div>

    <!-- 持续旋转谐振环 - 三重环持续旋转（持续显示） -->
    <div class="arb-rotate-ring rotate-outer"></div>
    <div class="arb-rotate-ring rotate-mid"></div>
    <div class="arb-rotate-ring rotate-inner"></div>

    <!-- 共鸣粒子流 - 沿光环周围环绕流转的青色光粒（循环） -->
    <div
      v-for="i in 8"
      :key="'arb-orbit-' + i"
      class="arb-orbit-particle"
      :style="getOrbitStyle(i)"
    ></div>

    <!-- 持续庇护波纹 - 从中心向外扩散的庇护波纹（循环） -->
    <div class="arb-pulse pulse-1"></div>
    <div class="arb-pulse pulse-2"></div>

    <!-- 共鸣核心 - 发光的奥术共鸣之球，持续脉冲 -->
    <div class="arb-core">
      <div class="arb-core-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 奥术共鸣 - 持久BUFF特效（共鸣展开·奥术谐振·全队庇护循环）
 * 奥术师Q技能（arcane_master_q）BUFF持续期间特效
 * 开启奥术共鸣场域庇护全队，持续期间提升全队法术攻击力和全元素攻击力
 * 以共鸣青和星光紫为主色调，展现奥术共鸣场域展开与全队庇护的视觉效果
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
    '--arb-inhale-angle': `${angle}deg`,
    '--arb-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算共鸣粒子流的样式（持续循环）
 * 8个粒子沿光环周围以不同角度环绕流转
 * @param {number} index - 粒子索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getOrbitStyle (index) {
  const angle = (index - 1) * 45
  const delay = (index - 1) * 0.4
  const size = 4 + (index % 2) * 2
  return {
    '--arb-orbit-angle': `${angle}deg`,
    '--arb-orbit-size': `${size}px`,
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
   奥术共鸣 (arcane_master_q) - 持久BUFF特效
   技能描述：开启奥术共鸣场域庇护全队，持续期间提升全队法术攻击力和全元素攻击力
   色彩方案：共鸣青(#00B4D8) + 星光紫(#9D4EDD) + 纯白蓝(#CAF0F8) + 深邃青(#023E8A)
   GPU加速：contain隔离 + will-change + translate3d
   ================================================================ */

/* BUFF舞台 - 定位容器 */
.arb-buff-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：共鸣展开（0s ~ 0.5s）---------- */

/* 共鸣暗幕 - 深沉青色阴霾笼罩 */
.arb-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(2, 62, 138, 0.5) 0%,
    rgba(2, 40, 90, 0.3) 45%,
    rgba(0, 20, 50, 0.12) 75%,
    transparent 100%
  );
  animation: arb-dim 1s ease-out forwards;
  will-change: opacity;
}

@keyframes arb-dim {
  0% { opacity: 0; }
  10% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 共鸣闪光 - 展开瞬间的青色爆闪 */
.arb-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(202, 240, 248, 0.9) 0%,
    rgba(0, 180, 216, 0.5) 20%,
    rgba(0, 119, 182, 0.25) 45%,
    transparent 75%
  );
  opacity: 0;
  animation: arb-flash 0.6s ease-out forwards;
  will-change: opacity;
}

@keyframes arb-flash {
  0%, 100% { opacity: 0; }
  5% { opacity: 1; }
  12% { opacity: 0.3; }
  20% { opacity: 0.8; }
  40% { opacity: 0.2; }
  80% { opacity: 0; }
}

/* 能量汇聚粒子 - 周围奥术能量向中心汇聚 */
.arb-inhale-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--arb-size, 5px);
  height: var(--arb-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(202, 240, 248, 0.95) 0%,
    rgba(0, 180, 216, 0.7) 45%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(0, 180, 216, 0.5);
  transform: translate(-50%, -50%) rotate(var(--arb-inhale-angle, 0deg)) translateX(80px) scale(1);
  opacity: 0;
  will-change: transform, opacity;
  animation: arb-inhale 0.4s ease-in forwards;
}

@keyframes arb-inhale {
  0% {
    transform: translate(-50%, -50%) rotate(var(--arb-inhale-angle, 0deg)) translateX(80px) scale(1);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--arb-inhale-angle, 0deg) + 180deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 入场动画：法阵展开（0.2s ~ 0.8s）---------- */

/* 地面层 - 3D倾斜地面平面 */
.arb-ground-plane {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%) rotateX(75deg);
  transform-style: preserve-3d;
}

/* 共鸣法阵 */
.arb-magic-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 140px;
  height: 140px;
  transform: translate(-50%, -50%) scale(0);
  animation: arb-circle-appear 0.4s ease-out 0.2s forwards;
  will-change: transform, opacity;
}

@keyframes arb-circle-appear {
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
.arb-circle-outer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(0, 180, 216, 0.8);
  box-shadow:
    0 0 12px rgba(0, 180, 216, 0.6),
    inset 0 0 12px rgba(0, 119, 182, 0.3);
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(0, 180, 216, 0.15) 2deg,
    transparent 4deg,
    transparent 12deg,
    rgba(157, 78, 221, 0.1) 14deg,
    transparent 16deg
  );
  animation: arb-spin-cw 3s linear 0.2s infinite;
  will-change: transform;
}

@keyframes arb-spin-cw {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 中环 */
.arb-circle-mid {
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  border: 2px solid rgba(0, 119, 182, 0.7);
  box-shadow:
    0 0 10px rgba(0, 119, 182, 0.5),
    inset 0 0 10px rgba(0, 180, 216, 0.2);
  background: repeating-conic-gradient(
    from 15deg,
    transparent 0deg,
    rgba(0, 119, 182, 0.12) 3deg,
    transparent 6deg,
    transparent 18deg
  );
  animation: arb-spin-ccw 2.5s linear 0.2s infinite;
  will-change: transform;
}

@keyframes arb-spin-ccw {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

/* 内环 */
.arb-circle-inner {
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  border: 1px solid rgba(202, 240, 248, 0.6);
  box-shadow:
    0 0 8px rgba(0, 180, 216, 0.4),
    inset 0 0 8px rgba(0, 119, 182, 0.2);
  animation: arb-spin-cw 1.5s linear 0.2s infinite;
  will-change: transform;
}

/* 共鸣波纹 - 从中心向外扩散的青色光环（入场一次性） */
.arb-domain-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid rgba(0, 180, 216, 0.8);
  box-shadow:
    0 0 12px rgba(0, 180, 216, 0.6),
    inset 0 0 10px rgba(0, 119, 182, 0.4);
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.arb-domain-ring.ring-1 { animation: arb-domain-ring 0.7s ease-out 0.2s forwards; }
.arb-domain-ring.ring-2 {
  border-color: rgba(0, 119, 182, 0.7);
  animation: arb-domain-ring 0.8s ease-out 0.35s forwards;
}
.arb-domain-ring.ring-3 {
  border-color: rgba(202, 240, 248, 0.5);
  animation: arb-domain-ring 0.9s ease-out 0.5s forwards;
}

@keyframes arb-domain-ring {
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

/* 地面共鸣辉光 - 法阵中心的青色光池 */
.arb-ground-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(202, 240, 248, 0.5) 0%,
    rgba(0, 180, 216, 0.35) 30%,
    rgba(0, 119, 182, 0.2) 60%,
    transparent 85%
  );
  transform: translate(-50%, -50%) scale(0);
  animation: arb-ground-glow 1.5s ease-out 0.2s forwards;
  will-change: transform, opacity;
}

@keyframes arb-ground-glow {
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

/* 共鸣光环 - 外层柔和青色发光氛围（持续显示） */
.arb-aura {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 50%,
    rgba(0, 180, 216, 0.08) 65%,
    rgba(0, 119, 182, 0.05) 80%,
    transparent 100%
  );
  opacity: 0;
  animation: arb-aura-in 0.4s ease-out 0.8s forwards,
             arb-aura-pulse 3s ease-in-out 1.2s infinite;
  will-change: opacity, transform;
}

@keyframes arb-aura-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes arb-aura-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.06); }
}

/* 共鸣庇护主体 */
.arb-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 85%;
  height: 85%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: arb-halo-in 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) 0.8s forwards;
  will-change: transform, opacity;
}

@keyframes arb-halo-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 */
.arb-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(0, 180, 216, 0.12) 0%,
    rgba(0, 119, 182, 0.06) 50%,
    transparent 80%
  );
  animation: arb-field-pulse 2.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes arb-field-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 旋转的青色双色 conic 边框 */
.arb-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(0, 180, 216, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(0, 180, 216, 0.5) 0deg,
    rgba(0, 119, 182, 0.35) 60deg,
    rgba(157, 78, 221, 0.5) 120deg,
    rgba(0, 180, 216, 0.35) 180deg,
    rgba(0, 119, 182, 0.5) 240deg,
    rgba(157, 78, 221, 0.35) 300deg,
    rgba(0, 180, 216, 0.5) 360deg
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
    0 0 10px rgba(0, 180, 216, 0.5),
    inset 0 0 10px rgba(0, 119, 182, 0.2);
  animation: arb-border-glow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes arb-border-glow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 10px rgba(0, 180, 216, 0.5),
      inset 0 0 10px rgba(0, 119, 182, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 14px rgba(0, 180, 216, 0.8),
      0 0 7px rgba(157, 78, 221, 0.3),
      inset 0 0 7px rgba(202, 240, 248, 0.3);
  }
}

/* 持续旋转谐振环 - 三重环持续旋转（持续显示） */
.arb-rotate-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  opacity: 0;
}

.arb-rotate-ring.rotate-outer {
  width: 75%;
  height: 75%;
  border: 1px dashed rgba(0, 180, 216, 0.35);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(0, 180, 216, 0.15) 30deg,
    transparent 60deg,
    rgba(0, 119, 182, 0.12) 120deg,
    transparent 150deg,
    rgba(157, 78, 221, 0.14) 210deg,
    transparent 240deg,
    rgba(0, 180, 216, 0.15) 300deg,
    transparent 360deg
  );
  box-shadow: 0 0 5px rgba(0, 180, 216, 0.2);
  animation: arb-rotate-outer-appear 0.3s ease-out 0.8s forwards,
             arb-rotate-outer-spin 4s linear 1.1s infinite;
}

@keyframes arb-rotate-outer-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.6; }
}

@keyframes arb-rotate-outer-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.6; }
}

.arb-rotate-ring.rotate-mid {
  width: 55%;
  height: 55%;
  border: 1px solid rgba(0, 119, 182, 0.2);
  background: conic-gradient(
    from 180deg,
    transparent 0deg,
    rgba(0, 119, 182, 0.12) 45deg,
    transparent 90deg,
    rgba(0, 180, 216, 0.12) 180deg,
    transparent 225deg,
    rgba(157, 78, 221, 0.13) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 5px rgba(0, 119, 182, 0.1);
  animation: arb-rotate-mid-appear 0.3s ease-out 0.9s forwards,
             arb-rotate-mid-spin 3s linear 1.2s infinite;
}

@keyframes arb-rotate-mid-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.5; }
}

@keyframes arb-rotate-mid-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.5; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0.5; }
}

.arb-rotate-ring.rotate-inner {
  width: 35%;
  height: 35%;
  border: 1px solid rgba(202, 240, 248, 0.2);
  background: conic-gradient(
    from 90deg,
    transparent 0deg,
    rgba(202, 240, 248, 0.1) 60deg,
    transparent 120deg,
    rgba(0, 180, 216, 0.1) 240deg,
    transparent 300deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 4px rgba(0, 180, 216, 0.1);
  animation: arb-rotate-inner-appear 0.3s ease-out 1.0s forwards,
             arb-rotate-inner-spin 2s linear 1.3s infinite;
}

@keyframes arb-rotate-inner-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.5; }
}

@keyframes arb-rotate-inner-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.5; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.5; }
}

/* 共鸣粒子流 - 沿光环周围环绕流转的青色光粒（循环） */
.arb-orbit-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--arb-orbit-size, 5px);
  height: var(--arb-orbit-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(202, 240, 248, 0.95) 0%,
    rgba(0, 180, 216, 0.7) 45%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(0, 180, 216, 0.5);
  transform: translate3d(-50%, -50%, 0) rotate(var(--arb-orbit-angle, 0deg)) translateX(0) scale(0);
  animation: arb-orbit 3s linear infinite;
  will-change: transform, opacity;
}

@keyframes arb-orbit {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--arb-orbit-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  10% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--arb-orbit-angle, 0deg)) translateX(35px) scale(1.2);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--arb-orbit-angle, 0deg) + 180deg)) translateX(35px) scale(0.9);
    opacity: 0.7;
  }
  90% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--arb-orbit-angle, 0deg) + 350deg)) translateX(35px) scale(0.8);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--arb-orbit-angle, 0deg) + 360deg)) translateX(0) scale(0);
    opacity: 0;
  }
}

/* 持续庇护波纹 - 从中心向外扩散的庇护波纹（循环） */
.arb-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20%;
  height: 20%;
  border-radius: 50%;
  border: 2px solid rgba(0, 180, 216, 0.6);
  background: transparent;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.arb-pulse.pulse-1 {
  animation: arb-pulse-expand 1.2s ease-out 0.8s infinite;
  border-color: rgba(202, 240, 248, 0.8);
}
.arb-pulse.pulse-2 {
  animation: arb-pulse-expand 1.2s ease-out 1.4s infinite;
  border-color: rgba(0, 119, 182, 0.7);
}

@keyframes arb-pulse-expand {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
  }
  20% { opacity: 0.8; }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
    border-color: rgba(0, 119, 182, 0.1);
  }
}

/* 共鸣核心 - 发光的奥术共鸣之球，持续脉冲 */
.arb-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: arb-core-in 0.3s ease-out 0.6s forwards,
             arb-core-pulse 1.5s ease-in-out 0.9s infinite;
  will-change: transform, opacity;
}

@keyframes arb-core-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes arb-core-pulse {
  0%, 100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.85;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 1;
  }
}

.arb-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(202, 240, 248, 0.95) 20%,
    rgba(0, 180, 216, 0.85) 50%,
    rgba(0, 119, 182, 0.5) 80%,
    transparent 100%
  );
  box-shadow:
    0 0 8px rgba(0, 180, 216, 0.9),
    0 0 16px rgba(0, 180, 216, 0.5),
    0 0 24px rgba(0, 119, 182, 0.3);
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .arb-buff-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
