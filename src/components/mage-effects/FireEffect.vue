<!--
  @file FireEffect.vue
  @generated 2026-06-29
  @description 奥术风暴 - 火球坠落 + 爆炸扩散
  从 MageSkillEffect.vue 拆分而来，仅负责本特效的模板、脚本和样式
  GPU加速：所有动画仅使用 translate3d + opacity，避免重排，保证丝滑流畅
-->
<template>
          <div class="fire-sky-dim"></div>
          <div class="fire-meteor">
            <div class="fire-meteor-core"></div>
            <div class="fire-meteor-trail"></div>
          </div>
          <div class="fire-explosion">
            <div
              v-for="i in 12"
              :key="'fire-particle-' + i"
              class="fire-particle"
              :style="getFireParticleStyle(i)"
            ></div>
          </div>
          <div class="fire-shockwave"></div>
          <div class="fire-afterglow"></div>
</template>

<script setup>
/**
 * 奥术风暴 - 火球坠落 + 爆炸扩散
 * 从 MageSkillEffect.vue 拆分的独立特效组件
 */

function getFireParticleStyle (index) {
  const angle = (index - 1) * 30 + (index % 2) * 7
  const distance = 35 + (index % 4) * 12
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance
  const size = 8 + (index % 3) * 4
  const delay = (index % 3) * 0.04
  return {
    '--fire-tx': `${tx}px`,
    '--fire-ty': `${ty}px`,
    '--fire-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   陨石坠落 / 奥术风暴 - 火球坠击 + 爆炸扩散
   ================================================================ */

/* 天空暗化 - 火焰来临前天空变红暗 */
.fire-sky-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 0%,
    rgba(80, 20, 0, 0.6) 0%,
    rgba(40, 10, 0, 0.4) 40%,
    transparent 80%
  );
  animation: fireSkyDim 1.5s ease-out forwards;
  will-change: opacity;
}

@keyframes fireSkyDim {
  0% { opacity: 0; }
  10% { opacity: 1; }
  60% { opacity: 0.8; }
  100% { opacity: 0; }
}

/* 火球本体 - 从上方坠落到中心 */
.fire-meteor {
  position: absolute;
  top: 0;
  left: 50%;
  width: 30px;
  height: 30px;
  transform: translateX(-50%);
  animation: fireMeteorFall 0.5s cubic-bezier(0.5, 0, 0.9, 0.5) forwards;
  will-change: transform;
}

@keyframes fireMeteorFall {
  0% {
    transform: translateX(-50%) translateY(-60px) scale(0.5);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(0) scale(1.2);
    opacity: 1;
  }
}

/* 火球核心 - 明亮橙红色 */
.fire-meteor-core {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 40% 40%,
    rgba(255, 255, 200, 1) 0%,
    rgba(255, 180, 50, 0.95) 30%,
    rgba(255, 100, 0, 0.8) 60%,
    rgba(200, 50, 0, 0.6) 100%
  );
  box-shadow:
    0 0 20px rgba(255, 120, 0, 0.9),
    0 0 40px rgba(255, 80, 0, 0.5);
}

/* 火球拖尾 - 向上渐隐的火焰尾迹 */
.fire-meteor-trail {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 50px;
  background: linear-gradient(
    to top,
    rgba(255, 150, 0, 0.7) 0%,
    rgba(255, 100, 0, 0.3) 50%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(3px);
}

/* 爆炸容器 */
.fire-explosion {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: fireExplosionContainer 1.2s ease-out 0.4s forwards;
  opacity: 0;
  will-change: opacity;
}

@keyframes fireExplosionContainer {
  0% { opacity: 0; }
  5% { opacity: 1; }
  100% { opacity: 0; }
}

/* 爆炸粒子 - 向四周飞散的火焰碎片 */
.fire-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--fire-size, 10px);
  height: var(--fire-size, 10px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 180, 0.95) 0%,
    rgba(255, 140, 0, 0.8) 40%,
    rgba(255, 60, 0, 0.4) 100%
  );
  box-shadow: 0 0 8px rgba(255, 100, 0, 0.6);
  transform: translate(-50%, -50%) scale(0);
  animation: fireParticleFly 0.8s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes fireParticleFly {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% + var(--fire-tx, 0px)), calc(-50% + var(--fire-ty, 0px))) scale(0.2);
    opacity: 0;
  }
}

/* 冲击波 - 从中心向外扩散的火环 */
.fire-shockwave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid rgba(255, 140, 0, 0.8);
  box-shadow:
    0 0 15px rgba(255, 100, 0, 0.6),
    inset 0 0 10px rgba(255, 200, 100, 0.4);
  transform: translate(-50%, -50%) scale(0);
  animation: fireShockwave 0.6s ease-out 0.45s forwards;
  will-change: transform, opacity;
}

@keyframes fireShockwave {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0;
  }
}

/* 余焰 - 爆炸后残留的火焰光晕 */
.fire-afterglow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 100, 0, 0.3) 0%,
    rgba(255, 50, 0, 0.15) 40%,
    transparent 70%
  );
  transform: translate(-50%, -50%) scale(0);
  animation: fireAfterglow 0.8s ease-out 0.5s forwards;
  will-change: transform, opacity;
}

@keyframes fireAfterglow {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  30% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

</style>
