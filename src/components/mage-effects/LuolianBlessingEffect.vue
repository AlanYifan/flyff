<!--
  @file LuolianBlessingEffect.vue
  @generated 2026-07-10
  @description 萝丽安的祝福（持久BUFF特效）- 暗影觉醒·致命暴击·嗜血杀戮·大师传承
  暗杀者U技能（assassin_u）：传承于暗杀者大师-萝丽安的杀戮之力,
  施法后大幅度提升敏捷与暴击伤害,助你杀人于无形~
  敏捷以暗影紫(#9932CC)表现,暴击伤害以猩红赤焰(#DC143C)表现,
  吸血以血红暗芒(#8B0000)表现,大师传承以暗金(#FFD700)表现
  BUFF持续期间一直显示，BUFF到期后由父组件通过 v-if 移除
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 1.2s）- 暗影降临 + 三色匕首光柱汇聚 + 能量爆发 + 杀戮成形
    持续循环 - 暗影符文双环旋转 + 猩红暴击刃芒闪烁 + 血雾吸血粒子 +
              中央暗影核心脉动 + 匕首粒子涡旋 + 暗影波纹 + 偶发杀意闪光
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
-->
<template>
  <!-- 祝福舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="lb-stage" :style="stageStyle">
    <!-- ===== 入场动画：暗影降临（0s ~ 1.2s）===== -->
    <!-- 暗影暗幕 - 紫黑氛围笼罩（入场后渐隐） -->
    <div class="lb-dim"></div>

    <!-- 三色匕首光柱 - 暗影紫（敏捷）与猩红（暴击）与血红（吸血）光柱从天而降 -->
    <div
      v-for="i in 6"
      :key="'lb-beam-' + i"
      class="lb-beam"
      :style="getBeamStyle(i)"
    ></div>

    <!-- 暗影能量爆发 - 汇聚后的径向爆发 -->
    <div class="lb-burst">
      <div class="lb-burst-inner"></div>
    </div>

    <!-- 三色凝聚流 - 从六方螺旋汇聚至中心（入场一次性） -->
    <div
      v-for="i in 6"
      :key="'lb-stream-' + i"
      class="lb-stream"
      :style="getStreamStyle(i)"
    ></div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 大师光晕 - 外层柔和暗金发光氛围（持续显示） -->
    <div class="lb-aura"></div>

    <!-- 暗影光环主体 - 发光的紫赤双色祝福光环边框 -->
    <div class="lb-halo">
      <div class="lb-halo-field"></div>
      <div class="lb-halo-border"></div>
    </div>

    <!-- 外层暗影符文圆环 - 顺时针持续旋转 -->
    <div class="lb-rune-ring ring-outer">
      <div class="lb-rune-ring-inner"></div>
    </div>
    <!-- 内层暴击符文圆环 - 逆时针持续旋转 -->
    <div class="lb-rune-ring ring-inner">
      <div class="lb-rune-ring-inner"></div>
    </div>

    <!-- 暗影波纹 - 从中心向外周期性扩散 -->
    <div class="lb-wave wave-1"></div>
    <div class="lb-wave wave-2"></div>
    <div class="lb-wave wave-3"></div>

    <!-- 中央暗影核心 - 发光的杀戮祝福之球，持续脉冲 -->
    <div class="lb-core">
      <div class="lb-core-inner"></div>
    </div>

    <!-- 敏捷粒子涡旋 - 12颗粒子沿圆形轨道持续旋转 -->
    <div class="lb-orbit">
      <div
        v-for="i in 12"
        :key="'lb-orbit-particle-' + i"
        class="lb-orbit-particle"
        :style="getOrbitParticleStyle(i)"
      ></div>
    </div>

    <!-- 暗影能量球轨道 - 6颗能量球沿光环边缘持续旋转 -->
    <div class="lb-energy-orbit">
      <div
        v-for="i in 6"
        :key="'lb-energy-' + i"
        class="lb-energy-ball"
        :style="getEnergyOrbitStyle(i)"
      >
        <div class="lb-energy-ball-inner"></div>
      </div>
    </div>

    <!-- 暴击刃芒闪光 - 周期性闪烁的猩红刃芒能量，代表暴击伤害提升 -->
    <div class="lb-crit-flash crit-1"></div>
    <div class="lb-crit-flash crit-2"></div>
    <div class="lb-crit-flash crit-3"></div>

    <!-- 杀戮纹章 - 持续旋转脉冲的暗杀者大师标志 -->
    <div class="lb-emblem">
      <div class="lb-emblem-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 萝丽安的祝福（持久BUFF特效）- 暗影觉醒·致命暴击·嗜血杀戮·大师传承
 * 暗杀者U技能（assassin_u）特效组件
 * 传承于暗杀者大师-萝丽安的杀戮之力，
 * 施法后大幅度提升敏捷与暴击伤害，大圆满时获得吸血加成
 * 敏捷以暗影紫表现，暴击伤害以猩红赤焰表现，
 * 吸血以血红暗芒表现，大师传承以暗金为主色调
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
 * 三色能量表 - 暗影紫（敏捷）与猩红（暴击）与血红（吸血）交替
 * 每种颜色有主色、辉光色和浅色三个变体
 */
const BLESSING_COLORS = [
  { color: '#9932CC', glow: 'rgba(153, 50, 204, 0.8)', light: 'rgba(200, 130, 255, 0.95)' },   // 暗影紫 - 敏捷
  { color: '#DC143C', glow: 'rgba(220, 20, 60, 0.8)', light: 'rgba(255, 100, 120, 0.95)' },     // 猩红 - 暴击
  { color: '#8B0000', glow: 'rgba(139, 0, 0, 0.8)', light: 'rgba(200, 50, 50, 0.95)' },         // 血红 - 吸血
  { color: '#9932CC', glow: 'rgba(153, 50, 204, 0.8)', light: 'rgba(200, 130, 255, 0.95)' },   // 暗影紫 - 敏捷
  { color: '#DC143C', glow: 'rgba(220, 20, 60, 0.8)', light: 'rgba(255, 100, 120, 0.95)' },     // 猩红 - 暴击
  { color: '#FFD700', glow: 'rgba(255, 215, 0, 0.8)', light: 'rgba(255, 240, 150, 0.95)' }      // 暗金 - 大圆满
]

/**
 * 计算祝福舞台的动态样式
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
 * @returns {void}
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
 * 生成三色匕首光柱的样式
 * 六道光柱从六个方向（60度间隔）降下，暗影紫与猩红与血红交替
 * @param {number} index - 光柱序号（1~6）
 * @returns {Object} CSS样式对象，含角度、颜色、延迟
 */
function getBeamStyle (index) {
  const angle = (index - 1) * 60
  const c = BLESSING_COLORS[(index - 1) % 6]
  const delay = (index - 1) * 0.05
  return {
    '--lb-beam-angle': `${angle}deg`,
    '--lb-beam-color': c.color,
    '--lb-beam-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成三色凝聚能量流的样式
 * 六道能量流从六个方向螺旋汇聚至中心
 * @param {number} index - 能量流序号（1~6）
 * @returns {Object} CSS样式对象，含角度、颜色、延迟
 */
function getStreamStyle (index) {
  const angle = (index - 1) * 60
  const c = BLESSING_COLORS[(index - 1) % 6]
  const delay = 0.3 + (index - 1) * 0.05
  return {
    '--lb-stream-angle': `${angle}deg`,
    '--lb-stream-color': c.color,
    '--lb-stream-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成环绕粒子的样式
 * 12颗粒子分为6组，每组对应一种祝福颜色
 * @param {number} index - 粒子序号（1~12）
 * @returns {Object} CSS样式对象，含角度、颜色、尺寸
 */
function getOrbitParticleStyle (index) {
  const angle = (index - 1) * 30
  const c = BLESSING_COLORS[(index - 1) % 6]
  const size = 5 + (index % 2) * 2
  return {
    '--lb-orbit-angle': `${angle}deg`,
    '--lb-orbit-color': c.color,
    '--lb-orbit-glow': c.glow,
    width: `${size}px`,
    height: `${size}px`
  }
}

/**
 * 生成暗影能量球轨道的样式
 * 6颗能量球沿光环边缘旋转，每颗对应一种祝福属性
 * @param {number} index - 能量球序号（1~6）
 * @returns {Object} CSS样式对象，含角度、颜色
 */
function getEnergyOrbitStyle (index) {
  const angle = (index - 1) * 60
  const c = BLESSING_COLORS[(index - 1) % 6]
  return {
    '--lb-energy-angle': `${angle}deg`,
    '--lb-energy-color': c.color,
    '--lb-energy-glow': c.glow,
    '--lb-energy-light': c.light
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
   萝丽安的祝福 (assassin_u / luolian_blessing) - 持久BUFF特效
   技能描述：传承于暗杀者大师-萝丽安的杀戮之力,
             施法后大幅度提升敏捷与暴击伤害,助你杀人于无形~
   敏捷增益：暗影紫(#9932CC) + 暴击伤害：猩红(#DC143C)
   吸血加成：血红(#8B0000) + 大师传承：暗金(#FFD700)
   GPU加速：contain隔离 + will-change + backface-visibility + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画结构：入场动画(1.2s) + 持续循环动画
   ================================================================ */

/* 祝福舞台 - 定位容器 */
.lb-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：暗影降临（0s ~ 1.2s）---------- */

/* 暗影暗幕 - 紫黑氛围笼罩（入场后渐隐） */
.lb-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at center,
    rgba(30, 10, 35, 0.4) 0%,
    rgba(25, 10, 20, 0.25) 50%,
    transparent 100%
  );
  animation: lbDim 1.2s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes lbDim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}

/* 三色匕首光柱 - 从六个方向降下的紫赤双色祝福光束（入场一次性） */
.lb-beam {
  position: absolute;
  top: -20%;
  left: 50%;
  width: 35%;
  height: 140%;
  transform: translateX(-50%) scaleY(0) rotate(var(--lb-beam-angle, 0deg));
  transform-origin: center top;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 15%,
    var(--lb-beam-glow, rgba(153, 50, 204, 0.3)) 40%,
    var(--lb-beam-color, #9932CC) 60%,
    var(--lb-beam-glow, rgba(153, 50, 204, 0.3)) 80%,
    transparent 100%
  );
  filter: blur(5px);
  opacity: 0;
  animation: lbBeam 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  will-change: transform, opacity;
  z-index: 2;
}

@keyframes lbBeam {
  0% {
    transform: translateX(-50%) scaleY(0) rotate(var(--lb-beam-angle, 0deg));
    opacity: 0;
  }
  30% {
    transform: translateX(-50%) scaleY(1) rotate(var(--lb-beam-angle, 0deg));
    opacity: 0.8;
  }
  60% {
    transform: translateX(-50%) scaleY(1) rotate(var(--lb-beam-angle, 0deg));
    opacity: 0.5;
  }
  100% {
    transform: translateX(-50%) scaleY(1) rotate(var(--lb-beam-angle, 0deg));
    opacity: 0;
  }
}

/* 暗影能量爆发 - 汇聚后的径向爆发（入场一次性） */
.lb-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: lbBurst 0.7s ease-out 0.35s forwards;
  will-change: transform, opacity;
  z-index: 3;
}

.lb-burst-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(153, 50, 204, 0.5) 20%,
    rgba(220, 20, 60, 0.35) 35%,
    rgba(139, 0, 0, 0.25) 50%,
    rgba(153, 50, 204, 0.2) 65%,
    rgba(220, 20, 60, 0.15) 80%,
    transparent 95%
  );
  filter: blur(4px);
}

@keyframes lbBurst {
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

/* 三色凝聚流 - 从六方螺旋汇聚至中心（入场一次性） */
.lb-stream {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    var(--lb-stream-color, #9932CC) 50%,
    var(--lb-stream-glow, rgba(153, 50, 204, 0.3)) 100%
  );
  box-shadow:
    0 0 8px var(--lb-stream-color, #9932CC),
    0 0 16px var(--lb-stream-glow, rgba(153, 50, 204, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--lb-stream-angle, 0deg)) translateX(120px) scale(0);
  opacity: 0;
  animation: lbStreamGather 0.6s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes lbStreamGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--lb-stream-angle, 0deg)) translateX(120px) scale(0.5);
    opacity: 0;
  }
  30% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--lb-stream-angle, 0deg) + 180deg)) translateX(0) scale(1.8);
    opacity: 0;
  }
}

/* ---------- 持续循环动画 ---------- */

/* 大师光晕 - 外层柔和暗金发光氛围（持续显示） */
.lb-aura {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 50%,
    rgba(153, 50, 204, 0.06) 65%,
    rgba(220, 20, 60, 0.04) 80%,
    transparent 100%
  );
  opacity: 0;
  animation: lbAuraIn 0.5s ease-out 0.7s forwards,
             lbAuraPulse 3s ease-in-out 1.2s infinite;
  will-change: opacity, transform;
  z-index: 1;
}

@keyframes lbAuraIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes lbAuraPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.05);
  }
}

/* 暗影光环主体 - 发光的紫赤双色祝福光环边框（持续显示） */
.lb-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: lbHaloIn 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) 0.7s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes lbHaloIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 - 半透明暗影紫祝福能量填充 */
.lb-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(153, 50, 204, 0.12) 0%,
    rgba(220, 20, 60, 0.06) 50%,
    transparent 80%
  );
  animation: lbFieldPulse 2.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes lbFieldPulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 紫赤双色光环边框 */
.lb-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(153, 50, 204, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(153, 50, 204, 0.5) 0deg,       /* 暗影紫 - 敏捷 */
    rgba(220, 20, 60, 0.35) 60deg,     /* 猩红 - 暴击 */
    rgba(139, 0, 0, 0.5) 120deg,       /* 血红 - 吸血 */
    rgba(153, 50, 204, 0.35) 180deg,   /* 暗影紫 - 敏捷 */
    rgba(220, 20, 60, 0.5) 240deg,     /* 猩红 - 暴击 */
    rgba(255, 215, 0, 0.35) 300deg,    /* 暗金 - 大圆满 */
    rgba(153, 50, 204, 0.5) 360deg
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
    0 0 12px rgba(153, 50, 204, 0.5),
    inset 0 0 12px rgba(220, 20, 60, 0.2);
  animation: lbBorderGlow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes lbBorderGlow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 12px rgba(153, 50, 204, 0.5),
      inset 0 0 12px rgba(220, 20, 60, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 16px rgba(220, 20, 60, 0.8),
      0 0 8px rgba(153, 50, 204, 0.3),
      0 0 8px rgba(139, 0, 0, 0.3),
      inset 0 0 8px rgba(255, 215, 0, 0.3);
  }
}

/* 外层暗影符文圆环 - 顺时针持续旋转 */
.lb-rune-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  opacity: 0;
  will-change: transform, opacity;
  z-index: 4;
}

.lb-rune-ring.ring-outer {
  width: 95%;
  height: 95%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: lbRingOuterIn 0.4s ease-out 0.75s forwards,
             lbRingOuterSpin 5s linear 1.15s infinite;
}

.lb-rune-ring.ring-inner {
  width: 70%;
  height: 70%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: lbRingInnerIn 0.4s ease-out 0.8s forwards,
             lbRingInnerSpin 4s linear 1.2s infinite;
}

/* 外圈暗影符文 - 暗影紫刀锋纹路，60度间隔 */
.lb-rune-ring.ring-outer .lb-rune-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dashed rgba(153, 50, 204, 0.4);
  background: conic-gradient(
    from 0deg,
    rgba(153, 50, 204, 0.2) 0deg,
    transparent 30deg,
    transparent 60deg,
    rgba(220, 20, 60, 0.2) 60deg,
    transparent 90deg,
    transparent 120deg,
    rgba(139, 0, 0, 0.2) 120deg,
    transparent 150deg,
    transparent 180deg,
    rgba(153, 50, 204, 0.2) 180deg,
    transparent 210deg,
    transparent 240deg,
    rgba(220, 20, 60, 0.2) 240deg,
    transparent 270deg,
    transparent 300deg,
    rgba(255, 215, 0, 0.2) 300deg,
    transparent 330deg,
    transparent 360deg
  );
  box-shadow: 0 0 6px rgba(153, 50, 204, 0.25);
}

/* 内圈暴击符文 - 暗影紫/猩红符文交替 */
.lb-rune-ring.ring-inner .lb-rune-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dotted rgba(220, 20, 60, 0.35);
  background: conic-gradient(
    from 0deg,
    rgba(153, 50, 204, 0.18) 0deg,
    transparent 45deg,
    transparent 90deg,
    rgba(220, 20, 60, 0.18) 90deg,
    transparent 135deg,
    transparent 180deg,
    rgba(153, 50, 204, 0.18) 180deg,
    transparent 225deg,
    transparent 270deg,
    rgba(220, 20, 60, 0.18) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 5px rgba(220, 20, 60, 0.12);
}

@keyframes lbRingOuterIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
}

@keyframes lbRingOuterSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.7; }
}

@keyframes lbRingInnerIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes lbRingInnerSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0.6; }
}

/* 暗影波纹 - 从中心向外周期性扩散 */
.lb-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  border: 2px solid rgba(153, 50, 204, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  z-index: 3;
}

.lb-wave.wave-1 {
  animation: lbWave 2.4s ease-out 1.0s infinite;
}
.lb-wave.wave-2 {
  animation: lbWave 2.4s ease-out 1.8s infinite;
  border-color: rgba(220, 20, 60, 0.5);
}
.lb-wave.wave-3 {
  animation: lbWave 2.4s ease-out 2.2s infinite;
  border-color: rgba(139, 0, 0, 0.4);
}

@keyframes lbWave {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% { opacity: 0.8; }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(3);
    opacity: 0;
  }
}

/* 中央暗影核心 - 发光的杀戮祝福之球，持续脉冲 */
.lb-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22%;
  height: 22%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: lbCoreIn 0.3s ease-out 0.85s forwards,
             lbCorePulse 1.8s ease-in-out 1.15s infinite;
  will-change: transform, opacity;
  z-index: 6;
}

.lb-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(220, 180, 255, 0.9) 20%,
    rgba(153, 50, 204, 0.7) 50%,
    rgba(220, 20, 60, 0.3) 80%,
    rgba(139, 0, 0, 0.2) 100%
  );
  box-shadow:
    0 0 12px rgba(153, 50, 204, 0.8),
    0 0 24px rgba(220, 20, 60, 0.4);
}

@keyframes lbCoreIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes lbCorePulse {
  0%, 100% { transform: translate3d(-50%, -50%, 0) scale(1); }
  50% { transform: translate3d(-50%, -50%, 0) scale(1.15); }
}

/* 敏捷粒子涡旋 - 12颗粒子沿圆形轨道持续旋转 */
.lb-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: lbOrbitIn 0.3s ease-out 0.9s forwards,
             lbOrbitSpin 5s linear 1.2s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes lbOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes lbOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 1; }
}

/* 环绕粒子 - 紫赤双色交替，对应敏捷与暴击 */
.lb-orbit-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    var(--lb-orbit-color, #9932CC) 50%,
    rgba(153, 50, 204, 0.3) 100%
  );
  box-shadow: 0 0 6px var(--lb-orbit-glow, rgba(153, 50, 204, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--lb-orbit-angle, 0deg)) translateY(-45%);
}

/* 暗影能量球轨道 - 6颗能量球沿光环边缘持续旋转 */
.lb-energy-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: lbEnergyOrbitIn 0.4s ease-out 0.9s forwards,
             lbEnergyOrbitSpin 4s linear 1.3s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes lbEnergyOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes lbEnergyOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 1; }
}

/* 环绕能量球定位 - 每颗球沿轨道边缘旋转 */
.lb-energy-ball {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  transform: translate3d(-50%, -50%, 0) rotate(var(--lb-energy-angle, 0deg)) translateY(-50%);
}

/* 能量球本体 - 多色发光球体 */
.lb-energy-ball-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    var(--lb-energy-light, rgba(255, 255, 255, 0.9)) 30%,
    var(--lb-energy-color, #9932CC) 60%,
    var(--lb-energy-glow, rgba(153, 50, 204, 0.3)) 100%
  );
  box-shadow:
    0 0 6px var(--lb-energy-glow, rgba(153, 50, 204, 0.8)),
    0 0 12px var(--lb-energy-color, rgba(153, 50, 204, 0.5));
}

/* 暴击刃芒闪光 - 周期性闪烁的猩红刃芒能量，代表暴击伤害提升 */
.lb-crit-flash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 88%;
  height: 88%;
  border-radius: 50%;
  border: 2px solid rgba(220, 20, 60, 0.6);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.lb-crit-flash.crit-1 {
  animation: lbCritFlash 4.5s ease-out 2s infinite;
}
.lb-crit-flash.crit-2 {
  animation: lbCritFlash 5.5s ease-out 3.5s infinite;
  border-color: rgba(153, 50, 204, 0.6);
}
.lb-crit-flash.crit-3 {
  animation: lbCritFlash 6s ease-out 5s infinite;
  border-color: rgba(139, 0, 0, 0.6);
}

@keyframes lbCritFlash {
  0%, 85% {
    transform: translate3d(-50%, -50%, 0) scale(0.8);
    opacity: 0;
  }
  90% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.6);
    opacity: 0;
  }
}

/* 杀戮纹章 - 持续旋转脉冲的暗杀者大师标志 */
.lb-emblem {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 35%;
  height: 35%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  opacity: 0;
  animation: lbEmblemIn 0.3s ease-out 0.9s forwards,
             lbEmblemSpin 6s linear 1.2s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

.lb-emblem-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(153, 50, 204, 0.4) 0deg,
    transparent 20deg,
    transparent 40deg,
    rgba(220, 20, 60, 0.4) 60deg,
    transparent 80deg,
    transparent 100deg,
    rgba(139, 0, 0, 0.4) 120deg,
    transparent 140deg,
    transparent 160deg,
    rgba(153, 50, 204, 0.4) 180deg,
    transparent 200deg,
    transparent 220deg,
    rgba(220, 20, 60, 0.4) 240deg,
    transparent 260deg,
    transparent 280deg,
    rgba(255, 215, 0, 0.4) 300deg,
    transparent 320deg,
    transparent 340deg,
    rgba(153, 50, 204, 0.4) 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  filter: blur(0.5px);
}

@keyframes lbEmblemIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes lbEmblemSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.6; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .lb-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
