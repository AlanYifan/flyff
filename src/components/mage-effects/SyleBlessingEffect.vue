<!--
  @file SyleBlessingEffect.vue
  @generated 2026-07-04
  @description 赛乐的祝福 - 圣光祝福光环特效
  精神使者BUFF技能（Syle's Blessing）：从精神使者导师赛乐习得的精神奥秘，大幅度增加使用者的精神和体魄
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画特性：持久化循环动画，BUFF存活期间持续播放，BUFF到期后由父组件移除
    ⓪ 祝福降临（0s ~ 0.6s）- 金色光柱从天而降 → 祝福粒子散落 → 光芒绽放
    ① 祝福激活（0.4s ~ 1.2s）- 圣光光环展开 → 双层符文圆环显现 → 中央祝福核心点亮
    ② 持续运转（1.2s ~ 持续）- 粒子环绕轨道旋转 → 祝福波纹脉冲扩散 → 符文双向旋转 → 偶发祝福闪烁
  色彩方案：祝福金(#FFD700) + 精神翠(#50C878) + 神秘紫(#9370DB) + 圣光白(#FFFEF0)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确环绕施法者头像边框
-->
<template>
  <!-- 祝福舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="sb-stage" :style="stageStyle">
    <!-- ===== 阶段⓪：祝福降临 ===== -->
    <!-- 天降光柱 - 从顶部降下的金色祝福光柱 -->
    <div class="sb-beam"></div>

    <!-- 祝福散落粒子 - 光柱触地时四散的祝福碎片 -->
    <div
      v-for="i in 10"
      :key="'sb-descend-' + i"
      class="sb-descend"
      :style="getDescendStyle(i)"
    ></div>

    <!-- 祝福绽放 - 光柱落地的径向爆发 -->
    <div class="sb-bloom"></div>

    <!-- ===== 阶段①：祝福激活 ===== -->
    <!-- 圣光光环外层 - 整体发光氛围 -->
    <div class="sb-aura"></div>

    <!-- 圣光光环主体 - 金色光环边框 -->
    <div class="sb-halo">
      <!-- 光环能量场 - 半透明祝福能量填充 -->
      <div class="sb-halo-field"></div>

      <!-- 光环边框 - 发光的圆环 -->
      <div class="sb-halo-border"></div>

      <!-- 祝福波纹 - 从中心向外扩散的光环 -->
      <div class="sb-wave wave-1"></div>
      <div class="sb-wave wave-2"></div>
      <div class="sb-wave wave-3"></div>

      <!-- 表面圣光扫过 - 偶发的祝福光芒扫过 -->
      <div class="sb-sheen"></div>
    </div>

    <!-- 外层符文圆环 - 顺时针旋转，代表智力（精神）加成 -->
    <div class="sb-rune-ring rune-outer"></div>
    <!-- 内层符文圆环 - 逆时针旋转，代表体质（体魄）加成 -->
    <div class="sb-rune-ring rune-inner"></div>

    <!-- 中央祝福核心 - 发光的祝福之球 -->
    <div class="sb-core">
      <div class="sb-core-inner"></div>
    </div>

    <!-- ===== 阶段②：持续运转 ===== -->
    <!-- 环绕粒子 - 沿光环边缘旋转的祝福光粒 -->
    <div
      v-for="i in 8"
      :key="'sb-orbit-' + i"
      class="sb-orbit"
      :style="getOrbitStyle(i)"
    ></div>

    <!-- 偶发祝福闪烁 - 暗示祝福正在增强力量 -->
    <div class="sb-sparkle sparkle-1"></div>
    <div class="sb-sparkle sparkle-2"></div>

    <!-- 持续光柱呼吸 - 激活后持续存在的微弱光柱 -->
    <div class="sb-beam-persistent"></div>
  </div>
</template>

<script setup>
/**
 * 赛乐的祝福 - 圣光祝福光环特效
 * 精神使者BUFF技能（Syle's Blessing）特效组件
 * 从精神使者导师赛乐习得的精神奥秘，大幅度增加使用者的精神和体魄
 * 持久化循环动画，BUFF存活期间持续播放
 * 色彩方案：祝福金(#FFD700) + 精神翠(#50C878) + 神秘紫(#9370DB) + 圣光白(#FFFEF0)
 * 定位：通过 JS 动态查找 #playerAvatar 元素，精确环绕施法者头像边框
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

/** 舞台 DOM 引用 */
const stageRef = ref(null)

/** 头像区域位置信息（相对定位父容器） */
const avatarRect = ref({ left: 0, top: 0, width: 100, height: 100 })

/** 窗口 resize 回调引用 */
let resizeHandler = null

/**
 * 计算祝福舞台的动态样式
 * 根据 #playerAvatar 的实际位置和尺寸，精确定位光环环绕头像区域
 * 光环略大于头像（各方向延伸 8px），确保完全环绕头像边框
 * @returns {Object} CSS 样式对象
 */
const stageStyle = computed(() => {
  const expand = 8
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
      console.warn('[SyleBlessingEffect] 未找到玩家头像元素 #playerAvatar')
      return
    }

    // 查找定位父容器（.player-card-area）
    const positioningParent = stage.offsetParent
    if (!positioningParent) {
      console.warn('[SyleBlessingEffect] 未找到定位父容器')
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
    console.warn('[SyleBlessingEffect] 更新头像位置失败:', e)
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
 * 计算祝福散落粒子的样式
 * 每个粒子从光柱落点向不同方向散落，模拟祝福降临时的碎片飞溅
 * 颜色交替使用金色、翠绿、紫色，对应智力与体质的双重祝福
 * @param {number} index - 粒子索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getDescendStyle (index) {
  const angle = (index - 1) * 36
  const distance = 40 + (index % 4) * 10
  const delay = (index % 5) * 0.03
  const colorType = index % 3
  const colors = [
    { color: 'rgba(255, 215, 0, 0.9)', glow: 'rgba(255, 215, 0, 0.6)' },
    { color: 'rgba(80, 200, 120, 0.9)', glow: 'rgba(80, 200, 120, 0.6)' },
    { color: 'rgba(147, 112, 219, 0.9)', glow: 'rgba(147, 112, 219, 0.6)' }
  ]
  const c = colors[colorType]
  return {
    '--sb-desc-angle': `${angle}deg`,
    '--sb-desc-dist': `${distance}px`,
    '--sb-desc-color': c.color,
    '--sb-desc-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算环绕粒子的样式
 * 8个粒子沿光环边缘旋转，对应祝福的持续加持效果
 * 颜色交替使用金色、翠绿、紫色、白色，代表精神与体魄的双重祝福
 * @param {number} index - 粒子索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getOrbitStyle (index) {
  const angle = (index - 1) * 45
  const radius = 54
  const duration = 3.5 + (index % 2) * 0.6
  const delay = 1.2 + (index % 4) * 0.25
  const colorType = index % 4
  const colors = [
    { color: 'rgba(255, 215, 0, 0.95)', glow: 'rgba(255, 215, 0, 0.7)' },
    { color: 'rgba(80, 200, 120, 0.95)', glow: 'rgba(80, 200, 120, 0.7)' },
    { color: 'rgba(147, 112, 219, 0.95)', glow: 'rgba(147, 112, 219, 0.7)' },
    { color: 'rgba(255, 254, 240, 0.95)', glow: 'rgba(255, 215, 0, 0.7)' }
  ]
  const c = colors[colorType]
  return {
    '--sb-orbit-angle': `${angle}deg`,
    '--sb-orbit-radius': `${radius}px`,
    '--sb-orbit-duration': `${duration}s`,
    '--sb-orbit-color': c.color,
    '--sb-orbit-glow': c.glow,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   赛乐的祝福 (spirit_mage_syle_blessing) - 圣光祝福光环特效
   技能描述：从精神使者导师赛乐习得的精神奥秘，大幅度增加使用者的精神和体魄
   色彩方案：祝福金(#FFD700) + 精神翠(#50C878) + 神秘紫(#9370DB) + 圣光白(#FFFEF0)
   GPU加速：contain隔离 + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   定位：通过 JS 动态查找 #playerAvatar，精确环绕施法者头像边框
   ================================================================ */

/* 祝福舞台 - 定位容器，由 JS 动态设置 left/top/width/height 精确环绕头像 */
.sb-stage {
  position: absolute;
  contain: layout style;
  pointer-events: none;
  z-index: 50;
  animation: sb-stage-appear 0.6s ease-out forwards;
  will-change: opacity, transform;
}
@keyframes sb-stage-appear {
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
   阶段⓪：祝福降临（0s ~ 0.6s）
   ================================================================ */

/* 天降光柱 - 从顶部降下的金色祝福光柱 */
.sb-beam {
  position: absolute;
  top: -20%;
  left: 50%;
  width: 16px;
  height: 70%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 215, 0, 0.1) 15%,
    rgba(255, 215, 0, 0.4) 40%,
    rgba(255, 254, 240, 0.7) 70%,
    rgba(255, 215, 0, 0.5) 90%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(3px);
  transform: translate3d(-50%, 0, 0) scaleY(0);
  animation: sb-beam-descend 0.6s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes sb-beam-descend {
  0% {
    transform: translate3d(-50%, -30%, 0) scaleY(0);
    opacity: 0;
  }
  40% {
    transform: translate3d(-50%, 0, 0) scaleY(0.6);
    opacity: 0.8;
  }
  70% {
    transform: translate3d(-50%, 0, 0) scaleY(1);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, 0, 0) scaleY(0.8);
    opacity: 0;
  }
}

/* 祝福散落粒子 - 光柱触地时四散的祝福碎片 */
.sb-descend {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 254, 240, 1) 0%,
    var(--sb-desc-color, rgba(255, 215, 0, 0.9)) 40%,
    transparent 100%
  );
  box-shadow: 0 0 5px var(--sb-desc-glow, rgba(255, 215, 0, 0.6));
  transform: translate3d(-50%, -50%, 0) rotate(var(--sb-desc-angle, 0deg)) translateX(0px) scale(0);
  animation: sb-descend-scatter 0.6s ease-out 0.2s forwards;
  will-change: transform, opacity;
}
@keyframes sb-descend-scatter {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sb-desc-angle, 0deg)) translateX(0px) scale(0);
    opacity: 0;
  }
  30% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--sb-desc-angle, 0deg)) translateX(0px) scale(1.5);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sb-desc-angle, 0deg)) translateX(var(--sb-desc-dist, 40px)) scale(0.2);
    opacity: 0;
  }
}

/* 祝福绽放 - 光柱落地的径向爆发闪光 */
.sb-bloom {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 254, 240, 0.6) 20%,
    rgba(255, 215, 0, 0.35) 45%,
    rgba(147, 112, 219, 0.15) 70%,
    transparent 85%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: sb-bloom-burst 0.5s ease-out 0.3s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}
@keyframes sb-bloom-burst {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  40% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2.2);
    opacity: 0;
  }
}

/* ================================================================
   阶段①：祝福激活（0.4s ~ 1.2s）
   ================================================================ */

/* 圣光光环外层 - 整体发光氛围 */
.sb-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 115%;
  height: 115%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.18) 0%,
    rgba(80, 200, 120, 0.1) 30%,
    rgba(147, 112, 219, 0.08) 55%,
    rgba(255, 215, 0, 0.04) 75%,
    transparent 85%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: sb-aura-appear 0.5s ease-out 0.4s forwards, sb-aura-pulse 3s ease-in-out 1.2s infinite;
  will-change: transform, opacity;
  filter: blur(5px);
}
@keyframes sb-aura-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}
@keyframes sb-aura-pulse {
  0%, 100% {
    opacity: 0.4;
    transform: translate3d(-50%, -50%, 0) scale(1);
  }
  50% {
    opacity: 0.85;
    transform: translate3d(-50%, -50%, 0) scale(1.06);
  }
}

/* 圣光光环主体 - 金色光环框架 */
.sb-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 88%;
  height: 88%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: sb-halo-appear 0.5s ease-out 0.4s forwards;
  will-change: transform, opacity;
}
@keyframes sb-halo-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0) rotate(-180deg);
    opacity: 0;
  }
  60% {
    transform: translate3d(-50%, -50%, 0) scale(1.1) rotate(10deg);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* 光环能量场 - 半透明祝福能量填充背景 */
.sb-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(255, 215, 0, 0.18) 0%,
    rgba(80, 200, 120, 0.1) 35%,
    rgba(147, 112, 219, 0.08) 65%,
    rgba(255, 215, 0, 0.04) 100%
  );
  animation: sb-field-pulse 2.5s ease-in-out infinite;
  will-change: opacity;
}
@keyframes sb-field-pulse {
  0%, 100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}

/* 光环边框 - 发光的金色圆环 */
.sb-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.5);
  background: conic-gradient(
    from 0deg,
    rgba(255, 215, 0, 0.5) 0deg,
    rgba(80, 200, 120, 0.35) 60deg,
    rgba(255, 254, 240, 0.5) 120deg,
    rgba(147, 112, 219, 0.4) 180deg,
    rgba(255, 215, 0, 0.5) 240deg,
    rgba(80, 200, 120, 0.35) 300deg,
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
    0 0 5px rgba(80, 200, 120, 0.3),
    inset 0 0 6px rgba(255, 215, 0, 0.2);
  animation: sb-border-glow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}
@keyframes sb-border-glow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 10px rgba(255, 215, 0, 0.5),
      0 0 5px rgba(80, 200, 120, 0.3),
      inset 0 0 6px rgba(255, 215, 0, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 16px rgba(255, 215, 0, 0.8),
      0 0 10px rgba(80, 200, 120, 0.5),
      0 0 5px rgba(255, 254, 240, 0.4),
      inset 0 0 8px rgba(255, 215, 0, 0.3);
  }
}

/* 祝福波纹 - 从中心向外扩散的圆形光环 */
.sb-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 215, 0, 0.6);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}
.sb-wave.wave-1 {
  animation: sb-wave-expand 2.5s ease-out 0.8s infinite;
}
.sb-wave.wave-2 {
  animation: sb-wave-expand 2.5s ease-out 1.6s infinite;
}
.sb-wave.wave-3 {
  animation: sb-wave-expand 2.5s ease-out 2.1s infinite;
}
@keyframes sb-wave-expand {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.3);
    opacity: 0;
    border-color: rgba(255, 254, 240, 0.8);
  }
  20% {
    opacity: 0.85;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(3);
    opacity: 0;
    border-color: rgba(255, 215, 0, 0.1);
  }
}

/* 表面圣光扫过 - 偶发的祝福光芒扫过光环表面 */
.sb-sheen {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    transparent 0%,
    transparent 35%,
    rgba(255, 254, 240, 0.2) 47%,
    rgba(255, 255, 255, 0.45) 50%,
    rgba(255, 254, 240, 0.2) 53%,
    transparent 65%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) rotate(0deg);
  opacity: 0;
  animation: sb-sheen-sweep 4s ease-in-out 1.5s infinite;
  will-change: transform, opacity;
}
@keyframes sb-sheen-sweep {
  0%, 60% {
    transform: translate3d(-50%, -50%, 0) rotate(0deg);
    opacity: 0;
  }
  70% {
    opacity: 0.5;
    transform: translate3d(-50%, -50%, 0) rotate(45deg);
  }
  85% {
    opacity: 0.8;
    transform: translate3d(-50%, -50%, 0) rotate(90deg);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(135deg);
    opacity: 0;
  }
}

/* ================================================================
   符文圆环 - 旋转的祝福符文（双层）
   ================================================================ */

.sb-rune-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
}

/* 外圈符文 - 顺时针旋转，代表智力（精神）加成，金色为主 */
.rune-outer {
  width: 78%;
  height: 78%;
  border: 1px dashed rgba(255, 215, 0, 0.4);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.18) 30deg,
    transparent 60deg,
    rgba(147, 112, 219, 0.14) 120deg,
    transparent 150deg,
    rgba(255, 254, 240, 0.16) 210deg,
    transparent 240deg,
    rgba(255, 215, 0, 0.18) 300deg,
    transparent 360deg
  );
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.25);
  animation: sb-rune-outer-appear 0.4s ease-out 0.6s forwards, sb-rune-outer-spin 6s linear 1.2s infinite;
}
@keyframes sb-rune-outer-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.7;
  }
}
@keyframes sb-rune-outer-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); }
}

/* 内圈符文 - 逆时针旋转，代表体质（体魄）加成，翠绿为主 */
.rune-inner {
  width: 58%;
  height: 58%;
  border: 1px solid rgba(80, 200, 120, 0.25);
  background: conic-gradient(
    from 180deg,
    transparent 0deg,
    rgba(80, 200, 120, 0.16) 45deg,
    transparent 90deg,
    rgba(255, 215, 0, 0.14) 180deg,
    transparent 225deg,
    rgba(255, 254, 240, 0.15) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 5px rgba(80, 200, 120, 0.15);
  animation: sb-rune-inner-appear 0.4s ease-out 0.7s forwards, sb-rune-inner-spin 4.5s linear 1.3s infinite;
}
@keyframes sb-rune-inner-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.6;
  }
}
@keyframes sb-rune-inner-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); }
}

/* ================================================================
   中央祝福核心 - 发光的祝福之球
   ================================================================ */

.sb-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: sb-core-appear 0.4s ease-out 0.8s forwards;
  will-change: transform, opacity;
}
@keyframes sb-core-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  60% {
    transform: translate3d(-50%, -50%, 0) scale(1.5);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}

/* 祝福核心内部 - 多色发光能量球 */
.sb-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 254, 240, 0.95) 20%,
    rgba(255, 215, 0, 0.85) 50%,
    rgba(80, 200, 120, 0.5) 80%,
    rgba(147, 112, 219, 0.3) 100%
  );
  box-shadow:
    0 0 8px rgba(255, 215, 0, 0.9),
    0 0 16px rgba(255, 215, 0, 0.5),
    0 0 24px rgba(80, 200, 120, 0.3);
  animation: sb-core-pulse 1.8s ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes sb-core-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.4);
    opacity: 1;
  }
}

/* ================================================================
   阶段②：持续运转 - 环绕粒子
   ================================================================ */

/* 环绕粒子 - 沿光环边缘旋转的祝福光粒 */
.sb-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--sb-orbit-color, rgba(255, 215, 0, 0.95)) 0%,
    transparent 100%
  );
  box-shadow: 0 0 5px var(--sb-orbit-glow, rgba(255, 215, 0, 0.7));
  transform: translate3d(-50%, -50%, 0) rotate(var(--sb-orbit-angle, 0deg)) translateX(var(--sb-orbit-radius, 54px)) scale(0);
  opacity: 0;
  animation: sb-orbit var(--sb-orbit-duration, 4s) linear infinite;
  will-change: transform, opacity;
}
@keyframes sb-orbit {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sb-orbit-angle, 0deg)) translateX(var(--sb-orbit-radius, 54px)) scale(0.5);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--sb-orbit-angle, 0deg)) translateX(var(--sb-orbit-radius, 54px)) scale(1.3);
  }
  85% {
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--sb-orbit-angle, 0deg) + 360deg)) translateX(var(--sb-orbit-radius, 54px)) scale(0.5);
    opacity: 0;
  }
}

/* ================================================================
   偶发祝福闪烁 - 暗示祝福正在持续增强力量
   ================================================================ */

.sb-sparkle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 88%;
  height: 88%;
  border-radius: 50%;
  border: 2px solid rgba(255, 254, 240, 0.6);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}
.sparkle-1 {
  animation: sb-sparkle-flash 5s ease-out 2.5s infinite;
}
.sparkle-2 {
  animation: sb-sparkle-flash 6s ease-out 4.5s infinite;
}
@keyframes sb-sparkle-flash {
  0%, 85% {
    transform: translate3d(-50%, -50%, 0) scale(0.8);
    opacity: 0;
    border-color: rgba(255, 254, 240, 0.6);
  }
  90% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.8;
    border-color: rgba(255, 255, 255, 0.95);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.6);
    opacity: 0;
    border-color: rgba(255, 215, 0, 0.2);
  }
}

/* ================================================================
   持续光柱 - 激活后持续存在的微弱祝福光柱
   ================================================================ */

.sb-beam-persistent {
  position: absolute;
  top: -15%;
  left: 50%;
  width: 8px;
  height: 55%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 215, 0, 0.08) 20%,
    rgba(255, 254, 240, 0.2) 50%,
    rgba(255, 215, 0, 0.1) 80%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(2px);
  transform: translate3d(-50%, 0, 0) scaleY(0);
  animation: sb-beam-persistent-appear 0.5s ease-out 1s forwards, sb-beam-persistent-breathe 3s ease-in-out 1.5s infinite;
  will-change: transform, opacity;
}
@keyframes sb-beam-persistent-appear {
  0% {
    transform: translate3d(-50%, 0, 0) scaleY(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, 0, 0) scaleY(1);
    opacity: 0.6;
  }
}
@keyframes sb-beam-persistent-breathe {
  0%, 100% {
    opacity: 0.3;
    transform: translate3d(-50%, 0, 0) scaleY(0.9);
  }
  50% {
    opacity: 0.7;
    transform: translate3d(-50%, 0, 0) scaleY(1.05);
  }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .sb-stage * {
    animation-duration: 0.5s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
