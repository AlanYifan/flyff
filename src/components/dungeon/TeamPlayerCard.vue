<!--
  @file TeamPlayerCard.vue
  @description 玩家队伍角色卡片组件 - 玻璃拟态风格
  @features
    - 玻璃拟态背景
    - 圆形头像 + HP/MP环
    - 选中态呼吸光晕
    - 状态图标显示
  @generated 2026-03-15
-->
<template>
  <div 
    class="player-card"
    :class="{ 
      'is-selected': isSelected, 
      'is-current-player': isCurrentPlayer,
      'is-turn': isTurn 
    }"
    @click="$emit('click')"
  >
    <!-- 头像区域 -->
    <div class="avatar-container">
      <!-- HP环 -->
      <svg class="hp-ring" viewBox="0 0 100 100">
        <circle 
          class="hp-ring-bg"
          cx="50" cy="50" r="45"
          fill="none"
          stroke="#1C2028"
          stroke-width="4"
        />
        <circle 
          class="hp-ring-fill"
          cx="50" cy="50" r="45"
          fill="none"
          stroke="#06D6A0"
          stroke-width="4"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="hpOffset"
          transform="rotate(-90 50 50)"
        />
      </svg>
      
      <!-- MP环 -->
      <svg class="mp-ring" viewBox="0 0 100 100">
        <circle 
          class="mp-ring-bg"
          cx="50" cy="50" r="40"
          fill="none"
          stroke="#1C2028"
          stroke-width="2"
        />
        <circle 
          class="mp-ring-fill"
          cx="50" cy="50" r="40"
          fill="none"
          stroke="#118AB2"
          stroke-width="2"
          :stroke-dasharray="mpCircumference"
          :stroke-dashoffset="mpOffset"
          transform="rotate(-90 50 50)"
        />
      </svg>
      
      <!-- 头像图片 -->
      <img 
        class="avatar-img"
        :src="member.avatar || '/pt/job_icon/cxz_nan_icon.png'"
        :alt="member.name"
        @error="handleAvatarError"
      />
      
      <!-- 回合指示箭头 -->
      <div class="turn-indicator" v-if="isTurn">
        <span class="turn-arrow">▼</span>
      </div>
    </div>
    
    <!-- 角色信息 -->
    <div class="player-info">
      <span class="player-name">{{ member.name || '玩家' }}</span>
      <span class="player-level">Lv.{{ member.level || 1 }}</span>
    </div>
    
    <!-- 状态图标 -->
    <div class="status-icons" v-if="member.buffs && member.buffs.length > 0">
      <span 
        v-for="(buff, index) in member.buffs.slice(0, 3)" 
        :key="`buff-${index}`"
        class="status-icon"
        :class="buff.type"
        :title="buff.name"
      >
        {{ buff.icon }}
      </span>
    </div>
  </div>
</template>

<script setup>
/**
 * 玩家队伍角色卡片组件
 * 玻璃拟态风格 - 暗黑奇幻
 */
import { computed } from 'vue'

const props = defineProps({
  /**
   * 成员数据
   */
  member: {
    type: Object,
    default: () => ({})
  },
  /**
   * 是否当前玩家
   */
  isCurrentPlayer: {
    type: Boolean,
    default: false
  },
  /**
   * 是否选中
   */
  isSelected: {
    type: Boolean,
    default: false
  },
  /**
   * 是否轮到行动
   */
  isTurn: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

// 圆环周长计算
const circumference = 2 * Math.PI * 45
const mpCircumference = 2 * Math.PI * 40

/**
 * HP环偏移量
 */
const hpOffset = computed(() => {
  const hp = props.member.hpPercent ?? 100
  return circumference * (1 - hp / 100)
})

/**
 * MP环偏移量
 */
const mpOffset = computed(() => {
  const mp = props.member.mpPercent ?? 100
  return mpCircumference * (1 - mp / 100)
})

/**
 * 头像加载错误处理
 */
const handleAvatarError = (event) => {
  event.target.src = '/pt/job_icon/cxz_nan_icon.png'
}
</script>

<style scoped>
.player-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  min-width: 80px;
}

.player-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.player-card.is-selected {
  border-color: #00F5D4;
  box-shadow: 0 0 15px rgba(0, 245, 212, 0.3);
  animation: breatheGlow 2s ease-in-out infinite;
}

@keyframes breatheGlow {
  0%, 100% {
    box-shadow: 0 0 15px rgba(0, 245, 212, 0.3);
  }
  50% {
    box-shadow: 0 0 25px rgba(0, 245, 212, 0.5);
  }
}

.player-card.is-current-player {
  background: rgba(157, 78, 221, 0.1);
  border-color: rgba(157, 78, 221, 0.3);
}

/* ============ 头像区域 ============ */
.avatar-container {
  position: relative;
  width: 50px;
  height: 50px;
}

.hp-ring,
.mp-ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hp-ring {
  z-index: 2;
}

.mp-ring {
  z-index: 1;
}

.hp-ring-fill {
  transition: stroke-dashoffset 0.3s ease;
  filter: drop-shadow(0 0 3px rgba(6, 214, 160, 0.5));
}

.mp-ring-fill {
  transition: stroke-dashoffset 0.3s ease;
  filter: drop-shadow(0 0 2px rgba(17, 138, 178, 0.5));
}

.avatar-img {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  z-index: 3;
}

/* 回合指示箭头 */
.turn-indicator {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
}

.turn-arrow {
  color: #FFD166;
  font-size: 14px;
  animation: turnBounce 0.8s ease-in-out infinite;
  filter: drop-shadow(0 0 5px rgba(255, 209, 102, 0.8));
}

@keyframes turnBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

/* ============ 角色信息 ============ */
.player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 6px;
  gap: 2px;
}

.player-name {
  font-size: 11px;
  color: #E0E1DD;
  font-weight: 500;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-level {
  font-size: 9px;
  color: #748D92;
  font-family: 'Consolas', monospace;
}

/* ============ 状态图标 ============ */
.status-icons {
  display: flex;
  gap: 2px;
  margin-top: 4px;
}

.status-icon {
  font-size: 12px;
  animation: iconPulse 1.5s ease-in-out infinite;
}

.status-icon.buff {
  filter: drop-shadow(0 0 3px rgba(6, 214, 160, 0.6));
}

.status-icon.debuff {
  filter: drop-shadow(0 0 3px rgba(217, 4, 41, 0.6));
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* ============ 响应式 ============ */
@media (max-width: 480px) {
  .player-card {
    padding: 8px 10px;
    min-width: 60px;
  }
  
  .avatar-container {
    width: 40px;
    height: 40px;
  }
  
  .avatar-img {
    width: 28px;
    height: 28px;
  }
  
  .player-name {
    font-size: 10px;
  }
}
</style>
