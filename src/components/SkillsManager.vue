<template>
  <div class="skills-manager">
    <!-- 技能详情面板 -->
    <SkillTooltip
      ref="skillTooltipRef"
      :visible="skillTooltip.visible"
      :skill="skillTooltip.skill"
      :position="skillTooltip.position"
      :player="props.player"
      :player-class="playerClass"
      :active-buffs="props.activeBuffs"
      :non-interactive="true"
    />

    <!-- 技能栏 -->
    <SkillBar
      v-if="props.showSkillBar"
      :skills="skills"
      :player="props.player"
      :game-data="props.gameData"
      @use-skill="onUseSkill"
      @show-tooltip="onShowSkillTooltip"
      @move-tooltip="onMoveSkillTooltip"
      @hide-tooltip="onHideSkillTooltip"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useUnifiedSkills } from '@/composables/useUnifiedSkills'
import { SkillUnlockChecker } from '@/utils/skillUnlockChecker'
import SkillBar from './SkillBar.vue'
import SkillTooltip from './SkillTooltip.vue'

const props = defineProps({
  player: {
    type: Object,
    required: false,
    default: () => ({})
  },
  gameData: {
    type: Object,
    required: false,
    default: () => ({})
  },
  gameInitializer: {
    type: Object,
    required: false,
    default: null
  },
  autoBattleService: {
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
})

const emit = defineEmits(['add-battle-log', 'show-damage-number', 'update-player-mana'])

const {
  skills,
  skillTooltip,
  initSkills: unifiedInitSkills,
  useSkill: unifiedUseSkill,
  showSkillTooltip: unifiedShowSkillTooltip,
  moveSkillTooltip: unifiedMoveSkillTooltip,
  hideSkillTooltip: unifiedHideSkillTooltip,
  skillService
} = useUnifiedSkills()

/**
 * 玩家职业 key（直接从 props.player.class 派生，确保始终有值且为小写）
 * 不依赖 store 的 initSkills 调用时机，避免 playerClass 为空导致 buffEffectLines 计算失败
 */
const playerClass = computed(() => {
  const cls = props.player?.class
  return cls ? String(cls).toLowerCase() : ''
})

const skillTooltipRef = ref(null)
const lastInitializedClass = ref(null)

const initSkills = () => {
  // console.log('[SkillsManager] initSkills called with player:', props.player?.class, 'gameData keys:', Object.keys(props.gameData || {}))
  unifiedInitSkills(props.player, props.gameData)
  // console.log('[SkillsManager] After unifiedInitSkills, skills.value:', skills.value)
}

/**
 * 调用统一技能使用函数
 * @param {Object|string} skillOrKey - 技能对象或技能 key/id 字符串
 */
const useSkill = skillOrKey => {
  unifiedUseSkill(
    skillOrKey,
    props.player,
    props.gameInitializer,
    props.monsters,
    props.activeBuffs,
    msg => emit('add-battle-log', msg),
    (index, damage, isCrit, isHeal, skill) =>
      emit('show-damage-number', index, damage, isCrit, isHeal, skill),
    props.triggerSkillAnimation
  )
}

const showSkillTooltip = (event, skill) => {
  unifiedShowSkillTooltip(event, skill)
}

const moveSkillTooltip = event => {
  unifiedMoveSkillTooltip(event)
}

const hideSkillTooltip = () => {
  unifiedHideSkillTooltip()
}

/**
 * 使用技能
 * 接收 SkillBar 传来的技能对象（或兼容旧的 skillKey 字符串）
 * @param {Object|string} skillOrKey - 技能对象或技能 key/id 字符串
 */
const onUseSkill = skillOrKey => {
  useSkill(skillOrKey)
}

const onShowSkillTooltip = (event, skill) => {
  showSkillTooltip(event, skill)
}

const onMoveSkillTooltip = event => {
  moveSkillTooltip(event)
}

const onHideSkillTooltip = () => {
  hideSkillTooltip()
}

const onSkillUnlocked = () => {
  initSkills()
 
}

watch(
  () => props.player?.level,
  (newLevel, oldLevel) => {
    if (newLevel && oldLevel && newLevel > oldLevel) {
    
      setTimeout(() => {
        try {
          const sampleSkill = Array.isArray(skills.value) ? skills.value[0] : null
          if (sampleSkill) {
            SkillUnlockChecker.checkSkillUnlockStatus(sampleSkill, props.player, props.gameData)
          }
 
        } catch (error) {
          console.error('[SkillsManager] 升级后解锁检查失败:', error)
        }
        onSkillUnlocked()
      }, 50)
    }
  }
)

watch(
  () => [props.player?.class, props.gameData],
  ([newClass, newGameData]) => {
  
    // 只有当 class 真正改变时才重新初始化技能
    if (newClass && newGameData && Object.keys(newGameData).length > 0) {
      if (newClass !== lastInitializedClass.value) {
    
        initSkills()
        lastInitializedClass.value = newClass
      }
    }
  },
  { immediate: true }
)

defineExpose({
  initSkills,
  useSkill,
  skills,
  skillService
})
</script>

<style scoped>
  .skills-manager {
    /* 技能管理器的样式 */
  }
</style>
