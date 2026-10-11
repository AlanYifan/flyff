<!--
  @file PsychicShieldEffect.vue
  @generated 2026-07-04
  @description 念力护盾 - 六边形能量护盾特效
  精神使者BUFF技能（Psychic Shield）：从精神使者导师赛乐处习得的奥秘，能吸收部分来自敌人的伤害
  GPU加速：所有动画仅使用 translate3d + scale + opacity，避免重排，保证丝滑流畅
  动画特性：持久化循环动画，BUFF存活期间持续播放，BUFF到期后由父组件移除
    ⓪ 念力凝聚（0s ~ 0.5s）- 念力粒子从四周蔓延汇聚 → 能量爆发
    ① 护盾成形（0.3s ~ 1.0s）- 六边形护盾框架展开 → 能量场填充 → 边框点亮
    ② 持续蔓延（1.0s ~ 持续）- 能量波纹脉冲扩散 → 边框呼吸发光 → 念力蔓延流光 → 偶发涌动
  色彩方案：念力紫(#9932CC) + 精神蓝(#4169E1) + 护盾白(#E6E6FA) + 深邃靛(#4B0082)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖玩家头像范围
-->
<template>
  <!-- 护盾舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="ps-stage" :style="stageStyle">
    <!-- ===== 阶段⓪：念力凝聚 ===== -->
    <!-- 念力蔓延粒子 - 从四周向中心蔓延汇聚形成护盾 -->
    <div
      v-for="i in 8"
      :key="'ps-converge-' + i"
      class="ps-converge"
      :style="getConvergeStyle(i)"
    ></div>

    <!-- 能量爆发 - 护盾成形瞬间的闪光 -->
    <div class="ps-burst"></div>

    <!-- ===== 阶段①：护盾成形 ===== -->
    <!-- 外层光晕 - 护盾整体发光氛围 -->
    <div class="ps-aura"></div>

    <!-- 六边形护盾主体 - 能量屏障 -->
    <div class="ps-shield">
      <!-- 护盾能量场 - 半透明能量填充 -->
      <div class="ps-field"></div>

      <!-- 六边形边框 - 护盾外框发光线条 -->
      <div class="ps-border"></div>

      <!-- 能量波纹1 - 从中心向外扩散 -->
      <div class="ps-ripple ripple-1"></div>
      <!-- 能量波纹2 - 延迟扩散 -->
      <div class="ps-ripple ripple-2"></div>
      <!-- 能量波纹3 - 进一步延迟 -->
      <div class="ps-ripple ripple-3"></div>

      <!-- 念力蔓延流光 - 能量在护盾表面蔓延流动 -->
      <div class="ps-spread"></div>
    </div>

    <!-- ===== 阶段②：持续蔓延 ===== -->
    <!-- 能量涌动 - 偶发的能量增强闪烁，暗示护盾正在吸收伤害 -->
    <div class="ps-surge surge-1"></div>
    <div class="ps-surge surge-2"></div>
  </div>
</template>

<script setup>
/**
 * 念力护盾 - 六边形能量护盾特效
 * 精神使者BUFF技能（Psychic Shield）特效组件
 * 从精神使者导师赛乐处习得的奥秘，能吸收部分来自敌人的伤害
 * 持久化循环动画，BUFF存活期间持续播放
 * 色彩方案：念力紫(#9932CC) + 精神蓝(#4169E1) + 护盾白(#E6E6FA) + 深邃靛(#4B0082)
 * 定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖玩家头像范围
 * 动画风格：念力蔓延 + 护盾质感，无旋转元素
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

/** 舞台 DOM 引用 */
const stageRef = ref(null)

/** 头像区域位置信息（相对定位父容器） */
const avatarRect = ref({ left: 0, top: 0, width: 100, height: 100 })

/** 窗口 resize 回调引用 */
let resizeHandler = null

/**
 * 计算护盾舞台的动态样式
 * 根据 #playerAvatar 的实际位置和尺寸，精确定位护盾覆盖头像区域
 * 护盾略大于头像（各方向延伸 6px），确保完全罩住
 * @returns {Object} CSS 样式对象
 */
const stageStyle = computed(() => {
  const expand = 6
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
      console.warn('[PsychicShieldEffect] 未找到玩家头像元素 #playerAvatar')
      return
    }

    // 查找定位父容器（.player-card-area）
    const positioningParent = stage.offsetParent
    if (!positioningParent) {
      console.warn('[PsychicShieldEffect] 未找到定位父容器')
      return
    }

    // 遍历 offsetParent 链，计算 avatar 相对于定位父容器的偏移
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
    console.warn('[PsychicShieldEffect] 更新头像位置失败:', e)
  }
}

onMounted(async () => {
  await nextTick()
  // 延迟一帧确保 DOM 布局完成
  requestAnimationFrame(() => {
    updateAvatarPosition()
  })

  // 监听窗口 resize，重新计算位置
  resizeHandler = () => updateAvatarPosition()
  window.addEventListener('resize', resizeHandler)
})

onBeforeUnmount(() => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
})

/**
 * 计算念力蔓延粒子的样式
 * 每个粒子从不同方向向中心蔓延汇聚，模拟念力凝聚过程
 * @param {number} index - 粒子索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getConvergeStyle (index) {
  const angle = (index - 1) * 45
  const distance = 55 + (index % 3) * 8
  const delay = (index % 4) * 0.04
  const isPurple = index % 2 === 0
  return {
    '--ps-conv-angle': `${angle}deg`,
    '--ps-conv-dist': `${distance}px`,
    '--ps-conv-color': isPurple
      ? 'rgba(153, 50, 204, 0.9)'
      : 'rgba(65, 105, 225, 0.9)',
    '--ps-conv-glow': isPurple
      ? 'rgba(153, 50, 204, 0.6)'
      : 'rgba(65, 105, 225, 0.6)',
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   念力护盾 (spirit_mage_psychic_shield) - 六边形能量护盾特效
   技能描述：从精神使者导师赛乐处习得的奥秘，能吸收部分来自敌人的伤害
   色彩方案：念力紫(#9932CC) + 精神蓝(#4169E1) + 护盾白(#E6E6FA) + 深邃靛(#4B0082)
   GPU加速：contain隔离 + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   定位：通过 JS 动态查找 #playerAvatar，精确覆盖玩家头像范围
   动画风格：念力蔓延 + 护盾质感，无旋转元素
   ================================================================ */

/* 护盾舞台 - 定位容器，由 JS 动态设置 left/top/width/height 精确覆盖头像 */
.ps-stage {
  position: absolute;
  contain: layout style;
  pointer-events: none;
  z-index: 50;
  animation: ps-stage-appear 0.5s ease-out forwards;
  will-change: opacity, transform;
}
@keyframes ps-stage-appear {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  60% {
    opacity: 1;
    transform: scale(1.08);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* ================================================================
   阶段⓪：念力凝聚（0s ~ 0.5s）
   ================================================================ */

/* 念力蔓延粒子 - 从四周向中心蔓延汇聚 */
.ps-converge {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(230, 230, 250, 1) 0%,
    var(--ps-conv-color, rgba(153, 50, 204, 0.9)) 40%,
    transparent 100%
  );
  box-shadow: 0 0 5px var(--ps-conv-glow, rgba(153, 50, 204, 0.6));
  transform: translate3d(-50%, -50%, 0) rotate(var(--ps-conv-angle, 0deg)) translateX(var(--ps-conv-dist, 55px)) scale(0);
  animation: ps-converge 0.5s ease-in forwards;
  will-change: transform, opacity;
}
@keyframes ps-converge {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--ps-conv-angle, 0deg)) translateX(var(--ps-conv-dist, 55px)) scale(0);
    opacity: 0;
  }
  30% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--ps-conv-angle, 0deg)) translateX(var(--ps-conv-dist, 55px)) scale(1.5);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--ps-conv-angle, 0deg)) translateX(0px) scale(0.2);
    opacity: 0;
  }
}

/* 能量爆发 - 护盾成形瞬间的径向闪光 */
.ps-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(230, 230, 250, 0.6) 20%,
    rgba(153, 50, 204, 0.3) 50%,
    transparent 80%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: ps-burst 0.4s ease-out 0.25s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}
@keyframes ps-burst {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  40% {
    transform: translate3d(-50%, -50%, 0) scale(1.4);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2.2);
    opacity: 0;
  }
}

/* ================================================================
   阶段①：护盾成形（0.3s ~ 1.0s）
   ================================================================ */

/* 外层光晕 - 护盾整体发光氛围，呼吸脉冲 */
.ps-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 110%;
  height: 110%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(153, 50, 204, 0.18) 0%,
    rgba(65, 105, 225, 0.12) 30%,
    rgba(75, 0, 130, 0.06) 60%,
    transparent 80%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: ps-aura-appear 0.4s ease-out 0.3s forwards, ps-aura-pulse 3s ease-in-out 1s infinite;
  will-change: transform, opacity;
  filter: blur(5px);
}
@keyframes ps-aura-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}
@keyframes ps-aura-pulse {
  0%, 100% {
    opacity: 0.4;
    transform: translate3d(-50%, -50%, 0) scale(1);
  }
  50% {
    opacity: 0.9;
    transform: translate3d(-50%, -50%, 0) scale(1.08);
  }
}

/* ================================================================
   六边形护盾主体 - 能量屏障
   使用 clip-path 创建六边形盾牌轮廓
   ================================================================ */

.ps-shield {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 85%;
  height: 85%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: ps-shield-appear 0.5s ease-out 0.3s forwards;
  will-change: transform, opacity;
  /* 六边形盾牌轮廓 - 尖朝上下 */
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}
@keyframes ps-shield-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  60% {
    transform: translate3d(-50%, -50%, 0) scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}

/* 护盾能量场 - 半透明能量填充背景，呼吸脉冲 */
.ps-field {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      ellipse at 50% 40%,
      rgba(153, 50, 204, 0.22) 0%,
      rgba(65, 105, 225, 0.16) 35%,
      rgba(75, 0, 130, 0.1) 65%,
      rgba(153, 50, 204, 0.05) 100%
    );
  animation: ps-field-pulse 2.5s ease-in-out infinite;
  will-change: opacity;
}
@keyframes ps-field-pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* 六边形边框 - 护盾外框发光线条，呼吸发光 */
.ps-border {
  position: absolute;
  inset: 0;
  background:
    conic-gradient(
      from 30deg,
      rgba(153, 50, 204, 0.6) 0deg,
      rgba(65, 105, 225, 0.45) 60deg,
      rgba(230, 230, 250, 0.55) 120deg,
      rgba(153, 50, 204, 0.6) 180deg,
      rgba(65, 105, 225, 0.45) 240deg,
      rgba(230, 230, 250, 0.55) 300deg,
      rgba(153, 50, 204, 0.6) 360deg
    );
  /* 内部镂空，只保留边框 */
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
    0 0 8px rgba(153, 50, 204, 0.5),
    0 0 4px rgba(65, 105, 225, 0.3);
  animation: ps-border-glow 2s ease-in-out infinite;
  will-change: opacity;
}
@keyframes ps-border-glow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 8px rgba(153, 50, 204, 0.5),
      0 0 4px rgba(65, 105, 225, 0.3);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 14px rgba(153, 50, 204, 0.8),
      0 0 8px rgba(65, 105, 225, 0.5),
      0 0 4px rgba(230, 230, 250, 0.3);
  }
}

/* 能量波纹 - 从中心向外扩散的六边形波纹，念力蔓延感 */
.ps-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  border: 1.5px solid rgba(153, 50, 204, 0.6);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}
.ps-ripple.ripple-1 {
  animation: ps-ripple-expand 2.5s ease-out 0.7s infinite;
}
.ps-ripple.ripple-2 {
  animation: ps-ripple-expand 2.5s ease-out 1.5s infinite;
}
.ps-ripple.ripple-3 {
  animation: ps-ripple-expand 2.5s ease-out 2.0s infinite;
}
@keyframes ps-ripple-expand {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.3);
    opacity: 0;
    border-color: rgba(230, 230, 250, 0.8);
  }
  20% {
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(3);
    opacity: 0;
    border-color: rgba(153, 50, 204, 0.1);
  }
}

/* 念力蔓延流光 - 能量在护盾表面从底部向上蔓延流动 */
.ps-spread {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(153, 50, 204, 0.35) 0%,
    rgba(65, 105, 225, 0.2) 30%,
    rgba(230, 230, 250, 0.1) 60%,
    transparent 100%
  );
  opacity: 0;
  animation: ps-spread-flow 3s ease-in-out 1s infinite;
  will-change: transform, opacity;
}
@keyframes ps-spread-flow {
  0% {
    transform: scale(1) translateY(40%);
    opacity: 0;
  }
  30% {
    opacity: 0.7;
  }
  60% {
    transform: scale(1) translateY(-10%);
    opacity: 0.5;
  }
  100% {
    transform: scale(1) translateY(-40%);
    opacity: 0;
  }
}

/* ================================================================
   能量涌动 - 偶发的能量增强闪烁，暗示护盾正在吸收伤害
   ================================================================ */

.ps-surge {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 85%;
  height: 85%;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  border: 2px solid rgba(230, 230, 250, 0.6);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}
.surge-1 {
  animation: ps-surge-flash 5s ease-out 2s infinite;
}
.surge-2 {
  animation: ps-surge-flash 6s ease-out 4s infinite;
}
@keyframes ps-surge-flash {
  0%, 85% {
    transform: translate3d(-50%, -50%, 0) scale(0.8);
    opacity: 0;
    border-color: rgba(230, 230, 250, 0.6);
  }
  90% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.8;
    border-color: rgba(255, 255, 255, 0.9);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.5);
    opacity: 0;
    border-color: rgba(153, 50, 204, 0.2);
  }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .ps-stage * {
    animation-duration: 0.5s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
