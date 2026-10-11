<template>
  <div v-if="show" class="deposit-item-modal">
    <div class="deposit-overlay" @click.self="closeModal"></div>
    <div v-drag="{ handle: '.panel-header' }" class="deposit-panel">
      <!-- 面板头部 -->
      <div class="panel-header">
        <div class="panel-title">选择要存入的物品</div>
        <button class="btn-close" @click="closeModal">×</button>
      </div>

      <!-- 物品网格 -->
      <div class="items-grid">
        <div v-for="(item, index) in filteredBagItems" :key="index" class="item-slot"
          :class="{ selected: selectedItemIndex === index }" @click="selectItem(index)"
          @mouseenter="showItemTooltip($event, item)" @mouseleave="hideItemTooltip" @mousemove="moveTooltip($event)">
          <template v-if="item">
            <img :src="getItemIcon(item)" :alt="getItemName(item)" class="item-icon" @error="handleImageError" />
            <div v-if="(item.currentStack || item.stack) > 1" class="bank-push-stack-count">
              {{ item.currentStack || item.stack }}
            </div>
          </template>
          <div v-else class="empty-slot">空</div>
        </div>
      </div>

      <!-- 数量输入和按钮区域 -->
      <div class="input-area">
        <div class="selected-item-name" :class="{ 'has-item': selectedItem }">
          {{ selectedItem ? getItemName(selectedItem) : '' }}
        </div>
        <input v-model="quantity" type="number" min="1" :max="maxQuantity" class="quantity-input" placeholder="输入数量"
          :disabled="!selectedItem" />
        <button class="btn-deposit" :disabled="!canDeposit" @click="confirmDeposit">存入</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storageService } from '@/services/StorageService'
import { getItemName, getItemIcon } from '@/utils/itemUtils'
import { usePlayer } from '@/composables/usePlayer'
import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'deposit-success'])

const { player } = usePlayer()
const itemsStore = useItemsStore()
const gameStore = useGameStore()
const selectedItemIndex = ref(null)
const quantity = ref(1)

// 过滤背包中非空的物品（使用itemsStore.playerBag确保数据同步）
const filteredBagItems = computed(() => {
  const bag = itemsStore.playerBag || []
  return bag.filter(item => item !== null && item !== undefined)
})

// 当前选中的物品
const selectedItem = computed(() => {
  if (selectedItemIndex.value === null || !filteredBagItems.value[selectedItemIndex.value]) {
    return null
  }
  return filteredBagItems.value[selectedItemIndex.value]
})

// 最大可存入数量
const maxQuantity = computed(() => {
  if (!selectedItem.value) {
    return 1
  }
  return selectedItem.value.currentStack || selectedItem.value.stack || 1
})

// 是否可以存入
const canDeposit = computed(() => {
  return selectedItem.value && quantity.value > 0 && quantity.value <= maxQuantity.value
})

// 选择物品
function selectItem(index) {
  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }

  selectedItemIndex.value = index
  quantity.value = 1 // 重置数量为1
}

// 存入物品
function confirmDeposit() {
  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }

  if (!canDeposit.value) {
    console.log('无法存入物品，参数无效')
    return
  }

  const actualQuantity = parseInt(quantity.value, 10)
  if (actualQuantity <= 0 || actualQuantity > maxQuantity.value) {
    console.log('存入数量无效')
    return
  }

  // 获取当前玩家数据
  // storageService 已通过 import 导入全局单例
  const currentPlayer = storageService.loadPlayerData()
  if (!currentPlayer) {
    console.error('无法获取玩家数据')
    return
  }

  // 检查仓库是否已满
  if (!currentPlayer.bankBag) {
    currentPlayer.bankBag = []
  }

  if (currentPlayer.bankBag.length >= 100) {
    console.log('仓库已满，无法存入更多物品')
    return
  }

  // 获取要存入的物品（使用itemsStore.playerBag）
  const bagItemIndex = itemsStore.playerBag.findIndex(
    item => item && item.id === selectedItem.value.id
  )
  if (bagItemIndex === -1) {
    console.error('背包中找不到指定物品')
    return
  }

  const itemInBag = itemsStore.playerBag[bagItemIndex]

  // 获取物品当前实际数量（currentStack为当前叠加值，stack为最大堆叠数）
  const itemCurrentStack = itemInBag.currentStack || itemInBag.stack || 1

  // 检查数量是否有效
  if (actualQuantity > itemCurrentStack) {
    console.log('存入数量超过物品数量')
    return
  }

  // 创建要存入仓库的物品副本
  // currentStack: 当前叠加值（实际数量）
  // stack: 最大堆叠数（不变）
  const depositItem = {
    ...itemInBag,
    currentStack: actualQuantity
  }

  if (actualQuantity < itemCurrentStack) {
    // 如果存入数量小于当前数量，则分割物品
    // 修改背包中的原物品数量
    itemInBag.currentStack = itemCurrentStack - actualQuantity
  } else {
    // 如果全部存入，则从背包中移除物品
    itemsStore.playerBag.splice(bagItemIndex, 1)
  }

  // 同步更新player.value.bag
  player.value.bag = [...itemsStore.playerBag]

  // 将物品添加到仓库
  const nextBankBag = Array.isArray(currentPlayer.bankBag)
    ? [...currentPlayer.bankBag, depositItem]
    : [depositItem]

  try {
    storageService.savePlayerPatch({
      bankBag: nextBankBag,
      bag: Array.isArray(player.value?.bag) ? [...player.value.bag] : []
    })

    // 同步更新 gameStore.player 中的仓库和背包数据，防止其他保存操作覆盖
    if (gameStore.player) {
      gameStore.player.bankBag = nextBankBag
      gameStore.player.bag = [...itemsStore.playerBag]
    }
  } catch (error) {
    console.error('[DepositItemModal] 保存玩家数据失败:', error)
  }

  // 派发背包更新事件，通知其他组件刷新UI
  try {
    const updateBagEvent = new CustomEvent('update-bag-ui')
    window.dispatchEvent(updateBagEvent)
  } catch (error) {
    console.error('[DepositItemModal] 派发 update-bag-ui 事件失败:', error)
  }

  // 通知父组件存入成功
  emit('deposit-success', {
    itemIndex: selectedItemIndex.value,
    item: selectedItem.value,
    quantity: actualQuantity
  })

  // 重置状态
  selectedItemIndex.value = null
  quantity.value = 1
}

// 关闭模态框
function closeModal() {
  hideItemTooltip()
  emit('close')

  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }
}

// 显示物品提示
function showItemTooltip(event, item) {
  if (!item) return

  const tooltipEvent = new CustomEvent('show-item-tooltip', {
    detail: {
      item,
      position: { x: event.clientX, y: event.clientY },
      source: 'deposit-item-modal'
    }
  })
  window.dispatchEvent(tooltipEvent)
}

// 隐藏物品提示
function hideItemTooltip() {
  const tooltipEvent = new CustomEvent('hide-item-tooltip')
  window.dispatchEvent(tooltipEvent)
}

// 移动提示
function moveTooltip(event) {
  const tooltipEvent = new CustomEvent('move-item-tooltip', {
    detail: {
      position: { x: event.clientX, y: event.clientY }
    }
  })
  window.dispatchEvent(tooltipEvent)
}

// 处理图片加载错误
function handleImageError(event) {
  event.target.src = '/pt/item_icon/default.png' // 默认图标
}

// 键盘事件监听
function handleKeydown(event) {
  if (event.key === 'Escape' && props.show) {
    closeModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.deposit-item-modal {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.deposit-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
}

.deposit-panel {
  width: 400px;
  height: 300px;
  background: #000000;
  border-radius: 10px;
  /* border: gold 2px solid; */
  z-index: 10001;
  /* box-shadow: 0 0 30px rgba(0, 191, 255, 0.3), 0 8px 32px rgba(0, 0, 0, 0.3); */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.panel-header {
  background-color: #0f0f1a;
  padding: 8px 12px;
  border-bottom: 1px solid #ffd700;
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  color: #ffd700;
  font-weight: bold;
  font-size: 14px;
}

.btn-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.btn-close:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.items-grid {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  scrollbar-color: #ffd700 #000000;
  scrollbar-width: thin;
}

.items-grid::-webkit-scrollbar {
  width: 8px;
}

.items-grid::-webkit-scrollbar-track {
  background: #000000;
  border-radius: 4px;
}

.items-grid::-webkit-scrollbar-thumb {
  background: #ffd700;
  border-radius: 4px;
}

.items-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.85);
}

.item-slot {
  width: 35px;
  height: 35px;
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #444;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.item-slot:hover {
  border-color: #00bfff;
  background: rgba(0, 191, 255, 0.1);
}

.item-slot.selected {
  border: 1px solid #ffd700;
  background: rgba(255, 215, 0, 0.15);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.5), inset 0 0 8px rgba(255, 215, 0, 0.1);
}

.item-icon {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.bank-push-stack-count {
  position: absolute;
  bottom: 35px;
  right: 0px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 1px 3px;
  border-radius: 3px;
  font-size: 10px;
  z-index: 9;
}

.empty-slot {
  color: #666;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-area {
  padding: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  border-top: 1px solid #444;
  background-color: rgba(0, 0, 0, 0.3);
}

.selected-item-name {
  min-width: 80px;
  max-width: 120px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #444;
  border-radius: 3px;
  color: #666;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.selected-item-name.has-item {
  color: #ffd700;
  border-color: #555;
}

.quantity-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #444;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
}

.quantity-input:focus {
  outline: none;
  border-color: #00bfff;
}

.btn-deposit {
  padding: 8px 15px;
  background-color: #006400;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  min-width: 60px;
}

.btn-deposit:hover:not(:disabled) {
  background-color: #008000;
}

.btn-deposit:disabled {
  background-color: #555;
  cursor: not-allowed;
}
</style>
