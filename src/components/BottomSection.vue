<template>
  <div class="down-section">
    <!-- 统一底部操作栏 -->
    <div class="bottom-bar">
      <!-- 左侧：功能按钮组 -->
      <div class="bottom-buttons">
        <button id="bagButton" class="action-btn" @click="openBagModal">
          <span class="btn-icon">🎒</span>
          <span class="btn-label">背包</span>
        </button>
        <button id="questButton" class="action-btn" @click="openQuestPanel">
          <span class="btn-icon">📜</span>
          <span class="btn-label">任务</span>
        </button>
        <button id="charButton" class="action-btn" @click="openPlayerDetailModal">
          <span class="btn-icon">👤</span>
          <span class="btn-label">角色</span>
        </button>
        <button class="action-btn" @click="openMapModal">
          <span class="btn-icon">🗺️</span>
          <span class="btn-label">地图</span>
        </button>
      </div>

      <!-- 中间：技能管理器 -->
      <SkillsManager
        ref="skillsManagerRef"
        :player="player"
        :game-data="gameData"
        :game-initializer="gameInitializer"
        :monsters="monsters"
        :active-buffs="activeBuffs"
        :trigger-skill-animation="triggerSkillAnimation"
        :show-skill-bar="showSkillBar"
        @add-battle-log="addBattleLog"
        @show-damage-number="showDamageNumber"
        @update-player-mana="updatePlayerMana"
      />

      <!-- 右侧：系统按钮组 -->
      <div class="bottom-buttons right-group">
        <div class="diamond-display">💎 {{ player.diamonds }}</div>
        <button id="settingsButton" class="action-btn icon-only" @click="openSettingsModal">
          <img src="/pt/UI/setting_button.png" alt="设置" class="settings-icon" />
        </button>
        <button id="dbQueryButton" class="action-btn icon-only" title="数据库查询" @click="openDatabaseQueryModal">
          <img src="/pt/skill_icon/farsight.png" alt="查询" class="query-icon" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import SkillsManager from './SkillsManager.vue'

export default {
  name: 'BottomSection',
  components: {
    SkillsManager
  },
  props: {
    player: {
      type: Object,
      required: true
    },
    gameData: {
      type: Object,
      required: true
    },
    gameInitializer: {
      type: Object,
      required: false,
      default: null
    },
    monsters: {
      type: Array,
      required: true
    },
    activeBuffs: {
      type: Array,
      required: true
    },
    triggerSkillAnimation: {
      type: Function,
      required: false,
      default: null
    },
    showSkillBar: {
      type: Boolean,
      default: true
    }
  },
  emits: [
    'addBattleLog',
    'showDamageNumber',
    'updatePlayerMana',
    'openBagModal',
    'openQuestPanel',
    'openPlayerDetailModal',
    'openMapModal',
    'openSettingsModal',
    'openDatabaseQueryModal'
  ],
  methods: {
    addBattleLog (log) {
      this.$emit('addBattleLog', log)
    },
    showDamageNumber (...args) {
      this.$emit('showDamageNumber', ...args)
    },
    updatePlayerMana (data) {
      this.$emit('updatePlayerMana', data)
    },
    openBagModal () {
      this.$emit('openBagModal')
    },
    openQuestPanel () {
      this.$emit('openQuestPanel')
    },
    openPlayerDetailModal () {
      this.$emit('openPlayerDetailModal')
    },
    openMapModal () {
      this.$emit('openMapModal')
    },
    openSettingsModal () {
      this.$emit('openSettingsModal')
    },
    openDatabaseQueryModal () {
      this.$emit('openDatabaseQueryModal')
    }
  }
}
</script>

<style scoped>
/**
 * 底部区域样式：统一底部操作栏布局
 * 包含功能按钮组、技能栏、系统按钮组三段式布局
 */

.down-section {
  flex-shrink: 0;
  padding: 0 12px 12px;
}

/** 底部操作栏：三段式水平布局 */
.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--theme-section-bg);
  border: 1px solid var(--theme-border);
  border-radius: 12px;
  padding: 8px 16px;
  box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
}

/** 按钮组容器 */
.bottom-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  position: static !important;
  transform: none !important;
  background: transparent !important;
  border-radius: 0 !important;
  padding: 0 !important;
  bottom: auto !important;
  left: auto !important;
  z-index: auto !important;
}

/** 功能按钮 */
.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 64px;
  height: 52px;
  padding: 6px 10px;
  background: var(--theme-button-bg);
  border: 1px solid var(--theme-border);
  border-radius: 8px;
  color: var(--theme-button-text);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: static;
}

.action-btn:hover {
  background: var(--theme-button-hover);
  border-color: var(--theme-accent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--theme-accent) 15%, transparent);
  transform: translateY(-2px);
}

.action-btn:active {
  transform: translateY(0);
}

.action-btn.icon-only {
  min-width: 40px;
  width: 40px;
  height: 40px;
  padding: 6px;
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
}

.btn-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--theme-muted);
}

.action-btn img {
  width: 22px;
  height: 22px;
}

/** 钻石显示 */
.diamond-display {
  font-size: 14px;
  font-weight: bold;
  color: var(--theme-accent);
  background: var(--theme-item-bg);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--theme-accent) 25%, transparent);
  white-space: nowrap;
}

/** 覆盖技能栏的 fixed 定位，使其融入底部栏 */
:deep(.skill-bar) {
  position: static !important;
  transform: none !important;
  bottom: auto !important;
  left: auto !important;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
  z-index: auto !important;
}

:deep(.skills-manager) {
  flex: 1;
  display: flex;
  justify-content: center;
}

/** 右侧按钮组 */
.right-group {
  gap: 6px;
}
</style>
