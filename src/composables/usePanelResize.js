/**
 * @file usePanelResize.js
 * @description 面板八方向拉伸组合式函数
 * 支持上、下、左、右、左上、右上、左下、右下八个方向拉伸面板尺寸
 * 与 v-drag 指令兼容：拉伸时同步固定面板位置（清除 transform，改用 left/top 定位）
 * 尺寸持久化到 localStorage，下次打开自动恢复
 * @author FLYFF Team
 * @created 2026-07-18
 */

import { ref } from 'vue'

/**
 * 八方向定义及对应的光标样式
 * n=北(上) s=南(下) e=东(右) w=西(左)
 * @type {Array<{dir: string, cursor: string}>}
 */
export const RESIZE_DIRECTIONS = Object.freeze([
  { dir: 'n', cursor: 'ns-resize' },
  { dir: 's', cursor: 'ns-resize' },
  { dir: 'e', cursor: 'ew-resize' },
  { dir: 'w', cursor: 'ew-resize' },
  { dir: 'ne', cursor: 'nesw-resize' },
  { dir: 'nw', cursor: 'nwse-resize' },
  { dir: 'se', cursor: 'nwse-resize' },
  { dir: 'sw', cursor: 'nesw-resize' }
])

/**
 * 创建面板八方向拉伸组合式函数
 * @param {Object} config - 配置选项
 * @param {string} config.storageKey - localStorage 存储键名
 * @param {number} [config.defaultWidth=760] - 默认宽度（px）
 * @param {number} [config.defaultHeight=600] - 默认高度（px）
 * @param {number} [config.minWidth=480] - 最小宽度（px）
 * @param {number} [config.minHeight=360] - 最小高度（px）
 * @param {number} [config.maxWidthRatio=0.95] - 最大宽度占视口比例
 * @param {number} [config.maxHeightRatio=0.95] - 最大高度占视口比例
 * @returns {{panelWidth: import('vue').Ref<number>, panelHeight: import('vue').Ref<number>, startResize: Function, restoreSize: Function, resetSize: Function}} 面板尺寸状态和拉伸方法
 */
export function usePanelResize (config) {
  const {
    storageKey,
    defaultWidth = 760,
    defaultHeight = 600,
    minWidth = 480,
    minHeight = 360,
    maxWidthRatio = 0.95,
    maxHeightRatio = 0.95
  } = config

  /** 面板宽度（响应式，供 Vue style 绑定使用） */
  const panelWidth = ref(defaultWidth)

  /** 面板高度（响应式，供 Vue style 绑定使用） */
  const panelHeight = ref(defaultHeight)

  /** 拉伸过程中的临时状态（非响应式，避免不必要的渲染） */
  let resizeState = null

  /**
   * 从 localStorage 恢复保存的面板尺寸
   * 若无存档或存档无效，使用默认尺寸
   */
  const restoreSize = () => {
    if (!storageKey) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return
      const data = JSON.parse(saved)
      const w = Number(data?.width)
      const h = Number(data?.height)
      if (Number.isFinite(w) && w >= minWidth) {
        panelWidth.value = Math.min(w, Math.floor(window.innerWidth * maxWidthRatio))
      }
      if (Number.isFinite(h) && h >= minHeight) {
        panelHeight.value = Math.min(h, Math.floor(window.innerHeight * maxHeightRatio))
      }
    } catch (error) {
      console.warn('[usePanelResize] 恢复面板尺寸失败:', error)
    }
  }

  /**
   * 将当前面板尺寸保存到 localStorage
   */
  const saveSize = () => {
    if (!storageKey) return
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          width: panelWidth.value,
          height: panelHeight.value
        })
      )
    } catch (error) {
      console.warn('[usePanelResize] 保存面板尺寸失败:', error)
    }
  }

  /**
   * 重置面板尺寸为默认值并保存
   */
  const resetSize = () => {
    panelWidth.value = defaultWidth
    panelHeight.value = defaultHeight
    saveSize()
  }

  /**
   * 拉伸移动事件处理函数（绑定到 document）
   * 根据拉伸方向计算新的宽高和位置，同步更新 DOM 和响应式变量
   * @param {MouseEvent} event - 鼠标移动事件
   */
  const handleResizeMove = (event) => {
    if (!resizeState) return

    const {
      direction,
      panelEl,
      startX,
      startY,
      startLeft,
      startTop,
      startWidth,
      startHeight
    } = resizeState

    const deltaX = event.clientX - startX
    const deltaY = event.clientY - startY

    let newWidth = startWidth
    let newHeight = startHeight
    let newLeft = startLeft
    let newTop = startTop

    // 东（右）方向：宽度增加
    if (direction.includes('e')) {
      newWidth = startWidth + deltaX
    }
    // 南（下）方向：高度增加
    if (direction.includes('s')) {
      newHeight = startHeight + deltaY
    }
    // 西（左）方向：宽度减少，左边界右移
    if (direction.includes('w')) {
      newWidth = startWidth - deltaX
      newLeft = startLeft + deltaX
    }
    // 北（上）方向：高度减少，上边界下移
    if (direction.includes('n')) {
      newHeight = startHeight - deltaY
      newTop = startTop + deltaY
    }

    // 最小尺寸限制：达到最小值时修正位置，避免左/上边缘越过
    if (newWidth < minWidth) {
      if (direction.includes('w')) {
        newLeft = startLeft + (startWidth - minWidth)
      }
      newWidth = minWidth
    }
    if (newHeight < minHeight) {
      if (direction.includes('n')) {
        newTop = startTop + (startHeight - minHeight)
      }
      newHeight = minHeight
    }

    // 最大尺寸限制（视口比例）
    const maxWidth = Math.floor(window.innerWidth * maxWidthRatio)
    const maxHeight = Math.floor(window.innerHeight * maxHeightRatio)
    if (newWidth > maxWidth) {
      if (direction.includes('w')) {
        newLeft = startLeft + (startWidth - maxWidth)
      }
      newWidth = maxWidth
    }
    if (newHeight > maxHeight) {
      if (direction.includes('n')) {
        newTop = startTop + (startHeight - maxHeight)
      }
      newHeight = maxHeight
    }

    // 更新响应式变量（Vue style 绑定 width/height）
    panelWidth.value = Math.round(newWidth)
    panelHeight.value = Math.round(newHeight)

    // 同步更新 DOM 位置（left/top 不通过 Vue 绑定，直接操作 DOM）
    panelEl.style.left = `${Math.round(newLeft)}px`
    panelEl.style.top = `${Math.round(newTop)}px`
  }

  /**
   * 拉伸结束事件处理函数（绑定到 document）
   * 清理事件监听并持久化尺寸
   */
  const handleResizeEnd = () => {
    if (!resizeState) return
    resizeState = null
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
    document.body.classList.remove('panel-resizing')
    saveSize()
  }

  /**
   * 开始拉伸面板
   * 在拉伸开始时固定面板位置（与 v-drag 指令一致：清除 transform，改用 left/top），
   * 确保后续的宽高变化不会导致面板位移
   * @param {MouseEvent} event - 鼠标按下事件
   * @param {string} direction - 拉伸方向（n/s/e/w/ne/nw/se/sw）
   * @param {HTMLElement} panelEl - 面板根元素
   */
  const startResize = (event, direction, panelEl) => {
    if (!panelEl || !direction) return
    // 仅响应左键
    if (event.button !== 0) return
    // 阻止事件冒泡，防止触发 v-drag 拖拽
    event.preventDefault()
    event.stopPropagation()

    // 读取面板当前实际位置（getBoundingClientRect 不受 transform 影响）
    const rect = panelEl.getBoundingClientRect()

    // 固定面板位置：清除 transform 居中，改用 left/top 定位
    // 与 v-drag 指令的 mousedown 逻辑一致，确保两者兼容
    panelEl.style.position = 'fixed'
    panelEl.style.left = `${rect.left}px`
    panelEl.style.top = `${rect.top}px`
    panelEl.style.transform = 'none'
    panelEl.style.margin = '0'

    // 记录拉伸起始状态
    resizeState = {
      direction,
      panelEl,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      startWidth: rect.width,
      startHeight: rect.height
    }

    // 添加全局事件监听
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
    // 添加 body class 禁用过渡动画和文本选择
    document.body.classList.add('panel-resizing')
  }

  return {
    panelWidth,
    panelHeight,
    startResize,
    restoreSize,
    resetSize,
    saveSize
  }
}
