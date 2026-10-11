/**
 * @file useSkillBarDrag.js
 * @description 技能栏拖拽组合式函数 - 处理 SkillPanel 到 SkillBar 的拖拽以及 SkillBar 内部槽位交换
 * 仅允许主动技能（非被动）被拖拽
 * @generated 2026-07-11
 */

import { ref } from 'vue'
import { useSkillBarSlotsStore } from '@/store/skillBarSlots'

/** dataTransfer 中存储技能 ID 的自定义 MIME 类型（使用 id 而非 key，因为 key 在不同职业间不唯一） */
const DRAG_MIME = 'application/x-skill-id'

/** dataTransfer 中存储来源标记（panel / bar）的自定义 MIME 类型 */
const DRAG_SOURCE_MIME = 'application/x-skill-source'

/** dataTransfer 中存储槽位索引的自定义 MIME 类型 */
const DRAG_SLOT_INDEX_MIME = 'application/x-skill-slot-index'

/**
 * 技能栏拖拽组合式函数
 * 提供 HTML5 拖拽 API 的封装，用于：
 * 1. 从 SkillPanel 拖拽主动技能到底部技能栏
 * 2. 在底部技能栏内交换技能槽位
 * 3. 从底部技能栏移除技能
 *
 * @returns {Object} 拖拽相关状态和方法
 */
export function useSkillBarDrag () {
  const slotsStore = useSkillBarSlotsStore()

  /** 当前正在拖拽的技能 ID（全局唯一标识） */
  const draggingSkillId = ref(null)

  /** 当前拖拽来源（'panel' 或 'bar'） */
  const draggingSource = ref(null)

  /** 当前拖拽的源槽位索引（仅 bar 内拖拽时有效） */
  const draggingSlotIndex = ref(null)

  /** 当前悬停的目标槽位索引（用于高亮） */
  const hoverSlotIndex = ref(null)

  /**
   * 检查技能是否可拖拽（仅主动技能可拖拽）
   * @param {Object} skill - 技能对象
   * @returns {boolean} 是否可拖拽
   */
  const isDraggable = skill => {
    if (!skill) {
      return false
    }
    // 被动技能不可拖拽
    if (skill.isPassive === true) {
      return false
    }
    return true
  }

  /**
   * 从 SkillPanel 开始拖拽技能
   * 设置 dataTransfer 数据并更新拖拽状态
   * @param {DragEvent} event - 拖拽事件
   * @param {Object} skill - 技能对象
   */
  const onPanelDragStart = (event, skill) => {
    if (!isDraggable(skill)) {
      event.preventDefault()
      return
    }

    // 使用 id 作为唯一标识，因为 key（Q/W/E/R）在不同职业间不唯一
    const skillId = skill.id || skill.key
    if (!skillId) {
      event.preventDefault()
      return
    }

    draggingSkillId.value = skillId
    draggingSource.value = 'panel'
    draggingSlotIndex.value = null

    try {
      event.dataTransfer.effectAllowed = 'copyMove'
      event.dataTransfer.setData(DRAG_MIME, String(skillId))
      event.dataTransfer.setData(DRAG_SOURCE_MIME, 'panel')
      event.dataTransfer.setData('text/plain', String(skillId))
    } catch (error) {
      console.error('[useSkillBarDrag] 设置拖拽数据失败:', error)
    }
  }

  /**
   * 从 SkillBar 槽位开始拖拽（用于槽位间交换）
   * @param {DragEvent} event - 拖拽事件
   * @param {number} slotIndex - 源槽位索引
   * @param {string} skillId - 槽位中的技能 ID
   */
  const onBarDragStart = (event, slotIndex, skillId) => {
    if (!skillId) {
      event.preventDefault()
      return
    }

    draggingSkillId.value = skillId
    draggingSource.value = 'bar'
    draggingSlotIndex.value = slotIndex

    try {
      event.dataTransfer.effectAllowed = 'copyMove'
      event.dataTransfer.setData(DRAG_MIME, String(skillId))
      event.dataTransfer.setData(DRAG_SOURCE_MIME, 'bar')
      event.dataTransfer.setData(DRAG_SLOT_INDEX_MIME, String(slotIndex))
      event.dataTransfer.setData('text/plain', String(skillId))
    } catch (error) {
      console.error('[useSkillBarDrag] 设置槽位拖拽数据失败:', error)
    }
  }

  /**
   * 拖拽经过槽位时（阻止默认行为以允许放置）
   * @param {DragEvent} event - 拖拽事件
   * @param {number} slotIndex - 目标槽位索引
   */
  const onSlotDragOver = (event, slotIndex) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    hoverSlotIndex.value = slotIndex
  }

  /**
   * 拖拽离开槽位时（清除高亮）
   * @param {DragEvent} event - 拖拽事件
   * @param {number} slotIndex - 槽位索引
   */
  const onSlotDragLeave = (event, slotIndex) => {
    if (hoverSlotIndex.value === slotIndex) {
      hoverSlotIndex.value = null
    }
  }

  /**
   * 技能放置到槽位
   * 处理三种场景：
   * 1. 从 SkillPanel 拖入空槽位 → setSlot
   * 2. 从 SkillPanel 拖入已有技能的槽位 → 替换
   * 3. 从 SkillBar 内部拖拽 → 交换两个槽位
   * @param {DragEvent} event - 拖拽事件
   * @param {number} targetSlotIndex - 目标槽位索引
   */
  const onSlotDrop = (event, targetSlotIndex) => {
    event.preventDefault()
    hoverSlotIndex.value = null

    let skillId = null
    let source = null
    let sourceSlotIndex = null

    try {
      skillId = event.dataTransfer.getData(DRAG_MIME) || null
      source = event.dataTransfer.getData(DRAG_SOURCE_MIME) || null
      const rawIndex = event.dataTransfer.getData(DRAG_SLOT_INDEX_MIME)
      sourceSlotIndex = rawIndex !== '' ? Number(rawIndex) : null
    } catch (error) {
      console.error('[useSkillBarDrag] 读取拖拽数据失败:', error)
      // 回退到从 text/plain 读取
      try {
        skillId = event.dataTransfer.getData('text/plain') || null
      } catch (e) {
        // 忽略
      }
    }

    if (!skillId) {
      return
    }

    if (source === 'bar' && sourceSlotIndex !== null && Number.isFinite(sourceSlotIndex)) {
      // SkillBar 内部交换
      slotsStore.swapSlots(sourceSlotIndex, targetSlotIndex)
    } else {
      // 从 SkillPanel 拖入
      slotsStore.setSlot(targetSlotIndex, skillId)
    }

    // 重置拖拽状态
    draggingSkillId.value = null
    draggingSource.value = null
    draggingSlotIndex.value = null
  }

  /**
   * 拖拽结束（清理状态）
   */
  const onDragEnd = () => {
    draggingSkillId.value = null
    draggingSource.value = null
    draggingSlotIndex.value = null
    hoverSlotIndex.value = null
  }

  /**
   * 从槽位移除技能（右键点击或删除按钮）
   * @param {number} slotIndex - 槽位索引
   */
  const removeFromSlot = slotIndex => {
    slotsStore.removeFromSlot(slotIndex)
  }

  return {
    // 状态
    draggingSkillId,
    draggingSource,
    draggingSlotIndex,
    hoverSlotIndex,
    // 方法
    isDraggable,
    onPanelDragStart,
    onBarDragStart,
    onSlotDragOver,
    onSlotDragLeave,
    onSlotDrop,
    onDragEnd,
    removeFromSlot
  }
}
