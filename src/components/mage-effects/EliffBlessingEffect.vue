<!--
  @file EliffBlessingEffect.vue
  @generated 2026-07-07
  @description 艾梨芙的祝福 - 游侠祝福光环特效（羽毛·箭矢主题）
  游侠Y技能（ranger_y）：传承于游侠大师艾梨芙的祝福之力，获得强壮体魄与致命伤害
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画特性：持久化循环动画，BUFF存活期间持续播放，BUFF到期后由父组件移除
    ⓪ 祝福降临（0s ~ 0.6s）- 箭矢光束从天而降 → 羽毛四散飞舞 → 光芒绽放
    ① 祝福激活（0.4s ~ 1.2s）- 游侠光环展开 → 双层符文圆环显现 → 箭矢轨道环形成 → 中央祝福核心点亮
    ② 持续运转（1.2s ~ 持续）- 羽毛持续飘落 → 箭矢环绕旋转 → 祝福波纹脉冲扩散 → 符文双向旋转 → 偶发祝福闪烁
  色彩方案：游侠翠(#228B22) + 生命红(#DC143C) + 致命金(#FFD700) + 祝福白(#F0FFF0)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确环绕施法者头像边框
-->
<template>
  <!-- 祝福舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="eb-stage" :style="stageStyle">
    <!-- ===== 阶段⓪：祝福降临 ===== -->
    <!-- 天降箭矢光束 - 从顶部降下的翠绿祝福箭矢光束 -->
    <div class="eb-arrow-beam">
      <div class="eb-arrow-beam-head"></div>
      <div class="eb-arrow-beam-fletch"></div>
    </div>

    <!-- 羽毛散落 - 光柱触地时四散的祝福羽毛 -->
    <div
      v-for="i in 10"
      :key="'eb-feather-scatter-' + i"
      class="eb-feather-scatter"
      :style="getFeatherScatterStyle(i)"
    ></div>

    <!-- 祝福绽放 - 箭矢落地的径向爆发 -->
    <div class="eb-bloom"></div>

    <!-- ===== 阶段①：祝福激活 ===== -->
    <!-- 游侠光环外层 - 整体发光氛围 -->
    <div class="eb-aura"></div>

    <!-- 游侠光环主体 - 翠金双色光环边框 -->
    <div class="eb-halo">
      <!-- 光环能量场 - 半透明祝福能量填充 -->
      <div class="eb-halo-field"></div>

      <!-- 光环边框 - 发光的圆环 -->
      <div class="eb-halo-border"></div>

      <!-- 祝福波纹 - 从中心向外扩散的光环 -->
      <div class="eb-wave wave-1"></div>
      <div class="eb-wave wave-2"></div>
      <div class="eb-wave wave-3"></div>

      <!-- 表面祝福扫过 - 偶发的祝福光芒扫过 -->
      <div class="eb-sheen"></div>
    </div>

    <!-- 外层符文圆环 - 顺时针旋转，代表生命值加成 -->
    <div class="eb-rune-ring rune-outer"></div>
    <!-- 内层符文圆环 - 逆时针旋转，代表暴击伤害加成 -->
    <div class="eb-rune-ring rune-inner"></div>

    <!-- 箭矢轨道环 - 4支箭矢沿光环边缘持续旋转，代表致命伤害 -->
    <div class="eb-arrow-orbit">
      <div
        v-for="i in 4"
        :key="'eb-orbit-arrow-' + i"
        class="eb-orbit-arrow"
        :style="getArrowOrbitStyle(i)"
      ></div>
    </div>

    <!-- 中央祝福核心 - 发光的祝福之球 -->
    <div class="eb-core">
      <div class="eb-core-inner"></div>
    </div>

    <!-- ===== 阶段②：持续运转 ===== -->
    <!-- 飘落羽毛 - 6片羽毛持续从上方飘落，环绕施法者 -->
    <div
      v-for="i in 6"
      :key="'eb-feather-fall-' + i"
      class="eb-feather-fall"
      :style="getFeatherFallStyle(i)"
    ></div>

    <!-- 偶发祝福闪烁 - 暗示祝福正在增强力量 -->
    <div class="eb-sparkle sparkle-1"></div>
    <div class="eb-sparkle sparkle-2"></div>

    <!-- 持续光柱呼吸 - 激活后持续存在的微弱光柱 -->
    <div class="eb-beam-persistent"></div>
  </div>
</template>

<script setup>
/**
 * 艾梨芙的祝福 - 游侠祝福光环特效（羽毛·箭矢主题）
 * 游侠Y技能（ranger_y）特效组件
 * 传承于游侠大师艾梨芙的祝福之力，施法后获得强壮的体魄与致命的伤害
 * 持久化循环动画，BUFF存活期间持续播放
 * 色彩方案：游侠翠(#228B22) + 生命红(#DC143C) + 致命金(#FFD700) + 祝福白(#F0FFF0)
 * 定位：通过 JS 动态查找 #playerAvatar 元素，精确环绕施法者头像边框
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

/** 舞台 DOM 引用 */
const stageRef = ref(null)

/** 头像区域位置信息（相对定位父容器） */
const avatarRect = ref({ left: 0, top: 0, width: 100, height: 100 })

/** 窗口 resize 回调引用 */
let resizeHandler = null

/**
 * 计算祝福舞台的动态样式
 * 根据 #playerAvatar 的实际位置和尺寸，精确定位光环环绕头像区域
 * 光环略大于头像（各方向延伸 8px），确保完全环绕头像边框
 * @returns {Object} CSS 样式对象
 */
const stageStyle = computed(() => {
  const expand = 8
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
      console.warn('[EliffBlessingEffect] 未找到玩家头像元素 #playerAvatar')
      return
    }

    // 查找定位父容器（.player-card-area）
    const positioningParent = stage.offsetParent
    if (!positioningParent) {
      console.warn('[EliffBlessingEffect] 未找到定位父容器')
      return
    }

    // 遍历 offsetParent 链，计算 avatar 相对于定位父容器的偏移
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
    console.warn('[EliffBlessingEffect] 更新头像位置失败:', e)
  }
}

/** 羽毛颜色表 - 翠绿/金色/红色/白色，对应体魄与致命伤害的双重祝福 */
const FEATHER_COLORS = [
  { color: 'rgba(34, 139, 34, 0.95)', glow: 'rgba(34, 139, 34, 0.7)', light: 'rgba(144, 238, 144, 0.9)' },
  { color: 'rgba(255, 215, 0, 0.95)', glow: 'rgba(255, 215, 0, 0.7)', light: 'rgba(255, 255, 180, 0.9)' },
  { color: 'rgba(220, 20, 60, 0.9)', glow: 'rgba(220, 20, 60, 0.6)', light: 'rgba(255, 182, 193, 0.9)' },
  { color: 'rgba(240, 255, 240, 0.95)', glow: 'rgba(34, 139, 34, 0.7)', light: 'rgba(255, 255, 255, 0.95)' }
]

/** 箭矢颜色表 - 翠绿/金色/红色/白色 */
const ARROW_COLORS = [
  { shaft: 'rgba(34, 139, 34, 0.9)', head: 'rgba(144, 238, 144, 0.95)', fletch: 'rgba(34, 139, 34, 0.7)' },
  { shaft: 'rgba(255, 215, 0, 0.9)', head: 'rgba(255, 255, 180, 0.95)', fletch: 'rgba(255, 215, 0, 0.7)' },
  { shaft: 'rgba(220, 20, 60, 0.85)', head: 'rgba(255, 182, 193, 0.95)', fletch: 'rgba(220, 20, 60, 0.6)' },
  { shaft: 'rgba(240, 255, 240, 0.9)', head: 'rgba(255, 255, 255, 0.95)', fletch: 'rgba(34, 139, 34, 0.6)' }
]

/**
 * 计算散落羽毛的样式
 * 每片羽毛从箭矢落点向不同方向飞散，模拟祝福降临时羽毛飞溅的效果
 * 颜色交替使用翠绿、金色、红色，对应体魄与致命伤害的双重祝福
 * @param {number} index - 羽毛索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getFeatherScatterStyle (index) {
  const angle = (index - 1) * 36
  const distance = 40 + (index % 4) * 10
  const delay = (index % 5) * 0.03
  const c = FEATHER_COLORS[index % 4]
  return {
    '--eb-feather-angle': `${angle}deg`,
    '--eb-feather-dist': `${distance}px`,
    '--eb-feather-color': c.color,
    '--eb-feather-glow': c.glow,
    '--eb-feather-light': c.light,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算环绕箭矢的样式
 * 4支箭矢沿光环边缘旋转，对应致命伤害的持续加持效果
 * 颜色交替使用翠绿、金色、红色、白色
 * @param {number} index - 箭矢索引（1~4）
 * @returns {Object} CSS自定义属性对象
 */
function getArrowOrbitStyle (index) {
  const angle = (index - 1) * 90
  const c = ARROW_COLORS[(index - 1) % 4]
  return {
    '--eb-arrow-angle': `${angle}deg`,
    '--eb-arrow-shaft': c.shaft,
    '--eb-arrow-head': c.head,
    '--eb-arrow-fletch': c.fletch
  }
}

/**
 * 计算飘落羽毛的样式
 * 6片羽毛从舞台上方持续飘落，每片有不同的水平位置、延迟和旋转方向
 * 模拟祝福光环中羽毛持续飘舞的氛围效果
 * @param {number} index - 羽毛索引（1~6）
 * @returns {Object} CSS自定义属性对象
 */
function getFeatherFallStyle (index) {
  const leftPos = 10 + (index - 1) * 15 + (index % 2) * 5
  const duration = 4 + (index % 3) * 1.5
  const delay = 1.5 + (index % 3) * 1.2
  const rotateDir = index % 2 === 0 ? 1 : -1
  const swayAmount = 15 + (index % 3) * 8
  const c = FEATHER_COLORS[(index - 1) % 4]
  return {
    '--eb-fall-left': `${leftPos}%`,
    '--eb-fall-duration': `${duration}s`,
    '--eb-fall-rotate': `${rotateDir * 360}deg`,
    '--eb-fall-sway': `${swayAmount}px`,
    '--eb-fall-color': c.color,
    '--eb-fall-glow': c.glow,
    '--eb-fall-light': c.light,
    animationDelay: `${delay}s`
  }
}

onMounted(async () => {
  await nextTick()
  // 延迟一帧确保 DOM 布局完成
  requestAnimationFrame(() => {
    updateAvatarPosition()
  })

  // 监听窗口 resize，重新计算位置
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
   艾梨芙的祝福 (eliff_blessing) - 游侠祝福光环特效（羽毛·箭矢主题）
   技能描述：传承于游侠大师艾梨芙的祝福之力，施法后获得强壮的体魄与致命的伤害
   色彩方案：游侠翠(#228B22) + 生命红(#DC143C) + 致命金(#FFD700) + 祝福白(#F0FFF0)
   GPU加速：contain隔离 + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   定位：通过 JS 动态查找 #playerAvatar，精确环绕施法者头像边框
   ================================================================ */

/* 祝福舞台 - 定位容器，由 JS 动态设置 left/top/width/height 精确环绕头像 */
.eb-stage {
  position: absolute;
  contain: layout style;
  pointer-events: none;
  z-index: 50;
  animation: eb-stage-appear 0.6s ease-out forwards;
  will-change: opacity, transform;
}
@keyframes eb-stage-appear {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  60% {
    opacity: 1;
    transform: scale(1.08);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* ================================================================
   阶段⓪：祝福降临（0s ~ 0.6s）
   ================================================================ */

/* 天降箭矢光束 - 从顶部降下的翠绿祝福箭矢 */
.eb-arrow-beam {
  position: absolute;
  top: -30%;
  left: 50%;
  width: 4px;
  height: 65%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(34, 139, 34, 0.3) 15%,
    rgba(34, 139, 34, 0.7) 40%,
    rgba(240, 255, 240, 0.9) 70%,
    rgba(34, 139, 34, 0.6) 90%,
    transparent 100%
  );
  border-radius: 2px;
  filter: blur(1px);
  transform: translate3d(-50%, 0, 0) scaleY(0);
  animation: eb-arrow-beam-descend 0.6s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes eb-arrow-beam-descend {
  0% {
    transform: translate3d(-50%, -30%, 0) scaleY(0);
    opacity: 0;
  }
  40% {
    transform: translate3d(-50%, 0, 0) scaleY(0.6);
    opacity: 0.9;
  }
  70% {
    transform: translate3d(-50%, 0, 0) scaleY(1);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, 0, 0) scaleY(0.8);
    opacity: 0;
  }
}

/* 箭矢光束箭头 - 位于光束底部的翠绿箭头 */
.eb-arrow-beam-head {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 12px solid rgba(144, 238, 144, 0.95);
  filter: drop-shadow(0 0 4px rgba(34, 139, 34, 0.8));
}

/* 箭矢光束尾羽 - 位于光束顶部的羽毛尾翼 */
.eb-arrow-beam-fletch {
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 8px;
  background:
    linear-gradient(135deg, rgba(34, 139, 34, 0.6) 0%, transparent 50%),
    linear-gradient(225deg, rgba(34, 139, 34, 0.6) 0%, transparent 50%),
    linear-gradient(to bottom, rgba(144, 238, 144, 0.4) 0%, rgba(34, 139, 34, 0.2) 100%);
  filter: drop-shadow(0 -1px 3px rgba(34, 139, 34, 0.4));
  clip-path: polygon(0% 100%, 50% 0%, 100% 100%);
}

/* 羽毛散落 - 光柱触地时四散的祝福羽毛 */
.eb-feather-scatter {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 14px;
  /* 羽毛形状 - 两端尖锐中间圆润 */
  border-radius: 50% 50% 50% 50% / 70% 70% 30% 30%;
  background: linear-gradient(
    160deg,
    var(--eb-feather-light, rgba(144, 238, 144, 0.9)) 0%,
    var(--eb-feather-color, rgba(34, 139, 34, 0.95)) 50%,
    var(--eb-feather-glow, rgba(34, 139, 34, 0.7)) 100%
  );
  box-shadow: 0 0 4px var(--eb-feather-glow, rgba(34, 139, 34, 0.6));
  /* 羽毛中央羽轴 - 用伪元素绘制 */
  transform: translate3d(-50%, -50%, 0) rotate(var(--eb-feather-angle, 0deg)) translateX(0px) scale(0);
  animation: eb-feather-scatter-fly 0.7s ease-out 0.2s forwards;
  will-change: transform, opacity;
}
/* 羽毛中央羽轴线 */
.eb-feather-scatter::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 10%;
  width: 1px;
  height: 80%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0.2) 100%
  );
  transform: translateX(-50%);
}
@keyframes eb-feather-scatter-fly {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--eb-feather-angle, 0deg)) translateX(0px) scale(0) rotate(0deg);
    opacity: 0;
  }
  30% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--eb-feather-angle, 0deg)) translateX(0px) scale(1.3) rotate(45deg);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--eb-feather-angle, 0deg)) translateX(var(--eb-feather-dist, 40px)) scale(0.4) rotate(180deg);
    opacity: 0;
  }
}

/* 祝福绽放 - 箭矢落地的径向爆发闪光 */
.eb-bloom {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(240, 255, 240, 0.6) 20%,
    rgba(34, 139, 34, 0.35) 45%,
    rgba(255, 215, 0, 0.15) 70%,
    transparent 85%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: eb-bloom-burst 0.5s ease-out 0.3s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}
@keyframes eb-bloom-burst {
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

/* ================================================================
   阶段①：祝福激活（0.4s ~ 1.2s）
   ================================================================ */

/* 游侠光环外层 - 整体发光氛围 */
.eb-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 115%;
  height: 115%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(34, 139, 34, 0.18) 0%,
    rgba(255, 215, 0, 0.1) 30%,
    rgba(220, 20, 60, 0.06) 55%,
    rgba(34, 139, 34, 0.04) 75%,
    transparent 85%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: eb-aura-appear 0.5s ease-out 0.4s forwards, eb-aura-pulse 3s ease-in-out 1.2s infinite;
  will-change: transform, opacity;
  filter: blur(5px);
}
@keyframes eb-aura-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}
@keyframes eb-aura-pulse {
  0%, 100% {
    opacity: 0.4;
    transform: translate3d(-50%, -50%, 0) scale(1);
  }
  50% {
    opacity: 0.85;
    transform: translate3d(-50%, -50%, 0) scale(1.06);
  }
}

/* 游侠光环主体 - 翠金双色光环框架 */
.eb-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 88%;
  height: 88%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: eb-halo-appear 0.5s ease-out 0.4s forwards;
  will-change: transform, opacity;
}
@keyframes eb-halo-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0) rotate(-180deg);
    opacity: 0;
  }
  60% {
    transform: translate3d(-50%, -50%, 0) scale(1.1) rotate(10deg);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* 光环能量场 - 半透明祝福能量填充背景 */
.eb-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(34, 139, 34, 0.18) 0%,
    rgba(255, 215, 0, 0.1) 35%,
    rgba(220, 20, 60, 0.06) 65%,
    rgba(34, 139, 34, 0.04) 100%
  );
  animation: eb-field-pulse 2.5s ease-in-out infinite;
  will-change: opacity;
}
@keyframes eb-field-pulse {
  0%, 100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}

/* 光环边框 - 发光的翠金双色圆环 */
.eb-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(34, 139, 34, 0.5);
  background: conic-gradient(
    from 0deg,
    rgba(34, 139, 34, 0.5) 0deg,
    rgba(255, 215, 0, 0.35) 60deg,
    rgba(240, 255, 240, 0.5) 120deg,
    rgba(220, 20, 60, 0.35) 180deg,
    rgba(34, 139, 34, 0.5) 240deg,
    rgba(255, 215, 0, 0.35) 300deg,
    rgba(34, 139, 34, 0.5) 360deg
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
    0 0 10px rgba(34, 139, 34, 0.5),
    0 0 5px rgba(255, 215, 0, 0.3),
    inset 0 0 6px rgba(34, 139, 34, 0.2);
  animation: eb-border-glow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}
@keyframes eb-border-glow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 10px rgba(34, 139, 34, 0.5),
      0 0 5px rgba(255, 215, 0, 0.3),
      inset 0 0 6px rgba(34, 139, 34, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 16px rgba(34, 139, 34, 0.8),
      0 0 10px rgba(255, 215, 0, 0.5),
      0 0 5px rgba(240, 255, 240, 0.4),
      inset 0 0 8px rgba(34, 139, 34, 0.3);
  }
}

/* 祝福波纹 - 从中心向外扩散的圆形光环 */
.eb-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  border: 1.5px solid rgba(34, 139, 34, 0.6);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}
.eb-wave.wave-1 {
  animation: eb-wave-expand 2.5s ease-out 0.8s infinite;
}
.eb-wave.wave-2 {
  animation: eb-wave-expand 2.5s ease-out 1.6s infinite;
}
.eb-wave.wave-3 {
  animation: eb-wave-expand 2.5s ease-out 2.1s infinite;
}
@keyframes eb-wave-expand {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.3);
    opacity: 0;
    border-color: rgba(240, 255, 240, 0.8);
  }
  20% {
    opacity: 0.85;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(3);
    opacity: 0;
    border-color: rgba(34, 139, 34, 0.1);
  }
}

/* 表面祝福扫过 - 偶发的祝福光芒扫过光环表面 */
.eb-sheen {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    transparent 0%,
    transparent 35%,
    rgba(240, 255, 240, 0.2) 47%,
    rgba(255, 255, 255, 0.45) 50%,
    rgba(240, 255, 240, 0.2) 53%,
    transparent 65%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) rotate(0deg);
  opacity: 0;
  animation: eb-sheen-sweep 4s ease-in-out 1.5s infinite;
  will-change: transform, opacity;
}
@keyframes eb-sheen-sweep {
  0%, 60% {
    transform: translate3d(-50%, -50%, 0) rotate(0deg);
    opacity: 0;
  }
  70% {
    opacity: 0.5;
    transform: translate3d(-50%, -50%, 0) rotate(45deg);
  }
  85% {
    opacity: 0.8;
    transform: translate3d(-50%, -50%, 0) rotate(90deg);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(135deg);
    opacity: 0;
  }
}

/* ================================================================
   符文圆环 - 旋转的祝福符文（双层）
   ================================================================ */

.eb-rune-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
}

/* 外圈符文 - 顺时针旋转，代表生命值加成，翠绿为主 */
.rune-outer {
  width: 78%;
  height: 78%;
  border: 1px dashed rgba(34, 139, 34, 0.4);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(34, 139, 34, 0.18) 30deg,
    transparent 60deg,
    rgba(220, 20, 60, 0.14) 120deg,
    transparent 150deg,
    rgba(240, 255, 240, 0.16) 210deg,
    transparent 240deg,
    rgba(34, 139, 34, 0.18) 300deg,
    transparent 360deg
  );
  box-shadow: 0 0 6px rgba(34, 139, 34, 0.25);
  animation: eb-rune-outer-appear 0.4s ease-out 0.6s forwards, eb-rune-outer-spin 6s linear 1.2s infinite;
}
@keyframes eb-rune-outer-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.7;
  }
}
@keyframes eb-rune-outer-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); }
}

/* 内圈符文 - 逆时针旋转，代表暴击伤害加成，金色为主 */
.rune-inner {
  width: 58%;
  height: 58%;
  border: 1px solid rgba(255, 215, 0, 0.25);
  background: conic-gradient(
    from 180deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.16) 45deg,
    transparent 90deg,
    rgba(34, 139, 34, 0.14) 180deg,
    transparent 225deg,
    rgba(240, 255, 240, 0.15) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 5px rgba(255, 215, 0, 0.15);
  animation: eb-rune-inner-appear 0.4s ease-out 0.7s forwards, eb-rune-inner-spin 4.5s linear 1.3s infinite;
}
@keyframes eb-rune-inner-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.6;
  }
}
@keyframes eb-rune-inner-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); }
}

/* ================================================================
   箭矢轨道环 - 4支箭矢沿光环边缘持续旋转
   ================================================================ */

.eb-arrow-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: eb-arrow-orbit-in 0.4s ease-out 0.6s forwards,
             eb-arrow-orbit-spin 5s linear 1s infinite;
  will-change: transform, opacity;
}
@keyframes eb-arrow-orbit-in {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}
@keyframes eb-arrow-orbit-spin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); }
}

/* 环绕箭矢 - 四色箭矢沿轨道旋转，代表致命伤害的持续加持 */
.eb-orbit-arrow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 18px;
  /* 箭杆 - 渐变色 */
  background: linear-gradient(
    to bottom,
    var(--eb-arrow-fletch, rgba(34, 139, 34, 0.7)) 0%,
    var(--eb-arrow-shaft, rgba(34, 139, 34, 0.9)) 40%,
    var(--eb-arrow-shaft, rgba(34, 139, 34, 0.9)) 70%,
    var(--eb-arrow-head, rgba(144, 238, 144, 0.95)) 100%
  );
  border-radius: 1px;
  /* 箭矢朝外，位于轨道半径上 */
  transform: translate3d(-50%, -50%, 0) rotate(var(--eb-arrow-angle, 0deg)) translateY(-50%);
  box-shadow: 0 0 4px var(--eb-arrow-shaft, rgba(34, 139, 34, 0.6));
}

/* 箭头 - 位于箭杆底部（朝外方向），三角形 */
.eb-orbit-arrow::after {
  content: '';
  position: absolute;
  bottom: -7px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 8px solid var(--eb-arrow-head, rgba(144, 238, 144, 0.95));
  filter: drop-shadow(0 0 3px var(--eb-arrow-shaft, rgba(34, 139, 34, 0.7)));
}

/* 尾羽 - 位于箭杆顶部（朝内方向），羽毛分叉 */
.eb-orbit-arrow::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 6px;
  background:
    linear-gradient(135deg, var(--eb-arrow-fletch, rgba(34, 139, 34, 0.7)) 0%, transparent 50%),
    linear-gradient(225deg, var(--eb-arrow-fletch, rgba(34, 139, 34, 0.7)) 0%, transparent 50%),
    linear-gradient(to bottom, rgba(240, 255, 240, 0.3) 0%, var(--eb-arrow-fletch, rgba(34, 139, 34, 0.4)) 100%);
  filter: drop-shadow(0 -1px 2px var(--eb-arrow-fletch, rgba(34, 139, 34, 0.4)));
  clip-path: polygon(0% 100%, 50% 0%, 100% 100%);
}

/* ================================================================
   中央祝福核心 - 发光的祝福之球
   ================================================================ */

.eb-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: eb-core-appear 0.4s ease-out 0.8s forwards;
  will-change: transform, opacity;
}
@keyframes eb-core-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  60% {
    transform: translate3d(-50%, -50%, 0) scale(1.5);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}

/* 祝福核心内部 - 多色发光能量球 */
.eb-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(240, 255, 240, 0.95) 20%,
    rgba(34, 139, 34, 0.85) 50%,
    rgba(255, 215, 0, 0.5) 80%,
    rgba(220, 20, 60, 0.3) 100%
  );
  box-shadow:
    0 0 8px rgba(34, 139, 34, 0.9),
    0 0 16px rgba(34, 139, 34, 0.5),
    0 0 24px rgba(255, 215, 0, 0.3);
  animation: eb-core-pulse 1.8s ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes eb-core-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.4);
    opacity: 1;
  }
}

/* ================================================================
   阶段②：持续运转 - 飘落羽毛
   ================================================================ */

/* 飘落羽毛 - 从舞台上方持续飘落的祝福羽毛 */
.eb-feather-fall {
  position: absolute;
  top: -15%;
  left: var(--eb-fall-left, 50%);
  width: 7px;
  height: 12px;
  /* 羽毛形状 - 两端尖锐中间圆润 */
  border-radius: 50% 50% 50% 50% / 70% 70% 30% 30%;
  background: linear-gradient(
    160deg,
    var(--eb-fall-light, rgba(144, 238, 144, 0.9)) 0%,
    var(--eb-fall-color, rgba(34, 139, 34, 0.95)) 50%,
    var(--eb-fall-glow, rgba(34, 139, 34, 0.7)) 100%
  );
  box-shadow: 0 0 3px var(--eb-fall-glow, rgba(34, 139, 34, 0.6));
  opacity: 0;
  animation: eb-feather-fall-drift var(--eb-fall-duration, 5s) ease-in-out infinite;
  will-change: transform, opacity;
}
/* 飘落羽毛中央羽轴线 */
.eb-feather-fall::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 10%;
  width: 1px;
  height: 80%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0.2) 100%
  );
  transform: translateX(-50%);
}
@keyframes eb-feather-fall-drift {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.85;
  }
  50% {
    transform: translate3d(var(--eb-fall-sway, 15px), 60%, 0) rotate(calc(var(--eb-fall-rotate, 360deg) * 0.5));
    opacity: 0.85;
  }
  90% {
    opacity: 0.7;
  }
  100% {
    transform: translate3d(calc(var(--eb-fall-sway, 15px) * -1), 130%, 0) rotate(var(--eb-fall-rotate, 360deg));
    opacity: 0;
  }
}

/* ================================================================
   偶发祝福闪烁 - 暗示祝福正在持续增强力量
   ================================================================ */

.eb-sparkle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 88%;
  height: 88%;
  border-radius: 50%;
  border: 2px solid rgba(240, 255, 240, 0.6);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}
.sparkle-1 {
  animation: eb-sparkle-flash 5s ease-out 2.5s infinite;
}
.sparkle-2 {
  animation: eb-sparkle-flash 6s ease-out 4.5s infinite;
}
@keyframes eb-sparkle-flash {
  0%, 85% {
    transform: translate3d(-50%, -50%, 0) scale(0.8);
    opacity: 0;
    border-color: rgba(240, 255, 240, 0.6);
  }
  90% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.8;
    border-color: rgba(255, 255, 255, 0.95);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.6);
    opacity: 0;
    border-color: rgba(34, 139, 34, 0.2);
  }
}

/* ================================================================
   持续光柱 - 激活后持续存在的微弱祝福光柱
   ================================================================ */

.eb-beam-persistent {
  position: absolute;
  top: -15%;
  left: 50%;
  width: 8px;
  height: 55%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(34, 139, 34, 0.08) 20%,
    rgba(240, 255, 240, 0.2) 50%,
    rgba(34, 139, 34, 0.1) 80%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(2px);
  transform: translate3d(-50%, 0, 0) scaleY(0);
  animation: eb-beam-persistent-appear 0.5s ease-out 1s forwards, eb-beam-persistent-breathe 3s ease-in-out 1.5s infinite;
  will-change: transform, opacity;
}
@keyframes eb-beam-persistent-appear {
  0% {
    transform: translate3d(-50%, 0, 0) scaleY(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, 0, 0) scaleY(1);
    opacity: 0.6;
  }
}
@keyframes eb-beam-persistent-breathe {
  0%, 100% {
    opacity: 0.3;
    transform: translate3d(-50%, 0, 0) scaleY(0.9);
  }
  50% {
    opacity: 0.7;
    transform: translate3d(-50%, 0, 0) scaleY(1.05);
  }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .eb-stage * {
    animation-duration: 0.5s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
