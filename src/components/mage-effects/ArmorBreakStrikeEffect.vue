<!--
  @file ArmorBreakStrikeEffect.vue
  @generated 2026-08-04
  @description 碎甲圣裁 - 圣光凝聚·重武斩击·护甲碎裂·圣裁侵蚀·余韵消散
  圣殿骑士E技能（单体DEBUFF）：将圣光之力注入重武器斩击敌人，命中后施加「护甲碎裂」
  GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity，避免重排，保证丝滑流畅
  3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
  动画总时长：1.8秒（显示1.4秒 + 渐隐消散0.4秒）
    ⓪ 圣光凝聚（0s ~ 0.4s）- 圣光向武器汇聚 + 地面裂痕蔓延 + 蓄能光球
    ① 重武斩击（0.3s ~ 0.7s）- 圣光重武器斩击轨迹 + 斩击光弧 + 斩击闪光
    ② 护甲碎裂（0.6s ~ 1.1s）- 护甲碎片飞溅 + 裂纹扩散 + 碎裂冲击波
    ③ 圣裁侵蚀（0.9s ~ 1.5s）- 圣光侵蚀符文 + DEBUFF印记铭刻 + 暗金裂纹蔓延
    ④ 余韵消散（1.2s ~ 1.8s）- 圣光余波 + 残留裂纹渐隐 + 圣粒上浮
  色彩方案：圣光金(#FFD54F) + 神圣白(#FFF8E1) + 碎裂赤红(#E53935) + 裂甲暗金(#8D6E63)
-->
<template>
  <div class="abs-3d-stage">
    <!-- ===== 阶段⓪：圣光凝聚 ===== -->
    <div class="abs-holy-dim"></div>
    <div
      v-for="i in 10"
      :key="'abs-gather-' + i"
      class="abs-gather-particle"
      :style="getGatherStyle(i)"
    ></div>
    <div class="abs-weapon-charge"></div>
    <div class="abs-ground-crack"></div>

    <!-- ===== 阶段①：重武斩击 ===== -->
    <div class="abs-slash-arc"></div>
    <div class="abs-slash-trail trail-1"></div>
    <div class="abs-slash-trail trail-2"></div>
    <div class="abs-slash-flash"></div>

    <!-- ===== 阶段②：护甲碎裂 ===== -->
    <div class="abs-shatter-flash"></div>
    <div class="abs-shatter-burst"></div>
    <div class="abs-crack-ring ring-1"></div>
    <div class="abs-crack-ring ring-2"></div>
    <div class="abs-crack-ring ring-3"></div>
    <div
      v-for="i in 12"
      :key="'abs-fragment-' + i"
      class="abs-armor-fragment"
      :style="getFragmentStyle(i)"
    >
      <div class="abs-fragment-body"></div>
    </div>
    <div
      v-for="i in 10"
      :key="'abs-shard-' + i"
      class="abs-shard"
      :style="getShardStyle(i)"
    ></div>

    <!-- ===== 阶段③：圣裁侵蚀 ===== -->
    <div class="abs-erosion-seal"></div>
    <div class="abs-debuff-rune"></div>
    <div class="abs-crack-spread"></div>

    <!-- ===== 阶段④：余韵消散 ===== -->
    <div
      v-for="i in 8"
      :key="'abs-ember-' + i"
      class="abs-ember"
      :style="getEmberStyle(i)"
    ></div>
    <div class="abs-afterglow"></div>
  </div>
</template>

<script setup>
/**
 * 碎甲圣裁 - 圣光凝聚·重武斩击·护甲碎裂·圣裁侵蚀·余韵消散
 * 圣殿骑士E技能DEBUFF特效组件，以圣光金和碎裂赤红为主色调
 * 展现将圣光之力注入重武器斩击敌人，命中后施加护甲碎裂的视觉效果
 * 全程使用 transform + opacity 实现GPU合成层加速，保证60fps丝滑流畅
 */

/**
 * 生成圣光汇聚粒子的样式
 * @param {number} index - 粒子序号（1~10）
 * @returns {Object} CSS样式对象，含角度、距离、尺寸、延迟
 */
function getGatherStyle (index) {
  const angle = (index - 1) * 36
  const distance = 100 + (index % 3) * 20
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.025
  return {
    '--abs-gather-angle': `${angle}deg`,
    '--abs-gather-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成护甲碎片的3D飞溅样式
 * @param {number} index - 碎片序号（1~12）
 * @returns {Object} CSS样式对象
 */
function getFragmentStyle (index) {
  const angle = (index - 1) * 30
  const distance = 90 + (index % 4) * 30
  const size = 18 + (index % 3) * 8
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const depth = depthDir * (35 + (index % 2) * 25)
  const arc = 18 + (index % 4) * 12
  const delay = 0.6 + (index % 3) * 0.03
  return {
    '--abs-frag-angle': `${angle}deg`,
    '--abs-frag-distance': `${distance}px`,
    '--abs-frag-size': `${size}px`,
    '--abs-frag-depth': `${depth}px`,
    '--abs-frag-arc': `${arc}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成圣光碎片的飞溅样式
 * @param {number} index - 碎片序号（1~10）
 * @returns {Object} CSS样式对象
 */
function getShardStyle (index) {
  const angle = (index - 1) * 36 + (index % 2) * 10
  const distance = 50 + (index % 4) * 20
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 10 - (index % 3) * 6
  const size = 5 + (index % 4) * 3
  const delay = 0.58 + (index % 5) * 0.02
  return {
    '--abs-shard-tx': `${tx}px`,
    '--abs-shard-ty': `${ty}px`,
    '--abs-shard-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成圣光余烬的上浮样式
 * @param {number} index - 余烬序号（1~8）
 * @returns {Object} CSS样式对象
 */
function getEmberStyle (index) {
  const tx = (index % 2 === 0 ? 1 : -1) * (16 + (index % 4) * 10)
  const ty = -45 - (index % 3) * 20
  const size = 4 + (index % 3) * 2
  const delay = 1.2 + (index % 4) * 0.04
  return {
    '--abs-ember-tx': `${tx}px`,
    '--abs-ember-ty': `${ty}px`,
    '--abs-ember-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   碎甲圣裁 (armor_break_strike) - 圣光凝聚·重武斩击·护甲碎裂·圣裁侵蚀·余韵消散
   色彩方案：圣光金(#FFD54F) + 神圣白(#FFF8E1) + 碎裂赤红(#E53935) + 裂甲暗金(#8D6E63)
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   动画总时长：1.8秒
   ================================================================ */

.abs-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
}

/* ---------- 阶段⓪：圣光凝聚 ---------- */

.abs-holy-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(35, 20, 3, 0.55) 0%,
    rgba(22, 12, 2, 0.35) 40%,
    rgba(12, 6, 1, 0.15) 70%,
    transparent 100%
  );
  animation: absHolyDim 1.8s ease-in-out forwards;
  will-change: opacity;
}

@keyframes absHolyDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  55% { opacity: 0.8; }
  100% { opacity: 0; }
}

.abs-gather-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 248, 225, 0.9), rgba(255, 193, 7, 0.3));
  box-shadow: 0 0 6px rgba(255, 213, 79, 0.5);
  transform: translate(-50%, -50%) rotate(var(--abs-gather-angle, 0deg)) translateX(var(--abs-gather-distance, 80px)) scale(1);
  opacity: 0;
  will-change: transform, opacity;
  animation: absGather 0.4s ease-in forwards;
}

@keyframes absGather {
  0% {
    transform: translate(-50%, -50%) rotate(var(--abs-gather-angle, 0deg)) translateX(var(--abs-gather-distance, 80px)) scale(1);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--abs-gather-angle, 0deg) + 180deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

.abs-weapon-charge {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 248, 225, 0.7) 25%,
    rgba(255, 213, 79, 0.4) 55%,
    rgba(229, 57, 53, 0.2) 80%,
    transparent 100%
  );
  box-shadow: 0 0 20px rgba(255, 213, 79, 0.7), 0 0 40px rgba(229, 57, 53, 0.3);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  animation: absWeaponCharge 0.45s ease-in forwards;
  will-change: transform, opacity;
}

@keyframes absWeaponCharge {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  30% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.9; }
  60% { transform: translate(-50%, -50%) scale(0.7); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}

.abs-ground-crack {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 120px;
  height: 120px;
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: absGroundCrack 0.5s ease-out 0.1s forwards;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.abs-ground-crack::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(229, 57, 53, 0.4) 5deg,
      transparent 10deg,
      transparent 60deg,
      rgba(255, 213, 79, 0.3) 65deg,
      transparent 70deg,
      transparent 120deg,
      rgba(229, 57, 53, 0.4) 125deg,
      transparent 130deg,
      transparent 180deg,
      rgba(255, 213, 79, 0.3) 185deg,
      transparent 190deg,
      transparent 240deg,
      rgba(229, 57, 53, 0.4) 245deg,
      transparent 250deg,
      transparent 300deg,
      rgba(255, 213, 79, 0.3) 305deg,
      transparent 310deg,
      transparent 360deg
    );
  -webkit-mask: radial-gradient(circle, transparent 25%, black 30%, transparent 85%);
  mask: radial-gradient(circle, transparent 25%, black 30%, transparent 85%);
}

@keyframes absGroundCrack {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  30% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0.8); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1.5); opacity: 0.5; }
}

/* ---------- 阶段①：重武斩击 ---------- */

.abs-slash-arc {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(-45deg);
  opacity: 0;
  animation: absSlashArc 0.4s cubic-bezier(0.2, 0.6, 0.3, 1) 0.3s forwards;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.abs-slash-arc::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 6px solid transparent;
  border-top-color: rgba(255, 213, 79, 0.9);
  border-right-color: rgba(255, 248, 225, 0.7);
  box-shadow: 0 0 20px rgba(255, 213, 79, 0.6);
  -webkit-mask: conic-gradient(from 270deg, black 0deg, black 90deg, transparent 90deg);
  mask: conic-gradient(from 270deg, black 0deg, black 90deg, transparent 90deg);
}

@keyframes absSlashArc {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(-90deg); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) scale(1.2) rotate(-45deg); opacity: 1; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1.4) rotate(20deg); opacity: 0; }
}

.abs-slash-trail {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 160px;
  height: 6px;
  border-radius: 3px;
  transform: translate3d(-50%, -50%, 0) scaleX(0);
  will-change: transform, opacity;
  opacity: 0;
  backface-visibility: hidden;
}

.abs-slash-trail.trail-1 {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 213, 79, 0.9) 15%,
    rgba(255, 255, 255, 1) 50%,
    rgba(229, 57, 53, 0.8) 85%,
    transparent 100%
  );
  box-shadow: 0 0 15px rgba(255, 213, 79, 0.8), 0 0 30px rgba(229, 57, 53, 0.4);
  animation: absSlashTrail1 0.35s cubic-bezier(0.2, 0.6, 0.3, 1) 0.3s forwards;
}

.abs-slash-trail.trail-2 {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(229, 57, 53, 0.6) 15%,
    rgba(255, 248, 225, 0.8) 50%,
    rgba(229, 57, 53, 0.6) 85%,
    transparent 100%
  );
  box-shadow: 0 0 10px rgba(229, 57, 53, 0.5);
  animation: absSlashTrail2 0.35s cubic-bezier(0.2, 0.6, 0.3, 1) 0.33s forwards;
}

@keyframes absSlashTrail1 {
  0% { transform: translate3d(-50%, -50%, 0) rotate(30deg) scaleX(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) rotate(30deg) scaleX(1.3); opacity: 1; }
  60% { transform: translate3d(-50%, -50%, 0) rotate(30deg) scaleX(1); opacity: 0.5; }
  100% { transform: translate3d(-50%, -50%, 0) rotate(30deg) scaleX(1.5); opacity: 0; }
}

@keyframes absSlashTrail2 {
  0% { transform: translate3d(-50%, -50%, 0) rotate(-25deg) scaleX(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) rotate(-25deg) scaleX(1.2); opacity: 0.8; }
  60% { transform: translate3d(-50%, -50%, 0) rotate(-25deg) scaleX(1); opacity: 0.4; }
  100% { transform: translate3d(-50%, -50%, 0) rotate(-25deg) scaleX(1.4); opacity: 0; }
}

.abs-slash-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.7) 0%,
    rgba(255, 213, 79, 0.4) 15%,
    rgba(229, 57, 53, 0.2) 35%,
    transparent 65%
  );
  opacity: 0;
  animation: absSlashFlash 0.3s ease-out 0.35s forwards;
  will-change: opacity;
}

@keyframes absSlashFlash {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

/* ---------- 阶段②：护甲碎裂 ---------- */

.abs-shatter-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(229, 57, 53, 0.8) 0%,
    rgba(255, 213, 79, 0.5) 12%,
    rgba(255, 193, 7, 0.2) 35%,
    transparent 70%
  );
  opacity: 0;
  animation: absShatterFlash 0.5s ease-out 0.6s forwards;
  will-change: opacity;
}

@keyframes absShatterFlash {
  0% { opacity: 0; }
  10% { opacity: 1; }
  35% { opacity: 0.5; }
  100% { opacity: 0; }
}

.abs-shatter-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 213, 79, 0.8) 15%,
    rgba(229, 57, 53, 0.6) 38%,
    rgba(141, 110, 99, 0.3) 65%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: absShatterBurst 0.6s cubic-bezier(0.15, 0.6, 0.3, 1) 0.6s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}

@keyframes absShatterBurst {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  12% { transform: translate3d(-50%, -50%, 0) scale(1.2); opacity: 1; }
  50% { transform: translate3d(-50%, -50%, 0) scale(2.2); opacity: 0.6; }
  100% { transform: translate3d(-50%, -50%, 0) scale(3.5); opacity: 0; }
}

.abs-crack-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(229, 57, 53, 0.85);
  box-shadow:
    0 0 20px rgba(229, 57, 53, 0.6),
    inset 0 0 16px rgba(255, 193, 7, 0.3);
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.abs-crack-ring.ring-1 { animation: absCrackRing 0.5s ease-out 0.6s forwards; }
.abs-crack-ring.ring-2 {
  border-color: rgba(255, 213, 79, 0.7);
  animation: absCrackRing 0.55s ease-out 0.65s forwards;
}
.abs-crack-ring.ring-3 {
  border-color: rgba(141, 110, 99, 0.5);
  animation: absCrackRing 0.6s ease-out 0.7s forwards;
}

@keyframes absCrackRing {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  12% { opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(13); opacity: 0; }
}

.abs-armor-fragment {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--abs-frag-size, 24px);
  height: var(--abs-frag-size, 24px);
  transform: translate3d(-50%, -50%, 0) rotate(var(--abs-frag-angle, 0deg));
  animation: absFragmentScatter3D 0.7s cubic-bezier(0.2, 0.5, 0.4, 1) 0.6s forwards;
  will-change: transform, opacity;
  opacity: 0;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

@keyframes absFragmentScatter3D {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--abs-frag-angle, 0deg)) translateX(0) translateZ(0) translateY(0) scale(0.5);
    opacity: 0;
  }
  10% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--abs-frag-angle, 0deg)) translateX(10px) translateZ(var(--abs-frag-depth, 0px)) translateY(calc(var(--abs-frag-arc, 0px) * -0.5)) scale(1.3);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--abs-frag-angle, 0deg)) translateX(calc(var(--abs-frag-distance, 80px) * 0.6)) translateZ(var(--abs-frag-depth, 0px)) translateY(calc(var(--abs-frag-arc, 0px) * -1)) scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--abs-frag-angle, 0deg)) translateX(var(--abs-frag-distance, 80px)) translateZ(var(--abs-frag-depth, 0px)) translateY(0) scale(0.3);
    opacity: 0;
  }
}

.abs-fragment-body {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(229, 57, 53, 0.7) 0%,
    rgba(255, 213, 79, 0.6) 35%,
    rgba(255, 248, 225, 0.85) 50%,
    rgba(141, 110, 99, 0.5) 80%,
    rgba(229, 57, 53, 0.4) 100%
  );
  clip-path: polygon(20% 0%, 80% 10%, 100% 50%, 75% 90%, 25% 100%, 0% 60%);
  box-shadow:
    0 0 15px rgba(229, 57, 53, 0.6),
    0 0 30px rgba(255, 213, 79, 0.3);
}

.abs-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--abs-shard-size, 6px);
  height: var(--abs-shard-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(255, 213, 79, 0.7) 40%,
    rgba(229, 57, 53, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(229, 57, 53, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: absShardFly 0.6s ease-out 0.6s forwards;
  will-change: transform, opacity;
}

@keyframes absShardFly {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  12% {
    transform: translate3d(-50%, -50%, 0) scale(1.4);
    opacity: 1;
  }
  100% {
    transform: translate3d(calc(-50% + var(--abs-shard-tx, 0px)), calc(-50% + var(--abs-shard-ty, 0px)), 0) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段③：圣裁侵蚀 ---------- */

.abs-erosion-seal {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  opacity: 0;
  animation: absErosionSeal 0.6s ease-out 0.9s forwards,
             absErosionSealRotate 3s linear 1.5s forwards;
  will-change: transform, opacity;
}

.abs-erosion-seal::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid rgba(229, 57, 53, 0.7);
  box-shadow:
    0 0 15px rgba(229, 57, 53, 0.5),
    inset 0 0 12px rgba(255, 193, 7, 0.3);
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(229, 57, 53, 0.2) 3deg,
    transparent 6deg,
    transparent 30deg,
    rgba(255, 213, 79, 0.15) 33deg,
    transparent 36deg
  );
}

.abs-erosion-seal::after {
  content: '';
  position: absolute;
  inset: 20%;
  border-radius: 50%;
  border: 2px solid rgba(255, 213, 79, 0.5);
  box-shadow: 0 0 10px rgba(255, 213, 79, 0.4);
}

@keyframes absErosionSeal {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  40% { transform: translate3d(-50%, -50%, 0) scale(1.1) rotate(15deg); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(30deg); opacity: 0.8; }
}

@keyframes absErosionSealRotate {
  0% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(30deg); opacity: 0.8; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(210deg); opacity: 0; }
}

.abs-debuff-rune {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: absDebuffRune 0.8s ease-out 1s forwards;
  will-change: transform, opacity;
}

.abs-debuff-rune::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(0deg, transparent 45%, rgba(229, 57, 53, 0.8) 48%, rgba(229, 57, 53, 0.8) 52%, transparent 55%),
    linear-gradient(90deg, transparent 45%, rgba(229, 57, 53, 0.8) 48%, rgba(229, 57, 53, 0.8) 52%, transparent 55%),
    linear-gradient(45deg, transparent 45%, rgba(255, 213, 79, 0.6) 48%, rgba(255, 213, 79, 0.6) 52%, transparent 55%),
    linear-gradient(-45deg, transparent 45%, rgba(255, 213, 79, 0.6) 48%, rgba(255, 213, 79, 0.6) 52%, transparent 55%);
  box-shadow: 0 0 15px rgba(229, 57, 53, 0.5);
  -webkit-mask: radial-gradient(circle, black 30%, transparent 70%);
  mask: radial-gradient(circle, black 30%, transparent 70%);
}

@keyframes absDebuffRune {
  0% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  30% { transform: translate3d(-50%, -50%, 0) scale(1.3) rotate(20deg); opacity: 1; }
  60% { transform: translate3d(-50%, -50%, 0) scale(1) rotate(45deg); opacity: 0.8; }
  100% { transform: translate3d(-50%, -50%, 0) scale(1.2) rotate(90deg); opacity: 0; }
}

.abs-crack-spread {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 200px;
  height: 200px;
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: absCrackSpread 0.8s ease-out 0.9s forwards;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.abs-crack-spread::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    conic-gradient(
      from 15deg,
      transparent 0deg,
      rgba(229, 57, 53, 0.3) 3deg,
      transparent 6deg,
      transparent 45deg,
      rgba(141, 110, 99, 0.3) 48deg,
      transparent 51deg,
      transparent 90deg,
      rgba(229, 57, 53, 0.3) 93deg,
      transparent 96deg,
      transparent 135deg,
      rgba(255, 213, 79, 0.2) 138deg,
      transparent 141deg,
      transparent 180deg,
      rgba(229, 57, 53, 0.3) 183deg,
      transparent 186deg,
      transparent 225deg,
      rgba(141, 110, 99, 0.3) 228deg,
      transparent 231deg,
      transparent 270deg,
      rgba(229, 57, 53, 0.3) 273deg,
      transparent 276deg,
      transparent 315deg,
      rgba(255, 213, 79, 0.2) 318deg,
      transparent 321deg,
      transparent 360deg
    );
  -webkit-mask: radial-gradient(circle, transparent 10%, black 15%, transparent 90%);
  mask: radial-gradient(circle, transparent 10%, black 15%, transparent 90%);
}

@keyframes absCrackSpread {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  20% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0.8); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(2); opacity: 0; }
}

/* ---------- 阶段④：余韵消散 ---------- */

.abs-ember {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--abs-ember-size, 5px);
  height: var(--abs-ember-size, 5px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 213, 79, 0.9) 0%,
    rgba(229, 57, 53, 0.4) 50%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(229, 57, 53, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: absEmberFloat 1s ease-out 1.2s forwards;
  will-change: transform, opacity;
}

@keyframes absEmberFloat {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% {
    transform: translate3d(calc(-50% + var(--abs-ember-tx, 0px) * 0.2), calc(-50% + var(--abs-ember-ty, 0px) * 0.2), 0) scale(1.2);
    opacity: 1;
  }
  80% { opacity: 0.4; }
  100% {
    transform: translate3d(calc(-50% + var(--abs-ember-tx, 0px)), calc(-50% + var(--abs-ember-ty, 0px)), 0) scale(0.2);
    opacity: 0;
  }
}

.abs-afterglow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50%;
  height: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(229, 57, 53, 0.15) 0%,
    rgba(255, 213, 79, 0.1) 40%,
    transparent 70%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: absAfterglow 0.9s ease-out 1.2s forwards;
  will-change: transform, opacity;
}

@keyframes absAfterglow {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  25% { transform: translate3d(-50%, -50%, 0) scale(1.3); opacity: 0.5; }
  100% { transform: translate3d(-50%, -50%, 0) scale(2); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .abs-3d-stage * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
