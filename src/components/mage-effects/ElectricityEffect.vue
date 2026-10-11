<!--
  @file ElectricityEffect.vue
  @generated 2026-06-29
  @description 风雷狂袭 - 风雷交融·狂暴轰炸·爆裂扩散
  从 MageSkillEffect.vue 拆分而来，仅负责本特效的模板、脚本和样式
  GPU加速：所有动画仅使用 translate3d + opacity，避免重排，保证丝滑流畅
-->
<template>
          <!-- ========== 阶段一：风雷聚涌（0s ~ 0.5s）—— 风与电交织汇聚 ========== -->
          <!-- 暗幕：深紫蓝覆盖，风雷将至 -->
          <div class="wr-dim"></div>
          <!-- 全屏横扫气流条纹：16条蓝白风带从不同方向横扫战场，营造狂风肆虐效果 -->
          <div class="wr-wind-bands">
            <div
              v-for="i in 16"
              :key="'wr-wind-band-' + i"
              class="wr-wind-band"
              :style="getStormWindBandStyle(i)"
            ></div>
          </div>
          <!-- 风雷旋涡：风与电交织的旋转能量场 -->
          <div class="wr-vortex">
            <div class="wr-vortex-ring vr-1"></div>
            <div class="wr-vortex-ring vr-2"></div>
            <div class="wr-vortex-core"></div>
          </div>
          <!-- 风雷螺旋粒子：20个风+电复合粒子从四周螺旋汇聚 -->
          <div
            v-for="i in 20"
            :key="'wr-spiral-' + i"
            class="wr-spiral-particle"
            :style="getStormSpiralStyle(i)"
          ></div>

          <!-- ========== 阶段二：狂雷暴击（0.4s ~ 1.3s）—— 三波密集轰炸 ========== -->
          <!-- 8道闪电分3波错峰劈落，每波更猛烈 -->
          <div
            v-for="i in 8"
            :key="'wr-bolt-' + i"
            class="wr-bolt"
            :class="i >= 7 ? 'wr-bolt-thick' : ''"
            :style="getStormBoltStyle(i)"
          >
            <div class="wr-bolt-body"></div>
            <div class="wr-bolt-glow"></div>
          </div>
          <!-- 三波全屏爆闪 -->
          <div class="wr-flash"></div>
          <!-- 8个落雷冲击点 -->
          <div
            v-for="i in 8"
            :key="'wr-strike-' + i"
            class="wr-strike-impact"
            :style="getStormStrikeStyle(i)"
          ></div>
          <!-- 风雷碎片：被轰炸溅起的带电碎屑 -->
          <div
            v-for="i in 14"
            :key="'wr-debris-' + i"
            class="wr-debris"
            :style="getStormDebrisStyle(i)"
          ></div>

          <!-- ========== 阶段三：风雷爆裂（1.1s ~ 1.8s）—— 360°风雷爆炸 ========== -->
          <!-- 3层爆裂冲击环 -->
          <div class="wr-blast-ring br-1"></div>
          <div class="wr-blast-ring br-2"></div>
          <div class="wr-blast-ring br-3"></div>
          <!-- 风刃：12道月牙形实体风刃从中心360°射出，风的攻击形态 -->
          <div
            v-for="i in 12"
            :key="'wr-blade-' + i"
            class="wr-wind-blade"
            :style="getStormWindBladeStyle(i)"
          ></div>
          <!-- 16道风雷射线：风+电组合的旋转弹射 -->
          <div
            v-for="i in 16"
            :key="'wr-burst-' + i"
            class="wr-burst-bolt"
            :style="getStormBurstStyle(i)"
          ></div>
          <!-- 中心爆裂闪光 -->
          <div class="wr-blast-flash"></div>

          <!-- ========== 阶段四：风雷消散（1.7s ~ 2.2s） ========== -->
          <!-- 残余气旋：消散阶段缓慢旋转的残余气流 -->
          <div class="wr-swirl">
            <div class="wr-swirl-ring sr-1"></div>
            <div class="wr-swirl-ring sr-2"></div>
          </div>
          <!-- 地面焦痕 -->
          <div class="wr-scorch"></div>
          <!-- 风雷余韵 -->
          <div class="wr-residue"></div>
</template>

<script setup>
/**
 * 风雷狂袭 - 风雷交融·狂暴轰炸·爆裂扩散
 * 从 MageSkillEffect.vue 拆分的独立特效组件
 */

function getStormWindBandStyle (index) {
  const top = 5 + (index % 8) * 12
  const angle = (index % 2 === 0 ? 1 : -1) * (4 + (index % 4) * 5)
  const dur = 0.7 + (index % 4) * 0.2
  const delay = 0.1 + (index % 6) * 0.07
  const width = 140 + (index % 5) * 50
  const dir = index % 2 === 0 ? 1 : -1
  const height = 2 + (index % 3)
  return {
    '--wr-wind-top': `${top}%`,
    '--wr-wind-angle': `${angle}deg`,
    '--wr-wind-dur': `${dur}s`,
    '--wr-wind-delay': `${delay}s`,
    '--wr-wind-dir': dir,
    '--wr-wind-height': `${height}px`,
    width: `${width}px`
  }
}

function getStormSpiralStyle (index) {
  const angle = (index - 1) * 18 + (index % 3) * 5
  const distance = 110 + (index % 6) * 16
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance
  const size = 3 + (index % 4) * 2
  const delay = (index - 1) * 0.012
  return {
    '--wr-spiral-tx': `${tx}px`,
    '--wr-spiral-ty': `${ty}px`,
    '--wr-spiral-size': `${size}px`,
    '--wr-spiral-delay': `${delay}s`
  }
}

function getStormBoltStyle (index) {
  // 3波闪电的水平位置和延迟
  const configs = [
    { x: -90, delay: 0.40 }, // 第1波
    { x: 0, delay: 0.40 },
    { x: 90, delay: 0.40 },
    { x: -110, delay: 0.65 }, // 第2波
    { x: -30, delay: 0.65 },
    { x: 60, delay: 0.65 },
    { x: -50, delay: 0.90 }, // 第3波（粗壮）
    { x: 50, delay: 0.90 }
  ]
  const cfg = configs[index - 1] || configs[0]
  return {
    '--wr-bolt-x': `${cfg.x}px`,
    '--wr-bolt-delay': `${cfg.delay}s`
  }
}

function getStormStrikeStyle (index) {
  const configs = [
    { x: -90, delay: 0.45 },
    { x: 0, delay: 0.45 },
    { x: 90, delay: 0.45 },
    { x: -110, delay: 0.70 },
    { x: -30, delay: 0.70 },
    { x: 60, delay: 0.70 },
    { x: -50, delay: 0.95 },
    { x: 50, delay: 0.95 }
  ]
  const cfg = configs[index - 1] || configs[0]
  return {
    '--wr-strike-x': `${cfg.x}px`,
    '--wr-strike-delay': `${cfg.delay}s`
  }
}

function getStormDebrisStyle (index) {
  const angle = (index - 1) * 25.7 + (index % 2) * 9
  const distance = 40 + (index % 5) * 18
  const height = 30 + (index % 3) * 20
  const size = 4 + (index % 3) * 3
  const delay = 0.5 + (index % 4) * 0.04
  return {
    '--wr-debris-angle': `${angle}deg`,
    '--wr-debris-distance': `${distance}px`,
    '--wr-debris-height': `${height}px`,
    '--wr-debris-size': `${size}px`,
    '--wr-debris-delay': `${delay}s`
  }
}

function getStormBurstStyle (index) {
  const angle = (index - 1) * 22.5
  const distance = 55 + (index % 4) * 14
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance
  const delay = 1.15 + (index % 3) * 0.02
  return {
    '--wr-burst-rotate': `${angle}deg`,
    '--wr-burst-tx': `${tx}px`,
    '--wr-burst-ty': `${ty}px`,
    '--wr-burst-delay': `${delay}s`
  }
}

function getStormWindBladeStyle (index) {
  const angle = (index - 1) * 30 + (index % 2) * 6
  const distance = 65 + (index % 3) * 16
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance
  const delay = 1.2 + (index % 4) * 0.025
  return {
    '--wr-blade-rotate': `${angle}deg`,
    '--wr-blade-tx': `${tx}px`,
    '--wr-blade-ty': `${ty}px`,
    '--wr-blade-delay': `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   风雷狂袭 - 风雷交融·狂暴轰炸·爆裂扩散
   技能描述：风雷聚集，猛烈轰击周围的目标
   核心理念：风与雷始终交织——每个视觉元素都兼具风的运动与电的光芒
   GPU加速：所有动画仅使用 translate3d + scale + rotate + opacity
   ================================================================ */

/* ---- 阶段一：风雷聚涌（0s ~ 0.5s）—— 风与电交织汇聚 ---- */

/* 暗幕：深紫蓝覆盖，风雷将至 */
.wr-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(8, 5, 45, 0.6) 0%,
    rgba(4, 0, 30, 0.35) 50%,
    transparent 100%
  );
  animation: wrDim 2.2s ease-out forwards;
  will-change: opacity;
  pointer-events: none;
  z-index: 1;
}

@keyframes wrDim {
  0% { opacity: 0; }
  5% { opacity: 1; }
  35% { opacity: 0.85; }
  75% { opacity: 0.3; }
  100% { opacity: 0; }
}

/* 全屏横扫气流容器 - 包裹所有横向流动的蓝白风带 */
.wr-wind-bands {
  position: absolute;
  inset: 0;
  z-index: 12;
  overflow: hidden;
  pointer-events: none;
}

/* 全屏横扫气流条纹 - 横向流动的蓝白风带，营造狂风肆虐效果
   参考 ss-wind-band 设计：不同高度、角度、方向的横向流动条纹
   通过 --wr-wind-dir 控制方向，--wr-wind-angle 控制倾斜角度 */
.wr-wind-band {
  position: absolute;
  top: var(--wr-wind-top, 30%);
  left: 50%;
  height: var(--wr-wind-height, 3px);
  border-radius: 50%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(180, 220, 255, 0.5) 20%,
    rgba(210, 235, 255, 0.85) 50%,
    rgba(180, 220, 255, 0.5) 80%,
    transparent 100%
  );
  filter: blur(2px);
  opacity: 0;
  will-change: transform, opacity;
  animation: wrWindFlow var(--wr-wind-dur, 1.2s) ease-in-out var(--wr-wind-delay, 0s) forwards;
  pointer-events: none;
}

@keyframes wrWindFlow {
  0% {
    transform: translate3d(calc(var(--wr-wind-dir, 1) * -120%), 0, 0) rotate(var(--wr-wind-angle, 0deg)) scaleX(0.3);
    opacity: 0;
  }
  15% {
    opacity: 0.9;
    transform: translate3d(calc(var(--wr-wind-dir, 1) * -80%), 0, 0) rotate(var(--wr-wind-angle, 0deg)) scaleX(1);
  }
  85% {
    opacity: 0.6;
  }
  100% {
    transform: translate3d(calc(var(--wr-wind-dir, 1) * 120%), calc(var(--wr-wind-dir, 1) * -15px), 0) rotate(var(--wr-wind-angle, 0deg)) scaleX(0.4);
    opacity: 0;
  }
}

/* 风雷旋涡容器：风与电交织的旋转能量场 */
.wr-vortex {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  transform: translate3d(-50%, -50%, 0);
  animation: wrVortex 0.6s ease-in forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes wrVortex {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 1;
  }
}

/* 旋涡环：旋转的风+电环，边缘带电弧光辉 */
.wr-vortex-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: rgba(200, 230, 255, 0.8);
  border-right-color: rgba(150, 200, 255, 0.5);
  box-shadow:
    0 0 12px rgba(150, 200, 255, 0.5),
    inset 0 0 12px rgba(120, 180, 255, 0.3);
  will-change: transform, opacity;
}

.vr-1 {
  width: 60px;
  height: 60px;
  transform: translate3d(-50%, -50%, 0) scale(0.5);
  animation: wrVortexRing1 0.6s ease-out forwards;
}

.vr-2 {
  width: 100px;
  height: 100px;
  border-top-color: rgba(180, 210, 255, 0.6);
  border-right-color: rgba(130, 180, 255, 0.3);
  transform: translate3d(-50%, -50%, 0) scale(0.5);
  animation: wrVortexRing2 0.7s ease-out 0.05s forwards;
}

@keyframes wrVortexRing1 {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.3) rotate(0deg);
    opacity: 0;
  }
  30% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.5) rotate(540deg);
    opacity: 0;
  }
}

@keyframes wrVortexRing2 {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.3) rotate(0deg);
    opacity: 0;
  }
  30% { opacity: 0.8; }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.8) rotate(-360deg);
    opacity: 0;
  }
}

/* 旋涡核心：中心能量球，风雷聚能脉冲 */
.wr-vortex-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(180, 210, 255, 0.9) 25%,
    rgba(100, 160, 255, 0.6) 55%,
    transparent 100%
  );
  box-shadow:
    0 0 20px rgba(150, 200, 255, 0.9),
    0 0 40px rgba(100, 160, 255, 0.5),
    0 0 80px rgba(80, 130, 255, 0.3);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: wrVortexCore 0.5s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes wrVortexCore {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.2);
    opacity: 0;
  }
  40% {
    transform: translate3d(-50%, -50%, 0) scale(1.3);
    opacity: 1;
  }
  70% {
    transform: translate3d(-50%, -50%, 0) scale(0.9);
    opacity: 0.8;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.1);
    opacity: 0;
  }
}

/* 风雷螺旋粒子：风+电复合粒子从四周螺旋汇聚 */
.wr-spiral-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--wr-spiral-size, 4px);
  height: var(--wr-spiral-size, 4px);
  border-radius: 50%;
  background: rgba(180, 220, 255, 0.95);
  box-shadow:
    0 0 6px rgba(150, 200, 255, 0.9),
    0 0 12px rgba(100, 170, 255, 0.5);
  transform: translate3d(-50%, -50%, 0);
  animation: wrSpiralParticle 0.5s ease-in forwards;
  animation-delay: var(--wr-spiral-delay, 0s);
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes wrSpiralParticle {
  0% {
    transform: translate3d(
      calc(-50% + var(--wr-spiral-tx, 0px)),
      calc(-50% + var(--wr-spiral-ty, 0px)),
      0
    ) scale(0.8) rotate(0deg);
    opacity: 0;
  }
  20% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(0.2) rotate(360deg);
    opacity: 0;
  }
}

/* ---- 阶段二：狂雷暴击（0.4s ~ 1.3s）—— 三波密集轰炸 ---- */

/* 闪电容器：8道闪电分3波错峰劈落 */
.wr-bolt {
  position: absolute;
  top: 0;
  left: 50%;
  width: 6px;
  height: 55%;
  transform: translate3d(
    calc(-50% + var(--wr-bolt-x, 0px)),
    0,
    0
  );
  animation: wrBoltContainer 0.35s ease-out forwards;
  animation-delay: var(--wr-bolt-delay, 0.4s);
  will-change: opacity;
  z-index: 8;
}

/* 第3波粗壮闪电 */
.wr-bolt-thick {
  width: 9px;
}

/* 真实闪电闪烁：所有脉冲均保持高亮度，闪烁即显示，闪烁结束即消失
   模拟自然闪电——不是先持续亮着再渐弱消失，而是高频闪烁几次后彻底消失
   每次脉冲仅持续约10ms（3%×0.35s），之间完全黑暗，间隔不规则 */
@keyframes wrBoltContainer {
  0% { opacity: 0; }
  /* 第1次脉冲（首次劈落，最强） */
  3% { opacity: 1; }
  6% { opacity: 0; }
  /* 第2次脉冲（极短间隔后再次闪现） */
  9% { opacity: 0.95; }
  12% { opacity: 0; }
  /* 第3次脉冲 */
  16% { opacity: 1; }
  19% { opacity: 0; }
  /* 第4次脉冲 */
  23% { opacity: 0.9; }
  26% { opacity: 0; }
  /* 第5次脉冲（最后一次闪现，仍然明亮，随后彻底消失） */
  30% { opacity: 0.85; }
  33% { opacity: 0; }
  /* 闪烁结束，闪电完全消失，不再显示 */
  100% { opacity: 0; }
}

/* 闪电主体：之字形雷光，风雷交加的狂暴之字 */
.wr-bolt-body {
  position: absolute;
  top: 0;
  left: 50%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(230, 240, 255, 1) 0%,
    rgba(190, 210, 255, 0.95) 25%,
    rgba(150, 190, 255, 0.9) 50%,
    rgba(190, 210, 255, 0.95) 75%,
    rgba(230, 240, 255, 1) 100%
  );
  box-shadow:
    0 0 8px rgba(180, 210, 255, 1),
    0 0 18px rgba(120, 170, 255, 0.8),
    0 0 36px rgba(80, 130, 255, 0.5);
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 1));
  clip-path: polygon(
    30% 0%, 70% 3%, 20% 8%, 75% 14%, 25% 20%,
    72% 27%, 22% 34%, 78% 41%, 28% 48%, 72% 55%,
    25% 62%, 75% 69%, 30% 76%, 68% 83%, 35% 90%,
    65% 96%, 45% 100%
  );
  /* 微抖动：每次脉冲时水平偏移±2px，模拟闪电通道抖动 */
  animation: wrBoltJitter 0.35s ease-out forwards;
  animation-delay: var(--wr-bolt-delay, 0.4s);
  will-change: transform;
}

/* 闪电抖动：与脉冲同步的水平微偏移，模拟真实闪电通道每次闪现时的抖动 */
@keyframes wrBoltJitter {
  0% { transform: translateX(-50%); }
  3% { transform: translateX(calc(-50% + 1px)); }
  6% { transform: translateX(-50%); }
  9% { transform: translateX(calc(-50% - 2px)); }
  12% { transform: translateX(-50%); }
  16% { transform: translateX(calc(-50% + 1px)); }
  19% { transform: translateX(-50%); }
  23% { transform: translateX(calc(-50% - 1px)); }
  26% { transform: translateX(-50%); }
  30% { transform: translateX(calc(-50% + 2px)); }
  33% { transform: translateX(-50%); }
  100% { transform: translateX(-50%); }
}

/* 闪电光晕：闪电周围的电场光辉 */
.wr-bolt-glow {
  position: absolute;
  top: 0;
  left: 50%;
  width: 24px;
  height: 100%;
  transform: translateX(-50%);
  background: linear-gradient(
    to bottom,
    rgba(150, 190, 255, 0.35) 0%,
    rgba(100, 160, 255, 0.18) 50%,
    rgba(150, 190, 255, 0.35) 100%
  );
  filter: blur(5px);
}

/* 三波全屏爆闪：对应3波闪电劈落，所有脉冲保持高亮度，无渐弱 */
.wr-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(235, 245, 255, 0.75) 0%,
    rgba(180, 210, 255, 0.35) 30%,
    transparent 70%
  );
  animation: wrFlash 1s ease-out 0.4s forwards;
  opacity: 0;
  will-change: opacity;
  z-index: 7;
}

@keyframes wrFlash {
  0% { opacity: 0; }
  /* 第1波爆闪（与第1波闪电脉冲同步，每次仅闪约30ms） */
  3% { opacity: 1; }
  6% { opacity: 0; }
  10% { opacity: 0.95; }
  13% { opacity: 0; }
  18% { opacity: 1; }
  21% { opacity: 0; }
  /* 第2波爆闪（与第2波闪电脉冲同步） */
  30% { opacity: 0.95; }
  33% { opacity: 0; }
  38% { opacity: 1; }
  41% { opacity: 0; }
  /* 第3波爆闪（与第3波闪电脉冲同步，最猛烈） */
  53% { opacity: 1; }
  56% { opacity: 0; }
  60% { opacity: 0.9; }
  63% { opacity: 0; }
  /* 闪烁结束，完全消失 */
  100% { opacity: 0; }
}

/* 落雷冲击点：每个落雷点爆出电光球 */
.wr-strike-impact {
  position: absolute;
  top: 53%;
  left: 50%;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(200, 225, 255, 0.7) 25%,
    rgba(120, 170, 255, 0.4) 55%,
    transparent 100%
  );
  box-shadow:
    0 0 15px rgba(180, 210, 255, 0.9),
    0 0 30px rgba(120, 170, 255, 0.5);
  transform: translate3d(
    calc(-50% + var(--wr-strike-x, 0px)),
    -50%,
    0
  ) scale(0);
  animation: wrStrikeImpact 0.5s ease-out forwards;
  animation-delay: var(--wr-strike-delay, 0.45s);
  will-change: transform, opacity;
  z-index: 9;
}

@keyframes wrStrikeImpact {
  0% {
    transform: translate3d(
      calc(-50% + var(--wr-strike-x, 0px)),
      -50%,
      0
    ) scale(0);
    opacity: 0;
  }
  25% {
    transform: translate3d(
      calc(-50% + var(--wr-strike-x, 0px)),
      -50%,
      0
    ) scale(1.8);
    opacity: 1;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--wr-strike-x, 0px)),
      -50%,
      0
    ) scale(3.5);
    opacity: 0;
  }
}

/* 风雷碎片：被轰炸溅起的带电碎屑，兼具风的弧线轨迹与电的光芒 */
.wr-debris {
  position: absolute;
  top: 53%;
  left: 50%;
  width: var(--wr-debris-size, 5px);
  height: var(--wr-debris-size, 5px);
  border-radius: 50%;
  background: rgba(190, 220, 255, 0.9);
  box-shadow:
    0 0 5px rgba(150, 200, 255, 0.8),
    0 0 10px rgba(100, 170, 255, 0.4);
  transform: translate3d(-50%, -50%, 0) rotate(var(--wr-debris-angle, 0deg)) scale(0);
  animation: wrDebris 0.7s ease-out forwards;
  animation-delay: var(--wr-debris-delay, 0.5s);
  will-change: transform, opacity;
  z-index: 6;
}

@keyframes wrDebris {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--wr-debris-angle, 0deg)) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--wr-debris-angle, 0deg)) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--wr-debris-distance, 0px)),
      calc(-50% - var(--wr-debris-height, 0px)),
      0
    ) rotate(var(--wr-debris-angle, 0deg)) scale(0.3);
    opacity: 0;
  }
}

/* 风刃：月牙形实体风刃从中心360°射出，风的锋利攻击形态 */
.wr-wind-blade {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 36px;
  height: 8px;
  border-radius: 50% 50% 50% 50% / 100% 100% 0 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(200, 230, 255, 0.3) 15%,
    rgba(220, 240, 255, 0.7) 40%,
    rgba(240, 250, 255, 0.9) 60%,
    rgba(220, 240, 255, 0.7) 80%,
    rgba(200, 230, 255, 0.3) 95%,
    transparent 100%
  );
  box-shadow:
    0 0 8px rgba(160, 210, 255, 0.4),
    0 0 16px rgba(120, 180, 255, 0.2);
  filter: blur(0.5px);
  transform: translate3d(-50%, -50%, 0) rotate(var(--wr-blade-rotate, 0deg)) scale(0);
  animation: wrWindBlade 0.7s ease-out forwards;
  animation-delay: var(--wr-blade-delay, 1.2s);
  will-change: transform, opacity;
  z-index: 6;
}

@keyframes wrWindBlade {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--wr-blade-rotate, 0deg)) scale(0.2);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--wr-blade-rotate, 0deg)) scale(1);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--wr-blade-tx, 0px)),
      calc(-50% + var(--wr-blade-ty, 0px)),
      0
    ) rotate(var(--wr-blade-rotate, 0deg)) scale(0.4);
    opacity: 0;
  }
}

/* ---- 阶段三：风雷爆裂（1.1s ~ 1.8s）—— 360°风雷爆炸 ---- */

/* 爆裂冲击环：3层从中心向外扩散，环边缘带电弧光辉 */
.wr-blast-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2px solid rgba(180, 215, 255, 0.8);
  box-shadow:
    0 0 12px rgba(150, 200, 255, 0.5),
    inset 0 0 12px rgba(120, 180, 255, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  z-index: 6;
}

.br-1 {
  width: 40px;
  height: 40px;
  border-color: rgba(210, 230, 255, 0.9);
  animation: wrBlastRing 0.8s ease-out 1.1s forwards;
}

.br-2 {
  width: 40px;
  height: 40px;
  border-color: rgba(180, 210, 255, 0.7);
  animation: wrBlastRing 0.9s ease-out 1.25s forwards;
}

.br-3 {
  width: 40px;
  height: 40px;
  border-color: rgba(150, 190, 255, 0.5);
  animation: wrBlastRing 1s ease-out 1.4s forwards;
}

@keyframes wrBlastRing {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.2);
    opacity: 0;
  }
  12% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(9);
    opacity: 0;
  }
}

/* 风雷射线：风+电组合的旋转弹射，边飞边自转 */
.wr-burst-bolt {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 28px;
  border-radius: 3px;
  background: linear-gradient(
    to bottom,
    rgba(230, 240, 255, 1) 0%,
    rgba(190, 215, 255, 0.8) 40%,
    rgba(150, 190, 255, 0.4) 80%,
    transparent 100%
  );
  box-shadow:
    0 0 6px rgba(180, 210, 255, 0.9),
    0 0 14px rgba(120, 170, 255, 0.5);
  transform: translate3d(-50%, -50%, 0) rotate(var(--wr-burst-rotate, 0deg)) scale(0);
  animation: wrBurstBolt 0.7s ease-out forwards;
  animation-delay: var(--wr-burst-delay, 1.15s);
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes wrBurstBolt {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--wr-burst-rotate, 0deg)) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--wr-burst-rotate, 0deg)) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate3d(
      calc(-50% + var(--wr-burst-tx, 0px)),
      calc(-50% + var(--wr-burst-ty, 0px)),
      0
    ) rotate(calc(var(--wr-burst-rotate, 0deg) + 180deg)) scale(0.3);
    opacity: 0;
  }
}

/* 中心爆裂闪光：风雷能量爆发的瞬间白光 */
.wr-blast-flash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(200, 225, 255, 0.5) 25%,
    rgba(120, 170, 255, 0.2) 55%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: wrBlastFlash 0.5s ease-out 1.1s forwards;
  will-change: transform, opacity;
  z-index: 8;
}

@keyframes wrBlastFlash {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(-50%, -50%, 0) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2.5);
    opacity: 0;
  }
}

/* 残余气旋：消散阶段缓慢旋转的残余气流环 */
.wr-swirl {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: wrSwirl 1s ease-out 1.6s forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes wrSwirl {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.3);
    opacity: 0;
  }
  20% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.6;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2);
    opacity: 0;
  }
}

/* 气旋环：2层半透明气流环缓慢旋转消散 */
.wr-swirl-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: rgba(200, 230, 255, 0.4);
  border-right-color: rgba(180, 210, 255, 0.2);
  will-change: transform, opacity;
}

.sr-1 {
  width: 100px;
  height: 100px;
  transform: translate3d(-50%, -50%, 0) rotate(0deg);
  animation: wrSwirlRing1 1s ease-out 1.6s forwards;
}

.sr-2 {
  width: 140px;
  height: 140px;
  border-top-color: rgba(180, 210, 255, 0.3);
  border-right-color: rgba(160, 190, 255, 0.15);
  transform: translate3d(-50%, -50%, 0) rotate(0deg);
  animation: wrSwirlRing2 1.1s ease-out 1.65s forwards;
}

@keyframes wrSwirlRing1 {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.5) rotate(0deg);
    opacity: 0;
  }
  30% { opacity: 0.5; }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.5) rotate(540deg);
    opacity: 0;
  }
}

@keyframes wrSwirlRing2 {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.5) rotate(0deg);
    opacity: 0;
  }
  30% { opacity: 0.3; }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.8) rotate(-360deg);
    opacity: 0;
  }
}

/* ---- 阶段四：风雷消散（1.7s ~ 2.2s） ---- */

/* 地面焦痕：雷击地面的电弧焦痕扩散 */
.wr-scorch {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(180, 210, 255, 0.5) 0%,
    rgba(120, 170, 255, 0.25) 30%,
    rgba(80, 130, 200, 0.1) 60%,
    transparent 100%
  );
  box-shadow:
    0 0 20px rgba(150, 190, 255, 0.4),
    0 0 40px rgba(100, 160, 255, 0.2);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: wrScorch 0.8s ease-out 1.7s forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes wrScorch {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(2.5);
    opacity: 0;
  }
}

/* 风雷余韵：残留的电风雾气逐渐消散 */
.wr-residue {
  position: absolute;
  top: 45%;
  left: 50%;
  width: 50%;
  height: 70%;
  background: radial-gradient(
    ellipse at center,
    rgba(180, 210, 255, 0.22) 0%,
    rgba(120, 170, 255, 0.1) 40%,
    transparent 80%
  );
  transform: translate3d(-50%, -50%, 0) scale(0.5);
  animation: wrResidue 0.7s ease-out 1.8s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes wrResidue {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.5);
    opacity: 0;
  }
  25% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.8);
    opacity: 0;
  }
}

</style>
