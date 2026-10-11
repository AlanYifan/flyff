<!--
  @file KalanduoBlessingEffect.vue
  @generated 2026-07-09
  @description 卡兰铎的祝福（持久BUFF特效）- 钢铁壁垒·体魄觉醒·双倍惩戒·大师意志
  骑士U技能（knight_u）：传承于骑士大师-卡兰铎的意志,
  施法后使防御力,体魄大幅提升,且提升双倍惩戒概率,你就是最坚实的后盾~
  防御力以盾蓝(#4169E1)表现,体魄以古铜金(#B8860B)表现,
  双倍惩戒以猩红(#DC143C)表现,大师意志以纯金(#FFD700)表现
  BUFF持续期间一直显示，BUFF到期后由父组件通过 v-if 移除
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 1.2s）- 圣盾降临 + 四色光柱汇聚 + 能量爆发 + 壁垒成形
    持续循环 - 钢铁符文双环旋转 + 猩红惩戒十字闪烁 + 盾蓝壁垒脉冲 +
              中央圣核脉动 + 粒子涡旋 + 圣盾波纹 + 偶发壁垒闪光
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
-->
<template>
  <!-- 祝福舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="kb-stage" :style="stageStyle">
    <!-- ===== 入场动画：圣盾降临（0s ~ 1.2s）===== -->
    <!-- 圣盾暗幕 - 金蓝氛围笼罩（入场后渐隐） -->
    <div class="kb-dim"></div>

    <!-- 四色汇聚光柱 - 盾蓝（防御）与古铜金（体魄）与猩红（惩戒）与纯金（大师）光柱从天而降 -->
    <div
      v-for="i in 8"
      :key="'kb-beam-' + i"
      class="kb-beam"
      :style="getBeamStyle(i)"
    ></div>

    <!-- 圣盾能量爆发 - 汇聚后的径向爆发 -->
    <div class="kb-burst">
      <div class="kb-burst-inner"></div>
    </div>

    <!-- 四色凝聚流 - 从八方螺旋汇聚至中心（入场一次性） -->
    <div
      v-for="i in 8"
      :key="'kb-stream-' + i"
      class="kb-stream"
      :style="getStreamStyle(i)"
    ></div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 大师光晕 - 外层柔和金色发光氛围（持续显示） -->
    <div class="kb-aura"></div>

    <!-- 钢铁光环主体 - 发光的盾蓝金色祝福光环边框 -->
    <div class="kb-halo">
      <div class="kb-halo-field"></div>
      <div class="kb-halo-border"></div>
    </div>

    <!-- 外层钢铁符文圆环 - 顺时针持续旋转 -->
    <div class="kb-rune-ring ring-outer">
      <div class="kb-rune-ring-inner"></div>
    </div>
    <!-- 内层惩戒符文圆环 - 逆时针持续旋转 -->
    <div class="kb-rune-ring ring-inner">
      <div class="kb-rune-ring-inner"></div>
    </div>

    <!-- 圣盾波纹 - 从中心向外周期性扩散 -->
    <div class="kb-wave wave-1"></div>
    <div class="kb-wave wave-2"></div>
    <div class="kb-wave wave-3"></div>

    <!-- 中央圣核 - 发光的钢铁祝福之球，持续脉冲 -->
    <div class="kb-core">
      <div class="kb-core-inner"></div>
    </div>

    <!-- 体魄粒子涡旋 - 12颗粒子沿圆形轨道持续旋转 -->
    <div class="kb-orbit">
      <div
        v-for="i in 12"
        :key="'kb-orbit-particle-' + i"
        class="kb-orbit-particle"
        :style="getOrbitParticleStyle(i)"
      ></div>
    </div>

    <!-- 钢铁能量球轨道 - 8颗能量球沿光环边缘持续旋转 -->
    <div class="kb-energy-orbit">
      <div
        v-for="i in 8"
        :key="'kb-energy-' + i"
        class="kb-energy-ball"
        :style="getEnergyOrbitStyle(i)"
      >
        <div class="kb-energy-ball-inner"></div>
      </div>
    </div>

    <!-- 惩戒十字闪光 - 周期性闪烁的猩红十字能量，代表双倍惩戒 -->
    <div class="kb-judgment-flash judgment-1"></div>
    <div class="kb-judgment-flash judgment-2"></div>
    <div class="kb-judgment-flash judgment-3"></div>

    <!-- 钢铁纹章 - 持续旋转脉冲的骑士大师标志 -->
    <div class="kb-emblem">
      <div class="kb-emblem-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 卡兰铎的祝福（持久BUFF特效）- 钢铁壁垒·体魄觉醒·双倍惩戒·大师意志
 * 骑士U技能（knight_u）特效组件
 * 传承于骑士大师-卡兰铎的意志，
 * 施法后使防御力、体魄大幅提升，且提升双倍惩戒概率
 * 防御力以盾蓝表现，体魄以古铜金表现，
 * 双倍惩戒以猩红十字表现，大师意志以纯金为主色调
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
 * 四色能量表 - 盾蓝（防御）与古铜金（体魄）与猩红（惩戒）与纯金（大师）交替
 * 每种颜色有主色、辉光色和浅色三个变体
 */
const BLESSING_COLORS = [
  { color: '#4169E1', glow: 'rgba(65, 105, 225, 0.8)', light: 'rgba(100, 149, 237, 0.95)' },   // 盾蓝 - 防御
  { color: '#B8860B', glow: 'rgba(184, 134, 11, 0.8)', light: 'rgba(255, 200, 80, 0.95)' },     // 古铜金 - 体魄
  { color: '#DC143C', glow: 'rgba(220, 20, 60, 0.8)', light: 'rgba(255, 100, 120, 0.95)' },     // 猩红 - 惩戒
  { color: '#FFD700', glow: 'rgba(255, 215, 0, 0.8)', light: 'rgba(255, 240, 150, 0.95)' },     // 纯金 - 大师
  { color: '#4169E1', glow: 'rgba(65, 105, 225, 0.8)', light: 'rgba(100, 149, 237, 0.95)' },   // 盾蓝 - 防御
  { color: '#B8860B', glow: 'rgba(184, 134, 11, 0.8)', light: 'rgba(255, 200, 80, 0.95)' },     // 古铜金 - 体魄
  { color: '#DC143C', glow: 'rgba(220, 20, 60, 0.8)', light: 'rgba(255, 100, 120, 0.95)' },     // 猩红 - 惩戒
  { color: '#FFD700', glow: 'rgba(255, 215, 0, 0.8)', light: 'rgba(255, 240, 150, 0.95)' }      // 纯金 - 大师
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
 * 生成四色汇聚光柱的样式
 * 八道光柱从八个方向（45度间隔）降下，盾蓝与古铜金与猩红与纯金交替
 * @param {number} index - 光柱序号（1~8）
 * @returns {Object} CSS样式对象，含角度、颜色、延迟
 */
function getBeamStyle (index) {
  const angle = (index - 1) * 45
  const c = BLESSING_COLORS[(index - 1) % 8]
  const delay = (index - 1) * 0.04
  return {
    '--kb-beam-angle': `${angle}deg`,
    '--kb-beam-color': c.color,
    '--kb-beam-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成四色凝聚能量流的样式
 * 八道能量流从八个方向螺旋汇聚至中心
 * @param {number} index - 能量流序号（1~8）
 * @returns {Object} CSS样式对象，含角度、颜色、延迟
 */
function getStreamStyle (index) {
  const angle = (index - 1) * 45
  const c = BLESSING_COLORS[(index - 1) % 8]
  const delay = 0.3 + (index - 1) * 0.04
  return {
    '--kb-stream-angle': `${angle}deg`,
    '--kb-stream-color': c.color,
    '--kb-stream-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成环绕粒子的样式
 * 12颗粒子分为8组，每组对应一种祝福颜色
 * @param {number} index - 粒子序号（1~12）
 * @returns {Object} CSS样式对象，含角度、颜色、尺寸
 */
function getOrbitParticleStyle (index) {
  const angle = (index - 1) * 30
  const c = BLESSING_COLORS[(index - 1) % 8]
  const size = 5 + (index % 2) * 2
  return {
    '--kb-orbit-angle': `${angle}deg`,
    '--kb-orbit-color': c.color,
    '--kb-orbit-glow': c.glow,
    width: `${size}px`,
    height: `${size}px`
  }
}

/**
 * 生成钢铁能量球轨道的样式
 * 8颗能量球沿光环边缘旋转，每颗对应一种祝福属性
 * @param {number} index - 能量球序号（1~8）
 * @returns {Object} CSS样式对象，含角度、颜色
 */
function getEnergyOrbitStyle (index) {
  const angle = (index - 1) * 45
  const c = BLESSING_COLORS[(index - 1) % 8]
  return {
    '--kb-energy-angle': `${angle}deg`,
    '--kb-energy-color': c.color,
    '--kb-energy-glow': c.glow,
    '--kb-energy-light': c.light
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
   卡兰铎的祝福 (knight_u / kalanduo_blessing) - 持久BUFF特效
   技能描述：传承于骑士大师-卡兰铎 的意志,使防御力,体魄大幅提升,
             且 提升双倍惩戒概率,你就是最坚实的后盾~
   防御力增益：盾蓝(#4169E1) + 体魄增益：古铜金(#B8860B)
   双倍惩戒：猩红(#DC143C) + 大师意志：纯金(#FFD700)
   GPU加速：contain隔离 + will-change + backface-visibility + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画结构：入场动画(1.2s) + 持续循环动画
   ================================================================ */

/* 祝福舞台 - 定位容器 */
.kb-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：圣盾降临（0s ~ 1.2s）---------- */

/* 圣盾暗幕 - 金蓝氛围笼罩（入场后渐隐） */
.kb-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at center,
    rgba(20, 25, 45, 0.4) 0%,
    rgba(25, 20, 30, 0.25) 50%,
    transparent 100%
  );
  animation: kbDim 1.2s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes kbDim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}

/* 四色汇聚光柱 - 从八个方向降下的盾蓝金色祝福光束（入场一次性） */
.kb-beam {
  position: absolute;
  top: -20%;
  left: 50%;
  width: 30%;
  height: 140%;
  transform: translateX(-50%) scaleY(0) rotate(var(--kb-beam-angle, 0deg));
  transform-origin: center top;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 15%,
    var(--kb-beam-glow, rgba(65, 105, 225, 0.3)) 40%,
    var(--kb-beam-color, #4169E1) 60%,
    var(--kb-beam-glow, rgba(65, 105, 225, 0.3)) 80%,
    transparent 100%
  );
  filter: blur(5px);
  opacity: 0;
  animation: kbBeam 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  will-change: transform, opacity;
  z-index: 2;
}

@keyframes kbBeam {
  0% {
    transform: translateX(-50%) scaleY(0) rotate(var(--kb-beam-angle, 0deg));
    opacity: 0;
  }
  30% {
    transform: translateX(-50%) scaleY(1) rotate(var(--kb-beam-angle, 0deg));
    opacity: 0.8;
  }
  60% {
    transform: translateX(-50%) scaleY(1) rotate(var(--kb-beam-angle, 0deg));
    opacity: 0.5;
  }
  100% {
    transform: translateX(-50%) scaleY(1) rotate(var(--kb-beam-angle, 0deg));
    opacity: 0;
  }
}

/* 圣盾能量爆发 - 汇聚后的径向爆发（入场一次性） */
.kb-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: kbBurst 0.7s ease-out 0.35s forwards;
  will-change: transform, opacity;
  z-index: 3;
}

.kb-burst-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 215, 0, 0.5) 20%,
    rgba(65, 105, 225, 0.35) 35%,
    rgba(184, 134, 11, 0.25) 50%,
    rgba(220, 20, 60, 0.2) 65%,
    rgba(65, 105, 225, 0.15) 80%,
    transparent 95%
  );
  filter: blur(4px);
}

@keyframes kbBurst {
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

/* 四色凝聚流 - 从八方螺旋汇聚至中心（入场一次性） */
.kb-stream {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    var(--kb-stream-color, #4169E1) 50%,
    var(--kb-stream-glow, rgba(65, 105, 225, 0.3)) 100%
  );
  box-shadow:
    0 0 8px var(--kb-stream-color, #4169E1),
    0 0 16px var(--kb-stream-glow, rgba(65, 105, 225, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--kb-stream-angle, 0deg)) translateX(120px) scale(0);
  opacity: 0;
  animation: kbStreamGather 0.6s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes kbStreamGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--kb-stream-angle, 0deg)) translateX(120px) scale(0.5);
    opacity: 0;
  }
  30% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--kb-stream-angle, 0deg) + 180deg)) translateX(0) scale(1.8);
    opacity: 0;
  }
}

/* ---------- 持续循环动画 ---------- */

/* 大师光晕 - 外层柔和金色发光氛围（持续显示） */
.kb-aura {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 50%,
    rgba(255, 215, 0, 0.06) 65%,
    rgba(65, 105, 225, 0.04) 80%,
    transparent 100%
  );
  opacity: 0;
  animation: kbAuraIn 0.5s ease-out 0.7s forwards,
             kbAuraPulse 3s ease-in-out 1.2s infinite;
  will-change: opacity, transform;
  z-index: 1;
}

@keyframes kbAuraIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes kbAuraPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.05);
  }
}

/* 钢铁光环主体 - 发光的盾蓝金色祝福光环边框（持续显示） */
.kb-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: kbHaloIn 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) 0.7s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes kbHaloIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 - 半透明盾蓝祝福能量填充 */
.kb-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.12) 0%,
    rgba(65, 105, 225, 0.06) 50%,
    transparent 80%
  );
  animation: kbFieldPulse 2.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes kbFieldPulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 盾蓝金色光环边框 */
.kb-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(65, 105, 225, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(65, 105, 225, 0.5) 0deg,       /* 盾蓝 - 防御 */
    rgba(255, 215, 0, 0.35) 45deg,     /* 纯金 - 大师 */
    rgba(184, 134, 11, 0.5) 90deg,     /* 古铜金 - 体魄 */
    rgba(255, 215, 0, 0.35) 135deg,    /* 纯金 - 大师 */
    rgba(220, 20, 60, 0.5) 180deg,     /* 猩红 - 惩戒 */
    rgba(255, 215, 0, 0.35) 225deg,    /* 纯金 - 大师 */
    rgba(65, 105, 225, 0.5) 270deg,    /* 盾蓝 - 防御 */
    rgba(255, 215, 0, 0.35) 315deg,    /* 纯金 - 大师 */
    rgba(65, 105, 225, 0.5) 360deg
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
    0 0 12px rgba(65, 105, 225, 0.5),
    inset 0 0 12px rgba(255, 215, 0, 0.2);
  animation: kbBorderGlow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes kbBorderGlow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 12px rgba(65, 105, 225, 0.5),
      inset 0 0 12px rgba(255, 215, 0, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 16px rgba(255, 215, 0, 0.8),
      0 0 8px rgba(65, 105, 225, 0.3),
      0 0 8px rgba(220, 20, 60, 0.3),
      inset 0 0 8px rgba(184, 134, 11, 0.3);
  }
}

/* 外层钢铁符文圆环 - 顺时针持续旋转 */
.kb-rune-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  opacity: 0;
  will-change: transform, opacity;
  z-index: 4;
}

.kb-rune-ring.ring-outer {
  width: 95%;
  height: 95%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: kbRingOuterIn 0.4s ease-out 0.75s forwards,
             kbRingOuterSpin 5s linear 1.15s infinite;
}

.kb-rune-ring.ring-inner {
  width: 70%;
  height: 70%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: kbRingInnerIn 0.4s ease-out 0.8s forwards,
             kbRingInnerSpin 4s linear 1.2s infinite;
}

/* 外圈钢铁符文 - 盾蓝刀锋纹路，45度间隔 */
.kb-rune-ring.ring-outer .kb-rune-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dashed rgba(65, 105, 225, 0.4);
  background: conic-gradient(
    from 0deg,
    rgba(65, 105, 225, 0.2) 0deg,
    transparent 22deg,
    transparent 45deg,
    rgba(184, 134, 11, 0.2) 45deg,
    transparent 67deg,
    transparent 90deg,
    rgba(220, 20, 60, 0.2) 90deg,
    transparent 112deg,
    transparent 135deg,
    rgba(65, 105, 225, 0.2) 135deg,
    transparent 157deg,
    transparent 180deg,
    rgba(184, 134, 11, 0.2) 180deg,
    transparent 202deg,
    transparent 225deg,
    rgba(220, 20, 60, 0.2) 225deg,
    transparent 247deg,
    transparent 270deg,
    rgba(65, 105, 225, 0.2) 270deg,
    transparent 292deg,
    transparent 315deg,
    rgba(184, 134, 11, 0.2) 315deg,
    transparent 337deg,
    transparent 360deg
  );
  box-shadow: 0 0 6px rgba(65, 105, 225, 0.25);
}

/* 内圈惩戒符文 - 金色/猩红符文交替 */
.kb-rune-ring.ring-inner .kb-rune-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dotted rgba(220, 20, 60, 0.35);
  background: conic-gradient(
    from 0deg,
    rgba(255, 215, 0, 0.18) 0deg,
    transparent 45deg,
    transparent 90deg,
    rgba(220, 20, 60, 0.18) 90deg,
    transparent 135deg,
    transparent 180deg,
    rgba(255, 215, 0, 0.18) 180deg,
    transparent 225deg,
    transparent 270deg,
    rgba(220, 20, 60, 0.18) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 5px rgba(220, 20, 60, 0.12);
}

@keyframes kbRingOuterIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
}

@keyframes kbRingOuterSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.7; }
}

@keyframes kbRingInnerIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes kbRingInnerSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0.6; }
}

/* 圣盾波纹 - 从中心向外周期性扩散 */
.kb-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  border: 2px solid rgba(65, 105, 225, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  z-index: 3;
}

.kb-wave.wave-1 {
  animation: kbWave 2.4s ease-out 1.0s infinite;
}
.kb-wave.wave-2 {
  animation: kbWave 2.4s ease-out 1.8s infinite;
  border-color: rgba(184, 134, 11, 0.5);
}
.kb-wave.wave-3 {
  animation: kbWave 2.4s ease-out 2.2s infinite;
  border-color: rgba(220, 20, 60, 0.4);
}

@keyframes kbWave {
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

/* 中央圣核 - 发光的钢铁祝福之球，持续脉冲 */
.kb-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22%;
  height: 22%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: kbCoreIn 0.3s ease-out 0.85s forwards,
             kbCorePulse 1.8s ease-in-out 1.15s infinite;
  will-change: transform, opacity;
  z-index: 6;
}

.kb-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 240, 150, 0.9) 20%,
    rgba(255, 215, 0, 0.7) 50%,
    rgba(65, 105, 225, 0.3) 80%,
    rgba(184, 134, 11, 0.2) 100%
  );
  box-shadow:
    0 0 12px rgba(255, 215, 0, 0.8),
    0 0 24px rgba(65, 105, 225, 0.4);
}

@keyframes kbCoreIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes kbCorePulse {
  0%, 100% { transform: translate3d(-50%, -50%, 0) scale(1); }
  50% { transform: translate3d(-50%, -50%, 0) scale(1.15); }
}

/* 体魄粒子涡旋 - 12颗粒子沿圆形轨道持续旋转 */
.kb-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: kbOrbitIn 0.3s ease-out 0.9s forwards,
             kbOrbitSpin 5s linear 1.2s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes kbOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes kbOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 1; }
}

/* 环绕粒子 - 四色交替，对应防御、体魄、惩戒、大师 */
.kb-orbit-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    var(--kb-orbit-color, #4169E1) 50%,
    rgba(65, 105, 225, 0.3) 100%
  );
  box-shadow: 0 0 6px var(--kb-orbit-glow, rgba(65, 105, 225, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--kb-orbit-angle, 0deg)) translateY(-45%);
}

/* 钢铁能量球轨道 - 8颗能量球沿光环边缘持续旋转 */
.kb-energy-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: kbEnergyOrbitIn 0.4s ease-out 0.9s forwards,
             kbEnergyOrbitSpin 4s linear 1.3s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes kbEnergyOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes kbEnergyOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 1; }
}

/* 环绕能量球定位 - 每颗球沿轨道边缘旋转 */
.kb-energy-ball {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  transform: translate3d(-50%, -50%, 0) rotate(var(--kb-energy-angle, 0deg)) translateY(-50%);
}

/* 能量球本体 - 多色发光球体 */
.kb-energy-ball-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    var(--kb-energy-light, rgba(255, 255, 255, 0.9)) 30%,
    var(--kb-energy-color, #4169E1) 60%,
    var(--kb-energy-glow, rgba(65, 105, 225, 0.3)) 100%
  );
  box-shadow:
    0 0 6px var(--kb-energy-glow, rgba(65, 105, 225, 0.8)),
    0 0 12px var(--kb-energy-color, rgba(65, 105, 225, 0.5));
}

/* 惩戒十字闪光 - 周期性闪烁的猩红十字能量，代表双倍惩戒概率提升 */
.kb-judgment-flash {
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

.kb-judgment-flash.judgment-1 {
  animation: kbJudgmentFlash 4.5s ease-out 2s infinite;
}
.kb-judgment-flash.judgment-2 {
  animation: kbJudgmentFlash 5.5s ease-out 3.5s infinite;
  border-color: rgba(255, 215, 0, 0.6);
}
.kb-judgment-flash.judgment-3 {
  animation: kbJudgmentFlash 6s ease-out 5s infinite;
  border-color: rgba(65, 105, 225, 0.6);
}

@keyframes kbJudgmentFlash {
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

/* 钢铁纹章 - 持续旋转脉冲的骑士大师标志 */
.kb-emblem {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 35%;
  height: 35%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  opacity: 0;
  animation: kbEmblemIn 0.3s ease-out 0.9s forwards,
             kbEmblemSpin 6s linear 1.2s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

.kb-emblem-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(65, 105, 225, 0.4) 0deg,
    transparent 20deg,
    transparent 40deg,
    rgba(184, 134, 11, 0.4) 45deg,
    transparent 65deg,
    transparent 85deg,
    rgba(220, 20, 60, 0.4) 90deg,
    transparent 110deg,
    transparent 130deg,
    rgba(65, 105, 225, 0.4) 135deg,
    transparent 155deg,
    transparent 175deg,
    rgba(184, 134, 11, 0.4) 180deg,
    transparent 200deg,
    transparent 220deg,
    rgba(220, 20, 60, 0.4) 225deg,
    transparent 245deg,
    transparent 265deg,
    rgba(65, 105, 225, 0.4) 270deg,
    transparent 290deg,
    transparent 310deg,
    rgba(184, 134, 11, 0.4) 315deg,
    transparent 335deg,
    transparent 340deg,
    rgba(65, 105, 225, 0.4) 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  filter: blur(0.5px);
}

@keyframes kbEmblemIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes kbEmblemSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.6; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .kb-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
