<!--
  @file AilandeBlessingEffect.vue
  @generated 2026-07-09
  @description 爱岚德的祝福（持久BUFF特效）- 体魄强化·智慧启迪·格挡壁垒·大圆满治愈
  守护使者U技能（guardian_u）：传承于守护使者大师-爱岚德的力量,
  施法后获得大幅增加体魄与智慧,格挡率的能力,攻守兼备,大圆满时可追加治疗能力.
  体魄以金色护盾(#FFD700)表现,智慧以银蓝星光(#87CEEB)表现,
  格挡以翠绿壁垒(#00CED1)表现,大圆满治愈以圣洁白光(#F0FFF0)表现
  BUFF持续期间一直显示，BUFF到期后由父组件通过 v-if 移除
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 1.2s）- 圣光降临 + 双色光柱汇聚 + 能量爆发 + 护盾成形
    持续循环 - 金银双色符文双环旋转 + 智慧星光环绕 + 护盾脉冲 +
              中央圣核脉动 + 粒子涡旋 + 圣光波纹 + 偶发护盾闪光
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
-->
<template>
  <!-- 祝福舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="ab-stage" :style="stageStyle">
    <!-- ===== 入场动画：圣光降临（0s ~ 1.2s）===== -->
    <!-- 圣光暗幕 - 金色氛围笼罩（入场后渐隐） -->
    <div class="ab-dim"></div>

    <!-- 双色汇聚光柱 - 金色（体魄）与银蓝色（智慧）光柱从天而降 -->
    <div
      v-for="i in 6"
      :key="'ab-beam-' + i"
      class="ab-beam"
      :style="getBeamStyle(i)"
    ></div>

    <!-- 圣光能量爆发 - 汇聚后的径向爆发 -->
    <div class="ab-burst">
      <div class="ab-burst-inner"></div>
    </div>

    <!-- 双色凝聚流 - 从六方螺旋汇聚至中心（入场一次性） -->
    <div
      v-for="i in 6"
      :key="'ab-stream-' + i"
      class="ab-stream"
      :style="getStreamStyle(i)"
    ></div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 大师光晕 - 外层柔和金色发光氛围（持续显示） -->
    <div class="ab-aura"></div>

    <!-- 守护光环主体 - 发光的金银双色祝福光环边框 -->
    <div class="ab-halo">
      <div class="ab-halo-field"></div>
      <div class="ab-halo-border"></div>
    </div>

    <!-- 外层守护符文圆环 - 顺时针持续旋转 -->
    <div class="ab-rune-ring ring-outer">
      <div class="ab-rune-ring-inner"></div>
    </div>
    <!-- 内层智慧符文圆环 - 逆时针持续旋转 -->
    <div class="ab-rune-ring ring-inner">
      <div class="ab-rune-ring-inner"></div>
    </div>

    <!-- 圣光波纹 - 从中心向外周期性扩散 -->
    <div class="ab-wave wave-1"></div>
    <div class="ab-wave wave-2"></div>
    <div class="ab-wave wave-3"></div>

    <!-- 中央圣核 - 发光的守护祝福之球，持续脉冲 -->
    <div class="ab-core">
      <div class="ab-core-inner"></div>
    </div>

    <!-- 智慧粒子涡旋 - 12颗粒子沿圆形轨道持续旋转 -->
    <div class="ab-orbit">
      <div
        v-for="i in 12"
        :key="'ab-orbit-particle-' + i"
        class="ab-orbit-particle"
        :style="getOrbitParticleStyle(i)"
      ></div>
    </div>

    <!-- 守护能量球轨道 - 6颗能量球沿光环边缘持续旋转 -->
    <div class="ab-energy-orbit">
      <div
        v-for="i in 6"
        :key="'ab-energy-' + i"
        class="ab-energy-ball"
        :style="getEnergyOrbitStyle(i)"
      >
        <div class="ab-energy-ball-inner"></div>
      </div>
    </div>

    <!-- 护盾闪光 - 周期性闪烁的防护能量，代表格挡壁垒 -->
    <div class="ab-shield-flash shield-1"></div>
    <div class="ab-shield-flash shield-2"></div>
    <div class="ab-shield-flash shield-3"></div>

    <!-- 守护纹章 - 持续旋转脉冲的守护使者标志 -->
    <div class="ab-emblem">
      <div class="ab-emblem-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 爱岚德的祝福（持久BUFF特效）- 体魄强化·智慧启迪·格挡壁垒·大圆满治愈
 * 守护使者U技能（guardian_u）特效组件
 * 传承于守护使者大师-爱岚德的力量，
 * 施法后获得大幅增加体魄、智慧、格挡率，大圆满时追加治疗加成
 * 体魄以金色护盾表现，智慧以银蓝星光表现，
 * 格挡以翠绿壁垒表现，大圆满治愈以圣洁白光为主色调
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
 * 双色能量表 - 金色（体魄）与银蓝色（智慧）交替
 * 每种颜色有主色、辉光色和浅色三个变体
 */
const BLESSING_COLORS = [
  { color: '#FFD700', glow: 'rgba(255, 215, 0, 0.8)', light: 'rgba(255, 240, 150, 0.95)' },     // 金色 - 体魄
  { color: '#87CEEB', glow: 'rgba(135, 206, 235, 0.8)', light: 'rgba(180, 230, 250, 0.95)' },   // 银蓝 - 智慧
  { color: '#00CED1', glow: 'rgba(0, 206, 209, 0.8)', light: 'rgba(100, 230, 230, 0.95)' },     // 翠绿 - 格挡
  { color: '#FFD700', glow: 'rgba(255, 215, 0, 0.8)', light: 'rgba(255, 240, 150, 0.95)' },     // 金色 - 体魄
  { color: '#87CEEB', glow: 'rgba(135, 206, 235, 0.8)', light: 'rgba(180, 230, 250, 0.95)' },   // 银蓝 - 智慧
  { color: '#F0FFF0', glow: 'rgba(240, 255, 240, 0.7)', light: 'rgba(255, 255, 255, 0.95)' }    // 圣白 - 大圆满
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
 * 生成双色汇聚光柱的样式
 * 六道光柱从六个方向（60度间隔）降下，金色与银蓝色交替
 * @param {number} index - 光柱序号（1~6）
 * @returns {Object} CSS样式对象，含角度、颜色、延迟
 */
function getBeamStyle (index) {
  const angle = (index - 1) * 60
  const c = BLESSING_COLORS[(index - 1) % 6]
  const delay = (index - 1) * 0.05
  return {
    '--ab-beam-angle': `${angle}deg`,
    '--ab-beam-color': c.color,
    '--ab-beam-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成双色凝聚能量流的样式
 * 六道能量流从六个方向螺旋汇聚至中心
 * @param {number} index - 能量流序号（1~6）
 * @returns {Object} CSS样式对象，含角度、颜色、延迟
 */
function getStreamStyle (index) {
  const angle = (index - 1) * 60
  const c = BLESSING_COLORS[(index - 1) % 6]
  const delay = 0.3 + (index - 1) * 0.05
  return {
    '--ab-stream-angle': `${angle}deg`,
    '--ab-stream-color': c.color,
    '--ab-stream-glow': c.glow,
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
    '--ab-orbit-angle': `${angle}deg`,
    '--ab-orbit-color': c.color,
    '--ab-orbit-glow': c.glow,
    width: `${size}px`,
    height: `${size}px`
  }
}

/**
 * 生成守护能量球轨道的样式
 * 6颗能量球沿光环边缘旋转，每颗对应一种祝福属性
 * @param {number} index - 能量球序号（1~6）
 * @returns {Object} CSS样式对象，含角度、颜色
 */
function getEnergyOrbitStyle (index) {
  const angle = (index - 1) * 60
  const c = BLESSING_COLORS[(index - 1) % 6]
  return {
    '--ab-energy-angle': `${angle}deg`,
    '--ab-energy-color': c.color,
    '--ab-energy-glow': c.glow,
    '--ab-energy-light': c.light
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
   爱岚德的祝福 (guardian_u / ailande_blessing) - 持久BUFF特效
   技能描述：传承于守护使者大师-爱岚德的力量,
             施法后获得大幅增加体魄与智慧,格挡率的能力,攻守兼备,
             大圆满时可追加治疗能力.
   体魄增益：金色(#FFD700) + 智慧增益：银蓝(#87CEEB)
   格挡壁垒：翠绿(#00CED1) + 大圆满治愈：圣白(#F0FFF0)
   GPU加速：contain隔离 + will-change + backface-visibility + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画结构：入场动画(1.2s) + 持续循环动画
   ================================================================ */

/* 祝福舞台 - 定位容器 */
.ab-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：圣光降临（0s ~ 1.2s）---------- */

/* 圣光暗幕 - 金色氛围笼罩（入场后渐隐） */
.ab-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at center,
    rgba(40, 30, 10, 0.4) 0%,
    rgba(35, 30, 15, 0.25) 50%,
    transparent 100%
  );
  animation: abDim 1.2s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes abDim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}

/* 双色汇聚光柱 - 从六个方向降下的金银祝福光束（入场一次性） */
.ab-beam {
  position: absolute;
  top: -20%;
  left: 50%;
  width: 35%;
  height: 140%;
  transform: translateX(-50%) scaleY(0) rotate(var(--ab-beam-angle, 0deg));
  transform-origin: center top;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 15%,
    var(--ab-beam-glow, rgba(255, 215, 0, 0.3)) 40%,
    var(--ab-beam-color, #FFD700) 60%,
    var(--ab-beam-glow, rgba(255, 215, 0, 0.3)) 80%,
    transparent 100%
  );
  filter: blur(5px);
  opacity: 0;
  animation: abBeam 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  will-change: transform, opacity;
  z-index: 2;
}

@keyframes abBeam {
  0% {
    transform: translateX(-50%) scaleY(0) rotate(var(--ab-beam-angle, 0deg));
    opacity: 0;
  }
  30% {
    transform: translateX(-50%) scaleY(1) rotate(var(--ab-beam-angle, 0deg));
    opacity: 0.8;
  }
  60% {
    transform: translateX(-50%) scaleY(1) rotate(var(--ab-beam-angle, 0deg));
    opacity: 0.5;
  }
  100% {
    transform: translateX(-50%) scaleY(1) rotate(var(--ab-beam-angle, 0deg));
    opacity: 0;
  }
}

/* 圣光能量爆发 - 汇聚后的径向爆发（入场一次性） */
.ab-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: abBurst 0.7s ease-out 0.35s forwards;
  will-change: transform, opacity;
  z-index: 3;
}

.ab-burst-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 215, 0, 0.5) 20%,
    rgba(135, 206, 235, 0.35) 35%,
    rgba(0, 206, 209, 0.25) 50%,
    rgba(255, 215, 0, 0.2) 65%,
    rgba(135, 206, 235, 0.15) 80%,
    transparent 95%
  );
  filter: blur(4px);
}

@keyframes abBurst {
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

/* 双色凝聚流 - 从六方螺旋汇聚至中心（入场一次性） */
.ab-stream {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    var(--ab-stream-color, #FFD700) 50%,
    var(--ab-stream-glow, rgba(255, 215, 0, 0.3)) 100%
  );
  box-shadow:
    0 0 8px var(--ab-stream-color, #FFD700),
    0 0 16px var(--ab-stream-glow, rgba(255, 215, 0, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--ab-stream-angle, 0deg)) translateX(120px) scale(0);
  opacity: 0;
  animation: abStreamGather 0.6s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes abStreamGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--ab-stream-angle, 0deg)) translateX(120px) scale(0.5);
    opacity: 0;
  }
  30% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--ab-stream-angle, 0deg) + 180deg)) translateX(0) scale(1.8);
    opacity: 0;
  }
}

/* ---------- 持续循环动画 ---------- */

/* 大师光晕 - 外层柔和金色发光氛围（持续显示） */
.ab-aura {
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
  animation: abAuraIn 0.5s ease-out 0.7s forwards,
             abAuraPulse 3s ease-in-out 1.2s infinite;
  will-change: opacity, transform;
  z-index: 1;
}

@keyframes abAuraIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes abAuraPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.05);
  }
}

/* 守护光环主体 - 发光的金银双色祝福光环边框（持续显示） */
.ab-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: abHaloIn 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) 0.7s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes abHaloIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 - 半透明金色祝福能量填充 */
.ab-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.12) 0%,
    rgba(135, 206, 235, 0.06) 50%,
    transparent 80%
  );
  animation: abFieldPulse 2.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes abFieldPulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 金银双色光环边框 */
.ab-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(255, 215, 0, 0.5) 0deg,       /* 金色 - 体魄 */
    rgba(135, 206, 235, 0.35) 60deg,  /* 银蓝 - 智慧 */
    rgba(0, 206, 209, 0.5) 120deg,    /* 翠绿 - 格挡 */
    rgba(255, 215, 0, 0.35) 180deg,   /* 金色 - 体魄 */
    rgba(135, 206, 235, 0.5) 240deg,  /* 银蓝 - 智慧 */
    rgba(240, 255, 240, 0.35) 300deg, /* 圣白 - 大圆满 */
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
    0 0 12px rgba(255, 215, 0, 0.5),
    inset 0 0 12px rgba(135, 206, 235, 0.2);
  animation: abBorderGlow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes abBorderGlow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 12px rgba(255, 215, 0, 0.5),
      inset 0 0 12px rgba(135, 206, 235, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 16px rgba(255, 215, 0, 0.8),
      0 0 8px rgba(0, 206, 209, 0.3),
      0 0 8px rgba(135, 206, 235, 0.3),
      inset 0 0 8px rgba(240, 255, 240, 0.3);
  }
}

/* 外层守护符文圆环 - 顺时针持续旋转 */
.ab-rune-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  opacity: 0;
  will-change: transform, opacity;
  z-index: 4;
}

.ab-rune-ring.ring-outer {
  width: 95%;
  height: 95%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: abRingOuterIn 0.4s ease-out 0.75s forwards,
             abRingOuterSpin 5s linear 1.15s infinite;
}

.ab-rune-ring.ring-inner {
  width: 70%;
  height: 70%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: abRingInnerIn 0.4s ease-out 0.8s forwards,
             abRingInnerSpin 4s linear 1.2s infinite;
}

/* 外圈守护符文 - 金色刀锋纹路，60度间隔 */
.ab-rune-ring.ring-outer .ab-rune-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dashed rgba(255, 215, 0, 0.4);
  background: conic-gradient(
    from 0deg,
    rgba(255, 215, 0, 0.2) 0deg,
    transparent 30deg,
    transparent 60deg,
    rgba(135, 206, 235, 0.2) 60deg,
    transparent 90deg,
    transparent 120deg,
    rgba(0, 206, 209, 0.2) 120deg,
    transparent 150deg,
    transparent 180deg,
    rgba(255, 215, 0, 0.2) 180deg,
    transparent 210deg,
    transparent 240deg,
    rgba(135, 206, 235, 0.2) 240deg,
    transparent 270deg,
    transparent 300deg,
    rgba(240, 255, 240, 0.2) 300deg,
    transparent 330deg,
    transparent 360deg
  );
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.25);
}

/* 内圈智慧符文 - 金色/银蓝符文交替 */
.ab-rune-ring.ring-inner .ab-rune-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dotted rgba(135, 206, 235, 0.35);
  background: conic-gradient(
    from 0deg,
    rgba(255, 215, 0, 0.18) 0deg,
    transparent 45deg,
    transparent 90deg,
    rgba(135, 206, 235, 0.18) 90deg,
    transparent 135deg,
    transparent 180deg,
    rgba(255, 215, 0, 0.18) 180deg,
    transparent 225deg,
    transparent 270deg,
    rgba(135, 206, 235, 0.18) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 5px rgba(135, 206, 235, 0.12);
}

@keyframes abRingOuterIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
}

@keyframes abRingOuterSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.7; }
}

@keyframes abRingInnerIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes abRingInnerSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0.6; }
}

/* 圣光波纹 - 从中心向外周期性扩散 */
.ab-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  z-index: 3;
}

.ab-wave.wave-1 {
  animation: abWave 2.4s ease-out 1.0s infinite;
}
.ab-wave.wave-2 {
  animation: abWave 2.4s ease-out 1.8s infinite;
  border-color: rgba(135, 206, 235, 0.5);
}
.ab-wave.wave-3 {
  animation: abWave 2.4s ease-out 2.2s infinite;
  border-color: rgba(0, 206, 209, 0.4);
}

@keyframes abWave {
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

/* 中央圣核 - 发光的守护祝福之球，持续脉冲 */
.ab-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22%;
  height: 22%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: abCoreIn 0.3s ease-out 0.85s forwards,
             abCorePulse 1.8s ease-in-out 1.15s infinite;
  will-change: transform, opacity;
  z-index: 6;
}

.ab-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 240, 150, 0.9) 20%,
    rgba(255, 215, 0, 0.7) 50%,
    rgba(135, 206, 235, 0.3) 80%,
    rgba(0, 206, 209, 0.2) 100%
  );
  box-shadow:
    0 0 12px rgba(255, 215, 0, 0.8),
    0 0 24px rgba(255, 215, 0, 0.4);
}

@keyframes abCoreIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes abCorePulse {
  0%, 100% { transform: translate3d(-50%, -50%, 0) scale(1); }
  50% { transform: translate3d(-50%, -50%, 0) scale(1.15); }
}

/* 智慧粒子涡旋 - 12颗粒子沿圆形轨道持续旋转 */
.ab-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: abOrbitIn 0.3s ease-out 0.9s forwards,
             abOrbitSpin 5s linear 1.2s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes abOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes abOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 1; }
}

/* 环绕粒子 - 金银双色交替，对应体魄与智慧 */
.ab-orbit-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    var(--ab-orbit-color, #FFD700) 50%,
    rgba(255, 215, 0, 0.3) 100%
  );
  box-shadow: 0 0 6px var(--ab-orbit-glow, rgba(255, 215, 0, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--ab-orbit-angle, 0deg)) translateY(-45%);
}

/* 守护能量球轨道 - 6颗能量球沿光环边缘持续旋转 */
.ab-energy-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: abEnergyOrbitIn 0.4s ease-out 0.9s forwards,
             abEnergyOrbitSpin 4s linear 1.3s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes abEnergyOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes abEnergyOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 1; }
}

/* 环绕能量球定位 - 每颗球沿轨道边缘旋转 */
.ab-energy-ball {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  transform: translate3d(-50%, -50%, 0) rotate(var(--ab-energy-angle, 0deg)) translateY(-50%);
}

/* 能量球本体 - 多色发光球体 */
.ab-energy-ball-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    var(--ab-energy-light, rgba(255, 255, 255, 0.9)) 30%,
    var(--ab-energy-color, #FFD700) 60%,
    var(--ab-energy-glow, rgba(255, 215, 0, 0.3)) 100%
  );
  box-shadow:
    0 0 6px var(--ab-energy-glow, rgba(255, 215, 0, 0.8)),
    0 0 12px var(--ab-energy-color, rgba(255, 215, 0, 0.5));
}

/* 护盾闪光 - 周期性闪烁的防护能量，代表格挡率与防御壁垒 */
.ab-shield-flash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 88%;
  height: 88%;
  border-radius: 50%;
  border: 2px solid rgba(0, 206, 209, 0.6);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.ab-shield-flash.shield-1 {
  animation: abShieldFlash 4.5s ease-out 2s infinite;
}
.ab-shield-flash.shield-2 {
  animation: abShieldFlash 5.5s ease-out 3.5s infinite;
  border-color: rgba(255, 215, 0, 0.6);
}
.ab-shield-flash.shield-3 {
  animation: abShieldFlash 6s ease-out 5s infinite;
  border-color: rgba(135, 206, 235, 0.6);
}

@keyframes abShieldFlash {
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

/* 守护纹章 - 持续旋转脉冲的守护使者标志 */
.ab-emblem {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 35%;
  height: 35%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  opacity: 0;
  animation: abEmblemIn 0.3s ease-out 0.9s forwards,
             abEmblemSpin 6s linear 1.2s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

.ab-emblem-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(255, 215, 0, 0.4) 0deg,
    transparent 20deg,
    transparent 40deg,
    rgba(135, 206, 235, 0.4) 60deg,
    transparent 80deg,
    transparent 100deg,
    rgba(0, 206, 209, 0.4) 120deg,
    transparent 140deg,
    transparent 160deg,
    rgba(255, 215, 0, 0.4) 180deg,
    transparent 200deg,
    transparent 220deg,
    rgba(135, 206, 235, 0.4) 240deg,
    transparent 260deg,
    transparent 280deg,
    rgba(240, 255, 240, 0.4) 300deg,
    transparent 320deg,
    transparent 340deg,
    rgba(255, 215, 0, 0.4) 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  filter: blur(0.5px);
}

@keyframes abEmblemIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes abEmblemSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.6; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .ab-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
