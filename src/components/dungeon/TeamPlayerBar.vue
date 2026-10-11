<!--
  @file TeamPlayerBar.vue
  @description 团队玩家状态栏组件 - 预留8个玩家位置，支持组队系统
  @features
    - 显示队伍成员状态（最多8人）
    - 每行显示一个玩家的垂直列表布局
    - 血量/魔力条可视化
    - 队长标识
    - 离线/死亡状态
    - 点击查看详情
  @generated 2026-03-15
-->
<template>
  <div class="team-player-bar">
    <!-- 副本信息标题 -->
    <div class="dungeon-header">
      <div class="dungeon-title">
        <span class="dungeon-icon">⚔️</span>
        <span class="dungeon-name">{{ dungeonName }}</span>
        <span class="difficulty-badge" :class="difficultyClass">{{ difficultyText }}</span>
      </div>
      <div class="dungeon-timer">
        <span class="timer-icon">⏱️</span>
        <span class="timer-value">{{ formattedTime }}</span>
      </div>
    </div>

    <!-- 团队玩家列表 -->
    <div class="team-slots">
      <div
        v-for="(member, index) in teamSlots"
        :key="index"
        class="team-slot"
        :class="{
          'is-leader': member?.isLeader,
          'is-empty': !member,
          'is-offline': member?.isOffline,
          'is-dead': member?.isDead,
          'is-current-player': member?.isCurrentPlayer
        }"
        @click="handleMemberClick(member, index)"
      >
        <template v-if="member">
          <!-- 玩家头像 -->
          <div class="member-avatar">
            <img
              :src="member.avatar"
              :alt="member.name"
              @error="handleAvatarError($event, member)"
            />
            <div v-if="member.isLeader" class="leader-badge">👑</div>
            <div v-if="member.isOffline" class="offline-overlay">
              <span>离线</span>
            </div>
            <div v-if="member.isDead" class="dead-overlay">
              <span>💀</span>
            </div>
          </div>

          <!-- 玩家信息 -->
          <div class="member-info">
            <div class="member-name-row">
              <span class="member-name" :title="member.name">{{ member.name }}</span>
              <span class="member-level">Lv.{{ member.level }}</span>
            </div>
            
            <!-- 血量条 -->
            <div class="stat-bar hp-bar">
              <div class="bar-fill" :style="{ width: member.hpPercent + '%' }"></div>
              <span class="bar-text">{{ member.hpText }}</span>
            </div>
            
            <!-- 魔力条 -->
            <div class="stat-bar mp-bar">
              <div class="bar-fill" :style="{ width: member.mpPercent + '%' }"></div>
              <span class="bar-text">{{ member.mpText }}</span>
            </div>
          </div>

          <!-- 职业图标 -->
          <div class="member-class">
            <span :class="getClassIcon(member.classType)"></span>
          </div>
        </template>

        <!-- 空位显示 -->
        <template v-else>
          <div class="empty-slot-content">
            <div class="empty-icon">➕</div>
            <span class="empty-text">等待加入</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 团队玩家状态栏组件
 * 预留8个玩家位置，为组队系统做准备
 */
import { computed } from 'vue'

const props = defineProps({
  /**
   * 当前玩家数据
   */
  currentPlayer: {
    type: Object,
    default: () => ({})
  },
  /**
   * 队伍成员列表（不含当前玩家）
   */
  teamMembers: {
    type: Array,
    default: () => []
  },
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
   * 最大队伍人数
   */
  maxTeamSize: {
    type: Number,
    default: 8
  }
})

const emit = defineEmits([
  /**
   * 点击成员时触发
   */
  'click-member',
  /**
   * 点击空位时触发
   */
  'click-empty-slot'
])

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
 * 难度显示文本
 */
const difficultyText = computed(() => {
  return props.difficulty || '普通'
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
 * 团队槽位数组（包含空位）
 */
const teamSlots = computed(() => {
  const slots = []
  
  // 添加当前玩家到第一个位置
  if (props.currentPlayer && Object.keys(props.currentPlayer).length > 0) {
    slots.push({
      ...props.currentPlayer,
      isCurrentPlayer: true,
      isLeader: props.currentPlayer.isLeader ?? true // 当前玩家默认为队长（单人时）
    })
  }
  
  // 添加其他队伍成员
  props.teamMembers.forEach(member => {
    slots.push(member)
  })
  
  // 填充空位到最大人数
  while (slots.length < props.maxTeamSize) {
    slots.push(null)
  }
  
  return slots
})

// ============ 方法 ============

/**
 * 获取职业图标类名
 * @param {string} classType - 职业类型
 * @returns {string} 图标类名
 */
const getClassIcon = (classType) => {
  const iconMap = {
    '初心者': 'class-icon-beginner',
    '剑士': 'class-icon-swordsman',
    '魔法师': 'class-icon-mage',
    '弓箭手': 'class-icon-archer',
    '圣职者': 'class-icon-priest'
  }
  return iconMap[classType] || 'class-icon-default'
}

/**
 * 处理头像加载错误
 * @param {Event} event - 错误事件
 * @param {Object} member - 成员数据
 */
const handleAvatarError = (event, member) => {
  event.target.src = '/pt/job_icon/cxz_nan_icon.png'
}

/**
 * 处理成员点击
 * @param {Object|null} member - 成员数据
 * @param {number} index - 槽位索引
 */
const handleMemberClick = (member, index) => {
  if (member) {
    emit('click-member', { member, index })
  } else {
    emit('click-empty-slot', index)
  }
}
</script>

<style scoped>
/* ============ 主容器 ============ */
.team-player-bar {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 8px 10px;
}

/* ============ 副本头部 ============ */
.dungeon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dungeon-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dungeon-icon {
  font-size: 16px;
}

.dungeon-name {
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
}

.difficulty-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.difficulty-normal {
  background: rgba(100, 200, 100, 0.2);
  color: #7ddf7d;
  border: 1px solid rgba(100, 200, 100, 0.3);
}

.difficulty-hard {
  background: rgba(255, 180, 50, 0.2);
  color: #ffb432;
  border: 1px solid rgba(255, 180, 50, 0.3);
}

.difficulty-nightmare {
  background: rgba(200, 100, 200, 0.2);
  color: #d080d0;
  border: 1px solid rgba(200, 100, 200, 0.3);
}

.difficulty-hell {
  background: rgba(200, 50, 50, 0.2);
  color: #ff5050;
  border: 1px solid rgba(200, 50, 50, 0.3);
}

.dungeon-timer {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #ffd700;
  font-family: 'Consolas', monospace;
}

.timer-icon {
  font-size: 14px;
}

.timer-value {
  font-weight: 600;
}

/* ============ 团队槽位网格 ============ */
.team-slots {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ============ 单个槽位 ============ */
.team-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.team-slot:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.15);
}

.team-slot.is-current-player {
  border-color: rgba(255, 215, 0, 0.4);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.15);
}

.team-slot.is-leader {
  border-color: rgba(255, 200, 50, 0.3);
}

.team-slot.is-empty {
  background: transparent;
  border-style: dashed;
  opacity: 0.5;
}

.team-slot.is-empty:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.03);
}

.team-slot.is-offline {
  opacity: 0.5;
}

.team-slot.is-dead {
  border-color: rgba(200, 50, 50, 0.3);
}

/* ============ 成员头像 ============ */
.member-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.leader-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  font-size: 12px;
  background: rgba(255, 200, 50, 0.9);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.offline-overlay,
.dead-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #aaa;
}

.dead-overlay {
  background: rgba(100, 0, 0, 0.7);
  font-size: 16px;
}

/* ============ 成员信息 ============ */
.member-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.member-name {
  font-size: 13px;
  font-weight: 500;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.member-level {
  font-size: 11px;
  color: #aaa;
  flex-shrink: 0;
  margin-left: 6px;
}

/* ============ 状态条 ============ */
.stat-bar {
  height: 12px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.stat-bar .bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.hp-bar .bar-fill {
  background: linear-gradient(90deg, #ff4444 0%, #ff6666 100%);
}

.mp-bar .bar-fill {
  background: linear-gradient(90deg, #4488ff 0%, #66aaff 100%);
}

.stat-bar .bar-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  color: #fff;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
  font-weight: 500;
}

/* ============ 职业图标 ============ */
.member-class {
  width: 20px;
  text-align: center;
  font-size: 14px;
  flex-shrink: 0;
}

/* ============ 空位内容 ============ */
.empty-slot-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 8px;
  padding: 4px 0;
}

.empty-icon {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.3);
}

.empty-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

/* ============ 响应式布局 ============ */
@media (max-width: 768px) {
  .team-player-bar {
    padding: 8px 10px;
  }
  
  .member-avatar {
    width: 36px;
    height: 36px;
  }
  
  .member-name {
    font-size: 12px;
    max-width: 80px;
  }
  
  .stat-bar {
    height: 10px;
  }
  
  .stat-bar .bar-text {
    font-size: 8px;
  }
}
</style>
