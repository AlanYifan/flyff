<!--
  @file ThunderStormEffect.vue
  @generated 2026-06-29
  @description 电闪雷鸣 - 天降神雷：单道粗壮闪电从天而降直劈目标
  从 MageSkillEffect.vue 拆分而来，仅负责本特效的模板、脚本和样式
  GPU加速：所有动画仅使用 translate3d + opacity，避免重排，保证丝滑流畅
-->
<template>
          <div class="thunder-dim"></div>
          <!-- 全屏闪光 - 闪电劈落瞬间的白色全屏爆闪 -->
          <div class="thunder-flash"></div>
          <!-- 闪电主体 - 粗壮闪电从天而降直劈目标 -->
          <div class="thunder-bolt">
            <div class="thunder-bolt-glow"></div>
            <div class="thunder-bolt-main"></div>
            <div class="thunder-bolt-branch ba"></div>
            <div class="thunder-bolt-branch bb"></div>
            <div class="thunder-bolt-branch bc"></div>
          </div>
          <!-- 冲击爆点 - 闪电落地的巨大光球 -->
          <div class="thunder-impact"></div>
          <!-- 冲击波环 - 落地后向外扩散的环形冲击波 -->
          <div class="thunder-shockwave"></div>
          <!-- 电火花飞溅 - 从落雷点向四周飞溅 -->
          <div class="thunder-sparks">
            <div
              v-for="i in 12"
              :key="'thunder-spark-' + i"
              class="thunder-spark"
              :style="getThunderSparkStyle(i)"
            ></div>
          </div>
          <!-- 地面焦痕 -->
          <div class="thunder-scorch"></div>
</template>

<script setup>
/**
 * 电闪雷鸣 - 天降神雷：单道粗壮闪电从天而降直劈目标
 * 从 MageSkillEffect.vue 拆分的独立特效组件
 */

function getThunderSparkStyle (index) {
  const angle = (index - 1) * 30
  const distance = 25 + (index % 3) * 12
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance
  const delay = (index % 4) * 0.04
  return {
    '--thunder-spark-tx': `${tx}px`,
    '--thunder-spark-ty': `${ty}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   电闪雷鸣 (mage_t) - 天降神雷：单道粗壮闪电从天而降直劈目标
   技能描述：唤起闪电强力攻击敌人
   动画来源：MageSkillShowcase 天降神雷样式，适配为一次性播放
   ================================================================ */

/* 暗幕 */
.thunder-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 0%,
    rgba(10, 0, 40, 0.5) 0%,
    rgba(5, 0, 30, 0.3) 50%,
    transparent 100%
  );
  animation: thun-dim 1.2s ease-out forwards;
  pointer-events: none;
  will-change: opacity;
}
@keyframes thun-dim {
  0%   { opacity: 0; }
  5%   { opacity: 1; }
  50%  { opacity: 0.6; }
  100% { opacity: 0; }
}

/* 全屏闪光 - 闪电劈落瞬间的白色全屏爆闪 */
.thunder-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(220, 235, 255, 0.9) 0%,
    rgba(150, 180, 255, 0.5) 30%,
    transparent 70%
  );
  animation: thun-flash 1s ease-out forwards;
  opacity: 0;
  pointer-events: none;
  will-change: opacity;
}
@keyframes thun-flash {
  0%, 100% { opacity: 0; }
  3%  { opacity: 1; }
  8%  { opacity: 0.2; }
  12% { opacity: 0.9; }
  20% { opacity: 0.3; }
  50% { opacity: 0; }
}

/* 闪电主体 - 粗壮闪电从天而降 */
.thunder-bolt {
  position: absolute;
  top: 0;
  left: 50%;
  width: 12px;
  height: 100%;
  transform: translateX(-50%);
  animation: thun-bolt-flash 1s ease-out forwards;
  will-change: opacity;
}
@keyframes thun-bolt-flash {
  0%, 100% { opacity: 0; }
  3%  { opacity: 1; }
  8%  { opacity: 0.2; }
  12% { opacity: 1; }
  20% { opacity: 0.3; }
  25% { opacity: 0.8; }
  50% { opacity: 0; }
}

/* 闪电外层光晕 - 包裹闪电的巨大发光层 */
.thunder-bolt-glow {
  position: absolute;
  inset: -8px -20px;
  background: radial-gradient(
    ellipse at center,
    rgba(180, 210, 255, 0.6) 0%,
    rgba(120, 160, 255, 0.3) 40%,
    transparent 70%
  );
  filter: blur(4px);
  opacity: inherit;
}

/* 闪电核心 - 粗壮之字形 */
.thunder-bolt-main {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 1),
    rgba(200, 220, 255, 1),
    rgba(255, 255, 255, 1)
  );
  box-shadow:
    0 0 20px rgba(150, 180, 255, 1),
    0 0 40px rgba(100, 150, 255, 0.8),
    0 0 60px rgba(80, 120, 255, 0.4);
  clip-path: polygon(
    30% 0%, 70% 3%, 25% 12%, 75% 22%, 30% 32%,
    70% 42%, 25% 52%, 75% 62%, 30% 72%, 70% 82%,
    35% 92%, 65% 100%
  );
}

/* 分支闪电 - 三道分支 */
.thunder-bolt-branch {
  position: absolute;
  background: rgba(220, 235, 255, 0.9);
  box-shadow:
    0 0 8px rgba(150, 180, 255, 0.8),
    0 0 16px rgba(100, 150, 255, 0.4);
  border-radius: 2px;
}
.thunder-bolt-branch.ba {
  top: 25%;
  left: 50%;
  width: 3px;
  height: 30px;
  transform: translateX(-50%) rotate(-35deg);
  transform-origin: top center;
}
.thunder-bolt-branch.bb {
  top: 50%;
  left: 50%;
  width: 3px;
  height: 25px;
  transform: translateX(-50%) rotate(40deg);
  transform-origin: top center;
}
.thunder-bolt-branch.bc {
  top: 70%;
  left: 50%;
  width: 3px;
  height: 22px;
  transform: translateX(-50%) rotate(-30deg);
  transform-origin: top center;
}

/* 冲击爆点 - 闪电落地的巨大光球 */
.thunder-impact {
  position: absolute;
  bottom: 8%;
  left: 50%;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(180, 210, 255, 0.6) 30%,
    rgba(100, 150, 255, 0.3) 60%,
    transparent 80%
  );
  transform: translateX(-50%) scale(0);
  animation: thun-impact 1s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes thun-impact {
  0%, 10% { transform: translateX(-50%) scale(0); opacity: 0; }
  15% { transform: translateX(-50%) scale(1.8); opacity: 1; }
  40% { transform: translateX(-50%) scale(3); opacity: 0.4; }
  60% { transform: translateX(-50%) scale(4); opacity: 0; }
  100% { transform: translateX(-50%) scale(4); opacity: 0; }
}

/* 冲击波环 - 落地后向外扩散的环形冲击波 */
.thunder-shockwave {
  position: absolute;
  bottom: 10%;
  left: 50%;
  width: 20px;
  height: 8px;
  border-radius: 50%;
  border: 3px solid rgba(200, 220, 255, 0.9);
  box-shadow: 0 0 12px rgba(150, 180, 255, 0.6);
  transform: translate(-50%, 50%) scale(0);
  animation: thun-shockwave 1s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes thun-shockwave {
  0%, 10% { transform: translate(-50%, 50%) scale(0); opacity: 0; }
  15% { transform: translate(-50%, 50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, 50%) scale(6); opacity: 0; }
}

/* 电火花飞溅容器 */
.thunder-sparks {
  position: absolute;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.thunder-spark {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 16px;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 1),
    rgba(180, 210, 255, 0.5)
  );
  box-shadow: 0 0 6px rgba(150, 180, 255, 0.6);
  border-radius: 2px;
  animation: thun-spark 1s ease-out forwards;
  will-change: transform, opacity;
}
@keyframes thun-spark {
  0%, 10% { transform: translate(0, 0) scale(0); opacity: 0; }
  15% { transform: translate(0, 0) scale(1.2); opacity: 1; }
  100% { transform: translate(var(--thunder-spark-tx, 0px), var(--thunder-spark-ty, 0px)) scale(0.3); opacity: 0; }
}

/* 地面焦痕 */
.thunder-scorch {
  position: absolute;
  bottom: 8%;
  left: 50%;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(100, 80, 200, 0.4) 0%,
    rgba(60, 40, 150, 0.2) 50%,
    transparent 100%
  );
  transform: translateX(-50%) scale(0);
  animation: thun-scorch 0.6s ease-out 0.3s forwards;
  pointer-events: none;
  will-change: transform, opacity;
}
@keyframes thun-scorch {
  0%   { transform: translateX(-50%) scale(0); opacity: 0; }
  30%  { transform: translateX(-50%) scale(1.5); opacity: 0.8; }
  100% { transform: translateX(-50%) scale(2); opacity: 0; }
}

</style>
