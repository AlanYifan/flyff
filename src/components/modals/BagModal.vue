<template>
  <div
ref="bagPanelRef" v-drag="{ handle: '.panel-header' }" class="bag-panel" :style="{
    width: `${panelSize.width}px`,
    height: `${panelSize.height}px`,
    '--ui-scale': uiScale
  }">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="panel-title-area">
        <h2 class="panel-title">背包</h2>
        <button class="stats-toggle-btn" type="button" @click="toggleEquipmentStats">
          {{ equipmentStatsButtonText }}
        </button>
      </div>
      <button class="btn-close" @click="closeModal">×</button>
    </div>

    <!-- 面板内容 -->
    <div class="panel-content">
      <div class="inventory-left">
        <div class="equipment-section">
          <div class="equipment-top-row">
            <div
              v-for="slot in topAccessorySlots" :key="slot.key" class="equipment-slot-wrapper"
              @mouseenter="showItemTooltip($event, equipment[slot.key])" @mouseleave="hideItemTooltip"
              @mousemove="updateTooltipPosition($event)" @click="handleEquipmentSlotClick(slot.key)">
              <div class="equipment-slot">
                <EnhanceTierEffect
                  v-if="showBagEquipmentEffect" :enhance-level="getEnhanceLevel(equipment[slot.key])"
                  :rarity="equipment[slot.key]?.rarity" />
                <img
                  :src="getEquipmentIcon(equipment[slot.key])" :alt="slot.label" class="equipment-icon"
                  draggable="false" @dragstart.prevent @error="handleImageError" />
                <div v-if="shouldShowEnhanceBadge(slot.key, equipment[slot.key])" class="equipment-slot-badge">
                  +{{ getEnhanceLevel(equipment[slot.key]) }}
                </div>
              </div>
            </div>
          </div>

          <div class="equipment-middle-row">
            <div class="equipment-side-column">
              <div
v-for="slot in leftEquipmentSlots" :key="slot.key" class="equipment-slot-wrapper"
                @mouseenter="showItemTooltip($event, equipment[slot.key])" @mouseleave="hideItemTooltip"
                @mousemove="updateTooltipPosition($event)" @click="handleEquipmentSlotClick(slot.key)">
                <div class="equipment-slot">
                  <EnhanceTierEffect
v-if="showBagEquipmentEffect" :enhance-level="getEnhanceLevel(equipment[slot.key])"
                    :rarity="equipment[slot.key]?.rarity" />
                  <img
:src="getEquipmentIcon(equipment[slot.key])" :alt="slot.label" class="equipment-icon"
                    draggable="false" @dragstart.prevent @error="handleImageError" />
                  <div v-if="shouldShowEnhanceBadge(slot.key, equipment[slot.key])" class="equipment-slot-badge">
                    +{{ getEnhanceLevel(equipment[slot.key]) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="equipment-player-center">
              <img
                :src="playerAvatar"
                alt="玩家头像"
                class="equipment-player-avatar"
                draggable="false"
                @mouseenter="showPlayerAvatarPreview"
                @mouseleave="hidePlayerAvatarPreview"
              />
            </div>

            <!-- 玩家头像大图预览 -->
            <Teleport to="body">
              <Transition name="avatar-preview-fade">
                <div
                  v-if="showAvatarPreview"
                  class="player-avatar-preview-overlay"
                  @mouseenter="cancelHideAvatarPreview"
                  @mouseleave="hidePlayerAvatarPreview"
                  @click="hidePlayerAvatarPreview"
                >
                  <img :src="playerAvatar" alt="玩家头像" class="player-avatar-preview-image" draggable="false" @dragstart.prevent />
                </div>
              </Transition>
            </Teleport>

            <div class="equipment-side-column">
              <div
v-for="slot in rightEquipmentSlots" :key="slot.key" class="equipment-slot-wrapper"
                @mouseenter="showItemTooltip($event, equipment[slot.key])" @mouseleave="hideItemTooltip"
                @mousemove="updateTooltipPosition($event)" @click="handleEquipmentSlotClick(slot.key)">
                <div class="equipment-slot">
                  <EnhanceTierEffect
v-if="showBagEquipmentEffect" :enhance-level="getEnhanceLevel(equipment[slot.key])"
                    :rarity="equipment[slot.key]?.rarity" />
                  <img
:src="getEquipmentIcon(equipment[slot.key])" :alt="slot.label" class="equipment-icon"
                    draggable="false" @dragstart.prevent @error="handleImageError" />
                  <div v-if="shouldShowEnhanceBadge(slot.key, equipment[slot.key])" class="equipment-slot-badge">
                    +{{ getEnhanceLevel(equipment[slot.key]) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="equipment-bottom-row">
            <div
v-for="slot in fashionSlots" :key="slot.key" class="equipment-slot-wrapper"
              @mouseenter="showItemTooltip($event, equipment[slot.key])" @mouseleave="hideItemTooltip"
              @mousemove="updateTooltipPosition($event)" @click="handleEquipmentSlotClick(slot.key)">
              <div class="equipment-slot">
                <EnhanceTierEffect
v-if="showBagEquipmentEffect" :enhance-level="getEnhanceLevel(equipment[slot.key])"
                  :rarity="equipment[slot.key]?.rarity" />
                <img
:src="getEquipmentIcon(equipment[slot.key])" :alt="slot.label" class="equipment-icon"
                  draggable="false" @dragstart.prevent @error="handleImageError" />
              </div>
            </div>
          </div>
        </div>

        <div class="bag-section">
          <Bag
ref="bagComponent" :player="player" :game-data="gameData" :game-initializer="gameInitializer"
            :remove-item-from-bag="removeItemFromBag" :show-damage-number="showDamageNumber"
            :add-battle-log="addBattleLog" :show-animation-message="showAnimationMessage"
            :show-bag-equipment-effect="showBagEquipmentEffect" :open-rename-panel="openRenamePanel"
            @player-data-updated="onPlayerDataUpdated" />
        </div>
      </div>
    </div>

    <!-- 面板底部 -->
    <div class="panel-footer">
      <div class="footer-gold">
        <img src="/pt/UI/gold.png" alt="Penya" class="gold-icon" />
        <GoldValue class="footer-gold-value" :value="playerGold" />
        <button class="bag-organize-btn" type="button" @click="organizeBag">整理背包</button>
      </div>
<!-- 测试物品功能（开发环境或GM权限可见） -->
<div v-if="canTest" class="footer-test-item">
<input
v-model="testItemIdInput" class="test-item-id-input" type="text" inputmode="numeric" autocomplete="off"
placeholder="输入物品ID" />
<input
v-model="testItemQuantityInput" class="test-item-quantity-input" type="text" inputmode="numeric" autocomplete="off"
maxlength="4" placeholder="数量" />
<button class="test-item-btn" type="button" :disabled="!testItemIdInput" @click="addTestItemToBag">
测试物品
</button>
</div>
    </div>

    <div class="resize-handle resize-handle-top" @mousedown="startResize($event, 'top')" />
    <div class="resize-handle resize-handle-right" @mousedown="startResize($event, 'right')" />
    <div class="resize-handle resize-handle-bottom" @mousedown="startResize($event, 'bottom')" />
    <div class="resize-handle resize-handle-left" @mousedown="startResize($event, 'left')" />
    <div
class="resize-handle resize-handle-corner resize-handle-top-left"
      @mousedown="startResize($event, 'top-left')" />
    <div
class="resize-handle resize-handle-corner resize-handle-top-right"
      @mousedown="startResize($event, 'top-right')" />
    <div
class="resize-handle resize-handle-corner resize-handle-bottom-left"
      @mousedown="startResize($event, 'bottom-left')" />
    <div
class="resize-handle resize-handle-corner resize-handle-bottom-right"
      @mousedown="startResize($event, 'bottom-right')" />

    <teleport to="body">
      <transition name="equipment-stats">
        <div v-if="showEquipmentStats" ref="equipmentStatsRef" class="inventory-right" :style="equipmentStatsStyle">
          <div class="equipment-stats-overview">
            <div class="stats-title">属性加成</div>
            <div class="stats-grid">
              <div v-if="weaponSectionVisible" class="stats-section">
                <div class="stats-section-title">武器属性</div>
                <div class="stats-section-body">
                  <div v-if="weaponAttackRange" class="stat-line">⚔️ 攻击力 {{ weaponAttackRange }}</div>
                  <div v-if="weaponAttackSpeed" class="stat-line">⚡ 攻击速度 +{{ weaponAttackSpeed }}</div>
                  <div v-if="weaponEnhanceAttackBonus && !weaponAttackRangeUsesEnhance" class="stat-line">
                    ✨ 强化攻击 +{{ weaponEnhanceAttackBonus }}
                  </div>
                  <div v-if="weaponCardAbilityLines.length" class="stat-group">
                    <div class="stat-group-title">🔷 镶嵌卡片</div>
                    <div class="stat-value-lines">
                      <div
v-for="(ability, index) in weaponCardAbilityLines" :key="`bag-weapon-card-${index}`"
                        class="stat-sub-value">
                        {{ ability }}
                      </div>
                    </div>
                  </div>
                  <div v-if="weaponGemAbilityLines.length" class="stat-group">
                    <div class="stat-group-title">💎 镶嵌宝石</div>
                    <div class="stat-value-lines">
                      <div
v-for="(ability, index) in weaponGemAbilityLines" :key="`bag-weapon-gem-${index}`"
                        class="stat-sub-value">
                        {{ ability }}
                      </div>
                    </div>
                  </div>
                  <div v-if="weaponAbilityLines.length" class="stat-group">
                    <div class="stat-group-title">🎯 装备词条</div>
                    <div class="stat-value-lines">
                      <div
v-for="(ability, index) in weaponAbilityLines" :key="`bag-weapon-ability-${index}`"
                        class="stat-sub-value">
                        {{ ability }}
                      </div>
                    </div>
                  </div>
                  <div v-if="weaponRandomStatLines.length" class="stat-group">
                    <div class="stat-group-title">⭐ 终极属性</div>
                    <div class="stat-value-lines">
                      <div
v-for="(stat, index) in weaponRandomStatLines" :key="`bag-weapon-random-stat-${index}`"
                        class="stat-sub-value">
                        {{ stat }}
                      </div>
                    </div>
                  </div>
                  <div v-if="weaponAwakeningLines.length" class="stat-group">
                    <div class="stat-group-title">🌟 技能唤醒</div>
                    <div class="stat-value-lines">
                      <div
                        v-for="(line, index) in weaponAwakeningLines" :key="`bag-weapon-awakening-${index}`"
                        class="stat-sub-value awakening-stat">
                        {{ line }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="shieldSectionVisible" class="stats-section">
                <div class="stats-section-title">盾牌属性</div>
                <div class="stats-section-body">
                  <div v-if="shieldDefenseRange" class="stat-line">🛡️ 防御力 {{ shieldDefenseRange }}</div>
                  <div v-if="shieldEnhanceDefenseBonus && !shieldDefenseRangeUsesEnhance" class="stat-line">
                    ✨ 强化防御 +{{ shieldEnhanceDefenseBonus }}
                  </div>
                  <div v-if="shieldCardAbilityLines.length" class="stat-group">
                    <div class="stat-group-title">🔷 镶嵌卡片</div>
                    <div class="stat-value-lines">
                      <div
v-for="(ability, index) in shieldCardAbilityLines" :key="`bag-shield-card-${index}`"
                        class="stat-sub-value">
                        {{ ability }}
                      </div>
                    </div>
                  </div>
                  <div v-if="shieldAbilityLines.length" class="stat-group">
                    <div class="stat-group-title">🎯 装备词条</div>
                    <div class="stat-value-lines">
                      <div
v-for="(ability, index) in shieldAbilityLines" :key="`bag-shield-ability-${index}`"
                        class="stat-sub-value">
                        {{ ability }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="armorSectionVisible" class="stats-section">
                <div class="stats-section-title">防具加成</div>
                <div class="stats-section-body">
                  <div v-if="armorDefenseRange" class="stat-line">🛡️ 防御力 {{ armorDefenseRange }}</div>
                  <div v-if="armorEnhanceDefenseBonus && !armorDefenseRangeUsesEnhance" class="stat-line">
                    ✨ 强化防御 +{{ armorEnhanceDefenseBonus }}
                  </div>
                  <div v-if="armorEnhanceAbilityLines.length" class="stat-group">
                    <div class="stat-group-title">✨ 强化加成</div>
                    <div class="stat-value-lines">
                      <div
v-for="(ability, index) in armorEnhanceAbilityLines" :key="`bag-armor-enhance-${index}`"
                        class="stat-sub-value">
                        {{ ability }}
                      </div>
                    </div>
                  </div>
                  <div v-if="armorCardAbilityLines.length" class="stat-group">
                    <div class="stat-group-title">🔷 镶嵌卡片</div>
                    <div class="stat-value-lines">
                      <div
v-for="(ability, index) in armorCardAbilityLines" :key="`bag-armor-card-${index}`"
                        class="stat-sub-value">
                        {{ ability }}
                      </div>
                    </div>
                  </div>
                  <div v-if="armorAbilityLines.length" class="stat-group">
                    <div class="stat-group-title">🎯 装备词条</div>
                    <div class="stat-value-lines">
                      <div
v-for="(ability, index) in armorAbilityLines" :key="`bag-armor-ability-${index}`"
                        class="stat-sub-value">
                        {{ ability }}
                      </div>
                    </div>
                  </div>
                  <div v-if="armorSetBonusGroups.length" class="stat-group">
                    <div class="stat-group-title">🧩 套装加成</div>
                    <div class="stat-value-lines">
                      <div
                        v-for="(group, groupIndex) in armorSetBonusGroups"
                        :key="`bag-armor-set-group-${groupIndex}`"
                      >
                        <div class="stat-sub-value">{{ group.title }}</div>
                        <div
                          v-for="(line, lineIndex) in group.lines"
                          :key="`bag-armor-set-${groupIndex}-${lineIndex}`"
                          class="stat-sub-value"
                        >
                          {{ line }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="hasEnhanceSetBonus" class="stat-group">
                    <div class="stat-group-title">🧩 强化套装 +{{ enhanceSetLevel }}</div>
                    <div class="stat-value-lines">
                      <div
v-for="(ability, index) in enhanceSetBonusAbilities" :key="`bag-enhance-set-${index}`"
                        class="stat-sub-value">
                        {{ formatEnhanceSetAbility(ability) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="jewelrySectionVisible" class="stats-section">
                <div class="stats-section-title">首饰属性</div>
                <div class="stats-section-body">
                  <div v-if="jewelryEnhanceAbilityLines.length" class="stat-group">
                    <div class="stat-group-title">✨ 强化加成</div>
                    <div class="stat-value-lines">
                      <div
v-for="(ability, index) in jewelryEnhanceAbilityLines" :key="`bag-jewelry-enhance-${index}`"
                        class="stat-sub-value">
                        {{ ability }}
                      </div>
                    </div>
                  </div>
                  <div v-if="jewelryAbilityLines.length" class="stat-group">
                    <div class="stat-group-title">🎯 装备词条</div>
                    <div class="stat-value-lines">
                      <div
v-for="(ability, index) in jewelryAbilityLines" :key="`bag-jewelry-ability-${index}`"
                        class="stat-sub-value">
                        {{ ability }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="fashionSectionVisible" class="stats-section">
                <div class="stats-section-title">时装属性</div>
                <div class="stats-section-body">
                  <div v-if="fashionAbilityLines.length" class="stat-group">
                    <div class="stat-group-title">🎯 装备词条</div>
                    <div class="stat-value-lines">
                      <div
v-for="(ability, index) in fashionAbilityLines" :key="`bag-fashion-ability-${index}`"
                        class="stat-sub-value">
                        {{ ability }}
                      </div>
                    </div>
                  </div>
                  <div v-if="fashionBlessingLines.length" class="stat-group">
                    <div class="stat-group-title">✨ 祝福唤醒</div>
                    <div class="stat-value-lines">
                      <div
v-for="(ability, index) in fashionBlessingLines" :key="`bag-fashion-blessing-${index}`"
                        class="stat-sub-value" style="color: #ffd700;">
                        {{ ability }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="totalSectionVisible" class="stats-section">
                <div class="stats-section-title">总加成</div>
                <div class="stats-section-body">
                  <div class="stat-value-lines">
                    <div
v-for="(ability, index) in totalAbilityLines" :key="`bag-total-${index}`"
                      class="stat-sub-value">
                      {{ ability }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Bag from '@/components/Bag.vue'
import EnhanceTierEffect from '@/components/EnhanceTierEffect.vue'
import GoldValue from '@/components/GoldValue.vue'
import { SetBonusService } from '@/services/SetBonusService'
import { useItemsStore } from '@/store/items'
import { useDescriptionsStore } from '@/store/descriptions'
import { useGameStore } from '@/store'
import BagService from '@/services/BagService'
import { DropService } from '@/services/DropService'
import { applyWeaponDamageFormula } from '@/data/classes'
import { classIconMap, getClassIconPath } from '@/utils/itemHelpers'
import { COMMON_SKILLS } from '@/data/skills'
import { SKILL_INFO } from '@/data/SKILL_INFO.js'
import { isDev } from '@/utils/isDev'
import { isGM } from '@/utils/isGM'

// 定义props和emits
const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  anchorButtonId: {
    type: String,
    default: 'bagButton'
  },
  player: {
    type: Object,
    default: null
  },
  userSettings: {
    type: Object,
    default: null
  },
  gameData: {
    type: Object,
    default: () => ({ items: [] })
  },
  gameInitializer: {
    type: Object,
    default: null
  },
  removeItemFromBag: {
    type: Function,
    default: null
  },
  showDamageNumber: {
    type: Function,
    default: null
  },
  addBattleLog: {
    type: Function,
    default: null
  },
  showAnimationMessage: {
    type: Function,
    default: null
  },
  playClickSound: {
    type: Function,
    default: null
  },
  openRenamePanel: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['close', 'player-data-updated'])

// 响应式数据
const bagComponent = ref(null)
const bagPanelRef = ref(null)
const playerGold = ref(0)
const bankGold = ref(0)
const itemsStore = useItemsStore()
const gameStore = useGameStore()
const descriptionsStore = useDescriptionsStore()
const testItemIdInput = ref('')
const testItemQuantityInput = ref('1')
const setBonusService = new SetBonusService()

/** 测试功能可见性：开发环境或GM权限时可见 */
const canTest = computed(() => isDev || isGM())

const equipment = computed(() => itemsStore.equipment || {})
const showBagEquipmentEffect = computed(() => props.userSettings?.showBagEquipmentEffect !== false)


const showEquipmentStats = ref(false)
const equipmentStatsRef = ref(null)
const equipmentStatsPos = ref({ x: 0, y: 0 })
const equipmentStatsRaf = ref(0)

const equipmentStatsButtonText = computed(() =>
  showEquipmentStats.value ? '?' : '?'
)

const panelSize = ref({
  width: 400,
  height: 725
})

const isResizing = ref(false)
const resizeStart = ref({
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  handle: 'bottom-right'
})

const uiScale = computed(() => {
  const baseWidth = 790
  const baseHeight = 760
  const wRatio = panelSize.value.width / baseWidth
  const hRatio = panelSize.value.height / baseHeight
  const scale = Math.sqrt(Math.max(0.01, wRatio * hRatio))
  return Math.min(1.8, Math.max(0.4, Number(scale.toFixed(3))))
})

function toggleEquipmentStats () {
  showEquipmentStats.value = !showEquipmentStats.value
}

const equipmentStatsStyle = computed(() => ({
  position: 'fixed',
  left: `${equipmentStatsPos.value.x}px`,
  top: `${equipmentStatsPos.value.y}px`,
  zIndex: 1070
}))

function updateEquipmentStatsPosition () {
  if (!showEquipmentStats.value || !bagPanelRef.value) {
    return
  }

  const panelRect = bagPanelRef.value.getBoundingClientRect()
  const statsRect = equipmentStatsRef.value?.getBoundingClientRect()

  const statsWidth = statsRect?.width || 210
  const statsHeight = statsRect?.height || 240

  const gap = 8
  const canPlaceRight = panelRect.right + gap + statsWidth <= window.innerWidth - gap
  const canPlaceLeft = panelRect.left - gap - statsWidth >= gap

  let x = canPlaceRight ? panelRect.right + gap : panelRect.left - gap - statsWidth
  if (!canPlaceRight && !canPlaceLeft) {
    x = window.innerWidth - statsWidth - gap
  }

  let y = panelRect.top

  const maxX = Math.max(gap, window.innerWidth - statsWidth - gap)
  const maxY = Math.max(gap, window.innerHeight - statsHeight - gap)

  x = Math.min(maxX, Math.max(gap, x))
  y = Math.min(maxY, Math.max(gap, y))

  equipmentStatsPos.value = { x: Math.round(x), y: Math.round(y) }
}

function startEquipmentStatsFollow () {
  if (equipmentStatsRaf.value) {
    return
  }

  const tick = () => {
    updateEquipmentStatsPosition()
    equipmentStatsRaf.value = requestAnimationFrame(tick)
  }

  equipmentStatsRaf.value = requestAnimationFrame(tick)
}

function stopEquipmentStatsFollow () {
  if (!equipmentStatsRaf.value) {
    return
  }
  cancelAnimationFrame(equipmentStatsRaf.value)
  equipmentStatsRaf.value = 0
}

const enhanceSetParameterMap = {
  hitrate: '命中率',
  blockrate: '格挡',
  allstats: '全属性',
  maxhp: '增加HP',
  attack: '攻击力'
}

const enhanceSetSlots = ['helmet', 'armor', 'gloves', 'boots']

/**
 * 根据技能ID获取技能名称
 * @param {number} skillId - 技能ID
 * @returns {string} 技能名称，未找到返回空字符串
 */
const getSkillNameById = skillId => {
  if (!skillId) return ''
  const skillKey = Object.keys(COMMON_SKILLS).find(
    key => COMMON_SKILLS[key].id === skillId
  )
  return skillKey ? COMMON_SKILLS[skillKey].name : ''
}

const formatEquipmentAbility = ability => {
  if (!ability) {
    return ''
  }
  const parameterKey = String(ability.parameter ?? '').toLowerCase()
  // 处理技能概率（skillchance）：使用技能名称替换通用标签
  if (parameterKey === 'skillchance' && ability.skill) {
    const skillName = getSkillNameById(ability.skill)
    if (skillName) {
      const add = Number(ability.add) || 0
      const addMax = ability.addMax !== undefined ? Number(ability.addMax) : undefined
      // 优先使用currentAdd（洗练后的值），否则使用add
      const displayValue = ability.currentAdd !== undefined ? Number(ability.currentAdd) : add
      if (addMax !== undefined && Number.isFinite(addMax)) {
        return `${skillName} +${displayValue}(${add}~${addMax})%`
      }
      return `${skillName} +${displayValue}%`
    }
  }
  const parameter = descriptionsStore.getParameterName(parameterKey) || ability.parameter || ''
  if (ability.set !== undefined && ability.add === undefined) {
    if (parameterKey === 'mp' && ability.set === -1) {
      return `${parameter} 持续回满`
    }
    return `${parameter} 设为 ${ability.set}`
  }
  if (ability.add === undefined || !Number.isFinite(Number(ability.add))) {
    return parameter
  }
  const add = Number(ability.add)
  const addMax = ability.addMax !== undefined ? Number(ability.addMax) : undefined
  const rate = Boolean(ability.rate)
  if (
    Number.isFinite(add) &&
    add === 0 &&
    (addMax === undefined || (Number.isFinite(addMax) && addMax === 0))
  ) {
    return ''
  }
  if (addMax !== undefined && Number.isFinite(addMax)) {
    return `${parameter} ${rate ? '+' : ''}${add}(${add}~${addMax})${rate ? '%' : ''}`
  }
  return `${parameter} ${rate ? '+' : ''}${add}${rate ? '%' : ''}`
}

const formatTotalAbility = ability => {
  if (!ability) {
    return ''
  }
  const parameterKey = String(ability.parameter ?? '').toLowerCase()
  // 处理技能概率（skillchance）：使用技能名称替换通用标签
  if (parameterKey === 'skillchance' && ability.skill) {
    const skillName = getSkillNameById(ability.skill)
    if (skillName) {
      const add = Number(ability.add) || 0
      return `${skillName} +${add}%`
    }
  }
  const parameter = descriptionsStore.getParameterName(parameterKey) || ability.parameter || ''
  if (ability.set !== undefined && ability.add === undefined) {
    if (parameterKey === 'mp' && ability.set === -1) {
      return `${parameter} 持续回满`
    }
    return `${parameter} 设为 ${ability.set}`
  }
  if (ability.add === undefined || !Number.isFinite(Number(ability.add))) {
    return parameter
  }
  const add = Number(ability.add)
  const rate = Boolean(ability.rate)
  if (Number.isFinite(add) && add === 0) {
    return ''
  }
  return `${parameter} ${rate ? '+' : ''}${add}${rate ? '%' : ''}`
}

const stripAbilityParentheses = line => {
  if (!line) {
    return ''
  }
  const cleaned = String(line).replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
  return cleaned
}

const resolveEnhanceLevel = item => {
  const level = Number(item?.StrengthenedAttributes?.enhanceLevel ?? item?.enhanceLevel ?? 0)
  return Number.isFinite(level) ? level : 0
}

const enhanceSetLevel = computed(() => {
  const levels = enhanceSetSlots.map(slot => resolveEnhanceLevel(equipment.value?.[slot]))
  const minLevel = Math.min(...levels)
  if (!Number.isFinite(minLevel) || minLevel < 3) {
    return 0
  }
  return Math.min(10, Math.floor(minLevel))
})

const enhanceSetBonusAbilities = computed(() => {
  const level = enhanceSetLevel.value
  if (!level) {
    return []
  }
  const table = itemsStore.enhanceSetBonusTable || {}
  const abilities = table[level] || table[String(level)] || []
  return Array.isArray(abilities) ? abilities : []
})

const hasEnhanceSetBonus = computed(() => enhanceSetBonusAbilities.value.length > 0)

const formatEnhanceSetAbility = ability => {
  if (!ability) {
    return ''
  }
  const key = String(ability.parameter || '').toLowerCase()
  const label = enhanceSetParameterMap[key] || ability.parameter || ''
  const value = Number(ability.add ?? 0)
  if (!Number.isFinite(value) || value === 0) {
    return label
  }
  return `${label} +${value}${ability.rate ? '%' : ''}`
}

const mergeAbilityLines = abilities => {
  const totals = new Map()
  abilities.forEach(ability => {
    if (!ability || ability.parameter === undefined) {
      return
    }
    const parameterKey = String(ability.parameter).toLowerCase()
    const rate = Boolean(ability.rate)
    const add = ability.add !== undefined ? Number(ability.add) : undefined
    const addMax = ability.addMax !== undefined ? Number(ability.addMax) : undefined
    const key = `${parameterKey}|${rate ? 'percent' : 'value'}|${ability.set ?? ''}|${ability.skill ?? ''}|${ability.skillLevel ?? ''}|${addMax !== undefined ? 'range' : 'flat'}`
    const current = totals.get(key) || {
      parameter: parameterKey,
      rate,
      set: ability.set,
      skill: ability.skill,
      skillLevel: ability.skillLevel
    }
    if (add !== undefined && Number.isFinite(add)) {
      current.add = Number.isFinite(current.add) ? current.add + add : add
    }
    if (addMax !== undefined && Number.isFinite(addMax)) {
      current.addMax = Number.isFinite(current.addMax) ? current.addMax + addMax : addMax
    }
    totals.set(key, current)
  })
  return Array.from(totals.values()).map(formatEquipmentAbility).filter(Boolean)
}
const mergeAbilityObjects = abilities => {
  const totals = new Map()
  abilities.forEach(ability => {
    if (!ability || ability.parameter === undefined) {
      return
    }
    const parameterKey = String(ability.parameter).toLowerCase()
    const rate = Boolean(ability.rate)
    const add = ability.add !== undefined ? Number(ability.add) : undefined
    const addMax = ability.addMax !== undefined ? Number(ability.addMax) : undefined
    const key = `${parameterKey}|${rate ? 'percent' : 'value'}|${ability.set ?? ''}|${ability.skill ?? ''}|${ability.skillLevel ?? ''}|${addMax !== undefined ? 'range' : 'flat'}`
    const current = totals.get(key) || {
      parameter: parameterKey,
      rate,
      set: ability.set,
      skill: ability.skill,
      skillLevel: ability.skillLevel
    }
    if (add !== undefined && Number.isFinite(add)) {
      current.add = Number.isFinite(current.add) ? current.add + add : add
    }
    if (addMax !== undefined && Number.isFinite(addMax)) {
      current.addMax = Number.isFinite(current.addMax) ? current.addMax + addMax : addMax
    }
    totals.set(key, current)
  })
  return Array.from(totals.values())
}
const parseRangeValue = value => {
  if (!value) {
    return null
  }
  const text = String(value).trim()
  const parts = text.split('~')
  if (parts.length !== 2) {
    return null
  }
  const min = Number(parts[0])
  const max = Number(parts[1])
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null
  }
  return { min, max }
}
const sumRangeValues = values => {
  let totalMin = 0
  let totalMax = 0
  let hasValue = false
  values.forEach(value => {
    const range = parseRangeValue(value)
    if (!range) {
      return
    }
    totalMin += range.min
    totalMax += range.max
    hasValue = true
  })
  if (!hasValue) {
    return null
  }
  if (totalMin <= 0 && totalMax <= 0) {
    return null
  }
  return { min: totalMin, max: totalMax }
}

const attributeElementLabelMap = {
  fire: '火',
  water: '水',
  wind: '风',
  thunder: '雷',
  earth: '土'
}
const resolveAttributeEnhancementInfo = item => {
  const elemental = item?.elementalEnhancement || item?.StrengthenedAttributes?.elementalEnhancement
  if (!elemental || typeof elemental !== 'object') {
    return null
  }
  const entries = Object.entries(attributeElementLabelMap)
    .map(([key, label]) => {
      const level = Number(elemental?.[key]?.enhancementLevel ?? 0)
      return Number.isFinite(level) && level > 0 ? { key, label, level } : null
    })
    .filter(Boolean)
  if (!entries.length) {
    return null
  }
  const resolved = entries.reduce((current, next) => (next.level > current.level ? next : current))
  const attackPercent = Number(elemental?.[resolved.key]?.elementAttackPercent ?? 0)
  return {
    ...resolved,
    attackPercent: Number.isFinite(attackPercent) ? attackPercent : 0
  }
}
const buildWeaponElementAbilityLines = items => {
  const lines = []
  items.forEach(item => {
    const info = resolveAttributeEnhancementInfo(item)
    if (!info) {
      return
    }
    if (info.label) {
      lines.push(`属性攻击 ${info.label}属性`)
    }
    if (Number.isFinite(info.attackPercent) && info.attackPercent > 0) {
      lines.push(`${info.label}属性攻击 +${info.attackPercent}%`)
    }
  })
  return Array.from(new Set(lines))
}

const collectAbilitiesFromItems = items => {
  const abilities = []
  items.forEach(item => {
    if (!item) {
      return
    }
    const itemAbilities = Array.isArray(item.abilities) ? item.abilities : []
    // 如果能力有 currentAdd 值，使用 currentAdd 替代 add
    const processedAbilities = itemAbilities.map(ability => {
      if (ability && ability.currentAdd !== undefined) {
        return { ...ability, add: ability.currentAdd }
      }
      return ability
    })
    abilities.push(...processedAbilities)
  })
  return mergeAbilityLines(abilities)
}

const collectAbilityObjectsFromItems = items => {
  const abilities = []
  items.forEach(item => {
    if (!item) {
      return
    }
    const itemAbilities = Array.isArray(item.abilities) ? item.abilities : []
    // 如果能力有 currentAdd 值，使用 currentAdd 替代 add
    const processedAbilities = itemAbilities.map(ability => {
      if (ability && ability.currentAdd !== undefined) {
        return { ...ability, add: ability.currentAdd }
      }
      return ability
    })
    abilities.push(...processedAbilities)
  })
  return abilities
}

/**
 * 收集物品的 possibleRandomStats 属性并使用 currentAdd 值
 * @param {Array} items - 物品数组
 * @returns {Array} 处理后的随机属性数组
 */
const collectRandomStatsFromItems = items => {
  const stats = []
  items.forEach(item => {
    if (!item) {
      return
    }
    const randomStats = Array.isArray(item.possibleRandomStats) ? item.possibleRandomStats : []
    // 如果有 currentAdd 值，使用 currentAdd 替代 add
    const processedStats = randomStats.map(stat => {
      if (stat && stat.currentAdd !== undefined) {
        return { ...stat, add: stat.currentAdd }
      }
      return stat
    })
    stats.push(...processedStats)
  })
  return mergeAbilityLines(stats)
}

/**
 * 收集物品的 possibleRandomStats 属性对象并使用 currentAdd 值
 * @param {Array} items - 物品数组
 * @returns {Array} 处理后的随机属性对象数组
 */
const collectRandomStatObjectsFromItems = items => {
  const stats = []
  items.forEach(item => {
    if (!item) {
      return
    }
    const randomStats = Array.isArray(item.possibleRandomStats) ? item.possibleRandomStats : []
    // 如果有 currentAdd 值，使用 currentAdd 替代 add
    const processedStats = randomStats.map(stat => {
      if (stat && stat.currentAdd !== undefined) {
        return { ...stat, add: stat.currentAdd }
      }
      return stat
    })
    stats.push(...processedStats)
  })
  return stats
}

const getEmbeddedCardsForDisplay = attrs => {
  if (!attrs || typeof attrs !== 'object') {
    return null
  }
  if (attrs.embeddedCards && typeof attrs.embeddedCards === 'object') {
    return attrs.embeddedCards
  }
  if (!attrs.perforationLevels || typeof attrs.perforationLevels !== 'object') {
    return null
  }
  const result = {}
  Object.entries(attrs.perforationLevels).forEach(([levelKey, level]) => {
    if (!level || level.embeddedCardId === null || level.embeddedCardId === undefined) {
      return
    }
    let id = null
    if (level.embeddedCardId && typeof level.embeddedCardId === 'object') {
      const idCandidate = Number(level.embeddedCardId.cardId)
      id = Number.isFinite(idCandidate) ? idCandidate : null
    } else {
      const idCandidate = Number(level.embeddedCardId)
      id = Number.isFinite(idCandidate) ? idCandidate : null
    }
    if (id === null) {
      return
    }
    const key = String(levelKey)
    result[key] = {
      cardId: id,
      abilities: itemsStore.getItemConfig(id)?.abilities || []
    }
  })
  return Object.keys(result).length > 0 ? result : null
}

const collectCardAbilityObjectsFromItems = items => {
  const abilities = []
  items.forEach(item => {
    if (!item?.PerforationAttributes) {
      return
    }
    const embedded = getEmbeddedCardsForDisplay(item.PerforationAttributes)
    if (!embedded) {
      return
    }
    Object.values(embedded).forEach(card => {
      if (!Array.isArray(card?.abilities)) {
        return
      }
      abilities.push(...card.abilities)
    })
  })
  return abilities
}

/**
 * 收集武器镶嵌宝石的属性（embeddedGems）
 * @param {Array} items - 物品数组（武器）
 * @returns {Array} 宝石属性数组
 */
const collectGemAbilityObjectsFromItems = items => {
  const abilities = []
  items.forEach(item => {
    if (!item?.embeddedGems) {
      return
    }
    const gems = item.embeddedGems
    // 支持对象格式 { gem1: {...}, gem2: {...} }
    if (typeof gems === 'object' && !Array.isArray(gems)) {
      Object.values(gems).forEach(gem => {
        if (!Array.isArray(gem?.abilities)) {
          return
        }
        abilities.push(...gem.abilities)
      })
    } else if (Array.isArray(gems)) {
      // 支持数组格式
      gems.forEach(gem => {
        if (!Array.isArray(gem?.abilities)) {
          return
        }
        abilities.push(...gem.abilities)
      })
    }
  })
  return abilities
}

/**
 * 收集武器镶嵌宝石的属性并格式化为显示行
 * @param {Array} items - 物品数组（武器）
 * @returns {Array} 格式化后的宝石属性行
 */
const collectGemAbilitiesFromItems = items => {
  const abilities = collectGemAbilityObjectsFromItems(items)
  return mergeAbilityLines(abilities)
}

const mergeCardAbilities = embeddedCards => {
  if (!embeddedCards) {
    return []
  }
  const mergedAbilities = {}
  Object.values(embeddedCards).forEach(card => {
    if (!card?.abilities) {
      return
    }
    card.abilities.forEach(ability => {
      const parameterKey = String(ability.parameter).toLowerCase()
      const key = `${parameterKey}_${ability.rate ? 'percent' : 'value'}`
      if (!mergedAbilities[key]) {
        mergedAbilities[key] = {
          parameter: ability.parameter,
          add: ability.add,
          addMax: ability.addMax,
          rate: ability.rate
        }
      } else {
        mergedAbilities[key].add += ability.add
        if (ability.addMax !== undefined && mergedAbilities[key].addMax !== undefined) {
          mergedAbilities[key].addMax += ability.addMax
        }
      }
    })
  })
  return Object.values(mergedAbilities).map(formatEquipmentAbility).filter(Boolean)
}

const collectCardAbilitiesFromItems = items => {
  const cards = {}
  let hasCard = false
  items.forEach(item => {
    if (!item?.PerforationAttributes) {
      return
    }
    const embedded = getEmbeddedCardsForDisplay(item.PerforationAttributes)
    if (!embedded) {
      return
    }
    Object.entries(embedded).forEach(([key, value]) => {
      cards[`${item.uniqueId || item.id}-${key}`] = value
    })
    hasCard = true
  })
  if (!hasCard) {
    return []
  }
  return mergeCardAbilities(cards)
}

const getJewelryEnhanceAbilities = item => {
  if (!item || item.category !== 'jewelry') {
    return []
  }
  const upgradeLevels = Array.isArray(item.upgradeLevels) ? item.upgradeLevels : []
  if (upgradeLevels.length === 0) {
    return []
  }
  const enhanceLevel = resolveEnhanceLevel(item)
  // 终极首饰特殊处理：即使 enhanceLevel 为 0，也要返回 upgradeLevels[0] 的属性
  // 这与 ItemTooltip.vue 和 PlayerStatsService.js 中的逻辑保持一致
  if (item.rarity === 'ultimate') {
    // 终极首饰：优先使用显式的 enhanceLevel，否则使用 0 级属性
    const targetLevel = Number.isFinite(enhanceLevel) && enhanceLevel >= 0 ? enhanceLevel : 0
    const matched =
      upgradeLevels.find(level => Number(level?.upgradeLevel) === targetLevel) ||
      upgradeLevels[targetLevel]
    const abilities = Array.isArray(matched?.abilities) ? matched.abilities : []
    return abilities
  }
  // 普通首饰需要 enhanceLevel > 0 才显示强化属性
  if (!Number.isFinite(enhanceLevel) || enhanceLevel <= 0) {
    return []
  }
  const matched =
    upgradeLevels.find(level => Number(level?.upgradeLevel) === enhanceLevel) ||
    upgradeLevels[enhanceLevel]
  const abilities = Array.isArray(matched?.abilities) ? matched.abilities : []
  return abilities
}

const getArmorEnhanceAbilities = item => {
  if (!item || item.category !== 'armor' || item.subcategory === 'shield') {
    return []
  }
  const enhanceLevel = resolveEnhanceLevel(item)
  if (!Number.isFinite(enhanceLevel) || enhanceLevel <= 0) {
    return []
  }
  const upgradeLevels = Array.isArray(item.upgradeLevels) ? item.upgradeLevels : []
  if (upgradeLevels.length > 0) {
    const matched =
      upgradeLevels.find(level => Number(level?.upgradeLevel) === enhanceLevel) ||
      upgradeLevels[enhanceLevel]
    const abilities = Array.isArray(matched?.abilities) ? matched.abilities : []
    if (abilities.length) {
      return abilities
    }
  }
  const attrs = item.StrengthenedAttributes || {}
  const levelAttrs = attrs[String(enhanceLevel)] || {}
  if (Array.isArray(levelAttrs.abilities)) {
    return levelAttrs.abilities
  }
  if (Array.isArray(attrs.abilities)) {
    return attrs.abilities
  }
  return []
}

const weaponItems = computed(() => {
  return Object.values(equipment.value || {}).filter(item => item && item.category === 'weapon')
})

const shieldItems = computed(() => {
  return Object.values(equipment.value || {}).filter(item => item && item.subcategory === 'shield')
})

const armorItems = computed(() => {
  return Object.values(equipment.value || {}).filter(
    item => item && item.category === 'armor' && item.subcategory !== 'shield'
  )
})

const jewelryItems = computed(() => {
  return Object.values(equipment.value || {}).filter(item => item && item.category === 'jewelry')
})

/** 时装装备列表：面具、披风、时装帽子、时装衣服、时装手套、时装鞋子 */
const fashionItems = computed(() => {
  return Object.values(equipment.value || {}).filter(item => item && item.category === 'fashion')
})

const equippedItems = computed(() => {
  return Object.values(equipment.value || {}).filter(item => item)
})
 
const setBonusKeyMap = {
  strength: { parameter: 'str' },
  dexterity: { parameter: 'dex' },
  agility: { parameter: 'agi' },
  intelligence: { parameter: 'int' },
  constitution: { parameter: 'sta' },
  attack: { parameter: 'attack' },
  defense: { parameter: 'defense' },
  maxHealth: { parameter: 'maxhp' },
  maxMana: { parameter: 'maxmp' },
  attackPercentage: { parameter: 'attack', rate: true },
  defensePercentage: { parameter: 'defense', rate: true },
  maxHealthPercentage: { parameter: 'maxhp', rate: true },
  maxManaPercentage: { parameter: 'maxmp', rate: true },
  criticalRate: { parameter: 'criticalrate', rate: true, fractional: true },
  criticalDamage: { parameter: 'criticaldamage', rate: true, fractional: true },
  hitRate: { parameter: 'hitrate', rate: true, fractional: true },
  dodgeRate: { parameter: 'dodgerate', rate: true, fractional: true },
  blockRate: { parameter: 'blockrate', rate: true, fractional: true },
  attackSpeed: { parameter: 'speed', rate: true, fractional: true },
  decreasedCastingTime: { parameter: 'decreasedcastingtime', rate: true, fractional: true },
  decreasedMpConsumption: { parameter: 'mp', rate: true, fractional: true },
  decreasedFpConsumption: { parameter: 'fp', rate: true, fractional: true },
  lifeSteal: { parameter: 'stealhp', rate: true, fractional: true },
  healPercent: { parameter: 'healing', rate: true, fractional: true },
  blockPenetration: { parameter: 'blockpenetration', rate: true, fractional: true },
  moveSpeed: { parameter: 'movespeed', rate: true, fractional: true },
  hpRegeneration: { parameter: 'hpregeneration', rate: true, fractional: true },
  mpRegeneration: { parameter: 'mpregeneration', rate: true, fractional: true },
  damageBonus: { parameter: 'damagebonus', rate: true },
  damageReduction: { parameter: 'damagereduction', rate: true },
  skillDamage: { parameter: 'skilldamage', rate: true },
  criticalResistance: { parameter: 'criticalresist', rate: true, fractional: true },
  hpRecoveryAfterKill: { parameter: 'hprecoveryafterkill' }
}

const normalizeSetBonusValue = (value, config) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric === 0) {
    return null
  }
  if (config?.rate && config?.fractional && Math.abs(numeric) <= 1) {
    return numeric * 100
  }
  return numeric
}

const setBonusAbilities = computed(() => {
  const items = equippedItems.value
  if (!items.length) {
    return []
  }
  const setData = itemsStore.equipmentSets || []
  const hasSetData = Array.isArray(setData)
    ? setData.length > 0
    : Object.keys(setData || {}).length > 0
  if (!hasSetData) {
    return []
  }
  const bonuses = setBonusService.calculateSetBonuses(items, setData)
  return Object.entries(bonuses).reduce((result, [key, rawValue]) => {
    const config = setBonusKeyMap[key]
    if (!config) {
      return result
    }
    const add = normalizeSetBonusValue(rawValue, config)
    if (!Number.isFinite(add) || add === 0) {
      return result
    }
    result.push({
      parameter: config.parameter,
      add,
      rate: Boolean(config.rate)
    })
    return result
  }, [])
})

const armorSetBonusGroups = computed(() => {
  const armorList = armorItems.value
  if (!armorList.length) {
    return []
  }
  const setData = itemsStore.equipmentSets || []
  const sets =
    setData && typeof setData === 'object' && !Array.isArray(setData)
      ? Object.values(setData)
      : Array.isArray(setData)
        ? setData
        : []
  if (!sets.length) {
    return []
  }
  const equippedIds = equippedItems.value
    .map(item => Number(item.id))
    .filter(id => Number.isFinite(id))
  const armorIds = new Set(
    armorList.map(item => Number(item.id)).filter(id => Number.isFinite(id))
  )
  const seen = new Set()
  const groups = []
  sets.forEach(set => {
    const parts = Array.isArray(set?.parts)
      ? set.parts.map(partId => Number(partId)).filter(id => Number.isFinite(id))
      : []
    if (!parts.length) {
      return
    }
    if (!parts.some(partId => armorIds.has(partId))) {
      return
    }
    const key = set?.id !== undefined ? String(set.id) : parts.join('-')
    if (seen.has(key)) {
      return
    }
    seen.add(key)
    const equippedCount = parts.filter(partId => equippedIds.includes(partId)).length
    const nameValue =
      typeof set?.name === 'object' ? set.name.cns || set.name.en || '未知套装' : set?.name
    const title = `${nameValue || '未知套装'} (${equippedCount}/${parts.length})`
    const bonuses = Array.isArray(set?.bonus) ? set.bonus : []
    const lines = bonuses
      .map(bonus => {
        const required = Number(bonus?.equipped ?? 0)
        const desc = setBonusService.formatBonusText(bonus?.ability)
        const suffix = equippedCount >= required ? '' : '（未激活）'
        return `${required}件套效果: ${desc}${suffix}`
      })
      .filter(Boolean)
    if (!lines.length) {
      return
    }
    groups.push({ title, lines })
  })
  return groups
})

const weaponAttackRangeUsesEnhance = computed(() => {
  return weaponItems.value.some(item => {
    const level = resolveEnhanceLevel(item)
    if (level <= 0) {
      return false
    }
    const attrs = item.StrengthenedAttributes || {}
    const levelAttrs = attrs[String(level)] || {}
    const enhancedMin = Number(attrs.enhancedMinAttack ?? levelAttrs.enhancedMinAttack)
    const enhancedMax = Number(attrs.enhancedMaxAttack ?? levelAttrs.enhancedMaxAttack)
    return Number.isFinite(enhancedMin) && Number.isFinite(enhancedMax)
  })
})

const weaponAttackRange = computed(() => {
  let totalMin = 0
  let totalMax = 0
  weaponItems.value.forEach(item => {
    const level = resolveEnhanceLevel(item)
    const attrs = item.StrengthenedAttributes || {}
    const levelAttrs = attrs[String(level)] || {}
    const enhancedMin = Number(attrs.enhancedMinAttack ?? levelAttrs.enhancedMinAttack)
    const enhancedMax = Number(attrs.enhancedMaxAttack ?? levelAttrs.enhancedMaxAttack)
    const processed = Number.isFinite(enhancedMin) && Number.isFinite(enhancedMax)
      ? applyWeaponDamageFormula({
        ...item,
        minAttack: enhancedMin,
        maxAttack: enhancedMax
      })
      : applyWeaponDamageFormula(item)
    totalMin += processed.minAttack || 0
    totalMax += processed.maxAttack || 0
  })
  if (totalMin <= 0 && totalMax <= 0) {
    return ''
  }
  return `${totalMin}~${totalMax}`
})

const armorDefenseRangeUsesEnhance = computed(() => {
  return armorItems.value.some(item => {
    const level = resolveEnhanceLevel(item)
    if (level <= 0) {
      return false
    }
    const attrs = item.StrengthenedAttributes || {}
    const levelAttrs = attrs[String(level)] || {}
    const enhancedMin = Number(attrs.enhancedMinDefense ?? levelAttrs.enhancedMinDefense)
    const enhancedMax = Number(attrs.enhancedMaxDefense ?? levelAttrs.enhancedMaxDefense)
    return Number.isFinite(enhancedMin) && Number.isFinite(enhancedMax)
  })
})

const shieldDefenseRangeUsesEnhance = computed(() => {
  return shieldItems.value.some(item => {
    const level = resolveEnhanceLevel(item)
    if (level <= 0) {
      return false
    }
    const attrs = item.StrengthenedAttributes || {}
    const levelAttrs = attrs[String(level)] || {}
    const enhancedMin = Number(attrs.enhancedMinDefense ?? levelAttrs.enhancedMinDefense)
    const enhancedMax = Number(attrs.enhancedMaxDefense ?? levelAttrs.enhancedMaxDefense)
    return Number.isFinite(enhancedMin) && Number.isFinite(enhancedMax)
  })
})

const armorDefenseRange = computed(() => {
  let totalMin = 0
  let totalMax = 0
  armorItems.value.forEach(item => {
    const level = resolveEnhanceLevel(item)
    const attrs = item.StrengthenedAttributes || {}
    const levelAttrs = attrs[String(level)] || {}
    const enhancedMin = Number(attrs.enhancedMinDefense ?? levelAttrs.enhancedMinDefense)
    const enhancedMax = Number(attrs.enhancedMaxDefense ?? levelAttrs.enhancedMaxDefense)
    if (Number.isFinite(enhancedMin) && Number.isFinite(enhancedMax)) {
      totalMin += enhancedMin
      totalMax += enhancedMax
      return
    }
    totalMin += item.minDefense || 0
    totalMax += item.maxDefense || 0
  })
  if (totalMin <= 0 && totalMax <= 0) {
    return ''
  }
  return `${totalMin}~${totalMax}`
})

const shieldDefenseRange = computed(() => {
  let totalMin = 0
  let totalMax = 0
  shieldItems.value.forEach(item => {
    const level = resolveEnhanceLevel(item)
    const attrs = item.StrengthenedAttributes || {}
    const levelAttrs = attrs[String(level)] || {}
    const enhancedMin = Number(attrs.enhancedMinDefense ?? levelAttrs.enhancedMinDefense)
    const enhancedMax = Number(attrs.enhancedMaxDefense ?? levelAttrs.enhancedMaxDefense)
    if (Number.isFinite(enhancedMin) && Number.isFinite(enhancedMax)) {
      totalMin += enhancedMin
      totalMax += enhancedMax
      return
    }
    totalMin += item.minDefense || 0
    totalMax += item.maxDefense || 0
  })
  if (totalMin <= 0 && totalMax <= 0) {
    return ''
  }
  return `${totalMin}~${totalMax}`
})

const weaponAttackSpeed = computed(() => {
  let total = 0
  weaponItems.value.forEach(item => {
    const value = Number(item.attackSpeedValue)
    if (Number.isFinite(value)) {
      total += value
    }
  })
  if (total <= 0) {
    return ''
  }
  const percent = total * 100
  const rounded = Math.round(percent * 10) / 10
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}%`
})

const weaponEnhanceAttackBonus = computed(() => {
  let totalMin = 0
  let totalMax = 0
  weaponItems.value.forEach(item => {
    const level = resolveEnhanceLevel(item)
    if (level <= 0) {
      return
    }
    const attrs = item.StrengthenedAttributes || {}
    const levelAttrs = attrs[String(level)] || {}
    const enhancedMin = Number(attrs.enhancedMinAttack ?? levelAttrs.enhancedMinAttack)
    const enhancedMax = Number(attrs.enhancedMaxAttack ?? levelAttrs.enhancedMaxAttack)
    if (!Number.isFinite(enhancedMin) || !Number.isFinite(enhancedMax)) {
      return
    }
    const baseProcessed = applyWeaponDamageFormula(item)
    const enhancedProcessed = applyWeaponDamageFormula({
      ...item,
      minAttack: enhancedMin,
      maxAttack: enhancedMax
    })
    const minBonus = (enhancedProcessed.minAttack || 0) - (baseProcessed.minAttack || 0)
    const maxBonus = (enhancedProcessed.maxAttack || 0) - (baseProcessed.maxAttack || 0)
    if (minBonus > 0 || maxBonus > 0) {
      totalMin += Math.max(0, minBonus)
      totalMax += Math.max(0, maxBonus)
    }
  })
  if (totalMin <= 0 && totalMax <= 0) {
    return ''
  }
  return `${totalMin}~${totalMax}`
})

const armorEnhanceDefenseBonus = computed(() => {
  let totalMin = 0
  let totalMax = 0
  armorItems.value.forEach(item => {
    const level = resolveEnhanceLevel(item)
    if (level <= 0) {
      return
    }
    const attrs = item.StrengthenedAttributes || {}
    const levelAttrs = attrs[String(level)] || {}
    const enhancedMin = Number(attrs.enhancedMinDefense ?? levelAttrs.enhancedMinDefense)
    const enhancedMax = Number(attrs.enhancedMaxDefense ?? levelAttrs.enhancedMaxDefense)
    if (!Number.isFinite(enhancedMin) || !Number.isFinite(enhancedMax)) {
      return
    }
    const minBonus = enhancedMin - (item.minDefense || 0)
    const maxBonus = enhancedMax - (item.maxDefense || 0)
    if (minBonus > 0 || maxBonus > 0) {
      totalMin += Math.max(0, minBonus)
      totalMax += Math.max(0, maxBonus)
    }
  })
  if (totalMin <= 0 && totalMax <= 0) {
    return ''
  }
  return `${totalMin}~${totalMax}`
})

const shieldEnhanceDefenseBonus = computed(() => {
  let totalMin = 0
  let totalMax = 0
  shieldItems.value.forEach(item => {
    const level = resolveEnhanceLevel(item)
    if (level <= 0) {
      return
    }
    const attrs = item.StrengthenedAttributes || {}
    const levelAttrs = attrs[String(level)] || {}
    const enhancedMin = Number(attrs.enhancedMinDefense ?? levelAttrs.enhancedMinDefense)
    const enhancedMax = Number(attrs.enhancedMaxDefense ?? levelAttrs.enhancedMaxDefense)
    if (!Number.isFinite(enhancedMin) || !Number.isFinite(enhancedMax)) {
      return
    }
    const minBonus = enhancedMin - (item.minDefense || 0)
    const maxBonus = enhancedMax - (item.maxDefense || 0)
    if (minBonus > 0 || maxBonus > 0) {
      totalMin += Math.max(0, minBonus)
      totalMax += Math.max(0, maxBonus)
    }
  })
  if (totalMin <= 0 && totalMax <= 0) {
    return ''
  }
  return `${totalMin}~${totalMax}`
})

const weaponElementAbilityLines = computed(() => buildWeaponElementAbilityLines(weaponItems.value))
const weaponAbilityLines = computed(() =>
  [
    ...weaponElementAbilityLines.value,
    ...collectAbilitiesFromItems(weaponItems.value).map(stripAbilityParentheses).filter(Boolean)
  ]
)
/**
 * 武器随机属性行（终极武器的 possibleRandomStats）
 */
const weaponRandomStatLines = computed(() => collectRandomStatsFromItems(weaponItems.value))

/**
 * 武器唤醒技能属性行
 * 收集武器和盾牌的唤醒数据，格式化为显示行
 */
const weaponAwakeningLines = computed(() => {
  const lines = []
  
  // 处理武器唤醒技能
  weaponItems.value.forEach(item => {
    if (item.awakenedSkillData) {
      const skillInfo = SKILL_INFO[String(item.awakenedSkillData.skillId)]
      const skillName = skillInfo?.name?.cns || skillInfo?.name?.en || `技能ID: ${item.awakenedSkillData.skillId}`
      lines.push(`✨ ${skillName} +${item.awakenedSkillData.skillValue}%`)
    }
  })
  
  // 处理盾牌唤醒属性
  shieldItems.value.forEach(item => {
    if (item.awakenedParameterData) {
      const paramName = item.awakenedParameterData.parameter
      const displayName = descriptionsStore.getParameterName(paramName)
      lines.push(`✨ ${displayName} +${item.awakenedParameterData.value}%`)
    }
  })
  
  return lines
})

/**
 * 武器唤醒属性对象数组（用于总加成计算）
 */
const weaponAwakeningAbilities = computed(() => {
  const abilities = []
  
  // 处理武器唤醒技能（技能伤害加成）
  weaponItems.value.forEach(item => {
    if (item.awakenedSkillData) {
      abilities.push({
        parameter: 'skilldamage',
        add: item.awakenedSkillData.skillValue,
        rate: true,
        source: 'awakening',
        skillId: item.awakenedSkillData.skillId
      })
    }
  })
  
  // 处理盾牌唤醒属性
  shieldItems.value.forEach(item => {
    if (item.awakenedParameterData) {
      const paramMap = {
        block: 'blockrate',
        reflectdamage: 'reflectdamage',
        magicdefense: 'magicdefense',
        criticalresist: 'criticalresist',
        electricitydefense: 'electricitydefense',
        firedefense: 'firedefense',
        winddefense: 'winddefense',
        waterdefense: 'waterdefense',
        earthdefense: 'earthdefense',
        bleedandpoisonresist: 'bleedandpoisonresist',
        healing: 'healing'
      }
      abilities.push({
        parameter: paramMap[item.awakenedParameterData.parameter] || item.awakenedParameterData.parameter,
        add: item.awakenedParameterData.value,
        rate: true,
        source: 'awakening'
      })
    }
  })
  
  return abilities
})

const shieldAbilityLines = computed(() => collectAbilitiesFromItems(shieldItems.value))
const armorAbilityLines = computed(() => collectAbilitiesFromItems(armorItems.value))
const jewelryAbilityLines = computed(() => collectAbilitiesFromItems(jewelryItems.value))
/** 时装装备词条：汇总所有时装物品的 abilities 属性 */
const fashionAbilityLines = computed(() => collectAbilitiesFromItems(fashionItems.value))
/**
 * 从时装物品列表中收集祝福唤醒属性对象（用于总加成计算）
 * @param {Array} items - 时装物品列表
 * @returns {Array} 属性对象数组
 */
const collectBlessingAbilityObjects = items => {
  const abilities = []
  items.forEach(item => {
    if (!item?.blessedData?.attributes || !Array.isArray(item.blessedData.attributes)) return
    item.blessedData.attributes.forEach(attr => {
      if (!attr || !attr.parameter) return
      abilities.push({
        parameter: attr.parameter,
        add: Number(attr.value) || 0,
        rate: Boolean(attr.isRate)
      })
    })
  })
  return abilities
}
/** 时装祝福唤醒属性：汇总所有时装物品的 blessedData.attributes */
const fashionBlessingLines = computed(() => {
  const abilities = collectBlessingAbilityObjects(fashionItems.value)
  return mergeAbilityLines(abilities)
})

const jewelryEnhanceAbilityLines = computed(() => {
  const abilities = []
  jewelryItems.value.forEach(item => {
    abilities.push(...getJewelryEnhanceAbilities(item))
  })
  return mergeAbilityLines(abilities)
})

const armorEnhanceAbilityLines = computed(() => {
  const abilities = []
  armorItems.value.forEach(item => {
    abilities.push(...getArmorEnhanceAbilities(item))
  })
  return mergeAbilityLines(abilities)
})

const totalAbilityLines = computed(() => {
const abilities = []
abilities.push(...collectAbilityObjectsFromItems(weaponItems.value))
abilities.push(...collectAbilityObjectsFromItems(shieldItems.value))
abilities.push(...collectAbilityObjectsFromItems(armorItems.value))
abilities.push(...collectAbilityObjectsFromItems(jewelryItems.value))
abilities.push(...collectAbilityObjectsFromItems(fashionItems.value))
abilities.push(...collectBlessingAbilityObjects(fashionItems.value))
abilities.push(...collectCardAbilityObjectsFromItems(weaponItems.value))
abilities.push(...collectCardAbilityObjectsFromItems(shieldItems.value))
abilities.push(...collectCardAbilityObjectsFromItems(armorItems.value))
// 收集武器镶嵌宝石属性
abilities.push(...collectGemAbilityObjectsFromItems(weaponItems.value))
// 收集终极武器的 possibleRandomStats 属性
abilities.push(...collectRandomStatObjectsFromItems(weaponItems.value))
// 收集武器唤醒属性
abilities.push(...weaponAwakeningAbilities.value)
armorItems.value.forEach(item => {
abilities.push(...getArmorEnhanceAbilities(item))
})
  jewelryItems.value.forEach(item => {
    abilities.push(...getJewelryEnhanceAbilities(item))
  })
  if (hasEnhanceSetBonus.value) {
    abilities.push(...enhanceSetBonusAbilities.value)
  }
  if (setBonusAbilities.value.length) {
    abilities.push(...setBonusAbilities.value)
  }
  const merged = mergeAbilityObjects(abilities)
  let attackAdd = 0
  let attackAddMax = 0
  let defenseAdd = 0
  let defenseAddMax = 0
  const remaining = []
  merged.forEach(ability => {
    const key = String(ability.parameter || '').toLowerCase()
    const isAttack = key === 'attack' || key === 'damage'
    const isDefense = key === 'def' || key === 'defense'
    if (isAttack && !ability.rate) {
      if (Number.isFinite(ability.add)) {
        attackAdd += ability.add
        if (!Number.isFinite(ability.addMax)) {
          attackAddMax += ability.add
        }
      }
      if (Number.isFinite(ability.addMax)) {
        attackAddMax += ability.addMax
      }
      return
    }
    if (isDefense && !ability.rate) {
      if (Number.isFinite(ability.add)) {
        defenseAdd += ability.add
        if (!Number.isFinite(ability.addMax)) {
          defenseAddMax += ability.add
        }
      }
      if (Number.isFinite(ability.addMax)) {
        defenseAddMax += ability.addMax
      }
      return
    }
    remaining.push(ability)
  })
  const weaponRange = parseRangeValue(weaponAttackRange.value)
  let attackLine = ''
  if (weaponRange) {
    const min = weaponRange.min + attackAdd
    const max = weaponRange.max + (attackAddMax || attackAdd)
    if (min > 0 || max > 0) {
      attackLine = `攻击力 ${min}~${max}`
    }
  } else if (attackAdd > 0 || attackAddMax > 0) {
    if (attackAddMax > attackAdd) {
      attackLine = `攻击力 ${attackAdd}~${attackAddMax}`
    } else {
      attackLine = `攻击力 +${attackAdd}`
    }
  }
  // 合并所有防御力来源（装备基础防御 + 强化防御 + 首饰防御加成）
  const baseDefenseRange = sumRangeValues([armorDefenseRange.value, shieldDefenseRange.value])
  const enhanceDefenseRange = sumRangeValues([armorEnhanceDefenseBonus.value, shieldEnhanceDefenseBonus.value])
  const totalDefenseMin = (baseDefenseRange?.min || 0) + (enhanceDefenseRange?.min || 0) + defenseAdd
  const totalDefenseMax = (baseDefenseRange?.max || 0) + (enhanceDefenseRange?.max || 0) + (defenseAddMax || defenseAdd)
  let totalDefenseLine = ''
  if (totalDefenseMin > 0 || totalDefenseMax > 0) {
    totalDefenseLine = totalDefenseMin === totalDefenseMax ? `防御力 ${totalDefenseMin}` : `防御力 ${totalDefenseMin}~${totalDefenseMax}`
  }
  const formatted = remaining.map(formatTotalAbility).map(stripAbilityParentheses).filter(Boolean)
  if (attackLine) {
    formatted.unshift(attackLine)
  }
  const elementLines = weaponElementAbilityLines.value
  if (elementLines.length) {
    const insertIndex = attackLine ? 1 : 0
    formatted.splice(insertIndex, 0, ...elementLines)
  }
  if (totalDefenseLine) {
    const insertIndex = (attackLine ? 1 : 0) + elementLines.length
    formatted.splice(insertIndex, 0, totalDefenseLine)
  }
  return formatted
})

const weaponCardAbilityLines = computed(() => collectCardAbilitiesFromItems(weaponItems.value))
const shieldCardAbilityLines = computed(() => collectCardAbilitiesFromItems(shieldItems.value))
const armorCardAbilityLines = computed(() => collectCardAbilitiesFromItems(armorItems.value))

const weaponGemAbilityLines = computed(() => collectGemAbilitiesFromItems(weaponItems.value))

const weaponSectionVisible = computed(() => {
return Boolean(
weaponAttackRange.value ||
weaponAttackSpeed.value ||
weaponEnhanceAttackBonus.value ||
weaponElementAbilityLines.value.length ||
weaponCardAbilityLines.value.length ||
weaponGemAbilityLines.value.length ||
weaponAbilityLines.value.length ||
weaponRandomStatLines.value.length ||
weaponAwakeningLines.value.length
)
})

const shieldSectionVisible = computed(() => {
  return Boolean(
    shieldDefenseRange.value ||
    shieldEnhanceDefenseBonus.value ||
    shieldCardAbilityLines.value.length ||
    shieldAbilityLines.value.length
  )
})

const armorSectionVisible = computed(() => {
  return Boolean(
    armorDefenseRange.value ||
    armorEnhanceDefenseBonus.value ||
    armorEnhanceAbilityLines.value.length ||
    armorCardAbilityLines.value.length ||
    armorAbilityLines.value.length ||
    hasEnhanceSetBonus.value ||
    armorSetBonusGroups.value.length
  )
})

const jewelrySectionVisible = computed(() => {
  return Boolean(jewelryEnhanceAbilityLines.value.length || jewelryAbilityLines.value.length)
})

/** 时装属性区域是否可见 */
const fashionSectionVisible = computed(() => fashionAbilityLines.value.length > 0 || fashionBlessingLines.value.length > 0)

const totalSectionVisible = computed(() => totalAbilityLines.value.length > 0)

const playerAvatar = computed(() => {
  if (!props.player?.class) {
    return '/pt/job_icon/cxz_nan_icon.png'
  }

  const className = String(props.player.class).toLowerCase()
  const gender = props.player.sex === 'female' ? 'female' : 'male'

  // 使用统一的 getClassIconPath 函数，正确处理三转职业图标命名（无_icon后缀）
  return getClassIconPath(className, gender)
})

const topAccessorySlots = [
  { key: 'earring1', label: '耳环1' },
  { key: 'ring1', label: '戒指1' },
  { key: 'necklace', label: '项链' },
  { key: 'ring2', label: '戒指2' },
  { key: 'earring2', label: '耳环2' }
]

const leftEquipmentSlots = [
  { key: 'weapon', label: '武器' },
  { key: 'shield', label: '盾牌' },
  { key: 'mask', label: '面具' },
  { key: 'cloak', label: '披风' }
]

const rightEquipmentSlots = [
  { key: 'helmet', label: '帽子' },
  { key: 'armor', label: '衣服' },
  { key: 'gloves', label: '手套' },
  { key: 'boots', label: '鞋子' }
]

const fashionSlots = [
  { key: 'fashionHat', label: '时装帽子' },
  { key: 'fashionSuit', label: '时装衣服' },
  { key: 'fashionGloves', label: '时装手套' },
  { key: 'fashionBoots', label: '时装鞋子' }
]

// 玩家头像大图预览
const showAvatarPreview = ref(false)
let avatarPreviewShowTimer = null
let avatarPreviewHideTimer = null

/**
 * 显示玩家头像大图预览
 * 延迟 300ms 显示，避免误触发
 */
const showPlayerAvatarPreview = () => {
  // 清除隐藏定时器
  if (avatarPreviewHideTimer) {
    clearTimeout(avatarPreviewHideTimer)
    avatarPreviewHideTimer = null
  }
  // 如果已经显示或正在显示中，不重复设置
  if (showAvatarPreview.value || avatarPreviewShowTimer) {
    return
  }
  avatarPreviewShowTimer = setTimeout(() => {
    showAvatarPreview.value = true
    avatarPreviewShowTimer = null
  }, 300)
}

/**
 * 隐藏玩家头像大图预览
 * 延迟 100ms 隐藏，允许鼠标移动到大图上
 */
const hidePlayerAvatarPreview = () => {
  // 清除显示定时器
  if (avatarPreviewShowTimer) {
    clearTimeout(avatarPreviewShowTimer)
    avatarPreviewShowTimer = null
  }
  // 延迟隐藏，给用户时间移动到大图上
  if (avatarPreviewHideTimer) {
    clearTimeout(avatarPreviewHideTimer)
  }
  avatarPreviewHideTimer = setTimeout(() => {
    showAvatarPreview.value = false
    avatarPreviewHideTimer = null
  }, 100)
}

/**
 * 取消隐藏定时器（鼠标进入大图时调用）
 */
const cancelHideAvatarPreview = () => {
  if (avatarPreviewHideTimer) {
    clearTimeout(avatarPreviewHideTimer)
    avatarPreviewHideTimer = null
  }
}

// 生命周期钩子
onMounted(() => {
 
  loadBankData()
  positionBagPanel()

  // 监听金币更新事件
  window.addEventListener('gold-update', handleGoldUpdateEvent)
})

onUnmounted(() => {
  window.removeEventListener('resize', positionBagPanel)
  // 移除金币更新事件监听器
  window.removeEventListener('gold-update', handleGoldUpdateEvent)
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', stopResize)
  stopEquipmentStatsFollow()
  // 组件卸载时关闭可能残留的物品详情面板
  const hideTooltipEvent = new CustomEvent('hide-item-tooltip')
  window.dispatchEvent(hideTooltipEvent)
})

watch(
  () => showEquipmentStats.value,
  visible => {
    if (!visible) {
      stopEquipmentStatsFollow()
      return
    }
    nextTick(() => {
      updateEquipmentStatsPosition()
      startEquipmentStatsFollow()
    })
  }
)

watch(testItemIdInput, value => {
  const sanitized = String(value || '').replace(/\D+/g, '')
  if (sanitized !== value) {
    testItemIdInput.value = sanitized
  }
})

watch(testItemQuantityInput, value => {
  const sanitized = String(value || '').replace(/\D+/g, '')
  if (!sanitized) {
    if (value !== '') {
      testItemQuantityInput.value = ''
    }
    return
  }

  const numeric = Math.max(1, Math.floor(Number(sanitized)))
  const clamped = Math.min(9999, numeric)
  const normalized = String(clamped)
  if (normalized !== value) {
    testItemQuantityInput.value = normalized
  }
})

/**
   * 处理金币更新事件
   * 同步更新本地 playerGold 和 itemsStore.playerGold，
   * 避免后续 loadBankData 用 itemsStore.playerGold 的旧值覆盖新值
   */
function handleGoldUpdateEvent (event) {
  const gold = event.detail.gold || 0
  playerGold.value = gold
  // ★ 同步 itemsStore，防止 loadBankData 中 itemsStore.playerGold（旧值）覆盖新值
  itemsStore.playerGold = gold
}

// 定位背包面板
const positionBagPanel = () => {
  const anchorButton = document.getElementById(props.anchorButtonId || 'bagButton')
  if (anchorButton && bagPanelRef.value) {
    const buttonRect = anchorButton.getBoundingClientRect()
    const panelHeight = bagPanelRef.value.offsetHeight || panelSize.value.height || 760

    // 计算面板位置：底部在按钮上方50px
    const top = Math.max(10, buttonRect.top - panelHeight - 50)
    const left = Math.max(10, buttonRect.left)

    bagPanelRef.value.style.top = `${top}px`
    bagPanelRef.value.style.left = `${left}px`

   
  }

  // 监听窗口大小变化
  window.addEventListener('resize', positionBagPanel)
}

// 方法
function closeModal () {
  // 关闭背包面板时，同步关闭物品详情面板，避免残留
  const hideTooltipEvent = new CustomEvent('hide-item-tooltip')
  window.dispatchEvent(hideTooltipEvent)

  emit('close')

  // 播放点击音效
  if (props.playClickSound) {
    props.playClickSound()
  }
}

function handleImageError (event) {
  event.target.src = '/pt/item_icon/default_item.png'
}

function organizeBag () {
  if (props.playClickSound) {
    props.playClickSound()
  }
  BagService.organizeBag()
}

function getEquipmentIcon (item) {
  if (!item) {
    return '/pt/UI/back_Slotitem.jpg'
  }

  if (item.icon) {
    return item.icon
  }

  if (item.id) {
    return `/pt/item_icon/${item.id}.png`
  }

  return '/pt/UI/back_Slotitem.jpg'
}

const enhanceBadgeSlots = new Set([
  'weapon', 'shield', 'mask', 'cloak', 'helmet', 'armor', 'gloves', 'boots',
  'earring1', 'earring2', 'ring1', 'ring2', 'necklace'
])

function getEnhanceLevel (item) {
  const level = Number(item?.StrengthenedAttributes?.enhanceLevel ?? item?.enhanceLevel ?? 0)
  return Number.isFinite(level) ? level : 0
}

function shouldShowEnhanceBadge (slotKey, item) {
  if (!enhanceBadgeSlots.has(slotKey)) return false
  const enhanceLevel = getEnhanceLevel(item)
  // 终极首饰：即使 enhanceLevel 为 0 也显示徽章（因为有基础强化属性）
  if (item?.rarity === 'ultimate' && item?.category === 'jewelry') {
    return true
  }
  // 其他装备：需要 enhanceLevel > 0
  return enhanceLevel > 0
}

/**
 * 加载仓库金币数据
 * 优先从 gameStore.player 缓存读取，避免每次打开背包都调用 API 导致超时
 * gameStore.player 在 initGame 时已从后端加载并缓存
 */
function loadBankData () {
  const player = gameStore.player
  if (player) {
    bankGold.value = player.bankGold || 0
    // 优先从 itemsStore 获取金币，因为 itemsStore 是实时更新的
    playerGold.value = itemsStore.playerGold || player.gold || 0
  }
}

function onPlayerDataUpdated (payload) {
 
  loadBankData()
  // 同时刷新背包组件的数据
  if (bagComponent.value && typeof bagComponent.value.loadBagItems === 'function') {
    bagComponent.value.loadBagItems()
  }

  // 将事件向上传递给父组件（Main.vue）
  emit('player-data-updated', payload)
}

function addTestItemToBag () {
  const itemId = Number(testItemIdInput.value)
  if (!Number.isSafeInteger(itemId) || itemId <= 0) {
    return
  }

  const resolvedQuantity = Number(testItemQuantityInput.value)
  const normalizedQuantity = Math.min(9999, Math.max(1, Math.floor(Number.isFinite(resolvedQuantity) ? resolvedQuantity : 1)))

  const itemConfig = itemsStore.getItemConfig(itemId)
  if (!itemConfig) {
    if (props.addBattleLog) {
      props.addBattleLog(`未找到物品ID: ${itemId}`)
    }
    return
  }

  const bagService = new BagService()
  const success = bagService.addItemToBag(itemId, null, normalizedQuantity)
  if (!success) {
    if (props.addBattleLog) {
      props.addBattleLog(`添加物品失败: ${itemId}`)
    }
    return
  }

  // 为时空毁灭者掉落的稀有装备添加属性抗性
  // 查找刚添加的物品
  const playerBag = itemsStore.playerBag
  for (let i = playerBag.length - 1; i >= 0; i -= 1) {
    const item = playerBag[i]
    if (item && item.id === itemId) {
      // 调用 DropService 的添加属性抗性方法
      DropService.addElementalResistances(item)
      break
    }
  }

  if (bagComponent.value && typeof bagComponent.value.loadBagItems === 'function') {
    bagComponent.value.loadBagItems()
  }

  if (props.addBattleLog) {
    const name = typeof itemConfig.name === 'string' ? itemConfig.name : itemConfig.name?.cns
    props.addBattleLog(`测试添加物品: ${name || `#${itemId}`} x${normalizedQuantity}`)
  }
}

function handleEquipmentSlotClick (slotKey) {
  const currentEquipment = equipment.value?.[slotKey]
  if (!currentEquipment) {
    return
  }

  const success = BagService.unequipFromEquipment(slotKey)
  if (!success) {
    return
  }

  const itemName = currentEquipment.name?.cns || currentEquipment.name || '物品'
  if (props.addBattleLog) {
    props.addBattleLog(`卸下 ${itemName}`, 'equip')
  }

  if (props.gameInitializer?.services?.audio) {
    props.gameInitializer.services.audio.playSFX('InfInventoryDrop.wav')
  } else if (typeof window !== 'undefined' && window.playUnequipSFX) {
    window.playUnequipSFX()
  }

  onPlayerDataUpdated({ source: 'store' })
}

function startResize (event, handle) {
  if (!bagPanelRef.value) {
    return
  }

  isResizing.value = true
  const rect = bagPanelRef.value.getBoundingClientRect()
  resizeStart.value = {
    x: event.clientX,
    y: event.clientY,
    left: rect.left,
    top: rect.top,
    width: bagPanelRef.value.offsetWidth || panelSize.value.width,
    height: bagPanelRef.value.offsetHeight || panelSize.value.height,
    handle: handle || 'bottom-right'
  }

  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', stopResize)

  event.preventDefault()
  event.stopPropagation()
}

function handleResizeMove (event) {
  if (!isResizing.value) {
    return
  }

  const dx = event.clientX - resizeStart.value.x
  const dy = event.clientY - resizeStart.value.y
  const ratio = resizeStart.value.width / (resizeStart.value.height || 1)

  let nextWidth = resizeStart.value.width
  let nextHeight = resizeStart.value.height
  let nextLeft = resizeStart.value.left
  let nextTop = resizeStart.value.top

  const handle = resizeStart.value.handle
  const isCorner =
    handle === 'top-left' ||
    handle === 'top-right' ||
    handle === 'bottom-left' ||
    handle === 'bottom-right'

  if (handle === 'right') {
    nextWidth = resizeStart.value.width + dx
  } else if (handle === 'left') {
    nextWidth = resizeStart.value.width - dx
    nextLeft = resizeStart.value.left + dx
  } else if (handle === 'bottom') {
    nextHeight = resizeStart.value.height + dy
  } else if (handle === 'top') {
    nextHeight = resizeStart.value.height - dy
    nextTop = resizeStart.value.top + dy
  } else {
    const signX = handle.includes('left') ? -1 : 1
    const signY = handle.includes('top') ? -1 : 1

    const proposedWidth = resizeStart.value.width + signX * dx
    const proposedHeight = resizeStart.value.height + signY * dy

    const widthFromDx = proposedWidth
    const heightFromDx = widthFromDx / ratio

    const heightFromDy = proposedHeight
    const widthFromDy = heightFromDy * ratio

    const errorDx = Math.abs(heightFromDx - proposedHeight)
    const errorDy = Math.abs(widthFromDy - proposedWidth)

    if (errorDx <= errorDy) {
      nextWidth = widthFromDx
      nextHeight = heightFromDx
    } else {
      nextWidth = widthFromDy
      nextHeight = heightFromDy
    }

    if (handle.includes('left')) {
      nextLeft = resizeStart.value.left + (resizeStart.value.width - nextWidth)
    }
    if (handle.includes('top')) {
      nextTop = resizeStart.value.top + (resizeStart.value.height - nextHeight)
    }
  }

  const minWidth = 400
  const minHeight = 640

  const maxWidth = Math.max(minWidth, window.innerWidth - 20)
  const maxHeight = Math.max(minHeight, window.innerHeight - 20)

  const lockRatio = isCorner

  if (!lockRatio) {
    nextWidth = Math.min(maxWidth, Math.max(minWidth, nextWidth))
    nextHeight = Math.min(maxHeight, Math.max(minHeight, nextHeight))
  } else {
    const minHeightByRatio = minWidth / ratio
    const minWidthByRatio = minHeight * ratio

    const ratioMinWidth = Math.max(minWidth, minWidthByRatio)
    const ratioMinHeight = Math.max(minHeight, minHeightByRatio)

    if (nextWidth < ratioMinWidth) {
      nextWidth = ratioMinWidth
      nextHeight = nextWidth / ratio
    }
    if (nextHeight < ratioMinHeight) {
      nextHeight = ratioMinHeight
      nextWidth = nextHeight * ratio
    }

    if (nextWidth > maxWidth) {
      nextWidth = maxWidth
      nextHeight = nextWidth / ratio
    }
    if (nextHeight > maxHeight) {
      nextHeight = maxHeight
      nextWidth = nextHeight * ratio
    }
  }

  if (handle === 'left' || handle.includes('left')) {
    nextLeft = resizeStart.value.left + (resizeStart.value.width - nextWidth)
  } else {
    nextLeft = resizeStart.value.left
  }

  if (handle === 'top' || handle.includes('top')) {
    nextTop = resizeStart.value.top + (resizeStart.value.height - nextHeight)
  } else {
    nextTop = resizeStart.value.top
  }

  panelSize.value = {
    width: Math.round(nextWidth),
    height: Math.round(nextHeight)
  }

  bagPanelRef.value.style.left = `${Math.round(nextLeft)}px`
  bagPanelRef.value.style.top = `${Math.round(nextTop)}px`
  clampPanelToViewport()
}

function stopResize () {
  if (!isResizing.value) {
    return
  }
  isResizing.value = false
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', stopResize)
}

function clampPanelToViewport () {
  if (!bagPanelRef.value) {
    return
  }

  const rect = bagPanelRef.value.getBoundingClientRect()
  const padding = 10

  const maxLeft = Math.max(padding, window.innerWidth - rect.width - padding)
  const maxTop = Math.max(padding, window.innerHeight - rect.height - padding)

  let left = rect.left
  let top = rect.top

  if (left < padding) {
    left = padding
  }
  if (top < padding) {
    top = padding
  }
  if (left > maxLeft) {
    left = maxLeft
  }
  if (top > maxTop) {
    top = maxTop
  }

  bagPanelRef.value.style.left = `${left}px`
  bagPanelRef.value.style.top = `${top}px`
}

function showItemTooltip (event, item) {
  if (!item) {
    return
  }

  const tooltipEvent = new CustomEvent('show-item-tooltip', {
    detail: {
      item,
      position: { x: event.clientX, y: event.clientY },
      source: 'equipment-slot'
    }
  })
  window.dispatchEvent(tooltipEvent)
}

function hideItemTooltip () {
  const tooltipEvent = new CustomEvent('hide-item-tooltip')
  window.dispatchEvent(tooltipEvent)
}

function updateTooltipPosition (event) {
  const tooltipEvent = new CustomEvent('move-item-tooltip', {
    detail: {
      position: { x: event.clientX, y: event.clientY }
    }
  })
  window.dispatchEvent(tooltipEvent)
}

// 生命周期钩子
onMounted(() => {
  loadBankData()
})

// 暴露方法供父组件调用
defineExpose({
  refresh: () => {
    if (bagComponent.value) {
      bagComponent.value.loadBagItems()
    }
    loadBankData()
  }
})
</script>

<style scoped>
.bag-panel {
  --ui-scale: 1;
  --equipment-box: 320px;
  --equipment-padding: 0px;
  --equipment-gap: 5px;
  --equipment-row-gap: 5px;
  --equipment-slot: 40px;
  --equipment-icon: 40px;
  --equipment-avatar: 150px;
  --bag-slot-size: 35px;
  --bag-gap: 10px;
  position: fixed;
  top: 10%;
  left: 10%;
  min-width: 400px;
  min-height: 640px;
  background: var(--theme-modal-bg);
  border: 1px solid var(--theme-border-strong);
  border-radius: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1050;
  cursor: move;
  color: var(--theme-text);
}

.bag-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.15);
  pointer-events: none;
  border-radius: 8px;
}

.bag-panel::after {
  content: '';
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  bottom: 12px;
  border: 1px solid var(--theme-border);
  border-radius: 6px;
  pointer-events: none;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--theme-border-strong);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  border-radius: 0;
}


.panel-header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--theme-border);
  border-radius: 0;
}

.panel-title {
  margin: 0;
  color: var(--theme-accent);
  font-size: 16px;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  letter-spacing: 0.5px;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  padding: 0;
}

.panel-title-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding-left: 50px;
}

.stats-toggle-btn {
  background: transparent;
  border: 1px solid var(--theme-border);
  color: var(--theme-accent);
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  height: 28px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s ease, border-color 0.2s ease;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.stats-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--theme-accent);
}

.stats-toggle-btn:active {
  background: rgba(255, 255, 255, 0.04);
}

.gold-icon {
  width: 28px;
  height: 28px;
  margin-right: 12px;
}

.gold-display {
  display: flex;
  align-items: center;
  font-weight: 900;
}

.btn-close {
  background: transparent;
  border: 1px solid var(--theme-border);
  color: var(--theme-muted);
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s ease, border-color 0.2s ease;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--theme-accent);
  border-color: var(--theme-accent);
}

.btn-close:active {
  background: rgba(255, 255, 255, 0.04);
}

.panel-content {
  flex: 1;
  overflow: hidden;
  box-shadow: none;
  position: relative;
  display: flex;
  flex-direction: row;
}

.inventory-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.inventory-right {
  width: calc(210px * var(--ui-scale));
  border-left: 1px solid var(--theme-border-strong);
  background: var(--theme-panel-bg);
  padding: calc(14px * var(--ui-scale)) calc(12px * var(--ui-scale));
  overflow-y: auto;
}

.equipment-stats-enter-active,
.equipment-stats-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
  transform-origin: top right;
}

.equipment-stats-enter-from,
.equipment-stats-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.equipment-stats-overview {
  background: var(--theme-surface-muted);
  border: 1px solid var(--theme-border);
  border-radius: 10px;
  padding: calc(12px * var(--ui-scale));
  box-shadow: none;
}

.stats-title {
  text-align: center;
  font-weight: bold;
  color: var(--theme-accent);
  margin-bottom: calc(12px * var(--ui-scale));
  letter-spacing: 1px;
  font-family: inherit;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  flex-direction: column;
  padding: 10px;
  font-size: 13px;
}

.stats-section {
  background: var(--theme-surface-muted);
  border: 1px solid var(--theme-border);
  border-radius: 8px;
  padding:  10px ;
  display: flex;
  flex-direction: column;
  gap: calc(6px * var(--ui-scale));
}

.stats-section-title {
  text-align: center;
  font-weight: bold;
  color: var(--theme-accent);
  font-size: calc(13px * var(--ui-scale));
  padding-bottom: calc(6px * var(--ui-scale));
  border-bottom: 1px solid var(--theme-border);
}

.stats-section-body {
  display: flex;
  flex-direction: column;
  gap: calc(6px * var(--ui-scale));
  padding: 0px;
}

.stat-line {
  font-size: calc(12px * var(--ui-scale));
  font-weight: 600;
  color: var(--theme-accent);
  text-align: left;
}

.stat-group {
  display: flex;
  flex-direction: column;
  gap: calc(4px * var(--ui-scale));
}

.stat-group-title {
  font-size: calc(11px * var(--ui-scale));
  font-weight: bold;
  color: var(--theme-muted);
  text-align: left;
}

.stat-item {
  background: var(--theme-surface-muted);
  border: 1px solid var(--theme-border);
  border-radius: 8px;
  padding: calc(10px * var(--ui-scale));
  text-align: center;
}

.stat-label {
  font-size: calc(13px * var(--ui-scale));
  color: var(--theme-muted);
  font-weight: bold;
  margin-bottom: calc(6px * var(--ui-scale));
}

.stat-value {
  font-size: calc(16px * var(--ui-scale));
  font-weight: bold;
  color: var(--theme-accent);
}

.stat-value-lines {
  display: flex;
  flex-direction: column;
  gap: calc(4px * var(--ui-scale));
}

.stat-sub-value {
  font-size: calc(12px * var(--ui-scale));
  font-weight: 600;
  color: var(--theme-accent);
}

.awakening-stat {
  color: var(--theme-accent);
}

.panel-content::-webkit-scrollbar {
  width: 14px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--theme-border);
  border-radius: 4px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: var(--theme-border-strong);
}

.equipment-section {
  padding: var(--equipment-padding);
  width: var(--equipment-box);
  height: var(--equipment-box);
  margin: 0 auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.equipment-top-row {
  display: flex;
  justify-content: space-evenly;
  gap: var(--equipment-gap);
  margin-bottom: var(--equipment-row-gap);
}

.equipment-middle-row {
  display: grid;
  grid-template-columns: 1fr var(--equipment-avatar) 1fr;
  gap: var(--equipment-gap);
  align-items: start;
}

.equipment-bottom-row {
  display: flex;
  justify-content: space-around;
  gap: var(--equipment-gap);
  margin-top: var(--equipment-row-gap);
}

.equipment-side-column {
  display: flex;
  flex-direction: column;
  gap: var(--equipment-gap);
  align-items: center;
}

.equipment-player-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.equipment-player-avatar {
  width: var(--equipment-avatar);
  height: var(--equipment-avatar);
  border-radius: 8px;
  border: 1px solid var(--theme-border-strong);
  background: rgba(0, 0, 0, 0.4);
}

.equipment-slot-wrapper {
  position: relative;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.equipment-slot-wrapper:hover {
  transform: scale(1.05);
}

.equipment-slot {
  position: relative;
  width: var(--equipment-slot);
  height: var(--equipment-slot);
  border: 1px solid var(--theme-border);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.equipment-slot-badge {
  position: absolute;
  top: -5px;
  right: -10px;
  padding: 0 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: var(--theme-accent);
  font-size: 11px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 4;
}

.equipment-icon {
  width: var(--equipment-icon);
  height: var(--equipment-icon);
  image-rendering: pixelated;
  position: relative;
  z-index: 2;
  -webkit-user-drag: none;
  user-select: none;
}

.bag-section {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px 0;
  min-height: 0;
}

.bag-section::-webkit-scrollbar {
  width: 10px;
}

.bag-section::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.bag-section::-webkit-scrollbar-thumb {
  background: var(--theme-border);
  border-radius: 4px;
}

.bag-section::-webkit-scrollbar-thumb:hover {
  background: var(--theme-border-strong);
}

.bag-section {
  scrollbar-color: var(--theme-border) rgba(0, 0, 0, 0.2);
}

/* 底部样式 */
.panel-footer {
  padding: 16px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  position: relative;
  border-top: 1px solid var(--theme-border);
  border-radius: 0 0 8px 8px;
}

.footer-gold {
  color: var(--theme-text);
  font-size: 15px;
  font-weight: bold;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 180px;
}

.bag-organize-btn {
  height: 30px;
  padding: 0 12px;
  margin-left: 100px;
  border-radius: 4px;
  border: 1px solid var(--theme-border);
  background: transparent;
  color: var(--theme-text);
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  user-select: none;
}

.bag-organize-btn:hover:enabled {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--theme-accent);
  color: var(--theme-accent);
}

.bag-organize-btn:active:enabled {
  background: rgba(255, 255, 255, 0.04);
}

.bag-organize-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.footer-gold-value {
  font-size: 18px;
  letter-spacing: 0.5px;
}

.footer-test-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: flex-end;
  min-width: 220px;
}

.test-item-id-input {
  width: 140px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--theme-border);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.4);
  color: var(--theme-text);
  font-size: 13px;
  font-weight: bold;
  outline: none;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.test-item-id-input::placeholder {
  color: var(--theme-muted);
  opacity: 0.5;
}

.test-item-quantity-input {
  width: 90px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--theme-border);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.4);
  color: var(--theme-text);
  font-size: 13px;
  font-weight: bold;
  outline: none;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.test-item-quantity-input::placeholder {
  color: var(--theme-muted);
  opacity: 0.5;
}

.test-item-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 4px;
  border: 1px solid var(--theme-border);
  background: transparent;
  color: var(--theme-text);
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  user-select: none;
}

.test-item-btn:hover:enabled {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--theme-accent);
  color: var(--theme-accent);
}

.test-item-btn:active:enabled {
  background: rgba(255, 255, 255, 0.04);
}

.test-item-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.resize-handle {
  position: absolute;
  z-index: 1060;
  background: transparent;
}

.resize-handle-right {
  top: 10px;
  right: 0;
  width: 10px;
  height: calc(100% - 20px);
  cursor: ew-resize;
}

.resize-handle-bottom {
  left: 10px;
  bottom: 0;
  height: 10px;
  width: calc(100% - 20px);
  cursor: ns-resize;
}

.resize-handle-left {
  top: 10px;
  left: 0;
  width: 10px;
  height: calc(100% - 20px);
  cursor: ew-resize;
}

.resize-handle-top {
  left: 10px;
  top: 0;
  height: 10px;
  width: calc(100% - 20px);
  cursor: ns-resize;
}

.resize-handle-corner {
  width: 18px;
  height: 18px;
}

.resize-handle-top-left {
  left: 0;
  top: 0;
  cursor: nwse-resize;
}

.resize-handle-top-right {
  right: 0;
  top: 0;
  cursor: nesw-resize;
}

.resize-handle-bottom-left {
  left: 0;
  bottom: 0;
  cursor: nesw-resize;
}

.resize-handle-bottom-right {
  right: 0;
  bottom: 0;
  cursor: nwse-resize;
}

/* 玩家头像大图预览样式 - 使用全局样式 */
</style>

<!-- 全局样式：玩家头像大图预览 -->
<style>
.player-avatar-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  z-index: 9999;
  cursor: pointer;
}

.player-avatar-preview-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
  transition: transform 0.3s ease;
}

.player-avatar-preview-image:hover {
  transform: scale(1.02);
}

/* 大图预览淡入淡出动画 */
.avatar-preview-fade-enter-active,
.avatar-preview-fade-leave-active {
  transition: opacity 0.3s ease;
}

.avatar-preview-fade-enter-active .player-avatar-preview-image,
.avatar-preview-fade-leave-active .player-avatar-preview-image {
  transition: transform 0.3s ease;
}

.avatar-preview-fade-enter-from,
.avatar-preview-fade-leave-to {
  opacity: 0;
}

.avatar-preview-fade-enter-from .player-avatar-preview-image {
  transform: scale(0.8);
}

.avatar-preview-fade-leave-to .player-avatar-preview-image {
  transform: scale(0.9);
}
</style>
