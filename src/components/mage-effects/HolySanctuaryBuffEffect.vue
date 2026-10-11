<!--
  @file HolySanctuaryBuffEffect.vue
  @generated 2026-07-29
  @description 圣光庇护 - 持久BUFF特效（圣光领域·治愈涌泉·守护光环循环）
  炽天使Q技能（nature_messenger_q）BUFF持续期间特效：展开圣光领域庇护全队，持续恢复全体队友生命值
  BUFF持续期间一直显示，BUFF到期后由父组件通过 v-if 移除
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 1.2s）- 圣光降临 + 领域展开 + 治愈粒子涌现
    持续循环 - 圣光光晕 + 地面法阵旋转 + 治愈粒子飘升 + 圣环脉冲
  色彩方案：圣光金(#FFD700) + 治愈翠(#50C878) + 圣光白(#FFFEF0) + 暖光(#FFF8DC)
-->
<template>
  <!-- BUFF舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="hsb-buff-stage" :style="stageStyle">
    <!-- ===== 入场动画：圣光降临（0s ~ 1.0s）===== -->
    <!-- 圣域暗幕 - 金色暖光笼罩 -->
    <div class="hsb-dim"></div>

    <!-- 圣光全屏闪光 - 光柱降临瞬间的金白色爆闪 -->
    <div class="hsb-flash"></div>

    <!-- 圣光光柱 - 从天而降的金色治愈光柱 -->
    <div class="hsb-beam">
      <div class="hsb-beam-core"></div>
      <div class="hsb-beam-glow"></div>
    </div>

    <!-- ===== 入场动画：领域展开（0.3s ~ 0.8s）===== -->
    <!-- 地面层 - 3D倾斜地面平面 -->
    <div class="hsb-ground-plane">
      <!-- 神圣法阵 - 地面展开的旋转魔法阵 -->
      <div class="hsb-magic-circle">
        <div class="hsb-circle-outer"></div>
        <div class="hsb-circle-mid"></div>
        <div class="hsb-circle-inner"></div>
      </div>

      <!-- 圣环扩散 - 从中心向外扩散的金绿光环（入场一次性） -->
      <div class="hsb-ring ring-1"></div>
      <div class="hsb-ring ring-2"></div>
      <div class="hsb-ring ring-3"></div>

      <!-- 地面圣辉 - 法阵中心的金绿光池 -->
      <div class="hsb-ground-glow"></div>
    </div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 圣光光晕 - 外层柔和金色发光氛围（持续显示） -->
    <div class="hsb-aura"></div>

    <!-- 治愈光环主体 - 发光的金绿双色光环边框（持续显示） -->
    <div class="hsb-halo">
      <div class="hsb-halo-field"></div>
      <div class="hsb-halo-border"></div>
    </div>

    <!-- 持续治愈粒子 - 从地面向上飘升的金绿双色光粒（循环） -->
    <div
      v-for="i in 8"
      :key="'hsb-particle-' + i"
      class="hsb-particle"
      :style="getParticleStyle(i)"
    ></div>

    <!-- 持续圣环脉冲 - 从中心向外扩散的治愈波纹（循环） -->
    <div class="hsb-pulse pulse-1"></div>
    <div class="hsb-pulse pulse-2"></div>

    <!-- 中央治愈核心 - 发光的圣光之球，持续脉冲 -->
    <div class="hsb-core">
      <div class="hsb-core-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 圣光庇护 - 持久BUFF特效（圣光领域·治愈涌泉·守护光环循环）
 * 炽天使Q技能（nature_messenger_q）BUFF持续期间特效
 * 展开圣光领域庇护全队，持续恢复全体队友生命值
 * 以圣光金和治愈翠绿为主色调，展现神圣领域展开与治愈涌泉的视觉效果
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
 * 光环略大于头像（各方向延伸 12px），确保完全覆盖头像边框
 * @returns {Object} CSS 样式对象
 */
const stageStyle = computed(() => {
  const expand = 12
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
 * 计算治愈上升粒子的样式（持续循环）
 * @param {number} index - 粒子索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getParticleStyle (index) {
  const angle = (index - 1) * 45 + (index % 2) * 15
  const delay = (index - 1) * 0.6
  const size = 4 + (index % 2) * 2
  const colorType = index % 2
  const colors = [
    { color: 'rgba(255, 215, 0, 0.95)', glow: 'rgba(255, 215, 0, 0.7)' },
    { color: 'rgba(80, 200, 120, 0.95)', glow: 'rgba(80, 200, 120, 0.7)' }
  ]
  const c = colors[colorType]
  return {
    '--hsb-particle-angle': `${angle}deg`,
    '--hsb-size': `${size}px`,
    '--hsb-color': c.color,
    '--hsb-glow': c.glow,
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
   圣光庇护 (nature_messenger_q) - 持久BUFF特效
   技能描述：展开圣光领域庇护全队，持续恢复全体队友生命值
   色彩方案：圣光金(#FFD700) + 治愈翠(#50C878) + 圣光白(#FFFEF0) + 暖光(#FFF8DC)
   GPU加速：contain隔离 + will-change + translate3d
   ================================================================ */

/* BUFF舞台 - 定位容器 */
.hsb-buff-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：圣光降临（0s ~ 1.0s）---------- */

/* 圣域暗幕 */
.hsb-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(70, 55, 5, 0.5) 0%,
    rgba(45, 35, 0, 0.3) 45%,
    rgba(20, 15, 0, 0.15) 75%,
    transparent 100%
  );
  animation: hsb-dim 1s ease-out forwards;
  will-change: opacity;
}

@keyframes hsb-dim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 圣光全屏闪光 */
.hsb-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(255, 250, 220, 0.9) 0%,
    rgba(255, 220, 120, 0.5) 25%,
    rgba(255, 180, 50, 0.25) 50%,
    transparent 75%
  );
  opacity: 0;
  animation: hsb-flash 0.6s ease-out forwards;
  will-change: opacity;
}

@keyframes hsb-flash {
  0%, 100% { opacity: 0; }
  5% { opacity: 1; }
  12% { opacity: 0.3; }
  20% { opacity: 0.8; }
  40% { opacity: 0.2; }
  80% { opacity: 0; }
}

/* 圣光光柱 */
.hsb-beam {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50px;
  height: 100%;
  transform: translateX(-50%);
  animation: hsb-beam 0.8s ease-out forwards;
  will-change: opacity, transform;
}

@keyframes hsb-beam {
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

.hsb-beam-core {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 240, 1) 0%,
    rgba(255, 235, 160, 0.95) 20%,
    rgba(255, 210, 80, 0.85) 50%,
    rgba(80, 200, 120, 0.5) 80%,
    rgba(255, 170, 20, 0.3) 100%
  );
  border-radius: 50% 50% 20% 20%;
  box-shadow:
    0 0 20px rgba(255, 220, 100, 0.9),
    0 0 40px rgba(255, 190, 50, 0.6),
    0 0 70px rgba(80, 200, 120, 0.3);
}

.hsb-beam-glow {
  position: absolute;
  inset: -25px -50px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 220, 100, 0.35) 0%,
    rgba(80, 200, 120, 0.2) 40%,
    transparent 70%
  );
  filter: blur(10px);
}

/* ---------- 入场动画：领域展开（0.3s ~ 0.8s）---------- */

/* 地面层 */
.hsb-ground-plane {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%) rotateX(75deg);
  transform-style: preserve-3d;
}

/* 神圣法阵 */
.hsb-magic-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 160px;
  height: 160px;
  transform: translate(-50%, -50%) scale(0);
  animation: hsb-circle-appear 0.4s ease-out 0.3s forwards;
  will-change: transform, opacity;
}

@keyframes hsb-circle-appear {
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
.hsb-circle-outer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.8);
  box-shadow:
    0 0 12px rgba(255, 200, 50, 0.6),
    inset 0 0 12px rgba(80, 200, 120, 0.3);
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 220, 100, 0.15) 2deg,
    transparent 4deg,
    transparent 12deg,
    rgba(80, 200, 120, 0.1) 14deg,
    transparent 16deg
  );
  animation: hsb-spin-cw 3s linear 0.3s infinite;
  will-change: transform;
}

@keyframes hsb-spin-cw {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 中环 */
.hsb-circle-mid {
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  border: 2px solid rgba(80, 200, 120, 0.7);
  box-shadow:
    0 0 10px rgba(80, 200, 120, 0.5),
    inset 0 0 10px rgba(255, 230, 120, 0.2);
  background: repeating-conic-gradient(
    from 15deg,
    transparent 0deg,
    rgba(80, 200, 120, 0.12) 3deg,
    transparent 6deg,
    transparent 18deg
  );
  animation: hsb-spin-ccw 2.5s linear 0.3s infinite;
  will-change: transform;
}

@keyframes hsb-spin-ccw {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

/* 内环 */
.hsb-circle-inner {
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  border: 1px solid rgba(255, 245, 180, 0.6);
  box-shadow:
    0 0 8px rgba(255, 230, 100, 0.4),
    inset 0 0 8px rgba(80, 200, 120, 0.2);
  animation: hsb-spin-cw 1.5s linear 0.3s infinite;
  will-change: transform;
}

/* 圣环扩散 */
.hsb-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid rgba(255, 215, 0, 0.8);
  box-shadow:
    0 0 12px rgba(255, 200, 50, 0.6),
    inset 0 0 10px rgba(80, 200, 120, 0.4);
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.hsb-ring.ring-1 { animation: hsb-ring 0.7s ease-out 0.3s forwards; }
.hsb-ring.ring-2 {
  border-color: rgba(80, 200, 120, 0.7);
  animation: hsb-ring 0.8s ease-out 0.45s forwards;
}
.hsb-ring.ring-3 {
  border-color: rgba(255, 200, 80, 0.5);
  animation: hsb-ring 0.9s ease-out 0.6s forwards;
}

@keyframes hsb-ring {
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

/* 地面圣辉 */
.hsb-ground-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 245, 180, 0.5) 0%,
    rgba(80, 200, 120, 0.35) 30%,
    rgba(255, 180, 30, 0.2) 60%,
    transparent 85%
  );
  transform: translate(-50%, -50%) scale(0);
  animation: hsb-ground-glow 1.5s ease-out 0.3s forwards;
  will-change: transform, opacity;
}

@keyframes hsb-ground-glow {
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

/* 圣光光晕 */
.hsb-aura {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 50%,
    rgba(255, 215, 0, 0.06) 65%,
    rgba(80, 200, 120, 0.04) 80%,
    transparent 100%
  );
  opacity: 0;
  animation: hsb-aura-in 0.4s ease-out 0.7s forwards,
             hsb-aura-pulse 3s ease-in-out 1.1s infinite;
  will-change: opacity, transform;
}

@keyframes hsb-aura-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes hsb-aura-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.05); }
}

/* 治愈光环主体 */
.hsb-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 85%;
  height: 85%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: hsb-halo-in 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) 0.7s forwards;
  will-change: transform, opacity;
}

@keyframes hsb-halo-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 */
.hsb-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 245, 180, 0.5) 0%,
    rgba(80, 200, 120, 0.35) 30%,
    transparent 70%
  );
  animation: hsb-field-pulse 2.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes hsb-field-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 */
.hsb-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(255, 215, 0, 0.5) 0deg,
    rgba(80, 200, 120, 0.35) 60deg,
    rgba(255, 254, 240, 0.5) 120deg,
    rgba(255, 215, 0, 0.35) 180deg,
    rgba(80, 200, 120, 0.5) 240deg,
    rgba(255, 254, 240, 0.35) 300deg,
    rgba(255, 215, 0, 0.5) 360deg
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
    0 0 10px rgba(255, 215, 0, 0.5),
    inset 0 0 10px rgba(80, 200, 120, 0.2);
  animation: hsb-border-glow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes hsb-border-glow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 10px rgba(255, 215, 0, 0.5),
      inset 0 0 10px rgba(80, 200, 120, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 14px rgba(255, 215, 0, 0.8),
      0 0 7px rgba(80, 200, 120, 0.3),
      inset 0 0 7px rgba(255, 254, 240, 0.3);
  }
}

/* 持续治愈粒子 - 从地面向上飘升的金绿光粒 */
.hsb-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  width: var(--hsb-particle-size, 5px);
  height: var(--hsb-particle-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 220, 0.95) 0%,
    var(--hsb-color, rgba(255, 215, 0, 0.7)) 45%,
    transparent 100%
  );
  box-shadow: 0 0 6px var(--hsb-glow, rgba(255, 215, 0, 0.5));
  transform: translate3d(
    calc(-50% - 10px),
    calc(-50%),
    0
  ) scale(0);
  animation: hsb-particle 2s ease-out infinite;
  will-change: transform, opacity;
}

@keyframes hsb-particle {
  0% {
    transform: translate3d(
      calc(-50% - 10px),
      calc(-50%),
      0
    ) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate3d(
      calc(-50% - 5px),
      calc(-50%),
      0
    ) scale(1.2);
  }
  80% { opacity: 0.5; }
  100% {
    transform: translate3d(
      calc(-50% + 10px),
      calc(-50% - 60px),
      0
    ) scale(0.2);
    opacity: 0;
  }
}

/* 持续圣环脉冲 - 从中心向外扩散的治愈波纹 */
.hsb-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20%;
  height: 20%;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.6);
  background: transparent;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.hsb-pulse.pulse-1 { animation: hsb-pulse-expand 1s ease-out 0.6s infinite; border-color: rgba(255, 254, 240, 0.8); }
.hsb-pulse.pulse-2 { animation: hsb-pulse-expand 1s ease-out 1.2s infinite; border-color: rgba(80, 200, 120, 0.7); }

@keyframes hsb-pulse-expand {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
  }
  20% { opacity: 0.8; }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
    border-color: rgba(80, 200, 120, 0.1);
  }
}

/* 中央治愈核心 */
.hsb-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: hsb-core-in 0.3s ease-out 0.5s forwards,
             hsb-core-pulse 1.5s ease-in-out 0.8s infinite;
  will-change: transform, opacity;
}

@keyframes hsb-core-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes hsb-core-pulse {
  0%, 100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.85;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 1;
  }
}

.hsb-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 254, 240, 0.95) 20%,
    rgba(255, 215, 0, 0.85) 50%,
    rgba(80, 200, 120, 0.5) 80%,
    transparent 100%
  );
  box-shadow:
    0 0 8px rgba(255, 215, 0, 0.9),
    0 0 16px rgba(255, 215, 0, 0.5),
    0 0 24px rgba(80, 200, 120, 0.3);
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .hsb-buff-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>