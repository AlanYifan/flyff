<!--
  @file TamedPetModal.vue
  @generated 2026-02-11
  @description 训养宠物面板：展示当前召唤的 raisedpet，并支持拖拽与最小尺寸拉伸。
-->
<template>
  <Teleport to="body">
  <Transition name="panel-fade" appear>
    <div v-if="isVisible" class="tamed-pet-container" :style="containerStyle">
      <div ref="panelRef" class="tamed-pet-panel" :style="panelStyle" @mousedown="startDrag">
        <div class="tamed-pet-header">
          <div class="tamed-pet-title-wrapper">
            <div class="tamed-pet-title" :class="petNameClass" :style="petNameStyle">{{ petName }}</div>
            <span v-if="isPetAtPeak" class="tamed-pet-peak-badge">巅峰</span>
            <button
              type="button"
              class="peak-help-btn"
              :class="{ 'peak-help-btn--active': isPeakHelpVisible }"
              title="巅峰属性说明"
              @click.stop="togglePeakHelp"
            >?</button>
          </div>
          <div class="tamed-pet-header-right">
            <button class="tamed-pet-close" type="button" @click="handleRecall">×</button>
          </div>
        </div>

      <div class="tamed-pet-body" @mousedown.stop>
        <div class="pet-avatar" :class="{ 'pet-avatar-animating': isAutoBattleActive }">
          <img :src="petIcon" :alt="petName" draggable="false" @dragstart.prevent />
        </div>

        <div class="pet-right">
          <div class="pet-meta">
            <div class="pet-meta-row pet-meta-row-centered">
              <span class="pet-meta-label">等级</span>
              <span class="pet-meta-value pet-meta-value--level">{{ petLevelText }}级</span>
            </div>
            <div class="pet-meta-row pet-meta-row-centered">
              <span class="pet-meta-label">属性</span>
              <span class="pet-meta-value pet-meta-value--ability">{{ abilityText }}</span>
            </div>
            <div class="pet-meta-row">
              <span class="pet-meta-label">能量</span>
              <div class="pet-meta-energy">
                <div
                  class="pet-meta-energy-track"
                  role="progressbar"
                  :aria-valuenow="currentEnergy"
                  :aria-valuemax="maxEnergy"
                >
                  <div class="pet-meta-energy-fill" :style="{ width: `${energyPercent}%` }"></div>
                  <div class="pet-meta-energy-text">{{ energyText }}</div>
                </div>
              </div>
            </div>
            <div class="pet-meta-row pet-meta-row-stage-toggle">
              <button
                type="button"
                class="pet-meta-stage-toggle"
                :aria-pressed="isStageFooterVisible"
                @click.stop="toggleStageFooter"
              >
                {{ isStageFooterVisible ? '▲' : '▼' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Transition name="pet-stage-footer-slide">
        <div v-if="stageTiles.length && isStageFooterVisible" ref="stageFooterRef" class="pet-stage pet-stage--footer" @mousedown.stop>
          <div class="pet-stage-levels" :style="stageGridStyle">
            <div
              v-for="item in stageTiles"
              :key="`lv_${item.key}`"
              class="pet-stage-level"
              :class="item.levelClassName"
              :data-stage="item.key"
              @mouseenter="handleStageLevelMouseEnter($event, item)"
              @mousemove="handleStageLevelMouseMove($event, item)"
              @mouseleave="handleStageLevelMouseLeave"
            >
              <template v-if="item.levelNumber">
                <span class="pet-stage-level-prefix">Lv</span>
                <span class="pet-stage-level-number">{{ stageLevelValueTextByStage.get(String(item.key || '').toUpperCase()) }}</span>
              </template>
            </div>
          </div>
          <Teleport to="body">
            <Transition name="pet-stage-tooltip-fade">
              <div v-if="stageHoverTooltip.visible" class="pet-stage-tooltip" :style="stageHoverTooltipStyle">
                {{ stageHoverTooltip.text }}
              </div>
            </Transition>
          </Teleport>
          <div class="pet-hotkeys" :style="stageGridStyle">
            <div
              v-for="item in stageTiles"
              :key="item.key"
              class="pet-hotkey"
              :class="item.className"
              :data-stage="item.key"
              @mouseenter="handleStageLevelMouseEnter($event, item)"
              @mousemove="handleStageLevelMouseMove($event, item)"
              @mouseleave="handleStageLevelMouseLeave"
            >
              {{ item.label }}
            </div>
          </div>
        </div>
      </Transition>

      <div class="resize-handle resize-n" @mousedown.stop.prevent="startResize($event, 'n')"></div>
      <div class="resize-handle resize-s" @mousedown.stop.prevent="startResize($event, 's')"></div>
      <div class="resize-handle resize-e" @mousedown.stop.prevent="startResize($event, 'e')"></div>
      <div class="resize-handle resize-w" @mousedown.stop.prevent="startResize($event, 'w')"></div>
      <div class="resize-handle resize-ne" @mousedown.stop.prevent="startResize($event, 'ne')"></div>
      <div class="resize-handle resize-nw" @mousedown.stop.prevent="startResize($event, 'nw')"></div>
      <div class="resize-handle resize-se" @mousedown.stop.prevent="startResize($event, 'se')"></div>
      <div class="resize-handle resize-sw" @mousedown.stop.prevent="startResize($event, 'sw')"></div>
    </div>

    <!-- 巅峰属性说明 - 显示在面板右侧外部 -->
    <Transition name="peak-help-slide">
      <div v-if="isPeakHelpVisible" class="peak-help-panel" @mousedown.stop>
        <div class="peak-help-header">
          <span class="peak-help-icon">⚡</span>
          {{ petName }} 属性加成
        </div>
        
        <!-- 进阶等级显示 -->
        <div class="peak-levels-section">
          <div class="peak-section-title">进阶等级</div>
          <div class="peak-levels-row">
            <span 
              v-for="level in [1,2,3,4,5,6,7,8,9]" 
              :key="level" 
              class="peak-level-badge"
              :class="{ 
                'peak-level-achieved': getPetLevelCount(level) > 0
              }"
            >
              {{ level }}
              <span v-if="getPetLevelCount(level) > 1" class="peak-level-count">{{ getPetLevelCount(level) }}</span>
            </span>
          </div>
        </div>

        <!-- 属性信息 - 未达到巅峰时 -->
        <div v-if="!isPetAtPeak" class="peak-stats-section">
          <div class="peak-section-title">属性信息</div>
          <div class="peak-stats-row">
            <span class="peak-stat-name">{{ petPeakConfig?.label || '属性' }}</span>
            <span class="peak-stat-values">
              <span class="peak-value-item">
                <span class="peak-value-label">当前</span>
                <span class="peak-current">{{ currentAbilityDisplay }}</span>
              </span>
              <span class="peak-separator">/</span>
              <span class="peak-value-item">
                <span class="peak-value-label">最大</span>
                <span class="peak-base">{{ petPeakBaseDisplay }}</span>
              </span>
            </span>
          </div>
        </div>

        <!-- 属性信息 - 达到巅峰时 -->
        <div v-else class="peak-stats-section peak-stats-section--peak">
          <div class="peak-section-title">属性信息 <span class="peak-badge">巅峰</span></div>
          <div class="peak-stats-row">
            <span class="peak-stat-name">{{ petPeakConfig?.label || '属性' }}</span>
            <span class="peak-stat-values">
              <span class="peak-value-item">
                <span class="peak-value-label">当前</span>
                <span class="peak-current">{{ currentAbilityDisplay }}</span>
              </span>
              <span class="peak-separator">/</span>
              <span class="peak-value-item">
                <span class="peak-value-label">最大</span>
                <span class="peak-base">{{ petPeakBaseDisplay }}</span>
              </span>
              <span class="peak-separator">/</span>
              <span class="peak-value-item">
                <span class="peak-value-label">巅峰加成</span>
                <span class="peak-add">+{{ petPeakAddDisplay }}</span>
              </span>
              <span class="peak-separator">/</span>
              <span class="peak-value-item">
                <span class="peak-value-label">总加成</span>
                <span class="peak-total">{{ petPeakTotalDisplay }}</span>
              </span>
            </span>
          </div>
        </div>

        <!-- 进阶属性设定 -->
        <div class="peak-level-values-section">
          <div class="peak-section-title">进阶属性设定</div>
          <div class="peak-level-values-grid">
            <div 
              v-for="level in [1,2,3,4,5,6,7,8,9]" 
              :key="level" 
              class="peak-level-value-row"
              :class="{ 
                'peak-level-achieved': getPetLevelCount(level) > 0
              }"
            >
              <span class="peak-level-num">{{ level }}</span>
              <span class="peak-level-colon">:</span>
              <span class="peak-level-val">{{ getPetLevelValue(level) }}</span>
              <span v-if="getPetLevelCount(level) > 1" class="peak-level-value-count">×{{ getPetLevelCount(level) }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRaisedPetSummonStore } from '@/store'
import { useAutoBattleStore } from '@/store'
import { usePetsStore } from '@/store/pets'
import { useItemsStore } from '@/store/items'
import { PET_PEAK_CONFIG, PET_LEVEL_VALUES, getPetDisplayValue } from '@/data/PET_PEAK_CONFIG'
import { getItemName } from '@/utils/itemUtils'

const props = defineProps({
  gameInitializer: {
    type: Object,
    default: null
  }
})

const raisedPetSummonStore = useRaisedPetSummonStore()
const autoBattleStore = useAutoBattleStore()
const petsStore = usePetsStore()
const itemsStore = useItemsStore()

const panelRef = ref(null)
const hasInitializedGeometry = ref(false)

const isVisible = computed(() => Boolean(raisedPetSummonStore.panelVisible && raisedPetSummonStore.summonedPetItem))
const petItem = computed(() => raisedPetSummonStore.summonedPetItem)
const petIcon = computed(() => raisedPetSummonStore.summonedPetIcon)

const petName = computed(() => {
  const item = petItem.value
  const inline = item?.name
  if (typeof inline === 'string' && inline) {
    return inline
  }
  if (inline && typeof inline === 'object') {
    return inline.cns || inline.eng || '训养宠物'
  }
  const id = Number(item?.id)
  if (!Number.isFinite(id) || id <= 0) {
    return '训养宠物'
  }
  return getItemName(id) || `宠物#${id}`
})

const isAutoBattleActive = computed(() => autoBattleStore.isActive)

/**
 * 获取宠物名称品级颜色（Pinia：itemsStore 品级样式）
 * 用途/业务意图：让召唤宠物面板标题区域宠物名称颜色与物品品级一致。
 * @returns {import('vue').ComputedRef<Record<string, string>>} 标题文本 style
 */
const petNameStyle = computed(() => {
  const rarity = petItem.value?.rarity || 'common'
  return itemsStore.getRarityTextStyle(rarity)
})

/**
 * 获取宠物名称品级文本 class（用于 mythic 等特殊样式）
 * 用途/业务意图：兼容 itemsStore 内定义的 textClass（例如渐变文本）。
 * @returns {import('vue').ComputedRef<string>} 标题文本 class
 */
const petNameClass = computed(() => {
  const rarity = petItem.value?.rarity || 'common'
  const baseClass = String(itemsStore.getRarityTextClass(rarity) || '').trim()
  const classList = baseClass ? baseClass.split(/\s+/).filter(Boolean) : []
  const isMythicText = classList.includes('rarity-mythic-text')
  if (isMythicText && isAutoBattleActive.value) {
    classList.push('tamed-pet-title--no-flow')
  }
  return classList.join(' ')
})

const resolveCurrentPetEntry = item => {
  const petData = item?.pet_data
  if (!petData || (typeof petData !== 'object' && !Array.isArray(petData))) {
    return null
  }
  const entries = []
  const pushEntry = (key, value) => {
    const entry = value && typeof value === 'object' ? value : {}
    const petLevel = Number(entry.pet_level ?? key)
    entries.push({
      petLevel: Number.isFinite(petLevel) ? petLevel : 0,
      entry
    })
  }
  if (Array.isArray(petData)) {
    petData.forEach(row => {
      if (!row || typeof row !== 'object') {
        return
      }
      const keys = Object.keys(row)
      if (!keys.length) {
        return
      }
      const looksLikeEntry =
        'pet_level' in row || 'level_type' in row || 'current_energy' in row || 'max_energy' in row
      if (looksLikeEntry) {
        pushEntry(row.pet_level ?? 0, row)
        return
      }
      keys.forEach(key => pushEntry(key, row[key]))
    })
  } else {
    Object.entries(petData).forEach(([key, value]) => pushEntry(key, value))
  }
  const sorted = entries
    .filter(item => Number.isFinite(item.petLevel) && item.petLevel > 0)
    .sort((a, b) => a.petLevel - b.petLevel)
  if (!sorted.length) {
    return null
  }
  return sorted[sorted.length - 1]
}

const petEntry = computed(() => resolveCurrentPetEntry(petItem.value))
const petLevelType = computed(() => {
  const raw = petEntry.value?.entry?.level_type
  if (raw === null || raw === undefined) {
    return ''
  }
  const text = String(raw).trim()
  return text
})

const petLevelText = computed(() => {
  if (petLevelType.value) {
    return petLevelType.value
  }
  return '-'
})

const petConfig = computed(() => {
  const petId = Number(petItem.value?.petItemId ?? petItem.value?.id)
  if (!Number.isFinite(petId) || petId <= 0) {
    return null
  }
  return petsStore.petMap?.[String(petId)] || null
})

const abilityLabelMap = {
  maxhp: '最大生命值',
  attack: '攻击力',
  criticalchance: '暴击率',
  criticaldamage: '暴击伤害',
  def: '防御力',
  int: '智力',
  dex: '敏捷',
  str: '力量',
  sta: '体质'
}

const petEntries = computed(() => {
  const petData = petItem.value?.pet_data
  if (!petData || (typeof petData !== 'object' && !Array.isArray(petData))) {
    return []
  }
  const entries = []
  const pushEntry = (key, value) => {
    const entry = value && typeof value === 'object' ? value : {}
    const petLevel = Number(entry.pet_level ?? key)
    entries.push({
      petLevel: Number.isFinite(petLevel) ? petLevel : 0,
      entry
    })
  }
  if (Array.isArray(petData)) {
    petData.forEach(row => {
      if (!row || typeof row !== 'object') {
        return
      }
      const keys = Object.keys(row)
      if (!keys.length) {
        return
      }
      const looksLikeEntry =
        'pet_level' in row || 'level_type' in row || 'current_energy' in row || 'max_energy' in row
      if (looksLikeEntry) {
        pushEntry(row.pet_level ?? 0, row)
        return
      }
      keys.forEach(key => pushEntry(key, row[key]))
    })
  } else {
    Object.entries(petData).forEach(([key, value]) => pushEntry(key, value))
  }
  return entries
    .filter(item => Number.isFinite(item.petLevel) && item.petLevel > 0)
    .sort((a, b) => a.petLevel - b.petLevel)
})

const stageTiles = computed(() => {
  const order = ['F', 'E', 'D', 'C', 'B', 'A', 'S']
  const levelByStage = new Map()
  let maxIndex = -1

  petEntries.value.forEach(row => {
    const raw = row?.entry?.level_type
    const normalized = raw === null || raw === undefined ? '' : String(raw).trim().toUpperCase()
    const idx = order.indexOf(normalized)
    if (idx < 0) {
      return
    }
    maxIndex = Math.max(maxIndex, idx)
    const level = Number(row?.entry?.pet_level ?? row?.petLevel ?? 0)
    if (!Number.isFinite(level) || level <= 0) {
      return
    }
    const existing = Number(levelByStage.get(normalized) ?? 0)
    if (!existing || level > existing) {
      levelByStage.set(normalized, level)
    }
  })

  const currentStage = String(petLevelType.value || '').trim().toUpperCase()
  const currentIndex = order.indexOf(currentStage)
  if (currentIndex >= 0) {
    maxIndex = Math.max(maxIndex, currentIndex)
  }

  if (maxIndex < 0) {
    return []
  }

  const stages = order.slice(0, maxIndex + 1)
  return stages.map(stage => {
    const level = Number(levelByStage.get(stage) ?? 0)
    const levelNumber = level > 0 ? level : 0
    const isActive = Boolean(currentStage && stage === currentStage)
    return {
      key: stage,
      label: stage,
      levelNumber,
      levelClassName: `pet-stage-level--${stage.toLowerCase()}`,
      className: {
        [`pet-hotkey--${stage.toLowerCase()}`]: true,
        'pet-hotkey--active': isActive
      }
    }
  })
})

const stageGridStyle = computed(() => {
  const columns = stageTiles.value.length
  return columns ? { gridTemplateColumns: `repeat(${columns}, var(--pet-stage-tile-size))` } : {}
})

const stageFooterRef = ref(null)
const stageHoverTooltip = ref({
  visible: false,
  text: '',
  left: 0,
  top: 0
})
const stageHoverHideTimer = ref(0)
const stageHoverOffset = 55
const isStageFooterVisible = ref(false)
const stageFooterSizeBackup = ref(null)
const hasResizedWhileStageFooterVisible = ref(false)
const isPeakHelpVisible = ref(false)

// 巅峰帮助切换
const togglePeakHelp = () => {
  isPeakHelpVisible.value = !isPeakHelpVisible.value
}

// 当前宠物的ID
const currentPetId = computed(() => {
  return Number(petItem.value?.petItemId ?? petItem.value?.id)
})

// 当前宠物的巅峰配置
const petPeakConfig = computed(() => {
  return PET_PEAK_CONFIG[currentPetId.value] || null
})

// 当前宠物的进阶等级值配置
const petLevelValues = computed(() => {
  return PET_LEVEL_VALUES[currentPetId.value] || null
})

// 巅峰需要的等级列表
const petPeakRequiredLevels = computed(() => {
  return petPeakConfig.value?.requiredLevels || [1, 2, 3, 4, 5, 7, 9]
})

// 当前宠物进阶等级出现次数统计（从属性值对象的 key 中提取）
const petLevelCounts = computed(() => {
  const counts = {}
  
  // 获取属性 key (如 criticaldamage, maxhp 等)
  const ability = abilityKey.value
  
  petEntries.value.forEach(row => {
    const entry = row?.entry
    if (!entry) {
      return
    }
    
    // 从属性值对象中提取 key
    const abilityValue = entry[ability]
    if (abilityValue && typeof abilityValue === 'object') {
      Object.keys(abilityValue).forEach(key => {
        const level = Number(key)
        if (Number.isFinite(level) && level > 0 && level <= 9) {
          counts[level] = (counts[level] || 0) + 1
        }
      })
    } else {
      // 如果属性值不是对象，则使用 pet_level
      const level = row?.petLevel
      if (Number.isFinite(level) && level > 0 && level <= 9) {
        counts[level] = (counts[level] || 0) + 1
      }
    }
  })
  
  return counts
})

// 获取某个进阶等级的出现次数
const getPetLevelCount = (level) => {
  return petLevelCounts.value[level] || 0
}

// 当前宠物已有的进阶等级
const petAchievedLevels = computed(() => {
  return Object.keys(petLevelCounts.value).map(Number).sort((a, b) => a - b)
})

// 检查宠物是否有某个进阶等级
const hasPetLevel = (level) => {
  return petAchievedLevels.value.includes(level)
}

// 检查宠物是否达到巅峰状态（1,2,3,4,5,7,9 全部达到）
const isPetAtPeak = computed(() => {
  if (!petPeakConfig.value) {
    return false
  }
  const requiredLevels = petPeakConfig.value.requiredLevels || []
  return requiredLevels.every(level => petAchievedLevels.value.includes(level))
})

// 获取某个进阶等级的属性值
const getPetLevelValue = (level) => {
  if (!petLevelValues.value) {
    return '-'
  }
  return petLevelValues.value[level] ?? '-'
}

// 当前属性值
const currentAbilityValue = computed(() => {
  return raisedPetSummonStore.summonedPetBuffValue || 0
})

// 当前属性值显示
const currentAbilityDisplay = computed(() => {
  if (!petPeakConfig.value) {
    return currentAbilityValue.value
  }
  return petPeakConfig.value.isRate ? `${currentAbilityValue.value}%` : currentAbilityValue.value
})

// 巅峰基础值显示
const petPeakBaseDisplay = computed(() => {
  if (!petPeakConfig.value) {
    return '-'
  }
  return petPeakConfig.value.isRate ? `${petPeakConfig.value.baseValue}%` : petPeakConfig.value.baseValue
})

// 巅峰加成值显示
const petPeakAddDisplay = computed(() => {
  if (!petPeakConfig.value) {
    return '-'
  }
  const add = petPeakConfig.value.peakValue - petPeakConfig.value.baseValue
  return petPeakConfig.value.isRate ? `${add.toFixed(1)}%` : add
})

// 巅峰总值显示（巅峰基础值 + 巅峰加成）
const petPeakTotalDisplay = computed(() => {
  if (!petPeakConfig.value) {
    return '-'
  }
  return petPeakConfig.value.isRate ? `${petPeakConfig.value.peakValue}%` : petPeakConfig.value.peakValue
})

const abilityKey = computed(() => {
  const entry = petEntry.value?.entry || null
  if (!entry || typeof entry !== 'object') {
    return ''
  }
  const excluded = new Set([
    'pet_level',
    'level_type',
    'level_requirement',
    'current_energy',
    'max_energy',
    'pet_exterior',
    'Pet_Exterior'
  ])
  const configKey = typeof petConfig.value?.parameter === 'string' ? petConfig.value.parameter : ''
  const raw = Object.keys(entry).find(key => !excluded.has(key)) || configKey
  return raw ? String(raw).toLowerCase() : ''
})

const resolveNumericAbilityValue = raw => {
  if (raw === null || raw === undefined) {
    return 0
  }
  if (typeof raw === 'object') {
    const values = Object.values(raw)
    return values.reduce((total, value) => {
      const numeric = Number(value ?? 0)
      return total + (Number.isFinite(numeric) ? numeric : 0)
    }, 0)
  }
  const numeric = Number(raw ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

const stageAbilityByStage = computed(() => {
  const ability = abilityKey.value
  const label = ability ? abilityLabelMap[ability] || ability : ''
  const isRate = Boolean(petConfig.value?.rate)
  const map = new Map()

  if (!ability) {
    return map
  }

  const normalizeStage = value => (value === null || value === undefined ? '' : String(value).trim().toUpperCase())
  const rowsByStage = new Map()

  petEntries.value.forEach(row => {
    const stage = normalizeStage(row?.entry?.level_type)
    if (!stage) {
      return
    }
    if (!rowsByStage.has(stage)) {
      rowsByStage.set(stage, [])
    }
    rowsByStage.get(stage).push(row)
  })

  stageTiles.value.forEach(tile => {
    const stage = normalizeStage(tile.key)
    const rows = rowsByStage.get(stage) || []
    if (!rows.length) {
      map.set(stage, { label, value: 0, isRate })
      return
    }
    const levelNumber = Number(tile.levelNumber ?? 0)
    const exact = rows.find(row => Number(row?.entry?.pet_level ?? row?.petLevel ?? 0) === levelNumber)
    const chosen = exact || rows[rows.length - 1]
    const value = resolveNumericAbilityValue(chosen?.entry?.[ability])
    map.set(stage, { label, value, isRate })
  })

  return map
})

/**
 * 解析进阶属性字段的 key
 * 用途/业务意图：底部 Lv 行仅展示对象 key（例如 { "2": 191 } 展示 2），不展示 value。
 * @param {unknown} raw - 进阶属性字段（可能是 number 或 object）
 * @param {number} fallbackLevel - 兜底 key（一般为 pet_level）
 * @returns {string} 展示文本
 */
const resolveAbilityDisplayKey = (raw, fallbackLevel) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    const fallback = Number(fallbackLevel ?? 0)
    return Number.isFinite(fallback) && fallback > 0 ? String(fallback) : '-'
  }

  const candidate = String(Number(fallbackLevel ?? 0))
  if (candidate !== '0' && Object.prototype.hasOwnProperty.call(raw, candidate)) {
    return candidate
  }

  const keys = Object.keys(raw)
  if (!keys.length) {
    const fallback = Number(fallbackLevel ?? 0)
    return Number.isFinite(fallback) && fallback > 0 ? String(fallback) : '-'
  }

  const sorted = [...keys].sort((a, b) => {
    const na = Number(a)
    const nb = Number(b)
    const aNum = Number.isFinite(na)
    const bNum = Number.isFinite(nb)
    if (aNum && bNum) {
      return na - nb
    }
    if (aNum && !bNum) {
      return -1
    }
    if (!aNum && bNum) {
      return 1
    }
    return String(a).localeCompare(String(b))
  })
  return sorted[0]
}

/**
 * 获取底部挡位条 Lv 行展示的 key 文本
 * 用途/业务意图：将 Lv 后面的显示改为“当前召唤宠物在该挡位对应的进阶属性对象 key”。
 * @returns {import('vue').ComputedRef<Map<string, string>>} stage -> 展示文本（例如 2）
 */
const stageLevelValueTextByStage = computed(() => {
  const map = new Map()
  const ability = abilityKey.value
  const normalizeStage = value => (value === null || value === undefined ? '' : String(value).trim().toUpperCase())
  const rowsByStage = new Map()

  if (!ability) {
    stageTiles.value.forEach(tile => {
      const stage = String(tile?.key ?? '').trim().toUpperCase()
      map.set(stage, '-')
    })
    return map
  }

  petEntries.value.forEach(row => {
    const stage = normalizeStage(row?.entry?.level_type)
    if (!stage) {
      return
    }
    if (!rowsByStage.has(stage)) {
      rowsByStage.set(stage, [])
    }
    rowsByStage.get(stage).push(row)
  })

  stageTiles.value.forEach(tile => {
    const stage = normalizeStage(tile?.key)
    const hasLevel = Number(tile?.levelNumber ?? 0) > 0
    if (!stage || !hasLevel) {
      map.set(stage, '')
      return
    }
    const rows = rowsByStage.get(stage) || []
    if (!rows.length) {
      map.set(stage, '-')
      return
    }
    const levelNumber = Number(tile.levelNumber ?? 0)
    const exact = rows.find(row => Number(row?.entry?.pet_level ?? row?.petLevel ?? 0) === levelNumber)
    const chosen = exact || rows[rows.length - 1]
    const raw = chosen?.entry?.[ability]
    map.set(stage, resolveAbilityDisplayKey(raw, levelNumber))
  })
  return map
})

const stageHoverTooltipStyle = computed(() => ({
  left: `${stageHoverTooltip.value.left}px`,
  top: `${stageHoverTooltip.value.top}px`
}))

function handleStageLevelMouseEnter (event, item) {
  updateStageHoverTooltip(event, item)
}

function handleStageLevelMouseMove (event, item) {
  updateStageHoverTooltip(event, item)
}

function updateStageHoverTooltip (event, item) {
  if (stageHoverHideTimer.value) {
    window.clearTimeout(stageHoverHideTimer.value)
    stageHoverHideTimer.value = 0
  }
  const footer = stageFooterRef.value
  const target = event?.currentTarget
  if (!footer || !target) {
    stageHoverTooltip.value = { visible: false, text: '', left: 0, top: 0 }
    return
  }
  if (!Number(item?.levelNumber ?? 0)) {
    stageHoverTooltip.value = { visible: false, text: '', left: 0, top: 0 }
    return
  }

  const stage = String(item?.key ?? '').trim().toUpperCase()
  const ability = stageAbilityByStage.value.get(stage)
  if (!ability) {
    stageHoverTooltip.value = { visible: false, text: '', left: 0, top: 0 }
    return
  }

  const anchor =
    footer.querySelector(`.pet-stage-level[data-stage="${stage}"]`) ||
    footer.querySelector(`.pet-hotkey[data-stage="${stage}"]`) ||
    target
  const rect = anchor.getBoundingClientRect()
  const left = rect.left + rect.width / 2
  const cursorY = Number(event?.clientY ?? 0)
  const baseY = Number.isFinite(cursorY) && cursorY > 0 ? cursorY : rect.bottom
  const top = baseY + stageHoverOffset
  const suffix = ability.isRate ? '%' : ''
  const text = `${ability.label}+${ability.value}${suffix}`

  stageHoverTooltip.value = {
    visible: true,
    text,
    left: Math.round(left),
    top: Math.round(top)
  }
}

function handleStageLevelMouseLeave () {
  if (stageHoverHideTimer.value) {
    window.clearTimeout(stageHoverHideTimer.value)
  }
  stageHoverHideTimer.value = window.setTimeout(() => {
    stageHoverTooltip.value = { visible: false, text: '', left: 0, top: 0 }
    stageHoverHideTimer.value = 0
  }, 80)
}

/**
 * 切换挡位区域可见性
 * 用途/业务意图：展开时记录当前面板尺寸，收起时在未手动拉伸的前提下回收高度。
 * @returns {Promise<void>}
 */
async function toggleStageFooter () {
  const nextVisible = !isStageFooterVisible.value
  if (nextVisible) {
    stageFooterSizeBackup.value = {
      width: Number(raisedPetSummonStore.panelSize.width) || 300,
      height: Number(raisedPetSummonStore.panelSize.height) || 200
    }
    hasResizedWhileStageFooterVisible.value = false
  }

  isStageFooterVisible.value = nextVisible
  stageHoverTooltip.value = { visible: false, text: '', left: 0, top: 0 }
  if (stageHoverHideTimer.value) {
    window.clearTimeout(stageHoverHideTimer.value)
    stageHoverHideTimer.value = 0
  }

  try {
    await nextTick()
    if (!nextVisible && stageFooterSizeBackup.value && !hasResizedWhileStageFooterVisible.value) {
      const width = Math.max(200, Number(stageFooterSizeBackup.value.width) || 200)
      const height = Math.max(100, Number(stageFooterSizeBackup.value.height) || 100)
      const currentLeft = Number(raisedPetSummonStore.panelPosition.x) || 0
      const currentTop = Number(raisedPetSummonStore.panelPosition.y) || 0
      const clamped = clampToViewport(currentLeft, currentTop, width, height)
      raisedPetSummonStore.setPanelGeometry({
        position: { x: clamped.left, y: clamped.top },
        size: { width, height }
      })
    }
    autoExpandPanelToFitContent()
  } catch (error) {
    console.error('[TamedPetModal] 切换挡位区域时回收尺寸失败', error)
  } finally {
    if (!nextVisible) {
      stageFooterSizeBackup.value = null
      hasResizedWhileStageFooterVisible.value = false
    }
  }
}

const abilityText = computed(() => {
  const key = abilityKey.value
  if (!key) {
    return '-'
  }
  const total = petEntries.value.reduce((sum, item) => sum + resolveNumericAbilityValue(item?.entry?.[key]), 0)
  const label = abilityLabelMap[key] || key
  if (!total) {
    return `${label} +0${raisedPetSummonStore.isEnergyActive ? '' : '（未激活）'}`
  }
  const isRate = Boolean(petConfig.value?.rate)

  // 检查是否为巅峰宠物
  const petId = Number(petItem.value?.petItemId ?? petItem.value?.id)
  const peakInfo = getPetDisplayValue(petId, total)

  // 如果是巅峰宠物，显示格式：属性+baseValue(peakValue)
  if (peakInfo.isPeak) {
    const suffix = isRate ? '%' : ''
    return `${label} +${peakInfo.baseValue}${suffix}(${peakInfo.peakValue}${suffix})${raisedPetSummonStore.isEnergyActive ? '' : '（未激活）'}`
  }

  return `${label} +${total}${isRate ? '%' : ''}${raisedPetSummonStore.isEnergyActive ? '' : '（未激活）'}`
})

const currentEnergy = computed(() => {
  return raisedPetSummonStore.currentEnergy
})
const maxEnergy = computed(() => {
  return raisedPetSummonStore.maxEnergy
})
const energyText = computed(() => {
  if (!maxEnergy.value) {
    return '-'
  }
  return `${currentEnergy.value}/${maxEnergy.value}`
})
const energyPercent = computed(() => {
  if (!maxEnergy.value) {
    return 0
  }
  return Math.max(0, Math.min(100, Math.round((currentEnergy.value / maxEnergy.value) * 100)))
})


const panelStyle = computed(() => ({
  width: `${raisedPetSummonStore.panelSize.width}px`,
  height: `${raisedPetSummonStore.panelSize.height}px`
}))

const containerStyle = computed(() => ({
  left: `${raisedPetSummonStore.panelPosition.x}px`,
  top: `${raisedPetSummonStore.panelPosition.y}px`
}))

const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, left: 0, top: 0 })

const isResizing = ref(false)
const resizeStart = ref({ x: 0, y: 0, left: 0, top: 0, width: 0, height: 0, direction: 'se' })
const hasUserResizedPanel = ref(false)

const isAutoFitting = ref(false)
const panelAutoFitObserver = ref(null)

/**
 * 根据面板实际内容尺寸自动适配面板大小（可扩张/可收缩）。
 * 用途/业务意图：面板内容变化时保持“刚好容纳内容”的尺寸；当用户手动拉伸后仅自动扩张避免裁剪。
 * @returns {void}
 */
function autoExpandPanelToFitContent () {
  if (!isVisible.value || isDragging.value || isResizing.value) {
    return
  }
  const panel = panelRef.value
  if (!panel) {
    return
  }

  const padding = 10
  const minWidth = 200
  const minHeight = 100
  const viewportWidth = window.innerWidth || 0
  const viewportHeight = window.innerHeight || 0
  const maxWidth = Math.max(minWidth, viewportWidth - padding * 2)
  const maxHeight = Math.max(minHeight, viewportHeight - padding * 2)

  const desiredWidth = Math.ceil(panel.scrollWidth || 0)
  const desiredHeight = Math.ceil(panel.scrollHeight || 0)
  const currentWidth = Number(raisedPetSummonStore.panelSize.width) || minWidth
  const currentHeight = Number(raisedPetSummonStore.panelSize.height) || minHeight

  const safeDesiredWidth = desiredWidth > 0 ? desiredWidth : currentWidth
  const safeDesiredHeight = desiredHeight > 0 ? desiredHeight : currentHeight

  const baseWidth = hasUserResizedPanel.value ? Math.max(currentWidth, safeDesiredWidth) : safeDesiredWidth
  const baseHeight = hasUserResizedPanel.value ? Math.max(currentHeight, safeDesiredHeight) : safeDesiredHeight

  const nextWidth = Math.min(maxWidth, Math.max(minWidth, Math.round(baseWidth)))
  const nextHeight = Math.min(maxHeight, Math.max(minHeight, Math.round(baseHeight)))

  const currentLeft = Number(raisedPetSummonStore.panelPosition.x) || 0
  const currentTop = Number(raisedPetSummonStore.panelPosition.y) || 0
  const clamped = clampToViewport(currentLeft, currentTop, nextWidth, nextHeight)

  if (
    nextWidth === currentWidth &&
    nextHeight === currentHeight &&
    clamped.left === currentLeft &&
    clamped.top === currentTop
  ) {
    return
  }

  isAutoFitting.value = true
  raisedPetSummonStore.setPanelGeometry({
    position: { x: clamped.left, y: clamped.top },
    size: { width: nextWidth, height: nextHeight }
  })
  window.setTimeout(() => {
    isAutoFitting.value = false
  }, 0)
}

/**
 * 监听面板尺寸变化，并在内容发生变化时触发自动扩张逻辑。
 * @returns {void}
 */
function ensurePanelAutoFitObserver () {
  if (panelAutoFitObserver.value || !panelRef.value) {
    return
  }
  if (typeof ResizeObserver === 'undefined') {
    return
  }
  try {
    const observer = new ResizeObserver(() => {
      if (isAutoFitting.value) {
        return
      }
      autoExpandPanelToFitContent()
    })
    observer.observe(panelRef.value)
    panelAutoFitObserver.value = observer
  } catch (error) {
    console.error('[TamedPetModal] 创建面板自适应观察器失败', error)
  }
}

const clampToViewport = (left, top, width, height) => {
  const padding = 10
  const viewportWidth = window.innerWidth || 0
  const viewportHeight = window.innerHeight || 0
  const maxLeft = Math.max(padding, viewportWidth - width - padding)
  const maxTop = Math.max(padding, viewportHeight - height - padding)
  return {
    left: Math.max(padding, Math.min(left, maxLeft)),
    top: Math.max(padding, Math.min(top, maxTop))
  }
}

const ensureDefaultGeometry = async () => {
  try {
    if (hasInitializedGeometry.value) {
      return
    }
    await nextTick()
    const width = Math.max(200, Number(raisedPetSummonStore.panelSize.width) || 300)
    const height = Math.max(100, Number(raisedPetSummonStore.panelSize.height) || 200)
    const left = Math.round((window.innerWidth - width) / 2)
    const top = Math.round((window.innerHeight - height) / 2)
    const clamped = clampToViewport(left, top, width, height)
    raisedPetSummonStore.setPanelGeometry({
      position: { x: clamped.left, y: clamped.top },
      size: { width, height }
    })
    hasInitializedGeometry.value = true
  } catch (error) {
    console.error('[TamedPetModal] 初始化面板默认位置/尺寸失败', error)
  }
}

watch(
  () => isVisible.value,
  async next => {
    if (next) {
      hasUserResizedPanel.value = false
      try {
        await ensureDefaultGeometry()
        await nextTick()
        ensurePanelAutoFitObserver()
        autoExpandPanelToFitContent()
      } catch (error) {
        console.error('[TamedPetModal] 打开面板时自适应处理失败', error)
      }
      return
    }
    if (panelAutoFitObserver.value) {
      panelAutoFitObserver.value.disconnect()
      panelAutoFitObserver.value = null
    }
  },
  { immediate: true }
)

watch(
  () => [isStageFooterVisible.value, stageTiles.value.length],
  async () => {
    if (!isVisible.value) {
      return
    }
    try {
      await nextTick()
      autoExpandPanelToFitContent()
    } catch (error) {
      console.error('[TamedPetModal] 挡位区域切换时自适应处理失败', error)
    }
  }
)

watch(
  () => [petName.value, petLevelText.value, abilityText.value, energyText.value],
  async () => {
    if (!isVisible.value) {
      return
    }
    try {
      await nextTick()
      autoExpandPanelToFitContent()
    } catch (error) {
      console.error('[TamedPetModal] 关键信息变更时自适应处理失败', error)
    }
  }
)

function startDrag (event) {
  if (isResizing.value) {
    return
  }
  if (!event || event.button !== 0) {
    return
  }
  if (event.target.closest('.resize-handle')) {
    return
  }
  if (event.target.closest('button, input, select, textarea')) {
    return
  }

  isDragging.value = true
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    left: raisedPetSummonStore.panelPosition.x,
    top: raisedPetSummonStore.panelPosition.y
  }
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', stopDrag)
  event.preventDefault()
}

function handleDragMove (event) {
  if (!isDragging.value) {
    return
  }
  const dx = event.clientX - dragStart.value.x
  const dy = event.clientY - dragStart.value.y
  const width = Number(raisedPetSummonStore.panelSize.width) || 300
  const height = Number(raisedPetSummonStore.panelSize.height) || 200
  const nextLeft = Math.round(dragStart.value.left + dx)
  const nextTop = Math.round(dragStart.value.top + dy)
  const clamped = clampToViewport(nextLeft, nextTop, width, height)
  raisedPetSummonStore.setPanelGeometry({ position: { x: clamped.left, y: clamped.top } })
}

function stopDrag () {
  if (!isDragging.value) {
    return
  }
  isDragging.value = false
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', stopDrag)
}

function startResize (event, direction = 'se') {
  if (!panelRef.value) {
    return
  }
  if (!event || event.button !== 0) {
    return
  }
  hasUserResizedPanel.value = true
  if (isStageFooterVisible.value && stageFooterSizeBackup.value) {
    hasResizedWhileStageFooterVisible.value = true
  }
  isResizing.value = true
  const rect = panelRef.value.getBoundingClientRect()
  resizeStart.value = {
    x: event.clientX,
    y: event.clientY,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    direction
  }
  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', stopResize)
  event.preventDefault()
}

function handleResizeMove (event) {
  if (!isResizing.value) {
    return
  }
  const minWidth = 200
  const minHeight = 100
  const padding = 10
  const viewportWidth = window.innerWidth || 0
  const viewportHeight = window.innerHeight || 0
  const maxWidth = Math.max(minWidth, viewportWidth - padding * 2)
  const maxHeight = Math.max(minHeight, viewportHeight - padding * 2)

  const dx = event.clientX - resizeStart.value.x
  const dy = event.clientY - resizeStart.value.y

  const dir = String(resizeStart.value.direction || 'se')
  const hasW = dir.includes('w')
  const hasE = dir.includes('e')
  const hasN = dir.includes('n')
  const hasS = dir.includes('s')
  const startRight = resizeStart.value.left + resizeStart.value.width
  const startBottom = resizeStart.value.top + resizeStart.value.height

  let nextWidth = resizeStart.value.width
  let nextHeight = resizeStart.value.height
  let nextLeft = resizeStart.value.left
  let nextTop = resizeStart.value.top

  if (hasE) {
    nextWidth = resizeStart.value.width + dx
  }
  if (hasS) {
    nextHeight = resizeStart.value.height + dy
  }
  if (hasW) {
    nextWidth = resizeStart.value.width - dx
  }
  if (hasN) {
    nextHeight = resizeStart.value.height - dy
  }

  nextWidth = Math.min(maxWidth, Math.max(minWidth, Math.round(nextWidth)))
  nextHeight = Math.min(maxHeight, Math.max(minHeight, Math.round(nextHeight)))

  if (hasW) {
    nextLeft = startRight - nextWidth
  }
  if (hasN) {
    nextTop = startBottom - nextHeight
  }

  const clamped = clampToViewport(nextLeft, nextTop, nextWidth, nextHeight)
  raisedPetSummonStore.setPanelGeometry({
    position: { x: clamped.left, y: clamped.top },
    size: { width: nextWidth, height: nextHeight }
  })
}

function stopResize () {
  if (!isResizing.value) {
    return
  }
  isResizing.value = false
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', stopResize)
}

function handleRecall () {
  itemsStore.updateRaisedPetEnergyByKey(
    raisedPetSummonStore.summonedPetKey,
    raisedPetSummonStore.summonedPetEnergy,
    raisedPetSummonStore.summonedPetMaxEnergy
  )
  raisedPetSummonStore.recall()
  if (props.gameInitializer && props.gameInitializer.services?.audio) {
    const audioService = props.gameInitializer.services.audio
    if (typeof audioService.playSFX === 'function') {
      audioService.playSFX('ItemChrRelease.wav')
    }
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', stopResize)
  if (panelAutoFitObserver.value) {
    panelAutoFitObserver.value.disconnect()
    panelAutoFitObserver.value = null
  }
  if (stageHoverHideTimer.value) {
    window.clearTimeout(stageHoverHideTimer.value)
    stageHoverHideTimer.value = 0
  }
})
</script>

<style scoped>
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.panel-fade-enter-to,
.panel-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.tamed-pet-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at 20% 10%, rgba(40, 25, 12, 0.95), rgba(8, 6, 4, 0.96));
  border-radius: 8px;
  border: 2px solid rgba(204, 170, 78, 0.95);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.52);
  overflow: hidden;
  user-select: none;
}

.tamed-pet-panel::before {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.tamed-pet-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 0 0 auto;
  height: 26px;
  padding: 0 6px 0 8px;
  border-bottom: 1px solid rgba(204, 170, 78, 0.55);
  position: relative;
  z-index: 1;
}

.tamed-pet-title {
  font-weight: 900;
  font-size: 18px;
  color: #ffe9a6;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tamed-pet-title.tamed-pet-title--no-flow {
  animation: none;
  background-position: 0% 50%;
}

.tamed-pet-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tamed-pet-close {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid rgba(204, 170, 78, 0.85);
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.6));
  color: rgba(255, 233, 166, 0.92);
  cursor: pointer;
  line-height: 1;
  font-weight: 900;
}

.tamed-pet-close:hover {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.72));
}

.tamed-pet-body {
  display: flex;
  gap: 8px;
  padding: 8px;
  flex: 1 1 auto;
  min-height: 0;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.pet-avatar {
  width: 74px;
  height: 74px;
  border-radius: 8px;
  border: 2px solid rgba(204, 170, 78, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex: 0 0 auto;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 8px 16px rgba(0, 0, 0, 0.45);
}

.pet-avatar img {
  width: 64px;
  height: 64px;
  object-fit: contain;
  image-rendering: pixelated;
}

.pet-avatar-animating img {
  animation: pet-avatar-pulse 1.2s ease-in-out infinite;
  transform-origin: center;
}

@keyframes pet-avatar-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}

.pet-right {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
}

.pet-meta {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3px;
  margin-bottom: 6px;
  padding: 6px 6px;
  border-radius: 8px;
  border: 1px solid rgba(204, 170, 78, 0.35);
  background: rgba(0, 0, 0, 0.35);
}

.pet-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.88);
}

.pet-meta-row-stage-toggle {
  justify-content: flex-end;
  margin-top: -2px;
}

.pet-meta-stage-toggle {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(204, 170, 78, 0.65);
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 233, 166, 0.9);
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.pet-meta-stage-toggle:hover {
  background: rgba(0, 0, 0, 0.38);
  border-color: rgba(204, 170, 78, 0.85);
}

.pet-meta-stage-toggle[aria-pressed='false'] {
  opacity: 0.7;
}

.pet-meta-row-centered {
  justify-content: flex-start;
}

.pet-meta-row-centered .pet-meta-value {
  flex: 1 1 auto;
  min-width: 0;
  text-align: center;
}

.pet-meta-energy {
  flex: 1 1 auto;
  min-width: 0;
}

.pet-meta-energy-track {
  position: relative;
  height: 12px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.72);
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.pet-meta-energy-fill {
  height: 100%;
  border-radius: 7px;
  background: linear-gradient(90deg, #43baff 0%, #005ab4 100%);
  transition: width 0.12s ease;
}

.pet-meta-energy-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.95);
  pointer-events: none;
}

.pet-meta-label {
  color: rgba(255, 255, 255, 0.75);
  font-weight: 700;
}

.pet-meta-value {
  color: #ffffff;
  font-weight: 800;
}

.pet-meta-value--level {
  color: rgba(76, 220, 126, 0.95);
}

.pet-meta-value--ability {
  color: rgba(255, 98, 98, 0.95);
}

.pet-bars {
  display: grid;
  grid-template-columns: 1fr;
  gap: 5px;
  margin-top: auto;
}

.pet-bar {
  display: grid;
  grid-template-columns: 36px 1fr;
  align-items: center;
  gap: 6px;
}

.pet-bar-label {
  font-size: 11px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.82);
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.9);
}

.pet-bar-track {
  position: relative;
  height: 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.72);
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.pet-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.12s ease;
}

.pet-bar-fill.mp {
  background: linear-gradient(90deg, #43baff 0%, #005ab4 100%);
}

.pet-bar-fill.exp {
  background: linear-gradient(90deg, #71e07c 0%, #1c7a27 100%);
}

.pet-stage {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 0;
}

.pet-stage--footer {
  --pet-stage-tile-size: 35px;
  display: flex;
  flex-direction: column;
  gap: 0;
  align-items: center;
  padding: 0 8px 8px;
  margin: 0;
  position: relative;
  z-index: 1;
}

.pet-stage-levels {
  display: grid;
  gap: 3px;
  margin-bottom: 0;
  position: absolute;
}

.pet-stage-level {
  width: var(--pet-stage-tile-size);
  height: var(--pet-stage-tile-size);
  display: flex;
  align-items: end;
  justify-content: center;
  font-size: 25px;
  color: rgba(255, 255, 255, 0.85);
  border-radius: 3px;
  gap: 2px;
  font-family: revert-layer;
}

.pet-stage-level-prefix {
  font-size: 0.5em;
  line-height: 1;
}

.pet-stage-level-number {
  font-size: 1em;
  line-height: 1;
}

.pet-stage-level--f {
  background: rgba(255, 122, 0, 0.5);
}

.pet-stage-level--e {
  background: rgba(255, 205, 0, 0.5);
}

.pet-stage-level--d {
  background: rgba(97, 221, 92, 0.5);
}

.pet-stage-level--c {
  background: rgba(65, 200, 255, 0.5);
}

.pet-stage-level--b {
  background: rgba(90, 120, 255, 0.5);
}

.pet-stage-level--a {
  background: rgba(195, 95, 255, 0.5);
}

.pet-stage-level--s {
  background: rgba(255, 85, 170, 0.5);
}

.pet-stage-tooltip {
  position: fixed;
  transform: translateX(-50%);
  padding: 6px 10px;
  border-radius: 7px;
  border: 1px solid rgba(204, 170, 78, 0.85);
  background: rgba(0, 0, 0, 0.9);
  color: rgba(255, 255, 255, 0.95);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 10px 16px rgba(0, 0, 0, 0.55);
  z-index: 1001;
}

.pet-stage-tooltip-fade-enter-active,
.pet-stage-tooltip-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.pet-stage-tooltip-fade-enter-from,
.pet-stage-tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-6px);
}

.pet-stage-tooltip-fade-enter-to,
.pet-stage-tooltip-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.pet-stage-footer-slide-enter-active,
.pet-stage-footer-slide-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.pet-stage-footer-slide-enter-from,
.pet-stage-footer-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.pet-stage-footer-slide-enter-to,
.pet-stage-footer-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.pet-hotkeys {
  display: grid;
  gap: 3px;
  margin-top: 0;
}

.pet-hotkey {
  width: var(--pet-stage-tile-size);
  height: var(--pet-stage-tile-size);
  border-radius: 3px;
  border: 1px solid rgba(68, 48, 14, 0.95);
  background: linear-gradient(180deg, #f2d182 0%, #c18b25 100%);
  color: rgba(36, 22, 6, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  /* font-weight: 900;   */
  font-size: 35px;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.25);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(0, 0, 0, 0.22);
}

.pet-hotkey--active {
  border-color: rgba(255, 230, 140, 0.95);
  box-shadow: 0 0 0 1px rgba(255, 230, 140, 0.35), 0 0 10px rgba(255, 214, 92, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.32), inset 0 -1px 0 rgba(0, 0, 0, 0.18);
}

.pet-hotkey--1,
.pet-hotkey--2,
.pet-hotkey--3,
.pet-hotkey--f,
.pet-hotkey--e,
.pet-hotkey--d,
.pet-hotkey--c,
.pet-hotkey--b,
.pet-hotkey--a,
.pet-hotkey--s {
  background: linear-gradient(180deg, #f2d182 0%, #c18b25 100%);
}

.resize-handle {
  position: absolute;
  z-index: 2;
  opacity: 0.01;
}

.resize-n,
.resize-s {
  left: 10px;
  right: 10px;
  height: 10px;
}

.resize-n {
  top: 0;
  cursor: ns-resize;
}

.resize-s {
  bottom: 0;
  cursor: ns-resize;
}

.resize-e,
.resize-w {
  top: 10px;
  bottom: 10px;
  width: 10px;
}

.resize-e {
  right: 0;
  cursor: ew-resize;
}

.resize-w {
  left: 0;
  cursor: ew-resize;
}

.resize-ne,
.resize-nw,
.resize-se,
.resize-sw {
  width: 14px;
  height: 14px;
}

.resize-ne {
  right: 0;
  top: 0;
  cursor: nesw-resize;
}

.resize-nw {
  left: 0;
  top: 0;
  cursor: nwse-resize;
}

.resize-se {
  right: 0;
  bottom: 0;
  cursor: nwse-resize;
}

.resize-sw {
  left: 0;
  bottom: 0;
  cursor: nesw-resize;
}

/* 巅峰帮助按钮和面板样式 */
.tamed-pet-title-wrapper {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
}

.peak-help-btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid rgba(204, 170, 78, 0.85);
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.6));
  color: rgba(255, 233, 166, 0.92);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.peak-help-btn:hover {
  background: linear-gradient(180deg, rgba(204, 170, 78, 0.3), rgba(204, 170, 78, 0.5));
  border-color: rgba(255, 230, 140, 0.95);
  box-shadow: 0 0 8px rgba(255, 214, 92, 0.4);
}

.peak-help-btn--active {
  background: linear-gradient(180deg, rgba(204, 170, 78, 0.5), rgba(204, 170, 78, 0.7));
  border-color: rgba(255, 230, 140, 0.95);
  box-shadow: 0 0 8px rgba(255, 214, 92, 0.5);
}

/* 巅峰徽章 - 显示在标题名称右侧 */
.tamed-pet-peak-badge {
  display: inline-block;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 700;
  color: #1a1a1a;
  background: linear-gradient(180deg, #ffd700, #ffaa00);
  border-radius: 3px;
  text-shadow: none;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
  animation: peak-badge-glow 2s ease-in-out infinite;
}

@keyframes peak-badge-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.8);
  }
}

/* 巅峰帮助面板 - 显示在主面板右侧外部 */
.tamed-pet-container {
  position: fixed;
  z-index: 1000;
  display: flex;
  align-items: flex-start;
}

.peak-help-panel {
  position: relative;
  margin-left: 4px;
  min-width: 260px;
  max-width: 300px;
  padding: 12px 14px;
  background: radial-gradient(circle at 20% 10%, rgba(40, 25, 12, 0.98), rgba(8, 6, 4, 0.99));
  border-radius: 8px;
  border: 2px solid rgba(204, 170, 78, 0.95);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.52);
  overflow: hidden;
}

.peak-help-panel::before {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.peak-help-slide-enter-active,
.peak-help-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.peak-help-slide-enter-from,
.peak-help-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px) scaleY(0.8);
  transform-origin: top left;
}

.peak-help-slide-enter-to,
.peak-help-slide-leave-from {
  opacity: 1;
  transform: translateX(0) scaleY(1);
  transform-origin: top left;
}

.peak-help-header {
  font-size: 14px;
  font-weight: 700;
  color: #ffe9a6;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(204, 170, 78, 0.4);
}

.peak-help-icon {
  color: #ffd700;
}

.peak-section-title {
  font-size: 11px;
  color: rgba(255, 233, 166, 0.7);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 进阶等级显示 */
.peak-levels-section {
  margin-bottom: 12px;
}

.peak-levels-row {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.peak-level-badge {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(204, 170, 78, 0.3);
  color: rgba(255, 233, 166, 0.5);
}

.peak-level-badge.peak-level-achieved {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.6);
  color: #81c784;
  position: relative;
}

.peak-level-count {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  font-size: 10px;
  font-weight: 700;
  line-height: 14px;
  text-align: center;
  color: #fff;
 
  border-radius: 7px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* 属性信息 */
.peak-stats-section {
  margin-bottom: 12px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 1px solid rgba(204, 170, 78, 0.3);
}

.peak-stats-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.peak-stat-name {
  font-size: 12px;
  color: rgb(238 92 91);
}

.peak-stat-values {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  font-weight: 600;
}

.peak-value-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.peak-value-label {
  font-size: 10px;
  font-weight: 400;
  color: rgba(255, 233, 166, 0.5);
}

.peak-current {
  color: #ffe9a6;
}

.peak-separator {
  color: rgba(255, 233, 166, 0.4);
  margin: 0 2px;
  align-self: flex-end;
  margin-bottom: 2px;
}

.peak-base {
  color: rgba(255, 233, 166, 0.7);
}

.peak-add {
  color: #7fff7f;
  text-shadow: 0 0 6px rgba(100, 255, 100, 0.3);
}

.peak-total {
  color: #ffd700;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.4);
  font-weight: 700;
}

/* 巅峰状态样式 */
.peak-stats-section--peak {
  border-color: rgba(255, 215, 0, 0.5);
  background: linear-gradient(180deg, rgba(255, 215, 0, 0.1), rgba(0, 0, 0, 0.3));
}

.peak-badge {
  display: inline-block;
  padding: 1px 6px;
  margin-left: 6px;
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  background: linear-gradient(180deg, #ffd700, #ffaa00);
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

.peak-stats-section--peak .peak-current {
  color: #ffd700;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.4);
}

.peak-stats-section--peak .peak-base {
  color: #ffe9a6;
}

/* 进阶属性设定 */
.peak-level-values-section {
  margin-bottom: 4px;
}

.peak-level-values-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.peak-level-value-row {
  display: flex;
  align-items: center;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  font-size: 11px;
  border: 1px solid transparent;
}

.peak-level-value-row.peak-level-achieved {
  background: rgba(76, 175, 80, 0.15);
  border-color: rgba(76, 175, 80, 0.4);
}

.peak-level-num {
  color: rgba(255, 233, 166, 0.7);
  min-width: 12px;
}

.peak-level-colon {
  color: rgba(255, 233, 166, 0.4);
  margin: 0 4px;
}

.peak-level-val {
  color: #ffe9a6;
  font-weight: 600;
}

.peak-level-value-row.peak-level-achieved .peak-level-val {
  color: #81c784;
}

.peak-level-value-count {
  margin-left: auto;
  padding: 1px 4px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: #4caf50;
  border-radius: 3px;
}
</style>
