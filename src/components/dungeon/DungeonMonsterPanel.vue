<!--
  @file DungeonMonsterPanel.vue
  @description 副本怪物面板组件 - 显示当前战斗中的怪物
  @generated 2026-03-15
-->
<template>
  <div class="dungeon-monster-panel">
    <div class="monster-list">
      <div
        v-for="(monster, index) in displayMonsters"
        :key="`monster-${index}`"
        class="monster-card"
        :class="{
          'is-defeated': monster?.isDefeated,
          'is-fading': monster?.isFading
        }"
        @click="handleAttackMonster(index)"
      >
        <div v-if="monster" class="monster-content">
          <div class="monster-icon-wrapper">
            <img
              class="monster-icon"
              :src="monster.icon"
              :alt="monster.name"
              @error="handleImageError(monster)"
            />
            <img
              v-if="getMonsterElementIcon(monster)"
              class="element-icon"
              :src="getMonsterElementIcon(monster)"
              :alt="monster.element"
            />
          </div>

          <div class="monster-info">
            <div class="monster-name" :style="{ color: getMonsterRankColor(monster.rank) }">
              {{ monster.name }}
            </div>
            <div class="monster-level">Lv.{{ monster.level }}</div>
            <div class="health-bar">
              <div class="health-fill" :style="{ width: monster.healthPercentage + '%' }"></div>
              <span class="health-text">{{ monster.currentHealth }}/{{ monster.maxHealth }}</span>
            </div>
          </div>
        </div>
        <div v-else class="monster-placeholder">
          <span>等待中...</span>
        </div>
      </div>
    </div>

    <div v-if="monsters.length === 0" class="no-monsters">
      <span>暂无怪物</span>
    </div>
  </div>
</template>

<script setup>
/**
 * 副本怪物面板组件
 * 显示当前副本中的怪物列表
 */
import { computed } from 'vue'

const props = defineProps({
  /**
   * 怪物列表
   * @type {Array}
   */
  monsters: {
    type: Array,
    default: () => []
  },
  /**
   * 是否正在自动战斗
   * @type {Boolean}
   */
  autoBattle: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['attack-monster', 'monster-image-error'])

/**
 * 显示的怪物列表（限制数量）
 */
const displayMonsters = computed(() => {
  const list = Array.isArray(props.monsters) ? props.monsters : []
  // 副本中最多显示10个怪物
  return list.slice(0, 10)
})

/**
 * 获取怪物等级颜色
 * @param {string} rank - 怪物等级
 * @returns {string} 颜色值
 */
const getMonsterRankColor = (rank) => {
  const colorMap = {
    normal: '#ffffff',
    captain: '#4CAF50',
    boss: '#ff6b35',
    elite: '#9c27b0',
    rare: '#2196f3',
    legendary: '#ffd700'
  }
  return colorMap[rank] || '#ffffff'
}

/**
 * 获取怪物元素图标
 * @param {Object} monster - 怪物对象
 * @returns {string} 图标路径
 */
const getMonsterElementIcon = (monster) => {
  const raw = String(monster?.element ?? '').trim().toLowerCase()
  if (!raw || raw === 'none' || raw === 'null') {
    return ''
  }

  const element = raw === 'thunder' ? 'electricity' : raw
  const iconMap = {
    fire: 'fire_火.png',
    water: 'water_水.png',
    wind: 'wind_风.png',
    earth: 'earth_土.png',
    electricity: 'electricity_雷.png'
  }

  const fileName = iconMap[element]
  return fileName ? `/pt/element/${fileName}` : ''
}

/**
 * 处理攻击怪物
 * @param {number} index - 怪物索引
 */
const handleAttackMonster = (index) => {
  if (props.autoBattle) {
    return
  }
  emit('attack-monster', index)
}

/**
 * 处理怪物图片加载错误
 * @param {Object} monster - 怪物对象
 */
const handleImageError = (monster) => {
  emit('monster-image-error', monster)
}
</script>

<style scoped>
.dungeon-monster-panel {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}

.monster-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.monster-card {
  background: linear-gradient(135deg, rgba(40, 40, 60, 0.95), rgba(30, 30, 50, 0.95));
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.monster-card:hover {
  border-color: rgba(255, 215, 0, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.monster-card.is-defeated {
  opacity: 0.4;
  cursor: default;
}

.monster-card.is-defeated:hover {
  transform: none;
  border-color: rgba(255, 255, 255, 0.1);
}

.monster-card.is-fading {
  animation: fadeOut 1s ease forwards;
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

.monster-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.monster-icon-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
}

.monster-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.element-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px;
}

.monster-info {
  width: 100%;
  text-align: center;
}

.monster-name {
  font-size: 13px;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
}

.monster-level {
  font-size: 11px;
  color: #aaa;
  margin-bottom: 6px;
}

.health-bar {
  position: relative;
  height: 12px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  overflow: hidden;
}

.health-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #ff4444, #ff6b6b);
  transition: width 0.3s ease;
}

.health-text {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.monster-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #666;
  font-size: 14px;
}

.no-monsters {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  color: #888;
  font-size: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

@media (max-width: 480px) {
  .monster-list {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .monster-icon-wrapper {
    width: 50px;
    height: 50px;
  }

  .monster-name {
    font-size: 11px;
  }
}
</style>
