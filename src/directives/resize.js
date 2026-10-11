/**
 * @file resize.js
 * @description 元素拉伸指令，支持从右下角拉伸调整元素大小
 * @author FLYFF Team
 * @created 2026-02-24
 */

export default {
  mounted (el, binding) {
    const options = binding.value || {}
    const minWidth = options.minWidth || 200
    const minHeight = options.minHeight || 150
    const maxWidth = options.maxWidth || window.innerWidth
    const maxHeight = options.maxHeight || window.innerHeight

    // 创建拉伸把手
    const resizeHandle = document.createElement('div')
    resizeHandle.className = 'resize-handle'
    resizeHandle.style.cssText = `
      position: absolute;
      right: 0;
      bottom: 0;
      width: 16px;
      height: 16px;
      cursor: se-resize;
      z-index: 10;
      background: linear-gradient(135deg, transparent 50%, rgba(139, 90, 43, 0.6) 50%);
      border-radius: 0 0 4px 0;
    `

    el.appendChild(resizeHandle)

    let isResizing = false
    let startWidth, startHeight
    let startX, startY

    const mouseDownHandler = e => {
      // 只响应左键
      if (e.button !== 0) return

      isResizing = true
      el.classList.add('resizing')

      const rect = el.getBoundingClientRect()
      startWidth = rect.width
      startHeight = rect.height
      startX = e.clientX
      startY = e.clientY

      e.preventDefault()
      e.stopPropagation()
    }

    const mouseMoveHandler = e => {
      if (!isResizing) return

      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      let newWidth = startWidth + deltaX
      let newHeight = startHeight + deltaY

      // 边界限制
      newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth))
      newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight))

      el.style.width = `${newWidth}px`
      el.style.height = `${newHeight}px`

      // 调用回调
      if (typeof options.onResize === 'function') {
        options.onResize(newWidth, newHeight)
      }
    }

    const mouseUpHandler = () => {
      if (isResizing) {
        isResizing = false
        el.classList.remove('resizing')

        // 调用结束回调
        if (typeof options.onResizeEnd === 'function') {
          const rect = el.getBoundingClientRect()
          options.onResizeEnd(rect.width, rect.height)
        }
      }
    }

    resizeHandle.addEventListener('mousedown', mouseDownHandler)
    document.addEventListener('mousemove', mouseMoveHandler)
    document.addEventListener('mouseup', mouseUpHandler)

    // 存储清理函数
    el._resizeCleanup = () => {
      resizeHandle.removeEventListener('mousedown', mouseDownHandler)
      document.removeEventListener('mousemove', mouseMoveHandler)
      document.removeEventListener('mouseup', mouseUpHandler)
      if (resizeHandle.parentNode) {
        resizeHandle.parentNode.removeChild(resizeHandle)
      }
    }
  },

  unmounted (el) {
    if (el._resizeCleanup) {
      el._resizeCleanup()
      delete el._resizeCleanup
    }
  }
}
