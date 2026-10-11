<!--
  @file TrinityForceEffect.vue
  @generated 2026-07-05
  @description 三相之力 - 三元素对角三角形连线旋转
  暗杀者BUFF技能（Trinity Force）：三相之力附体，使玩家获得命中率、攻击速度、吸血等效果
  三个元素三角形（金/青/赤）以120°对角排列，通过能量线连接形成三角阵，在施法者头像背后持续旋转
  GPU加速：所有动画仅使用 translate3d + rotate + opacity，避免重排，保证丝滑流畅
  动画特性：持久化循环动画，BUFF存活期间持续播放，BUFF到期后由父组件移除
  色彩方案：力量金(#FFD700) + 命中青(#00CED1) + 吸血赤(#DC143C) + 三相白(#FFFFFF)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确环绕施法者头像边框
  层级：z-index: 50，与其它BUFF特效同级，三角形从头像边缘伸出，视觉上环绕头像背后旋转
-->
<template>
  <!-- 三相舞台 - 定位容器，通过 JS 动态定位到玩家头像背后 -->
  <div ref="stageRef" class="tf-stage" :style="stageStyle">
    <!-- 三角阵 - 三个元素三角形 + 连接线，整体持续旋转 -->
    <div class="tf-formation">
      <!-- 三条连接线 - 能量线连接三个三角形 -->
      <div class="tf-line line-1"></div>
      <div class="tf-line line-2"></div>
      <div class="tf-line line-3"></div>

      <!-- 线上流动光点 - 能量沿连接线流动 -->
      <div class="tf-flow flow-1"></div>
      <div class="tf-flow flow-2"></div>
      <div class="tf-flow flow-3"></div>

      <!-- 金色三角形 - 力量（顶部） -->
      <div class="tf-tri tri-gold">
        <div class="tf-tri-glow"></div>
        <div class="tf-tri-shape"></div>
        <div class="tf-tri-core"></div>
      </div>

      <!-- 青色三角形 - 命中（左下） -->
      <div class="tf-tri tri-cyan">
        <div class="tf-tri-glow"></div>
        <div class="tf-tri-shape"></div>
        <div class="tf-tri-core"></div>
      </div>

      <!-- 赤色三角形 - 吸血（右下） -->
      <div class="tf-tri tri-crimson">
        <div class="tf-tri-glow"></div>
        <div class="tf-tri-shape"></div>
        <div class="tf-tri-core"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 三相之力 - 三元素对角三角形连线旋转
 * 暗杀者BUFF技能（Trinity Force）特效组件
 * 三相之力附体，使玩家获得命中率、攻击速度、吸血等效果
 * 三个元素三角形（金/青/赤）以120°对角排列，通过能量线连接形成三角阵
 * 在施法者头像背后持续旋转，BUFF到期后由父组件移除
 * 色彩方案：力量金(#FFD700) + 命中青(#00CED1) + 吸血赤(#DC143C) + 三相白(#FFFFFF)
 * 定位：通过 JS 动态查找 #playerAvatar 元素，精确环绕施法者头像边框
 * 层级：z-index: 50，与其它BUFF特效同级，三角形从头像边缘伸出，视觉上环绕头像背后旋转
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

/** 舞台 DOM 引用 */
const stageRef = ref(null)

/** 头像区域位置信息（相对定位父容器） */
const avatarRect = ref({ left: 0, top: 0, width: 100, height: 100 })

/** 窗口 resize 回调引用 */
let resizeHandler = null

/**
 * 计算三相舞台的动态样式
 * 根据 #playerAvatar 的实际位置和尺寸，精确定位到头像背后
 * 舞台略大于头像（各方向延伸 12px），确保三角形从头像边缘伸出
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
      console.warn('[TrinityForceEffect] 未找到玩家头像元素 #playerAvatar')
      return
    }

    const positioningParent = stage.offsetParent
    if (!positioningParent) {
      console.warn('[TrinityForceEffect] 未找到定位父容器')
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
    console.warn('[TrinityForceEffect] 更新头像位置失败:', e)
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
   三相之力 (trinity_force) - 三元素对角三角形连线旋转
   技能描述：三相之力附体，使玩家获得命中率、攻击速度、吸血等效果
   三个元素三角形以120°对角排列，通过能量线连接，在头像背后旋转
   色彩方案：力量金(#FFD700) + 命中青(#00CED1) + 吸血赤(#DC143C)
   GPU加速：全程仅使用 transform + opacity，保证60fps
   几何参数：R=56px（三角形中心到头像中心的距离）
     顶点1（金/力量）: (0, -56)
     顶点2（青/命中）: (-48.5, 28)
     顶点3（赤/吸血）: (48.5, 28)
   ================================================================ */

/* 三相舞台 - 绝对定位容器，z-index: 50 与其它BUFF特效同级
   三角形位于 R=56px（超出头像 50px 半径），从头像边缘伸出 */
.tf-stage {
  position: absolute;
  pointer-events: none;
  z-index: 50;
  contain: layout style;
  opacity: 0;
  animation: tfStageAppear 0.5s ease-out 0.1s forwards;
  will-change: opacity;
}

@keyframes tfStageAppear {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* 三角阵 - 居中容器，整体持续顺时针旋转 */
.tf-formation {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: translate3d(-50%, -50%, 0) rotate(0deg);
  animation: tfFormationSpin 8s linear infinite;
  will-change: transform;
}

@keyframes tfFormationSpin {
  0% { transform: translate3d(-50%, -50%, 0) rotate(0deg); }
  100% { transform: translate3d(-50%, -50%, 0) rotate(360deg); }
}

/* ================================================================
   连接线 - 三条能量线连接三个三角形
   transform-origin: left center，从起点旋转延伸到终点
   margin-top: -1px 确保 2px 高的线垂直居中于连接点
   ================================================================ */

.tf-line {
  position: absolute;
  top: 50%;
  left: 50%;
  height: 2px;
  margin-top: -1px;
  border-radius: 1px;
  transform-origin: left center;
  will-change: transform, opacity;
  opacity: 0;
  animation: tfLineAppear 0.4s ease-out 0.3s forwards;
}

@keyframes tfLineAppear {
  0% { opacity: 0; }
  100% { opacity: 0.7; }
}

/*
 * 线1: 金→青 (顶点1→顶点2)
 * 起点(0,-56) 终点(-48.5,28)
 * 长度=√(48.5²+84²)≈97, 角度=atan2(84,-48.5)≈120°
 */
.tf-line.line-1 {
  width: 97px;
  transform: translate3d(0px, -56px, 0) rotate(120deg);
  background: linear-gradient(
    90deg,
    rgba(255, 215, 0, 0.8) 0%,
    rgba(255, 215, 0, 0.4) 30%,
    rgba(0, 206, 209, 0.4) 70%,
    rgba(0, 206, 209, 0.8) 100%
  );
  box-shadow: 0 0 4px rgba(255, 215, 0, 0.4), 0 0 4px rgba(0, 206, 209, 0.4);
}

/*
 * 线2: 青→赤 (顶点2→顶点3)
 * 起点(-48.5,28) 终点(48.5,28)
 * 长度=97, 角度=0°
 */
.tf-line.line-2 {
  width: 97px;
  transform: translate3d(-48.5px, 28px, 0) rotate(0deg);
  background: linear-gradient(
    90deg,
    rgba(0, 206, 209, 0.8) 0%,
    rgba(0, 206, 209, 0.4) 30%,
    rgba(220, 20, 60, 0.4) 70%,
    rgba(220, 20, 60, 0.8) 100%
  );
  box-shadow: 0 0 4px rgba(0, 206, 209, 0.4), 0 0 4px rgba(220, 20, 60, 0.4);
}

/*
 * 线3: 赤→金 (顶点3→顶点1)
 * 起点(48.5,28) 终点(0,-56)
 * 长度=97, 角度=atan2(-84,-48.5)≈-120°
 */
.tf-line.line-3 {
  width: 97px;
  transform: translate3d(48.5px, 28px, 0) rotate(-120deg);
  background: linear-gradient(
    90deg,
    rgba(220, 20, 60, 0.8) 0%,
    rgba(220, 20, 60, 0.4) 30%,
    rgba(255, 215, 0, 0.4) 70%,
    rgba(255, 215, 0, 0.8) 100%
  );
  box-shadow: 0 0 4px rgba(220, 20, 60, 0.4), 0 0 4px rgba(255, 215, 0, 0.4);
}

/* ================================================================
   线上流动光点 - 能量沿连接线从起点流向终点
   margin: -3px 0 0 -3px 将6px光点中心对齐到坐标点
   ================================================================ */

.tf-flow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 50%;
  opacity: 0;
  will-change: transform, opacity;
}

/* 流动光点1: 金→青 (顶点1→顶点2) */
.tf-flow.flow-1 {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 215, 0, 0.6) 50%, transparent 100%);
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
  animation: tfFlow1 2.5s ease-in-out 0.5s infinite;
}

/* 流动光点2: 青→赤 (顶点2→顶点3) */
.tf-flow.flow-2 {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(0, 206, 209, 0.6) 50%, transparent 100%);
  box-shadow: 0 0 6px rgba(0, 206, 209, 0.6);
  animation: tfFlow2 2.5s ease-in-out 1.3s infinite;
}

/* 流动光点3: 赤→金 (顶点3→顶点1) */
.tf-flow.flow-3 {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(220, 20, 60, 0.6) 50%, transparent 100%);
  box-shadow: 0 0 6px rgba(220, 20, 60, 0.6);
  animation: tfFlow3 2.5s ease-in-out 2.1s infinite;
}

/* 流动动画：从起点角移动到终点角 */
@keyframes tfFlow1 {
  0% { opacity: 0; transform: translate3d(0px, -56px, 0); }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(-48.5px, 28px, 0); }
}

@keyframes tfFlow2 {
  0% { opacity: 0; transform: translate3d(-48.5px, 28px, 0); }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(48.5px, 28px, 0); }
}

@keyframes tfFlow3 {
  0% { opacity: 0; transform: translate3d(48.5px, 28px, 0); }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(0px, -56px, 0); }
}

/* ================================================================
   三角形元素 - 三个等边三角形以120°对角排列
   每个三角形由三层组成：光晕 + 形状 + 核心
   margin: -11px 0 0 -11px 将22px三角形中心对齐到坐标点
   ================================================================ */

.tf-tri {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22px;
  height: 22px;
  margin: -11px 0 0 -11px;
  will-change: transform, opacity;
  opacity: 0;
  animation: tfTriAppear 0.5s ease-out 0.2s forwards;
}

@keyframes tfTriAppear {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* 金色三角形 - 力量（顶部，0°方向） */
.tri-gold {
  transform: translate3d(0px, -56px, 0);
}

/* 青色三角形 - 命中（左下，120°方向） */
.tri-cyan {
  transform: translate3d(-48.5px, 28px, 0);
}

/* 赤色三角形 - 吸血（右下，240°方向） */
.tri-crimson {
  transform: translate3d(48.5px, 28px, 0);
}

/* 三角形光晕 - 外层发光 */
.tf-tri-glow {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  filter: blur(6px);
  animation: tfTriGlowPulse 1.5s ease-in-out infinite alternate;
  will-change: opacity;
}

@keyframes tfTriGlowPulse {
  0% { opacity: 0.5; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1.1); }
}

/* 金色光晕 */
.tri-gold .tf-tri-glow {
  background: radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, transparent 70%);
}

/* 青色光晕 */
.tri-cyan .tf-tri-glow {
  background: radial-gradient(circle, rgba(0, 206, 209, 0.6) 0%, transparent 70%);
}

/* 赤色光晕 */
.tri-crimson .tf-tri-glow {
  background: radial-gradient(circle, rgba(220, 20, 60, 0.6) 0%, transparent 70%);
}

/* 三角形形状 - 使用clip-path绘制等边三角形 */
.tf-tri-shape {
  position: absolute;
  inset: 0;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  animation: tfTriShapePulse 2s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes tfTriShapePulse {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

/* 金色三角形 - 力量 */
.tri-gold .tf-tri-shape {
  background: linear-gradient(
    135deg,
    rgba(255, 215, 0, 0.95) 0%,
    rgba(255, 165, 0, 0.8) 50%,
    rgba(255, 140, 0, 0.6) 100%
  );
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

/* 青色三角形 - 命中 */
.tri-cyan .tf-tri-shape {
  background: linear-gradient(
    135deg,
    rgba(0, 206, 209, 0.95) 0%,
    rgba(0, 180, 200, 0.8) 50%,
    rgba(0, 150, 180, 0.6) 100%
  );
  box-shadow: 0 0 8px rgba(0, 206, 209, 0.5);
}

/* 赤色三角形 - 吸血 */
.tri-crimson .tf-tri-shape {
  background: linear-gradient(
    135deg,
    rgba(220, 20, 60, 0.95) 0%,
    rgba(200, 20, 50, 0.8) 50%,
    rgba(180, 10, 40, 0.6) 100%
  );
  box-shadow: 0 0 8px rgba(220, 20, 60, 0.5);
}

/* 三角形核心 - 中心高亮点 */
.tf-tri-core {
  position: absolute;
  top: 60%;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, transparent 70%);
  animation: tfTriCorePulse 1.2s ease-in-out infinite alternate;
  will-change: opacity;
}

@keyframes tfTriCorePulse {
  0% { opacity: 0.5; transform: translate3d(-50%, -50%, 0) scale(0.8); }
  100% { opacity: 1; transform: translate3d(-50%, -50%, 0) scale(1.3); }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .tf-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
