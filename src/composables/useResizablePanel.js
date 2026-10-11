/**
 * @fileoverview 可拉伸面板共享组合式函数
 * @description 提供面板的拖拽、拉伸和等比例缩放功能
 * @author FLYFF Team
 * @version 1.0.0
 * @created 2026-04-04
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * 创建可拉伸面板组合式函数
 * @param {Object} config - 配置选项
 * @param {number} config.defaultWidth - 默认宽度
 * @param {number} config.defaultHeight - 默认高度
 * @param {number} config.minWidth - 最小宽度
 * @param {number} config.minHeight - 最小高度
 * @returns {Object} 面板状态和方法
 */
export function useResizablePanel(config) {
  const {
    defaultWidth = 600,
    defaultHeight = 500,
    minWidth = 400,
    minHeight = 300
  } = config

  // 面板可见性
  const isVisible = ref(true)

  // 面板容器引用
  const panelRef = ref(null)

  // 面板尺寸
  const panelWidth = ref(defaultWidth)
  const panelHeight = ref(defaultHeight)

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
    x: panelWidth.value / defaultWidth,
    y: panelHeight.value / defaultHeight,
    // 使用较小的比例保持等比例缩放
    uniform: Math.min(panelWidth.value / defaultWidth, panelHeight.value / defaultHeight)
  }))

  // 面板样式
  const panelStyle = computed(() => ({
    left: `calc(50% - ${panelWidth.value / 2}px + ${panelX.value}px)`,
    top: `calc(50% - ${panelHeight.value / 2}px + ${panelY.value}px)`,
    width: `${panelWidth.value}px`,
    height: `${panelHeight.value}px`
  }))

  // 面板位置样式（用于拖拽）
  const panelPosition = computed(() => ({
    x: window.innerWidth / 2 - panelWidth.value / 2 + panelX.value,
    y: window.innerHeight / 2 - panelHeight.value / 2 + panelY.value
  }))

  // 内容缩放样式
  const contentStyle = computed(() => ({
    transform: `scale(${scaleRatio.value.uniform})`,
    transformOrigin: 'top left',
    width: `${defaultWidth}px`,
    height: `${defaultHeight}px`
  }))

  /**
   * 初始化面板位置到屏幕中央
   */
  const initPanelPosition = () => {
    panelX.value = 0
    panelY.value = 0
    panelWidth.value = defaultWidth
    panelHeight.value = defaultHeight
  }

  /**
   * 开始拖拽面板
   * @param {PointerEvent} event - 指针事件
   * @param {string[]} excludeSelectors - 排除的选择器数组
   */
  const startDrag = (event, excludeSelectors = []) => {
    // 检查排除选择器
    for (const selector of excludeSelectors) {
      if (event.target.closest(selector)) return
    }
    // 排除按钮点击
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

    // 计算宽高比
    const aspectRatio = defaultWidth / defaultHeight

    let newWidth = resizeStartWidth.value + deltaAvg * 2
    let newHeight = newWidth / aspectRatio

    // 限制最小尺寸
    newWidth = Math.max(minWidth, newWidth)
    newHeight = Math.max(minHeight, newHeight)

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
    panelWidth.value = defaultWidth
    panelHeight.value = defaultHeight
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
    panelPosition,
    contentStyle,

    // 方法
    initPanelPosition,
    startDrag,
    startResize,
    resetPanelSize,
    handleClose
  }
}
