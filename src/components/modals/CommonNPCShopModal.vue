<template>
  <div ref="modalContainerRef" class="modal-container" :style="modalStyle">
    <div class="modal-header" @pointerdown="startDrag">
      <div class="npc-info">
        <img :src="npcAvatar" :alt="npcName" class="npc-avatar" draggable="false" />
        <h2>{{ npcName }}</h2>
      </div>
      <div class="header-actions">
        <slot name="extra-buttons"></slot>
        <button class="close-button" @click="closeModal">×</button>
      </div>
    </div>

      <!-- 对话区域 -->
      <div class="dialog-area">
        {{ npcDialog }}
      </div>

      <!-- 物品网格 -->
      <div class="items-grid">
        <!-- 加载提示 -->
        <div v-if="isLoading" class="loading-message">加载商品中...</div>

        <!-- 物品列表 -->
        <div
          v-for="(item, index) in shopItems"
          :key="index"
          class="item-slot"
          @click="selectItem(item)"
          @mouseenter="showItemTooltip($event, item)"
          @mouseleave="hideItemTooltip"
          @mousemove="moveItemTooltip"
        >
          <img :src="getItemIcon(item)" :alt="item.name" class="item-icon" />
          <div class="item-name" :style="{ color: getRarityColor(item.rarity) }">
            {{ getItemDisplayName(item) }}
          </div>
          <div class="item-price">{{ getItemPrice(item) }} Penya</div>
          <div v-if="getItemDescription(item)" class="item-description">
            {{ getItemShortDescription(item) }}
          </div>
          <!-- 物品额外信息插槽 -->
          <slot name="item-extra-info" :item="item"></slot>
        </div>
      </div>

      <!-- 选定物品区域 -->
      <div v-if="selectedItem" class="selected-item-area">
        <h3>购买物品</h3>
        <div class="selected-item-info">
          <img
            :src="getItemIcon(selectedItem)"
            :alt="selectedItem.name"
            class="selected-item-icon"
          />
          <div class="selected-item-details">
            <div class="selected-item-name">{{ selectedItem.name }}</div>
            <div class="selected-item-price">单价: {{ getItemPrice(selectedItem) }} Penya</div>
            <div class="quantity-control">
              <label>数量:</label>
              <input
                v-model.number="quantity"
                type="number"
                min="1"
                :max="maxStack"
                @input="validateQuantity"
              />
              <button @click="increaseQuantity">+</button>
              <button @click="decreaseQuantity">-</button>
            </div>
            <div class="total-price">总价: {{ totalPrice }} Penya</div>
          </div>
        </div>
        <div class="action-buttons">
          <button class="buy-button" @click="confirmPurchase">购买</button>
          <button class="cancel-button" @click="cancelSelection">取消</button>
        </div>
      </div>

      <!-- 购买确认对话框 -->
      <div v-if="showConfirmDialog" class="confirm-dialog">
        <div class="confirm-content">
          <p>确定要购买 {{ quantity }} 个 {{ selectedItem.name }} 吗？</p>
          <p>总价: {{ totalPrice }} Penya</p>
          <div class="confirm-buttons">
            <button @click="performPurchase">确认</button>
            <button @click="cancelPurchase">取消</button>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
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
    default: item => item.price || item.sellPrice || 0
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
  }
})

const itemsStore = useItemsStore()

// Emits
const emit = defineEmits(['close', 'purchase', 'item-selected'])

// Reactive data
const selectedItem = ref(null)
const quantity = ref(1)
const showConfirmDialog = ref(false)
const isLoading = ref(false)
const modalContainerRef = ref(null)
const modalPosition = ref(null)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

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

const maxStack = computed(() => {
  return selectedItem.value ? selectedItem.value.stack || 1 : 1
})

const totalPrice = computed(() => {
  if (!selectedItem.value) {
    return 0
  }
  const basePrice = props.priceCalculator(selectedItem.value)
  return Math.round(basePrice * quantity.value)
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
}

const selectItem = item => {
  selectedItem.value = item
  quantity.value = 1
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

// 获取物品描述
const getItemDescription = item => {
  return props.descriptionFormatter(item)
}

// 获取物品短描述
const getItemShortDescription = item => {
  const desc = props.descriptionFormatter(item)
  return desc.length > 15 ? desc.substring(0, 15) + '...' : desc
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
  // 创建tooltip元素
  let tooltip = document.getElementById('item-tooltip')
  if (!tooltip) {
    tooltip = document.createElement('div')
    tooltip.id = 'item-tooltip'
    tooltip.className = 'item-tooltip'
    document.body.appendChild(tooltip)
  }

  // 构建tooltip内容
  let content = `<div class="tooltip-header">${item.name}</div>`

  const description = props.descriptionFormatter(item)
  if (description) {
    content += `<div class="tooltip-description">${description}</div>`
  }

  if (item.level) {
    content += `<div class="tooltip-level">等级: ${item.level}</div>`
  }

  if (item.abilities && item.abilities.length > 0) {
    content += '<div class="tooltip-abilities">'
    item.abilities.forEach(ability => {
      if (ability.add) {
        content += `<div>恢复: ${ability.add}</div>`
      }
    })
    content += '</div>'
  }

  if (item.rarity) {
    content += `<div class="tooltip-rarity">品质: ${props.rarityNames[item.rarity] || item.rarity}</div>`
  }

  tooltip.innerHTML = content

  // 设置tooltip位置
  tooltip.style.display = 'block'
  tooltip.style.left = event.pageX + 10 + 'px'
  tooltip.style.top = event.pageY + 10 + 'px'
}

const hideItemTooltip = () => {
  const tooltip = document.getElementById('item-tooltip')
  if (tooltip) {
    tooltip.style.display = 'none'
  }
}

// 移动tooltip位置
const moveItemTooltip = event => {
  const tooltip = document.getElementById('item-tooltip')
  if (tooltip) {
    tooltip.style.left = event.pageX + 10 + 'px'
    tooltip.style.top = event.pageY + 10 + 'px'
  }
}

const increaseQuantity = () => {
  if (quantity.value < maxStack.value) {
    quantity.value++
  }
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

const validateQuantity = () => {
  if (quantity.value < 1) {
    quantity.value = 1
  } else if (quantity.value > maxStack.value) {
    quantity.value = maxStack.value
  }
}

const confirmPurchase = () => {
  showConfirmDialog.value = true
}

const cancelSelection = () => {
  selectedItem.value = null
  quantity.value = 1
}

const cancelPurchase = () => {
  showConfirmDialog.value = false
}

const performPurchase = () => {
  // 检查背包空间是否足够
  const item = selectedItem.value
  const quantityToBuy = quantity.value

  // 计算需要的背包格子数
  const maxStack = item.stack || 1
  const requiredSlots = Math.ceil(quantityToBuy / maxStack)

  // 发送购买请求到父组件
  emit('purchase', {
    item: selectedItem.value,
    quantity: quantity.value,
    totalPrice: totalPrice.value,
    requiredSlots
  })

  // 重置状态
  showConfirmDialog.value = false
  selectedItem.value = null
  quantity.value = 1
}
</script>

<style scoped>
  .modal-container {
    background-color: #000000;
    border-radius: 10px;
    padding: 20px;
    width: 800px;
    height: 600px;
    min-width: 520px;
    min-height: 420px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
    color: white;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    resize: both;
    box-sizing: border-box;
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
    background-color: #000000;
    touch-action: none;
  }

  .modal-header h2 {
    margin: 0;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
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
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 2px solid #ffd700;
  }

  .close-button {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
  }

  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .dialog-area {
    background-color: rgba(0, 0, 0, 0.5);
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
    text-align: center;
    font-size: 16px;
    line-height: 1.5;
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

  /* Tooltip样式 */
  .item-tooltip {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.9);
    border: 1px solid #ffd700;
    border-radius: 5px;
    padding: 10px;
    color: white;
    font-size: 12px;
    z-index: 10000;
    min-width: 200px;
    max-width: 300px;
    pointer-events: none;
  }

  .tooltip-header {
    font-weight: bold;
    font-size: 14px;
    color: #ffd700;
    margin-bottom: 5px;
  }

  .tooltip-description {
    margin-bottom: 5px;
    color: #ccc;
  }

  .tooltip-level {
    margin-bottom: 3px;
  }

  .tooltip-abilities {
    margin-bottom: 5px;
  }

  .tooltip-rarity {
    margin-bottom: 3px;
    color: #ffd700;
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
    background-color: #8B0000;
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
    background-color: #8B0000;
    color: white;
  }
 
  @media (max-width: 768px) {
    .items-grid {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }

    .selected-item-info {
      flex-direction: column;
      align-items: center;
    }

    .loading-message {
      font-size: 14px;
    }
  }
}
</style>
