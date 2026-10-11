// 拖动指令
export default {
  mounted (el, binding) {
    const options = binding.value || {}
    const handle = options.handle ? el.querySelector(options.handle) : el
    const exclude = options.exclude || ''

    let isDragging = false
    let offsetX, offsetY
    let initialX, initialY

    // 鼠标按下事件
    const mouseDownHandler = e => {
      // 如果点击的是排除的元素，不启动拖拽
      if (exclude && e.target.closest(exclude)) {
        return
      }

      isDragging = true
      el.classList.add('dragging')

      // 获取当前实际位置
      const rect = el.getBoundingClientRect()
      
      // 计算鼠标在元素内的偏移
      offsetX = e.clientX - rect.left
      offsetY = e.clientY - rect.top

      // 立即将元素定位到当前位置（清除transform等CSS定位）
      el.style.position = 'fixed'
      el.style.left = `${rect.left}px`
      el.style.top = `${rect.top}px`
      el.style.transform = 'none'
      el.style.margin = '0'

      // 记录初始位置
      initialX = rect.left
      initialY = rect.top

      // 调用拖拽开始回调
      if (typeof options.onDragStart === 'function') {
        options.onDragStart({
          element: el,
          x: initialX,
          y: initialY,
          event: e
        })
      }

      // 防止文本被选中
      e.preventDefault()
    }

    // 鼠标移动事件
    const mouseMoveHandler = e => {
      if (!isDragging) {
        return
      }

      // 计算新位置
      let x = e.clientX - offsetX
      let y = e.clientY - offsetY

      // 获取窗口尺寸作为边界
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const elementRect = el.getBoundingClientRect()

      // 边界限制
      x = Math.max(0, Math.min(x, viewportWidth - elementRect.width))
      y = Math.max(0, Math.min(y, viewportHeight - elementRect.height))

      // 设置元素新位置
      el.style.position = 'fixed'
      el.style.left = `${x}px`
      el.style.top = `${y}px`

      // 调用拖拽中回调
      if (typeof options.onDrag === 'function') {
        options.onDrag({
          element: el,
          x,
          y,
          deltaX: x - initialX,
          deltaY: y - initialY,
          event: e
        })
      }
    }

    // 鼠标释放事件
    const mouseUpHandler = e => {
      if (isDragging) {
        isDragging = false
        el.classList.remove('dragging')

        // 调用拖拽结束回调
        if (typeof options.onDragEnd === 'function') {
          const rect = el.getBoundingClientRect()
          options.onDragEnd({
            element: el,
            x: rect.left,
            y: rect.top,
            deltaX: rect.left - initialX,
            deltaY: rect.top - initialY,
            event: e
          })
        }
      }
    }

    // 为拖拽把手添加事件监听
    handle.addEventListener('mousedown', mouseDownHandler)

    // 为document添加鼠标移动和释放事件监听
    document.addEventListener('mousemove', mouseMoveHandler)
    document.addEventListener('mouseup', mouseUpHandler)

    // 在元素上存储清理函数，以便在卸载时清理事件监听器
    el._dragCleanup = () => {
      handle.removeEventListener('mousedown', mouseDownHandler)
      document.removeEventListener('mousemove', mouseMoveHandler)
      document.removeEventListener('mouseup', mouseUpHandler)
    }
  },

  unmounted (el) {
    // 清理事件监听器
    if (el._dragCleanup) {
      el._dragCleanup()
      delete el._dragCleanup
    }
  }
}
