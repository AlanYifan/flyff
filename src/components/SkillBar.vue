<template>
  <div class="skill-bar">
    <!-- 空状态提示 -->
    <div v-if="slotSkills.every(s => s === null)" class="empty-hint">
      <span class="empty-hint-text">从技能面板(K)拖拽主动技能到此</span>
    </div>

    <!-- 技能槽位 -->
    <div
      v-for="(slotSkill, index) in slotSkills"
      :key="'slot-' + index"
      class="skill-slot"
      :class="{
        'slot-empty': !slotSkill,
        'slot-filled': slotSkill,
        'slot-hover': hoverSlotIndex === index,
        'slot-dragging': draggingSlotIndex === index
      }"
      @dragover="onSlotDragOver($event, index)"
      @dragleave="onSlotDragLeave($event, index)"
      @drop="onSlotDrop($event, index)"
      @contextmenu.prevent="onSlotRightClick(index)"
    >
      <!-- 已放置技能 -->
      <template v-if="slotSkill">
        <div
          class="slot-skill-wrapper"
          :draggable="true"
          @dragstart="onBarDragStart($event, index, slotSkill.id)"
          @dragend="onDragEnd"
        >
          <SkillButton
            :skill="slotSkill"
            :player="props.player"
            :unlock-player="unlockPlayer"
            :game-data="props.gameData"
            @use="onUseSkill"
            @show-tooltip="onShowSkillTooltip"
            @move-tooltip="onMoveSkillTooltip"
            @hide-tooltip="onHideSkillTooltip"
          />
          <button
            class="slot-remove-btn"
            title="移除技能"
            @click.stop="removeFromSlot(index)"
          >×</button>
        </div>
      </template>

      <!-- 空槽位占位 -->
      <template v-else>
        <div class="slot-placeholder">
          <span class="slot-index">{{ index + 1 }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
/**
 * SkillBar 组件
 * 用途/业务意图：底部技能栏，支持从技能面板拖拽主动技能到槽位
 * 槽位数据通过 Pinia Store（skillBarSlots）持久化管理
 * 仅主动技能可拖入，被动技能不可拖拽
 */
import { computed } from 'vue'
import SkillButton from './SkillButton.vue'
import { useSkillBarSlotsStore, SKILL_BAR_SLOT_COUNT } from '@/store/skillBarSlots'
import { useSkillBarDrag } from '@/composables/useSkillBarDrag'
import { SKILL_CONFIG } from '@/data/skills'
import { JOB_EVOLUTION_PATHS, JOB_TIER_CONFIG } from '@/store/jobs'
import { useSkillsStore } from '@/store/skills'

const props = defineProps({
  /** 全部技能列表（用于根据槽位 key 解析技能对象） */
  skills: {
    type: Array,
    default: () => []
  },
  /** 玩家数据 */
  player: {
    type: Object,
    default: () => ({})
  },
  /** 游戏数据 */
  gameData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['use-skill', 'show-tooltip', 'move-tooltip', 'hide-tooltip'])

/** 技能栏槽位 Store */
const slotsStore = useSkillBarSlotsStore()

/** 技能 Store（用于读取冷却数据） */
const skillsStore = useSkillsStore()

/** 拖拽组合式函数 */
const {
  hoverSlotIndex,
  draggingSlotIndex,
  onBarDragStart,
  onSlotDragOver,
  onSlotDragLeave,
  onSlotDrop,
  onDragEnd,
  removeFromSlot
} = useSkillBarDrag()

/**
 * 反向进阶映射表
 * 用于从当前职业反推进阶路径，key 为子职业，value 为父职业
 * @type {Record<string, string>}
 */
const REVERSE_EVOLUTION_MAP = (() => {
  const map = {}
  Object.entries(JOB_EVOLUTION_PATHS).forEach(([parent, children]) => {
    children.forEach(child => {
      if (!map[child]) {
        map[child] = parent
      }
    })
  })
  return map
})()

/**
* 获取玩家职业进阶历史中的所有职业 key
* 优先使用玩家保存的 jobHistory（解决多父职业反推错误），
* 回退到从当前职业反推到初心者，返回有序数组
* @param {string} currentClass - 当前职业 key
* @param {string[]|null} playerJobHistory - 玩家保存的职业历史路径数组
* @returns {string[]} 职业进阶路径数组（从初心者到当前职业）
*/
function getJobHistoryClassKeys (currentClass, playerJobHistory = null) {
const currentLower = currentClass?.toLowerCase() || 'beginner'

// 优先使用玩家保存的职业历史路径
if (Array.isArray(playerJobHistory) && playerJobHistory.length > 0) {
const hasCurrent = playerJobHistory.some(j => j?.toLowerCase() === currentLower)
if (hasCurrent) {
const path = []
const seen = new Set()
for (const jobKey of playerJobHistory) {
const key = jobKey?.toLowerCase()
if (!key || seen.has(key)) continue
seen.add(key)
if (JOB_TIER_CONFIG[key]) {
path.push(key)
}
}
if (path.length > 0) {
return path
}
}
}

// 回退：从当前职业反推到初心者
const path = []
let current = currentLower
const visited = new Set()
while (current && !visited.has(current)) {
visited.add(current)
path.unshift(current)
current = REVERSE_EVOLUTION_MAP[current]
}
return path
}

/**
 * 构造用于 unlockPlayer 的合并玩家对象
 * 将 skills 数组中的熟练度信息合并到 player.skills 中
 */
const unlockPlayer = computed(() => {
  const player = props.player || {}
  const level = player?.level
  const playerClass = player?.class
  const originalSkills = player.skills && typeof player.skills === 'object' ? player.skills : {}
  const mergedSkills = { ...originalSkills }

  const list = Array.isArray(props.skills) ? props.skills : []
  list.forEach(s => {
    const key = s?.key
    if (!key) {
      return
    }

    const proficiencyLevel = s?.proficiencyLevel ?? s?.level ?? 1
    mergedSkills[key] = {
      ...(mergedSkills[key] || {}),
      proficiencyLevel,
      level: proficiencyLevel
    }
  })

  return {
    ...player,
    level,
    class: playerClass,
    skills: mergedSkills
  }
})

/**
 * 技能 ID → 技能对象的映射表
 * 使用 id 作为唯一标识，因为 key（Q/W/E/R）在不同职业间不唯一
 * 包含玩家职业进阶路径上所有职业的技能，确保进阶前职业的技能也能被解析
 * 当前职业技能使用 props.skills 版本（含熟练度数据），其余使用 SKILL_CONFIG 静态数据
 * 跨职业技能（进阶前职业）从 player.skills[skillId] 合并熟练度数据
 */
const skillMap = computed(() => {
  const map = new Map()

  // 1. 从所有进阶历史职业的静态技能数据中构建基础映射
  const jobHistoryKeys = getJobHistoryClassKeys(props.player?.class, props.player?.jobHistory)
  jobHistoryKeys.forEach(classKey => {
    const classSkills = SKILL_CONFIG[classKey]
    if (classSkills) {
      Object.values(classSkills).forEach(skill => {
        if (skill && skill.id) {
          // 归一化 baseCooldown：SKILL_CONFIG 使用 cd 字段，需统一转换为 baseCooldown
          // 确保 SkillButton 的圆环动画和冷却计算能正常工作
          const rawCd = Number(skill.cd ?? skill.baseCooldown ?? 0)
          const baseCooldown = rawCd > 1000 ? Math.ceil(rawCd / 1000) : rawCd
          // 补充 class 字段: SKILL_CONFIG 中的技能定义不含 class，
          // 此处补充后，底部技能栏跨职业技能也能在 SkillTooltip 中正确查找所属职业数据
          map.set(skill.id, { ...skill, baseCooldown, class: classKey })
        }
      })
    }
  })

  // 2. 用 props.skills（当前职业，含熟练度数据）覆盖同名技能
  const list = Array.isArray(props.skills) ? props.skills : []
  list.forEach(skill => {
    if (skill && skill.id) {
      map.set(skill.id, skill)
    }
  })

  // 3. 合并跨职业技能熟练度数据
  // 进阶前职业技能以 skillId 为键存储在 player.skills 中（如 player.skills['archer_w']）
  // 将其熟练度数据合并到 skillMap 中对应的静态技能对象上
  const playerSkills = props.player?.skills
  if (playerSkills && typeof playerSkills === 'object') {
    const slotKeySet = new Set(['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I'])
    Object.entries(playerSkills).forEach(([key, entry]) => {
      // 跳过 slot key 条目（当前职业技能已在步骤 2 处理）
      if (slotKeySet.has(key) || !entry || typeof entry !== 'object') {
        return
      }
      // key 为 skillId，从 skillMap 中查找对应的静态技能数据
      const staticSkill = map.get(key)
      if (staticSkill) {
        map.set(key, {
          ...staticSkill,
          proficiencyLevel: entry.proficiencyLevel ?? entry.level ?? 1,
          level: entry.proficiencyLevel ?? entry.level ?? 1,
          proficiency: entry.proficiency ?? 0,
          proficiencyExp: entry.proficiencyExp ?? 10,
          proficiencyMaxLevel: entry.proficiencyMaxLevel ?? staticSkill.proficiency?.maxLevel ?? 10,
          // 显式设置 proficiencyEffect：步骤3中 proficiency 被覆盖为经验值数字，
          // 原始 proficiency.effect 配置对象会丢失，此处补充确保 SkillBuffCalculator
          // 能通过 skill.proficiencyEffect || skill.proficiency?.effect 正确查找效果配置
          proficiencyEffect: staticSkill.proficiencyEffect || staticSkill.proficiency?.effect
        })
      }
    })
  }

  return map
})

/**
 * 槽位技能数组：将 slots 中的 id 解析为技能对象
 * 如果 id 对应的技能不存在（如职业变更后），该槽位返回 null
 *
 * 冷却处理：从 skillsStore.skillCooldowns 实时计算剩余秒数，
 * 通过 skillsStore.cooldownTick 触发每秒重新计算。
 * 这样所有槽位技能（含进阶前职业技能）都能正确显示冷却倒计时。
 */
const slotSkills = computed(() => {
  // 访问 cooldownTick 和 cooldownVersion 以建立响应式依赖
  // cooldownTick: 每秒递增，确保倒计时秒数每秒刷新
  // cooldownVersion: 每次 setSkillCooldown 递增，确保技能进入冷却时立即触发重计算
  // eslint-disable-next-line no-unused-expressions
  skillsStore.cooldownTick
  // eslint-disable-next-line no-unused-expressions
  skillsStore.cooldownVersion
  const now = Date.now()
  const cooldowns = skillsStore.skillCooldowns

  const result = new Array(SKILL_BAR_SLOT_COUNT).fill(null)
  for (let i = 0; i < SKILL_BAR_SLOT_COUNT; i++) {
    const skillId = slotsStore.slots[i]
    if (skillId) {
      const skill = skillMap.value.get(skillId)
      if (skill) {
        // 从 skillCooldowns 计算实时冷却剩余秒数
        // skillCooldowns 以 skill.id 或 skill.key 为键存储冷却结束时间戳
        const cooldownEnd = cooldowns[skill.id] ?? cooldowns[skill.key] ?? 0
        let cooldownSeconds = 0
        if (cooldownEnd > 0) {
          const remainingMs = cooldownEnd - now
          cooldownSeconds = remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0
        }
        // 创建包含实时冷却数据的新对象，确保 SkillButton 能正确显示倒计时
        // 对于不在冷却中的技能，保留原始 skill.cooldown（可能由 syncCooldownsToSkills 设置为 0）
        result[i] = cooldownSeconds > 0
          ? { ...skill, cooldown: cooldownSeconds }
          : { ...skill, cooldown: 0 }
      } else {
        // 技能不存在，清理无效槽位
        result[i] = null
      }
    }
  }
  return result
})

// ========== 事件处理 ==========

/**
 * 使用技能
 * 接收 SkillButton emit 的 skillId（全局唯一标识），从 skillMap 中查找完整技能对象后转发给父组件
 * 确保进阶前职业的技能也能传递正确的技能对象，避免 key 冲突导致释放错误技能
 * @param {string} skillId - 技能 ID（全局唯一）
 */
const onUseSkill = skillId => {
  const skill = skillMap.value.get(skillId)
  if (skill) {
    emit('use-skill', skill)
  } else {
    // 回退：如果 skillMap 中找不到，直接传 skillId（兼容旧逻辑）
    emit('use-skill', skillId)
  }
}

/**
 * 显示技能提示
 * @param {MouseEvent} event - 鼠标事件
 * @param {Object} skill - 技能对象
 */
const onShowSkillTooltip = (event, skill) => {
  emit('show-tooltip', event, skill)
}

/**
 * 移动技能提示
 * @param {MouseEvent} event - 鼠标事件
 */
const onMoveSkillTooltip = event => {
  emit('move-tooltip', event)
}

/**
 * 隐藏技能提示
 */
const onHideSkillTooltip = () => {
  emit('hide-tooltip')
}

/**
 * 右键点击槽位 - 移除技能
 * @param {number} index - 槽位索引
 */
const onSlotRightClick = index => {
  if (slotsStore.slots[index]) {
    removeFromSlot(index)
  }
}
</script>

<style scoped>
/**
 * 技能栏样式
 * 固定槽位式布局，支持拖拽放入和交换
 */
.skill-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

/* 空状态提示 */
.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  height: 60px;
}

.empty-hint-text {
  color: var(--theme-muted, #aaa);
  font-size: 12px;
  white-space: nowrap;
  opacity: 0.7;
}

/* 技能槽位 */
.skill-slot {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 2px dashed rgba(139, 115, 85, 0.4);
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

/* 已填充槽位 */
.skill-slot.slot-filled {
  border: 2px solid var(--theme-border, #666);
  border-style: solid;
  background: transparent;
}

/* 拖拽悬停高亮 */
.skill-slot.slot-hover {
  border-color: var(--theme-accent, #ffd700);
  background: rgba(255, 215, 0, 0.1);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
  transform: scale(1.05);
}

/* 正在拖拽的源槽位 */
.skill-slot.slot-dragging {
  opacity: 0.4;
}

/* 空槽位占位 */
.slot-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.slot-index {
  color: rgba(139, 115, 85, 0.5);
  font-size: 18px;
  font-weight: bold;
}

/* 技能包装器 */
.slot-skill-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: grab;
}

.slot-skill-wrapper:active {
  cursor: grabbing;
}

/* 移除按钮 */
.slot-remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(220, 53, 69, 0.9);
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
  padding: 0;
}

.skill-slot:hover .slot-remove-btn {
  opacity: 1;
}

.slot-remove-btn:hover {
  background: rgba(220, 53, 69, 1);
  transform: scale(1.15);
}
</style>
