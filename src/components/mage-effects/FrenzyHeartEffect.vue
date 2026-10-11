<!--
  @file FrenzyHeartEffect.vue
  @generated 2026-07-09
  @description 狂暴之心（持久BUFF特效）- 狂心觉醒·烈焰脉搏·暴击星火·魔力裂流
  骑士E技能（knight_e）：获得狂暴之力，激活时每次普通攻击消耗1%最大MP值
  三维增益：命中橙(命中率) + 速攻赤(攻击速度) + 暴击金(暴击率)
  代价：每次普攻消耗1%最大MP（以蓝色魔力裂流表现能量消耗）
  BUFF持续期间一直显示，BUFF到期后自动移除
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 0.8s）- 狂暴暗幕降临 + 狂心光柱降下 + 能量爆发 + 三维能量流螺旋汇聚
    持续循环 - 狂心脉搏跳动 + 双层能量符文环旋转 + 烈焰粒子环绕 + 暴击星火迸发 +
              魔力裂流消耗 + 命中准星闪烁 + 速攻残影纹章旋转
  色彩方案：狂暴深红(#C71585) + 烈焰金(#FFD700) + 命中橙(#FF8C00) + 魔力蓝(#4169E1)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
-->
<template>
  <!-- 狂心舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="fh-stage" :style="stageStyle">
    <!-- ===== 入场动画：狂心觉醒（0s ~ 0.8s）===== -->
    <!-- 狂暴暗幕 - 深红氛围笼罩（入场后渐隐） -->
    <div class="fh-dim"></div>

    <!-- 天降狂心光柱 - 从顶部降下的猩红光柱 -->
    <div class="fh-beam"></div>

    <!-- 能量爆发 - 光柱触地后径向爆发 -->
    <div class="fh-burst">
      <div
        v-for="i in 6"
        :key="'fh-spark-' + i"
        class="fh-spark"
        :style="getSparkStyle(i)"
      ></div>
    </div>

    <!-- 三维能量流 - 从三方螺旋汇聚至中心（入场一次性） -->
    <div
      v-for="i in 3"
      :key="'fh-stream-' + i"
      class="fh-stream"
      :style="getStreamStyle(i)"
    ></div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 狂心光晕 - 外层柔和深红发光氛围（持续显示） -->
    <div class="fh-aura"></div>

    <!-- 狂心光环主体 - 发光的双色光环边框 -->
    <div class="fh-halo">
      <div class="fh-halo-field"></div>
      <div class="fh-halo-border"></div>
    </div>

    <!-- 外层符文圆环 - 顺时针持续旋转 -->
    <div class="fh-rune-ring ring-outer">
      <div class="fh-rune-ring-inner"></div>
    </div>
    <!-- 内层符文圆环 - 逆时针持续旋转 -->
    <div class="fh-rune-ring ring-inner">
      <div class="fh-rune-ring-inner"></div>
    </div>

    <!-- 魔力裂流波纹 - 从中心向外周期性扩散的蓝色魔力消耗波 -->
    <div class="fh-mp-wave wave-1"></div>
    <div class="fh-mp-wave wave-2"></div>
    <div class="fh-mp-wave wave-3"></div>

    <!-- 中央狂心核心 - 发光的猩红狂暴之心，持续脉搏跳动 -->
    <div class="fh-core">
      <div class="fh-core-inner"></div>
      <div class="fh-core-glow"></div>
    </div>

    <!-- 烈焰粒子环绕 - 9颗粒子沿圆形轨道持续旋转 -->
    <div class="fh-orbit">
      <div
        v-for="i in 9"
        :key="'fh-orbit-particle-' + i"
        class="fh-orbit-particle"
        :style="getOrbitParticleStyle(i)"
      ></div>
    </div>

    <!-- 暴击星火 - 周期性迸发的金色星火，代表暴击率提升 -->
    <div class="fh-crit-flash crit-1"></div>
    <div class="fh-crit-flash crit-2"></div>
    <div class="fh-crit-flash crit-3"></div>

    <!-- 命中准星闪烁 - 周期性闪现的橙色准星，代表命中率提升 -->
    <div class="fh-target"></div>

    <!-- 速攻残影纹章 - 持续旋转脉冲的狂暴标志 -->
    <div class="fh-emblem">
      <div class="fh-emblem-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 狂暴之心（持久BUFF特效）- 狂心觉醒·烈焰脉搏·暴击星火·魔力裂流
 * 骑士E技能（knight_e）特效组件
 * 获得狂暴之力，激活时每次普通攻击消耗1%最大MP值
 * 三维增益以三色能量流表现：命中橙(命中率) + 速攻赤(攻击速度) + 暴击金(暴击率)
 * 魔力消耗以蓝色裂流波纹表现能量被汲取
 * 以狂暴深红为主色调，融合心脏脉搏的律动感与烈焰能量的狂暴感
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

/** 三维增益颜色表 - 对应三种属性增益 + 魔力蓝 */
const FRENZY_COLORS = [
  { color: '#FF8C00', glow: 'rgba(255, 140, 0, 0.8)' },     // 命中橙 - 命中率
  { color: '#C71585', glow: 'rgba(199, 21, 133, 0.8)' },    // 速攻赤 - 攻击速度
  { color: '#FFD700', glow: 'rgba(255, 215, 0, 0.8)' },     // 暴击金 - 暴击率
  { color: '#4169E1', glow: 'rgba(65, 105, 225, 0.8)' }     // 魔力蓝 - MP消耗
]

/**
 * 计算狂心舞台的动态样式
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
 * 生成能量爆发的火花样式
 * 6颗火花从中心向不同方向飞散，模拟狂心觉醒时能量迸发
 * 颜色交替使用深红和金色，对应攻击速度和暴击率
 * @param {number} index - 火花序号（1~6）
 * @returns {Object} CSS样式对象，含角度、颜色
 */
function getSparkStyle (index) {
  const angle = (index - 1) * 60
  const c = FRENZY_COLORS[(index + 1) % 3]
  return {
    '--fh-spark-angle': `${angle}deg`,
    '--fh-spark-color': c.color,
    '--fh-spark-glow': c.glow
  }
}

/**
 * 生成三维能量流的样式
 * 三道不同颜色能量流从三个方向（120度间隔）螺旋汇聚至中心
 * 橙色代表命中率，深红代表攻击速度，金色代表暴击率
 * @param {number} index - 能量流序号（1~3）
 * @returns {Object} CSS样式对象，含角度、颜色、延迟
 */
function getStreamStyle (index) {
  const angle = (index - 1) * 120
  const c = FRENZY_COLORS[(index - 1) % 3]
  const delay = 0.3 + (index - 1) * 0.06
  return {
    '--fh-stream-angle': `${angle}deg`,
    '--fh-stream-color': c.color,
    '--fh-stream-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成烈焰环绕粒子的样式
 * 9颗粒子分为3组，每组3颗同色，对应三维增益
 * @param {number} index - 粒子序号（1~9）
 * @returns {Object} CSS样式对象，含角度、颜色、尺寸
 */
function getOrbitParticleStyle (index) {
  const angle = (index - 1) * 40
  const colorIdx = Math.floor((index - 1) / 3) % 3
  const c = FRENZY_COLORS[colorIdx]
  const size = 5 + (index % 2) * 2
  return {
    '--fh-orbit-angle': `${angle}deg`,
    '--fh-orbit-color': c.color,
    '--fh-orbit-glow': c.glow,
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
   狂暴之心 (knight_e / frenzy) - 持久BUFF特效
   技能描述：获得狂暴之力，激活时每次普通攻击消耗1%最大MP值
   三维增益：命中橙(命中率) + 速攻赤(攻击速度) + 暴击金(暴击率)
   代价：每次普攻消耗1%最大MP（以蓝色魔力裂流波纹表现）
   GPU加速：contain隔离 + will-change + backface-visibility + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画结构：入场动画(0.8s) + 持续循环动画
   ================================================================ */

/* 狂心舞台 - 定位容器 */
.fh-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：狂心觉醒（0s ~ 0.8s）---------- */

/* 狂暴暗幕 - 深红氛围笼罩（入场后渐隐） */
.fh-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at center,
    rgba(80, 0, 40, 0.45) 0%,
    rgba(50, 0, 25, 0.25) 50%,
    transparent 100%
  );
  animation: fhDim 0.8s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes fhDim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}

/* 天降狂心光柱 - 从顶部降下的猩红光柱（入场一次性） */
.fh-beam {
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
    rgba(199, 21, 133, 0.15) 15%,
    rgba(255, 140, 0, 0.35) 40%,
    rgba(199, 21, 133, 0.6) 65%,
    rgba(139, 0, 0, 0.25) 85%,
    transparent 100%
  );
  filter: blur(6px);
  opacity: 0;
  animation: fhBeam 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  will-change: transform, opacity;
  z-index: 2;
}

@keyframes fhBeam {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  30% { transform: translateX(-50%) scaleY(1); opacity: 1; }
  60% { transform: translateX(-50%) scaleY(1); opacity: 0.6; }
  100% { transform: translateX(-50%) scaleY(1); opacity: 0; }
}

/* 能量爆发 - 光柱触地后径向爆发（入场一次性） */
.fh-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: fhBurst 0.6s ease-out 0.15s forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes fhBurst {
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

/* 爆发火花 - 从中心向各方向飞散的能量碎片 */
.fh-spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 3px;
  border-radius: 1px;
  background: linear-gradient(
    to right,
    var(--fh-spark-color, #C71585) 0%,
    rgba(255, 255, 255, 0.6) 50%,
    var(--fh-spark-color, #C71585) 100%
  );
  box-shadow: 0 0 6px var(--fh-spark-glow, rgba(199, 21, 133, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--fh-spark-angle, 0deg)) translateX(0) scale(0);
  filter: blur(0.5px);
}

.fh-burst .fh-spark {
  animation: fhSparkFly 0.6s ease-out 0.15s forwards;
  will-change: transform, opacity;
}

@keyframes fhSparkFly {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--fh-spark-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  30% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--fh-spark-angle, 0deg)) translateX(20px) scale(1.5);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--fh-spark-angle, 0deg)) translateX(60px) scale(0.3);
    opacity: 0;
  }
}

/* 三维能量流 - 从三方螺旋汇聚至中心（入场一次性） */
.fh-stream {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    var(--fh-stream-color, #C71585) 50%,
    rgba(199, 21, 133, 0.3) 100%
  );
  box-shadow:
    0 0 8px var(--fh-stream-color, #C71585),
    0 0 16px var(--fh-stream-glow, rgba(199, 21, 133, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--fh-stream-angle, 0deg)) translateX(120px) scale(0);
  opacity: 0;
  animation: fhStreamGather 0.5s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes fhStreamGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--fh-stream-angle, 0deg)) translateX(120px) scale(0.5);
    opacity: 0;
  }
  30% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--fh-stream-angle, 0deg) + 180deg)) translateX(0) scale(1.8);
    opacity: 0;
  }
}

/* ---------- 持续循环动画 ---------- */

/* 狂心光晕 - 外层柔和深红发光氛围（持续显示） */
.fh-aura {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 50%,
    rgba(199, 21, 133, 0.1) 65%,
    rgba(139, 0, 0, 0.06) 80%,
    transparent 100%
  );
  opacity: 0;
  animation: fhAuraIn 0.5s ease-out 0.5s forwards,
             fhAuraPulse 2.5s ease-in-out 1s infinite;
  will-change: opacity, transform;
  z-index: 1;
}

@keyframes fhAuraIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes fhAuraPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.06);
  }
}

/* 狂心光环主体 - 发光的双色光环边框（持续显示） */
.fh-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: fhHaloIn 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) 0.5s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes fhHaloIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 - 半透明深红能量填充 */
.fh-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 140, 0, 0.12) 0%,
    rgba(199, 21, 133, 0.08) 50%,
    transparent 80%
  );
  animation: fhFieldPulse 2s ease-in-out infinite;
  will-change: opacity;
}

@keyframes fhFieldPulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 三色狂心光环边框 */
.fh-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(199, 21, 133, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(255, 140, 0, 0.5) 0deg,      /* 命中橙 */
    rgba(199, 21, 133, 0.35) 80deg,   /* 速攻赤 */
    rgba(255, 215, 0, 0.5) 160deg,    /* 暴击金 */
    rgba(199, 21, 133, 0.35) 240deg,  /* 速攻赤 */
    rgba(255, 140, 0, 0.5) 320deg,    /* 命中橙 */
    rgba(255, 140, 0, 0.5) 360deg
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
    0 0 12px rgba(199, 21, 133, 0.5),
    inset 0 0 12px rgba(255, 140, 0, 0.3);
  animation: fhBorderGlow 1.8s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes fhBorderGlow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 12px rgba(199, 21, 133, 0.5),
      inset 0 0 12px rgba(255, 140, 0, 0.3);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 18px rgba(199, 21, 133, 0.9),
      0 0 8px rgba(255, 140, 0, 0.5),
      0 0 8px rgba(255, 215, 0, 0.3),
      inset 0 0 8px rgba(255, 140, 0, 0.5);
  }
}

/* 外层符文圆环 - 顺时针持续旋转 */
.fh-rune-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  opacity: 0;
  will-change: transform, opacity;
  z-index: 4;
}

.fh-rune-ring.ring-outer {
  width: 95%;
  height: 95%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: fhRingOuterIn 0.4s ease-out 0.55s forwards,
             fhRingOuterSpin 4.5s linear 0.95s infinite;
}

.fh-rune-ring.ring-inner {
  width: 70%;
  height: 70%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: fhRingInnerIn 0.4s ease-out 0.6s forwards,
             fhRingInnerSpin 3.5s linear 1s infinite;
}

/* 外圈符文 - 8道深红符文纹路 */
.fh-rune-ring.ring-outer .fh-rune-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dashed rgba(199, 21, 133, 0.5);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(199, 21, 133, 0.2) 15deg,
    transparent 30deg,
    transparent 45deg,
    rgba(255, 140, 0, 0.2) 60deg,
    transparent 75deg,
    transparent 90deg,
    rgba(199, 21, 133, 0.2) 105deg,
    transparent 120deg,
    transparent 135deg,
    rgba(255, 140, 0, 0.2) 150deg,
    transparent 165deg,
    transparent 180deg,
    rgba(199, 21, 133, 0.2) 195deg,
    transparent 210deg,
    transparent 225deg,
    rgba(255, 140, 0, 0.2) 240deg,
    transparent 255deg,
    transparent 270deg,
    rgba(199, 21, 133, 0.2) 285deg,
    transparent 300deg,
    transparent 315deg,
    rgba(255, 140, 0, 0.2) 330deg,
    transparent 345deg,
    transparent 360deg
  );
  box-shadow: 0 0 6px rgba(199, 21, 133, 0.3);
}

/* 内圈符文 - 三色符文（橙/赤/金交替） */
.fh-rune-ring.ring-inner .fh-rune-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dotted rgba(255, 140, 0, 0.4);
  background: conic-gradient(
    from 0deg,
    rgba(255, 140, 0, 0.2) 0deg,
    transparent 40deg,
    transparent 80deg,
    rgba(199, 21, 133, 0.2) 120deg,
    transparent 160deg,
    transparent 200deg,
    rgba(255, 215, 0, 0.2) 240deg,
    transparent 280deg,
    transparent 320deg,
    rgba(255, 140, 0, 0.2) 360deg
  );
  box-shadow: inset 0 0 5px rgba(199, 21, 133, 0.15);
}

@keyframes fhRingOuterIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
}

@keyframes fhRingOuterSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.7; }
}

@keyframes fhRingInnerIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes fhRingInnerSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0.6; }
}

/* 魔力裂流波纹 - 从中心向外周期性扩散的蓝色魔力消耗波 */
.fh-mp-wave {
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

.fh-mp-wave.wave-1 {
  animation: fhMpWave 2.2s ease-out 0.8s infinite;
}
.fh-mp-wave.wave-2 {
  animation: fhMpWave 2.2s ease-out 1.5s infinite;
  border-color: rgba(199, 21, 133, 0.5);
}
.fh-mp-wave.wave-3 {
  animation: fhMpWave 2.2s ease-out 1.9s infinite;
  border-color: rgba(255, 140, 0, 0.4);
}

@keyframes fhMpWave {
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

/* 中央狂心核心 - 发光的猩红狂暴之心，持续脉搏跳动（模拟心跳节奏） */
.fh-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24%;
  height: 24%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: fhCoreIn 0.3s ease-out 0.65s forwards,
             fhCoreBeat 1.2s ease-in-out 0.95s infinite;
  will-change: transform, opacity;
  z-index: 6;
}

.fh-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 140, 0, 0.9) 25%,
    rgba(199, 21, 133, 0.7) 60%,
    rgba(139, 0, 0, 0.3) 100%
  );
  box-shadow:
    0 0 12px rgba(199, 21, 133, 0.8),
    0 0 24px rgba(199, 21, 133, 0.4);
}

.fh-core-glow {
  position: absolute;
  inset: -30%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 140, 0, 0.3) 0%,
    rgba(199, 21, 133, 0.15) 40%,
    transparent 70%
  );
  animation: fhCoreGlowPulse 1.2s ease-in-out 0.95s infinite;
  will-change: opacity, transform;
}

@keyframes fhCoreIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 心跳脉搏 - 模拟心脏跳动节奏（快收-慢放-停顿） */
@keyframes fhCoreBeat {
  0% { transform: translate3d(-50%, -50%, 0) scale(1); }
  15% { transform: translate3d(-50%, -50%, 0) scale(1.25); }
  30% { transform: translate3d(-50%, -50%, 0) scale(1.05); }
  45% { transform: translate3d(-50%, -50%, 0) scale(1.2); }
  60% { transform: translate3d(-50%, -50%, 0) scale(1); }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); }
}

@keyframes fhCoreGlowPulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  15% { opacity: 0.9; transform: scale(1.2); }
  30% { opacity: 0.5; transform: scale(1.05); }
  45% { opacity: 0.8; transform: scale(1.15); }
  60% { opacity: 0.4; transform: scale(1); }
}

/* 烈焰粒子环绕 - 9颗粒子沿圆形轨道持续旋转 */
.fh-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: fhOrbitIn 0.3s ease-out 0.7s forwards,
             fhOrbitSpin 4s linear 1s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes fhOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes fhOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 1; }
}

/* 环绕粒子 - 三种颜色对应三维增益 */
.fh-orbit-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    var(--fh-orbit-color, #C71585) 50%,
    rgba(199, 21, 133, 0.3) 100%
  );
  box-shadow: 0 0 6px var(--fh-orbit-glow, rgba(199, 21, 133, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--fh-orbit-angle, 0deg)) translateY(-45%);
}

/* 暴击星火 - 周期性迸发的金色星火，代表暴击率提升 */
.fh-crit-flash {
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

.fh-crit-flash.crit-1 {
  animation: fhCritFlash 3.5s ease-out 1.5s infinite;
}
.fh-crit-flash.crit-2 {
  animation: fhCritFlash 4.5s ease-out 3s infinite;
  border-color: rgba(255, 140, 0, 0.6);
}
.fh-crit-flash.crit-3 {
  animation: fhCritFlash 5s ease-out 4.2s infinite;
  border-color: rgba(199, 21, 133, 0.6);
}

@keyframes fhCritFlash {
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

/* 命中准星闪烁 - 周期性闪现的橙色准星，代表命中率提升 */
.fh-target {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50%;
  height: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  opacity: 0;
  animation: fhTargetFlash 3s ease-in-out 2s infinite;
  will-change: transform, opacity;
  z-index: 5;
}

/* 准星十字线 - 水平线 */
.fh-target::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 140, 0, 0.6) 20%,
    rgba(255, 255, 255, 0.9) 50%,
    rgba(255, 140, 0, 0.6) 80%,
    transparent 100%
  );
  transform: translateY(-50%);
  box-shadow: 0 0 4px rgba(255, 140, 0, 0.6);
}

/* 准星十字线 - 垂直线 */
.fh-target::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 140, 0, 0.6) 20%,
    rgba(255, 255, 255, 0.9) 50%,
    rgba(255, 140, 0, 0.6) 80%,
    transparent 100%
  );
  transform: translateX(-50%);
  box-shadow: 0 0 4px rgba(255, 140, 0, 0.6);
}

@keyframes fhTargetFlash {
  0%, 70% {
    transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
    opacity: 0;
  }
  80% {
    transform: translate3d(-50%, -50%, 0) scale(1.1) rotate(0deg);
    opacity: 0.8;
  }
  90% {
    transform: translate3d(-50%, -50%, 0) scale(1) rotate(45deg);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.3) rotate(90deg);
    opacity: 0;
  }
}

/* 速攻残影纹章 - 持续旋转脉冲的狂暴标志 */
.fh-emblem {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 35%;
  height: 35%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  opacity: 0;
  animation: fhEmblemIn 0.3s ease-out 0.7s forwards,
             fhEmblemSpin 5s linear 1s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

.fh-emblem-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(199, 21, 133, 0.5) 20deg,
    transparent 40deg,
    transparent 50deg,
    rgba(255, 140, 0, 0.5) 70deg,
    transparent 90deg,
    transparent 100deg,
    rgba(199, 21, 133, 0.5) 120deg,
    transparent 140deg,
    transparent 150deg,
    rgba(255, 215, 0, 0.5) 170deg,
    transparent 190deg,
    transparent 200deg,
    rgba(199, 21, 133, 0.5) 220deg,
    transparent 240deg,
    transparent 250deg,
    rgba(255, 140, 0, 0.5) 270deg,
    transparent 290deg,
    transparent 300deg,
    rgba(199, 21, 133, 0.5) 320deg,
    transparent 340deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  filter: blur(0.5px);
}

@keyframes fhEmblemIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes fhEmblemSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.6; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .fh-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
