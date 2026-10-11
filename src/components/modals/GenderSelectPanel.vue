/**
 * @fileoverview 性别选择面板组件
 * @description 用于selectbox类型套装礼盒使用时选择性别，根据选择获得对应性别时装套装
 * @author FLYFF Team
 * @created 2026-07-16
 */
<template>
  <transition name="panel-fade">
    <div v-if="visible" class="gender-select-overlay" @click.self="handleCancel">
      <div class="gender-select-panel">
        <!-- 面板头部 -->
        <div class="panel-header">
          <img
            v-if="boxItemId"
            :src="'/pt/item_icon/' + boxItemId + '.png'"
            :alt="boxItemName"
            class="panel-icon"
            @error="handleIconError"
          />
          <span class="panel-title">{{ boxItemName || '套装礼盒' }}</span>
          <button class="close-btn" @click="handleCancel">×</button>
        </div>

        <!-- 面板内容 -->
        <div class="panel-body">
          <div class="panel-description">
            {{ boxDescription || '请选择你想要的性别套装' }}
          </div>

          <!-- 性别选择区域 -->
          <div class="option-grid">
            <div
              v-for="option in genderOptions"
              :key="option.id"
              class="option-item"
              :class="{ selected: selectedOption?.id === option.id }"
              @click="selectOption(option)"
              @mouseenter="handleOptionMouseEnter($event, option)"
              @mousemove="handleOptionMouseMove($event)"
              @mouseleave="handleOptionMouseLeave"
            >
              <img
                :src="'/pt/item_icon/' + option.id + '.png'"
                :alt="option.name"
                class="option-icon"
                @error="handleOptionIconError"
              />
              <div class="option-info">
                <span class="option-name">{{ option.name }}</span>
                <span class="option-gender">{{ option.genderLabel }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 面板底部 -->
        <div class="panel-footer">
          <button class="action-btn cancel-btn" @click="handleCancel">取消</button>
          <button
            class="action-btn confirm-btn"
            :disabled="!selectedOption || hasConfirmed"
            @click="handleConfirm"
          >
            {{ hasConfirmed ? '已领取' : '领取' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useItemsStore } from '@/store/items'

/**
 * Props 定义
 * @property {boolean} visible - 面板是否可见
 * @property {number} boxItemId - 礼盒物品ID
 * @property {string} boxItemName - 礼盒物品名称
 * @property {string} boxDescription - 礼盒描述
 * @property {Array} contents - 礼盒内容列表 [{item: id, count: 1}, ...]
 */
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  boxItemId: {
    type: Number,
    default: 0
  },
  boxItemName: {
    type: String,
    default: ''
  },
  boxDescription: {
    type: String,
    default: ''
  },
  contents: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'confirm'])

const itemsStore = useItemsStore()

// 选中的选项
const selectedOption = ref(null)
// 是否已确认（防止多次点击）
const hasConfirmed = ref(false)

/**
 * 根据物品名称判断性别标签
 * @param {string} name - 物品名称
 * @returns {string} 性别标签
 */
function getGenderLabel (name) {
  if (!name) return ''
  // 检查名称中的性别标识
  if (/(♂|男|M）|\(M\)|（M）|male)/i.test(name)) return '男性套装'
  if (/(♀|女|F）|\(F\)|（F）|female)/i.test(name)) return '女性套装'
  return '套装'
}

/**
 * 性别选项列表（从 contents 动态生成）
 */
const genderOptions = computed(() => {
  if (!props.contents || props.contents.length === 0) return []

  return props.contents.map(content => {
    const itemId = Number(content.item)
    const itemConfig = itemsStore.getItemConfig(itemId)
    const itemName = itemConfig?.name?.cns || itemConfig?.name?.en || `物品ID: ${itemId}`
    const itemDesc = itemConfig?.description?.cns || itemConfig?.description?.en || ''

    return {
      id: itemId,
      name: itemName,
      description: itemDesc,
      genderLabel: getGenderLabel(itemName),
      count: content.count || 1
    }
  })
})

/**
 * 显示物品详情提示框的自定义事件
 * @param {string} action - 操作类型 ('show' | 'move' | 'hide')
 * @param {Object} item - 物品数据
 * @param {Object} position - 鼠标位置 { x, y }
 */
function dispatchTooltipEvent (action, item, position = { x: 0, y: 0 }) {
  const eventName = action === 'show' ? 'show-item-tooltip'
    : action === 'move' ? 'move-item-tooltip'
      : 'hide-item-tooltip'
  window.dispatchEvent(new CustomEvent(eventName, {
    detail: { item, position, source: 'gender-select-panel' }
  }))
}

/**
 * 选择选项
 * @param {Object} option - 选项数据
 */
function selectOption (option) {
  selectedOption.value = option
}

/**
 * 选项鼠标进入事件 - 显示物品详情面板
 * @param {MouseEvent} event - 鼠标事件
 * @param {Object} option - 选项数据
 */
function handleOptionMouseEnter (event, option) {
  const itemConfig = itemsStore.getItemConfig(option.id)
  const position = { x: event.clientX + 15, y: event.clientY + 15 }
  dispatchTooltipEvent('show', { id: option.id, ...itemConfig }, position)
}

/**
 * 选项鼠标移动事件 - 移动物品详情面板
 * @param {MouseEvent} event - 鼠标事件
 */
function handleOptionMouseMove (event) {
  const position = { x: event.clientX + 15, y: event.clientY + 15 }
  dispatchTooltipEvent('move', null, position)
}

/**
 * 选项鼠标离开事件 - 隐藏物品详情面板
 */
function handleOptionMouseLeave () {
  dispatchTooltipEvent('hide', null)
}

/**
 * 确认选择
 */
function handleConfirm () {
  if (!selectedOption.value || hasConfirmed.value) return

  hasConfirmed.value = true

  emit('confirm', {
    selectedItemId: selectedOption.value.id,
    selectedItemName: selectedOption.value.name,
    selectedCount: selectedOption.value.count
  })
}

/**
 * 取消操作
 */
function handleCancel () {
  // 隐藏物品详情提示
  dispatchTooltipEvent('hide', null)
  emit('close')
}

/**
 * 头部图标加载失败处理
 * @param {Event} event - 错误事件
 */
function handleIconError (event) {
  event.target.src = '/pt/item_icon/default.png'
}

/**
 * 选项图标加载失败处理
 * @param {Event} event - 错误事件
 */
function handleOptionIconError (event) {
  event.target.src = '/pt/item_icon/default.png'
}

// 监听显示状态重置数据
watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedOption.value = null
    hasConfirmed.value = false
  }
})
</script>

<style scoped>
.gender-select-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.gender-select-panel {
  background: linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 12px;
  min-width: 400px;
  max-width: 520px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid #3a3a5a;
  position: relative;
}

.panel-icon {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
  border-radius: 4px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffd700;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #888;
  font-size: 20px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.panel-body {
  padding: 16px 20px;
}

.panel-description {
  font-size: 13px;
  color: #aaa;
  text-align: center;
  margin-bottom: 16px;
  line-height: 1.5;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.option-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #5a5a7a;
}

.option-item.selected {
  background: rgba(255, 215, 0, 0.15);
  border-color: #ffd700;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
}

.option-icon {
  width: 56px;
  height: 56px;
  image-rendering: pixelated;
  border-radius: 6px;
}

.option-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  text-align: center;
}

.option-name {
  font-size: 13px;
  color: #fff;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.option-gender {
  font-size: 11px;
  color: #64c8ff;
  margin-top: 4px;
}

.option-item.selected .option-name {
  color: #ffd700;
}

.panel-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #3a3a5a;
}

.action-btn {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #3a3a5a;
  color: #aaa;
}

.cancel-btn:hover {
  background: #4a4a6a;
  color: #fff;
}

.confirm-btn {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  color: #1a1a2e;
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ffea00 0%, #ffbb00 100%);
  transform: translateY(-1px);
}

.confirm-btn:disabled {
  background: #4a4a6a;
  color: #666;
  cursor: not-allowed;
  transform: none;
}

/* 过渡动画 */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.2s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}

.panel-fade-enter-active .gender-select-panel,
.panel-fade-leave-active .gender-select-panel {
  transition: transform 0.2s ease;
}

.panel-fade-enter-from .gender-select-panel,
.panel-fade-leave-to .gender-select-panel {
  transform: scale(0.95);
}
</style>
