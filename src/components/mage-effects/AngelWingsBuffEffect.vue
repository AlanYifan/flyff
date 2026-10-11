<!--
  @file AngelWingsBuffEffect.vue
  @generated 2026-07-29
  @description 天使之翼 - 持久BUFF特效（翼展庇护·圣盾凝结·防御光环循环）
  炽天使R技能（nature_messenger_r）BUFF持续期间特效：展开天使之翼庇护全队，大幅提升物理防御和魔法防御
  BUFF持续期间一直显示，BUFF到期后由父组件通过 v-if 移除
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 1.0s）- 天使之翼展开 + 圣盾光罩成型 + 防御符文旋转
    持续循环 - 翼展光晕 + 圣盾脉冲 + 符文旋转 + 光环扩散
  色彩方案：圣翼金(#FFD700) + 圣盾白(#FFFEF0) + 庇护蓝(#87CEEB) + 暖光(#FFF8DC)
-->
<template>
  <!-- BUFF舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="awb-buff-stage" :style="stageStyle">
    <!-- ===== 入场动画：翼展庇护（0s ~ 1.0s）===== -->
    <!-- 翼展暗幕 - 金色暖光笼罩 -->
    <div class="awb-dim"></div>

    <!-- 全屏圣光闪 - 翼展瞬间的金白色爆闪 -->
    <div class="awb-flash"></div>

    <!-- 天使之翼主体 - 从中心展开的巨大光翼 -->
    <div class="awb-wings">
      <!-- 左主翼 -->
      <div class="awb-wing wing-main-left">
        <div class="awb-wing-feather f1"></div>
        <div class="awb-wing-feather f2"></div>
        <div class="awb-wing-feather f3"></div>
      </div>
      <!-- 右主翼 -->
      <div class="awb-wing wing-main-right">
        <div class="awb-wing-feather f1"></div>
        <div class="awb-wing-feather f2"></div>
        <div class="awb-wing-feather f3"></div>
      </div>
      <!-- 上翼 -->
      <div class="awb-wing wing-upper-left"></div>
      <div class="awb-wing wing-upper-right"></div>
      <!-- 下翼 -->
      <div class="awb-wing wing-lower-left"></div>
      <div class="awb-wing wing-lower-right"></div>
    </div>

    <!-- 翼展光环 - 翼膀展开时的环形光波 -->
    <div class="awb-wing-aura"></div>

    <!-- ===== 入场动画：圣盾凝结（0.3s ~ 0.8s）===== -->
    <!-- 圣盾光罩 - 半球形防护罩 -->
    <div class="awb-shield">
      <div class="awb-shield-glow"></div>
      <div class="awb-shield-rim"></div>
      <div class="awb-shield-rune"></div>
    </div>

    <!-- 防御符文圆环 - 旋转的防御符文（双层） -->
    <div class="awb-rune-ring rune-outer"></div>
    <div class="awb-rune-ring rune-inner"></div>

    <!-- 圣光波纹 - 从中心向外扩散的防护波纹（入场一次性） -->
    <div class="awb-wave wave-1"></div>
    <div class="awb-wave wave-2"></div>
    <div class="awb-wave wave-3"></div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 翼展光晕 - 外层柔和金色发光氛围（持续显示） -->
    <div class="awb-aura"></div>

    <!-- 圣盾光环主体 - 发光的金色/蓝色祝福光环边框（持续显示） -->
    <div class="awb-halo">
      <div class="awb-halo-field"></div>
      <div class="awb-halo-border"></div>
    </div>

    <!-- 持续扩散光环 - 周期性扩散的防护光环 -->
    <div class="awb-ring-halo ring-halo-1"></div>
    <div class="awb-ring-halo ring-halo-2"></div>

    <!-- 中央庇护核心 - 发光的圣盾之球，持续脉冲 -->
    <div class="awb-core">
      <div class="awb-core-inner"></div>
    </div>

    <!-- 羽毛飘散 - 偶发飘落的金色羽毛（持续循环） -->
    <div
      v-for="i in 6"
      :key="'awb-feather-' + i"
      class="awb-feather"
      :style="getFeatherStyle(i)"
    ></div>
  </div>
</template>

<script setup>
/**
 * 天使之翼 - 持久BUFF特效（翼展庇护·圣盾凝结·防御光环循环）
 * 炽天使R技能（nature_messenger_r）BUFF持续期间特效
 * 展开天使之翼庇护全队，大幅提升物理防御和魔法防御
 * 以圣翼金和圣盾白为主色调，辅以庇护蓝，展现天使翼展与圣盾凝结的防御视觉效果
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
 * 计算金色羽毛的飘散样式（持续循环）
 * @param {number} index - 羽毛索引（1~6）
 * @returns {Object} CSS自定义属性对象
 */
function getFeatherStyle (index) {
  const angle = (index - 1) * 60
  const delay = (index - 1) * 0.8
  const size = 6 + (index % 2) * 3
  return {
    '--awb-feather-angle': `${angle}deg`,
    '--awb-feather-size': `${size}px`,
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
   天使之翼 (nature_messenger_r) - 持久BUFF特效
   技能描述：展开天使之翼庇护全队，大幅提升物理防御和魔法防御
   色彩方案：圣翼金(#FFD700) + 圣盾白(#FFFEF0) + 庇护蓝(#87CEEB) + 暖光(#FFF8DC)
   GPU加速：contain隔离 + will-change + translate3d
   ================================================================ */

/* BUFF舞台 - 定位容器 */
.awb-buff-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：翼展庇护（0s ~ 1.0s）---------- */

/* 翼展暗幕 */
.awb-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(60, 50, 10, 0.45) 0%,
    rgba(35, 30, 5, 0.25) 50%,
    transparent 100%
  );
  animation: awb-dim 1s ease-out forwards;
  will-change: opacity;
}

@keyframes awb-dim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 0; }
}

/* 全屏圣光闪 */
.awb-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(255, 250, 220, 0.85) 0%,
    rgba(255, 220, 120, 0.45) 25%,
    rgba(135, 206, 235, 0.2) 55%,
    transparent 80%
  );
  opacity: 0;
  animation: awb-flash 0.6s ease-out forwards;
  will-change: opacity;
}

@keyframes awb-flash {
  0%, 100% { opacity: 0; }
  5% { opacity: 1; }
  12% { opacity: 0.3; }
  20% { opacity: 0.7; }
  40% { opacity: 0.2; }
  80% { opacity: 0; }
}

/* 天使之翼主体容器 */
.awb-wings {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  transform: translate(-50%, -50%) scale(0);
  animation: awb-wings-appear 0.5s ease-out 0.1s forwards;
  will-change: transform, opacity;
}

@keyframes awb-wings-appear {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  60% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.7; }
}

/* 单个光翼 */
.awb-wing {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: 0% 50%;
  will-change: transform, opacity;
}

/* 主翼 - 左 */
.awb-wing.wing-main-left {
  width: 100px;
  height: 25px;
  transform: translate(0, -50%) rotate(180deg) scaleX(0);
  background: linear-gradient(
    to right,
    rgba(255, 255, 240, 0.9) 0%,
    rgba(255, 235, 160, 0.7) 30%,
    rgba(255, 215, 0, 0.4) 60%,
    transparent 100%
  );
  clip-path: polygon(0% 50%, 25% 0%, 70% 10%, 100% 50%, 70% 90%, 25% 100%);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
  filter: blur(2px);
  animation: awb-wing-left 0.5s ease-out 0.1s forwards;
}

/* 主翼 - 右 */
.awb-wing.wing-main-right {
  width: 100px;
  height: 25px;
  transform: translate(0, -50%) scaleX(0);
  background: linear-gradient(
    to right,
    rgba(255, 255, 240, 0.9) 0%,
    rgba(255, 235, 160, 0.7) 30%,
    rgba(255, 215, 0, 0.4) 60%,
    transparent 100%
  );
  clip-path: polygon(0% 50%, 25% 0%, 70% 10%, 100% 50%, 70% 90%, 25% 100%);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
  filter: blur(2px);
  animation: awb-wing-right 0.5s ease-out 0.1s forwards;
}

/* 上翼 - 左 */
.awb-wing.wing-upper-left {
  width: 70px;
  height: 18px;
  transform: translate(0, -50%) rotate(205deg) scaleX(0);
  background: linear-gradient(to right, rgba(255, 255, 240, 0.8) 0%, rgba(255, 215, 0, 0.4) 60%, transparent 100%);
  clip-path: polygon(0% 50%, 30% 0%, 80% 15%, 100% 50%, 80% 85%, 30% 100%);
  filter: blur(2px);
  animation: awb-wing-upper-left 0.5s ease-out 0.15s forwards;
}

/* 上翼 - 右 */
.awb-wing.wing-upper-right {
  width: 70px;
  height: 18px;
  transform: translate(0, -50%) rotate(-25deg) scaleX(0);
  background: linear-gradient(to right, rgba(255, 255, 240, 0.8) 0%, rgba(255, 215, 0, 0.4) 60%, transparent 100%);
  clip-path: polygon(0% 50%, 30% 0%, 80% 15%, 100% 50%, 80% 85%, 30% 100%);
  filter: blur(2px);
  animation: awb-wing-upper-right 0.5s ease-out 0.15s forwards;
}

/* 下翼 - 左 */
.awb-wing.wing-lower-left {
  width: 65px;
  height: 16px;
  transform: translate(0, -50%) rotate(155deg) scaleX(0);
  background: linear-gradient(to right, rgba(255, 255, 240, 0.7) 0%, rgba(255, 215, 0, 0.35) 60%, transparent 100%);
  clip-path: polygon(0% 50%, 30% 0%, 80% 15%, 100% 50%, 80% 85%, 30% 100%);
  filter: blur(2px);
  animation: awb-wing-lower-left 0.5s ease-out 0.2s forwards;
}

/* 下翼 - 右 */
.awb-wing.wing-lower-right {
  width: 65px;
  height: 16px;
  transform: translate(0, -50%) rotate(25deg) scaleX(0);
  background: linear-gradient(to right, rgba(255, 255, 240, 0.7) 0%, rgba(255, 215, 0, 0.35) 60%, transparent 100%);
  clip-path: polygon(0% 50%, 30% 0%, 80% 15%, 100% 50%, 80% 85%, 30% 100%);
  filter: blur(2px);
  animation: awb-wing-lower-right 0.5s ease-out 0.2s forwards;
}

/* 翼羽细节 */
.awb-wing-feather {
  position: absolute;
  background: linear-gradient(to right, rgba(255, 255, 240, 0.6), transparent);
  height: 2px;
  border-radius: 2px;
}

.awb-wing-feather.f1 { top: 30%; left: 20%; width: 50%; }
.awb-wing-feather.f2 { top: 50%; left: 15%; width: 60%; }
.awb-wing-feather.f3 { top: 70%; left: 20%; width: 50%; }

@keyframes awb-wing-left {
  0% { transform: translate(0, -50%) rotate(180deg) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) rotate(180deg) scaleX(1); opacity: 0.7; }
}

@keyframes awb-wing-right {
  0% { transform: translate(0, -50%) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) scaleX(1); opacity: 0.7; }
}

@keyframes awb-wing-upper-left {
  0% { transform: translate(0, -50%) rotate(205deg) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) rotate(205deg) scaleX(1); opacity: 0.6; }
}

@keyframes awb-wing-upper-right {
  0% { transform: translate(0, -50%) rotate(-25deg) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) rotate(-25deg) scaleX(1); opacity: 0.6; }
}

@keyframes awb-wing-lower-left {
  0% { transform: translate(0, -50%) rotate(155deg) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) rotate(155deg) scaleX(1); opacity: 0.5; }
}

@keyframes awb-wing-lower-right {
  0% { transform: translate(0, -50%) rotate(25deg) scaleX(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: translate(0, -50%) rotate(25deg) scaleX(1); opacity: 0.5; }
}

/* 翼展光环 */
.awb-wing-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.6);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.4), inset 0 0 15px rgba(255, 215, 0, 0.2);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  animation: awb-wing-aura 0.5s ease-out 0.2s forwards;
  will-change: transform, opacity;
}

@keyframes awb-wing-aura {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  30% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
}

/* ---------- 入场动画：圣盾凝结（0.3s ~ 0.8s）---------- */

/* 圣盾光罩 */
.awb-shield {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60%;
  height: 60%;
  transform: translate(-50%, -50%) scale(0);
  animation: awb-shield-appear 0.4s ease-out 0.3s forwards;
  will-change: transform, opacity;
}

@keyframes awb-shield-appear {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  60% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
}

/* 圣盾发光层 */
.awb-shield-glow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.15) 0%,
    rgba(135, 206, 235, 0.1) 40%,
    transparent 70%
  );
  filter: blur(6px);
}

/* 圣盾边框光弧 */
.awb-shield-rim {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  border-radius: 50%;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 215, 0, 0.5) 25%,
    rgba(255, 255, 240, 0.8) 50%,
    rgba(135, 206, 235, 0.5) 75%,
    transparent 100%
  );
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  filter: blur(2px);
}

/* 圣盾符文 */
.awb-shield-rune {
  position: absolute;
  top: 15%;
  left: 50%;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.08) 45deg,
    transparent 90deg,
    rgba(135, 206, 235, 0.06) 180deg,
    transparent 225deg,
    rgba(255, 254, 240, 0.08) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  animation: awb-shield-rune-spin 4s linear 0.4s infinite;
  will-change: transform;
}

@keyframes awb-shield-rune-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 防御符文圆环 */
.awb-rune-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
}

.awb-rune-ring.rune-outer {
  width: 75%;
  height: 75%;
  border: 1px dashed rgba(255, 215, 0, 0.35);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.15) 30deg,
    transparent 60deg,
    rgba(135, 206, 235, 0.12) 120deg,
    transparent 150deg,
    rgba(255, 254, 240, 0.14) 210deg,
    transparent 240deg,
    rgba(255, 215, 0, 0.15) 300deg,
    transparent 360deg
  );
  box-shadow: 0 0 5px rgba(255, 215, 0, 0.2);
  animation: awb-rune-outer-appear 0.3s ease-out 0.4s forwards,
             awb-rune-outer-spin 4s linear 0.5s infinite;
}

@keyframes awb-rune-outer-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.6; }
}

@keyframes awb-rune-outer-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.6; }
}

.awb-rune-ring.rune-inner {
  width: 50%;
  height: 50%;
  border: 1px solid rgba(135, 206, 235, 0.2);
  background: conic-gradient(
    from 180deg,
    transparent 0deg,
    rgba(135, 206, 235, 0.12) 45deg,
    transparent 90deg,
    rgba(255, 215, 0, 0.12) 180deg,
    transparent 225deg,
    rgba(255, 254, 240, 0.13) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 5px rgba(135, 206, 235, 0.1);
  animation: awb-rune-inner-appear 0.3s ease-out 0.5s forwards,
             awb-rune-inner-spin 3s linear 0.6s infinite;
}

@keyframes awb-rune-inner-appear {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.5; }
}

@keyframes awb-rune-inner-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.5; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0.5; }
}

/* 圣光波纹 */
.awb-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20%;
  height: 20%;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.5);
  background: transparent;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.awb-wave.wave-1 { animation: awb-wave-expand 0.6s ease-out 0.35s forwards; }
.awb-wave.wave-2 { animation: awb-wave-expand 0.6s ease-out 0.5s forwards; border-color: rgba(135, 206, 235, 0.5); }
.awb-wave.wave-3 { animation: awb-wave-expand 0.6s ease-out 0.65s forwards; border-color: rgba(255, 254, 240, 0.5); }

@keyframes awb-wave-expand {
  0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
  20% { opacity: 0.8; }
  100% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
    border-color: rgba(135, 206, 235, 0.1);
  }
}

/* ---------- 持续循环动画 ---------- */

/* 翼展光晕 - 外层柔和金色发光氛围（持续显示） */
.awb-aura {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 50%,
    rgba(255, 215, 0, 0.06) 65%,
    rgba(135, 206, 235, 0.04) 80%,
    transparent 100%
  );
  opacity: 0;
  animation: awb-aura-in 0.4s ease-out 0.7s forwards,
             awb-aura-pulse 3s ease-in-out 1.1s infinite;
  will-change: opacity, transform;
}

@keyframes awb-aura-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes awb-aura-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.05); }
}

/* 圣盾光环主体 */
.awb-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 85%;
  height: 85%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: awb-halo-in 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) 0.7s forwards;
  will-change: transform, opacity;
}

@keyframes awb-halo-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 */
.awb-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.12) 0%,
    rgba(135, 206, 235, 0.06) 50%,
    transparent 80%
  );
  animation: awb-field-pulse 2.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes awb-field-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 */
.awb-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(255, 215, 0, 0.5) 0deg,
    rgba(135, 206, 235, 0.35) 60deg,
    rgba(255, 254, 240, 0.5) 120deg,
    rgba(255, 215, 0, 0.35) 180deg,
    rgba(135, 206, 235, 0.5) 240deg,
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
    inset 0 0 10px rgba(135, 206, 235, 0.2);
  animation: awb-border-glow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes awb-border-glow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 10px rgba(255, 215, 0, 0.5),
      inset 0 0 10px rgba(135, 206, 235, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 14px rgba(255, 215, 0, 0.8),
      0 0 7px rgba(135, 206, 235, 0.3),
      inset 0 0 7px rgba(255, 254, 240, 0.3);
  }
}

/* 持续扩散光环 */
.awb-ring-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 15%;
  height: 15%;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.5);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.awb-ring-halo.ring-halo-1 {
  animation: awb-ring-halo-expand 2s ease-out 1.0s infinite;
  border-color: rgba(135, 206, 235, 0.5);
}

.awb-ring-halo.ring-halo-2 {
  animation: awb-ring-halo-expand 2s ease-out 1.0s 1s infinite;
}

@keyframes awb-ring-halo-expand {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
  }
  15% { opacity: 0.8; }
  100% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
  }
}

/* 中央庇护核心 */
.awb-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: awb-core-in 0.3s ease-out 0.6s forwards,
             awb-core-pulse 1.5s ease-in-out 0.9s infinite;
  will-change: transform, opacity;
}

@keyframes awb-core-in {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes awb-core-pulse {
  0%, 100% { transform: translate3d(-50%, -50%, 0) scale(1); }
  50% { transform: translate3d(-50%, -50%, 0) scale(1.15); }
}

.awb-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 254, 240, 0.95) 20%,
    rgba(255, 215, 0, 0.85) 50%,
    rgba(135, 206, 235, 0.4) 80%,
    transparent 100%
  );
  box-shadow:
    0 0 8px rgba(255, 215, 0, 0.9),
    0 0 16px rgba(255, 215, 0, 0.5);
}

/* 羽毛飘散 - 偶发飘落的金色羽毛（持续循环） */
.awb-feather {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--awb-feather-size, 6px);
  height: calc(var(--awb-feather-size, 6px) * 0.4);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 240, 0.9) 0%,
    rgba(255, 215, 0, 0.6) 50%,
    transparent 100%
  );
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  box-shadow: 0 0 4px rgba(255, 215, 0, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: awb-feather-fall 3s ease-in-out infinite;
  will-change: transform, opacity;
}

@keyframes awb-feather-fall {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) scale(1) rotate(30deg);
  }
  50% { opacity: 0.7; }
  100% {
    transform: translate3d(
      calc(-50% + 40px),
      calc(-50% + 60px),
      0
    ) scale(0.3) rotate(90deg);
    opacity: 0;
  }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .awb-buff-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>