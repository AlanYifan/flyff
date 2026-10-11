<template>
  <transition name="decompose-modal-fade">
    <div v-if="isVisible" ref="modalContainerRef" class="decompose-modal-container" :style="modalStyle" :class="{ resizing: isResizing }">
          <!-- 头部（可拖拽） -->
          <div class="decompose-modal-header" @pointerdown="startDrag">
            <div class="decompose-title-wrapper">
              <h2 class="decompose-modal-title">首饰分解</h2>
              <!-- ?号按钮（贴合标题） -->
              <button class="decompose-help-btn" @click.stop="toggleRulesPanel" :class="{ active: showRulesPanel }">
                ?
              </button>
            </div>
            <button class="decompose-close-btn" @click="handleClose">×</button>
          </div>

          <!-- 主体内容 -->
          <div class="decompose-modal-body">
            <!-- 左侧功能菜单 -->
            <div class="decompose-sidebar">
              <div class="decompose-menu-title">功能</div>
              <button
                class="decompose-menu-item active"
              >
                分解
              </button>
            </div>

            <!-- 右侧分解区域 -->
            <div class="decompose-content">
              <!-- 选择分解装备面板 -->
              <div class="decompose-section">
                <div class="decompose-section-title">选择分解装备</div>
                <div class="decompose-filter">
                  <label class="decompose-filter-label">首饰类型：</label>
                  <select v-model="selectedJewelryType" class="decompose-filter-select">
                    <option value="all">全部首饰</option>
                    <option value="ring">戒指</option>
                    <option value="necklace">项链</option>
                    <option value="earring">耳环</option>
                  </select>
                  <label class="decompose-filter-label" style="margin-left: 16px;">稀有度：</label>
                  <select v-model="selectedRarity" class="decompose-filter-select">
                    <option value="all">全部稀有度</option>
                    <option value="ultimate">终极首饰</option>
                  </select>
                </div>

                <!-- 可分解首饰列表 -->
                <div class="decompose-item-list">
                  <div v-if="filteredJewelryItems.length === 0" class="decompose-empty">
                    没有可分解的首饰
                  </div>
                  <div
                    v-for="item in filteredJewelryItems"
                    :key="item.uniqueId || item.id"
                    class="decompose-item-slot"
                    :class="{ selected: selectedItem?.uniqueId === item.uniqueId }"
                    @click="selectItem(item)"
                    @mouseenter="showItemTooltip($event, item)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="moveItemTooltip"
                  >
                    <img
                      :src="getItemIcon(item)"
                      class="decompose-item-icon"
                      @error="handleIconError"
                    />
                    <div class="decompose-item-info">
                      <div class="decompose-item-name" :style="{ color: getRarityColor(item.rarity) }">
                        {{ getItemName(item) }}
                      </div>
                      <div v-if="item.enhanceLevel > 0" class="decompose-item-enhance">
                        +{{ item.enhanceLevel }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 分解产出结果区域 -->
              <div class="decompose-section">
                <div class="decompose-section-title">分解产出</div>
                <div class="decompose-result-area">
                  <div v-if="!selectedItem" class="decompose-result-empty">
                    请选择要分解的首饰
                  </div>
                  <div v-else-if="!canDecompose" class="decompose-result-error">
                    {{ decomposeErrorReason }}
                  </div>
                  <div v-else class="decompose-result-list">
                    <div
                      v-for="result in decomposeResults"
                      :key="result.itemId"
                      class="decompose-result-item"
                    >
                      <img
                        :src="`/pt/item_icon/${result.itemId}.png`"
                        class="decompose-result-icon"
                        @error="handleIconError"
                        @mouseenter="showItemTooltipById($event, result.itemId)"
                        @mouseleave="hideItemTooltip"
                        @mousemove="moveItemTooltip"
                      />
                      <div class="decompose-result-info">
                        <div class="decompose-result-name">{{ getItemNameById(result.itemId) }}</div>
                        <div class="decompose-result-count">×{{ formatNumber(result.count) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="decompose-actions">
                <button
                  class="decompose-btn"
                  :class="{ disabled: !canDecompose }"
                  :disabled="!canDecompose || isDecomposing"
                  @click="handleDecompose"
                >
                  {{ isDecomposing ? '分解中...' : '分解' }}
                </button>
                <button class="reset-btn" @click="handleReset">
                  重置
                </button>
              </div>
            </div>
          </div>

          <!-- 右下角拉伸指示器 -->
          <div class="decompose-resize-handle" @pointerdown="startResize">
            <div class="resize-lines">
              <span class="resize-line"></span>
              <span class="resize-line"></span>
              <span class="resize-line"></span>
            </div>
          </div>
      </div>
    </transition>

  <!-- 分解规则面板 -->
  <transition name="rules-panel-fade">
    <div
      v-if="showRulesPanel && isVisible"
      class="decompose-rules-panel"
      :style="rulesPanelStyle"
    >
      <div class="rules-panel-header">
        <h3 class="rules-panel-title">分解规则</h3>
        <button class="rules-panel-close" @click="showRulesPanel = false">×</button>
      </div>
      <div class="rules-panel-body">
        <!-- 根据选中物品显示不同规则 -->
        
        <!-- 终极首饰规则：选中终极首饰时只显示终极首饰规则 -->
        <div class="rules-section" v-if="selectedItem && isUltimateItem(selectedItem)">
          <div class="rules-section-title">
            终极首饰：{{ getItemName(selectedItem) }}
          </div>
          <div class="rules-table-wrapper">
            <table class="rules-table">
              <thead>
                <tr>
                  <th>强化等级</th>
                  <th>首饰粉尘</th>
                  <th>被诅咒的首饰碎片</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rule in ultimateJewelryRules" :key="rule.level">
                  <td>+{{ rule.level }}</td>
                  <td>{{ formatNumber(rule.dust) }}</td>
                  <td>{{ formatNumber(rule.fragment) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 普通首饰规则：未选中物品或选中普通首饰时显示 -->
        <div class="rules-section" v-if="!selectedItem || !isUltimateItem(selectedItem)">
          <div class="rules-section-title">普通首饰（强化+8以上）</div>
          <div class="rules-table-wrapper">
            <table class="rules-table">
              <thead>
                <tr>
                  <th>强化等级</th>
                  <th>首饰粉尘</th>
                  <th>被诅咒的首饰碎片</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rule in normalJewelryRules" :key="rule.level">
                  <td>+{{ rule.level }}</td>
                  <td>{{ rule.dust }}</td>
                  <td>{{ rule.fragment }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 说明 -->
        <div class="rules-note">
          <template v-if="selectedItem && isUltimateItem(selectedItem)">
            <p>终极首饰根据物品自身dismantle字段决定分解产出</p>
            <p>分解后物品将消失，此操作不可撤销</p>
          </template>
          <template v-else>
            <p>普通首饰需要强化至+8以上才能分解</p>
            <p>分解后物品将消失，此操作不可撤销</p>
          </template>
        </div>
      </div>
    </div>
  </transition>

  <!-- 二次确认弹窗 -->
  <transition name="confirm-fade">
    <div v-if="showConfirmDialog" class="confirm-overlay" @click.self="cancelConfirm">
      <transition name="confirm-scale">
        <div v-if="showConfirmDialog" class="confirm-dialog">
          <div class="confirm-title">确认分解</div>
          <div class="confirm-content">
            <p>确定要分解 <strong :style="{ color: getRarityColor(selectedItem?.rarity) }">{{ getItemName(selectedItem) }}</strong> 吗？</p>
            <p class="confirm-desc">分解后将获得以下物品：</p>
            <div class="confirm-materials">
              <div v-for="result in decomposeResults" :key="result.itemId" class="confirm-material-item">
                <img :src="`/pt/item_icon/${result.itemId}.png`" class="confirm-material-icon" @error="handleIconError" />
                <span>{{ getItemNameById(result.itemId) }} ×{{ formatNumber(result.count) }}</span>
              </div>
            </div>
            <p class="confirm-warning">⚠️ 此操作不可撤销</p>
          </div>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" @click="cancelConfirm">取消</button>
            <button class="confirm-btn confirm" @click="confirmDecompose">确定</button>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
/**
 * 分解面板组件
 * 提供首饰分解功能，根据强化等级产出不同材料
 * 支持终极首饰使用dismantle字段配置的分解规则
 * @file DecomposeModal.vue
 * @generated 2026-02-23
 */
import { ref, computed, watch } from 'vue'
import {
  canDecomposeItem,
  getNormalJewelryDecomposeResult,
  getUltimateJewelryDecomposeResult,
  getUltimateJewelryAllDecomposeResults,
  getDecomposeResult,
  checkDecomposeCondition,
  isUltimateJewelry,
  DECOMPOSE_OUTPUT_ITEMS
} from '@/data/DECOMPOSE_CONFIG.js'
import { useItemsStore } from '@/store/items'

// =============== 拖拽相关变量 ===============
const modalContainerRef = ref(null)
const modalPosition = ref(null)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// =============== 拉伸相关变量 ===============
const isResizing = ref(false)
const modalSize = ref({ width: 500, height: 450 })
const resizeStartSize = ref({ width: 0, height: 0 })
const resizeStartPos = ref({ x: 0, y: 0 })
const MIN_WIDTH = 500
const MIN_HEIGHT = 450

// =============== 规则面板相关 ===============
const showRulesPanel = ref(false)

// 计算面板样式
const modalStyle = computed(() => {
  const style = {
    width: `${modalSize.value.width}px`,
    height: `${modalSize.value.height}px`
  }

  if (modalPosition.value) {
    style.top = `${modalPosition.value.y}px`
    style.left = `${modalPosition.value.x}px`
    style.transform = 'none'
  }

  return style
})

// 规则面板样式（定位在分解面板右侧）
const rulesPanelStyle = computed(() => {
  // 使用modalPosition计算位置，确保拖拽时同步移动
  let left, top
  
  if (modalPosition.value) {
    // 已拖拽过，使用保存的位置
    left = modalPosition.value.x + modalSize.value.width + 4
    top = modalPosition.value.y
  } else if (modalContainerRef.value) {
    // 未拖拽过，使用getBoundingClientRect获取当前位置
    const rect = modalContainerRef.value.getBoundingClientRect()
    left = rect.right + 4
    top = rect.top
  } else {
    return {}
  }

  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    maxHeight: `${modalSize.value.height}px`
  }
})

// 获取事件坐标
const getClientPoint = (event) => {
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

// =============== 拖拽逻辑 ===============
const endDrag = () => {
  if (!isDragging.value) {
    return
  }
  isDragging.value = false
  window.removeEventListener('pointermove', handleDragMove)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
}

const handleDragMove = (event) => {
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

const startDrag = (event) => {
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

// =============== 拉伸逻辑 ===============
const startResize = (event) => {
  if (event.button !== undefined && event.button !== 0) {
    return
  }
  event.preventDefault()
  event.stopPropagation()

  resizeStartSize.value = { ...modalSize.value }
  resizeStartPos.value = { x: event.clientX, y: event.clientY }
  isResizing.value = true

  window.addEventListener('pointermove', handleResizeMove)
  window.addEventListener('pointerup', endResize)
  window.addEventListener('pointercancel', endResize)
}

const handleResizeMove = (event) => {
  if (!isResizing.value) {
    return
  }

  const deltaX = event.clientX - resizeStartPos.value.x
  const deltaY = event.clientY - resizeStartPos.value.y

  const newWidth = Math.max(MIN_WIDTH, resizeStartSize.value.width + deltaX)
  const newHeight = Math.max(MIN_HEIGHT, resizeStartSize.value.height + deltaY)

  // 确保不超出屏幕边界
  const containerEl = modalContainerRef.value
  if (containerEl) {
    const rect = containerEl.getBoundingClientRect()
    const maxX = window.innerWidth - rect.left
    const maxY = window.innerHeight - rect.top

    modalSize.value = {
      width: Math.min(newWidth, maxX),
      height: Math.min(newHeight, maxY)
    }
  } else {
    modalSize.value = { width: newWidth, height: newHeight }
  }
}

const endResize = () => {
  if (!isResizing.value) {
    return
  }
  isResizing.value = false
  window.removeEventListener('pointermove', handleResizeMove)
  window.removeEventListener('pointerup', endResize)
  window.removeEventListener('pointercancel', endResize)
}

// 切换规则面板显示
const toggleRulesPanel = () => {
  showRulesPanel.value = !showRulesPanel.value
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
const emit = defineEmits(['close', 'decompose-success', 'play-sfx', 'add-battle-log', 'show-animation-message'])

// Store
const itemsStore = useItemsStore()

// 响应式数据
const selectedJewelryType = ref('all')
const selectedRarity = ref('all')
const selectedItem = ref(null)
const showConfirmDialog = ref(false)
const isDecomposing = ref(false)

// 获取背包中的首饰物品
const jewelryItems = computed(() => {
  const bag = itemsStore.playerBag || []
  return bag.filter(item => canDecomposeItem(item))
})

// 根据筛选条件过滤首饰
const filteredJewelryItems = computed(() => {
  return jewelryItems.value.filter(item => {
    // 筛选首饰类型
    if (selectedJewelryType.value !== 'all') {
      const subcategory = String(item.subcategory || '').toLowerCase()
      if (subcategory !== selectedJewelryType.value) {
        return false
      }
    }

    // 筛选稀有度
    if (selectedRarity.value !== 'all') {
      const rarity = String(item.rarity || '').toLowerCase()
      if (rarity !== selectedRarity.value) {
        return false
      }
    }

    return true
  })
})

// 分解结果
const decomposeResults = computed(() => {
  if (!selectedItem.value) return []
  
  // 获取完整的物品配置（背包物品可能不包含dismantle字段）
  const itemConfig = itemsStore.getItemConfig(selectedItem.value.id)
  if (itemConfig && itemConfig.dismantle) {
    // 合并物品实例数据和配置数据
    const fullItem = {
      ...itemConfig,
      ...selectedItem.value,
      dismantle: itemConfig.dismantle
    }
    return getDecomposeResult(fullItem)
  }
  
  return getDecomposeResult(selectedItem.value)
})

// 是否可以分解
const canDecompose = computed(() => {
  if (!selectedItem.value) return false
  
  // 获取完整的物品配置
  const itemConfig = itemsStore.getItemConfig(selectedItem.value.id)
  const fullItem = itemConfig ? { ...itemConfig, ...selectedItem.value } : selectedItem.value
  
  const result = checkDecomposeCondition(fullItem)
  return result.canDecompose
})

// 分解失败原因
const decomposeErrorReason = computed(() => {
  if (!selectedItem.value) return ''
  
  // 获取完整的物品配置
  const itemConfig = itemsStore.getItemConfig(selectedItem.value.id)
  const fullItem = itemConfig ? { ...itemConfig, ...selectedItem.value } : selectedItem.value
  
  const result = checkDecomposeCondition(fullItem)
  return result.reason
})

// 判断是否是终极首饰
const isUltimateItem = (item) => {
  return isUltimateJewelry(item)
}

// 普通首饰分解规则表格数据
const normalJewelryRules = computed(() => {
  const rules = []
  for (let level = 8; level <= 20; level++) {
    const result = getNormalJewelryDecomposeResult(level)
    rules.push({
      level,
      dust: result.find(r => r.itemId === DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST)?.count || 0,
      fragment: result.find(r => r.itemId === DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT)?.count || 0
    })
  }
  return rules
})

// 终极首饰分解规则表格数据（当前选中物品）
const ultimateJewelryRulesMap = computed(() => {
  if (!selectedItem.value || !isUltimateItem(selectedItem.value)) {
    return new Map()
  }
  
  // 获取完整的物品配置（背包物品可能不包含dismantle字段）
  const itemConfig = itemsStore.getItemConfig(selectedItem.value.id)
  if (!itemConfig || !itemConfig.dismantle) {
    // 如果物品本身有dismantle字段，直接使用
    if (selectedItem.value.dismantle) {
      return getUltimateJewelryAllDecomposeResults(selectedItem.value)
    }
    return new Map()
  }
  
  // 合并物品实例数据和配置数据
  const fullItem = {
    ...itemConfig,
    ...selectedItem.value,
    dismantle: itemConfig.dismantle
  }
  
  return getUltimateJewelryAllDecomposeResults(fullItem)
})

// 终极首饰分解规则表格数据（转换为与普通首饰相同的格式）
const ultimateJewelryRules = computed(() => {
  const rulesMap = ultimateJewelryRulesMap.value
  if (rulesMap.size === 0) return []
  
  const rules = []
  
  // 按强化等级排序
  const sortedLevels = Array.from(rulesMap.keys()).sort((a, b) => a - b)
  
  sortedLevels.forEach(level => {
    const items = rulesMap.get(level)
    const dustItem = items.find(i => i.itemId === DECOMPOSE_OUTPUT_ITEMS.JEWELRY_DUST)
    const fragmentItem = items.find(i => i.itemId === DECOMPOSE_OUTPUT_ITEMS.CURSED_JEWELRY_FRAGMENT)
    
    rules.push({
      level,
      dust: dustItem?.count || 0,
      fragment: fragmentItem?.count || 0
    })
  })
  
  return rules
})

// 获取物品图标
const getItemIcon = (item) => {
  return `/pt/item_icon/${item.id}.png`
}

// 获取物品名称
const getItemName = (item) => {
  if (!item) return '未知物品'
  if (typeof item.name === 'string') return item.name
  return item.name?.cns || item.name?.en || `物品#${item.id}`
}

// 根据ID获取物品名称
const getItemNameById = (itemId) => {
  const config = itemsStore.getItemConfig(itemId)
  if (!config) return `物品#${itemId}`
  if (typeof config.name === 'string') return config.name
  return config.name?.cns || config.name?.en || `物品#${itemId}`
}

// 获取稀有度颜色
const getRarityColor = (rarity) => {
  return itemsStore.getRarityTextColor(rarity)
}

// 格式化数字（每4位添加逗号）
const formatNumber = (num) => {
  if (!num) return '0'
  return num.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ',')
}

// 选择物品
const selectItem = (item) => {
  selectedItem.value = item
}

// 处理图标加载错误
const handleIconError = (event) => {
  event.target.src = '/pt/item_icon/default_item.png'
}

// 显示物品详情面板
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

// 根据ID显示物品详情面板
const showItemTooltipById = (event, itemId) => {
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

// 处理分解按钮点击
const handleDecompose = () => {
  if (!canDecompose.value || isDecomposing.value) return
  showConfirmDialog.value = true
}

// 取消确认
const cancelConfirm = () => {
  showConfirmDialog.value = false
}

// 确认分解
const confirmDecompose = async () => {
  if (!selectedItem.value || isDecomposing.value) return

  isDecomposing.value = true
  showConfirmDialog.value = false

  try {
    // 移除被分解的物品
    const itemId = selectedItem.value.id
    const uniqueId = selectedItem.value.uniqueId
    
    // 准备分解产物
    const products = decomposeResults.value.filter(r => r.count > 0)
    
    // 使用批量分解方法（一次patch完成移除和添加）
    const result = itemsStore.decomposeItem(itemId, uniqueId, products)

    if (!result.success) {
      console.error('[DecomposeModal] 分解失败:', result.reason)
      window.dispatchEvent(new CustomEvent('show-message', {
        detail: { message: `分解失败：${result.reason}`, type: 'error' }
      }))
      isDecomposing.value = false
      return
    }

    // 播放获得物品音效
    emit('play-sfx', 'InfGroundPickup.wav')

    // 构建获得的物品描述（物品之间用逗号分隔，不带空格）
    const obtainedItems = products.map(p => `${getItemNameById(p.itemId)}*${formatNumber(p.count)}`).join(',')
    const playerName = props.player?.name || '玩家'
    const itemOriginalName = getItemName(selectedItem.value)

    // 发送成功消息
    window.dispatchEvent(new CustomEvent('show-message', {
      detail: {
        message: `成功分解 ${itemOriginalName}`,
        type: 'success'
      }
    }))

    // 添加战斗日志：玩家名称 分解 物品名称 成功,获得物品名称*数量,物品名称*数量
    const logText = `${playerName} 分解 ${itemOriginalName} 成功,获得${obtainedItems}`
    emit('add-battle-log', logText, 'success')

    // 触发分解成功的动画提示
    // 显示获得的所有材料
    if (products.length > 0) {
      for (const product of products) {
        const productIcon = `/pt/item_icon/${product.itemId}.png`
        const productText = `${getItemNameById(product.itemId)}*${formatNumber(product.count)}`
        emit('show-animation-message', productText, 'decompose', productIcon)
      }
    }

    // 触发成功事件
    emit('decompose-success', {
      itemId: selectedItem.value.id,
      uniqueId: selectedItem.value.uniqueId,
      results: decomposeResults.value
    })


    // 重置选择
    selectedItem.value = null
  } catch (error) {
    console.error('[DecomposeModal] 分解过程出错:', error)
    window.dispatchEvent(new CustomEvent('show-message', {
      detail: { message: '分解失败：系统错误', type: 'error' }
    }))
  } finally {
    isDecomposing.value = false
  }
}

// 重置
const handleReset = () => {
  selectedItem.value = null
  selectedJewelryType.value = 'all'
  selectedRarity.value = 'all'
}

// 关闭面板
const handleClose = () => {
  emit('close')
}

// 监听面板显示/隐藏状态
watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    // 面板打开时重置状态
    selectedItem.value = null
    selectedJewelryType.value = 'all'
    selectedRarity.value = 'all'
    showRulesPanel.value = false
    // 重置尺寸
    modalSize.value = { width: 500, height: 450 }
  } else {
    // 面板关闭时重置状态
    selectedItem.value = null
    showConfirmDialog.value = false
    isDecomposing.value = false
    showRulesPanel.value = false
    // 重置拖拽位置
    modalPosition.value = null
    isDragging.value = false
    isResizing.value = false
  }
}, { immediate: true })
</script>

<style scoped>
/* 面板过渡动画 */
.decompose-modal-fade-enter-active,
.decompose-modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.decompose-modal-fade-enter-from,
.decompose-modal-fade-leave-to {
  opacity: 0;
}

.decompose-modal-slide-enter-active,
.decompose-modal-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.decompose-modal-slide-enter-from,
.decompose-modal-slide-leave-to {
  transform: translateY(-20px) scale(0.95);
  opacity: 0;
}

/* 规则面板过渡动画 */
.rules-panel-fade-enter-active,
.rules-panel-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.rules-panel-fade-enter-from,
.rules-panel-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
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
.decompose-modal-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 1400;
  display: flex;
  flex-direction: column;
  min-width: 500px;
  min-height: 450px;
}

.decompose-modal-container.resizing {
  user-select: none;
}

/* 头部 - 珠宝大师风格 */
.decompose-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(90deg, #2a2a4a 0%, #3a3a5a 100%);
  border-radius: 10px 10px 0 0;
  cursor: move;
  user-select: none;
  touch-action: none;
  flex-shrink: 0;
}

.decompose-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.decompose-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.decompose-help-btn {
  width: 24px;
  height: 24px;
  border: 2px solid #6a8aba;
  background: linear-gradient(135deg, #4a6a9a 0%, #3a5a8a 100%);
  border-radius: 50%;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.decompose-help-btn:hover {
  background: linear-gradient(135deg, #5a7aaa 0%, #4a6a9a 100%);
  border-color: #8aaaca;
  box-shadow: 0 0 10px rgba(106, 138, 186, 0.5);
}

.decompose-help-btn.active {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-color: #ffdd44;
  color: #1a1a2a;
}

.decompose-close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #4a4a6a;
  border-radius: 6px;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.decompose-close-btn:hover {
  background: #ff4444;
}

/* 主体 */
.decompose-modal-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 左侧菜单 - 珠宝大师风格 */
.decompose-sidebar {
  width: 80px;
  background: linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%);
  border-right: 1px solid #3a3a5a;
  display: flex;
  flex-direction: column;
  padding: 8px;
  flex-shrink: 0;
}

.decompose-menu-title {
  font-size: 11px;
  color: #888;
  padding: 6px 0;
  border-bottom: 1px solid #3a3a5a;
  margin-bottom: 6px;
}

.decompose-menu-item {
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

.decompose-menu-item:hover {
  background: linear-gradient(90deg, #4a4a6a 0%, #3a3a5a 100%);
  border-color: #6a6a8a;
}

.decompose-menu-item.active {
  background: linear-gradient(90deg, #ffd700 0%, #ffaa00 100%);
  border-color: #ffdd44;
  color: #1a1a2a;
  font-weight: bold;
}

/* 右侧内容 */
.decompose-content {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* 分区 */
.decompose-section {
  background: rgba(20, 20, 35, 0.95);
  border: 1px solid #3a3a5a;
  border-radius: 8px;
  padding: 8px;
  flex-shrink: 0;
}

.decompose-section-title {
  font-size: 12px;
  color: #ffd700;
  font-weight: bold;
  border-bottom: 1px solid #3a3a5a;
  padding-bottom: 4px;
  margin-bottom: 6px;
}

/* 筛选区域 */
.decompose-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.decompose-filter-label {
  color: #aaa;
  font-size: 11px;
}

.decompose-filter-select {
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 11px;
  outline: none;
  cursor: pointer;
  padding: 4px 8px;
}

.decompose-filter-select:focus {
  border-color: #ffd700;
}

/* 物品列表 */
.decompose-item-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 4px;
  max-height: 150px;
  overflow-y: auto;
}

.decompose-item-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.decompose-item-slot:hover {
  background: rgba(255, 215, 0, 0.1);
  border-color: #5a5a7a;
}

.decompose-item-slot.selected {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
}

.decompose-item-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.decompose-item-info {
  text-align: center;
  width: 100%;
}

.decompose-item-name {
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.decompose-item-enhance {
  font-size: 10px;
  color: #4caf50;
  font-weight: bold;
  margin-top: 2px;
}

.decompose-empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #666;
  padding: 20px;
  font-size: 12px;
}

/* 分解结果区域 */
.decompose-result-area {
  flex: 1;
  overflow: auto;
}

.decompose-result-empty,
.decompose-result-error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  color: #666;
  font-size: 11px;
}

.decompose-result-error {
  color: #f44336;
}

.decompose-result-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.decompose-result-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
}

.decompose-result-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  cursor: pointer;
}

.decompose-result-info {
  display: flex;
  flex-direction: column;
}

.decompose-result-name {
  font-size: 11px;
  color: #fff;
}

.decompose-result-count {
  font-size: 10px;
  color: #00ff88;
  font-weight: bold;
}

/* 操作按钮 */
.decompose-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-shrink: 0;
  padding-top: 8px;
  border-top: 1px solid #3a3a5a;
  margin-top: 8px;
}

.decompose-btn,
.reset-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.decompose-btn {
  background: linear-gradient(135deg, #4a7c59 0%, #6b9b7a 100%);
  color: #fff;
}

.decompose-btn:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 124, 89, 0.4);
}

.decompose-btn.disabled {
  background: #3a3a4a;
  color: #6a6a6a;
  cursor: not-allowed;
}

.reset-btn {
  background: #3a3a4a;
  color: #fff;
}

.reset-btn:hover {
  background: #4a4a5a;
}

/* 拉伸手柄 - 带动画 */
.decompose-resize-handle {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 20px;
  height: 20px;
  cursor: se-resize;
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

/* 拉伸动画 - 始终显示 */
.decompose-resize-handle .resize-line:nth-child(1) {
  animation: resize-bounce-1 0.6s ease-in-out infinite;
}

.decompose-resize-handle .resize-line:nth-child(2) {
  animation: resize-bounce-2 0.6s ease-in-out infinite 0.1s;
}

.decompose-resize-handle .resize-line:nth-child(3) {
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

/* 分解规则面板 */
.decompose-rules-panel {
  width: 320px;
  max-width: 40vw;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #ff9800;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 152, 0, 0.2);
  z-index: 1399;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rules-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(90deg, rgba(255, 152, 0, 0.1) 0%, transparent 100%);
  border-bottom: 1px solid rgba(255, 152, 0, 0.3);
  flex-shrink: 0;
}

.rules-panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #ff9800;
}

.rules-panel-close {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.rules-panel-close:hover {
  background: rgba(255, 0, 0, 0.5);
}

.rules-panel-body {
  padding: 5px;
  overflow-y: auto;
  flex: 1;
}

.rules-section {
  margin-bottom: 16px;
}

.rules-section:last-child {
  margin-bottom: 0;
}

.rules-section-title {
  font-size: 13px;
  color: #ff9800;
  font-weight: bold;
  margin-bottom: 5px;
  border-bottom: 1px solid rgba(255, 152, 0, 0.2);
}

.rules-table-wrapper {
  overflow-x: auto;
}

.rules-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.rules-table th,
.rules-table td {
  padding: 6px 8px;
  text-align: center;
  border: 1px solid rgba(255, 152, 0, 0.2);
}

.rules-table th {
  background: rgba(255, 152, 0, 0.15);
  color: #ff9800;
  font-weight: bold;
}

.rules-table td {
  color: #fff;
}

.rules-table tr:hover td {
  background: rgba(255, 152, 0, 0.1);
}

.rules-note {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  font-size: 11px;
  color: #888;
  line-height: 1.6;
}

.rules-note p {
  margin: 0 0 4px 0;
}

.rules-note p:last-child {
  margin-bottom: 0;
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
  border: 2px solid #ff9800;
  border-radius: 12px;
  padding: 24px;
  width: 400px;
  max-width: 90vw;
}

.confirm-title {
  font-size: 18px;
  font-weight: bold;
  color: #ff9800;
  margin-bottom: 16px;
  text-align: center;
}

.confirm-content {
  color: #fff;
  font-size: 14px;
  line-height: 1.8;
}

.confirm-content strong {
  color: #ff9800;
}

.confirm-desc {
  margin-top: 12px;
  color: #888;
}

.confirm-materials {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.confirm-material-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
}

.confirm-material-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.confirm-warning {
  margin-top: 16px;
  color: #f44336;
  font-size: 12px;
  text-align: center;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.confirm-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn.cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.confirm-btn.cancel:hover {
  background: rgba(255, 255, 255, 0.2);
}

.confirm-btn.confirm {
  background: linear-gradient(135deg, #ff9800 0%, #e67e22 100%);
  color: #fff;
}

.confirm-btn.confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
}

/* 滚动条样式 - 珠宝大师风格 */
.decompose-item-list::-webkit-scrollbar,
.rules-panel-body::-webkit-scrollbar {
  width: 6px;
}

.decompose-item-list::-webkit-scrollbar-track,
.rules-panel-body::-webkit-scrollbar-track {
  background: #1a1a2e;
  border-radius: 3px;
}

.decompose-item-list::-webkit-scrollbar-thumb,
.rules-panel-body::-webkit-scrollbar-thumb {
  background: #4a4a6a;
  border-radius: 3px;
}

.decompose-item-list::-webkit-scrollbar-thumb:hover,
.rules-panel-body::-webkit-scrollbar-thumb:hover {
  background: #5a5a7a;
}
</style>
