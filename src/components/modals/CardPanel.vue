<template>
  <Transition name="panel-fade" appear>
    <div
      v-if="isVisible"
      class="card-panel-outer"
      :style="panelStyle"
    >
      <!-- 拉伸手柄 -->
      <PanelResizeHandle @pointerdown="startResize" />
      <img
        class="dealer-badge"
        :src="'/pt/npc_icon/dealer.png'"
        alt="dealer"
        draggable="false"
      />
      <div class="card-panel__inner" :style="contentStyle" @mousedown="startDrag">
        <div class="card-header">
          <h2>{{ currentTabTitle }}</h2>
          <div class="card-header-actions">
            <button
              class="card-help-btn"
              :class="{ active: showRulesPanel }"
              type="button"
              title="显示/隐藏规则"
              @click.stop="toggleRulesPanel"
            >
              ?
            </button>
            <button class="close-button" @click="close">&times;</button>
          </div>
        </div>

        <div class="card-content">
          <div class="card-layout">
            <div class="card-menu" @mousedown.stop>
              <button
                class="menu-button"
                :class="{ active: currentTab === 'insert' }"
                type="button"
                @mousedown.stop
                @click.stop="switchTab('insert')"
              >
                镶嵌卡片
              </button>
              <button
                class="menu-button"
                :class="{ active: currentTab === 'remove' }"
                type="button"
                @mousedown.stop
                @click.stop="switchTab('remove')"
              >
                移除卡片
              </button>
              <button
                class="menu-button"
                :class="{ active: currentTab === 'synthesis' }"
                type="button"
                @mousedown.stop
                @click.stop="switchTab('synthesis')"
              >
                合成卡片
              </button>
            </div>

            <div class="card-main" @mousedown.stop>
              <div v-if="currentTab === 'insert'">
                <div class="card-instructions">
                  <p>将装备放入左侧槽位，放入卡片到右侧槽位，点击镶嵌按钮进行镶嵌。</p>
                </div>

                <div class="card-slots">
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
                      <img v-else src="/pt/UI/武器或装备.png" alt="默认装备" class="slot-placeholder" />
                      <div v-if="selectedEquipmentDisplay" class="slot-name">
                        {{ getItemName(selectedEquipmentDisplay) }}
                      </div>
                    </div>
                    <div v-if="selectedEquipmentDisplay" class="equipment-info">
                      <div>已镶嵌: {{ embeddedCardCount }}/{{ holeCount }}</div>
                      <div v-if="perforationSlots.length" class="equipment-cards">
                        <div
                          v-for="slot in perforationSlots"
                          :key="`perforation-${slot.level}`"
                          class="card-item"
                          @mouseenter="slot.cardItem ? showItemTooltip($event, slot.cardItem) : null"
                          @mouseleave="hideItemTooltip"
                          @mousemove="updateTooltipPosition"
                        >
                          <img
                            v-if="slot.cardItem"
                            :src="getItemIcon(slot.cardItem)"
                            :alt="getItemName(slot.cardItem)"
                            class="card-icon"
                          />
                          <div v-else class="empty-card">{{ slot.level }}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="slot-container">
                    <h3>卡片</h3>
                    <div class="slot material-slot" @click.stop="showCardSelector">
                      <img
                        v-if="selectedCardDisplay"
                        :src="getItemIcon(selectedCardDisplay)"
                        :alt="getItemName(selectedCardDisplay)"
                        class="slot-icon"
                        @mouseenter="showItemTooltip($event, selectedCardDisplay)"
                        @mouseleave="hideItemTooltip"
                        @mousemove="updateTooltipPosition"
                      />
                      <img v-else src="/pt/UI/穿孔道具.png" alt="默认卡片" class="slot-placeholder" />
                      <div v-if="selectedCardDisplay && selectedCardStack > 0" class="slot-badge">
                        {{ selectedCardStack }}
                      </div>
                      <div v-if="selectedCardDisplay" class="slot-name">{{ getItemName(selectedCardDisplay) }}</div>
                    </div>
                  </div>
                </div>

                <div class="card-actions">
                  <div class="card-hint">成功率: 100%</div>
                  <button
                    class="card-button"
                    :disabled="!canInsertCard"
                    type="button"
                    @click="performCardInsert"
                  >
                    镶嵌
                  </button>
                  <button class="reset-button" type="button" @click="resetSelections">
                    重置
                  </button>
                </div>
              </div>

              <div v-else-if="currentTab === 'remove'">
                <div class="card-instructions">
                  <p>选择要移除卡片的装备，点击卡片右侧的移除按钮。</p>
                </div>

                <div class="remove-equipment-area">
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
                      <img v-else src="/pt/UI/武器或装备.png" alt="默认装备" class="slot-placeholder" />
                      <div v-if="selectedEquipmentDisplay" class="slot-name">
                        {{ getItemName(selectedEquipmentDisplay) }}
                      </div>
                    </div>
                    <div v-if="selectedEquipmentDisplay" class="equipment-info">
                      <div>已镶嵌: {{ embeddedCardCount }}/{{ holeCount }}</div>
                    </div>
                  </div>
                </div>

                <div class="remove-cost-row">
                  <div class="remove-cost-text">移除消耗金币: {{ removeCardCost }} / 张</div>
                  <div class="remove-gold-text">当前金币: {{ playerGold }}</div>
                </div>

                <div v-if="!selectedEquipmentDisplay" class="remove-empty">请先选择装备</div>
                <div v-else-if="perforationSlots.length === 0" class="remove-empty">该装备没有穿孔</div>
                <div v-else class="remove-card-list">
                  <div v-for="entry in perforationSlots" :key="`remove-${entry.level}`" class="remove-card-row">
                    <div
                      class="remove-card-info"
                      @mouseenter="entry.cardItem ? showItemTooltip($event, entry.cardItem) : null"
                      @mouseleave="hideItemTooltip"
                      @mousemove="updateTooltipPosition"
                    >
                      <img
                        v-if="entry.cardItem"
                        :src="getItemIcon(entry.cardItem)"
                        :alt="getItemName(entry.cardItem)"
                        class="remove-card-icon"
                      />
                      <div v-else class="remove-card-empty">{{ entry.level }}</div>
                      <div class="remove-card-name">{{ entry.cardItem ? getItemName(entry.cardItem) : '未镶嵌' }}</div>
                      <div class="remove-card-level">孔位 {{ entry.level }}</div>
                    </div>
                    <button
                      v-if="entry.cardId && Number(entry.cardId) > 0"
                      class="remove-card-button"
                      type="button"
                      :disabled="!canRemoveCard"
                      @click.stop="requestRemoveConfirm(entry)"
                    >
                      移除
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="synthesis-panel">
                <div class="card-instructions">
                  <p>选择背包中的卡片，满足数量后可进行合成。</p>
                </div>

                <div class="card-slots synthesis-slots">
                  <div class="slot-container">
                    <h3>材料卡片</h3>
                    <div class="slot material-slot" @click.stop="showSynthesisCardSelector">
                      <img
                        v-if="selectedSynthesisCardDisplay"
                        :src="getItemIcon(selectedSynthesisCardDisplay)"
                        :alt="getItemName(selectedSynthesisCardDisplay)"
                        class="slot-icon"
                        @mouseenter="showItemTooltip($event, selectedSynthesisCardDisplay)"
                        @mouseleave="hideItemTooltip"
                        @mousemove="updateTooltipPosition"
                      />
                      <img v-else src="/pt/UI/穿孔道具.png" alt="默认卡片" class="slot-placeholder" />
                      <div v-if="selectedSynthesisCardDisplay && synthesisOwnedCount > 0" class="slot-badge">
                        {{ synthesisOwnedCount }}
                      </div>
                      <div v-if="selectedSynthesisCardDisplay" class="slot-name">
                        {{ getItemName(selectedSynthesisCardDisplay) }}
                      </div>
                    </div>
                  </div>

                  <div class="slot-container">
                    <h3>产出卡片</h3>
                    <div class="slot result-slot" :class="{ disabled: !synthesisTargetCardItem }">
                      <img
                        v-if="synthesisTargetCardItem"
                        :src="getItemIcon(synthesisTargetCardItem)"
                        :alt="getItemName(synthesisTargetCardItem)"
                        class="slot-icon"
                        @mouseenter="showItemTooltip($event, synthesisTargetCardItem)"
                        @mouseleave="hideItemTooltip"
                        @mousemove="updateTooltipPosition"
                      />
                      <img v-else src="/pt/UI/武器或装备.png" alt="默认产出" class="slot-placeholder" />
                      <div v-if="synthesisTargetCardItem" class="slot-name">
                        {{ getItemName(synthesisTargetCardItem) }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="synthesis-info">
                  <div class="synthesis-info-row">
                    <div class="synthesis-info-label">需求</div>
                    <div class="synthesis-info-value">x{{ synthesisRequiredCount }}</div>
                  </div>
                  <div class="synthesis-info-row">
                    <div class="synthesis-info-label">成功率</div>
                    <div class="synthesis-info-value">{{ synthesisProbabilityText }}</div>
                  </div>
                  <div class="synthesis-info-row">
                    <div class="synthesis-info-label">费用</div>
                    <div class="synthesis-info-value">{{ synthesisCostText }}</div>
                  </div>
                  <div class="synthesis-info-row">
                    <div class="synthesis-info-label">当前金币</div>
                    <div class="synthesis-info-value">{{ playerGold }}</div>
                  </div>
                </div>

                <div class="progress-row synthesis-progress-row">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: synthesisProgress + '%' }"></div>
                    <div class="progress-text">{{ synthesisProgressText }}%</div>
                  </div>
                  <EnhancementAnimation v-if="synthesisInProgress" />
                </div>

                <div class="card-actions synthesis-actions">
                  <button
                    class="auto-synthesis-button"
                    type="button"
                    :disabled="autoSynthesisActive ? false : !canSynthesize"
                    @click="toggleAutoSynthesis"
                  >
                    {{ autoSynthesisActive ? '停止自动合成' : '自动合成' }}
                  </button>
                  <button
                    class="card-button"
                    :disabled="!canSynthesize"
                    type="button"
                    @click="performSynthesis"
                  >
                    合成
                  </button>
                  <button
                    class="reset-button"
                    type="button"
                    :disabled="synthesisInProgress"
                    @click="resetSynthesisSelections"
                  >
                    重置
                  </button>
                </div>
              </div>
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
              <div v-if="displayedEquipments.length === 0" class="no-equipment">{{ equipmentEmptyText }}</div>
              <div v-else class="equipment-list">
                <div
                  v-for="entry in displayedEquipments"
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
                    <div class="equipment-item-level">孔数: {{ entry.holeCount }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="showCardSelectorPanel"
          class="equipment-selector-overlay"
          @click="hideCardSelector"
        >
          <div
            class="equipment-selector-panel"
            :style="{ left: selectorPanelPositions.card.x + 'px', top: selectorPanelPositions.card.y + 'px' }"
            @click.stop
          >
            <div class="equipment-selector-header" @mousedown.stop="startCardSelectorDrag">
              <h3>卡片选择</h3>
              <button class="close-button" @click="hideCardSelector">&times;</button>
            </div>
            <div class="equipment-selector-content">
              <div v-if="availableCards.length === 0" class="no-equipment">{{ cardEmptyText }}</div>
              <div v-else class="equipment-list">
                <div
                  v-for="entry in availableCards"
                  :key="entry.key"
                  class="equipment-item"
                  @mouseenter="showItemTooltip($event, entry.item)"
                  @mouseleave="hideItemTooltip"
                  @mousemove="updateTooltipPosition"
                  @click="selectCard(entry)"
                >
                  <div class="equipment-item-icon-wrapper">
                    <img
                      :src="getItemIcon(entry.item)"
                      :alt="getItemName(entry.item)"
                      class="equipment-item-icon"
                    />
                    <div v-if="entry.quantity > 0" class="equipment-item-badge">{{ entry.quantity }}</div>
                  </div>
                  <div class="equipment-item-info">
                    <div class="equipment-item-name">{{ getItemName(entry.item) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="showSynthesisCardSelectorPanel"
          class="equipment-selector-overlay"
          @click="hideSynthesisCardSelector"
        >
          <div
            class="equipment-selector-panel"
            :style="{ left: selectorPanelPositions.synthesisCard.x + 'px', top: selectorPanelPositions.synthesisCard.y + 'px' }"
            @click.stop
          >
            <div class="equipment-selector-header" @mousedown.stop="startSynthesisCardSelectorDrag">
              <h3>选择合成卡片</h3>
              <button class="close-button" @click="hideSynthesisCardSelector">&times;</button>
            </div>
            <div class="equipment-selector-content">
              <div class="synthesis-filter-row">
                <button
                  class="synthesis-filter-button"
                  type="button"
                  :class="{ active: synthesisFilter === 'all' }"
                  @click="synthesisFilter = 'all'"
                >
                  全部
                </button>
                <button
                  class="synthesis-filter-button"
                  type="button"
                  :class="{ active: synthesisFilter === 'weaponShield' }"
                  @click="synthesisFilter = 'weaponShield'"
                >
                  武器/盾牌
                </button>
                <button
                  class="synthesis-filter-button"
                  type="button"
                  :class="{ active: synthesisFilter === 'armorSuit' }"
                  @click="synthesisFilter = 'armorSuit'"
                >
                  衣服
                </button>
              </div>
              <div v-if="availableSynthesisCards.length === 0" class="no-equipment">{{ synthesisEmptyText }}</div>
              <div v-else class="equipment-list">
                <div
                  v-for="entry in availableSynthesisCards"
                  :key="entry.key"
                  class="equipment-item"
                  @mouseenter="showItemTooltip($event, entry.item)"
                  @mouseleave="hideItemTooltip"
                  @mousemove="updateTooltipPosition"
                  @click="selectSynthesisCard(entry)"
                >
                  <div class="equipment-item-icon-wrapper">
                    <img
                      :src="getItemIcon(entry.item)"
                      :alt="getItemName(entry.item)"
                      class="equipment-item-icon"
                    />
                    <div v-if="entry.quantity > 0" class="equipment-item-badge">{{ entry.quantity }}</div>
                  </div>
                  <div class="equipment-item-info">
                    <div class="equipment-item-name">{{ getItemName(entry.item) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="showRemoveConfirmPanel && removeConfirmEntry"
          class="equipment-selector-overlay"
          @click="cancelRemoveConfirm"
        >
          <div
            class="equipment-selector-panel remove-confirm-panel"
            :style="{ left: selectorPanelPositions.removeConfirm.x + 'px', top: selectorPanelPositions.removeConfirm.y + 'px' }"
            @click.stop
          >
            <div class="equipment-selector-header" @mousedown.stop="startRemoveConfirmDrag">
              <h3>确认移除</h3>
              <button class="close-button" @click="cancelRemoveConfirm">&times;</button>
            </div>
            <div class="equipment-selector-content">
              <div class="remove-confirm-body">
                <div class="remove-confirm-line">
                  确定要从「{{ getItemName(selectedEquipmentDisplay) }}」移除「{{
                    getItemName(removeConfirmEntry.cardItem)
                  }}」吗？
                </div>
                <div class="remove-confirm-line">孔位: {{ removeConfirmEntry.level }}</div>
                <div class="remove-confirm-line">消耗金币: {{ removeCardCost }}</div>
                <div class="remove-confirm-line">当前金币: {{ playerGold }}</div>
                <div v-if="!canRemoveCard" class="remove-confirm-warning">金币不足，无法移除</div>
              </div>
              <div class="remove-confirm-actions">
                <button class="reset-button" type="button" @click="cancelRemoveConfirm">取消</button>
                <button class="card-button" type="button" :disabled="!canRemoveCard" @click="confirmRemoveCard">
                  确认移除
                </button>
              </div>
            </div>
          </div>
        </div>

        <EnhanceResultAnimation
          v-if="isVisible"
          :result="synthesisResultType"
          :trigger-key="synthesisResultKey"
        />
      </div>

      <!-- 规则面板（右侧外部） -->
      <transition name="rules-panel-fade">
        <div v-if="showRulesPanel" class="card-rules-panel" @click.stop>
          <div class="rules-panel-header">
            <span class="rules-panel-title">{{ currentTabTitle }}规则</span>
            <button class="rules-panel-close" @click="showRulesPanel = false">&times;</button>
          </div>
          <div class="rules-panel-content">
            <!-- 镶嵌卡片规则 -->
            <template v-if="currentTab === 'insert'">
              <div class="rules-section">
                <div class="rules-section-title">镶嵌规则</div>
                <div class="rules-item">装备必须有穿洞孔位才能镶嵌卡片</div>
                <div class="rules-item">每件装备最多可镶嵌4张卡片</div>
                <div class="rules-item">相同ID的卡片不能重复镶嵌</div>
              </div>
              <div class="rules-section">
                <div class="rules-section-title">镶嵌效果</div>
                <div class="rules-item highlight">镶嵌成功：卡片属性附加到装备</div>
                <div class="rules-item highlight">镶嵌失败：卡片消失，装备保留</div>
              </div>
              <div class="rules-section">
                <div class="rules-section-title">成功率</div>
                <div class="rules-item">基础成功率与卡片等级相关</div>
                <div class="rules-item">使用幸运卡片可提高成功率</div>
              </div>
            </template>

            <!-- 移除卡片规则 -->
            <template v-else-if="currentTab === 'remove'">
              <div class="rules-section">
                <div class="rules-section-title">移除规则</div>
                <div class="rules-item">只能移除已镶嵌的卡片</div>
                <div class="rules-item">移除卡片需要支付手续费</div>
                <div class="rules-item highlight">移除费用：5,000,000 Penya</div>
              </div>
              <div class="rules-section">
                <div class="rules-section-title">移除效果</div>
                <div class="rules-item highlight">卡片移除后返还到背包</div>
                <div class="rules-item">装备保留，空出卡槽</div>
              </div>
            </template>

            <!-- 合成卡片规则 -->
            <template v-else-if="currentTab === 'synthesis'">
              <div class="rules-section">
                <div class="rules-section-title">合成规则</div>
                <div class="rules-item highlight">3张相同卡片 + 1张相同卡片 = 升级卡片</div>
                <div class="rules-item">合成需要消耗金币</div>
                <div class="rules-item">合成有一定失败概率</div>
              </div>
              <div class="rules-section">
                <div class="rules-section-title">成功率</div>
                <div class="rules-item">基础成功率：60%</div>
                <div class="rules-item highlight">使用保护卷轴可防止材料损失</div>
              </div>
              <div class="rules-section">
                <div class="rules-section-title">合成结果</div>
                <div class="rules-item">成功：获得更高等级卡片</div>
                <div class="rules-item">失败：材料卡片全部消失</div>
              </div>
            </template>
          </div>
        </div>
      </transition>
    </div>
  </Transition>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useItemsStore } from '@/store/items'
import { getItemIcon, getItemName } from '@/utils/itemUtils'
import EnhanceResultAnimation from '@/components/EnhanceResultAnimation.vue'
import EnhancementAnimation from '@/components/EnhancementAnimation.vue'
import PanelResizeHandle from '@/components/common/PanelResizeHandle.vue'

export default {
  name: 'CardPanel',
  components: {
    EnhanceResultAnimation,
    EnhancementAnimation,
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
  emits: ['close', 'card-apply'],
  setup (props, { emit }) {
    const itemsStore = useItemsStore()

    const currentTab = ref('insert')
    const removeCardCost = 5000000
    const showRulesPanel = ref(false)

    const toggleRulesPanel = () => {
      showRulesPanel.value = !showRulesPanel.value
    }

    const selectedEquipment = ref(null)
    const selectedCard = ref(null)
    const selectedEquipmentMeta = ref(null)
    const selectedCardMeta = ref(null)

    const panelPosition = ref({ x: 0, y: 0 })
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })

    // 面板尺寸和拉伸
    const DEFAULT_WIDTH = 650
    const DEFAULT_HEIGHT = 500
    const MIN_WIDTH = 500
    const MIN_HEIGHT = 400
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
      card: { x: 150, y: 100 },
      synthesisCard: { x: 200, y: 100 },
      removeConfirm: { x: 100, y: 150 }
    })
    const selectorDragState = ref({
      equipment: { isDragging: false, offset: { x: 0, y: 0 } },
      card: { isDragging: false, offset: { x: 0, y: 0 } },
      synthesisCard: { isDragging: false, offset: { x: 0, y: 0 } },
      removeConfirm: { isDragging: false, offset: { x: 0, y: 0 } }
    })

    const showEquipmentSelectorPanel = ref(false)
    const showCardSelectorPanel = ref(false)
    const showSynthesisCardSelectorPanel = ref(false)
    const showRemoveConfirmPanel = ref(false)
    const removeConfirmEntry = ref(null)

    const selectedSynthesisCard = ref(null)
    const selectedSynthesisCardMeta = ref(null)
    const synthesisFilter = ref('all')
    const synthesisInProgress = ref(false)
    const synthesisProgress = ref(0)
    let synthesisProgressTimer = null
    let synthesisProgressInterval = null
    const synthesisResultType = ref('success')
    const synthesisResultKey = ref(0)
    const autoSynthesisActive = ref(false)
    let autoSynthesisTimer = null

    const initPanelPosition = () => {
      const panelWidth = 760
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
     * 开始拖动卡片选择面板
     */
    const startCardSelectorDrag = event => {
      selectorDragState.value.card.isDragging = true
      selectorDragState.value.card.offset = {
        x: event.clientX - selectorPanelPositions.value.card.x,
        y: event.clientY - selectorPanelPositions.value.card.y
      }
      document.addEventListener('mousemove', onCardSelectorDrag)
      document.addEventListener('mouseup', stopCardSelectorDrag)
    }

    const onCardSelectorDrag = event => {
      if (!selectorDragState.value.card.isDragging) return
      selectorPanelPositions.value.card = {
        x: event.clientX - selectorDragState.value.card.offset.x,
        y: event.clientY - selectorDragState.value.card.offset.y
      }
    }

    const stopCardSelectorDrag = () => {
      selectorDragState.value.card.isDragging = false
      document.removeEventListener('mousemove', onCardSelectorDrag)
      document.removeEventListener('mouseup', stopCardSelectorDrag)
    }

    /**
     * 开始拖动合成卡片选择面板
     */
    const startSynthesisCardSelectorDrag = event => {
      selectorDragState.value.synthesisCard.isDragging = true
      selectorDragState.value.synthesisCard.offset = {
        x: event.clientX - selectorPanelPositions.value.synthesisCard.x,
        y: event.clientY - selectorPanelPositions.value.synthesisCard.y
      }
      document.addEventListener('mousemove', onSynthesisCardSelectorDrag)
      document.addEventListener('mouseup', stopSynthesisCardSelectorDrag)
    }

    const onSynthesisCardSelectorDrag = event => {
      if (!selectorDragState.value.synthesisCard.isDragging) return
      selectorPanelPositions.value.synthesisCard = {
        x: event.clientX - selectorDragState.value.synthesisCard.offset.x,
        y: event.clientY - selectorDragState.value.synthesisCard.offset.y
      }
    }

    const stopSynthesisCardSelectorDrag = () => {
      selectorDragState.value.synthesisCard.isDragging = false
      document.removeEventListener('mousemove', onSynthesisCardSelectorDrag)
      document.removeEventListener('mouseup', stopSynthesisCardSelectorDrag)
    }

    /**
     * 开始拖动移除确认面板
     */
    const startRemoveConfirmDrag = event => {
      selectorDragState.value.removeConfirm.isDragging = true
      selectorDragState.value.removeConfirm.offset = {
        x: event.clientX - selectorPanelPositions.value.removeConfirm.x,
        y: event.clientY - selectorPanelPositions.value.removeConfirm.y
      }
      document.addEventListener('mousemove', onRemoveConfirmDrag)
      document.addEventListener('mouseup', stopRemoveConfirmDrag)
    }

    const onRemoveConfirmDrag = event => {
      if (!selectorDragState.value.removeConfirm.isDragging) return
      selectorPanelPositions.value.removeConfirm = {
        x: event.clientX - selectorDragState.value.removeConfirm.offset.x,
        y: event.clientY - selectorDragState.value.removeConfirm.offset.y
      }
    }

    const stopRemoveConfirmDrag = () => {
      selectorDragState.value.removeConfirm.isDragging = false
      document.removeEventListener('mousemove', onRemoveConfirmDrag)
      document.removeEventListener('mouseup', stopRemoveConfirmDrag)
    }

    initPanelPosition()

    const resolveHoleCount = equipment => {
      if (!equipment) {
        return 0
      }
      const attrs = equipment.PerforationAttributes || {}
      const fromAttrs = Number(attrs.holeCount)
      if (Number.isFinite(fromAttrs) && fromAttrs >= 0) {
        return fromAttrs
      }
      const fromRoot = Number(equipment.holeCount)
      return Number.isFinite(fromRoot) && fromRoot >= 0 ? fromRoot : 0
    }

    const resolveEmbeddedCardCount = equipment => {
      if (!equipment) {
        return 0
      }
      const attrs = equipment.PerforationAttributes
      if (!attrs || typeof attrs !== 'object') {
        return 0
      }
      const levels = attrs.perforationLevels
      if (!levels || typeof levels !== 'object') {
        return 0
      }
      return Object.values(levels).filter(level => level && level.embeddedCardId !== null && level.embeddedCardId !== undefined).length
    }

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
          if (hasId && Number(candidate.id) === Number(id)) {
            return candidate
          }
        }
      }
      if (uniqueId) {
        const found = bag.find(item => item && item.uniqueId && String(item.uniqueId) === String(uniqueId))
        if (found) {
          return found
        }
      }
      if (hasId) {
        const found = bag.find(item => item && Number(item.id) === Number(id))
        if (found) {
          return found
        }
      }
      return null
    }

    const selectedEquipmentDisplay = computed(() => {
      const resolved = resolveBagItem(selectedEquipmentMeta.value)
      return resolved || selectedEquipment.value
    })

    const selectedCardDisplay = computed(() => {
      const resolved = resolveBagItem(selectedCardMeta.value)
      return resolved || selectedCard.value
    })

    const selectedSynthesisCardDisplay = computed(() => {
      const resolved = resolveBagItem(selectedSynthesisCardMeta.value)
      return resolved || selectedSynthesisCard.value
    })

    const holeCount = computed(() => resolveHoleCount(selectedEquipmentDisplay.value))

    const embeddedCardCount = computed(() => {
      const equipment = selectedEquipmentDisplay.value
      if (!equipment) {
        return 0
      }
      return resolveEmbeddedCardCount(equipment)
    })

    const perforationSlots = computed(() => {
      const equipment = selectedEquipmentDisplay.value
      const max = holeCount.value
      if (!equipment || !Number.isFinite(max) || max <= 0) {
        return []
      }

      const attrs = equipment.PerforationAttributes || {}
      const levels = attrs.perforationLevels && typeof attrs.perforationLevels === 'object' ? attrs.perforationLevels : {}
      const slots = []
      for (let level = 1; level <= max; level++) {
        const key = String(level)
        const entry = levels[key]
        const embedded = entry?.embeddedCardId
        let cardId = null
        if (embedded && typeof embedded === 'object') {
          const idCandidate = Number(embedded.cardId)
          cardId = Number.isFinite(idCandidate) && idCandidate > 0 ? idCandidate : null
        } else {
          const idCandidate = Number(embedded)
          cardId = Number.isFinite(idCandidate) && idCandidate > 0 ? idCandidate : null
        }
        slots.push({
          level,
          cardId,
          cardItem: cardId ? itemsStore.getItemConfig(cardId) : null
        })
      }
      return slots
    })

    const embeddedCardEntries = computed(() => {
      return perforationSlots.value
        .filter(slot => slot && Number.isFinite(Number(slot.cardId)) && Number(slot.cardId) > 0)
        .map(slot => ({
          level: slot.level,
          cardId: slot.cardId,
          cardItem: slot.cardItem || itemsStore.getItemConfig(slot.cardId)
        }))
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
    // 武器盾卡ID
    const weaponShieldCardIds = new Set([
      301, 1950, 6822, 7311, 7555, 7820, 8473, 8808,
      2731, 2799, 3153, 5074, 5681, 6605, 6833, 7382,
      637, 1932, 4353, 5577, 6434, 7851, 8515, 8810,
      1961, 2517, 3100, 4565, 5666, 5964, 8591, 8814
    ])
    // 护甲套装卡ID
    const armorSuitCardIds = new Set([
      14, 107, 1159, 7559, 8926,
      2811, 5545, 5788, 6242, 6439,
      4126, 4635, 5945, 7436, 8243,
      576, 1673, 2416, 4670, 5830
    ])
    // 合成卡片成功概率
    const synthesisRuleByBaseId = new Map()
    const synthesisStepRules = [
      { probability: 0.3, cost: 40000 },
      { probability: 0.15, cost: 400000 },
      { probability: 0.04, cost: 4000000 }
    ]

    const registerSynthesisTiers = (tiers, kindLabel) => {
      for (let i = 0; i < Math.min(tiers.length - 1, synthesisStepRules.length); i += 1) {
        const baseId = Number(tiers[i])
        const nextId = Number(tiers[i + 1])
        if (!Number.isFinite(baseId) || !Number.isFinite(nextId)) {
          continue
        }
        synthesisRuleByBaseId.set(baseId, {
          nextId,
          probability: synthesisStepRules[i].probability,
          cost: synthesisStepRules[i].cost,
          kindLabel
        })
      }
    }
    // 合成卡片筛选规则
    registerSynthesisTiers([301, 7382, 6434, 5666], '体质')
    registerSynthesisTiers([1950, 3153, 1932, 2517], '力量')
    registerSynthesisTiers([6822, 5681, 5577, 4565], '技能伤害')
    registerSynthesisTiers([7311, 5074, 7851, 8814], '格挡穿透')
    registerSynthesisTiers([7555, 6833, 8515, 5964], '暴击攻速')
    registerSynthesisTiers([7820, 2799, 8810, 3100], '敏捷')
    registerSynthesisTiers([8473, 2731, 4353, 1961], '爆伤')
    registerSynthesisTiers([8808, 6605, 637, 8591], '智力')

    registerSynthesisTiers([14, 5788, 5945, 4670], 'FP')
    registerSynthesisTiers([107, 2811, 4635, 2416], '生命值')
    registerSynthesisTiers([1159, 6439, 4126, 1673], '魔法值')
    registerSynthesisTiers([7559, 5545, 8243, 576], '攻击力')
    registerSynthesisTiers([8926, 6242, 7436, 5830], '防御力')

    const allowedCardIds = computed(() => {
      if (equipmentType.value === 'weaponShield') {
        return weaponShieldCardIds
      }
      if (equipmentType.value === 'armorSuit') {
        return armorSuitCardIds
      }
      return new Set()
    })

    const synthesisAllowedCardIds = computed(() => {
      const all = new Set()
      weaponShieldCardIds.forEach(id => all.add(id))
      armorSuitCardIds.forEach(id => all.add(id))
      return all
    })

    const availableEquipmentsForInsert = computed(() => {
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
          const isSupported =
            item.category === 'weapon' ||
            (item.category === 'armor' && (item.subcategory === 'suit' || item.subcategory === 'shield'))
          if (!isSupported) {
            return false
          }
          const holes = resolveHoleCount(item)
          if (holes <= 0) {
            return false
          }
          return resolveEmbeddedCardCount(item) < holes
        })

      return candidates.map(({ item, bagIndex }) => ({
        item,
        bagIndex,
        holeCount: resolveHoleCount(item),
        key: item.uniqueId || `${item.id}-${bagIndex}`
      }))
    })

    const availableEquipmentsForRemove = computed(() => {
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
          const isSupported =
            item.category === 'weapon' ||
            (item.category === 'armor' && (item.subcategory === 'suit' || item.subcategory === 'shield'))
          if (!isSupported) {
            return false
          }
          const holes = resolveHoleCount(item)
          if (holes <= 0) {
            return false
          }
          return resolveEmbeddedCardCount(item) > 0
        })

      return candidates.map(({ item, bagIndex }) => ({
        item,
        bagIndex,
        holeCount: resolveHoleCount(item),
        key: item.uniqueId || `${item.id}-${bagIndex}`
      }))
    })

    const displayedEquipments = computed(() => {
      return currentTab.value === 'remove' ? availableEquipmentsForRemove.value : availableEquipmentsForInsert.value
    })

    const equipmentEmptyText = computed(() => {
      return currentTab.value === 'remove'
        ? '没有可以移除卡片的装备(仅显示已镶嵌卡片的穿孔装备)'
        : '没有可以镶嵌的装备(仅显示有穿孔的装备)'
    })

    const availableCards = computed(() => {
      const bag = itemsStore.playerBag
      if (!selectedEquipmentDisplay.value) {
        return []
      }
      if (!bag || bag.length === 0) {
        return []
      }
      const allowed = allowedCardIds.value
      if (!allowed || allowed.size === 0) {
        return []
      }
      const candidates = bag
        .map((item, bagIndex) => ({ item, bagIndex }))
        .filter(({ item }) => {
          if (!item) {
            return false
          }
          if (!allowed.has(Number(item.id))) {
            return false
          }
          const quantity = Number(item.currentStack ?? item.quantity ?? 0)
          return Number.isFinite(quantity) && quantity > 0
        })

      return candidates.map(({ item, bagIndex }) => ({
        item,
        bagIndex,
        quantity: Number(item.currentStack ?? item.quantity ?? 1),
        key: item.uniqueId || `${item.id}-${bagIndex}`
      }))
    })

    const cardEmptyText = computed(() => {
      if (!selectedEquipmentDisplay.value) {
        return '请先选择装备'
      }
      if (!equipmentType.value) {
        return '该装备不支持卡片镶嵌'
      }
      return '没有可用的卡片'
    })

    const availableSynthesisCards = computed(() => {
      const bag = itemsStore.playerBag
      if (!bag || bag.length === 0) {
        return []
      }

      const filterValue = synthesisFilter.value
      const allowed = filterValue === 'weaponShield'
        ? weaponShieldCardIds
        : filterValue === 'armorSuit'
          ? armorSuitCardIds
          : synthesisAllowedCardIds.value

      if (!allowed || allowed.size === 0) {
        return []
      }

      const candidates = bag
        .map((item, bagIndex) => ({ item, bagIndex }))
        .filter(({ item }) => {
          if (!item) {
            return false
          }
          const cardId = Number(item.id)
          if (!Number.isFinite(cardId) || !allowed.has(cardId)) {
            return false
          }
          if (!synthesisRuleByBaseId.has(cardId)) {
            return false
          }
          const quantity = Number(item.currentStack ?? item.quantity ?? 0)
          return Number.isFinite(quantity) && quantity > 0
        })

      return candidates.map(({ item, bagIndex }) => ({
        item,
        bagIndex,
        quantity: Number(item.currentStack ?? item.quantity ?? 1),
        key: item.uniqueId || `${item.id}-${bagIndex}`
      }))
    })

    const synthesisEmptyText = computed(() => {
      return '背包中没有可合成的卡片'
    })

    const selectedCardStack = computed(() => {
      const card = selectedCardDisplay.value
      if (!card) {
        return 0
      }
      const stack = Number(card.currentStack ?? card.quantity ?? 0)
      return Number.isFinite(stack) && stack > 0 ? stack : 0
    })

    const hasEmptySlot = computed(() => {
      const max = holeCount.value
      if (!Number.isFinite(max) || max <= 0) {
        return false
      }
      return embeddedCardCount.value < max
    })

    const canInsertCard = computed(() => {
      if (!selectedEquipmentDisplay.value || !selectedCardDisplay.value) {
        return false
      }
      if (!equipmentType.value) {
        return false
      }
      if (!hasEmptySlot.value || holeCount.value <= 0) {
        return false
      }
      const allowed = allowedCardIds.value
      const cardId = Number(selectedCardDisplay.value.id)
      if (!Number.isFinite(cardId) || !allowed || !allowed.has(cardId)) {
        return false
      }
      return selectedCardStack.value > 0
    })

    const playerGold = computed(() => {
      const fromProps = Number(props.player?.gold ?? 0)
      if (Number.isFinite(fromProps) && fromProps > 0) {
        return fromProps
      }
      const fromStore = Number(itemsStore.playerGold ?? 0)
      return Number.isFinite(fromStore) ? fromStore : 0
    })

    const canRemoveCard = computed(() => {
      return playerGold.value >= removeCardCost
    })

    const synthesisRequiredCount = 10

    const synthesisBaseCardId = computed(() => {
      const baseId = Number(selectedSynthesisCardDisplay.value?.id)
      return Number.isFinite(baseId) ? baseId : null
    })

    const synthesisRule = computed(() => {
      const baseId = synthesisBaseCardId.value
      if (baseId === null) {
        return null
      }
      return synthesisRuleByBaseId.get(baseId) || null
    })

    const synthesisTargetCardId = computed(() => {
      return synthesisRule.value?.nextId ?? null
    })

    const synthesisTargetCardItem = computed(() => {
      const nextId = synthesisTargetCardId.value
      if (nextId === null || !Number.isFinite(nextId)) {
        return null
      }
      return itemsStore.getItemConfig(nextId) || { id: nextId }
    })

    const synthesisOwnedCount = computed(() => {
      const baseId = synthesisBaseCardId.value
      if (baseId === null) {
        return 0
      }
      const bag = itemsStore.playerBag
      if (!bag || bag.length === 0) {
        return 0
      }
      let total = 0
      bag.forEach(item => {
        if (!item || Number(item.id) !== baseId) {
          return
        }
        const stack = Number(item.currentStack ?? item.quantity ?? 0)
        if (Number.isFinite(stack) && stack > 0) {
          total += stack
        }
      })
      return total
    })

    const synthesisProbabilityText = computed(() => {
      const prob = Number(synthesisRule.value?.probability ?? 0)
      if (!Number.isFinite(prob) || prob <= 0) {
        return '0%'
      }
      return `${(prob * 100).toFixed(0)}%`
    })

    const synthesisCost = computed(() => {
      const cost = Number(synthesisRule.value?.cost ?? 0)
      return Number.isFinite(cost) ? cost : 0
    })

    const synthesisCostText = computed(() => {
      return synthesisCost.value > 0 ? `${synthesisCost.value}` : '0'
    })

    const canSynthesizeResources = computed(() => {
      if (!selectedSynthesisCardDisplay.value) {
        return false
      }
      if (!synthesisRule.value || !synthesisTargetCardItem.value) {
        return false
      }
      if (synthesisOwnedCount.value < synthesisRequiredCount) {
        return false
      }
      return playerGold.value >= synthesisCost.value
    })

    const canSynthesize = computed(() => {
      if (synthesisInProgress.value) {
        return false
      }
      return canSynthesizeResources.value
    })

    const synthesisProgressText = computed(() => {
      const numeric = Number(synthesisProgress.value ?? 0)
      if (!Number.isFinite(numeric) || numeric <= 0) {
        return 0
      }
      if (numeric >= 100) {
        return 100
      }
      return Math.floor(numeric)
    })

    const currentTabTitle = computed(() => {
      if (currentTab.value === 'remove') {
        return '移除卡片'
      }
      if (currentTab.value === 'synthesis') {
        return '合成卡片'
      }
      return '镶嵌卡片'
    })

    const close = () => {
      emit('close')
    }

    const switchTab = tab => {
      currentTab.value = tab
      showEquipmentSelectorPanel.value = false
      showCardSelectorPanel.value = false
      showSynthesisCardSelectorPanel.value = false
      showRemoveConfirmPanel.value = false
      removeConfirmEntry.value = null
      if (tab !== 'insert') {
        selectedCard.value = null
        selectedCardMeta.value = null
      }
      if (tab !== 'synthesis') {
        stopAutoSynthesis()
      }
    }

    const showEquipmentSelector = () => {
      showCardSelectorPanel.value = false
      showEquipmentSelectorPanel.value = true
    }

    const hideEquipmentSelector = () => {
      showEquipmentSelectorPanel.value = false
    }

    const showCardSelector = () => {
      showEquipmentSelectorPanel.value = false
      showCardSelectorPanel.value = true
    }

    const hideCardSelector = () => {
      showCardSelectorPanel.value = false
    }

    const showSynthesisCardSelector = () => {
      showEquipmentSelectorPanel.value = false
      showCardSelectorPanel.value = false
      showSynthesisCardSelectorPanel.value = true
    }

    const hideSynthesisCardSelector = () => {
      showSynthesisCardSelectorPanel.value = false
    }

    const selectEquipment = entry => {
      const equipment = entry.item
      selectedEquipment.value = { ...equipment }
      selectedEquipmentMeta.value = {
        id: equipment?.id ?? null,
        uniqueId: equipment?.uniqueId ?? null,
        bagIndex: entry.bagIndex
      }
      selectedCard.value = null
      selectedCardMeta.value = null
      showRemoveConfirmPanel.value = false
      removeConfirmEntry.value = null
      hideEquipmentSelector()
      hideItemTooltip() // 关闭物品详情面板
    }

    const selectCard = entry => {
      selectedCard.value = { ...entry.item }
      selectedCardMeta.value = {
        id: entry.item?.id ?? null,
        uniqueId: entry.item?.uniqueId ?? null,
        bagIndex: entry.bagIndex
      }
      hideCardSelector()
      hideItemTooltip() // 关闭物品详情面板
    }

    const selectSynthesisCard = entry => {
      selectedSynthesisCard.value = { ...entry.item }
      selectedSynthesisCardMeta.value = {
        id: entry.item?.id ?? null,
        uniqueId: entry.item?.uniqueId ?? null,
        bagIndex: entry.bagIndex
      }
      hideSynthesisCardSelector()
      hideItemTooltip() // 关闭物品详情面板
    }

    const resetSelections = () => {
      selectedEquipment.value = null
      selectedCard.value = null
      selectedEquipmentMeta.value = null
      selectedCardMeta.value = null
      showEquipmentSelectorPanel.value = false
      showCardSelectorPanel.value = false
      showSynthesisCardSelectorPanel.value = false
      showRemoveConfirmPanel.value = false
      removeConfirmEntry.value = null
    }

    const stopSynthesisTimers = () => {
      if (synthesisProgressTimer) {
        clearTimeout(synthesisProgressTimer)
        synthesisProgressTimer = null
      }
      stopSynthesisProgressInterval()
    }

    const stopSynthesisProgressInterval = () => {
      if (synthesisProgressInterval) {
        clearInterval(synthesisProgressInterval)
        synthesisProgressInterval = null
      }
    }

    const stopAutoSynthesis = () => {
      autoSynthesisActive.value = false
      if (autoSynthesisTimer) {
        clearTimeout(autoSynthesisTimer)
        autoSynthesisTimer = null
      }
    }

    const resetSynthesisSelections = () => {
      stopSynthesisTimers()
      stopAutoSynthesis()
      synthesisInProgress.value = false
      synthesisProgress.value = 0
      selectedSynthesisCard.value = null
      selectedSynthesisCardMeta.value = null
      showSynthesisCardSelectorPanel.value = false
    }

    watch(
      () => props.isVisible,
      (visible, wasVisible) => {
        if (wasVisible && !visible) {
          resetSelections()
          resetSynthesisSelections()
          currentTab.value = 'insert'
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

    const performCardInsert = () => {
      if (!canInsertCard.value) {
        return
      }

      const max = holeCount.value
      let targetLevelKey = null
      for (let level = 1; level <= max; level++) {
        const key = String(level)
        const existing = selectedEquipmentDisplay.value?.PerforationAttributes?.perforationLevels?.[key]
        if (!existing || existing.embeddedCardId === null || existing.embeddedCardId === undefined) {
          targetLevelKey = key
          break
        }
      }

      if (!targetLevelKey) {
        return
      }

      const cardId = Number(selectedCardDisplay.value?.id)
      if (!Number.isFinite(cardId)) {
        return
      }

      emit('card-apply', {
        action: 'insert',
        equipmentId: selectedEquipmentMeta.value?.id ?? selectedEquipmentDisplay.value?.id ?? null,
        equipmentUniqueId: selectedEquipmentMeta.value?.uniqueId ?? null,
        equipmentBagIndex: selectedEquipmentMeta.value?.bagIndex ?? null,
        cardId,
        cardUniqueId: selectedCardMeta.value?.uniqueId ?? null,
        cardBagIndex: selectedCardMeta.value?.bagIndex ?? null,
        targetHoleLevel: Number(targetLevelKey)
      })
    }

    const performCardRemove = entry => {
      if (!entry || !selectedEquipmentDisplay.value) {
        return
      }
      if (!canRemoveCard.value) {
        return
      }
      const level = Number(entry.level)
      if (!Number.isFinite(level) || level < 1) {
        return
      }
      const cardId = Number(entry.cardId)
      if (!Number.isFinite(cardId) || cardId <= 0) {
        return
      }
      emit('card-apply', {
        action: 'remove',
        equipmentId: selectedEquipmentMeta.value?.id ?? selectedEquipmentDisplay.value?.id ?? null,
        equipmentUniqueId: selectedEquipmentMeta.value?.uniqueId ?? null,
        equipmentBagIndex: selectedEquipmentMeta.value?.bagIndex ?? null,
        targetHoleLevel: level,
        removeCardId: cardId,
        removeCost: removeCardCost
      })
    }

    const requestRemoveConfirm = entry => {
      if (!entry || !selectedEquipmentDisplay.value) {
        return
      }
      removeConfirmEntry.value = entry
      showRemoveConfirmPanel.value = true
      showEquipmentSelectorPanel.value = false
      showCardSelectorPanel.value = false
    }

    const cancelRemoveConfirm = () => {
      showRemoveConfirmPanel.value = false
      removeConfirmEntry.value = null
    }

    const confirmRemoveCard = () => {
      const entry = removeConfirmEntry.value
      cancelRemoveConfirm()
      performCardRemove(entry)
    }

    const performSynthesis = () => {
      if (!canSynthesize.value) {
        return
      }
      stopSynthesisTimers()
      synthesisInProgress.value = true
      synthesisProgress.value = 0

      const duration = 1000
      const interval = 45
      const startAt = Date.now()
      synthesisProgressInterval = setInterval(() => {
        const elapsed = Date.now() - startAt
        const progress = Math.min(100, (elapsed / duration) * 100)
        synthesisProgress.value = progress
        if (progress >= 100) {
          stopSynthesisProgressInterval()
        }
      }, interval)

      synthesisProgressTimer = setTimeout(() => {
        stopSynthesisProgressInterval()
        synthesisProgressTimer = null
        synthesisInProgress.value = false
        synthesisProgress.value = 100

        const baseId = synthesisBaseCardId.value
        const rule = synthesisRule.value
        const targetId = synthesisTargetCardId.value
        if (baseId === null || !rule || targetId === null) {
          return
        }

        const probability = Number(rule.probability ?? 0)
        const isSuccess = Number.isFinite(probability) && probability > 0 ? Math.random() < probability : false
        synthesisResultType.value = isSuccess ? 'success' : 'failure'
        synthesisResultKey.value += 1

        emit('card-apply', {
          action: 'synthesize',
          baseCardId: baseId,
          resultCardId: targetId,
          requiredCount: synthesisRequiredCount,
          probability,
          cost: synthesisCost.value,
          success: isSuccess
        })
      }, duration)
    }

    const runAutoSynthesisLoop = () => {
      if (!autoSynthesisActive.value) {
        return
      }
      if (synthesisInProgress.value) {
        autoSynthesisTimer = setTimeout(() => {
          runAutoSynthesisLoop()
        }, 200)
        return
      }
      if (!canSynthesizeResources.value) {
        stopAutoSynthesis()
        return
      }
      performSynthesis()
      autoSynthesisTimer = setTimeout(() => {
        runAutoSynthesisLoop()
      }, 1300)
    }

    const toggleAutoSynthesis = () => {
      if (autoSynthesisActive.value) {
        stopAutoSynthesis()
        return
      }
      if (!canSynthesizeResources.value) {
        return
      }
      autoSynthesisActive.value = true
      runAutoSynthesisLoop()
    }

    return {
      currentTab,
      currentTabTitle,
      switchTab,
      showRulesPanel,
      toggleRulesPanel,
      removeCardCost,
      playerGold,
      selectedEquipment,
      selectedCard,
      selectedEquipmentDisplay,
      selectedCardDisplay,
      canInsertCard,
      canRemoveCard,
      showRemoveConfirmPanel,
      removeConfirmEntry,
      requestRemoveConfirm,
      cancelRemoveConfirm,
      confirmRemoveCard,
      hasEmptySlot,
      holeCount,
      embeddedCardCount,
      perforationSlots,
      embeddedCardEntries,
      selectedCardStack,
      selectedSynthesisCardDisplay,
      synthesisOwnedCount,
      synthesisRequiredCount,
      synthesisProbabilityText,
      synthesisCostText,
      synthesisTargetCardItem,
      canSynthesizeResources,
      canSynthesize,
      synthesisInProgress,
      synthesisProgress,
      synthesisProgressText,
      synthesisResultType,
      synthesisResultKey,
      autoSynthesisActive,
      close,
      selectEquipment,
      selectCard,
      selectSynthesisCard,
      performCardInsert,
      performCardRemove,
      performSynthesis,
      toggleAutoSynthesis,
      panelPosition,
      panelStyle,
      contentStyle,
      startDrag,
      startResize,
      showEquipmentSelectorPanel,
      showCardSelectorPanel,
      showSynthesisCardSelectorPanel,
      showEquipmentSelector,
      hideEquipmentSelector,
      showCardSelector,
      hideCardSelector,
      synthesisFilter,
      showSynthesisCardSelector,
      hideSynthesisCardSelector,
      displayedEquipments,
      equipmentEmptyText,
      availableCards,
      cardEmptyText,
      availableSynthesisCards,
      synthesisEmptyText,
      resetSelections,
      resetSynthesisSelections,
      getItemIcon,
      getItemName,
      showItemTooltip,
      hideItemTooltip,
      updateTooltipPosition,
      // 选择框面板拖动
      selectorPanelPositions,
      startEquipmentSelectorDrag,
      startCardSelectorDrag,
      startSynthesisCardSelectorDrag,
      startRemoveConfirmDrag
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

/* 外层容器 */
.card-panel-outer {
  position: fixed;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 12px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: visible;
}

.card-panel__inner {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-radius: 10px;
}

.dealer-badge {
  position: absolute;
  bottom: 3px;
  left: 18px;
  width: 120px;
  height: auto;
  z-index: 1001;
  pointer-events: none;
  user-select: none;
}

/* 头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(90deg, #2a2a4a 0%, #3a3a5a 100%);
  border-radius: 10px 10px 0 0;
  cursor: move;
  user-select: none;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
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
.card-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
}

.card-layout {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

/* 侧边菜单 */
.card-menu {
  width: 120px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.menu-button {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #4a4a6a;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-button:hover {
  background: rgba(255, 215, 0, 0.15);
  border-color: #ffd700;
}

.menu-button.active {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #1a1a2a;
  border-color: #ffd700;
  font-weight: bold;
}

.card-main {
  flex: 1;
  min-width: 0;
}

.card-instructions {
  background: rgba(153, 50, 204, 0.1);
  border-radius: 10px;
  padding: 10px;
  border: 1px solid #9932cc;
}

.card-instructions p {
  color: #fff;
  font-size: 14px;
  margin: 0;
  text-align: center;
}

.card-slots {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.slot-container {
  text-align: center;
  flex: 1;
}

.slot-container h3 {
  color: #9932cc;
  margin-bottom: 10px;
}

.slot {
  width: 120px;
  height: 120px;
  border: 2px dashed #9932cc;
  border-radius: 10px;
  position: relative;
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
  background: rgba(153, 50, 204, 0.2);
  transform: translateY(-2px);
}

.slot-icon {
  width: 60px;
  height: 60px;
  object-fit: contain;
  margin-bottom: 5px;
}

.slot-placeholder {
  width: 60px;
  height: 60px;
  object-fit: contain;
  opacity: 0.85;
  margin-bottom: 5px;
}

.slot-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.75);
  color: #ffd700;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-slot {
  font-size: 36px;
  color: #9932cc;
}

.slot-name {
  color: #fff;
  font-size: 12px;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.equipment-cards {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.card-item {
  width: 30px;
  height: 30px;
  border: 1px solid #9932cc;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(153, 50, 204, 0.1);
}

.card-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.empty-card {
  color: #9932cc;
  font-size: 10px;
}

.equipment-info {
  margin-top: 10px;
  color: #fff;
  font-size: 13px;
  text-align: center;
}

.card-actions {
  text-align: center;
}

.auto-synthesis-button {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid rgba(153, 50, 204, 0.6);
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  margin-right: 10px;
}

.auto-synthesis-button:hover:not(:disabled) {
  background: rgba(153, 50, 204, 0.25);
}

.auto-synthesis-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.synthesis-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 14px 0 12px;
  color: #fff;
  font-size: 13px;
}

.synthesis-info-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(153, 50, 204, 0.45);
  background: rgba(255, 255, 255, 0.06);
}

.synthesis-info-label {
  opacity: 0.85;
}

.synthesis-info-value {
  color: #ffd700;
  font-weight: bold;
}

.synthesis-progress-row {
  margin: 10px 0 12px;
}

.progress-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 18px;
  border-radius: 9px;
  border: 1px solid rgba(153, 50, 204, 0.7);
  background: rgba(0, 0, 0, 0.35);
  overflow: hidden;
  position: relative;
  min-width: 240px;
  max-width: 420px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(153, 50, 204, 0.8), rgba(255, 215, 0, 0.8));
  transition: width 0.12s linear;
}

.progress-text {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
}

.synthesis-filter-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.synthesis-filter-button {
  flex: 1;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(153, 50, 204, 0.8);
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: bold;
  transition: all 0.2s;
}

.synthesis-filter-button:hover {
  background: rgba(153, 50, 204, 0.18);
}

.synthesis-filter-button.active {
  background: rgba(153, 50, 204, 0.35);
  border-color: rgba(153, 50, 204, 1);
  color: #ffd700;
}

.result-slot.disabled {
  cursor: default;
  opacity: 0.85;
}

.remove-equipment-area {
  display: flex;
  justify-content: center;
}

.remove-cost-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin: 10px 0 12px;
  color: #fff;
  font-size: 13px;
  opacity: 0.95;
}

.remove-cost-text {
  color: #ffd700;
  font-weight: bold;
}

.remove-gold-text {
  color: #fff;
}

.remove-empty {
  color: #fff;
  opacity: 0.85;
  text-align: center;
  padding: 18px 0;
}

.remove-card-list {
  gap: 5px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  justify-content: center;
}

.remove-card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(153, 50, 204, 0.45);
  background: rgba(255, 255, 255, 0.06);
  font-size: 10px;
}

.remove-card-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.remove-card-icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  flex: 0 0 auto;
}

.remove-card-empty {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(153, 50, 204, 0.9);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9932cc;
  font-weight: bold;
  flex: 0 0 auto;
}

.remove-card-name {
  color: #fff;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-card-level {
  color: #fff;
  opacity: 0.85;
  font-size: 12px;
  flex: 0 0 auto;
}

.remove-card-button {
  padding: 8px 14px;
  border-radius: 18px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #9932cc, #8a2be2);
  color: white;
  font-weight: bold;
}

.remove-card-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.card-hint {
  color: #ffd700;
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 10px;
}

.card-button {
  padding: 12px 30px;
  background: linear-gradient(135deg, #9932cc, #8a2be2);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(138, 43, 226, 0.3);
}

.card-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(138, 43, 226, 0.5);
}

.card-button:disabled {
  background: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.reset-button {
  margin-left: 10px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid rgba(153, 50, 204, 0.6);
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-button:hover {
  background: rgba(153, 50, 204, 0.25);
}

.equipment-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.equipment-selector-panel {
  position: fixed;
  width: 420px;
  max-height: 70vh;
  background: linear-gradient(135deg, #2c3e50, #1a1a2e);
  border: 2px solid #9932cc;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 1101;
}

.equipment-selector-header {
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(153, 50, 204, 0.6);
  cursor: move;
  user-select: none;
}

.equipment-selector-header h3 {
  margin: 0;
  color: #9932cc;
  font-size: 18px;
}

.equipment-selector-content {
  padding: 14px;
  overflow-y: auto;
}

.no-equipment {
  color: #fff;
  opacity: 0.85;
  text-align: center;
  padding: 18px 0;
}

.equipment-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.equipment-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border: 1px solid rgba(153, 50, 204, 0.45);
  border-radius: 10px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  transition: all 0.2s;
}

.equipment-item:hover {
  background: rgba(153, 50, 204, 0.18);
}

.equipment-item-icon {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.equipment-item-icon-wrapper {
  position: relative;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
}

.equipment-item-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.75);
  color: #ffd700;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.equipment-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #fff;
}

.equipment-item-name {
  font-weight: bold;
}

.equipment-item-level {
  font-size: 12px;
  opacity: 0.85;
}

.remove-confirm-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #fff;
  text-align: center;
}

.remove-confirm-warning {
  color: #ffcc00;
  font-weight: bold;
}

.remove-confirm-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

/* 滚动条样式 */
.card-content::-webkit-scrollbar,
.card-panel-outer::-webkit-scrollbar {
  width: 6px;
}

.card-content::-webkit-scrollbar-track,
.card-panel-outer::-webkit-scrollbar-track {
  background: #1a1a2e;
  border-radius: 3px;
}

.card-content::-webkit-scrollbar-thumb,
.card-panel-outer::-webkit-scrollbar-thumb {
  background: #4a4a6a;
  border-radius: 3px;
}

.card-content::-webkit-scrollbar-thumb:hover,
.card-panel-outer::-webkit-scrollbar-thumb:hover {
  background: #5a5a7a;
}

/* 头部操作区域 */
.card-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 帮助按钮 */
.card-help-btn {
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

.card-help-btn:hover {
  background: linear-gradient(135deg, #5a7aaa 0%, #4a6a9a 100%);
  border-color: #8aaaca;
  box-shadow: 0 0 10px rgba(106, 138, 186, 0.5);
}

.card-help-btn.active {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-color: #ffdd44;
  color: #1a1a2a;
}

/* 规则面板过渡动画 */
.rules-panel-fade-enter-active,
.rules-panel-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.rules-panel-fade-enter-from,
.rules-panel-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* 规则面板 */
.card-rules-panel {
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

.rules-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(90deg, #3a3a5a 0%, #4a4a6a 100%);
  border-radius: 6px 6px 0 0;
}

.rules-panel-title {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
}

.rules-panel-close {
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

.rules-panel-close:hover {
  background: #ff4444;
}

.rules-panel-content {
  padding: 12px 14px;
  max-height: 400px;
  overflow-y: auto;
}

.rules-panel-content::-webkit-scrollbar {
  width: 6px;
}

.rules-panel-content::-webkit-scrollbar-track {
  background: #1a1a2e;
  border-radius: 3px;
}

.rules-panel-content::-webkit-scrollbar-thumb {
  background: #4a4a6a;
  border-radius: 3px;
}

.rules-panel-content::-webkit-scrollbar-thumb:hover {
  background: #5a5a7a;
}

.rules-section {
  margin-bottom: 12px;
}

.rules-section:last-child {
  margin-bottom: 0;
}

.rules-section-title {
  font-size: 13px;
  font-weight: bold;
  color: #6aa8ff;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid #3a3a5a;
}

.rules-item {
  font-size: 12px;
  color: #ccc;
  margin-bottom: 4px;
  padding-left: 8px;
  position: relative;
}

.rules-item::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #6a6a8a;
}

.rules-item.highlight {
  color: #ffd700;
}
</style>
