<!--
  @file MageSkillShowcase.vue
  @generated 2026-06-26
  @description 魔导师一转技能特效展示页面
  展示「激流冲击」和「电闪雷鸣」各5种不同样式的GPU加速动画特效
  激流冲击 - 技能描述：形成强力的水柱攻击敌人
  电闪雷鸣 - 技能描述：唤起闪电强力攻击敌人
  所有动画仅使用 transform + opacity 实现GPU加速，保证60fps丝滑体验
-->
<template>
  <div class="mage-skill-showcase">
    <header class="showcase-header">
      <h1>魔导师一转技能特效展示</h1>
      <p class="subtitle">激流冲击 · 电闪雷鸣 — 各5种样式，GPU加速</p>
      <button class="back-btn" @click="goBack">返回主页</button>
    </header>

    <!-- ======================== 激流冲击 ======================== -->
    <section class="skill-section">
      <h2 class="skill-title water-title">💧 激流冲击</h2>
      <p class="skill-desc">「形成强力的水柱攻击敌人」</p>
      <div class="effects-grid">
        <!-- 样式1：水柱冲天 -->
        <div class="effect-card">
          <div class="effect-preview">
            <div class="monster-placeholder">
              <div class="effect-fx fx-water-1">
                <div class="w1-ground"></div>
                <div class="w1-column">
                  <div class="w1-column-core"></div>
                  <div class="w1-column-foam"></div>
                </div>
                <div class="w1-droplets">
                  <span v-for="i in 10" :key="i" class="w1-drop" :style="getDropStyle(i, 'w1')"></span>
                </div>
              </div>
              <span class="monster-icon">👹</span>
            </div>
          </div>
          <div class="effect-info">
            <h3>水柱冲天</h3>
            <p>从地面喷涌而上的强力水柱直击目标</p>
          </div>
        </div>

        <!-- 样式2：水幕冲天 -->
        <div class="effect-card">
          <div class="effect-preview">
            <div class="monster-placeholder">
              <div class="effect-fx fx-water-2">
                <div class="w2-sheet"></div>
                <div class="w2-foam"></div>
                <div class="w2-streaks">
                  <span v-for="i in 6" :key="i" class="w2-streak" :style="getW2StreakStyle(i)"></span>
                </div>
                <div class="w2-spray">
                  <span v-for="i in 8" :key="i" class="w2-drop" :style="getW2SprayStyle(i)"></span>
                </div>
              </div>
              <span class="monster-icon">👾</span>
            </div>
          </div>
          <div class="effect-info">
            <h3>水幕冲天</h3>
            <p>宽阔水幕从底部冲天而起泡沫翻涌水珠飞溅</p>
          </div>
        </div>

        <!-- 样式3：水幕叠浪 -->
        <div class="effect-card">
          <div class="effect-preview">
            <div class="monster-placeholder">
              <div class="effect-fx fx-water-3">
                <div class="w3-sheet-back"></div>
                <div class="w3-sheet-mid"></div>
                <div class="w3-sheet-front"></div>
                <div class="w3-foam-crest"></div>
                <div class="w3-impact-ring"></div>
                <div class="w3-droplets">
                  <span v-for="i in 10" :key="i" class="w3-drop" :style="getW3DropStyle(i)"></span>
                </div>
              </div>
              <span class="monster-icon">🧟</span>
            </div>
          </div>
          <div class="effect-info">
            <h3>水幕叠浪</h3>
            <p>多层水幕叠加上升波浪翻涌水珠四溅</p>
          </div>
        </div>

        <!-- 样式4：水幕螺旋 -->
        <div class="effect-card">
          <div class="effect-preview">
            <div class="monster-placeholder">
              <div class="effect-fx fx-water-4">
                <div class="w4-sheet"></div>
                <div class="w4-twist-a"></div>
                <div class="w4-twist-b"></div>
                <div class="w4-foam"></div>
                <div class="w4-drops">
                  <span v-for="i in 8" :key="i" class="w4-drop" :style="getW4DropStyle(i)"></span>
                </div>
              </div>
              <span class="monster-icon">👻</span>
            </div>
          </div>
          <div class="effect-info">
            <h3>水幕螺旋</h3>
            <p>水幕螺旋扭曲上升双向水带缠绕翻腾</p>
          </div>
        </div>

        <!-- 样式5：水幕冰封 -->
        <div class="effect-card">
          <div class="effect-preview">
            <div class="monster-placeholder">
              <div class="effect-fx fx-water-5">
                <div class="w5-sheet-water"></div>
                <div class="w5-sheet-ice"></div>
                <div class="w5-ice-edge"></div>
                <div class="w5-frost-mist"></div>
                <div class="w5-snow">
                  <span v-for="i in 8" :key="i" class="w5-flake" :style="getW5SnowStyle(i)"></span>
                </div>
              </div>
              <span class="monster-icon">🦠</span>
            </div>
          </div>
          <div class="effect-info">
            <h3>水幕冰封</h3>
            <p>水幕冲天上升渐变为冰冰晶蔓延霜雾弥漫</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================== 电闪雷鸣 ======================== -->
    <section class="skill-section">
      <h2 class="skill-title thunder-title">⚡ 电闪雷鸣</h2>
      <p class="skill-desc">「唤起闪电强力攻击敌人」</p>
      <div class="effects-grid">
        <!-- 样式1：天降神雷 -->
        <div class="effect-card">
          <div class="effect-preview">
            <div class="monster-placeholder">
              <div class="effect-fx fx-thunder-1">
                <div class="t1-flash"></div>
                <div class="t1-bolt">
                  <div class="t1-bolt-glow"></div>
                  <div class="t1-bolt-main"></div>
                  <div class="t1-bolt-branch ba"></div>
                  <div class="t1-bolt-branch bb"></div>
                  <div class="t1-bolt-branch bc"></div>
                </div>
                <div class="t1-impact"></div>
                <div class="t1-shockwave"></div>
                <div class="t1-sparks">
                  <span v-for="i in 12" :key="i" class="t1-spark" :style="getSparkStyle(i, 't1')"></span>
                </div>
              </div>
              <span class="monster-icon">👹</span>
            </div>
          </div>
          <div class="effect-info">
            <h3>天降神雷</h3>
            <p>单道粗壮闪电从天而降直劈目标</p>
          </div>
        </div>

        <!-- 样式2：雷网连锁 -->
        <div class="effect-card">
          <div class="effect-preview">
            <div class="monster-placeholder">
              <div class="effect-fx fx-thunder-2">
                <div class="t2-chain">
                  <span v-for="i in 6" :key="i" class="t2-bolt" :style="getChainStyle(i)"></span>
                </div>
                <div class="t2-nodes">
                  <span v-for="i in 6" :key="i" class="t2-node" :style="getNodeStyle(i)"></span>
                </div>
                <div class="t2-flash"></div>
              </div>
              <span class="monster-icon">👾</span>
            </div>
          </div>
          <div class="effect-info">
            <h3>雷网连锁</h3>
            <p>多道闪电形成电网连锁电击目标</p>
          </div>
        </div>

        <!-- 样式3：雷暴风暴 -->
        <div class="effect-card">
          <div class="effect-preview">
            <div class="monster-placeholder">
              <div class="effect-fx fx-thunder-3">
                <div class="t3-storm">
                  <div class="t3-ring ring-a"></div>
                  <div class="t3-ring ring-b"></div>
                </div>
                <div class="t3-bolts">
                  <span v-for="i in 5" :key="i" class="t3-bolt" :style="getStormBoltStyle(i)"></span>
                </div>
                <div class="t3-eye"></div>
              </div>
              <span class="monster-icon">🧟</span>
            </div>
          </div>
          <div class="effect-info">
            <h3>雷暴风暴</h3>
            <p>闪电伴随风暴旋转绞杀目标</p>
          </div>
        </div>

        <!-- 样式4：紫电狂袭 -->
        <div class="effect-card">
          <div class="effect-preview">
            <div class="monster-placeholder">
              <div class="effect-fx fx-thunder-4">
                <div class="t4-bolts">
                  <span v-for="i in 4" :key="i" class="t4-bolt" :style="getPurpleBoltStyle(i)"></span>
                </div>
                <div class="t4-aura"></div>
                <div class="t4-arcs">
                  <span v-for="i in 8" :key="i" class="t4-arc" :style="getArcStyle(i)"></span>
                </div>
              </div>
              <span class="monster-icon">👻</span>
            </div>
          </div>
          <div class="effect-info">
            <h3>紫电狂袭</h3>
            <p>紫色闪电连续劈落电弧四散</p>
          </div>
        </div>

        <!-- 样式5：雷球爆破 -->
        <div class="effect-card">
          <div class="effect-preview">
            <div class="monster-placeholder">
              <div class="effect-fx fx-thunder-5">
                <div class="t5-orb">
                  <div class="t5-orb-core"></div>
                  <div class="t5-orb-ring ra"></div>
                  <div class="t5-orb-ring rb"></div>
                </div>
                <div class="t5-burst">
                  <span v-for="i in 12" :key="i" class="t5-ray" :style="getRayStyle(i)"></span>
                </div>
                <div class="t5-flash"></div>
              </div>
              <span class="monster-icon">🦠</span>
            </div>
          </div>
          <div class="effect-info">
            <h3>雷球爆破</h3>
            <p>闪电凝聚成球后猛烈爆裂释放</p>
          </div>
        </div>
      </div>
    </section>

    <footer class="showcase-footer">
      <p>所有效果实时循环展示中 · GPU加速 · 60fps</p>
    </footer>
  </div>
</template>

<script setup>
/**
 * 魔导师一转技能特效展示页面
 * 展示激流冲击(5种)和电闪雷鸣(5种)的CSS动画特效
 * 所有动画仅使用 transform + opacity 保证GPU加速与丝滑流畅
 */
import { useRouter } from 'vue-router'

const router = useRouter()

/**
 * 返回主页
 * @returns {void}
 */
function goBack () {
  router.push('/main')
}

/**
 * 生成水滴飞散样式（水柱冲天/潮汐爆发共用）
 * @param {number} index - 粒子序号
 * @param {string} prefix - CSS变量前缀
 * @returns {Object} CSS样式对象
 */
function getDropStyle (index, prefix) {
  const angle = (index - 1) * 36 + (index % 2) * 8
  const distance = 30 + (index % 4) * 10
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance - 10
  const size = 4 + (index % 3) * 2
  const delay = (index % 5) * 0.1
  return {
    [`--${prefix}-tx`]: `${tx}px`,
    [`--${prefix}-ty`]: `${ty}px`,
    [`--${prefix}-size`]: `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成水幕冲天 - 水流条纹样式
 * @param {number} index - 序号
 * @returns {Object} CSS样式对象
 */
function getW2StreakStyle (index) {
  const left = 15 + (index - 1) * 14
  const delay = (index - 1) * 0.15
  const duration = 1.2 + (index % 3) * 0.2
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

/**
 * 生成水幕冲天 - 飞溅水珠样式
 * @param {number} index - 序号
 * @returns {Object} CSS样式对象
 */
function getW2SprayStyle (index) {
  const side = index % 2 === 0 ? 1 : -1
  const tx = side * (20 + (index % 4) * 8)
  const ty = -40 - (index % 3) * 15
  const size = 4 + (index % 3) * 2
  const delay = (index % 5) * 0.12
  return {
    '--w2-drop-tx': `${tx}px`,
    '--w2-drop-ty': `${ty}px`,
    '--w2-drop-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成水幕叠浪 - 水珠飞散样式
 * @param {number} index - 序号
 * @returns {Object} CSS样式对象
 */
function getW3DropStyle (index) {
  const angle = -90 + (index - 5) * 20
  const distance = 30 + (index % 4) * 8
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance
  const size = 4 + (index % 3) * 2
  const delay = (index % 5) * 0.1
  return {
    '--w3-tx': `${tx}px`,
    '--w3-ty': `${ty}px`,
    '--w3-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成水幕螺旋 - 螺旋水珠样式
 * @param {number} index - 序号
 * @returns {Object} CSS样式对象
 */
function getW4DropStyle (index) {
  const side = index % 2 === 0 ? 1 : -1
  const tx = side * (15 + (index % 3) * 10)
  const ty = -30 - (index % 4) * 12
  const size = 4 + (index % 3) * 2
  const delay = (index % 4) * 0.15
  return {
    '--w4-tx': `${tx}px`,
    '--w4-ty': `${ty}px`,
    '--w4-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成水幕冰封 - 雪花飘落样式
 * @param {number} index - 序号
 * @returns {Object} CSS样式对象
 */
function getW5SnowStyle (index) {
  const left = 10 + (index % 4) * 25
  const delay = (index % 4) * 0.6
  const size = 3 + (index % 3) * 2
  return {
    left: `${left}%`,
    '--w5-snow-size': `${size}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成电火花飞溅样式
 * @param {number} index - 序号
 * @param {string} prefix - CSS变量前缀
 * @returns {Object} CSS样式对象
 */
function getSparkStyle (index, prefix) {
  const angle = (index - 1) * 45
  const distance = 25 + (index % 3) * 12
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance
  const delay = (index % 4) * 0.08
  return {
    [`--${prefix}-tx`]: `${tx}px`,
    [`--${prefix}-ty`]: `${ty}px`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成连锁闪电样式
 * @param {number} index - 序号
 * @returns {Object} CSS样式对象
 */
function getChainStyle (index) {
  const angle = (index - 1) * 60
  const delay = (index - 1) * 0.1
  return {
    '--t2-angle': `${angle}deg`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成雷网节点样式
 * @param {number} index - 序号
 * @returns {Object} CSS样式对象
 */
function getNodeStyle (index) {
  const angle = (index - 1) * 60
  const delay = (index - 1) * 0.1
  return {
    '--t2-angle': `${angle}deg`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成雷暴闪电样式
 * @param {number} index - 序号
 * @returns {Object} CSS样式对象
 */
function getStormBoltStyle (index) {
  const angle = (index - 1) * 72
  const delay = (index - 1) * 0.12
  return {
    '--t3-angle': `${angle}deg`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成紫色闪电样式
 * @param {number} index - 序号
 * @returns {Object} CSS样式对象
 */
function getPurpleBoltStyle (index) {
  const left = 25 + (index - 1) * 15
  const delay = (index - 1) * 0.15
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成电弧飞散样式
 * @param {number} index - 序号
 * @returns {Object} CSS样式对象
 */
function getArcStyle (index) {
  const angle = (index - 1) * 45
  const distance = 28 + (index % 3) * 10
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * distance
  const ty = Math.sin(rad) * distance
  const delay = (index % 4) * 0.1
  return {
    '--t4-tx': `${tx}px`,
    '--t4-ty': `${ty}px`,
    '--t4-rotate': `${angle}deg`,
    animationDelay: `${delay}s`
  }
}

/**
 * 生成雷球爆破射线样式
 * @param {number} index - 序号
 * @returns {Object} CSS样式对象
 */
function getRayStyle (index) {
  const angle = (index - 1) * 30
  const delay = (index % 4) * 0.06
  return {
    '--t5-angle': `${angle}deg`,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
/* ================================================================
   页面基础布局
   ================================================================ */
.mage-skill-showcase {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a1e 0%, #0f1a3e 50%, #0a2a4e 100%);
  padding: 20px;
  box-sizing: border-box;
}

.showcase-header {
  text-align: center;
  margin-bottom: 40px;
}

.showcase-header h1 {
  font-size: 2.2rem;
  color: #4fc3f7;
  text-shadow: 0 0 20px rgba(79, 195, 247, 0.5);
  margin-bottom: 10px;
}

.subtitle {
  color: #8080a0;
  font-size: 1rem;
  margin-bottom: 15px;
}

.back-btn {
  padding: 10px 25px;
  background: linear-gradient(135deg, #4fc3f7, #0288d1);
  border: none;
  border-radius: 25px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.back-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 20px rgba(79, 195, 247, 0.4);
}

/* 技能分区 */
.skill-section {
  max-width: 1400px;
  margin: 0 auto 50px;
}

.skill-title {
  font-size: 1.8rem;
  margin-bottom: 5px;
}

.water-title {
  color: #4fc3f7;
  text-shadow: 0 0 15px rgba(79, 195, 247, 0.4);
}

.thunder-title {
  color: #b388ff;
  text-shadow: 0 0 15px rgba(179, 136, 255, 0.4);
}

.skill-desc {
  color: #606080;
  font-size: 0.95rem;
  margin-bottom: 25px;
  font-style: italic;
}

/* 卡片网格 */
.effects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 25px;
}

.effect-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
}

.effect-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.effect-preview {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
  margin-bottom: 15px;
  position: relative;
  overflow: hidden;
}

.monster-placeholder {
  width: 80px;
  height: 80px;
  position: relative;
}

.monster-icon {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 1.4rem;
  z-index: 10;
  opacity: 0.7;
  pointer-events: none;
}

.effect-fx {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  pointer-events: none;
}

.effect-info h3 {
  color: #ffffff;
  font-size: 1.15rem;
  margin-bottom: 5px;
}

.effect-info p {
  color: #888;
  font-size: 0.85rem;
}

.showcase-footer {
  text-align: center;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.showcase-footer p {
  color: #666;
  font-size: 0.85rem;
}

/* ================================================================
   激流冲击 样式1：水柱冲天
   从地面喷涌而上的强力水柱直击目标
   ================================================================ */
.fx-water-1 .w1-ground {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 70px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(0, 100, 200, 0.5), transparent 70%);
  transform: translateX(-50%);
  animation: w1-ground 1.5s ease-in-out infinite;
}
@keyframes w1-ground {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.6; }
  50% { transform: translateX(-50%) scale(1.3); opacity: 1; }
}

.fx-water-1 .w1-column {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 36px;
  height: 90%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: bottom center;
  animation: w1-rise 1.5s ease-out infinite;
}
@keyframes w1-rise {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  20% { transform: translateX(-50%) scaleY(1); opacity: 1; }
  80% { transform: translateX(-50%) scaleY(1); opacity: 0.8; }
  100% { transform: translateX(-50%) scaleY(0.6); opacity: 0; }
}

.fx-water-1 .w1-column-core {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top,
    rgba(0, 100, 200, 0.8) 0%,
    rgba(0, 180, 255, 0.6) 50%,
    rgba(150, 230, 255, 0.3) 100%);
  border-radius: 18px 18px 4px 4px;
  box-shadow: 0 0 15px rgba(0, 150, 255, 0.5);
}

.fx-water-1 .w1-column-foam {
  position: absolute;
  top: -8px;
  left: -4px;
  right: -4px;
  height: 16px;
  background: radial-gradient(ellipse, rgba(255, 255, 255, 0.9), transparent 70%);
  border-radius: 50%;
  filter: blur(2px);
  animation: w1-foam 1.5s ease-out infinite;
}
@keyframes w1-foam {
  0%, 100% { transform: scale(0.5); opacity: 0; }
  30% { transform: scale(1.2); opacity: 1; }
  60% { transform: scale(1.5); opacity: 0.5; }
}

.fx-water-1 .w1-drop {
  position: absolute;
  top: 30%;
  left: 50%;
  width: var(--w1-size, 5px);
  height: var(--w1-size, 5px);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(100, 200, 255, 0.5));
  box-shadow: 0 0 4px rgba(100, 200, 255, 0.5);
  animation: w1-drop 1.2s ease-out infinite;
}
@keyframes w1-drop {
  0% { transform: translate(0, 0) scale(0); opacity: 0; }
  20% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--w1-tx, 0px), var(--w1-ty, 0px)) scale(0.3); opacity: 0; }
}

/* ================================================================
   激流冲击 样式2：水幕冲天
   宽阔水幕从底部冲天而起 + 泡沫翻涌 + 水流条纹 + 水珠飞溅
   ================================================================ */

/* 水幕本体 - 宽阔水幕从底部向上生长 */
.fx-water-2 .w2-sheet {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 75%;
  height: 85%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: bottom center;
  background: linear-gradient(to top,
    rgba(0, 130, 200, 0.8) 0%,
    rgba(0, 190, 255, 0.55) 40%,
    rgba(100, 220, 255, 0.25) 80%,
    transparent 100%);
  border-radius: 45% 45% 6% 6% / 25% 25% 6% 6%;
  box-shadow: 0 0 20px rgba(0, 180, 255, 0.4);
  animation: w2-sheet-rise 1.5s cubic-bezier(0.2, 0.7, 0.3, 1) infinite;
  will-change: transform, opacity;
}
@keyframes w2-sheet-rise {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  15% { opacity: 1; }
  55% { transform: translateX(-50%) scaleY(1); opacity: 0.9; }
  80% { transform: translateX(-50%) scaleY(1.05); opacity: 0.5; }
  100% { transform: translateX(-50%) scaleY(1.1); opacity: 0; }
}

/* 泡沫顶 - 水幕顶部翻涌的白色泡沫 */
.fx-water-2 .w2-foam {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 75%;
  height: 14%;
  transform: translateX(-50%) translateY(0) scaleX(0.2);
  background: radial-gradient(ellipse at center,
    rgba(220, 245, 255, 0.9) 0%,
    rgba(150, 225, 255, 0.5) 50%,
    transparent 100%);
  border-radius: 50%;
  filter: blur(2px);
  animation: w2-foam-rise 1.5s cubic-bezier(0.2, 0.7, 0.3, 1) infinite;
  will-change: transform, opacity;
}
@keyframes w2-foam-rise {
  0% { transform: translateX(-50%) translateY(0) scaleX(0.2); opacity: 0; }
  15% { opacity: 1; }
  55% { transform: translateX(-50%) translateY(-400%) scaleX(1); opacity: 0.85; }
  80% { transform: translateX(-50%) translateY(-460%) scaleX(1.1); opacity: 0.4; }
  100% { transform: translateX(-50%) translateY(-500%) scaleX(1.2); opacity: 0; }
}

/* 水流条纹 - 幕内向上流动的水线 */
.fx-water-2 .w2-streak {
  position: absolute;
  bottom: 8%;
  width: 3px;
  height: 35%;
  background: linear-gradient(to top, rgba(160, 235, 255, 0.7), transparent);
  border-radius: 2px;
  transform-origin: bottom center;
  animation: w2-streak-up 1.3s ease-out infinite;
  will-change: transform, opacity;
}
@keyframes w2-streak-up {
  0% { transform: scaleY(0); opacity: 0; }
  25% { opacity: 0.7; }
  70% { transform: scaleY(2.2); opacity: 0.4; }
  100% { transform: scaleY(2.8); opacity: 0; }
}

/* 水珠飞溅 - 沿水幕两侧向上飞溅 */
.fx-water-2 .w2-drop {
  position: absolute;
  bottom: 12%;
  left: 50%;
  width: var(--w2-drop-size, 5px);
  height: var(--w2-drop-size, 5px);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(220, 245, 255, 0.95), rgba(0, 200, 255, 0.4));
  box-shadow: 0 0 4px rgba(100, 220, 255, 0.5);
  animation: w2-drop-fly 1s ease-out infinite;
  will-change: transform, opacity;
}
@keyframes w2-drop-fly {
  0% { transform: translate(-50%, 0) scale(0.4); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translate(calc(-50% + var(--w2-drop-tx, 0px)), var(--w2-drop-ty, 0px)) scale(0.3); opacity: 0; }
}

/* ================================================================
   激流冲击 样式3：水幕叠浪
   多层水幕叠加上升 + 波浪翻涌 + 冲击环 + 水珠四溅
   ================================================================ */

/* 后层水幕 - 最宽最淡 */
.fx-water-3 .w3-sheet-back {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 52px;
  height: 85%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: bottom center;
  background: linear-gradient(to top,
    rgba(0, 120, 190, 0.5) 0%,
    rgba(0, 180, 250, 0.3) 50%,
    transparent 100%);
  border-radius: 40% 40% 5% 5% / 20% 20% 5% 5%;
  animation: w3-back-rise 2s cubic-bezier(0.2, 0.7, 0.3, 1) infinite;
  will-change: transform, opacity;
}
@keyframes w3-back-rise {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  10% { opacity: 0.6; }
  50% { transform: translateX(-50%) scaleY(1); opacity: 0.5; }
  80% { transform: translateX(-50%) scaleY(1.1); opacity: 0.2; }
  100% { transform: translateX(-50%) scaleY(1.15); opacity: 0; }
}

/* 中层水幕 - 中等宽度透明度 */
.fx-water-3 .w3-sheet-mid {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 44px;
  height: 85%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: bottom center;
  background: linear-gradient(to top,
    rgba(0, 150, 210, 0.7) 0%,
    rgba(0, 200, 255, 0.45) 50%,
    rgba(120, 225, 255, 0.15) 90%,
    transparent 100%);
  border-radius: 45% 45% 6% 6% / 25% 25% 6% 6%;
  box-shadow: 0 0 12px rgba(0, 170, 255, 0.3);
  animation: w3-mid-rise 2s cubic-bezier(0.2, 0.7, 0.3, 1) infinite;
  animation-delay: 0.15s;
  will-change: transform, opacity;
}
@keyframes w3-mid-rise {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  15% { opacity: 0.8; }
  55% { transform: translateX(-50%) scaleY(1); opacity: 0.7; }
  80% { transform: translateX(-50%) scaleY(1.05); opacity: 0.3; }
  100% { transform: translateX(-50%) scaleY(1.1); opacity: 0; }
}

/* 前层水幕 - 最窄最亮 */
.fx-water-3 .w3-sheet-front {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 36px;
  height: 88%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: bottom center;
  background: linear-gradient(to top,
    rgba(0, 170, 230, 0.85) 0%,
    rgba(0, 210, 255, 0.6) 50%,
    rgba(160, 235, 255, 0.25) 90%,
    transparent 100%);
  border-radius: 45% 45% 6% 6% / 25% 25% 6% 6%;
  box-shadow: 0 0 18px rgba(0, 190, 255, 0.5);
  animation: w3-front-rise 2s cubic-bezier(0.2, 0.7, 0.3, 1) infinite;
  animation-delay: 0.3s;
  will-change: transform, opacity;
}
@keyframes w3-front-rise {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  20% { opacity: 1; }
  60% { transform: translateX(-50%) scaleY(1); opacity: 0.9; }
  80% { transform: translateX(-50%) scaleY(1.05); opacity: 0.4; }
  100% { transform: translateX(-50%) scaleY(1.1); opacity: 0; }
}

/* 泡沫浪尖 - 前层水幕顶部翻涌泡沫 */
.fx-water-3 .w3-foam-crest {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 40px;
  height: 12%;
  transform: translateX(-50%) translateY(0) scaleX(0.2);
  background: radial-gradient(ellipse at center,
    rgba(230, 248, 255, 0.9) 0%,
    rgba(160, 230, 255, 0.5) 50%,
    transparent 100%);
  border-radius: 50%;
  filter: blur(2px);
  animation: w3-crest-rise 2s cubic-bezier(0.2, 0.7, 0.3, 1) infinite;
  animation-delay: 0.3s;
  will-change: transform, opacity;
}
@keyframes w3-crest-rise {
  0% { transform: translateX(-50%) translateY(0) scaleX(0.2); opacity: 0; }
  20% { opacity: 1; }
  60% { transform: translateX(-50%) translateY(-500%) scaleX(1); opacity: 0.8; }
  80% { transform: translateX(-50%) translateY(-580%) scaleX(1.1); opacity: 0.3; }
  100% { transform: translateX(-50%) translateY(-620%) scaleX(1.2); opacity: 0; }
}

/* 冲击环 - 底部地面扩散环 */
.fx-water-3 .w3-impact-ring {
  position: absolute;
  bottom: 8%;
  left: 50%;
  width: 20px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid rgba(0, 200, 255, 0.8);
  box-shadow: 0 0 8px rgba(0, 180, 255, 0.4);
  transform: translate(-50%, 50%) scale(0);
  animation: w3-ring 2s ease-out infinite;
  will-change: transform, opacity;
}
@keyframes w3-ring {
  0% { transform: translate(-50%, 50%) scale(0); opacity: 0; }
  15% { transform: translate(-50%, 50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, 50%) scale(5); opacity: 0; }
}

/* 水珠四溅 - 从顶部向两侧飞散 */
.fx-water-3 .w3-drop {
  position: absolute;
  bottom: 50%;
  left: 50%;
  width: var(--w3-size, 5px);
  height: var(--w3-size, 5px);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(230, 248, 255, 0.9), rgba(100, 200, 255, 0.5));
  box-shadow: 0 0 4px rgba(100, 200, 255, 0.5);
  animation: w3-drop-scatter 1.5s ease-out infinite;
  will-change: transform, opacity;
}
@keyframes w3-drop-scatter {
  0%, 40% { transform: translate(0, 0) scale(0); opacity: 0; }
  50% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--w3-tx, 0px), var(--w3-ty, 0px)) scale(0.3); opacity: 0; }
}

/* ================================================================
   激流冲击 样式4：水幕螺旋
   水幕螺旋扭曲上升 + 双向水带缠绕 + 泡沫 + 螺旋水珠
   ================================================================ */

/* 螺旋水幕 - 上升时左右扭曲 */
.fx-water-4 .w4-sheet {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 60%;
  height: 85%;
  transform: translateX(-50%) scaleY(0) skewX(0deg);
  transform-origin: bottom center;
  background: linear-gradient(to top,
    rgba(0, 140, 210, 0.75) 0%,
    rgba(0, 200, 255, 0.5) 50%,
    rgba(120, 225, 255, 0.2) 90%,
    transparent 100%);
  border-radius: 45% 45% 6% 6% / 25% 25% 6% 6%;
  box-shadow: 0 0 16px rgba(0, 180, 255, 0.4);
  animation: w4-sheet-twist 1.8s ease-out infinite;
  will-change: transform, opacity;
}
@keyframes w4-sheet-twist {
  0% { transform: translateX(-50%) scaleY(0) skewX(0deg); opacity: 0; }
  15% { transform: translateX(-50%) scaleY(0.5) skewX(10deg); opacity: 0.9; }
  35% { transform: translateX(-50%) scaleY(1) skewX(-8deg); opacity: 1; }
  55% { transform: translateX(-50%) scaleY(1) skewX(6deg); opacity: 0.9; }
  75% { transform: translateX(-50%) scaleY(1.05) skewX(-4deg); opacity: 0.6; }
  100% { transform: translateX(-50%) scaleY(1.1) skewX(0deg); opacity: 0; }
}

/* 螺旋水带A - 正向斜向上升 */
.fx-water-4 .w4-twist-a {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 55%;
  height: 80%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: bottom center;
  background: linear-gradient(60deg,
    transparent 0%,
    rgba(0, 220, 255, 0.4) 30%,
    rgba(150, 240, 255, 0.5) 50%,
    rgba(0, 220, 255, 0.4) 70%,
    transparent 100%);
  background-size: 200% 100%;
  border-radius: 45% 45% 6% 6% / 25% 25% 6% 6%;
  filter: blur(1px);
  animation: w4-twist-a 1.8s linear infinite;
  will-change: transform, opacity;
}
@keyframes w4-twist-a {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  15% { opacity: 0.8; }
  50% { transform: translateX(-50%) scaleY(1); opacity: 0.7; }
  80% { transform: translateX(-50%) scaleY(1.05); opacity: 0.3; }
  100% { transform: translateX(-50%) scaleY(1.1); opacity: 0; }
}

/* 螺旋水带B - 反向斜向上升 */
.fx-water-4 .w4-twist-b {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 55%;
  height: 80%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: bottom center;
  background: linear-gradient(-60deg,
    transparent 0%,
    rgba(0, 220, 255, 0.4) 30%,
    rgba(150, 240, 255, 0.5) 50%,
    rgba(0, 220, 255, 0.4) 70%,
    transparent 100%);
  background-size: 200% 100%;
  border-radius: 45% 45% 6% 6% / 25% 25% 6% 6%;
  filter: blur(1px);
  animation: w4-twist-b 1.8s linear infinite;
  animation-delay: 0.3s;
  will-change: transform, opacity;
}
@keyframes w4-twist-b {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  15% { opacity: 0.8; }
  50% { transform: translateX(-50%) scaleY(1); opacity: 0.7; }
  80% { transform: translateX(-50%) scaleY(1.05); opacity: 0.3; }
  100% { transform: translateX(-50%) scaleY(1.1); opacity: 0; }
}

/* 泡沫顶 - 螺旋水幕顶部泡沫 */
.fx-water-4 .w4-foam {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 60%;
  height: 12%;
  transform: translateX(-50%) translateY(0) scaleX(0.2);
  background: radial-gradient(ellipse at center,
    rgba(220, 245, 255, 0.85) 0%,
    rgba(150, 225, 255, 0.45) 50%,
    transparent 100%);
  border-radius: 50%;
  filter: blur(2px);
  animation: w4-foam-rise 1.8s ease-out infinite;
  will-change: transform, opacity;
}
@keyframes w4-foam-rise {
  0% { transform: translateX(-50%) translateY(0) scaleX(0.2); opacity: 0; }
  15% { opacity: 1; }
  55% { transform: translateX(-50%) translateY(-450%) scaleX(1); opacity: 0.8; }
  80% { transform: translateX(-50%) translateY(-520%) scaleX(1.1); opacity: 0.3; }
  100% { transform: translateX(-50%) translateY(-560%) scaleX(1.2); opacity: 0; }
}

/* 螺旋水珠 - 沿螺旋路径向上飞溅 */
.fx-water-4 .w4-drop {
  position: absolute;
  bottom: 15%;
  left: 50%;
  width: var(--w4-size, 5px);
  height: var(--w4-size, 5px);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(220, 245, 255, 0.95), rgba(0, 200, 255, 0.4));
  box-shadow: 0 0 4px rgba(100, 220, 255, 0.5);
  animation: w4-drop-spiral 1.2s ease-out infinite;
  will-change: transform, opacity;
}
@keyframes w4-drop-spiral {
  0% { transform: translate(-50%, 0) scale(0.4); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translate(calc(-50% + var(--w4-tx, 0px)), var(--w4-ty, 0px)) scale(0.3); opacity: 0; }
}

/* ================================================================
   激流冲击 样式5：水幕冰封
   水幕冲天上升渐变为冰 + 冰晶蔓延 + 霜雾弥漫 + 雪花飘落
   ================================================================ */

/* 水幕本体 - 蓝色水幕上升 */
.fx-water-5 .w5-sheet-water {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 65%;
  height: 85%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: bottom center;
  background: linear-gradient(to top,
    rgba(0, 140, 210, 0.8) 0%,
    rgba(0, 200, 255, 0.5) 40%,
    rgba(120, 225, 255, 0.2) 80%,
    transparent 100%);
  border-radius: 45% 45% 6% 6% / 25% 25% 6% 6%;
  box-shadow: 0 0 16px rgba(0, 180, 255, 0.4);
  animation: w5-water-rise 1.8s ease-out infinite;
  will-change: transform, opacity;
}
@keyframes w5-water-rise {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  15% { opacity: 1; }
  55% { transform: translateX(-50%) scaleY(1); opacity: 0.85; }
  80% { transform: translateX(-50%) scaleY(1.05); opacity: 0.4; }
  100% { transform: translateX(-50%) scaleY(1.1); opacity: 0; }
}

/* 冰封层 - 白色冰幕叠加在水幕上方延迟上升 */
.fx-water-5 .w5-sheet-ice {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 60%;
  height: 80%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: bottom center;
  background: linear-gradient(to top,
    rgba(180, 230, 250, 0.6) 0%,
    rgba(210, 240, 255, 0.5) 40%,
    rgba(240, 250, 255, 0.3) 80%,
    transparent 100%);
  border-radius: 45% 45% 6% 6% / 25% 25% 6% 6%;
  box-shadow: 0 0 18px rgba(150, 220, 250, 0.5);
  animation: w5-ice-rise 1.8s ease-out infinite;
  animation-delay: 0.25s;
  will-change: transform, opacity;
}
@keyframes w5-ice-rise {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  20% { opacity: 0.8; }
  60% { transform: translateX(-50%) scaleY(1); opacity: 0.7; }
  80% { transform: translateX(-50%) scaleY(1.05); opacity: 0.3; }
  100% { transform: translateX(-50%) scaleY(1.1); opacity: 0; }
}

/* 冰晶边缘 - 水幕顶部冰晶生长 */
.fx-water-5 .w5-ice-edge {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 65%;
  height: 10%;
  transform: translateX(-50%) translateY(0) scaleX(0.2);
  background: radial-gradient(ellipse at center,
    rgba(240, 250, 255, 0.9) 0%,
    rgba(180, 230, 250, 0.5) 50%,
    transparent 100%);
  border-radius: 50%;
  filter: blur(2px);
  clip-path: polygon(0% 100%, 5% 60%, 12% 80%, 20% 40%, 28% 65%, 36% 30%, 44% 55%, 50% 20%, 56% 55%, 64% 30%, 72% 65%, 80% 40%, 88% 80%, 95% 60%, 100% 100%);
  animation: w5-ice-edge 1.8s ease-out infinite;
  will-change: transform, opacity;
}
@keyframes w5-ice-edge {
  0% { transform: translateX(-50%) translateY(0) scaleX(0.2); opacity: 0; }
  15% { opacity: 1; }
  55% { transform: translateX(-50%) translateY(-450%) scaleX(1); opacity: 0.8; }
  80% { transform: translateX(-50%) translateY(-520%) scaleX(1.1); opacity: 0.3; }
  100% { transform: translateX(-50%) translateY(-560%) scaleX(1.2); opacity: 0; }
}

/* 霜雾弥漫 - 底部冰雾扩散 */
.fx-water-5 .w5-frost-mist {
  position: absolute;
  bottom: 5%;
  left: 50%;
  width: 80px;
  height: 30px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(210, 240, 255, 0.3), transparent 70%);
  transform: translateX(-50%) scale(0);
  filter: blur(5px);
  animation: w5-frost-mist 1.8s ease-out infinite;
  will-change: transform, opacity;
}
@keyframes w5-frost-mist {
  0% { transform: translateX(-50%) scale(0); opacity: 0; }
  30% { transform: translateX(-50%) scale(0.8); opacity: 0.5; }
  100% { transform: translateX(-50%) scale(2); opacity: 0; }
}

/* 雪花飘落 - 从上方缓缓飘落 */
.fx-water-5 .w5-flake {
  position: absolute;
  top: -10%;
  width: var(--w5-snow-size, 4px);
  height: var(--w5-snow-size, 4px);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(210, 240, 255, 0.4));
  box-shadow: 0 0 3px rgba(210, 240, 255, 0.6);
  animation: w5-snow 3s linear infinite;
  will-change: transform, opacity;
}
@keyframes w5-snow {
  0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
  10% { transform: translateY(10px) translateX(2px) scale(1); opacity: 0.8; }
  90% { transform: translateY(110px) translateX(-5px) scale(0.8); opacity: 0.6; }
  100% { transform: translateY(130px) translateX(-8px) scale(0.3); opacity: 0; }
}

/* ================================================================
   电闪雷鸣 样式1：天降神雷
   粗壮闪电从天而降直劈目标 - 强化版：更粗更亮更多分支+冲击波+全屏白闪
   ================================================================ */

/* 全屏闪光 - 闪电劈落瞬间的白色全屏爆闪 */
.fx-thunder-1 .t1-flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(ellipse at 50% 55%, rgba(220, 235, 255, 0.9) 0%, rgba(150, 180, 255, 0.5) 30%, transparent 70%);
  animation: t1-glow 1s ease-out infinite;
  opacity: 0;
  will-change: opacity;
}
@keyframes t1-glow {
  0%, 100% { opacity: 0; }
  3% { opacity: 1; }
  8% { opacity: 0.2; }
  12% { opacity: 0.9; }
  20% { opacity: 0.3; }
  50% { opacity: 0; }
}

/* 闪电主体 - 更粗更亮 */
.fx-thunder-1 .t1-bolt {
  position: absolute;
  top: 0;
  left: 50%;
  width: 12px;
  height: 100%;
  transform: translateX(-50%);
  animation: t1-flash 1s ease-out infinite;
  will-change: opacity;
}
@keyframes t1-flash {
  0%, 100% { opacity: 0; }
  3% { opacity: 1; }
  8% { opacity: 0.2; }
  12% { opacity: 1; }
  20% { opacity: 0.3; }
  25% { opacity: 0.8; }
  50% { opacity: 0; }
}

/* 闪电外层光晕 - 包裹闪电的巨大发光层 */
.fx-thunder-1 .t1-bolt-glow {
  position: absolute;
  inset: -8px -20px;
  background: radial-gradient(ellipse at center, rgba(180, 210, 255, 0.6) 0%, rgba(120, 160, 255, 0.3) 40%, transparent 70%);
  filter: blur(4px);
  opacity: inherit;
}

/* 闪电核心 - 更粗更亮的之字形 */
.fx-thunder-1 .t1-bolt-main {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(200, 220, 255, 1), rgba(255, 255, 255, 1));
  box-shadow: 0 0 20px rgba(150, 180, 255, 1), 0 0 40px rgba(100, 150, 255, 0.8), 0 0 60px rgba(80, 120, 255, 0.4);
  clip-path: polygon(30% 0%, 70% 3%, 25% 12%, 75% 22%, 30% 32%, 70% 42%, 25% 52%, 75% 62%, 30% 72%, 70% 82%, 35% 92%, 65% 100%);
}

/* 分支闪电 - 更粗更多 */
.fx-thunder-1 .t1-bolt-branch {
  position: absolute;
  background: rgba(220, 235, 255, 0.9);
  box-shadow: 0 0 8px rgba(150, 180, 255, 0.8), 0 0 16px rgba(100, 150, 255, 0.4);
  border-radius: 2px;
}
.fx-thunder-1 .t1-bolt-branch.ba {
  top: 25%;
  left: 50%;
  width: 3px;
  height: 30px;
  transform: translateX(-50%) rotate(-35deg);
  transform-origin: top center;
}
.fx-thunder-1 .t1-bolt-branch.bb {
  top: 50%;
  left: 50%;
  width: 3px;
  height: 25px;
  transform: translateX(-50%) rotate(40deg);
  transform-origin: top center;
}
.fx-thunder-1 .t1-bolt-branch.bc {
  top: 70%;
  left: 50%;
  width: 3px;
  height: 22px;
  transform: translateX(-50%) rotate(-30deg);
  transform-origin: top center;
}

/* 冲击爆点 - 闪电落地的巨大光球 */
.fx-thunder-1 .t1-impact {
  position: absolute;
  bottom: 8%;
  left: 50%;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(180, 210, 255, 0.6) 30%, rgba(100, 150, 255, 0.3) 60%, transparent 80%);
  transform: translateX(-50%) scale(0);
  animation: t1-impact 1s ease-out infinite;
  will-change: transform, opacity;
}
@keyframes t1-impact {
  0%, 10% { transform: translateX(-50%) scale(0); opacity: 0; }
  15% { transform: translateX(-50%) scale(1.8); opacity: 1; }
  40% { transform: translateX(-50%) scale(3); opacity: 0.4; }
  60% { transform: translateX(-50%) scale(4); opacity: 0; }
}

/* 冲击波环 - 落地后向外扩散的环形冲击波 */
.fx-thunder-1 .t1-shockwave {
  position: absolute;
  bottom: 10%;
  left: 50%;
  width: 20px;
  height: 8px;
  border-radius: 50%;
  border: 3px solid rgba(200, 220, 255, 0.9);
  box-shadow: 0 0 12px rgba(150, 180, 255, 0.6);
  transform: translate(-50%, 50%) scale(0);
  animation: t1-shockwave 1s ease-out infinite;
  will-change: transform, opacity;
}
@keyframes t1-shockwave {
  0%, 10% { transform: translate(-50%, 50%) scale(0); opacity: 0; }
  15% { transform: translate(-50%, 50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, 50%) scale(6); opacity: 0; }
}

/* 电火花飞溅 - 更大更多 */
.fx-thunder-1 .t1-spark {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 4px;
  height: 16px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(180, 210, 255, 0.5));
  box-shadow: 0 0 6px rgba(150, 180, 255, 0.6);
  border-radius: 2px;
  animation: t1-spark 1s ease-out infinite;
  will-change: transform, opacity;
}
@keyframes t1-spark {
  0%, 10% { transform: translate(0, 0) scale(0); opacity: 0; }
  15% { transform: translate(0, 0) scale(1.2); opacity: 1; }
  100% { transform: translate(var(--t1-tx, 0px), var(--t1-ty, 0px)) scale(0.3); opacity: 0; }
}

/* ================================================================
   电闪雷鸣 样式2：雷网连锁
   多道闪电形成电网连锁电击目标
   ================================================================ */
.fx-thunder-2 .t2-bolt {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(150, 200, 255, 0.9), transparent);
  box-shadow: 0 0 8px rgba(100, 180, 255, 0.6);
  transform-origin: left center;
  transform: rotate(var(--t2-angle, 0deg)) translateX(15px) scaleX(0);
  animation: t2-bolt 1.5s ease-out infinite;
}
@keyframes t2-bolt {
  0% { transform: rotate(var(--t2-angle, 0deg)) translateX(15px) scaleX(0); opacity: 0; }
  20% { transform: rotate(var(--t2-angle, 0deg)) translateX(20px) scaleX(1); opacity: 1; }
  50% { transform: rotate(var(--t2-angle, 0deg)) translateX(25px) scaleX(0.8); opacity: 0.8; }
  100% { transform: rotate(var(--t2-angle, 0deg)) translateX(30px) scaleX(0); opacity: 0; }
}

.fx-thunder-2 .t2-node {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 1), rgba(100, 180, 255, 0.5) 60%, transparent);
  box-shadow: 0 0 8px rgba(100, 180, 255, 0.8);
  transform: rotate(var(--t2-angle, 0deg)) translateX(40px) translate(-50%, -50%);
  animation: t2-node 1.5s ease-out infinite;
}
@keyframes t2-node {
  0%, 20% { opacity: 0; transform: rotate(var(--t2-angle, 0deg)) translateX(40px) translate(-50%, -50%) scale(0); }
  30% { opacity: 1; transform: rotate(var(--t2-angle, 0deg)) translateX(40px) translate(-50%, -50%) scale(1.5); }
  60% { opacity: 0.5; transform: rotate(var(--t2-angle, 0deg)) translateX(40px) translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: rotate(var(--t2-angle, 0deg)) translateX(40px) translate(-50%, -50%) scale(0.5); }
}

.fx-thunder-2 .t2-flash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(150, 200, 255, 0.4), transparent 70%);
  transform: translate(-50%, -50%) scale(0);
  animation: t2-flash 1.5s ease-out infinite;
}
@keyframes t2-flash {
  0%, 40% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}

/* ================================================================
   电闪雷鸣 样式3：雷暴风暴
   闪电伴随风暴旋转绞杀目标
   ================================================================ */
.fx-thunder-3 .t3-storm {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.fx-thunder-3 .t3-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2px solid rgba(150, 180, 255, 0.4);
  transform: translate(-50%, -50%);
}
.fx-thunder-3 .t3-ring.ring-a {
  width: 70px;
  height: 70px;
  border-style: dashed;
  animation: t3-spin-a 2s linear infinite;
}
@keyframes t3-spin-a {
  0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.1); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); opacity: 0.5; }
}
.fx-thunder-3 .t3-ring.ring-b {
  width: 50px;
  height: 50px;
  border-color: rgba(100, 150, 255, 0.5);
  animation: t3-spin-b 1.5s linear infinite reverse;
}
@keyframes t3-spin-b {
  0% { transform: translate(-50%, -50%) rotate(0deg) scale(0.9); }
  100% { transform: translate(-50%, -50%) rotate(360deg) scale(1.1); }
}

.fx-thunder-3 .t3-bolt {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 35px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(150, 180, 255, 0.5));
  box-shadow: 0 0 6px rgba(100, 150, 255, 0.7);
  border-radius: 2px;
  transform-origin: center top;
  transform: rotate(var(--t3-angle, 0deg)) translateY(-35px);
  animation: t3-bolt 1.5s ease-in-out infinite;
}
@keyframes t3-bolt {
  0%, 100% { opacity: 0.3; height: 35px; }
  50% { opacity: 1; height: 45px; }
}

.fx-thunder-3 .t3-eye {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 1), rgba(100, 150, 255, 0.4) 60%, transparent);
  box-shadow: 0 0 15px rgba(100, 150, 255, 0.8);
  transform: translate(-50%, -50%);
  animation: t3-eye 0.5s ease-in-out infinite alternate;
}
@keyframes t3-eye {
  0% { transform: translate(-50%, -50%) scale(1); }
  100% { transform: translate(-50%, -50%) scale(1.3); }
}

/* ================================================================
   电闪雷鸣 样式4：紫电狂袭
   紫色闪电连续劈落电弧四散
   ================================================================ */
.fx-thunder-4 .t4-bolt {
  position: absolute;
  top: 0;
  width: 3px;
  height: 80%;
  background: linear-gradient(to bottom, rgba(220, 180, 255, 1), rgba(170, 100, 255, 0.8), rgba(220, 180, 255, 1));
  box-shadow: 0 0 10px rgba(170, 100, 255, 0.8), 0 0 25px rgba(120, 60, 220, 0.4);
  clip-path: polygon(30% 0%, 70% 10%, 25% 30%, 75% 50%, 30% 70%, 70% 90%, 45% 100%);
  transform: translateX(-50%);
  animation: t4-bolt 1.2s ease-out infinite;
}
@keyframes t4-bolt {
  0% { opacity: 0; transform: translateX(-50%) scaleY(0); }
  10% { opacity: 1; transform: translateX(-50%) scaleY(1); }
  20% { opacity: 0.3; }
  25% { opacity: 1; }
  40% { opacity: 0.5; }
  60% { opacity: 0; }
}

.fx-thunder-4 .t4-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(170, 100, 255, 0.2), transparent 70%);
  transform: translate(-50%, -50%);
  animation: t4-aura 1s ease-in-out infinite alternate;
}
@keyframes t4-aura {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
  100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
}

.fx-thunder-4 .t4-arc {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 15px;
  background: linear-gradient(to bottom, rgba(220, 180, 255, 0.9), rgba(170, 100, 255, 0.4));
  border-radius: 2px;
  box-shadow: 0 0 5px rgba(170, 100, 255, 0.6);
  transform: translate(-50%, -50%) rotate(var(--t4-rotate, 0deg)) scale(0);
  animation: t4-arc 1.2s ease-out infinite;
}
@keyframes t4-arc {
  0%, 15% { transform: translate(-50%, -50%) rotate(var(--t4-rotate, 0deg)) scale(0); opacity: 0; }
  25% { transform: translate(-50%, -50%) rotate(var(--t4-rotate, 0deg)) scale(1); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--t4-tx, 0px)), calc(-50% + var(--t4-ty, 0px))) rotate(var(--t4-rotate, 0deg)) scale(0.3); opacity: 0; }
}

/* ================================================================
   电闪雷鸣 样式5：雷球爆破
   闪电凝聚成球后猛烈爆裂释放
   ================================================================ */
.fx-thunder-5 .t5-orb {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: t5-orb 1.8s ease-in-out infinite;
}
@keyframes t5-orb {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  20% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  60% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
  70% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.8; }
  80% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
  100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
}

.fx-thunder-5 .t5-orb-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 1), rgba(150, 200, 255, 0.6) 50%, transparent);
  box-shadow: 0 0 20px rgba(100, 180, 255, 0.8), 0 0 40px rgba(80, 120, 255, 0.4);
  transform: translate(-50%, -50%);
}

.fx-thunder-5 .t5-orb-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2px solid rgba(150, 200, 255, 0.6);
  transform: translate(-50%, -50%);
}
.fx-thunder-5 .t5-orb-ring.ra {
  width: 35px;
  height: 35px;
  animation: t5-ring-a 1.8s ease-in-out infinite;
}
@keyframes t5-ring-a {
  0%, 20% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
  40% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  70% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}
.fx-thunder-5 .t5-orb-ring.rb {
  width: 45px;
  height: 45px;
  animation: t5-ring-b 1.8s ease-in-out 0.2s infinite;
}
@keyframes t5-ring-b {
  0%, 20% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
  40% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
  70% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
}

.fx-thunder-5 .t5-ray {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 40px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(150, 200, 255, 0.3));
  border-radius: 2px;
  box-shadow: 0 0 6px rgba(100, 180, 255, 0.6);
  transform-origin: center top;
  transform: rotate(var(--t5-angle, 0deg)) translateY(-20px) scaleY(0);
  animation: t5-ray 1.8s ease-out infinite;
}
@keyframes t5-ray {
  0%, 65% { transform: rotate(var(--t5-angle, 0deg)) translateY(-20px) scaleY(0); opacity: 0; }
  75% { transform: rotate(var(--t5-angle, 0deg)) translateY(-20px) scaleY(1); opacity: 1; }
  100% { transform: rotate(var(--t5-angle, 0deg)) translateY(-40px) scaleY(0.5); opacity: 0; }
}

.fx-thunder-5 .t5-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(200, 220, 255, 0.5), transparent 60%);
  opacity: 0;
  animation: t5-flash 1.8s ease-out infinite;
}
@keyframes t5-flash {
  0%, 65% { opacity: 0; }
  72% { opacity: 1; }
  85% { opacity: 0.3; }
  100% { opacity: 0; }
}

/* ================================================================
   响应式布局
   ================================================================ */
@media (max-width: 768px) {
  .showcase-header h1 {
    font-size: 1.5rem;
  }
  .effects-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 15px;
  }
  .effect-preview {
    height: 160px;
  }
}

/* 尊重减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .effect-fx * {
    animation-duration: 0.01s !important;
  }
}
</style>
