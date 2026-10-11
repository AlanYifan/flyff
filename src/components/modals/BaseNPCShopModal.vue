<template>
  <div ref="modalContainerRef" class="modal-container" :style="modalStyle">
      <!-- 头部 -->
      <div class="modal-header" @pointerdown="startDrag">
        <div class="npc-info">
          <img :src="npcAvatar" :alt="npcName" class="npc-avatar" draggable="false" />
          <h2>{{ npcName }}</h2>
        </div>
        <div class="header-actions">
          <template v-if="actionsPlacement === 'header'">
            <slot name="extra-buttons"></slot>
          </template>
          <button class="close-button" @click="closeModal">×</button>
        </div>
      </div>

      <div class="dialog-section">
        <div class="dialog-area">
          {{ npcDialog }}
        </div>
        <div v-if="actionsPlacement === 'dialog'" class="dialog-actions">
          <slot name="extra-buttons"></slot>
        </div>
      </div>

      <!-- 功能区域（在筛选栏上方） -->
      <div v-if="$slots['action-bar']" class="action-bar">
        <slot name="action-bar"></slot>
      </div>

      <div v-if="$slots.filters" class="filters-bar">
        <slot name="filters"></slot>
      </div>

      <!-- 物品网格 -->
      <div class="items-grid">
        <!-- 加载提示 -->
        <div v-if="isLoading" class="loading-message">加载商品中...</div>

        <!-- 物品列表 -->
        <div
          v-for="(item, index) in shopItems"
          :key="item.id || index"
          class="item-slot"
          @click="selectItem(item, $event)"
          @mouseenter="showItemTooltip($event, item)"
          @mouseleave="hideItemTooltip"
          @mousemove="moveItemTooltip"
        >
          <img :src="getItemIcon(item)" :alt="item.name" class="item-icon" />
          <div class="item-name" :style="{ color: getRarityColor(item.rarity) }">
            {{ getItemDisplayName(item) }}
          </div>
          <div class="item-price">{{ getItemPrice(item) }} Penya</div>
          <!-- 物品额外信息插槽 -->
          <slot name="item-extra-info" :item="item"></slot>
        </div>
      </div>

      <!-- 购买面板 -->
      <teleport to="body">
        <PurchasePanel
          :is-visible="!!selectedItem"
          :selected-item="selectedItem"
          :anchor="purchasePanelAnchor"
          :rarity-colors="rarityColors"
          :price-calculator="priceCalculator"
          @close="cancelSelection"
          @purchase="performPurchase"
        />
      </teleport>

      <!-- 右下角拉伸指示器 -->
      <div class="shop-resize-handle" @pointerdown="startResize">
        <div class="resize-lines">
          <span class="resize-line"></span>
          <span class="resize-line"></span>
          <span class="resize-line"></span>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PurchasePanel from './PurchasePanel.vue'
import { useItemsStore } from '@/store/items'
import { RARITY_NAMES } from '@/store/descriptions'

// Props
const props = defineProps({
  npcName: {
    type: String,
    default: 'NPC商店'
  },
  npcAvatar: {
    type: String,
    default: '/pt/npc_icon/default.png'
  },
  npcDialog: {
    type: String,
    default: ''
  },
  shopItems: {
    type: Array,
    default: () => []
  },
  // 稀有度颜色映射
  rarityColors: {
    type: Object,
    default: () => ({
      common: '#C0C0C0',
      uncommon: '#0070DD',
      rare: '#FFD700',
      veryrare: 'rgb(255, 0, 13)',
      unique: 'rgb(255, 0, 13)',
      ultimate: '#A335EE'
    })
  },
  // 稀有度名称映射
  rarityNames: {
    type: Object,
    default: () => RARITY_NAMES
  },
  // 价格计算函数
  priceCalculator: {
    type: Function,
    default: item => item.price || (item.sellPrice ? item.sellPrice : 0) || 0
  },
  // 名称显示函数
  nameFormatter: {
    type: Function,
    default: item => item.name?.cns || item.name?.en || item.name || '未知物品'
  },
  // 描述显示函数
  descriptionFormatter: {
    type: Function,
    default: item => item.description || ''
  },
  actionsPlacement: {
    type: String,
    default: 'header'
  }
})

const itemsStore = useItemsStore()

// Emits
const emit = defineEmits(['close', 'purchase', 'item-selected'])

// 面板尺寸常量
const MIN_WIDTH = 520
const MIN_HEIGHT = 420

// Reactive data
const selectedItem = ref(null)
const quantity = ref(1)
const isLoading = ref(false)
const purchasePanelAnchor = ref({ x: 0, y: 0 })
const modalContainerRef = ref(null)
const modalPosition = ref(null)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const isResizing = ref(false)
const resizeStartData = ref({ x: 0, y: 0, width: 0, height: 0 })

// Computed
const modalStyle = computed(() => {
  if (!modalPosition.value) {
    return {}
  }
  return {
    top: `${modalPosition.value.y}px`,
    left: `${modalPosition.value.x}px`,
    transform: 'none'
  }
})

const getClientPoint = event => {
  if (event?.touches && event.touches[0]) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    }
  }
  return {
    x: event.clientX,
    y: event.clientY
  }
}

const endDrag = () => {
  if (!isDragging.value) {
    return
  }
  isDragging.value = false
  window.removeEventListener('pointermove', handleDragMove)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
}

const handleDragMove = event => {
  if (!isDragging.value) {
    return
  }
  const point = getClientPoint(event)
  const containerEl = modalContainerRef.value
  if (!containerEl) {
    return
  }
  const width = containerEl.offsetWidth
  const height = containerEl.offsetHeight
  const maxX = Math.max(window.innerWidth - width, 0)
  const maxY = Math.max(window.innerHeight - height, 0)
  const nextX = Math.min(Math.max(point.x - dragOffset.value.x, 0), maxX)
  const nextY = Math.min(Math.max(point.y - dragOffset.value.y, 0), maxY)
  modalPosition.value = { x: nextX, y: nextY }
}

const startDrag = event => {
  if (event.button !== undefined && event.button !== 0) {
    return
  }
  const target = event.target
  if (target?.closest?.('button')) {
    return
  }
  const containerEl = modalContainerRef.value
  if (!containerEl) {
    return
  }
  const rect = containerEl.getBoundingClientRect()
  modalPosition.value = { x: rect.left, y: rect.top }
  const point = getClientPoint(event)
  dragOffset.value = { x: point.x - rect.left, y: point.y - rect.top }
  isDragging.value = true
  window.addEventListener('pointermove', handleDragMove)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
}

// Methods
const closeModal = () => {
  emit('close')

  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }
}

const selectItem = (item, event) => {
  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }

  selectedItem.value = item
  quantity.value = 1
  const containerEl = modalContainerRef.value
  const containerRect = containerEl?.getBoundingClientRect()
  const targetRect = event?.currentTarget?.getBoundingClientRect()
  const panelWidth = 300
  const panelHeight = 240
  const gap = 10
  if (containerRect && targetRect) {
    const rawX = targetRect.left + targetRect.width / 2
    const rawY = targetRect.top - gap
    const minX = containerRect.left + panelWidth / 2
    const maxX = containerRect.left + containerRect.width - panelWidth / 2
    const minY = containerRect.top + panelHeight + gap
    purchasePanelAnchor.value = {
      x: Math.min(Math.max(rawX, minX), maxX),
      y: Math.max(rawY, minY)
    }
  } else {
    purchasePanelAnchor.value = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    }
  }
  emit('item-selected', item)
}

// 获取物品图标
const getItemIcon = item => {
  // 物品图片使用物品 ID: /pt/item_icon/物品ID.png
  return `/pt/item_icon/${item.id}.png`
}

// 获取物品价格
const getItemPrice = item => {
  return props.priceCalculator(item)
}

// 获取物品显示名称
const getItemDisplayName = item => {
  const name = props.nameFormatter(item)
  return name.length > 8 ? name.substring(0, 8) + '...' : name
}

// 获取稀有度颜色
const getRarityColor = rarity => {
  return itemsStore.getRarityTextColor(rarity)
}

// Tooltip相关函数
const showItemTooltip = (event, item) => {
  // 发送事件到通用物品详情信息面板
  const tooltipEvent = new CustomEvent('show-item-tooltip', {
    detail: {
      item,
      position: {
        x: event.clientX + 15,
        y: event.clientY + 15
      }
    }
  })
  window.dispatchEvent(tooltipEvent)
}

const hideItemTooltip = () => {
  // 发送事件到通用物品详情信息面板
  const tooltipEvent = new CustomEvent('hide-item-tooltip')
  window.dispatchEvent(tooltipEvent)
}

// 移动tooltip位置
const moveItemTooltip = event => {
  // 发送事件到通用物品详情信息面板
  const tooltipEvent = new CustomEvent('move-item-tooltip', {
    detail: {
      position: {
        x: event.clientX + 15,
        y: event.clientY + 15
      }
    }
  })
  window.dispatchEvent(tooltipEvent)
}

const cancelSelection = () => {
  selectedItem.value = null
  quantity.value = 1
}

const performPurchase = purchaseData => {
// 发送购买请求到父组件
emit('purchase', purchaseData)

  // 重置状态
  selectedItem.value = null
}

/**
 * 开始拉伸面板
 * @param {PointerEvent} event - 指针事件
 */
const startResize = event => {
  event.preventDefault()
  const containerEl = modalContainerRef.value
  if (!containerEl) return

  const rect = containerEl.getBoundingClientRect()
  // 初始化位置
  modalPosition.value = { x: rect.left, y: rect.top }

  isResizing.value = true
  resizeStartData.value = {
    x: event.clientX,
    y: event.clientY,
    width: rect.width,
    height: rect.height
  }

  window.addEventListener('pointermove', handleResize)
  window.addEventListener('pointerup', stopResize)
  window.addEventListener('pointercancel', stopResize)
}

/**
 * 处理拉伸移动
 * @param {PointerEvent} event - 指针事件
 */
const handleResize = event => {
  if (!isResizing.value || !modalContainerRef.value) return

  const deltaX = event.clientX - resizeStartData.value.x
  const deltaY = event.clientY - resizeStartData.value.y

  const newWidth = Math.max(MIN_WIDTH, Math.min(window.innerWidth * 0.9, resizeStartData.value.width + deltaX))
  const newHeight = Math.max(MIN_HEIGHT, Math.min(window.innerHeight * 0.9, resizeStartData.value.height + deltaY))

  const containerEl = modalContainerRef.value
  containerEl.style.width = `${newWidth}px`
  containerEl.style.height = `${newHeight}px`

  // 更新位置以保持居中
  if (modalPosition.value) {
    const maxX = Math.max(window.innerWidth - newWidth, 0)
    const maxY = Math.max(window.innerHeight - newHeight, 0)
    modalPosition.value = {
      x: Math.min(Math.max((window.innerWidth - newWidth) / 2, 0), maxX),
      y: Math.min(Math.max((window.innerHeight - newHeight) / 2, 0), maxY)
    }
  }
}

/**
 * 停止拉伸
 */
const stopResize = () => {
  isResizing.value = false
  window.removeEventListener('pointermove', handleResize)
  window.removeEventListener('pointerup', stopResize)
  window.removeEventListener('pointercancel', stopResize)
}

// 组件挂载时初始化位置
onMounted(() => {
  const containerEl = modalContainerRef.value
  if (containerEl) {
    const rect = containerEl.getBoundingClientRect()
    modalPosition.value = { x: rect.left, y: rect.top }
  }
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  window.removeEventListener('pointermove', handleResize)
  window.removeEventListener('pointerup', stopResize)
  window.removeEventListener('pointercancel', stopResize)
  window.removeEventListener('pointermove', handleDragMove)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
})
</script>

<style scoped>
  .modal-container {
    background-color: var(--theme-npc-bg);
    /* border: 2px solid #ffd700; */
    border-radius: 10px;
    padding: 20px;
    width: 520px;
    height: 420px;
    min-width: 520px;
    min-height: 420px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
    color: var(--theme-text);
    /* box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); */
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    scrollbar-color: rgba(255, 215, 0, 0.6) var(--theme-npc-bg);
    scrollbar-width: thin;
  }

  .modal-container::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }

  .modal-container::-webkit-scrollbar-track {
    background: var(--theme-npc-bg);
    border-radius: 6px;
  }

  .modal-container::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.6);
    border-radius: 6px;
    border: 2px solid rgba(255, 215, 0, 0.2);
  }

  .modal-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 215, 0, 0.85);
  }

  .modal-header {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    cursor: move;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ffd700;
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2;
    background-color: var(--theme-npc-bg);
    touch-action: none;
  }

  .modal-header h2 {
    margin: 0;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    color: var(--theme-accent);
  }

  .npc-info {
    display: flex;
    align-items: center;
    gap: 15px;
    grid-column: 2;
    justify-self: center;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    grid-column: 3;
    justify-self: end;
  }

  .npc-avatar {
    width: 50px;
    height: 50px;
    border-radius: 10%;
    border: 1px solid #ffd700;
  }

  .close-button {
    color: var(--theme-text);
    font-size: 30px;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    border: none;
    background: none;
  }

  .close-button:hover {
    border: none;
    background: none;
  }

  .dialog-section {
    position: sticky;
    top: 70px;
    z-index: 1;
    background-color: #000000;
  }

  .dialog-area {
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 5px;
    margin-bottom: 10px;
    text-align: center;
    font-size: 14px;
    line-height: 1.5;
  }

  .dialog-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .action-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    margin-bottom: 8px;
    background-color: var(--theme-npc-bg);
    position: sticky;
    top: 110px;
    z-index: 2;
  }

  .filters-bar {
    display: flex;
    justify-content: center;
    margin-bottom: 10px;
    position: sticky;
    top: 140px;
    z-index: 1;
    background-color: var(--theme-npc-bg);
    padding: 6px 0;
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
    width: 100%;
    align-content: start;
    box-sizing: border-box;
  }

  .loading-message {
    grid-column: 1 / -1;
    text-align: center;
    padding: 20px;
    font-size: 16px;
    color: #ffd700;
  }

  .item-slot {
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid #666;
    border-radius: 5px;
    padding: 10px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .item-slot:hover {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: #ffd700;
    transform: translateY(-2px);
  }

  .item-icon {
    width: 50px;
    height: 50px;
    object-fit: contain;
    margin-bottom: 5px;
  }

  .tooltip-item-icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
    margin-right: 10px;
    vertical-align: top;
  }

  .tooltip-item-info {
    flex: 1;
  }

  .tooltip-item-name {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 3px;
    color: white;
  }

  .item-name {
    font-size: 12px;
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-price {
    font-size: 12px;
    color: gold;
  }

  .item-description {
    margin-top: 8px;
    font-style: italic;
    color: #bbb;
    font-size: 0.9em;
  }

  /* Tooltip样式 */
  .item-tooltip {
    position: fixed;
    background-color: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    min-width: 200px;
    max-width: 350px;
    z-index: 999999 !important;
    border: 1px solid #ffd700;
  }

  .tooltip-header {
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 8px;
    display: flex;
    align-items: flex-start;
  }

  .tooltip-description {
    margin: 10px 0;
    font-style: italic;
    color: #bbb;
    font-size: 0.9em;
    line-height: 1.4;
  }

  .tooltip-level {
    margin-bottom: 3px;
    font-size: 0.9em;
    color: #aaa;
  }

  .tooltip-abilities-section {
    margin-top: 12px;
  }

  .tooltip-section-title {
    font-weight: bold;
    color: #ffd700;
    margin-bottom: 6px;
    font-size: 0.95em;
  }

  .tooltip-abilities {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
    font-size: 0.9em;
  }

  .ability-line {
    margin-bottom: 3px;
    padding: 2px 0;
    color: #3498db;
    font-size: 0.9em;
  }

  .tooltip-rarity {
    margin-bottom: 5px;
    font-size: 0.9em;
  }

  .selected-item-area {
    background-color: rgba(0, 0, 0, 0.3);
    border: 1px solid #ffd700;
    border-radius: 5px;
    padding: 15px;
    margin-top: 20px;
  }

  .selected-item-info {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
  }

  .selected-item-icon {
    width: 60px;
    height: 60px;
    object-fit: contain;
  }

  .selected-item-details {
    flex: 1;
  }

  .selected-item-name {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .selected-item-price {
    margin-bottom: 10px;
    color: gold;
  }

  .quantity-control {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .quantity-control input {
    width: 60px;
    padding: 5px;
    background-color: rgba(0, 0, 0, 0.5);
    border: 1px solid #666;
    color: white;
    text-align: center;
  }

  .quantity-control button {
    background-color: #333;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 3px;
  }

  .quantity-control button:hover {
    background-color: #444;
  }

  .total-price {
    font-size: 16px;
    font-weight: bold;
    color: gold;
  }

  .action-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .buy-button,
  .cancel-button {
    padding: 8px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
  }

  .buy-button {
    background-color: #006400;
    color: white;
  }

  .cancel-button {
    background-color: #8b0000;
    color: white;
  }

  .confirm-dialog {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1001;
  }

  .confirm-content {
    background-color: #1a1a2e;
    border: 2px solid #ffd700;
    border-radius: 10px;
    padding: 30px;
    text-align: center;
    max-width: 400px;
    width: 90%;
  }

  .confirm-content p {
    margin-bottom: 20px;
    font-size: 18px;
  }

  .confirm-buttons {
    display: flex;
    gap: 20px;
    justify-content: center;
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

  /* 拉伸手柄 */
  .shop-resize-handle {
    position: absolute;
    right: 6px;
    bottom: 6px;
    width: 20px;
    height: 20px;
    cursor: nwse-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .resize-lines {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .resize-line {
    height: 2px;
    border-radius: 1px;
    background: #ffd700;
    opacity: 1;
    transition: all 0.2s;
  }

  .resize-line:nth-child(1) {
    width: 14px;
    transform: rotate(-45deg);
    transform-origin: right center;
  }

  .resize-line:nth-child(2) {
    width: 10px;
    transform: rotate(-45deg);
    transform-origin: right center;
  }

  .resize-line:nth-child(3) {
    width: 6px;
    transform: rotate(-45deg);
    transform-origin: right center;
  }

  .shop-resize-handle:hover .resize-line {
    background: #ffd700;
    opacity: 1;
  }

  /* 拉伸动画 - 始终显示 */
  .shop-resize-handle .resize-line:nth-child(1) {
    animation: resize-bounce-1 0.6s ease-in-out infinite;
  }

  .shop-resize-handle .resize-line:nth-child(2) {
    animation: resize-bounce-2 0.6s ease-in-out infinite 0.1s;
  }

  .shop-resize-handle .resize-line:nth-child(3) {
    animation: resize-bounce-3 0.6s ease-in-out infinite 0.2s;
  }

  @keyframes resize-bounce-1 {
    0%, 100% { width: 14px; }
    50% { width: 16px; }
  }

  @keyframes resize-bounce-2 {
    0%, 100% { width: 10px; }
    50% { width: 12px; }
  }

  @keyframes resize-bounce-3 {
    0%, 100% { width: 6px; }
    50% { width: 8px; }
  }

  @media (max-width: 768px) {
    .items-grid {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }

    .selected-item-info {
      flex-direction: column;
      align-items: center;
    }
  }
</style>
