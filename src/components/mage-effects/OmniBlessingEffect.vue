<!--
  @file OmniBlessingEffect.vue
  @generated 2026-07-06
  @description 全能祝福 - 圣光降临·十能凝聚·祝福绽放·全能护盾·圣光消散
  圣职者E技能（priest_e）：召唤圣光，赐福施法对象施加十位一体的全能祝福
  十位一体：生命之泉·天马行空·智力术·高效术·强身术·昏厥术·躲避术·力量术·敏捷术·命中术
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  动画总时长：2.0秒（一次性播放，BUFF施放时触发）
    ⓪ 圣光降临（0s ~ 0.4s）- 金色光柱从天而降 + 圣光暗幕 + 光芒绽放
    ① 十能凝聚（0.3s ~ 0.9s）- 10颗不同颜色能量光球从外围螺旋汇聚至中心
    ② 祝福绽放（0.6s ~ 1.3s）- 十色光环爆发 + 十芒星法阵展开 + 祝福波纹扩散
    ③ 全能护盾（1.0s ~ 1.6s）- 金色护盾光环环绕 + 十色粒子环绕旋转
    ④ 圣光消散（1.4s ~ 2.0s）- 光芒渐隐 + 余韵粒子上升消散
  色彩方案：圣光金(#FFD700) + 十色增益(翠绿/天蓝/紫/橙/棕红/暗金/青/红/黄绿/银白)
  定位：通过 JS 动态查找 #playerAvatar 元素，精确覆盖施法者头像区域
-->
<template>
  <!-- 祝福舞台 - 定位容器，通过 JS 动态定位到玩家头像上方 -->
  <div ref="stageRef" class="ob-stage" :style="stageStyle">
    <!-- ===== 阶段⓪：圣光降临（0s ~ 0.4s）===== -->
    <!-- 圣光暗幕 - 金色氛围笼罩 -->
    <div class="ob-dim"></div>

    <!-- 天降圣光柱 - 从顶部降下的金色祝福光柱 -->
    <div class="ob-beam"></div>

    <!-- 圣光绽放 - 光柱触地的径向爆发 -->
    <div class="ob-bloom"></div>

    <!-- ===== 阶段①：十能凝聚（0.3s ~ 0.9s）===== -->
    <!-- 10颗不同颜色的能量光球从外围螺旋汇聚至中心 -->
    <div
      v-for="i in 10"
      :key="'ob-orb-' + i"
      class="ob-orb"
      :style="getOrbStyle(i)"
    ></div>

    <!-- ===== 阶段②：祝福绽放（0.6s ~ 1.3s）===== -->
    <!-- 十色光环主体 - 发光的金色光环边框 -->
    <div class="ob-halo">
      <!-- 光环能量场 - 半透明金色祝福能量填充 -->
      <div class="ob-halo-field"></div>
      <!-- 光环边框 - 发光的圆环 -->
      <div class="ob-halo-border"></div>
    </div>

    <!-- 十芒星法阵 - 旋转的十芒星祝福法阵 -->
    <div class="ob-star">
      <div class="ob-star-inner"></div>
    </div>

    <!-- 外层符文圆环 - 顺时针旋转，金色圣光符文 -->
    <div class="ob-rune-ring rune-outer"></div>
    <!-- 内层符文圆环 - 逆时针旋转，十色祝福符文 -->
    <div class="ob-rune-ring rune-inner"></div>

    <!-- 祝福波纹 - 从中心向外扩散的光环 -->
    <div class="ob-wave wave-1"></div>
    <div class="ob-wave wave-2"></div>
    <div class="ob-wave wave-3"></div>

    <!-- 中央祝福核心 - 发光的金色祝福之球 -->
    <div class="ob-core">
      <div class="ob-core-inner"></div>
    </div>

    <!-- ===== 阶段③：全能护盾（1.0s ~ 1.6s）===== -->
    <!-- 十色粒子环绕旋转 - 10颗粒子沿圆形轨道旋转 -->
    <div class="ob-orbit">
      <div
        v-for="i in 10"
        :key="'ob-orbit-particle-' + i"
        class="ob-orbit-particle"
        :style="getOrbitParticleStyle(i)"
      ></div>
    </div>

    <!-- 全能护盾光环 - 金色护盾边框 -->
    <div class="ob-shield"></div>

    <!-- ===== 阶段④：圣光消散（1.4s ~ 2.0s）===== -->
    <!-- 上升圣光余烬 - 缓慢上浮的金色光粒 -->
    <div
      v-for="i in 8"
      :key="'ob-ember-' + i"
      class="ob-ember"
      :style="getEmberStyle(i)"
    ></div>

    <!-- 圣光余韵 - 最后的光芒消散 -->
    <div class="ob-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 全能祝福 - 圣光降临·十能凝聚·祝福绽放·全能护盾·圣光消散
 * 圣职者E技能（priest_e）特效组件
 * 召唤圣光，赐福施法对象施加十位一体的全能祝福
 * 十位一体：生命之泉·天马行空·智力术·高效术·强身术·昏厥术·躲避术·力量术·敏捷术·命中术
 * 以圣光金为主色调，十种颜色代表十种增益效果
 * 一次性播放动画，BUFF施放时触发，动画结束后由父组件移除
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

/** 十色增益颜色表 - 对应十位一体的十种增益 */
const TEN_COLORS = [
  '#50C878', // 生命之泉 - 翠绿
  '#87CEEB', // 天马行空 - 天蓝
  '#9370DB', // 智力术 - 紫色
  '#FFA500', // 高效术 - 橙色
  '#CD853F', // 强身术 - 棕红
  '#B8860B', // 昏晕术 - 暗金
  '#00CED1', // 躲避术 - 青色
  '#FF6347', // 力量术 - 红色
  '#9ACD32', // 敏捷术 - 黄绿
  '#C0C0C0'  // 命中术 - 银白
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

    // 查找定位父容器（.player-card-area）
    const positioningParent = stage.offsetParent
    if (!positioningParent) {
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
    // 更新头像位置失败，静默处理
  }
}

/**
 * 生成十能凝聚光球的样式
 * @param {number} index - 光球序号（1~10）
 * @returns {Object} CSS样式对象，含角度、颜色、尺寸、延迟
 */
function getOrbStyle (index) {
  const angle = (index - 1) * 36
  const color = TEN_COLORS[(index - 1) % 10]
  const size = 10 + (index % 3) * 3
  const delay = 0.3 + (index - 1) * 0.015
  return {
    '--ob-orb-angle': `${angle}deg`,
    '--ob-orb-color': color,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成十色环绕粒子的样式
 * @param {number} index - 粒子序号（1~10）
 * @returns {Object} CSS样式对象，含角度、颜色、尺寸
 */
function getOrbitParticleStyle (index) {
  const angle = (index - 1) * 36
  const color = TEN_COLORS[(index - 1) % 10]
  const size = 5 + (index % 2) * 2
  return {
    '--ob-orbit-angle': `${angle}deg`,
    '--ob-orbit-color': color,
    width: `${size}px`,
    height: `${size}px`
  }
}

/**
 * 生成圣光余烬的上浮样式
 * @param {number} index - 余烬序号（1~8）
 * @returns {Object} CSS样式对象，含水平偏移、上浮高度、尺寸、延迟
 */
function getEmberStyle (index) {
  const tx = (index % 2 === 0 ? 1 : -1) * (15 + (index % 4) * 12)
  const ty = -60 - (index % 3) * 25
  const size = 3 + (index % 3) * 2
  const delay = 1.4 + (index % 4) * 0.05
  return {
    '--ob-ember-tx': `${tx}px`,
    '--ob-ember-ty': `${ty}px`,
    '--ob-ember-size': `${size}px`,
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
   全能祝福 (omni_blessing) - 圣光降临·十能凝聚·祝福绽放·全能护盾·圣光消散
   技能描述：召唤圣光，赐福施法对象施加十位一体的全能祝福
   十位一体：生命之泉·天马行空·智力术·高效术·强身术·昏晕术·躲避术·力量术·敏捷术·命中术
   GPU加速：contain隔离 + will-change + backface-visibility + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：2.0秒
     ⓪ 圣光降临（0s ~ 0.4s）- 圣光柱 + 暗幕 + 绽放
     ① 十能凝聚（0.3s ~ 0.9s）- 10颗不同颜色光球螺旋汇聚
     ② 祝福绽放（0.6s ~ 1.3s）- 十色光环 + 十芒星法阵 + 波纹扩散
     ③ 全能护盾（1.0s ~ 1.6s）- 十色粒子环绕 + 金色护盾光环
     ④ 圣光消散（1.4s ~ 2.0s）- 余烬上浮 + 余韵消散
   ================================================================ */

/* 祝福舞台 - 定位容器 */
.ob-stage {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  contain: layout style;
}

/* ---------- 阶段⓪：圣光降临（0s ~ 0.4s）---------- */

/* 圣光暗幕 - 金色氛围笼罩 */
.ob-dim {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse at center,
    rgba(50, 38, 0, 0.4) 0%,
    rgba(40, 30, 0, 0.25) 50%,
    transparent 100%
  );
  animation: obDim 2s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes obDim {
  0% { opacity: 0; }
  10% { opacity: 1; }
  40% { opacity: 0.8; }
  75% { opacity: 0.3; }
  100% { opacity: 0; }
}

/* 天降圣光柱 - 从顶部降下的金色祝福光柱 */
.ob-beam {
  position: absolute;
  top: -20%;
  left: 50%;
  width: 60%;
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
  animation: obBeam 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  will-change: transform, opacity;
  z-index: 2;
}

@keyframes obBeam {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  30% { transform: translateX(-50%) scaleY(1); opacity: 1; }
  60% { transform: translateX(-50%) scaleY(1); opacity: 0.6; }
  100% { transform: translateX(-50%) scaleY(1); opacity: 0; }
}

/* 圣光绽放 - 光柱触地的径向爆发 */
.ob-bloom {
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
  animation: obBloom 0.5s ease-out 0.15s forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes obBloom {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  40% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2); opacity: 0; }
}

/* ---------- 阶段①：十能凝聚（0.3s ~ 0.9s）---------- */

/* 十能光球 - 从外围螺旋汇聚至中心 */
.ob-orb {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.95) 0%,
    var(--ob-orb-color, #FFD700) 50%,
    rgba(255, 215, 0, 0.3) 100%
  );
  box-shadow:
    0 0 8px var(--ob-orb-color, #FFD700),
    0 0 16px var(--ob-orb-color, #FFD700);
  transform: translate3d(-50%, -50%, 0) rotate(var(--ob-orb-angle, 0deg)) translateX(100px) scale(0);
  opacity: 0;
  animation: obOrbGather 0.5s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes obOrbGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--ob-orb-angle, 0deg)) translateX(100px) scale(0.5);
    opacity: 0;
  }
  30% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--ob-orb-angle, 0deg) + 180deg)) translateX(0) scale(1.5);
    opacity: 0;
  }
}

/* ---------- 阶段②：祝福绽放（0.6s ~ 1.3s）---------- */

/* 十色光环主体 */
.ob-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: obHaloIn 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) 0.6s forwards,
             obHaloOut 0.4s ease-in 1.4s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes obHaloIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes obHaloOut {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* 光环能量场 - 半透明金色祝福能量填充 */
.ob-halo-field {
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

/* 光环边框 - 发光的圆环 */
.ob-halo-border {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.6);
  box-shadow:
    0 0 12px rgba(255, 215, 0, 0.5),
    inset 0 0 12px rgba(255, 248, 220, 0.3);
}

/* 十芒星法阵 - 旋转的十芒星祝福法阵 */
.ob-star {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80%;
  height: 80%;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  opacity: 0;
  animation: obStarIn 0.4s ease-out 0.7s forwards,
             obStarSpin 1s linear 0.7s forwards,
             obStarOut 0.3s ease-in 1.5s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

.ob-star-inner {
  position: absolute;
  inset: 0;
  background: conic-gradient(
    from 0deg,
    rgba(80, 200, 120, 0.4) 0deg,     /* 生命之泉 - 翠绿 */
    rgba(135, 206, 235, 0.4) 36deg,   /* 天马行空 - 天蓝 */
    rgba(147, 112, 219, 0.4) 72deg,   /* 智力术 - 紫色 */
    rgba(255, 165, 0, 0.4) 108deg,    /* 高效术 - 橙色 */
    rgba(205, 133, 63, 0.4) 144deg,   /* 强身术 - 棕红 */
    rgba(184, 134, 11, 0.4) 180deg,   /* 昏晕术 - 暗金 */
    rgba(0, 206, 209, 0.4) 216deg,    /* 躲避术 - 青色 */
    rgba(255, 99, 71, 0.4) 252deg,    /* 力量术 - 红色 */
    rgba(154, 205, 50, 0.4) 288deg,   /* 敏捷术 - 黄绿 */
    rgba(192, 192, 192, 0.4) 324deg,  /* 命中术 - 银白 */
    rgba(80, 200, 120, 0.4) 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 30%, black 35%, black 48%, transparent 52%);
  mask: radial-gradient(circle, transparent 30%, black 35%, black 48%, transparent 52%);
  border-radius: 50%;
  filter: blur(1px);
}

@keyframes obStarIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(36deg); opacity: 0.8; }
}

@keyframes obStarSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(36deg); }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(180deg); }
}

@keyframes obStarOut {
  0% { opacity: 0.8; }
  100% { opacity: 0; }
}

/* 外层符文圆环 - 顺时针旋转 */
.ob-rune-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  opacity: 0;
  will-change: transform, opacity;
  z-index: 4;
}

.ob-rune-ring.rune-outer {
  width: 95%;
  height: 95%;
  border: 1px dashed rgba(255, 215, 0, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: obRuneOuterIn 0.4s ease-out 0.65s forwards,
             obRuneOuterSpin 1.5s linear 0.65s forwards,
             obRuneFade 0.4s ease-in 1.5s forwards;
}

.ob-rune-ring.rune-inner {
  width: 75%;
  height: 75%;
  border: 1px dotted rgba(255, 248, 220, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: obRuneInnerIn 0.4s ease-out 0.7s forwards,
             obRuneInnerSpin 1.2s linear 0.7s forwards,
             obRuneFade 0.4s ease-in 1.5s forwards;
}

@keyframes obRuneOuterIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.7; }
}

@keyframes obRuneOuterSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); }
}

@keyframes obRuneInnerIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
}

@keyframes obRuneInnerSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(-360deg); }
}

@keyframes obRuneFade {
  0% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 祝福波纹 - 从中心向外扩散的光环 */
.ob-wave {
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

.ob-wave.wave-1 { animation: obWave 0.6s ease-out 0.8s forwards; }
.ob-wave.wave-2 { animation: obWave 0.6s ease-out 0.9s forwards; border-color: rgba(255, 248, 220, 0.5); }
.ob-wave.wave-3 { animation: obWave 0.6s ease-out 1.0s forwards; border-color: rgba(255, 215, 0, 0.4); }

@keyframes obWave {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3); opacity: 0; }
}

/* 中央祝福核心 - 发光的金色祝福之球 */
.ob-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 25%;
  height: 25%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: obCoreIn 0.3s ease-out 0.85s forwards,
             obCorePulse 0.4s ease-in-out 1.15s forwards,
             obCoreOut 0.3s ease-in 1.5s forwards;
  will-change: transform, opacity;
  z-index: 6;
}

.ob-core-inner {
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
    0 0 15px rgba(255, 215, 0, 0.8),
    0 0 30px rgba(255, 215, 0, 0.4);
}

@keyframes obCoreIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes obCorePulse {
  0%, 100% { transform: translate3d(-50%, -50%, 0) scale(1); }
  50% { transform: translate3d(-50%, -50%, 0) scale(1.15); }
}

@keyframes obCoreOut {
  0% { opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 0; }
}

/* ---------- 阶段③：全能护盾（1.0s ~ 1.6s）---------- */

/* 十色粒子环绕旋转 - 10颗粒子沿圆形轨道旋转 */
.ob-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: obOrbitIn 0.3s ease-out 1.0s forwards,
             obOrbitSpin 0.8s linear 1.0s forwards,
             obOrbitOut 0.3s ease-in 1.4s forwards;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes obOrbitIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
}

@keyframes obOrbitSpin {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(360deg); }
}

@keyframes obOrbitOut {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* 环绕粒子 - 十种颜色对应十种增益 */
.ob-orbit-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    var(--ob-orbit-color, #FFD700) 50%,
    rgba(255, 215, 0, 0.3) 100%
  );
  box-shadow: 0 0 6px var(--ob-orbit-color, #FFD700);
  transform: translate3d(-50%, -50%, 0) rotate(var(--ob-orbit-angle, 0deg)) translateY(-45%);
}

/* 全能护盾光环 - 金色护盾边框 */
.ob-shield {
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
  animation: obShieldIn 0.3s ease-out 1.0s forwards,
             obShieldPulse 0.4s ease-in-out 1.3s forwards,
             obShieldOut 0.3s ease-in 1.5s forwards;
  will-change: transform, opacity;
  z-index: 6;
}

@keyframes obShieldIn {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 0.8; }
}

@keyframes obShieldPulse {
  0%, 100% { transform: translate3d(-50%, -50%, 0) scale(1); }
  50% { transform: translate3d(-50%, -50%, 0) scale(1.08); }
}

@keyframes obShieldOut {
  0% { opacity: 0.8; }
  100% { opacity: 0; }
}

/* ---------- 阶段④：圣光消散（1.4s ~ 2.0s）---------- */

/* 上升圣光余烬 - 缓慢上浮的金色光粒 */
.ob-ember {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--ob-ember-size, 5px);
  height: var(--ob-ember-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.9) 0%,
    rgba(255, 248, 220, 0.5) 50%,
    transparent 100%
  );
  box-shadow: 0 0 5px rgba(255, 215, 0, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: obEmberFloat 0.6s ease-out forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes obEmberFloat {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(calc(-50% + var(--ob-ember-tx, 0px) * 0.2), calc(-50% + var(--ob-ember-ty, 0px) * 0.2), 0) scale(1.2);
    opacity: 1;
  }
  80% { opacity: 0.4; }
  100% {
    transform: translate3d(calc(-50% + var(--ob-ember-tx, 0px)), calc(-50% + var(--ob-ember-ty, 0px)), 0) scale(0.2);
    opacity: 0;
  }
}

/* 圣光余韵 - 最后的光芒消散 */
.ob-afterglow {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 215, 0, 0.15) 0%,
    rgba(255, 248, 220, 0.08) 45%,
    transparent 80%
  );
  opacity: 0;
  animation: obAfterglow 0.6s ease-out 1.4s forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes obAfterglow {
  0% { opacity: 0; }
  30% { opacity: 0.6; }
  100% { opacity: 0; }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .ob-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
