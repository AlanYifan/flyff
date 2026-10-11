<template>
  <div class="main-container" :style="mainContainerStyle">
    <!-- 上部分布局 -->
    <div class="top-section" :class="{ 'battle-mode': showMonsters }">
      <!-- 左侧区域 -->
      <PlayerInfoPanel
        ref="playerInfoPanelRef"
        :player="player"
        :player-avatar="playerAvatar"
        :player-class-name="playerClassName"
        :health-percentage="healthPercentage"
        :mana-percentage="manaPercentage"
        :exp-percentage="expPercentage"
        :last-damage="lastDamage"
        :battle-logs="battleLogs"
        :user-settings="userSettings"
        :current-map="currentMap"
        :game-initializer="gameInitializer"
        :game-data="gameData"
        :active-buffs="activeBuffs"
        :exp-multiplier="expMultiplier"
        :drop-rate="dropRate"
        :auto-battle="autoBattle"
        :is-active="autoBattle"
        :ui-exp-numbers="uiExpNumbers"
        @open-player-detail-modal="$emit('open-player-detail-modal')"
        @handle-image-error="$emit('handle-image-error')"
        @add-battle-log="$emit('add-battle-log', $event)"
        @handle-auto-battle-attack="$emit('handle-auto-battle-attack', $event)"
        @handle-auto-battle-skill-use="$emit('handle-auto-battle-skill-use', $event)"
        @player-death="$emit('player-death')"
        @player-damage="$emit('player-damage', $event)"
        @update-last-damage="$emit('update-last-damage', $event)"
        @use-recovery-item="$emit('use-recovery-item', $event)"
        @refresh-monsters="$emit('refresh-monsters')"
        @check-and-refresh-monsters="$emit('check-and-refresh-monsters')"
        @update-monsters-from-auto-battle="$emit('update-monsters-from-auto-battle', $event)"
        @show-damage-number="handleShowDamageNumber"
        @monster-attack-animation="$emit('monster-attack-animation', $event)"
      />

            <!-- 中间区域 -->
      <div class="middle-section">
        <NPCContainer
          :current-map="currentMap"
          :player="player"
          :game-data="gameData"
          :show-npc="showNpc"
          @open-job-change-modal="$emit('open-job-change-modal')"
          @open-storage-modal="$emit('open-storage-modal')"
          @open-npc-quest-panel="$emit('open-npc-quest-panel')"
          @open-dialogue="$emit('open-dialogue', $event)"
          @open-tower-modal="$emit('open-tower-modal')"
          @open-shop-modal="$emit('open-shop-modal')"
          @open-blacksmith-modal="$emit('open-blacksmith-modal')"
          @open-armor-shop-modal="$emit('open-armor-shop-modal')"
          @open-food-shop-modal="$emit('open-food-shop-modal')"
          @open-magic-shop-modal="$emit('open-magic-shop-modal')"
          @open-pet-trainer-modal="$emit('open-pet-trainer-modal')"
          @open-jewelry-master-modal="$emit('open-jewelry-master-modal')"
          @open-huafu-shop-modal="$emit('open-huafu-shop-modal')"
        />
      </div>

      <!-- 右侧区域 -->
      <MonsterInfoPanel
        ref="monsterInfoPanelRef"
        :show-monsters="showMonsters"
        :monster-display-count="monsterDisplayCount"
        :monsters="monsters"
        :ui-damage-numbers="uiDamageNumbers"
        :ui-damage-buckets="uiDamageBuckets"
        :get-monster-display-name="getMonsterDisplayNameFromEvent()"
        :auto-battle="autoBattle"
        :trigger-arrow-rain="triggerArrowRain"
        @attack-monster="$emit('attack-monster', $event)"
        @handle-monster-image-error="$emit('handle-monster-image-error', $event)"
        @show-monster-drops-panel="$emit('show-monster-drops-panel', $event)"
        @arrow-rain-animation-done="$emit('arrow-rain-animation-done')"
      />
    </div>

    <!-- 下部分布局 -->
    <BottomSection
      ref="bottomSectionRef"
      :player="player"
      :game-data="gameData"
      :game-initializer="gameInitializer"
      :monsters="monsters"
      :active-buffs="activeBuffs"
      :trigger-skill-animation="triggerPlayerSkillAnimation"
      :show-skill-bar="showSkillBar"
      @add-battle-log="$emit('add-battle-log', $event)"
      @show-damage-number="handleShowDamageNumber"
      @update-player-mana="$emit('update-player-mana', $event)"
      @open-bag-modal="$emit('open-bag-modal')"
      @open-equipment-modal="$emit('open-equipment-modal')"
      @open-quest-panel="$emit('open-quest-panel')"
      @open-player-detail-modal="$emit('open-player-detail-modal')"
      @open-map-modal="$emit('open-map-modal')"
      @open-settings-modal="$emit('open-settings-modal')"
      @open-database-query-modal="$emit('open-database-query-modal')"
    />
    <DamageNumber :global-damage-numbers="uiDamageNumbers" />
  </div>
</template>

<script>
import PlayerInfoPanel from './PlayerInfoPanel.vue'
import MonsterInfoPanel from './MonsterInfoPanel.vue'
import BottomSection from './BottomSection.vue'
import NPCContainer from './NPCContainer.vue'
import DamageNumber from './DamageNumber.vue'

export default {
  name: 'MainLayout',
  components: {
    PlayerInfoPanel,
    MonsterInfoPanel,
    BottomSection,
    NPCContainer,
    DamageNumber
  },
  props: {
    player: {
      type: Object,
      required: true
    },
    playerAvatar: {
      type: String,
      required: true
    },
    playerClassName: {
      type: String,
      required: true
    },
    healthPercentage: {
      type: Number,
      required: true
    },
    manaPercentage: {
      type: Number,
      required: true
    },
    expPercentage: {
      type: Number,
      required: true
    },
    lastDamage: {
      type: Number,
      required: true
    },
    battleLogs: {
      type: Array,
      required: true
    },
    showMonsters: {
      type: Boolean,
      required: true
    },
    monsterDisplayCount: {
      type: Number,
      required: true
    },
    monsters: {
      type: Array,
      required: true
    },
    uiDamageNumbers: {
      type: Array,
      required: false,
      default: () => []
    },
    uiExpNumbers: {
      type: Array,
      required: false,
      default: () => []
    },
    userSettings: {
      type: Object,
      required: true
    },
    currentMap: {
      type: Object,
      required: true
    },
    gameInitializer: {
      type: Object,
      required: false,
      default: null
    },
    gameData: {
      type: Object,
      required: true
    },
    activeBuffs: {
      type: Array,
      required: true
    },
    expMultiplier: {
      type: Number,
      required: true
    },
    dropRate: {
      type: Number,
      required: true
    },
    autoBattle: {
      type: Boolean,
      required: true
    },
    autoBattleService: {
      type: Object,
      required: false,
      default: null
    },
    skillService: {
      type: Object,
      required: false,
      default: null
    },
    getMonsterDisplayName: {
      type: Function,
      required: false,
      default: null
    },
    /** 是否触发箭雨特效动画 */
    triggerArrowRain: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: [
    'open-player-detail-modal',
    'handle-image-error',
    'add-battle-log',
    'handle-auto-battle-attack',
    'handle-auto-battle-skill-use',
    'player-skill-use',
    'player-damage',
    'use-recovery-item',
    'refresh-monsters',
    'check-and-refresh-monsters',
    'update-monsters-from-auto-battle',
    'open-job-change-modal',
    'open-storage-modal',
    'open-npc-quest-panel',
    'open-dialogue',
    'open-tower-modal',
    'open-shop-modal',
    'open-blacksmith-modal',
    'open-armor-shop-modal',
    'open-food-shop-modal',
    'open-magic-shop-modal',
    'open-pet-trainer-modal',
    'open-jewelry-master-modal',
    'open-huafu-shop-modal',
    'attack-monster',
    'handle-monster-image-error',
    'show-monster-drops-panel',
    'get-monster-display-name',
    'show-damage-number',
    'monster-attack-animation',
    'update-last-damage',
    'update-player-mana',
    'open-bag-modal',
    'open-equipment-modal',
    'open-quest-panel',
    'open-map-modal',
    'open-settings-modal',
    'open-database-query-modal',
    'arrow-rain-animation-done'
  ],
  data () {
    return {
      uiScale: 1
    }
  },
  computed: {
    mainContainerStyle () {
      return {
        '--ui-scale': this.uiScale
      }
    },
    showNpc () {
      return this.userSettings?.showNpc !== false
    },
    showSkillBar () {
      return this.userSettings?.showSkillBar !== false
    },
    uiDamageBuckets () {
      const list = Array.isArray(this.uiDamageNumbers) ? this.uiDamageNumbers : []
      const buckets = {}
      for (let i = 0; i < list.length; i++) {
        const item = list[i]
        if (!item || typeof item !== 'object') {
          continue
        }
        const targetIndex = Number(item.targetIndex ?? -1)
        const key = String(Number.isFinite(targetIndex) ? targetIndex : -1)
        let bucket = buckets[key]
        if (!bucket) {
          bucket = { hit: [], miss: [] }
          buckets[key] = bucket
        }
        if (item.isMiss) {
          bucket.miss.push(item)
        } else {
          bucket.hit.push(item)
        }
      }
      return buckets
    }
  },
  watch: {
    skillService: {
      handler (newVal) {
        console.log('[MainLayout] skillService 变化:', newVal)
        // 更新 PlayerInfoPanel 的 localSkillService
        if (
          this.$refs.playerInfoPanelRef &&
            this.$refs.playerInfoPanelRef.localSkillService !== undefined
        ) {
          console.log('[MainLayout] 更新 PlayerInfoPanel 的 localSkillService')
          this.$refs.playerInfoPanelRef.localSkillService = newVal
        }
      },
      immediate: true
    }
  },
  mounted () {
    this.updateMainScale()
    window.addEventListener('resize', this.updateMainScale)
  },
  beforeUnmount () {
    window.removeEventListener('resize', this.updateMainScale)
  },
  methods: {
    updateMainScale () {
      const baseWidth = 1920
      const baseHeight = 1080
      const minWidth = 1024
      const minHeight = 768
      const widthScale = window.innerWidth / baseWidth
      const heightScale = window.innerHeight / baseHeight
      const minScale = Math.min(minWidth / baseWidth, minHeight / baseHeight)
      const nextScale = Math.max(minScale, Math.min(widthScale, heightScale))
      this.uiScale = Number.isFinite(nextScale) ? nextScale : 1
    },
    handleShowDamageNumber (...args) {
      this.$emit('show-damage-number', ...args)
    },
    // 将事件处理器转换为函数
    getMonsterDisplayNameFromEvent () {
      // 如果直接有 getMonsterDisplayName prop，直接使用
      if (this.getMonsterDisplayName && typeof this.getMonsterDisplayName === 'function') {
        return this.getMonsterDisplayName
      }
      // 否则尝试从事件处理器获取
      const eventHandler =
          this.$attrs &&
          (this.$attrs['onGetMonsterDisplayName'] ||
            this.$attrs['onGetMonsterDisplayName-name'] ||
            this.$attrs['get-monster-display-name'])
      return typeof eventHandler === 'function' ? eventHandler : null
    },
    // 触发玩家攻击动画
    triggerPlayerAttackAnimation () {
      if (this.$refs.playerInfoPanelRef && this.$refs.playerInfoPanelRef.triggerPlayerAttack) {
        this.$refs.playerInfoPanelRef.triggerPlayerAttack()
      }
    },
    // 触发玩家技能动画
    triggerPlayerSkillAnimation () {
      if (this.$refs.playerInfoPanelRef && this.$refs.playerInfoPanelRef.triggerPlayerSkill) {
        this.$refs.playerInfoPanelRef.triggerPlayerSkill()
      }
    },
    // 触发怪物攻击动画
    triggerMonsterAttackAnimation (monsterIndex) {
      if (this.$refs.monsterInfoPanelRef && this.$refs.monsterInfoPanelRef.triggerMonsterAttack) {
        this.$refs.monsterInfoPanelRef.triggerMonsterAttack(monsterIndex)
      }
    },
    // 获取 skillService
    getSkillService () {
      if (this.$refs.bottomSectionRef && this.$refs.bottomSectionRef.$refs.skillsManagerRef) {
        return this.$refs.bottomSectionRef.$refs.skillsManagerRef.skillService
      }
      return null
    }
  }
}
</script>

<style scoped>
/**
 * MainLayout 布局样式
 * 游戏主界面整体布局：上方三栏区域 + 下方统一操作栏
 * 采用深色玻璃拟态风格，棕色金属边框
 */

/* ===== 主容器 ===== */
.main-container {
  background: var(--theme-section-bg);
  border: 2px solid var(--theme-border);
  border-radius: 14px;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  overflow: hidden;
}

/* ===== 上方区域 ===== */
.top-section {
  display: flex;
  flex: 1;
  gap: 10px;
  padding: 10px 12px 6px;
  margin-bottom: 0;
}

/* ===== 面板通用样式（覆盖全局 left/middle/right-section） ===== */
:deep(.left-section),
:deep(.middle-section),
:deep(.right-section) {
  display: flex;
  flex-direction: column;
  background: var(--theme-section-bg) !important;
  border-radius: 12px !important;
  padding: 12px !important;
  min-width: 0;
  border: 1px solid var(--theme-border) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35) !important;
  backdrop-filter: blur(6px);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

:deep(.left-section) {
  width: 20%;
}

.top-section:not(.battle-mode) :deep(.middle-section) {
  width: 80%;
}

.top-section.battle-mode :deep(.middle-section) {
  display: none !important;
}

:deep(.right-section) {
  width: 60%;
  display: none;
  min-width: 0;
}

:deep(.right-section.show-monsters) {
  display: flex !important;
}

.top-section.battle-mode :deep(.right-section) {
  width: 80%;
}

/* ===== NPC 容器布局（具体卡片样式由 NPCContainer 组件自身管理） ===== */
:deep(.map-display) {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

/* ===== 怪物面板增强 ===== */
:deep(.multi-monster-container) {
  display: flex;
  gap: 16px;
  padding: 10px;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: center;
  justify-content: center;
}

:deep(.monster-info-top) {
  flex: 1;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* ===== 玩家状态卡片增强 ===== */
:deep(.player-status-card) {
  background: var(--theme-content-bg) !important;
  border: 1px solid var(--theme-border-strong) !important;
  border-radius: 10px !important;
}

/* ===== 战斗信息面板：保持浮动但优化外观 ===== */
:deep(.battle-section) {
  background: var(--theme-battle-section-bg) !important;
  border: 1px solid var(--theme-border-strong) !important;
  border-radius: 10px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(8px);
  color: var(--theme-text);
}

/* ===== 底部区域 ===== */
:deep(.down-section) {
  background: transparent !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

/* ===== 滚动条美化 ===== */
:deep(.map-display::-webkit-scrollbar),
:deep(.monster-info-top::-webkit-scrollbar) {
  width: 6px;
}

:deep(.map-display::-webkit-scrollbar-track),
:deep(.monster-info-top::-webkit-scrollbar-track) {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

:deep(.map-display::-webkit-scrollbar-thumb),
:deep(.monster-info-top::-webkit-scrollbar-thumb) {
  background: var(--theme-border);
  border-radius: 3px;
}

:deep(.map-display::-webkit-scrollbar-thumb:hover),
:deep(.monster-info-top::-webkit-scrollbar-thumb:hover) {
  background: var(--theme-border-strong);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .top-section {
    flex-direction: column;
  }
}
</style>
