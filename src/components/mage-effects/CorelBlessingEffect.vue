<!--
  @file CorelBlessingEffect.vue
  @generated 2026-07-08
  @description 席瑞儿.安得利尔的祝福（持久BUFF特效）- 刀锋觉醒·双剑交汇·攻守一体·大师意志
  刀锋战士R技能（blade_warrior_r）：传承刀锋战士大师 席瑞儿.安得利尔 的祝福之力，
  施法后获得格挡和暴击伤害赐福，大师意志附体，助你攻守兼备
  双维增益：格挡蓝(防御) + 暴击赤(攻击) + 大师金(意志) + 刀锋银(钢铁)
  BUFF持续期间一直显示，BUFF到期后自动移除
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 0.8s）- 钢铁暗幕降临 + 刀锋光柱降下 + 双剑交叉爆发 + 双维能量流汇聚
    持续循环 - 大师金色光环旋转 + 双层刀锋符文环 + 双剑轨道环绕 + 格挡盾波纹脉冲 + 
              暴击火花闪烁 + 中央大师核心脉冲 + 双色粒子环绕 + 交叉刀锋纹章旋转
  色彩方案：刀锋银(#C0C0C0) + 格挡蓝(#4169E1) + 暴击赤(#DC143C) + 大师金(#FFD700)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
-->
<template>
  <!-- 祝福舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="cb-stage" :style="stageStyle">
    <!-- ===== 入场动画：刀锋觉醒（0s ~ 0.8s）===== -->
    <!-- 钢铁暗幕 - 银蓝氛围笼罩（入场后渐隐） -->
    <div class="cb-dim"></div>

    <!-- 天降刀锋光柱 - 从顶部降下的银金双色祝福光柱 -->
    <div class="cb-beam"></div>

    <!-- 双剑交叉爆发 - 光柱触地后两道剑光交叉绽放 -->
    <div class="cb-cross-burst">
      <div class="cb-cross-sword cb-cross-sword-1"></div>
      <div class="cb-cross-sword cb-cross-sword-2"></div>
    </div>

    <!-- 双维能量流 - 从四方螺旋汇聚至中心（入场一次性） -->
    <div
      v-for="i in 4"
      :key="'cb-stream-' + i"
      class="cb-stream"
      :style="getStreamStyle(i)"
    ></div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 大师光晕 - 外层柔和金色发光氛围（持续显示） -->
    <div class="cb-aura"></div>

    <!-- 双色刀锋光环主体 - 发光的银金祝福光环边框 -->
    <div class="cb-halo">
      <div class="cb-halo-field"></div>
      <div class="cb-halo-border"></div>
    </div>

    <!-- 外层刀锋符文圆环 - 顺时针持续旋转 -->
    <div class="cb-blade-ring ring-outer">
      <div class="cb-blade-ring-inner"></div>
    </div>
    <!-- 内层刀锋符文圆环 - 逆时针持续旋转 -->
    <div class="cb-blade-ring ring-inner">
      <div class="cb-blade-ring-inner"></div>
    </div>

    <!-- 格挡盾波纹 - 从中心向外周期性扩散的蓝色防御波 -->
    <div class="cb-shield-wave wave-1"></div>
    <div class="cb-shield-wave wave-2"></div>
    <div class="cb-shield-wave wave-3"></div>

    <!-- 中央大师核心 - 发光的金色祝福之球，持续脉冲 -->
    <div class="cb-core">
      <div class="cb-core-inner"></div>
    </div>

    <!-- 双色粒子环绕 - 8颗粒子沿圆形轨道持续旋转 -->
    <div class="cb-orbit">
      <div
        v-for="i in 8"
        :key="'cb-orbit-particle-' + i"
        class="cb-orbit-particle"
        :style="getOrbitParticleStyle(i)"
      ></div>
    </div>

    <!-- 双剑轨道 - 2把能量剑沿光环边缘持续旋转，代表攻守兼备 -->
    <div class="cb-sword-orbit">
      <div class="cb-orbit-sword cb-sword-defense"></div>
      <div class="cb-orbit-sword cb-sword-offense"></div>
    </div>

    <!-- 暴击火花 - 周期性闪烁的红色能量火花 -->
    <div class="cb-spark spark-1"></div>
    <div class="cb-spark spark-2"></div>
    <div class="cb-spark spark-3"></div>

    <!-- 交叉刀锋纹章 - 持续旋转脉冲的刀锋战士标志 -->
    <div class="cb-emblem">
      <div class="cb-emblem-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 席瑞儿.安得利尔的祝福（持久BUFF特效）- 刀锋觉醒·双剑交汇·攻守一体·大师意志
 * 刀锋战士R技能（blade_warrior_r）特效组件
 * 传承刀锋战士大师 席瑞儿.安得利尔 的祝福之力，
 * 施法后获得格挡和暴击伤害赐福，大师意志附体，助你攻守兼备
 * 双维增益以双色能量流表现：格挡蓝(防御) + 暴击赤(攻击)
 * 以大师金为主色调，融合刀锋银的钢铁感与双剑交叉的战斗感
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

/** 双维增益颜色表 - 对应格挡（蓝）与暴击（赤）两种属性增益 */
const DUAL_COLORS = [
  { color: '#4169E1', glow: 'rgba(65, 105, 225, 0.8)' },  // 格挡蓝 - 防御
  { color: '#DC143C', glow: 'rgba(220, 20, 60, 0.8)' },   // 暴击赤 - 攻击
  { color: '#4169E1', glow: 'rgba(65, 105, 225, 0.8)' },  // 格挡蓝 - 防御
  { color: '#DC143C', glow: 'rgba(220, 20, 60, 0.8)' }    // 暴击赤 - 攻击
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
 * 生成双维凝聚能量流的样式
 * 四道能量流从四个方向（上/右/下/左）螺旋汇聚至中心
 * 蓝色代表格挡防御，红色代表暴击攻击，交替排列体现攻守兼备
 * @param {number} index - 能量流序号（1~4）
 * @returns {Object} CSS样式对象，含角度、颜色、延迟
 */
function getStreamStyle (index) {
  const angle = (index - 1) * 90
  const c = DUAL_COLORS[(index - 1) % 4]
  const delay = 0.3 + (index - 1) * 0.04
  return {
    '--cb-stream-angle': `${angle}deg`,
    '--cb-stream-color': c.color,
    '--cb-stream-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成双色环绕粒子的样式
 * 8颗粒子分为2组，蓝色代表格挡防御，红色代表暴击攻击
 * @param {number} index - 粒子序号（1~8）
 * @returns {Object} CSS样式对象，含角度、颜色、尺寸
 */
function getOrbitParticleStyle (index) {
  const angle = (index - 1) * 45
  const colorIdx = Math.floor((index - 1) / 4) % 2
  const c = colorIdx === 0
    ? { color: '#4169E1', glow: 'rgba(65, 105, 225, 0.8)' }
    : { color: '#DC143C', glow: 'rgba(220, 20, 60, 0.8)' }
  const size = 5 + (index % 2) * 2
  return {
    '--cb-orbit-angle': `${angle}deg`,
    '--cb-orbit-color': c.color,
    '--cb-orbit-glow': c.glow,
    width: `${size}px`,
    height: `${size}px`
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
   席瑞儿.安得利尔的祝福 (blade_warrior_r / corel_blessing) - 持久BUFF特效
   技能描述：传承刀锋战士大师 席瑞儿.安得利尔 的祝福之力，
             施法后获得格挡和暴击伤害赐福，大师意志附体，助你攻守兼备
   双维增益：格挡蓝(防御) + 暴击赤(攻击) + 大师金(意志) + 刀锋银(钢铁)
   GPU加速：contain隔离 + will-change + backface-visibility + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画结构：入场动画(0.8s) + 持续循环动画
   ================================================================ */

/* 祝福舞台 - 定位容器 */
.cb-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：刀锋觉醒（0s ~ 0.8s）---------- */

/* 钢铁暗幕 - 银蓝氛围笼罩（入场后渐隐） */
.cb-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at center,
    rgba(30, 35, 50, 0.4) 0%,
    rgba(25, 30, 45, 0.25) 50%,
    transparent 100%
  );
  animation: cbDim 0.8s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes cbDim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}

/* 天降刀锋光柱 - 从顶部降下的银金双色祝福光柱（入场一次性） */
.cb-beam {
  position: absolute;
  top: -20%;
  left: 50%;
  width: 50%;
  height: 140%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: top center;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(192, 192, 192, 0.12) 15%,
    rgba(255, 248, 220, 0.35) 40%,
    rgba(255, 215, 0, 0.55) 65%,
    rgba(192, 192, 192, 0.25) 85%,
    transparent 100%
  );
  filter: blur(6px);
  opacity: 0;
  animation: cbBeam 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  will-change: transform, opacity;
  z-index: 2;
}

@keyframes cbBeam {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  30% { transform: translateX(-50%) scaleY(1); opacity: 1; }
  60% { transform: translateX(-50%) scaleY(1); opacity: 0.6; }
  100% { transform: translateX(-50%) scaleY(1); opacity: 0; }
}

/* 双剑交叉爆发 - 光柱触地后两道剑光交叉绽放（入场一次性） */
.cb-cross-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  opacity: 0;
  animation: cbCrossBurst 0.6s ease-out 0.15s forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes cbCrossBurst {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
    opacity: 0;
  }
  40% {
    transform: translate3d(-50%, -50%, 0) scale(1.2) rotate(15deg);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2) rotate(30deg);
    opacity: 0;
  }
}

/* 交叉剑光 - 第一把剑（左上到右下，蓝色防御） */
.cb-cross-sword {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120%;
  height: 4px;
  border-radius: 2px;
  transform: translate3d(-50%, -50%, 0);
}

.cb-cross-sword-1 {
  transform: translate3d(-50%, -50%, 0) rotate(45deg);
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(65, 105, 225, 0.2) 15%,
    rgba(65, 105, 225, 0.8) 45%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(65, 105, 225, 0.8) 55%,
    rgba(65, 105, 225, 0.2) 85%,
    transparent 100%
  );
  box-shadow: 0 0 12px rgba(65, 105, 225, 0.6);
  filter: blur(1px);
}

/* 交叉剑光 - 第二把剑（右上到左下，红色攻击） */
.cb-cross-sword-2 {
  transform: translate3d(-50%, -50%, 0) rotate(-45deg);
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(220, 20, 60, 0.2) 15%,
    rgba(220, 20, 60, 0.8) 45%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(220, 20, 60, 0.8) 55%,
    rgba(220, 20, 60, 0.2) 85%,
    transparent 100%
  );
  box-shadow: 0 0 12px rgba(220, 20, 60, 0.6);
  filter: blur(1px);
}

/* 双维能量流 - 从四方螺旋汇聚至中心（入场一次性） */
.cb-stream {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    var(--cb-stream-color, #FFD700) 50%,
    rgba(255, 215, 0, 0.3) 100%
  );
  box-shadow:
    0 0 8px var(--cb-stream-color, #FFD700),
    0 0 16px var(--cb-stream-glow, rgba(255, 215, 0, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--cb-stream-angle, 0deg)) translateX(120px) scale(0);
  opacity: 0;
  animation: cbStreamGather 0.5s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes cbStreamGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--cb-stream-angle, 0deg)) translateX(120px) scale(0.5);
    opacity: 0;
  }
  30% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--cb-stream-angle, 0deg) + 180deg)) translateX(0) scale(1.8);
    opacity: 0;
  }
}

/* ---------- 持续循环动画 ---------- */

/* 大师光晕 - 外层柔和金色发光氛围（持续显示） */
.cb-aura {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 50%,
    rgba(255, 215, 0, 0.08) 65%,
    rgba(255, 248, 220, 0.05) 80%,
    transparent 100%
  );
  opacity: 0;
  animation: cbAuraIn 0.5s ease-out 0.5s forwards,
             cbAuraPulse 3s ease-in-out 1s infinite;
  will-change: opacity, transform;
  z-index: 1;
}

@keyframes cbAuraIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes cbAuraPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.05);
  }
}

/* 双色刀锋光环主体 - 发光的银金祝福光环边框（持续显示） */
.cb-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: cbHaloIn 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) 0.5s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes cbHaloIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 - 半透明金色祝福能量填充 */
.cb-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 248, 220, 0.15) 0%,
    rgba(255, 215, 0, 0.08) 50%,
    transparent 80%
  );
  animation: cbFieldPulse 2.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes cbFieldPulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 双色刀锋光环边框 */
.cb-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(65, 105, 225, 0.5) 0deg,     /* 格挡蓝 */
    rgba(255, 215, 0, 0.35) 60deg,    /* 大师金 */
    rgba(220, 20, 60, 0.5) 120deg,    /* 暴击赤 */
    rgba(192, 192, 192, 0.35) 180deg, /* 刀锋银 */
    rgba(65, 105, 225, 0.5) 240deg,   /* 格挡蓝 */
    rgba(255, 215, 0, 0.35) 300deg,   /* 大师金 */
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
    0 0 12px rgba(255, 215, 0, 0.5),
    inset 0 0 12px rgba(255, 248, 220, 0.3);
  animation: cbBorderGlow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes cbBorderGlow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 12px rgba(255, 215, 0, 0.5),
      inset 0 0 12px rgba(255, 248, 220, 0.3);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 16px rgba(255, 215, 0, 0.8),
      0 0 8px rgba(65, 105, 225, 0.4),
      0 0 8px rgba(220, 20, 60, 0.4),
      inset 0 0 8px rgba(255, 248, 220, 0.4);
  }
}

/* 外层刀锋符文圆环 - 顺时针持续旋转 */
.cb-blade-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  opacity: 0;
  will-change: transform, opacity;
  z-index: 4;
}

.cb-blade-ring.ring-outer {
  width: 95%;
  height: 95%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: cbRingOuterIn 0.4s ease-out 0.55s forwards,
             cbRingOuterSpin 5s linear 0.95s infinite;
}

.cb-blade-ring.ring-inner {
  width: 70%;
  height: 70%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: cbRingInnerIn 0.4s ease-out 0.6s forwards,
             cbRingInnerSpin 4s linear 1s infinite;
}

/* 外圈刀锋符文 - 8道金色刀锋纹路 */
.cb-blade-ring.ring-outer .cb-blade-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dashed rgba(255, 215, 0, 0.5);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.2) 15deg,
    transparent 30deg,
    transparent 45deg,
    rgba(255, 215, 0, 0.2) 60deg,
    transparent 75deg,
    transparent 90deg,
    rgba(255, 215, 0, 0.2) 105deg,
    transparent 120deg,
    transparent 135deg,
    rgba(255, 215, 0, 0.2) 150deg,
    transparent 165deg,
    transparent 180deg,
    rgba(255, 215, 0, 0.2) 195deg,
    transparent 210deg,
    transparent 225deg,
    rgba(255, 215, 0, 0.2) 240deg,
    transparent 255deg,
    transparent 270deg,
    rgba(255, 215, 0, 0.2) 285deg,
    transparent 300deg,
    transparent 315deg,
    rgba(255, 215, 0, 0.2) 330deg,
    transparent 345deg,
    transparent 360deg
  );
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.3);
}

/* 内圈刀锋符文 - 双色符文（蓝/红交替） */
.cb-blade-ring.ring-inner .cb-blade-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dotted rgba(255, 248, 220, 0.4);
  background: conic-gradient(
    from 0deg,
    rgba(65, 105, 225, 0.2) 0deg,
    transparent 30deg,
    transparent 60deg,
    rgba(220, 20, 60, 0.2) 90deg,
    transparent 120deg,
    transparent 150deg,
    rgba(65, 105, 225, 0.2) 180deg,
    transparent 210deg,
    transparent 240deg,
    rgba(220, 20, 60, 0.2) 270deg,
    transparent 300deg,
    transparent 330deg,
    rgba(65, 105, 225, 0.2) 360deg
  );
  box-shadow: inset 0 0 5px rgba(255, 248, 220, 0.15);
}

@keyframes cbRingOuterIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
}

@keyframes cbRingOuterSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.7; }
}

@keyframes cbRingInnerIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes cbRingInnerSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0.6; }
}

/* 格挡盾波纹 - 从中心向外周期性扩散的蓝色防御波 */
.cb-shield-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  border: 2px solid rgba(65, 105, 225, 0.6);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  z-index: 3;
}

.cb-shield-wave.wave-1 {
  animation: cbShieldWave 2.4s ease-out 0.8s infinite;
}
.cb-shield-wave.wave-2 {
  animation: cbShieldWave 2.4s ease-out 1.6s infinite;
  border-color: rgba(220, 20, 60, 0.5);
}
.cb-shield-wave.wave-3 {
  animation: cbShieldWave 2.4s ease-out 2.0s infinite;
  border-color: rgba(255, 215, 0, 0.4);
}

@keyframes cbShieldWave {
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

/* 中央大师核心 - 发光的金色祝福之球，持续脉冲 */
.cb-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22%;
  height: 22%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: cbCoreIn 0.3s ease-out 0.65s forwards,
             cbCorePulse 1.8s ease-in-out 0.95s infinite;
  will-change: transform, opacity;
  z-index: 6;
}

.cb-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 248, 220, 0.9) 25%,
    rgba(255, 215, 0, 0.7) 60%,
    rgba(180, 140, 0, 0.3) 100%
  );
  box-shadow:
    0 0 12px rgba(255, 215, 0, 0.8),
    0 0 24px rgba(255, 215, 0, 0.4);
}

@keyframes cbCoreIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes cbCorePulse {
  0%, 100% { transform: translate3d(-50%, -50%, 0) scale(1); }
  50% { transform: translate3d(-50%, -50%, 0) scale(1.15); }
}

/* 双色粒子环绕 - 8颗粒子沿圆形轨道持续旋转 */
.cb-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: cbOrbitIn 0.3s ease-out 0.7s forwards,
             cbOrbitSpin 5s linear 1s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes cbOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes cbOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 1; }
}

/* 环绕粒子 - 蓝色代表格挡防御，红色代表暴击攻击 */
.cb-orbit-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    var(--cb-orbit-color, #FFD700) 50%,
    rgba(255, 215, 0, 0.3) 100%
  );
  box-shadow: 0 0 6px var(--cb-orbit-glow, rgba(255, 215, 0, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--cb-orbit-angle, 0deg)) translateY(-45%);
}

/* 双剑轨道 - 2把能量剑沿光环边缘持续旋转，代表攻守兼备 */
.cb-sword-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: cbSwordOrbitIn 0.4s ease-out 0.7s forwards,
             cbSwordOrbitSpin 4s linear 1.1s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes cbSwordOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes cbSwordOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 1; }
}

/* 环绕能量剑 - 通用样式 */
.cb-orbit-sword {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 22px;
  border-radius: 1px;
  transform: translate3d(-50%, -50%, 0) translateY(-50%);
}

/* 防御剑 - 蓝色，位于顶部（0deg），代表格挡 */
.cb-sword-defense {
  background: linear-gradient(
    to bottom,
    rgba(65, 105, 225, 0.5) 0%,
    rgba(65, 105, 225, 0.9) 40%,
    rgba(65, 105, 225, 0.9) 70%,
    rgba(135, 206, 250, 0.95) 100%
  );
  box-shadow: 0 0 6px rgba(65, 105, 225, 0.7);
  transform: translate3d(-50%, -50%, 0) rotate(0deg) translateY(-50%);
}

/* 防御剑箭头 - 朝外方向的蓝色剑尖 */
.cb-sword-defense::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 9px solid rgba(135, 206, 250, 0.95);
  filter: drop-shadow(0 0 3px rgba(65, 105, 225, 0.7));
}

/* 攻击剑 - 红色，位于底部（180deg），代表暴击伤害 */
.cb-sword-offense {
  background: linear-gradient(
    to bottom,
    rgba(220, 20, 60, 0.5) 0%,
    rgba(220, 20, 60, 0.9) 40%,
    rgba(220, 20, 60, 0.9) 70%,
    rgba(255, 182, 193, 0.95) 100%
  );
  box-shadow: 0 0 6px rgba(220, 20, 60, 0.7);
  transform: translate3d(-50%, -50%, 0) rotate(180deg) translateY(-50%);
}

/* 攻击剑箭头 - 朝外方向的红色剑尖 */
.cb-sword-offense::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 9px solid rgba(255, 182, 193, 0.95);
  filter: drop-shadow(0 0 3px rgba(220, 20, 60, 0.7));
}

/* 暴击火花 - 周期性闪烁的红色能量火花 */
.cb-spark {
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

.cb-spark.spark-1 {
  animation: cbSparkFlash 4.5s ease-out 2s infinite;
}
.cb-spark.spark-2 {
  animation: cbSparkFlash 5.5s ease-out 3.5s infinite;
  border-color: rgba(65, 105, 225, 0.6);
}
.cb-spark.spark-3 {
  animation: cbSparkFlash 6s ease-out 5s infinite;
  border-color: rgba(255, 215, 0, 0.6);
}

@keyframes cbSparkFlash {
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

/* 交叉刀锋纹章 - 持续旋转脉冲的刀锋战士标志 */
.cb-emblem {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 35%;
  height: 35%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  opacity: 0;
  animation: cbEmblemIn 0.3s ease-out 0.7s forwards,
             cbEmblemSpin 6s linear 1s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

.cb-emblem-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.5) 20deg,
    transparent 40deg,
    transparent 50deg,
    rgba(255, 215, 0, 0.5) 70deg,
    transparent 90deg,
    transparent 100deg,
    rgba(255, 215, 0, 0.5) 120deg,
    transparent 140deg,
    transparent 150deg,
    rgba(255, 215, 0, 0.5) 170deg,
    transparent 190deg,
    transparent 200deg,
    rgba(255, 215, 0, 0.5) 220deg,
    transparent 240deg,
    transparent 250deg,
    rgba(255, 215, 0, 0.5) 270deg,
    transparent 290deg,
    transparent 300deg,
    rgba(255, 215, 0, 0.5) 320deg,
    transparent 340deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  filter: blur(0.5px);
}

@keyframes cbEmblemIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes cbEmblemSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.6; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .cb-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
