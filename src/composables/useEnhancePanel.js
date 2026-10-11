/**
 * @fileoverview 装备强化面板共享组合式函数
 * @description 提供装备强化面板的拖拽、拉伸和状态管理功能
 * @author FLYFF Team
 * @version 1.0.0
 * @created 2026-04-04
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 面板默认尺寸配置
const DEFAULT_WIDTH = 700
const DEFAULT_HEIGHT = 500
const MIN_WIDTH = 500
const MIN_HEIGHT = 350

/**
 * 装备强化面板组合式函数
 * @returns {Object} 面板状态和方法
 */
export function useEnhancePanel() {
  // 面板可见性
  const isVisible = ref(true)

  // 面板容器引用
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

  // 缩放比例（基于默认尺寸）
  const scaleRatio = computed(() => ({
    x: panelWidth.value / DEFAULT_WIDTH,
    y: panelHeight.value / DEFAULT_HEIGHT,
    // 使用较小的比例保持等比例缩放
    uniform: Math.min(panelWidth.value / DEFAULT_WIDTH, panelHeight.value / DEFAULT_HEIGHT)
  }))

  // 面板样式
  const panelStyle = computed(() => ({
    left: `calc(50% - ${panelWidth.value / 2}px + ${panelX.value}px)`,
    top: `calc(50% - ${panelHeight.value / 2}px + ${panelY.value}px)`,
    width: `${panelWidth.value}px`,
    height: `${panelHeight.value}px`
  }))

  // 内容缩放样式
  const contentStyle = computed(() => ({
    transform: `scale(${scaleRatio.value.uniform})`,
    transformOrigin: 'top left',
    width: `${DEFAULT_WIDTH}px`,
    height: `${DEFAULT_HEIGHT}px`
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
    if (event.target.closest('.enhance-menu')) return
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
   * 重置面板尺寸
   */
  const resetPanelSize = () => {
    panelWidth.value = DEFAULT_WIDTH
    panelHeight.value = DEFAULT_HEIGHT
  }

  /**
   * 关闭面板
   */
  const handleClose = () => {
    isVisible.value = false
  }

  // 生命周期
  onMounted(() => {
    initPanelPosition()
  })

  onUnmounted(() => {
    document.removeEventListener('pointermove', handleDrag)
    document.removeEventListener('pointerup', stopDrag)
    document.removeEventListener('pointermove', handleResize)
    document.removeEventListener('pointerup', stopResize)
  })

  return {
    // 状态
    isVisible,
    panelRef,
    panelWidth,
    panelHeight,
    panelX,
    panelY,
    isDragging,
    isResizing,
    scaleRatio,

    // 样式
    panelStyle,
    contentStyle,

    // 方法
    initPanelPosition,
    startDrag,
    startResize,
    resetPanelSize,
    handleClose
  }
}

/**
 * 选择面板拖拽组合式函数
 * @returns {Object} 选择面板状态和方法
 */
export function useSelectorPanel() {
  // 选择面板显示状态
  const showEquipmentSelectorPanel = ref(false)
  const showMaterialSelectorPanel = ref(false)
  const showScrollSelectorPanel = ref(false)

  // 选择面板位置
  const equipmentSelectorPosition = ref({ x: 0, y: 0 })
  const materialSelectorPosition = ref({ x: 0, y: 0 })
  const scrollSelectorPosition = ref({ x: 0, y: 0 })

  // 选择面板拖拽状态
  const isSelectorDragging = ref(false)
  const selectorDragOffset = ref({ x: 0, y: 0 })
  const currentSelectorDragType = ref(null) // 'equipment' | 'material' | 'scroll'

  let selectorDragHandler = null
  let selectorDragEndHandler = null

  /**
   * 初始化选择面板位置
   * @param {string} type - 面板类型
   * @param {Object} mainPanelPosition - 主面板位置
   */
  const initSelectorPosition = (type, mainPanelPosition = { x: 0, y: 0 }) => {
    const panelWidth = 400
    const panelHeight = 345
    const position = {
      x: (window.innerWidth - panelWidth) / 2 - mainPanelPosition.x + 300,
      y: (window.innerHeight - panelHeight) / 2 - mainPanelPosition.y + 200
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
   * 开始选择面板拖拽
   * @param {MouseEvent} event - 鼠标事件
   * @param {string} type - 面板类型
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
   * @param {MouseEvent} event - 鼠标事件
   */
  const onSelectorDrag = event => {
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
   * 停止选择面板拖拽
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
  const startEquipmentSelectorDrag = event => startSelectorDrag(event, 'equipment')

  /**
   * 材料选择面板拖拽开始
   */
  const startMaterialSelectorDrag = event => startSelectorDrag(event, 'material')

  /**
   * 卷轴选择面板拖拽开始
   */
  const startScrollSelectorDrag = event => startSelectorDrag(event, 'scroll')

  /**
   * 显示装备选择面板
   */
  const showEquipmentSelector = () => {
    initSelectorPosition('equipment')
    showEquipmentSelectorPanel.value = true
  }

  /**
   * 隐藏装备选择面板
   */
  const hideEquipmentSelector = () => {
    showEquipmentSelectorPanel.value = false
  }

  /**
   * 显示材料选择面板
   */
  const showMaterialSelector = () => {
    initSelectorPosition('material')
    showMaterialSelectorPanel.value = true
  }

  /**
   * 隐藏材料选择面板
   */
  const hideMaterialSelector = () => {
    showMaterialSelectorPanel.value = false
  }

  /**
   * 显示卷轴选择面板
   */
  const showScrollSelector = () => {
    initSelectorPosition('scroll')
    showScrollSelectorPanel.value = true
  }

  /**
   * 隐藏卷轴选择面板
   */
  const hideScrollSelector = () => {
    showScrollSelectorPanel.value = false
  }

  return {
    // 状态
    showEquipmentSelectorPanel,
    showMaterialSelectorPanel,
    showScrollSelectorPanel,
    equipmentSelectorPosition,
    materialSelectorPosition,
    scrollSelectorPosition,

    // 方法
    initSelectorPosition,
    startEquipmentSelectorDrag,
    startMaterialSelectorDrag,
    startScrollSelectorDrag,
    showEquipmentSelector,
    hideEquipmentSelector,
    showMaterialSelector,
    hideMaterialSelector,
    showScrollSelector,
    hideScrollSelector
  }
}
