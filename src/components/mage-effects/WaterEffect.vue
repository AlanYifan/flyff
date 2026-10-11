<!--
  @file WaterEffect.vue
  @generated 2026-06-29
  @description 雪山崩塌 - 寒流凝聚·雪山坠落·冲击波纹·雪花飞溅
  从 MageSkillEffect.vue 拆分而来，仅负责本特效的模板、脚本和样式
  GPU加速：所有动画仅使用 translate3d + opacity，避免重排，保证丝滑流畅
-->
<template>
          <!-- 3D舞台 - 透视容器，为冰峰坠落与碎片飞射提供深度视角 -->
          <div class="av-3d-stage">
            <!-- ========== 阶段一：寒流凝聚（0s ~ 0.5s）—— 水土之力汇聚成寒 ========== -->
            <!-- 寒流暗幕：冰蓝覆盖，暴雪将至 -->
            <div class="av-dim"></div>
            <!-- 寒霜法阵：地面旋转的冰霜召唤阵 -->
            <div class="av-frost-rune"></div>
            <!-- 寒能汇聚：四周冰晶被抽向中心 -->
            <div
              v-for="i in 16"
              :key="'av-gather-' + i"
              class="av-gather-particle"
              :style="getAvalancheGatherStyle(i)"
            ></div>

            <!-- ========== 阶段二：雪山崩塌（0.4s ~ 1.4s）—— 雪山成形·颤抖·裂缝·砸落 ========== -->
            <!-- 巨型雪山主体：多峰雪山造型，成形后颤抖崩裂砸向地面 -->
            <div class="av-mountain">
              <div class="av-mountain-body"></div>
              <div class="av-mountain-snow"></div>
              <div class="av-mountain-shade"></div>
              <!-- 雪山裂纹：崩塌前从峰顶向下蔓延的裂缝 -->
              <div class="av-crack av-crack-1"></div>
              <div class="av-crack av-crack-2"></div>
              <div class="av-crack av-crack-3"></div>
            </div>
            <!-- 崩塌碎片：雪山坠落时从山体脱落的冰岩碎块 -->
            <div
              v-for="i in 10"
              :key="'av-debris-' + i"
              class="av-debris"
              :style="getAvalancheDebrisStyle(i)"
            ></div>
            <!-- 雪崩雪流：伴随雪山坠落的白色雪流尾迹 -->
            <div class="av-avalanche-flow"></div>
            <!-- 巨型冰岩群：8块冰岩从天而降，散布全场，带深度分层 -->
            <div
              v-for="i in 8"
              :key="'av-boulder-' + i"
              class="av-boulder"
              :style="getAvalancheBoulderStyle(i)"
            ></div>

            <!-- ========== 阶段三：雪崩冲击（1.35s ~ 2.3s）—— 砸向地面·涟漪波澜·爆裂扩散 ========== -->
            <!-- 撞击闪光：雪山砸地瞬间的冰蓝白光爆闪 -->
            <div class="av-impact-flash"></div>
            <!-- 地面撞击坑：雪山砸落形成的凹陷坑 -->
            <div class="av-crater"></div>
            <!-- 冲击波涟漪：6圈波浪式向外扩散的寒冰涟漪 -->
            <div class="av-ripple av-rp-1"></div>
            <div class="av-ripple av-rp-2"></div>
            <div class="av-ripple av-rp-3"></div>
            <div class="av-ripple av-rp-4"></div>
            <div class="av-ripple av-rp-5"></div>
            <div class="av-ripple av-rp-6"></div>
            <!-- 地面寒霜裂纹：撞击点扩散的冰霜裂纹 -->
            <div class="av-ground-frost"></div>
            <!-- 雪冰爆裂：20块雪冰碎片向外3D飞射 -->
            <div
              v-for="i in 20"
              :key="'av-burst-' + i"
              class="av-burst-shard"
              :style="getAvalancheBurstStyle(i)"
            ></div>

            <!-- ========== 阶段四：雪花消散（2.0s ~ 2.8s）========== -->
            <!-- 残雪飘落：余韵飞舞的雪花 -->
            <div
              v-for="i in 14"
              :key="'av-residue-' + i"
              class="av-residue-flake"
              :style="getAvalancheResidueStyle(i)"
            ></div>
            <!-- 寒霜余辉：最后的冷光消散 -->
            <div class="av-afterglow"></div>
          </div>
</template>

<script setup>
/**
 * 雪山崩塌 - 寒流凝聚·雪山坠落·冲击波纹·雪花飞溅
 * 从 MageSkillEffect.vue 拆分的独立特效组件
 */

function getAvalancheGatherStyle (index) {
  const angle = (index - 1) * 22.5 + (index % 2) * 6
  const distance = 140 + (index % 5) * 18
  const size = 4 + (index % 4) * 3
  const delay = (index - 1) * 0.012
  return {
    '--av-gather-angle': `${angle}deg`,
    '--av-gather-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

function getAvalancheBoulderStyle (index) {
  // 8块冰岩散布在水平方向上，呈宽幅分布覆盖全场
  const positions = [
    { x: -240, size: 90, depth: -60 },
    { x: -160, size: 70, depth: 40 },
    { x: -80, size: 110, depth: 0 },
    { x: 0, size: 130, depth: -30 },
    { x: 80, size: 100, depth: 50 },
    { x: 160, size: 75, depth: -50 },
    { x: 240, size: 95, depth: 30 },
    { x: -200, size: 65, depth: 60 }
  ]
  const pos = positions[index - 1] || positions[0]
  const delay = 0.45 + (index % 4) * 0.08
  return {
    '--av-boulder-x': `${pos.x}px`,
    '--av-boulder-size': `${pos.size}px`,
    '--av-boulder-depth': `${pos.depth}px`,
    animationDelay: `${delay}s`
  }
}

function getAvalancheDebrisStyle (index) {
  // 前半从左侧脱落，后半从右侧脱落
  const isLeft = index <= 5
  const side = isLeft ? -1 : 1
  const startX = side * (40 + (index % 3) * 25)
  const flyX = side * (60 + (index % 4) * 30)
  const flyY = 200 + (index % 3) * 60
  const size = 12 + (index % 4) * 8
  const rotate = side * (180 + (index % 3) * 90)
  const delay = 0.85 + (index % 5) * 0.04
  return {
    '--av-debris-x': `${startX}px`,
    '--av-debris-tx': `${flyX}px`,
    '--av-debris-ty': `${flyY}px`,
    '--av-debris-size': `${size}px`,
    '--av-debris-rotate': `${rotate}deg`,
    animationDelay: `${delay}s`
  }
}

function getAvalancheBurstStyle (index) {
  const angle = (index - 1) * 18 + (index % 2) * 7
  const distance = 55 + (index % 5) * 24
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 14
  const size = 6 + (index % 4) * 4
  const rotate = index * 47
  const delay = (index % 3) * 0.025
  const z = (index % 3 - 1) * 45
  return {
    '--av-burst-tx': `${tx}px`,
    '--av-burst-ty': `${ty}px`,
    '--av-burst-tz': `${z}px`,
    '--av-burst-size': `${size}px`,
    '--av-burst-rotate': `${rotate}deg`,
    animationDelay: `${delay}s`
  }
}

function getAvalancheResidueStyle (index) {
  const x = -260 + (index - 1) * 40
  const drift = ((index % 2 === 0 ? 1 : -1)) * (20 + (index % 4) * 12)
  const size = 4 + (index % 3) * 3
  const delay = 2 + (index % 7) * 0.06
  const dur = 0.8 + (index % 4) * 0.12
  return {
    '--av-residue-x': `${x}px`,
    '--av-residue-drift': `${drift}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${dur}s`
  }
}
</script>

<style scoped>
/* ================================================================
   雪山崩塌 (element_mage_y) - 寒流凝聚·雪山坠落·冲击波纹·雪花飞溅
   技能描述：借助自然界水土之力引发的雪崩，借力一击，一定几率使被击中目标陷入眩晕
   四阶段叙事：寒流凝聚 → 雪山崩塌(成形·颤抖·裂缝·砸落) → 涟漪冲击 → 雪花消散
   核心：多峰雪山造型 + 崩塌碎片脱落 + 雪流尾迹 + 6圈涟漪波澜 + 撞击坑
   性能：动画仅使用 transform + opacity，GPU合成层加速，零重绘
   3D原理：perspective() + rotateX() 倾斜平面产生纵深，translate3d 深度分层
   动画总时长：2.8s
   ================================================================ */

/* 3D舞台 - 透视容器，为冰峰坠落与碎片飞射提供深度视角 */
.av-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1400px;
  perspective-origin: 50% 40%;
  transform-style: preserve-3d;
  contain: layout style;
  pointer-events: none;
}

/* ---- 阶段一：寒流凝聚（0s ~ 0.5s）—— 水土之力汇聚成寒 ---- */

/* 寒流暗幕 - 冰蓝覆盖，暴雪将至，全程2.8s持续覆盖 */
.av-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 35%,
    rgba(10, 40, 80, 0.55) 0%,
    rgba(5, 20, 55, 0.4) 50%,
    transparent 100%
  );
  animation: avDim 2.8s ease-out forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes avDim {
  0% { opacity: 0; }
  8% { opacity: 1; }
  40% { opacity: 0.9; }
  75% { opacity: 0.4; }
  100% { opacity: 0; }
}

/* 寒霜法阵 - 地面旋转的冰霜召唤阵，预示雪崩降临
   父级负责入场缩放与淡出，::before 负责持续自转，避免 transform 冲突 */
.av-frost-rune {
  position: absolute;
  top: 60%;
  left: 50%;
  width: 320px;
  height: 320px;
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: avFrostRuneIn 0.5s cubic-bezier(0.2, 0.8, 0.3, 1) forwards,
             avFrostRuneFade 0.9s ease-out 1.1s forwards;
  will-change: transform, opacity;
  z-index: 2;
}

.av-frost-rune::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(120, 220, 255, 0.25) 30deg,
    rgba(180, 240, 255, 0.45) 60deg,
    rgba(120, 220, 255, 0.25) 90deg,
    transparent 120deg,
    rgba(120, 220, 255, 0.25) 180deg,
    rgba(180, 240, 255, 0.45) 210deg,
    rgba(120, 220, 255, 0.25) 240deg,
    transparent 270deg,
    rgba(120, 220, 255, 0.25) 330deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 25%, black 45%, transparent 80%);
  mask: radial-gradient(circle, transparent 25%, black 45%, transparent 80%);
  box-shadow: 0 0 40px rgba(100, 200, 255, 0.25);
  will-change: transform;
  animation: avSpinCW 1.4s linear infinite;
}

@keyframes avSpinCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes avFrostRuneIn {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1.15); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(1); opacity: 0.85; }
}

@keyframes avFrostRuneFade {
  0% { opacity: 0.85; }
  100% { opacity: 0; }
}

/* 寒能汇聚冰晶 - 从四周螺旋汇聚至中心 */
.av-gather-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(230, 250, 255, 0.95) 0%,
    rgba(120, 210, 255, 0.7) 50%,
    rgba(40, 130, 220, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(120, 210, 255, 0.6);
  opacity: 0;
  animation: avGather 0.55s cubic-bezier(0.5, 0, 0.7, 1) forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes avGather {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--av-gather-angle, 0deg)) translateX(var(--av-gather-distance, 140px)) scale(1);
    opacity: 0;
  }
  25% { opacity: 1; }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--av-gather-angle, 0deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ---- 阶段二：雪山崩塌（0.4s ~ 1.4s）—— 雪山成形·颤抖·裂缝·砸落 ---- */

/* 巨型雪山主体 - 多峰雪山造型，成形后颤抖崩裂砸向地面
   单动画串联三阶段：成形（scaleY生长）→ 颤抖（微旋转抖动）→ 砸落（translate3d下坠+旋转+歪斜变形）
   transform-origin 设为底部中心，scaleY 从0生长实现"从上方拔起成形" */
.av-mountain {
  position: absolute;
  top: 0;
  left: 50%;
  width: 420px;
  height: 360px;
  transform: translate3d(-50%, -100%, 0) scaleY(0);
  transform-origin: 50% 100%;
  opacity: 0;
  animation: avMountainCrash 1s forwards 0.4s;
  will-change: transform, opacity;
  z-index: 6;
}

/* 单动画串联：成形(0~35%) → 颤抖(35~55%) → 砸落(55~100%) */
@keyframes avMountainCrash {
  0% {
    transform: translate3d(-50%, -100%, 0) scaleY(0) rotate(0deg);
    opacity: 0;
  }
  10% { opacity: 1; }
  /* 成形完成 */
  35% {
    transform: translate3d(-50%, -100%, 0) scaleY(1) rotate(0deg);
    opacity: 1;
  }
  /* 颤抖：山体不稳，微旋转抖动 */
  42% { transform: translate3d(-50%, -100%, 0) scaleY(1) rotate(-1.5deg); }
  48% { transform: translate3d(-50%, -100%, 0) scaleY(1) rotate(1.5deg); }
  54% { transform: translate3d(-50%, -100%, 0) scaleY(1) rotate(-1deg); }
  /* 开始砸落：下坠+旋转+歪斜变形，模拟山体崩塌倾倒 */
  58% {
    transform: translate3d(-50%, -85%, 0) scaleY(1) rotate(3deg) skewX(-3deg);
  }
  100% {
    transform: translate3d(-50%, 55%, 0) scaleY(0.6) rotate(18deg) skewX(-10deg);
    opacity: 0;
  }
}

/* 雪山本体 - 多峰山体剪影，从雪白峰顶到深蓝山脚的渐变
   clip-path 构建多峰连绵山脉轮廓，主峰居中最高，两侧次峰错落 */
.av-mountain-body {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(240, 252, 255, 0.92) 0%,
    rgba(180, 220, 248, 0.82) 12%,
    rgba(110, 175, 225, 0.72) 28%,
    rgba(55, 120, 195, 0.62) 50%,
    rgba(20, 65, 140, 0.5) 80%,
    rgba(10, 35, 85, 0.4) 100%
  );
  clip-path: polygon(
    0% 100%, 4% 82%, 10% 90%, 16% 65%, 22% 75%,
    28% 42%, 34% 55%, 40% 20%, 46% 32%, 50% 0%,
    54% 28%, 60% 15%, 66% 38%, 72% 25%, 78% 50%,
    84% 40%, 90% 62%, 94% 72%, 100% 100%
  );
  box-shadow: 0 0 40px rgba(120, 200, 255, 0.4);
}

/* 雪山雪冠 - 峰顶白雪覆盖层，与山体同形clip-path，渐变仅在上部显白 */
.av-mountain-snow {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(250, 253, 255, 0.55) 8%,
    rgba(230, 245, 255, 0.3) 18%,
    transparent 28%
  );
  clip-path: polygon(
    0% 100%, 4% 82%, 10% 90%, 16% 65%, 22% 75%,
    28% 42%, 34% 55%, 40% 20%, 46% 32%, 50% 0%,
    54% 28%, 60% 15%, 66% 38%, 72% 25%, 78% 50%,
    84% 40%, 90% 62%, 94% 72%, 100% 100%
  );
}

/* 雪山明暗 - 斜向光影渐变叠加，左亮右暗营造3D立体感 */
.av-mountain-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    transparent 30%,
    rgba(5, 20, 50, 0.25) 70%,
    rgba(0, 10, 30, 0.15) 100%
  );
  clip-path: polygon(
    0% 100%, 4% 82%, 10% 90%, 16% 65%, 22% 75%,
    28% 42%, 34% 55%, 40% 20%, 46% 32%, 50% 0%,
    54% 28%, 60% 15%, 66% 38%, 72% 25%, 78% 50%,
    84% 40%, 90% 62%, 94% 72%, 100% 100%
  );
}

/* 雪山裂纹 - 崩塌前从峰顶向下蔓延的裂缝，transform-origin顶部、scaleY从0生长
   3条裂纹分布在山体不同位置，不同角度和长度 */
.av-crack {
  position: absolute;
  top: 5%;
  width: 2px;
  background: linear-gradient(
    180deg,
    rgba(5, 15, 35, 0.9) 0%,
    rgba(10, 30, 60, 0.6) 50%,
    rgba(15, 40, 80, 0.2) 100%
  );
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.4);
  transform-origin: top center;
  transform: scaleY(0);
  opacity: 0;
  animation: avCrackGrow 0.25s ease-out 0.9s forwards;
  will-change: transform, opacity;
  z-index: 7;
}

.av-crack-1 {
  left: 42%;
  height: 200px;
  transform: scaleY(0) rotate(-8deg);
}

.av-crack-2 {
  left: 52%;
  height: 240px;
  transform: scaleY(0) rotate(5deg);
  animation-delay: 0.94s;
}

.av-crack-3 {
  left: 60%;
  height: 160px;
  transform: scaleY(0) rotate(-3deg);
  animation-delay: 0.98s;
}

@keyframes avCrackGrow {
  0% { opacity: 0; }
  20% { opacity: 1; }
  100% { opacity: 0.7; }
}

.av-crack-1 { animation-name: avCrackGrow1; }
.av-crack-2 { animation-name: avCrackGrow2; }
.av-crack-3 { animation-name: avCrackGrow3; }

@keyframes avCrackGrow1 {
  0% { transform: scaleY(0) rotate(-8deg); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: scaleY(1) rotate(-8deg); opacity: 0.7; }
}

@keyframes avCrackGrow2 {
  0% { transform: scaleY(0) rotate(5deg); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: scaleY(1) rotate(5deg); opacity: 0.7; }
}

@keyframes avCrackGrow3 {
  0% { transform: scaleY(0) rotate(-3deg); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: scaleY(1) rotate(-3deg); opacity: 0.7; }
}

/* 崩塌碎片 - 雪山坠落时从山体两侧脱落的冰岩碎块
   从山体起点位置向外侧抛物线飞落，配合旋转模拟碎裂脱落 */
.av-debris {
  position: absolute;
  top: 15%;
  left: 50%;
  width: var(--av-debris-size, 16px);
  height: var(--av-debris-size, 16px);
  border-radius: 35% 55% 40% 60% / 50% 35% 60% 45%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(240, 252, 255, 0.9) 0%,
    rgba(150, 210, 245, 0.75) 50%,
    rgba(40, 110, 185, 0.35) 100%
  );
  box-shadow: 0 0 8px rgba(120, 200, 255, 0.5);
  transform: translate3d(calc(-50% + var(--av-debris-x, 0px)), 0, 0) scale(0);
  opacity: 0;
  backface-visibility: hidden;
  animation: avDebrisBreak 0.6s ease-in forwards;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes avDebrisBreak {
  0% {
    transform: translate3d(calc(-50% + var(--av-debris-x, 0px)), 0, 0) scale(0) rotate(0deg);
    opacity: 0;
  }
  15% {
    transform: translate3d(calc(-50% + var(--av-debris-x, 0px)), 0, 0) scale(1) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate3d(calc(-50% + var(--av-debris-x, 0px) + var(--av-debris-tx, 0px)), var(--av-debris-ty, 200px), 0) scale(0.5) rotate(var(--av-debris-rotate, 180deg));
    opacity: 0;
  }
}

/* 雪崩雪流 - 伴随雪山坠落的白色雪流尾迹
   从山体位置向下倾泻，模拟崩塌时大量积雪 cascading 尾随 */
.av-avalanche-flow {
  position: absolute;
  top: 0;
  left: 50%;
  width: 360px;
  height: 300px;
  transform: translate3d(-50%, -100%, 0) scaleY(0);
  transform-origin: 50% 0;
  opacity: 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.7) 0%,
    rgba(235, 250, 255, 0.5) 30%,
    rgba(200, 235, 255, 0.25) 60%,
    transparent 100%
  );
  filter: blur(4px);
  clip-path: polygon(
    20% 0%, 80% 0%, 90% 40%, 85% 70%, 70% 90%,
    50% 100%, 30% 90%, 15% 70%, 10% 40%
  );
  animation: avAvalancheFlow 0.6s ease-in 0.95s forwards;
  will-change: transform, opacity;
  z-index: 5;
}

@keyframes avAvalancheFlow {
  0% { transform: translate3d(-50%, -100%, 0) scaleY(0); opacity: 0; }
  20% { opacity: 0.85; }
  60% { transform: translate3d(-50%, -20%, 0) scaleY(1.2); opacity: 0.8; }
  100% { transform: translate3d(-50%, 40%, 0) scaleY(1.5); opacity: 0; }
}

/* 巨型冰岩 - 从天而降的冰岩群，带Z轴深度分层
   translate3d 沿 X 落点 + Y 下落 + Z 深度，scale 随深度近大远小 */
.av-boulder {
  position: absolute;
  top: -10%;
  left: 50%;
  width: var(--av-boulder-size, 90px);
  height: var(--av-boulder-size, 90px);
  border-radius: 28% 42% 35% 48% / 40% 30% 50% 38%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(235, 250, 255, 0.9) 0%,
    rgba(140, 210, 250, 0.75) 45%,
    rgba(40, 120, 200, 0.4) 100%
  );
  box-shadow:
    0 0 18px rgba(120, 210, 255, 0.5),
    inset -6px -8px 14px rgba(30, 90, 160, 0.4);
  transform: translate3d(calc(-50% + var(--av-boulder-x, 0px)), 0, var(--av-boulder-depth, 0px)) scale(0.3) rotate(0deg);
  opacity: 0;
  backface-visibility: hidden;
  animation: avBoulderFall 0.6s cubic-bezier(0.35, 0, 0.85, 0.4) 0.5s forwards;
  will-change: transform, opacity;
  z-index: 7;
}

@keyframes avBoulderFall {
  0% {
    transform: translate3d(calc(-50% + var(--av-boulder-x, 0px)), 0, var(--av-boulder-depth, 0px)) scale(0.4) rotate(0deg);
    opacity: 0;
  }
  15% { opacity: 1; }
  100% {
    transform: translate3d(calc(-50% + var(--av-boulder-x, 0px)), 380px, var(--av-boulder-depth, 0px)) scale(1) rotate(220deg);
    opacity: 0;
  }
}

/* ---- 阶段三：雪崩冲击（1.35s ~ 2.3s）—— 砸向地面·涟漪波澜·爆裂扩散 ---- */

/* 撞击闪光 - 雪山砸地瞬间的冰蓝白光爆闪 */
.av-impact-flash {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(220, 245, 255, 0.85) 30%,
    rgba(120, 210, 255, 0.4) 65%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: avImpactFlash 0.5s ease-out 1.35s forwards;
  will-change: transform, opacity;
  z-index: 9;
}

@keyframes avImpactFlash {
  0% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  15% { transform: translate3d(-50%, -50%, 0) scale(10); opacity: 1; }
  100% { transform: translate3d(-50%, -50%, 0) scale(18); opacity: 0; }
}

/* 地面撞击坑 - 雪山砸落形成的凹陷坑，rotateX贴地
   先快速胀大成形，再缓慢淡出 */
.av-crater {
  position: absolute;
  top: 60%;
  left: 50%;
  width: 240px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(
    ellipse,
    rgba(10, 30, 70, 0.65) 0%,
    rgba(25, 60, 120, 0.4) 40%,
    rgba(50, 100, 170, 0.2) 70%,
    transparent 90%
  );
  box-shadow: 0 0 30px rgba(80, 160, 230, 0.3);
  transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0);
  opacity: 0;
  animation: avCraterForm 0.3s ease-out 1.35s forwards,
             avCraterFade 0.8s ease-out 1.8s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes avCraterForm {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0); opacity: 0; }
  60% { transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(1.15); opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(1); opacity: 0.8; }
}

@keyframes avCraterFade {
  0% { opacity: 0.8; }
  100% { opacity: 0; }
}

/* 冲击波涟漪 - 6圈波浪式向外扩散的寒冰涟漪，rotateX贴地
   使用 radial-gradient 填充（非border），营造水波涟漪般的扩散感
   每圈延迟错开0.12s，形成连续波澜效果 */
.av-ripple {
  position: absolute;
  top: 60%;
  left: 50%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 30%,
    rgba(200, 240, 255, 0.5) 45%,
    rgba(150, 220, 255, 0.35) 65%,
    rgba(100, 190, 245, 0.15) 85%,
    transparent 100%
  );
  box-shadow: 0 0 20px rgba(120, 210, 255, 0.3);
  transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  z-index: 8;
}

.av-rp-1 { animation: avRippleWave 1.1s ease-out 1.35s forwards; }
.av-rp-2 { animation: avRippleWave 1.1s ease-out 1.47s forwards; }
.av-rp-3 { animation: avRippleWave 1.1s ease-out 1.59s forwards; }
.av-rp-4 { animation: avRippleWave 1.1s ease-out 1.71s forwards; }
.av-rp-5 { animation: avRippleWave 1.1s ease-out 1.83s forwards; }
.av-rp-6 { animation: avRippleWave 1.1s ease-out 1.95s forwards; }

@keyframes avRippleWave {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(0); opacity: 0; }
  8% { opacity: 0.9; }
  50% { opacity: 0.5; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(75deg) scale(9); opacity: 0; }
}

/* 地面寒霜裂纹 - 撞击点扩散的冰霜裂纹，rotateX贴地 */
.av-ground-frost {
  position: absolute;
  top: 60%;
  left: 50%;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(180, 235, 255, 0.5) 0deg,
    transparent 40deg,
    rgba(220, 245, 255, 0.6) 90deg,
    transparent 130deg,
    rgba(180, 235, 255, 0.5) 180deg,
    transparent 220deg,
    rgba(220, 245, 255, 0.6) 270deg,
    transparent 310deg,
    rgba(180, 235, 255, 0.5) 360deg
  );
  -webkit-mask: radial-gradient(circle, black 10%, transparent 70%);
  mask: radial-gradient(circle, black 10%, transparent 70%);
  box-shadow: 0 0 50px rgba(120, 210, 255, 0.3);
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  opacity: 0;
  animation: avGroundFrost 0.9s cubic-bezier(0.2, 0.8, 0.3, 1) 1.4s forwards;
  will-change: transform, opacity;
  z-index: 4;
}

@keyframes avGroundFrost {
  0% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0); opacity: 0; }
  30% { opacity: 0.9; }
  100% { transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(2.2); opacity: 0; }
}

/* 雪冰爆裂碎片 - 从撞击点向外3D飞射
   translate3d 沿 3D 坐标飞射，配合 rotate 自转 */
.av-burst-shard {
  position: absolute;
  top: 55%;
  left: 50%;
  width: var(--av-burst-size, 8px);
  height: var(--av-burst-size, 8px);
  border-radius: 40% 60% 50% 40% / 55% 40% 60% 45%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(240, 252, 255, 0.95) 0%,
    rgba(150, 215, 255, 0.75) 50%,
    rgba(40, 120, 200, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(120, 210, 255, 0.6);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  backface-visibility: hidden;
  animation: avBurstScatter 0.8s cubic-bezier(0.2, 0.5, 0.4, 1) 1.35s forwards;
  will-change: transform, opacity;
  z-index: 10;
}

@keyframes avBurstScatter {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% { opacity: 1; }
  100% {
    transform: translate3d(calc(-50% + var(--av-burst-tx, 0px)), calc(-50% + var(--av-burst-ty, 0px)), var(--av-burst-tz, 0px)) scale(0.4) rotate(var(--av-burst-rotate, 0deg));
    opacity: 0;
  }
}

/* ---- 阶段四：雪花消散（2.0s ~ 2.8s）---- */

/* 残雪飘落 - 余韵飞舞的雪花，缓缓飘落消散 */
.av-residue-flake {
  position: absolute;
  top: -5%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 35%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(210, 240, 255, 0.5) 60%,
    transparent 100%
  );
  box-shadow: 0 0 4px rgba(200, 240, 255, 0.4);
  opacity: 0;
  animation: avResidueFall 1s ease-in forwards;
  will-change: transform, opacity;
  z-index: 3;
}

@keyframes avResidueFall {
  0% {
    transform: translate3d(calc(-50% + var(--av-residue-x, 0px)), 0, 0) scale(0.5);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  80% { opacity: 0.6; }
  100% {
    transform: translate3d(calc(-50% + var(--av-residue-x, 0px) + var(--av-residue-drift, 0px)), 520px, 0) scale(1);
    opacity: 0;
  }
}

/* 寒霜余辉 - 最后的冷光消散 */
.av-afterglow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 55%,
    rgba(150, 220, 255, 0.25) 0%,
    rgba(80, 170, 230, 0.12) 45%,
    transparent 80%
  );
  opacity: 0;
  animation: avAfterglow 0.8s ease-out 2s forwards;
  will-change: opacity;
  z-index: 1;
}

@keyframes avAfterglow {
  0% { opacity: 0; }
  30% { opacity: 0.8; }
  100% { opacity: 0; }
}

</style>
