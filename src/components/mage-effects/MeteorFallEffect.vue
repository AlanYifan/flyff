<!--
  @file MeteorFallEffect.vue
  @generated 2026-06-29
  @description 陨石坠落 - 巨型陨石3D坠落 + 地面波动 + 火球四溅 + 光束火柱
  从 MageSkillEffect.vue 拆分而来，仅负责本特效的模板、脚本和样式
  GPU加速：所有动画仅使用 translate3d + opacity，避免重排，保证丝滑流畅
-->
<template>
          <!-- 屏幕震动容器 - 撞击时整体抖动增强冲击力 -->
          <div class="meteor-shake-wrapper">
            <!-- 3D舞台 - 透视容器，为所有3D变换提供深度视角 -->
            <div class="meteor-3d-stage">
              <!-- 天空暗化 - 陨石降临前天空变为血红暗色 -->
              <div class="meteor-sky-dim"></div>

              <!-- 地面投影 - 陨石下落时地面逐渐扩大的阴影，增强3D深度感 -->
              <div class="meteor-ground-shadow"></div>

              <!-- 地面层 - 3D倾斜地面平面（rotateX 72°），所有地面特效的容器 -->
              <div class="meteor-ground-plane">
                <!-- 警戒光圈 - 地面出现的灼热警戒标记 -->
                <div class="meteor-warning-ring"></div>

                <!-- 地面波澜 - 撞击后从落点向外扩散的地面波纹（3层错峰） -->
                <div class="meteor-ripple ripple-1"></div>
                <div class="meteor-ripple ripple-2"></div>
                <div class="meteor-ripple ripple-3"></div>

                <!-- 次级冲击波环 - 撞击后沿地面快速扩散的扁平冲击波 -->
                <div class="meteor-ground-blast"></div>

                <!-- 地面焦痕 - 撞击后的灼烧坑 -->
                <div class="meteor-crater"></div>
              </div>

              <!-- 5颗陨石 - 深色岩石本体+火焰外壳，3D从天而降，各自独立位置和延迟 -->
              <div
                v-for="i in 5"
                :key="'meteor-giant-' + i"
                class="meteor-giant"
                :style="getMeteorGiantStyle(i)"
              >
                <!-- 陨石岩体 - 不规则岩石核心，带粗糙纹理 -->
                <div class="meteor-giant-rock"></div>
                <!-- 陨石表面坑洼 - 模拟陨石坑/凹坑的暗色斑点 -->
                <div class="meteor-giant-craters"></div>
                <!-- 陨石岩浆裂缝 - 表面发光的岩浆裂纹网络 -->
                <div class="meteor-giant-cracks"></div>
                <!-- 陨石火焰外壳 - 包裹岩体的燃烧火焰层，前缘（底部）最亮 -->
                <div class="meteor-giant-fire-shell"></div>
                <!-- 陨石外焰光环 - 包裹陨石的巨大扩散光晕 -->
                <div class="meteor-giant-aura"></div>
                <!-- 陨石主拖尾 - 向上延伸的粗大火焰柱 -->
                <div class="meteor-giant-trail"></div>
                <!-- 陨石次拖尾 - 更宽更散的火焰尾迹 -->
                <div class="meteor-giant-trail-2"></div>
                <!-- 陨石外层拖尾 - 最宽最散的烟雾尾迹 -->
                <div class="meteor-giant-trail-3"></div>
              </div>

              <!-- 撞击闪光 - 陨石落地瞬间的白热全屏爆闪 -->
              <div class="meteor-impact-flash"></div>

              <!-- 径向光束 - 撞击后从落点向四周放射的God Rays光束 -->
              <div class="meteor-impact-beams"></div>

              <!-- 3D冲击波穹顶 - 从落点向上扩散的半球形冲击波 -->
              <div class="meteor-shockwave-dome"></div>

              <!-- 撞击火球核心 - 落地后中心爆发的巨大火球 -->
              <div class="meteor-impact-core"></div>

              <!-- 垂直火柱 - 撞击后从落点向上喷涌的火焰柱 -->
              <div class="meteor-fire-column"></div>

              <!-- 火球四散 - 10颗大火球从陨石四周3D向外飞射 -->
              <div
                v-for="i in 10"
                :key="'meteor-fireball-' + i"
                class="meteor-fireball"
                :style="getMeteorFireballStyle(i)"
              >
                <div class="meteor-fireball-head"></div>
                <div class="meteor-fireball-tail"></div>
              </div>

              <!-- 火星碎屑 - 向四周3D飞溅的小火焰 -->
              <div
                v-for="i in 16"
                :key="'meteor-spark-' + i"
                class="meteor-spark"
                :style="getMeteorSparkStyle(i)"
              ></div>

              <!-- 燃烧余烬 - 撞击后缓慢上浮的余烬粒子 -->
              <div
                v-for="i in 8"
                :key="'meteor-ember-' + i"
                class="meteor-ember"
                :style="getMeteorEmberStyle(i)"
              ></div>

              <!-- 余焰 - 残留的火焰光晕 -->
              <div class="meteor-afterglow"></div>
            </div>
          </div>
</template>

<script setup>
/**
 * 陨石坠落 - 巨型陨石3D坠落 + 地面波动 + 火球四溅 + 光束火柱
 * 从 MageSkillEffect.vue 拆分的独立特效组件
 */

function getMeteorGiantStyle (index) {
  // 5颗陨石各自落点偏移，呈五角散布分布，间距足够大避免重叠
  const positions = [
    { x: 0, y: 0, size: 220 },       // 中心主陨石
    { x: -220, y: -70, size: 160 },  // 左上方
    { x: 220, y: -70, size: 160 },   // 右上方
    { x: -180, y: 90, size: 140 },   // 左下方
    { x: 180, y: 90, size: 140 }     // 右下方
  ]
  const pos = positions[index - 1] || positions[0]
  const depth = -100 - (index % 3) * 60
  const delay = (index - 1) * 0.06
  return {
    '--mt-x': `${pos.x}px`,
    '--mt-y': `${pos.y}px`,
    '--mt-size': `${pos.size}px`,
    '--mt-depth': `${depth}px`,
    animationDelay: `${delay}s`
  }
}

function getMeteorFireballStyle (index) {
  const angle = (index - 1) * 36
  const distance = 180 + (index % 3) * 60
  const size = 48 + (index % 2) * 20
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const depth = depthDir * (80 + (index % 2) * 40)
  const arc = 40 + (index % 4) * 24
  const delay = 0.82 + (index % 3) * 0.03
  return {
    '--fb-angle': `${angle}deg`,
    '--fb-distance': `${distance}px`,
    '--fb-size': `${size}px`,
    '--fb-depth': `${depth}px`,
    '--fb-arc': `${arc}px`,
    animationDelay: `${delay}s`
  }
}

function getMeteorSparkStyle (index) {
  const angle = (index - 1) * 22.5 + (index % 2) * 6
  const distance = 90 + (index % 5) * 32
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 24 - (index % 3) * 16
  const depthDir = index % 3 === 0 ? 1 : index % 3 === 1 ? -1 : 0
  const tz = depthDir * (50 + (index % 2) * 30)
  const size = 8 + (index % 4) * 6
  const delay = (index % 5) * 0.02
  return {
    '--ms-tx': `${tx}px`,
    '--ms-ty': `${ty}px`,
    '--ms-tz': `${tz}px`,
    '--ms-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

function getMeteorEmberStyle (index) {
  const tx = ((index % 2 === 0 ? 1 : -1)) * (30 + (index % 4) * 20)
  const ty = -80 - (index % 3) * 40
  const size = 6 + (index % 3) * 4
  const delay = 0.82 + (index % 4) * 0.06
  return {
    '--mb-tx': `${tx}px`,
    '--mb-ty': `${ty}px`,
    '--mb-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   陨石坠落 (element_mage_e) - 5颗陨石3D从天而降 + 地面波动 + 火球四溅 + 光束火柱
   技能描述：召唤燃烧着的陨石袭击周围所有的对象
   3D技术：perspective透视 + rotateX地面倾斜 + translateZ深度分层
   GPU加速：contain隔离 + backface-visibility + will-change + translate3d
   全程仅使用 transform + opacity 实现GPU合成层加速，保证60fps
   动画总时长：2秒（严格顺序：5颗陨石先全部落地→再播放火球四散）
     ① 天空暗化 + 警戒光圈（0s ~ 0.3s）
     ② 5颗陨石3D坠落（0s ~ 0.8s，各延迟0~0.32s，持续0.5s）
     ③ 撞击爆发（0.8s ~ 1.4s，屏幕震动+全屏闪光+径向光束+3D冲击波穹顶+地面波澜3层+次级冲击波环+中心火球+垂直火柱）
     ④ 火球3D四散（0.82s ~ 1.7s，10颗大火球3D飞射+16个火星3D飞溅+8个余烬上浮）
     ⑤ 残留余焰（0.8s ~ 2.0s，焦坑+余焰渐隐）
   ================================================================ */

/* 屏幕震动容器 - 撞击瞬间整体抖动，增强毁灭性冲击力 */
.meteor-shake-wrapper {
  position: absolute;
  inset: 0;
  animation: meteorShake 0.3s ease-out 0.8s;
  will-change: transform;
}

@keyframes meteorShake {
  0%, 100% { transform: translate3d(0, 0, 0); }
  10% { transform: translate3d(-6px, 4px, 0); }
  20% { transform: translate3d(5px, -3px, 0); }
  30% { transform: translate3d(-4px, -5px, 0); }
  40% { transform: translate3d(3px, 6px, 0); }
  50% { transform: translate3d(-3px, 2px, 0); }
  60% { transform: translate3d(2px, -2px, 0); }
  70% { transform: translate3d(-1px, 1px, 0); }
}

/* 3D舞台 - 透视容器，为所有3D变换提供深度视角 */
.meteor-3d-stage {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  perspective-origin: 50% 45%;
  transform-style: preserve-3d;
  contain: layout style;
}

/* ---------- 阶段①：天空暗化 + 警戒光圈 ---------- */

/* 天空暗化 - 血红暗色笼罩，营造陨石降临的压迫感 */
.meteor-sky-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 20%,
    rgba(120, 20, 0, 0.8) 0%,
    rgba(60, 10, 0, 0.55) 35%,
    rgba(20, 5, 0, 0.3) 70%,
    transparent 100%
  );
  animation: meteorSkyDim 1.5s ease-out forwards;
  will-change: opacity;
}

@keyframes meteorSkyDim {
  0% { opacity: 0; }
  10% { opacity: 1; }
  50% { opacity: 0.85; }
  100% { opacity: 0; }
}

/* 地面投影 - 陨石下落过程中地面上逐渐变大的暗影，增强3D空间深度感 */
.meteor-ground-shadow {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 320px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(
    ellipse,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(20, 5, 0, 0.3) 50%,
    transparent 80%
  );
  transform: translate(-50%, -50%) rotateX(72deg) scale(0.1);
  animation: meteorGroundShadow 0.7s ease-in forwards;
  will-change: transform, opacity;
  filter: blur(8px);
}

@keyframes meteorGroundShadow {
  0% {
    transform: translate(-50%, -50%) rotateX(72deg) scale(0.1);
    opacity: 0;
  }
  20% {
    opacity: 0.5;
  }
  85% {
    transform: translate(-50%, -50%) rotateX(72deg) scale(1);
    opacity: 0.7;
  }
  100% {
    transform: translate(-50%, -50%) rotateX(72deg) scale(1.2);
    opacity: 0;
  }
}

/* 地面层 - 3D倾斜平面，所有地面特效的容器 */
.meteor-ground-plane {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%) rotateX(72deg);
  transform-style: preserve-3d;
}

/* 警戒光圈 - 地面出现的灼热圆环标记，预示撞击位置 */
.meteor-warning-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  border: 4px solid rgba(255, 100, 0, 0.85);
  box-shadow:
    0 0 40px rgba(255, 80, 0, 0.7),
    inset 0 0 35px rgba(255, 120, 0, 0.5);
  transform: translate(-50%, -50%) scale(0.3);
  animation: meteorWarningRing 0.3s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes meteorWarningRing {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.8);
    opacity: 0;
  }
}

/* ---------- 阶段②：巨型陨石3D坠落 ---------- */

/* 陨石容器 - 5颗陨石各自从天而降，不旋转，仅深度透视+缩放+位置偏移 */
.meteor-giant {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--mt-size, 280px);
  height: var(--mt-size, 280px);
  transform: translate3d(-50%, -50%, 0);
  animation: meteorGiantFall3D 0.5s cubic-bezier(0.35, 0, 0.85, 0.4) forwards;
  will-change: transform, opacity;
  opacity: 0;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

@keyframes meteorGiantFall3D {
  0% {
    transform: translate3d(calc(-50% + var(--mt-x, 0px)), calc(-50% + var(--mt-y, 0px)), var(--mt-depth, -200px)) translateY(-500px) scale(0.35);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  50% {
    transform: translate3d(calc(-50% + var(--mt-x, 0px)), calc(-50% + var(--mt-y, 0px)), calc(var(--mt-depth, -200px) * 0.4)) translateY(-250px) scale(0.7);
  }
  85% {
    transform: translate3d(calc(-50% + var(--mt-x, 0px)), calc(-50% + var(--mt-y, 0px)), 0) translateY(0) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translate3d(calc(-50% + var(--mt-x, 0px)), calc(-50% + var(--mt-y, 0px)), 0) translateY(0) scale(1.1);
    opacity: 0;
  }
}

/* 陨石岩体 - 不规则岩石核心，多层级粗糙纹理模拟真实陨石表面 */
.meteor-giant-rock {
  position: absolute;
  inset: 0;
  border-radius: 48% 52% 38% 62% / 55% 42% 58% 45%;
  background:
    /* 大型隆起 — 模拟岩石表面高低不平的块状结构 */
    radial-gradient(ellipse 60% 45% at 28% 30%, rgba(75, 62, 52, 0.9) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 70% 60%, rgba(60, 48, 40, 0.85) 0%, transparent 45%),
    /* 中型凹凸纹理 */
    radial-gradient(circle at 50% 20%, rgba(45, 35, 28, 0.6) 0%, transparent 18%),
    radial-gradient(circle at 20% 55%, rgba(55, 42, 35, 0.5) 0%, transparent 22%),
    radial-gradient(circle at 80% 35%, rgba(40, 30, 25, 0.55) 0%, transparent 15%),
    /* 基础岩石底色 — 从暗灰到近黑，带轻微铁锈红调 */
    radial-gradient(circle at 38% 38%,
      rgba(85, 68, 55, 1) 0%,
      rgba(60, 45, 35, 1) 18%,
      rgba(42, 30, 22, 1) 38%,
      rgba(28, 18, 12, 1) 60%,
      rgba(18, 10, 6, 1) 82%,
      rgba(8, 4, 2, 1) 100%
    );
  box-shadow:
    /* 右下深陷阴影 — 立体感 */
    inset -25px -25px 60px rgba(0, 0, 0, 0.85),
    /* 左上微弱高光 — 火光反射 */
    inset 12px 12px 30px rgba(100, 75, 55, 0.15),
    /* 外缘暗化 */
    0 0 0 2px rgba(10, 5, 0, 0.5);
}

/* 陨石表面坑洼 — 模拟真实陨石的高密度撞击坑，每个坑带凹陷阴影 */
.meteor-giant-craters {
  position: absolute;
  inset: 3%;
  border-radius: 48% 52% 38% 62% / 55% 42% 58% 45%;
  background:
    /* 大坑 — 带内凹深色渐变模拟深度 */
    radial-gradient(circle at 22% 28%, rgba(5, 3, 1, 0.9) 0%, rgba(15, 8, 4, 0.6) 4%, transparent 9%),
    radial-gradient(circle at 68% 18%, rgba(5, 3, 1, 0.85) 0%, rgba(12, 6, 3, 0.5) 3%, transparent 7%),
    radial-gradient(circle at 78% 52%, rgba(5, 3, 1, 0.9) 0%, rgba(15, 8, 4, 0.6) 4%, transparent 8%),
    radial-gradient(circle at 32% 68%, rgba(5, 3, 1, 0.85) 0%, rgba(12, 6, 3, 0.5) 3%, transparent 8%),
    /* 中坑 */
    radial-gradient(circle at 55% 42%, rgba(10, 5, 2, 0.7) 0%, transparent 5%),
    radial-gradient(circle at 42% 82%, rgba(10, 5, 2, 0.7) 0%, transparent 5%),
    radial-gradient(circle at 85% 78%, rgba(10, 5, 2, 0.6) 0%, transparent 4%),
    /* 小坑 — 高密度细小撞击点 */
    radial-gradient(circle at 15% 50%, rgba(8, 4, 2, 0.6) 0%, transparent 3%),
    radial-gradient(circle at 60% 65%, rgba(8, 4, 2, 0.5) 0%, transparent 3%),
    radial-gradient(circle at 48% 15%, rgba(8, 4, 2, 0.5) 0%, transparent 2.5%),
    radial-gradient(circle at 90% 40%, rgba(8, 4, 2, 0.5) 0%, transparent 3%),
    radial-gradient(circle at 25% 88%, rgba(8, 4, 2, 0.4) 0%, transparent 2.5%);
  opacity: 0.9;
}

/* 陨石岩浆裂缝 — 表面发光的岩浆裂纹网络，模拟陨石内部熔岩渗出 */
.meteor-giant-cracks {
  position: absolute;
  inset: 10%;
  border-radius: 48% 52% 38% 62% / 55% 42% 58% 45%;
  background:
    /* 主裂缝 — 粗大明亮 */
    linear-gradient(35deg, transparent 35%, rgba(255, 200, 60, 0.7) 45%, rgba(255, 120, 0, 0.5) 50%, transparent 58%),
    /* 分支裂缝1 */
    linear-gradient(-25deg, transparent 30%, rgba(255, 160, 20, 0.55) 42%, transparent 50%),
    /* 分支裂缝2 */
    linear-gradient(75deg, transparent 45%, rgba(255, 140, 0, 0.5) 55%, transparent 65%),
    /* 细裂纹 */
    linear-gradient(10deg, transparent 52%, rgba(255, 100, 0, 0.4) 60%, transparent 68%),
    linear-gradient(-60deg, transparent 40%, rgba(255, 80, 0, 0.3) 48%, transparent 55%);
  filter: blur(1.5px);
  opacity: 0.9;
  animation: meteorCracksPulse 0.4s ease-in-out infinite alternate;
}

@keyframes meteorCracksPulse {
  0% { opacity: 0.6; filter: blur(1.5px); }
  100% { opacity: 1; filter: blur(2px); }
}

/* 陨石火焰外壳 — 包裹不规则岩体的燃烧火焰层，底部（前缘）最亮模拟大气层摩擦 */
.meteor-giant-fire-shell {
  position: absolute;
  inset: -10%;
  border-radius: 48% 52% 38% 62% / 55% 42% 58% 45%;
  background:
    /* 底部前缘 — 白热烧蚀区 */
    radial-gradient(ellipse 70% 50% at 50% 82%,
      rgba(255, 250, 220, 0.95) 0%,
      rgba(255, 200, 60, 0.8) 12%,
      rgba(255, 110, 0, 0.55) 28%,
      transparent 48%
    ),
    /* 侧面火焰包裹 */
    radial-gradient(ellipse 55% 65% at 50% 50%,
      rgba(255, 140, 20, 0.35) 0%,
      rgba(255, 70, 0, 0.18) 35%,
      transparent 70%
    );
  filter: blur(5px);
  animation: meteorFireShellPulse 0.3s ease-in-out infinite alternate;
}

@keyframes meteorFireShellPulse {
  0% { opacity: 0.75; transform: scale(0.97); }
  100% { opacity: 1; transform: scale(1.03); }
}

/* 陨石外焰光环 - 包裹陨石的巨大扩散光晕 */
.meteor-giant-aura {
  position: absolute;
  inset: -50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 130, 0, 0.35) 0%,
    rgba(255, 60, 0, 0.18) 35%,
    transparent 70%
  );
  animation: meteorAuraPulse 0.3s ease-in-out infinite alternate;
}

@keyframes meteorAuraPulse {
  0% { opacity: 0.7; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1.05); }
}

/* 陨石主拖尾 - 向上延伸的粗大火焰柱 */
.meteor-giant-trail {
  position: absolute;
  bottom: 70%;
  left: 50%;
  width: 90px;
  height: 440px;
  transform: translateX(-50%);
  background: linear-gradient(
    to top,
    rgba(255, 200, 60, 0.9) 0%,
    rgba(255, 130, 0, 0.65) 25%,
    rgba(255, 80, 0, 0.35) 55%,
    rgba(180, 30, 0, 0.15) 80%,
    transparent 100%
  );
  border-radius: 50% 50% 30% 30%;
  filter: blur(8px);
}

/* 陨石次拖尾 - 更宽更散的火焰尾迹 */
.meteor-giant-trail-2 {
  position: absolute;
  bottom: 60%;
  left: 50%;
  width: 170px;
  height: 320px;
  transform: translateX(-50%);
  background: linear-gradient(
    to top,
    rgba(255, 150, 30, 0.45) 0%,
    rgba(255, 80, 0, 0.22) 40%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(15px);
}

/* 陨石外层拖尾 - 最宽最散的烟雾尾迹 */
.meteor-giant-trail-3 {
  position: absolute;
  bottom: 50%;
  left: 50%;
  width: 260px;
  height: 240px;
  transform: translateX(-50%);
  background: linear-gradient(
    to top,
    rgba(200, 100, 20, 0.25) 0%,
    rgba(150, 50, 0, 0.12) 50%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(20px);
}

/* ---------- 阶段③：撞击爆发 ---------- */

/* 撞击闪光 - 陨石落地瞬间的白热全屏爆闪 */
.meteor-impact-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(255, 230, 160, 0.7) 12%,
    rgba(255, 150, 50, 0.35) 35%,
    transparent 65%
  );
  opacity: 0;
  animation: meteorImpactFlash 0.4s ease-out 0.8s forwards;
  will-change: opacity;
}

/* 径向光束 - 撞击后从落点向四周放射的God Rays光束 */
.meteor-impact-beams {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 600px;
  height: 600px;
  transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(0);
  background: conic-gradient(
    from 0deg,
    transparent 0deg, rgba(255, 220, 150, 0.15) 5deg, transparent 10deg,
    transparent 30deg, rgba(255, 200, 100, 0.12) 35deg, transparent 40deg,
    transparent 60deg, rgba(255, 220, 150, 0.15) 65deg, transparent 70deg,
    transparent 90deg, rgba(255, 200, 100, 0.12) 95deg, transparent 100deg,
    transparent 120deg, rgba(255, 220, 150, 0.15) 125deg, transparent 130deg,
    transparent 150deg, rgba(255, 200, 100, 0.12) 155deg, transparent 160deg,
    transparent 180deg, rgba(255, 220, 150, 0.15) 185deg, transparent 190deg,
    transparent 210deg, rgba(255, 200, 100, 0.12) 215deg, transparent 220deg,
    transparent 240deg, rgba(255, 220, 150, 0.15) 245deg, transparent 250deg,
    transparent 270deg, rgba(255, 200, 100, 0.12) 275deg, transparent 280deg,
    transparent 300deg, rgba(255, 220, 150, 0.15) 305deg, transparent 310deg,
    transparent 330deg, rgba(255, 200, 100, 0.12) 335deg, transparent 360deg
  );
  border-radius: 50%;
  opacity: 0;
  animation: meteorImpactBeams 0.5s ease-out 0.8s forwards;
  will-change: transform, opacity;
  mask: radial-gradient(circle, transparent 10%, black 30%, transparent 70%);
  -webkit-mask: radial-gradient(circle, transparent 10%, black 30%, transparent 70%);
}

@keyframes meteorImpactBeams {
  0% {
    transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -50%, 0) rotate(15deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) rotate(60deg) scale(1.5);
    opacity: 0;
  }
}

@keyframes meteorImpactFlash {
  0% { opacity: 0; }
  8% { opacity: 1; }
  35% { opacity: 0.6; }
  100% { opacity: 0; }
}

/* 3D冲击波穹顶 - 从落点向上扩散的半球形冲击波 */
.meteor-shockwave-dome {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  border: 6px solid rgba(255, 180, 60, 0.7);
  box-shadow:
    0 0 60px rgba(255, 120, 0, 0.5),
    inset 0 0 40px rgba(255, 200, 100, 0.3);
  transform: translate3d(-50%, -50%, 0) rotateX(72deg) scale(0);
  animation: meteorShockwaveDome 0.5s cubic-bezier(0.2, 0.6, 0.3, 1) 0.8s forwards;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

/* 垂直火柱 - 撞击后从落点向上喷涌的火焰柱 */
.meteor-fire-column {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 350px;
  transform: translate3d(-50%, -100%, 0) scaleY(0);
  transform-origin: bottom center;
  background: linear-gradient(
    to top,
    rgba(255, 255, 240, 0.95) 0%,
    rgba(255, 200, 60, 0.85) 15%,
    rgba(255, 120, 0, 0.65) 35%,
    rgba(255, 60, 0, 0.35) 60%,
    rgba(180, 30, 0, 0.15) 85%,
    transparent 100%
  );
  border-radius: 50% 50% 30% 30%;
  opacity: 0;
  animation: meteorFireColumn 0.6s cubic-bezier(0.15, 0.7, 0.3, 1) 0.8s forwards;
  will-change: transform, opacity;
  box-shadow:
    0 0 40px rgba(255, 120, 0, 0.6),
    0 0 80px rgba(255, 60, 0, 0.3);
}

@keyframes meteorFireColumn {
  0% {
    transform: translate3d(-50%, -100%, 0) scaleY(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(-50%, -100%, 0) scaleY(0.8);
    opacity: 1;
  }
  60% {
    transform: translate3d(-50%, -100%, 0) scaleY(1.2);
    opacity: 0.7;
  }
  100% {
    transform: translate3d(-50%, -100%, 0) scaleY(0.3);
    opacity: 0;
  }
}

@keyframes meteorShockwaveDome {
  0% {
    transform: translate(-50%, -50%) rotateX(72deg) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate(-50%, -50%) rotateX(72deg) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotateX(72deg) scale(4);
    opacity: 0;
  }
}

/* 地面波澜 - 从撞击点向外扩散的地面波纹（3层错峰） */
.meteor-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(255, 160, 40, 0.85);
  box-shadow:
    0 0 25px rgba(255, 100, 0, 0.6),
    inset 0 0 20px rgba(255, 200, 100, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

/* 次级冲击波环 - 撞击后沿地面快速扩散的扁平冲击波 */
.meteor-ground-blast {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 40%,
    rgba(255, 150, 30, 0.4) 50%,
    rgba(255, 80, 0, 0.2) 65%,
    transparent 80%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: meteorGroundBlast 0.4s ease-out 0.82s forwards;
  will-change: transform, opacity;
}

@keyframes meteorGroundBlast {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(10);
    opacity: 0;
  }
}

.meteor-ripple.ripple-1 {
  animation: meteorRipple 0.5s ease-out 0.8s forwards;
}

.meteor-ripple.ripple-2 {
  border-color: rgba(255, 110, 0, 0.7);
  animation: meteorRipple 0.55s ease-out 0.84s forwards;
}

.meteor-ripple.ripple-3 {
  border-color: rgba(200, 60, 0, 0.5);
  animation: meteorRipple 0.6s ease-out 0.88s forwards;
}

@keyframes meteorRipple {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(16);
    opacity: 0;
  }
}

/* 撞击火球核心 - 落地后中心爆发的巨大火球 */
.meteor-impact-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 240, 1) 0%,
    rgba(255, 200, 80, 0.9) 20%,
    rgba(255, 100, 0, 0.7) 45%,
    rgba(200, 40, 0, 0.4) 70%,
    transparent 100%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: meteorImpactCore 0.6s cubic-bezier(0.15, 0.6, 0.3, 1) 0.8s forwards;
  will-change: transform, opacity;
  filter: blur(3px);
}

@keyframes meteorImpactCore {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  12% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0.85;
  }
  100% {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0;
  }
}

/* ---------- 阶段④：火球3D四散 ---------- */

/* 火球容器 - 从撞击中心向指定角度3D飞射，带Z轴深度和抛物线弧度 */
.meteor-fireball {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--fb-size, 52px);
  height: var(--fb-size, 52px);
  transform: translate3d(-50%, -50%, 0) rotate(var(--fb-angle, 0deg));
  animation: meteorFireballScatter3D 0.7s cubic-bezier(0.2, 0.5, 0.4, 1) 0.82s forwards;
  will-change: transform, opacity;
  opacity: 0;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

@keyframes meteorFireballScatter3D {
  0% {
    transform: translate(-50%, -50%) rotate(var(--fb-angle, 0deg)) translateX(0) translateZ(0) translateY(0) scale(0.5);
    opacity: 0;
  }
  10% {
    transform: translate(-50%, -50%) rotate(var(--fb-angle, 0deg)) translateX(15px) translateZ(var(--fb-depth, 0px)) translateY(calc(var(--fb-arc, 0px) * -0.5)) scale(1.3);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) rotate(var(--fb-angle, 0deg)) translateX(calc(var(--fb-distance, 100px) * 0.6)) translateZ(var(--fb-depth, 0px)) translateY(calc(var(--fb-arc, 0px) * -1)) scale(1.1);
    opacity: 0.95;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--fb-angle, 0deg)) translateX(var(--fb-distance, 100px)) translateZ(var(--fb-depth, 0px)) translateY(0) scale(0.3);
    opacity: 0;
  }
}

/* 火球头部 - 明亮燃烧的球体 */
.meteor-fireball-head {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 40% 40%,
    rgba(255, 255, 220, 0.98) 0%,
    rgba(255, 180, 40, 0.9) 30%,
    rgba(255, 90, 0, 0.7) 60%,
    rgba(180, 30, 0, 0.4) 100%
  );
  box-shadow:
    0 0 24px rgba(255, 120, 0, 0.8),
    0 0 48px rgba(255, 60, 0, 0.4);
}

/* 火球拖尾 - 朝向中心的火焰尾迹 */
.meteor-fireball-tail {
  position: absolute;
  top: 50%;
  right: 80%;
  width: 70px;
  height: 60%;
  transform: translateY(-50%);
  background: linear-gradient(
    to left,
    rgba(255, 160, 30, 0.65) 0%,
    rgba(255, 80, 0, 0.3) 50%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(5px);
}

/* 火星碎屑 - 向四周3D飞溅的小火焰 */
.meteor-spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--ms-size, 6px);
  height: var(--ms-size, 6px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 180, 0.95) 0%,
    rgba(255, 140, 0, 0.7) 45%,
    rgba(255, 60, 0, 0.3) 100%
  );
  box-shadow: 0 0 6px rgba(255, 100, 0, 0.5);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: meteorSparkFly3D 0.6s ease-out 0.82s forwards;
  will-change: transform, opacity;
}

/* 燃烧余烬 - 撞击后缓慢上浮的余烬粒子 */
.meteor-ember {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--mb-size, 8px);
  height: var(--mb-size, 8px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 220, 100, 0.9) 0%,
    rgba(255, 120, 0, 0.6) 50%,
    transparent 100%
  );
  box-shadow: 0 0 8px rgba(255, 100, 0, 0.4);
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: meteorEmberFloat 1s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes meteorEmberFloat {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate3d(calc(-50% + var(--mb-tx, 0px) * 0.2), calc(-50% + var(--mb-ty, 0px) * 0.2), 0) scale(1.2);
    opacity: 1;
  }
  80% {
    opacity: 0.6;
  }
  100% {
    transform: translate3d(calc(-50% + var(--mb-tx, 0px)), calc(-50% + var(--mb-ty, 0px)), 0) scale(0.2);
    opacity: 0;
  }
}

@keyframes meteorSparkFly3D {
  0% {
    transform: translate(-50%, -50%) translateZ(0) scale(0);
    opacity: 0;
  }
  12% {
    transform: translate(-50%, -50%) translateZ(0) scale(1.4);
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% + var(--ms-tx, 0px)), calc(-50% + var(--ms-ty, 0px))) translateZ(var(--ms-tz, 0px)) scale(0.2);
    opacity: 0;
  }
}

/* ---------- 阶段⑤：残留余焰 ---------- */

/* 地面焦坑 - 撞击后的灼烧坑洞（位于3D地面平面上） */
.meteor-crater {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(80, 30, 0, 0.75) 0%,
    rgba(50, 15, 0, 0.5) 40%,
    rgba(30, 8, 0, 0.3) 65%,
    transparent 85%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: meteorCrater 1.1s ease-out 0.8s forwards;
  will-change: transform, opacity;
}

@keyframes meteorCrater {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  18% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 0.85;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 0;
  }
}

/* 余焰 - 残留的火焰光晕，缓慢渐隐 */
.meteor-afterglow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 100, 0, 0.25) 0%,
    rgba(255, 50, 0, 0.1) 40%,
    transparent 70%
  );
  transform: translate3d(-50%, -50%, 0) scale(0);
  animation: meteorAfterglow 1s ease-out 1s forwards;
  will-change: transform, opacity;
}

@keyframes meteorAfterglow {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  25% {
    transform: translate(-50%, -50%) scale(1.4);
    opacity: 0.7;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.2);
    opacity: 0;
  }
}

</style>
