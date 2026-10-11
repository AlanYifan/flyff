<!--
  @fileoverview 物品兑换面板组件
  @description 提供项链、戒指、耳环的兑换功能，支持面板拉伸
  @author FLYFF Team
  @version 2.0.0
  @created 2026-02-23
  @updated 2026-04-04 - 重构为珠宝大师风格，添加可拉伸功能
-->
<template>
  <transition name="exchange-modal-fade">
    <div v-if="isVisible" ref="modalContainerRef" class="exchange-modal-container" :style="modalStyle">
      <!-- 头部（可拖拽） -->
      <div class="exchange-modal-header" @pointerdown="startDrag">
        <h2 class="exchange-modal-title">物品兑换</h2>
        <div class="exchange-modal-header-actions">
          <button class="exchange-close-btn" @click="handleClose">×</button>
        </div>
      </div>

      <!-- 主体内容 -->
      <div ref="contentWrapperRef" class="exchange-modal-body-wrapper">
        <div class="exchange-modal-body" :style="contentStyle">
          <!-- 左侧功能菜单 -->
          <div class="exchange-sidebar">
            <div class="exchange-menu-title">兑换类型</div>
            <button
              v-for="type in exchangeTypes"
              :key="type.value"
              class="exchange-menu-item"
              :class="{ active: selectedType === type.value }"
              @click="selectType(type.value)"
            >
              {{ type.label }}
            </button>
          </div>

          <!-- 右侧兑换区域 -->
          <div class="exchange-content">
            <!-- 筛选下拉框 -->
            <div class="exchange-filter">
              <label class="exchange-filter-label">选择物品：</label>
              <select v-model="selectedExchangeId" class="exchange-filter-select">
                <option v-for="option in exchangeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <!-- 兑换列表 -->
            <div v-if="currentExchangeConfig" class="exchange-list">
              <div class="exchange-item">
                <!-- 兑换需求展示 -->
                <div class="exchange-requirements">
                  <template v-for="(req, index) in currentExchangeConfig.requirements" :key="req.itemId">
                    <div class="exchange-material">
                      <div class="exchange-material-info">
                        <img
                          :src="`/pt/item_icon/${req.itemId}.png`"
                          class="exchange-material-icon"
                          @error="handleIconError"
                          @mouseenter="showItemTooltip($event, req.itemId)"
                          @mouseleave="hideItemTooltip"
                          @mousemove="moveItemTooltip"
                        />
                        <span class="exchange-material-name">{{ getItemName(req.itemId) }}</span>
                      </div>
                      <span class="exchange-material-count">×{{ req.count }}</span>
                      <span v-if="checkMaterialAvailable(req)" class="exchange-material-status available">✓</span>
                      <span v-else class="exchange-material-status unavailable">✗</span>
                    </div>
                    <span v-if="index < currentExchangeConfig.requirements.length - 1" class="exchange-plus">+</span>
                  </template>
                </div>

                <!-- 箭头 -->
                <div class="exchange-arrow-center">
                  <span class="exchange-arrow-icon">→</span>
                </div>

                <!-- 目标物品 -->
                <div class="exchange-target">
                  <img
                    :src="`/pt/item_icon/${currentExchangeConfig.targetItemId}.png`"
                    class="exchange-target-icon"
                    @error="handleIconError"
                    @mouseenter="showItemTooltip($event, currentExchangeConfig.targetItemId)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="moveItemTooltip"
                  />
                </div>

                <!-- 兑换按钮 -->
                <button
                  class="exchange-btn"
                  :class="{ disabled: !canExchange }"
                  :disabled="!canExchange || isExchanging"
                  @click="handleExchange"
                >
                  {{ isExchanging ? '兑换中...' : '兑换' }}
                </button>
              </div>
            </div>

            <!-- 空状态提示 -->
            <div v-else class="exchange-empty">
              <p>请选择要兑换的物品</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右下角拉伸指示器 -->
      <div class="exchange-resize-handle" @pointerdown="startResize">
        <div class="resize-lines">
          <span class="resize-line"></span>
          <span class="resize-line"></span>
          <span class="resize-line"></span>
        </div>
      </div>
    </div>
  </transition>

  <!-- 二次确认弹窗 -->
  <transition name="confirm-fade">
    <div v-if="showConfirmDialog" class="confirm-overlay" @click.self="cancelConfirm">
      <transition name="confirm-scale">
        <div v-if="showConfirmDialog" class="confirm-dialog">
          <div class="confirm-title">确认兑换</div>
          <div class="confirm-content">
            <p>确定要兑换 <strong>{{ currentExchangeConfig?.name }}</strong> 吗？</p>
            <p class="confirm-desc">兑换后将消耗以下材料：</p>
            <div class="confirm-materials">
              <div v-for="req in currentExchangeConfig?.requirements" :key="req.itemId" class="confirm-material-item">
                <img :src="`/pt/item_icon/${req.itemId}.png`" class="confirm-material-icon" @error="handleIconError" />
                <span>{{ getItemName(req.itemId) }} ×{{ req.count }}</span>
              </div>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" @click="cancelConfirm">取消</button>
            <button class="confirm-btn confirm" @click="confirmExchange">确定</button>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
/**
 * 兑换面板组件
 * 提供项链、戒指、耳环的兑换功能
 * @file ExchangeModal.vue
 * @generated 2026-02-23
 * @updated 2026-04-04 - 重构为珠宝大师风格，添加可拉伸功能
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store/index'
import { storageService } from '@/services/StorageService'
import {
  EXCHANGE_TYPES,
  EXCHANGE_TYPE_NAMES,
  getExchangeListByType,
  getExchangeOptionsByType,
  getExchangeConfigById
} from '@/data/EXCHANGE_CONFIG.js'

// 面板配置
const DEFAULT_WIDTH = 500
const DEFAULT_HEIGHT = 300
const MIN_WIDTH = 500
const MIN_HEIGHT = 300

// Store
const itemsStore = useItemsStore()
const gameStore = useGameStore()

// 引用
const modalContainerRef = ref(null)
const contentWrapperRef = ref(null)

// 面板尺寸和位置
const panelWidth = ref(DEFAULT_WIDTH)
const panelHeight = ref(DEFAULT_HEIGHT)
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

// 计算缩放比例
const scaleRatio = computed(() => Math.min(panelWidth.value / DEFAULT_WIDTH, panelHeight.value / DEFAULT_HEIGHT))

// 面板样式
const modalStyle = computed(() => ({
  left: `calc(50% - ${panelWidth.value / 2}px + ${panelX.value}px)`,
  top: `calc(50% - ${panelHeight.value / 2}px + ${panelY.value}px)`,
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

// 开始拖拽
const startDrag = (event) => {
  if (event.target.closest('button')) return
  isDragging.value = true
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  dragStartPanelX.value = panelX.value
  dragStartPanelY.value = panelY.value

  document.addEventListener('pointermove', handleDrag)
  document.addEventListener('pointerup', stopDrag)
}

// 处理拖拽移动
const handleDrag = (event) => {
  if (!isDragging.value) return
  const deltaX = event.clientX - dragStartX.value
  const deltaY = event.clientY - dragStartY.value
  panelX.value = dragStartPanelX.value + deltaX
  panelY.value = dragStartPanelY.value + deltaY
}

// 停止拖拽
const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('pointermove', handleDrag)
  document.removeEventListener('pointerup', stopDrag)
}

// 开始拉伸
const startResize = (event) => {
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

// 处理拉伸移动
const handleResize = (event) => {
  if (!isResizing.value) return

  const deltaX = event.clientX - resizeStartX.value
  const deltaY = event.clientY - resizeStartY.value

  // 使用较大的增量来保持等比例缩放
  const deltaAvg = (deltaX + deltaY) / 2

  // 计算宽高比
  const aspectRatio = DEFAULT_WIDTH / DEFAULT_HEIGHT

  let newWidth = resizeStartWidth.value + deltaAvg * 2
  let newHeight = newWidth / aspectRatio

  // 限制最小尺寸
  newWidth = Math.max(MIN_WIDTH, newWidth)
  newHeight = Math.max(MIN_HEIGHT, newHeight)

  // 限制最大尺寸（屏幕的90%）
  const maxWidth = window.innerWidth * 0.9
  const maxHeight = window.innerHeight * 0.9
  newWidth = Math.min(maxWidth, newWidth)
  newHeight = Math.min(maxHeight, newHeight)

  // 等比例缩放
  if (newWidth / newHeight > aspectRatio) {
    newWidth = newHeight * aspectRatio
  } else {
    newHeight = newWidth / aspectRatio
  }

  panelWidth.value = Math.round(newWidth)
  panelHeight.value = Math.round(newHeight)
}

// 停止拉伸
const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('pointermove', handleResize)
  document.removeEventListener('pointerup', stopResize)
}

// Props
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  player: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['close', 'exchange-success', 'play-sfx'])

// 响应式数据
const selectedType = ref(EXCHANGE_TYPES.NECKLACE)
const selectedExchangeId = ref('')
const showConfirmDialog = ref(false)
const isExchanging = ref(false)

// 兑换类型列表
const exchangeTypes = computed(() => {
  return Object.values(EXCHANGE_TYPES).map(type => ({
    value: type,
    label: EXCHANGE_TYPE_NAMES[type]
  }))
})

// 当前类型的兑换选项
const exchangeOptions = computed(() => {
  return getExchangeOptionsByType(selectedType.value)
})

// 当前选中的兑换配置
const currentExchangeConfig = computed(() => {
  if (!selectedExchangeId.value) return null
  return getExchangeConfigById(selectedExchangeId.value)
})

// 检查材料是否充足
const checkMaterialAvailable = (requirement) => {
  const owned = itemsStore.getItemCount(requirement.itemId)
  return owned >= requirement.count
}

// 是否可以兑换（所有材料充足）
const canExchange = computed(() => {
  if (!currentExchangeConfig.value) return false
  return currentExchangeConfig.value.requirements.every(req => checkMaterialAvailable(req))
})

// 获取物品名称
const getItemName = (itemId) => {
  const config = itemsStore.getItemConfig(itemId)
  if (!config) return `物品#${itemId}`
  return typeof config.name === 'string' ? config.name : config.name?.cns || config.name?.en || `物品#${itemId}`
}

// 选择兑换类型
const selectType = (type) => {
  selectedType.value = type
  // 切换类型后默认选中该类型的第一个选项
  const options = getExchangeOptionsByType(type)
  selectedExchangeId.value = options.length > 0 ? options[0].value : ''
}

// 处理图标加载错误
const handleIconError = (event) => {
  event.target.src = '/pt/item_icon/default_item.png'
}

// 显示物品详情面板
const showItemTooltip = (event, itemId) => {
  const itemConfig = itemsStore.getItemConfig(itemId)
  if (!itemConfig) return

  // 构建物品对象
  const item = {
    id: itemId,
    ...itemConfig
  }

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

// 隐藏物品详情面板
const hideItemTooltip = () => {
  const tooltipEvent = new CustomEvent('hide-item-tooltip')
  window.dispatchEvent(tooltipEvent)
}

// 移动物品详情面板位置
const moveItemTooltip = (event) => {
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

// 处理兑换按钮点击
const handleExchange = () => {
  if (!canExchange.value || isExchanging.value) return
  showConfirmDialog.value = true
}

// 取消确认
const cancelConfirm = () => {
  showConfirmDialog.value = false
}

// 确认兑换
const confirmExchange = async () => {
  if (!currentExchangeConfig.value || isExchanging.value) return

  isExchanging.value = true
  showConfirmDialog.value = false

  try {
    // 扣除材料
    for (const req of currentExchangeConfig.value.requirements) {
      const success = itemsStore.removeItemFromBag(req.itemId, req.count)
      if (!success) {
        console.error(`[ExchangeModal] 扣除材料失败: ${req.itemId}`)
        // 发送消息提示
        window.dispatchEvent(new CustomEvent('show-message', {
          detail: { message: '兑换失败：材料不足', type: 'error' }
        }))
        isExchanging.value = false
        return
      }
    }

    // 添加目标物品
    const addSuccess = itemsStore.addItemToBag(currentExchangeConfig.value.targetItemId, 1)
    if (!addSuccess) {
      console.error('[ExchangeModal] 添加目标物品失败')
      window.dispatchEvent(new CustomEvent('show-message', {
        detail: { message: '兑换失败：背包已满', type: 'error' }
      }))
      isExchanging.value = false
      return
    }

    // 同步背包数据到 gameStore
    try {
      if (gameStore?.player) {
        gameStore.player.bag = [...itemsStore.playerBag]
      }
    } catch (e) {
      console.warn('[ExchangeModal] 同步到 gameStore 失败:', e)
    }

    // 派发背包更新事件
    try {
      window.dispatchEvent(new CustomEvent('update-bag-ui'))
    } catch (e) {
      console.warn('[ExchangeModal] 派发背包更新事件失败:', e)
    }

    // 保存到 localStorage 以确保持久化
    try {
      // storageService 已通过 import 导入全局单例
      storageService.savePlayerPatch({ bag: [...itemsStore.playerBag] })
    } catch (e) {
      console.warn('[ExchangeModal] 保存背包数据到 localStorage 失败:', e)
    }

    // 播放获得物品音效
    emit('play-sfx', 'InfGroundPickup.wav')

    // 发送成功消息
    window.dispatchEvent(new CustomEvent('show-message', {
      detail: {
        message: `成功兑换 ${currentExchangeConfig.value.name}`,
        type: 'success'
      }
    }))

    // 触发成功事件
    emit('exchange-success', {
      exchangeId: selectedExchangeId.value,
      targetItemId: currentExchangeConfig.value.targetItemId
    })

    console.log(`[ExchangeModal] 兑换成功: ${currentExchangeConfig.value.name}`)
  } catch (error) {
    console.error('[ExchangeModal] 兑换过程出错:', error)
    window.dispatchEvent(new CustomEvent('show-message', {
      detail: { message: '兑换失败：系统错误', type: 'error' }
    }))
  } finally {
    isExchanging.value = false
  }
}

// 关闭面板
const handleClose = () => {
  emit('close')
}

// 重置面板状态
const resetPanel = () => {
  panelWidth.value = DEFAULT_WIDTH
  panelHeight.value = DEFAULT_HEIGHT
  panelX.value = 0
  panelY.value = 0
}

// 监听面板显示/隐藏状态
watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    // 面板打开时，默认选中第一个项链兑换项（天侍神的生命之源）
    selectedExchangeId.value = 'necklace_1'
    // 重置面板尺寸和位置
    resetPanel()
  } else {
    // 面板关闭时重置状态
    selectedExchangeId.value = ''
    showConfirmDialog.value = false
    isExchanging.value = false
    // 重置拖拽位置
    isDragging.value = false
    isResizing.value = false
  }
}, { immediate: true })

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('pointermove', handleDrag)
  document.removeEventListener('pointerup', stopDrag)
  document.removeEventListener('pointermove', handleResize)
  document.removeEventListener('pointerup', stopResize)
})
</script>

<style scoped>
/* 面板过渡动画 */
.exchange-modal-fade-enter-active,
.exchange-modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.exchange-modal-fade-enter-from,
.exchange-modal-fade-leave-to {
  opacity: 0;
}

/* 确认弹窗过渡动画 */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-scale-enter-active,
.confirm-scale-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.confirm-scale-enter-from,
.confirm-scale-leave-to {
  transform: scale(0.8);
  opacity: 0;
}

/* 主容器 - 珠宝大师风格 */
.exchange-modal-container {
  position: fixed;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 1400;
  user-select: none;
}

/* 头部 */
.exchange-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(90deg, #2a2a4a 0%, #3a3a5a 100%);
  border-radius: 10px 10px 0 0;
  cursor: move;
}

.exchange-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.exchange-modal-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.exchange-close-btn {
  width: 28px;
  height: 28px;
  background: #4a4a6a;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.exchange-close-btn:hover {
  background: #ff4444;
}

/* 主体内容包装器 */
.exchange-modal-body-wrapper {
  flex: 1;
  overflow: hidden;
}

/* 主体内容 */
.exchange-modal-body {
  display: flex;
}

/* 左侧菜单 */
.exchange-sidebar {
  width: 120px;
  background: linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%);
  border-right: 1px solid #3a3a5a;
  display: flex;
  flex-direction: column;
  padding: 8px;
}

.exchange-menu-title {
  font-size: 11px;
  color: #888;
  padding: 6px 0;
  border-bottom: 1px solid #3a3a5a;
  margin-bottom: 6px;
}

.exchange-menu-item {
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 4px;
  background: linear-gradient(90deg, #3a3a5a 0%, #2a2a4a 100%);
  border: 1px solid #4a4a6a;
  border-radius: 6px;
  color: #ccc;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.exchange-menu-item:hover {
  background: linear-gradient(90deg, #4a4a6a 0%, #3a3a5a 100%);
  border-color: #6a6a8a;
}

.exchange-menu-item.active {
  background: linear-gradient(90deg, #ffd700 0%, #ffaa00 100%);
  border-color: #ffdd44;
  color: #1a1a2a;
  font-weight: bold;
}

/* 右侧内容 */
.exchange-content {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 筛选区域 */
.exchange-filter {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #3a3a5a;
}

.exchange-filter-label {
  color: #aaa;
  font-size: 12px;
  white-space: nowrap;
}

.exchange-filter-select {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 12px;
  outline: none;
  cursor: pointer;
  max-width: 200px;
}

.exchange-filter-select:focus {
  border-color: #ffd700;
}

/* 兑换列表 */
.exchange-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.exchange-item {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #3a3a5a;
  border-radius: 8px;
}

/* 兑换需求 */
.exchange-requirements {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.exchange-material {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
}

.exchange-material-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.exchange-material-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.exchange-material-name {
  color: #fff;
  font-size: 9px;
  max-width: 60px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exchange-material-count {
  color: #00ff88;
  font-size: 12px;
  font-weight: bold;
}

.exchange-material-status {
  font-size: 12px;
  font-weight: bold;
}

.exchange-material-status.available {
  color: #4caf50;
}

.exchange-material-status.unavailable {
  color: #f44336;
}

.exchange-plus {
  color: #ffd700;
  font-size: 14px;
  font-weight: bold;
}

/* 箭头 */
.exchange-arrow-center {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}

.exchange-arrow-icon {
  font-size: 18px;
  color: #ffd700;
}

/* 目标物品 */
.exchange-target {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
}

.exchange-target-icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  cursor: pointer;
}

/* 兑换按钮 */
.exchange-btn {
  margin-left: auto;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #4a7c59 0%, #6b9b7a 100%);
  color: #fff;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.exchange-btn:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 124, 89, 0.4);
}

.exchange-btn.disabled {
  background: #3a3a4a;
  color: #6a6a6a;
  cursor: not-allowed;
}

/* 空状态 */
.exchange-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #666;
  font-size: 14px;
}

/* 拉伸手柄 */
.exchange-resize-handle {
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

.exchange-resize-handle:hover .resize-line {
  background: #ffd700;
  opacity: 1;
}

/* 拉伸动画 - 始终显示 */
.exchange-resize-handle .resize-line:nth-child(1) {
  animation: resize-bounce-1 0.6s ease-in-out infinite;
}

.exchange-resize-handle .resize-line:nth-child(2) {
  animation: resize-bounce-2 0.6s ease-in-out infinite 0.1s;
}

.exchange-resize-handle .resize-line:nth-child(3) {
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

/* 确认弹窗 */
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2100;
}

.confirm-dialog {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 12px;
  padding: 16px;
  width: 320px;
  max-width: 90vw;
}

.confirm-title {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 12px;
  text-align: center;
}

.confirm-content {
  color: #fff;
  font-size: 13px;
  line-height: 1.6;
}

.confirm-content strong {
  color: #ffd700;
}

.confirm-desc {
  margin-top: 8px;
  color: #888;
  font-size: 12px;
}

.confirm-materials {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.confirm-material-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  font-size: 12px;
}

.confirm-material-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.confirm-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn.cancel {
  background: #3a3a4a;
  color: #fff;
}

.confirm-btn.cancel:hover {
  background: #4a4a5a;
}

.confirm-btn.confirm {
  background: linear-gradient(135deg, #4a7c59 0%, #6b9b7a 100%);
  color: #fff;
}

.confirm-btn.confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 124, 89, 0.4);
}

/* 进度条背景色和颜色 - 珠宝大师风格 */
/* 如有需要可在兑换过程中添加进度条时使用 */
.progress-bar-background {
  background: #2a2a4a;
}

.progress-bar-fill {
  background: linear-gradient(90deg, #4a90d9 0%, #67b26f 50%, #ffd700 100%);
}
</style>
