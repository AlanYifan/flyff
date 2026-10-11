<!--
  @file TornadoSandstormTest.vue
  @generated 2026-06-29
  @description 风沙吞噬·龙卷风3D技能特效动画测试页面
  展示10个龙卷风+沙尘暴3D特效动画实例，支持单独重播和全部重播
  技术栈：Canvas 2D + 3D透视投影粒子系统
-->
<template>
  <div class="tornado-test">
    <!-- 顶部标题区 -->
    <header class="test-header">
      <div class="header-content">
        <h1 class="title">
          <span class="title-icon">🌪️</span>
          风沙吞噬·龙卷风3D特效测试
          <span class="title-icon">🌪️</span>
        </h1>
        <p class="subtitle">3D透视投影粒子系统 · 真实龙卷风+沙尘暴 · 吞噬一切的压迫感</p>
      </div>
      <div class="header-actions">
        <button class="action-btn replay-all" @click="replayAll">
          <span class="btn-icon">🔄</span>
          全部重播
        </button>
        <button class="action-btn back-btn" @click="goBack">
          <span class="btn-icon">←</span>
          返回
        </button>
      </div>
    </header>

    <!-- 动画展示网格 -->
    <div class="effects-grid">
      <div
        v-for="(item, index) in effectItems"
        :key="index"
        class="effect-card"
      >
        <!-- Canvas动画容器 -->
        <div :ref="el => stageRefs[index] = el" class="effect-stage">
          <TornadoSandstormEffect :ref="el => effectRefs[index] = el" />
          <!-- 序号标签 -->
          <div class="stage-index">#{{ index + 1 }}</div>
        </div>
        <!-- 卡片底部信息 -->
        <div class="effect-footer">
          <div class="effect-label">
            <span class="label-tag">{{ item.tag }}</span>
            <span class="label-name">{{ item.name }}</span>
          </div>
          <button class="replay-btn" title="重播此动画" @click="replayOne(index)">
            ↻
          </button>
        </div>
      </div>
    </div>

    <!-- 底部说明 -->
    <footer class="test-footer">
      <p>动画总时长 3.5s · 三阶段：聚沙成塔(0~0.8s) → 肆虐吞噬(0.8~2.8s) → 消散余尘(2.8~3.5s)</p>
      <p class="footer-tech">Canvas 2D · 3D透视投影 · 深度排序 · 5层粒子系统(漏斗沙粒/地面吸入/飞射碎片/顶部尘云/环境风沙) · requestAnimationFrame · 时间切片8ms</p>
    </footer>
  </div>
</template>

<script setup>
/**
 * 风沙吞噬·龙卷风3D技能特效动画测试页面
 * 展示10个并排的龙卷风+沙尘暴3D特效实例，支持单独/全部重播
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import TornadoSandstormEffect from '@/components/TornadoSandstormEffect.vue'

const router = useRouter()

/** 10个特效实例的ref引用数组 */
const effectRefs = ref([])

/** 10个舞台容器的ref引用数组 */
const stageRefs = ref([])

/** 特效展示项配置 */
const effectItems = ref([
  { tag: '聚沙', name: '地面沙尘汇聚·漏斗升起' },
  { tag: '漏斗', name: '上粗下细·漏斗形螺旋沙壁' },
  { tag: '吞噬', name: '地面粒子螺旋吸入底部' },
  { tag: '碎片', name: '飞射碎片·抛物线弹射' },
  { tag: '尘云', name: '顶部扩散尘云·渐变雾化' },
  { tag: '摇摆', name: '龙卷风中心轴正弦摆动' },
  { tag: '深度', name: '3D透视投影·近大远小' },
  { tag: '风沙', name: '环境风沙·横向沙尘暴' },
  { tag: '冲击', name: '地面尘环冲击波扩散' },
  { tag: '完整', name: '三阶段完整3D龙卷风' }
])

/**
 * 重播指定索引的特效动画
 * @param {number} index - 特效实例索引(0~9)
 */
function replayOne (index) {
  const effectComp = effectRefs.value[index]
  if (effectComp && typeof effectComp.playAnimation === 'function') {
    effectComp.playAnimation()
  }
}

/**
 * 全部重播 - 依次触发10个特效动画
 */
function replayAll () {
  effectRefs.value.forEach((effectComp, index) => {
    if (effectComp && typeof effectComp.playAnimation === 'function') {
      // 每个实例间隔150ms触发，形成波浪式效果
      setTimeout(() => {
        effectComp.playAnimation()
      }, index * 150)
    }
  })
}

/**
 * 返回上一页
 */
function goBack () {
  router.back()
}

/** 自动播放定时器 */
let autoPlayTimer = null

onMounted(() => {
  // 页面加载后稍延迟自动播放全部动画
  nextTick(() => {
    autoPlayTimer = setTimeout(() => {
      replayAll()
    }, 300)
  })
})

onUnmounted(() => {
  if (autoPlayTimer) {
    clearTimeout(autoPlayTimer)
    autoPlayTimer = null
  }
})
</script>

<style scoped>
/* ========================================
   页面容器 - 沙黄色暗调主题
   ======================================== */
.tornado-test {
  min-height: 100vh;
  background: linear-gradient(160deg, #0d0a05 0%, #1a1408 30%, #0d0d05 60%, #0a0800 100%);
  padding: 24px;
  box-sizing: border-box;
  color: #e0e0e0;
  overflow-x: hidden;
}

/* ========================================
   顶部标题区
   ======================================== */
.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(200, 160, 80, 0.15);
}

.header-content {
  flex: 1;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #d4a64a;
  margin: 0 0 8px 0;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(212, 166, 74, 0.4), 0 0 40px rgba(180, 130, 40, 0.2);
}

.title-icon {
  display: inline-block;
  animation: iconSpin 3s ease-in-out infinite;
}

@keyframes iconSpin {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.2); }
}

.subtitle {
  font-size: 0.95rem;
  color: rgba(212, 180, 100, 0.6);
  margin: 0;
  letter-spacing: 1px;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  letter-spacing: 0.5px;
}

.btn-icon {
  font-size: 1.1rem;
}

.replay-all {
  background: linear-gradient(135deg, #c89030, #8a6020);
  color: #fff;
  box-shadow: 0 2px 12px rgba(200, 144, 48, 0.3);
}

.replay-all:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(200, 144, 48, 0.5);
  background: linear-gradient(135deg, #d4a040, #9a7030);
}

.back-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #bbb;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  transform: translateY(-2px);
}

/* ========================================
   动画展示网格
   ======================================== */
.effects-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

/* ========================================
   单个效果卡片
   ======================================== */
.effect-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(200, 160, 80, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.effect-card:hover {
  border-color: rgba(200, 160, 80, 0.3);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 4px 24px rgba(180, 130, 40, 0.12);
  transform: translateY(-3px);
}

/* ========================================
   动画舞台容器
   ======================================== */
.effect-stage {
  position: relative;
  width: 100%;
  height: 220px;
  background: radial-gradient(ellipse at center bottom, rgba(50, 35, 15, 0.5) 0%, rgba(10, 8, 3, 0.9) 70%);
  overflow: hidden;
}

.stage-index {
  position: absolute;
  top: 8px;
  left: 10px;
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(212, 180, 100, 0.7);
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 8px;
  border-radius: 4px;
  z-index: 70;
  pointer-events: none;
  letter-spacing: 1px;
}

/* ========================================
   卡片底部信息
   ======================================== */
.effect-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(200, 160, 80, 0.08);
}

.effect-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-tag {
  font-size: 0.7rem;
  font-weight: 600;
  color: #d4a64a;
  background: rgba(212, 166, 74, 0.12);
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.label-name {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.replay-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid rgba(200, 160, 80, 0.2);
  background: rgba(200, 160, 80, 0.08);
  color: #d4a64a;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  line-height: 1;
}

.replay-btn:hover {
  background: rgba(200, 160, 80, 0.25);
  border-color: rgba(200, 160, 80, 0.5);
  transform: scale(1.1);
}

/* ========================================
   底部说明区
   ======================================== */
.test-footer {
  text-align: center;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid rgba(200, 160, 80, 0.1);
}

.test-footer p {
  margin: 4px 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.35);
}

.footer-tech {
  font-size: 0.78rem !important;
  color: rgba(212, 180, 100, 0.35) !important;
  letter-spacing: 1px;
}

/* ========================================
   响应式布局
   ======================================== */
@media (max-width: 1200px) {
  .effects-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .tornado-test {
    padding: 16px;
  }

  .test-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .title {
    font-size: 1.5rem;
  }

  .effects-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .effect-stage {
    height: 180px;
  }
}

@media (max-width: 480px) {
  .effects-grid {
    grid-template-columns: 1fr;
  }

  .effect-stage {
    height: 200px;
  }
}
</style>
