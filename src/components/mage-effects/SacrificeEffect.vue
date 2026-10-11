<!--
  @file SacrificeEffect.vue
  @generated 2026-07-09
  @description 牺牲（持久BUFF特效）- 献祭觉醒·血链裂缚·碎盾化刃·攻力飙升
  骑士T技能（knight_t）：一段时间内承受伤害增加，大幅提高攻击力与格挡穿透
  三效增益：攻击力金(attackMin/Max) + 破甲银(blockPenetration) + 承伤暗紫(damageTakenIncrease)
  代价：自身承伤增加（以碎裂裂纹与暗紫能量链表现防护被牺牲）
  BUFF持续期间一直显示，BUFF到期后自动移除
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 0.8s）- 暗裂降临 + 血链光柱 + 碎盾爆发 + 三色能量裂流上升
    持续循环 - 碎盾碎片旋转环 + 双层裂痕符文环 + 血色光环 + 攻击力核心脉冲 +
              破甲穿透粒子轨道 + 承伤裂纹波纹脉冲 + 力量涌动纹章旋转
  色彩方案：牺牲血红(#8B0000) + 攻击力金(#FFD700) + 破甲银(#C0C0C0) + 承伤暗紫(#4B0082)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
-->
<template>
  <!-- 牺牲舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="sc-stage" :style="stageStyle">
    <!-- ===== 入场动画：献祭觉醒（0s ~ 0.8s）===== -->
    <!-- 牺牲暗幕 - 血色氛围笼罩（入场后渐隐） -->
    <div class="sc-dim"></div>

    <!-- 血链光柱 - 从顶部降下的血红牺牲光柱 -->
    <div class="sc-beam"></div>

    <!-- 碎盾爆发 - 光柱触地后碎盾状径向爆发，代表防御被牺牲 -->
    <div class="sc-shatter-burst">
      <div
        v-for="i in 6"
        :key="'sc-fragment-' + i"
        class="sc-fragment"
        :style="getFragmentStyle(i)"
      ></div>
    </div>

    <!-- 三色能量裂流 - 从底部向上涌起（入场一次性） -->
    <div
      v-for="i in 3"
      :key="'sc-rise-' + i"
      class="sc-rise"
      :style="getRiseStyle(i)"
    ></div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 牺牲血光晕 - 外层柔和血红发光氛围（持续显示） -->
    <div class="sc-aura"></div>

    <!-- 牺牲光环主体 - 发光的双色光环边框 -->
    <div class="sc-halo">
      <div class="sc-halo-field"></div>
      <div class="sc-halo-border"></div>
    </div>

    <!-- 外层碎盾碎片环 - 顺时针持续旋转 -->
    <div class="sc-fragment-ring ring-outer">
      <div class="sc-fragment-ring-inner"></div>
    </div>
    <!-- 内层裂痕符文环 - 逆时针持续旋转 -->
    <div class="sc-fragment-ring ring-inner">
      <div class="sc-fragment-ring-inner"></div>
    </div>

    <!-- 承伤裂纹波纹 - 从中心向外周期性扩散的暗紫碎裂波 -->
    <div class="sc-crack-wave wave-1"></div>
    <div class="sc-crack-wave wave-2"></div>
    <div class="sc-crack-wave wave-3"></div>

    <!-- 中央力量核心 - 发光的金色攻击力之球，持续脉冲 -->
    <div class="sc-core">
      <div class="sc-core-inner"></div>
    </div>

    <!-- 破甲穿透粒子轨道 - 8颗粒子沿圆形轨道持续旋转 -->
    <div class="sc-orbit">
      <div
        v-for="i in 8"
        :key="'sc-orbit-particle-' + i"
        class="sc-orbit-particle"
        :style="getOrbitParticleStyle(i)"
      ></div>
    </div>

    <!-- 力量涌动闪烁 - 周期性迸发的金色能量涌动，代表攻击力飙升 -->
    <div class="sc-power-surge surge-1"></div>
    <div class="sc-power-surge surge-2"></div>
    <div class="sc-power-surge surge-3"></div>

    <!-- 破甲穿透裂纹 - 周期性迸发的银色裂纹，代表格挡穿透 -->
    <div class="sc-penetration-flash flash-1"></div>
    <div class="sc-penetration-flash flash-2"></div>

    <!-- 力量纹章 - 持续旋转脉冲的牺牲标志 -->
    <div class="sc-emblem">
      <div class="sc-emblem-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 牺牲（持久BUFF特效）- 献祭觉醒·血链裂缚·碎盾化刃·攻力飙升
 * 骑士T技能（knight_t）特效组件
 * 一段时间内承受伤害增加，大幅提高攻击力与格挡穿透
 * 三效增益以三色能量裂流表现：攻击力金(attackMin/Max) + 破甲银(blockPenetration) + 承伤暗紫(damageTakenIncrease)
 * 承伤增加以碎裂裂纹与暗紫能量波表现防护被牺牲的代价
 * 以牺牲血红为主色调，融合碎盾裂痕的牺牲感与金色攻击力的力量感
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

/** 三效增益颜色表 - 对应三种属性效果 */
const SACRIFICE_COLORS = [
  { color: '#FFD700', glow: 'rgba(255, 215, 0, 0.8)' },     // 攻击力金 - 攻击力提升
  { color: '#C0C0C0', glow: 'rgba(192, 192, 192, 0.8)' },   // 破甲银 - 格挡穿透
  { color: '#4B0082', glow: 'rgba(75, 0, 130, 0.8)' }       // 承伤暗紫 - 承伤增加（代价）
]

/**
 * 计算牺牲舞台的动态样式
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
 * 生成碎盾爆发的碎片样式
 * 6块碎片从中心向不同方向飞散，模拟防御被牺牲时护盾碎裂
 * 颜色交替使用血红色和暗紫色，对应承伤增加和防御牺牲
 * @param {number} index - 碎片序号（1~6）
 * @returns {Object} CSS样式对象，含角度、颜色
 */
function getFragmentStyle (index) {
  const angle = (index - 1) * 60
  const c = SACRIFICE_COLORS[(index + 1) % 3]
  return {
    '--sc-fragment-angle': `${angle}deg`,
    '--sc-fragment-color': c.color,
    '--sc-fragment-glow': c.glow
  }
}

/**
 * 生成三色能量裂流的样式
 * 三道不同颜色能量流从底部向上涌起汇聚至中心
 * 金色代表攻击力，银色代表格挡穿透，暗紫代表承伤增加
 * @param {number} index - 能量流序号（1~3）
 * @returns {Object} CSS样式对象，含角度、颜色、延迟
 */
function getRiseStyle (index) {
  const angle = (index - 1) * 120 + 90
  const c = SACRIFICE_COLORS[(index - 1) % 3]
  const delay = 0.3 + (index - 1) * 0.06
  return {
    '--sc-rise-angle': `${angle}deg`,
    '--sc-rise-color': c.color,
    '--sc-rise-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成破甲穿透粒子的样式
 * 8颗粒子分为3组，对应三效增益
 * @param {number} index - 粒子序号（1~8）
 * @returns {Object} CSS样式对象，含角度、颜色、尺寸
 */
function getOrbitParticleStyle (index) {
  const angle = (index - 1) * 45
  const colorIdx = Math.floor((index - 1) / 3) % 3
  const c = SACRIFICE_COLORS[colorIdx]
  const size = 5 + (index % 2) * 2
  return {
    '--sc-orbit-angle': `${angle}deg`,
    '--sc-orbit-color': c.color,
    '--sc-orbit-glow': c.glow,
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
   牺牲 (knight_t / sacrifice) - 持久BUFF特效
   技能描述：一段时间内承受伤害增加，大幅提高攻击力与格挡穿透
   三效增益：攻击力金(attackMin/Max) + 破甲银(blockPenetration) + 承伤暗紫(damageTakenIncrease)
   代价：自身承伤增加（以碎裂裂纹与暗紫能量波表现防护被牺牲）
   GPU加速：contain隔离 + will-change + backface-visibility + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画结构：入场动画(0.8s) + 持续循环动画
   ================================================================ */

/* 牺牲舞台 - 定位容器 */
.sc-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：献祭觉醒（0s ~ 0.8s）---------- */

/* 牺牲暗幕 - 血色氛围笼罩（入场后渐隐） */
.sc-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at center,
    rgba(60, 0, 0, 0.5) 0%,
    rgba(40, 0, 20, 0.25) 50%,
    transparent 100%
  );
  animation: scDim 0.8s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes scDim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}

/* 血链光柱 - 从顶部降下的血红牺牲光柱（入场一次性） */
.sc-beam {
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
    rgba(139, 0, 0, 0.15) 15%,
    rgba(255, 215, 0, 0.3) 40%,
    rgba(139, 0, 0, 0.6) 65%,
    rgba(75, 0, 130, 0.2) 85%,
    transparent 100%
  );
  filter: blur(6px);
  opacity: 0;
  animation: scBeam 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  will-change: transform, opacity;
  z-index: 2;
}

@keyframes scBeam {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  30% { transform: translateX(-50%) scaleY(1); opacity: 1; }
  60% { transform: translateX(-50%) scaleY(1); opacity: 0.6; }
  100% { transform: translateX(-50%) scaleY(1); opacity: 0; }
}

/* 碎盾爆发 - 光柱触地后碎盾状径向爆发（入场一次性） */
.sc-shatter-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: scShatterBurst 0.6s ease-out 0.15s forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes scShatterBurst {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  40% {
    transform: translate3d(-50%, -50%, 0) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2);
    opacity: 0;
  }
}

/* 碎盾碎片 - 从中心向各方向飞散的碎片 */
.sc-fragment {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 4px;
  border-radius: 1px;
  background: linear-gradient(
    to right,
    var(--sc-fragment-color, #8B0000) 0%,
    rgba(255, 255, 255, 0.6) 50%,
    var(--sc-fragment-color, #8B0000) 100%
  );
  box-shadow: 0 0 6px var(--sc-fragment-glow, rgba(139, 0, 0, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--sc-fragment-angle, 0deg)) translateX(0) scale(0);
  filter: blur(0.5px);
}

.sc-shatter-burst .sc-fragment {
  animation: scFragmentFly 0.6s ease-out 0.15s forwards;
  will-change: transform, opacity;
}

@keyframes scFragmentFly {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sc-fragment-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  30% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--sc-fragment-angle, 0deg)) translateX(20px) scale(1.5);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sc-fragment-angle, 0deg)) translateX(60px) scale(0.3);
    opacity: 0;
  }
}

/* 三色能量裂流 - 从底部向上涌起汇聚至中心（入场一次性） */
.sc-rise {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    var(--sc-rise-color, #8B0000) 50%,
    rgba(139, 0, 0, 0.3) 100%
  );
  box-shadow:
    0 0 8px var(--sc-rise-color, #8B0000),
    0 0 16px var(--sc-rise-glow, rgba(139, 0, 0, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--sc-rise-angle, 0deg)) translateX(120px) scale(0);
  opacity: 0;
  animation: scRiseGather 0.5s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes scRiseGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--sc-rise-angle, 0deg)) translateX(120px) scale(0.5);
    opacity: 0;
  }
  30% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--sc-rise-angle, 0deg) + 180deg)) translateX(0) scale(1.8);
    opacity: 0;
  }
}

/* ---------- 持续循环动画 ---------- */

/* 牺牲血光晕 - 外层柔和血红发光氛围（持续显示） */
.sc-aura {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 50%,
    rgba(139, 0, 0, 0.12) 65%,
    rgba(75, 0, 130, 0.06) 80%,
    transparent 100%
  );
  opacity: 0;
  animation: scAuraIn 0.5s ease-out 0.5s forwards,
             scAuraPulse 2.5s ease-in-out 1s infinite;
  will-change: opacity, transform;
  z-index: 1;
}

@keyframes scAuraIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes scAuraPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.06);
  }
}

/* 牺牲光环主体 - 发光的双色光环边框（持续显示） */
.sc-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: scHaloIn 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) 0.5s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes scHaloIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 - 半透明血红能量填充 */
.sc-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.1) 0%,
    rgba(139, 0, 0, 0.1) 50%,
    transparent 80%
  );
  animation: scFieldPulse 2s ease-in-out infinite;
  will-change: opacity;
}

@keyframes scFieldPulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 三色牺牲光环边框 */
.sc-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(139, 0, 0, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(255, 215, 0, 0.5) 0deg,       /* 攻击力金 */
    rgba(139, 0, 0, 0.35) 80deg,      /* 血红 */
    rgba(192, 192, 192, 0.5) 160deg,  /* 破甲银 */
    rgba(139, 0, 0, 0.35) 240deg,     /* 血红 */
    rgba(255, 215, 0, 0.5) 320deg,    /* 攻击力金 */
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
    0 0 12px rgba(139, 0, 0, 0.5),
    inset 0 0 12px rgba(255, 215, 0, 0.3);
  animation: scBorderGlow 1.8s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes scBorderGlow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 12px rgba(139, 0, 0, 0.5),
      inset 0 0 12px rgba(255, 215, 0, 0.3);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 18px rgba(139, 0, 0, 0.9),
      0 0 8px rgba(255, 215, 0, 0.5),
      0 0 8px rgba(192, 192, 192, 0.3),
      inset 0 0 8px rgba(255, 215, 0, 0.5);
  }
}

/* 外层碎盾碎片环 - 顺时针持续旋转 */
.sc-fragment-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  opacity: 0;
  will-change: transform, opacity;
  z-index: 4;
}

.sc-fragment-ring.ring-outer {
  width: 95%;
  height: 95%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: scRingOuterIn 0.4s ease-out 0.55s forwards,
             scRingOuterSpin 4.5s linear 0.95s infinite;
}

.sc-fragment-ring.ring-inner {
  width: 70%;
  height: 70%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: scRingInnerIn 0.4s ease-out 0.6s forwards,
             scRingInnerSpin 3.5s linear 1s infinite;
}

/* 外圈碎盾纹路 - 8道血红碎盾纹路 */
.sc-fragment-ring.ring-outer .sc-fragment-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dashed rgba(139, 0, 0, 0.5);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(139, 0, 0, 0.2) 15deg,
    transparent 30deg,
    transparent 45deg,
    rgba(255, 215, 0, 0.2) 60deg,
    transparent 75deg,
    transparent 90deg,
    rgba(139, 0, 0, 0.2) 105deg,
    transparent 120deg,
    transparent 135deg,
    rgba(255, 215, 0, 0.2) 150deg,
    transparent 165deg,
    transparent 180deg,
    rgba(139, 0, 0, 0.2) 195deg,
    transparent 210deg,
    transparent 225deg,
    rgba(255, 215, 0, 0.2) 240deg,
    transparent 255deg,
    transparent 270deg,
    rgba(139, 0, 0, 0.2) 285deg,
    transparent 300deg,
    transparent 315deg,
    rgba(255, 215, 0, 0.2) 330deg,
    transparent 345deg,
    transparent 360deg
  );
  box-shadow: 0 0 6px rgba(139, 0, 0, 0.3);
}

/* 内圈裂痕符文 - 三色裂痕符文（金/银/紫交替） */
.sc-fragment-ring.ring-inner .sc-fragment-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dotted rgba(255, 215, 0, 0.4);
  background: conic-gradient(
    from 0deg,
    rgba(255, 215, 0, 0.2) 0deg,
    transparent 40deg,
    transparent 80deg,
    rgba(192, 192, 192, 0.2) 120deg,
    transparent 160deg,
    transparent 200deg,
    rgba(75, 0, 130, 0.2) 240deg,
    transparent 280deg,
    transparent 320deg,
    rgba(255, 215, 0, 0.2) 360deg
  );
  box-shadow: inset 0 0 5px rgba(139, 0, 0, 0.15);
}

@keyframes scRingOuterIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
}

@keyframes scRingOuterSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.7; }
}

@keyframes scRingInnerIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes scRingInnerSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0.6; }
}

/* 承伤裂纹波纹 - 从中心向外周期性扩散的暗紫碎裂波 */
.sc-crack-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  border: 2px solid rgba(75, 0, 130, 0.6);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  z-index: 3;
}

.sc-crack-wave.wave-1 {
  animation: scCrackWave 2.2s ease-out 0.8s infinite;
}
.sc-crack-wave.wave-2 {
  animation: scCrackWave 2.2s ease-out 1.5s infinite;
  border-color: rgba(139, 0, 0, 0.5);
}
.sc-crack-wave.wave-3 {
  animation: scCrackWave 2.2s ease-out 1.9s infinite;
  border-color: rgba(255, 215, 0, 0.4);
}

@keyframes scCrackWave {
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

/* 中央力量核心 - 发光的金色攻击力之球，持续脉冲 */
.sc-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22%;
  height: 22%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: scCoreIn 0.3s ease-out 0.65s forwards,
             scCorePulse 1.5s ease-in-out 0.95s infinite;
  will-change: transform, opacity;
  z-index: 6;
}

.sc-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 215, 0, 0.9) 25%,
    rgba(139, 0, 0, 0.7) 60%,
    rgba(75, 0, 130, 0.3) 100%
  );
  box-shadow:
    0 0 12px rgba(139, 0, 0, 0.8),
    0 0 24px rgba(255, 215, 0, 0.4);
}

@keyframes scCoreIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes scCorePulse {
  0%, 100% { transform: translate3d(-50%, -50%, 0) scale(1); }
  50% { transform: translate3d(-50%, -50%, 0) scale(1.2); }
}

/* 破甲穿透粒子轨道 - 8颗粒子沿圆形轨道持续旋转 */
.sc-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: scOrbitIn 0.3s ease-out 0.7s forwards,
             scOrbitSpin 4s linear 1s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes scOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes scOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 1; }
}

/* 轨道粒子 - 三种颜色对应三效增益 */
.sc-orbit-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    var(--sc-orbit-color, #8B0000) 50%,
    rgba(139, 0, 0, 0.3) 100%
  );
  box-shadow: 0 0 6px var(--sc-orbit-glow, rgba(139, 0, 0, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--sc-orbit-angle, 0deg)) translateY(-45%);
}

/* 力量涌动闪烁 - 周期性迸发的金色能量涌动，代表攻击力飙升 */
.sc-power-surge {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 88%;
  height: 88%;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.6);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.sc-power-surge.surge-1 {
  animation: scPowerSurge 3.5s ease-out 1.5s infinite;
}
.sc-power-surge.surge-2 {
  animation: scPowerSurge 4.5s ease-out 3s infinite;
  border-color: rgba(139, 0, 0, 0.6);
}
.sc-power-surge.surge-3 {
  animation: scPowerSurge 5s ease-out 4.2s infinite;
  border-color: rgba(192, 192, 192, 0.6);
}

@keyframes scPowerSurge {
  0%, 85% {
    transform: translate3d(-50%, -50%, 0) scale(0.8);
    opacity: 0;
  }
  88% {
    transform: translate3d(-50%, -50%, 0) scale(1) rotate(5deg);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.6) rotate(-5deg);
    opacity: 0;
  }
}

/* 破甲穿透裂纹 - 周期性迸发的银色裂纹，代表格挡穿透 */
.sc-penetration-flash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 92%;
  height: 92%;
  border-radius: 50%;
  border: 2px solid rgba(192, 192, 192, 0.6);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.sc-penetration-flash.flash-1 {
  animation: scPenetrationFlash 4s ease-out 2s infinite;
}
.sc-penetration-flash.flash-2 {
  animation: scPenetrationFlash 5s ease-out 3.5s infinite;
  border-color: rgba(255, 215, 0, 0.5);
}

@keyframes scPenetrationFlash {
  0%, 80% {
    transform: translate3d(-50%, -50%, 0) scale(0.85);
    opacity: 0;
  }
  85% {
    transform: translate3d(-50%, -50%, 0) scale(1) rotate(8deg);
    opacity: 0.85;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.5) rotate(-8deg);
    opacity: 0;
  }
}

/* 力量纹章 - 持续旋转脉冲的牺牲标志 */
.sc-emblem {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 35%;
  height: 35%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  opacity: 0;
  animation: scEmblemIn 0.3s ease-out 0.7s forwards,
             scEmblemSpin 5s linear 1s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

.sc-emblem-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(139, 0, 0, 0.5) 20deg,
    transparent 40deg,
    transparent 50deg,
    rgba(255, 215, 0, 0.5) 70deg,
    transparent 90deg,
    transparent 100deg,
    rgba(139, 0, 0, 0.5) 120deg,
    transparent 140deg,
    transparent 150deg,
    rgba(192, 192, 192, 0.5) 170deg,
    transparent 190deg,
    transparent 200deg,
    rgba(139, 0, 0, 0.5) 220deg,
    transparent 240deg,
    transparent 250deg,
    rgba(255, 215, 0, 0.5) 270deg,
    transparent 290deg,
    transparent 300deg,
    rgba(139, 0, 0, 0.5) 320deg,
    transparent 340deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  filter: blur(0.5px);
}

@keyframes scEmblemIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes scEmblemSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.6; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .sc-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
