<!--
  @file XuliBlessingEffect.vue
  @generated 2026-07-06
  @description 叙里的祝福（持久BUFF特效）- 技师觉醒·四维凝聚·祝福绽放·不败护体
  暴力技师R技能（technician_r）：传承暴力技师英雄叙里的祝福,增加施法者精神力和体魄,
  并大幅增加攻击速度,暴击率,使自身立于不败之地
  四维增益：智力蓝(精神力) + 体魄绿(体魄) + 速攻橙(攻击速度) + 暴击赤(暴击率)
  BUFF持续期间一直显示，BUFF到期后自动移除
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 0.7s）- 暗幕降临 + 祝福光柱 + 齿轮法阵展开 + 四维能量流汇聚 + 中心爆发
    持续循环 - 四色齿轮光环旋转 + 双层齿轮符文旋转 + 祝福波纹脉冲 + 技师核心脉冲 + 四色粒子环绕 + 不败护盾 + 齿轮纹章旋转
  色彩方案：技师金(#FFD700) + 智力蓝(#4169E1) + 体魄绿(#228B22) + 速攻橙(#FF8C00) + 暴击赤(#DC143C)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
-->
<template>
  <!-- 祝福舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="xb-stage" :style="stageStyle">
    <!-- ===== 入场动画：技师觉醒（0s ~ 0.7s）===== -->
    <!-- 技师暗幕 - 金色氛围笼罩（入场后渐隐） -->
    <div class="xb-dim"></div>

    <!-- 天降祝福光柱 - 从顶部降下的金色技师祝福光柱 -->
    <div class="xb-beam"></div>

    <!-- 祝福绽放 - 光柱触地的径向爆发 -->
    <div class="xb-bloom"></div>

    <!-- 齿轮法阵 - 从地面展开的齿轮纹路法阵 -->
    <div class="xb-gear-summon">
      <div class="xb-gear-summon-inner"></div>
    </div>

    <!-- 四维能量流 - 从四方螺旋汇聚至中心（入场一次性） -->
    <div
      v-for="i in 4"
      :key="'xb-stream-' + i"
      class="xb-stream"
      :style="getStreamStyle(i)"
    ></div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 祝福光晕 - 外层柔和发光氛围（持续显示） -->
    <div class="xb-aura"></div>

    <!-- 四色齿轮光环主体 - 发光的金色祝福光环边框 -->
    <div class="xb-halo">
      <div class="xb-halo-field"></div>
      <div class="xb-halo-border"></div>
    </div>

    <!-- 外层齿轮符文圆环 - 顺时针持续旋转 -->
    <div class="xb-gear-ring gear-outer">
      <div class="xb-gear-ring-inner"></div>
    </div>
    <!-- 内层齿轮符文圆环 - 逆时针持续旋转 -->
    <div class="xb-gear-ring gear-inner">
      <div class="xb-gear-ring-inner"></div>
    </div>

    <!-- 祝福波纹 - 从中心向外周期性扩散 -->
    <div class="xb-wave wave-1"></div>
    <div class="xb-wave wave-2"></div>
    <div class="xb-wave wave-3"></div>

    <!-- 中央技师核心 - 发光的金色祝福之球，持续脉冲 -->
    <div class="xb-core">
      <div class="xb-core-inner"></div>
    </div>

    <!-- 四色粒子环绕 - 4组粒子沿圆形轨道持续旋转 -->
    <div class="xb-orbit">
      <div
        v-for="i in 8"
        :key="'xb-orbit-particle-' + i"
        class="xb-orbit-particle"
        :style="getOrbitParticleStyle(i)"
      ></div>
    </div>

    <!-- 不败护盾光环 - 金色护盾边框，持续脉冲 -->
    <div class="xb-shield"></div>

    <!-- 齿轮纹章 - 持续旋转脉冲的技师齿轮标志 -->
    <div class="xb-emblem">
      <div class="xb-emblem-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 叙里的祝福（持久BUFF特效）- 技师觉醒·四维凝聚·祝福绽放·不败护体
 * 暴力技师R技能（technician_r）特效组件
 * 传承暴力技师英雄叙里的祝福,增加施法者精神力和体魄,并大幅增加攻击速度,暴击率,使自身立于不败之地
 * 四维增益以四色能量流表现：智力蓝(精神力) + 体魄绿(体魄) + 速攻橙(攻击速度) + 暴击赤(暴击率)
 * 以技师金为主色调，融合齿轮法阵的机械感与祝福光芒的神圣感
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

/** 四维增益颜色表 - 对应四种属性增益 */
const FOUR_COLORS = [
  { color: '#4169E1', glow: 'rgba(65, 105, 225, 0.8)' },  // 智力蓝 - 精神力
  { color: '#228B22', glow: 'rgba(34, 139, 34, 0.8)' },   // 体魄绿 - 体魄
  { color: '#FF8C00', glow: 'rgba(255, 140, 0, 0.8)' },   // 速攻橙 - 攻击速度
  { color: '#DC143C', glow: 'rgba(220, 20, 60, 0.8)' }    // 暴击赤 - 暴击率
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
 * 生成四维凝聚能量流的样式
 * 四道不同颜色能量流从四个方向（上/右/下/左）螺旋汇聚至中心
 * @param {number} index - 能量流序号（1~4）
 * @returns {Object} CSS样式对象，含角度、颜色、延迟
 */
function getStreamStyle (index) {
  const angle = (index - 1) * 90
  const c = FOUR_COLORS[(index - 1) % 4]
  const delay = 0.3 + (index - 1) * 0.04
  return {
    '--xb-stream-angle': `${angle}deg`,
    '--xb-stream-color': c.color,
    '--xb-stream-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成四色环绕粒子的样式
 * 8颗粒子分为4组，每组2颗同色，对应四维增益
 * @param {number} index - 粒子序号（1~8）
 * @returns {Object} CSS样式对象，含角度、颜色、尺寸
 */
function getOrbitParticleStyle (index) {
  const angle = (index - 1) * 45
  const colorIdx = Math.floor((index - 1) / 2) % 4
  const c = FOUR_COLORS[colorIdx]
  const size = 5 + (index % 2) * 2
  return {
    '--xb-orbit-angle': `${angle}deg`,
    '--xb-orbit-color': c.color,
    '--xb-orbit-glow': c.glow,
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
   叙里的祝福 (technician_r) - 持久BUFF特效
   技能描述：传承暴力技师英雄叙里的祝福,增加施法者精神力和体魄,
             并大幅增加攻击速度,暴击率,使自身立于不败之地
   四维增益：智力蓝(精神力) + 体魄绿(体魄) + 速攻橙(攻击速度) + 暴击赤(暴击率)
   GPU加速：contain隔离 + will-change + backface-visibility + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画结构：入场动画(0.7s) + 持续循环动画
   ================================================================ */

/* 祝福舞台 - 定位容器 */
.xb-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：技师觉醒（0s ~ 0.7s）---------- */

/* 技师暗幕 - 金色氛围笼罩（入场后渐隐） */
.xb-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at center,
    rgba(50, 38, 0, 0.4) 0%,
    rgba(40, 30, 0, 0.25) 50%,
    transparent 100%
  );
  animation: xbDim 0.7s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes xbDim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}

/* 天降祝福光柱 - 从顶部降下的金色技师祝福光柱（入场一次性） */
.xb-beam {
  position: absolute;
  top: -20%;
  left: 50%;
  width: 55%;
  height: 140%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: top center;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 215, 0, 0.15) 15%,
    rgba(255, 248, 220, 0.4) 40%,
    rgba(255, 215, 0, 0.6) 65%,
    rgba(255, 248, 220, 0.3) 85%,
    transparent 100%
  );
  filter: blur(6px);
  opacity: 0;
  animation: xbBeam 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  will-change: transform, opacity;
  z-index: 2;
}

@keyframes xbBeam {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  30% { transform: translateX(-50%) scaleY(1); opacity: 1; }
  60% { transform: translateX(-50%) scaleY(1); opacity: 0.6; }
  100% { transform: translateX(-50%) scaleY(1); opacity: 0; }
}

/* 祝福绽放 - 光柱触地的径向爆发（入场一次性） */
.xb-bloom {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 248, 220, 0.5) 20%,
    rgba(255, 215, 0, 0.3) 50%,
    transparent 80%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: xbBloom 0.5s ease-out 0.15s forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes xbBloom {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  40% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2); opacity: 0; }
}

/* 齿轮法阵 - 从地面展开的齿轮纹路法阵（入场一次性） */
.xb-gear-summon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 85%;
  height: 85%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(-90deg);
  opacity: 0;
  animation: xbGearSummon 0.5s cubic-bezier(0.2, 0.8, 0.3, 1) 0.1s forwards,
             xbGearSummonFade 0.3s ease-in 0.5s forwards;
  will-change: transform, opacity;
  z-index: 3;
}

.xb-gear-summon-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.3) 10deg,
    transparent 20deg,
    transparent 35deg,
    rgba(255, 248, 220, 0.25) 45deg,
    transparent 55deg,
    transparent 80deg,
    rgba(255, 215, 0, 0.3) 90deg,
    transparent 100deg,
    transparent 125deg,
    rgba(255, 248, 220, 0.25) 135deg,
    transparent 145deg,
    transparent 170deg,
    rgba(255, 215, 0, 0.3) 180deg,
    transparent 190deg,
    transparent 215deg,
    rgba(255, 248, 220, 0.25) 225deg,
    transparent 235deg,
    transparent 260deg,
    rgba(255, 215, 0, 0.3) 270deg,
    transparent 280deg,
    transparent 305deg,
    rgba(255, 248, 220, 0.25) 315deg,
    transparent 325deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 35%, black 40%, black 50%, transparent 55%);
  mask: radial-gradient(circle, transparent 35%, black 40%, black 50%, transparent 55%);
  filter: blur(1px);
}

@keyframes xbGearSummon {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(-90deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.8; }
}

@keyframes xbGearSummonFade {
  0% { opacity: 0.8; }
  100% { opacity: 0; }
}

/* 四维能量流 - 从四方螺旋汇聚至中心（入场一次性） */
.xb-stream {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    var(--xb-stream-color, #FFD700) 50%,
    rgba(255, 215, 0, 0.3) 100%
  );
  box-shadow:
    0 0 8px var(--xb-stream-color, #FFD700),
    0 0 16px var(--xb-stream-glow, rgba(255, 215, 0, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--xb-stream-angle, 0deg)) translateX(120px) scale(0);
  opacity: 0;
  animation: xbStreamGather 0.5s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes xbStreamGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--xb-stream-angle, 0deg)) translateX(120px) scale(0.5);
    opacity: 0;
  }
  30% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--xb-stream-angle, 0deg) + 180deg)) translateX(0) scale(1.8);
    opacity: 0;
  }
}

/* ---------- 持续循环动画 ---------- */

/* 祝福光晕 - 外层柔和发光氛围（持续显示） */
.xb-aura {
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
  animation: xbAuraIn 0.5s ease-out 0.5s forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes xbAuraIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* 四色齿轮光环主体 - 发光的金色祝福光环边框（持续显示） */
.xb-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: xbHaloIn 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) 0.5s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes xbHaloIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 - 半透明金色祝福能量填充 */
.xb-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 248, 220, 0.15) 0%,
    rgba(255, 215, 0, 0.08) 50%,
    transparent 80%
  );
}

/* 光环边框 - 四色齿轮光环边框 */
.xb-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(65, 105, 225, 0.5) 0deg,     /* 智力蓝 */
    rgba(34, 139, 34, 0.5) 90deg,     /* 体魄绿 */
    rgba(255, 140, 0, 0.5) 180deg,    /* 速攻橙 */
    rgba(220, 20, 60, 0.5) 270deg,    /* 暴击赤 */
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
}

/* 外层齿轮符文圆环 - 顺时针持续旋转 */
.xb-gear-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  opacity: 0;
  will-change: transform, opacity;
  z-index: 4;
}

.xb-gear-ring.gear-outer {
  width: 95%;
  height: 95%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: xbGearOuterIn 0.4s ease-out 0.55s forwards,
             xbGearOuterSpin 4s linear 0.95s infinite;
}

.xb-gear-ring.gear-inner {
  width: 70%;
  height: 70%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: xbGearInnerIn 0.4s ease-out 0.6s forwards,
             xbGearInnerSpin 3s linear 1s infinite;
}

/* 外圈齿轮 - 8齿金色齿轮纹路 */
.xb-gear-ring.gear-outer .xb-gear-ring-inner {
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

/* 内圈齿轮 - 四色齿轮符文 */
.xb-gear-ring.gear-inner .xb-gear-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dotted rgba(255, 248, 220, 0.4);
  background: conic-gradient(
    from 0deg,
    rgba(65, 105, 225, 0.2) 0deg,
    transparent 30deg,
    transparent 60deg,
    rgba(34, 139, 34, 0.2) 90deg,
    transparent 120deg,
    transparent 150deg,
    rgba(255, 140, 0, 0.2) 180deg,
    transparent 210deg,
    transparent 240deg,
    rgba(220, 20, 60, 0.2) 270deg,
    transparent 300deg,
    transparent 330deg,
    rgba(65, 105, 225, 0.2) 360deg
  );
  box-shadow: inset 0 0 5px rgba(255, 248, 220, 0.15);
}

@keyframes xbGearOuterIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
}

@keyframes xbGearOuterSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.7; }
}

@keyframes xbGearInnerIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes xbGearInnerSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0.6; }
}

/* 祝福波纹 - 从中心向外周期性扩散 */
.xb-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.6);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  z-index: 3;
}

.xb-wave.wave-1 {
  animation: xbWave 2.4s ease-out 0.8s infinite;
}
.xb-wave.wave-2 {
  animation: xbWave 2.4s ease-out 1.6s infinite;
  border-color: rgba(255, 248, 220, 0.5);
}
.xb-wave.wave-3 {
  animation: xbWave 2.4s ease-out 2.0s infinite;
  border-color: rgba(255, 215, 0, 0.4);
}

@keyframes xbWave {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { opacity: 0.8; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3); opacity: 0; }
}

/* 中央技师核心 - 发光的金色祝福之球，持续脉冲 */
.xb-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22%;
  height: 22%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: xbCoreIn 0.3s ease-out 0.65s forwards,
             xbCorePulse 1.8s ease-in-out 0.95s infinite;
  will-change: transform, opacity;
  z-index: 6;
}

.xb-core-inner {
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

@keyframes xbCoreIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes xbCorePulse {
  0%, 100% { transform: translate3d(-50%, -50%, 0) scale(1); }
  50% { transform: translate3d(-50%, -50%, 0) scale(1.15); }
}

/* 四色粒子环绕 - 8颗粒子沿圆形轨道持续旋转 */
.xb-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: xbOrbitIn 0.3s ease-out 0.7s forwards,
             xbOrbitSpin 5s linear 1s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes xbOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes xbOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 1; }
}

/* 环绕粒子 - 四种颜色对应四维增益 */
.xb-orbit-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    var(--xb-orbit-color, #FFD700) 50%,
    rgba(255, 215, 0, 0.3) 100%
  );
  box-shadow: 0 0 6px var(--xb-orbit-glow, rgba(255, 215, 0, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--xb-orbit-angle, 0deg)) translateY(-45%);
}

/* 不败护盾光环 - 金色护盾边框，持续脉冲 */
.xb-shield {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 92%;
  height: 92%;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.7);
  box-shadow:
    0 0 15px rgba(255, 215, 0, 0.5),
    inset 0 0 15px rgba(255, 248, 220, 0.3);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: xbShieldIn 0.3s ease-out 0.7s forwards,
             xbShieldPulse 2s ease-in-out 1s infinite;
  will-change: transform, opacity;
  z-index: 6;
}

@keyframes xbShieldIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.8; }
}

@keyframes xbShieldPulse {
  0%, 100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.8; }
  50% { transform: translate3d(-50%, -50%, 0) scale(1.08); opacity: 0.5; }
}

/* 齿轮纹章 - 持续旋转脉冲的技师齿轮标志 */
.xb-emblem {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 35%;
  height: 35%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  opacity: 0;
  animation: xbEmblemIn 0.3s ease-out 0.7s forwards,
             xbEmblemSpin 6s linear 1s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

.xb-emblem-inner {
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

@keyframes xbEmblemIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes xbEmblemSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.6; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .xb-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
