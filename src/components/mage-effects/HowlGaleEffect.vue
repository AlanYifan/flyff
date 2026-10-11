<!--
  @file HowlGaleEffect.vue
  @generated 2026-06-29
  @description 狂风怒吼 - 3D龙卷风肆虐
  从 MageSkillEffect.vue 拆分而来，仅负责本特效的模板、脚本和样式
  GPU加速：所有动画仅使用 translate3d + opacity，避免重排，保证丝滑流畅
-->
<template>
          <!-- 风暴暗幕：深沉风暴阴霾全程覆盖 -->
          <div class="howl-storm-dim"></div>

          <!-- ========== 阶段一：风暴凝聚（0s ~ 0.35s）- 风能向中心汇聚 ========== -->
          <!-- 地面龟裂：三个风压点撕裂地面，绿色能量从裂缝溢出 -->
          <div
            v-for="i in 3"
            :key="'howl-crack-' + i"
            class="howl-ground-crack"
            :style="getHowlCrackStyle(i)"
          ></div>
          <!-- 风能核心：三个风压球蓄力脉动，向中心压缩催生龙卷风 -->
          <div
            v-for="i in 3"
            :key="'howl-core-' + i"
            class="howl-energy-core"
            :style="getHowlCoreStyle(i)"
          ></div>
          <!-- 吸气粒子：周围空气被猛烈抽向龙卷风中心 -->
          <div
            v-for="i in 16"
            :key="'howl-inhale-' + i"
            class="howl-inhale-particle"
            :style="getHowlInhaleStyle(i)"
          ></div>

          <!-- ========== 阶段二~三：3D龙卷风升腾肆虐（0.35s ~ 2.3s） ========== -->
          <div class="howl-3d-scene">
            <!-- 地面旋转尘环：龙卷风底部贴合地面的扁平旋转碎屑云 -->
            <div class="howl-3d-ground">
              <div
                v-for="i in 4"
                :key="'howl-gr-' + i"
                class="howl-3d-ground-ring"
                :class="'gr-' + i"
                :style="getHowlGroundRingStyle(i)"
              ></div>
              <div class="howl-3d-ground-core"></div>
            </div>

            <!-- 3D龙卷风漏斗主体：16层水平切片堆叠，透视倾斜形成立体漏斗 -->
            <div class="howl-3d-funnel">
              <div
                v-for="i in 16"
                :key="'howl-slice-' + i"
                class="howl-3d-slice"
                :class="i % 2 === 0 ? 'spin-cw' : 'spin-ccw'"
                :style="getHowlSliceStyle(i)"
              ></div>
              <!-- 漏斗核心光柱：龙卷风中心的能量脊柱 -->
              <div class="howl-3d-core-beam"></div>
              <!-- 顶部交汇漩涡：漏斗顶端扩散的巨大旋转云盘 -->
              <div class="howl-3d-top-vortex">
                <div class="howl-tv-layer tv-outer"></div>
                <div class="howl-tv-layer tv-mid"></div>
                <div class="howl-tv-layer tv-inner"></div>
                <div class="howl-tv-eye"></div>
              </div>
            </div>

            <!-- 小龙卷风分裂：巨型龙卷风显示1秒后，5个旋转小龙卷风从中心向四周移动 -->
            <div class="howl-3d-mini-group">
              <div
                v-for="i in 5"
                :key="'howl-mini-' + i"
                class="howl-3d-mini"
                :style="getHowlMiniTornadoStyle(i)"
              >
                <!-- 小龙卷风漏斗：6层切片堆叠的缩小版3D漏斗 -->
                <div class="howl-3d-mini-funnel">
                  <div
                    v-for="j in 6"
                    :key="'howl-mslice-' + i + '-' + j"
                    class="howl-3d-mini-slice"
                    :class="j % 2 === 0 ? 'mspin-cw' : 'mspin-ccw'"
                    :style="getHowlMiniSliceStyle(j)"
                  ></div>
                  <div class="howl-3d-mini-beam"></div>
                </div>
                <!-- 小龙卷风地面尘环 -->
                <div class="howl-3d-mini-ground"></div>
              </div>
            </div>
          </div>

          <!-- 风暴冲击波：多层环形冲击波从中心向外扩散（范围翻倍） -->
          <div class="howl-shockwave sw-1"></div>
          <div class="howl-shockwave sw-2"></div>
          <div class="howl-shockwave sw-3"></div>

          <!-- 狂风刃乱射：锋利月牙形风刃在区域内乱飞（范围翻倍） -->
          <div
            v-for="i in 10"
            :key="'howl-blade-' + i"
            class="howl-wind-blade"
            :style="getHowlBladeStyle(i)"
          >
            <div class="howl-blade-edge"></div>
          </div>

          <!-- 碎石飞溅：被龙卷风卷起的碎石（范围翻倍） -->
          <div
            v-for="i in 14"
            :key="'howl-debris-' + i"
            class="howl-flying-debris"
            :style="getHowlDebrisStyle(i)"
          ></div>

          <!-- 旋转卷沙：被龙卷风卷着旋转飘散的沙尘（范围翻倍） -->
          <div
            v-for="i in 12"
            :key="'howl-swirl-' + i"
            class="howl-swirl-dust"
            :style="getHowlSwirlDustStyle(i)"
          ></div>

          <!-- ========== 阶段四：风暴消散（2.5s ~ 2.9s） ========== -->
          <!-- 消散余波：最后的旋转风场 -->
          <div class="howl-dissipate-field"></div>
</template>

<script setup>
/**
 * 狂风怒吼 - 3D龙卷风肆虐
 * 从 MageSkillEffect.vue 拆分的独立特效组件
 */

// 组件渲染 fragment（多根节点），需禁用 attrs 自动继承
defineOptions({
  inheritAttrs: false
})

function getHowlCrackStyle (index) {
  const angle = (index - 1) * 120 - 90
  const radius = 60
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * radius
  const ty = Math.sin(rad) * radius
  return {
    '--crack-tx': `${tx}px`,
    '--crack-ty': `${ty}px`
  }
}

function getHowlCoreStyle (index) {
  const angle = (index - 1) * 120 - 90
  const radius = 60
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * radius
  const ty = Math.sin(rad) * radius
  return {
    '--core-tx': `${tx}px`,
    '--core-ty': `${ty}px`
  }
}

function getHowlInhaleStyle (index) {
  const angle = (index - 1) * 22.5
  const distance = 130 + (index % 4) * 18
  const size = 4 + (index % 3) * 3
  const delay = (index - 1) * 0.02
  return {
    '--inhale-angle': `${angle}deg`,
    '--inhale-distance': `${distance}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

function getHowlSliceStyle (index) {
  const total = 16
  const t = (index - 1) / (total - 1) // 0=底部, 1=顶部
  const height = 760
  const rBottom = 32
  const rTop = 220
  const radius = rBottom + (rTop - rBottom) * t
  const sliceY = t * height
  const spinDur = 0.32 + t * 0.7 // 底部0.32s快转，顶部1.02s慢转
  const baseOpacity = 0.82 - 0.34 * t // 底部明亮，顶部略透
  return {
    '--slice-y': `${sliceY}px`,
    '--slice-dur': `${spinDur}s`,
    width: `${radius * 2}px`,
    height: `${radius * 2}px`,
    opacity: baseOpacity
  }
}

function getHowlGroundRingStyle (index) {
  const radius = 140 + (index - 1) * 64 // 140/204/268/332
  const spinDur = 0.5 + (index - 1) * 0.18
  return {
    width: `${radius * 2}px`,
    height: `${radius * 2}px`,
    '--gr-dur': `${spinDur}s`
  }
}

function getHowlMiniTornadoStyle (index) {
  const angle = (index - 1) * 72 - 90
  const distance = 330
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance
  return {
    '--mini-tx': `${tx}px`,
    '--mini-ty': `${ty}px`
  }
}

function getHowlMiniSliceStyle (index) {
  const total = 6
  const t = (index - 1) / (total - 1) // 0=底部, 1=顶部
  const height = 360
  const rBottom = 20
  const rTop = 104
  const radius = rBottom + (rTop - rBottom) * t
  const sliceY = t * height
  const spinDur = 0.26 + t * 0.3
  const baseOpacity = 0.8 - 0.3 * t
  return {
    '--mslice-y': `${sliceY}px`,
    '--mslice-dur': `${spinDur}s`,
    width: `${radius * 2}px`,
    height: `${radius * 2}px`,
    opacity: baseOpacity
  }
}

function getHowlBladeStyle (index) {
  const angle = (index - 1) * 36 + (index % 2) * 12
  const distance = 220 + (index % 3) * 30
  const delay = (index % 5) * 0.08
  return {
    '--blade-angle': `${angle}deg`,
    '--blade-distance': `${distance}px`,
    animationDelay: `${delay}s`
  }
}

function getHowlDebrisStyle (index) {
  const angle = (index - 1) * 25.7 + (index % 2) * 9
  const distance = 120 + (index % 4) * 26
  const height = 70 + (index % 3) * 28
  const size = 6 + (index % 3) * 3
  const delay = (index % 4) * 0.05
  return {
    '--debris-angle': `${angle}deg`,
    '--debris-distance': `${distance}px`,
    '--debris-height': `${height}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

function getHowlSwirlDustStyle (index) {
  const angle = (index - 1) * 30
  const radius = 90 + (index % 5) * 22
  const size = 3 + (index % 3) * 2
  const delay = (index % 7) * 0.08
  return {
    '--swirl-angle': `${angle}deg`,
    '--swirl-radius': `${radius}px`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   狂风怒吼 (element_mage_w) - 3D龙卷风肆虐
   技能描述：使区域笼罩在狂风之中，一定几率减缓区域内目标的攻击速度
   四阶段叙事：风暴凝聚 → 3D龙卷升腾 → 风暴肆虐 → 风暴消散
   核心：3D透视漏斗（16层切片堆叠）+ 地面尘环 + 顶部交汇云盘 + 狂风环绕
   性能：动画仅使用 transform + opacity，GPU合成层加速，零重绘
   3D原理：perspective() + rotateX() 倾斜平面产生纵深，scaleY生长实现升腾
   ================================================================ */

/* 风暴暗幕 - 深沉风暴阴霾，全程2.9s持续覆盖 */
.howl-storm-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center 55%,
    rgba(3, 28, 20, 0.78) 0%,
    rgba(3, 20, 14, 0.52) 35%,
    rgba(2, 12, 8, 0.26) 70%,
    transparent 100%
  );
  animation: howlStormDim 2.9s ease-out forwards;
  will-change: opacity;
}

@keyframes howlStormDim {
  0% { opacity: 0; }
  5% { opacity: 1; }
  75% { opacity: 0.85; }
  90% { opacity: 0.35; }
  100% { opacity: 0; }
}

/* ========== 阶段一：风暴凝聚（0s ~ 0.35s）- 风能向中心汇聚 ========== */

/* 地面龟裂 - 三个风压点撕裂地面，绿色能量从裂缝中溢出
   通过 --crack-tx / --crack-ty 控制三个龟裂点的位置 */
.howl-ground-crack {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 80px;
  height: 80px;
  transform: translate(-50%, -50%) translate(var(--crack-tx, 0), var(--crack-ty, 0)) scale(0);
  opacity: 0;
  animation: howlGroundCrack 0.35s ease-out forwards;
  will-change: transform, opacity;
}

.howl-ground-crack::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(120, 255, 180, 0.4) 2deg,
    transparent 4deg,
    transparent 42deg,
    rgba(120, 255, 180, 0.3) 44deg,
    transparent 46deg,
    transparent 88deg,
    rgba(120, 255, 180, 0.4) 90deg,
    transparent 92deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 20%, black 30%, transparent 80%);
  mask: radial-gradient(circle, transparent 20%, black 30%, transparent 80%);
}

.howl-ground-crack::after {
  content: '';
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(150, 255, 200, 0.5) 0%,
    rgba(100, 255, 180, 0.2) 50%,
    transparent 80%
  );
}

@keyframes howlGroundCrack {
  0% { transform: translate(-50%, -50%) translate(var(--crack-tx, 0), var(--crack-ty, 0)) scale(0); opacity: 0; }
  30% { transform: translate(-50%, -50%) translate(var(--crack-tx, 0), var(--crack-ty, 0)) scale(0.8); opacity: 1; }
  100% { transform: translate(-50%, -50%) translate(var(--crack-tx, 0), var(--crack-ty, 0)) scale(1.3); opacity: 0; }
}

/* 风能核心 - 三个风压球蓄力脉动，龙卷风形成前的能量汇聚 */
.howl-energy-core {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(200, 255, 230, 0.7) 25%,
    rgba(120, 255, 190, 0.4) 55%,
    transparent 90%
  );
  box-shadow: 0 0 20px rgba(100, 255, 200, 0.7), 0 0 40px rgba(80, 255, 180, 0.4);
  transform: translate(-50%, -50%) translate(var(--core-tx, 0), var(--core-ty, 0)) scale(0);
  opacity: 0;
  animation: howlEnergyCore 0.35s ease-in forwards;
  will-change: transform, opacity;
}

@keyframes howlEnergyCore {
  0% { transform: translate(-50%, -50%) translate(var(--core-tx, 0), var(--core-ty, 0)) scale(0); opacity: 0; }
  20% { transform: translate(-50%, -50%) translate(var(--core-tx, 0), var(--core-ty, 0)) scale(1.2); opacity: 0.8; }
  40% { transform: translate(-50%, -50%) translate(var(--core-tx, 0), var(--core-ty, 0)) scale(0.7); opacity: 1; }
  60% { transform: translate(-50%, -50%) translate(var(--core-tx, 0), var(--core-ty, 0)) scale(1.1); opacity: 0.9; }
  80% { transform: translate(-50%, -50%) translate(var(--core-tx, 0), var(--core-ty, 0)) scale(0.6); opacity: 1; }
  100% { transform: translate(-50%, -50%) translate(var(--core-tx, 0), var(--core-ty, 0)) scale(1.5); opacity: 0; }
}

/* 吸气粒子 - 周围空气被猛烈抽向中心，模拟龙卷风形成前的空气汇聚
   通过 --inhale-angle 控制起始角度，--inhale-distance 控制起始距离 */
.howl-inhale-particle {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(180, 255, 220, 0.9), rgba(80, 220, 170, 0.2));
  box-shadow: 0 0 6px rgba(120, 255, 200, 0.5);
  transform: translate(-50%, -50%) rotate(var(--inhale-angle, 0deg)) translateX(var(--inhale-distance, 80px)) scale(1);
  opacity: 0;
  will-change: transform, opacity;
  animation: howlInhale 0.35s ease-in forwards;
}

@keyframes howlInhale {
  0% {
    transform: translate(-50%, -50%) rotate(var(--inhale-angle, 0deg)) translateX(var(--inhale-distance, 80px)) scale(1);
    opacity: 0;
  }
  20% { opacity: 0.9; }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--inhale-angle, 0deg) + 180deg)) translateX(0) scale(0.2);
    opacity: 0;
  }
}

/* ========== 阶段二~三：3D龙卷风升腾肆虐（0.35s ~ 2.3s） ========== */

/* 3D场景容器 - 定位在地面中心，统一管理层级与3D舞台 */
.howl-3d-scene {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 0;
  height: 0;
  z-index: 15;
}

/* 地面尘环组 - 贴合地面的扁平旋转碎屑云
   rotateX(78deg) 使圆环近乎平铺地面，营造龙卷风底部卷起的尘云 */
.howl-3d-ground {
  position: absolute;
  top: 0;
  left: 0;
  transform: rotateX(78deg);
  transform-origin: 0 0;
  opacity: 0;
  animation: howlGroundFade 2.2s ease-in-out 0.35s forwards;
  will-change: opacity;
}

@keyframes howlGroundFade {
  0% { opacity: 0; }
  12% { opacity: 0.9; }
  70% { opacity: 0.75; }
  100% { opacity: 0; }
}

/* 地面尘环 - 通用环样式，mask雕刻环形，conic-gradient旋转产生碎屑湍流 */
.howl-3d-ground-ring {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  -webkit-mask: radial-gradient(circle, transparent 50%, black 60%, black 94%, transparent 100%);
  mask: radial-gradient(circle, transparent 50%, black 60%, black 94%, transparent 100%);
  overflow: hidden;
}

.howl-3d-ground-ring::before {
  content: '';
  position: absolute;
  inset: -18%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(180, 255, 220, 0.45) 22deg,
    rgba(120, 255, 190, 0.28) 42deg,
    transparent 62deg,
    transparent 142deg,
    rgba(180, 255, 220, 0.45) 164deg,
    rgba(120, 255, 190, 0.28) 184deg,
    transparent 204deg,
    transparent 284deg,
    rgba(180, 255, 220, 0.45) 306deg,
    rgba(120, 255, 190, 0.28) 326deg,
    transparent 346deg,
    transparent 360deg
  );
  filter: blur(3px);
  will-change: transform;
}

.gr-1::before { animation: howlSpinCW var(--gr-dur, 0.5s) linear infinite; }
.gr-2::before { animation: howlSpinCCW var(--gr-dur, 0.68s) linear infinite; }
.gr-3::before { animation: howlSpinCW var(--gr-dur, 0.86s) linear infinite; }
.gr-4::before { animation: howlSpinCCW var(--gr-dur, 1.04s) linear infinite; }

.gr-1 { opacity: 0.95; }
.gr-2 { opacity: 0.7; }
.gr-3 { opacity: 0.5; }
.gr-4 { opacity: 0.35; }

/* 地面核心光晕 - 龙卷风底部中心的明亮能量光点 */
.howl-3d-ground-core {
  position: absolute;
  top: 0;
  left: 0;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(180, 255, 220, 0.5) 30%,
    rgba(100, 255, 180, 0.2) 60%,
    transparent 85%
  );
  box-shadow: 0 0 45px rgba(150, 255, 200, 0.55);
  filter: blur(2px);
  transform: translate(-50%, -50%) scale(0.3);
  opacity: 0;
  animation: howlGroundCore 1.7s ease-in-out 0.35s forwards;
  will-change: transform, opacity;
}

@keyframes howlGroundCore {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  60% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.3); }
}

/* 3D龙卷风漏斗主体 - 透视倾斜的立体漏斗
   perspective() + rotateX() 使16层切片在倾斜平面上产生纵深，
   scaleY 从0生长到1实现"从地面向上拔起"的升腾效果
   非preserve-3d：单层倾斜平面+perspective即可呈现3D漏斗，opacity可自由动画 */
.howl-3d-funnel {
  position: absolute;
  top: 0;
  left: 0;
  width: 480px;
  height: 760px;
  transform-origin: 50% 100%;
  transform: translate(-50%, -100%) perspective(2400px) rotateX(58deg) scaleY(0);
  opacity: 0;
  animation: howlFunnelRise 0.55s cubic-bezier(0.2, 0.8, 0.3, 1) 0.35s forwards,
             howlFunnelFade 2.05s ease-in-out 0.35s forwards;
  will-change: transform, opacity;
}

@keyframes howlFunnelRise {
  0% { transform: translate(-50%, -100%) perspective(2400px) rotateX(58deg) scaleY(0); }
  100% { transform: translate(-50%, -100%) perspective(2400px) rotateX(58deg) scaleY(1); }
}

@keyframes howlFunnelFade {
  0% { opacity: 0; }
  12% { opacity: 1; }
  75% { opacity: 0.92; }
  100% { opacity: 0; }
}

/* 漏斗切片 - 水平圆盘，通过 --slice-y 控制距底部高度
   底部切片小而快转（龙卷风核心），顶部切片大而慢转（扩散云顶）
   自转放在 ::before 上，与切片的定位 transform 隔离避免冲突 */
.howl-3d-slice {
  position: absolute;
  left: 50%;
  bottom: var(--slice-y, 0);
  border-radius: 50%;
  transform: translateX(-50%);
  will-change: transform;
}

.howl-3d-slice::before {
  content: '';
  position: absolute;
  inset: -14%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(120, 255, 190, 0.2) 16deg,
    rgba(190, 255, 220, 0.48) 30deg,
    rgba(235, 255, 245, 0.65) 38deg,
    rgba(190, 255, 220, 0.48) 46deg,
    rgba(120, 255, 190, 0.2) 60deg,
    transparent 72deg,
    transparent 156deg,
    rgba(120, 255, 190, 0.2) 172deg,
    rgba(190, 255, 220, 0.48) 186deg,
    rgba(235, 255, 245, 0.65) 194deg,
    rgba(190, 255, 220, 0.48) 202deg,
    rgba(120, 255, 190, 0.2) 216deg,
    transparent 228deg,
    transparent 336deg,
    rgba(120, 255, 190, 0.2) 360deg
  );
  filter: blur(1.5px);
  will-change: transform;
}

.spin-cw::before { animation: howlSpinCW var(--slice-dur, 0.6s) linear infinite; }
.spin-ccw::before { animation: howlSpinCCW var(--slice-dur, 0.6s) linear infinite; }

/* 漏斗核心光柱 - 龙卷风中心的能量脊柱，沿漏斗轴线贯穿 */
.howl-3d-core-beam {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 24px;
  height: 760px;
  background: linear-gradient(to top,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(200, 255, 230, 0.7) 25%,
    rgba(140, 255, 200, 0.4) 60%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(2px);
  box-shadow: 0 0 20px rgba(150, 255, 200, 0.6);
  transform: translateX(-50%) scaleX(0.4);
  opacity: 0;
  animation: howlCoreBeam 2s ease-in-out 0.5s forwards;
  will-change: transform, opacity;
}

@keyframes howlCoreBeam {
  0% { opacity: 0; transform: translateX(-50%) scaleX(0.4); }
  15% { opacity: 1; transform: translateX(-50%) scaleX(1); }
  70% { opacity: 0.8; transform: translateX(-50%) scaleX(1); }
  100% { opacity: 0; transform: translateX(-50%) scaleX(0.6); }
}

/* 顶部交汇漩涡 - 漏斗顶端扩散的巨大旋转云盘
   三层conic-gradient叠加，不同速度正反转产生湍流 */
.howl-3d-top-vortex {
  position: absolute;
  top: 0;
  left: 50%;
  width: 480px;
  height: 480px;
  transform: translate(-50%, -50%) scale(0.3);
  opacity: 0;
  animation: howlTopVortex 2s ease-in-out 0.55s forwards;
  will-change: transform, opacity;
}

@keyframes howlTopVortex {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  15% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.05); }
  55% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
}

.howl-tv-layer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  overflow: hidden;
}

.howl-tv-layer::before {
  content: '';
  position: absolute;
  inset: -15%;
  border-radius: 50%;
  will-change: transform;
}

/* 顶部云盘外层 - 慢速正转，大范围风沙条纹 */
.tv-outer::before {
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(100, 220, 170, 0.32) 12deg,
    rgba(140, 240, 200, 0.52) 22deg,
    rgba(100, 220, 170, 0.24) 32deg,
    transparent 42deg,
    transparent 102deg,
    rgba(100, 220, 170, 0.32) 114deg,
    rgba(140, 240, 200, 0.52) 124deg,
    rgba(100, 220, 170, 0.24) 134deg,
    transparent 144deg,
    transparent 204deg,
    rgba(100, 220, 170, 0.32) 216deg,
    rgba(140, 240, 200, 0.52) 226deg,
    rgba(100, 220, 170, 0.24) 236deg,
    transparent 246deg,
    transparent 306deg,
    rgba(100, 220, 170, 0.32) 318deg,
    rgba(140, 240, 200, 0.52) 328deg,
    rgba(100, 220, 170, 0.24) 338deg,
    transparent 348deg,
    transparent 360deg
  );
  filter: blur(4px);
  animation: howlSpinCW 0.7s linear infinite;
}

/* 顶部云盘中层 - 中速反转，更亮风纹 */
.tv-mid::before {
  background: conic-gradient(
    from 45deg,
    transparent 0deg,
    rgba(180, 255, 220, 0.42) 15deg,
    rgba(225, 255, 240, 0.65) 25deg,
    rgba(180, 255, 220, 0.3) 35deg,
    transparent 45deg,
    transparent 105deg,
    rgba(180, 255, 220, 0.42) 120deg,
    rgba(225, 255, 240, 0.65) 130deg,
    rgba(180, 255, 220, 0.3) 140deg,
    transparent 150deg,
    transparent 210deg,
    rgba(180, 255, 220, 0.42) 225deg,
    rgba(225, 255, 240, 0.65) 235deg,
    rgba(180, 255, 220, 0.3) 245deg,
    transparent 255deg,
    transparent 315deg,
    rgba(180, 255, 220, 0.42) 330deg,
    rgba(225, 255, 240, 0.65) 340deg,
    rgba(180, 255, 220, 0.3) 350deg,
    transparent 360deg
  );
  filter: blur(2px);
  animation: howlSpinCCW 0.45s linear infinite;
}

/* 顶部云盘内层 - 快速正转，最亮核心风带 */
.tv-inner::before {
  background: conic-gradient(
    from 90deg,
    transparent 0deg,
    rgba(230, 255, 245, 0.5) 15deg,
    rgba(255, 255, 255, 0.82) 25deg,
    rgba(230, 255, 245, 0.4) 35deg,
    transparent 45deg,
    transparent 105deg,
    rgba(230, 255, 245, 0.5) 120deg,
    rgba(255, 255, 255, 0.82) 130deg,
    rgba(230, 255, 245, 0.4) 140deg,
    transparent 150deg,
    transparent 210deg,
    rgba(230, 255, 245, 0.5) 225deg,
    rgba(255, 255, 255, 0.82) 235deg,
    rgba(230, 255, 245, 0.4) 245deg,
    transparent 255deg,
    transparent 315deg,
    rgba(230, 255, 245, 0.5) 330deg,
    rgba(255, 255, 255, 0.82) 340deg,
    rgba(230, 255, 245, 0.4) 350deg,
    transparent 360deg
  );
  filter: blur(1px);
  animation: howlSpinCW 0.3s linear infinite;
}

/* 顶部云盘风眼 - 明亮的核心光点 */
.howl-tv-eye {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(180, 255, 220, 0.7) 35%,
    rgba(100, 255, 180, 0.35) 65%,
    transparent 100%
  );
  box-shadow: 0 0 30px rgba(150, 255, 200, 0.7), 0 0 60px rgba(100, 255, 180, 0.4);
  transform: translate(-50%, -50%) scale(0);
  will-change: transform, opacity;
  animation: howlTvEye 2s ease-in-out 0.55s forwards;
}

@keyframes howlTvEye {
  0% { transform: translate(-50%, -50%) scale(0); }
  20% { transform: translate(-50%, -50%) scale(1.4); }
  55% { transform: translate(-50%, -50%) scale(0.9); }
  100% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
}

/* ========== 小龙卷风分裂（1.35s ~ 2.55s）- 巨型龙卷风显示1秒后从中心向四周分裂 ========== */

/* 小龙卷风群容器 - 定位在3D场景中心，统一管理层级 */
.howl-3d-mini-group {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  z-index: 16;
}

/* 小龙卷风单体 - 从中心向四周移动
   通过 --mini-tx / --mini-ty 控制移动终点，1.35s启动（巨型龙卷风显示1秒后）
   移动同时淡入淡出，5个龙卷风72°均匀散开 */
.howl-3d-mini {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  opacity: 0;
  animation: howlMiniSpawn 1.2s cubic-bezier(0.2, 0.65, 0.3, 1) 1.35s forwards;
  will-change: transform, opacity;
}

@keyframes howlMiniSpawn {
  0% { transform: translate(0, 0); opacity: 0; }
  8% { opacity: 1; }
  82% { opacity: 0.85; }
  100% { transform: translate(var(--mini-tx, 0), var(--mini-ty, 0)); opacity: 0; }
}

/* 小龙卷风漏斗 - 缩小版3D漏斗，perspective+rotateX倾斜产生纵深
   scaleY从0生长实现"从地面拔起"，与巨型龙卷风同构但尺寸缩小 */
.howl-3d-mini-funnel {
  position: absolute;
  top: 0;
  left: 0;
  width: 220px;
  height: 360px;
  transform-origin: 50% 100%;
  transform: translate(-50%, -100%) perspective(1600px) rotateX(58deg) scaleY(0);
  opacity: 0;
  animation: howlMiniFunnelRise 0.4s ease-out 1.35s forwards,
             howlMiniFunnelFade 1.2s ease-in-out 1.35s forwards;
  will-change: transform, opacity;
}

@keyframes howlMiniFunnelRise {
  0% { transform: translate(-50%, -100%) perspective(1600px) rotateX(58deg) scaleY(0); }
  100% { transform: translate(-50%, -100%) perspective(1600px) rotateX(58deg) scaleY(1); }
}

@keyframes howlMiniFunnelFade {
  0% { opacity: 0; }
  10% { opacity: 1; }
  80% { opacity: 0.9; }
  100% { opacity: 0; }
}

/* 小龙卷风切片 - 水平圆盘，通过 --mslice-y 控制距底部高度
   自转放在 ::before 上，与切片定位 transform 隔离避免冲突 */
.howl-3d-mini-slice {
  position: absolute;
  left: 50%;
  bottom: var(--mslice-y, 0);
  border-radius: 50%;
  transform: translateX(-50%);
  will-change: transform;
}

.howl-3d-mini-slice::before {
  content: '';
  position: absolute;
  inset: -14%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(120, 255, 190, 0.22) 18deg,
    rgba(190, 255, 220, 0.5) 32deg,
    rgba(235, 255, 245, 0.68) 40deg,
    rgba(190, 255, 220, 0.5) 48deg,
    rgba(120, 255, 190, 0.22) 62deg,
    transparent 74deg,
    transparent 158deg,
    rgba(120, 255, 190, 0.22) 176deg,
    rgba(190, 255, 220, 0.5) 190deg,
    rgba(235, 255, 245, 0.68) 198deg,
    rgba(190, 255, 220, 0.5) 206deg,
    rgba(120, 255, 190, 0.22) 220deg,
    transparent 232deg,
    transparent 340deg,
    rgba(120, 255, 190, 0.22) 360deg
  );
  filter: blur(1.2px);
  will-change: transform;
}

.mspin-cw::before { animation: howlSpinCW var(--mslice-dur, 0.4s) linear infinite; }
.mspin-ccw::before { animation: howlSpinCCW var(--mslice-dur, 0.4s) linear infinite; }

/* 小龙卷风核心光柱 - 缩小版能量脊柱 */
.howl-3d-mini-beam {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 16px;
  height: 360px;
  background: linear-gradient(to top,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(200, 255, 230, 0.6) 30%,
    rgba(140, 255, 200, 0.3) 65%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(1.5px);
  box-shadow: 0 0 12px rgba(150, 255, 200, 0.5);
  transform: translateX(-50%) scaleX(0.4);
  opacity: 0;
  animation: howlMiniBeam 1.2s ease-in-out 1.35s forwards;
  will-change: transform, opacity;
}

@keyframes howlMiniBeam {
  0% { opacity: 0; transform: translateX(-50%) scaleX(0.4); }
  12% { opacity: 1; transform: translateX(-50%) scaleX(1); }
  75% { opacity: 0.7; transform: translateX(-50%) scaleX(1); }
  100% { opacity: 0; transform: translateX(-50%) scaleX(0.5); }
}

/* 小龙卷风地面尘环 - 贴合地面的扁平旋转碎屑云
   rotateX(78deg) 使圆环平铺地面，与漏斗的3D倾斜互补 */
.howl-3d-mini-ground {
  position: absolute;
  top: 0;
  left: 0;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  transform: translate(-50%, -50%) rotateX(78deg);
  -webkit-mask: radial-gradient(circle, transparent 45%, black 58%, black 92%, transparent 100%);
  mask: radial-gradient(circle, transparent 45%, black 58%, black 92%, transparent 100%);
  overflow: hidden;
  opacity: 0;
  animation: howlMiniGround 1.2s ease-in-out 1.35s forwards;
  will-change: transform, opacity;
}

.howl-3d-mini-ground::before {
  content: '';
  position: absolute;
  inset: -18%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(180, 255, 220, 0.4) 22deg,
    rgba(120, 255, 190, 0.24) 42deg,
    transparent 62deg,
    transparent 142deg,
    rgba(180, 255, 220, 0.4) 164deg,
    rgba(120, 255, 190, 0.24) 184deg,
    transparent 204deg,
    transparent 284deg,
    rgba(180, 255, 220, 0.4) 306deg,
    rgba(120, 255, 190, 0.24) 326deg,
    transparent 346deg,
    transparent 360deg
  );
  filter: blur(2.5px);
  will-change: transform;
  animation: howlSpinCCW 0.5s linear infinite;
}

@keyframes howlMiniGround {
  0% { opacity: 0; }
  12% { opacity: 0.85; }
  78% { opacity: 0.6; }
  100% { opacity: 0; }
}

/* 风暴冲击波 - 多层环形冲击波从中心向外扩散（范围翻倍）
   龙卷风升腾瞬间引发的气压爆发 */
.howl-shockwave {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 5px solid rgba(200, 255, 230, 0.8);
  box-shadow:
    0 0 30px rgba(180, 255, 220, 0.6),
    0 0 60px rgba(120, 255, 200, 0.4);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.sw-1 {
  border-width: 6px;
  animation: howlShockwave 0.95s cubic-bezier(0.05, 0.9, 0.25, 1) 0.5s forwards;
}

.sw-2 {
  border-width: 5px;
  border-color: rgba(180, 255, 220, 0.65);
  animation: howlShockwave 1.05s cubic-bezier(0.05, 0.9, 0.25, 1) 0.6s forwards;
}

.sw-3 {
  border-width: 4px;
  border-color: rgba(150, 255, 200, 0.5);
  animation: howlShockwave 1.15s cubic-bezier(0.05, 0.9, 0.25, 1) 0.7s forwards;
}

@keyframes howlShockwave {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  8% { opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(22); opacity: 0; }
}

/* 狂风刃乱射 - 锋利月牙形风刃在龙卷风肆虐阶段从中心向外乱射（范围翻倍）
   通过 --blade-angle 控制射出方向，--blade-distance 控制飞行距离 */
.howl-wind-blade {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%) rotate(var(--blade-angle, 0deg));
  opacity: 0;
  will-change: transform, opacity;
  animation: howlBladeFly 1s ease-out 0.9s forwards;
}

@keyframes howlBladeFly {
  0% { opacity: 0; }
  10% { opacity: 1; }
  80% { opacity: 0.5; }
  100% { opacity: 0; }
}

/* 风刃本体 - 月牙形，带拖尾光效 */
.howl-blade-edge {
  position: absolute;
  top: 0;
  left: 0;
  width: 75px;
  height: 18px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(180, 255, 220, 0.15) 10%,
    rgba(220, 255, 240, 0.5) 35%,
    rgba(255, 255, 255, 0.9) 50%,
    rgba(220, 255, 240, 0.5) 65%,
    rgba(180, 255, 220, 0.15) 90%,
    transparent 100%
  );
  border-radius: 50%;
  box-shadow: 0 0 14px rgba(180, 255, 220, 0.6), 0 0 28px rgba(120, 255, 200, 0.3);
  transform: translateX(0) scaleX(0);
  will-change: transform;
  animation: howlBladeEdge 1s ease-out 0.9s forwards;
}

@keyframes howlBladeEdge {
  0% { transform: translateX(0) scaleX(0); }
  15% { transform: translateX(calc(var(--blade-distance, 220px) * 0.15)) scaleX(1); }
  100% { transform: translateX(var(--blade-distance, 220px)) scaleX(0.3); }
}

/* 碎石飞溅 - 被龙卷风卷起的碎石向外弧线飞散（范围翻倍）
   通过 --debris-angle 控制方向，--debris-distance 控制距离，--debris-height 控制高度 */
.howl-flying-debris {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 30%;
  background: radial-gradient(circle at 30% 30%,
    rgba(220, 255, 240, 0.9) 0%,
    rgba(150, 230, 200, 0.5) 50%,
    rgba(80, 180, 150, 0.2) 100%
  );
  box-shadow: 0 0 5px rgba(180, 255, 220, 0.5);
  transform: translate(-50%, -50%) rotate(var(--debris-angle, 0deg)) translateX(0) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: howlDebrisFly 0.9s ease-out 0.6s forwards;
}

@keyframes howlDebrisFly {
  0% {
    transform: translate(-50%, -50%) rotate(var(--debris-angle, 0deg)) translateX(0) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--debris-angle, 0deg)) translateX(calc(var(--debris-distance, 120px) * 0.2)) translateY(calc(var(--debris-height, 70px) * -0.4)) scale(1) rotate(0deg);
  }
  50% {
    transform: translate(-50%, -50%) rotate(var(--debris-angle, 0deg)) translateX(calc(var(--debris-distance, 120px) * 0.6)) translateY(calc(var(--debris-height, 70px) * -1)) scale(0.9) rotate(120deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--debris-angle, 0deg)) translateX(var(--debris-distance, 120px)) translateY(10px) scale(0.4) rotate(360deg);
    opacity: 0;
  }
}

/* 旋转卷沙 - 被龙卷风卷着旋转飘散的沙尘（范围翻倍）
   通过 --swirl-angle 控制起始角度，--swirl-radius 控制旋转半径 */
.howl-swirl-dust {
  position: absolute;
  top: 55%;
  left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(200, 255, 230, 0.55), rgba(100, 220, 180, 0.12));
  box-shadow: 0 0 4px rgba(150, 255, 210, 0.3);
  transform: translate(-50%, -50%) rotate(var(--swirl-angle, 0deg)) translateX(0) scale(0.3);
  opacity: 0;
  will-change: transform, opacity;
  animation: howlSwirlDust 2s ease-out 0.7s forwards;
}

@keyframes howlSwirlDust {
  0% {
    transform: translate(-50%, -50%) rotate(var(--swirl-angle, 0deg)) translateX(0) scale(0.3);
    opacity: 0;
  }
  10% {
    transform: translate(-50%, -50%) rotate(var(--swirl-angle, 0deg)) translateX(calc(var(--swirl-radius, 90px) * 0.4)) scale(1);
    opacity: 0.7;
  }
  40% {
    transform: translate(-50%, -50%) rotate(calc(var(--swirl-angle, 0deg) + 240deg)) translateX(var(--swirl-radius, 90px)) scale(0.8);
    opacity: 0.5;
  }
  70% {
    transform: translate(-50%, -50%) rotate(calc(var(--swirl-angle, 0deg) + 540deg)) translateX(calc(var(--swirl-radius, 90px) * 0.8)) scale(0.5);
    opacity: 0.3;
  }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--swirl-angle, 0deg) + 720deg)) translateX(calc(var(--swirl-radius, 90px) * 0.5)) scale(0.2);
    opacity: 0;
  }
}

/* ========== 阶段四：风暴消散（3.2s ~ 3.8s） ========== */

/* 消散余波 - 最后的旋转风场，龙卷风消散后的残余气流 */
.howl-dissipate-field {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(60, 180, 130, 0.1) 30deg,
    rgba(80, 200, 150, 0.18) 60deg,
    rgba(60, 180, 130, 0.1) 90deg,
    transparent 120deg,
    rgba(60, 180, 130, 0.1) 180deg,
    rgba(80, 200, 150, 0.18) 210deg,
    rgba(60, 180, 130, 0.1) 240deg,
    transparent 270deg,
    rgba(60, 180, 130, 0.1) 330deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 20%, black 35%, transparent 85%);
  mask: radial-gradient(circle, transparent 20%, black 35%, transparent 85%);
  box-shadow: 0 0 30px rgba(80, 200, 150, 0.15);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: howlDissipateField 0.4s ease-out 2.5s forwards;
}

.howl-dissipate-field::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 60deg,
    transparent 0deg,
    rgba(100, 220, 170, 0.08) 45deg,
    rgba(120, 230, 190, 0.15) 90deg,
    rgba(100, 220, 170, 0.08) 135deg,
    transparent 180deg,
    rgba(100, 220, 170, 0.08) 225deg,
    rgba(120, 230, 190, 0.15) 270deg,
    rgba(100, 220, 170, 0.08) 315deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 30%, black 50%, transparent 80%);
  mask: radial-gradient(circle, transparent 30%, black 50%, transparent 80%);
  will-change: transform;
  animation: howlSpinCCW 1.2s linear infinite;
}

@keyframes howlDissipateField {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  20% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  60% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.4; }
  100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
}

/* 通用旋转关键帧 - 正转/反转360度，供龙卷风层和漩涡复用 */
@keyframes howlSpinCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes howlSpinCCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
}

</style>
