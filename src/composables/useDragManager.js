import { ref } from 'vue'

/**
 * 拖拽功能组合式API
 * 将拖拽相关的逻辑从Main.vue中抽离出来
 */
export function useDragManager (questModal, questHeader) {
  // 拖拽状态
  const isDragging = ref(false)
  const dragOffset = ref({ x: 0, y: 0 })

  // 初始化任务面板拖拽功能
  const initQuestPanelDrag = () => {
    if (!questModal.value || !questHeader.value) {
      // 静默失败，不显示警告
      return
    }

    const modal = questModal.value
    const header = questHeader.value

    // 设置模态框初始位置
    modal.style.position = 'fixed'
    modal.style.left = '50%'
    modal.style.top = '50%'
    modal.style.transform = 'translate(-50%, -50%)'

    // 添加鼠标事件监听器
    header.addEventListener('mousedown', startDrag)
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', endDrag)
  }

  // 开始拖拽
  const startDrag = event => {
    if (!questModal.value) {
      return
    }

    const modal = questModal.value
    const rect = modal.getBoundingClientRect()

    isDragging.value = true
    dragOffset.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }

    // 防止文本选择
    event.preventDefault()
  }

  // 拖拽中
  const onDrag = event => {
    if (!isDragging.value || !questModal.value) {
      return
    }

    const modal = questModal.value
    const newX = event.clientX - dragOffset.value.x
    const newY = event.clientY - dragOffset.value.y

    // 限制在窗口范围内
    const maxX = window.innerWidth - modal.offsetWidth
    const maxY = window.innerHeight - modal.offsetHeight

    modal.style.left = `${Math.max(0, Math.min(newX, maxX))}px`
    modal.style.top = `${Math.max(0, Math.min(newY, maxY))}px`
    modal.style.transform = 'none'
  }

  // 结束拖拽
  const endDrag = () => {
    isDragging.value = false
  }

  // 清理拖拽事件
  const cleanupDrag = () => {
    if (!questModal.value || !questHeader.value) {
      return
    }

    const header = questHeader.value

    header.removeEventListener('mousedown', startDrag)
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', endDrag)
  }

  // 暴露给外部使用的属性和方法
  return {
    // 响应式数据
    isDragging,
    dragOffset,

    // 方法
    initQuestPanelDrag,
    startDrag,
    onDrag,
    endDrag,
    cleanupDrag
  }
}
