<!--
  @file DungeonSkillBar.vue
  @description 副本技能栏组件 - 显示玩家可用技能
  @generated 2026-03-15
  @updated 2026-07-17 统一使用 SkillTooltip 组件，与技能面板K/底部技能栏保持一致
-->

<template>
  <div class="dungeon-skill-bar">
    <div v-if="skills.length === 0" class="no-skills">
      <span>没有可用技能</span>
    </div>
    <div v-else class="skill-list">
      <div
        v-for="skill in displaySkills"
        :key="skill.key"
        class="skill-item"
        :class="{
          'on-cooldown': isOnCooldown(skill),
          'disabled': !canUseSkill(skill)
        }"
        @click="handleUseSkill(skill)"
        @mouseenter="showTooltip(skill, $event)"
        @mousemove="moveTooltip($event)"
        @mouseleave="hideTooltip"
      >
        <div class="skill-icon-wrapper">
          <img
            class="skill-icon"
            :src="skill.icon || '/pt/skill_icon/default_skill.png'"
            :alt="skill.name"
            @error="handleImageError"
          />
          <div v-if="isOnCooldown(skill)" class="cooldown-overlay">
            <span class="cooldown-text">{{ getCooldownText(skill) }}</span>
          </div>
        </div>
        <div class="skill-name">{{ skill.name }}</div>
      </div>
    </div>
  </div>

  <!-- 统一技能详情提示框（与技能面板K/底部技能栏共用 SkillTooltip 组件） -->
  <SkillTooltip
    :visible="tooltipVisible"
    :skill="tooltipSkill"
    :position="tooltipPosition"
    :player="props.player"
    :player-class="playerClass"
    :active-buffs="[]"
    :non-interactive="true"
  />
</template>

<script setup>
/**
 * 副本技能栏组件
 * 显示玩家可用的技能列表
 */
import { computed, ref } from 'vue'
import SkillTooltip from '@/components/SkillTooltip.vue'

const props = defineProps({
  /**
   * 技能列表
   * @type {Array}
   */
  skills: {
    type: Array,
    default: () => []
  },
  /**
   * 玩家数据
   * @type {Object}
   */
  player: {
    type: Object,
    default: () => ({})
  },
  /**
   * 技能冷却状态
   * @type {Object}
   */
  cooldowns: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['use-skill'])

/** 技能详情提示状态 */
const tooltipVisible = ref(false)
const tooltipSkill = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })

/** 玩家职业 key（用于 SkillTooltip 伤害计算） */
const playerClass = computed(() => {
  const cls = props.player?.class
  return cls ? cls.toLowerCase() : ''
})

/**
 * 显示的技能列表（最多显示8个）
 */
const displaySkills = computed(() => {
  const list = Array.isArray(props.skills) ? props.skills : []
  return list.slice(0, 8)
})

/**
 * 检查技能是否在冷却中
 * @param {Object} skill - 技能对象
 * @returns {boolean} 是否在冷却中
 */
const isOnCooldown = (skill) => {
  if (!skill || !props.cooldowns) {
    return false
  }
  const cooldownEnd = props.cooldowns[skill.key] || 0
  return Date.now() < cooldownEnd
}

/**
 * 获取冷却时间文本
 * @param {Object} skill - 技能对象
 * @returns {string} 冷却时间文本
 */
const getCooldownText = (skill) => {
  if (!skill || !props.cooldowns) {
    return ''
  }
  const cooldownEnd = props.cooldowns[skill.key] || 0
  const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000)
  return remaining > 0 ? `${remaining}s` : ''
}

/**
 * 检查是否可以使用技能
 * @param {Object} skill - 技能对象
 * @returns {boolean} 是否可以使用
 */
const canUseSkill = (skill) => {
  if (!skill || !props.player) {
    return false
  }
  // 检查蓝量是否足够
  const mpCost = Number(skill.mpCost) || 0
  const currentMana = Number(props.player.currentMana) || 0
  if (mpCost > currentMana) {
    return false
  }
  // 检查是否在冷却中
  return !isOnCooldown(skill)
}

/**
 * 处理使用技能
 * @param {Object} skill - 技能对象
 */
const handleUseSkill = (skill) => {
  if (!canUseSkill(skill)) {
    return
  }
  emit('use-skill', skill)
}

/**
 * 显示技能详情提示
 * @param {Object} skill - 技能对象
 * @param {MouseEvent} event - 鼠标事件
 */
const showTooltip = (skill, event) => {
  tooltipSkill.value = skill
  tooltipPosition.value = { x: event.clientX, y: event.clientY }
  tooltipVisible.value = true
}

/**
 * 移动技能详情提示（跟随鼠标）
 * @param {MouseEvent} event - 鼠标事件
 */
const moveTooltip = (event) => {
  tooltipPosition.value = { x: event.clientX, y: event.clientY }
}

/**
 * 隐藏技能详情提示
 */
const hideTooltip = () => {
  tooltipVisible.value = false
  tooltipSkill.value = null
}

/**
 * 处理图片加载错误
 */
const handleImageError = (event) => {
  if (event?.target) {
    event.target.src = '/pt/skill_icon/default_skill.png'
  }
}
</script>

<style scoped>
.dungeon-skill-bar {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.95), rgba(20, 20, 40, 0.95));
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 10px;
}

.no-skills {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  color: #888;
  font-size: 14px;
}

.skill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.skill-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 70px;
}

.skill-item:hover:not(.disabled):not(.on-cooldown) {
  border-color: rgba(255, 215, 0, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.skill-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-item.on-cooldown {
  cursor: wait;
}

.skill-icon-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
}

.skill-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.cooldown-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.cooldown-text {
  font-size: 12px;
  font-weight: bold;
  color: #fff;
}

.skill-name {
  font-size: 10px;
  color: #ccc;
  text-align: center;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 480px) {
  .skill-item {
    min-width: 60px;
    padding: 6px;
  }

  .skill-icon-wrapper {
    width: 32px;
    height: 32px;
  }

  .skill-name {
    font-size: 9px;
    max-width: 50px;
  }
}
</style>
