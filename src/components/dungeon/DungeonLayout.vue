<!--
  @file DungeonLayout.vue
  @description 副本页面整体布局组件 - 深渊禁忌风格
  @features
    - 顶部进度区域：副本名称 + 进度条 + 层数
    - 中上部怪物区域：场景背景 + 怪物立绘
    - 中部战斗日志：卷轴式设计
    - 中下部玩家队伍：玻璃拟态卡片
    - 底部自动战斗面板：科技感仪表盘
  @generated 2026-03-15
-->
<template>
  <div class="dungeon-layout">
    <!-- 1. 顶部：进度区域 - 悬浮吸顶50px -->
    <header class="progress-header">
      <div class="header-left">
        <h1 class="dungeon-name">{{ dungeonName }}</h1>
        <span class="difficulty-badge" :class="difficultyClass">{{ difficulty }}</span>
      </div>
      
      <div class="header-center">
        <DungeonProgressBar
          :current="currentProgress"
          :total="totalProgress"
          :stage-name="currentStageName"
        />
      </div>
      
      <div class="header-right">
        <span class="floor-indicator">{{ currentFloor }} / {{ totalFloors }}</span>
        <div class="timer-display">
          <span class="timer-icon">⏱</span>
          <span class="timer-value">{{ formattedTime }}</span>
        </div>
      </div>
    </header>

    <!-- 2. 中上部：怪物区域 - 占35% -->
    <section class="monster-section">
      <!-- 背景层 -->
      <div class="monster-bg">
        <slot name="background">
          <div class="default-monster-bg"></div>
        </slot>
        <!-- 暗蒙版叠加 -->
        <div class="monster-overlay"></div>
        <!-- 动态雾气特效 -->
        <div class="mist-effect"></div>
        <!-- 魔法尘埃粒子 -->
        <div class="magic-particles">
          <span v-for="i in 20" :key="`particle-${i}`" class="particle"></span>
        </div>
      </div>
      
      <!-- 怪物立绘区域 -->
      <div class="monster-content">
        <slot name="monsters">
          <!-- 怪物面板插槽 -->
        </slot>
      </div>
    </section>

    <!-- 3. 中部：战斗日志 - 高度20% -->
    <section class="log-section">
      <div class="log-scroll-edge top"></div>
      <div class="log-container">
        <slot name="logs">
          <!-- 战斗日志插槽 -->
        </slot>
      </div>
      <div class="log-scroll-edge bottom"></div>
    </section>

    <!-- 4. 中下部：玩家队伍区域 - 高度15% -->
    <section class="party-section">
      <slot name="party">
        <TeamPlayerCard
          v-for="(member, index) in teamMembers"
          :key="`member-${index}`"
          :member="member"
          :is-current-player="member.isCurrentPlayer"
          :is-selected="selectedMemberIndex === index"
          @click="handleMemberClick(index)"
        />
      </slot>
    </section>

    <!-- 5. 底部：自动战斗面板 - 高度20% -->
    <footer class="battle-footer">
      <!-- 上层：自动战斗面板 -->
      <div class="auto-battle-panel">
        <slot name="auto-battle">
          <!-- 自动战斗控制插槽 -->
        </slot>
      </div>
      
      <!-- 下层：功能区域 -->
      <div class="action-panel">
        <slot name="actions">
          <!-- 功能按钮插槽 -->
        </slot>
      </div>
    </footer>
  </div>
</template>

<script setup>
/**
 * 副本页面整体布局组件
 * 深渊禁忌风格 - 暗黑奇幻、深渊地宫、魔法科技感
 */
import { computed, ref } from 'vue'
import DungeonProgressBar from './DungeonProgressBar.vue'
import TeamPlayerCard from './TeamPlayerCard.vue'

const props = defineProps({
  /**
   * 副本名称
   */
  dungeonName: {
    type: String,
    default: '未知副本'
  },
  /**
   * 副本难度
   */
  difficulty: {
    type: String,
    default: '普通'
  },
  /**
   * 剩余时间（秒）
   */
  remainingTime: {
    type: Number,
    default: 0
  },
  /**
   * 当前进度
   */
  currentProgress: {
    type: Number,
    default: 0
  },
  /**
   * 总进度
   */
  totalProgress: {
    type: Number,
    default: 100
  },
  /**
   * 当前阶段名称
   */
  currentStageName: {
    type: String,
    default: ''
  },
  /**
   * 当前层数
   */
  currentFloor: {
    type: Number,
    default: 1
  },
  /**
   * 总层数
   */
  totalFloors: {
    type: Number,
    default: 1
  },
  /**
   * 队伍成员列表
   */
  teamMembers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['member-click'])

// ============ 计算属性 ============

/**
 * 难度对应的CSS类名
 */
const difficultyClass = computed(() => {
  const classMap = {
    '普通': 'difficulty-normal',
    '困难': 'difficulty-hard',
    '噩梦': 'difficulty-nightmare',
    '地狱': 'difficulty-hell'
  }
  return classMap[props.difficulty] || 'difficulty-normal'
})

/**
 * 格式化的剩余时间
 */
const formattedTime = computed(() => {
  const seconds = props.remainingTime
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

/**
 * 选中的成员索引
 */
const selectedMemberIndex = ref(null)

/**
 * 处理成员点击
 */
const handleMemberClick = (index) => {
  selectedMemberIndex.value = index
  emit('member-click', { member: props.teamMembers[index], index })
}
</script>

<style scoped>
/* ============ CSS变量定义 - 深渊禁忌风格 ============ */
.dungeon-layout {
  /* 核心色调 */
  --bg-deep: #080B10;           /* 极深蓝黑 - 深渊幽暗 */
  --material-dark: #1C2028;      /* 玄武岩灰 - UI面板底色 */
  --border-iron: #2A3040;        /* 暗铁色 - 分割线 */
  
  /* 氛围光效 */
  --glow-purple: #9D4EDD;        /* 幽冥紫 - 副本名称、精英怪 */
  --glow-curse-green: #00F5D4;   /* 诅咒绿 - 自动战斗、MP条 */
  --glow-blood-red: #D90429;     /* 鲜血红 - HP扣减、暴击 */
  
  /* 功能色 */
  --text-rose: #C9ADA7;          /* 淡玫瑰灰 - 副本名 */
  --text-metal: #748D92;         /* 金属灰 - 层数 */
  --text-light: #E0E1DD;         /* 浅灰白 - 主要文字 */
  --text-cold: #8D99AE;          /* 冷灰 - 普通日志 */
  --hp-mint: #06D6A0;            /* 薄荷绿 - HP条 */
  --mp-blue: #118AB2;            /* 深蓝 - MP条 */
  --speed-amber: #FFD166;        /* 琥珀黄 - 倍速 */
  --damage-pink: #EF476F;        /* 亮粉红 - 伤害日志 */
  
  /* 布局参数 */
  --header-height: 50px;
  --monster-section-ratio: 35%;
  --log-section-ratio: 20%;
  --party-section-ratio: 15%;
  --footer-section-ratio: 20%;
}

/* ============ 主容器 ============ */
.dungeon-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--bg-deep);
  color: var(--text-light);
  overflow: hidden;
  position: relative;
}

/* ============ 1. 顶部进度区域 ============ */
.progress-header {
  height: var(--header-height);
  min-height: var(--header-height);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: linear-gradient(180deg, rgba(8,11,16,0.95) 0%, rgba(8,11,16,0) 100%);
  position: relative;
  z-index: 100;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dungeon-name {
  font-family: 'Cinzel', 'Times New Roman', serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-rose);
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 2px 8px rgba(157, 78, 221, 0.3);
}

.difficulty-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.difficulty-normal {
  background: rgba(157, 78, 221, 0.2);
  color: var(--glow-purple);
  border: 1px solid rgba(157, 78, 221, 0.4);
}

.difficulty-hard {
  background: rgba(255, 209, 102, 0.2);
  color: var(--speed-amber);
  border: 1px solid rgba(255, 209, 102, 0.4);
}

.difficulty-nightmare {
  background: rgba(239, 71, 111, 0.2);
  color: var(--damage-pink);
  border: 1px solid rgba(239, 71, 111, 0.4);
}

.difficulty-hell {
  background: rgba(217, 4, 41, 0.2);
  color: var(--glow-blood-red);
  border: 1px solid rgba(217, 4, 41, 0.4);
}

.header-center {
  flex: 1;
  max-width: 400px;
  margin: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.floor-indicator {
  font-family: 'Cinzel', serif;
  font-size: 14px;
  color: var(--text-metal);
  font-weight: 600;
  letter-spacing: 2px;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(28, 32, 40, 0.8);
  border: 1px solid var(--border-iron);
  border-radius: 4px;
}

.timer-icon {
  font-size: 12px;
}

.timer-value {
  font-family: 'Consolas', monospace;
  font-size: 13px;
  color: var(--glow-curse-green);
  font-weight: 600;
}

/* ============ 2. 怪物区域 ============ */
.monster-section {
  height: var(--monster-section-ratio);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.monster-bg {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.default-monster-bg {
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center bottom, #1a1a2e 0%, #080B10 70%);
}

.monster-overlay {
  position: absolute;
  inset: 0;
  background: rgba(8, 11, 16, 0.4);
  z-index: 2;
}

/* 雾气特效 */
.mist-effect {
  position: absolute;
  inset: 0;
  z-index: 3;
  background: 
    radial-gradient(ellipse at 20% 100%, rgba(157, 78, 221, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(0, 245, 212, 0.08) 0%, transparent 50%);
  animation: mistFloat 8s ease-in-out infinite;
}

@keyframes mistFloat {
  0%, 100% {
    opacity: 0.6;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-10px);
  }
}

/* 魔法尘埃粒子 */
.magic-particles {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 3px;
  height: 3px;
  background: var(--glow-purple);
  border-radius: 50%;
  opacity: 0;
  animation: particleFall linear infinite;
}

.particle:nth-child(1) { left: 5%; animation-duration: 8s; animation-delay: 0s; }
.particle:nth-child(2) { left: 15%; animation-duration: 10s; animation-delay: 1s; }
.particle:nth-child(3) { left: 25%; animation-duration: 7s; animation-delay: 2s; }
.particle:nth-child(4) { left: 35%; animation-duration: 9s; animation-delay: 0.5s; }
.particle:nth-child(5) { left: 45%; animation-duration: 11s; animation-delay: 3s; }
.particle:nth-child(6) { left: 55%; animation-duration: 8s; animation-delay: 1.5s; }
.particle:nth-child(7) { left: 65%; animation-duration: 10s; animation-delay: 2.5s; }
.particle:nth-child(8) { left: 75%; animation-duration: 7s; animation-delay: 0.8s; }
.particle:nth-child(9) { left: 85%; animation-duration: 9s; animation-delay: 1.8s; }
.particle:nth-child(10) { left: 95%; animation-duration: 11s; animation-delay: 3.5s; }
.particle:nth-child(11) { left: 10%; animation-duration: 8s; animation-delay: 4s; }
.particle:nth-child(12) { left: 20%; animation-duration: 10s; animation-delay: 5s; }
.particle:nth-child(13) { left: 30%; animation-duration: 7s; animation-delay: 6s; }
.particle:nth-child(14) { left: 40%; animation-duration: 9s; animation-delay: 4.5s; }
.particle:nth-child(15) { left: 50%; animation-duration: 11s; animation-delay: 7s; }
.particle:nth-child(16) { left: 60%; animation-duration: 8s; animation-delay: 5.5s; }
.particle:nth-child(17) { left: 70%; animation-duration: 10s; animation-delay: 6.5s; }
.particle:nth-child(18) { left: 80%; animation-duration: 7s; animation-delay: 4.8s; }
.particle:nth-child(19) { left: 90%; animation-duration: 9s; animation-delay: 5.8s; }
.particle:nth-child(20) { left: 12%; animation-duration: 11s; animation-delay: 7.5s; }

@keyframes particleFall {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.5);
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
    transform: translateY(calc(var(--monster-section-ratio) * 3)) scale(0.3);
  }
}

.monster-content {
  position: relative;
  z-index: 5;
  height: 100%;
  width: 100%;
}

/* ============ 3. 战斗日志区域 ============ */
.log-section {
  height: var(--log-section-ratio);
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

/* 羊皮卷边缘纹理 */
.log-scroll-edge {
  height: 8px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(28, 32, 40, 0.9) 10%, 
    rgba(28, 32, 40, 0.9) 90%, 
    transparent 100%
  );
  position: relative;
  flex-shrink: 0;
}

.log-scroll-edge::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,5 Q25,0 50,5 T100,5' stroke='%232A3040' stroke-width='1' fill='none'/%3E%3C/svg%3E") repeat-x;
  opacity: 0.5;
}

.log-scroll-edge.bottom::before {
  transform: scaleY(-1);
}

.log-container {
  flex: 1;
  background: rgba(28, 32, 40, 0.85);
  backdrop-filter: blur(8px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ============ 4. 玩家队伍区域 ============ */
.party-section {
  height: var(--party-section-ratio);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 20px;
  background: linear-gradient(180deg, transparent 0%, rgba(8, 11, 16, 0.5) 100%);
  flex-shrink: 0;
  position: relative;
}

/* 受击反馈闪烁 */
.party-section.hit-flash {
  animation: hitFlash 0.3s ease-out;
}

@keyframes hitFlash {
  0%, 100% {
    box-shadow: none;
  }
  50% {
    box-shadow: inset 0 0 30px rgba(217, 4, 41, 0.5);
  }
}

/* ============ 5. 底部自动战斗面板 ============ */
.battle-footer {
  height: var(--footer-section-ratio);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
}

/* 上层：自动战斗面板 */
.auto-battle-panel {
  flex: 1;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 20px;
  position: relative;
  
  /* 科技感网格背景 */
  background-image: 
    linear-gradient(rgba(0, 245, 212, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 245, 212, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* 下层：功能区域 */
.action-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  gap: 12px;
}

/* ============ 响应式布局 ============ */
@media (max-width: 768px) {
  .progress-header {
    padding: 0 12px;
  }
  
  .dungeon-name {
    font-size: 14px;
  }
  
  .header-center {
    max-width: 200px;
    margin: 0 10px;
  }
  
  .floor-indicator {
    font-size: 12px;
  }
  
  .party-section {
    padding: 0 10px;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .dungeon-name {
    font-size: 12px;
  }
  
  .difficulty-badge {
    font-size: 8px;
    padding: 2px 6px;
  }
  
  .timer-display {
    padding: 2px 6px;
  }
  
  .timer-value {
    font-size: 11px;
  }
}
</style>
