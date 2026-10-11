<template>
  <Transition name="panel-fade" appear>
    <div
      v-if="isVisible"
      class="perforation-panel-wrap"
      :style="panelStyle"
    >
      <!-- 拉伸手柄 -->
      <PanelResizeHandle @pointerdown="startResize" />
      <div class="perforation-panel__inner" :style="contentStyle" @mousedown="startDrag">
        <div class="perforation-header">
          <div class="perforation-title-area">
            <img src="/pt/npc_icon/remine.png" class="perforation-npc-icon" alt="NPC" />
            <h2>装备穿洞</h2>
          </div>
          <div class="perforation-header-actions">
            <button
              class="perforation-help-btn"
              :class="{ active: showPerforationProbability }"
              type="button"
              title="显示/隐藏穿洞概率"
              @click.stop="togglePerforationProbability"
            >
              ?
            </button>
            <button class="close-button" @click="close">&times;</button>
          </div>
        </div>

        <div class="perforation-content">
          <div class="perforation-instructions">
            <p>将装备放入左侧槽位，放入穿洞材料和防护卷轴后点击穿洞按钮进行穿洞。</p>
          </div>

          <div class="perforation-slots">
            <div class="slot-container">
              <h3>装备</h3>
              <div class="slot equipment-slot" @click.stop="showEquipmentSelector">
                <img
                  v-if="selectedEquipmentDisplay"
                  :src="getItemIcon(selectedEquipmentDisplay)"
                  :alt="getItemName(selectedEquipmentDisplay)"
                  class="slot-icon"
                  @mouseenter="showItemTooltip($event, selectedEquipmentDisplay)"
                  @mouseleave="hideItemTooltip"
                  @mousemove="updateTooltipPosition"
                />
                <img v-else src="/pt/UI/武器或装备.png" alt="武器或装备" class="slot-placeholder" />
                <div v-if="selectedEquipmentDisplay" class="slot-name">{{ getItemName(selectedEquipmentDisplay) }}</div>
              </div>
              <div v-if="selectedEquipmentDisplay" class="equipment-info">
                <div>当前穿洞数: {{ currentHoleCount }}/{{ maxHoles }}</div>
              </div>
            </div>

            <div class="slot-container">
              <h3>穿洞材料</h3>
              <div class="slot material-slot" @click.stop="showMaterialSelector">
                <img
                  v-if="selectedMaterialDisplay"
                  :src="getItemIcon(selectedMaterialDisplay)"
                  :alt="getItemName(selectedMaterialDisplay)"
                  class="slot-icon"
                  @mouseenter="showItemTooltip($event, selectedMaterialDisplay)"
                  @mouseleave="hideItemTooltip"
                  @mousemove="updateTooltipPosition"
                />
                <img v-else src="/pt/UI/穿孔道具.png" alt="默认材料" class="slot-placeholder" />
                <div v-if="selectedMaterialDisplay && selectedMaterialStack > 0" class="slot-badge">
                  {{ selectedMaterialStack }}
                </div>
                <div v-if="selectedMaterialDisplay" class="slot-name">{{ getItemName(selectedMaterialDisplay) }}</div>
              </div>
            </div>

            <div class="slot-container">
              <h3>防护卷轴</h3>
              <div class="slot scroll-slot" @click.stop="showScrollSelector">
                <img
                  v-if="selectedScrollDisplay"
                  :src="getItemIcon(selectedScrollDisplay)"
                  :alt="getItemName(selectedScrollDisplay)"
                  class="slot-icon"
                  @mouseenter="showItemTooltip($event, selectedScrollDisplay)"
                  @mouseleave="hideItemTooltip"
                  @mousemove="updateTooltipPosition"
                />
                <img v-else src="/pt/UI/穿洞防护卷轴.png" alt="穿洞防护卷轴" class="slot-placeholder" />
                <div v-if="selectedScrollDisplay && selectedScrollStack > 0" class="slot-badge">
                  {{ selectedScrollStack }}
                </div>
                <div v-if="selectedScrollDisplay" class="slot-name">{{ getItemName(selectedScrollDisplay) }}</div>
              </div>
            </div>
          </div>

          <div class="perforation-probability">
            <h3>穿洞成功率</h3>
            <div class="probability-bar">
              <div class="probability-fill" :style="{ width: successProbability + '%' }"></div>
              <div class="probability-text">
                <span>成功 {{ successProbability }}%</span>
                <span>破碎 {{ currentBreakRate }}%</span>
                <ProbabilityBoostAnimation :value="lastBoostIncrease" :trigger-key="boostAnimationKey" />
              </div>
            </div>
            <div class="perforation-progress">
              <div class="progress-row">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: perforationProgress + '%' }"></div>
                  <div class="progress-text">{{ perforationProgressText }}%</div>
                </div>
                <EnhancementAnimation v-if="perforationInProgress" />
              </div>
            </div>
            <div v-if="perforationCost > 0" class="perforation-cost">
              本次穿洞费用: {{ perforationCost }} Penya
            </div>
          </div>

          <div class="perforation-actions">
            <div class="auto-perforation-controls">
              <select
                v-model.number="targetPerforationHole"
                class="auto-perforation-select"
                :disabled="maxHoles === 0"
              >
                <option v-if="maxHoles === 0" :value="0" disabled>请选择目标孔数</option>
                <option
                  v-for="hole in targetPerforationOptions"
                  :key="`target-hole-${hole}`"
                  :value="hole"
                >
                  {{ hole }}孔
                </option>
              </select>
              <button
                class="auto-perforation-button"
                type="button"
                :disabled="autoPerforateActive ? false : !canAutoPerforate"
                @click="toggleAutoPerforate"
              >
                {{ autoPerforateActive ? '停止自动穿洞' : '自动穿洞' }}
              </button>
            </div>
            <button class="perforation-button" :disabled="!canPerforate" @click="performPerforation">
              穿洞
            </button>
            <button class="reset-button" type="button" @click="resetSelections">
              重置
            </button>
          </div>
        </div>
      </div>

    <div
      v-if="showEquipmentSelectorPanel"
      class="equipment-selector-overlay"
      @click="hideEquipmentSelector"
    >
      <div
        class="equipment-selector-panel"
        :style="{ left: selectorPanelPositions.equipment.x + 'px', top: selectorPanelPositions.equipment.y + 'px' }"
        @click.stop
      >
        <div class="equipment-selector-header" @mousedown.stop="startEquipmentSelectorDrag">
          <h3>选择装备</h3>
          <button class="close-button" @click="hideEquipmentSelector">&times;</button>
        </div>
        <div class="equipment-selector-content">
          <div v-if="availableEquipments.length === 0" class="no-equipment">
            没有可以穿洞的物品(可穿孔装备:武器,衣服,盾牌)
          </div>
          <div v-else class="equipment-list">
            <div
              v-for="entry in availableEquipments"
              :key="entry.key"
              class="equipment-item"
              @click="selectEquipment(entry)"
            >
              <img
                :src="getItemIcon(entry.item)"
                :alt="getItemName(entry.item)"
                class="equipment-item-icon"
                @mouseenter="showItemTooltip($event, entry.item)"
                @mouseleave="hideItemTooltip"
                @mousemove="updateTooltipPosition"
              />
              <div class="equipment-item-info">
                <div class="equipment-item-name">{{ getItemName(entry.item) }}</div>
                <div class="equipment-item-level">Lv.{{ entry.item.level }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showMaterialSelectorPanel"
      class="equipment-selector-overlay"
      @click="hideMaterialSelector"
    >
      <div
        class="equipment-selector-panel"
        :style="{ left: selectorPanelPositions.material.x + 'px', top: selectorPanelPositions.material.y + 'px' }"
        @click.stop
      >
        <div class="equipment-selector-header" @mousedown.stop="startMaterialSelectorDrag">
          <h3>穿洞材料选择</h3>
          <button class="close-button" @click="hideMaterialSelector">&times;</button>
        </div>
        <div class="equipment-selector-content">
          <div v-if="availableMaterials.length === 0" class="no-equipment">没有可用的穿洞材料</div>
          <div v-else class="equipment-list">
            <div
              v-for="entry in availableMaterials"
              :key="entry.key"
              class="equipment-item"
              @click="selectMaterial(entry)"
            >
              <img
                :src="getItemIcon(entry.item)"
                :alt="getItemName(entry.item)"
                class="equipment-item-icon"
                @mouseenter="showItemTooltip($event, entry.item)"
                @mouseleave="hideItemTooltip"
                @mousemove="updateTooltipPosition"
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
      v-if="showScrollSelectorPanel"
      class="equipment-selector-overlay"
      @click="hideScrollSelector"
    >
      <div
        class="equipment-selector-panel"
        :style="{ left: selectorPanelPositions.scroll.x + 'px', top: selectorPanelPositions.scroll.y + 'px' }"
        @click.stop
      >
        <div class="equipment-selector-header" @mousedown.stop="startScrollSelectorDrag">
          <h3>防护卷轴选择</h3>
          <button class="close-button" @click="hideScrollSelector">&times;</button>
        </div>
        <div class="equipment-selector-content">
          <div v-if="availableScrolls.length === 0" class="no-equipment">没有可用的穿洞防护卷轴</div>
          <div v-else class="equipment-list">
            <div
              v-for="entry in availableScrolls"
              :key="entry.key"
              class="equipment-item"
              @click="selectScroll(entry)"
            >
              <img
                :src="getItemIcon(entry.item)"
                :alt="getItemName(entry.item)"
                class="equipment-item-icon"
                @mouseenter="showItemTooltip($event, entry.item)"
                @mouseleave="hideItemTooltip"
                @mousemove="updateTooltipPosition"
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

    <div v-if="showMissingScrollConfirm" class="confirm-dialog confirm-dialog-bottom" @click.stop>
      <div class="confirm-content" @click.stop>
        <p>未选择防护卷轴，确认继续穿洞？</p>
        <div class="confirm-buttons">
          <button @click="confirmProceedWithoutScroll">确认</button>
          <button @click="cancelProceedWithoutScroll">取消</button>
        </div>
      </div>
    </div>

    <EnhanceResultAnimation
      :result="perforationResultType"
      :trigger-key="perforationResultKey"
      :center-x="panelPosition.x + 300"
      :center-y="panelPosition.y + 250"
    />

    <transition name="perforation-probability-fade">
      <div
        v-if="isVisible && showPerforationProbability"
        class="perforation-probability-reference"
        @click.stop
      >
        <div class="probability-header">
          <span class="probability-title">穿洞概率说明</span>
          <button class="probability-close" @click="showPerforationProbability = false">&times;</button>
        </div>
        <div class="probability-content">
          <div class="probability-table">
            <div class="probability-table-row">
              <div class="probability-table-level">当前设置</div>
              <div class="probability-table-value">
                成功率: {{ successProbability }}%
              </div>
              <div class="probability-table-cost">
                穿洞数: {{ currentHoleCount }}/{{ maxHoles }}
              </div>
            </div>
          </div>

          <div v-if="perforationProbabilityRows.length" class="probability-section">
            <div class="probability-section-title">穿洞等级（基础概率 / 费用）</div>
            <div class="probability-table-rows">
              <div
                v-for="row in perforationProbabilityRows"
                :key="`perforation-${row.targetHole}`"
                class="probability-table-row"
              >
                <div class="probability-table-level">
                  {{ row.targetHole }}孔
                </div>
                <div class="probability-table-value">
                  概率: {{ row.baseProbability }}%
                </div>
                <div class="probability-table-cost">
                  费用: {{ row.cost }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="probability-empty-hint">
            请选择装备后查看详细穿洞概率。
          </div>
        </div>
      </div>
    </transition>
    </div>
  </Transition>
</template>

<script>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useItemsStore } from '@/store/items'
import { getItemIcon, getItemName } from '@/utils/itemUtils'
import ProbabilityBoostAnimation from '@/components/ProbabilityBoostAnimation.vue'
import EnhancementAnimation from '@/components/EnhancementAnimation.vue'
import EnhanceResultAnimation from '@/components/EnhanceResultAnimation.vue'
import PanelResizeHandle from '@/components/common/PanelResizeHandle.vue'

export default {
  name: 'PerforationPanel',
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
    }
  },
  emits: ['close', 'perforation-success', 'perforation-failure', 'perforation-apply'],
  setup (props, { emit }) {
    const itemsStore = useItemsStore()
    const selectedEquipment = ref(null)
    const selectedMaterial = ref(null)
    const selectedScroll = ref(null)
    const selectedEquipmentMeta = ref(null)
    const selectedMaterialMeta = ref(null)
    const selectedScrollMeta = ref(null)

    const panelPosition = ref({ x: 0, y: 0 })
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })

    // 面板尺寸和拉伸
    const DEFAULT_WIDTH = 600
    const DEFAULT_HEIGHT = 520
    const MIN_WIDTH = 450
    const MIN_HEIGHT = 550
    const panelWidth = ref(DEFAULT_WIDTH)
    const panelHeight = ref(DEFAULT_HEIGHT)
    const isResizing = ref(false)
    const resizeStartX = ref(0)
    const resizeStartY = ref(0)
    const resizeStartWidth = ref(0)
    const resizeStartHeight = ref(0)

    // 缩放比例
    const scaleRatio = computed(() => Math.min(panelWidth.value / DEFAULT_WIDTH, panelHeight.value / DEFAULT_HEIGHT))

    // 面板样式
    const panelStyle = computed(() => ({
      left: `calc(50% - ${panelWidth.value / 2}px + ${panelPosition.value.x - window.innerWidth / 2 + panelWidth.value / 2}px)`,
      top: `calc(50% - ${panelHeight.value / 2}px + ${panelPosition.value.y - window.innerHeight / 2 + panelHeight.value / 2}px)`,
      width: `${panelWidth.value}px`,
      height: `${panelHeight.value}px`
    }))

    // 内容缩放样式
    const contentStyle = computed(() => ({
      transform: `scale(${scaleRatio.value})`,
      transformOrigin: 'top left',
      width: `${DEFAULT_WIDTH}px`,
      height: `${DEFAULT_HEIGHT}px`
    }))

    // 选择框面板拖动状态
    const selectorPanelPositions = ref({
      equipment: { x: 100, y: 100 },
      material: { x: 100, y: 100 },
      scroll: { x: 100, y: 100 }
    })
    const selectorDragState = ref({
      equipment: { isDragging: false, offset: { x: 0, y: 0 } },
      material: { isDragging: false, offset: { x: 0, y: 0 } },
      scroll: { isDragging: false, offset: { x: 0, y: 0 } }
    })

    const showEquipmentSelectorPanel = ref(false)
    const showMaterialSelectorPanel = ref(false)
    const showScrollSelectorPanel = ref(false)

    const showPerforationProbability = ref(false)
    const perforationResultType = ref('success')
    const perforationResultKey = ref(0)
    const perforationFailCount = ref(0)
    const lastBoostIncrease = ref(0)
    const boostAnimationKey = ref(0)
    const perforationInProgress = ref(false)
    const perforationProgress = ref(0)
    let perforationProgressTimer = null
    let perforationProgressInterval = null
    const autoPerforateActive = ref(false)
    const targetPerforationHole = ref(0)
    let autoPerforateTimer = null
    const showMissingScrollConfirm = ref(false)

    const initPanelPosition = () => {
      const panelWidth = 600
      const panelHeight = 500
      panelPosition.value = {
        x: (window.innerWidth - panelWidth) / 2,
        y: (window.innerHeight - panelHeight) / 2
      }
    }

    const startDrag = event => {
      isDragging.value = true
      dragOffset.value = {
        x: event.clientX - panelPosition.value.x,
        y: event.clientY - panelPosition.value.y
      }
      document.addEventListener('mousemove', onDrag)
      document.addEventListener('mouseup', stopDrag)
    }

    const onDrag = event => {
      if (!isDragging.value) {
        return
      }
      panelPosition.value = {
        x: event.clientX - dragOffset.value.x,
        y: event.clientY - dragOffset.value.y
      }
    }

    const stopDrag = () => {
      isDragging.value = false
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', stopDrag)
    }

    // 拉伸功能
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

    const handleResize = event => {
      if (!isResizing.value) return
      const deltaX = event.clientX - resizeStartX.value
      const deltaY = event.clientY - resizeStartY.value
      const deltaAvg = (deltaX + deltaY) / 2
      const aspectRatio = DEFAULT_WIDTH / DEFAULT_HEIGHT

      let newWidth = resizeStartWidth.value + deltaAvg * 2
      let newHeight = newWidth / aspectRatio

      newWidth = Math.max(MIN_WIDTH, newWidth)
      newHeight = Math.max(MIN_HEIGHT, newHeight)

      const maxWidth = window.innerWidth * 0.9
      const maxHeight = window.innerHeight * 0.9
      newWidth = Math.min(maxWidth, newWidth)
      newHeight = Math.min(maxHeight, newHeight)

      if (newWidth / newHeight > aspectRatio) {
        newWidth = newHeight * aspectRatio
      } else {
        newHeight = newWidth / aspectRatio
      }

      panelWidth.value = Math.round(newWidth)
      panelHeight.value = Math.round(newHeight)
    }

    const stopResize = () => {
      isResizing.value = false
      document.removeEventListener('pointermove', handleResize)
      document.removeEventListener('pointerup', stopResize)
    }

    // ========== 选择框面板拖动方法 ==========
    /**
     * 开始拖动装备选择面板
     */
    const startEquipmentSelectorDrag = event => {
      selectorDragState.value.equipment.isDragging = true
      selectorDragState.value.equipment.offset = {
        x: event.clientX - selectorPanelPositions.value.equipment.x,
        y: event.clientY - selectorPanelPositions.value.equipment.y
      }
      document.addEventListener('mousemove', onEquipmentSelectorDrag)
      document.addEventListener('mouseup', stopEquipmentSelectorDrag)
    }

    const onEquipmentSelectorDrag = event => {
      if (!selectorDragState.value.equipment.isDragging) return
      selectorPanelPositions.value.equipment = {
        x: event.clientX - selectorDragState.value.equipment.offset.x,
        y: event.clientY - selectorDragState.value.equipment.offset.y
      }
    }

    const stopEquipmentSelectorDrag = () => {
      selectorDragState.value.equipment.isDragging = false
      document.removeEventListener('mousemove', onEquipmentSelectorDrag)
      document.removeEventListener('mouseup', stopEquipmentSelectorDrag)
    }

    /**
     * 开始拖动材料选择面板
     */
    const startMaterialSelectorDrag = event => {
      selectorDragState.value.material.isDragging = true
      selectorDragState.value.material.offset = {
        x: event.clientX - selectorPanelPositions.value.material.x,
        y: event.clientY - selectorPanelPositions.value.material.y
      }
      document.addEventListener('mousemove', onMaterialSelectorDrag)
      document.addEventListener('mouseup', stopMaterialSelectorDrag)
    }

    const onMaterialSelectorDrag = event => {
      if (!selectorDragState.value.material.isDragging) return
      selectorPanelPositions.value.material = {
        x: event.clientX - selectorDragState.value.material.offset.x,
        y: event.clientY - selectorDragState.value.material.offset.y
      }
    }

    const stopMaterialSelectorDrag = () => {
      selectorDragState.value.material.isDragging = false
      document.removeEventListener('mousemove', onMaterialSelectorDrag)
      document.removeEventListener('mouseup', stopMaterialSelectorDrag)
    }

    /**
     * 开始拖动卷轴选择面板
     */
    const startScrollSelectorDrag = event => {
      selectorDragState.value.scroll.isDragging = true
      selectorDragState.value.scroll.offset = {
        x: event.clientX - selectorPanelPositions.value.scroll.x,
        y: event.clientY - selectorPanelPositions.value.scroll.y
      }
      document.addEventListener('mousemove', onScrollSelectorDrag)
      document.addEventListener('mouseup', stopScrollSelectorDrag)
    }

    const onScrollSelectorDrag = event => {
      if (!selectorDragState.value.scroll.isDragging) return
      selectorPanelPositions.value.scroll = {
        x: event.clientX - selectorDragState.value.scroll.offset.x,
        y: event.clientY - selectorDragState.value.scroll.offset.y
      }
    }

    const stopScrollSelectorDrag = () => {
      selectorDragState.value.scroll.isDragging = false
      document.removeEventListener('mousemove', onScrollSelectorDrag)
      document.removeEventListener('mouseup', stopScrollSelectorDrag)
    }

    initPanelPosition()

    const perforationReferenceStyle = computed(() => ({
      left: `${panelPosition.value.x + 600}px`,
      top: `${panelPosition.value.y}px`
    }))

    const resolveHoleCount = equipment => {
      if (!equipment) {
        return 0
      }
      const attrs = equipment.PerforationAttributes || {}
      if (typeof attrs.holeCount === 'number') {
        return attrs.holeCount
      }
      if (typeof equipment.holeCount === 'number') {
        return equipment.holeCount
      }
      return 0
    }

    const maxHoles = computed(() => {
      const equipment = selectedEquipmentDisplay.value
      if (!equipment) {
        return 0
      }
      if (equipment.category === 'weapon') {
        return 10
      }
      if (equipment.subcategory === 'suit') {
        return 4
      }
      if (equipment.subcategory === 'shield') {
        return 10
      }
      return 0
    })

    const currentHoleCount = computed(() => {
      return resolveHoleCount(selectedEquipmentDisplay.value)
    })

    const equipmentType = computed(() => {
      const equipment = selectedEquipmentDisplay.value
      if (!equipment) {
        return null
      }
      if (equipment.category === 'weapon' || equipment.subcategory === 'shield') {
        return 'weaponShield'
      }
      if (equipment.subcategory === 'suit') {
        return 'armorSuit'
      }
      return null
    })
    //武器穿孔概率表
    const weaponShieldProbabilityTable = {
      1: 50,
      2: 25,
      3: 12,
      4: 6.2,
      5: 3.1,
      6: 1.5,
      7: 1,
      8: 0.5,
      9: 0.3,
      10: 0.25
    }
    //护甲套装穿孔概率表
    const armorSuitProbabilityTable = {
      1: 40,
      2: 20,
      3: 10,
      4: 5
    }
    //武器和护盾穿孔成本表
    const weaponShieldCostTable = {
      1: 500000,
      2: 600000,
      3: 700000,
      4: 800000,
      5: 1000000,
      6: 1100000,
      7: 1200000,
      8: 1300000,
      9: 1500000,
      10: 2888888
    }
    //护甲套装穿孔成本表
    const armorSuitCostTable = {
      1: 688888,
      2: 888888,
      3: 1588888,
      4: 1988888
    }
    const perforationBreakTable = {
      1: 0,
      2: 10,
      3: 20,
      4: 30,
      5: 40,
      6: 50,
      7: 65,
      8: 75,
      9: 85,
      10: 95
    }

    const basePerforationProbability = computed(() => {
      const material = selectedMaterialDisplay.value
      const equipment = selectedEquipmentDisplay.value
      if (!equipment || !material) {
        return 0
      }
      const currentHoles = currentHoleCount.value
      const maxHoleCount = maxHoles.value
      if (currentHoles >= maxHoleCount || maxHoleCount <= 0) {
        return 0
      }
      const targetHole = currentHoles + 1
      let baseProbability = 0
      if (equipmentType.value === 'weaponShield') {
        baseProbability = Number(weaponShieldProbabilityTable[targetHole] ?? 0)
      } else if (equipmentType.value === 'armorSuit') {
        baseProbability = Number(armorSuitProbabilityTable[targetHole] ?? 0)
      }
      if (!Number.isFinite(baseProbability) || baseProbability <= 0) {
        return 0
      }
      let multiplier = 1
      if (Number(material.id) === 9344) {
        multiplier = 2
      }
      const finalProbability = baseProbability * multiplier
      const clamped = Math.max(0, Math.min(100, finalProbability))
      return Number.isFinite(clamped) ? clamped : 0
    })

    const successProbability = computed(() => {
      const base = Number(basePerforationProbability.value ?? 0)
      if (!Number.isFinite(base) || base <= 0) {
        return 0
      }
      const boosted = Math.min(100, base * (1 + perforationFailCount.value * 0.2))
      return Math.round(boosted * 10000) / 10000
    })

    const currentBreakRate = computed(() => {
      const equipment = selectedEquipmentDisplay.value
      if (!equipment) {
        return 0
      }
      const currentHoles = currentHoleCount.value
      const maxHoleCount = maxHoles.value
      if (maxHoleCount <= 0 || currentHoles >= maxHoleCount) {
        return 0
      }
      if (selectedScrollDisplay.value && selectedScrollStack.value > 0) {
        return 0
      }
      const targetHole = currentHoles + 1
      const breakChance = Number(perforationBreakTable[targetHole] ?? 0)
      const normalized = Number.isFinite(breakChance) ? Math.max(0, Math.min(100, breakChance)) : 0
      return Math.round(normalized * 10000) / 10000
    })

    const perforationProgressText = computed(() => Math.round(perforationProgress.value))

    const targetPerforationOptions = computed(() => {
      const maxHoleCount = Number(maxHoles.value ?? 0)
      if (!Number.isFinite(maxHoleCount) || maxHoleCount <= 0) {
        return []
      }
      const options = []
      for (let hole = 1; hole <= maxHoleCount; hole += 1) {
        options.push(hole)
      }
      return options
    })

    const perforationProbabilityRows = computed(() => {
      if (!selectedEquipmentDisplay.value) {
        return []
      }
      const maxHoleCount = maxHoles.value
      if (!Number.isFinite(maxHoleCount) || maxHoleCount <= 0) {
        return []
      }
      const rows = []
      for (let targetHole = 1; targetHole <= maxHoleCount; targetHole += 1) {
        let baseProbability = 0
        if (equipmentType.value === 'weaponShield') {
          baseProbability = Number(weaponShieldProbabilityTable[targetHole] ?? 0)
        } else if (equipmentType.value === 'armorSuit') {
          baseProbability = Number(armorSuitProbabilityTable[targetHole] ?? 0)
        }
        const premiumProbability = baseProbability * 2
        const normalizedBase =
          Number.isFinite(baseProbability) && baseProbability > 0 ? baseProbability : 0
        const normalizedPremium =
          Number.isFinite(premiumProbability) && premiumProbability > 0
            ? Math.min(100, premiumProbability)
            : 0
        let cost = 0
        if (equipmentType.value === 'weaponShield') {
          cost = weaponShieldCostTable[targetHole]
        } else if (equipmentType.value === 'armorSuit') {
          cost = armorSuitCostTable[targetHole]
        }
        const numericCost = Number(cost ?? 0)
        rows.push({
          currentHole: targetHole - 1,
          targetHole,
          baseProbability: normalizedBase,
          premiumProbability: normalizedPremium,
          cost: Number.isFinite(numericCost) && numericCost > 0 ? numericCost : 0
        })
      }
      return rows
    })

    const perforationCost = computed(() => {
      if (!selectedEquipmentDisplay.value || !selectedMaterialDisplay.value) {
        return 0
      }
      const currentHoles = currentHoleCount.value
      const maxHoleCount = maxHoles.value
      if (maxHoleCount <= 0 || currentHoles >= maxHoleCount) {
        return 0
      }
      const targetHole = currentHoles + 1
      let cost = 0
      if (equipmentType.value === 'weaponShield') {
        cost = weaponShieldCostTable[targetHole]
      } else if (equipmentType.value === 'armorSuit') {
        cost = armorSuitCostTable[targetHole]
      }
      const numericCost = Number(cost ?? 0)
      if (!Number.isFinite(numericCost) || numericCost <= 0) {
        return 0
      }
      return numericCost
    })

    const resolveBagItem = meta => {
      const bag = itemsStore.playerBag
      if (!meta || !bag || !Array.isArray(bag) || bag.length === 0) {
        return null
      }
      const bagIndex = Number(meta.bagIndex)
      const uniqueId = meta.uniqueId ?? null
      const id = meta.id ?? null
      const hasId = id !== null && id !== undefined
      if (Number.isFinite(bagIndex) && bagIndex >= 0 && bagIndex < bag.length) {
        const candidate = bag[bagIndex]
        if (candidate) {
          if (uniqueId && candidate.uniqueId && String(candidate.uniqueId) === String(uniqueId)) {
            return candidate
          }
          if (!uniqueId && hasId && Number(candidate.id) === Number(id)) {
            return candidate
          }
        }
      }
      if (uniqueId) {
        const byUnique = bag.find(item => item && item.uniqueId && String(item.uniqueId) === String(uniqueId))
        if (byUnique) {
          return byUnique
        }
      }
      if (hasId) {
        const byId = bag.find(item => item && Number(item.id) === Number(id))
        if (byId) {
          return byId
        }
      }
      return null
    }

    const selectedMaterialDisplay = computed(() => {
      return resolveBagItem(selectedMaterialMeta.value) || selectedMaterial.value || null
    })

    const selectedScrollDisplay = computed(() => {
      return resolveBagItem(selectedScrollMeta.value) || selectedScroll.value || null
    })

    const selectedEquipmentDisplay = computed(() => {
      const meta = selectedEquipmentMeta.value
      if (meta) {
        return resolveBagItem(meta) || null
      }
      return selectedEquipment.value || null
    })

    const selectedMaterialStack = computed(() => {
      const material = selectedMaterialDisplay.value
      if (!material) {
        return 0
      }
      const stack = Number(material.currentStack ?? material.quantity ?? 1)
      return Number.isFinite(stack) ? stack : 0
    })

    const selectedScrollStack = computed(() => {
      const scroll = selectedScrollDisplay.value
      if (!scroll) {
        return 0
      }
      const stack = Number(scroll.currentStack ?? scroll.quantity ?? 1)
      return Number.isFinite(stack) ? stack : 0
    })

    const canPerforate = computed(() => {
      return (
        selectedEquipmentDisplay.value &&
        selectedMaterialDisplay.value &&
        selectedMaterialStack.value > 0 &&
        successProbability.value > 0 &&
        currentHoleCount.value < maxHoles.value &&
        !perforationInProgress.value
      )
    })

    const canAutoPerforate = computed(() => {
      const targetHole = Number(targetPerforationHole.value ?? 0)
      const maxHoleCount = Number(maxHoles.value ?? 0)
      return (
        selectedEquipmentDisplay.value &&
        selectedMaterialDisplay.value &&
        selectedMaterialStack.value > 0 &&
        selectedScrollDisplay.value &&
        selectedScrollStack.value > 0 &&
        targetHole >= 1 &&
        maxHoleCount > 0 &&
        targetHole <= maxHoleCount &&
        currentHoleCount.value < targetHole &&
        successProbability.value > 0 &&
        !perforationInProgress.value &&
        !autoPerforateActive.value
      )
    })

    const close = () => {
      resetSelections()
      emit('close')
    }

    const togglePerforationProbability = () => {
      showPerforationProbability.value = !showPerforationProbability.value
    }

    const confirmProceedWithoutScroll = () => {
      showMissingScrollConfirm.value = false
      proceedPerforation()
    }

    const cancelProceedWithoutScroll = () => {
      showMissingScrollConfirm.value = false
    }

    const resetPerforationBoost = () => {
      perforationFailCount.value = 0
      lastBoostIncrease.value = 0
      boostAnimationKey.value = 0
    }

    const stopPerforationProgress = () => {
      if (perforationProgressInterval) {
        clearInterval(perforationProgressInterval)
        perforationProgressInterval = null
      }
      if (perforationProgressTimer) {
        clearTimeout(perforationProgressTimer)
        perforationProgressTimer = null
      }
      perforationInProgress.value = false
      perforationProgress.value = 0
    }

    const showEquipmentSelector = () => {
      showMaterialSelectorPanel.value = false
      showScrollSelectorPanel.value = false
      showEquipmentSelectorPanel.value = true
    }

    const hideEquipmentSelector = () => {
      showEquipmentSelectorPanel.value = false
    }

    const showMaterialSelector = () => {
      showEquipmentSelectorPanel.value = false
      showScrollSelectorPanel.value = false
      showMaterialSelectorPanel.value = true
    }

    const hideMaterialSelector = () => {
      showMaterialSelectorPanel.value = false
    }

    const showScrollSelector = () => {
      showEquipmentSelectorPanel.value = false
      showMaterialSelectorPanel.value = false
      showScrollSelectorPanel.value = true
    }

    const hideScrollSelector = () => {
      showScrollSelectorPanel.value = false
    }

    const availableEquipments = computed(() => {
      const bag = itemsStore.playerBag
      if (!bag || bag.length === 0) {
        return []
      }
      const candidates = bag
        .map((item, bagIndex) => ({ item, bagIndex }))
        .filter(({ item }) => {
          if (!item) {
            return false
          }
          if (item.category === 'weapon') {
            return true
          }
          if (item.category === 'armor' && (item.subcategory === 'suit' || item.subcategory === 'shield')) {
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

    const drillMaterialIds = [9320, 9344, 7867]
    const perforationScrollIds = [3945]

    const availableMaterials = computed(() => {
      const bag = itemsStore.playerBag
      if (!selectedEquipmentDisplay.value) {
        return []
      }
      if (!bag || bag.length === 0) {
        return []
      }
      const allowed = new Set(drillMaterialIds)
      const candidates = bag
        .map((item, bagIndex) => ({ item, bagIndex }))
        .filter(({ item }) => item && allowed.has(Number(item.id)))

      return candidates.map(({ item, bagIndex }) => ({
        item,
        bagIndex,
        quantity: Number(item.currentStack ?? item.quantity ?? 1),
        key: item.uniqueId || `${item.id}-${bagIndex}`
      }))
    })

    const availableScrolls = computed(() => {
      const bag = itemsStore.playerBag
      if (!selectedEquipmentDisplay.value) {
        return []
      }
      if (!bag || bag.length === 0) {
        return []
      }
      const allowed = new Set(perforationScrollIds)
      const candidates = bag
        .map((item, bagIndex) => ({ item, bagIndex }))
        .filter(({ item }) => item && allowed.has(Number(item.id)))

      return candidates.map(({ item, bagIndex }) => ({
        item,
        bagIndex,
        quantity: Number(item.currentStack ?? item.quantity ?? 1),
        key: item.uniqueId || `${item.id}-${bagIndex}`
      }))
    })

    const resetSelections = () => {
      stopPerforationProgress()
      stopAutoPerforate()
      resetPerforationBoost()
      showMissingScrollConfirm.value = false
      showPerforationProbability.value = false
      targetPerforationHole.value = 0
      selectedEquipment.value = null
      selectedMaterial.value = null
      selectedScroll.value = null
      selectedEquipmentMeta.value = null
      selectedMaterialMeta.value = null
      selectedScrollMeta.value = null
      showEquipmentSelectorPanel.value = false
      showMaterialSelectorPanel.value = false
      showScrollSelectorPanel.value = false
    }

    watch(
      () => props.isVisible,
      (visible, wasVisible) => {
        if (wasVisible && !visible) {
          resetSelections()
        }
      }
    )

    const selectEquipment = entry => {
      const equipment = entry.item
      resetPerforationBoost()
      selectedEquipment.value = { ...equipment }
      selectedEquipmentMeta.value = {
        id: equipment?.id ?? null,
        uniqueId: equipment?.uniqueId ?? null,
        bagIndex: entry.bagIndex
      }
      hideEquipmentSelector()
      hideItemTooltip() // 关闭物品详情面板
    }

    const selectMaterial = entry => {
      resetPerforationBoost()
      selectedMaterial.value = { ...entry.item }
      selectedMaterialMeta.value = {
        id: entry.item?.id ?? null,
        uniqueId: entry.item?.uniqueId ?? null,
        bagIndex: entry.bagIndex
      }
      hideMaterialSelector()
      hideItemTooltip() // 关闭物品详情面板
    }

    const selectScroll = entry => {
      selectedScroll.value = { ...entry.item }
      selectedScrollMeta.value = {
        id: entry.item?.id ?? null,
        uniqueId: entry.item?.uniqueId ?? null,
        bagIndex: entry.bagIndex
      }
      hideScrollSelector()
      hideItemTooltip() // 关闭物品详情面板
    }

    const finalizePerforation = () => {
      const equipmentSnapshot = selectedEquipmentDisplay.value || selectedEquipment.value
      const isSuccess = Math.random() * 100 < successProbability.value
      const hasScroll = Boolean(selectedScrollDisplay.value)
      const targetHole = currentHoleCount.value + 1
      let broke = false
      let nextHoleCount = currentHoleCount.value
      if (isSuccess) {
        nextHoleCount = currentHoleCount.value + 1
      } else if (!hasScroll) {
        const breakChance = Number(perforationBreakTable[targetHole] ?? 0)
        const normalizedBreakChance = Number.isFinite(breakChance) ? Math.max(0, Math.min(100, breakChance)) : 0
        broke = Math.random() * 100 < normalizedBreakChance
        if (!broke) {
          nextHoleCount = Math.max(currentHoleCount.value - 1, 0)
        }
      }

      perforationResultType.value = isSuccess ? 'success' : 'failure'
      perforationResultKey.value += 1

      if (isSuccess) {
        resetPerforationBoost()
        emit('perforation-success', {
          equipment: equipmentSnapshot,
          newHoleCount: nextHoleCount
        })
      } else {
        perforationFailCount.value += 1
        const boostIncrease = Number(basePerforationProbability.value ?? 0) * 0.2
        lastBoostIncrease.value = Number.isFinite(boostIncrease) ? boostIncrease : 0
        boostAnimationKey.value += 1
        emit('perforation-failure', {
          equipment: equipmentSnapshot
        })
      }

      emit('perforation-apply', {
        equipmentId: selectedEquipmentMeta.value?.id ?? equipmentSnapshot?.id ?? null,
        equipmentUniqueId: selectedEquipmentMeta.value?.uniqueId ?? null,
        equipmentBagIndex: selectedEquipmentMeta.value?.bagIndex ?? null,
        materialId: selectedMaterialDisplay.value?.id ?? null,
        scrollId: selectedScrollDisplay.value?.id ?? null,
        scrollConsumed: Boolean(selectedScrollDisplay.value),
        success: isSuccess,
        broke,
        newHoleCount: nextHoleCount,
        perforationCost: perforationCost.value
      })

      if (isSuccess && nextHoleCount >= maxHoles.value) {
        selectedEquipment.value = null
        selectedEquipmentMeta.value = null
      }
      if (broke) {
        selectedEquipment.value = null
        selectedEquipmentMeta.value = null
      }
    }

    const proceedPerforation = () => {
      perforationInProgress.value = true
      perforationProgress.value = 0
      const startTime = Date.now()
      if (perforationProgressInterval) {
        clearInterval(perforationProgressInterval)
      }
      perforationProgressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        perforationProgress.value = Math.min(100, (elapsed / 1000) * 100)
        if (perforationProgress.value >= 100) {
          clearInterval(perforationProgressInterval)
          perforationProgressInterval = null
        }
      }, 50)

      if (perforationProgressTimer) {
        clearTimeout(perforationProgressTimer)
      }
      perforationProgressTimer = setTimeout(() => {
        perforationProgress.value = 100
        finalizePerforation()
        perforationInProgress.value = false
        perforationProgressTimer = null
      }, 1000)
    }

    const stopAutoPerforate = () => {
      if (autoPerforateTimer) {
        clearTimeout(autoPerforateTimer)
        autoPerforateTimer = null
      }
      autoPerforateActive.value = false
    }

    const ensureAutoPerforateReady = () => {
      if (!selectedEquipmentDisplay.value) {
        stopAutoPerforate()
        return false
      }
      if (!selectedScrollDisplay.value) {
        stopAutoPerforate()
        return false
      }
      if (selectedScrollStack.value < 1) {
        stopAutoPerforate()
        return false
      }
      if (!selectedMaterialDisplay.value || selectedMaterialStack.value < 1) {
        stopAutoPerforate()
        return false
      }
      const targetHole = Number(targetPerforationHole.value ?? 0)
      const maxHoleCount = Number(maxHoles.value ?? 0)
      if (!Number.isFinite(targetHole) || targetHole < 1 || targetHole > maxHoleCount) {
        stopAutoPerforate()
        return false
      }
      if (currentHoleCount.value >= targetHole) {
        stopAutoPerforate()
        return false
      }
      const cost = Number(perforationCost.value ?? 0)
      if (cost > 0) {
        const currentGold = Number(props.player?.gold ?? itemsStore.playerGold ?? 0)
        if (!Number.isFinite(currentGold) || currentGold < cost) {
          stopAutoPerforate()
          return false
        }
      }
      return true
    }

    const scheduleAutoPerforate = () => {
      if (!autoPerforateActive.value) {
        return
      }
      if (!ensureAutoPerforateReady()) {
        return
      }
      if (perforationInProgress.value) {
        autoPerforateTimer = setTimeout(scheduleAutoPerforate, 200)
        return
      }
      if (!canPerforate.value) {
        autoPerforateTimer = setTimeout(scheduleAutoPerforate, 200)
        return
      }
      proceedPerforation()
    }

    const startAutoPerforate = () => {
      if (autoPerforateActive.value) {
        return
      }
      autoPerforateActive.value = true
      scheduleAutoPerforate()
    }

    const toggleAutoPerforate = () => {
      if (autoPerforateActive.value) {
        stopAutoPerforate()
        return
      }
      startAutoPerforate()
    }

    const performPerforation = () => {
      if (!canPerforate.value) {
        return
      }
      if (!selectedScrollDisplay.value) {
        showMissingScrollConfirm.value = true
        return
      }
      proceedPerforation()
    }

    watch(
      () => selectedMaterialStack.value,
      stack => {
        if (!selectedMaterialDisplay.value) {
          return
        }
        if (Number(stack) < 1) {
          selectedMaterial.value = null
          selectedMaterialMeta.value = null
        }
      }
    )

    watch(
      () => selectedScrollStack.value,
      stack => {
        if (!selectedScrollDisplay.value) {
          return
        }
        if (Number(stack) < 1) {
          selectedScroll.value = null
          selectedScrollMeta.value = null
        }
      }
    )

    watch(
      () => selectedEquipmentDisplay.value,
      display => {
        if (display || !selectedEquipmentMeta.value) {
          return
        }
        stopAutoPerforate()
        resetPerforationBoost()
        targetPerforationHole.value = 0
        selectedEquipment.value = null
        selectedEquipmentMeta.value = null
      }
    )

    onUnmounted(() => {
      stopAutoPerforate()
      stopPerforationProgress()
    })
    watch(
      () => perforationInProgress.value,
      inProgress => {
        if (autoPerforateActive.value && !inProgress) {
          scheduleAutoPerforate()
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
      selectedEquipmentDisplay,
      selectedMaterialDisplay,
      selectedScrollDisplay,
      selectedMaterialStack,
      selectedScrollStack,
      maxHoles,
      currentHoleCount,
      successProbability,
      currentBreakRate,
      perforationProgress,
      perforationProgressText,
      perforationInProgress,
      autoPerforateActive,
      targetPerforationHole,
      targetPerforationOptions,
      canAutoPerforate,
      lastBoostIncrease,
      boostAnimationKey,
      perforationProbabilityRows,
      perforationCost,
      canPerforate,
      close,
      togglePerforationProbability,
      showEquipmentSelectorPanel,
      showMaterialSelectorPanel,
      showScrollSelectorPanel,
      showEquipmentSelector,
      hideEquipmentSelector,
      showMaterialSelector,
      hideMaterialSelector,
      showScrollSelector,
      hideScrollSelector,
      availableEquipments,
      availableMaterials,
      availableScrolls,
      selectEquipment,
      selectMaterial,
      selectScroll,
      resetSelections,
      performPerforation,
      toggleAutoPerforate,
      panelPosition,
      panelStyle,
      contentStyle,
      startDrag,
      startResize,
      showPerforationProbability,
      perforationReferenceStyle,
      perforationResultType,
      perforationResultKey,
      getItemIcon,
      getItemName,
      showItemTooltip,
      hideItemTooltip,
      updateTooltipPosition,
      confirmProceedWithoutScroll,
      cancelProceedWithoutScroll,
      showMissingScrollConfirm,
      // 选择框面板拖动
      selectorPanelPositions,
      startEquipmentSelectorDrag,
      startMaterialSelectorDrag,
      startScrollSelectorDrag
    }
  }
}
</script>

<style scoped>
/* 过渡动画 */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
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

/* 容器 */
.perforation-panel-wrap {
  position: fixed;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 12px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: visible;
}

.perforation-panel__inner {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-radius: 10px;
}

/* 头部 */
.perforation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(90deg, #2a2a4a 0%, #3a3a5a 100%);
  border-radius: 10px 10px 0 0;
  cursor: move;
  user-select: none;
}

.perforation-title-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.perforation-npc-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid #6a6a8a;
}

.perforation-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.perforation-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.perforation-help-btn {
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

.perforation-help-btn:hover {
  background: linear-gradient(135deg, #5a7aaa 0%, #4a6a9a 100%);
  border-color: #8aaaca;
  box-shadow: 0 0 10px rgba(106, 138, 186, 0.5);
}

.perforation-help-btn.active {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-color: #ffdd44;
  color: #1a1a2a;
}

.close-button {
  width: 32px;
  height: 32px;
  background: #4a4a6a;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: #ff4444;
}

/* 内容区域 */
.perforation-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  overflow-x: hidden;
}

.perforation-instructions {
  text-align: center;
  font-size: 13px;
  color: #aaa;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
}

/* 槽位 */
.perforation-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.slot-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.slot-container h3 {
  color: #ffd700;
  font-size: 14px;
  margin: 0;
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
}

.slot-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
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
  text-align: center;
}

/* 概率显示 */
.perforation-probability {
  display: flex;
  flex-direction: column;
}

.perforation-probability h3 {
  color: #ffd700;
  text-align: center;
  font-size: 14px;
  margin: 0;
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

/* 进度条 */
.perforation-progress {
  margin-top: 4px;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 20px;
  background: #2a2a3a;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffaa00);
  border-radius: 10px;
  transition: width 0.3s;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 11px;
  font-weight: bold;
}

.perforation-cost {
  text-align: center;
  font-size: 12px;
  color: #fff;
}

/* 操作按钮 */
.perforation-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
}

.auto-perforation-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.auto-perforation-select {
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #4a4a6a;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.auto-perforation-button,
.perforation-button,
.reset-button {
  padding: 8px 16px;
  border: 1px solid #4a4a6a;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.auto-perforation-button:hover:not(:disabled),
.perforation-button:hover:not(:disabled),
.reset-button:hover {
  border-color: #ffd700;
  color: #ffd700;
  background: rgba(255, 215, 0, 0.15);
}

.perforation-button {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #1a1a2a;
  border: none;
  font-weight: bold;
}

.perforation-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #ffdd44, #ffcc00);
}

.perforation-button:disabled,
.auto-perforation-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 概率参考面板 - 右侧外部贴合显示 */
.perforation-probability-reference {
  position: absolute;
  left: 100%;
  top: 0;
  width: max-content;
  max-width: 280px;
  background: linear-gradient(135deg, #2a2a4a 0%, #1a1a2e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 8px;
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.5);
  margin-left: 10px;
  z-index: 1001;
}

.probability-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(90deg, #3a3a5a 0%, #4a4a6a 100%);
  border-radius: 6px 6px 0 0;
}

.probability-title {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
}

.probability-close {
  width: 24px;
  height: 24px;
  background: #4a4a6a;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.probability-close:hover {
  background: #ff4444;
}

.probability-content {
  padding: 12px 14px;
  max-height: 400px;
  overflow-y: auto;
}

/* 概率面板滚动条样式 */
.probability-content::-webkit-scrollbar {
  width: 6px;
}

.probability-content::-webkit-scrollbar-track {
  background: #1a1a2e;
  border-radius: 3px;
}

.probability-content::-webkit-scrollbar-thumb {
  background: #4a4a6a;
  border-radius: 3px;
}

.probability-content::-webkit-scrollbar-thumb:hover {
  background: #5a5a7a;
}

.probability-section {
  margin-top: 10px;
}

.probability-section-title {
  font-size: 13px;
  font-weight: bold;
  color: #6aa8ff;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid #3a3a5a;
}

.probability-table {
  padding: 4px 0;
}

.probability-table-rows {
  padding: 8px 10px;
  max-height: 250px;
  overflow: auto;
}

/* 概率表格滚动条样式 */
.probability-table-rows::-webkit-scrollbar {
  width: 6px;
}

.probability-table-rows::-webkit-scrollbar-track {
  background: #1a1a2e;
  border-radius: 3px;
}

.probability-table-rows::-webkit-scrollbar-thumb {
  background: #4a4a6a;
  border-radius: 3px;
}

.probability-table-rows::-webkit-scrollbar-thumb:hover {
  background: #5a5a7a;
}

.probability-table-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 2px;
  color: #fff;
  font-size: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.probability-table-row:last-child {
  border-bottom: none;
}

.probability-table-level {
  color: #00bfff;
  font-weight: bold;
}

.probability-table-value {
  color: #fff;
  min-width: 46px;
  text-align: right;
}

.probability-table-cost {
  color: #b9ffb9;
  min-width: 78px;
  text-align: right;
}

.probability-empty-hint {
  margin-top: 8px;
  color: #fff;
  font-size: 12px;
  text-align: center;
}

.perforation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}

.perforation-title-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.perforation-header h2 {
  color: #00bfff;
  font-size: 24px;
  margin: 0;
}

.close-button {
  background: #ff4444;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.perforation-content {
  padding: 20px;
}

.perforation-instructions {
  background: rgba(0, 191, 255, 0.1);
  border-radius: 10px;
 
  border: 1px solid #00bfff;
}

.perforation-instructions p {
  color: #fff;
  font-size: 14px;
  margin: 0;
  text-align: center;
}

.perforation-slots {
  display: flex;
  justify-content: space-around;
}

.slot-container {
  text-align: center;
  flex: 1;
}

.slot-container h3 {
  color: #00bfff;
  margin-bottom: 10px;
}

.slot {
  width: 100px;
  height: 100px;
  border: 2px dashed #00bfff;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.1);
}

.slot:hover {
  background: rgba(0, 191, 255, 0.2);
  transform: translateY(-2px);
}

.slot-icon {
  width: 60px;
  height: 60px;
  object-fit: contain;
  margin-bottom: 5px;
}

.empty-slot {
  font-size: 36px;
  color: #00bfff;
}

.slot-name {
  color: #fff;
  font-size: 12px;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}


.perforation-probability h3 {
  color: #00bfff;
  text-align: center;
  margin-bottom: 10px;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  width: 100%;
  height: 22px;
  background: #2b2b2b;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #55d36b, #29b35a);
  border-radius: 12px;
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
  font-size: 12px;
}

.probability-bar {
  width: 100%;
  height: 30px;
  background: #333;
  border-radius: 15px;
  position: relative;
  overflow: hidden;
}

.probability-fill {
  height: 100%;
  background: linear-gradient(90deg, #00bfff, #0077cc);
  border-radius: 15px;
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
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  width: 100%;
}

.auto-perforation-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.auto-perforation-select {
  padding: 10px 14px;
  border-radius: 20px;
  border: 1px solid rgba(0, 191, 255, 0.6);
  background: rgba(0, 0, 0, 0.35);
  color: #00bfff;
  font-size: 14px;
  min-width: 130px;
  outline: none;
  cursor: pointer;
}

.auto-perforation-select:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.auto-perforation-button {
  padding: 12px 22px;
  background: linear-gradient(135deg, #3bb3ff, #1e7ddc);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(30, 125, 220, 0.35);
}

.auto-perforation-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(30, 125, 220, 0.55);
}

.auto-perforation-button:disabled {
  background: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.perforation-button {
  padding: 12px 30px;
  background: linear-gradient(135deg, #00bfff, #0077cc);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(0, 119, 204, 0.3);
}

.perforation-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 119, 204, 0.5);
}

.perforation-button:disabled {
  background: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.reset-button {
  padding: 12px 30px;
  background: linear-gradient(135deg, #5a6b7c, #3f4d5c);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(63, 77, 92, 0.3);
}

.reset-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(63, 77, 92, 0.5);
}

.perforation-cost {
  margin-top: 10px;
  text-align: center;
  color: #fff;
  font-size: 14px;
}

.slot-placeholder {
  width: 60px;
  height: 60px;
  object-fit: contain;
  margin-bottom: 5px;
}

.slot-badge {
  position: absolute;
  bottom: 4px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
}

.scroll-slot {
  position: relative;
}

.material-slot {
  position: relative;
}

.equipment-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.equipment-selector-panel {
  position: fixed;
  background: linear-gradient(135deg, #2c3e50, #1a1a2e);
  border-radius: 15px;
  width: 400px;
  height: 345px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border: 2px solid #00bfff;
  display: flex;
  flex-direction: column;
  z-index: 1101;
}

.equipment-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 2px solid #00bfff;
  background-color: rgba(0, 0, 0, 0.3);
  cursor: move;
  user-select: none;
}

.equipment-selector-header h3 {
  color: #00bfff;
  font-size: 18px;
  margin: 0;
}

.equipment-selector-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.no-equipment {
  color: #fff;
  text-align: center;
  padding: 20px;
  font-size: 14px;
}

.equipment-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.equipment-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.equipment-item:hover {
  background: rgba(0, 191, 255, 0.2);
  border-color: #00bfff;
  transform: translateY(-2px);
}

.equipment-item-icon {
  width: 46px;
  height: 46px;
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
  font-size: 12px;
  font-weight: bold;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.equipment-item-level {
  color: #aaa;
  font-size: 12px;
}

.material-item-quantity {
  color: #aaa;
  font-size: 12px;
}

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
  padding-top: calc(50vh + 250px + 8px);
}

.confirm-content {
  background-color: #1a1a2e;
  border: 2px solid #00bfff;
  border-radius: 10px;
  padding: 30px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  color: #fff;
  pointer-events: auto;
}

.confirm-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 10px;
}

.confirm-buttons button {
  padding: 10px 25px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.confirm-buttons button:first-child {
  background-color: #006400;
  color: white;
}

.confirm-buttons button:last-child {
  background-color: #8b0000;
  color: white;
}

/* 滚动条样式 */
.perforation-content::-webkit-scrollbar,
.perforation-panel-wrap::-webkit-scrollbar {
  width: 6px;
}

.perforation-content::-webkit-scrollbar-track,
.perforation-panel-wrap::-webkit-scrollbar-track {
  background: #1a1a2e;
  border-radius: 3px;
}

.perforation-content::-webkit-scrollbar-thumb,
.perforation-panel-wrap::-webkit-scrollbar-thumb {
  background: #4a4a6a;
  border-radius: 3px;
}

.perforation-content::-webkit-scrollbar-thumb:hover,
.perforation-panel-wrap::-webkit-scrollbar-thumb:hover {
  background: #5a5a7a;
}
</style>
