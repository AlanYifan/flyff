<!--
  @file EffectsShowcase.vue
  @generated 2026-02-23
  @description 狂暴效果展示页面：展示15种不同风格的狂暴动画效果（直接展示）
-->
<template>
  <div class="effects-showcase">
    <header class="showcase-header">
      <h1>狂暴效果展示</h1>
      <p class="subtitle">15种不同风格的狂暴动画效果</p>
      <button class="back-btn" @click="goBack">返回主页</button>
    </header>

    <div class="effects-grid">
      <!-- 效果1：火焰狂暴 -->
      <div class="effect-card">
        <div class="effect-preview">
          <div class="monster-placeholder">
            <div class="effect-container fire-berserk">
              <div class="fire-aura"></div>
              <div class="fire-particles">
                <span v-for="i in 15" :key="i" class="fire-particle"></span>
              </div>
              <div class="fire-core"></div>
            </div>
            <span class="monster-icon">👹</span>
          </div>
        </div>
        <div class="effect-info">
          <h3>🔥 火焰狂暴</h3>
          <p>经典火焰效果，燃烧的怒火</p>
        </div>
      </div>

      <!-- 效果2：雷电狂暴 -->
      <div class="effect-card">
        <div class="effect-preview">
          <div class="monster-placeholder">
            <div class="effect-container lightning-berserk">
              <div class="lightning-field"></div>
              <div class="lightning-bolts">
                <span v-for="i in 6" :key="i" class="lightning-bolt"></span>
              </div>
              <div class="electric-core"></div>
            </div>
            <span class="monster-icon">👾</span>
          </div>
        </div>
        <div class="effect-info">
          <h3>⚡ 雷电狂暴</h3>
          <p>电闪雷鸣，雷霆万钧</p>
        </div>
      </div>

      <!-- 效果3：冰霜狂暴 -->
      <div class="effect-card">
        <div class="effect-preview">
          <div class="monster-placeholder">
            <div class="effect-container ice-berserk">
              <div class="ice-crystal"></div>
              <div class="frost-particles">
                <span v-for="i in 20" :key="i" class="frost-particle"></span>
              </div>
              <div class="blizzard-ring"></div>
            </div>
            <span class="monster-icon">🧟</span>
          </div>
        </div>
        <div class="effect-info">
          <h3>❄️ 冰霜狂暴</h3>
          <p>寒冰刺骨，绝对零度</p>
        </div>
      </div>

      <!-- 效果4：暗影狂暴 -->
      <div class="effect-card">
        <div class="effect-preview">
          <div class="monster-placeholder">
            <div class="effect-container shadow-berserk">
              <div class="shadow-tendrils">
                <span v-for="i in 8" :key="i" class="tendril"></span>
              </div>
              <div class="void-core"></div>
              <div class="dark-aura"></div>
            </div>
            <span class="monster-icon">👻</span>
          </div>
        </div>
        <div class="effect-info">
          <h3>🌑 暗影狂暴</h3>
          <p>深渊之力，吞噬一切</p>
        </div>
      </div>

      <!-- 效果5：毒液狂暴 -->
      <div class="effect-card">
        <div class="effect-preview">
          <div class="monster-placeholder">
            <div class="effect-container poison-berserk">
              <div class="poison-bubbles">
                <span v-for="i in 12" :key="i" class="bubble"></span>
              </div>
              <div class="toxic-fog"></div>
              <div class="poison-drip"></div>
            </div>
            <span class="monster-icon">🦠</span>
          </div>
        </div>
        <div class="effect-info">
          <h3>☠️ 毒液狂暴</h3>
          <p>剧毒弥漫，致命腐蚀</p>
        </div>
      </div>

      <!-- 效果6：神圣狂暴 -->
      <div class="effect-card">
        <div class="effect-preview">
          <div class="monster-placeholder">
            <div class="effect-container holy-berserk">
              <div class="holy-ring"></div>
              <div class="light-rays">
                <span v-for="i in 8" :key="i" class="ray"></span>
              </div>
              <div class="divine-particles">
                <span v-for="i in 16" :key="i" class="divine-particle"></span>
              </div>
            </div>
            <span class="monster-icon">👼</span>
          </div>
        </div>
        <div class="effect-info">
          <h3>✨ 神圣狂暴</h3>
          <p>圣光普照，神圣审判</p>
        </div>
      </div>

      <!-- 效果7：血腥狂暴 -->
      <div class="effect-card">
        <div class="effect-preview">
          <div class="monster-placeholder">
            <div class="effect-container blood-berserk">
              <div class="blood-pool"></div>
              <div class="blood-splatter">
                <span v-for="i in 10" :key="i" class="splatter"></span>
              </div>
              <div class="vein-pulse"></div>
            </div>
            <span class="monster-icon">🧛</span>
          </div>
        </div>
        <div class="effect-info">
          <h3>🩸 血腥狂暴</h3>
          <p>鲜血献祭，嗜血狂怒</p>
        </div>
      </div>

      <!-- 效果8：混沌狂暴 -->
      <div class="effect-card">
        <div class="effect-preview">
          <div class="monster-placeholder">
            <div class="effect-container chaos-berserk">
              <div class="chaos-vortex"></div>
              <div class="chaos-shards">
                <span v-for="i in 12" :key="i" class="shard"></span>
              </div>
              <div class="reality-crack"></div>
            </div>
            <span class="monster-icon">🌀</span>
          </div>
        </div>
        <div class="effect-info">
          <h3>🌀 混沌狂暴</h3>
          <p>时空撕裂，混沌降临</p>
        </div>
      </div>

      <!-- 效果9：星辰狂暴 -->
      <div class="effect-card">
        <div class="effect-preview">
          <div class="monster-placeholder">
            <div class="effect-container stellar-berserk">
              <div class="star-field">
                <span v-for="i in 20" :key="i" class="star"></span>
              </div>
              <div class="cosmic-ring"></div>
              <div class="nebula"></div>
            </div>
            <span class="monster-icon">🌟</span>
          </div>
        </div>
        <div class="effect-info">
          <h3>⭐ 星辰狂暴</h3>
          <p>星光璀璨，宇宙之力</p>
        </div>
      </div>

      <!-- 效果10：狂战狂暴 -->
      <div class="effect-card">
        <div class="effect-preview">
          <div class="monster-placeholder">
            <div class="effect-container warrior-berserk">
              <div class="rage-aura"></div>
              <div class="battle-scars">
                <span v-for="i in 6" :key="i" class="scar"></span>
              </div>
              <div class="power-surge">
                <span v-for="i in 8" :key="i" class="surge-line"></span>
              </div>
            </div>
            <span class="monster-icon">⚔️</span>
          </div>
        </div>
        <div class="effect-info">
          <h3>💪 狂战狂暴</h3>
          <p>战意高昂，势不可挡</p>
        </div>
      </div>

      <!-- 效果11：地狱火狂暴 -->
      <div class="effect-card">
        <div class="effect-preview">
          <div class="monster-placeholder">
            <div class="effect-container hellfire-berserk">
              <div class="hellfire-ground"></div>
              <div class="hellfire-pillars">
                <span v-for="i in 6" :key="i" class="pillar"></span>
              </div>
              <div class="hellfire-core"></div>
            </div>
            <span class="monster-icon">😈</span>
          </div>
        </div>
        <div class="effect-info">
          <h3>🔥 地狱火狂暴</h3>
          <p>地狱烈焰，焚尽一切</p>
        </div>
      </div>

      <!-- 效果12：风暴狂暴 -->
      <div class="effect-card">
        <div class="effect-preview">
          <div class="monster-placeholder">
            <div class="effect-container storm-berserk">
              <div class="tornado"></div>
              <div class="wind-blades">
                <span v-for="i in 8" :key="i" class="wind-blade"></span>
              </div>
              <div class="storm-eye"></div>
            </div>
            <span class="monster-icon">🌪️</span>
          </div>
        </div>
        <div class="effect-info">
          <h3>🌪️ 风暴狂暴</h3>
          <p>狂风呼啸，毁灭风暴</p>
        </div>
      </div>

      <!-- 效果13：熔岩狂暴 -->
      <div class="effect-card">
        <div class="effect-preview">
          <div class="monster-placeholder">
            <div class="effect-container lava-berserk">
              <div class="lava-pool"></div>
              <div class="lava-geyser">
                <span v-for="i in 5" :key="i" class="geyser"></span>
              </div>
              <div class="magma-chunks">
                <span v-for="i in 8" :key="i" class="chunk"></span>
              </div>
            </div>
            <span class="monster-icon">🌋</span>
          </div>
        </div>
        <div class="effect-info">
          <h3>🌋 熔岩狂暴</h3>
          <p>地心之火，熔岩喷涌</p>
        </div>
      </div>

      <!-- 效果14：虚空狂暴 -->
      <div class="effect-card">
        <div class="effect-preview">
          <div class="monster-placeholder">
            <div class="effect-container void-berserk">
              <div class="void-singularity"></div>
              <div class="void-rifts">
                <span v-for="i in 4" :key="i" class="rift"></span>
              </div>
              <div class="void-particles">
                <span v-for="i in 15" :key="i" class="void-particle"></span>
              </div>
            </div>
            <span class="monster-icon">🕳️</span>
          </div>
        </div>
        <div class="effect-info">
          <h3>🕳️ 虚空狂暴</h3>
          <p>虚空之力，万物归零</p>
        </div>
      </div>

      <!-- 效果15：死亡狂暴 -->
      <div class="effect-card">
        <div class="effect-preview">
          <div class="monster-placeholder">
            <div class="effect-container death-berserk">
              <div class="death-aura"></div>
              <div class="skull-spirits">
                <span v-for="i in 6" :key="i" class="skull-spirit"></span>
              </div>
              <div class="reaper-scythe"></div>
            </div>
            <span class="monster-icon">💀</span>
          </div>
        </div>
        <div class="effect-info">
          <h3>💀 死亡狂暴</h3>
          <p>死亡气息，收割灵魂</p>
        </div>
      </div>
    </div>

    <div class="showcase-footer">
      <p>所有效果实时展示中</p>
    </div>
  </div>
</template>

<script setup>
/**
 * 狂暴效果展示页面
 * 展示10种不同风格的狂暴动画效果（直接展示，无需点击）
 */
import { useRouter } from 'vue-router'

const router = useRouter()

/**
 * 返回主页
 */
function goBack () {
  router.push('/main')
}
</script>

<style scoped>
.effects-showcase {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
  box-sizing: border-box;
}

.showcase-header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.showcase-header h1 {
  font-size: 2.5rem;
  color: #e94560;
  text-shadow: 0 0 20px rgba(233, 69, 96, 0.5);
  margin-bottom: 10px;
}

.subtitle {
  color: #a0a0a0;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.back-btn {
  padding: 10px 25px;
  background: linear-gradient(135deg, #e94560, #c62a4a);
  border: none;
  border-radius: 25px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 20px rgba(233, 69, 96, 0.4);
}

.effects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  max-width: 1400px;
  margin: 0 auto;
}

.effect-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.effect-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.effect-preview {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  margin-bottom: 15px;
  position: relative;
  overflow: hidden;
}

.monster-placeholder {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  position: relative;
}

.monster-icon {
  position: relative;
  z-index: 10;
}

.effect-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  pointer-events: none;
}

.effect-info h3 {
  color: #ffffff;
  font-size: 1.2rem;
  margin-bottom: 5px;
}

.effect-info p {
  color: #888;
  font-size: 0.9rem;
}

.showcase-footer {
  text-align: center;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.showcase-footer p {
  color: #888;
}

/* ============ 效果1：火焰狂暴 ============ */
.fire-berserk .fire-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(255, 100, 0, 0.8) 0%, rgba(255, 50, 0, 0.4) 40%, transparent 70%);
  border-radius: 50%;
  animation: fireAura 1s ease-in-out infinite alternate;
}

@keyframes fireAura {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
}

.fire-berserk .fire-particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.fire-berserk .fire-particle {
  position: absolute;
  bottom: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  background: #ff6600;
  border-radius: 50%;
  animation: fireParticle 1.5s ease-out infinite;
}

.fire-berserk .fire-particle:nth-child(1) { animation-delay: 0s; left: 30%; }
.fire-berserk .fire-particle:nth-child(2) { animation-delay: 0.1s; left: 40%; }
.fire-berserk .fire-particle:nth-child(3) { animation-delay: 0.2s; left: 50%; }
.fire-berserk .fire-particle:nth-child(4) { animation-delay: 0.3s; left: 60%; }
.fire-berserk .fire-particle:nth-child(5) { animation-delay: 0.4s; left: 70%; }
.fire-berserk .fire-particle:nth-child(6) { animation-delay: 0.5s; left: 35%; }
.fire-berserk .fire-particle:nth-child(7) { animation-delay: 0.6s; left: 45%; }
.fire-berserk .fire-particle:nth-child(8) { animation-delay: 0.7s; left: 55%; }
.fire-berserk .fire-particle:nth-child(9) { animation-delay: 0.8s; left: 65%; }
.fire-berserk .fire-particle:nth-child(10) { animation-delay: 0.9s; left: 38%; }
.fire-berserk .fire-particle:nth-child(11) { animation-delay: 1s; left: 48%; }
.fire-berserk .fire-particle:nth-child(12) { animation-delay: 1.1s; left: 58%; }
.fire-berserk .fire-particle:nth-child(13) { animation-delay: 1.2s; left: 42%; }
.fire-berserk .fire-particle:nth-child(14) { animation-delay: 1.3s; left: 52%; }
.fire-berserk .fire-particle:nth-child(15) { animation-delay: 1.4s; left: 62%; }

@keyframes fireParticle {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-60px) scale(0); opacity: 0; }
}

.fire-berserk .fire-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  background: radial-gradient(circle, #ffff00 0%, #ff6600 50%, transparent 70%);
  border-radius: 50%;
  animation: fireCore 0.5s ease-in-out infinite alternate;
}

@keyframes fireCore {
  0% { transform: translate(-50%, -50%) scale(1); }
  100% { transform: translate(-50%, -50%) scale(1.2); }
}

/* ============ 效果2：雷电狂暴 ============ */
.lightning-berserk .lightning-field {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(100, 149, 237, 0.6) 0%, rgba(138, 43, 226, 0.3) 50%, transparent 70%);
  border-radius: 50%;
  animation: lightningField 0.3s ease-in-out infinite alternate;
}

@keyframes lightningField {
  0% { opacity: 0.6; }
  100% { opacity: 1; }
}

.lightning-berserk .lightning-bolts {
  position: absolute;
  width: 100%;
  height: 100%;
}

.lightning-berserk .lightning-bolt {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 50px;
  background: linear-gradient(to bottom, #00ffff, #6495ed);
  animation: lightningBolt 0.2s ease-in-out infinite;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  transform-origin: center top;
}

.lightning-berserk .lightning-bolt:nth-child(1) { transform: rotate(0deg) translateY(-25px); animation-delay: 0s; }
.lightning-berserk .lightning-bolt:nth-child(2) { transform: rotate(60deg) translateY(-25px); animation-delay: 0.05s; }
.lightning-berserk .lightning-bolt:nth-child(3) { transform: rotate(120deg) translateY(-25px); animation-delay: 0.1s; }
.lightning-berserk .lightning-bolt:nth-child(4) { transform: rotate(180deg) translateY(-25px); animation-delay: 0.15s; }
.lightning-berserk .lightning-bolt:nth-child(5) { transform: rotate(240deg) translateY(-25px); animation-delay: 0.2s; }
.lightning-berserk .lightning-bolt:nth-child(6) { transform: rotate(300deg) translateY(-25px); animation-delay: 0.25s; }

@keyframes lightningBolt {
  0%, 100% { opacity: 0.3; height: 50px; }
  50% { opacity: 1; height: 60px; }
}

.lightning-berserk .electric-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: #00ffff;
  border-radius: 50%;
  box-shadow: 0 0 20px #00ffff, 0 0 40px #6495ed;
  animation: electricCore 0.1s ease-in-out infinite;
}

@keyframes electricCore {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.3); }
}

/* ============ 效果3：冰霜狂暴 ============ */
.ice-berserk .ice-crystal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, rgba(173, 216, 230, 0.8) 0%, rgba(135, 206, 235, 0.4) 50%, transparent 70%);
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: iceCrystal 2s linear infinite;
}

@keyframes iceCrystal {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

.ice-berserk .frost-particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.ice-berserk .frost-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #add8e6;
  border-radius: 50%;
  animation: frostFloat 3s linear infinite;
}

.ice-berserk .frost-particle:nth-child(odd) {
  background: #87ceeb;
}

.ice-berserk .frost-particle:nth-child(1) { top: 10%; left: 20%; animation-delay: 0s; }
.ice-berserk .frost-particle:nth-child(2) { top: 20%; left: 80%; animation-delay: 0.2s; }
.ice-berserk .frost-particle:nth-child(3) { top: 30%; left: 40%; animation-delay: 0.4s; }
.ice-berserk .frost-particle:nth-child(4) { top: 40%; left: 60%; animation-delay: 0.6s; }
.ice-berserk .frost-particle:nth-child(5) { top: 50%; left: 10%; animation-delay: 0.8s; }
.ice-berserk .frost-particle:nth-child(6) { top: 60%; left: 90%; animation-delay: 1s; }
.ice-berserk .frost-particle:nth-child(7) { top: 70%; left: 30%; animation-delay: 1.2s; }
.ice-berserk .frost-particle:nth-child(8) { top: 80%; left: 70%; animation-delay: 1.4s; }
.ice-berserk .frost-particle:nth-child(9) { top: 15%; left: 50%; animation-delay: 1.6s; }
.ice-berserk .frost-particle:nth-child(10) { top: 85%; left: 45%; animation-delay: 1.8s; }
.ice-berserk .frost-particle:nth-child(11) { top: 25%; left: 15%; animation-delay: 0.1s; }
.ice-berserk .frost-particle:nth-child(12) { top: 35%; left: 85%; animation-delay: 0.3s; }
.ice-berserk .frost-particle:nth-child(13) { top: 45%; left: 25%; animation-delay: 0.5s; }
.ice-berserk .frost-particle:nth-child(14) { top: 55%; left: 75%; animation-delay: 0.7s; }
.ice-berserk .frost-particle:nth-child(15) { top: 65%; left: 55%; animation-delay: 0.9s; }
.ice-berserk .frost-particle:nth-child(16) { top: 75%; left: 35%; animation-delay: 1.1s; }
.ice-berserk .frost-particle:nth-child(17) { top: 5%; left: 65%; animation-delay: 1.3s; }
.ice-berserk .frost-particle:nth-child(18) { top: 95%; left: 25%; animation-delay: 1.5s; }
.ice-berserk .frost-particle:nth-child(19) { top: 45%; left: 5%; animation-delay: 1.7s; }
.ice-berserk .frost-particle:nth-child(20) { top: 55%; left: 95%; animation-delay: 1.9s; }

@keyframes frostFloat {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(-30px) rotate(180deg); opacity: 0; }
}

.ice-berserk .blizzard-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border: 3px solid rgba(173, 216, 230, 0.5);
  border-radius: 50%;
  animation: blizzardRing 1s linear infinite;
}

@keyframes blizzardRing {
  0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 0.5; }
  50% { opacity: 1; }
  100% { transform: translate(-50%, -50%) rotate(360deg) scale(1.2); opacity: 0.5; }
}

/* ============ 效果4：暗影狂暴 ============ */
.shadow-berserk .shadow-tendrils {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shadow-berserk .tendril {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 40px;
  background: linear-gradient(to top, transparent, #4a0080, #1a0033);
  border-radius: 2px;
  transform-origin: center bottom;
  animation: tendrilGrow 1.5s ease-in-out infinite;
}

.shadow-berserk .tendril:nth-child(1) { transform: rotate(0deg) translateY(-20px); animation-delay: 0s; }
.shadow-berserk .tendril:nth-child(2) { transform: rotate(45deg) translateY(-20px); animation-delay: 0.1s; }
.shadow-berserk .tendril:nth-child(3) { transform: rotate(90deg) translateY(-20px); animation-delay: 0.2s; }
.shadow-berserk .tendril:nth-child(4) { transform: rotate(135deg) translateY(-20px); animation-delay: 0.3s; }
.shadow-berserk .tendril:nth-child(5) { transform: rotate(180deg) translateY(-20px); animation-delay: 0.4s; }
.shadow-berserk .tendril:nth-child(6) { transform: rotate(225deg) translateY(-20px); animation-delay: 0.5s; }
.shadow-berserk .tendril:nth-child(7) { transform: rotate(270deg) translateY(-20px); animation-delay: 0.6s; }
.shadow-berserk .tendril:nth-child(8) { transform: rotate(315deg) translateY(-20px); animation-delay: 0.7s; }

@keyframes tendrilGrow {
  0%, 100% { height: 40px; opacity: 0.5; }
  50% { height: 55px; opacity: 1; }
}

.shadow-berserk .void-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 25px;
  height: 25px;
  background: radial-gradient(circle, #000000 0%, #4a0080 50%, transparent 70%);
  border-radius: 50%;
  animation: voidPulse 1s ease-in-out infinite;
}

@keyframes voidPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 10px #4a0080; }
  50% { transform: translate(-50%, -50%) scale(1.3); box-shadow: 0 0 30px #4a0080; }
}

.shadow-berserk .dark-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90px;
  height: 90px;
  background: radial-gradient(circle, transparent 30%, rgba(74, 0, 128, 0.3) 60%, transparent 70%);
  border-radius: 50%;
  animation: darkAura 2s ease-in-out infinite;
}

@keyframes darkAura {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
}

/* ============ 效果5：毒液狂暴 ============ */
.poison-berserk .poison-bubbles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.poison-berserk .bubble {
  position: absolute;
  bottom: 30%;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle at 30% 30%, #90ee90, #32cd32, #006400);
  border-radius: 50%;
  animation: bubbleRise 2s ease-in-out infinite;
}

.poison-berserk .bubble:nth-child(1) { left: 20%; animation-delay: 0s; }
.poison-berserk .bubble:nth-child(2) { left: 30%; animation-delay: 0.2s; }
.poison-berserk .bubble:nth-child(3) { left: 40%; animation-delay: 0.4s; }
.poison-berserk .bubble:nth-child(4) { left: 50%; animation-delay: 0.6s; }
.poison-berserk .bubble:nth-child(5) { left: 60%; animation-delay: 0.8s; }
.poison-berserk .bubble:nth-child(6) { left: 70%; animation-delay: 1s; }
.poison-berserk .bubble:nth-child(7) { left: 25%; animation-delay: 1.2s; }
.poison-berserk .bubble:nth-child(8) { left: 35%; animation-delay: 1.4s; }
.poison-berserk .bubble:nth-child(9) { left: 45%; animation-delay: 1.6s; }
.poison-berserk .bubble:nth-child(10) { left: 55%; animation-delay: 1.8s; }
.poison-berserk .bubble:nth-child(11) { left: 65%; animation-delay: 0.3s; }
.poison-berserk .bubble:nth-child(12) { left: 75%; animation-delay: 0.7s; }

@keyframes bubbleRise {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
}

.poison-berserk .toxic-fog {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(50, 205, 50, 0.4) 0%, rgba(0, 100, 0, 0.2) 50%, transparent 70%);
  border-radius: 50%;
  animation: toxicFog 1.5s ease-in-out infinite alternate;
}

@keyframes toxicFog {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
}

.poison-berserk .poison-drip {
  position: absolute;
  top: 60%;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 15px;
  background: linear-gradient(to bottom, #32cd32, transparent);
  border-radius: 0 0 2px 2px;
  animation: poisonDrip 1s ease-in infinite;
}

@keyframes poisonDrip {
  0% { height: 0; opacity: 1; }
  50% { height: 15px; opacity: 1; }
  100% { height: 15px; opacity: 0; transform: translateX(-50%) translateY(20px); }
}

/* ============ 效果6：神圣狂暴 ============ */
.holy-berserk .holy-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border: 3px solid rgba(255, 215, 0, 0.6);
  border-radius: 50%;
  animation: holyRing 2s linear infinite;
}

@keyframes holyRing {
  0% { transform: translate(-50%, -50%) rotate(0deg); box-shadow: 0 0 10px #ffd700; }
  50% { box-shadow: 0 0 20px #ffd700; }
  100% { transform: translate(-50%, -50%) rotate(360deg); box-shadow: 0 0 10px #ffd700; }
}

.holy-berserk .light-rays {
  position: absolute;
  width: 100%;
  height: 100%;
}

.holy-berserk .ray {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 50px;
  background: linear-gradient(to top, transparent, #ffd700);
  transform-origin: center bottom;
  animation: rayGlow 1s ease-in-out infinite;
}

.holy-berserk .ray:nth-child(1) { transform: rotate(0deg) translateY(-25px); }
.holy-berserk .ray:nth-child(2) { transform: rotate(45deg) translateY(-25px); animation-delay: 0.1s; }
.holy-berserk .ray:nth-child(3) { transform: rotate(90deg) translateY(-25px); animation-delay: 0.2s; }
.holy-berserk .ray:nth-child(4) { transform: rotate(135deg) translateY(-25px); animation-delay: 0.3s; }
.holy-berserk .ray:nth-child(5) { transform: rotate(180deg) translateY(-25px); animation-delay: 0.4s; }
.holy-berserk .ray:nth-child(6) { transform: rotate(225deg) translateY(-25px); animation-delay: 0.5s; }
.holy-berserk .ray:nth-child(7) { transform: rotate(270deg) translateY(-25px); animation-delay: 0.6s; }
.holy-berserk .ray:nth-child(8) { transform: rotate(315deg) translateY(-25px); animation-delay: 0.7s; }

@keyframes rayGlow {
  0%, 100% { opacity: 0.3; height: 50px; }
  50% { opacity: 1; height: 60px; }
}

.holy-berserk .divine-particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.holy-berserk .divine-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #ffd700;
  border-radius: 50%;
  box-shadow: 0 0 5px #ffd700;
  animation: divineFloat 2s ease-in-out infinite;
}

.holy-berserk .divine-particle:nth-child(1) { top: 20%; left: 30%; animation-delay: 0s; }
.holy-berserk .divine-particle:nth-child(2) { top: 30%; left: 70%; animation-delay: 0.15s; }
.holy-berserk .divine-particle:nth-child(3) { top: 40%; left: 20%; animation-delay: 0.3s; }
.holy-berserk .divine-particle:nth-child(4) { top: 50%; left: 80%; animation-delay: 0.45s; }
.holy-berserk .divine-particle:nth-child(5) { top: 60%; left: 40%; animation-delay: 0.6s; }
.holy-berserk .divine-particle:nth-child(6) { top: 70%; left: 60%; animation-delay: 0.75s; }
.holy-berserk .divine-particle:nth-child(7) { top: 80%; left: 35%; animation-delay: 0.9s; }
.holy-berserk .divine-particle:nth-child(8) { top: 15%; left: 55%; animation-delay: 1.05s; }
.holy-berserk .divine-particle:nth-child(9) { top: 25%; left: 45%; animation-delay: 1.2s; }
.holy-berserk .divine-particle:nth-child(10) { top: 35%; left: 65%; animation-delay: 1.35s; }
.holy-berserk .divine-particle:nth-child(11) { top: 45%; left: 25%; animation-delay: 0.08s; }
.holy-berserk .divine-particle:nth-child(12) { top: 55%; left: 75%; animation-delay: 0.23s; }
.holy-berserk .divine-particle:nth-child(13) { top: 65%; left: 50%; animation-delay: 0.38s; }
.holy-berserk .divine-particle:nth-child(14) { top: 75%; left: 45%; animation-delay: 0.53s; }
.holy-berserk .divine-particle:nth-child(15) { top: 85%; left: 55%; animation-delay: 0.68s; }
.holy-berserk .divine-particle:nth-child(16) { top: 10%; left: 40%; animation-delay: 0.83s; }

@keyframes divineFloat {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
  50% { transform: translateY(-10px) scale(1.2); opacity: 1; }
}

/* ============ 效果7：血腥狂暴 ============ */
.blood-berserk .blood-pool {
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 20px;
  background: radial-gradient(ellipse, rgba(139, 0, 0, 0.8) 0%, rgba(139, 0, 0, 0.4) 50%, transparent 70%);
  border-radius: 50%;
  animation: bloodPool 1s ease-in-out infinite alternate;
}

@keyframes bloodPool {
  0% { transform: translateX(-50%) scale(1); }
  100% { transform: translateX(-50%) scale(1.2); }
}

.blood-berserk .blood-splatter {
  position: absolute;
  width: 100%;
  height: 100%;
}

.blood-berserk .splatter {
  position: absolute;
  width: 6px;
  height: 6px;
  background: #8b0000;
  border-radius: 50%;
  animation: splatter 0.5s ease-out infinite;
}

.blood-berserk .splatter:nth-child(1) { top: 40%; left: 30%; animation-delay: 0s; }
.blood-berserk .splatter:nth-child(2) { top: 35%; left: 70%; animation-delay: 0.1s; }
.blood-berserk .splatter:nth-child(3) { top: 45%; left: 25%; animation-delay: 0.2s; }
.blood-berserk .splatter:nth-child(4) { top: 50%; left: 75%; animation-delay: 0.3s; }
.blood-berserk .splatter:nth-child(5) { top: 55%; left: 35%; animation-delay: 0.4s; }
.blood-berserk .splatter:nth-child(6) { top: 60%; left: 65%; animation-delay: 0.5s; }
.blood-berserk .splatter:nth-child(7) { top: 30%; left: 40%; animation-delay: 0.6s; }
.blood-berserk .splatter:nth-child(8) { top: 65%; left: 45%; animation-delay: 0.7s; }
.blood-berserk .splatter:nth-child(9) { top: 25%; left: 55%; animation-delay: 0.8s; }
.blood-berserk .splatter:nth-child(10) { top: 70%; left: 50%; animation-delay: 0.9s; }

@keyframes splatter {
  0% { transform: scale(0); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.8; }
  100% { transform: scale(0); opacity: 0; }
}

.blood-berserk .vein-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border: 2px solid rgba(139, 0, 0, 0.6);
  border-radius: 50%;
  animation: veinPulse 0.8s ease-in-out infinite;
}

@keyframes veinPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
}

/* ============ 效果8：混沌狂暴 ============ */
.chaos-berserk .chaos-vortex {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70px;
  height: 70px;
  border: 3px dashed rgba(128, 0, 128, 0.6);
  border-radius: 50%;
  animation: chaosVortex 1s linear infinite;
}

@keyframes chaosVortex {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(-360deg); }
}

.chaos-berserk .chaos-shards {
  position: absolute;
  width: 100%;
  height: 100%;
}

.chaos-berserk .shard {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 15px solid rgba(128, 0, 128, 0.7);
  transform-origin: center center;
  animation: shardFloat 2s ease-in-out infinite;
}

.chaos-berserk .shard:nth-child(1) { transform: rotate(0deg) translate(30px, -10px); animation-delay: 0s; }
.chaos-berserk .shard:nth-child(2) { transform: rotate(30deg) translate(30px, -10px); animation-delay: 0.15s; }
.chaos-berserk .shard:nth-child(3) { transform: rotate(60deg) translate(30px, -10px); animation-delay: 0.3s; }
.chaos-berserk .shard:nth-child(4) { transform: rotate(90deg) translate(30px, -10px); animation-delay: 0.45s; }
.chaos-berserk .shard:nth-child(5) { transform: rotate(120deg) translate(30px, -10px); animation-delay: 0.6s; }
.chaos-berserk .shard:nth-child(6) { transform: rotate(150deg) translate(30px, -10px); animation-delay: 0.75s; }
.chaos-berserk .shard:nth-child(7) { transform: rotate(180deg) translate(30px, -10px); animation-delay: 0.9s; }
.chaos-berserk .shard:nth-child(8) { transform: rotate(210deg) translate(30px, -10px); animation-delay: 1.05s; }
.chaos-berserk .shard:nth-child(9) { transform: rotate(240deg) translate(30px, -10px); animation-delay: 1.2s; }
.chaos-berserk .shard:nth-child(10) { transform: rotate(270deg) translate(30px, -10px); animation-delay: 1.35s; }
.chaos-berserk .shard:nth-child(11) { transform: rotate(300deg) translate(30px, -10px); animation-delay: 1.5s; }
.chaos-berserk .shard:nth-child(12) { transform: rotate(330deg) translate(30px, -10px); animation-delay: 1.65s; }

@keyframes shardFloat {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.chaos-berserk .reality-crack {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  background: 
    linear-gradient(45deg, transparent 45%, rgba(255, 0, 255, 0.8) 45%, rgba(255, 0, 255, 0.8) 55%, transparent 55%),
    linear-gradient(-45deg, transparent 45%, rgba(0, 255, 255, 0.8) 45%, rgba(0, 255, 255, 0.8) 55%, transparent 55%);
  animation: realityCrack 0.3s ease-in-out infinite;
}

@keyframes realityCrack {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

/* ============ 效果9：星辰狂暴 ============ */
.stellar-berserk .star-field {
  position: absolute;
  width: 100%;
  height: 100%;
}

.stellar-berserk .star {
  position: absolute;
  width: 3px;
  height: 3px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 5px #ffffff;
  animation: starTwinkle 1s ease-in-out infinite;
}

.stellar-berserk .star:nth-child(1) { top: 15%; left: 25%; animation-delay: 0s; }
.stellar-berserk .star:nth-child(2) { top: 25%; left: 75%; animation-delay: 0.1s; }
.stellar-berserk .star:nth-child(3) { top: 35%; left: 15%; animation-delay: 0.2s; }
.stellar-berserk .star:nth-child(4) { top: 45%; left: 85%; animation-delay: 0.3s; }
.stellar-berserk .star:nth-child(5) { top: 55%; left: 35%; animation-delay: 0.4s; }
.stellar-berserk .star:nth-child(6) { top: 65%; left: 65%; animation-delay: 0.5s; }
.stellar-berserk .star:nth-child(7) { top: 75%; left: 45%; animation-delay: 0.6s; }
.stellar-berserk .star:nth-child(8) { top: 85%; left: 55%; animation-delay: 0.7s; }
.stellar-berserk .star:nth-child(9) { top: 20%; left: 50%; animation-delay: 0.15s; }
.stellar-berserk .star:nth-child(10) { top: 80%; left: 30%; animation-delay: 0.25s; }
.stellar-berserk .star:nth-child(11) { top: 30%; left: 60%; animation-delay: 0.35s; }
.stellar-berserk .star:nth-child(12) { top: 70%; left: 40%; animation-delay: 0.45s; }
.stellar-berserk .star:nth-child(13) { top: 10%; left: 70%; animation-delay: 0.55s; }
.stellar-berserk .star:nth-child(14) { top: 90%; left: 20%; animation-delay: 0.65s; }
.stellar-berserk .star:nth-child(15) { top: 40%; left: 10%; animation-delay: 0.12s; }
.stellar-berserk .star:nth-child(16) { top: 60%; left: 90%; animation-delay: 0.22s; }
.stellar-berserk .star:nth-child(17) { top: 5%; left: 40%; animation-delay: 0.32s; }
.stellar-berserk .star:nth-child(18) { top: 95%; left: 60%; animation-delay: 0.42s; }
.stellar-berserk .star:nth-child(19) { top: 50%; left: 5%; animation-delay: 0.52s; }
.stellar-berserk .star:nth-child(20) { top: 50%; left: 95%; animation-delay: 0.62s; }

@keyframes starTwinkle {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.5); opacity: 1; }
}

.stellar-berserk .cosmic-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  animation: cosmicRing 3s linear infinite;
}

@keyframes cosmicRing {
  0% { transform: translate(-50%, -50%) rotate(0deg); border-color: rgba(255, 215, 0, 0.4); }
  25% { border-color: rgba(0, 255, 255, 0.4); }
  50% { border-color: rgba(255, 0, 255, 0.4); }
  75% { border-color: rgba(0, 255, 0, 0.4); }
  100% { transform: translate(-50%, -50%) rotate(360deg); border-color: rgba(255, 215, 0, 0.4); }
}

.stellar-berserk .nebula {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, rgba(138, 43, 226, 0.4) 0%, rgba(75, 0, 130, 0.2) 50%, transparent 70%);
  border-radius: 50%;
  animation: nebula 2s ease-in-out infinite;
}

@keyframes nebula {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
}

/* ============ 效果10：狂战狂暴 ============ */
.warrior-berserk .rage-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90px;
  height: 90px;
  background: radial-gradient(circle, rgba(255, 69, 0, 0.6) 0%, rgba(255, 140, 0, 0.3) 50%, transparent 70%);
  border-radius: 50%;
  animation: rageAura 0.5s ease-in-out infinite alternate;
}

@keyframes rageAura {
  0% { transform: translate(-50%, -50%) scale(1); }
  100% { transform: translate(-50%, -50%) scale(1.15); }
}

.warrior-berserk .battle-scars {
  position: absolute;
  width: 100%;
  height: 100%;
}

.warrior-berserk .scar {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff4500, transparent);
  transform-origin: center;
  animation: scarGlow 0.8s ease-in-out infinite;
}

.warrior-berserk .scar:nth-child(1) { transform: rotate(0deg) translate(-10px, -15px); animation-delay: 0s; }
.warrior-berserk .scar:nth-child(2) { transform: rotate(60deg) translate(-10px, -15px); animation-delay: 0.1s; }
.warrior-berserk .scar:nth-child(3) { transform: rotate(120deg) translate(-10px, -15px); animation-delay: 0.2s; }
.warrior-berserk .scar:nth-child(4) { transform: rotate(180deg) translate(-10px, -15px); animation-delay: 0.3s; }
.warrior-berserk .scar:nth-child(5) { transform: rotate(240deg) translate(-10px, -15px); animation-delay: 0.4s; }
.warrior-berserk .scar:nth-child(6) { transform: rotate(300deg) translate(-10px, -15px); animation-delay: 0.5s; }

@keyframes scarGlow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.warrior-berserk .power-surge {
  position: absolute;
  width: 100%;
  height: 100%;
}

.warrior-berserk .surge-line {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 40px;
  background: linear-gradient(to top, transparent, #ff4500);
  transform-origin: center bottom;
  animation: surgeUp 0.6s ease-out infinite;
}

.warrior-berserk .surge-line:nth-child(1) { transform: rotate(0deg) translateY(-20px); animation-delay: 0s; }
.warrior-berserk .surge-line:nth-child(2) { transform: rotate(45deg) translateY(-20px); animation-delay: 0.08s; }
.warrior-berserk .surge-line:nth-child(3) { transform: rotate(90deg) translateY(-20px); animation-delay: 0.16s; }
.warrior-berserk .surge-line:nth-child(4) { transform: rotate(135deg) translateY(-20px); animation-delay: 0.24s; }
.warrior-berserk .surge-line:nth-child(5) { transform: rotate(180deg) translateY(-20px); animation-delay: 0.32s; }
.warrior-berserk .surge-line:nth-child(6) { transform: rotate(225deg) translateY(-20px); animation-delay: 0.4s; }
.warrior-berserk .surge-line:nth-child(7) { transform: rotate(270deg) translateY(-20px); animation-delay: 0.48s; }
.warrior-berserk .surge-line:nth-child(8) { transform: rotate(315deg) translateY(-20px); animation-delay: 0.56s; }

@keyframes surgeUp {
  0% { height: 0; opacity: 1; }
  100% { height: 40px; opacity: 0; }
}

/* ============ 效果11：地狱火狂暴 ============ */
.hellfire-berserk .hellfire-ground {
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  width: 90px;
  height: 25px;
  background: radial-gradient(ellipse, rgba(255, 50, 0, 0.9) 0%, rgba(139, 0, 0, 0.5) 50%, transparent 70%);
  border-radius: 50%;
  animation: hellfireGround 0.5s ease-in-out infinite alternate;
}

@keyframes hellfireGround {
  0% { transform: translateX(-50%) scaleX(1); }
  100% { transform: translateX(-50%) scaleX(1.2); }
}

.hellfire-berserk .hellfire-pillars {
  position: absolute;
  width: 100%;
  height: 100%;
}

.hellfire-berserk .pillar {
  position: absolute;
  bottom: 25%;
  width: 8px;
  height: 40px;
  background: linear-gradient(to top, #ff4500, #ff6600, #ffff00, transparent);
  border-radius: 4px 4px 0 0;
  animation: pillarFlame 0.8s ease-in-out infinite;
}

.hellfire-berserk .pillar:nth-child(1) { left: 25%; animation-delay: 0s; }
.hellfire-berserk .pillar:nth-child(2) { left: 35%; animation-delay: 0.15s; }
.hellfire-berserk .pillar:nth-child(3) { left: 50%; animation-delay: 0.3s; }
.hellfire-berserk .pillar:nth-child(4) { left: 65%; animation-delay: 0.45s; }
.hellfire-berserk .pillar:nth-child(5) { left: 40%; animation-delay: 0.6s; }
.hellfire-berserk .pillar:nth-child(6) { left: 60%; animation-delay: 0.75s; }

@keyframes pillarFlame {
  0%, 100% { height: 40px; opacity: 0.7; }
  50% { height: 55px; opacity: 1; }
}

.hellfire-berserk .hellfire-core {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 25px;
  height: 25px;
  background: radial-gradient(circle, #ffff00 0%, #ff4500 50%, transparent 70%);
  border-radius: 50%;
  box-shadow: 0 0 20px #ff4500, 0 0 40px #ff6600;
  animation: hellfireCore 1s ease-in-out infinite;
}

@keyframes hellfireCore {
  0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  50% { transform: translate(-50%, -50%) scale(1.3) rotate(180deg); }
}

/* ============ 效果12：风暴狂暴 ============ */
.storm-berserk .tornado {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 80px;
  background: conic-gradient(from 0deg, rgba(150, 150, 150, 0.3), rgba(100, 100, 100, 0.5), rgba(150, 150, 150, 0.3));
  clip-path: polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%);
  animation: tornadoSpin 0.5s linear infinite;
}

@keyframes tornadoSpin {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

.storm-berserk .wind-blades {
  position: absolute;
  width: 100%;
  height: 100%;
}

.storm-berserk .wind-blade {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 35px;
  background: linear-gradient(to top, transparent, rgba(200, 200, 200, 0.8));
  transform-origin: center center;
  animation: windBladeSpin 1s linear infinite;
}

.storm-berserk .wind-blade:nth-child(1) { transform: rotate(0deg) translateX(40px); animation-delay: 0s; }
.storm-berserk .wind-blade:nth-child(2) { transform: rotate(45deg) translateX(40px); animation-delay: 0.1s; }
.storm-berserk .wind-blade:nth-child(3) { transform: rotate(90deg) translateX(40px); animation-delay: 0.2s; }
.storm-berserk .wind-blade:nth-child(4) { transform: rotate(135deg) translateX(40px); animation-delay: 0.3s; }
.storm-berserk .wind-blade:nth-child(5) { transform: rotate(180deg) translateX(40px); animation-delay: 0.4s; }
.storm-berserk .wind-blade:nth-child(6) { transform: rotate(225deg) translateX(40px); animation-delay: 0.5s; }
.storm-berserk .wind-blade:nth-child(7) { transform: rotate(270deg) translateX(40px); animation-delay: 0.6s; }
.storm-berserk .wind-blade:nth-child(8) { transform: rotate(315deg) translateX(40px); animation-delay: 0.7s; }

@keyframes windBladeSpin {
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
}

.storm-berserk .storm-eye {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, rgba(50, 50, 80, 0.9) 0%, transparent 70%);
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(100, 100, 150, 0.8);
  animation: stormEye 1s ease-in-out infinite;
}

@keyframes stormEye {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
}

/* ============ 效果13：熔岩狂暴 ============ */
.lava-berserk .lava-pool {
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  width: 85px;
  height: 20px;
  background: radial-gradient(ellipse, rgba(255, 100, 0, 0.9) 0%, rgba(200, 50, 0, 0.6) 50%, transparent 70%);
  border-radius: 50%;
  animation: lavaPool 1s ease-in-out infinite alternate;
}

@keyframes lavaPool {
  0% { transform: translateX(-50%) scale(1); }
  100% { transform: translateX(-50%) scale(1.15); }
}

.lava-berserk .lava-geyser {
  position: absolute;
  width: 100%;
  height: 100%;
}

.lava-berserk .geyser {
  position: absolute;
  bottom: 25%;
  width: 10px;
  height: 30px;
  background: linear-gradient(to top, transparent, #ff6600, #ff9900, transparent);
  border-radius: 5px;
  animation: geyserBurst 1.5s ease-out infinite;
}

.lava-berserk .geyser:nth-child(1) { left: 30%; animation-delay: 0s; }
.lava-berserk .geyser:nth-child(2) { left: 40%; animation-delay: 0.3s; }
.lava-berserk .geyser:nth-child(3) { left: 50%; animation-delay: 0.6s; }
.lava-berserk .geyser:nth-child(4) { left: 60%; animation-delay: 0.9s; }
.lava-berserk .geyser:nth-child(5) { left: 70%; animation-delay: 1.2s; }

@keyframes geyserBurst {
  0% { height: 0; opacity: 0; }
  50% { height: 45px; opacity: 1; }
  100% { height: 60px; opacity: 0; }
}

.lava-berserk .magma-chunks {
  position: absolute;
  width: 100%;
  height: 100%;
}

.lava-berserk .chunk {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #ff4500;
  border-radius: 30%;
  animation: chunkFloat 2s ease-in-out infinite;
}

.lava-berserk .chunk:nth-child(1) { bottom: 30%; left: 25%; animation-delay: 0s; }
.lava-berserk .chunk:nth-child(2) { bottom: 35%; left: 35%; animation-delay: 0.2s; }
.lava-berserk .chunk:nth-child(3) { bottom: 40%; left: 45%; animation-delay: 0.4s; }
.lava-berserk .chunk:nth-child(4) { bottom: 45%; left: 55%; animation-delay: 0.6s; }
.lava-berserk .chunk:nth-child(5) { bottom: 50%; left: 65%; animation-delay: 0.8s; }
.lava-berserk .chunk:nth-child(6) { bottom: 55%; left: 30%; animation-delay: 1s; }
.lava-berserk .chunk:nth-child(7) { bottom: 60%; left: 50%; animation-delay: 1.2s; }
.lava-berserk .chunk:nth-child(8) { bottom: 65%; left: 70%; animation-delay: 1.4s; }

@keyframes chunkFloat {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-40px) scale(0.5); opacity: 0; }
}

/* ============ 效果14：虚空狂暴 ============ */
.void-berserk .void-singularity {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  background: radial-gradient(circle, #000000 0%, #1a0033 50%, transparent 70%);
  border-radius: 50%;
  box-shadow: 0 0 30px #4a0080, inset 0 0 20px #000;
  animation: singularityPulse 1s ease-in-out infinite;
}

@keyframes singularityPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 30px #4a0080; }
  50% { transform: translate(-50%, -50%) scale(1.3); box-shadow: 0 0 50px #8a00ff; }
}

.void-berserk .void-rifts {
  position: absolute;
  width: 100%;
  height: 100%;
}

.void-berserk .rift {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 60px;
  background: linear-gradient(to bottom, transparent, #8a00ff, transparent);
  transform-origin: center center;
  animation: riftRotate 2s linear infinite;
}

.void-berserk .rift:nth-child(1) { transform: rotate(0deg) translateX(-30px); }
.void-berserk .rift:nth-child(2) { transform: rotate(90deg) translateX(-30px); }
.void-berserk .rift:nth-child(3) { transform: rotate(180deg) translateX(-30px); }
.void-berserk .rift:nth-child(4) { transform: rotate(270deg) translateX(-30px); }

@keyframes riftRotate {
  0% { opacity: 0.3; height: 60px; }
  50% { opacity: 1; height: 70px; }
  100% { opacity: 0.3; height: 60px; }
}

.void-berserk .void-particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.void-berserk .void-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #8a00ff;
  border-radius: 50%;
  animation: voidParticleSpiral 3s linear infinite;
}

.void-berserk .void-particle:nth-child(1) { top: 10%; left: 20%; animation-delay: 0s; }
.void-berserk .void-particle:nth-child(2) { top: 20%; left: 80%; animation-delay: 0.2s; }
.void-berserk .void-particle:nth-child(3) { top: 30%; left: 30%; animation-delay: 0.4s; }
.void-berserk .void-particle:nth-child(4) { top: 40%; left: 70%; animation-delay: 0.6s; }
.void-berserk .void-particle:nth-child(5) { top: 50%; left: 15%; animation-delay: 0.8s; }
.void-berserk .void-particle:nth-child(6) { top: 60%; left: 85%; animation-delay: 1s; }
.void-berserk .void-particle:nth-child(7) { top: 70%; left: 40%; animation-delay: 1.2s; }
.void-berserk .void-particle:nth-child(8) { top: 80%; left: 60%; animation-delay: 1.4s; }
.void-berserk .void-particle:nth-child(9) { top: 15%; left: 50%; animation-delay: 0.1s; }
.void-berserk .void-particle:nth-child(10) { top: 25%; left: 35%; animation-delay: 0.3s; }
.void-berserk .void-particle:nth-child(11) { top: 35%; left: 65%; animation-delay: 0.5s; }
.void-berserk .void-particle:nth-child(12) { top: 45%; left: 45%; animation-delay: 0.7s; }
.void-berserk .void-particle:nth-child(13) { top: 55%; left: 55%; animation-delay: 0.9s; }
.void-berserk .void-particle:nth-child(14) { top: 65%; left: 25%; animation-delay: 1.1s; }
.void-berserk .void-particle:nth-child(15) { top: 75%; left: 75%; animation-delay: 1.3s; }

@keyframes voidParticleSpiral {
  0% { transform: rotate(0deg) translateX(0); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: rotate(360deg) translateX(30px); opacity: 0; }
}

/* ============ 效果15：死亡狂暴 ============ */
.death-berserk .death-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(40, 40, 40, 0.8) 0%, rgba(20, 20, 20, 0.4) 50%, transparent 70%);
  border-radius: 50%;
  animation: deathAura 1.5s ease-in-out infinite;
}

@keyframes deathAura {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
}

.death-berserk .skull-spirits {
  position: absolute;
  width: 100%;
  height: 100%;
}

.death-berserk .skull-spirit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  background: radial-gradient(circle, rgba(200, 200, 200, 0.8) 0%, rgba(100, 100, 100, 0.4) 50%, transparent 70%);
  border-radius: 50%;
  animation: skullOrbit 2s linear infinite;
}

.death-berserk .skull-spirit:nth-child(1) { animation-delay: 0s; }
.death-berserk .skull-spirit:nth-child(2) { animation-delay: 0.3s; }
.death-berserk .skull-spirit:nth-child(3) { animation-delay: 0.6s; }
.death-berserk .skull-spirit:nth-child(4) { animation-delay: 0.9s; }
.death-berserk .skull-spirit:nth-child(5) { animation-delay: 1.2s; }
.death-berserk .skull-spirit:nth-child(6) { animation-delay: 1.5s; }

@keyframes skullOrbit {
  0% { transform: rotate(0deg) translateX(35px) rotate(0deg); opacity: 0.3; }
  50% { opacity: 1; }
  100% { transform: rotate(360deg) translateX(35px) rotate(-360deg); opacity: 0.3; }
}

.death-berserk .reaper-scythe {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border: 2px solid rgba(80, 80, 80, 0.6);
  border-radius: 50%;
  animation: scytheSpin 3s linear infinite;
}

@keyframes scytheSpin {
  0% { transform: translate(-50%, -50%) rotate(0deg); border-color: rgba(100, 100, 100, 0.6); }
  25% { border-color: rgba(80, 80, 80, 0.6); }
  50% { border-color: rgba(60, 60, 60, 0.6); }
  75% { border-color: rgba(80, 80, 80, 0.6); }
  100% { transform: translate(-50%, -50%) rotate(360deg); border-color: rgba(100, 100, 100, 0.6); }
}

/* 响应式布局 */
@media (max-width: 768px) {
  .showcase-header h1 {
    font-size: 1.8rem;
  }
  
  .effects-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
  }
  
  .effect-preview {
    height: 150px;
  }
}
</style>
