<template>
  <div id="bagGrid" class="bag-grid" @scroll.passive="handleBagScroll">
    <!-- 物品格子 -->
    <div
v-for="(item, index) in displayedItems" :key="`item-${item.id}-${index}`" class="bag-slot"
      :class="[{ 'has-item': item !== null }]">
      <EnhanceTierEffect
        v-if="shouldShowEnhanceEffect(item)"
        :enhance-level="getEnhanceLevel(item)"
        :rarity="item?.rarity"
      />
      <!-- 品级三角形标识：直角在左下角，贴合左边缘和底边缘 -->
      <div
        v-if="item && getRarityTriangleColor(item)"
        class="rarity-triangle"
        :style="{ backgroundColor: getRarityTriangleColor(item) }"
      ></div>
      <img
v-if="item" :src="getItemIconForDisplay(item, index)" :alt="getItemName(item)" class="item-icon" loading="lazy"
        draggable="false"
        @click="handleItemClick(item, index, $event)" @mouseenter="showItemTooltip(item, $event)" @mouseleave="hideItemTooltip"
        @dragstart.prevent @error="handleImageError" />
      <!-- 强化等级标记 -->
      <div v-if="item && getEnhanceLevel(item) > 0" class="enhance-level-badge">+{{ getEnhanceLevel(item) }}</div>
      <!-- 堆叠数量 -->
      <div
v-if="
        item &&
        ((item.currentStack !== undefined && item.currentStack > 1) ||
          (item.quantity !== undefined && item.quantity > 1))
      " class="stack-count">
        {{ item.currentStack !== undefined ? item.currentStack : item.quantity }}
      </div>
      <div v-if="item && isRaisedPetSummoned(item)" class="summoned-mark">召唤中</div>
      <!-- 捡宠召唤中标记 -->
      <div v-if="item && isPickuppetSummoned(item)" class="pickuppet-summoned-mark">召唤中</div>
      <!-- 捡宠倒计时（底部铺满），限时捡宠召回后倒计时继续显示直到到期 -->
      <div
        v-if="item && isItemActiveTimedPickuppet(item)"
        class="pickuppet-countdown-badge"
        :class="getPickuppetCountdownForItem(item).colorClass"
        :style="{ fontSize: getPickuppetCountdownForItem(item).fontSize }"
      >{{ getPickuppetCountdownForItem(item).text }}</div>
    </div>

    <!-- 空格子（已解锁但无物品） -->
    <div v-for="index in emptySlots" :key="`empty-${index}`" class="bag-slot empty">
      <img src="/pt/Default_res/back_Slotitem.jpg" alt="空格子" class="empty-icon" loading="lazy" draggable="false" @dragstart.prevent />
    </div>

    <!-- 未解锁的格子（分批渲染，避免一次性创建大量DOM节点阻塞主线程） -->
    <div v-for="index in renderedLockedSlots" :key="`locked-${index}`" class="bag-slot locked">
      <img src="/pt/UI/lock.png" alt="锁定格子" class="locked-icon" loading="lazy" draggable="false" @dragstart.prevent />
    </div>
  </div>

  <Transition name="item-action-panel" @after-leave="handleActionPanelAfterLeave">
    <!-- 物品操作面板 -->
    <div
      v-if="showItemActionPanel && selectedItem"
      ref="actionPanel"
      class="item-action-panel"
      :style="{
        top: panelPosition.y + 'px',
        left: panelPosition.x + 'px'
      }"
    >
      <!-- 面板头部（可拖拽区域） -->
      <div class="panel-header" @mousedown="startDrag">
        <span class="panel-title">物品操作</span>
        <button class="close-button" @click="closePanel">×</button>
      </div>

      <!-- 面板内容 -->
      <div class="panel-content">
        <!-- 物品信息 -->
        <div class="item-info">
          <img
:src="getItemIcon(selectedItem)" :alt="getItemName(selectedItem)" class="panel-item-icon" draggable="false"
            @dragstart.prevent />
          <div class="item-details">
            <div class="item-name">{{ getDisplayName(selectedItem) }}</div>
            <div class="item-quantity-display">
              背包数量:
              {{ selectedItemCurrentStack }}
            </div>
          </div>
        </div>

        <!-- 数量选择和价格显示 -->
        <div v-if="showSellButton" class="sell-controls">
          <!-- 数量选择 -->
          <div class="sell-quantity-control">
            <label>出售数量:</label>
            <div class="sell-quantity-input-group">
              <button class="sell-quantity-btn" @click="decreaseSellQuantity">-</button>
              <input
                v-model.number="sellQuantity"
                type="number"
                min="1"
                :max="maxSellQuantity"
                class="sell-quantity-input"
                @input="validateSellQuantity"
              />
              <button class="sell-quantity-btn" @click="increaseSellQuantity">+</button>
            </div>
          </div>

          <!-- 价格信息 -->
          <div class="sell-price-info">
            <div class="sell-price-row">
              <span>单价:</span>
              <span class="sell-price-value">{{ formattedComputedSellPrice }} Penya</span>
            </div>
            <div class="sell-price-row total">
              <span>总价:</span>
              <span class="sell-price-value total">{{ formattedComputedTotalSellAmount }} Penya</span>
            </div>
          </div>
        </div>

        <div v-if="showUseQuantityControl" class="use-controls">
          <div class="sell-quantity-control">
            <label>使用数量:</label>
            <div class="sell-quantity-input-group">
              <button class="sell-quantity-btn" @click="decreaseUseQuantity">-</button>
              <input
                v-model.number="useQuantity"
                type="number"
                min="1"
                :max="maxUseQuantity"
                class="sell-quantity-input"
                @input="validateUseQuantity"
              />
              <button class="sell-quantity-btn" @click="increaseUseQuantity">+</button>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <!-- 使用按钮（绿色） -->
          <button v-if="showUseButton" class="action-button use-button" @click="useItem">使用</button>

          <!-- 装备按钮（蓝色） -->
          <button v-if="showEquipButton" class="action-button equip-button" @click="equipItem">
            装备
          </button>

          <button
            v-if="showSummonButton"
            class="action-button summon-button"
            type="button"
            @click="summonRaisedPet"
          >
            召唤
          </button>

          <button
            v-if="showRecallButton"
            class="action-button recall-button"
            type="button"
            @click="recallRaisedPet"
          >
            召回
          </button>

          <!-- 捡宠召唤按钮 -->
          <button
            v-if="showPickuppetSummonButton"
            class="action-button pickuppet-summon-button"
            type="button"
            @click="handlePickuppetSummonClick"
          >
            召唤
          </button>

          <!-- 捡宠召回按钮 -->
          <button
            v-if="showPickuppetRecallButton"
            class="action-button pickuppet-recall-button"
            type="button"
            @click="recallPickuppet"
          >
            召回
          </button>

          <!-- 出售按钮（红色） -->
          <button v-if="showSellButton" class="action-button sell-button" @click="confirmSell">
            出售
          </button>
        </div>
      </div>
    </div>
  </Transition>

<div v-if="showSellConfirmDialog && selectedItem" class="sell-confirm-dialog" @click.stop>
<div class="sell-confirm-content">
<div class="sell-confirm-title">确认出售</div>
<div class="sell-confirm-body">
<div v-if="selectedItemHasBlessing" style="color: #ff6b6b; font-weight: bold;">⚠ 该物品已祝福唤醒，出售后将丢失唤醒属性！</div>
<div v-else>物品贵重,确认出售吗?</div>
<div>即将出售 {{ getDisplayName(selectedItem) }} x{{ sellQuantity }}</div>
<div>总价: {{ formattedComputedTotalSellAmount }} Penya</div>
</div>
<div class="sell-confirm-actions">
<button class="sell-confirm-button confirm" @click="performSell">确认</button>
<button class="sell-confirm-button cancel" @click="cancelSellConfirm">取消</button>
</div>
</div>
</div>

  <!-- 捡宠限时召唤二次确认弹窗 -->
  <div v-if="showPickuppetConfirmDialog && selectedItem" class="sell-confirm-dialog" @click.stop>
    <div class="sell-confirm-content">
      <div class="sell-confirm-title pickuppet-confirm-title">⚠️ 限时宠物确认</div>
      <div class="sell-confirm-body pickuppet-confirm-body">
        <div class="pickuppet-confirm-warning">该宠物为限时类型，一旦召唤后倒计时将立即开始！</div>
        <div class="pickuppet-confirm-detail">无论是否在线、是否处于召唤状态，倒计时都不会停止。</div>
        <div class="pickuppet-confirm-detail">倒计时结束后，宠物将从背包中移除。</div>
        <div class="pickuppet-confirm-item">
          <img :src="getSafeItemIcon(selectedItem)" :alt="getItemName(selectedItem)" class="pickuppet-confirm-icon" />
          <span>{{ getDisplayName(selectedItem) }}</span>
        </div>
      </div>
      <div class="sell-confirm-actions">
        <button class="sell-confirm-button confirm pickuppet-confirm-btn" @click="confirmPickuppetSummon">确认召唤</button>
        <button class="sell-confirm-button cancel" @click="cancelPickuppetSummon">取消</button>
      </div>
    </div>
  </div>

  <div v-if="showGiftBoxPanel && selectedItem" class="giftbox-panel" @click.stop>
    <div class="giftbox-header">
      <span class="giftbox-title">{{ getDisplayName(selectedItem) }}</span>
    </div>

    <div class="giftbox-content">
      <div class="giftbox-reward-list">
        <div v-if="giftBoxContents.length === 0" class="giftbox-empty">暂无可抽取物品</div>
        <div v-for="content in giftBoxContents" :key="`giftbox-${content.item}`" class="giftbox-reward-item">
          <img
            :src="getItemIcon(content.item)"
            :alt="getGiftBoxItemName(content.item)"
            @mouseenter="showItemTooltip(getGiftBoxItem(content.item), $event)"
            @mouseleave="hideItemTooltip"
            @mousemove="moveItemTooltip"
          />
          <div class="giftbox-reward-info">
            <div class="giftbox-reward-name">{{ getGiftBoxItemName(content.item) }}</div>
            <div class="giftbox-reward-chance">概率: {{ formatGiftBoxChance(content.chance) }}</div>
          </div>
        </div>
      </div>

      <div class="giftbox-quantity-row">
        <span>使用</span>
        <input
v-model.number="giftBoxQuantity" type="number" min="1" :max="maxGiftBoxQuantity"
          class="giftbox-quantity-input" @input="validateGiftBoxQuantity" />
        <span>个盒子</span>
      </div>

      <div class="giftbox-actions">
        <button class="giftbox-button confirm" @click="confirmGiftBoxUse">确认使用</button>
        <button class="giftbox-button cancel" @click="closeGiftBoxPanel">取消</button>
      </div>
    </div>
  </div>

  <!-- 魔法牢笼抽奖面板 -->
  <MagicCagePanel
    :visible="showMagicCagePanel"
    :game-initializer="gameInitializer"
    @close="showMagicCagePanel = false"
    @data-updated="onMagicCageDataUpdated"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, onUnmounted, nextTick, markRaw } from 'vue'

import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store'
import BagService from '@/services/BagService'
import { getItemName, getItemIcon } from '@/utils/itemUtils'
import { formatGold4 } from '@/utils/goldDisplay'
import { useItemManager } from '@/composables/useItemManager'
import EnhanceTierEffect from '@/components/EnhanceTierEffect.vue'
import { useRaisedPetSummonStore } from '@/store/raisedPetSummon'
import { usePickuppetSummonStore } from '@/store/pickuppetSummon'
import { canDualWield } from '@/composables/useDualWield'
import { getEnhanceSellPriceBonus } from '@/utils/dropEnhanceGenerator'
import { storageService } from '@/services/StorageService'
import MagicCagePanel from '@/components/modals/MagicCagePanel.vue'

// 定义 props
const props = defineProps({
  player: {
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
  showBagEquipmentEffect: {
    type: Boolean,
    default: true
  },
  openRenamePanel: {
    type: Function,
    default: null
  }
})

// 定义 emits
const emit = defineEmits(['player-data-updated'])

// 使用 Pinia Store
const itemsStore = useItemsStore()
const gameStore = useGameStore()
const raisedPetSummonStore = useRaisedPetSummonStore()
const pickuppetSummonStore = usePickuppetSummonStore()

// 使用物品管理器
const { useItem: useItemFromManager } = useItemManager(
  props.player,
  props.gameData,
  props.gameInitializer,
  props.removeItemFromBag,
  props.showDamageNumber,
  props.addBattleLog,
  props.showAnimationMessage,
  props.openRenamePanel
)

// 响应式数据
// bagItems 使用 computed 自动响应 itemsStore.playerBag 的变化
// 这样就不需要手动调用 loadBagItems() 来刷新背包
const bagItems = computed(() => {
  const bag = itemsStore.playerBag

  if (!bag || bag.length === 0) {
    return []
  }

  // 处理物品字段兼容性：确保有stack字段，并从itemsStore获取完整物品信息
  return bag.map(item => {
    if (!item) {
      return null
    }

    let enhancedItem = { ...item }

    // 如果物品有quantity字段但没有stack字段，复制quantity到stack
    if (item.quantity !== undefined && item.stack === undefined) {
      enhancedItem.stack = item.quantity
    }

    // 从itemsStore获取完整的物品信息
    if (item.id) {
      const itemConfig = itemsStore.getItemConfig(item.id)
      if (itemConfig) {
        // 合并完整物品信息，但保留背包中的特定字段（如stack/quantity/currentStack）
        enhancedItem = {
          ...itemConfig,
          ...enhancedItem, // 背包数据优先（覆盖同名字段）
          id: item.id, // 确保ID不变
          stack: enhancedItem.stack || itemConfig.stack || 1,
          quantity: enhancedItem.quantity || itemConfig.quantity || 1,
          currentStack: enhancedItem.currentStack
        }
      }
    }

    return enhancedItem
  }).filter(Boolean) // 过滤掉 null 值
})

// 物品操作面板相关数据
const showItemActionPanel = ref(false)
const selectedItem = ref(null)
const selectedItemIndex = ref(null)
const panelPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const actionPanel = ref(null)
const actionPanelClickLockUntil = ref(0)

// 出售相关数据
const sellQuantity = ref(1)
const useQuantity = ref(1)
const showSellConfirmDialog = ref(false)
const showGiftBoxPanel = ref(false)
const giftBoxQuantity = ref(1)
const showMagicCagePanel = ref(false)

// 计算属性
const selectedItemCurrentStack = computed(() => {
  if (!selectedItem.value) {
    return 1
  }
  const value = Number(selectedItem.value.currentStack)
  return Number.isFinite(value) && value > 0 ? value : 1
})

const emptySlots = computed(() => {
  // 直接从 itemsStore 获取背包数据，确保数据是最新的
  const bag = itemsStore.playerBag
  const availableSlots = itemsStore.bagCapacity || 30

  if (bag) {
    // 优化：直接计算非null物品数量，避免filter操作
    let used = 0
    for (let i = 0; i < bag.length; i++) {
      if (bag[i] !== null) {
        used++
      }
    }
    const empty = Math.max(0, availableSlots - used)
    return empty
  }

  return availableSlots
})

const lockedSlots = computed(() => {
  // 直接从 itemsStore 获取背包容量数据
  const availableSlots = itemsStore.bagCapacity || 20
  const totalSlots = 400 // 背包总格子数
  const locked = Math.max(0, totalSlots - availableSlots)
  return locked
})

/** 每批渲染的锁定格子数量，避免一次性创建大量DOM节点阻塞主线程 */
const LOCKED_BATCH_SIZE = 80
/** 当前已渲染的锁定格子数量（分批递增） */
const renderedLockedCount = ref(LOCKED_BATCH_SIZE)

/** 实际渲染的锁定格子数量（不超过总锁定数） */
const renderedLockedSlots = computed(() => {
  return Math.min(renderedLockedCount.value, lockedSlots.value)
})

/**
 * 背包网格滚动事件处理
 * 当滚动接近底部时增加锁定格子的渲染数量，分批加载避免主线程长时间阻塞
 * @param {Event} event - 滚动事件
 */
const handleBagScroll = (event) => {
  const container = event.target
  const { scrollTop, scrollHeight, clientHeight } = container
  // 距离底部200px时加载下一批锁定格子
  if (scrollHeight - scrollTop - clientHeight < 200 && renderedLockedCount.value < lockedSlots.value) {
    renderedLockedCount.value = Math.min(
      renderedLockedCount.value + LOCKED_BATCH_SIZE,
      lockedSlots.value
    )
  }
}

const displayedItems = computed(() => {
  return bagItems.value
})

// ── 物品图片分批加载（避免一次性加载过多图片阻塞主线程） ──

/** 透明占位图（1×1 透明 GIF），未加载批次内的物品使用此占位 */
const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/** 每批加载的图片数量 */
const IMAGE_BATCH_SIZE = 10

/** 当前已可见的图片数量（分批递增） */
const visibleImageCount = ref(IMAGE_BATCH_SIZE)

/** requestAnimationFrame ID，用于清理 */
let imageLoadRafId = null

/**
 * 渐进式加载更多物品图片
 * 使用 requestAnimationFrame 分批增加可见图片数量，每帧增加 IMAGE_BATCH_SIZE 个
 * 避免一次性创建大量 img 请求导致主线程阻塞
 */
const loadMoreImages = () => {
  if (imageLoadRafId) {
    cancelAnimationFrame(imageLoadRafId)
  }

  const totalItems = bagItems.value.length
  if (visibleImageCount.value >= totalItems) {
    return
  }

  imageLoadRafId = requestAnimationFrame(() => {
    visibleImageCount.value = Math.min(
      visibleImageCount.value + IMAGE_BATCH_SIZE,
      totalItems
    )

    if (visibleImageCount.value < totalItems) {
      loadMoreImages()
    }
  })
}

// 监听背包物品变化：物品增加时继续加载新图片，物品减少时调整可见数量
watch(bagItems, (newItems) => {
  const newCount = newItems.length
  if (newCount > visibleImageCount.value) {
    // 有新物品加入，继续渐进式加载
    loadMoreImages()
  } else if (newCount < visibleImageCount.value) {
    // 物品减少，确保可见数量不超过当前总数
    visibleImageCount.value = Math.max(IMAGE_BATCH_SIZE, newCount)
  }
})

const showEnhanceEffect = computed(() => props.showBagEquipmentEffect !== false)

const enhanceEffectCategories = new Set(['weapon', 'armor', 'jewelry'])

function getEnhanceLevel (item) {
  const level = Number(item?.StrengthenedAttributes?.enhanceLevel ?? item?.enhanceLevel ?? 0)
  return Number.isFinite(level) ? level : 0
}

function shouldShowEnhanceEffect (item) {
  if (!showEnhanceEffect.value || !item) {
    return false
  }
  if (!enhanceEffectCategories.has(item.category)) {
    return false
  }
  return getEnhanceLevel(item) > 5
}

/**
 * 获取物品品级对应的三角形颜色
 * 使用 Pinia itemsStore 中的 rarityTextColor 配置
 * common 品级不显示三角形（返回空字符串）
 * @param {Object} item - 物品对象
 * @returns {string} CSS 颜色值，common 品级返回空字符串
 */
function getRarityTriangleColor (item) {
  if (!item) {
    return ''
  }
  const rarity = item.rarity || 'common'
  const key = String(rarity).trim().toLowerCase()
  // common 品级不显示三角形
  if (key === 'common' || !key) {
    return ''
  }
  return itemsStore.getRarityTextColor(rarity)
}

// 物品操作面板相关计算属性
const showUseButton = computed(() => {
  if (!selectedItem.value) {
    return false
  }

  const item = selectedItem.value
  if (item.category === 'raisedpet') {
    return false
  }
  // 捡宠不显示使用按钮（有独立的召唤/召回按钮）
  if (item.category === 'pickuppet') {
    return false
  }
  const itemId = Number(item.id)

  // 特殊物品ID：终极珠宝盒子(17866)、自动恢复卷轴(1276)、自动出售卷轴(1277)、属性更改卷轴(1529)、属性点重置卷(1099)、属性攻击魔法石箱(347)、终极之力卷轴(12252)、终极加成卷轴(12944)、武器唤醒卷轴(5189)、祝福唤醒卷轴(7064/27754)
  if (itemId === 17866 || itemId === 1276 || itemId === 1277 || itemId === 1529 || itemId === 1099 || itemId === 347 || itemId === 12252 || itemId === 12944 || itemId === 5189 || itemId === 7064 || itemId === 27754) {
    return true
  }

  // 属性攻击石头ID：蹈火之石(8241)、碧波之石(2541)、风驰之石(547)、电掣之石(5088)、泥沙之石(4053)
  if (itemId === 8241 || itemId === 2541 || itemId === 547 || itemId === 5088 || itemId === 4053) {
    return true
  }

  return (
    item.subcategory === 'food' ||
    item.subcategory === 'refresher' ||
    item.category === 'scroll' ||
    item.category === 'buff' ||
    item.category === 'pack' ||
    item.subcategory === 'ampexp'
  )
})

const showEquipButton = computed(() => {
  if (!selectedItem.value) {
    return false
  }

  const item = selectedItem.value
  // 判断是否为可装备物品类型
  if (item.category === 'raisedpet') {
    return false
  }
  // 捡宠不可装备
  if (item.category === 'pickuppet') {
    return false
  }
  // 时装类可装备的子类型：面具、披风、帽子、衣服、手套、鞋子、视觉披风
  if (item.category === 'fashion') {
    return ['mask', 'cloak', 'visualcloak', 'hat', 'cloth', 'glove', 'shoes'].includes(item.subcategory)
  }
  return item.category === 'weapon' || item.category === 'armor' || item.category === 'jewelry'
})

const showSellButton = computed(() => {
  if (!selectedItem.value) {
    return false
  }

  if (selectedItem.value.category === 'raisedpet' && isRaisedPetSummoned(selectedItem.value)) {
    return false
  }
  // 已召唤的捡宠不可出售
  if (selectedItem.value.category === 'pickuppet' && isPickuppetSummoned(selectedItem.value)) {
    return false
  }
  // 所有物品都可以出售
  return true
})

const showSummonButton = computed(() => {
  if (!selectedItem.value) {
    return false
  }
  if (selectedItem.value.category !== 'raisedpet') {
    return false
  }
  if (Number(selectedItem.value.id) === 8600) {
    return false
  }
  return !isRaisedPetSummoned(selectedItem.value)
})

const showRecallButton = computed(() => {
  if (!selectedItem.value) {
    return false
  }
  if (selectedItem.value.category !== 'raisedpet') {
    return false
  }
  return isRaisedPetSummoned(selectedItem.value)
})

/** 捡宠召唤按钮：仅在选中pickuppet且未召唤时显示 */
const showPickuppetSummonButton = computed(() => {
  if (!selectedItem.value) return false
  if (selectedItem.value.category !== 'pickuppet') return false
  return !isPickuppetSummoned(selectedItem.value)
})

/** 捡宠召回按钮：仅在选中pickuppet且已召唤时显示 */
const showPickuppetRecallButton = computed(() => {
  if (!selectedItem.value) return false
  if (selectedItem.value.category !== 'pickuppet') return false
  return isPickuppetSummoned(selectedItem.value)
})

// 出售相关计算属性
const maxSellQuantity = computed(() => {
  if (!selectedItem.value) {
    return 1
  }
  // 优先使用currentStack字段，如果没有则使用quantity字段，再没有则使用stack字段
  return (
    selectedItem.value.currentStack ||
    selectedItem.value.quantity ||
    selectedItem.value.stack ||
    1
  )
})

const maxUseQuantity = computed(() => {
  return maxSellQuantity.value
})

const showUseQuantityControl = computed(() => {
  if (!selectedItem.value) {
    return false
  }
  const itemId = Number(selectedItem.value.id)
  return (itemId === 1276 || itemId === 1277) && maxUseQuantity.value > 1
})

const maxGiftBoxQuantity = computed(() => {
  if (!selectedItem.value) {
    return 1
  }
  return Number(
    selectedItem.value.currentStack ||
    selectedItem.value.quantity ||
    selectedItem.value.stack ||
    1
  )
})

const giftBoxContents = computed(() => {
  if (!selectedItem.value) {
    return []
  }
  const itemConfig = itemsStore.getItemConfig(Number(selectedItem.value.id))
  if (!itemConfig || !Array.isArray(itemConfig.contents)) {
    return []
  }
  return itemConfig.contents
})

// 计算出售价格
const computedSellPrice = computed(() => {
if (!selectedItem.value) {
return 0
}

const item = selectedItem.value
// 优先使用sellPrice，如果没有则使用buyPrice/4
let basePrice = 0
if (item.sellPrice !== undefined) {
basePrice = item.sellPrice
} else if (item.buyPrice !== undefined) {
basePrice = Math.floor(item.buyPrice / 4)
} else {
basePrice = 10 // 默认价格
}

// 强化等级出售价格加成
const enhanceLevel = getEnhanceLevel(item)
const enhanceBonus = getEnhanceSellPriceBonus(enhanceLevel)
return basePrice + enhanceBonus
})

// 计算总价
const computedTotalSellAmount = computed(() => {
  return computedSellPrice.value * sellQuantity.value
})

const formattedComputedSellPrice = computed(() => {
  return formatGold4(computedSellPrice.value)
})

const formattedComputedTotalSellAmount = computed(() => {
  return formatGold4(computedTotalSellAmount.value)
})

const sellConfirmRarities = new Set(['veryrare', 'epic', 'unique', 'ultimate', 'mythic'])

const getPerforationCount = attrs => {
  if (!attrs || typeof attrs !== 'object') {
    return 0
  }
  if (typeof attrs.perforationCount === 'number') {
    return attrs.perforationCount
  }
  if (typeof attrs.publicHoleCount === 'number') {
    return attrs.publicHoleCount
  }
  if (attrs.perforationLevels && typeof attrs.perforationLevels === 'object') {
    return Object.keys(attrs.perforationLevels).length
  }
  return 0
}

const shouldConfirmSell = item => {
if (!item) {
return false
}
const rarity = String(item.rarity || '').toLowerCase()
const enhanceLevel = getEnhanceLevel(item)
const perforationCount = getPerforationCount(item?.PerforationAttributes)
// 检测是否带有祝福唤醒数据，有则需要二次确认
const hasBlessing = !!(item.blessedData && item.blessedData.attributes && item.blessedData.attributes.length > 0)
return sellConfirmRarities.has(rarity) || enhanceLevel > 0 || perforationCount > 0 || hasBlessing
}

/**
 * 计算属性：当前选中物品是否带有祝福唤醒数据
 * @returns {boolean} 是否带有祝福唤醒属性
 */
const selectedItemHasBlessing = computed(() => {
  const item = selectedItem.value
  return !!(item && item.blessedData && item.blessedData.attributes && item.blessedData.attributes.length > 0)
})

// 方法
// loadBagItems 已不再需要，bagItems 现在是 computed 属性会自动响应 store 变化
// 保留空函数以兼容外部调用
const loadBagItems = () => {
  // bagItems 是 computed 属性，会自动更新，无需手动刷新
}

// ItemTooltip 相关方法
function showItemTooltip (item, event) {
  
  if (!item) {
    
    return
  }

  // 使用自定义事件触发 ItemTooltip 显示
  const showEvent = new CustomEvent('show-item-tooltip', {
    detail: {
      item,
      position: {
        x: event.clientX + 10,
        y: event.clientY + 10
      },
      source: 'bag-slot'
    }
  })

  window.dispatchEvent(showEvent)
}

function hideItemTooltip () {
  
  // 使用自定义事件触发 ItemTooltip 隐藏
  const hideEvent = new CustomEvent('hide-item-tooltip')
  window.dispatchEvent(hideEvent)
 
}

function moveItemTooltip (event) {
  const moveEvent = new CustomEvent('move-item-tooltip', {
    detail: {
      position: {
        x: event.clientX + 10,
        y: event.clientY + 10
      }
    }
  })
  window.dispatchEvent(moveEvent)
}

function handleImageError (event) {
 
  // 防止无限循环
  if (event.target.src.includes('default_item.png')) {
    return
  }

  // 使用默认图标
  event.target.src = '/pt/item_icon/default_item.png'

  // 添加错误标记
  event.target.classList.add('image-error')
}

// 安全获取物品图标，避免无效ID
function getSafeItemIcon (item) {
  if (!item) {
    return '/pt/item_icon/default_item.png'
  }

  // 如果物品没有有效的ID，返回默认图标
  if (!item.id || item.id === 'undefined' || item.id === undefined) {

    return '/pt/item_icon/default_item.png'
  }

  // 使用原有的getItemIcon函数
  return getItemIcon(item)
}

/**
 * 根据物品在背包中的索引决定是否加载真实图标
 * 仅前 visibleImageCount 个物品加载真实图片，其余使用透明占位图
 * 配合 loadMoreImages() 实现分批渐进加载，避免一次性发起大量图片请求阻塞主线程
 * @param {Object} item - 背包物品对象
 * @param {number} index - 物品在 displayedItems 中的索引
 * @returns {string} 图片URL（真实图标或透明占位图）
 */
function getItemIconForDisplay (item, index) {
  if (index >= visibleImageCount.value) {
    return TRANSPARENT_PIXEL
  }
  return getSafeItemIcon(item)
}

// 物品操作面板相关方法
function handleItemClick (item, index, event) {
  const now = Date.now()
  if (now < actionPanelClickLockUntil.value) {
    event?.stopPropagation()
    return
  }
  actionPanelClickLockUntil.value = now + 300

 
  // 设置选中的物品
  selectedItem.value = item

  // 初始化出售数据
  sellQuantity.value = maxSellQuantity.value
  useQuantity.value = 1

  // 获取背包面板的位置
  const bagPanel = document.querySelector('.bag-panel')
  let panelX = 0
  let panelY = 0

  if (bagPanel) {
    const rect = bagPanel.getBoundingClientRect()
    // 物品操作面板右侧贴合背包面板左侧
    panelX = rect.left - 300 // 背包面板left - 物品操作面板宽度(300px)
    panelY = rect.top
   
  } else {
   
    panelX = event.clientX - 100
    panelY = event.clientY - 300
  }

  // 计算面板位置：物品操作面板右侧贴合背包面板左侧
  panelPosition.value = {
    x: panelX,
    y: panelY
  }

  // 显示面板
  showItemActionPanel.value = true

  // 阻止事件冒泡，避免触发其他点击事件
  event.stopPropagation()
}

function closePanel () {
  showItemActionPanel.value = false
  actionPanelClickLockUntil.value = 0
  // 重置出售数量
  sellQuantity.value = 1
  useQuantity.value = 1
  showSellConfirmDialog.value = false
  showGiftBoxPanel.value = false
  giftBoxQuantity.value = 1
  showMagicCagePanel.value = false
  selectedItemIndex.value = null
  // 关闭物品操作面板时，同步关闭物品详情面板，避免残留
  hideItemTooltip()
}

/**
 * 判断当前 Bag 操作的目标角色是否为队长（主玩家）
 * 用途/业务意图：训养宠物 BUFF 的全局同步（syncRaisedPetAbilityBuff）仅应作用于队长，
 * 队员的训养宠物 BUFF 需直接写入其自身 activeBuffs，防止 BUFF 串显到队长身上。
 * @returns {boolean} 是否为队长
 */
const isMainPlayer = () => {
  const target = props.player
  if (!target) return true
  // 通过引用或 _isPlayer 标记判断
  return target === gameStore.player || target._isPlayer === true
}

/**
 * 判断捡宠物品是否在队员自身 activeBuffs 中处于召唤状态
 * @param {object} item - 捡宠物品实例
 * @returns {boolean}
 */
const isPickuppetSummonedByMember = (item) => {
  if (!item || item.category !== 'pickuppet') return false
  const target = props.player
  if (!target || !Array.isArray(target.activeBuffs)) return false
  const key = item.uniqueId ? String(item.uniqueId) : (item.id ? `id:${String(item.id)}` : null)
  if (!key) return false
  return target.activeBuffs.some(b =>
    String(b?.id ?? '') === `pickuppet_auto_loot_${key}` && !b.recalled
  )
}

/**
 * 判断培育宠物物品是否在队员自身 activeBuffs 中处于召唤状态
 * @param {object} item - 培育宠物物品实例
 * @returns {boolean}
 */
const isRaisedPetSummonedByMember = (item) => {
  if (!item || item.category !== 'raisedpet') return false
  const target = props.player
  if (!target || !Array.isArray(target.activeBuffs)) return false
  return target.activeBuffs.some(b =>
    String(b?.id ?? '') === 'raisedpet_ability' && b?.source === 'raisedpet'
  )
}

/**
 * 队员感知的捡宠召唤状态检查
 * - 队长：使用全局 pickuppetSummonStore
 * - 队员：检查队员自身 activeBuffs
 * @param {object} item - 物品实例
 * @returns {boolean}
 */
const isPickuppetSummoned = (item) => {
  if (isMainPlayer()) return pickuppetSummonStore.isSummoned(item)
  return isPickuppetSummonedByMember(item)
}

/**
 * 队员感知的培育宠物召唤状态检查
 * - 队长：使用全局 raisedPetSummonStore
 * - 队员：检查队员自身 activeBuffs
 * @param {object} item - 物品实例
 * @returns {boolean}
 */
const isRaisedPetSummoned = (item) => {
  if (isMainPlayer()) return raisedPetSummonStore.isSummoned(item)
  return isRaisedPetSummonedByMember(item)
}

/**
 * 为队员创建捡宠 BUFF 对象（不通过全局 Store）
 * @param {object} item - 捡宠物品实例
 * @returns {object|null} BUFF 对象
 */
const createMemberPickuppetBuff = (item) => {
  if (!item || item.category !== 'pickuppet') return null
  const key = item.uniqueId ? String(item.uniqueId) : (item.id ? `id:${String(item.id)}` : null)
  if (!key) return null

  const petName = getPickuppetItemName(item)
  const petIcon = getPickuppetItemIcon(item)
  const duration = item?.duration
  const isTimed = duration !== undefined && duration !== null && Number(duration) > 0
  const expiresAt = isTimed ? Date.now() + Number(duration) * 1000 : 0

  return {
    id: `pickuppet_auto_loot_${key}`,
    name: `捡宠：${petName}`,
    description: '自动拾取击杀怪物掉落的物品和金币',
    icon: petIcon,
    duration: isTimed ? Number(duration) : 0,
    endTime: expiresAt || undefined,
    expiresAt: expiresAt || undefined,
    type: 'pickuppet',
    source: 'item',
    addedAt: Date.now(),
    recalled: false,
    meta: {
      petName,
      expiresAt: expiresAt,
      summonedAt: Date.now()
    }
  }
}

/**
 * 为队员召唤培育宠物（使用全局 Store 计算后恢复，不影响队长状态）
 * @param {object} item - 培育宠物物品实例
 * @param {number} playerLevel - 玩家等级
 * @returns {{ success: boolean, message: string, buff?: object }} 召唤结果
 */
const summonRaisedPetForMember = (item, playerLevel) => {
  // 保存全局 Store 状态
  const savedState = {
    summonedPetKey: raisedPetSummonStore.summonedPetKey,
    summonedPetItem: raisedPetSummonStore.summonedPetItem,
    summonedPetEnergy: raisedPetSummonStore.summonedPetEnergy,
    summonedPetMaxEnergy: raisedPetSummonStore.summonedPetMaxEnergy,
    summonedPetTierIndex: raisedPetSummonStore.summonedPetTierIndex,
    summonedPetCandyItemId: raisedPetSummonStore.summonedPetCandyItemId,
    summonedPetBuffParameter: raisedPetSummonStore.summonedPetBuffParameter,
    summonedPetBuffRate: raisedPetSummonStore.summonedPetBuffRate,
    summonedPetBuffValue: raisedPetSummonStore.summonedPetBuffValue,
    panelVisible: raisedPetSummonStore.panelVisible
  }

  // 调用全局 Store 进行计算
  const result = raisedPetSummonStore.summon(item, playerLevel)
  if (!result?.success) {
    // 恢复全局 Store 状态
    raisedPetSummonStore.$patch(savedState)
    return result
  }

  // 读取计算结果
  const petName = (() => {
    const inline = item.name
    if (typeof inline === 'string') return inline
    if (inline && typeof inline === 'object') return inline.cns || inline.eng || '训养宠物'
    return '训养宠物'
  })()

  const buff = {
    id: 'raisedpet_ability',
    name: `训养宠物：${petName}`,
    description: `能量 ${raisedPetSummonStore.currentEnergy}/${raisedPetSummonStore.maxEnergy}`,
    icon: raisedPetSummonStore.summonedPetIcon,
    duration: raisedPetSummonStore.currentEnergy * 60,
    type: 'buff',
    value: raisedPetSummonStore.summonedPetBuffValue,
    parameter: raisedPetSummonStore.summonedPetBuffParameter,
    rate: raisedPetSummonStore.summonedPetBuffRate,
    addedAt: Date.now(),
    source: 'raisedpet',
    meta: {
      petName,
      energy: raisedPetSummonStore.currentEnergy,
      maxEnergy: raisedPetSummonStore.maxEnergy,
      abilitySum: raisedPetSummonStore.summonedPetBuffValue,
      parameter: raisedPetSummonStore.summonedPetBuffParameter,
      rate: raisedPetSummonStore.summonedPetBuffRate
    }
  }

  // 恢复全局 Store 状态
  raisedPetSummonStore.$patch(savedState)

  return { success: true, message: '召唤成功', buff }
}

/**
 * 更新队员的 _summonedPets 属性（用于副本页面头像上方显示）
 * @param {object} target - 队员对象
 */
const updateMemberSummonedPets = (target) => {
  if (!target) return
  const pets = { pickuppet: null, raisedPet: null }
  if (Array.isArray(target.activeBuffs)) {
    for (const buff of target.activeBuffs) {
      if (!buff) continue
      const buffId = String(buff.id ?? '')

      if (buffId.startsWith('pickuppet_auto_loot') && !buff.recalled) {
        const buffEndTime = buff.endTime || buff.expiresAt
        if (buffEndTime && buffEndTime <= Date.now()) continue
        pets.pickuppet = { icon: buff.icon, name: buff.meta?.petName || buff.name || '捡宠' }
      }

      if (buffId === 'raisedpet_ability' || buff.source === 'raisedpet') {
        const buffEndTime = buff.endTime || buff.expiresAt
        if (buffEndTime && buffEndTime <= Date.now()) continue
        pets.raisedPet = { icon: buff.icon, name: buff.meta?.petName || buff.name || '培育宠物' }
      }
    }
  }
  target._summonedPets = markRaw(pets)
}

function summonRaisedPet () {
  if (!selectedItem.value) {
    console.error('[Bag] 召唤失败：没有选中的物品')
    return
  }
  const item = selectedItem.value
  if (item.category !== 'raisedpet') {
    return
  }

  // 传入玩家等级进行检查
  const playerLevel = props.player?.level ?? 1

  if (isMainPlayer()) {
    // 队长：通过全局 Store 召唤并同步 BUFF
    const result = raisedPetSummonStore.summon(item, playerLevel)
    if (!result?.success) {
      if (result.reason === 'level_requirement') {
        const msg = result.message || '等级不符合禁止召唤'
        if (props.showAnimationMessage) {
          props.showAnimationMessage(msg)
        }
      }
      showMessage(result?.message || '召唤失败', 'error')
      return
    }
    try {
      gameStore.syncRaisedPetAbilityBuff()
    } catch (error) {
      console.error('[Bag] 同步召唤宠物BUFF失败:', error)
    }
  } else {
    // 队员：使用 save/restore 模式，不影响全局 Store
    const result = summonRaisedPetForMember(item, playerLevel)
    if (!result?.success) {
      if (result.reason === 'level_requirement') {
        const msg = result.message || '等级不符合禁止召唤'
        if (props.showAnimationMessage) {
          props.showAnimationMessage(msg)
        }
      }
      showMessage(result?.message || '召唤失败', 'error')
      return
    }
    try {
      const target = props.player
      const existingBuffs = Array.isArray(target.activeBuffs) ? target.activeBuffs : []
      const filtered = existingBuffs.filter(b => String(b?.id ?? '') !== 'raisedpet_ability')
      target.activeBuffs = markRaw([...filtered, result.buff])
      // 更新队员的 _summonedPets 显示
      updateMemberSummonedPets(target)
      gameStore.buffVersion++
    } catch (error) {
      console.error('[Bag] 同步召唤宠物BUFF失败:', error)
    }
  }

  if (props.gameInitializer && props.gameInitializer.services?.audio) {
    const audioService = props.gameInitializer.services.audio
    if (typeof audioService.playSFX === 'function') {
      audioService.playSFX('ItemChrRelease.wav')
    }
  }
  showMessage('已召唤宠物', 'info')
  closePanel()
}

function recallRaisedPet () {
  if (!selectedItem.value) {
    return
  }
  const item = selectedItem.value
  if (item.category !== 'raisedpet') {
    return
  }
  if (!isRaisedPetSummoned(item)) {
    return
  }

  if (isMainPlayer()) {
    // 队长：通过全局 Store 召回
    itemsStore.updateRaisedPetEnergyByKey(
      raisedPetSummonStore.summonedPetKey,
      raisedPetSummonStore.summonedPetEnergy,
      raisedPetSummonStore.summonedPetMaxEnergy
    )
    raisedPetSummonStore.recall()
    try {
      gameStore.syncRaisedPetAbilityBuff()
    } catch (error) {
      console.error('[Bag] 同步召回宠物BUFF失败:', error)
    }
  } else {
    // 队员：直接从队员自身 activeBuffs 中移除训养宠物 BUFF，不调用全局 Store
    try {
      const target = props.player
      if (target && Array.isArray(target.activeBuffs)) {
        target.activeBuffs = markRaw(target.activeBuffs.filter(b =>
          String(b?.id ?? '') !== 'raisedpet_ability' && b?.source !== 'raisedpet'
        ))
        // 更新队员的 _summonedPets 显示
        updateMemberSummonedPets(target)
        gameStore.buffVersion++
      }
    } catch (error) {
      console.error('[Bag] 同步召回宠物BUFF失败:', error)
    }
  }

  if (props.gameInitializer && props.gameInitializer.services?.audio) {
    const audioService = props.gameInitializer.services.audio
    if (typeof audioService.playSFX === 'function') {
      audioService.playSFX('ItemChrRelease.wav')
    }
  }
  showMessage('已召回宠物', 'info')
  closePanel()
}

/** 捡宠限时召唤二次确认弹窗是否显示 */
const showPickuppetConfirmDialog = ref(false)

/** localStorage存储键 */
const CONFIRMED_PICKUPPET_STORAGE_KEY = 'confirmed_pickuppet_unique_ids'

/**
* 从localStorage加载已确认的捡宠唯一ID集合
* 每个背包实例（uniqueId）需单独确认，不同实例即使id相同也要各自确认
* @returns {Set<string>} 已确认的唯一ID集合
*/
const loadConfirmedPickuppetIds = () => {
  try {
    const raw = localStorage.getItem(CONFIRMED_PICKUPPET_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter(s => typeof s === 'string' && s.length > 0))
      }
    }
  } catch (error) {
    console.error('[Bag] 加载已确认捡宠ID失败:', error)
  }
  return new Set()
}

/** 已确认过限时召唤的捡宠唯一ID集合（基于uniqueId，每个实例单独确认，持久化到localStorage） */
const confirmedPickuppetUniqueIds = loadConfirmedPickuppetIds()

/**
* 保存已确认的捡宠唯一ID到localStorage
*/
const saveConfirmedPickuppetIds = () => {
  try {
    const arr = Array.from(confirmedPickuppetUniqueIds)
    localStorage.setItem(CONFIRMED_PICKUPPET_STORAGE_KEY, JSON.stringify(arr))
  } catch (error) {
    console.error('[Bag] 保存已确认捡宠ID失败:', error)
  }
}

/**
* 获取捡宠的唯一确认键
* 优先使用uniqueId，无uniqueId时回退到id
* @param {object} item - 捡宠物品实例
* @returns {string} 唯一确认键
*/
const getPickuppetConfirmKey = (item) => {
  if (item.uniqueId) return String(item.uniqueId)
  return String(item.id)
}

/**
* 点击召唤捡宠按钮的处理
* 限时捡宠首次召唤需要二次确认，每个实例（uniqueId）需单独确认
*/
function handlePickuppetSummonClick () {
  if (!selectedItem.value) return
  const item = selectedItem.value
  if (item.category !== 'pickuppet') return

  const duration = item.duration
  const confirmKey = getPickuppetConfirmKey(item)
  // 限时捡宠（duration > 0）且该实例未确认过时才弹二次确认
  if (duration !== undefined && duration !== null && Number(duration) > 0 && !confirmedPickuppetUniqueIds.has(confirmKey)) {
    showPickuppetConfirmDialog.value = true
    return
  }
  // 永久型或已确认过的限时捡宠直接召唤
  summonPickuppet()
}

/**
* 二次确认召唤限时捡宠
*/
function confirmPickuppetSummon () {
  showPickuppetConfirmDialog.value = false
  // 记录该实例已确认，后续不再弹窗
  if (selectedItem.value) {
    const confirmKey = getPickuppetConfirmKey(selectedItem.value)
    confirmedPickuppetUniqueIds.add(confirmKey)
    saveConfirmedPickuppetIds()
  }
  summonPickuppet()
}

/**
 * 取消召唤限时捡宠
 */
function cancelPickuppetSummon () {
  showPickuppetConfirmDialog.value = false
}

/**
 * 召唤捡东西宠物
 * 点击后激活自动拾取功能，限时物品开始倒计时
 */
function summonPickuppet () {
  if (!selectedItem.value) {
    console.error('[Bag] 召唤捡宠失败：没有选中的物品')
    return
  }
  const item = selectedItem.value
  if (item.category !== 'pickuppet') {
    return
  }

  if (isMainPlayer()) {
    // 队长：通过全局 Store 召唤并同步 BUFF
    const result = pickuppetSummonStore.summon(item)
    if (!result?.success) {
      showMessage(result?.message || '召唤捡宠失败', 'error')
      return
    }
    try {
      syncPickuppetBuff()
    } catch (error) {
      console.error('[Bag] 同步捡宠BUFF失败:', error)
    }
    try {
      storageService.savePlayerPatch({ activeBuffs: gameStore.player?.activeBuffs })
    } catch (saveError) {
      console.error('[Bag] 召唤捡宠后保存数据失败:', saveError)
    }
  } else {
    // 队员：直接创建 BUFF 写入队员自身 activeBuffs，不调用全局 Store
    try {
      const target = props.player
      const buff = createMemberPickuppetBuff(item)
      if (!buff) {
        showMessage('召唤捡宠失败', 'error')
        return
      }
      const existingBuffs = Array.isArray(target.activeBuffs) ? target.activeBuffs : []
      // 移除同 ID 的旧捡宠 BUFF
      const filtered = existingBuffs.filter(b => String(b?.id ?? '') !== buff.id)
      target.activeBuffs = markRaw([...filtered, buff])
      // 更新队员的 _summonedPets 显示
      updateMemberSummonedPets(target)
      gameStore.buffVersion++
    } catch (error) {
      console.error('[Bag] 队员召唤捡宠失败:', error)
      showMessage('召唤捡宠失败', 'error')
      return
    }
  }

  if (props.gameInitializer && props.gameInitializer.services?.audio) {
    const audioService = props.gameInitializer.services.audio
    if (typeof audioService.playSFX === 'function') {
      audioService.playSFX('ItemChrRelease.wav')
    }
  }
  showMessage('已召唤捡宠', 'info')
  closePanel()
}

/**
 * 召回捡东西宠物
 * 限时捡宠召回只停止自动拾取，倒计时继续走直到到期
 */
function recallPickuppet () {
  if (!selectedItem.value) {
    return
  }
  const item = selectedItem.value
  if (item.category !== 'pickuppet') {
    return
  }
  if (!isPickuppetSummoned(item)) {
    return
  }

  if (isMainPlayer()) {
    // 队长：通过全局 Store 召回
    pickuppetSummonStore.recall(item)
    try {
      syncAllPickuppetBuffs()
    } catch (error) {
      console.error('[Bag] 更新捡宠BUFF失败:', error)
    }
    try {
      storageService.savePlayerPatch({ activeBuffs: gameStore.player?.activeBuffs })
    } catch (saveError) {
      console.error('[Bag] 召回捡宠后保存数据失败:', saveError)
    }
  } else {
    // 队员：直接从队员自身 activeBuffs 中移除捡宠 BUFF，不调用全局 Store
    try {
      const target = props.player
      const key = item.uniqueId ? String(item.uniqueId) : (item.id ? `id:${String(item.id)}` : null)
      if (target && Array.isArray(target.activeBuffs) && key) {
        target.activeBuffs = markRaw(target.activeBuffs.filter(b =>
          String(b?.id ?? '') !== `pickuppet_auto_loot_${key}`
        ))
        // 更新队员的 _summonedPets 显示
        updateMemberSummonedPets(target)
        gameStore.buffVersion++
      }
    } catch (error) {
      console.error('[Bag] 队员召回捡宠失败:', error)
    }
  }

  if (props.gameInitializer && props.gameInitializer.services?.audio) {
    const audioService = props.gameInitializer.services.audio
    if (typeof audioService.playSFX === 'function') {
      audioService.playSFX('ItemChrRelease.wav')
    }
  }
  showMessage('已召回捡宠', 'info')
  closePanel()
}

/**
 * 获取捡宠物品的名称文本
 * @param {object} item - 物品实例
 * @returns {string} 名称
 */
const getPickuppetItemName = (item) => {
  const name = item?.name
  if (typeof name === 'string' && name) return name
  if (name && typeof name === 'object') return name.cns || name.eng || name.en || '捡宠'
  const id = Number(item?.id)
  if (Number.isFinite(id) && id > 0) return `捡宠#${id}`
  return '捡宠'
}

/**
 * 获取捡宠物品的图标路径
 * @param {object} item - 物品实例
 * @returns {string} 图标路径
 */
const getPickuppetItemIcon = (item) => {
  const id = Number(item?.id)
  if (Number.isFinite(id) && id > 0) return `/pt/item_icon/${id}.png`
  return '/pt/item_icon/default_item.png'
}

/**
 * 同步所有捡宠BUFF到玩家activeBuffs
 * 遍历 timers 中所有活跃的捡宠，每个生成独立的BUFF条目
 * BUFF ID 使用 pickuppet_auto_loot_<key> 格式区分不同捡宠
 */
function syncAllPickuppetBuffs () {
  const currentBuffs = Array.isArray(gameStore.player?.activeBuffs) ? gameStore.player.activeBuffs : []
  // 移除所有捡宠BUFF（以 pickuppet_auto_loot 开头的ID）
  const nextBuffs = currentBuffs.filter(buff => !String(buff?.id ?? '').startsWith('pickuppet_auto_loot'))

  const activeTimers = pickuppetSummonStore.activeTimers
  for (const timer of activeTimers) {
    const petName = getPickuppetItemName(timer.item)
    const petIcon = getPickuppetItemIcon(timer.item)
    const isRecalled = !timer.isSummoned
    const remainingDuration = (timer.expiresAt > 0)
      ? Math.max(0, Math.ceil((timer.expiresAt - Date.now()) / 1000))
      : 0

    nextBuffs.push({
      id: `pickuppet_auto_loot_${timer.key}`,
      name: isRecalled ? `捡宠：${petName}（已召回）` : `捡宠：${petName}`,
      description: isRecalled ? '自动拾取已暂停，限时倒计时继续' : '自动拾取击杀怪物掉落的物品和金币',
      icon: petIcon,
      duration: remainingDuration,
      endTime: timer.expiresAt || undefined,
      expiresAt: timer.expiresAt || undefined,
      type: 'pickuppet',
      source: 'item',
      addedAt: timer.summonedAt || Date.now(),
      recalled: isRecalled,
      meta: {
        petName,
        expiresAt: timer.expiresAt,
        summonedAt: timer.summonedAt
      }
    })
  }

  gameStore.updatePlayer({ activeBuffs: nextBuffs })
}

/**
 * 同步召唤中的捡宠BUFF（兼容旧逻辑，仅同步召唤中的那一个）
 */
function syncPickuppetBuff () {
  syncAllPickuppetBuffs()
}

/**
 * 更新捡宠BUFF为召回状态（限时捡宠召回后倒计时继续显示在J面板）
 * 现在统一由 syncAllPickuppetBuffs 处理
 */
function updatePickuppetBuffToPaused () {
  syncAllPickuppetBuffs()
}

/**
 * 移除所有捡宠BUFF
 */
function removePickuppetBuff () {
  const currentBuffs = Array.isArray(gameStore.player?.activeBuffs) ? gameStore.player.activeBuffs : []
  const nextBuffs = currentBuffs.filter(buff => !String(buff?.id ?? '').startsWith('pickuppet_auto_loot'))
  gameStore.updatePlayer({ activeBuffs: nextBuffs })
}

function handleActionPanelAfterLeave () {
  if (showItemActionPanel.value) {
    return
  }
  selectedItem.value = null
  selectedItemIndex.value = null
  showSellConfirmDialog.value = false
}

// 拖拽功能
function startDrag (event) {
  if (!actionPanel.value) {
    return
  }

  const panelRect = actionPanel.value.getBoundingClientRect()
  dragOffset.value = {
    x: event.clientX - panelRect.left,
    y: event.clientY - panelRect.top
  }

  isDragging.value = true

  // 添加全局鼠标事件监听
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)

  event.preventDefault()
}

function handleDrag (event) {
  if (!isDragging.value || !actionPanel.value) {
    return
  }

  // 计算新的面板位置
  panelPosition.value = {
    x: event.clientX - dragOffset.value.x,
    y: event.clientY - dragOffset.value.y
  }
}

function stopDrag () {
  isDragging.value = false

  // 移除全局鼠标事件监听
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 获取显示名称（优化版本）
const getDisplayName = item => {
  if (!item) {
    return '未知物品'
  }

  // 优先从 itemsStore 获取物品配置（优化：避免重复Object.values和线性查找）
  if (item.id) {
    const itemConfig = itemsStore.getItemConfig(item.id)
    if (itemConfig && itemConfig.name) {
      // 处理多语言名称（如果name是对象）
      if (typeof itemConfig.name === 'object') {
        return (
          itemConfig.name.cns || itemConfig.name.eng || itemConfig.name.en || `物品ID: ${item.id}`
        )
      }
      // 如果name是字符串，直接返回
      if (typeof itemConfig.name === 'string') {
        return itemConfig.name
      }
    }
  }

  // 降级处理：直接检查物品的name字段
  if (item.name) {
    // 如果name是对象，尝试获取cns或eng
    if (typeof item.name === 'object') {
      return item.name.cns || item.name.eng || item.name.en || `物品ID: ${item.id}`
    }
    // 如果name是字符串，直接返回
    if (typeof item.name === 'string') {
      return item.name
    }
  }

  // 降级处理：检查originalName字段
  if (item.originalName) {
    if (typeof item.originalName === 'object') {
      return (
        item.originalName.cns ||
        item.originalName.eng ||
        item.originalName.en ||
        `物品ID: ${item.id}`
      )
    }
    if (typeof item.originalName === 'string') {
      return item.originalName
    }
  }

  // 降级处理：使用getItemName函数
  const nameFromFunction = getItemName(item)
  if (nameFromFunction && !nameFromFunction.startsWith('物品ID:')) {
    return nameFromFunction
  }

  // 最后使用物品ID作为后备
  return `物品ID: ${item.id}`
}

const getGiftBoxItemName = itemId => {
  const itemConfig = itemsStore.getItemConfig(Number(itemId))
  if (!itemConfig || !itemConfig.name) {
    return `物品ID: ${itemId}`
  }
  if (typeof itemConfig.name === 'object') {
    return itemConfig.name.cns || itemConfig.name.eng || itemConfig.name.en || `物品ID: ${itemId}`
  }
  if (typeof itemConfig.name === 'string') {
    return itemConfig.name
  }
  return `物品ID: ${itemId}`
}

const getGiftBoxItem = itemId => {
  const numericId = Number(itemId)
  const itemConfig = itemsStore.getItemConfig(numericId)
  if (itemConfig) {
    return itemConfig
  }
  return { id: numericId, name: getGiftBoxItemName(itemId) }
}

const formatGiftBoxChance = chance => {
  const value = Number(chance)
  if (!Number.isFinite(value)) {
    return '未知'
  }
  return `${value}%`
}

function openGiftBoxPanel () {
  showGiftBoxPanel.value = true
  giftBoxQuantity.value = 1
}

function closeGiftBoxPanel () {
  showGiftBoxPanel.value = false
  giftBoxQuantity.value = 1
}

/**
 * 魔法牢笼面板数据更新回调
 * 业务意图：开启魔法牢笼后刷新背包UI并同步玩家数据
 */
function onMagicCageDataUpdated () {
  loadBagItems()
  updatePlayerUI()
  emit('player-data-updated', { source: 'store', skipAttributesUpdate: true, skipPlayerReload: true })
}

function validateGiftBoxQuantity () {
  if (giftBoxQuantity.value < 1) {
    giftBoxQuantity.value = 1
  } else if (giftBoxQuantity.value > maxGiftBoxQuantity.value) {
    giftBoxQuantity.value = maxGiftBoxQuantity.value
  }
}

function rollGiftBoxItem (contents) {
  if (!Array.isArray(contents) || contents.length === 0) {
    return null
  }
  const totalChance = contents.reduce((sum, entry) => {
    const value = Number(entry?.chance ?? 0)
    return sum + (Number.isFinite(value) ? value : 0)
  }, 0)

  if (totalChance <= 0) {
    const index = Math.floor(Math.random() * contents.length)
    return contents[index]
  }

  const roll = Math.random() * totalChance
  let current = 0
  for (const entry of contents) {
    const value = Number(entry?.chance ?? 0)
    current += Number.isFinite(value) ? value : 0
    if (roll <= current) {
      return entry
    }
  }
  return contents[contents.length - 1]
}

function confirmGiftBoxUse () {
  if (!selectedItem.value) {
    return
  }

  const contents = giftBoxContents.value
  if (!contents.length) {
    showMessage('该盒子没有可抽取的物品', 'error')
    return
  }

  const usableQuantity = Math.min(
    Math.max(1, Number(giftBoxQuantity.value) || 1),
    maxGiftBoxQuantity.value
  )
  giftBoxQuantity.value = usableQuantity

  if (emptySlots.value < usableQuantity) {
    showMessage('背包格子不足，无法使用', 'error')
    return
  }

  const rewardMap = new Map()
  for (let i = 0; i < usableQuantity; i += 1) {
    const reward = rollGiftBoxItem(contents)
    if (!reward) {
      continue
    }
    const rewardItemId = Number(reward.item)
    const rewardCount = Number(reward.count ?? 1)
    if (!Number.isFinite(rewardItemId)) {
      continue
    }
    const finalCount = Number.isFinite(rewardCount) && rewardCount > 0 ? rewardCount : 1
    rewardMap.set(rewardItemId, (rewardMap.get(rewardItemId) || 0) + finalCount)
  }

  if (rewardMap.size === 0) {
    showMessage('未抽到任何物品', 'error')
    return
  }

  const rewards = Array.from(rewardMap.entries()).map(([itemId, quantity]) => ({
    itemId,
    quantity
  }))

  const allAdded = BagService.addItemsToBag(rewards)
  BagService.removeItemFromBag(selectedItem.value.id, usableQuantity)

  const rewardText = rewards
    .map(reward => `${getGiftBoxItemName(reward.itemId)} x${reward.quantity}`)
    .join('，')
  const itemName = getDisplayName(selectedItem.value)
  showMessage(`使用 ${itemName} x${usableQuantity}，获得 ${rewardText}`, allAdded ? 'use' : 'info')

  if (props.showAnimationMessage && typeof props.showAnimationMessage === 'function') {
    rewards.forEach(reward => {
      const iconPath = `/pt/item_icon/${reward.itemId}.png`
      props.showAnimationMessage(`获得 ${getGiftBoxItemName(reward.itemId)} x${reward.quantity}`, 'gain', iconPath)
    })
  }

  if (props.gameInitializer && props.gameInitializer.services?.audio) {
    const audioService = props.gameInitializer.services.audio
    if (typeof audioService.playItemUseSFX === 'function') {
      audioService.playItemUseSFX('scroll')
    } else {
      audioService.playSFX('scroll_use.mp3')
    }
  }

  if (!allAdded) {
    showMessage('背包空间不足，部分物品未加入', 'error')
  }

  updatePlayerUI()
  emit('player-data-updated', { source: 'store' })
  loadBagItems()
  closeGiftBoxPanel()
  closePanel()
}

// 物品操作功能
function useItem () {
 
  if (!selectedItem.value) {
    console.error('[Bag] 使用物品失败：没有选中的物品')
    return
  }

  const itemId = Number(selectedItem.value.id)
 

  if (itemId === 17866) {
    openGiftBoxPanel()
    return
  }

  // 魔法牢笼 ID: 1000000 - 打开抽奖面板
  if (itemId === 1000000) {
    showMagicCagePanel.value = true
    return
  }

  // 调用useItemManager中的useItem函数，传入回调函数
  const quantity = showUseQuantityControl.value
    ? Math.min(Math.max(1, Number(useQuantity.value) || 1), maxUseQuantity.value)
    : 1
 
  useItemFromManager(
    selectedItem.value,
    emit,
    {
      loadBagItems,
      updatePlayerUI,
      closePanel
    },
    itemId === 1276 || itemId === 1277 ? quantity : 1
  )
}

function equipItem () {
  if (!selectedItem.value) {
    console.error('[Bag] 装备失败：没有选中的物品')
    return
  }

  const itemId = selectedItem.value.id

  // 根据物品类型确定装备槽
  let slotId = ''
  if (selectedItem.value.category === 'weapon') {
    // 双刀流逻辑：刀锋战士60级后，若主手已有武器，则将武器装备到副手(shield)槽位
    if (canDualWield(props.player) && itemsStore.equipment.weapon) {
      slotId = 'shield'
    } else {
      slotId = 'weapon'
    }
  } else if (selectedItem.value.category === 'armor') {
    // 根据具体防具类型确定槽位
    if (selectedItem.value.subcategory === 'helmet') {
      slotId = 'helmet'
    } else if (
      selectedItem.value.subcategory === 'gloves' ||
      selectedItem.value.subcategory === 'gauntlet'
    ) {
      slotId = 'gloves'
    } else if (selectedItem.value.subcategory === 'boots') {
      slotId = 'boots'
    } else if (selectedItem.value.subcategory === 'shield') {
      slotId = 'shield'
    } else {
      slotId = 'armor' // 默认为armor槽
    }
  } else if (selectedItem.value.category === 'jewelry') {
    // 根据珠宝类型确定槽位
    if (selectedItem.value.subcategory === 'necklace') {
      slotId = 'necklace'
    } else if (selectedItem.value.subcategory === 'ring') {
      // 优先使用 itemsStore.equipment 实时数据判断槽位
      // ring1为空则装备到ring1，ring1满但ring2为空则装备到ring2
      if (!itemsStore.equipment.ring1) {
        slotId = 'ring1'
      } else if (!itemsStore.equipment.ring2) {
        slotId = 'ring2'
      } else {
        // 两个槽位都有装备，默认替换ring1
        slotId = 'ring1'
      }
    } else if (selectedItem.value.subcategory === 'earring') {
      // 优先使用 itemsStore.equipment 实时数据判断槽位
      // earring1为空则装备到earring1，earring1满但earring2为空则装备到earring2
      if (!itemsStore.equipment.earring1) {
        slotId = 'earring1'
      } else if (!itemsStore.equipment.earring2) {
        slotId = 'earring2'
      } else {
        // 两个槽位都有装备，默认替换earring1
        slotId = 'earring1'
      }
    } else {
      slotId = 'necklace' // 默认为necklace槽
    }
  } else if (selectedItem.value.category === 'fashion') {
    // 时装类别：根据子类型确定槽位
    if (selectedItem.value.subcategory === 'mask') {
      slotId = 'mask'
    } else if (selectedItem.value.subcategory === 'cloak' || selectedItem.value.subcategory === 'visualcloak') {
      slotId = 'cloak'
    } else if (selectedItem.value.subcategory === 'hat') {
      slotId = 'fashionHat'
    } else if (selectedItem.value.subcategory === 'cloth') {
      slotId = 'fashionSuit'
    } else if (selectedItem.value.subcategory === 'glove') {
      slotId = 'fashionGloves'
    } else if (selectedItem.value.subcategory === 'shoes') {
      slotId = 'fashionBoots'
    }
  }



  // 调用BagService装备物品
  const success = BagService.equipItem(itemId, slotId, {
    bagIndex: selectedItemIndex.value,
    uniqueId: selectedItem.value?.uniqueId ?? null,
    sourceItem: selectedItem.value,
    player: props.player
  })


  if (success) {

    // 显示成功消息
    const itemName = getDisplayName(selectedItem.value)
    showMessage(`成功装备 ${itemName}`, 'equip')

    // 显示动画消息
    if (props.showAnimationMessage && typeof props.showAnimationMessage === 'function') {
      const iconPath = `/pt/item_icon/${selectedItem.value.id}.png`
      props.showAnimationMessage(`装备 ${itemName}`, 'equip', iconPath)
    }

    if (props.gameInitializer && props.gameInitializer.services?.audio) {
      const audioService = props.gameInitializer.services.audio
      let sfxName = 'InfEquipCloth.wav'
      if (selectedItem.value.category === 'weapon') {
        sfxName = 'InfEquipWeapon.wav'
      } else if (selectedItem.value.category === 'armor') {
        sfxName = 'InfEquipArmor.wav'
      } else if (selectedItem.value.category === 'jewelry') {
        sfxName = 'InfEquipAccessory.wav'
      }
      audioService.playSFX(sfxName)
    }

    // 更新其他UI
    updatePlayerUI()


    // 触发事件通知父组件更新玩家数据（BagModal会调用loadBagItems）
    emit('player-data-updated', { source: 'store' })


    // 关闭物品操作面板
    closePanel()
  } else {
    const reason = itemsStore.lastEquipErrorMessage
    const message = reason || '装备失败，请重试'
    showMessage(message, 'error')

    if (props.showAnimationMessage && typeof props.showAnimationMessage === 'function') {
      const iconPath = selectedItem.value?.id ? `/pt/item_icon/${selectedItem.value.id}.png` : ''
      props.showAnimationMessage(message, 'error', iconPath)
    }
  }
}

function increaseSellQuantity () {
  if (sellQuantity.value < maxSellQuantity.value) {
    sellQuantity.value++
  }
}

function decreaseSellQuantity () {
  if (sellQuantity.value > 1) {
    sellQuantity.value--
  }
}

function validateSellQuantity () {
  if (sellQuantity.value < 1) {
    sellQuantity.value = 1
  } else if (sellQuantity.value > maxSellQuantity.value) {
    sellQuantity.value = maxSellQuantity.value
  }
}

function increaseUseQuantity () {
  if (useQuantity.value < maxUseQuantity.value) {
    useQuantity.value++
  }
}

function decreaseUseQuantity () {
  if (useQuantity.value > 1) {
    useQuantity.value--
  }
}

function validateUseQuantity () {
  if (useQuantity.value < 1) {
    useQuantity.value = 1
  } else if (useQuantity.value > maxUseQuantity.value) {
    useQuantity.value = maxUseQuantity.value
  }
}

function confirmSell () {
  if (!selectedItem.value) {
    console.error('[Bag] 出售失败：没有选中的物品')
    return
  }

  if (shouldConfirmSell(selectedItem.value)) {
    showSellConfirmDialog.value = true
    return
  }

  performSell()
}

function cancelSellConfirm () {
  showSellConfirmDialog.value = false
}

function performSell () {
  if (!selectedItem.value) {
    console.error('[Bag] 出售失败：没有选中的物品')
    showSellConfirmDialog.value = false
    return
  }

  const itemId = selectedItem.value.id
  const quantity = sellQuantity.value

  // 调用BagService出售物品
  const goldEarned = BagService.sellItem(selectedItem.value, quantity)

  if (goldEarned > 0) {

    // 检查是否出售了全部数量
    const soldAll = quantity >= maxSellQuantity.value

    // 显示成功消息到战斗日志
    const itemName = getDisplayName(selectedItem.value)
    const message = soldAll
      ? `出售 ${itemName}，获得 ${goldEarned} Penya`
      : `出售 ${itemName} x${quantity}，获得 ${goldEarned} Penya`
    showMessage(message, 'sell')

    // 显示动画消息
    if (props.showAnimationMessage && typeof props.showAnimationMessage === 'function') {
      const iconPath = `/pt/item_icon/${itemId}.png`
      props.showAnimationMessage(`出售 ${itemName}`, 'sell', iconPath)
    }

    // 播放获得金币音效（InfTrade.wav）
    if (props.gameInitializer && props.gameInitializer.services?.audio) {
      const audioService = props.gameInitializer.services.audio
      if (typeof audioService.playGoldSFX === 'function') {
        audioService.playGoldSFX()
      } else {
        audioService.playSFX('InfTrade.wav')
      }
    }

    // 参考 DecomposeModal 的处理方式：出售操作只修改背包和金币，不需要任何额外的 UI 更新
    // bagItems 是 computed 属性会自动更新，金币显示通过 dispatchGoldUpdateEvent 已更新
    emit('player-data-updated', {
      source: 'sell',
      skipPlayerReload: true,
      skipAttributesUpdate: true
    })

    showSellConfirmDialog.value = false
    // 关闭物品操作面板
    closePanel()
  } else {
    console.error('[Bag] 出售失败')
    showMessage('出售失败，请重试', 'error')
    showSellConfirmDialog.value = false
  }
}

// 显示消息到战斗日志
function showMessage (message, type = 'info') {
  if (props.addBattleLog && typeof props.addBattleLog === 'function') {
    props.addBattleLog(message, type)
  }
}

// 更新玩家UI
function updatePlayerUI () {
  // 发送事件通知其他组件更新
  const updateEvent = new CustomEvent('update-player-ui')
  window.dispatchEvent(updateEvent)

  // 直接更新金币显示
  updateGoldDisplay()
}

// 确保数据已保存
// 已移除此方法，因为数据已经通过 Pinia Store 管理，BagService 内部已经处理了数据保存

// 更新金币显示
function updateGoldDisplay () {
  // 直接从 itemsStore 获取金币数据
  const gold = itemsStore.playerGold || 0

  // 触发全局事件通知其他组件更新金币显示
  const goldUpdateEvent = new CustomEvent('gold-update', { detail: { gold } })
  window.dispatchEvent(goldUpdateEvent)

 
}

/**
   * 处理背包更新事件
   */
function handleBagUpdateEvent () {
 
  loadBagItems()
}

// 捡宠倒计时tick计数器，每秒递增强制刷新倒计时显示
const pickuppetCountdownTick = ref(0)
let pickuppetCountdownTickTimer = null

/**
* 格式化秒数为 2:23:59 格式（时:分:秒）
* @param {number} totalSeconds - 总秒数
* @returns {string} 格式化后的时间字符串（>1h显示 时:分，<1h显示 分:秒）
*/
const formatPickuppetCountdown = (totalSeconds) => {
  const safeSeconds = Number(totalSeconds)
  if (!Number.isFinite(safeSeconds) || safeSeconds <= 0) return '0:00'
  const s = Math.floor(safeSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    // 大于1小时：显示 时:分钟（如 720:25、120:30）
    return `${h}:${m.toString().padStart(2, '0')}`
  }
  // 小于1小时：显示 分钟:秒（如 25:30）
  return `${m}:${sec.toString().padStart(2, '0')}`
}

/**
 * 根据限时捡宠剩余秒数返回颜色CSS类名
 * >24小时 绿色，>1小时 黄色，<1小时 红色
 * @param {number} totalSeconds - 总剩余秒数
 * @returns {string} CSS类名
 */
const getPickuppetCountdownClass = (totalSeconds) => {
  const safeSeconds = Number(totalSeconds)
  if (!Number.isFinite(safeSeconds) || safeSeconds <= 0) return 'countdown-red'
  if (safeSeconds > 86400) return 'countdown-green' // >24h 绿色
  if (safeSeconds > 3600) return 'countdown-yellow'  // >1h 黄色
  return 'countdown-red'                              // <1h 红色
}

/**
 * 获取捡宠的限时到期时间戳（队员感知）
 * - 队长：从全局 pickuppetSummonStore 获取
 * - 队员：从队员自身 activeBuffs 中查找
 * @param {string} key - 捡宠归一化 key
 * @returns {number} 到期时间戳（0 表示无倒计时）
 */
const getPickuppetExpiresAt = (key) => {
  if (!key) return 0
  if (isMainPlayer()) {
    const entry = pickuppetSummonStore.getTimer(key)
    return entry?.expiresAt || 0
  }
  // 队员：从 activeBuffs 查找
  const target = props.player
  if (!target || !Array.isArray(target.activeBuffs)) return 0
  const buff = target.activeBuffs.find(b => String(b?.id ?? '') === `pickuppet_auto_loot_${key}`)
  return buff?.expiresAt || buff?.endTime || 0
}

/**
 * 判断物品是否为活跃的限时捡宠（召唤中或召回后倒计时未结束）
 * 使用纯响应式条件，不在 v-if 中使用依赖 Date.now() 的 store 方法，避免渲染不一致
 * @param {object} item - 物品实例
 * @returns {boolean}
 */
const isItemActiveTimedPickuppet = (item) => {
  if (!item || item.category !== 'pickuppet') return false
  const key = item.uniqueId ? String(item.uniqueId) : (item.id ? `id:${String(item.id)}` : null)
  if (!key) return false
  const expiresAt = getPickuppetExpiresAt(key)
  if (expiresAt <= 0) return false
  return true
}

/**
 * 获取指定捡宠物品的倒计时显示信息（文本、颜色类、字号）
 * 依赖 pickuppetCountdownTick 每秒刷新
 * @param {object} item - 物品实例
 * @returns {{ text: string, colorClass: string, fontSize: string }}
 */
const getPickuppetCountdownForItem = (item) => {
  // eslint-disable-next-line no-unused-vars
  const _tick = pickuppetCountdownTick.value
  const key = item.uniqueId ? String(item.uniqueId) : (item.id ? `id:${String(item.id)}` : null)
  if (!key) return { text: '0:00', colorClass: 'countdown-red', fontSize: '7px' }
  const expiresAt = getPickuppetExpiresAt(key)
  if (expiresAt <= 0) return { text: '0:00', colorClass: 'countdown-red', fontSize: '7px' }
  const now = Date.now()
  if (now >= expiresAt) return { text: '0:00', colorClass: 'countdown-red', fontSize: '7px' }
  const remainingSec = Math.ceil((expiresAt - now) / 1000)
  const text = formatPickuppetCountdown(remainingSec)
  const colorClass = getPickuppetCountdownClass(remainingSec)
  const charCount = text.length
  const fontSize = Math.max(7, Math.min(14, Math.floor(42 / (charCount * 0.62))))
  return { text, colorClass, fontSize: `${fontSize}px` }
}

/** 启动背包格子倒计时tick */
const startPickuppetCountdownTick = () => {
  if (pickuppetCountdownTickTimer) return
  pickuppetCountdownTickTimer = setInterval(() => {
    pickuppetCountdownTick.value++
    // 检查是否所有倒计时都到期了，到期后停止 tick
    // 队长：检查全局 Store；队员：检查队员自身 activeBuffs
    let hasActiveTimed = pickuppetSummonStore.isTimedPickuppetActive
    if (!hasActiveTimed && !isMainPlayer()) {
      // 队员：检查队员自身 activeBuffs 中是否有未到期的限时捡宠
      const target = props.player
      if (target && Array.isArray(target.activeBuffs)) {
        const now = Date.now()
        hasActiveTimed = target.activeBuffs.some(b =>
          String(b?.id ?? '').startsWith('pickuppet_auto_loot') &&
          (b?.expiresAt || b?.endTime || 0) > now
        )
      }
    }
    if (!hasActiveTimed) {
      stopPickuppetCountdownTick()
    }
  }, 1000)
}

/** 停止背包格子倒计时tick */
const stopPickuppetCountdownTick = () => {
  if (pickuppetCountdownTickTimer) {
    clearInterval(pickuppetCountdownTickTimer)
    pickuppetCountdownTickTimer = null
  }
}

// 监听捡宠计时器状态，启动/停止背包倒计时tick
// 限时捡宠召回后倒计时继续走，直到到期才停止
watch(
  () => ({
    timerCount: Object.keys(pickuppetSummonStore.timers).length,
    hasAnyTimed: pickuppetSummonStore.isTimedPickuppetActive
  }),
  ({ timerCount, hasAnyTimed }) => {
    const needTick = timerCount > 0 && hasAnyTimed
    if (needTick) {
      startPickuppetCountdownTick()
    } else {
      stopPickuppetCountdownTick()
    }
  },
  { immediate: true, deep: true }
)

// 捡宠到期处理定时器
let pickuppetCountdownTimer = null

const startPickuppetCountdown = () => {
  if (pickuppetCountdownTimer) return
  pickuppetCountdownTimer = setInterval(() => {
    // 检查所有到期的捡宠，checkExpiry 返回已到期的列表
    const expiredList = pickuppetSummonStore.checkExpiry()
    if (expiredList.length > 0) {
      // 到期后移除所有捡宠BUFF，然后逐个添加仍活跃的
      try {
        removePickuppetBuff()
        // 重新同步仍活跃的捡宠BUFF
        syncAllPickuppetBuffs()
      } catch (error) {
        console.error('[Bag] 捡宠到期后更新BUFF失败:', error)
      }
      // 限时捡宠到期后从背包中移除该物品
      for (const expired of expiredList) {
        const currentItem = expired.item
        if (currentItem) {
          nextTick(() => {
            try {
              const itemId = Number(currentItem.id)
              const uniqueId = currentItem.uniqueId || null
              const removeOptions = uniqueId ? { uniqueId } : undefined
              const removed = itemsStore.removeItemFromBag(itemId, 1, removeOptions)
              if (removed) {
                console.log('[Bag] 限时捡宠到期，已从背包移除:', currentItem.name || itemId)
                try {
                  storageService.savePlayerPatch({
                    activeBuffs: gameStore.player?.activeBuffs,
                    bag: [...itemsStore.playerBag]
                  })
                } catch (saveError) {
                  console.error('[Bag] 捡宠到期后保存数据失败:', saveError)
                }
              }
            } catch (removeError) {
              console.error('[Bag] 限时捡宠到期后从背包移除失败:', removeError)
            }
          })
        }
      }
      showMessage('捡宠时间已到，已自动移除', 'info')
    }
    // 同步捡宠BUFF倒计时（更新activeBuffs中的duration和endTime）
    if (pickuppetSummonStore.hasSummoned || pickuppetSummonStore.isTimedPickuppetActive) {
      syncAllPickuppetBuffs()
    }
  }, 1000)
}

const stopPickuppetCountdown = () => {
  if (pickuppetCountdownTimer) {
    clearInterval(pickuppetCountdownTimer)
    pickuppetCountdownTimer = null
  }
}

// 组件卸载前清理定时器，避免 DOM 移除后定时器回调触发响应式更新导致 nextSibling 错误
onBeforeUnmount(() => {
  // 清理捡宠倒计时定时器
  stopPickuppetCountdown()
  // 清理捡宠倒计时tick定时器
  stopPickuppetCountdownTick()
  // 清理图片分批加载的 requestAnimationFrame
  if (imageLoadRafId) {
    cancelAnimationFrame(imageLoadRafId)
    imageLoadRafId = null
  }
})

// 组件卸载后清理事件监听器
onUnmounted(() => {
  // 移除背包更新事件监听器
  window.removeEventListener('update-bag-ui', handleBagUpdateEvent)
  // 组件卸载时关闭可能残留的物品详情面板
  hideItemTooltip()
})

// 组件挂载时启动捡宠倒计时
onMounted(() => {
  loadBagItems()

  // 启动物品图片分批加载（首次加载10个，后续通过 requestAnimationFrame 渐进加载）
  loadMoreImages()

  // 监听背包更新事件（用于购买物品后刷新背包）
  window.addEventListener('update-bag-ui', handleBagUpdateEvent)

  // 点击页面其他地方关闭面板
  document.addEventListener('click', event => {
    if (
      showItemActionPanel.value &&
      actionPanel.value &&
      !actionPanel.value.contains(event.target)
    ) {
      closePanel()
    }
  })

  // 启动捡宠倒计时
  startPickuppetCountdown()
})

// 暴露方法供父组件调用
defineExpose({
  loadBagItems
})
</script>

<style scoped>
/* 背包网格 - 纸张风格 */
.bag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--bag-slot-size, 50px), 1fr));
  padding: var(--bag-gap, 10px);
  gap: var(--bag-gap, 10px);
  justify-items: stretch;
  align-content: start;
  overflow-y: auto;
}

/* 背包格子 - 黑色主题风格 */
.bag-slot {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--theme-border);
  border-radius: 6px;
  font-size: 14px;
  color: var(--theme-accent);
  z-index: 5;
  transition: border-color 0.2s ease, background 0.2s ease;
  /* 跳过不可见内容的渲染，减少主线程阻塞 */
  content-visibility: auto;
  contain-intrinsic-size: 50px;
}

.bag-slot:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--theme-accent);
}

.bag-slot img {
  width: 100%;
  height: 100%;
  border-radius: 5px;
  -webkit-user-drag: none;
  user-select: none;
}

.bag-slot.empty {
  background: rgba(0, 0, 0, 0.2);
  border: 1px dashed var(--theme-border);
  border-radius: 4px;
}

.item-icon {
  width: 100%;
  height: 100%;
  border-radius: 2px;
  z-index: 5;
  object-fit: contain;
  cursor: pointer;
  transition: transform 0.15s ease;
  background-color: rgba(0, 0, 0, 0.3);
}

.item-icon:hover {
  transform: scale(1.08);
}

.item-icon.image-error {
  opacity: 0.7;
  filter: grayscale(50%);
}

.empty-icon {
  width: 100%;
  height: 100%;
  border-radius: 2px;
  z-index: 5;
  opacity: 0.5;
}

.locked-icon {
  width: 100%;
  height: 100%;
  border-radius: 2px;
  z-index: 5;
  opacity: 0.6;
  filter: grayscale(100%);
}

.bag-slot.locked {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--theme-border);
  border-radius: 4px;
  opacity: 0.5;
  cursor: not-allowed;
}

/* 强化等级标记 - 右上角显示 */
.enhance-level-badge {
  position: absolute;
  top: 0px;
  right: 0px;
  font-size: 8px;
  font-weight: bold;
  color: var(--theme-accent);
  background: rgba(0, 0, 0, 0.8);
  padding: 2px 5px;
  border-radius: 3px;
  z-index: 5;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  pointer-events: none;
}

.stack-count {
  position: absolute;
  font-size: 10px;
  color: var(--theme-accent);
  border-radius: 3px;
  z-index: 5;
}

.summoned-mark {
  position: absolute;
  bottom: 3px;
  left: 3px;
  font-size: 7px;
  font-weight: bold;
  color: #ffffff;
  background: rgba(33, 150, 243, 0.85);
  padding: 2px 6px;
  border-radius: 3px;
  z-index: 5;
  pointer-events: none;
}

/* 捡宠召唤中标记（铺满物品图片上半部分） */
.pickuppet-summoned-mark {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  font-size: 9px;
  font-weight: bold;
  color: #ffffff;
  background: rgba(76, 175, 80, 0.85);
  padding: 2px 0;
  border-radius: 3px 3px 0 0;
  z-index: 5;
  pointer-events: none;
  text-align: center;
  white-space: nowrap;
  line-height: 1.1;
}

/* 捡宠倒计时徽章（铺满物品图片底部，颜色根据剩余时间动态变化） */
.pickuppet-countdown-badge {
  position: absolute;
  bottom: 0px;
  left: 0px;
  right: 0px;
  width: 100%;
  font-weight: bold;
  color: #ffffff;
  padding: 1px 0;
  border-radius: 0 0 3px 3px;
  z-index: 9;
  pointer-events: none;
  font-family: monospace;
  white-space: nowrap;
  text-align: center;
  line-height: 1.1;
  overflow: hidden;
}

/* >24小时：绿色 */
.pickuppet-countdown-badge.countdown-green {
  background: rgba(76, 175, 80, 0.9);
}

/* >1小时：黄色 */
.pickuppet-countdown-badge.countdown-yellow {
  background: rgba(255, 193, 7, 0.9);
  color: #1a1a1a;
}

/* <1小时：红色 */
.pickuppet-countdown-badge.countdown-red {
  background: rgba(231, 76, 60, 0.9);
}

/* 品级三角形标识 - 直角在左下角，贴合左边缘和底边缘 */
.rarity-triangle {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 18px;
  height: 18px;
  /* clip-path: 左下角(0,100%) 左上角(0,0) 右下角(100%,100%) → 直角在左下角 */
  clip-path: polygon(0 100%, 0 0, 100% 100%);
  z-index: 8;
  pointer-events: none;
  transition: background-color 0.2s ease;
}

/* 物品操作面板样式 - 黑色主题风格 */
.item-action-panel {
  position: fixed;
  width: 300px;
  height: auto;
  max-height: calc(100vh - 24px);
  background: var(--theme-modal-bg);
  border: 1px solid var(--theme-border-strong);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  overflow: hidden;
  user-select: none;
  display: flex;
  flex-direction: column;
  transform-origin: top right;
  color: var(--theme-text);
}

.item-action-panel-enter-active,
.item-action-panel-leave-active {
  transition:
    opacity 160ms ease,
    transform 180ms ease;
}

.item-action-panel-enter-from,
.item-action-panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.item-action-panel-enter-to,
.item-action-panel-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.item-action-panel::before {
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

.item-action-panel::after {
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
  background: transparent;
  padding: 12px 16px;
  border-bottom: 1px solid var(--theme-border-strong);
  cursor: move;
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
  color: var(--theme-accent);
  font-weight: bold;
  font-size: 16px;
  text-shadow: none;
  letter-spacing: 0.5px;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.close-button {
  background: transparent;
  border: 1px solid var(--theme-border);
  color: var(--theme-muted);
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--theme-accent);
  border-color: var(--theme-accent);
}

.panel-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: none;
  overflow-y: auto;
  min-height: 0;
  flex: 1;
}

.item-info {
  display: flex;
  gap: 5px;
  margin-bottom: 0px;
  padding: 5px;
  background: var(--theme-surface-muted);
  border: 1px solid var(--theme-border);
  border-radius: 5px;
  box-shadow: none;
}

.panel-item-icon {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 10px;
  background: var(--theme-surface-muted);
  border: 1px solid var(--theme-border);
  box-shadow: none;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.item-name {
  color: var(--theme-accent);
  font-weight: bold;
  font-size: 15px;
  text-align: center;
  line-height: 1.3;
  max-height: 55px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-shadow: none;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 10px;
  margin-top: auto;
  justify-content: space-around;
}

.action-button {
  padding: 8px 14px;
  border: 1px solid var(--theme-border);
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 12px;
  transition: background 0.2s ease, border-color 0.2s ease;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: transparent;
  color: var(--theme-text);
}

.action-button:hover {
  background: rgba(255, 255, 255, 0.08);
}

.use-button {
  color: #4caf50;
  border-color: #4caf50;
}

.use-button:hover {
  background: rgba(76, 175, 80, 0.15);
}

.equip-button {
  color: #2196f3;
  border-color: #2196f3;
}

.equip-button:hover {
  background: rgba(33, 150, 243, 0.15);
}

.summon-button {
  color: var(--theme-accent);
  border-color: var(--theme-accent);
}

.summon-button:hover {
  background: rgba(255, 215, 0, 0.1);
}

.recall-button {
  color: var(--theme-muted);
  border-color: var(--theme-border);
}

.recall-button:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* 捡宠召唤按钮 */
.pickuppet-summon-button {
  color: #4caf50;
  border-color: #4caf50;
}

.pickuppet-summon-button:hover {
  background: rgba(76, 175, 80, 0.15);
}

/* 捡宠召回按钮 */
.pickuppet-recall-button {
  color: var(--theme-muted);
  border-color: var(--theme-border);
}

.pickuppet-recall-button:hover {
  background: rgba(255, 255, 255, 0.05);
}

.sell-button {
  color: #f44336;
  border-color: #f44336;
}

.sell-button:hover {
  background: rgba(244, 67, 54, 0.15);
}

/* 物品操作面板中的出售控制样式 - 纸张风格 */
.item-quantity-display {
  color: var(--theme-text);
  font-weight: bold;
  font-size: 13px;
  margin-top: 6px;
  text-align: center;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.sell-controls {
  margin: 5px 0;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--theme-border);
  border-radius: 4px;
}

.sell-quantity-control {
  margin-bottom: 12px;
}

.sell-quantity-control label {
  display: block;
  color: var(--theme-text);
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: bold;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.sell-quantity-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sell-quantity-btn {
  background: transparent;
  color: var(--theme-text);
  border: 1px solid var(--theme-border);
  width: 32px;
  height: 32px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, border-color 0.2s ease;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.sell-quantity-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--theme-accent);
}

.sell-quantity-input {
  flex: 1;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--theme-border);
  color: var(--theme-text);
  text-align: center;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.sell-quantity-input:focus {
  outline: none;
  border-color: var(--theme-accent);
}

.sell-price-info {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--theme-border);
  border-radius: 4px;
  padding: 8px;
}

.sell-price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: var(--theme-text);
  font-size: 13px;
  font-weight: bold;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.sell-price-row.total {
  border-top: 2px solid var(--theme-border);
  padding-top: 10px;
  margin-top: 10px;
  font-size: 16px;
}

.sell-price-value {
  color: var(--theme-accent);
  font-weight: bold;
}

.sell-price-value.total {
  color: var(--theme-accent-strong);
  font-size: 16px;
}

.sell-confirm-dialog {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.sell-confirm-content {
  width: 360px;
  background: var(--theme-modal-bg);
  border: 1px solid var(--theme-border-strong);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--theme-text);
}

.sell-confirm-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--theme-accent);
  text-align: center;
}

.sell-confirm-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: var(--theme-text);
  text-align: center;
}

.sell-confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.sell-confirm-button {
  flex: 1;
  border: none;
  padding: 10px 12px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  color: #ffffff;
}

.sell-confirm-button.confirm {
  background: #f44336;
  color: #ffffff;
  border: none;
  border-radius: 4px;
}

.sell-confirm-button.cancel {
  background: rgba(255, 255, 255, 0.08);
  color: var(--theme-text);
  border: 1px solid var(--theme-border);
  border-radius: 4px;
}

/* 捡宠限时召唤二次确认弹窗样式 */
.pickuppet-confirm-title {
  color: #ff9800 !important;
  text-align: center;
}

.pickuppet-confirm-body {
  text-align: center;
}

.pickuppet-confirm-warning {
  color: #ff9800;
  font-weight: bold;
  font-size: 13px;
  margin-bottom: 8px;
}

.pickuppet-confirm-detail {
  color: var(--theme-text-secondary, #ccc);
  font-size: 12px;
  margin-bottom: 4px;
  line-height: 1.5;
}

.pickuppet-confirm-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  padding: 6px 12px;
  background: rgba(255, 152, 0, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.pickuppet-confirm-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  image-rendering: pixelated;
}

.pickuppet-confirm-btn {
  background: #ff9800 !important;
}

.pickuppet-confirm-btn:hover {
  background: #f57c00 !important;
}

.giftbox-panel {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 420px;
  max-height: 520px;
  background: var(--theme-modal-bg);
  border: 1px solid var(--theme-border-strong);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--theme-text);
}

.giftbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: transparent;
  border-bottom: 1px solid var(--theme-border-strong);
}

.giftbox-title {
  color: var(--theme-accent);
  font-weight: bold;
  font-size: 15px;
}

.giftbox-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.giftbox-reward-list {
  max-height: 280px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--theme-border);
  border-radius: 4px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

.giftbox-empty {
  color: var(--theme-muted);
  text-align: center;
  font-size: 13px;
  padding: 10px 0;
}

.giftbox-reward-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--theme-border);
  border-radius: 4px;
  padding: 8px;
}

.giftbox-reward-item img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--theme-border);
  border-radius: 4px;
}

.giftbox-reward-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.giftbox-reward-name {
  color: var(--theme-accent);
  font-weight: bold;
  font-size: 13px;
}

.giftbox-reward-chance {
  color: var(--theme-muted);
  font-size: 11px;
}

.giftbox-quantity-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--theme-accent);
  font-weight: bold;
}

.giftbox-quantity-input {
  width: 80px;
  padding: 6px 8px;
  text-align: center;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--theme-border);
  color: var(--theme-text);
  border-radius: 4px;
  font-weight: bold;
}

.giftbox-quantity-input:focus {
  outline: none;
  border-color: var(--theme-accent);
}

.giftbox-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.giftbox-button {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid var(--theme-border);
  cursor: pointer;
  font-weight: bold;
  font-size: 13px;
  transition: background 0.2s ease;
  background: transparent;
  color: var(--theme-text);
}

.giftbox-button.confirm {
  background: var(--theme-accent);
  color: #000000;
  border-color: var(--theme-accent);
}

.giftbox-button.cancel {
  color: #f44336;
  border-color: #f44336;
}

.giftbox-button:hover {
  opacity: 0.85;
}
</style>
