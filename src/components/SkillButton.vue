<template>
  <button
    :id="'skill' + skill.key"
    class="skill-btn"
    :class="{ 
      'on-cooldown': cooldownSeconds > 0, 
      'skill-locked': !isUnlocked,
      'passive-skill': isPassive
    }"
    @click="onClick"
    @mouseenter="onMouseEnter"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    @mousedown.prevent
  >
    <img :src="skill.icon" :alt="skill.key + '技能'" :class="{ 'locked-icon': !isUnlocked }" />

    <div v-if="cooldownSeconds > 0" class="cd-overlay">
      <svg class="cd-circle" viewBox="0 0 100 100">
        <circle
          class="cd-circle-bg"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(0,0,0,0.5)"
          stroke-width="8"
        />
        <circle
          class="cd-circle-progress"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#4a9eff"
          stroke-width="8"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="cdOffset"
          stroke-linecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div class="cd-text">{{ cooldownSeconds }}</div>
    </div>

    <div class="proficiency-level">{{ skill.level }}</div>
    <div v-if="isUnlocked" class="proficiency-progress">
      <div v-if="isMaxLevel" class="proficiency-max">MAX</div>
      <template v-else>
        <div class="proficiency-progress-inner" :style="{ width: proficiencyPercent + '%' }"></div>
        <div class="proficiency-text">{{ Math.round(proficiencyPercent) }}%</div>
      </template>
    </div>
    <div v-if="!isUnlocked" class="lock-icon">🔒</div>
    <div v-if="isPassive && isUnlocked" class="passive-badge">被动</div>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { SkillUnlockChecker } from '@/utils/skillUnlockChecker'

const props = defineProps({
  skill: {
    type: Object,
    required: true
  },
  player: {
    type: Object,
    default: () => ({})
  },
  unlockPlayer: {
    type: Object,
    default: null
  },
  gameData: {
    type: Object,
    default: null
  }
})

const circumference = 2 * Math.PI * 45

const cooldownSeconds = computed(() => {
  const rawCooldown = Number(props.skill?.cooldown ?? 0)
  if (!Number.isFinite(rawCooldown) || rawCooldown <= 0) {
    return 0
  }

  if (rawCooldown > 1000) {
    return Math.max(0, Math.ceil(rawCooldown / 1000))
  }

  return Math.max(0, Math.ceil(rawCooldown))
})

const proficiencyPercent = computed(() => {
  const current = Number(props.skill?.proficiency ?? 0)
  const required = Number(props.skill?.proficiencyExp ?? 0)

  if (!Number.isFinite(current) || current <= 0) {
    return 0
  }
  if (!Number.isFinite(required) || required <= 0) {
    return 0
  }

  const percent = (current / required) * 100
  return Math.min(100, Math.max(0, percent))
})

const isMaxLevel = computed(() => {
  const level = Number(props.skill?.level ?? 1)
  const maxLevel = Number(props.skill?.maxLevel ?? 10)
  return level >= maxLevel
})

const baseCooldownSeconds = computed(() => {
  const raw = Number(props.skill.baseCooldown || 0)
  if (!Number.isFinite(raw) || raw <= 0) {
    return 0
  }
  return raw > 1000 ? Math.ceil(raw / 1000) : raw
})

const cdOffset = computed(() => {
  if (baseCooldownSeconds.value <= 0) {
    return 0
  }
  const progress = cooldownSeconds.value / baseCooldownSeconds.value
  const safeProgress = Math.min(1, Math.max(0, progress))
  return circumference * (1 - safeProgress)
})

const effectivePlayer = computed(() => {
  return props.unlockPlayer || props.player
})

const isUnlocked = computed(() => {
  return SkillUnlockChecker.checkSkillUnlockStatus(props.skill, effectivePlayer.value, props.gameData)
})

const isPassive = computed(() => {
  return props.skill?.isPassive === true
})

const emit = defineEmits(['use', 'show-tooltip', 'move-tooltip', 'hide-tooltip'])


const onClick = () => {
  // 被动技能不可点击使用
  if (isPassive.value) {
    return
  }
  if (!isUnlocked.value) {
    return
  }
  emit('use', props.skill.id || props.skill.key)
}

const onMouseEnter = event => {
  emit('show-tooltip', event, props.skill)
}

const onMouseMove = event => {
  emit('move-tooltip', event)
}

const onMouseLeave = () => {
  emit('hide-tooltip')
}
</script>

<style scoped>
  .skill-btn {
    position: relative;
    width: 60px;
    height: 60px;
    border: 2px solid #666;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    padding: 0;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .skill-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: #4a9eff;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(74, 158, 255, 0.3);
  }

  .skill-btn.on-cooldown {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .skill-btn img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cd-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cd-circle {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }

  .cd-circle-bg {
    stroke: rgba(0, 0, 0, 0.5);
  }

  .cd-circle-progress {
    transition: stroke-dashoffset 0.1s linear;
  }

  .cd-text {
    position: relative;
    z-index: 1;
    color: white;
    font-size: 18px;
    font-weight: bold;
    text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
  }

  .proficiency-level {
    position: absolute;
    top: 2px;
    left: 2px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 3px;
  }

  .proficiency-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: rgba(0, 0, 0, 0.5);
    border-top: 1px solid rgba(255, 215, 0, 0.3);
  }

  .proficiency-progress-inner {
    height: 100%;
    background: linear-gradient(90deg, #ffd700, #ffaa00);
    transition: width 0.3s ease;
  }

  .proficiency-text {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: bold;
    color: #ffffff;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
  }

  .proficiency-max {
    height: 100%;
    width: 100%;
    background: linear-gradient(90deg, #ffd700, #ff8c00);
    color: #4fc3f7;
    font-size: 8px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
    letter-spacing: 1px;
  }

  /* 未解锁技能样式 */
  .skill-locked {
    cursor: not-allowed;
    opacity: 0.7;
    position: relative;
  }

  .locked-icon {
    filter: grayscale(100%) brightness(50%);
  }

  .lock-icon {
    position: absolute;
    bottom: 5px;
    right: 5px;
    font-size: 14px;
    color: #ff6347;
    text-shadow: 0 0 2px black;
    z-index: 2;
  }

  /* 被动技能样式 */
  .passive-skill {
    border-color: #9c27b0;
    box-shadow: 0 0 8px rgba(156, 39, 176, 0.3);
  }

  .passive-skill:hover:not(:disabled) {
    border-color: #ba68c8;
    box-shadow: 0 6px 12px rgba(156, 39, 176, 0.4);
    cursor: default;
  }

  .passive-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    background: linear-gradient(135deg, #9c27b0, #7b1fa2);
    color: white;
    font-size: 8px;
    padding: 1px 3px;
    border-radius: 2px;
    font-weight: bold;
    z-index: 2;
  }
</style>
