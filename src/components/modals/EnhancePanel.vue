<!--
  @fileoverview 装备强化面板组件
  @description 提供装备精炼和属性精炼功能，支持面板拖拽和拉伸
  @author FLYFF Team
  @version 2.0.0
  @created 2026-03-10
  @updated 2026-04-04 - 重构样式参考珠宝大师，添加可拉伸功能
-->
<template>
  <div>
    <Transition name="enhance-panel-fade" appear>
      <div
        v-if="isVisible"
        ref="panelRef"
        class="enhance-panel"
        :style="panelStyle"
      >
        <!-- 头部（可拖拽） -->
        <div class="enhance-header" @pointerdown="startDrag">
          <div class="enhance-title-wrapper">
            <img src="/pt/UI/武器或装备.png" class="enhance-panel-icon" alt="强化" />
            <h2 class="enhance-panel-title">{{ panelTitle }}</h2>
          </div>
          <div class="enhance-header-actions">
            <button
              class="enhance-help-btn"
              :class="{ active: showProbabilityReference }"
              type="button"
              @click.stop="toggleProbabilityReference"
              title="显示/隐藏强化概率"
            >?</button>
            <button class="enhance-close-btn" @click.stop="close">&times;</button>
          </div>
        </div>

        <!-- 主体内容 -->
        <div class="enhance-body-wrapper">
          <!-- 左侧功能菜单 -->
          <div v-if="showModeMenu" class="enhance-sidebar" @mousedown.stop @pointerdown.stop>
            <div class="enhance-dialog">
              <p class="enhance-dialog-text">{{ instructionText }}</p>
            </div>
            <div class="enhance-menu-title">精炼类型</div>
            <button
              class="enhance-menu-item"
              :class="{ active: refineMode === 'enhance' }"
              type="button"
              @click.stop="switchRefineMode('enhance')"
            >
              精炼
            </button>
            <button
              class="enhance-menu-item"
              :class="{ active: refineMode === 'attribute' }"
              type="button"
              @click.stop="switchRefineMode('attribute')"
            >
              属性精炼
            </button>
          </div>

          <!-- 右侧内容区域 -->
          <div class="enhance-content">
            <div class="enhance-main">
              <div class="enhance-instructions">
                <p>{{ instructionText }}</p>
              </div>

              <div class="enhance-slots">
                <div class="slot-container">
                  <h3>装备</h3>
                  <div class="slot equipment-slot" @click="showEquipmentSelector">
                    <img
                      v-if="selectedEquipment"
                      :src="getItemIcon(selectedEquipment)"
                      :alt="getItemName(selectedEquipment)"
                      class="slot-icon"
                      @mouseenter="showItemTooltip($event, selectedEquipment)"
                      @mouseleave="hideItemTooltip"
                      @mousemove="updateTooltipPosition"
                    />
                    <img v-else src="/pt/UI/武器或装备.png" alt="默认装备" class="slot-placeholder" />
                    <div
                      v-if="selectedEquipment && displayEnhanceLevel > 0"
                      class="slot-badge"
                    >
                      +{{ displayEnhanceLevel }}
                    </div>
                    <div v-if="selectedEquipment" class="slot-name">{{ getItemName(selectedEquipment) }}</div>
                  </div>
                  <div v-if="displayEnhanceLevel > 0" class="equipment-info">
                    <div>
                      {{ enhanceLevelLabel }}: +{{ displayEnhanceLevel }}
                    </div>
                    <div v-if="!isAttributeRefine && selectedEquipmentEnhanceAbilities.length" class="equipment-enhance-abilities">
                      <div class="equipment-enhance-title">强化加成:</div>
                      <div
                        v-for="(ability, index) in selectedEquipmentEnhanceAbilities"
                        :key="`enhance-ability-${index}`"
                        class="equipment-enhance-ability"
                      >
                        {{ ability }}
                      </div>
                    </div>
                    <!-- 衣服属性精炼：当前抗性加成 -->
                    <div v-if="suitResistancePreview.length" class="equipment-enhance-abilities">
                      <div class="equipment-enhance-title">当前抗性加成:</div>
                      <div
                        v-for="(line, index) in suitResistancePreview"
                        :key="`resist-current-${index}`"
                        class="equipment-enhance-ability"
                        :class="{ 'resist-negative': line.includes('-') }"
                      >
                        {{ line }}
                      </div>
                    </div>
                    <!-- 衣服属性精炼：下一级抗性预览 -->
                    <div v-if="suitResistancePreviewNext.length" class="equipment-enhance-abilities">
                      <div class="equipment-enhance-title">下一级抗性预览:</div>
                      <div
                        v-for="(line, index) in suitResistancePreviewNext"
                        :key="`resist-next-${index}`"
                        class="equipment-enhance-ability"
                        :class="{ 'resist-negative': line.includes('-') }"
                      >
                        {{ line }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="slot-container">
                  <h3>{{ materialSlotTitle }}</h3>
                  <div class="slot material-slot" @click="showMaterialSelector">
                    <img
                      v-if="selectedMaterial"
                      :src="getItemIcon(selectedMaterial)"
                      :alt="getItemName(selectedMaterial)"
                      class="slot-icon"
                      @mouseenter="showItemTooltip($event, selectedMaterial)"
                      @mouseleave="hideItemTooltip"
                      @mousemove="updateTooltipPosition"
                    />
                    <img v-else src="/pt/UI/穿孔道具.png" alt="默认材料" class="slot-placeholder" />
                    <div
                      v-if="selectedMaterial && selectedMaterialStack > 0"
                      class="slot-badge"
                    >
                      {{ selectedMaterialStack }}
                    </div>
                    <div v-if="selectedMaterial" class="slot-name">{{ getItemName(selectedMaterial) }}</div>
                  </div>
                </div>

              <div class="slot-container">
                <h3>防护卷轴</h3>
                <div class="slot scroll-slot" @click="showScrollSelector">
                  <img
                    v-if="selectedScroll"
                    :src="getItemIcon(selectedScroll)"
                    :alt="getItemName(selectedScroll)"
                    class="slot-icon"
                    @mouseenter="showItemTooltip($event, selectedScroll)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition"
                  />
                  <img v-else src="/pt/UI/baohujuan.png" alt="默认防护卷轴" class="slot-placeholder" />
                  <div
                    v-if="selectedScroll && selectedScrollStack > 0"
                    class="slot-badge"
                  >
                    {{ selectedScrollStack }}
                  </div>
                  <div v-if="selectedScroll" class="slot-name">{{ getItemName(selectedScroll) }}</div>
                </div>
              </div>
            </div>

            <div class="enhance-probability">
              <h3>强化成功率 / 破损率</h3>
              <div class="probability-row">
                <div class="probability-bar">
                  <div class="probability-fill" :style="{ width: successProbability + '%' }"></div>
                  <div class="probability-text">
                    <span>成功 {{ successProbability }}%</span>
                    <span>破损 {{ breakProbability }}%</span>
                    <ProbabilityBoostAnimation
                      v-if="!isUltimateEnhanceTarget"
                      :value="lastBoostIncrease"
                      :trigger-key="boostAnimationKey"
                    />
                  </div>
                </div>
              </div>
              <div v-if="isUltimateEnhanceTarget" class="ultimate-enhance-chances">
                <div class="ultimate-chance-title">终极武器强化等级变动</div>
                <div class="ultimate-chance-group">
                  <div class="ultimate-chance-label">成功提升</div>
                  <div class="ultimate-chance-values">
                    <span v-for="item in ultimateSuccessLevelChances" :key="`ultimate-success-${item.level}`">
                      +{{ item.level }} {{ item.chance }}%
                    </span>
                  </div>
                </div>
                <div class="ultimate-chance-group">
                  <div class="ultimate-chance-label">失败降低</div>
                  <div class="ultimate-chance-values">
                    <span v-for="item in ultimateFailLevelChances" :key="`ultimate-fail-${item.level}`">
                      <template v-if="item.level === 0">不降级</template>
                      <template v-else>-{{ item.level }} {{ item.chance }}%</template>
                    </span>
                  </div>
                </div>
                <div v-if="isUltimateWeaponProtected" class="ultimate-protection-hint">
                  ⛨ 终极防护卷轴生效中（+5及以上失败不降级、不破损）
                </div>
              </div>
            </div>
            <div class="enhance-progress">
              <div class="progress-row">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: enhanceProgress + '%' }"></div>
                  <div class="progress-text">{{ enhanceProgressText }}%</div>
                </div>
                <EnhancementAnimation v-if="enhanceInProgress" />
              </div>
            </div>

              <div class="enhance-actions">
                <div v-if="enhanceCost > 0" class="enhance-cost">本次强化费用: {{ enhanceCost }} Penya</div>
                <div class="auto-enhance-controls">
                  <select
                    v-model.number="targetEnhanceLevel"
                    class="auto-enhance-select"
                    :disabled="enhanceMaxLevel === 0"
                  >
                    <option v-if="enhanceMaxLevel === 0" :value="0" disabled>请选择目标等级</option>
                    <option v-for="level in targetEnhanceOptions" :key="`target-${level}`" :value="level">
                      +{{ level }}
                    </option>
                  </select>
                  <button
                    class="auto-enhance-button"
                    type="button"
                    :disabled="autoEnhanceActive ? false : !canAutoEnhance"
                    @click="toggleAutoEnhance"
                  >
                    {{ autoEnhanceActive ? '停止自动强化' : '自动强化' }}
                  </button>
                </div>
                <button class="enhance-button" :disabled="!canEnhance" @click="performEnhance">
                  强化
                </button>
                <button class="reset-button" type="button" @click="resetSelections">
                  重置
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 拉伸手柄 -->
        <PanelResizeHandle @pointerdown="startResize" />
      </div>
    </Transition>

    <div
      v-if="isVisible && showProbabilityReference"
      class="enhance-probability-reference"
      :style="referenceStyle"
      @click.stop
    >
      <div v-if="probabilityReferenceRows.length" class="probability-table">
        <div class="probability-table-title">{{ probabilityReferenceTitle }}</div>
        <div class="probability-table-rows">
          <div
            v-for="row in probabilityReferenceRows"
            :key="`probability-${row.level}`"
            class="probability-table-row"
          >
            <div class="probability-table-level">+{{ row.level }}</div>
            <div class="probability-table-value">{{ row.probability }}%</div>
            <div class="probability-table-cost">{{ row.cost }}</div>
          </div>
        </div>
      </div>
      <div v-else class="probability-empty-hint">请选择装备后查看详细强化概率。</div>
    </div>
    <EnhanceResultAnimation
      v-if="isVisible"
      :result="enhanceResultType"
      :trigger-key="enhanceResultKey"
      :center-x="panelPosition.x + 300"
      :center-y="panelPosition.y + 250"
    />

    <!-- 装备选择面板 -->
    <div
      v-if="isVisible && showEquipmentSelectorPanel"
      class="equipment-selector-overlay"
      @click="hideEquipmentSelector"
    >
      <div
        class="equipment-selector-panel"
        :style="{ left: equipmentSelectorPosition.x + 'px', top: equipmentSelectorPosition.y + 'px' }"
        @click.stop
      >
        <div class="equipment-selector-header draggable-header" @mousedown="startEquipmentSelectorDrag">
          <h3>选择装备</h3>
          <button class="close-button" @click="hideEquipmentSelector">&times;</button>
        </div>
        <div class="equipment-selector-content">
          <div v-if="availableEquipments.length === 0" class="no-equipment">没有可以精炼的道具</div>
          <div v-else class="equipment-list">
            <div
              v-for="entry in availableEquipments"
              :key="entry.key"
              class="equipment-item"
              @mouseenter="showItemTooltip($event, entry.item)"
              @mouseleave="hideItemTooltip"
              @mousemove="updateTooltipPosition"
              @click="selectEquipment(entry)"
            >
              <img
                :src="getItemIcon(entry.item)"
                :alt="getItemName(entry.item)"
                class="equipment-item-icon"
              />
              <div class="equipment-item-info">
                <div class="equipment-item-name">{{ getItemName(entry.item) }}</div>
                <div class="equipment-item-level">Lv.{{ entry.item.level }}</div>
                <div
                  v-if="(entry.item.StrengthenedAttributes?.enhanceLevel ?? entry.item.enhanceLevel) > 0"
                  class="equipment-item-enhance"
                >
                  +{{ entry.item.StrengthenedAttributes?.enhanceLevel ?? entry.item.enhanceLevel }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 精炼材料选择面板 -->
    <div
      v-if="isVisible && showMaterialSelectorPanel"
      class="equipment-selector-overlay"
      @click="hideMaterialSelector"
    >
      <div
        class="equipment-selector-panel"
        :style="{ left: materialSelectorPosition.x + 'px', top: materialSelectorPosition.y + 'px' }"
        @click.stop
      >
        <div class="equipment-selector-header draggable-header" @mousedown="startMaterialSelectorDrag">
          <h3>{{ materialSelectorTitle }}</h3>
          <button class="close-button" @click="hideMaterialSelector">&times;</button>
        </div>
        <div class="equipment-selector-content">
          <div v-if="availableMaterials.length === 0" class="no-equipment">{{ materialEmptyText }}</div>
          <div v-else class="equipment-list">
            <div
              v-for="entry in availableMaterials"
              :key="entry.key"
              class="equipment-item"
              @mouseenter="showItemTooltip($event, entry.item)"
              @mouseleave="hideItemTooltip"
              @mousemove="updateTooltipPosition"
              @click="selectMaterial(entry)"
            >
              <img
                :src="getItemIcon(entry.item)"
                :alt="getItemName(entry.item)"
                class="equipment-item-icon"
              />
              <div class="equipment-item-info">
                <div class="equipment-item-name">{{ getItemName(entry.item) }}</div>
                <div class="material-item-quantity">x{{ entry.quantity }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isVisible && showScrollSelectorPanel"
      class="equipment-selector-overlay"
      @click="hideScrollSelector"
    >
      <div
        class="equipment-selector-panel"
        :style="{ left: scrollSelectorPosition.x + 'px', top: scrollSelectorPosition.y + 'px' }"
        @click.stop
      >
        <div class="equipment-selector-header draggable-header" @mousedown="startScrollSelectorDrag">
          <h3>防护卷轴选择</h3>
          <button class="close-button" @click="hideScrollSelector">&times;</button>
        </div>
        <div class="equipment-selector-content">
          <div v-if="availableScrolls.length === 0" class="no-equipment">{{ scrollEmptyText }}</div>
          <div v-else class="equipment-list">
            <div
              v-for="entry in availableScrolls"
              :key="entry.key"
              class="equipment-item"
              @mouseenter="showItemTooltip($event, entry.item)"
              @mouseleave="hideItemTooltip"
              @mousemove="updateTooltipPosition"
              @click="selectScroll(entry)"
            >
              <img
                :src="getItemIcon(entry.item)"
                :alt="getItemName(entry.item)"
                class="equipment-item-icon"
              />
              <div class="equipment-item-info">
                <div class="equipment-item-name">{{ getItemName(entry.item) }}</div>
                <div class="material-item-quantity">x{{ entry.quantity }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isVisible && showMissingScrollConfirm" class="confirm-dialog confirm-dialog-bottom" @click.stop>
      <div class="confirm-content" @click.stop>
        <p>防护卷轴缺失,确认继续强化?</p>
        <div class="confirm-buttons">
          <button @click="confirmProceedWithoutScroll">确认</button>
          <button @click="cancelProceedWithoutScroll">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useItemsStore } from '@/store/items'
import { getItemIcon, getItemName } from '@/utils/itemUtils'
import { calculateSuitElementalResistances, formatElementalResistances } from '@/utils/elementalResistanceCalculator'
import ProbabilityBoostAnimation from '@/components/ProbabilityBoostAnimation.vue'
import EnhancementAnimation from '@/components/EnhancementAnimation.vue'
import EnhanceResultAnimation from '@/components/EnhanceResultAnimation.vue'
import PanelResizeHandle from '@/components/common/PanelResizeHandle.vue'

export default {
  name: 'EnhancePanel',
  components: {
    ProbabilityBoostAnimation,
    EnhancementAnimation,
    EnhanceResultAnimation,
    PanelResizeHandle
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    player: {
      type: Object,
      required: true
    },
    addBattleLog: {
      type: Function,
      default: null
    },
    initialMode: {
      type: String,
      default: 'enhance'
    },
    lockedMode: {
      type: String,
      default: null
    }
  },
  emits: ['close', 'enhance-success', 'enhance-failure', 'enhance-apply'],
  setup (props, { emit }) {
  const itemsStore = useItemsStore()

  // 选中的装备和材料
    const selectedEquipment = ref(null)
    const selectedMaterial = ref(null)
    const selectedScroll = ref(null)
    const refineMode = ref(props.initialMode || 'enhance')
    const showModeMenu = computed(() => !props.lockedMode)
    const selectedEquipmentMeta = ref(null)
    const showProbabilityReference = ref(false)
    const enhanceFailCount = ref(0)
    const lastBoostIncrease = ref(0)
    const boostAnimationKey = ref(0)
    const enhanceCooldownActive = ref(false)
    let enhanceCooldownTimer = null
    const enhanceInProgress = ref(false)
    const enhanceProgress = ref(0)
    let enhanceProgressTimer = null
    let enhanceProgressInterval = null
    const enhanceResultType = ref('success')
    const enhanceResultKey = ref(0)
    const showMissingScrollConfirm = ref(false)
    const targetEnhanceLevel = ref(0)
    const autoEnhanceActive = ref(false)
    let autoEnhanceTimer = null

    // 装备选择面板显示状态
    const showEquipmentSelectorPanel = ref(false)
    const showMaterialSelectorPanel = ref(false)
    const showScrollSelectorPanel = ref(false)

    // 选择面板拖拽状态
    const equipmentSelectorPosition = ref({ x: 0, y: 0 })
    const materialSelectorPosition = ref({ x: 0, y: 0 })
    const scrollSelectorPosition = ref({ x: 0, y: 0 })
    const isSelectorDragging = ref(false)
    const selectorDragOffset = ref({ x: 0, y: 0 })
    const currentSelectorDragType = ref(null) // 'equipment' | 'material' | 'scroll'
    let selectorDragHandler = null
    let selectorDragEndHandler = null

    const accessoryProbabilityEquipmentIds = new Set([7178, 6803, 8646, 9233, 5536, 2064, 1764, 6531, 8369])
    const normalProbabilityRarities = new Set(['common', 'uncommon', 'rare', 'veryrare', 'unique'])
    const normalDiceMaterialIds = [6844, 1250, 6672]
    const jewelryDiceMaterialIds = [7867, 9344]
    const ultimateDiceMaterialId = 15403
    const ultimateProtectionScrollId = 14737

    const materialRules = new Map([
      [6844, { minTargetLevel: 1, maxTargetLevel: 5, probabilityMultiplier: 1 }],
      [1250, { minTargetLevel: 6, maxTargetLevel: 10, probabilityMultiplier: 1 }],
      [6672, { minTargetLevel: 1, maxTargetLevel: 10, probabilityMultiplier: 2 }],
      [7867, { probabilityMultiplier: 1 }],
      [9344, { probabilityMultiplier: 2 }],
      [15403, { minTargetLevel: 1, maxTargetLevel: 10, probabilityMultiplier: 1 }]
    ])
    const attributeCardIdsLow = Object.freeze([1371, 7659, 9399, 2781, 7207])
    const attributeCardIdsHigh = Object.freeze([5455, 3687, 5409, 6385, 3830])
    const attributeCardElementMap = Object.freeze({
      1371: 'thunder',
      7659: 'water',
      9399: 'earth',
      2781: 'wind',
      7207: 'fire',
      5455: 'thunder',
      3687: 'fire',
      5409: 'wind',
      6385: 'earth',
      3830: 'water'
    })
    const attributeElementLabels = Object.freeze({
      fire: '火',
      water: '水',
      wind: '风',
      thunder: '雷',
      earth: '土'
    })
    const attributeCardRules = new Map([
      ...attributeCardIdsLow.map(id => [id, { minTargetLevel: 1, maxTargetLevel: 5, probabilityMultiplier: 1 }]),
      ...attributeCardIdsHigh.map(id => [id, { minTargetLevel: 6, maxTargetLevel: 10, probabilityMultiplier: 1 }])
    ])

    const abilityParameterMap = {
      none: '无',
      str: '力量',
      dex: '敏捷',
      int: '智力',
      sta: '体质',
      con: '体力',
      agi: '幸运',
      vit: '体力',
      maxhp: '最大生命',
      maxfp: '最大FP',
      hp: '生命值',
      mp: '魔法值',
      fp: 'FP',
      def: '防御力',
      attack: '攻击力',
      damage: '攻击力',
      defense: '防御力',
      maxmp: '最大魔法值',
      speed: '攻击速度',
      criticalRate: '暴击率',
      criticalDamage: '暴击伤害',
      dodgeRate: '闪避率',
      blockRate: '格挡率',
      criticaldamage: '暴击伤害',
      criticalchance: '暴击率',
      stealhp: '生命偷取',
      skilldamage: '技能伤害',
      allstats: '全属性',
      decreasedcastingtime: '施法速度',
      windmastery: '风元素',
      incomingdamage: '伤害减免',
      skillchance: '技能几率',
      hitrate: '命中率',
      attackspeed: '攻击速度',
      allelementsmastery: '全元素精通',
      healing: '治疗',
      hprestoration: '生命恢复',
      block: '格挡率',
      decreasedmpconsumption: 'MP消耗减少',
      mprecoveryafterkill: '击杀MP恢复',
      magicdefense: '魔法防御',
      pvedamage: 'PVE伤害',
      pvedamagereduction: 'PVE伤害减免',
      decreasedfpconsumption: 'FP消耗减少',
      blockpenetration: '格挡穿透',
      electricitymastery: '雷元素',
      firemastery: '火元素',
      elementattack: '属性攻击',
      yoyoattack: '飞轮攻击',
      bowattack: '弓箭攻击',
      reflectdamage: '反弹伤害',
      fprecoveryautoattack: '攻击FP恢复',
      criticalresist: '暴击抗性',
      parry: '闪避',
      exprate: '经验倍率',
      droprate: '爆率',
      sp: '最大SP',
      magicattack: '魔法攻击力',
      attack_speed: '攻击速度',
      movespeed: '移动速度',
      move_speed: '移动速度',
      hpregeneration: '生命回复',
      hp_regeneration: '生命回复',
      mpregeneration: '魔法回复',
      mp_regeneration: '魔法回复',
      fire_resistance: '火属性抗性',
      waterresist: '水属性抗性',
      water_resistance: '水属性抗性',
      windresist: '风属性抗性',
      wind_resistance: '风属性抗性',
      earthresist: '土属性抗性',
      earth_resistance: '土属性抗性',
      thunderresist: '雷属性抗性',
      thunder_resistance: '雷属性抗性',
      darkresist: '暗属性抗性',
      dark_resistance: '暗属性抗性',
      lightresist: '光属性抗性',
      light_resistance: '光属性抗性',
      damagebonus: '伤害加成',
      damage_bonus: '伤害加成',
      damagereduction: '伤害减免',
      damage_reduction: '伤害减免'
    }

    const formatAbility = ability => {
      if (!ability) {
        return ''
      }
      const parameter = abilityParameterMap[ability.parameter] || ability.parameter
      if (ability.set !== undefined && ability.add === undefined) {
        if (ability.parameter === 'mp' && ability.set === -1) {
          return `${parameter} 持续回满`
        }
        return `${parameter} 设为 ${ability.set}`
      }
      if (ability.add === undefined) {
        return parameter
      }
      const valueDisplay = ability.addMax !== undefined
        ? `${parameter} ${ability.rate ? '+' : ''}${ability.add}(${ability.add}~${ability.addMax})${ability.rate ? '%' : ''}`
        : `${parameter} ${ability.rate ? '+' : ''}${ability.add}${ability.rate ? '%' : ''}`
      return valueDisplay
    }

    const isAttributeRefine = computed(() => refineMode.value === 'attribute')
    const panelTitle = computed(() => (isAttributeRefine.value ? '属性精炼' : '装备强化'))
    const instructionText = computed(() =>
      isAttributeRefine.value
        ? '将装备放入左侧槽位，放入属性卡片到右侧槽位，点击强化按钮进行属性精炼。'
        : '将装备放入左侧槽位，放入强化材料（骰子）到右侧槽位，点击强化按钮进行强化。'
    )
    const materialSlotTitle = computed(() => (isAttributeRefine.value ? '属性卡片' : '强化材料'))
    const materialSelectorTitle = computed(() => (isAttributeRefine.value ? '属性卡片选择' : '精炼材料选择'))
    const enhanceLevelLabel = computed(() => (isAttributeRefine.value ? '当前属性强化等级' : '当前强化等级'))

    const resolveExistingElementKey = equipment => {
      const elemental = equipment?.elementalEnhancement || equipment?.StrengthenedAttributes?.elementalEnhancement
      if (!elemental || typeof elemental !== 'object') {
        return null
      }
      const keys = ['fire', 'water', 'wind', 'thunder', 'earth']
      return keys.find(key => elemental[key]) || null
    }
    const existingAttributeElementKey = computed(() => resolveExistingElementKey(selectedEquipment.value))
    const attributeElementKey = computed(() => {
      if (!isAttributeRefine.value) {
        return null
      }
      const materialId = Number(selectedMaterial.value?.id)
      if (Number.isFinite(materialId) && attributeCardElementMap[materialId]) {
        return attributeCardElementMap[materialId]
      }
      return resolveExistingElementKey(selectedEquipment.value)
    })
    const attributeCurrentLevel = computed(() => {
      if (!isAttributeRefine.value || !selectedEquipment.value) {
        return 0
      }
      const elementKey = attributeElementKey.value
      if (!elementKey) {
        return 0
      }
      const elemental =
        selectedEquipment.value.elementalEnhancement ||
        selectedEquipment.value.StrengthenedAttributes?.elementalEnhancement
      const level = Number(elemental?.[elementKey]?.enhancementLevel ?? 0)
      return Number.isFinite(level) ? level : 0
    })

    const selectedEquipmentLevel = computed(() => {
      if (!selectedEquipment.value) {
        return 0
      }
      const level = Number(
        selectedEquipment.value.StrengthenedAttributes?.enhanceLevel ?? selectedEquipment.value.enhanceLevel ?? 0
      )
      return Number.isFinite(level) ? level : 0
    })

    const displayEnhanceLevel = computed(() => (isAttributeRefine.value ? attributeCurrentLevel.value : selectedEquipmentLevel.value))
    const selectedEquipmentEnhanceAbilities = computed(() => {
      const equipment = selectedEquipment.value
      if (!equipment || equipment.category !== 'jewelry') {
        return []
      }
      const enhanceLevel = Number(selectedEquipmentLevel.value)
      if (!Number.isFinite(enhanceLevel) || enhanceLevel <= 0) {
        return []
      }
      const upgradeLevels = Array.isArray(equipment.upgradeLevels) ? equipment.upgradeLevels : []
      if (upgradeLevels.length === 0) {
        return []
      }
      const matched =
        upgradeLevels.find(level => Number(level?.upgradeLevel) === enhanceLevel) ||
        upgradeLevels[enhanceLevel]
      const abilities = Array.isArray(matched?.abilities) ? matched.abilities : []
      return abilities.map(formatAbility).filter(Boolean)
    })

    /**
     * 衣服属性精炼的元素抗性预览
     * 当选中衣服且选中了属性卡片时，计算当前等级下的抗性加成
     */
    const suitResistancePreview = computed(() => {
      if (!isAttributeRefine.value || !selectedEquipment.value) {
        return []
      }
      const isSuit = selectedEquipment.value.category === 'armor' && selectedEquipment.value.subcategory === 'suit'
      if (!isSuit) {
        return []
      }
      const elementKey = attributeElementKey.value
      if (!elementKey) {
        return []
      }
      const level = attributeCurrentLevel.value
      if (!Number.isFinite(level) || level <= 0) {
        return []
      }
      const resistances = calculateSuitElementalResistances(elementKey, level)
      return formatElementalResistances(resistances)
    })

    /**
     * 衣服属性精炼下一级抗性预览（目标等级）
     */
    const suitResistancePreviewNext = computed(() => {
      if (!isAttributeRefine.value || !selectedEquipment.value) {
        return []
      }
      const isSuit = selectedEquipment.value.category === 'armor' && selectedEquipment.value.subcategory === 'suit'
      if (!isSuit) {
        return []
      }
      const elementKey = attributeElementKey.value
      if (!elementKey) {
        return []
      }
      const level = attributeCurrentLevel.value + 1
      if (!Number.isFinite(level) || level < 1 || level > 10) {
        return []
      }
      const resistances = calculateSuitElementalResistances(elementKey, level)
      return formatElementalResistances(resistances)
    })

    const selectedMaterialStack = computed(() => {
      if (!selectedMaterial.value) {
        return 0
      }
      const stack = Number(selectedMaterial.value.currentStack ?? selectedMaterial.value.quantity ?? 1)
      return Number.isFinite(stack) ? stack : 0
    })
    const selectedScrollStack = computed(() => {
      if (!selectedScroll.value) {
        return 0
      }
      const stack = Number(selectedScroll.value.currentStack ?? selectedScroll.value.quantity ?? 1)
      return Number.isFinite(stack) ? stack : 0
    })
    const isUltimateRarity = computed(() => {
      if (!selectedEquipment.value) {
        return false
      }
      return String(selectedEquipment.value.rarity || '').toLowerCase() === 'ultimate'
    })
    const enhanceMaxLevel = computed(() => {
      if (!selectedEquipment.value || !isEnhanceSupported.value) {
        return 0
      }
      if (isAttributeRefine.value) {
        return 10
      }
      // 终极品质首饰最大强化等级为10
      if (isUltimateJewelryTarget.value) {
        return 10
      }
      if (isAccessoryProbabilityTarget.value) {
        return isUltimateRarity.value ? 5 : 20
      }
      return 10
    })
    const isUltimateEnhanceTarget = computed(() => {
      // 属性精炼模式下，终极武器使用普通武器的属性强化数据，不视为终极强化目标
      if (isAttributeRefine.value) {
        return false
      }
      const equipment = selectedEquipment.value
      if (!equipment) {
        return false
      }
      return isUltimateRarity.value && equipment.category === 'weapon'
    })
    /**
     * 判断终极武器是否受到终极防护卷轴保护（+5及以上使用终极防护卷轴ID14737）
     * 满足条件时强化失败不降级、不破损
     * @returns {boolean} 是否受到保护
     */
    const isUltimateWeaponProtected = computed(() => {
      if (!isUltimateEnhanceTarget.value) {
        return false
      }
      const scrollId = Number(selectedScroll.value?.id)
      const level = Number(displayEnhanceLevel.value ?? 0)
      return scrollId === ultimateProtectionScrollId && level >= 5
    })
    /**
     * 判断是否为终极品质首饰强化目标
     * 终极品质首饰：rarity === 'ultimate' 且 category === 'jewelry'
     */
    const isUltimateJewelryTarget = computed(() => {
      const equipment = selectedEquipment.value
      if (!equipment) {
        return false
      }
      return isUltimateRarity.value && equipment.category === 'jewelry'
    })
    // 普通装备精炼概率表
    const normalEnhanceProbabilityTable = {
      1: 100,
      2: 40,
      3: 20,
      4: 10,
      5: 5,
      6: 4,
      7: 3,
      8: 1,
      9: 0.5,
      10: 0.25
    }
    // 普通装备精炼失败率表
    const normalEnhanceBreakRateTable = {
      1: 0,
      2: 5,
      3: 10,
      4: 40,
      5: 50,
      6: 60,
      7: 70,
      8: 80,
      9: 90,
      10: 95
    }
    // 普通首饰精炼概率表
    const jewelryEnhanceProbabilityTable = {
      1: 100,
      2: 80,
      3: 60,
      4: 30,
      5: 25,
      6: 20,
      7: 15,
      8: 10,
      9: 5,
      10: 2.5,
      11:2,
      12:1.5,
      13:1.2,
      14:1,
      15:0.8,
      16:0.6,
      17:0.4,
      18:0.3,
      19:0.2,
      20:0.1
 
    }
    // 普通首饰精炼失败率表
    const jewelryEnhanceBreakRateTable = {
      1: 0,
      2: 5,
      3: 10,
      4: 20,
      5: 25,
      6: 30,
      7: 35,
      8: 40,
      9: 45,
      10: 50,
      11: 55,
      12: 60,
      13: 65,
      14: 70,
      15: 75,
      16: 80,
      17: 85,
      18: 90,
      19: 95,
      20: 99
    }
    // 终极武器,装备精炼成功概率表
    const ultimateEnhanceProbabilityTable = {
      1: 80,
      2: 40,
      3: 20,
      4: 15,
      5: 10,
      6: 9,
      7: 8,
      8: 7,
      9: 6,
      10: 5
    }
    // 终极首饰精炼成功概率表
    const ultimateJewelryEnhanceProbabilityTable = {
      1: 5,
      2: 3,
      3: 2,
      4: 1,
      5: 0.6,
      6: 0.5,
      7: 0.4,
      8: 0.3,
      9: 0.2,
      10: 0.1
    }
    // 终极装备精炼失败率表
    const ultimateEnhanceBreakRateTable = {
      1: 0,
      2: 5,
      3: 10,
      4: 20,
      5: 55,
      6: 60,
      7: 70,
      8: 80,
      9: 90,
      10: 95
    }
    // 普通装备精炼成本表
    const normalEnhanceCostTable = {
      1: 50000,
      2: 100000,
      3: 150000,
      4: 200000,
      5: 400000,
      6: 500000,
      7: 600000,
      8: 800000,
      9: 900000,
      10: 1000000
    }
    // 普通首饰精炼成本表
    const jewelryEnhanceCostTable = {
      1: 100000,
      2: 200000,
      3: 300000,
      4: 400000,
      5: 500000,
      6: 600000,
      7: 700000,
      8: 800000,
      9: 900000,
      10: 1000000,
      11: 1100000,
      12: 1200000,
      13: 1300000,
      14: 1400000,
      15: 1500000,
      16: 1600000,
      17: 1700000,
      18: 1800000,
      19: 1900000,
      20: 2000000
    }
    // 终极装备精炼成本表
    const ultimateEnhanceCostTable = {
      1: 500000,
      2: 600000,
      3: 700000,
      4: 800000,
      5: 900000,
      6: 1000000,
      7: 1100000,
      8: 1200000,
      9: 1300000,
      10: 1400000
    }
    // 终极品质首饰精炼金币消耗表
    const ultimateJewelryEnhanceCostTable = {
      1: 600000,
      2: 700000,
      3: 800000,
      4: 900000,
      5: 1000000,
      6: 1100000,
      7: 1200000,
      8: 1300000,
      9: 1400000,
      10: 1500000
    }

    const normalProbabilityRows = Object.keys(normalEnhanceProbabilityTable)
      .map(level => Number(level))
      .sort((a, b) => a - b)
      .map(level => ({
        level,
        probability: normalEnhanceProbabilityTable[level],
        cost: normalEnhanceCostTable[level] ?? 0
      }))

    const jewelryProbabilityRows = Object.keys(jewelryEnhanceProbabilityTable)
      .map(level => Number(level))
      .sort((a, b) => a - b)
      .map(level => ({
        level,
        probability: jewelryEnhanceProbabilityTable[level],
        cost: jewelryEnhanceCostTable[level] ?? 0
      }))
    const ultimateProbabilityRows = Object.keys(ultimateEnhanceProbabilityTable)
      .map(level => Number(level))
      .sort((a, b) => a - b)
      .map(level => ({
        level,
        probability: ultimateEnhanceProbabilityTable[level],
        cost: ultimateEnhanceCostTable[level] ?? 0
      }))
    // 终极品质首饰概率表行
    const ultimateJewelryProbabilityRows = Object.keys(ultimateJewelryEnhanceProbabilityTable)
      .map(level => Number(level))
      .sort((a, b) => a - b)
      .map(level => ({
        level,
        probability: ultimateJewelryEnhanceProbabilityTable[level],
        cost: ultimateJewelryEnhanceCostTable[level] ?? 0
      }))
    const probabilityReferenceTitle = computed(() => {
      if (isUltimateJewelryTarget.value) {
        return '终极品质首饰'
      }
      if (isUltimateEnhanceTarget.value) {
        return '终极武器'
      }
      if (isAccessoryProbabilityTarget.value) {
        return '普通首饰'
      }
      if (isNormalEnhanceTarget.value) {
        return '普通武器/防具/盾牌'
      }
      return ''
    })
    const probabilityReferenceRows = computed(() => {
      if (isUltimateJewelryTarget.value) {
        return ultimateJewelryProbabilityRows
      }
      if (isUltimateEnhanceTarget.value) {
        return ultimateProbabilityRows
      }
      if (isAccessoryProbabilityTarget.value) {
        return jewelryProbabilityRows
      }
      if (isNormalEnhanceTarget.value) {
        return normalProbabilityRows
      }
      return []
    })
    const ultimateSuccessLevelChances = computed(() => {
      if (!isUltimateEnhanceTarget.value) {
        return []
      }
      // +5及以上时，成功固定+1级
      if (Number(displayEnhanceLevel.value ?? 0) >= 5) {
        return [{ level: 1, chance: 100 }]
      }
      return [
        { level: 1, chance: 50 },
        { level: 2, chance: 40 },
        { level: 3, chance: 30 },
        { level: 4, chance: 20 },
        { level: 5, chance: 10 }
      ]
    })
    const ultimateFailLevelChances = computed(() => {
      if (!isUltimateEnhanceTarget.value) {
        return []
      }
      // +5及以上使用终极防护卷轴时，失败不降级
      if (isUltimateWeaponProtected.value) {
        return [{ level: 0, chance: 100 }]
      }
      return [
        { level: 1, chance: 50 },
        { level: 2, chance: 25 },
        { level: 3, chance: 10 }
      ]
    })
    const targetEnhanceOptions = computed(() => {
      const maxLevel = enhanceMaxLevel.value
      if (!Number.isFinite(maxLevel) || maxLevel <= 0) {
        return []
      }
      return Array.from({ length: maxLevel }, (_, index) => index + 1)
    })

    // 面板尺寸和位置配置
    const DEFAULT_WIDTH = 700
    const DEFAULT_HEIGHT = 500
    const MIN_WIDTH = 500
    const MIN_HEIGHT = 350

    // 面板引用
    const panelRef = ref(null)

    // 面板尺寸
    const panelWidth = ref(DEFAULT_WIDTH)
    const panelHeight = ref(DEFAULT_HEIGHT)

    // 面板位置
    const panelX = ref(0)
    const panelY = ref(0)

    // 拖拽状态
    const isDragging = ref(false)
    const dragStartX = ref(0)
    const dragStartY = ref(0)
    const dragStartPanelX = ref(0)
    const dragStartPanelY = ref(0)

    // 拉伸状态
    const isResizing = ref(false)
    const resizeStartX = ref(0)
    const resizeStartY = ref(0)
    const resizeStartWidth = ref(0)
    const resizeStartHeight = ref(0)

    // 面板样式
    const panelStyle = computed(() => ({
      left: `calc(50% - ${panelWidth.value / 2}px + ${panelX.value}px)`,
      top: `calc(50% - ${panelHeight.value / 2}px + ${panelY.value}px)`,
      width: `${panelWidth.value}px`,
      height: `${panelHeight.value}px`
    }))

    // 缩放比例（基于默认尺寸）
    const scaleRatio = computed(() => Math.min(panelWidth.value / DEFAULT_WIDTH, panelHeight.value / DEFAULT_HEIGHT))

    // 内容缩放样式
    const contentStyle = computed(() => ({
      transform: `scale(${scaleRatio.value})`,
      transformOrigin: 'top left',
      width: `${DEFAULT_WIDTH}px`,
      height: `${DEFAULT_HEIGHT}px`
    }))

    const referenceStyle = computed(() => ({
      left: `calc(50% + ${panelWidth.value / 2 + panelX.value + 20}px)`,
      top: `calc(50% - ${panelHeight.value / 2}px + ${panelY.value}px)`
    }))

    // panelPosition 兼容性计算（用于动画组件）
    const panelPosition = computed(() => ({
      x: window.innerWidth / 2 - panelWidth.value / 2 + panelX.value,
      y: window.innerHeight / 2 - panelHeight.value / 2 + panelY.value
    }))

    /**
     * 初始化面板位置到屏幕中央
     */
    const initPanelPosition = () => {
      panelX.value = 0
      panelY.value = 0
      panelWidth.value = DEFAULT_WIDTH
      panelHeight.value = DEFAULT_HEIGHT
    }

    /**
     * 开始拖拽面板
     * @param {PointerEvent} event - 指针事件
     */
    const startDrag = event => {
      // 排除按钮点击
      if (event.target.closest('.enhance-header-actions')) return
      if (event.target.closest('.enhance-sidebar')) return
      if (event.target.closest('button')) return

      isDragging.value = true
      dragStartX.value = event.clientX
      dragStartY.value = event.clientY
      dragStartPanelX.value = panelX.value
      dragStartPanelY.value = panelY.value

      document.addEventListener('pointermove', handleDrag)
      document.addEventListener('pointerup', stopDrag)
    }

    /**
     * 处理拖拽移动
     * @param {PointerEvent} event - 指针事件
     */
    const handleDrag = event => {
      if (!isDragging.value) return
      const deltaX = event.clientX - dragStartX.value
      const deltaY = event.clientY - dragStartY.value
      panelX.value = dragStartPanelX.value + deltaX
      panelY.value = dragStartPanelY.value + deltaY
    }

    /**
     * 停止拖拽
     */
    const stopDrag = () => {
      isDragging.value = false
      document.removeEventListener('pointermove', handleDrag)
      document.removeEventListener('pointerup', stopDrag)
    }

    /**
     * 开始拉伸面板
     * @param {PointerEvent} event - 指针事件
     */
    const startResize = event => {
      event.preventDefault()
      event.stopPropagation()

      isResizing.value = true
      resizeStartX.value = event.clientX
      resizeStartY.value = event.clientY
      resizeStartWidth.value = panelWidth.value
      resizeStartHeight.value = panelHeight.value

      document.addEventListener('pointermove', handleResize)
      document.addEventListener('pointerup', stopResize)
    }

    /**
     * 处理拉伸移动
     * @param {PointerEvent} event - 指针事件
     */
    const handleResize = event => {
      if (!isResizing.value) return

      // 计算新尺寸（保持等比例缩放）
      const deltaX = event.clientX - resizeStartX.value
      const deltaY = event.clientY - resizeStartY.value

      // 使用较大的增量来保持等比例
      const deltaAvg = (deltaX + deltaY) / 2

      let newWidth = resizeStartWidth.value + deltaAvg * 2
      let newHeight = resizeStartHeight.value + deltaAvg * 1.43 // 保持宽高比约 700:500

      // 限制最小尺寸
      newWidth = Math.max(MIN_WIDTH, newWidth)
      newHeight = Math.max(MIN_HEIGHT, newHeight)

      // 限制最大尺寸（屏幕的90%）
      const maxWidth = window.innerWidth * 0.9
      const maxHeight = window.innerHeight * 0.9
      newWidth = Math.min(maxWidth, newWidth)
      newHeight = Math.min(maxHeight, newHeight)

      // 等比例缩放：以宽度为基准
      const aspectRatio = DEFAULT_WIDTH / DEFAULT_HEIGHT
      if (newWidth / newHeight > aspectRatio) {
        // 宽度过大，以高度为基准
        newWidth = newHeight * aspectRatio
      } else {
        // 高度过大，以宽度为基准
        newHeight = newWidth / aspectRatio
      }

      panelWidth.value = Math.round(newWidth)
      panelHeight.value = Math.round(newHeight)
    }

    /**
     * 停止拉伸
     */
    const stopResize = () => {
      isResizing.value = false
      document.removeEventListener('pointermove', handleResize)
      document.removeEventListener('pointerup', stopResize)
    }

    /**
     * 初始化选择面板位置（居中显示）
     * @param {string} type - 面板类型：'equipment' | 'material' | 'scroll'
     */
    const initSelectorPosition = (type) => {
      const selectorPanelWidth = 400
      const selectorPanelHeight = 345
      const position = {
        x: (window.innerWidth - selectorPanelWidth) / 2 - panelPosition.value.x + 300,
        y: (window.innerHeight - selectorPanelHeight) / 2 - panelPosition.value.y + 200
      }
      if (type === 'equipment') {
        equipmentSelectorPosition.value = position
      } else if (type === 'material') {
        materialSelectorPosition.value = position
      } else if (type === 'scroll') {
        scrollSelectorPosition.value = position
      }
    }

    /**
     * 选择面板拖拽开始
     * @param {MouseEvent} event
     * @param {string} type - 面板类型：'equipment' | 'material' | 'scroll'
     */
    const startSelectorDrag = (event, type) => {
      event.preventDefault()
      isSelectorDragging.value = true
      currentSelectorDragType.value = type

      let currentPosition
      if (type === 'equipment') {
        currentPosition = equipmentSelectorPosition.value
      } else if (type === 'material') {
        currentPosition = materialSelectorPosition.value
      } else {
        currentPosition = scrollSelectorPosition.value
      }

      selectorDragOffset.value = {
        x: event.clientX - currentPosition.x,
        y: event.clientY - currentPosition.y
      }

      selectorDragHandler = onSelectorDrag
      selectorDragEndHandler = stopSelectorDrag
      document.addEventListener('mousemove', selectorDragHandler)
      document.addEventListener('mouseup', selectorDragEndHandler)
    }

    /**
     * 选择面板拖拽中
     * @param {MouseEvent} event
     */
    const onSelectorDrag = (event) => {
      if (!isSelectorDragging.value) return

      const newPosition = {
        x: event.clientX - selectorDragOffset.value.x,
        y: event.clientY - selectorDragOffset.value.y
      }

      if (currentSelectorDragType.value === 'equipment') {
        equipmentSelectorPosition.value = newPosition
      } else if (currentSelectorDragType.value === 'material') {
        materialSelectorPosition.value = newPosition
      } else if (currentSelectorDragType.value === 'scroll') {
        scrollSelectorPosition.value = newPosition
      }
    }

    /**
     * 选择面板拖拽结束
     */
    const stopSelectorDrag = () => {
      isSelectorDragging.value = false
      currentSelectorDragType.value = null
      if (selectorDragHandler) {
        document.removeEventListener('mousemove', selectorDragHandler)
        selectorDragHandler = null
      }
      if (selectorDragEndHandler) {
        document.removeEventListener('mouseup', selectorDragEndHandler)
        selectorDragEndHandler = null
      }
    }

    /**
     * 装备选择面板拖拽开始
     */
    const startEquipmentSelectorDrag = (event) => {
      startSelectorDrag(event, 'equipment')
    }

    /**
     * 材料选择面板拖拽开始
     */
    const startMaterialSelectorDrag = (event) => {
      startSelectorDrag(event, 'material')
    }

    /**
     * 卷轴选择面板拖拽开始
     */
    const startScrollSelectorDrag = (event) => {
      startSelectorDrag(event, 'scroll')
    }

    const toggleProbabilityReference = () => {
      showProbabilityReference.value = !showProbabilityReference.value
    }

    const resetEnhanceBoost = () => {
      enhanceFailCount.value = 0
      lastBoostIncrease.value = 0
      boostAnimationKey.value = 0
    }

    const stopAutoEnhance = (message, type = 'warning') => {
      if (autoEnhanceTimer) {
        clearTimeout(autoEnhanceTimer)
        autoEnhanceTimer = null
      }
      autoEnhanceActive.value = false
    
      if (message && props.addBattleLog) {
        props.addBattleLog(message, type)
      }
    }

    const resetSelections = () => {
      refineMode.value = props.lockedMode || 'enhance'
      selectedEquipment.value = null
      selectedMaterial.value = null
      selectedScroll.value = null
      selectedEquipmentMeta.value = null
      showEquipmentSelectorPanel.value = false
      showMaterialSelectorPanel.value = false
      showScrollSelectorPanel.value = false
      showMissingScrollConfirm.value = false
      showProbabilityReference.value = false
      stopAutoEnhance()
      resetEnhanceBoost()
    }

    const switchRefineMode = mode => {
      if (props.lockedMode) {
        refineMode.value = props.lockedMode
        return
      }
      if (refineMode.value === mode) {
        return
      }
      refineMode.value = mode
      selectedMaterial.value = null
      selectedScroll.value = null
      showMaterialSelectorPanel.value = false
      showScrollSelectorPanel.value = false
      showMissingScrollConfirm.value = false
      resetEnhanceBoost()
      syncTargetEnhanceLevel()
    }

    watch(
      () => props.isVisible,
      (visible, wasVisible) => {
        if (wasVisible && !visible) {
          resetSelections()
        }
      }
    )
    watch(
      () => props.lockedMode,
      locked => {
        if (locked) {
          refineMode.value = locked
        }
      },
      { immediate: true }
    )

    // 初始化面板位置
    initPanelPosition()

    // 可精炼的装备列表
    const availableEquipments = computed(() => {
      const bag = itemsStore.playerBag
      if (!bag || bag.length === 0) {
        return []
      }

      // 筛选符合条件的装备：武器、帽子、衣服、手套、鞋子、首饰
      const candidates = bag
        .map((item, bagIndex) => ({ item, bagIndex }))
        .filter(({ item }) => {
          if (!item) {
            return false
          }

          if (isAttributeRefine.value) {
            if (item.category === 'weapon') {
              return true
            }
            if (item.category === 'armor') {
              return item.subcategory === 'suit'
            }
            return false
          }

          // 武器
          if (item.category === 'weapon') {
            return true
          }

          // 防具：帽子、衣服、手套、鞋子、护盾
          if (item.category === 'armor') {
            const validSubcategories = ['helmet', 'suit', 'gloves', 'gauntlet', 'boots', 'shield']
            return validSubcategories.includes(item.subcategory)
          }

          // 首饰
          if (item.category === 'jewelry') {
            return true
          }

          return false
        })

      return candidates.map(({ item, bagIndex }) => ({
        item,
        bagIndex,
        key: item.uniqueId || `${item.id}-${bagIndex}`
      }))
    })

    const isAccessoryProbabilityTarget = computed(() => {
      const equipment = selectedEquipment.value
      if (!equipment) {
        return false
      }
      const equipmentId = Number(equipment.id)
      return accessoryProbabilityEquipmentIds.has(equipmentId)
    })

    const isNormalEnhanceTarget = computed(() => {
      const equipment = selectedEquipment.value
      if (!equipment) {
        return false
      }

      if (equipment.category === 'weapon') {
        return true
      }

      if (
        equipment.category === 'armor' &&
        ['helmet', 'suit', 'gloves', 'gauntlet', 'boots', 'shield'].includes(equipment.subcategory)
      ) {
        return true
      }

      return false
    })

    const isEnhanceSupported = computed(() => {
      if (isAttributeRefine.value) {
        return Boolean(selectedEquipment.value)
      }
      return isNormalEnhanceTarget.value || isAccessoryProbabilityTarget.value || isUltimateJewelryTarget.value
    })

    const allowedMaterialIds = computed(() => {
      if (isAttributeRefine.value) {
        if (!selectedEquipment.value) {
          return []
        }
        const targetLevel = attributeCurrentLevel.value + 1
        if (targetLevel < 1 || targetLevel > 10) {
          return []
        }
        const baseIds = targetLevel <= 5 ? attributeCardIdsLow : attributeCardIdsHigh
        const existingElement = existingAttributeElementKey.value
        if (!existingElement) {
          return baseIds
        }
        return baseIds.filter(id => attributeCardElementMap[id] === existingElement)
      }
      // 终极品质首饰只能使用晶石(ID:15403)
      if (isUltimateJewelryTarget.value) {
        return [ultimateDiceMaterialId]
      }
      if (isUltimateRarity.value) {
        return [ultimateDiceMaterialId]
      }
      if (isAccessoryProbabilityTarget.value) {
        return jewelryDiceMaterialIds
      }
      if (isNormalEnhanceTarget.value) {
        return normalDiceMaterialIds
      }
      return []
    })

    const availableMaterials = computed(() => {
      const bag = itemsStore.playerBag
      if (!selectedEquipment.value) {
        return []
      }
      if (!bag || bag.length === 0) {
        return []
      }

      const allowedIds = new Set(allowedMaterialIds.value)
      const candidates = bag
        .map((item, bagIndex) => ({ item, bagIndex }))
        .filter(({ item }) => item && allowedIds.has(Number(item.id)))

      return candidates.map(({ item, bagIndex }) => ({
        item,
        bagIndex,
        quantity: item.currentStack || item.quantity || 1,
        key: item.uniqueId || `${item.id}-${bagIndex}`
      }))
    })
    const availableScrolls = computed(() => {
      const bag = itemsStore.playerBag
      if (!selectedEquipment.value) {
        return []
      }
      if (!bag || bag.length === 0) {
        return []
      }
      // 防护卷轴只显示指定ID: 14737(终极防护卷轴), 2527(装备防护卷轴), 9613
      const allowedIds = new Set([14737, 2527, 9613])
      const candidates = bag
        .map((item, bagIndex) => ({ item, bagIndex }))
        .filter(({ item }) => item && allowedIds.has(Number(item.id)))
      return candidates.map(({ item, bagIndex }) => ({
        item,
        bagIndex,
        quantity: item.currentStack || item.quantity || 1,
        key: item.uniqueId || `${item.id}-${bagIndex}`
      }))
    })
    /**
     * 防护卷轴为空时的提示文本
     */
    const scrollEmptyText = computed(() => {
      if (!selectedEquipment.value) {
        return '请先选择装备'
      }
      // 终极品质首饰需要终极防护卷轴
      if (isUltimateJewelryTarget.value) {
        return '背包中未找到 终极防护卷轴'
      }
      return '没有可用的防护卷轴'
    })

    const materialEmptyText = computed(() => {
      if (!selectedEquipment.value) {
        return '请先选择装备'
      }
      if (!isEnhanceSupported.value) {
        return '该道具不支持精炼'
      }
      // 终极品质首饰需要晶石
      if (isUltimateJewelryTarget.value) {
        return '背包中未找到精炼材料 晶石'
      }
      return isAttributeRefine.value ? '没有可用的属性卡片' : '没有可用的精炼材料'
    })

    const baseProbability = computed(() => {
      if (!selectedEquipment.value || !selectedMaterial.value) {
        return 0
      }

      const equipment = selectedEquipment.value
      const materialId = Number(selectedMaterial.value.id)
      const currentLevel = Number(
        isAttributeRefine.value
          ? attributeCurrentLevel.value
          : equipment?.StrengthenedAttributes?.enhanceLevel ?? equipment?.enhanceLevel ?? 0
      )
      const targetLevel = currentLevel + 1
      const rule = isAttributeRefine.value ? attributeCardRules.get(materialId) : materialRules.get(materialId)
      if (!rule) {
        return 0
      }
      if (isAttributeRefine.value) {
        const existingElement = existingAttributeElementKey.value
        const materialElement = attributeCardElementMap[materialId]
        if (existingElement && materialElement && existingElement !== materialElement) {
          return 0
        }
      } else {
        // 终极品质首饰只能使用晶石
        if (isUltimateJewelryTarget.value && materialId !== ultimateDiceMaterialId) {
          return 0
        }
        if (isUltimateRarity.value && materialId !== ultimateDiceMaterialId) {
          return 0
        }
        if (isNormalEnhanceTarget.value && !isUltimateEnhanceTarget.value && !normalDiceMaterialIds.includes(materialId)) {
          return 0
        }
        if (isAccessoryProbabilityTarget.value && !jewelryDiceMaterialIds.includes(materialId)) {
          return 0
        }
        if (!isNormalEnhanceTarget.value && !isAccessoryProbabilityTarget.value && !isUltimateJewelryTarget.value) {
          return 0
        }
      }

      if (
        typeof rule.minTargetLevel === 'number' &&
        typeof rule.maxTargetLevel === 'number' &&
        (targetLevel < rule.minTargetLevel || targetLevel > rule.maxTargetLevel)
      ) {
        return 0
      }

      const maxEnhanceLevel = Number(enhanceMaxLevel.value ?? 0)
      if (!Number.isFinite(maxEnhanceLevel) || maxEnhanceLevel <= 0 || targetLevel > maxEnhanceLevel) {
        return 0
      }

      const rarity = String(equipment.rarity || 'common')
      const useNormalTable =
        isNormalEnhanceTarget.value &&
        normalProbabilityRarities.has(rarity) &&
        (equipment.category === 'weapon' || equipment.category === 'armor')

      const probabilityTable = isUltimateEnhanceTarget.value
        ? ultimateEnhanceProbabilityTable
        : isUltimateJewelryTarget.value
          ? ultimateJewelryEnhanceProbabilityTable
          : useNormalTable
            ? normalEnhanceProbabilityTable
            : isAccessoryProbabilityTarget.value
              ? jewelryEnhanceProbabilityTable
              : normalEnhanceProbabilityTable

      const baseProbability = Number(probabilityTable[targetLevel] ?? 0)
      if (baseProbability <= 0) {
        return 0
      }

      const probabilityMultiplier = Number(rule.probabilityMultiplier || 1)
      return Math.min(100, baseProbability * probabilityMultiplier)
    })

    const successProbability = computed(() => {
      const base = Number(baseProbability.value ?? 0)
      if (!Number.isFinite(base) || base <= 0) {
        return 0
      }
      // 只有终极武器不享受失败加成，终极首饰享受失败加成
      if (isUltimateEnhanceTarget.value) {
        return Math.round(base * 10000) / 10000
      }
      const boosted = Math.min(100, base * (1 + enhanceFailCount.value * 0.2))
      return Math.round(boosted * 10000) / 10000
    })
    const breakProbability = computed(() => {
      const equipment = selectedEquipment.value
      if (!equipment || !isEnhanceSupported.value) {
        return 0
      }
      if (selectedScroll.value) {
        return 0
      }

      const currentLevel = Number(
        isAttributeRefine.value
          ? attributeCurrentLevel.value
          : equipment?.StrengthenedAttributes?.enhanceLevel ?? equipment?.enhanceLevel ?? 0
      )
      const targetLevel = currentLevel + 1
      const maxEnhanceLevel = Number(enhanceMaxLevel.value ?? 0)
      if (!Number.isFinite(targetLevel) || targetLevel < 1) {
        return 0
      }
      if (!Number.isFinite(maxEnhanceLevel) || maxEnhanceLevel <= 0 || targetLevel > maxEnhanceLevel) {
        return 0
      }

      // 终极品质首饰有防护卷轴时破损率为0，无防护卷轴时破损率为100%
      if (isUltimateJewelryTarget.value) {
        return selectedScroll.value ? 0 : 100
      }
      if (isUltimateEnhanceTarget.value) {
        return Number(ultimateEnhanceBreakRateTable[targetLevel] ?? 0)
      }
      if (isAccessoryProbabilityTarget.value) {
        return Number(jewelryEnhanceBreakRateTable[targetLevel] ?? 0)
      }

      if (isNormalEnhanceTarget.value) {
        return Number(normalEnhanceBreakRateTable[targetLevel] ?? 0)
      }

      return 0
    })

    const enhanceProgressText = computed(() => Math.round(enhanceProgress.value))

    // 是否可以强化
    const canEnhance = computed(() => {
      // 终极品质首饰必须选择终极防护卷轴
      const requireUltimateJewelryScroll =
        !isAttributeRefine.value &&
        isUltimateJewelryTarget.value &&
        (!selectedScroll.value || Number(selectedScroll.value?.id) !== ultimateProtectionScrollId)
      const requireUltimateScroll =
        !isAttributeRefine.value &&
        isUltimateRarity.value &&
        !isUltimateJewelryTarget.value &&
        (!selectedScroll.value || Number(selectedScroll.value?.id) !== ultimateProtectionScrollId)
      const requireUltimateMaterial =
        !isAttributeRefine.value &&
        isUltimateRarity.value &&
        (!selectedMaterial.value || Number(selectedMaterial.value?.id) !== ultimateDiceMaterialId)
      const requireAttributeScroll =
        isAttributeRefine.value && (!selectedScroll.value || selectedScrollStack.value < 1)
      return (
        selectedEquipment.value &&
        selectedMaterial.value &&
        successProbability.value > 0 &&
        !requireUltimateMaterial &&
        !requireUltimateScroll &&
        !requireUltimateJewelryScroll &&
        !requireAttributeScroll &&
        !enhanceCooldownActive.value &&
        !enhanceInProgress.value
      )
    })

    const enhanceCost = computed(() => {
      const equipment = selectedEquipment.value
      if (!equipment) {
        return 0
      }

      const currentLevel = Number(
        isAttributeRefine.value
          ? attributeCurrentLevel.value
          : equipment?.StrengthenedAttributes?.enhanceLevel ?? equipment?.enhanceLevel ?? 0
      )
      const targetLevel = currentLevel + 1
      const maxEnhanceLevel = Number(enhanceMaxLevel.value ?? 0)
      if (targetLevel < 1 || !Number.isFinite(maxEnhanceLevel) || maxEnhanceLevel <= 0 || targetLevel > maxEnhanceLevel) {
        return 0
      }

      // 终极品质首饰使用独立金币消耗表
      if (isUltimateJewelryTarget.value) {
        return Number(ultimateJewelryEnhanceCostTable[targetLevel] ?? 0)
      }
      if (isUltimateEnhanceTarget.value) {
        return Number(ultimateEnhanceCostTable[targetLevel] ?? 0)
      }
      if (isAccessoryProbabilityTarget.value) {
        return Number(jewelryEnhanceCostTable[targetLevel] ?? 0)
      }

      if (isNormalEnhanceTarget.value) {
        return Number(normalEnhanceCostTable[targetLevel] ?? 0)
      }

      return 0
    })

    // 关闭面板
    const close = () => {
      resetSelections()
      emit('close')
    }

    // 显示装备选择面板
    const showEquipmentSelector = () => {
      showMaterialSelectorPanel.value = false
      initSelectorPosition('equipment')
      showEquipmentSelectorPanel.value = true
    }

    // 隐藏装备选择面板
    const hideEquipmentSelector = () => {
      showEquipmentSelectorPanel.value = false
    }

    const showMaterialSelector = () => {
      showEquipmentSelectorPanel.value = false
      initSelectorPosition('material')
      showMaterialSelectorPanel.value = true
    }

    const hideMaterialSelector = () => {
      showMaterialSelectorPanel.value = false
    }
    const showScrollSelector = () => {
      showEquipmentSelectorPanel.value = false
      showMaterialSelectorPanel.value = false
      initSelectorPosition('scroll')
      showScrollSelectorPanel.value = true
    }
    const hideScrollSelector = () => {
      showScrollSelectorPanel.value = false
    }

    // 选择装备
    const selectEquipment = entry => {
      const currentEnhanceLevel = entry.item?.StrengthenedAttributes?.enhanceLevel ?? entry.item?.enhanceLevel ?? 0
      selectedEquipment.value = {
        ...entry.item,
        enhanceLevel: currentEnhanceLevel
      }
      selectedEquipmentMeta.value = {
        id: entry.item?.id ?? null,
        uniqueId: entry.item?.uniqueId ?? null,
        bagIndex: entry.bagIndex
      }
      selectedMaterial.value = null
      selectedScroll.value = null
      resetEnhanceBoost()
      hideItemTooltip() // 选择完成后关闭物品详情面板
      hideEquipmentSelector()
    }

    const selectMaterial = entry => {
      if (isAttributeRefine.value) {
        const existingElement = existingAttributeElementKey.value
        const materialElement = attributeCardElementMap[Number(entry.item?.id)]
        if (existingElement && materialElement && existingElement !== materialElement) {
          if (props.addBattleLog) {
            props.addBattleLog('属性精炼仅可选择同元素属性卡片', 'warning')
          }
          return
        }
      }
      selectedMaterial.value = { ...entry.item }
      resetEnhanceBoost()
      hideItemTooltip() // 选择完成后关闭物品详情面板
      hideMaterialSelector()
    }
    const selectScroll = entry => {
      selectedScroll.value = { ...entry.item }
      hideItemTooltip() // 选择完成后关闭物品详情面板
      hideScrollSelector()
    }

    // 监听 itemsStore.playerBag（与 availableMaterials 数据源一致），
    // 同步 selectedMaterial 的数量，或在物品消失时清空选中
    watch(
      () => itemsStore.playerBag,
      bag => {
        if (!selectedMaterial.value) {
          return
        }

        const selectedId = Number(selectedMaterial.value.id)
        if (!Number.isFinite(selectedId)) {
          selectedMaterial.value = null
          resetEnhanceBoost()
          return
        }

        const list = Array.isArray(bag) ? bag : []
        const candidate = list.find(item => item && Number(item.id) === selectedId)
        if (!candidate) {
          selectedMaterial.value = null
          resetEnhanceBoost()
          return
        }

        const nextStack = Number(candidate.currentStack ?? candidate.quantity ?? 1)
        if (!Number.isFinite(nextStack) || nextStack < 1) {
          selectedMaterial.value = null
          resetEnhanceBoost()
          return
        }

        selectedMaterial.value = {
          ...selectedMaterial.value,
          currentStack: candidate.currentStack ?? selectedMaterial.value.currentStack,
          quantity: candidate.quantity ?? selectedMaterial.value.quantity
        }
      },
      { deep: true }
    )
    const syncTargetEnhanceLevel = () => {
      const maxLevel = Number(enhanceMaxLevel.value ?? 0)
      if (!selectedEquipment.value || !Number.isFinite(maxLevel) || maxLevel <= 0) {
        targetEnhanceLevel.value = 0
        return
      }
      const currentTarget = Number(targetEnhanceLevel.value)
      if (Number.isFinite(currentTarget) && currentTarget >= 1 && currentTarget <= maxLevel) {
        return
      }
      const currentLevel = Number(displayEnhanceLevel.value ?? 0)
      targetEnhanceLevel.value = Math.min(maxLevel, Math.max(1, currentLevel + 1))
    }
    watch([selectedEquipment, enhanceMaxLevel], syncTargetEnhanceLevel, { immediate: true })
    watch(
      () => selectedEquipment.value,
      value => {
        if (!value && autoEnhanceActive.value) {
          stopAutoEnhance('装备已移除，自动强化已停止', 'warning')
        }
      }
    )
    // 监听 itemsStore.playerBag（与 availableScrolls 数据源一致），
    // 同步 selectedScroll 的数量，或在物品消失时清空选中
    watch(
      () => itemsStore.playerBag,
      bag => {
        if (!selectedScroll.value) {
          return
        }

        const selectedId = Number(selectedScroll.value.id)
        if (!Number.isFinite(selectedId)) {
          selectedScroll.value = null
          return
        }

        const list = Array.isArray(bag) ? bag : []
        const candidate = list.find(item => item && Number(item.id) === selectedId)
        if (!candidate) {
          selectedScroll.value = null
          return
        }

        const nextStack = Number(candidate.currentStack ?? candidate.quantity ?? 1)
        if (!Number.isFinite(nextStack) || nextStack < 1) {
          selectedScroll.value = null
          return
        }

        selectedScroll.value = {
          ...selectedScroll.value,
          currentStack: candidate.currentStack ?? selectedScroll.value.currentStack,
          quantity: candidate.quantity ?? selectedScroll.value.quantity
        }
      },
      { deep: true }
    )
    const validateSelectedEquipment = bag => {
      if (!selectedEquipment.value) {
        return
      }

      const list = Array.isArray(bag) ? bag : []
      const selectedMeta = selectedEquipmentMeta.value
      let candidate = null
      let candidateIndex = -1
      if (selectedMeta?.uniqueId) {
        candidateIndex = list.findIndex(item => item && item.uniqueId === selectedMeta.uniqueId)
        if (candidateIndex >= 0) {
          candidate = list[candidateIndex]
        }
      } else if (typeof selectedMeta?.bagIndex === 'number') {
        const entry = list[selectedMeta.bagIndex]
        if (entry && Number(entry.id) === Number(selectedMeta?.id)) {
          candidate = entry
          candidateIndex = selectedMeta.bagIndex
        }
      } else if (selectedMeta?.id !== null && selectedMeta?.id !== undefined) {
        const selectedId = Number(selectedMeta.id)
        if (Number.isFinite(selectedId)) {
          candidateIndex = list.findIndex(item => item && Number(item.id) === selectedId)
          if (candidateIndex >= 0) {
            candidate = list[candidateIndex]
          }
        }
      }

      if (!candidate) {
        selectedEquipment.value = null
        selectedEquipmentMeta.value = null
        selectedMaterial.value = null
        selectedScroll.value = null
        resetEnhanceBoost()
        return
      }

      const currentEnhanceLevel = candidate?.StrengthenedAttributes?.enhanceLevel ?? candidate?.enhanceLevel ?? 0
      selectedEquipment.value = {
        ...candidate,
        enhanceLevel: currentEnhanceLevel
      }
      selectedEquipmentMeta.value = {
        id: candidate?.id ?? null,
        uniqueId: candidate?.uniqueId ?? null,
        bagIndex: candidateIndex >= 0 ? candidateIndex : selectedMeta?.bagIndex ?? null
      }
    }

    watch(
      () => props.player?.bag,
      bag => {
        validateSelectedEquipment(bag)
      },
      { deep: true }
    )
    watch(
      () => itemsStore.playerBag,
      bag => {
        validateSelectedEquipment(bag)
      },
      { deep: true }
    )

    /**
     * 执行强化操作
     */
    const finalizeEnhance = cost => {
      const resolveEnhanceRateAtPlus10 = (equipmentLevel, equipmentRarity) => {
        const normalizedLevel = Number(equipmentLevel)
        if (!Number.isFinite(normalizedLevel) || normalizedLevel <= 0) {
          return 0
        }
        if (equipmentRarity === 'ultimate' && normalizedLevel >= 150) {
          return 0.656
        }
        if (normalizedLevel <= 60) {
          return 0.358
        }
        if (normalizedLevel <= 70) {
          return 0.3525
        }
        if (normalizedLevel <= 105) {
          return 0.3345
        }
        if (normalizedLevel <= 120) {
          return 0.329
        }
        if (normalizedLevel <= 150) {
          return 0.2955
        }
        if (normalizedLevel <= 175) {
          return 0.2935
        }
        return 0.2935
      }

      const resolveEnhanceRatePerLevel = (equipmentLevel, equipmentRarity) => {
        const rateAtPlus10 = resolveEnhanceRateAtPlus10(equipmentLevel, equipmentRarity)
        if (!Number.isFinite(rateAtPlus10) || rateAtPlus10 <= 0) {
          return 0
        }
        return rateAtPlus10 / 10
      }

      const pickWeightedLevelChange = weights => {
        const normalizedWeights = Array.isArray(weights) ? weights : []
        const total = normalizedWeights.reduce((sum, item) => sum + Number(item?.weight ?? 0), 0)
        if (!Number.isFinite(total) || total <= 0) {
          return 1
        }
        let roll = Math.random() * total
        for (const item of normalizedWeights) {
          const weight = Number(item?.weight ?? 0)
          if (weight <= 0) {
            continue
          }
          if (roll <= weight) {
            return Number(item.level ?? 1)
          }
          roll -= weight
        }
        return Number(normalizedWeights[normalizedWeights.length - 1]?.level ?? 1)
      }

      const isSuccess = Math.random() * 100 < successProbability.value
      const currentLevel = Number(
        isAttributeRefine.value
          ? attributeCurrentLevel.value
          : selectedEquipment.value?.StrengthenedAttributes?.enhanceLevel ?? selectedEquipment.value?.enhanceLevel ?? 0
      )
      const scrollId = Number(selectedScroll.value?.id)
      const hasProtectionScroll = Number.isFinite(scrollId) && scrollId > 0
      // 终极武器+5及以上使用终极防护卷轴时，不破损不降级
      const isUltimateWeaponProtectedAtFail =
        isUltimateEnhanceTarget.value && scrollId === ultimateProtectionScrollId && currentLevel >= 5
      // 终极首饰必须有防护卷轴，无防护卷轴时破损率为100%
      const canBreak =
        !isAttributeRefine.value &&
        !isSuccess &&
        !isUltimateWeaponProtectedAtFail &&
        (!hasProtectionScroll || isUltimateEnhanceTarget.value || isUltimateJewelryTarget.value)
      const breakRate = Number(breakProbability.value ?? 0)
      const broke =
        canBreak && Number.isFinite(breakRate) && breakRate > 0 ? Math.random() * 100 < breakRate : false
      const maxLevel = Number(enhanceMaxLevel.value ?? 0)
      let nextLevel = Number(currentLevel)
      
      // 终极首饰精炼次数（无论成功或失败都+1）
      let refineCount = Number(selectedEquipment.value?.StrengthenedAttributes?.refineCount ?? selectedEquipment.value?.refineCount ?? 0)
      
      if (isSuccess) {
        if (isUltimateEnhanceTarget.value) {
          // 终极武器+5及以上时，成功固定+1级
          if (currentLevel >= 5) {
            const cappedMax = Number.isFinite(maxLevel) && maxLevel > 0 ? maxLevel : nextLevel + 1
            nextLevel = Math.min(cappedMax, nextLevel + 1)
          } else {
            // +5以下时，增加的强化等级范围概率
            const increase = pickWeightedLevelChange([
              { level: 1, weight: 50 },
              { level: 2, weight: 40 },
              { level: 3, weight: 30 },
              { level: 4, weight: 20 },
              { level: 5, weight: 10 }
            ])
            const cappedMax = Number.isFinite(maxLevel) && maxLevel > 0 ? maxLevel : nextLevel + increase
            nextLevel = Math.min(cappedMax, nextLevel + increase)
          }
        } else {
          // 终极首饰成功时只+1级，其他装备也+1级
          nextLevel = Math.min(maxLevel || nextLevel + 1, nextLevel + 1)
        }
      } else if (!broke && !isAttributeRefine.value) {
        if (isUltimateEnhanceTarget.value) {
          // 终极武器+5及以上使用终极防护卷轴时，失败不降级
          if (isUltimateWeaponProtectedAtFail) {
            // nextLevel保持不变，不降级
          } else {
            // 终极强化失败时，减少的强化等级范围概率
            const decrease = pickWeightedLevelChange([
              { level: 1, weight: 50 },
              { level: 2, weight: 25 },
              { level: 3, weight: 10 }
            ])
            nextLevel = Math.max(0, nextLevel - decrease)
          }
        } else if (isUltimateJewelryTarget.value) {
          // 终极首饰失败时有防护卷轴，不掉级
          // nextLevel保持不变
        } else if (!hasProtectionScroll) {
          nextLevel = Math.max(0, nextLevel - 1)
        } else if (scrollId === 9613) {
          nextLevel = Math.max(0, nextLevel - 1)
        }
      }
      
      // 终极首饰：精炼次数+1
      if (isUltimateJewelryTarget.value) {
        refineCount += 1
      }

      if (!broke && selectedEquipment.value && !isAttributeRefine.value) {
        const equipment = selectedEquipment.value
        const equipmentLevel = Number(equipment?.level ?? 0)
        const enhanceRatePerLevel = resolveEnhanceRatePerLevel(equipmentLevel, equipment?.rarity)
        const isWeapon = equipment?.category === 'weapon'
        const isArmor =
          equipment?.category === 'armor' && ['helmet', 'suit', 'gloves', 'boots', 'shield'].includes(equipment?.subcategory)
        const baseMin = Number(isWeapon ? equipment?.minAttack : equipment?.minDefense ?? 0)
        const baseMax = Number(isWeapon ? equipment?.maxAttack : equipment?.maxDefense ?? 0)
        const canCalculateEnhance =
          nextLevel > 0 &&
          Number.isFinite(baseMin) &&
          Number.isFinite(baseMax) &&
          enhanceRatePerLevel > 0 &&
          (isWeapon || isArmor)
        const enhancedMin = canCalculateEnhance
          ? Math.round(baseMin * (1 + enhanceRatePerLevel * nextLevel))
          : null
        const enhancedMax = canCalculateEnhance
          ? Math.round(baseMax * (1 + enhanceRatePerLevel * nextLevel))
          : null
        
        // 终极首饰只记录强化等级和精炼次数
        if (isUltimateJewelryTarget.value) {
          selectedEquipment.value.enhanceLevel = nextLevel
          selectedEquipment.value.StrengthenedAttributes = {
            ...(selectedEquipment.value.StrengthenedAttributes || {}),
            enhanceLevel: nextLevel,
            refineCount: refineCount
          }
        } else {
          selectedEquipment.value.enhanceLevel = nextLevel
          selectedEquipment.value.StrengthenedAttributes = {
            ...(selectedEquipment.value.StrengthenedAttributes || {}),
            enhanceLevel: nextLevel,
            ...(canCalculateEnhance
              ? {
                ...(isWeapon
                  ? {
                    enhancedMinAttack: enhancedMin,
                    enhancedMaxAttack: enhancedMax
                  }
                  : {
                    enhancedMinDefense: enhancedMin,
                    enhancedMaxDefense: enhancedMax
                  }),
                [String(nextLevel)]: {
                  enhanceLevel: nextLevel,
                  ...(isWeapon
                    ? {
                      enhancedMinAttack: enhancedMin,
                      enhancedMaxAttack: enhancedMax
                    }
                    : {
                      enhancedMinDefense: enhancedMin,
                      enhancedMaxDefense: enhancedMax
                    })
                }
              }
              : {})
          }
        }
      }

      if (!broke && selectedEquipment.value && isAttributeRefine.value) {
        const elementKey = attributeElementKey.value
        const elementLabel = elementKey ? attributeElementLabels[elementKey] : null
        const attackPercent = elementKey ? Math.min(20, nextLevel * 2) : 0
        // 判断是否为衣服（suit），衣服属性精炼产生元素抗性加成
        const isSuit = selectedEquipment.value?.category === 'armor' && selectedEquipment.value?.subcategory === 'suit'
        // 衣服的元素抗性加成（基于当前等级计算，等级变化时自动更新）
        const elementResistances = (isSuit && elementKey) ? calculateSuitElementalResistances(elementKey, nextLevel) : null
        const elementalEnhancement = {
          ...(selectedEquipment.value.elementalEnhancement ||
            selectedEquipment.value.StrengthenedAttributes?.elementalEnhancement ||
            {})
        }
        const currentCount = Number(elementalEnhancement.attributeEnhanceCount ?? 0)
        elementalEnhancement.attributeEnhanceCount = currentCount + 1
        // 无论成功或失败都更新元素数据，确保等级变化时抗性数据同步更新
        if (elementKey) {
          elementalEnhancement[elementKey] = {
            elementAttribute: elementLabel,
            enhancementLevel: nextLevel,
            elementAttackPercent: attackPercent,
            ...(elementResistances ? { elementResistances } : {})
          }
        }
        selectedEquipment.value.elementalEnhancement = elementalEnhancement
      }

      const equipmentSnapshot = selectedEquipment.value

      if (isSuccess) {
        resetEnhanceBoost()
        enhanceResultType.value = 'success'
        enhanceResultKey.value += 1
        emit('enhance-success', {
          equipment: equipmentSnapshot,
          refineMode: isAttributeRefine.value ? 'attribute' : 'enhance',
          attributeElementKey: isAttributeRefine.value ? attributeElementKey.value : null,
          attributeLevel: isAttributeRefine.value ? nextLevel : null
        })
      } else {
        if (!isUltimateEnhanceTarget.value) {
          enhanceFailCount.value += 1
          const boostIncrease = Number(baseProbability.value ?? 0) * 0.2
          lastBoostIncrease.value = Number.isFinite(boostIncrease) ? boostIncrease : 0
          boostAnimationKey.value += 1
        }
        enhanceResultType.value = 'failure'
        enhanceResultKey.value += 1
        emit('enhance-failure', {
          equipment: equipmentSnapshot,
          refineMode: isAttributeRefine.value ? 'attribute' : 'enhance',
          attributeElementKey: isAttributeRefine.value ? attributeElementKey.value : null,
          attributeLevel: isAttributeRefine.value ? nextLevel : null
        })
      }

      const equipmentLevel = Number(equipmentSnapshot?.level ?? 0)
      const enhanceRatePerLevel = resolveEnhanceRatePerLevel(equipmentLevel, equipmentSnapshot?.rarity)
      const isWeapon = equipmentSnapshot?.category === 'weapon'
      const isArmor =
        equipmentSnapshot?.category === 'armor' &&
        ['helmet', 'suit', 'gloves', 'gauntlet', 'boots', 'shield'].includes(equipmentSnapshot?.subcategory)
      const baseMin = Number(isWeapon ? equipmentSnapshot?.minAttack : equipmentSnapshot?.minDefense ?? 0)
      const baseMax = Number(isWeapon ? equipmentSnapshot?.maxAttack : equipmentSnapshot?.maxDefense ?? 0)
      const canCalculateEnhance =
        !isAttributeRefine.value &&
        !broke &&
        nextLevel > 0 &&
        Number.isFinite(baseMin) &&
        Number.isFinite(baseMax) &&
        enhanceRatePerLevel > 0 &&
        (isWeapon || isArmor)
      const enhancedMin = canCalculateEnhance
        ? Math.round(baseMin * (1 + enhanceRatePerLevel * nextLevel))
        : null
      const enhancedMax = canCalculateEnhance
        ? Math.round(baseMax * (1 + enhanceRatePerLevel * nextLevel))
        : null
      const elementKey = isAttributeRefine.value ? attributeElementKey.value : null
      const elementLabel = elementKey ? attributeElementLabels[elementKey] : null
      const elementAttackPercent = elementKey ? Math.min(20, nextLevel * 2) : null
      // 衣服属性精炼的元素抗性数据
      const isSuitAttributeRefine = isAttributeRefine.value &&
        selectedEquipment.value?.category === 'armor' &&
        selectedEquipment.value?.subcategory === 'suit'
      const attributeElementResistances = (isSuitAttributeRefine && elementKey)
        ? calculateSuitElementalResistances(elementKey, nextLevel)
        : null

      const applyPayload = {
        materialId: selectedMaterial.value?.id ?? null,
        protectionScrollId: hasProtectionScroll ? scrollId : null,
        scrollConsumed: !isSuccess && hasProtectionScroll,
        equipmentId: selectedEquipmentMeta.value?.id ?? selectedEquipment.value?.id ?? null,
        equipmentUniqueId: selectedEquipmentMeta.value?.uniqueId ?? null,
        equipmentBagIndex: selectedEquipmentMeta.value?.bagIndex ?? null,
        success: isSuccess,
        broke,
        newEnhanceLevel: nextLevel,
        enhanceCost: cost,
        enhancedMinAttack: isWeapon ? enhancedMin : null,
        enhancedMaxAttack: isWeapon ? enhancedMax : null,
        enhancedMinDefense: isArmor ? enhancedMin : null,
        enhancedMaxDefense: isArmor ? enhancedMax : null,
        refineMode: refineMode.value,
        attributeElementKey: elementKey,
        attributeElementLabel: elementLabel,
        attributeEnhanceLevel: isAttributeRefine.value ? nextLevel : null,
        attributeAttackPercent: isAttributeRefine.value ? elementAttackPercent : null,
        attributeElementResistances
      }
      emit('enhance-apply', applyPayload)

      if (broke) {
        selectedEquipment.value = null
        selectedEquipmentMeta.value = null
      }
    }

    const proceedEnhance = () => {
      if (!canEnhance.value) {
        return
      }
      enhanceCooldownActive.value = true
      if (enhanceCooldownTimer) {
        clearTimeout(enhanceCooldownTimer)
      }
      enhanceCooldownTimer = setTimeout(() => {
        enhanceCooldownActive.value = false
        enhanceCooldownTimer = null
      }, 1000)

      const cost = Number(enhanceCost.value ?? 0)
      if (cost > 0) {
        const currentGold = Number(props.player?.gold ?? itemsStore.playerGold ?? 0)
        if (!Number.isFinite(currentGold) || currentGold < cost) {
    
          if (props.addBattleLog) {
            props.addBattleLog(`金币不足，需要 ${cost} Penya，当前只有 ${currentGold} Penya`, 'error')
          }
          return
        }
      }

      enhanceInProgress.value = true
      enhanceProgress.value = 0
      const startTime = Date.now()
      if (enhanceProgressInterval) {
        clearInterval(enhanceProgressInterval)
      }
      enhanceProgressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        enhanceProgress.value = Math.min(100, (elapsed / 1000) * 100)
        if (enhanceProgress.value >= 100) {
          clearInterval(enhanceProgressInterval)
          enhanceProgressInterval = null
        }
      }, 50)

      if (enhanceProgressTimer) {
        clearTimeout(enhanceProgressTimer)
      }
      enhanceProgressTimer = setTimeout(() => {
    
        enhanceProgress.value = 100
        finalizeEnhance(cost)
        enhanceInProgress.value = false
        enhanceProgressTimer = null
      }, 1000)
    }
    const performEnhance = () => {
      // 终极品质首饰必须使用终极防护卷轴
      if (
        !isAttributeRefine.value &&
        isUltimateJewelryTarget.value &&
        (!selectedScroll.value || Number(selectedScroll.value?.id) !== ultimateProtectionScrollId)
      ) {
        if (props.addBattleLog) {
          props.addBattleLog('终极品质首饰强化需要终极防护卷轴', 'warning')
        }
        return
      }
      // 终极品质首饰必须使用晶石
      if (
        !isAttributeRefine.value &&
        isUltimateJewelryTarget.value &&
        (!selectedMaterial.value || Number(selectedMaterial.value?.id) !== ultimateDiceMaterialId)
      ) {
        if (props.addBattleLog) {
          props.addBattleLog('终极品质首饰强化需要晶石', 'warning')
        }
        return
      }
      if (
        !isAttributeRefine.value &&
        isUltimateRarity.value &&
        !isUltimateJewelryTarget.value &&
        (!selectedScroll.value || Number(selectedScroll.value?.id) !== ultimateProtectionScrollId)
      ) {
        if (props.addBattleLog) {
          props.addBattleLog('终极品级强化需要终极防护卷轴', 'warning')
        }
        return
      }
      if (
        !isAttributeRefine.value &&
        isUltimateRarity.value &&
        !isUltimateJewelryTarget.value &&
        (!selectedMaterial.value || Number(selectedMaterial.value?.id) !== ultimateDiceMaterialId)
      ) {
        if (props.addBattleLog) {
          props.addBattleLog('终极品级强化需要晶石', 'warning')
        }
        return
      }
      // 终极首饰必须有防护卷轴，不能跳过
      if (selectedEquipment.value && selectedMaterial.value && !selectedScroll.value) {
        if (isAttributeRefine.value) {
          if (props.addBattleLog) {
            props.addBattleLog('属性精炼必须选择防护卷轴', 'warning')
          }
          return
        }
        if (isUltimateJewelryTarget.value) {
          if (props.addBattleLog) {
            props.addBattleLog('终极品质首饰强化必须选择终极防护卷轴', 'warning')
          }
          return
        }
    
        showMissingScrollConfirm.value = true
        return
      }
      proceedEnhance()
    }
    const canAutoEnhance = computed(() => {
      const targetLevel = Number(targetEnhanceLevel.value ?? 0)
      const maxLevel = Number(enhanceMaxLevel.value ?? 0)
      const requireUltimateJewelryScroll =
        !isAttributeRefine.value &&
        isUltimateJewelryTarget.value &&
        (!selectedScroll.value || Number(selectedScroll.value?.id) !== ultimateProtectionScrollId)
      const requireUltimateScroll =
        !isAttributeRefine.value &&
        isUltimateRarity.value &&
        !isUltimateJewelryTarget.value &&
        (!selectedScroll.value || Number(selectedScroll.value?.id) !== ultimateProtectionScrollId)
      const requireUltimateMaterial =
        !isAttributeRefine.value &&
        isUltimateRarity.value &&
        (!selectedMaterial.value || Number(selectedMaterial.value?.id) !== ultimateDiceMaterialId)
      return (
        selectedEquipment.value &&
        selectedMaterial.value &&
        selectedScroll.value &&
        selectedScrollStack.value > 0 &&
        !requireUltimateScroll &&
        !requireUltimateJewelryScroll &&
        !requireUltimateMaterial &&
        targetLevel >= 1 &&
        maxLevel > 0 &&
        targetLevel <= maxLevel &&
        displayEnhanceLevel.value < targetLevel &&
        !enhanceInProgress.value &&
        !enhanceCooldownActive.value &&
        successProbability.value > 0 &&
        !autoEnhanceActive.value
      )
    })
    const ensureAutoEnhanceReady = () => {
      if (!selectedEquipment.value) {
        stopAutoEnhance('装备已移除，自动强化已停止', 'warning')
        return false
      }
      if (!selectedScroll.value) {
        stopAutoEnhance('请先选择防护卷轴，自动强化已停止', 'warning')
        return false
      }
      // 终极首饰必须使用终极防护卷轴
      if (!isAttributeRefine.value && isUltimateJewelryTarget.value && Number(selectedScroll.value?.id) !== ultimateProtectionScrollId) {
        stopAutoEnhance('终极品质首饰强化需要终极防护卷轴，自动强化已停止', 'warning')
        return false
      }
      if (!isAttributeRefine.value && isUltimateRarity.value && !isUltimateJewelryTarget.value && Number(selectedScroll.value?.id) !== ultimateProtectionScrollId) {
        stopAutoEnhance('终极品级强化需要终极防护卷轴，自动强化已停止', 'warning')
        return false
      }
      if (selectedScrollStack.value < 1) {
        stopAutoEnhance('防护卷轴不足，自动强化已停止', 'warning')
        return false
      }
      if (isAttributeRefine.value) {
        const targetLevel = Number(displayEnhanceLevel.value ?? 0) + 1
        if (targetLevel >= 6) {
          const selectedId = Number(selectedMaterial.value?.id)
          if (!attributeCardIdsHigh.includes(selectedId)) {
            const candidate = availableMaterials.value.find(entry => {
              const itemId = Number(entry.item?.id)
              const quantity = Number(entry.quantity ?? entry.item?.currentStack ?? entry.item?.quantity ?? 0)
              return attributeCardIdsHigh.includes(itemId) && Number.isFinite(quantity) && quantity > 0
            })
            if (!candidate) {
              stopAutoEnhance('属性精炼6-10级卡片不足，自动强化已停止', 'warning')
              return false
            }
            selectedMaterial.value = { ...candidate.item }
          }
          const stack = Number(selectedMaterial.value?.currentStack ?? selectedMaterial.value?.quantity ?? 0)
          if (!Number.isFinite(stack) || stack < 1) {
            stopAutoEnhance('属性精炼6-10级卡片不足，自动强化已停止', 'warning')
            return false
          }
        }
      }
      if (!selectedMaterial.value || selectedMaterialStack.value < 1) {
        stopAutoEnhance('强化材料不足，自动强化已停止', 'warning')
        return false
      }
      // 终极首饰必须使用晶石
      if (!isAttributeRefine.value && isUltimateJewelryTarget.value && Number(selectedMaterial.value?.id) !== ultimateDiceMaterialId) {
        stopAutoEnhance('终极品质首饰强化需要晶石，自动强化已停止', 'warning')
        return false
      }
      if (!isAttributeRefine.value && isUltimateRarity.value && !isUltimateJewelryTarget.value && Number(selectedMaterial.value?.id) !== ultimateDiceMaterialId) {
        stopAutoEnhance('终极品级强化需要晶石，自动强化已停止', 'warning')
        return false
      }
      const targetLevel = Number(targetEnhanceLevel.value ?? 0)
      const maxLevel = Number(enhanceMaxLevel.value ?? 0)
      if (!Number.isFinite(targetLevel) || targetLevel < 1 || targetLevel > maxLevel) {
        stopAutoEnhance('目标强化等级无效，自动强化已停止', 'warning')
        return false
      }
      if (displayEnhanceLevel.value >= targetLevel) {
        stopAutoEnhance('已达到目标强化等级，自动强化已停止', 'info')
        return false
      }
      const cost = Number(enhanceCost.value ?? 0)
      if (cost > 0) {
        const currentGold = Number(props.player?.gold ?? itemsStore.playerGold ?? 0)
        if (!Number.isFinite(currentGold) || currentGold < cost) {
          stopAutoEnhance(`金币不足，需要 ${cost} Penya，当前只有 ${currentGold} Penya`, 'error')
          return false
        }
      }
      return true
    }
    const scheduleAutoEnhance = () => {
      if (!autoEnhanceActive.value) {
        return
      }
      if (!ensureAutoEnhanceReady()) {
        return
      }
      if (enhanceInProgress.value || enhanceCooldownActive.value) {
        autoEnhanceTimer = setTimeout(scheduleAutoEnhance, 200)
        return
      }
      if (!canEnhance.value) {
        autoEnhanceTimer = setTimeout(scheduleAutoEnhance, 200)
        return
      }
      proceedEnhance()
    }
    const startAutoEnhance = () => {
      if (autoEnhanceActive.value) {
        return
      }
      autoEnhanceActive.value = true
      scheduleAutoEnhance()
    }
    const toggleAutoEnhance = () => {
      if (autoEnhanceActive.value) {
        stopAutoEnhance('已停止自动强化', 'info')
        return
      }
      startAutoEnhance()
    }
    const confirmProceedWithoutScroll = () => {
      showMissingScrollConfirm.value = false
  
      proceedEnhance()
    }
    const cancelProceedWithoutScroll = () => {
      showMissingScrollConfirm.value = false
    }

    onUnmounted(() => {
      if (enhanceCooldownTimer) {
        clearTimeout(enhanceCooldownTimer)
        enhanceCooldownTimer = null
      }
      if (enhanceProgressTimer) {
        clearTimeout(enhanceProgressTimer)
        enhanceProgressTimer = null
      }
      if (enhanceProgressInterval) {
        clearInterval(enhanceProgressInterval)
        enhanceProgressInterval = null
      }
      if (autoEnhanceTimer) {
        clearTimeout(autoEnhanceTimer)
        autoEnhanceTimer = null
      }
    })
    watch(
      () => enhanceInProgress.value,
      inProgress => {
        if (autoEnhanceActive.value && !inProgress) {
          scheduleAutoEnhance()
        }
      }
    )

    const showItemTooltip = (event, item) => {
      if (!item) {
        return
      }

      const tooltipEvent = new CustomEvent('show-item-tooltip', {
        detail: {
          item,
          position: { x: event.clientX, y: event.clientY }
        }
      })
      window.dispatchEvent(tooltipEvent)
    }

    const hideItemTooltip = () => {
      const tooltipEvent = new CustomEvent('hide-item-tooltip')
      window.dispatchEvent(tooltipEvent)
    }

    const updateTooltipPosition = event => {
      const tooltipEvent = new CustomEvent('move-item-tooltip', {
        detail: {
          position: { x: event.clientX, y: event.clientY }
        }
      })
      window.dispatchEvent(tooltipEvent)
    }

    return {
      selectedEquipment,
      selectedMaterial,
      selectedScroll,
      refineMode,
      switchRefineMode,
      panelTitle,
      showProbabilityReference,
      toggleProbabilityReference,
      showEquipmentSelectorPanel,
      showMaterialSelectorPanel,
      showScrollSelectorPanel,
      availableEquipments,
      availableMaterials,
      availableScrolls,
      materialEmptyText,
      getItemIcon,
      getItemName,
      instructionText,
      materialSlotTitle,
      materialSelectorTitle,
      enhanceLevelLabel,
      displayEnhanceLevel,
      isAttributeRefine,
      successProbability,
      breakProbability,
      canEnhance,
      enhanceProgress,
      enhanceProgressText,
      enhanceInProgress,
      autoEnhanceActive,
      enhanceResultType,
      enhanceResultKey,
      enhanceCost,
      targetEnhanceLevel,
      targetEnhanceOptions,
      enhanceMaxLevel,
      showModeMenu,
      close,
      showEquipmentSelector,
      hideEquipmentSelector,
      showMaterialSelector,
      hideMaterialSelector,
      showScrollSelector,
      hideScrollSelector,
      selectEquipment,
      selectMaterial,
      selectScroll,
      performEnhance,
      startAutoEnhance,
      toggleAutoEnhance,
      canAutoEnhance,
      confirmProceedWithoutScroll,
      cancelProceedWithoutScroll,
      showMissingScrollConfirm,
      selectedEquipmentMeta,
      showItemTooltip,
      hideItemTooltip,
      updateTooltipPosition,
      panelPosition,
      panelRef,
      panelStyle,
      panelWidth,
      panelHeight,
      scaleRatio,
      contentStyle,
      startDrag,
      startResize,
      selectedEquipmentLevel,
      selectedEquipmentEnhanceAbilities,
      suitResistancePreview,
      suitResistancePreviewNext,
      selectedMaterialStack,
      selectedScrollStack,
      resetSelections,
      isUltimateEnhanceTarget,
      isUltimateJewelryTarget,
      isUltimateWeaponProtected,
      scrollEmptyText,
      probabilityReferenceTitle,
      probabilityReferenceRows,
      ultimateSuccessLevelChances,
      ultimateFailLevelChances,
      referenceStyle,
      lastBoostIncrease,
      boostAnimationKey,
      // 选择面板拖拽
      equipmentSelectorPosition,
      materialSelectorPosition,
      scrollSelectorPosition,
      startEquipmentSelectorDrag,
      startMaterialSelectorDrag,
      startScrollSelectorDrag
    }
  }
}
</script>

<style scoped>
/* 过渡动画 */
.enhance-panel-fade-enter-active,
.enhance-panel-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.enhance-panel-fade-enter-from,
.enhance-panel-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* 容器 */
.enhance-panel {
  position: fixed;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  user-select: none;
  overflow: hidden;
}

/* 头部 */
.enhance-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(90deg, #2a2a4a 0%, #3a3a5a 100%);
  border-radius: 10px 10px 0 0;
  cursor: move;
}

.enhance-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.enhance-panel-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 2px solid #6a6a8a;
}

.enhance-panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.enhance-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.enhance-help-btn {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #4a6a9a 0%, #3a5a8a 100%);
  border: 2px solid #6a8aba;
  border-radius: 50%;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.enhance-help-btn:hover {
  background: linear-gradient(135deg, #5a7aaa 0%, #4a6a9a 100%);
  border-color: #8aaaca;
  box-shadow: 0 0 10px rgba(106, 138, 186, 0.5);
}

.enhance-help-btn.active {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-color: #ffdd44;
  color: #1a1a2a;
}

.enhance-close-btn {
  width: 32px;
  height: 32px;
  background: #4a4a6a;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.enhance-close-btn:hover {
  background: #ff4444;
}

/* 主体 */
.enhance-body-wrapper {
  display: flex;
  height: calc(100% - 60px);
}

/* 左侧菜单 */
.enhance-sidebar {
  width: 160px;
  min-width: 120px;
  background: linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%);
  border-right: 1px solid #3a3a5a;
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.enhance-dialog {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
}

.enhance-dialog-text {
  font-size: 11px;
  color: #aaa;
  line-height: 1.5;
  margin: 0;
}

.enhance-menu-title {
  font-size: 12px;
  color: #888;
  padding: 8px 0;
  border-bottom: 1px solid #3a3a5a;
  margin-bottom: 8px;
}

.enhance-menu-item {
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 4px;
  background: linear-gradient(90deg, #3a3a5a 0%, #2a2a4a 100%);
  border: 1px solid #4a4a6a;
  border-radius: 6px;
  color: #ccc;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.enhance-menu-item:hover {
  background: linear-gradient(90deg, #4a4a6a 0%, #3a3a5a 100%);
  border-color: #6a6a8a;
}

.enhance-menu-item.active {
  background: linear-gradient(90deg, #ffd700 0%, #ffaa00 100%);
  border-color: #ffdd44;
  color: #1a1a2a;
  font-weight: bold;
}

/* 右侧内容 */
.enhance-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.enhance-main {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.enhance-instructions {
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.enhance-instructions p {
  color: #fff;
  font-size: 13px;
  margin: 0;
  text-align: center;
}

/* 槽位 */
.enhance-slots {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}

.slot-container {
  text-align: center;
  flex: 1;
  min-width: 100px;
}

.slot-container h3 {
  color: #ffd700;
  font-size: 14px;
  margin-bottom: 8px;
}

.slot {
  position: relative;
  width: 80px;
  height: 80px;
  border: 2px dashed #4a4a6a;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.05);
}

.slot:hover {
  background: rgba(255, 215, 0, 0.15);
  border-color: #ffd700;
  transform: translateY(-2px);
}

.slot-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.75);
  color: #ffd700;
  font-size: 11px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.slot-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-bottom: 4px;
}

.slot-placeholder {
  width: 48px;
  height: 48px;
  object-fit: contain;
  opacity: 0.7;
}

.slot-name {
  color: #fff;
  font-size: 11px;
  text-align: center;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.equipment-info {
  color: #fff;
  font-size: 12px;
  margin-top: 6px;
}

.equipment-enhance-abilities {
  margin-top: 4px;
  font-size: 11px;
  color: #cfe9ff;
}

.equipment-enhance-title {
  color: #ffd700;
  margin-bottom: 2px;
}

.equipment-enhance-ability {
  line-height: 1.3;
}

.resist-negative {
  color: #ff6b6b;
}

/* 概率显示 */
.enhance-probability {
  margin-bottom: 16px;
}

.enhance-probability h3 {
  color: #ffd700;
  text-align: center;
  font-size: 14px;
  margin-bottom: 8px;
}

.probability-row {
  display: flex;
  align-items: center;
}

.probability-bar {
  width: 100%;
  height: 28px;
  background: #2a2a3a;
  border-radius: 14px;
  position: relative;
  overflow: hidden;
}

.probability-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff9900, #ff6600);
  border-radius: 14px;
  transition: width 0.5s;
}

.probability-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  white-space: nowrap;
}

.ultimate-enhance-chances {
  margin-top: 8px;
  border: 1px solid rgba(255, 215, 0, 0.35);
  border-radius: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  font-size: 11px;
}

.ultimate-chance-title {
  text-align: center;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 6px;
}

.ultimate-chance-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.ultimate-chance-label {
  min-width: 60px;
  color: #b9ffb9;
  font-weight: bold;
}

.ultimate-chance-values {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 终极防护卷轴保护提示 */
.ultimate-protection-hint {
  margin-top: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(0, 255, 136, 0.15);
  border: 1px solid rgba(0, 255, 136, 0.4);
  color: #00ff88;
  font-size: 11px;
  text-align: center;
}

/* 进度条 */
.enhance-progress {
  margin-bottom: 16px;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #2a2a3a;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #55d36b, #29b35a);
  border-radius: 10px;
  transition: width 0.1s linear;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  font-size: 11px;
}

/* 操作按钮 */
.enhance-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(74, 74, 106, 0.5);
}

.enhance-cost {
  width: 100%;
  margin-bottom: 8px;
  color: #ffd700;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
}

.auto-enhance-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.auto-enhance-select {
  padding: 8px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 215, 0, 0.6);
  background: rgba(0, 0, 0, 0.35);
  color: #ffd700;
  font-size: 13px;
  min-width: 100px;
  outline: none;
  cursor: pointer;
}

.auto-enhance-select:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.auto-enhance-button {
  padding: 10px 18px;
  background: linear-gradient(135deg, #3bb3ff, #1e7ddc);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(30, 125, 220, 0.35);
}

.auto-enhance-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(30, 125, 220, 0.5);
}

.auto-enhance-button:disabled {
  background: #555;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.enhance-button {
  padding: 10px 24px;
  background: linear-gradient(135deg, #ff9900, #ff6600);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(255, 102, 0, 0.3);
}

.enhance-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(255, 102, 0, 0.5);
}

.enhance-button:disabled {
  background: #555;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.reset-button {
  padding: 10px 18px;
  background: linear-gradient(135deg, #5a6b7c, #3f4d5c);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(63, 77, 92, 0.3);
}

.reset-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(63, 77, 92, 0.5);
}

/* 概率参考面板 */
.enhance-probability-reference {
  position: fixed;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1001;
  background: linear-gradient(135deg, #2a2a4a 0%, #1a1a2e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 8px;
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.5);
}

.probability-table {
  overflow: hidden;
}

.probability-table-title {
  padding: 10px 12px;
  font-weight: bold;
  color: #ffd700;
  background: linear-gradient(90deg, #3a3a5a 0%, #4a4a6a 100%);
  text-align: center;
  font-size: 13px;
}

.probability-table-rows {
  padding: 8px;
  max-height: 200px;
  overflow: auto;
}

.probability-table-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 2px;
  color: #fff;
  font-size: 11px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.probability-table-row:last-child {
  border-bottom: none;
}

.probability-table-level {
  color: #ffd700;
  font-weight: bold;
}

.probability-table-value {
  color: #fff;
  min-width: 40px;
  text-align: right;
}

.probability-table-cost {
  color: #b9ffb9;
  min-width: 60px;
  text-align: right;
}

.probability-empty-hint {
  color: #fff;
  font-size: 12px;
  text-align: center;
  padding: 10px;
  border: 1px dashed rgba(255, 215, 0, 0.4);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
}

/* 选择面板 */
.equipment-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1100;
  pointer-events: none;
}

.equipment-selector-panel {
  position: fixed;
  background: linear-gradient(135deg, #2c3e50, #1a1a2e);
  border-radius: 12px;
  width: 380px;
  max-height: 320px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border: 2px solid #4a4a6a;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
}

.equipment-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(90deg, #3a3a5a 0%, #4a4a6a 100%);
  border-radius: 10px 10px 0 0;
}

.equipment-selector-header h3 {
  color: #ffd700;
  font-size: 16px;
  margin: 0;
}

.equipment-selector-header.draggable-header {
  cursor: move;
  user-select: none;
}

.equipment-selector-header.draggable-header:hover {
  background: linear-gradient(90deg, #4a4a6a 0%, #5a5a7a 100%);
}

.close-button {
  background: #4a4a6a;
  color: white;
  border: none;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-button:hover {
  background: #ff4444;
}

.equipment-selector-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.no-equipment {
  color: #aaa;
  text-align: center;
  padding: 20px;
  font-size: 13px;
}

.equipment-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.equipment-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.equipment-item:hover {
  background: rgba(255, 215, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.5);
  transform: translateY(-2px);
}

.equipment-item-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.equipment-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  align-items: center;
}

.equipment-item-name {
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.equipment-item-level {
  color: #888;
  font-size: 10px;
}

.equipment-item-enhance {
  color: #ffd700;
  font-size: 10px;
  font-weight: bold;
}

.material-item-quantity {
  color: #888;
  font-size: 10px;
}

/* 确认对话框 */
.confirm-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  pointer-events: none;
}

.confirm-dialog-bottom {
  top: 0;
  align-items: flex-start;
  padding-top: calc(50vh + 200px);
}

.confirm-content {
  background: linear-gradient(135deg, #2a2a4a 0%, #1a1a2e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 10px;
  padding: 24px;
  text-align: center;
  max-width: 360px;
  width: 90%;
  color: #fff;
  pointer-events: auto;
}

.confirm-content p {
  margin: 0 0 16px;
}

.confirm-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.confirm-buttons button {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s;
}

.confirm-buttons button:first-child {
  background: linear-gradient(135deg, #4a8a4a, #3a6a3a);
  color: white;
}

.confirm-buttons button:first-child:hover {
  background: linear-gradient(135deg, #5a9a5a, #4a7a4a);
}

.confirm-buttons button:last-child {
  background: linear-gradient(135deg, #8a4a4a, #6a3a3a);
  color: white;
}

.confirm-buttons button:last-child:hover {
  background: linear-gradient(135deg, #9a5a5a, #7a4a4a);
}

/* 滚动条样式 */
.enhance-content::-webkit-scrollbar,
.equipment-selector-content::-webkit-scrollbar,
.probability-table-rows::-webkit-scrollbar {
  width: 6px;
}

.enhance-content::-webkit-scrollbar-track,
.equipment-selector-content::-webkit-scrollbar-track,
.probability-table-rows::-webkit-scrollbar-track {
  background: #1a1a2e;
  border-radius: 3px;
}

.enhance-content::-webkit-scrollbar-thumb,
.equipment-selector-content::-webkit-scrollbar-thumb,
.probability-table-rows::-webkit-scrollbar-thumb {
  background: #4a4a6a;
  border-radius: 3px;
}

.enhance-content::-webkit-scrollbar-thumb:hover,
.equipment-selector-content::-webkit-scrollbar-thumb:hover,
.probability-table-rows::-webkit-scrollbar-thumb:hover {
  background: #5a5a7a;
}
</style>
