<!--
  @file TorrentImpactEffect.vue
  @generated 2026-06-29
  @description 激流冲击 - 猛烈水流横向冲击 + 水涡旋 + 冲击波
  从 MageSkillEffect.vue 拆分而来，仅负责本特效的模板、脚本和样式
  GPU加速：所有动画仅使用 translate3d + opacity，避免重排，保证丝滑流畅
-->
<template>
          <div class="torrent-dim"></div>
          <!-- 水流冲击 - 多股水流从侧方猛烈涌入冲击目标 -->
          <div class="torrent-streams">
            <div class="torrent-stream stream-l1"></div>
            <div class="torrent-stream stream-l2"></div>
            <div class="torrent-stream stream-r1"></div>
            <div class="torrent-stream stream-r2"></div>
          </div>
          <!-- 水涡旋 - 围绕目标的旋转涡流 -->
          <div class="torrent-vortex">
            <div class="torrent-vortex-ring vr-1"></div>
            <div class="torrent-vortex-ring vr-2"></div>
            <div class="torrent-vortex-ring vr-3"></div>
          </div>
          <!-- 冲击水花 - 撞击瞬间向四周飞溅 -->
          <div class="torrent-burst">
            <div
              v-for="i in 12"
              :key="'torrent-drop-' + i"
              class="torrent-drop"
              :style="getTorrentDropStyle(i)"
            ></div>
          </div>
          <!-- 水面冲击波 - 从撞击点向外扩散 -->
          <div class="torrent-shockwave ts-1"></div>
          <div class="torrent-shockwave ts-2"></div>
          <!-- 水雾弥漫 -->
          <div class="torrent-mist"></div>
</template>

<script setup>
/**
 * 激流冲击 - 猛烈水流横向冲击 + 水涡旋 + 冲击波
 * 从 MageSkillEffect.vue 拆分的独立特效组件
 */

function getTorrentDropStyle (index) {
  const angle = (index - 1) * 30 + (index % 2) * 9
  const distance = 32 + (index % 4) * 12
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 12
  const size = 5 + (index % 3) * 3
  const delay = (index % 4) * 0.03
  return {
    '--tor-tx': `${tx}px`,
    '--tor-ty': `${ty}px`,
    '--tor-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   激流冲击 (mage_r) - 猛烈水流横向冲击 + 水涡旋 + 冲击波
   技能描述：形成强力的水柱攻击敌人
   激流：猛烈水流；冲击：撞击力
   ================================================================ */

/* 暗幕 */
.torrent-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 40, 80, 0.3) 0%,
    rgba(0, 20, 50, 0.15) 60%,
    transparent 100%
  );
  animation: tor-dim 1.3s ease-out forwards;
  pointer-events: none;
}
@keyframes tor-dim {
  0%   { opacity: 0; }
  15%  { opacity: 1; }
  70%  { opacity: 0.5; }
  100% { opacity: 0; }
}

/* 水流冲击容器 */
.torrent-streams {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* 单股水流 - 从侧方猛烈涌入 */
.torrent-stream {
  position: absolute;
  top: 0;
  left: 0;
  width: 80px;
  height: 14px;
  border-radius: 50% 50% 50% 50% / 100% 100% 0% 0%;
  background: linear-gradient(to right,
    rgba(0, 100, 200, 0) 0%,
    rgba(50, 180, 255, 0.7) 30%,
    rgba(150, 230, 255, 0.9) 70%,
    rgba(255, 255, 255, 0.8) 100%);
  filter: blur(2px);
  will-change: transform, opacity;
}

/* 左侧水流1 - 从左上方涌入 */
.torrent-stream.stream-l1 {
  transform-origin: right center;
  animation: tor-stream-l 0.5s cubic-bezier(0.3, 0.8, 0.5, 1) forwards;
}
@keyframes tor-stream-l {
  0%   { transform: translate(-120px, -30px) scaleX(0.3) rotate(15deg); opacity: 0; }
  30%  { transform: translate(-60px, -15px) scaleX(0.7) rotate(10deg); opacity: 1; }
  70%  { transform: translate(-10px, 0) scaleX(1) rotate(5deg); opacity: 1; }
  100% { transform: translate(0, 0) scaleX(0.5) rotate(0deg); opacity: 0; }
}

/* 左侧水流2 */
.torrent-stream.stream-l2 {
  transform-origin: right center;
  animation: tor-stream-l2 0.5s cubic-bezier(0.3, 0.8, 0.5, 1) 0.08s forwards;
}
@keyframes tor-stream-l2 {
  0%   { transform: translate(-100px, 20px) scaleX(0.3) rotate(-10deg); opacity: 0; }
  30%  { transform: translate(-50px, 10px) scaleX(0.7) rotate(-5deg); opacity: 1; }
  70%  { transform: translate(-10px, 0) scaleX(1) rotate(-3deg); opacity: 1; }
  100% { transform: translate(0, 0) scaleX(0.5) rotate(0deg); opacity: 0; }
}

/* 右侧水流1 - 从右上方涌入 */
.torrent-stream.stream-r1 {
  transform-origin: left center;
  animation: tor-stream-r 0.5s cubic-bezier(0.3, 0.8, 0.5, 1) 0.04s forwards;
}
@keyframes tor-stream-r {
  0%   { transform: translate(120px, -30px) scaleX(0.3) scaleX(-1) rotate(15deg); opacity: 0; }
  30%  { transform: translate(60px, -15px) scaleX(0.7) scaleX(-1) rotate(10deg); opacity: 1; }
  70%  { transform: translate(10px, 0) scaleX(1) scaleX(-1) rotate(5deg); opacity: 1; }
  100% { transform: translate(0, 0) scaleX(0.5) scaleX(-1) rotate(0deg); opacity: 0; }
}

/* 右侧水流2 */
.torrent-stream.stream-r2 {
  transform-origin: left center;
  animation: tor-stream-r2 0.5s cubic-bezier(0.3, 0.8, 0.5, 1) 0.12s forwards;
}
@keyframes tor-stream-r2 {
  0%   { transform: translate(100px, 20px) scaleX(0.3) scaleX(-1) rotate(-10deg); opacity: 0; }
  30%  { transform: translate(50px, 10px) scaleX(0.7) scaleX(-1) rotate(-5deg); opacity: 1; }
  70%  { transform: translate(10px, 0) scaleX(1) scaleX(-1) rotate(-3deg); opacity: 1; }
  100% { transform: translate(0, 0) scaleX(0.5) scaleX(-1) rotate(0deg); opacity: 0; }
}

/* 水涡旋 - 围绕目标的旋转涡流 */
.torrent-vortex {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.torrent-vortex-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2px solid rgba(100, 200, 255, 0.6);
  box-shadow: 0 0 10px rgba(50, 150, 255, 0.4);
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
}
.torrent-vortex-ring.vr-1 {
  width: 50px;
  height: 50px;
  animation: tor-vortex 1s ease-out 0.2s forwards;
}
.torrent-vortex-ring.vr-2 {
  width: 70px;
  height: 70px;
  animation: tor-vortex 1s ease-out 0.35s forwards;
}
.torrent-vortex-ring.vr-3 {
  width: 90px;
  height: 90px;
  animation: tor-vortex 1s ease-out 0.5s forwards;
}
@keyframes tor-vortex {
  0%   { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
  20%  { transform: translate(-50%, -50%) scale(1) rotate(60deg); opacity: 0.8; }
  60%  { transform: translate(-50%, -50%) scale(1.3) rotate(180deg); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.6) rotate(360deg); opacity: 0; }
}

/* 冲击水花 - 撞击瞬间向四周飞溅 */
.torrent-burst {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  opacity: 0;
  animation: tor-burst-show 0.8s ease-out 0.3s forwards;
}
@keyframes tor-burst-show {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}
.torrent-drop {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--tor-size, 6px);
  height: var(--tor-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(100, 200, 255, 0.7) 50%,
    rgba(0, 100, 200, 0.3) 100%
  );
  box-shadow: 0 0 4px rgba(100, 200, 255, 0.5);
  will-change: transform, opacity;
  animation: tor-drop 0.8s ease-out forwards;
}
@keyframes tor-drop {
  0%   { transform: translate(0, 0) scale(0); opacity: 0; }
  15%  { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--tor-tx, 0px), var(--tor-ty, 0px)) scale(0.3); opacity: 0; }
}

/* 水面冲击波 - 从撞击点向外扩散 */
.torrent-shockwave {
  position: absolute;
  bottom: 15%;
  left: 50%;
  width: 50px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(100, 200, 255, 0.7);
  box-shadow: 0 0 8px rgba(50, 150, 255, 0.4);
  transform: translateX(-50%) scale(0);
  pointer-events: none;
  will-change: transform, opacity;
}
.torrent-shockwave.ts-1 {
  animation: tor-shock 0.8s ease-out 0.3s forwards;
}
.torrent-shockwave.ts-2 {
  animation: tor-shock 0.8s ease-out 0.5s forwards;
}
@keyframes tor-shock {
  0%   { transform: translateX(-50%) scale(0.2); opacity: 0; }
  20%  { transform: translateX(-50%) scale(1); opacity: 0.8; }
  100% { transform: translateX(-50%) scale(4); opacity: 0; }
}

/* 水雾弥漫 */
.torrent-mist {
  position: absolute;
  bottom: 10%;
  left: 50%;
  width: 100px;
  height: 50px;
  border-radius: 50% 50% 30% 30% / 70% 70% 30% 30%;
  background: radial-gradient(
    ellipse at center,
    rgba(180, 220, 255, 0.4) 0%,
    rgba(100, 180, 255, 0.2) 50%,
    transparent 70%
  );
  transform: translateX(-50%);
  filter: blur(6px);
  opacity: 0;
  animation: tor-mist 1s ease-out 0.5s forwards;
  pointer-events: none;
}
@keyframes tor-mist {
  0%   { transform: translateX(-50%) scale(0.5) translateY(0); opacity: 0; }
  30%  { transform: translateX(-50%) scale(1) translateY(-5px); opacity: 0.6; }
  100% { transform: translateX(-50%) scale(1.5) translateY(-15px); opacity: 0; }
}

</style>
