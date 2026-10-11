<!--
  @file SandstormDevourEffect.vue
  @generated 2026-06-29
  @description 风沙吞噬 - 3D飓风切片漏斗
  从 MageSkillEffect.vue 拆分而来，仅负责本特效的模板、脚本和样式
  GPU加速：所有动画仅使用 translate3d + opacity，避免重排，保证丝滑流畅
-->
<template>
          <!-- 沙暴暗幕：遮天蔽日的琥珀色暗化 -->
          <div class="ss-dim"></div>

          <!-- ========== 阶段一：风起沙涌（0s ~ 0.5s）========== -->
          <!-- 地面龟裂：大地裂开释放沙能 -->
          <div class="ss-fissure"></div>
          <!-- 沙能汇聚：四周沙粒被抽向中心 -->
          <div
            v-for="i in 16"
            :key="'ss-gather-' + i"
            class="ss-gather-particle"
            :style="getSandGatherStyle(i)"
          ></div>
          <!-- 风带涌动：多方向流动的风沙条纹，营造风流动肆虐效果 -->
          <div class="ss-wind-bands">
            <div
              v-for="i in 16"
              :key="'ss-wind-' + i"
              class="ss-wind-band"
              :style="getSandWindStyle(i)"
            ></div>
          </div>

          <!-- ========== 阶段二：3D沙暴龙卷肆虐（0.35s ~ 1.7s）========== -->
          <div class="ss-3d-scene">
            <!-- 地面沙尘环：底部旋转的扁平沙尘云 -->
            <div class="ss-3d-ground">
              <div class="ss-ground-ring ss-gr-1"></div>
              <div class="ss-ground-ring ss-gr-2"></div>
              <div class="ss-ground-ring ss-gr-3"></div>
              <div class="ss-ground-core"></div>
            </div>

            <!-- 3D飓风龙卷主体：水平切片堆叠漏斗，上粗下细，歪斜缓慢旋转 -->
            <div class="ss-3d-tornado">
              <!-- 漏斗切片群：14层水平椭圆从底到顶半径线性递增，conic-gradient沙尘纹理缓慢旋转 -->
              <div
                v-for="i in 14"
                :key="'ss-slice-' + i"
                class="ss-funnel-slice"
                :class="i % 2 === 0 ? 'ss-spin-cw' : 'ss-spin-ccw'"
                :style="getSandFunnelStyle(i)"
              ></div>
              <!-- 能量脊柱：中心的吞噬能量柱，脉动呼吸 -->
              <div class="ss-sand-spine"></div>
              <!-- 顶部沙冠：龙卷顶端扩散的旋转沙盘 -->
              <div class="ss-sand-crown">
                <div class="ss-crown-layer ss-crown-1"></div>
                <div class="ss-crown-layer ss-crown-2"></div>
              </div>
            </div>

            <!-- 3D飞舞沙粒：围绕龙卷旋转飞舞的沙粒群 -->
            <div
              v-for="i in 18"
              :key="'ss-swirl-' + i"
              class="ss-swirl-particle"
              :style="getSandSwirlStyle(i)"
            ></div>
          </div>

          <!-- 地面沙环冲击波：扩散的沙尘冲击波 -->
          <div class="ss-shockwave ss-sw-1"></div>
          <div class="ss-shockwave ss-sw-2"></div>

          <!-- ========== 阶段三：吞噬爆裂（1.4s ~ 2.3s）========== -->
          <!-- 吞噬核心：压缩爆发的能量球 -->
          <div class="ss-devour-core"></div>
          <!-- 沙暴爆裂：碎片向外3D飞射 -->
          <div
            v-for="i in 18"
            :key="'ss-burst-' + i"
            class="ss-burst-shard"
            :style="getSandBurstStyle(i)"
          ></div>

          <!-- ========== 阶段四：消散余沙（2.1s ~ 2.5s）========== -->
          <div class="ss-residue"></div>
</template>

<script setup>
/**
 * 风沙吞噬 - 3D飓风切片漏斗
 * 从 MageSkillEffect.vue 拆分的独立特效组件
 */

function getSandGatherStyle (index) {
  const angle = (index - 1) * 22.5 + (index % 2) * 7
  const distance = 130 + (index % 5) * 20
  const size = 4 + (index % 4) * 3
  const delay = (index - 1) * 0.012
  return {
    '--gather-angle': `${angle}deg`,
    '--gather-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

function getSandWindStyle (index) {
  const top = 5 + (index % 8) * 12
  const angle = (index % 2 === 0 ? 1 : -1) * (4 + (index % 4) * 5)
  const dur = 0.7 + (index % 4) * 0.2
  const delay = 0.1 + (index % 6) * 0.07
  const width = 140 + (index % 5) * 50
  const dir = index % 2 === 0 ? 1 : -1
  const height = 2 + (index % 3)
  return {
    '--wind-top': `${top}%`,
    '--wind-angle': `${angle}deg`,
    '--wind-dur': `${dur}s`,
    '--wind-delay': `${delay}s`,
    '--wind-dir': dir,
    '--wind-height': `${height}px`,
    width: `${width}px`
  }
}

function getSandFunnelStyle (index) {
  const total = 14
  const t = (index - 1) / (total - 1) // 0=底部, 1=顶部
  const height = 680
  const rBottom = 28
  const rTop = 210
  // 半径线性递增：底部窄→顶部宽
  const radius = rBottom + (rTop - rBottom) * t
  const sliceY = t * height
  // 底部2.5s较快旋转，顶部4s缓慢旋转
  const spinDur = 2.5 + t * 1.5
  // 底部明亮，顶部略透
  const baseOpacity = 0.85 - 0.35 * t
  return {
    '--slice-y': `${sliceY}px`,
    '--slice-dur': `${spinDur}s`,
    width: `${radius * 2}px`,
    height: `${radius * 2}px`,
    opacity: baseOpacity
  }
}

function getSandSwirlStyle (index) {
  const angle = (index - 1) * 20
  const radius = 60 + (index % 6) * 22
  const size = 3 + (index % 4) * 3
  const delay = (index % 9) * 0.05
  return {
    '--swirl-angle': `${angle}deg`,
    '--swirl-radius': `${radius}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

function getSandBurstStyle (index) {
  const angle = (index - 1) * 20 + (index % 2) * 8
  const distance = 50 + (index % 5) * 22
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 12
  const size = 6 + (index % 4) * 4
  const rotate = index * 47
  const delay = (index % 3) * 0.025
  const z = (index % 3 - 1) * 40
  return {
    '--burst-tx': `${tx}px`,
    '--burst-ty': `${ty}px`,
    '--burst-tz': `${z}px`,
    '--burst-size': `${size}px`,
    '--burst-rotate': `${rotate}deg`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
风沙吞噬 - 3D飓风切片漏斗（风沙肆虐 · 切片堆叠 · 歪斜缓旋 · 吞噬爆裂 · GPU加速）
技能描述：风与土形成的沙暴，令其中的目标受到剧烈攻击
全部使用 CSS translate3d + opacity 实现GPU加速，保证60fps丝滑体验
   ================================================================ */

/* 沙暴暗幕 - 遮天蔽日的琥珀色暗化 */
.ss-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(90, 60, 20, 0.55) 0%,
    rgba(60, 40, 15, 0.38) 40%,
    rgba(40, 25, 10, 0.18) 70%,
    transparent 100%
  );
  animation: ssDim 2.5s ease-out forwards;
  will-change: opacity;
  pointer-events: none;
}

@keyframes ssDim {
  0% { opacity: 0; }
  10% { opacity: 1; }
  60% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 地面龟裂 - 大地裂开释放沙能，琥珀色能量从裂缝涌出 */
.ss-fissure {
  position: absolute;
  bottom: 12%;
  left: 50%;
  width: 90px;
  height: 90px;
  transform: translate3d(-50%, 0, 0) scale(0);
  background:
    radial-gradient(circle, rgba(255, 200, 80, 0.45) 0%, transparent 35%),
    conic-gradient(
      from 0deg,
      transparent 0deg, rgba(180, 130, 50, 0.38) 20deg, transparent 40deg,
      rgba(180, 130, 50, 0.38) 80deg, transparent 100deg,
      rgba(180, 130, 50, 0.38) 140deg, transparent 160deg,
      rgba(180, 130, 50, 0.38) 200deg, transparent 220deg,
      rgba(180, 130, 50, 0.38) 260deg, transparent 280deg,
      rgba(180, 130, 50, 0.38) 320deg, transparent 360deg
    );
  border-radius: 50%;
  animation: ssFissure 0.7s ease-out forwards;
  will-change: transform, opacity;
  pointer-events: none;
}

@keyframes ssFissure {
  0% { transform: translate3d(-50%, 0, 0) scale(0); opacity: 0; }
  25% { transform: translate3d(-50%, 0, 0) scale(1.3); opacity: 0.9; }
  100% { transform: translate3d(-50%, 0, 0) scale(3); opacity: 0; }
}

/* 沙能汇聚粒子 - 四周沙粒被抽向漩涡中心 */
.ss-gather-particle {
  position: absolute;
  bottom: 30%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(230, 180, 60, 0.9) 0%, rgba(180, 130, 40, 0.5) 60%, transparent 100%);
  box-shadow: 0 0 6px rgba(210, 160, 50, 0.6);
  transform: translate3d(-50%, 50%, 0) rotate(var(--gather-angle, 0deg)) translateX(var(--gather-distance, 0px)) scale(0);
  animation: ssGather 0.5s ease-in forwards;
  will-change: transform, opacity;
  pointer-events: none;
}

@keyframes ssGather {
  0% {
    transform: translate3d(-50%, 50%, 0) rotate(var(--gather-angle, 0deg)) translateX(var(--gather-distance, 0px)) scale(0.3);
    opacity: 0;
  }
  25% {
    opacity: 1;
    transform: translate3d(-50%, 50%, 0) rotate(var(--gather-angle, 0deg)) translateX(var(--gather-distance, 0px)) scale(1);
  }
  100% {
    transform: translate3d(-50%, 50%, 0) rotate(calc(var(--gather-angle, 0deg) + 220deg)) translateX(0px) scale(0.2);
    opacity: 0;
  }
}

/* 风带容器 - 包裹所有横向流动的风沙条纹 */
.ss-wind-bands {
  position: absolute;
  inset: 0;
  z-index: 12;
  overflow: hidden;
  pointer-events: none;
}

/* 风带 - 横向流动的风沙条纹，营造风流动肆虐、黄沙漫天效果
   通过 --wind-dir 控制方向，--wind-angle 控制倾斜角度 */
.ss-wind-band {
  position: absolute;
  top: var(--wind-top, 30%);
  left: 50%;
  height: var(--wind-height, 3px);
  border-radius: 50%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(245, 230, 180, 0.5) 20%,
    rgba(220, 190, 110, 0.85) 50%,
    rgba(245, 230, 180, 0.5) 80%,
    transparent 100%
  );
  filter: blur(2px);
  opacity: 0;
  will-change: transform, opacity;
  animation: ssWindFlow var(--wind-dur, 1.2s) ease-in-out var(--wind-delay, 0s) forwards;
  pointer-events: none;
}

@keyframes ssWindFlow {
  0% {
    transform: translate3d(calc(var(--wind-dir, 1) * -120%), 0, 0) rotate(var(--wind-angle, 0deg)) scaleX(0.3);
    opacity: 0;
  }
  15% {
    opacity: 0.9;
    transform: translate3d(calc(var(--wind-dir, 1) * -80%), 0, 0) rotate(var(--wind-angle, 0deg)) scaleX(1);
  }
  85% {
    opacity: 0.6;
  }
  100% {
    transform: translate3d(calc(var(--wind-dir, 1) * 120%), calc(var(--wind-dir, 1) * -15px), 0) rotate(var(--wind-angle, 0deg)) scaleX(0.4);
    opacity: 0;
  }
}

/* 3D场景容器 - 透视舞台，preserve-3d保证子元素3D变换正确 */
.ss-3d-scene {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 0;
  height: 0;
  z-index: 15;
  perspective: 2200px;
  transform-style: preserve-3d;
  pointer-events: none;
}

/* 地面沙尘环组 - 贴合地面的扁平旋转沙尘云
   rotateX(78deg) 使圆环近乎平铺地面，营造沙暴底部卷起的尘云 */
.ss-3d-ground {
  position: absolute;
  top: 0;
  left: 0;
  transform: rotateX(78deg);
  transform-origin: 0 0;
  opacity: 0;
  animation: ssGroundFade 2s ease-in-out 0.3s forwards;
  will-change: opacity;
}

@keyframes ssGroundFade {
  0% { opacity: 0; }
  12% { opacity: 0.9; }
  60% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* 地面沙尘环 - mask雕刻环形，conic-gradient旋转产生沙尘湍流 */
.ss-ground-ring {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0);
  -webkit-mask: radial-gradient(circle, transparent 48%, black 58%, black 94%, transparent 100%);
  mask: radial-gradient(circle, transparent 48%, black 58%, black 94%, transparent 100%);
  overflow: hidden;
}

.ss-ground-ring::before {
  content: '';
  position: absolute;
  inset: -18%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(220, 180, 100, 0.48) 22deg,
    rgba(180, 140, 60, 0.3) 42deg,
    transparent 62deg,
    transparent 142deg,
    rgba(220, 180, 100, 0.48) 164deg,
    rgba(180, 140, 60, 0.3) 184deg,
    transparent 204deg,
    transparent 284deg,
    rgba(220, 180, 100, 0.48) 306deg,
    rgba(180, 140, 60, 0.3) 326deg,
    transparent 346deg,
    transparent 360deg
  );
  filter: blur(3px);
  will-change: transform;
  backface-visibility: hidden;
}

.ss-gr-1::before { animation: ssSpinCW 0.5s linear infinite; }
.ss-gr-2::before { animation: ssSpinCCW 0.68s linear infinite; }
.ss-gr-3::before { animation: ssSpinCW 0.86s linear infinite; }

.ss-gr-1 { opacity: 0.95; width: 170px; height: 170px; }
.ss-gr-2 { opacity: 0.7; width: 230px; height: 230px; }
.ss-gr-3 { opacity: 0.5; width: 290px; height: 290px; }

/* 地面核心光晕 - 沙暴底部中心的琥珀色能量光点 */
.ss-ground-core {
  position: absolute;
  top: 0;
  left: 0;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255, 230, 150, 0.85) 0%,
    rgba(220, 170, 60, 0.5) 30%,
    rgba(180, 130, 40, 0.2) 60%,
    transparent 85%
  );
  box-shadow: 0 0 40px rgba(210, 160, 50, 0.55);
  filter: blur(2px);
  transform: translate3d(-50%, -50%, 0) scale(0.3);
  opacity: 0;
  animation: ssGroundCore 1.7s ease-in-out 0.3s forwards;
  will-change: transform, opacity;
}

@keyframes ssGroundCore {
  0% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale(0.3); }
  18% { opacity: 1; transform: translate3d(-50%, -50%, 0) scale(1.1); }
  60% { opacity: 0.7; transform: translate3d(-50%, -50%, 0) scale(1); }
  100% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale(1.3); }
}

/* 3D飓风龙卷主体 - 透视倾斜+侧歪的立体漏斗漩涡
   perspective() + rotateX() 使漏斗沙壁在倾斜平面上产生纵深，
   rotateZ(10deg) 使整个龙卷向一侧歪斜，呈现飓风倾斜形态
   scaleY 从0生长到1实现"从地面向上拔起"的升腾效果
   龙卷肆虐阶段围绕10deg基础倾角左右摇摆，模拟狂暴摇晃 */
.ss-3d-tornado {
  position: absolute;
  top: 0;
  left: 0;
  width: 520px;
  height: 680px;
  transform-origin: 50% 100%;
  transform: translate3d(-50%, -100%, 0) perspective(2400px) rotateX(56deg) rotateZ(10deg) scaleY(0);
  opacity: 0;
  animation: ssTornadoRise 0.5s cubic-bezier(0.2, 0.8, 0.3, 1) 0.35s forwards,
             ssTornadoRampage 0.8s ease-in-out 0.85s forwards,
             ssTornadoFade 1.8s ease-in-out 0.35s forwards;
  will-change: transform, opacity;
}

/* 漏斗切片旋笼 - 14层水平椭圆切片从底到顶堆叠
   每层半径线性递增（上粗下细），conic-gradient沙尘纹理缓慢自转
   相邻层正反交替旋转，产生湍流交错效果 */
.ss-funnel-slice {
  position: absolute;
  left: 50%;
  bottom: var(--slice-y, 0);
  border-radius: 50%;
  transform: translateX(-50%);
  will-change: transform;
  pointer-events: none;
}

/* 切片沙尘纹理 - conic-gradient创建旋转的沙尘条纹 */
.ss-funnel-slice::before {
  content: '';
  position: absolute;
  inset: -14%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(200, 160, 80, 0.28) 18deg,
    rgba(235, 200, 120, 0.55) 30deg,
    rgba(255, 230, 160, 0.7) 38deg,
    rgba(235, 200, 120, 0.55) 46deg,
    rgba(200, 160, 80, 0.28) 58deg,
    transparent 72deg,
    transparent 156deg,
    rgba(200, 160, 80, 0.28) 174deg,
    rgba(235, 200, 120, 0.55) 186deg,
    rgba(255, 230, 160, 0.7) 194deg,
    rgba(235, 200, 120, 0.55) 202deg,
    rgba(200, 160, 80, 0.28) 214deg,
    transparent 228deg,
    transparent 336deg,
    rgba(200, 160, 80, 0.28) 360deg
  );
  filter: blur(2px);
  will-change: transform;
  backface-visibility: hidden;
}

/* 偶数层顺时针缓慢旋转，奇数层逆时针缓慢旋转 */
.ss-spin-cw::before {
  animation: ssSliceSpinCW var(--slice-dur, 3s) linear infinite;
}

.ss-spin-ccw::before {
  animation: ssSliceSpinCCW var(--slice-dur, 3s) linear infinite;
}

@keyframes ssSliceSpinCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes ssSliceSpinCCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
}

/* 龙卷升腾 - 从地面拔起，带10deg侧歪倾角 */
@keyframes ssTornadoRise {
  0% { transform: translate3d(-50%, -100%, 0) perspective(2400px) rotateX(56deg) rotateZ(10deg) scaleY(0); }
  100% { transform: translate3d(-50%, -100%, 0) perspective(2400px) rotateX(56deg) rotateZ(10deg) scaleY(1); }
}

/* 龙卷肆虐 - 围绕10deg基础侧歪倾角左右摇摆，增加狂暴感 */
@keyframes ssTornadoRampage {
  0% { transform: translate3d(-50%, -100%, 0) perspective(2400px) rotateX(56deg) scaleY(1) rotateZ(10deg); }
  25% { transform: translate3d(-50%, -100%, 0) perspective(2400px) rotateX(54deg) scaleY(1.05) rotateZ(13deg); }
  50% { transform: translate3d(-50%, -100%, 0) perspective(2400px) rotateX(58deg) scaleY(1) rotateZ(7deg); }
  75% { transform: translate3d(-50%, -100%, 0) perspective(2400px) rotateX(55deg) scaleY(1.03) rotateZ(11deg); }
  100% { transform: translate3d(-50%, -100%, 0) perspective(2400px) rotateX(56deg) scaleY(0.9) rotateZ(10deg); }
}

/* 龙卷淡出 */
@keyframes ssTornadoFade {
  0% { opacity: 0; }
  10% { opacity: 1; }
  65% { opacity: 0.9; }
  100% { opacity: 0; }
}

/* 能量脊柱 - 中心的吞噬能量柱，沿锥轴贯穿，脉动呼吸 */
.ss-sand-spine {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 40px;
  height: 680px;
  background: linear-gradient(to top,
    rgba(255, 245, 200, 0.9) 0%,
    rgba(240, 200, 100, 0.7) 20%,
    rgba(200, 160, 70, 0.4) 50%,
    rgba(160, 120, 50, 0.15) 80%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(5px);
  box-shadow: 0 0 20px rgba(230, 180, 60, 0.6), 0 0 40px rgba(200, 150, 40, 0.3);
  transform: translate3d(-50%, 0, 0) scaleX(0.3);
  opacity: 0;
  animation: ssSpinePulse 1.8s ease-in-out 0.5s forwards;
  will-change: transform, opacity;
  pointer-events: none;
}

@keyframes ssSpinePulse {
  0% { opacity: 0; transform: translate3d(-50%, 0, 0) scaleX(0.3); }
  12% { opacity: 1; transform: translate3d(-50%, 0, 0) scaleX(1); }
  30% { opacity: 0.9; transform: translate3d(-50%, 0, 0) scaleX(0.85); }
  50% { opacity: 1; transform: translate3d(-50%, 0, 0) scaleX(1.1); }
  65% { opacity: 0.8; transform: translate3d(-50%, 0, 0) scaleX(1); }
  100% { opacity: 0; transform: translate3d(-50%, 0, 0) scaleX(0.5); }
}

/* 顶部沙冠 - 龙卷顶端扩散的旋转沙盘
   两层conic-gradient叠加，不同速度正反转产生湍流 */
.ss-sand-crown {
  position: absolute;
  top: 0;
  left: 50%;
  width: 480px;
  height: 480px;
  transform: translate3d(-50%, -50%, 0) scale(0.3);
  opacity: 0;
  animation: ssCrownSpread 1.8s ease-in-out 0.55s forwards;
  will-change: transform, opacity;
}

@keyframes ssCrownSpread {
  0% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale(0.3); }
  12% { opacity: 0.85; transform: translate3d(-50%, -50%, 0) scale(1.05); }
  50% { opacity: 1; transform: translate3d(-50%, -50%, 0) scale(1); }
  100% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale(1.3); }
}

.ss-crown-layer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  overflow: hidden;
}

.ss-crown-layer::before {
  content: '';
  position: absolute;
  inset: -15%;
  border-radius: 50%;
  will-change: transform;
  backface-visibility: hidden;
}

/* 沙冠外层 - 慢速正转，大范围沙尘条纹 */
.ss-crown-1::before {
  background: conic-gradient(from 0deg,
    transparent 0deg,
    rgba(180, 140, 60, 0.3) 20deg,
    rgba(220, 180, 100, 0.5) 30deg,
    rgba(180, 140, 60, 0.2) 40deg,
    transparent 60deg,
    transparent 150deg,
    rgba(180, 140, 60, 0.3) 170deg,
    rgba(220, 180, 100, 0.5) 180deg,
    rgba(180, 140, 60, 0.2) 190deg,
    transparent 210deg,
    transparent 300deg,
    rgba(180, 140, 60, 0.3) 320deg,
    rgba(220, 180, 100, 0.5) 330deg,
    rgba(180, 140, 60, 0.2) 340deg,
    transparent 360deg
  );
  filter: blur(3px);
  animation: ssSpinCW 1.8s linear infinite;
}

/* 沙冠内层 - 快速反转，亮色沙尘 */
.ss-crown-2::before {
  background: conic-gradient(from 60deg,
    transparent 0deg,
    rgba(230, 190, 110, 0.35) 30deg,
    rgba(255, 220, 140, 0.55) 40deg,
    rgba(230, 190, 110, 0.25) 50deg,
    transparent 70deg,
    transparent 160deg,
    rgba(230, 190, 110, 0.35) 190deg,
    rgba(255, 220, 140, 0.55) 200deg,
    rgba(230, 190, 110, 0.25) 210deg,
    transparent 230deg,
    transparent 320deg,
    rgba(230, 190, 110, 0.35) 350deg,
    rgba(255, 220, 140, 0.55) 360deg
  );
  filter: blur(2px);
  animation: ssSpinCCW 1.1s linear infinite;
}

/* 3D飞舞沙粒 - 被龙卷卷着旋转飘散的沙尘
   通过 --swirl-angle 控制起始角度，--swirl-radius 控制旋转半径 */
.ss-swirl-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(230, 190, 110, 0.6), rgba(160, 120, 40, 0.15));
  box-shadow: 0 0 4px rgba(200, 150, 50, 0.35);
  transform: translate3d(-50%, -50%, 0) rotate(var(--swirl-angle, 0deg)) translateX(0) scale(0.3);
  opacity: 0;
  will-change: transform, opacity;
  animation: ssSwirl 1.8s ease-out 0.5s forwards;
  pointer-events: none;
}

@keyframes ssSwirl {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--swirl-angle, 0deg)) translateX(0) scale(0.3);
    opacity: 0;
  }
  10% {
    transform: translate3d(-50%, -50%, 0) rotate(var(--swirl-angle, 0deg)) translateX(calc(var(--swirl-radius, 70px) * 0.4)) scale(1);
    opacity: 0.7;
  }
  35% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--swirl-angle, 0deg) + 260deg)) translateX(var(--swirl-radius, 70px)) scale(0.8);
    opacity: 0.5;
  }
  65% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--swirl-angle, 0deg) + 580deg)) translateX(calc(var(--swirl-radius, 70px) * 0.8)) scale(0.5);
    opacity: 0.3;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(calc(var(--swirl-angle, 0deg) + 760deg)) translateX(calc(var(--swirl-radius, 70px) * 0.5)) scale(0.2);
    opacity: 0;
  }
}

/* 地面沙环冲击波 - 扩散的沙尘冲击波 */
.ss-shockwave {
  position: absolute;
  bottom: 12%;
  left: 50%;
  width: 20px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid rgba(200, 160, 80, 0.7);
  box-shadow: 0 0 10px rgba(180, 140, 50, 0.4);
  transform: translate3d(-50%, 0, 0) scale(0);
  will-change: transform, opacity;
  pointer-events: none;
}

.ss-sw-1 {
  animation: ssShockwaveExpand 0.7s ease-out 0.9s forwards;
}

.ss-sw-2 {
  animation: ssShockwaveExpand 0.7s ease-out 1.1s forwards;
}

@keyframes ssShockwaveExpand {
  0% {
    transform: translate3d(-50%, 0, 0) scale(0);
    opacity: 0;
  }
  20% {
    opacity: 0.8;
  }
  100% {
    transform: translate3d(-50%, 0, 0) scale(6.5);
    opacity: 0;
  }
}

/* 吞噬核心 - 压缩爆发的能量球，先内缩后爆裂 */
.ss-devour-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255, 250, 220, 0.95) 0%,
    rgba(255, 220, 120, 0.7) 30%,
    rgba(220, 170, 50, 0.4) 60%,
    transparent 100%
  );
  box-shadow: 0 0 30px rgba(230, 180, 60, 0.7), 0 0 60px rgba(200, 150, 40, 0.4);
  filter: blur(3px);
  transform: translate3d(-50%, -50%, 0) scale(0);
  opacity: 0;
  animation: ssDevourCore 0.9s ease-out 1.4s forwards;
  will-change: transform, opacity;
  pointer-events: none;
}

@keyframes ssDevourCore {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  25% {
    transform: translate3d(-50%, -50%, 0) scale(1.5);
    opacity: 1;
  }
  45% {
    transform: translate3d(-50%, -50%, 0) scale(0.4);
    opacity: 1;
  }
  65% {
    transform: translate3d(-50%, -50%, 0) scale(3.5);
    opacity: 0.8;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(6);
    opacity: 0;
  }
}

/* 沙暴爆裂碎片 - 从吞噬核心向外3D飞射 */
.ss-burst-shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--burst-size, 8px);
  height: var(--burst-size, 8px);
  border-radius: 30% 40% 35% 45%;
  background: radial-gradient(circle at 30% 30%,
    rgba(255, 220, 140, 0.95) 0%,
    rgba(200, 160, 70, 0.7) 50%,
    rgba(140, 100, 40, 0.4) 100%
  );
  box-shadow: 0 0 6px rgba(220, 170, 60, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
  animation: ssBurstFly 0.8s ease-out 1.5s forwards;
  will-change: transform, opacity;
  pointer-events: none;
}

@keyframes ssBurstFly {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) scale(1.2) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate3d(calc(-50% + var(--burst-tx, 0px)), calc(-50% + var(--burst-ty, 0px)), var(--burst-tz, 0px)) scale(0.3) rotate(var(--burst-rotate, 180deg));
    opacity: 0;
  }
}

/* 残留沙尘 - 风暴消散后的余沙 */
.ss-residue {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(180, 140, 60, 0.15) 0%,
    rgba(140, 100, 40, 0.08) 50%,
    transparent 100%
  );
  opacity: 0;
  animation: ssResidue 0.8s ease-out 2s forwards;
  will-change: opacity;
  pointer-events: none;
}

@keyframes ssResidue {
  0% { opacity: 0; }
  20% { opacity: 0.8; }
  100% { opacity: 0; }
}

/* 通用旋转关键帧 - 正转/反转360度，供沙暴层和漩涡复用 */
@keyframes ssSpinCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes ssSpinCCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
}

</style>
