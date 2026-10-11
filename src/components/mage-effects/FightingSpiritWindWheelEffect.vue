<!--
  @file FightingSpiritWindWheelEffect.vue
  @generated 2026-07-05
  @description 斗志风轮 - 涡轮风刃环旋转 + 斗志核心
  暗杀者BUFF技能（斗志风轮）：暂时提高飞轮的暴击率和格挡穿透率
  使用 conic-gradient 构造四叶涡轮风刃环，旋转时产生风刃扫过的视觉残影
  中心为斗志能量核心，外圈为定子边框，整体形似高速旋转的涡轮引擎
  GPU加速：所有动画仅使用 transform + opacity，避免重排，保证丝滑流畅
  动画特性：持久化循环动画，BUFF存活期间持续播放，BUFF到期后由父组件移除
  色彩方案：斗志橙(#FF6B00) + 余烬金(#FFA500) + 核心白(#FFFFFF)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确环绕施法者头像范围
  层级：z-index: 50，与其它BUFF特效同级
  与三相之力的区别：三相之力为离散三角形+连接线阵列旋转，斗志风轮为连续环形涡轮风刃整体旋转
-->
<template>
  <!-- 风轮舞台 - 定位容器，通过 JS 动态定位到玩家头像范围 -->
  <div ref="stageRef" class="fsww-stage" :style="stageStyle">
    <!-- 定子外框 - 静态薄环，界定风轮边界 -->
    <div class="fsww-frame"></div>
    <!-- 涡轮风刃环 - conic-gradient 四叶风刃，旋转产生扫视残影 -->
    <div class="fsww-turbine"></div>
    <!-- 斗志核心 - 中心能量光点 -->
    <div class="fsww-core"></div>
  </div>
</template>

<script setup>
/**
 * 斗志风轮 - 涡轮风刃环旋转 + 斗志核心
 * 暗杀者BUFF技能（斗志风轮）特效组件
 * 暂时提高飞轮的暴击率和格挡穿透率
 * 使用 conic-gradient 构造四叶涡轮风刃环，旋转时产生风刃扫过的视觉残影
 * 中心为斗志能量核心，外圈为定子边框，整体形似高速旋转的涡轮引擎
 * 色彩方案：斗志橙(#FF6B00) + 余烬金(#FFA500) + 核心白(#FFFFFF)
 * 定位：通过 JS 动态查找 #playerAvatar 元素，精确环绕施法者头像范围
 * 层级：z-index: 50，与其它BUFF特效同级
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

/** 舞台 DOM 引用 */
const stageRef = ref(null)

/** 头像区域位置信息（相对定位父容器） */
const avatarRect = ref({ left: 0, top: 0, width: 100, height: 100 })

/** 窗口 resize 回调引用 */
let resizeHandler = null

/**
 * 计算风轮舞台的动态样式
 * 根据 #playerAvatar 的实际位置和尺寸，精确定位到头像范围
 * 舞台略大于头像（各方向延伸 18px），确保风轮环超出头像边缘
 * @returns {Object} CSS 样式对象
 */
const stageStyle = computed(() => {
  const expand = 18
  const w = avatarRect.value.width + expand * 2
  const h = avatarRect.value.height + expand * 2
  return {
    left: `${avatarRect.value.left - expand}px`,
    top: `${avatarRect.value.top - expand}px`,
    width: `${w}px`,
    height: `${h}px`
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
      console.warn('[FightingSpiritWindWheelEffect] 未找到玩家头像元素 #playerAvatar')
      return
    }

    const positioningParent = stage.offsetParent
    if (!positioningParent) {
      console.warn('[FightingSpiritWindWheelEffect] 未找到定位父容器')
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
    console.warn('[FightingSpiritWindWheelEffect] 更新头像位置失败:', e)
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
   斗志风轮 (fighting_spirit_wind_wheel) - 涡轮风刃环旋转
   技能描述：暂时提高飞轮的暴击率和格挡穿透率
   使用 conic-gradient 构造四叶涡轮风刃环，旋转产生扫视残影
   色彩方案：风刃青(#4FC3F7) + 冰晶银(#B3E5FC) + 核心白(#FFFFFF)
   GPU加速：全程仅使用 transform + opacity，保证60fps
   与三相之力区别：三相之力=离散三角形阵列，斗志风轮=连续环形涡轮
   ================================================================ */

/* 风轮舞台 - 绝对定位容器，z-index: 50 与其它BUFF特效同级 */
.fsww-stage {
  position: absolute;
  pointer-events: none;
  z-index: 50;
  contain: layout style;
  opacity: 0;
  animation: fswwStageAppear 0.5s ease-out 0.1s forwards;
  will-change: opacity;
}

@keyframes fswwStageAppear {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* ================================================================
   定子外框 - 静态薄环，界定风轮边界
   不旋转，仅做呼吸式发光，模拟引擎定子
   ================================================================ */

.fsww-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  margin: -60px 0 0 -60px;
  border-radius: 50%;
  border: 1.5px solid rgba(79, 195, 247, 0.18);
  box-shadow:
    0 0 6px rgba(79, 195, 247, 0.1),
    inset 0 0 4px rgba(79, 195, 247, 0.06);
  will-change: opacity;
  animation: fswwFrameBreath 2s ease-in-out infinite;
}

@keyframes fswwFrameBreath {
  0%, 100% { opacity: 0.35; border-color: rgba(79, 195, 247, 0.15); }
  50% { opacity: 0.55; border-color: rgba(179, 229, 252, 0.28); }
}

/* ================================================================
   涡轮风刃环 - conic-gradient 四叶风刃
   四个扇区各 90°，每叶从实心橙渐变到透明，间隙产生风刃轮廓
   使用 radial-gradient mask 裁切为环形（内 40% 透明，外 100% 实心）
   旋转 2.5s 一圈，快速旋转产生风刃扫过的视觉残影
   ================================================================ */

.fsww-turbine {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  margin: -60px 0 0 -60px;
  border-radius: 50%;
  /* 四叶涡轮风刃：每叶 0°→75° 从银青渐变到透明，75°→90° 为间隙 */
  background: conic-gradient(
    from 0deg,
    rgba(79, 195, 247, 0.45) 0deg,
    rgba(179, 229, 252, 0.32) 20deg,
    rgba(225, 245, 254, 0.15) 50deg,
    transparent 75deg,
    transparent 90deg,
    rgba(79, 195, 247, 0.45) 90deg,
    rgba(179, 229, 252, 0.32) 110deg,
    rgba(225, 245, 254, 0.15) 140deg,
    transparent 165deg,
    transparent 180deg,
    rgba(79, 195, 247, 0.45) 180deg,
    rgba(179, 229, 252, 0.32) 200deg,
    rgba(225, 245, 254, 0.15) 230deg,
    transparent 255deg,
    transparent 270deg,
    rgba(79, 195, 247, 0.45) 270deg,
    rgba(179, 229, 252, 0.32) 290deg,
    rgba(225, 245, 254, 0.15) 320deg,
    transparent 345deg,
    transparent 360deg
  );
  /* 裁切为环形：内半径 42% 透明，外半径 100% 可见 */
  -webkit-mask: radial-gradient(circle, transparent 42%, black 44%, black 100%);
  mask: radial-gradient(circle, transparent 42%, black 44%, black 100%);
  transform: rotate(0deg);
  animation: fswwTurbineSpin 6s linear infinite;
  will-change: transform;
}

@keyframes fswwTurbineSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
}

/* ================================================================
   斗志核心 - 中心能量光点
   白色高光 + 橙色光晕，持续脉冲
   ================================================================ */

.fsww-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  margin: -7px 0 0 -7px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.7) 0%,
    rgba(79, 195, 247, 0.45) 50%,
    transparent 100%
  );
  box-shadow: 0 0 8px rgba(79, 195, 247, 0.35);
  will-change: opacity, transform;
  animation: fswwCorePulse 1.5s ease-in-out infinite;
}

@keyframes fswwCorePulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.75; transform: scale(1.15); }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .fsww-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
