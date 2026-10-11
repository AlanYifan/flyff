<!--
  @file DeadlyShotEffect.vue
  @generated 2026-07-07
  @description 致命射击（持久BUFF特效）- 暴击准星·致命能量环·锐利核心·致命火花
  游侠E技能（ranger_e）：短时间内提升角色的暴击率
  BUFF持续期间一直显示，BUFF到期后由父组件通过 v-if 移除
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 0.6s）- 准星锁定爆发 → 致命能量散裂 → 致命绽放
    持续循环 - 旋转准星十字 + 暴击能量环 + 致命核心脉冲 + 锐利尖刺环绕 + 致命火花闪烁
  色彩方案：致命红(#FF1744) + 危险橙(#FF6D00) + 暴击金(#FFD700) + 锐利白(#FFFFFF)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
-->
<template>
  <!-- 致命舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="ds-stage" :style="stageStyle">
    <!-- ===== 入场动画：致命锁定（0s ~ 0.6s）===== -->
    <!-- 致命暗幕 - 红色危险氛围笼罩 -->
    <div class="ds-dim"></div>

    <!-- 准星锁定爆发 - 中心红色冲击爆发 -->
    <div class="ds-burst"></div>

    <!-- 致命能量散裂 - 从中心四散的暴击碎片 -->
    <div
      v-for="i in 10"
      :key="'ds-shard-' + i"
      class="ds-shard"
      :style="getShardStyle(i)"
    ></div>

    <!-- 致命绽放 - 径向爆发闪光 -->
    <div class="ds-bloom"></div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 致命光环外层 - 整体红金发光氛围 -->
    <div class="ds-aura"></div>

    <!-- 致命光环主体 - 红金双色光环边框 -->
    <div class="ds-halo">
      <!-- 光环能量场 - 半透明暴击能量填充 -->
      <div class="ds-halo-field"></div>

      <!-- 光环边框 - 发光的红金双色圆环 -->
      <div class="ds-halo-border"></div>

      <!-- 致命波纹 - 从中心向外扩散的光环 -->
      <div class="ds-wave wave-1"></div>
      <div class="ds-wave wave-2"></div>
      <div class="ds-wave wave-3"></div>
    </div>

    <!-- 旋转准星十字 - 暴击率象征，红色准星持续旋转 -->
    <div class="ds-crosshair">
      <div class="ds-cross-arm arm-top"></div>
      <div class="ds-cross-arm arm-bottom"></div>
      <div class="ds-cross-arm arm-left"></div>
      <div class="ds-cross-arm arm-right"></div>
    </div>

    <!-- 暴击能量环 - 金色能量弧持续旋转 -->
    <div class="ds-crit-ring">
      <div class="ds-crit-arc arc-1"></div>
      <div class="ds-crit-arc arc-2"></div>
      <div class="ds-crit-arc arc-3"></div>
      <div class="ds-crit-arc arc-4"></div>
    </div>

    <!-- 外层符文圆环 - 顺时针旋转，代表暴击感知 -->
    <div class="ds-rune-ring rune-outer"></div>
    <!-- 内层符文圆环 - 逆时针旋转，代表致命之力 -->
    <div class="ds-rune-ring rune-inner"></div>

    <!-- 中央致命核心 - 发光的暴击之球，持续脉冲 -->
    <div class="ds-core">
      <div class="ds-core-inner"></div>
    </div>

    <!-- 锐利尖刺环绕 - 4道尖刺沿轨道持续旋转 -->
    <div class="ds-orbit">
      <div
        v-for="i in 4"
        :key="'ds-orbit-spike-' + i"
        class="ds-orbit-spike"
        :style="getOrbitSpikeStyle(i)"
      ></div>
    </div>

    <!-- 偶发致命火花 - 暗示暴击率持续提升 -->
    <div class="ds-sparkle sparkle-1"></div>
    <div class="ds-sparkle sparkle-2"></div>
  </div>
</template>

<script setup>
/**
 * 致命射击（持久BUFF特效）- 暴击准星·致命能量环·锐利核心·致命火花
 * 游侠E技能（ranger_e）特效组件
 * 短时间内提升角色的暴击率
 * 以致命红和暴击金为主色调，危险橙象征致命伤害，锐利白象征精准暴击
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
 * 计算致命舞台的动态样式
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
      console.warn('[DeadlyShotEffect] 未找到玩家头像元素 #playerAvatar')
      return
    }

    const positioningParent = stage.offsetParent
    if (!positioningParent) {
      console.warn('[DeadlyShotEffect] 未找到定位父容器')
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
    console.warn('[DeadlyShotEffect] 更新头像位置失败:', e)
  }
}

/** 四色尖刺颜色表 - 致命红/暴击金/危险橙/锐利白 */
const SPIKE_COLORS = ['#FF1744', '#FFD700', '#FF6D00', '#FFFFFF']

/**
 * 计算散裂碎片的样式
 * 每个碎片从中心向不同方向飞溅，模拟致命锁定时的暴击能量迸发
 * 颜色交替使用红色、金色、橙色，对应暴击率提升的危险气息
 * @param {number} index - 碎片索引（1~10）
 * @returns {Object} CSS自定义属性对象
 */
function getShardStyle (index) {
  const angle = (index - 1) * 36
  const distance = 40 + (index % 4) * 10
  const delay = (index % 5) * 0.03
  const colorType = index % 3
  const colors = [
    { color: 'rgba(255, 23, 68, 0.9)', glow: 'rgba(255, 23, 68, 0.6)' },
    { color: 'rgba(255, 215, 0, 0.9)', glow: 'rgba(255, 215, 0, 0.6)' },
    { color: 'rgba(255, 109, 0, 0.85)', glow: 'rgba(255, 109, 0, 0.5)' }
  ]
  const c = colors[colorType]
  return {
    '--ds-shard-angle': `${angle}deg`,
    '--ds-shard-dist': `${distance}px`,
    '--ds-shard-color': c.color,
    '--ds-shard-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成环绕尖刺的样式
 * 4道尖刺沿轨道旋转，对应暴击率提升的四重致命之力
 * @param {number} index - 尖刺序号（1~4）
 * @returns {Object} CSS样式对象，含角度、颜色、尺寸
 */
function getOrbitSpikeStyle (index) {
  const angle = (index - 1) * 90
  const color = SPIKE_COLORS[(index - 1) % 4]
  const size = 6 + (index % 2) * 2
  return {
    '--ds-orbit-angle': `${angle}deg`,
    '--ds-orbit-color': color,
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
   致命射击 (deadly_shot) - 持久BUFF特效
   技能描述：短时间内提升角色的暴击率
   色彩方案：致命红(#FF1744) + 危险橙(#FF6D00) + 暴击金(#FFD700) + 锐利白(#FFFFFF)
   GPU加速：contain隔离 + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画结构：入场动画(0.6s) + 持续循环动画
   ================================================================ */

/* 致命舞台 - 定位容器，由 JS 动态设置 left/top/width/height 精确环绕头像 */
.ds-stage {
  position: absolute;
  contain: layout style;
  pointer-events: none;
  z-index: 50;
  animation: ds-stage-appear 0.6s ease-out forwards;
  will-change: opacity, transform;
}
@keyframes ds-stage-appear {
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

/* ---------- 入场动画：致命锁定（0s ~ 0.6s）---------- */

/* 致命暗幕 - 红色危险氛围笼罩（入场后渐隐） */
.ds-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at center,
    rgba(60, 0, 0, 0.4) 0%,
    rgba(50, 0, 0, 0.25) 50%,
    transparent 100%
  );
  animation: dsDim 0.6s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}
@keyframes dsDim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}

/* 准星锁定爆发 - 中心红色冲击爆发 */
.ds-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 23, 68, 0.6) 20%,
    rgba(255, 109, 0, 0.3) 50%,
    transparent 80%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: dsBurst 0.5s ease-out 0.1s forwards;
  will-change: transform, opacity;
  z-index: 4;
}
@keyframes dsBurst {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  30% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2.2);
    opacity: 0;
  }
}

/* 致命能量散裂 - 从中心四散的暴击碎片 */
.ds-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    var(--ds-shard-color, rgba(255, 23, 68, 0.9)) 40%,
    transparent 100%
  );
  box-shadow: 0 0 5px var(--ds-shard-glow, rgba(255, 23, 68, 0.6));
  transform: translate3d(-50%, -50%, 0) rotate(var(--ds-shard-angle, 0deg)) translateX(0px) scale(0);
  animation: ds-shard-scatter 0.6s ease-out 0.2s forwards;
  will-change: transform, opacity;
}
@keyframes ds-shard-scatter {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--ds-shard-angle, 0deg)) translateX(0px) scale(0);
    opacity: 0;
  }
  30% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--ds-shard-angle, 0deg)) translateX(0px) scale(1.5);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--ds-shard-angle, 0deg)) translateX(var(--ds-shard-dist, 40px)) scale(0.2);
    opacity: 0;
  }
}

/* 致命绽放 - 径向爆发闪光 */
.ds-bloom {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 240, 240, 0.6) 20%,
    rgba(255, 23, 68, 0.35) 45%,
    rgba(255, 215, 0, 0.15) 70%,
    transparent 85%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: ds-bloom-burst 0.5s ease-out 0.3s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}
@keyframes ds-bloom-burst {
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

/* 致命光环外层 - 整体红金发光氛围 */
.ds-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 115%;
  height: 115%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 23, 68, 0.18) 0%,
    rgba(255, 215, 0, 0.1) 30%,
    rgba(255, 109, 0, 0.06) 55%,
    rgba(255, 23, 68, 0.04) 75%,
    transparent 85%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: ds-aura-appear 0.5s ease-out 0.4s forwards, ds-aura-pulse 3s ease-in-out 1.2s infinite;
  will-change: transform, opacity;
  filter: blur(5px);
}
@keyframes ds-aura-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}
@keyframes ds-aura-pulse {
  0%, 100% {
    opacity: 0.4;
    transform: translate3d(-50%, -50%, 0) scale(1);
  }
  50% {
    opacity: 0.85;
    transform: translate3d(-50%, -50%, 0) scale(1.06);
  }
}

/* 致命光环主体 - 红金双色光环框架 */
.ds-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 88%;
  height: 88%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: ds-halo-appear 0.5s ease-out 0.4s forwards;
  will-change: transform, opacity;
}
@keyframes ds-halo-appear {
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

/* 光环能量场 - 半透明暴击能量填充背景 */
.ds-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(255, 23, 68, 0.18) 0%,
    rgba(255, 215, 0, 0.1) 35%,
    rgba(255, 109, 0, 0.06) 65%,
    rgba(255, 23, 68, 0.04) 100%
  );
  animation: ds-field-pulse 2.5s ease-in-out infinite;
  will-change: opacity;
}
@keyframes ds-field-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 发光的红金双色圆环 */
.ds-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 23, 68, 0.5);
  background: conic-gradient(
    from 0deg,
    rgba(255, 23, 68, 0.5) 0deg,
    rgba(255, 215, 0, 0.35) 60deg,
    rgba(255, 240, 240, 0.5) 120deg,
    rgba(255, 109, 0, 0.35) 180deg,
    rgba(255, 23, 68, 0.5) 240deg,
    rgba(255, 215, 0, 0.35) 300deg,
    rgba(255, 23, 68, 0.5) 360deg
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
    0 0 10px rgba(255, 23, 68, 0.5),
    0 0 5px rgba(255, 215, 0, 0.3),
    inset 0 0 6px rgba(255, 23, 68, 0.2);
  animation: ds-border-glow 2s ease-in-out infinite;
  will-change: opacity, box-shadow;
}
@keyframes ds-border-glow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 10px rgba(255, 23, 68, 0.5),
      0 0 5px rgba(255, 215, 0, 0.3),
      inset 0 0 6px rgba(255, 23, 68, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 16px rgba(255, 23, 68, 0.8),
      0 0 10px rgba(255, 215, 0, 0.5),
      0 0 5px rgba(255, 240, 240, 0.4),
      inset 0 0 8px rgba(255, 23, 68, 0.3);
  }
}

/* 致命波纹 - 从中心向外扩散的圆形光环 */
.ds-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 23, 68, 0.6);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}
.ds-wave.wave-1 {
  animation: ds-wave-expand 2.5s ease-out 0.8s infinite;
}
.ds-wave.wave-2 {
  animation: ds-wave-expand 2.5s ease-out 1.6s infinite;
}
.ds-wave.wave-3 {
  animation: ds-wave-expand 2.5s ease-out 2.1s infinite;
}
@keyframes ds-wave-expand {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.3);
    opacity: 0;
    border-color: rgba(255, 240, 240, 0.8);
  }
  20% { opacity: 0.85; }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(3);
    opacity: 0;
    border-color: rgba(255, 23, 68, 0.1);
  }
}

/* 旋转准星十字 - 暴击率象征，红色准星持续旋转 */
.ds-crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: ds-crosshair-appear 0.4s ease-out 0.5s forwards,
             ds-crosshair-spin 4s linear 0.9s infinite;
  will-change: transform, opacity;
}
@keyframes ds-crosshair-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.6;
  }
}
@keyframes ds-crosshair-spin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(90deg); }
}

/* 准星四臂 - 十字形准星的四个方向 */
.ds-cross-arm {
  position: absolute;
  background: linear-gradient(
    to var(--arm-dir, top),
    transparent 0%,
    rgba(255, 23, 68, 0.8) 50%,
    rgba(255, 255, 255, 0.9) 100%
  );
  box-shadow: 0 0 4px rgba(255, 23, 68, 0.6);
  border-radius: 2px;
}
.ds-cross-arm.arm-top {
  top: 0;
  left: 50%;
  width: 2px;
  height: 22%;
  transform: translate3d(-50%, 0, 0);
  --arm-dir: bottom;
}
.ds-cross-arm.arm-bottom {
  bottom: 0;
  left: 50%;
  width: 2px;
  height: 22%;
  transform: translate3d(-50%, 0, 0);
  --arm-dir: top;
}
.ds-cross-arm.arm-left {
  top: 50%;
  left: 0;
  width: 22%;
  height: 2px;
  transform: translate3d(0, -50%, 0);
  --arm-dir: right;
}
.ds-cross-arm.arm-right {
  top: 50%;
  right: 0;
  width: 22%;
  height: 2px;
  transform: translate3d(0, -50%, 0);
  --arm-dir: left;
}

/* 暴击能量环 - 四段金色弧持续旋转 */
.ds-crit-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 85%;
  height: 85%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: ds-crit-ring-in 0.4s ease-out 0.3s forwards,
             ds-crit-ring-spin 3s linear 0.7s infinite;
  will-change: transform, opacity;
}
@keyframes ds-crit-ring-in {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}
@keyframes ds-crit-ring-spin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); }
}

/* 四段弧 - 致命红/暴击金/危险橙/锐利白 */
.ds-crit-arc {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid transparent;
}
.ds-crit-arc.arc-1 {
  border-top-color: rgba(255, 23, 68, 0.85);
  border-right-color: rgba(255, 23, 68, 0.3);
  box-shadow: 0 0 8px rgba(255, 23, 68, 0.5);
}
.ds-crit-arc.arc-2 {
  border-right-color: rgba(255, 215, 0, 0.85);
  border-bottom-color: rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}
.ds-crit-arc.arc-3 {
  border-bottom-color: rgba(255, 109, 0, 0.85);
  border-left-color: rgba(255, 109, 0, 0.3);
  box-shadow: 0 0 8px rgba(255, 109, 0, 0.5);
}
.ds-crit-arc.arc-4 {
  border-left-color: rgba(255, 255, 255, 0.85);
  border-top-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

/* 符文圆环 - 旋转的致命符文（双层） */
.ds-rune-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
}

/* 外圈符文 - 顺时针旋转，代表暴击感知，红色为主 */
.rune-outer {
  width: 78%;
  height: 78%;
  border: 1px dashed rgba(255, 23, 68, 0.4);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 23, 68, 0.18) 30deg,
    transparent 60deg,
    rgba(255, 109, 0, 0.14) 120deg,
    transparent 150deg,
    rgba(255, 240, 240, 0.16) 210deg,
    transparent 240deg,
    rgba(255, 215, 0, 0.18) 300deg,
    transparent 360deg
  );
  box-shadow: 0 0 6px rgba(255, 23, 68, 0.25);
  animation: ds-rune-outer-appear 0.4s ease-out 0.6s forwards, ds-rune-outer-spin 6s linear 1.2s infinite;
}
@keyframes ds-rune-outer-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.7;
  }
}
@keyframes ds-rune-outer-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); }
}

/* 内圈符文 - 逆时针旋转，代表致命之力，金色为主 */
.rune-inner {
  width: 58%;
  height: 58%;
  border: 1px solid rgba(255, 215, 0, 0.25);
  background: conic-gradient(
    from 180deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.16) 45deg,
    transparent 90deg,
    rgba(255, 23, 68, 0.14) 180deg,
    transparent 225deg,
    rgba(255, 240, 240, 0.15) 270deg,
    transparent 315deg,
    transparent 360deg
  );
  box-shadow: inset 0 0 5px rgba(255, 215, 0, 0.15);
  animation: ds-rune-inner-appear 0.4s ease-out 0.7s forwards, ds-rune-inner-spin 4.5s linear 1.3s infinite;
}
@keyframes ds-rune-inner-appear {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.6;
  }
}
@keyframes ds-rune-inner-spin {
  from { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  to { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); }
}

/* 中央致命核心 - 发光的暴击之球 */
.ds-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: ds-core-appear 0.4s ease-out 0.8s forwards;
  will-change: transform, opacity;
}
@keyframes ds-core-appear {
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

/* 致命核心内部 - 多色发光暴击能量球 */
.ds-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 240, 240, 0.95) 20%,
    rgba(255, 23, 68, 0.85) 50%,
    rgba(255, 215, 0, 0.5) 80%,
    rgba(255, 109, 0, 0.3) 100%
  );
  box-shadow:
    0 0 8px rgba(255, 23, 68, 0.9),
    0 0 16px rgba(255, 23, 68, 0.5),
    0 0 24px rgba(255, 215, 0, 0.3);
  animation: ds-core-pulse 1.5s ease-in-out infinite;
  will-change: transform, opacity;
}
@keyframes ds-core-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.4);
    opacity: 1;
  }
}

/* 锐利尖刺环绕 - 4道尖刺沿轨道持续旋转 */
.ds-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: ds-orbit-in 0.3s ease-out 0.6s forwards,
             ds-orbit-spin 4s linear 0.9s infinite;
  will-change: transform, opacity;
}
@keyframes ds-orbit-in {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
}
@keyframes ds-orbit-spin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); }
}

/* 环绕尖刺 - 四种颜色对应四重致命之力 */
.ds-orbit-spike {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 40% 60% 50% 40% / 55% 40% 60% 45%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    var(--ds-orbit-color, #FF1744) 50%,
    rgba(180, 0, 0, 0.3) 100%
  );
  box-shadow: 0 0 6px var(--ds-orbit-color, #FF1744);
  transform: translate3d(-50%, -50%, 0) rotate(var(--ds-orbit-angle, 0deg)) translateY(-48%);
}

/* 偶发致命火花 - 暗示暴击率持续提升 */
.ds-sparkle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 88%;
  height: 88%;
  border-radius: 50%;
  border: 2px solid rgba(255, 240, 240, 0.6);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}
.sparkle-1 {
  animation: ds-sparkle-flash 5s ease-out 2.5s infinite;
}
.sparkle-2 {
  animation: ds-sparkle-flash 6s ease-out 4.5s infinite;
}
@keyframes ds-sparkle-flash {
  0%, 85% {
    transform: translate3d(-50%, -50%, 0) scale(0.8);
    opacity: 0;
    border-color: rgba(255, 240, 240, 0.6);
  }
  90% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.8;
    border-color: rgba(255, 255, 255, 0.95);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.6);
    opacity: 0;
    border-color: rgba(255, 23, 68, 0.2);
  }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .ds-stage * {
    animation-duration: 0.5s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
