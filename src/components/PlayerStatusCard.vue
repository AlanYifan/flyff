<template>
  <div class="player-status-card" @click="$emit('open-detail')">
    <div class="card-inner">
      <div class="avatar-wrapper">
        <div class="avatar-frame">
          <img id="playerAvatar" class="avatar-image" :src="playerAvatar" alt="玩家头像" draggable="false" @error="$emit('image-error')" />
        </div>
        <!-- 技能施法特效：环绕玩家头像边框播放元素施法动画 -->
        <SkillCastEffect />
      </div>

      <div class="info-area">
        <div class="name-row">
          <div class="player-name">
            {{ nickname }}
            <!-- 徽章图标：显示在玩家名称右侧 -->
            <img
              v-if="equippedBadge"
              :src="`/pt/master_icon/${equippedBadge}`"
              :alt="'徽章'"
              class="player-badge-icon"
              @error="$emit('image-error')"
            >
            <!-- 称号角标：显示在玩家名称右上方 -->
            <span v-if="equippedTitle" class="player-title-badge">[{{ equippedTitle }}]</span>
          </div>
          <div class="player-level">Lv{{ level }}</div>
        </div>

        <div class="bar-row">
          <div class="bar-label hp">HP</div>
          <div class="bar-track">
            <div class="bar-fill hp" :style="{ width: hpPercent + '%' }" />
            <div class="bar-text">{{ currentHealth }}/{{ maxHealth }}</div>
          </div>
        </div>

        <div class="bar-row">
          <div class="bar-label mp">MP</div>
          <div class="bar-track">
            <div class="bar-fill mp" :style="{ width: mpPercent + '%' }" />
            <div class="bar-text">{{ currentMana }}/{{ maxMana }}</div>
          </div>
        </div>

        <div class="bar-row">
          <div class="bar-label exp">Exp</div>
          <div class="bar-track exp">
            <div class="bar-fill exp" :style="{ width: expPercent + '%' }" />
            <div class="bar-text exp">{{ expPercent.toFixed(4) }}%</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="lastDamage > 0" class="damage-indicator">-{{ lastDamage }}</div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import SkillCastEffect from './SkillCastEffect.vue'

let lastHpSyncLogAt = 0

const props = defineProps({
  player: {
    type: Object,
    required: true
  },
  playerAvatar: {
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
    default: 0
  }
})

defineEmits(['open-detail', 'image-error'])

/** 玩家昵称 */
const nickname = computed(() => props.player?.nickname || '未命名')
/** 玩家等级 */
const level = computed(() => Number(props.player?.level || 1))
/** 当前佩戴的称号（从 player.achievement.currentTitle 读取） */
const equippedTitle = computed(() => props.player?.achievement?.currentTitle || '')
/** 当前佩戴的徽章文件名（从 player.achievement.currentBadge 读取） */
const equippedBadge = computed(() => props.player?.achievement?.currentBadge || '')

const currentHealth = computed(() => Number(props.player?.currentHealth || 0))
const maxHealth = computed(() => Number(props.player?.maxHealth || 0))
const currentMana = computed(() => Number(props.player?.currentMana || 0))
const maxMana = computed(() => Number(props.player?.maxMana || 0))

const hpPercent = computed(() => Math.max(0, Math.min(100, Number(props.healthPercentage || 0))))
const mpPercent = computed(() => Math.max(0, Math.min(100, Number(props.manaPercentage || 0))))
const expPercent = computed(() => Math.max(0, Math.min(100, Number(props.expPercentage || 0))))

watch(
  () => [
    props.player,
    currentHealth.value,
    maxHealth.value,
    currentMana.value,
    maxMana.value,
    hpPercent.value,
    mpPercent.value,
    expPercent.value
  ],
  () => {
    const now = Date.now()
    if (now - lastHpSyncLogAt < 800) {
      return
    }
    lastHpSyncLogAt = now

    
  }
)
</script>

<style scoped>
.player-status-card {
  width: 285px;
  height: 120px;
  background: var(--theme-section-bg);
  padding: 5px;
  position: relative;
  user-select: none;
  border: 2px solid var(--theme-border-strong);
  border-radius: 10px;
}

.card-inner {
  height: 100%;
  display: flex;
  gap: 5px;
  background: var(--theme-content-bg);
  border-radius: 8px;
  padding: 5px;
  box-sizing: border-box;
}

.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  flex: 0 0 100px;
  align-self: center;
}

.avatar-frame {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: var(--theme-surface-strong);
  overflow: hidden;
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
  justify-content: center;
  gap: 4px;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 0 2px;
  flex-wrap: nowrap;
}

.player-name {
  font-size: 15px;
  color: var(--theme-accent);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.75);
  overflow: visible;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1 1 auto;
  position: relative;
}

/* 称号角标：绝对定位在玩家名称右上方 */
.player-title-badge {
  position: absolute;
  top: -12px;
  right: 0;
  font-size: 10px;
  font-weight: bold;
  color: #ffd700;
  background: rgba(255, 215, 0, 0.12);
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 3px;
  padding: 1px 4px;
  white-space: nowrap;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  line-height: 1.2;
}

/* 徽章图标：显示在玩家名称右侧 */
.player-badge-icon {
  width: 18px;
  height: 18px;
  margin-left: 4px;
  vertical-align: middle;
  object-fit: contain;
  flex-shrink: 0;
}

.player-level {
  font-size: 14px;
  font-weight: 900;
  color: var(--theme-text);
  text-shadow: 0 1px 0 rgb(255, 184, 78);
  flex: 0 0 auto;
}

.bar-row {
  display: grid;
  grid-template-columns: 28px 1fr;
  align-items: center;
  gap: 6px;
}

.bar-label {
  font-size: 12px;
  font-weight: 900;
  text-align: right;
  color: var(--theme-muted);
}

.bar-label.hp {
  color: var(--theme-text);
}

.bar-label.mp {
  color: var(--theme-text);
}

.bar-label.exp {
  color: var(--theme-text);
}

.bar-track {
  position: relative;
  height: 14px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--theme-surface-muted);
  border: 1px solid var(--theme-border);
}

.bar-track.exp {
  background: var(--theme-surface-muted);
}

.bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0%;
  transition: width 0.22s ease;
}

.bar-fill.hp {
  background: linear-gradient(180deg, #ff7a7a 0%, #d23a3a 100%);
}

.bar-fill.mp {
  background: linear-gradient(180deg, #7aa7ff 0%, #3a63d2 100%);
}

.bar-fill.exp {
  background: linear-gradient(180deg, #7dff7a 0%, #35b431 100%);
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
  padding: 0 6px;
  box-sizing: border-box;
  pointer-events: none;
  z-index: 1;
  font-size: 11px;
  font-weight: 900;
  color: var(--theme-text);
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.75);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-text.exp {
  justify-content: center;
  color: var(--theme-text);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}

.damage-indicator {
  position: absolute;
  right: 8px;
  top: -18px;
  color: var(--theme-accent-strong);
  font-weight: 900;
  font-size: 18px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .bar-fill {
    transition: none;
  }
}
</style>
