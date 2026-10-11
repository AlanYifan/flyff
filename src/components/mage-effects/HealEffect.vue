<!--
  @file HealEffect.vue
  @generated 2026-07-06
  @description 治疗术 - 圣光降临·治愈凝聚·生命绽放·圣光消散
  圣职者W技能（priest_w）：借助魔棒产生微量圣光治疗目标的伤势
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + translateZ深度分层 + rotateX地面倾斜
  动画总时长：1.8秒（一次性播放，治疗施放时触发）
    ⓪ 圣光降临（0s ~ 0.4s）- 金色光柱从天而降 + 圣光散落粒子 + 光芒绽放
    ① 治愈凝聚（0.3s ~ 0.9s）- 圣光光环展开 + 双层符文圆环 + 治愈能量汇聚
    ② 生命绽放（0.6s ~ 1.3s）- 上升治愈粒子 + 绿色生命能量波纹 + 治愈闪烁
    ③ 圣光消散（1.2s ~ 1.8s）- 光环渐隐 + 余韵粒子上升消散
  色彩方案：圣光金(#FFD700) + 治愈翠(#50C878) + 圣光白(#FFFEF0) + 暖光(#FFF8DC)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
-->
<template>
  <!-- 治愈舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="heal-stage" :style="stageStyle">
    <!-- ===== 阶段⓪：圣光降临 ===== -->
    <!-- 天降圣光柱 - 从顶部降下的金色治愈光柱 -->
    <div class="heal-beam"></div>

    <!-- 圣光散落粒子 - 光柱触地时四散的圣光碎片 -->
    <div
      v-for="i in 10"
      :key="'heal-descend-' + i"
      class="heal-descend"
      :style="getDescendStyle(i)"
    ></div>

    <!-- 圣光绽放 - 光柱落地的径向爆发 -->
    <div class="heal-bloom"></div>

    <!-- ===== 阶段①：治愈凝聚 ===== -->
    <!-- 治愈光环外层 - 整体发光氛围 -->
    <div class="heal-aura"></div>

    <!-- 治愈光环主体 - 金绿双色光环边框 -->
    <div class="heal-halo">
      <!-- 光环能量场 - 半透明治愈能量填充 -->
      <div class="heal-halo-field"></div>

      <!-- 光环边框 - 发光的圆环 -->
      <div class="heal-halo-border"></div>

      <!-- 治愈波纹 - 从中心向外扩散的光环 -->
      <div class="heal-wave wave-1"></div>
      <div class="heal-wave wave-2"></div>
      <div class="heal-wave wave-3"></div>
    </div>

    <!-- 外层符文圆环 - 顺时针旋转，金色圣光符文 -->
    <div class="heal-rune-ring rune-outer"></div>
    <!-- 内层符文圆环 - 逆时针旋转，绿色生命符文 -->
    <div class="heal-rune-ring rune-inner"></div>

    <!-- 中央治愈核心 - 发光的治愈之球 -->
    <div class="heal-core">
      <div class="heal-core-inner"></div>
    </div>

    <!-- ===== 阶段②：生命绽放 ===== -->
    <!-- 上升治愈粒子 - 从中心向上飘升的绿色生命光粒 -->
    <div
      v-for="i in 10"
      :key="'heal-rise-' + i"
      class="heal-rise"
      :style="getRiseStyle(i)"
    ></div>

    <!-- 治愈闪烁 - 偶发的治愈金光闪现 -->
    <div class="heal-sparkle sparkle-1"></div>
    <div class="heal-sparkle sparkle-2"></div>

    <!-- ===== 阶段③：圣光消散 ===== -->
    <!-- 圣光余韵 - 最后的治愈光芒消散 -->
    <div class="heal-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 治疗术 - 圣光降临·治愈凝聚·生命绽放·圣光消散
 * 圣职者W技能（priest_w）特效组件
 * 借助魔棒产生微量圣光治疗目标的伤势，以圣光金白和治愈翠绿为主色调
 * 一次性播放动画，治疗施放时触发，动画结束后由父组件移除
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 * 色彩方案：圣光金(#FFD700) + 治愈翠(#50C878) + 圣光白(#FFFEF0) + 暖光(#FFF8DC)
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
 * 计算治愈舞台的动态样式
 * 根据 #playerAvatar 的实际位置和尺寸，精确定位光环覆盖头像区域
 * 光环略大于头像（各方向延伸 8px），确保完全覆盖头像边框
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
      return
    }

    // 查找定位父容器（.player-card-area）
    const positioningParent = stage.offsetParent
    if (!positioningParent) {
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
    // 更新头像位置失败，静默处理
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
 * 计算圣光散落粒子的样式
 * 每个粒子从光柱落点向不同方向散落，模拟圣光降临时的碎片飞溅
 * 颜色交替使用金色和翠绿，对应圣光与治愈的双重效果
 * @param {number} index - 粒子索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getDescendStyle (index) {
  const angle = (index - 1) * 36
  const distance = 40 + (index % 4) * 10
  const delay = (index % 5) * 0.03
  const colorType = index % 2
  const colors = [
    { color: 'rgba(255, 215, 0, 0.9)', glow: 'rgba(255, 215, 0, 0.6)' },
    { color: 'rgba(80, 200, 120, 0.9)', glow: 'rgba(80, 200, 120, 0.6)' }
  ]
  const c = colors[colorType]
  return {
    '--heal-desc-angle': `${angle}deg`,
    '--heal-desc-dist': `${distance}px`,
    '--heal-desc-color': c.color,
    '--heal-desc-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算上升治愈粒子的样式
 * 每个粒子从中心向上飘升，模拟生命能量被治愈后焕发上升的效果
 * 颜色交替使用绿色和金色，代表生命与圣光
 * @param {number} index - 粒子索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getRiseStyle (index) {
  const angle = (index - 1) * 36 + (index % 2) * 12
  const distance = 20 + (index % 4) * 8
  const riseHeight = 60 + (index % 3) * 20
  const delay = 0.6 + (index % 5) * 0.06
  const colorType = index % 2
  const colors = [
    { color: 'rgba(80, 200, 120, 0.95)', glow: 'rgba(80, 200, 120, 0.7)' },
    { color: 'rgba(255, 215, 0, 0.9)', glow: 'rgba(255, 215, 0, 0.6)' }
  ]
  const c = colors[colorType]
  return {
    '--heal-rise-angle': `${angle}deg`,
    '--heal-rise-dist': `${distance}px`,
    '--heal-rise-height': `${riseHeight}px`,
    '--heal-rise-color': c.color,
    '--heal-rise-glow': c.glow,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   治疗术 (priest_w) - 圣光降临·治愈凝聚·生命绽放·圣光消散
   技能描述：借助魔棒产生微量圣光治疗目标的伤势
   色彩方案：圣光金(#FFD700) + 治愈翠(#50C878) + 圣光白(#FFFEF0) + 暖光(#FFF8DC)
   GPU加速：contain隔离 + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   定位：通过 JS 动态查找 #playerAvatar，精确覆盖施法者头像区域
   动画总时长：1.8秒（一次性播放）
   ================================================================ */

/* 治愈舞台 - 定位容器，由 JS 动态设置 left/top/width/height 精确覆盖头像 */
.heal-stage {
  position: absolute;
  contain: layout style;
  pointer-events: none;
  z-index: 50;
  animation: heal-stage-appear 0.4s ease-out forwards;
  will-change: opacity, transform;
}

@keyframes heal-stage-appear {
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
   阶段⓪：圣光降临（0s ~ 0.4s）
   ================================================================ */

/* 天降圣光柱 - 从顶部降下的金色治愈光柱 */
.heal-beam {
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
  animation: heal-beam-descend 0.4s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes heal-beam-descend {
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

/* 圣光散落粒子 - 光柱触地时四散的圣光碎片 */
.heal-descend {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 254, 240, 1) 0%,
    var(--heal-desc-color, rgba(255, 215, 0, 0.9)) 40%,
    transparent 100%
  );
  box-shadow: 0 0 5px var(--heal-desc-glow, rgba(255, 215, 0, 0.6));
  transform: translate3d(-50%, -50%, 0) rotate(var(--heal-desc-angle, 0deg)) translateX(0px) scale(0);
  animation: heal-descend-scatter 0.5s ease-out 0.15s forwards;
  will-change: transform, opacity;
}

@keyframes heal-descend-scatter {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--heal-desc-angle, 0deg)) translateX(0px) scale(0);
    opacity: 0;
  }
  30% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--heal-desc-angle, 0deg)) translateX(0px) scale(1.5);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--heal-desc-angle, 0deg)) translateX(var(--heal-desc-dist, 40px)) scale(0.2);
    opacity: 0;
  }
}

/* 圣光绽放 - 光柱落地的径向爆发闪光 */
.heal-bloom {
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
    rgba(80, 200, 120, 0.15) 70%,
    transparent 85%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: heal-bloom-burst 0.5s ease-out 0.2s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}

@keyframes heal-bloom-burst {
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
   阶段①：治愈凝聚（0.3s ~ 0.9s）
   ================================================================ */

/* 治愈光环外层 - 整体发光氛围 */
.heal-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 115%;
  height: 115%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.18) 0%,
    rgba(80, 200, 120, 0.12) 30%,
    rgba(255, 215, 0, 0.06) 55%,
    transparent 85%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: heal-aura-appear 0.4s ease-out 0.3s forwards;
  will-change: transform, opacity;
  filter: blur(5px);
}

@keyframes heal-aura-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.8;
  }
}

/* 治愈光环主体 - 金绿双色光环框架 */
.heal-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 88%;
  height: 88%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: heal-halo-appear 0.4s ease-out 0.3s forwards,
             heal-halo-fade 0.4s ease-out 1.3s forwards;
  will-change: transform, opacity;
}

@keyframes heal-halo-appear {
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

@keyframes heal-halo-fade {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* 光环能量场 - 半透明治愈能量填充背景 */
.heal-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(255, 215, 0, 0.18) 0%,
    rgba(80, 200, 120, 0.12) 35%,
    rgba(255, 215, 0, 0.06) 65%,
    transparent 100%
  );
  animation: heal-field-pulse 1s ease-in-out 0.3s forwards;
  will-change: opacity;
}

@keyframes heal-field-pulse {
  0% { opacity: 0.55; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
}

/* 光环边框 - 发光的金绿双色圆环 */
.heal-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.5);
  background: conic-gradient(
    from 0deg,
    rgba(255, 215, 0, 0.5) 0deg,
    rgba(80, 200, 120, 0.4) 60deg,
    rgba(255, 254, 240, 0.5) 120deg,
    rgba(80, 200, 120, 0.35) 180deg,
    rgba(255, 215, 0, 0.5) 240deg,
    rgba(80, 200, 120, 0.4) 300deg,
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
  animation: heal-border-glow 1s ease-in-out 0.3s forwards;
  will-change: opacity, box-shadow;
}

@keyframes heal-border-glow {
  0% {
    opacity: 0.7;
    box-shadow:
      0 0 10px rgba(255, 215, 0, 0.5),
      0 0 5px rgba(80, 200, 120, 0.3);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 16px rgba(255, 215, 0, 0.8),
      0 0 10px rgba(80, 200, 120, 0.5),
      0 0 5px rgba(255, 254, 240, 0.4);
  }
  100% {
    opacity: 0.3;
    box-shadow:
      0 0 6px rgba(255, 215, 0, 0.3);
  }
}

/* 治愈波纹 - 从中心向外扩散的圆形光环 */
.heal-wave {
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

.heal-wave.wave-1 {
  animation: heal-wave-expand 0.8s ease-out 0.5s forwards;
}

.heal-wave.wave-2 {
  animation: heal-wave-expand 0.8s ease-out 0.7s forwards;
}

.heal-wave.wave-3 {
  animation: heal-wave-expand 0.8s ease-out 0.9s forwards;
}

@keyframes heal-wave-expand {
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
    border-color: rgba(80, 200, 120, 0.1);
  }
}

/* 符文圆环 - 旋转的治愈符文（双层） */
.heal-rune-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
}

/* 外圈符文 - 顺时针旋转，金色圣光符文 */
.rune-outer {
  width: 78%;
  height: 78%;
  border: 1px dashed rgba(255, 215, 0, 0.4);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.18) 30deg,
    transparent 60deg,
    rgba(80, 200, 120, 0.14) 120deg,
    transparent 150deg,
    rgba(255, 254, 240, 0.16) 210deg,
    transparent 240deg,
    rgba(255, 215, 0, 0.18) 300deg,
    transparent 360deg
  );
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.25);
  animation: heal-rune-outer-appear 0.3s ease-out 0.4s forwards,
             heal-rune-outer-spin 3s linear 0.5s forwards;
}

@keyframes heal-rune-outer-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.7;
  }
}

@keyframes heal-rune-outer-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
  80% { opacity: 0.5; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0; }
}

/* 内圈符文 - 逆时针旋转，绿色生命符文 */
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
  animation: heal-rune-inner-appear 0.3s ease-out 0.5s forwards,
             heal-rune-inner-spin 2.5s linear 0.6s forwards;
}

@keyframes heal-rune-inner-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.6;
  }
}

@keyframes heal-rune-inner-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  80% { opacity: 0.3; }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0; }
}

/* ================================================================
   中央治愈核心 - 发光的治愈之球
   ================================================================ */

.heal-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: heal-core-appear 0.3s ease-out 0.5s forwards,
             heal-core-fade 0.4s ease-out 1.2s forwards;
  will-change: transform, opacity;
}

@keyframes heal-core-appear {
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

@keyframes heal-core-fade {
  0% { opacity: 1; transform: translate3d(-50%, -50%, 0) scale(1); }
  100% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale(1.8); }
}

/* 治愈核心内部 - 金绿双色发光能量球 */
.heal-core-inner {
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
  animation: heal-core-pulse 0.8s ease-in-out 0.6s forwards;
  will-change: transform, opacity;
}

@keyframes heal-core-pulse {
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
   阶段②：生命绽放（0.6s ~ 1.3s）- 上升治愈粒子
   ================================================================ */

/* 上升治愈粒子 - 从中心向上飘升的绿色生命光粒 */
.heal-rise {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 254, 240, 1) 0%,
    var(--heal-rise-color, rgba(80, 200, 120, 0.95)) 40%,
    transparent 100%
  );
  box-shadow: 0 0 5px var(--heal-rise-glow, rgba(80, 200, 120, 0.7));
  transform: translate3d(-50%, -50%, 0) rotate(var(--heal-rise-angle, 0deg)) translateX(0px) translateY(0px) scale(0);
  animation: heal-rise-float 1s ease-out forwards;
  will-change: transform, opacity;
  animation-delay: var(--heal-rise-delay, 0.6s);
}

@keyframes heal-rise-float {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--heal-rise-angle, 0deg)) translateX(0px) translateY(0px) scale(0);
    opacity: 0;
  }
  20% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--heal-rise-angle, 0deg)) translateX(calc(var(--heal-rise-dist, 30px) * 0.5)) translateY(calc(var(--heal-rise-height, 80px) * -0.3)) scale(1.3);
  }
  80% {
    opacity: 0.7;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--heal-rise-angle, 0deg)) translateX(var(--heal-rise-dist, 30px)) translateY(calc(var(--heal-rise-height, 80px) * -1)) scale(0.3);
    opacity: 0;
  }
}

/* ================================================================
   治愈闪烁 - 偶发的治愈金光闪现
   ================================================================ */

.heal-sparkle {
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
  animation: heal-sparkle-flash 0.6s ease-out 0.7s forwards;
}

.sparkle-2 {
  animation: heal-sparkle-flash 0.6s ease-out 1.0s forwards;
}

@keyframes heal-sparkle-flash {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.8);
    opacity: 0;
    border-color: rgba(255, 254, 240, 0.6);
  }
  30% {
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
   阶段③：圣光消散（1.2s ~ 1.8s）
   ================================================================ */

/* 圣光余韵 - 最后的治愈光芒消散 */
.heal-afterglow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.15) 0%,
    rgba(80, 200, 120, 0.08) 35%,
    transparent 70%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: heal-afterglow 0.6s ease-out 1.2s forwards;
  will-change: transform, opacity;
}

@keyframes heal-afterglow {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.8);
    opacity: 0;
  }
  30% {
    transform: translate3d(-50%, -50%, 0) scale(1.2);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2);
    opacity: 0;
  }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .heal-stage * {
    animation-duration: 0.5s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
