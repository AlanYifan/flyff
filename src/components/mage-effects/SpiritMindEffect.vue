<!--
  @file SpiritMindEffect.vue
  @generated 2026-07-04
  @description 神念攻击 - 神念发射·神念凝聚·精神穿刺·精神崩溃·神念余韵
  精神使者Q技能（Spirit Bomb）：利用自身强大神念令对方精神崩溃，对方气血越少，技能攻击力越强
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + translateZ深度分层
  动画总时长：固定1.5秒 = 神念球飞行时间（动态200ms~800ms）+ 阶段①~④（动态700ms~1300ms）
    通过 CSS 变量 --sm-scale 动态缩放阶段①~④所有动画时长和延迟
    ⓪ 神念发射 - 神念球从玩家头像飞向怪物头像，到达后爆裂，触发下一阶段
    ① 神念凝聚 - 虚空暗幕降临 + 念力螺旋凝聚 + 精神能量从四周向中心汇聚
    ② 精神穿刺 - 念力长针从多角度刺入目标 + 精神裂纹蔓延
    ③ 精神崩溃 - 意识碎裂爆发 + 结晶碎片飞溅 + 精神冲击波扩散 + 虚空裂缝
    ④ 神念余韵 - 残留念力碎片飘散 + 虚空消散 + 整体渐隐
  色彩方案：灵能洋红(#D946EF) + 精神青(#22D3EE) + 念力白(#F5E0FF) + 虚空靛(#4C1D95)
-->
<template>
  <!-- 3D舞台 - 透视容器，为神念攻击提供3D空间深度 -->
  <div ref="stageRef" class="sm-3d-stage" :style="{ '--sm-scale': phaseScale }">
    <!-- ===== 阶段⓪：神念发射 ===== -->
    <!-- 神念球通过 Teleport 渲染到 body，使用 position: fixed 避免被父容器裁剪 -->
    <!-- 动画通过 Web Animations API (element.animate) 驱动，飞行时间按距离动态计算 -->
    <Teleport to="body">
      <div
        v-if="orbReady && !phaseStarted"
        ref="orbRef"
        class="sm-orb-fixed"
      >
        <!-- 念力气流包裹 - 旋转的能量环 -->
        <div class="sm-orb-aura sm-orb-aura-1"></div>
        <div class="sm-orb-aura sm-orb-aura-2"></div>
        <!-- 神念球核心 -->
        <div class="sm-orb-core"></div>
        <!-- 能量光晕 -->
        <div class="sm-orb-glow"></div>
      </div>
    </Teleport>

    <!-- ===== 阶段①~④：神念球到达目标后开始播放 ===== -->
    <template v-if="phaseStarted">
      <!-- 神念爆裂 - 球体到达目标后的小型爆裂闪光 -->
      <div class="sm-orb-impact"></div>

      <!-- 虚空暗幕 - 深紫靛色笼罩，营造精神被侵蚀的异空间氛围 -->
      <div class="sm-void"></div>

      <!-- 精神扭曲场 - 目标周围的空间扭曲变形，暗示精神正在被入侵 -->
      <div class="sm-distortion"></div>

      <!-- 念力螺旋 - 从四周向中心汇聚的螺旋能量带 -->
      <div class="sm-spiral">
        <div
          v-for="i in 6"
          :key="'sm-spiral-arm-' + i"
          class="sm-spiral-arm"
          :style="getSpiralArmStyle(i)"
        ></div>
      </div>

      <!-- 念力长针 - 从多角度刺入目标的精神穿刺 -->
      <div
        v-for="i in 8"
        :key="'sm-spike-' + i"
        class="sm-spike"
        :style="getSpikeStyle(i)"
      ></div>

      <!-- 精神裂纹 - 从中心蔓延的碎裂纹路，暗示精神正在崩溃 -->
      <div class="sm-cracks">
        <div
          v-for="i in 6"
          :key="'sm-crack-' + i"
          class="sm-crack"
          :style="getCrackStyle(i)"
        ></div>
      </div>

      <!-- 精神崩溃爆发 - 意识碎裂的中心爆发闪光 -->
      <div class="sm-shatter">
        <div class="sm-shatter-flash"></div>
        <div class="sm-shatter-ring"></div>
      </div>

      <!-- 结晶碎片 - 精神崩溃后飞溅的意识结晶碎片 -->
      <div
        v-for="i in 16"
        :key="'sm-shard-' + i"
        class="sm-shard"
        :style="getShardStyle(i)"
      ></div>

      <!-- 精神冲击波 - 崩溃瞬间向外扩散的念力冲击波 -->
      <div class="sm-shockwave wave-1"></div>
      <div class="sm-shockwave wave-2"></div>
      <div class="sm-shockwave wave-3"></div>

      <!-- 虚空裂缝 - 精神崩溃时空间撕裂的裂缝光带 -->
      <div class="sm-rift">
        <div class="sm-rift-line rift-a"></div>
        <div class="sm-rift-line rift-b"></div>
        <div class="sm-rift-line rift-c"></div>
      </div>

      <!-- 念力余韵碎片 - 缓慢飘散的残留念力光点 -->
      <div
        v-for="i in 12"
        :key="'sm-ember-' + i"
        class="sm-ember"
        :style="getEmberStyle(i)"
      ></div>

      <!-- 虚空余辉 - 最终残留的靛紫色光晕 -->
      <div class="sm-afterglow"></div>
    </template>
  </div>
</template>

<script setup>
/**
 * 神念攻击 - 神念发射·神念凝聚·精神穿刺·精神崩溃·神念余韵
 * 精神使者Q技能（Spirit Bomb）单体特效组件
 * 利用自身强大神念令对方精神崩溃，对方气血越少，技能攻击力越强
 * 动画总时长：固定1.5秒 = 神念球飞行时间（动态）+ 阶段①~④（动态缩放）
 * 色彩方案：灵能洋红(#D946EF) + 精神青(#22D3EE) + 念力白(#F5E0FF) + 虚空靛(#4C1D95)
 */

import { ref, onMounted, nextTick } from 'vue'

// 组件使用 Teleport 作为根节点，需禁用 attrs 自动继承
defineOptions({
  inheritAttrs: false
})

/** 动画总时长（毫秒） */
const TOTAL_DURATION = 1500

/** 神念球飞行速度（像素/秒），用于动态计算飞行时间 */
const FLIGHT_SPEED = 800

/** 舞台根元素引用，用于计算玩家头像偏移 */
const stageRef = ref(null)

/** 神念球的 DOM 引用，用于 Web Animations API */
const orbRef = ref(null)

/** 神念球是否准备就绪（位置计算完成后才渲染） */
const orbReady = ref(false)

/** 阶段①~④是否开始播放（神念球到达目标后置为 true） */
const phaseStarted = ref(false)

/** 阶段①~④动画缩放因子（基于剩余时间动态计算，原始阶段时长约1秒） */
const phaseScale = ref(1)

/** 玩家头像中心点的屏幕坐标（调试用） */
const playerScreenX = ref(0)
const playerScreenY = ref(0)

/** 怪物头像中心点的屏幕坐标（调试用） */
const monsterScreenX = ref(0)
const monsterScreenY = ref(0)

/**
 * 组件挂载后动态计算玩家头像和怪物头像的屏幕坐标
 * 确保神念球从玩家头像居中位置生成并飞向被攻击怪物头像居中位置
 * 飞行时间根据两点距离动态计算（200ms ~ 800ms），剩余时间分配给阶段①~④
 * 通过 --sm-scale CSS 变量动态缩放阶段①~④所有动画，保证总时长固定1.5秒
 * 神念球到达目标后通过 onfinish 回调触发阶段①~④动画
 */
onMounted(async () => {
  try {
    const stage = stageRef.value
    if (!stage) return

    // 查找怪物头像元素（当前 enemy-container 内的 .enemy-icon）
    // 用于定位神念球飞行终点和阶段①~④动画中心到怪物头像居中位置
    const enemyContainer = stage.closest('.enemy-container')
    const enemyIcon = enemyContainer?.querySelector('.enemy-icon')

    // 计算怪物头像中心相对舞台的偏移（布局坐标），设置 CSS 变量
    // 阶段①~④的所有动画通过 --sm-center-x / --sm-center-y 定位到怪物头像居中位置
    // 使用 offsetLeft/offsetTop 遍历而非 getBoundingClientRect，避免祖先 transform: scale 导致双重缩放
    if (enemyIcon && enemyContainer) {
      let offsetX = 0
      let offsetY = 0
      let current = enemyIcon
      while (current && current !== enemyContainer) {
        offsetX += current.offsetLeft || 0
        offsetY += current.offsetTop || 0
        current = current.offsetParent
      }
      const centerX = offsetX + (enemyIcon.offsetWidth || 0) / 2
      const centerY = offsetY + (enemyIcon.offsetHeight || 0) / 2
      stage.style.setProperty('--sm-center-x', `${centerX}px`)
      stage.style.setProperty('--sm-center-y', `${centerY}px`)
    }

    // 查找玩家头像元素（PlayerStatusCard 中的 #playerAvatar）
    const playerAvatar = document.getElementById('playerAvatar')
    if (!playerAvatar) {
      console.warn('[SpiritMindEffect] 未找到玩家头像元素 #playerAvatar')
      // 找不到玩家头像时直接播放后续阶段，缩放因子为1.5（全1.5秒用于阶段①~④）
      phaseScale.value = TOTAL_DURATION / 1000
      phaseStarted.value = true
      startStageFade(stage, TOTAL_DURATION)
      return
    }

    const stageRect = stage.getBoundingClientRect()
    const avatarRect = playerAvatar.getBoundingClientRect()

    // 计算两个中心点的屏幕坐标
    const startX = Math.round(avatarRect.left + avatarRect.width / 2)
    const startY = Math.round(avatarRect.top + avatarRect.height / 2)
    // 怪物头像中心：优先使用 .enemy-icon 的屏幕坐标，回退到舞台中心
    let endX, endY
    if (enemyIcon) {
      const iconRect = enemyIcon.getBoundingClientRect()
      endX = Math.round(iconRect.left + iconRect.width / 2)
      endY = Math.round(iconRect.top + iconRect.height / 2)
    } else {
      endX = Math.round(stageRect.left + stageRect.width / 2)
      endY = Math.round(stageRect.top + stageRect.height / 2)
    }

    playerScreenX.value = startX
    playerScreenY.value = startY
    monsterScreenX.value = endX
    monsterScreenY.value = endY

    // 计算飞行距离和动态持续时间（限制在 200ms ~ 800ms，保证阶段①~④至少有700ms）
    const distance = Math.hypot(endX - startX, endY - startY)
    const flightDuration = Math.max(200, Math.min(800, Math.round(distance / FLIGHT_SPEED * 1000)))

    // 计算阶段①~④缩放因子：剩余时间 / 原始阶段时长（约1秒）
    const phaseDuration = TOTAL_DURATION - flightDuration
    phaseScale.value = phaseDuration / 1000

    // 启动舞台渐隐动画（固定1.5秒）
    startStageFade(stage, TOTAL_DURATION)

    // 先渲染 DOM，再在下一帧启动动画
    orbReady.value = true
    await nextTick()

    // 使用 requestAnimationFrame 确保 DOM 已完成布局后再启动动画
    requestAnimationFrame(() => {
      startOrbAnimation(startX, startY, endX, endY, flightDuration)
    })
  } catch (e) {
    console.warn('[SpiritMindEffect] 神念球初始化失败:', e)
    // 出错时直接播放后续阶段
    phaseScale.value = TOTAL_DURATION / 1000
    phaseStarted.value = true
  }
})

/**
 * 使用 Web Animations API 启动舞台渐隐动画
 * @param {HTMLElement} stage - 舞台 DOM 元素
 * @param {number} totalDuration - 总动画时长（毫秒）
 */
function startStageFade (stage, totalDuration) {
  stage.animate([
    { opacity: 1, offset: 0 },
    { opacity: 1, offset: 0.85 },
    { opacity: 0, offset: 1 }
  ], {
    duration: totalDuration,
    easing: 'ease-out',
    fill: 'forwards'
  })
}

/**
 * 使用 Web Animations API 启动神念球动画
 * 飞行时间根据距离动态计算，到达目标后触发阶段①~④
 * @param {number} startX - 玩家头像中心 X（屏幕坐标）
 * @param {number} startY - 玩家头像中心 Y（屏幕坐标）
 * @param {number} endX - 怪物头像中心 X（屏幕坐标）
 * @param {number} endY - 怪物头像中心 Y（屏幕坐标）
 * @param {number} duration - 飞行动画持续时间（毫秒）
 */
function startOrbAnimation (startX, startY, endX, endY, duration) {
  const orb = orbRef.value
  if (!orb) return

  // 飞行方向角度（度），水滴形朝向怪物
  const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI

  // 水滴形球体宽高的一半（30x18 → halfW=15, halfH=9）
  const halfW = 15
  const halfH = 9

  // 线性插值辅助函数
  const lerp = (t) => ({
    x: startX + (endX - startX) * t,
    y: startY + (endY - startY) * t
  })

  // 神念球飞行动画 - 从玩家头像飞向怪物头像
  const orbKeyframes = [
    { transform: `translate3d(${startX - halfW}px, ${startY - halfH}px, 0) rotate(${angle}deg) scale(0.3)`, opacity: 0 },
    { transform: `translate3d(${lerp(0.1).x - halfW}px, ${lerp(0.1).y - halfH}px, 0) rotate(${angle}deg) scale(0.8)`, opacity: 1, offset: 0.1 },
    { transform: `translate3d(${lerp(0.9).x - halfW}px, ${lerp(0.9).y - halfH}px, 0) rotate(${angle}deg) scale(1.2)`, opacity: 1, offset: 0.9 },
    { transform: `translate3d(${endX - halfW}px, ${endY - halfH}px, 0) rotate(${angle}deg) scale(1)`, opacity: 1 }
  ]

  const orbAnim = orb.animate(orbKeyframes, {
    duration: duration,
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    fill: 'forwards'
  })

  // 神念球光晕 - 与飞行时间同步
  const glow = orb.querySelector('.sm-orb-glow')
  if (glow) {
    glow.animate([
      { transform: 'scale(0.5)', opacity: 0 },
      { transform: 'scale(1.2)', opacity: 1, offset: 0.15 },
      { transform: 'scale(1.4)', opacity: 0.8, offset: 0.6 },
      { transform: 'scale(1.8)', opacity: 0 }
    ], {
      duration: duration,
      easing: 'ease-out',
      fill: 'forwards'
    })
  }

  // 神念球到达目标后开始播放阶段①~④
  orbAnim.onfinish = () => {
    phaseStarted.value = true
  }

  // 安全兜底：防止 onfinish 未触发时阶段①~④不播放
  setTimeout(() => {
    if (!phaseStarted.value) {
      phaseStarted.value = true
    }
  }, duration + 100)
}

/**
 * 计算念力螺旋臂的样式
 * 每条螺旋臂从外围向中心旋转汇聚，模拟念力凝聚的过程
 * @param {number} index - 螺旋臂索引（1~6）
 * @returns {Object} CSS自定义属性对象
 */
function getSpiralArmStyle (index) {
  const angle = (index - 1) * 60
  const delay = (0.03 + (index % 3) * 0.02) * phaseScale.value
  return {
    '--sm-spiral-angle': `${angle}deg`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算念力长针的样式
 * 每根长针从指定角度的外围刺向中心，模拟精神穿刺
 * @param {number} index - 长针索引（1~8）
 * @returns {Object} CSS自定义属性对象
 */
function getSpikeStyle (index) {
  const angle = (index - 1) * 45 + (index % 2) * 8
  const distance = 70 + (index % 3) * 15
  const delay = (0.15 + (index % 4) * 0.02) * phaseScale.value
  return {
    '--sm-spike-angle': `${angle}deg`,
    '--sm-spike-distance': `${distance}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算精神裂纹的样式
 * 每条裂纹从中心向指定方向蔓延延伸，暗示精神正在碎裂
 * @param {number} index - 裂纹索引（1~6）
 * @returns {Object} CSS自定义属性对象
 */
function getCrackStyle (index) {
  const angle = (index - 1) * 60 + (index % 2) * 12
  const length = 50 + (index % 3) * 20
  const delay = (0.24 + (index % 3) * 0.02) * phaseScale.value
  return {
    '--sm-crack-angle': `${angle}deg`,
    '--sm-crack-length': `${length}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算结晶碎片的样式
 * 每块碎片在精神崩溃时从中心向四周飞溅，模拟意识碎裂
 * @param {number} index - 碎片索引（1~16）
 * @returns {Object} CSS自定义属性对象
 */
function getShardStyle (index) {
  const angle = (index - 1) * 22.5 + (index % 2) * 6
  const rad = (angle * Math.PI) / 180
  const distance = 50 + (index % 4) * 25
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance * 0.6 - 15
  const size = 6 + (index % 3) * 5
  const delay = (0.33 + (index % 5) * 0.02) * phaseScale.value
  const isCyan = index % 3 === 0
  const bgGradient = isCyan
    ? 'linear-gradient(135deg, rgba(245, 224, 255, 0.95) 0%, rgba(34, 211, 238, 0.7) 50%, transparent 100%)'
    : 'linear-gradient(135deg, rgba(245, 224, 255, 0.95) 0%, rgba(217, 70, 239, 0.7) 50%, transparent 100%)'
  const shadowColor = isCyan ? 'rgba(34, 211, 238, 0.5)' : 'rgba(217, 70, 239, 0.5)'
  return {
    '--sm-shard-tx': `${tx}px`,
    '--sm-shard-ty': `${ty}px`,
    '--sm-shard-size': `${size}px`,
    '--sm-shard-bg': bgGradient,
    '--sm-shard-shadow': shadowColor,
    animationDelay: `${delay}s`
  }
}

/**
 * 计算念力余韵碎片的样式
 * 每个光点在精神崩溃后缓慢飘散，代表残留的念力能量
 * @param {number} index - 余韵碎片索引（1~12）
 * @returns {Object} CSS自定义属性对象
 */
function getEmberStyle (index) {
  const angle = (index - 1) * 30 + (index % 2) * 10
  const rad = (angle * Math.PI) / 180
  const startRadius = 15 + (index % 4) * 12
  const startX = Math.cos(rad) * startRadius
  const startY = Math.sin(rad) * startRadius * 0.5
  const driftX = ((index % 2 === 0) ? 1 : -1) * (10 + (index % 3) * 8)
  const riseY = -(40 + (index % 4) * 15)
  const size = 3 + (index % 3) * 2
  const delay = (0.51 + (index % 5) * 0.03) * phaseScale.value
  return {
    '--sm-ember-start-x': `${startX}px`,
    '--sm-ember-start-y': `${startY}px`,
    '--sm-ember-drift-x': `${driftX}px`,
    '--sm-ember-rise-y': `${riseY}px`,
    '--sm-ember-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   神念攻击 (spirit_mage_q) - 神念发射·神念凝聚·精神穿刺·精神崩溃·神念余韵
   技能描述：利用自身强大神念令对方精神崩溃，对方气血越少，技能攻击力越强
   色彩方案：灵能洋红(#D946EF) + 精神青(#22D3EE) + 念力白(#F5E0FF) + 虚空靛(#4C1D95)
   3D技术：perspective透视 + translateZ深度分层
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：固定1.5秒
   阶段①~④通过 CSS 变量 --sm-scale 动态缩放（由 JS 根据飞行时间计算）
   ================================================================ */

/* 3D舞台 - 透视容器，为神念攻击提供3D空间深度
   舞台渐隐动画由 Web Animations API 驱动，固定1.5秒 */
.sm-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1000px;
  perspective-origin: 50% 50%;
  transform-style: preserve-3d;
  contain: layout style;
}

/* ================================================================
   阶段⓪：神念发射 - 神念球从玩家头像飞向怪物头像
   飞行时长根据距离动态计算（200ms ~ 800ms）
   注意：神念球样式定义在底部非 scoped <style> 块中，
   因为 Teleport 到 body 的元素无法被 scoped 样式选中
   此处仅保留爆裂闪光（在舞台内部，scoped 可正常作用）
   ================================================================ */

/* 神念爆裂 - 球体到达目标后的小型爆裂闪光，衔接阶段① */
.sm-orb-impact {
  position: absolute;
  top: var(--sm-center-y, 50%);
  left: var(--sm-center-x, 50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  background: radial-gradient(
    circle,
    rgba(245, 224, 255, 1) 0%,
    rgba(217, 70, 239, 0.7) 30%,
    rgba(124, 58, 237, 0.3) 60%,
    transparent 100%
  );
  filter: blur(2px);
  animation: sm-orb-impact calc(0.3s * var(--sm-scale, 1)) ease-out forwards;
  will-change: transform, opacity;
  z-index: 11;
}
@keyframes sm-orb-impact {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  30% {
    transform: translate3d(-50%, -50%, 0) scale(2);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(3.5);
    opacity: 0;
  }
}

/* ================================================================
   阶段①：神念凝聚 - 神念球到达后开始
   ================================================================ */

/* 虚空暗幕 - 深紫靛色笼罩，营造精神被拉入异空间的氛围 */
.sm-void {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at var(--sm-center-x, 50%) var(--sm-center-y, 50%),
    rgba(76, 29, 149, 0.55) 0%,
    rgba(46, 16, 90, 0.4) 35%,
    rgba(20, 8, 40, 0.25) 65%,
    transparent 100%
  );
  animation: sm-void calc(0.85s * var(--sm-scale, 1)) ease-out forwards;
  will-change: opacity;
}
@keyframes sm-void {
  0%   { opacity: 0; }
  15%  { opacity: 1; }
  60%  { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 精神扭曲场 - 目标周围的空间扭曲变形，暗示精神正在被入侵 */
.sm-distortion {
  position: absolute;
  top: var(--sm-center-y, 50%);
  left: var(--sm-center-x, 50%);
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(217, 70, 239, 0.08) 30deg,
    transparent 60deg,
    rgba(34, 211, 238, 0.06) 90deg,
    transparent 120deg,
    rgba(217, 70, 239, 0.08) 150deg,
    transparent 180deg,
    rgba(34, 211, 238, 0.06) 210deg,
    transparent 240deg,
    rgba(217, 70, 239, 0.08) 270deg,
    transparent 300deg,
    rgba(34, 211, 238, 0.06) 330deg,
    transparent 360deg
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  filter: blur(8px);
  animation: sm-distortion calc(0.65s * var(--sm-scale, 1)) ease-out forwards;
  will-change: transform, opacity;
}
@keyframes sm-distortion {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) scale(1) rotate(30deg);
    opacity: 1;
  }
  60% {
    transform: translate3d(-50%, -50%, 0) scale(1.5) rotate(180deg);
    opacity: 0.4;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2) rotate(360deg);
    opacity: 0;
  }
}

/* 念力螺旋容器 - 从四周向中心汇聚的螺旋能量带 */
.sm-spiral {
  position: absolute;
  top: var(--sm-center-y, 50%);
  left: var(--sm-center-x, 50%);
  width: 0;
  height: 0;
  transform: translate3d(-50%, -50%, 0);
}

/* 念力螺旋臂 - 每条臂从外围旋转着向中心收缩 */
.sm-spiral-arm {
  position: absolute;
  top: 0;
  left: 0;
  width: 90px;
  height: 4px;
  transform-origin: 0 50%;
  transform: rotate(var(--sm-spiral-angle, 0deg)) translateX(0px) scaleX(0);
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(34, 211, 238, 0.3) 20%,
    rgba(217, 70, 239, 0.8) 60%,
    rgba(245, 224, 255, 1) 100%
  );
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(217, 70, 239, 0.5);
  animation: sm-spiral-arm calc(0.25s * var(--sm-scale, 1)) ease-in forwards;
  will-change: transform, opacity;
}
@keyframes sm-spiral-arm {
  0% {
    transform: rotate(var(--sm-spiral-angle, 0deg)) translateX(80px) scaleX(0.2);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    transform: rotate(calc(var(--sm-spiral-angle, 0deg) + 120deg)) translateX(0px) scaleX(1);
    opacity: 0;
  }
}

/* ================================================================
   阶段②：精神穿刺
   ================================================================ */

/* 念力长针 - 从多角度刺向目标的精神穿刺 */
.sm-spike {
  position: absolute;
  top: var(--sm-center-y, 50%);
  left: var(--sm-center-x, 50%);
  width: 3px;
  height: 40px;
  transform-origin: 50% 100%;
  transform: rotate(var(--sm-spike-angle, 0deg)) translateY(calc(-1 * var(--sm-spike-distance, 70px))) scaleY(0);
  background: linear-gradient(
    to top,
    transparent 0%,
    rgba(34, 211, 238, 0.4) 30%,
    rgba(217, 70, 239, 0.9) 70%,
    rgba(245, 224, 255, 1) 100%
  );
  border-radius: 2px 2px 0 0;
  box-shadow: 0 0 6px rgba(217, 70, 239, 0.6);
  animation: sm-spike calc(0.2s * var(--sm-scale, 1)) ease-in forwards;
  will-change: transform, opacity;
}
@keyframes sm-spike {
  0% {
    transform: rotate(var(--sm-spike-angle, 0deg)) translateY(calc(-1 * var(--sm-spike-distance, 70px))) scaleY(0);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  80% {
    transform: rotate(var(--sm-spike-angle, 0deg)) translateY(-8px) scaleY(1);
    opacity: 1;
  }
  100% {
    transform: rotate(var(--sm-spike-angle, 0deg)) translateY(0px) scaleY(0.3);
    opacity: 0;
  }
}

/* 精神裂纹容器 */
.sm-cracks {
  position: absolute;
  top: var(--sm-center-y, 50%);
  left: var(--sm-center-x, 50%);
  width: 0;
  height: 0;
  transform: translate3d(-50%, -50%, 0);
}

/* 精神裂纹 - 从中心蔓延的碎裂纹路，暗示精神正在崩溃 */
.sm-crack {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--sm-crack-length, 60px);
  height: 2px;
  transform-origin: 0 50%;
  transform: rotate(var(--sm-crack-angle, 0deg)) scaleX(0);
  background: linear-gradient(
    to right,
    rgba(245, 224, 255, 0.9) 0%,
    rgba(34, 211, 238, 0.6) 40%,
    rgba(217, 70, 239, 0.3) 70%,
    transparent 100%
  );
  box-shadow: 0 0 4px rgba(34, 211, 238, 0.5);
  animation: sm-crack calc(0.2s * var(--sm-scale, 1)) ease-out forwards;
  will-change: transform, opacity;
}
@keyframes sm-crack {
  0% {
    transform: rotate(var(--sm-crack-angle, 0deg)) scaleX(0);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: rotate(var(--sm-crack-angle, 0deg)) scaleX(1);
    opacity: 0;
  }
}

/* ================================================================
   阶段③：精神崩溃
   ================================================================ */

/* 精神崩溃爆发容器 */
.sm-shatter {
  position: absolute;
  top: var(--sm-center-y, 50%);
  left: var(--sm-center-x, 50%);
  width: 4px;
  height: 4px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: sm-shatter calc(0.3s * var(--sm-scale, 1)) ease-out calc(0.35s * var(--sm-scale, 1)) forwards;
  will-change: transform, opacity;
}
@keyframes sm-shatter {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) scale(1.5);
    opacity: 1;
  }
  40% {
    transform: translate3d(-50%, -50%, 0) scale(1.2);
    opacity: 0.6;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2.5);
    opacity: 0;
  }
}

/* 崩溃闪光 - 精神碎裂瞬间的白紫色爆闪 */
.sm-shatter-flash {
  position: absolute;
  top: var(--sm-center-y, 50%);
  left: var(--sm-center-x, 50%);
  width: 120px;
  height: 120px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    rgba(245, 224, 255, 1) 0%,
    rgba(217, 70, 239, 0.7) 30%,
    rgba(124, 58, 237, 0.4) 55%,
    transparent 80%
  );
  filter: blur(4px);
}

/* 崩溃冲击环 - 精神碎裂时向外扩散的环形冲击 */
.sm-shatter-ring {
  position: absolute;
  top: var(--sm-center-y, 50%);
  left: var(--sm-center-x, 50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid rgba(245, 224, 255, 0.8);
  box-shadow:
    0 0 15px rgba(217, 70, 239, 0.6),
    inset 0 0 10px rgba(34, 211, 238, 0.4);
  transform: translate(-50%, -50%) scale(0);
  animation: sm-shatter-ring calc(0.3s * var(--sm-scale, 1)) ease-out calc(0.35s * var(--sm-scale, 1)) forwards;
  will-change: transform, opacity;
}
@keyframes sm-shatter-ring {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0;
  }
}

/* 结晶碎片 - 精神崩溃后飞溅的意识结晶碎片 */
.sm-shard {
  position: absolute;
  top: var(--sm-center-y, 50%);
  left: var(--sm-center-x, 50%);
  width: var(--sm-shard-size, 8px);
  height: var(--sm-shard-size, 8px);
  background: var(--sm-shard-bg, linear-gradient(135deg, rgba(245, 224, 255, 0.95) 0%, rgba(217, 70, 239, 0.7) 50%, transparent 100%));
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  box-shadow: 0 0 6px var(--sm-shard-shadow, rgba(217, 70, 239, 0.5));
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: sm-shard calc(0.35s * var(--sm-scale, 1)) ease-out forwards;
  will-change: transform, opacity;
}
@keyframes sm-shard {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) scale(1.3) rotate(30deg);
    opacity: 1;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--sm-shard-tx, 0px)),
      calc(-50% + var(--sm-shard-ty, 0px)),
      0
    ) scale(0.2) rotate(180deg);
    opacity: 0;
  }
}

/* 精神冲击波 - 崩溃瞬间向外扩散的念力冲击波 */
.sm-shockwave {
  position: absolute;
  top: var(--sm-center-y, 50%);
  left: var(--sm-center-x, 50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid rgba(217, 70, 239, 0.7);
  box-shadow:
    0 0 12px rgba(217, 70, 239, 0.5),
    inset 0 0 8px rgba(34, 211, 238, 0.3);
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
  opacity: 0;
}
.sm-shockwave.wave-1 {
  border-color: rgba(245, 224, 255, 0.8);
  animation: sm-shockwave calc(0.3s * var(--sm-scale, 1)) ease-out calc(0.35s * var(--sm-scale, 1)) forwards;
}
.sm-shockwave.wave-2 {
  border-color: rgba(217, 70, 239, 0.6);
  animation: sm-shockwave calc(0.3s * var(--sm-scale, 1)) ease-out calc(0.4s * var(--sm-scale, 1)) forwards;
}
.sm-shockwave.wave-3 {
  border-color: rgba(34, 211, 238, 0.5);
  animation: sm-shockwave calc(0.35s * var(--sm-scale, 1)) ease-out calc(0.4s * var(--sm-scale, 1)) forwards;
}
@keyframes sm-shockwave {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(7);
    opacity: 0;
  }
}

/* 虚空裂缝容器 - 精神崩溃时空间撕裂的裂缝光带 */
.sm-rift {
  position: absolute;
  top: var(--sm-center-y, 50%);
  left: var(--sm-center-x, 50%);
  width: 0;
  height: 0;
  transform: translate3d(-50%, -50%, 0);
  animation: sm-rift-container calc(0.35s * var(--sm-scale, 1)) ease-out calc(0.4s * var(--sm-scale, 1)) forwards;
  opacity: 0;
  will-change: opacity;
}
@keyframes sm-rift-container {
  0% { opacity: 0; }
  20% { opacity: 1; }
  100% { opacity: 0; }
}

/* 虚空裂缝光带 - 空间被念力撕裂的发光裂缝 */
.sm-rift-line {
  position: absolute;
  top: 0;
  left: 0;
  height: 2px;
  transform-origin: 0 50%;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(245, 224, 255, 0.3) 15%,
    rgba(34, 211, 238, 0.9) 40%,
    rgba(245, 224, 255, 1) 50%,
    rgba(34, 211, 238, 0.9) 60%,
    rgba(245, 224, 255, 0.3) 85%,
    transparent 100%
  );
  box-shadow:
    0 0 8px rgba(34, 211, 238, 0.7),
    0 0 16px rgba(217, 70, 239, 0.4);
  filter: blur(1px);
}
.sm-rift-line.rift-a {
  width: 120px;
  --sm-rift-rotate: 15deg;
  transform: translate(-50%, -50%) rotate(15deg) scaleX(0);
  animation: sm-rift-line calc(0.25s * var(--sm-scale, 1)) ease-out calc(0.4s * var(--sm-scale, 1)) forwards;
}
.sm-rift-line.rift-b {
  width: 100px;
  --sm-rift-rotate: -50deg;
  transform: translate(-50%, -50%) rotate(-50deg) scaleX(0);
  animation: sm-rift-line calc(0.25s * var(--sm-scale, 1)) ease-out calc(0.4s * var(--sm-scale, 1)) forwards;
}
.sm-rift-line.rift-c {
  width: 80px;
  --sm-rift-rotate: 80deg;
  transform: translate(-50%, -50%) rotate(80deg) scaleX(0);
  animation: sm-rift-line calc(0.25s * var(--sm-scale, 1)) ease-out calc(0.45s * var(--sm-scale, 1)) forwards;
}
@keyframes sm-rift-line {
  0% {
    transform: translate(-50%, -50%) rotate(var(--sm-rift-rotate, 0deg)) scaleX(0);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--sm-rift-rotate, 0deg)) scaleX(1.3);
    opacity: 0;
  }
}

/* ================================================================
   阶段④：神念余韵
   ================================================================ */

/* 念力余韵碎片 - 缓慢飘散的残留念力光点 */
.sm-ember {
  position: absolute;
  top: var(--sm-center-y, 50%);
  left: var(--sm-center-x, 50%);
  width: var(--sm-ember-size, 4px);
  height: var(--sm-ember-size, 4px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(245, 224, 255, 0.9) 0%,
    rgba(217, 70, 239, 0.6) 45%,
    rgba(76, 29, 149, 0.2) 100%
  );
  box-shadow: 0 0 5px rgba(217, 70, 239, 0.4);
  transform: translate3d(
    calc(-50% + var(--sm-ember-start-x, 0px)),
    calc(-50% + var(--sm-ember-start-y, 0px)),
    0
  ) scale(0);
  animation: sm-ember calc(0.4s * var(--sm-scale, 1)) ease-out forwards;
  will-change: transform, opacity;
}
@keyframes sm-ember {
  0% {
    transform: translate3d(
      calc(-50% + var(--sm-ember-start-x, 0px)),
      calc(-50% + var(--sm-ember-start-y, 0px)),
      0
    ) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(
      calc(-50% + var(--sm-ember-start-x, 0px)),
      calc(-50% + var(--sm-ember-start-y, 0px)),
      0
    ) scale(1.2);
    opacity: 1;
  }
  80% {
    opacity: 0.3;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--sm-ember-start-x, 0px) + var(--sm-ember-drift-x, 0px)),
      calc(-50% + var(--sm-ember-start-y, 0px) + var(--sm-ember-rise-y, 0px)),
      0
    ) scale(0.1);
    opacity: 0;
  }
}

/* 虚空余辉 - 最终残留的靛紫色光晕，缓慢消散 */
.sm-afterglow {
  position: absolute;
  top: var(--sm-center-y, 50%);
  left: var(--sm-center-x, 50%);
  width: 50%;
  height: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(124, 58, 237, 0.2) 0%,
    rgba(76, 29, 149, 0.1) 40%,
    transparent 70%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: sm-afterglow calc(0.5s * var(--sm-scale, 1)) ease-out calc(0.45s * var(--sm-scale, 1)) forwards;
  will-change: transform, opacity;
}
@keyframes sm-afterglow {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2.5);
    opacity: 0;
  }
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .sm-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>

<!-- ================================================================
     非 scoped 全局样式 - Teleport 到 body 的神念球
     scoped 样式无法选中 Teleport 到 body 的元素，必须使用非 scoped
     动画通过 Web Animations API (element.animate) 驱动，
     不再使用 CSS @keyframes + CSS 变量的方式
     ================================================================ -->
<style>
/* 神念球容器 - position: fixed 定位，初始不可见
   水滴形横向 60x36，飞行动画由 Web Animations API 驱动
   容器旋转角度由 JS 计算的飞行方向决定，水滴形朝向怪物 */
.sm-orb-fixed {
  position: fixed;
  top: 0;
  left: 0;
  width: 30px;
  height: 18px;
  z-index: 99999;
  pointer-events: none;
  opacity: 0;
  will-change: transform, opacity;
}

/* 念力气流包裹环 - 基础样式
   两条半透明边框环围绕球体旋转，模拟念力气流 */
.sm-orb-fixed .sm-orb-aura {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
  pointer-events: none;
  will-change: transform;
}

/* 内层气流环 - 青色+洋红双色边框，快速旋转 */
.sm-orb-fixed .sm-orb-aura-1 {
  inset: -5px -8px;
  border-top-color: rgba(34, 211, 238, 0.9);
  border-right-color: rgba(217, 70, 239, 0.5);
  border-bottom-color: rgba(217, 70, 239, 0.9);
  border-left-color: rgba(34, 211, 238, 0.5);
  animation: sm-orb-aura-spin 0.5s linear infinite;
}

/* 外层气流环 - 洋红+紫色双色边框，反向旋转 */
.sm-orb-fixed .sm-orb-aura-2 {
  inset: -9px -12px;
  border-top-color: rgba(217, 70, 239, 0.6);
  border-right-color: rgba(124, 58, 237, 0.3);
  border-bottom-color: rgba(124, 58, 237, 0.6);
  border-left-color: rgba(217, 70, 239, 0.3);
  border-width: 1px;
  animation: sm-orb-aura-spin 0.7s linear infinite reverse;
}
@keyframes sm-orb-aura-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 神念球核心 - 椭圆形念力能量球 */
.sm-orb-fixed .sm-orb-core {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at 30% 50%,
    rgba(255, 255, 255, 1) 0%,
    rgba(245, 224, 255, 1) 15%,
    rgba(217, 70, 239, 1) 40%,
    rgba(124, 58, 237, 0.9) 70%,
    rgba(76, 29, 149, 0.6) 100%
  );
  box-shadow:
    0 0 10px rgba(217, 70, 239, 1),
    0 0 20px rgba(217, 70, 239, 0.8),
    0 0 30px rgba(124, 58, 237, 0.6),
    inset 0 0 5px rgba(255, 255, 255, 0.8);
}

/* 神念球光晕 - 球体周围的大型能量光晕
   光晕动画由 Web Animations API 驱动，时长与神念球飞行时间同步 */
.sm-orb-fixed .sm-orb-glow {
  position: absolute;
  inset: -8px -13px;
  border-radius: 50%;
  background: radial-gradient(
    ellipse,
    rgba(217, 70, 239, 0.5) 0%,
    rgba(124, 58, 237, 0.3) 30%,
    rgba(34, 211, 238, 0.2) 50%,
    transparent 80%
  );
  will-change: transform, opacity;
}
</style>
