<!--
  @file DungeonBottomButtons.vue
  @description 副本底部按钮组件 - 提供背包、退出等功能按钮
  @generated 2026-03-15
-->
<template>
  <div class="dungeon-bottom-buttons">
    <button class="bottom-btn bag-btn" @click="handleOpenBag">
      <span class="btn-icon">🎒</span>
      <span class="btn-text">背包</span>
    </button>

    <button class="bottom-btn character-btn" @click="handleOpenCharacter">
      <span class="btn-icon">👤</span>
      <span class="btn-text">角色</span>
    </button>

    <div class="resource-display">
      <div class="gold-display">
        <span class="resource-icon">💰</span>
        <span class="resource-value">{{ formatNumber(player?.gold || 0) }}</span>
      </div>
      <div class="diamond-display">
        <span class="resource-icon">💎</span>
        <span class="resource-value">{{ player?.diamonds || 0 }}</span>
      </div>
    </div>

    <button class="bottom-btn exit-btn" @click="handleExitDungeon">
      <span class="btn-icon">🚪</span>
      <span class="btn-text">退出副本</span>
    </button>
  </div>
</template>

<script setup>
/**
 * 副本底部按钮组件
 * 提供背包、角色、退出副本等功能按钮
 */
import { computed } from 'vue'

const props = defineProps({
  /**
   * 玩家数据
   * @type {Object}
   */
  player: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['open-bag', 'open-character', 'exit-dungeon'])

/**
 * 格式化数字
 * @param {number} num - 要格式化的数字
 * @returns {string} 格式化后的字符串
 */
const formatNumber = (num) => {
  const value = Number(num) || 0
  return value.toLocaleString()
}

/**
 * 打开背包
 */
const handleOpenBag = () => {
  emit('open-bag')
}

/**
 * 打开角色面板
 */
const handleOpenCharacter = () => {
  emit('open-character')
}

/**
 * 退出副本
 */
const handleExitDungeon = () => {
  if (confirm('确定要退出副本吗？退出后副本进度将丢失。')) {
    emit('exit-dungeon')
  }
}
</script>

<style scoped>
.dungeon-bottom-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: linear-gradient(180deg, rgba(20, 20, 40, 0.95), rgba(10, 10, 25, 0.98));
  border-top: 2px solid rgba(255, 215, 0, 0.3);
  padding: 10px 15px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.bottom-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: bold;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
}

.bottom-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.bag-btn {
  border-color: rgba(76, 175, 80, 0.5);
}

.bag-btn:hover {
  border-color: rgba(76, 175, 80, 0.8);
  background: rgba(76, 175, 80, 0.2);
}

.character-btn {
  border-color: rgba(33, 150, 243, 0.5);
}

.character-btn:hover {
  border-color: rgba(33, 150, 243, 0.8);
  background: rgba(33, 150, 243, 0.2);
}

.exit-btn {
  border-color: rgba(244, 67, 54, 0.5);
}

.exit-btn:hover {
  border-color: rgba(244, 67, 54, 0.8);
  background: rgba(244, 67, 54, 0.2);
}

.btn-icon {
  font-size: 18px;
}

.btn-text {
  display: inline;
}

.resource-display {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  justify-content: center;
}

.gold-display,
.diamond-display {
  display: flex;
  align-items: center;
  gap: 6px;
}

.resource-icon {
  font-size: 16px;
}

.resource-value {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
}

@media (max-width: 600px) {
  .dungeon-bottom-buttons {
    padding: 8px 10px;
    gap: 6px;
  }

  .bottom-btn {
    padding: 8px 10px;
    font-size: 12px;
  }

  .btn-text {
    display: none;
  }

  .btn-icon {
    font-size: 20px;
  }

  .resource-display {
    gap: 12px;
  }

  .resource-value {
    font-size: 12px;
  }
}
</style>
