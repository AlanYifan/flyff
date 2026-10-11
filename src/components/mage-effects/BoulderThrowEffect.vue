<!--
  @file BoulderThrowEffect.vue
  @generated 2026-06-29
  @description 移山之术 - 巨岩山峰沿抛物线抛掷飞来 + 碎石飞溅
  从 MageSkillEffect.vue 拆分而来，仅负责本特效的模板、脚本和样式
  GPU加速：所有动画仅使用 translate3d + opacity，避免重排，保证丝滑流畅
-->
<template>
    <div class="bthrow-dim"></div>
    <!-- 山峰本体 - 从左下方沿抛物线飞来砸向目标 -->
    <div class="bthrow-boulder">
    <div class="bthrow-boulder-body"></div>
    <div class="bthrow-boulder-peak"></div>
    <div class="bthrow-boulder-trail"></div>
    </div>
          <!-- 抛掷轨迹弧线 -->
          <div class="bthrow-arc"></div>
          <!-- 砸击碎石飞溅 -->
          <div class="bthrow-impact">
            <div
              v-for="i in 10"
              :key="'bthrow-debris-' + i"
              class="bthrow-debris"
              :style="getBoulderThrowStyle(i)"
            ></div>
          </div>
          <!-- 地面冲击波 -->
          <div class="bthrow-shockwave wave-s1"></div>
          <div class="bthrow-shockwave wave-s2"></div>
          <!-- 地面尘烟 -->
          <div class="bthrow-dust"></div>
</template>

<script setup>
/**
 * 移山之术 - 巨岩山峰沿抛物线抛掷飞来 + 碎石飞溅
 * 从 MageSkillEffect.vue 拆分的独立特效组件
 */

function getBoulderThrowStyle (index) {
  const angle = (index - 1) * 36 + (index % 2) * 8
  const distance = 28 + (index % 4) * 14
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 15
  const size = 6 + (index % 3) * 4
  const delay = (index % 3) * 0.03
  return {
    '--bt-tx': `${tx}px`,
    '--bt-ty': `${ty}px`,
    '--bt-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   移山之术 (mage_y) - 巨岩沿抛物线抛掷飞来 + 碎石飞溅
   技能描述：召唤巨大的岩石掷向敌人
   移山：搬移山岩；掷向：沿抛物线飞来砸击目标
   ================================================================ */

/* 暗幕 */
.bthrow-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(80, 50, 0, 0.2), transparent 65%);
  animation: bt-dim 1.5s ease-out forwards;
  pointer-events: none;
}
@keyframes bt-dim {
  0%   { opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0; }
}

/* 巨岩本体 - 从左下方沿抛物线飞来砸向目标 */
.bthrow-boulder {
  position: absolute;
  bottom: 30%;
  left: 50%;
  width: 60px;
  height: 60px;
  pointer-events: none;
  z-index: 5;
  will-change: transform, opacity;
  animation: bt-boulder-fly 1.5s cubic-bezier(0.35, 0.05, 0.5, 0.95) forwards;
}
/* 山峰本体 - 不规则山峰轮廓，使用 clip-path 制造尖峰造型 */
.bthrow-boulder-body {
  position: absolute;
  inset: 0;
  clip-path: polygon(
    20% 100%, 0% 75%, 10% 60%, 5% 45%, 25% 20%, 35% 5%,
    50% 0%, 65% 8%, 75% 25%, 90% 40%, 95% 60%, 85% 80%, 80% 100%
  );
  background:
    linear-gradient(to top,
      rgba(60, 45, 25, 0.95) 0%,
      rgba(100, 80, 50, 0.9) 40%,
      rgba(140, 120, 85, 0.9) 70%,
      rgba(180, 160, 130, 0.85) 100%);
  box-shadow: inset -6px -4px 10px rgba(0, 0, 0, 0.4);
}
/* 山峰高光 - 顶部亮面模拟阳光照射 */
.bthrow-boulder-peak {
  position: absolute;
  top: 0;
  left: 20%;
  width: 60%;
  height: 45%;
  clip-path: polygon(
    25% 100%, 10% 70%, 30% 30%, 50% 0%, 70% 35%, 90% 70%, 75% 100%
  );
  background: linear-gradient(to top,
    rgba(160, 140, 100, 0.6) 0%,
    rgba(200, 180, 140, 0.7) 50%,
    rgba(230, 210, 170, 0.8) 100%);
  opacity: 0.7;
}
.bthrow-boulder-trail {
  position: absolute;
  top: 50%;
  right: 50%;
  width: 50px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(to right, rgba(140, 110, 70, 0.6), transparent);
  filter: blur(3px);
  transform: translateY(-50%);
}
@keyframes bt-boulder-fly {
  0%   { transform: translate(-180px, 80px) scale(0.7) rotate(0deg); opacity: 0; }
  10%  { transform: translate(-160px, 60px) scale(0.75) rotate(15deg); opacity: 1; }
  50%  { transform: translate(-80px, -40px) scale(0.9) rotate(90deg); opacity: 1; }
  75%  { transform: translate(-20px, -10px) scale(1) rotate(140deg); opacity: 1; }
  85%  { transform: translate(0, 0) scale(1.1) rotate(160deg); opacity: 1; }
  92%  { transform: translate(0, 0) scale(1.3) rotate(160deg); opacity: 0.8; }
  100% { transform: translate(0, 0) scale(0.5) rotate(160deg); opacity: 0; }
}

/* 抛掷轨迹弧线 */
.bthrow-arc {
  position: absolute;
  bottom: 30%;
  left: 50%;
  width: 180px;
  height: 80px;
  border-bottom: 2px dashed rgba(140, 110, 70, 0.3);
  border-radius: 0 0 50% 50% / 0 0 100% 100%;
  transform: translateX(-50%) translateX(-60px);
  animation: bt-arc 1.5s ease-out forwards;
  opacity: 0;
  pointer-events: none;
}
@keyframes bt-arc {
  0%   { opacity: 0.4; }
  85%  { opacity: 0.2; }
  100% { opacity: 0; }
}

/* 碎石飞溅 */
.bthrow-impact {
  position: absolute;
  bottom: 30%;
  left: 50%;
  pointer-events: none;
  opacity: 0;
  animation: bt-impact-show 0.8s ease-out 1.15s forwards;
}
@keyframes bt-impact-show {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}
.bthrow-debris {
  position: absolute;
  bottom: 0;
  left: 0;
  width: var(--bt-size);
  height: var(--bt-size);
  border-radius: 40% 60% 50% 45%;
  background: radial-gradient(circle at 30% 30%, rgba(160, 140, 100, 0.95), rgba(80, 60, 35, 0.9));
  will-change: transform, opacity;
  animation: bt-debris 0.8s cubic-bezier(0.3, 0.7, 0.5, 1) forwards;
}
@keyframes bt-debris {
  0%   { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
  50%  { transform: translate(calc(var(--bt-tx) * 0.7), var(--bt-ty)) scale(1) rotate(180deg); opacity: 1; }
  100% { transform: translate(var(--bt-tx), calc(var(--bt-ty) + 30px)) scale(0.5) rotate(360deg); opacity: 0; }
}

/* 地面冲击波 */
.bthrow-shockwave {
  position: absolute;
  bottom: 28%;
  left: 50%;
  width: 60px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(160, 130, 80, 0.7);
  transform: translateX(-50%);
  pointer-events: none;
  opacity: 0;
  will-change: transform, opacity;
}
.bthrow-shockwave.wave-s1 {
  animation: bt-shock 0.7s ease-out 1.15s forwards;
}
.bthrow-shockwave.wave-s2 {
  animation: bt-shock 0.7s ease-out 1.25s forwards;
}
@keyframes bt-shock {
  0%   { transform: translateX(-50%) scale(0.3); opacity: 0; }
  30%  { transform: translateX(-50%) scale(1); opacity: 0.8; }
  100% { transform: translateX(-50%) scale(2.2); opacity: 0; }
}

/* 地面尘烟 */
.bthrow-dust {
  position: absolute;
  bottom: 25%;
  left: 50%;
  width: 70px;
  height: 30px;
  border-radius: 50% 50% 30% 30% / 70% 70% 30% 30%;
  background: radial-gradient(ellipse at center, rgba(180, 150, 100, 0.5), transparent 70%);
  transform: translateX(-50%);
  filter: blur(4px);
  opacity: 0;
  animation: bt-dust 0.9s ease-out 1.15s forwards;
  pointer-events: none;
}
@keyframes bt-dust {
  0%   { transform: translateX(-50%) scale(0.5); opacity: 0; }
  30%  { transform: translateX(-50%) scale(1); opacity: 0.7; }
  100% { transform: translateX(-50%) scale(1.5) translateY(-10px); opacity: 0; }
}

</style>
