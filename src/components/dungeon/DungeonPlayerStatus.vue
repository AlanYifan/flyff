<!--
  @file DungeonPlayerStatus.vue
  @description 副本玩家状态组件 - 显示玩家头像、血量、蓝量、经验条
  @generated 2026-03-15
-->
<template>
  <div class="dungeon-player-status">
    <div class="player-card">
      <div class="avatar-frame">
        <img
          class="avatar-image"
          :src="playerAvatar"
          alt="玩家头像"
          draggable="false"
          @error="handleImageError"
        />
      </div>

      <div class="info-area">
        <div class="name-row">
          <span class="player-name">{{ player?.nickname || '未命名' }}</span>
          <span class="player-level">Lv.{{ player?.level || 1 }}</span>
        </div>

        <div class="bar-row">
          <span class="bar-label hp">HP</span>
          <div class="bar-track">
            <div class="bar-fill hp" :style="{ width: hpPercent + '%' }"></div>
            <span class="bar-text">{{ formatNumber(player?.currentHealth) }}/{{ formatNumber(player?.maxHealth) }}</span>
          </div>
        </div>

        <div class="bar-row">
          <span class="bar-label mp">MP</span>
          <div class="bar-track">
            <div class="bar-fill mp" :style="{ width: mpPercent + '%' }"></div>
            <span class="bar-text">{{ formatNumber(player?.currentMana) }}/{{ formatNumber(player?.maxMana) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 副本玩家状态组件
 * 显示玩家的头像、名称、等级、血量条、蓝量条
 */
import { computed } from 'vue'

const props = defineProps({
  /**
   * 玩家数据对象
   * @type {Object}
   */
  player: {
    type: Object,
    required: true
  },
  /**
   * 玩家头像URL
   * @type {String}
   */
  playerAvatar: {
    type: String,
    default: '/pt/UI/default_avatar.png'
  }
})

const emit = defineEmits(['image-error'])

/**
 * 计算血量百分比
 */
const hpPercent = computed(() => {
  const current = Number(props.player?.currentHealth) || 0
  const max = Number(props.player?.maxHealth) || 1
  return Math.max(0, Math.min(100, (current / max) * 100))
})

/**
 * 计算蓝量百分比
 */
const mpPercent = computed(() => {
  const current = Number(props.player?.currentMana) || 0
  const max = Number(props.player?.maxMana) || 1
  return Math.max(0, Math.min(100, (current / max) * 100))
})

/**
 * 格式化数字显示
 * @param {number} num - 要格式化的数字
 * @returns {string} 格式化后的字符串
 */
const formatNumber = (num) => {
  const value = Number(num) || 0
  return value.toLocaleString()
}

/**
 * 处理头像加载错误
 */
const handleImageError = () => {
  emit('image-error')
}
</script>

<style scoped>
.dungeon-player-status {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.95), rgba(20, 20, 40, 0.95));
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
}

.avatar-frame {
  width: 70px;
  height: 70px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.info-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.player-name {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-level {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  padding: 2px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bar-label {
  font-size: 12px;
  font-weight: bold;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.bar-label.hp {
  color: #ff6b6b;
}

.bar-label.mp {
  color: #6bb3ff;
}

.bar-track {
  flex: 1;
  position: relative;
  height: 16px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  transition: width 0.3s ease;
}

.bar-fill.hp {
  background: linear-gradient(90deg, #ff4444, #ff6b6b);
}

.bar-fill.mp {
  background: linear-gradient(90deg, #4a9eff, #6bb3ff);
}

.bar-text {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

@media (max-width: 480px) {
  .player-card {
    padding: 8px;
    gap: 8px;
  }

  .avatar-frame {
    width: 50px;
    height: 50px;
  }

  .player-name {
    font-size: 14px;
  }

  .player-level {
    font-size: 12px;
  }
}
</style>
