<!--
  @file NatureInsightEffect.vue
  @generated 2026-07-07
  @description 自然领悟（持久BUFF特效）- 自然能量光环·叶片环绕·魔防护盾·感知风线
  游侠R技能（ranger_r）：借助自然之力提升感知，提升魔法防御与攻击速度
  BUFF持续期间一直显示，BUFF到期后由父组件通过 v-if 移除
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 0.6s）- 自然能量从天而降 → 叶片散落 → 自然绽放
    持续循环 - 树叶环绕旋转 + 魔防护盾环 + 感知风线螺旋 + 自然核心脉冲 + 偶发自然闪烁
  色彩方案：自然翠(#2E8B57) + 魔防蓝(#4FC3F7) + 速度金(#FFA500) + 自然白(#F0FFF0)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
-->
<template>
  <!-- 自然舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="ni-stage" :style="stageStyle">
    <!-- ===== 入场动画：自然降临（0s ~ 0.6s）===== -->
    <!-- 自然暗幕 - 翠绿氛围笼罩 -->
    <div class="ni-dim"></div>

    <!-- 天降自然能量 - 从顶部降下的翠绿自然光柱 -->
    <div class="ni-beam"></div>

    <!-- 自然散落叶片 - 光柱触地时四散的叶片碎片 -->
    <div
      v-for="i in 10"
      :key="'ni-descend-' + i"
      class="ni-descend"
      :style="getDescendStyle(i)"
    ></div>

    <!-- 自然绽放 - 光柱落地的径向爆发 -->
    <div class="ni-bloom"></div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 自然光环外层 - 整体翠绿发光氛围 -->
    <div class="ni-aura"></div>

    <!-- 自然光环主体 - 翠蓝双色光环边框 -->
    <div class="ni-halo">
      <!-- 光环能量场 - 半透明自然能量填充 -->
      <div class="ni-halo-field"></div>

      <!-- 光环边框 - 发光的翠蓝双色圆环 -->
      <div class="ni-halo-border"></div>

      <!-- 自然波纹 - 从中心向外扩散的光环 -->
      <div class="ni-wave wave-1"></div>
      <div class="ni-wave wave-2"></div>
      <div class="ni-wave wave-3"></div>
    </div>

    <!-- 魔防护盾环 - 蓝色护盾圆环，代表魔法防御加成 -->
    <div class="ni-shield-ring"></div>

    <!-- 感知风线螺旋 - 攻击速度象征，金色风线持续旋转 -->
    <div class="ni-wind-spiral"></div>

    <!-- 外层符文圆环 - 顺时针旋转，代表感知力提升 -->
    <div class="ni-rune-ring rune-outer"></div>
    <!-- 内层符文圆环 - 逆时针旋转，代表自然之力 -->
    <div class="ni-rune-ring rune-inner"></div>

    <!-- 中央自然核心 - 发光的自然之球，持续脉冲 -->
    <div class="ni-core">
      <div class="ni-core-inner"></div>
    </div>

    <!-- 树叶环绕 - 8片树叶沿轨道持续旋转 -->
    <div class="ni-orbit">
      <div
        v-for="i in 8"
        :key="'ni-orbit-leaf-' + i"
        class="ni-orbit-leaf"
        :style="getOrbitStyle(i)"
      ></div>
    </div>

    <!-- 偶发自然闪烁 - 暗示自然之力持续感知 -->
    <div class="ni-sparkle sparkle-1"></div>
    <div class="ni-sparkle sparkle-2"></div>
  </div>
</template>

<script setup>
/**
 * 自然领悟（持久BUFF特效）- 自然能量光环·叶片环绕·魔防护盾·感知风线
 * 游侠R技能（ranger_r）特效组件
 * 借助自然之力提升感知，提升魔法防御与攻击速度
 * 以自然翠和魔防蓝为主色调，速度金象征攻击速度
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
 * 计算自然舞台的动态样式
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
      console.warn('[NatureInsightEffect] 未找到玩家头像元素 #playerAvatar')
      return
    }

    const positioningParent = stage.offsetParent
    if (!positioningParent) {
      console.warn('[NatureInsightEffect] 未找到定位父容器')
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
    console.warn('[NatureInsightEffect] 更新头像位置失败:', e)
  }
}

/** 叶片颜色表 - 翠绿/魔防蓝/速度金/自然白 */
const LEAF_COLORS = [
  { color: 'rgba(46, 139, 87, 0.95)', glow: 'rgba(46, 139, 87, 0.7)' },
  { color: 'rgba(79, 195, 247, 0.95)', glow: 'rgba(79, 195, 247, 0.7)' },
  { color: 'rgba(255, 165, 0, 0.9)', glow: 'rgba(255, 165, 0, 0.6)' },
  { color: 'rgba(240, 255, 240, 0.95)', glow: 'rgba(46, 139, 87, 0.7)' }
]

/**
 * 计算散落叶片的样式
 * 每个叶片从光柱落点向不同方向散落，模拟自然降临时的叶片飞溅
 * 颜色交替使用翠绿、魔防蓝、速度金，对应魔防与攻速的双重祝福
 * @param {number} index - 叶片索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getDescendStyle (index) {
  const angle = (index - 1) * 36
  const distance = 40 + (index % 4) * 10
  const delay = (index % 5) * 0.03
  const colorType = index % 3
  const colors = [
    { color: 'rgba(46, 139, 87, 0.9)', glow: 'rgba(46, 139, 87, 0.6)' },
    { color: 'rgba(79, 195, 247, 0.9)', glow: 'rgba(79, 195, 247, 0.6)' },
    { color: 'rgba(255, 165, 0, 0.85)', glow: 'rgba(255, 165, 0, 0.5)' }
  ]
  const c = colors[colorType]
  return {
    '--ni-desc-angle': `${angle}deg`,
    '--ni-desc-dist': `${distance}px`,
    '--ni-desc-color': c.color,
    '--ni-desc-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算环绕叶片的样式
 * 8片叶片沿光环边缘旋转，对应自然之力的持续加持效果
 * 颜色交替使用翠绿、魔防蓝、速度金、白色，代表魔防与攻速的双重祝福
 * @param {number} index - 叶片索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getOrbitStyle (index) {
  const angle = (index - 1) * 45
  const radius = 54
  const duration = 3.5 + (index % 2) * 0.6
  const delay = 1.2 + (index % 4) * 0.25
  const c = LEAF_COLORS[(index - 1) % 4]
  return {
    '--ni-orbit-angle': `${angle}deg`,
    '--ni-orbit-radius': `${radius}px`,
    '--ni-orbit-duration': `${duration}s`,
    '--ni-orbit-color': c.color,
    '--ni-orbit-glow': c.glow,
    animationDelay: `${delay}s`
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
   自然领悟 (nature_insight) - 持久BUFF特效
   技能描述：借助自然之力提升感知，提升魔法防御与攻击速度
   色彩方案：自然翠(#2E8B57) + 魔防蓝(#4FC3F7) + 速度金(#FFA500) + 自然白(#F0FFF0)
   GPU加速：contain隔离 + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画结构：入场动画(0.6s) + 持续循环动画
   ================================================================ */

/* 自然舞台 - 定位容器，由 JS 动态设置 left/top/width/height 精确环绕头像 */
.ni-stage {
  position: absolute;
  contain: layout style;
  pointer-events: none;
  z-index: 50;
  animation: ni-stage-appear 0.6s ease-out forwards;
  will-change: opacity, transform;
}
@keyframes ni-stage-appear {
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

/* ---------- 入场动画：自然降临（0s ~ 0.6s）---------- */

/* 自然暗幕 - 翠绿氛围笼罩（入场后渐隐） */
.ni-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 30, 10, 0.4) 0%,
    rgba(0, 25, 8, 0.25) 50%,
    transparent 100%
  );
  animation: niDim 0.6s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}
@keyframes niDim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}

/* 天降自然能量 - 从顶部降下的翠绿自然光柱 */
.ni-beam {
  position: absolute;
  top: -20%;
  left: 50%;
  width: 16px;
  height: 70%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(46, 139, 87, 0.1) 15%,
    rgba(46, 139, 87, 0.4) 40%,
    rgba(240, 255, 240, 0.7) 70%,
    rgba(46, 139, 87, 0.5) 90%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(3px);
  transform: translate3d(-50%, 0, 0) scaleY(0);
  animation: ni-beam-descend 0.6s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes ni-beam-descend {
  0% {
    transform: translate3d(-50%, -30%, 0) scaleY(0);
    opacity: 0;
  }
  40% {
    transform: translate3d(-50%, 0, 0) scaleY(0.6);
    opacity: 0.8;
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

/* 自然散落叶片 - 光柱触地时四散的自然碎片 */
.ni-descend {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(240, 255, 240, 1) 0%,
    var(--ni-desc-color, rgba(46, 139, 87, 0.9)) 40%,
    transparent 100%
  );
  box-shadow: 0 0 5px var(--ni-desc-glow, rgba(46, 139, 87, 0.6));
  transform: translate3d(-50%, -50%, 0) rotate(var(--ni-desc-angle, 0deg)) translateX(0px) scale(0);
  animation: ni-descend-scatter 0.6s ease-out 0.2s forwards;
  will-change: transform, opacity;
}
@keyframes ni-descend-scatter {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--ni-desc-angle, 0deg)) translateX(0px) scale(0);
    opacity: 0;
  }
  30% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--ni-desc-angle, 0deg)) translateX(0px) scale(1.5);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--ni-desc-angle, 0deg)) translateX(var(--ni-desc-dist, 40px)) scale(0.2);
    opacity: 0;
  }
}

/* 自然绽放 - 光柱落地的径向爆发闪光 */
.ni-bloom {
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
    rgba(46, 139, 87, 0.35) 45%,
    rgba(79, 195, 247, 0.15) 70%,
    transparent 85%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: ni-bloom-burst 0.5s ease-out 0.3s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}
@keyframes ni-bloom-burst {
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

/* ---------- 持续循环动画 ---------- */

/* 自然光环外层 - 整体翠绿发光氛围 */
.ni-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 115%;
  height: 115%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(46, 139, 87, 0.18) 0%,
    rgba(79, 195, 247, 0.1) 30%,
    rgba(255, 165, 0, 0.06) 55%,
    rgba(46, 139, 87, 0.04) 75%,
    transparent 85%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: ni-aura-appear 0.5s ease-out 0.4s forwards, ni-aura-pulse 3s ease-in-out 1.2s infinite;
  will-change: transform, opacity;
  filter: blur(5px);
}
@keyframes ni-aura-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}
@keyframes ni-aura-pulse {
  0%, 100% {
    opacity: 0.4;
    transform: translate3d(-50%, -50%, 0) scale(1);
  }
  50% {
    opacity: 0.85;
    transform: translate3d(-50%, -50%, 0) scale(1.06);
  }
}

/* 自然光环主体 - 翠蓝双色光环框架 */
.ni-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 88%;
  height: 88%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: ni-halo-appear 0.5s ease-out 0.4s forwards;
  will-change: transform, opacity;
}
@keyframes ni-halo-appear {
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

/* 光环能量场 - 半透明自然能量填充背景 */
.ni-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(46, 139, 87, 0.18) 0%,
    rgba(79, 195, 247, 0.1) 35%,
    rgba(255, 165, 0, 0.06) 65%,
    rgba(46, 139, 87, 0.04) 100%
  );
  animation: ni-field-pulse 2.5s ease-in-out infinite;
  will-change: opacity;
}
@keyframes ni-field-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 发光的翠蓝双色圆环 */
.ni-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(46, 139, 87, 0.5);
  background: conic-gradient(
    from 0deg,
    rgba(46, 139, 87, 0.5) 0deg,
    rgba(79, 195, 247, 0.35) 60deg,
    rgba(240, 255, 240, 0.5) 120deg,
    rgba(255, 165, 0, 0.35) 180deg,
    rgba(46, 139, 87, 0.5) 240deg,
    rgba(79, 195, 247, 0.35) 300deg,
    rgba(46, 139, 87, 0.5) 360deg
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
    0 0 10px rgba(46, 139, 87, 0.5),
    0 0 5px rgba(79, 195, 247, 0.3),
    inset 0 0 6px rgba(46, 139, 87, 0.2);
  animation: ni-border-glow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}
@keyframes ni-border-glow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 10px rgba(46, 139, 87, 0.5),
      0 0 5px rgba(79, 195, 247, 0.3),
      inset 0 0 6px rgba(46, 139, 87, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 16px rgba(46, 139, 87, 0.8),
      0 0 10px rgba(79, 195, 247, 0.5),
      0 0 5px rgba(240, 255, 240, 0.4),
      inset 0 0 8px rgba(46, 139, 87, 0.3);
  }
}

/* 自然波纹 - 从中心向外扩散的圆形光环 */
.ni-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  border: 1.5px solid rgba(46, 139, 87, 0.6);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}
.ni-wave.wave-1 {
  animation: ni-wave-expand 2.5s ease-out 0.8s infinite;
}
.ni-wave.wave-2 {
  animation: ni-wave-expand 2.5s ease-out 1.6s infinite;
}
.ni-wave.wave-3 {
  animation: ni-wave-expand 2.5s ease-out 2.1s infinite;
}
@keyframes ni-wave-expand {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.3);
    opacity: 0;
    border-color: rgba(240, 255, 240, 0.8);
  }
  20% { opacity: 0.85; }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(3);
    opacity: 0;
    border-color: rgba(46, 139, 87, 0.1);
  }
}

/* 魔防护盾环 - 蓝色护盾圆环，代表魔法防御加成 */
.ni-shield-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 75%;
  height: 75%;
  border-radius: 50%;
  border: 1.5px solid transparent;
  border-top-color: rgba(79, 195, 247, 0.8);
  border-right-color: rgba(79, 195, 247, 0.4);
  box-shadow:
    0 0 10px rgba(79, 195, 247, 0.5),
    inset 0 0 6px rgba(79, 195, 247, 0.2);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: ni-shield-appear 0.4s ease-out 0.5s forwards,
             ni-shield-spin 5s linear 1s infinite;
  will-change: transform, opacity;
}
@keyframes ni-shield-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.8;
  }
}
@keyframes ni-shield-spin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); }
}

/* 感知风线螺旋 - 攻击速度象征，金色风线持续旋转 */
.ni-wind-spiral {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 68%;
  height: 68%;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: rgba(255, 165, 0, 0.7);
  border-right-color: rgba(255, 165, 0, 0.3);
  box-shadow: 0 0 8px rgba(255, 165, 0, 0.3);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: ni-spiral-in 0.3s ease-out 0.4s forwards,
             ni-spiral-spin 2s linear 0.7s infinite;
  will-change: transform, opacity;
}
@keyframes ni-spiral-in {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}
@keyframes ni-spiral-spin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); }
}

/* 符文圆环 - 旋转的自然符文（双层） */
.ni-rune-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
}

/* 外圈符文 - 顺时针旋转，代表感知力提升，翠绿为主 */
.rune-outer {
  width: 82%;
  height: 82%;
  border: 1px dashed rgba(46, 139, 87, 0.4);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(46, 139, 87, 0.18) 30deg,
    transparent 60deg,
    rgba(79, 195, 247, 0.14) 120deg,
    transparent 150deg,
    rgba(240, 255, 240, 0.16) 210deg,
    transparent 240deg,
    rgba(46, 139, 87, 0.18) 300deg,
    transparent 360deg
  );
  box-shadow: 0 0 6px rgba(46, 139, 87, 0.25);
  animation: ni-rune-outer-appear 0.4s ease-out 0.6s forwards, ni-rune-outer-spin 6s linear 1.2s infinite;
}
@keyframes ni-rune-outer-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.7;
  }
}
@keyframes ni-rune-outer-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); }
}

/* 内圈符文 - 逆时针旋转，代表自然之力，魔防蓝为主 */
.rune-inner {
  width: 58%;
  height: 58%;
  border: 1px solid rgba(79, 195, 247, 0.25);
  background: conic-gradient(
    from 180deg,
    transparent 0deg,
    rgba(79, 195, 247, 0.16) 45deg,
    transparent 90deg,
    rgba(46, 139, 87, 0.14) 180deg,
    transparent 225deg,
    rgba(240, 255, 240, 0.15) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 5px rgba(79, 195, 247, 0.15);
  animation: ni-rune-inner-appear 0.4s ease-out 0.7s forwards, ni-rune-inner-spin 4.5s linear 1.3s infinite;
}
@keyframes ni-rune-inner-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.6;
  }
}
@keyframes ni-rune-inner-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); }
}

/* 中央自然核心 - 发光的自然之球 */
.ni-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: ni-core-appear 0.4s ease-out 0.8s forwards;
  will-change: transform, opacity;
}
@keyframes ni-core-appear {
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

/* 自然核心内部 - 多色发光能量球 */
.ni-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(240, 255, 240, 0.95) 20%,
    rgba(46, 139, 87, 0.85) 50%,
    rgba(79, 195, 247, 0.5) 80%,
    rgba(255, 165, 0, 0.3) 100%
  );
  box-shadow:
    0 0 8px rgba(46, 139, 87, 0.9),
    0 0 16px rgba(46, 139, 87, 0.5),
    0 0 24px rgba(79, 195, 247, 0.3);
  animation: ni-core-pulse 1.8s ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes ni-core-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.4);
    opacity: 1;
  }
}

/* 树叶环绕 - 8片树叶沿光环边缘旋转 */
.ni-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: ni-orbit-in 0.3s ease-out 0.6s forwards;
  will-change: transform, opacity;
}
@keyframes ni-orbit-in {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}

/* 环绕叶片 - 沿光环边缘旋转的自然光叶 */
.ni-orbit-leaf {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--ni-orbit-color, rgba(46, 139, 87, 0.95)) 0%,
    transparent 100%
  );
  box-shadow: 0 0 5px var(--ni-orbit-glow, rgba(46, 139, 87, 0.7));
  transform: translate3d(-50%, -50%, 0) rotate(var(--ni-orbit-angle, 0deg)) translateX(var(--ni-orbit-radius, 54px)) scale(0);
  opacity: 0;
  animation: ni-orbit var(--ni-orbit-duration, 4s) linear infinite;
  will-change: transform, opacity;
}
@keyframes ni-orbit {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--ni-orbit-angle, 0deg)) translateX(var(--ni-orbit-radius, 54px)) scale(0.5);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--ni-orbit-angle, 0deg)) translateX(var(--ni-orbit-radius, 54px)) scale(1.3);
  }
  85% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--ni-orbit-angle, 0deg) + 360deg)) translateX(var(--ni-orbit-radius, 54px)) scale(0.5);
    opacity: 0;
  }
}

/* 偶发自然闪烁 - 暗示自然之力持续感知 */
.ni-sparkle {
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
  animation: ni-sparkle-flash 5s ease-out 2.5s infinite;
}
.sparkle-2 {
  animation: ni-sparkle-flash 6s ease-out 4.5s infinite;
}
@keyframes ni-sparkle-flash {
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
    border-color: rgba(46, 139, 87, 0.2);
  }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .ni-stage * {
    animation-duration: 0.5s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
