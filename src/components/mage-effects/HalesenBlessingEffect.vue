<!--
  @file HalesenBlessingEffect.vue
  @generated 2026-07-09
  @description 赫雷森.凯列蓝的祝福（持久BUFF特效）- 元素狂暴·五元素汇聚·暴击之力·大师意志
  元素使者Q技能（element_mage_q）：传承于 元素使者大师-赫雷森.凯列蓝的祝福之力,
  施法后获得 狂暴的元素之力,大幅增加暴击率,暴击伤害,元素属性攻击,所向披靡.
  五元素增益以五彩能量流表现：火赤(#FF4500) + 风翠(#00FF7F) + 土金(#DAA520) + 雷紫(#9370DB) + 水蓝(#00BFFF)
  暴击之力以金色闪电(#FFD700)表现，大师意志以纯白(#F0F8FF)表现
  BUFF持续期间一直显示，BUFF到期后由父组件通过 v-if 移除
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 1.0s）- 五色元素风暴降临 + 五元素光柱汇聚 + 五色能量爆发
    持续循环 - 五色元素符文双环旋转 + 五元素能量球环绕 + 暴击金色闪电链 +
              中央元素核心脉冲 + 五色粒子涡旋 + 元素波纹脉冲 + 偶发暴击爆发
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
-->
<template>
  <!-- 祝福舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="hb-stage" :style="stageStyle">
    <!-- ===== 入场动画：元素风暴降临（0s ~ 1.0s）===== -->
    <!-- 元素暗幕 - 五色氛围笼罩（入场后渐隐） -->
    <div class="hb-dim"></div>

    <!-- 五元素汇聚光柱 - 从五个方向降下的彩色祝福光束 -->
    <div
      v-for="i in 5"
      :key="'hb-beam-' + i"
      class="hb-beam"
      :style="getBeamStyle(i)"
    ></div>

    <!-- 五色能量爆发 - 元素汇聚后的径向爆发 -->
    <div class="hb-burst">
      <div class="hb-burst-inner"></div>
    </div>

    <!-- 五元素凝聚流 - 从五方螺旋汇聚至中心（入场一次性） -->
    <div
      v-for="i in 5"
      :key="'hb-stream-' + i"
      class="hb-stream"
      :style="getStreamStyle(i)"
    ></div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 大师光晕 - 外层柔和白色发光氛围（持续显示） -->
    <div class="hb-aura"></div>

    <!-- 五色祝福光环主体 - 发光的五彩祝福光环边框 -->
    <div class="hb-halo">
      <div class="hb-halo-field"></div>
      <div class="hb-halo-border"></div>
    </div>

    <!-- 外层元素符文圆环 - 顺时针持续旋转 -->
    <div class="hb-element-ring ring-outer">
      <div class="hb-element-ring-inner"></div>
    </div>
    <!-- 内层元素符文圆环 - 逆时针持续旋转 -->
    <div class="hb-element-ring ring-inner">
      <div class="hb-element-ring-inner"></div>
    </div>

    <!-- 元素波纹 - 从中心向外周期性扩散的五色波 -->
    <div class="hb-wave wave-1"></div>
    <div class="hb-wave wave-2"></div>
    <div class="hb-wave wave-3"></div>

    <!-- 中央元素核心 - 发光的五色祝福之球，持续脉冲 -->
    <div class="hb-core">
      <div class="hb-core-inner"></div>
    </div>

    <!-- 五色粒子涡旋 - 10颗粒子沿圆形轨道持续旋转 -->
    <div class="hb-orbit">
      <div
        v-for="i in 10"
        :key="'hb-orbit-particle-' + i"
        class="hb-orbit-particle"
        :style="getOrbitParticleStyle(i)"
      ></div>
    </div>

    <!-- 五元素能量球轨道 - 5颗元素球沿光环边缘持续旋转 -->
    <div class="hb-element-orbit">
      <div
        v-for="i in 5"
        :key="'hb-orbit-element-' + i"
        class="hb-orbit-element"
        :style="getElementOrbitStyle(i)"
      >
        <div class="hb-orbit-element-ball"></div>
      </div>
    </div>

    <!-- 暴击金色闪电 - 周期性闪烁的金色能量闪电链 -->
    <div class="hb-lightning lightning-1"></div>
    <div class="hb-lightning lightning-2"></div>
    <div class="hb-lightning lightning-3"></div>

    <!-- 五色元素纹章 - 持续旋转脉冲的元素使者标志 -->
    <div class="hb-emblem">
      <div class="hb-emblem-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 赫雷森.凯列蓝的祝福（持久BUFF特效）- 元素狂暴·五元素汇聚·暴击之力·大师意志
 * 元素使者Q技能（element_mage_q）特效组件
 * 传承于 元素使者大师-赫雷森.凯列蓝的祝福之力，
 * 施法后获得 狂暴的元素之力，大幅增加暴击率、暴击伤害、元素属性攻击
 * 五元素增益以五彩能量流表现：火赤 + 风翠 + 土金 + 雷紫 + 水蓝
 * 暴击之力以金色闪电表现，大师意志以纯白为主色调
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
 * 五元素颜色表 - 对应火、风、土、雷、水五种元素属性攻击
 * 每种元素有主色、辉光色和浅色三个变体
 */
const ELEMENT_COLORS = [
  { color: '#FF4500', glow: 'rgba(255, 69, 0, 0.8)', light: 'rgba(255, 140, 0, 0.95)' },   // 火赤
  { color: '#00FF7F', glow: 'rgba(0, 255, 127, 0.8)', light: 'rgba(127, 255, 191, 0.95)' }, // 风翠
  { color: '#DAA520', glow: 'rgba(218, 165, 32, 0.8)', light: 'rgba(255, 215, 100, 0.95)' }, // 土金
  { color: '#9370DB', glow: 'rgba(147, 112, 219, 0.8)', light: 'rgba(186, 153, 240, 0.95)' }, // 雷紫
  { color: '#00BFFF', glow: 'rgba(0, 191, 255, 0.8)', light: 'rgba(100, 220, 255, 0.95)' }   // 水蓝
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
 * 生成五元素汇聚光柱的样式
 * 五道光柱从五个方向（72度间隔）降下，每道颜色对应一种元素
 * @param {number} index - 光柱序号（1~5）
 * @returns {Object} CSS样式对象，含角度、颜色、延迟
 */
function getBeamStyle (index) {
  const angle = (index - 1) * 72
  const c = ELEMENT_COLORS[(index - 1) % 5]
  const delay = (index - 1) * 0.04
  return {
    '--hb-beam-angle': `${angle}deg`,
    '--hb-beam-color': c.color,
    '--hb-beam-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成五元素凝聚能量流的样式
 * 五道能量流从五个方向螺旋汇聚至中心
 * @param {number} index - 能量流序号（1~5）
 * @returns {Object} CSS样式对象，含角度、颜色、延迟
 */
function getStreamStyle (index) {
  const angle = (index - 1) * 72
  const c = ELEMENT_COLORS[(index - 1) % 5]
  const delay = 0.3 + (index - 1) * 0.04
  return {
    '--hb-stream-angle': `${angle}deg`,
    '--hb-stream-color': c.color,
    '--hb-stream-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成五色环绕粒子的样式
 * 10颗粒子分为5组，每组对应一种元素颜色
 * @param {number} index - 粒子序号（1~10）
 * @returns {Object} CSS样式对象，含角度、颜色、尺寸
 */
function getOrbitParticleStyle (index) {
  const angle = (index - 1) * 36
  const c = ELEMENT_COLORS[(index - 1) % 5]
  const size = 5 + (index % 2) * 2
  return {
    '--hb-orbit-angle': `${angle}deg`,
    '--hb-orbit-color': c.color,
    '--hb-orbit-glow': c.glow,
    width: `${size}px`,
    height: `${size}px`
  }
}

/**
 * 生成五元素能量球轨道的样式
 * 5颗元素球沿光环边缘旋转，每颗对应一种元素
 * @param {number} index - 元素球序号（1~5）
 * @returns {Object} CSS样式对象，含角度、颜色
 */
function getElementOrbitStyle (index) {
  const angle = (index - 1) * 72
  const c = ELEMENT_COLORS[(index - 1) % 5]
  return {
    '--hb-element-angle': `${angle}deg`,
    '--hb-element-color': c.color,
    '--hb-element-glow': c.glow,
    '--hb-element-light': c.light
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
   赫雷森.凯列蓝的祝福 (element_mage_q / elemental_blessing) - 持久BUFF特效
   技能描述：传承于 元素使者大师-赫雷森.凯列蓝的祝福之力,
             施法后获得 狂暴的元素之力,大幅增加暴击率,暴击伤害,元素属性攻击,所向披靡.
   五元素增益：火赤(#FF4500) + 风翠(#00FF7F) + 土金(#DAA520) + 雷紫(#9370DB) + 水蓝(#00BFFF)
   暴击之力：金色闪电(#FFD700) + 大师纯白(#F0F8FF)
   GPU加速：contain隔离 + will-change + backface-visibility + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画结构：入场动画(1.0s) + 持续循环动画
   ================================================================ */

/* 祝福舞台 - 定位容器 */
.hb-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：元素风暴降临（0s ~ 1.0s）---------- */

/* 元素暗幕 - 五色氛围笼罩（入场后渐隐） */
.hb-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at center,
    rgba(20, 20, 40, 0.4) 0%,
    rgba(25, 15, 35, 0.25) 50%,
    transparent 100%
  );
  animation: hbDim 1.0s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes hbDim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}

/* 五元素汇聚光柱 - 从五个方向降下的彩色祝福光束（入场一次性） */
.hb-beam {
  position: absolute;
  top: -20%;
  left: 50%;
  width: 40%;
  height: 140%;
  transform: translateX(-50%) scaleY(0) rotate(var(--hb-beam-angle, 0deg));
  transform-origin: center top;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 15%,
    var(--hb-beam-glow, rgba(255, 215, 0, 0.3)) 40%,
    var(--hb-beam-color, #FFD700) 60%,
    var(--hb-beam-glow, rgba(255, 215, 0, 0.3)) 80%,
    transparent 100%
  );
  filter: blur(5px);
  opacity: 0;
  animation: hbBeam 0.7s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  will-change: transform, opacity;
  z-index: 2;
}

@keyframes hbBeam {
  0% {
    transform: translateX(-50%) scaleY(0) rotate(var(--hb-beam-angle, 0deg));
    opacity: 0;
  }
  30% {
    transform: translateX(-50%) scaleY(1) rotate(var(--hb-beam-angle, 0deg));
    opacity: 0.8;
  }
  60% {
    transform: translateX(-50%) scaleY(1) rotate(var(--hb-beam-angle, 0deg));
    opacity: 0.5;
  }
  100% {
    transform: translateX(-50%) scaleY(1) rotate(var(--hb-beam-angle, 0deg));
    opacity: 0;
  }
}

/* 五色能量爆发 - 元素汇聚后的径向爆发（入场一次性） */
.hb-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: hbBurst 0.6s ease-out 0.3s forwards;
  will-change: transform, opacity;
  z-index: 3;
}

.hb-burst-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 215, 0, 0.5) 20%,
    rgba(255, 69, 0, 0.3) 35%,
    rgba(0, 255, 127, 0.25) 50%,
    rgba(0, 191, 255, 0.2) 65%,
    rgba(147, 112, 219, 0.15) 80%,
    transparent 95%
  );
  filter: blur(4px);
}

@keyframes hbBurst {
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

/* 五元素凝聚流 - 从五方螺旋汇聚至中心（入场一次性） */
.hb-stream {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    var(--hb-stream-color, #FFD700) 50%,
    var(--hb-stream-glow, rgba(255, 215, 0, 0.3)) 100%
  );
  box-shadow:
    0 0 8px var(--hb-stream-color, #FFD700),
    0 0 16px var(--hb-stream-glow, rgba(255, 215, 0, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--hb-stream-angle, 0deg)) translateX(120px) scale(0);
  opacity: 0;
  animation: hbStreamGather 0.5s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes hbStreamGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--hb-stream-angle, 0deg)) translateX(120px) scale(0.5);
    opacity: 0;
  }
  30% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--hb-stream-angle, 0deg) + 180deg)) translateX(0) scale(1.8);
    opacity: 0;
  }
}

/* ---------- 持续循环动画 ---------- */

/* 大师光晕 - 外层柔和白色发光氛围（持续显示） */
.hb-aura {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 50%,
    rgba(240, 248, 255, 0.06) 65%,
    rgba(255, 215, 0, 0.04) 80%,
    transparent 100%
  );
  opacity: 0;
  animation: hbAuraIn 0.5s ease-out 0.6s forwards,
             hbAuraPulse 3s ease-in-out 1.1s infinite;
  will-change: opacity, transform;
  z-index: 1;
}

@keyframes hbAuraIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes hbAuraPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.05);
  }
}

/* 五色祝福光环主体 - 发光的五彩祝福光环边框（持续显示） */
.hb-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: hbHaloIn 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) 0.6s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes hbHaloIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 - 半透明五色祝福能量填充 */
.hb-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(240, 248, 255, 0.12) 0%,
    rgba(255, 215, 0, 0.06) 50%,
    transparent 80%
  );
  animation: hbFieldPulse 2.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes hbFieldPulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 五色元素光环边框 */
.hb-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(255, 69, 0, 0.5) 0deg,       /* 火赤 */
    rgba(255, 215, 0, 0.35) 36deg,    /* 暴击金 */
    rgba(0, 255, 127, 0.5) 72deg,     /* 风翠 */
    rgba(255, 215, 0, 0.35) 108deg,   /* 暴击金 */
    rgba(218, 165, 32, 0.5) 144deg,   /* 土金 */
    rgba(240, 248, 255, 0.35) 180deg, /* 大师白 */
    rgba(147, 112, 219, 0.5) 216deg,  /* 雷紫 */
    rgba(255, 215, 0, 0.35) 252deg,   /* 暴击金 */
    rgba(0, 191, 255, 0.5) 288deg,    /* 水蓝 */
    rgba(255, 215, 0, 0.35) 324deg,   /* 暴击金 */
    rgba(255, 69, 0, 0.5) 360deg
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
    inset 0 0 12px rgba(240, 248, 255, 0.2);
  animation: hbBorderGlow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes hbBorderGlow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 12px rgba(255, 215, 0, 0.5),
      inset 0 0 12px rgba(240, 248, 255, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 16px rgba(255, 215, 0, 0.8),
      0 0 8px rgba(255, 69, 0, 0.3),
      0 0 8px rgba(0, 191, 255, 0.3),
      inset 0 0 8px rgba(240, 248, 255, 0.3);
  }
}

/* 外层元素符文圆环 - 顺时针持续旋转 */
.hb-element-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  opacity: 0;
  will-change: transform, opacity;
  z-index: 4;
}

.hb-element-ring.ring-outer {
  width: 95%;
  height: 95%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: hbRingOuterIn 0.4s ease-out 0.65s forwards,
             hbRingOuterSpin 5s linear 1.05s infinite;
}

.hb-element-ring.ring-inner {
  width: 70%;
  height: 70%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: hbRingInnerIn 0.4s ease-out 0.7s forwards,
             hbRingInnerSpin 4s linear 1.1s infinite;
}

/* 外圈元素符文 - 五色刀锋纹路，72度间隔 */
.hb-element-ring.ring-outer .hb-element-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dashed rgba(255, 215, 0, 0.4);
  background: conic-gradient(
    from 0deg,
    rgba(255, 69, 0, 0.2) 0deg,
    transparent 36deg,
    transparent 72deg,
    rgba(0, 255, 127, 0.2) 72deg,
    transparent 108deg,
    transparent 144deg,
    rgba(218, 165, 32, 0.2) 144deg,
    transparent 180deg,
    transparent 216deg,
    rgba(147, 112, 219, 0.2) 216deg,
    transparent 252deg,
    transparent 288deg,
    rgba(0, 191, 255, 0.2) 288deg,
    transparent 324deg,
    transparent 360deg
  );
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.25);
}

/* 内圈元素符文 - 金色/白色符文交替 */
.hb-element-ring.ring-inner .hb-element-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dotted rgba(240, 248, 255, 0.35);
  background: conic-gradient(
    from 0deg,
    rgba(255, 215, 0, 0.18) 0deg,
    transparent 45deg,
    transparent 90deg,
    rgba(240, 248, 255, 0.18) 90deg,
    transparent 135deg,
    transparent 180deg,
    rgba(255, 215, 0, 0.18) 180deg,
    transparent 225deg,
    transparent 270deg,
    rgba(240, 248, 255, 0.18) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 5px rgba(240, 248, 255, 0.12);
}

@keyframes hbRingOuterIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
}

@keyframes hbRingOuterSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.7; }
}

@keyframes hbRingInnerIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes hbRingInnerSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0.6; }
}

/* 元素波纹 - 从中心向外周期性扩散的五色波 */
.hb-wave {
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

.hb-wave.wave-1 {
  animation: hbWave 2.4s ease-out 0.9s infinite;
}
.hb-wave.wave-2 {
  animation: hbWave 2.4s ease-out 1.7s infinite;
  border-color: rgba(0, 191, 255, 0.5);
}
.hb-wave.wave-3 {
  animation: hbWave 2.4s ease-out 2.1s infinite;
  border-color: rgba(255, 69, 0, 0.4);
}

@keyframes hbWave {
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

/* 中央元素核心 - 发光的五色祝福之球，持续脉冲 */
.hb-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22%;
  height: 22%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: hbCoreIn 0.3s ease-out 0.75s forwards,
             hbCorePulse 1.8s ease-in-out 1.05s infinite;
  will-change: transform, opacity;
  z-index: 6;
}

.hb-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(240, 248, 255, 0.9) 20%,
    rgba(255, 215, 0, 0.7) 50%,
    rgba(255, 69, 0, 0.3) 80%,
    rgba(147, 112, 219, 0.2) 100%
  );
  box-shadow:
    0 0 12px rgba(255, 215, 0, 0.8),
    0 0 24px rgba(255, 215, 0, 0.4);
}

@keyframes hbCoreIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes hbCorePulse {
  0%, 100% { transform: translate3d(-50%, -50%, 0) scale(1); }
  50% { transform: translate3d(-50%, -50%, 0) scale(1.15); }
}

/* 五色粒子涡旋 - 10颗粒子沿圆形轨道持续旋转 */
.hb-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: hbOrbitIn 0.3s ease-out 0.8s forwards,
             hbOrbitSpin 5s linear 1.1s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes hbOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes hbOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 1; }
}

/* 环绕粒子 - 五色交替，对应五种元素属性攻击 */
.hb-orbit-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    var(--hb-orbit-color, #FFD700) 50%,
    rgba(255, 215, 0, 0.3) 100%
  );
  box-shadow: 0 0 6px var(--hb-orbit-glow, rgba(255, 215, 0, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--hb-orbit-angle, 0deg)) translateY(-45%);
}

/* 五元素能量球轨道 - 5颗元素球沿光环边缘持续旋转 */
.hb-element-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: hbElementOrbitIn 0.4s ease-out 0.8s forwards,
             hbElementOrbitSpin 4s linear 1.2s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes hbElementOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes hbElementOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 1; }
}

/* 环绕元素球定位 - 每颗球沿轨道边缘旋转 */
.hb-orbit-element {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  transform: translate3d(-50%, -50%, 0) rotate(var(--hb-element-angle, 0deg)) translateY(-50%);
}

/* 元素能量球本体 - 五色发光球体 */
.hb-orbit-element-ball {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    var(--hb-element-light, rgba(255, 255, 255, 0.9)) 30%,
    var(--hb-element-color, #FFD700) 60%,
    var(--hb-element-glow, rgba(255, 215, 0, 0.3)) 100%
  );
  box-shadow:
    0 0 6px var(--hb-element-glow, rgba(255, 215, 0, 0.8)),
    0 0 12px var(--hb-element-color, rgba(255, 215, 0, 0.5));
}

/* 暴击金色闪电 - 周期性闪烁的金色能量闪电，代表暴击率与暴击伤害 */
.hb-lightning {
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

.hb-lightning.lightning-1 {
  animation: hbLightningFlash 4.5s ease-out 2s infinite;
}
.hb-lightning.lightning-2 {
  animation: hbLightningFlash 5.5s ease-out 3.5s infinite;
  border-color: rgba(240, 248, 255, 0.6);
}
.hb-lightning.lightning-3 {
  animation: hbLightningFlash 6s ease-out 5s infinite;
  border-color: rgba(255, 69, 0, 0.6);
}

@keyframes hbLightningFlash {
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

/* 五色元素纹章 - 持续旋转脉冲的元素使者标志 */
.hb-emblem {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 35%;
  height: 35%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  opacity: 0;
  animation: hbEmblemIn 0.3s ease-out 0.8s forwards,
             hbEmblemSpin 6s linear 1.1s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

.hb-emblem-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(255, 69, 0, 0.4) 0deg,
    transparent 20deg,
    transparent 40deg,
    rgba(0, 255, 127, 0.4) 72deg,
    transparent 92deg,
    transparent 112deg,
    rgba(218, 165, 32, 0.4) 144deg,
    transparent 164deg,
    transparent 184deg,
    rgba(147, 112, 219, 0.4) 216deg,
    transparent 236deg,
    transparent 256deg,
    rgba(0, 191, 255, 0.4) 288deg,
    transparent 308deg,
    transparent 328deg,
    rgba(255, 69, 0, 0.4) 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  filter: blur(0.5px);
}

@keyframes hbEmblemIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes hbEmblemSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.6; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .hb-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
