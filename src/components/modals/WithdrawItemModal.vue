<template>
  <div v-if="show" class="withdraw-item-modal">
    <div class="withdraw-overlay" @click.self="closeModal"></div>
    <div v-drag="{ handle: '.panel-header' }" class="withdraw-panel">
      <!-- 面板头部 -->
      <div class="panel-header">
        <div class="panel-title">选择要取出的物品</div>
        <button class="btn-close" @click="closeModal">×</button>
      </div>

      <!-- 物品网格 -->
      <div class="items-grid">
        <div
          v-for="(item, index) in bankItems"
          :key="index"
          class="item-slot"
          :class="{ selected: selectedIndex === index }"
          @click="selectItem(index)"
          @mouseenter="showItemTooltip($event, item)"
          @mouseleave="hideItemTooltip"
          @mousemove="moveTooltip($event)"
        >
          <template v-if="item">
            <img
              :src="getItemIcon(item)"
              :alt="getItemName(item)"
              class="item-icon"
              @error="handleImageError"
            />
            <div v-if="(item.currentStack || item.stack) > 1" class="bank-stack-count">
              {{ item.currentStack || item.stack }}
            </div>
            <div class="bank-item-name">{{ getItemName(item) }}</div>
          </template>
          <div v-else class="empty-slot">空</div>
        </div>
        <div v-if="bankItems.length === 0" class="empty-bank">
          仓库是空的
        </div>
      </div>

      <!-- 数量输入和按钮区域 -->
      <div class="input-area">
        <input
          v-model="quantity"
          type="number"
          min="1"
          :max="maxQuantity"
          class="quantity-input"
          placeholder="输入数量"
          :disabled="!selectedItem"
        />
        <button class="btn-withdraw" :disabled="!canWithdraw" @click="confirmWithdraw">取出</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 从仓库取出物品模态框
 * @file WithdrawItemModal.vue
 * @description 提供从仓库取出物品到背包的功能
 * @generated 2026-02-17
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { storageService } from '@/services/StorageService'
import { getItemName, getItemIcon } from '@/utils/itemUtils'
import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'withdraw-success'])

const itemsStore = useItemsStore()
const gameStore = useGameStore()
const selectedIndex = ref(null)
const quantity = ref(1)
const bankItems = ref([])

// 当前选中的物品
const selectedItem = computed(() => {
  if (selectedIndex.value === null || !bankItems.value[selectedIndex.value]) {
    return null
  }
  return bankItems.value[selectedIndex.value]
})

// 最大可取出数量
const maxQuantity = computed(() => {
  if (!selectedItem.value) {
    return 1
  }
  return selectedItem.value.currentStack || selectedItem.value.stack || 1
})

// 是否可以取出
const canWithdraw = computed(() => {
  return selectedItem.value && quantity.value > 0 && quantity.value <= maxQuantity.value
})

// 加载仓库数据
function loadBankData () {
  // storageService 已通过 import 导入全局单例
  const player = storageService.loadPlayerData()
  if (player) {
    const rawBankBag = player.bankBag || []
    bankItems.value = rawBankBag.filter(item => item !== null && item !== undefined)
  }
}

// 选择物品
function selectItem (index) {
  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }

  selectedIndex.value = index
  quantity.value = 1 // 重置数量为1
}

// 取出物品
function confirmWithdraw () {
  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }

  if (!canWithdraw.value) {
    console.log('无法取出物品，参数无效')
    return
  }

  const actualQuantity = parseInt(quantity.value, 10)
  if (actualQuantity <= 0 || actualQuantity > maxQuantity.value) {
    console.log('取出数量无效')
    return
  }

  // 获取当前玩家数据
  // storageService 已通过 import 导入全局单例
  const currentPlayer = storageService.loadPlayerData()
  if (!currentPlayer) {
    console.error('无法获取玩家数据')
    return
  }

  // 获取要取出的物品
  const itemToWithdraw = bankItems.value[selectedIndex.value]
  if (!itemToWithdraw) {
    console.error('未找到要取出的物品')
    return
  }

  // 检查背包是否有空间
  const bagCapacity = itemsStore.bagCapacity
  const usedSlots = itemsStore.playerBag.filter(item => item !== null && item !== undefined).length

  // 检查是否可以添加到背包
  if (usedSlots >= bagCapacity) {
    // 背包已满，检查是否可以堆叠
    const existingItem = itemsStore.playerBag.find(
      item => item && item.id === itemToWithdraw.id
    )
    if (!existingItem) {
      console.log('背包已满，无法取出物品')
      emit('withdraw-success', { success: false, message: '背包已满，无法取出物品' })
      return
    }
  }

  // 获取物品当前实际数量
  const itemCurrentStack = itemToWithdraw.currentStack || itemToWithdraw.stack || 1

  // 创建要取出到背包的物品副本
  const withdrawItem = { ...itemToWithdraw }

  if (actualQuantity < itemCurrentStack) {
    // 如果取出数量小于当前数量，则分割物品
    withdrawItem.currentStack = actualQuantity
    withdrawItem.stack = itemToWithdraw.stack // 保持最大堆叠数不变

    // 修改仓库中的原物品数量
    itemToWithdraw.currentStack = itemCurrentStack - actualQuantity

    // 同步更新到currentPlayer.bankBag中的对应物品
    const itemIndexInBank = (currentPlayer.bankBag || []).findIndex(
      item => item && item.id === itemToWithdraw.id && (item.currentStack || item.stack) === itemCurrentStack
    )
    if (itemIndexInBank !== -1) {
      currentPlayer.bankBag[itemIndexInBank].currentStack = itemCurrentStack - actualQuantity
    }
  } else {
    // 如果全部取出，则从仓库中移除物品
    const itemIndexInBank = (currentPlayer.bankBag || []).findIndex(
      item => item && item.id === itemToWithdraw.id && (item.currentStack || item.stack) === itemCurrentStack
    )
    if (itemIndexInBank !== -1) {
      currentPlayer.bankBag.splice(itemIndexInBank, 1)
    }
  }

  // 添加物品到背包（使用 addItemObjectToBag 保留强化等级等属性）
  const success = itemsStore.addItemObjectToBag(withdrawItem)
  if (!success) {
    console.log('添加到背包失败')
    emit('withdraw-success', { success: false, message: '添加到背包失败' })
    return
  }

  // 更新仓库数据
  const nextBankBag = (currentPlayer.bankBag || []).filter(item => item !== null && item !== undefined)

  try {
    storageService.savePlayerPatch({
      bankBag: nextBankBag,
      bag: [...itemsStore.playerBag]
    })

    // 同步更新 gameStore.player 中的仓库和背包数据，防止其他保存操作覆盖
    if (gameStore.player) {
      gameStore.player.bankBag = nextBankBag
      gameStore.player.bag = [...itemsStore.playerBag]
    }
  } catch (error) {
    console.error('[WithdrawItemModal] 保存玩家数据失败:', error)
  }

  // 通知父组件取出成功
  emit('withdraw-success', {
    success: true,
    item: selectedItem.value,
    quantity: actualQuantity
  })

  // 重新加载仓库数据
  loadBankData()

  // 重置状态
  selectedIndex.value = null
  quantity.value = 1
}

// 显示物品提示
function showItemTooltip (event, item) {
  if (!item) return

  const tooltipEvent = new CustomEvent('show-item-tooltip', {
    detail: {
      item,
      position: { x: event.clientX, y: event.clientY },
      source: 'withdraw-item-modal'
    }
  })
  window.dispatchEvent(tooltipEvent)
}

// 隐藏物品提示
function hideItemTooltip () {
  const tooltipEvent = new CustomEvent('hide-item-tooltip')
  window.dispatchEvent(tooltipEvent)
}

// 移动提示
function moveTooltip (event) {
  const tooltipEvent = new CustomEvent('move-item-tooltip', {
    detail: {
      position: { x: event.clientX, y: event.clientY }
    }
  })
  window.dispatchEvent(tooltipEvent)
}

// 关闭模态框
function closeModal () {
  hideItemTooltip()
  emit('close')

  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }
}

// 处理图片加载错误
function handleImageError (event) {
  event.target.src = '/pt/item_icon/default_item.png'
}

// 键盘事件监听
function handleKeydown (event) {
  if (event.key === 'Escape' && props.show) {
    closeModal()
  }
}

// 监听show属性变化
watch(() => props.show, (newShow) => {
  if (newShow) {
    loadBankData()
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  if (props.show) {
    loadBankData()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 暴露方法供父组件调用
defineExpose({
  refresh: () => {
    loadBankData()
  }
})
</script>

<style scoped>
.withdraw-item-modal {
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

.withdraw-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
}

.withdraw-panel {
  width: 450px;
  height: 400px;
  background: #000000;
  border-radius: 10px;
  /* border: gold 2px solid; */
  z-index: 10001;
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
  gap: 10px;
  align-content: start;
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
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
  border: 2px solid #444;
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
  border: 2px solid #ffd700;
  background: rgba(255, 215, 0, 0.15);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.5), inset 0 0 8px rgba(255, 215, 0, 0.1);
}

.item-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.bank-stack-count {
  position: absolute;
  bottom: 45px;
  right:3px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 1px 3px;
  border-radius: 3px;
  font-size: 10px;
}

.bank-item-name {
  position: absolute;
  bottom: 3px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 8px;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 1px;
}

.empty-slot {
  color: #666;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-bank {
  grid-column: 1 / -1;
  text-align: center;
  color: #666;
  padding: 40px;
  font-size: 14px;
}

.input-area {
  padding: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  border-top: 1px solid #444;
  background-color: rgba(0, 0, 0, 0.3);
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

.btn-withdraw {
  padding: 8px 15px;
  background-color: #8b0000;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  min-width: 60px;
}

.btn-withdraw:hover:not(:disabled) {
  background-color: #a00000;
}

.btn-withdraw:disabled {
  background-color: #555;
  cursor: not-allowed;
}
</style>
