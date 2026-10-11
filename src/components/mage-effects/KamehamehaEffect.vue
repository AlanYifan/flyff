<!--
  @file KamehamehaEffect.vue
  @generated 2026-07-21
  @description 龟派气功 - 聚气凝神·气功弹成形·能量波发射·命中爆发·余韵消散
  格斗宗师W技能（combat_master_w）：集中精神，向敌人发射巨大能量波

  定位方式：Teleport to body + position: fixed
  - 通过 getBoundingClientRect() 获取玩家头像(#playerAvatar)和怪物头像(.enemy-icon)的真实屏幕坐标
  - 聚气点定位在玩家头像中心，命中点定位在怪物头像中心
  - 能量光束从玩家头像中心发射到怪物头像中心，根据两点连线自动旋转角度
  - GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排

  动画总时长：1.3秒
    ⓪ 聚气凝神（0s ~ 0.35s）- 暗幕降临 + 蓝色聚气法阵 + 16颗气粒子螺旋汇聚至聚气点
    ① 气功弹成形（0.2s ~ 0.55s）- 白蓝能量球凝聚脉动 + 三层环绕光环 + 电弧缠绕
    ② 能量波发射（0.45s ~ 0.85s）- 巨型横向能量光束贯穿 + 波头气团推进 + 螺旋光环 + 速度线
    ③ 命中爆发（0.7s ~ 1.05s）- 命中爆闪 + 3层冲击波环 + 8道气刃辐射 + 地面气浪扩散
    ④ 余韵消散（0.9s ~ 1.3s）- 12颗气粒子上升消散 + 蓝辉余韵
  色彩方案：核心白(#FFFFFF) + 天青(#4FC3F7) + 气蓝(#29B6F6) + 深蓝(#1565C0) + 电光青(#00E5FF)
-->
<template>
  <Teleport to="body">
    <div v-if="ready" class="khh-3d-stage" :style="stageStyle">
      <!-- ===== 阶段⓪：聚气凝神 ===== -->
      <!-- 暗幕 - 深蓝覆盖，能量聚集前的压迫感 -->
      <div class="khh-dim"></div>

      <!-- 聚气法阵 - 聚气点脚下旋转的蓝色能量阵 -->
      <div class="khh-rune"></div>

      <!-- 聚气粒子 - 从四周螺旋汇聚至聚气点（玩家头像中心） -->
      <div
        v-for="i in 16"
        :key="'khh-gather-' + i"
        class="khh-gather-particle"
        :style="getGatherStyle(i)"
      ></div>

      <!-- ===== 阶段①：气功弹成形 ===== -->
      <!-- 气功弹 - 聚气点处凝聚的白蓝能量球 -->
      <div class="khh-sphere">
        <!-- 能量球核心 - 高亮白核 -->
        <div class="khh-sphere-core"></div>
        <!-- 能量球外层气场 - 蓝色辉光 -->
        <div class="khh-sphere-aura"></div>
        <!-- 三层环绕光环 - 交错旋转 -->
        <div class="khh-sphere-ring ring-a"></div>
        <div class="khh-sphere-ring ring-b"></div>
        <div class="khh-sphere-ring ring-c"></div>
        <!-- 电弧缠绕 - 两道锯齿电光 -->
        <div class="khh-sphere-arc arc-1"></div>
        <div class="khh-sphere-arc arc-2"></div>
      </div>

      <!-- ===== 阶段②：能量波发射 ===== -->
      <!-- 光束旋转容器 - 定位在玩家头像中心，根据玩家→怪物连线角度旋转 -->
      <div class="khh-beam-rotor" :style="rotorStyle">
        <!-- 能量光束 - 从聚气点向怪物方向贯穿的巨型气柱 -->
        <div class="khh-beam">
          <!-- 光束外层气场 - 最宽的淡蓝晕光 -->
          <div class="khh-beam-outer"></div>
          <!-- 光束中层辉光 - 天青辉光 -->
          <div class="khh-beam-glow"></div>
          <!-- 光束核心 - 高亮白芯 -->
          <div class="khh-beam-core"></div>
        </div>

        <!-- 波头气团 - 光束前端推进的压缩气团 -->
        <div class="khh-beam-head"></div>

        <!-- 光束螺旋光环 - 沿光束推进的4道能量环 -->
        <div
          v-for="i in 4"
          :key="'khh-coil-' + i"
          class="khh-beam-coil"
          :style="getCoilStyle(i)"
        ></div>

        <!-- 速度线 - 光束上下两侧向后拉伸的气流线 -->
        <div
          v-for="i in 6"
          :key="'khh-speed-' + i"
          class="khh-speed-line"
          :style="getSpeedLineStyle(i)"
        ></div>
      </div>

      <!-- ===== 阶段③：命中爆发 ===== -->
      <!-- 命中爆闪 - 能量波命中瞬间的蓝白爆闪 -->
      <div class="khh-impact-flash"></div>

      <!-- 3层冲击波环 - 从命中点（怪物头像中心）向外扩散 -->
      <div class="khh-shockwave-ring ring-1"></div>
      <div class="khh-shockwave-ring ring-2"></div>
      <div class="khh-shockwave-ring ring-3"></div>

      <!-- 8道气刃 - 从命中点呈放射状爆射 -->
      <div
        v-for="i in 8"
        :key="'khh-blade-' + i"
        class="khh-blade"
        :style="getBladeStyle(i)"
      ></div>

      <!-- 地面气浪 - 命中点沿地面扩散的蓝色气浪环 -->
      <div class="khh-ground-wave"></div>

      <!-- ===== 阶段④：余韵消散 ===== -->
      <!-- 上升气粒子 - 命中点残留能量缓缓上升消散 -->
      <div
        v-for="i in 12"
        :key="'khh-rise-' + i"
        class="khh-rise-particle"
        :style="getRiseStyle(i)"
      ></div>

      <!-- 蓝辉余韵 - 最后的能量余晖 -->
      <div class="khh-afterglow"></div>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * 龟派气功 - 聚气凝神·气功弹成形·能量波发射·命中爆发·余韵消散
 * 格斗宗师W技能（combat_master_w）单体特效组件，以核心白和气蓝为主色调
 * 展现双手聚气形成气功弹、发射巨大横向能量波贯穿命中敌人的视觉效果
 *
 * 定位方式：Teleport to body + position: fixed
 * - 聚气点定位在玩家头像中心（#playerAvatar getBoundingClientRect）
 * - 命中点定位在怪物头像中心（enemy-container-{index} .enemy-icon getBoundingClientRect）
 * - 能量光束从玩家头像中心发射到怪物头像中心，根据两点连线自动旋转角度
 * - 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 * - 动画总时长1.3秒
 *
 * @prop {number} targetIndex - 目标怪物索引（用于定位怪物头像位置）
 */

import { ref, onMounted, onUnmounted, nextTick } from 'vue'

// 组件使用 Teleport 作为根节点，需禁用 attrs 自动继承，否则 Vue 会警告
// "Extraneous non-props attributes could not be automatically inherited"
defineOptions({
  inheritAttrs: false
})

const props = defineProps({
  /** 目标怪物索引（用于定位命中位置） */
  targetIndex: {
    type: Number,
    default: 0
  }
})

/** 特效是否就绪显示（位置计算完成后才渲染） */
const ready = ref(false)

/** 舞台样式（包含所有定位CSS变量） */
const stageStyle = ref({})

/** 光束旋转容器样式（包含距离和旋转角度变量） */
const rotorStyle = ref({})

/**
 * 组件挂载后：
 * 1. 获取玩家头像和怪物头像的屏幕坐标
 * 2. 计算两点间距离和角度
 * 3. 设置CSS变量驱动所有元素定位
 */
onMounted(async () => {
  try {
    await nextTick()

    // 查找玩家头像元素
    const playerAvatar = document.getElementById('playerAvatar')
    // 查找目标怪物头像元素
    const targetEl = document.getElementById('enemy-container-' + props.targetIndex)
    const enemyIcon = targetEl?.querySelector('.enemy-icon')

    // 计算玩家头像中心屏幕坐标
    let startX = 0
    let startY = 0
    if (playerAvatar) {
      const avatarRect = playerAvatar.getBoundingClientRect()
      startX = Math.round(avatarRect.left + avatarRect.width / 2)
      startY = Math.round(avatarRect.top + avatarRect.height / 2)
    } else {
      // 找不到玩家头像时，使用屏幕左侧中部作为兜底
      startX = Math.round(window.innerWidth * 0.15)
      startY = Math.round(window.innerHeight * 0.5)
    }

    // 计算怪物头像中心屏幕坐标
    let endX = 0
    let endY = 0
    if (enemyIcon) {
      const iconRect = enemyIcon.getBoundingClientRect()
      endX = Math.round(iconRect.left + iconRect.width / 2)
      endY = Math.round(iconRect.top + iconRect.height / 2)
    } else {
      // 找不到怪物头像时，使用屏幕右侧中部作为兜底
      endX = Math.round(window.innerWidth * 0.75)
      endY = Math.round(window.innerHeight * 0.5)
    }

    // 计算玩家→怪物连线的距离和角度
    const dx = endX - startX
    const dy = endY - startY
    const distance = Math.max(1, Math.hypot(dx, dy))
    const angle = Math.atan2(dy, dx) * 180 / Math.PI

    // 设置舞台CSS变量（像素坐标，全屏覆盖）
    stageStyle.value = {
      '--khh-start-x': `${startX}px`,
      '--khh-start-y': `${startY}px`,
      '--khh-end-x': `${endX}px`,
      '--khh-end-y': `${endY}px`
    }

    // 设置光束旋转容器CSS变量（距离和角度）
    rotorStyle.value = {
      '--khh-dist': `${distance}px`,
      '--khh-angle': `${angle}deg`
    }

    ready.value = true
  } catch (e) {
    console.warn('[KamehamehaEffect] 初始化失败:', e)
    // 出错时使用兜底坐标显示
    stageStyle.value = {
      '--khh-start-x': `${Math.round(window.innerWidth * 0.15)}px`,
      '--khh-start-y': `${Math.round(window.innerHeight * 0.5)}px`,
      '--khh-end-x': `${Math.round(window.innerWidth * 0.75)}px`,
      '--khh-end-y': `${Math.round(window.innerHeight * 0.5)}px`
    }
    rotorStyle.value = {
      '--khh-dist': `${Math.round(window.innerWidth * 0.6)}px`,
      '--khh-angle': '0deg'
    }
    ready.value = true
  }
})

onUnmounted(() => {
  ready.value = false
})

/**
 * 生成聚气粒子的样式
 * 粒子分布于聚气点四周，沿各自角度螺旋汇聚至聚气点
 * @param {number} index - 粒子序号（1~16）
 * @returns {Object} CSS样式对象，含角度、距离、尺寸、延迟
 */
function getGatherStyle (index) {
  const angle = (index - 1) * 22.5 + (index % 2) * 6
  const distance = 120 + (index % 4) * 24
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.008
  return {
    '--khh-gather-angle': `${angle}deg`,
    '--khh-gather-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成光束螺旋光环的样式
 * 4道能量环沿光束方向依次推进，营造螺旋推进感
 * @param {number} index - 光环序号（1~4）
 * @returns {Object} CSS样式对象，含推进延迟、垂直偏移、缩放
 */
function getCoilStyle (index) {
  const delay = 0.45 + (index - 1) * 0.05
  const yOffset = (index % 2 === 0 ? -1 : 1) * (4 + (index % 3) * 3)
  const scale = 0.75 + (index % 3) * 0.18
  return {
    '--khh-coil-y': `${yOffset}px`,
    '--khh-coil-scale': scale,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成速度线的样式
 * 分布于光束上下两侧，发射瞬间向后拉伸，强化贯穿速度感
 * @param {number} index - 速度线序号（1~6）
 * @returns {Object} CSS样式对象，含垂直偏移、长度、延迟
 */
function getSpeedLineStyle (index) {
  const side = index % 2 === 0 ? 1 : -1
  const yOffset = side * (34 + (index % 3) * 16)
  const length = 90 + (index % 3) * 40
  const delay = 0.46 + (index % 3) * 0.02
  return {
    '--khh-speed-y': `${yOffset}px`,
    '--khh-speed-length': `${length}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成气刃的放射样式
 * @param {number} index - 气刃序号（1~8）
 * @returns {Object} CSS样式对象，含旋转角度、延迟
 */
function getBladeStyle (index) {
  const angle = (index - 1) * 45
  const delay = 0.7 + (index % 3) * 0.015
  return {
    '--khh-blade-angle': `${angle}deg`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成上升气粒子的样式
 * 命中点残留能量粒子，带水平随机偏移向上飘升消散
 * @param {number} index - 粒子序号（1~12）
 * @returns {Object} CSS样式对象，含水平偏移、上升高度、尺寸、延迟
 */
function getRiseStyle (index) {
  const xOffset = (index - 6.5) * 14 + (index % 2) * 8
  const riseHeight = 70 + (index % 4) * 25
  const size = 3 + (index % 3) * 2
  const delay = 0.9 + (index % 5) * 0.04
  return {
    '--khh-rise-x': `${xOffset}px`,
    '--khh-rise-h': `${riseHeight}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   龟派气功 (kamehameha) - 聚气凝神·气功弹成形·能量波发射·命中爆发·余韵消散
   技能描述：集中精神，向敌人发射巨大能量波
   定位方式：Teleport to body + position: fixed
   - 聚气点定位在玩家头像中心（--khh-start-x / --khh-start-y）
   - 命中点定位在怪物头像中心（--khh-end-x / --khh-end-y）
   - 能量光束从玩家头像中心发射到怪物头像中心（--khh-dist / --khh-angle）
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：1.3秒
     ⓪ 聚气凝神（0s ~ 0.35s）- 暗幕 + 蓝色法阵 + 16粒子螺旋汇聚
     ① 气功弹成形（0.2s ~ 0.55s）- 白蓝能量球 + 三层光环 + 电弧缠绕
     ② 能量波发射（0.45s ~ 0.85s）- 横向光束贯穿 + 波头气团 + 螺旋光环 + 速度线
     ③ 命中爆发（0.7s ~ 1.05s）- 命中爆闪 + 3层冲击波 + 8道气刃 + 地面气浪
     ④ 余韵消散（0.9s ~ 1.3s）- 12颗上升气粒子 + 蓝辉余韵
   ================================================================ */

/* 3D舞台 - 全屏fixed容器，透视容器为光束贯穿与气浪扩散提供深度视角 */
.khh-3d-stage {
  position: fixed;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
  pointer-events: none;
  z-index: 99998;
}

/* ---------- 阶段⓪：聚气凝神（0s ~ 0.35s）---------- */

/* 暗幕 - 深蓝覆盖，能量聚集前的压迫感 */
.khh-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at var(--khh-start-x, 50%) var(--khh-start-y, 50%),
    rgba(10, 25, 60, 0.55) 0%,
    rgba(8, 18, 45, 0.35) 50%,
    transparent 100%
  );
  animation: khhDim 1.3s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes khhDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  35% { opacity: 0.85; }
  65% { opacity: 0.4; }
  85% { opacity: 0.15; }
  100% { opacity: 0; }
}

/* 聚气法阵 - 聚气点（玩家头像中心）脚下旋转的蓝色能量阵 */
.khh-rune {
  position: absolute;
  left: var(--khh-start-x, 50%);
  top: var(--khh-start-y, 50%);
  width: 170px;
  height: 170px;
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: khhRuneIn 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) forwards,
             khhRuneFade 0.35s ease-out 0.35s forwards;
  will-change: transform, opacity;
  z-index: 2;
}

.khh-rune::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(41, 182, 246, 0.4) 30deg,
    rgba(79, 195, 247, 0.6) 60deg,
    rgba(41, 182, 246, 0.4) 90deg,
    transparent 140deg,
    rgba(0, 229, 255, 0.35) 190deg,
    rgba(255, 255, 255, 0.5) 220deg,
    rgba(0, 229, 255, 0.35) 250deg,
    transparent 300deg,
    rgba(41, 182, 246, 0.4) 340deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 22%, black 45%, transparent 78%);
  mask: radial-gradient(circle, transparent 22%, black 45%, transparent 78%);
  box-shadow: 0 0 30px rgba(41, 182, 246, 0.4);
  will-change: transform;
  animation: khhSpinCW 0.6s linear infinite;
}

@keyframes khhSpinCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes khhSpinCCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
}

@keyframes khhRuneIn {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1.15); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1); opacity: 0.9; }
}

@keyframes khhRuneFade {
  0% { opacity: 0.9; }
  100% { opacity: 0; }
}

/* 聚气粒子 - 从四周螺旋汇聚至玩家头像中心 */
.khh-gather-particle {
  position: absolute;
  left: var(--khh-start-x, 50%);
  top: var(--khh-start-y, 50%);
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(79, 195, 247, 0.8) 50%,
    rgba(21, 101, 192, 0.4) 100%
  );
  box-shadow: 0 0 8px rgba(41, 182, 246, 0.8);
  opacity: 0;
  animation: khhGather 0.35s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes khhGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--khh-gather-angle, 0deg)) translateX(var(--khh-gather-distance, 130px)) scale(1);
    opacity: 0;
  }
  25% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--khh-gather-angle, 0deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段①：气功弹成形（0.2s ~ 0.55s）---------- */

/* 气功弹容器 - 玩家头像中心处凝聚的能量球体 */
.khh-sphere {
  position: absolute;
  left: var(--khh-start-x, 50%);
  top: var(--khh-start-y, 50%);
  width: 90px;
  height: 90px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: khhSphereIn 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) 0.2s forwards,
             khhSphereFade 0.15s ease-in 0.45s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes khhSphereIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  55% { transform: translate3d(-50%, -50%, 0) scale(1.25); opacity: 1; }
  75% { transform: translate3d(-50%, -50%, 0) scale(0.95); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
}

/* 气功弹在发射瞬间融入波头，快速隐去 */
@keyframes khhSphereFade {
  0% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(0.6); opacity: 0; }
}

/* 能量球核心 - 高亮白核 */
.khh-sphere-core {
  position: absolute;
  inset: 22%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 38% 35%,
    #FFFFFF 0%,
    rgba(255, 255, 255, 0.95) 35%,
    rgba(79, 195, 247, 0.7) 75%,
    rgba(41, 182, 246, 0.3) 100%
  );
  box-shadow:
    0 0 18px rgba(255, 255, 255, 0.9),
    0 0 36px rgba(41, 182, 246, 0.7);
  animation: khhCorePulse 0.18s ease-in-out 0.2s infinite alternate;
  will-change: transform;
}

@keyframes khhCorePulse {
  0% { transform: scale(0.92); }
  100% { transform: scale(1.08); }
}

/* 能量球外层气场 - 蓝色辉光 */
.khh-sphere-aura {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(79, 195, 247, 0.55) 0%,
    rgba(41, 182, 246, 0.3) 45%,
    transparent 72%
  );
  filter: blur(2px);
  animation: khhAuraPulse 0.24s ease-in-out 0.2s infinite alternate;
  will-change: transform, opacity;
}

@keyframes khhAuraPulse {
  0% { transform: scale(0.95); opacity: 0.75; }
  100% { transform: scale(1.12); opacity: 1; }
}

/* 三层环绕光环 - 交错旋转的能量环 */
.khh-sphere-ring {
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  border: 2px solid transparent;
  will-change: transform;
  backface-visibility: hidden;
}

.khh-sphere-ring.ring-a {
  border-top-color: rgba(255, 255, 255, 0.9);
  border-right-color: rgba(79, 195, 247, 0.6);
  animation: khhSpinCW 0.4s linear infinite;
}

.khh-sphere-ring.ring-b {
  inset: 2%;
  border-bottom-color: rgba(0, 229, 255, 0.8);
  border-left-color: rgba(41, 182, 246, 0.5);
  animation: khhSpinCCW 0.55s linear infinite;
}

.khh-sphere-ring.ring-c {
  inset: 16%;
  border-top-color: rgba(79, 195, 247, 0.7);
  border-left-color: rgba(255, 255, 255, 0.5);
  animation: khhSpinCW 0.3s linear infinite;
}

/* 电弧缠绕 - 球体表面流窜的锯齿电光 */
.khh-sphere-arc {
  position: absolute;
  inset: -6%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 255, 255, 0.85) 12deg,
    transparent 30deg,
    transparent 170deg,
    rgba(0, 229, 255, 0.7) 185deg,
    transparent 205deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 55%, black 72%, transparent 92%);
  mask: radial-gradient(circle, transparent 55%, black 72%, transparent 92%);
  filter: blur(0.5px);
  will-change: transform, opacity;
}

.khh-sphere-arc.arc-1 {
  animation: khhSpinCW 0.3s linear infinite, khhArcFlicker 0.12s steps(2) infinite;
}

.khh-sphere-arc.arc-2 {
  animation: khhSpinCCW 0.42s linear infinite, khhArcFlicker 0.15s steps(2) infinite;
}

@keyframes khhArcFlicker {
  0% { opacity: 0.4; }
  100% { opacity: 1; }
}

/* ---------- 阶段②：能量波发射（0.45s ~ 0.85s）---------- */

/* 光束旋转容器 - 定位在玩家头像中心，根据玩家→怪物连线角度旋转
   内部所有光束元素沿X轴方向排列，通过容器旋转实现指向怪物的效果 */
.khh-beam-rotor {
  position: absolute;
  left: var(--khh-start-x, 50%);
  top: var(--khh-start-y, 50%);
  transform: rotate(var(--khh-angle, 0deg));
  transform-origin: 0% 50%;
  will-change: transform;
  z-index: 5;
}

/* 能量光束容器 - 从玩家头像中心向怪物方向贯穿，scaleX 由 0 展开至 1 */
.khh-beam {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--khh-dist, 60vw);
  height: 64px;
  transform: translate3d(0, -50%, 0) scaleX(0);
  transform-origin: 0% 50%;
  opacity: 0;
  animation: khhBeamFire 0.28s cubic-bezier(0.15, 0.6, 0.25, 1) 0.45s forwards,
             khhBeamFade 0.25s ease-out 0.78s forwards;
  will-change: transform, opacity;
  z-index: 6;
}

@keyframes khhBeamFire {
  0% { transform: translate3d(0, -50%, 0) scaleX(0); opacity: 0; }
  12% { opacity: 1; }
  100% { transform: translate3d(0, -50%, 0) scaleX(1); opacity: 1; }
}

@keyframes khhBeamFade {
  0% { transform: translate3d(0, -50%, 0) scaleX(1) scaleY(1); opacity: 1; }
  100% { transform: translate3d(0, -50%, 0) scaleX(1) scaleY(0.25); opacity: 0; }
}

/* 光束外层气场 - 最宽的淡蓝晕光 */
.khh-beam-outer {
  position: absolute;
  inset: -55% 0;
  background: linear-gradient(
    to right,
    rgba(41, 182, 246, 0.5) 0%,
    rgba(79, 195, 247, 0.42) 40%,
    rgba(41, 182, 246, 0.5) 100%
  );
  filter: blur(6px);
  border-radius: 50% / 100%;
  animation: khhBeamBreath 0.16s ease-in-out 0.45s infinite alternate;
  will-change: transform, opacity;
}

/* 光束中层辉光 - 天青辉光 */
.khh-beam-glow {
  position: absolute;
  inset: -12% 0;
  background: linear-gradient(
    to right,
    rgba(79, 195, 247, 0.85) 0%,
    rgba(0, 229, 255, 0.75) 35%,
    rgba(79, 195, 247, 0.85) 100%
  );
  filter: blur(2px);
  border-radius: 50% / 100%;
  box-shadow: 0 0 24px rgba(41, 182, 246, 0.8);
  animation: khhBeamBreath 0.13s ease-in-out 0.45s infinite alternate;
  will-change: transform, opacity;
}

/* 光束核心 - 高亮白芯 */
.khh-beam-core {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 34%;
  transform: translate3d(0, -50%, 0);
  background: linear-gradient(
    to right,
    #FFFFFF 0%,
    rgba(255, 255, 255, 0.98) 50%,
    #FFFFFF 100%
  );
  border-radius: 50% / 100%;
  box-shadow:
    0 0 12px rgba(255, 255, 255, 0.95),
    0 0 28px rgba(79, 195, 247, 0.8);
  animation: khhCoreFlow 0.12s linear 0.45s infinite;
  will-change: opacity;
}

/* 光束呼吸感 - 整体轻微脉动，模拟能量不稳定输出 */
@keyframes khhBeamBreath {
  0% { transform: scaleY(0.88); opacity: 0.85; }
  100% { transform: scaleY(1.12); opacity: 1; }
}

/* 核心流光 - 白芯高速明暗流动 */
@keyframes khhCoreFlow {
  0% { opacity: 0.9; }
  50% { opacity: 1; }
  100% { opacity: 0.9; }
}

/* 波头气团 - 光束前端推进的压缩气团，沿光束方向从起点推进到终点 */
.khh-beam-head {
  position: absolute;
  top: 0;
  left: 0;
  width: 66px;
  height: 66px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 40% 40%,
    #FFFFFF 0%,
    rgba(255, 255, 255, 0.9) 30%,
    rgba(79, 195, 247, 0.65) 65%,
    rgba(41, 182, 246, 0.2) 100%
  );
  box-shadow:
    0 0 20px rgba(255, 255, 255, 0.9),
    0 0 44px rgba(41, 182, 246, 0.75);
  transform: translate3d(-50%, -50%, 0) scale(0.4);
  opacity: 0;
  animation: khhBeamHead 0.3s cubic-bezier(0.15, 0.6, 0.25, 1) 0.45s forwards;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes khhBeamHead {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.4);
    opacity: 0;
  }
  15% { opacity: 1; }
  85% {
    transform: translate3d(calc(-50% + var(--khh-dist, 60vw)), -50%, 0) scale(1.15);
    opacity: 1;
  }
  100% {
    transform: translate3d(calc(-50% + var(--khh-dist, 60vw)), -50%, 0) scale(1.3);
    opacity: 0;
  }
}

/* 光束螺旋光环 - 沿光束推进的能量环 */
.khh-beam-coil {
  position: absolute;
  top: 0;
  left: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.75);
  box-shadow:
    0 0 12px rgba(79, 195, 247, 0.7),
    inset 0 0 8px rgba(0, 229, 255, 0.5);
  transform: translate3d(-50%, calc(-50% + var(--khh-coil-y, 0px)), 0) rotateX(72deg) scale(0.3);
  opacity: 0;
  animation: khhCoilTravel 0.32s cubic-bezier(0.2, 0.6, 0.3, 1) forwards;
  will-change: transform, opacity;
  backface-visibility: hidden;
  z-index: 7;
}

@keyframes khhCoilTravel {
  0% {
    transform: translate3d(-50%, calc(-50% + var(--khh-coil-y, 0px)), 0) rotateX(72deg) scale(0.3);
    opacity: 0;
  }
  20% { opacity: 0.95; }
  100% {
    transform: translate3d(calc(-50% + var(--khh-dist, 60vw)), calc(-50% + var(--khh-coil-y, 0px)), 0) rotateX(72deg) scale(var(--khh-coil-scale, 1));
    opacity: 0;
  }
}

/* 速度线 - 光束上下两侧向后拉伸的气流线 */
.khh-speed-line {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--khh-speed-length, 100px);
  height: 2px;
  transform: translate3d(0, calc(-50% + var(--khh-speed-y, 0px)), 0) scaleX(0);
  transform-origin: 100% 50%;
  background: linear-gradient(
    to left,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(79, 195, 247, 0.6) 45%,
    transparent 100%
  );
  opacity: 0;
  animation: khhSpeedLine 0.3s ease-out forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes khhSpeedLine {
  0% {
    transform: translate3d(0, calc(-50% + var(--khh-speed-y, 0px)), 0) scaleX(0);
    opacity: 0;
  }
  25% {
    transform: translate3d(0, calc(-50% + var(--khh-speed-y, 0px)), 0) scaleX(1);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(60%, calc(-50% + var(--khh-speed-y, 0px)), 0) scaleX(1.4);
    opacity: 0;
  }
}

/* ---------- 阶段③：命中爆发（0.7s ~ 1.05s）---------- */

/* 命中爆闪 - 能量波命中瞬间的蓝白爆闪，定位在怪物头像中心 */
.khh-impact-flash {
  position: absolute;
  left: var(--khh-end-x, 50%);
  top: var(--khh-end-y, 50%);
  width: 400px;
  height: 400px;
  transform: translate3d(-50%, -50%, 0);
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(79, 195, 247, 0.65) 22%,
    rgba(21, 101, 192, 0.3) 55%,
    transparent 85%
  );
  opacity: 0;
  animation: khhImpactFlash 0.4s ease-out 0.7s forwards;
  will-change: opacity;
  z-index: 8;
}

@keyframes khhImpactFlash {
  0%, 100% { opacity: 0; }
  8% { opacity: 1; }
  25% { opacity: 0.45; }
  50% { opacity: 0.6; }
  80% { opacity: 0; }
}

/* 3层冲击波环 - 从命中点（怪物头像中心）向外扩散 */
.khh-shockwave-ring {
  position: absolute;
  left: var(--khh-end-x, 50%);
  top: var(--khh-end-y, 50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.85);
  box-shadow:
    0 0 20px rgba(79, 195, 247, 0.65),
    inset 0 0 16px rgba(0, 229, 255, 0.45);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  backface-visibility: hidden;
  z-index: 9;
}

.khh-shockwave-ring.ring-1 {
  animation: khhShockwaveRing 0.4s ease-out 0.7s forwards;
}

.khh-shockwave-ring.ring-2 {
  border-color: rgba(79, 195, 247, 0.7);
  animation: khhShockwaveRing 0.45s ease-out 0.74s forwards;
}

.khh-shockwave-ring.ring-3 {
  border-color: rgba(0, 229, 255, 0.5);
  animation: khhShockwaveRing 0.5s ease-out 0.78s forwards;
}

@keyframes khhShockwaveRing {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  12% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(9);
    opacity: 0;
  }
}

/* 8道气刃 - 从命中点（怪物头像中心）呈放射状爆射 */
.khh-blade {
  position: absolute;
  left: var(--khh-end-x, 50%);
  top: var(--khh-end-y, 50%);
  width: 84px;
  height: 6px;
  transform-origin: 0% 50%;
  transform: translate3d(0, -50%, 0) rotate(var(--khh-blade-angle, 0deg)) scaleX(0);
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(79, 195, 247, 0.8) 25%,
    rgba(21, 101, 192, 0.55) 65%,
    transparent 100%
  );
  box-shadow:
    0 0 10px rgba(79, 195, 247, 0.75),
    0 0 20px rgba(41, 182, 246, 0.45);
  border-radius: 0 50% 50% 0;
  opacity: 0;
  animation: khhBladeBurst 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
  will-change: transform, opacity;
  z-index: 10;
}

@keyframes khhBladeBurst {
  0% {
    transform: translate3d(0, -50%, 0) rotate(var(--khh-blade-angle, 0deg)) scaleX(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(0, -50%, 0) rotate(var(--khh-blade-angle, 0deg)) scaleX(1);
    opacity: 1;
  }
  70% {
    transform: translate3d(0, -50%, 0) rotate(var(--khh-blade-angle, 0deg)) scaleX(1.5);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(0, -50%, 0) rotate(var(--khh-blade-angle, 0deg)) scaleX(2);
    opacity: 0;
  }
}

/* 地面气浪 - 命中点沿地面扩散的蓝色气浪环 */
.khh-ground-wave {
  position: absolute;
  left: var(--khh-end-x, 50%);
  top: var(--khh-end-y, 50%);
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 3px solid rgba(79, 195, 247, 0.6);
  box-shadow:
    0 0 24px rgba(41, 182, 246, 0.5),
    inset 0 0 20px rgba(0, 229, 255, 0.35);
  transform: translate3d(-50%, -50%, 0) rotateX(74deg) scale(0);
  opacity: 0;
  animation: khhGroundWave 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) 0.72s forwards;
  will-change: transform, opacity;
  backface-visibility: hidden;
  z-index: 4;
}

@keyframes khhGroundWave {
  0% {
    transform: translate3d(-50%, -50%, 0) rotateX(74deg) scale(0);
    opacity: 0;
  }
  18% { opacity: 0.9; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotateX(74deg) scale(2.6);
    opacity: 0;
  }
}

/* ---------- 阶段④：余韵消散（0.9s ~ 1.3s）---------- */

/* 上升气粒子 - 命中点（怪物头像中心）残留能量缓缓上升消散 */
.khh-rise-particle {
  position: absolute;
  left: var(--khh-end-x, 50%);
  top: var(--khh-end-y, 50%);
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(79, 195, 247, 0.75) 55%,
    rgba(21, 101, 192, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(79, 195, 247, 0.7);
  transform: translate3d(calc(-50% + var(--khh-rise-x, 0px)), -50%, 0) scale(0.8);
  opacity: 0;
  animation: khhRise 0.4s ease-out forwards;
  will-change: transform, opacity;
  z-index: 11;
}

@keyframes khhRise {
  0% {
    transform: translate3d(calc(-50% + var(--khh-rise-x, 0px)), -50%, 0) scale(0.8);
    opacity: 0;
  }
  20% { opacity: 0.95; }
  100% {
    transform: translate3d(calc(-50% + var(--khh-rise-x, 0px)), calc(-50% - var(--khh-rise-h, 80px)), 0) scale(0.2);
    opacity: 0;
  }
}

/* 蓝辉余韵 - 最后的能量余晖，定位在怪物命中区域 */
.khh-afterglow {
  position: absolute;
  left: var(--khh-end-x, 50%);
  top: var(--khh-end-y, 50%);
  width: 500px;
  height: 500px;
  transform: translate3d(-50%, -50%, 0);
  background: radial-gradient(
    ellipse at center,
    rgba(79, 195, 247, 0.22) 0%,
    rgba(21, 101, 192, 0.1) 45%,
    transparent 80%
  );
  opacity: 0;
  animation: khhAfterglow 0.4s ease-out 0.95s forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes khhAfterglow {
  0% { opacity: 0; }
  25% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .khh-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
