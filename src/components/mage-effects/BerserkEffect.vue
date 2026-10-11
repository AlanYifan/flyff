<!--
  @file BerserkEffect.vue
  @generated 2026-07-08
  @description 狂暴（持久BUFF特效）- 嗜血觉醒·狂怒裂破·破甲碎裂·烈焰攻心
  刀锋战士W技能（blade_warrior_w）：获得狂暴之力增加命中率、攻击速度和攻击力、格挡穿透，并降低防御力
  四维增益：命中橙(命中率) + 速攻赤(攻击速度) + 嗜血红(攻击力) + 破甲紫(格挡穿透)
  代价：防御力降低（以碎裂裂纹特效表现防护瓦解）
  BUFF持续期间一直显示，BUFF到期后自动移除
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画结构：
    入场（0s ~ 0.8s）- 狂暴暗幕降临 + 嗜血光柱降下 + 碎裂爆发 + 四维狂怒能量流汇聚
    持续循环 - 狂暴血焰光环旋转 + 双层裂痕符文环 + 烈焰粒子环绕 + 破甲碎裂波纹脉冲 +
              狂怒核心脉冲 + 闪电裂纹迸发 + 速攻残影纹章旋转 + 命中准星闪烁
  色彩方案：狂暴赤(#DC143C) + 嗜血暗红(#8B0000) + 烈焰橙(#FF4500) + 破甲紫(#4B0082)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
-->
<template>
  <!-- 狂暴舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="bk-stage" :style="stageStyle">
    <!-- ===== 入场动画：嗜血觉醒（0s ~ 0.8s）===== -->
    <!-- 狂暴暗幕 - 血色氛围笼罩（入场后渐隐） -->
    <div class="bk-dim"></div>

    <!-- 天降嗜血光柱 - 从顶部降下的猩红狂暴光柱 -->
    <div class="bk-beam"></div>

    <!-- 碎裂爆发 - 光柱触地后碎裂状径向爆发，代表防御瓦解 -->
    <div class="bk-shatter-burst">
      <div
        v-for="i in 6"
        :key="'bk-shard-' + i"
        class="bk-shard"
        :style="getShardStyle(i)"
      ></div>
    </div>

    <!-- 四维狂怒能量流 - 从四方螺旋汇聚至中心（入场一次性） -->
    <div
      v-for="i in 4"
      :key="'bk-stream-' + i"
      class="bk-stream"
      :style="getStreamStyle(i)"
    ></div>

    <!-- ===== 持续循环动画 ===== -->
    <!-- 狂暴血焰光晕 - 外层柔和血红发光氛围（持续显示） -->
    <div class="bk-aura"></div>

    <!-- 狂暴光环主体 - 发光的赤橙双色狂暴光环边框 -->
    <div class="bk-halo">
      <div class="bk-halo-field"></div>
      <div class="bk-halo-border"></div>
    </div>

    <!-- 外层裂痕符文圆环 - 顺时针持续旋转 -->
    <div class="bk-crack-ring ring-outer">
      <div class="bk-crack-ring-inner"></div>
    </div>
    <!-- 内层裂痕符文圆环 - 逆时针持续旋转 -->
    <div class="bk-crack-ring ring-inner">
      <div class="bk-crack-ring-inner"></div>
    </div>

    <!-- 破甲碎裂波纹 - 从中心向外周期性扩散的紫色碎裂波 -->
    <div class="bk-shatter-wave wave-1"></div>
    <div class="bk-shatter-wave wave-2"></div>
    <div class="bk-shatter-wave wave-3"></div>

    <!-- 中央狂怒核心 - 发光的猩红狂暴之球，持续脉冲 -->
    <div class="bk-core">
      <div class="bk-core-inner"></div>
    </div>

    <!-- 烈焰粒子环绕 - 8颗粒子沿圆形轨道持续旋转 -->
    <div class="bk-orbit">
      <div
        v-for="i in 8"
        :key="'bk-orbit-particle-' + i"
        class="bk-orbit-particle"
        :style="getOrbitParticleStyle(i)"
      ></div>
    </div>

    <!-- 闪电裂纹 - 周期性迸发的能量裂纹，代表格挡穿透 -->
    <div class="bk-crack-flash crack-1"></div>
    <div class="bk-crack-flash crack-2"></div>
    <div class="bk-crack-flash crack-3"></div>

    <!-- 命中准星闪烁 - 周期性闪现的橙色准星，代表命中率提升 -->
    <div class="bk-target"></div>

    <!-- 速攻残影纹章 - 持续旋转脉冲的狂暴标志 -->
    <div class="bk-emblem">
      <div class="bk-emblem-inner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 狂暴（持久BUFF特效）- 嗜血觉醒·狂怒裂破·破甲碎裂·烈焰攻心
 * 刀锋战士W技能（blade_warrior_w）特效组件
 * 获得狂暴之力增加命中率、攻击速度和攻击力、格挡穿透，并降低防御力
 * 四维增益以四色能量流表现：命中橙(命中率) + 速攻赤(攻击速度) + 嗜血红(攻击力) + 破甲紫(格挡穿透)
 * 防御力降低以碎裂裂纹特效表现防护瓦解
 * 以狂暴赤红为主色调，融合碎裂裂纹的破坏感与血焰能量的狂暴感
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
const RAGE_COLORS = [
  { color: '#FF4500', glow: 'rgba(255, 69, 0, 0.8)' },    // 命中橙 - 命中率
  { color: '#DC143C', glow: 'rgba(220, 20, 60, 0.8)' },   // 速攻赤 - 攻击速度
  { color: '#8B0000', glow: 'rgba(139, 0, 0, 0.8)' },     // 嗜血暗红 - 攻击力
  { color: '#4B0082', glow: 'rgba(75, 0, 130, 0.8)' }     // 破甲紫 - 格挡穿透
]

/**
 * 计算狂暴舞台的动态样式
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
 * 生成碎裂爆发的碎片样式
 * 6块碎片从中心向不同方向飞散，模拟防御瓦解时护甲碎裂的效果
 * 颜色交替使用暗红和紫色，对应防御力降低和格挡穿透
 * @param {number} index - 碎片序号（1~6）
 * @returns {Object} CSS样式对象，含角度、颜色
 */
function getShardStyle (index) {
  const angle = (index - 1) * 60
  const c = RAGE_COLORS[(index + 1) % 4]
  return {
    '--bk-shard-angle': `${angle}deg`,
    '--bk-shard-color': c.color,
    '--bk-shard-glow': c.glow
  }
}

/**
 * 生成四维狂怒能量流的样式
 * 四道不同颜色能量流从四个方向（上/右/下/左）螺旋汇聚至中心
 * 橙色代表命中率，赤色代表攻击速度，暗红代表攻击力，紫色代表格挡穿透
 * @param {number} index - 能量流序号（1~4）
 * @returns {Object} CSS样式对象，含角度、颜色、延迟
 */
function getStreamStyle (index) {
  const angle = (index - 1) * 90
  const c = RAGE_COLORS[(index - 1) % 4]
  const delay = 0.3 + (index - 1) * 0.04
  return {
    '--bk-stream-angle': `${angle}deg`,
    '--bk-stream-color': c.color,
    '--bk-stream-glow': c.glow,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成烈焰环绕粒子的样式
 * 8颗粒子分为4组，每组2颗同色，对应四维增益
 * @param {number} index - 粒子序号（1~8）
 * @returns {Object} CSS样式对象，含角度、颜色、尺寸
 */
function getOrbitParticleStyle (index) {
  const angle = (index - 1) * 45
  const colorIdx = Math.floor((index - 1) / 2) % 4
  const c = RAGE_COLORS[colorIdx]
  const size = 5 + (index % 2) * 2
  return {
    '--bk-orbit-angle': `${angle}deg`,
    '--bk-orbit-color': c.color,
    '--bk-orbit-glow': c.glow,
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
   狂暴 (blade_warrior_w / berserk) - 持久BUFF特效
   技能描述：获得狂暴之力增加命中率、攻击速度和攻击力、格挡穿透，并降低防御力
   四维增益：命中橙(命中率) + 速攻赤(攻击速度) + 嗜血红(攻击力) + 破甲紫(格挡穿透)
   代价：防御力降低（以碎裂裂纹特效表现防护瓦解）
   GPU加速：contain隔离 + will-change + backface-visibility + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画结构：入场动画(0.8s) + 持续循环动画
   ================================================================ */

/* 狂暴舞台 - 定位容器 */
.bk-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 入场动画：嗜血觉醒（0s ~ 0.8s）---------- */

/* 狂暴暗幕 - 血色氛围笼罩（入场后渐隐） */
.bk-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at center,
    rgba(50, 0, 0, 0.45) 0%,
    rgba(35, 0, 0, 0.25) 50%,
    transparent 100%
  );
  animation: bkDim 0.8s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes bkDim {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}

/* 天降嗜血光柱 - 从顶部降下的猩红狂暴光柱（入场一次性） */
.bk-beam {
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
    rgba(139, 0, 0, 0.15) 15%,
    rgba(255, 69, 0, 0.35) 40%,
    rgba(220, 20, 60, 0.6) 65%,
    rgba(139, 0, 0, 0.25) 85%,
    transparent 100%
  );
  filter: blur(6px);
  opacity: 0;
  animation: bkBeam 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  will-change: transform, opacity;
  z-index: 2;
}

@keyframes bkBeam {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  30% { transform: translateX(-50%) scaleY(1); opacity: 1; }
  60% { transform: translateX(-50%) scaleY(1); opacity: 0.6; }
  100% { transform: translateX(-50%) scaleY(1); opacity: 0; }
}

/* 碎裂爆发 - 光柱触地后碎裂状径向爆发（入场一次性） */
.bk-shatter-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: bkShatterBurst 0.6s ease-out 0.15s forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes bkShatterBurst {
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

/* 碎裂碎片 - 从中心向各方向飞散的碎片 */
.bk-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 3px;
  border-radius: 1px;
  background: linear-gradient(
    to right,
    var(--bk-shard-color, #DC143C) 0%,
    rgba(255, 255, 255, 0.6) 50%,
    var(--bk-shard-color, #DC143C) 100%
  );
  box-shadow: 0 0 6px var(--bk-shard-glow, rgba(220, 20, 60, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--bk-shard-angle, 0deg)) translateX(0) scale(0);
  filter: blur(0.5px);
}

/* 碎片飞散动画 - 通过 shatter-burst 容器的 scale 驱动整体效果 */
.bk-shatter-burst .bk-shard {
  animation: bkShardFly 0.6s ease-out 0.15s forwards;
  will-change: transform, opacity;
}

@keyframes bkShardFly {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--bk-shard-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  30% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) rotate(var(--bk-shard-angle, 0deg)) translateX(20px) scale(1.5);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--bk-shard-angle, 0deg)) translateX(60px) scale(0.3);
    opacity: 0;
  }
}

/* 四维狂怒能量流 - 从四方螺旋汇聚至中心（入场一次性） */
.bk-stream {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    var(--bk-stream-color, #DC143C) 50%,
    rgba(220, 20, 60, 0.3) 100%
  );
  box-shadow:
    0 0 8px var(--bk-stream-color, #DC143C),
    0 0 16px var(--bk-stream-glow, rgba(220, 20, 60, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--bk-stream-angle, 0deg)) translateX(120px) scale(0);
  opacity: 0;
  animation: bkStreamGather 0.5s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes bkStreamGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--bk-stream-angle, 0deg)) translateX(120px) scale(0.5);
    opacity: 0;
  }
  30% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--bk-stream-angle, 0deg) + 180deg)) translateX(0) scale(1.8);
    opacity: 0;
  }
}

/* ---------- 持续循环动画 ---------- */

/* 狂暴血焰光晕 - 外层柔和血红发光氛围（持续显示） */
.bk-aura {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 50%,
    rgba(220, 20, 60, 0.1) 65%,
    rgba(139, 0, 0, 0.06) 80%,
    transparent 100%
  );
  opacity: 0;
  animation: bkAuraIn 0.5s ease-out 0.5s forwards,
             bkAuraPulse 2.5s ease-in-out 1s infinite;
  will-change: opacity, transform;
  z-index: 1;
}

@keyframes bkAuraIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes bkAuraPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.06);
  }
}

/* 狂暴光环主体 - 发光的赤橙双色狂暴光环边框（持续显示） */
.bk-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: bkHaloIn 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) 0.5s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes bkHaloIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

/* 光环能量场 - 半透明血色狂暴能量填充 */
.bk-halo-field {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 69, 0, 0.12) 0%,
    rgba(220, 20, 60, 0.08) 50%,
    transparent 80%
  );
  animation: bkFieldPulse 2s ease-in-out infinite;
  will-change: opacity;
}

@keyframes bkFieldPulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* 光环边框 - 四色狂暴光环边框 */
.bk-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(220, 20, 60, 0.6);
  background: conic-gradient(
    from 0deg,
    rgba(255, 69, 0, 0.5) 0deg,      /* 命中橙 */
    rgba(220, 20, 60, 0.35) 60deg,   /* 速攻赤 */
    rgba(139, 0, 0, 0.5) 120deg,     /* 嗜血暗红 */
    rgba(75, 0, 130, 0.35) 180deg,   /* 破甲紫 */
    rgba(255, 69, 0, 0.5) 240deg,    /* 命中橙 */
    rgba(220, 20, 60, 0.35) 300deg,  /* 速攻赤 */
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
    0 0 12px rgba(220, 20, 60, 0.5),
    inset 0 0 12px rgba(255, 69, 0, 0.3);
  animation: bkBorderGlow 1.8s ease-in-out infinite;
  will-change: opacity, box-shadow;
}

@keyframes bkBorderGlow {
  0%, 100% {
    opacity: 0.7;
    box-shadow:
      0 0 12px rgba(220, 20, 60, 0.5),
      inset 0 0 12px rgba(255, 69, 0, 0.3);
  }
  50% {
    opacity: 1;
    box-shadow:
      0 0 18px rgba(220, 20, 60, 0.9),
      0 0 8px rgba(255, 69, 0, 0.5),
      0 0 8px rgba(75, 0, 130, 0.3),
      inset 0 0 8px rgba(255, 69, 0, 0.5);
  }
}

/* 外层裂痕符文圆环 - 顺时针持续旋转 */
.bk-crack-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  opacity: 0;
  will-change: transform, opacity;
  z-index: 4;
}

.bk-crack-ring.ring-outer {
  width: 95%;
  height: 95%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: bkRingOuterIn 0.4s ease-out 0.55s forwards,
             bkRingOuterSpin 4.5s linear 0.95s infinite;
}

.bk-crack-ring.ring-inner {
  width: 70%;
  height: 70%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: bkRingInnerIn 0.4s ease-out 0.6s forwards,
             bkRingInnerSpin 3.5s linear 1s infinite;
}

/* 外圈裂痕符文 - 8道赤色裂痕纹路 */
.bk-crack-ring.ring-outer .bk-crack-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dashed rgba(220, 20, 60, 0.5);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(220, 20, 60, 0.2) 15deg,
    transparent 30deg,
    transparent 45deg,
    rgba(255, 69, 0, 0.2) 60deg,
    transparent 75deg,
    transparent 90deg,
    rgba(220, 20, 60, 0.2) 105deg,
    transparent 120deg,
    transparent 135deg,
    rgba(255, 69, 0, 0.2) 150deg,
    transparent 165deg,
    transparent 180deg,
    rgba(220, 20, 60, 0.2) 195deg,
    transparent 210deg,
    transparent 225deg,
    rgba(255, 69, 0, 0.2) 240deg,
    transparent 255deg,
    transparent 270deg,
    rgba(220, 20, 60, 0.2) 285deg,
    transparent 300deg,
    transparent 315deg,
    rgba(255, 69, 0, 0.2) 330deg,
    transparent 345deg,
    transparent 360deg
  );
  box-shadow: 0 0 6px rgba(220, 20, 60, 0.3);
}

/* 内圈裂痕符文 - 四色裂痕符文（橙/赤/暗红/紫交替） */
.bk-crack-ring.ring-inner .bk-crack-ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dotted rgba(255, 69, 0, 0.4);
  background: conic-gradient(
    from 0deg,
    rgba(255, 69, 0, 0.2) 0deg,
    transparent 30deg,
    transparent 60deg,
    rgba(220, 20, 60, 0.2) 90deg,
    transparent 120deg,
    transparent 150deg,
    rgba(139, 0, 0, 0.2) 180deg,
    transparent 210deg,
    transparent 240deg,
    rgba(75, 0, 130, 0.2) 270deg,
    transparent 300deg,
    transparent 330deg,
    rgba(255, 69, 0, 0.2) 360deg
  );
  box-shadow: inset 0 0 5px rgba(220, 20, 60, 0.15);
}

@keyframes bkRingOuterIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
}

@keyframes bkRingOuterSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.7; }
}

@keyframes bkRingInnerIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes bkRingInnerSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); opacity: 0.6; }
}

/* 破甲碎裂波纹 - 从中心向外周期性扩散的紫色碎裂波 */
.bk-shatter-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  border: 2px solid rgba(75, 0, 130, 0.6);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  z-index: 3;
}

.bk-shatter-wave.wave-1 {
  animation: bkShatterWave 2.2s ease-out 0.8s infinite;
}
.bk-shatter-wave.wave-2 {
  animation: bkShatterWave 2.2s ease-out 1.5s infinite;
  border-color: rgba(220, 20, 60, 0.5);
}
.bk-shatter-wave.wave-3 {
  animation: bkShatterWave 2.2s ease-out 1.9s infinite;
  border-color: rgba(255, 69, 0, 0.4);
}

@keyframes bkShatterWave {
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

/* 中央狂怒核心 - 发光的猩红狂暴之球，持续脉冲 */
.bk-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22%;
  height: 22%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: bkCoreIn 0.3s ease-out 0.65s forwards,
             bkCorePulse 1.5s ease-in-out 0.95s infinite;
  will-change: transform, opacity;
  z-index: 6;
}

.bk-core-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 69, 0, 0.9) 25%,
    rgba(220, 20, 60, 0.7) 60%,
    rgba(75, 0, 130, 0.3) 100%
  );
  box-shadow:
    0 0 12px rgba(220, 20, 60, 0.8),
    0 0 24px rgba(220, 20, 60, 0.4);
}

@keyframes bkCoreIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes bkCorePulse {
  0%, 100% { transform: translate3d(-50%, -50%, 0) scale(1); }
  50% { transform: translate3d(-50%, -50%, 0) scale(1.2); }
}

/* 烈焰粒子环绕 - 8颗粒子沿圆形轨道持续旋转 */
.bk-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: bkOrbitIn 0.3s ease-out 0.7s forwards,
             bkOrbitSpin 4s linear 1s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes bkOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes bkOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 1; }
}

/* 环绕粒子 - 四种颜色对应四维增益 */
.bk-orbit-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    var(--bk-orbit-color, #DC143C) 50%,
    rgba(220, 20, 60, 0.3) 100%
  );
  box-shadow: 0 0 6px var(--bk-orbit-glow, rgba(220, 20, 60, 0.8));
  transform: translate3d(-50%, -50%, 0) rotate(var(--bk-orbit-angle, 0deg)) translateY(-45%);
}

/* 闪电裂纹 - 周期性迸发的能量裂纹，代表格挡穿透 */
.bk-crack-flash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 88%;
  height: 88%;
  border-radius: 50%;
  border: 2px solid rgba(75, 0, 130, 0.6);
  background: transparent;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.bk-crack-flash.crack-1 {
  animation: bkCrackFlash 3.5s ease-out 1.5s infinite;
}
.bk-crack-flash.crack-2 {
  animation: bkCrackFlash 4.5s ease-out 3s infinite;
  border-color: rgba(220, 20, 60, 0.6);
}
.bk-crack-flash.crack-3 {
  animation: bkCrackFlash 5s ease-out 4.2s infinite;
  border-color: rgba(255, 69, 0, 0.6);
}

@keyframes bkCrackFlash {
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
.bk-target {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50%;
  height: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  opacity: 0;
  animation: bkTargetFlash 3s ease-in-out 2s infinite;
  will-change: transform, opacity;
  z-index: 5;
}

/* 准星十字线 - 水平线 */
.bk-target::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 69, 0, 0.6) 20%,
    rgba(255, 255, 255, 0.9) 50%,
    rgba(255, 69, 0, 0.6) 80%,
    transparent 100%
  );
  transform: translateY(-50%);
  box-shadow: 0 0 4px rgba(255, 69, 0, 0.6);
}

/* 准星十字线 - 垂直线 */
.bk-target::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 69, 0, 0.6) 20%,
    rgba(255, 255, 255, 0.9) 50%,
    rgba(255, 69, 0, 0.6) 80%,
    transparent 100%
  );
  transform: translateX(-50%);
  box-shadow: 0 0 4px rgba(255, 69, 0, 0.6);
}

@keyframes bkTargetFlash {
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
.bk-emblem {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 35%;
  height: 35%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  opacity: 0;
  animation: bkEmblemIn 0.3s ease-out 0.7s forwards,
             bkEmblemSpin 5s linear 1s infinite;
  will-change: transform, opacity;
  z-index: 7;
}

.bk-emblem-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(220, 20, 60, 0.5) 20deg,
    transparent 40deg,
    transparent 50deg,
    rgba(255, 69, 0, 0.5) 70deg,
    transparent 90deg,
    transparent 100deg,
    rgba(220, 20, 60, 0.5) 120deg,
    transparent 140deg,
    transparent 150deg,
    rgba(255, 69, 0, 0.5) 170deg,
    transparent 190deg,
    transparent 200deg,
    rgba(220, 20, 60, 0.5) 220deg,
    transparent 240deg,
    transparent 250deg,
    rgba(255, 69, 0, 0.5) 270deg,
    transparent 290deg,
    transparent 300deg,
    rgba(220, 20, 60, 0.5) 320deg,
    transparent 340deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  mask: radial-gradient(circle, transparent 40%, black 45%, black 55%, transparent 60%);
  filter: blur(0.5px);
}

@keyframes bkEmblemIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes bkEmblemSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); opacity: 0.6; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .bk-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
