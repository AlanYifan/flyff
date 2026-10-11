<!--
  @file KnuckleMasteryEffect.vue
  @generated 2026-07-06
  @description 拳术领悟（持久BUFF特效）- 拳劲光环·四色能量环·拳意核心·速度螺旋
  暴力技师Q技能（technician_q）：提高拳套熟练度来增强攻击力。命中率和攻击速度随等级提升
  BUFF持续期间一直显示，BUFF到期后自动移除
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 0.6s）- 拳劲从两侧汇聚 + 爆发闪光 + 法阵展开
    持续循环 - 四色能量环旋转 + 拳意核心脉冲 + 速度金线螺旋 + 拳劲碎片环绕
  色彩方案：拳劲橙(#FF6B35) + 烈焰红(#FF3333) + 精准蓝(#00BFFF) + 速度金(#FFD700) + 纯白(#FFFFFF)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
-->
<template>
  <!-- 拳术舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="km-stage" :style="stageStyle">
    <!-- ===== 入场动画：拳劲凝聚（0s ~ 0.4s）===== -->
    <!-- 拳劲暗幕 - 橙红氛围笼罩 -->
    <div class="km-dim"></div>

    <!-- 左拳能量 - 从左侧飞入的橙色拳劲 -->
    <div class="km-fist-energy fist-left"></div>
    <!-- 右拳能量 - 从右侧飞入的橙色拳劲 -->
    <div class="km-fist-energy fist-right"></div>

    <!-- 入场爆发 - 中心橙色冲击爆发 -->
    <div class="km-burst"></div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 四色能量环 - 攻击红/命中蓝/速度金/力量橙 四段弧持续旋转 -->
    <div class="km-energy-ring">
      <div class="km-ring-segment seg-attack"></div>
      <div class="km-ring-segment seg-precision"></div>
      <div class="km-ring-segment seg-speed"></div>
      <div class="km-ring-segment seg-power"></div>
    </div>

    <!-- 速度金线螺旋 - 攻击速度象征，金色螺旋线持续旋转 -->
    <div class="km-speed-spiral"></div>

    <!-- 中央拳意核心 - 发光的拳劲之球，持续脉冲 -->
    <div class="km-core">
      <div class="km-core-inner"></div>
    </div>

    <!-- 拳劲碎片环绕 - 4块碎片沿轨道持续旋转 -->
    <div class="km-orbit">
      <div
        v-for="i in 4"
        :key="'km-orbit-shard-' + i"
        class="km-orbit-shard"
        :style="getOrbitShardStyle(i)"
      ></div>
    </div>

    <!-- 拳意光晕 - 外层柔和发光氛围 -->
    <div class="km-aura"></div>
  </div>
</template>

<script setup>
/**
 * 拳术领悟（持久BUFF特效）- 拳劲光环·四色能量环·拳意核心·速度螺旋
 * 暴力技师Q技能（technician_q）特效组件
 * 提高拳套熟练度来增强攻击力，命中率和攻击速度随等级提升
 * 以拳劲橙和烈焰红为主色调，精准蓝象征命中率，速度金象征攻击速度
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
 * 计算拳术舞台的动态样式
 * 根据 #playerAvatar 的实际位置和尺寸，精确定位覆盖头像区域
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

/** 四色碎片颜色表 - 攻击红/命中蓝/速度金/力量橙 */
const SHARD_COLORS = ['#FF3333', '#00BFFF', '#FFD700', '#FF6B35']

/**
 * 生成环绕碎片的样式
 * @param {number} index - 碎片序号（1~4）
 * @returns {Object} CSS样式对象，含角度、颜色、尺寸
 */
function getOrbitShardStyle (index) {
  const angle = (index - 1) * 90
  const color = SHARD_COLORS[(index - 1) % 4]
  const size = 6 + (index % 2) * 2
  return {
    '--km-orbit-angle': `${angle}deg`,
    '--km-orbit-color': color,
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
   拳术领悟 (knuckle_mastery) - 持久BUFF特效
   技能描述：提高拳套熟练度来增强攻击力。命中率和攻击速度随等级提升
   四色象征：攻击力(烈焰红#FF3333) + 命中率(精准蓝#00BFFF) + 攻击速度(速度金#FFD700) + 力量(拳劲橙#FF6B35)
   GPU加速：contain隔离 + will-change + backface-visibility + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画结构：入场动画(0.6s) + 持续循环动画
   ================================================================ */

/* 拳术舞台 - 定位容器 */
.km-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：拳劲凝聚（0s ~ 0.4s）---------- */

/* 拳劲暗幕 - 橙红氛围笼罩（入场后渐隐） */
.km-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at center,
    rgba(50, 20, 0, 0.4) 0%,
    rgba(40, 15, 0, 0.25) 50%,
    transparent 100%
  );
  animation: kmDim 0.6s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes kmDim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}

/* 左拳能量 - 从左侧飞入的橙色拳劲 */
.km-fist-energy {
  position: absolute;
  top: 50%;
  width: 35%;
  height: 30%;
  border-radius: 50%;
  opacity: 0;
  will-change: transform, opacity;
  z-index: 3;
}

.km-fist-energy.fist-left {
  left: -40%;
  background: radial-gradient(
    ellipse at right center,
    rgba(255, 107, 53, 0.8) 0%,
    rgba(255, 51, 51, 0.4) 50%,
    transparent 100%
  );
  filter: blur(4px);
  transform: translate3d(0, -50%, 0) scale(0.5);
  animation: kmFistLeft 0.4s cubic-bezier(0.3, 0, 0.7, 1) forwards;
}

.km-fist-energy.fist-right {
  right: -40%;
  background: radial-gradient(
    ellipse at left center,
    rgba(255, 107, 53, 0.8) 0%,
    rgba(255, 51, 51, 0.4) 50%,
    transparent 100%
  );
  filter: blur(4px);
  transform: translate3d(0, -50%, 0) scale(0.5);
  animation: kmFistRight 0.4s cubic-bezier(0.3, 0, 0.7, 1) forwards;
}

@keyframes kmFistLeft {
  0% { transform: translate3d(0, -50%, 0) scale(0.5); opacity: 0; }
  40% { opacity: 1; }
  100% { transform: translate3d(120%, -50%, 0) scale(1.2); opacity: 0; }
}

@keyframes kmFistRight {
  0% { transform: translate3d(0, -50%, 0) scale(0.5); opacity: 0; }
  40% { opacity: 1; }
  100% { transform: translate3d(-120%, -50%, 0) scale(1.2); opacity: 0; }
}

/* 入场爆发 - 中心橙色冲击爆发 */
.km-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 107, 53, 0.6) 20%,
    rgba(255, 51, 51, 0.3) 50%,
    transparent 80%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: kmBurst 0.5s ease-out 0.3s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes kmBurst {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  30% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2.2); opacity: 0; }
}

/* ---------- 持续循环动画 ---------- */

/* 四色能量环 - 四段弧持续旋转 */
.km-energy-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 85%;
  height: 85%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: kmRingIn 0.4s ease-out 0.3s forwards,
             kmRingSpin 3s linear 0.7s infinite;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes kmRingIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes kmRingSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); }
}

/* 四段弧 - 攻击红/命中蓝/速度金/力量橙 */
.km-ring-segment {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid transparent;
}

.km-ring-segment.seg-attack {
  border-top-color: rgba(255, 51, 51, 0.85);
  border-right-color: rgba(255, 51, 51, 0.3);
  box-shadow: 0 0 8px rgba(255, 51, 51, 0.5);
}

.km-ring-segment.seg-precision {
  border-right-color: rgba(0, 191, 255, 0.85);
  border-bottom-color: rgba(0, 191, 255, 0.3);
  box-shadow: 0 0 8px rgba(0, 191, 255, 0.5);
}

.km-ring-segment.seg-speed {
  border-bottom-color: rgba(255, 215, 0, 0.85);
  border-left-color: rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

.km-ring-segment.seg-power {
  border-left-color: rgba(255, 107, 53, 0.85);
  border-top-color: rgba(255, 107, 53, 0.3);
  box-shadow: 0 0 8px rgba(255, 107, 53, 0.5);
}

/* 速度金线螺旋 - 攻击速度象征，金色螺旋线持续旋转 */
.km-speed-spiral {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70%;
  height: 70%;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: rgba(255, 215, 0, 0.7);
  border-right-color: rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: kmSpiralIn 0.3s ease-out 0.4s forwards,
             kmSpiralSpin 2s linear 0.7s infinite;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes kmSpiralIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes kmSpiralSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); }
}

/* 中央拳意核心 - 发光的拳劲之球，持续脉冲 */
.km-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22%;
  height: 22%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: kmCoreIn 0.3s ease-out 0.5s forwards,
             kmCorePulse 1.5s ease-in-out 0.8s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

.km-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 215, 0, 0.9) 25%,
    rgba(255, 107, 53, 0.7) 60%,
    rgba(180, 60, 0, 0.3) 100%
  );
  box-shadow:
    0 0 12px rgba(255, 107, 53, 0.8),
    0 0 24px rgba(255, 107, 53, 0.4);
}

@keyframes kmCoreIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes kmCorePulse {
  0%, 100% { transform: translate3d(-50%, -50%, 0) scale(1); }
  50% { transform: translate3d(-50%, -50%, 0) scale(1.15); }
}

/* 拳劲碎片环绕 - 4块碎片沿轨道持续旋转 */
.km-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: kmOrbitIn 0.3s ease-out 0.6s forwards,
             kmOrbitSpin 4s linear 0.9s infinite;
  will-change: transform, opacity;
  z-index: 6;
}

@keyframes kmOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes kmOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); }
}

/* 环绕碎片 - 四种颜色对应四项增益 */
.km-orbit-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 40% 60% 50% 40% / 55% 40% 60% 45%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    var(--km-orbit-color, #FF6B35) 50%,
    rgba(180, 60, 0, 0.3) 100%
  );
  box-shadow: 0 0 6px var(--km-orbit-color, #FF6B35);
  transform: translate3d(-50%, -50%, 0) rotate(var(--km-orbit-angle, 0deg)) translateY(-48%);
}

/* 拳意光晕 - 外层柔和发光氛围 */
.km-aura {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 50%,
    rgba(255, 107, 53, 0.08) 65%,
    rgba(255, 215, 0, 0.05) 80%,
    transparent 100%
  );
  opacity: 0;
  animation: kmAuraIn 0.5s ease-out 0.5s forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes kmAuraIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .km-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
